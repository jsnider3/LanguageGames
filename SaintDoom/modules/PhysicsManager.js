import * as THREE from 'three';
import { Config } from './config/index.js';

/**
 * Centralized physics system for gravity, ground detection, and physics simulation
 * Handles both flying and ground-based entities
 */
export class PhysicsManager {
    constructor(scene) {
        this.scene = scene;
        this.entities = new Set();
        this.staticBodies = new Set();
        this.gravityVector = new THREE.Vector3(0, Config.engine.PHYSICS.GRAVITY, 0);
        
        // Raycaster for ground detection
        this.raycaster = new THREE.Raycaster();
        this.raycaster.near = 0;
        this.raycaster.far = 10;
        
        // Debug visualization
        this.debugMode = false;
        this.debugHelpers = [];
    }
    
    /**
     * Register an entity with the physics system
     * @param {Object} entity - Entity with position, velocity, and physics properties
     * @param {Object} options - Physics options
     */
    registerEntity(entity, options = {}) {
        const physicsData = {
            entity: entity,
            isFlying: options.isFlying || false,
            hasGravity: options.hasGravity !== false, // Default true
            mass: options.mass || 1,
            radius: options.radius || Config.engine.PHYSICS.DEFAULT_ENEMY_RADIUS,
            height: options.height || Config.engine.PHYSICS.DEFAULT_ENEMY_HEIGHT,
            groundOffset: options.groundOffset || 0,
            isGrounded: false,
            groundNormal: new THREE.Vector3(0, 1, 0),
            lastGroundCheck: 0,
            groundCheckInterval: 100, // Check every 100ms
            terminalVelocity: options.terminalVelocity || Config.engine.PHYSICS.TERMINAL_VELOCITY,
            friction: options.friction || Config.engine.PHYSICS.FRICTION,
            airResistance: options.airResistance || Config.engine.PHYSICS.AIR_RESISTANCE,
            bounceCoefficient: options.bounceCoefficient || 0,
            previousPosition: entity.position ? entity.position.clone() : new THREE.Vector3()
        };
        
        // Ensure entity has required properties
        if (!entity.position) entity.position = new THREE.Vector3();
        if (!entity.velocity) entity.velocity = new THREE.Vector3();
        
        entity.physicsData = physicsData;
        this.entities.add(physicsData);
        
        return physicsData;
    }
    
    /**
     * Register a static body (walls, floors, etc.)
     */
    registerStaticBody(mesh, type = 'box') {
        const staticBody = {
            mesh: mesh,
            type: type,
            bounds: new THREE.Box3().setFromObject(mesh)
        };
        
        this.staticBodies.add(staticBody);
        return staticBody;
    }
    
    /**
     * Unregister an entity
     */
    unregisterEntity(entity) {
        if (entity.physicsData) {
            this.entities.delete(entity.physicsData);
            delete entity.physicsData;
        }
    }
    
    /**
     * Check if entity is on the ground
     */
    checkGroundContact(physicsData, walls = []) {
        const entity = physicsData.entity;
        if (!entity.position) return false;
        
        // Skip ground check for flying entities
        if (physicsData.isFlying) {
            physicsData.isGrounded = false;
            return false;
        }
        
        // Throttle ground checks for performance
        const now = Date.now();
        if (now - physicsData.lastGroundCheck < physicsData.groundCheckInterval) {
            return physicsData.isGrounded;
        }
        physicsData.lastGroundCheck = now;
        
        // Cast ray downward from entity feet position
        const origin = entity.position.clone();
        origin.y += 0.1; // Start slightly above feet
        
        const direction = new THREE.Vector3(0, -1, 0);
        this.raycaster.set(origin, direction);
        this.raycaster.far = 0.5; // Check below feet
        
        // Check against floors and static bodies
        const intersectObjects = [];
        
        // Add floor meshes
        this.scene.traverse(child => {
            if (child.isMesh && child.name && 
                (child.name.includes('floor') || child.name.includes('ground'))) {
                intersectObjects.push(child);
            }
        });
        
        // Add walls and level geometry (for standing on walls/floors)
        walls.forEach(wall => {
            if (wall.mesh) {
                intersectObjects.push(wall.mesh);
            } else if (wall.isMesh) {
                // Direct mesh object
                intersectObjects.push(wall);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(intersectObjects, false);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            const groundDistance = hit.distance - 0.1; // Distance from ray origin to ground
            
            // Consider grounded if within threshold
            if (groundDistance <= 0.2) {
                physicsData.isGrounded = true;
                physicsData.groundNormal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
                
                // Snap to ground to prevent sinking - force entity up if below ground
                const targetY = hit.point.y + physicsData.groundOffset;
                if (entity.position.y < targetY - 0.1) {
                    // Entity is below ground, force it up
                    entity.position.y = targetY;
                } else if (entity.position.y < targetY + 0.2) {
                    // Entity is close to ground, snap to it
                    entity.position.y = targetY;
                }
                
                if (entity.velocity && entity.velocity.y < 0) {
                    entity.velocity.y = 0; // Stop downward velocity
                }
                
                return true;
            }
        }
        
        physicsData.isGrounded = false;
        return false;
    }
    
    /**
     * Apply gravity to an entity
     */
    applyGravity(physicsData, deltaTime) {
        if (!physicsData.hasGravity || physicsData.isFlying || physicsData.isGrounded) {
            return;
        }
        
        const entity = physicsData.entity;
        if (!entity.velocity) return;
        
        // Apply gravity acceleration
        entity.velocity.y += this.gravityVector.y * deltaTime;
        
        // Apply terminal velocity
        entity.velocity.y = Math.max(entity.velocity.y, physicsData.terminalVelocity);
    }
    
    /**
     * Apply friction to ground movement
     */
    applyFriction(physicsData, deltaTime) {
        if (!physicsData.isGrounded) return;
        
        const entity = physicsData.entity;
        if (!entity.velocity) return;
        
        // Apply friction to horizontal movement only
        const horizontalVelocity = new THREE.Vector2(entity.velocity.x, entity.velocity.z);
        const speed = horizontalVelocity.length();
        
        if (speed > 0.01) {
            const frictionForce = Math.min(speed, physicsData.friction * deltaTime);
            const frictionScale = Math.max(0, 1 - frictionForce / speed);
            
            entity.velocity.x *= frictionScale;
            entity.velocity.z *= frictionScale;
        } else {
            // Stop completely if moving very slowly
            entity.velocity.x = 0;
            entity.velocity.z = 0;
        }
    }
    
    /**
     * Apply air resistance
     */
    applyAirResistance(physicsData, deltaTime) {
        if (physicsData.isGrounded) return;
        
        const entity = physicsData.entity;
        if (!entity.velocity) return;
        
        // Apply air resistance to all movement
        const resistanceScale = Math.pow(physicsData.airResistance, deltaTime);
        entity.velocity.multiplyScalar(resistanceScale);
    }
    
    /**
     * Update physics for all entities
     */
    update(deltaTime, walls = []) {
        // Cap deltaTime for stability
        const cappedDeltaTime = Math.min(deltaTime, Config.engine.COLLISION.MAX_DELTA_TIME);
        
        this.entities.forEach(physicsData => {
            const entity = physicsData.entity;
            
            // Skip dead or inactive entities
            if (entity.health !== undefined && entity.health <= 0) return;
            if (entity.active === false) return;
            
            // Store previous position for interpolation
            physicsData.previousPosition.copy(entity.position);
            
            // Check ground contact
            this.checkGroundContact(physicsData, walls);
            
            // Apply physics forces
            this.applyGravity(physicsData, cappedDeltaTime);
            this.applyFriction(physicsData, cappedDeltaTime);
            this.applyAirResistance(physicsData, cappedDeltaTime);
            
            // Update position based on velocity
            if (entity.velocity && entity.position) {
                const movement = entity.velocity.clone().multiplyScalar(cappedDeltaTime);
                entity.position.add(movement);
                
                // Aggressive ground enforcement - never let entities sink
                const minGroundY = physicsData.groundOffset;
                if (physicsData.hasGravity && !physicsData.isFlying) {
                    if (entity.position.y < minGroundY) {
                        // Force entity back to ground level
                        entity.position.y = minGroundY;
                        entity.velocity.y = Math.max(0, entity.velocity.y); // Only stop downward velocity
                        physicsData.isGrounded = true;
                    } else if (physicsData.isGrounded && entity.position.y < minGroundY + 0.1) {
                        // Keep grounded entities snapped to ground
                        entity.position.y = minGroundY;
                        entity.velocity.y = 0;
                    }
                }
            }
            
            // Update mesh position if separate from entity position
            if (entity.mesh && entity.mesh.position !== entity.position) {
                entity.mesh.position.copy(entity.position);
            }
        });
        
        // Update debug visualization
        if (this.debugMode) {
            this.updateDebugVisualization();
        }
    }
    
    /**
     * Apply an impulse force to an entity
     */
    applyImpulse(entity, force) {
        if (!entity.velocity || !entity.physicsData) return;
        
        const physicsData = entity.physicsData;
        const impulse = force.clone().divideScalar(physicsData.mass);
        entity.velocity.add(impulse);
    }
    
    /**
     * Apply explosion force to nearby entities
     */
    applyExplosionForce(center, radius, force) {
        this.entities.forEach(physicsData => {
            const entity = physicsData.entity;
            if (!entity.position || !entity.velocity) return;
            
            const distance = entity.position.distanceTo(center);
            if (distance < radius && distance > 0) {
                const direction = entity.position.clone().sub(center).normalize();
                const falloff = 1 - (distance / radius);
                const explosionForce = direction.multiplyScalar(force * falloff);
                
                this.applyImpulse(entity, explosionForce);
                
                // Lift entities off the ground
                if (physicsData.isGrounded) {
                    entity.velocity.y += force * falloff * 0.5;
                    physicsData.isGrounded = false;
                }
            }
        });
    }
    
    /**
     * Enable/disable debug visualization
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        
        if (!enabled) {
            // Clean up debug helpers
            this.debugHelpers.forEach(helper => {
                if (helper.parent) helper.parent.remove(helper);
            });
            this.debugHelpers = [];
        }
    }
    
    /**
     * Update debug visualization
     */
    updateDebugVisualization() {
        // Clear old helpers
        this.debugHelpers.forEach(helper => {
            if (helper.parent) helper.parent.remove(helper);
        });
        this.debugHelpers = [];
        
        // Create helpers for each entity
        this.entities.forEach(physicsData => {
            const entity = physicsData.entity;
            if (!entity.position) return;
            
            // Ground ray
            if (!physicsData.isFlying) {
                const origin = entity.position.clone();
                origin.y += physicsData.height * 0.5;
                
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    origin,
                    origin.clone().add(new THREE.Vector3(0, -physicsData.height, 0))
                ]);
                
                const material = new THREE.LineBasicMaterial({
                    color: physicsData.isGrounded ? 0x00ff00 : 0xff0000
                });
                
                const line = new THREE.Line(geometry, material);
                this.scene.add(line);
                this.debugHelpers.push(line);
            }
            
            // Velocity vector
            if (entity.velocity && entity.velocity.length() > 0.01) {
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    entity.position,
                    entity.position.clone().add(entity.velocity.clone().normalize().multiplyScalar(2))
                ]);
                
                const material = new THREE.LineBasicMaterial({
                    color: 0x0000ff
                });
                
                const line = new THREE.Line(geometry, material);
                this.scene.add(line);
                this.debugHelpers.push(line);
            }
        });
    }
    
    /**
     * Clear all physics entities
     */
    clear() {
        this.entities.clear();
        this.staticBodies.clear();
        
        if (this.debugMode) {
            this.debugHelpers.forEach(helper => {
                if (helper.parent) helper.parent.remove(helper);
            });
            this.debugHelpers = [];
        }
    }
    
    /**
     * Get physics statistics
     */
    getStats() {
        let grounded = 0;
        let airborne = 0;
        let flying = 0;
        
        this.entities.forEach(physicsData => {
            if (physicsData.isFlying) {
                flying++;
            } else if (physicsData.isGrounded) {
                grounded++;
            } else {
                airborne++;
            }
        });
        
        return {
            totalEntities: this.entities.size,
            staticBodies: this.staticBodies.size,
            grounded: grounded,
            airborne: airborne,
            flying: flying
        };
    }
}

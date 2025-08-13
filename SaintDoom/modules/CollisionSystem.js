import * as THREE from 'three';
import { Config } from './config/index.js';
// CollisionSystem Module
// Handles collision detection between players, enemies, walls, and pickups

export class CollisionSystem {
    constructor() {
        this.margin = Config.engine.PHYSICS.PLAYER_RADIUS;
    }
    
    checkPlayerWallCollisions(player, walls, deltaTime, level, enemies) {
        
        // Cap deltaTime to prevent large jumps during lag spikes
        // Maximum of 50ms (20 FPS minimum) to prevent teleportation
        const cappedDeltaTime = Math.min(deltaTime, 0.05);
        
        // Calculate the intended movement step with capped deltaTime
        const velocityStep = player.velocity.clone().multiplyScalar(cappedDeltaTime);
        
        // Store original position for rollback if needed
        const originalPosition = player.position.clone();
        
        // Debug: Log if we're about to process a large position difference
        if (Math.abs(player.position.x - 10) < 0.1 && Math.abs(player.position.z + 20) < 0.1) {
            console.log('[CollisionSystem] Processing player at expected corridor position x=10');
            console.log('  Velocity:', player.velocity.x, player.velocity.y, player.velocity.z);
            console.log('  Walls count:', walls.length);
        }
        
        // For large movements, use continuous collision detection
        const moveDistance = velocityStep.length();
        const maxStepSize = this.margin * 0.5; // Half the collision margin for safety
        
        if (moveDistance > maxStepSize) {
            // Subdivide movement into smaller steps for continuous collision detection
            const numSteps = Math.ceil(moveDistance / maxStepSize);
            const stepVector = velocityStep.clone().divideScalar(numSteps);
            
            for (let i = 0; i < numSteps; i++) {
                const testPos = player.position.clone();
                testPos.add(stepVector);
                
                // Check collision for this step
                if (!this.checkWallCollision(testPos, walls, this.margin) && 
                    !this.checkEnemyCollision(testPos, enemies, player.radius)) {
                    player.position.copy(testPos);
                } else {
                    // Hit a wall, stop movement in this direction
                    player.velocity.multiplyScalar(0);
                    break;
                }
            }
        } else {
            // Small movement - use the original separate axis approach
            // Try X movement first
            const testPosX = player.position.clone();
            testPosX.x += velocityStep.x;
            
            const canMoveX = !this.checkWallCollision(testPosX, walls, this.margin) && 
                            !this.checkEnemyCollision(testPosX, enemies, player.radius);
            
            if (canMoveX) {
                player.position.x = testPosX.x;
            } else {
                player.velocity.x = 0; // Stop X velocity
            }
            
            // Try Z movement from the current (possibly updated) X position
            const testPosZ = player.position.clone();
            testPosZ.z += velocityStep.z;
            
            const canMoveZ = !this.checkWallCollision(testPosZ, walls, this.margin) &&
                            !this.checkEnemyCollision(testPosZ, enemies, player.radius);
            
            if (canMoveZ) {
                player.position.z = testPosZ.z;
            } else {
                player.velocity.z = 0; // Stop Z velocity
            }
        }
        
        // Final position validation - if somehow we're still in a wall, rollback
        const finalCollisionCheck = this.checkWallCollision(player.position, walls, this.margin);
        if (finalCollisionCheck) {
            console.log('[CollisionSystem] Player in wall! Current pos:', player.position.x, player.position.y, player.position.z);
            console.log('[CollisionSystem] Original pos:', originalPosition.x, originalPosition.y, originalPosition.z);
            console.log('[CollisionSystem] Wall count:', walls.length);
            
            // Try to push player out of wall
            const pushDirection = player.position.clone().sub(originalPosition).normalize();
            let pushed = false;
            
            // Try pushing back along movement direction
            for (let dist = 0.1; dist <= 1.0; dist += 0.1) {
                const testPos = player.position.clone().sub(pushDirection.clone().multiplyScalar(dist));
                if (!this.checkWallCollision(testPos, walls, this.margin)) {
                    player.position.copy(testPos);
                    pushed = true;
                    console.log('[CollisionSystem] Pushed player to:', testPos.x, testPos.y, testPos.z);
                    break;
                }
            }
            
            // If still stuck, return to original position
            if (!pushed) {
                console.log('[CollisionSystem] Could not push out, rolling back to original position');
                player.position.copy(originalPosition);
            }
            
            // Clear velocity to prevent further penetration
            player.velocity.multiplyScalar(0);
        }
        
        // Removed hardcoded level bounds - let actual walls handle boundaries
        // These hardcoded bounds were causing invisible barriers and bugs
    }
    
    checkWallCollision(pos, walls, margin) {
        if (!walls || !Array.isArray(walls)) return false;
        
        for (let wall of walls) {
            // Skip invalid walls
            if (!wall || !wall.min || !wall.max) continue;
            
            if (this.pointIntersectsBox(pos, wall.min, wall.max, margin)) {
                return true;
            }
        }
        return false;
    }
    
    pointIntersectsBox(point, boxMin, boxMax, margin) {
        // Validate inputs
        if (!point || !boxMin || !boxMax) return false;
        if (typeof point.x === 'undefined' || typeof boxMin.x === 'undefined' || typeof boxMax.x === 'undefined') return false;
        
        return point.x + margin > boxMin.x && point.x - margin < boxMax.x &&
               point.y + margin > boxMin.y && point.y - margin < boxMax.y &&
               point.z + margin > boxMin.z && point.z - margin < boxMax.z;
    }
    
    checkEnemyCollision(pos, enemies, playerRadius) {
        // Validate inputs
        if (!pos || !enemies || !Array.isArray(enemies)) {
            return false;
        }
        
        for (let enemy of enemies) {
            // Skip invalid enemies
            if (!enemy || !enemy.position) continue;
            
            // Skip dead enemies
            if (enemy.health <= 0) continue;
            
            // Check if position would collide with enemy
            const distance = pos.distanceTo(enemy.position);
            const collisionDistance = (enemy.radius || PHYSICS.DEFAULT_ENEMY_RADIUS) + playerRadius;
            
            if (distance < collisionDistance) {
                return true;
            }
        }
        return false;
    }
    
    checkEnemyWallCollisions(enemy, walls, deltaTime, level) {
        // Validate enemy has required properties
        if (!enemy || !enemy.velocity || !enemy.position) {
            return;
        }
        
        // Calculate movement step
        const velocityStep = enemy.velocity.clone().multiplyScalar(deltaTime);
        const nextPos = enemy.position.clone().add(velocityStep);
        
        // Check if next position would collide
        const collision = this.checkWallCollision(nextPos, walls, enemy.radius || Config.engine.PHYSICS.DEFAULT_ENEMY_RADIUS);
        
        if (collision) {
            // Try sliding along walls
            const slideX = enemy.position.clone();
            slideX.x += velocityStep.x;
            
            const slideZ = enemy.position.clone();
            slideZ.z += velocityStep.z;
            
            if (!this.checkWallCollision(slideX, walls, enemy.radius + 0.1)) {
                // Can move along X axis
                enemy.position.x = slideX.x;
                enemy.velocity.z = 0;
            } else if (!this.checkWallCollision(slideZ, walls, enemy.radius + 0.1)) {
                // Can move along Z axis
                enemy.position.z = slideZ.z;
                enemy.velocity.x = 0;
            } else {
                // Stuck, stop movement and add random turn
                enemy.velocity.set(0, 0, 0);
                
                // Add random direction change to help escape corners
                if (Math.random() < Config.engine.ENEMY_AI.IDLE_TURN_CHANCE * 15) {
                    const angle = Math.random() * Math.PI * 2;
                    enemy.velocity.x = Math.cos(angle) * enemy.moveSpeed * 0.5;
                    enemy.velocity.z = Math.sin(angle) * enemy.moveSpeed * 0.5;
                }
            }
        } else {
            // No collision, apply movement
            enemy.position.copy(nextPos);
        }
        
        // Removed hardcoded enemy bounds - let actual walls contain enemies
        // The wall collision detection above already prevents enemies from going through walls
    }
    
    checkEnemyPlayerCollisions(enemies, player) {
        enemies.forEach(enemy => {
            // Skip dead enemies
            if (enemy.health <= 0) return;
            
            const distance = enemy.position.distanceTo(player.position);
            const collisionDistance = enemy.radius + player.radius;
            
            if (distance < collisionDistance) {
                const pushDirection = new THREE.Vector3()
                    .subVectors(enemy.position, player.position)
                    .normalize();
                
                const overlap = collisionDistance - distance;
                
                // Push both enemy and player apart (50/50 split)
                const halfOverlap = overlap * 0.5;
                enemy.position.add(pushDirection.clone().multiplyScalar(halfOverlap));
                player.position.sub(pushDirection.clone().multiplyScalar(halfOverlap));
            }
        });
    }
}

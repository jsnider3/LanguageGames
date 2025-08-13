import * as THREE from 'three';
import { SHADOWS } from './Constants.js';

/**
 * Shadow optimization system to improve performance
 * Limits shadow-casting lights and optimizes shadow quality
 */
export class ShadowOptimizer {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;
        this.shadowCasters = [];
        this.dynamicShadowObjects = new Set();
        
        // Configure renderer for optimized shadows
        this.setupRenderer();
    }
    
    /**
     * Configure renderer shadow settings
     */
    setupRenderer() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer but more expensive
        this.renderer.shadowMap.autoUpdate = false; // Manual control for optimization
        
        // Set shadow map size
        this.renderer.shadowMapSize = new THREE.Vector2(
            SHADOWS.SHADOW_MAP_SIZE,
            SHADOWS.SHADOW_MAP_SIZE
        );
    }
    
    /**
     * Register a light as a shadow caster
     * Only the first MAX_SHADOW_CASTERS lights will cast shadows
     */
    registerShadowLight(light, priority = 0) {
        if (!light.castShadow) {
            light.castShadow = false; // Ensure it's off by default
        }
        
        const shadowData = {
            light: light,
            priority: priority,
            enabled: false
        };
        
        this.shadowCasters.push(shadowData);
        this.updateShadowCasters();
        
        // Configure shadow camera for the light
        if (light.shadow) {
            light.shadow.mapSize.width = SHADOWS.SHADOW_MAP_SIZE;
            light.shadow.mapSize.height = SHADOWS.SHADOW_MAP_SIZE;
            light.shadow.camera.near = SHADOWS.SHADOW_CAMERA_NEAR;
            light.shadow.camera.far = SHADOWS.SHADOW_CAMERA_FAR;
            light.shadow.bias = SHADOWS.SHADOW_BIAS;
            light.shadow.normalBias = SHADOWS.SHADOW_NORMAL_BIAS;
            
            // Optimize shadow camera frustum for point lights
            if (light.isPointLight) {
                light.shadow.camera.near = 0.1;
                light.shadow.camera.far = 25;
            }
            
            // Optimize shadow camera frustum for directional lights
            if (light.isDirectionalLight) {
                const shadowCamera = light.shadow.camera;
                shadowCamera.left = -30;
                shadowCamera.right = 30;
                shadowCamera.top = 30;
                shadowCamera.bottom = -30;
            }
        }
    }
    
    /**
     * Update which lights should cast shadows based on priority
     */
    updateShadowCasters() {
        // Sort by priority (higher priority first)
        this.shadowCasters.sort((a, b) => b.priority - a.priority);
        
        // Enable shadows only for top lights
        this.shadowCasters.forEach((shadowData, index) => {
            const shouldCast = index < SHADOWS.MAX_SHADOW_CASTERS;
            
            if (shadowData.light.castShadow !== shouldCast) {
                shadowData.light.castShadow = shouldCast;
                shadowData.enabled = shouldCast;
                this.renderer.shadowMap.needsUpdate = true;
            }
        });
    }
    
    /**
     * Register an object that should cast shadows
     */
    registerShadowCaster(object, dynamic = false) {
        if (object.isMesh) {
            object.castShadow = true;
            
            if (dynamic) {
                this.dynamicShadowObjects.add(object);
            }
        } else if (object.isGroup) {
            // Recursively set shadows for group children
            object.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    if (dynamic) {
                        this.dynamicShadowObjects.add(child);
                    }
                }
            });
        }
    }
    
    /**
     * Register an object that should receive shadows
     */
    registerShadowReceiver(object) {
        if (object.isMesh) {
            object.receiveShadow = true;
        } else if (object.isGroup) {
            object.traverse(child => {
                if (child.isMesh) {
                    child.receiveShadow = true;
                }
            });
        }
    }
    
    /**
     * Optimize shadows for a level
     * Call this after level creation
     */
    optimizeLevel(walls, floors, enemies) {
        // Floors always receive shadows
        floors.forEach(floor => {
            if (floor && floor.isMesh) {
                floor.receiveShadow = true;
                floor.castShadow = false; // Floors don't cast shadows
            }
        });
        
        // Walls selectively cast/receive shadows based on size
        walls.forEach(wall => {
            if (wall && wall.mesh) {
                const mesh = wall.mesh;
                const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
                const volume = size.x * size.y * size.z;
                
                // Only large walls cast shadows
                mesh.castShadow = volume > 10;
                mesh.receiveShadow = true;
            }
        });
        
        // Enemies cast shadows but with reduced quality
        enemies.forEach(enemy => {
            if (enemy && enemy.mesh) {
                this.registerShadowCaster(enemy.mesh, true);
                enemy.mesh.receiveShadow = false; // Enemies don't receive shadows for performance
            }
        });
    }
    
    /**
     * Update shadow map (call sparingly)
     */
    updateShadows() {
        this.renderer.shadowMap.needsUpdate = true;
    }
    
    /**
     * Set shadow quality level
     */
    setShadowQuality(quality) {
        switch(quality) {
            case 'low':
                this.renderer.shadowMap.type = THREE.BasicShadowMap;
                this.setShadowMapSize(512);
                break;
            case 'medium':
                this.renderer.shadowMap.type = THREE.PCFShadowMap;
                this.setShadowMapSize(1024);
                break;
            case 'high':
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                this.setShadowMapSize(2048);
                break;
            case 'ultra':
                this.renderer.shadowMap.type = THREE.VSMShadowMap;
                this.setShadowMapSize(4096);
                break;
        }
        
        this.updateShadows();
    }
    
    /**
     * Set shadow map size for all lights
     */
    setShadowMapSize(size) {
        this.shadowCasters.forEach(shadowData => {
            if (shadowData.light.shadow) {
                shadowData.light.shadow.mapSize.width = size;
                shadowData.light.shadow.mapSize.height = size;
            }
        });
    }
    
    /**
     * Enable/disable shadows globally
     */
    setShadowsEnabled(enabled) {
        this.renderer.shadowMap.enabled = enabled;
        
        if (!enabled) {
            // Disable all shadow casting
            this.shadowCasters.forEach(shadowData => {
                shadowData.light.castShadow = false;
            });
        } else {
            // Re-enable based on priority
            this.updateShadowCasters();
        }
    }
    
    /**
     * Dynamically adjust shadow distance based on performance
     */
    adjustShadowDistance(camera, targetFPS = 60, currentFPS = 60) {
        const performanceRatio = currentFPS / targetFPS;
        
        if (performanceRatio < 0.8) {
            // Reduce shadow distance if performance is poor
            this.shadowCasters.forEach(shadowData => {
                if (shadowData.light.shadow && shadowData.light.isPointLight) {
                    shadowData.light.shadow.camera.far *= 0.9;
                }
            });
        } else if (performanceRatio > 1.1) {
            // Increase shadow distance if performance is good
            this.shadowCasters.forEach(shadowData => {
                if (shadowData.light.shadow && shadowData.light.isPointLight) {
                    shadowData.light.shadow.camera.far = Math.min(
                        shadowData.light.shadow.camera.far * 1.1,
                        SHADOWS.SHADOW_CAMERA_FAR
                    );
                }
            });
        }
    }
    
    /**
     * Update dynamic shadows (call each frame)
     */
    update(camera, deltaTime) {
        // Only update shadows for dynamic objects that moved
        let needsUpdate = false;
        
        this.dynamicShadowObjects.forEach(object => {
            if (object.userData.lastShadowPosition) {
                const moved = object.position.distanceTo(object.userData.lastShadowPosition) > 0.1;
                if (moved) {
                    needsUpdate = true;
                    object.userData.lastShadowPosition = object.position.clone();
                }
            } else {
                object.userData.lastShadowPosition = object.position.clone();
            }
        });
        
        if (needsUpdate) {
            this.renderer.shadowMap.needsUpdate = true;
        }
    }
    
    /**
     * Clear all shadow casters
     */
    clear() {
        this.shadowCasters = [];
        this.dynamicShadowObjects.clear();
    }
    
    /**
     * Get shadow statistics
     */
    getStats() {
        return {
            totalLights: this.shadowCasters.length,
            activeShadowCasters: this.shadowCasters.filter(s => s.enabled).length,
            dynamicObjects: this.dynamicShadowObjects.size,
            shadowMapSize: this.shadowCasters[0]?.light.shadow?.mapSize.width || 0
        };
    }
}
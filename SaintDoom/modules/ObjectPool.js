import * as THREE from 'three';

/**
 * Generic object pooling system for performance optimization
 * Reduces garbage collection by reusing objects instead of creating/destroying
 */
export class ObjectPool {
    constructor(createFunc, resetFunc, initialSize = 10, maxSize = 100) {
        this.createFunc = createFunc;
        this.resetFunc = resetFunc;
        this.maxSize = maxSize;
        
        this.available = [];
        this.active = new Set();
        
        // Pre-allocate initial pool
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createFunc());
        }
    }
    
    /**
     * Get an object from the pool
     * @returns {Object} A pooled object ready for use
     */
    acquire() {
        let obj;
        
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else if (this.active.size < this.maxSize) {
            obj = this.createFunc();
        } else {
            // Pool is at max capacity, forcibly recycle oldest active object
            obj = this.active.values().next().value;
            this.active.delete(obj);
            this.resetFunc(obj);
        }
        
        this.active.add(obj);
        return obj;
    }
    
    /**
     * Return an object to the pool
     * @param {Object} obj - The object to return
     */
    release(obj) {
        if (!this.active.has(obj)) {
            console.warn('Attempting to release object not from this pool');
            return;
        }
        
        this.active.delete(obj);
        this.resetFunc(obj);
        this.available.push(obj);
    }
    
    /**
     * Release all active objects back to the pool
     */
    releaseAll() {
        this.active.forEach(obj => {
            this.resetFunc(obj);
            this.available.push(obj);
        });
        this.active.clear();
    }
    
    /**
     * Clear the entire pool
     */
    clear() {
        this.available = [];
        this.active.clear();
    }
    
    /**
     * Get pool statistics
     */
    getStats() {
        return {
            available: this.available.length,
            active: this.active.size,
            total: this.available.length + this.active.size,
            maxSize: this.maxSize
        };
    }
}

/**
 * Specialized pool for THREE.js bullets
 */
export class BulletPool extends ObjectPool {
    constructor(scene, initialSize = 50, maxSize = 200) {
        const createBullet = () => {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffff00
                // Note: MeshBasicMaterial doesn't support emissive
            });
            const bullet = new THREE.Mesh(geometry, material);
            bullet.visible = false;
            bullet.userData = {
                velocity: new THREE.Vector3(),
                damage: 0,
                lifeTime: 0,
                maxLifeTime: 3,
                owner: null,
                active: false
            };
            scene.add(bullet);
            return bullet;
        };
        
        const resetBullet = (bullet) => {
            bullet.visible = false;
            bullet.position.set(0, -1000, 0); // Move off-screen
            bullet.userData.velocity.set(0, 0, 0);
            bullet.userData.damage = 0;
            bullet.userData.lifeTime = 0;
            bullet.userData.owner = null;
            bullet.userData.active = false;
        };
        
        super(createBullet, resetBullet, initialSize, maxSize);
        this.scene = scene;
    }
    
    /**
     * Fire a bullet with specific parameters
     */
    fire(position, direction, speed, damage, owner) {
        const bullet = this.acquire();
        
        bullet.position.copy(position);
        bullet.userData.velocity.copy(direction).multiplyScalar(speed);
        bullet.userData.damage = damage;
        bullet.userData.lifeTime = 0;
        bullet.userData.owner = owner;
        bullet.userData.active = true;
        bullet.visible = true;
        
        return bullet;
    }
    
    /**
     * Update all active bullets
     */
    update(deltaTime) {
        const bulletsToRelease = [];
        
        this.active.forEach(bullet => {
            if (!bullet.userData.active) return;
            
            // Update position
            const movement = bullet.userData.velocity.clone().multiplyScalar(deltaTime);
            bullet.position.add(movement);
            
            // Update lifetime
            bullet.userData.lifeTime += deltaTime;
            
            // Check if bullet should be released
            if (bullet.userData.lifeTime >= bullet.userData.maxLifeTime) {
                bulletsToRelease.push(bullet);
            }
        });
        
        // Release expired bullets
        bulletsToRelease.forEach(bullet => this.release(bullet));
    }
}

/**
 * Specialized pool for particle effects
 */
export class ParticlePool extends ObjectPool {
    constructor(scene, initialSize = 100, maxSize = 500) {
        const createParticle = () => {
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;
            particle.userData = {
                velocity: new THREE.Vector3(),
                gravity: -9.8,
                lifeTime: 0,
                maxLifeTime: 1,
                fadeRate: 1,
                active: false,
                startOpacity: 1,
                startScale: 1
            };
            scene.add(particle);
            return particle;
        };
        
        const resetParticle = (particle) => {
            particle.visible = false;
            particle.position.set(0, -1000, 0);
            particle.userData.velocity.set(0, 0, 0);
            particle.userData.lifeTime = 0;
            particle.userData.active = false;
            particle.material.opacity = 1;
            particle.scale.set(1, 1, 1);
            particle.rotation.set(0, 0, 0);
        };
        
        super(createParticle, resetParticle, initialSize, maxSize);
        this.scene = scene;
    }
    
    /**
     * Spawn a particle effect
     */
    spawn(position, velocity, color = 0xffffff, lifeTime = 1, gravity = true) {
        const particle = this.acquire();
        
        particle.position.copy(position);
        particle.userData.velocity.copy(velocity);
        particle.userData.lifeTime = 0;
        particle.userData.maxLifeTime = lifeTime;
        particle.userData.gravity = gravity ? -9.8 : 0;
        particle.userData.active = true;
        particle.userData.startOpacity = particle.material.opacity;
        particle.userData.startScale = particle.scale.x;
        particle.material.color.setHex(color);
        particle.visible = true;
        
        return particle;
    }
    
    /**
     * Create a burst of particles
     */
    burst(position, count = 10, color = 0xffffff, speed = 5) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
                Math.random() * speed * 2,
                Math.sin(angle) * speed + (Math.random() - 0.5) * 2
            );
            
            particles.push(this.spawn(position, velocity, color, 0.5 + Math.random() * 0.5));
        }
        
        return particles;
    }
    
    /**
     * Update all active particles
     */
    update(deltaTime) {
        const particlesToRelease = [];
        
        this.active.forEach(particle => {
            if (!particle.userData.active) return;
            
            // Apply physics
            particle.userData.velocity.y += particle.userData.gravity * deltaTime;
            const movement = particle.userData.velocity.clone().multiplyScalar(deltaTime);
            particle.position.add(movement);
            
            // Update lifetime
            particle.userData.lifeTime += deltaTime;
            const lifeRatio = particle.userData.lifeTime / particle.userData.maxLifeTime;
            
            // Fade out
            particle.material.opacity = particle.userData.startOpacity * (1 - lifeRatio);
            
            // Scale down
            const scale = particle.userData.startScale * (1 - lifeRatio * 0.5);
            particle.scale.set(scale, scale, scale);
            
            // Rotate for visual interest
            particle.rotation.x += deltaTime * 2;
            particle.rotation.y += deltaTime * 3;
            
            // Check if particle should be released
            if (particle.userData.lifeTime >= particle.userData.maxLifeTime) {
                particlesToRelease.push(particle);
            }
        });
        
        // Release expired particles
        particlesToRelease.forEach(particle => this.release(particle));
    }
}

/**
 * Pool manager to handle all object pools
 */
export class PoolManager {
    constructor(scene) {
        this.scene = scene;
        this.pools = new Map();
        
        // Initialize default pools
        this.pools.set('bullets', new BulletPool(scene));
        this.pools.set('particles', new ParticlePool(scene));
    }
    
    /**
     * Register a new pool
     */
    registerPool(name, pool) {
        this.pools.set(name, pool);
    }
    
    /**
     * Get a specific pool
     */
    getPool(name) {
        return this.pools.get(name);
    }
    
    /**
     * Update all pools
     */
    update(deltaTime) {
        this.pools.forEach(pool => {
            if (pool.update) {
                pool.update(deltaTime);
            }
        });
    }
    
    /**
     * Clear all pools
     */
    clearAll() {
        this.pools.forEach(pool => pool.clear());
    }
    
    /**
     * Get statistics for all pools
     */
    getAllStats() {
        const stats = {};
        this.pools.forEach((pool, name) => {
            stats[name] = pool.getStats();
        });
        return stats;
    }
}
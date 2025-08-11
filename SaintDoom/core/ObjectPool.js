export class ObjectPool {
    constructor(createFn, resetFn, maxSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        this.available = [];
        this.inUse = new Set();
        this.totalCreated = 0;
    }

    acquire() {
        let obj;
        
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else if (this.totalCreated < this.maxSize) {
            obj = this.createFn();
            this.totalCreated++;
        } else {
            // Pool exhausted, return null or oldest in-use object
            console.warn('Object pool exhausted');
            return null;
        }
        
        this.inUse.add(obj);
        if (this.resetFn) {
            this.resetFn(obj);
        }
        
        return obj;
    }

    release(obj) {
        if (!this.inUse.has(obj)) {
            console.warn('Attempting to release object not in pool');
            return;
        }
        
        this.inUse.delete(obj);
        this.available.push(obj);
    }

    releaseAll() {
        this.inUse.forEach(obj => {
            this.available.push(obj);
        });
        this.inUse.clear();
    }

    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            totalCreated: this.totalCreated,
            maxSize: this.maxSize
        };
    }

    clear() {
        this.available = [];
        this.inUse.clear();
        this.totalCreated = 0;
    }
}

export class ProjectilePool extends ObjectPool {
    constructor(scene, maxSize = 200) {
        const createFn = () => {
            const geometry = new THREE.SphereGeometry(0.1, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            scene.add(mesh);
            
            return {
                mesh: mesh,
                velocity: new THREE.Vector3(),
                damage: 0,
                lifetime: 0,
                birthTime: 0,
                active: false,
                owner: null,
                update: null
            };
        };
        
        const resetFn = (projectile) => {
            projectile.mesh.visible = true;
            projectile.mesh.position.set(0, 0, 0);
            projectile.mesh.scale.set(1, 1, 1);
            projectile.velocity.set(0, 0, 0);
            projectile.damage = 0;
            projectile.lifetime = 5000;
            projectile.birthTime = Date.now();
            projectile.active = true;
            projectile.owner = null;
            projectile.update = null;
        };
        
        super(createFn, resetFn, maxSize);
        this.scene = scene;
    }

    fire(config) {
        const projectile = this.acquire();
        if (!projectile) return null;
        
        projectile.mesh.position.copy(config.position);
        projectile.velocity.copy(config.direction).normalize().multiplyScalar(config.speed || 20);
        projectile.damage = config.damage || 25;
        projectile.lifetime = config.lifetime || 5000;
        projectile.birthTime = Date.now();
        projectile.owner = config.owner;
        
        if (config.color) {
            projectile.mesh.material.color.setHex(config.color);
            projectile.mesh.material.emissive.setHex(config.color);
        }
        
        if (config.size) {
            projectile.mesh.scale.setScalar(config.size / 0.1);
        }
        
        return projectile;
    }

    updateAll(deltaTime, targets = []) {
        const toRelease = [];
        
        this.inUse.forEach(projectile => {
            if (!projectile.active) {
                toRelease.push(projectile);
                return;
            }
            
            // Check lifetime
            if (Date.now() - projectile.birthTime > projectile.lifetime) {
                projectile.active = false;
                toRelease.push(projectile);
                return;
            }
            
            // Update position
            const movement = projectile.velocity.clone().multiplyScalar(deltaTime / 1000);
            projectile.mesh.position.add(movement);
            
            // Check collisions
            for (const target of targets) {
                if (target === projectile.owner) continue;
                
                const targetPos = target.position || target.mesh?.position;
                if (!targetPos) continue;
                
                const distance = projectile.mesh.position.distanceTo(targetPos);
                if (distance < (target.hitRadius || 1)) {
                    // Hit!
                    if (target.takeDamage) {
                        target.takeDamage(projectile.damage);
                    }
                    
                    projectile.active = false;
                    toRelease.push(projectile);
                    break;
                }
            }
            
            // Custom update function
            if (projectile.update) {
                projectile.update(projectile, deltaTime);
            }
            
            // Check bounds
            if (Math.abs(projectile.mesh.position.y) > 100 ||
                projectile.mesh.position.length() > 200) {
                projectile.active = false;
                toRelease.push(projectile);
            }
        });
        
        // Release inactive projectiles
        toRelease.forEach(projectile => {
            projectile.mesh.visible = false;
            this.release(projectile);
        });
    }
}

export class ParticlePool extends ObjectPool {
    constructor(scene, maxSize = 500) {
        const createFn = () => {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            scene.add(mesh);
            
            return {
                mesh: mesh,
                velocity: new THREE.Vector3(),
                lifetime: 0,
                birthTime: 0,
                active: false,
                gravity: false,
                fadeOut: false,
                scale: 1,
                update: null
            };
        };
        
        const resetFn = (particle) => {
            particle.mesh.visible = true;
            particle.mesh.position.set(0, 0, 0);
            particle.mesh.scale.set(1, 1, 1);
            particle.mesh.material.opacity = 1;
            particle.velocity.set(0, 0, 0);
            particle.lifetime = 1000;
            particle.birthTime = Date.now();
            particle.active = true;
            particle.gravity = false;
            particle.fadeOut = true;
            particle.scale = 1;
            particle.update = null;
        };
        
        super(createFn, resetFn, maxSize);
        this.scene = scene;
    }

    emit(position, config = {}) {
        const defaults = {
            count: 10,
            color: 0xffffff,
            speed: 5,
            lifetime: 1000,
            gravity: true,
            fadeOut: true,
            scale: 1,
            spread: 1
        };
        
        const settings = { ...defaults, ...config };
        const particles = [];
        
        for (let i = 0; i < settings.count; i++) {
            const particle = this.acquire();
            if (!particle) break;
            
            particle.mesh.position.copy(position);
            particle.mesh.material.color.setHex(settings.color);
            particle.mesh.scale.setScalar(settings.scale);
            
            particle.velocity.set(
                (Math.random() - 0.5) * settings.spread,
                Math.random() * settings.speed,
                (Math.random() - 0.5) * settings.spread
            ).normalize().multiplyScalar(settings.speed);
            
            particle.lifetime = settings.lifetime;
            particle.birthTime = Date.now();
            particle.gravity = settings.gravity;
            particle.fadeOut = settings.fadeOut;
            particle.scale = settings.scale;
            
            particles.push(particle);
        }
        
        return particles;
    }

    updateAll(deltaTime) {
        const toRelease = [];
        
        this.inUse.forEach(particle => {
            if (!particle.active) {
                toRelease.push(particle);
                return;
            }
            
            const age = Date.now() - particle.birthTime;
            const progress = age / particle.lifetime;
            
            if (progress >= 1) {
                particle.active = false;
                toRelease.push(particle);
                return;
            }
            
            // Update position
            const movement = particle.velocity.clone().multiplyScalar(deltaTime / 1000);
            particle.mesh.position.add(movement);
            
            // Apply gravity
            if (particle.gravity) {
                particle.velocity.y -= 9.8 * deltaTime / 1000;
            }
            
            // Fade out
            if (particle.fadeOut) {
                particle.mesh.material.opacity = 1 - progress;
            }
            
            // Scale
            particle.mesh.scale.setScalar(particle.scale * (1 - progress * 0.5));
            
            // Custom update
            if (particle.update) {
                particle.update(particle, deltaTime);
            }
        });
        
        // Release inactive particles
        toRelease.forEach(particle => {
            particle.mesh.visible = false;
            this.release(particle);
        });
    }
}

export class EnemyPool extends ObjectPool {
    constructor(scene, enemyClass, maxSize = 50) {
        const createFn = () => {
            const enemy = new enemyClass(scene, new THREE.Vector3());
            enemy.pooled = true;
            return enemy;
        };
        
        const resetFn = (enemy) => {
            enemy.health = enemy.maxHealth;
            enemy.position.set(0, 0, 0);
            enemy.velocity.set(0, 0, 0);
            enemy.state = 'idle';
            enemy.target = null;
            enemy.lastAttackTime = 0;
            enemy.statusEffects.clear();
            
            if (enemy.mesh) {
                enemy.mesh.visible = true;
                enemy.mesh.position.set(0, 0, 0);
            }
        };
        
        super(createFn, resetFn, maxSize);
        this.scene = scene;
        this.enemyClass = enemyClass;
    }

    spawn(position, config = {}) {
        const enemy = this.acquire();
        if (!enemy) return null;
        
        enemy.position.copy(position);
        if (enemy.mesh) {
            enemy.mesh.position.copy(position);
        }
        
        // Apply config
        Object.keys(config).forEach(key => {
            if (enemy.hasOwnProperty(key)) {
                enemy[key] = config[key];
            }
        });
        
        return enemy;
    }

    despawn(enemy) {
        if (!enemy.pooled) {
            console.warn('Attempting to despawn non-pooled enemy');
            return;
        }
        
        if (enemy.mesh) {
            enemy.mesh.visible = false;
        }
        
        this.release(enemy);
    }

    updateAll(deltaTime, player) {
        const toDespawn = [];
        
        this.inUse.forEach(enemy => {
            if (enemy.health <= 0) {
                toDespawn.push(enemy);
                return;
            }
            
            if (enemy.update) {
                enemy.update(deltaTime, player);
            }
        });
        
        toDespawn.forEach(enemy => {
            this.despawn(enemy);
        });
    }
}
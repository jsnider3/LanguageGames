// Brimstone Golem Enemy Type
// High health tank with area damage on death

import { Enemy } from '../enemy.js';

export class BrimstoneGolem extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Override stats - tanky enemy
        this.health = 150;
        this.maxHealth = 150;
        this.moveSpeed = 1.5; // Very slow
        this.damage = 30;
        this.attackRange = 3;
        this.sightRange = 20;
        this.type = 'brimstone_golem';
        
        // Large size
        this.radius = 0.8;
        this.height = 2.5;
        
        // Special abilities
        this.slamCooldown = 4000;
        this.lastSlamTime = 0;
        this.slamRadius = 8;
        this.slamDamage = 40;
        
        // Lava trail
        this.lavaTrailEnabled = true;
        this.lavaTrails = [];
        this.lastTrailTime = 0;
        this.trailInterval = 200; // milliseconds
        
        // Death explosion
        this.deathExplosionRadius = 10;
        this.deathExplosionDamage = 60;
        
        // Cooling vents (weak points)
        this.vents = [];
        this.ventsClosed = false;
        
        // Override mesh
        this.scene.remove(this.mesh);
        this.createGolemMesh();
        
        // Core temperature (visual effect)
        this.coreTemperature = 1.0;
    }
    
    createGolemMesh() {
        const group = new THREE.Group();
        
        // Main body - rocky texture with lava cracks
        const bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1.2);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: 0x441100,
            emissiveIntensity: 0.3,
            roughness: 0.9
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 1;
        group.add(this.bodyMesh);
        
        // Lava cracks on body
        this.createLavaCracks(this.bodyMesh);
        
        // Head - smaller rock
        const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.6);
        this.headMesh = new THREE.Mesh(headGeometry, bodyMaterial);
        this.headMesh.position.set(0, 2.2, 0);
        group.add(this.headMesh);
        
        // Glowing core (visible through cracks)
        const coreGeometry = new THREE.SphereGeometry(0.4, 8, 6);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 2
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.core.position.y = 1;
        group.add(this.core);
        
        // Arms - massive stone clubs
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 6);
        
        this.leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        this.leftArm.position.set(-0.9, 1, 0);
        this.leftArm.rotation.z = 0.3;
        group.add(this.leftArm);
        
        this.rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        this.rightArm.position.set(0.9, 1, 0);
        this.rightArm.rotation.z = -0.3;
        group.add(this.rightArm);
        
        // Legs - thick pillars
        const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 6);
        
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.4, 0.5, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.4, 0.5, 0);
        group.add(rightLeg);
        
        // Cooling vents on back (weak points)
        this.createCoolingVents(group);
        
        // Lava drip particles
        this.createLavaDrips(group);
        
        // Add glow light
        const glowLight = new THREE.PointLight(0xff3300, 0.5, 5);
        glowLight.position.y = 1;
        group.add(glowLight);
        this.glowLight = glowLight;
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Shadows
        this.bodyMesh.castShadow = true;
        this.headMesh.castShadow = true;
    }
    
    createLavaCracks(parentMesh) {
        // Add glowing cracks to the body
        const crackCount = 8;
        
        for (let i = 0; i < crackCount; i++) {
            const crackGeometry = new THREE.PlaneGeometry(0.05, 0.8);
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                emissive: 0xff3300,
                emissiveIntensity: 1,
                side: THREE.DoubleSide
            });
            
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            crack.position.set(
                (Math.random() - 0.5) * 1.4,
                (Math.random() - 0.5) * 1.8,
                0.61
            );
            crack.rotation.z = Math.random() * Math.PI;
            
            parentMesh.add(crack);
        }
    }
    
    createCoolingVents(parent) {
        // Create vulnerable vents on the back
        const ventPositions = [
            { x: -0.3, y: 1.2 },
            { x: 0.3, y: 1.2 },
            { x: 0, y: 0.8 }
        ];
        
        ventPositions.forEach(pos => {
            const ventGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 6);
            const ventMaterial = new THREE.MeshPhongMaterial({
                color: 0x0066ff,
                emissive: 0x0033ff,
                emissiveIntensity: 0.5
            });
            
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(pos.x, pos.y, -0.7);
            vent.rotation.x = Math.PI / 2;
            vent.userData = { isVent: true, destroyed: false };
            
            parent.add(vent);
            this.vents.push(vent);
        });
    }
    
    createLavaDrips(parent) {
        // Create dripping lava particles
        const dripGeometry = new THREE.BufferGeometry();
        const dripCount = 10;
        const positions = new Float32Array(dripCount * 3);
        const colors = new Float32Array(dripCount * 3);
        
        for (let i = 0; i < dripCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 1] = Math.random() * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            
            colors[i * 3] = 1;
            colors[i * 3 + 1] = Math.random() * 0.5;
            colors[i * 3 + 2] = 0;
        }
        
        dripGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        dripGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const dripMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.lavaDrips = new THREE.Points(dripGeometry, dripMaterial);
        parent.add(this.lavaDrips);
    }
    
    update(deltaTime, player) {
        if (this.isDead || this.state === 'dead') return;
        
        // Update core glow
        if (this.core) {
            this.coreTemperature = 0.8 + Math.sin(Date.now() * 0.003) * 0.2;
            this.core.material.emissiveIntensity = this.coreTemperature * 2;
            this.glowLight.intensity = this.coreTemperature * 0.5;
        }
        
        // Update lava drips
        if (this.lavaDrips) {
            const positions = this.lavaDrips.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] -= deltaTime * 2;
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 2;
                }
            }
            this.lavaDrips.geometry.attributes.position.needsUpdate = true;
        }
        
        // Leave lava trail
        if (this.lavaTrailEnabled && this.velocity.length() > 0.1) {
            this.createLavaTrail();
        }
        
        // Update lava trails
        this.updateLavaTrails(deltaTime);
        
        // Check for ground slam attack
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer < this.slamRadius) {
            this.attemptGroundSlam(player);
        }
        
        // Stomping animation when walking
        if (this.velocity.length() > 0.1) {
            const stomp = Math.sin(Date.now() * 0.003) * 0.1;
            if (this.leftArm && this.rightArm) {
                this.leftArm.rotation.x = -stomp;
                this.rightArm.rotation.x = stomp;
            }
        }
        
        // Parent update
        super.update(deltaTime, player);
    }
    
    createLavaTrail() {
        const now = Date.now();
        if (now - this.lastTrailTime < this.trailInterval) return;
        
        // Create lava puddle at current position
        const puddleGeometry = new THREE.CircleGeometry(0.5, 8);
        const puddleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            emissive: 0xff3300,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const puddle = new THREE.Mesh(puddleGeometry, puddleMaterial);
        puddle.position.copy(this.position);
        puddle.position.y = 0.01;
        puddle.rotation.x = -Math.PI / 2;
        
        this.scene.add(puddle);
        
        this.lavaTrails.push({
            mesh: puddle,
            lifetime: 5000,
            startTime: now,
            damage: 5,
            lastDamageTime: 0
        });
        
        this.lastTrailTime = now;
    }
    
    updateLavaTrails(deltaTime) {
        const now = Date.now();
        
        for (let i = this.lavaTrails.length - 1; i >= 0; i--) {
            const trail = this.lavaTrails[i];
            
            // Check lifetime
            const age = now - trail.startTime;
            if (age > trail.lifetime) {
                this.scene.remove(trail.mesh);
                this.lavaTrails.splice(i, 1);
                continue;
            }
            
            // Fade out
            trail.mesh.material.opacity = 0.8 * (1 - age / trail.lifetime);
            
            // Damage player if standing on it
            if (this.target) {
                const distance = new THREE.Vector2(
                    trail.mesh.position.x - this.target.position.x,
                    trail.mesh.position.z - this.target.position.z
                ).length();
                
                if (distance < 0.5 && now - trail.lastDamageTime > 500) {
                    this.target.takeDamage(trail.damage);
                    trail.lastDamageTime = now;
                }
            }
        }
    }
    
    attemptGroundSlam(player) {
        const now = Date.now();
        if (now - this.lastSlamTime < this.slamCooldown) return;
        
        // Telegraph the attack
        this.telegraphSlam();
        
        // Perform slam after delay
        setTimeout(() => {
            if (!this.isDead) {
                this.performGroundSlam(player);
            }
        }, 500);
        
        this.lastSlamTime = now;
    }
    
    telegraphSlam() {
        // Raise arms
        if (this.leftArm && this.rightArm) {
            const raiseAnimation = () => {
                if (this.leftArm.rotation.z < 1.5) {
                    this.leftArm.rotation.z += 0.1;
                    this.rightArm.rotation.z -= 0.1;
                    this.leftArm.position.y += 0.02;
                    this.rightArm.position.y += 0.02;
                    requestAnimationFrame(raiseAnimation);
                }
            };
            raiseAnimation();
        }
        
        // Glow brighter
        if (this.core) {
            this.core.material.emissiveIntensity = 4;
        }
    }
    
    performGroundSlam(player) {
        // Slam arms down
        if (this.leftArm && this.rightArm) {
            this.leftArm.rotation.z = 0.3;
            this.rightArm.rotation.z = -0.3;
            this.leftArm.position.y = 1;
            this.rightArm.position.y = 1;
        }
        
        // Create shockwave
        const shockwaveGeometry = new THREE.RingGeometry(0.5, 1, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(this.position);
        shockwave.position.y = 0.1;
        shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(shockwave);
        
        // Create ground cracks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.createGroundCrack(angle);
        }
        
        // Animate shockwave
        const animateShockwave = () => {
            shockwave.scale.x += 0.5;
            shockwave.scale.y += 0.5;
            shockwave.material.opacity *= 0.92;
            
            // Check player collision
            if (this.target) {
                const distance = new THREE.Vector2(
                    this.position.x - this.target.position.x,
                    this.position.z - this.target.position.z
                ).length();
                
                const ringRadius = shockwave.scale.x;
                if (Math.abs(distance - ringRadius) < 1 && shockwave.material.opacity > 0.3) {
                    // Damage and knockback
                    this.target.takeDamage(this.slamDamage);
                    
                    const knockbackDir = new THREE.Vector3()
                        .subVectors(this.target.position, this.position)
                        .normalize()
                        .multiplyScalar(10);
                    knockbackDir.y = 5;
                    
                    if (this.target.applyKnockback) {
                        this.target.applyKnockback(knockbackDir);
                    }
                    
                    // Prevent multiple hits
                    shockwave.material.opacity = 0.3;
                }
            }
            
            if (shockwave.scale.x < this.slamRadius) {
                requestAnimationFrame(animateShockwave);
            } else {
                this.scene.remove(shockwave);
            }
        };
        animateShockwave();
        
        // Reset core glow
        if (this.core) {
            this.core.material.emissiveIntensity = 2;
        }
    }
    
    createGroundCrack(angle) {
        const crackGeometry = new THREE.PlaneGeometry(0.2, 3);
        const crackMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.6
        });
        
        const crack = new THREE.Mesh(crackGeometry, crackMaterial);
        crack.position.copy(this.position);
        crack.position.y = 0.02;
        crack.rotation.x = -Math.PI / 2;
        crack.rotation.z = angle;
        
        this.scene.add(crack);
        
        // Fade out
        const fadeCrack = () => {
            crack.material.opacity *= 0.95;
            if (crack.material.opacity > 0.01) {
                requestAnimationFrame(fadeCrack);
            } else {
                this.scene.remove(crack);
            }
        };
        
        setTimeout(fadeCrack, 1000);
    }
    
    takeDamage(damage, damageType = 'normal', hitPosition = null) {
        // Check if hit a vent (weak point)
        let ventHit = false;
        if (hitPosition && !this.ventsClosed) {
            this.vents.forEach(vent => {
                if (!vent.userData.destroyed) {
                    const ventWorldPos = new THREE.Vector3();
                    vent.getWorldPosition(ventWorldPos);
                    
                    if (hitPosition.distanceTo(ventWorldPos) < 0.3) {
                        // Weak point hit!
                        damage *= 3;
                        ventHit = true;
                        
                        // Destroy vent
                        vent.userData.destroyed = true;
                        vent.material.color.setHex(0x333333);
                        vent.material.emissive.setHex(0x000000);
                        
                        // Steam burst
                        this.createSteamBurst(ventWorldPos);
                    }
                }
            });
            
            // Close vents temporarily after hit
            if (ventHit) {
                this.ventsClosed = true;
                setTimeout(() => {
                    this.ventsClosed = false;
                }, 5000);
            }
        }
        
        // Ice/water damage is extra effective
        if (damageType === 'ice' || damageType === 'water' || damageType === 'holy') {
            damage *= 2;
        }
        
        // Fire damage is reduced
        if (damageType === 'fire') {
            damage *= 0.5;
        }
        
        super.takeDamage(damage);
    }
    
    createSteamBurst(position) {
        // Create steam effect when vent is destroyed
        const steamCount = 20;
        
        for (let i = 0; i < steamCount; i++) {
            const steam = new THREE.Mesh(
                new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            steam.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 4,
                (Math.random() - 0.5) * 3
            );
            
            this.scene.add(steam);
            
            // Animate steam
            const animateSteam = () => {
                steam.position.add(velocity.clone().multiplyScalar(0.02));
                steam.scale.multiplyScalar(1.02);
                steam.material.opacity *= 0.95;
                
                if (steam.material.opacity > 0.01) {
                    requestAnimationFrame(animateSteam);
                } else {
                    this.scene.remove(steam);
                }
            };
            animateSteam();
        }
    }
    
    onDeath() {
        // Set death state
        this.state = 'dead';
        this.isDead = true;
        
        // Clear lava trails
        this.lavaTrails.forEach(trail => {
            this.scene.remove(trail.mesh);
        });
        this.lavaTrails = [];
        
        // Death animation - crumble
        if (this.mesh) {
            const crumbleAnimation = () => {
                if (this.mesh.scale.y > 0.1) {
                    this.mesh.scale.y *= 0.95;
                    this.mesh.position.y -= 0.02;
                    requestAnimationFrame(crumbleAnimation);
                } else {
                    // Trigger explosion after crumble
                    this.deathExplosion();
                }
            };
            crumbleAnimation();
        }
    }
    
    deathExplosion() {
        // Warning indicator
        const warningGeometry = new THREE.RingGeometry(this.deathExplosionRadius - 1, this.deathExplosionRadius, 32);
        const warningMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const warning = new THREE.Mesh(warningGeometry, warningMaterial);
        warning.position.copy(this.position);
        warning.position.y = 0.1;
        warning.rotation.x = -Math.PI / 2;
        this.scene.add(warning);
        
        // Flash warning
        let flashCount = 0;
        const flashWarning = () => {
            warning.material.opacity = flashCount % 2 === 0 ? 0.8 : 0.2;
            flashCount++;
            
            if (flashCount < 6) {
                setTimeout(flashWarning, 200);
            } else {
                this.scene.remove(warning);
                this.explode();
            }
        };
        flashWarning();
    }
    
    explode() {
        // Create massive explosion
        const explosionGeometry = new THREE.SphereGeometry(1, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        this.scene.add(explosion);
        
        // Create lava rain
        for (let i = 0; i < 50; i++) {
            this.createLavaProjectile();
        }
        
        // Animate explosion
        const animateExplosion = () => {
            explosion.scale.multiplyScalar(1.2);
            explosion.material.opacity *= 0.93;
            
            // Damage check
            if (explosion.scale.x < this.deathExplosionRadius && this.target) {
                const distance = explosion.position.distanceTo(this.target.position);
                if (distance < explosion.scale.x) {
                    // Calculate damage based on distance
                    const damageFactor = 1 - (distance / this.deathExplosionRadius);
                    const damage = this.deathExplosionDamage * damageFactor;
                    
                    this.target.takeDamage(damage);
                    
                    // Knockback
                    const knockback = new THREE.Vector3()
                        .subVectors(this.target.position, explosion.position)
                        .normalize()
                        .multiplyScalar(15 * damageFactor);
                    knockback.y = 8;
                    
                    if (this.target.applyKnockback) {
                        this.target.applyKnockback(knockback);
                    }
                    
                    // Prevent multiple hits
                    explosion.scale.set(this.deathExplosionRadius, this.deathExplosionRadius, this.deathExplosionRadius);
                }
            }
            
            if (explosion.material.opacity > 0.01) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        animateExplosion();
        
        // Create death particles (parent method)
        this.createDeathParticles();
    }
    
    createLavaProjectile() {
        const projectile = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 6, 6),
            new THREE.MeshBasicMaterial({
                color: 0xff3300,
                emissive: 0xff3300,
                emissiveIntensity: 1
            })
        );
        
        projectile.position.copy(this.position);
        projectile.position.y += 1;
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            10 + Math.random() * 10,
            (Math.random() - 0.5) * 20
        );
        
        this.scene.add(projectile);
        
        // Animate projectile
        const animateProjectile = () => {
            projectile.position.add(velocity.clone().multiplyScalar(0.02));
            velocity.y -= 0.5; // Gravity
            
            // Check ground collision
            if (projectile.position.y <= 0) {
                // Create lava puddle
                const puddle = new THREE.Mesh(
                    new THREE.CircleGeometry(0.3, 6),
                    new THREE.MeshBasicMaterial({
                        color: 0xff3300,
                        transparent: true,
                        opacity: 0.6
                    })
                );
                puddle.position.set(projectile.position.x, 0.01, projectile.position.z);
                puddle.rotation.x = -Math.PI / 2;
                this.scene.add(puddle);
                
                // Fade puddle
                const fadePuddle = () => {
                    puddle.material.opacity *= 0.98;
                    if (puddle.material.opacity > 0.01) {
                        requestAnimationFrame(fadePuddle);
                    } else {
                        this.scene.remove(puddle);
                    }
                };
                setTimeout(fadePuddle, 1000);
                
                this.scene.remove(projectile);
            } else {
                requestAnimationFrame(animateProjectile);
            }
        };
        animateProjectile();
    }
}
// Holy Rage System
// Build divine fury through combat to unlock devastating holy abilities

export class HolyRageSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Rage stats
        this.rage = 0;
        this.maxRage = 100;
        this.rageDecayRate = 0.5; // per second when not in combat
        this.lastCombatTime = Date.now();
        this.combatTimeout = 5000; // 5 seconds
        
        // Rage generation multipliers
        this.killMultiplier = {
            possessed_scientist: 5,
            hellhound: 7,
            succubus: 10,
            brimstone_golem: 12,
            shadow_wraith: 15,
            demon_knight: 20,
            imp: 3,
            boss: 50
        };
        
        // Holy weapon rage bonus
        this.holyWeaponBonus = 1.5;
        
        // Miracles (unlocked at full rage)
        this.miracles = {
            divineWrath: {
                name: "Divine Wrath",
                cost: 100,
                description: "Unleash a holy explosion that damages all enemies",
                execute: () => this.executeDivineWrath()
            },
            holyNova: {
                name: "Holy Nova",
                cost: 100,
                description: "Create a expanding ring of holy light",
                execute: () => this.executeHolyNova()
            },
            righteousStorm: {
                name: "Righteous Storm",
                cost: 100,
                description: "Call down holy lightning on all visible enemies",
                execute: () => this.executeRighteousStorm()
            },
            angelicShield: {
                name: "Angelic Shield",
                cost: 100,
                description: "Become invulnerable and reflect all damage",
                execute: () => this.executeAngelicShield()
            }
        };
        
        // Current available miracle (cycles through options)
        this.currentMiracle = 'divineWrath';
        
        // Visual effects
        this.rageParticles = null;
        this.createRageEffects();
    }
    
    createRageEffects() {
        // Create rage particle system
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            // Golden/white colors
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.2 + Math.random() * 0.3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        
        this.rageParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.rageParticles);
    }
    
    addRage(amount, isHolyWeapon = false) {
        // Apply holy weapon bonus
        if (isHolyWeapon) {
            amount *= this.holyWeaponBonus;
        }
        
        this.rage = Math.min(this.rage + amount, this.maxRage);
        this.lastCombatTime = Date.now();
        
        // Visual feedback
        this.flashRageEffect();
        
        // Check if miracle is ready
        if (this.rage >= this.maxRage) {
            this.onMiracleReady();
        }
    }
    
    onKill(enemyType, usedHolyWeapon = false) {
        const baseRage = this.killMultiplier[enemyType] || 5;
        this.addRage(baseRage, usedHolyWeapon);
    }
    
    onDamageDeal(damage, isHolyWeapon = false) {
        // Generate rage based on damage dealt
        const rageAmount = damage * 0.1;
        this.addRage(rageAmount, isHolyWeapon);
    }
    
    update(deltaTime) {
        // Decay rage when out of combat
        const now = Date.now();
        if (now - this.lastCombatTime > this.combatTimeout && this.rage > 0) {
            this.rage = Math.max(0, this.rage - this.rageDecayRate * deltaTime);
        }
        
        // Update particle effects
        if (this.rageParticles) {
            const positions = this.rageParticles.geometry.attributes.position.array;
            const rageIntensity = this.rage / this.maxRage;
            
            for (let i = 0; i < positions.length / 3; i++) {
                // Orbit around player
                const angle = (Date.now() * 0.001 + i * 0.1) % (Math.PI * 2);
                const radius = 1 + Math.sin(Date.now() * 0.002 + i) * 0.5;
                
                positions[i * 3] = this.player.position.x + Math.cos(angle) * radius * rageIntensity;
                positions[i * 3 + 1] = this.player.position.y + 1 + Math.sin(Date.now() * 0.003 + i) * 0.5;
                positions[i * 3 + 2] = this.player.position.z + Math.sin(angle) * radius * rageIntensity;
            }
            
            this.rageParticles.geometry.attributes.position.needsUpdate = true;
            this.rageParticles.material.opacity = rageIntensity * 0.5;
        }
    }
    
    flashRageEffect() {
        // Brief flash effect when rage increases
        if (this.rageParticles) {
            this.rageParticles.material.opacity = 1;
            setTimeout(() => {
                if (this.rageParticles) {
                    this.rageParticles.material.opacity = this.rage / this.maxRage * 0.5;
                }
            }, 100);
        }
    }
    
    onMiracleReady() {
        // Notify player that a miracle is available
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `MIRACLE READY: ${this.miracles[this.currentMiracle].name} - Press Q to unleash!`
            );
        }
        
        // Enhanced visual effect
        this.createMiracleReadyEffect();
    }
    
    createMiracleReadyEffect() {
        // Create glowing aura around player
        const auraGeometry = new THREE.SphereGeometry(2, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.copy(this.player.position);
        this.scene.add(aura);
        
        // Animate and remove
        const animateAura = () => {
            aura.scale.multiplyScalar(1.02);
            aura.material.opacity *= 0.95;
            
            if (aura.material.opacity > 0.01) {
                requestAnimationFrame(animateAura);
            } else {
                this.scene.remove(aura);
            }
        };
        animateAura();
    }
    
    executeMiracle() {
        if (this.rage < this.maxRage) return false;
        
        const miracle = this.miracles[this.currentMiracle];
        if (miracle) {
            miracle.execute();
            this.rage = 0; // Consume all rage
            
            // Cycle to next miracle
            const miracleKeys = Object.keys(this.miracles);
            const currentIndex = miracleKeys.indexOf(this.currentMiracle);
            this.currentMiracle = miracleKeys[(currentIndex + 1) % miracleKeys.length];
            
            return true;
        }
        return false;
    }
    
    executeDivineWrath() {
        // Create holy explosion at player position
        const explosionRadius = 15;
        
        // Visual effect
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(sphereGeometry, sphereMaterial);
        explosion.position.copy(this.player.position);
        this.scene.add(explosion);
        
        // Expand explosion
        const expandExplosion = () => {
            explosion.scale.multiplyScalar(1.3);
            explosion.material.opacity *= 0.9;
            
            if (explosion.scale.x < explosionRadius) {
                requestAnimationFrame(expandExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        expandExplosion();
        
        // Damage all enemies in radius
        if (this.player.game && this.player.game.enemies) {
            this.player.game.enemies.forEach(enemy => {
                if (enemy && enemy.position) {
                    const distance = enemy.position.distanceTo(this.player.position);
                    if (distance <= explosionRadius) {
                        const damage = 100 * (1 - distance / explosionRadius);
                        enemy.takeDamage(damage, 'holy');
                        
                        // Knockback
                        const knockbackDir = new THREE.Vector3()
                            .subVectors(enemy.position, this.player.position)
                            .normalize()
                            .multiplyScalar(5);
                        enemy.applyKnockback(knockbackDir);
                    }
                }
            });
        }
    }
    
    executeHolyNova() {
        // Create expanding ring of holy light
        const ringGeometry = new THREE.TorusGeometry(1, 0.2, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            emissive: 0xffffff,
            emissiveIntensity: 2
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.player.position);
        ring.position.y += 1;
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);
        
        let ringScale = 1;
        const maxScale = 20;
        
        const expandRing = () => {
            ringScale += 0.5;
            ring.scale.set(ringScale, ringScale, 1);
            ring.material.opacity = 1 - (ringScale / maxScale);
            
            // Check enemy collisions
            if (this.player.game && this.player.game.enemies) {
                this.player.game.enemies.forEach(enemy => {
                    if (enemy && enemy.position && !enemy.hitByNova) {
                        const distance = new THREE.Vector2(
                            enemy.position.x - this.player.position.x,
                            enemy.position.z - this.player.position.z
                        ).length();
                        
                        if (Math.abs(distance - ringScale) < 1) {
                            enemy.takeDamage(75, 'holy');
                            enemy.hitByNova = true;
                            
                            // Stun effect
                            enemy.state = 'stunned';
                            setTimeout(() => {
                                if (enemy && !enemy.isDead) {
                                    enemy.state = 'idle';
                                    enemy.hitByNova = false;
                                }
                            }, 2000);
                        }
                    }
                });
            }
            
            if (ringScale < maxScale) {
                requestAnimationFrame(expandRing);
            } else {
                this.scene.remove(ring);
            }
        };
        expandRing();
    }
    
    executeRighteousStorm() {
        // Call down holy lightning on all visible enemies
        if (!this.player.game || !this.player.game.enemies) return;
        
        this.player.game.enemies.forEach(enemy => {
            if (enemy && enemy.position && !enemy.isDead) {
                // Check if enemy is visible (simple distance check for now)
                const distance = enemy.position.distanceTo(this.player.position);
                if (distance <= 30) {
                    // Create lightning strike
                    this.createLightningStrike(enemy.position);
                    
                    // Damage enemy
                    setTimeout(() => {
                        if (enemy && !enemy.isDead) {
                            enemy.takeDamage(80, 'holy');
                        }
                    }, 500);
                }
            }
        });
    }
    
    createLightningStrike(targetPosition) {
        // Create lightning bolt from sky to target
        const points = [];
        const startY = 20;
        const segments = 10;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = startY * (1 - t) + targetPosition.y * t;
            
            // Add some randomness for lightning effect
            const offset = i === 0 || i === segments ? 0 : (Math.random() - 0.5) * 2;
            
            points.push(new THREE.Vector3(
                targetPosition.x + offset,
                y,
                targetPosition.z + offset
            ));
        }
        
        const lightningGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lightningMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            linewidth: 3,
            transparent: true,
            opacity: 1
        });
        
        const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
        this.scene.add(lightning);
        
        // Flash effect
        const flash = new THREE.PointLight(0xffffff, 5, 20);
        flash.position.copy(targetPosition);
        flash.position.y += 1;
        this.scene.add(flash);
        
        // Fade out
        let opacity = 1;
        const fadeLightning = () => {
            opacity -= 0.1;
            lightning.material.opacity = opacity;
            flash.intensity = opacity * 5;
            
            if (opacity > 0) {
                requestAnimationFrame(fadeLightning);
            } else {
                this.scene.remove(lightning);
                this.scene.remove(flash);
            }
        };
        
        setTimeout(fadeLightning, 100);
    }
    
    executeAngelicShield() {
        // Make player invulnerable and reflect damage
        this.player.invulnerable = true;
        this.player.reflectDamage = true;
        
        // Create shield visual
        const shieldGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ddff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.scene.add(shield);
        
        // Duration: 10 seconds
        const duration = 10000;
        const startTime = Date.now();
        
        const updateShield = () => {
            if (!this.player) return;
            
            shield.position.copy(this.player.position);
            shield.position.y += 1;
            
            // Pulse effect
            const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
            shield.scale.set(pulse, pulse, pulse);
            
            // Check duration
            if (Date.now() - startTime < duration) {
                requestAnimationFrame(updateShield);
            } else {
                // Remove shield
                this.scene.remove(shield);
                this.player.invulnerable = false;
                this.player.reflectDamage = false;
            }
        };
        updateShield();
    }
    
    getRagePercentage() {
        return (this.rage / this.maxRage) * 100;
    }
    
    getCurrentMiracleName() {
        return this.miracles[this.currentMiracle].name;
    }
}
// Martyrdom Mode System
// When player dies, become invincible spirit form for revenge kills

export class MartyrdomMode {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Martyrdom state
        this.isActive = false;
        this.spiritDuration = 15000; // 15 seconds of revenge time
        this.activationTime = 0;
        this.killsInMartyrdom = 0;
        this.damageDealt = 0;
        
        // Spirit form properties
        this.spiritSpeed = 10; // Much faster movement
        this.spiritDamageMultiplier = 3; // Triple damage
        this.spiritMesh = null;
        this.originalMesh = null;
        
        // Visual effects
        this.spiritAura = null;
        this.holyFlames = [];
        this.vengeanceTrail = [];
        
        // Abilities in spirit form
        this.abilities = {
            divineBlast: {
                cooldown: 2000,
                lastUsed: 0,
                radius: 10,
                damage: 100
            },
            seekingVengeance: {
                cooldown: 1000,
                lastUsed: 0,
                projectileSpeed: 20,
                projectileCount: 3
            },
            righteousFury: {
                active: false,
                damagePerSecond: 20,
                radius: 5
            }
        };
        
        // Resurrection tracking
        this.canResurrect = false;
        this.resurrectionThreshold = 5; // Kills needed to resurrect
        
        // Store original player properties
        this.originalProperties = {};
    }
    
    activate() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.activationTime = Date.now();
        this.killsInMartyrdom = 0;
        this.damageDealt = 0;
        
        // Store original properties
        this.storeOriginalProperties();
        
        // Transform into spirit form
        this.createSpiritForm();
        
        // Enhance player abilities
        this.enhanceAbilities();
        
        // Start countdown timer
        this.startCountdown();
        
        // Narrative announcement
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                "MARTYRDOM ACTIVATED - SEEK VENGEANCE!"
            );
        }
        
        // Create activation effect
        this.createActivationEffect();
    }
    
    storeOriginalProperties() {
        this.originalProperties = {
            moveSpeed: this.player.moveSpeed,
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            damageMultiplier: this.player.damageMultiplier || 1,
            canTakeDamage: this.player.canTakeDamage !== false,
            mesh: this.player.mesh
        };
    }
    
    createSpiritForm() {
        // Hide original mesh
        if (this.player.mesh) {
            this.originalMesh = this.player.mesh;
            this.player.mesh.visible = false;
        }
        
        // Create ethereal spirit mesh
        const group = new THREE.Group();
        
        // Glowing core
        const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1;
        group.add(core);
        
        // Ethereal body
        const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        group.add(body);
        
        // Angel wings
        this.createAngelWings(group);
        
        // Holy aura
        this.createHolyAura(group);
        
        // Attach to player camera
        this.spiritMesh = group;
        if (this.player.camera) {
            this.player.camera.add(this.spiritMesh);
            this.spiritMesh.position.set(0, -0.5, -2);
        }
        
        // Add point light
        const spiritLight = new THREE.PointLight(0xffffaa, 2, 20);
        spiritLight.position.y = 1;
        group.add(spiritLight);
    }
    
    createAngelWings(parent) {
        // Left wing
        const wingGeometry = new THREE.PlaneGeometry(2, 3, 10, 10);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffaa,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        // Modify vertices for wing shape
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-1, 1, -0.5);
        leftWing.rotation.y = -0.5;
        parent.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(1, 1, -0.5);
        rightWing.rotation.y = 0.5;
        parent.add(rightWing);
        
        // Animate wings
        const animateWings = () => {
            if (this.isActive) {
                const time = Date.now() * 0.002;
                leftWing.rotation.z = Math.sin(time) * 0.2 - 0.2;
                rightWing.rotation.z = -Math.sin(time) * 0.2 + 0.2;
                leftWing.position.y = 1 + Math.sin(time) * 0.1;
                rightWing.position.y = 1 + Math.sin(time) * 0.1;
                requestAnimationFrame(animateWings);
            }
        };
        animateWings();
    }
    
    createHolyAura(parent) {
        // Particle system for aura
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 1 + Math.random() * 2;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // Golden color
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 0.5;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.spiritAura = new THREE.Points(particles, particleMaterial);
        parent.add(this.spiritAura);
        
        // Animate aura
        const animateAura = () => {
            if (this.isActive && this.spiritAura) {
                this.spiritAura.rotation.y += 0.01;
                
                const positions = this.spiritAura.geometry.attributes.position.array;
                for (let i = 0; i < positions.length / 3; i++) {
                    const idx = i * 3;
                    // Float particles upward
                    positions[idx + 1] += 0.02;
                    if (positions[idx + 1] > 3) {
                        positions[idx + 1] = -1;
                    }
                }
                this.spiritAura.geometry.attributes.position.needsUpdate = true;
                
                requestAnimationFrame(animateAura);
            }
        };
        animateAura();
    }
    
    enhanceAbilities() {
        // Make player invincible
        this.player.canTakeDamage = false;
        this.player.health = 999999;
        
        // Increase movement speed
        this.player.moveSpeed = this.spiritSpeed;
        
        // Enhance damage
        this.player.damageMultiplier = this.spiritDamageMultiplier;
        
        // Enable flight
        this.player.canFly = true;
        this.player.gravity = 0;
        
        // Activate righteous fury aura
        this.abilities.righteousFury.active = true;
        this.startRighteousFury();
    }
    
    startRighteousFury() {
        // Damage enemies near player continuously
        const furyInterval = setInterval(() => {
            if (!this.isActive) {
                clearInterval(furyInterval);
                return;
            }
            
            if (this.player.game && this.player.game.enemies) {
                this.player.game.enemies.forEach(enemy => {
                    if (enemy && !enemy.isDead) {
                        const distance = enemy.position.distanceTo(this.player.position);
                        if (distance < this.abilities.righteousFury.radius) {
                            enemy.takeDamage(this.abilities.righteousFury.damagePerSecond / 10, 'holy');
                            this.damageDealt += this.abilities.righteousFury.damagePerSecond / 10;
                            
                            // Create burn effect
                            this.createHolyBurnEffect(enemy.position);
                        }
                    }
                });
            }
        }, 100); // 10 times per second
    }
    
    useDivineBlast() {
        const now = Date.now();
        if (now - this.abilities.divineBlast.lastUsed < this.abilities.divineBlast.cooldown) return;
        
        this.abilities.divineBlast.lastUsed = now;
        
        // Create expanding blast wave
        const blastGeometry = new THREE.SphereGeometry(1, 16, 16);
        const blastMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.8
        });
        
        const blast = new THREE.Mesh(blastGeometry, blastMaterial);
        blast.position.copy(this.player.position);
        this.scene.add(blast);
        
        // Expand and damage
        const expandBlast = () => {
            blast.scale.multiplyScalar(1.3);
            blast.material.opacity *= 0.9;
            
            // Check enemy collisions
            if (this.player.game && this.player.game.enemies) {
                this.player.game.enemies.forEach(enemy => {
                    if (enemy && !enemy.isDead) {
                        const distance = enemy.position.distanceTo(blast.position);
                        if (distance < blast.scale.x && !enemy.hitByBlast) {
                            enemy.takeDamage(this.abilities.divineBlast.damage, 'holy');
                            enemy.hitByBlast = true;
                            this.damageDealt += this.abilities.divineBlast.damage;
                            
                            // Knockback
                            const knockback = new THREE.Vector3()
                                .subVectors(enemy.position, blast.position)
                                .normalize()
                                .multiplyScalar(15);
                            enemy.applyKnockback(knockback);
                        }
                    }
                });
            }
            
            if (blast.scale.x < this.abilities.divineBlast.radius) {
                requestAnimationFrame(expandBlast);
            } else {
                this.scene.remove(blast);
                // Reset hit flags
                if (this.player.game && this.player.game.enemies) {
                    this.player.game.enemies.forEach(enemy => {
                        if (enemy) delete enemy.hitByBlast;
                    });
                }
            }
        };
        expandBlast();
        
        // Sound and message
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle("DIVINE BLAST!");
        }
    }
    
    useSeekingVengeance() {
        const now = Date.now();
        if (now - this.abilities.seekingVengeance.lastUsed < this.abilities.seekingVengeance.cooldown) return;
        
        this.abilities.seekingVengeance.lastUsed = now;
        
        // Find nearest enemies
        const targets = [];
        if (this.player.game && this.player.game.enemies) {
            const sortedEnemies = this.player.game.enemies
                .filter(e => e && !e.isDead)
                .sort((a, b) => {
                    const distA = a.position.distanceTo(this.player.position);
                    const distB = b.position.distanceTo(this.player.position);
                    return distA - distB;
                });
            
            targets.push(...sortedEnemies.slice(0, this.abilities.seekingVengeance.projectileCount));
        }
        
        // Launch seeking projectiles
        targets.forEach((target, index) => {
            setTimeout(() => {
                this.launchSeekingProjectile(target);
            }, index * 100);
        });
        
        // Message
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle("SEEKING VENGEANCE!");
        }
    }
    
    launchSeekingProjectile(target) {
        // Create holy projectile
        const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            emissive: 0xffffaa,
            emissiveIntensity: 2
        });
        
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(this.player.position);
        projectile.position.y += 1;
        
        this.scene.add(projectile);
        
        // Add trail
        const trail = [];
        
        // Seek target
        const seekTarget = () => {
            if (!target || target.isDead) {
                this.scene.remove(projectile);
                trail.forEach(t => this.scene.remove(t));
                return;
            }
            
            // Calculate direction to target
            const direction = new THREE.Vector3()
                .subVectors(target.position, projectile.position)
                .normalize();
            
            // Move projectile
            projectile.position.add(
                direction.multiplyScalar(this.abilities.seekingVengeance.projectileSpeed * 0.016)
            );
            
            // Create trail
            const trailPart = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffaa,
                    transparent: true,
                    opacity: 0.5
                })
            );
            trailPart.position.copy(projectile.position);
            this.scene.add(trailPart);
            trail.push(trailPart);
            
            // Fade trail
            trail.forEach((t, i) => {
                t.material.opacity *= 0.95;
                if (t.material.opacity < 0.01) {
                    this.scene.remove(t);
                    trail.splice(i, 1);
                }
            });
            
            // Check collision
            const distance = projectile.position.distanceTo(target.position);
            if (distance < 1) {
                // Hit target
                target.takeDamage(50, 'holy');
                this.damageDealt += 50;
                
                // Create impact effect
                this.createHolyImpact(target.position);
                
                // Clean up
                this.scene.remove(projectile);
                trail.forEach(t => this.scene.remove(t));
            } else {
                requestAnimationFrame(seekTarget);
            }
        };
        seekTarget();
    }
    
    createActivationEffect() {
        // Pillar of light
        const pillarGeometry = new THREE.CylinderGeometry(2, 2, 10, 16);
        const pillarMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.6
        });
        
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.copy(this.player.position);
        pillar.position.y = 5;
        this.scene.add(pillar);
        
        // Ascending particles
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 1
                })
            );
            
            const angle = (i / 50) * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.set(
                this.player.position.x + Math.cos(angle) * radius,
                this.player.position.y,
                this.player.position.z + Math.sin(angle) * radius
            );
            
            this.scene.add(particle);
            
            // Animate upward
            const animateParticle = () => {
                particle.position.y += 0.1;
                particle.material.opacity *= 0.98;
                
                if (particle.material.opacity > 0.01 && particle.position.y < 10) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
        
        // Fade pillar
        const fadePillar = () => {
            pillar.material.opacity *= 0.95;
            pillar.scale.x *= 1.05;
            pillar.scale.z *= 1.05;
            
            if (pillar.material.opacity > 0.01) {
                requestAnimationFrame(fadePillar);
            } else {
                this.scene.remove(pillar);
            }
        };
        setTimeout(fadePillar, 500);
    }
    
    createHolyBurnEffect(position) {
        // Small flame particle
        const flame = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 4, 4),
            new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.8
            })
        );
        
        flame.position.copy(position);
        flame.position.y += Math.random() * 2;
        this.scene.add(flame);
        
        // Animate upward
        const animateFlame = () => {
            flame.position.y += 0.03;
            flame.material.opacity *= 0.95;
            
            if (flame.material.opacity > 0.01) {
                requestAnimationFrame(animateFlame);
            } else {
                this.scene.remove(flame);
            }
        };
        animateFlame();
    }
    
    createHolyImpact(position) {
        // Impact burst
        const burst = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.8
            })
        );
        
        burst.position.copy(position);
        this.scene.add(burst);
        
        // Expand and fade
        const expandBurst = () => {
            burst.scale.multiplyScalar(1.1);
            burst.material.opacity *= 0.9;
            
            if (burst.material.opacity > 0.01) {
                requestAnimationFrame(expandBurst);
            } else {
                this.scene.remove(burst);
            }
        };
        expandBurst();
    }
    
    onEnemyKilled(enemy) {
        if (!this.isActive) return;
        
        this.killsInMartyrdom++;
        
        // Check for resurrection
        if (this.killsInMartyrdom >= this.resurrectionThreshold && !this.canResurrect) {
            this.canResurrect = true;
            
            if (this.player.game && this.player.game.narrativeSystem) {
                this.player.game.narrativeSystem.displaySubtitle(
                    "RESURRECTION AVAILABLE - Press R to return to life!"
                );
            }
        }
        
        // Extend timer slightly per kill
        this.spiritDuration += 1000; // +1 second per kill
        
        // Visual feedback
        this.createKillEffect(enemy.position);
    }
    
    createKillEffect(position) {
        // Soul absorbed effect
        const soulOrb = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            })
        );
        
        soulOrb.position.copy(position);
        soulOrb.position.y += 1;
        this.scene.add(soulOrb);
        
        // Animate to player
        const animateSoul = () => {
            const toPlayer = new THREE.Vector3()
                .subVectors(this.player.position, soulOrb.position);
            
            if (toPlayer.length() > 0.5) {
                soulOrb.position.add(toPlayer.normalize().multiplyScalar(0.3));
                requestAnimationFrame(animateSoul);
            } else {
                this.scene.remove(soulOrb);
                
                // Flash effect on absorption
                if (this.spiritMesh) {
                    const originalIntensity = this.spiritMesh.children[0].material.emissiveIntensity;
                    this.spiritMesh.children[0].material.emissiveIntensity = 5;
                    setTimeout(() => {
                        if (this.spiritMesh && this.spiritMesh.children[0]) {
                            this.spiritMesh.children[0].material.emissiveIntensity = originalIntensity;
                        }
                    }, 200);
                }
            }
        };
        animateSoul();
    }
    
    resurrect() {
        if (!this.canResurrect || !this.isActive) return;
        
        // Create resurrection effect
        this.createResurrectionEffect();
        
        // Restore player
        setTimeout(() => {
            this.deactivate();
            
            // Restore health
            this.player.health = this.player.maxHealth;
            
            // Grant bonus for successful martyrdom
            if (this.player.addExperience) {
                this.player.addExperience(this.killsInMartyrdom * 100);
            }
            
            // Message
            if (this.player.game && this.player.game.narrativeSystem) {
                this.player.game.narrativeSystem.displaySubtitle(
                    `RESURRECTED! ${this.killsInMartyrdom} revenge kills completed!`
                );
            }
        }, 2000);
    }
    
    createResurrectionEffect() {
        // Golden explosion
        const explosionGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd00,
            transparent: true,
            opacity: 1
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.player.position);
        this.scene.add(explosion);
        
        // Expand
        const expandExplosion = () => {
            explosion.scale.multiplyScalar(1.2);
            explosion.material.opacity *= 0.95;
            
            if (explosion.material.opacity > 0.01) {
                requestAnimationFrame(expandExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        expandExplosion();
        
        // Light rays
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rayGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 4);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.6
            });
            
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            ray.position.copy(this.player.position);
            ray.rotation.z = angle;
            this.scene.add(ray);
            
            // Fade ray
            const fadeRay = () => {
                ray.material.opacity *= 0.9;
                ray.scale.x *= 0.95;
                ray.scale.z *= 0.95;
                
                if (ray.material.opacity > 0.01) {
                    requestAnimationFrame(fadeRay);
                } else {
                    this.scene.remove(ray);
                }
            };
            setTimeout(fadeRay, 500);
        }
    }
    
    startCountdown() {
        const updateCountdown = () => {
            if (!this.isActive) return;
            
            const elapsed = Date.now() - this.activationTime;
            const remaining = Math.max(0, this.spiritDuration - elapsed);
            
            if (remaining <= 0) {
                this.deactivate();
                return;
            }
            
            // Update UI
            const seconds = Math.ceil(remaining / 1000);
            if (this.player.game && this.player.game.narrativeSystem) {
                // Only show countdown in last 5 seconds
                if (seconds <= 5) {
                    this.player.game.narrativeSystem.displaySubtitle(
                        `Martyrdom ending in ${seconds}...`
                    );
                }
            }
            
            // Continue countdown
            setTimeout(updateCountdown, 100);
        };
        updateCountdown();
    }
    
    deactivate() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Restore original properties
        this.player.moveSpeed = this.originalProperties.moveSpeed;
        this.player.damageMultiplier = this.originalProperties.damageMultiplier;
        this.player.canTakeDamage = this.originalProperties.canTakeDamage;
        this.player.canFly = false;
        this.player.gravity = -30;
        
        // Remove spirit mesh
        if (this.spiritMesh && this.spiritMesh.parent) {
            this.spiritMesh.parent.remove(this.spiritMesh);
        }
        
        // Restore original mesh
        if (this.originalMesh) {
            this.originalMesh.visible = true;
        }
        
        // Stop righteous fury
        this.abilities.righteousFury.active = false;
        
        // Final message
        if (this.player.game && this.player.game.narrativeSystem) {
            if (this.player.health <= 0) {
                this.player.game.narrativeSystem.displaySubtitle(
                    `Martyrdom ended. ${this.killsInMartyrdom} enemies vanquished.`
                );
            }
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Check for timeout
        const elapsed = Date.now() - this.activationTime;
        if (elapsed >= this.spiritDuration) {
            this.deactivate();
        }
        
        // Update vengeance trail
        if (this.player.velocity && this.player.velocity.length() > 0.1) {
            this.createVengeanceTrail();
        }
        this.updateVengeanceTrail();
    }
    
    createVengeanceTrail() {
        const trail = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 4, 4),
            new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.6
            })
        );
        
        trail.position.copy(this.player.position);
        this.scene.add(trail);
        
        this.vengeanceTrail.push({
            mesh: trail,
            createdAt: Date.now()
        });
    }
    
    updateVengeanceTrail() {
        const now = Date.now();
        
        for (let i = this.vengeanceTrail.length - 1; i >= 0; i--) {
            const trail = this.vengeanceTrail[i];
            const age = now - trail.createdAt;
            
            if (age > 1000) {
                this.scene.remove(trail.mesh);
                this.vengeanceTrail.splice(i, 1);
            } else {
                trail.mesh.material.opacity = 0.6 * (1 - age / 1000);
                trail.mesh.scale.multiplyScalar(0.98);
            }
        }
    }
    
    // Input handlers
    onKeyPress(key) {
        if (!this.isActive) return;
        
        switch(key.toLowerCase()) {
            case 'q':
                this.useDivineBlast();
                break;
            case 'e':
                this.useSeekingVengeance();
                break;
            case 'r':
                if (this.canResurrect) {
                    this.resurrect();
                }
                break;
        }
    }
}
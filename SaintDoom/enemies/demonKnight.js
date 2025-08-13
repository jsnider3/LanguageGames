import * as THREE from 'three';
// Demon Knight Enemy Type
// Heavy armored demon with shield that must be broken

import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';

export class DemonKnight extends BaseEnemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Shield mechanics
        this.hasShield = true;
        this.shieldHealth = 60;
        this.maxShieldHealth = 60;
        this.shieldBroken = false;
        this.shieldRegenDelay = 8000; // 8 seconds to start regen
        this.shieldBreakTime = 0;
        this.shieldRegenRate = 5; // Per second
        
        // Combat abilities
        this.chargeSpeed = 8;
        this.chargeDamage = 50;
        this.chargeCooldown = 5000;
        this.lastChargeTime = 0;
        this.isCharging = false;
        this.chargeTarget = null;
        
        // Sword slam
        this.slamCooldown = 3000;
        this.lastSlamTime = 0;
        this.slamRadius = 6;
        this.slamDamage = 30;
        
        // Defensive stance
        this.isDefending = false;
        this.defendDuration = 2000;
        this.defendStartTime = 0;
        
        // Override mesh
        this.scene.remove(this.mesh);
        this.createKnightMesh();
        
        // Combat state
        this.combatStance = 'aggressive'; // aggressive, defensive, berserk
    }
    
    createKnightMesh() {
        const group = new THREE.Group();
        
        // Armored body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.6);
        const armorMaterial = new THREE.MeshPhongMaterial({
            color: THEME.enemies.demonic.skin,
            emissive: THEME.enemies.demonic.glow,
            emissiveIntensity: 0.2
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, armorMaterial);
        this.bodyMesh.position.y = 0.9;
        group.add(this.bodyMesh);
        
        // Demon spikes on armor
        this.addArmorSpikes(this.bodyMesh);
        
        // Helmet with horns
        const helmetGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        this.helmetMesh = new THREE.Mesh(helmetGeometry, armorMaterial);
        this.helmetMesh.position.y = 1.9;
        group.add(this.helmetMesh);
        
        // Demon horns
        const hornGeometry = new THREE.ConeGeometry(0.08, 0.4, 4);
        const hornMaterial = new THREE.MeshPhongMaterial({
            color: THEME.materials.metal.dark,
            emissive: THEME.enemies.demonic.glow,
            emissiveIntensity: 0.3
        });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.2, 2.2, 0);
        leftHorn.rotation.z = -0.3;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.2, 2.2, 0);
        rightHorn.rotation.z = 0.3;
        group.add(rightHorn);
        
        // Glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: THEME.enemies.demonic.eyes
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.9, 0.25);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.9, 0.25);
        group.add(rightEye);
        
        // Demon sword
        this.createDemonSword(group);
        
        // Shield
        this.createShield(group);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.8, 6);
        const leftLeg = new THREE.Mesh(legGeometry, armorMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, armorMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        group.add(rightLeg);
        
        // Dark aura
        this.createDarkAura(group);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Shadows
        this.bodyMesh.castShadow = true;
        this.helmetMesh.castShadow = true;
    }
    
    addArmorSpikes(parentMesh) {
        const spikeCount = 6;
        const spikeGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
        const spikeMaterial = new THREE.MeshPhongMaterial({
            color: THEME.materials.black
        });
        
        for (let i = 0; i < spikeCount; i++) {
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(
                (Math.random() - 0.5) * 0.6,
                (Math.random() - 0.5) * 1.4,
                0.31
            );
            spike.rotation.x = Math.PI / 2;
            parentMesh.add(spike);
        }
    }
    
    createDemonSword(parent) {
        const swordGroup = new THREE.Group();
        
        // Blade
        const bladeGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.02);
        const bladeMaterial = new THREE.MeshPhongMaterial({
            color: THEME.bosses.belial.primary,
            emissive: THEME.ui.health.low,
            emissiveIntensity: 0.3
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.75;
        swordGroup.add(blade);
        
        // Jagged edges
        for (let i = 0; i < 5; i++) {
            const toothGeometry = new THREE.ConeGeometry(0.03, 0.1, 3);
            const tooth = new THREE.Mesh(toothGeometry, bladeMaterial);
            tooth.position.set(0.05, i * 0.3, 0);
            tooth.rotation.z = Math.PI / 2;
            swordGroup.add(tooth);
            
            const tooth2 = tooth.clone();
            tooth2.position.x = -0.05;
            tooth2.rotation.z = -Math.PI / 2;
            swordGroup.add(tooth2);
        }
        
        // Hilt
        const hiltGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6);
        const hiltMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333
        });
        const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
        hilt.position.y = -0.15;
        swordGroup.add(hilt);
        
        // Cross guard
        const guardGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05);
        const guard = new THREE.Mesh(guardGeometry, hiltMaterial);
        swordGroup.add(guard);
        
        // Fire effect on blade
        this.createBladeFireEffect(blade);
        
        swordGroup.position.set(0.6, 1, 0.2);
        swordGroup.rotation.z = -0.3;
        parent.add(swordGroup);
        
        this.swordMesh = swordGroup;
    }
    
    createShield(parent) {
        const shieldGroup = new THREE.Group();
        
        // Shield base
        const shieldGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
        const shieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: THEME.materials.robeEmissive,
            emissiveIntensity: 0.2
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shieldGroup.add(shield);
        
        // Demon face emblem
        const emblemGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const emblemMaterial = new THREE.MeshPhongMaterial({
            color: THEME.effects.blood.demon,
            emissive: THEME.ui.health.low,
            emissiveIntensity: 0.4
        });
        const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
        emblem.position.z = 0.06;
        emblem.scale.z = 0.3;
        shieldGroup.add(emblem);
        
        // Shield spikes
        const corners = [
            { x: -0.25, y: 0.35 },
            { x: 0.25, y: 0.35 },
            { x: -0.25, y: -0.35 },
            { x: 0.25, y: -0.35 },
            { x: 0, y: 0 }
        ];
        
        corners.forEach(pos => {
            const spikeGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
            const spike = new THREE.Mesh(spikeGeometry, shieldMaterial);
            spike.position.set(pos.x, pos.y, 0.1);
            spike.rotation.x = Math.PI / 2;
            shieldGroup.add(spike);
        });
        
        // Energy barrier effect (when shield is active)
        const barrierGeometry = new THREE.PlaneGeometry(0.8, 1, 10, 10);
        const barrierMaterial = new THREE.MeshBasicMaterial({
            color: THEME.enemies.demonic.eyes,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.shieldBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        this.shieldBarrier.position.z = 0.15;
        shieldGroup.add(this.shieldBarrier);
        
        shieldGroup.position.set(-0.5, 1, 0.3);
        shieldGroup.rotation.y = 0.2;
        parent.add(shieldGroup);
        
        this.shieldMesh = shieldGroup;
    }
    
    createBladeFireEffect(blade) {
        // Particle system for flaming sword
        const fireParticles = new THREE.BufferGeometry();
        const particleCount = 20;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.1;
            positions[i * 3 + 1] = Math.random() * 1.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
            
            colors[i * 3] = 1;
            colors[i * 3 + 1] = Math.random() * 0.5;
            colors[i * 3 + 2] = 0;
        }
        
        fireParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        fireParticles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const fireMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        this.bladeFireParticles = new THREE.Points(fireParticles, fireMaterial);
        blade.add(this.bladeFireParticles);
    }
    
    createDarkAura(parent) {
        // Dark mist around the knight
        const auraGeometry = new THREE.SphereGeometry(1.5, 8, 6);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: THEME.materials.black,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.y = 1;
        parent.add(aura);
        
        // Animate aura
        const animateAura = () => {
            if (this.isDead) return;
            
            aura.scale.x = 1 + Math.sin(Date.now() * 0.002) * 0.1;
            aura.scale.y = 1 + Math.cos(Date.now() * 0.002) * 0.1;
            aura.scale.z = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            
            requestAnimationFrame(animateAura);
        };
        animateAura();
    }
    
    update(deltaTime, player) {
        if (this.isDead || this.state === 'dead') return;
        
        // Update shield
        this.updateShield(deltaTime);
        
        // Update blade fire particles
        if (this.bladeFireParticles) {
            const positions = this.bladeFireParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += deltaTime * 2;
                if (positions[i * 3 + 1] > 1.5) {
                    positions[i * 3 + 1] = 0;
                }
            }
            this.bladeFireParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update combat stance based on shield health
        if (this.shieldHealth <= 0 && !this.shieldBroken) {
            this.combatStance = 'berserk';
            this.moveSpeed = 4; // Faster when berserk
            this.damage = 45; // More damage
        } else if (this.shieldHealth < this.maxShieldHealth * 0.3) {
            this.combatStance = 'defensive';
        } else {
            this.combatStance = 'aggressive';
        }
        
        // Check for special attacks
        const distanceToPlayer = this.position.distanceTo(player.position);
        
        // Shield bash when close
        if (distanceToPlayer < 3 && this.hasShield && !this.shieldBroken) {
            this.attemptShieldBash(player);
        }
        
        // Charge attack when at medium range
        if (distanceToPlayer > 5 && distanceToPlayer < 15 && !this.isCharging) {
            this.attemptCharge(player);
        }
        
        // Sword slam when surrounded or damaged
        if (distanceToPlayer < this.slamRadius && this.health < this.maxHealth * 0.5) {
            this.attemptSwordSlam(player);
        }
        
        // Defensive stance when low health
        if (this.health < this.maxHealth * 0.3 && !this.isDefending) {
            this.enterDefensiveStance();
        }
        
        // Update defensive stance
        if (this.isDefending) {
            const now = Date.now();
            if (now - this.defendStartTime > this.defendDuration) {
                this.exitDefensiveStance();
            }
        }
        
        // Animate sword swing when attacking
        if (this.state === 'attacking' && this.swordMesh) {
            const swingSpeed = Date.now() * 0.01;
            this.swordMesh.rotation.z = -0.3 + Math.sin(swingSpeed) * 0.5;
        }
        
        // Parent update
        super.update(deltaTime, player);
    }
    
    updateShield(deltaTime) {
        if (this.shieldBroken) {
            // Check for shield regeneration
            const now = Date.now();
            if (now - this.shieldBreakTime > this.shieldRegenDelay) {
                // Regenerate shield
                this.shieldHealth = Math.min(
                    this.maxShieldHealth,
                    this.shieldHealth + this.shieldRegenRate * deltaTime
                );
                
                // Shield restored
                if (this.shieldHealth >= this.maxShieldHealth) {
                    this.shieldBroken = false;
                    this.hasShield = true;
                    this.shieldMesh.visible = true;
                    
                    // Effect
                    this.createShieldRestoreEffect();
                }
            }
        }
        
        // Update shield visual
        if (this.shieldBarrier && this.hasShield) {
            const healthPercent = this.shieldHealth / this.maxShieldHealth;
            this.shieldBarrier.material.opacity = 0.2 * healthPercent;
            
            // Flicker when low
            if (healthPercent < 0.3) {
                this.shieldBarrier.material.opacity *= (1 + Math.sin(Date.now() * 0.01) * 0.5);
            }
        }
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Shield absorbs damage first
        if (this.hasShield && this.shieldHealth > 0) {
            // Holy damage is more effective against shield
            if (damageType === 'holy') {
                damage *= 1.5;
            }
            
            const shieldDamage = Math.min(this.shieldHealth, damage);
            this.shieldHealth -= shieldDamage;
            
            // Shield break
            if (this.shieldHealth <= 0) {
                this.breakShield();
                // Excess damage goes to health
                const excessDamage = damage - shieldDamage;
                if (excessDamage > 0) {
                    super.takeDamage(excessDamage, damageType);
                }
            } else {
                // Shield hit effect
                this.createShieldHitEffect();
            }
            
            // Reduced damage while defending
            if (this.isDefending) {
                damage *= 0.3;
            }
        } else {
            // No shield, take full damage
            if (this.isDefending) {
                damage *= 0.5; // Still some reduction when defending
            }
            
            // Berserk mode takes more damage
            if (this.combatStance === 'berserk') {
                damage *= 1.2;
            }
            
            super.takeDamage(damage, damageType);
        }
    }
    
    breakShield() {
        this.shieldBroken = true;
        this.hasShield = false;
        this.shieldBreakTime = Date.now();
        
        // Visual effect
        this.createShieldBreakEffect();
        
        // Hide shield mesh
        if (this.shieldMesh) {
            this.shieldMesh.visible = false;
        }
        
        // Stun briefly
        this.state = 'stunned';
        setTimeout(() => {
            if (!this.isDead) {
                this.state = 'hostile';
            }
        }, 1000);
    }
    
    attemptShieldBash(player) {
        const now = Date.now();
        if (now - this.lastAttackTime < 2000) return;
        
        this.lastAttackTime = now;
        
        // Bash animation
        if (this.shieldMesh) {
            const originalPos = this.shieldMesh.position.x;
            this.shieldMesh.position.x -= 0.3;
            
            setTimeout(() => {
                if (this.shieldMesh) {
                    this.shieldMesh.position.x = originalPos;
                }
            }, 300);
        }
        
        // Check hit
        const distance = this.position.distanceTo(player.position);
        if (distance < 3) {
            player.takeDamage(20, "Demon Knight Sword");
            
            // Knockback
            const knockback = new THREE.Vector3()
                .subVectors(player.position, this.position)
                .normalize()
                .multiplyScalar(8);
            knockback.y = 3;
            
            if (player.applyKnockback) {
                player.applyKnockback(knockback);
            }
            
            // Stun effect
            this.createBashEffect(player.position);
        }
    }
    
    attemptCharge(player) {
        const now = Date.now();
        if (now - this.lastChargeTime < this.chargeCooldown || this.isCharging) return;
        
        this.lastChargeTime = now;
        this.isCharging = true;
        this.chargeTarget = player.position.clone();
        
        // Telegraph charge
        this.createChargeTelegraph();
        
        // Start charge after delay
        setTimeout(() => {
            if (!this.isDead) {
                this.performCharge();
            }
        }, 500);
    }
    
    performCharge() {
        const direction = new THREE.Vector3()
            .subVectors(this.chargeTarget, this.position)
            .normalize();
        
        const chargeDistance = this.position.distanceTo(this.chargeTarget);
        const chargeDuration = (chargeDistance / this.chargeSpeed) * 1000;
        
        // Create charge trail
        this.createChargeTrail();
        
        // Move rapidly
        const startPos = this.position.clone();
        const startTime = Date.now();
        
        const updateCharge = () => {
            if (this.isDead) {
                this.isCharging = false;
                return;
            }
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / chargeDuration, 1);
            
            this.position.lerpVectors(startPos, this.chargeTarget, progress);
            
            // Check collision with player
            if (this.target) {
                const distance = this.position.distanceTo(this.target.position);
                if (distance < 2) {
                    // Hit player
                    this.target.takeDamage(this.chargeDamage, "Demon Knight Charge");
                    
                    // Massive knockback
                    const knockback = direction.clone().multiplyScalar(15);
                    knockback.y = 5;
                    
                    if (this.target.applyKnockback) {
                        this.target.applyKnockback(knockback);
                    }
                    
                    this.isCharging = false;
                    this.createChargeImpact(this.target.position);
                    return;
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCharge);
            } else {
                this.isCharging = false;
                // Missed - brief recovery
                this.state = 'stunned';
                setTimeout(() => {
                    if (!this.isDead) {
                        this.state = 'hostile';
                    }
                }, 500);
            }
        };
        updateCharge();
    }
    
    attemptSwordSlam(player) {
        const now = Date.now();
        if (now - this.lastSlamTime < this.slamCooldown) return;
        
        this.lastSlamTime = now;
        
        // Raise sword
        if (this.swordMesh) {
            const raiseSword = () => {
                if (this.swordMesh.rotation.z > -1.5) {
                    this.swordMesh.rotation.z -= 0.1;
                    this.swordMesh.position.y += 0.02;
                    requestAnimationFrame(raiseSword);
                } else {
                    // Slam down
                    setTimeout(() => this.performSwordSlam(player), 200);
                }
            };
            raiseSword();
        }
    }
    
    performSwordSlam(player) {
        // Slam animation
        if (this.swordMesh) {
            this.swordMesh.rotation.z = -0.3;
            this.swordMesh.position.y = 1;
        }
        
        // Create shockwave
        const shockwaveGeometry = new THREE.RingGeometry(0.5, 1, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: THEME.enemies.demonic.eyes,
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
        this.createGroundCracks();
        
        // Expand shockwave
        const expandShockwave = () => {
            shockwave.scale.x += 0.4;
            shockwave.scale.y += 0.4;
            shockwave.material.opacity *= 0.92;
            
            // Check player collision
            if (this.target) {
                const distance = new THREE.Vector2(
                    this.position.x - this.target.position.x,
                    this.position.z - this.target.position.z
                ).length();
                
                const ringRadius = shockwave.scale.x;
                if (Math.abs(distance - ringRadius) < 1 && shockwave.material.opacity > 0.3) {
                    // Damage player
                    this.target.takeDamage(this.slamDamage, "Demon Knight Ground Slam");
                    
                    // Upward knockback
                    const knockback = new THREE.Vector3(0, 10, 0);
                    if (this.target.applyKnockback) {
                        this.target.applyKnockback(knockback);
                    }
                    
                    shockwave.material.opacity = 0.3; // Prevent multiple hits
                }
            }
            
            if (shockwave.scale.x < this.slamRadius) {
                requestAnimationFrame(expandShockwave);
            } else {
                this.scene.remove(shockwave);
            }
        };
        expandShockwave();
    }
    
    enterDefensiveStance() {
        this.isDefending = true;
        this.defendStartTime = Date.now();
        this.moveSpeed *= 0.5; // Slower while defending
        
        // Raise shield
        if (this.shieldMesh) {
            this.shieldMesh.position.x = -0.3;
            this.shieldMesh.position.z = 0.5;
            this.shieldMesh.scale.multiplyScalar(1.2);
        }
        
        // Defensive aura
        this.createDefensiveAura();
    }
    
    exitDefensiveStance() {
        this.isDefending = false;
        this.moveSpeed = 2; // Normal speed
        
        // Lower shield
        if (this.shieldMesh) {
            this.shieldMesh.position.x = -0.5;
            this.shieldMesh.position.z = 0.3;
            this.shieldMesh.scale.multiplyScalar(1 / 1.2);
        }
    }
    
    createShieldHitEffect() {
        // Ripple on shield
        const ripple = new THREE.Mesh(
            new THREE.RingGeometry(0.1, 0.3, 16),
            new THREE.MeshBasicMaterial({
                color: THEME.enemies.demonic.eyes,
                transparent: true,
                opacity: 0.8
            })
        );
        
        if (this.shieldMesh) {
            ripple.position.copy(this.shieldMesh.position);
            ripple.position.z += 0.2;
            this.mesh.add(ripple);
            
            // Expand ripple
            const expandRipple = () => {
                ripple.scale.multiplyScalar(1.1);
                ripple.material.opacity *= 0.9;
                
                if (ripple.material.opacity > 0.01) {
                    requestAnimationFrame(expandRipple);
                } else {
                    this.mesh.remove(ripple);
                }
            };
            expandRipple();
        }
    }
    
    createShieldBreakEffect() {
        // Shatter particles
        for (let i = 0; i < 20; i++) {
            const fragment = new THREE.Mesh(
                new THREE.TetrahedronGeometry(0.1),
                new THREE.MeshPhongMaterial({
                    color: 0x222222,
                    metalness: 0.8
                })
            );
            
            fragment.position.copy(this.shieldMesh.position);
            this.mesh.localToWorld(fragment.position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );
            
            this.scene.add(fragment);
            
            // Animate fragment
            const animateFragment = () => {
                fragment.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.2;
                fragment.rotation.x += 0.1;
                fragment.rotation.y += 0.1;
                
                if (fragment.position.y > -2) {
                    requestAnimationFrame(animateFragment);
                } else {
                    this.scene.remove(fragment);
                }
            };
            animateFragment();
        }
    }
    
    createShieldRestoreEffect() {
        // Energy gathering
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: THEME.enemies.demonic.eyes,
                    transparent: true,
                    opacity: 1
                })
            );
            
            const angle = (i / 30) * Math.PI * 2;
            const radius = 2;
            particle.position.set(
                this.position.x + Math.cos(angle) * radius,
                this.position.y + Math.random() * 2,
                this.position.z + Math.sin(angle) * radius
            );
            
            this.scene.add(particle);
            
            // Converge on shield
            const convergeParticle = () => {
                const toShield = new THREE.Vector3()
                    .subVectors(this.shieldMesh.position, particle.position);
                
                if (toShield.length() > 0.2) {
                    particle.position.add(toShield.normalize().multiplyScalar(0.1));
                    requestAnimationFrame(convergeParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            convergeParticle();
        }
    }
    
    createChargeTelegraph() {
        // Red warning line
        const points = [
            this.position.clone(),
            this.chargeTarget.clone()
        ];
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: THEME.enemies.demonic.eyes,
            transparent: true,
            opacity: 0.6
        });
        
        const warningLine = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(warningLine);
        
        // Flash and fade
        const flashLine = () => {
            warningLine.material.opacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.3;
            requestAnimationFrame(flashLine);
        };
        flashLine();
        
        // Remove after charge starts
        setTimeout(() => {
            this.scene.remove(warningLine);
        }, 500);
    }
    
    createChargeTrail() {
        const trailInterval = setInterval(() => {
            if (!this.isCharging) {
                clearInterval(trailInterval);
                return;
            }
            
            const trail = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.5, 0.5),
                new THREE.MeshBasicMaterial({
                    color: 0x330000,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            trail.position.copy(this.position);
            trail.position.y = 0.5;
            this.scene.add(trail);
            
            // Fade trail
            const fadeTrail = () => {
                trail.material.opacity *= 0.95;
                trail.scale.multiplyScalar(0.95);
                
                if (trail.material.opacity > 0.01) {
                    requestAnimationFrame(fadeTrail);
                } else {
                    this.scene.remove(trail);
                }
            };
            fadeTrail();
        }, 50);
    }
    
    createChargeImpact(position) {
        // Impact explosion
        const impact = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshBasicMaterial({
                color: THEME.enemies.demonic.eyes,
                transparent: true,
                opacity: 0.8
            })
        );
        
        impact.position.copy(position);
        this.scene.add(impact);
        
        // Expand
        const expandImpact = () => {
            impact.scale.multiplyScalar(1.1);
            impact.material.opacity *= 0.9;
            
            if (impact.material.opacity > 0.01) {
                requestAnimationFrame(expandImpact);
            } else {
                this.scene.remove(impact);
            }
        };
        expandImpact();
    }
    
    createGroundCracks() {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const crackGeometry = new THREE.PlaneGeometry(0.2, 2);
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: THEME.materials.black,
                transparent: true,
                opacity: 0.6
            });
            
            const crack = new THREE.Mesh(crackGeometry, crackMaterial);
            crack.position.copy(this.position);
            crack.position.y = 0.01;
            crack.rotation.x = -Math.PI / 2;
            crack.rotation.z = angle;
            
            this.scene.add(crack);
            
            // Fade
            const fadeCrack = () => {
                crack.material.opacity *= 0.98;
                if (crack.material.opacity > 0.01) {
                    requestAnimationFrame(fadeCrack);
                } else {
                    this.scene.remove(crack);
                }
            };
            setTimeout(fadeCrack, 1000);
        }
    }
    
    createBashEffect(position) {
        // Stun stars
        for (let i = 0; i < 5; i++) {
            const star = new THREE.Mesh(
                new THREE.TetrahedronGeometry(0.1),
                new THREE.MeshBasicMaterial({
                    color: THEME.ui.health.medium,
                    transparent: true,
                    opacity: 1
                })
            );
            
            const angle = (i / 5) * Math.PI * 2;
            star.position.copy(position);
            star.position.y += 1.5;
            
            this.scene.add(star);
            
            // Orbit and fade
            const animateStar = () => {
                const time = Date.now() * 0.005;
                star.position.x = position.x + Math.cos(angle + time) * 0.5;
                star.position.z = position.z + Math.sin(angle + time) * 0.5;
                star.material.opacity *= 0.98;
                
                if (star.material.opacity > 0.01) {
                    requestAnimationFrame(animateStar);
                } else {
                    this.scene.remove(star);
                }
            };
            animateStar();
        }
    }
    
    createDefensiveAura() {
        const auraGeometry = new THREE.SphereGeometry(2, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.copy(this.position);
        this.scene.add(aura);
        
        // Pulse and fade
        const pulseAura = () => {
            if (!this.isDefending) {
                aura.material.opacity *= 0.9;
                if (aura.material.opacity > 0.01) {
                    requestAnimationFrame(pulseAura);
                } else {
                    this.scene.remove(aura);
                }
            } else {
                aura.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
                requestAnimationFrame(pulseAura);
            }
        };
        pulseAura();
    }
    
    onDeath() {
        super.onDeath();
        
        // Drop sword
        if (this.swordMesh) {
            // Could spawn as pickup
        }
        
        // Shield fragments
        if (this.shieldMesh && !this.shieldBroken) {
            this.createShieldBreakEffect();
        }
    }
}
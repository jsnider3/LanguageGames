import * as THREE from 'three';
import { THEME } from '../modules/config/theme.js';

// Holy Lance Weapon
// Medieval reach weapon with charging attack that pierces multiple enemies

export class HolyLance {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Weapon stats
        this.damage = 50;
        this.reach = 5;
        this.chargeTime = 1000; // milliseconds to full charge
        this.piercingDamage = 75; // When fully charged
        this.cooldown = 500;
        this.lastAttackTime = 0;
        
        // Charge state
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeLevel = 0;
        
        // Thrown state (alt-fire)
        this.isThrown = false;
        this.throwSpeed = 30;
        this.maxThrowDistance = 20;
        this.returnSpeed = 15;
        this.thrownLance = null;
        
        // Create weapon mesh
        this.createLanceMesh();
        
        // Blessed state
        this.isBlessed = true;
        this.holyDamageMultiplier = 1.5;
    }
    
    createLanceMesh() {
        const group = new THREE.Group();
        
        // Shaft
        const shaftGeometry = new THREE.CylinderGeometry(0.03, 0.05, 2.5, 8);
        const shaftMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            emissive: 0x442211,
            emissiveIntensity: 0.1,
            roughness: 0.8,
            metalness: 0.1
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = -0.5;
        group.add(shaft);
        
        // Lance tip
        const tipGeometry = new THREE.ConeGeometry(0.08, 0.4, 6);
        const tipMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            emissive: THEME.lights.point.holy,
            emissiveIntensity: 0.2,
            metalness: 0.9,
            roughness: 0.2
        });
        this.tip = new THREE.Mesh(tipGeometry, tipMaterial);
        this.tip.position.y = 0.95;
        group.add(this.tip);
        
        // Cross guard
        const guardGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05);
        const guardMaterial = new THREE.MeshStandardMaterial({
            color: 0xccaa00,
            metalness: 0.8,
            roughness: 0.3
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.y = 0.7;
        group.add(guard);
        
        // Holy inscription
        const inscriptionGeometry = new THREE.PlaneGeometry(0.3, 0.05);
        const inscriptionMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdd00,
            emissive: 0xffdd00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });
        const inscription = new THREE.Mesh(inscriptionGeometry, inscriptionMaterial);
        inscription.position.y = 0;
        inscription.position.z = 0.06;
        group.add(inscription);
        
        // Holy glow
        const glowLight = new THREE.PointLight(0xffffaa, 0.3, 3);
        glowLight.position.y = 0.9;
        group.add(glowLight);
        this.glowLight = glowLight;
        
        this.mesh = group;
        
        // Position relative to player camera
        this.updatePosition();
    }
    
    show() {
        if (this.player && this.player.camera && this.mesh) {
            this.player.camera.add(this.mesh);
            this.mesh.visible = true;
        }
    }

    hide() {
        if (this.player && this.player.camera && this.mesh) {
            this.player.camera.remove(this.mesh);
            this.mesh.visible = false;
        }
    }

    updatePosition() {
        if (!this.player || !this.player.camera || this.isThrown) return;
        
        // Position lance in front-right of camera
        this.mesh.position.set(0.5, -0.3, -1);
        this.mesh.rotation.set(0, 0, 0.2);
        
        // Charging position
        if (this.isCharging) {
            const chargeProgress = this.getChargeProgress();
            this.mesh.position.z = -1 - chargeProgress * 0.3; // Pull back
            this.mesh.position.x = 0.5 - chargeProgress * 0.1;
        }
        
        // Bob animation
        const bobAmount = Math.sin(Date.now() * 0.002) * 0.02;
        this.mesh.position.y += bobAmount;
    }
    
    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime < this.cooldown || this.isThrown) return false;
        
        if (this.isCharging) {
            // Release charge attack
            this.releaseCharge();
        } else {
            // Quick thrust
            this.quickThrust();
        }
        
        this.lastAttackTime = now;
        return true;
    }
    
    startCharge() {
        if (this.isThrown) return;
        
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        
        // Visual feedback
        this.glowLight.intensity = 0.5;
        this.tip.material.emissiveIntensity = 0.4;
    }
    
    releaseCharge() {
        const chargeProgress = this.getChargeProgress();
        this.isCharging = false;
        
        if (chargeProgress >= 1) {
            // Fully charged piercing attack
            this.chargedThrust();
        } else if (chargeProgress >= 0.5) {
            // Partially charged attack
            this.powerThrust(chargeProgress);
        } else {
            // Too short, regular attack
            this.quickThrust();
        }
        
        // Reset visuals
        this.glowLight.intensity = 0.3;
        this.tip.material.emissiveIntensity = 0.2;
    }
    
    getChargeProgress() {
        if (!this.isCharging) return 0;
        return Math.min((Date.now() - this.chargeStartTime) / this.chargeTime, 1);
    }
    
    quickThrust() {
        // Thrust animation
        this.animateThrust(0.5);
        
        // Check hits
        this.checkMeleeHits(this.damage, 1);
        
        // Sound effect
        this.playThrustSound();
    }
    
    powerThrust(chargeLevel) {
        // Enhanced thrust
        this.animateThrust(0.7);
        
        const damage = this.damage * (1 + chargeLevel);
        this.checkMeleeHits(damage, 2);
        
        // Create energy wave
        this.createEnergyWave(chargeLevel);
        
        this.playPowerThrustSound();
    }
    
    chargedThrust() {
        // Full power piercing attack
        this.animateThrust(1);
        
        // Create piercing beam
        this.createPiercingBeam();
        
        // Check all enemies in line
        this.checkPiercingHits();
        
        this.playChargedThrustSound();
    }
    
    animateThrust(power) {
        const startPos = this.mesh.position.z;
        const thrustDistance = 0.5 + power * 0.5;
        
        const thrust = () => {
            if (this.mesh.position.z > startPos - thrustDistance) {
                this.mesh.position.z -= 0.1;
                requestAnimationFrame(thrust);
            } else {
                // Return to position
                const returnAnim = () => {
                    if (this.mesh.position.z < startPos) {
                        this.mesh.position.z += 0.05;
                        requestAnimationFrame(returnAnim);
                    }
                };
                returnAnim();
            }
        };
        thrust();
    }
    
    checkMeleeHits(damage, maxHits = 1) {
        if (!this.player.game || !this.player.game.enemies) return;
        
        const raycaster = new THREE.Raycaster();
        raycaster.set(
            this.player.camera.position,
            this.player.camera.getWorldDirection(new THREE.Vector3())
        );
        
        let hits = 0;
        this.player.game.enemies.forEach(enemy => {
            if (enemy && !enemy.isDead && hits < maxHits) {
                const distance = enemy.position.distanceTo(this.player.position);
                
                if (distance <= this.reach) {
                    // Check angle to enemy
                    const toEnemy = new THREE.Vector3()
                        .subVectors(enemy.position, this.player.position)
                        .normalize();
                    const forward = this.player.camera.getWorldDirection(new THREE.Vector3());
                    const dot = toEnemy.dot(forward);
                    
                    if (dot > 0.7) { // Within ~45 degree cone
                        const finalDamage = this.isBlessed ? damage * this.holyDamageMultiplier : damage;
                        enemy.takeDamage(finalDamage, 'holy');
                        
                        // Knockback
                        const knockback = forward.clone().multiplyScalar(5);
                        enemy.applyKnockback(knockback);
                        
                        hits++;
                        
                        // Visual hit effect
                        this.createHitEffect(enemy.position);
                    }
                }
            }
        });
    }
    
    checkPiercingHits() {
        if (!this.player.game || !this.player.game.enemies) return;
        
        const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
        const maxDistance = this.reach * 3;
        
        this.player.game.enemies.forEach(enemy => {
            if (enemy && !enemy.isDead) {
                // Project enemy onto lance line
                const toEnemy = new THREE.Vector3()
                    .subVectors(enemy.position, this.player.position);
                const projection = toEnemy.dot(direction);
                
                if (projection > 0 && projection < maxDistance) {
                    // Check perpendicular distance
                    const onLine = direction.clone().multiplyScalar(projection);
                    const perpDistance = new THREE.Vector3()
                        .subVectors(toEnemy, onLine)
                        .length();
                    
                    if (perpDistance < 1) {
                        const finalDamage = this.isBlessed ? 
                            this.piercingDamage * this.holyDamageMultiplier : 
                            this.piercingDamage;
                        
                        enemy.takeDamage(finalDamage, 'holy');
                        
                        // Strong knockback
                        const knockback = direction.clone().multiplyScalar(10);
                        enemy.applyKnockback(knockback);
                        
                        // Pierce effect
                        this.createPierceEffect(enemy.position);
                    }
                }
            }
        });
    }
    
    createEnergyWave(power) {
        const waveGeometry = new THREE.RingGeometry(0.5, 1, 16);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: THEME.lights.point.holy,
            transparent: true,
            opacity: 0.6 * power,
            side: THREE.DoubleSide
        });
        
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(this.player.position);
        wave.position.y += 1;
        
        const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
        wave.lookAt(wave.position.clone().add(direction));
        
        this.scene.add(wave);
        
        // Animate wave
        const animateWave = () => {
            wave.position.add(direction.clone().multiplyScalar(0.3));
            wave.scale.multiplyScalar(1.05);
            wave.material.opacity *= 0.92;
            
            if (wave.material.opacity > 0.01) {
                requestAnimationFrame(animateWave);
            } else {
                this.scene.remove(wave);
            }
        };
        animateWave();
    }
    
    createPiercingBeam() {
        const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
        const beamLength = this.reach * 3;
        
        // Create beam geometry
        const points = [
            this.player.position.clone().add(new THREE.Vector3(0, 1, 0)),
            this.player.position.clone()
                .add(new THREE.Vector3(0, 1, 0))
                .add(direction.clone().multiplyScalar(beamLength))
        ];
        
        const beamGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const beamMaterial = new THREE.LineBasicMaterial({
            color: THEME.lights.point.holy,
            linewidth: 5,
            transparent: true,
            opacity: 0.8
        });
        
        const beam = new THREE.Line(beamGeometry, beamMaterial);
        this.scene.add(beam);
        
        // Add glow cylinder
        const glowGeometry = new THREE.CylinderGeometry(0.3, 0.1, beamLength, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: THEME.lights.point.holy,
            transparent: true,
            opacity: 0.3
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(this.player.position)
            .add(new THREE.Vector3(0, 1, 0))
            .add(direction.clone().multiplyScalar(beamLength / 2));
        glow.lookAt(glow.position.clone().add(direction));
        glow.rotateX(Math.PI / 2);
        
        this.scene.add(glow);
        
        // Fade out
        const fadeBeam = () => {
            beam.material.opacity *= 0.9;
            glow.material.opacity *= 0.9;
            
            if (beam.material.opacity > 0.01) {
                requestAnimationFrame(fadeBeam);
            } else {
                this.scene.remove(beam);
                this.scene.remove(glow);
            }
        };
        
        setTimeout(fadeBeam, 100);
    }
    
    // Alt-fire: Throw lance like javelin
    throwLance() {
        if (this.isThrown) return;
        
        this.isThrown = true;
        
        // Remove from hand
        if (this.player.camera && this.mesh.parent === this.player.camera) {
            this.player.camera.remove(this.mesh);
        }
        
        // Create thrown lance
        const thrownGroup = this.mesh.clone();
        thrownGroup.position.copy(this.player.position);
        thrownGroup.position.y += 1.5;
        
        const direction = this.player.camera.getWorldDirection(new THREE.Vector3());
        
        this.scene.add(thrownGroup);
        
        this.thrownLance = {
            mesh: thrownGroup,
            velocity: direction.clone().multiplyScalar(this.throwSpeed),
            startPosition: thrownGroup.position.clone(),
            traveled: 0,
            hitEnemies: []
        };
        
        // Hide held lance
        this.mesh.visible = false;
    }
    
    updateThrownLance(deltaTime) {
        if (!this.thrownLance) return;
        
        const lance = this.thrownLance;
        
        // Update position
        lance.mesh.position.add(lance.velocity.clone().multiplyScalar(deltaTime));
        lance.traveled += lance.velocity.length() * deltaTime;
        
        // Rotate lance
        lance.mesh.rotateX(0.2);
        
        // Check enemy collisions
        if (this.player.game && this.player.game.enemies) {
            this.player.game.enemies.forEach(enemy => {
                if (enemy && !enemy.isDead && !lance.hitEnemies.includes(enemy)) {
                    const distance = enemy.position.distanceTo(lance.mesh.position);
                    
                    if (distance < 1) {
                        // Hit enemy
                        const damage = this.isBlessed ? 
                            this.piercingDamage * this.holyDamageMultiplier : 
                            this.piercingDamage;
                        
                        enemy.takeDamage(damage, 'holy');
                        
                        // Pin to wall effect
                        const knockback = lance.velocity.clone().normalize().multiplyScalar(8);
                        enemy.applyKnockback(knockback);
                        
                        lance.hitEnemies.push(enemy);
                        
                        this.createPierceEffect(enemy.position);
                    }
                }
            });
        }
        
        // Check max distance or return
        if (lance.traveled >= this.maxThrowDistance) {
            this.returnLance();
        }
    }
    
    returnLance() {
        if (!this.thrownLance) return;
        
        const lance = this.thrownLance;
        
        // Animate return
        const returnAnimation = () => {
            const toPlayer = new THREE.Vector3()
                .subVectors(this.player.position, lance.mesh.position);
            
            if (toPlayer.length() > 1) {
                lance.mesh.position.add(
                    toPlayer.normalize().multiplyScalar(this.returnSpeed * 0.016)
                );
                lance.mesh.rotateY(0.3);
                requestAnimationFrame(returnAnimation);
            } else {
                // Lance returned
                this.scene.remove(lance.mesh);
                this.thrownLance = null;
                this.isThrown = false;
                this.mesh.visible = true;
                
                // Reattach to camera
                if (this.player.camera) {
                    this.player.camera.add(this.mesh);
                }
            }
        };
        
        returnAnimation();
    }
    
    createHitEffect(position) {
        // Holy impact effect
        const impactGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const impactMaterial = new THREE.MeshBasicMaterial({
            color: THEME.lights.point.holy,
            transparent: true,
            opacity: 0.6
        });
        
        const impact = new THREE.Mesh(impactGeometry, impactMaterial);
        impact.position.copy(position);
        this.scene.add(impact);
        
        // Animate
        const animateImpact = () => {
            impact.scale.multiplyScalar(1.1);
            impact.material.opacity *= 0.9;
            
            if (impact.material.opacity > 0.01) {
                requestAnimationFrame(animateImpact);
            } else {
                this.scene.remove(impact);
            }
        };
        animateImpact();
    }
    
    createPierceEffect(position) {
        // Create holy light burst
        for (let i = 0; i < 10; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: THEME.lights.point.holy,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 3,
                (Math.random() - 0.5) * 5
            );
            
            this.scene.add(particle);
            
            // Animate
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                particle.material.opacity *= 0.95;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    playThrustSound() {
        // Swoosh sound
    }
    
    playPowerThrustSound() {
        // Enhanced swoosh with energy
    }
    
    playChargedThrustSound() {
        // Powerful energy release sound
    }
    
    update(deltaTime) {
        // Update position
        this.updatePosition();
        
        // Update charge visuals
        if (this.isCharging) {
            const progress = this.getChargeProgress();
            this.glowLight.intensity = 0.3 + progress * 0.7;
            this.tip.material.emissiveIntensity = 0.2 + progress * 0.6;
            
            // Charge particles
            if (Math.random() < progress) {
                this.createChargeParticle();
            }
        }
        
        // Update thrown lance
        if (this.isThrown && this.thrownLance) {
            this.updateThrownLance(deltaTime);
        }
    }
    
    createChargeParticle() {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 4, 4),
            new THREE.MeshBasicMaterial({
                color: THEME.lights.point.holy,
                transparent: true,
                opacity: 1
            })
        );
        
        // Start near tip
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            0.9 + Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        
        particle.position.copy(this.mesh.position).add(offset);
        
        if (this.mesh.parent) {
            this.mesh.parent.add(particle);
        }
        
        // Animate toward tip
        const animateParticle = () => {
            particle.position.y += 0.01;
            particle.material.opacity *= 0.95;
            
            if (particle.material.opacity > 0.01) {
                requestAnimationFrame(animateParticle);
            } else {
                if (particle.parent) {
                    particle.parent.remove(particle);
                }
            }
        };
        animateParticle();
    }
}
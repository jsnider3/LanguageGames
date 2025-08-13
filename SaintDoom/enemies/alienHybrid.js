import * as THREE from 'three';
import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';

export class AlienHybrid extends BaseEnemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Alien hybrid specific properties
        this.alienTech = this.generateAlienTech();
        this.psychicPower = 100;
        this.maxPsychicPower = 100;
        this.telekinesisCooldown = 3000;
        this.lastTelekinesisUse = 0;
        this.mindBlastCooldown = 5000;
        this.lastMindBlastUse = 0;
        this.adaptationLevel = 0; // Learns from player attacks
        this.maxAdaptation = 5;
        this.hovering = false;
        this.hoverHeight = 0;
        this.phaseShiftCooldown = 8000;
        this.lastPhaseShift = 0;
        this.isPhased = false;
        
        this.createMesh();
        this.createAlienTech();
    }

    createMesh() {
        const hybridGroup = new THREE.Group();

        // Core hybrid body - elongated and alien
        const bodyGeometry = new THREE.CapsuleGeometry(0.4, 2.2, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a5a4a,
            transparent: true,
            opacity: 0.9,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.1;
        hybridGroup.add(body);

        // Elongated alien head
        const headGeometry = new THREE.SphereGeometry(0.6, 8, 12);
        headGeometry.scale(1.2, 1.5, 0.8); // Elongated
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x6a7a6a,
            transparent: true,
            opacity: 0.85
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.8;
        hybridGroup.add(head);

        // Large alien eyes
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: THEME.effects.explosion.plasma,
            emissive: 0x004488,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.25, 2.9, 0.4);
        hybridGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.25, 2.9, 0.4);
        hybridGroup.add(rightEye);

        // Tentacle-like appendages instead of normal arms
        for (let i = 0; i < 4; i++) {
            const tentacleGroup = new THREE.Group();
            
            // Multiple segments for each tentacle
            for (let j = 0; j < 3; j++) {
                const segmentGeometry = new THREE.SphereGeometry(0.15 - j * 0.03, 6, 8);
                const segmentMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x3a4a3a,
                    transparent: true,
                    opacity: 0.8
                });
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                segment.position.y = -j * 0.4;
                tentacleGroup.add(segment);
            }
            
            const angle = (i / 4) * Math.PI * 2;
            tentacleGroup.position.set(
                Math.cos(angle) * 0.7,
                1.5,
                Math.sin(angle) * 0.7
            );
            tentacleGroup.rotation.z = angle;
            hybridGroup.add(tentacleGroup);
            
            if (i === 0) this.tentacles = [tentacleGroup];
            else this.tentacles.push(tentacleGroup);
        }

        // Alien bio-suit remnants
        const suitGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
        const suitMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a3a2a,
            transparent: true,
            opacity: 0.6
        });
        const suit = new THREE.Mesh(suitGeometry, suitMaterial);
        suit.position.y = 1;
        hybridGroup.add(suit);

        // Psychic aura
        const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.y = 1.5;
        hybridGroup.add(aura);
        this.psychicAura = aura;

        hybridGroup.position.copy(this.position);
        this.mesh = hybridGroup;
        this.scene.add(hybridGroup);

        // Store references
        this.head = head;
        this.leftEye = leftEye;
        this.rightEye = rightEye;
        this.body = body;
    }

    generateAlienTech() {
        const techTypes = ['neural_implant', 'bio_enhancement', 'energy_conduit', 'phase_generator'];
        const modifications = ['enhanced_strength', 'psychic_amplifier', 'adaptive_armor', 'telekinetic_field'];
        
        return {
            implant: techTypes[Math.floor(Math.random() * techTypes.length)],
            modification: modifications[Math.floor(Math.random() * modifications.length)],
            powerLevel: Math.floor(Math.random() * 3) + 1,
            malfunctioning: Math.random() > 0.7 // 30% chance of malfunction
        };
    }

    createAlienTech() {
        if (this.alienTech.implant === 'neural_implant') {
            // Neural interface on head
            const implantGeometry = new THREE.RingGeometry(0.2, 0.3, 8);
            const implantMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                emissive: 0x004444,
                emissiveIntensity: 0.5
            });
            const implant = new THREE.Mesh(implantGeometry, implantMaterial);
            implant.position.set(0, 3.2, 0);
            implant.rotation.x = Math.PI / 2;
            this.mesh.add(implant);
            this.neuralImplant = implant;
        }

        // Energy conduits on body
        for (let i = 0; i < 3; i++) {
            const conduitGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
            const conduitMaterial = new THREE.MeshBasicMaterial({
                color: THEME.effects.explosion.plasma,
                emissive: 0x002244,
                emissiveIntensity: 0.6
            });
            const conduit = new THREE.Mesh(conduitGeometry, conduitMaterial);
            conduit.position.set(
                (Math.random() - 0.5) * 0.8,
                1 + Math.random() * 1.5,
                0.35
            );
            conduit.rotation.z = (Math.random() - 0.5) * 0.5;
            this.mesh.add(conduit);
            
            if (i === 0) this.energyConduits = [conduit];
            else this.energyConduits.push(conduit);
        }
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);
        
        // Psychic power regeneration
        if (this.psychicPower < this.maxPsychicPower) {
            this.psychicPower = Math.min(this.maxPsychicPower, 
                this.psychicPower + (20 * deltaTime / 1000));
        }

        // Detection with enhanced senses
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            
            // Choose attack based on distance and cooldowns
            this.chooseAttackStrategy(player, distance);
        } else {
            this.hover(deltaTime);
        }

        // Animate alien effects
        this.animateAlienEffects(deltaTime);
        
        // Update position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.position.y += this.hoverHeight;
        }
    }

    chooseAttackStrategy(player, distance) {
        const currentTime = Date.now();

        // Phase shift if player is too close
        if (distance < 5 && currentTime - this.lastPhaseShift > this.phaseShiftCooldown) {
            this.phaseShift();
            return;
        }

        // Mind blast for medium range
        if (distance > 5 && distance < 15 && 
            currentTime - this.lastMindBlastUse > this.mindBlastCooldown &&
            this.psychicPower >= 40) {
            this.mindBlast(player);
            return;
        }

        // Telekinesis attack
        if (currentTime - this.lastTelekinesisUse > this.telekinesisCooldown &&
            this.psychicPower >= 20) {
            this.telekinesisAttack(player);
            return;
        }

        // Regular movement and melee if close
        if (distance <= this.attackRange) {
            this.performMeleeAttack(player);
        } else {
            this.advancedMovement(player.position || player.mesh.position, deltaTime);
        }
    }

    phaseShift() {
        this.lastPhaseShift = Date.now();
        this.isPhased = true;
        this.psychicPower -= 30;

        // Visual phase effect
        if (this.mesh) {
            this.mesh.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = 0.3;
                }
            });
        }

        // Teleport to better position
        const teleportDistance = 8;
        const angle = Math.random() * Math.PI * 2;
        const newPosition = this.position.clone();
        newPosition.x += Math.cos(angle) * teleportDistance;
        newPosition.z += Math.sin(angle) * teleportDistance;
        this.position.copy(newPosition);

        // Create phase effect
        this.createPhaseShiftEffect();

        // Return to normal after 2 seconds
        setTimeout(() => {
            this.isPhased = false;
            if (this.mesh) {
                this.mesh.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = child.material.originalOpacity || 0.9;
                    }
                });
            }
        }, 2000);
    }

    createPhaseShiftEffect() {
        const effectGeometry = new THREE.SphereGeometry(3, 16, 16);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: THEME.effects.explosion.plasma,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(this.position);
        this.scene.add(effect);

        // Animate effect
        let scale = 0.1;
        let opacity = 0.8;
        const effectInterval = setInterval(() => {
            scale += 0.2;
            opacity -= 0.08;
            effect.scale.setScalar(scale);
            effect.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(effect);
                clearInterval(effectInterval);
            }
        }, 50);
    }

    mindBlast(player) {
        this.lastMindBlastUse = Date.now();
        this.psychicPower -= 40;

        // Create mind blast effect
        const blastGeometry = new THREE.ConeGeometry(1, 4, 8);
        const blastMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0088,
            transparent: true,
            opacity: 0.7
        });
        const blast = new THREE.Mesh(blastGeometry, blastMaterial);
        blast.position.copy(this.position);
        blast.position.y += 2;
        blast.lookAt(player.position || player.mesh.position);
        this.scene.add(blast);

        // Mind blast waves
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const waveGeometry = new THREE.RingGeometry(2 + i, 3 + i, 16);
                const waveMaterial = new THREE.MeshBasicMaterial({
                    color: 0xaa00ff,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const wave = new THREE.Mesh(waveGeometry, waveMaterial);
                wave.position.copy(player.position || player.mesh.position);
                wave.position.y = 0.1;
                wave.rotation.x = -Math.PI / 2;
                this.scene.add(wave);

                // Animate wave
                let scale = 1;
                let opacity = 0.6;
                const waveInterval = setInterval(() => {
                    scale += 0.5;
                    opacity -= 0.1;
                    wave.scale.setScalar(scale);
                    wave.material.opacity = opacity;

                    if (opacity <= 0) {
                        this.scene.remove(wave);
                        clearInterval(waveInterval);
                    }
                }, 100);
            }, i * 200);
        }

        // Apply mind blast effects to player
        if (player.addStatusEffect) {
            player.addStatusEffect('confusion', {
                duration: 5000,
                controlInversion: true,
                visionDistortion: true
            });
        }

        // Damage player
        if (player.takeDamage) {
            player.takeDamage(35, "Alien Hybrid Mind Blast");
        }

        // Remove blast effect
        setTimeout(() => {
            this.scene.remove(blast);
        }, 1000);
    }

    telekinesisAttack(player) {
        this.lastTelekinesisUse = Date.now();
        this.psychicPower -= 20;

        // Create debris to throw
        const debrisList = this.createPsychicDebris();
        
        debrisList.forEach((debris, index) => {
            setTimeout(() => {
                this.launchDebris(debris, player);
            }, index * 200);
        });
    }

    createPsychicDebris() {
        const debris = [];
        const debrisCount = 5;

        for (let i = 0; i < debrisCount; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                0.3 + Math.random() * 0.4,
                0.3 + Math.random() * 0.4,
                0.3 + Math.random() * 0.4
            );
            const debrisMaterial = new THREE.MeshLambertMaterial({
                color: THEME.materials.wall.armory,
                emissive: 0x002244,
                emissiveIntensity: 0.3
            });
            const debrisMesh = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            // Position around the hybrid
            const angle = (i / debrisCount) * Math.PI * 2;
            const radius = 2;
            debrisMesh.position.set(
                this.position.x + Math.cos(angle) * radius,
                this.position.y + 2 + Math.random(),
                this.position.z + Math.sin(angle) * radius
            );
            
            // Add psychic glow
            const glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x0066ff,
                transparent: true,
                opacity: 0.4
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            debrisMesh.add(glow);

            this.scene.add(debrisMesh);
            debris.push(debrisMesh);
        }

        return debris;
    }

    launchDebris(debris, player) {
        const direction = new THREE.Vector3()
            .subVectors(player.position || player.mesh.position, debris.position)
            .normalize();

        const speed = 15;
        const velocity = direction.multiplyScalar(speed);

        // Animate debris flight
        const launchInterval = setInterval(() => {
            const movement = velocity.clone().multiplyScalar(16 / 1000);
            debris.position.add(movement);
            debris.rotation.x += 0.1;
            debris.rotation.y += 0.1;

            // Check collision or lifetime
            const distance = debris.position.distanceTo(player.position || player.mesh.position);
            if (distance < 1.5) {
                // Hit player
                if (player.takeDamage) {
                    player.takeDamage(15, "Alien Hybrid Debris");
                }
                this.createDebrisImpact(debris.position);
                this.scene.remove(debris);
                clearInterval(launchInterval);
            } else if (debris.position.distanceTo(this.position) > 50) {
                // Too far, remove
                this.scene.remove(debris);
                clearInterval(launchInterval);
            }
        }, 16);
    }

    createDebrisImpact(position) {
        const impactGeometry = new THREE.SphereGeometry(1, 8, 8);
        const impactMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            transparent: true,
            opacity: 0.8
        });
        const impact = new THREE.Mesh(impactGeometry, impactMaterial);
        impact.position.copy(position);
        this.scene.add(impact);

        // Animate impact
        let scale = 1;
        let opacity = 0.8;
        const impactInterval = setInterval(() => {
            scale += 0.4;
            opacity -= 0.1;
            impact.scale.setScalar(scale);
            impact.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(impact);
                clearInterval(impactInterval);
            }
        }, 50);
    }

    performMeleeAttack(player) {
        if (Date.now() - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = Date.now();

        // Multi-tentacle attack
        this.animateTentacleAttack();

        // Deal damage
        if (player.takeDamage) {
            player.takeDamage(this.damage, "Alien Hybrid Claw");
        }

        // Create psychic feedback
        this.createPsychicFeedback();
    }

    animateTentacleAttack() {
        if (this.tentacles) {
            this.tentacles.forEach((tentacle, index) => {
                setTimeout(() => {
                    // Strike animation
                    const originalRotation = tentacle.rotation.z;
                    tentacle.rotation.z += (index % 2 === 0 ? 1 : -1) * 0.8;
                    
                    setTimeout(() => {
                        tentacle.rotation.z = originalRotation;
                    }, 300);
                }, index * 100);
            });
        }
    }

    createPsychicFeedback() {
        const feedbackGeometry = new THREE.RingGeometry(1, 2, 16);
        const feedbackMaterial = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const feedback = new THREE.Mesh(feedbackGeometry, feedbackMaterial);
        feedback.position.copy(this.position);
        feedback.position.y = 0.1;
        feedback.rotation.x = -Math.PI / 2;
        this.scene.add(feedback);

        // Animate feedback
        let scale = 1;
        let opacity = 0.7;
        const feedbackInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.07;
            feedback.scale.setScalar(scale);
            feedback.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(feedback);
                clearInterval(feedbackInterval);
            }
        }, 50);
    }

    advancedMovement(playerPosition, deltaTime) {
        // Hovering movement with psychic propulsion
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.position)
            .normalize();

        // Hover behavior
        if (!this.hovering && Math.random() < 0.01) {
            this.hovering = true;
            this.hoverHeight = 2 + Math.random() * 2;
        } else if (this.hovering && Math.random() < 0.005) {
            this.hovering = false;
            this.hoverHeight = 0;
        }

        // Smooth hover transition
        const targetHoverHeight = this.hovering ? this.hoverHeight : 0;
        const currentHoverHeight = this.mesh ? this.mesh.position.y - this.position.y : 0;
        this.hoverHeight = THREE.MathUtils.lerp(currentHoverHeight, targetHoverHeight, deltaTime * 0.002);

        // Movement with adaptation to player behavior
        let moveSpeed = this.speed;
        if (this.adaptationLevel > 2) {
            moveSpeed *= 1.3; // Faster if adapted
            
            // Predict player movement
            const predictedPosition = playerPosition.clone();
            if (this.lastPlayerPosition) {
                const playerVelocity = new THREE.Vector3()
                    .subVectors(playerPosition, this.lastPlayerPosition);
                predictedPosition.add(playerVelocity.multiplyScalar(2));
            }
            direction.subVectors(predictedPosition, this.position).normalize();
        }

        this.position.add(direction.multiplyScalar(moveSpeed * deltaTime / 1000));
        this.lastPlayerPosition = playerPosition.clone();

        // Face the player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
    }

    hover(deltaTime) {
        // Idle hovering behavior
        if (!this.hovering) {
            this.hovering = true;
            this.hoverHeight = 1 + Math.random();
        }

        // Floating movement pattern
        const time = Date.now() * 0.001;
        const floatOffset = new THREE.Vector3(
            Math.sin(time) * 2,
            0,
            Math.cos(time * 0.7) * 2
        );
        
        this.position.add(floatOffset.multiplyScalar(deltaTime / 1000));
    }

    animateAlienEffects(deltaTime) {
        // Pulsing eyes
        if (this.leftEye && this.rightEye) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
            this.leftEye.material.emissiveIntensity = pulse;
            this.rightEye.material.emissiveIntensity = pulse;
        }

        // Animate tentacles
        if (this.tentacles) {
            const time = Date.now() * 0.003;
            this.tentacles.forEach((tentacle, index) => {
                tentacle.children.forEach((segment, segmentIndex) => {
                    segment.position.y = -segmentIndex * 0.4 + 
                        Math.sin(time + index + segmentIndex) * 0.1;
                });
            });
        }

        // Psychic aura pulsing
        if (this.psychicAura) {
            const auraPulse = 0.1 + Math.sin(Date.now() * 0.005) * 0.05;
            this.psychicAura.material.opacity = auraPulse;
            this.psychicAura.rotation.y += deltaTime * 0.001;
        }

        // Energy conduits flickering
        if (this.energyConduits) {
            this.energyConduits.forEach((conduit, index) => {
                const flicker = Math.sin(Date.now() * 0.01 + index) * 0.2 + 0.6;
                conduit.material.emissiveIntensity = flicker;
            });
        }

        // Neural implant activity
        if (this.neuralImplant) {
            this.neuralImplant.rotation.z += deltaTime * 0.003;
            const activity = Math.sin(Date.now() * 0.006) * 0.3 + 0.5;
            this.neuralImplant.material.emissiveIntensity = activity;
        }
    }

    takeDamage(amount, damageType) {
        // Adaptation system - learn from damage types
        if (this.adaptationLevel < this.maxAdaptation) {
            this.adaptationLevel += 0.2;
            
            if (this.adaptationLevel >= 2) {
                // Develop resistance
                amount *= 0.8;
            }
            if (this.adaptationLevel >= 4) {
                // High resistance and enhanced abilities
                amount *= 0.6;
                this.speed *= 1.1;
                this.psychicPower = Math.min(this.maxPsychicPower, 
                    this.psychicPower + 10);
            }
        }

        this.health -= amount;

        // Phase out temporarily when heavily damaged
        if (this.health < this.maxHealth * 0.3 && !this.isPhased) {
            this.phaseShift();
        }

        // Damage visual feedback
        if (this.mesh) {
            this.mesh.children.forEach(child => {
                if (child.material && child.material.color) {
                    const originalColor = child.material.color.getHex();
                    child.material.color.setHex(0x0088ff);
                    
                    setTimeout(() => {
                        if (child.material) {
                            child.material.color.setHex(originalColor);
                        }
                    }, 150);
                }
            });
        }

        // Psychic scream when damaged
        this.createPsychicScream();
    }

    createPsychicScream() {
        const screamGeometry = new THREE.SphereGeometry(5, 16, 16);
        const screamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0088,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const scream = new THREE.Mesh(screamGeometry, screamMaterial);
        scream.position.copy(this.position);
        this.scene.add(scream);

        // Animate scream
        let scale = 0.1;
        let opacity = 0.3;
        const screamInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.03;
            scream.scale.setScalar(scale);
            scream.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(scream);
                clearInterval(screamInterval);
            }
        }, 50);
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Alien death explosion
        const deathGeometry = new THREE.SphereGeometry(3, 16, 16);
        const deathMaterial = new THREE.MeshBasicMaterial({
            color: THEME.effects.explosion.plasma,
            transparent: true,
            opacity: 0.9
        });
        const deathEffect = new THREE.Mesh(deathGeometry, deathMaterial);
        deathEffect.position.copy(this.position);
        this.scene.add(deathEffect);

        // Psychic energy release
        for (let i = 0; i < 10; i++) {
            const energyGeometry = new THREE.SphereGeometry(0.2, 6, 6);
            const energyMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0088,
                emissive: 0x880044,
                emissiveIntensity: 0.8
            });
            const energy = new THREE.Mesh(energyGeometry, energyMaterial);
            energy.position.copy(this.position);
            energy.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            ));
            this.scene.add(energy);

            // Animate energy dispersal
            const energyVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );

            const energyInterval = setInterval(() => {
                energy.position.add(energyVelocity.multiplyScalar(0.02));
                energy.scale.multiplyScalar(0.98);

                if (energy.scale.x < 0.1) {
                    this.scene.remove(energy);
                    clearInterval(energyInterval);
                }
            }, 50);
        }

        // Main death effect
        let scale = 1;
        let opacity = 0.9;
        const deathInterval = setInterval(() => {
            scale += 0.2;
            opacity -= 0.06;
            deathEffect.scale.setScalar(scale);
            deathEffect.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(deathEffect);
                clearInterval(deathInterval);
            }
        }, 50);
    }

    getStatusInfo() {
        return {
            type: 'Alien Hybrid',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'Extreme',
            abilities: ['Psychic Powers', 'Phase Shift', 'Telekinesis', 'Mind Blast', 'Adaptation'],
            psychicPower: this.psychicPower,
            adaptationLevel: this.adaptationLevel,
            alienTech: this.alienTech,
            isPhased: this.isPhased,
            hovering: this.hovering
        };
    }
}
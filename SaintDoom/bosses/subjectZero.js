import * as THREE from 'three';
import { Enemy } from '../enemies/enemy.js';

export class SubjectZero extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.name = 'Subject Zero';
        this.health = 600;
        this.maxHealth = 600;
        this.speed = 2.5; // Fast and mobile
        this.damage = 45;
        this.attackRange = 6;
        this.detectionRange = 40;
        
        // Subject Zero specific properties
        this.teleportCooldown = 4000;
        this.lastTeleport = 0;
        this.teleportRange = 20;
        this.phaseShiftDuration = 3000;
        this.lastPhaseShift = 0;
        this.isPhased = false;
        this.telepathicRange = 25;
        this.psychicEnergy = 100;
        this.maxPsychicEnergy = 100;
        
        // Attack abilities
        this.abilities = {
            psychic_blast: { damage: 35, cooldown: 2000, range: 15 },
            mind_control: { duration: 4000, cooldown: 8000, range: 12 },
            reality_distortion: { damage: 25, cooldown: 5000, range: 20 },
            temporal_echo: { count: 3, cooldown: 12000, duration: 8000 },
            nightmare_zone: { damage: 20, cooldown: 10000, range: 15, duration: 6000 }
        };
        
        // Cooldown tracking
        this.lastPsychicBlast = 0;
        this.lastMindControl = 0;
        this.lastRealityDistortion = 0;
        this.lastTemporalEcho = 0;
        this.lastNightmareZone = 0;
        
        // Combat state
        this.currentForm = 'normal'; // normal, phased, echoed
        this.echoClones = [];
        this.mindControlTarget = null;
        this.aggressionLevel = 1; // Increases as health decreases
        
        // Visual effects
        this.psychicAura = null;
        this.realityRift = null;
        this.nightmareField = null;
        
        this.createMesh();
        this.createPsychicEffects();
    }

    createMesh() {
        const subjectGroup = new THREE.Group();

        // Humanoid form but heavily modified
        const torsoGeometry = new THREE.CylinderGeometry(0.8, 1, 2.5, 8);
        const torsoMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a3a,
            transparent: true,
            opacity: 0.9
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1.25;
        subjectGroup.add(torso);

        // Elongated alien head
        const headGeometry = new THREE.SphereGeometry(0.7, 12, 16);
        headGeometry.scale(1.2, 1.8, 0.9);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a3a4a,
            transparent: true,
            opacity: 0.85
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.2;
        subjectGroup.add(head);

        // Large psychic brain visible through translucent skull
        const brainGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const brainMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0088,
            emissive: 0x440022,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7
        });
        const brain = new THREE.Mesh(brainGeometry, brainMaterial);
        brain.position.y = 3.4;
        head.add(brain);
        this.psychicBrain = brain;

        // Glowing psychic eyes
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            emissive: 0x004488,
            emissiveIntensity: 1.0
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0.2, 0.6);
        head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0.2, 0.6);
        head.add(rightEye);

        // Enhanced arms with psychic energy conduits
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 8);
        const armMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a3a,
            transparent: true,
            opacity: 0.8
        });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.2, 1.5, 0);
        leftArm.rotation.z = 0.3;
        subjectGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.2, 1.5, 0);
        rightArm.rotation.z = -0.3;
        subjectGroup.add(rightArm);

        // Psychic hands that glow
        const handGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const handMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            emissive: 0x004444,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-1.5, 0.3, 0.5);
        subjectGroup.add(leftHand);
        this.leftHand = leftHand;
        
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(1.5, 0.3, 0.5);
        subjectGroup.add(rightHand);
        this.rightHand = rightHand;

        // Legs - slightly elongated
        const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 2.2, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a2a,
            transparent: true,
            opacity: 0.8
        });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, -1.1, 0);
        subjectGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.4, -1.1, 0);
        subjectGroup.add(rightLeg);

        // Laboratory restraints (broken)
        this.addLaboratoryDetails(subjectGroup);

        subjectGroup.position.copy(this.position);
        this.mesh = subjectGroup;
        this.scene.add(subjectGroup);

        // Store references
        this.head = head;
        this.torso = torso;
        this.leftEye = leftEye;
        this.rightEye = rightEye;
    }

    addLaboratoryDetails(subjectGroup) {
        // Broken restraint shackles
        const shackleGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
        const shackleMaterial = new THREE.MeshLambertMaterial({
            color: 0x666666,
            metalness: 0.8
        });
        
        // Wrist shackles
        const leftShackle = new THREE.Mesh(shackleGeometry, shackleMaterial);
        leftShackle.position.set(-1.5, 0.8, 0);
        leftShackle.rotation.y = Math.PI / 4;
        subjectGroup.add(leftShackle);
        
        const rightShackle = new THREE.Mesh(shackleGeometry, shackleMaterial);
        rightShackle.position.set(1.5, 0.8, 0);
        rightShackle.rotation.y = -Math.PI / 4;
        subjectGroup.add(rightShackle);

        // Broken chains
        for (let i = 0; i < 4; i++) {
            const chainGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 6);
            const chainMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const chain = new THREE.Mesh(chainGeometry, chainMaterial);
            chain.position.set(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            chain.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            subjectGroup.add(chain);
        }

        // Subject identification tattoos/markings
        const idGeometry = new THREE.PlaneGeometry(0.5, 0.2);
        const idMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            emissive: 0x004400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const idTag = new THREE.Mesh(idGeometry, idMaterial);
        idTag.position.set(0, 1.8, 0.51); // On chest
        subjectGroup.add(idTag);
    }

    createPsychicEffects() {
        // Psychic aura around Subject Zero
        const auraGeometry = new THREE.SphereGeometry(3, 32, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        this.psychicAura = new THREE.Mesh(auraGeometry, auraMaterial);
        this.psychicAura.position.copy(this.position);
        this.scene.add(this.psychicAura);

        // Floating psychic energy orbs
        this.energyOrbs = [];
        for (let i = 0; i < 6; i++) {
            const orbGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const orbMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                emissive: 0x004488,
                emissiveIntensity: 0.8
            });
            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            orb.position.set(
                Math.cos(angle) * 2,
                2 + Math.sin(i) * 0.5,
                Math.sin(angle) * 2
            );
            this.mesh.add(orb);
            this.energyOrbs.push(orb);
        }
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);

        // Psychic energy regeneration
        this.updatePsychicEnergy(deltaTime);
        
        // Aggression scales with damage taken
        this.aggressionLevel = 1 + (1 - this.health / this.maxHealth) * 2;

        // Combat AI
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            this.executePsychicCombat(player, distance, deltaTime);
        } else {
            this.psychicPatrol(deltaTime);
        }

        // Update echo clones
        this.updateEchoClones(deltaTime);
        
        // Animation updates
        this.animatePsychicEffects(deltaTime);
        
        // Update position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    executePsychicCombat(player, distance, deltaTime) {
        const currentTime = Date.now();
        
        // Teleport if too close or as evasion
        if ((distance < 4 || Math.random() < 0.001) && 
            currentTime - this.lastTeleport > this.teleportCooldown) {
            this.teleportAttack(player);
            return;
        }

        // Phase shift for defense
        if (!this.isPhased && this.health < this.maxHealth * 0.6 && 
            currentTime - this.lastPhaseShift > 8000) {
            this.activatePhaseShift();
        }

        // Choose attack based on distance and aggression
        this.selectPsychicAttack(player, distance, currentTime);

        // Movement - hover and strafe
        this.psychicMovement(player.position || player.mesh.position, distance, deltaTime);
    }

    selectPsychicAttack(player, distance, currentTime) {
        const abilities = this.abilities;
        
        // High aggression = more frequent and dangerous attacks
        const aggressionMultiplier = 1 / this.aggressionLevel;
        
        // Psychic blast - primary ranged attack
        if (distance <= abilities.psychic_blast.range &&
            currentTime - this.lastPsychicBlast > abilities.psychic_blast.cooldown * aggressionMultiplier) {
            this.psychicBlast(player);
        }
        
        // Mind control - disable player temporarily
        else if (distance <= abilities.mind_control.range &&
                 currentTime - this.lastMindControl > abilities.mind_control.cooldown) {
            this.mindControl(player);
        }
        
        // Reality distortion - warp space around player
        else if (distance <= abilities.reality_distortion.range &&
                 currentTime - this.lastRealityDistortion > abilities.reality_distortion.cooldown) {
            this.realityDistortion(player);
        }
        
        // Temporal echo - create fighting clones
        else if (this.echoClones.length === 0 &&
                 currentTime - this.lastTemporalEcho > abilities.temporal_echo.cooldown) {
            this.createTemporalEchoes();
        }
        
        // Nightmare zone - area denial
        else if (distance <= abilities.nightmare_zone.range &&
                 currentTime - this.lastNightmareZone > abilities.nightmare_zone.cooldown) {
            this.createNightmareZone(player);
        }
    }

    teleportAttack(player) {
        this.lastTeleport = Date.now();
        
        const playerPosition = player.position || player.mesh.position;
        
        // Choose teleport destination - behind or to the side of player
        const angles = [Math.PI, Math.PI / 2, -Math.PI / 2];
        const chosenAngle = angles[Math.floor(Math.random() * angles.length)];
        
        const teleportDistance = 8 + Math.random() * 4;
        const newPosition = new THREE.Vector3(
            playerPosition.x + Math.cos(chosenAngle) * teleportDistance,
            this.position.y,
            playerPosition.z + Math.sin(chosenAngle) * teleportDistance
        );

        // Teleport out effect
        this.createTeleportEffect(this.position, 'out');
        
        // Update position
        this.position.copy(newPosition);
        
        // Teleport in effect
        setTimeout(() => {
            this.createTeleportEffect(this.position, 'in');
            
            // Immediate psychic blast after teleport
            setTimeout(() => {
                if (this.target) {
                    this.psychicBlast(player);
                }
            }, 500);
        }, 200);
    }

    createTeleportEffect(position, type) {
        const effectGeometry = new THREE.SphereGeometry(2, 16, 16);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: type === 'out' ? 0x8800ff : 0x00aaff,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        this.scene.add(effect);

        // Animate effect
        let scale = type === 'out' ? 1 : 0.1;
        let opacity = 0.8;
        const effectInterval = setInterval(() => {
            if (type === 'out') {
                scale += 0.3;
            } else {
                scale += 0.2;
            }
            opacity -= 0.08;
            effect.scale.setScalar(scale);
            effect.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(effect);
                clearInterval(effectInterval);
            }
        }, 50);

        // Teleport particles
        this.createTeleportParticles(position);
    }

    createTeleportParticles(position) {
        const particleCount = 40;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = position.y + Math.random() * 4;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 4;

            colors[i * 3] = 0.5;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 1;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);

        // Animate particles dispersing
        let time = 0;
        const particleInterval = setInterval(() => {
            time += 50;
            particleSystem.rotation.y += 0.05;
            particleSystem.material.opacity -= 0.02;

            if (time > 2000) {
                this.scene.remove(particleSystem);
                clearInterval(particleInterval);
            }
        }, 50);
    }

    activatePhaseShift() {
        this.lastPhaseShift = Date.now();
        this.isPhased = true;
        
        // Visual phase effect
        if (this.mesh) {
            this.mesh.children.forEach(child => {
                if (child.material) {
                    child.material.opacity *= 0.4;
                }
            });
        }

        // Phase shift particles
        this.createPhaseShiftEffect();
        
        // End phase shift
        setTimeout(() => {
            this.isPhased = false;
            if (this.mesh) {
                this.mesh.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity /= 0.4;
                    }
                });
            }
        }, this.phaseShiftDuration);
    }

    createPhaseShiftEffect() {
        const phaseGeometry = new THREE.SphereGeometry(4, 32, 32);
        const phaseMaterial = new THREE.MeshBasicMaterial({
            color: 0x4400ff,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const phase = new THREE.Mesh(phaseGeometry, phaseMaterial);
        phase.position.copy(this.position);
        this.scene.add(phase);

        // Animate phase field
        let time = 0;
        const phaseInterval = setInterval(() => {
            time += 100;
            phase.rotation.y += 0.02;
            phase.rotation.x += 0.01;
            const pulse = 1 + Math.sin(time * 0.01) * 0.2;
            phase.scale.setScalar(pulse);

            if (time > this.phaseShiftDuration) {
                this.scene.remove(phase);
                clearInterval(phaseInterval);
            }
        }, 100);
    }

    psychicBlast(player) {
        this.lastPsychicBlast = Date.now();
        this.psychicEnergy -= 15;
        
        const playerPosition = player.position || player.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.position)
            .normalize();

        // Create psychic projectile
        const blastGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const blastMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            emissive: 0x004488,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const blast = new THREE.Mesh(blastGeometry, blastMaterial);
        blast.position.copy(this.position);
        blast.position.y += 2;

        // Psychic energy trail
        const trailGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x0088cc,
            transparent: true,
            opacity: 0.7
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI;
        trail.position.z = -0.75;
        blast.add(trail);

        const speed = 18;
        const velocity = direction.multiplyScalar(speed);

        blast.userData = {
            type: 'psychic_blast',
            velocity: velocity,
            damage: this.abilities.psychic_blast.damage * this.aggressionLevel,
            life: 3000,
            birthTime: Date.now()
        };

        this.scene.add(blast);
        this.animatePsychicBlast(blast);
        
        // Hand gesture
        this.animateAttack();
    }

    animatePsychicBlast(blast) {
        const blastInterval = setInterval(() => {
            const age = Date.now() - blast.userData.birthTime;
            if (age > blast.userData.life) {
                this.createPsychicExplosion(blast.position);
                this.scene.remove(blast);
                clearInterval(blastInterval);
                return;
            }

            const movement = blast.userData.velocity.clone().multiplyScalar(16 / 1000);
            blast.position.add(movement);
            
            // Psychic blast effects
            blast.rotation.x += 0.08;
            blast.rotation.y += 0.05;
            
            // Pulsing energy
            const pulse = 1 + Math.sin(age * 0.01) * 0.2;
            blast.scale.setScalar(pulse);
        }, 16);
    }

    createPsychicExplosion(position) {
        const explosionGeometry = new THREE.SphereGeometry(2.5, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Mind shatter effect
        for (let i = 0; i < 8; i++) {
            const shardGeometry = new THREE.PlaneGeometry(0.5, 0.5);
            const shardMaterial = new THREE.MeshBasicMaterial({
                color: 0x4488ff,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            shard.position.copy(position);
            shard.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            ));
            shard.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            this.scene.add(shard);

            // Animate shards
            const shardVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );
            
            const shardInterval = setInterval(() => {
                shard.position.add(shardVelocity.multiplyScalar(0.05));
                shard.rotation.x += 0.1;
                shard.rotation.y += 0.08;
                shard.material.opacity -= 0.05;

                if (shard.material.opacity <= 0) {
                    this.scene.remove(shard);
                    clearInterval(shardInterval);
                }
            }, 50);
        }

        // Animate main explosion
        let scale = 0.1;
        let opacity = 0.8;
        const explosionInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.06;
            explosion.scale.setScalar(scale);
            explosion.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(explosion);
                clearInterval(explosionInterval);
            }
        }, 50);
    }

    mindControl(player) {
        this.lastMindControl = Date.now();
        this.psychicEnergy -= 30;
        this.mindControlTarget = player;

        // Create mind control visual
        const controlGeometry = new THREE.CylinderGeometry(0.1, 1, 8, 16, 1, true);
        const controlMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0088,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const controlBeam = new THREE.Mesh(controlGeometry, controlMaterial);
        controlBeam.position.copy(this.position.clone().lerp(player.position || player.mesh.position, 0.5));
        controlBeam.position.y += 2;
        controlBeam.lookAt(player.position || player.mesh.position);
        controlBeam.rotation.x = Math.PI / 2;
        this.scene.add(controlBeam);

        // Apply mind control effect
        if (player.addStatusEffect) {
            player.addStatusEffect('mind_controlled', {
                duration: this.abilities.mind_control.duration,
                controlReversed: true,
                weaponsDisabled: true,
                visionDistorted: true,
                controller: this
            });
        }

        // Animate control beam
        let opacity = 0.6;
        const controlInterval = setInterval(() => {
            controlBeam.rotation.z += 0.05;
            opacity -= 0.03;
            controlBeam.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(controlBeam);
                clearInterval(controlInterval);
                this.mindControlTarget = null;
            }
        }, 100);
    }

    realityDistortion(player) {
        this.lastRealityDistortion = Date.now();
        this.psychicEnergy -= 25;

        const playerPosition = player.position || player.mesh.position;
        
        // Create reality rift around player
        const riftGeometry = new THREE.TorusGeometry(5, 1, 16, 32);
        const riftMaterial = new THREE.MeshBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        this.realityRift = new THREE.Mesh(riftGeometry, riftMaterial);
        this.realityRift.position.copy(playerPosition);
        this.realityRift.rotation.x = Math.PI / 2;
        this.scene.add(this.realityRift);

        // Distortion effects around player
        for (let i = 0; i < 12; i++) {
            const distortionGeometry = new THREE.BoxGeometry(
                Math.random() + 0.5,
                Math.random() + 0.5,
                Math.random() + 0.5
            );
            const distortionMaterial = new THREE.MeshBasicMaterial({
                color: 0x6600aa,
                transparent: true,
                opacity: 0.5,
                wireframe: true
            });
            const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
            
            const angle = (i / 12) * Math.PI * 2;
            distortion.position.set(
                playerPosition.x + Math.cos(angle) * 6,
                playerPosition.y + (Math.random() - 0.5) * 4,
                playerPosition.z + Math.sin(angle) * 6
            );
            
            this.scene.add(distortion);

            // Animate distortions
            const distortionInterval = setInterval(() => {
                distortion.rotation.x += 0.05;
                distortion.rotation.y += 0.08;
                distortion.rotation.z += 0.03;
                distortion.material.opacity -= 0.02;

                if (distortion.material.opacity <= 0) {
                    this.scene.remove(distortion);
                    clearInterval(distortionInterval);
                }
            }, 100);
        }

        // Apply reality distortion effects to player
        if (player.addStatusEffect) {
            player.addStatusEffect('reality_distorted', {
                duration: 5000,
                movementChaotic: true,
                damageOverTime: 5,
                visionWarped: true
            });
        }

        // Damage player in rift
        if (player.takeDamage) {
            player.takeDamage(this.abilities.reality_distortion.damage);
        }

        // Animate reality rift
        let riftTime = 0;
        const riftInterval = setInterval(() => {
            riftTime += 100;
            this.realityRift.rotation.z += 0.03;
            this.realityRift.scale.setScalar(1 + Math.sin(riftTime * 0.01) * 0.2);

            if (riftTime > 5000) {
                this.scene.remove(this.realityRift);
                clearInterval(riftInterval);
                this.realityRift = null;
            }
        }, 100);
    }

    createTemporalEchoes() {
        this.lastTemporalEcho = Date.now();
        this.psychicEnergy -= 40;
        
        // Create echo clones of Subject Zero
        for (let i = 0; i < this.abilities.temporal_echo.count; i++) {
            setTimeout(() => {
                const echoPosition = this.position.clone();
                const angle = (i / this.abilities.temporal_echo.count) * Math.PI * 2;
                echoPosition.x += Math.cos(angle) * 8;
                echoPosition.z += Math.sin(angle) * 8;
                
                this.createEchoClone(echoPosition);
            }, i * 500);
        }
    }

    createEchoClone(position) {
        // Create a semi-transparent copy of Subject Zero
        const echoGroup = new THREE.Group();
        
        // Copy main mesh structure but make it ghostly
        this.mesh.children.forEach(child => {
            if (child.geometry && child.material) {
                const echoGeometry = child.geometry.clone();
                const echoMaterial = child.material.clone();
                echoMaterial.transparent = true;
                echoMaterial.opacity = 0.5;
                echoMaterial.color = new THREE.Color(0x4488ff);
                echoMaterial.emissive = new THREE.Color(0x002244);
                
                const echoMesh = new THREE.Mesh(echoGeometry, echoMaterial);
                echoMesh.position.copy(child.position);
                echoMesh.rotation.copy(child.rotation);
                echoMesh.scale.copy(child.scale);
                echoGroup.add(echoMesh);
            }
        });

        echoGroup.position.copy(position);
        this.scene.add(echoGroup);

        const echo = {
            mesh: echoGroup,
            position: position.clone(),
            health: 100,
            creationTime: Date.now(),
            lastAttack: 0
        };

        this.echoClones.push(echo);

        // Create echo spawn effect
        this.createEchoSpawnEffect(position);
    }

    createEchoSpawnEffect(position) {
        const spawnGeometry = new THREE.SphereGeometry(3, 16, 16);
        const spawnMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const spawn = new THREE.Mesh(spawnGeometry, spawnMaterial);
        spawn.position.copy(position);
        this.scene.add(spawn);

        // Animate spawn effect
        let scale = 0.1;
        let opacity = 0.6;
        const spawnInterval = setInterval(() => {
            scale += 0.2;
            opacity -= 0.05;
            spawn.scale.setScalar(scale);
            spawn.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(spawn);
                clearInterval(spawnInterval);
            }
        }, 50);
    }

    updateEchoClones(deltaTime) {
        for (let i = this.echoClones.length - 1; i >= 0; i--) {
            const echo = this.echoClones[i];
            const age = Date.now() - echo.creationTime;
            
            // Remove expired echoes
            if (age > this.abilities.temporal_echo.duration || echo.health <= 0) {
                this.scene.remove(echo.mesh);
                this.echoClones.splice(i, 1);
                continue;
            }

            // Echo AI - attack player occasionally
            if (this.target && Date.now() - echo.lastAttack > 2000) {
                const distance = echo.position.distanceTo(this.target);
                if (distance < 15) {
                    this.echoAttack(echo);
                    echo.lastAttack = Date.now();
                }
            }

            // Animate echo
            echo.mesh.rotation.y += deltaTime * 0.002;
            const flutter = Math.sin(Date.now() * 0.005 + i) * 0.1;
            echo.mesh.position.y = echo.position.y + flutter;
        }
    }

    echoAttack(echo) {
        if (!this.target) return;
        
        // Echo fires a weaker psychic blast
        const direction = new THREE.Vector3()
            .subVectors(this.target, echo.position)
            .normalize();

        const echoBlastGeometry = new THREE.SphereGeometry(0.3, 12, 12);
        const echoBlastMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            emissive: 0x002244,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7
        });
        const echoBlast = new THREE.Mesh(echoBlastGeometry, echoBlastMaterial);
        echoBlast.position.copy(echo.position);
        echoBlast.position.y += 2;

        const speed = 15;
        const velocity = direction.multiplyScalar(speed);

        echoBlast.userData = {
            type: 'echo_blast',
            velocity: velocity,
            damage: 15,
            life: 2500,
            birthTime: Date.now()
        };

        this.scene.add(echoBlast);
        
        // Animate echo blast
        const echoBlastInterval = setInterval(() => {
            const age = Date.now() - echoBlast.userData.birthTime;
            if (age > echoBlast.userData.life) {
                this.scene.remove(echoBlast);
                clearInterval(echoBlastInterval);
                return;
            }

            const movement = echoBlast.userData.velocity.clone().multiplyScalar(16 / 1000);
            echoBlast.position.add(movement);
            echoBlast.rotation.x += 0.1;
        }, 16);
    }

    createNightmareZone(player) {
        this.lastNightmareZone = Date.now();
        this.psychicEnergy -= 35;

        const playerPosition = player.position || player.mesh.position;
        
        // Create nightmare field
        const nightmareGeometry = new THREE.CylinderGeometry(
            this.abilities.nightmare_zone.range, 
            this.abilities.nightmare_zone.range, 
            6, 32, 1, true
        );
        const nightmareMaterial = new THREE.MeshBasicMaterial({
            color: 0x440066,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.nightmareField = new THREE.Mesh(nightmareGeometry, nightmareMaterial);
        this.nightmareField.position.copy(playerPosition);
        this.nightmareField.position.y = 3;
        this.scene.add(this.nightmareField);

        // Nightmare entities within the zone
        this.createNightmareEntities(playerPosition);

        // Apply nightmare effects to player if in zone
        if (player.addStatusEffect) {
            player.addStatusEffect('nightmares', {
                duration: this.abilities.nightmare_zone.duration,
                damageOverTime: this.abilities.nightmare_zone.damage,
                visionDarkened: true,
                hearingDistorted: true,
                fearEffect: true
            });
        }

        // Animate nightmare zone
        let nightmareTime = 0;
        const nightmareInterval = setInterval(() => {
            nightmareTime += 100;
            this.nightmareField.rotation.y += 0.01;
            this.nightmareField.material.opacity = 0.4 + Math.sin(nightmareTime * 0.01) * 0.2;

            if (nightmareTime > this.abilities.nightmare_zone.duration) {
                this.scene.remove(this.nightmareField);
                clearInterval(nightmareInterval);
                this.nightmareField = null;
            }
        }, 100);
    }

    createNightmareEntities(centerPosition) {
        // Shadow figures that move around in the nightmare zone
        for (let i = 0; i < 8; i++) {
            const shadowGeometry = new THREE.ConeGeometry(0.5, 2, 6);
            const shadowMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.6
            });
            const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
            
            const angle = (i / 8) * Math.PI * 2;
            shadow.position.set(
                centerPosition.x + Math.cos(angle) * 8,
                centerPosition.y,
                centerPosition.z + Math.sin(angle) * 8
            );
            
            this.scene.add(shadow);

            // Animate shadows moving in nightmare zone
            let shadowAngle = angle;
            const shadowInterval = setInterval(() => {
                shadowAngle += 0.02;
                shadow.position.x = centerPosition.x + Math.cos(shadowAngle) * (8 + Math.sin(Date.now() * 0.003) * 3);
                shadow.position.z = centerPosition.z + Math.sin(shadowAngle) * (8 + Math.cos(Date.now() * 0.003) * 3);
                shadow.rotation.y = shadowAngle;
                
                // Flicker opacity
                shadow.material.opacity = 0.3 + Math.random() * 0.5;
            }, 100);

            setTimeout(() => {
                this.scene.remove(shadow);
                clearInterval(shadowInterval);
            }, this.abilities.nightmare_zone.duration);
        }
    }

    psychicMovement(playerPosition, distance, deltaTime) {
        // Hover slightly and maintain optimal distance
        const optimalDistance = 10;
        let direction = new THREE.Vector3();
        
        if (distance < optimalDistance - 2) {
            // Move away
            direction.subVectors(this.position, playerPosition).normalize();
        } else if (distance > optimalDistance + 5) {
            // Move closer
            direction.subVectors(playerPosition, this.position).normalize();
        } else {
            // Strafe around player
            direction.crossVectors(
                new THREE.Vector3().subVectors(playerPosition, this.position),
                new THREE.Vector3(0, 1, 0)
            ).normalize();
        }

        this.position.add(direction.multiplyScalar(this.speed * deltaTime / 1000));

        // Face player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
    }

    psychicPatrol(deltaTime) {
        // Hover in place with minor floating movement
        const time = Date.now() * 0.002;
        const floatOffset = new THREE.Vector3(
            Math.sin(time) * 1,
            Math.sin(time * 0.7) * 0.5,
            Math.cos(time * 0.8) * 1
        );
        
        this.position.add(floatOffset.multiplyScalar(deltaTime / 1000));
    }

    updatePsychicEnergy(deltaTime) {
        // Regenerate psychic energy
        if (this.psychicEnergy < this.maxPsychicEnergy) {
            this.psychicEnergy = Math.min(this.maxPsychicEnergy,
                this.psychicEnergy + (25 * deltaTime / 1000));
        }
    }

    animateAttack() {
        // Gesture with hands during psychic attacks
        if (this.leftHand && this.rightHand) {
            // Raise hands
            const originalLeftY = this.leftHand.position.y;
            const originalRightY = this.rightHand.position.y;
            
            this.leftHand.position.y += 1;
            this.rightHand.position.y += 1;
            
            // Glow brighter
            this.leftHand.material.emissiveIntensity = 1.2;
            this.rightHand.material.emissiveIntensity = 1.2;
            
            setTimeout(() => {
                this.leftHand.position.y = originalLeftY;
                this.rightHand.position.y = originalRightY;
                this.leftHand.material.emissiveIntensity = 0.8;
                this.rightHand.material.emissiveIntensity = 0.8;
            }, 800);
        }
    }

    animatePsychicEffects(deltaTime) {
        // Pulsing brain
        if (this.psychicBrain) {
            const brainPulse = 0.6 + Math.sin(Date.now() * 0.008) * 0.3;
            this.psychicBrain.material.emissiveIntensity = brainPulse;
            this.psychicBrain.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.1);
        }

        // Glowing eyes
        if (this.leftEye && this.rightEye) {
            const eyeGlow = 0.8 + Math.sin(Date.now() * 0.01) * 0.4;
            this.leftEye.material.emissiveIntensity = eyeGlow;
            this.rightEye.material.emissiveIntensity = eyeGlow;
        }

        // Orbiting energy orbs
        if (this.energyOrbs) {
            const time = Date.now() * 0.003;
            this.energyOrbs.forEach((orb, index) => {
                const orbitRadius = 2.5 + Math.sin(time + index) * 0.5;
                const height = 2 + Math.sin(time + index * 0.5) * 1;
                const angle = time + (index / this.energyOrbs.length) * Math.PI * 2;
                
                orb.position.set(
                    Math.cos(angle) * orbitRadius,
                    height,
                    Math.sin(angle) * orbitRadius
                );
            });
        }

        // Psychic aura pulsing
        if (this.psychicAura) {
            const auraPulse = 1 + Math.sin(Date.now() * 0.004) * 0.3;
            this.psychicAura.scale.setScalar(auraPulse);
            this.psychicAura.rotation.y += deltaTime * 0.001;
        }

        // Floating effect for Subject Zero
        const hoverOffset = Math.sin(Date.now() * 0.003) * 0.3;
        this.position.y = this.position.y + hoverOffset * deltaTime * 0.001;
    }

    takeDamage(amount, damageType) {
        // Reduced damage when phased
        if (this.isPhased) {
            amount *= 0.3;
        }

        // Vulnerability to certain damage types
        if (damageType === 'holy') {
            amount *= 1.4; // Vulnerable to holy damage
        } else if (damageType === 'psychic') {
            amount *= 0.6; // Resistant to psychic damage
        }

        this.health -= amount;

        // Psychic feedback when damaged
        this.createPsychicFeedback();

        // Chance to teleport when heavily damaged
        if (this.health < this.maxHealth * 0.3 && Math.random() < 0.4) {
            if (Date.now() - this.lastTeleport > 2000) {
                this.teleportAttack({ position: this.target });
            }
        }
    }

    createPsychicFeedback() {
        // Visual feedback when Subject Zero is damaged
        const feedbackGeometry = new THREE.SphereGeometry(4, 16, 16);
        const feedbackMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const feedback = new THREE.Mesh(feedbackGeometry, feedbackMaterial);
        feedback.position.copy(this.position);
        this.scene.add(feedback);

        // Animate feedback
        let scale = 0.1;
        let opacity = 0.6;
        const feedbackInterval = setInterval(() => {
            scale += 0.4;
            opacity -= 0.05;
            feedback.scale.setScalar(scale);
            feedback.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(feedback);
                clearInterval(feedbackInterval);
            }
        }, 50);
    }

    destroy() {
        // Clean up echo clones
        this.echoClones.forEach(echo => {
            this.scene.remove(echo.mesh);
        });

        // Clean up psychic effects
        if (this.psychicAura) {
            this.scene.remove(this.psychicAura);
        }
        if (this.realityRift) {
            this.scene.remove(this.realityRift);
        }
        if (this.nightmareField) {
            this.scene.remove(this.nightmareField);
        }

        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Psychic death explosion
        this.createPsychicDeathEffect();
    }

    createPsychicDeathEffect() {
        // Massive psychic energy release
        const deathGeometry = new THREE.SphereGeometry(8, 32, 32);
        const deathMaterial = new THREE.MeshBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 1.0
        });
        const deathEffect = new THREE.Mesh(deathGeometry, deathMaterial);
        deathEffect.position.copy(this.position);
        this.scene.add(deathEffect);

        // Psychic shockwave
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const shockGeometry = new THREE.RingGeometry(5 + i * 3, 7 + i * 3, 32);
                const shockMaterial = new THREE.MeshBasicMaterial({
                    color: 0x4400ff,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const shock = new THREE.Mesh(shockGeometry, shockMaterial);
                shock.position.copy(this.position);
                shock.position.y = 0.1;
                shock.rotation.x = -Math.PI / 2;
                this.scene.add(shock);

                // Animate shock
                let scale = 1;
                let opacity = 0.7;
                const shockInterval = setInterval(() => {
                    scale += 0.6;
                    opacity -= 0.06;
                    shock.scale.setScalar(scale);
                    shock.material.opacity = opacity;

                    if (opacity <= 0) {
                        this.scene.remove(shock);
                        clearInterval(shockInterval);
                    }
                }, 50);
            }, i * 200);
        }

        // Main death effect animation
        let scale = 0.1;
        let opacity = 1.0;
        const deathInterval = setInterval(() => {
            scale += 0.2;
            opacity -= 0.04;
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
            type: 'Subject Zero',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'BOSS',
            abilities: ['Teleportation', 'Psychic Blast', 'Mind Control', 'Reality Distortion', 'Temporal Echoes', 'Nightmare Zone'],
            psychicEnergy: this.psychicEnergy,
            isPhased: this.isPhased,
            currentForm: this.currentForm,
            echoClones: this.echoClones.length,
            aggressionLevel: this.aggressionLevel,
            mindControlTarget: this.mindControlTarget ? 'Active' : 'None'
        };
    }
}
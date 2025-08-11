import * as THREE from 'three';
import { Enemy } from '../enemies/enemy.js';
import { Imp } from '../enemies/imp.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';

export class TheDefiler extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.name = 'The Defiler';
        this.health = 800;
        this.maxHealth = 800;
        this.speed = 1.5;
        this.damage = 60;
        this.attackRange = 8;
        this.detectionRange = 50;
        
        // Boss specific properties
        this.phase = 1;
        this.maxPhase = 3;
        this.phaseTransitioning = false;
        this.invulnerable = false;
        this.enraged = false;
        this.corruptionAura = 15; // Radius of corruption effect
        this.defilerAbilities = {
            corruption_blast: { damage: 40, cooldown: 3000, range: 12 },
            summon_minions: { cooldown: 8000, count: 4 },
            unholy_scream: { damage: 30, cooldown: 5000, range: 20, fear: true },
            corruption_wave: { damage: 50, cooldown: 10000, range: 25 }
        };
        
        // Cooldown tracking
        this.lastCorruptionBlast = 0;
        this.lastSummon = 0;
        this.lastScream = 0;
        this.lastWave = 0;
        
        // Minion management
        this.activeMinions = [];
        this.maxMinions = 8;
        this.summonPoints = [];
        
        // Phase triggers
        this.phase2Triggered = false;
        this.phase3Triggered = false;
        
        // Visual effects
        this.corruptionField = null;
        this.bossAura = null;
        this.tentacles = [];
        
        this.createMesh();
        this.setupSummonPoints();
        this.createBossEffects();
    }

    createMesh() {
        const defilerGroup = new THREE.Group();

        // Main body - massive corrupted form
        const bodyGeometry = new THREE.CylinderGeometry(2.5, 3.5, 6, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a0a0a,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 3;
        defilerGroup.add(body);

        // Multiple heads for the defiler
        for (let i = 0; i < 3; i++) {
            const headGeometry = new THREE.SphereGeometry(0.8, 12, 12);
            headGeometry.scale(1.2, 1.5, 1);
            const headMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x5a1a1a,
                transparent: true,
                opacity: 0.85
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            
            const angle = (i / 3) * Math.PI * 2;
            head.position.set(
                Math.cos(angle) * 2.2,
                5.5 + Math.sin(i) * 0.5,
                Math.sin(angle) * 2.2
            );
            defilerGroup.add(head);

            // Glowing eyes for each head
            const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const eyeMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                emissive: 0x440000,
                emissiveIntensity: 1.2
            });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.2, 0.2, 0.7);
            head.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.2, 0.2, 0.7);
            head.add(rightEye);

            if (i === 0) this.heads = [head];
            else this.heads.push(head);
        }

        // Massive clawed arms
        for (let i = 0; i < 4; i++) {
            const armGeometry = new THREE.CylinderGeometry(0.4, 0.8, 4, 6);
            const armMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x3a0a0a,
                transparent: true,
                opacity: 0.8
            });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            arm.position.set(
                Math.cos(angle) * 3,
                2,
                Math.sin(angle) * 3
            );
            arm.rotation.z = angle + Math.PI / 4;
            defilerGroup.add(arm);

            // Claws at end of arms
            const clawGeometry = new THREE.ConeGeometry(0.3, 1, 6);
            const clawMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0a0a });
            const claw = new THREE.Mesh(clawGeometry, clawMaterial);
            claw.position.y = 2;
            claw.rotation.x = Math.PI;
            arm.add(claw);

            if (i === 0) this.arms = [arm];
            else this.arms.push(arm);
        }

        // Writhing tentacles around the base
        for (let i = 0; i < 8; i++) {
            const tentacleGroup = new THREE.Group();
            
            // Multiple segments for realistic tentacle movement
            for (let j = 0; j < 5; j++) {
                const segmentGeometry = new THREE.SphereGeometry(0.3 - j * 0.05, 8, 8);
                segmentGeometry.scale(1, 0.5, 1);
                const segmentMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x2a0a0a,
                    transparent: true,
                    opacity: 0.7
                });
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                segment.position.y = -j * 0.8;
                tentacleGroup.add(segment);
            }
            
            const angle = (i / 8) * Math.PI * 2;
            tentacleGroup.position.set(
                Math.cos(angle) * 4,
                0,
                Math.sin(angle) * 4
            );
            tentacleGroup.rotation.z = angle;
            defilerGroup.add(tentacleGroup);
            this.tentacles.push(tentacleGroup);
        }

        // Base corruption platform
        const baseGeometry = new THREE.CylinderGeometry(5, 6, 1, 16);
        const baseMaterial = new THREE.MeshLambertMaterial({
            color: 0x1a0505,
            emissive: 0x110000,
            emissiveIntensity: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.5;
        defilerGroup.add(base);

        defilerGroup.position.copy(this.position);
        this.mesh = defilerGroup;
        this.scene.add(defilerGroup);

        // Store references
        this.body = body;
        this.base = base;
    }

    setupSummonPoints() {
        // Points around the boss where minions will be summoned
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 12 + Math.random() * 8;
            this.summonPoints.push({
                x: this.position.x + Math.cos(angle) * radius,
                y: this.position.y,
                z: this.position.z + Math.sin(angle) * radius,
                occupied: false
            });
        }
    }

    createBossEffects() {
        // Corruption aura
        const auraGeometry = new THREE.CylinderGeometry(
            this.corruptionAura, this.corruptionAura, 0.5, 32, 1, true
        );
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x660000,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.corruptionField = new THREE.Mesh(auraGeometry, auraMaterial);
        this.corruptionField.position.copy(this.position);
        this.corruptionField.position.y = 0.1;
        this.scene.add(this.corruptionField);

        // Boss intimidation aura
        const bossAuraGeometry = new THREE.SphereGeometry(8, 32, 32);
        const bossAuraMaterial = new THREE.MeshBasicMaterial({
            color: 0x440000,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        this.bossAura = new THREE.Mesh(bossAuraGeometry, bossAuraMaterial);
        this.bossAura.position.copy(this.position);
        this.bossAura.position.y = 3;
        this.scene.add(this.bossAura);
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);

        // Phase management
        this.updatePhase();
        
        // Skip most updates during phase transition
        if (this.phaseTransitioning) {
            this.animateBossEffects(deltaTime);
            return;
        }

        // Combat behavior based on phase
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            this.executeBossAI(player, distance, deltaTime);
        }

        // Minion management
        this.updateMinions(deltaTime);
        
        // Corruption aura damage
        this.applyCorruptionDamage(player, distance);
        
        // Animation updates
        this.animateBossEffects(deltaTime);
        
        // Update position (boss doesn't move much)
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    updatePhase() {
        const healthPercent = this.health / this.maxHealth;
        
        // Phase 2 at 66% health
        if (healthPercent <= 0.66 && !this.phase2Triggered) {
            this.triggerPhaseTransition(2);
        }
        // Phase 3 at 33% health
        else if (healthPercent <= 0.33 && !this.phase3Triggered) {
            this.triggerPhaseTransition(3);
        }
    }

    triggerPhaseTransition(newPhase) {
        this.phaseTransitioning = true;
        this.invulnerable = true;
        this.phase = newPhase;
        
        if (newPhase === 2) {
            this.phase2Triggered = true;
        } else if (newPhase === 3) {
            this.phase3Triggered = true;
            this.enraged = true;
        }

        // Visual phase transition
        this.createPhaseTransitionEffect();
        
        // Phase-specific changes
        this.applyPhaseChanges(newPhase);
        
        // End transition after 3 seconds
        setTimeout(() => {
            this.phaseTransitioning = false;
            this.invulnerable = false;
        }, 3000);
    }

    createPhaseTransitionEffect() {
        // Massive energy explosion
        const explosionGeometry = new THREE.SphereGeometry(15, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: this.phase === 2 ? 0xff4400 : 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        explosion.position.y = 3;
        this.scene.add(explosion);

        // Shockwave rings
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const shockwaveGeometry = new THREE.RingGeometry(5 + i * 3, 7 + i * 3, 32);
                const shockwaveMaterial = new THREE.MeshBasicMaterial({
                    color: this.phase === 2 ? 0xff6600 : 0xff0000,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
                const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
                shockwave.position.copy(this.position);
                shockwave.position.y = 0.1;
                shockwave.rotation.x = -Math.PI / 2;
                this.scene.add(shockwave);

                // Animate shockwave
                let scale = 1;
                let opacity = 0.6;
                const shockInterval = setInterval(() => {
                    scale += 0.5;
                    opacity -= 0.05;
                    shockwave.scale.setScalar(scale);
                    shockwave.material.opacity = opacity;

                    if (opacity <= 0) {
                        this.scene.remove(shockwave);
                        clearInterval(shockInterval);
                    }
                }, 50);
            }, i * 200);
        }

        // Animate main explosion
        let scale = 0.1;
        let opacity = 0.8;
        const explosionInterval = setInterval(() => {
            scale += 0.2;
            opacity -= 0.04;
            explosion.scale.setScalar(scale);
            explosion.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(explosion);
                clearInterval(explosionInterval);
            }
        }, 50);
    }

    applyPhaseChanges(phase) {
        switch (phase) {
            case 2:
                // Phase 2: More aggressive, faster attacks
                this.speed *= 1.3;
                this.damage *= 1.2;
                this.defilerAbilities.corruption_blast.cooldown *= 0.7;
                this.defilerAbilities.summon_minions.count = 6;
                this.maxMinions = 10;
                
                // Visual changes - more fire
                if (this.body) {
                    this.body.material.color.setHex(0x6a1a0a);
                    this.body.material.emissive.setHex(0x220000);
                    this.body.material.emissiveIntensity = 0.4;
                }
                break;
                
            case 3:
                // Phase 3: Enraged, maximum power
                this.speed *= 1.5;
                this.damage *= 1.4;
                this.defilerAbilities.corruption_blast.cooldown *= 0.5;
                this.defilerAbilities.summon_minions.count = 8;
                this.maxMinions = 12;
                this.corruptionAura *= 1.5;
                
                // Visual changes - burning with corruption
                if (this.body) {
                    this.body.material.color.setHex(0x8a0a0a);
                    this.body.material.emissive.setHex(0x440000);
                    this.body.material.emissiveIntensity = 0.8;
                }
                
                // Enlarge corruption field
                if (this.corruptionField) {
                    this.corruptionField.scale.setScalar(1.5);
                    this.corruptionField.material.opacity = 0.4;
                }
                break;
        }
    }

    executeBossAI(player, distance, deltaTime) {
        const currentTime = Date.now();
        const playerPosition = player.position || player.mesh.position;

        // Phase-specific AI behavior
        switch (this.phase) {
            case 1:
                this.phase1Behavior(player, distance, currentTime);
                break;
            case 2:
                this.phase2Behavior(player, distance, currentTime);
                break;
            case 3:
                this.phase3Behavior(player, distance, currentTime);
                break;
        }

        // Always face the player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
    }

    phase1Behavior(player, distance, currentTime) {
        // Phase 1: Basic attacks and minion summoning
        
        // Corruption blast - primary ranged attack
        if (distance <= this.defilerAbilities.corruption_blast.range &&
            currentTime - this.lastCorruptionBlast > this.defilerAbilities.corruption_blast.cooldown) {
            this.corruptionBlast(player);
        }
        
        // Summon minions periodically
        if (this.activeMinions.length < 4 &&
            currentTime - this.lastSummon > this.defilerAbilities.summon_minions.cooldown) {
            this.summonMinions();
        }
        
        // Unholy scream when player gets close
        if (distance <= 8 &&
            currentTime - this.lastScream > this.defilerAbilities.unholy_scream.cooldown) {
            this.unholyScream(player);
        }
    }

    phase2Behavior(player, distance, currentTime) {
        // Phase 2: More aggressive with corruption waves
        
        // More frequent corruption blasts
        if (distance <= this.defilerAbilities.corruption_blast.range &&
            currentTime - this.lastCorruptionBlast > this.defilerAbilities.corruption_blast.cooldown) {
            this.corruptionBlast(player);
        }
        
        // Corruption wave - new ability
        if (currentTime - this.lastWave > this.defilerAbilities.corruption_wave.cooldown) {
            this.corruptionWave(player);
        }
        
        // Summon more minions
        if (this.activeMinions.length < 6 &&
            currentTime - this.lastSummon > this.defilerAbilities.summon_minions.cooldown) {
            this.summonMinions();
        }
        
        // More frequent screams
        if (distance <= 12 &&
            currentTime - this.lastScream > this.defilerAbilities.unholy_scream.cooldown * 0.7) {
            this.unholyScream(player);
        }
    }

    phase3Behavior(player, distance, currentTime) {
        // Phase 3: All abilities on shortened cooldowns, desperate fury
        
        // Rapid corruption blasts
        if (distance <= this.defilerAbilities.corruption_blast.range &&
            currentTime - this.lastCorruptionBlast > this.defilerAbilities.corruption_blast.cooldown) {
            this.corruptionBlast(player);
        }
        
        // Frequent corruption waves
        if (currentTime - this.lastWave > this.defilerAbilities.corruption_wave.cooldown * 0.6) {
            this.corruptionWave(player);
        }
        
        // Constant minion spawning
        if (this.activeMinions.length < 8 &&
            currentTime - this.lastSummon > this.defilerAbilities.summon_minions.cooldown * 0.5) {
            this.summonMinions();
        }
        
        // Terrifying screams
        if (distance <= 15 &&
            currentTime - this.lastScream > this.defilerAbilities.unholy_scream.cooldown * 0.5) {
            this.unholyScream(player);
        }
    }

    corruptionBlast(player) {
        this.lastCorruptionBlast = Date.now();
        
        const playerPosition = player.position || player.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.position)
            .normalize();

        // Create corruption projectile
        const blastGeometry = new THREE.SphereGeometry(0.8, 12, 12);
        const blastMaterial = new THREE.MeshBasicMaterial({
            color: 0x880000,
            emissive: 0x440000,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const blast = new THREE.Mesh(blastGeometry, blastMaterial);
        blast.position.copy(this.position);
        blast.position.y += 4; // From head level

        // Corruption trail
        const trailGeometry = new THREE.CylinderGeometry(0.3, 0.6, 2, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x440000,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -1;
        blast.add(trail);

        const speed = 15;
        const velocity = direction.multiplyScalar(speed);

        blast.userData = {
            type: 'corruption_blast',
            velocity: velocity,
            damage: this.defilerAbilities.corruption_blast.damage,
            life: 4000,
            birthTime: Date.now()
        };

        this.scene.add(blast);
        this.animateCorruptionBlast(blast);
        
        // Animate boss attack
        this.animateAttack();
    }

    animateCorruptionBlast(blast) {
        const blastInterval = setInterval(() => {
            const age = Date.now() - blast.userData.birthTime;
            if (age > blast.userData.life) {
                this.createCorruptionExplosion(blast.position);
                this.scene.remove(blast);
                clearInterval(blastInterval);
                return;
            }

            const movement = blast.userData.velocity.clone().multiplyScalar(16 / 1000);
            blast.position.add(movement);
            
            // Rotate corruption blast
            blast.rotation.x += 0.05;
            blast.rotation.y += 0.08;
        }, 16);
    }

    createCorruptionExplosion(position) {
        // Main explosion
        const explosionGeometry = new THREE.SphereGeometry(3, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0x880000,
            transparent: true,
            opacity: 0.9
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Corruption particles
        this.createCorruptionParticles(position);

        // Animate explosion
        let scale = 0.1;
        let opacity = 0.9;
        const explosionInterval = setInterval(() => {
            scale += 0.4;
            opacity -= 0.08;
            explosion.scale.setScalar(scale);
            explosion.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(explosion);
                clearInterval(explosionInterval);
            }
        }, 50);
    }

    createCorruptionParticles(position) {
        const particleCount = 30;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5) * 6;
            positions[i * 3 + 1] = position.y + Math.random() * 4;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 6;

            colors[i * 3] = 0.8;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 0;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);

        // Animate particles falling
        setTimeout(() => {
            this.scene.remove(particleSystem);
        }, 3000);
    }

    summonMinions() {
        this.lastSummon = Date.now();
        const summonCount = this.defilerAbilities.summon_minions.count;
        let summonedCount = 0;

        for (let i = 0; i < this.summonPoints.length && summonedCount < summonCount; i++) {
            const point = this.summonPoints[i];
            if (!point.occupied) {
                this.summonMinionAt(point, i);
                summonedCount++;
            }
        }
        
        // Create summoning effect
        this.createSummoningEffect();
    }

    summonMinionAt(point, pointIndex) {
        // Alternate between different minion types
        const minionTypes = [
            { class: Imp, chance: 0.6 },
            { class: ShadowWraith, chance: 0.4 }
        ];
        
        const rand = Math.random();
        let MinionClass = Imp; // Default
        let cumulativeChance = 0;
        
        for (const minionType of minionTypes) {
            cumulativeChance += minionType.chance;
            if (rand <= cumulativeChance) {
                MinionClass = minionType.class;
                break;
            }
        }

        const minionPosition = new THREE.Vector3(point.x, point.y, point.z);
        const minion = new MinionClass(this.scene, minionPosition);
        
        // Mark minion as summoned by boss
        minion.summonedBy = this;
        minion.pointIndex = pointIndex;
        
        this.activeMinions.push(minion);
        point.occupied = true;
        
        // Summoning effect at spawn point
        this.createSpawnEffect(minionPosition);
    }

    createSpawnEffect(position) {
        // Hell portal effect
        const portalGeometry = new THREE.RingGeometry(1, 2, 16);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0x440000,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.position.copy(position);
        portal.position.y = 0.1;
        portal.rotation.x = -Math.PI / 2;
        this.scene.add(portal);

        // Animate portal
        let scale = 0.1;
        let opacity = 0.8;
        const portalInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.08;
            portal.scale.setScalar(scale);
            portal.material.opacity = opacity;
            portal.rotation.z += 0.1;

            if (opacity <= 0) {
                this.scene.remove(portal);
                clearInterval(portalInterval);
            }
        }, 50);
    }

    createSummoningEffect() {
        // Boss summons with dramatic gesture
        if (this.arms) {
            this.arms.forEach((arm, index) => {
                // Raise arms during summoning
                const originalRotation = arm.rotation.z;
                arm.rotation.z = -Math.PI / 3;
                
                setTimeout(() => {
                    arm.rotation.z = originalRotation;
                }, 2000);
            });
        }

        // Energy buildup effect
        const energyGeometry = new THREE.SphereGeometry(6, 16, 16);
        const energyMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const energy = new THREE.Mesh(energyGeometry, energyMaterial);
        energy.position.copy(this.position);
        energy.position.y = 3;
        this.scene.add(energy);

        // Animate energy buildup
        let pulseScale = 6;
        const energyInterval = setInterval(() => {
            pulseScale += 0.5;
            energy.scale.setScalar(pulseScale / 6);
        }, 100);

        setTimeout(() => {
            this.scene.remove(energy);
            clearInterval(energyInterval);
        }, 2000);
    }

    unholyScream(player) {
        this.lastScream = Date.now();

        // Create scream effect
        const screamGeometry = new THREE.SphereGeometry(this.defilerAbilities.unholy_scream.range, 32, 32);
        const screamMaterial = new THREE.MeshBasicMaterial({
            color: 0xaa0000,
            transparent: true,
            opacity: 0.4,
            wireframe: true
        });
        const scream = new THREE.Mesh(screamGeometry, screamMaterial);
        scream.position.copy(this.position);
        scream.position.y = 4;
        this.scene.add(scream);

        // Apply fear effect to player
        const distance = this.position.distanceTo(player.position || player.mesh.position);
        if (distance <= this.defilerAbilities.unholy_scream.range) {
            // Damage
            if (player.takeDamage) {
                player.takeDamage(this.defilerAbilities.unholy_scream.damage);
            }
            
            // Fear effect
            if (player.addStatusEffect) {
                player.addStatusEffect('terror', {
                    duration: 3000,
                    controlReversed: true,
                    speedReduced: 0.5,
                    visionShake: true
                });
            }
        }

        // Animate scream
        let scale = 0.1;
        let opacity = 0.4;
        const screamInterval = setInterval(() => {
            scale += 0.5;
            opacity -= 0.04;
            scream.scale.setScalar(scale);
            scream.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(scream);
                clearInterval(screamInterval);
            }
        }, 50);

        // Animate boss heads during scream
        if (this.heads) {
            this.heads.forEach((head, index) => {
                setTimeout(() => {
                    // Tilt head back for scream
                    head.rotation.x = -0.5;
                    setTimeout(() => {
                        head.rotation.x = 0;
                    }, 1000);
                }, index * 200);
            });
        }
    }

    corruptionWave(player) {
        this.lastWave = Date.now();

        // Create expanding corruption wave
        const waveGeometry = new THREE.RingGeometry(2, 4, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0x660000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(this.position);
        wave.position.y = 0.5;
        wave.rotation.x = -Math.PI / 2;
        this.scene.add(wave);

        // Damage tracking
        let waveHitPlayer = false;
        const playerPosition = player.position || player.mesh.position;

        // Animate wave expansion
        let innerRadius = 2;
        let outerRadius = 4;
        let opacity = 0.8;
        const waveInterval = setInterval(() => {
            innerRadius += 1;
            outerRadius += 1;
            opacity -= 0.03;

            // Update wave geometry
            wave.geometry.dispose();
            wave.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
            wave.material.opacity = opacity;

            // Check collision with player
            const distance = this.position.distanceTo(playerPosition);
            if (!waveHitPlayer && distance >= innerRadius && distance <= outerRadius) {
                waveHitPlayer = true;
                if (player.takeDamage) {
                    player.takeDamage(this.defilerAbilities.corruption_wave.damage);
                }
                
                // Knockback effect
                const knockbackDirection = new THREE.Vector3()
                    .subVectors(playerPosition, this.position)
                    .normalize()
                    .multiplyScalar(5);
                
                if (player.position) {
                    player.position.add(knockbackDirection);
                }
            }

            if (opacity <= 0 || outerRadius > 30) {
                this.scene.remove(wave);
                clearInterval(waveInterval);
            }
        }, 100);
    }

    updateMinions(deltaTime) {
        // Clean up dead minions
        for (let i = this.activeMinions.length - 1; i >= 0; i--) {
            const minion = this.activeMinions[i];
            
            if (!minion || minion.health <= 0) {
                // Free up the summon point
                if (minion.pointIndex !== undefined) {
                    this.summonPoints[minion.pointIndex].occupied = false;
                }
                this.activeMinions.splice(i, 1);
            }
        }
    }

    applyCorruptionDamage(player, distance) {
        if (distance <= this.corruptionAura) {
            // Gradual corruption damage
            if (Math.random() < 0.02) { // 2% chance per frame when in aura
                if (player.takeDamage) {
                    player.takeDamage(5); // Small but constant damage
                }
                
                // Visual corruption effect on player
                this.createCorruptionEffect(player.position || player.mesh.position);
            }
        }
    }

    createCorruptionEffect(position) {
        const effectGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0x440000,
            transparent: true,
            opacity: 0.6
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        effect.position.y += Math.random() * 2;
        this.scene.add(effect);

        // Float upward and fade
        const effectInterval = setInterval(() => {
            effect.position.y += 0.1;
            effect.material.opacity -= 0.05;
            effect.scale.multiplyScalar(1.05);

            if (effect.material.opacity <= 0) {
                this.scene.remove(effect);
                clearInterval(effectInterval);
            }
        }, 50);
    }

    animateAttack() {
        // Boss animation during attacks
        if (this.arms) {
            this.arms.forEach((arm, index) => {
                setTimeout(() => {
                    // Swing arms
                    const originalZ = arm.rotation.z;
                    arm.rotation.z = originalZ + (index % 2 === 0 ? 0.5 : -0.5);
                    
                    setTimeout(() => {
                        arm.rotation.z = originalZ;
                    }, 500);
                }, index * 100);
            });
        }
    }

    animateBossEffects(deltaTime) {
        // Animate heads - independent movement
        if (this.heads) {
            this.heads.forEach((head, index) => {
                const time = Date.now() * 0.001;
                head.rotation.y = Math.sin(time + index) * 0.3;
                head.rotation.x = Math.sin(time * 0.7 + index) * 0.2;
            });
        }

        // Animate tentacles - writhing movement
        if (this.tentacles) {
            const time = Date.now() * 0.003;
            this.tentacles.forEach((tentacle, index) => {
                tentacle.children.forEach((segment, segmentIndex) => {
                    segment.rotation.z = Math.sin(time + index + segmentIndex * 0.5) * 0.3;
                    segment.position.y = -segmentIndex * 0.8 + Math.sin(time + index + segmentIndex) * 0.2;
                });
            });
        }

        // Corruption field pulsing
        if (this.corruptionField) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
            this.corruptionField.scale.setScalar(pulse);
            this.corruptionField.rotation.y += deltaTime * 0.001;
        }

        // Boss aura rotation
        if (this.bossAura) {
            this.bossAura.rotation.y += deltaTime * 0.002;
            const auraPulse = Math.sin(Date.now() * 0.003) * 0.05 + 0.1;
            this.bossAura.material.opacity = auraPulse;
        }
    }

    takeDamage(amount, damageType) {
        // No damage during phase transitions
        if (this.invulnerable) return;

        // Reduced damage from certain types
        if (damageType === 'physical') {
            amount *= 0.7; // Resistant to physical damage
        } else if (damageType === 'holy') {
            amount *= 1.5; // Vulnerable to holy damage
        }

        this.health -= amount;

        // Damage feedback
        if (this.body) {
            const originalColor = this.body.material.color.getHex();
            this.body.material.color.setHex(0xff4400);
            
            setTimeout(() => {
                this.body.material.color.setHex(originalColor);
            }, 200);
        }

        // Angry reaction to damage
        if (Math.random() < 0.3) {
            this.unholyScream({ position: this.target || this.position });
        }

        // Create damage sparks
        this.createDamageSparks();
    }

    createDamageSparks() {
        const sparkCount = 15;
        for (let i = 0; i < sparkCount; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                emissive: 0xff4400,
                emissiveIntensity: 1.0
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(this.position);
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 8
            ));
            this.scene.add(spark);

            // Animate sparks
            const sparkVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 3
            );

            const sparkInterval = setInterval(() => {
                spark.position.add(sparkVelocity.multiplyScalar(0.1));
                sparkVelocity.y -= 0.05; // Gravity
                spark.scale.multiplyScalar(0.95);

                if (spark.scale.x < 0.1) {
                    this.scene.remove(spark);
                    clearInterval(sparkInterval);
                }
            }, 50);
        }
    }

    destroy() {
        // Clean up minions
        this.activeMinions.forEach(minion => {
            if (minion.destroy) {
                minion.destroy();
            }
        });

        // Clean up visual effects
        if (this.corruptionField) {
            this.scene.remove(this.corruptionField);
        }
        if (this.bossAura) {
            this.scene.remove(this.bossAura);
        }

        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Epic death explosion
        this.createDeathExplosion();
    }

    createDeathExplosion() {
        // Massive boss death effect
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const explosionPos = this.position.clone();
                explosionPos.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    Math.random() * 8,
                    (Math.random() - 0.5) * 10
                ));
                
                const explosionGeometry = new THREE.SphereGeometry(4 + Math.random() * 3, 16, 16);
                const explosionMaterial = new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0xff0000 : 0xff4400,
                    transparent: true,
                    opacity: 0.9
                });
                const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
                explosion.position.copy(explosionPos);
                this.scene.add(explosion);

                // Animate explosion
                let scale = 0.1;
                let opacity = 0.9;
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
            }, i * 300);
        }
    }

    getStatusInfo() {
        return {
            type: 'The Defiler',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'BOSS',
            phase: this.phase,
            maxPhase: this.maxPhase,
            abilities: ['Corruption Blast', 'Summon Minions', 'Unholy Scream', 'Corruption Wave', 'Corruption Aura'],
            activeMinions: this.activeMinions.length,
            maxMinions: this.maxMinions,
            phaseTransitioning: this.phaseTransitioning,
            invulnerable: this.invulnerable,
            enraged: this.enraged
        };
    }
}
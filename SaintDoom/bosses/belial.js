import * as THREE from 'three';
import { Enemy } from '../enemies/enemy.js';

export class Belial extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.name = 'Belial, The Lord of Lies';
        this.health = 3000;
        this.maxHealth = 3000;
        this.speed = 2.5;
        this.damage = 80;
        this.attackRange = 25;
        this.detectionRange = 100;
        
        // Form system - Belial has multiple forms/illusions
        this.currentForm = 'true'; // true, angel, priest, mib_director, shadow
        this.forms = {
            true: {
                health: 3000,
                damage: 80,
                color: 0x660000,
                abilities: ['shadow_wave', 'illusion_army', 'reality_tear', 'mind_prison']
            },
            angel: {
                health: 1500,
                damage: 60,
                color: 0xffffaa,
                abilities: ['false_light', 'corrupt_blessing', 'divine_deception']
            },
            priest: {
                health: 1000,
                damage: 40,
                color: 0x222222,
                abilities: ['dark_sermon', 'corrupt_prayer', 'false_martyrdom']
            },
            mib_director: {
                health: 1200,
                damage: 50,
                color: 0x1a1a1a,
                abilities: ['summon_agents', 'temporal_shift', 'mind_control']
            },
            shadow: {
                health: 800,
                damage: 100,
                color: 0x000000,
                abilities: ['void_strike', 'darkness_incarnate', 'shadow_split']
            }
        };
        
        // Illusion system
        this.illusions = [];
        this.maxIllusions = 6;
        this.illusionHealth = 200;
        this.mirrorImages = [];
        this.realityDistortion = false;
        
        // Deception mechanics
        this.lies = []; // Active lies affecting the player
        this.maxLies = 3;
        this.truthRevealed = false;
        this.deceptionLevel = 0; // 0-100, affects ability strength
        
        // Phase system
        this.phase = 1;
        this.maxPhase = 4;
        this.phaseTransitioning = false;
        
        // Special abilities
        this.mindPrison = null;
        this.realityTears = [];
        this.shadowRealm = false;
        this.corruptionAura = 20;
        
        // Combat state
        this.lastFormChange = 0;
        this.formChangeInterval = 15000;
        this.lastIllusionSpawn = 0;
        this.lastAbilityUse = 0;
        
        this.createMesh();
        this.initializeAura();
    }

    createMesh() {
        const bossGroup = new THREE.Group();

        // Base form - shifting demonic entity
        const bodyGeometry = new THREE.ConeGeometry(2, 6, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: this.forms[this.currentForm].color,
            emissive: 0x220000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 3;
        bossGroup.add(body);
        this.body = body;

        // Multiple faces representing lies
        this.faces = [];
        const facePositions = [
            { angle: 0, height: 4 },
            { angle: Math.PI * 2 / 3, height: 4 },
            { angle: Math.PI * 4 / 3, height: 4 }
        ];

        facePositions.forEach((pos, index) => {
            const faceGroup = new THREE.Group();
            
            // Face
            const faceGeometry = new THREE.SphereGeometry(0.8, 12, 12);
            const faceMaterial = new THREE.MeshPhongMaterial({
                color: 0xffddaa,
                emissive: 0x440000,
                emissiveIntensity: 0.3
            });
            const face = new THREE.Mesh(faceGeometry, faceMaterial);
            faceGroup.add(face);

            // Eyes
            for (let i = -1; i <= 1; i += 2) {
                const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const eyeMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 1.0
                });
                const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
                eye.position.set(i * 0.3, 0.2, 0.7);
                faceGroup.add(eye);
            }

            // Position face around body
            faceGroup.position.x = Math.cos(pos.angle) * 1.5;
            faceGroup.position.y = pos.height;
            faceGroup.position.z = Math.sin(pos.angle) * 1.5;
            faceGroup.rotation.y = -pos.angle;
            
            bossGroup.add(faceGroup);
            this.faces.push(faceGroup);
        });

        // Wings (changes based on form)
        this.wings = [];
        for (let i = -1; i <= 1; i += 2) {
            const wingGroup = new THREE.Group();
            
            const wingGeometry = new THREE.PlaneGeometry(4, 6);
            const wingMaterial = new THREE.MeshPhongMaterial({
                color: 0x440000,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.rotation.y = i * Math.PI / 4;
            wingGroup.add(wing);
            
            wingGroup.position.x = i * 2;
            wingGroup.position.y = 4;
            bossGroup.add(wingGroup);
            this.wings.push(wingGroup);
        }

        // Crown of lies
        const crownGroup = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const spikeGeometry = new THREE.ConeGeometry(0.2, 1.5, 4);
            const spikeMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                metalness: 0.8,
                roughness: 0.2
            });
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            const angle = (i / 8) * Math.PI * 2;
            spike.position.x = Math.cos(angle) * 0.8;
            spike.position.z = Math.sin(angle) * 0.8;
            spike.rotation.z = angle + Math.PI / 2;
            crownGroup.add(spike);
        }
        crownGroup.position.y = 6;
        bossGroup.add(crownGroup);
        this.crown = crownGroup;

        // Shadow tendrils
        this.tendrils = [];
        for (let i = 0; i < 6; i++) {
            const tendrilGeometry = new THREE.CylinderGeometry(0.3, 0.1, 4, 8);
            const tendrilMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.8
            });
            const tendril = new THREE.Mesh(tendrilGeometry, tendrilMaterial);
            const angle = (i / 6) * Math.PI * 2;
            tendril.position.x = Math.cos(angle) * 3;
            tendril.position.y = -1;
            tendril.position.z = Math.sin(angle) * 3;
            tendril.rotation.z = Math.random() * Math.PI / 4;
            bossGroup.add(tendril);
            this.tendrils.push(tendril);
        }

        bossGroup.position.copy(this.position);
        this.mesh = bossGroup;
        this.scene.add(bossGroup);
    }

    initializeAura() {
        // Deception aura
        const auraGeometry = new THREE.SphereGeometry(this.corruptionAura, 32, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x660066,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        this.mesh.add(aura);
        this.deceptionAura = aura;

        // Reality distortion effect
        const distortionGeometry = new THREE.TorusGeometry(15, 0.5, 8, 32);
        const distortionMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
        distortion.rotation.x = Math.PI / 2;
        distortion.visible = false;
        this.mesh.add(distortion);
        this.distortionRing = distortion;
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);

        // Update phase based on health
        this.updatePhase();

        // Form management
        if (Date.now() - this.lastFormChange > this.formChangeInterval && !this.phaseTransitioning) {
            this.changeForm();
        }

        // Combat behavior based on phase
        switch (this.phase) {
            case 1:
                this.phaseOnePattern(player, distance, deltaTime);
                break;
            case 2:
                this.phaseTwoPattern(player, distance, deltaTime);
                break;
            case 3:
                this.phaseThreePattern(player, distance, deltaTime);
                break;
            case 4:
                this.finalPhasePattern(player, distance, deltaTime);
                break;
        }

        // Update illusions
        this.updateIllusions(deltaTime, player);

        // Animation
        this.animateBoss(deltaTime);

        // Face player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
    }

    updatePhase() {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent <= 0.25 && this.phase < 4) {
            this.transitionToPhase(4);
        } else if (healthPercent <= 0.5 && this.phase < 3) {
            this.transitionToPhase(3);
        } else if (healthPercent <= 0.75 && this.phase < 2) {
            this.transitionToPhase(2);
        }
    }

    transitionToPhase(newPhase) {
        if (this.phaseTransitioning) return;
        
        this.phaseTransitioning = true;
        this.phase = newPhase;

        // Phase transition effects
        this.createPhaseTransitionEffect();

        // Special phase abilities
        switch (newPhase) {
            case 2:
                this.spawnIllusionArmy();
                break;
            case 3:
                this.activateShadowRealm();
                break;
            case 4:
                this.revealTrueForm();
                break;
        }

        setTimeout(() => {
            this.phaseTransitioning = false;
        }, 3000);
    }

    phaseOnePattern(player, distance, deltaTime) {
        // Deceptive combat - form switching and basic illusions
        if (distance <= this.attackRange) {
            const currentTime = Date.now();
            
            if (currentTime - this.lastAttackTime > 2000) {
                this.performFormAttack(player);
                this.lastAttackTime = currentTime;
            }

            if (currentTime - this.lastIllusionSpawn > 8000) {
                this.spawnIllusion();
                this.lastIllusionSpawn = currentTime;
            }
        }

        // Movement pattern - slow approach
        if (distance > 5) {
            const direction = new THREE.Vector3()
                .subVectors(player.position || player.mesh.position, this.position)
                .normalize();
            this.position.add(direction.multiplyScalar(this.speed * deltaTime / 1000));
        }
    }

    phaseTwoPattern(player, distance, deltaTime) {
        // Multiple illusions and lies
        const currentTime = Date.now();

        if (currentTime - this.lastAbilityUse > 5000) {
            this.castLie(player);
            this.lastAbilityUse = currentTime;
        }

        if (this.illusions.length < 3) {
            this.spawnIllusion();
        }

        // Teleporting between positions
        if (Math.random() < 0.01) {
            this.teleportToIllusion();
        }

        // Ranged attacks
        if (distance <= this.attackRange && currentTime - this.lastAttackTime > 1500) {
            this.performFormAttack(player);
            this.shadowWave(player);
            this.lastAttackTime = currentTime;
        }
    }

    phaseThreePattern(player, distance, deltaTime) {
        // Shadow realm and reality tears
        const currentTime = Date.now();

        // Maintain shadow realm
        if (this.shadowRealm) {
            this.updateShadowRealm(player);
        }

        // Create reality tears
        if (currentTime - this.lastAbilityUse > 4000) {
            this.createRealityTear(player);
            this.lastAbilityUse = currentTime;
        }

        // Aggressive illusion spawning
        if (this.illusions.length < this.maxIllusions) {
            this.spawnIllusion();
        }

        // Mind prison
        if (Math.random() < 0.005 && !this.mindPrison) {
            this.createMindPrison(player);
        }

        // Combat
        if (currentTime - this.lastAttackTime > 1000) {
            this.performFormAttack(player);
            this.lastAttackTime = currentTime;
        }
    }

    finalPhasePattern(player, distance, deltaTime) {
        // True form revealed - all abilities at maximum
        const currentTime = Date.now();

        // Constant form shifting
        if (currentTime - this.lastFormChange > 5000) {
            this.rapidFormShift();
        }

        // Maximum illusions
        while (this.illusions.length < this.maxIllusions) {
            this.spawnIllusion();
        }

        // Continuous attacks
        if (currentTime - this.lastAttackTime > 800) {
            this.performFormAttack(player);
            this.darknessIncarnate(player);
            this.lastAttackTime = currentTime;
        }

        // Reality breaking
        if (currentTime - this.lastAbilityUse > 3000) {
            this.breakReality(player);
            this.lastAbilityUse = currentTime;
        }

        // Teleport frequently
        if (Math.random() < 0.02) {
            this.teleportToIllusion();
        }
    }

    changeForm() {
        const forms = Object.keys(this.forms);
        let newForm;
        do {
            newForm = forms[Math.floor(Math.random() * forms.length)];
        } while (newForm === this.currentForm);

        this.transformToForm(newForm);
    }

    transformToForm(formName) {
        this.currentForm = formName;
        this.lastFormChange = Date.now();
        
        const form = this.forms[formName];
        
        // Update appearance
        if (this.body) {
            this.body.material.color.setHex(form.color);
        }

        // Update stats
        this.damage = form.damage;

        // Visual transformation effect
        this.createTransformationEffect();

        // Form-specific changes
        switch (formName) {
            case 'angel':
                this.transformToAngel();
                break;
            case 'priest':
                this.transformToPriest();
                break;
            case 'mib_director':
                this.transformToDirector();
                break;
            case 'shadow':
                this.transformToShadow();
                break;
        }
    }

    transformToAngel() {
        // White wings and holy light (corrupted)
        this.wings.forEach(wing => {
            wing.children[0].material.color.setHex(0xffffaa);
            wing.children[0].material.emissive = new THREE.Color(0xaaaa00);
            wing.children[0].material.emissiveIntensity = 0.5;
        });

        // False halo
        const haloGeometry = new THREE.TorusGeometry(1.2, 0.1, 8, 32);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xaaaa00,
            emissiveIntensity: 1.0
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.y = 7;
        halo.rotation.x = Math.PI / 2;
        this.mesh.add(halo);
        this.falseHalo = halo;
    }

    transformToPriest() {
        // Black robes effect
        this.wings.forEach(wing => {
            wing.children[0].material.color.setHex(0x000000);
            wing.children[0].material.opacity = 0.9;
        });

        // Corrupt rosary
        this.createCorruptRosary();
    }

    transformToDirector() {
        // MIB suit appearance
        this.wings.forEach(wing => {
            wing.visible = false;
        });

        // Sunglasses effect on faces
        this.faces.forEach(face => {
            face.children[1].material.color.setHex(0x000000);
            face.children[2].material.color.setHex(0x000000);
        });
    }

    transformToShadow() {
        // Pure darkness
        this.body.material.opacity = 0.5;
        this.wings.forEach(wing => {
            wing.children[0].material.color.setHex(0x000000);
            wing.children[0].material.opacity = 0.3;
        });

        // Shadow particles
        this.createShadowParticles();
    }

    performFormAttack(player) {
        const abilities = this.forms[this.currentForm].abilities;
        const ability = abilities[Math.floor(Math.random() * abilities.length)];

        switch (ability) {
            case 'shadow_wave':
                this.shadowWave(player);
                break;
            case 'illusion_army':
                this.spawnIllusionArmy();
                break;
            case 'reality_tear':
                this.createRealityTear(player);
                break;
            case 'mind_prison':
                this.createMindPrison(player);
                break;
            case 'false_light':
                this.falseLight(player);
                break;
            case 'corrupt_blessing':
                this.corruptBlessing(player);
                break;
            case 'divine_deception':
                this.divineDeception(player);
                break;
            case 'dark_sermon':
                this.darkSermon(player);
                break;
            case 'corrupt_prayer':
                this.corruptPrayer(player);
                break;
            case 'false_martyrdom':
                this.falseMartyrdom(player);
                break;
            case 'summon_agents':
                this.summonAgents();
                break;
            case 'temporal_shift':
                this.temporalShift(player);
                break;
            case 'mind_control':
                this.mindControl(player);
                break;
            case 'void_strike':
                this.voidStrike(player);
                break;
            case 'darkness_incarnate':
                this.darknessIncarnate(player);
                break;
            case 'shadow_split':
                this.shadowSplit();
                break;
        }
    }

    shadowWave(player) {
        const playerPosition = player.position || player.mesh.position;
        
        // Create expanding shadow wave
        const waveGeometry = new THREE.RingGeometry(0.5, 2, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.rotation.x = -Math.PI / 2;
        wave.position.copy(this.position);
        this.scene.add(wave);

        // Animate wave
        let scale = 1;
        const waveInterval = setInterval(() => {
            scale += 1;
            wave.scale.setScalar(scale);
            wave.material.opacity -= 0.02;

            // Check collision with player
            const waveDistance = wave.position.distanceTo(playerPosition);
            if (waveDistance <= scale * 2 && waveDistance >= scale * 0.5) {
                if (player.takeDamage) {
                    player.takeDamage(30);
                }
                if (player.addStatusEffect) {
                    player.addStatusEffect('shadowed', {
                        duration: 3000,
                        visionReduced: true
                    });
                }
            }

            if (wave.material.opacity <= 0) {
                this.scene.remove(wave);
                clearInterval(waveInterval);
            }
        }, 50);
    }

    spawnIllusion() {
        if (this.illusions.length >= this.maxIllusions) return;

        const illusionPosition = this.position.clone();
        illusionPosition.x += (Math.random() - 0.5) * 10;
        illusionPosition.z += (Math.random() - 0.5) * 10;

        // Create illusion mesh (copy of current form)
        const illusionGroup = new THREE.Group();
        
        // Simplified body
        const bodyGeometry = new THREE.ConeGeometry(1.5, 5, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: this.forms[this.currentForm].color,
            transparent: true,
            opacity: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 2.5;
        illusionGroup.add(body);

        illusionGroup.position.copy(illusionPosition);
        this.scene.add(illusionGroup);

        const illusion = {
            mesh: illusionGroup,
            position: illusionPosition,
            health: this.illusionHealth,
            active: true
        };

        this.illusions.push(illusion);

        // Illusion behavior
        this.animateIllusion(illusion);
    }

    animateIllusion(illusion) {
        const illusionInterval = setInterval(() => {
            if (!illusion.active || illusion.health <= 0) {
                this.scene.remove(illusion.mesh);
                this.illusions = this.illusions.filter(i => i !== illusion);
                clearInterval(illusionInterval);
                return;
            }

            // Float and rotate
            illusion.mesh.rotation.y += 0.05;
            illusion.mesh.position.y = illusion.position.y + Math.sin(Date.now() * 0.003) * 0.5;

            // Occasionally attack
            if (Math.random() < 0.01) {
                this.illusionAttack(illusion);
            }
        }, 50);
    }

    illusionAttack(illusion) {
        // Simple projectile from illusion
        const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: 0x660066,
            emissive: 0x440044,
            emissiveIntensity: 0.8
        });
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(illusion.position);
        this.scene.add(projectile);

        // Move projectile toward player (simplified)
        setTimeout(() => {
            this.scene.remove(projectile);
        }, 2000);
    }

    teleportToIllusion() {
        if (this.illusions.length === 0) return;

        const illusion = this.illusions[Math.floor(Math.random() * this.illusions.length)];
        
        // Swap positions with illusion
        const tempPos = this.position.clone();
        this.position.copy(illusion.position);
        illusion.position.copy(tempPos);

        if (this.mesh && illusion.mesh) {
            this.mesh.position.copy(this.position);
            illusion.mesh.position.copy(illusion.position);
        }

        // Teleport effect
        this.createTeleportEffect(tempPos);
        this.createTeleportEffect(this.position);
    }

    castLie(player) {
        if (this.lies.length >= this.maxLies) return;

        const lieTypes = ['false_health', 'inverted_controls', 'fake_enemies', 'wrong_objective'];
        const lie = lieTypes[Math.floor(Math.random() * lieTypes.length)];

        this.lies.push({
            type: lie,
            startTime: Date.now(),
            duration: 10000
        });

        // Apply lie effect to player
        if (player.addStatusEffect) {
            switch (lie) {
                case 'false_health':
                    player.addStatusEffect('false_health', {
                        duration: 10000,
                        displayHealth: Math.random() * 100
                    });
                    break;
                case 'inverted_controls':
                    player.addStatusEffect('inverted_controls', {
                        duration: 10000
                    });
                    break;
                case 'fake_enemies':
                    this.createFakeEnemies();
                    break;
                case 'wrong_objective':
                    player.addStatusEffect('confused_objective', {
                        duration: 10000,
                        fakeObjective: 'Protect Belial'
                    });
                    break;
            }
        }
    }

    createRealityTear(player) {
        const tearPosition = player.position ? player.position.clone() : player.mesh.position.clone();
        tearPosition.x += (Math.random() - 0.5) * 10;
        tearPosition.z += (Math.random() - 0.5) * 10;

        // Visual tear in reality
        const tearGeometry = new THREE.PlaneGeometry(2, 6);
        const tearMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const tear = new THREE.Mesh(tearGeometry, tearMaterial);
        tear.position.copy(tearPosition);
        tear.rotation.y = Math.random() * Math.PI;
        this.scene.add(tear);

        this.realityTears.push(tear);

        // Tear damages nearby entities
        const tearInterval = setInterval(() => {
            const playerPos = player.position || player.mesh.position;
            const distance = tear.position.distanceTo(playerPos);
            
            if (distance < 3) {
                if (player.takeDamage) {
                    player.takeDamage(15);
                }
            }

            // Tear closes after time
            tear.scale.y -= 0.02;
            if (tear.scale.y <= 0) {
                this.scene.remove(tear);
                this.realityTears = this.realityTears.filter(t => t !== tear);
                clearInterval(tearInterval);
            }
        }, 100);
    }

    createMindPrison(player) {
        if (this.mindPrison) return;

        const playerPosition = player.position || player.mesh.position;
        
        // Create prison walls
        const prisonGeometry = new THREE.BoxGeometry(8, 8, 8);
        const prisonMaterial = new THREE.MeshBasicMaterial({
            color: 0x660066,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const prison = new THREE.Mesh(prisonGeometry, prisonMaterial);
        prison.position.copy(playerPosition);
        this.scene.add(prison);

        this.mindPrison = prison;

        // Apply mind prison effect
        if (player.addStatusEffect) {
            player.addStatusEffect('mind_prison', {
                duration: 5000,
                movementLocked: true,
                hallucinations: true
            });
        }

        // Prison duration
        setTimeout(() => {
            this.scene.remove(prison);
            this.mindPrison = null;
        }, 5000);
    }

    activateShadowRealm() {
        this.shadowRealm = true;

        // Darken environment
        if (this.scene.fog) {
            this.originalFog = this.scene.fog.clone();
            this.scene.fog = new THREE.Fog(0x000000, 1, 20);
        }

        // Shadow realm visual
        const realmGeometry = new THREE.SphereGeometry(50, 32, 32);
        const realmMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide
        });
        const realm = new THREE.Mesh(realmGeometry, realmMaterial);
        realm.position.copy(this.position);
        this.scene.add(realm);
        this.shadowRealmSphere = realm;
    }

    updateShadowRealm(player) {
        if (!this.shadowRealmSphere) return;

        // Move with Belial
        this.shadowRealmSphere.position.copy(this.position);

        // Damage player if in shadow realm
        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);
        
        if (distance <= 50) {
            if (player.addStatusEffect) {
                player.addStatusEffect('shadow_realm', {
                    duration: 100,
                    continuousDamage: 2,
                    visionReduced: true
                });
            }
        }
    }

    revealTrueForm() {
        this.truthRevealed = true;
        this.currentForm = 'true';
        
        // Remove all disguises
        if (this.falseHalo) {
            this.mesh.remove(this.falseHalo);
        }

        // True form appearance
        this.body.material.color.setHex(0x000000);
        this.body.material.emissive = new THREE.Color(0x660000);
        this.body.material.emissiveIntensity = 1.0;
        this.body.scale.setScalar(1.5);

        // All faces become demonic
        this.faces.forEach(face => {
            face.children[0].material.color.setHex(0x660000);
            face.children[1].material.color.setHex(0xffff00);
            face.children[2].material.color.setHex(0xffff00);
        });

        // Wings become massive
        this.wings.forEach(wing => {
            wing.scale.setScalar(2);
            wing.children[0].material.color.setHex(0x000000);
            wing.children[0].material.emissive = new THREE.Color(0x440000);
        });
    }

    rapidFormShift() {
        // Quickly cycle through forms
        const forms = Object.keys(this.forms);
        let formIndex = 0;
        
        const shiftInterval = setInterval(() => {
            this.transformToForm(forms[formIndex]);
            formIndex++;
            
            if (formIndex >= forms.length) {
                clearInterval(shiftInterval);
                this.currentForm = 'true';
            }
        }, 200);
    }

    breakReality(player) {
        // Ultimate reality-breaking attack
        this.realityDistortion = true;
        this.distortionRing.visible = true;

        // Multiple reality tears
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createRealityTear(player);
            }, i * 500);
        }

        // Spawn maximum illusions
        while (this.illusions.length < this.maxIllusions) {
            this.spawnIllusion();
        }

        // Apply all lies
        const allLies = ['false_health', 'inverted_controls', 'fake_enemies', 'wrong_objective'];
        allLies.forEach(lie => {
            if (player.addStatusEffect) {
                player.addStatusEffect(lie, { duration: 15000 });
            }
        });
    }

    darknessIncarnate(player) {
        // Become one with darkness
        const darknessGeometry = new THREE.SphereGeometry(10, 16, 16);
        const darknessMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9
        });
        const darkness = new THREE.Mesh(darknessGeometry, darknessMaterial);
        darkness.position.copy(this.position);
        this.scene.add(darkness);

        // Expanding darkness
        let scale = 1;
        const darknessInterval = setInterval(() => {
            scale += 0.5;
            darkness.scale.setScalar(scale);
            darkness.material.opacity -= 0.02;

            // Damage everything in darkness
            const playerPos = player.position || player.mesh.position;
            if (darkness.position.distanceTo(playerPos) <= scale * 10) {
                if (player.takeDamage) {
                    player.takeDamage(5);
                }
            }

            if (darkness.material.opacity <= 0) {
                this.scene.remove(darkness);
                clearInterval(darknessInterval);
            }
        }, 100);
    }

    animateBoss(deltaTime) {
        if (!this.mesh) return;

        // Floating motion
        this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.002) * 0.5;

        // Rotate crown
        if (this.crown) {
            this.crown.rotation.y += deltaTime * 0.001;
        }

        // Animate faces
        this.faces.forEach((face, index) => {
            face.rotation.y = Math.sin(Date.now() * 0.001 + index) * 0.3;
            
            // Eyes glow
            const glow = Math.sin(Date.now() * 0.01 + index) * 0.5 + 0.5;
            face.children[1].material.emissiveIntensity = glow;
            face.children[2].material.emissiveIntensity = glow;
        });

        // Wing flapping
        this.wings.forEach((wing, index) => {
            const flap = Math.sin(Date.now() * 0.003) * 0.3;
            wing.rotation.z = index === 0 ? flap : -flap;
        });

        // Tendril movement
        this.tendrils.forEach((tendril, index) => {
            tendril.rotation.z = Math.sin(Date.now() * 0.002 + index) * 0.3;
            tendril.rotation.x = Math.sin(Date.now() * 0.003 + index) * 0.2;
        });

        // Deception aura pulse
        if (this.deceptionAura) {
            const pulse = Math.sin(Date.now() * 0.005) * 0.05 + 0.15;
            this.deceptionAura.material.opacity = pulse;
        }

        // Reality distortion animation
        if (this.distortionRing && this.distortionRing.visible) {
            this.distortionRing.rotation.z += deltaTime * 0.003;
            this.distortionRing.scale.x = 1 + Math.sin(Date.now() * 0.01) * 0.2;
            this.distortionRing.scale.y = 1 + Math.cos(Date.now() * 0.01) * 0.2;
        }
    }

    updateIllusions(deltaTime, player) {
        // Update active lies
        this.lies = this.lies.filter(lie => {
            return Date.now() - lie.startTime < lie.duration;
        });

        // Deception level based on active effects
        this.deceptionLevel = Math.min(100, 
            this.lies.length * 20 + 
            this.illusions.length * 10 + 
            (this.shadowRealm ? 20 : 0) +
            (this.realityDistortion ? 30 : 0)
        );
    }

    takeDamage(amount, damageType) {
        // Illusions can absorb some damage
        if (this.illusions.length > 0 && Math.random() < 0.3) {
            const illusion = this.illusions[Math.floor(Math.random() * this.illusions.length)];
            illusion.health -= amount;
            
            if (illusion.health <= 0) {
                illusion.active = false;
            }
            
            // Visual feedback
            this.createIllusionHitEffect(illusion.position);
            return;
        }

        // True damage
        this.health -= amount;
        this.lastDamageTime = Date.now();

        // Form-specific damage reactions
        if (this.currentForm === 'angel' && damageType === 'holy') {
            // Extra damage from holy weapons when in angel form (blasphemy)
            this.health -= amount * 0.5;
        }

        // Chance to reveal truth when damaged
        if (!this.truthRevealed && Math.random() < 0.1) {
            this.revealTrueForm();
        }

        // Create damage effect
        this.createDamageEffect();
    }

    createDamageEffect() {
        // Shadowy blood
        const bloodCount = 15;
        for (let i = 0; i < bloodCount; i++) {
            const bloodGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const bloodMaterial = new THREE.MeshBasicMaterial({
                color: 0x440000,
                transparent: true,
                opacity: 0.8
            });
            const blood = new THREE.Mesh(bloodGeometry, bloodMaterial);
            blood.position.copy(this.position);
            blood.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            ));
            this.scene.add(blood);

            // Animate blood
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            );

            const bloodInterval = setInterval(() => {
                blood.position.add(velocity.multiplyScalar(0.1));
                velocity.y -= 0.05;
                blood.material.opacity -= 0.02;

                if (blood.material.opacity <= 0) {
                    this.scene.remove(blood);
                    clearInterval(bloodInterval);
                }
            }, 50);
        }
    }

    destroy() {
        // Final death sequence
        if (this.mesh) {
            // Dramatic death
            this.createFinalDeathSequence();
            
            // Clean up illusions
            this.illusions.forEach(illusion => {
                this.scene.remove(illusion.mesh);
            });
            
            // Remove shadow realm
            if (this.shadowRealmSphere) {
                this.scene.remove(this.shadowRealmSphere);
            }
            
            // Clear reality tears
            this.realityTears.forEach(tear => {
                this.scene.remove(tear);
            });
            
            // Remove main mesh
            setTimeout(() => {
                this.scene.remove(this.mesh);
            }, 3000);
        }
    }

    createFinalDeathSequence() {
        // Reality restoration effect
        const restorationGeometry = new THREE.SphereGeometry(30, 32, 32);
        const restorationMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        const restoration = new THREE.Mesh(restorationGeometry, restorationMaterial);
        restoration.position.copy(this.position);
        this.scene.add(restoration);

        // Collapse animation
        let scale = 1;
        const collapseInterval = setInterval(() => {
            scale -= 0.05;
            restoration.scale.setScalar(scale);
            
            if (this.mesh) {
                this.mesh.scale.setScalar(scale);
                this.mesh.rotation.y += 0.2;
            }

            if (scale <= 0) {
                this.scene.remove(restoration);
                clearInterval(collapseInterval);
            }
        }, 50);

        // Truth revealed message
        console.log("The Lord of Lies has been vanquished. Truth prevails.");
    }

    // Additional ability implementations
    falseLight(player) {
        // Blinding false holy light
        const lightGeometry = new THREE.SphereGeometry(20, 16, 16);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.9
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.copy(this.position);
        this.scene.add(light);

        if (player.addStatusEffect) {
            player.addStatusEffect('blinded', {
                duration: 3000,
                visionWhiteout: true
            });
        }

        setTimeout(() => {
            this.scene.remove(light);
        }, 500);
    }

    corruptBlessing(player) {
        // Reverse healing - damages instead
        if (player.takeDamage) {
            player.takeDamage(40);
        }
        
        if (player.addStatusEffect) {
            player.addStatusEffect('corrupted', {
                duration: 5000,
                healingReversed: true
            });
        }
    }

    divineDeception(player) {
        // Makes player think they're invincible
        if (player.addStatusEffect) {
            player.addStatusEffect('false_invincibility', {
                duration: 8000,
                damageHidden: true
            });
        }
    }

    darkSermon(player) {
        // Confuses and slows player
        if (player.addStatusEffect) {
            player.addStatusEffect('sermon', {
                duration: 4000,
                movementSlowed: 0.3,
                confused: true
            });
        }
    }

    corruptPrayer(player) {
        // Drains holy power
        if (player.holyPower !== undefined) {
            player.holyPower = Math.max(0, player.holyPower - 30);
        }
    }

    falseMartyrdom(player) {
        // Pretends to die, then resurrects stronger
        this.mesh.visible = false;
        
        setTimeout(() => {
            this.mesh.visible = true;
            this.health = Math.min(this.maxHealth, this.health + 500);
            this.createResurrectionEffect();
        }, 3000);
    }

    summonAgents() {
        // Spawn corrupted MIB agents (simplified)
        for (let i = 0; i < 3; i++) {
            const agentPosition = this.position.clone();
            agentPosition.x += (Math.random() - 0.5) * 15;
            agentPosition.z += (Math.random() - 0.5) * 15;
            
            // Visual representation only
            const agentGeometry = new THREE.BoxGeometry(1, 2, 1);
            const agentMaterial = new THREE.MeshLambertMaterial({
                color: 0x1a1a1a
            });
            const agent = new THREE.Mesh(agentGeometry, agentMaterial);
            agent.position.copy(agentPosition);
            this.scene.add(agent);
            
            // Remove after time
            setTimeout(() => {
                this.scene.remove(agent);
            }, 10000);
        }
    }

    temporalShift(player) {
        // Slow time for player
        if (player.addStatusEffect) {
            player.addStatusEffect('temporal_slow', {
                duration: 5000,
                timeScale: 0.5
            });
        }
    }

    mindControl(player) {
        // Reverse player controls
        if (player.addStatusEffect) {
            player.addStatusEffect('mind_controlled', {
                duration: 4000,
                controlsReversed: true,
                forcedMovement: true
            });
        }
    }

    voidStrike(player) {
        // Direct void damage
        const strikeGeometry = new THREE.CylinderGeometry(0.5, 2, 20, 8);
        const strikeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.9
        });
        const strike = new THREE.Mesh(strikeGeometry, strikeMaterial);
        
        const playerPos = player.position || player.mesh.position;
        strike.position.copy(playerPos);
        strike.position.y = 10;
        this.scene.add(strike);

        // Strike falls
        const strikeInterval = setInterval(() => {
            strike.position.y -= 1;
            
            if (strike.position.y <= playerPos.y) {
                if (player.takeDamage) {
                    player.takeDamage(60);
                }
                this.scene.remove(strike);
                clearInterval(strikeInterval);
            }
        }, 50);
    }

    shadowSplit() {
        // Split into multiple shadow forms
        for (let i = 0; i < 3; i++) {
            const splitPosition = this.position.clone();
            splitPosition.x += (Math.random() - 0.5) * 10;
            splitPosition.z += (Math.random() - 0.5) * 10;
            
            this.spawnIllusion();
        }
        
        // Teleport to random position
        this.position.x += (Math.random() - 0.5) * 20;
        this.position.z += (Math.random() - 0.5) * 20;
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    // Helper effect methods
    createTransformationEffect() {
        const effectGeometry = new THREE.SphereGeometry(3, 16, 16);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: this.forms[this.currentForm].color,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(this.position);
        this.scene.add(effect);

        let scale = 1;
        const effectInterval = setInterval(() => {
            scale += 0.2;
            effect.scale.setScalar(scale);
            effect.material.opacity -= 0.02;

            if (effect.material.opacity <= 0) {
                this.scene.remove(effect);
                clearInterval(effectInterval);
            }
        }, 50);
    }

    createTeleportEffect(position) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x9900ff,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            ));
            this.scene.add(particle);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );

            const particleInterval = setInterval(() => {
                particle.position.add(velocity.multiplyScalar(0.1));
                particle.material.opacity -= 0.02;

                if (particle.material.opacity <= 0) {
                    this.scene.remove(particle);
                    clearInterval(particleInterval);
                }
            }, 50);
        }
    }

    createPhaseTransitionEffect() {
        const transitionGeometry = new THREE.TorusGeometry(10, 2, 16, 32);
        const transitionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const transition = new THREE.Mesh(transitionGeometry, transitionMaterial);
        transition.position.copy(this.position);
        transition.rotation.x = Math.PI / 2;
        this.scene.add(transition);

        let scale = 0.1;
        const transitionInterval = setInterval(() => {
            scale += 0.1;
            transition.scale.setScalar(scale);
            transition.rotation.z += 0.1;
            transition.material.opacity -= 0.01;

            if (transition.material.opacity <= 0) {
                this.scene.remove(transition);
                clearInterval(transitionInterval);
            }
        }, 50);
    }

    createCorruptRosary() {
        // Corrupt rosary visual
        const beadCount = 10;
        for (let i = 0; i < beadCount; i++) {
            const beadGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const beadMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                emissive: 0x220000,
                emissiveIntensity: 0.5
            });
            const bead = new THREE.Mesh(beadGeometry, beadMaterial);
            const angle = (i / beadCount) * Math.PI * 2;
            bead.position.x = Math.cos(angle) * 2;
            bead.position.y = 3;
            bead.position.z = Math.sin(angle) * 2;
            this.mesh.add(bead);
        }
    }

    createShadowParticles() {
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x000000,
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mesh.add(particles);
        this.shadowParticles = particles;
    }

    createFakeEnemies() {
        // Create illusory enemies
        for (let i = 0; i < 5; i++) {
            const fakePosition = this.position.clone();
            fakePosition.x += (Math.random() - 0.5) * 20;
            fakePosition.z += (Math.random() - 0.5) * 20;

            const fakeGeometry = new THREE.BoxGeometry(1, 2, 1);
            const fakeMaterial = new THREE.MeshBasicMaterial({
                color: 0x660000,
                transparent: true,
                opacity: 0.5
            });
            const fake = new THREE.Mesh(fakeGeometry, fakeMaterial);
            fake.position.copy(fakePosition);
            this.scene.add(fake);

            // Remove after duration
            setTimeout(() => {
                this.scene.remove(fake);
            }, 10000);
        }
    }

    createIllusionHitEffect(position) {
        const effectGeometry = new THREE.SphereGeometry(1, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.6
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.copy(position);
        this.scene.add(effect);

        setTimeout(() => {
            this.scene.remove(effect);
        }, 200);
    }

    createResurrectionEffect() {
        const resGeometry = new THREE.CylinderGeometry(0.1, 3, 10, 16);
        const resMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const res = new THREE.Mesh(resGeometry, resMaterial);
        res.position.copy(this.position);
        this.scene.add(res);

        let scale = 1;
        const resInterval = setInterval(() => {
            scale += 0.1;
            res.scale.x = scale;
            res.scale.z = scale;
            res.rotation.y += 0.2;
            res.material.opacity -= 0.02;

            if (res.material.opacity <= 0) {
                this.scene.remove(res);
                clearInterval(resInterval);
            }
        }, 50);
    }

    getStatusInfo() {
        return {
            type: 'Belial - Lord of Lies',
            health: this.health,
            maxHealth: this.maxHealth,
            phase: this.phase,
            currentForm: this.currentForm,
            illusionCount: this.illusions.length,
            activeLines: this.lies.length,
            deceptionLevel: this.deceptionLevel,
            shadowRealm: this.shadowRealm,
            truthRevealed: this.truthRevealed,
            threat: 'EXTREME'
        };
    }
}
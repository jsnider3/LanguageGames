
import * as THREE from 'three';
import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';
import { BelialPhaseOneState } from './belialStates/BelialPhaseOneState.js';
import { BelialAngelFormState } from './belialStates/BelialAngelFormState.js';
import { BelialPriestFormState } from './belialStates/BelialPriestFormState.js';
import { BelialMIBDirectorFormState } from './belialStates/BelialMIBDirectorFormState.js';
import { BelialShadowFormState } from './belialStates/BelialShadowFormState.js';
import { BelialTrueFormState } from './belialStates/BelialTrueFormState.js';
import { BelialPhaseTwoState } from './belialStates/BelialPhaseTwoState.js';
import { BelialPhaseThreeState } from './belialStates/BelialPhaseThreeState.js';
import { BelialFinalPhaseState } from './belialStates/BelialFinalPhaseState.js';

export class Belial extends BaseEnemy {
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
                color: THEME.bosses.belial.primary,
                abilities: ['shadow_wave', 'illusion_army', 'reality_tear', 'mind_prison']
            },
            angel: {
                health: 1500,
                damage: 60,
                color: THEME.lights.point.holy,
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
                color: THEME.materials.black,
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

        // Effects management
        this.activeEffects = [];
        this.falseHalo = null;
        
        this.createMesh();
        this.initializeAura();

        // Initialize state
        this.currentState = new BelialPhaseOneState(this);
        this.currentState.enter();
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
                emissive: THEME.materials.robeEmissive,
                emissiveIntensity: 0.3
            });
            const face = new THREE.Mesh(faceGeometry, faceMaterial);
            faceGroup.add(face);

            // Eyes
            for (let i = -1; i <= 1; i += 2) {
                const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const eyeMaterial = new THREE.MeshBasicMaterial({
                    color: THEME.ui.health.low,
                    emissive: THEME.ui.health.low,
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
                color: THEME.materials.robeEmissive,
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
                color: THEME.materials.wall.armory,
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
                color: THEME.materials.black,
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
            color: THEME.enemies.possessed.aura,
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

        // Delegate update to the current state
        if (this.currentState) {
            this.currentState.update(deltaTime, player);
        }

        // Update illusions (if they are global to Belial, not specific to a form)
        this.updateIllusions(deltaTime, player);

        // Animation (global animations like floating)
        this.animateBoss(deltaTime);

        // Face player
        if (this.mesh) {
            const playerPosition = player.position || player.mesh.position;
            this.mesh.lookAt(playerPosition);
        }
        
        this.updateEffects(deltaTime);
    }

    // Method to change state
    changeState(newState) {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = newState;
        this.currentState.enter();
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

    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.currentTime += deltaTime;
            const progress = effect.currentTime / effect.duration;

            if (progress >= 1) {
                this.scene.remove(effect.mesh);
                return false;
            }

            switch (effect.type) {
                case 'wave':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'tear':
                    effect.mesh.scale.y -= effect.scaleRate * deltaTime;
                    break;
                case 'blood':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    effect.velocity.y -= 9.8 * deltaTime;
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'transformation':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'teleport':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'phase_transition':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.rotation.z += effect.rotationRate * deltaTime;
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'resurrection':
                    effect.mesh.scale.x += effect.scaleRate * deltaTime;
                    effect.mesh.scale.z += effect.scaleRate * deltaTime;
                    effect.mesh.rotation.y += effect.rotationRate * deltaTime;
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'collapse':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x - effect.scaleRate * deltaTime);
                    if (this.mesh) {
                        this.mesh.scale.setScalar(this.mesh.scale.x - effect.scaleRate * deltaTime);
                        this.mesh.rotation.y += effect.rotationRate * deltaTime;
                    }
                    break;
            }
            return true;
        });
    }

    // New methods for state management
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
                // this.transformToAngel(); // Handled by state
                this.changeState(new BelialAngelFormState(this));
                break;
            case 'priest':
                // this.transformToPriest(); // Handled by state
                this.changeState(new BelialPriestFormState(this));
                break;
            case 'mib_director':
                // this.transformToDirector(); // Handled by state
                this.changeState(new BelialMIBDirectorFormState(this));
                break;
            case 'shadow':
                // this.transformToShadow(); // Handled by state
                this.changeState(new BelialShadowFormState(this));
                break;
            case 'true':
                this.changeState(new BelialTrueFormState(this));
                break;
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
                this.changeState(new BelialPhaseTwoState(this));
                break;
            case 3:
                this.changeState(new BelialPhaseThreeState(this));
                break;
            case 4:
                this.changeState(new BelialFinalPhaseState(this));
                break;
        }

        setTimeout(() => {
            this.phaseTransitioning = false;
        }, 3000);
    }

    shadowWave(player) {
        const playerPosition = player.position || player.mesh.position;
        
        // Create expanding shadow wave
        const waveGeometry = new THREE.RingGeometry(0.5, 2, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: THEME.materials.black,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.rotation.x = -Math.PI / 2;
        wave.position.copy(this.position);
        this.scene.add(wave);

        this.activeEffects.push({
            mesh: wave,
            type: 'wave',
            duration: 2500,
            currentTime: 0,
            scaleRate: 50,
            opacityRate: 0.02 / 0.05,
            update: (effect, deltaTime) => {
                const waveDistance = effect.mesh.position.distanceTo(playerPosition);
                if (waveDistance <= effect.mesh.scale.x * 2 && waveDistance >= effect.mesh.scale.x * 0.5) {
                    if (player.takeDamage) {
                        player.takeDamage(30 * deltaTime, "Belial Dark Wave");
                    }
                    if (player.addStatusEffect) {
                        player.addStatusEffect('shadowed', {
                            duration: 3000,
                            visionReduced: true
                        });
                    }
                }
            }
        });
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
            active: true,
            update: (deltaTime) => {
                if (!illusion.active || illusion.health <= 0) {
                    this.scene.remove(illusion.mesh);
                    this.illusions = this.illusions.filter(i => i !== illusion);
                    return;
                }

                // Float and rotate
                illusion.mesh.rotation.y += 0.05 * deltaTime * 60;
                illusion.mesh.position.y = illusion.position.y + Math.sin(Date.now() * 0.003) * 0.5;

                // Occasionally attack
                if (Math.random() < 0.01) {
                    this.illusionAttack(illusion);
                }
            }
        };

        this.illusions.push(illusion);
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
            color: THEME.enemies.possessed.aura,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const tear = new THREE.Mesh(tearGeometry, tearMaterial);
        tear.position.copy(tearPosition);
        tear.rotation.y = Math.random() * Math.PI;
        this.scene.add(tear);

        this.activeEffects.push({
            mesh: tear,
            type: 'tear',
            duration: 5000,
            currentTime: 0,
            scaleRate: 0.02 / 0.05,
            update: (effect, deltaTime) => {
                const playerPos = player.position || player.mesh.position;
                const distance = effect.mesh.position.distanceTo(playerPos);
                
                if (distance < 3) {
                    if (player.takeDamage) {
                        player.takeDamage(15 * deltaTime, "Belial Shadow Tentacle");
                    }
                }
            }
        });
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
            color: THEME.materials.black,
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
        this.body.material.color.setHex(THEME.materials.black);
        this.body.material.emissive = new THREE.Color(THEME.bosses.belial.primary);
        this.body.material.emissiveIntensity = 1.0;
        this.body.scale.setScalar(1.5);

        // All faces become demonic
        this.faces.forEach(face => {
            face.children[0].material.color.setHex(THEME.bosses.belial.primary);
            face.children[1].material.color.setHex(THEME.ui.health.medium);
            face.children[2].material.color.setHex(THEME.ui.health.medium);
        });

        // Wings become massive
        this.wings.forEach(wing => {
            wing.scale.setScalar(2);
            wing.children[0].material.color.setHex(THEME.materials.black);
            wing.children[0].material.emissive = new THREE.Color(THEME.materials.robeEmissive);
        });
    }

    

    

    

    animateBoss(deltaTime) {
        if (!this.mesh) return;

        // Floating motion
        this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.002) * 0.5;

        // Rotate crown
        if (this.crown) {
            this.crown.rotation.y += deltaTime * 0.1;
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
            this.distortionRing.rotation.z += deltaTime * 3;
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

        this.illusions.forEach(illusion => illusion.update(deltaTime));
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
                color: THEME.materials.robeEmissive,
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

            this.activeEffects.push({
                mesh: blood,
                type: 'blood',
                duration: 1000,
                currentTime: 0,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 3
                ),
                opacityRate: 0.02 / 0.05
            });
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
            color: THEME.lights.spot.white,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        const restoration = new THREE.Mesh(restorationGeometry, restorationMaterial);
        restoration.position.copy(this.position);
        this.scene.add(restoration);

        this.activeEffects.push({
            mesh: restoration,
            type: 'collapse',
            duration: 1000,
            currentTime: 0,
            scaleRate: 0.05 / 0.05,
            rotationRate: 0.2 / 0.05
        });

        // Truth revealed message
        console.log("The Lord of Lies has been vanquished. Truth prevails.");
    }

    // Additional ability implementations
    falseLight(player) {
        // Blinding false holy light
        const lightGeometry = new THREE.SphereGeometry(20, 16, 16);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: THEME.lights.point.holy,
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
            player.takeDamage(40, "Belial Corrupt Blessing");
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
            color: THEME.materials.black,
            transparent: true,
            opacity: 0.9
        });
        const strike = new THREE.Mesh(strikeGeometry, strikeMaterial);
        
        const playerPos = player.position || player.mesh.position;
        strike.position.copy(playerPos);
        strike.position.y = 10;
        this.scene.add(strike);

        this.activeEffects.push({
            mesh: strike,
            type: 'fall',
            duration: 1000,
            currentTime: 0,
            fallSpeed: 10,
            targetY: playerPos.y,
            onEnd: () => {
                if (player.takeDamage) {
                    player.takeDamage(60, "Belial Shadow Teleport");
                }
            }
        });
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

        this.activeEffects.push({
            mesh: effect,
            type: 'transformation',
            duration: 2500,
            currentTime: 0,
            scaleRate: 0.2 / 0.05,
            opacityRate: 0.02 / 0.05
        });
    }

    createTeleportEffect(position) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: THEME.enemies.possessed.aura,
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

            this.activeEffects.push({
                mesh: particle,
                type: 'teleport',
                duration: 2500,
                currentTime: 0,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ),
                opacityRate: 0.02 / 0.05
            });
        }
    }

    createPhaseTransitionEffect() {
        const transitionGeometry = new THREE.TorusGeometry(10, 2, 16, 32);
        const transitionMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.low,
            transparent: true,
            opacity: 0.8
        });
        const transition = new THREE.Mesh(transitionGeometry, transitionMaterial);
        transition.position.copy(this.position);
        transition.rotation.x = Math.PI / 2;
        this.scene.add(transition);

        this.activeEffects.push({
            mesh: transition,
            type: 'phase_transition',
            duration: 5000,
            currentTime: 0,
            scaleRate: 0.1 / 0.05,
            rotationRate: 0.1 / 0.05,
            opacityRate: 0.01 / 0.05
        });
    }

    createCorruptRosary() {
        // Corrupt rosary visual
        const beadCount = 10;
        for (let i = 0; i < beadCount; i++) {
            const beadGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const beadMaterial = new THREE.MeshPhongMaterial({
                color: THEME.materials.black,
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
            color: THEME.materials.black,
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
                color: THEME.bosses.belial.primary,
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
            color: THEME.enemies.possessed.aura,
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
            color: THEME.ui.health.low,
            transparent: true,
            opacity: 0.8
        });
        const res = new THREE.Mesh(resGeometry, resMaterial);
        res.position.copy(this.position);
        this.scene.add(res);

        this.activeEffects.push({
            mesh: res,
            type: 'resurrection',
            duration: 2500,
            currentTime: 0,
            scaleRate: 0.1 / 0.05,
            rotationRate: 0.2 / 0.05,
            opacityRate: 0.02 / 0.05
        });
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

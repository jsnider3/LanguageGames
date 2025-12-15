
import * as THREE from 'three';
import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';

export class TheIronTyrant extends BaseEnemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Boss specific properties
        this.destructibleParts = {
            leftArm: { health: 200, maxHealth: 200, destroyed: false, weaponType: 'cannon' },
            rightArm: { health: 200, maxHealth: 200, destroyed: false, weaponType: 'minigun' },
            leftShoulder: { health: 150, maxHealth: 150, destroyed: false, weaponType: 'rockets' },
            rightShoulder: { health: 150, maxHealth: 150, destroyed: false, weaponType: 'laser' },
            chestCore: { health: 300, maxHealth: 300, destroyed: false, critical: true }
        };
        
        // Weapon systems
        this.weaponSystems = {
            cannon: { damage: 60, cooldown: 3000, range: 30, lastFired: 0 },
            minigun: { damage: 8, cooldown: 100, range: 25, lastFired: 0, spinUp: false },
            rockets: { damage: 40, cooldown: 4000, range: 35, lastFired: 0, salvoCount: 4 },
            laser: { damage: 30, cooldown: 2000, range: 40, lastFired: 0, continuous: false },
            stomp: { damage: 100, cooldown: 5000, range: 8, lastFired: 0 },
            shockwave: { damage: 50, cooldown: 8000, range: 20, lastFired: 0 }
        };
        this.detectionRange = 60;
        
        // Mech state
        this.berserkMode = false;
        this.siegeMode = false;
        this.powerCore = 100;
        this.maxPowerCore = 100;
        this.heatLevel = 0;
        this.maxHeat = 100;
        this.overheated = false;
        this.systemsOnline = true;
        
        // Visual components
        this.mechParts = {};
        this.smokeEmitters = [];
        this.sparkEmitters = [];
        this.warningLights = [];
        
        // Demonic possession effects
        this.possessionLevel = 1.0;
        this.demonicEnergy = 100;
        this.maxDemonicEnergy = 100;
        
        this.activeEffects = [];

        this.createMesh();
        this.initializeSystemStatus();
    }

    createMesh() {
        const tyrantGroup = new THREE.Group();

        // Main chassis - massive mech body
        const chassisGeometry = new THREE.BoxGeometry(5, 6, 3);
        const chassisMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.2
        });
        const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.y = 3;
        tyrantGroup.add(chassis);
        this.mechParts.chassis = chassis;

        // Cockpit/Head - corrupted control center
        const headGeometry = new THREE.BoxGeometry(2, 2, 2);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a1a,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 6.5;
        tyrantGroup.add(head);
        this.mechParts.head = head;

        // Demonic eyes in cockpit
        const eyeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: THEME.ui.health.low,
            emissive: THEME.bosses.belial.primary,
            emissiveIntensity: 1.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.5, 6.7, 1);
        tyrantGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.5, 6.7, 1);
        tyrantGroup.add(rightEye);
        
        this.leftEye = leftEye;
        this.rightEye = rightEye;

        // Destructible left arm with cannon
        this.createLeftArm(tyrantGroup);
        
        // Destructible right arm with minigun
        this.createRightArm(tyrantGroup);
        
        // Shoulder-mounted weapon systems
        this.createShoulderWeapons(tyrantGroup);
        
        // Chest core - weak point when exposed
        this.createChestCore(tyrantGroup);
        
        // Massive legs
        this.createLegs(tyrantGroup);
        
        // Demonic corruption effects
        this.addCorruptionDetails(tyrantGroup);
        
        // Armor plating
        this.addArmorPlating(tyrantGroup);

        tyrantGroup.position.copy(this.position);
        this.mesh = tyrantGroup;
        this.scene.add(tyrantGroup);
    }

    createLeftArm(tyrantGroup) {
        const armGroup = new THREE.Group();
        
        // Upper arm
        const upperArmGeometry = new THREE.BoxGeometry(1, 3, 1);
        const armMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a3a3a,
            metalness: 0.8
        });
        const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        upperArm.position.y = 2;
        armGroup.add(upperArm);
        
        // Lower arm
        const lowerArmGeometry = new THREE.BoxGeometry(0.8, 2.5, 0.8);
        const lowerArm = new THREE.Mesh(lowerArmGeometry, armMaterial);
        lowerArm.position.y = -0.5;
        armGroup.add(lowerArm);
        
        // Cannon weapon
        const cannonGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
        const cannonMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x1a1a1a,
            metalness: 0.9
        });
        const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        cannon.rotation.z = Math.PI / 2;
        cannon.position.set(1.5, -1, 0);
        armGroup.add(cannon);
        
        // Muzzle
        const muzzleGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.5, 8);
        const muzzle = new THREE.Mesh(muzzleGeometry, cannonMaterial);
        muzzle.position.set(2.5, -1, 0);
        muzzle.rotation.z = Math.PI / 2;
        armGroup.add(muzzle);
        
        armGroup.position.set(-3.5, 4, 0);
        tyrantGroup.add(armGroup);
        this.mechParts.leftArm = armGroup;
    }

    createRightArm(tyrantGroup) {
        const armGroup = new THREE.Group();
        
        // Upper arm
        const upperArmGeometry = new THREE.BoxGeometry(1, 3, 1);
        const armMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a3a3a,
            metalness: 0.8
        });
        const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        upperArm.position.y = 2;
        armGroup.add(upperArm);
        
        // Lower arm
        const lowerArmGeometry = new THREE.BoxGeometry(0.8, 2.5, 0.8);
        const lowerArm = new THREE.Mesh(lowerArmGeometry, armMaterial);
        lowerArm.position.y = -0.5;
        armGroup.add(lowerArm);
        
        // Minigun weapon
        const minigunGroup = new THREE.Group();
        
        // Multiple barrels
        for (let i = 0; i < 6; i++) {
            const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
            const barrelMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x0a0a0a,
                metalness: 0.95
            });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            barrel.position.set(
                Math.cos(angle) * 0.3,
                -1,
                Math.sin(angle) * 0.3
            );
            barrel.rotation.z = Math.PI / 2;
            minigunGroup.add(barrel);
        }
        
        // Minigun housing
        const housingGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const housing = new THREE.Mesh(housingGeometry, armMaterial);
        housing.rotation.z = Math.PI / 2;
        housing.position.set(0, -1, 0);
        minigunGroup.add(housing);
        
        minigunGroup.position.x = 1.5;
        armGroup.add(minigunGroup);
        this.minigunBarrels = minigunGroup;
        
        armGroup.position.set(3.5, 4, 0);
        tyrantGroup.add(armGroup);
        this.mechParts.rightArm = armGroup;
    }

    createShoulderWeapons(tyrantGroup) {
        // Left shoulder - rocket launcher
        const leftShoulderGroup = new THREE.Group();
        
        const rocketPodGeometry = new THREE.BoxGeometry(1.5, 1, 2);
        const rocketPodMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8
        });
        const rocketPod = new THREE.Mesh(rocketPodGeometry, rocketPodMaterial);
        leftShoulderGroup.add(rocketPod);
        
        // Rocket tubes
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const tubeGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6);
                const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
                tube.position.set(
                    -0.4 + col * 0.4,
                    0,
                    -0.3 + row * 0.6
                );
                leftShoulderGroup.add(tube);
            }
        }
        
        leftShoulderGroup.position.set(-3, 6, 0);
        tyrantGroup.add(leftShoulderGroup);
        this.mechParts.leftShoulder = leftShoulderGroup;
        
        // Right shoulder - laser cannon
        const rightShoulderGroup = new THREE.Group();
        
        const laserBaseGeometry = new THREE.BoxGeometry(1, 1, 1);
        const laserBase = new THREE.Mesh(laserBaseGeometry, rocketPodMaterial);
        rightShoulderGroup.add(laserBase);
        
        const laserCannonGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8);
        const laserCannonMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0a0a0a,
            metalness: 0.95,
            emissive: 0x000044,
            emissiveIntensity: 0.3
        });
        const laserCannon = new THREE.Mesh(laserCannonGeometry, laserCannonMaterial);
        laserCannon.rotation.z = Math.PI / 2;
        laserCannon.position.x = 1;
        rightShoulderGroup.add(laserCannon);
        
        // Focusing lens
        const lensGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const lensMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            emissive: 0x002244,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.8
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.x = 2.3;
        rightShoulderGroup.add(lens);
        this.laserLens = lens;
        
        rightShoulderGroup.position.set(3, 6, 0);
        tyrantGroup.add(rightShoulderGroup);
        this.mechParts.rightShoulder = rightShoulderGroup;
    }

    createChestCore(tyrantGroup) {
        // Protected chest core - exposed when armor is damaged
        const coreGroup = new THREE.Group();
        
        // Core housing
        const housingGeometry = new THREE.BoxGeometry(2, 2, 0.5);
        const housingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a,
            metalness: 0.9
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        coreGroup.add(housing);
        
        // Power core (weak point)
        const coreGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            emissive: 0x661100,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        coreGroup.add(core);
        this.powerCoreVisual = core;
        
        // Protection plates (can be destroyed)
        const plateGeometry = new THREE.BoxGeometry(2.2, 2.2, 0.3);
        const plateMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5a5a5a,
            metalness: 0.95
        });
        const protectionPlate = new THREE.Mesh(plateGeometry, plateMaterial);
        protectionPlate.position.z = 0.4;
        coreGroup.add(protectionPlate);
        this.corePlate = protectionPlate;
        
        coreGroup.position.set(0, 3, 1.6);
        tyrantGroup.add(coreGroup);
        this.mechParts.chestCore = coreGroup;
    }

    createLegs(tyrantGroup) {
        // Massive mechanical legs
        const legMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8
        });
        
        // Left leg
        const leftLegGroup = new THREE.Group();
        
        const leftThighGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
        const leftThigh = new THREE.Mesh(leftThighGeometry, legMaterial);
        leftThigh.position.y = -1.5;
        leftLegGroup.add(leftThigh);
        
        const leftShinGeometry = new THREE.BoxGeometry(1.2, 3, 1.2);
        const leftShin = new THREE.Mesh(leftShinGeometry, legMaterial);
        leftShin.position.y = -4.5;
        leftLegGroup.add(leftShin);
        
        const leftFootGeometry = new THREE.BoxGeometry(2, 0.5, 3);
        const leftFoot = new THREE.Mesh(leftFootGeometry, legMaterial);
        leftFoot.position.y = -6.25;
        leftLegGroup.add(leftFoot);
        
        leftLegGroup.position.set(-1.5, 0, 0);
        tyrantGroup.add(leftLegGroup);
        this.mechParts.leftLeg = leftLegGroup;
        
        // Right leg
        const rightLegGroup = new THREE.Group();
        
        const rightThigh = new THREE.Mesh(leftThighGeometry, legMaterial);
        rightThigh.position.y = -1.5;
        rightLegGroup.add(rightThigh);
        
        const rightShin = new THREE.Mesh(leftShinGeometry, legMaterial);
        rightShin.position.y = -4.5;
        rightLegGroup.add(rightShin);
        
        const rightFoot = new THREE.Mesh(leftFootGeometry, legMaterial);
        rightFoot.position.y = -6.25;
        rightLegGroup.add(rightFoot);
        
        rightLegGroup.position.set(1.5, 0, 0);
        tyrantGroup.add(rightLegGroup);
        this.mechParts.rightLeg = rightLegGroup;
    }

    addCorruptionDetails(tyrantGroup) {
        // Demonic runes on armor
        for (let i = 0; i < 12; i++) {
            const runeGeometry = new THREE.PlaneGeometry(0.5, 0.5);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: THEME.ui.health.low,
                emissive: THEME.materials.robeEmissive,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.8
            });
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(
                (Math.random() - 0.5) * 8,
                Math.random() * 6,
                1.6
            );
            rune.rotation.z = Math.random() * Math.PI * 2;
            tyrantGroup.add(rune);
        }

        // Hellfire vents
        for (let i = 0; i < 6; i++) {
            const ventGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 6);
            const ventMaterial = new THREE.MeshLambertMaterial({
                color: 0x1a1a1a,
                emissive: 0x220000,
                emissiveIntensity: 0.4
            });
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(
                (Math.random() - 0.5) * 6,
                Math.random() * 5 + 1,
                (Math.random() - 0.5) * 2
            );
            vent.rotation.x = Math.PI / 2;
            tyrantGroup.add(vent);
            this.smokeEmitters.push(vent);
        }

        // Battle damage
        this.createBattleDamage(tyrantGroup);
    }

    createBattleDamage(tyrantGroup) {
        // Sparking damage points
        const sparkCount = 20;
        const sparkGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const colors = new Float32Array(sparkCount * 3);

        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

            colors[i * 3] = 1;
            colors[i * 3 + 1] = Math.random() * 0.8;
            colors[i * 3 + 2] = 0;
        }

        sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sparkGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const sparkMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        tyrantGroup.add(sparks);
        this.damageParticles = sparks;
    }

    addArmorPlating(tyrantGroup) {
        // Heavy armor plates
        const armorPositions = [
            { x: 0, y: 4, z: 1.8, w: 4, h: 3, d: 0.2 }, // Front chest
            { x: -2.5, y: 4, z: 1.5, w: 1, h: 2, d: 0.2 }, // Left chest
            { x: 2.5, y: 4, z: 1.5, w: 1, h: 2, d: 0.2 }, // Right chest
        ];

        armorPositions.forEach(armor => {
            const armorGeometry = new THREE.BoxGeometry(armor.w, armor.h, armor.d);
            const armorMaterial = new THREE.MeshLambertMaterial({
                color: 0x6a6a6a,
                metalness: 0.95,
                roughness: 0.1
            });
            const armorPlate = new THREE.Mesh(armorGeometry, armorMaterial);
            armorPlate.position.set(armor.x, armor.y, armor.z);
            tyrantGroup.add(armorPlate);
        });
    }

    initializeSystemStatus() {
        // Track all systems status
        this.systemStatus = {
            weapons: { online: true, efficiency: 1.0 },
            mobility: { online: true, efficiency: 1.0 },
            targeting: { online: true, efficiency: 1.0 },
            cooling: { online: true, efficiency: 1.0 }
        };
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);

        // Update systems
        this.updateSystemStatus();
        this.updateHeatManagement(deltaTime);
        this.updatePowerCore(deltaTime);
        
        // Check for berserk mode activation
        if (this.health < this.maxHealth * 0.3 && !this.berserkMode) {
            this.activateBerserkMode();
        }

        // Combat AI
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            this.executeCombatStrategy(player, distance, deltaTime);
        } else {
            this.patrolMode(deltaTime);
        }

        // Animation updates
        this.animateMechSystems(deltaTime);
        
        // Update position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        
        this.updateEffects(deltaTime);
    }

    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.currentTime += deltaTime;
            const progress = effect.currentTime / effect.duration;

            if (progress >= 1) {
                this.scene.remove(effect.mesh);
                if (effect.onEnd) {
                    effect.onEnd();
                }
                return false;
            }

            switch (effect.type) {
                case 'minigun_bullet':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    break;
                case 'cannon_shell':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    effect.mesh.rotation.x += 0.1;
                    break;
                case 'rocket':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    break;
                case 'explosion':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'laser_impact':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'ground_crack':
                    effect.mesh.scale.x += effect.scaleRate * deltaTime;
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'shockwave':
                    effect.innerRadius += effect.radiusRate * deltaTime;
                    effect.outerRadius += effect.radiusRate * deltaTime;
                    effect.mesh.geometry.dispose();
                    effect.mesh.geometry = new THREE.RingGeometry(effect.innerRadius, effect.outerRadius, 32);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'berserk_aura':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
                case 'smoke':
                    effect.mesh.position.y += 0.1;
                    effect.mesh.scale.multiplyScalar(1.05);
                    effect.mesh.material.opacity -= 0.02;
                    break;
                case 'damage_spark':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    effect.velocity.y -= 9.8 * deltaTime;
                    effect.mesh.scale.multiplyScalar(0.95);
                    break;
                case 'falling_arm':
                    effect.mesh.position.y -= 0.2;
                    effect.mesh.rotation.x += 0.05;
                    effect.mesh.rotation.z += 0.03;
                    break;
                case 'death_explosion':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + effect.scaleRate * deltaTime);
                    effect.mesh.material.opacity -= effect.opacityRate * deltaTime;
                    break;
            }

            return true;
        });
    }

    updateSystemStatus() {
        // Update system efficiency based on part destruction
        let weaponEfficiency = 1.0;
        let mobilityEfficiency = 1.0;
        
        Object.keys(this.destructibleParts).forEach(part => {
            const partData = this.destructibleParts[part];
            if (partData.destroyed) {
                if (part.includes('Arm') || part.includes('Shoulder')) {
                    weaponEfficiency -= 0.25;
                }
                if (part === 'chestCore') {
                    // Core destruction is critical
                    this.systemStatus.weapons.efficiency *= 0.5;
                    this.systemStatus.mobility.efficiency *= 0.7;
                }
            }
        });
        
        this.systemStatus.weapons.efficiency = Math.max(0.2, weaponEfficiency);
        this.systemStatus.mobility.efficiency = Math.max(0.3, mobilityEfficiency);
    }

    executeCombatStrategy(player, distance, deltaTime) {
        const currentTime = Date.now();
        const weapons = this.weaponSystems;
        
        // Choose attack based on available parts and distance
        if (!this.destructibleParts.leftArm.destroyed && 
            distance <= weapons.cannon.range &&
            currentTime - weapons.cannon.lastFired > weapons.cannon.cooldown) {
            this.fireMainCannon(player);
        }
        
        if (!this.destructibleParts.rightArm.destroyed && 
            distance <= weapons.minigun.range &&
            currentTime - weapons.minigun.lastFired > weapons.minigun.cooldown) {
            this.fireMinigun(player);
        }
        
        if (!this.destructibleParts.leftShoulder.destroyed && 
            distance <= weapons.rockets.range &&
            currentTime - weapons.rockets.lastFired > weapons.rockets.cooldown) {
            this.launchRocketSalvo(player);
        }
        
        if (!this.destructibleParts.rightShoulder.destroyed && 
            distance <= weapons.laser.range &&
            currentTime - weapons.laser.lastFired > weapons.laser.cooldown) {
            this.fireLaserBeam(player);
        }
        
        // Stomp attack if close
        if (distance <= weapons.stomp.range &&
            currentTime - weapons.stomp.lastFired > weapons.stomp.cooldown) {
            this.performStomp(player);
        }
        
        // Shockwave in berserk mode
        if (this.berserkMode && 
            currentTime - weapons.shockwave.lastFired > weapons.shockwave.cooldown) {
            this.createShockwave(player);
        }
        
        // Movement
        this.mechMovement(player.position || player.mesh.position, distance, deltaTime);
    }

    fireMainCannon(player) {
        this.weaponSystems.cannon.lastFired = Date.now();
        this.heatLevel += 15;
        
        const playerPosition = player.position || player.mesh.position;
        const cannonPosition = this.mechParts.leftArm.position.clone();
        cannonPosition.add(this.position);
        
        // Create cannon shell
        const shellGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1, 8);
        const shellMaterial = new THREE.MeshLambertMaterial({
            color: THEME.materials.wall.armory,
            metalness: 0.8
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.position.copy(cannonPosition);
        
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, cannonPosition)
            .normalize();
        
        shell.lookAt(cannonPosition.clone().add(direction));
        
        const speed = 30;
        const velocity = direction.multiplyScalar(speed);
        
        this.scene.add(shell);
        this.activeEffects.push({
            mesh: shell,
            type: 'cannon_shell',
            duration: 3000,
            currentTime: 0,
            velocity: velocity,
            onEnd: () => this.createExplosion(shell.position)
        });
        
        // Muzzle flash
        this.createMuzzleFlash(cannonPosition);
        
        // Recoil animation
        this.animateCannonRecoil();
    }

    fireMinigun(player) {
        if (!this.weaponSystems.minigun.spinUp) {
            // Spin up minigun
            this.weaponSystems.minigun.spinUp = true;
            this.animateMinigunSpinUp();
            
            setTimeout(() => {
                this.weaponSystems.minigun.spinUp = false;
            }, 1000);
            return;
        }
        
        this.weaponSystems.minigun.lastFired = Date.now();
        this.heatLevel += 2;
        
        const playerPosition = player.position || player.mesh.position;
        const minigunPosition = this.mechParts.rightArm.position.clone();
        minigunPosition.add(this.position);
        
        // Create bullet stream
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createMinigunBullet(minigunPosition, playerPosition);
            }, i * 50);
        }
    }

    createMinigunBullet(startPos, targetPos) {
        const bulletGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const bulletMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.medium,
            emissive: 0x444400,
            emissiveIntensity: 0.8
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(startPos);
        
        const direction = new THREE.Vector3()
            .subVectors(targetPos, startPos)
            .normalize();
        
        // Add spread
        direction.x += (Math.random() - 0.5) * 0.15;
        direction.y += (Math.random() - 0.5) * 0.15;
        direction.z += (Math.random() - 0.5) * 0.15;
        direction.normalize();
        
        const speed = 50;
        const velocity = direction.multiplyScalar(speed);
        
        this.scene.add(bullet);
        this.activeEffects.push({
            mesh: bullet,
            type: 'minigun_bullet',
            duration: 2000,
            currentTime: 0,
            velocity: velocity
        });
    }

    launchRocketSalvo(player) {
        this.weaponSystems.rockets.lastFired = Date.now();
        this.heatLevel += 25;
        
        const playerPosition = player.position || player.mesh.position;
        const rocketPosition = this.mechParts.leftShoulder.position.clone();
        rocketPosition.add(this.position);
        
        // Launch multiple rockets
        for (let i = 0; i < this.weaponSystems.rockets.salvoCount; i++) {
            setTimeout(() => {
                this.createRocket(rocketPosition, playerPosition, i);
            }, i * 200);
        }
    }

    createRocket(startPos, targetPos, index) {
        const rocketGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8);
        const rocketMaterial = new THREE.MeshLambertMaterial({
            color: THEME.materials.metal.default,
            metalness: 0.7
        });
        const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
        
        // Offset for multiple rockets
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 2,
            (Math.random() - 0.5) * 2
        );
        rocket.position.copy(startPos.clone().add(offset));
        
        // Add exhaust trail
        const trailGeometry = new THREE.ConeGeometry(0.08, 0.8, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            emissive: 0x442200,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.y = -0.8;
        trail.rotation.x = Math.PI;
        rocket.add(trail);
        
        const direction = new THREE.Vector3()
            .subVectors(targetPos, rocket.position)
            .normalize();
        
        rocket.lookAt(rocket.position.clone().add(direction));
        
        const speed = 20;
        const velocity = direction.multiplyScalar(speed);
        
        this.scene.add(rocket);
        this.activeEffects.push({
            mesh: rocket,
            type: 'rocket',
            duration: 4000,
            currentTime: 0,
            velocity: velocity,
            onEnd: () => this.createExplosion(rocket.position)
        });
    }

    fireLaserBeam(player) {
        this.weaponSystems.laser.lastFired = Date.now();
        this.weaponSystems.laser.continuous = true;
        this.heatLevel += 20;
        
        const playerPosition = player.position || player.mesh.position;
        const laserPosition = this.mechParts.rightShoulder.position.clone();
        laserPosition.add(this.position);
        
        // Create continuous laser beam
        const distance = laserPosition.distanceTo(playerPosition);
        const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, distance, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            emissive: 0x0044aa,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        beam.position.copy(laserPosition.clone().lerp(playerPosition, 0.5));
        beam.lookAt(playerPosition);
        beam.rotation.x = Math.PI / 2;
        
        this.scene.add(beam);
        
        // Laser impact effect
        this.createLaserImpact(playerPosition);
        
        // Damage player
        if (player.takeDamage) {
            player.takeDamage(this.weaponSystems.laser.damage, "Iron Tyrant Plasma Beam");
        }
        
        // Animate laser lens
        if (this.laserLens) {
            this.laserLens.material.emissiveIntensity = 1.2;
        }
        
        // Remove beam after duration
        setTimeout(() => {
            this.scene.remove(beam);
            this.weaponSystems.laser.continuous = false;
            if (this.laserLens) {
                this.laserLens.material.emissiveIntensity = 0.6;
            }
        }, 1500);
    }

    performStomp(player) {
        this.weaponSystems.stomp.lastFired = Date.now();
        
        // Raise leg
        this.animateStompAttack();
        
        // Create ground shockwave
        setTimeout(() => {
            const stompPosition = this.position.clone();
            
            // Ground crack effect
            const crackGeometry = new THREE.PlaneGeometry(10, 0.5);
            const crackMaterial = new THREE.MeshBasicMaterial({
                color: THEME.materials.black,
                transparent: true,
                opacity: 0.8
            });
            
            for (let i = 0; i < 8; i++) {
                const crack = new THREE.Mesh(crackGeometry, crackMaterial);
                crack.position.copy(stompPosition);
                crack.position.y = 0.1;
                crack.rotation.x = -Math.PI / 2;
                crack.rotation.z = (i / 8) * Math.PI * 2;
                this.scene.add(crack);
                
                this.activeEffects.push({
                    mesh: crack,
                    type: 'ground_crack',
                    duration: 2500,
                    currentTime: 0,
                    scaleRate: 0.5 / 0.05,
                    opacityRate: 0.02 / 0.05
                });
            }
            
            // Damage if player is close
            const distance = this.position.distanceTo(player.position || player.mesh.position);
            if (distance <= this.weaponSystems.stomp.range) {
                if (player.takeDamage) {
                    player.takeDamage(this.weaponSystems.stomp.damage, "Iron Tyrant Ground Stomp");
                }
                
                // Knockback
                const knockbackDirection = new THREE.Vector3()
                    .subVectors(player.position || player.mesh.position, this.position)
                    .normalize()
                    .multiplyScalar(10);
                
                if (player.position) {
                    player.position.add(knockbackDirection);
                }
            }
        }, 500);
    }

    createShockwave(player) {
        this.weaponSystems.shockwave.lastFired = Date.now();
        
        // Massive shockwave in berserk mode
        const shockwaveGeometry = new THREE.RingGeometry(2, 4, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.low,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(this.position);
        shockwave.position.y = 0.5;
        shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(shockwave);
        
        this.activeEffects.push({
            mesh: shockwave,
            type: 'shockwave',
            duration: 2000,
            currentTime: 0,
            innerRadius: 2,
            outerRadius: 4,
            radiusRate: 1.5 / 0.1,
            opacityRate: 0.05 / 0.1,
            update: (effect, deltaTime) => {
                const distance = effect.mesh.position.distanceTo(player.position || player.mesh.position);
                if (distance >= effect.innerRadius && distance <= effect.outerRadius) {
                    if (player.takeDamage) {
                        player.takeDamage(this.weaponSystems.shockwave.damage * deltaTime, "Iron Tyrant EMP Shockwave");
                    }
                }
            }
        });
    }

    activateBerserkMode() {
        this.berserkMode = true;
        this.speed *= 1.5;
        this.damage *= 1.3;
        
        // Visual berserk effect
        if (this.mechParts.chassis) {
            this.mechParts.chassis.material.emissive = new THREE.Color(THEME.materials.robeEmissive);
            this.mechParts.chassis.material.emissiveIntensity = 0.5;
        }
        
        // Demonic energy surge
        this.createBerserkEffect();
        
        // All weapons fire faster
        Object.keys(this.weaponSystems).forEach(weapon => {
            this.weaponSystems[weapon].cooldown *= 0.6;
        });
    }

    createBerserkEffect() {
        const berserkGeometry = new THREE.SphereGeometry(12, 32, 32);
        const berserkMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.low,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const berserk = new THREE.Mesh(berserkGeometry, berserkMaterial);
        berserk.position.copy(this.position);
        this.scene.add(berserk);
        
        this.activeEffects.push({
            mesh: berserk,
            type: 'berserk_aura',
            duration: 1666,
            currentTime: 0,
            scaleRate: 0.2 / 0.05,
            opacityRate: 0.03 / 0.05
        });
    }

    mechMovement(playerPosition, distance, deltaTime) {
        // Heavy mech movement
        let moveSpeed = this.speed * this.systemStatus.mobility.efficiency;
        
        if (this.berserkMode) {
            // Aggressive pursuit in berserk mode
            const direction = new THREE.Vector3()
                .subVectors(playerPosition, this.position)
                .normalize();
            
            this.position.add(direction.multiplyScalar(moveSpeed * deltaTime));
        } else {
            // Tactical positioning
            let direction = new THREE.Vector3();
            
            if (distance < 8) {
                // Too close, back up for weapons
                direction.subVectors(this.position, playerPosition).normalize();
            } else if (distance > 20) {
                // Move closer
                direction.subVectors(playerPosition, this.position).normalize();
            } else {
                // Strafe at optimal range
                direction.crossVectors(
                    new THREE.Vector3().subVectors(playerPosition, this.position),
                    new THREE.Vector3(0, 1, 0)
                ).normalize();
            }
            
            this.position.add(direction.multiplyScalar(moveSpeed * deltaTime));
        }
        
        // Face player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
        
        // Create footstep effects
        if (Math.random() < 0.02) {
            this.createFootstepEffect();
        }
    }

    createFootstepEffect() {
        const stepGeometry = new THREE.RingGeometry(1.5, 2.5, 16);
        const stepMaterial = new THREE.MeshBasicMaterial({
            color: THEME.materials.wall.armory,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.copy(this.position);
        step.position.y = 0.1;
        step.rotation.x = -Math.PI / 2;
        this.scene.add(step);
        
        // Animate step
        setTimeout(() => {
            this.scene.remove(step);
        }, 2000);
    }

    updateHeatManagement(deltaTime) {
        // Heat dissipation
        if (this.heatLevel > 0) {
            this.heatLevel = Math.max(0, this.heatLevel - (20 * deltaTime));
        }
        
        // Overheating
        if (this.heatLevel >= this.maxHeat) {
            this.overheated = true;
            this.createOverheatEffect();
            
            // Systems shutdown
            setTimeout(() => {
                this.overheated = false;
                this.heatLevel = this.maxHeat * 0.5;
            }, 5000);
        }
        
        // Visual heat effects
        if (this.heatLevel > 70) {
            this.createHeatVenting();
        }
    }

    createOverheatEffect() {
        // Steam/smoke from vents
        this.smokeEmitters.forEach(vent => {
            const smokeGeometry = new THREE.SphereGeometry(0.3, 6, 6);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: THEME.materials.metal.default,
                transparent: true,
                opacity: 0.6
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.copy(vent.position);
            smoke.position.add(this.position);
            this.scene.add(smoke);
            
            this.activeEffects.push({
                mesh: smoke,
                type: 'smoke',
                duration: 2500,
                currentTime: 0
            });
        });
    }

    createHeatVenting() {
        if (Math.random() < 0.1) {
            this.smokeEmitters.forEach(vent => {
                if (Math.random() < 0.3) {
                    const ventGeometry = new THREE.ConeGeometry(0.2, 1, 6);
                    const ventMaterial = new THREE.MeshBasicMaterial({
                        color: 0xff4400,
                        transparent: true,
                        opacity: 0.5
                    });
                    const ventEffect = new THREE.Mesh(ventGeometry, ventMaterial);
                    ventEffect.position.copy(vent.position);
                    ventEffect.position.add(this.position);
                    ventEffect.rotation.x = -Math.PI / 2;
                    this.scene.add(ventEffect);
                    
                    setTimeout(() => {
                        this.scene.remove(ventEffect);
                    }, 500);
                }
            });
        }
    }

    updatePowerCore(deltaTime) {
        // Power management
        if (this.berserkMode) {
            this.powerCore = Math.max(0, this.powerCore - (30 * deltaTime));
            
            if (this.powerCore <= 0) {
                // Emergency shutdown
                this.systemsOnline = false;
                setTimeout(() => {
                    this.systemsOnline = true;
                    this.powerCore = 50;
                }, 3000);
            }
        } else if (this.powerCore < this.maxPowerCore) {
            this.powerCore = Math.min(this.maxPowerCore,
                this.powerCore + (15 * deltaTime));
        }
        
        // Update power core visual
        if (this.powerCoreVisual) {
            const powerPercent = this.powerCore / this.maxPowerCore;
            const intensity = 0.5 + powerPercent * 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
            this.powerCoreVisual.material.emissiveIntensity = intensity;
        }
    }

    animateMechSystems(deltaTime) {
        // Glowing demonic eyes
        if (this.leftEye && this.rightEye) {
            const eyeGlow = 1.0 + Math.sin(Date.now() * 0.01) * 0.5;
            this.leftEye.material.emissiveIntensity = eyeGlow;
            this.rightEye.material.emissiveIntensity = eyeGlow;
        }
        
        // Minigun barrel rotation when firing
        if (this.minigunBarrels && this.weaponSystems.minigun.spinUp) {
            this.minigunBarrels.rotation.x += deltaTime * 50;
        }
        
        // Damage sparks
        if (this.damageParticles) {
            this.damageParticles.rotation.y += deltaTime * 2;
        }
        
        // Servo movements
        if (Math.random() < 0.01) {
            this.animateServoMovement();
        }
    }

    animateServoMovement() {
        // Random mechanical movements
        if (this.mechParts.head) {
            const headTilt = (Math.random() - 0.5) * 0.1;
            this.mechParts.head.rotation.y = headTilt;
            
            setTimeout(() => {
                this.mechParts.head.rotation.y = 0;
            }, 500);
        }
    }

    animateCannonRecoil() {
        if (this.mechParts.leftArm) {
            const originalPos = this.mechParts.leftArm.position.x;
            this.mechParts.leftArm.position.x -= 0.5;
            
            setTimeout(() => {
                this.mechParts.leftArm.position.x = originalPos;
            }, 200);
        }
    }

    animateMinigunSpinUp() {
        if (this.minigunBarrels) {
            let spinSpeed = 0.01;
            const spinInterval = setInterval(() => {
                spinSpeed += 0.01;
                this.minigunBarrels.rotation.x += spinSpeed;
                
                if (spinSpeed >= 0.5) {
                    clearInterval(spinInterval);
                }
            }, 50);
        }
    }

    animateStompAttack() {
        if (this.mechParts.leftLeg) {
            const originalY = this.mechParts.leftLeg.position.y;
            this.mechParts.leftLeg.position.y += 2;
            
            setTimeout(() => {
                this.mechParts.leftLeg.position.y = originalY;
            }, 500);
        }
    }

    createExplosion(position) {
        const explosionGeometry = new THREE.SphereGeometry(4, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: THEME.effects.explosion.fire,
            transparent: true,
            opacity: 0.9
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        this.activeEffects.push({
            mesh: explosion,
            type: 'explosion',
            duration: 1125,
            currentTime: 0,
            scaleRate: 0.5 / 0.05,
            opacityRate: 0.08 / 0.05
        });
    }

    createMuzzleFlash(position) {
        const flashGeometry = new THREE.SphereGeometry(1, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.medium,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);
        
        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
    }

    createLaserImpact(position) {
        const impactGeometry = new THREE.SphereGeometry(1, 12, 12);
        const impactMaterial = new THREE.MeshBasicMaterial({
            color: THEME.effects.explosion.plasma,
            transparent: true,
            opacity: 0.8
        });
        const impact = new THREE.Mesh(impactGeometry, impactMaterial);
        impact.position.copy(position);
        this.scene.add(impact);
        
        this.activeEffects.push({
            mesh: impact,
            type: 'laser_impact',
            duration: 1000,
            currentTime: 0,
            scaleRate: 0.4 / 0.05,
            opacityRate: 0.08 / 0.05
        });
    }

    takeDamage(amount, damageType, hitPart) {
        // Check if hit a specific part
        if (hitPart && this.destructibleParts[hitPart]) {
            const part = this.destructibleParts[hitPart];
            
            if (!part.destroyed) {
                part.health -= amount;
                
                if (part.health <= 0) {
                    part.destroyed = true;
                    this.destroyPart(hitPart);
                    
                    // Critical damage if core is destroyed
                    if (part.critical) {
                        this.health -= 200;
                    }
                }
            }
        } else {
            // General damage
            this.health -= amount * 0.7; // Armored, takes reduced damage
        }
        
        // Damage feedback
        this.createDamageSparks();
        
        // Flash red
        if (this.mechParts.chassis) {
            const originalColor = this.mechParts.chassis.material.color.getHex();
            this.mechParts.chassis.material.color.setHex(THEME.ui.health.low);
            
            setTimeout(() => {
                this.mechParts.chassis.material.color.setHex(originalColor);
            }, 200);
        }
    }

    destroyPart(partName) {
        const part = this.mechParts[partName];
        if (!part) return;
        
        // Create destruction effect
        this.createPartExplosion(part.position.clone().add(this.position));
        
        // Make part fall off or explode
        if (partName.includes('Arm')) {
            // Arm falls off
            const fallingArm = part.clone();
            fallingArm.position.copy(part.position.clone().add(this.position));
            this.scene.add(fallingArm);
            
            this.activeEffects.push({
                mesh: fallingArm,
                type: 'falling_arm',
                duration: 10000,
                currentTime: 0
            });
            
            // Remove from mech
            this.mesh.remove(part);
        } else if (partName.includes('Shoulder')) {
            // Shoulder weapon explodes
            this.createPartExplosion(part.position.clone().add(this.position));
            part.visible = false;
        } else if (partName === 'chestCore') {
            // Core exposed - remove protection plate
            if (this.corePlate) {
                this.corePlate.visible = false;
            }
            // Core now glows brighter and is vulnerable
            if (this.powerCoreVisual) {
                this.powerCoreVisual.material.emissiveIntensity = 1.5;
                this.powerCoreVisual.material.color.setHex(THEME.ui.health.low);
            }
        }
    }

    createPartExplosion(position) {
        // Multiple small explosions
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3
                );
                this.createExplosion(position.clone().add(offset));
            }, i * 100);
        }
    }

    createDamageSparks() {
        const sparkCount = 20;
        for (let i = 0; i < sparkCount; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.08, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: THEME.items.weapons.legendary,
                emissive: THEME.items.weapons.legendary,
                emissiveIntensity: 1.0
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(this.position);
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 8,
                (Math.random() - 0.5) * 6
            ));
            this.scene.add(spark);
            
            this.activeEffects.push({
                mesh: spark,
                type: 'damage_spark',
                duration: 1000,
                currentTime: 0,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    Math.random() * 8,
                    (Math.random() - 0.5) * 8
                )
            });
        }
    }

    patrolMode(deltaTime) {
        // Idle patrol behavior
        if (!this.patrolTarget || Math.random() < 0.001) {
            this.patrolTarget = new THREE.Vector3(
                this.position.x + (Math.random() - 0.5) * 30,
                this.position.y,
                this.position.z + (Math.random() - 0.5) * 30
            );
        }
        
        const direction = new THREE.Vector3()
            .subVectors(this.patrolTarget, this.position)
            .normalize();
        
        this.position.add(direction.multiplyScalar(this.speed * 0.3 * deltaTime));
        
        // Face patrol direction
        if (this.mesh) {
            this.mesh.lookAt(this.patrolTarget);
        }
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Epic boss death sequence
        this.createDeathSequence();
    }

    createDeathSequence() {
        // Chain of explosions
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const explosionPos = this.position.clone();
                explosionPos.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    Math.random() * 10,
                    (Math.random() - 0.5) * 15
                ));
                this.createExplosion(explosionPos);
            }, i * 300);
        }
        
        // Final massive explosion
        setTimeout(() => {
            const finalExplosionGeometry = new THREE.SphereGeometry(20, 32, 32);
            const finalExplosionMaterial = new THREE.MeshBasicMaterial({
                color: THEME.ui.health.low,
                transparent: true,
                opacity: 1.0
            });
            const finalExplosion = new THREE.Mesh(finalExplosionGeometry, finalExplosionMaterial);
            finalExplosion.position.copy(this.position);
            this.scene.add(finalExplosion);
            
            this.activeEffects.push({
                mesh: finalExplosion,
                type: 'death_explosion',
                duration: 1666,
                currentTime: 0,
                scaleRate: 0.3 / 0.05,
                opacityRate: 0.03 / 0.05
            });
        }, 5000);
    }

    getStatusInfo() {
        const partsStatus = {};
        Object.keys(this.destructibleParts).forEach(part => {
            const partData = this.destructibleParts[part];
            partsStatus[part] = {
                health: partData.health,
                maxHealth: partData.maxHealth,
                destroyed: partData.destroyed
            };
        });
        
        return {
            type: 'The Iron Tyrant',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'BOSS',
            destructibleParts: partsStatus,
            systemStatus: this.systemStatus,
            powerCore: this.powerCore,
            heatLevel: this.heatLevel,
            overheated: this.overheated,
            berserkMode: this.berserkMode,
            weaponsOnline: Object.keys(this.destructibleParts).filter(
                part => !this.destructibleParts[part].destroyed && 
                (part.includes('Arm') || part.includes('Shoulder'))
            ).length
        };
    }
}

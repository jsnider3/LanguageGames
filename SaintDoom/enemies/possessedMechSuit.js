import * as THREE from 'three';
import { Enemy } from '../enemy.js';

export class PossessedMechSuit extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        this.name = 'Possessed Mech Suit';
        this.health = 250;
        this.maxHealth = 250;
        this.speed = 0.8; // Slower but heavily armored
        this.damage = 50;
        this.attackRange = 4;
        this.detectionRange = 25;
        
        // Mech suit specific properties
        this.armorPlating = 0.4; // 60% damage reduction
        this.powerCore = 100;
        this.maxPowerCore = 100;
        this.overheated = false;
        this.heatLevel = 0;
        this.maxHeat = 100;
        this.weaponSystems = this.initializeWeapons();
        this.currentWeapon = 'chaingun';
        this.ammunition = {
            chaingun: 200,
            rockets: 8,
            laser: 100
        };
        this.lastWeaponSwitch = 0;
        this.weaponSwitchCooldown = 3000;
        this.stomping = false;
        this.emergencyProtocols = false;
        this.selfDestructArmed = false;
        
        this.createMesh();
        this.createWeaponSystems();
    }

    createMesh() {
        const mechGroup = new THREE.Group();

        // Main chassis - large and imposing
        const chassisGeometry = new THREE.BoxGeometry(2.5, 3, 1.5);
        const chassisMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a3a3a,
            metalness: 0.8,
            roughness: 0.3
        });
        const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.y = 1.5;
        mechGroup.add(chassis);

        // Head/cockpit - now corrupted
        const headGeometry = new THREE.BoxGeometry(1.2, 1, 1);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.5;
        mechGroup.add(head);

        // Demonic eyes in cockpit
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0x440000,
            emissiveIntensity: 1.0
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 3.6, 0.5);
        mechGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 3.6, 0.5);
        mechGroup.add(rightEye);

        // Massive mechanical arms
        const armGeometry = new THREE.BoxGeometry(0.6, 2.5, 0.6);
        const armMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x404040,
            metalness: 0.7,
            roughness: 0.4
        });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.8, 2.5, 0);
        mechGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.8, 2.5, 0);
        mechGroup.add(rightArm);

        // Hydraulic legs
        const legGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
        const legMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.8, -1.5, 0);
        mechGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.8, -1.5, 0);
        mechGroup.add(rightLeg);

        // Armor plating with demonic corruption
        this.addArmorPlating(mechGroup);
        this.addCorruptionEffects(mechGroup);

        // Power core (exposed and corrupted)
        const coreGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            emissive: 0x441100,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 1.8;
        mechGroup.add(core);
        this.powerCoreVisual = core;

        mechGroup.position.copy(this.position);
        this.mesh = mechGroup;
        this.scene.add(mechGroup);

        // Store references
        this.leftEye = leftEye;
        this.rightEye = rightEye;
        this.leftArm = leftArm;
        this.rightArm = rightArm;
        this.chassis = chassis;
    }

    addArmorPlating(mechGroup) {
        // Chest armor
        const chestPlates = [
            { x: 0, y: 2.2, z: 0.8, w: 2, h: 1.5, d: 0.2 },
            { x: -1, y: 1.8, z: 0.8, w: 0.8, h: 0.8, d: 0.2 },
            { x: 1, y: 1.8, z: 0.8, w: 0.8, h: 0.8, d: 0.2 }
        ];

        chestPlates.forEach(plate => {
            const plateGeometry = new THREE.BoxGeometry(plate.w, plate.h, plate.d);
            const plateMaterial = new THREE.MeshLambertMaterial({
                color: 0x4a4a4a,
                metalness: 0.9,
                roughness: 0.1
            });
            const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
            plateMesh.position.set(plate.x, plate.y, plate.z);
            mechGroup.add(plateMesh);
        });

        // Shoulder pauldrons
        const shoulderGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        shoulderGeometry.scale(1, 0.5, 1);
        const shoulderMaterial = new THREE.MeshLambertMaterial({
            color: 0x505050,
            metalness: 0.8
        });
        
        const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        leftShoulder.position.set(-1.8, 3.2, 0);
        mechGroup.add(leftShoulder);
        
        const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        rightShoulder.position.set(1.8, 3.2, 0);
        mechGroup.add(rightShoulder);
    }

    addCorruptionEffects(mechGroup) {
        // Demonic runes on armor
        for (let i = 0; i < 8; i++) {
            const runeGeometry = new THREE.PlaneGeometry(0.3, 0.3);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                emissive: 0x220000,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.8
            });
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.position.set(
                (Math.random() - 0.5) * 4,
                Math.random() * 3 + 0.5,
                0.8
            );
            rune.rotation.z = Math.random() * Math.PI * 2;
            mechGroup.add(rune);
        }

        // Smoking vents
        for (let i = 0; i < 4; i++) {
            const ventGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 6);
            const ventMaterial = new THREE.MeshLambertMaterial({
                color: 0x1a1a1a,
                metalness: 0.9
            });
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(
                (Math.random() - 0.5) * 3,
                Math.random() * 2 + 1,
                -0.8
            );
            vent.rotation.x = Math.PI / 2;
            mechGroup.add(vent);

            if (i === 0) this.smokeVents = [vent];
            else this.smokeVents.push(vent);
        }

        // Damage sparks
        this.createSparks(mechGroup);
    }

    createSparks(mechGroup) {
        const sparkCount = 20;
        const sparkGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const colors = new Float32Array(sparkCount * 3);

        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 1] = Math.random() * 3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

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
        mechGroup.add(sparks);
        this.sparks = sparks;
    }

    initializeWeapons() {
        return {
            chaingun: {
                damage: 15,
                fireRate: 100, // Very fast
                range: 20,
                heatGeneration: 2
            },
            rockets: {
                damage: 80,
                fireRate: 2000,
                range: 30,
                heatGeneration: 20,
                explosionRadius: 5
            },
            laser: {
                damage: 25,
                fireRate: 50,
                range: 25,
                heatGeneration: 5,
                continuous: true
            }
        };
    }

    createWeaponSystems() {
        // Chaingun on right arm
        const chaingunGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
        const chaingunMaterial = new THREE.MeshLambertMaterial({
            color: 0x2a2a2a,
            metalness: 0.8
        });
        const chaingun = new THREE.Mesh(chaingunGeometry, chaingunMaterial);
        chaingun.rotation.z = Math.PI / 2;
        chaingun.position.set(2.5, 2.5, 0);
        this.mesh.add(chaingun);
        this.chaingunMesh = chaingun;

        // Rocket launcher on left arm
        const rocketGeometry = new THREE.BoxGeometry(0.8, 0.4, 1.2);
        const rocketMaterial = new THREE.MeshLambertMaterial({
            color: 0x3a3a3a,
            metalness: 0.7
        });
        const rocketLauncher = new THREE.Mesh(rocketGeometry, rocketMaterial);
        rocketLauncher.position.set(-2.3, 2.8, 0);
        this.mesh.add(rocketLauncher);
        this.rocketLauncherMesh = rocketLauncher;

        // Laser emitter on shoulder
        const laserGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            emissive: 0x002244,
            emissiveIntensity: 0.5
        });
        const laser = new THREE.Mesh(laserGeometry, laserMaterial);
        laser.position.set(0, 4, 0);
        laser.rotation.x = Math.PI;
        this.mesh.add(laser);
        this.laserMesh = laser;
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);

        // Power core management
        this.updatePowerCore(deltaTime);
        
        // Heat management
        this.updateHeatSystem(deltaTime);

        // Emergency protocols
        if (this.health < this.maxHealth * 0.2 && !this.emergencyProtocols) {
            this.activateEmergencyProtocols();
        }

        // Detection and combat
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            this.combatBehavior(player, distance, deltaTime);
        } else {
            this.patrolBehavior(deltaTime);
        }

        // Animate mech effects
        this.animateMechEffects(deltaTime);
        
        // Update position
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }

        // Stomping effects
        if (this.stomping) {
            this.createStompEffect();
        }
    }

    combatBehavior(player, distance, deltaTime) {
        // Weapon selection based on distance and situation
        this.selectOptimalWeapon(distance);

        // Attack patterns
        if (distance <= this.attackRange && this.currentWeapon === 'chaingun') {
            this.chaingunAttack(player);
        } else if (distance > 8 && distance < 25 && this.currentWeapon === 'rockets') {
            this.rocketAttack(player);
        } else if (this.currentWeapon === 'laser') {
            this.laserAttack(player);
        }

        // Movement - advance or retreat based on weapon and health
        this.tacticalMovement(player.position || player.mesh.position, distance, deltaTime);
    }

    selectOptimalWeapon(distance) {
        const currentTime = Date.now();
        if (currentTime - this.lastWeaponSwitch < this.weaponSwitchCooldown) return;

        let newWeapon = this.currentWeapon;

        if (distance <= 8 && this.ammunition.chaingun > 0) {
            newWeapon = 'chaingun';
        } else if (distance > 8 && distance < 20 && this.ammunition.rockets > 0) {
            newWeapon = 'rockets';
        } else if (this.ammunition.laser > 0) {
            newWeapon = 'laser';
        }

        if (newWeapon !== this.currentWeapon) {
            this.switchWeapon(newWeapon);
        }
    }

    switchWeapon(weaponType) {
        this.currentWeapon = weaponType;
        this.lastWeaponSwitch = Date.now();

        // Visual weapon switch effect
        this.createWeaponSwitchEffect();

        // Update weapon highlighting
        this.updateWeaponHighlighting();
    }

    chaingunAttack(player) {
        if (this.overheated || this.ammunition.chaingun <= 0) return;

        const weapon = this.weaponSystems.chaingun;
        if (Date.now() - this.lastAttackTime < weapon.fireRate) return;

        this.lastAttackTime = Date.Now();
        this.ammunition.chaingun--;
        this.heatLevel += weapon.heatGeneration;

        // Create chaingun projectiles
        this.createChaingunRound(player);
        
        // Muzzle flash and effects
        this.createMuzzleFlash(this.chaingunMesh);
        this.animateChaingunFire();
    }

    createChaingunRound(player) {
        const bulletGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const bulletMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0x444400,
            emissiveIntensity: 0.8
        });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        const startPos = this.chaingunMesh.position.clone();
        startPos.add(this.position);
        bullet.position.copy(startPos);

        const direction = new THREE.Vector3()
            .subVectors(player.position || player.mesh.position, startPos)
            .normalize();

        // Add spread for chaingun
        direction.x += (Math.random() - 0.5) * 0.2;
        direction.z += (Math.random() - 0.5) * 0.2;
        direction.normalize();

        const speed = 40;
        const velocity = direction.multiplyScalar(speed);

        bullet.userData = {
            type: 'chaingun_bullet',
            velocity: velocity,
            damage: this.weaponSystems.chaingun.damage,
            life: 2000,
            birthTime: Date.now()
        };

        this.scene.add(bullet);
        this.animateBullet(bullet);
    }

    rocketAttack(player) {
        if (this.ammunition.rockets <= 0) return;

        const weapon = this.weaponSystems.rockets;
        if (Date.now() - this.lastRocketTime < weapon.fireRate) return;

        this.lastRocketTime = Date.now();
        this.ammunition.rockets--;
        this.heatLevel += weapon.heatGeneration;

        // Create rocket projectile
        this.createRocket(player);
        
        // Launch effects
        this.createRocketLaunchEffect();
        this.animateRocketLaunch();
    }

    createRocket(player) {
        const rocketGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 8);
        const rocketMaterial = new THREE.MeshLambertMaterial({
            color: 0x666666,
            metalness: 0.7
        });
        const rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
        
        const startPos = this.rocketLauncherMesh.position.clone();
        startPos.add(this.position);
        rocket.position.copy(startPos);

        // Rocket trail
        const trailGeometry = new THREE.CylinderGeometry(0.05, 0.1, 2, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            emissive: 0x442200,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -1;
        rocket.add(trail);

        const direction = new THREE.Vector3()
            .subVectors(player.position || player.mesh.position, startPos)
            .normalize();

        rocket.lookAt(startPos.clone().add(direction));

        const speed = 25;
        const velocity = direction.multiplyScalar(speed);

        rocket.userData = {
            type: 'rocket',
            velocity: velocity,
            damage: this.weaponSystems.rockets.damage,
            explosionRadius: this.weaponSystems.rockets.explosionRadius,
            life: 4000,
            birthTime: Date.now()
        };

        this.scene.add(rocket);
        this.animateRocket(rocket);
    }

    laserAttack(player) {
        if (this.ammunition.laser <= 0 || this.overheated) return;

        const weapon = this.weaponSystems.laser;
        this.ammunition.laser--;
        this.heatLevel += weapon.heatGeneration;

        // Create continuous laser beam
        this.createLaserBeam(player);
    }

    createLaserBeam(player) {
        const startPos = this.laserMesh.position.clone();
        startPos.add(this.position);
        
        const endPos = player.position || player.mesh.position;
        const distance = startPos.distanceTo(endPos);

        const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            emissive: 0x0044aa,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        beam.position.copy(startPos.clone().lerp(endPos, 0.5));
        beam.lookAt(endPos);
        beam.rotation.x = Math.PI / 2;
        
        this.scene.add(beam);

        // Beam effects
        this.createLaserImpact(endPos);

        // Remove beam after short duration
        setTimeout(() => {
            this.scene.remove(beam);
        }, 200);

        // Damage player
        if (player.takeDamage) {
            player.takeDamage(this.weaponSystems.laser.damage);
        }
    }

    createLaserImpact(position) {
        const impactGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const impactMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
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
            scale += 0.3;
            opacity -= 0.1;
            impact.scale.setScalar(scale);
            impact.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(impact);
                clearInterval(impactInterval);
            }
        }, 50);
    }

    tacticalMovement(playerPosition, distance, deltaTime) {
        let moveDirection = new THREE.Vector3();
        let moveSpeed = this.speed;

        if (this.emergencyProtocols) {
            moveSpeed *= 1.5; // Faster in emergency mode
        }

        // Different movement based on current weapon
        switch (this.currentWeapon) {
            case 'chaingun':
                // Advance for close combat
                if (distance > this.attackRange) {
                    moveDirection.subVectors(playerPosition, this.position).normalize();
                    this.stomping = true;
                }
                break;
                
            case 'rockets':
                // Maintain optimal rocket distance
                if (distance < 10) {
                    moveDirection.subVectors(this.position, playerPosition).normalize();
                } else if (distance > 20) {
                    moveDirection.subVectors(playerPosition, this.position).normalize();
                }
                break;
                
            case 'laser':
                // Circle strafe while maintaining line of sight
                const perpendicular = new THREE.Vector3()
                    .subVectors(playerPosition, this.position)
                    .cross(new THREE.Vector3(0, 1, 0))
                    .normalize();
                moveDirection = perpendicular;
                break;
        }

        this.position.add(moveDirection.multiplyScalar(moveSpeed * deltaTime / 1000));

        // Face the player
        if (this.mesh && playerPosition) {
            this.mesh.lookAt(playerPosition);
        }

        // Create stomp effects periodically
        if (this.stomping && Math.random() < 0.1) {
            this.createStompEffect();
        }
    }

    createStompEffect() {
        // Ground shake effect
        const shakeGeometry = new THREE.RingGeometry(2, 4, 16);
        const shakeMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b4513,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const shake = new THREE.Mesh(shakeMaterial, shakeMaterial);
        shake.position.copy(this.position);
        shake.position.y = 0.1;
        shake.rotation.x = -Math.PI / 2;
        this.scene.add(shake);

        // Dust particles
        this.createDustParticles();

        // Animate shake
        let scale = 1;
        let opacity = 0.6;
        const shakeInterval = setInterval(() => {
            scale += 0.5;
            opacity -= 0.06;
            shake.scale.setScalar(scale);
            shake.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(shake);
                clearInterval(shakeInterval);
            }
        }, 50);
    }

    createDustParticles() {
        const particleCount = 30;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = this.position.x + (Math.random() - 0.5) * 6;
            positions[i * 3 + 1] = this.position.y + Math.random() * 2;
            positions[i * 3 + 2] = this.position.z + (Math.random() - 0.5) * 6;

            colors[i * 3] = 0.8;
            colors[i * 3 + 1] = 0.7;
            colors[i * 3 + 2] = 0.5;
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

        // Animate dust
        setTimeout(() => {
            this.scene.remove(particleSystem);
        }, 2000);
    }

    activateEmergencyProtocols() {
        this.emergencyProtocols = true;
        
        // Visual emergency state
        if (this.powerCoreVisual) {
            this.powerCoreVisual.material.color.setHex(0xff0000);
            this.powerCoreVisual.material.emissiveIntensity = 1.2;
        }

        // Emergency systems announcements could go here
        this.createEmergencyEffect();

        // Arm self-destruct after 30 seconds
        setTimeout(() => {
            if (this.health > 0) {
                this.armSelfDestruct();
            }
        }, 30000);
    }

    createEmergencyEffect() {
        // Red warning lights
        for (let i = 0; i < 4; i++) {
            const warningLight = new THREE.PointLight(0xff0000, 2, 10);
            const angle = (i / 4) * Math.PI * 2;
            warningLight.position.set(
                this.position.x + Math.cos(angle) * 3,
                this.position.y + 2,
                this.position.z + Math.sin(angle) * 3
            );
            this.scene.add(warningLight);

            // Flash the lights
            setInterval(() => {
                warningLight.intensity = warningLight.intensity === 2 ? 0 : 2;
            }, 500);
        }
    }

    armSelfDestruct() {
        this.selfDestructArmed = true;
        
        // Visual countdown effect
        const countdownGeometry = new THREE.SphereGeometry(3, 16, 16);
        const countdownMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const countdown = new THREE.Mesh(countdownGeometry, countdownMaterial);
        countdown.position.copy(this.position);
        this.scene.add(countdown);

        // Pulsing countdown
        let pulseScale = 3;
        const countdownInterval = setInterval(() => {
            pulseScale += 0.2;
            countdown.scale.setScalar(pulseScale);
        }, 200);

        // Self-destruct after 10 seconds
        setTimeout(() => {
            this.selfDestruct();
            this.scene.remove(countdown);
            clearInterval(countdownInterval);
        }, 10000);
    }

    selfDestruct() {
        // Massive explosion
        const explosionRadius = 15;
        const explosionGeometry = new THREE.SphereGeometry(explosionRadius, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 1.0
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        this.scene.add(explosion);

        // Multiple shock waves
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const shockwave = this.createShockwave(i * 3);
            }, i * 200);
        }

        // Animate main explosion
        let scale = 0.1;
        let opacity = 1.0;
        const explosionInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.05;
            explosion.scale.setScalar(scale);
            explosion.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(explosion);
                clearInterval(explosionInterval);
            }
        }, 50);

        // Destroy the mech
        this.health = 0;
        this.destroy();
    }

    createShockwave(radius) {
        const shockwaveGeometry = new THREE.RingGeometry(radius, radius + 2, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(this.position);
        shockwave.position.y = 0.1;
        shockwave.rotation.x = -Math.PI / 2;
        this.scene.add(shockwave);

        // Animate shockwave
        let scale = 1;
        let opacity = 0.8;
        const shockwaveInterval = setInterval(() => {
            scale += 0.5;
            opacity -= 0.05;
            shockwave.scale.setScalar(scale);
            shockwave.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(shockwave);
                clearInterval(shockwaveInterval);
            }
        }, 50);
    }

    updatePowerCore(deltaTime) {
        // Power core regeneration or drain based on usage
        if (this.emergencyProtocols) {
            this.powerCore = Math.max(0, this.powerCore - (50 * deltaTime / 1000));
        } else if (this.powerCore < this.maxPowerCore) {
            this.powerCore = Math.min(this.maxPowerCore, 
                this.powerCore + (10 * deltaTime / 1000));
        }

        // Update power core visual
        if (this.powerCoreVisual) {
            const powerPercent = this.powerCore / this.maxPowerCore;
            const pulseIntensity = 0.4 + (powerPercent * 0.6) + Math.sin(Date.now() * 0.01) * 0.2;
            this.powerCoreVisual.material.emissiveIntensity = pulseIntensity;
        }
    }

    updateHeatSystem(deltaTime) {
        // Heat dissipation
        if (this.heatLevel > 0) {
            this.heatLevel = Math.max(0, this.heatLevel - (30 * deltaTime / 1000));
        }

        // Overheating
        if (this.heatLevel >= this.maxHeat) {
            this.overheated = true;
            setTimeout(() => {
                this.overheated = false;
                this.heatLevel = this.maxHeat * 0.3; // Cool down to 30%
            }, 5000); // 5 second cooldown
        }

        // Visual heat effects
        if (this.smokeVents) {
            const heatPercent = this.heatLevel / this.maxHeat;
            this.smokeVents.forEach(vent => {
                if (heatPercent > 0.7) {
                    // Create smoke particles
                    if (Math.random() < 0.3) {
                        this.createSmokeParticle(vent.position.clone().add(this.position));
                    }
                }
            });
        }
    }

    createSmokeParticle(position) {
        const smokeGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.6
        });
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.copy(position);
        this.scene.add(smoke);

        // Animate smoke rising and fading
        let opacity = 0.6;
        const smokeInterval = setInterval(() => {
            smoke.position.y += 0.1;
            smoke.scale.multiplyScalar(1.05);
            opacity -= 0.03;
            smoke.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(smoke);
                clearInterval(smokeInterval);
            }
        }, 100);
    }

    animateMechEffects(deltaTime) {
        // Glowing demonic eyes
        if (this.leftEye && this.rightEye) {
            const eyeGlow = 0.8 + Math.sin(Date.now() * 0.01) * 0.4;
            this.leftEye.material.emissiveIntensity = eyeGlow;
            this.rightEye.material.emissiveIntensity = eyeGlow;
        }

        // Sparks animation
        if (this.sparks) {
            this.sparks.rotation.y += deltaTime * 0.002;
            
            // Randomly flicker sparks
            if (Math.random() < 0.1) {
                this.sparks.material.opacity = Math.random() * 0.8;
            }
        }

        // Mechanical servo sounds (visual representation)
        if (Math.random() < 0.01) {
            this.animateServoMovement();
        }
    }

    animateServoMovement() {
        // Subtle arm movements to show mechanical nature
        if (this.leftArm && this.rightArm) {
            const armTwitch = (Math.random() - 0.5) * 0.1;
            this.leftArm.rotation.z = armTwitch;
            this.rightArm.rotation.z = -armTwitch;
            
            setTimeout(() => {
                this.leftArm.rotation.z = 0;
                this.rightArm.rotation.z = 0;
            }, 200);
        }
    }

    takeDamage(amount, damageType) {
        // Armor reduction
        let actualDamage = amount * (1 - this.armorPlating);
        
        // Different damage based on type
        if (damageType === 'explosive') {
            actualDamage *= 1.3; // More vulnerable to explosives
        } else if (damageType === 'laser' || damageType === 'plasma') {
            actualDamage *= 0.8; // Resistant to energy weapons
        }

        this.health -= actualDamage;

        // Damage sparks
        this.createDamageSparks();

        // System damage effects
        if (this.health < this.maxHealth * 0.5) {
            this.heatLevel += 10; // Systems running hot when damaged
        }

        // Visual damage feedback
        if (this.mesh) {
            this.chassis.material.color.setHex(0xff4400);
            setTimeout(() => {
                this.chassis.material.color.setHex(0x3a3a3a);
            }, 200);
        }
    }

    createDamageSparks() {
        const sparkCount = 15;
        for (let i = 0; i < sparkCount; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 1.0
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(this.position);
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            ));
            this.scene.add(spark);

            // Animate sparks
            const sparkVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 5
            );

            const sparkInterval = setInterval(() => {
                spark.position.add(sparkVelocity.multiplyScalar(0.1));
                sparkVelocity.y -= 0.2; // Gravity
                spark.scale.multiplyScalar(0.95);

                if (spark.scale.x < 0.1) {
                    this.scene.remove(spark);
                    clearInterval(sparkInterval);
                }
            }, 50);
        }
    }

    patrolBehavior(deltaTime) {
        // Heavy patrol movement
        if (!this.patrolTarget || Math.random() < 0.001) {
            this.patrolTarget = new THREE.Vector3(
                this.position.x + (Math.random() - 0.5) * 20,
                this.position.y,
                this.position.z + (Math.random() - 0.5) * 20
            );
        }

        const direction = new THREE.Vector3()
            .subVectors(this.patrolTarget, this.position)
            .normalize();

        this.position.add(direction.multiplyScalar(this.speed * 0.5 * deltaTime / 1000));

        // Face patrol direction
        if (this.mesh) {
            this.mesh.lookAt(this.patrolTarget);
        }

        // Occasional stomps during patrol
        if (Math.random() < 0.01) {
            this.createStompEffect();
        }
    }

    animateBullet(bullet) {
        const bulletInterval = setInterval(() => {
            const age = Date.now() - bullet.userData.birthTime;
            if (age > bullet.userData.life) {
                this.scene.remove(bullet);
                clearInterval(bulletInterval);
                return;
            }

            const movement = bullet.userData.velocity.clone().multiplyScalar(16 / 1000);
            bullet.position.add(movement);
        }, 16);
    }

    animateRocket(rocket) {
        const rocketInterval = setInterval(() => {
            const age = Date.now() - rocket.userData.birthTime;
            if (age > rocket.userData.life) {
                // Explode rocket
                this.createRocketExplosion(rocket.position);
                this.scene.remove(rocket);
                clearInterval(rocketInterval);
                return;
            }

            const movement = rocket.userData.velocity.clone().multiplyScalar(16 / 1000);
            rocket.position.add(movement);
        }, 16);
    }

    createRocketExplosion(position) {
        const explosionGeometry = new THREE.SphereGeometry(5, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 1.0
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Animate explosion
        let scale = 0.1;
        let opacity = 1.0;
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

    destroy() {
        if (this.selfDestructArmed) return; // Already handling self-destruct

        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Dramatic mech destruction
        this.createMechExplosion();
    }

    createMechExplosion() {
        // Multiple explosions for dramatic effect
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    Math.random() * 3,
                    (Math.random() - 0.5) * 4
                );
                const explosionPos = this.position.clone().add(offset);
                this.createRocketExplosion(explosionPos);
            }, i * 300);
        }
    }

    getStatusInfo() {
        return {
            type: 'Possessed Mech Suit',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'Extreme',
            abilities: ['Heavy Weapons', 'Armor Plating', 'Multiple Weapon Systems', 'Self-Destruct'],
            currentWeapon: this.currentWeapon,
            ammunition: this.ammunition,
            powerCore: this.powerCore,
            heatLevel: this.heatLevel,
            overheated: this.overheated,
            emergencyProtocols: this.emergencyProtocols,
            selfDestructArmed: this.selfDestructArmed
        };
    }
}
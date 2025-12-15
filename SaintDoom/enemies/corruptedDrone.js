import * as THREE from 'three';
import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';

export class CorruptedDrone extends BaseEnemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Drone specific properties
        this.flightHeight = 3 + Math.random() * 4; // Flies at varying heights
        this.hovering = true;
        this.swarmBehavior = true;
        this.energyWeapons = {
            laser: { damage: 15, range: 20, fireRate: 800 },
            emp: { damage: 0, range: 8, fireRate: 5000, disableDuration: 3000 },
            plasma: { damage: 25, range: 15, fireRate: 1200 }
        };
        this.currentWeapon = 'laser';
        this.weaponEnergy = 100;
        this.maxWeaponEnergy = 100;
        this.lastWeaponSwitch = 0;
        this.swarmLinks = []; // Connected to other drones
        this.corruptionLevel = Math.random() * 0.8 + 0.2; // 20-100% corruption
        this.malfunctionChance = this.corruptionLevel * 0.3;
        this.flightPattern = 'aggressive';
        this.evasiveManeuvers = true;
        this.lastEvasion = 0;
        this.shielding = 30; // Energy shield
        this.maxShielding = 30;
        this.detectionRange = 25;
        
        this.createMesh();
        this.initializeFlightPattern();
    }

    createMesh() {
        const droneGroup = new THREE.Group();

        // Main drone body - sleek military design corrupted
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.4, 1.2);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        droneGroup.add(body);

        // Rotors/propellers
        this.rotors = [];
        const rotorPositions = [
            { x: -0.8, y: 0.3, z: -0.8 },
            { x: 0.8, y: 0.3, z: -0.8 },
            { x: -0.8, y: 0.3, z: 0.8 },
            { x: 0.8, y: 0.3, z: 0.8 }
        ];

        rotorPositions.forEach(pos => {
            const rotorGroup = new THREE.Group();
            
            // Rotor hub
            const hubGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
            const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const hub = new THREE.Mesh(hubGeometry, hubMaterial);
            rotorGroup.add(hub);

            // Rotor blades
            for (let i = 0; i < 3; i++) {
                const bladeGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.08);
                const bladeMaterial = new THREE.MeshLambertMaterial({ 
                    color: THEME.materials.metal.dark,
                    transparent: true,
                    opacity: 0.7
                });
                const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
                blade.rotation.y = (i / 3) * Math.PI * 2;
                rotorGroup.add(blade);
            }

            rotorGroup.position.set(pos.x, pos.y, pos.z);
            droneGroup.add(rotorGroup);
            this.rotors.push(rotorGroup);
        });

        // Camera/sensor array (corrupted)
        const cameraGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const cameraMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.low,
            emissive: THEME.materials.robeEmissive,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.y = -0.3;
        droneGroup.add(camera);
        this.sensorArray = camera;

        // Weapon mounts
        this.weaponMounts = [];
        const mountPositions = [
            { x: -0.6, y: -0.2, z: 0.6 },
            { x: 0.6, y: -0.2, z: 0.6 }
        ];

        mountPositions.forEach((pos, index) => {
            const mountGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.4);
            const mountMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x1a1a1a,
                metalness: 0.9
            });
            const mount = new THREE.Mesh(mountGeometry, mountMaterial);
            mount.position.set(pos.x, pos.y, pos.z);
            droneGroup.add(mount);
            this.weaponMounts.push(mount);
        });

        // Energy shield (when active)
        const shieldGeometry = new THREE.SphereGeometry(1.8, 16, 16);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.visible = false;
        droneGroup.add(shield);
        this.energyShield = shield;

        // Corruption effects
        this.addCorruptionEffects(droneGroup);

        // Communication array
        const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
        const antennaMaterial = new THREE.MeshLambertMaterial({ color: THEME.materials.wall.armory });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = 0.6;
        droneGroup.add(antenna);
        this.commAntenna = antenna;

        droneGroup.position.copy(this.position);
        droneGroup.position.y += this.flightHeight;
        this.mesh = droneGroup;
        this.scene.add(droneGroup);

        // Store references
        this.body = body;
    }

    addCorruptionEffects(droneGroup) {
        // Sparking electronics
        const sparkCount = 10;
        const sparkGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const colors = new Float32Array(sparkCount * 3);

        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            // Corruption colors - red and orange
            colors[i * 3] = 1;
            colors[i * 3 + 1] = Math.random() * 0.5;
            colors[i * 3 + 2] = 0;
        }

        sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sparkGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const sparkMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        droneGroup.add(sparks);
        this.corruptionSparks = sparks;

        // Glitchy panels
        for (let i = 0; i < 3; i++) {
            const panelGeometry = new THREE.PlaneGeometry(0.3, 0.2);
            const panelMaterial = new THREE.MeshBasicMaterial({
                color: 0x220000,
                transparent: true,
                opacity: 0.6
            });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 0.6,
                0.61 // On surface
            );
            panel.rotation.x = (Math.random() - 0.5) * 0.5;
            panel.rotation.y = (Math.random() - 0.5) * 0.5;
            droneGroup.add(panel);
            
            if (i === 0) this.glitchPanels = [panel];
            else this.glitchPanels.push(panel);
        }
    }

    initializeFlightPattern() {
        // Set up initial flight vectors
        this.flightVector = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        this.orbitRadius = 8 + Math.random() * 5;
        this.orbitSpeed = 0.003 + Math.random() * 0.002;
        this.orbitAngle = Math.random() * Math.PI * 2;
    }

    update(deltaTime, player) {
        if (!this.mesh || !player || this.health <= 0) return;

        const playerPosition = player.position || player.mesh.position;
        const distance = this.position.distanceTo(playerPosition);

        // Energy management
        this.updateEnergySystem(deltaTime);
        
        // Shield management
        this.updateShieldSystem(deltaTime);

        // Malfunction checks
        if (Math.random() < this.malfunctionChance * deltaTime / 1000) {
            this.triggerMalfunction();
        }

        // Detection and combat
        if (distance <= this.detectionRange) {
            this.target = playerPosition.clone();
            this.combatFlightPattern(player, distance, deltaTime);
        } else {
            this.patrolFlight(deltaTime);
        }

        // Animation updates
        this.animateDrone(deltaTime);
        
        // Update position with flight height
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.position.y += this.flightHeight;
        }
    }

    combatFlightPattern(player, distance, deltaTime) {
        const playerPosition = player.position || player.mesh.position;

        // Choose attack pattern based on distance
        if (distance <= this.attackRange) {
            this.performAttack(player);
        }

        // Evasive maneuvers
        if (this.evasiveManeuvers && Date.now() - this.lastEvasion > 2000) {
            this.performEvasiveManeuver();
        }

        // Combat movement patterns
        switch (this.flightPattern) {
            case 'aggressive':
                this.aggressiveApproach(playerPosition, deltaTime);
                break;
            case 'evasive':
                this.evasiveCircling(playerPosition, deltaTime);
                break;
            case 'support':
                this.supportPosition(playerPosition, deltaTime);
                break;
            default:
                this.defaultCombatFlight(playerPosition, deltaTime);
        }

        // Face the player
        if (this.mesh) {
            this.mesh.lookAt(playerPosition);
        }
    }

    aggressiveApproach(playerPosition, deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.position)
            .normalize();

        // Add some altitude variation for 3D movement
        direction.y = Math.sin(Date.now() * 0.003) * 0.3;

        this.position.add(direction.multiplyScalar(this.speed * deltaTime / 1000));
        
        // Vary flight height aggressively
        this.flightHeight = 2 + Math.sin(Date.now() * 0.004) * 2;
    }

    evasiveCircling(playerPosition, deltaTime) {
        // Orbit around the player at attack range
        this.orbitAngle += this.orbitSpeed * deltaTime;
        
        const orbitX = playerPosition.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        const orbitZ = playerPosition.z + Math.sin(this.orbitAngle) * this.orbitRadius;
        
        const targetPosition = new THREE.Vector3(orbitX, playerPosition.y, orbitZ);
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.position)
            .normalize();

        this.position.add(direction.multiplyScalar(this.speed * deltaTime / 1000));
        
        // Bobbing flight pattern
        this.flightHeight = 4 + Math.sin(Date.now() * 0.005) * 1.5;
    }

    supportPosition(playerPosition, deltaTime) {
        // Stay at medium range, providing covering fire
        const optimalDistance = 15;
        const currentDistance = this.position.distanceTo(playerPosition);
        
        let direction = new THREE.Vector3();
        if (currentDistance < optimalDistance - 2) {
            // Move away
            direction.subVectors(this.position, playerPosition).normalize();
        } else if (currentDistance > optimalDistance + 2) {
            // Move closer
            direction.subVectors(playerPosition, this.position).normalize();
        } else {
            // Strafe
            direction.crossVectors(
                new THREE.Vector3().subVectors(playerPosition, this.position),
                new THREE.Vector3(0, 1, 0)
            ).normalize();
        }

        this.position.add(direction.multiplyScalar(this.speed * 0.7 * deltaTime / 1000));
        this.flightHeight = 5 + Math.sin(Date.now() * 0.002) * 0.5;
    }

    defaultCombatFlight(playerPosition, deltaTime) {
        // Default combat movement: circle player while maintaining distance
        const optimalDistance = 12;
        const currentDistance = this.position.distanceTo(playerPosition);

        let direction = new THREE.Vector3();
        if (currentDistance < optimalDistance - 2) {
            // Back away
            direction.subVectors(this.position, playerPosition).normalize();
        } else if (currentDistance > optimalDistance + 2) {
            // Close in
            direction.subVectors(playerPosition, this.position).normalize();
        } else {
            // Strafe around
            direction.crossVectors(
                new THREE.Vector3().subVectors(playerPosition, this.position),
                new THREE.Vector3(0, 1, 0)
            ).normalize();
        }

        this.position.add(direction.multiplyScalar(this.speed * 0.5 * deltaTime / 1000));
        this.flightHeight = 3.5 + Math.sin(Date.now() * 0.003) * 1.0;
    }

    performAttack(player) {
        const currentTime = Date.now();
        const weapon = this.energyWeapons[this.currentWeapon];
        
        if (currentTime - this.lastAttackTime < weapon.fireRate || this.weaponEnergy < 20) {
            return;
        }

        this.lastAttackTime = currentTime;
        this.weaponEnergy -= 20;

        switch (this.currentWeapon) {
            case 'laser':
                this.fireLaser(player);
                break;
            case 'plasma':
                this.firePlasma(player);
                break;
            case 'emp':
                this.fireEMP(player);
                break;
        }

        // Switch weapons occasionally
        if (Math.random() < 0.2 && currentTime - this.lastWeaponSwitch > 5000) {
            this.switchWeapon();
        }
    }

    fireLaser(player) {
        const playerPosition = player.position || player.mesh.position;
        const startPos = this.position.clone();
        startPos.y += this.flightHeight;

        // Create laser beam
        const distance = startPos.distanceTo(playerPosition);
        const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, distance, 6);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.low,
            emissive: THEME.materials.robeEmissive,
            emissiveIntensity: 1.0
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        beam.position.copy(startPos.clone().lerp(playerPosition, 0.5));
        beam.lookAt(playerPosition);
        beam.rotation.x = Math.PI / 2;
        
        this.scene.add(beam);

        // Beam impact effect
        this.createLaserImpact(playerPosition);

        // Remove beam after short time
        setTimeout(() => {
            this.scene.remove(beam);
        }, 150);

        // Damage player
        if (player.takeDamage) {
            player.takeDamage(this.energyWeapons.laser.damage, "Corrupted Drone Laser");
        }

        // Muzzle flash
        this.createMuzzleFlash(this.weaponMounts[0].position);
    }

    firePlasma(player) {
        const playerPosition = player.position || player.mesh.position;
        const startPos = this.position.clone();
        startPos.y += this.flightHeight;

        // Create plasma bolt
        const boltGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const boltMaterial = new THREE.MeshBasicMaterial({
            color: THEME.effects.explosion.plasma,
            emissive: 0x004488,
            emissiveIntensity: 0.8
        });
        const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
        bolt.position.copy(startPos);

        // Plasma trail
        const trailGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066cc,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = -0.5;
        bolt.add(trail);

        const direction = new THREE.Vector3()
            .subVectors(playerPosition, startPos)
            .normalize();

        const speed = 20;
        const velocity = direction.multiplyScalar(speed);

        bolt.userData = {
            type: 'plasma_bolt',
            velocity: velocity,
            damage: this.energyWeapons.plasma.damage,
            life: 3000,
            birthTime: Date.now()
        };

        this.scene.add(bolt);
        this.animatePlasmaBolt(bolt);
    }

    fireEMP(player) {
        const playerPosition = player.position || player.mesh.position;
        
        // Create EMP pulse
        const pulseGeometry = new THREE.SphereGeometry(this.energyWeapons.emp.range, 16, 16);
        const pulseMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
        pulse.position.copy(this.position);
        pulse.position.y += this.flightHeight;
        this.scene.add(pulse);

        // EMP effect on player
        const distance = this.position.distanceTo(playerPosition);
        if (distance <= this.energyWeapons.emp.range) {
            if (player.addStatusEffect) {
                player.addStatusEffect('emp_disruption', {
                    duration: this.energyWeapons.emp.disableDuration,
                    weaponsDisabled: true,
                    movementSlowed: 0.5,
                    visionStatic: true
                });
            }
        }

        // Animate EMP pulse
        let scale = 0.1;
        let opacity = 0.3;
        const empInterval = setInterval(() => {
            scale += 0.3;
            opacity -= 0.03;
            pulse.scale.setScalar(scale);
            pulse.material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(pulse);
                clearInterval(empInterval);
            }
        }, 50);
    }

    switchWeapon() {
        const weapons = ['laser', 'plasma', 'emp'];
        let newWeapon;
        do {
            newWeapon = weapons[Math.floor(Math.random() * weapons.length)];
        } while (newWeapon === this.currentWeapon);

        this.currentWeapon = newWeapon;
        this.lastWeaponSwitch = Date.now();

        // Visual weapon switch
        this.createWeaponSwitchEffect();
    }

    createWeaponSwitchEffect() {
        this.weaponMounts.forEach(mount => {
            const effectGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const effectMaterial = new THREE.MeshBasicMaterial({
                color: this.currentWeapon === 'laser' ? 0xff0000 :
                      this.currentWeapon === 'plasma' ? 0x00aaff : 0x00ffff,
                transparent: true,
                opacity: 0.8
            });
            const effect = new THREE.Mesh(effectGeometry, effectMaterial);
            effect.position.copy(mount.position);
            this.mesh.add(effect);

            // Fade effect
            setTimeout(() => {
                this.mesh.remove(effect);
            }, 500);
        });
    }

    performEvasiveManeuver() {
        this.lastEvasion = Date.now();
        
        // Random evasive vector
        const evasiveVector = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 10
        );

        // Quick burst movement
        this.position.add(evasiveVector);
        
        // Activate shields during evasion
        if (this.shielding > 0) {
            this.activateShields();
        }

        // Change flight pattern
        const patterns = ['aggressive', 'evasive', 'support'];
        this.flightPattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    activateShields() {
        if (this.energyShield) {
            this.energyShield.visible = true;
            this.energyShield.material.opacity = 0.4;
            
            // Deactivate after 2 seconds
            setTimeout(() => {
                this.energyShield.visible = false;
            }, 2000);
        }
    }

    triggerMalfunction() {
        // Random malfunction effects
        const malfunctions = [
            'weapon_jam',
            'flight_instability', 
            'sensor_glitch',
            'power_fluctuation'
        ];
        
        const malfunction = malfunctions[Math.floor(Math.random() * malfunctions.length)];
        
        switch (malfunction) {
            case 'weapon_jam':
                this.weaponEnergy = 0;
                break;
            case 'flight_instability':
                this.speed *= 0.5;
                setTimeout(() => { this.speed *= 2; }, 3000);
                break;
            case 'sensor_glitch':
                this.detectionRange *= 0.3;
                setTimeout(() => { this.detectionRange /= 0.3; }, 2000);
                break;
            case 'power_fluctuation':
                this.triggerPowerFluctuation();
                break;
        }

        // Visual malfunction effect
        this.createMalfunctionEffect();
    }

    createMalfunctionEffect() {
        if (this.corruptionSparks) {
            this.corruptionSparks.material.size = 0.2;
            this.corruptionSparks.material.opacity = 1.0;
            
            setTimeout(() => {
                this.corruptionSparks.material.size = 0.05;
                this.corruptionSparks.material.opacity = 0.8;
            }, 1000);
        }
    }

    triggerPowerFluctuation() {
        // Systems randomly shut down and restart
        const flickerInterval = setInterval(() => {
            if (this.sensorArray) {
                this.sensorArray.material.emissiveIntensity = 
                    this.sensorArray.material.emissiveIntensity === 0.8 ? 0 : 0.8;
            }
            
            if (this.energyShield) {
                this.energyShield.visible = !this.energyShield.visible;
            }
        }, 200);

        setTimeout(() => {
            clearInterval(flickerInterval);
            // Restore normal operation
            if (this.sensorArray) {
                this.sensorArray.material.emissiveIntensity = 0.8;
            }
            if (this.energyShield) {
                this.energyShield.visible = false;
            }
        }, 2000);
    }

    updateEnergySystem(deltaTime) {
        // Energy regeneration
        if (this.weaponEnergy < this.maxWeaponEnergy) {
            this.weaponEnergy = Math.min(this.maxWeaponEnergy,
                this.weaponEnergy + (30 * deltaTime / 1000));
        }
    }

    updateShieldSystem(deltaTime) {
        // Shield regeneration when not under fire
        if (this.shielding < this.maxShielding && Date.now() - this.lastDamageTime > 5000) {
            this.shielding = Math.min(this.maxShielding,
                this.shielding + (10 * deltaTime / 1000));
        }
    }

    animateDrone(deltaTime) {
        // Rotor spinning
        if (this.rotors) {
            this.rotors.forEach(rotor => {
                rotor.rotation.y += deltaTime * 0.02;
            });
        }

        // Sensor array scanning
        if (this.sensorArray) {
            this.sensorArray.rotation.y += deltaTime * 0.003;
            
            // Pulsing red glow
            const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.5;
            this.sensorArray.material.emissiveIntensity = pulse;
        }

        // Body hovering/tilting
        if (this.body) {
            const hoverTilt = Math.sin(Date.now() * 0.004) * 0.1;
            this.body.rotation.x = hoverTilt;
            this.body.rotation.z = Math.sin(Date.now() * 0.003) * 0.05;
        }

        // Corruption sparks animation
        if (this.corruptionSparks) {
            this.corruptionSparks.rotation.y += deltaTime * 0.005;
        }

        // Glitchy panels flickering
        if (this.glitchPanels) {
            this.glitchPanels.forEach(panel => {
                if (Math.random() < 0.1) {
                    panel.material.opacity = Math.random() * 0.8;
                    panel.material.color.setHex(
                        Math.random() > 0.5 ? 0x220000 : 0x440000
                    );
                }
            });
        }
    }

    patrolFlight(deltaTime) {
        // Autonomous patrol pattern
        if (!this.patrolTarget || Math.random() < 0.005) {
            this.patrolTarget = new THREE.Vector3(
                this.position.x + (Math.random() - 0.5) * 30,
                this.position.y,
                this.position.z + (Math.random() - 0.5) * 30
            );
        }

        const direction = new THREE.Vector3()
            .subVectors(this.patrolTarget, this.position)
            .normalize();

        this.position.add(direction.multiplyScalar(this.speed * 0.4 * deltaTime / 1000));

        // Vary patrol height
        this.flightHeight = 4 + Math.sin(Date.now() * 0.001) * 2;

        // Face patrol direction
        if (this.mesh) {
            this.mesh.lookAt(this.patrolTarget);
        }
    }

    animatePlasmaBolt(bolt) {
        const boltInterval = setInterval(() => {
            const age = Date.now() - bolt.userData.birthTime;
            if (age > bolt.userData.life) {
                this.createPlasmaExplosion(bolt.position);
                this.scene.remove(bolt);
                clearInterval(boltInterval);
                return;
            }

            const movement = bolt.userData.velocity.clone().multiplyScalar(16 / 1000);
            bolt.position.add(movement);
            
            // Bolt rotation
            bolt.rotation.x += 0.1;
            bolt.rotation.z += 0.05;
        }, 16);
    }

    createPlasmaExplosion(position) {
        const explosionGeometry = new THREE.SphereGeometry(2, 12, 12);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: THEME.effects.explosion.plasma,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Animate explosion
        let scale = 0.1;
        let opacity = 0.8;
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

    createLaserImpact(position) {
        // Impact sparks
        const sparkCount = 10;
        for (let i = 0; i < sparkCount; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                emissive: 0xff4400,
                emissiveIntensity: 1.0
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(position);
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
            this.scene.add(spark);

            // Animate spark
            const sparkVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            );

            const sparkInterval = setInterval(() => {
                spark.position.add(sparkVelocity.multiplyScalar(0.1));
                spark.scale.multiplyScalar(0.9);

                if (spark.scale.x < 0.1) {
                    this.scene.remove(spark);
                    clearInterval(sparkInterval);
                }
            }, 50);
        }
    }

    createMuzzleFlash(position) {
        const flashGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.medium,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.mesh.add(flash);

        setTimeout(() => {
            this.mesh.remove(flash);
        }, 100);
    }

    takeDamage(amount, damageType) {
        this.lastDamageTime = Date.now();
        
        // Shields absorb damage first
        if (this.shielding > 0) {
            const shieldAbsorbed = Math.min(this.shielding, amount);
            this.shielding -= shieldAbsorbed;
            amount -= shieldAbsorbed;
            
            // Visual shield hit
            if (this.energyShield) {
                this.energyShield.visible = true;
                this.energyShield.material.opacity = 0.6;
                this.energyShield.material.color.setHex(0xff4400);
                
                setTimeout(() => {
                    this.energyShield.visible = false;
                    this.energyShield.material.color.setHex(0x0066ff);
                }, 300);
            }
        }

        // Remaining damage to health
        if (amount > 0) {
            this.health -= amount;
            
            // Evasive maneuver when damaged
            if (Math.random() < 0.6) {
                this.performEvasiveManeuver();
            }
        }

        // Damage sparks
        this.createDamageSparks();

        // System damage increasing corruption
        this.corruptionLevel = Math.min(1.0, this.corruptionLevel + 0.1);
        this.malfunctionChance = this.corruptionLevel * 0.3;
    }

    createDamageSparks() {
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            const sparkGeometry = new THREE.SphereGeometry(0.03, 4, 4);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: THEME.items.weapons.legendary,
                emissive: THEME.items.weapons.legendary,
                emissiveIntensity: 1.0
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(this.position);
            spark.position.y += this.flightHeight;
            spark.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 2
            ));
            this.scene.add(spark);

            // Spark falls with gravity
            const sparkInterval = setInterval(() => {
                spark.position.y -= 0.05;
                spark.scale.multiplyScalar(0.98);

                if (spark.scale.x < 0.1 || spark.position.y < this.position.y - 2) {
                    this.scene.remove(spark);
                    clearInterval(sparkInterval);
                }
            }, 50);
        }
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        
        // Drone crash explosion
        const crashPosition = this.position.clone();
        crashPosition.y += this.flightHeight;
        
        this.createPlasmaExplosion(crashPosition);
        
        // Falling debris
        this.createFallingDebris(crashPosition);
    }

    createFallingDebris(crashPosition) {
        const debrisCount = 8;
        for (let i = 0; i < debrisCount; i++) {
            const debrisGeometry = new THREE.BoxGeometry(
                Math.random() * 0.4 + 0.1,
                Math.random() * 0.4 + 0.1,
                Math.random() * 0.4 + 0.1
            );
            const debrisMaterial = new THREE.MeshLambertMaterial({
                color: 0x333333
            });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.copy(crashPosition);
            debris.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 2,
                (Math.random() - 0.5) * 4
            ));
            this.scene.add(debris);

            // Debris physics
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );

            const debrisInterval = setInterval(() => {
                debris.position.add(velocity.multiplyScalar(0.05));
                velocity.y -= 0.1; // Gravity
                debris.rotation.x += 0.1;
                debris.rotation.y += 0.08;
                debris.rotation.z += 0.06;

                // Remove when hits ground
                if (debris.position.y <= this.position.y) {
                    this.scene.remove(debris);
                    clearInterval(debrisInterval);
                }
            }, 50);
        }
    }

    getStatusInfo() {
        return {
            type: 'Corrupted Drone',
            health: this.health,
            maxHealth: this.maxHealth,
            threat: 'High',
            abilities: ['Flight', 'Energy Weapons', 'Evasive Maneuvers', 'Energy Shields', 'EMP'],
            currentWeapon: this.currentWeapon,
            weaponEnergy: this.weaponEnergy,
            shielding: this.shielding,
            corruptionLevel: this.corruptionLevel,
            flightPattern: this.flightPattern,
            flightHeight: this.flightHeight
        };
    }
}

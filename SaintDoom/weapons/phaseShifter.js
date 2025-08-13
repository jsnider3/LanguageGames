import * as THREE from 'three';
import { BaseWeapon } from '../core/BaseWeapon.js';
import { THEME } from '../modules/config/theme.js';


export class PhaseShifter extends BaseWeapon {
    constructor() {
        super();
        this.name = 'Phase Shifter';
        this.damage = 35;
        this.fireRate = 400; // ms between shots
        this.ammoCapacity = 20;
        this.currentAmmo = this.ammoCapacity;
        this.range = 80;
        this.accuracy = 0.92;
        
        // Phase shifter specific properties
        this.phaseMode = 'normal'; // normal, phased
        this.phaseEnergy = 100;
        this.maxPhaseEnergy = 100;
        this.phaseDuration = 5000; // 5 seconds
        this.phaseRechargeRate = 15; // per second
        this.phaseActive = false;
        this.phaseStartTime = 0;
        this.dimensionalRift = null;
        this.activeEffects = [];
    }

    createWeaponModel() {
        const weaponGroup = new THREE.Group();

        // Main weapon body - sleek sci-fi design
        const bodyGeometry = new THREE.BoxGeometry(2.5, 0.6, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        weaponGroup.add(body);

        // Phase chamber
        const chamberGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const chamberMaterial = new THREE.MeshStandardMaterial({
            color: 0x7f00ff,
            metalness: 0.5,
            roughness: 0.2,
            emissive: 0x3300aa,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
        chamber.position.x = 0.2;
        weaponGroup.add(chamber);
        this.phaseChamber = chamber;

        // Dimensional rings
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(0.5 + i * 0.1, 0.03, 8, 16);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x004444,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.x = 0.2;
            ring.rotation.y = (i * Math.PI / 3);
            weaponGroup.add(ring);
            
            if (i === 0) this.dimensionalRings = [ring];
            else this.dimensionalRings.push(ring);
        }

        // Barrel with phase distortion effect
        const barrelGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.9,
            roughness: 0.1
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 1.5;
        weaponGroup.add(barrel);

        // Grip
        const gripGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.3);
        const gripMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(-0.8, -0.8, 0);
        weaponGroup.add(grip);

        // Phase energy indicator
        const indicatorGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.05);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: THEME.ui.health.full,
            emissive: 0x004400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(-0.5, 0.4, 0);
        weaponGroup.add(indicator);
        this.phaseIndicator = indicator;

        return weaponGroup;
    }

    // Primary fire - phase bullets
    fire(scene, position, direction, player) {
        if (this.currentAmmo <= 0 || Date.now() - this.lastFired < this.fireRate) {
            return null;
        }

        this.currentAmmo--;
        this.lastFired = Date.now();

        // Create phase projectile
        const projectile = this.createPhaseProjectile(position, direction);
        scene.add(projectile);

        // Muzzle flash
        this.createMuzzleFlash(scene, position, direction);

        return projectile;
    }

    // Secondary fire - toggle phase mode
    togglePhaseMode(player) {
        if (this.phaseActive) {
            this.deactivatePhase(player);
        } else if (this.phaseEnergy >= 30) {
            this.activatePhase(player);
        }
    }

    activatePhase(player) {
        if (this.phaseEnergy < 30) return false;

        this.phaseActive = true;
        this.phaseStartTime = Date.now();
        this.phaseMode = 'phased';

        // Make player semi-transparent and invulnerable to physical attacks
        if (player && player.mesh) {
            player.mesh.material.transparent = true;
            player.mesh.material.opacity = 0.5;
            player.isPhased = true;
        }

        // Visual effect on weapon
        if (this.phaseChamber) {
            this.phaseChamber.material.emissiveIntensity = 0.8;
            this.phaseChamber.material.color.setHex(0x00ffff);
        }

        return true;
    }

    deactivatePhase(player) {
        this.phaseActive = false;
        this.phaseMode = 'normal';

        // Restore player visibility
        if (player && player.mesh) {
            player.mesh.material.opacity = 1.0;
            player.isPhased = false;
        }

        // Reset weapon visuals
        if (this.phaseChamber) {
            this.phaseChamber.material.emissiveIntensity = 0.3;
            this.phaseChamber.material.color.setHex(0x7f00ff);
        }
    }

    createPhaseProjectile(position, direction) {
        const projectileGroup = new THREE.Group();

        // Phase bullet core
        const coreGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: this.phaseActive ? 0x00ffff : 0x7f00ff,
            emissive: this.phaseActive ? 0x006666 : 0x330066,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: this.phaseActive ? 0.7 : 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectileGroup.add(core);

        // Phase distortion rings
        for (let i = 0; i < 2; i++) {
            const ringGeometry = new THREE.RingGeometry(0.2 + i * 0.1, 0.25 + i * 0.1, 8);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.phaseActive ? 0x00aaaa : 0x5500aa,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.z = i * 0.1;
            projectileGroup.add(ring);
        }

        // Point light for glow
        const lightColor = this.phaseActive ? 0x00ffff : 0x7f00ff;
        const light = new THREE.PointLight(lightColor, 1.5, 8);
        projectileGroup.add(light);

        projectileGroup.position.copy(position);

        // Calculate velocity
        const speed = 60;
        const velocity = direction.clone().multiplyScalar(speed);

        projectileGroup.userData = {
            type: 'phase_bullet',
            damage: this.phaseActive ? this.damage * 0.8 : this.damage,
            velocity: velocity,
            speed: speed,
            life: 2500,
            birthTime: Date.now(),
            phased: this.phaseActive,
            penetrating: this.phaseActive // Phased bullets go through walls
        };

        return projectileGroup;
    }

    createMuzzleFlash(scene, position, direction) {
        const flashGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: this.phaseActive ? 0x00ffff : 0x7f00ff,
            transparent: true,
            opacity: 0.6
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        scene.add(flash);

        // Dimensional tear effect
        const tearGeometry = new THREE.PlaneGeometry(2, 0.1);
        const tearMaterial = new THREE.MeshBasicMaterial({
            color: THEME.materials.black,
            transparent: true,
            opacity: 0.8
        });
        const tear = new THREE.Mesh(tearGeometry, tearMaterial);
        tear.position.copy(position);
        tear.lookAt(position.clone().add(direction));
        scene.add(tear);

        this.activeEffects.push({
            type: 'muzzle_flash',
            mesh: flash,
            tear: tear,
            duration: 500,
            currentTime: 0
        });
    }

    createDimensionalRift(scene, position) {
        const riftGroup = new THREE.Group();

        // Rift portal
        const riftGeometry = new THREE.RingGeometry(1, 2, 16);
        const riftMaterial = new THREE.MeshBasicMaterial({
            color: 0x7f00ff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const rift = new THREE.Mesh(riftGeometry, riftMaterial);
        rift.rotation.x = Math.PI / 2;
        riftGroup.add(rift);

        // Swirling energy
        const energyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
        const energyMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x004444,
            emissiveIntensity: 0.6
        });
        
        for (let i = 0; i < 8; i++) {
            const energy = new THREE.Mesh(energyGeometry, energyMaterial);
            const angle = (i / 8) * Math.PI * 2;
            energy.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
            energy.rotation.z = angle;
            riftGroup.add(energy);
        }

        riftGroup.position.copy(position);
        riftGroup.position.y = 2;
        scene.add(riftGroup);

        this.activeEffects.push({
            type: 'dimensional_rift',
            mesh: riftGroup,
            duration: 3000,
            currentTime: 0
        });

        return riftGroup;
    }

    update(deltaTime, player) {
        // Phase energy management
        if (this.phaseActive) {
            const phaseTime = Date.now() - this.phaseStartTime;
            const energyDrain = (100 / this.phaseDuration) * deltaTime;
            this.phaseEnergy = Math.max(0, this.phaseEnergy - energyDrain);

            // Deactivate if out of energy or time
            if (this.phaseEnergy <= 0 || phaseTime >= this.phaseDuration) {
                this.deactivatePhase(player);
            }
        } else if (this.phaseEnergy < this.maxPhaseEnergy) {
            // Recharge phase energy
            this.phaseEnergy = Math.min(
                this.maxPhaseEnergy,
                this.phaseEnergy + (this.phaseRechargeRate * deltaTime)
            );
        }

        // Animate dimensional rings
        if (this.dimensionalRings) {
            this.dimensionalRings.forEach((ring, index) => {
                ring.rotation.z += deltaTime * 1 * (index + 1);
                ring.rotation.y += deltaTime * 0.5;
            });
        }

        // Update phase indicator
        if (this.phaseIndicator) {
            const energyPercent = this.phaseEnergy / this.maxPhaseEnergy;
            this.phaseIndicator.scale.x = energyPercent;
            
            if (this.phaseActive) {
                this.phaseIndicator.material.color.setHex(0x00ffff);
            } else if (energyPercent > 0.3) {
                this.phaseIndicator.material.color.setHex(THEME.ui.health.full);
            } else {
                this.phaseIndicator.material.color.setHex(THEME.ui.health.low);
            }
        }

        // Animate phase chamber during phase mode
        if (this.phaseChamber && this.phaseActive) {
            const pulseIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            this.phaseChamber.material.emissiveIntensity = pulseIntensity;
        }

        this.updateEffects(deltaTime);
    }

    updateEffects(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.currentTime += deltaTime;
            const progress = effect.currentTime / effect.duration;

            if (progress >= 1) {
                this.scene.remove(effect.mesh);
                if (effect.tear) this.scene.remove(effect.tear);
                return false;
            }

            switch (effect.type) {
                case 'muzzle_flash':
                    effect.mesh.scale.setScalar(effect.mesh.scale.x + 30 * deltaTime);
                    effect.mesh.material.opacity -= 1.2 * deltaTime;
                    effect.tear.material.opacity -= 1.6 * deltaTime;
                    break;
                case 'dimensional_rift':
                    effect.mesh.rotation.z += 5 * deltaTime;
                    effect.mesh.children.forEach((child, index) => {
                        if (index > 0) { // Skip the rift itself
                            child.rotation.y += 10 * deltaTime;
                        }
                    });
                    break;
            }

            return true;
        });
    }

    updateProjectile(projectile, deltaTime, scene) {
        const userData = projectile.userData;
        const age = Date.now() - userData.birthTime;

        // Remove if too old
        if (age > userData.life) {
            scene.remove(projectile);
            return false;
        }

        // Move projectile
        const movement = userData.velocity.clone().multiplyScalar(deltaTime);
        projectile.position.add(movement);

        // Animate phase effects
        projectile.children[0].rotation.x += 20 * deltaTime;
        projectile.children[0].rotation.y += 30 * deltaTime;

        // Animate rings
        if (projectile.children.length > 1) {
            for (let i = 1; i < projectile.children.length - 1; i++) {
                if (projectile.children[i].rotation) {
                    projectile.children[i].rotation.z += 10 * deltaTime;
                }
            }
        }

        return true;
    }

    reload() {
        if (this.currentAmmo < this.ammoCapacity && this.totalAmmo > 0) {
            const ammoNeeded = this.ammoCapacity - this.currentAmmo;
            const ammoToReload = Math.min(ammoNeeded, this.totalAmmo);
            
            this.currentAmmo += ammoToReload;
            this.totalAmmo -= ammoToReload;
            
            return true;
        }
        return false;
    }

    getPhaseEnergyPercentage() {
        return (this.phaseEnergy / this.maxPhaseEnergy) * 100;
    }

    isPhased() {
        return this.phaseActive;
    }

    canPhase() {
        return this.phaseEnergy >= 30;
    }
}

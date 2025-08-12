import * as THREE from 'three';
import { BaseWeapon } from '../core/BaseWeapon.js';

export class PlasmaDisintegrator extends BaseWeapon {
    constructor() {
        super();
        this.name = 'Plasma Disintegrator';
        this.damage = 45;
        this.fireRate = 300; // ms between shots
        this.ammoCapacity = 25;
        this.currentAmmo = this.ammoCapacity;
        this.range = 100;
        this.accuracy = 0.95;
        
        // Plasma specific properties
        this.chargeTime = 1000; // ms to fully charge
        this.maxCharge = 3; // multiplier for fully charged shot
        this.currentCharge = 0;
        this.charging = false;
        this.overheated = false;
        this.heatLevel = 0;
        this.maxHeat = 100;
        this.coolingRate = 20; // heat units per second
        this.heatPerShot = 15;
    }

    createWeaponModel() {
        const weaponGroup = new THREE.Group();

        // Main body - futuristic design
        const bodyGeometry = new THREE.BoxGeometry(2, 0.8, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        weaponGroup.add(body);

        // Plasma chamber
        const chamberGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const chamberMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a90e2,
            metalness: 0.6,
            roughness: 0.3,
            emissive: 0x001144,
            emissiveIntensity: 0.2
        });
        const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
        chamber.rotation.z = Math.PI / 2;
        chamber.position.x = 0.2;
        weaponGroup.add(chamber);

        // Barrel with plasma effect
        const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.x = 1.2;
        weaponGroup.add(barrel);

        // Energy coils
        for (let i = 0; i < 3; i++) {
            const coilGeometry = new THREE.TorusGeometry(0.35, 0.05, 4, 8);
            const coilMaterial = new THREE.MeshStandardMaterial({
                color: 0x00aaff,
                emissive: 0x003366,
                emissiveIntensity: 0.5
            });
            const coil = new THREE.Mesh(coilGeometry, coilMaterial);
            coil.rotation.y = Math.PI / 2;
            coil.position.x = -0.3 + i * 0.3;
            weaponGroup.add(coil);
        }

        // Grip
        const gripGeometry = new THREE.BoxGeometry(0.3, 1, 0.4);
        const gripMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(-0.5, -0.7, 0);
        weaponGroup.add(grip);

        // Charge indicator
        const indicatorGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x004400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(-0.8, 0.2, 0);
        weaponGroup.add(indicator);
        this.chargeIndicator = indicator;

        return weaponGroup;
    }

    startCharging() {
        if (this.overheated || this.currentAmmo <= 0) return;
        
        this.charging = true;
        this.currentCharge = 0;
        
        // Visual charging effect
        if (this.chargeIndicator) {
            this.chargeIndicator.material.color.setHex(0xffaa00);
            this.chargeIndicator.material.emissiveIntensity = 1.0;
        }
    }

    stopCharging() {
        this.charging = false;
        
        // Reset indicator
        if (this.chargeIndicator) {
            this.chargeIndicator.material.color.setHex(0x00ff00);
            this.chargeIndicator.material.emissiveIntensity = 0.3;
        }
    }

    fire(scene, position, direction, player) {
        if (this.overheated || this.currentAmmo <= 0 || Date.now() - this.lastFired < this.fireRate) {
            return null;
        }

        // Calculate charge multiplier
        const chargeMultiplier = 1 + (this.currentCharge / 100) * (this.maxCharge - 1);
        const actualDamage = this.damage * chargeMultiplier;
        
        // Heat management
        const heatGenerated = this.heatPerShot * chargeMultiplier;
        this.heatLevel = Math.min(this.maxHeat, this.heatLevel + heatGenerated);
        
        if (this.heatLevel >= this.maxHeat) {
            this.overheated = true;
            this.startCooling();
        }

        this.currentAmmo--;
        this.lastFired = Date.now();
        this.currentCharge = 0;

        // Create plasma projectile
        const projectile = this.createPlasmaProjectile(position, direction, actualDamage, chargeMultiplier);
        scene.add(projectile);

        // Muzzle flash effect
        this.createMuzzleFlash(scene, position, direction);

        return projectile;
    }

    createPlasmaProjectile(position, direction, damage, chargeMultiplier) {
        const projectileGroup = new THREE.Group();

        // Core plasma ball
        const size = 0.3 + (chargeMultiplier - 1) * 0.2;
        const coreGeometry = new THREE.SphereGeometry(size, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            emissive: 0x0077cc,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectileGroup.add(core);

        // Energy trail
        const trailGeometry = new THREE.CylinderGeometry(size * 0.5, size, size * 2, 6);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x4466ff,
            transparent: true,
            opacity: 0.6
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.z = Math.PI / 2;
        trail.position.x = -size;
        projectileGroup.add(trail);

        // Point light for illumination
        const light = new THREE.PointLight(0x00aaff, 2, 10);
        projectileGroup.add(light);

        // Set position and direction
        projectileGroup.position.copy(position);
        
        // Calculate velocity based on charge
        const baseSpeed = 80;
        const speed = baseSpeed + (chargeMultiplier - 1) * 20;
        const velocity = direction.clone().multiplyScalar(speed);

        // Projectile properties
        projectileGroup.userData = {
            type: 'plasma',
            damage: damage,
            velocity: velocity,
            speed: speed,
            life: 3000, // 3 seconds
            birthTime: Date.now(),
            piercing: chargeMultiplier > 2, // Fully charged shots can pierce
            explosive: chargeMultiplier > 1.5, // Partially charged shots explode
            size: size
        };

        return projectileGroup;
    }

    createMuzzleFlash(scene, position, direction) {
        // Bright plasma flash
        const flashGeometry = new THREE.SphereGeometry(1, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ddff,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        scene.add(flash);

        // Animate flash
        let scale = 1;
        let opacity = 0.8;
        const flashInterval = setInterval(() => {
            scale += 0.5;
            opacity -= 0.15;
            flash.scale.setScalar(scale);
            flash.material.opacity = opacity;

            if (opacity <= 0) {
                scene.remove(flash);
                clearInterval(flashInterval);
            }
        }, 50);

        // Electric arcs
        for (let i = 0; i < 3; i++) {
            const arcGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 4);
            const arcMaterial = new THREE.MeshBasicMaterial({
                color: 0xaaaaff,
                emissive: 0x6666aa,
                emissiveIntensity: 0.8
            });
            const arc = new THREE.Mesh(arcGeometry, arcMaterial);
            
            const angle = (Math.PI * 2 / 3) * i;
            arc.position.copy(position);
            arc.position.x += Math.cos(angle) * 0.5;
            arc.position.z += Math.sin(angle) * 0.5;
            arc.rotation.z = angle;
            scene.add(arc);

            setTimeout(() => scene.remove(arc), 100);
        }
    }

    startCooling() {
        if (this.coolingInterval) return;

        this.coolingInterval = setInterval(() => {
            this.heatLevel = Math.max(0, this.heatLevel - this.coolingRate);
            
            if (this.heatLevel <= 0) {
                this.overheated = false;
                clearInterval(this.coolingInterval);
                this.coolingInterval = null;
            }
        }, 1000);
    }

    update(deltaTime) {
        if (this.charging && this.currentCharge < 100) {
            this.currentCharge += (deltaTime / this.chargeTime) * 100;
            this.currentCharge = Math.min(100, this.currentCharge);

            // Update charge indicator
            if (this.chargeIndicator) {
                const intensity = 0.3 + (this.currentCharge / 100) * 0.7;
                this.chargeIndicator.material.emissiveIntensity = intensity;
                
                if (this.currentCharge >= 100) {
                    this.chargeIndicator.material.color.setHex(0xff0000);
                }
            }
        }

        // Heat dissipation when not cooling
        if (!this.overheated && !this.coolingInterval && this.heatLevel > 0) {
            this.heatLevel = Math.max(0, this.heatLevel - (this.coolingRate * deltaTime / 1000));
        }
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
        const movement = userData.velocity.clone().multiplyScalar(deltaTime / 1000);
        projectile.position.add(movement);

        // Animate plasma effect
        projectile.children[0].rotation.x += deltaTime * 0.01;
        projectile.children[0].rotation.y += deltaTime * 0.02;

        // Pulsing effect
        const pulseIntensity = 0.8 + Math.sin(age * 0.01) * 0.2;
        projectile.children[0].material.emissiveIntensity = pulseIntensity;

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

    getHeatPercentage() {
        return (this.heatLevel / this.maxHeat) * 100;
    }

    getChargePercentage() {
        return this.currentCharge;
    }

    isOverheated() {
        return this.overheated;
    }
}
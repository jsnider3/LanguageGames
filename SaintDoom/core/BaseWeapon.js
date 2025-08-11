import * as THREE from 'three';
import { VisualEffectsManager } from '../utils/VisualEffectsManager.js';
import { CombatUtils } from '../utils/CombatUtils.js';

export class BaseWeapon {
    constructor(config = {}) {
        // Basic properties
        this.name = config.name || 'Weapon';
        this.damage = config.damage || 25;
        this.fireRate = config.fireRate || 500;
        this.range = config.range || 50;
        this.ammo = config.ammo || Infinity;
        this.maxAmmo = config.maxAmmo || Infinity;
        this.clipSize = config.clipSize || 30;
        this.currentClip = config.currentClip || this.clipSize;
        this.reloadTime = config.reloadTime || 2000;
        
        // Weapon type
        this.weaponType = config.weaponType || 'projectile'; // projectile, hitscan, melee, special
        this.damageType = config.damageType || 'physical'; // physical, holy, fire, energy, etc
        
        // State
        this.isReloading = false;
        this.lastFireTime = 0;
        this.isEquipped = false;
        this.owner = null;
        
        // Special properties
        this.hasAltFire = config.hasAltFire || false;
        this.altFireRate = config.altFireRate || 1000;
        this.altDamage = config.altDamage || this.damage * 2;
        this.lastAltFireTime = 0;
        
        // Upgrades
        this.upgradeLevel = 0;
        this.upgrades = new Map();
        
        // Visual/Audio
        this.muzzleFlashColor = config.muzzleFlashColor || 0xffff00;
        this.projectileColor = config.projectileColor || 0xff0000;
        this.fireSound = config.fireSound || null;
        this.reloadSound = config.reloadSound || null;
        
        // References
        this.scene = null;
        this.camera = null;
        this.visualEffects = null;
        this.mesh = null;
    }

    initialize(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.visualEffects = new VisualEffectsManager(scene);
        this.createMesh();
    }

    createMesh() {
        // Override in subclasses
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        if (this.camera) {
            this.camera.add(this.mesh);
            this.mesh.position.set(0.3, -0.2, -0.5);
        }
    }

    equip(owner) {
        this.owner = owner;
        this.isEquipped = true;
        this.onEquip();
    }

    unequip() {
        this.isEquipped = false;
        this.onUnequip();
        this.owner = null;
    }

    onEquip() {
        // Override for equip animations/effects
        if (this.mesh) {
            this.mesh.visible = true;
        }
    }

    onUnequip() {
        // Override for unequip animations/effects
        if (this.mesh) {
            this.mesh.visible = false;
        }
    }

    canFire() {
        if (this.isReloading) return false;
        if (this.currentClip <= 0 && this.clipSize !== Infinity) return false;
        
        const currentTime = Date.now();
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    canAltFire() {
        if (!this.hasAltFire) return false;
        if (this.isReloading) return false;
        
        const currentTime = Date.now();
        return currentTime - this.lastAltFireTime >= this.altFireRate;
    }

    fire(origin, direction, targets = []) {
        if (!this.canFire()) return false;
        
        this.lastFireTime = Date.now();
        
        // Consume ammo
        if (this.clipSize !== Infinity) {
            this.currentClip--;
            
            if (this.currentClip <= 0) {
                this.reload();
            }
        }
        
        // Create muzzle flash
        if (this.visualEffects && origin) {
            this.visualEffects.createMuzzleFlash(origin, 1, this.muzzleFlashColor);
        }
        
        // Play fire sound
        if (this.fireSound) {
            this.playSound(this.fireSound);
        }
        
        // Weapon recoil
        this.applyRecoil();
        
        // Weapon-specific fire logic
        switch (this.weaponType) {
            case 'projectile':
                return this.fireProjectile(origin, direction, targets);
            case 'hitscan':
                return this.fireHitscan(origin, direction, targets);
            case 'melee':
                return this.performMeleeAttack(origin, direction, targets);
            case 'special':
                return this.performSpecialAttack(origin, direction, targets);
            default:
                return false;
        }
    }

    altFire(origin, direction, targets = []) {
        if (!this.canAltFire()) return false;
        
        this.lastAltFireTime = Date.now();
        
        // Override in subclasses for specific alt-fire behavior
        return this.performAltFire(origin, direction, targets);
    }

    performAltFire(origin, direction, targets) {
        // Default alt-fire: stronger single shot
        const projectile = CombatUtils.createProjectile(this.scene, {
            position: origin,
            direction: direction,
            speed: 30,
            damage: this.altDamage,
            size: 0.3,
            color: this.projectileColor,
            explosive: true,
            explosionRadius: 5
        });
        
        return true;
    }

    fireProjectile(origin, direction, targets) {
        const projectile = CombatUtils.createProjectile(this.scene, {
            position: origin,
            direction: direction,
            speed: 20,
            damage: this.calculateDamage(),
            lifetime: 5000,
            size: 0.1,
            color: this.projectileColor,
            owner: this.owner
        });
        
        return projectile;
    }

    fireHitscan(origin, direction, targets) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(origin, direction);
        
        // Check for hits
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        
        for (const intersect of intersects) {
            if (intersect.distance > this.range) break;
            
            // Check if hit an enemy
            const hitObject = intersect.object;
            const enemy = this.findEnemyFromMesh(hitObject, targets);
            
            if (enemy) {
                const damage = this.calculateDamage();
                const damageWithFalloff = CombatUtils.calculateDamage(damage, this.damageType, enemy, {
                    distance: intersect.distance,
                    distanceFalloff: true,
                    falloffStart: this.range * 0.5,
                    falloffEnd: this.range
                });
                
                if (enemy.takeDamage) {
                    enemy.takeDamage(damageWithFalloff);
                }
                
                // Create hit effect
                if (this.visualEffects) {
                    this.visualEffects.createParticleExplosion(intersect.point, {
                        count: 5,
                        color: 0xff0000,
                        size: 0.05
                    });
                }
                
                // Create bullet trail
                if (this.visualEffects) {
                    this.visualEffects.createTrailEffect(origin, intersect.point, {
                        color: this.projectileColor,
                        width: 0.02,
                        lifetime: 100
                    });
                }
                
                return true;
            }
        }
        
        // No hit - create trail to max range
        const endPoint = origin.clone().add(direction.clone().multiplyScalar(this.range));
        if (this.visualEffects) {
            this.visualEffects.createTrailEffect(origin, endPoint, {
                color: this.projectileColor,
                width: 0.02,
                lifetime: 100
            });
        }
        
        return false;
    }

    performMeleeAttack(origin, direction, targets) {
        const hits = CombatUtils.performMeleeAttack(this.owner || { position: origin }, direction, {
            range: this.range,
            damage: this.calculateDamage(),
            targets: targets,
            knockback: 10
        });
        
        // Create swing effect
        if (this.visualEffects && hits.length > 0) {
            hits.forEach(target => {
                const targetPos = target.position || target.mesh?.position;
                if (targetPos) {
                    this.visualEffects.createParticleExplosion(targetPos, {
                        count: 10,
                        color: 0xff0000
                    });
                }
            });
        }
        
        return hits.length > 0;
    }

    performSpecialAttack(origin, direction, targets) {
        // Override in subclasses for unique weapon behavior
        return false;
    }

    reload() {
        if (this.isReloading) return;
        if (this.currentClip === this.clipSize) return;
        if (this.ammo <= 0 && this.ammo !== Infinity) return;
        
        this.isReloading = true;
        
        // Play reload sound
        if (this.reloadSound) {
            this.playSound(this.reloadSound);
        }
        
        // Reload animation
        this.performReloadAnimation();
        
        setTimeout(() => {
            const ammoNeeded = this.clipSize - this.currentClip;
            
            if (this.ammo === Infinity) {
                this.currentClip = this.clipSize;
            } else {
                const ammoToReload = Math.min(ammoNeeded, this.ammo);
                this.currentClip += ammoToReload;
                this.ammo -= ammoToReload;
            }
            
            this.isReloading = false;
            this.onReloadComplete();
        }, this.reloadTime);
    }

    performReloadAnimation() {
        // Override for reload animations
        if (this.mesh) {
            const originalY = this.mesh.position.y;
            this.mesh.position.y -= 0.3;
            
            const animationDuration = this.reloadTime;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / animationDuration, 1);
                
                this.mesh.position.y = originalY - 0.3 + (0.3 * progress);
                this.mesh.rotation.x = Math.sin(progress * Math.PI * 2) * 0.1;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.mesh.position.y = originalY;
                    this.mesh.rotation.x = 0;
                }
            };
            
            animate();
        }
    }

    onReloadComplete() {
        // Override for reload complete effects
    }

    applyRecoil() {
        if (this.camera) {
            // Simple recoil animation
            const recoilStrength = 0.01;
            this.camera.rotation.x += recoilStrength;
            
            setTimeout(() => {
                this.camera.rotation.x -= recoilStrength;
            }, 50);
        }
    }

    calculateDamage() {
        let damage = this.damage;
        
        // Apply upgrades
        this.upgrades.forEach((upgrade, type) => {
            if (type === 'damage') {
                damage *= upgrade.multiplier || 1;
            }
        });
        
        // Apply owner bonuses
        if (this.owner) {
            if (this.owner.damageMultiplier) {
                damage *= this.owner.damageMultiplier;
            }
            
            if (this.owner.holyPower && this.damageType === 'holy') {
                damage *= 1 + (this.owner.holyPower / 100) * 0.5;
            }
        }
        
        return damage;
    }

    findEnemyFromMesh(mesh, targets) {
        for (const target of targets) {
            if (target.mesh === mesh || 
                (target.mesh && target.mesh.children.includes(mesh)) ||
                (mesh.parent && target.mesh === mesh.parent)) {
                return target;
            }
        }
        return null;
    }

    upgrade(upgradeType, upgradeData) {
        this.upgrades.set(upgradeType, upgradeData);
        this.upgradeLevel++;
        
        // Apply upgrade effects
        switch (upgradeType) {
            case 'damage':
                this.damage *= upgradeData.multiplier || 1.2;
                break;
            case 'fireRate':
                this.fireRate *= upgradeData.multiplier || 0.8;
                break;
            case 'clipSize':
                this.clipSize = Math.floor(this.clipSize * (upgradeData.multiplier || 1.5));
                this.currentClip = this.clipSize;
                break;
            case 'reload':
                this.reloadTime *= upgradeData.multiplier || 0.7;
                break;
        }
    }

    playSound(soundName) {
        // Implement sound playing logic
        // This would interface with your audio system
    }

    update(deltaTime) {
        // Update weapon animations, projectiles, etc.
        if (this.mesh && this.isEquipped) {
            // Idle animation
            this.mesh.rotation.y = Math.sin(Date.now() * 0.001) * 0.02;
        }
    }

    getStatus() {
        return {
            name: this.name,
            ammo: this.ammo,
            currentClip: this.currentClip,
            clipSize: this.clipSize,
            isReloading: this.isReloading,
            upgradeLevel: this.upgradeLevel
        };
    }

    dispose() {
        if (this.mesh) {
            if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
            }
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
        
        if (this.visualEffects) {
            this.visualEffects.cleanup();
        }
    }
}
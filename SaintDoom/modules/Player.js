import * as THREE from 'three';
// Player Module
// Handles player state, movement, health, weapons, and abilities

import { GAME_CONFIG } from './GameConfig.js';
import { GeometryCache, AudioManager } from './Utils.js';
import logger, { LogCategory, logPlayerAction } from './Logger.js';

export class Player {
    constructor(camera) {
        this.camera = camera;
        this.position = new THREE.Vector3(0, GAME_CONFIG.PLAYER.MOVEMENT.BASE_HEIGHT, 0);
        
        // Add getter/setter to track position changes
        this._positionX = this.position.x;
        Object.defineProperty(this.position, 'x', {
            get: () => this._positionX,
            set: (value) => {
                if (Math.abs(value - this._positionX) > 5) {
                    logger.warn(LogCategory.PLAYER, 'Large X position change detected', {
                        previous: this._positionX,
                        current: value,
                        delta: value - this._positionX
                    });
                }
                this._positionX = value;
            }
        });
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isPlayer = true;  // Flag for enemy attack detection
        
        // Movement
        this.moveSpeed = GAME_CONFIG.PLAYER.MOVEMENT.SPEED;
        this.sprintMultiplier = GAME_CONFIG.PLAYER.MOVEMENT.SPRINT_MULTIPLIER;
        this.friction = GAME_CONFIG.PLAYER.MOVEMENT.FRICTION;
        this.bobAmount = 0;
        this.bobSpeed = GAME_CONFIG.PLAYER.MOVEMENT.BOB_SPEED;
        this.baseHeight = GAME_CONFIG.PLAYER.MOVEMENT.BASE_HEIGHT;
        
        // Mouse look
        this.mouseSensitivity = GAME_CONFIG.PLAYER.MOUSE.SENSITIVITY;
        this.pitch = 0;
        this.yaw = 0;
        this.maxPitch = GAME_CONFIG.PLAYER.MOUSE.MAX_PITCH;
        
        // Health & Armor
        this.health = GAME_CONFIG.PLAYER.HEALTH.MAX_HEALTH;
        this.maxHealth = GAME_CONFIG.PLAYER.HEALTH.MAX_HEALTH;
        this.armor = 0;
        this.maxArmor = GAME_CONFIG.PLAYER.HEALTH.MAX_ARMOR;
        
        // Ammo
        this.ammo = {
            shells: GAME_CONFIG.PLAYER.AMMO.INITIAL_SHELLS,
            bullets: GAME_CONFIG.PLAYER.AMMO.INITIAL_BULLETS,
            cells: 0,
            rockets: 0
        };
        this.maxAmmo = {
            shells: GAME_CONFIG.PLAYER.AMMO.MAX_SHELLS,
            bullets: GAME_CONFIG.PLAYER.AMMO.MAX_BULLETS,
            cells: GAME_CONFIG.PLAYER.AMMO.MAX_CELLS,
            rockets: GAME_CONFIG.PLAYER.AMMO.MAX_ROCKETS
        };
        
        // Weapons
        this.weapons = ['sword', 'shotgun', 'holywater', 'crucifix'];
        this.currentWeaponIndex = -1; // No weapon selected initially
        this.currentWeapon = null; // No weapon selected initially
        
        // Holy water grenades
        this.holyWaterCount = 3;
        this.maxHolyWater = 10;
        
        // Holy Rage system
        this.rage = 0;
        this.maxRage = GAME_CONFIG.PLAYER.RAGE.MAX_RAGE;
        this.rageDecayRate = GAME_CONFIG.PLAYER.RAGE.DECAY_RATE;
        this.isRaging = false;
        this.rageDuration = GAME_CONFIG.PLAYER.RAGE.DURATION;
        this.rageTimer = 0;
        
        this.isGrounded = true;
        this.isSprinting = false;
        this.isBlocking = false;
        
        this.radius = GAME_CONFIG.PLAYER.MOVEMENT.RADIUS;
        this.height = GAME_CONFIG.PLAYER.MOVEMENT.HEIGHT;
        
        this.createShadowMesh();
    }
    
    createShadowMesh() {
        // Create a simple cylinder to represent the player body for shadow casting only
        // This won't be visible in first-person but will cast shadows
        const bodyGeometry = GeometryCache.getCylinder(0.2, 0.3, 1.6, 8);
        const bodyMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0, // Invisible but still casts shadows
            side: THREE.DoubleSide
        });
        
        this.shadowMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.shadowMesh.position.copy(this.position);
        this.shadowMesh.position.y = 0.8; // Center the cylinder
        this.shadowMesh.castShadow = true;
        // Keep visible so it can cast shadows, but fully transparent
        this.shadowMesh.visible = true;
    }
    
    update(deltaTime, input) {
        // Debug: Track position changes
        const oldX = this.position.x;
        
        this.updateMovement(input, deltaTime);
        
        // Check if updateMovement changed position significantly
        if (Math.abs(this.position.x - oldX) > 5) {
            logger.warn(LogCategory.PLAYER, 'Position changed significantly in updateMovement', {
                previousX: oldX,
                currentX: this.position.x,
                delta: this.position.x - oldX
            });
        }
        
        this.updateRage(deltaTime, input);
        this.camera.position.copy(this.position);
        
        if (this.velocity.length() > 0.1) {
            this.bobAmount += this.bobSpeed;
            const bobOffset = Math.sin(this.bobAmount * Math.PI * 2) * 0.05;
            this.camera.position.y = this.position.y + bobOffset;
        } else {
            this.bobAmount = 0;
            this.camera.position.y = this.position.y;
        }
        
        // Update shadow mesh position to follow player
        if (this.shadowMesh) {
            this.shadowMesh.position.copy(this.position);
            this.shadowMesh.position.y = 0.8; // Keep centered height
        }
        
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
    
    updateRage(deltaTime, input) {
        // Update rage mode timer
        if (this.isRaging) {
            this.rageTimer -= deltaTime;
            if (this.rageTimer <= 0) {
                this.endRage();
            }
        } else {
            // Decay rage when not in rage mode
            if (this.rage > 0) {
                this.rage = Math.max(0, this.rage - this.rageDecayRate * deltaTime);
            }
        }
        
        // Activate rage mode when meter is full and R is pressed
        if (input.rage && this.rage >= this.maxRage && !this.isRaging) {
            this.activateRage();
        }
    }
    
    buildRage(amount) {
        if (!this.isRaging) {
            this.rage = Math.min(this.maxRage, this.rage + amount);
        }
    }
    
    activateRage() {
        this.isRaging = true;
        this.rageTimer = this.rageDuration;
        this.rage = 0; // Reset rage meter
        
        // Temporary buffs during rage
        this.moveSpeed *= GAME_CONFIG.PLAYER.RAGE.SPEED_BOOST;
        
        // Visual/audio feedback would go here
        this.playRageSound();
    }
    
    endRage() {
        this.isRaging = false;
        this.rageTimer = 0;
        
        // Remove buffs
        this.moveSpeed /= GAME_CONFIG.PLAYER.RAGE.SPEED_BOOST;
    }
    
    playRageSound() {
        if (AudioManager && AudioManager.playRageSound) {
            AudioManager.playRageSound();
        }
    }
    
    updateMovement(input, deltaTime) {
        // Debug: Track if this method changes position
        const startX = this.position.x;
        
        const moveVector = new THREE.Vector3();
        
        // Get forward and right vectors based on camera yaw
        const forward = new THREE.Vector3(
            -Math.sin(this.yaw),
            0,
            -Math.cos(this.yaw)
        );
        const right = new THREE.Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        );
        
        // Apply input to movement vector
        if (input.forward) {
            moveVector.add(forward);
        }
        if (input.backward) {
            moveVector.sub(forward);
        }
        if (input.left) {
            moveVector.sub(right);
        }
        if (input.right) {
            moveVector.add(right);
        }
        
        // Normalize and apply speed
        if (moveVector.length() > 0) {
            moveVector.normalize();
            const speed = input.sprint ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
            moveVector.multiplyScalar(speed);
        }
        
        // Apply to velocity with friction
        this.velocity.x = this.velocity.x * this.friction + moveVector.x * (1 - this.friction);
        this.velocity.z = this.velocity.z * this.friction + moveVector.z * (1 - this.friction);
        
        // Don't update position here - let collision system handle it
    }
    
    applyMouseLook(deltaX, deltaY) {
        this.yaw -= deltaX * this.mouseSensitivity;
        this.pitch -= deltaY * this.mouseSensitivity;
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    }
    
    takeDamage(amount, source = "Unknown") {
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, amount * 0.5);
            this.armor -= armorAbsorb;
            amount -= armorAbsorb;
        }
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        logPlayerAction('Took damage', {
            amount: amount.toFixed(1),
            source,
            health: this.health.toFixed(1),
            maxHealth: this.maxHealth
        });
        
        // If player died, log what killed them
        if (this.health <= 0) {
            logger.critical(LogCategory.PLAYER, `Player killed by ${source}`, {
                finalDamage: amount.toFixed(1),
                source
            });
        }
        
        // Notify game for UI/FX
        if (this.game && typeof this.game.queuePlayerDamage === 'function') {
            this.game.queuePlayerDamage(amount);
        }
        
        // Trigger low health narrative
        if (this.health < 30 && this.health > 0) {
            if (this.game && this.game.narrativeSystem) {
                this.game.narrativeSystem.onLowHealth();
            }
        }
        
        // Return actual damage taken for feedback
        return amount;
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    addArmor(amount) {
        this.armor = Math.min(this.maxArmor, this.armor + amount);
    }
    
    addAmmo(type, amount) {
        if (this.ammo[type] !== undefined) {
            this.ammo[type] = Math.min(this.maxAmmo[type], this.ammo[type] + amount);
        }
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            this.currentWeapon = this.weapons[index];
            return true;
        }
        return false;
    }

    getForwardVector() {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(new THREE.Euler(0, this.yaw, 0));
        return forward;
    }
}

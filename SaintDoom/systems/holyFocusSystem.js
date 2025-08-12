import * as THREE from 'three';
// Holy Focus System
// Switch between different divine aspects for varied combat approaches

export class HolyFocusSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        
        // Current focus
        this.currentFocus = 'righteousFury'; // Default stance
        this.focusSwitchCooldown = 2000; // 2 seconds between switches
        this.lastSwitchTime = 0;
        
        // Focus definitions
        this.focuses = {
            righteousFury: {
                name: "Righteous Fury",
                color: 0xff0000,
                description: "Offensive stance with increased damage and attack speed",
                effects: {
                    damageMultiplier: 1.5,
                    attackSpeedMultiplier: 1.3,
                    movementSpeedMultiplier: 1.1,
                    defenseMultiplier: 0.8,
                    rageGenerationMultiplier: 1.2
                },
                passive: () => this.righteousFuryPassive(),
                onActivate: () => this.activateRighteousFury(),
                onDeactivate: () => this.deactivateRighteousFury()
            },
            divineProtection: {
                name: "Divine Protection",
                color: 0x00aaff,
                description: "Defensive stance with damage reduction and healing aura",
                effects: {
                    damageMultiplier: 0.8,
                    attackSpeedMultiplier: 0.9,
                    movementSpeedMultiplier: 0.9,
                    defenseMultiplier: 1.5,
                    healingRate: 2 // HP per second
                },
                passive: () => this.divineProtectionPassive(),
                onActivate: () => this.activateDivineProtection(),
                onDeactivate: () => this.deactivateDivineProtection()
            },
            martyrdom: {
                name: "Martyrdom",
                color: 0xffaa00,
                description: "Balanced stance that builds rage faster through taking damage",
                effects: {
                    damageMultiplier: 1.0,
                    attackSpeedMultiplier: 1.0,
                    movementSpeedMultiplier: 1.0,
                    defenseMultiplier: 1.0,
                    rageOnDamageMultiplier: 3.0,
                    thornsPercent: 0.3 // Reflect 30% of melee damage
                },
                passive: () => this.martyrdomPassive(),
                onActivate: () => this.activateMartyrdom(),
                onDeactivate: () => this.deactivateMartyrdom()
            }
        };
        
        // Visual effects
        this.focusAura = null;
        this.focusParticles = null;
        this.healingAura = null;
        
        // Initialize with default focus
        this.activateFocus(this.currentFocus);
    }
    
    switchFocus(focusName) {
        // Check if focus exists
        if (!this.focuses[focusName]) return false;
        
        // Check cooldown
        const now = Date.now();
        if (now - this.lastSwitchTime < this.focusSwitchCooldown) {
            const remainingTime = ((this.focusSwitchCooldown - (now - this.lastSwitchTime)) / 1000).toFixed(1);
            if (this.player.game && this.player.game.narrativeSystem) {
                this.player.game.narrativeSystem.displaySubtitle(
                    `Focus switch on cooldown (${remainingTime}s remaining)`
                );
            }
            return false;
        }
        
        // Deactivate current focus
        const currentFocusData = this.focuses[this.currentFocus];
        if (currentFocusData.onDeactivate) {
            currentFocusData.onDeactivate();
        }
        
        // Switch to new focus
        this.currentFocus = focusName;
        this.lastSwitchTime = now;
        this.activateFocus(focusName);
        
        // Notify player
        if (this.player.game && this.player.game.narrativeSystem) {
            this.player.game.narrativeSystem.displaySubtitle(
                `Focus changed: ${this.focuses[focusName].name}`
            );
        }
        
        return true;
    }
    
    cycleFocus() {
        // Cycle through focuses in order
        const focusKeys = Object.keys(this.focuses);
        const currentIndex = focusKeys.indexOf(this.currentFocus);
        const nextIndex = (currentIndex + 1) % focusKeys.length;
        this.switchFocus(focusKeys[nextIndex]);
    }
    
    activateFocus(focusName) {
        const focus = this.focuses[focusName];
        if (!focus) return;
        
        // Apply stat modifiers to player
        this.applyFocusEffects(focus.effects);
        
        // Create visual effects
        this.createFocusVisuals(focus.color);
        
        // Call focus-specific activation
        if (focus.onActivate) {
            focus.onActivate();
        }
    }
    
    applyFocusEffects(effects) {
        // Apply multipliers to player stats
        if (this.player) {
            // Store base values if not already stored
            if (!this.player.baseStats) {
                this.player.baseStats = {
                    damage: this.player.damage || 25,
                    attackSpeed: this.player.attackSpeed || 1,
                    moveSpeed: this.player.moveSpeed || 10,
                    defense: this.player.defense || 1
                };
            }
            
            // Apply multipliers
            if (effects.damageMultiplier !== undefined) {
                this.player.damage = this.player.baseStats.damage * effects.damageMultiplier;
            }
            if (effects.attackSpeedMultiplier !== undefined) {
                this.player.attackSpeed = this.player.baseStats.attackSpeed * effects.attackSpeedMultiplier;
            }
            if (effects.movementSpeedMultiplier !== undefined) {
                this.player.moveSpeed = this.player.baseStats.moveSpeed * effects.movementSpeedMultiplier;
            }
            if (effects.defenseMultiplier !== undefined) {
                this.player.defense = this.player.baseStats.defense * effects.defenseMultiplier;
            }
        }
    }
    
    createFocusVisuals(color) {
        // Remove existing visuals
        this.removeFocusVisuals();
        
        // Create aura effect
        const auraGeometry = new THREE.CylinderGeometry(0.5, 1, 2, 8, 1, true);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        this.focusAura = new THREE.Mesh(auraGeometry, auraMaterial);
        this.scene.add(this.focusAura);
        
        // Create particle system
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const colorObj = new THREE.Color(color);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            colors[i * 3] = colorObj.r;
            colors[i * 3 + 1] = colorObj.g;
            colors[i * 3 + 2] = colorObj.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.focusParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.focusParticles);
    }
    
    removeFocusVisuals() {
        if (this.focusAura) {
            this.scene.remove(this.focusAura);
            this.focusAura = null;
        }
        if (this.focusParticles) {
            this.scene.remove(this.focusParticles);
            this.focusParticles = null;
        }
    }
    
    // Righteous Fury specific methods
    activateRighteousFury() {
        // Create flame effect
        this.createFlameEffect();
    }
    
    deactivateRighteousFury() {
        // Clean up flame effect
        this.removeFlameEffect();
    }
    
    righteousFuryPassive() {
        // Chance for critical strikes
        if (Math.random() < 0.15) { // 15% crit chance
            return 2.0; // Double damage
        }
        return 1.0;
    }
    
    createFlameEffect() {
        // Add flame particles around weapon
        // This would be more detailed in production
    }
    
    removeFlameEffect() {
        // Remove flame particles
    }
    
    // Divine Protection specific methods
    activateDivineProtection() {
        // Create healing aura visual
        const auraGeometry = new THREE.RingGeometry(2, 3, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.healingAura = new THREE.Mesh(auraGeometry, auraMaterial);
        this.healingAura.rotation.x = -Math.PI / 2;
        this.scene.add(this.healingAura);
        
        // Start healing timer
        this.startHealingTimer();
    }
    
    deactivateDivineProtection() {
        if (this.healingAura) {
            this.scene.remove(this.healingAura);
            this.healingAura = null;
        }
        
        // Stop healing timer
        this.stopHealingTimer();
    }
    
    divineProtectionPassive() {
        // Damage reduction is already applied through defense multiplier
        // This could add additional effects like stun immunity
    }
    
    startHealingTimer() {
        this.healingInterval = setInterval(() => {
            if (this.player && this.player.health < this.player.maxHealth) {
                const healAmount = this.focuses.divineProtection.effects.healingRate;
                this.player.heal(healAmount);
                
                // Visual feedback
                this.createHealParticle();
            }
        }, 1000); // Every second
    }
    
    stopHealingTimer() {
        if (this.healingInterval) {
            clearInterval(this.healingInterval);
            this.healingInterval = null;
        }
    }
    
    createHealParticle() {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 4, 4),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 1
            })
        );
        
        particle.position.copy(this.player.position);
        particle.position.y += 2;
        this.scene.add(particle);
        
        // Animate upward
        const animateHeal = () => {
            particle.position.y += 0.05;
            particle.material.opacity -= 0.02;
            
            if (particle.material.opacity > 0) {
                requestAnimationFrame(animateHeal);
            } else {
                this.scene.remove(particle);
            }
        };
        animateHeal();
    }
    
    // Martyrdom specific methods
    activateMartyrdom() {
        // Create thorns visual effect
        this.createThornsEffect();
        
        // Enable damage-to-rage conversion
        this.player.martyrdomActive = true;
    }
    
    deactivateMartyrdom() {
        this.removeThornsEffect();
        this.player.martyrdomActive = false;
    }
    
    martyrdomPassive() {
        // Reflect damage is handled in player damage calculation
    }
    
    createThornsEffect() {
        // Create spiky aura around player
        const thornsGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
        const thornsMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.5
        });
        
        this.thorns = [];
        for (let i = 0; i < 8; i++) {
            const thorn = new THREE.Mesh(thornsGeometry, thornsMaterial);
            const angle = (i / 8) * Math.PI * 2;
            thorn.position.x = Math.cos(angle) * 0.7;
            thorn.position.z = Math.sin(angle) * 0.7;
            thorn.rotation.z = angle;
            this.thorns.push(thorn);
        }
    }
    
    removeThornsEffect() {
        if (this.thorns) {
            this.thorns.forEach(thorn => {
                if (thorn.parent) {
                    thorn.parent.remove(thorn);
                }
            });
            this.thorns = [];
        }
    }
    
    update(deltaTime) {
        // Update visual effects positions
        if (this.player && this.player.position) {
            if (this.focusAura) {
                this.focusAura.position.copy(this.player.position);
                this.focusAura.position.y += 1;
                this.focusAura.rotation.y += deltaTime * 2;
            }
            
            if (this.focusParticles) {
                const positions = this.focusParticles.geometry.attributes.position.array;
                const time = Date.now() * 0.001;
                
                for (let i = 0; i < positions.length / 3; i++) {
                    const angle = (time + i * 0.2) % (Math.PI * 2);
                    const radius = 0.5 + Math.sin(time * 2 + i) * 0.3;
                    const height = Math.sin(time * 3 + i * 0.5) * 0.5;
                    
                    positions[i * 3] = this.player.position.x + Math.cos(angle) * radius;
                    positions[i * 3 + 1] = this.player.position.y + 1 + height;
                    positions[i * 3 + 2] = this.player.position.z + Math.sin(angle) * radius;
                }
                
                this.focusParticles.geometry.attributes.position.needsUpdate = true;
            }
            
            if (this.healingAura) {
                this.healingAura.position.copy(this.player.position);
                this.healingAura.position.y = 0.1;
                this.healingAura.rotation.z += deltaTime;
                
                // Pulse effect
                const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 1;
                this.healingAura.scale.set(pulse, pulse, 1);
            }
            
            if (this.thorns) {
                this.thorns.forEach((thorn, i) => {
                    if (!thorn.parent && this.player.camera) {
                        this.player.camera.add(thorn);
                    }
                    thorn.rotation.y = Date.now() * 0.001 + i;
                });
            }
        }
        
        // Call passive effects
        const focus = this.focuses[this.currentFocus];
        if (focus && focus.passive) {
            focus.passive();
        }
    }
    
    onPlayerTakeDamage(damage) {
        // Handle focus-specific damage reactions
        const focus = this.focuses[this.currentFocus];
        
        if (this.currentFocus === 'martyrdom') {
            // Generate extra rage from damage
            if (this.player.holyRageSystem) {
                const rageAmount = damage * focus.effects.rageOnDamageMultiplier;
                this.player.holyRageSystem.addRage(rageAmount);
            }
            
            // Return thorns damage
            return damage * focus.effects.thornsPercent;
        } else if (this.currentFocus === 'divineProtection') {
            // Damage is already reduced via defense multiplier
            // Could add additional effects here
        }
        
        return 0; // No reflected damage for other focuses
    }
    
    getCurrentFocus() {
        return this.focuses[this.currentFocus];
    }
    
    getFocusName() {
        return this.focuses[this.currentFocus].name;
    }
}
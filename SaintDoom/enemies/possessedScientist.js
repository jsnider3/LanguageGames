// Possessed Scientist Enemy Type
// Former MIB researchers corrupted by demonic influence

import { Enemy } from '../enemy.js';

export class PossessedScientist extends Enemy {
    constructor(scene, position) {
        // Call parent constructor first
        super(scene, position);
        
        // Override with PossessedScientist-specific stats
        this.health = 50;
        this.maxHealth = 50;
        this.moveSpeed = 2.5;  // Slightly faster for better pursuit
        this.damage = 10;
        this.attackRange = 2;
        this.sightRange = 25;  // Increased to see across chapel
        this.type = 'possessed_scientist';
        
        // Override the mesh created by parent
        this.scene.remove(this.mesh);
        this.createPossessedScientistMesh();
        
        // AI properties
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000;
        this.wanderAngle = Math.random() * Math.PI * 2;
        
        // Death dialogue
        this.deathPhrases = [
            "The stars... were wrong...",
            "Thank... you...",
            "Free... at last...",
            "God forgive us...",
            "We opened... the door..."
        ];
        
        // Possession effects
        this.possessionLevel = Math.random(); // 0-1, affects behavior
        this.lastTwitchTime = 0;
        this.twitchInterval = 2000 + Math.random() * 3000;
    }
    
    createPossessedScientistMesh() {
        // Body - lab coat stained with blood
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            emissive: 0x110000,
            emissiveIntensity: 0.2
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.6;
        
        // Head - distorted human face
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x808060,
            emissive: 0x220000,
            emissiveIntensity: 0.3
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.y = 1.5;
        
        // Eyes - glowing demonic red
        const eyeGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000
        });
        
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.08, 1.5, 0.15);
        
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.08, 1.5, 0.15);
        
        // Group mesh
        this.mesh = new THREE.Group();
        this.mesh.add(this.bodyMesh);
        this.mesh.add(this.headMesh);
        this.mesh.add(this.leftEye);
        this.mesh.add(this.rightEye);
        this.mesh.position.copy(this.position);
        
        // Add blood stains (decals)
        this.addBloodStains();
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Shadow
        this.bodyMesh.castShadow = true;
        this.headMesh.castShadow = true;
    }
    
    addBloodStains() {
        // Add random blood splatter textures
        const bloodGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const bloodMaterial = new THREE.MeshBasicMaterial({
            color: 0x660000,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 3; i++) {
            const blood = new THREE.Mesh(bloodGeometry, bloodMaterial);
            blood.position.set(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 1.2,
                0.31
            );
            blood.rotation.z = Math.random() * Math.PI;
            this.bodyMesh.add(blood);
        }
    }
    
    update(deltaTime, player) {
        // Always call parent update first to handle death state properly
        super.update(deltaTime, player);
        
        // Exit if dead after parent has handled it
        if (this.isDead || this.state === 'dead') return;
        
        // PossessedScientist-specific behavior
        const distanceToPlayer = this.position.distanceTo(player.position);
        
        // Possession twitch effect
        const now = Date.now();
        if (now - this.lastTwitchTime > this.twitchInterval) {
            this.twitch();
            this.lastTwitchTime = now;
        }
        
        // Handle custom states that parent doesn't know about
        if (this.state === 'pursuing') {
            this.handlePursuingState(distanceToPlayer, player, deltaTime);
        } else if (this.state === 'wandering') {
            this.handleWanderingState(deltaTime);
        }
        
        // Override parent's lookAt behavior for PossessedScientist
        if (this.state === 'chasing' || this.state === 'attacking' || this.state === 'pursuing') {
            const lookDirection = new THREE.Vector3()
                .subVectors(player.position, this.position)
                .normalize();
            this.mesh.rotation.y = Math.atan2(lookDirection.x, lookDirection.z);
        }
    }
    
    // Override parent's updateIdle to use 'chasing' state and add wandering behavior
    updateIdle(deltaTime) {
        const distanceToPlayer = this.target ? this.position.distanceTo(this.target.position) : Infinity;
        
        if (distanceToPlayer < this.sightRange && this.canSeePlayer()) {
            this.state = 'chasing';  // Use standard chasing state for consistency
            // Emit detection sound/animation
            this.onPlayerDetected();
        } else {
            // Set velocity to zero when idle
            this.velocity.set(0, 0, 0);
            
            // Randomly start wandering
            if (Math.random() < 0.01) {
                this.state = 'wandering';
                this.wanderAngle = Math.random() * Math.PI * 2;
            }
        }
    }
    
    handlePursuingState(distanceToPlayer, player, deltaTime) {
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'attacking';
        } else if (distanceToPlayer > this.sightRange * 2) {  // More forgiving pursuit range
            this.state = 'idle';
            this.target = null;
        } else {
            // Move toward player
            const direction = new THREE.Vector3()
                .subVectors(player.position, this.position);
            
            // Check for valid direction
            if (direction.length() > 0.001) {
                direction.normalize();
                
                // Erratic movement based on possession level
                const erraticOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * this.possessionLevel,
                    0,
                    (Math.random() - 0.5) * this.possessionLevel
                );
                
                direction.add(erraticOffset);
                if (direction.length() > 0.001) {
                    direction.normalize();
                    
                    // Update velocity for collision system
                    this.velocity.x = direction.x * this.moveSpeed;
                    this.velocity.z = direction.z * this.moveSpeed;
                    
                    // Validate before applying movement
                    const newX = this.position.x + this.velocity.x * deltaTime;
                    const newZ = this.position.z + this.velocity.z * deltaTime;
                    
                    if (!isNaN(newX) && !isNaN(newZ)) {
                        this.position.x = newX;
                        this.position.z = newZ;
                    }
                }
            }
        }
    }
    
    handleAttackingState(distanceToPlayer, player) {
        const now = Date.now();
        const heightDifference = Math.abs(this.position.y - player.position.y);
        
        // Check both horizontal distance and height
        if (distanceToPlayer > this.attackRange || heightDifference > 1.0) {
            this.state = 'pursuing';
        } else if (now - this.lastAttackTime > this.attackCooldown) {
            // Stop moving when attacking
            this.velocity.set(0, 0, 0);
            this.performAttack(player);
            this.lastAttackTime = now;
        }
    }
    
    handleWanderingState(deltaTime) {
        // Wander randomly
        const wanderDirection = new THREE.Vector3(
            Math.cos(this.wanderAngle),
            0,
            Math.sin(this.wanderAngle)
        );
        
        // Update velocity for collision system
        this.velocity.x = wanderDirection.x * this.moveSpeed * 0.5;
        this.velocity.z = wanderDirection.z * this.moveSpeed * 0.5;
        
        // Validate before applying movement
        const newX = this.position.x + this.velocity.x * deltaTime;
        const newZ = this.position.z + this.velocity.z * deltaTime;
        
        if (!isNaN(newX) && !isNaN(newZ)) {
            this.position.x = newX;
            this.position.z = newZ;
        }
        
        // Occasionally change direction
        if (Math.random() < 0.02) {
            this.wanderAngle += (Math.random() - 0.5) * Math.PI * 0.5;
            
            // Small chance to return to idle
            if (Math.random() < 0.1) {
                this.state = 'idle';
            }
        }
    }
    
    canSeePlayer(player) {
        // Simple line of sight check
        // In a full implementation, this would do raycasting
        return true;
    }
    
    onPlayerDetected() {
        // Visual feedback for detection - brighten eyes
        const brightColor = 0xff6666;
        this.leftEye.material.color.setHex(brightColor);
        this.rightEye.material.color.setHex(brightColor);
        
        setTimeout(() => {
            this.leftEye.material.color.setHex(0xff0000);
            this.rightEye.material.color.setHex(0xff0000);
        }, 500);
        
        // TODO: Play detection sound
    }
    
    // Override parent's performAttack with PossessedScientist-specific visual effects
    performAttack() {
        // Use parent's attack logic
        super.performAttack();
        
        // PossessedScientist-specific visual feedback
        this.bodyMesh.material.emissiveIntensity = 0.5;
        setTimeout(() => {
            this.bodyMesh.material.emissiveIntensity = 0.2;
        }, 200);
        
        // TODO: Play attack sound
    }
    
    twitch() {
        // Possession twitch effect
        const twitchAmount = this.possessionLevel * 0.2;
        
        this.headMesh.rotation.z = (Math.random() - 0.5) * twitchAmount;
        this.headMesh.rotation.x = (Math.random() - 0.5) * twitchAmount;
        
        setTimeout(() => {
            this.headMesh.rotation.z = 0;
            this.headMesh.rotation.x = 0;
        }, 100);
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Holy damage is more effective
        if (damageType === 'holy') {
            damage *= 1.5;
        }
        
        // Use parent's takeDamage method
        super.takeDamage(damage);
    }
    
    onDeath() {
        // Call parent's onDeath method first for consistent death handling
        super.onDeath();
        
        // PossessedScientist-specific death behavior
        // Death phrase
        const phrase = this.deathPhrases[Math.floor(Math.random() * this.deathPhrases.length)];
        this.showDeathText(phrase);
        
        // Emit holy particles (soul released)
        this.emitSoulParticles();
    }
    
    showDeathText(text) {
        // Create floating text above corpse
        // This would integrate with the game's UI system
        // TODO: Add actual floating text UI element
    }
    
    emitSoulParticles() {
        // Create ascending white particles representing released soul
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({ 
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            particle.position.copy(this.position);
            particle.position.y += 1;
            this.scene.add(particle);
            
            // Animate particle ascending
            const startY = particle.position.y;
            const animateParticle = setInterval(() => {
                particle.position.y += 0.05;
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity <= 0) {
                    clearInterval(animateParticle);
                    this.scene.remove(particle);
                }
            }, 16);
        }
    }
    
    applyKnockback(force) {
        // Override parent method to add stun effect
        // Call parent's applyKnockback
        super.applyKnockback(force);
        
        // Stun briefly
        const previousState = this.state;
        this.state = 'stunned';
        
        setTimeout(() => {
            if (this.state === 'stunned' && !this.isDead) {
                this.state = previousState;
            }
        }, 300);
    }
    
    destroy() {
        // Clean up when enemy is removed
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}
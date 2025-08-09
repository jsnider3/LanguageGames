export class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        // Stats
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 10;
        this.moveSpeed = 2;
        this.attackRange = 2;
        this.attackCooldown = 1.5; // seconds
        this.lastAttackTime = 0;
        
        // AI state
        this.state = 'idle'; // idle, chasing, attacking, hurt, dead
        this.sightRange = 15;
        this.hearingRange = 20;
        this.target = null;
        
        // Physics
        this.radius = 0.3;
        this.height = 1.8;
        
        // Visual
        this.createMesh();
        
        // Animation
        this.bobAmount = 0;
        this.hurtTime = 0;
    }
    
    createMesh() {
        // Create a simple possessed scientist model
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444, // Dark grey lab coat
            roughness: 0.8
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.6;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        group.add(this.bodyMesh);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x88aa88, // Sickly green skin
            roughness: 0.6,
            emissive: 0x002200,
            emissiveIntensity: 0.2
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.y = 1.4;
        this.headMesh.castShadow = true;
        group.add(this.headMesh);
        
        // Glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.07, 1.4, -0.15);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.07, 1.4, -0.15);
        group.add(rightEye);
        
        // Arms (simple cylinders)
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.35, 0.6, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.35, 0.6, 0);
        rightArm.castShadow = true;
        group.add(rightArm);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }
    
    update(deltaTime, player) {
        if (this.health <= 0) {
            this.state = 'dead';
            return;
        }
        
        this.target = player;
        
        // Update AI based on state
        switch(this.state) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'chasing':
                this.updateChasing(deltaTime);
                break;
            case 'attacking':
                this.updateAttacking(deltaTime);
                break;
            case 'hurt':
                this.updateHurt(deltaTime);
                break;
        }
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Make enemy face player when chasing or attacking
        if ((this.state === 'chasing' || this.state === 'attacking') && this.target) {
            const direction = new THREE.Vector3()
                .subVectors(this.target.position, this.position)
                .normalize();
            this.mesh.lookAt(this.target.position);
            this.mesh.rotation.x = 0; // Keep upright
            this.mesh.rotation.z = 0;
        }
        
        // Bob animation when moving
        if (this.velocity.length() > 0.1) {
            this.bobAmount += deltaTime * 8;
            const bobOffset = Math.sin(this.bobAmount) * 0.05;
            this.mesh.position.y = this.position.y + bobOffset;
        }
        
        // Hurt flash effect
        if (this.hurtTime > 0) {
            this.hurtTime -= deltaTime;
            const flashIntensity = Math.sin(this.hurtTime * 20) * 0.5 + 0.5;
            this.bodyMesh.material.emissive = new THREE.Color(flashIntensity, 0, 0);
            this.bodyMesh.material.emissiveIntensity = flashIntensity;
        } else {
            this.bodyMesh.material.emissive = new THREE.Color(0, 0, 0);
            this.bodyMesh.material.emissiveIntensity = 0;
        }
    }
    
    updateIdle(deltaTime) {
        // Check if player is in sight range
        if (this.canSeePlayer()) {
            this.state = 'chasing';
        }
    }
    
    updateChasing(deltaTime) {
        if (!this.target) return;
        
        const distance = this.position.distanceTo(this.target.position);
        
        // Check if in attack range
        if (distance <= this.attackRange) {
            this.state = 'attacking';
            return;
        }
        
        // Check if lost sight
        if (distance > this.sightRange && !this.canSeePlayer()) {
            this.state = 'idle';
            return;
        }
        
        // Move toward player
        const direction = new THREE.Vector3()
            .subVectors(this.target.position, this.position)
            .normalize();
        
        direction.y = 0; // Keep on ground
        
        this.velocity = direction.multiplyScalar(this.moveSpeed);
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }
    
    updateAttacking(deltaTime) {
        if (!this.target) return;
        
        const now = Date.now() / 1000;
        const distance = this.position.distanceTo(this.target.position);
        
        // Check if out of range
        if (distance > this.attackRange) {
            this.state = 'chasing';
            return;
        }
        
        // Attack if cooldown is ready
        if (now - this.lastAttackTime >= this.attackCooldown) {
            this.performAttack();
            this.lastAttackTime = now;
        }
        
        // Stop moving while attacking
        this.velocity.set(0, 0, 0);
    }
    
    updateHurt(deltaTime) {
        // Brief stun when hurt
        this.hurtTime -= deltaTime;
        if (this.hurtTime <= 0) {
            this.state = 'chasing';
        }
    }
    
    canSeePlayer() {
        if (!this.target) return false;
        
        const distance = this.position.distanceTo(this.target.position);
        if (distance > this.sightRange) return false;
        
        // Simple line of sight check (could add raycasting for walls later)
        return true;
    }
    
    performAttack() {
        if (!this.target) return;
        
        // Simple melee attack
        const distance = this.position.distanceTo(this.target.position);
        if (distance <= this.attackRange) {
            this.target.takeDamage(this.damage);
            
            // Visual feedback - lunge forward
            const lungeDirection = new THREE.Vector3()
                .subVectors(this.target.position, this.position)
                .normalize();
            
            this.position.add(lungeDirection.multiplyScalar(0.2));
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        if (this.health > 0) {
            // Enter hurt state
            this.state = 'hurt';
            this.hurtTime = 0.3; // Stun duration
            
            // Flash red
            this.bodyMesh.material.emissive = new THREE.Color(1, 0, 0);
            this.bodyMesh.material.emissiveIntensity = 1;
        } else {
            this.onDeath();
        }
    }
    
    applyKnockback(force) {
        // Apply knockback force
        this.position.add(force);
        
        // Also push the velocity for smoother movement
        this.velocity.add(force.multiplyScalar(0.5));
    }
    
    onDeath() {
        this.state = 'dead';
        
        // Death animation - fall over
        if (this.mesh) {
            const fallAnimation = () => {
                if (this.mesh.rotation.x < Math.PI / 2) {
                    this.mesh.rotation.x += 0.1;
                    this.mesh.position.y -= 0.02;
                    requestAnimationFrame(fallAnimation);
                }
            };
            fallAnimation();
        }
        
        // Spawn death particles
        this.createDeathParticles();
    }
    
    createDeathParticles() {
        // Create blood/demon essence particles
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0x880000 : 0x004400, // Mix of red and green
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.position);
            particle.position.y += 0.5;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 5,
                (Math.random() - 0.5) * 5
            );
            
            this.scene.add(particle);
            
            // Animate particle
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.2; // Gravity
                
                particle.material.opacity -= 0.02;
                
                if (particle.material.opacity > 0 && particle.position.y > -1) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            
            animateParticle();
        }
    }
    
    destroy() {
        // Remove from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}
export class MeleeCombat {
    constructor(player, scene) {
        this.player = player;
        this.scene = scene;
        
        // Sword properties
        this.swordReach = 3;
        this.swingArc = 90 * Math.PI / 180; // 90 degrees in radians
        this.swingTime = 0.3;
        this.swingCooldown = 0.5;
        this.lastSwingTime = 0;
        
        // Combo system
        this.comboDamage = [50, 75, 100];
        this.currentCombo = 0;
        this.comboResetTime = 1000; // ms
        
        // Block/parry
        this.isBlocking = false;
        this.blockStartTime = 0;
        this.parryWindow = 200; // ms for perfect parry
        this.blockDamageReduction = 0.5;
        
        // Visual elements
        this.createSwordModel();
        this.swingAnimation = null;
    }
    
    createSwordModel() {
        // Create a simple sword mesh
        const swordGeometry = new THREE.BoxGeometry(0.1, 0.1, 1.5);
        const swordMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x444444,
            emissiveIntensity: 0.2
        });
        
        this.swordMesh = new THREE.Mesh(swordGeometry, swordMaterial);
        this.swordMesh.castShadow = true;
        this.swordMesh.receiveShadow = true;
        
        // Position sword relative to camera
        this.scene.add(this.swordMesh);
        this.updateSwordPosition();
    }
    
    updateSwordPosition() {
        if (!this.swordMesh) return;
        
        // Position sword to the right side of the screen
        const camera = this.player.camera;
        this.swordMesh.position.copy(camera.position);
        
        // Offset to the right and slightly forward
        const right = this.player.getRightVector();
        const forward = this.player.getForwardVector();
        
        this.swordMesh.position.add(right.multiplyScalar(0.5));
        this.swordMesh.position.add(forward.multiplyScalar(0.5));
        this.swordMesh.position.y -= 0.3;
        
        // Rotate sword
        this.swordMesh.rotation.copy(camera.rotation);
        this.swordMesh.rotateZ(-Math.PI / 6); // Tilt sword
    }
    
    performSwing(enemies) {
        const now = Date.now();
        
        // Check cooldown
        if (now - this.lastSwingTime < this.swingCooldown * 1000) {
            return [];
        }
        
        // Reset combo if too much time passed
        if (now - this.lastSwingTime > this.comboResetTime) {
            this.currentCombo = 0;
        }
        
        // Create hit detection area
        const hits = this.checkMeleeHits(enemies);
        
        // Apply damage to hit enemies
        hits.forEach(enemy => {
            const damage = this.comboDamage[this.currentCombo];
            enemy.takeDamage(damage);
            
            // Apply knockback
            const knockbackForce = this.player.getForwardVector().multiplyScalar((this.currentCombo + 1) * 2);
            enemy.applyKnockback(knockbackForce);
            
            // Heal on kill
            if (enemy.health <= 0) {
                this.player.heal(10);
                this.createHealParticles();
            }
        });
        
        // Advance combo
        this.currentCombo = (this.currentCombo + 1) % this.comboDamage.length;
        this.lastSwingTime = now;
        
        // Play swing animation
        this.playSwingAnimation();
        
        return hits;
    }
    
    checkMeleeHits(enemies) {
        const hits = [];
        const playerPos = this.player.position.clone();
        const forward = this.player.getForwardVector();
        
        enemies.forEach(enemy => {
            // Get vector from player to enemy
            const toEnemy = enemy.position.clone().sub(playerPos);
            toEnemy.y = 0; // Ignore vertical difference for arc check
            
            const distance = toEnemy.length();
            
            // Check if enemy is within reach
            if (distance <= this.swordReach) {
                // Check if enemy is within swing arc
                const angle = forward.angleTo(toEnemy.normalize());
                
                if (angle <= this.swingArc / 2) {
                    hits.push(enemy);
                }
            }
        });
        
        return hits;
    }
    
    performBlock() {
        if (!this.isBlocking) {
            this.isBlocking = true;
            this.blockStartTime = Date.now();
            
            // Visual feedback - raise sword
            if (this.swordMesh) {
                this.swordMesh.rotateX(Math.PI / 4);
            }
        }
    }
    
    stopBlocking() {
        this.isBlocking = false;
        this.updateSwordPosition(); // Reset sword position
    }
    
    isParrying() {
        if (!this.isBlocking) return false;
        
        const now = Date.now();
        return (now - this.blockStartTime) <= this.parryWindow;
    }
    
    playSwingAnimation() {
        // Cancel any existing animation
        if (this.swingAnimation) {
            cancelAnimationFrame(this.swingAnimation);
        }
        
        const startTime = Date.now();
        const swingDuration = this.swingTime * 1000;
        const startRotation = this.swordMesh.rotation.z;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / swingDuration, 1);
            
            // Swing arc animation
            const swingAngle = Math.sin(progress * Math.PI) * Math.PI / 2;
            this.swordMesh.rotation.z = startRotation - swingAngle;
            
            // Update sword position during swing
            this.updateSwordPosition();
            
            if (progress < 1) {
                this.swingAnimation = requestAnimationFrame(animate);
            } else {
                this.swingAnimation = null;
                this.updateSwordPosition(); // Reset position
            }
        };
        
        animate();
    }
    
    createHealParticles() {
        // Create glowing particles when healing from kills
        const particleCount = 10;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(this.player.position);
            particle.position.x += (Math.random() - 0.5) * 2;
            particle.position.y += Math.random() * 2;
            particle.position.z += (Math.random() - 0.5) * 2;
            
            this.scene.add(particle);
            particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    Math.random() * 0.2,
                    (Math.random() - 0.5) * 0.1
                ),
                lifetime: 1000,
                created: Date.now()
            });
        }
        
        // Animate particles
        const animateParticles = () => {
            const now = Date.now();
            
            particles.forEach((particle, index) => {
                const age = now - particle.created;
                
                if (age > particle.lifetime) {
                    this.scene.remove(particle.mesh);
                    particles.splice(index, 1);
                } else {
                    // Update position
                    particle.mesh.position.add(particle.velocity);
                    particle.velocity.y -= 0.01; // Gravity
                    
                    // Fade out
                    particle.mesh.material.opacity = 1 - (age / particle.lifetime);
                }
            });
            
            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    update(deltaTime) {
        // Update sword position to follow camera
        this.updateSwordPosition();
        
        // Check if still blocking
        if (this.isBlocking && !this.player.isBlocking) {
            this.stopBlocking();
        }
    }
}
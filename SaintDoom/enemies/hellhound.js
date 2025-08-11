import { Enemy } from '../enemy.js';
import { GAME_CONFIG } from '../modules/GameConfig.js';
import { AudioManager } from '../modules/Utils.js';

export class Hellhound extends Enemy {
    constructor(scene, position) {
        // Call parent constructor first
        super(scene, position);
        
        // Override with Hellhound-specific stats
        const config = GAME_CONFIG.ENEMIES.HELLHOUND;
        this.health = config.HEALTH;
        this.maxHealth = config.HEALTH;
        this.damage = config.DAMAGE;
        this.moveSpeed = config.MOVE_SPEED;
        this.scoreValue = config.SCORE_VALUE;
        this.attackRange = config.ATTACK_RANGE;
        this.attackCooldown = config.ATTACK_COOLDOWN;
        this.sightRange = config.SIGHT_RANGE;
        
        // Hellhound-specific properties
        this.type = 'HELLHOUND';
        this.radius = 0.4;
        this.height = config.SIZE.HEIGHT;
        
        // Override the mesh created by parent
        this.scene.remove(this.mesh);
        this.createHellhoundMesh();
        
        // Hellhound-specific AI properties
        this.lastPosition = null;
        this.stuckCounter = 0;
        this.facingDirection = null;
    }
    
    createHellhoundMesh() {
        const config = GAME_CONFIG.ENEMIES.HELLHOUND;
        const group = new THREE.Group();
        
        // Body - lower to ground
        const bodyGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x220000,  // Dark red
            roughness: 0.9,
            emissive: 0x440000,
            emissiveIntensity: 0.3
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.3;
        this.bodyMesh.castShadow = true;
        group.add(this.bodyMesh);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.5);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x330000,
            roughness: 0.8
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.set(-0.5, 0.4, 0);
        group.add(this.headMesh);
        
        // Glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.6, 0.45, -0.15);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.6, 0.45, 0.15);
        group.add(rightEye);
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.6);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0.5, 0.3, 0);
        tail.rotation.z = Math.PI / 2;
        group.add(tail);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }
    
    update(deltaTime, player, walls) {
        // Use parent update for common behavior
        super.update(deltaTime, player);
        
        // Additional Hellhound-specific behavior
        if (this.state === 'dead') return;
        
        // Update rotation to face player (Hellhound-specific)
        if ((this.state === 'chasing' || this.state === 'attacking') && this.target) {
            // Create a target position at the same height as the enemy
            const lookTarget = new THREE.Vector3(
                this.target.position.x,
                this.position.y,  // Use enemy's Y position to keep level
                this.target.position.z
            );
            this.mesh.lookAt(lookTarget);
            // Hellhound model faces -X direction (head at x=-0.5), so rotate 90 degrees
            this.mesh.rotation.y += Math.PI / 2;
            // Keep the enemy upright
            this.mesh.rotation.x = 0;
            this.mesh.rotation.z = 0;
        }
        
        // Running animation (faster than base Enemy)
        if (this.velocity.length() > 0.1) {
            this.bobAmount += deltaTime * 12;  // Faster animation
            const bobOffset = Math.sin(this.bobAmount) * 0.1;
            this.mesh.position.y = this.position.y + Math.abs(bobOffset);
        }
        
        // Hurt flash with different color
        if (this.hurtTime > 0) {
            const flashIntensity = Math.sin(this.hurtTime * 20) * 0.5 + 0.5;
            this.bodyMesh.material.emissive = new THREE.Color(1, flashIntensity, flashIntensity);
        } else {
            this.bodyMesh.material.emissive = new THREE.Color(0.27, 0, 0);
        }
    }
    
    updateChasing(deltaTime, walls) {
        if (!this.target) return;
        
        const distance = this.position.distanceTo(this.target.position);
        
        if (distance <= this.attackRange) {
            this.state = 'attacking';
            return;
        }
        
        if (distance > this.sightRange) {
            this.state = 'idle';
            return;
        }
        
        // Calculate base direction toward player
        let direction = new THREE.Vector3()
            .subVectors(this.target.position, this.position)
            .normalize();
        
        direction.y = 0;
        
        // Store the facing direction for proper rotation (before modifications)
        this.facingDirection = direction.clone();
        
        // Check for walls in the path
        const nextPos = this.position.clone().add(direction.clone().multiplyScalar(this.moveSpeed * deltaTime));
        let wallInPath = false;
        
        if (walls) {
            for (let wall of walls) {
                if (this.pointIntersectsBox(nextPos, wall.min, wall.max, this.radius)) {
                    wallInPath = true;
                    break;
                }
            }
        }
        
        // If wall in path, try to move around it
        if (wallInPath) {
            // Try moving left or right
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            const leftDir = direction.clone().add(perpendicular.clone().multiplyScalar(0.7)).normalize();
            const rightDir = direction.clone().sub(perpendicular.clone().multiplyScalar(0.7)).normalize();
            
            // Check which direction is clearer
            const leftPos = this.position.clone().add(leftDir.clone().multiplyScalar(this.moveSpeed * deltaTime));
            const rightPos = this.position.clone().add(rightDir.clone().multiplyScalar(this.moveSpeed * deltaTime));
            
            let leftClear = true;
            let rightClear = true;
            
            for (let wall of walls) {
                if (this.pointIntersectsBox(leftPos, wall.min, wall.max, this.radius)) {
                    leftClear = false;
                }
                if (this.pointIntersectsBox(rightPos, wall.min, wall.max, this.radius)) {
                    rightClear = false;
                }
            }
            
            if (leftClear && !rightClear) {
                direction = leftDir;
            } else if (rightClear && !leftClear) {
                direction = rightDir;
            } else if (leftClear && rightClear) {
                // Choose randomly if both are clear
                direction = Math.random() > 0.5 ? leftDir : rightDir;
            } else {
                // Both blocked, try backing up
                direction.multiplyScalar(-1);
            }
        } else {
            // No wall, add zigzag movement for harder targeting (but still face player)
            const zigzag = Math.sin(Date.now() * 0.003) * 0.3;
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            direction.add(perpendicular.multiplyScalar(zigzag));
            direction.normalize();
        }
        
        // Store last position to detect if stuck
        if (!this.lastPosition) {
            this.lastPosition = this.position.clone();
            this.stuckCounter = 0;
        }
        
        // Check if stuck
        const moved = this.position.distanceTo(this.lastPosition);
        if (moved < 0.01) {
            this.stuckCounter++;
            if (this.stuckCounter > 30) {
                // Try random direction to escape
                const angle = Math.random() * Math.PI * 2;
                direction.x = Math.cos(angle);
                direction.z = Math.sin(angle);
                this.stuckCounter = 0;
            }
        } else {
            this.stuckCounter = 0;
        }
        this.lastPosition = this.position.clone();
        
        this.velocity = direction.multiplyScalar(this.moveSpeed);
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    }
    
    // Override parent's updateIdle to add growl behavior
    updateIdle(deltaTime) {
        super.updateIdle(deltaTime);
        if (this.canSeePlayer() && this.state === 'chasing') {
            this.playGrowl();
        }
    }
    
    // Override parent's performAttack with Hellhound-specific behavior
    performAttack() {
        if (!this.target) return;
        
        const distance = this.position.distanceTo(this.target.position);
        const heightDifference = Math.abs(this.position.y - this.target.position.y);
        
        // Only attack if within range AND at similar height (within 1 meter)
        if (distance <= this.attackRange && heightDifference < 1.0) {
            this.target.takeDamage(this.damage);
            
            // Lunge animation
            const lungeDirection = new THREE.Vector3()
                .subVectors(this.target.position, this.position)
                .normalize();
            this.position.add(lungeDirection.multiplyScalar(0.3));
        }
    }
    
    // Override parent's takeDamage to add Hellhound-specific pain sound
    takeDamage(amount) {
        super.takeDamage(amount);
        this.playPainSound();
    }
    
    // Override parent's onDeath method to ensure proper death handling
    onDeath() {
        this.state = 'dead';
        this.isDead = true;  // Ensure isDead is set for kill counting
        
        if (this.mesh) {
            const fallAnimation = () => {
                if (this.mesh.rotation.z < Math.PI / 2) {
                    this.mesh.rotation.z += 0.15;
                    this.mesh.position.y -= 0.03;
                    requestAnimationFrame(fallAnimation);
                }
            };
            fallAnimation();
        }
        
        // Call parent death particles
        this.createDeathParticles();
    }
    
    pointIntersectsBox(point, boxMin, boxMax, margin) {
        return point.x + margin > boxMin.x && point.x - margin < boxMax.x &&
               point.y + margin > boxMin.y && point.y - margin < boxMax.y &&
               point.z + margin > boxMin.z && point.z - margin < boxMax.z;
    }
    
    playGrowl() {
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const duration = 0.3;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    playPainSound() {
        const audioContext = AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        const duration = 0.1;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200 + Math.random() * 100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }
}
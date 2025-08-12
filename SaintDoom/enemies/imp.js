import * as THREE from 'three';
// Imp Enemy Type
// Small, agile demons with fireball projectile attacks

import { Enemy } from '../enemy.js';

export class Imp extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Override stats for imp
        this.health = 20;
        this.maxHealth = 20;
        this.moveSpeed = 4;
        this.damage = 8;
        this.attackRange = 15; // Ranged attacker
        this.sightRange = 25;
        this.type = 'imp';
        
        // Smaller size
        this.radius = 0.2;
        this.height = 1.0;
        
        // Projectile properties
        this.projectileSpeed = 15;
        this.projectileCooldown = 2000; // milliseconds
        this.lastProjectileTime = 0;
        this.projectiles = [];
        
        // Teleport ability
        this.teleportCooldown = 5000;
        this.lastTeleportTime = 0;
        this.teleportRange = 10;
        
        // Override mesh
        this.scene.remove(this.mesh);
        this.createImpMesh();
    }
    
    createImpMesh() {
        const group = new THREE.Group();
        
        // Small body
        const bodyGeometry = new THREE.SphereGeometry(0.25, 8, 6);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x660000,
            emissive: 0x330000,
            emissiveIntensity: 0.2
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.5;
        group.add(this.bodyMesh);
        
        // Head with horns
        const headGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        this.headMesh = new THREE.Mesh(headGeometry, bodyMaterial);
        this.headMesh.position.y = 0.8;
        group.add(this.headMesh);
        
        // Horns
        const hornGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
        const hornMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222
        });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.08, 0.9, 0);
        leftHorn.rotation.z = -0.3;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.08, 0.9, 0);
        rightHorn.rotation.z = 0.3;
        group.add(rightHorn);
        
        // Glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.06, 0.82, 0.12);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.06, 0.82, 0.12);
        group.add(rightEye);
        
        // Wings (small bat-like)
        const wingGeometry = new THREE.PlaneGeometry(0.4, 0.3);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x440000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.3, 0.6, -0.1);
        leftWing.rotation.y = -0.5;
        group.add(leftWing);
        this.leftWing = leftWing;
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.3, 0.6, -0.1);
        rightWing.rotation.y = 0.5;
        group.add(rightWing);
        this.rightWing = rightWing;
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.4, 4);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0.3, -0.2);
        tail.rotation.z = -0.3;
        group.add(tail);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Shadow
        this.bodyMesh.castShadow = true;
    }
    
    update(deltaTime, player) {
        if (this.isDead || this.state === 'dead') return;
        
        // Wing flapping animation
        if (this.leftWing && this.rightWing) {
            const flapSpeed = 8;
            const flapAmount = Math.sin(Date.now() * 0.001 * flapSpeed) * 0.3;
            this.leftWing.rotation.z = -flapAmount;
            this.rightWing.rotation.z = flapAmount;
        }
        
        // Hovering animation
        if (this.mesh) {
            const hoverHeight = 0.5 + Math.sin(Date.now() * 0.002) * 0.2;
            this.position.y = hoverHeight;
        }
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Check for teleport when in danger
        if (this.health < this.maxHealth * 0.3) {
            this.attemptTeleport();
        }
        
        // Parent update
        super.update(deltaTime, player);
    }
    
    updateChasing(deltaTime) {
        if (!this.target) return;
        
        const distance = this.position.distanceTo(this.target.position);
        
        // Maintain optimal distance for ranged attacks
        const optimalDistance = 10;
        
        if (distance <= this.attackRange) {
            // In range, stop and attack
            this.state = 'attacking';
            this.velocity.set(0, 0, 0);
        } else if (distance > this.sightRange) {
            this.state = 'idle';
        } else if (distance < optimalDistance - 2) {
            // Too close, back away
            const direction = new THREE.Vector3()
                .subVectors(this.position, this.target.position)
                .normalize();
            direction.y = 0;
            
            this.velocity = direction.multiplyScalar(this.moveSpeed * 0.5);
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        } else if (distance > optimalDistance + 2) {
            // Too far, move closer
            const direction = new THREE.Vector3()
                .subVectors(this.target.position, this.position)
                .normalize();
            direction.y = 0;
            
            // Strafe movement pattern
            const strafe = Math.sin(Date.now() * 0.003) * 0.5;
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            direction.add(perpendicular.multiplyScalar(strafe));
            direction.normalize();
            
            this.velocity = direction.multiplyScalar(this.moveSpeed);
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        } else {
            // Optimal distance, strafe
            this.strafe(deltaTime);
        }
    }
    
    strafe(deltaTime) {
        // Circle strafe around player
        const angle = Math.atan2(
            this.position.z - this.target.position.z,
            this.position.x - this.target.position.x
        );
        
        const strafeDirection = Math.sin(Date.now() * 0.002) > 0 ? 1 : -1;
        const newAngle = angle + strafeDirection * deltaTime * 2;
        const distance = this.position.distanceTo(this.target.position);
        
        this.position.x = this.target.position.x + Math.cos(newAngle) * distance;
        this.position.z = this.target.position.z + Math.sin(newAngle) * distance;
    }
    
    performAttack() {
        if (!this.target) return;
        
        const now = Date.now();
        if (now - this.lastProjectileTime < this.projectileCooldown) return;
        
        // Create fireball projectile
        this.createFireball();
        this.lastProjectileTime = now;
    }
    
    createFireball() {
        const fireballGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const fireballMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600
        });
        
        const fireball = new THREE.Mesh(fireballGeometry, fireballMaterial);
        fireball.position.copy(this.position);
        fireball.position.y += 0.5;
        
        // Calculate direction to player
        const direction = new THREE.Vector3()
            .subVectors(this.target.position, fireball.position)
            .normalize();
        
        // Add some prediction based on player velocity
        if (this.target.velocity) {
            const predictedPos = this.target.position.clone()
                .add(this.target.velocity.clone().multiplyScalar(0.5));
            direction.subVectors(predictedPos, fireball.position).normalize();
        }
        
        // Create particle trail
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(30);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        
        const trailMaterial = new THREE.PointsMaterial({
            color: 0xff3300,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const trail = new THREE.Points(trailGeometry, trailMaterial);
        this.scene.add(trail);
        
        // Add light to fireball
        const light = new THREE.PointLight(0xff6600, 0.5, 5);
        light.position.copy(fireball.position);
        this.scene.add(light);
        
        this.scene.add(fireball);
        
        // Store projectile data
        this.projectiles.push({
            mesh: fireball,
            trail: trail,
            light: light,
            velocity: direction.multiplyScalar(this.projectileSpeed),
            lifetime: 3000,
            startTime: Date.now(),
            damage: this.damage
        });
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Update position
            projectile.mesh.position.add(
                projectile.velocity.clone().multiplyScalar(deltaTime)
            );
            projectile.light.position.copy(projectile.mesh.position);
            
            // Update trail
            const positions = projectile.trail.geometry.attributes.position.array;
            for (let j = positions.length - 3; j >= 3; j -= 3) {
                positions[j] = positions[j - 3];
                positions[j + 1] = positions[j - 2];
                positions[j + 2] = positions[j - 1];
            }
            positions[0] = projectile.mesh.position.x;
            positions[1] = projectile.mesh.position.y;
            positions[2] = projectile.mesh.position.z;
            projectile.trail.geometry.attributes.position.needsUpdate = true;
            
            // Check collision with player
            if (this.target) {
                const distance = projectile.mesh.position.distanceTo(this.target.position);
                if (distance < 1) {
                    // Hit player
                    this.target.takeDamage(projectile.damage);
                    this.explodeFireball(projectile);
                    this.removeProjectile(i);
                    continue;
                }
            }
            
            // Check lifetime
            if (Date.now() - projectile.startTime > projectile.lifetime) {
                this.removeProjectile(i);
                continue;
            }
            
            // Check if out of bounds
            if (projectile.mesh.position.y < -10 || projectile.mesh.position.y > 50) {
                this.removeProjectile(i);
            }
        }
    }
    
    explodeFireball(projectile) {
        // Create explosion effect
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.5 ? 0xff6600 : 0xffaa00,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(projectile.mesh.position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 3,
                (Math.random() - 0.5) * 5
            );
            
            this.scene.add(particle);
            
            // Animate particle
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.15;
                particle.material.opacity -= 0.03;
                
                if (particle.material.opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    removeProjectile(index) {
        const projectile = this.projectiles[index];
        this.scene.remove(projectile.mesh);
        this.scene.remove(projectile.trail);
        this.scene.remove(projectile.light);
        this.projectiles.splice(index, 1);
    }
    
    attemptTeleport() {
        const now = Date.now();
        if (now - this.lastTeleportTime < this.teleportCooldown) return;
        
        // Create teleport effect at current position
        this.createTeleportEffect(this.position.clone());
        
        // Find new position
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 5;
        
        const newPosition = new THREE.Vector3(
            this.position.x + Math.cos(angle) * distance,
            this.position.y,
            this.position.z + Math.sin(angle) * distance
        );
        
        // Teleport
        this.position.copy(newPosition);
        
        // Create effect at new position
        this.createTeleportEffect(newPosition);
        
        this.lastTeleportTime = now;
    }
    
    createTeleportEffect(position) {
        // Create smoke puff effect
        const smokeGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x440044,
            transparent: true,
            opacity: 0.6
        });
        
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.copy(position);
        this.scene.add(smoke);
        
        // Animate smoke
        const animateSmoke = () => {
            smoke.scale.multiplyScalar(1.1);
            smoke.material.opacity *= 0.9;
            
            if (smoke.material.opacity > 0.01) {
                requestAnimationFrame(animateSmoke);
            } else {
                this.scene.remove(smoke);
            }
        };
        animateSmoke();
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Holy damage is extra effective
        if (damageType === 'holy') {
            damage *= 2.5;
        }
        
        super.takeDamage(damage);
        
        // Chance to teleport when hit
        if (Math.random() < 0.3 && this.health > 0) {
            this.attemptTeleport();
        }
    }
    
    onDeath() {
        super.onDeath();
        
        // Clear any remaining projectiles
        while (this.projectiles.length > 0) {
            this.removeProjectile(0);
        }
        
        // Create death explosion
        this.createDeathPoof();
    }
    
    createDeathPoof() {
        // Sulfurous smoke cloud
        const cloudGeometry = new THREE.SphereGeometry(1, 8, 6);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: 0x666600,
            transparent: true,
            opacity: 0.8
        });
        
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.copy(this.position);
        this.scene.add(cloud);
        
        // Animate cloud
        const animateCloud = () => {
            cloud.scale.multiplyScalar(1.05);
            cloud.material.opacity *= 0.95;
            cloud.position.y += 0.02;
            
            if (cloud.material.opacity > 0.01) {
                requestAnimationFrame(animateCloud);
            } else {
                this.scene.remove(cloud);
            }
        };
        animateCloud();
    }
}
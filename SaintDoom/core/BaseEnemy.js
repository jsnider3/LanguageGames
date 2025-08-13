import * as THREE from 'three';
import { Entity } from '../modules/Entity.js';

export class BaseEnemy extends Entity {
    constructor(scene, position) {
        super(scene, position);
        
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
        this.isDead = false;
        this.deathCounted = false;
        this.sightRange = 15;
        this.hearingRange = 20;
        this.target = null;
        
        // Physics
        this.radius = 0.3;
        this.height = 1.8;
        
        // Animation
        this.bobAmount = 0;
        this.hurtTime = 0;

        this.team = 'enemy';
    }
    
    createMesh() {
        // This method should be overridden by subclasses
    }
    
    update(deltaTime, player) {
        super.update(deltaTime);

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
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
        
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
            if (this.bodyMesh) {
                const flashIntensity = Math.sin(this.hurtTime * 20) * 0.5 + 0.5;
                this.bodyMesh.material.emissive = new THREE.Color(flashIntensity, 0, 0);
                this.bodyMesh.material.emissiveIntensity = flashIntensity;
            }
        } else if (this.bodyMesh) {
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
        const heightDifference = Math.abs(this.position.y - this.target.position.y);
        
        // Only attack if within range AND at similar height (within 1 meter)
        if (distance <= this.attackRange && heightDifference < 1.0) {
            this.target.takeDamage(this.damage);
            
            // Visual feedback - lunge forward
            const lungeDirection = new THREE.Vector3()
                .subVectors(this.target.position, this.position)
                .normalize();
            
            this.position.add(lungeDirection.multiplyScalar(0.2));
        }
    }
    
    takeDamage(amount) {
        super.takeDamage(amount);
        if (this.health > 0) {
            this.state = 'hurt';
            this.hurtTime = 0.3;
            if (this.bodyMesh) {
                this.bodyMesh.material.emissive = new THREE.Color(1, 0, 0);
                this.bodyMesh.material.emissiveIntensity = 1;
            }
        }
    }
    
    onDeath() {
        super.onDeath();
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
        // Prefer pooled particles if available
        const poolMgr = (this.game && this.game.poolManager)
            ? this.game.poolManager
            : (window.currentGame && window.currentGame.poolManager) ? window.currentGame.poolManager : null;
        const pool = poolMgr ? poolMgr.getPool('particles') : null;

        if (pool && pool.burst) {
            const pos = this.position.clone();
            pos.y += 0.5;
            // Burst mixed colors: run twice with different colors
            pool.burst(pos, 12, 0x880000, 5);
            pool.burst(pos, 10, 0x004400, 5);
            return;
        }
        // Fallback simple effect if pool not available
        const sphere = new THREE.SphereGeometry(0.05, 4, 4);
        for (let i = 0; i < 10; i++) {
            const mat = new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 1 });
            const p = new THREE.Mesh(sphere, mat);
            p.position.copy(this.position);
            p.position.y += 0.5;
            const vel = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3);
            this.scene.add(p);
            const step = () => {
                p.position.add(vel.clone().multiplyScalar(0.02));
                vel.y -= 0.2;
                mat.opacity -= 0.03;
                if (mat.opacity > 0) requestAnimationFrame(step); else this.scene.remove(p);
            };
            step();
        }
    }
}

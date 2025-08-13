import * as THREE from 'three';

import { BaseEnemy } from '../core/BaseEnemy.js';
import { THEME } from '../modules/config/theme.js';

export class PossessedScientist extends BaseEnemy {
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
        
        // Visual
        this.createMesh();
        
        // Animation
        this.bobAmount = 0;
        this.hurtTime = 0;
    }
    
    createMesh() {
        // Create a recognizable possessed scientist model
        const group = new THREE.Group();
        
        // Lab coat body - tattered, burnt and stained
        const torsoGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
        const labCoatMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0, // Dirty gray-white lab coat
            roughness: 0.9,
            metalness: 0.05,
            emissive: 0x110000,
            emissiveIntensity: 0.1
        });
        this.bodyMesh = new THREE.Mesh(torsoGeometry, labCoatMaterial);
        this.bodyMesh.position.y = 0.7;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        group.add(this.bodyMesh);
        
        // Burn marks on coat
        const burnGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.02);
        const burnMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.95
        });
        const burn = new THREE.Mesh(burnGeometry, burnMaterial);
        burn.position.set(0.15, 0.5, -0.16);
        burn.rotation.z = -0.2;
        group.add(burn);
        
        // Lab coat collar
        const collarGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.25);
        const collar = new THREE.Mesh(collarGeometry, labCoatMaterial);
        collar.position.set(0, 1.15, 0);
        group.add(collar);
        
        // Shirt underneath (visible at neck)
        const shirtGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.24);
        const shirtMaterial = new THREE.MeshStandardMaterial({
            color: 0x4488cc, // Blue shirt
            roughness: 0.7
        });
        const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
        shirt.position.set(0, 1.05, 0);
        group.add(shirt);
        
        // Tie (askew and disheveled)
        const tieGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.02);
        const tieMaterial = new THREE.MeshStandardMaterial({
            color: 0x660022, // Dark red tie
            roughness: 0.6
        });
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.set(0.02, 0.85, -0.16);
        tie.rotation.z = 0.1; // Slightly crooked
        group.add(tie);
        
        // Lab coat pocket with pens
        const pocketGeometry = new THREE.BoxGeometry(0.15, 0.12, 0.02);
        const pocket = new THREE.Mesh(pocketGeometry, labCoatMaterial);
        pocket.position.set(-0.2, 0.75, -0.16);
        group.add(pocket);
        
        // Pen in pocket
        const penGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.15);
        const penMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const pen = new THREE.Mesh(penGeometry, penMaterial);
        pen.position.set(-0.2, 0.82, -0.17);
        group.add(pen);
        
        // Large blood stains on coat - more visible
        const bloodStainGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.02);
        const bloodMaterial = new THREE.MeshStandardMaterial({
            color: THEME.bosses.belial.primary,
            roughness: 0.3,
            emissive: 0x220000,
            emissiveIntensity: 0.3
        });
        const bloodStain = new THREE.Mesh(bloodStainGeometry, bloodMaterial);
        bloodStain.position.set(0.1, 0.6, -0.17);
        group.add(bloodStain);
        
        // Additional blood splatter
        const splatterGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.02);
        const splatter = new THREE.Mesh(splatterGeometry, bloodMaterial);
        splatter.position.set(-0.15, 0.85, -0.17);
        splatter.rotation.z = 0.3;
        group.add(splatter);
        
        // Legs - black dress pants
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.8
        });
        const leftLegGeometry = new THREE.CylinderGeometry(0.1, 0.09, 0.7);
        const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
        leftLeg.position.set(-0.12, 0.2, 0);
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
        rightLeg.position.set(0.12, 0.2, 0);
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        // Shoes
        const shoeGeometry = new THREE.BoxGeometry(0.12, 0.06, 0.2);
        const shoeMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.4
        });
        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(-0.12, 0.03, 0.03);
        group.add(leftShoe);
        
        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(0.12, 0.03, 0.03);
        group.add(rightShoe);
        
        // Head - gaunt and corrupted
        const headGeometry = new THREE.SphereGeometry(0.17, 8, 6);
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a9980, // Deathly pale green-gray
            roughness: 0.7,
            emissive: 0x001100,
            emissiveIntensity: 0.3
        });
        this.headMesh = new THREE.Mesh(headGeometry, skinMaterial);
        this.headMesh.position.y = 1.4;
        this.headMesh.scale.set(0.9, 1.2, 0.85); // Gaunt and elongated
        this.headMesh.castShadow = true;
        group.add(this.headMesh);
        
        // Dark veins on face - signs of corruption
        const veinGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.1);
        const veinMaterial = new THREE.MeshBasicMaterial({ color: 0x220022 });
        
        const vein1 = new THREE.Mesh(veinGeometry, veinMaterial);
        vein1.position.set(-0.1, 1.45, -0.17);
        vein1.rotation.z = 0.3;
        group.add(vein1);
        
        const vein2 = new THREE.Mesh(veinGeometry, veinMaterial);
        vein2.position.set(0.1, 1.45, -0.17);
        vein2.rotation.z = -0.3;
        group.add(vein2);
        
        const vein3 = new THREE.Mesh(veinGeometry, veinMaterial);
        vein3.position.set(0, 1.35, -0.17);
        vein3.rotation.z = 1.57;
        group.add(vein3);
        
        // Broken glasses hanging off one ear (more realistic)
        const glassesFrameGeometry = new THREE.TorusGeometry(0.05, 0.006, 3, 6);
        const glassesMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.7,
            roughness: 0.3
        });
        const leftLens = new THREE.Mesh(glassesFrameGeometry, glassesMaterial);
        leftLens.position.set(-0.1, 1.38, -0.17);
        leftLens.rotation.z = -0.3;
        leftLens.rotation.y = 0.2;
        group.add(leftLens);
        
        // DEMONIC GLOWING EYES - Elongated and sinister
        const eyeGeometry = new THREE.SphereGeometry(0.04, 6, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.low
        });
        
        // Left eye - stretched vertically for demonic look
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.06, 1.42, -0.16);
        leftEye.scale.y = 1.5; // Elongated
        leftEye.scale.z = 0.5;
        group.add(leftEye);
        this.leftEye = leftEye;
        
        // Right eye - stretched vertically
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.06, 1.42, -0.16);
        rightEye.scale.y = 1.5; // Elongated
        rightEye.scale.z = 0.5;
        group.add(rightEye);
        this.rightEye = rightEye;
        
        // Inner yellow pupils for contrast
        const pupilGeometry = new THREE.SphereGeometry(0.015, 4, 4);
        const pupilMaterial = new THREE.MeshBasicMaterial({
            color: THEME.ui.health.medium
        });
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.06, 1.42, -0.17);
        group.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.06, 1.42, -0.17);
        group.add(rightPupil);
        
        // Stronger red glow from eyes
        const leftEyeLight = new THREE.PointLight(0xff0000, 0.8, 2);
        leftEyeLight.position.set(-0.06, 1.42, -0.2);
        group.add(leftEyeLight);
        
        const rightEyeLight = new THREE.PointLight(0xff0000, 0.8, 2);
        rightEyeLight.position.set(0.06, 1.42, -0.2);
        group.add(rightEyeLight);
        
        // Messy gray hair
        const hairGeometry = new THREE.SphereGeometry(0.2, 6, 4);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.metal.default, // Gray hair
            roughness: 0.9
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0, 1.5, 0.02);
        hair.scale.set(1, 0.6, 0.8);
        group.add(hair);
        
        // Disheveled hair strands
        const strandGeometry = new THREE.ConeGeometry(0.03, 0.1, 3);
        for (let i = 0; i < 3; i++) {
            const strand = new THREE.Mesh(strandGeometry, hairMaterial);
            strand.position.set(
                (Math.random() - 0.5) * 0.2,
                1.55,
                (Math.random() - 0.5) * 0.1
            );
            strand.rotation.z = (Math.random() - 0.5) * 0.5;
            group.add(strand);
        }
        
        // Mouth - wide snarling grin
        const mouthGeometry = new THREE.BoxGeometry(0.12, 0.02, 0.03);
        const mouthMaterial = new THREE.MeshBasicMaterial({
            color: THEME.materials.black
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.28, -0.16);
        group.add(mouth);
        
        // Exposed teeth
        const teethGeometry = new THREE.BoxGeometry(0.1, 0.015, 0.01);
        const teethMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc
        });
        const teeth = new THREE.Mesh(teethGeometry, teethMaterial);
        teeth.position.set(0, 1.29, -0.165);
        group.add(teeth);
        
        // Arms with lab coat sleeves
        const upperArmGeometry = new THREE.CylinderGeometry(0.09, 0.08, 0.4);
        const sleeveMaterial = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0, // White lab coat sleeves
            roughness: 0.85
        });
        
        // Left arm
        const leftUpperArm = new THREE.Mesh(upperArmGeometry, sleeveMaterial);
        leftUpperArm.position.set(-0.3, 0.8, 0);
        leftUpperArm.rotation.z = 0.2;
        leftUpperArm.castShadow = true;
        group.add(leftUpperArm);
        
        const lowerArmGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.4);
        const leftLowerArm = new THREE.Mesh(lowerArmGeometry, sleeveMaterial);
        leftLowerArm.position.set(-0.38, 0.45, 0);
        leftLowerArm.rotation.z = 0.15;
        leftLowerArm.castShadow = true;
        group.add(leftLowerArm);
        
        // Hands - pale and veiny
        const handGeometry = new THREE.SphereGeometry(0.06, 4, 4);
        const handMaterial = new THREE.MeshStandardMaterial({
            color: 0xccbbaa, // Pale skin like head
            roughness: 0.6
        });
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.42, 0.25, 0);
        group.add(leftHand);
        
        // Right arm
        const rightUpperArm = new THREE.Mesh(upperArmGeometry, sleeveMaterial);
        rightUpperArm.position.set(0.3, 0.8, 0);
        rightUpperArm.rotation.z = -0.2;
        rightUpperArm.castShadow = true;
        group.add(rightUpperArm);
        
        const rightLowerArm = new THREE.Mesh(lowerArmGeometry, sleeveMaterial);
        rightLowerArm.position.set(0.38, 0.45, 0);
        rightLowerArm.rotation.z = -0.15;
        rightLowerArm.castShadow = true;
        group.add(rightLowerArm);
        
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.42, 0.25, 0);
        group.add(rightHand);
        
        // Store arm references for animation
        this.leftArm = { upper: leftUpperArm, lower: leftLowerArm, hand: leftHand };
        this.rightArm = { upper: rightUpperArm, lower: rightLowerArm, hand: rightHand };
        
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
            
            // Animate arms while moving - shambling walk
            if (this.leftArm && this.rightArm) {
                const armSwing = Math.sin(this.bobAmount) * 0.3;
                this.leftArm.upper.rotation.x = armSwing;
                this.rightArm.upper.rotation.x = -armSwing;
                this.leftArm.lower.rotation.x = Math.abs(armSwing) * 0.5;
                this.rightArm.lower.rotation.x = Math.abs(armSwing) * 0.5;
            }
        }
        
        // Creepy idle animations
        if (this.leftEye && this.rightEye) {
            // Make eyes pulse brighter occasionally
            const flicker = Math.random() > 0.98;
            if (flicker) {
                this.leftEye.material.color.setHex(THEME.ui.health.medium); // Bright yellow
                this.rightEye.material.color.setHex(THEME.ui.health.medium);
                setTimeout(() => {
                    this.leftEye.material.color.setHex(THEME.ui.health.low); // Back to red
                    this.rightEye.material.color.setHex(THEME.ui.health.low);
                }, 100);
            }
        }
        
        // Twitch head occasionally when idle
        if (this.state === 'idle' && Math.random() > 0.99) {
            this.headMesh.rotation.z = (Math.random() - 0.5) * 0.3;
            setTimeout(() => {
                this.headMesh.rotation.z = 0;
            }, 200);
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
        const heightDifference = Math.abs(this.position.y - this.target.position.y);
        
        // Only attack if within range AND at similar height (within 1 meter)
        if (distance <= this.attackRange && heightDifference < 1.0) {
            this.target.takeDamage(this.damage, "Possessed Scientist");
            
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
        // Validate force vector
        if (!force || isNaN(force.x) || isNaN(force.y) || isNaN(force.z)) {
            return;
        }
        
        // Apply knockback to velocity, not directly to position
        // This lets the physics system handle ground collision properly
        const knockbackForce = force.clone();
        
        // Reduce downward knockback to prevent pushing through floor
        if (knockbackForce.y < 0) {
            knockbackForce.y *= 0.3; // Reduce downward force
        }
        
        // Apply to velocity for smooth physics-based movement
        this.velocity.add(knockbackForce);
        
        // Clamp velocity to prevent excessive speeds
        const maxSpeed = 20;
        if (this.velocity.length() > maxSpeed) {
            this.velocity.normalize().multiplyScalar(maxSpeed);
        }
        
        // Ensure enemy doesn't go below ground level
        const minY = this.groundOffset || 0;
        if (this.position.y < minY) {
            this.position.y = minY;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        
        // Validate position after knockback
        if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
            // Reset to a valid position
            this.position.set(0, 1, 0);
        }
    }
    
    onDeath() {
        this.state = 'dead';
        this.isDead = true;  // Set isDead flag for kill counting
        
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
            const mat = new THREE.MeshBasicMaterial({ color: THEME.effects.blood.demon, transparent: true, opacity: 1 });
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
    
    destroy() {
        // Remove from scene
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
    }
}

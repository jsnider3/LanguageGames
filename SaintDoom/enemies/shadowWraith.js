import * as THREE from 'three';
// Shadow Wraith Enemy Type
// Phase shift ability - vulnerable only during attack frames

import { Enemy } from '../enemy.js';

export class ShadowWraith extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Override stats
        this.health = 80;
        this.maxHealth = 80;
        this.moveSpeed = 5;
        this.damage = 25;
        this.attackRange = 2;
        this.sightRange = 25;
        this.type = 'shadow_wraith';
        
        // Phase shift properties
        this.isPhased = true; // Start phased
        this.phaseShiftCooldown = 3000;
        this.lastPhaseShiftTime = 0;
        this.materializedDuration = 2000; // How long it stays solid after attacking
        this.vulnerableFrames = 500; // milliseconds vulnerable during attack
        
        // Stealth properties
        this.baseOpacity = 0.3;
        this.currentOpacity = 0.3;
        this.isInvisible = false;
        
        // Shadow dash
        this.dashCooldown = 4000;
        this.lastDashTime = 0;
        this.dashSpeed = 20;
        this.dashDistance = 10;
        
        // Override mesh
        this.scene.remove(this.mesh);
        this.createWraithMesh();
        
        // Shadow trail
        this.shadowTrail = [];
    }
    
    createWraithMesh() {
        const group = new THREE.Group();
        
        // Ethereal body
        const bodyGeometry = new THREE.ConeGeometry(0.4, 1.8, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x220044,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: this.baseOpacity,
            side: THREE.DoubleSide
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.9;
        group.add(this.bodyMesh);
        
        // Hooded head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.7);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x110022,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: this.baseOpacity
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.y = 1.7;
        group.add(this.headMesh);
        
        // Glowing eyes in darkness
        const eyeGeometry = new THREE.SphereGeometry(0.04, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 0.8
        });
        
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.08, 1.7, 0.2);
        group.add(this.leftEye);
        
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.08, 1.7, 0.2);
        group.add(this.rightEye);
        
        // Tattered cloak edges
        const cloakCount = 8;
        for (let i = 0; i < cloakCount; i++) {
            const angle = (i / cloakCount) * Math.PI * 2;
            const tatteredGeometry = new THREE.PlaneGeometry(0.3, 0.5);
            const tatteredMaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                transparent: true,
                opacity: this.baseOpacity * 0.5,
                side: THREE.DoubleSide
            });
            
            const tatter = new THREE.Mesh(tatteredGeometry, tatteredMaterial);
            tatter.position.set(
                Math.cos(angle) * 0.4,
                0.3,
                Math.sin(angle) * 0.4
            );
            tatter.rotation.y = angle;
            tatter.userData = { baseAngle: angle };
            group.add(tatter);
        }
        
        // Shadow aura
        this.createShadowAura(group);
        
        // Phase shift particles
        this.createPhaseParticles(group);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // No shadow when phased
        this.updateShadowCasting();
    }
    
    createShadowAura(parent) {
        // Dark mist around the wraith
        const auraGeometry = new THREE.SphereGeometry(1, 8, 6);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        this.aura = new THREE.Mesh(auraGeometry, auraMaterial);
        parent.add(this.aura);
    }
    
    createPhaseParticles(parent) {
        // Ethereal particles
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 30;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1;
            positions[i * 3 + 1] = Math.random() * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
            
            colors[i * 3] = 0.5;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 1;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        this.phaseParticles = new THREE.Points(particleGeometry, particleMaterial);
        parent.add(this.phaseParticles);
    }
    
    update(deltaTime, player) {
        if (this.isDead || this.state === 'dead') return;
        
        // Update phase particles
        if (this.phaseParticles) {
            const positions = this.phaseParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += deltaTime * 0.5;
                if (positions[i * 3 + 1] > 2) {
                    positions[i * 3 + 1] = 0;
                }
            }
            this.phaseParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Tattered cloak animation
        this.mesh.children.forEach(child => {
            if (child.userData.baseAngle !== undefined) {
                const flutter = Math.sin(Date.now() * 0.002 + child.userData.baseAngle) * 0.1;
                child.rotation.x = flutter;
                child.position.y = 0.3 + Math.abs(flutter) * 0.1;
            }
        });
        
        // Shadow aura pulse
        if (this.aura) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 1;
            this.aura.scale.set(pulse, pulse, pulse);
        }
        
        // Update phase state
        this.updatePhaseState();
        
        // Update opacity based on phase state
        this.updateOpacity();
        
        // Create shadow trail when moving
        if (this.velocity.length() > 0.1) {
            this.createShadowTrail();
        }
        this.updateShadowTrail(deltaTime);
        
        // Check for shadow dash
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer > 5 && distanceToPlayer < 15) {
            this.attemptShadowDash(player);
        }
        
        // Parent update
        super.update(deltaTime, player);
    }
    
    updatePhaseState() {
        const now = Date.now();
        
        // Auto-phase after attack window
        if (!this.isPhased && this.lastAttackTime > 0) {
            if (now - this.lastAttackTime > this.vulnerableFrames) {
                this.enterPhase();
            }
        }
        
        // Check if should materialize for attack
        if (this.state === 'attacking' && this.isPhased) {
            this.exitPhase();
        }
    }
    
    enterPhase() {
        if (this.isPhased) return;
        
        this.isPhased = true;
        this.lastPhaseShiftTime = Date.now();
        
        // Visual effect
        this.createPhaseEffect();
        
        // Update material
        this.updateOpacity();
        this.updateShadowCasting();
    }
    
    exitPhase() {
        if (!this.isPhased) return;
        
        this.isPhased = false;
        
        // Visual effect
        this.createMaterializeEffect();
        
        // Update material
        this.updateOpacity();
        this.updateShadowCasting();
    }
    
    updateOpacity() {
        const targetOpacity = this.isPhased ? this.baseOpacity : 0.8;
        
        // Smooth transition
        this.currentOpacity += (targetOpacity - this.currentOpacity) * 0.1;
        
        // Update all materials
        if (this.bodyMesh) {
            this.bodyMesh.material.opacity = this.currentOpacity;
        }
        if (this.headMesh) {
            this.headMesh.material.opacity = this.currentOpacity;
        }
        
        // Eyes glow brighter when materialized
        if (this.leftEye && this.rightEye) {
            const eyeOpacity = this.isPhased ? 0.3 : 1;
            this.leftEye.material.opacity = eyeOpacity;
            this.rightEye.material.opacity = eyeOpacity;
        }
    }
    
    updateShadowCasting() {
        // Only cast shadows when materialized
        if (this.bodyMesh) {
            this.bodyMesh.castShadow = !this.isPhased;
        }
        if (this.headMesh) {
            this.headMesh.castShadow = !this.isPhased;
        }
    }
    
    performAttack() {
        if (!this.target) return;
        
        // Must materialize to attack
        if (this.isPhased) {
            this.exitPhase();
        }
        
        const now = Date.now();
        this.lastAttackTime = now;
        
        // Claw attack animation
        this.createClawEffect();
        
        // Check hit
        const distance = this.position.distanceTo(this.target.position);
        if (distance <= this.attackRange) {
            this.target.takeDamage(this.damage);
            
            // Life drain effect
            this.createLifeDrainEffect();
        }
        
        // Schedule return to phase
        setTimeout(() => {
            if (!this.isDead) {
                this.enterPhase();
            }
        }, this.vulnerableFrames);
    }
    
    attemptShadowDash(player) {
        const now = Date.now();
        if (now - this.lastDashTime < this.dashCooldown) return;
        
        // Dash behind player
        const angleToPlayer = Math.atan2(
            player.position.z - this.position.z,
            player.position.x - this.position.x
        );
        
        const behindAngle = angleToPlayer + Math.PI;
        const dashTarget = new THREE.Vector3(
            player.position.x + Math.cos(behindAngle) * 3,
            this.position.y,
            player.position.z + Math.sin(behindAngle) * 3
        );
        
        // Create dash effect
        this.createDashEffect(this.position.clone(), dashTarget);
        
        // Instant teleport
        this.position.copy(dashTarget);
        
        this.lastDashTime = now;
        
        // Exit phase for surprise attack
        this.exitPhase();
        this.state = 'attacking';
    }
    
    createDashEffect(start, end) {
        // Shadow streak
        const points = [];
        const segments = 10;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            points.push(new THREE.Vector3().lerpVectors(start, end, t));
        }
        
        const streakGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const streakMaterial = new THREE.LineBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 0.6,
            linewidth: 3
        });
        
        const streak = new THREE.Line(streakGeometry, streakMaterial);
        this.scene.add(streak);
        
        // Fade streak
        const fadeStreak = () => {
            streak.material.opacity *= 0.85;
            if (streak.material.opacity > 0.01) {
                requestAnimationFrame(fadeStreak);
            } else {
                this.scene.remove(streak);
            }
        };
        
        setTimeout(fadeStreak, 100);
    }
    
    createShadowTrail() {
        const now = Date.now();
        
        // Create trail afterimage
        const trailMesh = this.bodyMesh.clone();
        trailMesh.material = trailMesh.material.clone();
        trailMesh.material.opacity = 0.2;
        trailMesh.position.copy(this.position);
        trailMesh.position.y += 0.9;
        
        this.scene.add(trailMesh);
        
        this.shadowTrail.push({
            mesh: trailMesh,
            startTime: now,
            lifetime: 1000
        });
    }
    
    updateShadowTrail(deltaTime) {
        const now = Date.now();
        
        for (let i = this.shadowTrail.length - 1; i >= 0; i--) {
            const trail = this.shadowTrail[i];
            const age = now - trail.startTime;
            
            if (age > trail.lifetime) {
                this.scene.remove(trail.mesh);
                this.shadowTrail.splice(i, 1);
            } else {
                // Fade out
                trail.mesh.material.opacity = 0.2 * (1 - age / trail.lifetime);
                trail.mesh.scale.y *= 0.98;
            }
        }
    }
    
    createPhaseEffect() {
        // Dissolve effect
        const dissolveCount = 20;
        
        for (let i = 0; i < dissolveCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0x8800ff,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            particle.position.copy(this.position);
            particle.position.y += Math.random() * 2;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            
            this.scene.add(particle);
            
            // Animate
            const animateParticle = () => {
                particle.position.add(velocity.clone().multiplyScalar(0.02));
                particle.material.opacity *= 0.95;
                
                if (particle.material.opacity > 0.01) {
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            animateParticle();
        }
    }
    
    createMaterializeEffect() {
        // Solidify effect
        const ringGeometry = new THREE.RingGeometry(0.5, 1, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(this.position);
        ring.position.y += 1;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        // Animate ring
        const animateRing = () => {
            ring.scale.x *= 0.95;
            ring.scale.y *= 0.95;
            ring.position.y += 0.02;
            ring.material.opacity *= 0.9;
            
            if (ring.material.opacity > 0.01) {
                requestAnimationFrame(animateRing);
            } else {
                this.scene.remove(ring);
            }
        };
        animateRing();
    }
    
    createClawEffect() {
        // Slash marks in the air
        for (let i = 0; i < 3; i++) {
            const slashGeometry = new THREE.PlaneGeometry(0.05, 0.8);
            const slashMaterial = new THREE.MeshBasicMaterial({
                color: 0x8800ff,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            
            const slash = new THREE.Mesh(slashGeometry, slashMaterial);
            slash.position.copy(this.position);
            slash.position.y += 1;
            slash.position.x += (i - 1) * 0.2;
            slash.rotation.z = (i - 1) * 0.3;
            
            this.scene.add(slash);
            
            // Animate slash
            const animateSlash = () => {
                slash.position.z += 0.05;
                slash.material.opacity *= 0.9;
                
                if (slash.material.opacity > 0.01) {
                    requestAnimationFrame(animateSlash);
                } else {
                    this.scene.remove(slash);
                }
            };
            animateSlash();
        }
    }
    
    createLifeDrainEffect() {
        // Purple energy particles
        for (let i = 0; i < 10; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0x8800ff,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.copy(this.target.position);
            particle.position.y += 1;
            
            this.scene.add(particle);
            
            // Animate to wraith
            const startPos = particle.position.clone();
            const endPos = this.position.clone();
            endPos.y += 1;
            
            const startTime = Date.now();
            const animateParticle = () => {
                const progress = (Date.now() - startTime) / 1000;
                
                if (progress < 1) {
                    particle.position.lerpVectors(startPos, endPos, progress);
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                    
                    // Heal wraith slightly
                    this.health = Math.min(this.maxHealth, this.health + 5);
                }
            };
            
            setTimeout(() => animateParticle(), i * 50);
        }
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Can only be damaged when not phased
        if (this.isPhased) {
            // Show immune effect
            this.createImmuneEffect();
            return;
        }
        
        // Holy damage is very effective
        if (damageType === 'holy') {
            damage *= 2;
            
            // Holy water forces materialization
            this.exitPhase();
            this.lastPhaseShiftTime = Date.now(); // Reset cooldown
        }
        
        super.takeDamage(damage);
    }
    
    createImmuneEffect() {
        // Show that attack passed through
        const passGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
        const passMaterial = new THREE.MeshBasicMaterial({
            color: 0x8800ff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        const pass = new THREE.Mesh(passGeometry, passMaterial);
        pass.position.copy(this.position);
        pass.position.y += 1;
        pass.lookAt(this.player.camera.position);
        this.scene.add(pass);
        
        // Animate
        const animatePass = () => {
            pass.scale.multiplyScalar(1.1);
            pass.material.opacity *= 0.9;
            
            if (pass.material.opacity > 0.01) {
                requestAnimationFrame(animatePass);
            } else {
                this.scene.remove(pass);
            }
        };
        animatePass();
    }
    
    onDeath() {
        // Clear shadow trail
        this.shadowTrail.forEach(trail => {
            this.scene.remove(trail.mesh);
        });
        this.shadowTrail = [];
        
        // Force materialization for death
        this.isPhased = false;
        this.updateOpacity();
        
        super.onDeath();
        
        // Disperse into shadows
        this.createDispersionEffect();
    }
    
    createDispersionEffect() {
        // Break apart into shadow fragments
        const fragmentCount = 30;
        
        for (let i = 0; i < fragmentCount; i++) {
            const fragmentGeometry = new THREE.TetrahedronGeometry(0.1 + Math.random() * 0.1);
            const fragmentMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.8
            });
            
            const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
            fragment.position.copy(this.position);
            fragment.position.y += Math.random() * 2;
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 3,
                (Math.random() - 0.5) * 5
            );
            
            const rotationSpeed = new THREE.Vector3(
                Math.random() * 0.2,
                Math.random() * 0.2,
                Math.random() * 0.2
            );
            
            this.scene.add(fragment);
            
            // Animate fragment
            const animateFragment = () => {
                fragment.position.add(velocity.clone().multiplyScalar(0.02));
                velocity.y -= 0.1;
                
                fragment.rotation.x += rotationSpeed.x;
                fragment.rotation.y += rotationSpeed.y;
                fragment.rotation.z += rotationSpeed.z;
                
                fragment.material.opacity *= 0.96;
                
                if (fragment.material.opacity > 0.01 && fragment.position.y > -2) {
                    requestAnimationFrame(animateFragment);
                } else {
                    this.scene.remove(fragment);
                }
            };
            animateFragment();
        }
    }
}
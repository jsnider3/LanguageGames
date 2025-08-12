import * as THREE from 'three';
// Succubus Infiltrator Enemy Type
// Ranged psychic attacks with teleportation ability

import { Enemy } from '../enemy.js';

export class Succubus extends Enemy {
    constructor(scene, position) {
        super(scene, position);
        
        // Override stats
        this.health = 60;
        this.maxHealth = 60;
        this.moveSpeed = 3;
        this.damage = 20;
        this.attackRange = 20;
        this.sightRange = 30;
        this.type = 'succubus';
        
        // Psychic attack properties
        this.psychicCooldown = 3000;
        this.lastPsychicTime = 0;
        this.charmDuration = 2000;
        
        // Teleportation
        this.teleportCooldown = 4000;
        this.lastTeleportTime = 0;
        this.maxTeleportDistance = 15;
        
        // Illusion abilities
        this.illusionCooldown = 8000;
        this.lastIllusionTime = 0;
        this.illusions = [];
        
        // Flight
        this.baseHeight = 2;
        this.floatOffset = 0;
        
        // Override mesh
        this.scene.remove(this.mesh);
        this.createSuccubusMesh();
    }
    
    createSuccubusMesh() {
        const group = new THREE.Group();
        
        // Feminine humanoid body
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x880088,
            emissive: 0x440044,
            emissiveIntensity: 0.2
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.6;
        group.add(this.bodyMesh);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xaa88aa,
            emissive: 0x550055,
            emissiveIntensity: 0.1
        });
        this.headMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.headMesh.position.y = 1.4;
        group.add(this.headMesh);
        
        // Curved horns
        const hornGeometry = new THREE.TorusGeometry(0.15, 0.03, 4, 8, Math.PI);
        const hornMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111,
            emissive: 0x220022,
            emissiveIntensity: 0.3
        });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.1, 1.5, 0);
        leftHorn.rotation.z = -Math.PI / 6;
        group.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.1, 1.5, 0);
        rightHorn.rotation.z = Math.PI / 6;
        group.add(rightHorn);
        
        // Hypnotic eyes - MeshBasicMaterial doesn't support emissive
        const eyeGeometry = new THREE.SphereGeometry(0.04, 6, 6);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff
        });
        
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.08, 1.42, 0.15);
        group.add(this.leftEye);
        
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.08, 1.42, 0.15);
        group.add(this.rightEye);
        
        // Demonic wings
        const wingGeometry = new THREE.PlaneGeometry(1.5, 1);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0x440044,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            emissive: 0x220022,
            emissiveIntensity: 0.1
        });
        
        this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.leftWing.position.set(-0.8, 0.8, -0.3);
        this.leftWing.rotation.y = -0.8;
        group.add(this.leftWing);
        
        this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        this.rightWing.position.set(0.8, 0.8, -0.3);
        this.rightWing.rotation.y = 0.8;
        group.add(this.rightWing);
        
        // Tail with spade tip
        const tailGeometry = new THREE.CylinderGeometry(0.03, 0.06, 1, 6);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0.2, -0.3);
        tail.rotation.z = Math.PI / 4;
        group.add(tail);
        
        const spadeGeometry = new THREE.ConeGeometry(0.1, 0.2, 4);
        const spade = new THREE.Mesh(spadeGeometry, hornMaterial);
        spade.position.set(0.35, -0.15, -0.3);
        spade.rotation.z = -Math.PI / 2;
        group.add(spade);
        
        // Aura effect
        this.createAura(group);
        
        this.mesh = group;
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
        
        // Shadows
        this.bodyMesh.castShadow = true;
        this.headMesh.castShadow = true;
    }
    
    createAura(parent) {
        // Create pulsing aura
        const auraGeometry = new THREE.SphereGeometry(1, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        this.aura = new THREE.Mesh(auraGeometry, auraMaterial);
        parent.add(this.aura);
    }
    
    update(deltaTime, player) {
        if (this.isDead || this.state === 'dead') return;
        
        // Floating animation
        this.floatOffset += deltaTime;
        this.position.y = this.baseHeight + Math.sin(this.floatOffset * 2) * 0.3;
        
        // Wing animation
        if (this.leftWing && this.rightWing) {
            const wingFlap = Math.sin(Date.now() * 0.003) * 0.2;
            this.leftWing.rotation.z = -wingFlap;
            this.rightWing.rotation.z = wingFlap;
        }
        
        // Aura pulsing
        if (this.aura) {
            const pulse = Math.sin(Date.now() * 0.002) * 0.05 + 0.1;
            this.aura.material.opacity = pulse;
        }
        
        // Eye glow when attacking - use color brightness instead
        if (this.state === 'attacking') {
            const glow = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            const glowColor = new THREE.Color(1, glow, 1);
            this.leftEye.material.color = glowColor;
            this.rightEye.material.color = glowColor;
        }
        
        // Update illusions
        this.updateIllusions(deltaTime);
        
        // Check for special abilities
        const now = Date.now();
        const distanceToPlayer = this.position.distanceTo(player.position);
        
        // Use illusion when player gets close
        if (distanceToPlayer < 10 && now - this.lastIllusionTime > this.illusionCooldown) {
            this.createIllusions();
            this.lastIllusionTime = now;
        }
        
        // Teleport when in danger or to reposition
        if ((this.health < this.maxHealth * 0.5 || distanceToPlayer < 3) && 
            now - this.lastTeleportTime > this.teleportCooldown) {
            this.teleportAway(player);
            this.lastTeleportTime = now;
        }
        
        // Parent update
        super.update(deltaTime, player);
    }
    
    updateChasing(deltaTime) {
        if (!this.target) return;
        
        const distance = this.position.distanceTo(this.target.position);
        
        // Maintain medium distance for psychic attacks
        const optimalDistance = 12;
        
        if (distance <= this.attackRange) {
            this.state = 'attacking';
            this.velocity.set(0, 0, 0);
        } else if (distance > this.sightRange) {
            this.state = 'idle';
        } else {
            // Move to optimal distance
            let direction;
            
            if (distance < optimalDistance - 3) {
                // Too close, back away
                direction = new THREE.Vector3()
                    .subVectors(this.position, this.target.position)
                    .normalize();
            } else if (distance > optimalDistance + 3) {
                // Too far, move closer
                direction = new THREE.Vector3()
                    .subVectors(this.target.position, this.position)
                    .normalize();
            } else {
                // Optimal distance, circle strafe
                const angle = Math.atan2(
                    this.position.z - this.target.position.z,
                    this.position.x - this.target.position.x
                );
                
                const strafeDir = Math.sin(Date.now() * 0.001) > 0 ? 1 : -1;
                direction = new THREE.Vector3(
                    -Math.sin(angle) * strafeDir,
                    0,
                    Math.cos(angle) * strafeDir
                );
            }
            
            direction.y = 0;
            this.velocity = direction.multiplyScalar(this.moveSpeed);
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        }
    }
    
    performAttack() {
        if (!this.target) return;
        
        const now = Date.now();
        if (now - this.lastPsychicTime < this.psychicCooldown) return;
        
        // Choose attack type
        const attackType = Math.random();
        
        if (attackType < 0.4) {
            // Psychic blast
            this.psychicBlast();
        } else if (attackType < 0.7) {
            // Charm attack
            this.charmAttack();
        } else {
            // Life drain
            this.lifeDrain();
        }
        
        this.lastPsychicTime = now;
    }
    
    psychicBlast() {
        // Create psychic wave
        const waveGeometry = new THREE.RingGeometry(0.5, 1, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(this.position);
        wave.lookAt(this.target.position);
        this.scene.add(wave);
        
        // Create beam effect
        const points = [
            this.position.clone(),
            this.target.position.clone()
        ];
        const beamGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const beamMaterial = new THREE.LineBasicMaterial({
            color: 0xff00ff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        const beam = new THREE.Line(beamGeometry, beamMaterial);
        this.scene.add(beam);
        
        // Animate wave and beam
        const animateAttack = () => {
            wave.scale.x += 0.3;
            wave.scale.y += 0.3;
            wave.position.add(
                new THREE.Vector3()
                    .subVectors(this.target.position, wave.position)
                    .normalize()
                    .multiplyScalar(0.5)
            );
            wave.material.opacity *= 0.9;
            beam.material.opacity *= 0.85;
            
            if (wave.material.opacity > 0.01) {
                requestAnimationFrame(animateAttack);
            } else {
                this.scene.remove(wave);
                this.scene.remove(beam);
            }
        };
        animateAttack();
        
        // Deal damage
        this.target.takeDamage(this.damage);
    }
    
    charmAttack() {
        // Create heart particles
        for (let i = 0; i < 5; i++) {
            const heartGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const heartMaterial = new THREE.MeshBasicMaterial({
                color: 0xff1493,
                transparent: true,
                opacity: 1
            });
            
            const heart = new THREE.Mesh(heartGeometry, heartMaterial);
            heart.position.copy(this.position);
            heart.position.y += 1;
            
            const targetPos = this.target.position.clone();
            targetPos.y += 1;
            
            this.scene.add(heart);
            
            // Animate heart
            const startTime = Date.now();
            const animateHeart = () => {
                const progress = (Date.now() - startTime) / 1000;
                
                if (progress < 1) {
                    heart.position.lerpVectors(this.position, targetPos, progress);
                    heart.position.y += Math.sin(progress * Math.PI * 3) * 0.5;
                    heart.scale.multiplyScalar(0.98);
                    requestAnimationFrame(animateHeart);
                } else {
                    this.scene.remove(heart);
                }
            };
            
            setTimeout(() => animateHeart(), i * 100);
        }
        
        // Apply charm effect (reverse controls)
        if (this.target.applyCharm) {
            this.target.applyCharm(this.charmDuration);
        }
        
        // Small damage
        this.target.takeDamage(this.damage * 0.5);
    }
    
    lifeDrain() {
        // Create drain particles
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 1
                })
            );
            
            // Start at target
            particle.position.copy(this.target.position);
            particle.position.x += (Math.random() - 0.5) * 1;
            particle.position.y += Math.random() * 2;
            particle.position.z += (Math.random() - 0.5) * 1;
            
            this.scene.add(particle);
            
            // Animate to succubus
            const startTime = Date.now();
            const startPos = particle.position.clone();
            const animateParticle = () => {
                const progress = (Date.now() - startTime) / 1500;
                
                if (progress < 1) {
                    particle.position.lerpVectors(startPos, this.position, progress);
                    particle.material.opacity = 1 - progress * 0.5;
                    requestAnimationFrame(animateParticle);
                } else {
                    this.scene.remove(particle);
                }
            };
            
            setTimeout(() => animateParticle(), i * 50);
        }
        
        // Damage target and heal self
        this.target.takeDamage(this.damage * 0.75);
        this.health = Math.min(this.maxHealth, this.health + this.damage * 0.5);
    }
    
    createIllusions() {
        // Clear old illusions
        this.clearIllusions();
        
        // Create 3 illusions
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const distance = 5;
            
            const illusionPos = new THREE.Vector3(
                this.position.x + Math.cos(angle) * distance,
                this.position.y,
                this.position.z + Math.sin(angle) * distance
            );
            
            // Create illusion mesh (semi-transparent copy)
            const illusionGroup = new THREE.Group();
            
            // Copy main mesh structure
            const bodyClone = this.bodyMesh.clone();
            bodyClone.material = bodyClone.material.clone();
            bodyClone.material.transparent = true;
            bodyClone.material.opacity = 0.5;
            illusionGroup.add(bodyClone);
            
            const headClone = this.headMesh.clone();
            headClone.material = headClone.material.clone();
            headClone.material.transparent = true;
            headClone.material.opacity = 0.5;
            illusionGroup.add(headClone);
            
            illusionGroup.position.copy(illusionPos);
            this.scene.add(illusionGroup);
            
            this.illusions.push({
                mesh: illusionGroup,
                lifetime: 10000,
                startTime: Date.now()
            });
        }
        
        // Teleport to random illusion position
        if (this.illusions.length > 0) {
            const randomIllusion = this.illusions[Math.floor(Math.random() * this.illusions.length)];
            const tempPos = this.position.clone();
            this.position.copy(randomIllusion.mesh.position);
            randomIllusion.mesh.position.copy(tempPos);
        }
    }
    
    updateIllusions(deltaTime) {
        const now = Date.now();
        
        for (let i = this.illusions.length - 1; i >= 0; i--) {
            const illusion = this.illusions[i];
            
            // Check lifetime
            if (now - illusion.startTime > illusion.lifetime) {
                this.scene.remove(illusion.mesh);
                this.illusions.splice(i, 1);
                continue;
            }
            
            // Fade out near end
            const timeLeft = illusion.lifetime - (now - illusion.startTime);
            if (timeLeft < 2000) {
                illusion.mesh.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = (timeLeft / 2000) * 0.5;
                    }
                });
            }
            
            // Float animation
            illusion.mesh.position.y = this.baseHeight + Math.sin((now * 0.002) + i) * 0.3;
        }
    }
    
    clearIllusions() {
        this.illusions.forEach(illusion => {
            this.scene.remove(illusion.mesh);
        });
        this.illusions = [];
    }
    
    teleportAway(player) {
        // Create portal effect at current position
        this.createPortalEffect(this.position.clone());
        
        // Find safe position away from player
        let attempts = 0;
        let newPosition;
        
        do {
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.random() * 7;
            
            newPosition = new THREE.Vector3(
                player.position.x + Math.cos(angle) * distance,
                this.baseHeight,
                player.position.z + Math.sin(angle) * distance
            );
            
            attempts++;
        } while (newPosition.distanceTo(player.position) < 5 && attempts < 10);
        
        // Teleport
        this.position.copy(newPosition);
        
        // Create portal at new position
        this.createPortalEffect(newPosition);
        
        // Clear any charm effects
        this.state = 'idle';
    }
    
    createPortalEffect(position) {
        // Create spiral portal
        const portalGeometry = new THREE.TorusGeometry(1, 0.3, 8, 16);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.8
        });
        
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.position.copy(position);
        portal.rotation.x = Math.PI / 2;
        this.scene.add(portal);
        
        // Animate portal
        const animatePortal = () => {
            portal.rotation.z += 0.2;
            portal.scale.multiplyScalar(0.95);
            portal.material.opacity *= 0.92;
            
            if (portal.material.opacity > 0.01) {
                requestAnimationFrame(animatePortal);
            } else {
                this.scene.remove(portal);
            }
        };
        animatePortal();
    }
    
    takeDamage(damage, damageType = 'normal') {
        // Holy damage is very effective
        if (damageType === 'holy') {
            damage *= 3;
        }
        
        super.takeDamage(damage);
        
        // Chance to teleport when hit
        if (Math.random() < 0.4 && this.health > 0) {
            const now = Date.now();
            if (now - this.lastTeleportTime > 1000) { // Quick teleport cooldown when damaged
                this.teleportAway(this.target);
                this.lastTeleportTime = now;
            }
        }
    }
    
    onDeath() {
        super.onDeath();
        
        // Clear illusions
        this.clearIllusions();
        
        // Create banishment effect
        this.createBanishmentEffect();
    }
    
    createBanishmentEffect() {
        // Create imploding vortex
        const vortexGeometry = new THREE.ConeGeometry(2, 3, 16);
        const vortexMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.position.copy(this.position);
        vortex.position.y += 1;
        this.scene.add(vortex);
        
        // Animate vortex
        const animateVortex = () => {
            vortex.rotation.y += 0.3;
            vortex.scale.x *= 0.95;
            vortex.scale.z *= 0.95;
            vortex.scale.y *= 1.05;
            vortex.material.opacity *= 0.95;
            
            if (vortex.material.opacity > 0.01) {
                requestAnimationFrame(animateVortex);
            } else {
                this.scene.remove(vortex);
            }
        };
        animateVortex();
    }
}
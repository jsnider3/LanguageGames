
import { THEME } from '../modules/config/theme.js';
import * as THREE from 'three';
import { resourcePool } from '../modules/ResourcePool.js';
// Visual Effects System for SaintDoom
// Holy light, demonic corruption, and particle effects

export class VisualEffects {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
        this.particlePools = {
            holy: [],
            demonic: [],
            blood: [],
            smoke: [],
            sparks: []
        };
        
        this.initializeParticlePools();
    }
    
    initializeParticlePools() {
        // Pre-create particles for performance
        const poolSize = 50;
        
        // Holy particles
        for (let i = 0; i < poolSize; i++) {
            const particle = new THREE.Mesh(
                resourcePool.getGeometry('sphere', 0.1, 4, 4),
                resourcePool.getMaterial('basic', {
                    color: THEME.lights.point.holy,
                    transparent: true,
                    opacity: 0
                })
            );
            particle.visible = false;
            this.scene.add(particle);
            this.particlePools.holy.push({
                mesh: particle,
                active: false,
                velocity: new THREE.Vector3(),
                lifetime: 0
            });
        }
        
        // Demonic particles
        for (let i = 0; i < poolSize; i++) {
            const particle = new THREE.Mesh(
                resourcePool.getGeometry('box', 0.15, 0.15, 0.15),
                resourcePool.getMaterial('basic', {
                    color: THEME.effects.blood.human,
                    transparent: true,
                    opacity: 0
                })
            );
            particle.visible = false;
            this.scene.add(particle);
            this.particlePools.demonic.push({
                mesh: particle,
                active: false,
                velocity: new THREE.Vector3(),
                lifetime: 0
            });
        }
        
        // Blood particles
        for (let i = 0; i < poolSize; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 3, 3),
                new THREE.MeshBasicMaterial({
                    color: THEME.effects.blood.demon,
                    transparent: true,
                    opacity: 0
                })
            );
            particle.visible = false;
            this.scene.add(particle);
            this.particlePools.blood.push({
                mesh: particle,
                active: false,
                velocity: new THREE.Vector3(),
                lifetime: 0,
                gravity: -9.8
            });
        }
    }
    
    // ============= HOLY EFFECTS =============
    
    createHolyBurst(position, intensity = 1) {
        // Central flash
        const flash = new THREE.PointLight(THEME.lights.point.holy, intensity * 5, 20);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Expanding ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0, 0.5, 32),
            new THREE.MeshBasicMaterial({
                color: THEME.lights.point.holy,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        this.activeEffects.push({
            type: 'holy_burst',
            mesh: ring,
            light: flash,
            duration: 1000,
            currentTime: 0,
            radius: 0.5,
            opacity: 0.8
        });
        
        // Spawn holy particles
        this.spawnParticleBurst(position, 'holy', 20, intensity);
    }
    
    createHolyBeam(startPos, endPos, duration = 1000) {
        // Create beam geometry
        const direction = new THREE.Vector3().subVectors(endPos, startPos);
        const distance = direction.length();
        direction.normalize();
        
        const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, distance, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: THEME.lights.point.holy,
            transparent: true,
            opacity: 0.6
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position and rotate beam
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        beam.position.copy(midpoint);
        beam.lookAt(endPos);
        beam.rotateX(Math.PI / 2);
        
        this.scene.add(beam);
        
        // Add glow
        const glowLight = new THREE.PointLight(THEME.lights.point.holy, 2, distance * 1.5);
        glowLight.position.copy(midpoint);
        this.scene.add(glowLight);
        
        this.activeEffects.push({
            type: 'holy_beam',
            mesh: beam,
            light: glowLight,
            duration: duration,
            currentTime: 0
        });
    }
    
    createBlessingAura(target, duration = 3000) {
        // Golden aura around target
        const auraParticles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffdd00,
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 1.5;
            
            particle.userData = {
                angle: angle,
                radius: radius,
                speed: 1 + Math.random(),
                verticalSpeed: Math.random() * 0.5
            };
            
            auraParticles.push(particle);
            this.scene.add(particle);
        }
        
        this.activeEffects.push({
            type: 'blessing_aura',
            particles: auraParticles,
            target: target,
            duration: duration,
            currentTime: 0
        });
    }
    
    // ============= DEMONIC EFFECTS =============
    
    createDemonicPortal(position, radius = 3) {
        // Swirling portal on ground
        const portal = new THREE.Mesh(
            new THREE.RingGeometry(radius * 0.8, radius, 32),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            })
        );
        
        portal.position.copy(position);
        portal.position.y = 0.1;
        portal.rotation.x = -Math.PI / 2;
        this.scene.add(portal);
        
        // Inner vortex
        const vortex = new THREE.Mesh(
            resourcePool.getGeometry('cone', radius * 0.5, 2, 8),
            resourcePool.getMaterial('basic', {
                color: 0x000000,
                transparent: true,
                opacity: 0.8
            })
        );
        vortex.position.copy(position);
        vortex.position.y = -1;
        vortex.rotation.x = Math.PI;
        this.scene.add(vortex);
        
        // Particles spiraling up
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 0.1),
                new THREE.MeshBasicMaterial({
                    color: THEME.effects.blood.human,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            particle.userData = {
                angle: Math.random() * Math.PI * 2,
                radius: Math.random() * radius,
                speed: 0.5 + Math.random(),
                height: 0
            };
            
            particles.push(particle);
            this.scene.add(particle);
        }
        
        const effect = {
            type: 'portal',
            elements: [portal, vortex, ...particles],
            duration: Infinity, // Lasts until removed
            currentTime: 0,
            remove: () => {
                effect.elements.forEach(el => this.scene.remove(el));
                const index = this.activeEffects.indexOf(effect);
                if (index > -1) this.activeEffects.splice(index, 1);
            }
        };
        
        this.activeEffects.push(effect);
        return effect;
    }
    
    createCorruption(position, radius = 5, duration = 5000) {
        // Spreading corruption on ground
        const corruption = new THREE.Mesh(
            new THREE.CircleGeometry(0.1, 32),
            new THREE.MeshBasicMaterial({
                color: 0x440044,
                transparent: true,
                opacity: 0.6
            })
        );
        
        corruption.position.copy(position);
        corruption.position.y = 0.05;
        corruption.rotation.x = -Math.PI / 2;
        this.scene.add(corruption);
        
        this.activeEffects.push({
            type: 'corruption',
            mesh: corruption,
            duration: duration,
            currentTime: 0,
            radius: radius
        });
        
        // Emit corruption particles
        this.spawnParticleBurst(position, 'demonic', 10, 0.5);
    }
    
    createDemonicClaw(position, direction) {
        // Three claw marks
        const clawMarks = [];
        
        for (let i = -1; i <= 1; i++) {
            const claw = new THREE.Mesh(
                new THREE.PlaneGeometry(0.2, 3),
                new THREE.MeshBasicMaterial({
                    color: THEME.effects.blood.human,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                })
            );
            
            claw.position.copy(position);
            claw.position.x += i * 0.3;
            claw.lookAt(position.clone().add(direction));
            
            this.scene.add(claw);
            clawMarks.push(claw);
        }
        
        this.activeEffects.push({
            type: 'demonic_claw',
            elements: clawMarks,
            duration: 1000,
            currentTime: 0
        });
    }
    
    // ============= COMBAT EFFECTS =============
    
    createBloodSplatter(position, direction, intensity = 1) {
        const particles = this.getAvailableParticles('blood', 10 * intensity);
        
        particles.forEach(particle => {
            particle.mesh.position.copy(position);
            particle.velocity.set(
                direction.x + (Math.random() - 0.5) * 2,
                Math.random() * 3 + 1,
                direction.z + (Math.random() - 0.5) * 2
            );
            particle.lifetime = 1000;
            particle.active = true;
            particle.mesh.visible = true;
            particle.mesh.material.opacity = 0.8;
        });
    }
    
    createImpactSpark(position, normal) {
        // Bright flash at impact point
        const flash = new THREE.PointLight(THEME.effects.explosion.holy, 3, 5);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Spark particles
        for (let i = 0; i < 5; i++) {
            const spark = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.05, 0.2),
                new THREE.MeshBasicMaterial({
                    color: THEME.effects.explosion.holy,
                    transparent: true,
                    opacity: 1
                })
            );
            
            spark.position.copy(position);
            
            // Random direction based on normal
            const velocity = normal.clone().multiplyScalar(5);
            velocity.x += (Math.random() - 0.5) * 3;
            velocity.y += Math.random() * 2;
            velocity.z += (Math.random() - 0.5) * 3;
            
            this.scene.add(spark);
            
            this.activeEffects.push({
                type: 'impact_spark',
                mesh: spark,
                velocity: velocity,
                duration: 1000,
                currentTime: 0
            });
        }
        
        // Remove flash
        setTimeout(() => this.scene.remove(flash), 100);
    }
    
    createMuzzleFlash(position, direction) {
        // Flash light
        const flash = new THREE.PointLight(THEME.effects.explosion.fire, 5, 10);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Flash mesh
        const flashMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 4),
            new THREE.MeshBasicMaterial({
                color: THEME.effects.explosion.holy,
                transparent: true,
                opacity: 0.8
            })
        );
        flashMesh.position.copy(position);
        this.scene.add(flashMesh);
        
        // Smoke
        const smoke = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 6, 4),
            new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.5
            })
        );
        smoke.position.copy(position);
        this.scene.add(smoke);
        
        this.activeEffects.push({
            type: 'muzzle_flash',
            elements: [flash, flashMesh, smoke],
            direction: direction,
            duration: 1000,
            currentTime: 0
        });
    }
    
    // ============= ENVIRONMENTAL EFFECTS =============
    
    createFog(density = 0.02) {
        this.scene.fog = new THREE.FogExp2(0x000000, density);
    }
    
    createLightning(startY = 20) {
        // Random position in view
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        
        // Lightning bolt geometry
        const points = [];
        let currentY = startY;
        let currentX = x;
        let currentZ = z;
        
        points.push(new THREE.Vector3(currentX, currentY, currentZ));
        
        // Create jagged path down
        while (currentY > 0) {
            currentY -= Math.random() * 3 + 1;
            currentX += (Math.random() - 0.5) * 2;
            currentZ += (Math.random() - 0.5) * 2;
            points.push(new THREE.Vector3(currentX, currentY, currentZ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 3
        });
        
        const lightning = new THREE.Line(geometry, material);
        this.scene.add(lightning);
        
        // Flash
        const flash = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(flash);
        
        // Remove after short time
        setTimeout(() => {
            this.scene.remove(lightning);
            this.scene.remove(flash);
        }, 100);
    }
    
    // ============= PARTICLE SYSTEM =============
    
    spawnParticleBurst(position, type, count, intensity = 1) {
        const particles = this.getAvailableParticles(type, count);
        
        particles.forEach(particle => {
            particle.mesh.position.copy(position);
            
            // Random velocity
            particle.velocity.set(
                (Math.random() - 0.5) * 5 * intensity,
                Math.random() * 5 * intensity,
                (Math.random() - 0.5) * 5 * intensity
            );
            
            particle.lifetime = 1000 + Math.random() * 1000;
            particle.active = true;
            particle.mesh.visible = true;
            particle.mesh.material.opacity = 0.8;
        });
    }
    
    getAvailableParticles(type, count) {
        const pool = this.particlePools[type];
        const available = [];
        
        for (let i = 0; i < pool.length && available.length < count; i++) {
            if (!pool[i].active) {
                available.push(pool[i]);
            }
        }
        
        return available;
    }
    
    update(deltaTime) {
        // Update all particle pools
        Object.keys(this.particlePools).forEach(type => {
            this.particlePools[type].forEach(particle => {
                if (particle.active) {
                    // Update position
                    particle.mesh.position.add(
                        particle.velocity.clone().multiplyScalar(deltaTime)
                    );
                    
                    // Apply gravity if applicable
                    if (particle.gravity) {
                        particle.velocity.y += particle.gravity * deltaTime;
                    }
                    
                    // Update lifetime
                    particle.lifetime -= deltaTime * 1000;
                    
                    // Fade out
                    const fadeStart = 500;
                    if (particle.lifetime < fadeStart) {
                        particle.mesh.material.opacity = (particle.lifetime / fadeStart) * 0.8;
                    }
                    
                    // Deactivate if expired
                    if (particle.lifetime <= 0) {
                        particle.active = false;
                        particle.mesh.visible = false;
                        particle.velocity.set(0, 0, 0);
                    }
                }
            });
        });

        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.currentTime += deltaTime;
            const progress = effect.currentTime / effect.duration;

            if (progress >= 1) {
                if (effect.type === 'portal') {
                    effect.remove();
                } else {
                    this.scene.remove(effect.mesh || effect.elements[0].parent);
                }
                return false;
            }

            switch (effect.type) {
                case 'holy_burst':
                    effect.radius += 0.3;
                    effect.opacity -= 0.02;
                    effect.light.intensity *= 0.9;
                    effect.mesh.geometry.dispose();
                    effect.mesh.geometry = resourcePool.getGeometry('ring', effect.radius - 0.2, effect.radius, 32);
                    effect.mesh.material.opacity = effect.opacity;
                    break;
                case 'holy_beam':
                    effect.mesh.material.opacity = 0.6 + Math.sin(effect.currentTime * 10) * 0.3;
                    effect.mesh.scale.x = effect.mesh.scale.z = 1 + Math.sin(effect.currentTime * 20) * 0.2;
                    if (progress > 0.8) {
                        effect.light.intensity -= 0.1;
                    }
                    break;
                case 'blessing_aura':
                    effect.particles.forEach(particle => {
                        particle.userData.angle += particle.userData.speed * 0.02;
                        particle.position.x = effect.target.position.x + Math.cos(particle.userData.angle) * particle.userData.radius;
                        particle.position.z = effect.target.position.z + Math.sin(particle.userData.angle) * particle.userData.radius;
                        particle.position.y = effect.target.position.y + Math.sin(effect.currentTime * particle.userData.verticalSpeed) * 0.5 + 1;
                        if (effect.currentTime < 300) {
                            particle.material.opacity = (effect.currentTime / 300) * 0.6;
                        } else if (effect.currentTime > effect.duration - 300) {
                            particle.material.opacity = ((effect.duration - effect.currentTime) / 300) * 0.6;
                        }
                    });
                    break;
                case 'portal':
                    effect.elements[0].rotation.z += 0.02;
                    effect.elements[1].rotation.y += 0.05;
                    effect.elements.slice(2).forEach(particle => {
                        particle.userData.angle += particle.userData.speed * 0.05;
                        particle.userData.height += 0.05;
                        if (particle.userData.height > 5) {
                            particle.userData.height = 0;
                            particle.userData.radius = Math.random() * 3;
                        }
                        particle.position.x = effect.elements[0].position.x + Math.cos(particle.userData.angle) * particle.userData.radius;
                        particle.position.z = effect.elements[0].position.z + Math.sin(particle.userData.angle) * particle.userData.radius;
                        particle.position.y = effect.elements[0].position.y + particle.userData.height;
                        particle.material.opacity = 0.7 * (1 - particle.userData.height / 5);
                    });
                    break;
                case 'corruption':
                    const currentRadius = effect.radius * progress;
                    effect.mesh.geometry.dispose();
                    effect.mesh.geometry = new THREE.CircleGeometry(currentRadius, 32);
                    if (progress > 0.8) {
                        effect.mesh.material.opacity = 0.6 * (1 - (progress - 0.8) / 0.2);
                    }
                    break;
                case 'demonic_claw':
                    effect.elements.forEach(claw => {
                        claw.material.opacity -= 0.05;
                        claw.scale.y *= 0.95;
                    });
                    break;
                case 'impact_spark':
                    effect.mesh.position.add(effect.velocity.clone().multiplyScalar(deltaTime));
                    effect.velocity.y -= 0.3;
                    effect.mesh.material.opacity -= 0.05;
                    break;
                case 'muzzle_flash':
                    effect.elements[1].scale.x += 0.1;
                    effect.elements[1].scale.y += 0.1;
                    effect.elements[1].scale.z += 0.1;
                    effect.elements[1].material.opacity -= 0.1;
                    effect.elements[2].scale.multiplyScalar(1.05);
                    effect.elements[2].material.opacity -= 0.05;
                    effect.elements[2].position.add(effect.direction.clone().multiplyScalar(0.05));
                    effect.elements[0].intensity *= 0.7;
                    break;
            }
            return true;
        });
    }
    
    cleanup() {
        // Clean up all active effects
        this.activeEffects.forEach(effect => {
            if (effect.type === 'portal') {
                effect.remove();
            } else if (effect.elements) {
                effect.elements.forEach(element => {
                    this.scene.remove(element);
                });
            } else if (effect.mesh) {
                this.scene.remove(effect.mesh);
            }
        });
        this.activeEffects = [];
    }
}
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
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({
                    color: 0xffffaa,
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
                new THREE.BoxGeometry(0.15, 0.15, 0.15),
                new THREE.MeshBasicMaterial({
                    color: 0xff0000,
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
                    color: 0x660000,
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
        const flash = new THREE.PointLight(0xffffaa, intensity * 5, 20);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Expanding ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0, 0.5, 32),
            new THREE.MeshBasicMaterial({
                color: 0xffffaa,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        ring.position.copy(position);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        // Animate expansion
        let radius = 0.5;
        let opacity = 0.8;
        
        const expand = setInterval(() => {
            radius += 0.3;
            opacity -= 0.02;
            flash.intensity *= 0.9;
            
            ring.geometry = new THREE.RingGeometry(radius - 0.2, radius, 32);
            ring.material.opacity = opacity;
            
            if (opacity <= 0) {
                clearInterval(expand);
                this.scene.remove(ring);
                this.scene.remove(flash);
            }
        }, 16);
        
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
            color: 0xffffaa,
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
        const glowLight = new THREE.PointLight(0xffffaa, 2, distance * 1.5);
        glowLight.position.copy(midpoint);
        this.scene.add(glowLight);
        
        // Pulse animation
        let time = 0;
        const pulse = setInterval(() => {
            time += 50;
            beam.material.opacity = 0.6 + Math.sin(time * 0.01) * 0.3;
            beam.scale.x = beam.scale.z = 1 + Math.sin(time * 0.02) * 0.2;
            
            if (time >= duration) {
                clearInterval(pulse);
                
                // Fade out
                const fade = setInterval(() => {
                    beam.material.opacity -= 0.05;
                    glowLight.intensity -= 0.1;
                    
                    if (beam.material.opacity <= 0) {
                        clearInterval(fade);
                        this.scene.remove(beam);
                        this.scene.remove(glowLight);
                    }
                }, 50);
            }
        }, 50);
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
        
        let elapsed = 0;
        const animateAura = setInterval(() => {
            elapsed += 16;
            
            auraParticles.forEach((particle, i) => {
                particle.userData.angle += particle.userData.speed * 0.02;
                
                particle.position.x = target.position.x + Math.cos(particle.userData.angle) * particle.userData.radius;
                particle.position.z = target.position.z + Math.sin(particle.userData.angle) * particle.userData.radius;
                particle.position.y = target.position.y + Math.sin(elapsed * 0.001 * particle.userData.verticalSpeed) * 0.5 + 1;
                
                // Fade in/out
                if (elapsed < 300) {
                    particle.material.opacity = (elapsed / 300) * 0.6;
                } else if (elapsed > duration - 300) {
                    particle.material.opacity = ((duration - elapsed) / 300) * 0.6;
                }
            });
            
            if (elapsed >= duration) {
                clearInterval(animateAura);
                auraParticles.forEach(p => this.scene.remove(p));
            }
        }, 16);
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
            new THREE.ConeGeometry(radius * 0.5, 2, 8),
            new THREE.MeshBasicMaterial({
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
                    color: 0xff0000,
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
        
        // Animate portal
        const animatePortal = setInterval(() => {
            portal.rotation.z += 0.02;
            vortex.rotation.y += 0.05;
            
            particles.forEach(particle => {
                particle.userData.angle += particle.userData.speed * 0.05;
                particle.userData.height += 0.05;
                
                if (particle.userData.height > 5) {
                    particle.userData.height = 0;
                    particle.userData.radius = Math.random() * radius;
                }
                
                particle.position.x = position.x + Math.cos(particle.userData.angle) * particle.userData.radius;
                particle.position.z = position.z + Math.sin(particle.userData.angle) * particle.userData.radius;
                particle.position.y = position.y + particle.userData.height;
                
                particle.material.opacity = 0.7 * (1 - particle.userData.height / 5);
            });
        }, 16);
        
        // Store for cleanup
        this.activeEffects.push({
            type: 'portal',
            elements: [portal, vortex, ...particles],
            interval: animatePortal
        });
        
        return {
            remove: () => {
                clearInterval(animatePortal);
                this.scene.remove(portal);
                this.scene.remove(vortex);
                particles.forEach(p => this.scene.remove(p));
            }
        };
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
        
        // Grow corruption
        let currentRadius = 0.1;
        const growSpeed = radius / (duration / 100);
        
        const grow = setInterval(() => {
            currentRadius += growSpeed;
            corruption.geometry = new THREE.CircleGeometry(currentRadius, 32);
            
            if (currentRadius >= radius) {
                clearInterval(grow);
                
                // Start shrinking after delay
                setTimeout(() => {
                    const shrink = setInterval(() => {
                        currentRadius -= growSpeed * 2;
                        corruption.geometry = new THREE.CircleGeometry(Math.max(0, currentRadius), 32);
                        corruption.material.opacity = 0.6 * (currentRadius / radius);
                        
                        if (currentRadius <= 0) {
                            clearInterval(shrink);
                            this.scene.remove(corruption);
                        }
                    }, 50);
                }, 1000);
            }
        }, 100);
        
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
                    color: 0xff0000,
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
        
        // Animate slash
        let opacity = 0.8;
        const fade = setInterval(() => {
            opacity -= 0.05;
            clawMarks.forEach(claw => {
                claw.material.opacity = opacity;
                claw.scale.y *= 0.95;
            });
            
            if (opacity <= 0) {
                clearInterval(fade);
                clawMarks.forEach(claw => this.scene.remove(claw));
            }
        }, 50);
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
        const flash = new THREE.PointLight(0xffff00, 3, 5);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Spark particles
        for (let i = 0; i < 5; i++) {
            const spark = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.05, 0.2),
                new THREE.MeshBasicMaterial({
                    color: 0xffff00,
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
            
            // Animate spark
            const animateSpark = setInterval(() => {
                spark.position.add(velocity.clone().multiplyScalar(0.016));
                velocity.y -= 0.3; // Gravity
                spark.material.opacity -= 0.05;
                
                if (spark.material.opacity <= 0) {
                    clearInterval(animateSpark);
                    this.scene.remove(spark);
                }
            }, 16);
        }
        
        // Remove flash
        setTimeout(() => this.scene.remove(flash), 100);
    }
    
    createMuzzleFlash(position, direction) {
        // Flash light
        const flash = new THREE.PointLight(0xffaa00, 5, 10);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Flash mesh
        const flashMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 8, 4),
            new THREE.MeshBasicMaterial({
                color: 0xffff00,
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
        
        // Animate
        let scale = 1;
        const animate = setInterval(() => {
            scale += 0.1;
            flashMesh.scale.set(scale, scale, scale);
            flashMesh.material.opacity -= 0.1;
            
            smoke.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
            smoke.material.opacity -= 0.05;
            smoke.position.add(direction.clone().multiplyScalar(0.05));
            
            flash.intensity *= 0.7;
            
            if (flashMesh.material.opacity <= 0) {
                clearInterval(animate);
                this.scene.remove(flash);
                this.scene.remove(flashMesh);
                this.scene.remove(smoke);
            }
        }, 16);
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
    }
    
    cleanup() {
        // Clean up all active effects
        this.activeEffects.forEach(effect => {
            if (effect.interval) {
                clearInterval(effect.interval);
            }
            effect.elements.forEach(element => {
                this.scene.remove(element);
            });
        });
        this.activeEffects = [];
    }
}
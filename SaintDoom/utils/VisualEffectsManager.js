import * as THREE from 'three';

export class VisualEffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = new Set();
        this.particlePools = new Map();
    }

    createParticleExplosion(position, config = {}) {
        const defaults = {
            count: 20,
            color: 0xff0000,
            size: 0.1,
            speed: 5,
            lifetime: 1000,
            gravity: true,
            fadeOut: true
        };
        
        const settings = { ...defaults, ...config };
        const particles = [];
        
        for (let i = 0; i < settings.count; i++) {
            const geometry = new THREE.SphereGeometry(settings.size, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: settings.color,
                transparent: true,
                opacity: 1.0
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * settings.speed,
                Math.random() * settings.speed,
                (Math.random() - 0.5) * settings.speed
            );
            
            this.scene.add(particle);
            particles.push({ mesh: particle, velocity, lifetime: settings.lifetime });
        }
        
        this.animateParticles(particles, settings);
        return particles;
    }

    animateParticles(particles, settings) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / settings.lifetime;
            
            particles.forEach(p => {
                if (!p.mesh.parent) return;
                
                p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
                
                if (settings.gravity) {
                    p.velocity.y -= 0.3;
                }
                
                if (settings.fadeOut) {
                    p.mesh.material.opacity = 1 - progress;
                }
                
                p.mesh.scale.setScalar(1 - progress * 0.5);
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particles.forEach(p => {
                    if (p.mesh.parent) {
                        this.scene.remove(p.mesh);
                        p.mesh.geometry.dispose();
                        p.mesh.material.dispose();
                    }
                });
            }
        };
        
        animate();
    }

    createMuzzleFlash(position, intensity = 1, color = 0xffff00) {
        const flashGroup = new THREE.Group();
        
        const flashGeometry = new THREE.SphereGeometry(0.3 * intensity, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flashGroup.add(flash);
        
        const lightGeometry = new THREE.SphereGeometry(0.5 * intensity, 6, 6);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        flashGroup.add(light);
        
        flashGroup.position.copy(position);
        this.scene.add(flashGroup);
        
        setTimeout(() => {
            this.scene.remove(flashGroup);
            flashGeometry.dispose();
            flashMaterial.dispose();
            lightGeometry.dispose();
            lightMaterial.dispose();
        }, 100);
        
        return flashGroup;
    }

    createTrailEffect(startPos, endPos, config = {}) {
        const defaults = {
            color: 0x00ff00,
            width: 0.1,
            opacity: 0.7,
            lifetime: 500
        };
        
        const settings = { ...defaults, ...config };
        const distance = startPos.distanceTo(endPos);
        
        const geometry = new THREE.CylinderGeometry(
            settings.width, 
            settings.width, 
            distance, 
            8
        );
        const material = new THREE.MeshBasicMaterial({
            color: settings.color,
            transparent: true,
            opacity: settings.opacity
        });
        const trail = new THREE.Mesh(geometry, material);
        
        trail.position.copy(startPos.clone().lerp(endPos, 0.5));
        trail.lookAt(endPos);
        trail.rotateX(Math.PI / 2);
        
        this.scene.add(trail);
        
        this.animateFadeOut(trail, settings.lifetime);
        return trail;
    }

    animateFadeOut(mesh, duration) {
        const startTime = Date.now();
        const initialOpacity = mesh.material.opacity || 1;
        
        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (mesh.material) {
                mesh.material.opacity = initialOpacity * (1 - progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                if (mesh.parent) {
                    this.scene.remove(mesh);
                    if (mesh.geometry) mesh.geometry.dispose();
                    if (mesh.material) mesh.material.dispose();
                }
            }
        };
        
        fade();
    }

    createRingExplosion(position, config = {}) {
        const defaults = {
            innerRadius: 0.5,
            outerRadius: 2,
            color: 0xff0000,
            expansionSpeed: 10,
            lifetime: 1000,
            height: 0.1
        };
        
        const settings = { ...defaults, ...config };
        
        const geometry = new THREE.RingGeometry(
            settings.innerRadius,
            settings.outerRadius,
            32
        );
        const material = new THREE.MeshBasicMaterial({
            color: settings.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(position);
        
        this.scene.add(ring);
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / settings.lifetime;
            
            const scale = 1 + progress * settings.expansionSpeed;
            ring.scale.setScalar(scale);
            ring.material.opacity = 0.8 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                geometry.dispose();
                material.dispose();
            }
        };
        
        animate();
        return ring;
    }

    createGeneralExplosion(position, config = {}) {
        const defaults = {
            type: 'sphere', // 'sphere', 'ring', 'particles', or 'combined'
            color: 0xff6600,
            radius: 3,
            duration: 1000,
            particleCount: 20,
            emissiveIntensity: 1.0,
            soundEffect: null,
            damage: 0,
            knockback: 0
        };

        const settings = { ...defaults, ...config };

        if (settings.type.includes('sphere')) {
            const geometry = new THREE.SphereGeometry(settings.radius * 0.1, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: settings.color,
                transparent: true,
                opacity: 1.0,
                emissive: settings.color,
                emissiveIntensity: settings.emissiveIntensity
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(position);
            this.scene.add(sphere);

            this.activeEffects.add({
                mesh: sphere,
                type: 'explosion_sphere',
                duration: settings.duration,
                currentTime: 0,
                scaleRate: settings.radius / (settings.duration / 16),
                opacityRate: 1.0 / (settings.duration / 16)
            });
        }

        if (settings.type.includes('ring')) {
            this.createRingExplosion(position, {
                innerRadius: settings.radius * 0.1,
                outerRadius: settings.radius,
                color: settings.color,
                expansionSpeed: settings.radius / (settings.duration / 16),
                lifetime: settings.duration
            });
        }

        if (settings.type.includes('particles')) {
            this.createParticleExplosion(position, {
                count: settings.particleCount,
                color: settings.color,
                size: settings.radius * 0.05,
                speed: settings.radius * 0.5,
                lifetime: settings.duration,
                gravity: true,
                fadeOut: true
            });
        }

        // Handle damage and knockback (this would typically be handled by game logic, but for centralization, we can add it here)
        // if (settings.damage > 0) {
        //     // Apply damage to nearby entities
        // }
        // if (settings.knockback > 0) {
        //     // Apply knockback to nearby entities
        // }

        // Play sound effect
        // if (settings.soundEffect) {
        //     // Play sound
        // }
    }

    createLightningBolt(startPos, endPos, config = {}) {
        const defaults = {
            segments: 10,
            deviation: 1,
            color: 0x00ffff,
            width: 0.05,
            lifetime: 200
        };
        
        const settings = { ...defaults, ...config };
        const points = [];
        
        points.push(startPos.clone());
        
        const direction = endPos.clone().sub(startPos);
        const segmentLength = direction.length() / settings.segments;
        direction.normalize();
        
        for (let i = 1; i < settings.segments; i++) {
            const basePoint = startPos.clone().add(
                direction.clone().multiplyScalar(segmentLength * i)
            );
            
            basePoint.x += (Math.random() - 0.5) * settings.deviation;
            basePoint.y += (Math.random() - 0.5) * settings.deviation;
            basePoint.z += (Math.random() - 0.5) * settings.deviation;
            
            points.push(basePoint);
        }
        
        points.push(endPos.clone());
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: settings.color,
            linewidth: settings.width * 100,
            transparent: true,
            opacity: 1
        });
        const lightning = new THREE.Line(geometry, material);
        
        this.scene.add(lightning);
        
        setTimeout(() => {
            this.scene.remove(lightning);
            geometry.dispose();
            material.dispose();
        }, settings.lifetime);
        
        return lightning;
    }

    createSmokeEffect(position, config = {}) {
        const defaults = {
            count: 10,
            color: 0x333333,
            size: 0.5,
            riseSpeed: 1,
            spread: 2,
            lifetime: 3000
        };
        
        const settings = { ...defaults, ...config };
        const smokeParticles = [];
        
        for (let i = 0; i < settings.count; i++) {
            const geometry = new THREE.SphereGeometry(settings.size, 6, 6);
            const material = new THREE.MeshBasicMaterial({
                color: settings.color,
                transparent: true,
                opacity: 0.6
            });
            const smoke = new THREE.Mesh(geometry, material);
            
            smoke.position.copy(position);
            smoke.position.x += (Math.random() - 0.5) * settings.spread;
            smoke.position.z += (Math.random() - 0.5) * settings.spread;
            
            this.scene.add(smoke);
            smokeParticles.push({
                mesh: smoke,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    settings.riseSpeed,
                    (Math.random() - 0.5) * 0.5
                )
            });
        }
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / settings.lifetime;
            
            smokeParticles.forEach(s => {
                if (!s.mesh.parent) return;
                
                s.mesh.position.add(s.velocity.clone().multiplyScalar(0.016));
                s.mesh.scale.setScalar(1 + progress);
                s.mesh.material.opacity = 0.6 * (1 - progress);
                s.velocity.multiplyScalar(0.98);
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                smokeParticles.forEach(s => {
                    if (s.mesh.parent) {
                        this.scene.remove(s.mesh);
                        s.mesh.geometry.dispose();
                        s.mesh.material.dispose();
                    }
                });
            }
        };
        
        animate();
        return smokeParticles;
    }

    createShieldHitEffect(position, normal, config = {}) {
        const defaults = {
            color: 0x00aaff,
            size: 1,
            rippleCount: 3,
            lifetime: 500
        };
        
        const settings = { ...defaults, ...config };
        
        const ripples = [];
        for (let i = 0; i < settings.rippleCount; i++) {
            setTimeout(() => {
                const geometry = new THREE.RingGeometry(0.1, settings.size, 16);
                const material = new THREE.MeshBasicMaterial({
                    color: settings.color,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const ripple = new THREE.Mesh(geometry, material);
                
                ripple.position.copy(position);
                if (normal) {
                    ripple.lookAt(position.clone().add(normal));
                }
                
                this.scene.add(ripple);
                
                const startTime = Date.now();
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = elapsed / settings.lifetime;
                    
                    ripple.scale.setScalar(1 + progress * 2);
                    ripple.material.opacity = 0.7 * (1 - progress);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.scene.remove(ripple);
                        geometry.dispose();
                        material.dispose();
                    }
                };
                
                animate();
            }, i * 100);
        }
    }

    createBloodSplatter(position, direction, config = {}) {
        const defaults = {
            count: 15,
            color: 0x660000,
            size: 0.1,
            speed: 3,
            gravity: true
        };
        
        const settings = { ...defaults, ...config };
        
        for (let i = 0; i < settings.count; i++) {
            const geometry = new THREE.SphereGeometry(settings.size * (0.5 + Math.random() * 0.5), 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: settings.color,
                transparent: true,
                opacity: 0.9
            });
            const blood = new THREE.Mesh(geometry, material);
            
            blood.position.copy(position);
            
            const velocity = direction ? direction.clone() : new THREE.Vector3(0, 1, 0);
            velocity.x += (Math.random() - 0.5) * settings.speed;
            velocity.y += Math.random() * settings.speed;
            velocity.z += (Math.random() - 0.5) * settings.speed;
            
            this.scene.add(blood);
            
            const animate = () => {
                blood.position.add(velocity.clone().multiplyScalar(0.016));
                
                if (settings.gravity) {
                    velocity.y -= 0.5;
                }
                
                if (blood.position.y <= 0) {
                    blood.position.y = 0;
                    velocity.set(0, 0, 0);
                    
                    setTimeout(() => {
                        this.scene.remove(blood);
                        geometry.dispose();
                        material.dispose();
                    }, 5000);
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }
    }

    createTeleportEffect(position, config = {}) {
        const defaults = {
            color: 0x9900ff,
            particleCount: 30,
            radius: 2,
            lifetime: 1000
        };
        
        const settings = { ...defaults, ...config };
        
        const vortexGeometry = new THREE.CylinderGeometry(0.1, settings.radius, 3, 16);
        const vortexMaterial = new THREE.MeshBasicMaterial({
            color: settings.color,
            transparent: true,
            opacity: 0.6
        });
        const vortex = new THREE.Mesh(vortexGeometry, vortexMaterial);
        vortex.position.copy(position);
        this.scene.add(vortex);
        
        for (let i = 0; i < settings.particleCount; i++) {
            const angle = (i / settings.particleCount) * Math.PI * 2;
            const radius = Math.random() * settings.radius;
            
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: settings.color,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(position);
            particle.position.x += Math.cos(angle) * radius;
            particle.position.z += Math.sin(angle) * radius;
            particle.position.y += (Math.random() - 0.5) * 3;
            
            this.scene.add(particle);
            
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / settings.lifetime;
                
                particle.position.y += 0.05;
                particle.rotation.y += 0.1;
                particle.material.opacity = 0.8 * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(particle);
                    particleGeometry.dispose();
                    particleMaterial.dispose();
                }
            };
            
            animate();
        }
        
        const startTime = Date.now();
        const animateVortex = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / settings.lifetime;
            
            vortex.rotation.y += 0.1;
            vortex.scale.y = 1 - progress;
            vortex.material.opacity = 0.6 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animateVortex);
            } else {
                this.scene.remove(vortex);
                vortexGeometry.dispose();
                vortexMaterial.dispose();
            }
        };
        
        animateVortex();
    }

    cleanup() {
        this.activeEffects.forEach(effect => {
            if (effect.mesh && effect.mesh.parent) {
                this.scene.remove(effect.mesh);
                if (effect.mesh.geometry) effect.mesh.geometry.dispose();
                if (effect.mesh.material) effect.mesh.material.dispose();
            }
        });
        this.activeEffects.clear();
    }
}
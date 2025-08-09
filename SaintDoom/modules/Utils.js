import { GAME_CONFIG } from './GameConfig.js';

// ============= UTILITY CLASSES =============
export class VectorUtils {
    static getDirectionBetween(from, to) {
        return new THREE.Vector3()
            .subVectors(to, from)
            .normalize();
    }
    
    static getDistanceBetween(from, to) {
        return from.distanceTo(to);
    }
    
    static get2DDistance(from, to) {
        const dx = to.x - from.x;
        const dz = to.z - from.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    static rotateTowards(object, target) {
        const direction = this.getDirectionBetween(object.position, target);
        const angle = Math.atan2(direction.x, direction.z);
        object.rotation.y = angle;
    }
    
    static addRandomSpread(vector, spread) {
        return vector.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        ));
    }
}

export class ParticleSystem {
    static createExplosion(scene, position, color = GAME_CONFIG.COLORS.HOLY_GOLD, particleCount = GAME_CONFIG.ANIMATIONS.PARTICLE_COUNT) {
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = GeometryCache.getSphere(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 10,
                (Math.random() - 0.5) * 10
            );
            
            scene.add(particle);
            particles.push(particle);
        }
        
        const animateParticles = () => {
            let allDead = true;
            
            particles.forEach(particle => {
                if (particle.material.opacity > 0) {
                    allDead = false;
                    particle.position.add(particle.velocity.clone().multiplyScalar(0.02));
                    particle.velocity.y -= GAME_CONFIG.PHYSICS.GRAVITY * 0.01;
                    particle.material.opacity -= 0.02;
                    
                    if (particle.material.opacity <= 0) {
                        scene.remove(particle);
                    }
                }
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
        return particles;
    }
    
    static createHolyRing(scene, position, radius = 5) {
        const ringGeometry = new THREE.RingGeometry(radius - 0.5, radius, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: GAME_CONFIG.COLORS.HOLY_GOLD,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y = 0.1;
        ring.rotation.x = -Math.PI / 2;
        scene.add(ring);
        
        const animateRing = () => {
            ring.scale.x += 0.05;
            ring.scale.y += 0.05;
            ring.material.opacity -= 0.02;
            
            if (ring.material.opacity > 0) {
                requestAnimationFrame(animateRing);
            } else {
                scene.remove(ring);
            }
        };
        
        animateRing();
        return ring;
    }
    
    static createDeathParticles(scene, position, color) {
        const particles = this.createExplosion(scene, position, color, 30);
        // Add extra effects for death
        this.createHolyRing(scene, position, 3);
        return particles;
    }
}

export class AudioManager {
    static audioContext = null;
    
    static getContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }
    
    static playSound(config) {
        const context = this.getContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        // Apply pitch variation if requested
        const pitchVariation = config.pitchVariation ? 
            1 + (Math.random() - 0.5) * GAME_CONFIG.AUDIO.PITCH_VARIATION : 1;
        const volumeVariation = config.volumeVariation ? 
            1 + (Math.random() - 0.5) * GAME_CONFIG.AUDIO.VOLUME_VARIATION : 1;
        
        oscillator.type = config.type || 'sine';
        oscillator.frequency.setValueAtTime(
            (config.frequency || 440) * pitchVariation, 
            context.currentTime
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        const volume = (config.volume || GAME_CONFIG.AUDIO.DEFAULT_GAIN) * volumeVariation;
        gainNode.gain.setValueAtTime(volume, context.currentTime);
        
        if (config.fadeOut) {
            gainNode.gain.exponentialRampToValueAtTime(
                0.01, 
                context.currentTime + (config.duration || GAME_CONFIG.AUDIO.FADE_DURATION)
            );
        }
        
        oscillator.start();
        oscillator.stop(context.currentTime + (config.duration || 0.2));
        
        return { oscillator, gainNode, context };
    }
    
    static playPickupSound() {
        return this.playSound({
            frequency: GAME_CONFIG.AUDIO.PICKUP_FREQUENCY,
            type: 'sine',
            duration: 0.2,
            fadeOut: true,
            pitchVariation: true
        });
    }
    
    static playAmmoSound() {
        return this.playSound({
            frequency: GAME_CONFIG.AUDIO.AMMO_FREQUENCY,
            type: 'square',
            duration: 0.15,
            fadeOut: true
        });
    }
    
    static playArmorSound() {
        return this.playSound({
            frequency: GAME_CONFIG.AUDIO.ARMOR_FREQUENCY,
            type: 'triangle',
            duration: 0.25,
            fadeOut: true
        });
    }
    
    static playExplosionSound() {
        const context = this.getContext();
        const noise = context.createBufferSource();
        const buffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = buffer;
        
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3000, context.currentTime + 0.1);
        
        const gainNode = context.createGain();
        gainNode.gain.setValueAtTime(0.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(context.destination);
        
        noise.start();
    }
}

export class GeometryCache {
    static cache = new Map();
    
    static get(key, createFn) {
        if (!this.cache.has(key)) {
            this.cache.set(key, createFn());
        }
        return this.cache.get(key);
    }
    
    static getBox(width, height, depth) {
        const key = `box_${width}_${height}_${depth}`;
        return this.get(key, () => new THREE.BoxGeometry(width, height, depth));
    }
    
    static getSphere(radius, widthSegments = 8, heightSegments = 6) {
        const key = `sphere_${radius}_${widthSegments}_${heightSegments}`;
        return this.get(key, () => new THREE.SphereGeometry(radius, widthSegments, heightSegments));
    }
    
    static getCylinder(radiusTop, radiusBottom, height, radialSegments = 8) {
        const key = `cylinder_${radiusTop}_${radiusBottom}_${height}_${radialSegments}`;
        return this.get(key, () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
    }
}

export class MeshFactory {
    static createEyes(color = 0xff0000, size = 0.05) {
        const eyeGeometry = GeometryCache.getSphere(size, 4, 4);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color });
        
        return {
            left: new THREE.Mesh(eyeGeometry, eyeMaterial),
            right: new THREE.Mesh(eyeGeometry, eyeMaterial)
        };
    }
    
    static createEnemyMesh(config) {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = GeometryCache.getBox(
            config.SIZE.WIDTH,
            config.SIZE.HEIGHT,
            config.SIZE.DEPTH
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: config.MESH_COLOR,
            roughness: 0.8,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        // Eyes
        const eyes = this.createEyes(config.EYE_COLOR);
        eyes.left.position.set(-config.SIZE.WIDTH * 0.2, config.SIZE.HEIGHT * 0.3, -config.SIZE.DEPTH * 0.5);
        eyes.right.position.set(config.SIZE.WIDTH * 0.2, config.SIZE.HEIGHT * 0.3, -config.SIZE.DEPTH * 0.5);
        group.add(eyes.left);
        group.add(eyes.right);
        
        return group;
    }
}
import * as THREE from 'three';
/**
 * Base class for all levels in SaintDoom
 * Provides common functionality and structure for level creation
 */
export class BaseLevel {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Common properties
        this.name = "Base Level";
        this.description = "";
        this.backgroundColor = new THREE.Color(0x222222);
        
        // Common arrays for scene objects
        this.walls = [];
        this.enemies = [];
        this.pickups = [];
        this.interactables = [];
        this.lights = [];
        this.particles = [];
        this.sounds = [];
        
        // Objectives system
        this.objectives = [];
        this.completed = false;
        
        // Common intervals for cleanup
        this.intervals = [];
        this.timeouts = [];
    }

    /**
     * Initialize the level - called by subclasses
     */
    init() {
        this.createGeometry();
        this.createLighting();
        this.setupObjectives();
        this.createEnvironmentalDetails();
    }

    /**
     * Create basic level geometry - override in subclasses
     */
    createGeometry() {
        // Basic floor
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);
    }

    /**
     * Create basic lighting - override in subclasses
     */
    createLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 0);
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);
    }
    
    /**
     * Create emergency lighting setup
     * @param {number} ambientColor - Ambient light color
     * @param {number} intensity - Light intensity
     */
    createEmergencyLighting(ambientColor = 0x4a1100, intensity = 0.5) {
        const ambientLight = new THREE.AmbientLight(ambientColor, intensity);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);
        return ambientLight;
    }
    
    /**
     * Create warning lights at specified positions
     * @param {Array} positions - Array of {x, y, z} positions
     * @param {Object} options - Light options
     */
    createWarningLights(positions, options = {}) {
        const {
            color = 0xff4400,
            intensity = 1,
            distance = 20,
            blinking = true,
            blinkSpeed = 800
        } = options;
        
        const warningLights = [];
        
        positions.forEach(pos => {
            const warningLight = new THREE.PointLight(color, intensity, distance);
            warningLight.position.set(pos.x, pos.y, pos.z);
            this.scene.add(warningLight);
            this.lights.push(warningLight);
            warningLights.push(warningLight);
            
            if (blinking) {
                this.addBlinkingEffect(warningLight, blinkSpeed);
            }
        });
        
        return warningLights;
    }
    
    /**
     * Add blinking effect to a light
     * @param {THREE.Light} light - Light to animate
     * @param {number} speed - Blink speed in milliseconds
     */
    addBlinkingEffect(light, speed = 1000) {
        const originalIntensity = light.intensity;
        const variation = speed * 0.5;
        const actualSpeed = speed + (Math.random() - 0.5) * variation;
        
        this.addInterval(() => {
            light.intensity = light.intensity === 0 ? originalIntensity : 0;
        }, actualSpeed);
    }

    /**
     * Setup level objectives - override in subclasses
     */
    setupObjectives() {
        this.objectives = [
            {
                id: 'complete_level',
                description: 'Complete the level',
                completed: false,
                type: 'generic'
            }
        ];
    }

    /**
     * Create environmental details - override in subclasses
     */
    createEnvironmentalDetails() {
        // Override in subclasses
    }

    /**
     * Update level state - called every frame
     */
    update(deltaTime) {
        // Update enemies and filter out dead ones
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.update) {
                enemy.update(deltaTime);
            }
            
            // Remove dead enemies
            if (enemy.health <= 0 || enemy.destroyed) {
                if (enemy.mesh) {
                    this.scene.remove(enemy.mesh);
                }
                return false; // Remove from array
            }
            return true; // Keep in array
        });

        // Update particles
        this.particles.forEach(particle => {
            if (particle.update) {
                particle.update(deltaTime);
            }
        });

        // Check objectives completion
        this.checkObjectives();
    }

    /**
     * Check if objectives are complete
     */
    checkObjectives() {
        this.completed = this.objectives.every(obj => obj.completed);
    }

    /**
     * Get player spawn position - override in subclasses
     */
    getSpawnPosition() {
        return new THREE.Vector3(0, 1, 0);
    }

    /**
     * Check if level is complete
     */
    isComplete() {
        return this.completed;
    }

    /**
     * Add managed interval for cleanup
     */
    addInterval(callback, delay) {
        const intervalId = setInterval(callback, delay);
        this.intervals.push(intervalId);
        return intervalId;
    }

    /**
     * Add managed timeout for cleanup
     */
    addTimeout(callback, delay) {
        const timeoutId = setTimeout(callback, delay);
        this.timeouts.push(timeoutId);
        return timeoutId;
    }

    /**
     * Clear managed interval
     */
    clearInterval(intervalId) {
        clearInterval(intervalId);
        const index = this.intervals.indexOf(intervalId);
        if (index > -1) {
            this.intervals.splice(index, 1);
        }
    }

    /**
     * Clear managed timeout
     */
    clearTimeout(timeoutId) {
        clearTimeout(timeoutId);
        const index = this.timeouts.indexOf(timeoutId);
        if (index > -1) {
            this.timeouts.splice(index, 1);
        }
    }

    /**
     * Create common texture patterns
     */
    createTexture(options = {}) {
        const {
            width = 256,
            height = 256,
            baseColor = '#444444',
            pattern = 'solid'
        } = options;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, width, height);

        // Apply pattern
        switch (pattern) {
            case 'noise':
                this.addNoisePattern(ctx, width, height);
                break;
            case 'grid':
                this.addGridPattern(ctx, width, height);
                break;
            case 'stone':
                this.addStonePattern(ctx, width, height);
                break;
            case 'flesh':
                this.addFleshPattern(ctx, width, height);
                break;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    /**
     * Add noise pattern to texture
     */
    addNoisePattern(ctx, width, height) {
        for (let i = 0; i < width * height * 0.1; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const intensity = Math.random() * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    /**
     * Add grid pattern to texture
     */
    addGridPattern(ctx, width, height) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y < height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    /**
     * Add stone pattern to texture
     */
    addStonePattern(ctx, width, height) {
        // Add some random darker spots for stone texture
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 2 + Math.random() * 8;
            const opacity = 0.1 + Math.random() * 0.2;
            
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Add flesh pattern to texture
     */
    addFleshPattern(ctx, width, height) {
        // Add veins for organic appearance
        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * width, Math.random() * height);
            ctx.quadraticCurveTo(
                Math.random() * width, Math.random() * height,
                Math.random() * width, Math.random() * height
            );
            ctx.stroke();
        }
    }

    /**
     * Create particle system helper
     */
    createParticleSystem(config = {}) {
        const {
            count = 100,
            position = new THREE.Vector3(0, 0, 0),
            spread = 10,
            color = 0xffffff,
            size = 0.1,
            opacity = 0.8,
            velocityRange = { min: -0.01, max: 0.01 }
        } = config;

        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        const colorObj = new THREE.Color(color);

        for (let i = 0; i < count; i++) {
            // Position
            positions[i * 3] = position.x + (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * spread;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread;

            // Color
            colors[i * 3] = colorObj.r;
            colors[i * 3 + 1] = colorObj.g;
            colors[i * 3 + 2] = colorObj.b;

            // Velocity
            velocities[i * 3] = velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
            velocities[i * 3 + 1] = velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
            velocities[i * 3 + 2] = velocityRange.min + Math.random() * (velocityRange.max - velocityRange.min);
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;

        const material = new THREE.PointsMaterial({
            size: size,
            vertexColors: true,
            transparent: true,
            opacity: opacity
        });

        const particleSystem = new THREE.Points(particles, material);
        this.scene.add(particleSystem);
        this.particles.push(particleSystem);

        return particleSystem;
    }

    /**
     * Update particle system helper
     */
    updateParticleSystem(particleSystem, deltaTime, bounds = null) {
        if (!particleSystem || !particleSystem.geometry) return;

        const positions = particleSystem.geometry.attributes.position.array;
        const velocities = particleSystem.geometry.userData.velocities;

        if (!velocities) return;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;

            // Apply bounds if specified
            if (bounds) {
                if (positions[i] < bounds.min.x || positions[i] > bounds.max.x) velocities[i] *= -1;
                if (positions[i + 1] < bounds.min.y || positions[i + 1] > bounds.max.y) velocities[i + 1] *= -1;
                if (positions[i + 2] < bounds.min.z || positions[i + 2] > bounds.max.z) velocities[i + 2] *= -1;
            }
        }

        particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Create explosion effect helper
     */
    createExplosionEffect(position, config = {}) {
        const {
            radius = 5,
            duration = 2000,
            color = 0xff6600,
            intensity = 2
        } = config;

        // Create explosion geometry
        const explosionGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1.0
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Create light
        const light = new THREE.PointLight(color, intensity, radius * 3);
        light.position.copy(position);
        this.scene.add(light);

        // Animate explosion
        let scale = 0.1;
        let opacity = 1.0;
        const growthRate = radius / (duration / 16);
        const fadeRate = 1.0 / (duration / 16);

        const animationInterval = this.addInterval(() => {
            scale += growthRate;
            opacity -= fadeRate;

            explosion.scale.setScalar(scale);
            explosion.material.opacity = Math.max(0, opacity);
            light.intensity = Math.max(0, intensity * opacity);

            if (opacity <= 0) {
                this.scene.remove(explosion);
                this.scene.remove(light);
                clearInterval(animationInterval);
                
                // Remove from intervals array
                const index = this.intervals.indexOf(animationInterval);
                if (index > -1) {
                    this.intervals.splice(index, 1);
                }
            }
        }, 16);

        return { explosion, light };
    }

    /**
     * Create a wall with collision bounds
     * Common method used across all levels
     */
    createWall(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        // Static level geometry: freeze transforms to avoid per-frame matrix updates
        wall.matrixAutoUpdate = false;
        wall.updateMatrix();
        this.scene.add(wall);
        
        // Store wall bounds for collision
        this.walls.push({
            mesh: wall,
            min: new THREE.Vector3(
                x - width/2,
                y - height/2,
                z - depth/2
            ),
            max: new THREE.Vector3(
                x + width/2,
                y + height/2,
                z + depth/2
            )
        });
        
        return wall;
    }
    
    /**
     * Create standard exit portal for level completion
     * @param {THREE.Vector3} position - Position for the portal
     * @param {Object} options - Optional customization
     */
    createExitPortal(position = new THREE.Vector3(0, 2, 0), options = {}) {
        // Prevent duplicate portals
        if (this.exitPortalCreated) return;
        this.exitPortalCreated = true;
        
        const {
            color = 0x00ff00,
            emissiveColor = 0x00ff00,
            portalColor = 0x00ffff,
            scale = 1,
            message = "Exit portal activated!",
            rotation = null
        } = options;
        
        // Create portal group
        const portalGroup = new THREE.Group();
        
        // Portal ring
        const ringGeometry = new THREE.TorusGeometry(3 * scale, 0.5 * scale, 16, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: emissiveColor,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        portalGroup.add(ring);
        
        // Portal surface
        const portalGeometry = new THREE.CircleGeometry(3 * scale, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: portalColor,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portalGroup.add(portal);
        
        // Position and rotation
        portalGroup.position.copy(position);
        if (rotation) {
            portalGroup.rotation.copy(rotation);
        }
        this.scene.add(portalGroup);
        
        // Add portal light
        const portalLight = new THREE.PointLight(color, 2, 10 * scale);
        portalLight.position.copy(position);
        this.scene.add(portalLight);
        this.lights.push(portalLight);
        
        // Store for interaction checking
        this.exitPortal = portalGroup;
        
        // Animate portal
        const animationInterval = setInterval(() => {
            if (ring && portal) {
                ring.rotation.z += 0.02;
                portal.rotation.z -= 0.01;
                // Pulse effect
                const pulseScale = scale * (1 + Math.sin(Date.now() * 0.003) * 0.1);
                portalGroup.scale.set(pulseScale, pulseScale, pulseScale);
            }
        }, 16);
        this.intervals.push(animationInterval);
        
        // Display message
        if (this.game && this.game.narrativeSystem && message) {
            this.game.narrativeSystem.displaySubtitle(message);
        }
        
        return portalGroup;
    }
    
    /**
     * Check if player is near exit portal and handle level completion
     */
    checkExitPortalInteraction() {
        if (!this.exitPortal || !this.game || !this.game.player) return false;
        
        const distance = this.game.player.position.distanceTo(this.exitPortal.position);
        if (distance < 4) {
            this.completeLevel();
            return true;
        }
        return false;
    }
    
    /**
     * Standard level completion handler
     */
    completeLevel() {
        // Prevent double completion
        if (this.completed) return;
        this.completed = true;
        
        // Display completion message
        const levelName = this.name || "Level";
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle(`${levelName} Complete!`);
        }
        
        // Load next level after delay
        setTimeout(() => {
            if (this.game && this.game.loadNextLevel) {
                this.game.loadNextLevel();
            }
        }, 2000);
    }
    
    /**
     * Check if all objectives are complete
     * Override this for custom completion logic
     */
    isComplete() {
        if (!this.objectives || this.objectives.length === 0) {
            return false;
        }
        return this.objectives.every(obj => obj.completed);
    }
    
    /**
     * Update objective progress and check for completion
     */
    updateObjectives() {
        // Check for level completion
        if (this.isComplete() && !this.exitPortalCreated) {
            // Get exit position - override in subclasses
            const exitPosition = this.getExitPosition();
            this.createExitPortal(exitPosition);
        }
    }
    
    /**
     * Get position for exit portal - override in subclasses
     */
    getExitPosition() {
        return new THREE.Vector3(0, 2, 0);
    }

    /**
     * Clean up level resources
     */
    cleanup() {
        // Clear intervals and timeouts
        this.intervals.forEach(interval => clearInterval(interval));
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.intervals = [];
        this.timeouts = [];

        // Remove all enemies
        this.enemies.forEach(enemy => {
            if (enemy.mesh) {
                this.scene.remove(enemy.mesh);
            }
        });

        // Remove all particles
        this.particles.forEach(particle => {
            this.scene.remove(particle);
        });

        // Remove all lights (except scene defaults)
        this.lights.forEach(light => {
            this.scene.remove(light);
        });

        // Remove all walls
        this.walls.forEach(wall => {
            this.scene.remove(wall);
        });

        // Clear arrays
        this.walls = [];
        this.enemies = [];
        this.pickups = [];
        this.interactables = [];
        this.lights = [];
        this.particles = [];
        this.sounds = [];
    }
}

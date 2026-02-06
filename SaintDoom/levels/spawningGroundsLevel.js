import { BaseLevel } from './baseLevel.js';
import { EnemySpawner } from './enemySpawner.js';
import * as THREE from 'three';

/**
 * Spawning Grounds Level - Endless waves of enemies from hell portals
 * Refactored to use utilities and configuration-driven approach
 */
export class SpawningGroundsLevel extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;

        this.name = 'Spawning Grounds';
        this.description = 'Endless waves of enemies from hell portals';

        // Configuration-driven tuning
        this.config = {
            arena: {
                radius: 40,
                wallHeight: 10,
                wallCount: 24,
                ringCount: 3,
                ringSpacing: 8
            },
            visuals: {
                fleshColor: 0x552222,
                wallColor: 0x883333,
                ringColor: 0xff0000,
                ringOpacity: 0.2,
                portalColor: 0xff0066,
                altarColor: 0x440000
            },
            waves: {
                spawnInterval: 5000,
                breakDuration: 8000,
                intensityGrowth: 0.25,
                maxIntensity: 8,
                portalCooldown: 6000
            }
        };

        // Runtime state
        this.enemySpawner = new EnemySpawner(this.scene);
        this.spawnPortals = [];
        this.portalCooldowns = new Map();
        this.waveNumber = 1;
        this.swarmIntensity = 1;
        this.waveBreakTimer = 0;
        this.enemiesSpawnedThisWave = 0;
        this.altarDestroyed = false;
    }

    create() {
        this.init();
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }

    init() {
        this.createArena();
        this.createLighting();
        this.createSpawnPortals();
        this.createCentralAltar();
        this.createEnvironmentalDetails();
        this.setupObjectives();
        this.startSwarmLogic();
    }

    /**
     * Create the main arena using utilities
     */
    createArena() {
        const { radius, wallHeight, wallCount, ringCount, ringSpacing } = this.config.arena;
        const { fleshColor, wallColor, ringColor, ringOpacity } = this.config.visuals;
        
        // Create main arena floor with flesh texture
        const arenaGeometry = new THREE.CylinderGeometry(radius, radius, 2, 32);
        const arenaMaterial = new THREE.MeshLambertMaterial({ 
            color: fleshColor,
            map: this.createTexture({ pattern: 'flesh', baseColor: '#552222' })
        });
        const arena = new THREE.Mesh(arenaGeometry, arenaMaterial);
        arena.position.y = -1;
        this.scene.add(arena);

        // Create outer walls using utility function
        this.createArenaWalls(radius, wallHeight, wallCount, wallColor);
        
        // Create tactical rings
        this.createTacticalRings(ringCount, ringSpacing, ringColor, ringOpacity);
    }

    /**
     * Create arena walls in a circle
     */
    createArenaWalls(radius, height, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * (radius + 2);
            const z = Math.sin(angle) * (radius + 2);
            
            const wallGeometry = new THREE.BoxGeometry(4, height, 2);
            const wallMaterial = new THREE.MeshLambertMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.8
            });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(x, height/2, z);
            wall.lookAt(new THREE.Vector3(0, height/2, 0));
            this.scene.add(wall);
            
            // Add proper collision bounds for the wall
            const box = new THREE.Box3().setFromObject(wall);
            this.walls.push({
                mesh: wall,
                min: box.min,
                max: box.max
            });
        }
    }

    /**
     * Create concentric rings for tactical positioning
     */
    createTacticalRings(count, spacing, color, opacity) {
        for (let ring = 1; ring <= count; ring++) {
            const ringRadius = ring * spacing;
            const ringGeometry = new THREE.RingGeometry(ringRadius - 0.5, ringRadius + 0.5, 32);
            const ringMaterial = new THREE.MeshLambertMaterial({ 
                color: color,
                transparent: true,
                opacity: opacity
            });
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = -Math.PI / 2;
            ringMesh.position.y = 0.1;
            this.scene.add(ringMesh);
        }
    }

    /**
     * Create spawn portals at strategic locations
     */
    createSpawnPortals() {
        const portalPositions = [
            { x: 30, z: 0 },
            { x: -30, z: 0 },
            { x: 0, z: 30 },
            { x: 0, z: -30 },
            { x: 20, z: 20 },
            { x: -20, z: 20 },
            { x: 20, z: -20 },
            { x: -20, z: -20 }
        ];

        portalPositions.forEach((pos, index) => {
            const portal = this.createPortal(pos.x, 0, pos.z, index);
            this.spawnPortals.push(portal);
            this.portalCooldowns.set(portal.userData.id, 0);
        });
    }

    /**
     * Create a single spawn portal
     */
    createPortal(x, y, z, id) {
        const portalGroup = new THREE.Group();
        portalGroup.position.set(x, y, z);
        portalGroup.userData = { id: `portal_${id}`, active: true };

        // Portal ring
        const ringGeometry = new THREE.TorusGeometry(3, 0.5, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: this.config.visuals.portalColor
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        portalGroup.add(ring);

        // Portal glow
        const light = new THREE.PointLight(this.config.visuals.portalColor, 2, 10);
        light.position.y = 1;
        portalGroup.add(light);

        // Portal particles effect
        const particleCount = 20;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * 2;
            positions[i * 3 + 1] = Math.random() * 3;
            positions[i * 3 + 2] = Math.sin(angle) * 2;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: this.config.visuals.portalColor,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        portalGroup.add(particles);

        // Store particles for animation
        portalGroup.userData.particles = particles;

        this.scene.add(portalGroup);
        return portalGroup;
    }

    /**
     * Create the central altar objective
     */
    createCentralAltar() {
        const altarGroup = new THREE.Group();
        
        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(5, 7, 2, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ 
            color: this.config.visuals.altarColor 
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        altarGroup.add(base);

        // Altar pillar
        const pillarGeometry = new THREE.BoxGeometry(3, 4, 3);
        const pillar = new THREE.Mesh(pillarGeometry, baseMaterial);
        pillar.position.y = 3;
        altarGroup.add(pillar);

        // Demonic crystal
        const crystalGeometry = new THREE.OctahedronGeometry(1, 0);
        const crystalMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.y = 5;
        altarGroup.add(crystal);

        // Altar light
        const altarLight = new THREE.PointLight(0xff0000, 3, 15);
        altarLight.position.y = 5;
        altarGroup.add(altarLight);

        altarGroup.userData = {
            crystal,
            altarLight,
            health: 1000,
            maxHealth: 1000,
            isAltar: true
        };

        this.scene.add(altarGroup);
        this.centralAltar = altarGroup;
    }

    /**
     * Start the swarm spawning logic using BaseLevel's interval management
     */
    startSwarmLogic() {
        // Use addInterval from BaseLevel for proper cleanup
        this.addInterval(() => {
            if (this.waveBreakTimer > 0) {
                this.waveBreakTimer -= this.config.waves.spawnInterval;
                return;
            }

            this.spawnSwarmWave();
            this.waveNumber++;
            
            // Increase intensity
            if (this.swarmIntensity < this.config.waves.maxIntensity) {
                this.swarmIntensity += this.config.waves.intensityGrowth;
            }

            // Set wave break
            if (this.waveNumber % 5 === 0) {
                this.waveBreakTimer = this.config.waves.breakDuration;
                this.showWaveBreakMessage();
            }
        }, this.config.waves.spawnInterval);
    }

    /**
     * Spawn a wave of enemies using the EnemySpawner
     */
    spawnSwarmWave() {
        const activePortals = this.spawnPortals.filter(p => {
            const cooldown = this.portalCooldowns.get(p.userData.id) || 0;
            return p.userData.active && cooldown <= 0;
        });

        if (activePortals.length === 0) return;

        // Determine pattern based on wave number
        const patterns = ['early', 'swarm', 'mid', 'hell', 'late'];
        const patternIndex = Math.min(Math.floor(this.waveNumber / 3), patterns.length - 1);
        const pattern = patterns[patternIndex];

        // Generate spawn positions from active portals
        const spawnPositions = [];
        const enemiesPerPortal = Math.ceil(this.swarmIntensity);
        
        activePortals.forEach(portal => {
            for (let i = 0; i < enemiesPerPortal; i++) {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 6,
                    0,
                    (Math.random() - 0.5) * 6
                );
                spawnPositions.push(portal.position.clone().add(offset));
            }
            
            // Set portal cooldown
            this.portalCooldowns.set(portal.userData.id, this.config.waves.portalCooldown);
            
            // Visual effect
            this.createPortalSpawnEffect(portal);
        });

        // Use EnemySpawner to spawn the wave
        const enemies = this.enemySpawner.spawnWave(pattern, spawnPositions, this.waveNumber);
        this.enemiesSpawnedThisWave = enemies.length;

        // Important: Game systems (combat/collisions) operate on `game.enemies`
        if (this.game && Array.isArray(this.game.enemies)) {
            enemies.forEach(enemy => {
                if (!enemy) return;
                enemy.game = this.game;

                // Register with physics system if available
                if (this.game.physicsManager && !enemy.physicsData) {
                    const flyingNames = new Set(['Imp', 'Succubus', 'CorruptedDrone', 'ShadowWraith']);
                    const isFlying = flyingNames.has(enemy.constructor?.name);
                    this.game.physicsManager.registerEntity(enemy, {
                        isFlying,
                        hasGravity: !isFlying,
                        mass: enemy.mass || 1,
                        radius: enemy.radius || 0.3,
                        height: enemy.height || 1.8,
                        groundOffset: 0.1
                    });
                }
            });

            this.game.enemies.push(...enemies.filter(Boolean));
        } else {
            this.enemies.push(...enemies);
        }
    }

    /**
     * Create visual effect when portal spawns enemies
     */
    createPortalSpawnEffect(portal) {
        // Flash effect
        const originalIntensity = portal.children.find(c => c.isLight).intensity;
        const light = portal.children.find(c => c.isLight);
        light.intensity = 5;
        
        this.addTimeout(() => {
            light.intensity = originalIntensity;
        }, 500);

        // Expand ring effect
        const ring = portal.children.find(c => c.isMesh && c.geometry.type === 'TorusGeometry');
        if (ring) {
            const originalScale = ring.scale.x;
            ring.scale.set(1.5, 1.5, 1.5);
            
            const scaleBack = () => {
                if (ring.scale.x > originalScale) {
                    ring.scale.multiplyScalar(0.95);
                    requestAnimationFrame(scaleBack);
                } else {
                    ring.scale.set(originalScale, originalScale, originalScale);
                }
            };
            requestAnimationFrame(scaleBack);
        }
    }

    /**
     * Show wave break message
     */
    showWaveBreakMessage() {
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle(
                `Wave ${this.waveNumber} Complete! Next wave in ${this.config.waves.breakDuration / 1000} seconds...`
            );
        }
    }

    /**
     * Override update to include portal and altar animations
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update portal cooldowns
        this.portalCooldowns.forEach((cooldown, id) => {
            if (cooldown > 0) {
                this.portalCooldowns.set(id, Math.max(0, cooldown - deltaTime * 1000));
            }
        });

        // Animate portals
        this.animatePortals(deltaTime);

        // Animate altar
        if (this.centralAltar && !this.altarDestroyed) {
            this.animateAltar(deltaTime);
        }

        // Check win condition
        this.checkWinCondition();
    }

    /**
     * Animate portal effects
     */
    animatePortals(deltaTime) {
        const time = Date.now() * 0.001;
        
        this.spawnPortals.forEach(portal => {
            // Rotate portal ring
            const ring = portal.children.find(c => c.isMesh && c.geometry.type === 'TorusGeometry');
            if (ring) {
                ring.rotation.z += deltaTime;
            }

            // Animate particles
            const particles = portal.userData.particles;
            if (particles) {
                particles.rotation.y += deltaTime * 0.5;
                
                // Update particle positions for swirling effect
                const positions = particles.geometry.attributes.position.array;
                for (let i = 0; i < positions.length / 3; i++) {
                    const angle = time + (i / (positions.length / 3)) * Math.PI * 2;
                    positions[i * 3] = Math.cos(angle) * 2;
                    positions[i * 3 + 1] = (Math.sin(time * 2 + i) + 1) * 1.5;
                    positions[i * 3 + 2] = Math.sin(angle) * 2;
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    /**
     * Animate altar crystal
     */
    animateAltar(deltaTime) {
        const crystal = this.centralAltar.userData.crystal;
        if (crystal) {
            crystal.rotation.y += deltaTime * 2;
            crystal.position.y = 5 + Math.sin(Date.now() * 0.001) * 0.5;
        }
    }

    /**
     * Check if altar is destroyed (win condition)
     */
    checkWinCondition() {
        if (this.centralAltar && this.centralAltar.userData.health <= 0 && !this.altarDestroyed) {
            this.altarDestroyed = true;
            this.destroyAltar();
            this.completeLevel();
        }
    }

    /**
     * Destroy the altar with effects
     */
    destroyAltar() {
        if (!this.centralAltar) return;

        // Create explosion effect using BaseLevel method
        this.createExplosionEffect(this.centralAltar.position, { radius: 10, color: 0xff0000, intensity: 3 });
        
        // Screen shake using BaseLevel method
        this.createScreenShake(1000, 10);

        // Remove altar
        this.scene.remove(this.centralAltar);

        // Disable all portals
        this.spawnPortals.forEach(portal => {
            portal.userData.active = false;
            const light = portal.children.find(c => c.isLight);
            if (light) light.intensity = 0.1;
        });
    }

    /**
     * Complete the level
     */
    completeLevel() {
        this.completed = true;
        
        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("The Spawning Grounds have been cleansed!");
            this.game.narrativeSystem.setObjective("Proceed to the next area");
        }

        // Clear all intervals using BaseLevel's cleanup
        this.cleanup();
    }

    /**
     * Setup level objectives
     */
    setupObjectives() {
        this.objectives = [
            {
                id: 'destroy_altar',
                description: 'Destroy the central altar',
                completed: false,
                type: 'main'
            },
            {
                id: 'survive_waves',
                description: 'Survive the demon waves',
                completed: false,
                type: 'ongoing'
            }
        ];

        if (this.game && this.game.narrativeSystem) {
            this.game.narrativeSystem.setObjective("Destroy the central altar to stop the invasion");
        }
    }

    /**
     * Create lighting for the arena
     */
    createLighting() {
        // Hellish red ambient light
        const ambientLight = new THREE.AmbientLight(this.config.visuals.portalColor, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Add fog for atmosphere
        this.scene.fog = new THREE.Fog(0x220000, 10, 100);
    }
    
    /**
     * Create environmental details
     */
    createEnvironmentalDetails() {
        // Blood pools
        const bloodPoolCount = 10;
        for (let i = 0; i < bloodPoolCount; i++) {
            const poolGeometry = new THREE.CircleGeometry(Math.random() * 2 + 1, 8);
            const poolMaterial = new THREE.MeshLambertMaterial({
                color: 0x440000,
                transparent: true,
                opacity: 0.8
            });
            const pool = new THREE.Mesh(poolGeometry, poolMaterial);
            pool.rotation.x = -Math.PI / 2;
            pool.position.set(
                (Math.random() - 0.5) * 40,
                0.01,
                (Math.random() - 0.5) * 40
            );
            this.scene.add(pool);
        }
        
        // Bone piles
        const bonePileCount = 5;
        for (let i = 0; i < bonePileCount; i++) {
            const pileGroup = new THREE.Group();
            
            // Create random bones
            for (let j = 0; j < 5; j++) {
                const boneGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.5 + Math.random() * 0.5, 4);
                const boneMaterial = new THREE.MeshLambertMaterial({ color: 0xccccaa });
                const bone = new THREE.Mesh(boneGeometry, boneMaterial);
                bone.position.set(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.3,
                    (Math.random() - 0.5) * 0.5
                );
                bone.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                pileGroup.add(bone);
            }
            
            pileGroup.position.set(
                (Math.random() - 0.5) * 30,
                0,
                (Math.random() - 0.5) * 30
            );
            this.scene.add(pileGroup);
        }
        
        // Demonic runes on floor
        const runeCount = 8;
        for (let i = 0; i < runeCount; i++) {
            const angle = (i / runeCount) * Math.PI * 2;
            const radius = 20;
            
            const runeGeometry = new THREE.RingGeometry(1, 1.5, 6);
            const runeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const rune = new THREE.Mesh(runeGeometry, runeMaterial);
            rune.rotation.x = -Math.PI / 2;
            rune.position.set(
                Math.cos(angle) * radius,
                0.02,
                Math.sin(angle) * radius
            );
            this.scene.add(rune);
        }
    }

    /**
     * Get player spawn position
     */
    getSpawnPosition() {
        return new THREE.Vector3(0, 1, 25);
    }
}

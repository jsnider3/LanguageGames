import * as THREE from 'three';

/**
 * Level Creation Utilities
 * Organized into namespaces for better structure and maintainability
 */

// ====================
// COLOR CONSTANTS
// ====================
export const COLORS = {
    // Environment
    STONE: 0x666666,
    METAL: 0x888888,
    CONCRETE: 0x555555,
    DIRT: 0x4a3a2a,
    WOOD: 0x8b4513,
    RUST: 0x8b3a00,
    
    // Lighting
    WARM_AMBIENT: 0x404030,
    COOL_AMBIENT: 0x303040,
    HELL_AMBIENT: 0x401010,
    HOLY_AMBIENT: 0x404040,
    LAB_AMBIENT: 0x304050,
    
    // Special effects
    FIRE: 0xff4400,
    ELECTRICITY: 0x4488ff,
    POISON: 0x44ff44,
    HOLY_LIGHT: 0xffffcc,
    HELL_FIRE: 0xff0000,
    CORRUPTION: 0x660066,
    
    // UI/Interactive
    ACTIVE: 0x00ff00,
    INACTIVE: 0xff0000,
    WARNING: 0xffff00,
    NEUTRAL: 0xcccccc,
    LOCKED: 0xff0000,
    UNLOCKED: 0x00ff00
};

// ====================
// MATERIAL PRESETS
// ====================
export const MATERIALS = {
    // Basic materials
    STONE: new THREE.MeshLambertMaterial({ color: COLORS.STONE }),
    METAL: new THREE.MeshLambertMaterial({ color: COLORS.METAL }),
    CONCRETE: new THREE.MeshLambertMaterial({ color: COLORS.CONCRETE }),
    WOOD: new THREE.MeshLambertMaterial({ color: COLORS.WOOD }),
    
    // Transparent materials
    GLASS: new THREE.MeshLambertMaterial({ 
        color: 0x88ccff, 
        transparent: true, 
        opacity: 0.3 
    }),
    FORCEFIELD: new THREE.MeshBasicMaterial({ 
        color: COLORS.ELECTRICITY, 
        transparent: true, 
        opacity: 0.4,
        side: THREE.DoubleSide
    }),
    
    // Emissive materials
    LAVA: new THREE.MeshBasicMaterial({ 
        color: COLORS.FIRE
    }),
    ENERGY: new THREE.MeshBasicMaterial({ 
        color: COLORS.ELECTRICITY, 
        transparent: true, 
        opacity: 0.6 
    }),
    HOLY_GLOW: new THREE.MeshBasicMaterial({
        color: COLORS.HOLY_LIGHT
    })
};

// ====================
// GEOMETRY NAMESPACE
// ====================
export const Geometry = {
    // Common geometries (cached for reuse)
    cache: {
        WALL: new THREE.BoxGeometry(1, 3, 1),
        FLOOR_TILE: new THREE.BoxGeometry(1, 0.1, 1),
        PILLAR: new THREE.CylinderGeometry(0.5, 0.5, 3),
        DOOR: new THREE.BoxGeometry(2, 3, 0.2),
        CRATE: new THREE.BoxGeometry(1, 1, 1),
        BARREL: new THREE.CylinderGeometry(0.5, 0.5, 1.2),
        PLATFORM: new THREE.CylinderGeometry(5, 5, 0.5, 16)
    },
    
    /**
     * Create a wall segment
     * @param {Object} config - Wall configuration
     * @returns {THREE.Mesh} Wall mesh
     */
    createWall(config = {}) {
        const {
            position = new THREE.Vector3(0, 1.5, 0),
            rotation = 0,
            scale = { x: 1, y: 1, z: 1 },
            material = MATERIALS.STONE,
            width = 1,
            height = 3,
            depth = 1
        } = config;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material.clone());
        wall.position.copy(position);
        wall.rotation.y = rotation;
        wall.scale.set(scale.x, scale.y, scale.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        
        return wall;
    },
    
    /**
     * Create a circular platform
     * @param {Object} config - Platform configuration
     * @returns {THREE.Mesh} Platform mesh
     */
    createCircularPlatform(config = {}) {
        const {
            radius = 5,
            height = 0.5,
            segments = 16,
            position = new THREE.Vector3(0, 0, 0),
            material = MATERIALS.STONE
        } = config;
        
        const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
        const platform = new THREE.Mesh(geometry, material);
        platform.position.copy(position);
        platform.receiveShadow = true;
        
        return platform;
    },
    
    /**
     * Create a room with walls
     * @param {Object} config - Room configuration
     * @returns {THREE.Group} Room group containing all meshes
     */
    createRoom(config = {}) {
        const {
            position = new THREE.Vector3(0, 0, 0),
            size = { width: 10, height: 3, depth: 10 },
            wallThickness = 0.5,
            material = MATERIALS.STONE,
            hasFloor = true,
            hasCeiling = false,
            openings = [] // Array of { wall: 'north'|'south'|'east'|'west', start: 0.2, end: 0.8 }
        } = config;

        const room = new THREE.Group();
        const walls = [];

        // Create floor
        if (hasFloor) {
            const floorGeometry = new THREE.BoxGeometry(size.width, 0.1, size.depth);
            const floor = new THREE.Mesh(floorGeometry, material);
            floor.position.set(0, -0.05, 0);
            floor.receiveShadow = true;
            room.add(floor);
        }

        // Create ceiling
        if (hasCeiling) {
            const ceilingGeometry = new THREE.BoxGeometry(size.width, 0.1, size.depth);
            const ceiling = new THREE.Mesh(ceilingGeometry, material);
            ceiling.position.set(0, size.height + 0.05, 0);
            room.add(ceiling);
        }

        // Helper function to check if position has opening
        const hasOpening = (wall, position) => {
            return openings.some(opening => 
                opening.wall === wall && 
                position >= opening.start && 
                position <= opening.end
            );
        };

        // Create walls with openings
        const wallConfigs = [
            { name: 'north', x: 0, z: -size.depth/2, width: size.width, depth: wallThickness },
            { name: 'south', x: 0, z: size.depth/2, width: size.width, depth: wallThickness },
            { name: 'east', x: size.width/2, z: 0, width: wallThickness, depth: size.depth },
            { name: 'west', x: -size.width/2, z: 0, width: wallThickness, depth: size.depth }
        ];

        wallConfigs.forEach(wallConfig => {
            const opening = openings.find(o => o.wall === wallConfig.name);
            
            if (opening) {
                // Create wall segments around opening
                const segments = this.createWallWithOpening(wallConfig, size.height, opening, material);
                segments.forEach(segment => {
                    room.add(segment);
                    walls.push(segment);
                });
            } else {
                // Create solid wall
                const wallGeometry = new THREE.BoxGeometry(wallConfig.width, size.height, wallConfig.depth);
                const wall = new THREE.Mesh(wallGeometry, material);
                wall.position.set(wallConfig.x, size.height/2, wallConfig.z);
                wall.castShadow = true;
                wall.receiveShadow = true;
                room.add(wall);
                walls.push(wall);
            }
        });

        room.position.copy(position);
        room.userData = { walls, size };
        
        return room;
    },
    
    /**
     * Create wall segments with an opening
     * @private
     */
    createWallWithOpening(wallConfig, height, opening, material) {
        const segments = [];
        const isHorizontal = wallConfig.name === 'north' || wallConfig.name === 'south';
        
        if (isHorizontal) {
            const totalWidth = wallConfig.width;
            const openingStart = totalWidth * opening.start - totalWidth/2;
            const openingEnd = totalWidth * opening.end - totalWidth/2;
            
            // Left segment
            if (opening.start > 0) {
                const leftWidth = opening.start * totalWidth;
                const leftGeometry = new THREE.BoxGeometry(leftWidth, height, wallConfig.depth);
                const leftWall = new THREE.Mesh(leftGeometry, material);
                leftWall.position.set(openingStart/2 - totalWidth/4, height/2, wallConfig.z);
                segments.push(leftWall);
            }
            
            // Right segment
            if (opening.end < 1) {
                const rightWidth = (1 - opening.end) * totalWidth;
                const rightGeometry = new THREE.BoxGeometry(rightWidth, height, wallConfig.depth);
                const rightWall = new THREE.Mesh(rightGeometry, material);
                rightWall.position.set(openingEnd/2 + totalWidth/4, height/2, wallConfig.z);
                segments.push(rightWall);
            }
            
            // Top segment (above door)
            const topHeight = height * 0.3;
            const topGeometry = new THREE.BoxGeometry(openingEnd - openingStart, topHeight, wallConfig.depth);
            const topWall = new THREE.Mesh(topGeometry, material);
            topWall.position.set((openingStart + openingEnd)/2, height - topHeight/2, wallConfig.z);
            segments.push(topWall);
        }
        
        return segments;
    }
};

// ====================
// LIGHTING NAMESPACE
// ====================
export const Lighting = {
    /**
     * Create a complete lighting setup for a level
     * @param {THREE.Scene} scene - The scene to add lights to
     * @param {Object} config - Lighting configuration
     * @returns {Array} Array of created lights
     */
    createLightingSetup(scene, config = {}) {
        const {
            ambientColor = COLORS.NEUTRAL,
            ambientIntensity = 0.4,
            directionalColor = 0xffffff,
            directionalIntensity = 0.8,
            directionalPosition = new THREE.Vector3(10, 20, 10),
            hasShadows = true,
            fogColor = null,
            fogNear = 10,
            fogFar = 100
        } = config;
        
        const lights = [];
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
        scene.add(ambientLight);
        lights.push(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
        directionalLight.position.copy(directionalPosition);
        
        if (hasShadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -20;
            directionalLight.shadow.camera.right = 20;
            directionalLight.shadow.camera.top = 20;
            directionalLight.shadow.camera.bottom = -20;
        }
        
        scene.add(directionalLight);
        lights.push(directionalLight);
        
        // Add fog if specified
        if (fogColor) {
            scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
        }
        
        return lights;
    },
    
    /**
     * Create a flickering light effect
     * @param {Object} config - Light configuration
     * @returns {THREE.PointLight} Flickering light
     */
    createFlickeringLight(config = {}) {
        const {
            color = 0xffaa00,
            intensity = 1,
            distance = 10,
            position = new THREE.Vector3(0, 3, 0),
            flickerSpeed = 100,
            flickerIntensity = 0.3
        } = config;
        
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.copy(position);
        
        // Store flicker data
        light.userData = {
            baseIntensity: intensity,
            flickerSpeed,
            flickerIntensity,
            flickerTime: 0
        };
        
        return light;
    },
    
    /**
     * Update flickering lights
     * @param {Array} lights - Array of lights to update
     * @param {Number} deltaTime - Time since last frame
     */
    updateFlickeringLights(lights, deltaTime) {
        lights.forEach(light => {
            if (light.userData.flickerSpeed) {
                light.userData.flickerTime += deltaTime * light.userData.flickerSpeed;
                const flicker = Math.sin(light.userData.flickerTime) * light.userData.flickerIntensity;
                light.intensity = light.userData.baseIntensity + flicker;
            }
        });
    }
};

// ====================
// ANIMATION NAMESPACE
// ====================
export const Animation = {
    /**
     * Create a rotating animation
     * @param {THREE.Object3D} object - Object to rotate
     * @param {Object} config - Animation configuration
     * @returns {Function} Update function to call each frame
     */
    createRotation(object, config = {}) {
        const {
            axis = 'y',
            speed = 1,
            clockwise = true
        } = config;
        
        const direction = clockwise ? 1 : -1;
        
        return (deltaTime) => {
            object.rotation[axis] += deltaTime * speed * direction;
        };
    },
    
    /**
     * Create a bobbing animation
     * @param {THREE.Object3D} object - Object to animate
     * @param {Object} config - Animation configuration
     * @returns {Function} Update function to call each frame
     */
    createBobbing(object, config = {}) {
        const {
            amplitude = 0.5,
            frequency = 1,
            axis = 'y'
        } = config;
        
        const basePosition = object.position[axis];
        let time = 0;
        
        return (deltaTime) => {
            time += deltaTime * frequency;
            object.position[axis] = basePosition + Math.sin(time) * amplitude;
        };
    },
    
    /**
     * Create a pulsing scale animation
     * @param {THREE.Object3D} object - Object to animate
     * @param {Object} config - Animation configuration
     * @returns {Function} Update function to call each frame
     */
    createPulsing(object, config = {}) {
        const {
            minScale = 0.8,
            maxScale = 1.2,
            speed = 2
        } = config;
        
        let time = 0;
        
        return (deltaTime) => {
            time += deltaTime * speed;
            const scale = minScale + (maxScale - minScale) * (Math.sin(time) + 1) / 2;
            object.scale.setScalar(scale);
        };
    }
};

// ====================
// PARTICLE NAMESPACE
// ====================
export const Particles = {
    /**
     * Create a particle system
     * @param {Object} config - Particle configuration
     * @returns {THREE.Points} Particle system
     */
    createParticleSystem(config = {}) {
        const {
            count = 100,
            color = 0xffffff,
            size = 0.1,
            transparent = true,
            opacity = 0.8,
            spread = 10,
            height = 10
        } = config;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = Math.random() * height;
            positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color,
            size,
            transparent,
            opacity
        });
        
        return new THREE.Points(geometry, material);
    },
    
    /**
     * Create fire particles
     * @param {THREE.Vector3} position - Fire position
     * @param {Object} config - Fire configuration
     * @returns {THREE.Points} Fire particle system
     */
    createFire(position, config = {}) {
        const {
            particleCount = 50,
            radius = 1,
            height = 3,
            colors = [0xff0000, 0xff4400, 0xffaa00]
        } = config;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colorAttribute = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            
            positions[i * 3] = Math.cos(angle) * r;
            positions[i * 3 + 1] = Math.random() * height;
            positions[i * 3 + 2] = Math.sin(angle) * r;
            
            const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
            colorAttribute[i * 3] = color.r;
            colorAttribute[i * 3 + 1] = color.g;
            colorAttribute[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorAttribute, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.position.copy(position);
        
        return particles;
    }
};

// ====================
// INTERACTIVE NAMESPACE
// ====================
export const Interactive = {
    /**
     * Create an interactive door
     * @param {Object} config - Door configuration
     * @returns {THREE.Group} Door group with interaction data
     */
    createDoor(config = {}) {
        const {
            position = new THREE.Vector3(0, 1.5, 0),
            width = 2,
            height = 3,
            thickness = 0.2,
            locked = false,
            keyRequired = null,
            material = MATERIALS.WOOD
        } = config;
        
        const doorGroup = new THREE.Group();
        
        // Door mesh
        const doorGeometry = new THREE.BoxGeometry(width, height, thickness);
        const doorMesh = new THREE.Mesh(doorGeometry, material);
        doorGroup.add(doorMesh);
        
        // Lock indicator
        if (locked) {
            const lockGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const lockMaterial = new THREE.MeshBasicMaterial({
                color: COLORS.LOCKED,
                emissive: COLORS.LOCKED,
                emissiveIntensity: 0.5
            });
            const lockMesh = new THREE.Mesh(lockGeometry, lockMaterial);
            lockMesh.position.set(width * 0.4, 0, thickness/2 + 0.1);
            doorGroup.add(lockMesh);
        }
        
        doorGroup.position.copy(position);
        doorGroup.userData = {
            type: 'door',
            locked,
            keyRequired,
            isOpen: false
        };
        
        return doorGroup;
    },
    
    /**
     * Create a switch/button
     * @param {Object} config - Switch configuration
     * @returns {THREE.Group} Switch group
     */
    createSwitch(config = {}) {
        const {
            position = new THREE.Vector3(0, 1, 0),
            size = 0.3,
            color = COLORS.INACTIVE,
            activeColor = COLORS.ACTIVE,
            onActivate = () => {}
        } = config;
        
        const switchGroup = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(size * 1.5, size * 0.5, size * 1.5);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: COLORS.METAL });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        switchGroup.add(base);
        
        // Button
        const buttonGeometry = new THREE.SphereGeometry(size, 8, 8);
        const buttonMaterial = new THREE.MeshBasicMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.y = size * 0.5;
        switchGroup.add(button);
        
        switchGroup.position.copy(position);
        switchGroup.userData = {
            type: 'switch',
            active: false,
            button,
            activeColor,
            inactiveColor: color,
            onActivate
        };
        
        return switchGroup;
    }
};

// ====================
// HELPER FUNCTIONS
// ====================

/**
 * Create a grid of objects
 * @param {Function} createFunc - Function to create each object
 * @param {Object} config - Grid configuration
 * @returns {Array} Array of created objects
 */
export function createGrid(createFunc, config = {}) {
    const {
        rows = 5,
        cols = 5,
        spacing = 2,
        centerX = 0,
        centerZ = 0
    } = config;
    
    const objects = [];
    const startX = centerX - (cols - 1) * spacing / 2;
    const startZ = centerZ - (rows - 1) * spacing / 2;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = startX + col * spacing;
            const z = startZ + row * spacing;
            const obj = createFunc(x, z, row, col);
            if (obj) objects.push(obj);
        }
    }
    
    return objects;
}

/**
 * Create a circular arrangement of objects
 * @param {Function} createFunc - Function to create each object
 * @param {Object} config - Circle configuration
 * @returns {Array} Array of created objects
 */
export function createCircle(createFunc, config = {}) {
    const {
        count = 8,
        radius = 10,
        centerX = 0,
        centerZ = 0,
        startAngle = 0
    } = config;
    
    const objects = [];
    
    for (let i = 0; i < count; i++) {
        const angle = startAngle + (i / count) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;
        const obj = createFunc(x, z, i, angle);
        if (obj) objects.push(obj);
    }
    
    return objects;
}

/**
 * Calculate distance between two points (2D)
 * @param {Object} a - First point with x and z properties
 * @param {Object} b - Second point with x and z properties
 * @returns {Number} Distance
 */
export function distance2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Clamp a value between min and max
 * @param {Number} value - Value to clamp
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @returns {Number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 * @param {Number} a - Start value
 * @param {Number} b - End value
 * @param {Number} t - Interpolation factor (0-1)
 * @returns {Number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Export all namespaces as a single object for convenience
export const LevelUtils = {
    Geometry,
    Lighting,
    Animation,
    Particles,
    Interactive,
    createGrid,
    createCircle,
    distance2D,
    clamp,
    lerp
};
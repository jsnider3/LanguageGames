import * as THREE from 'three';

/**
 * Transition Zone implementations for seamless level transitions
 * These are small areas that connect major zones and hide loading
 */

/**
 * Base class for all transition zones
 */
export class TransitionZone {
    constructor(scene, config) {
        this.scene = scene;
        this.id = config.id;
        this.name = config.name;
        this.fromZone = config.fromZone;
        this.toZone = config.toZone;
        this.length = config.length || 10;
        this.group = new THREE.Group();
        this.lights = [];
        this.isActive = false;
    }
    
    /**
     * Create the transition zone geometry
     */
    create() {
        // Override in subclasses
    }
    
    /**
     * Activate the transition zone
     */
    activate() {
        if (this.isActive) return;
        
        this.create();
        this.scene.add(this.group);
        this.isActive = true;
    }
    
    /**
     * Deactivate and clean up
     */
    deactivate() {
        if (!this.isActive) return;
        
        this.scene.remove(this.group);
        this.lights.forEach(light => this.scene.remove(light));
        this.lights = [];
        
        // Dispose of geometries and materials
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        this.group = new THREE.Group();
        this.isActive = false;
    }
    
    /**
     * Update animation
     */
    update(deltaTime) {
        // Override for animated elements
    }
    
    /**
     * Check if player has reached the end
     */
    checkCompletion(playerPosition) {
        // Override in subclasses
        return false;
    }
}

/**
 * Security corridor between Chapel and Armory
 */
export class SecurityCorridor extends TransitionZone {
    create() {
        const width = 4;
        const height = 3.5;
        const length = this.length;
        
        // Materials
        const concreteMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.8
        });
        
        // Floor (positioned so corridor extends from z=0 to z=length)
        const floorGeometry = new THREE.PlaneGeometry(width, length);
        const floor = new THREE.Mesh(floorGeometry, concreteMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.z = length / 2; // Center the floor along z-axis
        floor.receiveShadow = true;
        this.group.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, concreteMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        ceiling.position.z = length / 2; // Match floor position
        this.group.add(ceiling);
        
        // Walls
        const wallGeometry = new THREE.PlaneGeometry(length, height);
        
        const leftWall = new THREE.Mesh(wallGeometry, concreteMaterial);
        leftWall.position.x = -width / 2;
        leftWall.position.y = height / 2;
        leftWall.position.z = length / 2; // Center along corridor
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.group.add(leftWall);
        
        const rightWall = new THREE.Mesh(wallGeometry, concreteMaterial);
        rightWall.position.x = width / 2;
        rightWall.position.y = height / 2;
        rightWall.position.z = length / 2; // Center along corridor
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.group.add(rightWall);
        
        // Add doors at both ends
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Entrance door (returns to previous level) at z=0
        const doorGeometry = new THREE.BoxGeometry(width, height - 0.5, 0.3);
        const entranceDoor = new THREE.Mesh(doorGeometry, doorMaterial.clone());
        entranceDoor.position.set(0, (height - 0.5) / 2, 0); // Exactly at z=0
        entranceDoor.userData = { 
            isEntranceDoor: true, 
            isSolid: true,  // Make it solid
            isDoor: true,
            toLevel: this.fromZone,  // Goes back to previous level
            requiresInteraction: true
        };
        // Blue glow for return door
        entranceDoor.material.emissive = new THREE.Color(0x0066ff);
        entranceDoor.material.emissiveIntensity = 0.2;
        this.group.add(entranceDoor);
        
        // Exit door (goes to next level) at z=30 (or length)
        const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial.clone());
        exitDoor.position.set(0, (height - 0.5) / 2, length); // Exactly at z=length (30)
        exitDoor.userData = { 
            isExitDoor: true, 
            isSolid: true,
            isDoor: true,
            toLevel: this.toZone,  // Goes to next level
            requiresInteraction: true
        };
        // Green glow for forward door
        exitDoor.material.emissive = new THREE.Color(0x00ff00);
        exitDoor.material.emissiveIntensity = 0.2;
        this.group.add(exitDoor);
        
        // Security checkpoint elements
        this.addSecurityCheckpoint(metalMaterial);
        
        // Lighting
        this.addLighting();
        
        // Warning signs
        this.addWarningSigns();
    }
    
    addSecurityCheckpoint(material) {
        // Just add security cameras, no metal detector frame
        const cameraGeometry = new THREE.ConeGeometry(0.2, 0.4, 6);
        const cameraMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.8
        });
        
        // Security camera near entrance
        const securityCamera1 = new THREE.Mesh(cameraGeometry, cameraMaterial);
        securityCamera1.position.set(1.8, 3.2, this.length * 0.2);
        securityCamera1.rotation.z = -Math.PI / 2;
        securityCamera1.rotation.x = -0.3;
        this.group.add(securityCamera1);
        
        // Security camera near exit
        const securityCamera2 = new THREE.Mesh(cameraGeometry, cameraMaterial);
        securityCamera2.position.set(-1.8, 3.2, this.length * 0.8);
        securityCamera2.rotation.z = Math.PI / 2;
        securityCamera2.rotation.x = -0.3;
        this.group.add(securityCamera2);
        
        // Red lights on cameras - add to group so they transform with corridor
        const redLight1 = new THREE.PointLight(0xff0000, 0.5, 2);
        redLight1.position.copy(securityCamera1.position);
        this.group.add(redLight1);  // Add to group, not scene
        this.lights.push(redLight1);
        
        const redLight2 = new THREE.PointLight(0xff0000, 0.5, 2);
        redLight2.position.copy(securityCamera2.position);
        this.group.add(redLight2);  // Add to group, not scene
        this.lights.push(redLight2);
    }
    
    addLighting() {
        // Fluorescent lights - evenly spaced along the corridor
        // Corridor extends from z=0 to z=30, so place lights at 7.5, 15, and 22.5
        const lightPositions = [this.length * 0.25, this.length * 0.5, this.length * 0.75];
        
        lightPositions.forEach(z => {
            // Light fixture
            const fixtureGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
            const fixtureMaterial = new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                emissive: 0xffffff,
                emissiveIntensity: 0.5
            });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(0, 3.4, z);
            this.group.add(fixture);
            
            // Actual light - add to group so it transforms with corridor
            const light = new THREE.PointLight(0xffffcc, 0.8, 8);
            light.position.set(0, 3.2, z);
            this.group.add(light);  // Add to group, not scene
            this.lights.push(light);
        });
    }
    
    addWarningSigns() {
        // Just add a simple "SECURITY CHECKPOINT" sign above entrance
        const signGeometry = new THREE.PlaneGeometry(3, 0.5);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            emissive: 0xffff00,
            emissiveIntensity: 0.1
        });
        
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 3, 2); // Near entrance
        this.group.add(sign);
    }
    
    checkCompletion(playerPosition) {
        // Check if player has walked through the corridor
        return Math.abs(playerPosition.z) > this.length / 2;
    }
}

/**
 * Freight elevator between Armory and Laboratory
 */
export class FreightElevator extends TransitionZone {
    constructor(scene, config) {
        super(scene, config);
        this.elevatorCar = null;
        this.doors = { front: null, back: null };
        this.currentFloor = 0;
        this.targetFloor = 1;
        this.isMoving = false;
        this.doorOpen = true;
    }
    
    create() {
        // Elevator shaft
        this.createShaft();
        
        // Elevator car
        this.createElevatorCar();
        
        // Control panel
        this.createControlPanel();
        
        // Lighting
        this.addLighting();
    }
    
    createShaft() {
        const shaftMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.95,
            metalness: 0.1
        });
        
        // Shaft walls (visible when doors open)
        const shaftWidth = 5;
        const shaftDepth = 4;
        const shaftHeight = 10;
        
        const shaftGeometry = new THREE.BoxGeometry(
            shaftWidth, 
            shaftHeight, 
            shaftDepth
        );
        
        // Remove front and back faces for door openings
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = shaftHeight / 2;
        this.group.add(shaft);
    }
    
    createElevatorCar() {
        this.elevatorCar = new THREE.Group();
        
        const carMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.7,
            metalness: 0.3
        });
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(4, 3);
        const floor = new THREE.Mesh(floorGeometry, carMaterial);
        floor.rotation.x = -Math.PI / 2;
        this.elevatorCar.add(floor);
        
        // Back wall
        const wallGeometry = new THREE.PlaneGeometry(4, 3);
        const backWall = new THREE.Mesh(wallGeometry, carMaterial);
        backWall.position.z = -1.5;
        backWall.position.y = 1.5;
        this.elevatorCar.add(backWall);
        
        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(3, 3);
        
        const leftWall = new THREE.Mesh(sideWallGeometry, carMaterial);
        leftWall.position.x = -2;
        leftWall.position.y = 1.5;
        leftWall.rotation.y = Math.PI / 2;
        this.elevatorCar.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, carMaterial);
        rightWall.position.x = 2;
        rightWall.position.y = 1.5;
        rightWall.rotation.y = -Math.PI / 2;
        this.elevatorCar.add(rightWall);
        
        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, carMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 3;
        this.elevatorCar.add(ceiling);
        
        // Doors
        this.createDoors();
        
        this.group.add(this.elevatorCar);
    }
    
    createDoors() {
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.4,
            metalness: 0.6
        });
        
        // Front doors (split)
        const doorGeometry = new THREE.BoxGeometry(2, 3, 0.1);
        
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(-1, 1.5, 1.5);
        this.elevatorCar.add(leftDoor);
        
        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        rightDoor.position.set(1, 1.5, 1.5);
        this.elevatorCar.add(rightDoor);
        
        this.doors.front = { left: leftDoor, right: rightDoor };
    }
    
    createControlPanel() {
        const panelGroup = new THREE.Group();
        
        // Panel backing
        const panelGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.1);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.3
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panelGroup.add(panel);
        
        // Buttons
        const buttonGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8);
        const buttonMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });
        
        // Floor buttons
        for (let i = 0; i < 3; i++) {
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(0, 0.2 - i * 0.15, 0.06);
            button.rotation.x = Math.PI / 2;
            panelGroup.add(button);
        }
        
        // Emergency stop
        const emergencyButton = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.03, 8),
            new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            })
        );
        emergencyButton.position.set(0, -0.3, 0.06);
        emergencyButton.rotation.x = Math.PI / 2;
        panelGroup.add(emergencyButton);
        
        panelGroup.position.set(1.8, 1.2, -1.4);
        this.elevatorCar.add(panelGroup);
    }
    
    addLighting() {
        // Ceiling light in elevator car
        const carLight = new THREE.PointLight(0xffffcc, 0.8, 5);
        carLight.position.set(0, 2.8, 0);
        this.elevatorCar.add(carLight);
        
        // Emergency lighting (red)
        const emergencyLight = new THREE.PointLight(0xff0000, 0.3, 3);
        emergencyLight.position.set(0, 2.8, -1);
        this.elevatorCar.add(emergencyLight);
    }
    
    /**
     * Animate door opening/closing
     */
    async animateDoors(open) {
        return new Promise(resolve => {
            const targetX = open ? 1.8 : 1;
            const duration = 1000; // 1 second
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const eased = open ? 
                    this.easeOutCubic(progress) : 
                    this.easeInCubic(progress);
                
                const currentX = open ?
                    1 + eased * 0.8 :
                    1.8 - eased * 0.8;
                
                this.doors.front.left.position.x = -currentX;
                this.doors.front.right.position.x = currentX;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.doorOpen = open;
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    /**
     * Animate elevator movement
     */
    async moveElevator(targetFloor) {
        if (this.isMoving) return;
        
        this.isMoving = true;
        this.targetFloor = targetFloor;
        
        // Close doors
        await this.animateDoors(false);
        
        // Move elevator
        const targetY = targetFloor * 5; // 5 units per floor
        const duration = 3000; // 3 seconds
        const startY = this.elevatorCar.position.y;
        const startTime = Date.now();
        
        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const eased = this.easeInOutCubic(progress);
                this.elevatorCar.position.y = startY + (targetY - startY) * eased;
                
                // Add slight shake
                if (progress > 0.1 && progress < 0.9) {
                    this.elevatorCar.position.x = (Math.random() - 0.5) * 0.02;
                    this.elevatorCar.position.z = (Math.random() - 0.5) * 0.02;
                } else {
                    this.elevatorCar.position.x = 0;
                    this.elevatorCar.position.z = 0;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.currentFloor = targetFloor;
                    this.isMoving = false;
                    
                    // Open doors
                    this.animateDoors(true).then(resolve);
                }
            };
            
            animate();
        });
    }
    
    // Easing functions
    easeInCubic(t) {
        return t * t * t;
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 
            4 * t * t * t : 
            1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Start elevator transition sequence
     */
    async startTransition() {
        // Player enters elevator
        console.log('[Elevator] Starting transition');
        
        // Move to next floor
        await this.moveElevator(this.targetFloor === 0 ? 1 : 0);
        
        console.log('[Elevator] Transition complete');
    }
}

/**
 * Ventilation shaft for secret passages
 */
export class VentilationShaft extends TransitionZone {
    create() {
        const width = 1.5;
        const height = 1.5;
        const length = this.length;
        
        // Vent material (darker metal)
        const ventMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.7
        });
        
        // Create octagonal vent shape
        const ventShape = new THREE.Shape();
        const segments = 8;
        const radius = width / 2;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ventShape.moveTo(x, y);
            } else {
                ventShape.lineTo(x, y);
            }
        }
        ventShape.closePath();
        
        // Extrude to create tunnel
        const extrudeSettings = {
            steps: Math.floor(length),
            depth: length,
            bevelEnabled: false
        };
        
        const ventGeometry = new THREE.ExtrudeGeometry(ventShape, extrudeSettings);
        const vent = new THREE.Mesh(ventGeometry, ventMaterial);
        vent.rotation.x = Math.PI / 2;
        vent.position.z = -length / 2;
        this.group.add(vent);
        
        // Add grates at intervals
        this.addGrates(ventMaterial);
        
        // Add steam effects
        this.addSteamEffects();
        
        // Emergency lighting
        this.addEmergencyLighting();
    }
    
    addGrates(material) {
        const gratePositions = [-this.length/3, 0, this.length/3];
        
        gratePositions.forEach(z => {
            const grateGroup = new THREE.Group();
            
            // Create grate pattern
            for (let i = -3; i <= 3; i++) {
                const bar = new THREE.Mesh(
                    new THREE.BoxGeometry(0.05, 1.4, 0.1),
                    material
                );
                bar.position.x = i * 0.2;
                grateGroup.add(bar);
            }
            
            grateGroup.position.z = z;
            grateGroup.position.y = 0.75;
            this.group.add(grateGroup);
        });
    }
    
    addSteamEffects() {
        // Particle system for steam
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.length;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.group.add(particleSystem);
        
        // Store for animation
        this.steamParticles = particleSystem;
    }
    
    addEmergencyLighting() {
        // Dim red emergency lights
        const lightSpacing = this.length / 3;
        
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(0xff0000, 0.2, 3);
            light.position.set(0, 0.7, -this.length/2 + (i + 1) * lightSpacing);
            this.scene.add(light);
            this.lights.push(light);
        }
    }
    
    update(deltaTime) {
        // Animate steam particles
        if (this.steamParticles) {
            const positions = this.steamParticles.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Move particles slowly upward
                positions[i + 1] += deltaTime * 0.1;
                
                // Wrap around when reaching top
                if (positions[i + 1] > 0.75) {
                    positions[i + 1] = -0.75;
                }
                
                // Add slight drift
                positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.001;
            }
            
            this.steamParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    checkCompletion(playerPosition) {
        // Check if player has crawled through the vent
        return Math.abs(playerPosition.z) > this.length / 2;
    }
}

/**
 * Factory to create transition zones
 */
export class TransitionZoneFactory {
    static create(scene, type, config) {
        switch (type) {
            case 'corridor':
                return new SecurityCorridor(scene, config);
            case 'elevator':
                return new FreightElevator(scene, config);
            case 'vent':
                return new VentilationShaft(scene, config);
            default:
                return new TransitionZone(scene, config);
        }
    }
}
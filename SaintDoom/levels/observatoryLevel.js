import { BaseLevel } from './baseLevel.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';
import { Imp } from '../enemies/imp.js';
import * as THREE from 'three';

export class ObservatoryLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.name = "Observatory Tower";
        this.description = "Ascend the corrupted observatory where reality bends and gravity fails";
        this.backgroundColor = new THREE.Color(0x0a0a2a);
        
        this.floors = [];
        this.currentFloor = 0;
        this.maxFloors = 8;
        this.zeroGravityZones = [];
        this.gravityFields = [];
        this.telescope = null;
        this.elevators = [];
        this.observationDeck = null;
        
        this.gravityEnabled = true;
        this.originalGravity = -9.81;
        this.floatingObjects = [];
        this.starMap = null;
        
        this.init();
    }

    init() {
        this.createGeometry();
        this.createLighting();
        this.createElevators();
        this.createZeroGravityZones();
        this.createTelescope();
        this.createFloatingObjects();
        this.createStarField();
        this.setupObjectives();
        this.createEnvironmentalDetails();
    }

    createGeometry() {
        const towerRadius = 15;
        const floorHeight = 12;
        
        // Create each floor of the tower
        for (let floor = 0; floor < this.maxFloors; floor++) {
            const floorGroup = new THREE.Group();
            const floorY = floor * floorHeight;
            
            // Floor platform
            const floorGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, 1, 16);
            const floorMaterial = new THREE.MeshLambertMaterial({ 
                color: floor % 2 === 0 ? 0x2a2a4a : 0x1a1a3a,
                transparent: true,
                opacity: 0.9
            });
            const floorPlatform = new THREE.Mesh(floorGeometry, floorMaterial);
            floorPlatform.position.set(0, floorY, 0);
            floorGroup.add(floorPlatform);
            
            // Outer walls with windows
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.cos(angle) * (towerRadius + 1);
                const z = Math.sin(angle) * (towerRadius + 1);
                
                const wallGeometry = new THREE.BoxGeometry(3, floorHeight - 2, 0.5);
                const wallMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x3a3a5a,
                    transparent: true,
                    opacity: 0.8
                });
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x, floorY + floorHeight/2, z);
                wall.lookAt(new THREE.Vector3(0, floorY + floorHeight/2, 0));
                floorGroup.add(wall);
                
                // Windows (every other wall section)
                if (i % 2 === 0) {
                    const windowGeometry = new THREE.PlaneGeometry(2, 6);
                    const windowMaterial = new THREE.MeshBasicMaterial({ 
                        color: 0x4444aa,
                        transparent: true,
                        opacity: 0.3
                    });
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.position.set(
                        Math.cos(angle) * (towerRadius + 0.8),
                        floorY + floorHeight/2,
                        Math.sin(angle) * (towerRadius + 0.8)
                    );
                    window.lookAt(new THREE.Vector3(0, floorY + floorHeight/2, 0));
                    floorGroup.add(window);
                }
            }
            
            // Central pillar for stability
            if (floor < this.maxFloors - 1) {
                const pillarGeometry = new THREE.CylinderGeometry(2, 2, floorHeight - 1);
                const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a6a });
                const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                pillar.position.set(0, floorY + floorHeight/2, 0);
                floorGroup.add(pillar);
            }
            
            // Equipment on specific floors
            this.addFloorEquipment(floorGroup, floor, floorY);
            
            floorGroup.userData.floorNumber = floor;
            floorGroup.userData.height = floorY;
            this.floors.push(floorGroup);
            this.scene.add(floorGroup);
        }
        
        // Create observation dome at the top
        this.createObservationDome();
    }

    createObservationDome() {
        const domeY = this.maxFloors * 12;
        const domeGroup = new THREE.Group();
        
        // Glass dome
        const domeGeometry = new THREE.SphereGeometry(20, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const domeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x2244aa,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.set(0, domeY + 5, 0);
        domeGroup.add(dome);
        
        // Dome frame
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const frameGeometry = new THREE.CylinderGeometry(0.2, 0.2, 20);
            const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(
                Math.cos(angle) * 15,
                domeY + 10,
                Math.sin(angle) * 15
            );
            frame.rotation.z = angle + Math.PI/2;
            frame.rotation.x = Math.PI/4;
            domeGroup.add(frame);
        }
        
        domeGroup.position.set(0, 0, 0);
        this.observationDeck = domeGroup;
        this.scene.add(domeGroup);
    }

    addFloorEquipment(floorGroup, floorNumber, floorY) {
        switch (floorNumber) {
            case 1: // Computer terminals
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const terminal = this.createTerminal(
                        Math.cos(angle) * 10,
                        floorY + 1.5,
                        Math.sin(angle) * 10
                    );
                    terminal.rotation.y = angle + Math.PI;
                    floorGroup.add(terminal);
                }
                break;
                
            case 3: // Research equipment
                const researchTable = new THREE.Group();
                const tableGeometry = new THREE.CylinderGeometry(3, 3, 0.2);
                const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
                const table = new THREE.Mesh(tableGeometry, tableMaterial);
                table.position.set(0, floorY + 1.1, 0);
                researchTable.add(table);
                
                // Add equipment on table
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const equipGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
                    const equipMaterial = new THREE.MeshLambertMaterial({ 
                        color: 0x4a4a8a,
                        emissive: 0x111133
                    });
                    const equipment = new THREE.Mesh(equipGeometry, equipMaterial);
                    equipment.position.set(
                        Math.cos(angle) * 2,
                        floorY + 1.6,
                        Math.sin(angle) * 2
                    );
                    researchTable.add(equipment);
                }
                floorGroup.add(researchTable);
                break;
                
            case 5: // Gravity control station
                const controlStation = this.createGravityControlStation();
                controlStation.position.set(0, floorY + 1, 0);
                floorGroup.add(controlStation);
                break;
        }
    }

    createTerminal(x, y, z) {
        const terminalGroup = new THREE.Group();
        
        // Base
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        terminalGroup.add(base);
        
        // Screen
        const screenGeometry = new THREE.PlaneGeometry(1.2, 0.8);
        const screenMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aa00,
            emissive: 0x004400
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.2, 0.51);
        terminalGroup.add(screen);
        
        terminalGroup.position.set(x, y, z);
        return terminalGroup;
    }

    createGravityControlStation() {
        const stationGroup = new THREE.Group();
        
        // Main console
        const consoleGeometry = new THREE.CylinderGeometry(2, 2.5, 2);
        const consoleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a8a });
        const console = new THREE.Mesh(consoleGeometry, consoleMaterial);
        console.position.y = 1;
        stationGroup.add(console);
        
        // Control orb
        const orbGeometry = new THREE.SphereGeometry(0.5);
        const orbMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8888ff,
            emissive: 0x4444aa,
            transparent: true,
            opacity: 0.8
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.y = 2.5;
        stationGroup.add(orb);
        
        stationGroup.userData.orb = orb;
        stationGroup.userData.isGravityController = true;
        
        return stationGroup;
    }

    createLighting() {
        // Dim ambient light for space atmosphere
        const ambientLight = new THREE.AmbientLight(0x2222aa, 0.3);
        this.scene.add(ambientLight);

        // Floor lighting
        for (let floor = 0; floor < this.maxFloors; floor++) {
            const floorY = floor * 12;
            
            // Central light for each floor
            const floorLight = new THREE.PointLight(0x6666ff, 0.8, 25);
            floorLight.position.set(0, floorY + 8, 0);
            this.scene.add(floorLight);
            
            // Window lighting
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const windowLight = new THREE.PointLight(0x4444cc, 0.4, 15);
                windowLight.position.set(
                    Math.cos(angle) * 12,
                    floorY + 6,
                    Math.sin(angle) * 12
                );
                this.scene.add(windowLight);
            }
        }
        
        // Observatory dome lighting
        const domeLight = new THREE.PointLight(0x8888ff, 1.2, 35);
        domeLight.position.set(0, this.maxFloors * 12 + 15, 0);
        this.scene.add(domeLight);
    }

    createElevators() {
        // Create two elevators on opposite sides
        const elevatorPositions = [
            { x: 12, z: 0 },
            { x: -12, z: 0 }
        ];
        
        elevatorPositions.forEach((pos, index) => {
            const elevator = this.createElevator(pos.x, pos.z, index);
            this.elevators.push(elevator);
            this.scene.add(elevator);
        });
    }

    createElevator(x, z, id) {
        const elevatorGroup = new THREE.Group();
        
        // Elevator shaft
        const shaftGeometry = new THREE.BoxGeometry(3, this.maxFloors * 12, 3);
        const shaftMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a3a3a,
            transparent: true,
            opacity: 0.8
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.set(0, this.maxFloors * 6, 0);
        elevatorGroup.add(shaft);
        
        // Elevator car
        const carGeometry = new THREE.BoxGeometry(2.8, 3, 2.8);
        const carMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        const car = new THREE.Mesh(carGeometry, carMaterial);
        car.position.set(0, 1.5, 0);
        elevatorGroup.add(car);
        
        // Call buttons on each floor
        for (let floor = 0; floor < this.maxFloors; floor++) {
            const buttonY = floor * 12 + 6;
            const buttonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1);
            const buttonMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00aa00,
                emissive: 0x004400
            });
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(1.6, buttonY, 0);
            button.rotation.z = Math.PI/2;
            elevatorGroup.add(button);
        }
        
        elevatorGroup.position.set(x, 0, z);
        elevatorGroup.userData.id = id;
        elevatorGroup.userData.currentFloor = 0;
        elevatorGroup.userData.car = car;
        elevatorGroup.userData.moving = false;
        
        return elevatorGroup;
    }

    createZeroGravityZones() {
        // Create zero gravity zones on specific floors
        const zeroGFloors = [2, 4, 6, 7]; // Zero gravity on these floors
        
        zeroGFloors.forEach(floorNumber => {
            const zone = this.createZeroGravityZone(floorNumber);
            this.zeroGravityZones.push(zone);
        });
    }

    createZeroGravityZone(floorNumber) {
        const floorY = floorNumber * 12;
        const zoneGroup = new THREE.Group();
        
        // Gravity field visualization
        const fieldGeometry = new THREE.CylinderGeometry(14, 14, 10, 16);
        const fieldMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4444ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.set(0, floorY + 6, 0);
        zoneGroup.add(field);
        
        // Floating particles to show zero gravity
        this.createZeroGravityParticles(zoneGroup, floorY);
        
        // Gravity generator
        const generatorGeometry = new THREE.SphereGeometry(1, 8, 8);
        const generatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8888ff,
            emissive: 0x3333aa,
            transparent: true,
            opacity: 0.7
        });
        const generator = new THREE.Mesh(generatorGeometry, generatorMaterial);
        generator.position.set(0, floorY + 10, 0);
        zoneGroup.add(generator);
        
        zoneGroup.userData.floorNumber = floorNumber;
        zoneGroup.userData.field = field;
        zoneGroup.userData.generator = generator;
        zoneGroup.userData.active = true;
        
        this.scene.add(zoneGroup);
        return zoneGroup;
    }

    createZeroGravityParticles(zoneGroup, floorY) {
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random position within cylinder
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 13;
            const height = Math.random() * 10;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = floorY + 1 + height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            colors[i * 3] = 0.4 + Math.random() * 0.4;
            colors[i * 3 + 1] = 0.4 + Math.random() * 0.4;
            colors[i * 3 + 2] = 1.0;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        zoneGroup.add(particleSystem);
        zoneGroup.userData.particles = particleSystem;
    }

    createTelescope() {
        const telescopeGroup = new THREE.Group();
        const domeY = this.maxFloors * 12;
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(2, 3, 3);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, domeY + 2, 0);
        telescopeGroup.add(base);
        
        // Main tube
        const tubeGeometry = new THREE.CylinderGeometry(0.8, 1, 8);
        const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.position.set(0, domeY + 7, 0);
        tube.rotation.z = Math.PI / 6; // Angle it upward
        telescopeGroup.add(tube);
        
        // Eyepiece
        const eyepieceGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1);
        const eyepieceMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        const eyepiece = new THREE.Mesh(eyepieceGeometry, eyepieceMaterial);
        eyepiece.position.set(0, domeY + 3.5, 0);
        telescopeGroup.add(eyepiece);
        
        // Lens (objective)
        const lensGeometry = new THREE.CircleGeometry(0.7, 16);
        const lensMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4444aa,
            transparent: true,
            opacity: 0.3
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.set(0, domeY + 10.5, 0);
        lens.rotation.x = Math.PI/2;
        telescopeGroup.add(lens);
        
        telescopeGroup.userData.corrupted = false;
        telescopeGroup.userData.tube = tube;
        telescopeGroup.userData.lens = lens;
        
        this.telescope = telescopeGroup;
        this.scene.add(telescopeGroup);
    }

    createFloatingObjects() {
        // Create objects that float in zero gravity zones
        const objectTypes = [
            { geometry: new THREE.BoxGeometry(1, 1, 1), color: 0x6a4a4a },
            { geometry: new THREE.SphereGeometry(0.5), color: 0x4a6a4a },
            { geometry: new THREE.ConeGeometry(0.5, 1.5), color: 0x4a4a6a }
        ];
        
        this.zeroGravityZones.forEach(zone => {
            const floorY = zone.userData.floorNumber * 12;
            
            for (let i = 0; i < 8; i++) {
                const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
                const objectMaterial = new THREE.MeshLambertMaterial({ color: objectType.color });
                const object = new THREE.Mesh(objectType.geometry, objectMaterial);
                
                const angle = Math.random() * Math.PI * 2;
                const radius = 3 + Math.random() * 8;
                object.position.set(
                    Math.cos(angle) * radius,
                    floorY + 2 + Math.random() * 8,
                    Math.sin(angle) * radius
                );
                
                object.userData.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01
                );
                object.userData.angularVelocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                );
                
                this.floatingObjects.push(object);
                this.scene.add(object);
            }
        });
    }

    createStarField() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            // Create stars in a large sphere around the observatory
            const radius = 500 + Math.random() * 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            const intensity = 0.5 + Math.random() * 0.5;
            colors[i * 3] = intensity;
            colors[i * 3 + 1] = intensity;
            colors[i * 3 + 2] = intensity;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        this.starMap = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starMap);
    }

    setupObjectives() {
        this.objectives = [
            {
                id: 'reach_top',
                description: 'Reach the observatory at the top of the tower',
                completed: false,
                type: 'location'
            },
            {
                id: 'activate_telescope',
                description: 'Activate the main telescope',
                completed: false,
                type: 'interact'
            },
            {
                id: 'survive_corruption',
                description: 'Survive the stellar corruption event',
                completed: false,
                type: 'survival'
            }
        ];
    }

    createEnvironmentalDetails() {
        // Add research notes and equipment scattered throughout
        for (let floor = 1; floor < this.maxFloors; floor++) {
            const floorY = floor * 12;
            
            // Research papers
            for (let i = 0; i < 3; i++) {
                const paperGeometry = new THREE.PlaneGeometry(0.5, 0.7);
                const paperMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });
                const paper = new THREE.Mesh(paperGeometry, paperMaterial);
                
                const angle = Math.random() * Math.PI * 2;
                const radius = 8 + Math.random() * 5;
                paper.position.set(
                    Math.cos(angle) * radius,
                    floorY + 0.1,
                    Math.sin(angle) * radius
                );
                paper.rotation.x = -Math.PI/2;
                paper.rotation.z = Math.random() * Math.PI;
                this.scene.add(paper);
            }
        }
        
        // Broken equipment
        const brokenEquipment = [
            { pos: { x: 8, y: 24, z: 3 }, size: { w: 2, h: 1.5, d: 1 } },
            { pos: { x: -5, y: 48, z: -8 }, size: { w: 1.5, h: 2, d: 1.5 } },
            { pos: { x: 6, y: 72, z: -4 }, size: { w: 1, h: 1, d: 2 } }
        ];
        
        brokenEquipment.forEach(eq => {
            const equipGeometry = new THREE.BoxGeometry(eq.size.w, eq.size.h, eq.size.d);
            const equipMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a4a4a,
                transparent: true,
                opacity: 0.7
            });
            const equipment = new THREE.Mesh(equipGeometry, equipMaterial);
            equipment.position.set(eq.pos.x, eq.pos.y, eq.pos.z);
            equipment.rotation.set(
                Math.random() * 0.5,
                Math.random() * Math.PI,
                Math.random() * 0.5
            );
            this.scene.add(equipment);
        });
    }

    handlePlayerMovement(player) {
        if (!player) return;
        
        const playerY = player.position.y;
        const currentFloor = Math.floor(playerY / 12);
        
        // Check if player is in a zero gravity zone
        const inZeroGravity = this.zeroGravityZones.some(zone => {
            if (!zone.userData.active) return false;
            
            const floorNumber = zone.userData.floorNumber;
            const floorY = floorNumber * 12;
            const distance = player.position.distanceTo(new THREE.Vector3(0, floorY + 6, 0));
            
            return distance < 14 && Math.abs(playerY - (floorY + 6)) < 5;
        });
        
        // Modify player physics based on gravity zones
        if (inZeroGravity && this.gravityEnabled) {
            player.userData.inZeroGravity = true;
            player.userData.velocity = player.userData.velocity || new THREE.Vector3();
            
            // Reduce gravity effect
            player.userData.velocity.y *= 0.95;
            
            // Add floating movement
            if (Math.random() < 0.1) {
                player.userData.velocity.add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.001,
                    (Math.random() - 0.5) * 0.001,
                    (Math.random() - 0.5) * 0.001
                ));
            }
        } else {
            player.userData.inZeroGravity = false;
        }
        
        this.currentFloor = currentFloor;
    }

    activateTelescope() {
        if (this.telescope && !this.telescope.userData.corrupted) {
            this.telescope.userData.corrupted = true;
            
            // Change telescope appearance
            const lens = this.telescope.userData.lens;
            if (lens) {
                lens.material.color.setHex(0xff4444);
                lens.material.emissive.setHex(0x440000);
            }
            
            // Trigger corruption event
            this.triggerCorruptionEvent();
            
            this.objectives[1].completed = true;
        }
    }

    triggerCorruptionEvent() {
        // Spawn corrupted entities
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const spawnFloor = Math.floor(Math.random() * this.maxFloors);
                const angle = Math.random() * Math.PI * 2;
                const spawnPos = new THREE.Vector3(
                    Math.cos(angle) * 10,
                    spawnFloor * 12 + 2,
                    Math.sin(angle) * 10
                );
                
                const enemy = Math.random() < 0.6 ? 
                    new ShadowWraith(this.scene, spawnPos) :
                    new Imp(this.scene, spawnPos);
                
                this.enemies.push(enemy);
            }, i * 2000);
        }
        
        // Disrupt gravity fields
        this.zeroGravityZones.forEach((zone, index) => {
            setTimeout(() => {
                zone.userData.active = !zone.userData.active;
                const field = zone.userData.field;
                if (field) {
                    field.material.color.setHex(zone.userData.active ? 0x4444ff : 0xff4444);
                    field.material.opacity = zone.userData.active ? 0.1 : 0.05;
                }
            }, index * 1500);
        });
        
        // Complete corruption objective after event
        setTimeout(() => {
            this.objectives[2].completed = true;
        }, 15000);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Animate zero gravity particles
        this.zeroGravityZones.forEach(zone => {
            const particles = zone.userData.particles;
            if (particles && zone.userData.active) {
                const positions = particles.geometry.attributes.position.array;
                const velocities = particles.geometry.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i] * deltaTime;
                    positions[i + 1] += velocities[i + 1] * deltaTime;
                    positions[i + 2] += velocities[i + 2] * deltaTime;
                    
                    // Boundary check
                    const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2]);
                    if (distance > 13) {
                        velocities[i] *= -1;
                        velocities[i + 2] *= -1;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Animate floating objects
        this.floatingObjects.forEach(object => {
            if (object.userData.velocity) {
                object.position.add(object.userData.velocity.clone().multiplyScalar(deltaTime));
                object.rotation.x += object.userData.angularVelocity.x * deltaTime;
                object.rotation.y += object.userData.angularVelocity.y * deltaTime;
                object.rotation.z += object.userData.angularVelocity.z * deltaTime;
                
                // Boundary constraints
                const distance = object.position.distanceToSquared(new THREE.Vector3(0, object.position.y, 0));
                if (distance > 169) { // radius 13
                    object.userData.velocity.x *= -0.8;
                    object.userData.velocity.z *= -0.8;
                }
            }
        });
        
        // Animate telescope if corrupted
        if (this.telescope && this.telescope.userData.corrupted) {
            const tube = this.telescope.userData.tube;
            if (tube) {
                tube.rotation.z = Math.PI / 6 + Math.sin(Date.now() * 0.005) * 0.1;
                tube.rotation.y += deltaTime * 0.001;
            }
        }
        
        // Rotate star field slowly
        if (this.starMap) {
            this.starMap.rotation.y += deltaTime * 0.00005;
        }
        
        // Handle player movement in gravity fields
        if (this.game.player) {
            this.handlePlayerMovement(this.game.player);
        }
        
        // Check if player reached the top
        if (this.game.player && this.game.player.position.y > this.maxFloors * 12 - 5) {
            this.objectives[0].completed = true;
        }
    }

    getSpawnPosition() {
        return new THREE.Vector3(0, 2, 12);
    }

    isComplete() {
        return this.objectives.every(obj => obj.completed);
    }

    cleanup() {
        super.cleanup();
        
        this.floors = [];
        this.zeroGravityZones = [];
        this.gravityFields = [];
        this.elevators = [];
        this.floatingObjects = [];
        
        if (this.starMap) {
            this.scene.remove(this.starMap);
        }
    }
}
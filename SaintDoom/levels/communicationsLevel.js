import { BaseLevel } from './baseLevel.js';
import { Imp } from '../enemies/imp.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';
import * as THREE from 'three';

export class CommunicationsLevel extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;
    
    create() {
        // Return required data structure for Game.js
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }


    init() {
        this.createGeometry();
        this.createLighting();
        this.createPlatforms();
        this.createStairwells();
        this.createElevatorShafts();
        this.createAntennaArray();
        this.createCommunicationNodes();
        this.createTransmissionEquipment();
        this.createEnvironmentalEffects();
        this.setupObjectives();
        this.createEnvironmentalDetails();
    }

    createGeometry() {
        // Main tower structure - tapered cylinder
        const towerSections = 20;
        const sectionHeight = this.towerHeight / towerSections;
        
        for (let i = 0; i < towerSections; i++) {
            const bottomRadius = 15 - (i / towerSections) * 10; // 15 to 5 radius
            const topRadius = 15 - ((i + 1) / towerSections) * 10;
            const y = i * sectionHeight;
            
            const sectionGeometry = new THREE.CylinderGeometry(topRadius, bottomRadius, sectionHeight, 8);
            const sectionMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a4a6a,
                wireframe: i % 4 === 0 // Every 4th section is wireframe for visual interest
            });
            const section = new THREE.Mesh(sectionGeometry, sectionMaterial);
            section.position.set(0, y + sectionHeight/2, 0);
            this.scene.add(section);
            
            // Support beams
            if (i % 3 === 0) {
                this.createSupportBeams(y + sectionHeight/2, bottomRadius);
            }
        }
        
        // Create the base platform
        const baseGeometry = new THREE.CylinderGeometry(20, 20, 3);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a5a });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, -1.5, 0);
        this.scene.add(base);
    }

    createSupportBeams(height, radius) {
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const beamGeometry = new THREE.BoxGeometry(0.5, 15, 0.5);
            const beamMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            
            beam.position.set(
                Math.cos(angle) * (radius + 1),
                height,
                Math.sin(angle) * (radius + 1)
            );
            beam.rotation.z = angle + Math.PI/4;
            this.scene.add(beam);
        }
    }

    createLighting() {
        // Stormy ambient lighting
        const ambientLight = new THREE.AmbientLight(0x2a2a4a, 0.4);
        this.scene.add(ambientLight);

        // Tower navigation lights
        const navLightHeights = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
        navLightHeights.forEach(height => {
            const navLight = new THREE.PointLight(0xff4444, 0.8, 30);
            navLight.position.set(0, height, 0);
            this.scene.add(navLight);
            
            // Blinking effect
            this.animateNavLight(navLight, height);
        });
        
        // Emergency lighting system
        this.createEmergencyLighting();
    }

    animateNavLight(light, height) {
        const originalIntensity = light.intensity;
        const blinkSpeed = 2000 + Math.random() * 1000; // Random blink timing
        
        setInterval(() => {
            light.intensity = light.intensity > 0 ? 0 : originalIntensity;
        }, blinkSpeed);
    }

    createEmergencyLighting() {
        // Red emergency lights on platforms
        this.platforms.forEach((platform, index) => {
            const emergencyLight = new THREE.PointLight(0xff0000, 0, 15);
            emergencyLight.position.copy(platform.position);
            emergencyLight.position.y += 2;
            emergencyLight.userData.isEmergencyLight = true;
            this.scene.add(emergencyLight);
        });
    }

    createPlatforms() {
        const platformHeights = [10, 25, 45, 70, 100, 135, 175, 195];
        
        platformHeights.forEach((height, index) => {
            const platform = this.createPlatform(height, index);
            this.platforms.push(platform);
            this.scene.add(platform);
        });
    }

    createPlatform(height, index) {
        const platformGroup = new THREE.Group();
        const radius = 12 - (height / this.towerHeight) * 8; // Platforms get smaller with height
        
        // Main platform deck
        const deckGeometry = new THREE.CylinderGeometry(radius, radius, 0.5, 16);
        const deckMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a,
            transparent: true,
            opacity: 0.9
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        platformGroup.add(deck);
        
        // Safety railings
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const railingGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.1);
            const railingMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            const railing = new THREE.Mesh(railingGeometry, railingMaterial);
            railing.position.set(
                Math.cos(angle) * radius,
                0.85,
                Math.sin(angle) * radius
            );
            platformGroup.add(railing);
        }
        
        // Top railing
        const topRailGeometry = new THREE.TorusGeometry(radius, 0.05, 4, 16);
        const topRailMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        const topRail = new THREE.Mesh(topRailGeometry, topRailMaterial);
        topRail.position.y = 1.2;
        topRail.rotation.x = -Math.PI / 2;
        platformGroup.add(topRail);
        
        // Platform equipment based on height
        this.addPlatformEquipment(platformGroup, height, radius, index);
        
        platformGroup.position.set(0, height, 0);
        platformGroup.userData.height = height;
        platformGroup.userData.index = index;
        platformGroup.userData.radius = radius;
        
        return platformGroup;
    }

    addPlatformEquipment(platformGroup, height, radius, index) {
        switch (index) {
            case 0: // Base platform - Control room
                this.createControlRoom(platformGroup, radius);
                break;
            case 1: // Power distribution
                this.createPowerDistribution(platformGroup, radius);
                break;
            case 2: // Signal boosters
                this.createSignalBoosters(platformGroup, radius);
                break;
            case 3: // Maintenance equipment
                this.createMaintenanceEquipment(platformGroup, radius);
                break;
            case 4: // Server racks
                this.createServerRacks(platformGroup, radius);
                break;
            case 5: // Weather monitoring
                this.createWeatherStation(platformGroup, radius);
                break;
            case 6: // Transmission amplifiers
                this.createTransmissionAmplifiers(platformGroup, radius);
                break;
            case 7: // Main transmitter
                this.createMainTransmitter(platformGroup, radius);
                break;
        }
    }

    createControlRoom(platformGroup, radius) {
        // Control console
        const consoleGeometry = new THREE.BoxGeometry(4, 1.5, 2);
        const consoleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const console = new THREE.Mesh(consoleGeometry, consoleMaterial);
        console.position.set(0, 1, 0);
        platformGroup.add(console);
        
        // Multiple screens
        for (let i = 0; i < 3; i++) {
            const screenGeometry = new THREE.PlaneGeometry(1, 0.8);
            const screenMaterial = new THREE.MeshBasicMaterial({ 
                color: this.interferenceActive ? 0x444444 : 0x00aa00,
                emissive: this.interferenceActive ? 0x111111 : 0x002200
            });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set((i - 1) * 1.2, 1.8, 1.01);
            platformGroup.add(screen);
        }
    }

    createPowerDistribution(platformGroup, radius) {
        // Power boxes
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const boxGeometry = new THREE.BoxGeometry(1, 2, 0.8);
            const boxMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x5a5a2a,
                emissive: 0x221100
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.set(
                Math.cos(angle) * (radius - 2),
                1.25,
                Math.sin(angle) * (radius - 2)
            );
            platformGroup.add(box);
        }
    }

    createSignalBoosters(platformGroup, radius) {
        // Signal boosting equipment
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const boosterGeometry = new THREE.ConeGeometry(0.5, 3);
            const boosterMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a4a8a,
                emissive: 0x111133
            });
            const booster = new THREE.Mesh(boosterGeometry, boosterMaterial);
            booster.position.set(
                Math.cos(angle) * (radius - 1),
                2,
                Math.sin(angle) * (radius - 1)
            );
            booster.rotation.y = angle;
            platformGroup.add(booster);
        }
    }

    createMaintenanceEquipment(platformGroup, radius) {
        // Tool cabinets and equipment
        const cabinetGeometry = new THREE.BoxGeometry(2, 3, 1);
        const cabinetMaterial = new THREE.MeshLambertMaterial({ color: 0x6a4a4a });
        const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
        cabinet.position.set(radius - 3, 1.75, 0);
        platformGroup.add(cabinet);
        
        // Scattered tools
        for (let i = 0; i < 5; i++) {
            const toolGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.1);
            const toolMaterial = new THREE.MeshLambertMaterial({ color: 0x8a8a4a });
            const tool = new THREE.Mesh(toolGeometry, toolMaterial);
            tool.position.set(
                (Math.random() - 0.5) * radius * 1.5,
                0.5,
                (Math.random() - 0.5) * radius * 1.5
            );
            tool.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            platformGroup.add(tool);
        }
    }

    createServerRacks(platformGroup, radius) {
        // Server equipment
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rackGeometry = new THREE.BoxGeometry(1, 3, 0.6);
            const rackMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            const rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(
                Math.cos(angle) * (radius - 2),
                1.75,
                Math.sin(angle) * (radius - 2)
            );
            platformGroup.add(rack);
            
            // Server lights
            for (let j = 0; j < 6; j++) {
                const lightGeometry = new THREE.SphereGeometry(0.05);
                const lightMaterial = new THREE.MeshBasicMaterial({ 
                    color: Math.random() > 0.5 ? 0x00ff00 : 0xff0000,
                    emissive: Math.random() > 0.5 ? 0x004400 : 0x440000
                });
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.set(0.51, -1 + j * 0.3, 0);
                rack.add(light);
            }
        }
    }

    createWeatherStation(platformGroup, radius) {
        // Weather monitoring equipment
        const stationGeometry = new THREE.CylinderGeometry(1, 1.5, 2);
        const stationMaterial = new THREE.MeshLambertMaterial({ color: 0x4a6a4a });
        const station = new THREE.Mesh(stationGeometry, stationMaterial);
        station.position.set(0, 1.25, 0);
        platformGroup.add(station);
        
        // Weather instruments
        const instruments = [
            { pos: { x: 0, y: 2.5, z: 0 }, geom: new THREE.SphereGeometry(0.3) },
            { pos: { x: 1, y: 2, z: 0 }, geom: new THREE.CylinderGeometry(0.1, 0.1, 1) },
            { pos: { x: -1, y: 2, z: 0 }, geom: new THREE.BoxGeometry(0.2, 0.2, 0.8) }
        ];
        
        instruments.forEach(inst => {
            const instMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a8a });
            const instrument = new THREE.Mesh(inst.geom, instMaterial);
            instrument.position.set(inst.pos.x, inst.pos.y, inst.pos.z);
            platformGroup.add(instrument);
        });
    }

    createTransmissionAmplifiers(platformGroup, radius) {
        // Large amplification equipment
        const ampGeometry = new THREE.BoxGeometry(3, 4, 2);
        const ampMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a6a,
            emissive: 0x111122
        });
        const amplifier = new THREE.Mesh(ampGeometry, ampMaterial);
        amplifier.position.set(0, 2.25, 0);
        platformGroup.add(amplifier);
        
        // Cooling vents
        for (let i = 0; i < 12; i++) {
            const ventGeometry = new THREE.PlaneGeometry(0.1, 0.3);
            const ventMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(
                1.51,
                1.5 + (i % 4) * 0.4,
                -0.9 + Math.floor(i / 4) * 0.9
            );
            platformGroup.add(vent);
        }
    }

    createMainTransmitter(platformGroup, radius) {
        const transmitterGroup = new THREE.Group();
        
        // Main transmitter unit
        const transmitterGeometry = new THREE.CylinderGeometry(2, 3, 5);
        const transmitterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5a5a8a,
            emissive: 0x222244
        });
        const transmitter = new THREE.Mesh(transmitterGeometry, transmitterMaterial);
        transmitter.position.y = 2.75;
        transmitterGroup.add(transmitter);
        
        // Transmission dish
        const dishGeometry = new THREE.ConeGeometry(4, 1, 16);
        const dishMaterial = new THREE.MeshLambertMaterial({ color: 0x8a8a8a });
        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
        dish.position.y = 6;
        dish.rotation.x = Math.PI;
        transmitterGroup.add(dish);
        
        // Status lights
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const lightGeometry = new THREE.SphereGeometry(0.1);
            const lightMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                emissive: 0x440000
            });
            const statusLight = new THREE.Mesh(lightGeometry, lightMaterial);
            statusLight.position.set(
                Math.cos(angle) * 2.2,
                4,
                Math.sin(angle) * 2.2
            );
            transmitterGroup.add(statusLight);
        }
        
        transmitterGroup.userData.isMainTransmitter = true;
        transmitterGroup.userData.active = false;
        this.mainTransmitter = transmitterGroup;
        platformGroup.add(transmitterGroup);
    }

    createStairwells() {
        // Two spiral stairways on opposite sides
        const stairwellPositions = [
            { angle: 0 },
            { angle: Math.PI }
        ];
        
        stairwellPositions.forEach(pos => {
            const stairwell = this.createSpiralStairway(pos.angle);
            this.stairwells.push(stairwell);
            this.scene.add(stairwell);
        });
    }

    createSpiralStairway(startAngle) {
        const stairwellGroup = new THREE.Group();
        const steps = Math.floor(this.towerHeight / 2); // One step every 2 units
        
        for (let i = 0; i < steps; i++) {
            const height = i * 2;
            const angle = startAngle + (i * 0.15); // Spiral angle
            const radius = 13 - (height / this.towerHeight) * 6; // Adjust radius with height
            
            // Step platform
            const stepGeometry = new THREE.BoxGeometry(2, 0.2, 1);
            const stepMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            step.rotation.y = angle + Math.PI/2;
            stairwellGroup.add(step);
            
            // Handrail
            if (i % 5 === 0) { // Every 5 steps
                const railGeometry = new THREE.BoxGeometry(2, 1, 0.1);
                const railMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
                const rail = new THREE.Mesh(railGeometry, railMaterial);
                rail.position.set(
                    Math.cos(angle) * radius,
                    height + 0.6,
                    Math.sin(angle) * radius
                );
                rail.rotation.y = angle + Math.PI/2;
                stairwellGroup.add(rail);
            }
        }
        
        return stairwellGroup;
    }

    createElevatorShafts() {
        // Single central elevator shaft
        const elevatorGroup = new THREE.Group();
        
        // Shaft structure
        const shaftGeometry = new THREE.BoxGeometry(4, this.towerHeight, 4);
        const shaftMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.3
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.set(0, this.towerHeight/2, 0);
        elevatorGroup.add(shaft);
        
        // Elevator car (starts at bottom)
        const carGeometry = new THREE.BoxGeometry(3.5, 3, 3.5);
        const carMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const car = new THREE.Mesh(carGeometry, carMaterial);
        car.position.set(0, 2, 0);
        elevatorGroup.add(car);
        
        // Guide rails
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const railGeometry = new THREE.BoxGeometry(0.1, this.towerHeight, 0.1);
            const railMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            const rail = new THREE.Mesh(railGeometry, railMaterial);
            rail.position.set(
                Math.cos(angle) * 1.8,
                this.towerHeight/2,
                Math.sin(angle) * 1.8
            );
            elevatorGroup.add(rail);
        }
        
        elevatorGroup.userData.car = car;
        elevatorGroup.userData.targetHeight = 2;
        elevatorGroup.userData.moving = false;
        
        this.elevatorShafts.push(elevatorGroup);
        this.scene.add(elevatorGroup);
    }

    createAntennaArray() {
        const antennaHeights = [this.towerHeight + 10, this.towerHeight + 20, this.towerHeight + 35];
        
        antennaHeights.forEach((height, index) => {
            const antenna = this.createAntenna(height, index);
            this.antennaArray.push(antenna);
            this.scene.add(antenna);
        });
    }

    createAntenna(height, index) {
        const antennaGroup = new THREE.Group();
        
        // Main antenna mast
        const mastHeight = 15 + index * 10;
        const mastGeometry = new THREE.CylinderGeometry(0.2, 0.3, mastHeight);
        const mastMaterial = new THREE.MeshLambertMaterial({ color: 0x8a8a8a });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(0, mastHeight/2, 0);
        antennaGroup.add(mast);
        
        // Antenna elements
        const elementCount = 5 + index * 3;
        for (let i = 0; i < elementCount; i++) {
            const elementHeight = (mastHeight / elementCount) * i;
            const elementLength = 3 - (i / elementCount) * 2;
            
            const elementGeometry = new THREE.BoxGeometry(elementLength, 0.1, 0.1);
            const elementMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            const element = new THREE.Mesh(elementGeometry, elementMaterial);
            element.position.set(0, elementHeight, 0);
            antennaGroup.add(element);
        }
        
        // Support cables
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const cableGeometry = new THREE.BoxGeometry(0.02, mastHeight * 0.8, 0.02);
            const cableMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            const cable = new THREE.Mesh(cableGeometry, cableMaterial);
            cable.position.set(
                Math.cos(angle) * 5,
                mastHeight * 0.4,
                Math.sin(angle) * 5
            );
            cable.rotation.z = angle + Math.PI/6;
            antennaGroup.add(cable);
            
            // Cable anchor point
            const anchorGeometry = new THREE.SphereGeometry(0.2);
            const anchorMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
            anchor.position.set(
                Math.cos(angle) * 8,
                0,
                Math.sin(angle) * 8
            );
            antennaGroup.add(anchor);
        }
        
        // Warning lights
        const warningLight = new THREE.PointLight(0xff0000, 1, 20);
        warningLight.position.set(0, mastHeight, 0);
        antennaGroup.add(warningLight);
        
        // Blinking animation
        this.animateNavLight(warningLight, height);
        
        antennaGroup.position.set(0, height, 0);
        antennaGroup.userData.height = height;
        antennaGroup.userData.index = index;
        antennaGroup.userData.damaged = false;
        
        return antennaGroup;
    }

    createCommunicationNodes() {
        // Place communication nodes on specific platforms
        const nodeLocations = [1, 2, 4, 5, 6, 7]; // Platform indices
        
        nodeLocations.forEach((platformIndex, nodeIndex) => {
            const platform = this.platforms[platformIndex];
            if (platform) {
                const node = this.createCommNode(nodeIndex);
                const angle = (nodeIndex / nodeLocations.length) * Math.PI * 2;
                const radius = platform.userData.radius - 2;
                
                node.position.set(
                    Math.cos(angle) * radius,
                    platform.userData.height + 2,
                    Math.sin(angle) * radius
                );
                
                this.communicationNodes.push(node);
                this.scene.add(node);
            }
        });
    }

    createCommNode(nodeIndex) {
        const nodeGroup = new THREE.Group();
        
        // Node housing
        const housingGeometry = new THREE.BoxGeometry(1.5, 2, 1);
        const housingMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a8a });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.y = 1;
        nodeGroup.add(housing);
        
        // Status indicator
        const indicatorGeometry = new THREE.SphereGeometry(0.2);
        const indicatorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0x440000
        });
        const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        indicator.position.set(0, 2.2, 0.6);
        nodeGroup.add(indicator);
        
        // Activation panel
        const panelGeometry = new THREE.PlaneGeometry(0.8, 1);
        const panelMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x222222,
            emissive: 0x111111
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 1, 0.51);
        nodeGroup.add(panel);
        
        nodeGroup.userData.nodeIndex = nodeIndex;
        nodeGroup.userData.activated = false;
        nodeGroup.userData.indicator = indicator;
        nodeGroup.userData.panel = panel;
        nodeGroup.userData.isCommNode = true;
        
        return nodeGroup;
    }

    createTransmissionEquipment() {
        // Transmission equipment spread across platforms
        this.platforms.forEach((platform, index) => {
            if (index > 0 && index < this.platforms.length - 1) {
                this.addTransmissionEquipment(platform);
            }
        });
    }

    addTransmissionEquipment(platform) {
        const equipmentTypes = [
            { geom: new THREE.BoxGeometry(1, 1.5, 0.8), color: 0x4a4a6a },
            { geom: new THREE.CylinderGeometry(0.4, 0.4, 2), color: 0x6a4a4a },
            { geom: new THREE.SphereGeometry(0.6), color: 0x4a6a4a }
        ];
        
        for (let i = 0; i < 3; i++) {
            const equipType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
            const equipMaterial = new THREE.MeshLambertMaterial({ color: equipType.color });
            const equipment = new THREE.Mesh(equipType.geom, equipMaterial);
            
            const angle = (i / 3) * Math.PI * 2;
            const radius = platform.userData.radius - 3;
            equipment.position.set(
                Math.cos(angle) * radius,
                platform.userData.height + 1,
                Math.sin(angle) * radius
            );
            
            this.transmissionEquipment.push(equipment);
            this.scene.add(equipment);
        }
    }

    createEnvironmentalEffects() {
        this.createWindEffect();
        this.createLightningStorms();
        this.createClouds();
    }

    createWindEffect() {
        // Wind particle system
        const windParticleCount = 200;
        const windGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(windParticleCount * 3);
        const velocities = new Float32Array(windParticleCount * 3);
        
        for (let i = 0; i < windParticleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * this.towerHeight;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            
            velocities[i * 3] = Math.random() * 0.2;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = Math.random() * 0.2;
        }
        
        windGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        windGeometry.userData.velocities = velocities;
        
        const windMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.5,
            transparent: true,
            opacity: 0.3
        });
        
        this.windEffect = new THREE.Points(windGeometry, windMaterial);
        this.scene.add(this.windEffect);
    }

    createLightningStorms() {
        // Create lightning storm effects
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createLightning();
            }, Math.random() * 10000);
        }
    }

    createLightning() {
        const lightningGeometry = new THREE.BufferGeometry();
        const points = [];
        
        // Create jagged lightning path
        let currentPos = new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            this.towerHeight + 50,
            (Math.random() - 0.5) * 100
        );
        
        for (let i = 0; i < 20; i++) {
            points.push(currentPos.clone());
            currentPos.add(new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                -5,
                (Math.random() - 0.5) * 10
            ));
        }
        
        lightningGeometry.setFromPoints(points);
        
        const lightningMaterial = new THREE.LineBasicMaterial({
            color: 0xaaaaff,
            linewidth: 3
        });
        
        const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
        this.scene.add(lightning);
        
        // Lightning flash
        const flash = new THREE.PointLight(0xaaaaff, 3, 200);
        flash.position.copy(points[0]);
        this.scene.add(flash);
        
        // Remove lightning after short time
        setTimeout(() => {
            this.scene.remove(lightning);
            this.scene.remove(flash);
        }, 200);
        
        // Schedule next lightning
        setTimeout(() => {
            this.createLightning();
        }, 5000 + Math.random() * 10000);
    }

    createClouds() {
        // Create cloud layer below tower top
        const cloudHeight = this.towerHeight * 0.7;
        
        for (let i = 0; i < 10; i++) {
            const cloudGeometry = new THREE.SphereGeometry(15 + Math.random() * 10, 8, 6);
            const cloudMaterial = new THREE.MeshLambertMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.3
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            
            cloud.position.set(
                (Math.random() - 0.5) * 200,
                cloudHeight + Math.random() * 20,
                (Math.random() - 0.5) * 200
            );
            
            cloud.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                0,
                (Math.random() - 0.5) * 0.01
            );
            
            this.scene.add(cloud);
        }
    }

    setupObjectives() {
        this.objectives = [
            {
                id: 'activate_nodes',
                description: `Activate communication nodes (${this.nodesActivated}/${this.totalNodes})`,
                completed: false,
                type: 'collect'
            },
            {
                id: 'repair_antennas',
                description: 'Repair damaged antenna array',
                completed: false,
                type: 'repair'
            },
            {
                id: 'restore_power',
                description: 'Restore main transmitter power',
                completed: false,
                type: 'power'
            },
            {
                id: 'establish_contact',
                description: 'Establish contact with outside forces',
                completed: false,
                type: 'communication'
            }
        ];
    }

    createEnvironmentalDetails() {
        // Add cables and wiring throughout the tower
        this.createCabling();
        this.createDebris();
        this.createSigns();
    }

    createCabling() {
        // Cable runs between platforms
        for (let i = 0; i < this.platforms.length - 1; i++) {
            const platform1 = this.platforms[i];
            const platform2 = this.platforms[i + 1];
            
            const cableGeometry = new THREE.CylinderGeometry(0.05, 0.05, 
                platform2.userData.height - platform1.userData.height);
            const cableMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            const cable = new THREE.Mesh(cableGeometry, cableMaterial);
            
            cable.position.set(
                5, // Offset from center
                (platform1.userData.height + platform2.userData.height) / 2,
                0
            );
            
            this.scene.add(cable);
        }
    }

    createDebris() {
        // Scattered debris on platforms
        this.platforms.forEach(platform => {
            for (let i = 0; i < 3; i++) {
                const debrisGeometry = new THREE.BoxGeometry(
                    Math.random() * 0.5,
                    Math.random() * 0.3,
                    Math.random() * 0.5
                );
                const debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
                const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
                
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * (platform.userData.radius - 1);
                debris.position.set(
                    Math.cos(angle) * radius,
                    platform.userData.height + 0.3,
                    Math.sin(angle) * radius
                );
                
                debris.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                this.scene.add(debris);
            }
        });
    }

    createSigns() {
        // Warning and information signs
        const signTexts = [
            "DANGER - HIGH VOLTAGE",
            "AUTHORIZED PERSONNEL ONLY",
            "COMMUNICATION ARRAY",
            "EMERGENCY EXIT",
            "CAUTION - STRONG WINDS"
        ];
        
        this.platforms.forEach((platform, index) => {
            if (index % 2 === 0) {
                const signGeometry = new THREE.PlaneGeometry(3, 1);
                const signMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffff00,
                    transparent: true,
                    opacity: 0.8
                });
                const sign = new THREE.Mesh(signGeometry, signMaterial);
                
                sign.position.set(
                    platform.userData.radius - 0.5,
                    platform.userData.height + 2,
                    0
                );
                
                this.scene.add(sign);
            }
        });
    }

    activateCommNode(nodeIndex) {
        const node = this.communicationNodes[nodeIndex];
        if (node && !node.userData.activated) {
            node.userData.activated = true;
            this.nodesActivated++;
            
            // Visual feedback
            const indicator = node.userData.indicator;
            if (indicator) {
                indicator.material.color.setHex(0x00ff00);
                indicator.material.emissive.setHex(0x004400);
            }
            
            const panel = node.userData.panel;
            if (panel) {
                panel.material.color.setHex(0x004400);
                panel.material.emissive.setHex(0x002200);
            }
            
            // Update signal strength
            this.signalStrength += (this.maxSignalStrength / this.totalNodes);
            
            // Update objective
            this.objectives[0].description = `Activate communication nodes (${this.nodesActivated}/${this.totalNodes})`;
            if (this.nodesActivated >= this.totalNodes) {
                this.objectives[0].completed = true;
                this.checkMainTransmitter();
            }
        }
    }

    repairAntenna(antennaIndex) {
        const antenna = this.antennaArray[antennaIndex];
        if (antenna && antenna.userData.damaged) {
            antenna.userData.damaged = false;
            
            // Visual repair effect
            antenna.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0x8a8a8a);
                    child.material.emissive.setHex(0x000000);
                }
            });
            
            // Check if all antennas repaired
            const allRepaired = this.antennaArray.every(ant => !ant.userData.damaged);
            if (allRepaired) {
                this.objectives[1].completed = true;
                this.checkMainTransmitter();
            }
        }
    }

    restorePower() {
        this.objectives[2].completed = true;
        this.emergencyLighting = false;
        
        // Activate emergency lights
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.isEmergencyLight) {
                child.intensity = 0.8;
            }
        });
        
        this.checkMainTransmitter();
    }

    checkMainTransmitter() {
        if (this.objectives[0].completed && 
            this.objectives[1].completed && 
            this.objectives[2].completed) {
            
            this.activateMainTransmitter();
        }
    }

    activateMainTransmitter() {
        if (this.mainTransmitter) {
            this.mainTransmitter.userData.active = true;
            this.interferenceActive = false;
            
            // Visual activation
            this.mainTransmitter.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    child.material.emissive.setHex(0x004400);
                }
            });
            
            // Complete final objective
            this.objectives[3].completed = true;
            
            // Transmission effect
            this.createTransmissionEffect();
        }
    }

    createTransmissionEffect() {
        // Expanding transmission wave
        const waveGeometry = new THREE.RingGeometry(0, 1, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.set(0, this.towerHeight + 40, 0);
        wave.rotation.x = -Math.PI / 2;
        this.scene.add(wave);
        
        // Animate wave expansion
        let scale = 1;
        let opacity = 0.8;
        const waveInterval = setInterval(() => {
            scale += 5;
            opacity -= 0.05;
            wave.scale.setScalar(scale);
            wave.material.opacity = opacity;
            
            if (opacity <= 0) {
                this.scene.remove(wave);
                this.clearInterval(waveInterval);
            }
        }, 50);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Animate wind particles
        if (this.windEffect) {
            const positions = this.windEffect.geometry.attributes.position.array;
            const velocities = this.windEffect.geometry.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i] * deltaTime;
                positions[i + 1] += velocities[i + 1] * deltaTime;
                positions[i + 2] += velocities[i + 2] * deltaTime;
                
                // Reset particles that go too far
                if (Math.abs(positions[i]) > 50) {
                    positions[i] = (Math.random() - 0.5) * 100;
                    positions[i + 1] = Math.random() * this.towerHeight;
                    positions[i + 2] = (Math.random() - 0.5) * 100;
                }
            }
            
            this.windEffect.geometry.attributes.position.needsUpdate = true;
        }
        
        // Animate clouds
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.velocity) {
                child.position.add(child.userData.velocity.clone().multiplyScalar(deltaTime));
            }
        });
        
        // Move elevator if needed
        this.elevatorShafts.forEach(elevator => {
            if (elevator.userData.moving) {
                const car = elevator.userData.car;
                const target = elevator.userData.targetHeight;
                const speed = 0.02 * deltaTime;
                
                if (Math.abs(car.position.y - target) > 0.5) {
                    car.position.y += (target > car.position.y ? speed : -speed);
                } else {
                    elevator.userData.moving = false;
                }
            }
        });
        
        // Check player interaction with communication nodes
        if (this.game.player) {
            this.communicationNodes.forEach((node, index) => {
                if (!node.userData.activated) {
                    const distance = this.game.player.position.distanceTo(node.position);
                    if (distance < 2) {
                        // Auto-activate node when close
                        this.activateNode(node);
                    }
                }
            });
            
            // Check for antennas to repair
            if (!this.objectives[1].completed) {
                this.antennaArray.forEach(antenna => {
                    if (antenna.userData.damaged && !antenna.userData.repaired) {
                        const distance = this.game.player.position.distanceTo(antenna.position);
                        if (distance < 3) {
                            this.repairAntenna(antenna);
                        }
                    }
                });
            }
            
            // Check for power restoration
            if (!this.objectives[2].completed && this.game.player.position.y > this.towerHeight - 10) {
                this.restorePower();
            }
        }
        
        // Check for level completion
        if (this.isComplete() && !this.exitPortalCreated) {
            this.createExitPortal();
        }
        
        // Check exit portal interaction
        if (this.exitPortal && this.game.player) {
            const distance = this.game.player.position.distanceTo(this.exitPortal.position);
            if (distance < 4) {
                this.completeLevel();
            }
        }
    }
    
    createExitPortal() {
        this.exitPortalCreated = true;
        
        // Create portal at the top of the tower
        const portalGroup = new THREE.Group();
        
        // Portal ring
        const ringGeometry = new THREE.TorusGeometry(3, 0.5, 16, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        portalGroup.add(ring);
        
        // Portal surface
        const portalGeometry = new THREE.CircleGeometry(3, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portalGroup.add(portal);
        
        // Position at tower top
        portalGroup.position.set(0, this.towerHeight + 2, 0);
        this.scene.add(portalGroup);
        
        // Add portal light
        const portalLight = new THREE.PointLight(0x00ff00, 3, 15);
        portalLight.position.copy(portalGroup.position);
        this.scene.add(portalLight);
        
        // Store for interaction
        this.exitPortal = portalGroup;
        
        // Animate portal
        this.addInterval(setInterval(() => {
            if (ring) {
                ring.rotation.z += 0.02;
                portal.rotation.z -= 0.01;
                // Pulse effect
                const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
                portalGroup.scale.set(scale, scale, scale);
            }
        }, 16));
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("Communications restored! Exit portal activated!");
        }
    }
    
    completeLevel() {
        if (this.completed) return;
        
        this.completed = true;
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("Communications Level Complete!");
        }
        
        // Load next level after delay
        setTimeout(() => {
            if (this.game.loadNextLevel) {
                this.game.loadNextLevel();
            }
        }, 2000);
    }
    
    repairAntenna(antenna) {
        antenna.userData.repaired = true;
        
        // Change antenna appearance
        antenna.material.emissive = new THREE.Color(0x00ff00);
        antenna.material.emissiveIntensity = 0.3;
        
        // Check if all antennas repaired
        const allRepaired = this.antennaArray.every(a => 
            !a.userData.damaged || a.userData.repaired
        );
        
        if (allRepaired) {
            this.objectives[1].completed = true;
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.displaySubtitle("All antennas repaired!");
            }
        }
    }
    
    restorePower() {
        this.objectives[2].completed = true;
        
        // Light up the tower
        const towerLight = new THREE.PointLight(0xffffff, 2, 100);
        towerLight.position.set(0, this.towerHeight, 0);
        this.scene.add(towerLight);
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("Main transmitter power restored!");
        }
        
        // Check if ready to contact outside
        if (this.objectives[0].completed && this.objectives[1].completed && this.objectives[2].completed) {
            setTimeout(() => {
                this.establishContact();
            }, 2000);
        }
    }

    getSpawnPosition() {
        return new THREE.Vector3(0, 2, 15);
    }

    isComplete() {
        return this.objectives.every(obj => obj.completed);
    }

    cleanup() {
        super.cleanup();
        
        this.platforms = [];
        this.antennaArray = [];
        this.communicationNodes = [];
        this.elevatorShafts = [];
        this.stairwells = [];
        this.transmissionEquipment = [];
        this.lightningStorms = [];
        
        if (this.windEffect) {
            this.scene.remove(this.windEffect);
        }
    }
}
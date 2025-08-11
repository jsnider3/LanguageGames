import { BaseLevel } from './baseLevel.js';
import { BrimstoneGolem } from '../enemies/brimstoneGolem.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';
import * as THREE from 'three';

export class ReactorLevel extends BaseLevel {
    constructor(game) {
        super(game);
        this.name = "Reactor Core";
        this.description = "Navigate the unstable reactor core before it reaches critical meltdown";
        this.backgroundColor = new THREE.Color(0x2a1a00);
        
        this.reactorCore = null;
        this.coolingTowers = [];
        this.controlRods = [];
        this.radiationZones = [];
        this.coolingPipes = [];
        this.emergencyShutoffs = [];
        
        this.meltdownTimer = 300000; // 5 minutes
        this.currentTimer = this.meltdownTimer;
        this.reactorStable = false;
        this.radiationLevel = 100; // Maximum radiation
        this.coolingSystemActive = false;
        this.controlRodsInserted = 0;
        this.totalControlRods = 6;
        
        this.radiationDamageRate = 10; // Damage per second in radiation
        this.radiationProtection = 0; // Player protection level
        this.temperatureLevel = 100; // Reactor temperature
        this.pressureLevel = 100; // Reactor pressure
        
        this.warningLights = [];
        this.alarmSounds = [];
        this.steamVents = [];
        this.emergencyProtocol = false;
        
        this.init();
    }

    init() {
        this.createGeometry();
        this.createLighting();
        this.createReactorCore();
        this.createCoolingSystem();
        this.createControlRods();
        this.createRadiationZones();
        this.createEmergencyShutoffs();
        this.createEnvironmentalEffects();
        this.setupObjectives();
        this.startMeltdownTimer();
        this.createEnvironmentalDetails();
    }

    createGeometry() {
        // Main reactor chamber - large cylindrical room
        const chamberRadius = 40;
        const chamberHeight = 30;
        
        // Floor
        const floorGeometry = new THREE.CylinderGeometry(chamberRadius, chamberRadius, 2);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a2a,
            emissive: 0x221100
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -1;
        this.scene.add(floor);
        
        // Walls with heat-resistant paneling
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const x = Math.cos(angle) * (chamberRadius + 2);
            const z = Math.sin(angle) * (chamberRadius + 2);
            
            const wallGeometry = new THREE.BoxGeometry(6, chamberHeight, 2);
            const wallMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x5a3a2a,
                emissive: 0x221100
            });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(x, chamberHeight/2, z);
            wall.lookAt(new THREE.Vector3(0, chamberHeight/2, 0));
            this.scene.add(wall);
            
            // Heat-resistant panels
            const panelGeometry = new THREE.BoxGeometry(5.5, chamberHeight - 2, 0.2);
            const panelMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8a6a4a,
                emissive: 0x331100
            });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(
                Math.cos(angle) * (chamberRadius + 1.5),
                chamberHeight/2,
                Math.sin(angle) * (chamberRadius + 1.5)
            );
            panel.lookAt(new THREE.Vector3(0, chamberHeight/2, 0));
            this.scene.add(panel);
        }
        
        // Ceiling with ventilation
        const ceilingGeometry = new THREE.CylinderGeometry(chamberRadius, chamberRadius, 2);
        const ceilingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a3a2a,
            emissive: 0x111100
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = chamberHeight + 1;
        this.scene.add(ceiling);
        
        // Create elevated platforms for equipment access
        this.createElevatedPlatforms(chamberRadius, chamberHeight);
    }

    createElevatedPlatforms(chamberRadius, chamberHeight) {
        const platformHeights = [8, 16, 24];
        const platformRadius = chamberRadius - 8;
        
        platformHeights.forEach((height, index) => {
            // Platform ring
            const ringGeometry = new THREE.TorusGeometry(platformRadius, 2, 8, 16);
            const ringMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x6a5a4a,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = height;
            ring.rotation.x = -Math.PI / 2;
            this.scene.add(ring);
            
            // Platform supports
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const supportGeometry = new THREE.CylinderGeometry(0.5, 0.5, height);
                const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
                const support = new THREE.Mesh(supportGeometry, supportMaterial);
                support.position.set(
                    Math.cos(angle) * platformRadius,
                    height / 2,
                    Math.sin(angle) * platformRadius
                );
                this.scene.add(support);
            }
            
            // Access ladders
            if (index > 0) {
                const ladderGeometry = new THREE.BoxGeometry(0.5, height - platformHeights[index - 1], 0.1);
                const ladderMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
                const ladder = new THREE.Mesh(ladderGeometry, ladderMaterial);
                ladder.position.set(
                    platformRadius,
                    (height + platformHeights[index - 1]) / 2,
                    0
                );
                this.scene.add(ladder);
            }
        });
    }

    createLighting() {
        // Emergency lighting - red ambient
        const ambientLight = new THREE.AmbientLight(0x4a1100, 0.5);
        this.scene.add(ambientLight);

        // Reactor core glow (will be created with reactor)
        
        // Warning lights throughout the facility
        const warningPositions = [
            { x: 25, y: 5, z: 0 }, { x: -25, y: 5, z: 0 },
            { x: 0, y: 5, z: 25 }, { x: 0, y: 5, z: -25 },
            { x: 18, y: 15, z: 18 }, { x: -18, y: 15, z: -18 },
            { x: 18, y: 15, z: -18 }, { x: -18, y: 15, z: 18 }
        ];
        
        warningPositions.forEach(pos => {
            const warningLight = new THREE.PointLight(0xff4400, 1, 20);
            warningLight.position.set(pos.x, pos.y, pos.z);
            this.scene.add(warningLight);
            this.warningLights.push(warningLight);
            
            // Blinking animation
            this.animateWarningLight(warningLight);
        });
    }

    animateWarningLight(light) {
        const originalIntensity = light.intensity;
        const blinkSpeed = 800 + Math.random() * 400;
        
        setInterval(() => {
            light.intensity = light.intensity > 0 ? 0 : originalIntensity;
        }, blinkSpeed);
    }

    createReactorCore() {
        const coreGroup = new THREE.Group();
        
        // Main reactor vessel
        const vesselGeometry = new THREE.CylinderGeometry(8, 10, 20, 16);
        const vesselMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x6a4a2a,
            emissive: 0x331100
        });
        const vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
        vessel.position.y = 10;
        coreGroup.add(vessel);
        
        // Reactor core (inner glowing sphere)
        const coreGeometry = new THREE.SphereGeometry(6, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6600,
            emissive: 0xff3300,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.y = 10;
        coreGroup.add(core);
        
        // Reactor core light
        const coreLight = new THREE.PointLight(0xff4400, 3, 50);
        coreLight.position.set(0, 10, 0);
        coreGroup.add(coreLight);
        
        // Control rod guides
        for (let i = 0; i < this.totalControlRods; i++) {
            const angle = (i / this.totalControlRods) * Math.PI * 2;
            const guideGeometry = new THREE.CylinderGeometry(0.3, 0.3, 25);
            const guideMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            const guide = new THREE.Mesh(guideGeometry, guideMaterial);
            guide.position.set(
                Math.cos(angle) * 5,
                12.5,
                Math.sin(angle) * 5
            );
            coreGroup.add(guide);
        }
        
        // Coolant pipes around reactor
        this.createCoolantPipes(coreGroup);
        
        // Radiation shielding
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const shieldGeometry = new THREE.BoxGeometry(4, 18, 2);
            const shieldMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a4a4a,
                emissive: 0x111111
            });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.position.set(
                Math.cos(angle) * 12,
                9,
                Math.sin(angle) * 12
            );
            shield.lookAt(new THREE.Vector3(0, 9, 0));
            coreGroup.add(shield);
        }
        
        coreGroup.userData.core = core;
        coreGroup.userData.vessel = vessel;
        coreGroup.userData.coreLight = coreLight;
        coreGroup.userData.temperature = 100;
        coreGroup.userData.pressure = 100;
        
        this.reactorCore = coreGroup;
        this.scene.add(coreGroup);
    }

    createCoolantPipes(coreGroup) {
        const pipePositions = [
            { start: { x: 15, y: 5, z: 0 }, end: { x: 10, y: 8, z: 0 } },
            { start: { x: -15, y: 5, z: 0 }, end: { x: -10, y: 8, z: 0 } },
            { start: { x: 0, y: 5, z: 15 }, end: { x: 0, y: 8, z: 10 } },
            { start: { x: 0, y: 5, z: -15 }, end: { x: 0, y: 8, z: -10 } }
        ];
        
        pipePositions.forEach(pipe => {
            const direction = new THREE.Vector3().subVectors(
                new THREE.Vector3(pipe.end.x, pipe.end.y, pipe.end.z),
                new THREE.Vector3(pipe.start.x, pipe.start.y, pipe.start.z)
            );
            const distance = direction.length();
            
            const pipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, distance);
            const pipeMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4a6a8a,
                emissive: 0x112244
            });
            const pipeSegment = new THREE.Mesh(pipeGeometry, pipeMaterial);
            
            pipeSegment.position.set(
                (pipe.start.x + pipe.end.x) / 2,
                (pipe.start.y + pipe.end.y) / 2,
                (pipe.start.z + pipe.end.z) / 2
            );
            
            pipeSegment.lookAt(new THREE.Vector3(pipe.end.x, pipe.end.y, pipe.end.z));
            pipeSegment.rotateX(Math.PI / 2);
            
            this.coolingPipes.push(pipeSegment);
            coreGroup.add(pipeSegment);
        });
    }

    createCoolingSystem() {
        // Four cooling towers around the perimeter
        const towerPositions = [
            { x: 30, z: 0 }, { x: -30, z: 0 },
            { x: 0, z: 30 }, { x: 0, z: -30 }
        ];
        
        towerPositions.forEach((pos, index) => {
            const tower = this.createCoolingTower(pos.x, pos.z, index);
            this.coolingTowers.push(tower);
            this.scene.add(tower);
        });
    }

    createCoolingTower(x, z, index) {
        const towerGroup = new THREE.Group();
        
        // Tower structure
        const towerGeometry = new THREE.CylinderGeometry(3, 4, 15, 8);
        const towerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x5a5a5a,
            emissive: 0x111111
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 7.5;
        towerGroup.add(tower);
        
        // Cooling fan
        const fanGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 6);
        const fanMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        const fan = new THREE.Mesh(fanGeometry, fanMaterial);
        fan.position.y = 15.5;
        towerGroup.add(fan);
        
        // Fan blades
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const bladeGeometry = new THREE.BoxGeometry(0.2, 1.8, 0.1);
            const bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x8a8a8a });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(
                Math.cos(angle) * 1.5,
                15.5,
                Math.sin(angle) * 1.5
            );
            blade.rotation.y = angle + Math.PI/2;
            towerGroup.add(blade);
        }
        
        // Control panel
        const panelGeometry = new THREE.BoxGeometry(2, 3, 0.5);
        const panelMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 2, 4.5);
        towerGroup.add(panel);
        
        // Status lights
        const statusLight = new THREE.PointLight(0xff0000, 0.8, 10);
        statusLight.position.set(0, 3, 5);
        towerGroup.add(statusLight);
        
        towerGroup.position.set(x, 0, z);
        towerGroup.userData.index = index;
        towerGroup.userData.active = false;
        towerGroup.userData.fan = fan;
        towerGroup.userData.blades = towerGroup.children.filter(child => 
            child.geometry instanceof THREE.BoxGeometry && 
            child.material.color.getHex() === 0x8a8a8a
        );
        towerGroup.userData.statusLight = statusLight;
        towerGroup.userData.isCoolingTower = true;
        
        return towerGroup;
    }

    createControlRods() {
        for (let i = 0; i < this.totalControlRods; i++) {
            const controlRod = this.createControlRod(i);
            this.controlRods.push(controlRod);
            this.scene.add(controlRod);
        }
    }

    createControlRod(index) {
        const rodGroup = new THREE.Group();
        const angle = (index / this.totalControlRods) * Math.PI * 2;
        
        // Control rod mechanism
        const mechanismGeometry = new THREE.BoxGeometry(2, 4, 2);
        const mechanismMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const mechanism = new THREE.Mesh(mechanismGeometry, mechanismMaterial);
        mechanism.position.set(0, 27, 0);
        rodGroup.add(mechanism);
        
        // Control rod (starts in raised position)
        const rodGeometry = new THREE.CylinderGeometry(0.25, 0.25, 20);
        const rodMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2a2a8a,
            emissive: 0x111144
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.position.set(0, 15, 0); // Raised position
        rodGroup.add(rod);
        
        // Control console
        const consoleGeometry = new THREE.BoxGeometry(1.5, 2, 1);
        const consoleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const console = new THREE.Mesh(consoleGeometry, consoleMaterial);
        console.position.set(2.5, 1.5, 0);
        rodGroup.add(console);
        
        // Status display
        const displayGeometry = new THREE.PlaneGeometry(1, 0.8);
        const displayMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0x440000
        });
        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(2.51, 1.8, 0);
        rodGroup.add(display);
        
        rodGroup.position.set(
            Math.cos(angle) * 5,
            0,
            Math.sin(angle) * 5
        );
        
        rodGroup.userData.index = index;
        rodGroup.userData.inserted = false;
        rodGroup.userData.rod = rod;
        rodGroup.userData.display = display;
        rodGroup.userData.console = console;
        rodGroup.userData.isControlRod = true;
        
        return rodGroup;
    }

    createRadiationZones() {
        // High radiation zones around the reactor
        const zonePositions = [
            { x: 0, y: 5, z: 0, radius: 15 }, // Around reactor core
            { x: 20, y: 2, z: 20, radius: 8 },
            { x: -20, y: 2, z: -20, radius: 8 },
            { x: 20, y: 2, z: -20, radius: 6 },
            { x: -20, y: 2, z: 20, radius: 6 }
        ];
        
        zonePositions.forEach((zone, index) => {
            const radiationZone = this.createRadiationZone(
                zone.x, zone.y, zone.z, zone.radius, index
            );
            this.radiationZones.push(radiationZone);
            this.scene.add(radiationZone);
        });
    }

    createRadiationZone(x, y, z, radius, index) {
        const zoneGroup = new THREE.Group();
        
        // Radiation field visualization
        const fieldGeometry = new THREE.CylinderGeometry(radius, radius, 8, 16);
        const fieldMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x88ff00,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.y = 4;
        zoneGroup.add(field);
        
        // Radiation particles
        this.createRadiationParticles(zoneGroup, radius);
        
        // Warning signs
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const signGeometry = new THREE.PlaneGeometry(2, 2);
            const signMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(
                Math.cos(angle) * (radius + 2),
                3,
                Math.sin(angle) * (radius + 2)
            );
            sign.lookAt(new THREE.Vector3(x, 3, z));
            zoneGroup.add(sign);
        }
        
        zoneGroup.position.set(x, y, z);
        zoneGroup.userData.index = index;
        zoneGroup.userData.radius = radius;
        zoneGroup.userData.radiationLevel = 100 - index * 15; // Decreasing levels
        zoneGroup.userData.field = field;
        
        return zoneGroup;
    }

    createRadiationParticles(zoneGroup, radius) {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            
            positions[i * 3] = Math.cos(angle) * distance;
            positions[i * 3 + 1] = Math.random() * 8;
            positions[i * 3 + 2] = Math.sin(angle) * distance;
            
            colors[i * 3] = 0.5 + Math.random() * 0.5;
            colors[i * 3 + 1] = 1.0;
            colors[i * 3 + 2] = 0.2;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 1] = Math.random() * 0.02;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.userData.velocities = velocities;
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        zoneGroup.add(particleSystem);
        zoneGroup.userData.particles = particleSystem;
    }

    createEmergencyShutoffs() {
        // Emergency shutdown stations around the room
        const shutoffPositions = [
            { x: 35, y: 2, z: 0 },
            { x: -35, y: 2, z: 0 },
            { x: 0, y: 2, z: 35 },
            { x: 0, y: 2, z: -35 }
        ];
        
        shutoffPositions.forEach((pos, index) => {
            const shutoff = this.createEmergencyShutoff(pos.x, pos.y, pos.z, index);
            this.emergencyShutoffs.push(shutoff);
            this.scene.add(shutoff);
        });
    }

    createEmergencyShutoff(x, y, z, index) {
        const shutoffGroup = new THREE.Group();
        
        // Base cabinet
        const cabinetGeometry = new THREE.BoxGeometry(2, 4, 1);
        const cabinetMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff4400,
            emissive: 0x441100
        });
        const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
        cabinet.position.y = 2;
        shutoffGroup.add(cabinet);
        
        // Emergency button
        const buttonGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2);
        const buttonMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0x880000
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(0, 2.5, 0.6);
        shutoffGroup.add(button);
        
        // Button housing
        const housingGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5);
        const housingMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(0, 2.3, 0.6);
        shutoffGroup.add(housing);
        
        // Warning label
        const labelGeometry = new THREE.PlaneGeometry(1.5, 0.5);
        const labelMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 1.5, 0.51);
        shutoffGroup.add(label);
        
        shutoffGroup.position.set(x, y, z);
        shutoffGroup.userData.index = index;
        shutoffGroup.userData.activated = false;
        shutoffGroup.userData.button = button;
        shutoffGroup.userData.isEmergencyShutoff = true;
        
        return shutoffGroup;
    }

    createEnvironmentalEffects() {
        this.createSteamVents();
        this.createSparkingElectronics();
        this.createAlarmSounds();
    }

    createSteamVents() {
        const ventPositions = [
            { x: 15, y: 1, z: 15 }, { x: -15, y: 1, z: -15 },
            { x: 15, y: 1, z: -15 }, { x: -15, y: 1, z: 15 },
            { x: 25, y: 8, z: 0 }, { x: -25, y: 8, z: 0 }
        ];
        
        ventPositions.forEach(pos => {
            const steamVent = this.createSteamVent(pos.x, pos.y, pos.z);
            this.steamVents.push(steamVent);
            this.scene.add(steamVent);
        });
    }

    createSteamVent(x, y, z) {
        const ventGroup = new THREE.Group();
        
        // Vent pipe
        const pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
        const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.y = 1;
        ventGroup.add(pipe);
        
        // Steam particles
        const steamCount = 30;
        const steamGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(steamCount * 3);
        const colors = new Float32Array(steamCount * 3);
        const velocities = new Float32Array(steamCount * 3);
        
        for (let i = 0; i < steamCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 1] = 2 + Math.random() * 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            
            colors[i * 3] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.005;
            velocities[i * 3 + 1] = 0.02 + Math.random() * 0.01;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
        }
        
        steamGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        steamGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        steamGeometry.userData.velocities = velocities;
        
        const steamMaterial = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.4
        });
        
        const steam = new THREE.Points(steamGeometry, steamMaterial);
        ventGroup.add(steam);
        
        ventGroup.position.set(x, y, z);
        ventGroup.userData.steam = steam;
        
        return ventGroup;
    }

    createSparkingElectronics() {
        // Sparking electrical panels
        const sparkPositions = [
            { x: 30, y: 10, z: 10 }, { x: -30, y: 10, z: -10 },
            { x: 10, y: 18, z: 30 }, { x: -10, y: 18, z: -30 }
        ];
        
        sparkPositions.forEach(pos => {
            this.createSparks(pos.x, pos.y, pos.z);
        });
    }

    createSparks(x, y, z) {
        const sparkCount = 20;
        const sparkGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(sparkCount * 3);
        const colors = new Float32Array(sparkCount * 3);
        
        for (let i = 0; i < sparkCount; i++) {
            positions[i * 3] = x + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = y + (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = z + (Math.random() - 0.5) * 2;
            
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.2;
        }
        
        sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sparkGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const sparkMaterial = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        this.scene.add(sparks);
        
        // Animate sparks
        setInterval(() => {
            const positions = sparks.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] = x + (Math.random() - 0.5) * 2;
                positions[i + 1] = y + (Math.random() - 0.5) * 2;
                positions[i + 2] = z + (Math.random() - 0.5) * 2;
            }
            sparks.geometry.attributes.position.needsUpdate = true;
        }, 100);
    }

    createAlarmSounds() {
        // This would integrate with audio system
        this.alarmActive = true;
    }

    setupObjectives() {
        this.objectives = [
            {
                id: 'insert_control_rods',
                description: `Insert control rods (${this.controlRodsInserted}/${this.totalControlRods})`,
                completed: false,
                type: 'mechanism'
            },
            {
                id: 'activate_cooling',
                description: 'Activate emergency cooling system',
                completed: false,
                type: 'cooling'
            },
            {
                id: 'emergency_shutdown',
                description: 'Execute emergency shutdown protocol',
                completed: false,
                type: 'shutdown'
            },
            {
                id: 'prevent_meltdown',
                description: 'Prevent reactor meltdown',
                completed: false,
                type: 'survival'
            }
        ];
    }

    startMeltdownTimer() {
        this.meltdownInterval = setInterval(() => {
            this.currentTimer -= 1000; // Decrease by 1 second
            
            if (this.currentTimer <= 0) {
                this.triggerMeltdown();
            } else {
                this.updateReactorStatus();
            }
        }, 1000);
    }

    updateReactorStatus() {
        if (this.reactorCore) {
            // Update reactor core temperature and pressure based on cooling and control rods
            const coolingFactor = this.coolingSystemActive ? 0.98 : 1.02;
            const controlFactor = 1 - (this.controlRodsInserted / this.totalControlRods) * 0.8;
            
            this.temperatureLevel = Math.min(100, this.temperatureLevel * coolingFactor * controlFactor);
            this.pressureLevel = Math.min(100, this.pressureLevel * coolingFactor * controlFactor);
            
            // Update visual effects based on status
            const core = this.reactorCore.userData.core;
            const coreLight = this.reactorCore.userData.coreLight;
            
            if (core) {
                const intensity = this.temperatureLevel / 100;
                core.material.opacity = 0.5 + intensity * 0.3;
                core.material.emissive.setRGB(intensity, intensity * 0.3, 0);
            }
            
            if (coreLight) {
                coreLight.intensity = 2 + (this.temperatureLevel / 100) * 2;
                coreLight.color.setRGB(1, (100 - this.temperatureLevel) / 100, 0);
            }
            
            // Check for stability
            if (this.temperatureLevel < 30 && this.pressureLevel < 30) {
                this.achieveStability();
            }
        }
    }

    insertControlRod(rodIndex) {
        const controlRod = this.controlRods[rodIndex];
        if (controlRod && !controlRod.userData.inserted) {
            controlRod.userData.inserted = true;
            this.controlRodsInserted++;
            
            // Animate rod insertion
            const rod = controlRod.userData.rod;
            const display = controlRod.userData.display;
            
            if (rod) {
                rod.position.y = 5; // Lower into reactor
            }
            
            if (display) {
                display.material.color.setHex(0x00ff00);
                display.material.emissive.setHex(0x004400);
            }
            
            // Update objective
            this.objectives[0].description = `Insert control rods (${this.controlRodsInserted}/${this.totalControlRods})`;
            if (this.controlRodsInserted >= this.totalControlRods) {
                this.objectives[0].completed = true;
            }
            
            // Reduce radiation and temperature
            this.radiationLevel *= 0.85;
            this.temperatureLevel *= 0.9;
        }
    }

    activateCoolingTower(towerIndex) {
        const tower = this.coolingTowers[towerIndex];
        if (tower && !tower.userData.active) {
            tower.userData.active = true;
            
            // Visual activation
            const statusLight = tower.userData.statusLight;
            if (statusLight) {
                statusLight.color.setHex(0x00ff00);
            }
            
            // Animate fan rotation
            const fan = tower.userData.fan;
            const blades = tower.userData.blades;
            if (fan && blades) {
                this.animateFan(fan, blades);
            }
            
            // Check if all cooling towers active
            const allActive = this.coolingTowers.every(t => t.userData.active);
            if (allActive) {
                this.coolingSystemActive = true;
                this.objectives[1].completed = true;
            }
        }
    }

    animateFan(fan, blades) {
        const fanRotation = setInterval(() => {
            if (fan && fan.parent) {
                fan.rotation.y += 0.2;
                blades.forEach(blade => {
                    blade.rotation.y += 0.2;
                });
            } else {
                clearInterval(fanRotation);
            }
        }, 16);
    }

    activateEmergencyShutoff(shutoffIndex) {
        const shutoff = this.emergencyShutoffs[shutoffIndex];
        if (shutoff && !shutoff.userData.activated) {
            shutoff.userData.activated = true;
            
            // Visual feedback
            const button = shutoff.userData.button;
            if (button) {
                button.position.y -= 0.1; // Press button down
                button.material.color.setHex(0x888888);
            }
            
            // Check if all shutoffs activated
            const allActivated = this.emergencyShutoffs.every(s => s.userData.activated);
            if (allActivated) {
                this.emergencyProtocol = true;
                this.objectives[2].completed = true;
                this.initiateShutdown();
            }
        }
    }

    initiateShutdown() {
        // Rapid cooling and pressure reduction
        this.temperatureLevel *= 0.5;
        this.pressureLevel *= 0.5;
        this.radiationLevel *= 0.3;
        
        // Visual effects
        this.createShutdownEffect();
        
        // Extend timer
        this.currentTimer += 120000; // Add 2 minutes
    }

    createShutdownEffect() {
        // Flash all warning lights
        this.warningLights.forEach(light => {
            light.intensity = 3;
            setTimeout(() => {
                light.intensity = 1;
            }, 500);
        });
        
        // Steam release from all vents
        this.steamVents.forEach(vent => {
            const steam = vent.userData.steam;
            if (steam) {
                steam.material.opacity = 1.0;
                setTimeout(() => {
                    steam.material.opacity = 0.4;
                }, 3000);
            }
        });
    }

    achieveStability() {
        if (!this.reactorStable) {
            this.reactorStable = true;
            this.objectives[3].completed = true;
            
            // Stop meltdown timer
            if (this.meltdownInterval) {
                clearInterval(this.meltdownInterval);
            }
            
            // Success effects
            this.createStabilityEffect();
        }
    }

    createStabilityEffect() {
        // Change all warning lights to green
        this.warningLights.forEach(light => {
            light.color.setHex(0x00ff00);
        });
        
        // Reduce reactor core glow
        if (this.reactorCore) {
            const coreLight = this.reactorCore.userData.coreLight;
            if (coreLight) {
                coreLight.intensity = 1;
                coreLight.color.setHex(0x00ff00);
            }
        }
    }

    triggerMeltdown() {
        // Game over - reactor meltdown
        this.createMeltdownEffect();
        
        // This would trigger game over sequence
        console.log("REACTOR MELTDOWN - MISSION FAILED");
    }

    createMeltdownEffect() {
        // Massive explosion effect
        const explosionGeometry = new THREE.SphereGeometry(20, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 1.0
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(0, 10, 0);
        this.scene.add(explosion);
        
        // Animate explosion
        let scale = 1;
        let opacity = 1.0;
        const explosionInterval = setInterval(() => {
            scale += 0.5;
            opacity -= 0.02;
            explosion.scale.setScalar(scale);
            explosion.material.opacity = opacity;
            
            if (opacity <= 0) {
                this.scene.remove(explosion);
                clearInterval(explosionInterval);
            }
        }, 50);
    }

    checkRadiationDamage(playerPosition) {
        if (!playerPosition) return 0;
        
        let totalDamage = 0;
        this.radiationZones.forEach(zone => {
            const distance = playerPosition.distanceTo(zone.position);
            if (distance < zone.userData.radius) {
                const damageRatio = 1 - (distance / zone.userData.radius);
                totalDamage += (zone.userData.radiationLevel / 100) * damageRatio * this.radiationDamageRate;
            }
        });
        
        return totalDamage * (1 - this.radiationProtection / 100);
    }

    createEnvironmentalDetails() {
        this.createPipes();
        this.createElectricalPanels();
        this.createEmergencyEquipment();
    }

    createPipes() {
        // Additional piping throughout the facility
        const pipeRuns = [
            { from: { x: 30, y: 5, z: 0 }, to: { x: 15, y: 8, z: 0 } },
            { from: { x: -30, y: 5, z: 0 }, to: { x: -15, y: 8, z: 0 } },
            { from: { x: 0, y: 5, z: 30 }, to: { x: 0, y: 8, z: 15 } },
            { from: { x: 0, y: 5, z: -30 }, to: { x: 0, y: 8, z: -15 } }
        ];
        
        pipeRuns.forEach(run => {
            const direction = new THREE.Vector3().subVectors(
                new THREE.Vector3(run.to.x, run.to.y, run.to.z),
                new THREE.Vector3(run.from.x, run.from.y, run.from.z)
            );
            const distance = direction.length();
            
            const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, distance);
            const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            
            pipe.position.set(
                (run.from.x + run.to.x) / 2,
                (run.from.y + run.to.y) / 2,
                (run.from.z + run.to.z) / 2
            );
            
            pipe.lookAt(new THREE.Vector3(run.to.x, run.to.y, run.to.z));
            pipe.rotateX(Math.PI / 2);
            
            this.scene.add(pipe);
        });
    }

    createElectricalPanels() {
        const panelPositions = [
            { x: 20, y: 3, z: 25 }, { x: -20, y: 3, z: -25 },
            { x: 25, y: 15, z: 10 }, { x: -25, y: 15, z: -10 }
        ];
        
        panelPositions.forEach(pos => {
            const panelGeometry = new THREE.BoxGeometry(2, 3, 0.5);
            const panelMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(pos.x, pos.y, pos.z);
            this.scene.add(panel);
            
            // Panel lights
            for (let i = 0; i < 6; i++) {
                const lightGeometry = new THREE.SphereGeometry(0.05);
                const lightMaterial = new THREE.MeshBasicMaterial({ 
                    color: Math.random() > 0.5 ? 0x00ff00 : 0xff0000,
                    emissive: Math.random() > 0.5 ? 0x004400 : 0x440000
                });
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.set(
                    pos.x + 0.26,
                    pos.y - 1 + (i % 3) * 0.7,
                    pos.z + (Math.floor(i / 3) - 0.5) * 0.5
                );
                this.scene.add(light);
            }
        });
    }

    createEmergencyEquipment() {
        // Fire extinguishers, gas masks, etc.
        const equipmentPositions = [
            { x: 32, y: 2, z: 15 }, { x: -32, y: 2, z: -15 },
            { x: 15, y: 2, z: 32 }, { x: -15, y: 2, z: -32 }
        ];
        
        equipmentPositions.forEach(pos => {
            const extinguisherGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
            const extinguisherMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            const extinguisher = new THREE.Mesh(extinguisherGeometry, extinguisherMaterial);
            extinguisher.position.set(pos.x, pos.y, pos.z);
            this.scene.add(extinguisher);
        });
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update radiation particle systems
        this.radiationZones.forEach(zone => {
            const particles = zone.userData.particles;
            if (particles) {
                const positions = particles.geometry.attributes.position.array;
                const velocities = particles.geometry.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i] * deltaTime;
                    positions[i + 1] += velocities[i + 1] * deltaTime;
                    positions[i + 2] += velocities[i + 2] * deltaTime;
                    
                    // Boundary check
                    const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 2] * positions[i + 2]);
                    if (distance > zone.userData.radius) {
                        velocities[i] *= -1;
                        velocities[i + 2] *= -1;
                    }
                    if (positions[i + 1] > 8) {
                        positions[i + 1] = 0;
                    }
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update steam effects
        this.steamVents.forEach(vent => {
            const steam = vent.userData.steam;
            if (steam) {
                const positions = steam.geometry.attributes.position.array;
                const velocities = steam.geometry.userData.velocities;
                
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] += velocities[i] * deltaTime;
                    positions[i + 1] += velocities[i + 1] * deltaTime;
                    positions[i + 2] += velocities[i + 2] * deltaTime;
                    
                    if (positions[i + 1] > 15) {
                        positions[i] = (Math.random() - 0.5) * 0.5;
                        positions[i + 1] = 2;
                        positions[i + 2] = (Math.random() - 0.5) * 0.5;
                    }
                }
                
                steam.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Check player interaction with reactor controls
        if (this.game.player) {
            // Check control rod interactions
            this.controlRods.forEach((rod, index) => {
                if (!rod.userData.inserted) {
                    const distance = this.game.player.position.distanceTo(rod.position);
                    if (distance < 3) {
                        rod.userData.canActivate = true;
                    }
                }
            });
            
            // Check cooling tower interactions
            this.coolingTowers.forEach((tower, index) => {
                if (!tower.userData.active) {
                    const distance = this.game.player.position.distanceTo(tower.position);
                    if (distance < 5) {
                        tower.userData.canActivate = true;
                    }
                }
            });
            
            // Check emergency shutoff interactions
            this.emergencyShutoffs.forEach((shutoff, index) => {
                if (!shutoff.userData.activated) {
                    const distance = this.game.player.position.distanceTo(shutoff.position);
                    if (distance < 3) {
                        shutoff.userData.canActivate = true;
                    }
                }
            });
            
            // Apply radiation damage
            const radiationDamage = this.checkRadiationDamage(this.game.player.position);
            if (radiationDamage > 0) {
                // Apply damage to player (would integrate with health system)
            }
        }
    }

    getSpawnPosition() {
        return new THREE.Vector3(35, 2, 0);
    }

    isComplete() {
        return this.reactorStable;
    }

    getRemainingTime() {
        return Math.max(0, Math.floor(this.currentTimer / 1000));
    }

    cleanup() {
        super.cleanup();
        
        if (this.meltdownInterval) {
            clearInterval(this.meltdownInterval);
        }
        
        this.coolingTowers = [];
        this.controlRods = [];
        this.radiationZones = [];
        this.coolingPipes = [];
        this.emergencyShutoffs = [];
        this.warningLights = [];
        this.steamVents = [];
        this.reactorCore = null;
    }
}
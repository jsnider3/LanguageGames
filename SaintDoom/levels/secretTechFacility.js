import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';

export class SecretTechFacility extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;
        
        this.name = 'Black Site Omega';
        this.description = 'Ultra-classified MIB research facility conducting alien-human hybrid experiments';
        
        // Level properties
        this.isSecret = true;
        this.unlockRequirement = 'Collect all MIB access codes from corrupted agents';
        
        // Tech facility mechanics
        this.systems = {
            power: { online: true, generators: 3, activeGenerators: 3 },
            security: { level: 5, cameras: [], turrets: [], lasers: [] },
            containment: { breached: false, specimens: [], fields: [] },
            data: { terminals: [], encrypted: true, downloadProgress: 0 }
        };
        
        // Experimental areas
        this.labs = {
            genetics: { accessible: false, experiments: [] },
            weapons: { accessible: false, prototypes: [] },
            dimensional: { accessible: false, portals: [] },
            ai: { accessible: false, mainframe: null }
        };
        
        // Hazards
        this.alienSpecimens = [];
        this.securityBots = [];
        this.experimentalWeapons = [];
        this.radiationZones = [];
        this.quarantineAreas = [];
        
        // Special items
        this.keycards = {
            red: { found: false, location: null },
            blue: { found: false, location: null },
            gold: { found: false, location: null },
            black: { found: false, location: null }
        };
        
        this.prototypes = [];
        this.dataFiles = [];
        
        // Environmental
        this.emergencyLights = [];
        this.ventilationShafts = [];
        this.elevators = [];
        this.alarms = [];
        
        this.alertLevel = 0; // 0-5
        this.lockdownActive = false;
        
        // Initialize arrays that were missing
        this.rooms = [];
        this.doors = [];
        this.items = [];
        this.enemies = [];
        this.walls = [];
    }
    
    create() {
        // Call generate to build the level
        this.generate();
        
        // Return required data structure for Game.js
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }

    generate() {
        this.createFacilityStructure();
        this.createMainLobby();
        this.createResearchLabs();
        this.createContainmentArea();
        this.createWeaponsLab();
        this.createServerRoom();
        this.createDimensionalLab();
        this.createEmergencySystems();
        this.placeKeycards();
        this.createSecuritySystems();
        this.spawnAlienSpecimens();
        this.setupEnvironmentalHazards();
        
        return {
            rooms: this.rooms,
            doors: this.doors,
            items: this.items,
            enemies: this.enemies,
            objectives: this.createObjectives()
        };
    }

    createFacilityStructure() {
        const facilityGroup = new THREE.Group();
        
        // Metal floor with warning stripes
        const floorGeometry = new THREE.BoxGeometry(150, 1, 150);
        const floorMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.3
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        facilityGroup.add(floor);
        
        // Warning stripes
        this.createWarningStripes(floor);
        
        // Industrial ceiling with pipes and vents
        const ceilingHeight = 10;
        const ceilingGeometry = new THREE.BoxGeometry(150, 1, 150);
        const ceilingMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.8
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = ceilingHeight;
        facilityGroup.add(ceiling);
        
        // Pipes and ventilation
        this.createPipeNetwork(facilityGroup, ceilingHeight);
        
        this.scene.add(facilityGroup);
        this.structure = facilityGroup;
    }

    createMainLobby() {
        const lobbyGroup = new THREE.Group();
        
        // Reception desk
        const deskGeometry = new THREE.BoxGeometry(8, 1.5, 3);
        const deskMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            metalness: 0.5
        });
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(0, 0.75, 20);
        lobbyGroup.add(desk);
        
        // Security checkpoint
        const checkpointGroup = this.createSecurityCheckpoint();
        checkpointGroup.position.set(0, 0, 10);
        lobbyGroup.add(checkpointGroup);
        
        // MIB logo hologram
        const hologramGroup = this.createMIBHologram();
        hologramGroup.position.set(0, 3, 25);
        lobbyGroup.add(hologramGroup);
        
        // Security monitors
        for (let i = -2; i <= 2; i++) {
            const monitor = this.createSecurityMonitor();
            monitor.position.set(i * 3, 2, 19);
            lobbyGroup.add(monitor);
            this.systems.security.cameras.push(monitor);
        }
        
        // Elevator access
        const elevatorDoors = this.createElevatorDoors();
        elevatorDoors.position.set(-30, 0, 0);
        lobbyGroup.add(elevatorDoors);
        this.elevators.push(elevatorDoors);
        
        // Emergency exits (sealed)
        this.createEmergencyExits(lobbyGroup);
        
        this.scene.add(lobbyGroup);
        this.rooms.push({
            name: 'Main Lobby',
            group: lobbyGroup,
            clearance: 0,
            bounds: { min: { x: -40, z: -10 }, max: { x: 40, z: 30 } }
        });
    }

    createResearchLabs() {
        const labTypes = [
            { name: 'Genetics Lab', position: { x: -50, z: -30 }, clearance: 3 },
            { name: 'Bioweapons Lab', position: { x: 50, z: -30 }, clearance: 4 },
            { name: 'Alien Autopsy', position: { x: 0, z: -60 }, clearance: 5 },
            { name: 'Hybrid Development', position: { x: -50, z: -60 }, clearance: 5 }
        ];
        
        labTypes.forEach(lab => {
            const labGroup = new THREE.Group();
            
            // Lab walls (glass and metal)
            this.createLabWalls(labGroup);
            
            // Lab equipment
            const equipment = this.createLabEquipment(lab.name);
            equipment.forEach(item => {
                item.position.set(
                    (Math.random() - 0.5) * 15,
                    0,
                    (Math.random() - 0.5) * 15
                );
                labGroup.add(item);
            });
            
            // Specimen containers
            if (lab.name.includes('Genetics') || lab.name.includes('Hybrid')) {
                const containers = this.createSpecimenContainers();
                containers.forEach((container, index) => {
                    container.position.set(
                        -10 + index * 5,
                        0,
                        -8
                    );
                    labGroup.add(container);
                    this.systems.containment.specimens.push(container);
                });
            }
            
            // Computer terminals
            const terminal = this.createComputerTerminal(lab.clearance);
            terminal.position.set(0, 0, 8);
            labGroup.add(terminal);
            this.systems.data.terminals.push(terminal);
            
            // Hazard warnings
            if (lab.clearance >= 4) {
                this.createBiohazardWarnings(labGroup);
            }
            
            labGroup.position.set(lab.position.x, 0, lab.position.z);
            this.scene.add(labGroup);
            
            this.rooms.push({
                name: lab.name,
                group: labGroup,
                clearance: lab.clearance,
                bounds: {
                    min: { x: lab.position.x - 20, z: lab.position.z - 20 },
                    max: { x: lab.position.x + 20, z: lab.position.z + 20 }
                }
            });
            
            // Store lab reference
            if (lab.name.includes('Genetics')) {
                this.labs.genetics.accessible = true;
                this.labs.genetics.room = labGroup;
            }
        });
    }

    createContainmentArea() {
        const containmentGroup = new THREE.Group();
        
        // Containment cells
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.createContainmentCell(row * 4 + col);
                cell.position.set(
                    col * 12 - 18,
                    0,
                    row * 12 - 12
                );
                containmentGroup.add(cell);
                
                // Some cells are breached
                if (Math.random() < 0.3) {
                    this.breachContainment(cell);
                }
            }
        }
        
        // Central observation platform
        const platformGroup = this.createObservationPlatform();
        platformGroup.position.set(0, 5, 0);
        containmentGroup.add(platformGroup);
        
        // Force field generators
        const generators = this.createForceFieldGenerators();
        generators.forEach((gen, index) => {
            const angle = (index / 4) * Math.PI * 2;
            gen.position.x = Math.cos(angle) * 25;
            gen.position.z = Math.sin(angle) * 25;
            containmentGroup.add(gen);
            this.systems.containment.fields.push(gen);
        });
        
        // Emergency containment protocol console
        const protocolConsole = this.createEmergencyConsole();
        protocolConsole.position.set(0, 5, -10);
        containmentGroup.add(protocolConsole);
        
        containmentGroup.position.set(0, 0, -100);
        this.scene.add(containmentGroup);
        
        this.rooms.push({
            name: 'Containment Area',
            group: containmentGroup,
            clearance: 5,
            hazardous: true,
            bounds: { min: { x: -30, z: -130 }, max: { x: 30, z: -70 } }
        });
    }

    createWeaponsLab() {
        const weaponsLabGroup = new THREE.Group();
        
        // Weapon testing range
        const rangeGroup = this.createTestingRange();
        rangeGroup.position.z = -15;
        weaponsLabGroup.add(rangeGroup);
        
        // Prototype weapon displays
        const prototypes = [
            { name: 'Plasma Cannon MK-III', damage: 200 },
            { name: 'Quantum Disruptor', damage: 150 },
            { name: 'Nano-Swarm Launcher', damage: 100 },
            { name: 'Graviton Beam', damage: 180 }
        ];
        
        prototypes.forEach((proto, index) => {
            const display = this.createWeaponDisplay(proto);
            display.position.set(
                -15 + index * 10,
                1,
                10
            );
            weaponsLabGroup.add(display);
            this.experimentalWeapons.push({ display, data: proto });
        });
        
        // Ammunition fabricator
        const fabricator = this.createAmmoFabricator();
        fabricator.position.set(20, 0, 0);
        weaponsLabGroup.add(fabricator);
        
        // Armor testing dummies
        for (let i = 0; i < 5; i++) {
            const dummy = this.createTestDummy();
            dummy.position.set(
                -10 + i * 5,
                0,
                -20
            );
            weaponsLabGroup.add(dummy);
        }
        
        weaponsLabGroup.position.set(60, 0, 0);
        this.scene.add(weaponsLabGroup);
        
        this.rooms.push({
            name: 'Weapons Laboratory',
            group: weaponsLabGroup,
            clearance: 4,
            bounds: { min: { x: 40, z: -30 }, max: { x: 80, z: 30 } }
        });
        
        this.labs.weapons.accessible = true;
        this.labs.weapons.room = weaponsLabGroup;
    }

    createServerRoom() {
        const serverGroup = new THREE.Group();
        
        // Server racks
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 3; col++) {
                const rack = this.createServerRack();
                rack.position.set(
                    col * 4 - 4,
                    0,
                    row * 3 - 6
                );
                serverGroup.add(rack);
            }
        }
        
        // Central mainframe
        const mainframe = this.createMainframe();
        mainframe.position.set(0, 0, -10);
        serverGroup.add(mainframe);
        this.labs.ai.mainframe = mainframe;
        
        // Cooling systems
        const cooling = this.createCoolingSystem();
        cooling.position.set(-10, 0, 0);
        serverGroup.add(cooling);
        
        // Data terminals
        for (let i = 0; i < 3; i++) {
            const terminal = this.createDataTerminal();
            terminal.position.set(
                10,
                0,
                -5 + i * 5
            );
            serverGroup.add(terminal);
            this.systems.data.terminals.push(terminal);
        }
        
        // Holographic displays
        this.createHolographicDisplays(serverGroup);
        
        serverGroup.position.set(-60, 0, 30);
        this.scene.add(serverGroup);
        
        this.rooms.push({
            name: 'Server Room',
            group: serverGroup,
            clearance: 3,
            temperature: 'cold',
            bounds: { min: { x: -75, z: 15 }, max: { x: -45, z: 45 } }
        });
    }

    createDimensionalLab() {
        const dimensionalGroup = new THREE.Group();
        
        // Portal generator
        const portalGen = this.createPortalGenerator();
        portalGen.position.set(0, 0, 0);
        dimensionalGroup.add(portalGen);
        
        // Active portals (dangerous!)
        const portalPositions = [
            { x: -10, z: -10, destination: 'hell' },
            { x: 10, z: -10, destination: 'void' },
            { x: 0, z: 10, destination: 'unknown' }
        ];
        
        portalPositions.forEach(pos => {
            const portal = this.createDimensionalPortal(pos.destination);
            portal.position.set(pos.x, 1, pos.z);
            dimensionalGroup.add(portal);
            this.labs.dimensional.portals.push({ mesh: portal, destination: pos.destination });
        });
        
        // Containment field around lab
        const fieldGeometry = new THREE.BoxGeometry(40, 15, 40);
        const fieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.y = 7.5;
        dimensionalGroup.add(field);
        
        // Reality stabilizers
        for (let i = 0; i < 4; i++) {
            const stabilizer = this.createRealityStabilizer();
            const angle = (i / 4) * Math.PI * 2;
            stabilizer.position.x = Math.cos(angle) * 15;
            stabilizer.position.z = Math.sin(angle) * 15;
            dimensionalGroup.add(stabilizer);
        }
        
        // Warning holograms
        this.createDimensionalWarnings(dimensionalGroup);
        
        dimensionalGroup.position.set(0, 0, 60);
        this.scene.add(dimensionalGroup);
        
        this.rooms.push({
            name: 'Dimensional Research',
            group: dimensionalGroup,
            clearance: 5,
            unstable: true,
            bounds: { min: { x: -20, z: 40 }, max: { x: 20, z: 80 } }
        });
        
        this.labs.dimensional.accessible = true;
        this.labs.dimensional.room = dimensionalGroup;
    }

    createEmergencySystems() {
        // Emergency lighting
        this.rooms.forEach(room => {
            for (let i = 0; i < 4; i++) {
                const light = this.createEmergencyLight();
                const bounds = room.bounds;
                light.position.set(
                    bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x),
                    9,
                    bounds.min.z + Math.random() * (bounds.max.z - bounds.min.z)
                );
                this.scene.add(light);
                this.emergencyLights.push(light);
            }
        });
        
        // Ventilation shafts
        this.createVentilationNetwork();
        
        // Alarm systems
        this.createAlarmSystem();
        
        // Sprinkler system (for fire suppression)
        this.createSprinklerSystem();
    }

    placeKeycards() {
        const keycardLocations = [
            { color: 'red', position: { x: -50, y: 1, z: -30 }, room: 'Genetics Lab' },
            { color: 'blue', position: { x: 60, y: 1, z: 0 }, room: 'Weapons Laboratory' },
            { color: 'gold', position: { x: -60, y: 1, z: 30 }, room: 'Server Room' },
            { color: 'black', position: { x: 0, y: 6, z: -100 }, room: 'Containment Area' }
        ];
        
        keycardLocations.forEach(loc => {
            const keycard = this.createKeycard(loc.color);
            keycard.position.set(loc.position.x, loc.position.y, loc.position.z);
            this.scene.add(keycard);
            
            this.keycards[loc.color].location = loc.position;
            this.keycards[loc.color].mesh = keycard;
            
            // Float animation
            this.animateKeycard(keycard);
        });
    }

    createSecuritySystems() {
        // Security cameras
        this.rooms.forEach(room => {
            if (room.clearance > 0) {
                const cameraCount = Math.ceil(room.clearance / 2);
                for (let i = 0; i < cameraCount; i++) {
                    const camera = this.createSecurityCamera();
                    const bounds = room.bounds;
                    camera.position.set(
                        bounds.min.x + (bounds.max.x - bounds.min.x) * (i + 1) / (cameraCount + 1),
                        9,
                        bounds.min.z + 2
                    );
                    room.group.add(camera);
                    this.systems.security.cameras.push(camera);
                }
            }
        });
        
        // Automated turrets
        this.createAutoTurrets();
        
        // Laser grids
        this.createLaserGrids();
        
        // Motion sensors
        this.createMotionSensors();
    }

    spawnAlienSpecimens() {
        // Escaped specimens roaming the facility
        const specimenTypes = [
            { type: 'grey', health: 100, speed: 3, psychic: true },
            { type: 'reptilian', health: 150, speed: 2.5, strength: 60 },
            { type: 'insectoid', health: 80, speed: 4, swarm: true },
            { type: 'hybrid', health: 120, speed: 3, adaptive: true }
        ];
        
        specimenTypes.forEach((specimen, index) => {
            const alien = this.createAlienSpecimen(specimen);
            alien.position.set(
                (Math.random() - 0.5) * 100,
                0,
                (Math.random() - 0.5) * 100
            );
            this.scene.add(alien);
            
            const alienEnemy = {
                mesh: alien,
                position: alien.position,
                velocity: new THREE.Vector3(0, 0, 0),
                data: specimen,
                state: 'roaming',
                target: null,
                health: specimen.health || 50,
                maxHealth: specimen.health || 50,
                damage: specimen.damage || 15,
                speed: specimen.speed || 1,
                radius: 1,
                update: function(deltaTime, playerPosition) {
                    if (!this.mesh) return;
                    
                    this.velocity.set(0, 0, 0);
                    
                    if (playerPosition) {
                        const dx = playerPosition.x - this.position.x;
                        const dz = playerPosition.z - this.position.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        
                        if (distance < 20) {
                            this.state = 'hunting';
                            if (distance > 2) {
                                this.velocity.x = (dx / distance) * this.speed;
                                this.velocity.z = (dz / distance) * this.speed;
                            }
                            this.mesh.rotation.y = Math.atan2(dx, dz);
                        } else {
                            this.state = 'roaming';
                        }
                    }
                    
                    this.position.x += this.velocity.x * deltaTime;
                    this.position.z += this.velocity.z * deltaTime;
                },
                takeDamage: function(amount) {
                    this.health -= amount;
                    if (this.health <= 0 && this.mesh) {
                        if (this.mesh.parent) {
                            this.mesh.parent.remove(this.mesh);
                        }
                        this.mesh = null;
                        return true;
                    }
                    return false;
                },
                applyKnockback: function(force) {
                    if (this.velocity && force) {
                        this.velocity.x += force.x;
                        this.velocity.z += force.z;
                    }
                },
                onDeath: function() {
                    this.isDead = true;
                    if (this.mesh && this.mesh.parent) {
                        this.mesh.parent.remove(this.mesh);
                    }
                    this.mesh = null;
                }
            };
            
            this.alienSpecimens.push(alienEnemy);
            this.enemies.push(alienEnemy);
        });
        
        // Security bots
        for (let i = 0; i < 5; i++) {
            const bot = this.createSecurityBot();
            bot.position.set(
                (Math.random() - 0.5) * 120,
                0,
                (Math.random() - 0.5) * 120
            );
            this.scene.add(bot);
            
            const botEnemy = {
                mesh: bot,
                position: bot.position,
                velocity: new THREE.Vector3(0, 0, 0),
                health: 40,
                maxHealth: 40,
                damage: 10,
                speed: 2,
                radius: 0.8,
                state: 'patrol',
                update: function(deltaTime, playerPosition) {
                    if (!this.mesh) return;
                    
                    this.velocity.set(0, 0, 0);
                    
                    if (playerPosition) {
                        const dx = playerPosition.x - this.position.x;
                        const dz = playerPosition.z - this.position.z;
                        const distance = Math.sqrt(dx * dx + dz * dz);
                        
                        if (distance < 15) {
                            this.state = 'attack';
                            if (distance > 3) {
                                this.velocity.x = (dx / distance) * this.speed;
                                this.velocity.z = (dz / distance) * this.speed;
                            }
                            this.mesh.rotation.y = Math.atan2(dx, dz);
                        } else {
                            this.state = 'patrol';
                        }
                    }
                    
                    this.position.x += this.velocity.x * deltaTime;
                    this.position.z += this.velocity.z * deltaTime;
                    
                    // Animate hover effect
                    if (this.mesh) {
                        this.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
                    }
                },
                takeDamage: function(amount) {
                    this.health -= amount;
                    if (this.health <= 0 && this.mesh) {
                        if (this.mesh.parent) {
                            this.mesh.parent.remove(this.mesh);
                        }
                        this.mesh = null;
                        return true;
                    }
                    return false;
                },
                applyKnockback: function(force) {
                    if (this.velocity && force) {
                        this.velocity.x += force.x * 0.5; // Bots are heavier
                        this.velocity.z += force.z * 0.5;
                    }
                },
                onDeath: function() {
                    this.isDead = true;
                    if (this.mesh && this.mesh.parent) {
                        this.mesh.parent.remove(this.mesh);
                    }
                    this.mesh = null;
                }
            };
            
            this.securityBots.push(botEnemy);
            this.enemies.push(botEnemy);
        }
    }

    setupEnvironmentalHazards() {
        // Radiation zones
        const radiationAreas = [
            { position: { x: 0, z: -100 }, radius: 15, intensity: 'high' },
            { position: { x: 60, z: 0 }, radius: 10, intensity: 'medium' },
            { position: { x: -60, z: 30 }, radius: 8, intensity: 'low' }
        ];
        
        radiationAreas.forEach(area => {
            const zone = this.createRadiationZone(area);
            zone.position.set(area.position.x, 0, area.position.z);
            this.scene.add(zone);
            this.radiationZones.push(zone);
        });
        
        // Quarantine areas
        this.createQuarantineZones();
        
        // Chemical spills
        this.createChemicalHazards();
        
        // Electrical hazards
        this.createElectricalHazards();
    }

    // Helper methods for creating facility elements
    createWarningStripes(floor) {
        const stripeGeometry = new THREE.PlaneGeometry(2, 150);
        const stripeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide
        });
        
        for (let i = -70; i <= 70; i += 10) {
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(i, 0.01, 0);
            floor.add(stripe);
        }
    }

    createPipeNetwork(group, height) {
        for (let i = 0; i < 20; i++) {
            const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 150, 8);
            const pipeMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                metalness: 0.8
            });
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.y = height - 1;
            pipe.position.x = (Math.random() - 0.5) * 140;
            pipe.position.z = (Math.random() - 0.5) * 140;
            pipe.rotation.z = Math.random() < 0.5 ? 0 : Math.PI / 2;
            group.add(pipe);
        }
    }

    createSecurityCheckpoint() {
        const checkpointGroup = new THREE.Group();
        
        // Metal detector frame
        const frameGeometry = new THREE.BoxGeometry(0.2, 4, 3);
        const frameMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            metalness: 0.9
        });
        
        for (let side = -1; side <= 1; side += 2) {
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.x = side * 1.5;
            frame.position.y = 2;
            checkpointGroup.add(frame);
        }
        
        // Scanner beam
        const scannerGeometry = new THREE.PlaneGeometry(3, 4);
        const scannerMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
        scanner.position.y = 2;
        checkpointGroup.add(scanner);
        
        // Animate scanner
        this.animateScanner(scanner);
        
        return checkpointGroup;
    }

    createMIBHologram() {
        const hologramGroup = new THREE.Group();
        
        // MIB logo geometry
        const logoGeometry = new THREE.TorusGeometry(1.5, 0.3, 8, 16);
        const logoMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        hologramGroup.add(logo);
        
        // Text (simplified)
        const textGeometry = new THREE.BoxGeometry(3, 0.5, 0.1);
        const text = new THREE.Mesh(textGeometry, logoMaterial);
        text.position.y = -2;
        hologramGroup.add(text);
        
        // Animate hologram
        const animateHologram = () => {
            logo.rotation.y += 0.01;
            logo.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
            text.material.opacity = 0.6 + Math.sin(Date.now() * 0.005) * 0.2;
            
            requestAnimationFrame(animateHologram);
        };
        animateHologram();
        
        return hologramGroup;
    }

    createContainmentCell(id) {
        const cellGroup = new THREE.Group();
        
        // Cell structure
        const cellGeometry = new THREE.BoxGeometry(10, 8, 10);
        const cellMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            metalness: 0.7,
            transparent: true,
            opacity: 0.3
        });
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.y = 4;
        cellGroup.add(cell);
        
        // Energy field
        const fieldGeometry = new THREE.BoxGeometry(9.5, 7.5, 9.5);
        const fieldMaterial = new THREE.MeshBasicMaterial({
            color: id % 2 === 0 ? 0x0066ff : 0x00ff66,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        field.position.y = 4;
        cellGroup.add(field);
        
        // Specimen inside (sometimes)
        if (Math.random() < 0.4) {
            const specimen = this.createContainedSpecimen();
            specimen.position.y = 2;
            cellGroup.add(specimen);
        }
        
        cellGroup.userData = { id, breached: false };
        
        return cellGroup;
    }

    breachContainment(cell) {
        cell.userData.breached = true;
        
        // Break the field
        const field = cell.children.find(child => child.material.wireframe);
        if (field) {
            field.visible = false;
        }
        
        // Add damage effects
        const damageGeometry = new THREE.BoxGeometry(2, 8, 0.5);
        const damageMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111
        });
        const damage = new THREE.Mesh(damageGeometry, damageMaterial);
        damage.position.z = 5;
        damage.position.y = 4;
        damage.rotation.x = Math.random() * 0.3;
        cell.add(damage);
    }

    createAlienSpecimen(data) {
        const alienGroup = new THREE.Group();
        
        let geometry, material;
        
        switch(data.type) {
            case 'grey':
                // Classic grey alien
                geometry = new THREE.SphereGeometry(0.8, 8, 8);
                material = new THREE.MeshPhongMaterial({
                    color: 0x888888,
                    emissive: 0x000088,
                    emissiveIntensity: 0.2
                });
                break;
            case 'reptilian':
                // Reptilian alien
                geometry = new THREE.ConeGeometry(0.8, 2.5, 8);
                material = new THREE.MeshPhongMaterial({
                    color: 0x006600,
                    emissive: 0x002200,
                    roughness: 0.8
                });
                break;
            case 'insectoid':
                // Insect-like alien
                geometry = new THREE.OctahedronGeometry(1, 0);
                material = new THREE.MeshPhongMaterial({
                    color: 0x442200,
                    metalness: 0.6
                });
                break;
            case 'hybrid':
                // Human-alien hybrid
                geometry = new THREE.BoxGeometry(0.8, 2, 0.5);
                material = new THREE.MeshPhongMaterial({
                    color: 0xffddaa,
                    emissive: 0x000044,
                    emissiveIntensity: 0.1
                });
                break;
            default:
                geometry = new THREE.SphereGeometry(1, 8, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        }
        
        const body = new THREE.Mesh(geometry, material);
        body.position.y = 1;
        alienGroup.add(body);
        
        // Eyes
        for (let i = -1; i <= 1; i += 2) {
            const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const eyeMaterial = new THREE.MeshBasicMaterial({
                color: data.type === 'grey' ? 0x000000 : 0xff0000,
                emissive: data.type === 'grey' ? 0x000000 : 0xff0000,
                emissiveIntensity: 0.5
            });
            const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            eye.position.set(i * 0.3, 1.5, 0.5);
            alienGroup.add(eye);
        }
        
        alienGroup.userData = data;
        
        return alienGroup;
    }

    createSecurityBot() {
        const botGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            metalness: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        botGroup.add(body);
        
        // Hover base
        const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x0066ff,
            emissive: 0x003366,
            emissiveIntensity: 0.5
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        botGroup.add(base);
        
        // Weapon arms
        for (let side = -1; side <= 1; side += 2) {
            const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
            const arm = new THREE.Mesh(armGeometry, bodyMaterial);
            arm.position.set(side * 0.7, 1, 0);
            arm.rotation.z = side * Math.PI / 6;
            botGroup.add(arm);
        }
        
        // Scanner eye
        const scannerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const scannerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });
        const scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
        scanner.position.set(0, 1.5, 0.4);
        botGroup.add(scanner);
        
        // Animate hover
        const animateBot = () => {
            botGroup.position.y = Math.sin(Date.now() * 0.003) * 0.2 + 0.5;
            botGroup.rotation.y += 0.005;
            
            requestAnimationFrame(animateBot);
        };
        animateBot();
        
        return botGroup;
    }

    createKeycard(color) {
        const cardGroup = new THREE.Group();
        
        const colors = {
            red: 0xff0000,
            blue: 0x0000ff,
            gold: 0xffdd00,
            black: 0x000000
        };
        
        const cardGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.5);
        const cardMaterial = new THREE.MeshPhongMaterial({
            color: colors[color],
            metalness: 0.7,
            emissive: colors[color],
            emissiveIntensity: 0.2
        });
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        cardGroup.add(card);
        
        // Magnetic strip
        const stripGeometry = new THREE.BoxGeometry(0.25, 0.01, 0.08);
        const stripMaterial = new THREE.MeshPhongMaterial({
            color: 0x111111
        });
        const strip = new THREE.Mesh(stripGeometry, stripMaterial);
        strip.position.y = 0.015;
        strip.position.z = -0.15;
        cardGroup.add(strip);
        
        cardGroup.userData = { color, collected: false };
        
        return cardGroup;
    }

    animateKeycard(keycard) {
        const animate = () => {
            keycard.rotation.y += 0.02;
            keycard.position.y += Math.sin(Date.now() * 0.003) * 0.002;
            
            requestAnimationFrame(animate);
        };
        animate();
    }

    createPortalGenerator() {
        const generatorGroup = new THREE.Group();
        
        // Ring structure
        const ringGeometry = new THREE.TorusGeometry(5, 0.5, 8, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.9,
            emissive: 0x0066ff,
            emissiveIntensity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 3;
        generatorGroup.add(ring);
        
        // Energy coils
        for (let i = 0; i < 8; i++) {
            const coilGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
            const coilMaterial = new THREE.MeshPhongMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.5
            });
            const coil = new THREE.Mesh(coilGeometry, coilMaterial);
            const angle = (i / 8) * Math.PI * 2;
            coil.position.x = Math.cos(angle) * 5;
            coil.position.z = Math.sin(angle) * 5;
            coil.position.y = 1;
            generatorGroup.add(coil);
        }
        
        // Control panel
        const panelGeometry = new THREE.BoxGeometry(2, 1.5, 0.5);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            metalness: 0.5
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(7, 0.75, 0);
        generatorGroup.add(panel);
        
        return generatorGroup;
    }

    createDimensionalPortal(destination) {
        const portalGroup = new THREE.Group();
        
        // Portal effect
        const portalGeometry = new THREE.PlaneGeometry(3, 4);
        let portalMaterial;
        
        switch(destination) {
            case 'hell':
                portalMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    emissive: 0x660000,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                break;
            case 'void':
                portalMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    emissive: 0x220022,
                    transparent: true,
                    opacity: 0.9,
                    side: THREE.DoubleSide
                });
                break;
            default:
                portalMaterial = new THREE.MeshBasicMaterial({
                    color: 0x9900ff,
                    emissive: 0x440044,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide
                });
        }
        
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portalGroup.add(portal);
        
        // Swirling effect
        const swirlGeometry = new THREE.TorusGeometry(2, 0.3, 8, 32);
        const swirlMaterial = new THREE.MeshBasicMaterial({
            color: portalMaterial.color,
            transparent: true,
            opacity: 0.5
        });
        const swirl = new THREE.Mesh(swirlGeometry, swirlMaterial);
        portalGroup.add(swirl);
        
        // Animate portal
        const animatePortal = () => {
            swirl.rotation.z += 0.05;
            portal.material.opacity = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;
            
            requestAnimationFrame(animatePortal);
        };
        animatePortal();
        
        portalGroup.userData = { destination, active: true };
        
        return portalGroup;
    }

    // Update methods
    update(deltaTime) {
        // Update security alert level
        this.updateAlertLevel();
        
        // Update alien specimens AI
        this.updateAlienAI(deltaTime);
        
        // Update security bots
        this.updateSecurityBots(deltaTime);
        
        // Check keycard collection
        this.checkKeycardCollection();
        
        // Update containment status
        this.updateContainment();
        
        // Check hazard zones
        this.checkHazardDamage();
        
        // Update portal effects
        this.updatePortals(deltaTime);
    }

    updateAlertLevel() {
        // Increase alert based on player actions
        if (this.player) {
            const playerPos = this.player.position || this.player.mesh.position;
            
            // Check if player is in restricted area
            this.rooms.forEach(room => {
                if (room.clearance > 3) {
                    const bounds = room.bounds;
                    if (playerPos.x >= bounds.min.x && playerPos.x <= bounds.max.x &&
                        playerPos.z >= bounds.min.z && playerPos.z <= bounds.max.z) {
                        this.alertLevel = Math.min(5, this.alertLevel + 0.01);
                    }
                }
            });
        }
        
        // Trigger lockdown at max alert
        if (this.alertLevel >= 5 && !this.lockdownActive) {
            this.triggerLockdown();
        }
    }

    triggerLockdown() {
        this.lockdownActive = true;
        console.log('FACILITY LOCKDOWN INITIATED');
        
        // Seal all doors
        this.doors.forEach(door => {
            door.locked = true;
        });
        
        // Activate all security systems
        this.systems.security.turrets.forEach(turret => {
            turret.active = true;
        });
        
        // Release additional security bots
        for (let i = 0; i < 10; i++) {
            const bot = this.createSecurityBot();
            bot.position.set(
                (Math.random() - 0.5) * 100,
                0,
                (Math.random() - 0.5) * 100
            );
            this.scene.add(bot);
            this.securityBots.push(bot);
        }
        
        // Emergency lighting
        this.emergencyLights.forEach(light => {
            light.children[0].material.color.setHex(0xff0000);
        });
    }

    checkKeycardCollection() {
        if (!this.player) return;
        
        const playerPos = this.player.position || this.player.mesh.position;
        
        Object.keys(this.keycards).forEach(color => {
            const keycard = this.keycards[color];
            if (!keycard.found && keycard.mesh) {
                const distance = keycard.mesh.position.distanceTo(playerPos);
                if (distance < 2) {
                    keycard.found = true;
                    keycard.mesh.visible = false;
                    console.log(`Collected ${color} keycard`);
                    this.onKeycardCollected(color);
                }
            }
        });
    }

    onKeycardCollected(color) {
        // Unlock corresponding areas
        switch(color) {
            case 'red':
                this.labs.genetics.accessible = true;
                break;
            case 'blue':
                this.labs.weapons.accessible = true;
                break;
            case 'gold':
                this.labs.ai.accessible = true;
                break;
            case 'black':
                this.labs.dimensional.accessible = true;
                break;
        }
    }

    updateAlienAI(deltaTime) {
        this.alienSpecimens.forEach(alien => {
            if (!alien.mesh || !this.player) return;
            
            const playerPos = this.player.position || this.player.mesh.position;
            const alienPos = alien.mesh.position;
            const distance = alienPos.distanceTo(playerPos);
            
            switch(alien.state) {
                case 'roaming':
                    // Wander randomly
                    if (!alien.target || alienPos.distanceTo(alien.target) < 2) {
                        alien.target = new THREE.Vector3(
                            (Math.random() - 0.5) * 100,
                            0,
                            (Math.random() - 0.5) * 100
                        );
                    }
                    
                    const roamDir = new THREE.Vector3()
                        .subVectors(alien.target, alienPos)
                        .normalize();
                    alien.mesh.position.add(roamDir.multiplyScalar(alien.data.speed * deltaTime / 1000));
                    
                    // Detect player
                    if (distance < 20) {
                        alien.state = 'hunting';
                    }
                    break;
                    
                case 'hunting':
                    // Chase player
                    const huntDir = new THREE.Vector3()
                        .subVectors(playerPos, alienPos)
                        .normalize();
                    alien.mesh.position.add(huntDir.multiplyScalar(alien.data.speed * 1.5 * deltaTime / 1000));
                    
                    // Attack if close
                    if (distance < 3) {
                        if (this.player.takeDamage) {
                            this.player.takeDamage(30, "Security System");
                        }
                    }
                    
                    // Lose interest if far
                    if (distance > 40) {
                        alien.state = 'roaming';
                    }
                    break;
            }
        });
    }

    updateSecurityBots(deltaTime) {
        this.securityBots.forEach(bot => {
            if (!bot || !this.player) return;
            
            const playerPos = this.player.position || this.player.mesh.position;
            const botPos = bot.position;
            const distance = botPos.distanceTo(playerPos);
            
            // Patrol or engage based on alert level
            if (this.alertLevel > 2 && distance < 30) {
                // Engage player
                const direction = new THREE.Vector3()
                    .subVectors(playerPos, botPos)
                    .normalize();
                bot.position.add(direction.multiplyScalar(4 * deltaTime / 1000));
                
                // Fire lasers
                if (distance < 15 && Math.random() < 0.02) {
                    this.fireBotLaser(bot, playerPos);
                }
            }
        });
    }

    fireBotLaser(bot, targetPos) {
        // Create laser beam effect
        const distance = bot.position.distanceTo(targetPos);
        const beamGeometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        beam.position.copy(bot.position.clone().lerp(targetPos, 0.5));
        beam.lookAt(targetPos);
        beam.rotateX(Math.PI / 2);
        
        this.scene.add(beam);
        
        // Remove after short time
        setTimeout(() => {
            this.scene.remove(beam);
        }, 100);
        
        // Damage player
        if (this.player && this.player.takeDamage) {
            this.player.takeDamage(15, "Laser Grid");
        }
    }

    checkHazardDamage() {
        if (!this.player) return;
        
        const playerPos = this.player.position || this.player.mesh.position;
        
        // Check radiation zones
        this.radiationZones.forEach(zone => {
            const distance = zone.position.distanceTo(playerPos);
            if (distance < zone.userData.radius) {
                const damage = zone.userData.intensity === 'high' ? 10 :
                              zone.userData.intensity === 'medium' ? 5 : 2;
                if (this.player.takeDamage) {
                    this.player.takeDamage(damage, "Radiation Zone");
                }
            }
        });
    }

    updatePortals(deltaTime) {
        this.labs.dimensional.portals.forEach(portal => {
            if (!portal.mesh || !portal.mesh.userData.active) return;
            
            // Spawn entities from portals occasionally
            if (Math.random() < 0.001) {
                this.spawnFromPortal(portal);
            }
        });
    }

    spawnFromPortal(portal) {
        const destination = portal.destination;
        let enemy;
        
        switch(destination) {
            case 'hell':
                // Spawn demon
                console.log('Demon emerging from portal!');
                break;
            case 'void':
                // Spawn void creature
                console.log('Void entity emerging!');
                break;
            default:
                // Spawn random alien
                const alien = this.createAlienSpecimen({
                    type: 'unknown',
                    health: 200,
                    speed: 3,
                    psychic: true
                });
                alien.position.copy(portal.mesh.position);
                this.scene.add(alien);
                this.alienSpecimens.push({
                    mesh: alien,
                    data: { type: 'unknown' },
                    state: 'hunting'
                });
                break;
        }
    }

    createObjectives() {
        return [
            {
                id: 'collect_keycards',
                description: 'Collect all 4 security keycards',
                completed: false,
                progress: 0,
                total: 4
            },
            {
                id: 'access_mainframe',
                description: 'Access the central mainframe',
                completed: false
            },
            {
                id: 'download_data',
                description: 'Download classified research data',
                completed: false,
                progress: 0,
                total: 100
            },
            {
                id: 'shutdown_portals',
                description: 'Shut down dimensional portals',
                completed: false,
                optional: true
            },
            {
                id: 'escape',
                description: 'Escape the facility',
                completed: false,
                hidden: true
            }
        ];
    }

    // Additional helper methods (stubs for complex elements)
    createLabWalls(group) {
        // Implementation for lab walls
    }

    createLabEquipment(labName) {
        // Implementation for lab equipment
        return [];
    }

    createSpecimenContainers() {
        // Implementation for specimen containers
        return [];
    }

    createComputerTerminal(clearance) {
        const terminalGroup = new THREE.Group();
        
        const screenGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
        const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.y = 1.5;
        terminalGroup.add(screen);
        
        return terminalGroup;
    }

    createBiohazardWarnings(group) {
        // Implementation for biohazard warnings
    }

    createObservationPlatform() {
        // Implementation for observation platform
        return new THREE.Group();
    }

    createForceFieldGenerators() {
        // Implementation for force field generators
        return [];
    }

    createEmergencyConsole() {
        // Implementation for emergency console
        return new THREE.Group();
    }

    createTestingRange() {
        // Implementation for weapon testing range
        return new THREE.Group();
    }

    createWeaponDisplay(proto) {
        // Implementation for weapon display
        return new THREE.Group();
    }

    createAmmoFabricator() {
        // Implementation for ammo fabricator
        return new THREE.Group();
    }

    createTestDummy() {
        // Implementation for test dummy
        return new THREE.Group();
    }

    createServerRack() {
        // Implementation for server rack
        return new THREE.Group();
    }

    createMainframe() {
        // Implementation for mainframe
        return new THREE.Group();
    }

    createCoolingSystem() {
        // Implementation for cooling system
        return new THREE.Group();
    }

    createDataTerminal() {
        // Implementation for data terminal
        return new THREE.Group();
    }

    createHolographicDisplays(group) {
        // Implementation for holographic displays
    }

    createRealityStabilizer() {
        // Implementation for reality stabilizer
        return new THREE.Group();
    }

    createDimensionalWarnings(group) {
        // Implementation for dimensional warnings
    }

    createEmergencyLight() {
        const lightGroup = new THREE.Group();
        
        const lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
        const lightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        lightGroup.add(light);
        
        return lightGroup;
    }

    createVentilationNetwork() {
        // Implementation for ventilation network
    }

    createAlarmSystem() {
        // Implementation for alarm system
    }

    createSprinklerSystem() {
        // Implementation for sprinkler system
    }

    createSecurityCamera() {
        // Implementation for security camera
        return new THREE.Group();
    }

    createAutoTurrets() {
        // Implementation for auto turrets
    }

    createLaserGrids() {
        // Implementation for laser grids
    }

    createMotionSensors() {
        // Implementation for motion sensors
    }

    createRadiationZone(area) {
        const zoneGroup = new THREE.Group();
        
        const zoneGeometry = new THREE.SphereGeometry(area.radius, 16, 16);
        const zoneMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
        zoneGroup.add(zone);
        
        zoneGroup.userData = area;
        
        return zoneGroup;
    }

    createQuarantineZones() {
        // Implementation for quarantine zones
    }

    createChemicalHazards() {
        // Implementation for chemical hazards
    }

    createElectricalHazards() {
        // Implementation for electrical hazards
    }

    createSecurityMonitor() {
        // Implementation for security monitor
        return new THREE.Group();
    }

    createElevatorDoors() {
        // Implementation for elevator doors
        return new THREE.Group();
    }

    createEmergencyExits(group) {
        // Implementation for emergency exits
    }

    createContainedSpecimen() {
        // Implementation for contained specimen
        return new THREE.Group();
    }

    animateScanner(scanner) {
        const animate = () => {
            scanner.material.opacity = 0.2 + Math.sin(Date.now() * 0.01) * 0.1;
            requestAnimationFrame(animate);
        };
        animate();
    }

    updateContainment() {
        // Implementation for containment updates
    }
}
import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
// Laboratory Complex Level - Fixed version with connected rooms
// High-tech research facility with keycard access system

export class LaboratoryLevel extends BaseLevel {
    constructor(scene, game) {
        // Handle both old and new constructor signatures
        if (arguments.length === 1 && arguments[0].scene) {
            // New signature: (game)
            super(arguments[0]);
            this.game = arguments[0];
            this.scene = arguments[0].scene;
        } else {
            // Old signature: (scene, game)
            super(game);
            this.scene = scene;
            this.game = game;
        }
        
        this.levelName = 'Laboratory Complex';
        this.levelNumber = 3;
        
        // Storage arrays are already initialized in BaseLevel
        // walls, enemies, pickups, etc.
        this.pickups = [];
        this.doors = [];
        
        // Keycard system
        this.keycards = {
            red: false,
            blue: false,
            yellow: false
        };
        
        // Lab sections
        this.sections = {
            entrance: { unlocked: true },
            testing: { unlocked: false, requires: 'blue' },
            containment: { unlocked: false, requires: 'red' },
            research: { unlocked: false, requires: 'yellow' }
        };
    }
    
    create() {
        // Clear any existing level
        this.clearLevel();
        
        // Materials
        const concreteMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            roughness: 0.3,
            metalness: 0.8
        });
        
        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.1
        });
        
        // Create connected lab layout
        this.createConnectedLayout(concreteMaterial, glassMaterial, metalMaterial);
        
        // Add keycards
        this.spawnKeycards();
        
        // Add lighting
        this.createLaboratoryLighting();
        
        // Spawn initial enemies
        this.spawnInitialEnemies();
        
        // Set initial objective
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.setObjective("Find keycards to access different lab sections");
            this.game.narrativeSystem.displaySubtitle("Laboratory Complex - Find the research data");
        }
        
        // Return level data for collision system
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }
    
    createConnectedLayout(concreteMaterial, glassMaterial, metalMaterial) {
        // Create one large connected floor
        const mainFloor = new THREE.PlaneGeometry(80, 100);
        const floor = new THREE.Mesh(mainFloor, concreteMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -30);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Create ceiling
        const ceiling = new THREE.Mesh(mainFloor, concreteMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 4, -30);
        this.scene.add(ceiling);
        
        // Create outer walls
        this.createWall(-40, 2, -30, 0.5, 4, 100, concreteMaterial); // Left outer wall
        this.createWall(40, 2, -30, 0.5, 4, 100, concreteMaterial);  // Right outer wall
        this.createWall(0, 2, 20, 80, 4, 0.5, concreteMaterial);     // Front wall
        this.createWall(0, 2, -80, 80, 4, 0.5, concreteMaterial);    // Back wall
        
        // Create entrance opening in front wall
        this.createWall(-40, 2, 20, 35, 4, 0.5, concreteMaterial);   // Left of entrance
        this.createWall(40, 2, 20, 35, 4, 0.5, concreteMaterial);    // Right of entrance
        this.createWall(0, 3.5, 20, 10, 1, 0.5, concreteMaterial);   // Above entrance
        
        // Create main corridor down the middle with door openings (4 units wide)
        // Wall segments: createWall(x, y, z_center, width, height, depth)
        // Door positions: blue at z=-20, red at z=-30, yellow at z=-60
        
        // Left corridor wall with 4-unit gaps for doors
        // Wall 1: from entrance to blue door gap
        this.createWall(-5, 2, -1, 0.5, 4, 38, concreteMaterial);     // center at -1, extends from z=18 to z=-20
        // Gap from z=-20 to z=-24 for blue door
        // Wall 2: between blue and yellow doors  
        this.createWall(-5, 2, -42, 0.5, 4, 36, concreteMaterial);    // center at -42, extends from z=-24 to z=-60
        // Gap from z=-60 to z=-64 for yellow door
        // Wall 3: after yellow door
        this.createWall(-5, 2, -72, 0.5, 4, 16, concreteMaterial);    // center at -72, extends from z=-64 to z=-80
        
        // Right corridor wall with 4-unit gap for red door
        // Wall 1: from entrance to red door gap
        this.createWall(5, 2, -6, 0.5, 4, 48, concreteMaterial);      // center at -6, extends from z=18 to z=-30
        // Gap from z=-30 to z=-34 for red door
        // Wall 2: after red door
        this.createWall(5, 2, -57, 0.5, 4, 46, concreteMaterial);     // center at -57, extends from z=-34 to z=-80
        
        // Testing Lab (left side, around z=-20)
        this.createWall(-22.5, 2, -10, 35, 4, 0.5, concreteMaterial); // Testing lab front
        this.createWall(-22.5, 2, -30, 35, 4, 0.5, concreteMaterial); // Testing lab back
        
        // Containment Area (right side, around z=-30)  
        this.createWall(22.5, 2, -20, 35, 4, 0.5, concreteMaterial);  // Containment front
        this.createWall(22.5, 2, -40, 35, 4, 0.5, concreteMaterial);  // Containment back
        
        // Research Wing (left side, around z=-60)
        this.createWall(-22.5, 2, -50, 35, 4, 0.5, concreteMaterial); // Research front
        this.createWall(-22.5, 2, -70, 35, 4, 0.5, concreteMaterial); // Research back
        
        // Add doors centered in the gaps
        this.createVisualDoor(-5, 2, -22, 'blue', 'Testing Lab');     // Center of gap z=-20 to z=-24
        this.createVisualDoor(5, 2, -32, 'red', 'Containment');       // Center of gap z=-30 to z=-34
        this.createVisualDoor(-5, 2, -62, 'yellow', 'Research');      // Center of gap z=-60 to z=-64
        
        // Add room decorations
        this.decorateTestingLab(-22.5, -20, glassMaterial);
        this.decorateContainmentArea(22.5, -30, metalMaterial);
        this.decorateResearchWing(-22.5, -60, glassMaterial, metalMaterial);
        
        // Add reception desk near entrance
        const deskGeometry = new THREE.BoxGeometry(6, 1.5, 3);
        const desk = new THREE.Mesh(deskGeometry, concreteMaterial);
        desk.position.set(-8, 0.75, 10);
        desk.castShadow = true;
        this.scene.add(desk);
    }
    
    decorateTestingLab(centerX, centerZ, glassMaterial) {
        // Add specimen tubes
        for (let i = 0; i < 3; i++) {
            const tubeGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
            const tube = new THREE.Mesh(tubeGeometry, glassMaterial);
            tube.position.set(centerX - 5 + i * 3, 1.5, centerZ);
            tube.castShadow = true;
            this.scene.add(tube);
            
            // Specimen inside
            const specimenGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
            const specimenMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.2
            });
            const specimen = new THREE.Mesh(specimenGeometry, specimenMaterial);
            specimen.position.set(centerX - 5 + i * 3, 1.5, centerZ);
            this.scene.add(specimen);
        }
    }
    
    decorateContainmentArea(centerX, centerZ, metalMaterial) {
        // Add containment cells
        for (let i = 0; i < 4; i++) {
            const cellX = centerX - 8 + (i % 2) * 8;
            const cellZ = centerZ - 3 + Math.floor(i / 2) * 6;
            
            // Cell bars
            for (let j = 0; j < 5; j++) {
                const barGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3.5);
                const bar = new THREE.Mesh(barGeometry, metalMaterial);
                bar.position.set(cellX + j * 0.8 - 1.6, 1.75, cellZ);
                bar.castShadow = true;
                this.scene.add(bar);
            }
        }
    }
    
    decorateResearchWing(centerX, centerZ, glassMaterial, metalMaterial) {
        // Add lab benches
        for (let i = 0; i < 3; i++) {
            const benchGeometry = new THREE.BoxGeometry(8, 1, 2);
            const benchMaterial = new THREE.MeshStandardMaterial({
                color: 0x606060,
                roughness: 0.3,
                metalness: 0.8
            });
            const bench = new THREE.Mesh(benchGeometry, benchMaterial);
            bench.position.set(centerX, 0.5, centerZ - 5 + i * 4);
            bench.castShadow = true;
            this.scene.add(bench);
            
            // Equipment on benches
            const equipmentGeometry = new THREE.BoxGeometry(1, 0.8, 0.8);
            const equipment = new THREE.Mesh(equipmentGeometry, metalMaterial);
            equipment.position.set(centerX + (i - 1) * 2, 1.4, centerZ - 5 + i * 4);
            equipment.castShadow = true;
            this.scene.add(equipment);
        }
    }
    
    // createWall method is now inherited from BaseLevel
    
    createVisualDoor(x, y, z, keycard, label) {
        // Determine door orientation based on which wall it's in
        const isLeftWall = x < 0;  // Doors at x=-5 are in left wall
        const isRightWall = x > 0; // Doors at x=5 are in right wall
        
        // Create physical door that blocks access
        // For corridor walls, door should be thin in X direction, wide in Z direction
        const doorGeometry = new THREE.BoxGeometry(0.5, 4, 4);  // Swapped dimensions for proper orientation
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2,
            emissive: keycard === 'blue' ? 0x003366 : 
                     keycard === 'red' ? 0x660000 : 0x666600,
            emissiveIntensity: 0.2
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, y, z);
        door.castShadow = true;
        door.receiveShadow = true;
        this.scene.add(door);
        
        // Add door to walls array so it blocks movement (adjusted for new orientation)
        this.walls.push({
            mesh: door,
            min: new THREE.Vector3(x - 0.25, y - 2, z - 2),
            max: new THREE.Vector3(x + 0.25, y + 2, z + 2)
        });
        
        // Create keycard panel (positioned on the side of the door facing the corridor)
        const panelGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: keycard === 'blue' ? 0x0066cc : 
                   keycard === 'red' ? 0xcc0000 : 0xcccc00,
            emissive: keycard === 'blue' ? 0x0066cc : 
                     keycard === 'red' ? 0xcc0000 : 0xcccc00,
            emissiveIntensity: 0.3
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        // Position panel on corridor side of door
        const panelX = isLeftWall ? x + 0.3 : x - 0.3;  // Right side for left wall, left side for right wall
        panel.position.set(panelX, y, z + 2.3);
        this.scene.add(panel);
        
        // Store door info
        this.doors.push({
            mesh: door,
            position: new THREE.Vector3(x, y, z),
            keycard: keycard,
            label: label,
            panel: panel,
            locked: true,
            wallIndex: this.walls.length - 1  // Track wall index for removal
        });
        
        // Add indicator light
        const doorLight = new THREE.PointLight(
            keycard === 'blue' ? 0x0066cc : 
            keycard === 'red' ? 0xcc0000 : 0xcccc00, 
            0.3, 5
        );
        doorLight.position.set(x, y + 1, z);
        this.scene.add(doorLight);
        
        // Add "LOCKED" text indicator (on the corridor side)
        const lockedText = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            })
        );
        // Position text facing the corridor
        const textX = isLeftWall ? x + 0.3 : x - 0.3;
        lockedText.position.set(textX, y + 2.3, z);
        lockedText.rotation.y = isLeftWall ? Math.PI / 2 : -Math.PI / 2;  // Face the corridor
        lockedText.userData.isLockedIndicator = true;
        this.scene.add(lockedText);
        door.userData.lockedText = lockedText;
    }
    
    spawnKeycards() {
        // Place keycards in logical progression order without backtracking
        
        // Blue keycard first - in corridor before any doors
        this.createKeycard(0, 0.5, -10, 'blue');  // In corridor center, easily found first
        
        // Yellow keycard second - accessible after blue door, before needing yellow door
        this.createKeycard(-2, 0.5, -35, 'yellow');  // In corridor, between blue and yellow doors
        
        // Red keycard third - deeper in the facility
        this.createKeycard(2, 0.5, -45, 'red');  // In corridor, accessible after getting yellow
    }
    
    createKeycard(x, y, z, color) {
        const cardGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.6);
        const cardMaterial = new THREE.MeshStandardMaterial({
            color: color === 'blue' ? 0x0066cc : 
                   color === 'red' ? 0xcc0000 : 0xcccc00,
            metalness: 0.8,
            roughness: 0.2,
            emissive: color === 'blue' ? 0x0066cc : 
                     color === 'red' ? 0xcc0000 : 0xcccc00,
            emissiveIntensity: 0.8  // Increased glow
        });
        
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        card.position.set(x, y, z);
        card.castShadow = true;
        // Add brighter glow light
        const cardLight = new THREE.PointLight(
            color === 'blue' ? 0x0066cc : 
            color === 'red' ? 0xcc0000 : 0xcccc00,
            1.5, 10  // Much brighter and wider light
        );
        cardLight.position.set(x, y + 0.5, z);
        this.scene.add(cardLight);
        
        // Add a vertical beacon to make keycards easier to spot
        const beaconGeometry = new THREE.CylinderGeometry(0.05, 0.2, 4, 8);
        const beaconMaterial = new THREE.MeshBasicMaterial({
            color: color === 'blue' ? 0x0099ff : 
                   color === 'red' ? 0xff0000 : 0xffff00,
            transparent: true,
            opacity: 0.4
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.set(x, y + 2, z);
        this.scene.add(beacon);
        
        // Store references to light and beacon for removal
        card.userData = {
            isKeycard: true,
            color: color,
            collected: false,
            baseY: y,  // Store the base Y position for animation
            light: cardLight,  // Store light reference
            beacon: beacon     // Store beacon reference
        };
        this.scene.add(card);
        this.pickups.push(card);
    }
    
    createLaboratoryLighting() {
        // Main corridor lights - reduced intensity
        for (let z = 10; z >= -70; z -= 10) {
            const light = new THREE.PointLight(0xffffff, 0.3, 15);
            light.position.set(0, 3.5, z);
            light.castShadow = true;
            this.scene.add(light);
        }
        
        // Room lights - reduced intensity
        const roomLights = [
            { x: -22.5, z: -20 },  // Testing lab
            { x: 22.5, z: -30 },   // Containment
            { x: -22.5, z: -60 }   // Research
        ];
        
        roomLights.forEach(pos => {
            const light = new THREE.PointLight(0xffffff, 0.4, 20);
            light.position.set(pos.x, 3.5, pos.z);
            light.castShadow = true;
            this.scene.add(light);
        });
        
        // Ambient light - reduced intensity
        const ambient = new THREE.AmbientLight(0x404060, 0.2);
        this.scene.add(ambient);
        
        // Emergency red lights
        const emergencyLight1 = new THREE.PointLight(0xff0000, 0.3, 10);
        emergencyLight1.position.set(-10, 2, -40);
        this.scene.add(emergencyLight1);
        
        const emergencyLight2 = new THREE.PointLight(0xff0000, 0.3, 10);
        emergencyLight2.position.set(10, 2, -40);
        this.scene.add(emergencyLight2);
    }
    
    spawnInitialEnemies() {
        if (!this.game || !this.game.spawnEnemy) {
            console.warn('Cannot spawn enemies - game.spawnEnemy not available');
            return;
        }
        
        // Store enemy references for later updates
        // Player spawns at (0, 1.7, 0), so place enemies further into the facility
        const enemySpawns = [
            // Back of entrance area - give player space to orient
            { x: 15, y: 0, z: -15, type: 'possessed_scientist' },
            { x: -15, y: 0, z: -12, type: 'possessed_scientist' },
            
            // Main corridor - spread out through the facility
            { x: 0, y: 0, z: -25, type: 'possessed_scientist' },
            { x: 2, y: 0, z: -35, type: 'possessed_scientist' },  // Changed from hellhound
            { x: -2, y: 0, z: -45, type: 'possessed_scientist' },
            
            // Testing lab (left side room at z=-20)
            { x: -20, y: 0, z: -20, type: 'possessed_scientist' },
            { x: -25, y: 0, z: -18, type: 'possessed_scientist' },
            
            // Containment area (right side room at z=-30)
            { x: 20, y: 0, z: -30, type: 'hellhound' },  // Keep one hellhound here
            { x: 25, y: 0, z: -28, type: 'possessed_scientist' },
            
            // Research wing (left side at z=-60, far back)
            { x: -20, y: 0, z: -60, type: 'possessed_scientist' },
            { x: -25, y: 0, z: -58, type: 'possessed_scientist' },  // Changed from hellhound
            
            // Additional corridor patrols in back areas
            { x: 3, y: 0, z: -55, type: 'possessed_scientist' },
            { x: -3, y: 0, z: -65, type: 'hellhound' }  // Keep one at the end
        ];
        
        enemySpawns.forEach(spawn => {
            this.game.spawnEnemy(spawn.x, spawn.y, spawn.z, spawn.type);
        });
        
        // Store reference to game's enemy array for updates
        this.enemies = this.game.enemies;
    }
    
    checkKeycardCollection(playerPosition) {
        if (!playerPosition) return;
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            if (!pickup || pickup.userData.collected) continue;
            
            const distance = playerPosition.distanceTo(pickup.position);
            if (distance < 2) {
                if (pickup.userData.isKeycard) {
                    const color = pickup.userData.color;
                    this.keycards[color] = true;
                    pickup.userData.collected = true;
                    
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.displaySubtitle(`Collected ${color} keycard!`);
                        
                        // Update objective based on keycards collected
                        const collected = Object.values(this.keycards).filter(k => k).length;
                        if (collected === 3) {
                            this.game.narrativeSystem.setObjective("All keycards collected! Exit portal activated at the end of the facility!");
                            // Spawn exit portal
                            this.createExitPortal();
                        } else {
                            this.game.narrativeSystem.setObjective(`Find keycards (${collected}/3 collected)`);
                        }
                    }
                    
                    // Remove keycard, light, and beacon from scene
                    this.scene.remove(pickup);
                    if (pickup.userData.light) {
                        this.scene.remove(pickup.userData.light);
                    }
                    if (pickup.userData.beacon) {
                        this.scene.remove(pickup.userData.beacon);
                    }
                    this.pickups.splice(i, 1);
                    
                    // Update door visuals
                    this.unlockDoors(color);
                }
            }
        }
    }
    
    unlockDoors(keycardColor) {
        // Open physical doors and update visual indicators
        this.doors.forEach(door => {
            if (door.keycard === keycardColor && door.locked) {
                door.locked = false;
                
                // Remove door from scene (open it)
                if (door.mesh) {
                    // Animate door opening
                    const openDoor = () => {
                        if (door.mesh.position.y < door.position.y + 3) {
                            door.mesh.position.y += 0.05;
                            requestAnimationFrame(openDoor);
                        } else {
                            // Remove door completely
                            this.scene.remove(door.mesh);
                            // Remove from walls array to allow passage
                            if (door.wallIndex !== undefined && this.walls[door.wallIndex]) {
                                this.walls.splice(door.wallIndex, 1);
                                // Update other door wall indices
                                this.doors.forEach(d => {
                                    if (d.wallIndex > door.wallIndex) {
                                        d.wallIndex--;
                                    }
                                });
                            }
                        }
                    };
                    openDoor();
                    
                    // Remove locked text
                    if (door.mesh.userData.lockedText) {
                        this.scene.remove(door.mesh.userData.lockedText);
                    }
                }
                
                // Change panel color to green
                if (door.panel) {
                    door.panel.material.color.setHex(0x00ff00);
                    door.panel.material.emissive.setHex(0x00ff00);
                    door.panel.material.emissiveIntensity = 0.5;
                }
            }
        });
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle(`${keycardColor} security door opened!`);
        }
    }
    
    createExitPortal() {
        // Create a glowing exit portal at the end of the facility
        const portalGeometry = new THREE.RingGeometry(1, 3, 8);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        this.exitPortal = new THREE.Mesh(portalGeometry, portalMaterial);
        this.exitPortal.position.set(0, 2, -75); // At the far end of the facility
        this.exitPortal.rotation.x = Math.PI / 2;
        this.scene.add(this.exitPortal);
        
        // Add a bright light
        const portalLight = new THREE.PointLight(0x00ff00, 2, 20);
        portalLight.position.set(0, 2, -75);
        this.scene.add(portalLight);
        
        // Add inner glow
        const innerGeometry = new THREE.CircleGeometry(1, 8);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const innerGlow = new THREE.Mesh(innerGeometry, innerMaterial);
        innerGlow.position.set(0, 2, -74.9);
        this.scene.add(innerGlow);
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle("EXIT PORTAL ACTIVATED!");
        }
    }
    
    update(deltaTime) {
        // Update pickups animation
        const time = Date.now() * 0.002;
        this.pickups.forEach(pickup => {
            if (pickup && !pickup.userData.collected) {
                const baseY = pickup.userData.baseY || 0.5;
                pickup.position.y = baseY + Math.sin(time) * 0.2;
                pickup.rotation.y += 0.02;
            }
        });
        
        // Check keycard collection
        if (this.game && this.game.player) {
            this.checkKeycardCollection(this.game.player.position);
            
            // Check if player reached exit portal
            if (this.exitPortal) {
                const distance = this.game.player.position.distanceTo(this.exitPortal.position);
                if (distance < 3) {
                    // Level complete!
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.displaySubtitle("LEVEL COMPLETE!");
                        this.game.narrativeSystem.setObjective("Victory! Laboratory secured!");
                    }
                    
                    // Trigger level completion
                    if (this.game.completeLevel) {
                        this.game.completeLevel();
                    } else {
                        // Fallback: load next level
                        console.log('Laboratory level completed!');
                        setTimeout(() => {
                            if (this.game.loadLevel) {
                                this.game.loadLevel('containment'); // Load next level
                            }
                        }, 2000);
                    }
                    
                    // Remove portal to prevent multiple triggers
                    this.scene.remove(this.exitPortal);
                    this.exitPortal = null;
                }
            }
        }
        
        // Animate exit portal if it exists
        if (this.exitPortal) {
            this.exitPortal.rotation.z = time;
            // Pulse the portal
            const scale = 1 + Math.sin(time * 2) * 0.1;
            this.exitPortal.scale.set(scale, scale, 1);
        }
        
        // The enemies are updated by the game's main update loop
        // No need to update them here
    }
    
    clearLevel() {
        // Call parent cleanup to handle intervals, timeouts, walls, etc.
        if (super.cleanup) {
            super.cleanup();
        }
        
        // Additional laboratory-specific cleanup below
        
        // Clear pickups
        this.pickups.forEach(pickup => {
            this.scene.remove(pickup);
        });
        this.pickups = [];
        
        // Clear doors
        this.doors = [];
        
        // Clear exit portal if it exists
        if (this.exitPortal) {
            this.scene.remove(this.exitPortal);
            this.exitPortal = null;
        }
        
        // Reset keycards
        this.keycards = {
            red: false,
            blue: false,
            yellow: false
        };
    }
}
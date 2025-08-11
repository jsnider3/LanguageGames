// Laboratory Complex Level - Simplified working version
// High-tech research facility with keycard access system

export class LaboratoryLevel {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        this.levelName = 'Laboratory Complex';
        this.levelNumber = 3;
        
        // Storage arrays
        this.walls = [];
        this.enemies = [];
        this.pickups = [];
        
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
        
        // Create lab layout
        this.createEntrance(concreteMaterial, glassMaterial);
        this.createMainCorridor(concreteMaterial);
        this.createTestingLab(concreteMaterial, glassMaterial);
        this.createContainmentArea(concreteMaterial, metalMaterial);
        this.createResearchWing(concreteMaterial, glassMaterial);
        this.createExitArea(concreteMaterial);
        
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
        
        // Return level data
        return {
            walls: this.walls,
            enemies: this.enemies
        };
    }
    
    createEntrance(concreteMaterial, glassMaterial) {
        // Reception area floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floor = new THREE.Mesh(floorGeometry, concreteMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, concreteMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 4, 0);
        this.scene.add(ceiling);
        
        // Walls
        this.createWall(-10, 2, 0, 0.5, 4, 20, concreteMaterial); // Left
        this.createWall(10, 2, 0, 0.5, 4, 20, concreteMaterial);  // Right
        this.createWall(0, 2, 10, 20, 4, 0.5, concreteMaterial);  // Back
        
        // Front wall with entrance
        this.createWall(-7.5, 2, -10, 5, 4, 0.5, concreteMaterial);  // Left of entrance
        this.createWall(7.5, 2, -10, 5, 4, 0.5, concreteMaterial);   // Right of entrance
        this.createWall(0, 3.5, -10, 5, 1, 0.5, concreteMaterial);   // Above entrance
        
        // Reception desk
        const deskGeometry = new THREE.BoxGeometry(6, 1.5, 3);
        const desk = new THREE.Mesh(deskGeometry, concreteMaterial);
        desk.position.set(-5, 0.75, 0);
        desk.castShadow = true;
        this.scene.add(desk);
        
        // Computer terminals - create a local metalMaterial
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            roughness: 0.3,
            metalness: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const terminalGeometry = new THREE.BoxGeometry(0.8, 1, 0.6);
            const terminal = new THREE.Mesh(terminalGeometry, metalMaterial);
            terminal.position.set(-6 + i * 2, 1.75, 0);
            terminal.castShadow = true;
            this.scene.add(terminal);
        }
    }
    
    createMainCorridor(material) {
        // Long hallway connecting all sections
        const corridorFloor = new THREE.PlaneGeometry(8, 60);
        const floor = new THREE.Mesh(corridorFloor, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -40);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(corridorFloor, material);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3, -40);
        this.scene.add(ceiling);
        
        // Walls
        this.createWall(-4, 1.5, -40, 0.5, 3, 60, material);  // Left wall
        this.createWall(4, 1.5, -40, 0.5, 3, 60, material);   // Right wall
        
        // Doors to different sections (simplified - no actual keycard system for now)
        this.createDoor(-4, 1.5, -20, 'blue', 'Testing Lab');
        this.createDoor(4, 1.5, -30, 'red', 'Containment');
        this.createDoor(-4, 1.5, -50, 'yellow', 'Research');
    }
    
    createTestingLab(concreteMaterial, glassMaterial) {
        // Testing chamber
        const labFloor = new THREE.PlaneGeometry(20, 15);
        const floor = new THREE.Mesh(labFloor, concreteMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(-15, 0, -20);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(labFloor, concreteMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(-15, 4, -20);
        this.scene.add(ceiling);
        
        // Walls
        this.createWall(-25, 2, -20, 0.5, 4, 15, concreteMaterial);  // Left
        this.createWall(-15, 2, -27.5, 20, 4, 0.5, concreteMaterial); // Back
        this.createWall(-15, 2, -12.5, 20, 4, 0.5, concreteMaterial); // Front
        // Right wall has door opening
        
        // Test equipment - specimen tubes
        for (let i = 0; i < 3; i++) {
            const tubeGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
            const tube = new THREE.Mesh(tubeGeometry, glassMaterial);
            tube.position.set(-20 + i * 3, 1.5, -20);
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
            specimen.position.set(-20 + i * 3, 1.5, -20);
            this.scene.add(specimen);
        }
    }
    
    createContainmentArea(concreteMaterial, metalMaterial) {
        // Containment cells
        const containmentFloor = new THREE.PlaneGeometry(20, 20);
        const floor = new THREE.Mesh(containmentFloor, concreteMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(15, 0, -30);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(containmentFloor, concreteMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(15, 4, -30);
        this.scene.add(ceiling);
        
        // Walls
        this.createWall(25, 2, -30, 0.5, 4, 20, concreteMaterial);   // Right
        this.createWall(15, 2, -40, 20, 4, 0.5, concreteMaterial);   // Back
        this.createWall(15, 2, -20, 20, 4, 0.5, concreteMaterial);   // Front
        // Left wall has door opening
        
        // Containment cells
        for (let i = 0; i < 4; i++) {
            const cellX = 10 + (i % 2) * 8;
            const cellZ = -25 - Math.floor(i / 2) * 8;
            
            // Cell bars
            for (let j = 0; j < 5; j++) {
                const barGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3.5);
                const bar = new THREE.Mesh(barGeometry, metalMaterial);
                bar.position.set(cellX + j * 0.8, 1.75, cellZ);
                bar.castShadow = true;
                this.scene.add(bar);
            }
        }
    }
    
    createResearchWing(concreteMaterial, glassMaterial) {
        // Research laboratory
        const researchFloor = new THREE.PlaneGeometry(25, 20);
        const floor = new THREE.Mesh(researchFloor, concreteMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(-17.5, 0, -50);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(researchFloor, concreteMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(-17.5, 4, -50);
        this.scene.add(ceiling);
        
        // Walls
        this.createWall(-30, 2, -50, 0.5, 4, 20, concreteMaterial);  // Left
        this.createWall(-17.5, 2, -60, 25, 4, 0.5, concreteMaterial); // Back
        this.createWall(-17.5, 2, -40, 25, 4, 0.5, concreteMaterial); // Front
        // Right wall has door opening
        
        // Lab benches
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            roughness: 0.3,
            metalness: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const benchGeometry = new THREE.BoxGeometry(8, 1, 2);
            const bench = new THREE.Mesh(benchGeometry, concreteMaterial);
            bench.position.set(-20, 0.5, -45 - i * 4);
            bench.castShadow = true;
            this.scene.add(bench);
            
            // Equipment on benches
            const equipmentGeometry = new THREE.BoxGeometry(1, 0.8, 0.8);
            const equipment = new THREE.Mesh(equipmentGeometry, metalMaterial);
            equipment.position.set(-20 + (i - 1) * 2, 1.4, -45 - i * 4);
            equipment.castShadow = true;
            this.scene.add(equipment);
        }
    }
    
    createExitArea(material) {
        // Exit corridor
        const exitFloor = new THREE.PlaneGeometry(10, 10);
        const floor = new THREE.Mesh(exitFloor, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -75);
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(exitFloor, material);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 3, -75);
        this.scene.add(ceiling);
        
        // Walls
        this.createWall(-5, 1.5, -75, 0.5, 3, 10, material);  // Left
        this.createWall(5, 1.5, -75, 0.5, 3, 10, material);   // Right
        
        // Exit door
        this.createExitDoor(0, 1.5, -80);
    }
    
    createWall(x, y, z, width, height, depth, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
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
    }
    
    createDoor(x, y, z, keycard, label) {
        const doorGeometry = new THREE.BoxGeometry(0.2, 3, 3);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: keycard === 'blue' ? 0x0066cc : 
                   keycard === 'red' ? 0xcc0000 : 0xcccc00,
            metalness: 0.7,
            roughness: 0.3,
            emissive: keycard === 'blue' ? 0x0066cc : 
                     keycard === 'red' ? 0xcc0000 : 0xcccc00,
            emissiveIntensity: 0.3
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, y, z);
        door.castShadow = true;
        door.userData = {
            isDoor: true,
            keycard: keycard,
            label: label,
            locked: true
        };
        this.scene.add(door);
        
        // Add a light to make the door visible
        const doorLight = new THREE.PointLight(
            keycard === 'blue' ? 0x0066cc : 
            keycard === 'red' ? 0xcc0000 : 0xcccc00, 
            0.5, 5
        );
        doorLight.position.set(x, y + 1, z);
        this.scene.add(doorLight);
    }
    
    createExitDoor(x, y, z) {
        const doorGeometry = new THREE.BoxGeometry(4, 3, 0.5);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, y, z);
        door.castShadow = true;
        door.userData = {
            isExitDoor: true,
            locked: false
        };
        this.scene.add(door);
        this.exitDoor = door;
        
        // Add bright light
        const exitLight = new THREE.PointLight(0x00ff00, 1, 10);
        exitLight.position.set(x, y, z + 2);
        this.scene.add(exitLight);
    }
    
    spawnKeycards() {
        // Blue keycard in testing lab
        this.createKeycard(-15, 1, -25, 'blue');
        
        // Red keycard in research wing
        this.createKeycard(-25, 1, -55, 'red');
        
        // Yellow keycard in containment
        this.createKeycard(20, 1, -35, 'yellow');
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
            emissiveIntensity: 0.5
        });
        
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        card.position.set(x, y, z);
        card.castShadow = true;
        card.userData = {
            isKeycard: true,
            color: color,
            collected: false
        };
        this.scene.add(card);
        this.pickups.push(card);
        
        // Add glow light
        const cardLight = new THREE.PointLight(
            color === 'blue' ? 0x0066cc : 
            color === 'red' ? 0xcc0000 : 0xcccc00,
            0.5, 3
        );
        cardLight.position.set(x, y + 0.5, z);
        this.scene.add(cardLight);
    }
    
    createLaboratoryLighting() {
        // Main lights
        const positions = [
            { x: 0, z: 0 },       // Entrance
            { x: 0, z: -20 },     // Corridor 1
            { x: 0, z: -40 },     // Corridor 2
            { x: 0, z: -60 },     // Corridor 3
            { x: -15, z: -20 },   // Testing lab
            { x: 15, z: -30 },    // Containment
            { x: -17.5, z: -50 }, // Research
            { x: 0, z: -75 }      // Exit
        ];
        
        positions.forEach(pos => {
            const light = new THREE.PointLight(0xffffff, 0.8, 20);
            light.position.set(pos.x, 3.5, pos.z);
            light.castShadow = true;
            this.scene.add(light);
        });
        
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404060, 0.3);
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
        if (this.game && this.game.spawnEnemy) {
            // Entrance enemies
            this.game.spawnEnemy(5, 0, 5, 'possessed_scientist');
            
            // Corridor patrol
            this.game.spawnEnemy(0, 0, -20, 'possessed_scientist');
            this.game.spawnEnemy(0, 0, -40, 'possessed_scientist');
            
            // Testing lab
            this.game.spawnEnemy(-15, 0, -20, 'possessed_scientist');
            this.game.spawnEnemy(-20, 0, -22, 'possessed_scientist');
            
            // Containment area - more dangerous
            this.game.spawnEnemy(15, 0, -30, 'hellhound');
            this.game.spawnEnemy(20, 0, -35, 'possessed_scientist');
            
            // Research wing
            this.game.spawnEnemy(-20, 0, -50, 'possessed_scientist');
            this.game.spawnEnemy(-25, 0, -52, 'hellhound');
        }
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
                            this.game.narrativeSystem.setObjective("All keycards collected! Head to the exit!");
                        } else {
                            this.game.narrativeSystem.setObjective(`Find keycards (${collected}/3 collected)`);
                        }
                    }
                    
                    // Remove from scene
                    this.scene.remove(pickup);
                    this.pickups.splice(i, 1);
                    
                    // Unlock corresponding doors
                    this.unlockDoors(color);
                }
            }
        }
    }
    
    unlockDoors(keycardColor) {
        // In a real implementation, this would unlock the appropriate doors
        // For now, just log it
        console.log(`Unlocked ${keycardColor} doors`);
        
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle(`${keycardColor} doors unlocked!`);
        }
    }
    
    checkExitCollision(player) {
        if (!player || !player.position || !this.exitDoor) return false;
        
        const playerZ = player.position.z;
        const playerX = player.position.x;
        
        // Check if player has reached the exit
        if (playerZ < -78 && Math.abs(playerX) < 3) {
            // Check if all keycards are collected
            const allKeycards = Object.values(this.keycards).every(k => k);
            if (allKeycards) {
                console.log('Laboratory level complete!');
                return true;
            } else {
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle("Need all keycards to exit!");
                }
            }
        }
        
        return false;
    }
    
    update(deltaTime) {
        // Update pickups animation
        const time = Date.now() * 0.002;
        this.pickups.forEach(pickup => {
            if (pickup && !pickup.userData.collected) {
                pickup.position.y = 1 + Math.sin(time) * 0.2;
                pickup.rotation.y += 0.02;
            }
        });
        
        // Check keycard collection
        if (this.game && this.game.player) {
            this.checkKeycardCollection(this.game.player.position);
        }
    }
    
    clearLevel() {
        // Remove all level geometry
        this.walls.forEach(wall => {
            if (wall.mesh) {
                this.scene.remove(wall.mesh);
            }
        });
        this.walls = [];
        
        // Clear pickups
        this.pickups.forEach(pickup => {
            this.scene.remove(pickup);
        });
        this.pickups = [];
        
        // Reset keycards
        this.keycards = {
            red: false,
            blue: false,
            yellow: false
        };
    }
}
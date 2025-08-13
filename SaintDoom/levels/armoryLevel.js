import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { THEME } from '../modules/config/theme.js';
// Chapter 2 - The Armory
// Deep underground weapons cache with demonic infestation

export class ArmoryLevel extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;
        
        this.levelNumber = 2;  // Chapter 2
        this.levelName = "The Armory";
        this.armoryReached = false;
        this.weaponsCollected = 0;
        this.collectedWeapons = [];  // Track specific collected weapons
        this.doorOpened = false;
        // pickups and walls are already initialized in BaseLevel
    }
    
    create() {
        // Clear any existing level
        this.clearLevel();
        
        // Materials
        const concreteMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.wall.armory,
            roughness: 0.95,
            metalness: 0.05
        });
        
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.metal.dark,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: THEME.items.keycards.yellow,
            emissive: THEME.items.keycards.yellow,
            emissiveIntensity: 0.1
        });
        
        // Create entry corridor from chapel
        this.createEntryCorridor(concreteMaterial);
        
        // Create connecting corridor from entry to armory
        this.createConnectingCorridor(concreteMaterial);
        
        // Create main armory room
        this.createArmoryRoom(-20, concreteMaterial, metalMaterial);
        
        // Create weapons storage areas
        this.createWeaponRacks(-20, metalMaterial);
        
        // Create exit connecting corridor
        this.createExitConnectingCorridor(concreteMaterial);
        
        // Create final exit area
        this.createExitArea(concreteMaterial);
        
        // Add boundary walls to prevent walking out of level
        this.createBoundaryWalls(concreteMaterial);
        
        // Add lighting
        this.addLighting();
        
        // Add environmental details
        this.addEnvironmentalDetails(warningMaterial);

        // Add instanced decorations for performance (single draw per type)
        this.addInstancedDecorations();
        
        // Spawn initial enemies
        this.spawnArmoryEnemies();
        
        return this.walls;
    }

    addInstancedDecorations() {
        if (!this.game || !this.game.geometryBatcher) return;
        const positions = [];
        const cratePositions = [];
        // Place barrels along the armory room perimeter (avoid blocking paths)
        const z = -20; // armory room center Z
        for (let x = -12; x <= 12; x += 4) {
            positions.push(new THREE.Vector3(x, 0.5, z - 13.5)); // back wall row
        }
        for (let x = -12; x <= 12; x += 4) {
            positions.push(new THREE.Vector3(x, 0.5, z + 13.5)); // front row
        }
        // Crates near corners
        cratePositions.push(new THREE.Vector3(-13, 0.5, z - 13));
        cratePositions.push(new THREE.Vector3(13, 0.5, z - 13));
        cratePositions.push(new THREE.Vector3(-13, 0.5, z + 13));
        cratePositions.push(new THREE.Vector3(13, 0.5, z + 13));

        // Create instanced meshes (barrels and crates)
        this.game.geometryBatcher.createInstancedDecorations('barrel', positions);
        this.game.geometryBatcher.createInstancedDecorations('crate', cratePositions);
    }
    
    createEntryCorridor(material) {
        // Entry from chapel (z = 10 to z = -5)
        const corridorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 15),
            material
        );
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(0, 0, 2.5);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);
        
        // Ceiling
        const corridorCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 15),
            material
        );
        corridorCeiling.rotation.x = Math.PI / 2;
        corridorCeiling.position.set(0, 3, 2.5);
        this.scene.add(corridorCeiling);
        
        // Walls (thicker to prevent clipping)
        this.createWall(-3, 1.5, 2.5, 1, 3, 15, material);  // Left wall (thicker)
        this.createWall(3, 1.5, 2.5, 1, 3, 15, material);   // Right wall (thicker)
        
        // Entry door frame (connects to chapel door) - with door opening
        // Left side of door frame
        this.createWall(-2, 1.5, 10, 2, 3, 0.5, material);
        // Right side of door frame  
        this.createWall(2, 1.5, 10, 2, 3, 0.5, material);
        // Top of door frame
        this.createWall(0, 2.75, 10, 2, 0.5, 0.5, material);
        
        // Add wall behind door to prevent walking into void
        this.createWall(0, 1.5, 10.5, 2, 3, 0.2, material);
        
        // Create door from chapel (visible in the opening)
        this.createDoor(0, 1.5, 9.8, 'fromChapel');
    }
    
    createConnectingCorridor(material) {
        // Connecting corridor from entry to armory (z = -5 to z = -5)
        const corridorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 10),
            material
        );
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(0, 0, -10);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);
        
        // Ceiling
        const corridorCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 10),
            material
        );
        corridorCeiling.rotation.x = Math.PI / 2;
        corridorCeiling.position.set(0, 3, -10);
        this.scene.add(corridorCeiling);
        
        // Walls (thicker to prevent clipping)
        this.createWall(-3, 1.5, -10, 1, 3, 10, material);  // Left wall (thicker)
        this.createWall(3, 1.5, -10, 1, 3, 10, material);   // Right wall (thicker)
    }

    createArmoryRoom(z, concreteMaterial, metalMaterial) {
        // Large armory room (30x30)
        const armoryFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            concreteMaterial
        );
        armoryFloor.rotation.x = -Math.PI / 2;
        armoryFloor.position.set(0, 0, z);
        armoryFloor.receiveShadow = true;
        this.scene.add(armoryFloor);
        
        // Higher ceiling for armory
        const armoryCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            concreteMaterial
        );
        armoryCeiling.rotation.x = Math.PI / 2;
        armoryCeiling.position.set(0, 5, z);
        this.scene.add(armoryCeiling);
        
        // Walls (thicker to prevent clipping)
        this.createWall(-15, 2.5, z, 1, 5, 30, concreteMaterial);  // Left (thicker)
        this.createWall(15, 2.5, z, 1, 5, 30, concreteMaterial);   // Right (thicker)
        // Back wall with exit opening (6-unit wide gap for hallway from x=-3 to x=3)
        this.createWall(-9, 2.5, z - 15, 12, 5, 1, concreteMaterial); // Left of exit (ends at x=-3)
        this.createWall(9, 2.5, z - 15, 12, 5, 1, concreteMaterial);  // Right of exit (starts at x=3)
        this.createWall(0, 4, z - 15, 6, 2, 1, concreteMaterial);     // Above exit (6 units wide)
        
        // Front wall with entrance from connecting corridor (thicker)
        // Left of entrance
        this.createWall(-9, 2.5, z + 15, 12, 5, 1, concreteMaterial);
        // Right of entrance  
        this.createWall(9, 2.5, z + 15, 12, 5, 1, concreteMaterial);
        // Above entrance
        this.createWall(0, 4, z + 15, 6, 2, 1, concreteMaterial);
        
        // Support pillars
        for (let x = -10; x <= 10; x += 10) {
            for (let dz = -10; dz <= 10; dz += 10) {
                if (x !== 0 || dz !== 0) {  // Skip center
                    this.createWall(x, 2.5, z + dz, 1, 5, 1, metalMaterial);
                }
            }
        }
        
        // Central weapons cache (locked initially)
        this.createCentralCache(0, z, metalMaterial);
    }
    
    createWeaponRacks(z, metalMaterial) {
        // Wall-mounted weapon racks
        const rackPositions = [
            { x: -14, z: z - 5 },
            { x: -14, z: z + 5 },
            { x: 14, z: z - 5 },
            { x: 14, z: z + 5 }
        ];
        
        rackPositions.forEach(pos => {
            // Rack frame
            const rack = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 3, 4),
                metalMaterial
            );
            rack.position.set(pos.x, 1.5, pos.z);
            rack.castShadow = true;
            this.scene.add(rack);
            
            // Weapon pickup spawn points
            this.createWeaponPickup(pos.x + (pos.x > 0 ? -1 : 1), 1, pos.z);
        });
    }
    
    createWeaponPickup(x, y, z) {
        // Random weapon type
        const weapons = ['shotgun', 'rifle', 'pistol', 'ammo'];
        const weaponType = weapons[Math.floor(Math.random() * weapons.length)];
        
        // Create more realistic weapon visuals
        const pickupGroup = new THREE.Group();
        
        if (weaponType === 'shotgun') {
            // Create shotgun shape
            const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
            const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.8 }));
            barrel.rotation.z = Math.PI / 2;
            pickupGroup.add(barrel);
            
            const stockGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.1);
            const stock = new THREE.Mesh(stockGeometry, new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
            stock.position.x = -0.4;
            pickupGroup.add(stock);
        } else if (weaponType === 'rifle') {
            // Create rifle shape
            const barrelGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6);
            const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshStandardMaterial({ color: 0x202020, metalness: 0.9 }));
            barrel.rotation.z = Math.PI / 2;
            pickupGroup.add(barrel);
            
            const magazineGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.08);
            const magazine = new THREE.Mesh(magazineGeometry, new THREE.MeshStandardMaterial({ color: 0x303030 }));
            magazine.position.y = -0.15;
            pickupGroup.add(magazine);
        } else if (weaponType === 'pistol') {
            // Create pistol shape
            const barrelGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.05);
            const barrel = new THREE.Mesh(barrelGeometry, new THREE.MeshStandardMaterial({ color: 0x303030, metalness: 0.7 }));
            pickupGroup.add(barrel);
            
            const gripGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.05);
            const grip = new THREE.Mesh(gripGeometry, new THREE.MeshStandardMaterial({ color: 0x101010 }));
            grip.position.set(-0.15, -0.15, 0);
            pickupGroup.add(grip);
        } else if (weaponType === 'ammo') {
            // Create ammo box
            const boxGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
            const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a2e, roughness: 0.8 });
            const ammoBox = new THREE.Mesh(boxGeometry, boxMaterial);
            pickupGroup.add(ammoBox);
            
            // Add brass color detail
            const labelGeometry = new THREE.BoxGeometry(0.25, 0.01, 0.15);
            const labelMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6 });
            const label = new THREE.Mesh(labelGeometry, labelMaterial);
            label.position.y = 0.11;
            pickupGroup.add(label);
        }
        
        // Add glow effect
        const glowColor = weaponType === 'ammo' ? 0xffaa00 : 0x00aaff;
        const glowLight = new THREE.PointLight(glowColor, 0.5, 3);
        pickupGroup.add(glowLight);
        
        pickupGroup.position.set(x, y, z);
        pickupGroup.userData = { 
            isPickup: true, 
            type: weaponType,
            collected: false
        };
        
        // Store animation data instead of creating recursive animation
        pickupGroup.userData.baseY = y;
        pickupGroup.userData.animationTime = Math.random() * Math.PI * 2; // Random phase offset
        
        this.scene.add(pickupGroup);
        // Add to pickups array for efficient tracking
        this.pickups.push(pickupGroup);
    }
    
    createCentralCache(x, z, metalMaterial) {
        // Central weapons cache (contains holy weapons)
        const cacheGeometry = new THREE.BoxGeometry(4, 2, 4);
        const cache = new THREE.Mesh(cacheGeometry, metalMaterial);
        cache.position.set(x, 1, z);
        cache.castShadow = true;
        cache.userData = { 
            isCache: true,
            locked: true
        };
        this.scene.add(cache);
        
        // Lock indicator
        const lockGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const lockMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const lock = new THREE.Mesh(lockGeometry, lockMaterial);
        lock.position.set(x, 2.2, z);
        this.scene.add(lock);
        this.cacheLock = lock;
    }
    
    createExitConnectingCorridor(material) {
        // Connecting corridor from armory to exit (z = -35 to z = -40)
        const corridorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 10),
            material
        );
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(0, 0, -37.5);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);
        
        // Ceiling
        const corridorCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 10),
            material
        );
        corridorCeiling.rotation.x = Math.PI / 2;
        corridorCeiling.position.set(0, 3, -37.5);
        this.scene.add(corridorCeiling);
        
        // Walls
        this.createWall(-3, 1.5, -37.5, 0.5, 3, 10, material);  // Left wall
        this.createWall(3, 1.5, -37.5, 0.5, 3, 10, material);   // Right wall
    }

    createExitArea(material) {
        // Final exit area with the green door
        const exitFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 10),
            material
        );
        exitFloor.rotation.x = -Math.PI / 2;
        exitFloor.position.set(0, 0, -47);
        exitFloor.receiveShadow = true;
        this.scene.add(exitFloor);
        
        // Ceiling
        const exitCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 10),
            material
        );
        exitCeiling.rotation.x = Math.PI / 2;
        exitCeiling.position.set(0, 3, -47);
        this.scene.add(exitCeiling);
        
        // Walls
        this.createWall(-4, 1.5, -47, 0.5, 3, 10, material);  // Left
        this.createWall(4, 1.5, -47, 0.5, 3, 10, material);   // Right
        
        // Back wall is at the end of exit area (z=-52)
        // Create wall sections around door opening
        this.createWall(-3, 1.5, -52, 2, 3, 0.5, material);   // Left of door
        this.createWall(3, 1.5, -52, 2, 3, 0.5, material);    // Right of door
        this.createWall(0, 4, -52, 6, 2, 0.5, material);      // Above door
        
        // Sealed door flush with back wall at z=-52
        this.createSealedDoor(0, 1.5, -51.5);  // Slightly in front of wall to be visible
        
        // Add arrow pointing down at the door
        const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);  // Made it 8-sided for smoother look
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00
            // Removed emissive properties - MeshBasicMaterial doesn't support them
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(0, 4, -50);  // Position above and in front of door
        arrow.rotation.x = Math.PI;  // Point downward
        this.scene.add(arrow);
        this.exitArrow = arrow;
    }
    
    createDoor(x, y, z, type) {
        const doorGeometry = new THREE.BoxGeometry(2, 3, 0.3);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, y, z);
        door.userData = { 
            isDoor: true,
            type: type,
            open: false
        };
        
        this.scene.add(door);
        
        if (type === 'fromChapel') {
            this.chapelDoor = door;
            // Make door blue to indicate it's a return path
            door.material.color.setHex(0x4444ff);
            door.material.emissive = new THREE.Color(0x0000ff);
            door.material.emissiveIntensity = 0.2;
            door.userData.targetLevel = 'chapel'; // Goes back to chapel
            
            // Add door to walls for collision detection
            this.walls.push(door);
        }
    }
    
    createSealedDoor(x, y, z) {
        // Create realistic elevator doors
        const elevatorGroup = new THREE.Group();
        
        // Elevator frame (metallic border)
        const frameGeometry = new THREE.BoxGeometry(5, 4, 0.4);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.8,
            roughness: 0.2
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, y, z);
        elevatorGroup.add(frame);
        
        // Cut out center for doors
        const cutoutGeometry = new THREE.BoxGeometry(4.2, 3.2, 0.5);
        const cutoutMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000
        });
        const cutout = new THREE.Mesh(cutoutGeometry, cutoutMaterial);
        cutout.position.set(x, y, z);
        elevatorGroup.add(cutout);
        
        // Left elevator door
        const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(x - 1, y, z + 0.2);
        elevatorGroup.add(leftDoor);
        this.leftDoor = leftDoor;
        
        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial.clone());
        rightDoor.position.set(x + 1, y, z + 0.2);
        elevatorGroup.add(rightDoor);
        this.rightDoor = rightDoor;
        
        // Elevator call button panel
        const panelGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.1);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.6
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(x + 3, y, z);
        elevatorGroup.add(panel);
        
        // Call button (red when locked)
        const buttonGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
        const buttonMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.rotation.x = Math.PI / 2;
        button.position.set(x + 3, y, z + 0.1);
        elevatorGroup.add(button);
        this.elevatorButton = button;
        
        // Floor indicator above doors
        const displayGeometry = new THREE.BoxGeometry(1.5, 0.4, 0.1);
        const displayMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x330000,
            emissiveIntensity: 0.3
        });
        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(x, y + 2.5, z + 0.2);
        elevatorGroup.add(display);
        this.elevatorDisplay = display;
        
        // "FREIGHT ELEVATOR" sign
        const signGeometry = new THREE.PlaneGeometry(3, 0.5);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.4,
            roughness: 0.6
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(x, y + 3.2, z + 0.3);
        elevatorGroup.add(sign);
        
        // Add back wall inside elevator shaft to prevent walking through
        const backWallGeometry = new THREE.BoxGeometry(4.8, 3.8, 0.2);
        const backWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.4,
            roughness: 0.7
        });
        const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
        backWall.position.set(x, y, z - 2);  // Place it 2 units behind the doors
        elevatorGroup.add(backWall);
        
        // Add collision wall to physically block passage
        this.createWall(x, y, z - 2, 4.8, 3.8, 0.2, backWallMaterial);
        
        // Interior lighting (dim initially)
        const elevatorLight = new THREE.PointLight(0xffff99, 0.2, 6);
        elevatorLight.position.set(x, y + 1, z + 1);
        this.scene.add(elevatorLight);
        this.doorLight = elevatorLight;
        
        this.scene.add(elevatorGroup);
        this.elevatorGroup = elevatorGroup;
        
        // Use left door as main collision reference
        this.sealedDoor = leftDoor;
        leftDoor.userData = { 
            isSealedDoor: true,
            isExitDoor: true,
            locked: true
        };
        rightDoor.userData = { 
            isSealedDoor: true,
            isExitDoor: true,
            locked: true
        };
    }
    
    // createWall method is now inherited from BaseLevel
    
    addLighting() {
        // Flickering fluorescent lights throughout the facility
        const positions = [
            { x: 0, z: 2 },      // Entry corridor
            { x: 0, z: -10 },    // Connecting corridor 1
            { x: 0, z: -20 },    // Main armory
            { x: -10, z: -20 },  // Armory left
            { x: 10, z: -20 },   // Armory right
            { x: 0, z: -37 },    // Connecting corridor 2
            { x: 0, z: -47 }     // Exit area
        ];
        
        positions.forEach((pos, index) => {
            const light = new THREE.PointLight(0xccccff, 0.8, 15);
            light.position.set(pos.x, 4, pos.z);
            // Only enable shadows for first 2 lights to improve performance
            if (index < 2) {
                light.castShadow = true;
            }
            this.scene.add(light);
            
            // Store flickering lights for animation in update loop instead of setInterval
            if (Math.random() > 0.7) {  // Reduce number of flickering lights
                light.userData.flicker = true;
                light.userData.flickerSpeed = 100 + Math.random() * 500;
                light.userData.lastFlicker = Date.now();
            }
        });
        
        // Emergency red lighting at exit
        const emergencyLight = new THREE.PointLight(0xff0000, 0.3, 20);
        emergencyLight.position.set(0, 2, -47);  // In exit area
        this.scene.add(emergencyLight);
        
        // Bright light on the green exit door
        const exitDoorLight = new THREE.PointLight(0x00ff00, 1.2, 12);
        exitDoorLight.position.set(0, 2, -49);  // In front of door at z=-51.5
        this.scene.add(exitDoorLight);
    }
    
    addEnvironmentalDetails(warningMaterial) {
        // Bullet holes and damage
        const damageCount = 15;
        for (let i = 0; i < damageCount; i++) {
            const damage = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 0.3),
                new THREE.MeshStandardMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.7
                })
            );
            
            const wall = Math.random() > 0.5 ? -14.9 : 14.9;
            damage.position.set(
                wall,
                Math.random() * 3 + 0.5,
                -20 + Math.random() * 20
            );
            damage.rotation.y = wall > 0 ? -Math.PI/2 : Math.PI/2;
            this.scene.add(damage);
        }
        
        // Blood stains
        const bloodStains = 8;
        for (let i = 0; i < bloodStains; i++) {
            const blood = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                new THREE.MeshStandardMaterial({
                    color: 0x440000,
                    transparent: true,
                    opacity: 0.6
                })
            );
            blood.rotation.x = -Math.PI / 2;
            blood.position.set(
                Math.random() * 20 - 10,
                0.01,
                -30 + Math.random() * 20
            );
            blood.rotation.z = Math.random() * Math.PI;
            this.scene.add(blood);
        }
        
        // Warning tape
        const tapeGeometry = new THREE.PlaneGeometry(30, 0.2);
        const tape = new THREE.Mesh(tapeGeometry, warningMaterial);
        tape.position.set(0, 0.1, -5);
        tape.rotation.x = -Math.PI / 2;
        this.scene.add(tape);
    }
    
    spawnArmoryEnemies() {
        if (this.game && this.game.spawnEnemy) {
            // Reduce enemy count and spread them out better for performance
            // Entry area - one enemy
            this.game.spawnEnemy(0, 0, -5, 'possessed_scientist');
            
            // Main armory - two enemies with better spacing
            this.game.spawnEnemy(-10, 0, -20, 'possessed_scientist');
            this.game.spawnEnemy(10, 0, -22, 'possessed_scientist');
            
            // Exit corridor - one enemy
            this.game.spawnEnemy(0, 0, -35, 'possessed_scientist');
        }
    }
    
    checkWeaponCollection(playerPosition) {
        // Check proximity to weapon pickups using direct array access
        if (!playerPosition) return;
        
        // Throttle collection checks to every 100ms for performance
        const now = Date.now();
        if (this.lastCollectionCheck && now - this.lastCollectionCheck < 100) {
            return;
        }
        this.lastCollectionCheck = now;
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            if (!pickup || !pickup.position || pickup.userData.collected) continue;
            
            const distance = playerPosition.distanceTo(pickup.position);
            if (distance < 2) {
                // Mark for collection
                pickup.userData.collected = true;
                this.weaponsCollected++;
                
                // Track which weapon was collected
                const weaponType = pickup.userData.weaponType || pickup.userData.type;
                if (!this.collectedWeapons.includes(weaponType)) {
                    this.collectedWeapons.push(weaponType);
                }
                
                // Actually give the weapon to the player
                if (this.game && this.game.player) {
                    const weaponType = pickup.userData.type;
                    if (weaponType === 'rifle' || weaponType === 'Rifle') {
                        this.game.player.weapons.push('rifle');
                        this.game.player.hasRifle = true;
                    } else if (weaponType === 'shotgun' || weaponType === 'Shotgun') {
                        this.game.player.weapons.push('shotgun');
                        this.game.player.hasShotgun = true;
                    } else if (weaponType === 'Holy Water' || weaponType === 'holyWater') {
                        this.game.player.weapons.push('holyWater');
                        this.game.player.hasHolyWater = true;
                    } else if (weaponType === 'Crucifix Launcher' || weaponType === 'crucifix') {
                        this.game.player.weapons.push('crucifix');
                        this.game.player.hasCrucifix = true;
                    } else if (weaponType === 'pistol') {
                        // Pistol ammo
                        if (this.game.player.ammo && this.game.player.ammo.bullets !== undefined) {
                            this.game.player.ammo.bullets += 15;
                        }
                    } else if (weaponType === 'ammo') {
                        // Generic ammo
                        if (this.game.player.ammo && this.game.player.ammo.shells !== undefined) {
                            this.game.player.ammo.shells += 10;
                        }
                    }
                }
                
                if (this.game && this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle(`Collected ${pickup.userData.type}! (${this.weaponsCollected}/4 weapons)`);
                }
                
                // Hide instead of remove for better performance
                pickup.visible = false;
                if (pickup.userData.light) {
                    pickup.userData.light.visible = false;
                }
                
                // Mark for cleanup later
                pickup.userData.pendingRemoval = true;
                
                // Check exit condition immediately after collecting
                this.checkExitCondition();
                
                // Only process one pickup per frame to reduce lag
                break;
            }
        }
        
        // Check if enough weapons collected to unlock cache
        if (this.weaponsCollected >= 3 && this.cacheLock) {
            this.unlockCache();
        }
    }
    
    unlockCache() {
        if (this.cacheLock && !this.cacheUnlocked) {
            this.cacheUnlocked = true;  // Prevent multiple unlocks
            this.cacheLock.material.emissive.setHex(0x00ff00);
            this.cacheLock.material.emissiveIntensity = 0.5;
            
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.setObjective("Central cache unlocked! Collect holy weapons");
                this.game.narrativeSystem.displaySubtitle("The arsenal opens. These are blessed weapons from the Crusades.");
            }
            
            // Spawn holy weapon pickup
            this.createWeaponPickup(0, 2.5, -20);
        }
    }
    
    checkExitCondition() {
        // Open elevator after collecting all weapons
        if (this.weaponsCollected >= 4 && this.sealedDoor && this.sealedDoor.userData.locked) {
            this.sealedDoor.userData.locked = false;
            
            // Change button to green
            if (this.elevatorButton) {
                this.elevatorButton.material.emissive.setHex(0x00ff00);
                this.elevatorButton.material.emissiveIntensity = 1.0;
            }
            
            // Change display to show "READY"
            if (this.elevatorDisplay) {
                this.elevatorDisplay.material.emissive.setHex(0x00ff00);
                this.elevatorDisplay.material.emissiveIntensity = 0.5;
            }
            
            // Brighten elevator interior light
            if (this.doorLight) {
                this.doorLight.color.setHex(0xffffff);
                this.doorLight.intensity = 0.8;
            }
            
            // Remove doors from collision walls
            const leftIndex = this.walls.indexOf(this.leftDoor);
            if (leftIndex !== -1) {
                this.walls.splice(leftIndex, 1);
            }
            const rightIndex = this.walls.indexOf(this.rightDoor);
            if (rightIndex !== -1) {
                this.walls.splice(rightIndex, 1);
            }
            console.log('[ArmoryLevel] Elevator doors unlocked');
            
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.setObjective("Take the FREIGHT ELEVATOR to the Laboratory");
                this.game.narrativeSystem.displaySubtitle("Elevator is ready. Proceed to the Laboratory level.");
            }
            
            // Animate elevator doors opening
            this.animateDoorOpening();
        }
    }
    
    openElevatorForReturn() {
        // Open elevator doors immediately when returning from Laboratory
        if (this.leftDoor && this.rightDoor) {
            // Store original positions if not already stored
            if (!this.leftDoor.userData.originalX) {
                this.leftDoor.userData.originalX = -1;
                this.rightDoor.userData.originalX = 1;
            }
            
            // Set doors to fully open position
            this.leftDoor.position.x = -1 - 1.8;  // Original position - maxOpen
            this.rightDoor.position.x = 1 + 1.8;   // Original position + maxOpen
            
            // Update button to green (active)
            if (this.elevatorButton) {
                this.elevatorButton.material.emissive.setHex(0x00ff00);
                this.elevatorButton.material.emissiveIntensity = 0.8;
            }
            
            // Update display to show "LAB"
            if (this.elevatorDisplay) {
                this.elevatorDisplay.material.emissive.setHex(0x003300);
                this.elevatorDisplay.material.emissiveIntensity = 0.5;
            }
            
            // Brighten elevator light
            if (this.doorLight) {
                this.doorLight.intensity = 1.0;
            }
            
            // Doors are now open
            if (this.leftDoor.userData) this.leftDoor.userData.locked = false;
            if (this.rightDoor.userData) this.rightDoor.userData.locked = false;
        }
    }
    
    animateDoorOpening() {
        if (!this.leftDoor || !this.rightDoor) return;
        
        // Animate elevator doors sliding open
        const openSpeed = 0.02;
        const maxOpen = 1.8;  // How far doors slide apart
        
        const animateOpen = () => {
            let stillOpening = false;
            
            // Slide left door left
            if (this.leftDoor.position.x > this.leftDoor.userData.originalX - maxOpen) {
                this.leftDoor.position.x -= openSpeed;
                stillOpening = true;
            }
            
            // Slide right door right
            if (this.rightDoor.position.x < this.rightDoor.userData.originalX + maxOpen) {
                this.rightDoor.position.x += openSpeed;
                stillOpening = true;
            }
            
            if (stillOpening) {
                requestAnimationFrame(animateOpen);
            } else {
                // Doors fully open - play a ding sound if available
                console.log('[ArmoryLevel] Elevator doors open');
            }
        };
        
        // Store original positions
        if (!this.leftDoor.userData.originalX) {
            this.leftDoor.userData.originalX = this.leftDoor.position.x;
            this.rightDoor.userData.originalX = this.rightDoor.position.x;
        }
        
        // Start animation after a short delay
        setTimeout(animateOpen, 500);
    }
    
    update(deltaTime) {
        // Call parent update
        if (super.update) {
            super.update(deltaTime);
        }
        
        // Update objective based on enemy count
        if (!this.centralCacheUnlocked && this.game && this.game.enemies) {
            const enemyCount = this.game.enemies.length;
            
            if (enemyCount > 0 && this.lastEnemyCount !== enemyCount) {
                // Update enemy count in objective
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.setObjective(`Clear the armory - defeat all enemies (${enemyCount} remaining)`);
                }
                this.lastEnemyCount = enemyCount;
            }
        }
        
        // Update pickups
        this.updatePickups(deltaTime);
    }
    
    updatePickups(deltaTime) {
        // Animate all weapon pickups efficiently using direct array access
        const time = Date.now() * 0.002;
        
        // Batch cleanup of removed pickups every second
        const now = Date.now();
        if (!this.lastPickupCleanup || now - this.lastPickupCleanup > 1000) {
            this.lastPickupCleanup = now;
            this.cleanupRemovedPickups();
        }
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // Skip collected pickups
            if (!pickup || pickup.userData.collected) {
                continue;
            }
            
            // Only animate visible pickups
            if (pickup.visible && pickup.userData.baseY !== undefined) {
                // Floating animation
                pickup.position.y = pickup.userData.baseY + Math.sin(time + pickup.userData.animationTime) * 0.2;
                pickup.rotation.y += 0.02;
            }
        }
    }
    
    cleanupRemovedPickups() {
        // Clean up pickups marked for removal
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            if (pickup && pickup.userData.pendingRemoval) {
                // Remove from scene
                if (this.scene && pickup.parent) {
                    this.scene.remove(pickup);
                }
                // Remove light if exists
                if (pickup.userData.light && pickup.userData.light.parent) {
                    this.scene.remove(pickup.userData.light);
                }
                // Remove from array
                this.pickups.splice(i, 1);
            }
        }
    }
    
    createBoundaryWalls(material) {
        // Create front wall for the armory entrance area
        // The armory room itself already has walls, we just need to close off the entrance area
        
        // Front wall sections around the entrance from chapel (at z=10)
        // Left section of front wall
        this.createWall(-7.5, 1.5, 10, 9, 3, 0.5, material);
        // Right section of front wall  
        this.createWall(7.5, 1.5, 10, 9, 3, 0.5, material);
        // Top section above door
        this.createWall(0, 2.75, 10, 3, 0.5, 0.5, material);
        
        // Close off the connecting corridor sides at z=-5 to z=-15
        // These connect the entry area to the main armory room
        // Extended left wall of corridor
        this.createWall(-3, 1.5, 2.5, 0.5, 3, 15, material);
        // Extended right wall of corridor
        this.createWall(3, 1.5, 2.5, 0.5, 3, 15, material);
    }
    
    checkElevatorInteraction(player) {
        // Check if player is near the elevator and can interact
        if (!player || !player.position) return false;
        
        // Prevent multiple triggers
        if (this.levelCompleted) return false;
        
        // Check if door is unlocked first
        if (this.sealedDoor && !this.sealedDoor.userData.locked) {
            // Exit door is at z = -51.5, check if player is near it
            const playerZ = player.position.z;
            const playerX = player.position.x;
            
            // Check if player is near the elevator doors
            if (playerZ < -49 && playerZ > -53 && Math.abs(playerX) < 3) {
                // Show interaction prompt
                if (!this.elevatorPromptShown) {
                    if (this.game && this.game.narrativeSystem) {
                        this.game.narrativeSystem.displaySubtitle("Press E to use elevator");
                    }
                    this.elevatorPromptShown = true;
                }
                
                // Check for E key press
                if (this.game && this.game.inputManager && this.game.inputManager.keys['KeyE']) {
                    // Prevent multiple triggers
                    this.game.inputManager.keys['KeyE'] = false;
                    
                    // Use ZoneManager for elevator transition if available
                    if (this.game.zoneManager) {
                        this.game.zoneManager.startTransition('armory', 'laboratory', 'armory_lab_elevator');
                        this.levelCompleted = true;
                        return 'transition';
                    } else {
                        // Fallback to regular loading
                        this.levelCompleted = true;
                        return true;
                    }
                }
            } else {
                this.elevatorPromptShown = false;
            }
        }
        
        return false;
    }
    
    // Keep old method for compatibility but it just returns false now
    checkExitCollision(player) {
        return false;
    }
    
    checkChapelDoorCollision(player) {
        // Check if player wants to return to chapel
        if (!player || !player.position || !this.chapelDoor) {
            return false;
        }
        
        const distance = player.position.distanceTo(this.chapelDoor.position);
        
        // Check if player is very close to the door
        if (distance < 2) {
            // Show prompt
            if (this.game && this.game.narrativeSystem && !this.returnPromptShown) {
                this.game.narrativeSystem.displaySubtitle("Press E to return to Chapel");
                this.returnPromptShown = true;
            }
            
            // Check for E key press
            if (this.game && this.game.inputManager) {
                const eKeyPressed = this.game.inputManager.keys['KeyE'] || this.game.inputManager.keys['e'];
                if (eKeyPressed && !this.doorOpening) {
                    this.doorOpening = true;
                    console.log('[ArmoryLevel] Starting transition to chapel');
                    
                    // Use ZoneManager for seamless transition if available
                    if (this.game && this.game.zoneManager) {
                        this.game.zoneManager.triggerTransition('armory', 'chapel', player);
                        return 'transition'; // Special value to indicate transition started
                    } else {
                        // Fallback to regular loading
                        if (this.game) {
                            this.game.returningFromArmory = true;
                        }
                        return 'chapel'; // Load chapel level
                    }
                }
            }
        } else {
            this.returnPromptShown = false;
            this.doorOpening = false;
        }
        
        return false;
    }
    
    openDoorAnimation(door, callback) {
        if (!door) return;
        
        // Animate door sliding or rotating open
        const startPos = door.position.x;
        const targetPos = startPos - 2; // Slide door to the left
        const duration = 1000; // 1 second animation
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-in-out animation
            const eased = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            door.position.x = startPos + (targetPos - startPos) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Door fully open, execute callback
                if (callback) callback();
            }
        };
        
        animate();
    }
    
    clearLevel() {
        // Call parent cleanup to handle intervals, timeouts, walls, etc.
        if (super.cleanup) {
            super.cleanup();
        }
        
        // Additional armory-specific cleanup below
        
        // Clear pickups array
        this.pickups = [];
    }
}

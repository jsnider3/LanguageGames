// Chapter 2 - The Armory
// Deep underground weapons cache with demonic infestation

export class ArmoryLevel {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.levelNumber = 2;  // Chapter 2
        this.levelName = "The Armory";
        this.walls = [];
        this.armoryReached = false;
        this.weaponsCollected = 0;
        this.doorOpened = false;
        this.pickups = []; // Track pickups directly for better performance
    }
    
    create() {
        // Clear any existing level
        this.clearLevel();
        
        // Materials
        const concreteMaterial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            roughness: 0.95,
            metalness: 0.05
        });
        
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.3,
            metalness: 0.9
        });
        
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.1
        });
        
        // Create entry corridor from chapel
        this.createEntryCorridor(concreteMaterial);
        
        // Create main armory room
        this.createArmoryRoom(-20, concreteMaterial, metalMaterial);
        
        // Create weapons storage areas
        this.createWeaponRacks(-20, metalMaterial);
        
        // Create exit to deeper levels
        this.createExitCorridor(-40, concreteMaterial);
        
        // Add lighting
        this.addLighting();
        
        // Add environmental details
        this.addEnvironmentalDetails(warningMaterial);
        
        // Spawn initial enemies
        this.spawnArmoryEnemies();
        
        return this.walls;
    }
    
    createEntryCorridor(material) {
        // Entry from chapel (connecting at z=10)
        const corridorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 20),
            material
        );
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(0, 0, 0);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);
        
        // Ceiling
        const corridorCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 20),
            material
        );
        corridorCeiling.rotation.x = Math.PI / 2;
        corridorCeiling.position.set(0, 3, 0);
        this.scene.add(corridorCeiling);
        
        // Walls
        this.createWall(-3, 1.5, 0, 0.5, 3, 20, material);  // Left wall
        this.createWall(3, 1.5, 0, 0.5, 3, 20, material);   // Right wall
        
        // Entry door frame (connects to chapel door)
        this.createWall(0, 1.5, 10, 6, 3, 0.5, material);
        
        // Create door from chapel
        this.createDoor(0, 1.5, 10, 'fromChapel');
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
        
        // Walls
        this.createWall(-15, 2.5, z, 0.5, 5, 30, concreteMaterial);  // Left
        this.createWall(15, 2.5, z, 0.5, 5, 30, concreteMaterial);   // Right
        this.createWall(0, 2.5, z - 15, 30, 5, 0.5, concreteMaterial); // Back
        
        // Front wall with entrance
        this.createWall(-12, 2.5, z + 15, 6, 5, 0.5, concreteMaterial);  // Left of entrance
        this.createWall(12, 2.5, z + 15, 6, 5, 0.5, concreteMaterial);   // Right of entrance
        this.createWall(0, 4, z + 15, 6, 2, 0.5, concreteMaterial);      // Above entrance
        
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
    
    createExitCorridor(z, material) {
        // Exit to deeper levels
        const exitFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 15),
            material
        );
        exitFloor.rotation.x = -Math.PI / 2;
        exitFloor.position.set(0, 0, z - 7.5);
        exitFloor.receiveShadow = true;
        this.scene.add(exitFloor);
        
        // Ceiling
        const exitCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 15),
            material
        );
        exitCeiling.rotation.x = Math.PI / 2;
        exitCeiling.position.set(0, 3, z - 7.5);
        this.scene.add(exitCeiling);
        
        // Walls
        this.createWall(-4, 1.5, z - 7.5, 0.5, 3, 15, material);  // Left
        this.createWall(4, 1.5, z - 7.5, 0.5, 3, 15, material);   // Right
        
        // Sealed door (opens after collecting weapons)
        this.createSealedDoor(0, 1.5, z - 15);
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
        }
    }
    
    createSealedDoor(x, y, z) {
        const doorGeometry = new THREE.BoxGeometry(4, 3, 0.5);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x202020,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0xff0000,
            emissiveIntensity: 0.3  // More visible red glow
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, y, z);
        door.userData = { 
            isSealedDoor: true,
            locked: true
        };
        
        // Warning sign with text
        const signGeometry = new THREE.PlaneGeometry(3, 1);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(x, y + 2, z + 0.26);
        
        // Add a point light to make the door more visible
        const doorLight = new THREE.PointLight(0xff0000, 0.5, 10);
        doorLight.position.set(x, y, z + 1);
        this.scene.add(doorLight);
        this.doorLight = doorLight;
        
        this.scene.add(door);
        this.scene.add(sign);
        this.sealedDoor = door;
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
    
    addLighting() {
        // Flickering fluorescent lights
        const positions = [
            { x: 0, z: 0 },
            { x: 0, z: -20 },
            { x: -10, z: -20 },
            { x: 10, z: -20 }
        ];
        
        positions.forEach(pos => {
            const light = new THREE.PointLight(0xccccff, 0.8, 15);
            light.position.set(pos.x, 4, pos.z);
            light.castShadow = true;
            this.scene.add(light);
            
            // Flicker effect
            if (Math.random() > 0.5) {
                setInterval(() => {
                    light.intensity = light.intensity === 0.8 ? 0.3 : 0.8;
                }, 100 + Math.random() * 500);
            }
        });
        
        // Emergency red lighting
        const emergencyLight = new THREE.PointLight(0xff0000, 0.3, 20);
        emergencyLight.position.set(0, 2, -40);
        this.scene.add(emergencyLight);
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
            // Possessed scientists in entry area - spawn at floor level
            this.game.spawnEnemy(0, 0, -5, 'possessed_scientist');
            
            // More in main armory
            this.game.spawnEnemy(-8, 0, -20, 'possessed_scientist');
            this.game.spawnEnemy(8, 0, -20, 'possessed_scientist');
            this.game.spawnEnemy(0, 0, -25, 'possessed_scientist');
            
            // Add more possessed scientists instead of hellhounds for now
            this.game.spawnEnemy(-3, 0, -35, 'possessed_scientist');
            this.game.spawnEnemy(3, 0, -35, 'possessed_scientist');
        }
    }
    
    checkWeaponCollection(playerPosition) {
        // Check proximity to weapon pickups using direct array access
        if (!playerPosition) return;
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            if (!pickup || !pickup.position || pickup.userData.collected) continue;
            
            const distance = playerPosition.distanceTo(pickup.position);
            if (distance < 2) {
                // Mark for collection
                pickup.userData.collected = true;
                this.weaponsCollected++;
                
                // Actually give the weapon to the player
                if (this.game && this.game.player) {
                    const weaponType = pickup.userData.type;
                    if (weaponType === 'Rifle') {
                        this.game.player.weapons.push('rifle');
                        this.game.player.hasRifle = true;
                    } else if (weaponType === 'Shotgun') {
                        this.game.player.weapons.push('shotgun');
                        this.game.player.hasShotgun = true;
                    } else if (weaponType === 'Holy Water') {
                        this.game.player.weapons.push('holyWater');
                        this.game.player.hasHolyWater = true;
                    } else if (weaponType === 'Crucifix Launcher') {
                        this.game.player.weapons.push('crucifix');
                        this.game.player.hasCrucifix = true;
                    }
                }
                
                if (this.game && this.game.narrativeSystem) {
                    this.game.narrativeSystem.displaySubtitle(`Collected ${pickup.userData.type}! (${this.weaponsCollected}/4 weapons)`);
                }
                
                // Remove from scene and tracking array
                if (this.scene && this.scene.remove) {
                    this.scene.remove(pickup);
                }
                this.pickups.splice(i, 1);
                
                // Check exit condition immediately after collecting
                this.checkExitCondition();
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
        // Open sealed door after collecting all weapons
        if (this.weaponsCollected >= 4 && this.sealedDoor && this.sealedDoor.userData.locked) {
            this.sealedDoor.userData.locked = false;
            this.sealedDoor.material.emissive.setHex(0x00ff00);
            this.sealedDoor.material.emissiveIntensity = 1.0;  // Bright green glow
            
            // Make door translucent to show it can be passed through
            this.sealedDoor.material.transparent = true;
            this.sealedDoor.material.opacity = 0.3;
            
            // Change door light to green
            if (this.doorLight) {
                this.doorLight.color.setHex(0x00ff00);
                this.doorLight.intensity = 1.0;
            }
            
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.setObjective("Walk through the GREEN GLOWING DOOR at the far end (z = -55)");
                this.game.narrativeSystem.displaySubtitle("The armory door unseals. Walk STRAIGHT BACK to the green door.");
            }
            
            // Animate door sliding up
            this.animateDoorOpening();
        }
    }
    
    animateDoorOpening() {
        if (!this.sealedDoor) return;
        
        // Slide door up slowly
        const slideUp = () => {
            if (this.sealedDoor.position.y < 4) {
                this.sealedDoor.position.y += 0.02;
                requestAnimationFrame(slideUp);
            }
        };
        slideUp();
    }
    
    updatePickups(deltaTime) {
        // Animate all weapon pickups efficiently using direct array access
        const time = Date.now() * 0.002;
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // Remove collected or invalid pickups from tracking
            if (!pickup || !pickup.parent || pickup.userData.collected) {
                this.pickups.splice(i, 1);
                continue;
            }
            
            if (pickup.userData.baseY !== undefined) {
                // Floating animation
                pickup.position.y = pickup.userData.baseY + Math.sin(time + pickup.userData.animationTime) * 0.2;
                pickup.rotation.y += 0.02;
            }
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
        
        // Clear pickups array
        this.pickups = [];
    }
}
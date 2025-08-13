import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { THEME } from '../modules/config/theme.js';
// Desecrated Chapel Level
// The first objective - find and cleanse the chapel

export class ChapelLevel extends BaseLevel {
    constructor(scene, game) {
        // LevelFactory always passes (scene, game)
        super(game);
        this.scene = scene;
        this.game = game;
        
        // walls is already initialized in BaseLevel
        this.chapelReached = false;
        this.chapelCleansed = false;
    }
    
    create() {
        // Clear any existing level
        this.clearLevel();
        
        // Materials
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.floor.chapel,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.wall.chapel,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const chapelMaterial = new THREE.MeshStandardMaterial({
            color: THEME.materials.wall.desecrated,
            roughness: 0.7,
            metalness: 0.1,
            emissive: THEME.lights.point.demonic,
            emissiveIntensity: 0.2
        });
        
        // Create main corridor (40 units long)
        this.createCorridor(floorMaterial, wallMaterial);
        
        // Create chapel at the end
        this.createChapel(30, chapelMaterial);
        
        // Add lighting
        this.addLighting();
        
        // Add environmental details
        this.addEnvironmentalDetails();
        
        // Create exit door to armory (always visible)
        this.createExitDoor();
        
        return this.walls;
    }
    
    createCorridor(floorMaterial, wallMaterial) {
        // Main corridor floor (40x10)
        const corridorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 40),
            floorMaterial
        );
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(0, 0, -10);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);
        
        // Corridor ceiling with missile entry hole
        const corridorCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 40),
            wallMaterial
        );
        corridorCeiling.rotation.x = Math.PI / 2;
        corridorCeiling.position.set(0, 4, -10);
        corridorCeiling.receiveShadow = true;
        this.scene.add(corridorCeiling);
        
        // Missile entry hole in ceiling (where Giovanni crashed through)
        // Create sky blue circle to show hole
        const holeGeometry = new THREE.CircleGeometry(2, 16);
        const holeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87ceeb,  // Sky blue
            side: THREE.DoubleSide
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(0, 3.99, 8);  // Near starting position
        this.scene.add(hole);
        
        // Add debris around hole edge
        const debrisRing = new THREE.Mesh(
            new THREE.RingGeometry(2, 2.5, 16),
            new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                roughness: 0.9
            })
        );
        debrisRing.rotation.x = Math.PI / 2;
        debrisRing.position.set(0, 3.98, 8);
        this.scene.add(debrisRing);
        
        // Debris around hole
        this.createDebris(0, 0, 8, wallMaterial);
        
        // Left wall - moved further out to avoid collision issues
        this.createWall(-5.5, 2, -10, 0.5, 4, 40, wallMaterial);
        
        // Right wall - moved further out
        this.createWall(5.5, 2, -10, 0.5, 4, 40, wallMaterial);
        
        // Back wall (starting area) - move back to give player room
        this.createWall(0, 2, 12, 12, 4, 0.5, wallMaterial);
        
        // Add some pillars for cover - make them thinner
        this.createWall(-2, 2, -5, 0.4, 4, 0.4, wallMaterial);
        this.createWall(2, 2, -5, 0.4, 4, 0.4, wallMaterial);
        this.createWall(-2, 2, -15, 0.4, 4, 0.4, wallMaterial);
        this.createWall(2, 2, -15, 0.4, 4, 0.4, wallMaterial);
    }
    
    createChapel(zPosition, chapelMaterial) {
        // Chapel is a larger room at the end
        const chapelFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            chapelMaterial
        );
        chapelFloor.rotation.x = -Math.PI / 2;
        chapelFloor.position.set(0, 0, -zPosition - 10);
        chapelFloor.receiveShadow = true;
        this.scene.add(chapelFloor);
        
        // Chapel ceiling (higher)
        const chapelCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            chapelMaterial
        );
        chapelCeiling.rotation.x = Math.PI / 2;
        chapelCeiling.position.set(0, 6, -zPosition - 10);
        chapelCeiling.receiveShadow = true;
        this.scene.add(chapelCeiling);
        
        // Chapel walls
        this.createWall(-10, 3, -zPosition - 10, 0.5, 6, 20, chapelMaterial); // Left
        this.createWall(10, 3, -zPosition - 10, 0.5, 6, 20, chapelMaterial); // Right
        this.createWall(0, 3, -zPosition - 20, 20, 6, 0.5, chapelMaterial); // Far wall
        
        // Chapel entrance (narrower opening)
        this.createWall(-7.5, 3, -zPosition, 2.5, 6, 0.5, chapelMaterial); // Left of entrance
        this.createWall(7.5, 3, -zPosition, 2.5, 6, 0.5, chapelMaterial); // Right of entrance
        
        // Create altar at the far end
        this.createAltar(0, -zPosition - 18);
        
        // Create trigger zone for chapel
        this.createChapelTrigger(0, -zPosition - 10);
    }
    
    createAltar(x, z) {
        // Desecrated altar
        const altarGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
        const altarMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1010,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        const altar = new THREE.Mesh(altarGeometry, altarMaterial);
        altar.position.set(x, 0.75, z);
        altar.castShadow = true;
        altar.receiveShadow = true;
        altar.userData = { isAltar: true };
        this.scene.add(altar);
        
        // Store reference and add to walls for collision
        this.altar = altar;
        this.walls.push(altar);
        
        // Add demonic symbol above altar
        const symbolGeometry = new THREE.RingGeometry(0.5, 1, 6);
        const symbolMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        
        const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
        symbol.position.set(x, 2.5, z);
        symbol.rotation.x = Math.PI / 2;
        this.scene.add(symbol);
        
        // Rotating animation for symbol
        const animateSymbol = () => {
            symbol.rotation.z += 0.01;
            if (!this.chapelCleansed) {
                requestAnimationFrame(animateSymbol);
            }
        };
        animateSymbol();
    }
    
    createChapelTrigger(x, z) {
        // Invisible trigger zone
        const triggerGeometry = new THREE.BoxGeometry(15, 4, 15);
        const triggerMaterial = new THREE.MeshBasicMaterial({
            visible: false
        });
        
        const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
        trigger.position.set(x, 2, z);
        trigger.userData = { 
            isChapelTrigger: true,
            triggered: false
        };
        this.scene.add(trigger);
    }
    
    // createWall method is now inherited from BaseLevel
    
    addLighting() {
        // Corridor lights (dim, flickering)
        const corridorLight1 = new THREE.PointLight(0xffaa00, 0.5, 10);
        corridorLight1.position.set(0, 3, 0);
        this.scene.add(corridorLight1);
        
        const corridorLight2 = new THREE.PointLight(0xffaa00, 0.5, 10);
        corridorLight2.position.set(0, 3, -10);
        this.scene.add(corridorLight2);
        
        const corridorLight3 = new THREE.PointLight(0xffaa00, 0.5, 10);
        corridorLight3.position.set(0, 3, -20);
        this.scene.add(corridorLight3);
        
        // Chapel lighting (ominous red)
        const chapelLight = new THREE.PointLight(0xff0000, 1, 20);
        chapelLight.position.set(0, 5, -40);
        chapelLight.castShadow = true;
        this.scene.add(chapelLight);
        
        // Flickering effect
        const flicker = () => {
            corridorLight1.intensity = 0.5 + Math.random() * 0.2;
            corridorLight2.intensity = 0.5 + Math.random() * 0.2;
            corridorLight3.intensity = 0.5 + Math.random() * 0.2;
            
            if (!this.chapelCleansed) {
                setTimeout(flicker, 100 + Math.random() * 200);
            }
        };
        flicker();
    }
    
    addEnvironmentalDetails() {
        // Blood stains on floor
        const bloodGeometry = new THREE.PlaneGeometry(2, 3);
        const bloodMaterial = new THREE.MeshBasicMaterial({
            color: 0x440000,
            transparent: true,
            opacity: 0.6
        });
        
        const blood1 = new THREE.Mesh(bloodGeometry, bloodMaterial);
        blood1.rotation.x = -Math.PI / 2;
        blood1.position.set(-1, 0.01, -8);
        this.scene.add(blood1);
        
        const blood2 = new THREE.Mesh(bloodGeometry, bloodMaterial);
        blood2.rotation.x = -Math.PI / 2;
        blood2.position.set(2, 0.01, -18);
        blood2.rotation.z = Math.PI / 4;
        this.scene.add(blood2);
        
        // Corpse markers (simple dark shapes)
        const corpseGeometry = new THREE.BoxGeometry(1.5, 0.2, 0.8);
        const corpseMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a
        });
        
        const corpse1 = new THREE.Mesh(corpseGeometry, corpseMaterial);
        corpse1.position.set(-3, 0.1, -12);
        corpse1.rotation.y = Math.PI / 6;
        this.scene.add(corpse1);
        
        // Add "prayer position" hint
        const corpse2 = new THREE.Mesh(corpseGeometry, corpseMaterial);
        corpse2.position.set(0, 0.1, -25);
        corpse2.rotation.x = -Math.PI / 8; // Kneeling position
        this.scene.add(corpse2);
    }
    
    checkChapelTrigger(playerPosition) {
        if (this.chapelReached) return;
        
        // Check if player has reached the chapel
        if (playerPosition.z < -25) {
            this.chapelReached = true;
            
            // Check if chapel was already cleansed in a previous visit
            if (this.chapelCleansed) {
                if (this.game.narrativeSystem) {
                    this.game.narrativeSystem.setObjective("Chapel already cleansed - proceed to exit");
                    this.game.narrativeSystem.displaySubtitle("The chapel remains purified.");
                }
                // Don't spawn enemies if already cleansed
                return true;
            }
            
            if (this.game.narrativeSystem) {
                this.game.narrativeSystem.setObjective("Cleanse the altar - defeat all demons");
                this.game.narrativeSystem.displaySubtitle("The chapel... desecrated as expected. Time to work.");
            }
            
            // Spawn chapel enemies only if not cleansed
            this.spawnChapelEnemies();
            
            return true;
        }
        
        return false;
    }
    
    update(deltaTime) {
        // Call parent update
        if (super.update) {
            super.update(deltaTime);
        }
        
        // Update objective based on enemy count
        if (this.chapelReached && !this.chapelCleansed) {
            if (this.game && this.game.enemies) {
                const enemyCount = this.game.enemies.length;
                
                if (enemyCount === 0 && !this.objectiveUpdated) {
                    // All enemies defeated
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.setObjective("All demons defeated! Approach the altar to cleanse it");
                        this.game.narrativeSystem.displaySubtitle("The demons are vanquished. Now cleanse the altar.");
                    }
                    this.objectiveUpdated = true;
                } else if (enemyCount > 0 && this.lastEnemyCount !== enemyCount) {
                    // Update enemy count in objective
                    if (this.game.narrativeSystem) {
                        this.game.narrativeSystem.setObjective(`Cleanse the altar - defeat all demons (${enemyCount} remaining)`);
                    }
                    this.lastEnemyCount = enemyCount;
                }
            }
        }
    }
    
    spawnChapelEnemies() {
        // Spawn enemies IN the chapel when player enters (z=-40 is chapel center)
        if (this.game.spawnEnemy) {
            // Spawn possessed scientists near altar (altar is at z=-48)
            this.game.spawnEnemy(0, 0, -46, 'possessed_scientist');  // Near altar
            this.game.spawnEnemy(-3, 0, -44, 'possessed_scientist'); // Left of altar
            this.game.spawnEnemy(3, 0, -44, 'possessed_scientist');  // Right of altar
            
            // Spawn some in the chapel main area
            this.game.spawnEnemy(-5, 0, -38, 'possessed_scientist'); // Left side
            this.game.spawnEnemy(5, 0, -38, 'possessed_scientist');  // Right side
            
            // Spawn a couple near entrance to block retreat
            this.game.spawnEnemy(-2, 0, -32, 'possessed_scientist'); // Near entrance left
            this.game.spawnEnemy(2, 0, -32, 'possessed_scientist');  // Near entrance right
        }
    }
    
    createDebris(x, y, z, material) {
        // Create debris from missile crash
        const debrisCount = 10;
        for (let i = 0; i < debrisCount; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const debris = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                material
            );
            debris.position.set(
                x + (Math.random() - 0.5) * 4,
                y + Math.random() * 0.2,
                z + (Math.random() - 0.5) * 4
            );
            debris.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            debris.castShadow = true;
            this.scene.add(debris);
        }
    }
    
    createExitDoor() {
        // Door to Armory (always visible, locked until chapel is cleansed)
        const doorGeometry = new THREE.BoxGeometry(2, 3, 0.3);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8,
            emissive: 0xff0000,  // Red glow when locked
            emissiveIntensity: 0.2
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(5, 1.5, -20);  // On the right side of corridor, just before chapel room
        door.rotation.y = Math.PI / 2;  // Rotate 90 degrees to be flush with side wall
        door.userData = { 
            isDoor: true,
            toLevel: 'armory',
            locked: true,
            requiresCleansing: true  // Indicates it needs chapel cleansed to open
        };
        
        // Add a sign above the door
        const signGeometry = new THREE.PlaneGeometry(3, 0.5);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            emissive: 0x222222,
            emissiveIntensity: 0.2
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 3.2, 10.1);
        this.scene.add(sign);
        
        this.exitDoor = door;
        this.scene.add(door);
    }
    
    unlockExitDoor() {
        if (this.exitDoor) {
            this.exitDoor.userData.locked = false;
            this.exitDoor.userData.requiresCleansing = false;
            // Change from red to green glow when unlocked
            this.exitDoor.material.emissive = new THREE.Color(0x00ff00);
            this.exitDoor.material.emissiveIntensity = 0.3;
            
            if (this.game && this.game.narrativeSystem) {
                this.game.narrativeSystem.displaySubtitle("The chapel is cleansed. The armory door unlocks.");
            }
        }
    }
    
    checkExitDoorCollision(player) {
        // Check if player is near the exit door
        if (!player || !player.position || !this.exitDoor) return false;
        
        const distance = player.position.distanceTo(this.exitDoor.position);
        
        // Check if player is near the door
        if (distance < 2) {
            if (!this.exitDoor.userData.locked) {
                // Show prompt
                if (this.game && this.game.showInteractPrompt) {
                    this.game.showInteractPrompt("Press E to enter the Armory");
                }
                
                // Check for E key press
                if (this.game && this.game.inputManager) {
                    const input = this.game.inputManager.getInput();
                    if (input.interact) {
                        console.log('[ChapelLevel] Player interacting with unlocked door');
                        // Use ZoneManager for seamless transition if available
                        if (this.game && this.game.zoneManager) {
                            console.log('[ChapelLevel] Starting zone transition via ZoneManager');
                            // Use triggerTransition instead of startTransition
                            this.game.zoneManager.triggerTransition('chapel', 'armory', player);
                            return 'transition'; // Special return value to indicate transition started
                        } else {
                            console.log('[ChapelLevel] No ZoneManager, falling back to regular loading');
                            // Fallback to regular level loading
                            return 'armory';
                        }
                    }
                }
            } else {
                // Door is locked
                if (this.game && this.game.showInteractPrompt) {
                    this.game.showInteractPrompt("Door locked - Cleanse the chapel first");
                }
            }
        } else {
            // Hide prompt if player moves away
            if (this.game && this.game.hideInteractPrompt) {
                this.game.hideInteractPrompt();
            }
        }
        
        return false;
    }
    
    clearLevel() {
        // Call parent cleanup to handle intervals, timeouts, walls, etc.
        if (super.cleanup) {
            super.cleanup();
        }
        
        // Additional chapel-specific cleanup below
    }
}

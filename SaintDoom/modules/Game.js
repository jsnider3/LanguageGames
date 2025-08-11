// Game Module  
// Main game class containing all game logic, state management, and level handling

// Import required modules
import { GAME_CONFIG } from './GameConfig.js';
import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { CollisionSystem } from './CollisionSystem.js';
import { WeaponSystem } from './WeaponSystem.js';

export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;
        this.player = null;
        this.inputManager = null;
        this.level = null;
        this.enemies = [];
        this.pickups = [];
        this.collisionSystem = null;
        this.weaponSystem = null;
        this.narrativeSystem = null;
        this.isRunning = false;
        this.isPaused = false;
        this.cameraShake = 0;
        this.gameOver = false;
        this.deathCount = 0;
        this.martyrdomMode = false;
        this.respawnTimer = 0;
        this.score = 0;
        this.kills = 0;
        this.combo = 0;
        this.comboTimer = 0;
    }

    async init(levelName = 'tutorial') {
        this.currentLevel = levelName;
        this.setupRenderer();
        this.setupScene();
        
        this.clock = new THREE.Clock();
        this.inputManager = new InputManager();
        this.collisionSystem = new CollisionSystem();
        this.collisionSystem.game = this;  // Pass game reference for chapel level check
        
        this.player = new Player(this.camera);
        this.player.game = this; // Set game reference
        this.scene.add(this.player.shadowMesh); // Add shadow-casting mesh to scene
        this.weaponSystem = new WeaponSystem(this.player, this.scene, this.camera);
        
        // Initialize narrative system
        if (window.NarrativeSystem) {
            this.narrativeSystem = new window.NarrativeSystem(this);
        }
        
        // Show initial weapon (but not in tutorial)
        if (levelName !== 'tutorial') {
            this.weaponSystem.switchToWeapon('sword');
        } else {
            // Hide all weapons in tutorial until instructed
            Object.values(this.weaponSystem.weapons).forEach(weapon => {
                if (weapon.hide) weapon.hide();
            });
        }
        
        // Clear enemies and reset
        this.enemies = [];
        this.gameOver = false;
        this.isRunning = false;
        
        // Start with loading the level
        this.loadLevel(levelName);
        
        // Hide start screen and show game UI
        document.getElementById('startScreen').style.display = 'none';
        // Only show instructions for non-tutorial levels
        if (levelName !== 'tutorial') {
            const instructions = document.getElementById('instructions');
            if (instructions) instructions.style.display = 'block';
        }
        
        // Initialize UI after level is loaded
        this.updateHUD();
        
        // Start intro sequence only for tutorial level
        if (this.narrativeSystem && levelName === 'tutorial') {
            await this.narrativeSystem.startIntroSequence();
        }
        
        // Request pointer lock when game starts
        setTimeout(() => {
            document.body.requestPointerLock();
        }, 100);
        
        // Start the game loop
        this.isRunning = true;
        this.animate();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 0.1, 50);
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.7, 0);
        
        // Add camera to scene so its children (weapons) will render
        this.scene.add(this.camera);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        this.scene.add(dirLight);
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }

    spawnEnemy(x, y, z, type = 'scientist') {
        let enemy;
        const position = new THREE.Vector3(x, y, z);
        
        if (type === 'hellhound') {
            enemy = new window.Hellhound(this.scene, position);
        } else if (type === 'possessed_scientist') {
            // Always use PossessedScientist for this type
            enemy = new window.PossessedScientist(this.scene, position);
        } else {
            enemy = new window.Enemy(this.scene, position);
        }
        
        this.enemies.push(enemy);
    }
    
    spawnPickup(x, y, z, type) {
        const pickup = new window.Pickup(this.scene, new THREE.Vector3(x, y, z), type);
        this.pickups.push(pickup);
    }

    update(deltaTime) {
        if (this.isPaused || this.gameOver) return;
        
        this.updateComboTimer(deltaTime);
        
        const input = this.inputManager.getInput();
        
        this.updatePlayer(deltaTime, input);
        this.handleWeaponInput(input);
        this.handleCombat(input, deltaTime);
        this.updateEnemies(deltaTime);
        this.handlePlayerDamage();
        this.updatePickups(deltaTime);
        this.checkLevelProgression();
        this.updateCollisions(deltaTime);
        this.updateHUD();
        
        // Check tutorial progress
        if (this.tutorialLevel && this.tutorialLevel.checkTutorialProgress) {
            this.tutorialLevel.checkTutorialProgress(input, this.player);
        }
        
        // Check chapel trigger if chapel level exists
        if (this.chapelLevel && !this.chapelLevel.chapelReached) {
            this.chapelLevel.checkChapelTrigger(this.player.position);
        }
        
        // Check armory weapon collection
        if (this.armoryLevel && this.armoryLevel.checkWeaponCollection) {
            this.armoryLevel.checkWeaponCollection(this.player.position);
            this.armoryLevel.checkExitCondition();
            // Update pickup animations
            if (this.armoryLevel.updatePickups) {
                this.armoryLevel.updatePickups(deltaTime);
            }
            // Check for level exit
            if (this.armoryLevel.checkExitCollision && this.armoryLevel.checkExitCollision(this.player)) {
                console.log('Armory level complete! Loading next level...');
                this.loadLevel('laboratory'); // Load the Laboratory Complex level
            }
        }
        
        // Update laboratory level if active
        if (this.currentLevelInstance && this.currentLevelInstance.levelName === 'Laboratory Complex') {
            // Update the level (animations, etc)
            if (this.currentLevelInstance.update) {
                this.currentLevelInstance.update(deltaTime);
            }
            
            // Check for level exit
            if (this.currentLevelInstance.checkExitCollision && this.currentLevelInstance.checkExitCollision(this.player)) {
                console.log('Laboratory level complete! Loading next level...');
                this.loadLevel('containment'); // Load the Containment level
            }
        }
        
        // Clean up broken enemies or handle deaths that weren't caught by combat
        this.enemies = this.enemies.filter(enemy => {
            // Check for invalid position
            const hasInvalidPosition = !enemy.position || 
                isNaN(enemy.position.x) || 
                isNaN(enemy.position.y) || 
                isNaN(enemy.position.z);
            
            // Remove if has invalid position
            if (hasInvalidPosition) {
                this.cleanupEnemy(enemy);
                return false;
            }
            
            // Check if enemy fell through the floor
            if (enemy.position.y < -10) {
                return false;
            }
            
            // Check if enemy is dead but wasn't counted
            if (this.isEnemyDead(enemy)) {
                if (!enemy.deathCounted) {
                    this.processDeadEnemy(enemy);
                    // Schedule cleanup
                    setTimeout(() => this.cleanupEnemy(enemy), 2000);
                }
                return false;
            }
            
            // Keep enemy if still alive
            return true;
        });
        if (this.chapelLevel && this.chapelLevel.chapelReached && !this.chapelLevel.chapelCleansed) {
            // Check if all enemies are dead
            if (this.enemies.length === 0) {
                // Enemies defeated, now check if player is near altar to cleanse it
                const altarPos = new THREE.Vector3(0, 0, -48);
                const distanceToAltar = this.player.position.distanceTo(altarPos);
                
                if (!this.altarCanBeCleansed) {
                    this.altarCanBeCleansed = true;
                    if (this.narrativeSystem) {
                        this.narrativeSystem.setObjective("Approach the altar and press E to cleanse it");
                        this.narrativeSystem.displaySubtitle("The demons are banished. Now to cleanse this desecration.");
                    }
                }
                
                // Show interaction prompt when close to altar
                if (distanceToAltar < 5) {
                    this.showInteractPrompt("Press E to cleanse the altar");
                    
                    // Check if player is pressing E (use the input we already got)
                    if (input.interact) {
                        this.cleanseAltar();
                        this.hideInteractPrompt();
                    }
                } else {
                    this.hideInteractPrompt();
                }
            }
        }
        
        // Check door interaction
        if (this.exitDoor) {
            const doorPos = new THREE.Vector3(4.9, 0, -25);
            const doorDistance = this.player.position.distanceTo(doorPos);
            
            // Show prompt when near door
            if (doorDistance < 3 && !this.doorOpening) {
                this.showInteractPrompt("Press E to enter the Armory");
                
                if (input.interact) {
                    // Animate door opening
                    if (this.exitDoorMesh && !this.doorOpening) {
                        this.doorOpening = true;
                        this.hideInteractPrompt();
                        let rotation = 0;
                        const openDoor = setInterval(() => {
                            rotation += 0.05;
                            this.exitDoorMesh.rotation.y = -rotation;
                            if (rotation >= Math.PI / 2) {
                                clearInterval(openDoor);
                                // Transition to Chapter 2
                                setTimeout(() => {
                                    this.loadLevel('chapter2');
                                }, 500);
                            }
                        }, 16);
                    }
                }
            } else if (doorDistance >= 3) {
                this.hideInteractPrompt();
            }
        }
        
        this.applyCameraEffects();
        this.checkPlayerDeath();
    }
    
    updateComboTimer(deltaTime) {
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
    }
    
    updatePlayer(deltaTime, input) {
        this.player.update(deltaTime, input);
        this.player.applyMouseLook(input.mouseDeltaX, input.mouseDeltaY);
    }
    
    handleWeaponInput(input) {
        // Skip weapon switching in tutorial until player is given weapons
        if (this.tutorialLevel && (!this.player.weapons || this.player.weapons.length === 0)) {
            return;
        }
        
        const weaponKeys = ['weapon1', 'weapon2', 'weapon3', 'weapon4'];
        weaponKeys.forEach((key, index) => {
            if (input[key]) {
                // Only allow switching to weapons the player has
                if (this.player.weapons && index < this.player.weapons.length) {
                    this.switchWeapon(index);
                }
            }
        });
    }
    
    handleCombat(input, deltaTime) {
        if (input.attack && this.weaponSystem.activeWeaponType) {
            const hits = this.weaponSystem.attack(this.enemies);
            
            // Add camera shake on hit
            if (hits.length > 0) {
                this.cameraShake = 0.2;
            }
            
            this.enemies = this.enemies.filter(enemy => {
                if (this.isEnemyDead(enemy)) {
                    this.processDeadEnemy(enemy);
                    return false;  // Remove from array
                }
                return true;
            });
        }
        
        if (input.block && this.player.currentWeapon === 'sword') {
            this.weaponSystem.meleeCombat.performBlock();
        }
        
        this.weaponSystem.update(deltaTime, this.enemies);
    }
    
    cleanupEnemy(enemy) {
        // Helper function to properly clean up an enemy
        if (enemy.destroy) {
            enemy.destroy();
        }
        if (enemy.mesh && enemy.scene) {
            enemy.scene.remove(enemy.mesh);
        }
    }
    
    cleanupPickup(pickup) {
        // Helper function to properly clean up a pickup
        if (pickup.destroy) {
            pickup.destroy();
        }
        if (pickup.mesh) {
            this.scene.remove(pickup.mesh);
        }
    }
    
    processDeadEnemy(enemy) {
        // Helper to handle dead enemy that hasn't been counted
        if (!enemy.deathCounted) {
            // Ensure onDeath is called if not already dead
            if (!enemy.isDead && enemy.health <= 0) {
                enemy.onDeath();
            }
            enemy.deathCounted = true;
            this.handleEnemyDeath(enemy);
        }
    }
    
    isEnemyDead(enemy) {
        // Helper to check if enemy is dead
        return enemy.isDead || enemy.state === 'dead' || enemy.health <= 0;
    }
    
    handleEnemyDeath(enemy) {
        // Build rage on kill
        const rageGain = this.player.currentWeapon === 'sword' ? 
            GAME_CONFIG.PLAYER.RAGE.BUILD_MELEE : 
            GAME_CONFIG.PLAYER.RAGE.BUILD_KILL_BONUS;
        this.player.buildRage(rageGain);
        
        // Update kills and score
        this.kills++;
        this.addScore(enemy.scoreValue || 100);
        
        // Play death sound and voice line
        if (window.AudioManager) {
            window.AudioManager.playDeath();
            // Occasionally play a voice line
            if (Math.random() < 0.3) {
                window.AudioManager.playVoiceLine('demonKill');
            }
        }
        
        // Trigger narrative system for enemy death
        if (this.narrativeSystem) {
            this.narrativeSystem.onEnemyKilled(enemy.type || 'demon');
        }
        
        setTimeout(() => this.cleanupEnemy(enemy), 2000);
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player);
            this.collisionSystem.checkEnemyWallCollisions(enemy, this.level.walls, deltaTime, this.level);
        });
    }
    
    handlePlayerDamage() {
        if (window.playerDamaged) {
            // Add screen shake based on damage amount
            this.cameraShake = Math.min(0.5, window.playerDamaged * GAME_CONFIG.COMBAT.CAMERA_SHAKE_MULTIPLIER);
            
            // Red flash effect
            this.createDamageFlash();
            
            // Play hurt sound
            this.playHurtSound();
            
            window.playerDamaged = 0;
        }
    }
    
    updatePickups(deltaTime) {
        this.pickups = this.pickups.filter(pickup => {
            pickup.update(deltaTime, this.player, this);
            return !pickup.collected;
        });
    }
    
    checkLevelProgression() {
        // Skip if using tutorial or chapel level (they have their own progression)
        if (this.tutorialLevel || this.chapelLevel) return;
        
        // Check if level has the required methods
        if (!this.level || !this.level.openExitDoor || !this.level.checkExitCollision) {
            return;
        }
        
        // Check if all enemies are defeated to open exit
        if (this.enemies.length === 0 && !this.level.isExitOpen) {
            this.level.openExitDoor();
            this.showMessage("The holy seal breaks! Exit opened!");
        }
        
        // Check exit collision for level progression
        if (this.level.checkExitCollision(this.player)) {
            this.nextLevel();
        }
    }
    
    updateCollisions(deltaTime) {
        // Check all collisions (walls and enemies)
        const walls = this.level.walls || [];
        this.collisionSystem.checkPlayerWallCollisions(this.player, walls, deltaTime, this.level, this.enemies);
        // Still do separation if overlapping
        this.collisionSystem.checkEnemyPlayerCollisions(this.enemies, this.player);
    }
    
    applyCameraEffects() {
        if (this.cameraShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.cameraShake;
            const shakeY = (Math.random() - 0.5) * this.cameraShake;
            this.camera.position.x += shakeX;
            this.camera.position.y += shakeY;
            this.cameraShake *= GAME_CONFIG.ANIMATIONS.CAMERA_SHAKE_DECAY;
        }
    }
    
    checkPlayerDeath() {
        if (this.player.health <= 0 && !this.gameOver) {
            this.handlePlayerDeath();
        }
    }
    
    nextLevel() {
        // Add level completion bonus
        const levelBonus = this.level.levelNumber * 500;
        this.addScore(levelBonus);
        this.showMessage(`Level Complete! +${levelBonus} Score!`);
        
        // Clear current enemies and pickups
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        
        this.pickups.forEach(pickup => pickup.destroy());
        this.pickups = [];
        
        // Transition to next level
        this.level.createNextLevel();
        
        // Reset player position - different for level 2 to avoid center pillar
        if (this.level.levelNumber === 2) {
            this.player.position.set(0, 1.7, 5);  // Spawn in front of center pillar
        } else {
            this.player.position.set(0, 1.7, 0);
        }
        this.player.velocity.set(0, 0, 0);
        
        // Spawn enemies based on level
        if (this.level.levelNumber === 2) {
            this.spawnLevel2Enemies();
        } else if (this.level.levelNumber === 3) {
            this.spawnBossEnemy();
        } else {
            this.spawnLevel1Enemies();
        }
        
        // Spawn new pickups
        this.spawnLevelPickups();
        
        // Delay the level start message slightly to avoid overlap
        setTimeout(() => {
            this.showMessage(`Level ${this.level.levelNumber} - Purge the unholy!`);
        }, 500);
    }
    
    spawnCorridorEnemies() {
        const spawns = [
            { x: 0, z: -5, type: 'scientist' },    // First encounter
            { x: -3, z: -10, type: 'scientist' },  // Near first pillar
            { x: 3, z: -12, type: 'scientist' },   // Other side
            { x: 0, z: -18, type: 'hellhound' }    // Midway guard
        ];
        spawns.forEach(spawn => this.spawnEnemy(spawn.x, 0, spawn.z, spawn.type));
    }
    
    spawnLevel1Enemies() {
        const spawns = [
            { x: 6, z: -6, type: 'scientist' },   // Right back corner
            { x: -6, z: -6, type: 'scientist' },  // Left back corner
            { x: 1, z: 7, type: 'hellhound' },    // Front center
            { x: -8, z: 0, type: 'hellhound' }    // Left side
        ];
        spawns.forEach(spawn => this.spawnEnemy(spawn.x, 0, spawn.z, spawn.type));
    }
    
    spawnLevel2Enemies() {
        const spawns = [
            // Scientists in corners
            { x: 12, z: -12, type: 'scientist' },
            { x: -12, z: -12, type: 'scientist' },
            { x: 12, z: 12, type: 'scientist' },
            { x: -12, z: 12, type: 'scientist' },
            // Hellhounds around center
            { x: 4, z: 0, type: 'hellhound' },
            { x: -4, z: 0, type: 'hellhound' },
            { x: 0, z: 4, type: 'hellhound' },
            { x: 0, z: -11, type: 'hellhound' }
        ];
        spawns.forEach(spawn => this.spawnEnemy(spawn.x, 0, spawn.z, spawn.type));
    }
    
    spawnBossEnemy() {
        // Spawn boss enemy (stronger variant)
        const boss = new window.Enemy(this.scene, new THREE.Vector3(0, 0, -10));
        boss.health = 500;
        boss.maxHealth = 500;
        boss.damage = 30;
        boss.moveSpeed = 4;
        
        // Make boss bigger
        boss.mesh.scale.set(2, 2, 2);
        
        this.enemies.push(boss);
        
        // Also spawn minions
        this.spawnEnemy(10, 0, 0, 'hellhound');
        this.spawnEnemy(-10, 0, 0, 'hellhound');
    }
    
    spawnLevelPickups() {
        const levelNum = this.level.levelNumber;
        const pickupConfigs = {
            1: [
                { x: 3, z: 3, type: 'health' },
                { x: -3, z: 3, type: 'shells' },
                { x: 0, z: -3, type: 'armor' },
                { x: 7, z: 7, type: 'shells' }
            ],
            2: [
                { x: 10, z: 10, type: 'health' },
                { x: -10, z: 10, type: 'health' },
                { x: 10, z: -10, type: 'shells' },
                { x: -10, z: -10, type: 'shells' },
                { x: 0, z: 0, type: 'armor' }
            ],
            3: [ // Boss level
                { x: 15, z: 0, type: 'health' },
                { x: -15, z: 0, type: 'health' },
                { x: 0, z: 15, type: 'shells' },
                { x: 0, z: -15, type: 'shells' },
                { x: 10, z: 10, type: 'armor' },
                { x: -10, z: -10, type: 'armor' }
            ]
        };
        
        const pickups = pickupConfigs[levelNum] || pickupConfigs[3];
        pickups.forEach(pickup => this.spawnPickup(pickup.x, 0, pickup.z, pickup.type));
    }
    
    showMessage(text) {
        // Clear any existing messages to prevent overlapping
        const existingMessages = document.querySelectorAll('.game-message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'game-message';
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.color = '#ffff00';
        messageDiv.style.fontSize = '36px';
        messageDiv.style.fontFamily = 'Times New Roman, serif';
        messageDiv.style.textShadow = '0 0 20px #ff0000';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.pointerEvents = 'none';
        messageDiv.textContent = text;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 1s';
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 1000);
        }, 2000);
    }
    
    showInteractPrompt(text) {
        let prompt = document.getElementById('interactPrompt');
        if (!prompt) {
            prompt = document.createElement('div');
            prompt.id = 'interactPrompt';
            prompt.style.cssText = `
                position: fixed;
                bottom: 200px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font-size: 18px;
                font-family: 'Courier New', monospace;
                text-shadow: 2px 2px 4px black;
                background: rgba(0,0,0,0.7);
                padding: 10px 20px;
                border: 2px solid gold;
                border-radius: 5px;
                z-index: 100;
                pointer-events: none;
            `;
            document.body.appendChild(prompt);
        }
        prompt.textContent = text;
        prompt.style.display = 'block';
    }
    
    hideInteractPrompt() {
        const prompt = document.getElementById('interactPrompt');
        if (prompt) {
            prompt.style.display = 'none';
        }
    }
    
    createExitDoor() {
        // Create regular-looking door on corridor wall, outside chapel
        const doorFrame = new THREE.Group();
        
        // Door frame
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3c28,
            roughness: 0.8
        });
        
        // Door itself
        const doorGeometry = new THREE.BoxGeometry(2, 3.5, 0.2);
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.y = 1.75;
        doorFrame.add(door);
        
        // Door handle
        const handleGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0xccaa00,
            metalness: 0.8,
            roughness: 0.3
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0.7, 1.75, 0.15);
        doorFrame.add(handle);
        
        // Position door on the right wall of corridor, before chapel entrance
        doorFrame.position.set(4.9, 0, -25); // On right wall at z=-25
        doorFrame.rotation.y = -Math.PI / 2; // Face into corridor
        
        this.exitDoor = doorFrame;
        this.exitDoorMesh = door; // Store door mesh for animation
        this.scene.add(doorFrame);
        
        // Subtle glow to indicate it's now accessible
        door.material.emissive = new THREE.Color(0x00ff00);
        door.material.emissiveIntensity = 0.1;
        
        // Add sign above door
        const signGeometry = new THREE.BoxGeometry(1.5, 0.5, 0.05);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b7355,
            roughness: 0.9
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(4.85, 3.8, -25);
        sign.rotation.y = -Math.PI / 2;
        this.scene.add(sign);
        
        this.showMessage("A door has unlocked in the corridor! Press E to enter the Armory.");
    }
    
    createTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.font = 'Bold 40px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(text, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(4, 1, 1);
        return sprite;
    }
    
    cleanseAltar() {
        if (this.chapelLevel.chapelCleansed) return; // Already cleansed
        
        this.chapelLevel.chapelCleansed = true;
        
        // Visual effect - holy light from altar
        const holyLight = new THREE.PointLight(0xffffaa, 3, 30);
        holyLight.position.set(0, 3, -48);
        this.scene.add(holyLight);
        
        // Animate holy light expanding
        let lightIntensity = 3;
        const animateLight = setInterval(() => {
            lightIntensity += 0.5;
            holyLight.intensity = lightIntensity;
            holyLight.distance = 30 + lightIntensity * 2;
            
            if (lightIntensity >= 10) {
                clearInterval(animateLight);
                // Fade out
                const fadeLight = setInterval(() => {
                    holyLight.intensity -= 0.2;
                    if (holyLight.intensity <= 1) {
                        clearInterval(fadeLight);
                        holyLight.intensity = 1;
                        holyLight.color.setHex(0xffffff);
                    }
                }, 50);
            }
        }, 50);
        
        // Remove demonic symbol
        this.scene.traverse((child) => {
            if (child.userData && child.userData.isAltar) {
                // Change altar color to purified
                child.material.color.setHex(0xffffff);
                child.material.emissive.setHex(0xffffaa);
                child.material.emissiveIntensity = 0.1;
            }
        });
        
        // Update narrative
        if (this.narrativeSystem) {
            this.narrativeSystem.setObjective("Chapel cleansed! Proceed deeper into the facility");
            this.narrativeSystem.displaySubtitle("Another desecration cleansed. How many more times must I do this?");
            this.narrativeSystem.advanceChapter();
        }
        
        // Create exit door to Chapter 2
        this.createExitDoor();
        
        // Unlock Chapter 2 in level select
        const unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels') || '["tutorial", "chapter1"]');
        if (!unlockedLevels.includes('chapter2')) {
            unlockedLevels.push('chapter2');
            localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
        }
        
        // Add score bonus
        this.addScore(1000);
        this.showMessage("Chapel Cleansed! +1000 Score!");
        
        // Heal player as reward
        this.player.health = Math.min(this.player.health + 50, 100);
    }
    
    handlePlayerDeath() {
        this.gameOver = true;
        this.deathCount++;
        
        // Release pointer lock so player can click buttons
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Death quotes based on death count (7 resurrections)
        const deathQuotes = [
            "First death... Six resurrections remain.",
            "Second death... Five resurrections remain.",
            "Third death... Four resurrections remain.",
            "Fourth death... Three resurrections remain.",
            "Fifth death... Two resurrections remain.",
            "Sixth death... One resurrection remains.",
            "Seventh death... The prophecy is fulfilled. MARTYRDOM MODE ACTIVATED!"
        ];
        
        const quote = deathQuotes[Math.min(this.deathCount - 1, 6)];
        
        // Remove any existing death screen first
        const existingDeathScreen = document.getElementById('deathScreen');
        if (existingDeathScreen) {
            existingDeathScreen.remove();
        }
        
        // Create death screen
        const deathScreen = document.createElement('div');
        deathScreen.id = 'deathScreen';
        deathScreen.style.position = 'fixed';
        deathScreen.style.top = '0';
        deathScreen.style.left = '0';
        deathScreen.style.width = '100%';
        deathScreen.style.height = '100%';
        deathScreen.style.background = 'rgba(100, 0, 0, 0.9)';
        deathScreen.style.display = 'flex';
        deathScreen.style.flexDirection = 'column';
        deathScreen.style.justifyContent = 'center';
        deathScreen.style.alignItems = 'center';
        deathScreen.style.zIndex = '2000';
        deathScreen.style.color = '#fff';
        
        deathScreen.innerHTML = `
            <h1 style="font-size: 60px; color: #ff0000; text-shadow: 0 0 20px #ff0000;">YOU HAVE FALLEN</h1>
            <p style="font-size: 24px; margin: 20px; font-style: italic;">${quote}</p>
            <p style="font-size: 18px; margin: 20px;">Death Count: ${this.deathCount} / 7</p>
            <button id="respawnButton" style="
                padding: 15px 40px;
                font-size: 24px;
                background: #800000;
                color: #fff;
                border: 2px solid #ff0000;
                cursor: pointer;
                margin-top: 20px;
            ">RISE AGAIN</button>
        `;
        
        document.body.appendChild(deathScreen);
        
        // Activate martyrdom mode on 7th death
        if (this.deathCount >= 7) {
            this.martyrdomMode = true;
            deathScreen.querySelector('h1').textContent = 'MARTYRDOM MODE';
            deathScreen.querySelector('h1').style.color = '#ffff00';
            deathScreen.querySelector('#respawnButton').textContent = 'UNLEASH DIVINE WRATH';
        }
        
        // Respawn button handler
        document.getElementById('respawnButton').addEventListener('click', () => {
            // Remove death screen immediately
            const deathScreenToRemove = document.getElementById('deathScreen');
            if (deathScreenToRemove) {
                deathScreenToRemove.remove();
            }
            this.respawn();
        });
        
        // Play death sound
        this.playDeathSound();
    }
    
    respawn() {
        this.gameOver = false;
        
        // Re-capture pointer lock for gameplay (with error handling)
        if (this.renderer && this.renderer.domElement) {
            // Use a small delay to avoid SecurityError
            setTimeout(() => {
                if (this.renderer && this.renderer.domElement) {
                    this.renderer.domElement.requestPointerLock().catch(err => {
                        // Ignore pointer lock errors - user can click to re-capture
                    });
                }
            }, 100);
        }
        
        // Reset player stats
        this.player.health = this.player.maxHealth;
        this.player.armor = 0;
        this.player.position.set(0, 1.7, 5); // Spawn slightly back from center
        this.player.velocity.set(0, 0, 0);
        this.player.rage = 0;
        
        // Apply martyrdom mode bonuses
        if (this.martyrdomMode) {
            this.player.health = 200; // Double health
            this.player.maxHealth = 200;
            this.player.moveSpeed *= 1.5; // Permanent speed boost
            this.player.rage = 100; // Start with full rage
            this.player.activateRage(); // Auto-activate rage
            
            // Give full ammo
            this.player.ammo.shells = this.player.maxAmmo.shells;
            this.player.ammo.bullets = this.player.maxAmmo.bullets;
            
            this.showMessage("MARTYRDOM MODE: Unlimited rage! Divine power courses through you!");
            
            // Make rage permanent in martyrdom mode
            this.player.rageDuration = 99999;
            this.player.rageDecayRate = 0;
        } else {
            // Normal respawn with small health penalty
            this.player.health = Math.max(50, this.player.maxHealth - (this.deathCount * 10));
            
            // Give some ammo on respawn
            this.player.ammo.shells = Math.max(4, this.player.ammo.shells);
        }
        
        // Create holy light effect on respawn
        this.createRespawnEffect();
        
        // Play respawn sound
        this.playRespawnSound();
    }
    
    createRespawnEffect() {
        // Create expanding golden sphere
        const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.BackSide
        });
        
        const respawnSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        respawnSphere.position.copy(this.player.position);
        this.scene.add(respawnSphere);
        
        // Animate expansion and fade
        const animate = () => {
            respawnSphere.scale.multiplyScalar(1.15);
            sphereMaterial.opacity -= 0.03;
            
            if (sphereMaterial.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(respawnSphere);
            }
        };
        animate();
        
        // Blind nearby enemies briefly
        this.enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(this.player.position);
            if (distance < 10) {
                enemy.state = 'hurt';
                enemy.hurtTime = 1.0; // Stun for 1 second
            }
        });
    }
    
    playDeathSound() {
        const audioContext = window.AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        // Low ominous tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(50, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(25, audioContext.currentTime + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
    }
    
    createDamageFlash() {
        // Create red screen flash overlay
        const flashDiv = document.createElement('div');
        flashDiv.style.position = 'fixed';
        flashDiv.style.top = '0';
        flashDiv.style.left = '0';
        flashDiv.style.width = '100%';
        flashDiv.style.height = '100%';
        flashDiv.style.background = 'radial-gradient(ellipse at center, rgba(255,0,0,0) 0%, rgba(255,0,0,0.6) 100%)';
        flashDiv.style.pointerEvents = 'none';
        flashDiv.style.zIndex = '999';
        flashDiv.style.opacity = '1';
        
        document.body.appendChild(flashDiv);
        
        // Fade out
        setTimeout(() => {
            flashDiv.style.transition = 'opacity 0.3s';
            flashDiv.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flashDiv);
            }, 300);
        }, 50);
    }
    
    playHurtSound() {
        const audioContext = window.AudioManager.getContext();
        if (!audioContext) return; // Exit if no audio context
        
        // Pain grunt sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    playRespawnSound() {
        const audioContext = window.AudioManager.getContext();
        
        // Heavenly choir sound
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major with octave
        
        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1 + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
            
            oscillator.start(audioContext.currentTime + index * 0.1);
            oscillator.stop(audioContext.currentTime + 1.5);
        });
    }

    switchWeapon(index) {
        if (this.player.switchWeapon(index)) {
            this.weaponSystem.switchToWeapon(this.player.currentWeapon);
        }
    }
    
    updateHUD() {
        // Safely update health value
        const healthEl = document.getElementById('healthValue');
        if (healthEl) healthEl.textContent = Math.max(0, Math.floor(this.player.health));
        
        // Safely update armor value
        const armorEl = document.getElementById('armorValue');
        if (armorEl) armorEl.textContent = Math.floor(this.player.armor);
        
        // Update level display
        const levelEl = document.getElementById('levelValue');
        if (levelEl && this.level) levelEl.textContent = this.level.levelNumber;
        
        // Update score display
        const scoreEl = document.getElementById('scoreValue');
        if (scoreEl) scoreEl.textContent = this.score;
        
        // Update kills display
        const killsEl = document.getElementById('killsValue');
        if (killsEl) killsEl.textContent = this.kills;
        
        // Update rage display
        const ragePercent = Math.floor((this.player.rage / this.player.maxRage) * 100);
        const rageBar = document.getElementById('rage');
        
        if (rageBar) {
            if (this.player.isRaging) {
                rageBar.style.borderColor = '#ffff00';
                rageBar.innerHTML = `HOLY RAGE: <span style="color: #ffff00;">ACTIVE!</span>`;
            } else if (this.player.rage >= this.player.maxRage) {
                rageBar.style.borderColor = '#ff00ff';
                rageBar.innerHTML = `HOLY RAGE: <span style="color: #ff00ff;">READY!</span>`;
            } else {
                rageBar.style.borderColor = '#ff00ff';
                rageBar.innerHTML = `HOLY RAGE: <span id="rageValue">${ragePercent}</span>%`;
            }
        }
        
        // Update ammo display
        const ammoEl = document.getElementById('ammo');
        if (ammoEl) {
            switch(this.player.currentWeapon) {
                case 'shotgun':
                    ammoEl.innerHTML = `SHELLS: <span>${this.player.ammo.shells}</span>`;
                    ammoEl.style.borderColor = '#ff8800';
                    break;
                case 'holywater':
                    ammoEl.innerHTML = `HOLY WATER: <span>${this.player.holyWaterCount}</span>`;
                    ammoEl.style.borderColor = '#00ccff';
                    break;
                case 'crucifix':
                    ammoEl.innerHTML = `CRUCIFIXES: <span>${this.player.ammo.rockets}</span>`;
                    ammoEl.style.borderColor = '#ffaa00';
                    break;
                default: // sword
                    ammoEl.innerHTML = 'BLESSED: ∞';
                    ammoEl.style.borderColor = '#ffff44';
            }
        }
    }

    addScore(points) {
        // Combo multiplier system
        if (this.comboTimer > 0) {
            this.combo++;
            points *= Math.min(this.combo, 5); // Max 5x multiplier
        } else {
            this.combo = 1;
        }
        
        this.score += points;
        this.comboTimer = 2; // 2 seconds to maintain combo
        
        // Show floating score text (could be enhanced with actual floating text)
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseMenu = document.getElementById('pauseMenu');
        const clickToResume = document.getElementById('clickToResume');
        
        if (this.isPaused) {
            pauseMenu.style.display = 'flex';
            document.exitPointerLock();
            if (clickToResume) clickToResume.style.display = 'none';
        } else {
            pauseMenu.style.display = 'none';
            document.getElementById('settingsPanel').style.display = 'none';
            // Show click to resume message briefly
            if (clickToResume) {
                clickToResume.style.display = 'block';
                setTimeout(() => {
                    clickToResume.style.display = 'none';
                }, 1500);
            }
        }
    }
    
    restartLevel() {
        // Reset player health and position
        this.player.health = this.martyrdomMode ? 200 : 100;
        this.player.position.set(0, 1.7, 5);
        this.player.velocity.set(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        
        // Clear enemies
        this.enemies.forEach(enemy => {
            if (enemy.mesh) {
                this.scene.remove(enemy.mesh);
            }
        });
        this.enemies = [];
        
        // Respawn enemies for current level
        this.spawnLevelEnemies();
        
        // Reset pickups
        this.pickups.forEach(pickup => this.cleanupPickup(pickup));
        this.pickups = [];
        this.spawnLevelPickups();
        
        // Close menus and resume
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('settingsPanel').style.display = 'none';
        this.isPaused = false;
        this.gameOver = false;
        this.renderer.domElement.requestPointerLock();
    }
    
    respawnPlayer() {
        // Reset player health and position
        this.player.health = this.player.maxHealth;
        this.player.armor = 50; // Give some armor on respawn
        this.player.isDead = false;
        
        // Reset player position to spawn point
        this.player.position.set(0, 1.7, 0);
        this.player.velocity.set(0, 0, 0);
        this.player.pitch = 0;
        this.player.yaw = 0;
        
        // Update camera
        this.camera.position.copy(this.player.position);
        this.camera.rotation.set(0, 0, 0);
        
        // Hide death screen and resume game
        document.getElementById('deathScreen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';
        
        // Resume game
        this.isPaused = false;
        this.isRunning = true;
        
        // Don't automatically request pointer lock - player will click canvas to resume
        // document.getElementById('gameCanvas').requestPointerLock();
    }
    
    quitToTitle() {
        // Stop game
        this.isRunning = false;
        this.isPaused = false;
        
        // Clear all entities
        this.enemies.forEach(enemy => this.cleanupEnemy(enemy));
        this.enemies = [];
        
        this.pickups.forEach(pickup => this.cleanupPickup(pickup));
        this.pickups = [];
        
        // Hide all menus and show start screen
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('settingsPanel').style.display = 'none';
        document.getElementById('deathScreen').style.display = 'none';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        
        // Exit pointer lock
        document.exitPointerLock();
        
        // Reset game state
        this.currentLevel = 1;
        this.deathCount = 0;
        this.martyrdomMode = false;
    }
    
    loadLevel(levelName) {
        // Clear existing level
        if (this.currentLevelInstance) {
            if (this.currentLevelInstance.clearLevel) {
                this.currentLevelInstance.clearLevel();
            }
        }
        
        // Clear all level-specific references
        this.tutorialLevel = null;
        this.chapelLevel = null;
        this.armoryLevel = null;
        this.exitDoor = null;
        this.exitDoorMesh = null;
        this.doorOpening = false;
        
        // Clear enemies
        this.enemies.forEach(enemy => this.cleanupEnemy(enemy));
        this.enemies = [];
        
        // Clear all non-essential scene objects
        const objectsToKeep = new Set();
        objectsToKeep.add(this.camera);
        if (this.player && this.player.shadowMesh) {
            objectsToKeep.add(this.player.shadowMesh);
        }
        
        // Find weapon meshes to keep
        this.scene.traverse((child) => {
            if (child.userData?.isWeapon || child.userData?.isPlayer) {
                objectsToKeep.add(child);
            }
        });
        
        // Remove all meshes and lights except those we want to keep
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if ((child.isMesh || child.isLight) && !objectsToKeep.has(child)) {
                // Don't remove ambient or directional lights (keep basic lighting)
                if (child.isLight && (child.isAmbientLight || child.isDirectionalLight)) {
                    return;
                }
                objectsToRemove.push(child);
            }
        });
        
        objectsToRemove.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            this.scene.remove(obj);
        });
        
        // Create new level based on name
        switch(levelName) {
            case 'tutorial':
                if (window.TutorialLevel) {
                    this.tutorialLevel = new window.TutorialLevel(this.scene, this);
                    this.currentLevelInstance = this.tutorialLevel;
                    this.level = new window.Level(this.scene);
                    const tutorialWalls = this.tutorialLevel.create();
                    this.level.walls = tutorialWalls || [];
                    
                    // Start position for tutorial
                    this.player.position.set(0, 1.7, 0);
                }
                break;
                
            case 'chapter1':
                if (window.ChapelLevel) {
                    this.chapelLevel = new window.ChapelLevel(this.scene, this);
                    this.currentLevelInstance = this.chapelLevel;
                    this.level = new window.Level(this.scene);
                    const chapelWalls = this.chapelLevel.create();
                    this.level.walls = chapelWalls || [];
                    
                    // Exit door will be created after cleansing the altar
                    
                    // Restore all weapons for Chapter 1
                    this.player.weapons = ['sword', 'shotgun', 'holywater', 'crucifix'];
                    this.player.currentWeaponIndex = 0;
                    this.player.currentWeapon = 'sword';
                    this.weaponSystem.switchToWeapon('sword');
                    
                    // Start position for chapter 1
                    this.player.position.set(0, 1.7, 8);
                    
                    // Don't play intro again if coming from tutorial
                    // The intro already played during init for non-tutorial starts
                }
                break;
                
            case 'chapter2':
                if (window.ArmoryLevel) {
                    this.armoryLevel = new window.ArmoryLevel(this.scene, this);
                    this.currentLevelInstance = this.armoryLevel;
                    this.level = new window.Level(this.scene);
                    const armoryWalls = this.armoryLevel.create();
                    this.level.walls = armoryWalls || [];
                    
                    // Restore all weapons for Chapter 2
                    this.player.weapons = ['sword', 'shotgun', 'holywater', 'crucifix'];
                    this.player.currentWeaponIndex = 0;
                    this.player.currentWeapon = 'sword';
                    this.weaponSystem.switchToWeapon('sword');
                    
                    // Start position for chapter 2
                    this.player.position.set(0, 1.7, 8);
                    
                    if (this.narrativeSystem) {
                        this.narrativeSystem.currentChapter = 1;
                        this.narrativeSystem.setObjective("Reach the armory");
                    }
                }
                break;
                
            case 'laboratory':
                // Load Laboratory Complex level
                if (window.LaboratoryLevel) {
                    this.laboratoryLevel = new window.LaboratoryLevel(this);
                    this.currentLevelInstance = this.laboratoryLevel;
                    const levelData = this.laboratoryLevel.create();
                    this.level = new window.Level(this.scene);
                    this.level.walls = levelData.walls || [];
                    this.enemies = levelData.enemies || [];
                    
                    // Player has collected weapons from armory
                    this.player.weapons = ['sword', 'shotgun', 'rifle', 'holywater', 'crucifix'];
                    this.player.position.set(0, 1.7, 0);
                    
                    if (this.narrativeSystem) {
                        this.narrativeSystem.setObjective("Find keycards and access the main lab");
                    }
                } else {
                    console.warn('Laboratory level not loaded, falling back to test level');
                    this.loadLevel('chapter2'); // Fall back to armory
                }
                break;
                
            default:
                // Fallback to test level
                this.level = new Level(this.scene);
                this.level.createTestLevel();
                this.player.position.set(0, 1.7, 0);
        }
        
        // Reset player state
        this.player.velocity.set(0, 0, 0);
        this.player.health = 100;
    }
}
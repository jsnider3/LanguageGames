import * as THREE from 'three';
// Game Module  
// Main game class containing all game logic, state management, and level handling

// Import required modules
import { GAME_CONFIG } from './GameConfig.js';
import { InputManager } from './InputManager.js';
import { Player } from './Player.js';
import { CollisionSystem } from './CollisionSystem.js';
import { WeaponSystem } from './WeaponSystem.js';
import { LevelFactory } from './LevelFactory.js';
import { PoolManager } from './ObjectPool.js';
import { LODManager } from './LODManager.js';
import { AnimationManager } from './AnimationManager.js';
import { ShadowOptimizer } from './ShadowOptimizer.js';
import { GeometryBatcher } from './GeometryBatcher.js';
import { TimerManager } from './TimerManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { ZoneManager } from './ZoneManager.js';
import { AudioManager } from './Utils.js';
import { Config } from './config/index.js';
import { Hellhound } from '../enemies/hellhound.js';
import { PossessedScientist } from '../enemies/possessedScientist.js';
import { Imp } from '../enemies/imp.js';
import { ZombieAgent } from '../enemies/zombieAgent.js';
import { DemonKnight } from '../enemies/demonKnight.js';
import { ShadowWraith } from '../enemies/shadowWraith.js';
import { Succubus } from '../enemies/succubus.js';
import { CorruptedDrone } from '../enemies/corruptedDrone.js';
import { BrimstoneGolem } from '../enemies/brimstoneGolem.js';
import { PossessedMechSuit } from '../enemies/possessedMechSuit.js';
import { AlienHybrid } from '../enemies/alienHybrid.js';

import { FacilityMap } from './FacilityMap.js';
import { Pickup } from './Pickup.js';

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
        this.divineWrathUsed = false; // Track if divine wrath has been used after death
        this.respawnTimer = 0;
        this.score = 0;
        this.damageQueued = 0;
        this._lastHudUpdate = 0;
        this._dom = null;
        
        // Store base player stats for resetting after divine wrath
        this.basePlayerStats = {
            maxHealth: 100,
            moveSpeed: 5,
            rageDuration: 10,
            rageDecayRate: 1
        };
        this.kills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        
        // Initialize level factory
        this.levelFactory = null;
        
        // Performance optimization systems
        this.poolManager = null;
        this.lodManager = null;
        this.animationManager = null;
        this.shadowOptimizer = null;
        this.geometryBatcher = null;
        this.timerManager = null;
        
        // Performance monitoring
        this.frameCount = 0;
        this.fps = 60;
        this.lastFPSUpdate = 0;
        
        // Debug mode
        this.debugMode = false;
    }

    async init(levelName = 'tutorial') {
        this.currentLevel = levelName;
        
        // Initialize persistent level states
        this.levelStates = new Map();
        this.loadLevelStates();
        
        this.setupRenderer();
        this.setupScene();
        // Prepare debug overlay
        this.ensureDebugOverlay();
        
        // Initialize performance systems with error handling
        try {
            this.poolManager = new PoolManager(this.scene);
            this.lodManager = new LODManager(this.camera, this.scene);
            // Tune LOD distances from config if available
            try {
                const d = Config?.engine?.PERFORMANCE?.LOD_DISTANCES;
                if (Array.isArray(d) && d.length >= 3) {
                    this.lodManager.setDistances(d[0], d[1], d[2]);
                }
            } catch (e) { /* no-op */ }
            this.animationManager = new AnimationManager();
            this.shadowOptimizer = new ShadowOptimizer(this.renderer, this.scene);
            this.geometryBatcher = new GeometryBatcher(this.scene);
            this.timerManager = new TimerManager();
            this.physicsManager = new PhysicsManager(this.scene);
            this.zoneManager = new ZoneManager(this);
            
            // Initialize Facility Map if available
            if (this.zoneManager) {
                this.facilityMap = new FacilityMap(this.zoneManager);
            }
            
            if (this.debugMode) {
                console.log('Performance systems initialized successfully');
                this.updateDebugOverlay();
            }
        } catch (error) {
            console.error('Error initializing performance systems:', error);
            console.warn('Game will continue without performance optimizations');
            
            // Set all to null so the game can still run
            this.poolManager = null;
            this.lodManager = null;
            this.animationManager = null;
            this.shadowOptimizer = null;
            this.geometryBatcher = null;
            this.timerManager = null;
        }
        
        // Initialize level factory
        this.levelFactory = new LevelFactory(this);
        
        this.clock = new THREE.Clock();
        this.inputManager = new InputManager(this);
        this.collisionSystem = new CollisionSystem();
        this.collisionSystem.game = this;  // Pass game reference for chapel level check
        
        this.player = new Player(this.camera);
        this.player.game = this; // Set game reference
        this.scene.add(this.player.shadowMesh); // Add shadow-casting mesh to scene
        
        // Register player with physics system
        if (this.physicsManager) {
            this.physicsManager.registerEntity(this.player, {
                hasGravity: true,
                isFlying: false,
                mass: 1,
                radius: 0.4,
                height: 1.8,
                groundOffset: 1.7,  // Player position is at eye level (1.7), not at feet
                friction: 0.95
            });
        }
        
        this.weaponSystem = new WeaponSystem(this.player, this.scene, this.camera);
        
        // Initialize narrative system
        try {
            const module = await import('../narrative.js');
            if (module && module.NarrativeSystem) {
                this.narrativeSystem = new module.NarrativeSystem(this);
            }
        } catch (e) {
            // Narrative system optional
        }
        
        // Show initial weapon (but not in tutorial)
        if (levelName !== 'tutorial') {
            this.weaponSystem.switchToWeapon('sword');
        } else {
            // Hide all weapons in tutorial until instructed
            this.weaponSystem.activeWeaponType = null; // Explicitly set no active weapon
            Object.values(this.weaponSystem.weapons).forEach(weapon => {
                if (weapon.hide) weapon.hide();
            });
        }
        
        // Clear enemies and reset
        this.enemies = [];
        this.gameOver = false;
        this.isRunning = false;
        
        // Start with loading the level (await it)
        await this.loadLevel(levelName);
        
        // Hide start screen and show game UI
        document.getElementById('startScreen').style.display = 'none';
        // Only show instructions for non-tutorial levels
        if (levelName !== 'tutorial') {
            const instructions = document.getElementById('instructions');
            if (instructions) instructions.style.display = 'block';
        }
        
        // Initialize UI after level is loaded
        this.cacheDomElements();
        this.updateHUD(true);
        
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

    ensureDebugOverlay() {
        if (document.getElementById('debugOverlay')) return;
        const el = document.createElement('div');
        el.id = 'debugOverlay';
        el.style.cssText = [
            'position:fixed',
            'top:10px',
            'left:10px',
            'padding:8px 10px',
            'background:rgba(0,0,0,0.6)',
            'color:#0f0',
            'font:12px/1.4 monospace',
            'z-index:2000',
            'pointer-events:none',
            'white-space:pre',
            'display:none'
        ].join(';');
        document.body.appendChild(el);
    }

    setDebugOverlayVisible(visible) {
        const el = document.getElementById('debugOverlay');
        if (el) el.style.display = visible ? 'block' : 'none';
    }

    cacheDomElements() {
        this._dom = {
            healthEl: document.getElementById('healthValue'),
            armorEl: document.getElementById('armorValue'),
            levelEl: document.getElementById('levelValue'),
            scoreEl: document.getElementById('scoreValue'),
            killsEl: document.getElementById('killsValue'),
            rageBar: document.getElementById('rage'),
            ammoEl: document.getElementById('ammo')
        };
    }

    updateDebugOverlay() {
        if (!this.debugMode) { this.setDebugOverlayVisible(false); return; }
        this.setDebugOverlayVisible(true);
        const el = document.getElementById('debugOverlay');
        if (!el) return;
        const info = this.getPerformanceReport();
        const activeZones = this.zoneManager ? this.zoneManager.activeZones?.size || 0 : 0;
        const perfMode = this.zoneManager ? this.zoneManager.performanceMode : 'n/a';
        const bullets = info.poolStats?.bullets?.active ?? 0;
        const particles = info.poolStats?.particles?.active ?? 0;
        // Add player position
        const playerPos = this.player ? 
            `X:${this.player.position.x.toFixed(1)} Y:${this.player.position.y.toFixed(1)} Z:${this.player.position.z.toFixed(1)}` : 
            'X:-- Y:-- Z:--';
        
        el.textContent =
`FPS: ${info.fps}
DrawCalls: ${info.drawCalls} Tris: ${info.triangles}
Geoms: ${info.geometries} Tex: ${info.textures}
Pools  bullets:${bullets} particles:${particles}
Zones  active:${activeZones} mode:${perfMode}
Player: ${playerPos}`;
    }
    
    setupRenderer() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // Slightly faster than PCFSoft
        this.renderer.shadowMap.autoUpdate = false; // Manual control for optimization
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
        console.log("Game.setupScene(): Camera UUID: ", this.camera.uuid);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = false; // Will be controlled by ShadowOptimizer
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        this.scene.add(dirLight);
        
        // Register with shadow optimizer (high priority for main light)
        if (this.shadowOptimizer) {
            this.shadowOptimizer.registerShadowLight(dirLight, 100);
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
        
        // Debug: Check camera parent (avoid per-frame logs unless debugging)
        if (this.debugMode) {
            if (this.camera && this.camera.parent) {
                console.log("Camera parent:", this.camera.parent.type);
            } else {
                console.log("Camera has no parent!");
            }
        }
    }

    spawnEnemy(x, y, z, type = 'possessed_scientist') {
        let enemy;
        const position = new THREE.Vector3(x, y, z);
        
        // Handle all enemy types
        switch(type.toLowerCase()) {
            case 'hellhound':
                enemy = new Hellhound(this.scene, position);
                break;
            case 'possessed_scientist':
            case 'scientist':
                enemy = new PossessedScientist(this.scene, position);
                break;
            case 'imp':
                enemy = new Imp(this.scene, position);
                break;
            case 'zombie_agent':
            case 'zombie':
                enemy = new ZombieAgent(this.scene, position);
                break;
            case 'demon_knight':
            case 'knight':
                enemy = new DemonKnight(this.scene, position);
                break;
            case 'shadow_wraith':
            case 'wraith':
                enemy = new ShadowWraith(this.scene, position);
                break;
            case 'succubus':
                enemy = new Succubus(this.scene, position);
                break;
            case 'corrupted_drone':
            case 'drone':
                enemy = new CorruptedDrone(this.scene, position);
                break;
            case 'brimstone_golem':
            case 'golem':
                enemy = new BrimstoneGolem(this.scene, position);
                break;
            case 'possessed_mech_suit':
            case 'mech_suit':
            case 'mech':
                enemy = new PossessedMechSuit(this.scene, position);
                break;
            case 'alien_hybrid':
            case 'hybrid':
                enemy = new AlienHybrid(this.scene, position);
                break;
            default:
                console.warn(`Unknown enemy type: ${type}, defaulting to PossessedScientist`);
                enemy = new PossessedScientist(this.scene, position);
                break;
        }
        // Provide back-reference to game for pooled effects, etc.
        enemy.game = this;
        
        // Register with physics system if available
        if (this.physicsManager) {
            // Determine if enemy is flying based on type
            const flyingTypes = ['imp', 'succubus', 'corrupted_drone', 'shadow_wraith'];
            const isFlying = flyingTypes.includes(type.toLowerCase());
            
            this.physicsManager.registerEntity(enemy, {
                isFlying: isFlying,
                hasGravity: !isFlying,
                mass: enemy.mass || 1,
                radius: enemy.radius || 0.3,
                height: enemy.height || 1.8,
                groundOffset: 0.1 // Keep slightly above ground
            });
        }
        
        this.enemies.push(enemy);
    }
    
    spawnPickup(x, y, z, type) {
        const pickup = new Pickup(this.scene, new THREE.Vector3(x, y, z), type);
        this.pickups.push(pickup);
    }

    update(deltaTime) {
        if (this.isPaused || this.gameOver) return;
        
        // Debug: Track player position changes
        const oldPlayerX = this.player ? this.player.position.x : 0;
        
        // Get input first since we need it for player movement
        const input = this.inputManager.getInput();
        
        // During zone transitions, only update essential systems
        if (this.zoneManager && this.zoneManager.activeTransition) {
            // Update player movement and physics during transitions
            this.updatePlayer(deltaTime, input);
            
            // Update physics system so player can walk in transition zones
            if (this.physicsManager && this.level && this.level.walls) {
                this.physicsManager.update(deltaTime, this.level.walls);
            }
            
            // Allow weapon usage during transitions
            this.handleWeaponInput(input);
            this.handleCombat(input, deltaTime);
            
            // Update weapon system
            if (this.weaponSystem) {
                this.weaponSystem.update(deltaTime, []);  // No enemies during transitions
            }
            
            // Update camera effects
            this.applyCameraEffects();
            
            // The corridor transition handles its own completion via E key
            // Don't auto-complete based on position
            
            // Don't update enemies, pickups, etc during transitions
            return;
        }
        
        // Update zone manager predictive loading
        if (this.zoneManager) {
            this.zoneManager.updatePredictiveLoading();
            this.zoneManager.updatePerformanceMode();
        }
        
        // Update facility map
        if (this.facilityMap) {
            this.facilityMap.update();
        }
        
        // Update performance monitoring
        this.updatePerformanceStats(deltaTime);
        if (this.debugMode) this.updateDebugOverlay();
        
        this.updateComboTimer(deltaTime);
        
        // Core game updates
        this.updatePlayer(deltaTime, input);
        
        
        this.handleWeaponInput(input);
        this.handleCombat(input, deltaTime);
        this.updateEnemies(deltaTime);
        this.handlePlayerDamage();
        this.updatePickups(deltaTime);
        this.updateCollisions(deltaTime);

        // Run per-frame level logic (objectives, hazards, animations, etc.)
        if (this.currentLevelInstance && typeof this.currentLevelInstance.update === 'function') {
            this.currentLevelInstance.update(deltaTime, input);
        }
        
        
        // Throttle HUD updates to reduce DOM work
        const nowMs = Date.now();
        const hudInterval = (GAME_CONFIG && GAME_CONFIG.UI && GAME_CONFIG.UI.HUD_UPDATE_RATE) ? GAME_CONFIG.UI.HUD_UPDATE_RATE : 100;
        if (nowMs - this._lastHudUpdate >= hudInterval) {
            this.updateHUD();
            this._lastHudUpdate = nowMs;
        }
        
        // Update performance systems
        if (this.poolManager) this.poolManager.update(deltaTime);
        if (this.lodManager) this.lodManager.update(deltaTime);
        if (this.animationManager) this.animationManager.update(deltaTime);
        if (this.shadowOptimizer) this.shadowOptimizer.update(this.camera, deltaTime);
        // Note: TimerManager doesn't need per-frame updates
        
        // Level-specific updates
        this.updateLevelSpecificLogic(deltaTime, input);
        
        // Clean up broken enemies or handle deaths that weren't caught by combat
        this.cleanupDeadAndInvalidEnemies();
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
        
        // Check chapel exit door interaction
        if (this.chapelLevel && this.chapelLevel.exitDoor) {
            const doorPos = this.chapelLevel.exitDoor.position;
            const doorDistance = this.player.position.distanceTo(doorPos);
            
            // Show prompt when near door
            if (doorDistance < 3) {
                const door = this.chapelLevel.exitDoor;
                
                if (door.userData.locked && door.userData.requiresCleansing) {
                    this.showInteractPrompt("The door is sealed. Cleanse the chapel first.");
                } else if (!door.userData.locked) {
                    this.showInteractPrompt("Press E to enter the Armory");
                    
                    if (input.interact && !this.isTransitioning) {
                        // Use zone transition instead of direct loading
                        if (this.zoneManager) {
                            this.isTransitioning = true;
                            this.hideInteractPrompt();
                            this.zoneManager.triggerTransition('chapel', 'armory', this.player);
                        } else {
                            // Fallback to direct loading
                            this.loadLevel('armory');
                        }
                    }
                }
            } else {
                this.hideInteractPrompt();
            }
        }
        
        this.applyCameraEffects();
        this.checkPlayerDeath();
    }
    
    updateLevelSpecificLogic(deltaTime, input) {
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
            this.updateArmoryLevel(deltaTime);
        }
        
        // Update laboratory level if active
        if (this.currentLevelInstance && this.currentLevelInstance.levelName === 'Laboratory Complex') {
            this.updateLaboratoryLevel(deltaTime);
        }
        
        // Handle chapel cleansing
        this.handleChapelCleansing(input);
    }
    
    updateArmoryLevel(deltaTime) {
        this.armoryLevel.checkWeaponCollection(this.player.position);
        this.armoryLevel.checkExitCondition();
        
        // Check for return to chapel
        if (this.armoryLevel.checkChapelDoorCollision) {
            const returnLevel = this.armoryLevel.checkChapelDoorCollision(this.player);
            if (returnLevel && returnLevel !== 'transition') {
                // Only load level if not a transition (transition handles itself)
                this.loadLevel(returnLevel); // Return to chapel
                return;
            }
        }
        
        // Check for elevator interaction
        if (this.armoryLevel && this.armoryLevel.checkElevatorInteraction) {
            const result = this.armoryLevel.checkElevatorInteraction(this.player);
            if (result === true) {
                this.loadLevel('laboratory'); // Load the Laboratory Complex level
            }
            // If result is 'transition', the ZoneManager handles it
        }
    }
    
    updateLaboratoryLevel(deltaTime) {
        // Check for level exit
        if (this.currentLevelInstance.checkExitCollision && this.currentLevelInstance.checkExitCollision(this.player)) {
            console.log('Laboratory level complete! Loading next level...');
            this.loadLevel('containment'); // Load the Containment level
        }
    }
    
    handleChapelCleansing(input) {
        // Skip if no chapel level or if in transition
        if (!this.chapelLevel) return;
        if (this.zoneManager && this.zoneManager.activeTransition) return;
        
        if (this.chapelLevel) {
            // Let the chapel level handle its own exit door
            if (this.chapelLevel.checkExitDoorCollision) {
                const transitionLevel = this.chapelLevel.checkExitDoorCollision(this.player);
                if (transitionLevel && transitionLevel !== 'transition') {
                    // Only load level if not a transition (transition handles itself)
                    this.loadLevel(transitionLevel);
                    return;
                }
            }
            
            // Original cleansing logic
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
        }
    }
    
    cleanupDeadAndInvalidEnemies() {
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
        
        // Unregister from physics system
        if (this.physicsManager && this.physicsManager.unregisterEntity) {
            this.physicsManager.unregisterEntity(enemy);
        }
        
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
        if (AudioManager) {
            AudioManager.playDeath();
            // Occasionally play a voice line
            if (Math.random() < 0.3) {
                AudioManager.playVoiceLine('demonKill');
            }
        }
        
        // Trigger narrative system for enemy death
        if (this.narrativeSystem) {
            this.narrativeSystem.onEnemyKilled(enemy.type || 'demon');
        }
        
        setTimeout(() => this.cleanupEnemy(enemy), 2000);
    }
    
    updateEnemies(deltaTime) {
        // Get current level walls
        const level = this.currentLevelInstance || this.level || this.armoryLevel || this.chapelLevel;
        const walls = level ? level.walls || [] : [];
        
        // Update physics for all registered entities first
        if (this.physicsManager) {
            this.physicsManager.update(deltaTime, walls);
        }
        
        this.enemies.forEach(enemy => {
            
            // Then update enemy AI
            enemy.update(deltaTime, this.player);
            
            // Then check collisions
            this.collisionSystem.checkEnemyWallCollisions(enemy, walls, deltaTime, level);
        });
    }
    
    handlePlayerDamage() {
        if (this.damageQueued > 0) {
            // Add screen shake based on accumulated damage
            this.cameraShake = Math.min(0.5, this.damageQueued * GAME_CONFIG.COMBAT.CAMERA_SHAKE_MULTIPLIER);
            // Red flash effect
            this.createDamageFlash();
            // Play hurt sound
            this.playHurtSound();
            // Reset queue
            this.damageQueued = 0;
        }
    }

    queuePlayerDamage(amount) {
        if (!amount || isNaN(amount)) return;
        this.damageQueued += amount;
    }
    
    updatePickups(deltaTime) {
        this.pickups = this.pickups.filter(pickup => {
            pickup.update(deltaTime, this.player, this);
            return !pickup.collected;
        });
    }
    
    updateCollisions(deltaTime) {
        // Check all collisions (walls and enemies)
        // Use currentLevelInstance for all levels, or fall back to this.level for tutorial
        const level = this.currentLevelInstance || this.level || this.armoryLevel || this.chapelLevel;
        
        if (!level) {
            console.warn('Level not initialized in updateCollisions');
            return;
        }
        
        // Skip collision checking during transitions
        if (this.skipCollisionCheck) {
            return;
        }
        
        const walls = level.walls || [];
        // Rebuild spatial index for enemies to reduce collision checks
        if (this.collisionSystem && this.enemies) {
            this.collisionSystem.updateSpatialIndex(this.enemies);
        }
        this.collisionSystem.checkPlayerWallCollisions(this.player, walls, deltaTime, level, this.enemies);
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
        this.interactPromptText = text; // Store for checking later
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
        
        // Unlock the existing exit door to Armory (don't create a new one)
        if (this.chapelLevel && this.chapelLevel.unlockExitDoor) {
            this.chapelLevel.unlockExitDoor();
        }
        
        // Unlock Armory in level select
        const unlockedLevels = JSON.parse(localStorage.getItem('unlockedLevels') || '["tutorial", "chapel"]');
        if (!unlockedLevels.includes('armory')) {
            unlockedLevels.push('armory');
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
        
        // Reset player stats if divine wrath was active
        if (this.martyrdomMode && this.divineWrathUsed && this.basePlayerStats.stored) {
            this.player.maxHealth = this.basePlayerStats.maxHealth;
            this.player.moveSpeed = this.basePlayerStats.moveSpeed;
            this.player.rageDuration = this.basePlayerStats.rageDuration;
            this.player.rageDecayRate = this.basePlayerStats.rageDecayRate;
            this.player.isRaging = false; // Stop rage mode
        }
        
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
                transition: all 0.2s;
                outline: none;
                user-select: none;
                position: relative;
                z-index: 2001;
            " onmouseover="this.style.background='#aa0000'; this.style.transform='scale(1.05)'" 
               onmouseout="this.style.background='#800000'; this.style.transform='scale(1)'"
               onmousedown="this.style.transform='scale(0.95)'"
               onmouseup="this.style.transform='scale(1.05)'">RISE AGAIN</button>
        `;
        
        document.body.appendChild(deathScreen);
        
        // Activate martyrdom mode on 7th death
        if (this.deathCount >= 7) {
            this.martyrdomMode = true;
            deathScreen.querySelector('h1').textContent = 'MARTYRDOM MODE';
            deathScreen.querySelector('h1').style.color = '#ffff00';
            
            // Only show divine wrath option if not used yet this death
            if (!this.divineWrathUsed) {
                deathScreen.querySelector('#respawnButton').textContent = 'UNLEASH DIVINE WRATH';
            } else {
                deathScreen.querySelector('#respawnButton').textContent = 'RESPAWN';
                // Add note that divine wrath was already used
                const note = document.createElement('p');
                note.textContent = 'Divine Wrath already unleashed';
                note.style.color = '#888888';
                note.style.fontSize = '14px';
                note.style.marginTop = '10px';
                deathScreen.querySelector('#respawnButton').parentNode.appendChild(note);
            }
        }
        
        // Prevent pointer lock capture while death screen is visible
        const preventPointerLock = (e) => {
            if (document.getElementById('deathScreen')) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Temporarily block pointer lock requests on the canvas
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.addEventListener('click', preventPointerLock, true);
        }
        
        // Respawn button handler
        const respawnBtn = document.getElementById('respawnButton');
        if (respawnBtn) {
            // Prevent default browser behavior
            respawnBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            
            // Handle actual click
            respawnBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove death screen immediately
                const deathScreenToRemove = document.getElementById('deathScreen');
                if (deathScreenToRemove) {
                    deathScreenToRemove.remove();
                }
                
                // Remove the pointer lock prevention after a short delay
                setTimeout(() => {
                    if (this.renderer && this.renderer.domElement) {
                        this.renderer.domElement.removeEventListener('click', preventPointerLock, true);
                    }
                }, 100);
                
                this.respawn();
            });
            
            // Also handle keyboard Enter/Space on the button
            respawnBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    respawnBtn.click();
                }
            });
            
            // Focus the button so Enter key works immediately
            respawnBtn.focus();
        }
        
        // Play death sound
        this.playDeathSound();
    }
    
    respawn() {
        this.gameOver = false;
        this.isPaused = false; // Make sure game is unpaused
        
        // Reset input manager to clear any stuck states
        if (this.inputManager && this.inputManager.reset) {
            this.inputManager.reset();
        }
        
        // Hide any pause menus that might be visible
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) pauseMenu.style.display = 'none';
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) settingsPanel.style.display = 'none';
        const clickToResume = document.getElementById('clickToResume');
        if (clickToResume) clickToResume.style.display = 'none';
        
        // Re-capture pointer lock for gameplay (with error handling)
        if (this.renderer && this.renderer.domElement) {
            // Use a longer delay to ensure death screen is fully removed
            setTimeout(() => {
                if (this.renderer && this.renderer.domElement) {
                    // Only request pointer lock if death screen is gone
                    if (!document.getElementById('deathScreen')) {
                        // Use document.body for consistency
                        document.body.requestPointerLock().catch(err => {
                            // Silently ignore - user can click to re-capture
                            console.log('Click game area to resume');
                        });
                    }
                }
            }, 500); // Increased delay to ensure UI is ready
        }
        
        // Reset player stats
        this.player.health = this.player.maxHealth;
        this.player.armor = 0;
        this.player.position.set(0, 1.7, 5); // Spawn slightly back from center
        this.player.velocity.set(0, 0, 0);
        this.player.rage = 0;
        
        // Apply martyrdom mode bonuses
        if (this.martyrdomMode && !this.divineWrathUsed) {
            // First time using divine wrath after 7 deaths
            this.divineWrathUsed = true;
            
            // Store original values if not stored yet
            if (!this.basePlayerStats.stored) {
                this.basePlayerStats.maxHealth = this.player.maxHealth;
                this.basePlayerStats.moveSpeed = this.player.moveSpeed;
                this.basePlayerStats.rageDuration = this.player.rageDuration || 10;
                this.basePlayerStats.rageDecayRate = this.player.rageDecayRate || 1;
                this.basePlayerStats.stored = true;
            }
            
            // Apply divine wrath buffs (temporary for this life)
            this.player.health = 200; // Double health
            this.player.maxHealth = 200;
            this.player.moveSpeed = this.basePlayerStats.moveSpeed * 1.5; // 50% speed boost
            this.player.rage = 100; // Start with full rage
            this.player.activateRage(); // Auto-activate rage
            
            // Give full ammo
            this.player.ammo.shells = this.player.maxAmmo.shells;
            this.player.ammo.bullets = this.player.maxAmmo.bullets;
            
            this.showMessage("DIVINE WRATH UNLEASHED! One-time divine power granted!");
            
            // Make rage permanent for this life only
            this.player.rageDuration = 99999;
            this.player.rageDecayRate = 0;
            
            // Execute divine wrath explosion immediately
            this.executeDivineWrathExplosion();
        } else if (this.martyrdomMode && this.divineWrathUsed) {
            // Already used divine wrath, reset to base stats for normal respawn
            // Reset player stats to original values
            this.player.maxHealth = this.basePlayerStats.maxHealth;
            this.player.moveSpeed = this.basePlayerStats.moveSpeed;
            this.player.rageDuration = this.basePlayerStats.rageDuration;
            this.player.rageDecayRate = this.basePlayerStats.rageDecayRate;
            
            // Normal respawn with slight penalty
            this.player.health = Math.max(75, this.basePlayerStats.maxHealth - (this.deathCount * 5));
            this.showMessage("Divine Wrath exhausted. Fight with honor!");
        } else {
            // Normal respawn with small health penalty
            this.player.health = Math.max(50, this.player.maxHealth - (this.deathCount * 10));
            
            // Fix ammo if it was corrupted
            if (!this.player.ammo || typeof this.player.ammo !== 'object') {
                this.player.ammo = {
                    shells: GAME_CONFIG.PLAYER.AMMO.INITIAL_SHELLS || 8,
                    bullets: GAME_CONFIG.PLAYER.AMMO.INITIAL_BULLETS || 50,
                    rockets: 0,
                    cells: 0
                };
            }
            
            // Give some ammo on respawn
            this.player.ammo.shells = Math.max(4, this.player.ammo.shells || 0);
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
        const audioContext = AudioManager.getContext();
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
        const audioContext = AudioManager.getContext();
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
        const audioContext = AudioManager.getContext();
        
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
        if (!this._dom) {
            this.cacheDomElements();
        }
        
        // Create/update coordinates display
        let coordsEl = document.getElementById('coordinates');
        if (!coordsEl) {
            coordsEl = document.createElement('div');
            coordsEl.id = 'coordinates';
            coordsEl.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                color: #00ff00;
                font-family: monospace;
                font-size: 16px;
                background: rgba(0,0,0,0.8);
                padding: 8px;
                border: 1px solid #00ff00;
                z-index: 1000;
                text-shadow: 0 0 3px #00ff00;
            `;
            document.body.appendChild(coordsEl);
        }
        
        // Update coordinates
        if (this.player && coordsEl) {
            coordsEl.innerHTML = `X: ${this.player.position.x.toFixed(1)}<br>Z: ${this.player.position.z.toFixed(1)}`;
        }
        
        // Safely update health value
        const healthEl = this._dom.healthEl || document.getElementById('healthValue');
        if (healthEl) healthEl.textContent = Math.max(0, Math.floor(this.player.health));
        
        // Safely update armor value
        const armorEl = this._dom.armorEl || document.getElementById('armorValue');
        if (armorEl) armorEl.textContent = Math.floor(this.player.armor);
        
        // Update level display
        const levelEl = this._dom.levelEl || document.getElementById('levelValue');
        if (levelEl && this.level) levelEl.textContent = this.level.levelNumber;
        
        // Update score display
        const scoreEl = this._dom.scoreEl || document.getElementById('scoreValue');
        if (scoreEl) scoreEl.textContent = this.score;
        
        // Update kills display
        const killsEl = this._dom.killsEl || document.getElementById('killsValue');
        if (killsEl) killsEl.textContent = this.kills;
        
        // Update rage display
        const ragePercent = Math.floor((this.player.rage / this.player.maxRage) * 100);
        const rageBar = this._dom.rageBar || document.getElementById('rage');
        
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
        const ammoEl = this._dom.ammoEl || document.getElementById('ammo');
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
            // Attempt to reacquire pointer lock immediately on resume
            if (document.body.requestPointerLock) {
                try { document.body.requestPointerLock(); } catch (e) {}
            }
            // Show click to resume message briefly (in case lock was denied)
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
        
        // Reload the current level to respawn enemies and reset everything
        this.loadLevel(this.currentLevel);
        
        // Close menus and resume
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('settingsPanel').style.display = 'none';
        this.isPaused = false;
        this.gameOver = false;
        document.body.requestPointerLock();
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
        
        // Hide all menus and show start screen (with null checks)
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) pauseMenu.style.display = 'none';
        
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) settingsPanel.style.display = 'none';
        
        const deathScreen = document.getElementById('deathScreen');
        if (deathScreen) deathScreen.style.display = 'none';
        
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';
        
        const instructions = document.getElementById('instructions');
        if (instructions) instructions.style.display = 'none';
        
        const startScreen = document.getElementById('startScreen');
        if (startScreen) startScreen.style.display = 'flex';
        
        // Exit pointer lock
        document.exitPointerLock();
        
        // Reset game state  
        this.currentLevel = 'tutorial';
        this.deathCount = 0;
        this.martyrdomMode = false;
        this.divineWrathUsed = false;
    }
    
    executeDivineWrathExplosion() {
        // Create holy explosion at player position
        const explosionRadius = 20;
        
        // Visual effect - golden explosion
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1,
            emissive: 0xffff00,
            emissiveIntensity: 2
        });
        
        const explosion = new THREE.Mesh(sphereGeometry, sphereMaterial);
        explosion.position.copy(this.player.position);
        this.scene.add(explosion);
        
        // Screen flash effect
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'yellow';
        flash.style.opacity = '0.8';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '10000';
        document.body.appendChild(flash);
        
        // Fade out flash
        setTimeout(() => {
            flash.style.transition = 'opacity 0.5s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 500);
        }, 100);
        
        // Expand explosion and damage enemies
        const expandExplosion = () => {
            explosion.scale.multiplyScalar(1.3);
            explosion.material.opacity *= 0.92;
            
            // Check if explosion reached max size
            if (explosion.scale.x < explosionRadius) {
                // Damage all enemies in radius
                if (this.enemies) {
                    this.enemies.forEach(enemy => {
                        if (enemy && enemy.position && !enemy.hitByDivineWrath) {
                            const distance = enemy.position.distanceTo(this.player.position);
                            if (distance <= explosion.scale.x) {
                                // Instant kill enemies within range
                                const damage = 500; // Massive damage
                                enemy.takeDamage(damage, 'holy');
                                enemy.hitByDivineWrath = true;
                                
                                // Knockback and disintegrate effect
                                const knockbackDir = new THREE.Vector3()
                                    .subVectors(enemy.position, this.player.position)
                                    .normalize()
                                    .multiplyScalar(20);
                                knockbackDir.y = 10;
                                
                                if (enemy.applyKnockback) {
                                    enemy.applyKnockback(knockbackDir);
                                }
                                
                                // Create holy fire on enemy
                                this.createHolyFire(enemy.position);
                            }
                        }
                    });
                }
                
                requestAnimationFrame(expandExplosion);
            } else {
                // Cleanup
                this.scene.remove(explosion);
                
                // Reset hit flags
                if (this.enemies) {
                    this.enemies.forEach(enemy => {
                        if (enemy) delete enemy.hitByDivineWrath;
                    });
                }
            }
        };
        expandExplosion();
        
        // Create ground cracks radiating outward
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.createHolyCrack(angle);
        }
        
        // Play sound effect (if available)
        this.playDivineWrathSound();
        
        // Show message
        this.showMessage("DIVINE WRATH UNLEASHED!");
    }
    
    createHolyFire(position) {
        // Create golden flames at position
        const fireGeometry = new THREE.ConeGeometry(0.3, 1, 6);
        const fireMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.position.copy(position);
        fire.position.y += 0.5;
        this.scene.add(fire);
        
        // Animate fire
        const animateFire = () => {
            fire.position.y += 0.05;
            fire.scale.y *= 1.02;
            fire.material.opacity *= 0.95;
            fire.rotation.y += 0.1;
            
            if (fire.material.opacity > 0.01) {
                requestAnimationFrame(animateFire);
            } else {
                this.scene.remove(fire);
            }
        };
        animateFire();
    }
    
    createHolyCrack(angle) {
        // Create glowing cracks in the ground
        const crackGeometry = new THREE.PlaneGeometry(0.3, 8);
        const crackMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        
        const crack = new THREE.Mesh(crackGeometry, crackMaterial);
        crack.position.copy(this.player.position);
        crack.position.y = 0.02;
        crack.rotation.x = -Math.PI / 2;
        crack.rotation.z = angle;
        this.scene.add(crack);
        
        // Fade crack
        const fadeCrack = () => {
            crack.material.opacity *= 0.96;
            crack.scale.y *= 1.05; // Extend outward
            
            if (crack.material.opacity > 0.01) {
                requestAnimationFrame(fadeCrack);
            } else {
                this.scene.remove(crack);
            }
        };
        setTimeout(fadeCrack, 500);
    }
    
    playDivineWrathSound() {
        // Placeholder for divine wrath sound effect
        // Could be implemented with Web Audio API or Howler.js
        console.log('Divine Wrath sound effect triggered');
    }
    
    showLoadingScreen(levelName) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = document.getElementById('loadingText');
        const loadingTip = document.getElementById('loadingTip');
        const loadingBar = document.querySelector('.loading-bar');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.style.zIndex = '100000'; // Ensure it's on top of everything
            
            // Random loading messages based on level
                const loadingMessages = {
                    'tutorial': ['Blessing weapons...', 'Preparing holy water...', 'Loading sacred texts...'],
                    'chapel': ['Sanctifying the chapel...', 'Summoning divine protection...', 'Preparing for battle...'],
                    'armory': ['Loading armory...', 'Checking ammunition...', 'Preparing heavy weapons...'],
                    'laboratory': ['Analyzing specimens...', 'Securing keycards...', 'Initializing containment...'],
                    'containment': ['Securing perimeter...', 'Loading emergency protocols...', 'Preparing evacuation routes...'],
                    'tunnels': ['Mapping tunnel network...', 'Activating emergency lighting...', 'Scanning for threats...'],
                    'spawning': ['Detecting hell portals...', 'Preparing for swarm...', 'Loading heavy ordnance...'],
                'observatory': ['Calibrating sensors...', 'Scanning skies...', 'Preparing observation deck...'],
                'communications': ['Establishing connection...', 'Restoring signal...', 'Decrypting messages...'],
                'reactor': ['Stabilizing core...', 'Checking radiation levels...', 'Preparing hazmat protocols...'],
                'archive': ['Accessing forbidden knowledge...', 'Decrypting ancient texts...', 'Preparing protective wards...'],
                'techfacility': ['Hacking security systems...', 'Loading classified data...', 'Preparing infiltration...']
            };
            
            const tips = [
                'TIP: Use holy water grenades to create safe zones',
                'TIP: The blessed shotgun is most effective at close range',
                'TIP: Block with your sword to reduce damage',
                'TIP: Holy Rage makes you temporarily invincible',
                'TIP: Some enemies are weak to specific weapons',
                'TIP: Sprint to avoid enemy projectiles',
                'TIP: Headshots deal critical damage',
                'TIP: Look for keycards to unlock new areas',
                'TIP: Environmental hazards can damage enemies too',
                'TIP: Save your crucifix launcher for tough enemies'
            ];
            
            // Set random loading message
            const messages = loadingMessages[levelName] || ['Loading level...'];
            if (loadingText) {
                loadingText.textContent = messages[Math.floor(Math.random() * messages.length)];
            }
            
            // Set random tip
            if (loadingTip) {
                loadingTip.textContent = tips[Math.floor(Math.random() * tips.length)];
            }
            
            // Animate loading bar
            if (loadingBar) {
                loadingBar.style.width = '0%';
                let progress = 0;
                const loadingInterval = setInterval(() => {
                    progress += Math.random() * 30;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(loadingInterval);
                    }
                    loadingBar.style.width = progress + '%';
                }, 200);
            }
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            // Complete the loading bar first
            const loadingBar = document.querySelector('.loading-bar');
            if (loadingBar) {
                loadingBar.style.width = '100%';
            }
            
            // Hide after a short delay
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    async loadLevel(levelName, options = {}) {
        // Store options for level setup
        this.levelLoadOptions = options;
        
        // Show loading screen immediately and ensure it's visible
        this.showLoadingScreen(levelName);
        
        // Force a render frame to ensure loading screen is displayed
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                // Use setTimeout to give the loading screen time to be fully rendered
                setTimeout(resolve, 50);
            });
        });
        
        await this.loadLevelActual(levelName);
    }
    
    async loadLevelActual(levelName) {
        // Save current level state before leaving
        if (this.currentLevel && this.currentLevel !== levelName) {
            this.saveLevelState();
        }
        
        // Clear existing level
        if (this.currentLevelInstance) {
            if (this.currentLevelInstance.clearLevel) {
                this.currentLevelInstance.clearLevel();
            }
        }
        
        // Clean up performance systems
        this.cleanupPerformanceSystems();
        
        // Clear all level-specific references
        this.tutorialLevel = null;
        this.chapelLevel = null;
        this.armoryLevel = null;
        this.laboratoryLevel = null;
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
        
        // Create new level using factory (async)
        const levelInstance = await this.levelFactory.createLevel(levelName);
        
        if (levelInstance) {
            this.currentLevelInstance = levelInstance;
            
            // Also set specific level references for compatibility
            if (levelName === 'chapel') {
                this.chapelLevel = levelInstance;
                // If returning from armory, position near the door (door is at x=5, z=-20)
                if (this.returningFromArmory) {
                    this.player.position.set(4, 1.7, -20);  // Spawn near the door on corridor side
                    this.returningFromArmory = false;
                }
            } else if (levelName === 'armory') {
                this.armoryLevel = levelInstance;
                // Check if coming from laboratory
                if (this.levelLoadOptions && this.levelLoadOptions.fromLaboratory) {
                    // Spawn near the elevator exit (at the far end)
                    this.player.position.set(0, 1.7, -45);  // Near elevator at exit end
                    this.player.yaw = Math.PI;  // Face back towards armory
                    // Open the elevator doors
                    if (levelInstance.openElevatorForReturn) {
                        levelInstance.openElevatorForReturn();
                    }
                } else if (this.previousLevel === 'chapel') {
                    // Coming from chapel, spawn at entrance
                    this.player.position.set(0, 1.7, 5);  // Near entrance from chapel
                }
            } else if (levelName === 'laboratory' || levelName === 'lab') {
                this.laboratoryLevel = levelInstance;
                // Spawn player outside elevator, facing into laboratory
                this.player.position.set(0, 1.7, 15);  // Outside elevator, in lab entrance
                this.player.yaw = 0;  // Face forward into lab
            }
            
            console.log(`[Game] Successfully loaded level: ${levelName}`);
            
            // Restore level state if returning
            this.restoreLevelState(levelName);

            // Ensure the active weapon is visible after level load
            if (this.player && this.weaponSystem && this.player.currentWeapon) {
                this.weaponSystem.switchToWeapon(this.player.currentWeapon);
            }
        } else {
            const errorMsg = `[Game] Failed to load level: ${levelName}`;
            console.error(errorMsg);
            this.hideLoadingScreen();
            
            // Show error to user
            if (this.narrativeSystem) {
                this.narrativeSystem.displaySubtitle(`ERROR: Failed to load ${levelName}`);
            }
            
            throw new Error(errorMsg);
        }
        
            // Reset player state
            this.player.velocity.set(0, 0, 0);
            // Preserve player health across level loads
        
        // Update current level tracking
        this.previousLevel = this.currentLevel;
        this.currentLevel = levelName;
        
        // Optimize level geometry after loading
        this.optimizeLevelGeometry();
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1000);
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats(deltaTime) {
        this.frameCount++;
        
        // Update FPS every second
        const now = Date.now();
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // Show debug info if enabled (F3 key toggles)
            if (this.debugMode) {
                this.showDebugInfo();
            }
            
            // Adjust quality based on FPS
            if (this.fps < 30 && this.shadowOptimizer) {
                // Reduce quality if performance is poor
                this.shadowOptimizer.setShadowQuality('low');
            } else if (this.fps > 50 && this.shadowOptimizer) {
                // Increase quality if performance is good
                this.shadowOptimizer.setShadowQuality('medium');
            }

            // Dynamically adjust shadow distance for point lights based on FPS
            if (this.shadowOptimizer) {
                const target = (Config && Config.engine && Config.engine.PERFORMANCE && Config.engine.PERFORMANCE.TARGET_FPS) || 60;
                this.shadowOptimizer.adjustShadowDistance(this.camera, target, this.fps);
            }
        }
    }
    
    showDebugInfo() {
        const report = this.getPerformanceReport();
        console.log(`=== Performance Stats ===`);
        console.log(`FPS: ${report.fps}`);
        console.log(`Draw Calls: ${report.drawCalls}`);
        console.log(`Triangles: ${report.triangles}`);
        if (report.poolStats) {
            console.log(`Bullets: ${report.poolStats.bullets?.active || 0} active`);
            console.log(`Particles: ${report.poolStats.particles?.active || 0} active`);
        }
        if (report.lodStats) {
            console.log(`LOD Objects: ${report.lodStats.total} (H:${report.lodStats.high} M:${report.lodStats.medium} L:${report.lodStats.low})`);
        }
        this.updateDebugOverlay();
    }
    
    /**
     * Optimize level after loading
     */
    optimizeLevelGeometry() {
        if (!this.geometryBatcher) return;
        
        // Batch static geometry
        if (this.level && this.level.walls) {
            this.geometryBatcher.batchWalls(this.level.walls);
        }
        
        // Optimize shadows for the level
        if (this.shadowOptimizer && this.level) {
            const floors = [];
            this.scene.traverse(child => {
                if (child.isMesh && child.name && child.name.includes('floor')) {
                    floors.push(child);
                }
            });
            
            this.shadowOptimizer.optimizeLevel(
                this.level.walls || [],
                floors,
                this.enemies
            );
        }
        
        // Update shadow map after optimization
        if (this.renderer) {
            this.renderer.shadowMap.needsUpdate = true;
        }
    }
    
    /**
     * Clean up performance systems when switching levels
     */
    cleanupPerformanceSystems() {
        if (this.poolManager) this.poolManager.clearAll();
        if (this.lodManager) this.lodManager.clear();
        if (this.animationManager) this.animationManager.clear();
        if (this.shadowOptimizer) this.shadowOptimizer.clear();
        if (this.geometryBatcher) this.geometryBatcher.clear();
        if (this.timerManager) this.timerManager.clearAll();
    }
    
    /**
     * Save current level state before leaving
     */
    saveLevelState() {
        if (!this.currentLevel || !this.currentLevelInstance) return;
        
        const state = {
            level: this.currentLevel,
            timestamp: Date.now(),
            objectives: {},
            enemiesKilled: [],
            pickupsCollected: []
        };
        
        // Save Chapel specific state
        if (this.currentLevel === 'chapel' && this.chapelLevel) {
            state.objectives.chapelReached = this.chapelLevel.chapelReached || false;
            state.objectives.chapelCleansed = this.chapelLevel.chapelCleansed || false;
            // Don't respawn enemies in chapel if cleansed
            if (this.chapelLevel.chapelCleansed) {
                state.enemiesCleared = true;
            }
        }
        
        // Save Armory specific state
        if (this.currentLevel === 'armory' && this.armoryLevel) {
            state.objectives.weaponsCollected = this.armoryLevel.weaponsCollected || 0;
            state.objectives.cacheLock = this.armoryLevel.cacheLock ? true : false;
            state.objectives.sealedDoorUnlocked = this.armoryLevel.sealedDoor && !this.armoryLevel.sealedDoor.userData.locked;
            // Track collected weapons
            if (this.armoryLevel.collectedWeapons) {
                state.pickupsCollected = [...this.armoryLevel.collectedWeapons];
            }
        }
        
        // Save Laboratory specific state
        if (this.currentLevel === 'laboratory' && this.laboratoryLevel) {
            state.objectives.keycards = {...(this.laboratoryLevel.keycards || {})};
            state.objectives.exitPortalActive = this.laboratoryLevel.exitPortal ? true : false;
        }
        
        // Save Containment specific state
        if (this.currentLevel === 'containment' && this.currentLevelInstance) {
            state.objectives.systemsRestored = this.currentLevelInstance.systemsRestored || 0;
            state.objectives.emergencyProtocolActive = this.currentLevelInstance.emergencyProtocolActive || false;
        }
        
        // Store in memory and localStorage
        this.levelStates.set(this.currentLevel, state);
        this.saveLevelStatesToStorage();
    }
    
    /**
     * Restore level state when returning
     */
    restoreLevelState(levelName) {
        const state = this.levelStates.get(levelName);
        if (!state) return;
        
        console.log(`[Game] Restoring state for level: ${levelName}`, state);
        
        // Wait for level to be fully loaded
        setTimeout(() => {
            // Restore Chapel state
            if (levelName === 'chapel' && this.chapelLevel) {
                if (state.objectives.chapelReached) {
                    this.chapelLevel.chapelReached = true;
                }
                if (state.objectives.chapelCleansed) {
                    this.chapelLevel.chapelCleansed = true;
                    // Don't spawn enemies if chapel is cleansed
                    console.log('[Game] Chapel already cleansed - not spawning enemies');
                } else if (state.objectives.chapelReached) {
                    // Chapel reached but not cleansed - spawn enemies
                    this.chapelLevel.spawnChapelEnemies();
                }
            }
            
            // Restore Armory state
            if (levelName === 'armory' && this.armoryLevel) {
                if (state.objectives.weaponsCollected) {
                    this.armoryLevel.weaponsCollected = state.objectives.weaponsCollected;
                }
                if (state.objectives.sealedDoorUnlocked && this.armoryLevel.sealedDoor) {
                    this.armoryLevel.sealedDoor.userData.locked = false;
                    // Update elevator visuals
                    if (this.armoryLevel.elevatorButton) {
                        this.armoryLevel.elevatorButton.material.emissive.setHex(0x00ff00);
                    }
                    if (this.armoryLevel.elevatorDisplay) {
                        this.armoryLevel.elevatorDisplay.material.emissive.setHex(0x003300);
                    }
                }
                // Hide already collected pickups
                if (state.pickupsCollected && this.armoryLevel.pickups) {
                    this.armoryLevel.pickups.forEach(pickup => {
                        if (state.pickupsCollected.includes(pickup.userData.weaponType)) {
                            pickup.visible = false;
                            pickup.userData.collected = true;
                        }
                    });
                }
            }
            
            // Restore Laboratory state
            if (levelName === 'laboratory' && this.laboratoryLevel) {
                if (state.objectives.keycards) {
                    this.laboratoryLevel.keycards = {...state.objectives.keycards};
                    // Open corresponding doors
                    Object.keys(state.objectives.keycards).forEach(color => {
                        if (state.objectives.keycards[color]) {
                            this.laboratoryLevel.openSecurityDoor(color);
                        }
                    });
                }
                if (state.objectives.exitPortalActive) {
                    this.laboratoryLevel.createExitPortal();
                }
            }
            
            // Restore Containment state
            if (levelName === 'containment' && this.currentLevelInstance) {
                if (state.objectives.systemsRestored) {
                    this.currentLevelInstance.systemsRestored = state.objectives.systemsRestored;
                }
                if (state.objectives.emergencyProtocolActive) {
                    this.currentLevelInstance.emergencyProtocolActive = true;
                }
            }
        }, 100);
    }
    
    /**
     * Save level states to localStorage
     */
    saveLevelStatesToStorage() {
        try {
            const states = {};
            this.levelStates.forEach((value, key) => {
                states[key] = value;
            });
            localStorage.setItem('saintdoom_levelStates', JSON.stringify(states));
        } catch (e) {
            console.error('Failed to save level states:', e);
        }
    }
    
    /**
     * Load level states from localStorage
     */
    loadLevelStates() {
        try {
            const saved = localStorage.getItem('saintdoom_levelStates');
            if (saved) {
                const states = JSON.parse(saved);
                Object.keys(states).forEach(key => {
                    this.levelStates.set(key, states[key]);
                });
                console.log('[Game] Loaded level states:', this.levelStates);
            }
        } catch (e) {
            console.error('Failed to load level states:', e);
        }
    }
    
    /**
     * Get performance report
     */
    getPerformanceReport() {
        return {
            fps: this.fps,
            drawCalls: this.renderer.info.render.calls,
            triangles: this.renderer.info.render.triangles,
            geometries: this.renderer.info.memory.geometries,
            textures: this.renderer.info.memory.textures,
            poolStats: this.poolManager ? this.poolManager.getAllStats() : null,
            lodStats: this.lodManager ? this.lodManager.getStats() : null,
            shadowStats: this.shadowOptimizer ? this.shadowOptimizer.getStats() : null,
            batchingStats: this.geometryBatcher ? this.geometryBatcher.getStats() : null
        };
    }
}

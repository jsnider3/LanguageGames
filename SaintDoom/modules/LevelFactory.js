// Level Factory System
// Manages level creation and configuration to reduce complex conditional logic

import * as THREE from 'three';
import { Level as FallbackLevel } from '../level.js';

export class LevelFactory {
    constructor(game) {
        this.game = game;
        this.levelRegistry = new Map();
        this.initializeRegistry();
        // Version check to ensure we're using the updated code
        console.log('[LevelFactory] Using lazy-loading version 2.0');
    }
    
    /**
     * Initialize the level registry with level configurations
     */
    initializeRegistry() {
        this.registerLevel('tutorial', {
            className: 'TutorialLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: [], // Tutorial starts with no weapons
            setup: (level) => {
                // Tutorial-specific setup
                this.game.tutorialLevel = level;
            }
        });
        
        this.registerLevel('chapel', {
            className: 'ChapelLevel', 
            playerStartPosition: new THREE.Vector3(0, 1.7, 8),
            weapons: ['sword', 'shotgun', 'holywater', 'crucifix'],
            setup: (level) => {
                console.log("[LevelFactory] ChapelLevel setup function called.");
                this.game.chapelLevel = level;
                // Restore all weapons for Chapel
                this.game.player.weapons = ['sword', 'shotgun', 'holywater', 'crucifix'];
                this.game.player.currentWeaponIndex = 0;
                this.game.player.currentWeapon = 'sword';
                console.log("[LevelFactory] Calling switchToWeapon('sword') for ChapelLevel.");
                this.game.weaponSystem.switchToWeapon('sword');
            }
        });
        
        this.registerLevel('armory', {
            className: 'ArmoryLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 8), // Start at entrance from chapel
            weapons: ['sword'], // Start with basic weapon only
            setup: (level) => {
                this.game.armoryLevel = level;
                // Limit weapons for armory exploration
                this.game.player.weapons = ['sword'];
                this.game.player.currentWeaponIndex = 0;
                this.game.player.currentWeapon = 'sword';
                this.game.weaponSystem.switchToWeapon('sword');
            }
        });
        
        
        
        this.registerLevel('laboratory', {
            className: 'LaboratoryLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 18),  // At elevator exit
            weapons: ['sword', 'shotgun'],
            setup: (level) => {
                // No special reference needed for laboratory
                level.levelName = 'Laboratory Complex';
            }
        });
        
        this.registerLevel('containment', {
            className: 'ContainmentLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 15), // Safe spawn position south of hub
            weapons: ['sword', 'shotgun', 'holywater'],
            setup: (level) => {
                // Containment-specific setup can go here
                level.levelName = 'Containment Area';
            }
        });
        
        this.registerLevel('tunnels', {
            className: 'TunnelLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater'],
            setup: (level) => {
                level.levelName = 'Tunnel Network';
            }
        });
        
        this.registerLevel('communications', {
            className: 'CommunicationsLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater'],
            setup: (level) => {
                level.levelName = 'Communications Tower';
            }
        });
        
        this.registerLevel('observatory', {
            className: 'ObservatoryLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater'],
            setup: (level) => {
                level.levelName = 'Observatory';
            }
        });
        
        this.registerLevel('reactor', {
            className: 'ReactorLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater', 'crucifix'],
            setup: (level) => {
                level.levelName = 'Reactor Core';
            }
        });
        
        this.registerLevel('spawning', {
            className: 'SpawningGroundsLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater', 'crucifix'],
            setup: (level) => {
                level.levelName = 'Spawning Grounds';
            }
        });
        
        this.registerLevel('archive', {
            className: 'SecretArchive',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater', 'crucifix'],
            setup: (level) => {
                level.levelName = 'Secret Archives';
            }
        });
        
        this.registerLevel('techfacility', {
            className: 'SecretTechFacility',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater', 'crucifix'],
            setup: (level) => {
                level.levelName = 'Secret Technology Facility';
            }
        });
        
        this.registerLevel('finalarena', {
            className: 'FinalArenaLevel',
            playerStartPosition: new THREE.Vector3(0, 1.7, 0),
            weapons: ['sword', 'shotgun', 'holywater', 'crucifix'],
            setup: (level) => {
                level.levelName = 'Final Arena';
            }
        });
    }
    
    /**
     * Register a level configuration
     * @param {string} levelKey - Level identifier
     * @param {Object} config - Level configuration
     */
    registerLevel(levelKey, config) {
        this.levelRegistry.set(levelKey, config);
    }
    
    /**
     * Create a level instance
     * @param {string} levelKey - Level identifier
     * @returns {Promise<Object|null>} - Created level instance or null if failed
     */
    async createLevel(levelKey) {
        const config = this.levelRegistry.get(levelKey);
        if (!config) {
            console.error(`[LevelFactory] Unknown level: ${levelKey}`);
            return null;
        }
        
        // Show loading indicator
        this.showLoadingIndicator(levelKey);
        
        try {
            // Dynamically import the level module
            const LevelClass = await this.loadLevelClass(config.className, levelKey);
            
            if (!LevelClass) {
                this.hideLoadingIndicator();
                throw new Error(`Failed to load level class ${config.className} for level ${levelKey}`);
            }
            
            // Create level instance
            const level = new LevelClass(this.game.scene, this.game);
            
            // Run level-specific setup
            if (config.setup) {
                config.setup(level);
            }
            
            // Create level walls/geometry
            const levelData = level.create ? level.create() : null;
            
            // Setup game level reference
            this.game.level = new FallbackLevel(this.game.scene);
            if (levelData && levelData.walls) {
                this.game.level.walls = levelData.walls;
            }
            
            // Configure player weapons
            if (config.weapons) {
                this.game.player.weapons = [...config.weapons];
                if (config.weapons.length > 0) {
                    this.game.player.currentWeaponIndex = 0;
                    this.game.player.currentWeapon = config.weapons[0];
                    this.game.weaponSystem.switchToWeapon(config.weapons[0]);
                }
            }
            
            // Set player start position
            if (config.playerStartPosition) {
                this.game.player.position.copy(config.playerStartPosition);
            }
            
            console.log(`[LevelFactory] Successfully created level: ${levelKey}`);
            console.log("LevelFactory.createLevel(): Game Camera UUID after level creation: ", this.game.camera.uuid);
            this.hideLoadingIndicator();
            return level;
            
        } catch (error) {
            console.error(`[LevelFactory] Failed to create level ${levelKey}:`, error);
            this.hideLoadingIndicator();
            throw error; // Let it fail properly for debugging
        }
    }
    
    /**
     * Dynamically load a level class
     * @param {string} className - Name of the level class
     * @param {string} levelKey - Level identifier
     * @returns {Promise<Class|null>} - Level class or null if failed
     */
    async loadLevelClass(className, levelKey) {
        // Check if already loaded
        if (window[className]) {
            return window[className];
        }
        
        // Map class names to module paths
        const moduleMap = {
            'TutorialLevel': '../levels/tutorialLevel.js',
            'ChapelLevel': '../levels/chapelLevel.js',
            'ArmoryLevel': '../levels/armoryLevel.js',
            'LaboratoryLevel': '../levels/laboratoryLevel.js',
            'ContainmentLevel': '../levels/containmentLevel.js',
            'TunnelLevel': '../levels/tunnelLevel.js',
            'CommunicationsLevel': '../levels/communicationsLevel.js',
            'ObservatoryLevel': '../levels/observatoryLevel.js',
            'ReactorLevel': '../levels/reactorLevel.js',
            'SpawningGroundsLevel': '../levels/spawningGroundsLevel.js',
            'SecretArchive': '../levels/secretArchive.js',
            'SecretTechFacility': '../levels/secretTechFacility.js',
            'FinalArenaLevel': '../levels/finalArenaLevel.js'
        };
        
        const modulePath = moduleMap[className];
        if (!modulePath) {
            console.error(`[LevelFactory] No module path for class ${className}`);
            return null;
        }
        
        try {
            // Add cache-busting timestamp to force reload
            const moduleUrl = `${modulePath}?t=${Date.now()}`;
            console.log(`[LevelFactory] Loading level module: ${moduleUrl}`);
            const module = await import(moduleUrl);
            const LevelClass = module[className];
            
            if (!LevelClass) {
                console.error(`[LevelFactory] Class ${className} not found in module ${modulePath}`);
                return null;
            }
            
            // Cache in window for faster access next time
            window[className] = LevelClass;
            return LevelClass;
            
        } catch (error) {
            console.error(`[LevelFactory] Failed to load module ${modulePath}:`, error);
            return null;
        }
    }
    
    /**
     * Show loading indicator
     * @param {string} levelKey - Level being loaded
     */
    showLoadingIndicator(levelKey) {
        // Don't show loading screen during zone transitions
        if (this.game && this.game.zoneManager && this.game.zoneManager.activeTransition) {
            return;
        }
        
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            if (loadingText) {
                loadingText.textContent = `Loading ${levelKey.replace(/_/g, ' ').toUpperCase()}...`;
            }
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        // Don't hide during transitions - let ZoneManager handle it
        if (this.game && this.game.zoneManager && this.game.zoneManager.activeTransition) {
            return;
        }
        
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500); // Small delay for smooth transition
        }
    }
    
    /**
     * Get level configuration
     * @param {string} levelKey - Level identifier
     * @returns {Object|null} - Level configuration
     */
    getLevelConfig(levelKey) {
        return this.levelRegistry.get(levelKey);
    }
    
    /**
     * Get all registered level keys
     * @returns {Array} - Array of level keys
     */
    getAllLevelKeys() {
        return Array.from(this.levelRegistry.keys());
    }
    
    /**
     * Check if a level is registered
     * @param {string} levelKey - Level identifier
     * @returns {boolean} - True if level exists
     */
    hasLevel(levelKey) {
        return this.levelRegistry.has(levelKey);
    }
}

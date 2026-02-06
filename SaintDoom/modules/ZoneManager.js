import * as THREE from 'three';
import { TransitionZoneFactory } from './TransitionZones.js';

/**
 * ZoneManager - Manages interconnected facility zones with seamless transitions
 * Handles zone loading/unloading, state persistence, and memory management
 */
export class ZoneManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Zone management
        this.zones = new Map();           // All zone definitions
        this.activeZones = new Map();     // Currently loaded zones
        this.zoneStates = new Map();      // Persistent state for each zone
        this.connections = new Map();     // How zones connect to each other
        
        // Current player location
        this.currentZone = null;
        this.previousZone = null;
        
        // Loading configuration
        this.loadRadius = 1;              // How many zones away to preload
        this.maxLoadedZones = 3;          // Maximum zones in memory
        this.memoryLimit = 100 * 1024 * 1024; // 100MB limit
        this.currentMemoryUsage = 0;
        
        // Loading states
        this.loadingQueue = [];
        this.isLoading = false;
        this.loadPromises = new Map();
        
        // Transition management
        this.transitionZones = new Map();
        this.activeTransition = null;
        
        // Performance tracking
        this.performanceMode = 'auto';   // 'high', 'medium', 'low', 'auto'
        this.lastCleanup = Date.now();
        this.cleanupInterval = 5000;     // Check memory every 5 seconds
        
        // Predictive loading
        this.playerMovementHistory = [];
        this.maxHistoryLength = 10;
        this.lastPlayerPosition = null;
        this.predictiveLoadingEnabled = true;
        this.loadingPriorities = new Map();
        
        // Initialize facility layout
        this.initializeFacilityLayout();
    }
    
    /**
     * Zone loading states
     */
    static ZoneState = {
        UNLOADED: 'unloaded',
        LOADING: 'loading',
        PROXY: 'proxy',          // Collision only
        SIMPLIFIED: 'simplified', // Basic geometry
        FULL: 'full',            // Complete detail
        UNLOADING: 'unloading'
    };
    
    /**
     * Zone size categories for memory management
     */
    static ZoneSize = {
        TINY: 'tiny',       // < 5MB (transitions)
        SMALL: 'small',     // 5-15MB (corridors)
        MEDIUM: 'medium',   // 15-30MB (regular rooms)
        LARGE: 'large',     // 30-50MB (major areas)
        HUGE: 'huge'        // > 50MB (boss arenas)
    };
    
    /**
     * Initialize the facility layout and connections
     */
    initializeFacilityLayout() {
        // Define all zones matching the actual level names
        this.defineZone('chapel', {
            name: 'Chapel',
            size: ZoneManager.ZoneSize.MEDIUM,
            levelClass: 'ChapelLevel',
            connections: ['chapel_armory_corridor'],
            startPosition: new THREE.Vector3(0, 1.7, 0)
        });
        
        this.defineZone('armory', {
            name: 'Armory',
            size: ZoneManager.ZoneSize.LARGE,
            levelClass: 'ArmoryLevel',
            connections: ['chapel_armory_corridor', 'armory_lab_elevator'],
            startPosition: new THREE.Vector3(0, 1.7, 8)
        });
        
        
        
        this.defineZone('laboratory', {
            name: 'Laboratory Complex',
            size: ZoneManager.ZoneSize.LARGE,
            levelClass: 'LaboratoryLevel',
            connections: ['armory_lab_elevator'],
            startPosition: new THREE.Vector3(0, 1.7, 0)
        });
        
        // Define transition zones (small connecting areas)
        this.defineTransitionZone('chapel_armory_corridor', {
            name: 'Security Checkpoint',
            connects: ['chapel', 'armory'],
            type: 'corridor',
            length: 30, // Longer corridor for proper transition
            locked: false
        });
        
        this.defineTransitionZone('armory_lab_elevator', {
            name: 'Freight Elevator',
            connects: ['armory', 'laboratory'],
            type: 'elevator',
            locked: false, // Start unlocked for testing
            requires: null
        });
        
        // Define connections between zones
        this.addConnection('chapel', 'armory', 'chapel_armory_corridor');
        this.addConnection('armory', 'laboratory', 'armory_lab_elevator');
    }
    
    /**
     * Define a zone
     */
    defineZone(id, config) {
        this.zones.set(id, {
            id,
            name: config.name,
            size: config.size,
            levelClass: config.levelClass,
            connections: config.connections || [],
            startPosition: config.startPosition || new THREE.Vector3(0, 1.7, 0),
            state: ZoneManager.ZoneState.UNLOADED,
            memoryEstimate: this.estimateMemorySize(config.size),
            lastVisited: null,
            firstVisit: true
        });
        
        // Initialize persistent state
        this.zoneStates.set(id, {
            enemies: [],
            items: [],
            doors: {},
            switches: {},
            customData: {}
        });
    }
    
    /**
     * Define a transition zone (corridor, elevator, etc.)
     */
    defineTransitionZone(id, config) {
        this.transitionZones.set(id, {
            id,
            name: config.name,
            connects: config.connects,
            type: config.type,
            length: config.length || 5,
            locked: config.locked || false,
            requires: config.requires || null,
            hidden: config.hidden || false,
            state: ZoneManager.ZoneState.UNLOADED
        });
    }
    
    /**
     * Add a connection between two zones
     */
    addConnection(zoneA, zoneB, transitionZone) {
        const key = `${zoneA}<->${zoneB}`;
        this.connections.set(key, {
            zoneA,
            zoneB,
            transitionZone,
            bidirectional: true,
            locked: false
        });
    }
    
    /**
     * Enter a zone
     */
    async enterZone(zoneId) {
        console.log(`[ZoneManager] Entering zone: ${zoneId}`);
        
        const zone = this.zones.get(zoneId);
        if (!zone) {
            console.error(`[ZoneManager] Zone not found: ${zoneId}`);
            return false;
        }
        
        // Store previous zone
        if (this.currentZone) {
            this.previousZone = this.currentZone;
        }
        
        // Update current zone
        this.currentZone = zoneId;
        zone.lastVisited = Date.now();
        
        // Load the zone if not already loaded
        if (zone.state !== ZoneManager.ZoneState.FULL) {
            await this.loadZone(zoneId, ZoneManager.ZoneState.FULL);
        }
        
        // Update adjacent zones
        await this.updateAdjacentZones();
        
        // Cleanup distant zones
        this.cleanupDistantZones();
        
        // Restore zone state
        this.restoreZoneState(zoneId);
        
        // Trigger zone entry event
        this.onZoneEntered(zoneId);
        
        return true;
    }
    
    /**
     * Load a zone at specified detail level
     */
    async loadZone(zoneId, targetState = ZoneManager.ZoneState.FULL) {
        const zone = this.zones.get(zoneId);
        if (!zone) return null;
        
        // Check if already loading
        if (this.loadPromises.has(zoneId)) {
            return this.loadPromises.get(zoneId);
        }
        
        // Check if already at target state
        if (zone.state === targetState) {
            return zone;
        }
        
        console.log(`[ZoneManager] Loading zone ${zoneId} to state: ${targetState}`);
        
        // Create loading promise
        const loadPromise = this._performZoneLoad(zone, targetState);
        this.loadPromises.set(zoneId, loadPromise);
        
        try {
            await loadPromise;
            zone.state = targetState;
            this.activeZones.set(zoneId, zone);
        } catch (error) {
            console.error(`[ZoneManager] Failed to load zone ${zoneId}:`, error);
        } finally {
            this.loadPromises.delete(zoneId);
        }
        
        return zone;
    }
    
    /**
     * Perform actual zone loading
     */
    async _performZoneLoad(zone, targetState) {
        // Check memory before loading
        if (!this.checkMemoryAvailable(zone.memoryEstimate)) {
            await this.freeMemory(zone.memoryEstimate);
        }
        
        // Load based on target state
        switch (targetState) {
            case ZoneManager.ZoneState.PROXY:
                await this.loadZoneProxy(zone);
                break;
            case ZoneManager.ZoneState.SIMPLIFIED:
                await this.loadZoneSimplified(zone);
                break;
            case ZoneManager.ZoneState.FULL:
                await this.loadZoneFull(zone);
                break;
        }
        
        // Update memory usage
        this.currentMemoryUsage += zone.memoryEstimate;
    }
    
    /**
     * Load zone collision data only
     */
    async loadZoneProxy(zone) {
        // Load minimal collision geometry
        const proxyData = {
            walls: [],
            floors: [],
            bounds: {}
        };
        
        // This would load just collision meshes
        // For now, we'll simulate with a delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        zone.proxyData = proxyData;
    }
    
    /**
     * Load simplified zone geometry
     */
    async loadZoneSimplified(zone) {
        // Load basic visible geometry without details
        // This would be visible through windows/doors
        await new Promise(resolve => setTimeout(resolve, 100));
        
        zone.simplifiedMesh = new THREE.Group();
        // Add basic geometry here
    }
    
    /**
     * Load complete zone
     */
    async loadZoneFull(zone) {
        // Use the game's existing level loading mechanism
        if (this.game.loadLevelActual) {
            // Store original loading screen function
            const originalShowLoading = this.game.showLoadingScreen;
            // Disable loading screen during transitions by replacing with no-op
            if (this.activeTransition) {
                this.game.showLoadingScreen = () => {}; // No-op function instead of false
            }
            
            // This will handle all the level setup
            await this.game.loadLevelActual(zone.id);
            zone.levelInstance = this.game.currentLevelInstance || this.game.level;
            
            // Restore loading screen function
            if (this.activeTransition) {
                this.game.showLoadingScreen = originalShowLoading;
            }
        } else if (this.game.levelFactory) {
            // Fallback to direct level factory
            const levelInstance = await this.game.levelFactory.createLevel(zone.id);
            if (levelInstance) {
                zone.levelInstance = levelInstance;
                
                // Call create method if exists
                if (levelInstance.create) {
                    levelInstance.create();
                }
            }
        }
    }
    
    /**
     * Unload a zone
     */
    async unloadZone(zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone || zone.state === ZoneManager.ZoneState.UNLOADED) return;
        
        console.log(`[ZoneManager] Unloading zone: ${zoneId}`);
        
        // Save zone state before unloading
        this.saveZoneState(zoneId);
        
        // Clean up based on current state
        if (zone.levelInstance) {
            if (zone.levelInstance.cleanup) {
                zone.levelInstance.cleanup();
            }
            zone.levelInstance = null;
        }
        
        if (zone.simplifiedMesh) {
            this.scene.remove(zone.simplifiedMesh);
            zone.simplifiedMesh = null;
        }
        
        zone.proxyData = null;
        
        // Update state and memory
        zone.state = ZoneManager.ZoneState.UNLOADED;
        this.activeZones.delete(zoneId);
        this.currentMemoryUsage -= zone.memoryEstimate;
    }
    
    /**
     * Update adjacent zones based on current position
     */
    async updateAdjacentZones() {
        if (!this.currentZone) return;
        
        const currentZone = this.zones.get(this.currentZone);
        const adjacentZones = this.getAdjacentZones(this.currentZone);
        
        // Load adjacent zones in simplified state
        for (const zoneId of adjacentZones) {
            const zone = this.zones.get(zoneId);
            if (zone && zone.state === ZoneManager.ZoneState.UNLOADED) {
                await this.loadZone(zoneId, ZoneManager.ZoneState.SIMPLIFIED);
            }
        }
        
        // Preload connected zones as proxy
        const connectedZones = this.getConnectedZones(this.currentZone);
        for (const zoneId of connectedZones) {
            const zone = this.zones.get(zoneId);
            if (zone && zone.state === ZoneManager.ZoneState.UNLOADED) {
                await this.loadZone(zoneId, ZoneManager.ZoneState.PROXY);
            }
        }
    }
    
    /**
     * Get zones adjacent to the specified zone
     */
    getAdjacentZones(zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone) return [];
        
        const adjacent = new Set();
        
        // Check all connections
        zone.connections.forEach(transitionId => {
            const transition = this.transitionZones.get(transitionId);
            if (transition) {
                transition.connects.forEach(connectedZone => {
                    if (connectedZone !== zoneId) {
                        adjacent.add(connectedZone);
                    }
                });
            }
        });
        
        return Array.from(adjacent);
    }
    
    /**
     * Get all zones connected to the specified zone
     */
    getConnectedZones(zoneId, maxDepth = 2) {
        const connected = new Set();
        const visited = new Set();
        const queue = [{zone: zoneId, depth: 0}];
        
        while (queue.length > 0) {
            const {zone, depth} = queue.shift();
            
            if (visited.has(zone) || depth > maxDepth) continue;
            visited.add(zone);
            
            if (zone !== zoneId) {
                connected.add(zone);
            }
            
            const adjacent = this.getAdjacentZones(zone);
            adjacent.forEach(adj => {
                if (!visited.has(adj)) {
                    queue.push({zone: adj, depth: depth + 1});
                }
            });
        }
        
        return Array.from(connected);
    }
    
    /**
     * Clean up zones that are too far from the player
     */
    cleanupDistantZones() {
        const now = Date.now();
        
        // Only cleanup periodically
        if (now - this.lastCleanup < this.cleanupInterval) return;
        this.lastCleanup = now;
        
        const connectedZones = new Set([
            this.currentZone,
            ...this.getAdjacentZones(this.currentZone),
            ...this.getConnectedZones(this.currentZone)
        ]);
        
        // Unload zones not in connected set
        for (const [zoneId, zone] of this.activeZones) {
            if (!connectedZones.has(zoneId)) {
                this.unloadZone(zoneId);
            }
        }
    }
    
    /**
     * Save zone state before unloading
     */
    saveZoneState(zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone || !zone.levelInstance) return;
        
        const state = this.zoneStates.get(zoneId);
        if (!state) return;
        
        // Save enemy states
        if (this.game.enemies) {
            state.enemies = this.game.enemies.map(enemy => ({
                type: enemy.type || 'scientist',
                position: enemy.position.clone(),
                health: enemy.health,
                maxHealth: enemy.maxHealth || 100,
                isDead: enemy.isDead || (enemy.health <= 0),
                state: enemy.state || 'idle'
            }));
        }
        
        // Save item states
        if (this.game.pickups) {
            state.items = this.game.pickups.filter(p => !p.collected).map(pickup => ({
                type: pickup.type,
                position: pickup.position.clone(),
                amount: pickup.amount || 1
            }));
        }
        
        // Save door states
        if (zone.levelInstance.doors) {
            zone.levelInstance.doors.forEach(door => {
                state.doors[door.id] = {
                    open: door.open,
                    locked: door.locked
                };
            });
        }
        
        // Save zone-specific data
        state.customData.firstVisit = false;
        state.customData.lastSaved = Date.now();
        
        // Persist to localStorage for save game functionality
        this.persistToStorage(zoneId, state);
        
        zone.firstVisit = false;
    }
    
    /**
     * Restore zone state after loading
     */
    restoreZoneState(zoneId) {
        const zone = this.zones.get(zoneId);
        const state = this.zoneStates.get(zoneId);
        
        if (!zone || !state || zone.firstVisit) return;
        
        console.log(`[ZoneManager] Restoring state for zone: ${zoneId}`);
        
        // Restore enemies
        state.enemies.forEach(enemyState => {
            if (!enemyState.isDead) {
                this.game.spawnEnemy(
                    enemyState.position.x,
                    enemyState.position.y,
                    enemyState.position.z,
                    enemyState.type
                );
            }
        });
        
        // Restore items
        state.items.forEach(itemState => {
            this.game.spawnPickup(
                itemState.position.x,
                itemState.position.y,
                itemState.position.z,
                itemState.type
            );
        });
        
        // Restore doors
        if (zone.levelInstance && zone.levelInstance.doors) {
            zone.levelInstance.doors.forEach(door => {
                const doorState = state.doors[door.id];
                if (doorState) {
                    door.open = doorState.open;
                    door.locked = doorState.locked;
                }
            });
        }
    }
    
    /**
     * Check if a transition is available
     */
    canUseTransition(transitionId) {
        const transition = this.transitionZones.get(transitionId);
        if (!transition) return false;
        
        if (transition.locked) {
            if (transition.requires) {
                // Check if player has required item
                if (this.game.player) {
                    // Check various places where items might be stored
                    if (this.game.player.inventory && this.game.player.inventory[transition.requires]) {
                        return true;
                    }
                    if (this.game.player.hasItem && this.game.player.hasItem(transition.requires)) {
                        return true;
                    }
                    // For now, return true for testing
                    console.log(`[ZoneManager] Would require: ${transition.requires}`);
                    return true;
                }
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Trigger a transition between zones
     */
    triggerTransition(fromZone, toZone, player) {
        // Find the transition ID that connects these zones
        let transitionId = null;
        this.transitionZones.forEach((transition, id) => {
            if ((transition.connects.includes(fromZone) && transition.connects.includes(toZone)) ||
                (transition.connects.includes(toZone) && transition.connects.includes(fromZone))) {
                transitionId = id;
            }
        });
        
        if (!transitionId) {
            console.error(`[ZoneManager] No transition found between ${fromZone} and ${toZone}`);
            // Fallback to direct loading
            if (this.game && this.game.loadLevel) {
                this.game.loadLevel(toZone);
            }
            return;
        }
        
        // Start the transition
        this.startTransition(fromZone, toZone, transitionId);
    }
    
    /**
     * Start a zone transition
     */
    async startTransition(fromZone, toZone, transitionId) {
        const transition = this.transitionZones.get(transitionId);
        if (!transition) {
            console.error(`[ZoneManager] Transition not found: ${transitionId}`);
            return false;
        }
        
        if (!this.canUseTransition(transitionId)) {
            if (this.game.showMessage) {
                this.game.showMessage(`Requires: ${transition.requires}`);
            }
            return false;
        }
        
        console.log(`[ZoneManager] Starting transition: ${fromZone} -> ${toZone}`);

        // Set transition state
        this.activeTransition = {
            from: fromZone,
            to: toZone,
            transition: transition,
            startTime: Date.now()
        };
        
        // Save current zone state before transitioning
        this.saveZoneState(fromZone);
        
        // Store player's current position before clearing level
        const playerStartPos = this.game.player ? this.game.player.position.clone() : new THREE.Vector3();
        
        // For corridor transitions, we need to be careful about the order
        // Don't clear the level yet - we'll do it after creating the corridor
        if (transition.type !== 'corridor') {
            // For non-corridor transitions, clear immediately
            this.clearCurrentLevel();
        }
        
        // Position player at transition entrance
        if (this.game.player) {
            // Position player based on which zone they're leaving from
            if (fromZone === 'chapel') {
                // Corridor is rotated +90 to extend along positive X axis
                // After rotation, corridor extends from x=5.5 to x=35.5
                // To be INSIDE, we need x > 5.5 and x < 35.5
                // Temporarily disable collision checking to allow teleportation
                this.game.skipCollisionCheck = true;
                
                // Place player well inside the corridor, past the entrance door
                this.game.player.position.set(10, 1.7, -20);  // Well inside corridor (4.5 units past entrance)
                
                // ALSO set the camera position to match
                if (this.game.camera) {
                    this.game.camera.position.set(10, 1.7, -20);
                }
                
                // Re-enable collision checking after a short delay
                setTimeout(() => {
                    this.game.skipCollisionCheck = false;
                }, 100);
                // Face the player along the corridor (looking right toward exit at x=35.5)
                if (this.game.player.rotation) {
                    this.game.player.rotation.y = -Math.PI / 2;  // Face right (toward positive X)
                }
            } else {
                // Default position for other transitions
                this.game.player.position.set(0, 1.7, 0);
            }
            this.game.player.velocity.set(0, 0, 0);
        }
        
        // For corridor and elevator transitions, delay loading until after player interaction
        // For other transitions, start loading immediately
        let loadPromise;
        if (transition.type === 'corridor' || transition.type === 'elevator') {
            // Create a deferred promise for interactive transitions
            loadPromise = new Promise(resolve => {
                // Store the resolve function to call later
                this._deferredLoadResolve = () => {
                    const target = this.activeTransition ? this.activeTransition.to : toZone;
                    this.prepareTargetZone(target).then(resolve);
                };
            });
        } else {
            // Start loading target zone in background for non-interactive transitions
            loadPromise = this.prepareTargetZone(toZone);
        }
        
        // Handle different transition types
        try {
            switch (transition.type) {
                case 'corridor':
                    await this.transitionCorridor(transition, loadPromise);
                    break;
                case 'elevator':
                    await this.transitionElevator(transition, loadPromise);
                    break;
                case 'vent':
                    await this.transitionVent(transition, loadPromise);
                    break;
                default:
                    await loadPromise;
            }
            
            // Complete transition
            await this.completeTransition(toZone);
            
        } catch (error) {
            console.error('[ZoneManager] Transition failed:', error);
            // Fallback to regular loading
            if (this.game.loadLevel) {
                this.game.loadLevel(toZone);
            }
        }
        
        // Don't hide UI here - it will be hidden in completeTransition
        
        this.activeTransition = null;
        return true;
    }
    
    /**
     * Corridor transition (player walks through)
     */
    async transitionCorridor(transition, loadPromise) {
        console.log('[ZoneManager] Creating corridor transition');
        
        // IMPORTANT: Create the corridor FIRST before clearing the level
        // This ensures the player has a floor to stand on
        
        let corridor;
        let corridorGroup;
        let exitDoor = null;
        
        if (TransitionZoneFactory) {
            // Use the detailed corridor implementation
            corridor = TransitionZoneFactory.create(this.scene, 'corridor', {
                id: transition.id,
                name: transition.name,
                fromZone: this.activeTransition.from,
                toZone: this.activeTransition.to,
                length: transition.length || 30
            });
            corridor.activate();
            corridorGroup = corridor.group;
            // Mark corridor and all its children so they don't get cleared
            corridorGroup.userData.isTransitionCorridor = true;
            corridorGroup.traverse(child => {
                child.userData.isTransitionCorridor = true;
            });
            
            // Also mark the corridor's lights
            if (corridor.lights) {
                corridor.lights.forEach(light => {
                    light.userData.isTransitionCorridor = true;
                });
            }
            
            // Position the corridor based on which level we're coming from
            // The chapel-armory corridor always runs along the X axis when rotated
            if (this.activeTransition.from === 'chapel' ||
                this.activeTransition.from === 'armory') {
                // The corridor is created along Z axis (0 to 30)
                // Rotate +90 degrees to make it extend along X axis
                corridorGroup.rotation.y = Math.PI / 2;  // Rotate +90 degrees
                // After rotation, corridor that was at z=0-30 is now at x=0 to x=30
                // Position it so it connects both levels at the same location
                corridorGroup.position.set(5.5, 0, -20);  // Same position regardless of direction
                console.log('[ZoneManager] Corridor rotated +90 degrees to extend along positive X axis');
                console.log('[ZoneManager] Corridor positioned at:', corridorGroup.position.x, corridorGroup.position.y, corridorGroup.position.z);
                console.log('[ZoneManager] Should extend from x=5.5 to x=35.5');
            }
            
            // NOW clear the level after the corridor is in place
            console.log('[ZoneManager] Clearing chapel level after corridor is created');
            this.clearCurrentLevel();
            
            // Extra aggressive clearing - remove ALL walls
            if (this.game.level && this.game.level.walls) {
                this.game.level.walls = [];
                console.log('[ZoneManager] Cleared ALL collision walls');
            }
            
            // Position the player INSIDE the rotated corridor
            if (this.game.player) {
                // Temporarily disable collision checking to allow teleportation
                this.game.skipCollisionCheck = true;
                
                let targetX, targetZ;
                if (this.activeTransition.from === 'chapel') {
                    // Coming from chapel: place near entrance (chapel side)
                    // Corridor extends from x=5.5 (entrance) to x=35.5 (exit) after rotation
                    // Place player at x=10 to be inside but closer to entrance
                    targetX = 10;
                    targetZ = -20;
                    console.log('[ZoneManager] Positioned player from CHAPEL at x=10 (near entrance at x=5.5)');
                } else if (this.activeTransition.from === 'armory') {
                    // Coming from armory: place near that entrance (armory side)
                    // Corridor extends from x=5.5 (chapel door) to x=35.5 (armory door) after rotation
                    // Place player at x=31 to be inside but closer to armory entrance
                    targetX = 31;
                    targetZ = -20;
                    console.log('[ZoneManager] Positioned player from ARMORY at x=31 (near entrance at x=35.5)');
                }
                
                // Set player position
                this.game.player.position.set(targetX, 1.7, targetZ);
                
                // ALSO set the camera position to match
                if (this.game.camera) {
                    this.game.camera.position.set(targetX, 1.7, targetZ);
                }
                
                // Clear any existing velocity to prevent movement
                if (this.game.player.velocity) {
                    this.game.player.velocity.set(0, 0, 0);
                }
                
                // Store the target position to prevent rollback
                if (this.game.player.previousPosition) {
                    this.game.player.previousPosition.set(targetX, 1.7, targetZ);
                }
                
                
                // Re-enable collision checking after a longer delay and multiple frames
                setTimeout(() => {
                    // Set position again to be sure
                    this.game.player.position.set(targetX, 1.7, targetZ);
                    if (this.game.camera) {
                        this.game.camera.position.set(targetX, 1.7, targetZ);
                    }
                    if (this.game.player.velocity) {
                        this.game.player.velocity.set(0, 0, 0);
                    }
                    this.game.skipCollisionCheck = false;
                    console.log('[ZoneManager] Re-enabled collision checking');
                }, 500);  // Increased delay to half a second
            }
            
            // Add ambient light so corridor isn't pitch black
            const ambientLight = new THREE.AmbientLight(0x606060, 0.8);
            this.scene.add(ambientLight);
            this._transitionAmbientLight = ambientLight;  // Store reference to remove later
            
            // Add a directional light too
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
            dirLight.position.set(0, 10, 0);
            this.scene.add(dirLight);
            this._transitionDirLight = dirLight;
            
        } else {
            // Fallback to simple corridor
            corridorGroup = this.createCorridorGeometry(transition.length || 30);
            
            // Position the corridor based on which level we're coming from
            // Same logic as above for the fallback geometry
            if (this.activeTransition.from === 'chapel' ||
                this.activeTransition.from === 'armory') {
                corridorGroup.rotation.y = Math.PI / 2;  // Rotate +90 degrees
                corridorGroup.position.set(5.5, 0, -20);  // Same position regardless of direction
            }
            
            this.scene.add(corridorGroup);
            
            // NOW clear the level after the corridor is in place
            console.log('[ZoneManager] Clearing chapel level after fallback corridor is created');
            this.clearCurrentLevel();
            
            // Position the player INSIDE the rotated corridor (fallback case)
            if (this.game.player) {
                // Temporarily disable collision checking to allow teleportation
                this.game.skipCollisionCheck = true;
                
                let targetX, targetZ;
                if (this.activeTransition.from === 'chapel') {
                    // Coming from chapel: place near entrance (chapel side)
                    targetX = 10;
                    targetZ = -20;
                } else if (this.activeTransition.from === 'armory') {
                    // Coming from armory: place near that entrance (armory side)
                    targetX = 31;
                    targetZ = -20;
                }
                
                // Set player position
                this.game.player.position.set(targetX, 1.7, targetZ);
                
                // ALSO set the camera position to match
                if (this.game.camera) {
                    this.game.camera.position.set(targetX, 1.7, targetZ);
                }
                
                // Clear any existing velocity to prevent movement
                if (this.game.player.velocity) {
                    this.game.player.velocity.set(0, 0, 0);
                }
                
                // Store the target position to prevent rollback
                if (this.game.player.previousPosition) {
                    this.game.player.previousPosition.set(targetX, 1.7, targetZ);
                }
                
                
                // Re-enable collision checking after a longer delay and multiple frames
                setTimeout(() => {
                    // Set position again to be sure
                    this.game.player.position.set(10, 1.7, -20);
                    if (this.game.camera) {
                        this.game.camera.position.set(10, 1.7, -20);
                    }
                    if (this.game.player.velocity) {
                        this.game.player.velocity.set(0, 0, 0);
                    }
                    this.game.skipCollisionCheck = false;
                    console.log('[ZoneManager] Re-enabled collision checking');
                }, 500);  // Increased delay to half a second
            }
            
            // Find the exit door in the corridor
            corridorGroup.traverse(child => {
                if (child.userData && child.userData.isExitDoor) {
                    exitDoor = child;
                }
            });
        }
        
        // AFTER clearing, set both doors as collision walls
        if (this.game.level) {
            const corridorWalls = [];
            
            // Find both doors and add them as collision
            corridorGroup.traverse(child => {
                if (child.isMesh && child.userData) {
                    if (child.userData.isExitDoor) {
                        this.corridorExitDoor = child;
                        // Create bounding box for collision
                        child.geometry.computeBoundingBox();
                        const box = child.geometry.boundingBox.clone();
                        box.applyMatrix4(child.matrixWorld);
                        child.min = box.min;
                        child.max = box.max;
                        corridorWalls.push(child);
                        console.log('[ZoneManager] Added exit door as collision');
                    } else if (child.userData.isEntranceDoor) {
                        this.corridorEntranceDoor = child;
                        // Create bounding box for collision
                        child.geometry.computeBoundingBox();
                        const box = child.geometry.boundingBox.clone();
                        box.applyMatrix4(child.matrixWorld);
                        child.min = box.min;
                        child.max = box.max;
                        corridorWalls.push(child);
                        console.log('[ZoneManager] Added entrance door as collision');
                    }
                }
            });
            
            this.game.level.walls = corridorWalls;
            console.log('[ZoneManager] Set collision walls to corridor doors:', corridorWalls.length);
        }
        
        // Don't reposition the player - they were already positioned correctly earlier
        // Just ensure they're not falling
        if (this.game.player) {
            // Reset velocity to prevent falling
            if (this.game.player.velocity) {
                this.game.player.velocity.set(0, 0, 0);
            }
            
            // Force ground check to true
            if (this.game.player.isOnGround !== undefined) {
                this.game.player.isOnGround = true;
            }
            
            console.log('[ZoneManager] Player should already be positioned at:', 
                this.game.player.position.x, this.game.player.position.y, this.game.player.position.z);
        }
        
        // Log corridor status (don't reset position!)
        if (corridorGroup) {
            console.log('[ZoneManager] Corridor created and positioned at:', corridorGroup.position.x, corridorGroup.position.y, corridorGroup.position.z);
        } else {
            console.error('[ZoneManager] Failed to create corridor!')
        }
        
        // Show transition message
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle(`Entering ${transition.name}`);
        }
        
        // Don't create simple collision walls - we'll use the actual corridor geometry
        
        // Set up door interaction flag
        let doorOpened = false;
        
        // Monitor player progress through corridor and door interaction
        const checkProgress = async () => {
            let frameCount = 0;
            while (this.activeTransition && !doorOpened) {
                if (this.game.player) {
                    // For chapel-armory corridor, it's rotated so we check X position
                    // For other transitions, check Z position
                    let playerProgress, nearExitDoor, nearEntranceDoor;
                    const length = transition.length || 30;
                    
                    // Check if this is the chapel-armory corridor (either direction)
                    const isChapelArmoryCorridor = 
                        (this.activeTransition.from === 'chapel') && 
                        (this.activeTransition.to === 'armory') ||
                        (this.activeTransition.from === 'armory') && 
                        (this.activeTransition.to === 'chapel');
                    
                    if (isChapelArmoryCorridor) {
                        // Corridor extends along positive X axis from x=5.5 to x=35.5
                        const playerX = this.game.player.position.x;
                        
                        // Determine which end is which based on direction of travel
                        if (this.activeTransition.from === 'chapel') {
                            // Going from chapel to armory: entrance at x=5.5, exit at x=35.5
                            playerProgress = playerX - 5.5;
                            nearEntranceDoor = playerX < 7.5; // Within 2 units of chapel door at x=5.5
                            nearExitDoor = playerX > 33.5; // Within 2 units of armory door at x=35.5
                        } else {
                            // Going from armory to chapel: entrance at x=35.5, exit at x=5.5
                            playerProgress = 35.5 - playerX; // Reverse progress
                            nearEntranceDoor = playerX > 33.5; // Within 2 units of armory door at x=35.5
                            nearExitDoor = playerX < 7.5; // Within 2 units of chapel door at x=5.5
                        }
                        
                        // Debug logging - log first few frames to catch position change
                        if (frameCount < 5 || frameCount % 60 === 0) {
                            // Check if position suddenly changed
                            if (this._lastPlayerX !== undefined && Math.abs(playerX - this._lastPlayerX) > 5) {
                                console.log(`[ZoneManager] POSITION JUMP DETECTED at frame ${frameCount}!`);
                                console.log(`  Was x=${this._lastPlayerX.toFixed(1)} -> Now x=${playerX.toFixed(1)}`);
                                console.log(`  Player velocity:`, this.game.player.velocity.x, this.game.player.velocity.y, this.game.player.velocity.z);
                                console.log(`  skipCollisionCheck:`, this.game.skipCollisionCheck);
                            }
                            
                            console.log(`[ZoneManager] Frame ${frameCount}: Player at x=${playerX.toFixed(1)}, ` +
                                      `from=${this.activeTransition.from}, to=${this.activeTransition.to}, ` +
                                      `nearEntrance=${nearEntranceDoor}, nearExit=${nearExitDoor}`);
                            this._lastPlayerX = playerX;
                        }
                    } else {
                        // Default: corridor extends along Z axis
                        const playerZ = this.game.player.position.z;
                        playerProgress = playerZ;
                        nearEntranceDoor = playerZ < 5; // Within 5 units of start
                        nearExitDoor = playerZ > length - 5;
                        
                        if (frameCount % 60 === 0) {
                            console.log(`[ZoneManager] Player at z=${playerZ.toFixed(1)}, corridor length=${length}, nearEntrance=${nearEntranceDoor}, nearExit=${nearExitDoor}`);
                        }
                    }
                    frameCount++;
                    
                    if (nearEntranceDoor && this.corridorEntranceDoor) {
                        // Show interaction prompt for return
                        if (this.game.showMessage) {
                            this.game.showMessage(`Press E to return to ${this.zones.get(this.activeTransition.from).name}`);
                        }
                        
                        // Check for E key press
                        if (this.game.inputManager) {
                            const ePressed = this.game.inputManager.keys['e'] || 
                                           this.game.inputManager.keys['E'] || 
                                           this.game.inputManager.keys['KeyE'];
                            if (ePressed) {
                                console.log('[ZoneManager] Player returning to previous level');
                                // Save the from level before canceling transition
                                const fromLevel = this.activeTransition.from;
                                // Cancel transition and return to previous level
                                this.activeTransition = null;
                                this.game.loadLevel(fromLevel);
                                return;
                            }
                        }
                    } else if (nearExitDoor) {
                        // Show interaction prompt for forward door
                        if (this.game.showMessage) {
                            this.game.showMessage(`Press E to enter ${this.zones.get(this.activeTransition.to).name}`);
                        }
                        
                        // Check for E key press
                        if (this.game.inputManager) {
                            const ePressed = this.game.inputManager.keys['e'] || 
                                           this.game.inputManager.keys['E'] || 
                                           this.game.inputManager.keys['KeyE'];
                            if (ePressed) {
                                console.log('[ZoneManager] Player opened exit door');
                                doorOpened = true;
                                
                                // Remove exit door from collision walls so player can pass
                                if (this.corridorExitDoor && this.game.level && this.game.level.walls) {
                                    const doorIndex = this.game.level.walls.indexOf(this.corridorExitDoor);
                                    if (doorIndex !== -1) {
                                        this.game.level.walls.splice(doorIndex, 1);
                                    }
                                    // Optionally make door visually fade or open
                                    this.corridorExitDoor.material.opacity = 0.3;
                                    this.corridorExitDoor.material.transparent = true;
                                }
                                
                                // Hide message
                                if (this.game.showMessage) {
                                    this.game.showMessage('');
                                }
                                break;
                            }
                        }
                    } else {
                        // Hide message when not near doors
                        if (this.game.showMessage) {
                            this.game.showMessage('');
                        }
                    }
                    
                    // Apply collision to keep player in corridor based on corridor rotation
                    // The corridor is 4 units wide, so ±2 from center
                    if (corridorGroup && corridorGroup.rotation) {
                        const corridorRotation = corridorGroup.rotation.y;
                        const halfWidth = 2; // Corridor is 4 units wide
                        
                        // Check if corridor is rotated (roughly 90 degrees either way)
                        if (Math.abs(corridorRotation - Math.PI/2) < 0.1 || Math.abs(corridorRotation + Math.PI/2) < 0.1) {
                            // Corridor is rotated ±90 degrees, extends along X axis
                            // Clamp Z position to keep player within corridor width
                            const corridorCenterZ = corridorGroup.position.z;
                            const playerZ = this.game.player.position.z;
                            if (playerZ < corridorCenterZ - halfWidth) this.game.player.position.z = corridorCenterZ - halfWidth;
                            if (playerZ > corridorCenterZ + halfWidth) this.game.player.position.z = corridorCenterZ + halfWidth;
                        } else {
                            // Corridor is not rotated or rotated 180 degrees, extends along Z axis
                            // Clamp X position to keep player within corridor width
                            const corridorCenterX = corridorGroup.position.x;
                            const playerX = this.game.player.position.x;
                            if (playerX < corridorCenterX - halfWidth) this.game.player.position.x = corridorCenterX - halfWidth;
                            if (playerX > corridorCenterX + halfWidth) this.game.player.position.x = corridorCenterX + halfWidth;
                        }
                    }
                }
                
                // Wait a frame
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        };
        
        // Wait for player to walk through corridor and open the exit door
        await checkProgress();
        
        // Only proceed if door was opened
        if (!doorOpened) {
            console.log('[ZoneManager] Transition cancelled');
            return;
        }
        
        // Show completion message
        if (this.game.narrativeSystem) {
            this.game.narrativeSystem.displaySubtitle(`Entering ${this.zones.get(this.activeTransition.to).name}`);
        }
        
        // Clean up corridor BEFORE loading the target zone
        if (corridor && corridor.deactivate) {
            corridor.deactivate();
        } else if (corridorGroup) {
            this.scene.remove(corridorGroup);
        }
        
        // Clear walls so player doesn't collide with removed geometry
        if (this.game.level) {
            this.game.level.walls = [];
        }
        
        // Brief pause for visual transition
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // NOW trigger the actual loading of the target zone
        console.log('[ZoneManager] Loading target zone after corridor cleanup');
        if (this._deferredLoadResolve) {
            this._deferredLoadResolve();
            delete this._deferredLoadResolve;
        }
        
        // Wait for the load to complete
        await loadPromise;
        
        // Don't auto-complete - it's handled in the main function
    }
    
    /**
     * Elevator transition (hidden loading)
     */
    async transitionElevator(transition, loadPromise) {
        console.log('[ZoneManager] Creating elevator transition');
        
        // Use TransitionZoneFactory if available
        
        let elevator;
        let elevatorGroup;
        
        if (TransitionZoneFactory) {
            // Use the detailed elevator implementation
            elevator = TransitionZoneFactory.create(this.scene, 'elevator', {
                id: transition.id,
                name: transition.name,
                fromZone: this.activeTransition.from,
                toZone: this.activeTransition.to
            });
            elevator.activate();
            elevatorGroup = elevator.group;
        } else {
            // Fallback to simple elevator box
            elevatorGroup = this.createElevatorGeometry();
            this.scene.add(elevatorGroup);
        }
        
        // Position player inside elevator
        if (this.game.player) {
            this.game.player.position.set(0, 1.7, 0);
            this.game.player.velocity.set(0, 0, 0);
        }
        
        // Use a single, lightweight prompt UI for elevator interactions
        if (this.game.hideInteractPrompt) this.game.hideInteractPrompt();
        
        // Wait for player to press E to start elevator
        let elevatorStarted = false;
        const waitForInput = async () => {
            // Destination selection among transition.connects
            const opts = (this.activeTransition.transition?.connects || []).slice();
            // Ensure includes both zones
            if (opts.length === 0) opts.push(this.activeTransition.to);
            // Default selection is current 'to'
            let selected = this.activeTransition.to;
            while (this.activeTransition && !elevatorStarted) {
                // Build prompt string once per frame
                const pretty = (id) => (this.zones.get(id)?.name) || id;
                const a = opts[0] || this.activeTransition.to;
                const b = opts[1] || this.activeTransition.from;
                const msg = `Elevator: Destination ${pretty(selected)} — 1: ${pretty(a)}  2: ${pretty(b)}  • Press E to travel`;
                if (this.game.showInteractPrompt) {
                    this.game.showInteractPrompt(msg);
                } else if (this.game.showMessage) {
                    this.game.showMessage(msg);
                }

                // Handle selection keys
                if (this.game.inputManager) {
                    if (this.game.inputManager.keys['Digit1'] && a) {
                        selected = a;
                        this.game.inputManager.keys['Digit1'] = false;
                    }
                    if (this.game.inputManager.keys['Digit2'] && b) {
                        selected = b;
                        this.game.inputManager.keys['Digit2'] = false;
                    }
                    const ePressed = this.game.inputManager.keys['KeyE'];
                    if (ePressed) {
                        console.log('[ZoneManager] Player started elevator');
                        elevatorStarted = true;
                        // Apply selected destination
                        this.activeTransition.to = selected;
                        // Clear prompt
                        if (this.game.hideInteractPrompt) this.game.hideInteractPrompt();
                        if (this.game.showMessage) this.game.showMessage('');
                        // Consume key
                        this.game.inputManager.keys['KeyE'] = false;
                        break;
                    }
                }
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
        };
        
        // Wait for player input
        await waitForInput();
        
        if (!elevatorStarted) {
            console.log('[ZoneManager] Elevator transition cancelled');
            return;
        }
        
        // Suppress extra narrative spam during travel to reduce popup noise
        
        // Simulate elevator movement with camera shake
        let shakeTime = 0;
        const shakeInterval = setInterval(() => {
            if (this.game.camera) {
                this.game.camera.position.x += (Math.random() - 0.5) * 0.02;
                this.game.camera.position.z += (Math.random() - 0.5) * 0.02;
            }
            shakeTime += 100;
            if (shakeTime > 3000) {  // Longer shake
                clearInterval(shakeInterval);
            }
        }, 100);
        
        // Start loading now that player pressed E
        if (this._deferredLoadResolve) {
            this._deferredLoadResolve();
            delete this._deferredLoadResolve;
        }
        
        // Wait for loading
        await loadPromise;
        
        // Arrival message suppressed to keep UX clean
        
        // Clean up elevator
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (elevator && elevator.deactivate) {
            elevator.deactivate();
        } else if (elevatorGroup) {
            this.scene.remove(elevatorGroup);
        }
    }
    
    /**
     * Vent crawl transition
     */
    async transitionVent(transition, loadPromise) {
        // Constrain camera movement
        // Show vent interior
        // Load next zone
        await loadPromise;
    }
    
    /**
     * Create corridor geometry for transitions
     */
    createCorridorGeometry(length) {
        const corridor = new THREE.Group();
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(4, length);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0; // Floor at ground level
        floor.position.z = length / 2; // Center the corridor
        floor.receiveShadow = true;
        corridor.add(floor);
        
        // Walls
        const wallGeometry = new THREE.PlaneGeometry(length, 3);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            side: THREE.DoubleSide
        });
        
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.x = -2;
        leftWall.position.y = 1.5;
        leftWall.position.z = length / 2;
        leftWall.rotation.y = Math.PI / 2;
        corridor.add(leftWall);
        
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.x = 2;
        rightWall.position.y = 1.5;
        rightWall.position.z = length / 2;
        rightWall.rotation.y = -Math.PI / 2;
        corridor.add(rightWall);
        
        // Ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(4, length);
        const ceiling = new THREE.Mesh(ceilingGeometry, floorMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 3;
        ceiling.position.z = length / 2;
        corridor.add(ceiling);
        
        // Add doors at both ends to hide the levels
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Entrance door (near z=0) - blocks view of previous level
        const entranceDoorGeometry = new THREE.BoxGeometry(4, 3, 0.2);
        const entranceDoor = new THREE.Mesh(entranceDoorGeometry, doorMaterial);
        entranceDoor.position.set(0, 1.5, -0.5);
        entranceDoor.userData = { isEntranceDoor: true };
        corridor.add(entranceDoor);
        
        // Exit door (at far end) - player needs to press E to open
        const exitDoorGeometry = new THREE.BoxGeometry(4, 3, 0.2);
        const exitDoor = new THREE.Mesh(exitDoorGeometry, doorMaterial);
        exitDoor.position.set(0, 1.5, length + 0.5);
        exitDoor.userData = { isExitDoor: true }; // Mark as exit door for interaction
        // Make exit door glow slightly green
        exitDoor.material = doorMaterial.clone();
        exitDoor.material.emissive = new THREE.Color(0x00ff00);
        exitDoor.material.emissiveIntensity = 0.1;
        corridor.add(exitDoor);
        
        // Add multiple lights along the corridor for better visibility
        const numLights = Math.ceil(length / 10);
        for (let i = 0; i <= numLights; i++) {
            const light = new THREE.PointLight(0xffffff, 1, 15);
            light.position.set(0, 2.5, i * 10);
            corridor.add(light);
        }
        
        // Add ambient light to the scene temporarily
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        corridor.userData = { ambientLight }; // Store reference for cleanup
        
        return corridor;
    }
    
    /**
     * Fade effects for transitions
     */
    async fadeOut(duration) {
        // Would implement actual fade effect
        return new Promise(resolve => setTimeout(resolve, duration));
    }
    
    async fadeIn(duration) {
        // Would implement actual fade effect
        return new Promise(resolve => setTimeout(resolve, duration));
    }
    
    /**
     * Memory management
     */
    checkMemoryAvailable(required) {
        return (this.currentMemoryUsage + required) < this.memoryLimit;
    }
    
    async freeMemory(required) {
        console.log(`[ZoneManager] Freeing ${required} bytes of memory`);
        
        // Find least recently used zones to unload
        const sortedZones = Array.from(this.activeZones.values())
            .filter(z => z.id !== this.currentZone)
            .sort((a, b) => (a.lastVisited || 0) - (b.lastVisited || 0));
        
        let freed = 0;
        for (const zone of sortedZones) {
            if (freed >= required) break;
            
            await this.unloadZone(zone.id);
            freed += zone.memoryEstimate;
        }
    }
    
    estimateMemorySize(sizeCategory) {
        const sizes = {
            [ZoneManager.ZoneSize.TINY]: 2 * 1024 * 1024,    // 2MB
            [ZoneManager.ZoneSize.SMALL]: 10 * 1024 * 1024,   // 10MB
            [ZoneManager.ZoneSize.MEDIUM]: 25 * 1024 * 1024,  // 25MB
            [ZoneManager.ZoneSize.LARGE]: 40 * 1024 * 1024,   // 40MB
            [ZoneManager.ZoneSize.HUGE]: 60 * 1024 * 1024     // 60MB
        };
        return sizes[sizeCategory] || sizes[ZoneManager.ZoneSize.MEDIUM];
    }
    
    /**
     * Clear current level but keep player
     */
    clearCurrentLevel() {
        console.log('[ZoneManager] Clearing current level geometry');
        
        // Store objects we want to keep
        const keepObjects = new Set();
        keepObjects.add(this.game.player);
        if (this.game.player.mesh) keepObjects.add(this.game.player.mesh);
        if (this.game.camera) keepObjects.add(this.game.camera);
        
        // Store corridor objects if transition is active
        const corridorObjects = new Set();
        if (this.activeTransition) {
            this.scene.traverse(child => {
                // Keep objects that are part of the transition corridor
                if (child.userData && (child.userData.isTransitionCorridor || 
                    child.userData.isEntranceDoor || child.userData.isExitDoor)) {
                    corridorObjects.add(child);
                    // Also keep all ancestors
                    let parent = child.parent;
                    while (parent) {
                        corridorObjects.add(parent);
                        parent = parent.parent;
                    }
                }
            });
        }
        
        // Clear all scene children except player, camera, and corridor
        const toRemove = [];
        this.scene.traverse(child => {
            if (child.isMesh && !keepObjects.has(child) && !corridorObjects.has(child)) {
                // Don't remove if it's part of player or camera
                let shouldRemove = true;
                keepObjects.forEach(keeper => {
                    if (keeper && child.parent === keeper) {
                        shouldRemove = false;
                    }
                });
                if (shouldRemove) {
                    toRemove.push(child);
                }
            }
            // Also remove lights from the level
            if ((child.isLight || child.isPointLight || child.isDirectionalLight) && 
                !corridorObjects.has(child)) {
                toRemove.push(child);
            }
        });
        
        // Remove the objects
        toRemove.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
            // Dispose of geometry and materials
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        
        // Clear enemies
        if (this.game.enemies) {
            this.game.enemies.forEach(enemy => {
                if (enemy.mesh) this.scene.remove(enemy.mesh);
            });
            this.game.enemies = [];
        }
        
        // Clear pickups
        if (this.game.pickups) {
            this.game.pickups.forEach(pickup => {
                if (pickup.mesh) this.scene.remove(pickup.mesh);
            });
            this.game.pickups = [];
        }
        
        // Clear level walls array
        if (this.game.level) {
            this.game.level.walls = [];
        }
        
        // Clear the level-specific references
        if (this.game.currentLevelInstance && this.game.currentLevelInstance.clearLevel) {
            this.game.currentLevelInstance.clearLevel();
        }
        
        // Clear level references
        this.game.tutorialLevel = null;
        this.game.chapelLevel = null;
        this.game.armoryLevel = null;
        this.game.laboratoryLevel = null;
        
        console.log('[ZoneManager] Level cleared, kept player and corridor');
    }
    
    /**
     * Prepare target zone for loading
     */
    async prepareTargetZone(zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone) {
            throw new Error(`Zone not found: ${zoneId}`);
        }
        
        // Start loading the zone
        return this.loadZone(zoneId, ZoneManager.ZoneState.FULL);
    }

    /**
     * Helper function to position player after transition
     */
    positionPlayerAfterTransition(zoneId) {
        if (!this.game.player || !this.activeTransition) return;
        
        if (zoneId === 'chapel' && this.activeTransition.from === 'armory') {
            // Coming from armory, place near the door (door is at x=5, z=-20)
            this.game.player.position.set(4, 1.7, -20);  // Near door on corridor side
            // Face towards the chapel interior
            if (this.game.player.rotation) {
                this.game.player.rotation.y = 0;
            }
        } else if (zoneId === 'armory' && this.activeTransition.from === 'chapel') {
            // Temporarily disable collision to allow positioning
            this.game.skipCollisionCheck = true;
            
            // Coming from chapel, place inside the armory past the entrance door
            // Door is at z=9.8-10, so place player at z=7 (inside the armory)
            this.game.player.position.set(0, 1.7, 7);
            
            // Also set camera to match
            if (this.game.camera) {
                this.game.camera.position.set(0, 1.7, 7);
                this.game.camera.rotation.y = 0;
                this.game.camera.rotation.x = 0;
            }
            
            // Face forward into the armory (negative Z direction)
            if (this.game.player.yaw !== undefined) {
                this.game.player.yaw = 0;  // Face forward
            }
            if (this.game.player.pitch !== undefined) {
                this.game.player.pitch = 0;  // Level view
            }
            
            // Clear velocity
            if (this.game.player.velocity) {
                this.game.player.velocity.set(0, 0, 0);
            }
            
            // Re-enable collision after a delay
            setTimeout(() => {
                this.game.skipCollisionCheck = false;
                console.log('[ZoneManager] Re-enabled collision after armory entry');
            }, 100);
        } else if (zoneId === 'armory' && this.activeTransition.from === 'laboratory') {
            // Elevator arrival into Armory: place player by the armory elevator doors
            // Armory elevator is created at (0, 1.5, -51.5); place a bit in front of doors
            this.game.skipCollisionCheck = true;
            const px = 0, py = 1.7, pz = -49;
            this.game.player.position.set(px, py, pz);
            if (this.game.camera) {
                this.game.camera.position.set(px, py, pz);
                this.game.camera.rotation.y = Math.PI; // face towards armory interior or adjust as needed
                this.game.camera.rotation.x = 0;
            }
            if (this.game.player.yaw !== undefined) this.game.player.yaw = Math.PI; // face north towards interior
            if (this.game.player.pitch !== undefined) this.game.player.pitch = 0;
            if (this.game.player.velocity) this.game.player.velocity.set(0, 0, 0);
            setTimeout(() => { this.game.skipCollisionCheck = false; }, 100);
        } else if (zoneId === 'laboratory' && this.activeTransition.from === 'armory') {
            // Elevator arrival into Laboratory: place player by lab elevator
            // Lab elevator floor centered at (0, 0.1, 18.5)
            this.game.skipCollisionCheck = true;
            const px = 0, py = 1.7, pz = 18.0;
            this.game.player.position.set(px, py, pz);
            if (this.game.camera) {
                this.game.camera.position.set(px, py, pz);
                this.game.camera.rotation.y = -Math.PI; // face into lab corridor
                this.game.camera.rotation.x = 0;
            }
            if (this.game.player.yaw !== undefined) this.game.player.yaw = -Math.PI; 
            if (this.game.player.pitch !== undefined) this.game.player.pitch = 0;
            if (this.game.player.velocity) this.game.player.velocity.set(0, 0, 0);
            setTimeout(() => { this.game.skipCollisionCheck = false; }, 100);
        }
    }
    
    /**
     * Complete the transition to a new zone
     */
    async completeTransition(zoneId) {
        // Load the actual level through the game's level system
        if (this.game && this.game.loadLevelActual) {
            // Use loadLevelActual to bypass loading screen during transitions
            await this.game.loadLevelActual(zoneId);
            
            // Position player based on transition direction
            this.positionPlayerAfterTransition(zoneId);
        } else if (this.game && this.game.loadLevel) {
            // Fallback to regular loadLevel if loadLevelActual not available
            await this.game.loadLevel(zoneId);
            
            // Position player based on transition direction
            this.positionPlayerAfterTransition(zoneId);
        } else {
            // Fallback to zone-based loading
            await this.enterZone(zoneId);
            
            // Position player based on transition direction
            this.positionPlayerAfterTransition(zoneId);
            
            if (this.game.player && this.activeTransition) {
                // Handle any other zone-specific positioning not covered in helper
                if (false) { // Placeholder for future zone-specific positioning
                    // Default to zone start position
                    const zone = this.zones.get(zoneId);
                    if (zone && zone.startPosition) {
                        this.game.player.position.copy(zone.startPosition);
                    }
                }
            }
        }
        
        // Clear active transition
        this.activeTransition = null;
        
        // Also hide the loading screen if it's showing
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            loadingScreen.style.display = 'none';
        }
        
        // Resume game
        if (this.game.isPaused) {
            this.game.isPaused = false;
        }
    }
    
    /**
     * Event handlers
     */
    onZoneEntered(zoneId) {
        console.log(`[ZoneManager] Player entered zone: ${zoneId}`);
        
        // Trigger zone-specific events
        if (this.game.narrativeSystem) {
            const zone = this.zones.get(zoneId);
            if (zone) {
                this.game.narrativeSystem.displaySubtitle(`Entering: ${zone.name}`);
            }
        }
    }
    
    /**
     * Create simple elevator geometry
     */
    createElevatorGeometry() {
        const elevator = new THREE.Group();
        
        // Elevator box
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            floorMaterial
        );
        floor.rotation.x = -Math.PI / 2;
        elevator.add(floor);
        
        // Walls
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            wallMaterial
        );
        backWall.position.z = -1.5;
        backWall.position.y = 1.5;
        elevator.add(backWall);
        
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            wallMaterial
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.x = -1.5;
        leftWall.position.y = 1.5;
        elevator.add(leftWall);
        
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            wallMaterial
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.x = 1.5;
        rightWall.position.y = 1.5;
        elevator.add(rightWall);
        
        // Ceiling
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            floorMaterial
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 3;
        elevator.add(ceiling);
        
        // Door (closed)
        const doorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            metalness: 0.5
        });
        const door = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            doorMaterial
        );
        door.position.z = 1.5;
        door.position.y = 1.5;
        elevator.add(door);
        
        // Light
        const light = new THREE.PointLight(0xffffaa, 0.5, 5);
        light.position.y = 2.5;
        elevator.add(light);
        
        return elevator;
    }
    
    /**
     * Update predictive loading based on player movement
     */
    updatePredictiveLoading() {
        if (!this.predictiveLoadingEnabled || !this.game.player) return;
        
        const playerPos = this.game.player.position;
        if (!playerPos) return;
        
        // Track player movement
        if (this.lastPlayerPosition) {
            const movement = playerPos.clone().sub(this.lastPlayerPosition);
            this.playerMovementHistory.push({
                direction: movement.normalize(),
                speed: movement.length(),
                timestamp: Date.now()
            });
            
            // Keep history limited
            if (this.playerMovementHistory.length > this.maxHistoryLength) {
                this.playerMovementHistory.shift();
            }
        }
        this.lastPlayerPosition = playerPos.clone();
        
        // Predict likely next zones based on movement
        this.predictNextZones();
    }
    
    /**
     * Predict which zones the player is likely to enter next
     */
    predictNextZones() {
        if (this.playerMovementHistory.length < 3) return;
        
        // Calculate average movement direction
        const avgDirection = new THREE.Vector3();
        let totalWeight = 0;
        
        this.playerMovementHistory.forEach((movement, index) => {
            const weight = (index + 1) / this.playerMovementHistory.length; // Recent movements weighted more
            avgDirection.add(movement.direction.clone().multiplyScalar(weight));
            totalWeight += weight;
        });
        
        avgDirection.divideScalar(totalWeight);
        
        // Find zones in the predicted direction
        const adjacentZones = this.getAdjacentZones(this.currentZone);
        
        adjacentZones.forEach(zoneId => {
            const zone = this.zones.get(zoneId);
            if (!zone) return;
            
            // Calculate priority based on direction alignment
            // This would need zone position data to work properly
            const priority = this.calculateZonePriority(zoneId, avgDirection);
            this.loadingPriorities.set(zoneId, priority);
        });
        
        // Start loading high-priority zones
        this.loadPriorityZones();
    }
    
    /**
     * Calculate loading priority for a zone
     */
    calculateZonePriority(zoneId, playerDirection) {
        const zone = this.zones.get(zoneId);
        if (!zone) return 0;
        
        let priority = 50; // Base priority
        
        // Increase priority for frequently visited zones
        if (zone.lastVisited) {
            const timeSinceVisit = Date.now() - zone.lastVisited;
            if (timeSinceVisit < 60000) { // Visited in last minute
                priority += 30;
            }
        }
        
        // Check if zone is in player's direction
        // This is simplified - would need actual zone positions
        const connections = this.getConnectionToZone(this.currentZone, zoneId);
        if (connections) {
            priority += 20;
        }
        
        // Reduce priority if zone is already partially loaded
        if (zone.state === ZoneManager.ZoneState.PROXY) {
            priority -= 10;
        } else if (zone.state === ZoneManager.ZoneState.SIMPLIFIED) {
            priority -= 20;
        }
        
        return priority;
    }
    
    /**
     * Get connection between two zones
     */
    getConnectionToZone(fromZone, toZone) {
        const key1 = `${fromZone}<->${toZone}`;
        const key2 = `${toZone}<->${fromZone}`;
        return this.connections.get(key1) || this.connections.get(key2);
    }
    
    /**
     * Load zones based on priority
     */
    async loadPriorityZones() {
        // Sort zones by priority
        const sortedZones = Array.from(this.loadingPriorities.entries())
            .sort((a, b) => b[1] - a[1]);
        
        // Load top priority zones
        for (const [zoneId, priority] of sortedZones.slice(0, 2)) {
            if (priority < 60) continue; // Skip low priority
            
            const zone = this.zones.get(zoneId);
            if (!zone || zone.state !== ZoneManager.ZoneState.UNLOADED) continue;
            
            // Check memory before loading
            if (!this.checkMemoryAvailable(zone.memoryEstimate * 0.5)) {
                await this.freeMemory(zone.memoryEstimate * 0.5);
            }
            
            // Load as simplified for quick access
            this.loadZone(zoneId, ZoneManager.ZoneState.SIMPLIFIED);
        }
    }
    
    /**
     * Monitor system performance and adjust loading
     */
    updatePerformanceMode() {
        if (this.performanceMode !== 'auto') return;
        
        // Check FPS if available
        if (this.game.clock) {
            const deltaTime = this.game.clock.getDelta();
            const fps = 1 / deltaTime;
            
            if (fps < 30) {
                // Low performance - reduce loading
                this.maxLoadedZones = 2;
                this.loadRadius = 0;
                this.predictiveLoadingEnabled = false;
            } else if (fps < 45) {
                // Medium performance
                this.maxLoadedZones = 3;
                this.loadRadius = 1;
                this.predictiveLoadingEnabled = true;
            } else {
                // High performance
                this.maxLoadedZones = 4;
                this.loadRadius = 2;
                this.predictiveLoadingEnabled = true;
            }
        }
    }
    
    /**
     * Persist zone state to localStorage
     */
    persistToStorage(zoneId, state) {
        try {
            const key = `saintdoom_zone_${zoneId}`;
            const data = {
                version: 1,
                timestamp: Date.now(),
                state: {
                    enemies: state.enemies.map(e => ({
                        type: e.type,
                        position: { x: e.position.x, y: e.position.y, z: e.position.z },
                        health: e.health,
                        maxHealth: e.maxHealth,
                        isDead: e.isDead
                    })),
                    items: state.items.map(i => ({
                        type: i.type,
                        position: { x: i.position.x, y: i.position.y, z: i.position.z },
                        amount: i.amount
                    })),
                    doors: state.doors,
                    customData: state.customData
                }
            };
            
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn(`[ZoneManager] Failed to persist zone state for ${zoneId}:`, error);
        }
    }
    
    /**
     * Load zone state from localStorage
     */
    loadFromStorage(zoneId) {
        try {
            const key = `saintdoom_zone_${zoneId}`;
            const data = localStorage.getItem(key);
            
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            
            // Check if save is recent (within last 24 hours)
            const age = Date.now() - parsed.timestamp;
            if (age > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(key);
                return null;
            }
            
            // Convert back to THREE.Vector3
            const state = {
                enemies: parsed.state.enemies.map(e => ({
                    ...e,
                    position: new THREE.Vector3(e.position.x, e.position.y, e.position.z)
                })),
                items: parsed.state.items.map(i => ({
                    ...i,
                    position: new THREE.Vector3(i.position.x, i.position.y, i.position.z)
                })),
                doors: parsed.state.doors,
                customData: parsed.state.customData
            };
            
            return state;
        } catch (error) {
            console.warn(`[ZoneManager] Failed to load zone state for ${zoneId}:`, error);
            return null;
        }
    }

    /**
     * Debug info
     */
    getDebugInfo() {
        return {
            currentZone: this.currentZone,
            activeZones: Array.from(this.activeZones.keys()),
            memoryUsage: `${(this.currentMemoryUsage / 1024 / 1024).toFixed(2)}MB / ${(this.memoryLimit / 1024 / 1024).toFixed(2)}MB`,
            loadingQueue: this.loadingQueue.length,
            performanceMode: this.performanceMode,
            predictiveLoading: this.predictiveLoadingEnabled,
            loadingPriorities: Array.from(this.loadingPriorities.entries())
        };
    }
}

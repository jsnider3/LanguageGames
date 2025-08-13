# SaintDoom Development Documentation

## Last Updated: August 13, 2025

## Project Overview
SaintDoom is a browser-based FPS game with holy vs demonic themes. The game features interconnected facility zones, diverse enemy types, boss battles, and a variety of weapons. The codebase has undergone major refactoring for performance optimization and modular architecture.

## Completed Tasks

### 1. Critical Bug Fixes
- **Fixed enemies falling through floor**: Adjusted PhysicsManager ground detection to cast rays from enemy feet instead of center
- **Fixed wrong armory spawn position**: Changed from exit position (-45) to entrance position (8)  
- **Fixed knockback causing enemies to sink**: Modified knockback to apply to velocity instead of position, reduced downward force by 70%
- **Fixed armory invisible walls**: Removed blocking walls at z+15 that prevented navigation to exit
- **Fixed respawn ammo corruption**: Corrected armory level treating ammo as number instead of object

### 2. Seamless Zone Management System
- **Created ZoneManager.js** (1480+ lines): Complete zone management with memory optimization
- **Implemented zone loading states**: UNLOADED → PROXY → SIMPLIFIED → FULL
- **Created transition zones**: Security corridors, freight elevators, ventilation shafts
- **Added TransitionZones.js**: Detailed transition environments with animations
- **Integrated predictive loading**: Tracks player movement to preload likely next zones
- **Added performance adaptation**: Adjusts loading based on FPS (30/45/60 thresholds)

### 3. User Interface Enhancements
- **Created FacilityMap.js**: Interactive facility map (TAB to toggle) showing zone connections
- **Added transition UI overlay**: Shows "ZONE TRANSITION" with loading status
- **Implemented save/load system**: Full game state persistence to localStorage
- **Added visual feedback**: Pulsing indicators, loading animations, zone state colors

### 4. Level System Updates
- **Renamed levels**: chapel and armory are used directly (removed chapter1 and chapter2 aliases)
- **Fixed zone connections**: Updated all references to use new naming convention
- **Added bidirectional navigation**: Blue glowing doors for returning to previous levels
- **Fixed E key interactions**: Properly implemented return door functionality

## Current Architecture

### Core Systems
1. **Game Module** (`/modules/Game.js`)
   - Main game loop and state management
   - Integrates all subsystems
   - Performance monitoring (FPS tracking)
   - Save/load functionality
   - Debug mode support

2. **Zone Management System** (`/modules/ZoneManager.js`)
   - Dynamic zone loading/unloading
   - Memory management (100MB limit)
   - Predictive loading based on player movement
   - Zone states: UNLOADED → PROXY → SIMPLIFIED → FULL
   - Persistent state saving for zones
   - Connection management between levels

3. **Physics System** (`/modules/PhysicsManager.js`)
   - Centralized physics with gravity
   - Ground detection for enemies and player
   - Support for flying and ground-based entities
   - Knockback system (fixed to prevent sinking)
   - Terminal velocity and air resistance

4. **Performance Optimization Systems**
   - **ObjectPool** (`/modules/ObjectPool.js`): Bullet/particle reuse
   - **LODManager** (`/modules/LODManager.js`): 3-tier detail levels (high/medium/low)
   - **AnimationManager** (`/modules/AnimationManager.js`): Centralized animation updates
   - **ShadowOptimizer** (`/modules/ShadowOptimizer.js`): Limited shadow-casting lights
   - **GeometryBatcher** (`/modules/GeometryBatcher.js`): Reduced draw calls
   - **TimerManager**: Centralized timer management

5. **Visual Effects**
   - **VisualEffects** (`/effects/visualEffects.js`): Particle pools for holy/demonic/blood effects
   - **VisualEffectsManager** (`/utils/VisualEffectsManager.js`): Particle explosions and animations
   - Pre-created particle pools for performance
   - Support for gravity, fade-out, and various effect types

### Entity System

#### Base Classes
- **BaseEnemy** (`/core/BaseEnemy.js`): Core enemy AI and state machine
- **BelialState** (`/core/BelialState.js`): State machine for Belial boss

#### Enemy Types (11 implemented)
- **Standard Enemies**: imp, hellhound, zombieAgent, possessedScientist
- **Advanced Enemies**: demonKnight, shadowWraith, succubus, corruptedDrone
- **Heavy Enemies**: brimstoneGolem, possessedMechSuit, alienHybrid

#### Boss Enemies (4 implemented)
- **Belial**: Multi-phase boss with 9 different state forms
  - States: PhaseOne, PhaseTwo, PhaseThree, PriestForm, AngelForm, ShadowForm, MIBDirectorForm, TrueForm, FinalPhase
- **Subject Zero**: Experimental enemy boss
- **The Defiler**: Corruption-based boss
- **The Iron Tyrant**: Mechanical boss

### Weapon Systems

#### Core Weapons (`/modules/WeaponSystem.js`)
- **Melee**: Sword combat system
- **Ranged**: Shotgun with projectile physics
- **Holy Water**: Grenade-like throwable
- **Crucifix Launcher**: Special weapon

#### Advanced Weapons (`/weapons/`)
- **Vatican Pistol**: Holy-blessed firearm
- **Holy Lance**: Melee piercing weapon
- **Gravity Hammer**: Area-effect melee
- **Neural Scrambler**: Mind-control weapon
- **Phase Shifter**: Dimensional weapon
- **Plasma Disintegrator**: Energy weapon
- **Temporal Mine**: Time-based trap

### Level System

#### Implemented Levels
1. **Tutorial Level** (`/levels/tutorialLevel.js`): Training area
2. **Chapel Level** (`/levels/chapelLevel.js`): First main level
3. **Armory Level** (`/levels/armoryLevel.js`): Weapon cache area
4. **Laboratory Level** (`/levels/laboratoryLevel.js`): Science facility

#### Level Features
- Bidirectional navigation (blue glowing doors)
- Dynamic enemy spawning
- Pickup system for health/ammo
- Environmental storytelling elements
- Transition zones between levels

### User Interface
- **FacilityMap** (`/modules/FacilityMap.js`): TAB-activated map showing zone connections
- **TransitionZones** (`/modules/TransitionZones.js`): Detailed transition environments
  - Security corridors
  - Freight elevators
  - Ventilation shafts
- Loading overlays and status indicators
- HUD with health, ammo, score display

## Known Issues

### Transition System
- Chapel to armory transition may still use loading screen instead of seamless corridor
- Zone manager transitions might not always activate properly
- "Press E to return" prompts may not trigger consistently

### Performance Considerations
- Memory usage should stay under 100MB with zone management
- FPS adaptation thresholds: 30/45/60 FPS
- Some visual effects may impact performance on lower-end devices

## Remaining Features to Implement

### Visual Enhancements
- Environmental fog and atmosphere
- Enhanced muzzle flashes
- Improved impact effects
- Dynamic lighting improvements
- Screen shake on damage/explosions

### Gameplay Mechanics
- Jump mechanics for vertical movement
- Ladder climbing system
- Wall mantling/vaulting
- Crouch/prone positions
- Sprint stamina system

### Audio System
- Spatial 3D audio
- Ambient environment sounds
- Dynamic music system
- Weapon-specific sound effects

### Additional Content
- More enemy varieties
- Additional boss encounters
- New weapon types
- More level zones
- Collectibles and secrets

## Testing & Debug Files

### Test Files
- **test-performance.html**: Performance testing harness
- **test-transitions.html**: Zone transition testing
- **debug-init.js**: Debug initialization utilities

## Configuration

### Config System
- **modules/config/index.js**: Centralized configuration management
- Engine physics constants
- Weapon damage values
- Enemy stats and behaviors
- Performance thresholds

## Development Guidelines

### Code Conventions
- ES6 modules with explicit imports
- Three.js for all 3D rendering
- Object pooling for frequently created/destroyed objects
- State machines for complex entity behaviors
- Separation of concerns (rendering, physics, game logic)

### Performance Best Practices
- Pre-create particle pools
- Use LOD for distant objects
- Batch geometry where possible
- Limit shadow-casting lights
- Implement zone-based loading
- Monitor memory usage

### File Organization
```
/SaintDoom/
├── core/           # Base classes and core systems
├── modules/        # Game systems and managers
├── levels/         # Level definitions
├── enemies/        # Enemy implementations
├── bosses/         # Boss implementations
├── weapons/        # Weapon definitions
├── effects/        # Visual and audio effects
├── utils/          # Utility functions
└── test-*.html     # Test harnesses
```

## Quick Start for New Development

1. **Running the Game**: Open `index.html` in a modern browser with ES6 module support
2. **Debug Mode**: Set `game.debugMode = true` in console
3. **Test Levels**: Use test-*.html files for isolated testing
4. **Performance Monitoring**: Check FPS counter in top-left corner
5. **Save/Load**: Press appropriate keys (configured in InputManager)

## Recent Session History

### August 13, 2025
- Fixed critical physics bugs (enemies falling through floor)
- Implemented comprehensive zone management system
- Added facility map and UI improvements
- Started visual effects implementation
- Documented current architecture and status

## Contact & Support
For questions about the codebase or architecture decisions, refer to this documentation first. Key systems are well-commented in their respective files.

---
*Documentation reflects codebase status as of August 13, 2025*
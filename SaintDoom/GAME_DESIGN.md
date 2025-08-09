# SaintDoom: Unholy Retribution - Game Design Document

*For narrative, story, and lore details, see [STORY_AND_LORE.md](STORY_AND_LORE.md)*

## Game Overview
A fast-paced, Doom-inspired first-person shooter featuring unique dual weapon systems (holy and technological), rage-based power mechanics, and strategic combat against varied enemy types. The game runs entirely in browser using modern web technologies.

## Core Gameplay Mechanics

### Holy Rage System
- Build divine fury through combat to unlock devastating holy abilities
- Rage meter fills through successful kills and holy weapon usage
- Unleash area-of-effect miracles when fully charged

### Holy Focus System
- **Righteous Fury**: Offensive stance with increased damage and attack speed
- **Divine Protection**: Defensive stance with damage reduction and healing aura
- **Martyrdom**: Balanced stance that builds rage faster through taking damage
- Switch between focuses based on combat situations - you're always blessed, just channeling different aspects of divine power

### Relic Collection
- Gather sacred artifacts throughout levels
- Each relic modifies abilities or unlocks new powers
- Combine relics for synergistic effects

### Confession Mechanic
- Extract intel from dying enemies through "last rites"
- Reveals secrets, lore, and hidden passages
- Optional but rewards exploration and strategic gameplay

### Martyrdom Mode
- Upon death, briefly become an invincible spirit
- Limited time for revenge kills before respawning
- Reduces death penalty and maintains combat flow

## Weapon Systems

### Holy Arsenal (Mixed Medieval & Modern)
- **Sanctified Longsword**: Your preferred weapon, fast combos, can deflect projectiles
- **Blessed Shotgun**: Learned in WWI trenches, fires consecrated salt rounds
- **Holy Lance**: Medieval reach weapon, charging attack pierces multiple enemies
- **Vatican Combat Pistol**: Standard sidearm since 1950s, blessed silver bullets
- **Throwing Crucifixes**: Ranged daggers that pin demons to walls
- **Sacred Warhammer**: Devastating melee, creates shockwaves on heavy strikes
- **Blessed Crossbow**: Silent option, explosive bolt upgrade available
- **Holy Water Grenades**: Modern delivery system for ancient blessing

### MIB Technology
- **Plasma Disintegrator**: Standard alien tech rifle with moderate damage
- **Gravity Hammer**: Melee weapon that creates shockwaves
- **Phase Shift Device**: Allows brief teleportation through walls
- **Neural Scrambler**: Causes enemies to attack each other temporarily
- **Temporal Mine Launcher**: Slows time in explosion radius

### Power-ups
- **Divine Shield**: Temporary invincibility
- **Saint's Wrath**: Double damage for 30 seconds
- **Miraculous Healing**: Full health restoration
- **Ethereal Step**: Increased movement speed and jump height
- **Revelation**: Reveals all secrets on current level

## Enemy Types

### Demonic Forces
- **Possessed Scientists**: Low health, slow movement, melee only
- **Hellhounds**: High speed, low health, pack AI behavior
- **Succubi Infiltrators**: Ranged psychic attacks, teleportation ability
- **Brimstone Golems**: High health, slow movement, area damage on death
- **Shadow Wraiths**: Phase shift ability, vulnerable only during attack frames
- **Demon Knights**: High health, melee and ranged attacks, shield mechanic
- **Imps**: Low health, high mobility, projectile attacks

### Corrupted MIB Assets
- **Zombie Agents**: Medium health, hitscan weapons, cover usage
- **Alien Hybrids**: Random ability sets, medium health, unpredictable movement
- **Possessed Mech Suits**: Very high health, multiple weapon systems, weak points
- **Grey Berserkers**: Fast movement, high damage, low defense
- **Black Ops Snipers**: Long range, high damage, laser sight warning
- **Mutant Guard Dogs**: Fast, low health, leap attacks, pack tactics

### Boss Encounters
- **The Defiler**: Three-phase boss with add spawning and arena control
- **Subject Zero**: Teleporting boss with mixed attack patterns
- **The Iron Tyrant**: Possessed military mech with destructible parts
- **Belial**: Final boss with illusion mechanics and multiple forms

## Level Design & Progression

### Prologue: Tutorial Sequence
0. **Training Facility** - Tutorial level with movement, combat, and ability training
   - Movement controls and physics introduction
   - Basic combat against training dummies
   - Ability system demonstration
   - Weapon switching and ammunition management
   - Final training gauntlet before deployment

### Chapter 1: Initial Levels
1. **Entry Level** - Introduction to real combat, basic enemy types
2. **Laboratory Complex** - Multi-room exploration, weapon pickups, keycards

### Chapter 2: Mid-Game
3. **Weapons Cache** - Major weapon upgrades, ammunition stockpiles
4. **Containment Area** - Environmental hazards, trap rooms, enemy waves

### Chapter 3: Underground
5. **Tunnel Network** - Close-quarters combat, limited visibility, ambush points
6. **Spawning Grounds** - Swarm mechanics, crowd control challenges

### Chapter 4: Vertical Gameplay
7. **Observatory Tower** - Zero-gravity sections, long-range combat
8. **Communications Tower** - Vertical level design, platforming, sniping positions

### Chapter 5: Endgame
9. **Reactor Core** - Radiation hazards, timed sequences, environmental puzzles
10. **Final Arena** - Multi-phase boss fight, arena hazards, full arsenal required

### Environmental Features
- Destructible walls and objects revealing secrets and alternate paths
- Interactive elements (explosive barrels, electric panels, switches)
- Dynamic lighting affecting enemy visibility and player stealth
- Verticality in level design with multiple elevation layers

## Technical Implementation

### Core Technology Stack
- **Three.js or Babylon.js**: 3D graphics rendering
- **WebGL 2.0**: Hardware acceleration
- **Web Audio API**: Spatial sound and dynamic music
- **WebAssembly**: Performance-critical code (physics, AI)
- **IndexedDB**: Local save game storage
- **Service Workers**: Offline play capability

### Visual Design
- **Art Style**: Gothic-Sci-Fi fusion with retro-modern aesthetics
- **Lighting**: Dynamic contrast between holy light and demonic darkness
- **Texture Work**: Detailed environmental textures with pixelated enemy sprites
- **Particle Effects**: Extensive use for atmosphere (incense, smoke, energy)
- **Post-Processing**: Bloom, motion blur, screen-space reflections

### Performance Optimization
- **Level Streaming**: Load sections dynamically to reduce memory usage
- **LOD System**: Multiple detail levels for models based on distance
- **Occlusion Culling**: Don't render what the player can't see
- **Texture Atlasing**: Combine textures to reduce draw calls
- **Object Pooling**: Reuse enemy and projectile objects

### Browser-Specific Features
- **Cross-Platform**: Runs on any modern browser without installation
- **Cloud Saves**: Sync progress across devices
- **Adaptive Controls**: Keyboard/mouse, gamepad, and touch support
- **Streaming Integration**: Built-in Twitch/YouTube streaming capability
- **Mod Support**: JavaScript-based modding API

### Audio Design
- **Dynamic Soundtrack**: Gregorian chants mixed with industrial metal
- **3D Spatial Audio**: Directional sound for enemy positioning
- **Adaptive Music**: Intensity changes based on combat state
- **Voice Acting**: Latin prayers, demon growls, military chatter

## Gameplay Features

### Difficulty Modes
- **Novice**: For story-focused players
- **Crusader**: Standard difficulty
- **Martyr**: Hard mode with limited saves
- **Damnation**: Permadeath, no health pickups

### Progression System
- **Experience Points**: Gain XP from kills and exploration
- **Skill Trees**: Holy powers, weapon mastery, physical abilities
- **Weapon Upgrades**: Modify weapons with found components
- **Cosmetic Unlocks**: Alternative saint appearances and weapon skins

### Weapon Alt-Fire Modes
Each weapon has secondary functionality:
- **Sanctified Longsword**: Parry stance that reflects projectiles back at enemies
- **Blessed Shotgun**: Dragon's breath rounds that ignite enemies
- **Holy Lance**: Thrown like a javelin for long-range kills (retrieves automatically)
- **Vatican Combat Pistol**: Rapid fire mode empties clip with blessed fury
- **Throwing Crucifixes**: Charged throw creates burning area on impact
- **Sacred Warhammer**: Overhead slam that stuns all nearby enemies
- **Blessed Crossbow**: Fire three bolts in spread pattern
- **Holy Water Grenades**: Impact detonation vs timed fuse
- **Plasma Disintegrator**: Overcharge for piercing beam
- **Gravity Hammer**: Ground slam vs directional shockwave
- **Neural Scrambler**: Single target vs area effect

### Enemy Weak Points
Strategic targeting for bonus damage:
- **Possessed Scientists**: Headshots instant kill
- **Hellhounds**: Blessed weapons do 2x damage
- **Brimstone Golems**: Cooling vents on back are vulnerable
- **Shadow Wraiths**: Holy water makes them solid temporarily
- **Alien Hybrids**: EMP effects from tech weapons stun them
- **Demon Knights**: Destroy armor first, then vulnerable

### Multiplayer Modes (Future Update)
- **Cooperative Campaign**: 2-player story mode
- **Survival Mode**: Wave-based defense against endless hordes
- **Versus Mode**: Saints vs Demons asymmetric combat
- **Daily Challenges**: Compete for high scores on special levels

## Specific Game Systems

### Glory Blessing System
Medieval combat execution mechanics:
- **Righteous Execution**: Sword finishers on stunned enemies restore health
- **Decapitation**: Instant kills with proper timing restore Holy Rage
- **Exorcism Blade**: Plunge sword into possessed enemies to release ammo
- **Environmental Kills**: Impale enemies on wall spikes, throw into holy water
- **Martyrdom Chain**: Quick successive melee kills increase rage generation
- **Parry Riposte**: Perfect blocks open enemies for instant execution
- **Crusader's Momentum**: Each melee kill increases attack speed temporarily

### Relic Examples
Specific artifacts with gameplay effects:
- **Crown of Thorns**: Take 10% more damage, deal 25% more damage
- **Stigmata Nails**: Slowly bleed health but regenerate ammo
- **Communion Wafer**: Killing blessed enemies heals you
- **Incorruptible Heart**: Immunity to poison/radiation for 30 seconds
- **Papal Seal**: Unlock secret Inquisition weapon caches
- **Saint Peter's Keys**: Open any door without keycards

### Environmental Hazards
- **Radiation Zones**: Require hazmat suits or holy protection
- **Demonic Corruption**: Spreading floor hazard that damages over time
- **Gravity Anomalies**: Alien tech creating low-gravity pockets
- **Holy Water Systems**: Activatable sprinklers that damage demons
- **Unstable Portals**: Teleport randomly if touched
- **Blessed Barriers**: Block demons but player can pass through

### Boss Attack Patterns

**The Defiler** (3 phases):
- Phase 1: Corrupts terminals to spawn adds, laser sweep attacks
- Phase 2: EMP blasts disable tech weapons, must use holy weapons
- Phase 3: Full room corruption, floor becomes hazard, aerial attacks

**Subject Zero**:
- Teleportation between attack combos
- Mind control that reverses controls temporarily  
- Alien weapon barrage followed by demonic charge
- Summons both alien drones and imps simultaneously

**Belial, Lord of Lies**:
- Creates false copies of himself
- Illusion walls that hide/reveal enemies
- Reverses the level geometry temporarily
- Final phase: Makes you fight shadow version of yourself

### Secret Levels
- **Archive Level**: Melee-only challenge level with unique layouts
- **Tech Facility**: Technology weapons only, alien enemy focus
- **Diplomatic Zone**: Unique mechanic - enemies must attack first
- **Defense Mission**: Wave-based survival mode with escalating difficulty

### Accessibility Features
- **Colorblind Modes**: Protanopia, Deuteranopia, Tritanopia filters
- **Subtitle Options**: Full dialogue, sound effects descriptions
- **Difficulty Adjustments**: Separate sliders for enemy health/damage/speed
- **Control Remapping**: Full keyboard and gamepad customization
- **Auto-Aim Assistance**: Adjustable magnetism strength
- **Motion Sickness Options**: FOV slider, reduce screen shake, disable head bob

## User Interface

### HUD Elements
- Health and armor display with holy iconography
- Ammunition counter styled as prayer beads
- Rage meter depicted as ascending flame
- Minimap with fog of war
- Objective tracker with scripture quotes

### Menu Design
- Gothic cathedral aesthetic with sci-fi elements
- Animated stained glass windows showing game scenes
- Latin text with English subtitles
- Atmospheric background with distant chanting

## Monetization Strategy
- **Base Game**: Free-to-play with full campaign
- **Premium Pass**: Cosmetics, early weapon unlocks, bonus levels
- **DLC Campaigns**: Additional story chapters
- **No Pay-to-Win**: All gameplay elements earnable through play

## Development Roadmap

### Phase 1: Core Prototype
- Basic movement and shooting
- 3 weapons, 3 enemy types
- 1 complete level
- Core mechanics implementation

### Phase 2: Vertical Slice
- Full first chapter (2 levels)
- 6 weapons, 8 enemy types
- Boss encounter
- Save system

### Phase 3: Beta Release
- 5 complete levels
- All weapons and core enemies
- Progression system
- Public beta testing

### Phase 4: Full Release
- Complete 10-level campaign
- All features implemented
- Performance optimization
- Marketing and launch

## Target Audience
- **Primary**: Fans of classic FPS games (Doom, Quake, Duke Nukem)
- **Secondary**: Players interested in unique narrative mashups
- **Tertiary**: Browser gaming enthusiasts seeking AAA-quality experiences

## Unique Selling Points
1. Unprecedented genre mashup: Catholic mysticism meets alien conspiracy
2. Browser-based with no installation required
3. Unique protagonist: zombified saint as action hero
4. Dual weapon system combining holy and sci-fi arsenals
5. The Inquisition portrayed as humanity's protectors
6. Rich lore blending real history with supernatural fiction
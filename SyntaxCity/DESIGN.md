# SyntaxCity - Programming Language Tower Defense
## Comprehensive Game Design Document

---

## 🎯 Core Concept

**"Defend your codebase from invading bugs using programming concepts as towers!"**

A tower defense game where players strategically place programming construct towers to eliminate bugs traveling along code execution paths. Each tower represents a fundamental programming concept with unique mechanics that mirror real code behavior.

---

## 🎮 Core Gameplay Loop

1. **Wave Preparation Phase** (15 seconds)
   - Review incoming bug types
   - Place new towers using earned resources
   - Upgrade existing towers
   - Activate power-ups

2. **Wave Execution Phase** (30-90 seconds)
   - Bugs spawn and follow paths
   - Towers automatically target and attack
   - Player can activate special abilities
   - Earn resources for each eliminated bug

3. **Wave Complete**
   - Bonus resources for perfect waves (no leaks)
   - Unlock new tower types/upgrades
   - Progress narrative

4. **Game Over Conditions**
   - **Win**: Complete all waves in a level
   - **Lose**: Too many bugs reach the endpoint (codebase "crashes")

---

## 🏗️ Tower System

### Resource Costs
- **Memory Units (MU)**: Primary currency for building towers
- **CPU Cycles (CC)**: Required for upgrades and special abilities

### Tower Types (12 Total)

#### 1. **Variable Tower** `let x = value`
- **Cost**: 50 MU
- **Damage**: Low (5)
- **Range**: Medium
- **Attack Speed**: Fast (0.5s)
- **Special**: Cheapest tower, good early game
- **Visual**: Simple blue cube with variable symbol

#### 2. **Function Tower** `function()`
- **Cost**: 100 MU
- **Damage**: Medium (15)
- **Range**: Long
- **Attack Speed**: Medium (1.0s)
- **Special**: Precise single-target, ignores 20% armor
- **Upgrade Path**: Arrow Function → Pure Function → Higher-Order Function
- **Visual**: Purple sphere with parentheses, shoots code brackets

#### 3. **Loop Tower** `for/while`
- **Cost**: 150 MU
- **Damage**: Low per hit (3)
- **Range**: Short
- **Attack Speed**: Very Fast (0.2s)
- **Special**: Hits same target multiple times, stacking damage
- **Upgrade Path**: For Loop → While Loop → Infinite Loop (ultimate)
- **Visual**: Green rotating ring, rapid fire projectiles

#### 4. **Conditional Tower** `if/else`
- **Cost**: 120 MU
- **Damage**: Medium (12)
- **Range**: Medium
- **Attack Speed**: Medium (0.8s)
- **Special**: Smart targeting - always hits highest HP or fastest enemy
- **Upgrade Path**: If/Else → Switch/Case → Ternary Operator (faster)
- **Visual**: Yellow diamond with branching paths

#### 5. **Array Tower** `[]`
- **Cost**: 180 MU
- **Damage**: Medium (10) to multiple targets
- **Range**: Medium
- **Attack Speed**: Slow (2.0s)
- **Special**: Shoots 3 projectiles at different targets simultaneously
- **Upgrade Path**: Array → Map/Filter → Reduce (combines damage)
- **Visual**: Orange grid pattern, shoots indexed elements

#### 6. **Object Tower** `{}`
- **Cost**: 200 MU
- **Damage**: High (25)
- **Range**: Short
- **Attack Speed**: Slow (2.5s)
- **Special**: Damage increases with each property (nearby towers)
- **Upgrade Path**: Object → Class → Prototype Chain
- **Visual**: Red cube with key-value pairs floating around

#### 7. **Async Tower** `async/await`
- **Cost**: 250 MU
- **Damage**: Very High (40)
- **Range**: Long
- **Attack Speed**: Very Slow (4.0s)
- **Special**: Delayed hit - marks target, hits after 2 seconds regardless of position
- **Upgrade Path**: Callback → Promise → Async/Await
- **Visual**: Cyan hourglass, temporal distortion effects

#### 8. **Regex Tower** `/pattern/`
- **Cost**: 220 MU
- **Damage**: Low (8)
- **Range**: Large Area
- **Attack Speed**: Medium (1.5s)
- **Special**: Area slow - reduces enemy speed by 40% in range
- **Upgrade Path**: Simple Pattern → Capture Groups → Lookahead/Lookbehind
- **Visual**: Magenta pattern grid, emanates wave patterns

#### 9. **Try/Catch Tower** `try{catch}`
- **Cost**: 300 MU
- **Damage**: None
- **Range**: Medium
- **Attack Speed**: N/A
- **Special**: Defensive - "catches" one bug per wave and removes it safely
- **Upgrade Path**: Try/Catch → Finally Block → Error Boundaries
- **Visual**: White shield bubble, contains errors

#### 10. **Recursion Tower** `function(n-1)`
- **Cost**: 350 MU
- **Damage**: Scaling (starts at 5, doubles per hit)
- **Range**: Medium
- **Attack Speed**: Slow (2.0s)
- **Special**: Each successive hit on same target doubles damage (resets on kill)
- **Upgrade Path**: Simple Recursion → Tail Recursion → Memoized Recursion
- **Visual**: Fractal spiral, projectiles split and multiply

#### 11. **Closure Tower** `() => {}`
- **Cost**: 280 MU
- **Damage**: Medium (18)
- **Range**: Medium
- **Attack Speed**: Fast (0.7s)
- **Special**: "Captures" last killed enemy type, deals +50% to that type
- **Upgrade Path**: Function Closure → Module Pattern → IIFE
- **Visual**: Teal enclosed box with captured variables

#### 12. **Generator Tower** `function*`
- **Cost**: 400 MU
- **Damage**: Variable
- **Range**: Long
- **Attack Speed**: Special
- **Special**: Yields different attack types each shot (rotate: pierce, splash, stun)
- **Upgrade Path**: Generator → Iterator Protocol → Symbol.iterator
- **Visual**: Gold star with rotating symbols, metamorphic projectiles

---

## 🐛 Enemy System

### Enemy Types (15 Types)

#### **Basic Bugs** (Waves 1-5)

1. **SyntaxError**
   - HP: 20 | Speed: Medium | Value: 10 MU
   - Behavior: Standard movement
   - Visual: Red text with squiggly line

2. **ReferenceError**
   - HP: 30 | Speed: Fast | Value: 15 MU
   - Behavior: Moves erratically
   - Visual: Purple question mark, jitters

3. **TypeError**
   - HP: 50 | Speed: Slow | Value: 20 MU
   - Behavior: Has 20% armor (reduces damage)
   - Visual: Orange mismatched shapes

#### **Intermediate Bugs** (Waves 6-12)

4. **NullPointer**
   - HP: 40 | Speed: Very Fast | Value: 25 MU
   - Behavior: Ignores first tower hit (becomes visible after)
   - Visual: Ghostly null symbol, semi-transparent

5. **InfiniteLoop**
   - HP: 100 | Speed: Very Slow | Value: 40 MU
   - Behavior: Regenerates 2 HP/second
   - Visual: Green ouroboros (snake eating tail)

6. **MemoryLeak**
   - HP: 60 | Speed: Slow | Value: 30 MU
   - Behavior: Spawns 2 mini-leaks on death
   - Visual: Dripping blue blobs

7. **RaceCondition**
   - HP: 35 | Speed: Variable (randomly accelerates/slows)
   - Value: 35 MU
   - Behavior: Unpredictable speed changes
   - Visual: Two arrows racing, flickering

8. **DeadLock**
   - HP: 80 | Speed: Stops periodically
   - Value: 45 MU
   - Behavior: Freezes for 2s every 5s, invulnerable while frozen
   - Visual: Two locks interlinked

#### **Advanced Bugs** (Waves 13-20)

9. **StackOverflow**
   - HP: 150 | Speed: Medium | Value: 60 MU
   - Behavior: Explodes on death, damaging nearby towers (10% HP)
   - Visual: Overflowing stack of papers

10. **HeapCorruption**
    - HP: 120 | Speed: Fast | Value: 55 MU
    - Behavior: Teleports short distances randomly
    - Visual: Fragmented memory blocks

11. **SegmentationFault**
    - HP: 200 | Speed: Slow | Value: 80 MU
    - Behavior: Heavy armor (50% damage reduction), immune to slow
    - Visual: Segmented armor plates, metallic

12. **BufferOverflow**
    - HP: 90 | Speed: Fast | Value: 50 MU
    - Behavior: Gets faster as it takes damage
    - Visual: Expanding buffer with red overflow

#### **Boss Bugs** (Every 5 waves)

13. **The Spaghetti Code**
    - HP: 500 | Speed: Slow | Value: 200 MU
    - Behavior: Spawns minions continuously, tangled path movement
    - Visual: Massive tangled spaghetti monster

14. **The Legacy System**
    - HP: 800 | Speed: Very Slow | Value: 300 MU
    - Behavior: Immune to towers placed during wave, requires pre-planning
    - Visual: Ancient mainframe with cobwebs

15. **The Production Bug**
    - HP: 1000 | Speed: Medium | Value: 500 MU
    - Behavior: Multi-phase fight, calls backup bugs at 75%/50%/25% HP
    - Visual: Glowing red critical error symbol

---

## 🗺️ Map & Level Design

### Map Structure
- **Grid-based placement**: 20x15 tile grid
- **Fixed paths**: Bugs follow predefined routes (like code execution)
- **Buildable zones**: Light areas where towers can be placed
- **Unbuildable zones**: Paths and restricted areas

### Level Themes (8 Levels)

1. **Tutorial - Hello World**
   - 5 waves, simple straight path
   - Introduces: Variables, Functions, basic bugs
   - Story: "Your first program. Keep it clean!"

2. **The Startup Codebase**
   - 10 waves, single winding path
   - Introduces: Loops, Conditionals, Arrays
   - Story: "Rapid development = rapid bugs. Stay vigilant!"

3. **The Refactor**
   - 12 waves, path splits and merges
   - Introduces: Objects, Async
   - Story: "Cleaning up technical debt attracts old bugs."

4. **Open Source Chaos**
   - 15 waves, multiple entry points
   - Introduces: Regex, Try/Catch
   - Story: "100 contributors, 1000 bugs. Welcome to OSS."

5. **The Legacy Migration**
   - 18 waves, complex branching paths
   - Introduces: Recursion, Closures
   - Boss: The Legacy System
   - Story: "Modernizing ancient code awakens dormant horrors."

6. **Production Deployment**
   - 20 waves, dynamic paths (change mid-level)
   - Introduces: Generators
   - Story: "Friday evening deployment. What could go wrong?"

7. **The Security Audit**
   - 22 waves, bugs can backtrack on paths
   - All advanced bugs, fast-paced
   - Story: "Every vulnerability found is trying to break in."

8. **The Kernel Panic**
   - 25 waves, maze-like paths, limited space
   - Final Boss: The Production Bug (enhanced version)
   - Story: "The ultimate debugging challenge. Core meltdown imminent."

### Difficulty Progression
- **Wave Composition**: Early waves = few weak bugs → Later waves = many mixed bugs + bosses
- **Speed Scaling**: Enemy speed increases 5% every 5 waves
- **HP Scaling**: Enemy HP increases 10% every 3 waves
- **Resource Scaling**: Later waves give more MU/CC

---

## 💎 Progression & Meta Systems

### Upgrade Paths
Each tower has 3 upgrade tiers:
- **Tier 1**: Base tower (purchased with MU)
- **Tier 2**: Enhanced version (costs 2x base + 50 CC)
  - +50% damage, +20% range OR speed
  - Visual upgrade: Glowing effects
- **Tier 3**: Ultimate version (costs 3x base + 150 CC)
  - +100% effectiveness, gains unique ability
  - Visual upgrade: Particle effects, new model

### Combo System - "Code Synergy"
Adjacent towers (within 1 tile) create bonuses:

| Combination | Effect |
|-------------|--------|
| Function + Loop | Loop attacks faster near Function (+25% speed) |
| Array + Conditional | Conditional can target Array's targets (shared vision) |
| Async + Any tower | Nearby tower gains 10% damage (async optimization) |
| Object + 3+ towers | Object gains +10 damage per adjacent tower (properties) |
| Recursion + Recursion | Both gain +1 to scaling multiplier (deeper recursion) |
| Regex + Loop | Loop's rapid fire applies Regex's slow effect |
| Try/Catch + Tower | Protected tower survives StackOverflow explosions |
| Closure + Same type | Closure "captures" synergy, keeps bonus even if other moves |

### Power-Ups (Activated Abilities)
Cost CC to use, cooldown per wave:

1. **Garbage Collector** (100 CC, 5 wave cooldown)
   - Instantly destroys all bugs under 10% HP
   - Visual: System-wide cleanup sweep

2. **Code Review** (80 CC, 3 wave cooldown)
   - Slows all bugs by 80% for 5 seconds
   - Visual: Magnifying glass over battlefield

3. **Hot Reload** (60 CC, 2 wave cooldown)
   - All towers attack 300% faster for 8 seconds
   - Visual: Towers glow red-hot

4. **Stack Trace** (120 CC, 4 wave cooldown)
   - Reveals all enemy paths and shows HP bars for 10 seconds
   - Visual: Overlay grid with debugging info

5. **Emergency Patch** (150 CC, once per level)
   - Instantly kills one boss or 5 regular enemies
   - Visual: Giant "PATCH" stamp crushes bugs

### Persistent Unlocks (Between Levels)
- **Research Points (RP)**: Earned by completing levels perfectly
- Spend RP on permanent upgrades:
  - **Starting Resources**: +50 MU per level
  - **Tower Discounts**: -10% cost for specific tower type
  - **Interest Rate**: Earn +1 MU per wave for unused MU
  - **Fast Forward**: Increase game speed by 25%/50%/75%
  - **Emergency Reserve**: Start with 100 banked CC

---

## 🎨 Visual Design

### Art Style
- **Low-poly 2D aesthetic** with clean lines
- **Neon/cyberpunk color palette**: Bright against dark backgrounds
- **Code-themed**: Syntax highlighting colors, monospace fonts
- **Particle effects**: Projectiles leave code snippets, bugs disintegrate into error messages

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  SYNTAXCITY    Wave: 5/20    Lives: ❤️❤️❤️❤️   MU: 450  CC: 120│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [GAME CANVAS]                            │
│              20x15 grid - main play area                    │
│          Towers placed, bugs moving, effects               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [var] [fn] [loop] [if] [arr] [obj] [async] [regex] ...   │
│   50    100   150   120   180   200   250     220          │
│                                                             │
│  Selected: Function Tower                                   │
│  Damage: 15 | Range: 120px | Speed: 1.0s                  │
│  [Upgrade Tier 2: 200MU + 50CC]  [Sell: 75MU]             │
│                                                             │
│  Power-ups: [GC] [Review] [Hot Reload] [Stack Trace]      │
│             100CC  80CC     60CC        120CC              │
│                                                             │
│  Next Wave in: 12s  [START WAVE NOW] [Fast Forward: 2x]   │
└─────────────────────────────────────────────────────────────┘
```

### Animation Details
- **Tower Attacks**: Projectiles with trails, different shapes per tower type
- **Bug Movement**: Smooth interpolation along paths, idle animations
- **Damage Numbers**: Float upward on hit, color-coded (white=normal, yellow=crit, red=resist)
- **Explosions**: Particle bursts with fragments
- **Combos**: Visual connection lines between synergized towers (pulsing)

### Sound Design (Optional, can be muted)
- **Background Music**: Synthwave/chiptune, increases tempo with wave intensity
- **Tower Placement**: Click/confirm sound
- **Tower Attacks**: Unique sound per tower type (function = "fwoosh", loop = rapid "pew-pew-pew")
- **Bug Death**: Glitch/error sound effects
- **Wave Complete**: Victory jingle
- **Lose Condition**: Crash/blue screen sound

---

## ⚙️ Technical Architecture

### File Structure
```
SyntaxCity/
├── index.html              # Main HTML file
├── css/
│   └── style.css           # Styles and layout
├── js/
│   ├── main.js             # Entry point, initialization
│   ├── Game.js             # Core game loop and state
│   ├── Tower.js            # Tower base class
│   ├── TowerTypes.js       # All tower definitions
│   ├── Enemy.js            # Enemy base class
│   ├── EnemyTypes.js       # All enemy definitions
│   ├── Level.js            # Level definitions and paths
│   ├── Pathfinding.js      # Path following logic
│   ├── Projectile.js       # Projectile system
│   ├── GridManager.js      # Grid and placement logic
│   ├── UIManager.js        # UI rendering and controls
│   ├── EffectsManager.js   # Particle effects and animations
│   ├── Renderer.js         # Canvas rendering
│   ├── SaveManager.js      # LocalStorage save/load
│   ├── Utils.js            # Helper functions
│   └── Constants.js        # Configuration values
├── assets/
│   └── sprites/            # (Optional) Image assets
├── README.md               # How to play
└── DESIGN.md               # This document
```

### Core Systems

#### 1. Game Loop
```javascript
// 60 FPS game loop
function gameLoop(deltaTime) {
    update(deltaTime);      // Update game state
    render();               // Draw to canvas
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    // Update in order:
    1. Spawn enemies (wave manager)
    2. Move enemies along paths
    3. Tower target acquisition
    4. Tower attacks (projectile spawning)
    5. Projectile movement
    6. Collision detection
    7. Apply damage and effects
    8. Remove dead entities
    9. Check wave/game end conditions
}
```

#### 2. Pathfinding System
- **Pre-calculated paths**: Each level has fixed waypoint paths
- **Waypoint system**: Bugs move from waypoint to waypoint
- **Dynamic pathing** (advanced levels): Some bugs can choose branches

```javascript
class Path {
    waypoints = [{x, y}, {x, y}, ...];

    getNextWaypoint(currentIndex) {
        // Returns next target position
    }

    getProgress(enemy) {
        // Returns 0.0 to 1.0 for path completion
    }
}
```

#### 3. Targeting System
```javascript
class Tower {
    targetingMode = 'FIRST';  // FIRST, LAST, STRONG, WEAK, CLOSE

    acquireTarget(enemies) {
        // Filter enemies in range
        // Sort by targeting priority
        // Return best target
    }
}
```

#### 4. Damage System
```javascript
function applyDamage(tower, enemy, projectile) {
    let damage = projectile.damage;

    // Apply armor reduction
    damage *= (1 - enemy.armor);

    // Apply tower bonus (combos, upgrades)
    damage *= tower.damageMultiplier;

    // Apply resistances/weaknesses
    damage *= getTypeEffectiveness(tower.type, enemy.type);

    enemy.hp -= damage;

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}
```

#### 5. Save System
```javascript
class SaveManager {
    saveGame() {
        localStorage.setItem('syntaxcity_save', JSON.stringify({
            currentLevel: game.level,
            unlockedLevels: game.unlocked,
            researchPoints: game.rp,
            upgrades: game.permanentUpgrades,
            settings: game.settings
        }));
    }

    loadGame() {
        // Restore from localStorage
    }
}
```

### Performance Optimizations

1. **Object Pooling**
   - Reuse projectile and particle objects
   - Avoid constant new/delete operations

2. **Spatial Grid**
   - Divide canvas into grid cells
   - Only check collisions within relevant cells

3. **Dirty Rectangle**
   - Only redraw changed portions (optional optimization)

4. **Entity Culling**
   - Don't update off-screen effects

5. **RequestAnimationFrame**
   - Use browser's optimized frame timing

---

## 🎯 Game Balance Philosophy

### Resource Economy
- **Early game**: Scarce resources, strategic placement crucial
- **Mid game**: More income, can experiment with builds
- **Late game**: High income but need efficient high-tier towers

### Tower Balance
- **Role diversity**: Each tower fills a niche (single target, AoE, support, etc.)
- **No dominant strategy**: All towers viable, map-dependent
- **Upgrade value**: Tier 2/3 should feel powerful but expensive

### Difficulty Curve
- **Wave 1-5**: Tutorial, forgiving
- **Wave 6-15**: Steady increase, requires upgrades
- **Wave 16-25**: Challenging, needs combos and strategy
- **Boss waves**: Difficulty spikes, test of preparation

### Scoring System
```
Final Score =
    (Bugs Killed × 10) +
    (Remaining Lives × 1000) +
    (Remaining MU × 2) +
    (Tower Value × 5) +
    (Wave Speed Bonus × 500)
```

---

## 📱 Accessibility & Polish

### Accessibility Features
- **Colorblind modes**: Alternative color palettes
- **Adjustable game speed**: 0.5x, 1x, 1.5x, 2x
- **Pause anytime**: Game pauses when out of focus
- **Clear visual indicators**: Range circles, target lines, damage numbers
- **Tooltips everywhere**: Hover for detailed info
- **Keyboard shortcuts**: 1-9 to select towers, Space to start wave, P to pause

### Quality of Life
- **Undo last placement**: Refund immediately after placing
- **Auto-save**: Every wave completion
- **Skip seen dialogues**: For replays
- **Tower placement preview**: Show range before committing
- **Enemy info on hover**: See HP, type, resistances
- **Fast forward**: Speed up waves when confident

### Replayability
- **Daily Challenge**: Random modifiers (2x speed, half resources, etc.)
- **Achievements**: 30+ challenges (use only 3 tower types, no leaks, etc.)
- **Leaderboards**: Local high scores per level
- **New Game+**: Replay with all upgrades but harder enemies

---

## 🚀 Future Expansion Ideas

### Potential DLC/Updates
1. **New Language Pack**: Python-themed towers (decorators, list comprehensions)
2. **Framework Frenzy**: React, Vue, Angular themed levels
3. **Database Defense**: SQL/NoSQL themed towers vs data corruption bugs
4. **Multiplayer Co-op**: Two players share a map
5. **Puzzle Mode**: Pre-placed towers, find the winning strategy
6. **Sandbox Mode**: Unlimited resources, experiment freely

---

## 📊 Success Metrics

### Player Engagement Goals
- **Session length**: Average 20-30 minutes per play
- **Completion rate**: 60% of players complete level 3
- **Retention**: 40% return for second session
- **Mastery**: 10% complete all levels on hard mode

### Educational Impact
- Players can name 5+ programming concepts after playing
- Understand relationships between concepts (loops are fast, recursion scales)
- Spark interest in actual programming

---

## 🎓 Learning Outcomes

### What Players Learn
1. **Programming Vocabulary**: Exposure to terms in context
2. **Concept Relationships**: How different constructs work together
3. **Strategic Thinking**: Resource management, planning ahead
4. **Systems Thinking**: Understanding emergent behavior from simple rules
5. **Debugging Mindset**: Identifying and fixing problems (tower placement)

### How It Teaches
- **Learning by doing**: Experimentation encouraged
- **Immediate feedback**: See results of decisions instantly
- **Progressive complexity**: Start simple, build up
- **Failure as learning**: Losing teaches better strategies
- **Metaphorical understanding**: Bugs as enemies, code as defense

---

## 🎬 Narrative Framework

### Story Arc
1. **Act 1** (Levels 1-3): Introduction to codebase defense
   - Meet "The Debugger" (player character)
   - Learn about the bug invasion

2. **Act 2** (Levels 4-6): Escalation
   - Bugs get smarter and more dangerous
   - Discover the source: corrupted legacy code

3. **Act 3** (Levels 7-8): Final confrontation
   - Face The Production Bug (ultimate boss)
   - Save the codebase and restore stability

### Character Dialogue (Between Waves)
- **The Debugger** (player): Determined, tactical
- **The Compiler** (ally): Provides tips and encouragement
- **The Code Reviewer** (mentor): Gives strategic advice
- **The Bugs**: Taunting messages ("NullPointerException: Your defense strategy was not found!")

---

## ✅ MVP vs Full Version

### MVP (Minimum Viable Product) - Phase 1
- 5 tower types (Variable, Function, Loop, Conditional, Array)
- 8 enemy types (basic + intermediate bugs)
- 3 levels with 30 total waves
- Basic upgrade system (tier 2 only)
- Core game loop with save/load
- Simple UI and effects

### Full Version - Phase 2+
- All 12 tower types
- All 15 enemy types including bosses
- All 8 levels (150+ waves)
- Full upgrade paths (tier 3)
- Combo system and power-ups
- Polish: advanced effects, sound, achievements
- Additional modes (daily challenges, etc.)

---

## 🎉 Conclusion

**SyntaxCity** combines engaging tower defense gameplay with educational programming concepts in a way that's fun for both beginners and experienced developers. The game respects the player's time with clear progression, rewards strategic thinking, and creates memorable moments through boss fights and combo mechanics.

The modular architecture allows for easy expansion, and the balance between accessibility and depth ensures wide appeal. Most importantly, it fits perfectly into the LanguageGames collection as a polished, playable experience that teaches while entertaining.

**Development Time Estimate**:
- MVP: ~20-30 hours
- Full Version: ~60-80 hours with polish

**Target Audience**:
- Primary: Programming students and junior developers
- Secondary: Tower defense fans curious about programming
- Tertiary: Experienced developers looking for themed entertainment

Let's build this! 🚀

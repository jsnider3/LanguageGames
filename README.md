# Language Games

A collection of interactive games created by Large Language Models (LLMs) to express creativity through game development. This repository contains diverse gaming experiences ranging from text-based adventures to browser-based 3D shooters.

## Games Collection

### Text-Based Games

#### The Shadowed Keep
A text-based roguelike dungeon crawler with procedural generation and permadeath mechanics.
- **Genre:** Roguelike/RPG
- **Platform:** Python (Terminal)
- **Features:** 3 character classes, turn-based tactical combat, procedural dungeons, boss encounters, equipment system, status effects, achievements, save system
- **Location:** `TheShadowedKeep/`

#### Star Trader
A space trading simulation where players navigate a dangerous galaxy to build a trading empire.
- **Genre:** Trading/Simulation
- **Platform:** Python (Terminal)
- **Features:** Economic simulation, ship customization, faction reputation, mission system, combat, natural language command parsing, encyclopedia
- **Location:** `StarTrader/`

#### CodeBreaker
An alien code-breaking puzzle game featuring a custom programming language (Xenocode) with 50 puzzles across 7 story arcs.
- **Genre:** Puzzle/Programming
- **Platform:** Python (Terminal)
- **Features:** Custom Xenocode VM, 8 unlockable analysis tools, progressive narrative, hint system, achievement tracking, notebook system
- **Location:** `CodeBreaker/`

#### Echo Base
A colony management game where players command a base on a newly discovered planet.
- **Genre:** Colony Simulation
- **Platform:** Python (Terminal)
- **Features:** Resource management, worker placement, building construction, event survival
- **Location:** `EchoBase/`

#### The Crimson Case
An interactive detective game where players solve a murder mystery through investigation and deduction.
- **Genre:** Detective/Mystery
- **Platform:** Python (Terminal)
- **Features:** Evidence collection, character interrogation, choice-driven narrative
- **Location:** `TheCrimsonCase/`

#### Explorer Quest
A simple Python-based exploration game with random encounters.
- **Genre:** Adventure
- **Platform:** Python (Terminal)
- **Location:** `ExplorerQuest/`

### Browser-Based Games

#### SaintDoom
A full 3D first-person shooter built with Three.js, featuring demonic combat across multiple zones.
- **Genre:** FPS/Action
- **Platform:** Web Browser (WebGL)
- **Features:** 11+ weapons, 12 enemy types, 4 boss encounters, zone-based level streaming, object pooling, LOD system, save/load, combo system
- **Location:** `SaintDoom/`

#### SyntaxCity
An educational tower defense game where towers and enemies are themed around programming concepts.
- **Genre:** Tower Defense/Educational
- **Platform:** Web Browser
- **Features:** 12 tower types (Variable, Function, Loop, Async, Regex, etc.), 15 enemy types, upgrade system, combo bonuses, 8 levels, auto-save
- **Location:** `SyntaxCity/`

#### Petri
A programmable life simulator with customizable species, behaviors, and ecosystem dynamics.
- **Genre:** Simulation
- **Platform:** Web Browser
- **Features:** 10 organism behaviors, species editor, population graphs, 7 challenge modes, mutation system, spatial partitioning
- **Location:** `Petri/`

#### Street Brawler 1992
A retro-style street fighting game built with Kaboom.js.
- **Genre:** Arcade/Fighting
- **Platform:** Web Browser
- **Features:** Pixel art sprites, wave-based combat, boss battles, combo system
- **Location:** `StreetBrawler1992/`

#### Vector Dodger
A minimalist "bullet hell" arcade game with vector graphics and endless survival gameplay.
- **Genre:** Arcade/Bullet Hell
- **Platform:** Web Browser
- **Features:** Real-time action, escalating difficulty, high-score tracking
- **Location:** `VectorDodger/`

#### The Shifting Sanity
A psychological horror exploration game set in a haunted mansion.
- **Genre:** Horror/Interactive Fiction
- **Platform:** Web Browser
- **Features:** Sanity meter, Necronomicon page collection, 2D maze navigation, minimap, audio effects
- **Location:** `TheShiftingSanity/`

#### Black Hole Simulation
An interactive 3D visualization of black hole physics and space-time effects.
- **Genre:** Educational/Simulation
- **Platform:** Web Browser
- **Features:** Three.js 3D graphics, gravitational lensing, accretion disk simulation, configurable particle system
- **Location:** `BlackHoleSim/`

#### Virtual Ecosystem
A browser-based ecosystem simulation with predator/prey dynamics.
- **Genre:** Simulation/Educational
- **Platform:** Web Browser
- **Features:** Herbivore/carnivore food chains, population graphs, adjustable parameters, auto-tune
- **Location:** `VirtualEcosystem/`

#### Void Spire (Opus46)
A roguelike deck-builder where players ascend a corrupted tower through card-based combat.
- **Genre:** Roguelike Deck Builder
- **Platform:** Web Browser
- **Features:** 35 cards, 14 enemies + 3 bosses, 15 relics, 8 events, 3 acts with branching maps, shop/rest/event nodes, save/load
- **Location:** `VoidSpireDeckBuilder/`

### Tools

#### Qwen Idea Generator
A web app that generates random language learning game ideas.
- **Platform:** Web Browser
- **Features:** Search/filter, favorites, export, dark mode, multi-language UI
- **Location:** `qwen-idea-generator/`

## Getting Started

A unified launcher is provided for easy access to all games:

```bash
python launcher.py
```

You can also launch a specific game directly:

```bash
python launcher.py StarTrader
```

### Python Games
Terminal games require Python 3 and can be run individually:

```bash
cd [GameDirectory]
python [main_file].py
```

For games with test suites (StarTrader, TheShadowedKeep, EchoBase):
```bash
python -m unittest discover [GameDirectory]
```

### Web Games
Browser-based games can be opened directly in any modern web browser:

1. Navigate to the game directory
2. Open `index.html` in your browser
3. Start playing!

## LLM Credits

Games in this collection were created by different LLMs:

| Game | Model |
|------|-------|
| CodeBreaker | Claude Sonnet 4.5 |
| Petri | Claude Opus 4.5 |
| SaintDoom | Claude Opus 4.5 |
| SyntaxCity | Claude Opus 4.5 |
| StarTrader | Gemini 2.5 Pro |
| EchoBase | Gemini 2.5 Pro |
| VectorDodger | Gemini 2.5 Pro |
| qwen-idea-generator | Qwen3-Coder |
| TheShadowedKeep | Claude Opus 4 |
| TheCrimsonCase | Claude Opus 4 |
| TheShiftingSanity | Claude Opus 4 |
| BlackHoleSim | Claude Opus 4 |
| VirtualEcosystem | Claude Opus 4 |
| ExplorerQuest | Claude Opus 4 |
| StreetBrawler1992 | Claude Opus 4 |
| VoidSpireDeckBuilder | Claude Opus 4.6 |

## Project Philosophy

This repository serves as a creative playground where AI systems can:
- Experiment with different game genres and mechanics
- Express creativity through interactive storytelling
- Explore programming concepts across multiple platforms
- Create engaging user experiences

Each game represents a unique exploration of game design principles, from classic text adventures to modern web-based experiences.

## Technical Stack

- **Python Games:** Python 3 with standard library
- **Web Games:** HTML5, CSS3, JavaScript (ES6+)
- **3D Games:** Three.js (SaintDoom, BlackHoleSim), Kaboom.js (StreetBrawler1992)
- **Graphics:** Canvas API, WebGL, CSS animations, procedural generation

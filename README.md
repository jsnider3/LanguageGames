# Language Games

A collection of interactive games created by Large Language Models (LLMs) to express creativity through game development. This repository contains diverse gaming experiences ranging from text-based adventures to browser-based arcade games.

## Games Collection

### Text-Based Adventures

#### The Crimson Case
An interactive detective game where players solve a murder mystery through investigation and deduction.
- **Genre:** Detective/Mystery
- **Platform:** Python (Terminal)
- **Features:** Evidence collection, character interrogation, choice-driven narrative
- **Location:** `TheCrimsonCase/`

#### The Shadowed Keep
A text-based roguelike dungeon crawler with procedural generation and permadeath mechanics.
- **Genre:** Roguelike/RPG
- **Platform:** Python (Terminal)
- **Features:** Random dungeon generation, turn-based combat, risk vs. reward gameplay
- **Location:** `TheShadowedKeep/`

#### Star Trader
A space trading simulation where players navigate a dangerous galaxy to build a trading empire.
- **Genre:** Trading/Simulation
- **Platform:** Python (Terminal)
- **Features:** Economic simulation, ship customization, faction reputation, mission system
- **Location:** `StarTrader/`

#### Echo Base
A colony management game where players command a base on a newly discovered planet.
- **Genre:** Colony Simulation
- **Platform:** Python (Terminal)
- **Features:** Resource management, worker placement, building construction, event survival
- **Location:** `EchoBase/`

#### Explorer Quest
A Python-based exploration game.
- **Platform:** Python (Terminal)
- **Location:** `ExplorerQuest/`

### Browser-Based Games

#### Vector Dodger
A minimalist "bullet hell" arcade game with vector graphics and endless survival gameplay.
- **Genre:** Arcade/Bullet Hell
- **Platform:** Web Browser
- **Features:** Real-time action, escalating difficulty, high-score tracking
- **Location:** `VectorDodger/`

#### The Shifting Sanity
An interactive web-based experience with dynamic styling and gameplay mechanics.
- **Genre:** Interactive Fiction
- **Platform:** Web Browser
- **Location:** `TheShiftingSanity/`

#### Black Hole Simulation
An interactive 3D visualization of black hole physics and space-time effects.
- **Genre:** Educational/Simulation
- **Platform:** Web Browser
- **Features:** 3D graphics, physics simulation
- **Location:** `BlackHoleSim/`

#### Virtual Ecosystem
A browser-based ecosystem simulation exploring environmental interactions.
- **Genre:** Simulation/Educational
- **Platform:** Web Browser
- **Location:** `VirtualEcosystem/`

## Getting Started

### Python Games
Most text-based games require Python 3 and can be run directly:

```bash
cd [GameDirectory]
python [main_file].py
```

For games with test files, you can verify functionality:
```bash
python -m unittest test_[game_name].py
```

### Web Games
Browser-based games can be opened directly in any modern web browser:

1. Navigate to the game directory
2. Open `index.html` in your browser
3. Start playing!

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
- **Graphics:** Canvas API, CSS animations, procedural generation

# SaintDoom: Unholy Retribution

A browser-based FPS game where you play as Saint Giovanni, resurrected by the Vatican to stop a demonic invasion.

## How to Run

The game is currently in a single HTML file (`saintdoom.html`) for easy local testing without CORS issues.

### Option 1: Simple Python Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open http://localhost:8000/saintdoom.html

### Option 2: Node.js Server
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```
Then open http://localhost:8000/saintdoom.html

### Option 3: VS Code Live Server
If using VS Code, install the "Live Server" extension and right-click on `saintdoom.html` → "Open with Live Server"

## Controls

- **WASD** - Move
- **Mouse** - Look around
- **Left Click** - Attack
- **Right Click** - Block (with sword)
- **1-4** - Switch weapons
- **E** - Interact/Open doors
- **R** - Activate Holy Rage (when meter is full)
- **Shift** - Sprint
- **ESC** - Pause

## Weapons

1. **Blessed Sword** - Unlimited ammo, good damage, builds rage faster
2. **Blessed Shotgun** - Powerful spread damage, uses shells
3. **Holy Water Grenades** - Area damage, bounces
4. **Crucifix Launcher** - Piercing projectiles with holy damage

## Game Features

- 3 levels with increasing difficulty
- Multiple enemy types (Possessed Scientists, Hellhounds)
- Boss battle with Belial
- Martyrdom Mode after 7 deaths (permanent buffs)
- Combo system for score multipliers
- Holy Rage mode for temporary invincibility
- Pickups: Health, Armor, Ammo

## Recent Fixes

- Fixed HUD display issues
- Fixed enemy facing direction
- Added proper player-enemy collision detection
- Fixed death screen and respawn system
- Improved enemy AI with wall avoidance
- Added centralized audio manager
- Implemented functional blocking mechanics

## Module Structure (For Future Refactoring)

The game has been designed with modularity in mind. The existing module files are:
- `player.js` - Player controller
- `enemy.js` - Enemy AI and types
- `combat.js` - Weapon systems
- `level.js` - Level generation
- `collision.js` - Collision detection
- `input.js` - Input management
- `game.js` - Main game loop

To convert to modules, run a local web server and update the HTML to use `type="module"` scripts.
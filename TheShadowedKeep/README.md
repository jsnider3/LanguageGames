# The Shadowed Keep

A sophisticated text-based roguelike dungeon crawler with rich gameplay mechanics, visual effects, and strategic combat.

## 🎮 Overview

The Shadowed Keep is a turn-based roguelike adventure where you explore procedurally generated dungeons, battle monsters, solve puzzles, and collect treasures. With multiple character classes, diverse combat options, and permanent progression through achievements, each playthrough offers a unique experience.

## ✨ Features

### Core Gameplay
- **Procedural Generation**: Every dungeon layout is unique with randomly placed rooms, monsters, and treasures
- **Turn-Based Combat**: Strategic combat with multiple actions (attack, defend, dodge, parry, spells)
- **Permadeath**: Death is permanent, but achievements carry over between runs
- **Character Classes**: Choose from Warrior, Mage, or Rogue, each with unique abilities
- **Progression System**: Level up to increase stats, unlock achievements for permanent rewards

### Visual & UI
- **ASCII Art**: Colorful ASCII art for monsters, rooms, and special effects
- **Visual Effects**: Health bars, damage animations, and color-coded messages
- **Interactive Tutorial**: Comprehensive tutorial system for new players
- **Combat Log**: Track recent combat actions with detailed history
- **Map System**: Visual dungeon map showing explored and unexplored areas

### Game Systems
- **Equipment System**: Find and equip weapons, armor, and accessories
- **Consumables**: Healing potions, antidotes, stat boosters, and more
- **Status Effects**: Poison, stun, weakness, regeneration, strength, and shield
- **Merchant System**: Buy items using natural language ("buy 2 healing potion")
- **Boss Battles**: Multi-phase boss fights with unique mechanics
- **Environmental Puzzles**: Riddles, lever sequences, and pattern matching
- **Secret Rooms**: Hidden areas unlocked by solving puzzles
- **Achievement System**: 18+ achievements with unlock rewards
- **Difficulty Scaling**: Adaptive difficulty and New Game Plus mode

## 🚀 Getting Started

### Requirements
- Python 3.8 or higher
- Terminal with ANSI color support (Windows Terminal, iTerm2, or standard Linux/Mac terminal)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd TheShadowedKeep

# Run the game
python shadowkeep.py
```

### First Time Players
1. When starting, choose "yes" for the interactive tutorial
2. Select your character class:
   - **Warrior**: Balanced fighter with extra HP per level
   - **Mage**: Magic user with spell power ability
   - **Rogue**: Agile fighter with critical hit bonuses
3. Use single-letter commands for quick actions (e.g., 'n' for north, 'a' for attack)

## 🎯 How to Play

### Basic Commands
- **Movement**: `north/n`, `south/s`, `east/e`, `west/w` (or arrow keys)
- **Information**: `map/m`, `inventory/i`, `stats`, `log`
- **Actions**: `look/l`, `use [item]`, `help/h`
- **System**: `save`, `quit`

### Combat Commands
- **Attack (a)**: Standard damage attack
- **Defend (d)**: Reduce incoming damage by 50%
- **Dodge**: 75% chance to avoid all damage (3-turn cooldown)
- **Parry**: 50% chance to block and counterattack (2-turn cooldown)
- **Spell (s)**: Cast spell for bonus damage (Mage only)
- **Run (r)**: Attempt to flee (25% chance of taking damage)

### Shopping
When you encounter a merchant:
1. Type `shop` to see available items
2. Buy items with: `buy [item name]` or `buy [quantity] [item name]`
3. Examples: `buy healing potion`, `buy 3 bread`, `buy antidote`

## 🏆 Game Content

### Monsters
- **Common**: Goblin, Slime, Spider, Skeleton
- **Uncommon**: Orc, Bandit, Skeleton Archer
- **Rare**: Troll, Mimic
- **Bosses**: Goblin King, Orc Warlord, Skeleton Lord, Troll Chieftain, Shadow Lord

### Items & Equipment
- **Weapons**: Rusty Dagger, Iron Sword, Steel Sword
- **Armor**: Leather Armor, Chain Mail
- **Accessories**: Lucky Charm, Health Ring
- **Consumables**: Healing items, stat boosters, utility items

### Room Types
- Monster encounters
- Treasure rooms
- Equipment chambers
- Merchant shops
- Healing fountains
- Trap rooms
- Puzzle chambers
- Boss arenas
- Secret rooms

## 🛠️ Development

### Project Structure
```
TheShadowedKeep/
├── shadowkeep.py          # Main game entry point
├── player.py              # Player class and character management
├── monsters.py            # Monster definitions and AI
├── combat_manager.py      # Combat system logic
├── dungeon_map.py         # Map generation and navigation
├── room_content.py        # Room types and content generation
├── equipment.py           # Weapons, armor, and equipment system
├── consumables.py         # Items and inventory management
├── achievements.py        # Achievement tracking and rewards
├── visual_effects.py      # ASCII art and visual enhancements
├── tutorial_system.py     # Interactive tutorial
├── combat_messages.py     # Dynamic combat message generation
├── combat_log.py          # Combat history tracking
├── saves/                 # Save files directory
└── tests/                 # Unit tests
```

### Running Tests
```bash
# Run all tests
python run_tests.py

# Run specific test file
python -m unittest tests/test_combat.py
```

## 🎮 Tips & Strategies

1. **Save healing items** for boss fights and emergencies
2. **Learn enemy patterns** - each monster type has unique behaviors
3. **Explore thoroughly** - secret rooms contain valuable rewards
4. **Manage cooldowns** - dodge and parry are powerful but limited
5. **Check the combat log** (`log` command) to review recent actions
6. **Solve puzzles** for bonus XP and access to secret areas
7. **Equipment matters** - upgrade whenever you find better gear

## 📝 Recent Updates

- **Tutorial System**: Interactive tutorial for new players
- **Combat Variety**: Dynamic message system reduces repetitive text
- **Combat Log**: Track last 5-10 actions for better readability
- **Merchant Improvements**: Natural language shopping ("buy 2 healing potion")
- **Visual Enhancements**: Improved ASCII art and color coding
- **Puzzle System**: Environmental puzzles with multiple types
- **Achievement System**: Persistent rewards across playthroughs

## 🤝 Contributing

Contributions are welcome! The game is designed with extensibility in mind:
- Add new monsters by extending the `Monster` class
- Create new room types by extending `RoomContent`
- Add new items by extending `ConsumableItem` or `Equipment`
- Implement new puzzles by extending the `Puzzle` class

## 📄 License

This project is open source. See LICENSE file for details.

---

*May your journey through The Shadowed Keep be filled with glory and treasure!*
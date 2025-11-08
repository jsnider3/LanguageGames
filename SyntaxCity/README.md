# SyntaxCity - Programming Tower Defense

**Defend your codebase from invading bugs using programming concepts as towers!**

A tower defense game where each tower represents a fundamental programming construct, and enemies are different types of bugs trying to corrupt your code.

## 🎮 How to Play

### Quick Start

**⚠️ IMPORTANT:** This game uses ES6 modules and **must** be run through a local web server (not by opening the HTML file directly).

**Easiest Method - Python:**
```bash
# Navigate to the SyntaxCity directory
cd path/to/LanguageGames/SyntaxCity

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open **http://localhost:8000** in your browser.

**Alternative Methods:**

<details>
<summary>Node.js</summary>

```bash
cd path/to/LanguageGames/SyntaxCity
npx serve
# or
npm install -g http-server
http-server
```
</details>

<details>
<summary>VS Code Live Server</summary>

1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"
</details>

<details>
<summary>PHP</summary>

```bash
cd path/to/LanguageGames/SyntaxCity
php -S localhost:8000
```
</details>

### Game Instructions

1. Place towers on the grid to defend against bugs
2. Prevent bugs from reaching the end of the path
3. Complete waves to progress through levels

### Objective

Defend your codebase by preventing bugs from reaching the endpoint. You lose lives when bugs get through. Game over when lives reach zero!

## 🏗️ Game Mechanics

### Resources

- **Memory Units (MU)**: Used to build and upgrade towers
  - Earned by defeating enemies
  - Starting amount: 200 MU

- **CPU Cycles (CC)**: Used for tower upgrades and power-ups
  - Earned as bonus from defeating enemies (20% of MU reward)
  - Starting amount: 0 CC

### Towers (12 Types)

Each tower represents a programming concept with unique mechanics:

1. **Variable** `let` - Basic tower, cheap and fast (50 MU)
2. **Function** `fn()` - Precise single-target, ignores 20% armor (100 MU)
3. **Loop** `for` - Rapid-fire with stacking damage (150 MU)
4. **Conditional** `if{}` - Smart targeting (highest HP/fastest) (120 MU)
5. **Array** `[]` - Shoots 3 projectiles at different targets (180 MU)
6. **Object** `{}` - Damage scales with nearby towers (200 MU)
7. **Async** `async` - Delayed powerful hit after 2 seconds (250 MU)
8. **Regex** `/pattern/` - Area slow, reduces speed by 40% (220 MU)
9. **Try/Catch** `try{}` - Catches one bug per wave (300 MU)
10. **Recursion** `f(n-1)` - Doubles damage on successive hits (350 MU)
11. **Closure** `()=>{}` - Captures enemy type, +50% damage to that type (280 MU)
12. **Generator** `fn*` - Rotates attack types: pierce, splash, stun (400 MU)

### Upgrade System

- **Tier 1**: Base tower
- **Tier 2**: +50% damage, +20% range/speed (Cost: 2x base + 50 CC)
- **Tier 3**: +100% effectiveness (Cost: 3x base + 150 CC)

### Combo Bonuses

Place towers adjacent to each other for synergy effects:

- **Function + Loop**: Loop attacks 25% faster
- **Array + Conditional**: Shared vision
- **Async + Any**: +10% damage to adjacent tower
- **Object + Multiple**: +10 damage per adjacent tower
- **Recursion + Recursion**: Enhanced scaling multiplier
- **Regex + Loop**: Slow effect on rapid fire

### Enemies (15 Types)

**Basic Bugs:**
- **SyntaxError** - Standard enemy
- **ReferenceError** - Fast and erratic
- **TypeError** - Armored (20% damage reduction)

**Intermediate:**
- **NullPointer** - Invisible until first hit
- **InfiniteLoop** - Regenerates 2 HP/second
- **MemoryLeak** - Splits into 2 mini-leaks on death
- **RaceCondition** - Variable speed
- **DeadLock** - Freezes periodically, invulnerable while frozen

**Advanced:**
- **StackOverflow** - Explodes on death, damaging towers
- **HeapCorruption** - Teleports randomly
- **SegmentationFault** - Heavy armor (50%), immune to slow
- **BufferOverflow** - Gets faster as damaged

**Bosses:**
- **The Spaghetti Code** - Spawns minions continuously
- **The Legacy System** - Immune to towers placed during wave
- **The Production Bug** - Multi-phase, calls reinforcements

### Power-Ups (5 Available)

Activate with CPU Cycles during waves:

1. **Garbage Collector** (100 CC) - Destroys all bugs under 10% HP
2. **Code Review** (80 CC) - Slows all bugs by 80% for 5 seconds
3. **Hot Reload** (60 CC) - All towers attack 300% faster for 8 seconds
4. **Stack Trace** (120 CC) - Reveals paths and HP bars for 10 seconds
5. **Emergency Patch** (150 CC) - Kills 1 boss or 5 regular enemies (once per level)

## 🗺️ Levels (8 Total)

1. **Hello World** - Tutorial (5 waves)
2. **The Startup Codebase** - Single winding path (10 waves)
3. **The Refactor** - Split paths (12 waves)
4. **Open Source Chaos** - Multiple entry points (15 waves)
5. **The Legacy Migration** - Complex branching (18 waves)
6. **Production Deployment** - Dynamic paths (20 waves)
7. **The Security Audit** - Fast-paced advanced bugs (22 waves)
8. **The Kernel Panic** - Final challenge (25 waves)

## ⌨️ Keyboard Shortcuts

- **1-9**: Select tower type
- **Enter**: Start wave
- **P**: Pause
- **Esc**: Cancel tower placement
- **F**: Toggle fast forward
- **U**: Upgrade selected tower
- **Delete**: Sell selected tower
- **?**: Show help

## 💡 Strategy Tips

1. **Start Simple**: Place Variable and Function towers early
2. **Choke Points**: Focus towers where paths converge
3. **Combo Wisely**: Adjacent towers create powerful synergies
4. **Balance Your Build**: Mix damage types (single-target, AoE, support)
5. **Upgrade Strategically**: Better to upgrade good towers than build many weak ones
6. **Save Power-Ups**: Use during boss waves or when overwhelmed
7. **Learn Enemy Types**: Adapt your strategy to counter specific bugs
8. **Try/Catch Towers**: Great for thinning out waves early
9. **Recursion on Bosses**: Maximum damage on high-HP targets
10. **Regex for Crowds**: Slows down groups effectively

## 🎨 Visual Indicators

- **Green highlight**: Valid tower placement
- **Red highlight**: Invalid placement (path or occupied)
- **Dashed circle**: Tower range
- **Pulsing lines**: Combo connections between towers
- **HP bars**: Enemy health (shown when damaged)
- **Damage numbers**: Float upward when enemies take damage
  - White: Normal damage
  - Yellow: Critical/bonus damage
  - Red: Reduced/resisted damage

## 💾 Save System

- Progress automatically saves after each level
- Tracks unlocked levels and research points
- Saves settings and preferences
- Stored in browser localStorage

## 🛠️ Technical Details

- **Built with**: Vanilla JavaScript ES6+
- **Rendering**: HTML5 Canvas 2D
- **No dependencies**: Runs directly in browser
- **Resolution**: 1200x700 game canvas
- **Performance**: Optimized with object pooling and spatial grids

## 🎯 Scoring

Your final score is calculated from:
- Bugs defeated (10 points each)
- Lives remaining (1000 points each)
- Resources remaining (2 points per MU)
- Towers placed (50 points each)
- Waves completed (500 points each)

## 🐛 Troubleshooting

**CORS Error / "Failed to load resource" errors?**
- **YOU MUST USE A LOCAL WEB SERVER** - Don't open index.html directly!
- See the "Quick Start" section above for server setup
- The game uses ES6 modules which browsers block on `file://` protocol

**Game won't load?**
- Ensure you're using a modern browser (Chrome, Firefox, Edge, Safari)
- Check browser console for errors (F12)
- Make sure you're running a local web server (see above)
- Try refreshing the page

**Low performance?**
- Close other tabs
- Reduce game speed
- Disable combo visualization in settings

**Saved game lost?**
- Check browser localStorage isn't disabled
- Don't use incognito/private mode

## 📝 Credits

- **Game Design**: Comprehensive tower defense with educational programming themes
- **Concept**: Programming concepts as towers defending against code bugs
- **Created with**: Claude Code (Anthropic's AI assistant)

## 📄 License

Part of the LanguageGames collection. Free to play and modify.

---

## 🎓 Educational Value

SyntaxCity teaches programming concepts through gameplay:

- **Tower names** map to real programming constructs
- **Special abilities** mirror actual code behavior
- **Combo system** reflects how code components interact
- **Bug types** represent real software errors
- **Strategic thinking** parallels software architecture decisions

Perfect for:
- Programming students learning terminology
- Developers looking for themed entertainment
- Anyone curious about programming concepts

---

**Enjoy defending your codebase!** 🚀

Debug mode: Type `debugGame()` in browser console for game state info.

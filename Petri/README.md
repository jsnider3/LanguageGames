# Petri - Programmable Life Simulator

A browser-based simulation where you design organisms by defining behavioral rules, then watch emergent behavior unfold in a petri dish environment.

## How to Play

**This game uses ES6 modules and must be run through a local web server.**

```bash
# Navigate to the Petri directory
cd path/to/LanguageGames/Petri

# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

## Core Concept

Instead of controlling organisms directly, you design their **behavioral rules**:
- How strongly do they seek food?
- Do they flock together or stay isolated?
- Do they flee from larger organisms or hunt smaller ones?
- Do they match velocity with their flock or scatter?

Then you release them into the petri dish and watch what happens. The gap between the simple rules you define and the complex behaviors that emerge is where the fun lies.

## Controls

| Action | Control |
|--------|---------|
| Play/Pause | Space |
| Reset | R |
| Step forward | . (period) |
| Spawn food | Click dish |
| Spawn organisms | Shift+click species, then click dish |
| Place obstacle | Click "+ Add" then click dish |

## Features

### Population Graph
Real-time visualization of population dynamics. Watch predator-prey cycles, population booms, and extinctions unfold.

### Species Presets
Quickly add pre-designed species:
- **Grazer** - Peaceful herbivore, flocks together, flees predators
- **Predator** - Larger, faster, hunts smaller organisms
- **Swarmer** - Small, fast, highly social with alignment behavior
- **Loner** - Avoids everyone, high sense range
- **Blob** - Large, slow, energy-efficient, seeks center

### Obstacles
Add rocks to the environment that organisms must navigate around. Creates interesting terrain and affects movement patterns.

### Visual Effects
- Birth effects (expanding ring + particles)
- Death effects (fading particle burst)
- Energy bars showing organism status

## Species Editor

Click any species to open the full editor:

### Appearance
- **Name** - What to call this species
- **Color** - Visual identification
- **Size** - Affects predator/prey relationships

### Attributes
- **Max Speed** - How fast organisms can move
- **Sense Range** - How far they can detect food and others
- **Starting Energy** - Initial energy when spawned

### Behaviors (10 total)

| Behavior | Description |
|----------|-------------|
| **Wander** | Random exploration when nothing else to do |
| **Seek Food** | Move toward nearby food particles |
| **Avoid Edge** | Stay away from the dish boundary |
| **Flock** | Stay near others of the same species |
| **Align** | Match velocity with nearby flockmates (boids-style) |
| **Avoid Crowding** | Keep personal space from all organisms |
| **Flee Predators** | Run away from larger organisms |
| **Hunt Prey** | Chase and eat smaller organisms |
| **Seek Center** | Gravitate toward the center of the dish |
| **Avoid Own Kind** | Territorial - stay away from same species |

Each behavior can be enabled/disabled and given a weight (higher = stronger influence).

### Reproduction
- **Energy Threshold** - Energy needed to reproduce
- **Reproduction Cost** - Energy spent when reproducing
- **Mutation Rate** - Chance of offspring being slightly different

## Challenges

Test your species design skills:

| Challenge | Goal |
|-----------|------|
| **Sandbox** | Free play - experiment freely |
| **Survival** | Keep organisms alive for 60 seconds |
| **Dominance** | Grow to 100 population |
| **Ecosystem** | Maintain 3+ species coexisting for 30 seconds |
| **Predator & Prey** | Create stable predator-prey cycle for 90 seconds |
| **Swarm Intelligence** | Get 50+ organisms moving as a cohesive swarm |
| **Controlled Extinction** | Engineer a collapse: predators kill all prey, then starve |

## Tips

1. **Balance is key** - Too much reproduction cost and they die out; too little and they overpopulate and starve
2. **Predators need prey** - If you make a pure predator, make sure there's something for it to eat
3. **Flock + Align = Boids** - Enable both for classic swarming behavior
4. **Watch the energy bars** - Green means ready to reproduce, red means starving
5. **Speed costs energy** - Faster organisms burn energy quicker
6. **Use obstacles** - Create interesting terrain that affects movement patterns
7. **Population graph tells stories** - Watch for boom-bust cycles, competition dynamics
8. **Territorial predators** - Use "Avoid Own Kind" to spread predators out and prevent overhunting

## What Emerges

With the right species designs, you might observe:
- Boom-bust population cycles
- Predator-prey oscillations (visible in the graph!)
- Swarm behavior and collective movement
- Competition driving species to different niches
- Unexpected survival strategies
- Organisms navigating around obstacles

## Technical Details

- Built with vanilla JavaScript ES6+
- HTML5 Canvas for rendering
- Spatial partitioning for efficient neighbor queries
- No external dependencies

### Architecture

```
js/
├── main.js         # Entry point, game loop
├── simulation.js   # Core physics, behaviors, spatial grid
├── species.js      # Species definitions and presets
├── renderer.js     # Canvas rendering
├── ui.js           # User interface
├── challenges.js   # Challenge goals and tracking
├── graph.js        # Population dynamics graph
└── effects.js      # Visual particle effects
```

---

*Part of the LanguageGames collection - games created by LLMs to express creativity through game development.*

*Created with Claude Code*

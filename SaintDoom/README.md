# SaintDoom: Unholy Retribution

A browser-based first-person shooter starring Saint Giovanni, resurrected by the Vatican to stop a demonic invasion. An ancient saint, a modern arsenal, and a descent through a fallen black site.

## Play

From the repository root:

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000/SaintDoom/** in a desktop browser with WebGL, a keyboard, and a mouse. Three.js is pinned to 0.128.0 and loaded from a CDN, so the game needs an internet connection. Use an HTTP server; ES modules do not run correctly from `file://`.

- **Begin crusade** deploys directly to the Desecrated Chapel.
- **Vatican prologue** starts the story and guided tutorial. Space skips the opening cinematic.
- **Chapters** lets you enter any of the 10 main chapters, two secret areas, or the prologue with its starting loadout.
- Once a chapter is ready, click **Return to the fight** to capture the mouse. Esc releases it and pauses the game.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move |
| Mouse | Look |
| Left mouse | Attack |
| Right mouse | Block with the sword |
| 1–4 | Switch available weapons |
| E | Interact / open doors |
| Either Shift | Sprint |
| R | Activate Holy Rage when ready |
| Tab | Toggle facility map |
| Esc | Pause / release mouse |
| F3 | Toggle developer diagnostics |

Settings are available from the title and pause menus. Mouse sensitivity, master volume, field of view, and the head bob / camera shake preference persist in this browser. Disabling motion effects does not disable looking or weapon animations. Reduced-motion system preferences also disable menu animations.

The HUD shows your objective, health and armor meters, available and selected weapons, ammunition, Holy Rage, score, kills, and active combo multiplier. Settings and controls remain keyboard accessible; the game itself requires mouse input.

## Combat and progression

The four core weapons are the blessed sword, blessed shotgun, holy water grenades, and crucifix launcher. Chain kills to build your score multiplier and rage. Repeated deaths unlock the existing martyrdom / divine wrath mechanic.

Chapter objectives are tracked during a run when returning to areas. **Begin crusade** starts fresh; **Restart chapter** resets the current chapter's objectives. There is no Continue button or full campaign resume in the current interface. Browser storage retains settings, not a resumable run.

## Development and checks

```bash
cd SaintDoom
npm ci
npm test
npm run typecheck
```

`npm test` runs Node regression tests for mouse input, focus loss, paused controls, settings storage, audio volume, frame-rate-independent movement, collision data / movement integration, scientist facing, pickup rewards / resource cleanup, rendering performance, and transition state after restarting or quitting. No browser or downloaded test framework is needed for these tests.

With Python Playwright and Chromium installed, these checks each start a temporary server and browser:

- `python3 tests/scientist_cache_browser.py` checks the actual chapel through an older cached release and an updated release.
- `python3 tests/armory_pickup_browser.py` collects all four armory racks, the central cache, and health / ammunition / armor drops in WebGL. It verifies progression and no shader recompilation on collection, and prints render timings.
- `python3 tests/chapter_audit_browser.py` captures all 13 chapters, checks exit cleanup, and probes lab pickups, repeated projectiles, scientist spawn/removal, archive draw calls, and lightning. It writes screenshots and metrics to `/tmp/saintdoom-chapter-audit` by default.

Changed startup, scientist, and pickup modules use versioned URLs in `index.html` so a normal reload cannot silently retain older code.

See [the performance and art audit](PERF_ART_AUDIT.md) for measured improvements, visual changes, and remaining priorities across the campaign.

The existing JavaScript type check still reports legacy errors in enemy classes and other game systems. It is not currently a clean project-wide gate.

## September 2026 refresh

- New cathedral title artwork, responsive chapter selection, keyboard-accessible menus, and a consistent HUD.
- Direct deployment to the first chapter, with the tutorial available separately.
- Procedural stone flooring, corridor ribs, lamps, and a processional runner in the opening chapel corridor.
- Connected sword-arm geometry and corrected blade tip / scale.
- Accumulated mouse motion, cleared held inputs on blur, repeat-safe weapon selection, and movement acceleration / head bob independent of frame rate.
- Working persistent settings and a shared master audio output, including mute.
- Collision bounds retained from every level creation return format. Player horizontal movement is resolved once, through collision checks, instead of being applied by physics first.
- Pause on focus loss, explicit mouse capture, reusable death controls, chapter-specific respawn positions, and cleanup of input/map listeners on returning to the title.
- Armory and supply pickups use glowing meshes instead of individual point lights, avoiding room-wide shader recompilation on collection. Collected pickups release their owned graphics resources.

## Files

- `index.html`, `styles/game.css`, `main.js`: menus and application startup.
- `modules/Game.js`: game loop, combat coordination, and chapter lifecycle.
- `modules/InputManager.js`, `Player.js`, `PhysicsManager.js`, `CollisionSystem.js`: input and movement.
- `modules/Settings.js`, `Chapters.js`: settings persistence and chapter metadata.
- `levels/`, `enemies/`, `weapons/`: the existing game content.
- `assets/sanctum.svg`, `utils/StoneTexture.js`: local title artwork and procedural material.

# LAST LIGHT

**Hold the room. Keep the light on.**

A single-player 3D first-person bunker defense game on Kepler-09. Fight through twelve assaults in a compact, fully enclosed reactor bunker. Weld damaged wall panels, reset jammed bulkheads by hand, and use two support sentries to cover your repairs. The separate outdoor Assault mode and Base Workshop let you lead a squad against fortified bases and share tower layouts.

## Play

On Windows, double-click **`Play Last Light.bat`**. Or run:

```bash
python run_game.py
```

On Linux / WSL / macOS:

```bash
python3 run_game.py
```

The launcher serves the built game at **http://127.0.0.1:5175** and opens your browser. Keep its terminal open while playing. It reuses an existing Last Light server; if another application is using the port, it chooses an available port and prints the URL. Running an existing production build requires only Python 3 and a browser; gameplay makes no external network requests.

If you have **`LastLight-Playable.zip`**, it contains a portable copy of the built game and launchers. Extract it before launching. Create or update the archive after a build with `python scripts/package_game.py` (use `python3` on Linux, WSL, or macOS). The archive and the `dist/` production build are generated locally and are not included in source checkouts.

If you clone the source files, the launcher builds the game on first run. That first build needs **Node.js 22.12+ or 24+** and an internet connection to install npm dependencies. You can also run the development server directly:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Use `python run_game.py --build` to rebuild the production version after source changes. The game needs a desktop mouse, keyboard, and a browser with WebGL 2. Chrome, Edge, and Firefox are suitable. Enable browser hardware acceleration. A **Low** graphics setting is available for slower machines.

## Assault a base

Choose **ASSAULT A BASE** from the main menu. Select one of three fortified layouts, or load a base code exported by another player. You deploy in first person with six armored squadmates: riflemen, a heavy gunner, and a combat medic. Automated defenses and enemy infantry protect the outpost.

Destroy the **North relay** and **South relay** to disable the reactor shield, then destroy the red reactor. Give your troops **Follow (1)**, **Advance (2)**, or **Hold (3)** orders. Aim at a target and press **F** to focus squad fire. Press **E** to spend 120 support on up to four reinforcements, with a 22-second cooldown and a maximum squad of ten. Destroyed enemies and defenses earn support.

Your armor has **75 regenerating shield points** and **100 health**. Hold **C** to crouch behind low concrete cover. The medic heals nearby squadmates; heavy gunners pierce armor. You have **three deployment lives**. If you have lives remaining after being downed, wait six seconds, then press **Tab** to redeploy. Tab also provides a tactical overview while your squad continues fighting; your operator is safe in that view.

Assaults use **AI defenders and AI squadmates**, including when attacking a friend's shared layout. They run locally; this version does not include simultaneous online multiplayer, matchmaking, or accounts. Leaving a raid ends that attempt. Raid retries restart the selected base, and raids do not overwrite defense campaign checkpoints.

## Base workshop and sharing

Choose **BASE WORKSHOP** to design a stronghold with **4,800 alloy** and 18 tower platforms. Each tower can be upgraded twice, from MK I to MK III. The reactor, shield relays, and infantry garrison are fixed; your layout controls tower placement and upgrades. Workshop salvage returns the full tower investment so you can redesign freely.

Use **EXPORT BASE CODE**, enter a base name, then **UPDATE & COPY BASE CODE**. Share the resulting `LLB1.…` code yourself. Another player can choose **ASSAULT A BASE → RAID A FRIEND'S BASE CODE**, paste it, and deploy against that layout. No server or account is required. Use **TEST YOUR BASE** or Enter in the workshop to lead a raid against your own design.

The workshop saves separately in this browser. Keep an exported code as a portable copy. Codes are checked for supported platforms, tower types, and upgrade levels, as well as duplicate placements and compliance with the alloy budget.

## Defend the bunker

Choose **DEFEND THE BUNKER**. You begin in first person in the control area of an interior measuring **36 × 28 meters**, with a reactor room, west intake, east coolant room, workshop, and a connecting service loop. There are two bulkheads and two repairable wall panels between the approaches and the reactor. Fixed room walls block movement and shots; the open service passages let you circle behind either entry room.

**First operation:** explore before pressing Enter. Follow the orange markings toward the workshop and patch its damaged wall. Inspect the control boxes beside the bulkheads. The two sentry mounts are inside the reactor room. Start with 180 scrap; two basic sentries cost 140, leaving enough to patch the workshop panel.

- **Twelve authored assaults** introduce rushers at wall seams, ranged gunners, heavy breachers, split fronts, and finally all four approaches. Enemies attack closed barriers, move through broken ones, and damage the reactor once inside. They can engage you in the rooms and navigate back around partitions after a chase.
- **Weld damaged panels and doors:** look at a nearby control or panel and hold **E**. Welding restores 38 integrity per second and costs 0.12 scrap per point of integrity. Your weapon lowers while you work. Groups and heavy breachers can overwhelm continuous welding.
- **Reset a jammed bulkhead:** when destroyed, a door jams open. Clear the doorway and hold **E** at either control box for two uninterrupted seconds. This costs 20 scrap and restores a closed door with 90 integrity. Continue welding to reach its 180 maximum. **F** opens or seals a functioning door; an occupied opening cannot be sealed.
- **Rebuild a breached wall panel:** clear the opening and hold **E** for 2.4 seconds. This costs 25 scrap and restores 75 integrity; welding can raise it to 150. Rebuilding physically blocks the route again. Walking away or releasing E interrupts a reset or rebuild.
- **Two support sentries:** hold **E** at a mount to build for 70 scrap, then upgrade once for 60. They require a clear line of fire. They are supporting weapons; an unattended turret defense cannot complete the campaign.
- **First-person weapons:** pulse rifle, shotgun, aligned sights, reload animations, headshots, crouching, sprinting, jumping, and grenades that bounce off walls. Ammunition reserves are unlimited; magazines still need reloading. Grenades recharge in 12 seconds.
- **Recovery and economy:** earn scrap from kills and 55 scrap between assaults. Health regenerates after five seconds without damage and is fully restored when you enter preparation. You have three deployment lives; a downing costs 60 reactor integrity. If you have lives remaining and the reactor survives, you return to Control after four seconds. The reactor begins with 500 integrity. Reactor and bunker damage persist between assaults.
- **Live floor plan:** hold position and press **Tab** to inspect rooms, boundaries, sentries, and hostiles. Combat continues and your operator remains vulnerable. Building, repairs, and door controls require physical access in first person.
- **Preparation checkpoints:** defenses, barrier damage, door states, scrap, reactor integrity, remaining lives, difficulty, and statistics save automatically during preparation and immediately before an assault. **Retry Assault** restores that checkpoint. Leaving during combat also resumes from preparation. Bunker saves are separate from workshop layouts and older outdoor defense saves.

Preparation has no time limit. Press **Enter** when ready. **Escape** pauses the action; the pause menu includes settings, the field manual, retry, and return to menu. The same local URL and browser must be used to resume a checkpoint. The graphics, volume, music, sensitivity, and camera-shake preferences apply in the bunker. Choose difficulty from the main menu settings before starting a new operation.

## Bunker controls

| Action | Control |
|---|---|
| Move / sprint | **W A S D / Shift** |
| Aim / fire | Mouse / left mouse button |
| Aim down sights | Hold right mouse button |
| Repair barriers / build or upgrade sentries | Look at nearby equipment and **hold E** |
| Open / seal a functioning door | Look at its control and press **F** |
| Rifle / shotgun | **Q** |
| Reload | **R** |
| Grenade | **G** |
| Jump / crouch | **Space / hold C** |
| Live floor plan / return to first person | **Tab** |
| Begin next assault | **Enter** |
| Pause / release mouse | **Escape** |
| Field manual | **H** |

In the outdoor workshop, use **1–4** to select a tower type, click a numbered platform to build or select a tower, press **U** to upgrade, and press **X** to salvage. Pan with **WASD**, zoom with the wheel, and orbit by right-dragging. **Tab** switches between command and first-person views. Assault controls are described above and in the assault field manual.

## Development and verification

```bash
npm test                  # Bunker maintenance, navigation, campaigns, raids, base codes
npm run test:browser       # Bunker Chromium tests and screenshots
npm run test:raid-browser  # Assault / workshop Chromium tests and screenshots
npm run test:sights        # Sight alignment, visibility, aiming, and actual hits
npm run test:breaches      # Outdoor assault/workshop gate regression fixtures
npm run build              # Production output in dist/
```

The bunker browser suite starts its own development server on port 5178; the assault suite uses port 5179, the sight suite uses port 5180, and the breach suite uses port 5181. Install Chromium with `npx playwright install chromium` if needed, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium executable. Tests use software rendering for portability and write screenshots into `artifacts/`. `?test=1` exposes controlled fixtures only on the Vite development server; these mutation hooks are removed from production builds. `window.lastLight.getState()` provides a read-only diagnostic snapshot.

The bunker simulation tests cover barriers blocking movement and fire, local repair costs, interrupted work, occupied doors, jam resets, wall reconstruction, sentry limits, navigation around interior partitions, saves, deaths, and campaign outcomes. A moving operator benchmark uses real magazines, reloads, headshot damage, earned scrap, and preparation repairs to check campaign completion; an unattended sentry benchmark must lose. These are deterministic balance checks, not a substitute for human playtesting.

The bunker browser suite exercises the public launch/continue menus, pointer lock, movement, jumping, the floor plan, welding, resetting and operating doors, building sentries, checkpoint persistence, weapon reloads, actual weapon raycasts against closed and open doors, sights, grenades, pause, settings, victory, defeat, retry, and transitions back to outdoor assault/workshop. Screenshots are saved as `artifacts/bunker-*.png`.

| File | Purpose |
|---|---|
| `src/bunker-data.js` | Interior layout, barriers, sentries, enemies, and twelve assault rosters |
| `src/bunker-simulation.js` | Bunker combat, maintenance, navigation, economy, checkpoints |
| `src/bunker-world.js` | Interior geometry, lighting, doors, damage visuals, and models |
| `src/bunker-game.js`, `src/bunker-ui.js`, `src/bunker.css` | First-person controls, weapons, repair tool, HUD, floor plan, menus |
| `src/data.js` | Outdoor map, workshop defenses, shared weapons, and legacy defense fixtures |
| `src/simulation.js` | Rendering-independent combat and checkpoint model |
| `src/raid.js`, `src/navigation.js` | Squad combat, raids, objectives, and infantry navigation |
| `src/blueprints.js` | Preset layouts, shared base codes, and validation |
| `src/world.js`, `src/fortifications.js` | Environment, cover, lighting, static geometry merging |
| `src/models.js`, `src/infantry.js` | Towers, heavy infantry, enemies, and first-person weapons |
| `src/main.js` | Controls, cameras, collision, raycasts, rendering, and orchestration |
| `src/ui.js`, `src/raid-ui.js`, `src/military.css` | Menus, defense/assault HUD, workshop, settings, and manual |
| `src/audio.js`, `src/effects.js` | Audio synthesis and visual effects |

Built with Three.js and Vite. Game models, scenery, interface art, and sound are built in the project. Two AI-generated material textures are bundled in `public/textures/`; their final prompts and provenance are documented in [ART_NOTES.md](ART_NOTES.md). The sci-fi visual direction uses original project assets. Barlow and Barlow Condensed fonts are bundled under the SIL Open Font License; the license texts are in `public/fonts/`. See `THIRD_PARTY.md` for dependency notices.

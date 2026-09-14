# Performance and art audit — September 7, 2026

Inspected all 13 chapter entries in Chromium/WebGL at 960×640, including the secret areas and prologue. Captured fixed-camera views, counted lights and draw calls, and exercised selected pickup, combat, lightning, and exit paths. This is an entry/renderer audit, not a complete campaign playthrough or a hardware FPS guarantee. Random scenery and live effects make some draw counts vary between runs.

## Changes made

| Area | Finding | Change and evidence |
| --- | --- | --- |
| Forbidden Archive | 2,160 shelf books each allocated a mesh, geometry, and material. The initial hall view submitted 1,058 draws. | Each shelf now takes four draws including its frame, books, and gold spine bands, instead of 136. Subsequent hall samples used 158–179 total draws. Collectible and floating tomes remain independent. |
| Laboratory | 44 point lights, including 22 scientist eye lights and three keycard lights. Removing items/enemies changed shader variants. | 20 point lights, including a reserved exit light. All three keycards and portal activation preserve the light count and compile no additional shaders in the browser check. |
| Combat | Scientist eyes, golem cores, imp fireballs, and crucifix projectiles carried transient lights. | Self-lit geometry retains the visual cues. Repeated crucifix/imp projectiles and scientist spawn/removal keep shader counts stable after material warmup. Expired crucifix meshes now release their geometry and materials. |
| Communications | Three independently scheduled lightning chains repeatedly allocated lights/geometry and outlived the level. | Three reusable bolt buffers and flash lights; intensity changes instead of light insertion/removal. Storm timing uses the game update loop. Six repeated sets of flashes produced no shader recompilation. |
| Chapter lifecycle | Game/ZoneManager called `clearLevel()`, while several chapters only implemented `cleanup()`. | BaseLevel now dispatches `clearLevel()` to the chapter's cleanup. The browser check exercises exit to title for every chapter. |
| Archive ambience | Floating books, dust, candle flicker, and crystal mist ran independent permanent animation callbacks. | These effects use the chapter update and stop advancing while the game is paused. Their callbacks are released on exit. |
| Laboratory art | One blank material covered the floor, walls, and ceiling. Room indicators sat above the ceiling and displayed colored rectangles. | Local tile/panel textures, contrasting service panels and ceiling, plus readable color-coded room/clearance signs below the ceiling. No new scene lights. |
| Archive art | Oversized, overlapping books in saturated colors read as blocks. | Spaced bindings in muted colors, gold spine bands, wooden shelf rails, and consistent row clearance. |
| Observatory art | Structural walls and platforms were transparent, adding sorting work and showing geometry through solid surfaces. | Solid structure is opaque; windows and effects retain transparency. |

The armory benefits from the scientist change too: its point-light count fell from 18 to 10, in addition to the preceding pickup fix.

## Remaining priorities

| Priority | Area | Evidence and next improvement |
| --- | --- | --- |
| High | Tunnel Network | 54 point lights and roughly 340 visible draws remain. Most lights belong to fixtures rather than combat. Introduce a stable local-light budget or baked fixture illumination, then batch repeated supports, pipes, and grilles by region. Preserve visibility down adjoining passages when testing selection. |
| High | Final Arena | 47 point lights, 96 transparent meshes in the initial scene, and roughly 200 visible draws. Consolidate decorative lava/flame lights; reserve dynamic lights for important actions. Large flat red surfaces and competing transparent effects obscure the arena's landmarks. |
| High | Remaining environmental animation | Containment and tunnels still contain direct recurring animation callbacks. Convert persistent effects to chapter updates, then test repeated transitions and pause/resume over longer sessions. The cleanup bridge does not automatically cancel arbitrary callbacks. |
| Medium | Geometry batching correctness | `GeometryBatcher.getMaterialKey()` groups by type, color, and transparency only, omitting maps, emissive state, and other material properties. `batchWalls()` handles wall records with `.mesh`, while some chapters return meshes directly. Fix these contracts and preserve moving doors before expanding batching across scenery. |
| Medium | Enemy update ownership | `Game.updateEnemies()` and `BaseLevel.update()` both contain enemy update loops. Audit which chapters share enemy objects between these owners before changing update frequency; this affects combat behavior as well as CPU cost. |
| Medium | Reactor / containment / observatory | Large plain cylinders, shields, and blank wall faces dominate several sampled views. Add structural seams, legible controls, and landmark contrast, with particular attention to the player's approach and sight lines. Avoid adding many small meshes or lights for detail. |
| Medium | Communications geometry | The initial scene contains 688 meshes, mostly tower structure and equipment. Batch repeated railings and supports by floor, retaining platform/elevator movement and local culling. |
| Medium | Black Site Omega | The sampled entry has little local illumination and broad untextured surfaces. Establish distinct equipment silhouettes, emissive display graphics, and restrained color-coded navigation. |

Spawning Grounds also needs more variation in its floor, altar, and pool surfaces; its entry sample is relatively inexpensive (nine point lights, around 65 draws), so prioritize visual readability over additional effects. The opening chapel and armory already received the earlier visual/pickup work. Their entry checks still pass.

## Repeat the checks

From `SaintDoom/`, after `npm ci`:

```bash
npm test
python3 tests/chapter_audit_browser.py --output /tmp/saintdoom-chapter-audit
python3 tests/armory_pickup_browser.py
python3 tests/scientist_cache_browser.py
```

Browser checks require Python Playwright and Chromium. Each creates its own temporary server/browser and uses local Three.js. The chapter audit writes a screenshot per chapter and `metrics.json`; `--chapters laboratory archive communications` selects a smaller set. Render timings are diagnostic; assertions use draw budgets, stable shader/light counts, progression, and errors rather than machine-specific timing thresholds.

The September 14 commit review corrected transition-flag cleanup during restart and quit, with regression coverage for both paths. The project-wide type check now has 64 diagnostics, down from 80 in the previously committed version; it is still not a clean gate. Modified runtime modules have versioned import-map entries, including lazily loaded chapter modules. Build `20260914-refresh1` updates the Game module URL for the transition fix.

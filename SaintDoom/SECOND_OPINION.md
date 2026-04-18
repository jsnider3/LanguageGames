# Second-opinion request: SaintDoom zone-transition bug

You're a senior game-engine / web-games engineer being asked for a second opinion. Another assistant (me, Claude) has been chasing a stubborn bug and three fixes haven't resolved it. I want you to audit my reasoning, find what I've missed, and call out anything else that's structurally wrong.

## Project snapshot

**SaintDoom** is a browser-based FPS built on Three.js + vanilla ES modules. Holy vs. demonic theme. Interconnected "zones" (levels) with a corridor-transition system between them. No framework, no bundler, served directly by `python -m http.server`.

Relevant architecture:
- `modules/Game.js` (~2450 lines) — main game loop, level loading, save/restore, input glue. Oversized.
- `modules/ZoneManager.js` (~2200 lines) — loads/unloads zones, manages transitions (corridor, elevator, vent). Also oversized and full of ad-hoc state.
- `levels/baseLevel.js` — base class, provides `update(deltaTime, input, player)`.
- `levels/chapelLevel.js` — first real level, owns chapel state (`chapelReached`, `chapelCleansed`, altar interaction, exit-door interaction).
- `levels/armoryLevel.js` — second level, reached from chapel via a corridor.
- `modules/InputManager.js` — raw `keys[]` map, `getInput()` snapshot.
- `core/BaseEnemy.js` — provides `_trackTimeout` / `_trackInterval` for automatic cleanup on death.

Context on recent work (successfully completed, not the bug):
1. Audited every raw `setTimeout`/`setInterval` in `enemies/*.js` — routed through `_trackTimeout`/`_trackInterval` so timers don't leak after enemy destruction.
2. Moved chapel's per-frame logic (altar cleansing, exit-door interaction) out of duplicated blocks in `Game.js` into `ChapelLevel.update(dt, input, player)`. Moved `cleanseAltar()` to `ChapelLevel` too.
3. Added explicit floor registration (`userData.isFloor = true` and `PhysicsManager.registerFloor(mesh)`) with name-based fallback for unmigrated levels.

## The active bug

**Reproduction:** Start in chapel. Kill the possessed scientists (there are ~7 of them). Walk to the altar at `(0, 0, -48)`, press E to cleanse it (`ChapelLevel.cleanseAltar()` sets `chapelCleansed = true`, unlocks the exit door at `(5, 1.5, -20)`). Walk to the unlocked exit door, press E. A corridor transition starts. While in the corridor, walk back toward the chapel end (player x decreases from 10 toward 5.5, nearEntranceDoor triggers at `playerX < 7.5`) and press E to return.

**Expected:** You land back inside the chapel, with cleansed state preserved: altar purified, no enemies, door unlocked.

**Status after iterations:**
- The "combo-level" rendering symptom (geometry mixing) is **fixed** by the cancel-path rework below.
- What **remains broken**: when the player completes the chapel (cleanses altar) and then returns via corridor, the returned chapel shows as uncleansed — enemies respawned, altar desecrated, door locked. The `chapelCleansed` flag is lost across the round trip.

This remaining symptom reproduces in BOTH:
- (A) **Cancel path**: chapel → enter corridor → turn around → press E at corridor entrance → back to chapel.
- (B) **Normal round-trip**: chapel → corridor → armory → corridor → chapel.

(User confirmed at least the "returns to unbeaten chapel" symptom. Unclear if both paths are broken — user has observed (A) explicitly; (B) hasn't been directly tested but the save/restore mechanism is shared.)

## The transition flow

Normal chapel→armory path:
1. Player in chapel, presses E at exit door.
2. `ChapelLevel.update` detects interact, calls `game.zoneManager.triggerTransition('chapel', 'armory', player)` and sets `game.isTransitioning = true`.
3. `ZoneManager.triggerTransition` → `startTransition('chapel', 'armory', transitionId)`.
4. `startTransition`:
   - Sets `this.activeTransition = { from: 'chapel', to: 'armory', ... }`.
   - Calls `this.saveZoneState('chapel')` (ZoneManager's own enemy/item/door snapshot — separate from `Game.saveLevelState`).
   - Positions player at `(10, 1.7, -20)` facing +X (toward armory end of corridor).
   - For corridor transitions: creates a deferred `loadPromise` whose `_deferredLoadResolve` is NOT called until the player walks to the other end and presses E. Armory is NOT loaded yet.
   - `await this.transitionCorridor(transition, loadPromise)`.
5. `transitionCorridor`:
   - Creates corridor geometry, rotates it, positions at `(5.5, 0, -20)`, marks children `userData.isTransitionCorridor = true`.
   - Calls `this.clearCurrentLevel()` (ZoneManager's version, which only walks the scene and removes non-corridor children — doesn't touch `game.chapelLevel` or `game.currentLevelInstance` references).
   - Adds ambient light, stores on `this._transitionAmbientLight`.
   - Enters an async `checkProgress` loop that runs each frame via `await new Promise(r => requestAnimationFrame(r))`.
   - When player is near exit door and presses E: sets `doorOpened = true`, calls `this._deferredLoadResolve()` (triggers `prepareTargetZone('armory')`), awaits `loadPromise`.
   - `completeTransition('armory')` is then called by `startTransition`.

During corridor, `Game.update` checks `if (this.zoneManager && this.zoneManager.activeTransition)` and early-returns after running only player/physics/weapon — skips `currentLevelInstance.update`. This is the "transition-safe" mode.

Game state save/restore:
- `Game.saveLevelState()` reads `game.chapelLevel.chapelReached`/`chapelCleansed` and stores in `game.levelStates` Map + localStorage.
- `Game.restoreLevelState(levelName)` reads from Map, schedules a `setTimeout(() => {...}, 100)` that sets `chapelReached`/`chapelCleansed` and unlocks the door.
- `Game.loadLevelActual(levelName)` calls `saveLevelState()` at the top — **but only if `currentLevel !== levelName`**. This guard is critical to the bug.

## My cancel-path fix (current state)

The user's cancel case: player presses E near corridor entrance (chapel end). My latest `ZoneManager.cancelTransition(returnToZone)` now does:

1. **Snapshot** `chapelLevel.chapelReached` and `chapelLevel.chapelCleansed` directly from the live instance (bypassing `saveLevelState`'s same-level skip guard).
2. Drop `_deferredLoadResolve` so the deferred armory load never fires.
3. Dispose corridor geometry and transition lights.
4. Clear held `KeyE` in InputManager.
5. **Leave `activeTransition` SET** (and `isTransitioning = true`) so the main game loop stays in transition-safe mode during the reload — prevents the OLD chapel instance's `update()` from running against stale scene refs.
6. `await this.game.loadLevelActual(returnToZone)`. Source level gets destroyed + recreated.
7. Apply the snapshot directly to the NEW `game.chapelLevel` instance: set flags, unlock exit door, traverse scene to purify altar materials (via `userData.isAltar === true`).
8. Reposition player at `(0, 1.7, -22)` facing -Z (into chapel), clear velocity.
9. Clear `activeTransition = null`, `isTransitioning = false`.
10. Clear `KeyE` again defensively.

In `ZoneManager.transitionCorridor` the cancel path sets a local `transitionCancelled = true`, returns `{ cancelled: true }`, and `startTransition` checks this and skips `completeTransition(toZone)` to prevent the concurrent armory load.

## What I believe should happen — and what I'm unsure about

- The new chapel is created fresh via `levelFactory.createLevel('chapel')` inside `loadLevelActual`. This runs `ChapelLevel.create()` which builds geometry and creates the altar as desecrated with `userData.isAltar = true`.
- My snapshot-apply step should immediately set `chapelCleansed = true` and traverse-purify the altar materials.
- Exit door is created locked; `unlockExitDoor()` flips `userData.locked = false` and changes emissive.
- Player at (0, 1.7, -22) is NOT within 3 units of the exit door at (5, 1.5, -20) — distance ≈ 5.39 — so my `ChapelLevel.update` exit-door interaction shouldn't fire on load.
- Player z = -22 > -25, so `checkChapelTrigger` (which spawns enemies the first time `playerPosition.z < -25`) doesn't fire — and since my snapshot sets `chapelReached = true` synchronously, it won't fire later either.

## Leading hypotheses I haven't yet confirmed

1. **`saveLevelState` not actually running for chapel.** In the chapel→armory transition, `game.loadLevelActual('armory')` should call `saveLevelState()` at the top (since `currentLevel='chapel'` and `levelName='armory'`). If anything clears `this.currentLevel` or `this.chapelLevel` before this point, the save silently skips (`if (!this.currentLevel || !this.currentLevelInstance) return;`). Worth instrumenting.

2. **`restoreLevelState` setTimeout race.** The 100ms timer in `Game.restoreLevelState` runs AFTER `loadLevelActual` returns. In that 100ms window, the freshly-created chapel has `chapelReached=false`, `chapelCleansed=false`. If the player moves past `z = -25` in this window (unlikely at player speed from a spawn at `z=-22`, but possible), `ChapelLevel.update → checkChapelTrigger` spawns enemies. More plausibly: something else reads/mutates chapelLevel state during this window.

3. **Zone state stuck at FULL preventing reload.** `ZoneManager.zones.get('chapel').state` is set to `FULL` after the first `loadZone('chapel', FULL)`. Initial chapel load uses `Game.loadLevel` which does NOT go through `ZoneManager.loadZone` — so state may actually start as `UNLOADED` until the first corridor transition. But on the return path (armory → chapel), if chapel state was somehow set to FULL earlier, `loadZone` early-returns without reloading (line 242: `if (zone.state === targetState) return zone;`) and `completeTransition` sees `alreadyLoaded=true` and skips `loadLevelActual` entirely (line 1912+). Result: stale `zones.get('chapel').levelInstance` is reused, fresh chapel never created, save/restore never runs for this trip.

4. **`levelStates` localStorage persistence interference.** On page load, `loadLevelStates()` reads from localStorage. If the browser has cached an older chapel state (e.g., from a previous session where the chapel was never beaten), that stale state might be overriding fresh in-memory saves somehow.

5. **`this.chapelLevel` is stale-but-not-null at snapshot time.** In my cancel path, I snapshot `this.game.chapelLevel.chapelCleansed`. If ZoneManager.clearCurrentLevel or something else put `this.chapelLevel` into some half-destroyed state but it still reads `chapelCleansed=true`, the snapshot is fine. But if the cleanseAltar state didn't actually persist (e.g., chapelLevel got replaced before cleansing), snapshot would read false.

## Questions for you

**Primary: what am I missing about why the state isn't preserved, or what else is actually broken?**

Specific things to verify / investigate:
1. In my `cancelTransition`, I keep `activeTransition` set during `await loadLevelActual`. Does `loadLevelActual` internally depend on `activeTransition` being false? Could holding it true cause `loadLevelActual` to behave differently (e.g., skipping scene setup steps)?
2. `ZoneManager.saveZoneState('chapel')` was already called at the start of `startTransition` — does it capture state in a way that could cause `prepareTargetZone` or zone-state machinery to resurrect stale geometry when the NEW chapel loads? Note `this.zones.get('chapel').state` and `this.zoneStates.get('chapel')` are separate ZoneManager structures from `Game.levelStates`.
3. Does `loadLevelActual` actually finish synchronously-enough? It schedules a 1000ms `setTimeout` to hide the loading screen (line ~2008) but returns before that. Could anything async race with my snapshot-apply?
4. I'm NOT calling `ZoneManager.restoreZoneState('chapel')` anywhere in the cancel path — the zone-state snapshot taken at `startTransition` just sits there. Could its stale enemy list get applied later and re-spawn the dead scientists?
5. Is there a flow where `completeTransition` could still run despite my `result.cancelled` early return in `startTransition`?
6. The corridor entrance-door detection uses `playerX < 7.5`. When the player spawns in the corridor at `x=10` facing +X, how exactly do they reach x<7.5? By backing up (S key)? Turning around? Could there be an edge case where the cancel fires from the wrong end?
7. Is there a race where the old chapel's exit-door interaction in `ChapelLevel.update` (which would call `triggerTransition` again) can fire between `activeTransition = null` and new chapel being assigned to `game.chapelLevel`?

**Secondary: architectural concerns.**

- `ZoneManager.js` is 2200 lines and juggles 3 overlapping state systems (`zones` Map, `zoneStates` Map, `activeTransition`, the game's `levelStates`, the game's `currentLevelInstance`). Is there a cleaner architecture you'd recommend? Do you see latent bugs?
- `Game.js` is 2450 lines and mixes loop / level loading / combat / save-game / input glue. Worth splitting?
- The whole corridor transition flow relies on async-await with `requestAnimationFrame`-based frame waits — error-prone. Better pattern?
- `InputManager` tracks keys with `keys[e.code]` and `getInput()` reads level-triggered (held) state. "Edge-triggered" (just-pressed) is done ad-hoc by nulling keys after read. Is this safe? Better model?
- Level-specific state saving is hardcoded per-level in `Game.saveLevelState` / `Game.restoreLevelState` with `if (levelName === 'chapel') { ... }` branches. I moved chapel's per-frame logic INTO `ChapelLevel` — should per-level save/restore also live on the level class?

**Tertiary: anything else you spot that looks wrong or smells bad.** The repo has a `REPEATED_BUGS.md` with the author's own list of chronic issues: transitions, clipping, sword/arm visibility, level-bounds placement, unclear objectives, performance. If you see root causes for any of those while looking around, flag them.

## How to consume this

The full repo is at `LanguageGames/SaintDoom/`. Key files in order of relevance:
1. `modules/ZoneManager.js` — specifically `startTransition` (~line 647), `transitionCorridor` (~777), `cancelTransition` (~1764), `completeTransition` (~1847).
2. `modules/Game.js` — `update()` (~442), `loadLevelActual()` (~1868), `saveLevelState()` (~2112), `restoreLevelState()` (~2164).
3. `levels/chapelLevel.js` — `update()` (~327), `cleanseAltar()` (~411), `checkChapelTrigger()` (~296).
4. `levels/baseLevel.js` — base `update()` signature.
5. `modules/InputManager.js` — `getInput()`.

Please provide:
- A concrete hypothesis for the root cause of the still-present bug.
- Line-level recommendations for fixing it.
- Any other high-priority issues you spot.
- Keep your response focused — code over prose, and cite file:line for every claim.

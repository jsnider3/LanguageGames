# Cinder Route (Prototype)

This directory now contains a playable browser prototype for the game concept in
`GAME_IDEA.md`.

## Run it

Open `index.html` in your browser. No build step is required.

## Controls

- `WASD` or arrow keys: move the skiff.
- On touch devices: use on-screen directional controls.
- Mouse: choose answers for dispatch cards.
- `R`: restart the run.
- `Signal Lantern` fragment unlocks one per-run reroll on dispatch cards.

## Scope of the prototype

- 11 x 9 district grid
- Relay beacon objective with win/fail run flow
- Hazard drift meter and run score tracking
- End-of-run debrief overlay with score breakdown, drift safety, and unlocks this run
- Deck diagnostics in HUD and post-run debrief now include per-rule deck card counts
- End-of-run debrief now includes a concise outcome “flavor” line based on route performance
- Debrief now highlights personal-best progress for score, distance, and heat
- Dispatch cards from five grammar-rule families backed by finite, per-run deck draws
- Persistent run bests, scores, run count, and fragment unlocks via `localStorage`

## Progression

- Reach shard thresholds to unlock fragments:
  - Steady Rudder (5 shards): reduce district drift pressure by 1.
  - Signal Lantern (11 shards): get one extra shard on correct cards, plus hint text.
  - Silent Wake (16 shards): reduce failed-card drift penalty by 2.

## Behavior details

- Relay beacons are procedurally placed each run.
- The beacon tile is also a dispatch card; solving it completes the run.
- Failed beacon cards stay unsolved so you can re-enter and retry.
- Score uses distance, solved dispatches, shards, and remaining drift safety.
- Dispatch runs from a run-local deck; tiles draw from pre-shuffled pools.
- HUD includes a compass readout showing beacon bearing and distance so location is always visible.

## Notes

- The map and UI are intentionally minimal to keep iteration fast.
- The current build is all vanilla HTML/CSS/JS.

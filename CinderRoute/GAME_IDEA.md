# Game Idea: **Cinder Route**

## 1) High-Level Concept

A **procedural narrative action roguelike** where the player pilots a courier skiff through a sentient volcanic city called **Ashline**. The city is split into districts connected by unstable tram lines. Each district is governed by a corrupted language rule (anagram, rhyme, suffix, contradiction, translation, or formal logic). To keep the power grid alive and prevent eruption, you must solve language-driven logistics puzzles while fending off environmental hazards.

Think **mini roguelike + word-puzzle + narrative choices**.

## 2) Core Loop

1. Start a run with one skiff, one fuel cell, and one mission route.
2. Enter a generated district and negotiate terrain hazards in real time.
3. Every stop reveals a **dispatch card** (riddle/puzzle) that must be solved to unlock roads, unlock cargo, or calm district sirens.
4. Earn heat (currency), heat-shards (upgrade components), and route intel (map knowledge).
5. Survive long enough to reach the next relay beacon before grid instability reaches 100%.
6. Optional hard mode: choose whether to stabilize districts permanently or keep rushing for score.

Failure is fast and visible (district collapses, grid failures), so players build mastery over puzzle and risk over many short runs.

## 3) Distinctive Mechanics

### A. Dispatch Card System (Puzzle Core)
Each card has constraints tied to the current district grammar:

- **Rhyme Gate**: reorder a set of lines to satisfy rhyme/meaning constraints.
- **Logic Lock**: choose the next route by selecting statements that stay logically consistent under constraints.
- **Entropy Filter**: remove forbidden letters/sounds to expose safe pathways.
- **Borrowed Tongue**: convert one district’s dialect words to standard language to repair an NPC communication line.

Cards scale from 1 action to 4 actions as deck depth increases.

### B. Route Economy
- You gain **Momentum** for moving quickly through districts.
- Taking detours gives rewards but increases **Ash Drift** (hazard meter).
- If Ash Drift spikes, hazards move faster and dispatch time windows shorten.

### C. Risky Progression
- Every run unlocks a *Route Fragment* that can be invested between runs.
- Fragments permanently modify deck behavior (e.g., “one logic card gives a free reroll, but noise increases by 1”).
- Permanent upgrades are intentionally tradeoffs, encouraging rerouting and replay.

## 4) Player Systems

- **Skiff Abilities**
  - Dash: bypass one hazard tile.
  - Anchor: hold position and reduce drift for 1 turn.
  - Recall: replay one old district encounter once per run.
- **Gear Slots**
  - Vent Filter (reduces hazard speed)
  - Translator Ring (gives hints on puzzle cards)
  - Pressure Valve (expands route choices)
- **Crew Morale Meter**
  - Affects puzzle tolerance and random event quality.
  - Low morale creates ambiguous clues; high morale grants 1 free hint per shift.

## 5) Narrative Hooks

You are the youngest routekeeper after a system breach. The city’s districts are fragmenting into language zones—each zone can only be traversed if you speak its rules. Story evolves through optional “letters” picked up as relics:
- discover why the AI translator failed,
- rebuild the forgotten emergency protocol,
- choose between evacuation-first vs grid-first outcomes.

Multiple endings based on whether players prioritize speed, stability, or people.

## 6) Visual/Audio Direction

- Isometric city map with hand-animated tile transitions.
- Heatmap-like district glow indicating danger/entropy.
- Sound motifs keyed to district rule type: percussive for rhythm/rhyme zones, sharp digital for logic zones, wind-like drones for drift zones.

## 7) Implementation Notes (Prototype)

- **MVP platform**: Web (HTML5 + JS/Canvas).
- **Minimum viable loop**:
  1) map generation (graph of 8–12 districts),
  2) dispatch cards with 3 rule types,
  3) hazard meter + skiff movement,
  4) run end + upgrade screen.
- Persist best score and unlocked route fragments via localStorage.

## 8) Why this fits LanguageGames

- Strong language-centered mechanic that stays fun and mechanical.
- Replayability through procedural districts and meta upgrades.
- Natural fit for both terminal-only and browser adaptation if you want a lighter variant later.

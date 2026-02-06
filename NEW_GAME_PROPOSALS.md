# New Game Proposals

Here are three distinct game concepts proposed for the LanguageGames repository. Each emphasizes a different programming strength and aesthetic.

## Concept 1: "Neon Logic"
**Genre:** Puzzle / Automation  
**Platform:** Web (HTML5/Canvas)  
**Tone:** Cyberpunk, High-Tech, Dark Mode

### Core Concept
A visual logic-puzzle game where players repair corrupted data nodes in a futuristic city. Players drag and drop logic gates (AND, OR, NOT, XOR) and signal splitters to route data packets from sources to destinations, matching required frequencies and colors.

### Key Features
*   **Visual Programming:** Intuitive drag-and-drop interface.
*   **Aesthetics:** Glowing neon lines, CRT scanline effects, dark background, "glitch" animations when failing.
*   **Progression:** Levels introduce new components (delay lines, memory latches).
*   **Leaderboard:** Ranking based on "cycles" (speed) and "silicon" (cost/number of gates).

### Technical Focus
*   Object-oriented JS for component logic.
*   Canvas API for performant rendering of moving data pulses.
*   State management for level editing/saving.

---

## Concept 2: "Chronos Protocol"
**Genre:** Time-Loop Mystery  
**Platform:** Python (Terminal)  
**Tone:** Noir, Sci-Fi, Tense

### Core Concept
You are a detective trapped in a 10-minute time loop on a space station just before it explodes. You must navigate the station, talk to crew members, and gather passcodes/info. Each loop resets the world, but *you* retain the information (passcodes, clues) to unlock new areas in the next loop.

### Key Features
*   **Loop Mechanic:** A strict turn counter/timer. When it hits zero, the game calls a `reset()` method but preserves a `KnowledgeBase` object.
*   **Knowledge System:** Unlocking a keyword in Loop 3 allows you to use it in dialogue during Loop 4.
*   **Dynamic Events:** Crew members move according to a schedule. You have to be in the right place at the right time.

### Technical Focus
*   Complex state management (World State vs. Player Knowledge State).
*   Event scheduling system.
*   Natural Language Processing (simple keyword matching) for interrogation.

---

## Concept 3: "Aether Alchemy"
**Genre:** Crafting / Simulation  
**Platform:** Web (HTML/CSS/JS)  
**Tone:** Fantasy, Whimsical, Premium UI

### Core Concept
A relaxing potion-brewing simulator. Players receive requests from villagers (e.g., "I need a love potion" or "Cure my headache") and must mix ingredients in a cauldron. Ingredients have properties (Heat, Viscosity, Color) that interact physically.

### Key Features
*   **Fluid Visuals:** Simulating liquid mixing and color blending (using HSL math).
*   **Discovery:** No recipes provided; players must experiment and record their own "Recipe Book".
*   **Premium UI:** Glassmorphism panels, floating tooltips, satisfying interactions (drag to stir).

### Technical Focus
*   Color theory algorithms for mixing.
*   CSS animations and transitions for a high-polish feel.
*   localstorage for saving the discovered recipe book.

# Project: Neon Logic

## 1. Project Goal
To create a stylish, cyberpunk-themed logic puzzle game running in the browser. The player acts as a "System Architect" in a futuristic dystopia, repairing corrupted data nodes by routing signals through logic gates. The goal is to maximize efficiency (lowest cost/cycles) while solving increasingly complex boolean logic puzzles.

## 2. Core Concepts
*   **Visual Logic:** The core mechanic is dragging and dropping components (Emitters, Gates, Receivers) onto a grid and connecting them with wires.
*   **Signal Flow:** Signals are visualized as glowing pulses of energy moving through the wires. Timing matters—signals must arrive at the destination in the correct state (ON/OFF).
*   **Cyberpunk Aesthetic:** The game must *feel* like you are hacking a terminal.
    *   **Visuals:** Dark background (`#0a0a0f`), neon accents (Cyan/Magenta), scanlines, chromatic aberration, glitched text effects.
    *   **Audio (Planned):** Low-hum synth ambiance, crisp "click" sounds for connections.
*   **Score & Optimization:** Each level has a target, but players are ranked on:
    *   *Silicon:* Number of components used.
    *   *Cycles:* Speed of solution (tick count).

## 3. Gameplay Loop
1.  **Level Select:** Player chooses a corrupted node from the "City Map" (level select screen).
2.  **Briefing:** A brief, glitchy text log describes the input/output requirements (e.g., "Output TRUE only when Input A and Input B do not match").
3.  **Build Phase:**
    *   Player drags gates (AND, OR, XOR, NOT, DELAY) from the toolbox.
    *   Wires are drawn by clicking and dragging between input/output pins.
4.  **Simulation Phase:**
    *   Player hits "Run".
    *   The system ticks. Emitters send pulses. Gates process inputs and change state.
    *   Visual feedback shows the flow of logic.
5.  **Success/Failure:**
    *   Success: The output matches the expected truth table. "NODE REPAIRED" animation plays.
    *   Failure: Error log appears showing where the output mismatched.
6.  **Stats:** Score is calculated and saved.

## 4. Technical Plan
*   **Stack:** HTML5, CSS3 (for UI overlay), Vanilla JavaScript (ESModules).
*   **Rendering:**
    *   **Canvas API:** For the main grid, wires, and moving signal pulses. This allows for high-performance rendering of many moving parts.
    *   **DOM/CSS:** For the HUD, inventory, buttons, and story text. Utilizing CSS filters (`drop-shadow`, `blur`) for the neon glow effects.
*   **Architecture:**
    *   `GameEngine`: Manages the update loop (`requestAnimationFrame`) and state.
    *   `GridSystem`: Handles mapping pixel coordinates to grid cells.
    *   `ComponentManager`: Manages the list of active logical components and their connections.
    *   `LogicSimulator`: A pure logic step-processor. It calculates the state of every gate for the *next* tick based on current inputs.
    *   `LevelLoader`: JSON-based level definitions (inputs, expected outputs, available tools).

## 5. Development Phases
1.  **Phase 1: The Core (Skeleton)**
    *   Set up file structure (`index.html`, `style.css`, `src/`).
    *   Implement the grid and basic canvas rendering loop.
    *   Create the "Wire" drawing mechanic.
2.  **Phase 2: Logic & Simulation**
    *   Implement base Component class and Gate subclasses (AND, OR).
    *   Build the `LogicSimulator` to process signals tick-by-tick.
    *   Visualize the signals moving.
3.  **Phase 3: The Cyberpunk UI (Aesthetics)**
    *   Apply the complete CSS theme (scanlines, CRT fonts).
    *   Create the intuitive Drag-and-Drop toolbox.
4.  **Phase 4: Game Loop & Content**
    *   Implement the Win/Loss condition checker.
    *   Design the first 3 tutorial levels.
    *   Save logic for local progression.

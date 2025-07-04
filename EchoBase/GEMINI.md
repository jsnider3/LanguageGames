# Project: Echo Base

## 1. Project Goal
To create a text-based colony simulation game. The player takes on the role of a base commander on a newly discovered planet. The goal is to manage colonists and resources to build a self-sufficient, thriving outpost while surviving environmental challenges.

## 2. Core Concepts
*   **Resource Management:** The player must balance key resources like Food, Water, Power, and Building Materials.
*   **Worker Placement:** Assign colonists to different jobs (Farming, Mining, Research, Construction) to generate resources and expand the base.
*   **Building & Upgrading:** Construct new buildings (e.g., Greenhouses, Solar Arrays, Living Quarters) and upgrade them to improve efficiency and unlock new capabilities.
*   **Event Survival:** The game will feature random events that challenge the player, such as meteor showers, equipment malfunctions, or scientific breakthroughs.

## 3. Gameplay Loop
The game progresses in daily turns. Each turn, the player will:
1.  **Review Status:** Check resource levels, colonist assignments, and base alerts.
2.  **Issue Commands:**
    *   `assign <number> <job>` (e.g., `assign 5 farming`)
    *   `build <building>` (e.g., `build greenhouse`)
    *   `status` (to get a detailed report)
3.  **Advance Day:** Type `next` to end the turn.
4.  **Daily Report:** The game processes the assignments, calculates resource generation/consumption, and reports the results, including any random events that occurred.
5.  The loop repeats. The challenge is to survive for a set number of days or reach a target population.

## 4. Technical Plan
*   **Language:** Python 3
*   **Main File:** `echobase.py`
*   **Core Classes:**
    *   `Colony`: A central class to hold the state of all resources, colonists, and buildings.
    *   `Building`: A base class for structures, with subclasses for each type (e.g., `Greenhouse`, `Mine`). Each will have a resource cost, maintenance needs, and output.
    *   `EventManager`: A class to handle the logic for triggering and resolving random events.
    *   `Game`: The main class to run the game loop and handle player commands.

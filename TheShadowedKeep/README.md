# Project: The Shadowed Keep

## 1. Project Goal
To create a simple, replayable, text-based roguelike game. The player will explore a randomly generated dungeon, fight monsters, collect treasure, and try to survive as long as possible.

## 2. Core Concepts
*   **Random Generation:** The dungeon layout, monster encounters, and treasure will be different each time you play.
*   **Turn-Based Gameplay:** The game progresses one command at a time.
*   **Permadeath:** If you die, you start over. The challenge is to get a new high score (deepest floor reached).
*   **Risk vs. Reward:** Do you open that suspicious-looking chest? Do you fight that powerful monster or try to flee?

## 3. Gameplay Loop
1.  The player enters a new, unseen room.
2.  The game describes the room and its contents (e.g., a monster, a treasure chest, or an exit).
3.  The player chooses an action (`move`, `attack`, `open chest`, `run`).
4.  The game resolves the action and the consequences.
5.  This loop repeats until the player dies or decides to quit.

## 4. Technical Plan
*   **Language:** Python 3
*   **Main File:** `shadowkeep.py`
*   **Core Classes:**
    *   `Player`: To manage health, attack power, and other stats.
    *   `Monster`: A base class for enemies, with subclasses for different types (e.g., `Goblin`, `Orc`).
    *   `Dungeon`: To manage the generation of floors and rooms.
    *   `Game`: The main class to run the game loop and handle player commands.
*   **Randomness:** Python's `random` module will be used extensively for procedural generation.

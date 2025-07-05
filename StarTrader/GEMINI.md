# Project: Star Trader

## 1. Project Goal
To create a text-based space trading simulation game. The player will start with a small, basic starship and a handful of credits. The goal is to navigate a dangerous galaxy, trade goods between star systems, and build a fortune to become the most renowned trader in the sector.

## 2. Core Concepts
*   **Economic Simulation:** The core of the game is buying low and selling high. Each star system has a unique economy and market, including hidden black markets.
*   **Galaxy Exploration:** The galaxy is represented by a map of star systems connected by travel routes.
*   **Modular Ship Customization:** The player's ship is their lifeline. It is composed of a hull and various installable modules (weapons, shields, engines, etc.). Players can buy new modules to upgrade their ship's capabilities.
*   **Factions & Reputation:** The galaxy is divided among different factions. The player's actions affect their reputation, which can lead to benefits or consequences.
*   **Missions:** Players can accept missions from a mission board, such as delivering or procuring goods, for credits and reputation rewards. Missions have time limits and failure penalties.
*   **Risk and Reward:** Space is not empty. Travel carries risks like pirate attacks (which are resolved through a simple turn-based combat system), customs scans, and asteroid fields.

## 3. Gameplay Loop
1.  **Docked at a Starport:** The player starts at a starport. Here, they can:
    *   `trade` or `blackmarket`: View the local markets to buy or sell goods.
    *   `shipyard`: Repair their ship and buy new modules.
    *   `missions`: View and accept available missions.
    *   `status`: Check their current credits, cargo, ship condition, and faction standings.
2.  **Travel:** The player chooses a destination system to travel to.
    *   `travel <system_name>`: This consumes fuel and advances the in-game day.
3.  **Random Events:** During travel, a random event may occur.
4.  **Arrival:** The player arrives at the new starport, and the loop repeats.

## 4. Technical Plan
*   **Language:** Python 3
*   **Main File:** `startrader.py`
*   **Core Classes:**
    *   `Player`: Manages credits, the ship, current location, active missions, and reputation.
    *   `Ship`: A modular object composed of a hull (`ship_class_data`) and a dictionary of installed `modules`. Its stats are calculated from these components.
    *   `Galaxy`: Holds the map of all `StarSystem` objects, their connections, and market data.
    *   `StarSystem`: Manages the local economy, market prices, available services (shipyard, black market), available missions, and its controlling `faction`.
    *   `Mission`: Defines a mission with a type, destination, cargo, rewards, and time limit.
    *   `EventManager`: Handles random events during travel, including combat and customs scans.
    *   `Game`: The main class that runs the game loop and handles player commands via a clean, dictionary-based command dispatcher.
*   **Data-Driven Design:** Ship classes and modules are defined in the `SHIP_CLASSES` and `MODULE_SPECS` dictionaries, making them easy to expand.
*   **Persistence:** The game state can be saved and loaded via a `savegame.json` file.
*   **Testing:** A comprehensive test suite in `test_startrader.py` uses the `unittest` module to verify core functionality and playthrough scenarios.

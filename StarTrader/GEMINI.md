# Project: Star Trader

## 1. Project Goal
To create a text-based space trading simulation game. The player will start with a small, basic starship and a handful of credits. The goal is to navigate a dangerous galaxy, trade goods between star systems, and build a fortune to become the most renowned trader in the sector.

## 2. Core Concepts
*   **Economic Simulation:** The core of the game is buying low and selling high. Each star system will have a unique economy with goods it produces (making them cheap) and goods it demands (making them expensive).
*   **Galaxy Exploration:** The galaxy will be represented by a 2D map of star systems. The player will travel between them, discovering new trade routes and encountering various events along the way.
*   **Ship Management:** The player's ship is their lifeline. They will need to manage its cargo hold, fuel, and hull integrity. Credits earned from trading can be used to upgrade the ship's engine, cargo capacity, and defenses.
*   **Risk and Reward:** Space is not empty. Travel between systems carries risks, such as pirate attacks, asteroid fields, or mechanical failures. Higher-risk routes might offer more lucrative trade opportunities.

## 3. Gameplay Loop
1.  **Docked at a Starport:** The player starts at a starport. Here, they can:
    *   `trade`: View the local market to buy or sell goods.
    *   `shipyard`: Upgrade their ship or repair damage.
    *   `refuel`: Buy fuel for interstellar travel.
    *   `status`: Check their current credits, cargo, and ship condition.
2.  **Travel:** The player chooses a destination system to travel to.
    *   `travel <system_name>`: This consumes fuel and time.
3.  **Random Events:** During travel, a random event may occur.
    *   **Pirate Encounter:** The player can choose to fight (a simple combat system), flee (risk taking damage), or negotiate (risk losing cargo).
    *   **Derelict Ship:** A chance to salvage materials or find abandoned cargo.
    *   **Trade Rumor:** A tip about a high-demand good in a nearby system.
4.  **Arrival:** The player arrives at the new starport, and the loop repeats. The game ends if the player's ship is destroyed or if they choose to retire.

## 4. Technical Plan
*   **Language:** Python 3
*   **Main File:** `startrader.py`
*   **Core Classes:**
    *   `Player`: To manage credits, the ship, and current location.
    *   `Ship`: To handle stats like cargo capacity, fuel, hull integrity, and upgrades.
    *   `Galaxy`: To hold the map of all `StarSystem` objects and their connections.
    *   `StarSystem`: To manage the local economy, market prices, and available services (shipyard, etc.).
    *   `EventManager`: To handle random events during travel.
    *   `Game`: The main class to run the game loop and handle commands.

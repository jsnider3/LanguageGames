import random
import time

# --- Data ---

SHIPYARD_SPECS = {
    "cargo_hold": {
        "name": "Cargo Hold",
        "levels": [
            {"cost": 0, "capacity": 20},
            {"cost": 1000, "capacity": 30},
            {"cost": 2500, "capacity": 50},
            {"cost": 5000, "capacity": 80},
        ]
    },
    "engine": {
        "name": "Engine",
        "levels": [
            {"cost": 0, "fuel_efficiency": 1.0},
            {"cost": 1500, "fuel_efficiency": 0.9},
            {"cost": 4000, "fuel_efficiency": 0.8},
        ]
    },
    "hull": {
        "name": "Hull Plating",
        "levels": [
            {"cost": 0, "max_hull": 100},
            {"cost": 1200, "max_hull": 120},
            {"cost": 3000, "max_hull": 150},
        ]
    }
}

REPAIR_COST_PER_HP = 15

GOODS = {
    "Food": {"base_price": 20},
    "Medicine": {"base_price": 50},
    "Machinery": {"base_price": 100},
    "Minerals": {"base_price": 80},
    "Luxury Goods": {"base_price": 200}
}

class StarSystem:
    """Represents a single star system in the galaxy."""
    def __init__(self, name, description, economy_type, has_shipyard=False):
        self.name = name
        self.description = description
        self.economy_type = economy_type
        self.has_shipyard = has_shipyard
        self.market = {}

class Galaxy:
    """Holds the map of all star systems and generates their markets."""
    def __init__(self):
        self.systems = {}
        self.connections = {}
        self.fuel_costs = {}
        self.active_events = {} # e.g., {"Sirius": {"type": "famine", "duration": 5}}
        self._create_galaxy()
        self._generate_markets()

    def _create_galaxy(self):
        """Creates the star systems and their connections in the galaxy."""
        self.systems["Sol"] = StarSystem("Sol", "The bustling core of humanity.", "Core", has_shipyard=True)
        self.systems["Alpha Centauri"] = StarSystem("Alpha Centauri", "A verdant agricultural world.", "Agricultural")
        self.systems["Sirius"] = StarSystem("Sirius", "A heavily industrialized system.", "Industrial", has_shipyard=True)
        self.systems["Vega"] = StarSystem("Vega", "A remote mining outpost.", "Mining")

        self.connections = {
            "Sol": ["Alpha Centauri", "Sirius"],
            "Alpha Centauri": ["Sol", "Vega"],
            "Sirius": ["Sol", "Vega"],
            "Vega": ["Alpha Centauri", "Sirius"]
        }
        
        self.fuel_costs = {
            ("Sol", "Alpha Centauri"): 10, ("Sol", "Sirius"): 12,
            ("Alpha Centauri", "Vega"): 15, ("Sirius", "Vega"): 15,
        }
        for (sys1, sys2), cost in list(self.fuel_costs.items()):
            self.fuel_costs[(sys2, sys1)] = cost

    def _get_base_price_multiplier(self, system_economy, good):
        """Calculates the base price multiplier for a good in a system."""
        if system_economy == "Agricultural" and good == "Food": return 0.6
        if system_economy != "Agricultural" and good == "Food": return 1.4
        if system_economy == "Industrial" and good == "Machinery": return 0.7
        if system_economy != "Industrial" and good == "Machinery": return 1.3
        if system_economy == "Mining" and good == "Minerals": return 0.5
        if system_economy != "Mining" and good == "Minerals": return 1.5
        return 1.0

    def _generate_markets(self):
        """Generates the initial market data for each system."""
        for system in self.systems.values():
            for good, data in GOODS.items():
                base_price = data["base_price"]
                multiplier = self._get_base_price_multiplier(system.economy_type, good)
                price = int(base_price * multiplier * random.uniform(0.9, 1.1))
                quantity = random.randint(50, 200)
                system.market[good] = {"price": price, "quantity": quantity}

    def update_markets(self):
        """Updates all markets due to natural economic drift and events."""
        # Decay active events
        for system_name, event in list(self.active_events.items()):
            event["duration"] -= 1
            if event["duration"] <= 0:
                print(f"The {event['type']} in {system_name} has ended.")
                del self.active_events[system_name]

        # Update prices
        for system in self.systems.values():
            for good, data in system.market.items():
                base_price = GOODS[good]["base_price"]
                multiplier = self._get_base_price_multiplier(system.economy_type, good)
                
                # Check for events
                if system.name in self.active_events:
                    event = self.active_events[system.name]
                    if event["type"] == "famine" and good == "Food":
                        multiplier *= 3.0 # Famine triples food prices
                    if event["type"] == "mining_strike" and good == "Minerals":
                        multiplier *= 4.0 # Strike quadruples mineral prices

                target_price = int(base_price * multiplier)
                # Drift price towards the target price
                data["price"] += (target_price - data["price"]) // 4

class Ship:
    """
    Represents the player's starship.
    """
    def __init__(self):
        self.name = "Stardust Drifter"
        self.component_levels = {"cargo_hold": 0, "engine": 0, "hull": 0}
        self.hull = self.max_hull
        self.fuel = 50
        self.max_fuel = 50
        self.cargo_hold = {}

    @property
    def max_hull(self):
        return SHIPYARD_SPECS["hull"]["levels"][self.component_levels["hull"]]["max_hull"]
    @property
    def cargo_capacity(self):
        return SHIPYARD_SPECS["cargo_hold"]["levels"][self.component_levels["cargo_hold"]]["capacity"]
    @property
    def fuel_efficiency(self):
        return SHIPYARD_SPECS["engine"]["levels"][self.component_levels["engine"]]["fuel_efficiency"]

    def get_cargo_used(self):
        return sum(self.cargo_hold.values())
    def add_cargo(self, good, quantity):
        self.cargo_hold[good] = self.cargo_hold.get(good, 0) + quantity
    def remove_cargo(self, good, quantity):
        if good in self.cargo_hold:
            self.cargo_hold[good] -= quantity
            if self.cargo_hold[good] <= 0:
                del self.cargo_hold[good]

class Player:
    """
    Represents the player.
    """
    def __init__(self, name="Captain"):
        self.name = name
        self.credits = 1000
        self.ship = Ship()
        self.location = None

class EventManager:
    """Handles random events during travel."""
    def __init__(self, game):
        self.game = game

    def trigger_event(self):
        """Randomly determines if an event occurs and handles it."""
        if random.random() > 0.25: return

        # Prioritize economic events for now, will add more later
        event_type = random.choice(["famine", "mining_strike", "pirate", "derelict", "asteroid"])
        print("\n--- EVENT ---")

        if event_type == "famine": self._handle_famine()
        elif event_type == "mining_strike": self._handle_mining_strike()
        elif event_type == "pirate": self._handle_pirate_encounter()
        elif event_type == "derelict": self._handle_derelict_ship()
        elif event_type == "asteroid": self._handle_asteroid_field()

    def _handle_famine(self):
        system = random.choice(list(self.game.galaxy.systems.values()))
        if system.economy_type == "Agricultural": # Famines don't happen on farm worlds
            print("A distress call from a nearby system speaks of a bountiful harvest. Prices for food there may be low.")
            return
        print(f"A severe famine has struck {system.name}! Demand for food is critical.")
        self.game.galaxy.active_events[system.name] = {"type": "famine", "duration": 10}

    def _handle_mining_strike(self):
        system = random.choice(list(self.game.galaxy.systems.values()))
        if system.economy_type == "Mining":
            print(f"A new mineral vein was discovered in {system.name}. Mineral prices there may be low.")
            return
        print(f"A widespread labor strike has halted all mining operations in {system.name}!")
        self.game.galaxy.active_events[system.name] = {"type": "mining_strike", "duration": 8}

    def _handle_pirate_encounter(self):
        print("You've been ambushed by pirates!")
        demands = random.randint(100, 500)
        print(f"They demand {demands} credits or they'll open fire!")
        
        while True:
            choice = input("Do you 'pay' them, or 'fight'? > ").lower()
            if choice == "pay":
                if self.game.player.credits >= demands:
                    self.game.player.credits -= demands
                    print(f"You pay the pirates {demands} credits. They let you pass.")
                    return
                else:
                    print("You don't have enough credits to pay! They open fire!")
            
            print("You stand your ground and fight!")
            damage = random.randint(10, 30)
            self.game.player.ship.hull -= damage
            print(f"You manage to drive them off, but your ship takes {damage} hull damage.")
            if self.game.player.ship.hull <= 0:
                self.game.game_over = True
                print("Your ship was destroyed by pirates...")
            return

    def _handle_derelict_ship(self):
        print("You come across a derelict, drifting ship.")
        salvage = random.randint(50, 200)
        self.game.player.credits += salvage
        print(f"You salvage parts worth {salvage} credits.")

    def _handle_asteroid_field(self):
        print("You navigate a dense asteroid field.")
        damage = random.randint(5, 15)
        self.game.player.ship.hull -= damage
        print(f"You make it through, but your ship takes {damage} hull damage.")
        if self.game.player.ship.hull <= 0:
            self.game.game_over = True
            print("Your ship was destroyed by asteroids...")

class Game:
    """
    Manages the main game loop and player commands.
    """
    def __init__(self):
        self.player = Player()
        self.galaxy = Galaxy()
        self.event_manager = EventManager(self)
        self.game_over = False
        self.player.location = self.galaxy.systems["Sol"]

    def get_status(self):
        ship = self.player.ship
        system = self.player.location
        connections = self.galaxy.connections.get(system.name, [])
        travel_options = ", ".join(connections) or "None"
        cargo_list = ", ".join(f"{item} ({qty})" for item, qty in ship.cargo_hold.items()) or "Empty"

        status = (
            f"--- Captain {self.player.name} ---\n"
            f"Credits: {self.player.credits}\n"
            f"\nCurrent Location: {system.name} ({system.economy_type})\n"
            f"Description: {system.description}\n"
            f"Reachable Systems: {travel_options}\n"
        )
        if system.name in self.galaxy.active_events:
            event = self.galaxy.active_events[system.name]
            status += f"EVENT: This system is experiencing a {event['type']}!\n"
        
        status += (
            f"\n--- Ship: {ship.name} ---\n"
            f"Hull: {ship.hull}/{ship.max_hull}\n"
            f"Fuel: {ship.fuel}/{ship.max_fuel}\n"
            f"Cargo ({ship.get_cargo_used()}/{ship.cargo_capacity}): {cargo_list}"
        )
        return status

    def _handle_trade(self):
        system = self.player.location
        print(f"\n--- Market at {system.name} ---")
        print(f"{'Good':<15} {'Price':>10} {'Quantity':>10}")
        print("-" * 37)
        
        for good, data in sorted(system.market.items()):
            print(f"{good:<15} {data['price']:>10} {data['quantity']:>10}")
        
        print("\nUse 'buy <good> <quantity>' or 'sell <good> <quantity>'.")

    def _handle_buy(self, parts):
        if len(parts) != 3:
            print("Invalid format. Use: buy <good> <quantity>")
            return
        good_name = parts[1].capitalize()
        try: quantity = int(parts[2])
        except ValueError: print("Quantity must be a number."); return
        if quantity <= 0: print("Quantity must be positive."); return

        system = self.player.location
        if good_name not in system.market:
            print(f"'{good_name}' is not sold here."); return

        market_data = system.market[good_name]
        if quantity > market_data["quantity"]:
            print(f"Not enough {good_name} in stock."); return

        total_cost = market_data["price"] * quantity
        if self.player.credits < total_cost:
            print(f"Not enough credits."); return

        ship = self.player.ship
        if ship.get_cargo_used() + quantity > ship.cargo_capacity:
            print(f"Not enough cargo space."); return

        self.player.credits -= total_cost
        market_data["quantity"] -= quantity
        market_data["price"] = int(market_data["price"] * (1 + 0.05 * (quantity / 50))) + 1 # Price increases on buy
        ship.add_cargo(good_name, quantity)
        print(f"Successfully purchased {quantity} units of {good_name} for {total_cost} credits.")

    def _handle_sell(self, parts):
        if len(parts) != 3:
            print("Invalid format. Use: sell <good> <quantity>"); return
        good_name = parts[1].capitalize()
        try: quantity = int(parts[2])
        except ValueError: print("Quantity must be a number."); return
        if quantity <= 0: print("Quantity must be positive."); return

        ship = self.player.ship
        if good_name not in ship.cargo_hold or ship.cargo_hold[good_name] < quantity:
            print(f"You don't have {quantity} units of {good_name} to sell."); return

        system = self.player.location
        market_data = system.market[good_name]
        total_sale = market_data["price"] * quantity

        self.player.credits += total_sale
        market_data["quantity"] += quantity
        market_data["price"] = max(1, int(market_data["price"] * (1 - 0.05 * (quantity / 50))) - 1) # Price decreases on sell, min 1
        ship.remove_cargo(good_name, quantity)
        print(f"Successfully sold {quantity} units of {good_name} for {total_sale} credits.")

    def _handle_travel(self, parts):
        if len(parts) < 2:
            print("Invalid format. Use: travel <system name>"); return
        destination_input = " ".join(parts[1:]).title()
        
        if destination_input not in self.galaxy.systems:
            print(f"Unknown system: '{destination_input}'"); return

        current_system = self.player.location
        if current_system.name == destination_input:
            print("You are already in that system."); return

        if destination_input not in self.galaxy.connections[current_system.name]:
             print(f"Cannot travel directly from {current_system.name} to {destination_input}."); return
        
        fuel_needed = self.galaxy.fuel_costs.get((current_system.name, destination_input))
        fuel_needed = int(fuel_needed * self.player.ship.fuel_efficiency)
        if self.player.ship.fuel < fuel_needed:
            print(f"Not enough fuel. You need {fuel_needed}, but only have {self.player.ship.fuel}."); return

        self.player.ship.fuel -= fuel_needed
        self.galaxy.update_markets() # Markets change over time
        
        print(f"\nTraveling from {current_system.name} to {destination_input}...")
        time.sleep(1)
        
        self.event_manager.trigger_event()
        if self.game_over: return

        self.player.location = self.galaxy.systems[destination_input]
        print(f"Arrived at {destination_input}. The journey consumed {fuel_needed} fuel.")
        print(self.get_status())

    def _handle_shipyard(self):
        if not self.player.location.has_shipyard:
            print("No shipyard available in this system."); return
        
        print("\n--- Shipyard ---")
        print("Available commands: 'repair', 'upgrade <component>'")
        print(f"Hull: {self.player.ship.hull}/{self.player.ship.max_hull}. Repair cost: {REPAIR_COST_PER_HP} credits per point.")
        
        for component, specs in SHIPYARD_SPECS.items():
            current_level = self.player.ship.component_levels[component]
            if current_level + 1 < len(specs["levels"]):
                next_level_cost = specs["levels"][current_level + 1]["cost"]
                print(f"- Upgrade {specs['name']} (Lvl {current_level + 1}): {next_level_cost} credits")
            else:
                print(f"- {specs['name']} is fully upgraded.")

    def _handle_repair(self):
        ship = self.player.ship
        damage = ship.max_hull - ship.hull
        if damage == 0: print("Ship hull is already at maximum."); return
        
        cost = damage * REPAIR_COST_PER_HP
        if self.player.credits < cost:
            print(f"Not enough credits to fully repair."); return
        
        self.player.credits -= cost
        ship.hull = ship.max_hull
        print(f"Ship hull repaired for {cost} credits.")

    def _handle_upgrade(self, parts):
        if len(parts) != 2:
            print("Invalid format. Use: upgrade <component>"); return
        
        component_name = parts[1]
        if component_name not in SHIPYARD_SPECS:
            print(f"Unknown component: '{component_name}'."); return
            
        ship = self.player.ship
        current_level = ship.component_levels[component_name]
        specs = SHIPYARD_SPECS[component_name]

        if current_level + 1 >= len(specs["levels"]):
            print(f"{specs['name']} is already fully upgraded."); return
            
        cost = specs["levels"][current_level + 1]["cost"]
        if self.player.credits < cost:
            print(f"Not enough credits. You need {cost} to upgrade."); return
            
        self.player.credits -= cost
        ship.component_levels[component_name] += 1
        if component_name == "hull": ship.hull = ship.max_hull
            
        print(f"Successfully upgraded {specs['name']} to Level {ship.component_levels[component_name] + 1} for {cost} credits.")

    def run(self):
        """The main game loop."""
        print("Welcome to Star Trader!")
        print("Your goal is to make a fortune trading between the stars.")
        print("Commands: 'status', 'trade', 'buy', 'sell', 'travel', 'shipyard', 'repair', 'upgrade', 'quit'")
        print(self.get_status())

        while not self.game_over:
            command = input("> ").strip().lower()
            parts = command.split()
            verb = parts[0] if parts else ""
            
            if verb == "quit": self.game_over = True
            elif verb == "status": print(self.get_status())
            elif verb == "trade": self._handle_trade()
            elif verb == "buy": self._handle_buy(parts)
            elif verb == "sell": self._handle_sell(parts)
            elif verb == "travel": self._handle_travel(parts)
            elif verb == "shipyard": self._handle_shipyard()
            elif verb == "repair": self._handle_repair()
            elif verb == "upgrade": self._handle_upgrade(parts)
            else: print(f"Unknown command: '{command}'")
        
        print("You have retired from your life as a trader. Farewell.")


if __name__ == "__main__":
    game = Game()
    game.run()



if __name__ == "__main__":
    game = Game()
    game.run()

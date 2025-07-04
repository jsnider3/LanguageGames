import random
import time

class StarSystem:
    """Represents a single star system in the galaxy."""
    def __init__(self, name, description, economy_type):
        self.name = name
        self.description = description
        self.economy_type = economy_type # e.g., 'Industrial', 'Agricultural', 'Core'
        self.market = {} # To be populated by the Galaxy class

class Galaxy:
    """Holds the map of all star systems and generates their markets."""
    def __init__(self):
        self.systems = {}
        self.connections = {}
        self.fuel_costs = {}
        self._create_galaxy()
        self._generate_markets()

    def _create_galaxy(self):
        """Creates the star systems and their connections in the galaxy."""
        self.systems["Sol"] = StarSystem("Sol", "The bustling core of humanity, with a balanced and robust economy.", "Core")
        self.systems["Alpha Centauri"] = StarSystem("Alpha Centauri", "A verdant agricultural world, known for its vast hydroponic farms.", "Agricultural")
        self.systems["Sirius"] = StarSystem("Sirius", "A heavily industrialized system, its skies thick with the smog of a thousand factories.", "Industrial")
        self.systems["Vega"] = StarSystem("Vega", "A remote mining outpost, rich in rare minerals and heavy metals.", "Mining")

        self.connections = {
            "Sol": ["Alpha Centauri", "Sirius"],
            "Alpha Centauri": ["Sol", "Vega"],
            "Sirius": ["Sol", "Vega"],
            "Vega": ["Alpha Centauri", "Sirius"]
        }
        
        self.fuel_costs = {
            ("Sol", "Alpha Centauri"): 10,
            ("Sol", "Sirius"): 12,
            ("Alpha Centauri", "Vega"): 15,
            ("Sirius", "Vega"): 15,
        }
        # Make fuel costs bidirectional
        for (sys1, sys2), cost in list(self.fuel_costs.items()):
            self.fuel_costs[(sys2, sys1)] = cost

    def _generate_markets(self):
        """Generates the initial market data for each system based on its economy."""
        goods = {
            "Food": 20, "Medicine": 50, "Machinery": 100, 
            "Minerals": 80, "Luxury Goods": 200
        }

        for system in self.systems.values():
            for good, base_price in goods.items():
                price_multiplier = 1.0
                if system.economy_type == "Agricultural" and good == "Food": price_multiplier = 0.6
                elif system.economy_type != "Agricultural" and good == "Food": price_multiplier = 1.4
                
                if system.economy_type == "Industrial" and good == "Machinery": price_multiplier = 0.7
                elif system.economy_type != "Industrial" and good == "Machinery": price_multiplier = 1.3

                if system.economy_type == "Mining" and good == "Minerals": price_multiplier = 0.5
                elif system.economy_type != "Mining" and good == "Minerals": price_multiplier = 1.5

                price = int(base_price * price_multiplier * random.uniform(0.9, 1.1))
                quantity = random.randint(50, 200)
                system.market[good] = {"price": price, "quantity": quantity}

class Ship:
    """
    Represents the player's starship.
    """
    def __init__(self):
        self.name = "Stardust Drifter"
        self.hull = 100
        self.max_hull = 100
        self.fuel = 50
        self.max_fuel = 50
        self.cargo_hold = {} # Will store item: quantity
        self.cargo_capacity = 20

    def get_cargo_used(self):
        """Returns the total number of items in the cargo hold."""
        return sum(self.cargo_hold.values())

    def add_cargo(self, good, quantity):
        """Adds a specified quantity of a good to the cargo hold."""
        self.cargo_hold[good] = self.cargo_hold.get(good, 0) + quantity

    def remove_cargo(self, good, quantity):
        """Removes a specified quantity of a good from the cargo hold."""
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
        self.location = None # Will be a StarSystem object

class Game:
    """
    Manages the main game loop and player commands.
    """
    def __init__(self):
        self.player = Player()
        self.galaxy = Galaxy()
        self.game_over = False
        self.player.location = self.galaxy.systems["Sol"]

    def get_status(self):
        """Returns a formatted string of the player's current status."""
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
            f"\n--- Ship: {ship.name} ---\n"
            f"Hull: {ship.hull}/{ship.max_hull}\n"
            f"Fuel: {ship.fuel}/{ship.max_fuel}\n"
            f"Cargo ({ship.get_cargo_used()}/{ship.cargo_capacity}): {cargo_list}"
        )
        return status

    def _handle_trade(self):
        """Displays the market of the current system."""
        system = self.player.location
        print(f"\n--- Market at {system.name} ---")
        print(f"{'Good':<15} {'Price':>10} {'Quantity':>10}")
        print("-" * 37)
        
        for good, data in sorted(system.market.items()):
            print(f"{good:<15} {data['price']:>10} {data['quantity']:>10}")
        
        print("\nUse 'buy <good> <quantity>' or 'sell <good> <quantity>'.")

    def _handle_buy(self, parts):
        """Handles the 'buy' command."""
        if len(parts) != 3:
            print("Invalid format. Use: buy <good> <quantity>")
            return

        good_name = parts[1].capitalize()
        try:
            quantity = int(parts[2])
        except ValueError:
            print("Quantity must be a number.")
            return

        if quantity <= 0:
            print("Quantity must be positive.")
            return

        system = self.player.location
        if good_name not in system.market:
            print(f"'{good_name}' is not sold here.")
            return

        market_data = system.market[good_name]
        if quantity > market_data["quantity"]:
            print(f"Not enough {good_name} in stock. Only {market_data['quantity']} available.")
            return

        total_cost = market_data["price"] * quantity
        if self.player.credits < total_cost:
            print(f"Not enough credits. You need {total_cost}, but only have {self.player.credits}.")
            return

        ship = self.player.ship
        if ship.get_cargo_used() + quantity > ship.cargo_capacity:
            print(f"Not enough cargo space. You need {quantity} slots, but only have {ship.cargo_capacity - ship.get_cargo_used()} free.")
            return

        self.player.credits -= total_cost
        market_data["quantity"] -= quantity
        ship.add_cargo(good_name, quantity)
        print(f"Successfully purchased {quantity} units of {good_name} for {total_cost} credits.")

    def _handle_sell(self, parts):
        """Handles the 'sell' command."""
        if len(parts) != 3:
            print("Invalid format. Use: sell <good> <quantity>")
            return

        good_name = parts[1].capitalize()
        try:
            quantity = int(parts[2])
        except ValueError:
            print("Quantity must be a number.")
            return

        if quantity <= 0:
            print("Quantity must be positive.")
            return

        ship = self.player.ship
        if good_name not in ship.cargo_hold or ship.cargo_hold[good_name] < quantity:
            print(f"You don't have {quantity} units of {good_name} to sell.")
            return

        system = self.player.location
        market_data = system.market[good_name]
        total_sale = market_data["price"] * quantity

        self.player.credits += total_sale
        market_data["quantity"] += quantity
        ship.remove_cargo(good_name, quantity)
        print(f"Successfully sold {quantity} units of {good_name} for {total_sale} credits.")

    def _handle_travel(self, parts):
        """Handles the 'travel' command."""
        if len(parts) < 2:
            print("Invalid format. Use: travel <system name>")
            return

        destination_input = " ".join(parts[1:]).title()
        
        if destination_input not in self.galaxy.systems:
            print(f"Unknown system: '{destination_input}'")
            return

        current_system = self.player.location
        if current_system.name == destination_input:
            print("You are already in that system.")
            return

        if destination_input not in self.galaxy.connections[current_system.name]:
             print(f"Cannot travel directly from {current_system.name} to {destination_input}.")
             print(f"From here you can travel to: {', '.join(self.galaxy.connections[current_system.name])}")
             return
        
        fuel_needed = self.galaxy.fuel_costs.get((current_system.name, destination_input))
        if self.player.ship.fuel < fuel_needed:
            print(f"Not enough fuel. You need {fuel_needed}, but only have {self.player.ship.fuel}.")
            return

        self.player.ship.fuel -= fuel_needed
        self.player.location = self.galaxy.systems[destination_input]
        print(f"\nTraveling from {current_system.name} to {destination_input}...")
        time.sleep(1) # Add a little delay for effect
        print(f"Arrived at {destination_input}. The journey consumed {fuel_needed} fuel.")
        print(self.get_status())

    def run(self):
        """The main game loop."""
        print("Welcome to Star Trader!")
        print("Your goal is to make a fortune trading between the stars.")
        print("Commands: 'status', 'trade', 'buy', 'sell', 'travel', 'quit'")
        print(self.get_status())

        while not self.game_over:
            command = input("> ").strip().lower()
            parts = command.split()
            verb = parts[0] if parts else ""
            
            if verb == "quit":
                print("You have retired from your life as a trader. Farewell.")
                self.game_over = True
            elif verb == "status":
                print(self.get_status())
            elif verb == "trade":
                self._handle_trade()
            elif verb == "buy":
                self._handle_buy(parts)
            elif verb == "sell":
                self._handle_sell(parts)
            elif verb == "travel":
                self._handle_travel(parts)
            else:
                print(f"Unknown command: '{command}'")


if __name__ == "__main__":
    game = Game()
    game.run()

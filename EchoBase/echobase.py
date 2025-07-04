import random

# --- Building Data ---
BUILDING_SPECS = {
    "greenhouse": {
        "cost": 25,
        "produces": {"food": 15},
        "consumes": {"power": 5}
    },
    "solar_array": {
        "cost": 20,
        "produces": {"power": 20},
        "consumes": {}
    }
}

class Building:
    """A constructed building in the colony."""
    def __init__(self, name):
        self.name = name
        self.spec = BUILDING_SPECS[name]

class EventManager:
    """Handles the triggering and effects of random events."""
    def __init__(self):
        self.events = {
            "bountiful_harvest": {
                "description": "Favorable weather conditions have led to a bountiful harvest!",
                "effect": {"food": 20}
            },
            "power_surge": {
                "description": "A solar flare caused a temporary surge in the power grid.",
                "effect": {"power": 30}
            },
            "micrometeoroid_shower": {
                "description": "A micrometeoroid shower passed by, causing minor damage to the exterior.",
                "effect": {"materials": -15}
            }
        }

    def trigger_event(self, colony):
        """Randomly triggers an event and applies its effects."""
        # 25% chance of an event happening each day
        if random.random() < 0.25:
            event_name = random.choice(list(self.events.keys()))
            event = self.events[event_name]
            
            print(f"\nEVENT: {event['description']}")
            
            # Apply effects
            if "food" in event["effect"]:
                colony.food += event["effect"]["food"]
            if "power" in event["effect"]:
                colony.power += event["effect"]["power"]
            if "materials" in event["effect"]:
                colony.materials += event["effect"]["materials"]
                if colony.materials < 0:
                    print("The colony couldn't fully repair the damage!")
                    # Could add more severe consequences here later
                    colony.materials = 0
            
            return True
        return False

class Colony:
    """
    Manages the state of the colony, including resources, colonists, and buildings.
    """
    def __init__(self):
        self.day = 1
        self.colonists = 10
        self.food = 50
        self.water = 50
        self.power = 100
        self.materials = 20
        self.buildings = []
        self.event_manager = EventManager()

        # Job assignments
        self.jobs = {
            "unassigned": 10,
            "farming": 0,
            "mining": 0,
            "research": 0
        }

    def get_status(self):
        """Returns a formatted string of the colony's current status."""
        power_prod = sum(b.spec["produces"].get("power", 0) for b in self.buildings)
        power_cons = sum(b.spec["consumes"].get("power", 0) for b in self.buildings)
        power_net = power_prod - power_cons
        
        building_list = ", ".join(b.name for b in self.buildings) if self.buildings else "None"

        status = (
            f"--- Day: {self.day} ---\n"
            f"Colonists: {self.colonists}\n"
            f"  - Farming: {self.jobs['farming']}\n"
            f"  - Mining: {self.jobs['mining']}\n"
            f"  - Research: {self.jobs['research']}\n"
            f"  - Unassigned: {self.jobs['unassigned']}\n"
            f"Resources:\n"
            f"  - Food: {self.food} (Consumption: {self.colonists})\n"
            f"  - Water: {self.water} (Consumption: {self.colonists})\n"
            f"  - Power: {self.power} (Net: {power_net:+.0f})\n"
            f"  - Building Materials: {self.materials}\n"
            f"Buildings: {building_list}"
        )
        return status

    def next_day(self):
        """Processes a single day's resource production and consumption."""
        # --- Event Phase ---
        self.event_manager.trigger_event(self)

        # --- Production Phase ---
        food_produced = self.jobs['farming'] * 2
        materials_produced = self.jobs['mining'] * 1
        power_produced = 0

        for building in self.buildings:
            food_produced += building.spec["produces"].get("food", 0)
            power_produced += building.spec["produces"].get("power", 0)

        # --- Consumption Phase ---
        food_consumed = self.colonists
        water_consumed = self.colonists
        power_consumed = 0
        for building in self.buildings:
            power_consumed += building.spec["consumes"].get("power", 0)

        # --- Apply Deltas ---
        self.food += food_produced - food_consumed
        self.water -= water_consumed
        self.power += power_produced - power_consumed
        self.materials += materials_produced
        
        self.day += 1
        
        print("\n--- Daily Report ---")
        print(f"Food Produced: {food_produced} | Food Consumed: {food_consumed}")
        print(f"Power Generated: {power_produced} | Power Consumed: {power_consumed}")
        print(f"Materials Mined: {materials_produced}")
        
        if self.food < 0 or self.water < 0 or self.power < 0:
            print("\nCatastrophe! The colony has run out of a critical resource.")
            return False # Game over
        
        return True # Continue

class Game:
    """
    Manages the main game loop and player commands.
    """
    def __init__(self):
        self.colony = Colony()
        self.game_over = False

    def _handle_assign(self, parts):
        """Handles the 'assign' command."""
        if len(parts) != 3:
            print("Invalid format. Use: assign <number> <job>")
            return

        try:
            number = int(parts[1])
        except ValueError:
            print("Invalid number. Please enter a whole number.")
            return

        job = parts[2]
        if job not in self.colony.jobs or job == "unassigned":
            print(f"Invalid job. Choose from: farming, mining, research.")
            return

        if number < 0:
            print("Cannot assign a negative number of colonists.")
            return

        if number > self.colony.jobs["unassigned"]:
            print(f"Not enough unassigned colonists. You only have {self.colony.jobs['unassigned']}.")
            return
            
        self.colony.jobs["unassigned"] -= number
        self.colony.jobs[job] += number
        print(f"Assigned {number} colonists to {job}.")
        print(self.colony.get_status())

    def _handle_unassign(self, parts):
        """Handles the 'unassign' command."""
        if len(parts) != 3:
            print("Invalid format. Use: unassign <number> <job>")
            return

        try:
            number = int(parts[1])
        except ValueError:
            print("Invalid number. Please enter a whole number.")
            return

        job = parts[2]
        if job not in self.colony.jobs or job == "unassigned":
            print(f"Invalid job. Choose from: farming, mining, research.")
            return

        if number < 0:
            print("Cannot unassign a negative number of colonists.")
            return

        if number > self.colony.jobs[job]:
            print(f"Not enough colonists in {job} to unassign. You only have {self.colony.jobs[job]}.")
            return
            
        self.colony.jobs[job] -= number
        self.colony.jobs["unassigned"] += number
        print(f"Unassigned {number} colonists from {job}.")
        print(self.colony.get_status())

    def _handle_build(self, parts):
        """Handles the 'build' command."""
        if len(parts) != 2:
            print("Invalid format. Use: build <building_name>")
            return

        building_name = parts[1]
        if building_name not in BUILDING_SPECS:
            print(f"Unknown building: '{building_name}'. Available: {', '.join(BUILDING_SPECS.keys())}")
            return

        spec = BUILDING_SPECS[building_name]
        cost = spec["cost"]

        if self.colony.materials < cost:
            print(f"Not enough materials. You need {cost}, but only have {self.colony.materials}.")
            return

        self.colony.materials -= cost
        new_building = Building(building_name)
        self.colony.buildings.append(new_building)
        print(f"Successfully built a {building_name}.")
        print(self.colony.get_status())

    def run(self):
        """The main game loop."""
        print("Welcome to Echo Base.")
        print("Your mission is to build a thriving colony.")
        print("Commands: 'status', 'assign <num> <job>', 'unassign <num> <job>', 'build <building>', 'next', 'quit'")
        print(self.colony.get_status())

        while not self.game_over:
            command = input("> ").strip().lower()
            parts = command.split()
            verb = parts[0] if parts else ""

            if verb == "quit":
                print("You have abandoned the colony. Game Over.")
                self.game_over = True
            elif verb == "status":
                print(self.colony.get_status())
            elif verb == "next":
                if not self.colony.next_day():
                    self.game_over = True
                    print("\nYour colony has failed. The silence of space is your only reward.")
                else:
                    print(self.colony.get_status())
            elif verb == "assign":
                self._handle_assign(parts)
            elif verb == "unassign":
                self._handle_unassign(parts)
            elif verb == "build":
                self._handle_build(parts)
            else:
                print(f"Unknown command: '{command}'")


if __name__ == "__main__":
    game = Game()
    game.run()

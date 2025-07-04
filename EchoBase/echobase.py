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

        # Job assignments
        self.jobs = {
            "unassigned": 10,
            "farming": 0,
            "mining": 0,
            "research": 0
        }

    def get_status(self):
        """Returns a formatted string of the colony's current status."""
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
            f"  - Power: {self.power}\n"
            f"  - Building Materials: {self.materials}"
        )
        return status

    def next_day(self):
        """Processes a single day's resource production and consumption."""
        # Production
        food_produced = self.jobs['farming'] * 2
        materials_produced = self.jobs['mining'] * 1
        
        self.food += food_produced
        self.materials += materials_produced

        # Consumption
        self.food -= self.colonists
        self.water -= self.colonists

        self.day += 1
        
        print("\n--- Daily Report ---")
        print(f"Food Produced: {food_produced}")
        print(f"Materials Produced: {materials_produced}")
        
        if self.food < 0 or self.water < 0:
            print("\nCatastrophe! The colony has run out of food or water.")
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
            
        # Re-assign colonists
        self.colony.jobs["unassigned"] -= number
        self.colony.jobs[job] += number
        print(f"Assigned {number} colonists to {job}.")
        print(self.colony.get_status())

    def run(self):
        """The main game loop."""
        print("Welcome to Echo Base.")
        print("Your mission is to build a thriving colony.")
        print("Commands: 'status', 'assign <num> <job>', 'next', 'quit'")
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
            else:
                print(f"Unknown command: '{command}'")


if __name__ == "__main__":
    game = Game()
    game.run()

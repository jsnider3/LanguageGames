"""
AI Captain management command handlers.
"""

import random
from .base import BaseCommandHandler
from ..classes import AICaptain


class CaptainCommands(BaseCommandHandler):
    """Handles all AI captain-related commands."""
    
    def handle_captains(self, parts):
        """Display available AI captains for hire."""
        system = self.get_current_system()
        
        if system.economy_type == "Agricultural":
            print("This agricultural system doesn't have a captains' guild.")
            return
        
        # Generate captains if needed
        if not hasattr(self.game, 'available_captains') or not self.game.available_captains:
            self._generate_captains()
        
        print(f"\n--- {system.name} Captains' Guild ---")
        print("Hire AI captains to automate your ships!")
        print(f"{'#':<3} {'Name':<20} {'Skill':<10} {'Cost':<10} {'Daily':<10}")
        print("-" * 55)
        
        for i, captain in enumerate(self.game.available_captains):
            print(f"{i+1:<3} {captain.name:<20} {captain.skill_level:<10} {captain.hire_cost:<10} {captain.daily_salary:<10}")
        
        print("\nUse 'hirecaptain <number>' to hire a captain.")
        print("Use 'captainstatus' to view your employed captains.")
    
    def handle_hire_captain(self, parts):
        """Hire an AI captain."""
        if not self.validate_command(parts, 2, "hirecaptain <captain number>"):
            return
        
        if not hasattr(self.game, 'available_captains') or not self.game.available_captains:
            print("No captains available. Visit a captains' guild.")
            return
        
        try:
            captain_num = int(parts[1]) - 1
        except ValueError:
            print("Captain number must be a number.")
            return
        
        if captain_num < 0 or captain_num >= len(self.game.available_captains):
            print("Invalid captain number.")
            return
        
        captain = self.game.available_captains[captain_num]
        
        if self.player.credits < captain.hire_cost:
            print(f"Not enough credits. You need {captain.hire_cost}, but only have {self.player.credits}.")
            return
        
        # Hire the captain
        self.player.credits -= captain.hire_cost
        self.player.ai_captains.append(captain)
        self.game.available_captains.remove(captain)
        
        print(f"Hired {captain.name} for {captain.hire_cost} credits!")
        print(f"Daily salary: {captain.daily_salary} credits")
        print("Use 'assigncaptain' to assign them to a ship.")
        
        # Generate new captains
        self._generate_captains()
    
    def handle_assign_captain(self, parts):
        """Assign an AI captain to a ship."""
        if not self.validate_command(parts, 3, "assigncaptain <captain> <ship#>"):
            return
        
        captain_name = parts[1]
        
        # Find captain
        captain = None
        for cap in self.player.ai_captains:
            if cap.name.lower() == captain_name.lower():
                captain = cap
                break
        
        if not captain:
            print(f"No captain named '{captain_name}' found.")
            print("Your captains: " + ", ".join(c.name for c in self.player.ai_captains))
            return
        
        try:
            ship_num = int(parts[2]) - 1
        except ValueError:
            print("Ship number must be a number.")
            return
        
        if ship_num < 0 or ship_num >= len(self.player.ships):
            print(f"Invalid ship number. You have {len(self.player.ships)} ships.")
            return
        
        target_ship = self.player.ships[ship_num]
        
        # Check if captain already assigned
        if captain.ship:
            print(f"{captain.name} is already assigned to a ship.")
            return
        
        # Check if ship already has captain
        for other_cap in self.player.ai_captains:
            if other_cap.ship == target_ship:
                print(f"That ship already has {other_cap.name} as captain.")
                return
        
        # Check if player is using this ship
        if ship_num == self.player.current_ship_index:
            print("You can't assign a captain to the ship you're currently using.")
            return
        
        # Assign captain
        captain.ship = target_ship
        print(f"{captain.name} assigned to {target_ship.name}!")
        print("Use 'setroute' to configure their trade route.")
    
    def handle_set_route(self, parts):
        """Set trade route for an AI captain."""
        if not self.validate_command(parts, 2, "setroute <captain>"):
            return
        
        captain_name = " ".join(parts[1:])
        
        # Find captain
        captain = None
        for cap in self.player.ai_captains:
            if cap.name.lower() == captain_name.lower():
                captain = cap
                break
        
        if not captain:
            print(f"No captain named '{captain_name}' found.")
            return
        
        if not captain.ship:
            print(f"{captain.name} needs to be assigned to a ship first.")
            return
        
        print(f"\n--- Configure Trade Route for {captain.name} ---")
        print("Enter systems in order (empty line to finish):")
        
        route = []
        while True:
            system_name = input(f"System {len(route)+1}: ").strip().title()
            if not system_name:
                break
            
            if system_name not in self.galaxy.systems:
                print(f"Unknown system: {system_name}")
                continue
            
            route.append(system_name)
            
            if len(route) >= 5:
                print("Maximum 5 systems per route.")
                break
        
        if len(route) < 2:
            print("Route must have at least 2 systems.")
            return
        
        # Verify route connectivity
        for i in range(len(route)-1):
            if route[i+1] not in self.galaxy.connections[route[i]]:
                print(f"No connection from {route[i]} to {route[i+1]}!")
                return
        
        captain.trade_route = route
        captain.route_index = 0
        captain.status = "traveling"
        print(f"\nTrade route set: {' -> '.join(route)}")
        print(f"{captain.name} will automatically trade along this route.")
    
    def handle_fire_captain(self, parts):
        """Fire an AI captain."""
        if not self.validate_command(parts, 2, "firecaptain <captain>"):
            return
        
        captain_name = " ".join(parts[1:])
        
        # Find captain
        captain = None
        for cap in self.player.ai_captains:
            if cap.name.lower() == captain_name.lower():
                captain = cap
                break
        
        if not captain:
            print(f"No captain named '{captain_name}' found.")
            return
        
        print(f"Fire {captain.name}? (y/n)")
        if input().strip().lower() != 'y':
            return
        
        # Remove captain
        if captain.ship:
            captain.ship = None
        self.player.ai_captains.remove(captain)
        
        print(f"{captain.name} has been dismissed.")
    
    def handle_captain_status(self, parts):
        """Display status of all AI captains."""
        if not self.player.ai_captains:
            print("You have no AI captains employed.")
            return
        
        print("\n--- AI CAPTAIN STATUS ---")
        total_profit = 0
        
        for captain in self.player.ai_captains:
            print(f"\n{captain.name} (Skill: {captain.skill_level})")
            print(f"   Daily Salary: {captain.daily_salary} credits")
            
            if not captain.ship:
                print("   Status: Unassigned")
            else:
                print(f"   Ship: {captain.ship.name} ({captain.ship.ship_class})")
                print(f"   Location: {captain.ship.current_location}")
                print(f"   Status: {captain.status}")
                
                if captain.trade_route:
                    print(f"   Route: {' -> '.join(captain.trade_route)}")
                    if captain.profit_history:
                        avg_profit = sum(captain.profit_history) / len(captain.profit_history)
                        total_profit += avg_profit
                        print(f"   Average Daily Profit: {avg_profit:.0f} credits")
                else:
                    print("   Route: Not configured")
                
                # Show cargo
                if captain.ship.get_cargo_used() > 0:
                    print("   Cargo:")
                    for good, amount in captain.ship.cargo_hold.items():
                        print(f"     {good}: {amount}")
        
        if total_profit > 0:
            total_salaries = sum(c.daily_salary for c in self.player.ai_captains)
            net_profit = total_profit - total_salaries
            print(f"\nTotal Daily Profit: {total_profit:.0f} credits")
            print(f"Total Daily Salaries: {total_salaries} credits")
            print(f"Net Daily Income: {net_profit:.0f} credits")
    
    def _generate_captains(self):
        """Generate new AI captains for hire."""
        if not hasattr(self.game, 'available_captains'):
            self.game.available_captains = []
        
        # Generate 2-4 captains
        num_captains = random.randint(2, 4) - len(self.game.available_captains)
        
        first_names = [
            "Jack", "Anne", "William", "Mary", "James", "Elizabeth",
            "Charles", "Sarah", "Robert", "Emma", "John", "Grace"
        ]
        
        last_names = [
            "Blackwood", "Stormwind", "Stargazer", "Voidwalker",
            "Nebula", "Cosmos", "Stellaris", "Astrum"
        ]
        
        for _ in range(num_captains):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Skill level affects trading performance
            skill_level = random.randint(1, 5)
            hire_cost = 5000 * skill_level
            daily_salary = 100 * skill_level
            
            captain = AICaptain(name, skill_level, hire_cost, daily_salary)
            self.game.available_captains.append(captain)
"""
Exploration event handlers for Star Trader.

Handles special exploration events like searching for artifacts and derelicts
in uncharted systems.
"""

import random
from typing import TYPE_CHECKING
from .game_data import GOODS

if TYPE_CHECKING:
    from .main import Game


class ExplorationEventHandler:
    """Handles special exploration events in uncharted systems."""
    
    def __init__(self, game: 'Game'):
        """Initialize the exploration event handler.
        
        Args:
            game: The main game instance
        """
        self.game = game
        self.player = game.player
        self.galaxy = game.galaxy
    
    def handle_search(self, parts):
        """Search for special features in the current system."""
        if len(parts) < 2:
            print("Search what? (artifacts, derelicts)")
            return
            
        system = self.player.location
        search_type = parts[1].lower()
        
        if search_type == "artifacts":
            self._search_artifacts(system)
        elif search_type == "derelicts":
            self._search_derelicts(system)
        else:
            print(f"You can't search for '{search_type}' here.")
    
    def _search_artifacts(self, system):
        """Search for artifacts in ancient ruins."""
        if not hasattr(system, 'system_type') or system.system_type != "ancient_ruins":
            print("No artifacts to search for in this system.")
            return
            
        if not hasattr(system, 'artifacts_remaining') or system.artifacts_remaining <= 0:
            print("All artifacts in this system have been recovered.")
            return
            
        print("\n--- ARTIFACT SEARCH ---")
        print("Scanning ancient structures for valuable artifacts...")
        
        # Risk assessment
        danger = getattr(system, 'exploration_danger', 0.5)
        print(f"Danger level: {'Low' if danger < 0.4 else 'Medium' if danger < 0.7 else 'High'}")
        
        choice = input("\nProceed with search? (y/n) > ").lower()
        if choice != 'y':
            print("Search cancelled.")
            return
            
        # Time passes
        self.game.current_day += 1
        self.game._handle_daily_costs()
        
        # Check for danger
        if random.random() < danger:
            print("\nThe ruins are unstable!")
            damage = random.randint(10, 30)
            self.player.ship.hull -= damage
            print(f"Falling debris damages your ship! Hull damage: -{damage}")
            
            if random.random() < 0.5:
                print("You're forced to retreat without finding anything.")
                return
                
        # Search for artifact
        if random.random() < 0.7:  # 70% success rate
            artifact_value = random.randint(1000, 3000)
            self.player.credits += artifact_value
            system.artifacts_remaining -= 1
            
            print(f"\n--- DISCOVERY ---")
            print("You've found an ancient artifact!")
            print(f"Value: {artifact_value} credits")
            
            # Gain experience
            self.player.ship.gain_experience("exploration", 10)
            self.player.gain_skill("piloting", 3)
            
            # Small chance of special discovery
            if random.random() < 0.1:
                print("\nThis artifact contains ancient star charts!")
                print("A new uncharted system location has been revealed.")
                # Mark a random uncharted system as more likely to be found
                # (Would need to implement this feature)
        else:
            print("\nDespite careful searching, you find nothing of value.")
            print("The ancients hid their treasures well.")
    
    def _search_derelicts(self, system):
        """Search derelict ships for salvage."""
        if not hasattr(system, 'system_type') or system.system_type != "derelict_fleet":
            print("No derelict ships to search in this system.")
            return
            
        print("\n--- DERELICT SEARCH ---")
        print("Approaching derelict vessels...")
        
        # Time passes
        self.game.current_day += 1
        self.game._handle_daily_costs()
        
        # Random outcome
        outcome = random.random()
        if outcome < 0.3:
            # Find cargo
            goods = list(GOODS.keys())
            found_good = random.choice(goods)
            quantity = random.randint(5, 20)
            
            if self.player.ship.get_cargo_used() + quantity <= self.player.ship.cargo_capacity:
                self.player.ship.add_cargo(found_good, quantity)
                print(f"\nYou salvage {quantity} units of {found_good}!")
            else:
                print(f"\nYou find {quantity} units of {found_good}, but lack cargo space.")
                
        elif outcome < 0.5:
            # Find credits
            credits = random.randint(500, 1500)
            self.player.credits += credits
            print(f"\nYou recover {credits} credits from the ship's safe!")
            
        elif outcome < 0.7:
            # Find module (rare)
            print("\nYou discover an intact ship module!")
            print("Unfortunately, it's incompatible with your ship's systems.")
            credits = random.randint(1000, 2000)
            self.player.credits += credits
            print(f"You sell it for {credits} credits.")
            
        elif outcome < 0.9:
            # Nothing of value
            print("\nThe ships have been picked clean by previous salvagers.")
            print("You find nothing of value.")
            
        else:
            # Danger!
            print("\nWARNING: Reactor breach detected!")
            if random.random() < 0.6:
                print("You manage to escape before the explosion!")
            else:
                damage = random.randint(20, 40)
                self.player.ship.hull -= damage
                print(f"The explosion damages your ship! Hull damage: -{damage}")
        
        # Always gain some exploration experience
        self.player.ship.gain_experience("exploration", 5)
        self.player.gain_skill("mechanics", 2)
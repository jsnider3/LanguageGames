"""
Mission-related command handlers.
"""

import random
from .base import BaseCommandHandler
from ..classes import Mission


class MissionCommands(BaseCommandHandler):
    """Handles all mission-related commands."""
    
    def handle_missions(self, parts):
        """Display available missions at the current location."""
        system = self.get_current_system()
        
        if not system.available_missions:
            print("No missions available at this location.")
            return
        
        print(f"\n--- Missions Available at {system.name} ---")
        for i, mission in enumerate(system.available_missions):
            print(f"\n{i+1}. {mission.get_description()}")
            print(f"   Reward: {mission.reward_credits} credits, {mission.reward_reputation} reputation")
            print(f"   Time limit: {mission.time_limit} days")
        
        print("\nUse 'accept <number>' to accept a mission.")
    
    def handle_accept(self, parts):
        """Accept a mission."""
        if not self.validate_command(parts, 2, "accept <mission number>"):
            return
        
        try:
            mission_num = int(parts[1]) - 1
        except ValueError:
            print("Mission number must be a number.")
            return
        
        system = self.get_current_system()
        
        if mission_num < 0 or mission_num >= len(system.available_missions):
            print("Invalid mission number.")
            return
        
        mission = system.available_missions[mission_num]
        ship = self.get_current_ship()
        
        # Check cargo space for DELIVER missions
        if mission.type == "DELIVER":
            if ship.get_cargo_used() + mission.quantity > ship.cargo_capacity:
                print(f"Not enough cargo space. You need {mission.quantity} free slots.")
                return
        
        # Accept the mission
        self.player.active_missions.append(mission)
        system.available_missions.remove(mission)
        mission.expiration_day = self.game.current_day + mission.time_limit
        
        # Add cargo for DELIVER missions
        if mission.type == "DELIVER":
            ship.add_cargo(mission.good, mission.quantity)
            print(f"Loaded {mission.quantity} units of {mission.good}.")
        
        print(f"Mission accepted: {mission.get_description()}")
        print(f"Complete by day {mission.expiration_day}.")
    
    def handle_complete(self, parts):
        """Complete a mission at the destination."""
        system = self.get_current_system()
        ship = self.get_current_ship()
        
        # Find completable missions
        completable = []
        for mission in self.player.active_missions:
            if mission.destination_system == system:
                # Check if PROCURE cargo is present
                if mission.type == "PROCURE":
                    if mission.good not in ship.cargo_hold or ship.cargo_hold[mission.good] < mission.quantity:
                        continue
                completable.append(mission)
        
        if not completable:
            print("No missions to complete at this location.")
            return
        
        if len(completable) == 1:
            mission = completable[0]
        else:
            # Multiple missions, let player choose
            print("\n--- Completable Missions ---")
            for i, mission in enumerate(completable):
                print(f"{i+1}. {mission.get_description()} - Reward: {mission.reward_credits} credits")
            
            try:
                choice = int(input("Which mission to complete? ")) - 1
                if choice < 0 or choice >= len(completable):
                    print("Invalid choice.")
                    return
                mission = completable[choice]
            except ValueError:
                print("Invalid input.")
                return
        
        # Remove cargo for DELIVER/PROCURE missions
        if mission.type in ["DELIVER", "PROCURE"] and mission.good:
            ship.remove_cargo(mission.good, mission.quantity)
            print(f"Delivered {mission.quantity} units of {mission.good}.")
        
        # Give rewards
        self.player.credits += mission.reward_credits
        self.player.add_reputation(mission.faction, mission.reward_reputation)
        print(f"Mission completed! Earned {mission.reward_credits} credits and {mission.reward_reputation} reputation.")
        
        # Give experience
        self.player.gain_skill("piloting", 2)
        self.player.give_crew_experience("Navigator", 2)
        
        # Remove completed mission
        self.player.active_missions.remove(mission)
    
    

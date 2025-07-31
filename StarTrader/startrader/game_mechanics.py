"""
Core game mechanics for Star Trader.

Handles daily processing, mission failure checking, crew management,
and other ongoing game state updates.
"""

import random
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from .main import Game
    from .classes import Mission


class GameMechanicsManager:
    """Manages core game mechanics and daily processing."""
    
    def __init__(self, game: 'Game'):
        """Initialize the game mechanics manager.
        
        Args:
            game: The game instance
        """
        self.game = game
    
    def handle_daily_costs(self) -> None:
        """Handles daily costs like crew salaries and other expenses."""
        total_salary = sum(member.salary for member in self.game.player.crew)
        captain_wages = sum(captain.daily_wage for captain in self.game.player.ai_captains)
        total_costs = total_salary + captain_wages
        
        if total_costs > 0:
            print(f"\n--- Daily Costs (Day {self.game.current_day}) ---")
            if total_salary > 0:
                print(f"Crew salaries: {total_salary} credits")
            if captain_wages > 0:
                print(f"AI captain wages: {captain_wages} credits")
            print(f"Total: {total_costs} credits")
            
            self.game.player.credits -= total_costs
            if self.game.player.credits < 0:
                print("You can't afford to pay your crew! They've all quit in disgust.")
                self.game.player.crew = []
                self.game.player.ai_captains = []
                self.game.player.credits = max(0, self.game.player.credits) # Don't go into negative credits from this
            else:
                # Paying crew on time maintains morale
                if self.game.player.crew:
                    self.game.player.adjust_crew_morale(5, "You paid everyone on time")
        
        # Daily morale decay from space travel stress
        if self.game.player.crew:
            # Leadership skill reduces morale decay
            leadership_bonus = self.game.player.get_skill_bonus("leadership")
            morale_decay = max(1, int(2 * (1 - leadership_bonus)))  # Leadership reduces decay
            self.game.player.adjust_crew_morale(-morale_decay, "The stress of space travel takes its toll")
        
        # Process AI captain trades
        if self.game.player.ai_captains:
            captain_reports = self.game.galaxy.process_ai_captain_trades(self.game.player)
            if captain_reports:
                print("\n--- AI Captain Reports ---")
                for report in captain_reports:
                    print(f"- {report}")
                    
        # Process factories
        if self.game.player.factories:
            factory_reports = self.game.galaxy.process_factories(self.game.player)
            if factory_reports:
                print("\n--- Factory Reports ---")
                for report in factory_reports:
                    print(f"- {report}")
            
        # Check for victory
        if self.game.victory_manager.check_victory_conditions(self.game.player, self.game.galaxy):
            self.game.victory_manager.announce_victory()
            
            # Good leaders occasionally boost morale
            leadership_bonus = self.game.player.get_skill_bonus("leadership")
            if leadership_bonus > 0.2 and random.random() < 0.1:  # 10% chance with good leadership
                self.game.player.adjust_crew_morale(5, "Your leadership inspires the crew")
                self.game.player.gain_skill("leadership", 1)
    
    def check_mission_failures(self) -> None:
        """Checks for and handles failed missions."""
        failed_missions = []
        for mission in self.game.player.active_missions:
            if self.game.current_day > mission.expiration_day:
                failed_missions.append(mission)
        
        for mission in failed_missions:
            self.game.player.active_missions.remove(mission)
            # Harsh penalty for failure
            reputation_penalty = mission.reward_reputation * 2
            self.game.player.add_reputation(mission.faction, -reputation_penalty)
            print(f"\n--- MISSION FAILED ---")
            print(f"Mission '{mission.id}' expired on Day {mission.expiration_day}.")
            print(f"Your reputation with {mission.faction} has suffered greatly.")
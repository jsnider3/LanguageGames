"""
Victory conditions system for Star Trader.

Tracks and evaluates multiple victory conditions including economic success,
trade empire building, political influence, exploration, and crew development.
"""

from typing import Optional, Tuple
from .constants import (VICTORY_WEALTH_GOAL, VICTORY_FLEET_GOAL, VICTORY_FACTORY_GOAL,
                       VICTORY_REPUTATION_GOAL, VICTORY_CREW_GOAL, VICTORY_CREW_EXP_GOAL)


class VictoryManager:
    """Manages victory conditions and progress tracking."""
    
    def __init__(self):
        """Initialize the victory manager."""
        self.victory = False
        self.victory_type = None
        self.victory_announced = False
    
    def check_victory_conditions(self, player, galaxy) -> bool:
        """Check if any victory conditions have been met.
        
        Args:
            player: The player instance
            galaxy: The galaxy instance
            
        Returns:
            True if any victory condition is met
        """
        if self.victory:
            return True
            
        # Check each victory condition
        if self._check_economic_victory(player):
            return True
        
        if self._check_trade_empire_victory(player):
            return True
            
        if self._check_political_victory(player):
            return True
            
        if self._check_explorer_victory(player, galaxy):
            return True
            
        if self._check_personal_victory(player):
            return True
            
        return False
    
    def _check_economic_victory(self, player) -> bool:
        """Check if economic victory is achieved.
        
        Args:
            player: The player instance
            
        Returns:
            True if economic victory is achieved
        """
        if player.credits >= VICTORY_WEALTH_GOAL:
            self.victory = True
            self.victory_type = "Economic Victory - Master Trader"
            return True
        return False
    
    def _check_trade_empire_victory(self, player) -> bool:
        """Check if trade empire victory is achieved.
        
        Args:
            player: The player instance
            
        Returns:
            True if trade empire victory is achieved
        """
        if len(player.ships) >= VICTORY_FLEET_GOAL and len(player.factories) >= VICTORY_FACTORY_GOAL:
            self.victory = True
            self.victory_type = "Trade Empire - Merchant Prince"
            return True
        return False
    
    def _check_political_victory(self, player) -> bool:
        """Check if political victory is achieved.
        
        Args:
            player: The player instance
            
        Returns:
            True if political victory is achieved
        """
        faction_count = sum(1 for f in ["Federation", "Syndicate"] 
                          if player.reputation.get(f, 0) >= VICTORY_REPUTATION_GOAL)
        if faction_count >= 2:
            self.victory = True
            self.victory_type = "Political Victory - Galactic Unifier"
            return True
        return False
    
    def _check_explorer_victory(self, player, galaxy) -> bool:
        """Check if explorer victory is achieved.
        
        Args:
            player: The player instance
            galaxy: The galaxy instance
            
        Returns:
            True if explorer victory is achieved
        """
        discovered = sum(1 for s in galaxy.uncharted_systems.values() if s.discovered)
        if (len(player.visited_systems) >= len(galaxy.systems) and 
            discovered >= len(galaxy.uncharted_systems)):
            self.victory = True
            self.victory_type = "Explorer Victory - Master of the Void"
            return True
        return False
    
    def _check_personal_victory(self, player) -> bool:
        """Check if personal victory is achieved.
        
        Args:
            player: The player instance
            
        Returns:
            True if personal victory is achieved
        """
        if (len(player.crew) >= VICTORY_CREW_GOAL and 
            sum(c.experience for c in player.crew) >= VICTORY_CREW_EXP_GOAL):
            self.victory = True
            self.victory_type = "Personal Victory - Legendary Captain"
            return True
        return False
    
    def display_victory_status(self, player, galaxy) -> None:
        """Display victory conditions and current progress.
        
        Args:
            player: The player instance
            galaxy: The galaxy instance
        """
        print("\n--- VICTORY CONDITIONS ---")
        print("Achieve any of these conditions to win the game:")
        print()
        
        # Economic Victory
        self._display_economic_progress(player)
        
        # Trade Empire Victory  
        self._display_trade_empire_progress(player)
        
        # Political Victory
        self._display_political_progress(player)
        
        # Explorer Victory
        self._display_explorer_progress(player, galaxy)
        
        # Personal Victory
        self._display_personal_progress(player)
        
        # Check for any victory
        if self.check_victory_conditions(player, galaxy):
            print("=" * 50)
            print("🎉 CONGRATULATIONS! YOU'VE WON THE GAME! 🎉")
            print(f"Victory Type: {self.victory_type}")
            print("=" * 50)
            print("\nYou can continue playing or start a new game.")
    
    def _display_economic_progress(self, player) -> None:
        """Display economic victory progress.
        
        Args:
            player: The player instance
        """
        credits = player.credits
        print(f"1. ECONOMIC VICTORY - Amass Great Wealth")
        print(f"   Progress: {credits:,} / {VICTORY_WEALTH_GOAL:,} credits ({credits/VICTORY_WEALTH_GOAL*100:.1f}%)")
        if credits >= VICTORY_WEALTH_GOAL:
            print("   ⭐ CONDITION MET!")
        print()
    
    def _display_trade_empire_progress(self, player) -> None:
        """Display trade empire victory progress.
        
        Args:
            player: The player instance
        """
        fleet_size = len(player.ships)
        factories = len(player.factories)
        print(f"2. TRADE EMPIRE - Control Major Trade Operations")
        print(f"   Ships: {fleet_size} / {VICTORY_FLEET_GOAL}")
        print(f"   Factories: {factories} / {VICTORY_FACTORY_GOAL}")
        if fleet_size >= VICTORY_FLEET_GOAL and factories >= VICTORY_FACTORY_GOAL:
            print("   ⭐ CONDITION MET!")
        print()
    
    def _display_political_progress(self, player) -> None:
        """Display political victory progress.
        
        Args:
            player: The player instance
        """
        print(f"3. POLITICAL VICTORY - Unite the Factions")
        max_rep = 0
        faction_count = 0
        for faction in ["Federation", "Syndicate"]:
            rep = player.reputation.get(faction, 0)
            if rep >= VICTORY_REPUTATION_GOAL:
                faction_count += 1
            max_rep = max(max_rep, rep)
        print(f"   Factions at max reputation: {faction_count} / 2")
        print(f"   Highest reputation: {max_rep}")
        if faction_count >= 2:
            print("   ⭐ CONDITION MET!")
        print()
    
    def _display_explorer_progress(self, player, galaxy) -> None:
        """Display explorer victory progress.
        
        Args:
            player: The player instance
            galaxy: The galaxy instance
        """
        discovered = sum(1 for s in galaxy.uncharted_systems.values() if s.discovered)
        total_uncharted = len(galaxy.uncharted_systems)
        systems_visited = len(player.visited_systems)
        total_systems = len(galaxy.systems)
        print(f"4. EXPLORER VICTORY - Discover All Systems") 
        print(f"   Systems visited: {systems_visited} / {total_systems}")
        print(f"   Uncharted discovered: {discovered} / {total_uncharted}")
        if systems_visited >= total_systems and discovered >= total_uncharted:
            print("   ⭐ CONDITION MET!")
        print()
    
    def _display_personal_progress(self, player) -> None:
        """Display personal victory progress.
        
        Args:
            player: The player instance
        """
        crew_size = len(player.crew)
        crew_exp = sum(c.experience for c in player.crew)
        print(f"5. PERSONAL VICTORY - Complete Your Crew's Journey")
        print(f"   Crew members: {crew_size} / {VICTORY_CREW_GOAL}")
        print(f"   Total crew experience: {crew_exp} / {VICTORY_CREW_EXP_GOAL}")
        if crew_size >= VICTORY_CREW_GOAL and crew_exp >= VICTORY_CREW_EXP_GOAL:
            print("   ⭐ CONDITION MET!")
        print()
    
    def announce_victory(self) -> None:
        """Announce victory achievement (called during game loop)."""
        if self.victory and not self.victory_announced:
            self.victory_announced = True
            print("\n" + "=" * 60)
            print("🌟 VICTORY ACHIEVED! 🌟")
            print(f"Victory Type: {self.victory_type}")
            print("=" * 60)
            print("\nCongratulations on your achievement!")
            print("You can continue playing to pursue other victory conditions,")
            print("or use 'quit' to end your triumphant journey.")
    
    def reset(self) -> None:
        """Reset victory state (for new game)."""
        self.victory = False
        self.victory_type = None
        self.victory_announced = False
    
    def to_dict(self) -> dict:
        """Convert victory state to dictionary for saving.
        
        Returns:
            Dictionary containing victory state
        """
        return {
            "victory": self.victory,
            "victory_type": self.victory_type,
            "victory_announced": self.victory_announced
        }
    
    def from_dict(self, data: dict) -> None:
        """Restore victory state from dictionary.
        
        Args:
            data: Dictionary containing victory state
        """
        self.victory = data.get("victory", False)
        self.victory_type = data.get("victory_type", None)
        self.victory_announced = data.get("victory_announced", False)
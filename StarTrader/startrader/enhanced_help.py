"""
Enhanced help system for Star Trader using the command registry.

Provides comprehensive help that integrates with the command system.
"""

from typing import List, Optional, TYPE_CHECKING
from .command_system import CommandRegistry, CommandCategory

if TYPE_CHECKING:
    from .main import Game


class EnhancedHelpSystem:
    """Enhanced help system with command registry integration."""
    
    def __init__(self, command_registry: CommandRegistry):
        """Initialize the enhanced help system.
        
        Args:
            command_registry: The command registry to use
        """
        self.registry = command_registry
        
        # Game mechanics help topics (from original help system)
        self.mechanics_topics = {
            "trading": self._explain_trading,
            "combat": self._explain_combat,
            "skills": self._explain_skills,
            "crew": self._explain_crew,
            "reputation": self._explain_reputation,
            "production": self._explain_production,
            "exploration": self._explain_exploration,
            "wanted": self._explain_wanted,
            "victory": self._explain_victory
        }
    
    def show_help(self, game: 'Game', parts: List[str]) -> None:
        """Show help based on the request.
        
        Args:
            game: The game instance
            parts: Command parts where parts[0] is 'help'
        """
        if len(parts) == 1:
            # General help
            print(self.registry.get_all_help())
            print("\nAdditional Help:")
            print("  help <command>     - Detailed help for a command")
            print("  help <category>    - All commands in a category")
            print("  help mechanics     - Game mechanics explanations")
            
        elif len(parts) == 2:
            topic = parts[1].lower()
            
            # Check if it's a command
            command = self.registry.get_command(topic)
            if command:
                help_text = self.registry.get_help_text(topic)
                if help_text:
                    print(f"\n{help_text}")
                return
                
            # Check if it's a category
            try:
                category = CommandCategory(topic)
                print(self.registry.get_category_help(category))
                return
            except ValueError:
                pass
            
            # Check if it's mechanics
            if topic == "mechanics":
                self._show_mechanics_help([])
                return
                
            # Unknown topic
            print(f"No help available for '{topic}'.")
            print("Use 'help' to see all available commands and topics.")
            
        else:
            # Multi-part help (e.g., "help mechanics trading")
            if parts[1].lower() == "mechanics":
                self._show_mechanics_help(parts[2:])
            else:
                print("Invalid help format. Use 'help' or 'help <topic>'.")
    
    def _show_mechanics_help(self, parts: List[str]) -> None:
        """Show game mechanics help.
        
        Args:
            parts: Additional parts after 'help mechanics'
        """
        if not parts:
            print("\n--- GAME MECHANICS ---")
            print("Use 'help mechanics <topic>' for detailed information.")
            print("\nAvailable topics:")
            for topic in self.mechanics_topics:
                print(f"  - {topic}")
        else:
            topic = parts[0].lower()
            if topic in self.mechanics_topics:
                self.mechanics_topics[topic]()
            else:
                print(f"Unknown mechanics topic: {topic}")
                print(f"Available topics: {', '.join(self.mechanics_topics.keys())}")
    
    # Original mechanics help methods (copied from help_system.py)
    def _explain_trading(self) -> None:
        """Explain trading mechanics."""
        print("\n--- TRADING MECHANICS ---")
        print("\nPrice Calculations:")
        print("  Final Price = Base Price × Economy Modifier × Market Drift × Event Modifiers")
        print("  - Economy modifiers: ±20-100% based on system type")
        print("  - Market drift: Natural price fluctuation")
        print("  - Events: Can multiply prices 2-5x")
        print("\nTrading Bonuses:")
        print("  - Negotiation skill: 1% discount per skill point")
        print("  - Trading ship specialization: 5% bonus per level")
        print("  - Faction reputation: Up to 30% discount at max rank")
        print("  - Crew negotiators: Varies by skill level")
        print("\nMarket Manipulation:")
        print("  - Large trades (>30 units or >30% of market) affect prices")
        print("  - Effects last 10 days and affect neighboring systems")
        print("  - Buying increases prices, selling decreases them")
    
    def _explain_combat(self) -> None:
        """Explain combat mechanics."""
        print("\n--- COMBAT MECHANICS ---")
        print("\nClassic Combat:")
        print("  - Turn-based combat with automatic resolution")
        print("  - Damage = Base weapon damage + Weapons Officer bonus")
        print("  - Shields absorb 100% damage until depleted")
        print("  - Hull reaches 0 = Game Over")
        print("  - Flee chance: 50% base + piloting skill bonus")
        print("\nTactical Combat:")
        print("  - Grid-based positioning on 7x7 battlefield")
        print("  - Movement based on ship speed")
        print("  - Weapon ranges: Short (1), Medium (2), Long (3)")
        print("  - Line of sight required for attacks")
        print("  - Obstacles provide cover")
        print("\nBoarding:")
        print("  - Can board ships below 30% hull when adjacent")
        print("  - Base 60% success chance")
        print("  - Modified by crew morale and leadership skill")
        print("  - Success captures ship intact")
    
    def _explain_skills(self) -> None:
        """Explain skill system."""
        print("\n--- SKILL SYSTEM ---")
        print("\nPlayer Skills:")
        print("  - Skills improve through use (0-100 points)")
        print("  - Every 10 points = 1 skill level")
        print("  - Maximum bonus: 50% at 50 skill points")
        print("\nSkill Types:")
        print("  Piloting:")
        print("    - Improves fuel efficiency")
        print("    - Increases combat evasion")
        print("    - Better flee chance")
        print("  Negotiation:")
        print("    - Better buy/sell prices (1% per point)")
        print("    - Improved mission rewards")
        print("  Mechanics:")
        print("    - Cheaper module installation")
        print("    - Better repair efficiency")
        print("    - Factory production bonuses")
        print("  Leadership:")
        print("    - Reduces crew morale decay")
        print("    - Improves boarding success")
        print("    - Better crew performance")
    
    def _explain_crew(self) -> None:
        """Explain crew mechanics."""
        print("\n--- CREW MECHANICS ---")
        print("\nCrew Attributes:")
        print("  - Morale (0-100): Affects skill effectiveness")
        print("  - Experience: Gained through relevant actions")
        print("  - Salary: Daily cost to maintain crew")
        print("  - Skill Bonus: Base effectiveness in their role")
        print("\nEffectiveness Formula:")
        print("  Bonus = Base × (1 + Experience/100) × (Morale/100)")
        print("\nMorale Management:")
        print("  - Increases: Paying on time (+5), victories, good leadership")
        print("  - Decreases: Space travel stress (-2/day), defeats, danger")
        print("  - Leadership skill reduces morale decay")
        print("\nCrew Roles:")
        print("  - Navigator: Reduces fuel consumption")
        print("  - Weapons Officer: Increases combat damage")
        print("  - Engineer: Improves fuel efficiency")
        print("  - Medic: Reduces crew casualties")
        print("  - Negotiator: Better trade prices")
    
    def _explain_reputation(self) -> None:
        """Explain reputation system."""
        print("\n--- REPUTATION SYSTEM ---")
        print("\nGaining Reputation:")
        print("  - Complete missions for faction (+10-25)")
        print("  - Trade in faction systems (+1 per trade)")
        print("  - Defeat faction enemies (+5-15)")
        print("\nLosing Reputation:")
        print("  - Fail missions (-20)")
        print("  - Trade illegal goods (-5 Federation)")
        print("  - Attack faction ships (-10 to -25)")
        print("\nReputation Benefits:")
        print("  - Better prices at faction stations")
        print("  - Access to exclusive missions")
        print("  - Shipyard discounts")
        print("  - Protection from faction patrols")
        print("\nFaction Ranks:")
        print("  - Each faction has 6 ranks")
        print("  - Higher ranks unlock better benefits")
        print("  - Federation: Military ranks (Recruit to Admiral)")
        print("  - Syndicate: Criminal ranks (Associate to Kingpin)")
    
    def _explain_production(self) -> None:
        """Explain production mechanics."""
        print("\n--- PRODUCTION MECHANICS ---")
        print("\nProduction Basics:")
        print("  - Convert raw materials into refined goods")
        print("  - Requires specific economy types")
        print("  - Takes time to complete (1-5 days)")
        print("\nFactory System:")
        print("  - Build factories to automate production")
        print("  - Factory levels increase efficiency (20% per level)")
        print("  - Operating costs: 50 credits × level per day")
        print("  - Can hire managers for full automation")
        print("\nProduction Chains:")
        print("  Food + Water → Rations (Agricultural)")
        print("  Minerals + Energy → Alloys (Industrial)")
        print("  Electronics + Alloys → Components (Tech)")
        print("  Chemicals + Organics → Medicine (Research)")
        print("\nProfitability:")
        print("  - Base profit margins: 20-50%")
        print("  - Higher with factory efficiency")
        print("  - Best with vertical integration")
    
    def _explain_exploration(self) -> None:
        """Explain exploration mechanics."""
        print("\n--- EXPLORATION MECHANICS ---")
        print("\nDeep Space Exploration:")
        print("  - Use 'explore' command (costs 20 fuel)")
        print("  - Base 30% chance to find uncharted systems")
        print("  - +10% in frontier systems")
        print("  - +15% with Explorer ship class")
        print("  - +5% per 10 exploration experience")
        print("\nUncharted Systems:")
        print("  - Start with limited markets")
        print("  - May contain special features:")
        print("    - Ancient ruins (artifacts)")
        print("    - Derelict ships (salvage)")
        print("    - Resource deposits (mining)")
        print("    - Pirate bases (danger!)")
        print("\nScanning:")
        print("  - Use 'scan' to search current system")
        print("  - Reveals hidden features")
        print("  - Costs 1 day but no fuel")
        print("  - May trigger events")
    
    def _explain_wanted(self) -> None:
        """Explain wanted system."""
        print("\n--- WANTED SYSTEM ---")
        print("\nWanted Levels (0-5 stars):")
        print("  - 1-2 stars: Increased customs inspections")
        print("  - 3+ stars: Bounty hunters pursue you")
        print("  - 4+ stars: Faction patrols attack on sight")
        print("  - 5 stars: Elite hunters, massive bounties")
        print("\nGaining Wanted Status:")
        print("  - Smuggling illegal goods")
        print("  - Attacking civilian ships")
        print("  - Failing certain missions")
        print("  - Piracy and theft")
        print("\nClearing Wanted Status:")
        print("  - Pay underground contacts (expensive)")
        print("  - Complete amnesty missions")
        print("  - Time (very slow decay)")
        print("  - Only in Syndicate/Independent systems")
        print("\nConsequences:")
        print("  - Harder to trade legally")
        print("  - Constant combat threats")
        print("  - Some systems become inaccessible")
    
    def _explain_victory(self) -> None:
        """Explain victory conditions."""
        print("\n--- VICTORY CONDITIONS ---")
        print("\nYou can win the game by achieving any of these:")
        print("\n1. Economic Victory:")
        print("   - Accumulate 1,000,000 credits")
        print("   - Pure wealth through trading")
        print("\n2. Trade Empire:")
        print("   - Own 5 ships AND 3 factories")
        print("   - Build a commercial empire")
        print("\n3. Political Victory:")
        print("   - Reach maximum reputation (200) with both major factions")
        print("   - Become a unifying force")
        print("\n4. Explorer Victory:")
        print("   - Visit every system")
        print("   - Discover all uncharted systems")
        print("\n5. Personal Victory:")
        print("   - Have 5 veteran crew members")
        print("   - Total crew experience ≥ 50")
        print("\nAfter victory, you can continue playing!")
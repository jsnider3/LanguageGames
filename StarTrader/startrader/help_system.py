"""
Help system for Star Trader.

Provides command documentation, game mechanics explanations, and
general guidance for players.
"""

from typing import Dict, List, Optional


class HelpSystem:
    """Manages the help and documentation system."""
    
    def __init__(self):
        """Initialize the help system with command documentation."""
        self.command_categories = {
            "Navigation": ["travel", "map"],
            "Trading": ["trade", "buy", "sell", "cargo", "blackmarket"],
            "Missions": ["missions", "accept", "complete"],
            "Ship Management": ["status", "shipyard", "repair", "upgrade", "refuel", 
                               "fleet", "switchship", "renameship", "buyship", "sellmodule"],
            "Crew Management": ["recruits", "hire", "crew", "fire"],
            "AI Captains": ["captains", "hirecaptain", "assigncaptain", "setroute", 
                           "firecaptain", "captainstatus"],
            "Exploration": ["explore", "scan", "search"],
            "Analysis": ["analyze", "traderoute"],
            "Production": ["produce", "recipes"],
            "Factories": ["buildfactory", "factories", "factorysupply", "factorycollect", 
                         "factoryupgrade", "hirefactorymanager"],
            "Crime": ["clearwanted"],
            "Game": ["save", "load", "new", "news", "encyclopedia", "victory", "quit"]
        }
        
        self.command_help = {
            # Navigation
            "travel": "travel <system_name> - Travel to a connected star system. Consumes fuel based on distance.",
            "map": "map - Shows the galactic map with all systems and connections.",
            
            # Trading
            "trade": "trade - Shows the current system's market prices and quantities.",
            "buy": "buy <good> <quantity> - Purchase goods from the market.",
            "sell": "sell <good> <quantity> - Sell goods to the market.",
            "cargo": "cargo - Shows your current cargo hold contents.",
            "blackmarket": "blackmarket - Access illegal goods (if available in system).",
            
            # Missions
            "missions": "missions - List available missions in the current system.",
            "accept": "accept <mission_id|number> - Accept a mission by ID or list number.",
            "complete": "complete <mission_id> - Complete an active mission.",
            
            # Ship Management
            "status": "status - Shows complete information about your ship, crew, and location.",
            "shipyard": "shipyard - Access ship repairs, upgrades, and purchases (if available).",
            "repair": "repair - Repair hull damage at the shipyard.",
            "upgrade": "upgrade <module_id> - Install a new module on your ship.",
            "refuel": "refuel - Refill your fuel tanks at the current system.",
            "fleet": "fleet - View all ships in your fleet.",
            "switchship": "switchship <ship_id> - Switch to a different ship in your fleet.",
            "renameship": "renameship <new_name> - Rename your current ship.",
            "buyship": "buyship <ship_class> - Purchase a new ship at the shipyard.",
            "sellmodule": "sellmodule <module_id> - Sell an installed module for credits.",
            
            # Crew Management
            "recruits": "recruits - View available crew members for hire.",
            "hire": "hire <name|number> - Hire a crew member by name or list number.",
            "crew": "crew - View your current crew members.",
            "fire": "fire <name> - Dismiss a crew member.",
            
            # AI Captains
            "captains": "captains - View AI captains available for hire (Sol only).",
            "hirecaptain": "hirecaptain <number> - Hire an AI captain.",
            "assigncaptain": "assigncaptain <captain_name> <ship_id> - Assign captain to ship.",
            "setroute": "setroute <captain_name> <system1> <system2> ... - Set trade route.",
            "firecaptain": "firecaptain <captain_name> - Dismiss an AI captain.",
            "captainstatus": "captainstatus - View status of all your AI captains.",
            
            # Exploration
            "explore": "explore - Search deep space for uncharted systems (costs 20 fuel).",
            "scan": "scan - Scan current system for special features and nearby anomalies.",
            "search": "search <artifacts|derelicts> - Search for valuables in special systems.",
            
            # Analysis
            "analyze": "analyze <markets|good <name>|routes> - Analyze market data and trade opportunities.",
            "traderoute": "traderoute <plan|auto> - Plan optimal routes or execute automated trading.",
            
            # Production
            "produce": "produce <product> - Produce goods from raw materials.",
            "recipes": "recipes - View available production recipes in current system.",
            
            # Factories
            "buildfactory": "buildfactory <product> [level] - Build a production factory in current system.",
            "factories": "factories - View all your factories and their status.",
            "factorysupply": "factorysupply <factory_id> <good> <quantity> - Supply raw materials to factory.",
            "factorycollect": "factorycollect <factory_id> [quantity] - Collect produced goods from factory.",
            "factoryupgrade": "factoryupgrade <factory_id> - Upgrade factory to increase efficiency.",
            "hirefactorymanager": "hirefactorymanager <factory_id> - Hire manager for automated production.",
            
            # Game System
            "save": "save - Save your game progress.",
            "load": "load - Load a previously saved game.",
            "new": "new - Start a new game (overwrites current save).",
            "news": "news - View galactic news and events.",
            "clearwanted": "clearwanted - Pay underground contacts to clear wanted status (Syndicate/Independent systems only).",
            "encyclopedia": "encyclopedia <category> [item] - Access in-game information (alias: wiki).",
            "victory": "victory - View victory conditions and current progress (alias: goals).",
            "quit": "quit - Exit the game."
        }
        
        # Game mechanics explanations
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
    
    def show_help(self, parts: List[str]) -> None:
        """Show general help or help for a specific command.
        
        Args:
            parts: Command parts, where parts[0] is 'help'
        """
        if len(parts) == 1:
            self._show_general_help()
        else:
            command = parts[1].lower()
            if command == "mechanics":
                self._show_mechanics_help(parts[2:] if len(parts) > 2 else [])
            else:
                self._show_command_help(command)
    
    def _show_general_help(self) -> None:
        """Show general help with command categories."""
        print("\n--- Star Trader Help ---")
        print("Use 'help <command>' for detailed information about a specific command.")
        print("Use 'help mechanics [topic]' for game mechanics explanations.")
        print("\nAvailable commands:")
        
        for category, commands in self.command_categories.items():
            print(f"\n{category}:")
            print(f"  {', '.join(commands)}")
        
        print("\nMechanics topics: trading, combat, skills, crew, reputation, production, exploration, wanted, victory")
    
    def _show_command_help(self, command: str) -> None:
        """Show help for a specific command.
        
        Args:
            command: The command to show help for
        """
        if command in self.command_help:
            print(f"\n{command}: {self.command_help[command]}")
        else:
            print(f"No help available for '{command}'. Use 'help' to see all commands.")
    
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
    
    def get_command_list(self) -> List[str]:
        """Get a flat list of all commands.
        
        Returns:
            List of all command names
        """
        commands = []
        for category_commands in self.command_categories.values():
            commands.extend(category_commands)
        return commands
    
    def get_command_help_text(self, command: str) -> Optional[str]:
        """Get help text for a specific command.
        
        Args:
            command: The command name
            
        Returns:
            Help text or None if not found
        """
        return self.command_help.get(command)
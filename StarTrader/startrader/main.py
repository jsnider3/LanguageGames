"""
Main game controller for Star Trader.

This module contains the core Game class that manages the entire game state,
command processing, and coordination between all game systems. It provides
a modular architecture where different aspects of gameplay are handled by
specialized manager classes.

The game features:
- Space trading and economic simulation
- Mission system with various objectives
- Crew management and skills
- Ship customization and upgrades
- Tactical combat system
- Factory construction and management
- Multiple victory conditions
- Rich galaxy with events and factions
"""

import time
import random
from .classes import Player, Ship, Mission, CrewMember, AICaptain, Factory
from .galaxy import Galaxy
from .event_system import EventManager as NewEventManager
from .game_data import (FACTIONS, ILLEGAL_GOODS, MODULE_SPECS, SHIP_CLASSES, GOODS)
from .constants import (TRADING_SHIP_BONUS_PER_LEVEL, REPUTATION_DISCOUNT_THRESHOLD,
                       REPAIR_COST_PER_HP, FUEL_COST_PER_UNIT, EVENT_CHANCE,
                       PRICE_IMPACT_FACTOR, QUANTITY_IMPACT_DIVISOR)
from .commands.trading import TradingCommands
from .commands.navigation import NavigationCommands
from .commands.ship import ShipCommands
from .commands.missions import MissionCommands
from .commands.crew import CrewCommands
from .commands.factory import FactoryCommands
from .commands.captains import CaptainCommands
from .analysis import TradeAnalyzer
from .persistence import SaveLoadManager
from .victory import VictoryManager
from .help_system import HelpSystem
from .exploration_events import ExplorationEventHandler
from .encyclopedia import Encyclopedia
from .production import ProductionManager
from .ui import UIManager
from .game_mechanics import GameMechanicsManager

# --- Game Balance Constants ---
# Most constants moved to constants.py
CONSTANTS = {
    "REPAIR_COST_PER_HP": REPAIR_COST_PER_HP,
    "FUEL_COST_PER_UNIT": FUEL_COST_PER_UNIT,
    "EVENT_CHANCE": EVENT_CHANCE,
    "REPUTATION_DISCOUNT_THRESHOLD": REPUTATION_DISCOUNT_THRESHOLD,
    "PRICE_IMPACT_FACTOR": PRICE_IMPACT_FACTOR,
    "QUANTITY_IMPACT_DIVISOR": QUANTITY_IMPACT_DIVISOR,
    "SAVE_FILE_NAME": "savegame.json"
}

class Game:
    """
    Main game controller for Star Trader.
    
    Manages the game state, player actions, command processing, and game systems.
    Coordinates between various managers like trading, navigation, missions, etc.
    
    Attributes:
        player: The player character and their ship
        galaxy: The game world with systems, markets, and connections
        event_manager: Handles travel and exploration events
        current_day: Current in-game day counter
        game_over: Flag indicating if the game has ended
        
    The Game class uses a modular architecture with specialized managers:
    - TradingCommands: Buy/sell goods, market interactions
    - NavigationCommands: Travel between systems
    - ShipCommands: Ship upgrades, repairs, refueling
    - MissionCommands: Mission acceptance and completion
    - CrewCommands: Crew hiring and management
    - FactoryCommands: Factory construction and management
    - CaptainCommands: AI captain management
    - TradeAnalyzer: Market analysis and route planning
    - VictoryManager: Victory condition checking
    - HelpSystem: In-game help and documentation
    """
    def __init__(self):
        """Initialize a new game instance.
        
        Creates the player, galaxy, and all game systems. Sets up the player
        in the Sol system and initializes all command handlers and managers.
        """
        self.player = Player()
        self.galaxy = Galaxy()
        self.event_manager = NewEventManager(self)
        self.game_over = False
        self.player.location = self.galaxy.systems["Sol"]
        self.current_day = 1
        self.constants = CONSTANTS
        
        # Initialize command handlers
        self.trading_commands = TradingCommands(self)
        self.navigation_commands = NavigationCommands(self)
        self.ship_commands = ShipCommands(self)
        self.mission_commands = MissionCommands(self)
        self.crew_commands = CrewCommands(self)
        self.factory_commands = FactoryCommands(self)
        self.captain_commands = CaptainCommands(self)
        
        # Initialize trade analyzer
        self.trade_analyzer = TradeAnalyzer(self.galaxy, self.player)
        
        # Initialize save/load manager
        self.save_load_manager = SaveLoadManager(self.constants['SAVE_FILE_NAME'])
        
        # Initialize victory manager
        self.victory_manager = VictoryManager()
        
        # Initialize help system
        self.help_system = HelpSystem()
        
        # Initialize exploration event handler
        self.exploration_handler = ExplorationEventHandler(self)
        
        # Initialize encyclopedia
        self.encyclopedia = Encyclopedia()
        
        # Initialize production manager
        self.production_manager = ProductionManager(self)
        
        # Initialize UI manager
        self.ui_manager = UIManager(self)
        
        # Initialize game mechanics manager
        self.mechanics_manager = GameMechanicsManager(self)
        
        # Initialize commands dictionary
        self._setup_commands()

    def validate_command(self, parts, min_args, usage_msg):
        """Validate command has minimum arguments. Returns True if valid."""
        if len(parts) < min_args:
            print(f"Invalid format. Use: {usage_msg}")
            return False
        return True

    def calculate_trade_bonus(self):
        """Calculate total trading bonus from crew, skills, and ship."""
        negotiator_bonus = self.player.get_crew_bonus("Negotiator")
        skill_bonus = self.player.get_skill_bonus("negotiation")
        
        # Ship trading specialization
        ship = self.player.ship
        ship_bonus = 0
        if ship.specialization == "trading":
            ship_bonus = (ship.level - 1) * TRADING_SHIP_BONUS_PER_LEVEL
            
        return negotiator_bonus + skill_bonus + ship_bonus

    def get_status(self):
        """Get the player's status display."""
        return self.ui_manager.get_status()

    def _handle_status(self, parts):
        """Prints the player's status."""
        self.ui_manager.display_status()

    def _handle_daily_costs(self):
        """Handles daily costs like crew salaries."""
        self.mechanics_manager.handle_daily_costs()

    def _setup_commands(self):
        """Setup command handlers dictionary."""
        self.commands = {
            # Game system commands
            "status": self._handle_status,
            "save": self._handle_save,
            "load": self._handle_load,
            "new": self._handle_new,
            "news": self._handle_news,
            "help": self._handle_help,
            "clearwanted": self._handle_clear_wanted,
            "combat": self._handle_tactical_combat,  # For testing/demo
            "encyclopedia": self._handle_encyclopedia,
            "wiki": self._handle_encyclopedia,  # Alias
            "victory": self._handle_victory,
            "goals": self._handle_victory,  # Alias
            "quit": self.quit_game,
            
            # Trading commands (from module)
            "trade": self.trading_commands.handle_trade,
            "buy": self.trading_commands.handle_buy,
            "sell": self.trading_commands.handle_sell,
            "blackmarket": self.trading_commands.handle_blackmarket,
            
            # Navigation commands (from module)
            "travel": self.navigation_commands.handle_travel,
            "map": self.navigation_commands.handle_map,
            "explore": self.navigation_commands.handle_explore,
            "scan": self.navigation_commands.handle_scan,
            
            # Ship commands (from module)
            "shipyard": self.ship_commands.handle_shipyard,
            "repair": self.ship_commands.handle_repair,
            "upgrade": self.ship_commands.handle_upgrade,
            "refuel": self.ship_commands.handle_refuel,
            "buyship": self.ship_commands.handle_buy_ship,
            "sellmodule": self.ship_commands.handle_sell_module,
            "fleet": self.ship_commands.handle_fleet,
            "switchship": self.ship_commands.handle_switch_ship,
            "renameship": self.ship_commands.handle_rename_ship,
            
            # Mission commands (from module)
            "missions": self.mission_commands.handle_missions,
            "accept": self.mission_commands.handle_accept,
            "complete": self.mission_commands.handle_complete,
            
            # Crew commands (from module)
            "recruits": self.crew_commands.handle_recruits,
            "hire": self.crew_commands.handle_hire,
            "crew": self.crew_commands.handle_crew,
            "fire": self.crew_commands.handle_fire,
            
            # Production commands (still in main)
            "produce": self._handle_produce,
            "recipes": self._handle_recipes,
            
            # AI Captain commands (from module)
            "captains": self.captain_commands.handle_captains,
            "hirecaptain": self.captain_commands.handle_hire_captain,
            "assigncaptain": self.captain_commands.handle_assign_captain,
            "setroute": self.captain_commands.handle_set_route,
            "firecaptain": self.captain_commands.handle_fire_captain,
            "captainstatus": self.captain_commands.handle_captain_status,
            
            # Factory commands (from module)
            "buildfactory": self.factory_commands.handle_build_factory,
            "factories": self.factory_commands.handle_factories,
            "factorysupply": self.factory_commands.handle_factory_supply,
            "factorycollect": self.factory_commands.handle_factory_collect,
            "factoryupgrade": self.factory_commands.handle_factory_upgrade,
            "hirefactorymanager": self.factory_commands.handle_hire_factory_manager,
            "factorymanager": self.factory_commands.handle_factory_manager,
            
            # Analysis commands (still in main)
            "cargo": self._handle_cargo,
            "search": self._handle_search,
            "analyze": self._handle_analyze,
            "traderoute": self._handle_trade_route,
        }
    
    def run(self):
        """The main game loop."""
        print("Welcome to Star Trader!")
        print("Your goal is to make a fortune trading between the stars.")
        
        print(f"Commands: {', '.join(self.commands.keys())}")
        
        if self.save_load_manager.save_exists():
            print("Save file found. Use 'load' to continue or 'new' to start a new game.")
        else:
            self._handle_status(None) # Initial status

        while not self.game_over:
            command = input("> ").strip().lower()
            parts = command.split()
            verb = parts[0] if parts else ""
            
            handler = self.commands.get(verb)
            if handler:
                handler(parts)
            else:
                print(f"Unknown command: '{command}'")
        
        print("You have retired from your life as a trader. Farewell.")

    def _handle_news(self, parts):
        """Displays galactic news and events."""
        print(f"\n--- Galactic News Network (GNN) - Day {self.current_day} ---")
        
        news_items = 0
        
        # Faction relations
        factions = [f for f in FACTIONS.keys() if f != "Independent"]
        print("\n-- Faction Relations --")
        for faction1 in factions:
            for faction2 in factions:
                if faction1 < faction2:  # Avoid duplicates
                    status = self.galaxy.get_faction_relation_status(faction1, faction2)
                    value = self.galaxy.faction_relations[faction1][faction2]
                    print(f"  {faction1} ↔ {faction2}: {status} ({value:+d})")
        news_items += 1
        
        # Report on galactic events
        if self.galaxy.galactic_events:
            print("\n-- Major Galactic Events --")
            for event in self.galaxy.galactic_events.values():
                print(f"  - {event['description']} (Day {event['duration']} remaining)")
                news_items += 1
        
        # Report on active economic events
        if self.galaxy.active_events:
            print("\n-- Economic Events --")
            for system_name, event in self.galaxy.active_events.items():
                if event["type"] == "famine":
                    print(f"  - URGENT: A severe famine continues in the {system_name} system. Demand for Food is critical.")
                elif event["type"] == "mining_strike":
                    print(f"  - BUSINESS: A labor strike in the {system_name} system has halted mineral production.")
                elif event["type"] == "bountiful_harvest":
                    print(f"  - BUSINESS: A bountiful harvest in the {system_name} system has led to a surplus of Food.")
                elif event["type"] == "mining_boom":
                    print(f"  - BUSINESS: A mineral boom in the {system_name} system has flooded the market.")
                news_items += 1
        
        # Report on available bounty missions across the galaxy
        bounties = []
        for system in self.galaxy.systems.values():
            for mission in system.available_missions:
                if mission.type == "BOUNTY":
                    bounties.append(mission)
                    
        if bounties:
            print("\n-- Bounties Posted --")
            for bounty in bounties:
                print(f"  - WANTED: The pirate {bounty.target_name} is wanted by the {bounty.faction}. Last seen near {bounty.destination_system.name}.")
            news_items += len(bounties)
            
        if news_items == 0:
            print("\nNo major news to report across the galaxy.")

    def _handle_recipes(self, parts):
        """Shows available production recipes at the current location."""
        self.production_manager.show_recipes()

    def _handle_produce(self, parts):
        """Handles production of goods from recipes."""
        if len(parts) < 2:
            print("Invalid format. Use: produce <product>")
            return
            
        product_name = " ".join(parts[1:]).title()
        self.production_manager.produce_good(product_name)

    def _handle_new(self, parts):
        """Starts a new game, overwriting any existing save."""
        self.__init__()
        print("Started a new game.")
        self._handle_status(None)

    def _handle_save(self, parts):
        """Saves the current game state to a file."""
        self.save_load_manager.save_game(self)

    def _handle_load(self, parts):
        """Loads the game state from a file."""
        if self.save_load_manager.load_game(self):
            self._handle_status(None)

    def check_mission_failure(self):
        """Checks for and handles failed missions."""
        self.mechanics_manager.check_mission_failures()

    def _handle_cargo(self, parts):
        """Shows just the cargo hold contents."""
        ship = self.player.ship
        print(f"\n--- Cargo Hold ({ship.get_cargo_used()}/{ship.cargo_capacity}) ---")
        if ship.cargo_hold:
            for good, quantity in sorted(ship.cargo_hold.items()):
                print(f"  {good}: {quantity}")
        else:
            print("  Empty")
    
    def _handle_clear_wanted(self, parts):
        """Pay to clear wanted status through underground contacts."""
        if self.player.get_total_wanted_level() == 0:
            print("You're not wanted by anyone.")
            return
            
        # Only available in Syndicate or Independent systems
        if self.player.location.faction == "Federation":
            print("No underground contacts available in Federation space.")
            print("Try a Syndicate or Independent system.")
            return
            
        print("\n--- UNDERGROUND CONTACT ---")
        print("A shady figure approaches you in a dark corner of the station...")
        print("\"I can make your problems... disappear. For a price.\"")
        print()
        
        # Show current wanted status
        if self.player.wanted_level > 0:
            print(f"Global Wanted Level: {'★' * self.player.wanted_level}")
        
        for faction, level in self.player.wanted_by.items():
            print(f"{faction} Wanted Level: {'★' * level}")
        
        # Calculate costs
        print("\nClearing Options:")
        options = []
        
        if self.player.wanted_level > 0:
            cost = self.player.wanted_level * 3000
            # Syndicate rank gives discount
            if self.player.location.faction == "Syndicate":
                benefits = self.player.get_rank_benefits("Syndicate")
                if "black_market_discount" in benefits:
                    cost = int(cost * (1 - benefits["black_market_discount"]))
            options.append(("global", cost, f"Clear global wanted status: {cost} credits"))
            
        for faction, level in self.player.wanted_by.items():
            cost = level * 2500
            # Syndicate rank gives discount
            if self.player.location.faction == "Syndicate":
                benefits = self.player.get_rank_benefits("Syndicate")
                if "black_market_discount" in benefits:
                    cost = int(cost * (1 - benefits["black_market_discount"]))
            options.append((faction, cost, f"Clear {faction} wanted status: {cost} credits"))
        
        # Display options
        for i, (target, cost, desc) in enumerate(options):
            print(f"{i+1}. {desc}")
        print(f"{len(options)+1}. Never mind")
        
        choice = input("\nYour choice: ").strip()
        
        try:
            choice_idx = int(choice) - 1
            if choice_idx == len(options):
                print("You decide to keep your wanted status for now.")
                return
                
            if 0 <= choice_idx < len(options):
                target, cost, _ = options[choice_idx]
                
                if self.player.credits >= cost:
                    self.player.credits -= cost
                    
                    if target == "global":
                        self.player.wanted_level = 0
                        print("\nThe contact makes a few calls...")
                        print("\"It's done. Your record has been... cleaned.\"")
                        print("Your global wanted status has been cleared!")
                    else:
                        level = self.player.wanted_by[target]
                        self.player.decrease_wanted_level(target, level)
                        print(f"\nThe contact taps into the {target} database...")
                        print("\"Consider yourself a ghost in their system.\"")
                        print(f"Your wanted status with {target} has been cleared!")
                        
                    # Gain some Syndicate reputation for using their services
                    if self.player.location.faction == "Syndicate":
                        self.player.add_reputation("Syndicate", 5)
                else:
                    print(f"\nYou need {cost} credits but only have {self.player.credits}.")
                    print("\"Come back when you have the money.\"")
            else:
                print("Invalid choice.")
        except ValueError:
            print("Invalid choice.")
    
    
    def _handle_search(self, parts):
        """Search for special features in the current system."""
        self.exploration_handler.handle_search(parts)
    
    def _handle_analyze(self, parts):
        """Analyze market data across connected systems."""
        if len(parts) < 2:
            print("Analyze what? (markets, good <name>, routes)")
            return
            
        analysis_type = parts[1].lower()
        
        if analysis_type == "markets":
            self.trade_analyzer.analyze_markets()
        elif analysis_type == "good" and len(parts) > 2:
            good_name = " ".join(parts[2:]).title()
            self.trade_analyzer.analyze_good(good_name)
        elif analysis_type == "routes":
            self.trade_analyzer.analyze_trade_routes()
        else:
            print("Unknown analysis type. Use: analyze markets, analyze good <name>, or analyze routes")
    
    def _handle_trade_route(self, parts):
        """Plan or execute automated trade routes."""
        if len(parts) < 2:
            print("Usage: traderoute plan - Plan optimal routes")
            print("       traderoute auto - Start automated trading (requires AI captain)")
            return
            
        action = parts[1].lower()
        
        if action == "plan":
            self.trade_analyzer.plan_trade_route()
        elif action == "auto":
            self.trade_analyzer.auto_trade()
        else:
            print("Unknown traderoute command.")
    
    def _handle_encyclopedia(self, parts):
        """In-game encyclopedia with information about the game world."""
        self.encyclopedia.handle_query(parts)
    
    def _handle_help(self, parts):
        """Shows help for commands."""
        self.help_system.show_help(parts)
    
    def _handle_victory(self, parts):
        """Display victory conditions and current progress."""
        self.victory_manager.display_victory_status(self.player, self.galaxy)

    def _handle_tactical_combat(self, parts):
        """Initiate tactical combat (for testing/demonstration)."""
        print("\n--- TACTICAL COMBAT SIMULATION ---")
        print("This will start a tactical combat encounter for testing.")
        
        from .combat import TacticalCombat, WeaponRange
        
        # Create enemy configuration
        enemy_configs = []
        
        if len(parts) > 1 and parts[1] == "multi":
            # Multiple enemies for more interesting combat
            enemy_configs = [
                {
                    "name": "Pirate Leader",
                    "type": "pirate",
                    "hull": 60,
                    "shield": 30,
                    "damage": 20,
                    "range": WeaponRange.LONG,
                    "speed": 2,
                    "evasion": 15
                },
                {
                    "name": "Pirate Wingman",
                    "type": "pirate", 
                    "hull": 40,
                    "shield": 10,
                    "damage": 15,
                    "range": WeaponRange.SHORT,
                    "speed": 3,
                    "evasion": 20
                }
            ]
        else:
            # Single enemy
            enemy_configs = [{
                "name": "Pirate Raider",
                "type": "pirate",
                "hull": 50,
                "shield": 20,
                "damage": 15,
                "range": WeaponRange.MEDIUM,
                "speed": 2,
                "evasion": 10
            }]
        
        # Run tactical combat
        combat = TacticalCombat(self.player.ship, enemy_configs, self)
        result = combat.run()
        
        if result == "victory":
            print("\nVictory in tactical combat!")
            # Apply damage taken
            self.player.ship.hull = combat.player.hull
            # Rewards
            credits = random.randint(300, 600) * len(enemy_configs)
            self.player.credits += credits
            print(f"You earned {credits} credits from salvage.")
            
            # Experience
            self.player.give_crew_experience("Weapons Officer", 3 * len(enemy_configs))
            self.player.ship.gain_experience("combat", 10)
            self.player.gain_skill("leadership", 2)
        else:
            print("\nDefeat in tactical combat...")
            self.game_over = True

    def quit_game(self, parts):
        """Sets the game_over flag to True."""
        self.game_over = True

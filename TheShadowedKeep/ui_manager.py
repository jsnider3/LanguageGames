"""
UI Manager for The Shadowed Keep.
Handles all display and user interaction logic.
"""
from typing import List
from dungeon_map import Direction
from input_handler import input_handler
from visual_effects import visual_fx, Colors, ASCIIArt
from tutorial_system import tutorial_manager


class UIManager:
    """Manages all user interface and display functionality."""
    
    def __init__(self, game):
        self.game = game
        
    def display_map(self):
        """Display the dungeon map without legend."""
        map_lines = self.game.dungeon_map.render()
        
        # Add simple border
        if map_lines:
            width = max(len(line) for line in map_lines)
            border = "=" * (width + 4)
            
            print("\n" + border)
            print("| " + "MAP".center(width) + " |")
            print(border)
            
            for line in map_lines:
                print("| " + line.ljust(width) + " |")
            print(border)
        
    def display_map_with_legend(self):
        """Display the dungeon map with legend."""
        print("\n" + "\n".join(self.game.dungeon_map.render_with_legend()))
        
    def display_legend(self):
        """Display just the map legend."""
        print("\n=== MAP LEGEND ===")
        print("@ - You are here")
        print("? - Unexplored room") 
        print(". - Empty room")
        print("M/X - Monster/Cleared")
        print("$/x - Treasure/Looted") 
        print("E/x - Equipment/Taken")
        print("S - Merchant Shop")
        print("~ - Healing Fountain")
        print("! - Trap (dangerous!)")
        print("B - Boss (very dangerous!)")
        print("> - Stairs to next floor")
        
    def show_stats(self):
        """Display player stats with visual enhancements."""
        visual_fx.print_colored("\n=== PLAYER STATS ===", Colors.BRIGHT_CYAN, bold=True)
        
        # Name and class with colors
        visual_fx.print_colored(f"Name: {self.game.player.name}", Colors.BRIGHT_WHITE, bold=True)
        visual_fx.print_colored(f"Class: {self.game.player.character_class.name}", Colors.BRIGHT_BLUE)
        visual_fx.print_colored(f"Level: {self.game.player.level}", Colors.BRIGHT_YELLOW)
        
        # XP progress bar
        xp_progress = visual_fx.progress_bar(self.game.player.xp, self.game.player.xp_to_next_level, color=Colors.BRIGHT_MAGENTA)
        visual_fx.print_colored(f"XP: {xp_progress}", Colors.WHITE)
        
        # Health bar
        hp_bar = visual_fx.health_bar(self.game.player.hp, self.game.player.max_hp)
        visual_fx.print_colored(f"HP: {hp_bar}", Colors.WHITE)
        
        # Combat stats
        visual_fx.print_colored(f"Attack Power: {self.game.player.attack_power}", Colors.BRIGHT_RED)
        visual_fx.print_colored(f"Defense: {self.game.player.defense}", Colors.BRIGHT_BLUE)
        
        # Gold with treasure icon
        visual_fx.print_colored(f"💰 Gold: {self.game.player.gold}", Colors.BRIGHT_YELLOW)
        
        # Show mana for mages with mana bar
        if (hasattr(self.game.player, 'character_class') and 
            hasattr(self.game.player.character_class, 'current_mana')):
            mana_bar = visual_fx.mana_bar(self.game.player.character_class.current_mana, 
                                        self.game.player.character_class.max_mana)
            visual_fx.print_colored(f"🔮 Mana: {mana_bar}", Colors.BRIGHT_BLUE)
            
        # Show character class special abilities
        if hasattr(self.game.player.character_class, 'get_special_ability_description'):
            visual_fx.print_colored(f"\n⚡ Special Ability: {self.game.player.character_class.get_special_ability_description()}", 
                                  Colors.BRIGHT_MAGENTA)
            
    def show_inventory(self):
        """Display player inventory and equipment with visual enhancements."""
        visual_fx.print_colored("\n⚔️ === EQUIPMENT === ⚔️", Colors.BRIGHT_CYAN, bold=True)
        equipment_desc = self.game.player.equipment.describe_equipment()
        for desc in equipment_desc:
            # Color code based on equipment type
            if "Weapon:" in desc:
                visual_fx.print_colored(f"  🗡️ {desc}", Colors.BRIGHT_RED)
            elif "Armor:" in desc:
                visual_fx.print_colored(f"  🛡️ {desc}", Colors.BRIGHT_BLUE)
            elif "Accessory:" in desc:
                visual_fx.print_colored(f"  💍 {desc}", Colors.BRIGHT_MAGENTA)
            else:
                visual_fx.print_colored(f"  {desc}", Colors.WHITE)
            
        visual_fx.print_colored("\n🎒 === CONSUMABLES === 🎒", Colors.BRIGHT_GREEN, bold=True)
        items = self.game.player.inventory.get_all_items()
        if items:
            for item_type, count in items:
                # Get an instance to display name
                from consumables import (HealingPotion, ManaPotion, Antidote, 
                                       StrengthPotion, DefensePotion, RegenerationPotion,
                                       Bread, Cheese, Meat, SmokeBomb, ThrowingKnife, FireBomb)
                
                # Map type to class and icons
                item_map = {
                    "healing_potion": (HealingPotion, "🧪"),
                    "mana_potion": (ManaPotion, "🔮"),
                    "antidote": (Antidote, "💚"),
                    "strength_potion": (StrengthPotion, "💪"),
                    "defense_potion": (DefensePotion, "🛡️"),
                    "regeneration_potion": (RegenerationPotion, "❤️"),
                    "bread": (Bread, "🍞"),
                    "cheese": (Cheese, "🧀"),
                    "meat": (Meat, "🥩"),
                    "smoke_bomb": (SmokeBomb, "💨"),
                    "throwing_knife": (ThrowingKnife, "🔪"),
                    "fire_bomb": (FireBomb, "💥")
                }
                
                if item_type.value in item_map:
                    item_class, icon = item_map[item_type.value]
                    item_instance = item_class()
                    visual_fx.print_colored(f"  {icon} {item_instance.name} x{count} - {item_instance.description}", 
                                          Colors.BRIGHT_WHITE)
        else:
            visual_fx.print_colored("  📦 No items", Colors.BRIGHT_BLACK)
            
        visual_fx.print_colored(f"\n💰 Gold: {self.game.player.gold}", Colors.BRIGHT_YELLOW, bold=True)
        
    def show_help(self, topic=None):
        """Display help information using the tutorial system."""
        help_messages = tutorial_manager.get_help(topic)
        for message in help_messages:
            print(message)
        
    def show_game_over(self):
        """Display game over screen."""
        print(f"\n--- GAME OVER ---")
        print(f"You reached floor {self.game.floor_number}.")
        print(f"You collected {self.game.player.gold} gold.")
        print(f"You achieved level {self.game.player.level}.")
        
        # Show performance stats
        performance = self.game.adaptive_difficulty.get_performance_assessment()
        print(f"Performance assessment: {performance}")
        
        # Show NG+ info if available
        if self.game.difficulty_manager.can_start_ng_plus():
            ng_info = self.game.difficulty_manager.get_ng_plus_info()
            print(f"\n🌟 NEW GAME PLUS AVAILABLE! 🌟")
            if ng_info["cycle"] == 0:
                print("Start a new adventure with increased difficulty and rewards!")
            else:
                print(f"Continue your NG+{ng_info['cycle']} journey!")
            print(f"Next cycle bonuses: {ng_info['next_difficulty_bonus']} difficulty, {ng_info['next_gold_bonus']} gold, {ng_info['next_xp_bonus']} XP")
        
    def show_victory_screen(self):
        """Display victory screen when player completes the game."""
        print(f"\n🎉 VICTORY! 🎉")
        print(f"You have conquered The Shadowed Keep!")
        print(f"Final floor reached: {self.game.floor_number}")
        print(f"Final level: {self.game.player.level}")
        print(f"Gold collected: {self.game.player.gold}")
        
        # Show difficulty info
        difficulty_display = self.game.difficulty_manager.get_difficulty_display(self.game.floor_number)
        print(f"Difficulty: {difficulty_display}")
        
        # Show NG+ option
        if self.game.difficulty_manager.can_start_ng_plus():
            print(f"\n🌟 NEW GAME PLUS UNLOCKED! 🌟")
            print("Would you like to start a new game with increased difficulty?")
        
    def show_ng_plus_prompt(self) -> bool:
        """Ask if player wants to start New Game Plus."""
        ng_info = self.game.difficulty_manager.get_ng_plus_info()
        
        print(f"\n=== NEW GAME PLUS ===")
        print(f"Current cycle: NG+{ng_info['cycle']}")
        print(f"Next cycle (NG+{ng_info['cycle'] + 1}) benefits:")
        print(f"  • {ng_info['next_difficulty_bonus']} increased difficulty")
        print(f"  • {ng_info['next_gold_bonus']} bonus gold from all sources")
        print(f"  • {ng_info['next_xp_bonus']} bonus XP from all sources")
        print(f"  • {ng_info['next_rare_item_chance']} chance for rare bonus items")
        print(f"\nStart New Game Plus? (yes/no)")
        
        while True:
            choice = self.get_player_action()
            if choice in ['yes', 'y']:
                return True
            elif choice in ['no', 'n']:
                return False
            else:
                print("Please answer 'yes' or 'no'.")
                
    def show_difficulty_settings(self):
        """Show current difficulty settings and options."""
        print(f"\n=== DIFFICULTY SETTINGS ===")
        
        # Current difficulty
        difficulty_display = self.game.difficulty_manager.get_difficulty_display(self.game.floor_number)
        print(f"Current difficulty: {difficulty_display}")
        
        # NG+ info
        ng_info = self.game.difficulty_manager.get_ng_plus_info()
        if ng_info["cycle"] > 0:
            print(f"New Game Plus: NG+{ng_info['cycle']} (Max: NG+{ng_info['max_cycles']})")
            
        # Adaptive difficulty
        performance = self.game.adaptive_difficulty.get_performance_assessment()
        adaptive_mult = self.game.adaptive_difficulty.get_adaptive_multiplier()
        print(f"Adaptive scaling: {adaptive_mult:.1f}x (based on {performance.lower()})")
        
        # Suggestions
        should_suggest, message = self.game.adaptive_difficulty.should_suggest_difficulty_change()
        if should_suggest:
            print(f"\nSuggestion: {message}")
        
    def show_navigation_options(self, available_directions: List[Direction]):
        """Show available navigation options."""
        print("\n--- What would you like to do? ---")
        
        # Show available directions
        direction_names = {
            Direction.NORTH: "north (n)",
            Direction.SOUTH: "south (s)",
            Direction.EAST: "east (e)",
            Direction.WEST: "west (w)"
        }
        
        print("Move:", ", ".join(direction_names[d] for d in available_directions))
        print("      Use arrow keys ↑↓←→ or type direction")
        print("Other: inventory (i), stats, achievements, legend, save, help (h), quit")
        
    def get_player_action(self) -> str:
        """Get player input with arrow key support."""
        try:
            action = input_handler.get_input_with_arrows("> ")
            return action.strip().lower()
        except KeyboardInterrupt:
            return "quit"
        except Exception:
            # Fallback to regular input
            return input("> ").strip().lower()
        
    def show_floor_banner(self, floor_number: int):
        """Display the floor banner."""
        print(f"\n=== FLOOR {floor_number} ===")
        
    def confirm_quit(self) -> bool:
        """Ask for quit confirmation."""
        print("\nAre you sure you want to quit? Your game will be saved. (yes/no)")
        while True:
            choice = self.get_player_action()
            if choice in ['yes', 'y']:
                return True
            elif choice in ['no', 'n']:
                return False
            else:
                print("Please answer 'yes' or 'no'.")
                
    def show_character_creation(self):
        """Show character creation screen."""
        print("\n=== CHARACTER CREATION ===")
        print("Welcome to The Shadowed Keep!")
        print("\nWhat is your name, brave adventurer?")
        
    def get_character_name(self) -> str:
        """Get character name from player."""
        while True:
            name = input("> ").strip()
            if name:
                return name
            else:
                print("Please enter a valid name.")
                
    def show_class_selection(self, class_descriptions: List[str]):
        """Show class selection screen."""
        # Show tutorial if active
        if tutorial_manager.should_show_tutorial("character_creation"):
            step = tutorial_manager.get_current_step()
            if step:
                for line in tutorial_manager.format_tutorial_message(step):
                    print(line)
                print()
        
        print("\nChoose your class:")
        for desc in class_descriptions:
            print(desc)
            
    def get_class_choice(self, valid_choices: List[str]) -> str:
        """Get class choice from player."""
        print("\nEnter your choice (1-3):")
        while True:
            choice = self.get_player_action()
            if choice in valid_choices:
                return choice
            else:
                print("Invalid choice. Please enter 1, 2, or 3.")
                
    def show_welcome_message(self, player_name: str, class_name: str):
        """Show welcome message for new game."""
        print(f"\nWelcome, {player_name} the {class_name}!")
        print("Your journey into The Shadowed Keep begins...")
        print("\nHint: Type 'help' or 'h' at any time to see available commands.")
        print("      Type 'legend' to see the map symbols.")
        
        # Show legend for new players
        self.display_legend()
        
    def show_load_game_prompt(self) -> bool:
        """Ask if player wants to load saved game."""
        print("\nA saved game was found. Do you want to continue your adventure? (yes/no)")
        while True:
            choice = self.get_player_action()
            if choice in ['yes', 'y']:
                return True
            elif choice in ['no', 'n']:
                return False
            else:
                print("Please answer 'yes' or 'no'.")
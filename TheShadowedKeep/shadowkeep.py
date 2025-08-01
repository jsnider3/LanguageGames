import random
import time
import argparse

# Core game modules
from player import Player
from monsters import Monster, Goblin, Orc, Slime, SkeletonArcher, Bandit, Troll, Mimic
from combat_manager import CombatManager, CombatAction, CombatState
from equipment import (EquipmentManager, Equipment, EquipmentSlot, 
                      RustyDagger, IronSword, SteelSword,
                      LeatherArmor, ChainMail,
                      LuckyCharm, HealthRing)
from dungeon_map import DungeonMap, Direction, RoomState
from save_manager import SaveManager, serialize_game_state, deserialize_game_state
from room_content import (RoomContent, RoomContentFactory, RoomContentType,
                         MonsterRoom, TreasureRoom, EquipmentRoom, StairsRoom,
                         MerchantRoom, HealingFountainRoom, TrapRoom)
from character_classes import CharacterClass, CharacterClassFactory, Warrior, Rogue, Mage
from constants import *
from room_handlers import RoomHandler
from ui_manager import UIManager
from achievements import AchievementTracker, AchievementManager
from difficulty_manager import DifficultyManager, AdaptiveDifficulty
from puzzles import PuzzleManager
from tutorial_system import tutorial_manager
from combat_log import combat_log

# Player class has been moved to player.py

# Monster classes have been moved to monsters.py



# Dungeon class has been replaced by RoomContentFactory in room_content.py


class Game:
    """
    Manages the main game loop and state.
    """
    def __init__(self):
        self.player = Player()
        self.game_over = False
        self.dungeon_map = DungeonMap()
        self.floor_number = 1
        self.save_manager = SaveManager()
        self.dungeon_level = 1  # Track dungeon difficulty level
        self.room_handler = RoomHandler(self)
        self.ui = UIManager(self)
        
        # Initialize achievement system
        self.achievement_tracker = AchievementTracker()
        self.achievement_manager = AchievementManager(self.achievement_tracker)
        
        # Initialize difficulty systems
        self.difficulty_manager = DifficultyManager()
        self.adaptive_difficulty = AdaptiveDifficulty()
        
        # Initialize puzzle system
        self.puzzle_manager = PuzzleManager()
        
        # Load global achievements
        self.achievement_tracker.load_from_file("saves/global_achievements.json")

    def _handle_room_content(self, room_content):
        """Delegate room handling to the room handler."""
        if not self.room_handler.handle_room(room_content):
            self.game_over = True

    def save_game(self):
        """Save the current game state."""
        state = serialize_game_state(self)
        self.save_manager.save_game(state)
        
        # Save global achievements
        self.achievement_tracker.save_to_file("saves/global_achievements.json")
        
    def load_game(self):
        """Load a saved game state."""
        state = self.save_manager.load_game()
        if state:
            deserialize_game_state(self, state)
            return True
        return False
        
    def _character_creation(self):
        """Handle character creation at game start."""
        self.ui.show_character_creation()
        name = self.ui.get_character_name()
        
        class_type = self._select_character_class()
        
        selected_class = CharacterClassFactory.create(class_type)
        self.player = Player(name, selected_class)
        
        self.ui.show_welcome_message(name, selected_class.name)
        time.sleep(1)

    def _select_character_class(self):
        """Gets the player's class choice."""
        descriptions = CharacterClassFactory.get_class_descriptions()
        
        class_options = []
        display_options = []
        for i, (class_type, info) in enumerate(descriptions.items(), 1):
            class_options.append(class_type)
            display_options.append(
                f"\n[{i}] {info['name']}\n"
                f"    {info['description']}\n"
                f"    HP: {info['hp']} | Attack: {info['attack']} | Defense: {info['defense']}\n"
                f"    Special: {info['special']}"
            )
            
        self.ui.show_class_selection(display_options)
        choice = self.ui.get_class_choice([str(i) for i in range(1, len(class_options) + 1)])
        
        return class_options[int(choice) - 1]
        
    def _start_new_game(self):
        """Start a new game."""
        print("\nYour adventure begins...")
        
        self._handle_tutorial_start()
        
        print("\nTIP: All commands work with just a single letter! Press H for help.")
        print("\nYou enter the dungeon on floor 1...")
        time.sleep(1)
        
        # Generate the first floor
        self._generate_new_floor()

    def _handle_tutorial_start(self):
        """Handles the tutorial prompt at the start of a new game."""
        print("\nWould you like to play the tutorial? (yes/no)")
        choice = input("> ").strip().lower()
        if choice in ['yes', 'y']:
            tutorial_manager.start_tutorial()
            # Show intro tutorial step
            step = tutorial_manager.get_current_step()
            if step:
                for line in tutorial_manager.format_tutorial_message(step):
                    print(line)
                input()  # Wait for Enter
                tutorial_manager.advance_tutorial("continue")
        else:
            print("\nTutorial skipped. Type 'help' anytime for assistance!")

    def run(self):
        """The main game loop."""
        print("Welcome to The Shadowed Keep!")
        
        self._initialize_game_session()

        while not self.game_over:
            self.ui.display_map()
            
            self._handle_current_room()
            
            if self.game_over:
                break
                
            self._post_room_actions()
            
            self._show_navigation_options()

    def _initialize_game_session(self):
        """Handles the initial setup of the game session, either by loading a save or starting a new game."""
        if not self.save_manager.has_autosave():
            self._character_creation()
            self._start_new_game()
        elif self.ui.show_load_game_prompt():
            if self.load_game():
                print(f"\nWelcome back, {self.player.name}!")
                print(f"You are on floor {self.floor_number}.")
            else:
                print("Failed to load save. Starting new game...")
                self._character_creation()
                self._start_new_game()
        else:
            self.save_manager.delete_save()
            self._character_creation()
            self._start_new_game()

    def _handle_current_room(self):
        """Handles the logic for the player's current room."""
        current_room = self.dungeon_map.get_current_room()
        
        if current_room.content is None:
            self._explore_current_room()
        elif not current_room.content.is_cleared():
            print(f"\n--- Exploring Room ---")
            self._handle_room_content(current_room.content)

    def _post_room_actions(self):
        """Actions to be performed after a room is handled."""
        if not self.player.is_alive():
            self.game_over = True
            self.ui.show_game_over()
            self.save_manager.delete_save()
            return
            
        if (hasattr(self.player, 'character_class') and 
            hasattr(self.player.character_class, 'regenerate_mana')):
            self.player.character_class.regenerate_mana()
        
        self.save_game()
        self._check_periodic_achievements()
            
    def _generate_new_floor(self):
        """Generate a new dungeon floor."""
        self.dungeon_map = DungeonMap()
        self.dungeon_map.generate_floor()
        
        # Add boss room on certain floors (every 3rd floor starting from floor 3)
        if self.floor_number % 3 == 0 and self.floor_number >= 3:
            self._place_boss_room()
        
        self.ui.show_floor_banner(self.floor_number)
        
    def _place_boss_room(self):
        """Place a boss room on the current floor."""
        from room_content import RoomContentFactory
        import random
        
        # Find a suitable room (preferably far from stairs and start)
        available_rooms = []
        start_pos = (self.dungeon_map.width // 2, self.dungeon_map.height // 2)
        
        for pos, room in self.dungeon_map.rooms.items():
            # Skip start room, stairs room, and rooms too close to start
            if (pos == start_pos or 
                pos == self.dungeon_map.stairs_position or
                abs(pos[0] - start_pos[0]) + abs(pos[1] - start_pos[1]) <= 1):
                continue
            available_rooms.append(room)
        
        if available_rooms:
            # Choose a random room from available ones
            boss_room_location = random.choice(available_rooms)
            
            # Create boss content based on dungeon level
            boss_content = RoomContentFactory.create_boss_room(self.dungeon_level)
            boss_room_location.content = boss_content
            
            print(f"\n🔥 A powerful presence stirs on this floor... 🔥")
        
        
    def _explore_current_room(self):
        """Explore the current room and generate its content."""
        current_room = self.dungeon_map.get_current_room()
        
        # Check if this is the stairs room
        if current_room.position == self.dungeon_map.stairs_position:
            current_room.content = RoomContentFactory.create(RoomContentType.STAIRS)
            messages = current_room.content.on_enter(self)
            for msg in messages:
                print(msg)
            return
            
        # Generate room content with difficulty scaling
        current_room.content = RoomContentFactory.get_random_content_with_scaling(
            self.dungeon_level, game=self
        )
        
        # Handle the room content
        print(f"\n--- Exploring Room ---")
        self._handle_room_content(current_room.content)
            
    def _show_navigation_options(self):
        """Show movement and action options and handle player input."""
        while not self.game_over:
            current_room = self.dungeon_map.get_current_room()
            directions = self.dungeon_map.get_available_directions()
            
            self.ui.show_navigation_options(directions)
            
            # Additional room-specific options
            if current_room.position == self.dungeon_map.stairs_position:
                print("[D]escend the stairs to the next floor")
            if current_room.content:
                if isinstance(current_room.content, MerchantRoom):
                    print("[S]hop - Browse merchant's wares")
                elif isinstance(current_room.content, HealingFountainRoom) and current_room.content.uses_remaining > 0:
                    print("[F]ountain - Drink from the healing fountain")
            
            command = self.ui.get_player_action()
            
            if self._process_navigation_command(command, directions, current_room):
                break

    def _process_navigation_command(self, command: str, directions: list, current_room) -> bool:
        """Processes a single navigation or action command. Returns True if the turn should end."""
        # Movement commands
        move_map = {
            'n': Direction.NORTH, 'north': Direction.NORTH,
            's': Direction.SOUTH, 'south': Direction.SOUTH,
            'e': Direction.EAST, 'east': Direction.EAST,
            'w': Direction.WEST, 'west': Direction.WEST
        }
        if command in move_map and move_map[command] in directions:
            if self.dungeon_map.move(move_map[command]):
                print(f"You move {move_map[command].value}.")
                return True

        # Other commands
        elif command in ['d', 'descend'] and current_room.position == self.dungeon_map.stairs_position:
            self.floor_number += 1
            self.dungeon_level = self.floor_number
            print("\nYou descend deeper into the darkness...")
            time.sleep(1)
            self._generate_new_floor()
            return True
        elif command in ['m', 'map']:
            self.ui.display_map()
        elif command in ['i', 'inventory']:
            self.ui.show_inventory()
        elif command in ['t', 'stats']:
            self.ui.show_stats()
        elif command in ['h', 'help']:
            self.ui.show_help()
        elif command == 'legend':
            self.ui.display_legend()
        elif command in ['log', 'combatlog']:
            combat_log.display(10)
        elif command in ['q', 'quit']:
            if self.ui.confirm_quit():
                print("Saving game...")
                self.save_game()
                print("Game saved. You can continue your adventure later.")
                self.game_over = True
                return True
        elif command in ['s', 'shop'] and isinstance(current_room.content, MerchantRoom):
            self.room_handler._handle_merchant_room(current_room.content)
        elif command in ['f', 'fountain'] and isinstance(current_room.content, HealingFountainRoom):
            self.room_handler._handle_healing_fountain_room(current_room.content)
        elif command.startswith('use '):
            self._use_item(command[4:].strip())
        elif command in ['achievements', 'a']:
            self._show_achievements()
        else:
            print("Invalid command. Type 'help' for available commands.")
        
        return False
                
    def _use_item(self, item_name: str):
        """Use an item from inventory."""
        from consumables import ConsumableType
        
        # Find matching item in inventory
        item_to_use = None
        for item_type, count in self.player.inventory.get_all_items():
            if count > 0:
                items = self.player.inventory.items[item_type]
                if items and (items[0].name.lower() == item_name.lower() or 
                            items[0].name.lower().startswith(item_name.lower())):
                    item_to_use = item_type
                    break
        
        if not item_to_use:
            print(f"You don't have any '{item_name}'.")
            return
        
        # Remove and use the item
        item = self.player.inventory.remove_item(item_to_use)
        if item:
            can_use, reason = item.can_use(self.player, in_combat=False)
            if can_use:
                messages = item.use(self.player)
                for msg in messages:
                    print(msg)
                    
                # Track item usage for achievements
                self.achievement_manager.check_item_use(item_to_use)
            else:
                # Put it back
                self.player.inventory.add_item(item)
                print(f"Can't use {item.name}: {reason}")
                
    def _check_periodic_achievements(self):
        """Check achievements that need periodic checking."""
        # Check exploration achievements
        self.achievement_manager.check_exploration_achievements(self.player, self.dungeon_map)
        
        # Check collection achievements
        self.achievement_manager.check_collection_achievements(self.player)
        
        # Check progression achievements
        self.achievement_manager.check_progression_achievements(self.player)
        
        # Show any notifications
        notifications = self.achievement_manager.get_and_clear_notifications()
        for achievement in notifications:
            print("\n" + "="*50)
            print("🏆 ACHIEVEMENT UNLOCKED! 🏆")
            print(f"{achievement.name} - {achievement.points} points")
            print(f"{achievement.description}")
            
            if achievement.unlock_reward:
                print(f"\nReward: New content unlocked!")
                
            print("="*50)
            time.sleep(1.5)
            
    def _show_achievements(self):
        """Display achievement progress."""
        tracker = self.achievement_tracker
        
        print("\n=== ACHIEVEMENTS ===")
        print(f"Completion: {tracker.get_completion_percentage():.1f}%")
        print(f"Total Points: {tracker.get_total_points()}")
        
        from achievements import AchievementCategory
        
        for category in AchievementCategory:
            achievements = tracker.get_achievements_by_category(category)
            if not achievements:
                continue
                
            print(f"\n--- {category.value.upper()} ---")
            for achievement in achievements:
                status = "✓" if achievement.id in tracker.completed_achievements else "✗"
                name = achievement.get_display_name()
                desc = achievement.get_display_description()
                print(f"  {status} {name} ({achievement.points}pts)")
                print(f"      {desc}")
                
        # Show unlocks
        unlocks_shown = False
        for unlock_type, items in tracker.unlocks.items():
            if items:
                if not unlocks_shown:
                    print("\n--- UNLOCKED CONTENT ---")
                    unlocks_shown = True
                print(f"{unlock_type.value}: {', '.join(items)}")



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="The Shadowed Keep - A Text-Based Roguelike.")
    parser.add_argument("--seed", type=int, help="A seed for the random number generator for reproducible runs.")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    game = Game()
    game.run()

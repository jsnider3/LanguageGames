import unittest
import tempfile
import shutil
import os
import sys

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from save_manager import (SaveManager, serialize_game_state, 
                         deserialize_game_state, serialize_equipment, 
                         serialize_rooms)
from shadowkeep import Game
from player import Player
from dungeon_map import DungeonMap, Room, RoomState, Direction
from equipment import (RustyDagger, LeatherArmor, HealthRing, EquipmentManager,
                      EquipmentSlot)


class TestSaveManager(unittest.TestCase):
    """Test SaveManager functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create temporary directory for saves
        self.temp_dir = tempfile.mkdtemp()
        self.save_manager = SaveManager(self.temp_dir)
        
    def tearDown(self):
        """Clean up test fixtures."""
        # Remove temporary directory
        shutil.rmtree(self.temp_dir)
        
    def test_save_directory_creation(self):
        """Test that save directory is created."""
        # Remove directory and recreate save manager
        shutil.rmtree(self.temp_dir)
        self.assertFalse(os.path.exists(self.temp_dir))
        
        save_manager = SaveManager(self.temp_dir)
        self.assertTrue(os.path.exists(self.temp_dir))
        
    def test_save_and_load_game(self):
        """Test saving and loading game state."""
        test_state = {
            "player": {"name": "TestHero", "hp": 15},
            "floor": 3
        }
        
        # Save game
        save_path = self.save_manager.save_game(test_state)
        self.assertTrue(os.path.exists(save_path))
        
        # Load game
        loaded_state = self.save_manager.load_game()
        self.assertEqual(loaded_state["player"]["name"], "TestHero")
        self.assertEqual(loaded_state["player"]["hp"], 15)
        self.assertEqual(loaded_state["floor"], 3)
        
    def test_autosave(self):
        """Test autosave functionality."""
        test_state = {"test": "data"}
        
        # Check no autosave exists
        self.assertFalse(self.save_manager.has_autosave())
        
        # Create autosave
        self.save_manager.save_game(test_state)
        self.assertTrue(self.save_manager.has_autosave())
        
    def test_delete_save(self):
        """Test deleting save files."""
        test_state = {"test": "data"}
        
        # Create save
        self.save_manager.save_game(test_state)
        self.assertTrue(self.save_manager.has_autosave())
        
        # Delete save
        deleted = self.save_manager.delete_save()
        self.assertTrue(deleted)
        self.assertFalse(self.save_manager.has_autosave())
        
    def test_list_saves(self):
        """Test listing save files."""
        # Create multiple saves
        self.save_manager.save_game({"test": 1}, "save1.json")
        self.save_manager.save_game({"test": 2}, "save2.json")
        
        saves = self.save_manager.list_saves()
        self.assertEqual(len(saves), 2)
        
        # Check save info
        filenames = [s["filename"] for s in saves]
        self.assertIn("save1.json", filenames)
        self.assertIn("save2.json", filenames)
        
    def test_load_nonexistent_save(self):
        """Test loading a save that doesn't exist."""
        result = self.save_manager.load_game("nonexistent.json")
        self.assertIsNone(result)


class TestGameSerialization(unittest.TestCase):
    """Test game state serialization."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.game = Game()
        # Set up a specific game state
        self.game.player.hp = 15
        self.game.player.gold = 100
        self.game.player.level = 3
        self.game.player.xp = 5
        self.game.floor_number = 2
        
    def test_serialize_player(self):
        """Test player serialization."""
        state = serialize_game_state(self.game)
        
        player_data = state["player"]
        self.assertEqual(player_data["hp"], 15)
        self.assertEqual(player_data["gold"], 100)
        self.assertEqual(player_data["level"], 3)
        self.assertEqual(player_data["xp"], 5)
        
    def test_serialize_equipment(self):
        """Test equipment serialization."""
        # Equip some items
        self.game.player.equipment.equip(RustyDagger())
        self.game.player.equipment.equip(LeatherArmor())
        
        state = serialize_game_state(self.game)
        equipment_data = state["player"]["equipment"]["slots"]
        
        self.assertEqual(equipment_data["weapon"]["class"], "RustyDagger")
        self.assertEqual(equipment_data["armor"]["class"], "LeatherArmor")
        self.assertIsNone(equipment_data["accessory"])
        
    def test_serialize_dungeon_map(self):
        """Test dungeon map serialization."""
        # Generate a simple map
        self.game.dungeon_map.generate_floor(min_rooms=5, max_rooms=5)
        
        state = serialize_game_state(self.game)
        map_data = state["dungeon_map"]
        
        self.assertEqual(map_data["width"], self.game.dungeon_map.width)
        self.assertEqual(map_data["height"], self.game.dungeon_map.height)
        self.assertIsNotNone(map_data["stairs_position"])
        self.assertEqual(len(map_data["rooms"]), 5)
        
    def test_deserialize_player(self):
        """Test player deserialization."""
        # Serialize
        original_state = serialize_game_state(self.game)
        
        # Create new game and deserialize
        new_game = Game()
        deserialize_game_state(new_game, original_state)
        
        # Check player state
        self.assertEqual(new_game.player.hp, 15)
        self.assertEqual(new_game.player.gold, 100)
        self.assertEqual(new_game.player.level, 3)
        self.assertEqual(new_game.player.xp, 5)
        
    def test_deserialize_equipment(self):
        """Test equipment deserialization."""
        # Equip items
        self.game.player.equipment.equip(RustyDagger())
        self.game.player.equipment.equip(LeatherArmor())
        self.game.player.equipment.equip(HealthRing())
        
        # Serialize
        original_state = serialize_game_state(self.game)
        
        # Create new game and deserialize
        new_game = Game()
        deserialize_game_state(new_game, original_state)
        
        # Check equipment
        weapon = new_game.player.equipment.slots[EquipmentSlot.WEAPON]
        armor = new_game.player.equipment.slots[EquipmentSlot.ARMOR]
        accessory = new_game.player.equipment.slots[EquipmentSlot.ACCESSORY]
        
        self.assertIsNotNone(weapon)
        self.assertEqual(weapon.name, "Rusty Dagger")
        self.assertIsNotNone(armor)
        self.assertEqual(armor.name, "Leather Armor")
        self.assertIsNotNone(accessory)
        self.assertEqual(accessory.name, "Health Ring")
        
    def test_deserialize_dungeon_map(self):
        """Test dungeon map deserialization."""
        # Generate map
        self.game.dungeon_map.generate_floor(min_rooms=8, max_rooms=8)
        
        # Move to a different room
        directions = self.game.dungeon_map.get_available_directions()
        if directions:
            self.game.dungeon_map.move(directions[0])
        
        # Serialize
        original_state = serialize_game_state(self.game)
        original_position = self.game.dungeon_map.current_position
        original_stairs = self.game.dungeon_map.stairs_position
        
        # Create new game and deserialize
        new_game = Game()
        deserialize_game_state(new_game, original_state)
        
        # Check map state
        self.assertEqual(new_game.dungeon_map.current_position, original_position)
        self.assertEqual(new_game.dungeon_map.stairs_position, original_stairs)
        self.assertEqual(len(new_game.dungeon_map.rooms), 8)
        
        # Check room states
        current_room = new_game.dungeon_map.get_current_room()
        self.assertEqual(current_room.state, RoomState.CURRENT)


class TestGameIntegration(unittest.TestCase):
    """Test save/load integration with full game."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.save_manager = SaveManager(self.temp_dir)
        
    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir)
        
    def test_full_save_load_cycle(self):
        """Test a complete save/load cycle."""
        # Create game with specific state
        game1 = Game()
        game1.player.name = "SaveTest"
        game1.player.hp = 10
        game1.player.gold = 250
        game1.player.level = 5
        game1.floor_number = 3
        game1.player.equipment.equip(RustyDagger())
        game1.dungeon_map.generate_floor()
        
        # Save game
        state = serialize_game_state(game1)
        self.save_manager.save_game(state)
        
        # Create new game and load
        game2 = Game()
        loaded_state = self.save_manager.load_game()
        self.assertIsNotNone(loaded_state)
        
        deserialize_game_state(game2, loaded_state)
        
        # Verify state
        self.assertEqual(game2.player.name, "SaveTest")
        self.assertEqual(game2.player.hp, 10)
        self.assertEqual(game2.player.gold, 250)
        self.assertEqual(game2.player.level, 5)
        self.assertEqual(game2.floor_number, 3)
        
        # Check equipment
        weapon = game2.player.equipment.slots[EquipmentSlot.WEAPON]
        self.assertIsNotNone(weapon)
        self.assertEqual(weapon.name, "Rusty Dagger")
        
        # Check map
        self.assertGreater(len(game2.dungeon_map.rooms), 0)


if __name__ == '__main__':
    unittest.main()
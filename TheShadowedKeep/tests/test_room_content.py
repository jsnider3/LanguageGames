import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from room_content import (RoomContent, RoomContentType, RoomContentFactory,
                         EmptyRoom, MonsterRoom, TreasureRoom, EquipmentRoom,
                         StairsRoom)
from monsters import Goblin
from equipment import RustyDagger


class TestRoomContent(unittest.TestCase):
    """Test the room content system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.game = MagicMock()
        self.game.player = MagicMock()
        self.game.player.hp = 15
        self.game.player.max_hp = 20
        self.game.player.gold = 50
        
    def test_empty_room_creation(self):
        """Test empty room creation."""
        room = EmptyRoom()
        self.assertEqual(room.content_type, RoomContentType.EMPTY)
        self.assertFalse(room.explored)
        self.assertIsNotNone(room.get_description())
        
    def test_empty_room_with_bandages(self):
        """Test empty room with bandages."""
        with patch('random.random', return_value=0.2):  # Will have bandages
            room = EmptyRoom()
            self.assertTrue(room.has_bandages)
            
            messages = room.on_enter(self.game)
            self.assertIn("bandages", " ".join(messages).lower())
            
            # Take bandages
            messages = room.interact(self.game, "take bandages")
            self.assertTrue(any("heal" in msg for msg in messages))
            self.assertTrue(room.bandages_taken)
            
    def test_monster_room(self):
        """Test monster room functionality."""
        goblin = Goblin()
        room = MonsterRoom(goblin)
        
        self.assertEqual(room.content_type, RoomContentType.MONSTER)
        self.assertFalse(room.defeated)
        self.assertFalse(room.is_cleared())
        
        messages = room.on_enter(self.game)
        self.assertIn("Goblin", messages[0])
        
        # Mark as defeated
        room.defeated = True
        self.assertTrue(room.is_cleared())
        
    def test_treasure_room(self):
        """Test treasure room functionality."""
        room = TreasureRoom(100)
        
        self.assertEqual(room.content_type, RoomContentType.TREASURE)
        self.assertEqual(room.gold_amount, 100)
        self.assertFalse(room.looted)
        
        # Loot treasure
        initial_gold = self.game.player.gold
        messages = room.interact(self.game, "open chest")
        self.assertIn("100 gold", " ".join(messages))
        self.assertTrue(room.looted)
        self.assertTrue(room.is_cleared())
        
    def test_equipment_room(self):
        """Test equipment room functionality."""
        dagger = RustyDagger()
        room = EquipmentRoom(dagger)
        
        self.assertEqual(room.content_type, RoomContentType.EQUIPMENT)
        self.assertEqual(room.equipment, dagger)
        self.assertFalse(room.taken)
        
        messages = room.on_enter(self.game)
        self.assertIn("Rusty Dagger", " ".join(messages))
        
    def test_stairs_room(self):
        """Test stairs room functionality."""
        room = StairsRoom()
        
        self.assertEqual(room.content_type, RoomContentType.STAIRS)
        messages = room.on_enter(self.game)
        self.assertIn("stairs", " ".join(messages).lower())


class TestRoomContentFactory(unittest.TestCase):
    """Test the room content factory."""
    
    def test_create_empty_room(self):
        """Test creating an empty room."""
        room = RoomContentFactory.create(RoomContentType.EMPTY)
        self.assertIsInstance(room, EmptyRoom)
        
    def test_create_monster_room(self):
        """Test creating a monster room."""
        goblin = Goblin()
        room = RoomContentFactory.create(RoomContentType.MONSTER, monster=goblin)
        self.assertIsInstance(room, MonsterRoom)
        self.assertEqual(room.monster, goblin)
        
    def test_create_treasure_room(self):
        """Test creating a treasure room."""
        room = RoomContentFactory.create(RoomContentType.TREASURE, gold_amount=50)
        self.assertIsInstance(room, TreasureRoom)
        self.assertEqual(room.gold_amount, 50)
        
    def test_create_equipment_room(self):
        """Test creating an equipment room."""
        dagger = RustyDagger()
        room = RoomContentFactory.create(RoomContentType.EQUIPMENT, equipment=dagger)
        self.assertIsInstance(room, EquipmentRoom)
        self.assertEqual(room.equipment, dagger)
        
    def test_create_stairs_room(self):
        """Test creating a stairs room."""
        room = RoomContentFactory.create(RoomContentType.STAIRS)
        self.assertIsInstance(room, StairsRoom)
        
    def test_create_missing_parameters(self):
        """Test that factory raises error for missing parameters."""
        with self.assertRaises(ValueError):
            RoomContentFactory.create(RoomContentType.MONSTER)  # Missing monster
            
        with self.assertRaises(ValueError):
            RoomContentFactory.create(RoomContentType.TREASURE)  # Missing gold_amount
            
        with self.assertRaises(ValueError):
            RoomContentFactory.create(RoomContentType.EQUIPMENT)  # Missing equipment
            
    def test_get_random_content(self):
        """Test random content generation."""
        # Test level 1 content
        room = RoomContentFactory.get_random_content(1)
        self.assertIsInstance(room, RoomContent)
        self.assertIn(room.content_type, [
            RoomContentType.EMPTY,
            RoomContentType.MONSTER,
            RoomContentType.TREASURE,
            RoomContentType.EQUIPMENT,
            RoomContentType.MERCHANT,
            RoomContentType.HEALING_FOUNTAIN,
            RoomContentType.TRAP
        ])
        
        # Test excluding types
        room = RoomContentFactory.get_random_content(
            1, 
            exclude_types=[RoomContentType.MONSTER, RoomContentType.TREASURE]
        )
        self.assertIn(room.content_type, [
            RoomContentType.EMPTY,
            RoomContentType.EQUIPMENT,
            RoomContentType.MERCHANT,
            RoomContentType.HEALING_FOUNTAIN,
            RoomContentType.TRAP
        ])
        
    def test_random_content_probabilities(self):
        """Test that random content follows expected distributions."""
        # Generate many rooms
        content_counts = {
            RoomContentType.EMPTY: 0,
            RoomContentType.MONSTER: 0,
            RoomContentType.TREASURE: 0,
            RoomContentType.EQUIPMENT: 0,
            RoomContentType.MERCHANT: 0,
            RoomContentType.HEALING_FOUNTAIN: 0,
            RoomContentType.TRAP: 0
        }
        
        for _ in range(1000):
            room = RoomContentFactory.get_random_content(1)
            content_counts[room.content_type] += 1
            
        # Monsters should be most common (around 45% for level 1)
        self.assertGreater(content_counts[RoomContentType.MONSTER], 350)
        self.assertLess(content_counts[RoomContentType.MONSTER], 550)
        
        # Empty rooms should be second most common (around 20%)
        self.assertGreater(content_counts[RoomContentType.EMPTY], 150)
        
        # Treasure and equipment should be less common
        self.assertGreater(content_counts[RoomContentType.TREASURE], 50)
        self.assertGreater(content_counts[RoomContentType.EQUIPMENT], 30)
        
        # New room types should appear but be rare
        self.assertGreater(content_counts[RoomContentType.MERCHANT], 20)
        self.assertGreater(content_counts[RoomContentType.HEALING_FOUNTAIN], 20)
        self.assertGreater(content_counts[RoomContentType.TRAP], 20)


if __name__ == '__main__':
    unittest.main()
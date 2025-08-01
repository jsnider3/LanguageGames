import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from room_content import (MerchantRoom, HealingFountainRoom, TrapRoom,
                         RoomContentType, RoomContentFactory)


class TestMerchantRoom(unittest.TestCase):
    """Test merchant room functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.room = MerchantRoom()
        self.game = MagicMock()
        self.game.player = MagicMock()
        self.game.player.gold = 50
        self.game.player.hp = 10
        self.game.player.max_hp = 20
        
    def test_merchant_room_creation(self):
        """Test merchant room initialization."""
        self.assertEqual(self.room.content_type, RoomContentType.MERCHANT)
        self.assertFalse(self.room.visited)
        self.assertEqual(self.room.healing_potion_price, 20)
        self.assertEqual(self.room.healing_potion_stock, 3)
        
    def test_merchant_on_enter(self):
        """Test entering a merchant room."""
        messages = self.room.on_enter(self.game)
        self.assertIn("merchant", " ".join(messages).lower())
        self.assertIn("shop", " ".join(messages).lower())
        
        # Test returning
        self.room.visited = True
        messages = self.room.on_enter(self.game)
        self.assertIn("back again", " ".join(messages).lower())
        
    def test_shop_interaction(self):
        """Test shopping interaction."""
        messages = self.room.interact(self.game, "shop")
        self.assertIn("MERCHANT'S WARES", " ".join(messages))
        self.assertIn("Healing Potion", " ".join(messages))
        self.assertIn(str(self.game.player.gold), " ".join(messages))
        
    def test_buy_potion_success(self):
        """Test successfully buying a potion."""
        initial_gold = self.game.player.gold
        messages = self.room.interact(self.game, "buy 1")
        
        # Check purchase happened
        self.assertEqual(self.game.player.gold, initial_gold - 20)
        self.assertEqual(self.room.healing_potion_stock, 2)
        self.assertIn("purchase", " ".join(messages).lower())
        
    def test_buy_potion_no_gold(self):
        """Test buying without enough gold."""
        self.game.player.gold = 10  # Less than potion price
        messages = self.room.interact(self.game, "buy 1")
        
        self.assertIn("only have 10", " ".join(messages))
        self.assertEqual(self.game.player.gold, 10)  # Gold unchanged
        self.assertEqual(self.room.healing_potion_stock, 3)  # Stock unchanged
        
    def test_buy_potion_sold_out(self):
        """Test buying when sold out."""
        self.room.healing_potion_stock = 0
        messages = self.room.interact(self.game, "buy 1")
        
        self.assertIn("out of healing potions", " ".join(messages).lower())
        
    def test_merchant_never_cleared(self):
        """Test that merchant rooms are never 'cleared'."""
        self.assertFalse(self.room.is_cleared())
        self.room.visited = True
        self.room.explored = True
        self.assertFalse(self.room.is_cleared())


class TestHealingFountainRoom(unittest.TestCase):
    """Test healing fountain room functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.room = HealingFountainRoom()
        self.game = MagicMock()
        self.game.player = MagicMock()
        self.game.player.hp = 10
        self.game.player.max_hp = 20
        
    def test_fountain_room_creation(self):
        """Test fountain room initialization."""
        self.assertEqual(self.room.content_type, RoomContentType.HEALING_FOUNTAIN)
        self.assertEqual(self.room.uses_remaining, 3)
        
    def test_fountain_on_enter(self):
        """Test entering a fountain room."""
        messages = self.room.on_enter(self.game)
        self.assertIn("fountain", " ".join(messages).lower())
        self.assertIn("3", " ".join(messages))  # Uses remaining
        
    def test_drink_from_fountain(self):
        """Test drinking from the fountain."""
        messages = self.room.interact(self.game, "drink")
        
        # Check healing happened (25% of max HP = 5)
        self.assertEqual(self.game.player.hp, 15)
        self.assertEqual(self.room.uses_remaining, 2)
        self.assertIn("heal", " ".join(messages).lower())
        
    def test_fountain_runs_dry(self):
        """Test fountain running out of uses."""
        # Use up the fountain
        for _ in range(3):
            self.room.interact(self.game, "drink")
            
        self.assertEqual(self.room.uses_remaining, 0)
        self.assertTrue(self.room.is_cleared())
        
        # Try to drink again
        messages = self.room.interact(self.game, "drink")
        self.assertIn("dry", " ".join(messages).lower())
        
    def test_fountain_healing_cap(self):
        """Test fountain doesn't overheal."""
        self.game.player.hp = 19  # Almost full
        messages = self.room.interact(self.game, "drink")
        
        # Should only heal to max
        self.assertEqual(self.game.player.hp, 20)
        self.assertIn("1 HP", " ".join(messages))  # Only healed 1


class TestTrapRoom(unittest.TestCase):
    """Test trap room functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.game = MagicMock()
        self.game.player = MagicMock()
        self.game.player.hp = 20
        self.game.player.max_hp = 20
        self.game.player.take_damage = MagicMock(side_effect=self._mock_take_damage)
        self.game.player.is_alive = MagicMock(return_value=True)
        
    def _mock_take_damage(self, damage):
        """Mock take_damage method."""
        self.game.player.hp -= damage
        
    def test_trap_room_types(self):
        """Test different trap types."""
        # Test spike trap
        spike_trap = TrapRoom("spike")
        self.assertEqual(spike_trap.trap_type, "spike")
        self.assertIn(spike_trap.damage, range(3, 7))
        self.assertEqual(spike_trap.dodge_chance, 0.5)
        
        # Test dart trap
        dart_trap = TrapRoom("dart")
        self.assertEqual(dart_trap.trap_type, "dart")
        self.assertIn(dart_trap.damage, range(2, 5))
        self.assertEqual(dart_trap.dodge_chance, 0.7)
        
        # Test poison gas trap
        gas_trap = TrapRoom("poison_gas")
        self.assertEqual(gas_trap.trap_type, "poison_gas")
        self.assertIn(gas_trap.damage, range(4, 9))
        self.assertEqual(gas_trap.dodge_chance, 0.3)
        
    def test_trap_triggers_on_enter(self):
        """Test trap triggers when entering."""
        trap = TrapRoom("spike")
        self.assertFalse(trap.triggered)
        
        messages = trap.on_enter(self.game)
        
        self.assertTrue(trap.triggered)
        self.assertTrue(trap.is_cleared())
        self.assertIn("spike", " ".join(messages).lower())
        
    def test_trap_dodge_success(self):
        """Test successfully dodging a trap."""
        trap = TrapRoom("dart")
        trap.damage = 3
        
        with patch('random.random', return_value=0.6):  # Will dodge (0.6 < 0.7)
            messages = trap.on_enter(self.game)
            
        self.assertIn("dodge", " ".join(messages).lower())
        self.game.player.take_damage.assert_not_called()
        
    def test_trap_dodge_failure(self):
        """Test failing to dodge a trap."""
        trap = TrapRoom("spike")
        trap.damage = 5
        
        with patch('random.random', return_value=0.8):  # Won't dodge (0.8 > 0.5)
            messages = trap.on_enter(self.game)
            
        self.assertIn("5 damage", " ".join(messages))
        self.game.player.take_damage.assert_called_once_with(5)
        
    def test_trap_already_triggered(self):
        """Test entering a triggered trap room."""
        trap = TrapRoom("dart")
        trap.triggered = True
        
        messages = trap.on_enter(self.game)
        self.assertIn("triggered trap", " ".join(messages).lower())
        self.assertIn("step around", " ".join(messages).lower())
        
    def test_random_trap_generation(self):
        """Test random trap type selection."""
        trap_types = set()
        for _ in range(30):
            trap = TrapRoom()  # No type specified
            trap_types.add(trap.trap_type)
            
        # Should have all three types after 30 tries
        self.assertEqual(trap_types, {"spike", "dart", "poison_gas"})


class TestRoomContentFactoryNewTypes(unittest.TestCase):
    """Test factory creation of new room types."""
    
    def test_create_merchant_room(self):
        """Test creating merchant room via factory."""
        room = RoomContentFactory.create(RoomContentType.MERCHANT)
        self.assertIsInstance(room, MerchantRoom)
        
    def test_create_fountain_room(self):
        """Test creating fountain room via factory."""
        room = RoomContentFactory.create(RoomContentType.HEALING_FOUNTAIN)
        self.assertIsInstance(room, HealingFountainRoom)
        
    def test_create_trap_room(self):
        """Test creating trap room via factory."""
        room = RoomContentFactory.create(RoomContentType.TRAP)
        self.assertIsInstance(room, TrapRoom)
        
        # Test with specific trap type
        spike_trap = RoomContentFactory.create(RoomContentType.TRAP, trap_type="spike")
        self.assertEqual(spike_trap.trap_type, "spike")
        
    def test_random_content_includes_new_types(self):
        """Test that random generation includes new room types."""
        room_types = set()
        
        # Generate many rooms to ensure we see all types
        for _ in range(200):
            room = RoomContentFactory.get_random_content(5)  # Mid-level dungeon
            room_types.add(room.content_type)
            
        # Should include new room types
        self.assertIn(RoomContentType.MERCHANT, room_types)
        self.assertIn(RoomContentType.HEALING_FOUNTAIN, room_types)
        self.assertIn(RoomContentType.TRAP, room_types)


if __name__ == '__main__':
    unittest.main()
import unittest
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dungeon_map import DungeonMap, Direction, Room, RoomState
from room_content import RoomContentFactory, RoomContentType
from shadowkeep import Goblin


class TestDirection(unittest.TestCase):
    """Test Direction enum functionality."""
    
    def test_opposite_directions(self):
        """Test that opposite directions work correctly."""
        self.assertEqual(Direction.NORTH.opposite, Direction.SOUTH)
        self.assertEqual(Direction.SOUTH.opposite, Direction.NORTH)
        self.assertEqual(Direction.EAST.opposite, Direction.WEST)
        self.assertEqual(Direction.WEST.opposite, Direction.EAST)
        
    def test_direction_deltas(self):
        """Test coordinate changes for directions."""
        self.assertEqual(Direction.NORTH.delta, (0, -1))
        self.assertEqual(Direction.SOUTH.delta, (0, 1))
        self.assertEqual(Direction.EAST.delta, (1, 0))
        self.assertEqual(Direction.WEST.delta, (-1, 0))


class TestRoom(unittest.TestCase):
    """Test Room functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.room = Room(2, 3)
        
    def test_room_creation(self):
        """Test room initialization."""
        self.assertEqual(self.room.x, 2)
        self.assertEqual(self.room.y, 3)
        self.assertEqual(self.room.position, (2, 3))
        self.assertEqual(self.room.state, RoomState.UNEXPLORED)
        self.assertEqual(len(self.room.connections), 0)
        
    def test_room_connections(self):
        """Test room connection methods."""
        self.assertFalse(self.room.has_connection(Direction.NORTH))
        
        self.room.connect(Direction.NORTH)
        self.assertTrue(self.room.has_connection(Direction.NORTH))
        self.assertFalse(self.room.has_connection(Direction.SOUTH))
        
    def test_room_symbols(self):
        """Test map symbol generation."""
        # Unexplored
        self.assertEqual(self.room.get_map_symbol(), "?")
        
        # Current
        self.room.state = RoomState.CURRENT
        self.assertEqual(self.room.get_map_symbol(), "@")
        
        # Explored empty
        self.room.state = RoomState.EXPLORED
        self.room.content = RoomContentFactory.create(RoomContentType.EMPTY)
        self.assertEqual(self.room.get_map_symbol(), ".")
        
        # Explored monster (not cleared)
        goblin = Goblin()
        self.room.content = RoomContentFactory.create(RoomContentType.MONSTER, monster=goblin)
        self.assertEqual(self.room.get_map_symbol(), "M")
        
        # Explored monster (cleared)
        self.room.content.defeated = True
        self.assertEqual(self.room.get_map_symbol(), "X")


class TestDungeonMap(unittest.TestCase):
    """Test DungeonMap functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.dungeon_map = DungeonMap(5, 5)
        
    def test_map_creation(self):
        """Test map initialization."""
        self.assertEqual(self.dungeon_map.width, 5)
        self.assertEqual(self.dungeon_map.height, 5)
        self.assertEqual(self.dungeon_map.current_position, (2, 2))
        self.assertEqual(len(self.dungeon_map.rooms), 0)
        
    def test_floor_generation(self):
        """Test dungeon floor generation."""
        self.dungeon_map.generate_floor(min_rooms=8, max_rooms=12)
        
        # Check room count
        self.assertGreaterEqual(len(self.dungeon_map.rooms), 8)
        self.assertLessEqual(len(self.dungeon_map.rooms), 12)
        
        # Check starting room
        start_room = self.dungeon_map.rooms.get((2, 2))
        self.assertIsNotNone(start_room)
        self.assertEqual(start_room.state, RoomState.CURRENT)
        
        # Check stairs placement
        self.assertIsNotNone(self.dungeon_map.stairs_position)
        self.assertIn(self.dungeon_map.stairs_position, self.dungeon_map.rooms)
        
        # Check all rooms are connected
        for room in self.dungeon_map.rooms.values():
            self.assertTrue(any(room.has_connection(d) for d in Direction))
            
    def test_movement(self):
        """Test movement mechanics."""
        # Create a simple map
        room1 = Room(2, 2)
        room1.state = RoomState.CURRENT
        room2 = Room(2, 1)
        
        room1.connect(Direction.NORTH)
        room2.connect(Direction.SOUTH)
        
        self.dungeon_map.rooms = {
            (2, 2): room1,
            (2, 1): room2
        }
        self.dungeon_map.current_position = (2, 2)
        
        # Test valid movement
        self.assertTrue(self.dungeon_map.move(Direction.NORTH))
        self.assertEqual(self.dungeon_map.current_position, (2, 1))
        self.assertEqual(room1.state, RoomState.EXPLORED)
        self.assertEqual(room2.state, RoomState.CURRENT)
        
        # Test invalid movement (no connection)
        self.assertFalse(self.dungeon_map.move(Direction.EAST))
        self.assertEqual(self.dungeon_map.current_position, (2, 1))
        
    def test_available_directions(self):
        """Test getting available directions."""
        room = Room(2, 2)
        room.state = RoomState.CURRENT
        room.connect(Direction.NORTH)
        room.connect(Direction.EAST)
        
        self.dungeon_map.rooms = {(2, 2): room}
        self.dungeon_map.current_position = (2, 2)
        
        directions = self.dungeon_map.get_available_directions()
        self.assertEqual(set(directions), {Direction.NORTH, Direction.EAST})
        
    def test_map_rendering(self):
        """Test basic map rendering."""
        # Create a simple 2-room map
        room1 = Room(1, 1)
        room1.state = RoomState.CURRENT
        room1.connect(Direction.EAST)
        
        room2 = Room(2, 1)
        room2.state = RoomState.UNEXPLORED
        room2.connect(Direction.WEST)
        
        self.dungeon_map.rooms = {
            (1, 1): room1,
            (2, 1): room2
        }
        self.dungeon_map.current_position = (1, 1)
        
        # Render map
        lines = self.dungeon_map.render()
        
        # Check that rooms appear
        self.assertTrue(any("[@]" in line for line in lines))
        self.assertTrue(any("[?]" in line for line in lines))
        # Check connection
        self.assertTrue(any("-" in line for line in lines))


if __name__ == '__main__':
    unittest.main()
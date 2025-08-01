"""
Dungeon map system for The Shadowed Keep.
"""
import random
from enum import Enum
from typing import Dict, Tuple, Optional, List


class Direction(Enum):
    """Cardinal directions for movement."""
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"
    
    @property
    def opposite(self):
        """Get the opposite direction."""
        opposites = {
            Direction.NORTH: Direction.SOUTH,
            Direction.SOUTH: Direction.NORTH,
            Direction.EAST: Direction.WEST,
            Direction.WEST: Direction.EAST
        }
        return opposites[self]
    
    @property
    def delta(self) -> Tuple[int, int]:
        """Get the coordinate change for this direction."""
        deltas = {
            Direction.NORTH: (0, -1),
            Direction.SOUTH: (0, 1),
            Direction.EAST: (1, 0),
            Direction.WEST: (-1, 0)
        }
        return deltas[self]


class RoomState(Enum):
    """State of a room on the map."""
    UNEXPLORED = "unexplored"
    EXPLORED = "explored"
    CURRENT = "current"


class Room:
    """Represents a room in the dungeon."""
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
        self.state = RoomState.UNEXPLORED
        self.connections: Dict[Direction, bool] = {}
        self.content = None  # RoomContent instance
        self.symbol = "?"  # Symbol to display on map
        
    @property
    def position(self) -> Tuple[int, int]:
        """Get the room's position as a tuple."""
        return (self.x, self.y)
        
    def connect(self, direction: Direction):
        """Create a connection in the given direction."""
        self.connections[direction] = True
        
    def has_connection(self, direction: Direction) -> bool:
        """Check if there's a connection in the given direction."""
        return self.connections.get(direction, False)
        
    def get_map_symbol(self) -> str:
        """Get the symbol to display on the map."""
        if self.state == RoomState.CURRENT:
            return "@"
        elif self.state == RoomState.UNEXPLORED:
            return "?"
        else:  # EXPLORED
            if self.content is None:
                return "."
            
            from room_content import RoomContentType
            
            # Show different symbols based on content type and whether it's cleared
            if self.content.content_type == RoomContentType.EMPTY:
                return "."
            elif self.content.content_type == RoomContentType.MONSTER:
                return "X" if self.content.is_cleared() else "M"
            elif self.content.content_type == RoomContentType.TREASURE:
                return "x" if self.content.is_cleared() else "$"
            elif self.content.content_type == RoomContentType.EQUIPMENT:
                return "x" if self.content.is_cleared() else "E"
            elif self.content.content_type == RoomContentType.STAIRS:
                return ">"
            elif self.content.content_type == RoomContentType.MERCHANT:
                return "S"  # Shop
            elif self.content.content_type == RoomContentType.HEALING_FOUNTAIN:
                return "~" if not self.content.is_cleared() else "."
            elif self.content.content_type == RoomContentType.TRAP:
                return "!" if not self.content.is_cleared() else "x"
            elif self.content.content_type == RoomContentType.BOSS:
                return "B" if not self.content.is_cleared() else "X"
            else:
                return "."


class DungeonMap:
    """Manages the dungeon map layout and navigation."""
    
    def __init__(self, width: int = 5, height: int = 5):
        self.width = width
        self.height = height
        self.rooms: Dict[Tuple[int, int], Room] = {}
        self.current_position: Tuple[int, int] = (width // 2, height // 2)
        self.stairs_position: Optional[Tuple[int, int]] = None
        
    def generate_floor(self, min_rooms: int = 8, max_rooms: int = 12):
        """Generate a new dungeon floor with connected rooms."""
        # Start from center
        start_x, start_y = self.width // 2, self.height // 2
        start_room = Room(start_x, start_y)
        start_room.state = RoomState.CURRENT
        self.rooms[start_room.position] = start_room
        
        # Generate connected rooms
        room_count = random.randint(min_rooms, max_rooms)
        attempts = 0
        
        while len(self.rooms) < room_count and attempts < 100:
            attempts += 1
            
            # Pick a random existing room to expand from
            existing_rooms = list(self.rooms.values())
            base_room = random.choice(existing_rooms)
            
            # Try to add a room in a random direction
            directions = list(Direction)
            random.shuffle(directions)
            
            for direction in directions:
                dx, dy = direction.delta
                new_x = base_room.x + dx
                new_y = base_room.y + dy
                
                # Check bounds
                if not (0 <= new_x < self.width and 0 <= new_y < self.height):
                    continue
                    
                # Check if room already exists
                if (new_x, new_y) in self.rooms:
                    continue
                    
                # Create new room
                new_room = Room(new_x, new_y)
                self.rooms[new_room.position] = new_room
                
                # Connect rooms
                base_room.connect(direction)
                new_room.connect(direction.opposite)
                
                break
        
        # Place stairs in a room far from start
        farthest_room = max(self.rooms.values(), 
                           key=lambda r: abs(r.x - start_x) + abs(r.y - start_y))
        self.stairs_position = farthest_room.position
        
    def get_current_room(self) -> Room:
        """Get the room at the current position."""
        return self.rooms[self.current_position]
        
    def move(self, direction: Direction) -> bool:
        """
        Attempt to move in the given direction.
        Returns True if successful, False otherwise.
        """
        current_room = self.get_current_room()
        
        # Check if there's a connection
        if not current_room.has_connection(direction):
            return False
            
        # Calculate new position
        dx, dy = direction.delta
        new_x = current_room.x + dx
        new_y = current_room.y + dy
        new_pos = (new_x, new_y)
        
        # Move to the new room
        if new_pos in self.rooms:
            current_room.state = RoomState.EXPLORED
            self.current_position = new_pos
            new_room = self.rooms[new_pos]
            new_room.state = RoomState.CURRENT
            return True
            
        return False
        
    def get_available_directions(self) -> List[Direction]:
        """Get list of available directions from current room."""
        current_room = self.get_current_room()
        return [d for d in Direction if current_room.has_connection(d)]
        
    def render(self) -> List[str]:
        """Render the map as ASCII art."""
        # Create a grid for the map
        grid_width = self.width * 4 - 1  # Room + connections
        grid_height = self.height * 2 - 1
        grid = [[" " for _ in range(grid_width)] for _ in range(grid_height)]
        
        # Draw rooms and connections
        for room in self.rooms.values():
            # Calculate grid position
            grid_x = room.x * 4
            grid_y = room.y * 2
            
            # Draw room
            symbol = room.get_map_symbol()
            # Stairs symbol is now handled by room content
                
            grid[grid_y][grid_x:grid_x+3] = f"[{symbol}]"
            
            # Draw connections
            if room.has_connection(Direction.NORTH) and grid_y > 0:
                grid[grid_y - 1][grid_x + 1] = "|"
            if room.has_connection(Direction.SOUTH) and grid_y < grid_height - 1:
                grid[grid_y + 1][grid_x + 1] = "|"
            if room.has_connection(Direction.EAST) and grid_x < grid_width - 1:
                grid[grid_y][grid_x + 3] = "-"
            if room.has_connection(Direction.WEST) and grid_x > 0:
                grid[grid_y][grid_x - 1] = "-"
                
        # Convert grid to strings
        return ["".join(row) for row in grid]
        
    def render_with_legend(self) -> List[str]:
        """Render the map with a legend."""
        map_lines = self.render()
        
        # Add border
        width = max(len(line) for line in map_lines)
        border = "=" * (width + 4)
        
        result = [border]
        result.append("| " + "MAP".center(width) + " |")
        result.append(border)
        
        for line in map_lines:
            result.append("| " + line.ljust(width) + " |")
            
        result.append(border)
        result.append("| Legend:".ljust(width + 2) + " |")
        result.append("| @ - You".ljust(width + 2) + " |")
        result.append("| ? - Unexplored".ljust(width + 2) + " |")
        result.append("| . - Empty".ljust(width + 2) + " |")
        result.append("| M/X - Monster/Cleared".ljust(width + 2) + " |")
        result.append("| $/x - Treasure/Looted".ljust(width + 2) + " |")
        result.append("| E/x - Equipment/Taken".ljust(width + 2) + " |")
        result.append("| S - Merchant Shop".ljust(width + 2) + " |")
        result.append("| ~ - Healing Fountain".ljust(width + 2) + " |")
        result.append("| ! - Trap (dangerous!)".ljust(width + 2) + " |")
        result.append("| B - Boss (very dangerous!)".ljust(width + 2) + " |")
        result.append("| > - Stairs".ljust(width + 2) + " |")
        result.append(border)
        
        return result
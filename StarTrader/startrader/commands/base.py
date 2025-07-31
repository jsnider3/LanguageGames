"""
Base command handler with common functionality.
"""

class BaseCommandHandler:
    """Base class for command handlers with common functionality."""
    
    def __init__(self, game):
        self.game = game
        self.player = game.player
        self.galaxy = game.galaxy
        
    def validate_command(self, parts, min_args, usage_msg):
        """Validate command has minimum arguments. Returns True if valid."""
        if len(parts) < min_args:
            print(f"Invalid format. Use: {usage_msg}")
            return False
        return True
    
    def parse_quantity(self, parts, default=None):
        """Parse quantity from command parts. Returns (item_name, quantity) or (None, None) on error."""
        try:
            quantity = int(parts[-1])
            item_name = " ".join(parts[1:-1])
            return item_name, quantity
        except (ValueError, IndexError):
            if default is not None:
                item_name = " ".join(parts[1:])
                return item_name, default
            print("Invalid format. The last part of the command must be a number.")
            return None, None
    
    def get_current_system(self):
        """Get the current star system."""
        return self.player.location
    
    def get_current_ship(self):
        """Get the player's current ship."""
        return self.player.ship
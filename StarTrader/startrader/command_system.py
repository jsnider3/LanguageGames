"""
Command system with metadata and registry for Star Trader.

Provides a structured way to define, register, and execute game commands
with proper validation, help text, and categorization.
"""

from typing import Dict, List, Callable, Optional, Any, TYPE_CHECKING
from dataclasses import dataclass
from enum import Enum
import inspect

if TYPE_CHECKING:
    from .main import Game


class CommandCategory(Enum):
    """Categories for organizing commands."""
    GAME = "game"
    TRADING = "trading"
    NAVIGATION = "navigation"
    SHIP = "ship"
    CREW = "crew"
    MISSIONS = "missions"
    PRODUCTION = "production"
    FACTORY = "factory"
    AI_CAPTAINS = "ai_captains"
    ANALYSIS = "analysis"
    EXPLORATION = "exploration"
    COMBAT = "combat"


@dataclass
class CommandMetadata:
    """Metadata for a game command."""
    name: str
    aliases: List[str]
    category: CommandCategory
    description: str
    usage: str
    examples: List[str]
    min_args: int = 1
    max_args: Optional[int] = None
    requires_location: bool = False
    requires_ship: bool = False
    requires_credits: Optional[int] = None
    requires_fuel: Optional[int] = None
    requires_cargo_space: Optional[int] = None
    dangerous: bool = False
    admin_only: bool = False


class Command:
    """Base class for game commands."""
    
    def __init__(self, metadata: CommandMetadata, handler: Callable):
        """Initialize the command.
        
        Args:
            metadata: Command metadata
            handler: Function to execute the command
        """
        self.metadata = metadata
        self.handler = handler
    
    def can_execute(self, game: 'Game', parts: List[str]) -> tuple[bool, Optional[str]]:
        """Check if this command can be executed.
        
        Args:
            game: The game instance
            parts: Command parts
            
        Returns:
            Tuple of (can_execute, error_message)
        """
        # Check argument count
        if len(parts) < self.metadata.min_args:
            return False, f"Not enough arguments. Usage: {self.metadata.usage}"
            
        if self.metadata.max_args and len(parts) > self.metadata.max_args:
            return False, f"Too many arguments. Usage: {self.metadata.usage}"
        
        # Check requirements
        if self.metadata.requires_location and not game.player.location:
            return False, "You must be at a location to use this command."
            
        if self.metadata.requires_ship and not game.player.ship:
            return False, "You need a ship to use this command."
            
        if self.metadata.requires_credits and game.player.credits < self.metadata.requires_credits:
            return False, f"You need at least {self.metadata.requires_credits} credits."
            
        if self.metadata.requires_fuel and game.player.ship.fuel < self.metadata.requires_fuel:
            return False, f"You need at least {self.metadata.requires_fuel} fuel."
            
        if (self.metadata.requires_cargo_space and 
            game.player.ship.get_cargo_used() > game.player.ship.cargo_capacity - self.metadata.requires_cargo_space):
            return False, f"You need at least {self.metadata.requires_cargo_space} free cargo space."
            
        return True, None
    
    def execute(self, game: 'Game', parts: List[str]) -> None:
        """Execute the command.
        
        Args:
            game: The game instance
            parts: Command parts
        """
        can_execute, error = self.can_execute(game, parts)
        if not can_execute:
            print(f"Cannot execute command: {error}")
            return
            
        # Execute the command
        try:
            # Check if handler expects game parameter
            sig = inspect.signature(self.handler)
            if 'game' in sig.parameters:
                self.handler(game, parts)
            else:
                self.handler(parts)
        except Exception as e:
            print(f"Error executing command '{self.metadata.name}': {e}")
            if game.constants.get("DEBUG_MODE", False):
                import traceback
                traceback.print_exc()


class CommandRegistry:
    """Central registry for all game commands."""
    
    def __init__(self):
        """Initialize the command registry."""
        self.commands: Dict[str, Command] = {}
        self.aliases: Dict[str, str] = {}
        self.categories: Dict[CommandCategory, List[Command]] = {
            category: [] for category in CommandCategory
        }
    
    def register(self, command: Command) -> None:
        """Register a command.
        
        Args:
            command: The command to register
        """
        # Register main command name
        self.commands[command.metadata.name] = command
        self.categories[command.metadata.category].append(command)
        
        # Register aliases
        for alias in command.metadata.aliases:
            self.aliases[alias] = command.metadata.name
    
    def unregister(self, name: str) -> None:
        """Remove a command from the registry.
        
        Args:
            name: Name of the command to remove
        """
        if name in self.commands:
            command = self.commands[name]
            
            # Remove from commands
            del self.commands[name]
            
            # Remove from category
            if command in self.categories[command.metadata.category]:
                self.categories[command.metadata.category].remove(command)
                
            # Remove aliases
            aliases_to_remove = [alias for alias, cmd_name in self.aliases.items() if cmd_name == name]
            for alias in aliases_to_remove:
                del self.aliases[alias]
    
    def get_command(self, name: str) -> Optional[Command]:
        """Get a command by name or alias.
        
        Args:
            name: Command name or alias
            
        Returns:
            The command if found, None otherwise
        """
        # Check if it's a direct command
        if name in self.commands:
            return self.commands[name]
            
        # Check if it's an alias
        if name in self.aliases:
            return self.commands[self.aliases[name]]
            
        return None
    
    def execute_command(self, game: 'Game', command_line: str) -> bool:
        """Execute a command from a command line.
        
        Args:
            game: The game instance
            command_line: The full command line
            
        Returns:
            True if command was found and executed, False otherwise
        """
        parts = command_line.strip().split()
        if not parts:
            return False
            
        command_name = parts[0].lower()
        command = self.get_command(command_name)
        
        if not command:
            return False
            
        command.execute(game, parts)
        return True
    
    def get_commands_by_category(self, category: CommandCategory) -> List[Command]:
        """Get all commands in a category.
        
        Args:
            category: The category to get commands for
            
        Returns:
            List of commands in the category
        """
        return self.categories[category].copy()
    
    def get_all_commands(self) -> List[Command]:
        """Get all registered commands.
        
        Returns:
            List of all commands
        """
        return list(self.commands.values())
    
    def get_help_text(self, command_name: str) -> Optional[str]:
        """Get help text for a command.
        
        Args:
            command_name: Name of the command
            
        Returns:
            Help text or None if command not found
        """
        command = self.get_command(command_name)
        if not command:
            return None
            
        help_text = f"{command.metadata.name}: {command.metadata.description}\n"
        help_text += f"Usage: {command.metadata.usage}\n"
        
        if command.metadata.aliases:
            help_text += f"Aliases: {', '.join(command.metadata.aliases)}\n"
            
        if command.metadata.examples:
            help_text += f"Examples:\n"
            for example in command.metadata.examples:
                help_text += f"  {example}\n"
                
        return help_text
    
    def get_category_help(self, category: CommandCategory) -> str:
        """Get help text for all commands in a category.
        
        Args:
            category: The category to get help for
            
        Returns:
            Formatted help text
        """
        commands = self.get_commands_by_category(category)
        if not commands:
            return f"No commands found in category: {category.value}"
            
        help_text = f"\n--- {category.value.upper()} COMMANDS ---\n"
        
        for command in sorted(commands, key=lambda c: c.metadata.name):
            help_text += f"{command.metadata.name:15} - {command.metadata.description}\n"
            
        return help_text
    
    def get_all_help(self) -> str:
        """Get help text for all commands organized by category.
        
        Returns:
            Formatted help text
        """
        help_text = "\n--- STAR TRADER COMMANDS ---\n"
        help_text += "Use 'help <command>' for detailed information about a specific command.\n"
        
        for category in CommandCategory:
            commands = self.get_commands_by_category(category)
            if commands:
                help_text += f"\n{category.value.upper()}:\n"
                command_names = [cmd.metadata.name for cmd in commands]
                help_text += f"  {', '.join(sorted(command_names))}\n"
                
        return help_text


def create_command(name: str, 
                  handler: Callable,
                  category: CommandCategory,
                  description: str,
                  usage: str,
                  aliases: Optional[List[str]] = None,
                  examples: Optional[List[str]] = None,
                  **kwargs) -> Command:
    """Helper function to create a command with metadata.
    
    Args:
        name: Command name
        handler: Function to handle the command
        category: Command category
        description: Short description
        usage: Usage string
        aliases: List of command aliases
        examples: List of usage examples
        **kwargs: Additional metadata arguments
        
    Returns:
        Created command
    """
    metadata = CommandMetadata(
        name=name,
        aliases=aliases or [],
        category=category,
        description=description,
        usage=usage,
        examples=examples or [],
        **kwargs
    )
    
    return Command(metadata, handler)
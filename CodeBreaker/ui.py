"""
Terminal UI System for CodeBreaker
Handles all visual rendering and formatting with robust error handling.
"""

import os
import sys
import logging
from typing import List, Optional, Dict, Any
from enum import Enum


# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


class UIConstants:
    """Constants for UI configuration."""

    # Display dimensions
    DEFAULT_WIDTH = 80
    MIN_WIDTH = 40
    MAX_WIDTH = 120

    # Content limits
    MAX_VALUE_DISPLAY_LENGTH = 50
    TRUNCATION_SUFFIX = "..."

    # Progress bar
    PROGRESS_BAR_LENGTH = 40

    # Line numbering
    LINE_NUMBER_WIDTH = 2

    # Word wrap
    WORD_WRAP_MARGIN = 4

    # Box drawing
    MIN_BOX_WIDTH = 20
    BOX_PADDING = 4

    # Symbols
    FILLED_STAR = '★'
    EMPTY_STAR = '☆'
    INFO_SYMBOL = 'ℹ '
    SUCCESS_SYMBOL = '✓ '
    HINT_SYMBOL = '💡 '
    PROGRESS_FILLED = '█'
    PROGRESS_EMPTY = '░'

    # Confirmation responses
    CONFIRM_POSITIVE = ['y', 'yes']
    CONFIRM_NEGATIVE = ['n', 'no']


class Color(Enum):
    """ANSI color codes."""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    # Foreground colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

    # Bright foreground colors
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'

    # Background colors
    BG_BLACK = '\033[40m'
    BG_CYAN = '\033[46m'


class UI:
    """Terminal UI manager for CodeBreaker."""

    def __init__(self, width: int = UIConstants.DEFAULT_WIDTH):
        """
        Initialize UI manager.

        Args:
            width: Terminal width (default 80)
        """
        if not isinstance(width, int):
            logger.warning(f"Invalid width type: {type(width)}, using default")
            width = UIConstants.DEFAULT_WIDTH

        # Clamp width to valid range
        self.width = max(
            UIConstants.MIN_WIDTH,
            min(width, UIConstants.MAX_WIDTH)
        )

        self.syntax_highlighting_enabled = False
        logger.info(f"UI initialized with width={self.width}")

    def clear_screen(self) -> None:
        """Clear the terminal screen."""
        try:
            os.system('clear' if os.name != 'nt' else 'cls')
        except Exception as e:
            logger.error(f"Error clearing screen: {e}")

    def print_header(self) -> None:
        """Print the game header."""
        try:
            print(Color.CYAN.value + Color.BOLD.value)
            print("╔" + "═" * (self.width - 2) + "╗")
            print("║" + "CODEBREAKER v1.0".center(self.width - 2) + "║")
            print("║" + "Xenolinguistic Analysis Terminal".center(self.width - 2) + "║")
            print("╚" + "═" * (self.width - 2) + "╝")
            print(Color.RESET.value)
        except Exception as e:
            logger.error(f"Error printing header: {e}")
            print("CODEBREAKER v1.0")

    def print_title(self, title: str) -> None:
        """
        Print a section title.

        Args:
            title: Title text to display
        """
        if not isinstance(title, str):
            logger.warning(f"Invalid title type: {type(title)}")
            title = str(title)

        try:
            print(Color.YELLOW.value + Color.BOLD.value)
            print(f"\n[{title}]")
            print("━" * self.width)
            print(Color.RESET.value)
        except Exception as e:
            logger.error(f"Error printing title: {e}")
            print(f"\n[{title}]")

    def print_code(self, code: str, highlight_lines: Optional[List[int]] = None):
        """Print Xenocode with line numbers."""
        lines = code.split('\n')

        for i, line in enumerate(lines, 1):
            line_num = f"{i:02d}: "

            # Highlight specific lines if requested
            if highlight_lines and i in highlight_lines:
                print(Color.BG_CYAN.value + Color.BLACK.value, end='')

            # Apply syntax highlighting if enabled
            if self.syntax_highlighting_enabled:
                formatted_line = self._syntax_highlight(line)
            else:
                formatted_line = line

            print(f"{Color.BRIGHT_BLACK.value}{line_num}{Color.RESET.value}{formatted_line}")

    def _syntax_highlight(self, line: str) -> str:
        """Apply syntax highlighting to a line of Xenocode."""
        # Keywords
        keywords = ['§begin', '§end', '§iterate', '§end_iterate', '§if', '§else', '§end_if',
                   '§transmit', '§receive', '§function', '§end_function', '§call',
                   '§create_map', '§create_array', '§exists', '§null', '§in', '§true', '§false']

        for keyword in keywords:
            if keyword in line:
                line = line.replace(keyword, f"{Color.CYAN.value}{keyword}{Color.RESET.value}")

        # Operators
        operators = ['⊕', '⊖', '⊛', '⊗', '⊘', '≈', '¬', '←']
        for op in operators:
            if op in line:
                line = line.replace(op, f"{Color.MAGENTA.value}{op}{Color.RESET.value}")

        # Strings
        if '"' in line:
            parts = line.split('"')
            for i in range(1, len(parts), 2):
                parts[i] = f"{Color.GREEN.value}{parts[i]}{Color.RESET.value}"
            line = '"'.join(parts)

        return line

    def print_separator(self):
        """Print a horizontal separator."""
        print(Color.BRIGHT_BLACK.value + "━" * self.width + Color.RESET.value)

    def print_output(self, output: List[str]):
        """Print program output."""
        print(Color.GREEN.value + Color.BOLD.value + "\n[OUTPUT]" + Color.RESET.value)
        if output:
            for line in output:
                print(Color.GREEN.value + "  " + str(line) + Color.RESET.value)
        else:
            print(Color.DIM.value + "  (no output)" + Color.RESET.value)

    def print_trace(self, trace: List[str]):
        """Print execution trace."""
        print(Color.BLUE.value + Color.BOLD.value + "\n[EXECUTION TRACE]" + Color.RESET.value)
        if trace:
            for line in trace:
                print(Color.BLUE.value + "  " + line + Color.RESET.value)
        else:
            print(Color.DIM.value + "  (tracing disabled)" + Color.RESET.value)

    def print_error(self, error: str):
        """Print an error message."""
        print(Color.RED.value + Color.BOLD.value + "\n[ERROR]" + Color.RESET.value)
        print(Color.RED.value + "  " + error + Color.RESET.value)

    def print_success(self, message: str):
        """Print a success message."""
        print(Color.GREEN.value + Color.BOLD.value + "\n✓ " + message + Color.RESET.value)

    def print_info(self, message: str):
        """Print an info message."""
        print(Color.CYAN.value + "ℹ " + message + Color.RESET.value)

    def print_hint(self, hint: str):
        """Print a hint."""
        print(Color.YELLOW.value + Color.BOLD.value + "\n[HINT]" + Color.RESET.value)
        print(Color.YELLOW.value + "  💡 " + hint + Color.RESET.value)

    def print_menu(self, options: List[str]):
        """Print a menu of options."""
        print(Color.CYAN.value + "\nCommands: " + Color.RESET.value, end='')
        print(Color.BRIGHT_WHITE.value + " | ".join(options) + Color.RESET.value)

    def print_prompt(self, prompt: str = ">"):
        """Print input prompt."""
        print(Color.BRIGHT_CYAN.value + "\n" + prompt + " " + Color.RESET.value, end='')

    def get_input(self, prompt: str = ">") -> str:
        """Get user input with prompt."""
        self.print_prompt(prompt)
        return input().strip()

    def print_box(self, title: str, content: List[str], color: Color = Color.CYAN):
        """Print content in a box."""
        max_len = max(len(line) for line in content) if content else 20
        box_width = min(max_len + 4, self.width - 4)

        print(color.value)
        print("┌─" + title + "─" + "─" * (box_width - len(title) - 2) + "┐")
        for line in content:
            padding = box_width - len(line) - 2
            print("│ " + line + " " * padding + "│")
        print("└" + "─" * box_width + "┘")
        print(Color.RESET.value)

    def print_variables(self, variables: Dict[str, Any]) -> None:
        """
        Print variable state.

        Args:
            variables: Dictionary of variables to display
        """
        if not isinstance(variables, dict):
            logger.warning(f"Invalid variables type: {type(variables)}")
            variables = {}

        try:
            print(Color.MAGENTA.value + Color.BOLD.value + "\n[VARIABLES]" + Color.RESET.value)

            if variables:
                for name, value in variables.items():
                    value_str = str(value)
                    if len(value_str) > UIConstants.MAX_VALUE_DISPLAY_LENGTH:
                        truncate_len = UIConstants.MAX_VALUE_DISPLAY_LENGTH - len(UIConstants.TRUNCATION_SUFFIX)
                        value_str = value_str[:truncate_len] + UIConstants.TRUNCATION_SUFFIX

                    print(Color.MAGENTA.value + f"  {name} = {value_str}" + Color.RESET.value)
            else:
                print(Color.DIM.value + "  (no variables)" + Color.RESET.value)

        except Exception as e:
            logger.error(f"Error printing variables: {e}")
            print("(error displaying variables)")

    def print_puzzle_info(self, puzzle: Dict[str, Any]) -> None:
        """
        Print puzzle metadata.

        Args:
            puzzle: Puzzle dictionary
        """
        if not isinstance(puzzle, dict):
            logger.error(f"Invalid puzzle type: {type(puzzle)}")
            return

        try:
            puzzle_id = puzzle.get('id', 'unknown')
            puzzle_num = puzzle_id.split('_')[1] if '_' in puzzle_id else '??'
            title = puzzle.get('title', 'Untitled')
            difficulty = puzzle.get('difficulty', 1)
            arc = puzzle.get('arc')

            print(Color.YELLOW.value)
            print(f"\n┌─ PUZZLE #{puzzle_num} ─────────────────────────")
            print(f"│ Title: {title}")

            # Difficulty stars
            filled_stars = UIConstants.FILLED_STAR * difficulty
            empty_stars = UIConstants.EMPTY_STAR * (5 - difficulty)
            print(f"│ Difficulty: {filled_stars}{empty_stars}")

            if arc:
                print(f"│ Arc: {arc}")

            print("└" + "─" * (self.width - 1))
            print(Color.RESET.value)

        except Exception as e:
            logger.error(f"Error printing puzzle info: {e}")
            print("\n[PUZZLE]")

    def print_narrative(self, text: str):
        """Print narrative/story text."""
        print(Color.BRIGHT_YELLOW.value + Color.DIM.value)
        # Word wrap
        words = text.split()
        line = ""
        for word in words:
            if len(line) + len(word) + 1 > self.width - 4:
                print("  " + line)
                line = word
            else:
                line += (" " if line else "") + word
        if line:
            print("  " + line)
        print(Color.RESET.value)

    def print_progress(
        self,
        current: int,
        total: int,
        unlocked_tools: List[str]
    ) -> None:
        """
        Print overall progress.

        Args:
            current: Number of puzzles completed
            total: Total number of puzzles
            unlocked_tools: List of unlocked tool names
        """
        if not isinstance(current, int) or not isinstance(total, int):
            logger.error("Invalid progress values")
            return

        if total == 0:
            logger.warning("Total puzzles is 0")
            percentage = 0
            filled = 0
        else:
            percentage = (current / total) * 100
            filled = int(UIConstants.PROGRESS_BAR_LENGTH * current / total)

        try:
            bar = (UIConstants.PROGRESS_FILLED * filled +
                   UIConstants.PROGRESS_EMPTY * (UIConstants.PROGRESS_BAR_LENGTH - filled))

            print(Color.CYAN.value + Color.BOLD.value)
            print(f"\n╔══ PROGRESS {'═' * (self.width - 15)}╗")
            print(f"║ Puzzles: {current}/{total} ({percentage:.0f}%)")
            print(f"║ {bar}")

            if unlocked_tools:
                tools_str = ', '.join(unlocked_tools)
                print(f"║ Tools Unlocked: {tools_str}")

            print("╚" + "═" * (self.width - 2) + "╝")
            print(Color.RESET.value)

        except Exception as e:
            logger.error(f"Error printing progress: {e}")
            print(f"\nProgress: {current}/{total}")

    def print_ascii_art(self, art: str) -> None:
        """
        Print ASCII art.

        Args:
            art: ASCII art string to display
        """
        if not isinstance(art, str):
            logger.warning(f"Invalid art type: {type(art)}")
            return

        try:
            print(Color.BRIGHT_CYAN.value)
            print(art)
            print(Color.RESET.value)
        except Exception as e:
            logger.error(f"Error printing ASCII art: {e}")

    def confirm(self, message: str) -> bool:
        """
        Ask for yes/no confirmation.

        Args:
            message: Confirmation message

        Returns:
            True if confirmed, False otherwise
        """
        if not isinstance(message, str):
            logger.warning(f"Invalid message type: {type(message)}")
            message = str(message)

        try:
            response = self.get_input(f"{message} (y/n)")
            return response.lower() in UIConstants.CONFIRM_POSITIVE
        except Exception as e:
            logger.error(f"Error in confirmation: {e}")
            return False

    def pause(self) -> None:
        """Wait for user to press enter."""
        try:
            self.get_input("\nPress Enter to continue...")
        except Exception as e:
            logger.error(f"Error in pause: {e}")

    def enable_syntax_highlighting(self) -> None:
        """Enable syntax highlighting."""
        self.syntax_highlighting_enabled = True
        logger.debug("Syntax highlighting enabled")

    def disable_syntax_highlighting(self) -> None:
        """Disable syntax highlighting."""
        self.syntax_highlighting_enabled = False
        logger.debug("Syntax highlighting disabled")
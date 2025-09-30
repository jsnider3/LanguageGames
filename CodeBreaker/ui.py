"""
Terminal UI System for CodeBreaker
Handles all visual rendering and formatting.
"""

import os
import sys
from typing import List, Optional, Dict, Any
from enum import Enum


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

    def __init__(self):
        self.width = 80
        self.syntax_highlighting_enabled = False

    def clear_screen(self):
        """Clear the terminal screen."""
        os.system('clear' if os.name != 'nt' else 'cls')

    def print_header(self):
        """Print the game header."""
        print(Color.CYAN.value + Color.BOLD.value)
        print("╔" + "═" * (self.width - 2) + "╗")
        print("║" + "CODEBREAKER v1.0".center(self.width - 2) + "║")
        print("║" + "Xenolinguistic Analysis Terminal".center(self.width - 2) + "║")
        print("╚" + "═" * (self.width - 2) + "╝")
        print(Color.RESET.value)

    def print_title(self, title: str):
        """Print a section title."""
        print(Color.YELLOW.value + Color.BOLD.value)
        print(f"\n[{title}]")
        print("━" * self.width)
        print(Color.RESET.value)

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
        operators = ['⊕', '⊖', '⊗', '⊘', '≈', '¬', '←']
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

    def print_variables(self, variables: Dict[str, Any]):
        """Print variable state."""
        print(Color.MAGENTA.value + Color.BOLD.value + "\n[VARIABLES]" + Color.RESET.value)
        if variables:
            for name, value in variables.items():
                value_str = str(value)
                if len(value_str) > 50:
                    value_str = value_str[:47] + "..."
                print(Color.MAGENTA.value + f"  {name} = {value_str}" + Color.RESET.value)
        else:
            print(Color.DIM.value + "  (no variables)" + Color.RESET.value)

    def print_puzzle_info(self, puzzle: Dict[str, Any]):
        """Print puzzle metadata."""
        print(Color.YELLOW.value)
        print(f"\n┌─ PUZZLE #{puzzle['id'].split('_')[1]} ─────────────────────────")
        print(f"│ Title: {puzzle['title']}")
        print(f"│ Difficulty: {'★' * puzzle['difficulty']}{'☆' * (5 - puzzle['difficulty'])}")
        if puzzle.get('arc'):
            print(f"│ Arc: {puzzle['arc']}")
        print("└" + "─" * (self.width - 1))
        print(Color.RESET.value)

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

    def print_progress(self, current: int, total: int, unlocked_tools: List[str]):
        """Print overall progress."""
        percentage = (current / total) * 100
        bar_length = 40
        filled = int(bar_length * current / total)
        bar = "█" * filled + "░" * (bar_length - filled)

        print(Color.CYAN.value + Color.BOLD.value)
        print(f"\n╔══ PROGRESS {'═' * (self.width - 15)}╗")
        print(f"║ Puzzles: {current}/{total} ({percentage:.0f}%)")
        print(f"║ {bar}")
        if unlocked_tools:
            print(f"║ Tools Unlocked: {', '.join(unlocked_tools)}")
        print("╚" + "═" * (self.width - 2) + "╝")
        print(Color.RESET.value)

    def print_ascii_art(self, art: str):
        """Print ASCII art."""
        print(Color.BRIGHT_CYAN.value)
        print(art)
        print(Color.RESET.value)

    def confirm(self, message: str) -> bool:
        """Ask for yes/no confirmation."""
        response = self.get_input(f"{message} (y/n)")
        return response.lower() in ['y', 'yes']

    def pause(self):
        """Wait for user to press enter."""
        self.get_input("\nPress Enter to continue...")

    def enable_syntax_highlighting(self):
        """Enable syntax highlighting."""
        self.syntax_highlighting_enabled = True

    def disable_syntax_highlighting(self):
        """Disable syntax highlighting."""
        self.syntax_highlighting_enabled = False
"""
Notebook System
Player's personal notes and symbol dictionary.
"""

from typing import Dict, List, Any
from ui import UI, Color


class Notebook:
    """Manages player notes and symbol dictionary."""

    def __init__(self, ui: UI):
        self.ui = ui
        self.symbol_dictionary = self._init_symbol_dictionary()

    def _init_symbol_dictionary(self) -> Dict[str, Dict[str, str]]:
        """Initialize the symbol dictionary structure."""
        return {
            'keywords': {},
            'operators': {},
            'concepts': {}
        }

    def show_notes(self, notes: List[str], puzzle_id: str):
        """Display notes for current puzzle."""
        self.ui.clear_screen()
        self.ui.print_title(f"NOTEBOOK - {puzzle_id.upper()}")

        if notes:
            print(Color.YELLOW.value)
            for i, note in enumerate(notes, 1):
                print(f"  {i}. {note}")
            print(Color.RESET.value)
        else:
            print(Color.DIM.value + "  No notes yet for this puzzle." + Color.RESET.value)

        print("\n" + Color.CYAN.value + "[A]dd note | [V]iew all notes | [D]ictionary | [B]ack" + Color.RESET.value)

    def add_note_interactive(self, game_state, puzzle_id: str):
        """Interactive note adding."""
        self.ui.print_info("Enter your note (or 'cancel' to abort):")
        note = self.ui.get_input("Note")

        if note.lower() != 'cancel' and note:
            game_state.add_note(puzzle_id, note)
            self.ui.print_success("Note added!")

    def view_all_notes(self, all_notes: Dict[str, List[str]]):
        """View all notes across all puzzles."""
        self.ui.clear_screen()
        self.ui.print_title("ALL NOTES")

        if not all_notes:
            print(Color.DIM.value + "  No notes yet." + Color.RESET.value)
            return

        for puzzle_id in sorted(all_notes.keys()):
            notes = all_notes[puzzle_id]
            if notes:
                print(Color.YELLOW.value + Color.BOLD.value + f"\n{puzzle_id.upper()}:" + Color.RESET.value)
                for note in notes:
                    print(Color.YELLOW.value + f"  • {note}" + Color.RESET.value)

    def show_symbol_dictionary(self, discovered_symbols: Dict[str, str]):
        """Show the symbol dictionary."""
        self.ui.clear_screen()
        self.ui.print_title("SYMBOL DICTIONARY")

        print(Color.CYAN.value + Color.BOLD.value + "\n[KEYWORDS]" + Color.RESET.value)
        keywords = {
            '§begin / §end': 'Program block delimiters',
            '§transmit': 'Output command',
            '§receive': 'Input command',
            '§iterate / §end_iterate': 'Loop construct',
            '§if / §else / §end_if': 'Conditional branching',
            '§function / §end_function': 'Function definition',
            '§call': 'Function call',
            '§create_map': 'Create dictionary',
            '§create_array': 'Create list/array',
            '§exists': 'Check existence',
            '§in': 'Membership test',
            '§null': 'Null/None value',
            '§true / §false': 'Boolean values'
        }

        for symbol, meaning in keywords.items():
            discovered = any(k in discovered_symbols for k in symbol.split(' / '))
            if discovered:
                print(Color.GREEN.value + f"  ✓ {symbol:30} {meaning}" + Color.RESET.value)
            else:
                print(Color.DIM.value + f"  ? {symbol:30} ???" + Color.RESET.value)

        print(Color.MAGENTA.value + Color.BOLD.value + "\n[OPERATORS]" + Color.RESET.value)
        operators = {
            '←': 'Assignment',
            '⊕': 'Addition',
            '⊖': 'Subtraction',
            '⊛': 'Multiplication',
            '⊗': 'Greater than',
            '⊘': 'Less than',
            '≈': 'Equality check',
            '¬': 'Logical NOT'
        }

        for symbol, meaning in operators.items():
            if symbol in discovered_symbols or symbol in ['←']:
                print(Color.GREEN.value + f"  ✓ {symbol:30} {meaning}" + Color.RESET.value)
            else:
                print(Color.DIM.value + f"  ? {symbol:30} ???" + Color.RESET.value)

        print(Color.YELLOW.value + Color.BOLD.value + "\n[NOTES]" + Color.RESET.value)
        print(Color.YELLOW.value + "  • Symbols are revealed as you encounter them in puzzles" + Color.RESET.value)
        print(Color.YELLOW.value + "  • Pay attention to patterns and contexts" + Color.RESET.value)

    def discover_symbols_from_code(self, code: str, current_discoveries: Dict[str, str]) -> Dict[str, str]:
        """Auto-discover symbols present in code."""
        symbols_in_code = []

        # Keywords
        keywords = ['§begin', '§end', '§transmit', '§receive', '§iterate', '§if', '§else',
                   '§function', '§call', '§create_map', '§create_array', '§exists', '§in', '§null']
        for keyword in keywords:
            if keyword in code:
                symbols_in_code.append(keyword)

        # Operators
        operators = ['←', '⊕', '⊖', '⊛', '⊗', '⊘', '≈', '¬']
        for op in operators:
            if op in code:
                symbols_in_code.append(op)

        # Add to current discoveries
        for symbol in symbols_in_code:
            if symbol not in current_discoveries:
                current_discoveries[symbol] = 'seen'

        return current_discoveries
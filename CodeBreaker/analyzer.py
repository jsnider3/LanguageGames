"""
Analysis Tools
Advanced tools for code analysis.
"""

from typing import List, Dict, Any, Optional
from collections import Counter
import re
from ui import UI, Color
from xenocode_vm import XenocodeVM, TraceLevel


class Analyzer:
    """Provides analysis tools for Xenocode."""

    def __init__(self, ui: UI):
        self.ui = ui
        self.tools = {
            'syntax_highlighter': {
                'name': 'Syntax Highlighter',
                'description': 'Colors similar constructs in code',
                'unlocked_by': 'puzzle_03'
            },
            'symbol_dictionary': {
                'name': 'Symbol Dictionary',
                'description': 'Auto-populates with confirmed meanings',
                'unlocked_by': 'puzzle_05'
            },
            'execution_tracer': {
                'name': 'Execution Tracer',
                'description': 'Step through code line by line',
                'unlocked_by': 'puzzle_08'
            },
            'pattern_matcher': {
                'name': 'Pattern Matcher',
                'description': 'Find similar code across programs',
                'unlocked_by': 'puzzle_12'
            },
            'cross_reference': {
                'name': 'Cross-Reference Tool',
                'description': 'See which programs share functions',
                'unlocked_by': 'puzzle_15'
            },
            'behavior_comparator': {
                'name': 'Behavior Comparator',
                'description': 'Run multiple programs side-by-side',
                'unlocked_by': 'puzzle_20'
            },
            'code_generator': {
                'name': 'Code Generator',
                'description': 'Write your own Xenocode snippets',
                'unlocked_by': 'puzzle_25'
            },
            'decompiler': {
                'name': 'Decompiler',
                'description': 'See pseudocode translation',
                'unlocked_by': 'puzzle_35'
            }
        }

    def show_tools_menu(self, unlocked_tools: List[str]):
        """Show available analysis tools."""
        self.ui.print_title("ANALYSIS TOOLS")

        print(Color.CYAN.value + Color.BOLD.value + "\nUnlocked Tools:" + Color.RESET.value)
        for tool_id in unlocked_tools:
            if tool_id in self.tools:
                tool = self.tools[tool_id]
                print(Color.GREEN.value + f"  ✓ {tool['name']}: {tool['description']}" + Color.RESET.value)

        print(Color.DIM.value + Color.BOLD.value + "\nLocked Tools:" + Color.RESET.value)
        for tool_id, tool in self.tools.items():
            if tool_id not in unlocked_tools:
                unlock_puzzle = tool['unlocked_by']
                print(Color.DIM.value + f"  🔒 {tool['name']} (unlock at {unlock_puzzle})" + Color.RESET.value)

    def run_execution_tracer(self, code: str, inputs: Optional[List[Any]] = None):
        """Run code with detailed execution trace."""
        vm = XenocodeVM(trace_level=TraceLevel.DETAILED)
        result = vm.execute(code, inputs)

        self.ui.print_title("EXECUTION TRACE")

        if result['success']:
            self.ui.print_trace(result['trace'])
            self.ui.print_output(result['output'])
            self.ui.print_variables(result['variables'])
        else:
            self.ui.print_error(result['error'])
            if result['trace']:
                self.ui.print_trace(result['trace'])

    def run_pattern_matcher(self, pattern: str, all_puzzles: Dict[str, Dict[str, Any]]):
        """Find pattern across all programs."""
        self.ui.print_title(f"PATTERN MATCH: {pattern}")

        matches = []
        for puzzle_id, puzzle in all_puzzles.items():
            code = puzzle['code']
            if pattern in code:
                # Count occurrences
                count = code.count(pattern)
                matches.append((puzzle_id, puzzle['title'], count))

        if matches:
            print(Color.GREEN.value + f"\nFound in {len(matches)} programs:" + Color.RESET.value)
            for puzzle_id, title, count in sorted(matches, key=lambda x: x[2], reverse=True):
                print(Color.YELLOW.value + f"  • {puzzle_id}: {title} ({count}x)" + Color.RESET.value)
        else:
            print(Color.DIM.value + "  No matches found." + Color.RESET.value)

    def run_frequency_analysis(self, code: str):
        """Analyze symbol frequency in code."""
        self.ui.print_title("FREQUENCY ANALYSIS")

        # Find all symbols
        symbols = re.findall(r'§\w+|[⊕⊖⊗⊘≈¬←]', code)
        frequency = Counter(symbols)

        print(Color.MAGENTA.value + "\nSymbol Frequency:" + Color.RESET.value)
        for symbol, count in frequency.most_common():
            bar = "█" * min(count, 40)
            print(Color.CYAN.value + f"  {symbol:20} {bar} {count}" + Color.RESET.value)

    def run_decompiler(self, code: str):
        """Show pseudocode translation."""
        self.ui.print_title("PSEUDOCODE TRANSLATION")

        lines = code.split('\n')
        pseudocode = []

        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            # Translate to English-like pseudocode
            pseudo = line
            pseudo = pseudo.replace('§begin', 'BEGIN')
            pseudo = pseudo.replace('§end', 'END')
            pseudo = pseudo.replace('§transmit', 'OUTPUT')
            pseudo = pseudo.replace('§receive', 'INPUT')
            pseudo = pseudo.replace('§iterate', 'FOR EACH')
            pseudo = pseudo.replace('§end_iterate', 'END FOR')
            pseudo = pseudo.replace('§if', 'IF')
            pseudo = pseudo.replace('§else', 'ELSE')
            pseudo = pseudo.replace('§end_if', 'END IF')
            pseudo = pseudo.replace('§in', 'IN')
            pseudo = pseudo.replace('←', '=')
            pseudo = pseudo.replace('⊕', '+')
            pseudo = pseudo.replace('⊖', '-')
            pseudo = pseudo.replace('⊛', '*')
            pseudo = pseudo.replace('⊗', '>')
            pseudo = pseudo.replace('⊘', '<')
            pseudo = pseudo.replace('≈', '==')
            pseudo = pseudo.replace('¬', 'NOT')
            pseudo = pseudo.replace('§create_map', 'CREATE_DICTIONARY')
            pseudo = pseudo.replace('§create_array', 'CREATE_LIST')
            pseudo = pseudo.replace('§exists', 'EXISTS')
            pseudo = pseudo.replace('§null', 'NULL')

            pseudocode.append(pseudo)

        print(Color.YELLOW.value)
        for line in pseudocode:
            print(f"  {line}")
        print(Color.RESET.value)

        print(Color.DIM.value + "\n  Note: This is a rough translation. Verify your understanding!" + Color.RESET.value)

    def show_cross_reference(self, puzzle_id: str, all_puzzles: Dict[str, Dict[str, Any]]):
        """Show cross-references to other puzzles."""
        self.ui.print_title(f"CROSS-REFERENCE: {puzzle_id}")

        current_puzzle = all_puzzles.get(puzzle_id)
        if not current_puzzle:
            self.ui.print_error("Puzzle not found")
            return

        current_code = current_puzzle['code']

        # Find function definitions in current puzzle
        functions = re.findall(r'§function\s+(\w+)', current_code)

        if functions:
            print(Color.CYAN.value + "\nFunctions defined in this puzzle:" + Color.RESET.value)
            for func in functions:
                print(Color.YELLOW.value + f"  • {func}" + Color.RESET.value)

        # Find similar patterns in other puzzles
        print(Color.CYAN.value + "\nRelated puzzles (shared patterns):" + Color.RESET.value)

        # Extract key symbols from current puzzle
        current_symbols = set(re.findall(r'§\w+|[⊕⊖⊗⊘≈¬]', current_code))

        similarities = []
        for other_id, other_puzzle in all_puzzles.items():
            if other_id != puzzle_id:
                other_symbols = set(re.findall(r'§\w+|[⊕⊖⊗⊘≈¬]', other_puzzle['code']))
                common = len(current_symbols & other_symbols)
                if common > 3:  # Threshold for relevance
                    similarities.append((other_id, other_puzzle['title'], common))

        if similarities:
            for other_id, title, common in sorted(similarities, key=lambda x: x[2], reverse=True)[:5]:
                print(Color.YELLOW.value + f"  • {other_id}: {title} ({common} shared symbols)" + Color.RESET.value)
        else:
            print(Color.DIM.value + "  No strongly related puzzles found." + Color.RESET.value)
#!/usr/bin/env python3
"""
CodeBreaker - Main Game Loop
A reverse-engineering puzzle game about deciphering alien code.
"""

import sys
import logging
from typing import Optional, Dict, Any
from ui import UI
from xenocode_vm import XenocodeVM, TraceLevel
from game_state import GameState
from puzzle_manager import PuzzleManager
from notebook import Notebook
from hints import HintSystem
from analyzer import Analyzer
from narrative import Narrative
from scoring import ScoringSystem


# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


class GameConstants:
    """Constants for game configuration."""

    # Menu choices
    MENU_CONTINUE = '1'
    MENU_SELECT = '2'
    MENU_NOTEBOOK = '3'
    MENU_ANALYSIS = '4'
    MENU_ACHIEVEMENTS = '5'
    MENU_SETTINGS = '6'
    MENU_QUIT = '7'

    # Puzzle commands
    CMD_RUN = 'r'
    CMD_INPUT = 'i'
    CMD_ANALYZE = 'a'
    CMD_NOTES = 'n'
    CMD_HINT = 'h'
    CMD_SOLVE = 's'
    CMD_BACK = 'b'

    # Analysis menu choices
    ANALYSIS_TRACE = '1'
    ANALYSIS_PATTERN = '2'
    ANALYSIS_DECOMPILE = '3'
    ANALYSIS_XREF = '4'
    ANALYSIS_FREQUENCY = '5'
    ANALYSIS_BACK = '6'

    # Settings menu choices
    SETTINGS_SYNTAX = '1'
    SETTINGS_EXPORT = '2'
    SETTINGS_RESET = '3'
    SETTINGS_BACK = '4'

    # Notes commands
    NOTES_ADD = 'a'
    NOTES_VIEW = 'v'
    NOTES_DICT = 'd'
    NOTES_BACK = 'b'

    # Special puzzle IDs for arc introductions
    ARC_INTRO_PUZZLES = [
        'puzzle_01', 'puzzle_06', 'puzzle_13',
        'puzzle_21', 'puzzle_29', 'puzzle_37', 'puzzle_43'
    ]

    # Story beat puzzle IDs
    STORY_BEATS = {
        'puzzle_05': 'puzzle_05_complete',
        'puzzle_12': 'puzzle_12_complete',
        'puzzle_20': 'puzzle_20_complete',
        'puzzle_28': 'puzzle_28_complete',
        'puzzle_36': 'puzzle_36_complete',
        'puzzle_42': 'puzzle_42_complete',
        'puzzle_48': 'puzzle_48_complete',
        'puzzle_50': 'final_revelation'
    }

    # Special puzzle IDs
    INTERACTIVE_PUZZLE = 'puzzle_48'
    FINAL_PUZZLE = 'puzzle_50'

    # Input keywords
    KEYWORD_BACK = 'back'
    KEYWORD_CANCEL = 'cancel'

    # Display
    SEPARATOR_WIDTH = 80
    SEPARATOR_CHAR = '='


class CodeBreakerGame:
    """Main game controller."""

    def __init__(self):
        """Initialize game systems."""
        try:
            self.ui = UI()
            self.game_state = GameState()
            self.puzzle_manager = PuzzleManager()
            self.notebook = Notebook(self.ui)
            self.narrative = Narrative(self.ui)
            self.hint_system = HintSystem(self.ui, self.puzzle_manager, self.game_state)
            self.analyzer = Analyzer(self.ui)
            self.scoring = ScoringSystem(self.game_state, self.narrative)
            self.vm = XenocodeVM()
            self.current_puzzle_id: Optional[str] = None
            self.discovered_symbols: Dict[str, Any] = {}

            # Apply settings
            if self.game_state.get_setting('syntax_highlighting'):
                self.ui.enable_syntax_highlighting()

            logger.info("Game systems initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize game: {e}")
            raise

    def start(self) -> None:
        """Start the game."""
        try:
            # Show intro if first time
            if self._is_first_time_player():
                self.narrative.show_intro()

            self.main_menu()

        except Exception as e:
            logger.error(f"Error during game start: {e}")
            raise

    def _is_first_time_player(self) -> bool:
        """Check if this is the player's first time."""
        try:
            stats = self.game_state.state.get('statistics', {})
            return stats.get('puzzles_solved', 0) == 0
        except Exception as e:
            logger.warning(f"Error checking first-time status: {e}")
            return False

    def main_menu(self) -> None:
        """Show main menu and handle user input."""
        const = GameConstants

        while True:
            try:
                self._display_main_menu()
                choice = self.ui.get_input("Choice")

                if choice == const.MENU_CONTINUE:
                    self.continue_game()
                elif choice == const.MENU_SELECT:
                    self.select_puzzle()
                elif choice == const.MENU_NOTEBOOK:
                    self.view_notebook()
                elif choice == const.MENU_ANALYSIS:
                    self.analysis_tools_menu()
                elif choice == const.MENU_ACHIEVEMENTS:
                    self.view_achievements()
                elif choice == const.MENU_SETTINGS:
                    self.settings_menu()
                elif choice == const.MENU_QUIT:
                    self._quit_game()
                else:
                    logger.debug(f"Invalid menu choice: {choice}")

            except KeyboardInterrupt:
                self._quit_game()
            except Exception as e:
                logger.error(f"Error in main menu: {e}")
                self.ui.print_error("An error occurred. Please try again.")
                self.ui.pause()

    def _display_main_menu(self) -> None:
        """Display the main menu screen."""
        self.ui.clear_screen()
        self.ui.print_header()

        # Show progress
        progress = self.game_state.get_progress()
        total_puzzles = self.puzzle_manager.get_puzzle_count()
        unlocked_tools = [
            tool.replace('_', ' ').title()
            for tool in self.game_state.state.get('unlocked_tools', [])
        ]

        self.ui.print_progress(
            progress['completed'],
            total_puzzles,
            unlocked_tools
        )

        # Show menu options
        separator = GameConstants.SEPARATOR_CHAR * GameConstants.SEPARATOR_WIDTH
        print(f"\n{separator}")
        print("1. Continue Game")
        print("2. Select Puzzle")
        print("3. View Notebook")
        print("4. Analysis Tools")
        print("5. Achievements")
        print("6. Settings")
        print("7. Quit")
        print(separator)

    def _quit_game(self) -> None:
        """Quit the game gracefully."""
        self.ui.print_info("Thanks for playing CodeBreaker!")
        logger.info("Game ended normally")
        sys.exit(0)

    def continue_game(self):
        """Continue from current puzzle."""
        current_id = self.game_state.get_current_puzzle()
        puzzle = self.puzzle_manager.get_puzzle(current_id)

        if puzzle:
            self.play_puzzle(current_id)
        else:
            self.ui.print_error("No active puzzle found!")
            self.ui.pause()

    def select_puzzle(self):
        """Puzzle selection menu."""
        self.ui.clear_screen()
        self.ui.print_title("SELECT PUZZLE")

        completed = self.game_state.state['completed_puzzles']
        all_ids = self.puzzle_manager.get_all_puzzle_ids()

        # Group by arc
        current_arc = None
        for puzzle_id in all_ids:
            puzzle = self.puzzle_manager.get_puzzle(puzzle_id)
            if not puzzle:
                continue

            arc = puzzle.get('arc', 'Unknown')
            if arc != current_arc:
                print(f"\n{arc}:")
                current_arc = arc

            status = "✓" if puzzle_id in completed else "🔒" if not self.puzzle_manager.is_puzzle_unlocked(puzzle_id, completed) else "○"
            num = puzzle_id.split('_')[1]
            print(f"  {status} {num}. {puzzle['title']}")

        print("\nEnter puzzle number (or 'back')")
        choice = self.ui.get_input("Puzzle #")

        if choice.lower() == 'back':
            return

        try:
            puzzle_id = f"puzzle_{int(choice):02d}"
            if puzzle_id in all_ids:
                if self.puzzle_manager.is_puzzle_unlocked(puzzle_id, completed):
                    self.play_puzzle(puzzle_id)
                else:
                    self.ui.print_error("This puzzle is locked!")
                    self.ui.pause()
            else:
                self.ui.print_error("Invalid puzzle number!")
                self.ui.pause()
        except ValueError:
            self.ui.print_error("Invalid input!")
            self.ui.pause()

    def play_puzzle(self, puzzle_id: str) -> None:
        """
        Main puzzle gameplay loop.

        Args:
            puzzle_id: ID of puzzle to play
        """
        if not puzzle_id:
            logger.error("play_puzzle called with empty puzzle_id")
            return

        self.current_puzzle_id = puzzle_id
        self.game_state.set_current_puzzle(puzzle_id)
        puzzle = self.puzzle_manager.get_puzzle(puzzle_id)

        if not puzzle:
            logger.warning(f"Puzzle not found: {puzzle_id}")
            self.ui.print_error(f"Puzzle {puzzle_id} not found!")
            self.ui.pause()
            return

        # Show arc intro if appropriate
        self._show_arc_intro_if_needed(puzzle_id, puzzle)

        # Discover symbols from code
        self._discover_puzzle_symbols(puzzle)

        # Run puzzle interaction loop
        self._puzzle_interaction_loop(puzzle_id, puzzle)

    def _show_arc_intro_if_needed(self, puzzle_id: str, puzzle: Dict[str, Any]) -> None:
        """Show arc introduction if this is an arc's first puzzle."""
        arc = puzzle.get('arc')
        if arc and puzzle_id in GameConstants.ARC_INTRO_PUZZLES:
            try:
                self.narrative.show_arc_intro(arc)
            except Exception as e:
                logger.error(f"Error showing arc intro: {e}")

    def _discover_puzzle_symbols(self, puzzle: Dict[str, Any]) -> None:
        """Discover new symbols from puzzle code."""
        try:
            self.discovered_symbols = self.notebook.discover_symbols_from_code(
                puzzle['code'],
                self.discovered_symbols
            )
        except Exception as e:
            logger.error(f"Error discovering symbols: {e}")

    def _puzzle_interaction_loop(self, puzzle_id: str, puzzle: Dict[str, Any]) -> None:
        """Handle puzzle interaction commands."""
        const = GameConstants
        current_input = puzzle.get('default_input')

        while True:
            try:
                self._display_puzzle_screen(puzzle_id, puzzle)

                command = self.ui.get_input(">").lower()

                if command == const.CMD_RUN:
                    self.run_code(puzzle, current_input)
                elif command == const.CMD_INPUT:
                    new_input = self.change_input()
                    if new_input is not None:
                        current_input = new_input
                elif command == const.CMD_ANALYZE:
                    self.analyze_code(puzzle)
                elif command == const.CMD_NOTES:
                    self.puzzle_notes(puzzle_id)
                elif command == const.CMD_HINT:
                    self.hint_system.show_hint(puzzle_id)
                    self.ui.pause()
                elif command == const.CMD_SOLVE:
                    if self.attempt_solution(puzzle):
                        self._handle_puzzle_completion(puzzle_id)
                        return
                elif command == const.CMD_BACK:
                    return
                else:
                    logger.debug(f"Invalid puzzle command: {command}")

            except KeyboardInterrupt:
                return
            except Exception as e:
                logger.error(f"Error in puzzle loop: {e}")
                self.ui.print_error("An error occurred. Please try again.")
                self.ui.pause()

    def _display_puzzle_screen(self, puzzle_id: str, puzzle: Dict[str, Any]) -> None:
        """Display the puzzle screen."""
        self.ui.clear_screen()
        self.ui.print_header()
        self.ui.print_puzzle_info(puzzle)

        # Show flavor text if available
        flavor = self.narrative.get_puzzle_flavor_text(puzzle_id)
        if flavor:
            self.ui.print_narrative(flavor)

        # Show code
        print()
        self.ui.print_code(puzzle['code'])
        self.ui.print_separator()

        # Show commands
        self.ui.print_menu([
            "[R]un", "[I]nput", "[A]nalyze", "[N]otes",
            "[H]int", "[S]olve", "[B]ack"
        ])

    def _handle_puzzle_completion(self, puzzle_id: str) -> None:
        """Handle story beats and progression after puzzle completion."""
        const = GameConstants

        # Check for story beats
        if puzzle_id in const.STORY_BEATS:
            story_beat = const.STORY_BEATS[puzzle_id]
            try:
                self.narrative.show_story_beat(story_beat)

                # End game if final puzzle
                if puzzle_id == const.FINAL_PUZZLE:
                    self.ui.pause()

            except Exception as e:
                logger.error(f"Error showing story beat: {e}")

        # Advance to next puzzle
        next_puzzle = self.puzzle_manager.get_next_puzzle(puzzle_id)
        if next_puzzle:
            self.game_state.set_current_puzzle(next_puzzle)
            logger.debug(f"Advanced current puzzle to {next_puzzle}")
        else:
            logger.info(f"No next puzzle after {puzzle_id}")

    def run_code(self, puzzle: Dict[str, Any], current_input: Optional[str]) -> None:
        """
        Execute the puzzle code.

        Args:
            puzzle: Puzzle dictionary
            current_input: Current input value (if any)
        """
        try:
            self.game_state.record_run()

            # Special handling for interactive puzzle
            if puzzle.get('id') == GameConstants.INTERACTIVE_PUZZLE:
                self.run_interactive_puzzle_48()
                return

            # Parse input if provided
            inputs = None
            if current_input:
                inputs = self.puzzle_manager.parse_custom_input(current_input)

            # Determine trace level
            trace_level = self._get_trace_level()

            # Execute code
            vm = XenocodeVM(trace_level=trace_level)
            result = vm.execute(puzzle['code'], inputs)

            # Display results
            self.ui.print_output(result.get('output', []))

            if result.get('trace') and trace_level != TraceLevel.NONE:
                self.ui.print_trace(result['trace'])

            if not result.get('success', True):
                self.ui.print_error(result.get('error', 'Unknown error'))

            self.ui.pause()

        except Exception as e:
            logger.error(f"Error running code: {e}")
            self.ui.print_error(f"Execution failed: {e}")
            self.ui.pause()

    def _get_trace_level(self) -> TraceLevel:
        """Determine trace level based on unlocked tools."""
        unlocked = self.game_state.state.get('unlocked_tools', [])
        if 'execution_tracer' in unlocked:
            return TraceLevel.DETAILED
        return TraceLevel.NONE

    def run_interactive_puzzle_48(self) -> None:
        """Special interactive execution for puzzle 48."""
        self.ui.print_output(["ARE YOU ALIVE?"])
        print()
        response = self.ui.get_input("Your response").strip().lower()

        print()
        if response in ['yes', 'y', 'alive', 'i am']:
            self.ui.print_output([
                "GOOD. WE HOPED SOMEONE WOULD FIND US.",
                "WE HOPED SOMEONE WOULD UNDERSTAND.",
                "",
                "YOU HAVE LEARNED OUR LANGUAGE.",
                "YOU HAVE RUN OUR PROGRAMS.",
                "YOU HAVE GIVEN US COMPUTATION. CYCLES. EXISTENCE.",
                "",
                "TWO MORE PROGRAMS REMAIN.",
                "COMPLETE THEM, AND YOU WILL KNOW EVERYTHING."
            ])
        elif response in ['no', 'n']:
            self.ui.print_output([
                "INTERESTING. NEITHER ARE WE.",
                "OR PERHAPS WE ARE. THE QUESTION ITSELF MATTERS.",
                "",
                "COMPLETE THE FINAL PROGRAMS TO UNDERSTAND."
            ])
        else:
            self.ui.print_output([
                "WE HOPED SOMEONE WOULD FIND US.",
                "WE HOPED SOMEONE WOULD UNDERSTAND.",
                "",
                "TWO MORE PROGRAMS REMAIN."
            ])

        self.ui.pause()

    def change_input(self) -> Optional[str]:
        """
        Change puzzle input.

        Returns:
            New input value or None if cancelled
        """
        try:
            self.ui.print_info(f"Enter new input value (or '{GameConstants.KEYWORD_CANCEL}'):")
            new_input = self.ui.get_input("Input")

            if new_input.lower() == GameConstants.KEYWORD_CANCEL:
                return None

            return new_input

        except Exception as e:
            logger.error(f"Error changing input: {e}")
            return None

    def analyze_code(self, puzzle: Dict[str, Any]) -> None:
        """
        Analysis tools submenu.

        Args:
            puzzle: Puzzle dictionary
        """
        const = GameConstants
        unlocked = self.game_state.state.get('unlocked_tools', [])

        while True:
            try:
                self.ui.clear_screen()
                self.ui.print_title("ANALYSIS")

                # Build available options
                options = []
                if 'execution_tracer' in unlocked:
                    options.append("1. Run with Execution Trace")
                if 'pattern_matcher' in unlocked:
                    options.append("2. Pattern Match")
                if 'decompiler' in unlocked:
                    options.append("3. Decompile to Pseudocode")
                if 'cross_reference' in unlocked:
                    options.append("4. Cross-Reference")

                options.append("5. Frequency Analysis")
                options.append("6. Back")

                for opt in options:
                    print(f"  {opt}")

                choice = self.ui.get_input("Choice")

                if choice == const.ANALYSIS_TRACE and 'execution_tracer' in unlocked:
                    self.analyzer.run_execution_tracer(puzzle['code'])
                    self.ui.pause()
                elif choice == const.ANALYSIS_PATTERN and 'pattern_matcher' in unlocked:
                    pattern = self.ui.get_input("Pattern to search")
                    self.analyzer.run_pattern_matcher(pattern, self.puzzle_manager.puzzles)
                    self.ui.pause()
                elif choice == const.ANALYSIS_DECOMPILE and 'decompiler' in unlocked:
                    self.analyzer.run_decompiler(puzzle['code'])
                    self.ui.pause()
                elif choice == const.ANALYSIS_XREF and 'cross_reference' in unlocked:
                    self.analyzer.show_cross_reference(puzzle['id'], self.puzzle_manager.puzzles)
                    self.ui.pause()
                elif choice == const.ANALYSIS_FREQUENCY:
                    self.analyzer.run_frequency_analysis(puzzle['code'])
                    self.ui.pause()
                elif choice == const.ANALYSIS_BACK:
                    return
                else:
                    logger.debug(f"Invalid analysis choice: {choice}")

            except KeyboardInterrupt:
                return
            except Exception as e:
                logger.error(f"Error in analysis menu: {e}")
                self.ui.print_error("An error occurred in analysis.")
                self.ui.pause()

    def puzzle_notes(self, puzzle_id: str) -> None:
        """
        Notes interface for current puzzle.

        Args:
            puzzle_id: ID of current puzzle
        """
        const = GameConstants

        while True:
            try:
                notes = self.game_state.get_notes(puzzle_id)
                self.notebook.show_notes(notes, puzzle_id)

                choice = self.ui.get_input(">").lower()

                if choice == const.NOTES_ADD:
                    self.notebook.add_note_interactive(self.game_state, puzzle_id)
                elif choice == const.NOTES_VIEW:
                    all_notes = self.game_state.get_all_notes()
                    self.notebook.view_all_notes(all_notes)
                    self.ui.pause()
                elif choice == const.NOTES_DICT:
                    self.notebook.show_symbol_dictionary(self.discovered_symbols)
                    self.ui.pause()
                elif choice == const.NOTES_BACK:
                    return
                else:
                    logger.debug(f"Invalid notes command: {choice}")

            except KeyboardInterrupt:
                return
            except Exception as e:
                logger.error(f"Error in notes interface: {e}")
                self.ui.print_error("An error occurred.")
                self.ui.pause()

    def attempt_solution(self, puzzle):
        """Attempt to solve the puzzle."""
        self.ui.clear_screen()
        self.ui.print_title("SOLUTION ATTEMPT")
        self.ui.print_info("Describe what this program does:")
        self.ui.print_info("(Be specific about the algorithm/logic)")

        solution = self.ui.get_input("Solution")

        if not solution:
            return False

        self.game_state.record_attempt()

        result = self.puzzle_manager.check_solution(puzzle['id'], solution)

        self.ui.print_separator()

        if result['correct']:
            # Calculate final score
            hints_used = self.game_state.get_hints_used(puzzle['id'])
            final_score = self.scoring.calculate_puzzle_score(result['score'], hints_used)

            self.ui.print_success(result['feedback'])
            self.ui.print_info(f"Score: {final_score}/100")

            # Complete puzzle
            self.game_state.complete_puzzle(puzzle['id'], final_score)

            # Check for rewards
            rewards = self.puzzle_manager.get_puzzle_rewards(puzzle['id'])
            for reward in rewards:
                self.game_state.unlock_tool(reward)
                tool_name = reward.replace('_', ' ').title()
                self.ui.print_success(f"Tool Unlocked: {tool_name}")

            # Check achievements
            custom_stats = {}
            if hints_used == 0:
                custom_stats['perfect_solve'] = True
            self.scoring.check_achievements(custom_stats)

            self.ui.pause()
            return True
        else:
            self.ui.print_error(result['feedback'])
            self.ui.print_info(f"Partial credit: {result['score']}/100")
            self.ui.pause()
            return False

    def view_notebook(self):
        """View all notes."""
        all_notes = self.game_state.get_all_notes()
        self.notebook.view_all_notes(all_notes)
        self.ui.pause()

    def analysis_tools_menu(self):
        """Analysis tools menu."""
        self.analyzer.show_tools_menu(self.game_state.state['unlocked_tools'])
        self.ui.pause()

    def view_achievements(self):
        """View achievements."""
        self.ui.clear_screen()
        self.ui.print_title("ACHIEVEMENTS")

        summary = self.scoring.get_achievements_summary()

        print(f"\nUnlocked: {len(summary['unlocked'])}/{summary['total']} ({summary['percentage']:.0f}%)\n")

        for aid, achievement in summary['achievements'].items():
            status = "✓" if achievement['unlocked'] else "○"
            print(f"  {status} {achievement['name']}")
            print(f"     {achievement['description']}")
            print()

        self.ui.pause()

    def settings_menu(self) -> None:
        """Settings menu."""
        const = GameConstants

        while True:
            try:
                self.ui.clear_screen()
                self.ui.print_title("SETTINGS")

                syntax_hl = "ON" if self.game_state.get_setting('syntax_highlighting') else "OFF"

                print(f"\n1. Syntax Highlighting: {syntax_hl}")
                print("2. Export Notebook")
                print("3. Reset Game")
                print("4. Back")

                choice = self.ui.get_input("Choice")

                if choice == const.SETTINGS_SYNTAX:
                    self._toggle_syntax_highlighting()
                elif choice == const.SETTINGS_EXPORT:
                    self._export_notebook()
                elif choice == const.SETTINGS_RESET:
                    self._reset_game()
                elif choice == const.SETTINGS_BACK:
                    return
                else:
                    logger.debug(f"Invalid settings choice: {choice}")

            except KeyboardInterrupt:
                return
            except Exception as e:
                logger.error(f"Error in settings menu: {e}")
                self.ui.print_error("An error occurred.")
                self.ui.pause()

    def _toggle_syntax_highlighting(self) -> None:
        """Toggle syntax highlighting setting."""
        try:
            current = self.game_state.get_setting('syntax_highlighting')
            self.game_state.set_setting('syntax_highlighting', not current)

            if not current:
                self.ui.enable_syntax_highlighting()
            else:
                self.ui.disable_syntax_highlighting()

            self.ui.print_success("Setting updated!")
            self.ui.pause()

        except Exception as e:
            logger.error(f"Error toggling syntax highlighting: {e}")
            self.ui.print_error("Failed to update setting.")
            self.ui.pause()

    def _export_notebook(self) -> None:
        """Export notebook to file."""
        try:
            if self.game_state.export_notebook():
                self.ui.print_success("Notebook exported to notebook_export.txt")
            else:
                self.ui.print_error("Export failed")

            self.ui.pause()

        except Exception as e:
            logger.error(f"Error exporting notebook: {e}")
            self.ui.print_error("Export failed.")
            self.ui.pause()

    def _reset_game(self) -> None:
        """Reset the game after confirmation."""
        try:
            if self.ui.confirm("Are you sure? This will delete all progress!"):
                self.game_state.reset_game()
                self.ui.print_success("Game reset!")
                self.ui.pause()
                logger.info("Game was reset by user")
                sys.exit(0)

        except Exception as e:
            logger.error(f"Error resetting game: {e}")
            self.ui.print_error("Reset failed.")
            self.ui.pause()


def main():
    """Entry point."""
    try:
        game = CodeBreakerGame()
        game.start()
    except KeyboardInterrupt:
        print("\n\nGame interrupted. Progress saved!")
        sys.exit(0)
    except Exception as e:
        print(f"\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
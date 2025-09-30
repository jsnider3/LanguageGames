#!/usr/bin/env python3
"""
CodeBreaker - Main Game Loop
A reverse-engineering puzzle game about deciphering alien code.
"""

import sys
from ui import UI
from xenocode_vm import XenocodeVM, TraceLevel
from game_state import GameState
from puzzle_manager import PuzzleManager
from notebook import Notebook
from hints import HintSystem
from analyzer import Analyzer
from narrative import Narrative
from scoring import ScoringSystem


class CodeBreakerGame:
    """Main game controller."""

    def __init__(self):
        self.ui = UI()
        self.game_state = GameState()
        self.puzzle_manager = PuzzleManager()
        self.notebook = Notebook(self.ui)
        self.narrative = Narrative(self.ui)
        self.hint_system = HintSystem(self.ui, self.puzzle_manager, self.game_state)
        self.analyzer = Analyzer(self.ui)
        self.scoring = ScoringSystem(self.game_state, self.narrative)
        self.vm = XenocodeVM()
        self.current_puzzle_id = None
        self.discovered_symbols = {}

        # Apply settings
        if self.game_state.get_setting('syntax_highlighting'):
            self.ui.enable_syntax_highlighting()

    def start(self):
        """Start the game."""
        # Show intro if first time
        if self.game_state.state['statistics']['puzzles_solved'] == 0:
            self.narrative.show_intro()

        self.main_menu()

    def main_menu(self):
        """Show main menu."""
        while True:
            self.ui.clear_screen()
            self.ui.print_header()

            progress = self.game_state.get_progress()
            total_puzzles = self.puzzle_manager.get_puzzle_count()

            self.ui.print_progress(
                progress['completed'],
                total_puzzles,
                [tool.replace('_', ' ').title() for tool in self.game_state.state['unlocked_tools']]
            )

            print("\n" + "=" * 80)
            print("1. Continue Game")
            print("2. Select Puzzle")
            print("3. View Notebook")
            print("4. Analysis Tools")
            print("5. Achievements")
            print("6. Settings")
            print("7. Quit")
            print("=" * 80)

            choice = self.ui.get_input("Choice")

            if choice == '1':
                self.continue_game()
            elif choice == '2':
                self.select_puzzle()
            elif choice == '3':
                self.view_notebook()
            elif choice == '4':
                self.analysis_tools_menu()
            elif choice == '5':
                self.view_achievements()
            elif choice == '6':
                self.settings_menu()
            elif choice == '7':
                self.ui.print_info("Thanks for playing CodeBreaker!")
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

    def play_puzzle(self, puzzle_id: str):
        """Main puzzle gameplay loop."""
        self.current_puzzle_id = puzzle_id
        self.game_state.set_current_puzzle(puzzle_id)
        puzzle = self.puzzle_manager.get_puzzle(puzzle_id)

        if not puzzle:
            self.ui.print_error(f"Puzzle {puzzle_id} not found!")
            self.ui.pause()
            return

        # Check for arc intro
        arc = puzzle.get('arc')
        if arc and puzzle_id in ['puzzle_01', 'puzzle_06', 'puzzle_13', 'puzzle_21', 'puzzle_29', 'puzzle_37', 'puzzle_43']:
            self.narrative.show_arc_intro(arc)

        # Discover symbols from this puzzle's code
        self.discovered_symbols = self.notebook.discover_symbols_from_code(
            puzzle['code'],
            self.discovered_symbols
        )

        current_input = puzzle.get('default_input')

        while True:
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

            command = self.ui.get_input(">").lower()

            if command == 'r':
                self.run_code(puzzle, current_input)
            elif command == 'i':
                current_input = self.change_input()
            elif command == 'a':
                self.analyze_code(puzzle)
            elif command == 'n':
                self.puzzle_notes(puzzle_id)
            elif command == 'h':
                self.hint_system.show_hint(puzzle_id)
                self.ui.pause()
            elif command == 's':
                if self.attempt_solution(puzzle):
                    # Check for story beats
                    if puzzle_id == 'puzzle_05':
                        self.narrative.show_story_beat('puzzle_05_complete')
                    elif puzzle_id == 'puzzle_12':
                        self.narrative.show_story_beat('puzzle_12_complete')
                    elif puzzle_id == 'puzzle_20':
                        self.narrative.show_story_beat('puzzle_20_complete')
                    elif puzzle_id == 'puzzle_28':
                        self.narrative.show_story_beat('puzzle_28_complete')
                    elif puzzle_id == 'puzzle_36':
                        self.narrative.show_story_beat('puzzle_36_complete')
                    elif puzzle_id == 'puzzle_42':
                        self.narrative.show_story_beat('puzzle_42_complete')
                    elif puzzle_id == 'puzzle_48':
                        self.narrative.show_story_beat('puzzle_48_complete')
                    elif puzzle_id == 'puzzle_50':
                        self.narrative.show_story_beat('final_revelation')
                        self.ui.pause()
                        return  # End game
                    return
            elif command == 'b':
                return

    def run_code(self, puzzle, current_input):
        """Execute the puzzle code."""
        self.game_state.record_run()

        inputs = None
        if current_input:
            inputs = self.puzzle_manager.parse_custom_input(current_input)

        # Determine trace level
        trace_level = TraceLevel.NONE
        if 'execution_tracer' in self.game_state.state['unlocked_tools']:
            trace_level = TraceLevel.DETAILED

        vm = XenocodeVM(trace_level=trace_level)
        result = vm.execute(puzzle['code'], inputs)

        self.ui.print_output(result['output'])

        if result['trace'] and trace_level != TraceLevel.NONE:
            self.ui.print_trace(result['trace'])

        if not result['success']:
            self.ui.print_error(result['error'])

        self.ui.pause()

    def change_input(self):
        """Change puzzle input."""
        self.ui.print_info("Enter new input value (or 'cancel'):")
        new_input = self.ui.get_input("Input")
        if new_input.lower() != 'cancel':
            return new_input
        return None

    def analyze_code(self, puzzle):
        """Analysis tools submenu."""
        while True:
            self.ui.clear_screen()
            self.ui.print_title("ANALYSIS")

            unlocked = self.game_state.state['unlocked_tools']

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

            if choice == '1' and 'execution_tracer' in unlocked:
                self.analyzer.run_execution_tracer(puzzle['code'])
                self.ui.pause()
            elif choice == '2' and 'pattern_matcher' in unlocked:
                pattern = self.ui.get_input("Pattern to search")
                self.analyzer.run_pattern_matcher(pattern, self.puzzle_manager.puzzles)
                self.ui.pause()
            elif choice == '3' and 'decompiler' in unlocked:
                self.analyzer.run_decompiler(puzzle['code'])
                self.ui.pause()
            elif choice == '4' and 'cross_reference' in unlocked:
                self.analyzer.show_cross_reference(puzzle['id'], self.puzzle_manager.puzzles)
                self.ui.pause()
            elif choice == '5':
                self.analyzer.run_frequency_analysis(puzzle['code'])
                self.ui.pause()
            elif choice == '6':
                return

    def puzzle_notes(self, puzzle_id):
        """Notes interface for current puzzle."""
        while True:
            notes = self.game_state.get_notes(puzzle_id)
            self.notebook.show_notes(notes, puzzle_id)

            choice = self.ui.get_input(">").lower()

            if choice == 'a':
                self.notebook.add_note_interactive(self.game_state, puzzle_id)
            elif choice == 'v':
                all_notes = self.game_state.get_all_notes()
                self.notebook.view_all_notes(all_notes)
                self.ui.pause()
            elif choice == 'd':
                self.notebook.show_symbol_dictionary(self.discovered_symbols)
                self.ui.pause()
            elif choice == 'b':
                return

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

    def settings_menu(self):
        """Settings menu."""
        while True:
            self.ui.clear_screen()
            self.ui.print_title("SETTINGS")

            syntax_hl = "ON" if self.game_state.get_setting('syntax_highlighting') else "OFF"

            print(f"\n1. Syntax Highlighting: {syntax_hl}")
            print("2. Export Notebook")
            print("3. Reset Game")
            print("4. Back")

            choice = self.ui.get_input("Choice")

            if choice == '1':
                current = self.game_state.get_setting('syntax_highlighting')
                self.game_state.set_setting('syntax_highlighting', not current)
                if not current:
                    self.ui.enable_syntax_highlighting()
                else:
                    self.ui.disable_syntax_highlighting()
                self.ui.print_success("Setting updated!")
                self.ui.pause()
            elif choice == '2':
                if self.game_state.export_notebook():
                    self.ui.print_success("Notebook exported to notebook_export.txt")
                else:
                    self.ui.print_error("Export failed")
                self.ui.pause()
            elif choice == '3':
                if self.ui.confirm("Are you sure? This will delete all progress!"):
                    self.game_state.reset_game()
                    self.ui.print_success("Game reset!")
                    self.ui.pause()
                    sys.exit(0)
            elif choice == '4':
                return


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
"""
Hint System
Provides progressive hints to players.
"""

from typing import Optional
from ui import UI, Color
from puzzle_manager import PuzzleManager
from game_state import GameState


class HintSystem:
    """Manages hint delivery and tracking."""

    def __init__(self, ui: UI, puzzle_manager: PuzzleManager, game_state: GameState):
        self.ui = ui
        self.puzzle_manager = puzzle_manager
        self.game_state = game_state

    def show_hint(self, puzzle_id: str) -> bool:
        """
        Show the next available hint for a puzzle.

        Returns True if hint was shown, False if no more hints.
        """
        hints_used = self.game_state.get_hints_used(puzzle_id)
        total_hints = self.puzzle_manager.get_total_hints(puzzle_id)

        if hints_used >= total_hints:
            self.ui.print_error("No more hints available for this puzzle!")
            return False

        # Show confirmation
        penalty = self._calculate_penalty(hints_used)
        self.ui.print_info(f"This is hint {hints_used + 1} of {total_hints}")
        self.ui.print_info(f"Score penalty: -{penalty} points")

        if not self.ui.confirm("Use a hint?"):
            return False

        # Get and show hint
        hint = self.puzzle_manager.get_hint(puzzle_id, hints_used)
        if hint:
            self.ui.print_hint(hint)
            self.game_state.use_hint(puzzle_id)
            return True

        return False

    def _calculate_penalty(self, hints_used: int) -> int:
        """Calculate score penalty for hint usage."""
        penalties = [5, 10, 15, 20, 25]
        if hints_used < len(penalties):
            return penalties[hints_used]
        return 30

    def get_hint_summary(self, puzzle_id: str) -> str:
        """Get summary of hint usage for a puzzle."""
        hints_used = self.game_state.get_hints_used(puzzle_id)
        total_hints = self.puzzle_manager.get_total_hints(puzzle_id)

        if hints_used == 0:
            return f"No hints used ({total_hints} available)"
        else:
            return f"{hints_used}/{total_hints} hints used"
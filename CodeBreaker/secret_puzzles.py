"""
Secret Puzzles System
Hidden puzzles unlocked by special conditions.
"""

from typing import Dict, List, Callable
from game_state import GameState


class SecretPuzzle:
    """Represents a secret puzzle with unlock condition."""

    def __init__(self, puzzle_id: str, name: str, condition: Callable[[GameState], bool], hint: str):
        self.puzzle_id = puzzle_id
        self.name = name
        self.condition = condition
        self.hint = hint


class SecretPuzzlesManager:
    """Manages secret puzzle unlocking."""

    def __init__(self):
        self.secret_puzzles = self._init_secret_puzzles()

    def _init_secret_puzzles(self) -> List[SecretPuzzle]:
        """Define all secret puzzles."""
        return [
            SecretPuzzle(
                'secret_01',
                'The Perfect Run',
                lambda gs: self._check_perfect_arc(gs, 'Tutorial Arc'),
                'Complete an entire arc without using any hints'
            ),
            SecretPuzzle(
                'secret_02',
                'Speed Demon',
                lambda gs: 'speed_solve' in gs.state.get('special_achievements', []),
                'Complete any puzzle in under 2 minutes'
            ),
            SecretPuzzle(
                'secret_03',
                'The Observer',
                lambda gs: len(gs.state.get('notebook', {})) >= 30,
                'Write notes for at least 30 puzzles'
            ),
            SecretPuzzle(
                'secret_04',
                'Completionist',
                lambda gs: len(gs.state['completed_puzzles']) == 50,
                'Complete all 50 main puzzles'
            ),
            SecretPuzzle(
                'secret_05',
                'Master Decoder',
                lambda gs: gs.state['statistics'].get('hints_used_total', 999) == 0,
                'Complete the entire game without using any hints'
            ),
        ]

    def _check_perfect_arc(self, game_state: GameState, arc_name: str) -> bool:
        """Check if an arc was completed perfectly (no hints)."""
        arc_puzzles = {
            'Tutorial Arc': ['puzzle_01', 'puzzle_02', 'puzzle_03', 'puzzle_04', 'puzzle_05'],
            'Functions Arc': [f'puzzle_{i:02d}' for i in range(21, 29)],
            # Add more arcs as needed
        }

        if arc_name not in arc_puzzles:
            return False

        puzzles = arc_puzzles[arc_name]

        # Check all completed
        if not all(p in game_state.state['completed_puzzles'] for p in puzzles):
            return False

        # Check no hints used
        hints_used = game_state.state.get('hints_used', {})
        for puzzle in puzzles:
            if hints_used.get(puzzle, 0) > 0:
                return False

        return True

    def check_unlocks(self, game_state: GameState) -> List[str]:
        """Check for newly unlocked secret puzzles."""
        unlocked = game_state.state.get('unlocked_secrets', [])
        newly_unlocked = []

        for secret in self.secret_puzzles:
            if secret.puzzle_id not in unlocked:
                if secret.condition(game_state):
                    newly_unlocked.append(secret.puzzle_id)
                    unlocked.append(secret.puzzle_id)

        if newly_unlocked:
            game_state.state['unlocked_secrets'] = unlocked
            game_state.save()

        return newly_unlocked

    def get_unlocked_secrets(self, game_state: GameState) -> List[SecretPuzzle]:
        """Get list of unlocked secret puzzles."""
        unlocked_ids = set(game_state.state.get('unlocked_secrets', []))
        return [s for s in self.secret_puzzles if s.puzzle_id in unlocked_ids]

    def get_locked_secrets_with_hints(self, game_state: GameState) -> List[Dict]:
        """Get locked secrets with their hints."""
        unlocked_ids = set(game_state.state.get('unlocked_secrets', []))
        return [
            {'name': s.name, 'hint': s.hint}
            for s in self.secret_puzzles
            if s.puzzle_id not in unlocked_ids
        ]
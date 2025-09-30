"""
Scoring and Achievements System
"""

from typing import List, Dict, Any
from game_state import GameState
from narrative import Narrative


class ScoringSystem:
    """Manages scoring and achievements."""

    def __init__(self, game_state: GameState, narrative: Narrative):
        self.game_state = game_state
        self.narrative = narrative
        self.achievements = self._init_achievements()

    def _init_achievements(self) -> Dict[str, Dict[str, Any]]:
        """Initialize achievement definitions."""
        return {
            'first_contact': {
                'name': 'First Contact',
                'description': 'Complete your first puzzle',
                'condition': lambda stats: stats['puzzles_solved'] >= 1
            },
            'quick_learner': {
                'name': 'Quick Learner',
                'description': 'Complete a puzzle without using any hints',
                'condition': lambda stats: 'perfect_solve' in stats
            },
            'pattern_master': {
                'name': 'Pattern Master',
                'description': 'Complete 10 puzzles',
                'condition': lambda stats: stats['puzzles_solved'] >= 10
            },
            'xenolinguist': {
                'name': 'Xenolinguist',
                'description': 'Complete 25 puzzles',
                'condition': lambda stats: stats['puzzles_solved'] >= 25
            },
            'code_breaker': {
                'name': 'Code Breaker',
                'description': 'Complete all 50 puzzles',
                'condition': lambda stats: stats['puzzles_solved'] >= 50
            },
            'perfect_arc': {
                'name': 'Perfect Arc',
                'description': 'Complete an entire arc without hints',
                'condition': lambda stats: 'perfect_arc' in stats
            },
            'note_taker': {
                'name': 'Diligent Scholar',
                'description': 'Write notes for 20 different puzzles',
                'condition': lambda stats: stats.get('notes_count', 0) >= 20
            },
            'experimenter': {
                'name': 'Experimenter',
                'description': 'Run code 100 times',
                'condition': lambda stats: stats['total_runs'] >= 100
            },
            'speed_demon': {
                'name': 'Speed Demon',
                'description': 'Complete a puzzle in under 2 minutes',
                'condition': lambda stats: 'speed_solve' in stats
            },
            'completionist': {
                'name': 'True Understanding',
                'description': 'Unlock all analysis tools',
                'condition': lambda stats: stats.get('all_tools_unlocked', False)
            }
        }

    def calculate_puzzle_score(self, base_score: int, hints_used: int, time_taken: int = 0) -> int:
        """Calculate final score for a puzzle."""
        score = base_score

        # Hint penalties
        hint_penalties = [5, 10, 15, 20, 25]
        for i in range(hints_used):
            if i < len(hint_penalties):
                score -= hint_penalties[i]
            else:
                score -= 30

        # Time bonus (if under 5 minutes)
        if time_taken > 0 and time_taken < 300:
            score += 10

        return max(score, 0)

    def check_achievements(self, custom_stats: Dict[str, Any] = None) -> List[str]:
        """Check for newly unlocked achievements."""
        stats = self.game_state.state['statistics'].copy()
        if custom_stats:
            stats.update(custom_stats)

        # Add derived stats
        stats['puzzles_solved'] = len(self.game_state.state['completed_puzzles'])
        stats['notes_count'] = len(self.game_state.state['notebook'])
        stats['all_tools_unlocked'] = len(self.game_state.state['unlocked_tools']) >= 8

        newly_unlocked = []
        current_achievements = self.game_state.state['achievements']

        for achievement_id, achievement in self.achievements.items():
            if achievement_id not in current_achievements:
                if achievement['condition'](stats):
                    self.game_state.unlock_achievement(achievement_id)
                    newly_unlocked.append(achievement_id)
                    self.narrative.show_achievement(
                        achievement['name'],
                        achievement['description']
                    )

        return newly_unlocked

    def get_achievements_summary(self) -> Dict[str, Any]:
        """Get summary of unlocked achievements."""
        unlocked = self.game_state.state['achievements']
        total = len(self.achievements)

        return {
            'unlocked': unlocked,
            'total': total,
            'percentage': (len(unlocked) / total) * 100 if total > 0 else 0,
            'achievements': {
                aid: {
                    'name': self.achievements[aid]['name'],
                    'description': self.achievements[aid]['description'],
                    'unlocked': aid in unlocked
                }
                for aid in self.achievements
            }
        }
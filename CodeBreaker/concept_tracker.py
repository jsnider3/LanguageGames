"""
Concept Tracker
Tracks which programming concepts the player has mastered.
"""

from typing import Dict, List, Set
from game_state import GameState


class ConceptTracker:
    """Tracks mastery of programming concepts."""

    CONCEPTS = {
        'output': {'puzzles': [1, 2, 3], 'description': 'Outputting data'},
        'input': {'puzzles': [2, 4], 'description': 'Reading input'},
        'variables': {'puzzles': [2, 3, 4, 5], 'description': 'Using variables'},
        'arithmetic': {'puzzles': [3, 5, 18, 25], 'description': 'Arithmetic operations'},
        'conditionals': {'puzzles': [6, 7, 8, 9, 10, 24], 'description': 'If/else branches'},
        'boolean_logic': {'puzzles': [9, 10, 11], 'description': 'Boolean operations'},
        'loops': {'puzzles': list(range(13, 21)), 'description': 'Iteration and loops'},
        'arrays': {'puzzles': [14, 15, 16, 29, 32, 36], 'description': 'Array/list manipulation'},
        'functions': {'puzzles': list(range(21, 29)), 'description': 'Defining and calling functions'},
        'dictionaries': {'puzzles': [20, 30, 31, 33, 34], 'description': 'Key-value data structures'},
        'nested_structures': {'puzzles': [35, 36], 'description': 'Nested data structures'},
        'algorithms': {'puzzles': [37, 39, 40, 41], 'description': 'Classic algorithms'},
        'pattern_recognition': {'puzzles': [40, 41, 43, 44], 'description': 'Recognizing patterns'},
    }

    def __init__(self, game_state: GameState):
        self.game_state = game_state

    def get_mastered_concepts(self) -> List[str]:
        """Get list of mastered concepts (>= 70% puzzles solved)."""
        completed = set(self.game_state.state['completed_puzzles'])
        mastered = []

        for concept, data in self.CONCEPTS.items():
            required_puzzles = set(f"puzzle_{i:02d}" for i in data['puzzles'])
            solved = len(required_puzzles & completed)
            total = len(required_puzzles)

            if total > 0 and (solved / total) >= 0.7:
                mastered.append(concept)

        return mastered

    def get_concept_progress(self) -> Dict[str, Dict]:
        """Get progress for all concepts."""
        completed = set(self.game_state.state['completed_puzzles'])
        progress = {}

        for concept, data in self.CONCEPTS.items():
            required_puzzles = set(f"puzzle_{i:02d}" for i in data['puzzles'])
            solved = len(required_puzzles & completed)
            total = len(required_puzzles)

            progress[concept] = {
                'description': data['description'],
                'solved': solved,
                'total': total,
                'percentage': (solved / total * 100) if total > 0 else 0,
                'mastered': (solved / total) >= 0.7 if total > 0 else False
            }

        return progress

    def get_next_concepts_to_learn(self) -> List[str]:
        """Suggest next concepts to focus on."""
        progress = self.get_concept_progress()

        # Find concepts with 30-60% completion (in progress)
        in_progress = [
            concept for concept, data in progress.items()
            if 30 <= data['percentage'] < 70
        ]

        return in_progress[:3]  # Return top 3
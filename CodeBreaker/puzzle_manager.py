"""
Puzzle Manager
Handles loading puzzles and checking solutions.
"""

import json
import os
from typing import Dict, List, Any, Optional
from difflib import SequenceMatcher


class PuzzleManager:
    """Manages puzzle loading and solution validation."""

    def __init__(self, puzzles_dir: str = "puzzles"):
        self.puzzles_dir = puzzles_dir
        self.puzzles: Dict[str, Dict[str, Any]] = {}
        self._load_all_puzzles()

    def _load_all_puzzles(self):
        """Load all puzzle files from the puzzles directory."""
        if not os.path.exists(self.puzzles_dir):
            os.makedirs(self.puzzles_dir)
            return

        for filename in os.listdir(self.puzzles_dir):
            if filename.endswith('.json'):
                puzzle_path = os.path.join(self.puzzles_dir, filename)
                try:
                    with open(puzzle_path, 'r', encoding='utf-8') as f:
                        puzzle = json.load(f)
                        self.puzzles[puzzle['id']] = puzzle
                except Exception as e:
                    print(f"Error loading {filename}: {e}")

    def get_puzzle(self, puzzle_id: str) -> Optional[Dict[str, Any]]:
        """Get a puzzle by ID."""
        return self.puzzles.get(puzzle_id)

    def get_all_puzzle_ids(self) -> List[str]:
        """Get all puzzle IDs in order."""
        return sorted(self.puzzles.keys(), key=lambda x: int(x.split('_')[1]))

    def get_next_puzzle(self, current_id: str) -> Optional[str]:
        """Get the next puzzle ID."""
        puzzle_ids = self.get_all_puzzle_ids()
        try:
            current_index = puzzle_ids.index(current_id)
            if current_index < len(puzzle_ids) - 1:
                return puzzle_ids[current_index + 1]
        except ValueError:
            pass
        return None

    def get_previous_puzzle(self, current_id: str) -> Optional[str]:
        """Get the previous puzzle ID."""
        puzzle_ids = self.get_all_puzzle_ids()
        try:
            current_index = puzzle_ids.index(current_id)
            if current_index > 0:
                return puzzle_ids[current_index - 1]
        except ValueError:
            pass
        return None

    def is_puzzle_unlocked(self, puzzle_id: str, completed_puzzles: List[str]) -> bool:
        """Check if a puzzle is unlocked based on requirements."""
        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return False

        # First puzzle is always unlocked
        if puzzle_id == 'puzzle_01':
            return True

        # Check if all required puzzles are completed
        requirements = puzzle.get('unlock_requirements', [])
        if not requirements:
            # If no requirements, check if previous puzzle is completed
            prev_puzzle = self.get_previous_puzzle(puzzle_id)
            if prev_puzzle:
                return prev_puzzle in completed_puzzles
            return True

        return all(req in completed_puzzles for req in requirements)

    def check_solution(self, puzzle_id: str, solution: str) -> Dict[str, Any]:
        """
        Check if a solution is correct.

        Returns dict with:
            - correct: bool
            - score: int (0-100)
            - feedback: str
        """
        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return {'correct': False, 'score': 0, 'feedback': 'Puzzle not found'}

        # Get expected solution
        expected = puzzle.get('solution_description', '').lower()
        given = solution.lower().strip()

        # Calculate similarity
        similarity = self._calculate_similarity(expected, given)

        # Check for key concepts
        key_concepts = puzzle.get('key_concepts', [])
        concepts_found = sum(1 for concept in key_concepts if concept.lower() in given)
        concept_ratio = concepts_found / len(key_concepts) if key_concepts else 0

        # Calculate score
        if similarity > 0.85 or concept_ratio > 0.8:
            return {
                'correct': True,
                'score': 100,
                'feedback': 'Perfect! You understood the code completely.'
            }
        elif similarity > 0.7 or concept_ratio > 0.6:
            return {
                'correct': True,
                'score': 85,
                'feedback': 'Great job! You got the main idea.'
            }
        elif similarity > 0.5 or concept_ratio > 0.4:
            return {
                'correct': True,
                'score': 70,
                'feedback': 'Correct! Though you could be more precise.'
            }
        elif similarity > 0.3 or concept_ratio > 0.2:
            return {
                'correct': False,
                'score': 40,
                'feedback': 'Close, but not quite. Try running it with different inputs.'
            }
        else:
            return {
                'correct': False,
                'score': 20,
                'feedback': 'Not quite right. Consider what the code actually does step by step.'
            }

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two strings."""
        return SequenceMatcher(None, text1, text2).ratio()

    def get_hint(self, puzzle_id: str, hint_number: int) -> Optional[str]:
        """Get a specific hint for a puzzle."""
        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return None

        hints = puzzle.get('hints', [])
        if 0 <= hint_number < len(hints):
            return hints[hint_number]
        return None

    def get_total_hints(self, puzzle_id: str) -> int:
        """Get total number of hints available for a puzzle."""
        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return 0
        return len(puzzle.get('hints', []))

    def get_puzzle_rewards(self, puzzle_id: str) -> List[str]:
        """Get rewards for completing a puzzle."""
        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return []
        return puzzle.get('rewards', [])

    def get_puzzles_by_arc(self, arc: str) -> List[str]:
        """Get all puzzle IDs in a specific arc."""
        return [pid for pid, puzzle in self.puzzles.items()
                if puzzle.get('arc') == arc]

    def get_puzzle_count(self) -> int:
        """Get total number of puzzles."""
        return len(self.puzzles)

    def parse_custom_input(self, input_str: str) -> List[Any]:
        """Parse user input string into Python values."""
        try:
            # Try to evaluate as Python literal
            import ast
            return [ast.literal_eval(input_str)]
        except:
            # If that fails, return as string
            return [input_str]
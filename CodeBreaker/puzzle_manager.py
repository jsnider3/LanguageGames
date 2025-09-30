"""
Puzzle Manager
Handles loading puzzles and checking solutions with robust error handling.
"""

import json
import os
import logging
from typing import Dict, List, Any, Optional
from difflib import SequenceMatcher
from dataclasses import dataclass


# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


class PuzzleError(Exception):
    """Base exception for puzzle-related errors."""
    pass


class PuzzleNotFoundError(PuzzleError):
    """Raised when a puzzle cannot be found."""
    pass


class PuzzleLoadError(PuzzleError):
    """Raised when a puzzle file cannot be loaded."""
    pass


class PuzzleConstants:
    """Constants for puzzle management."""

    # Directories and files
    DEFAULT_PUZZLES_DIR = "puzzles"
    PUZZLE_FILE_EXTENSION = ".json"

    # Puzzle identification
    FIRST_PUZZLE_ID = "puzzle_01"
    PUZZLE_ID_DELIMITER = "_"
    PUZZLE_ID_INDEX = 1

    # Similarity thresholds for solution checking
    SIMILARITY_EXCELLENT = 0.85
    SIMILARITY_GOOD = 0.7
    SIMILARITY_FAIR = 0.5
    SIMILARITY_POOR = 0.3

    # Concept ratio thresholds
    CONCEPT_RATIO_EXCELLENT = 0.8
    CONCEPT_RATIO_GOOD = 0.6
    CONCEPT_RATIO_FAIR = 0.4
    CONCEPT_RATIO_POOR = 0.2

    # Score values
    SCORE_PERFECT = 100
    SCORE_GREAT = 85
    SCORE_GOOD = 70
    SCORE_FAIR = 40
    SCORE_POOR = 20
    SCORE_MIN = 0

    # Required puzzle fields
    REQUIRED_FIELDS = ['id', 'title', 'code', 'expected_output']


@dataclass
class SolutionResult:
    """Result of checking a solution."""
    correct: bool
    score: int
    feedback: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'correct': self.correct,
            'score': self.score,
            'feedback': self.feedback
        }


class PuzzleManager:
    """Manages puzzle loading and solution validation."""

    def __init__(self, puzzles_dir: str = PuzzleConstants.DEFAULT_PUZZLES_DIR):
        """
        Initialize puzzle manager.

        Args:
            puzzles_dir: Directory containing puzzle JSON files
        """
        if not isinstance(puzzles_dir, str) or not puzzles_dir:
            raise ValueError("Puzzles directory must be a non-empty string")

        self.puzzles_dir = puzzles_dir
        self.puzzles: Dict[str, Dict[str, Any]] = {}
        self._load_all_puzzles()

    def _load_all_puzzles(self) -> None:
        """Load all puzzle files from the puzzles directory."""
        if not os.path.exists(self.puzzles_dir):
            logger.warning(f"Puzzles directory not found: {self.puzzles_dir}")
            os.makedirs(self.puzzles_dir)
            return

        loaded_count = 0
        error_count = 0

        for filename in os.listdir(self.puzzles_dir):
            if filename.endswith(PuzzleConstants.PUZZLE_FILE_EXTENSION):
                puzzle_path = os.path.join(self.puzzles_dir, filename)
                try:
                    puzzle = self._load_puzzle_file(puzzle_path)
                    self.puzzles[puzzle['id']] = puzzle
                    loaded_count += 1
                except PuzzleLoadError as e:
                    logger.error(f"Error loading {filename}: {e}")
                    error_count += 1

        logger.info(f"Loaded {loaded_count} puzzles, {error_count} errors")

    def _load_puzzle_file(self, filepath: str) -> Dict[str, Any]:
        """
        Load and validate a single puzzle file.

        Args:
            filepath: Path to puzzle JSON file

        Returns:
            Validated puzzle dictionary

        Raises:
            PuzzleLoadError: If file cannot be loaded or is invalid
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                puzzle = json.load(f)
        except json.JSONDecodeError as e:
            raise PuzzleLoadError(f"Invalid JSON: {e}")
        except OSError as e:
            raise PuzzleLoadError(f"Cannot read file: {e}")

        # Validate required fields
        missing_fields = [
            field for field in PuzzleConstants.REQUIRED_FIELDS
            if field not in puzzle
        ]

        if missing_fields:
            raise PuzzleLoadError(f"Missing required fields: {missing_fields}")

        return puzzle

    def _validate_puzzle_id(self, puzzle_id: str) -> bool:
        """
        Validate puzzle ID format.

        Args:
            puzzle_id: Puzzle ID to validate

        Returns:
            True if valid, False otherwise
        """
        if not isinstance(puzzle_id, str) or not puzzle_id:
            return False

        parts = puzzle_id.split(PuzzleConstants.PUZZLE_ID_DELIMITER)
        if len(parts) != 2:
            return False

        try:
            int(parts[PuzzleConstants.PUZZLE_ID_INDEX])
            return True
        except (ValueError, IndexError):
            return False

    def get_puzzle(self, puzzle_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a puzzle by ID.

        Args:
            puzzle_id: ID of puzzle to retrieve

        Returns:
            Puzzle dictionary or None if not found
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID format: {puzzle_id}")
            return None

        return self.puzzles.get(puzzle_id)

    def get_all_puzzle_ids(self) -> List[str]:
        """
        Get all puzzle IDs sorted in numerical order.

        Returns:
            List of puzzle IDs
        """
        def extract_number(puzzle_id: str) -> int:
            """Extract number from puzzle ID."""
            try:
                parts = puzzle_id.split(PuzzleConstants.PUZZLE_ID_DELIMITER)
                return int(parts[PuzzleConstants.PUZZLE_ID_INDEX])
            except (ValueError, IndexError):
                logger.error(f"Cannot extract number from: {puzzle_id}")
                return 0

        return sorted(self.puzzles.keys(), key=extract_number)

    def get_next_puzzle(self, current_id: str) -> Optional[str]:
        """
        Get the next puzzle ID in sequence.

        Args:
            current_id: Current puzzle ID

        Returns:
            Next puzzle ID or None if at end
        """
        if not self._validate_puzzle_id(current_id):
            logger.warning(f"Invalid current puzzle ID: {current_id}")
            return None

        puzzle_ids = self.get_all_puzzle_ids()
        try:
            current_index = puzzle_ids.index(current_id)
            if current_index < len(puzzle_ids) - 1:
                return puzzle_ids[current_index + 1]
        except ValueError:
            logger.warning(f"Current puzzle ID not found: {current_id}")

        return None

    def get_previous_puzzle(self, current_id: str) -> Optional[str]:
        """
        Get the previous puzzle ID in sequence.

        Args:
            current_id: Current puzzle ID

        Returns:
            Previous puzzle ID or None if at start
        """
        if not self._validate_puzzle_id(current_id):
            logger.warning(f"Invalid current puzzle ID: {current_id}")
            return None

        puzzle_ids = self.get_all_puzzle_ids()
        try:
            current_index = puzzle_ids.index(current_id)
            if current_index > 0:
                return puzzle_ids[current_index - 1]
        except ValueError:
            logger.warning(f"Current puzzle ID not found: {current_id}")

        return None

    def is_puzzle_unlocked(self, puzzle_id: str, completed_puzzles: List[str]) -> bool:
        """
        Check if a puzzle is unlocked based on requirements.

        Args:
            puzzle_id: ID of puzzle to check
            completed_puzzles: List of completed puzzle IDs

        Returns:
            True if unlocked, False otherwise
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID: {puzzle_id}")
            return False

        if not isinstance(completed_puzzles, list):
            logger.error("completed_puzzles must be a list")
            return False

        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            logger.warning(f"Puzzle not found: {puzzle_id}")
            return False

        # First puzzle is always unlocked
        if puzzle_id == PuzzleConstants.FIRST_PUZZLE_ID:
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

        Args:
            puzzle_id: ID of puzzle being solved
            solution: User's solution description

        Returns:
            Dictionary with keys: correct, score, feedback
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID: {puzzle_id}")
            return SolutionResult(
                correct=False,
                score=PuzzleConstants.SCORE_MIN,
                feedback="Invalid puzzle ID"
            ).to_dict()

        if not isinstance(solution, str):
            logger.error("Solution must be a string")
            return SolutionResult(
                correct=False,
                score=PuzzleConstants.SCORE_MIN,
                feedback="Invalid solution format"
            ).to_dict()

        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            logger.warning(f"Puzzle not found: {puzzle_id}")
            return SolutionResult(
                correct=False,
                score=PuzzleConstants.SCORE_MIN,
                feedback="Puzzle not found"
            ).to_dict()

        # Get expected solution
        expected = puzzle.get('solution_description', '').lower()
        given = solution.lower().strip()

        if not given:
            return SolutionResult(
                correct=False,
                score=PuzzleConstants.SCORE_MIN,
                feedback="Solution cannot be empty"
            ).to_dict()

        # Calculate similarity and concept coverage
        similarity = self._calculate_similarity(expected, given)
        concept_ratio = self._calculate_concept_ratio(puzzle, given)

        # Evaluate solution quality
        result = self._evaluate_solution_quality(similarity, concept_ratio)
        return result.to_dict()

    def _calculate_concept_ratio(self, puzzle: Dict[str, Any], solution: str) -> float:
        """
        Calculate ratio of key concepts found in solution.

        Args:
            puzzle: Puzzle dictionary
            solution: User's solution (lowercase)

        Returns:
            Ratio of concepts found (0.0 to 1.0)
        """
        key_concepts = puzzle.get('key_concepts', [])
        if not key_concepts:
            return 0.0

        concepts_found = sum(
            1 for concept in key_concepts
            if concept.lower() in solution
        )
        return concepts_found / len(key_concepts)

    def _evaluate_solution_quality(
        self,
        similarity: float,
        concept_ratio: float
    ) -> SolutionResult:
        """
        Evaluate solution quality based on similarity and concept coverage.

        Args:
            similarity: Text similarity score (0.0 to 1.0)
            concept_ratio: Concept coverage ratio (0.0 to 1.0)

        Returns:
            SolutionResult with score and feedback
        """
        const = PuzzleConstants

        # Excellent understanding
        if similarity > const.SIMILARITY_EXCELLENT or concept_ratio > const.CONCEPT_RATIO_EXCELLENT:
            return SolutionResult(
                correct=True,
                score=const.SCORE_PERFECT,
                feedback='Perfect! You understood the code completely.'
            )

        # Good understanding
        if similarity > const.SIMILARITY_GOOD or concept_ratio > const.CONCEPT_RATIO_GOOD:
            return SolutionResult(
                correct=True,
                score=const.SCORE_GREAT,
                feedback='Great job! You got the main idea.'
            )

        # Fair understanding
        if similarity > const.SIMILARITY_FAIR or concept_ratio > const.CONCEPT_RATIO_FAIR:
            return SolutionResult(
                correct=True,
                score=const.SCORE_GOOD,
                feedback='Correct! Though you could be more precise.'
            )

        # Poor understanding
        if similarity > const.SIMILARITY_POOR or concept_ratio > const.CONCEPT_RATIO_POOR:
            return SolutionResult(
                correct=False,
                score=const.SCORE_FAIR,
                feedback='Close, but not quite. Try running it with different inputs.'
            )

        # Minimal understanding
        return SolutionResult(
            correct=False,
            score=const.SCORE_POOR,
            feedback='Not quite right. Consider what the code actually does step by step.'
        )

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two strings using SequenceMatcher.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity ratio (0.0 to 1.0)
        """
        if not isinstance(text1, str) or not isinstance(text2, str):
            logger.warning("Similarity calculation requires string inputs")
            return 0.0

        return SequenceMatcher(None, text1, text2).ratio()

    def get_hint(self, puzzle_id: str, hint_number: int) -> Optional[str]:
        """
        Get a specific hint for a puzzle.

        Args:
            puzzle_id: ID of puzzle
            hint_number: Index of hint (0-based)

        Returns:
            Hint string or None if not found
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID: {puzzle_id}")
            return None

        if not isinstance(hint_number, int) or hint_number < 0:
            logger.error(f"Invalid hint number: {hint_number}")
            return None

        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return None

        hints = puzzle.get('hints', [])
        if hint_number < len(hints):
            return hints[hint_number]

        logger.warning(f"Hint {hint_number} not found for {puzzle_id}")
        return None

    def get_total_hints(self, puzzle_id: str) -> int:
        """
        Get total number of hints available for a puzzle.

        Args:
            puzzle_id: ID of puzzle

        Returns:
            Number of hints available
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID: {puzzle_id}")
            return 0

        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return 0

        return len(puzzle.get('hints', []))

    def get_puzzle_rewards(self, puzzle_id: str) -> List[str]:
        """
        Get rewards for completing a puzzle.

        Args:
            puzzle_id: ID of puzzle

        Returns:
            List of reward strings
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID: {puzzle_id}")
            return []

        puzzle = self.get_puzzle(puzzle_id)
        if not puzzle:
            return []

        rewards = puzzle.get('rewards', [])
        return rewards if isinstance(rewards, list) else []

    def get_puzzles_by_arc(self, arc: str) -> List[str]:
        """
        Get all puzzle IDs in a specific arc.

        Args:
            arc: Name of arc

        Returns:
            List of puzzle IDs in that arc
        """
        if not isinstance(arc, str) or not arc:
            logger.warning(f"Invalid arc name: {arc}")
            return []

        return [
            pid for pid, puzzle in self.puzzles.items()
            if puzzle.get('arc') == arc
        ]

    def get_puzzle_count(self) -> int:
        """
        Get total number of loaded puzzles.

        Returns:
            Count of puzzles
        """
        return len(self.puzzles)

    def parse_custom_input(self, input_str: str) -> List[Any]:
        """
        Parse user input string into Python values.

        Args:
            input_str: User input string

        Returns:
            List containing parsed value(s)
        """
        if not isinstance(input_str, str):
            logger.error("Input must be a string")
            return [str(input_str)]

        if not input_str.strip():
            return [""]

        try:
            # Try to evaluate as Python literal
            import ast
            value = ast.literal_eval(input_str)
            return [value]
        except (ValueError, SyntaxError) as e:
            # If that fails, return as string
            logger.debug(f"Could not parse as literal: {e}")
            return [input_str]
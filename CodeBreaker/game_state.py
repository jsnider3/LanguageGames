"""
Game State Management
Handles save/load and progress tracking with robust error handling.
"""

import json
import os
import shutil
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from dataclasses import dataclass, asdict
import logging


# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


class GameStateError(Exception):
    """Base exception for game state errors."""
    pass


class SaveFileCorruptedError(GameStateError):
    """Raised when save file is corrupted."""
    pass


@dataclass
class GameSettings:
    """Game settings configuration."""
    syntax_highlighting: bool = False
    trace_enabled: bool = False
    difficulty_mode: str = 'normal'

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class GameStatistics:
    """Game statistics tracking."""
    total_runs: int = 0
    total_attempts: int = 0
    puzzles_solved: int = 0
    hints_used_total: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class GameStateConstants:
    """Constants for game state management."""

    # Current version of save format
    SAVE_VERSION = '1.0'

    # State keys
    KEY_VERSION = 'version'
    KEY_CREATED = 'created'
    KEY_LAST_PLAYED = 'last_played'
    KEY_CURRENT_PUZZLE = 'current_puzzle'
    KEY_COMPLETED_PUZZLES = 'completed_puzzles'
    KEY_UNLOCKED_TOOLS = 'unlocked_tools'
    KEY_NOTEBOOK = 'notebook'
    KEY_HINTS_USED = 'hints_used'
    KEY_SCORES = 'scores'
    KEY_TOTAL_TIME = 'total_time'
    KEY_ACHIEVEMENTS = 'achievements'
    KEY_SETTINGS = 'settings'
    KEY_STATISTICS = 'statistics'
    KEY_UNLOCKED_SECRETS = 'unlocked_secrets'
    KEY_SPECIAL_ACHIEVEMENTS = 'special_achievements'

    # Validation
    MIN_SCORE = 0
    MAX_SCORE = 100
    VALID_DIFFICULTY_MODES = {'normal', 'hard', 'expert'}

    # Puzzle ID pattern
    PUZZLE_ID_PREFIX = 'puzzle_'
    SECRET_ID_PREFIX = 'secret_'


class GameState:
    """Manages game progress and state persistence with robust error handling."""

    def __init__(self, save_file: str = "codebreaker_save.json"):
        """
        Initialize game state.

        Args:
            save_file: Path to save file
        """
        if not isinstance(save_file, str) or not save_file:
            raise ValueError("Save file must be a non-empty string")

        self.save_file = save_file
        self.backup_file = f"{save_file}.backup"
        self.state = self._load_or_create()
        self._validate_state()

    def _load_or_create(self) -> Dict[str, Any]:
        """Load existing save or create new state."""
        # Try loading main save file
        if os.path.exists(self.save_file):
            try:
                return self._load_save_file(self.save_file)
            except (json.JSONDecodeError, KeyError, TypeError) as e:
                logger.warning(f"Save file corrupted: {e}")

                # Try loading backup
                if os.path.exists(self.backup_file):
                    try:
                        logger.info("Attempting to restore from backup...")
                        return self._load_save_file(self.backup_file)
                    except Exception as backup_error:
                        logger.error(f"Backup also corrupted: {backup_error}")

                # If both fail, create new state
                logger.warning("Creating new save file")
                return self._create_new_state()

        return self._create_new_state()

    def _load_save_file(self, filepath: str) -> Dict[str, Any]:
        """Load and validate a save file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate required keys
        required_keys = [
            GameStateConstants.KEY_VERSION,
            GameStateConstants.KEY_COMPLETED_PUZZLES,
            GameStateConstants.KEY_STATISTICS
        ]

        for key in required_keys:
            if key not in data:
                raise KeyError(f"Missing required key: {key}")

        return data

    def _create_new_state(self) -> Dict[str, Any]:
        """Create a new game state with all required fields."""
        const = GameStateConstants

        return {
            const.KEY_VERSION: const.SAVE_VERSION,
            const.KEY_CREATED: datetime.now().isoformat(),
            const.KEY_LAST_PLAYED: datetime.now().isoformat(),
            const.KEY_CURRENT_PUZZLE: 'puzzle_01',
            const.KEY_COMPLETED_PUZZLES: [],
            const.KEY_UNLOCKED_TOOLS: [],
            const.KEY_NOTEBOOK: {},
            const.KEY_HINTS_USED: {},
            const.KEY_SCORES: {},
            const.KEY_TOTAL_TIME: 0,
            const.KEY_ACHIEVEMENTS: [],
            const.KEY_SETTINGS: GameSettings().to_dict(),
            const.KEY_STATISTICS: GameStatistics().to_dict(),
            const.KEY_UNLOCKED_SECRETS: [],
            const.KEY_SPECIAL_ACHIEVEMENTS: []
        }

    def _validate_state(self):
        """Validate state structure and fix any issues."""
        const = GameStateConstants

        # Ensure all required keys exist
        default_state = self._create_new_state()
        for key, default_value in default_state.items():
            if key not in self.state:
                logger.warning(f"Adding missing key: {key}")
                self.state[key] = default_value

        # Validate data types
        self._ensure_list(const.KEY_COMPLETED_PUZZLES)
        self._ensure_list(const.KEY_UNLOCKED_TOOLS)
        self._ensure_list(const.KEY_ACHIEVEMENTS)
        self._ensure_dict(const.KEY_NOTEBOOK)
        self._ensure_dict(const.KEY_HINTS_USED)
        self._ensure_dict(const.KEY_SCORES)
        self._ensure_dict(const.KEY_SETTINGS)
        self._ensure_dict(const.KEY_STATISTICS)

    def _ensure_list(self, key: str):
        """Ensure a key contains a list."""
        if not isinstance(self.state.get(key), list):
            logger.warning(f"Fixing {key}: not a list")
            self.state[key] = []

    def _ensure_dict(self, key: str):
        """Ensure a key contains a dictionary."""
        if not isinstance(self.state.get(key), dict):
            logger.warning(f"Fixing {key}: not a dict")
            self.state[key] = {}

    def save(self) -> bool:
        """
        Save current state to disk with atomic write.

        Returns:
            True if save successful, False otherwise
        """
        self.state[GameStateConstants.KEY_LAST_PLAYED] = datetime.now().isoformat()

        try:
            # Create backup of existing save
            if os.path.exists(self.save_file):
                shutil.copy2(self.save_file, self.backup_file)

            # Write to temporary file first
            temp_file = f"{self.save_file}.tmp"
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(self.state, f, indent=2, ensure_ascii=False)

            # Atomic rename
            shutil.move(temp_file, self.save_file)
            return True

        except Exception as e:
            logger.error(f"Failed to save game: {e}")
            return False

    def _validate_puzzle_id(self, puzzle_id: str) -> bool:
        """Validate puzzle ID format."""
        if not isinstance(puzzle_id, str):
            return False
        return (puzzle_id.startswith(GameStateConstants.PUZZLE_ID_PREFIX) or
                puzzle_id.startswith(GameStateConstants.SECRET_ID_PREFIX))

    def is_puzzle_completed(self, puzzle_id: str) -> bool:
        """Check if a puzzle has been completed."""
        if not self._validate_puzzle_id(puzzle_id):
            logger.warning(f"Invalid puzzle ID: {puzzle_id}")
            return False
        return puzzle_id in self.state[GameStateConstants.KEY_COMPLETED_PUZZLES]

    def complete_puzzle(self, puzzle_id: str, score: int = 100) -> bool:
        """
        Mark a puzzle as completed.

        Args:
            puzzle_id: ID of the puzzle
            score: Score achieved (0-100)

        Returns:
            True if successful, False otherwise
        """
        if not self._validate_puzzle_id(puzzle_id):
            logger.error(f"Invalid puzzle ID: {puzzle_id}")
            return False

        # Validate score
        const = GameStateConstants
        score = max(const.MIN_SCORE, min(score, const.MAX_SCORE))

        # Mark as completed
        completed_list = self.state[const.KEY_COMPLETED_PUZZLES]
        if puzzle_id not in completed_list:
            completed_list.append(puzzle_id)
            self.state[const.KEY_STATISTICS]['puzzles_solved'] += 1

        # Update score if better
        scores = self.state[const.KEY_SCORES]
        if puzzle_id not in scores or score > scores[puzzle_id]:
            scores[puzzle_id] = score

        return self.save()

    def unlock_tool(self, tool_name: str) -> bool:
        """Unlock an analysis tool."""
        if not isinstance(tool_name, str) or not tool_name:
            logger.error(f"Invalid tool name: {tool_name}")
            return False

        tools = self.state[GameStateConstants.KEY_UNLOCKED_TOOLS]
        if tool_name not in tools:
            tools.append(tool_name)
            return self.save()
        return True

    def is_tool_unlocked(self, tool_name: str) -> bool:
        """Check if a tool is unlocked."""
        if not isinstance(tool_name, str):
            return False
        return tool_name in self.state[GameStateConstants.KEY_UNLOCKED_TOOLS]

    def use_hint(self, puzzle_id: str) -> bool:
        """Record that a hint was used."""
        if not self._validate_puzzle_id(puzzle_id):
            logger.error(f"Invalid puzzle ID: {puzzle_id}")
            return False

        hints = self.state[GameStateConstants.KEY_HINTS_USED]
        hints[puzzle_id] = hints.get(puzzle_id, 0) + 1
        self.state[GameStateConstants.KEY_STATISTICS]['hints_used_total'] += 1

        return self.save()

    def get_hints_used(self, puzzle_id: str) -> int:
        """Get number of hints used for a puzzle."""
        if not self._validate_puzzle_id(puzzle_id):
            return 0
        return self.state[GameStateConstants.KEY_HINTS_USED].get(puzzle_id, 0)

    def add_note(self, puzzle_id: str, note: str) -> bool:
        """Add a note for a puzzle."""
        if not self._validate_puzzle_id(puzzle_id):
            logger.error(f"Invalid puzzle ID: {puzzle_id}")
            return False

        if not isinstance(note, str) or not note.strip():
            logger.error("Note must be non-empty string")
            return False

        notebook = self.state[GameStateConstants.KEY_NOTEBOOK]
        if puzzle_id not in notebook:
            notebook[puzzle_id] = []

        notebook[puzzle_id].append({
            'note': note.strip(),
            'timestamp': datetime.now().isoformat()
        })

        return self.save()

    def get_notes(self, puzzle_id: str) -> List[str]:
        """Get all notes for a puzzle."""
        if not self._validate_puzzle_id(puzzle_id):
            return []

        notebook = self.state[GameStateConstants.KEY_NOTEBOOK]
        if puzzle_id not in notebook:
            return []

        return [entry['note'] for entry in notebook[puzzle_id]]

    def get_all_notes(self) -> Dict[str, List[str]]:
        """Get all notes across all puzzles."""
        return {pid: self.get_notes(pid)
                for pid in self.state[GameStateConstants.KEY_NOTEBOOK]}

    def unlock_achievement(self, achievement_id: str) -> bool:
        """Unlock an achievement."""
        if not isinstance(achievement_id, str) or not achievement_id:
            logger.error(f"Invalid achievement ID: {achievement_id}")
            return False

        achievements = self.state[GameStateConstants.KEY_ACHIEVEMENTS]
        if achievement_id not in achievements:
            achievements.append(achievement_id)
            return self.save()
        return True

    def get_progress(self) -> Dict[str, Any]:
        """Get overall progress statistics."""
        const = GameStateConstants
        return {
            'completed': len(self.state[const.KEY_COMPLETED_PUZZLES]),
            'unlocked_tools': len(self.state[const.KEY_UNLOCKED_TOOLS]),
            'achievements': len(self.state[const.KEY_ACHIEVEMENTS]),
            'total_score': sum(self.state[const.KEY_SCORES].values()),
            'statistics': self.state[const.KEY_STATISTICS].copy()
        }

    def set_current_puzzle(self, puzzle_id: str) -> bool:
        """Set the current puzzle."""
        if not self._validate_puzzle_id(puzzle_id):
            logger.error(f"Invalid puzzle ID: {puzzle_id}")
            return False

        self.state[GameStateConstants.KEY_CURRENT_PUZZLE] = puzzle_id
        return self.save()

    def get_current_puzzle(self) -> str:
        """Get the current puzzle ID."""
        return self.state[GameStateConstants.KEY_CURRENT_PUZZLE]

    def record_run(self):
        """Record that code was executed."""
        self.state[GameStateConstants.KEY_STATISTICS]['total_runs'] += 1

    def record_attempt(self):
        """Record a solution attempt."""
        self.state[GameStateConstants.KEY_STATISTICS]['total_attempts'] += 1

    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get a setting value."""
        if not isinstance(key, str):
            return default
        return self.state[GameStateConstants.KEY_SETTINGS].get(key, default)

    def set_setting(self, key: str, value: Any) -> bool:
        """Set a setting value."""
        if not isinstance(key, str) or not key:
            logger.error(f"Invalid setting key: {key}")
            return False

        # Validate specific settings
        if key == 'difficulty_mode':
            if value not in GameStateConstants.VALID_DIFFICULTY_MODES:
                logger.error(f"Invalid difficulty mode: {value}")
                return False

        self.state[GameStateConstants.KEY_SETTINGS][key] = value
        return self.save()

    def reset_game(self) -> bool:
        """Reset entire game (with confirmation in calling code)."""
        self.state = self._create_new_state()
        return self.save()

    def export_notebook(self, filename: str = "notebook_export.txt") -> bool:
        """
        Export notebook to text file.

        Args:
            filename: Output filename

        Returns:
            True if successful, False otherwise
        """
        if not isinstance(filename, str) or not filename:
            logger.error("Invalid filename")
            return False

        try:
            notebook = self.state[GameStateConstants.KEY_NOTEBOOK]

            with open(filename, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("CODEBREAKER - NOTEBOOK EXPORT\n")
                f.write("=" * 80 + "\n\n")

                for puzzle_id in sorted(notebook.keys()):
                    notes = notebook[puzzle_id]
                    f.write(f"\n[{puzzle_id.upper()}]\n")
                    f.write("-" * 80 + "\n")
                    for entry in notes:
                        f.write(f"  • {entry['note']}\n")
                    f.write("\n")

                f.write("=" * 80 + "\n")
                f.write(f"Exported: {datetime.now().isoformat()}\n")

            logger.info(f"Notebook exported to {filename}")
            return True

        except Exception as e:
            logger.error(f"Error exporting notebook: {e}")
            return False

    def get_completed_puzzles(self) -> Set[str]:
        """Get set of completed puzzle IDs."""
        return set(self.state[GameStateConstants.KEY_COMPLETED_PUZZLES])

    def get_statistics(self) -> Dict[str, int]:
        """Get game statistics."""
        return self.state[GameStateConstants.KEY_STATISTICS].copy()
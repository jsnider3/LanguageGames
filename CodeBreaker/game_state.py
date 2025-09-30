"""
Game State Management
Handles save/load and progress tracking.
"""

import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime


class GameState:
    """Manages game progress and state persistence."""

    def __init__(self, save_file: str = "codebreaker_save.json"):
        self.save_file = save_file
        self.state = self._load_or_create()

    def _load_or_create(self) -> Dict[str, Any]:
        """Load existing save or create new state."""
        if os.path.exists(self.save_file):
            try:
                with open(self.save_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Could not load save file: {e}")
                return self._create_new_state()
        else:
            return self._create_new_state()

    def _create_new_state(self) -> Dict[str, Any]:
        """Create a new game state."""
        return {
            'version': '1.0',
            'created': datetime.now().isoformat(),
            'last_played': datetime.now().isoformat(),
            'current_puzzle': 'puzzle_01',
            'completed_puzzles': [],
            'unlocked_tools': [],
            'notebook': {},
            'hints_used': {},
            'scores': {},
            'total_time': 0,
            'achievements': [],
            'settings': {
                'syntax_highlighting': False,
                'trace_enabled': False,
                'difficulty_mode': 'normal'
            },
            'statistics': {
                'total_runs': 0,
                'total_attempts': 0,
                'puzzles_solved': 0,
                'hints_used_total': 0
            }
        }

    def save(self):
        """Save current state to disk."""
        self.state['last_played'] = datetime.now().isoformat()
        try:
            with open(self.save_file, 'w') as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            print(f"Error: Could not save game: {e}")

    def is_puzzle_completed(self, puzzle_id: str) -> bool:
        """Check if a puzzle has been completed."""
        return puzzle_id in self.state['completed_puzzles']

    def complete_puzzle(self, puzzle_id: str, score: int = 100):
        """Mark a puzzle as completed."""
        if puzzle_id not in self.state['completed_puzzles']:
            self.state['completed_puzzles'].append(puzzle_id)
            self.state['statistics']['puzzles_solved'] += 1

        # Update score if better
        if puzzle_id not in self.state['scores'] or score > self.state['scores'][puzzle_id]:
            self.state['scores'][puzzle_id] = score

        self.save()

    def unlock_tool(self, tool_name: str):
        """Unlock an analysis tool."""
        if tool_name not in self.state['unlocked_tools']:
            self.state['unlocked_tools'].append(tool_name)
            self.save()

    def is_tool_unlocked(self, tool_name: str) -> bool:
        """Check if a tool is unlocked."""
        return tool_name in self.state['unlocked_tools']

    def use_hint(self, puzzle_id: str):
        """Record that a hint was used."""
        if puzzle_id not in self.state['hints_used']:
            self.state['hints_used'][puzzle_id] = 0
        self.state['hints_used'][puzzle_id] += 1
        self.state['statistics']['hints_used_total'] += 1
        self.save()

    def get_hints_used(self, puzzle_id: str) -> int:
        """Get number of hints used for a puzzle."""
        return self.state['hints_used'].get(puzzle_id, 0)

    def add_note(self, puzzle_id: str, note: str):
        """Add a note for a puzzle."""
        if puzzle_id not in self.state['notebook']:
            self.state['notebook'][puzzle_id] = []
        self.state['notebook'][puzzle_id].append({
            'note': note,
            'timestamp': datetime.now().isoformat()
        })
        self.save()

    def get_notes(self, puzzle_id: str) -> List[str]:
        """Get all notes for a puzzle."""
        if puzzle_id not in self.state['notebook']:
            return []
        return [entry['note'] for entry in self.state['notebook'][puzzle_id]]

    def get_all_notes(self) -> Dict[str, List[str]]:
        """Get all notes across all puzzles."""
        return {pid: self.get_notes(pid) for pid in self.state['notebook']}

    def unlock_achievement(self, achievement_id: str):
        """Unlock an achievement."""
        if achievement_id not in self.state['achievements']:
            self.state['achievements'].append(achievement_id)
            self.save()

    def get_progress(self) -> Dict[str, Any]:
        """Get overall progress statistics."""
        return {
            'completed': len(self.state['completed_puzzles']),
            'unlocked_tools': len(self.state['unlocked_tools']),
            'achievements': len(self.state['achievements']),
            'total_score': sum(self.state['scores'].values()),
            'statistics': self.state['statistics']
        }

    def set_current_puzzle(self, puzzle_id: str):
        """Set the current puzzle."""
        self.state['current_puzzle'] = puzzle_id
        self.save()

    def get_current_puzzle(self) -> str:
        """Get the current puzzle ID."""
        return self.state['current_puzzle']

    def record_run(self):
        """Record that code was executed."""
        self.state['statistics']['total_runs'] += 1

    def record_attempt(self):
        """Record a solution attempt."""
        self.state['statistics']['total_attempts'] += 1

    def get_setting(self, key: str) -> Any:
        """Get a setting value."""
        return self.state['settings'].get(key)

    def set_setting(self, key: str, value: Any):
        """Set a setting value."""
        self.state['settings'][key] = value
        self.save()

    def reset_game(self):
        """Reset entire game (with confirmation in calling code)."""
        self.state = self._create_new_state()
        self.save()

    def export_notebook(self, filename: str = "notebook_export.txt"):
        """Export notebook to text file."""
        try:
            with open(filename, 'w') as f:
                f.write("=" * 80 + "\n")
                f.write("CODEBREAKER - NOTEBOOK EXPORT\n")
                f.write("=" * 80 + "\n\n")

                for puzzle_id in sorted(self.state['notebook'].keys()):
                    notes = self.state['notebook'][puzzle_id]
                    f.write(f"\n[{puzzle_id.upper()}]\n")
                    f.write("-" * 80 + "\n")
                    for entry in notes:
                        f.write(f"  • {entry['note']}\n")
                    f.write("\n")

                f.write("=" * 80 + "\n")
                f.write(f"Exported: {datetime.now().isoformat()}\n")

            return True
        except Exception as e:
            print(f"Error exporting notebook: {e}")
            return False
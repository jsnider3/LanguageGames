#!/usr/bin/env python3
"""
Puzzle Validation Script
Validates all puzzles for correctness, consistency, and difficulty progression.
"""

import json
import os
import re
from typing import Dict, List, Tuple
from xenocode_vm import XenocodeVM


class PuzzleValidator:
    """Validates puzzle integrity and progression."""

    def __init__(self, puzzles_dir: str = "puzzles"):
        self.puzzles_dir = puzzles_dir
        self.puzzles: Dict[str, Dict] = {}
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def load_puzzles(self):
        """Load all puzzles from directory."""
        for filename in sorted(os.listdir(self.puzzles_dir)):
            if filename.endswith('.json'):
                puzzle_path = os.path.join(self.puzzles_dir, filename)
                try:
                    with open(puzzle_path, 'r', encoding='utf-8') as f:
                        puzzle = json.load(f)
                        self.puzzles[puzzle['id']] = puzzle
                except Exception as e:
                    self.errors.append(f"Failed to load {filename}: {e}")

    def validate_all(self) -> bool:
        """Run all validations. Returns True if all pass."""
        print("=" * 80)
        print("CODEBREAKER PUZZLE VALIDATION")
        print("=" * 80)
        print()

        self.load_puzzles()
        print(f"✓ Loaded {len(self.puzzles)} puzzles\n")

        # Run all validation checks
        self.validate_puzzle_count()
        self.validate_puzzle_structure()
        self.validate_puzzle_execution()
        self.validate_difficulty_progression()
        self.validate_arcs()
        self.validate_dependencies()
        self.analyze_complexity()

        # Print results
        print("\n" + "=" * 80)
        print("VALIDATION RESULTS")
        print("=" * 80)

        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  • {error}")

        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")

        if not self.errors and not self.warnings:
            print("\n✅ ALL VALIDATIONS PASSED!")
            return True
        elif not self.errors:
            print(f"\n✅ No errors, but {len(self.warnings)} warnings")
            return True
        else:
            print(f"\n❌ VALIDATION FAILED: {len(self.errors)} errors, {len(self.warnings)} warnings")
            return False

    def validate_puzzle_count(self):
        """Validate we have exactly 50 puzzles."""
        if len(self.puzzles) != 50:
            self.errors.append(f"Expected 50 puzzles, found {len(self.puzzles)}")
        else:
            print("✓ Puzzle count: 50")

    def validate_puzzle_structure(self):
        """Validate each puzzle has required fields."""
        required_fields = ['id', 'title', 'difficulty', 'arc', 'code',
                          'expected_output', 'solution_description', 'hints']

        for puzzle_id, puzzle in self.puzzles.items():
            for field in required_fields:
                if field not in puzzle:
                    self.errors.append(f"{puzzle_id}: Missing required field '{field}'")

            # Check for placeholder content
            if puzzle['title'].startswith('Challenge'):
                self.warnings.append(f"{puzzle_id}: Generic title '{puzzle['title']}'")

            if puzzle['arc'] == 'Mixed Arc':
                self.errors.append(f"{puzzle_id}: Invalid arc 'Mixed Arc'")

            if not puzzle.get('hints') or len(puzzle['hints']) < 2:
                self.warnings.append(f"{puzzle_id}: Less than 2 hints provided")

        print("✓ Structure validation complete")

    def validate_puzzle_execution(self):
        """Test that each puzzle executes and matches expected output."""
        vm = XenocodeVM()
        failures = []

        for puzzle_id in sorted(self.puzzles.keys()):
            puzzle = self.puzzles[puzzle_id]

            # Skip puzzle_48 (special interactive puzzle)
            if puzzle_id == 'puzzle_48':
                continue

            try:
                result = vm.execute(puzzle['code'])

                if not result['success']:
                    self.errors.append(f"{puzzle_id}: Execution failed - {result['error']}")
                    failures.append(puzzle_id)
                else:
                    # Check output matches expected
                    actual = '\n'.join(result['output'])
                    expected = puzzle['expected_output']

                    if actual != expected:
                        self.errors.append(
                            f"{puzzle_id}: Output mismatch\n" +
                            f"    Expected: {repr(expected)}\n" +
                            f"    Got: {repr(actual)}"
                        )
                        failures.append(puzzle_id)
            except Exception as e:
                self.errors.append(f"{puzzle_id}: Exception during execution - {e}")
                failures.append(puzzle_id)

        if not failures:
            print("✓ All puzzles execute correctly")
        else:
            print(f"✗ {len(failures)} puzzles failed execution")

    def validate_difficulty_progression(self):
        """Check that difficulty increases reasonably."""
        puzzle_list = sorted(self.puzzles.items(), key=lambda x: int(x[0].split('_')[1]))

        for i in range(len(puzzle_list) - 1):
            current_id, current = puzzle_list[i]
            next_id, next_puzzle = puzzle_list[i + 1]

            diff_jump = next_puzzle['difficulty'] - current['difficulty']

            if diff_jump > 2:
                self.warnings.append(
                    f"{next_id}: Difficulty jumps from {current['difficulty']} " +
                    f"to {next_puzzle['difficulty']} (gap > 2)"
                )

        print("✓ Difficulty progression checked")

    def validate_arcs(self):
        """Validate arc structure and progression."""
        valid_arcs = [
            'Tutorial Arc', 'Logic Arc', 'Iteration Arc', 'Functions Arc',
            'Data Structures Arc', 'Advanced Arc', 'Final Challenge'
        ]

        arc_puzzles = {arc: [] for arc in valid_arcs}

        for puzzle_id, puzzle in self.puzzles.items():
            arc = puzzle['arc']
            if arc not in valid_arcs:
                self.errors.append(f"{puzzle_id}: Invalid arc '{arc}'")
            else:
                arc_puzzles[arc].append(puzzle_id)

        # Check arc sizes
        arc_ranges = {
            'Tutorial Arc': (5, 5),
            'Logic Arc': (6, 8),
            'Iteration Arc': (6, 10),
            'Functions Arc': (6, 10),
            'Data Structures Arc': (6, 10),
            'Advanced Arc': (6, 10),
            'Final Challenge': (7, 10)
        }

        for arc, (min_size, max_size) in arc_ranges.items():
            count = len(arc_puzzles[arc])
            if count < min_size or count > max_size:
                self.warnings.append(f"{arc}: Expected {min_size}-{max_size} puzzles, found {count}")

        print("✓ Arc structure validated")

    def validate_dependencies(self):
        """Validate unlock requirements form a valid progression."""
        for puzzle_id in sorted(self.puzzles.keys()):
            puzzle = self.puzzles[puzzle_id]
            reqs = puzzle.get('unlock_requirements', [])

            # Check that requirements exist and are earlier puzzles
            for req_id in reqs:
                if req_id not in self.puzzles:
                    self.errors.append(f"{puzzle_id}: Requires non-existent puzzle '{req_id}'")
                else:
                    # Check req comes before current
                    current_num = int(puzzle_id.split('_')[1])
                    req_num = int(req_id.split('_')[1])
                    if req_num >= current_num:
                        self.errors.append(
                            f"{puzzle_id}: Requires {req_id} which comes after/same"
                        )

        print("✓ Dependencies validated")

    def analyze_complexity(self):
        """Analyze code complexity for difficulty correlation."""
        complexity_scores = []

        for puzzle_id in sorted(self.puzzles.keys()):
            puzzle = self.puzzles[puzzle_id]
            code = puzzle['code']

            # Calculate complexity metrics
            lines = len([l for l in code.split('\n') if l.strip() and not l.strip().startswith('#')])
            operators = len(re.findall(r'[⊕⊖⊛⊗⊘≈¬←]', code))
            loops = code.count('§iterate')
            conditionals = code.count('§if')
            functions = code.count('§function')

            complexity = (lines * 1) + (operators * 0.5) + (loops * 3) + (conditionals * 2) + (functions * 4)
            difficulty = puzzle['difficulty']

            complexity_scores.append((puzzle_id, complexity, difficulty))

            # Check if complexity and difficulty align
            expected_complexity_range = (difficulty * 5, difficulty * 15)
            if complexity < expected_complexity_range[0] or complexity > expected_complexity_range[1]:
                self.warnings.append(
                    f"{puzzle_id}: Complexity {complexity:.1f} doesn't match difficulty {difficulty}"
                )

        print("✓ Complexity analysis complete")

        # Show complexity stats
        avg_complexity = sum(c[1] for c in complexity_scores) / len(complexity_scores)
        print(f"  Average complexity: {avg_complexity:.1f}")


def main():
    """Run validation."""
    validator = PuzzleValidator()
    success = validator.validate_all()

    return 0 if success else 1


if __name__ == '__main__':
    import sys
    sys.exit(main())
"""
Algorithm Library
Reference library of algorithms demonstrated in puzzles.
"""

from typing import Dict, List


class AlgorithmLibrary:
    """Educational reference for algorithms in the game."""

    ALGORITHMS = {
        'linear_search': {
            'name': 'Linear Search',
            'puzzles': [14, 16],
            'description': 'Search through array sequentially',
            'time_complexity': 'O(n)',
            'real_world': 'Finding items in unsorted lists, simple lookups',
            'xenocode_example': '''
§iterate item §in array
  §if item ≈ target
    §transmit "found"
  §end_if
§end_iterate
'''
        },
        'accumulator': {
            'name': 'Accumulator Pattern',
            'puzzles': [15, 18, 25],
            'description': 'Building up a result through iteration',
            'time_complexity': 'O(n)',
            'real_world': 'Calculating sums, products, concatenating strings',
            'xenocode_example': '''
sum ← 0
§iterate num §in numbers
  sum ← sum ⊕ num
§end_iterate
'''
        },
        'frequency_counting': {
            'name': 'Frequency Counter',
            'puzzles': [20, 34],
            'description': 'Count occurrences using a dictionary',
            'time_complexity': 'O(n)',
            'real_world': 'Word counting, histogram generation, analytics',
            'xenocode_example': '''
counts ← §create_map
§iterate item §in items
  §if §exists counts[item]
    counts[item] ← counts[item] ⊕ 1
  §else
    counts[item] ← 1
  §end_if
§end_iterate
'''
        },
        'fibonacci': {
            'name': 'Fibonacci Sequence',
            'puzzles': [40],
            'description': 'Each number is sum of previous two',
            'time_complexity': 'O(n)',
            'real_world': 'Growth modeling, recursion examples, optimization',
            'xenocode_example': '''
a ← 0
b ← 1
§iterate i §in range
  §transmit a
  temp ← a ⊕ b
  a ← b
  b ← temp
§end_iterate
'''
        },
        'filter': {
            'name': 'Filter Pattern',
            'puzzles': [32],
            'description': 'Select elements matching criteria',
            'time_complexity': 'O(n)',
            'real_world': 'Database queries, search results, data cleaning',
            'xenocode_example': '''
§iterate num §in numbers
  §if num ⊗ threshold
    §transmit num
  §end_if
§end_iterate
'''
        },
        'map_transform': {
            'name': 'Map/Transform Pattern',
            'puzzles': [36, 44],
            'description': 'Transform each element of a collection',
            'time_complexity': 'O(n)',
            'real_world': 'Data transformation, formatting, unit conversion',
            'xenocode_example': '''
§iterate val §in input
  transformed ← val ⊛ 2
  §transmit transformed
§end_iterate
'''
        },
        'min_max': {
            'name': 'Min/Max Finding',
            'puzzles': [39],
            'description': 'Find minimum or maximum value',
            'time_complexity': 'O(n)',
            'real_world': 'Finding extremes, optimization, statistics',
            'xenocode_example': '''
maximum ← 0
§iterate val §in data
  §if val ⊗ maximum
    maximum ← val
  §end_if
§end_iterate
'''
        },
        'nested_data': {
            'name': 'Nested Data Structures',
            'puzzles': [35, 36],
            'description': 'Working with hierarchical data',
            'time_complexity': 'Varies',
            'real_world': 'JSON processing, tree structures, graphs',
            'xenocode_example': '''
outer ← §create_map
inner ← §create_map
inner["key"] ← "value"
outer["nested"] ← inner
§transmit outer["nested"]["key"]
'''
        },
    }

    def get_algorithm(self, name: str) -> Dict:
        """Get algorithm details."""
        return self.ALGORITHMS.get(name)

    def get_algorithms_by_puzzle(self, puzzle_num: int) -> List[Dict]:
        """Find algorithms demonstrated in a puzzle."""
        results = []
        for algo_id, algo in self.ALGORITHMS.items():
            if puzzle_num in algo['puzzles']:
                results.append({**algo, 'id': algo_id})
        return results

    def get_all_algorithms(self) -> Dict:
        """Get all algorithms."""
        return self.ALGORITHMS

    def search_algorithms(self, query: str) -> List[str]:
        """Search algorithms by name or description."""
        query = query.lower()
        results = []

        for algo_id, algo in self.ALGORITHMS.items():
            if query in algo['name'].lower() or query in algo['description'].lower():
                results.append(algo_id)

        return results
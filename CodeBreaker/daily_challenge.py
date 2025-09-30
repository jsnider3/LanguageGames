"""
Daily Challenge System
Generates a new challenge each day with leaderboard.
"""

import json
import hashlib
from datetime import datetime, date
from typing import Dict, Any, Optional
import random


class DailyChallenge:
    """Manages daily challenge generation and tracking."""

    def __init__(self, challenges_file: str = "daily_challenges.json"):
        self.challenges_file = challenges_file
        self.challenges_data = self._load_challenges()

    def _load_challenges(self) -> Dict:
        """Load challenge history."""
        try:
            with open(self.challenges_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {'history': {}, 'personal_bests': {}}

    def _save_challenges(self):
        """Save challenge data."""
        with open(self.challenges_file, 'w') as f:
            json.dump(self.challenges_data, f, indent=2)

    def get_today_challenge(self) -> Dict[str, Any]:
        """Get or generate today's challenge."""
        today = date.today().isoformat()

        if today in self.challenges_data['history']:
            return self.challenges_data['history'][today]

        # Generate new challenge
        challenge = self._generate_challenge(today)
        self.challenges_data['history'][today] = challenge
        self._save_challenges()

        return challenge

    def _generate_challenge(self, date_str: str) -> Dict[str, Any]:
        """Generate a procedural challenge based on date."""
        # Use date as seed for reproducibility
        seed = int(hashlib.md5(date_str.encode()).hexdigest(), 16) % (10 ** 8)
        random.seed(seed)

        templates = [
            {
                'name': 'Sum of Multiples',
                'description': 'Calculate sum of all multiples of X below Y',
                'generator': lambda: {
                    'x': random.randint(3, 7),
                    'y': random.randint(50, 150),
                }
            },
            {
                'name': 'Palindrome Check',
                'description': 'Check if a number is a palindrome',
                'generator': lambda: {
                    'number': random.randint(100, 999),
                }
            },
            {
                'name': 'FizzBuzz Variant',
                'description': 'FizzBuzz from 1 to N',
                'generator': lambda: {
                    'n': random.randint(15, 30),
                }
            },
            {
                'name': 'Array Maximum',
                'description': 'Find maximum in randomly generated array',
                'generator': lambda: {
                    'array': [random.randint(1, 100) for _ in range(random.randint(5, 10))],
                }
            },
        ]

        template = random.choice(templates)
        params = template['generator']()

        return {
            'date': date_str,
            'name': template['name'],
            'description': template['description'],
            'parameters': params,
            'difficulty': random.randint(3, 5),
            'completed_by': [],
            'best_times': []
        }

    def submit_completion(self, username: str, time_seconds: int, score: int):
        """Submit a challenge completion."""
        today = date.today().isoformat()
        challenge = self.get_today_challenge()

        if username not in challenge['completed_by']:
            challenge['completed_by'].append(username)

        challenge['best_times'].append({
            'username': username,
            'time': time_seconds,
            'score': score,
            'timestamp': datetime.now().isoformat()
        })

        # Sort by score descending, then time ascending
        challenge['best_times'].sort(key=lambda x: (-x['score'], x['time']))

        # Keep top 100
        challenge['best_times'] = challenge['best_times'][:100]

        self._save_challenges()

    def get_leaderboard(self, limit: int = 10) -> list:
        """Get today's leaderboard."""
        challenge = self.get_today_challenge()
        return challenge['best_times'][:limit]

    def get_streak(self, username: str) -> int:
        """Get user's current streak of daily completions."""
        streak = 0
        current_date = date.today()

        while True:
            date_str = current_date.isoformat()
            if date_str not in self.challenges_data['history']:
                break

            challenge = self.challenges_data['history'][date_str]
            if username not in challenge.get('completed_by', []):
                break

            streak += 1
            current_date = date.fromordinal(current_date.toordinal() - 1)

        return streak
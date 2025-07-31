"""
Test utilities and common fixtures for Star Trader tests.

Provides reusable test setup, mocking utilities, and common test patterns.
"""

import unittest
from unittest.mock import patch
import io
import sys
import os
import random
import signal

# Add the parent directory to the Python path to allow for local imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from startrader.main import Game
from startrader.galaxy import Galaxy
from startrader.classes import Ship, Player, Mission, CrewMember, Factory


class TimeoutError(Exception):
    """Exception raised when tests timeout."""
    pass


class BaseStarTraderTest(unittest.TestCase):
    """Base test class with common setup and utilities."""

    def timeout_handler(self, signum, frame):
        """Handles the timeout signal."""
        raise TimeoutError("Test timed out after 10 seconds")

    def setUp(self):
        """Set up a new Game instance for each test."""
        # Seeding random ensures that market prices are predictable for tests
        random.seed(42)
        self.game = Game()
        signal.signal(signal.SIGALRM, self.timeout_handler)

    def run_command(self, command_str):
        """Helper method to run commands through the dispatch system."""
        parts = command_str.split()
        if parts:
            verb = parts[0]
            handler = self.game.commands.get(verb)
            if handler:
                handler(parts)
        signal.alarm(10)  # 10 second timeout

    def tearDown(self):
        """Clean up after each test."""
        signal.alarm(0)  # Disable the alarm

    def assertCommandOutput(self, command, expected_text):
        """Assert that a command produces expected output."""
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command(command)
            output = fake_out.getvalue()
            self.assertIn(expected_text, output)
            return output

    def assertCommandFails(self, command, expected_error):
        """Assert that a command fails with expected error message."""
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command(command)
            output = fake_out.getvalue()
            self.assertIn(expected_error, output)

    def give_player_credits(self, amount):
        """Helper to give player credits for testing."""
        self.game.player.credits = amount

    def give_player_cargo(self, good, quantity):
        """Helper to give player cargo for testing."""
        self.game.player.ship.add_cargo(good, quantity)

    def set_ship_hull(self, hull_percentage):
        """Helper to set ship hull to a percentage of max."""
        max_hull = self.game.player.ship.max_hull
        self.game.player.ship.hull = int(max_hull * hull_percentage)
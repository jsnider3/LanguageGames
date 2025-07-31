"""
Navigation and travel system tests.

Tests for travel commands, fuel consumption, and route planning.
"""

from unittest.mock import patch
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestNavigation(BaseStarTraderTest):
    """Tests for the navigation and travel system."""

    def test_travel_valid(self):
        """Test a valid trip between systems without events."""
        initial_fuel = self.game.player.ship.fuel
        fuel_cost = self.game.galaxy.fuel_costs[("Sol", "Sirius")]

        # Patch random.random to ensure no event fires during this test
        with patch('random.random', return_value=1.0):
            with patch('sys.stdout', new=io.StringIO()):
                self.run_command(' '.join(["travel", "sirius"]))

        self.assertEqual(self.game.player.location.name, "Sirius")
        self.assertEqual(self.game.player.ship.fuel, initial_fuel - fuel_cost)

    def test_travel_insufficient_fuel(self):
        """Test traveling without enough fuel."""
        self.game.player.ship.fuel = 0 # Not enough for any trip
        initial_location = self.game.player.location

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command(' '.join(["travel", "sirius"]))
            self.assertIn("Not enough fuel", fake_out.getvalue())

        self.assertEqual(self.game.player.location.name, initial_location.name)

    def test_travel_invalid_destination(self):
        """Test traveling to a non-existent system."""
        initial_location = self.game.player.location

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command(' '.join(["travel", "betelgeuse"]))
            self.assertIn("Unknown system", fake_out.getvalue())

        self.assertEqual(self.game.player.location.name, initial_location.name)

    def test_fuel_consumption_calculation(self):
        """Test fuel consumption for Alpha Centauri trip."""
        fuel_cost_base = self.game.galaxy.fuel_costs[("Sol", "Alpha Centauri")]
        initial_fuel = self.game.player.ship.fuel

        with patch('random.random', return_value=1.0): # Prevent random events
            with patch('sys.stdout', new=io.StringIO()):
                self.run_command(' '.join(["travel", "alpha", "centauri"]))
        
        self.assertEqual(self.game.player.ship.fuel, initial_fuel - fuel_cost_base)
        self.assertEqual(self.game.player.location.name, "Alpha Centauri")
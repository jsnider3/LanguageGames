"""
Core game functionality tests.

Tests for basic game initialization, galaxy creation, and player state.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestCoreGame(BaseStarTraderTest):
    """Tests for core game functionality."""

    def test_galaxy_creation(self):
        """Test that the galaxy and its systems are created correctly."""
        self.assertIsNotNone(self.game.galaxy)
        self.assertIn("Sol", self.game.galaxy.systems)
        self.assertGreater(len(self.game.galaxy.systems), 4)  # Should have more than the 4 core systems

    def test_market_prices(self):
        """Test that market prices reflect the economy type."""
        sol = self.game.galaxy.systems["Sol"]
        self.assertEqual(sol.economy_type, "Core")
        
        # Sol should have all basic goods available
        basic_goods = ["Food", "Minerals", "Machinery", "Electronics", "Luxury Goods", "Medicine"]
        for good in basic_goods:
            self.assertIn(good, sol.market)
            self.assertGreater(sol.market[good]["price"], 0)

    def test_initial_player_state(self):
        """Test the player's starting conditions."""
        self.assertEqual(self.game.player.credits, 1000)
        self.assertEqual(self.game.player.location.name, "Sol")
        self.assertEqual(self.game.player.ship.get_cargo_used(), 0)

    def test_faction_initialization(self):
        """Test that factions are assigned to systems and player reputation is initialized."""
        self.assertEqual(self.game.galaxy.systems["Sol"].faction, "Federation")
        self.assertEqual(self.game.galaxy.systems["Sirius"].faction, "Syndicate")
        self.assertIn("Federation", self.game.player.reputation)
        self.assertEqual(self.game.player.reputation["Federation"], 0)
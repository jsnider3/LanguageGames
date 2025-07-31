"""
Reputation system tests.

Tests for faction reputation mechanics and related discounts.
"""

from unittest.mock import patch
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestReputation(BaseStarTraderTest):
    """Tests for the reputation system."""

    def test_reputation_gain_on_trade(self):
        """Test that buying or selling goods increases reputation with the local faction."""
        initial_rep = self.game.player.reputation["Federation"]
        
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["buy", "food", "1"]))
        
        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + 1)

        initial_rep = self.game.player.reputation["Federation"]
        self.game.player.ship.add_cargo("Food", 1) # Need something to sell
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["sell", "food", "1"]))

        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + 1)
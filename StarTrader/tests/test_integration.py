"""
Integration tests.

Tests for full game scenarios and system integration.
"""

from unittest.mock import patch
import random
import os
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest
from startrader.main import Game


class TestIntegration(BaseStarTraderTest):
    """Tests for full game integration scenarios."""

    def test_full_playthrough_scenario(self):
        """
        Runs a full playthrough scenario to test the game's flow and systems integration.
        This test is derived from the original playtest.py script.
        """
        # Use a specific seed to make the playthrough predictable
        random.seed(123)
        self.game = Game()

        # 1. Initial state check
        self.assertEqual(self.game.player.credits, 1000)
        self.assertEqual(self.game.player.location.name, "Sol")

        # 2. Buy food in Sol (Federation space) - affordable amount
        initial_rep = self.game.player.reputation["Federation"]
        food_price = self.game.galaxy.systems["Sol"].market["Food"]["price"]
        
        # Player starts as Civilian with no discounts, buy affordable amount (5 units)
        expected_cost = food_price * 5
        
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["buy", "food", "5"]))
        self.assertEqual(self.game.player.reputation["Federation"], initial_rep + 1)
        self.assertEqual(self.game.player.credits, 1000 - expected_cost)
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 5)

        # 3. Travel to Sirius (Syndicate space)
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["travel", "sirius"]))
        self.assertEqual(self.game.player.location.name, "Sirius")

        # 4. Sell food in Sirius
        initial_rep_syndicate = self.game.player.reputation["Syndicate"]
        credits_before_sale = self.game.player.credits
        
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["sell", "food", "5"]))
            actual_sale = self.game.player.credits - credits_before_sale
        
        self.assertEqual(self.game.player.reputation["Syndicate"], initial_rep_syndicate + 1)
        self.assertEqual(self.game.player.credits, credits_before_sale + actual_sale)
        self.assertEqual(self.game.player.ship.get_cargo_used(), 0)

        # 5. Travel back to Sol
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["travel", "sol"]))
        self.assertEqual(self.game.player.location.name, "Sol")

        # 6. Test discounted repair
        self.game.player.ship.hull = 70
        self.game.player.reputation["Federation"] = 55 # Manually set high rep
        self.game.player.credits = 1000 # Reset credits for predictability
        
        damage = self.game.player.ship.max_hull - self.game.player.ship.hull
        expected_cost = int((damage * 15) * 0.9)

        # Mock input to confirm repair
        with patch('builtins.input', return_value='y'):
            with patch('sys.stdout', new=io.StringIO()):
                self.run_command('repair')
        
        self.assertEqual(self.game.player.credits, 1000 - expected_cost)
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)

        # 7. Test fuel consumption (no discount implemented)
        fuel_cost_base = self.game.galaxy.fuel_costs[("Sol", "Alpha Centauri")]
        initial_fuel = self.game.player.ship.fuel

        with patch('random.random', return_value=1.0): # Prevent random events
            with patch('sys.stdout', new=io.StringIO()):
                self.run_command(' '.join(["travel", "alpha", "centauri"]))
        
        self.assertEqual(self.game.player.ship.fuel, initial_fuel - fuel_cost_base)
        self.assertEqual(self.game.player.location.name, "Alpha Centauri")

    def test_save_and_load_game(self):
        """Tests saving the game state to a file and loading it back."""
        # 1. Change the game state
        with patch('sys.stdout', new=io.StringIO()):
            self.game.player.credits = 5000
            initial_credits = self.game.player.credits
            self.game.player.add_reputation("Federation", 25)
            self.game.current_day = 10
            self.run_command(' '.join(["buy", "food", "5"]))
            actual_cost = initial_credits - self.game.player.credits

        # 2. Save the game
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_save(None)
        
        self.assertTrue(os.path.exists("savegame.json"))

        # 3. Load the save into the same game instance
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_load(None)

        # 4. Verify the loaded state matches the saved state
        self.assertEqual(self.game.player.credits, 5000 - actual_cost)
        self.assertEqual(self.game.player.reputation["Federation"], 26) # 25 + 1 from buying food
        self.assertEqual(self.game.current_day, 10)
        self.assertEqual(self.game.player.ship.get_cargo_used(), 5)

        # Clean up the save file
        os.remove("savegame.json")
"""
Trading system tests.

Tests for buying, selling, market dynamics, and price fluctuations.
"""

from unittest.mock import patch
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestTrading(BaseStarTraderTest):
    """Tests for the trading system."""

    def test_buy_valid(self):
        """Test a successful purchase."""
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        food_price = sol_market["Food"]["price"]
        
        # Player starts as Civilian rank with no discounts
        # Food is 153 credits, buying 2 units = 306 credits (affordable with 1000)
        expected_cost = food_price * 2
        
        # Command: buy food 2 (reduced quantity to make it affordable)
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["buy", "food", "2"]))

        self.assertEqual(self.game.player.credits, initial_credits - expected_cost)
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 2)

    def test_buy_insufficient_credits(self):
        """Test buying with not enough credits."""
        self.game.player.credits = 10 # Not enough for anything
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command("buy food 1")
            self.assertIn("Not enough credits", fake_out.getvalue())

    def test_sell_valid(self):
        """Test a successful sale."""
        # First, give the player something to sell
        self.game.player.ship.add_cargo("Minerals", 10)
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        mineral_price = sol_market["Minerals"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.run_command("sell minerals 10")

        self.assertEqual(self.game.player.credits, initial_credits + (mineral_price * 10))
        self.assertEqual(self.game.player.ship.get_cargo_used(), 0)

    def test_sell_more_than_owned(self):
        """Test selling more of a good than is in the cargo hold."""
        # Give the player 5 units of Minerals
        self.game.player.ship.add_cargo("Minerals", 5)
        initial_credits = self.game.player.credits

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command("sell minerals 10")  # Try to sell 10, but only have 5
            self.assertIn("You don't have 10 units of Minerals to sell", fake_out.getvalue())

        # Credits shouldn't change
        self.assertEqual(self.game.player.credits, initial_credits)

    def test_buy_multi_word_item(self):
        """Test buying an item with a space in its name."""
        # Give player enough credits for this test  
        self.game.player.credits = 5000
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        item_price = sol_market["Luxury Goods"]["price"]
        
        # Player starts as Civilian rank with no discounts
        # Luxury Goods is 1234 credits, buying 2 units = 2468 credits
        expected_cost = item_price * 2
        
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["buy", "luxury", "goods", "2"]))

        self.assertEqual(self.game.player.credits, initial_credits - expected_cost)
        self.assertEqual(self.game.player.ship.cargo_hold["Luxury Goods"], 2)

    def test_price_fluctuation_on_buy(self):
        """Test that buying a good increases its price."""
        # Give player enough credits for this test
        self.game.player.credits = 5000
        sol_market = self.game.galaxy.systems["Sol"].market
        initial_price = sol_market["Food"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["buy", "food", "20"]))

        self.assertGreater(sol_market["Food"]["price"], initial_price)

    def test_price_fluctuation_on_sell(self):
        """Test that selling a good decreases its price."""
        # First, give the player something to sell
        self.game.player.ship.add_cargo("Minerals", 20)
        sol_market = self.game.galaxy.systems["Sol"].market
        initial_price = sol_market["Minerals"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.run_command(' '.join(["sell", "minerals", "20"]))

        self.assertLess(sol_market["Minerals"]["price"], initial_price)
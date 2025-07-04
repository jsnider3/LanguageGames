import unittest
from unittest.mock import patch
import io
import sys
import os
import random

# Add the parent directory to the Python path to allow for local imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from StarTrader.startrader import Galaxy, Game, Ship, Player

class TestStarTrader(unittest.TestCase):
    """Tests for the Star Trader game."""

    def setUp(self):
        """Set up a new Game instance for each test."""
        # Seeding random ensures that market prices are predictable for tests
        random.seed(42)
        self.game = Game()

    def test_galaxy_creation(self):
        """Test that the galaxy and its systems are created correctly."""
        self.assertEqual(len(self.game.galaxy.systems), 4)
        self.assertIn("Sol", self.game.galaxy.systems)
        self.assertIn("Vega", self.game.galaxy.systems)

    def test_market_prices(self):
        """Test that market prices reflect the economy type."""
        sol_market = self.game.galaxy.systems["Sol"].market
        agri_market = self.game.galaxy.systems["Alpha Centauri"].market
        ind_market = self.game.galaxy.systems["Sirius"].market

        # Food should be cheap at an agricultural world and expensive elsewhere
        self.assertLess(agri_market["Food"]["price"], sol_market["Food"]["price"])
        self.assertGreater(ind_market["Food"]["price"], agri_market["Food"]["price"])

        # Machinery should be cheap at an industrial world
        self.assertLess(ind_market["Machinery"]["price"], sol_market["Machinery"]["price"])

    def test_initial_player_state(self):
        """Test the player's starting conditions."""
        self.assertEqual(self.game.player.credits, 1000)
        self.assertEqual(self.game.player.location.name, "Sol")
        self.assertEqual(self.game.player.ship.get_cargo_used(), 0)

    def test_buy_valid(self):
        """Test a successful purchase."""
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        food_price = sol_market["Food"]["price"]
        
        # Command: buy food 10
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "food", "10"])

        self.assertEqual(self.game.player.credits, initial_credits - (food_price * 10))
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 10)

    def test_buy_insufficient_credits(self):
        """Test buying with not enough credits."""
        self.game.player.credits = 10 # Not enough for anything
        initial_cargo_size = self.game.player.ship.get_cargo_used()

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_buy(["buy", "food", "10"])
            self.assertIn("Not enough credits", fake_out.getvalue())
        
        self.assertEqual(self.game.player.ship.get_cargo_used(), initial_cargo_size)

    def test_sell_valid(self):
        """Test a successful sale."""
        # First, give the player something to sell
        self.game.player.ship.add_cargo("Minerals", 5)
        initial_credits = self.game.player.credits
        sol_market = self.game.galaxy.systems["Sol"].market
        minerals_price = sol_market["Minerals"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell(["sell", "minerals", "3"])

        self.assertEqual(self.game.player.credits, initial_credits + (minerals_price * 3))
        self.assertEqual(self.game.player.ship.cargo_hold["Minerals"], 2)

    def test_sell_more_than_owned(self):
        """Test selling more of a good than is in the cargo hold."""
        self.game.player.ship.add_cargo("Food", 5)
        initial_credits = self.game.player.credits

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_sell(["sell", "food", "10"])
            self.assertIn("You don't have 10 units of Food to sell", fake_out.getvalue())

        self.assertEqual(self.game.player.credits, initial_credits)
        self.assertEqual(self.game.player.ship.cargo_hold["Food"], 5)

    def test_travel_valid(self):
        """Test a valid trip between systems without events."""
        initial_fuel = self.game.player.ship.fuel
        fuel_cost = self.game.galaxy.fuel_costs[("Sol", "Sirius")]

        # Patch random.random to ensure no event fires during this test
        with patch('random.random', return_value=1.0):
            with patch('sys.stdout', new=io.StringIO()):
                self.game._handle_travel(["travel", "sirius"])

        self.assertEqual(self.game.player.location.name, "Sirius")
        self.assertEqual(self.game.player.ship.fuel, initial_fuel - fuel_cost)

    def test_travel_insufficient_fuel(self):
        """Test traveling without enough fuel."""
        self.game.player.ship.fuel = 5 # Not enough for any trip
        initial_location = self.game.player.location

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_travel(["travel", "sirius"])
            self.assertIn("Not enough fuel", fake_out.getvalue())

        self.assertEqual(self.game.player.location.name, initial_location.name)

    def test_travel_invalid_destination(self):
        """Test traveling to a non-existent system."""
        initial_location = self.game.player.location

        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_travel(["travel", "betelgeuse"])
            self.assertIn("Unknown system", fake_out.getvalue())

        self.assertEqual(self.game.player.location.name, initial_location.name)

    def test_shipyard_upgrade(self):
        """Test a valid ship upgrade."""
        self.game.player.credits = 2000 # Ensure enough credits
        initial_credits = self.game.player.credits
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_upgrade(["upgrade", "engine"])

        self.assertEqual(self.game.player.ship.component_levels["engine"], 1)
        self.assertEqual(self.game.player.credits, initial_credits - 1500)
        self.assertLess(self.game.player.ship.fuel_efficiency, 1.0)

    def test_shipyard_repair(self):
        """Test repairing the ship."""
        self.game.player.ship.hull = 50
        self.game.player.credits = 1000
        
        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_repair()
        
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)
        # 50 damage * 15 credits/hp = 750. 1000 - 750 = 250
        self.assertEqual(self.game.player.credits, 250)

    def test_event_pirates(self):
        """Test the pirate event, choosing to pay."""
        initial_credits = self.game.player.credits
        event_manager = self.game.event_manager
        
        with patch('random.random', return_value=0.1): # Force event
            with patch('random.choice', return_value='pirate'):
                # Mock the pirate's demand and the player's choice
                with patch('random.randint', return_value=200):
                    with patch('builtins.input', return_value='pay'):
                        with patch('sys.stdout', new=io.StringIO()) as fake_out:
                            event_manager.trigger_event()
                            self.assertIn("You pay the pirates", fake_out.getvalue())
        
        self.assertEqual(self.game.player.credits, initial_credits - 200)

    def test_event_asteroid_field(self):
        """Test the asteroid field event."""
        initial_hull = self.game.player.ship.hull
        event_manager = self.game.event_manager
        
        with patch('random.random', return_value=0.1):
            with patch('random.choice', return_value='asteroid'):
                with patch('random.randint', return_value=10): # Force 10 damage
                     with patch('sys.stdout', new=io.StringIO()):
                        event_manager.trigger_event()

        self.assertEqual(self.game.player.ship.hull, initial_hull - 10)

    def test_price_fluctuation_on_buy(self):
        """Test that buying a good increases its price."""
        sol_market = self.game.galaxy.systems["Sol"].market
        initial_price = sol_market["Food"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_buy(["buy", "food", "20"])

        self.assertGreater(sol_market["Food"]["price"], initial_price)

    def test_price_fluctuation_on_sell(self):
        """Test that selling a good decreases its price."""
        # First, give the player something to sell
        self.game.player.ship.add_cargo("Minerals", 20)
        sol_market = self.game.galaxy.systems["Sol"].market
        initial_price = sol_market["Minerals"]["price"]

        with patch('sys.stdout', new=io.StringIO()):
            self.game._handle_sell(["sell", "minerals", "20"])

        self.assertLess(sol_market["Minerals"]["price"], initial_price)

    def test_economic_event_famine(self):
        """Test the effect of a famine event on market prices."""
        # Trigger a famine in Sirius
        self.game.galaxy.active_events["Sirius"] = {"type": "famine", "duration": 5}
        sirius_market = self.game.galaxy.systems["Sirius"].market
        initial_price = sirius_market["Food"]["price"]
        
        # Update markets to apply event effects
        self.game.galaxy.update_markets()

        # Price of food in the famine system should be dramatically higher
        self.assertGreater(sirius_market["Food"]["price"], initial_price)


if __name__ == '__main__':
    unittest.main()

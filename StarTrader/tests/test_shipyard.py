"""
Shipyard system tests.

Tests for ship upgrades, repairs, refueling, and module management.
"""

from unittest.mock import patch
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestShipyard(BaseStarTraderTest):
    """Tests for the shipyard system."""

    def test_shipyard_upgrade(self):
        """Test a valid ship upgrade."""
        self.game.player.credits = 5000 # Ensure enough credits
        initial_credits = self.game.player.credits
        initial_damage = self.game.player.ship.damage
        
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command(' '.join(["upgrade", "Fuel Tanks"]))
            output = fake_out.getvalue()
            # Check for success message
            self.assertIn("Successfully installed Fuel Tanks", output)
        
        # Check money was spent
        from startrader.game_data import MODULE_SPECS
        expected_cost = MODULE_SPECS["Fuel Tanks"]["price"]
        self.assertEqual(self.game.player.credits, initial_credits - expected_cost)
        
        # Check module was added
        self.assertIn("Fuel Tanks", self.game.player.ship.modules)

    def test_shipyard_upgrade_duplicate(self):
        """Test that the player can't install the same module twice."""
        self.game.player.credits = 20000  # Enough for Weapon Systems
        
        # Install Weapon Systems first
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command("upgrade Weapon Systems")
        
        # Try to install it again
        initial_credits = self.game.player.credits
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.run_command("upgrade Weapon Systems")
            output = fake_out.getvalue()
            self.assertIn("already has the Weapon Systems module", output)
        
        # Check no money was spent
        self.assertEqual(self.game.player.credits, initial_credits)
        
        # Check module list still has only one copy
        self.assertEqual(self.game.player.ship.modules.count("Weapon Systems"), 1)

    def test_shipyard_repair(self):
        """Test repairing the ship."""
        self.game.player.ship.hull = 50
        self.game.player.credits = 1000
        
        # Mock input to confirm repair
        with patch('builtins.input', return_value='y'):
            with patch('sys.stdout', new=io.StringIO()):
                self.run_command('repair')
        
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)
        # 50 damage * 15 credits/hp = 750. 1000 - 750 = 250
        self.assertEqual(self.game.player.credits, 250)

    def test_sell_module(self):
        """Tests selling a module from the ship."""
        # First install a module that can be sold
        self.game.player.credits = 10000
        
        # Install Shield Generator
        with patch('sys.stdout', new=io.StringIO()):
            self.run_command("upgrade Shield Generator")
        
        initial_credits = self.game.player.credits
        
        # Now try to sell it
        with patch('builtins.input', return_value='y'):
            with patch('sys.stdout', new=io.StringIO()) as fake_out:
                self.run_command("sellmodule Shield Generator")
                output = fake_out.getvalue()
                self.assertIn("Sold Shield Generator", output)
        
        # Check we got money back (half the purchase price)
        from startrader.game_data import MODULE_SPECS
        expected_refund = MODULE_SPECS["Shield Generator"]["price"] // 2
        self.assertEqual(self.game.player.credits, initial_credits + expected_refund)
        
        # Check module was removed
        self.assertNotIn("Shield Generator", self.game.player.ship.modules)

    def test_reputation_discount_fuel(self):
        """Test that high reputation gives a fuel discount."""
        # Set reputation to meet REPUTATION_DISCOUNT_THRESHOLD (50)
        self.game.player.reputation["Federation"] = 50
        self.game.player.ship.fuel = 5  # Start with less than full
        self.game.player.credits = 1000
        
        # Calculate expected cost
        fuel_needed = self.game.player.ship.max_fuel - self.game.player.ship.fuel
        expected_cost = fuel_needed * 9  # 10 credits per unit * 0.9 discount
        
        with patch('builtins.input', return_value='y'):
            with patch('sys.stdout', new=io.StringIO()) as fake_out:
                self.run_command('refuel')
                output = fake_out.getvalue()
                self.assertIn("Your good reputation with Federation gets you a fuel discount!", output)
        
        self.assertEqual(self.game.player.credits, 1000 - expected_cost)
        self.assertEqual(self.game.player.ship.fuel, self.game.player.ship.max_fuel)

    def test_reputation_discount_repair(self):
        """Test that high reputation gives a repair discount."""
        self.game.player.location = self.game.galaxy.systems["Sol"] # Shipyard is here
        self.game.player.reputation["Federation"] = 100 # High rep
        self.game.player.ship.hull = 80
        self.game.player.credits = 1000

        damage = self.game.player.ship.max_hull - self.game.player.ship.hull
        cost_base = damage * 15
        cost_discounted = int(cost_base * 0.9)

        # Mock input to confirm repair
        with patch('builtins.input', return_value='y'):
            with patch('sys.stdout', new=io.StringIO()):
                self.run_command('repair')

        self.assertEqual(self.game.player.credits, 1000 - cost_discounted)
        self.assertEqual(self.game.player.ship.hull, self.game.player.ship.max_hull)
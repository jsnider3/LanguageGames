"""
Event system tests.

Tests for travel events like pirates, asteroid fields, and market events.
"""

from unittest.mock import patch
import random
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestEvents(BaseStarTraderTest):
    """Tests for the event system."""

    def test_event_pirates(self):
        """Test the pirate event, choosing to fight."""
        initial_credits = self.game.player.credits
        event_manager = self.game.event_manager
        
        # Mock the input to choose option 1 (fight)
        with patch('builtins.input', return_value='1'):
            with patch('sys.stdout', new=io.StringIO()) as fake_out:
                # Trigger specific pirate encounter event
                event_manager.trigger_event('pirate_encounter')
                output = fake_out.getvalue()
                # New implementation says "Victory! The pirate ship is destroyed!"
                self.assertIn("Victory!", output)
        
        # Check that the player received salvage
        self.assertGreater(self.game.player.credits, initial_credits)

    def test_event_asteroid_field(self):
        """Test the asteroid field event."""
        initial_hull = self.game.player.ship.hull
        event_manager = self.game.event_manager
        
        # Choose option 2 (direct route) and force failure to take damage
        with patch('builtins.input', return_value='2'):
            with patch('random.random', return_value=0.9):  # Force failure (dodge_chance is usually < 0.9)
                with patch('random.randint', return_value=10): # Force 10 damage
                    with patch('sys.stdout', new=io.StringIO()):
                        # Trigger specific asteroid field event
                        event_manager.trigger_event('asteroid_field')

        self.assertEqual(self.game.player.ship.hull, initial_hull - 10)

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

    def test_news_command(self):
        """Tests the news command to ensure it reports events and bounties."""
        # 1. Create a famine event
        self.game.galaxy.active_events["Sirius"] = {"type": "famine", "duration": 5}
        
        # 2. Create a bounty mission
        from startrader.classes import Mission
        bounty_mission = Mission(self.game.galaxy.systems["Sol"], self.game.galaxy.systems["Vega"], "Federation", None, None, "BOUNTY", "Red-Eye")
        self.game.galaxy.systems["Sol"].available_missions.append(bounty_mission)
        
        # 3. Call the news handler and check the output
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_news(None)
            output = fake_out.getvalue()
            
            self.assertIn("A severe famine continues in the Sirius system.", output)
            self.assertIn("WANTED: The pirate Red-Eye is wanted by the Federation.", output)
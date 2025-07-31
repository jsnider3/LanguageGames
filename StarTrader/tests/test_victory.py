"""
Victory system tests.

Tests for victory condition checking and display.
"""

from unittest.mock import patch
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest
from startrader.classes import Ship, Factory, CrewMember


class TestVictory(BaseStarTraderTest):
    """Tests for the victory system."""

    def test_victory_conditions(self):
        """Test all victory condition checks."""
        # Test Economic Victory
        self.game.player.credits = 1000000
        self.assertTrue(self.game.victory_manager.check_victory_conditions(self.game.player, self.game.galaxy))
        self.assertEqual(self.game.victory_manager.victory_type, "Economic Victory - Master Trader")
        
        # Reset
        self.game.victory_manager.victory = False
        self.game.player.credits = 1000
        
        # Test Trade Empire Victory
        for i in range(5):
            ship = Ship("starter_ship")
            ship.id = f"test_ship_{i}"
            self.game.player.ships.append(ship)
        for i in range(3):
            factory = Factory("Sol", "Food", 1)
            self.game.player.factories.append(factory)
        self.assertTrue(self.game.victory_manager.check_victory_conditions(self.game.player, self.game.galaxy))
        self.assertEqual(self.game.victory_manager.victory_type, "Trade Empire - Merchant Prince")
        
        # Reset
        self.game.victory_manager.victory = False
        self.game.player.ships = [self.game.player.ship]
        self.game.player.factories = []
        
        # Test Political Victory
        self.game.player.reputation["Federation"] = 200
        self.game.player.reputation["Syndicate"] = 200
        self.assertTrue(self.game.victory_manager.check_victory_conditions(self.game.player, self.game.galaxy))
        self.assertEqual(self.game.victory_manager.victory_type, "Political Victory - Galactic Unifier")
        
        # Reset
        self.game.victory_manager.victory = False
        self.game.player.reputation = {"Federation": 0, "Syndicate": 0, "Independent": 0}
        
        # Test Explorer Victory
        for system_name in self.game.galaxy.systems:
            self.game.player.visited_systems.add(system_name)
        for system in self.game.galaxy.uncharted_systems.values():
            system.discovered = True
        self.assertTrue(self.game.victory_manager.check_victory_conditions(self.game.player, self.game.galaxy))
        self.assertEqual(self.game.victory_manager.victory_type, "Explorer Victory - Master of the Void")
        
        # Reset
        self.game.victory_manager.victory = False
        self.game.player.visited_systems = {"Sol"}
        
        # Test Personal Victory
        for i in range(5):
            crew = CrewMember(f"TestCrew{i}", "Engineer", 0, 50, "Test crew")
            crew.experience = 15
            self.game.player.crew.append(crew)
        self.assertTrue(self.game.victory_manager.check_victory_conditions(self.game.player, self.game.galaxy))
        self.assertEqual(self.game.victory_manager.victory_type, "Personal Victory - Legendary Captain")

    def test_victory_command(self):
        """Test the victory command display."""
        with patch('sys.stdout', new=io.StringIO()) as fake_out:
            self.game._handle_victory([])
            output = fake_out.getvalue()
            
            # Check that all victory conditions are displayed
            self.assertIn("ECONOMIC VICTORY", output)
            self.assertIn("TRADE EMPIRE", output)
            self.assertIn("POLITICAL VICTORY", output)
            self.assertIn("EXPLORER VICTORY", output)
            self.assertIn("PERSONAL VICTORY", output)
            
            # Check progress display
            self.assertIn("Progress:", output)
            self.assertIn("Ships:", output)
            self.assertIn("Factories:", output)
            self.assertIn("Systems visited:", output)
"""
Combat system tests.

Tests for tactical combat mechanics, weapon systems, and combat flow.
"""

from unittest.mock import patch
import io
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tests.test_utils import BaseStarTraderTest


class TestCombat(BaseStarTraderTest):
    """Tests for the combat system."""

    def test_tactical_combat(self):
        """Test the tactical combat system."""
        from startrader.combat import TacticalCombat, WeaponRange, CombatantType
        
        # Create a simple combat scenario
        enemy_data = [{
            "name": "Test Pirate",
            "type": "pirate",
            "hull": 30,
            "shield": 10,
            "damage": 10,
            "range": WeaponRange.MEDIUM,
            "speed": 2,
            "evasion": 10
        }]
        
        combat = TacticalCombat(self.game.player.ship, enemy_data, self.game)
        
        # Test initial setup
        self.assertEqual(len(combat.combatants), 2)  # Player + 1 enemy
        self.assertEqual(combat.player.ship_type, CombatantType.PLAYER)
        self.assertTrue(combat.player.is_alive())
        
        # Test grid
        self.assertEqual(combat.grid.width, 7)
        self.assertEqual(combat.grid.height, 7)
        
        # Test positioning
        self.assertEqual(combat.player.position.x, 0)  # Player starts on left
        enemy = combat.combatants[1]
        self.assertEqual(enemy.position.x, 6)  # Enemy starts on right
        
        # Test movement
        moves = combat.get_possible_moves(combat.player)
        self.assertGreater(len(moves), 0)  # Should have valid moves
        
        # Test combat mechanics
        # Damage the enemy to enable boarding
        enemy.hull = 9  # Set to less than 30% (30% of 30 is 9)
        # Move player truly adjacent to enemy
        combat.player.position.x = enemy.position.x - 1  # One tile to the left of enemy
        combat.player.position.y = enemy.position.y
        
        # Test boarding check
        boardable = []
        for e in combat.combatants:
            if e != combat.player and e.is_alive():
                distance = combat.player.position.distance_to(e.position)
                hull_percent = e.hull / e.max_hull
                if distance == 1 and hull_percent <= 0.3:
                    boardable.append(e)
        
        self.assertEqual(len(boardable), 1)  # Should be able to board the enemy
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from combat_manager import CombatManager, CombatAction, CombatState
from player import Player
from monsters import Goblin


class TestCriticalHitSystem(unittest.TestCase):
    """Test suite for critical hit functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.combat = CombatManager()
        self.player = Player("TestHero")
        self.enemy = Goblin()
        
    def test_critical_hit_initialization(self):
        """Test that critical hit properties are initialized correctly."""
        self.assertEqual(self.combat.critical_hit_chance, 0.1)
        self.assertEqual(self.combat.critical_hit_multiplier, 2.0)
        
    def test_calculate_damage_no_crit(self):
        """Test damage calculation without critical hit."""
        with patch('random.random', return_value=0.5):  # 50% > 10% chance, no crit
            damage, is_critical = self.combat._calculate_damage(10)
            self.assertEqual(damage, 10)
            self.assertFalse(is_critical)
            
    def test_calculate_damage_with_crit(self):
        """Test damage calculation with critical hit."""
        with patch('random.random', return_value=0.05):  # 5% < 10% chance, crit!
            damage, is_critical = self.combat._calculate_damage(10)
            self.assertEqual(damage, 20)  # 10 * 2.0
            self.assertTrue(is_critical)
            
    def test_calculate_damage_crit_disabled(self):
        """Test damage calculation with crits disabled."""
        with patch('random.random', return_value=0.05):  # Would crit if enabled
            damage, is_critical = self.combat._calculate_damage(10, can_crit=False)
            self.assertEqual(damage, 10)  # No multiplier applied
            self.assertFalse(is_critical)
            
    def test_player_critical_hit_in_combat(self):
        """Test player scoring a critical hit in combat."""
        self.combat.start_combat(self.player, self.enemy)
        
        # Mock random to guarantee critical hit
        with patch('random.random', return_value=0.05):
            result = self.combat.execute_action(CombatAction.ATTACK)
            
        # Check for critical damage (5 base * 2 = 10)
        self.assertEqual(result.damage_dealt, 10)
        self.assertIn("CRITICAL HIT!", result.messages[0])
        
    def test_enemy_critical_hit_in_combat(self):
        """Test enemy scoring a critical hit in combat."""
        self.combat.start_combat(self.player, self.enemy)
        self.enemy.hp = 100  # Ensure enemy survives
        
        # Mock random to guarantee enemy critical hit
        with patch('random.random', side_effect=[0.5, 0.05]):  # First for player miss, second for enemy crit
            result = self.combat.execute_action(CombatAction.ATTACK)
            
        # Check for critical hit message
        found_crit_message = any("CRITICAL HIT!" in msg for msg in result.messages)
        self.assertTrue(found_crit_message)
        
    def test_critical_hit_with_multiplier_change(self):
        """Test changing the critical hit multiplier."""
        self.combat.critical_hit_multiplier = 3.0
        
        with patch('random.random', return_value=0.05):  # Guarantee crit
            damage, is_critical = self.combat._calculate_damage(10)
            self.assertEqual(damage, 30)  # 10 * 3.0
            self.assertTrue(is_critical)
            
    def test_critical_hit_chance_change(self):
        """Test changing the critical hit chance."""
        self.combat.critical_hit_chance = 0.5  # 50% chance
        
        # Test multiple hits to verify new chance
        crits = 0
        with patch('random.random', side_effect=[0.3, 0.7, 0.4, 0.6]):  # 2 crits, 2 normal
            for _ in range(4):
                _, is_critical = self.combat._calculate_damage(10)
                if is_critical:
                    crits += 1
                    
        self.assertEqual(crits, 2)  # Should have 2 crits with 50% chance
        
    def test_parry_counterattack_no_crit(self):
        """Test that parry counterattacks cannot crit."""
        self.combat.start_combat(self.player, self.enemy)
        
        # Mock to guarantee parry success and would-be crit
        with patch('random.random', side_effect=[0.3, 0.05]):  # First for parry success, second for crit check
            result = self.combat.execute_action(CombatAction.PARRY)
            
        # Counter damage should be half of player attack (5 / 2 = 2)
        self.assertEqual(result.damage_dealt, 2)
        # Should not have critical hit message for counter
        counter_msg = next((msg for msg in result.messages if "counter with a quick strike" in msg), None)
        self.assertIsNotNone(counter_msg)
        self.assertNotIn("CRITICAL", counter_msg)


class TestCriticalHitIntegration(unittest.TestCase):
    """Test critical hits in full combat scenarios."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.combat = CombatManager()
        self.player = Player("TestHero")
        
    def test_critical_hit_defeats_enemy(self):
        """Test that a critical hit can defeat an enemy in one shot."""
        weak_enemy = Goblin()
        weak_enemy.hp = 5  # Low HP
        
        self.combat.start_combat(self.player, weak_enemy)
        
        # Guarantee critical hit
        with patch('random.random', return_value=0.05):
            result = self.combat.execute_action(CombatAction.ATTACK)
            
        # Enemy should be defeated (5 * 2 = 10 damage vs 5 HP)
        self.assertEqual(result.state_change, CombatState.PLAYER_VICTORY)
        self.assertIn("defeated", str(result.messages))
        
    def test_multiple_crits_in_combat(self):
        """Test multiple critical hits in a single combat."""
        enemy = Goblin()
        enemy.hp = 50  # High HP to survive multiple hits
        
        self.combat.start_combat(self.player, enemy)
        
        crit_count = 0
        # Simulate 5 attacks with predetermined crit chances
        crit_rolls = [0.05, 0.5, 0.02, 0.8, 0.09]  # 3 crits
        
        for roll in crit_rolls:
            with patch('random.random', return_value=roll):
                result = self.combat.execute_action(CombatAction.ATTACK)
                if any("CRITICAL HIT!" in msg for msg in result.messages):
                    crit_count += 1
                    
        self.assertEqual(crit_count, 3)


if __name__ == '__main__':
    unittest.main()
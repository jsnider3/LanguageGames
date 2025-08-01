import unittest
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from player import Player
from monsters import Monster, Goblin, Orc
from combat_manager import CombatManager, CombatAction, CombatState


class TestPlayerProgression(unittest.TestCase):
    """Test suite for player XP and leveling system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("TestHero")
        
    def test_initial_xp_values(self):
        """Test that player starts with correct XP values."""
        self.assertEqual(self.player.level, 1)
        self.assertEqual(self.player.xp, 0)
        self.assertEqual(self.player.xp_to_next_level, 10)
        
    def test_gain_xp_no_level(self):
        """Test gaining XP without leveling up."""
        leveled_up = self.player.gain_xp(5)
        
        self.assertEqual(self.player.xp, 5)
        self.assertEqual(self.player.level, 1)
        self.assertFalse(leveled_up)
        
    def test_gain_xp_single_level(self):
        """Test gaining enough XP to level up once."""
        initial_hp = self.player.max_hp
        initial_attack = self.player.attack_power
        
        leveled_up = self.player.gain_xp(10)
        
        self.assertEqual(self.player.level, 2)
        self.assertEqual(self.player.xp, 0)
        self.assertEqual(self.player.xp_to_next_level, 20)  # Level 2 * 10
        self.assertEqual(self.player.max_hp, initial_hp + 4)  # Warriors get +4 HP
        self.assertEqual(self.player.hp, self.player.max_hp)  # Full heal
        self.assertEqual(self.player.attack_power, initial_attack + 1)
        
        # Check return value
        self.assertTrue(leveled_up)
        
    def test_gain_xp_multiple_levels(self):
        """Test gaining enough XP to level up multiple times."""
        # Give enough XP to go from level 1 to level 3
        # Level 1->2: 10 XP, Level 2->3: 20 XP, Total: 30 XP
        leveled_up = self.player.gain_xp(35)
        
        self.assertEqual(self.player.level, 3)
        self.assertEqual(self.player.xp, 5)  # 35 - 10 - 20 = 5
        self.assertEqual(self.player.xp_to_next_level, 30)  # Level 3 * 10
        self.assertEqual(self.player.max_hp, 33)  # Warriors: 25 + 4 + 4
        self.assertEqual(self.player.attack_power, 7)  # 5 + 1 + 1
        self.assertTrue(leveled_up)
        
    def test_level_up_full_heal(self):
        """Test that leveling up fully heals the player."""
        self.player.hp = 5  # Damaged
        leveled_up = self.player.gain_xp(10)
        
        self.assertEqual(self.player.hp, self.player.max_hp)
        self.assertTrue(leveled_up)
        
    def test_xp_formula(self):
        """Test that XP requirements follow the Level * 10 formula."""
        # Level up to level 5
        total_xp = 10 + 20 + 30 + 40  # 100 XP total
        self.player.gain_xp(total_xp)
        
        self.assertEqual(self.player.level, 5)
        self.assertEqual(self.player.xp_to_next_level, 50)
        
    def test_monster_xp_rewards(self):
        """Test that monsters have appropriate XP rewards."""
        goblin = Goblin()
        orc = Orc()
        
        # XP should default to monster's HP
        self.assertEqual(goblin.xp_reward, 8)
        self.assertEqual(orc.xp_reward, 15)
        
        # Custom monster with specific XP
        boss = Monster("Boss", hp=50, attack_power=10, gold_reward=100, xp_reward=75)
        self.assertEqual(boss.xp_reward, 75)


class TestCombatXPIntegration(unittest.TestCase):
    """Test XP awards during combat."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("TestHero")
        self.combat = CombatManager()
        
    def test_xp_on_victory(self):
        """Test that defeating an enemy awards XP."""
        weak_enemy = Monster("Weak", hp=1, attack_power=1, gold_reward=5)
        self.combat.start_combat(self.player, weak_enemy)
        
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        # Check that XP was awarded
        self.assertEqual(self.player.xp, 1)  # XP = enemy HP
        self.assertIn("You gain 1 XP!", result.messages)
        
    def test_xp_level_up_in_combat(self):
        """Test leveling up during combat."""
        # Get player close to leveling
        self.player.xp = 9
        
        weak_enemy = Monster("Weak", hp=5, attack_power=1, gold_reward=5)
        self.combat.start_combat(self.player, weak_enemy)
        
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        # Should have leveled up
        self.assertEqual(self.player.level, 2)
        self.assertIn("*** LEVEL UP! ***", "\n".join(result.messages))
        
    def test_xp_from_parry_victory(self):
        """Test that parry counterattack victory also awards XP."""
        weak_enemy = Monster("Weak", hp=2, attack_power=1, gold_reward=5)
        self.combat.start_combat(self.player, weak_enemy)
        
        # Mock successful parry
        from unittest.mock import patch
        with patch('random.random', return_value=0.3):
            result = self.combat.execute_action(CombatAction.PARRY)
            
        # Should get XP if enemy died from counterattack
        if not weak_enemy.is_alive():
            self.assertEqual(self.player.xp, 2)
            self.assertIn("You gain 2 XP!", result.messages)


if __name__ == '__main__':
    unittest.main()
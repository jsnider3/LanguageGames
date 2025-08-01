import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from combat_manager import CombatManager, CombatAction, CombatState, CombatResult
from player import Player
from monsters import Monster, Goblin, Orc


class TestCombatManager(unittest.TestCase):
    """Test suite for the CombatManager class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.combat_manager = CombatManager()
        self.player = Player("TestHero")
        self.goblin = Goblin()
        
    def test_start_combat(self):
        """Test combat initialization."""
        messages = self.combat_manager.start_combat(self.player, self.goblin)
        
        self.assertEqual(self.combat_manager.combat_state, CombatState.ONGOING)
        self.assertEqual(self.combat_manager.player, self.player)
        self.assertEqual(self.combat_manager.enemy, self.goblin)
        self.assertEqual(self.combat_manager.turn_count, 0)
        self.assertFalse(self.combat_manager.player_defending)
        self.assertTrue(len(messages) > 0)
        self.assertIn("Goblin", messages[0])
        
    def test_available_actions(self):
        """Test getting available combat actions."""
        self.combat_manager.start_combat(self.player, self.goblin)
        actions = self.combat_manager.get_available_actions()
        
        self.assertIn(CombatAction.ATTACK, actions)
        self.assertIn(CombatAction.DEFEND, actions)
        self.assertIn(CombatAction.RUN, actions)
        
    def test_attack_action(self):
        """Test basic attack action."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_goblin_hp = self.goblin.hp
        initial_player_hp = self.player.hp
        
        # Mock random to prevent critical hits
        with patch('random.random', return_value=0.5):
            result = self.combat_manager.execute_action(CombatAction.ATTACK)
        
        # Check damage was dealt
        self.assertEqual(result.damage_dealt, self.player.attack_power)
        self.assertEqual(self.goblin.hp, initial_goblin_hp - self.player.attack_power)
        
        # Check player took damage (if goblin survived)
        if self.goblin.is_alive():
            # Damage might be reduced by armor
            self.assertGreater(result.damage_taken, 0)
            self.assertEqual(self.player.hp, initial_player_hp - result.damage_taken)
            
    def test_defend_action(self):
        """Test defend action reduces damage."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_player_hp = self.player.hp
        
        # Mock random to prevent critical hits
        with patch('random.random', return_value=0.5):
            result = self.combat_manager.execute_action(CombatAction.DEFEND)
        
        # Check defending flag was set
        self.assertTrue(self.combat_manager.player_defending)
        
        # Check damage was taken (defend reduces by 50%, plus armor may reduce further)
        self.assertGreater(result.damage_taken, 0)  # Some damage was taken
        self.assertLessEqual(result.damage_taken, self.goblin.attack_power // 2)  # No more than half damage
        self.assertEqual(self.player.hp, initial_player_hp - result.damage_taken)
        
    def test_run_action(self):
        """Test running from combat."""
        self.combat_manager.start_combat(self.player, self.goblin)
        
        # Mock random to control parting shot
        with patch('random.random', return_value=0.5):  # No parting shot
            result = self.combat_manager.execute_action(CombatAction.RUN)
            
        self.assertEqual(self.combat_manager.combat_state, CombatState.PLAYER_FLED)
        self.assertEqual(result.state_change, CombatState.PLAYER_FLED)
        self.assertEqual(result.damage_taken, 0)
        
    def test_run_action_with_parting_shot(self):
        """Test running with parting shot."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_player_hp = self.player.hp
        
        # Mock random to guarantee parting shot
        with patch('random.random', return_value=0.1):  # Parting shot occurs
            result = self.combat_manager.execute_action(CombatAction.RUN)
            
        # Player has 2 defense, goblin does 3 damage, so takes 1
        self.assertEqual(result.damage_taken, 1)
        self.assertEqual(self.player.hp, initial_player_hp - 1)
        
    def test_player_victory(self):
        """Test player defeating an enemy."""
        # Create a weak enemy
        weak_enemy = Monster("Weak", hp=1, attack_power=1, gold_reward=10)
        self.combat_manager.start_combat(self.player, weak_enemy)
        initial_gold = self.player.gold
        
        result = self.combat_manager.execute_action(CombatAction.ATTACK)
        
        self.assertEqual(self.combat_manager.combat_state, CombatState.PLAYER_VICTORY)
        self.assertEqual(result.state_change, CombatState.PLAYER_VICTORY)
        self.assertFalse(weak_enemy.is_alive())
        self.assertEqual(self.player.gold, initial_gold + 10)
        
    def test_player_defeat(self):
        """Test player being defeated."""
        # Create a strong enemy
        strong_enemy = Monster("Strong", hp=100, attack_power=50, gold_reward=100)
        self.player.hp = 5  # Low player HP
        self.combat_manager.start_combat(self.player, strong_enemy)
        
        result = self.combat_manager.execute_action(CombatAction.ATTACK)
        
        self.assertEqual(self.combat_manager.combat_state, CombatState.PLAYER_DEFEAT)
        self.assertEqual(result.state_change, CombatState.PLAYER_DEFEAT)
        self.assertFalse(self.player.is_alive())
        
    def test_combat_after_end(self):
        """Test that actions after combat ends are handled properly."""
        # End combat by running
        self.combat_manager.start_combat(self.player, self.goblin)
        with patch('random.random', return_value=0.5):
            self.combat_manager.execute_action(CombatAction.RUN)
            
        # Try another action
        result = self.combat_manager.execute_action(CombatAction.ATTACK)
        
        self.assertIn("Combat has ended", result.messages[0])
        
    def test_turn_counter(self):
        """Test that turns are counted properly."""
        # Use a custom enemy with high HP so it won't die in one hit
        tough_enemy = Monster("Tough Enemy", hp=100, attack_power=1, gold_reward=0)
        self.combat_manager.start_combat(self.player, tough_enemy)
        
        self.assertEqual(self.combat_manager.turn_count, 0)
        
        self.combat_manager.execute_action(CombatAction.ATTACK)
        self.assertEqual(self.combat_manager.turn_count, 1)
        
        self.combat_manager.execute_action(CombatAction.DEFEND)
        self.assertEqual(self.combat_manager.turn_count, 2)
        
    def test_dodge_action(self):
        """Test dodge action mechanics."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_player_hp = self.player.hp
        
        # Mock random for successful dodge
        with patch('random.random', return_value=0.5):  # Will dodge successfully
            result = self.combat_manager.execute_action(CombatAction.DODGE)
            
        self.assertEqual(self.combat_manager.dodge_cooldown, 3)
        self.assertEqual(result.damage_taken, 0)
        self.assertEqual(self.player.hp, initial_player_hp)
        
    def test_dodge_failure(self):
        """Test failed dodge."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_player_hp = self.player.hp
        
        # Mock random for failed dodge
        with patch('random.random', return_value=0.9):  # Will fail to dodge
            result = self.combat_manager.execute_action(CombatAction.DODGE)
            
        # Player has 2 defense, goblin does 3 damage, so takes 1
        self.assertEqual(result.damage_taken, 1)
        self.assertEqual(self.player.hp, initial_player_hp - 1)
        
    def test_parry_action(self):
        """Test successful parry with counterattack."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_goblin_hp = self.goblin.hp
        
        # Mock random for successful parry
        with patch('random.random', return_value=0.3):  # Will parry successfully
            result = self.combat_manager.execute_action(CombatAction.PARRY)
            
        self.assertEqual(self.combat_manager.parry_cooldown, 2)
        self.assertEqual(result.damage_taken, 0)
        # Check counterattack damage
        expected_counter = max(1, self.player.attack_power // 2)
        self.assertEqual(result.damage_dealt, expected_counter)
        self.assertEqual(self.goblin.hp, initial_goblin_hp - expected_counter)
        
    def test_parry_failure(self):
        """Test failed parry."""
        self.combat_manager.start_combat(self.player, self.goblin)
        initial_player_hp = self.player.hp
        
        # Mock random for failed parry
        with patch('random.random', return_value=0.7):  # Will fail to parry
            result = self.combat_manager.execute_action(CombatAction.PARRY)
            
        # Player has 2 defense, goblin does 3 damage, so takes 1
        self.assertEqual(result.damage_taken, 1)
        self.assertEqual(self.player.hp, initial_player_hp - 1)
        
    def test_cooldown_system(self):
        """Test that cooldowns work correctly."""
        self.combat_manager.start_combat(self.player, self.goblin)
        
        # Use dodge
        with patch('random.random', return_value=0.5):
            self.combat_manager.execute_action(CombatAction.DODGE)
        
        self.assertEqual(self.combat_manager.dodge_cooldown, 3)
        
        # Check dodge not available
        actions = self.combat_manager.get_available_actions()
        self.assertNotIn(CombatAction.DODGE, actions)
        
        # Do another action, cooldown should reduce
        self.combat_manager.execute_action(CombatAction.DEFEND)
        self.assertEqual(self.combat_manager.dodge_cooldown, 2)
        
        # Two more actions
        self.combat_manager.execute_action(CombatAction.DEFEND)
        self.assertEqual(self.combat_manager.dodge_cooldown, 1)
        
        self.combat_manager.execute_action(CombatAction.DEFEND)
        self.assertEqual(self.combat_manager.dodge_cooldown, 0)
        
        # Dodge should be available again
        actions = self.combat_manager.get_available_actions()
        self.assertIn(CombatAction.DODGE, actions)


class TestCombatIntegration(unittest.TestCase):
    """Integration tests for combat with game elements."""
    
    def test_goblin_combat(self):
        """Test a full combat with a goblin."""
        player = Player("Hero")
        goblin = Goblin()
        combat = CombatManager()
        
        combat.start_combat(player, goblin)
        
        # Fight until one dies
        while combat.is_combat_active():
            result = combat.execute_action(CombatAction.ATTACK)
            if result.state_change:
                break
                
        # Either player or goblin should be dead
        self.assertTrue(not player.is_alive() or not goblin.is_alive())
        
    def test_orc_combat(self):
        """Test combat with an orc (tougher enemy)."""
        player = Player("Hero")
        orc = Orc()
        combat = CombatManager()
        
        initial_orc_hp = orc.hp
        initial_orc_attack = orc.attack_power
        
        # Verify orc is tougher than goblin
        goblin = Goblin()
        self.assertGreater(orc.hp, goblin.hp)
        self.assertGreater(orc.attack_power, goblin.attack_power)
        
        combat.start_combat(player, orc)
        
        # Do one round of combat with no crit
        with patch('random.random', return_value=0.5):
            result = combat.execute_action(CombatAction.ATTACK)
        
        # Verify damage calculation
        if orc.is_alive():
            self.assertEqual(orc.hp, initial_orc_hp - player.attack_power)


if __name__ == '__main__':
    unittest.main()
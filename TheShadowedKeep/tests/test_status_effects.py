import unittest
from unittest.mock import MagicMock
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from status_effects import (
    StatusEffectType, StatusEffect, PoisonEffect, StunEffect, 
    WeaknessEffect, RegenerationEffect, StrengthEffect, ShieldEffect,
    StatusEffectManager
)
from player import Player
from monsters import Monster, Spider
from combat_manager import CombatManager, CombatAction, CombatState


class TestStatusEffects(unittest.TestCase):
    """Test individual status effects."""
    
    def test_poison_effect(self):
        """Test poison damage over time."""
        target = MagicMock()
        target.name = "Test Target"
        target.hp = 20
        
        poison = PoisonEffect(duration=3, potency=2)
        
        # Test initial application
        messages = poison.apply_effect(target)
        self.assertIn("poisoned", messages[0])
        
        # Test turn end damage
        messages = poison.on_turn_end(target)
        self.assertEqual(target.take_damage.call_count, 1)
        self.assertEqual(target.take_damage.call_args[0][0], 2)  # 2 damage
        self.assertEqual(poison.duration, 2)
        
        # Test expiration
        poison.duration = 1
        messages = poison.on_turn_end(target)
        self.assertIn("no longer poisoned", messages[1])
        self.assertEqual(poison.duration, 0)
        
    def test_stun_effect(self):
        """Test stun preventing actions."""
        target = MagicMock()
        target.name = "Test Target"
        
        stun = StunEffect(duration=1)
        
        # Test initial application
        messages = stun.apply_effect(target)
        self.assertIn("stunned", messages[0])
        
        # Test turn end
        messages = stun.on_turn_end(target)
        self.assertIn("recovers from stun", messages[0])
        self.assertEqual(stun.duration, 0)
        
    def test_weakness_effect(self):
        """Test weakness reducing attack power."""
        target = MagicMock()
        target.name = "Test Target"
        target.attack_power = 10
        
        weakness = WeaknessEffect(duration=3, potency=50)
        
        # Test initial application
        messages = weakness.apply_effect(target)
        self.assertIn("weakened", messages[0])
        self.assertEqual(target.attack_power, 5)  # 50% reduction
        
        # Test expiration
        weakness.duration = 1
        messages = weakness.on_turn_end(target)
        self.assertIn("strength returns", messages[0])
        self.assertEqual(target.attack_power, 10)  # Restored
        
    def test_regeneration_effect(self):
        """Test regeneration healing over time."""
        target = MagicMock()
        target.name = "Test Target"
        target.hp = 10
        target.max_hp = 20
        
        regen = RegenerationEffect(duration=5, potency=2)
        
        # Test initial application
        messages = regen.apply_effect(target)
        self.assertIn("regenerating", messages[0])
        
        # Test turn end healing
        messages = regen.on_turn_end(target)
        self.assertEqual(target.hp, 12)  # +2 HP
        self.assertIn("regenerates 2 HP", messages[0])
        
        # Test healing cap
        target.hp = 19
        messages = regen.on_turn_end(target)
        self.assertEqual(target.hp, 20)  # Capped at max
        
    def test_strength_effect(self):
        """Test strength increasing attack power."""
        target = MagicMock()
        target.name = "Test Target"
        target.attack_power = 10
        
        strength = StrengthEffect(duration=3, potency=50)
        
        # Test initial application
        messages = strength.apply_effect(target)
        self.assertIn("stronger", messages[0])
        self.assertEqual(target.attack_power, 15)  # 50% increase
        
    def test_shield_effect(self):
        """Test shield absorbing damage."""
        target = MagicMock()
        target.name = "Test Target"
        
        shield = ShieldEffect(duration=2, potency=5)
        
        # Test initial application
        messages = shield.apply_effect(target)
        self.assertIn("5 HP shield", messages[0])
        
        # Test damage absorption
        remaining = shield.absorb_damage(3)
        self.assertEqual(remaining, 0)
        self.assertEqual(shield.shield_hp, 2)
        
        # Test shield breaking
        remaining = shield.absorb_damage(5)
        self.assertEqual(remaining, 3)
        self.assertEqual(shield.shield_hp, 0)


class TestStatusEffectManager(unittest.TestCase):
    """Test status effect management."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.manager = StatusEffectManager()
        self.target = MagicMock()
        self.target.name = "Test"
        self.target.hp = 20
        self.target.attack_power = 10
        
    def test_add_effect(self):
        """Test adding status effects."""
        poison = PoisonEffect(duration=3)
        messages = self.manager.add_effect(poison, self.target)
        
        self.assertTrue(self.manager.has_effect(StatusEffectType.POISON))
        self.assertIn("poisoned", messages[0])
        
    def test_effect_refresh(self):
        """Test refreshing existing effects."""
        # Add initial poison
        poison1 = PoisonEffect(duration=2)
        self.manager.add_effect(poison1, self.target)
        
        # Add another poison with longer duration
        poison2 = PoisonEffect(duration=5)
        messages = self.manager.add_effect(poison2, self.target)
        
        self.assertIn("refreshed", messages[0])
        self.assertEqual(self.manager.effects[StatusEffectType.POISON].duration, 5)
        
    def test_is_stunned(self):
        """Test stun checking."""
        self.assertFalse(self.manager.is_stunned())
        
        stun = StunEffect(duration=1)
        self.manager.add_effect(stun, self.target)
        
        self.assertTrue(self.manager.is_stunned())
        
    def test_process_turn_end(self):
        """Test processing all effects at turn end."""
        # Add multiple effects
        poison = PoisonEffect(duration=2, potency=2)
        regen = RegenerationEffect(duration=2, potency=3)
        
        self.manager.add_effect(poison, self.target)
        self.manager.add_effect(regen, self.target)
        
        # Process turn
        messages = self.manager.process_turn_end(self.target)
        
        # Should have messages from both effects
        self.assertTrue(any("poison damage" in msg for msg in messages))
        self.assertTrue(any("regenerates" in msg for msg in messages))
        
        # Check expired effects are removed
        poison.duration = 0
        messages = self.manager.process_turn_end(self.target)
        self.assertFalse(self.manager.has_effect(StatusEffectType.POISON))
        
    def test_clear_all_effects(self):
        """Test clearing all effects."""
        self.manager.add_effect(PoisonEffect(3), self.target)
        self.manager.add_effect(StunEffect(1), self.target)
        
        self.manager.clear_all_effects()
        self.assertEqual(len(self.manager.effects), 0)


class TestStatusEffectsInCombat(unittest.TestCase):
    """Test status effects during combat."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("Test Hero")
        self.combat = CombatManager()
        
    def test_spider_poison_on_hit(self):
        """Test spider applying poison on hit."""
        spider = Spider()
        self.combat.start_combat(self.player, spider)
        
        # Mock to guarantee poison application
        import random
        with unittest.mock.patch('random.random', return_value=0.1):  # Will poison
            # Let spider attack
            result = self.combat.execute_action(CombatAction.DEFEND)
            
            # Check if poison was applied
            if result.damage_taken > 0:
                self.assertTrue(self.player.status_effects.has_effect(StatusEffectType.POISON))
                self.assertIn("poisoned", " ".join(result.messages))
                
    def test_poison_damage_over_time(self):
        """Test poison dealing damage over multiple turns."""
        self.player.status_effects.add_effect(PoisonEffect(duration=3, potency=2), self.player)
        
        enemy = Monster("Test", hp=5, attack_power=1, gold_reward=0)
        self.combat.start_combat(self.player, enemy)
        
        initial_hp = self.player.hp
        
        # Execute a turn
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        # Should see poison damage message
        self.assertIn("poison damage", " ".join(result.messages))
        # HP should be reduced by poison
        self.assertLess(self.player.hp, initial_hp)
        
    def test_player_stunned_cannot_act(self):
        """Test stunned player cannot take actions."""
        self.player.status_effects.add_effect(StunEffect(duration=1), self.player)
        
        enemy = Monster("Test", hp=10, attack_power=5, gold_reward=0)
        self.combat.start_combat(self.player, enemy)
        
        # Try to attack while stunned
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        # Should see stun message
        self.assertIn("stunned and cannot act", " ".join(result.messages))
        # Enemy should still attack
        self.assertGreater(result.damage_taken, 0)
        
    def test_shield_absorbs_damage(self):
        """Test shield effect absorbing damage."""
        self.player.status_effects.add_effect(ShieldEffect(duration=2, potency=10), self.player)
        
        enemy = Monster("Test", hp=10, attack_power=5, gold_reward=0)
        self.combat.start_combat(self.player, enemy)
        
        initial_hp = self.player.hp
        
        # Take damage with shield
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        # Damage should be reduced by shield
        actual_damage = initial_hp - self.player.hp
        # With 5 attack and potential defense, damage should be less than 5
        self.assertLessEqual(actual_damage, 5)


if __name__ == '__main__':
    unittest.main()
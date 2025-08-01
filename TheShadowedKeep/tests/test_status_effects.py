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
    
    def setUp(self):
        """Set up a mock target for effects."""
        self.target = Player("Test Target")

    def test_poison_effect(self):
        """Test poison damage over time."""
        poison = PoisonEffect(duration=3, potency=2)
        
        messages = poison.apply_effect(self.target)
        self.assertIn("poisoned", messages[0])
        
        initial_hp = self.target.hp
        messages = poison.on_turn_end(self.target)
        # Poison damage is reduced by defense (Warrior has 2 defense), min 1 damage
        self.assertEqual(self.target.hp, initial_hp - 1)
        self.assertEqual(poison.duration, 2)
        
        poison.duration = 1
        messages = poison.on_turn_end(self.target)
        self.assertIn("no longer poisoned", messages[1])
        self.assertEqual(poison.duration, 0)
        
    def test_stun_effect(self):
        """Test stun preventing actions."""
        stun = StunEffect(duration=1)
        messages = stun.apply_effect(self.target)
        self.assertIn("stunned", messages[0])
        
        messages = stun.on_turn_end(self.target)
        self.assertIn("recovers from stun", messages[0])
        self.assertEqual(stun.duration, 0)
        
    def test_weakness_effect_on_player(self):
        """Test weakness reducing player's base attack power."""
        original_attack = self.target.base_attack_power
        
        weakness = WeaknessEffect(duration=3, potency=50)
        
        messages = weakness.apply_effect(self.target)
        self.assertIn("weakened", messages[0])
        self.assertEqual(self.target.base_attack_power, int(original_attack * 0.5))
        
        weakness.duration = 1
        messages = weakness.on_turn_end(self.target)
        self.assertIn("strength returns", messages[0])
        self.assertEqual(self.target.base_attack_power, original_attack)

    def test_regeneration_effect(self):
        """Test regeneration healing over time."""
        self.target.hp = 10
        regen = RegenerationEffect(duration=5, potency=2)
        
        messages = regen.apply_effect(self.target)
        self.assertIn("regenerating", messages[0])
        
        regen.on_turn_end(self.target)
        self.assertEqual(self.target.hp, 12)
        
        # Test healing cap (Warrior starts with 25 max HP)
        self.target.hp = 24
        regen.on_turn_end(self.target)
        self.assertEqual(self.target.hp, 25)

    def test_strength_effect_on_player(self):
        """Test strength increasing player's base attack power."""
        original_attack = self.target.base_attack_power
        
        strength = StrengthEffect(duration=3, potency=50)
        
        messages = strength.apply_effect(self.target)
        self.assertIn("stronger", messages[0])
        self.assertEqual(self.target.base_attack_power, int(original_attack * 1.5))

    def test_shield_effect(self):
        """Test shield absorbing damage."""
        shield = ShieldEffect(duration=2, potency=5)
        messages = shield.apply_effect(self.target)
        self.assertIn("5 HP shield", messages[0])
        
        remaining = shield.absorb_damage(3)
        self.assertEqual(remaining, 0)
        self.assertEqual(shield.shield_hp, 2)
        
        remaining = shield.absorb_damage(5)
        self.assertEqual(remaining, 3)
        self.assertEqual(shield.shield_hp, 0)


class TestStatusEffectManager(unittest.TestCase):
    """Test status effect management."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.manager = StatusEffectManager()
        self.target = Player("Test")
        
    def test_add_effect(self):
        """Test adding status effects."""
        poison = PoisonEffect(duration=3)
        messages = self.manager.add_effect(poison, self.target)
        
        self.assertTrue(self.manager.has_effect(StatusEffectType.POISON))
        self.assertIn("poisoned", messages[0])
        
    def test_effect_refresh(self):
        """Test refreshing existing effects."""
        poison1 = PoisonEffect(duration=2)
        self.manager.add_effect(poison1, self.target)
        
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
        poison = PoisonEffect(duration=2, potency=2)
        regen = RegenerationEffect(duration=2, potency=3)
        
        self.manager.add_effect(poison, self.target)
        self.manager.add_effect(regen, self.target)
        
        messages = self.manager.process_turn_end(self.target)
        
        self.assertTrue(any("poison damage" in msg for msg in messages))
        self.assertTrue(any("regenerates" in msg for msg in messages))
        
        poison.duration = 0
        self.manager.process_turn_end(self.target)
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
        
        with unittest.mock.patch('random.random', return_value=0.1):  # Will poison
            result = self.combat.execute_action(CombatAction.DEFEND)
            
            if result.damage_taken > 0:
                self.assertTrue(self.player.status_effects.has_effect(StatusEffectType.POISON))
                self.assertTrue(any("poisoned" in msg for msg in result.messages))
                
    def test_poison_damage_over_time(self):
        """Test poison dealing damage over multiple turns."""
        self.player.status_effects.add_effect(PoisonEffect(duration=3, potency=2), self.player)
        enemy = Monster("Test", hp=100, attack_power=1, gold_reward=0)
        self.combat.start_combat(self.player, enemy)
        
        initial_hp = self.player.hp
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        self.assertTrue(any("poison damage" in msg for msg in result.messages))
        self.assertLess(self.player.hp, initial_hp)
        
    def test_player_stunned_cannot_act(self):
        """Test stunned player cannot take actions."""
        self.player.status_effects.add_effect(StunEffect(duration=1), self.player)
        enemy = Monster("Test", hp=10, attack_power=5, gold_reward=0)
        self.combat.start_combat(self.player, enemy)
        
        result = self.combat.execute_action(CombatAction.ATTACK)
        
        self.assertIn("You are stunned and cannot act!", result.messages)
        self.assertGreater(result.damage_taken, 0)
        
    def test_shield_absorbs_damage(self):
        """Test shield effect absorbing damage."""
        self.player.status_effects.add_effect(ShieldEffect(duration=2, potency=10), self.player)
        # Use a stronger enemy that won't die in one hit
        enemy = Monster("Test", hp=50, attack_power=5, gold_reward=0)
        self.combat.start_combat(self.player, enemy)
        
        initial_hp = self.player.hp
        # Mock random to prevent critical hits (0.5 > 0.1 critical threshold)
        with unittest.mock.patch('random.random', return_value=0.5):
            result = self.combat.execute_action(CombatAction.ATTACK)
        
        actual_damage = initial_hp - self.player.hp
        self.assertEqual(actual_damage, 0)
        shield = self.player.status_effects.get_shield()
        # Shield should have absorbed 5 damage from enemy attack
        self.assertEqual(shield.shield_hp, 5)


if __name__ == '__main__':
    unittest.main()
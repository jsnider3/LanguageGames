import unittest
from unittest.mock import MagicMock
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from consumables import (
    ConsumableType, ConsumableItem, Inventory,
    HealingPotion, ManaPotion, Antidote, StrengthPotion, DefensePotion,
    RegenerationPotion, Bread, Cheese, Meat, SmokeBomb, ThrowingKnife, FireBomb
)
from player import Player
from monsters import Monster
from status_effects import StatusEffectType, PoisonEffect


class TestConsumableItems(unittest.TestCase):
    """Test individual consumable items."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("Test Hero")
        
    def test_healing_potion(self):
        """Test healing potion restores HP."""
        potion = HealingPotion(potency=20)
        self.player.hp = 10
        
        # Test can use
        can_use, reason = potion.can_use(self.player)
        self.assertTrue(can_use)
        
        # Test use
        messages = potion.use(self.player)
        self.assertEqual(self.player.hp, 25)  # Player starts with 25 HP, was at 10, healed to 25 (max)
        self.assertIn("15 HP", messages[0])  # Only healed 15 because hit max HP
        
        # Test can't use at full HP
        self.player.hp = self.player.max_hp
        can_use, reason = potion.can_use(self.player)
        self.assertFalse(can_use)
        
    def test_mana_potion(self):
        """Test mana potion restores mana."""
        from character_classes import Mage
        
        # Create mage player
        mage_player = Player("Test Mage", character_class=Mage())
        potion = ManaPotion(potency=10)
        
        # Use some mana
        mage_player.character_class.spend_mana(5)
        
        # Test can use
        can_use, reason = potion.can_use(mage_player)
        self.assertTrue(can_use)
        
        # Test use
        messages = potion.use(mage_player)
        self.assertEqual(mage_player.character_class.current_mana, 
                        mage_player.character_class.max_mana)
        
        # Test can't use by non-mage
        can_use, reason = potion.can_use(self.player)
        self.assertFalse(can_use)
        self.assertEqual(reason, "No mana system")
        
    def test_antidote(self):
        """Test antidote cures poison."""
        antidote = Antidote()
        
        # Apply poison
        poison = PoisonEffect(duration=3, potency=2)
        self.player.status_effects.add_effect(poison, self.player)
        
        # Use antidote
        messages = antidote.use(self.player)
        self.assertFalse(self.player.status_effects.has_effect(StatusEffectType.POISON))
        self.assertIn("neutralizes the poison", messages[0])
        
        # Test preventative use
        messages = antidote.use(self.player)
        self.assertIn("precaution", messages[0])
        
    def test_strength_potion(self):
        """Test strength potion increases attack."""
        potion = StrengthPotion()
        original_attack = self.player.base_attack_power
        
        # Use potion
        messages = potion.use(self.player)
        self.assertTrue(self.player.status_effects.has_effect(StatusEffectType.STRENGTH))
        # The effect modifies base_attack_power, not the property
        self.assertEqual(self.player.base_attack_power, int(original_attack * 1.5))
        
        # Can't use another while active
        can_use, reason = potion.can_use(self.player)
        self.assertFalse(can_use)
        
    def test_defense_potion(self):
        """Test defense potion grants shield."""
        potion = DefensePotion()
        
        # Use potion
        messages = potion.use(self.player)
        self.assertTrue(self.player.status_effects.has_effect(StatusEffectType.SHIELD))
        
        # Shield should absorb damage
        shield = self.player.status_effects.get_shield()
        self.assertIsNotNone(shield)
        self.assertEqual(shield.shield_hp, 15)
        
    def test_bread_healing(self):
        """Test bread heals small amount."""
        bread = Bread()
        self.player.hp = 20
        
        # Can't use in combat
        can_use, reason = bread.can_use(self.player, in_combat=True)
        self.assertFalse(can_use)
        self.assertEqual(reason, "Can't eat during combat")
        
        # Can use outside combat
        can_use, reason = bread.can_use(self.player, in_combat=False)
        self.assertTrue(can_use)
        
        # Test healing
        messages = bread.use(self.player)
        self.assertEqual(self.player.hp, 25)  # +5 HP (capped at max)
        
    def test_cheese_cures_weakness(self):
        """Test cheese heals and cures weakness."""
        cheese = Cheese()
        self.player.hp = 10  # Lower HP to test healing
        
        # Apply weakness
        from status_effects import WeaknessEffect
        weakness = WeaknessEffect(duration=3, potency=50)
        self.player.status_effects.add_effect(weakness, self.player)
        
        # Use cheese
        messages = cheese.use(self.player)
        self.assertEqual(self.player.hp, 22)  # 10 + 12 HP
        self.assertFalse(self.player.status_effects.has_effect(StatusEffectType.WEAKNESS))
        self.assertIn("restores your strength", " ".join(messages))
        
    def test_smoke_bomb_escape(self):
        """Test smoke bomb allows escape."""
        bomb = SmokeBomb()
        
        # Can only use in combat
        can_use, reason = bomb.can_use(self.player, in_combat=False)
        self.assertFalse(can_use)
        
        can_use, reason = bomb.can_use(self.player, in_combat=True)
        self.assertTrue(can_use)
        
        # Test use
        messages = bomb.use(self.player)
        self.assertIn("escape", messages[1])
        
    def test_throwing_knife_damage(self):
        """Test throwing knife deals damage."""
        knife = ThrowingKnife()
        enemy = Monster("Test Enemy", hp=20, attack_power=5, gold_reward=0)
        
        # Use knife
        messages = knife.use(self.player, target=enemy)
        self.assertEqual(enemy.hp, 10)  # 20 - 10 damage
        self.assertIn("10 damage", messages[0])
        
        # No target
        messages = knife.use(self.player, target=None)
        self.assertIn("No target", messages[0])
        
    def test_fire_bomb_burn(self):
        """Test fire bomb deals damage and burns."""
        bomb = FireBomb()
        enemy = Monster("Test Enemy", hp=30, attack_power=5, gold_reward=0)
        
        # Use bomb
        messages = bomb.use(self.player, target=enemy)
        self.assertEqual(enemy.hp, 15)  # 30 - 15 damage
        self.assertIn("15 damage", messages[0])
        # Should apply burn effect
        self.assertTrue(enemy.status_effects.has_effect(StatusEffectType.POISON))


class TestInventory(unittest.TestCase):
    """Test inventory management."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.inventory = Inventory(max_slots=5)
        
    def test_add_items(self):
        """Test adding items to inventory."""
        potion1 = HealingPotion()
        potion2 = HealingPotion()
        bread = Bread()
        
        # Add items
        self.assertTrue(self.inventory.add_item(potion1))
        self.assertTrue(self.inventory.add_item(potion2))
        self.assertTrue(self.inventory.add_item(bread))
        
        # Check counts
        self.assertEqual(self.inventory.get_count(ConsumableType.HEALING_POTION), 2)
        self.assertEqual(self.inventory.get_count(ConsumableType.BREAD), 1)
        
    def test_remove_items(self):
        """Test removing items from inventory."""
        potion1 = HealingPotion()
        potion2 = HealingPotion()
        
        self.inventory.add_item(potion1)
        self.inventory.add_item(potion2)
        
        # Remove one
        removed = self.inventory.remove_item(ConsumableType.HEALING_POTION)
        self.assertIsNotNone(removed)
        self.assertEqual(self.inventory.get_count(ConsumableType.HEALING_POTION), 1)
        
        # Remove last one
        removed = self.inventory.remove_item(ConsumableType.HEALING_POTION)
        self.assertIsNotNone(removed)
        self.assertEqual(self.inventory.get_count(ConsumableType.HEALING_POTION), 0)
        
        # Try to remove when empty
        removed = self.inventory.remove_item(ConsumableType.HEALING_POTION)
        self.assertIsNone(removed)
        
    def test_stack_limits(self):
        """Test item stacking limits."""
        # Potions stack to 10
        for _ in range(10):
            self.assertTrue(self.inventory.add_item(HealingPotion()))
            
        # 11th should fail (stack is full, no more of this type allowed)
        self.assertFalse(self.inventory.add_item(HealingPotion()))
        
        # Check we have 10 potions
        self.assertEqual(self.inventory.get_count(ConsumableType.HEALING_POTION), 10)
        
    def test_inventory_full(self):
        """Test inventory slot limit."""
        # Fill all 5 slots with different items
        self.inventory.add_item(HealingPotion())
        self.inventory.add_item(ManaPotion())
        self.inventory.add_item(Bread())
        self.inventory.add_item(Cheese())
        self.inventory.add_item(SmokeBomb())
        
        # Try to add a new item type
        self.assertFalse(self.inventory.add_item(Meat()))
        
        # Can still add to existing stacks
        self.assertTrue(self.inventory.add_item(HealingPotion()))
        
    def test_get_all_items(self):
        """Test getting all items list."""
        self.inventory.add_item(HealingPotion())
        self.inventory.add_item(HealingPotion())
        self.inventory.add_item(Bread())
        
        items = self.inventory.get_all_items()
        self.assertEqual(len(items), 2)
        
        # Check format
        for item_type, count in items:
            self.assertIsInstance(item_type, ConsumableType)
            self.assertIsInstance(count, int)


class TestConsumablesInCombat(unittest.TestCase):
    """Test using consumables during combat."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("Test Hero")
        self.player.inventory.add_item(HealingPotion())
        self.player.inventory.add_item(ThrowingKnife())
        self.player.inventory.add_item(SmokeBomb())
        
    def test_combat_item_usage(self):
        """Test using items in combat manager."""
        from combat_manager import CombatManager, CombatAction
        
        combat = CombatManager()
        enemy = Monster("Test Enemy", hp=20, attack_power=5, gold_reward=0)
        combat.start_combat(self.player, enemy)
        
        # Use healing potion
        self.player.hp = 10
        result = combat.execute_action(CombatAction.USE_ITEM, ConsumableType.HEALING_POTION)
        self.assertGreater(self.player.hp, 10)
        self.assertEqual(self.player.inventory.get_count(ConsumableType.HEALING_POTION), 0)
        
        # Use throwing knife
        result = combat.execute_action(CombatAction.USE_ITEM, ConsumableType.THROWING_KNIFE)
        self.assertEqual(enemy.hp, 10)  # 20 - 10 damage
        
        # Use smoke bomb to escape
        result = combat.execute_action(CombatAction.USE_ITEM, ConsumableType.SMOKE_BOMB)
        self.assertFalse(combat.is_combat_active())


if __name__ == '__main__':
    unittest.main()
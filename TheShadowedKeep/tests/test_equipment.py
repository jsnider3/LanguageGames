import unittest
from unittest.mock import patch
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from player import Player
from equipment import (Equipment, EquipmentSlot, EquipmentStats, EquipmentManager,
                      RustyDagger, IronSword, SteelSword,
                      LeatherArmor, ChainMail,
                      LuckyCharm, HealthRing)
from combat_manager import CombatManager, CombatAction


class TestEquipmentStats(unittest.TestCase):
    """Test equipment stat calculations."""
    
    def test_equipment_stats_addition(self):
        """Test adding equipment stats together."""
        stats1 = EquipmentStats(attack=5, defense=2)
        stats2 = EquipmentStats(attack=3, defense=1, max_hp=10)
        
        combined = stats1 + stats2
        self.assertEqual(combined.attack, 8)
        self.assertEqual(combined.defense, 3)
        self.assertEqual(combined.max_hp, 10)
        
    def test_equipment_string_representation(self):
        """Test equipment string formatting."""
        sword = IronSword()
        self.assertIn("Iron Sword", str(sword))
        self.assertIn("+3 ATK", str(sword))
        
        armor = LeatherArmor()
        self.assertIn("Leather Armor", str(armor))
        self.assertIn("+2 DEF", str(armor))
        self.assertIn("+5 HP", str(armor))


class TestEquipmentManager(unittest.TestCase):
    """Test equipment management system."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.manager = EquipmentManager()
        
    def test_initial_empty_slots(self):
        """Test that all slots start empty."""
        for slot in EquipmentSlot:
            self.assertIsNone(self.manager.slots[slot])
            
    def test_equip_item(self):
        """Test equipping an item."""
        sword = RustyDagger()
        old_item = self.manager.equip(sword)
        
        self.assertIsNone(old_item)
        self.assertEqual(self.manager.slots[EquipmentSlot.WEAPON], sword)
        
    def test_replace_equipment(self):
        """Test replacing equipped item."""
        dagger = RustyDagger()
        sword = IronSword()
        
        self.manager.equip(dagger)
        old_item = self.manager.equip(sword)
        
        self.assertEqual(old_item, dagger)
        self.assertEqual(self.manager.slots[EquipmentSlot.WEAPON], sword)
        
    def test_unequip_item(self):
        """Test unequipping an item."""
        sword = IronSword()
        self.manager.equip(sword)
        
        removed = self.manager.unequip(EquipmentSlot.WEAPON)
        
        self.assertEqual(removed, sword)
        self.assertIsNone(self.manager.slots[EquipmentSlot.WEAPON])
        
    def test_total_stats(self):
        """Test calculating total stats from equipment."""
        self.manager.equip(IronSword())  # +3 ATK
        self.manager.equip(LeatherArmor())  # +2 DEF, +5 HP
        self.manager.equip(LuckyCharm())  # +10% crit, +5% dodge
        
        total = self.manager.get_total_stats()
        
        self.assertEqual(total.attack, 3)
        self.assertEqual(total.defense, 2)
        self.assertEqual(total.max_hp, 5)
        self.assertEqual(total.crit_chance, 0.1)
        self.assertEqual(total.dodge_chance, 0.05)
        
    def test_describe_equipment(self):
        """Test equipment description."""
        self.manager.equip(IronSword())
        descriptions = self.manager.describe_equipment()
        
        self.assertEqual(len(descriptions), 3)
        self.assertIn("Weapon: Iron Sword", descriptions[0])
        self.assertIn("Armor: Empty", descriptions[1])
        self.assertIn("Accessory: Empty", descriptions[2])


class TestPlayerEquipment(unittest.TestCase):
    """Test player integration with equipment."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("TestHero")
        
    def test_attack_power_with_equipment(self):
        """Test that equipment increases attack power."""
        base_attack = self.player.base_attack_power
        
        sword = IronSword()  # +3 ATK
        self.player.equipment.equip(sword)
        
        self.assertEqual(self.player.attack_power, base_attack + 3)
        
    def test_defense_with_equipment(self):
        """Test that equipment provides defense."""
        # Player now defaults to Warrior which has 2 base defense
        self.assertEqual(self.player.defense, 2)
        
        armor = ChainMail()  # +4 DEF
        self.player.equipment.equip(armor)
        
        self.assertEqual(self.player.defense, 6)  # 2 base + 4 equipment
        
    def test_max_hp_with_equipment(self):
        """Test that equipment increases max HP."""
        initial_max_hp = self.player.max_hp
        initial_hp = self.player.hp
        
        ring = HealthRing()  # +10 HP
        self.player.equipment.equip(ring)
        self.player.update_max_hp()
        
        self.assertEqual(self.player.max_hp, initial_max_hp + 10)
        self.assertEqual(self.player.hp, initial_hp + 10)  # Should heal the difference
        
    def test_damage_reduction_from_defense(self):
        """Test that defense reduces damage taken."""
        armor = ChainMail()  # +4 DEF
        self.player.equipment.equip(armor)
        
        # Take 10 damage (player has 2 base + 4 armor = 6 defense)
        actual_damage = self.player.take_damage(10)
        
        self.assertEqual(actual_damage, 4)  # 10 - 6 defense
        self.assertEqual(self.player.hp, 21)  # 25 - 4 (warrior starts with 25 HP)
        
    def test_minimum_damage(self):
        """Test that damage is always at least 1."""
        armor = ChainMail()  # +4 DEF
        self.player.equipment.equip(armor)
        
        # Take 3 damage (less than defense)
        actual_damage = self.player.take_damage(3)
        
        self.assertEqual(actual_damage, 1)  # Minimum 1 damage


class TestEquipmentInCombat(unittest.TestCase):
    """Test equipment effects in combat."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.player = Player("TestHero")
        self.combat = CombatManager()
        
    def test_weapon_damage_in_combat(self):
        """Test that weapons increase damage dealt."""
        from monsters import Goblin
        goblin = Goblin()
        
        # Combat without weapon
        self.combat.start_combat(self.player, goblin)
        base_damage = self.player.base_attack_power
        
        # Equip weapon
        sword = SteelSword()  # +5 ATK
        self.player.equipment.equip(sword)
        
        # Player should deal more damage
        self.assertEqual(self.player.attack_power, base_damage + 5)
        
    def test_armor_in_combat(self):
        """Test that armor reduces damage in combat."""
        from monsters import Monster
        enemy = Monster("Test", hp=10, attack_power=10, gold_reward=5)
        
        # Equip armor
        armor = LeatherArmor()  # +2 DEF
        self.player.equipment.equip(armor)
        
        self.combat.start_combat(self.player, enemy)
        
        # Mock random to prevent critical hits
        with patch('random.random', return_value=0.5):
            result = self.combat.execute_action(CombatAction.ATTACK)
        
        # Check that damage was reduced
        if result.damage_taken > 0:
            # Enemy attack was 10, player has 2 base + 2 armor = 4 defense, so should take 6
            self.assertEqual(result.damage_taken, 6)


if __name__ == '__main__':
    unittest.main()
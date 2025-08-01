import unittest
from unittest.mock import patch
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from character_classes import (CharacterClass, CharacterClassBase, 
                             CharacterClassFactory, Warrior, Rogue, Mage)
from player import Player
from monsters import Goblin
from combat_manager import CombatManager, CombatAction


class TestCharacterClasses(unittest.TestCase):
    """Test suite for character class system."""
    
    def test_warrior_starting_stats(self):
        """Test warrior starting stats."""
        warrior = Warrior()
        stats = warrior.get_starting_stats()
        
        self.assertEqual(stats["hp"], 25)  # Higher than base 20
        self.assertEqual(stats["attack"], 5)  # Same as base
        self.assertEqual(stats["defense"], 2)  # Has defense
        
    def test_warrior_rage_mechanic(self):
        """Test warrior rage damage increase at low HP."""
        player = Player("TestWarrior", Warrior())
        goblin = Goblin()
        
        # Test normal damage at full HP
        normal_damage = player.character_class.on_attack(player, goblin, 10)
        self.assertEqual(normal_damage, 10)
        
        # Test damage at 50% HP
        player.hp = player.max_hp // 2
        mid_damage = player.character_class.on_attack(player, goblin, 10)
        self.assertEqual(mid_damage, 12)  # 25% bonus
        
        # Test damage at 25% HP
        player.hp = player.max_hp // 4
        low_damage = player.character_class.on_attack(player, goblin, 10)
        self.assertEqual(low_damage, 15)  # 50% bonus
        
    def test_warrior_defense_bonus(self):
        """Test warrior defense bonus when defending."""
        warrior = Warrior()
        
        # Warrior gets 25% damage reduction when defending
        reduced_damage = warrior.on_defend(None, None, 100)
        self.assertEqual(reduced_damage, 75)
        
    def test_warrior_parry_bonus(self):
        """Test warrior increased parry chance."""
        player = Player("TestWarrior", Warrior())
        goblin = Goblin()
        combat = CombatManager()
        
        combat.start_combat(player, goblin)
        
        # Check that critical chance modifier was applied
        self.assertEqual(combat.critical_hit_chance, 0.1)  # Base crit chance
        
        # Warrior should have +10% parry chance
        self.assertEqual(player.character_class.parry_chance_modifier, 0.1)
        
    def test_rogue_starting_stats(self):
        """Test rogue starting stats."""
        rogue = Rogue()
        stats = rogue.get_starting_stats()
        
        self.assertEqual(stats["hp"], 17)  # Lower than base 20
        self.assertEqual(stats["attack"], 7)  # Higher than base 5
        self.assertEqual(stats["defense"], 0)  # No defense
        
    def test_rogue_sneak_attack(self):
        """Test rogue sneak attack first hit bonus."""
        player = Player("TestRogue", Rogue())
        goblin = Goblin()
        combat = CombatManager()
        
        combat.start_combat(player, goblin)
        
        # First attack should be sneak attack (double damage)
        self.assertFalse(player.character_class.sneak_attack_used)
        damage = player.character_class.on_attack(player, goblin, 10)
        self.assertEqual(damage, 20)  # Double damage
        self.assertTrue(player.character_class.sneak_attack_used)
        
        # Second attack should be normal
        damage = player.character_class.on_attack(player, goblin, 10)
        self.assertEqual(damage, 10)  # Normal damage
        
    def test_rogue_critical_bonus(self):
        """Test rogue increased critical chance."""
        player = Player("TestRogue", Rogue())
        goblin = Goblin()
        combat = CombatManager()
        
        combat.start_combat(player, goblin)
        
        # Check that critical chance modifier was applied
        self.assertEqual(combat.critical_hit_chance, 0.25)  # Base 10% + 15% rogue bonus
        
    def test_rogue_dodge_bonus(self):
        """Test rogue increased dodge chance."""
        rogue = Rogue()
        self.assertEqual(rogue.dodge_chance_modifier, 0.15)
        
    def test_mage_starting_stats(self):
        """Test mage starting stats."""
        mage = Mage()
        stats = mage.get_starting_stats()
        
        self.assertEqual(stats["hp"], 15)  # Much lower than base 20
        self.assertEqual(stats["attack"], 8)  # Much higher than base 5
        self.assertEqual(stats["defense"], 0)  # No defense
        
    def test_mage_mana_system(self):
        """Test mage mana system."""
        mage = Mage()
        
        # Check initial mana
        self.assertEqual(mage.current_mana, 10)
        self.assertEqual(mage.max_mana, 10)
        
        # Test spending mana
        self.assertTrue(mage.spend_mana(3))
        self.assertEqual(mage.current_mana, 7)
        
        # Test insufficient mana
        self.assertFalse(mage.spend_mana(10))
        self.assertEqual(mage.current_mana, 7)  # Unchanged
        
        # Test mana regeneration
        mage.regenerate_mana()
        self.assertEqual(mage.current_mana, 9)  # +2 per room
        
    def test_mage_spell_power_in_combat(self):
        """Test mage spell power mechanic in combat."""
        player = Player("TestMage", Mage())
        goblin = Goblin()
        combat = CombatManager()
        
        combat.start_combat(player, goblin)
        
        # Check spell action is available
        actions = combat.get_available_actions()
        self.assertIn(CombatAction.SPELL, actions)
        
        # Use spell power
        with patch('random.random', return_value=0.5):  # No crit
            result = combat.execute_action(CombatAction.SPELL)
        
        self.assertIn("channel arcane power", result.messages[0])
        self.assertTrue(combat.spell_powered)
        self.assertEqual(player.character_class.current_mana, 7)  # 10 - 3
        
        # Next attack should be empowered
        initial_hp = goblin.hp
        with patch('random.random', return_value=0.5):  # No crit
            result = combat.execute_action(CombatAction.ATTACK)
        
        # Damage should be 1.5x normal (8 attack * 1.5 = 12)
        expected_damage = int(player.attack_power * 1.5)
        self.assertEqual(result.damage_dealt, expected_damage)
        self.assertFalse(combat.spell_powered)  # Used up
        
    def test_mage_level_up_mana(self):
        """Test mage mana increase on level up."""
        player = Player("TestMage", Mage())
        
        initial_max_mana = player.character_class.max_mana
        
        # Spend some mana
        player.character_class.spend_mana(5)
        self.assertEqual(player.character_class.current_mana, 5)
        
        # Level up
        xp_messages = player.gain_xp(10)  # Enough to level up
        
        # Check mana increased and was restored
        self.assertEqual(player.character_class.max_mana, initial_max_mana + 2)
        self.assertEqual(player.character_class.current_mana, player.character_class.max_mana)
        
    def test_character_factory(self):
        """Test character class factory."""
        # Test creating each class
        warrior = CharacterClassFactory.create(CharacterClass.WARRIOR)
        self.assertIsInstance(warrior, Warrior)
        
        rogue = CharacterClassFactory.create(CharacterClass.ROGUE)
        self.assertIsInstance(rogue, Rogue)
        
        mage = CharacterClassFactory.create(CharacterClass.MAGE)
        self.assertIsInstance(mage, Mage)
        
    def test_class_descriptions(self):
        """Test getting class descriptions."""
        descriptions = CharacterClassFactory.get_class_descriptions()
        
        self.assertEqual(len(descriptions), 3)
        self.assertIn(CharacterClass.WARRIOR, descriptions)
        self.assertIn(CharacterClass.ROGUE, descriptions)
        self.assertIn(CharacterClass.MAGE, descriptions)
        
        # Check warrior description
        warrior_desc = descriptions[CharacterClass.WARRIOR]
        self.assertEqual(warrior_desc["name"], "Warrior")
        self.assertEqual(warrior_desc["hp"], 25)
        self.assertIn("Rage", warrior_desc["special"])
        
    def test_level_up_bonuses(self):
        """Test different level up bonuses per class."""
        warrior = Warrior()
        warrior_bonus = warrior.get_level_up_bonuses(2)
        self.assertEqual(warrior_bonus["hp"], 4)  # Warriors get +4 HP
        self.assertEqual(warrior_bonus["attack"], 1)
        
        rogue = Rogue()
        rogue_bonus = rogue.get_level_up_bonuses(2)
        self.assertEqual(rogue_bonus["hp"], 2)  # Rogues get +2 HP
        self.assertEqual(rogue_bonus["attack"], 2)  # But +2 attack
        
        mage = Mage()
        mage_bonus = mage.get_level_up_bonuses(2)
        self.assertEqual(mage_bonus["hp"], 2)  # Mages get +2 HP
        self.assertEqual(mage_bonus["attack"], 2)  # And +2 attack
        
    def test_player_with_class_integration(self):
        """Test full player integration with character classes."""
        # Create players of each class
        warrior_player = Player("Warrior", Warrior())
        self.assertEqual(warrior_player.hp, 25)
        self.assertEqual(warrior_player.base_attack_power, 5)
        self.assertEqual(warrior_player.base_defense, 2)
        
        rogue_player = Player("Rogue", Rogue())
        self.assertEqual(rogue_player.hp, 17)
        self.assertEqual(rogue_player.base_attack_power, 7)
        self.assertEqual(rogue_player.base_defense, 0)
        
        mage_player = Player("Mage", Mage())
        self.assertEqual(mage_player.hp, 15)
        self.assertEqual(mage_player.base_attack_power, 8)
        self.assertEqual(mage_player.base_defense, 0)


if __name__ == '__main__':
    unittest.main()
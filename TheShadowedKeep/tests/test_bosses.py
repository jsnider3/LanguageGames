import unittest
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from monsters import (
    BossMonster, GoblinKing, OrcWarlord, SkeletonLord, 
    TrollChieftain, ShadowLord
)
from room_content import RoomContentFactory, BossRoom
from player import Player


class TestBossMonsters(unittest.TestCase):
    """Test boss monster functionality."""
    
    def test_boss_monster_base_class(self):
        """Test the base boss monster functionality."""
        boss = BossMonster("Test Boss", 50, 10, 100, 50)
        
        self.assertEqual(boss.name, "Test Boss")
        self.assertTrue(boss.is_boss)
        self.assertEqual(boss.phase, 1)
        self.assertEqual(boss.max_phases, 1)
        
        # Test ability cooldown system
        self.assertTrue(boss.can_use_ability("test_ability"))
        boss.use_ability("test_ability", 3)
        self.assertFalse(boss.can_use_ability("test_ability"))
        
        # Test cooldown ticking
        boss.tick_cooldowns()
        self.assertEqual(boss.ability_cooldowns["test_ability"], 2)
        boss.tick_cooldowns()
        boss.tick_cooldowns()
        self.assertTrue(boss.can_use_ability("test_ability"))
        
    def test_goblin_king(self):
        """Test Goblin King specific mechanics."""
        king = GoblinKing()
        
        self.assertEqual(king.name, "Goblin King")
        self.assertEqual(king.hp, 45)
        self.assertEqual(king.attack_power, 10)
        self.assertFalse(king.enraged)
        
        # Test minion summoning
        minion = king.summon_minion()
        self.assertIsNotNone(minion)
        self.assertEqual(king.minions_summoned, 1)
        
        # Test enrage mechanic - first minion death
        old_attack = king.attack_power
        king.on_minion_death()
        self.assertEqual(king.attack_power, old_attack + 2)  # +2 from minion death
        
        # Simulate second minion summoned and death to trigger enrage
        king.minions_summoned = 2  # Max minions summoned
        king.on_minion_death()
        self.assertTrue(king.enraged)
        # Should have +2 from each minion death + 5 from enrage = original + 9
        self.assertEqual(king.attack_power, old_attack + 9)
        
    def test_orc_warlord(self):
        """Test Orc Warlord phase transitions."""
        warlord = OrcWarlord()
        
        self.assertEqual(warlord.max_phases, 2)
        self.assertFalse(warlord.berserker_mode)
        
        # Test phase transition
        warlord.phase = 2
        entered_berserker = warlord.enter_berserker_mode()
        self.assertTrue(entered_berserker)
        self.assertTrue(warlord.berserker_mode)
        self.assertEqual(warlord.attack_power, 20)  # 12 + 8 berserker bonus
        
        # Test whirlwind attack
        can_whirlwind = warlord.whirlwind_attack()
        self.assertTrue(can_whirlwind)
        self.assertFalse(warlord.can_use_ability("whirlwind"))  # Should be on cooldown
        
    def test_skeleton_lord(self):
        """Test Skeleton Lord necromancy abilities."""
        lord = SkeletonLord()
        
        self.assertEqual(lord.max_resurrections, 1)
        self.assertEqual(lord.resurrection_count, 0)
        
        # Test bone spear
        spear_damage = lord.bone_spear()
        self.assertEqual(spear_damage, 15)
        self.assertFalse(lord.can_use_ability("bone_spear"))
        
        # Test resurrection (simulate death first)
        lord.hp = 0
        resurrected = lord.resurrect()
        self.assertTrue(resurrected)
        self.assertEqual(lord.resurrection_count, 1)
        self.assertTrue(lord.is_alive())
        
        # Test life drain
        heal_amount = lord.life_drain(20)
        self.assertEqual(heal_amount, 10)  # Half of damage dealt
        
    def test_troll_chieftain(self):
        """Test Troll Chieftain regeneration and attacks."""
        chieftain = TrollChieftain()
        
        self.assertEqual(chieftain.max_phases, 2)
        self.assertEqual(chieftain.regeneration, 5)
        
        # Test regeneration in phase 1
        chieftain.hp = 70  # Damage the troll
        regen_amount = chieftain.enhanced_regeneration()
        self.assertEqual(regen_amount, 5)
        self.assertEqual(chieftain.hp, 75)
        
        # Test enhanced regeneration in phase 2
        chieftain.phase = 2
        chieftain.hp = 70
        regen_amount = chieftain.enhanced_regeneration()
        self.assertEqual(regen_amount, 10)  # Double regeneration
        self.assertEqual(chieftain.hp, 80)
        
        # Test ground slam
        slam_damage = chieftain.ground_slam()
        self.assertEqual(slam_damage, 21)  # 14 * 1.5
        
        # Test intimidate
        intimidated = chieftain.intimidate()
        self.assertIsInstance(intimidated, bool)
        
    def test_shadow_lord(self):
        """Test Shadow Lord final boss mechanics."""
        lord = ShadowLord()
        
        self.assertEqual(lord.max_phases, 3)
        self.assertEqual(lord.dodge_chance, 0.2)
        self.assertFalse(lord.shadow_form)
        
        # Test shadow form entry
        lord.phase = 2
        entered_shadow = lord.enter_shadow_form()
        self.assertTrue(entered_shadow)
        self.assertTrue(lord.shadow_form)
        self.assertEqual(lord.dodge_chance, 0.4)
        
        # Test shadow bolt
        bolt_damage = lord.shadow_bolt()
        self.assertEqual(bolt_damage, 26)  # 16 + 10
        
        # Test final form
        lord.phase = 3
        final_form = lord.final_form()
        self.assertTrue(final_form)
        self.assertEqual(lord.attack_power, 25)  # Boosted to 25
        self.assertEqual(lord.dodge_chance, 0.5)
        
        # Test darkness aura
        darkness = lord.darkness_aura()
        self.assertTrue(darkness)
        
    def test_phase_transitions(self):
        """Test phase transition mechanics."""
        warlord = OrcWarlord()
        
        # No transition at full health
        transitioned = warlord.check_phase_transition()
        self.assertFalse(transitioned)
        
        # Should transition when HP drops to 50% or below
        warlord.hp = 30  # 50% of 60
        transitioned = warlord.check_phase_transition()
        self.assertTrue(transitioned)
        self.assertEqual(warlord.phase, 2)
        
        # Should not transition again
        transitioned = warlord.check_phase_transition()
        self.assertFalse(transitioned)


class TestBossRooms(unittest.TestCase):
    """Test boss room functionality."""
    
    def test_boss_room_creation(self):
        """Test creating boss rooms."""
        boss = GoblinKing()
        boss_room = BossRoom(boss)
        
        self.assertEqual(boss_room.boss, boss)
        self.assertFalse(boss_room.defeated)
        self.assertFalse(boss_room.entrance_message_shown)
        
    def test_boss_room_factory(self):
        """Test boss room factory."""
        # Test different dungeon levels produce different bosses
        level_3_room = RoomContentFactory.create_boss_room(3)
        self.assertEqual(level_3_room.boss.name, "Goblin King")
        
        level_6_room = RoomContentFactory.create_boss_room(6)
        self.assertEqual(level_6_room.boss.name, "Orc Warlord")
        
        level_10_room = RoomContentFactory.create_boss_room(10)
        self.assertEqual(level_10_room.boss.name, "Skeleton Lord")
        
        level_15_room = RoomContentFactory.create_boss_room(15)
        self.assertEqual(level_15_room.boss.name, "Troll Chieftain")
        
        level_20_room = RoomContentFactory.create_boss_room(20)
        self.assertEqual(level_20_room.boss.name, "Shadow Lord")
        
    def test_boss_room_messages(self):
        """Test boss room entrance messages."""
        boss = GoblinKing()
        boss_room = BossRoom(boss)
        
        # Mock game object
        from unittest.mock import MagicMock
        game = MagicMock()
        
        # First entrance should show full intro
        messages = boss_room.on_enter(game)
        self.assertTrue(any("BOSS CHAMBER" in msg for msg in messages))
        self.assertTrue(any("Goblin King" in msg for msg in messages))
        self.assertTrue(boss_room.entrance_message_shown)
        
        # Subsequent entrances should be different
        messages2 = boss_room.on_enter(game)
        self.assertNotEqual(messages, messages2)


if __name__ == '__main__':
    unittest.main()
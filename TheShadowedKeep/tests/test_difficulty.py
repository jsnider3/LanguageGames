import unittest
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from difficulty_manager import DifficultyManager, AdaptiveDifficulty
from monsters import Goblin, Orc


class TestDifficultyManager(unittest.TestCase):
    """Test difficulty scaling functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.difficulty_manager = DifficultyManager()
        
    def test_basic_difficulty_scaling(self):
        """Test basic floor-based difficulty scaling."""
        # Floor 1 should be base difficulty
        multiplier_1 = self.difficulty_manager.get_difficulty_multiplier(1)
        self.assertEqual(multiplier_1, 1.0)
        
        # Floor 10 should be harder
        multiplier_10 = self.difficulty_manager.get_difficulty_multiplier(10)
        self.assertGreater(multiplier_10, 1.0)
        
        # Should cap at maximum
        multiplier_high = self.difficulty_manager.get_difficulty_multiplier(100)
        self.assertLessEqual(multiplier_high, 2.0)  # MAX_DIFFICULTY_MULTIPLIER
        
    def test_ng_plus_scaling(self):
        """Test New Game Plus difficulty scaling."""
        # Start NG+
        self.assertTrue(self.difficulty_manager.start_ng_plus())
        self.assertEqual(self.difficulty_manager.ng_plus_cycle, 1)
        
        # Should increase difficulty
        multiplier_ng1 = self.difficulty_manager.get_difficulty_multiplier(1)
        self.assertGreater(multiplier_ng1, 1.0)
        
        # Multiple NG+ cycles
        self.difficulty_manager.start_ng_plus()
        multiplier_ng2 = self.difficulty_manager.get_difficulty_multiplier(1)
        self.assertGreater(multiplier_ng2, multiplier_ng1)
        
    def test_ng_plus_limits(self):
        """Test NG+ cycle limits."""
        # Should be able to start initially
        self.assertTrue(self.difficulty_manager.can_start_ng_plus())
        
        # Start maximum cycles
        for i in range(5):  # NG_PLUS_MAX_CYCLES
            self.assertTrue(self.difficulty_manager.start_ng_plus())
            
        # Should not be able to start more
        self.assertFalse(self.difficulty_manager.can_start_ng_plus())
        self.assertFalse(self.difficulty_manager.start_ng_plus())
        
    def test_monster_scaling(self):
        """Test monster stat scaling."""
        goblin = Goblin()
        original_hp = goblin.hp
        original_attack = goblin.attack_power
        
        # Scale for floor 10, which has a significant multiplier
        self.difficulty_manager.scale_monster_stats(goblin, 10)
        
        # Stats should be increased
        self.assertGreater(goblin.hp, original_hp)
        self.assertGreater(goblin.attack_power, original_attack)
        # Gold reward is random, so we just check that it's an integer
        self.assertIsInstance(goblin.gold_reward, int)
        
    def test_elite_monster_creation(self):
        """Test elite monster creation."""
        # Should have some chance on higher floors
        has_elite = False
        for _ in range(100):  # Test multiple times due to randomness
            if self.difficulty_manager.should_create_elite_monster(10):
                has_elite = True
                break
        self.assertTrue(has_elite)
        
        # Create elite monster
        orc = Orc()
        original_name = orc.name
        original_hp = orc.hp
        
        elite_orc = self.difficulty_manager.create_elite_monster(orc)
        
        self.assertTrue(elite_orc.name.startswith("Elite"))
        self.assertGreater(elite_orc.hp, original_hp)
        self.assertTrue(hasattr(elite_orc, 'is_elite'))
        
    def test_gold_xp_multipliers(self):
        """Test NG+ reward multipliers."""
        # Base multipliers
        self.assertEqual(self.difficulty_manager.get_gold_multiplier(), 1.0)
        self.assertEqual(self.difficulty_manager.get_xp_multiplier(), 1.0)
        
        # NG+ should increase multipliers
        self.difficulty_manager.start_ng_plus()
        self.assertGreater(self.difficulty_manager.get_gold_multiplier(), 1.0)
        self.assertGreater(self.difficulty_manager.get_xp_multiplier(), 1.0)
        
    def test_ng_plus_bonuses(self):
        """Test NG+ bonus application."""
        rewards = {"gold": 100, "xp": 50}
        
        # No bonuses at NG+0
        base_rewards = self.difficulty_manager.apply_ng_plus_bonuses(rewards.copy())
        self.assertEqual(base_rewards["gold"], 100)
        self.assertEqual(base_rewards["xp"], 50)
        
        # Bonuses at NG+1
        self.difficulty_manager.start_ng_plus()
        ng_rewards = self.difficulty_manager.apply_ng_plus_bonuses(rewards.copy())
        self.assertGreater(ng_rewards["gold"], 100)
        self.assertGreater(ng_rewards["xp"], 50)
        
    def test_difficulty_display(self):
        """Test difficulty display strings."""
        # Normal difficulty
        display = self.difficulty_manager.get_difficulty_display(1)
        self.assertIn("Normal", display)
        
        # NG+ difficulty
        self.difficulty_manager.start_ng_plus()
        ng_display = self.difficulty_manager.get_difficulty_display(1)
        self.assertIn("NG+1", ng_display)
        
    def test_save_load(self):
        """Test saving and loading difficulty state."""
        # Set up some state
        self.difficulty_manager.start_ng_plus()
        self.difficulty_manager.base_difficulty = 1.2
        
        # Save state
        saved_data = self.difficulty_manager.save_to_dict()
        
        # Create new manager and load
        new_manager = DifficultyManager()
        new_manager.load_from_dict(saved_data)
        
        # Verify state
        self.assertEqual(new_manager.ng_plus_cycle, 1)
        self.assertEqual(new_manager.base_difficulty, 1.2)


class TestAdaptiveDifficulty(unittest.TestCase):
    """Test adaptive difficulty functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.adaptive = AdaptiveDifficulty()
        
    def test_combat_result_recording(self):
        """Test recording combat results."""
        # Record some victories
        for _ in range(3):
            self.adaptive.record_combat_result(victory=True, player_hp_remaining=15, player_max_hp=20)
            
        self.assertEqual(self.adaptive.recent_victories, 3)
        self.assertEqual(self.adaptive.recent_deaths, 0)
        self.assertGreater(self.adaptive.player_performance_score, 0.0)
        
        # Record some defeats
        for _ in range(2):
            self.adaptive.record_combat_result(victory=False, player_hp_remaining=0, player_max_hp=20)
            
        self.assertEqual(self.adaptive.recent_victories, 3)
        self.assertEqual(self.adaptive.recent_deaths, 2)
        
    def test_performance_assessment(self):
        """Test performance assessment."""
        # High performance
        for _ in range(10):
            self.adaptive.record_combat_result(victory=True, player_hp_remaining=20, player_max_hp=20)
            
        assessment = self.adaptive.get_performance_assessment()
        # Should be positive assessment (performing well or dominating)
        self.assertTrue("well" in assessment.lower() or "dominating" in assessment.lower())
        
        # Poor performance
        adaptive_poor = AdaptiveDifficulty()
        for _ in range(5):
            adaptive_poor.record_combat_result(victory=False, player_hp_remaining=0, player_max_hp=20)
            
        poor_assessment = adaptive_poor.get_performance_assessment()
        self.assertIn("difficulty", poor_assessment.lower())
        
    def test_adaptive_multiplier(self):
        """Test adaptive difficulty multiplier."""
        # Good performance should increase difficulty
        for _ in range(10):
            self.adaptive.record_combat_result(victory=True, player_hp_remaining=19, player_max_hp=20)
            
        multiplier = self.adaptive.get_adaptive_multiplier()
        # High performance should lead to lower multiplier (inverted)
        self.assertLess(multiplier, 1.0)
        
        # Poor performance should decrease difficulty
        adaptive_poor = AdaptiveDifficulty()
        for _ in range(10):
            adaptive_poor.record_combat_result(victory=False, player_hp_remaining=0, player_max_hp=20)
            
        poor_multiplier = adaptive_poor.get_adaptive_multiplier()
        self.assertGreater(poor_multiplier, multiplier)
        
    def test_difficulty_suggestions(self):
        """Test difficulty change suggestions."""
        # No suggestions initially
        should_suggest, message = self.adaptive.should_suggest_difficulty_change()
        self.assertFalse(should_suggest)
        
        # Suggest difficulty reduction after many deaths
        for _ in range(10):
            self.adaptive.record_combat_result(victory=False, player_hp_remaining=0, player_max_hp=20)
            
        should_suggest, message = self.adaptive.should_suggest_difficulty_change()
        self.assertTrue(should_suggest)
        self.assertIn("reducing", message.lower())
        
        # Suggest difficulty increase after dominating
        adaptive_good = AdaptiveDifficulty()
        for _ in range(20):
            adaptive_good.record_combat_result(victory=True, player_hp_remaining=20, player_max_hp=20)
            
        should_suggest, message = adaptive_good.should_suggest_difficulty_change()
        self.assertTrue(should_suggest)
        self.assertIn("increasing", message.lower())
        
    def test_evaluation_window(self):
        """Test that evaluation window limits recent stats."""
        # Record more encounters than the window size
        for _ in range(15):  # More than evaluation_window (10)
            self.adaptive.record_combat_result(victory=True, player_hp_remaining=15, player_max_hp=20)
            
        # Should not exceed window size
        total_recent = self.adaptive.recent_victories + self.adaptive.recent_deaths
        self.assertLessEqual(total_recent, self.adaptive.evaluation_window)


if __name__ == '__main__':
    unittest.main()
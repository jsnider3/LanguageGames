import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import tempfile
import json

# Add the parent directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from achievements import (
    Achievement, AchievementCategory, AchievementTracker, AchievementManager,
    UnlockType
)
from player import Player
from monsters import Monster
from combat_manager import CombatResult


class TestAchievement(unittest.TestCase):
    """Test individual achievement functionality."""
    
    def test_achievement_creation(self):
        """Test creating achievements."""
        achievement = Achievement(
            id="test_id",
            name="Test Achievement",
            description="A test achievement",
            category=AchievementCategory.COMBAT,
            points=10
        )
        
        self.assertEqual(achievement.id, "test_id")
        self.assertEqual(achievement.name, "Test Achievement")
        self.assertEqual(achievement.points, 10)
        self.assertFalse(achievement.hidden)
        
    def test_hidden_achievement_display(self):
        """Test hidden achievement display logic."""
        hidden_achievement = Achievement(
            id="hidden",
            name="Secret",
            description="A secret achievement",
            category=AchievementCategory.SPECIAL,
            hidden=True
        )
        
        self.assertEqual(hidden_achievement.get_display_name(), "???")
        self.assertIn("Hidden achievement", hidden_achievement.get_display_description())
        
        # Normal achievement should show normally
        normal_achievement = Achievement(
            id="normal",
            name="Normal",
            description="A normal achievement",
            category=AchievementCategory.COMBAT
        )
        
        self.assertEqual(normal_achievement.get_display_name(), "Normal")
        self.assertEqual(normal_achievement.get_display_description(), "A normal achievement")


class TestAchievementTracker(unittest.TestCase):
    """Test achievement tracking functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.tracker = AchievementTracker()
        
        # Clear default achievements and add test ones
        self.tracker.achievements.clear()
        self.tracker.completed_achievements.clear()
        self.tracker.progress.clear()
        
        # Add test achievements
        self.test_achievement = Achievement(
            id="test_combat",
            name="Test Combat",
            description="A test combat achievement",
            category=AchievementCategory.COMBAT,
            points=10
        )
        
        self.unlock_achievement = Achievement(
            id="test_unlock",
            name="Test Unlock",
            description="Achievement with unlock",
            category=AchievementCategory.PROGRESSION,
            points=20,
            unlock_reward={"type": UnlockType.CHARACTER_CLASS, "class": "TestClass"}
        )
        
        self.tracker.register(self.test_achievement)
        self.tracker.register(self.unlock_achievement)
        
    def test_register_achievement(self):
        """Test registering achievements."""
        self.assertIn("test_combat", self.tracker.achievements)
        self.assertIn("test_unlock", self.tracker.achievements)
        
    def test_unlock_achievement(self):
        """Test unlocking achievements."""
        # Initially not completed
        self.assertNotIn("test_combat", self.tracker.completed_achievements)
        
        # Unlock achievement
        unlocked = self.tracker.unlock_achievement("test_combat")
        
        self.assertIsNotNone(unlocked)
        self.assertEqual(unlocked.id, "test_combat")
        self.assertIn("test_combat", self.tracker.completed_achievements)
        
        # Try to unlock again - should return None
        unlocked_again = self.tracker.unlock_achievement("test_combat")
        self.assertIsNone(unlocked_again)
        
    def test_unlock_with_reward(self):
        """Test unlocking achievement with reward."""
        unlocked = self.tracker.unlock_achievement("test_unlock")
        
        self.assertIsNotNone(unlocked)
        self.assertIn("TestClass", self.tracker.unlocks[UnlockType.CHARACTER_CLASS])
        
    def test_check_achievement(self):
        """Test conditional achievement checking."""
        # Should not unlock with false condition
        result = self.tracker.check_achievement("test_combat", False)
        self.assertIsNone(result)
        self.assertNotIn("test_combat", self.tracker.completed_achievements)
        
        # Should unlock with true condition
        result = self.tracker.check_achievement("test_combat", True)
        self.assertIsNotNone(result)
        self.assertIn("test_combat", self.tracker.completed_achievements)
        
    def test_progress_tracking(self):
        """Test progress tracking."""
        # Set progress
        self.tracker.update_progress("test_combat", "kills", 5)
        self.assertEqual(self.tracker.get_progress("test_combat", "kills"), 5)
        
        # Increment progress
        self.tracker.increment_progress("test_combat", "kills", 3)
        self.assertEqual(self.tracker.get_progress("test_combat", "kills"), 8)
        
        # Get non-existent progress
        self.assertEqual(self.tracker.get_progress("test_combat", "nonexistent"), 0)
        self.assertEqual(self.tracker.get_progress("test_combat", "nonexistent", 10), 10)
        
    def test_total_points(self):
        """Test total points calculation."""
        self.assertEqual(self.tracker.get_total_points(), 0)
        
        self.tracker.unlock_achievement("test_combat")
        self.assertEqual(self.tracker.get_total_points(), 10)
        
        self.tracker.unlock_achievement("test_unlock")
        self.assertEqual(self.tracker.get_total_points(), 30)
        
    def test_completion_percentage(self):
        """Test completion percentage calculation."""
        self.assertEqual(self.tracker.get_completion_percentage(), 0.0)
        
        self.tracker.unlock_achievement("test_combat")
        self.assertEqual(self.tracker.get_completion_percentage(), 50.0)
        
        self.tracker.unlock_achievement("test_unlock")
        self.assertEqual(self.tracker.get_completion_percentage(), 100.0)
        
    def test_achievements_by_category(self):
        """Test filtering achievements by category."""
        combat_achievements = self.tracker.get_achievements_by_category(AchievementCategory.COMBAT)
        self.assertEqual(len(combat_achievements), 1)
        self.assertEqual(combat_achievements[0].id, "test_combat")
        
        progression_achievements = self.tracker.get_achievements_by_category(AchievementCategory.PROGRESSION)
        self.assertEqual(len(progression_achievements), 1)
        self.assertEqual(progression_achievements[0].id, "test_unlock")
        
    def test_save_load(self):
        """Test saving and loading achievement data."""
        # Set up some test data
        self.tracker.unlock_achievement("test_combat")
        self.tracker.update_progress("test_unlock", "level", 5)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            temp_path = f.name
            
        try:
            self.tracker.save_to_file(temp_path)
            
            # Create new tracker and load
            new_tracker = AchievementTracker()
            new_tracker.achievements.clear()  # Clear defaults
            new_tracker.register(self.test_achievement)
            new_tracker.register(self.unlock_achievement)
            
            new_tracker.load_from_file(temp_path)
            
            # Verify loaded data
            self.assertIn("test_combat", new_tracker.completed_achievements)
            self.assertEqual(new_tracker.get_progress("test_unlock", "level"), 5)
            
        finally:
            os.unlink(temp_path)


class TestAchievementManager(unittest.TestCase):
    """Test achievement manager functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.tracker = AchievementTracker()
        self.manager = AchievementManager(self.tracker)
        self.player = Player("Test Hero")
        self.monster = Monster("Test Monster", hp=10, attack_power=5, gold_reward=10)
        
    def test_combat_achievements(self):
        """Test combat achievement checking."""
        # Mock combat result
        combat_result = MagicMock()
        combat_result.damage_taken = 0
        
        # Check first blood
        initial_kills = self.tracker.get_progress("first_blood", "kills", 0)
        self.assertEqual(initial_kills, 0)
        
        self.manager.check_combat_achievements(self.player, self.monster, combat_result)
        
        # Should have unlocked first blood
        self.assertIn("first_blood", self.tracker.completed_achievements)
        
        # Should have notifications
        notifications = self.manager.get_and_clear_notifications()
        self.assertTrue(len(notifications) > 0)
        self.assertEqual(notifications[0].id, "first_blood")
        
        # Second call should not generate notifications
        self.manager.check_combat_achievements(self.player, self.monster, combat_result)
        notifications = self.manager.get_and_clear_notifications()
        self.assertEqual(len(notifications), 0)  # No new notifications
        
    def test_collection_achievements(self):
        """Test collection achievement checking."""
        # Set player gold to trigger treasure hunter
        self.player.gold = 1000
        
        self.manager.check_collection_achievements(self.player)
        
        # Should unlock treasure hunter
        self.assertIn("treasure_hunter", self.tracker.completed_achievements)
        
        notifications = self.manager.get_and_clear_notifications()
        self.assertTrue(any(n.id == "treasure_hunter" for n in notifications))
        
    def test_exploration_achievements(self):
        """Test exploration achievement checking."""
        # Mock dungeon map
        dungeon_map = MagicMock()
        dungeon_map.is_floor_fully_explored.return_value = True
        
        self.manager.check_exploration_achievements(self.player, dungeon_map)
        
        # Should unlock cartographer
        self.assertIn("cartographer", self.tracker.completed_achievements)
        
    def test_progression_achievements(self):
        """Test progression achievement checking."""
        # Set player level to trigger achievement
        self.player.level = 10
        
        self.manager.check_progression_achievements(self.player)
        
        # Should unlock level 10 achievement
        self.assertIn("level_10", self.tracker.completed_achievements)
        
    def test_item_use_tracking(self):
        """Test item usage tracking."""
        from consumables import ConsumableType
        
        # Use items to approach the threshold
        for _ in range(49):
            self.manager.check_item_use(ConsumableType.HEALING_POTION)
            
        # Should not be unlocked yet
        self.assertNotIn("potion_master", self.tracker.completed_achievements)
        
        # Use one more to reach 50
        self.manager.check_item_use(ConsumableType.HEALING_POTION)
        
        # Should now be unlocked
        self.assertIn("potion_master", self.tracker.completed_achievements)
        
    def test_notification_management(self):
        """Test notification queue management."""
        # Manually add achievement to trigger notification
        achievement = self.tracker.unlock_achievement("first_blood")
        if achievement:
            self.manager.pending_notifications.append(achievement)
            
        # Get notifications
        notifications = self.manager.get_and_clear_notifications()
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0].id, "first_blood")
        
        # Should be cleared now
        notifications = self.manager.get_and_clear_notifications()
        self.assertEqual(len(notifications), 0)


class TestAchievementIntegration(unittest.TestCase):
    """Test achievement system integration."""
    
    def test_default_achievements_loaded(self):
        """Test that default achievements are loaded."""
        tracker = AchievementTracker()
        
        # Should have default achievements
        self.assertGreater(len(tracker.achievements), 0)
        
        # Check for expected achievements
        self.assertIn("first_blood", tracker.achievements)
        self.assertIn("monster_slayer", tracker.achievements)
        self.assertIn("treasure_hunter", tracker.achievements)
        
    def test_unlock_rewards(self):
        """Test that unlock rewards work correctly."""
        tracker = AchievementTracker()
        
        # Unlock achievement with reward
        tracker.unlock_achievement("deep_delver")
        
        # Should have unlocked content
        self.assertTrue(tracker.is_unlocked(UnlockType.CHARACTER_CLASS, "Paladin"))
        
    def test_hidden_achievements(self):
        """Test hidden achievement behavior."""
        tracker = AchievementTracker()
        
        # Find a hidden achievement
        hidden_achievements = [a for a in tracker.achievements.values() if a.hidden]
        self.assertGreater(len(hidden_achievements), 0)
        
        hidden_achievement = hidden_achievements[0]
        self.assertEqual(hidden_achievement.get_display_name(), "???")


if __name__ == '__main__':
    unittest.main()
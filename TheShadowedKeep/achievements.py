"""
Achievement and unlock system for The Shadowed Keep.
Tracks player accomplishments and unlocks new content.
"""
from enum import Enum
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass
import json
import os


class AchievementCategory(Enum):
    """Categories for organizing achievements."""
    COMBAT = "combat"
    EXPLORATION = "exploration"
    COLLECTION = "collection"
    PROGRESSION = "progression"
    SPECIAL = "special"


class UnlockType(Enum):
    """Types of unlockable content."""
    CHARACTER_CLASS = "character_class"
    STARTING_ITEM = "starting_item"
    GAME_MODE = "game_mode"
    COSMETIC = "cosmetic"


@dataclass
class Achievement:
    """Represents a single achievement."""
    id: str
    name: str
    description: str
    category: AchievementCategory
    points: int = 10
    hidden: bool = False
    unlock_reward: Optional[Dict[str, Any]] = None
    
    def get_display_name(self) -> str:
        """Get display name with hidden logic."""
        if self.hidden:
            return "???"
        return self.name
        
    def get_display_description(self) -> str:
        """Get display description with hidden logic."""
        if self.hidden:
            return "Hidden achievement - discover it yourself!"
        return self.description


class AchievementTracker:
    """Tracks achievement progress and completion."""
    
    def __init__(self):
        self.achievements: Dict[str, Achievement] = {}
        self.completed_achievements: Set[str] = set()
        self.progress: Dict[str, Dict[str, Any]] = {}
        self.unlocks: Dict[UnlockType, Set[str]] = {
            unlock_type: set() for unlock_type in UnlockType
        }
        self._register_achievements()
        
    def _register_achievements(self):
        """Register all achievements in the game."""
        # Combat achievements
        self.register(Achievement(
            id="first_blood",
            name="First Blood",
            description="Defeat your first monster",
            category=AchievementCategory.COMBAT,
            points=5
        ))
        
        self.register(Achievement(
            id="monster_slayer",
            name="Monster Slayer",
            description="Defeat 50 monsters",
            category=AchievementCategory.COMBAT,
            points=20
        ))
        
        self.register(Achievement(
            id="boss_killer",
            name="Boss Killer",
            description="Defeat your first boss",
            category=AchievementCategory.COMBAT,
            points=25,
            unlock_reward={"type": UnlockType.STARTING_ITEM, "item": "strength_potion"}
        ))
        
        self.register(Achievement(
            id="untouchable",
            name="Untouchable",
            description="Defeat 10 monsters without taking damage",
            category=AchievementCategory.COMBAT,
            points=30
        ))
        
        self.register(Achievement(
            id="david_goliath",
            name="David vs Goliath",
            description="Defeat a monster with 1 HP remaining",
            category=AchievementCategory.COMBAT,
            points=15
        ))
        
        # Exploration achievements
        self.register(Achievement(
            id="explorer",
            name="Explorer",
            description="Explore 100 rooms",
            category=AchievementCategory.EXPLORATION,
            points=15
        ))
        
        self.register(Achievement(
            id="deep_delver",
            name="Deep Delver",
            description="Reach floor 10",
            category=AchievementCategory.EXPLORATION,
            points=20,
            unlock_reward={"type": UnlockType.CHARACTER_CLASS, "class": "Paladin"}
        ))
        
        self.register(Achievement(
            id="cartographer",
            name="Cartographer",
            description="Fully explore a floor (all rooms)",
            category=AchievementCategory.EXPLORATION,
            points=10
        ))
        
        # Collection achievements
        self.register(Achievement(
            id="treasure_hunter",
            name="Treasure Hunter",
            description="Collect 1000 gold",
            category=AchievementCategory.COLLECTION,
            points=15
        ))
        
        self.register(Achievement(
            id="hoarder",
            name="Hoarder",
            description="Have 20 items in your inventory",
            category=AchievementCategory.COLLECTION,
            points=10
        ))
        
        self.register(Achievement(
            id="well_equipped",
            name="Well Equipped",
            description="Equip items in all three slots",
            category=AchievementCategory.COLLECTION,
            points=10
        ))
        
        self.register(Achievement(
            id="potion_master",
            name="Potion Master",
            description="Use 50 consumable items",
            category=AchievementCategory.COLLECTION,
            points=20
        ))
        
        # Progression achievements
        self.register(Achievement(
            id="level_10",
            name="Seasoned Adventurer",
            description="Reach level 10",
            category=AchievementCategory.PROGRESSION,
            points=20
        ))
        
        self.register(Achievement(
            id="max_level",
            name="Legendary Hero",
            description="Reach level 20",
            category=AchievementCategory.PROGRESSION,
            points=50,
            unlock_reward={"type": UnlockType.GAME_MODE, "mode": "hard_mode"}
        ))
        
        self.register(Achievement(
            id="class_master",
            name="Class Master",
            description="Win the game with all 3 starting classes",
            category=AchievementCategory.PROGRESSION,
            points=40,
            unlock_reward={"type": UnlockType.COSMETIC, "item": "golden_title"}
        ))
        
        # Special/Hidden achievements
        self.register(Achievement(
            id="pacifist",
            name="Pacifist",
            description="Reach floor 5 without killing any monsters",
            category=AchievementCategory.SPECIAL,
            points=50,
            hidden=True
        ))
        
        self.register(Achievement(
            id="speedrunner",
            name="Speedrunner",
            description="Complete the game in under 30 minutes",
            category=AchievementCategory.SPECIAL,
            points=40,
            hidden=True
        ))
        
        self.register(Achievement(
            id="no_hit_run",
            name="Flawless Victory",
            description="Complete the game without taking damage",
            category=AchievementCategory.SPECIAL,
            points=100,
            hidden=True,
            unlock_reward={"type": UnlockType.COSMETIC, "item": "invincible_title"}
        ))
        
        self.register(Achievement(
            id="mimic_friend",
            name="Mimic Whisperer",
            description="Avoid 5 mimics without fighting them",
            category=AchievementCategory.SPECIAL,
            points=15,
            hidden=True
        ))
        
        # Puzzle achievements
        self.register(Achievement(
            id="puzzle_solver",
            name="Puzzle Solver",
            description="Solve your first puzzle",
            category=AchievementCategory.EXPLORATION,
            points=10
        ))
        
        self.register(Achievement(
            id="mind_bender",
            name="Mind Bender",
            description="Solve a hard difficulty puzzle",
            category=AchievementCategory.EXPLORATION,
            points=20
        ))
        
        self.register(Achievement(
            id="enigma_master",
            name="Enigma Master",
            description="Solve a legendary difficulty puzzle",
            category=AchievementCategory.EXPLORATION,
            points=35,
            unlock_reward={"type": UnlockType.STARTING_ITEM, "item": "wisdom_scroll"}
        ))
        
        self.register(Achievement(
            id="first_try",
            name="First Try",
            description="Solve a puzzle on your first attempt",
            category=AchievementCategory.SPECIAL,
            points=15
        ))
        
    def register(self, achievement: Achievement):
        """Register a new achievement."""
        self.achievements[achievement.id] = achievement
        
    def check_achievement(self, achievement_id: str, condition: bool) -> Optional[Achievement]:
        """
        Check if an achievement should be unlocked.
        Returns the achievement if newly unlocked, None otherwise.
        """
        if achievement_id not in self.achievements:
            return None
            
        if achievement_id in self.completed_achievements:
            return None
            
        if condition:
            return self.unlock_achievement(achievement_id)
            
        return None
        
    def unlock_achievement(self, achievement_id: str) -> Optional[Achievement]:
        """Unlock an achievement and process rewards."""
        if achievement_id not in self.achievements:
            return None
            
        if achievement_id in self.completed_achievements:
            return None
            
        achievement = self.achievements[achievement_id]
        self.completed_achievements.add(achievement_id)
        
        # Process unlock reward if any
        if achievement.unlock_reward:
            unlock_type = achievement.unlock_reward["type"]
            if isinstance(unlock_type, str):
                unlock_type = UnlockType(unlock_type)
            
            if unlock_type == UnlockType.CHARACTER_CLASS:
                self.unlocks[UnlockType.CHARACTER_CLASS].add(achievement.unlock_reward["class"])
            elif unlock_type == UnlockType.STARTING_ITEM:
                self.unlocks[UnlockType.STARTING_ITEM].add(achievement.unlock_reward["item"])
            elif unlock_type == UnlockType.GAME_MODE:
                self.unlocks[UnlockType.GAME_MODE].add(achievement.unlock_reward["mode"])
            elif unlock_type == UnlockType.COSMETIC:
                self.unlocks[UnlockType.COSMETIC].add(achievement.unlock_reward["item"])
                
        return achievement
        
    def update_progress(self, achievement_id: str, key: str, value: Any):
        """Update progress tracking for an achievement."""
        if achievement_id not in self.progress:
            self.progress[achievement_id] = {}
        self.progress[achievement_id][key] = value
        
    def get_progress(self, achievement_id: str, key: str, default: Any = 0) -> Any:
        """Get progress value for an achievement."""
        if achievement_id not in self.progress:
            return default
        return self.progress[achievement_id].get(key, default)
        
    def increment_progress(self, achievement_id: str, key: str, amount: int = 1):
        """Increment a progress counter."""
        current = self.get_progress(achievement_id, key, 0)
        self.update_progress(achievement_id, key, current + amount)
        
    def get_total_points(self) -> int:
        """Get total achievement points earned."""
        return sum(self.achievements[aid].points for aid in self.completed_achievements)
        
    def get_completion_percentage(self) -> float:
        """Get percentage of achievements completed."""
        if not self.achievements:
            return 0.0
        return (len(self.completed_achievements) / len(self.achievements)) * 100
        
    def get_achievements_by_category(self, category: AchievementCategory) -> List[Achievement]:
        """Get all achievements in a category."""
        return [a for a in self.achievements.values() if a.category == category]
        
    def is_unlocked(self, unlock_type: UnlockType, item: str) -> bool:
        """Check if something is unlocked."""
        return item in self.unlocks[unlock_type]
        
    def save_to_file(self, filepath: str):
        """Save achievement data to file."""
        data = {
            "completed": list(self.completed_achievements),
            "progress": self.progress,
            "unlocks": {
                unlock_type.value: list(items) 
                for unlock_type, items in self.unlocks.items()
            }
        }
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
            
    def load_from_file(self, filepath: str):
        """Load achievement data from file."""
        if not os.path.exists(filepath):
            return
            
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
                
            self.completed_achievements = set(data.get("completed", []))
            self.progress = data.get("progress", {})
            
            # Load unlocks
            for unlock_type in UnlockType:
                type_key = unlock_type.value
                if type_key in data.get("unlocks", {}):
                    self.unlocks[unlock_type] = set(data["unlocks"][type_key])
                    
        except Exception as e:
            print(f"Error loading achievements: {e}")


class AchievementManager:
    """Manages achievement checking and notifications."""
    
    def __init__(self, tracker: AchievementTracker):
        self.tracker = tracker
        self.pending_notifications: List[Achievement] = []
        
    def check_combat_achievements(self, player, monster, combat_result):
        """Check combat-related achievements."""
        # First blood
        if self.tracker.get_progress("first_blood", "kills", 0) == 0:
            achievement = self.tracker.check_achievement("first_blood", True)
            if achievement:
                self.pending_notifications.append(achievement)
                
        # Monster slayer
        self.tracker.increment_progress("monster_slayer", "kills")
        kills = self.tracker.get_progress("monster_slayer", "kills")
        achievement = self.tracker.check_achievement("monster_slayer", kills >= 50)
        if achievement:
            self.pending_notifications.append(achievement)
            
        # David vs Goliath
        if player.hp == 1:
            achievement = self.tracker.check_achievement("david_goliath", True)
            if achievement:
                self.pending_notifications.append(achievement)
                
        # Untouchable tracking
        if combat_result.damage_taken == 0:
            self.tracker.increment_progress("untouchable", "no_damage_kills")
            no_damage_kills = self.tracker.get_progress("untouchable", "no_damage_kills")
            achievement = self.tracker.check_achievement("untouchable", no_damage_kills >= 10)
            if achievement:
                self.pending_notifications.append(achievement)
        else:
            # Reset counter if damaged
            self.tracker.update_progress("untouchable", "no_damage_kills", 0)
            
    def check_exploration_achievements(self, player, dungeon_map):
        """Check exploration-related achievements."""
        # Room exploration
        self.tracker.increment_progress("explorer", "rooms")
        rooms = self.tracker.get_progress("explorer", "rooms")
        achievement = self.tracker.check_achievement("explorer", rooms >= 100)
        if achievement:
            self.pending_notifications.append(achievement)
            
        # Deep delver
        achievement = self.tracker.check_achievement("deep_delver", player.dungeon_level >= 10)
        if achievement:
            self.pending_notifications.append(achievement)
            
        # Cartographer - check if all rooms on floor explored
        if dungeon_map and hasattr(dungeon_map, 'is_floor_fully_explored'):
            if dungeon_map.is_floor_fully_explored():
                achievement = self.tracker.check_achievement("cartographer", True)
                if achievement:
                    self.pending_notifications.append(achievement)
                    
    def check_collection_achievements(self, player):
        """Check collection-related achievements."""
        # Treasure hunter
        achievement = self.tracker.check_achievement("treasure_hunter", player.gold >= 1000)
        if achievement:
            self.pending_notifications.append(achievement)
            
        # Hoarder
        item_count = sum(len(items) for items in player.inventory.items.values())
        achievement = self.tracker.check_achievement("hoarder", item_count >= 20)
        if achievement:
            self.pending_notifications.append(achievement)
            
        # Well equipped - check if all equipment slots are filled
        from equipment import EquipmentSlot
        all_equipped = (player.equipment.slots[EquipmentSlot.WEAPON] is not None and 
                       player.equipment.slots[EquipmentSlot.ARMOR] is not None and 
                       player.equipment.slots[EquipmentSlot.ACCESSORY] is not None)
        achievement = self.tracker.check_achievement("well_equipped", all_equipped)
        if achievement:
            self.pending_notifications.append(achievement)
            
    def check_progression_achievements(self, player):
        """Check progression-related achievements."""
        # Level achievements
        achievement = self.tracker.check_achievement("level_10", player.level >= 10)
        if achievement:
            self.pending_notifications.append(achievement)
            
        achievement = self.tracker.check_achievement("max_level", player.level >= 20)
        if achievement:
            self.pending_notifications.append(achievement)
            
    def check_item_use(self, item_type):
        """Track item usage for achievements."""
        self.tracker.increment_progress("potion_master", "items_used")
        items_used = self.tracker.get_progress("potion_master", "items_used")
        achievement = self.tracker.check_achievement("potion_master", items_used >= 50)
        if achievement:
            self.pending_notifications.append(achievement)
            
    def check_mimic_avoided(self):
        """Track avoiding mimics."""
        self.tracker.increment_progress("mimic_friend", "mimics_avoided")
        avoided = self.tracker.get_progress("mimic_friend", "mimics_avoided")
        achievement = self.tracker.check_achievement("mimic_friend", avoided >= 5)
        if achievement:
            self.pending_notifications.append(achievement)
            
    def check_puzzle_achievements(self, player, puzzle):
        """Check puzzle-related achievements."""
        from puzzles import PuzzleDifficulty
        
        # First puzzle solved
        achievement = self.tracker.check_achievement("puzzle_solver", True)
        if achievement:
            self.pending_notifications.append(achievement)
        
        # Difficulty-based achievements
        if puzzle.difficulty == PuzzleDifficulty.HARD:
            achievement = self.tracker.check_achievement("mind_bender", True)
            if achievement:
                self.pending_notifications.append(achievement)
        elif puzzle.difficulty == PuzzleDifficulty.LEGENDARY:
            achievement = self.tracker.check_achievement("enigma_master", True)
            if achievement:
                self.pending_notifications.append(achievement)
            
        # Perfect solve (no wrong attempts)
        if puzzle.attempts_used == 1:
            achievement = self.tracker.check_achievement("first_try", True)
            if achievement:
                self.pending_notifications.append(achievement)
    
    def get_and_clear_notifications(self) -> List[Achievement]:
        """Get pending achievement notifications and clear the list."""
        notifications = self.pending_notifications[:]
        self.pending_notifications.clear()
        return notifications
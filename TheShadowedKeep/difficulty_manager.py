"""
Difficulty scaling and New Game Plus system for The Shadowed Keep.
Handles dynamic difficulty adjustment and replayability features.
"""
import random
import math
from constants import (
    DIFFICULTY_MULTIPLIER_PER_FLOOR, MAX_DIFFICULTY_MULTIPLIER,
    ELITE_MONSTER_CHANCE_BASE, ELITE_MONSTER_CHANCE_PER_FLOOR,
    ELITE_HP_MULTIPLIER, ELITE_ATTACK_MULTIPLIER, 
    ELITE_GOLD_MULTIPLIER, ELITE_XP_MULTIPLIER,
    NG_PLUS_DIFFICULTY_MULTIPLIER, NG_PLUS_MAX_CYCLES,
    NG_PLUS_BONUS_GOLD_MULTIPLIER, NG_PLUS_BONUS_XP_MULTIPLIER,
    NG_PLUS_RARE_ITEM_CHANCE
)


class DifficultyManager:
    """Manages game difficulty scaling and New Game Plus features."""
    
    def __init__(self):
        self.ng_plus_cycle = 0
        self.base_difficulty = 1.0
        self.floor_based_scaling = True
        self.elite_monsters_enabled = True
        
    def get_difficulty_multiplier(self, floor_number: int) -> float:
        """Calculate the current difficulty multiplier."""
        # Base floor-based scaling
        floor_multiplier = 1.0
        if self.floor_based_scaling:
            floor_multiplier = 1.0 + (floor_number - 1) * DIFFICULTY_MULTIPLIER_PER_FLOOR
            floor_multiplier = min(floor_multiplier, MAX_DIFFICULTY_MULTIPLIER)
        
        # New Game Plus scaling
        ng_plus_multiplier = 1.0 + (self.ng_plus_cycle * NG_PLUS_DIFFICULTY_MULTIPLIER)
        
        # Combine multipliers
        total_multiplier = self.base_difficulty * floor_multiplier * ng_plus_multiplier
        return total_multiplier
        
    def scale_monster_stats(self, monster, floor_number: int):
        """Apply difficulty scaling to a monster's stats."""
        multiplier = self.get_difficulty_multiplier(floor_number)
        
        # Scale HP and attack power
        original_hp = monster.hp
        monster.hp = int(monster.hp * multiplier)
        monster.max_hp = monster.hp
        monster.attack_power = int(monster.attack_power * multiplier)
        
        # Scale rewards proportionally
        monster.gold_reward = int(monster.gold_reward * multiplier)
        monster.xp_reward = int(monster.xp_reward * multiplier)
        
        return monster
        
    def should_create_elite_monster(self, floor_number: int) -> bool:
        """Determine if a monster should be elite based on difficulty."""
        if not self.elite_monsters_enabled:
            return False
            
        base_chance = ELITE_MONSTER_CHANCE_BASE
        floor_bonus = floor_number * ELITE_MONSTER_CHANCE_PER_FLOOR
        ng_plus_bonus = self.ng_plus_cycle * 0.05  # +5% per NG+ cycle
        
        total_chance = base_chance + floor_bonus + ng_plus_bonus
        total_chance = min(total_chance, 0.4)  # Cap at 40%
        
        return random.random() < total_chance
        
    def create_elite_monster(self, base_monster):
        """Transform a regular monster into an elite variant."""
        # Enhance stats
        base_monster.hp = int(base_monster.hp * ELITE_HP_MULTIPLIER)
        base_monster.max_hp = base_monster.hp
        base_monster.attack_power = int(base_monster.attack_power * ELITE_ATTACK_MULTIPLIER)
        
        # Enhance rewards
        base_monster.gold_reward = int(base_monster.gold_reward * ELITE_GOLD_MULTIPLIER)
        base_monster.xp_reward = int(base_monster.xp_reward * ELITE_XP_MULTIPLIER)
        
        # Add elite marker
        base_monster.name = f"Elite {base_monster.name}"
        base_monster.is_elite = True
        
        # Add special abilities for elite monsters
        if hasattr(base_monster, 'status_effects'):
            # Elite monsters have a chance to inflict status effects
            base_monster.elite_effect_chance = 0.3  # 30% chance per attack
            
        return base_monster
        
    def get_gold_multiplier(self) -> float:
        """Get the gold reward multiplier for current NG+ cycle."""
        return 1.0 + (self.ng_plus_cycle * NG_PLUS_BONUS_GOLD_MULTIPLIER)
        
    def get_xp_multiplier(self) -> float:
        """Get the XP reward multiplier for current NG+ cycle."""
        return 1.0 + (self.ng_plus_cycle * NG_PLUS_BONUS_XP_MULTIPLIER)
        
    def get_rare_item_chance(self) -> float:
        """Get the chance for rare item drops in current NG+ cycle."""
        return self.ng_plus_cycle * NG_PLUS_RARE_ITEM_CHANCE
        
    def can_start_ng_plus(self) -> bool:
        """Check if New Game Plus can be started."""
        return self.ng_plus_cycle < NG_PLUS_MAX_CYCLES
        
    def start_ng_plus(self) -> bool:
        """Start a new NG+ cycle."""
        if not self.can_start_ng_plus():
            return False
            
        self.ng_plus_cycle += 1
        return True
        
    def get_ng_plus_info(self) -> dict:
        """Get information about the current NG+ state."""
        return {
            "cycle": self.ng_plus_cycle,
            "max_cycles": NG_PLUS_MAX_CYCLES,
            "difficulty_bonus": f"+{int(self.ng_plus_cycle * NG_PLUS_DIFFICULTY_MULTIPLIER * 100)}%",
            "gold_bonus": f"+{int(self.ng_plus_cycle * NG_PLUS_BONUS_GOLD_MULTIPLIER * 100)}%",
            "xp_bonus": f"+{int(self.ng_plus_cycle * NG_PLUS_BONUS_XP_MULTIPLIER * 100)}%",
            "rare_item_chance": f"{int(self.get_rare_item_chance() * 100)}%",
            # Next cycle bonuses
            "next_difficulty_bonus": f"+{int((self.ng_plus_cycle + 1) * NG_PLUS_DIFFICULTY_MULTIPLIER * 100)}%",
            "next_gold_bonus": f"+{int((self.ng_plus_cycle + 1) * NG_PLUS_BONUS_GOLD_MULTIPLIER * 100)}%",
            "next_xp_bonus": f"+{int((self.ng_plus_cycle + 1) * NG_PLUS_BONUS_XP_MULTIPLIER * 100)}%",
            "next_rare_item_chance": f"{int((self.ng_plus_cycle + 1) * NG_PLUS_RARE_ITEM_CHANCE * 100)}%"
        }
        
    def get_difficulty_display(self, floor_number: int) -> str:
        """Get a display string for current difficulty."""
        multiplier = self.get_difficulty_multiplier(floor_number)
        percentage = int((multiplier - 1.0) * 100)
        
        if self.ng_plus_cycle > 0:
            return f"NG+{self.ng_plus_cycle} (+{percentage}% difficulty)"
        elif percentage > 0:
            return f"Normal (+{percentage}% difficulty)"
        else:
            return "Normal difficulty"
            
    def apply_ng_plus_bonuses(self, rewards: dict) -> dict:
        """Apply NG+ bonuses to rewards."""
        if self.ng_plus_cycle == 0:
            return rewards
            
        # Apply multipliers
        if "gold" in rewards:
            rewards["gold"] = int(rewards["gold"] * self.get_gold_multiplier())
        if "xp" in rewards:
            rewards["xp"] = int(rewards["xp"] * self.get_xp_multiplier())
            
        # Chance for bonus rare items
        if random.random() < self.get_rare_item_chance():
            if "bonus_items" not in rewards:
                rewards["bonus_items"] = []
            rewards["bonus_items"].append("rare_ng_plus_reward")
            
        return rewards
        
    def save_to_dict(self) -> dict:
        """Save difficulty manager state to dictionary."""
        return {
            "ng_plus_cycle": self.ng_plus_cycle,
            "base_difficulty": self.base_difficulty,
            "floor_based_scaling": self.floor_based_scaling,
            "elite_monsters_enabled": self.elite_monsters_enabled
        }
        
    def load_from_dict(self, data: dict):
        """Load difficulty manager state from dictionary."""
        self.ng_plus_cycle = data.get("ng_plus_cycle", 0)
        self.base_difficulty = data.get("base_difficulty", 1.0)
        self.floor_based_scaling = data.get("floor_based_scaling", True)
        self.elite_monsters_enabled = data.get("elite_monsters_enabled", True)


class AdaptiveDifficulty:
    """Adaptive difficulty system that adjusts based on player performance."""
    
    def __init__(self):
        self.player_performance_score = 0.0
        self.recent_deaths = 0
        self.recent_victories = 0
        self.evaluation_window = 10  # Number of encounters to consider
        self.enabled = True
        
    def record_combat_result(self, victory: bool, player_hp_remaining: int, player_max_hp: int):
        """Record the result of a combat encounter."""
        if not self.enabled:
            return
            
        if victory:
            self.recent_victories += 1
            # Higher score for winning with more HP remaining
            hp_percentage = player_hp_remaining / player_max_hp
            performance = 0.5 + (hp_percentage * 0.5)  # 0.5 to 1.0
        else:
            self.recent_deaths += 1
            performance = 0.0
            
        # Update running average
        weight = 0.1  # How much new data affects the score
        self.player_performance_score = (
            (1 - weight) * self.player_performance_score + 
            weight * performance
        )
        
        # Keep recent stats within window
        total_recent = self.recent_deaths + self.recent_victories
        if total_recent > self.evaluation_window:
            # Scale down proportionally
            scale = self.evaluation_window / total_recent
            self.recent_deaths = int(self.recent_deaths * scale)
            self.recent_victories = int(self.recent_victories * scale)
            
    def get_adaptive_multiplier(self) -> float:
        """Get difficulty multiplier based on player performance."""
        if not self.enabled:
            return 1.0
            
        # Performance score ranges from 0.0 (struggling) to 1.0 (dominating)
        # Convert to difficulty multiplier: 0.7x to 1.3x
        base_range = 0.6  # Total range of adjustment
        min_multiplier = 0.7
        
        # Invert performance score (high performance = higher difficulty)
        inverted_performance = 1.0 - self.player_performance_score
        multiplier = min_multiplier + (inverted_performance * base_range)
        
        return multiplier
        
    def get_performance_assessment(self) -> str:
        """Get a text description of player performance."""
        if self.player_performance_score >= 0.8:
            return "Dominating"
        elif self.player_performance_score >= 0.6:
            return "Performing well"
        elif self.player_performance_score >= 0.4:
            return "Average performance"
        elif self.player_performance_score >= 0.2:
            return "Struggling"
        else:
            return "Having difficulty"
            
    def should_suggest_difficulty_change(self) -> tuple:
        """Check if difficulty change should be suggested to player."""
        total_encounters = self.recent_deaths + self.recent_victories
        if total_encounters < 5:  # Need some data first
            return False, ""
            
        death_rate = self.recent_deaths / total_encounters
        
        if death_rate >= 0.6:  # Dying more than 60% of the time
            return True, "Consider reducing difficulty - you're dying frequently."
        elif death_rate <= 0.1 and self.player_performance_score >= 0.8:
            return True, "Consider increasing difficulty - you're dominating encounters."
            
        return False, ""
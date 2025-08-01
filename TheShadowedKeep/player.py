"""
Player class for The Shadowed Keep.
Handles player stats, equipment, and progression.
"""
from equipment import EquipmentManager
from character_classes import Warrior
from constants import (
    PLAYER_BASE_HP, PLAYER_BASE_ATTACK, PLAYER_BASE_DEFENSE,
    XP_PER_LEVEL_MULTIPLIER, HP_PER_LEVEL, ATTACK_PER_LEVEL
)
from status_effects import StatusEffectManager
from consumables import Inventory


class Player:
    """
    The player character.
    """
    def __init__(self, name="Hero", character_class=None):
        self.name = name
        self.character_class = character_class or Warrior()  # Default to warrior
        
        # Get starting stats from class
        starting_stats = self.character_class.get_starting_stats()
        
        self.hp = starting_stats["hp"]
        self.max_hp = starting_stats["hp"]
        self.base_attack_power = starting_stats["attack"]
        self.base_defense = starting_stats.get("defense", 0)
        self.gold = 0
        self.dungeon_level = 1
        self.level = 1
        self.xp = 0
        self.xp_to_next_level = XP_PER_LEVEL_MULTIPLIER  # Level * 10 formula
        self.equipment = EquipmentManager()
        self._base_max_hp = starting_stats["hp"]  # Track base max HP separately
        self.status_effects = StatusEffectManager()
        self.inventory = Inventory()

    def is_alive(self):
        return self.hp > 0
        
    @property
    def attack_power(self):
        """Total attack power including equipment."""
        equipment_stats = self.equipment.get_total_stats()
        return self.base_attack_power + equipment_stats.attack
        
    @property
    def defense(self):
        """Total defense from equipment and class."""
        equipment_stats = self.equipment.get_total_stats()
        return self.base_defense + equipment_stats.defense
        
    def update_max_hp(self):
        """Update max HP based on equipment."""
        equipment_stats = self.equipment.get_total_stats()
        old_max_hp = self.max_hp
        self.max_hp = self._base_max_hp + equipment_stats.max_hp
        
        # If max HP increased, heal the difference
        if self.max_hp > old_max_hp:
            self.hp += (self.max_hp - old_max_hp)
        # If max HP decreased, cap current HP
        elif self.hp > self.max_hp:
            self.hp = self.max_hp

    def take_damage(self, damage):
        # Check for shield first
        shield = self.status_effects.get_shield()
        if shield:
            damage = shield.absorb_damage(damage)
            
        # Apply defense reduction
        actual_damage = max(1, damage - self.defense)
        self.hp -= actual_damage
        if self.hp < 0:
            self.hp = 0
        return actual_damage  # Return actual damage for display
            
    def gain_xp(self, amount):
        """Award XP and check for level up. Returns True if leveled up."""
        self.xp += amount
        leveled_up = False
        
        # Check for level up
        while self.xp >= self.xp_to_next_level:
            self.xp -= self.xp_to_next_level
            self.level += 1
            self.xp_to_next_level = self.level * XP_PER_LEVEL_MULTIPLIER
            leveled_up = True
            
            # Get class-specific level up bonuses
            level_bonuses = self.character_class.get_level_up_bonuses(self.level)
            
            # Apply bonuses
            self._base_max_hp += level_bonuses.get("hp", HP_PER_LEVEL)
            self.base_attack_power += level_bonuses.get("attack", ATTACK_PER_LEVEL)
            if "defense" in level_bonuses:
                self.base_defense += level_bonuses["defense"]
                
            self.update_max_hp()  # Recalculate with equipment
            self.hp = self.max_hp  # Full heal on level up
            
            # Call class-specific level up effects
            self.character_class.on_level_up(self, self.level)
            
        return leveled_up
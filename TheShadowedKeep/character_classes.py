"""
Character class system for The Shadowed Keep.
Provides different playstyles with unique abilities.
"""
from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Optional, List


class CharacterClass(Enum):
    """Available character classes."""
    WARRIOR = "warrior"
    ROGUE = "rogue" 
    MAGE = "mage"


class CharacterClassBase(ABC):
    """Abstract base class for character classes."""
    
    def __init__(self):
        self.name = "Adventurer"
        self.description = "A brave adventurer"
        self.class_type = None
        
        # Base stat modifiers
        self.hp_modifier = 0
        self.attack_modifier = 0
        self.defense_modifier = 0
        
        # Class-specific abilities
        self.abilities = {}
        
        # Special mechanics
        self.critical_chance_modifier = 0.0
        self.dodge_chance_modifier = 0.0
        self.parry_chance_modifier = 0.0
        
    @abstractmethod
    def get_starting_stats(self) -> Dict[str, int]:
        """Get the starting stats for this class."""
        pass
        
    @abstractmethod
    def get_level_up_bonuses(self, level: int) -> Dict[str, int]:
        """Get stat bonuses on level up."""
        pass
        
    @abstractmethod
    def get_special_ability_description(self) -> str:
        """Get description of the class's special ability."""
        pass
        
    def apply_combat_modifiers(self, combat_manager):
        """Apply class-specific combat modifiers."""
        combat_manager.critical_hit_chance += self.critical_chance_modifier
        
    def on_combat_start(self, player, enemy):
        """Called when combat starts."""
        pass
        
    def on_attack(self, player, enemy, damage: int) -> int:
        """Modify attack damage based on class abilities."""
        return damage
        
    def on_defend(self, player, enemy, damage: int) -> int:
        """Modify incoming damage when defending."""
        return damage
        
    def on_level_up(self, player, new_level: int):
        """Special effects on level up."""
        pass


class Warrior(CharacterClassBase):
    """
    Warrior class - High HP and defense, moderate attack.
    Special: Rage - Damage increases as HP decreases.
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Warrior"
        self.description = "A mighty warrior, strong and durable"
        self.class_type = CharacterClass.WARRIOR
        
        # Warriors have high HP and defense
        self.hp_modifier = 5
        self.defense_modifier = 2
        self.attack_modifier = 0
        
        # Warriors have better parry chance
        self.parry_chance_modifier = 0.1  # +10% parry chance
        
    def get_starting_stats(self) -> Dict[str, int]:
        """Warriors start with high HP and defense."""
        return {
            "hp": 25,  # Base is 20
            "attack": 5,
            "defense": 2
        }
        
    def get_level_up_bonuses(self, level: int) -> Dict[str, int]:
        """Warriors gain extra HP on level up."""
        return {
            "hp": 4,  # Base is 3
            "attack": 1
        }
        
    def get_special_ability_description(self) -> str:
        return "Rage: Deal more damage when health is low (up to +50% at 25% HP)"
        
    def on_attack(self, player, enemy, damage: int) -> int:
        """Rage mechanic - more damage when HP is low."""
        hp_percentage = player.hp / player.max_hp
        
        if hp_percentage <= 0.25:
            # 50% bonus damage at 25% HP or less
            return int(damage * 1.5)
        elif hp_percentage <= 0.5:
            # 25% bonus damage at 50% HP or less
            return int(damage * 1.25)
            
        return damage
        
    def on_defend(self, player, enemy, damage: int) -> int:
        """Warriors have natural damage resistance when defending."""
        # Additional 25% damage reduction when defending
        return int(damage * 0.75)


class Rogue(CharacterClassBase):
    """
    Rogue class - High critical chance and dodge, lower HP.
    Special: Sneak Attack - First attack in combat deals double damage.
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Rogue"
        self.description = "A cunning rogue, quick and deadly"
        self.class_type = CharacterClass.ROGUE
        
        # Rogues have lower HP but higher attack
        self.hp_modifier = -3
        self.attack_modifier = 2
        self.defense_modifier = -1
        
        # Rogues excel at criticals and dodging
        self.critical_chance_modifier = 0.15  # +15% crit chance (25% total)
        self.dodge_chance_modifier = 0.15  # +15% dodge chance
        
        # Track if sneak attack has been used this combat
        self.sneak_attack_used = False
        
    def get_starting_stats(self) -> Dict[str, int]:
        """Rogues start with low HP but high attack."""
        return {
            "hp": 17,  # Base is 20
            "attack": 7,  # Base is 5
            "defense": 0
        }
        
    def get_level_up_bonuses(self, level: int) -> Dict[str, int]:
        """Rogues gain extra attack on level up."""
        return {
            "hp": 2,  # Base is 3
            "attack": 2  # Base is 1
        }
        
    def get_special_ability_description(self) -> str:
        return "Sneak Attack: First attack in combat deals double damage"
        
    def on_combat_start(self, player, enemy):
        """Reset sneak attack at combat start."""
        self.sneak_attack_used = False
        
    def on_attack(self, player, enemy, damage: int) -> int:
        """Sneak attack on first hit."""
        if not self.sneak_attack_used:
            self.sneak_attack_used = True
            return damage * 2
            
        return damage
        
    def apply_combat_modifiers(self, combat_manager):
        """Apply rogue combat modifiers."""
        super().apply_combat_modifiers(combat_manager)
        # Rogues also have better dodge success rate
        # This would need to be implemented in combat_manager


class Mage(CharacterClassBase):
    """
    Mage class - Low HP and defense, high attack with mana system.
    Special: Spell Power - Attacks can be empowered by spending mana.
    """
    
    def __init__(self):
        super().__init__()
        self.name = "Mage"
        self.description = "A mystical mage, wielding arcane power"
        self.class_type = CharacterClass.MAGE
        
        # Mages have low HP and defense but high attack
        self.hp_modifier = -5
        self.attack_modifier = 3
        self.defense_modifier = -2
        
        # Mages have slight crit bonus from precise spellcasting
        self.critical_chance_modifier = 0.05  # +5% crit chance
        
        # Mana system
        self.max_mana = 10
        self.current_mana = 10
        self.mana_regen_per_room = 2
        
    def get_starting_stats(self) -> Dict[str, int]:
        """Mages start with low HP but very high attack."""
        return {
            "hp": 15,  # Base is 20
            "attack": 8,  # Base is 5
            "defense": 0
        }
        
    def get_level_up_bonuses(self, level: int) -> Dict[str, int]:
        """Mages gain attack and mana on level up."""
        # Also increase max mana
        self.max_mana += 2
        self.current_mana = self.max_mana  # Full mana restore on level
        
        return {
            "hp": 2,  # Base is 3
            "attack": 2  # Base is 1
        }
        
    def get_special_ability_description(self) -> str:
        return f"Spell Power: Spend 3 mana to deal +50% damage on next attack (Mana: {self.current_mana}/{self.max_mana})"
        
    def on_attack(self, player, enemy, damage: int) -> int:
        """Can empower attacks with mana."""
        # This would be triggered by a special command in combat
        # For now, we'll implement the base mechanic
        return damage
        
    def regenerate_mana(self):
        """Regenerate mana between rooms."""
        self.current_mana = min(self.max_mana, self.current_mana + self.mana_regen_per_room)
        
    def spend_mana(self, amount: int) -> bool:
        """Attempt to spend mana. Returns True if successful."""
        if self.current_mana >= amount:
            self.current_mana -= amount
            return True
        return False
        
    def on_level_up(self, player, new_level: int):
        """Restore mana on level up."""
        self.current_mana = self.max_mana


class CharacterClassFactory:
    """Factory for creating character classes."""
    
    _classes = {
        CharacterClass.WARRIOR: Warrior,
        CharacterClass.ROGUE: Rogue,
        CharacterClass.MAGE: Mage
    }
    
    @classmethod
    def create(cls, class_type: CharacterClass) -> CharacterClassBase:
        """Create a character class instance."""
        if class_type not in cls._classes:
            raise ValueError(f"Unknown character class: {class_type}")
            
        return cls._classes[class_type]()
        
    @classmethod
    def get_class_descriptions(cls) -> Dict[CharacterClass, Dict[str, str]]:
        """Get descriptions of all classes for character creation."""
        descriptions = {}
        
        for class_type, class_cls in cls._classes.items():
            instance = class_cls()
            starting_stats = instance.get_starting_stats()
            
            descriptions[class_type] = {
                "name": instance.name,
                "description": instance.description,
                "hp": starting_stats["hp"],
                "attack": starting_stats["attack"],
                "defense": starting_stats["defense"],
                "special": instance.get_special_ability_description()
            }
            
        return descriptions
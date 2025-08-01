"""
Consumable items system for The Shadowed Keep.
Implements various types of consumable items with effects.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from enum import Enum
from status_effects import (
    StatusEffectType, PoisonEffect, StunEffect, WeaknessEffect,
    RegenerationEffect, StrengthEffect, ShieldEffect
)


class ConsumableType(Enum):
    """Types of consumable items."""
    HEALING_POTION = "healing_potion"
    MANA_POTION = "mana_potion"
    ANTIDOTE = "antidote"
    STRENGTH_POTION = "strength_potion"
    DEFENSE_POTION = "defense_potion"
    SPEED_POTION = "speed_potion"
    REGENERATION_POTION = "regeneration_potion"
    BREAD = "bread"
    CHEESE = "cheese"
    MEAT = "meat"
    SMOKE_BOMB = "smoke_bomb"
    THROWING_KNIFE = "throwing_knife"
    FIRE_BOMB = "fire_bomb"


class ConsumableItem(ABC):
    """Abstract base class for consumable items."""
    
    def __init__(self, name: str, description: str, value: int, stack_size: int = 10):
        self.name = name
        self.description = description
        self.value = value  # Gold value
        self.stack_size = stack_size  # Max items per stack
        self.consumable_type = ConsumableType.HEALING_POTION  # Override in subclasses
        
    @abstractmethod
    def use(self, player, target=None) -> List[str]:
        """
        Use the consumable item.
        Returns list of messages describing the effect.
        """
        pass
        
    @abstractmethod
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        """
        Check if the item can be used in the current context.
        Returns (can_use, reason_if_not).
        """
        pass
        
    def __str__(self):
        return self.name
        
    def __repr__(self):
        return f"{self.__class__.__name__}()"


class HealingPotion(ConsumableItem):
    """Basic healing potion."""
    
    def __init__(self, potency: int = 20):
        super().__init__(
            name="Healing Potion",
            description=f"Restores {potency} HP when consumed",
            value=25
        )
        self.potency = potency
        self.consumable_type = ConsumableType.HEALING_POTION
        
    def use(self, player, target=None) -> List[str]:
        old_hp = player.hp
        player.hp = min(player.max_hp, player.hp + self.potency)
        actual_heal = player.hp - old_hp
        
        if actual_heal > 0:
            return [f"You drink the {self.name} and recover {actual_heal} HP!",
                    f"Current HP: {player.hp}/{player.max_hp}"]
        else:
            return ["You're already at full health! The potion has no effect."]
            
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if player.hp >= player.max_hp:
            return False, "Already at full health"
        return True, ""


class ManaPotion(ConsumableItem):
    """Restores mana for spellcasters."""
    
    def __init__(self, potency: int = 10):
        super().__init__(
            name="Mana Potion",
            description=f"Restores {potency} mana when consumed",
            value=30
        )
        self.potency = potency
        self.consumable_type = ConsumableType.MANA_POTION
        
    def use(self, player, target=None) -> List[str]:
        if hasattr(player, 'character_class') and hasattr(player.character_class, 'current_mana'):
            old_mana = player.character_class.current_mana
            player.character_class.current_mana = min(
                player.character_class.max_mana,
                player.character_class.current_mana + self.potency
            )
            actual_restore = player.character_class.current_mana - old_mana
            
            if actual_restore > 0:
                return [f"You drink the {self.name} and recover {actual_restore} mana!",
                        f"Current Mana: {player.character_class.current_mana}/{player.character_class.max_mana}"]
            else:
                return ["Your mana is already full! The potion has no effect."]
        else:
            return ["You don't have any mana to restore!"]
            
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if not (hasattr(player, 'character_class') and hasattr(player.character_class, 'current_mana')):
            return False, "No mana system"
        if player.character_class.current_mana >= player.character_class.max_mana:
            return False, "Already at full mana"
        return True, ""


class Antidote(ConsumableItem):
    """Cures poison status effect."""
    
    def __init__(self):
        super().__init__(
            name="Antidote",
            description="Cures poison and grants temporary immunity",
            value=15
        )
        self.consumable_type = ConsumableType.ANTIDOTE
        
    def use(self, player, target=None) -> List[str]:
        messages = []
        
        # Remove poison if present
        if player.status_effects.has_effect(StatusEffectType.POISON):
            player.status_effects.remove_effect(StatusEffectType.POISON)
            messages.append("The antidote neutralizes the poison in your system!")
        else:
            messages.append("You drink the antidote as a precaution.")
            
        # Could add temporary poison immunity here
        return messages
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        # Can always use antidote (preventative)
        return True, ""


class StrengthPotion(ConsumableItem):
    """Temporarily increases attack power."""
    
    def __init__(self):
        super().__init__(
            name="Strength Potion",
            description="Increases attack power by 50% for 5 turns",
            value=40
        )
        self.consumable_type = ConsumableType.STRENGTH_POTION
        
    def use(self, player, target=None) -> List[str]:
        effect = StrengthEffect(duration=5, potency=50)
        messages = player.status_effects.add_effect(effect, player)
        messages.insert(0, f"You drink the {self.name}!")
        return messages
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if player.status_effects.has_effect(StatusEffectType.STRENGTH):
            return False, "Already have strength buff"
        return True, ""


class DefensePotion(ConsumableItem):
    """Grants a temporary shield."""
    
    def __init__(self):
        super().__init__(
            name="Defense Potion",
            description="Grants a 15 HP shield that lasts 3 turns",
            value=35
        )
        self.consumable_type = ConsumableType.DEFENSE_POTION
        
    def use(self, player, target=None) -> List[str]:
        effect = ShieldEffect(duration=3, potency=15)
        messages = player.status_effects.add_effect(effect, player)
        messages.insert(0, f"You drink the {self.name}!")
        return messages
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if player.status_effects.has_effect(StatusEffectType.SHIELD):
            return False, "Already have a shield"
        return True, ""


class RegenerationPotion(ConsumableItem):
    """Grants health regeneration over time."""
    
    def __init__(self):
        super().__init__(
            name="Regeneration Potion",
            description="Regenerate 3 HP per turn for 7 turns",
            value=45
        )
        self.consumable_type = ConsumableType.REGENERATION_POTION
        
    def use(self, player, target=None) -> List[str]:
        effect = RegenerationEffect(duration=7, potency=3)
        messages = player.status_effects.add_effect(effect, player)
        messages.insert(0, f"You drink the {self.name}!")
        return messages
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if player.status_effects.has_effect(StatusEffectType.REGENERATION):
            return False, "Already regenerating"
        return True, ""


class Bread(ConsumableItem):
    """Basic food item that heals a small amount."""
    
    def __init__(self):
        super().__init__(
            name="Bread",
            description="A loaf of bread. Restores 8 HP",
            value=5,
            stack_size=20
        )
        self.consumable_type = ConsumableType.BREAD
        self.heal_amount = 8
        
    def use(self, player, target=None) -> List[str]:
        old_hp = player.hp
        player.hp = min(player.max_hp, player.hp + self.heal_amount)
        actual_heal = player.hp - old_hp
        
        if actual_heal > 0:
            return [f"You eat the {self.name} and recover {actual_heal} HP.",
                    f"Current HP: {player.hp}/{player.max_hp}"]
        else:
            return ["You're not hungry. The bread has no effect."]
            
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if in_combat:
            return False, "Can't eat during combat"
        if player.hp >= player.max_hp:
            return False, "Already at full health"
        return True, ""


class Cheese(ConsumableItem):
    """Food that heals and removes weakness."""
    
    def __init__(self):
        super().__init__(
            name="Cheese",
            description="Aged cheese. Restores 12 HP and cures weakness",
            value=8,
            stack_size=20
        )
        self.consumable_type = ConsumableType.CHEESE
        self.heal_amount = 12
        
    def use(self, player, target=None) -> List[str]:
        messages = []
        
        # Heal HP
        old_hp = player.hp
        player.hp = min(player.max_hp, player.hp + self.heal_amount)
        actual_heal = player.hp - old_hp
        
        if actual_heal > 0:
            messages.append(f"You eat the {self.name} and recover {actual_heal} HP.")
            
        # Remove weakness
        if player.status_effects.has_effect(StatusEffectType.WEAKNESS):
            player.status_effects.remove_effect(StatusEffectType.WEAKNESS)
            messages.append("The hearty cheese restores your strength!")
            
        if not messages:
            messages.append("The cheese has no effect.")
            
        if actual_heal > 0:
            messages.append(f"Current HP: {player.hp}/{player.max_hp}")
            
        return messages
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if in_combat:
            return False, "Can't eat during combat"
        if player.hp >= player.max_hp and not player.status_effects.has_effect(StatusEffectType.WEAKNESS):
            return False, "No beneficial effect"
        return True, ""


class Meat(ConsumableItem):
    """Hearty food that provides significant healing."""
    
    def __init__(self):
        super().__init__(
            name="Cooked Meat",
            description="Well-cooked meat. Restores 25 HP",
            value=15,
            stack_size=10
        )
        self.consumable_type = ConsumableType.MEAT
        self.heal_amount = 25
        
    def use(self, player, target=None) -> List[str]:
        old_hp = player.hp
        player.hp = min(player.max_hp, player.hp + self.heal_amount)
        actual_heal = player.hp - old_hp
        
        if actual_heal > 0:
            return [f"You eat the {self.name} and recover {actual_heal} HP!",
                    f"Current HP: {player.hp}/{player.max_hp}"]
        else:
            return ["You're already full. The meat has no effect."]
            
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if in_combat:
            return False, "Can't eat during combat"
        if player.hp >= player.max_hp:
            return False, "Already at full health"
        return True, ""


class SmokeBomb(ConsumableItem):
    """Allows guaranteed escape from combat."""
    
    def __init__(self):
        super().__init__(
            name="Smoke Bomb",
            description="Creates a smoke screen to escape combat",
            value=20,
            stack_size=5
        )
        self.consumable_type = ConsumableType.SMOKE_BOMB
        
    def use(self, player, target=None) -> List[str]:
        return ["You throw the smoke bomb and disappear in the confusion!",
                "You successfully escape from combat!"]
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if not in_combat:
            return False, "Can only use in combat"
        return True, ""


class ThrowingKnife(ConsumableItem):
    """Thrown weapon that deals damage."""
    
    def __init__(self):
        super().__init__(
            name="Throwing Knife",
            description="A balanced knife for throwing. Deals 10 damage",
            value=10,
            stack_size=20
        )
        self.consumable_type = ConsumableType.THROWING_KNIFE
        self.damage = 10
        
    def use(self, player, target=None) -> List[str]:
        if target and hasattr(target, 'take_damage'):
            target.take_damage(self.damage)
            return [f"You throw the knife at {target.name} for {self.damage} damage!",
                    f"{target.name} HP: {target.hp}"]
        else:
            return ["No target to throw at!"]
            
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if not in_combat:
            return False, "Can only use in combat"
        return True, ""


class FireBomb(ConsumableItem):
    """Explosive that deals damage over time."""
    
    def __init__(self):
        super().__init__(
            name="Fire Bomb",
            description="Explodes on impact, dealing 15 damage and burning",
            value=30,
            stack_size=5
        )
        self.consumable_type = ConsumableType.FIRE_BOMB
        self.damage = 15
        
    def use(self, player, target=None) -> List[str]:
        messages = []
        
        if target and hasattr(target, 'take_damage'):
            target.take_damage(self.damage)
            messages.append(f"The fire bomb explodes, dealing {self.damage} damage to {target.name}!")
            messages.append(f"{target.name} HP: {target.hp}")
            
            # Apply burn effect (using poison mechanics)
            if hasattr(target, 'status_effects'):
                burn = PoisonEffect(duration=3, potency=3)
                burn.effect_type = StatusEffectType.POISON  # Reuse poison for burn
                effect_messages = target.status_effects.add_effect(burn, target)
                if effect_messages:
                    messages.append(f"{target.name} is set on fire!")
        else:
            messages.append("No target to throw at!")
            
        return messages
        
    def can_use(self, player, in_combat: bool = False) -> tuple[bool, str]:
        if not in_combat:
            return False, "Can only use in combat"
        return True, ""


class Inventory:
    """Manages the player's consumable items."""
    
    def __init__(self, max_slots: int = 20):
        self.max_slots = max_slots
        self.items: Dict[ConsumableType, List[ConsumableItem]] = {}
        
    def add_item(self, item: ConsumableItem) -> bool:
        """
        Add an item to inventory.
        Returns True if successful, False if inventory full.
        """
        item_type = item.consumable_type
        
        # Check if we have this item type
        if item_type in self.items:
            # Check stack size
            if len(self.items[item_type]) < item.stack_size:
                self.items[item_type].append(item)
                return True
            # Stack is full, cannot add more of this type
            return False
                
        # Check if we have space for new item type
        elif len(self.items) < self.max_slots:
            self.items[item_type] = [item]
            return True
            
        return False
        
    def remove_item(self, item_type: ConsumableType) -> Optional[ConsumableItem]:
        """Remove and return one item of the specified type."""
        if item_type in self.items and self.items[item_type]:
            item = self.items[item_type].pop()
            if not self.items[item_type]:
                del self.items[item_type]
            return item
        return None
        
    def get_count(self, item_type: ConsumableType) -> int:
        """Get count of a specific item type."""
        return len(self.items.get(item_type, []))
        
    def get_all_items(self) -> List[tuple[ConsumableType, int]]:
        """Get list of all item types and their counts."""
        return [(item_type, len(items)) for item_type, items in self.items.items()]
        
    def has_item(self, item_type: ConsumableType) -> bool:
        """Check if inventory contains an item type."""
        return item_type in self.items and len(self.items[item_type]) > 0
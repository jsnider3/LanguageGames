"""
Equipment system for The Shadowed Keep.
"""
from enum import Enum
from typing import Optional, Dict


class EquipmentSlot(Enum):
    """Available equipment slots."""
    WEAPON = "weapon"
    ARMOR = "armor"
    ACCESSORY = "accessory"


class EquipmentStats:
    """Stats provided by equipment."""
    def __init__(self, attack: int = 0, defense: int = 0, max_hp: int = 0, 
                 crit_chance: float = 0.0, dodge_chance: float = 0.0):
        self.attack = attack
        self.defense = defense
        self.max_hp = max_hp
        self.crit_chance = crit_chance
        self.dodge_chance = dodge_chance
        
    def __add__(self, other):
        """Add two EquipmentStats together."""
        if not isinstance(other, EquipmentStats):
            return NotImplemented
        return EquipmentStats(
            attack=self.attack + other.attack,
            defense=self.defense + other.defense,
            max_hp=self.max_hp + other.max_hp,
            crit_chance=self.crit_chance + other.crit_chance,
            dodge_chance=self.dodge_chance + other.dodge_chance
        )


class Equipment:
    """Base class for all equipment."""
    def __init__(self, name: str, slot: EquipmentSlot, stats: EquipmentStats, 
                 value: int = 0, description: str = ""):
        self.name = name
        self.slot = slot
        self.stats = stats
        self.value = value
        self.description = description or f"A {slot.value}"
        
    def __str__(self):
        """String representation of equipment."""
        stat_parts = []
        if self.stats.attack > 0:
            stat_parts.append(f"+{self.stats.attack} ATK")
        if self.stats.defense > 0:
            stat_parts.append(f"+{self.stats.defense} DEF")
        if self.stats.max_hp > 0:
            stat_parts.append(f"+{self.stats.max_hp} HP")
        if self.stats.crit_chance > 0:
            stat_parts.append(f"+{int(self.stats.crit_chance * 100)}% Crit")
        if self.stats.dodge_chance > 0:
            stat_parts.append(f"+{int(self.stats.dodge_chance * 100)}% Dodge")
            
        stats_str = ", ".join(stat_parts) if stat_parts else "No bonuses"
        return f"{self.name} ({stats_str})"


# Predefined weapons
class RustyDagger(Equipment):
    def __init__(self):
        super().__init__(
            name="Rusty Dagger",
            slot=EquipmentSlot.WEAPON,
            stats=EquipmentStats(attack=1),
            value=5,
            description="A worn dagger with a chipped blade"
        )


class IronSword(Equipment):
    def __init__(self):
        super().__init__(
            name="Iron Sword",
            slot=EquipmentSlot.WEAPON,
            stats=EquipmentStats(attack=3),
            value=20,
            description="A sturdy iron sword"
        )


class SteelSword(Equipment):
    def __init__(self):
        super().__init__(
            name="Steel Sword",
            slot=EquipmentSlot.WEAPON,
            stats=EquipmentStats(attack=5, crit_chance=0.05),
            value=50,
            description="A well-forged steel blade"
        )


# Predefined armor
class LeatherArmor(Equipment):
    def __init__(self):
        super().__init__(
            name="Leather Armor",
            slot=EquipmentSlot.ARMOR,
            stats=EquipmentStats(defense=2, max_hp=5),
            value=15,
            description="Light armor made from tanned hide"
        )


class ChainMail(Equipment):
    def __init__(self):
        super().__init__(
            name="Chain Mail",
            slot=EquipmentSlot.ARMOR,
            stats=EquipmentStats(defense=4, max_hp=10),
            value=40,
            description="Interlocking metal rings provide good protection"
        )


# Predefined accessories
class LuckyCharm(Equipment):
    def __init__(self):
        super().__init__(
            name="Lucky Charm",
            slot=EquipmentSlot.ACCESSORY,
            stats=EquipmentStats(crit_chance=0.1, dodge_chance=0.05),
            value=25,
            description="A small trinket that brings good fortune"
        )


class HealthRing(Equipment):
    def __init__(self):
        super().__init__(
            name="Health Ring",
            slot=EquipmentSlot.ACCESSORY,
            stats=EquipmentStats(max_hp=10),
            value=30,
            description="A ring that enhances vitality"
        )


class EquipmentManager:
    """Manages equipment for a character."""
    def __init__(self):
        self.slots: Dict[EquipmentSlot, Optional[Equipment]] = {
            EquipmentSlot.WEAPON: None,
            EquipmentSlot.ARMOR: None,
            EquipmentSlot.ACCESSORY: None
        }
        
    def equip(self, item: Equipment) -> Optional[Equipment]:
        """
        Equip an item, returning the previously equipped item if any.
        """
        old_item = self.slots[item.slot]
        self.slots[item.slot] = item
        return old_item
        
    def unequip(self, slot: EquipmentSlot) -> Optional[Equipment]:
        """
        Unequip an item from a slot, returning it.
        """
        item = self.slots[slot]
        self.slots[slot] = None
        return item
        
    def get_total_stats(self) -> EquipmentStats:
        """
        Calculate total stats from all equipped items.
        """
        total = EquipmentStats()
        for item in self.slots.values():
            if item:
                total = total + item.stats
        return total
        
    def get_equipped_items(self) -> list[Equipment]:
        """
        Get list of all equipped items.
        """
        return [item for item in self.slots.values() if item]
        
    def describe_equipment(self) -> list[str]:
        """
        Get description of all equipped items.
        """
        descriptions = []
        for slot, item in self.slots.items():
            if item:
                descriptions.append(f"{slot.value.title()}: {item}")
            else:
                descriptions.append(f"{slot.value.title()}: Empty")
        return descriptions
"""
Status effects system for The Shadowed Keep.
Implements various debuffs and buffs that can affect players and monsters.
"""
from enum import Enum
from typing import Optional, List, Dict
from abc import ABC, abstractmethod


class StatusEffectType(Enum):
    """Types of status effects."""
    POISON = "poison"
    STUN = "stun"
    WEAKNESS = "weakness"
    REGENERATION = "regeneration"
    STRENGTH = "strength"
    SHIELD = "shield"


class StatusEffect(ABC):
    """Base class for all status effects."""
    
    def __init__(self, duration: int, potency: int = 1):
        self.duration = duration
        self.potency = potency
        self.effect_type = StatusEffectType.POISON  # Override in subclasses
        
    @abstractmethod
    def apply_effect(self, target) -> List[str]:
        """Apply the effect to the target. Returns messages."""
        pass
        
    @abstractmethod
    def on_turn_end(self, target) -> List[str]:
        """Called at the end of each turn. Returns messages."""
        pass
        
    def tick(self) -> bool:
        """Reduce duration. Returns True if effect expired."""
        self.duration -= 1
        return self.duration <= 0
        
    def get_description(self) -> str:
        """Get a description of the effect."""
        return f"{self.effect_type.value.capitalize()} ({self.duration} turns)"


class PoisonEffect(StatusEffect):
    """Poison deals damage over time."""
    
    def __init__(self, duration: int = 3, potency: int = 2):
        super().__init__(duration, potency)
        self.effect_type = StatusEffectType.POISON
        
    def apply_effect(self, target) -> List[str]:
        """Initial application of poison."""
        return [f"{target.name} is poisoned!"]
        
    def on_turn_end(self, target) -> List[str]:
        """Deal poison damage."""
        damage = self.potency
        target.take_damage(damage)
        messages = [f"{target.name} takes {damage} poison damage!"]
        
        if self.tick():
            messages.append(f"{target.name} is no longer poisoned.")
            
        return messages


class StunEffect(StatusEffect):
    """Stun prevents actions for a turn."""
    
    def __init__(self, duration: int = 1):
        super().__init__(duration, potency=1)
        self.effect_type = StatusEffectType.STUN
        
    def apply_effect(self, target) -> List[str]:
        """Apply stun effect."""
        return [f"{target.name} is stunned!"]
        
    def on_turn_end(self, target) -> List[str]:
        """Check if stun wears off."""
        messages = []
        if self.tick():
            messages.append(f"{target.name} recovers from stun!")
        return messages


class WeaknessEffect(StatusEffect):
    """Weakness reduces attack power."""
    
    def __init__(self, duration: int = 3, potency: int = 50):
        super().__init__(duration, potency)
        self.effect_type = StatusEffectType.WEAKNESS
        self.original_attack = None
        
    def apply_effect(self, target) -> List[str]:
        """Reduce target's attack power."""
        if self.original_attack is None:
            # Handle players differently (they have base_attack_power)
            if hasattr(target, 'base_attack_power'):
                self.original_attack = target.base_attack_power
                reduction_percent = self.potency / 100
                new_attack = int(target.base_attack_power * (1 - reduction_percent))
                target.base_attack_power = max(1, new_attack)
            else:
                # For monsters, modify attack_power directly
                self.original_attack = target.attack_power
                reduction_percent = self.potency / 100
                new_attack = int(target.attack_power * (1 - reduction_percent))
                target.attack_power = max(1, new_attack)
        return [f"{target.name} is weakened! Attack reduced by {self.potency}%"]
        
    def on_turn_end(self, target) -> List[str]:
        """Check if weakness wears off."""
        messages = []
        if self.tick():
            # Restore original attack power
            if self.original_attack is not None:
                if hasattr(target, 'base_attack_power'):
                    target.base_attack_power = self.original_attack
                else:
                    target.attack_power = self.original_attack
            messages.append(f"{target.name}'s strength returns!")
        return messages


class RegenerationEffect(StatusEffect):
    """Regeneration heals over time."""
    
    def __init__(self, duration: int = 5, potency: int = 2):
        super().__init__(duration, potency)
        self.effect_type = StatusEffectType.REGENERATION
        
    def apply_effect(self, target) -> List[str]:
        """Apply regeneration."""
        return [f"{target.name} begins regenerating!"]
        
    def on_turn_end(self, target) -> List[str]:
        """Heal the target."""
        messages = []
        if hasattr(target, 'max_hp'):
            old_hp = target.hp
            target.hp = min(target.max_hp, target.hp + self.potency)
            actual_heal = target.hp - old_hp
            if actual_heal > 0:
                messages.append(f"{target.name} regenerates {actual_heal} HP!")
                
        if self.tick():
            messages.append(f"{target.name}'s regeneration fades.")
            
        return messages


class StrengthEffect(StatusEffect):
    """Strength increases attack power."""
    
    def __init__(self, duration: int = 3, potency: int = 50):
        super().__init__(duration, potency)
        self.effect_type = StatusEffectType.STRENGTH
        self.original_attack = None
        
    def apply_effect(self, target) -> List[str]:
        """Increase target's attack power."""
        if self.original_attack is None:
            # Handle players differently (they have base_attack_power)
            if hasattr(target, 'base_attack_power'):
                self.original_attack = target.base_attack_power
                boost_percent = self.potency / 100
                target.base_attack_power = int(target.base_attack_power * (1 + boost_percent))
            else:
                # For monsters, modify attack_power directly
                self.original_attack = target.attack_power
                boost_percent = self.potency / 100
                target.attack_power = int(target.attack_power * (1 + boost_percent))
        return [f"{target.name} feels stronger! Attack increased by {self.potency}%"]
        
    def on_turn_end(self, target) -> List[str]:
        """Check if strength wears off."""
        messages = []
        if self.tick():
            # Restore original attack power
            if self.original_attack is not None:
                if hasattr(target, 'base_attack_power'):
                    target.base_attack_power = self.original_attack
                else:
                    target.attack_power = self.original_attack
            messages.append(f"{target.name}'s strength boost fades.")
        return messages


class ShieldEffect(StatusEffect):
    """Shield absorbs incoming damage."""
    
    def __init__(self, duration: int = 2, potency: int = 5):
        super().__init__(duration, potency)
        self.effect_type = StatusEffectType.SHIELD
        self.shield_hp = potency
        
    def apply_effect(self, target) -> List[str]:
        """Apply shield."""
        return [f"{target.name} gains a {self.shield_hp} HP shield!"]
        
    def absorb_damage(self, damage: int) -> int:
        """Absorb damage with the shield. Returns remaining damage."""
        if self.shield_hp <= 0:
            return damage
            
        absorbed = min(damage, self.shield_hp)
        self.shield_hp -= absorbed
        remaining = damage - absorbed
        
        return remaining
        
    def on_turn_end(self, target) -> List[str]:
        """Check if shield expires."""
        messages = []
        if self.tick() or self.shield_hp <= 0:
            messages.append(f"{target.name}'s shield dissipates.")
        return messages


class StatusEffectManager:
    """Manages status effects for an entity."""
    
    def __init__(self):
        self.effects: Dict[StatusEffectType, StatusEffect] = {}
        
    def add_effect(self, effect: StatusEffect, target) -> List[str]:
        """Add a status effect. If already exists, refresh duration."""
        messages = []
        
        if effect.effect_type in self.effects:
            # Refresh duration
            existing = self.effects[effect.effect_type]
            existing.duration = max(existing.duration, effect.duration)
            messages.append(f"{effect.effect_type.value.capitalize()} effect refreshed!")
        else:
            # Apply new effect
            self.effects[effect.effect_type] = effect
            messages.extend(effect.apply_effect(target))
            
        return messages
        
    def remove_effect(self, effect_type: StatusEffectType) -> None:
        """Remove a status effect."""
        if effect_type in self.effects:
            del self.effects[effect_type]
            
    def has_effect(self, effect_type: StatusEffectType) -> bool:
        """Check if entity has a specific effect."""
        return effect_type in self.effects
        
    def is_stunned(self) -> bool:
        """Check if entity is stunned."""
        return self.has_effect(StatusEffectType.STUN)
        
    def get_shield(self) -> Optional[ShieldEffect]:
        """Get active shield effect if any."""
        effect = self.effects.get(StatusEffectType.SHIELD)
        if isinstance(effect, ShieldEffect):
            return effect
        return None
        
    def process_turn_end(self, target) -> List[str]:
        """Process all effects at turn end."""
        messages = []
        expired_effects = []
        
        for effect_type, effect in self.effects.items():
            # Process effect
            effect_messages = effect.on_turn_end(target)
            messages.extend(effect_messages)
            
            # Check if expired
            if effect.duration <= 0:
                expired_effects.append(effect_type)
                
        # Remove expired effects
        for effect_type in expired_effects:
            self.remove_effect(effect_type)
            
        return messages
        
    def get_status_descriptions(self) -> List[str]:
        """Get descriptions of all active effects."""
        return [effect.get_description() for effect in self.effects.values()]
        
    def clear_all_effects(self) -> None:
        """Remove all status effects."""
        self.effects.clear()
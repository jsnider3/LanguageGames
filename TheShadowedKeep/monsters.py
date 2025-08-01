"""
Monster classes for The Shadowed Keep.
Each monster has unique abilities and behaviors.
"""
import random
from constants import (
    GOBLIN_GOLD_MIN, GOBLIN_GOLD_MAX,
    ORC_GOLD_MIN, ORC_GOLD_MAX,
    SLIME_GOLD_MIN, SLIME_GOLD_MAX,
    SKELETON_ARCHER_GOLD_MIN, SKELETON_ARCHER_GOLD_MAX,
    BANDIT_GOLD_MIN, BANDIT_GOLD_MAX,
    TROLL_GOLD_MIN, TROLL_GOLD_MAX,
    MIMIC_GOLD_MIN, MIMIC_GOLD_MAX,
    TROLL_REGENERATION
)
from status_effects import StatusEffectManager


class Monster:
    """
    A base class for all monsters.
    """
    def __init__(self, name, hp, attack_power, gold_reward, xp_reward=None):
        self.name = name
        self.hp = hp
        self.max_hp = hp  # Store max HP for effects
        self.attack_power = attack_power
        self.gold_reward = gold_reward
        # XP reward defaults to monster's max HP if not specified
        self.xp_reward = xp_reward if xp_reward is not None else hp
        self.status_effects = StatusEffectManager()

    def is_alive(self):
        return self.hp > 0

    def take_damage(self, damage):
        self.hp -= damage
        if self.hp < 0:
            self.hp = 0


class Goblin(Monster):
    """A weak but common monster."""
    def __init__(self):
        super().__init__(name="Goblin", hp=8, attack_power=3, gold_reward=random.randint(GOBLIN_GOLD_MIN, GOBLIN_GOLD_MAX))


class Orc(Monster):
    """A tougher monster."""
    def __init__(self):
        super().__init__(name="Orc", hp=15, attack_power=6, gold_reward=random.randint(ORC_GOLD_MIN, ORC_GOLD_MAX))


class Slime(Monster):
    """A gelatinous creature that splits when killed."""
    def __init__(self, is_mini=False):
        if is_mini:
            super().__init__(name="Mini Slime", hp=3, attack_power=2, gold_reward=1, xp_reward=2)
        else:
            super().__init__(name="Slime", hp=6, attack_power=3, gold_reward=random.randint(SLIME_GOLD_MIN, SLIME_GOLD_MAX), xp_reward=4)
        self.is_mini = is_mini
        self.will_split = not is_mini  # Only regular slimes split


class SkeletonArcher(Monster):
    """A ranged attacker that must be closed in on."""
    def __init__(self):
        super().__init__(name="Skeleton Archer", hp=10, attack_power=7, gold_reward=random.randint(SKELETON_ARCHER_GOLD_MIN, SKELETON_ARCHER_GOLD_MAX), xp_reward=12)
        self.is_ranged = True


class Bandit(Monster):
    """A thief that can steal gold on hit."""
    def __init__(self):
        super().__init__(name="Bandit", hp=12, attack_power=5, gold_reward=random.randint(BANDIT_GOLD_MIN, BANDIT_GOLD_MAX), xp_reward=10)
        self.can_steal = True


class Troll(Monster):
    """A regenerating monster that heals each turn."""
    def __init__(self):
        super().__init__(name="Troll", hp=20, attack_power=8, gold_reward=random.randint(TROLL_GOLD_MIN, TROLL_GOLD_MAX), xp_reward=25)
        self.regeneration = TROLL_REGENERATION
        self.max_hp = 20
        
    def regenerate(self):
        """Heal the troll, but not above max HP."""
        if self.is_alive() and self.hp < self.max_hp:
            self.hp = min(self.hp + self.regeneration, self.max_hp)
            return True
        return False


class Mimic(Monster):
    """A monster disguised as a treasure chest."""
    def __init__(self):
        super().__init__(name="Mimic", hp=18, attack_power=7, gold_reward=random.randint(MIMIC_GOLD_MIN, MIMIC_GOLD_MAX), xp_reward=20)
        self.is_disguised = True


# BOSS MONSTERS - Powerful enemies with unique mechanics

class BossMonster(Monster):
    """Base class for boss monsters with special abilities."""
    def __init__(self, name, hp, attack_power, gold_reward, xp_reward):
        super().__init__(name, hp, attack_power, gold_reward, xp_reward)
        self.is_boss = True
        self.phase = 1
        self.max_phases = 1
        self.special_abilities = []
        self.ability_cooldowns = {}
        
    def can_use_ability(self, ability_name: str) -> bool:
        """Check if boss can use a specific ability."""
        return self.ability_cooldowns.get(ability_name, 0) <= 0
        
    def use_ability(self, ability_name: str, cooldown: int):
        """Use an ability and set its cooldown."""
        self.ability_cooldowns[ability_name] = cooldown
        
    def tick_cooldowns(self):
        """Reduce all ability cooldowns by 1."""
        for ability in self.ability_cooldowns:
            if self.ability_cooldowns[ability] > 0:
                self.ability_cooldowns[ability] -= 1
                
    def check_phase_transition(self) -> bool:
        """Check if boss should transition to next phase."""
        if self.phase < self.max_phases:
            health_percentage = self.hp / self.max_hp
            phase_threshold = (self.max_phases - self.phase) / self.max_phases
            if health_percentage <= phase_threshold:
                self.phase += 1
                return True
        return False


class GoblinKing(BossMonster):
    """The Goblin King - Summons minions and grows stronger as minions die."""
    def __init__(self):
        super().__init__(
            name="Goblin King", 
            hp=45, 
            attack_power=10, 
            gold_reward=100, 
            xp_reward=50
        )
        self.minions_summoned = 0
        self.max_minions = 2
        self.enraged = False
        
    def summon_minion(self):
        """Summon a goblin minion."""
        if self.minions_summoned < self.max_minions and self.can_use_ability("summon"):
            self.use_ability("summon", 3)  # 3 turn cooldown
            self.minions_summoned += 1
            return Goblin()
        return None
        
    def on_minion_death(self):
        """Called when a minion dies - king grows stronger."""
        self.attack_power += 2
        if not self.enraged and self.minions_summoned >= self.max_minions:
            self.enraged = True
            self.attack_power += 5
            

class OrcWarlord(BossMonster):
    """The Orc Warlord - Multi-phase boss with berserker rage."""
    def __init__(self):
        super().__init__(
            name="Orc Warlord", 
            hp=60, 
            attack_power=12, 
            gold_reward=150, 
            xp_reward=75
        )
        self.max_phases = 2
        self.berserker_mode = False
        
    def enter_berserker_mode(self):
        """Enter berserker mode in phase 2."""
        if self.phase >= 2 and not self.berserker_mode:
            self.berserker_mode = True
            self.attack_power += 8
            return True
        return False
        
    def whirlwind_attack(self):
        """Powerful AoE attack with cooldown."""
        if self.can_use_ability("whirlwind"):
            self.use_ability("whirlwind", 4)
            return True
        return False


class SkeletonLord(BossMonster):
    """The Skeleton Lord - Necromancer boss that resurrects and casts spells."""
    def __init__(self):
        super().__init__(
            name="Skeleton Lord", 
            hp=50, 
            attack_power=8, 
            gold_reward=120, 
            xp_reward=60
        )
        self.resurrection_count = 0
        self.max_resurrections = 1
        self.spell_power = 15
        
    def bone_spear(self):
        """Magical ranged attack."""
        if self.can_use_ability("bone_spear"):
            self.use_ability("bone_spear", 2)
            return self.spell_power
        return 0
        
    def resurrect(self):
        """Resurrect with reduced health."""
        if self.resurrection_count < self.max_resurrections and not self.is_alive():
            self.resurrection_count += 1
            self.hp = self.max_hp // 3  # Resurrect with 1/3 health
            return True
        return False
        
    def life_drain(self, damage_dealt):
        """Heal based on damage dealt."""
        if self.can_use_ability("life_drain"):
            self.use_ability("life_drain", 5)
            heal_amount = damage_dealt // 2
            self.hp = min(self.max_hp, self.hp + heal_amount)
            return heal_amount
        return 0


class TrollChieftain(BossMonster):
    """The Troll Chieftain - Massive regenerating boss with area attacks."""
    def __init__(self):
        super().__init__(
            name="Troll Chieftain", 
            hp=80, 
            attack_power=14, 
            gold_reward=200, 
            xp_reward=100
        )
        self.regeneration = 5
        self.max_phases = 2
        
    def enhanced_regeneration(self):
        """Stronger regeneration in phase 2."""
        regen_amount = self.regeneration
        if self.phase >= 2:
            regen_amount *= 2
            
        if self.is_alive() and self.hp < self.max_hp:
            old_hp = self.hp
            self.hp = min(self.hp + regen_amount, self.max_hp)
            return self.hp - old_hp
        return 0
        
    def ground_slam(self):
        """Devastating area attack."""
        if self.can_use_ability("ground_slam"):
            self.use_ability("ground_slam", 3)
            return self.attack_power * 1.5
        return 0
        
    def intimidate(self):
        """Chance to stun the player."""
        if self.can_use_ability("intimidate"):
            self.use_ability("intimidate", 4)
            return random.random() < 0.6  # 60% chance to stun


class ShadowLord(BossMonster):
    """The Shadow Lord - Final boss with multiple phases and dark magic."""
    def __init__(self):
        super().__init__(
            name="Shadow Lord", 
            hp=100, 
            attack_power=16, 
            gold_reward=500, 
            xp_reward=200
        )
        self.max_phases = 3
        self.shadow_form = False
        self.dodge_chance = 0.2  # 20% base dodge chance
        
    def enter_shadow_form(self):
        """Become harder to hit in phase 2+."""
        if self.phase >= 2 and not self.shadow_form:
            self.shadow_form = True
            self.dodge_chance = 0.4  # 40% dodge chance
            return True
        return False
        
    def shadow_bolt(self):
        """Dark magic attack."""
        if self.can_use_ability("shadow_bolt"):
            self.use_ability("shadow_bolt", 2)
            return self.attack_power + 10
        return 0
        
    def darkness_aura(self):
        """Debuff player's accuracy and damage."""
        if self.can_use_ability("darkness"):
            self.use_ability("darkness", 6)
            return True
        return False
        
    def final_form(self):
        """Ultimate transformation in phase 3."""
        if self.phase >= 3:
            self.attack_power = max(self.attack_power, 25)
            self.dodge_chance = 0.5  # 50% dodge chance
            return True
        return False


class Spider(Monster):
    """A venomous spider that can poison the player."""
    def __init__(self):
        super().__init__(name="Spider", hp=8, attack_power=4, gold_reward=random.randint(3, 7), xp_reward=8)
        self.can_poison = True
        self.poison_chance = 0.3  # 30% chance to poison on hit
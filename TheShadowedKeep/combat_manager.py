import random
from enum import Enum
from typing import Optional, Tuple
from constants import (
    CRITICAL_HIT_CHANCE, CRITICAL_HIT_MULTIPLIER,
    DEFEND_DAMAGE_REDUCTION, DODGE_SUCCESS_CHANCE, DODGE_COOLDOWN,
    PARRY_SUCCESS_CHANCE, PARRY_COOLDOWN, PARRY_COUNTER_DAMAGE,
    RUN_PARTING_SHOT_CHANCE, SKELETON_ARCHER_DAMAGE_BONUS,
    BANDIT_STEAL_CHANCE, BANDIT_STEAL_RANGE, MAGE_SPELL_POWER_MULTIPLIER,
    MAGE_SPELL_COST
)
from status_effects import PoisonEffect, StunEffect, WeaknessEffect
from consumables import ConsumableType
from combat_messages import combat_messages
from combat_log import combat_log


class CombatState(Enum):
    """Represents the current state of combat."""
    ONGOING = "ongoing"
    PLAYER_VICTORY = "player_victory"
    PLAYER_DEFEAT = "player_defeat"
    PLAYER_FLED = "player_fled"


class CombatAction(Enum):
    """Available combat actions."""
    ATTACK = "attack"
    DEFEND = "defend"
    DODGE = "dodge"
    PARRY = "parry"
    RUN = "run"
    USE_ITEM = "use_item"
    SPECIAL = "special"
    SPELL = "spell"  # For mage spell power


class CombatResult:
    """Encapsulates the result of a combat action."""
    def __init__(self, damage_dealt: int = 0, damage_taken: int = 0,
                 messages: list = None, state_change: Optional[CombatState] = None):
        self.damage_dealt = damage_dealt
        self.damage_taken = damage_taken
        self.messages = messages or []
        self.state_change = state_change


class CombatManager:
    """Manages all combat logic and state."""

    def __init__(self):
        self.player = None
        self.enemy = None
        self.combat_state = None
        self.turn_count = 0
        self.player_defending = False
        self.player_dodging = False
        self.parry_ready = False
        self.dodge_cooldown = 0
        self.parry_cooldown = 0
        self.critical_hit_chance = CRITICAL_HIT_CHANCE
        self.critical_hit_multiplier = CRITICAL_HIT_MULTIPLIER
        self.spell_powered = False  # Track if next attack is spell-powered

    def start_combat(self, player, enemy):
        """Initialize a new combat encounter."""
        self.player = player
        self.enemy = enemy
        self.combat_state = CombatState.ONGOING
        self.turn_count = 0
        self.player_defending = False
        self.player_dodging = False
        self.parry_ready = False
        self.dodge_cooldown = 0
        self.parry_cooldown = 0

        # Apply class combat modifiers
        if hasattr(player, 'character_class'):
            player.character_class.apply_combat_modifiers(self)
            player.character_class.on_combat_start(player, enemy)

        # Start combat log
        combat_log.start_combat()
        combat_log.add_entry(f"A wild {enemy.name} with {enemy.hp} HP appears!", "system")

        return [f"A wild {enemy.name} with {enemy.hp} HP appears!"]

    def get_available_actions(self) -> list[CombatAction]:
        """Return list of available combat actions."""
        actions = [CombatAction.ATTACK, CombatAction.DEFEND, CombatAction.RUN]

        # Add dodge if not on cooldown
        if self.dodge_cooldown == 0:
            actions.insert(2, CombatAction.DODGE)

        # Add parry if not on cooldown
        if self.parry_cooldown == 0:
            actions.insert(2, CombatAction.PARRY)

        # Add spell for mages with enough mana
        if (
hasattr(self.player, 'character_class') and
            hasattr(self.player.character_class, 'current_mana') and
            self.player.character_class.current_mana >= MAGE_SPELL_COST):
            actions.insert(1, CombatAction.SPELL)

        # Future: Add USE_ITEM when inventory system exists
        return actions

    def execute_action(self, action: CombatAction, item_type=None) -> CombatResult:
        """Execute a combat action and return the result."""
        if self.combat_state != CombatState.ONGOING:
            return CombatResult(messages=["Combat has ended."])

        # Check if player is stunned
        if self.player.status_effects.is_stunned():
            result = CombatResult(messages=["You are stunned and cannot act!"])
            self._enemy_turn(result)
            self._process_turn_end_effects(result)
            return result

        self.turn_count += 1
        combat_log.new_turn()

        # Reset defensive states
        self.player_defending = False
        self.player_dodging = False
        
        # Reduce cooldowns
        if self.dodge_cooldown > 0:
            self.dodge_cooldown -= 1
        if self.parry_cooldown > 0:
            self.parry_cooldown -= 1
        
        # Execute player action
        result = self._execute_player_action(action, item_type)

        # If player fled, combat ends here
        if self.combat_state == CombatState.PLAYER_FLED:
            return result

        # Check for player victory after their action
        if self._check_player_victory(result):
            self._process_turn_end_effects(result)
            return result

        # Enemy's turn (if they are alive and not stunned)
        if self.enemy.is_alive():
            self._enemy_turn(result)

        # Process status effects at turn end
        self._process_turn_end_effects(result)

        return result

    def _execute_player_action(self, action: CombatAction, item_type: Optional[ConsumableType]) -> CombatResult:
        """Executes the player's chosen action and returns the initial result."""
        action_map = {
            CombatAction.ATTACK: self._handle_attack,
            CombatAction.DEFEND: self._handle_defend,
            CombatAction.DODGE: self._handle_dodge,
            CombatAction.PARRY: self._handle_parry,
            CombatAction.RUN: self._handle_run,
            CombatAction.SPELL: self._handle_spell,
            CombatAction.USE_ITEM: lambda: self._handle_use_item(item_type)
        }

        handler = action_map.get(action)
        if handler:
            return handler()
        return CombatResult(messages=["Invalid action."])

    def _check_player_victory(self, result: CombatResult) -> bool:
        """Checks for enemy defeat, updates result, and returns True if combat is over."""
        if not self.enemy.is_alive():
            victory_context = {"enemy": f"the {self.enemy.name}"}
            result.messages.append(combat_messages.get_message("victory", victory_context))
            result.messages.append(combat_messages.get_message("death", {"enemy_type": self.enemy.name}))

            if hasattr(self.enemy, 'will_split') and self.enemy.will_split:
                result.messages.append(f"The {self.enemy.name} splits into two smaller slimes!")
                result.messages.append("You'll need to fight them separately.")

            result.messages.append(f"You find {self.enemy.gold_reward} gold.")
            self.player.gold += self.enemy.gold_reward
            result.messages.append(f"Total gold: {self.player.gold}")

            leveled_up = self.player.gain_xp(self.enemy.xp_reward)
            result.messages.append(f"You gain {self.enemy.xp_reward} XP!")
            if leveled_up:
                result.messages.append(f"🎉 LEVEL UP! You are now level {self.player.level}! 🎉")
                result.messages.append(f"Max HP: {self.player.max_hp} | Attack: {self.player.attack_power}")
                result.messages.append("You have been fully healed!")
            else:
                result.messages.append(f"Progress to next level: {self.player.xp}/{self.player.xp_to_next_level}")

            result.state_change = CombatState.PLAYER_VICTORY
            self.combat_state = CombatState.PLAYER_VICTORY
            return True
        return False

    def _check_player_defeat(self, result: CombatResult) -> bool:
        """Checks for player defeat, updates result, and returns True if combat is over."""
        if not self.player.is_alive():
            result.messages.append("\nYou have been defeated. Your adventure ends here.")
            result.state_change = CombatState.PLAYER_DEFEAT
            self.combat_state = CombatState.PLAYER_DEFEAT
            return True
        return False

    def _enemy_turn(self, result: CombatResult):
        """Handles the enemy's turn."""
        if self.enemy.status_effects.is_stunned():
            result.messages.append(f"The {self.enemy.name} is stunned and cannot act!")
            return

        # Check if player successfully dodged or parried
        if self.player_dodging:
            self.player_dodging = False  # Reset for next turn
            return  # Enemy misses due to dodge
        
        if self.parry_ready:
            self.parry_ready = False  # Reset for next turn
            return  # Enemy's attack was parried

        # Handle troll regeneration before attacking
        if hasattr(self.enemy, 'regenerate') and self.enemy.regenerate():
            result.messages.append(f"The {self.enemy.name} regenerates {self.enemy.regeneration} HP! "
                                    f"(Now at {self.enemy.hp} HP)")

        enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)

        # Apply special modifiers
        if hasattr(self.enemy, 'is_ranged') and self.enemy.is_ranged:
            enemy_damage = int(enemy_damage * SKELETON_ARCHER_DAMAGE_BONUS)
        if self.player_defending:
            enemy_damage = max(1, int(enemy_damage * DEFEND_DAMAGE_REDUCTION))

        actual_damage = self.player.take_damage(enemy_damage)
        result.damage_taken += actual_damage

        # Handle on-hit effects
        if actual_damage > 0:
            if hasattr(self.enemy, 'can_steal') and self.enemy.can_steal and self.player.gold > 0 and random.random() < BANDIT_STEAL_CHANCE:
                stolen = min(self.player.gold, random.randint(*BANDIT_STEAL_RANGE))
                self.player.gold -= stolen
                result.messages.append(f"The {self.enemy.name} picks your pocket and steals {stolen} gold!")
            if hasattr(self.enemy, 'can_poison') and self.enemy.can_poison and random.random() < self.enemy.poison_chance:
                result.messages.extend(self.player.status_effects.add_effect(PoisonEffect(duration=3, potency=2), self.player))

        # Format attack message
        context = {"enemy": f"The {self.enemy.name}", "damage": actual_damage, "damage_percent": actual_damage / self.player.max_hp}
        attack_msg = combat_messages.get_message('enemy_attack', context)
        if enemy_crit:
            attack_msg = f"CRITICAL HIT! {attack_msg}"
        result.messages.append(attack_msg)

        if actual_damage < enemy_damage:
            result.messages.append(f"Your armor absorbed {enemy_damage - actual_damage} damage!")
        result.messages.append(f"You have {self.player.hp} HP left.")

        self._check_player_defeat(result)

    def _handle_attack(self) -> CombatResult:
        """Handle player attack action."""
        result = CombatResult()
        combat_log.add_action("Attack", "You")

        base_damage = self.player.attack_power
        if self.spell_powered:
            base_damage = int(base_damage * MAGE_SPELL_POWER_MULTIPLIER)
            self.spell_powered = False
        if hasattr(self.player, 'character_class'):
            base_damage = self.player.character_class.on_attack(self.player, self.enemy, base_damage)

        damage, is_critical = self._calculate_damage(base_damage)
        self.enemy.take_damage(damage)
        result.damage_dealt = damage

        context = {"enemy": f"the {self.enemy.name}", "damage": damage, "damage_percent": damage / (self.enemy.hp + damage) if (self.enemy.hp + damage) > 0 else 1.0}
        if is_critical:
            result.messages.append(combat_messages.get_message("critical_hit", context))
            combat_log.add_damage("You", f"the {self.enemy.name}", damage, critical=True)
        else:
            result.messages.append(combat_messages.get_message("player_attack", context))
            combat_log.add_damage("You", f"the {self.enemy.name}", damage)

        return result

    def _handle_defend(self) -> CombatResult:
        """Handle player defend action."""
        self.player_defending = True
        return CombatResult(messages=[combat_messages.get_message("defend", {})])

    def _handle_dodge(self) -> CombatResult:
        """Handle player dodge action."""
        result = CombatResult()
        self.dodge_cooldown = DODGE_COOLDOWN
        result.messages.append("You prepare to dodge the next attack!")

        dodge_chance = DODGE_SUCCESS_CHANCE
        if hasattr(self.player, 'character_class') and hasattr(self.player.character_class, 'dodge_chance_modifier'):
            dodge_chance += self.player.character_class.dodge_chance_modifier

        if random.random() < dodge_chance:
            result.messages.append(combat_messages.get_message("dodge_success", {"enemy": f"the {self.enemy.name}"}))
            self.player_dodging = True  # Set flag for successful dodge
        else:
            result.messages.append(combat_messages.get_message("dodge_fail", {"enemy": f"The {self.enemy.name}"}))
            # Failed dodge, enemy turn will handle damage
            self.player_defending = False # Explicitly not defending
        return result

    def _handle_parry(self) -> CombatResult:
        """Handle player parry action."""
        result = CombatResult()
        self.parry_cooldown = PARRY_COOLDOWN
        result.messages.append("You ready yourself to parry the next attack!")

        parry_chance = PARRY_SUCCESS_CHANCE
        if hasattr(self.player, 'character_class') and hasattr(self.player.character_class, 'parry_chance_modifier'):
            parry_chance += self.player.character_class.parry_chance_modifier

        if random.random() < parry_chance:
            result.messages.append(combat_messages.get_message("parry_success", {"enemy": f"the {self.enemy.name}"}))
            counter_damage, _ = self._calculate_damage(int(self.player.attack_power * PARRY_COUNTER_DAMAGE), can_crit=False)
            self.enemy.take_damage(counter_damage)
            result.damage_dealt = counter_damage
            result.messages.append(f"You counter with a quick strike for {counter_damage} damage!")
            self.parry_ready = True  # Set flag for successful parry
        else:
            result.messages.append(combat_messages.get_message("parry_fail", {"enemy": f"The {self.enemy.name}"}))
            # Failed parry, enemy turn will handle damage
            self.player_defending = False
        return result

    def _handle_run(self) -> CombatResult:
        """Handle player run action."""
        result = CombatResult(messages=["You flee from the battle."])
        if random.random() < RUN_PARTING_SHOT_CHANCE:
            enemy_damage, _ = self._calculate_damage(self.enemy.attack_power)
            actual_damage = self.player.take_damage(enemy_damage)
            result.damage_taken = actual_damage
            result.messages.append(f"The {self.enemy.name} gets a parting shot in for {actual_damage} damage! You have {self.player.hp} HP left.")
            if self._check_player_defeat(result):
                return result

        result.state_change = CombatState.PLAYER_FLED
        self.combat_state = CombatState.PLAYER_FLED
        return result

    def _calculate_damage(self, base_damage: int, can_crit: bool = True) -> Tuple[int, bool]:
        """Calculate damage with potential modifiers."""
        is_critical = can_crit and random.random() < self.critical_hit_chance
        damage = int(base_damage * self.critical_hit_multiplier) if is_critical else base_damage
        return damage, is_critical

    def _handle_spell(self) -> CombatResult:
        """Handle mage spell power action."""
        if hasattr(self.player, 'character_class') and hasattr(self.player.character_class, 'spend_mana'):
            if self.player.character_class.spend_mana(MAGE_SPELL_COST):
                self.spell_powered = True
                return CombatResult(messages=["You channel arcane power into your next attack!", "Your next attack will deal +50% damage."])
            else:
                return CombatResult(messages=["Not enough mana!"])
        return CombatResult(messages=["You cannot cast spells!"])

    def _handle_use_item(self, item_type: ConsumableType) -> CombatResult:
        """Handle using an item in combat."""
        item = self.player.inventory.remove_item(item_type)
        if not item:
            return CombatResult(messages=["You don't have that item!"])

        can_use, reason = item.can_use(self.player, in_combat=True)
        if not can_use:
            self.player.inventory.add_item(item)
            return CombatResult(messages=[f"Can't use {item.name}: {reason}"])

        result = CombatResult(messages=item.use(self.player, target=self.enemy))
        if hasattr(self, 'game') and hasattr(self.game, 'achievement_manager'):
            self.game.achievement_manager.check_item_use(item_type)

        if item_type == ConsumableType.SMOKE_BOMB:
            result.state_change = CombatState.PLAYER_FLED
            self.combat_state = CombatState.PLAYER_FLED
        return result

    def is_combat_active(self) -> bool:
        """Check if combat is still ongoing."""
        return self.combat_state == CombatState.ONGOING

    def _process_turn_end_effects(self, result: CombatResult) -> None:
        """Process status effects at end of turn."""
        if self.combat_state != CombatState.ONGOING:
            return

        player_messages = self.player.status_effects.process_turn_end(self.player)
        if player_messages:
            result.messages.append("--- Status Effects ---")
            result.messages.extend(player_messages)
        if self._check_player_defeat(result): return

        enemy_messages = self.enemy.status_effects.process_turn_end(self.enemy)
        if enemy_messages:
            result.messages.extend(enemy_messages)
        if self._check_player_victory(result): return

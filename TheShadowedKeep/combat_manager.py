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
        if (hasattr(self.player, 'character_class') and 
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
            # Enemy still gets to attack
            enemy_result = self._enemy_attack()
            result.messages.extend(enemy_result.messages)
            result.damage_taken = enemy_result.damage_taken
            result.state_change = enemy_result.state_change
            # Process status effects at turn end
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
        
        # Execute the chosen action
        if action == CombatAction.ATTACK:
            result = self._handle_attack()
        elif action == CombatAction.DEFEND:
            result = self._handle_defend()
        elif action == CombatAction.DODGE:
            result = self._handle_dodge()
        elif action == CombatAction.PARRY:
            result = self._handle_parry()
        elif action == CombatAction.RUN:
            result = self._handle_run()
        elif action == CombatAction.SPELL:
            result = self._handle_spell()
        elif action == CombatAction.USE_ITEM and item_type is not None:
            result = self._handle_use_item(item_type)
        else:
            result = CombatResult(messages=["Invalid action."])
            
        # Process status effects at turn end
        if self.combat_state == CombatState.ONGOING:
            self._process_turn_end_effects(result)
            
        return result
            
    def _handle_attack(self) -> CombatResult:
        """Handle player attack action."""
        result = CombatResult()
        combat_log.add_action("Attack", "You")
        
        # Player attacks
        base_damage = self.player.attack_power
        
        # Apply spell power if active
        if self.spell_powered:
            base_damage = int(base_damage * MAGE_SPELL_POWER_MULTIPLIER)
            self.spell_powered = False
        
        # Apply class-specific attack modifiers
        if hasattr(self.player, 'character_class'):
            base_damage = self.player.character_class.on_attack(self.player, self.enemy, base_damage)
            
        damage, is_critical = self._calculate_damage(base_damage)
        self.enemy.take_damage(damage)
        result.damage_dealt = damage
        
        # Use varied combat messages
        context = {
            "enemy": f"the {self.enemy.name}",
            "damage": damage,
            "damage_percent": damage / (self.enemy.hp + damage) if (self.enemy.hp + damage) > 0 else 1.0
        }
        
        if is_critical:
            message = combat_messages.get_message("critical_hit", context)
            combat_log.add_damage("You", f"the {self.enemy.name}", damage, critical=True)
        else:
            message = combat_messages.get_message("player_attack", context)
            combat_log.add_damage("You", f"the {self.enemy.name}", damage)
        result.messages.append(message)
        
        # Check if enemy defeated
        if not self.enemy.is_alive():
            victory_context = {"enemy": f"the {self.enemy.name}"}
            victory_msg = combat_messages.get_message("victory", victory_context)
            result.messages.append(victory_msg)
            
            # Add death flavor message
            death_context = {"enemy_type": self.enemy.name}
            death_msg = combat_messages.get_message("death", death_context)
            result.messages.append(death_msg)
            
            # Handle slime splitting
            if hasattr(self.enemy, 'will_split') and self.enemy.will_split:
                result.messages.append(f"The {self.enemy.name} splits into two smaller slimes!")
                result.messages.append("You'll need to fight them separately.")
                # Note: Actual split handling would be in the game loop
            
            result.messages.append(f"You find {self.enemy.gold_reward} gold.")
            self.player.gold += self.enemy.gold_reward
            result.messages.append(f"Total gold: {self.player.gold}")
            
            # Award XP
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
            return result
            
        # Handle troll regeneration before counterattack
        if hasattr(self.enemy, 'regenerate'):
            if self.enemy.regenerate():
                result.messages.append(f"The {self.enemy.name} regenerates {self.enemy.regeneration} HP! "
                                    f"(Now at {self.enemy.hp} HP)")
        
        # Enemy counterattack
        enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
        
        # Handle skeleton archer ranged bonus
        if hasattr(self.enemy, 'is_ranged') and self.enemy.is_ranged:
            enemy_damage = int(enemy_damage * SKELETON_ARCHER_DAMAGE_BONUS)
            
        actual_damage = self.player.take_damage(enemy_damage)
        result.damage_taken = actual_damage
        
        # Handle bandit stealing
        if hasattr(self.enemy, 'can_steal') and self.enemy.can_steal and actual_damage > 0:
            if self.player.gold > 0 and random.random() < BANDIT_STEAL_CHANCE:
                stolen = min(self.player.gold, random.randint(*BANDIT_STEAL_RANGE))
                self.player.gold -= stolen
                result.messages.append(f"The {self.enemy.name} picks your pocket and steals {stolen} gold!")
                
        # Handle spider poison
        if hasattr(self.enemy, 'can_poison') and self.enemy.can_poison and actual_damage > 0:
            if random.random() < self.enemy.poison_chance:
                poison_messages = self.player.status_effects.add_effect(
                    PoisonEffect(duration=3, potency=2), self.player
                )
                result.messages.extend(poison_messages)
        
        # Use varied enemy attack messages
        enemy_context = {
            "enemy": f"The {self.enemy.name}",
            "damage": actual_damage,
            "damage_percent": actual_damage / self.player.max_hp if self.player.max_hp > 0 else 0.5
        }
        
        if enemy_crit:
            attack_msg = f"CRITICAL HIT! {combat_messages.get_message('enemy_attack', enemy_context)}"
        else:
            attack_msg = combat_messages.get_message("enemy_attack", enemy_context)
            
        result.messages.append(attack_msg)
        
        # Add armor absorption info if relevant
        if actual_damage < enemy_damage:
            result.messages.append(f"Your armor absorbed {enemy_damage - actual_damage} damage!")
            
        result.messages.append(f"You have {self.player.hp} HP left.")
        
        # Check if player defeated
        if not self.player.is_alive():
            result.messages.append("\nYou have been defeated. Your adventure ends here.")
            result.state_change = CombatState.PLAYER_DEFEAT
            self.combat_state = CombatState.PLAYER_DEFEAT
            
        return result
        
    def _handle_defend(self) -> CombatResult:
        """Handle player defend action."""
        result = CombatResult()
        self.player_defending = True
        
        # Use varied defend message
        defend_msg = combat_messages.get_message("defend", {})
        result.messages.append(defend_msg)
        
        # Enemy attacks with reduced effectiveness
        enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
        reduced_damage = max(1, int(enemy_damage * DEFEND_DAMAGE_REDUCTION))
        actual_damage = self.player.take_damage(reduced_damage)
        result.damage_taken = actual_damage
        
        if actual_damage < reduced_damage:
            result.messages.append(
                f"The {self.enemy.name} attacks you for {actual_damage} damage "
                f"(defended to {reduced_damage} from {enemy_damage}, "
                f"armor absorbed {reduced_damage - actual_damage}). "
                f"You have {self.player.hp} HP left."
            )
        else:
            result.messages.append(
                f"The {self.enemy.name} attacks you for {actual_damage} damage "
                f"(reduced from {enemy_damage}). "
                f"You have {self.player.hp} HP left."
            )
        
        # Check if player defeated
        if not self.player.is_alive():
            result.messages.append("\nYou have been defeated. Your adventure ends here.")
            result.state_change = CombatState.PLAYER_DEFEAT
            self.combat_state = CombatState.PLAYER_DEFEAT
            
        return result
        
    def _handle_dodge(self) -> CombatResult:
        """Handle player dodge action."""
        result = CombatResult()
        self.player_dodging = True
        self.dodge_cooldown = DODGE_COOLDOWN
        
        result.messages.append("You prepare to dodge the next attack!")
        
        # Calculate dodge chance (base 75% + class bonus)
        dodge_chance = DODGE_SUCCESS_CHANCE
        if hasattr(self.player, 'character_class') and hasattr(self.player.character_class, 'dodge_chance_modifier'):
            dodge_chance += self.player.character_class.dodge_chance_modifier
            
        # Enemy attacks but might miss
        if random.random() < dodge_chance:
            dodge_context = {"enemy": f"the {self.enemy.name}"}
            dodge_msg = combat_messages.get_message("dodge_success", dodge_context)
            result.messages.append(dodge_msg)
            result.damage_taken = 0
        else:
            # Failed dodge, take full damage
            enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
            actual_damage = self.player.take_damage(enemy_damage)
            result.damage_taken = actual_damage
            
            # Failed dodge message
            dodge_fail_context = {"enemy": f"The {self.enemy.name}"}
            dodge_fail_msg = combat_messages.get_message("dodge_fail", dodge_fail_context)
            result.messages.append(dodge_fail_msg)
            result.messages.append(f"You take {actual_damage} damage!")
            
            if actual_damage < enemy_damage:
                result.messages.append(f"Your armor absorbed {enemy_damage - actual_damage} damage.")
                
            result.messages.append(f"You have {self.player.hp} HP left.")
            
            # Check if player defeated
            if not self.player.is_alive():
                result.messages.append("\nYou have been defeated. Your adventure ends here.")
                result.state_change = CombatState.PLAYER_DEFEAT
                self.combat_state = CombatState.PLAYER_DEFEAT
                
        return result
        
    def _handle_parry(self) -> CombatResult:
        """Handle player parry action."""
        result = CombatResult()
        self.parry_ready = True
        self.parry_cooldown = PARRY_COOLDOWN
        
        result.messages.append("You ready yourself to parry the next attack!")
        
        # Enemy attacks
        enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
        
        # Calculate parry chance (base 50% + class bonus)
        parry_chance = PARRY_SUCCESS_CHANCE
        if hasattr(self.player, 'character_class') and hasattr(self.player.character_class, 'parry_chance_modifier'):
            parry_chance += self.player.character_class.parry_chance_modifier
            
        if random.random() < parry_chance:
            # Successful parry - no damage and counterattack
            parry_context = {"enemy": f"the {self.enemy.name}"}
            parry_msg = combat_messages.get_message("parry_success", parry_context)
            result.messages.append(parry_msg)
            
            # Counterattack for half damage (no crits on counterattacks)
            counter_damage, _ = self._calculate_damage(int(self.player.attack_power * PARRY_COUNTER_DAMAGE), can_crit=False)
            self.enemy.take_damage(counter_damage)
            result.damage_dealt = counter_damage
            result.messages.append(
                f"You counter with a quick strike for {counter_damage} damage!"
            )
            
            # Check if enemy defeated
            if not self.enemy.is_alive():
                result.messages.append(f"You have defeated the {self.enemy.name}!")
                result.messages.append(f"You find {self.enemy.gold_reward} gold.")
                self.player.gold += self.enemy.gold_reward
                result.messages.append(f"Total gold: {self.player.gold}")
                
                # Award XP
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
        else:
            # Failed parry, take full damage
            actual_damage = self.player.take_damage(enemy_damage)
            result.damage_taken = actual_damage
            
            # Failed parry message
            parry_fail_context = {"enemy": f"The {self.enemy.name}"}
            parry_fail_msg = combat_messages.get_message("parry_fail", parry_fail_context)
            result.messages.append(parry_fail_msg)
            result.messages.append(f"You take {actual_damage} damage!")
            
            if actual_damage < enemy_damage:
                result.messages.append(f"Your armor absorbed {enemy_damage - actual_damage} damage.")
                
            result.messages.append(f"You have {self.player.hp} HP left.")
            
            # Check if player defeated
            if not self.player.is_alive():
                result.messages.append("\nYou have been defeated. Your adventure ends here.")
                result.state_change = CombatState.PLAYER_DEFEAT
                self.combat_state = CombatState.PLAYER_DEFEAT
                
        return result
        
    def _handle_run(self) -> CombatResult:
        """Handle player run action."""
        result = CombatResult()
        
        result.messages.append("You flee from the battle.")
        
        # 25% chance of parting shot
        if random.random() < RUN_PARTING_SHOT_CHANCE:
            enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
            actual_damage = self.player.take_damage(enemy_damage)
            result.damage_taken = actual_damage
            
            if actual_damage < enemy_damage:
                result.messages.append(
                    f"The {self.enemy.name} gets a parting shot in for {actual_damage} damage "
                    f"({enemy_damage - actual_damage} absorbed by armor)! "
                    f"You have {self.player.hp} HP left."
                )
            else:
                result.messages.append(
                    f"The {self.enemy.name} gets a parting shot in for {actual_damage} damage! "
                    f"You have {self.player.hp} HP left."
                )
            
            # Check if player defeated
            if not self.player.is_alive():
                result.messages.append("\nYou have been defeated. Your adventure ends here.")
                result.state_change = CombatState.PLAYER_DEFEAT
                self.combat_state = CombatState.PLAYER_DEFEAT
                return result
                
        result.state_change = CombatState.PLAYER_FLED
        self.combat_state = CombatState.PLAYER_FLED
        return result
        
    def _calculate_damage(self, base_damage: int, can_crit: bool = True) -> Tuple[int, bool]:
        """
        Calculate damage with potential modifiers.
        Returns tuple of (damage, was_critical)
        """
        damage = base_damage
        is_critical = False
        
        # Check for critical hit
        if can_crit and random.random() < self.critical_hit_chance:
            damage = int(damage * self.critical_hit_multiplier)
            is_critical = True
            
        return damage, is_critical
        
    def _handle_spell(self) -> CombatResult:
        """Handle mage spell power action."""
        result = CombatResult()
        
        # Check if player has mana system (should always be true if action is available)
        if (hasattr(self.player, 'character_class') and 
            hasattr(self.player.character_class, 'spend_mana')):
            
            if self.player.character_class.spend_mana(MAGE_SPELL_COST):
                self.spell_powered = True
                result.messages.append("You channel arcane power into your next attack!")
                result.messages.append("Your next attack will deal +50% damage.")
                
                # Enemy still gets to attack
                enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
                actual_damage = self.player.take_damage(enemy_damage)
                result.damage_taken = actual_damage
                
                crit_text = "CRITICAL HIT! " if enemy_crit else ""
                if actual_damage < enemy_damage:
                    result.messages.append(
                        f"{crit_text}The {self.enemy.name} attacks you for {actual_damage} damage "
                        f"({enemy_damage - actual_damage} absorbed by armor). "
                        f"You have {self.player.hp} HP left."
                    )
                else:
                    result.messages.append(
                        f"{crit_text}The {self.enemy.name} attacks you for {actual_damage} damage. "
                        f"You have {self.player.hp} HP left."
                    )
                
                # Check if player defeated
                if not self.player.is_alive():
                    result.messages.append("\\nYou have been defeated. Your adventure ends here.")
                    result.state_change = CombatState.PLAYER_DEFEAT
                    self.combat_state = CombatState.PLAYER_DEFEAT
            else:
                result.messages.append("Not enough mana!")
        else:
            result.messages.append("You cannot cast spells!")
            
        return result
        
    def _handle_use_item(self, item_type: ConsumableType) -> CombatResult:
        """Handle using an item in combat."""
        result = CombatResult()
        
        # Get the item from inventory
        item = self.player.inventory.remove_item(item_type)
        if not item:
            result.messages.append("You don't have that item!")
            return result
            
        # Check if item can be used in combat
        can_use, reason = item.can_use(self.player, in_combat=True)
        if not can_use:
            # Put it back if can't use
            self.player.inventory.add_item(item)
            result.messages.append(f"Can't use {item.name}: {reason}")
            return result
            
        # Use the item
        use_messages = item.use(self.player, target=self.enemy)
        result.messages.extend(use_messages)
        
        # Track item usage for achievements if we have access to game
        if hasattr(self, 'game') and hasattr(self.game, 'achievement_manager'):
            self.game.achievement_manager.check_item_use(item_type)
        
        # Special handling for escape items
        if item_type == ConsumableType.SMOKE_BOMB:
            result.state_change = CombatState.PLAYER_FLED
            self.combat_state = CombatState.PLAYER_FLED
            return result
            
        # Check if enemy was defeated by item
        if not self.enemy.is_alive():
            result.messages.append(f"You have defeated the {self.enemy.name}!")
            result.messages.append(f"You find {self.enemy.gold_reward} gold.")
            self.player.gold += self.enemy.gold_reward
            result.messages.append(f"Total gold: {self.player.gold}")
            
            # Award XP
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
            return result
            
        # Enemy gets to attack after item use
        enemy_result = self._enemy_attack()
        result.messages.extend(enemy_result.messages)
        result.damage_taken = enemy_result.damage_taken
        result.state_change = enemy_result.state_change
        
        return result
        
    def is_combat_active(self) -> bool:
        """Check if combat is still ongoing."""
        return self.combat_state == CombatState.ONGOING
        
    def _process_turn_end_effects(self, result: CombatResult) -> None:
        """Process status effects at end of turn."""
        # Process player status effects
        player_messages = self.player.status_effects.process_turn_end(self.player)
        if player_messages:
            result.messages.append("--- Status Effects ---")
            result.messages.extend(player_messages)
            
        # Process enemy status effects
        enemy_messages = self.enemy.status_effects.process_turn_end(self.enemy)
        if enemy_messages:
            result.messages.extend(enemy_messages)
            
        # Check if anyone died from status effects
        if not self.player.is_alive():
            result.messages.append("\nYou have been defeated by status effects!")
            result.state_change = CombatState.PLAYER_DEFEAT
            self.combat_state = CombatState.PLAYER_DEFEAT
        elif not self.enemy.is_alive():
            result.messages.append(f"\nThe {self.enemy.name} succumbs to status effects!")
            result.state_change = CombatState.PLAYER_VICTORY
            self.combat_state = CombatState.PLAYER_VICTORY
            
    def _enemy_attack(self) -> CombatResult:
        """Handle enemy attack when player is stunned or for other effects."""
        result = CombatResult()
        
        # Check if enemy is stunned
        if self.enemy.status_effects.is_stunned():
            result.messages.append(f"The {self.enemy.name} is stunned and cannot act!")
            return result
            
        # Normal enemy attack logic (extracted from _handle_attack)
        enemy_damage, enemy_crit = self._calculate_damage(self.enemy.attack_power)
        
        # Handle skeleton archer ranged bonus
        if hasattr(self.enemy, 'is_ranged') and self.enemy.is_ranged:
            enemy_damage = int(enemy_damage * SKELETON_ARCHER_DAMAGE_BONUS)
            
        actual_damage = self.player.take_damage(enemy_damage)
        result.damage_taken = actual_damage
        
        # Handle special enemy abilities
        if hasattr(self.enemy, 'can_steal') and self.enemy.can_steal and actual_damage > 0:
            if self.player.gold > 0 and random.random() < BANDIT_STEAL_CHANCE:
                stolen = min(self.player.gold, random.randint(*BANDIT_STEAL_RANGE))
                self.player.gold -= stolen
                result.messages.append(f"The {self.enemy.name} picks your pocket and steals {stolen} gold!")
                
        # Handle spider poison
        if hasattr(self.enemy, 'can_poison') and self.enemy.can_poison and actual_damage > 0:
            if random.random() < self.enemy.poison_chance:
                poison_messages = self.player.status_effects.add_effect(
                    PoisonEffect(duration=3, potency=2), self.player
                )
                result.messages.extend(poison_messages)
        
        # Use varied enemy attack messages
        enemy_context = {
            "enemy": f"The {self.enemy.name}",
            "damage": actual_damage,
            "damage_percent": actual_damage / self.player.max_hp if self.player.max_hp > 0 else 0.5
        }
        
        if enemy_crit:
            attack_msg = f"CRITICAL HIT! {combat_messages.get_message('enemy_attack', enemy_context)}"
        else:
            attack_msg = combat_messages.get_message("enemy_attack", enemy_context)
            
        result.messages.append(attack_msg)
        
        # Add armor absorption info if relevant
        if actual_damage < enemy_damage:
            result.messages.append(f"Your armor absorbed {enemy_damage - actual_damage} damage!")
            
        result.messages.append(f"You have {self.player.hp} HP left.")
        
        # Check if player defeated
        if not self.player.is_alive():
            result.messages.append("\nYou have been defeated. Your adventure ends here.")
            result.state_change = CombatState.PLAYER_DEFEAT
            
        return result
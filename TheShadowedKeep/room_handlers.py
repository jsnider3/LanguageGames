"""
Room handlers for different room types in The Shadowed Keep.
"""
import time
import random
from typing import Optional
from visual_effects import visual_fx, Colors, ASCIIArt
from tutorial_system import tutorial_manager
from combat_log import combat_log
from room_content import (RoomContent, RoomContentType, MonsterRoom, TreasureRoom, 
                         EquipmentRoom, MerchantRoom, HealingFountainRoom, TrapRoom,
                         StairsRoom, BossRoom, PuzzleRoom, SecretRoomContent)
from combat_manager import CombatManager, CombatAction, CombatState
from constants import MIMIC_FAKE_GOLD_MIN, MIMIC_FAKE_GOLD_MAX


class RoomHandler:
    """Handles different room types and their interactions."""
    
    def __init__(self, game):
        self.game = game
        self.combat_manager = CombatManager()
        self.combat_manager.game = game  # Pass game reference for achievements
        
    def handle_room(self, room_content: RoomContent) -> bool:
        """
        Handle a room based on its content type.
        Returns True if player survives the room, False otherwise.
        """
        if isinstance(room_content, MonsterRoom):
            # Special handling for mimics
            if hasattr(room_content.monster, 'is_disguised') and room_content.monster.is_disguised:
                return self._handle_mimic_room(room_content)
            else:
                return self._handle_monster_room(room_content)
        elif isinstance(room_content, TreasureRoom):
            return self._handle_treasure_room(room_content)
        elif isinstance(room_content, EquipmentRoom):
            return self._handle_equipment_room(room_content)
        elif isinstance(room_content, MerchantRoom):
            return self._handle_merchant_room(room_content)
        elif isinstance(room_content, HealingFountainRoom):
            return self._handle_healing_fountain_room(room_content)
        elif isinstance(room_content, TrapRoom):
            return self._handle_trap_room(room_content)
        elif isinstance(room_content, StairsRoom):
            return self._handle_stairs_room(room_content)
        elif isinstance(room_content, BossRoom):
            return self._handle_boss_room(room_content)
        elif isinstance(room_content, PuzzleRoom):
            return self._handle_puzzle_room(room_content)
        elif isinstance(room_content, SecretRoomContent):
            return self._handle_secret_room(room_content)
        else:
            # Empty room or other types
            return self._handle_empty_room(room_content)
            
    def _handle_monster_room(self, room_content: MonsterRoom) -> bool:
        """Handle a room containing a monster."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_WHITE)
            
        # Show monster ASCII art
        if not room_content.defeated:
            monster_art = ASCIIArt.get_monster_art(room_content.monster.name)
            visual_fx.print_ascii_art(monster_art, Colors.BRIGHT_RED, center=False)
            visual_fx.print_colored(f"⚔️ A {room_content.monster.name} blocks your path! ⚔️", Colors.BRIGHT_RED, bold=True)
            
        if not room_content.defeated:
            self.combat_manager.start_combat(self.game.player, room_content.monster)
            
            # Show combat tutorial if this is the first combat
            if tutorial_manager.should_show_tutorial("combat_start"):
                step = tutorial_manager.get_current_step()
                if step:
                    print()  # Add spacing
                    for line in tutorial_manager.format_tutorial_message(step):
                        print(line)
                    tutorial_manager.advance_tutorial("combat")
            
            while self.combat_manager.combat_state == CombatState.ONGOING:
                # Show enhanced combat status with visual effects
                visual_fx.print_colored("\n⚔️ === COMBAT === ⚔️", Colors.BRIGHT_CYAN, bold=True)
                
                # Player health bar
                player_hp_bar = visual_fx.health_bar(self.game.player.hp, self.game.player.max_hp)
                visual_fx.print_colored(f"Your HP: {player_hp_bar}", Colors.WHITE)
                
                # Enemy health bar
                enemy_hp_bar = visual_fx.health_bar(room_content.monster.hp, room_content.monster.max_hp)
                visual_fx.print_colored(f"{room_content.monster.name} HP: {enemy_hp_bar}", Colors.WHITE)
                
                # Mage mana display with bar
                if (hasattr(self.game.player, 'character_class') and 
                    hasattr(self.game.player.character_class, 'current_mana')):
                    mana_bar = visual_fx.mana_bar(self.game.player.character_class.current_mana,
                                                self.game.player.character_class.max_mana)
                    visual_fx.print_colored(f"🔮 Mana: {mana_bar}", Colors.BRIGHT_BLUE)
                
                # Display status effects with colors
                player_effects = self.game.player.status_effects.get_status_descriptions()
                if player_effects:
                    visual_fx.print_colored(f"🔥 Your effects: {', '.join(player_effects)}", Colors.BRIGHT_GREEN)
                    
                enemy_effects = room_content.monster.status_effects.get_status_descriptions()
                if enemy_effects:
                    visual_fx.print_colored(f"💀 Enemy effects: {', '.join(enemy_effects)}", Colors.BRIGHT_MAGENTA)
                
                # Get available actions
                available_actions = self.combat_manager.get_available_actions()
                action_names = {
                    CombatAction.ATTACK: "attack (a)",
                    CombatAction.DEFEND: "defend (d)",
                    CombatAction.DODGE: "dodge",
                    CombatAction.PARRY: "parry",
                    CombatAction.RUN: "run (r)",
                    CombatAction.SPELL: "spell (s)"
                }
                
                visual_fx.print_colored("Available actions: " + ", ".join(action_names[a] for a in available_actions), Colors.BRIGHT_YELLOW)
                
                # Show usable items with icons
                usable_items = []
                for item_type, count in self.game.player.inventory.get_all_items():
                    # Check if any item can be used in combat
                    if count > 0:
                        items = self.game.player.inventory.items[item_type]
                        if items and items[0].can_use(self.game.player, in_combat=True)[0]:
                            usable_items.append((item_type, items[0].name))
                
                if usable_items:
                    visual_fx.print_colored("🎒 Items: " + ", ".join(f"use {name.lower()}" for _, name in usable_items), Colors.BRIGHT_GREEN)
                
                # Get player choice
                while True:
                    try:
                        from input_handler import input_handler
                        choice = input_handler.get_input_with_arrows("> ").strip().lower()
                    except KeyboardInterrupt:
                        choice = "run"
                    except Exception:
                        choice = input("> ").strip().lower()
                    
                    # Check for item use
                    if choice.startswith("use "):
                        item_name = choice[4:].strip()
                        # Find matching item
                        item_type_to_use = None
                        for item_type, name in usable_items:
                            if name.lower() == item_name or name.lower().startswith(item_name):
                                item_type_to_use = item_type
                                break
                        
                        if item_type_to_use:
                            action = CombatAction.USE_ITEM
                            break
                        else:
                            print("You don't have that item or it can't be used now.")
                            continue
                    
                    # Map shortcuts
                    action_map = {
                        'a': CombatAction.ATTACK, 'attack': CombatAction.ATTACK,
                        'd': CombatAction.DEFEND, 'defend': CombatAction.DEFEND,
                        'dodge': CombatAction.DODGE,
                        'parry': CombatAction.PARRY,
                        'r': CombatAction.RUN, 'run': CombatAction.RUN,
                        's': CombatAction.SPELL, 'spell': CombatAction.SPELL
                    }
                    
                    if choice in action_map and action_map[choice] in available_actions:
                        action = action_map[choice]
                        item_type_to_use = None
                        break
                    else:
                        print("Invalid action. Try again.")
                
                # Execute action
                if action == CombatAction.USE_ITEM:
                    result = self.combat_manager.execute_action(action, item_type_to_use)
                else:
                    result = self.combat_manager.execute_action(action)
                
                # Display messages
                for message in result.messages:
                    print(message)
                    time.sleep(0.5)
                    
                # Show compact combat log every few turns
                if self.combat_manager.turn_count % 3 == 0:
                    print()  # Add spacing
                    combat_log_lines = combat_log.display_inline()
                    for line in combat_log_lines:
                        visual_fx.print_colored(line, Colors.BRIGHT_BLACK)
                
                # Check combat state
                if self.combat_manager.combat_state == CombatState.PLAYER_VICTORY:
                    # Record victory for adaptive difficulty
                    self.game.adaptive_difficulty.record_combat_result(
                        victory=True, 
                        player_hp_remaining=self.game.player.hp,
                        player_max_hp=self.game.player.max_hp
                    )
                    
                    # Check if slime should split
                    if hasattr(room_content.monster, 'will_split') and room_content.monster.will_split:
                        # Create two mini slimes to fight sequentially
                        from monsters import Slime
                        visual_fx.print_colored("\n💧 The slime splits apart! 💧", Colors.BRIGHT_BLUE, bold=True)
                        
                        # Store that we need to fight 2 mini slimes
                        if not hasattr(room_content, 'mini_slimes_remaining'):
                            room_content.mini_slimes_remaining = 2
                            room_content.original_slime_defeated = True
                        
                        # Create and fight the next mini slime
                        mini_slime = Slime(is_mini=True)
                        room_content.mini_slimes_remaining -= 1
                        
                        if room_content.mini_slimes_remaining == 1:
                            visual_fx.print_colored(f"\nThe first {mini_slime.name} emerges from the puddle!", Colors.BRIGHT_YELLOW)
                        else:
                            visual_fx.print_colored(f"\nThe second {mini_slime.name} emerges!", Colors.BRIGHT_YELLOW)
                        
                        room_content.monster = mini_slime
                        
                        # Continue combat with the mini slime
                        time.sleep(1)
                        self.combat_manager.start_combat(self.game.player, mini_slime)
                        continue  # Continue the combat loop
                        
                    # Check if we just defeated a mini slime and there are more to fight
                    elif hasattr(room_content, 'mini_slimes_remaining') and room_content.mini_slimes_remaining > 0:
                        visual_fx.print_colored(f"\n✨ One mini slime down, {room_content.mini_slimes_remaining} to go! ✨", Colors.BRIGHT_CYAN)
                        
                        # Create the next mini slime
                        from monsters import Slime
                        mini_slime = Slime(is_mini=True)
                        room_content.mini_slimes_remaining -= 1
                        
                        visual_fx.print_colored(f"\nThe next {mini_slime.name} attacks!", Colors.BRIGHT_YELLOW)
                        room_content.monster = mini_slime
                        
                        # Continue combat
                        time.sleep(1)
                        self.combat_manager.start_combat(self.game.player, mini_slime)
                        continue
                        
                    else:
                        # Normal victory - room is cleared
                        room_content.defeated = True
                        visual_fx.print_colored(f"\n🎉 Victory! You defeated the {room_content.monster.name}! 🎉", Colors.BRIGHT_GREEN, bold=True)
                    
                    # Check combat achievements
                    self.game.achievement_manager.check_combat_achievements(
                        self.game.player, room_content.monster, result
                    )
                    
                    # Check if player leveled up from combat manager's XP award
                    # The combat manager already handled XP and gold, we just need to show level up animation if it happened
                    for message in result.messages:
                        if "LEVEL UP" in message:
                            visual_fx.level_up_animation(self.game.player.level)
                            break
                    
                    # Show treasure animation for gold (already awarded by combat manager)
                    if room_content.monster.gold_reward > 0:
                        visual_fx.treasure_animation(room_content.monster.gold_reward)
                    
                    # Random item drop
                    if random.random() < 0.25:  # 25% drop chance
                        from consumables import (HealingPotion, Bread, Antidote, 
                                               ThrowingKnife, SmokeBomb)
                        
                        # Drop pool based on monster difficulty
                        if room_content.monster.max_hp <= 10:
                            drop_pool = [Bread, ThrowingKnife]
                        elif room_content.monster.max_hp <= 15:
                            drop_pool = [Bread, HealingPotion, ThrowingKnife, Antidote]
                        else:
                            drop_pool = [HealingPotion, Antidote, SmokeBomb]
                        
                        item_class = random.choice(drop_pool)
                        item = item_class()
                        
                        if self.game.player.inventory.add_item(item):
                            visual_fx.print_colored(f"💎 The {room_content.monster.name} dropped {item.name}!", Colors.BRIGHT_CYAN)
                        else:
                            visual_fx.print_colored(f"💎 The {room_content.monster.name} dropped {item.name}, but your inventory is full!", Colors.BRIGHT_RED)
                    
                    # Show achievement notifications
                    self._show_achievement_notifications()
                        
                elif self.combat_manager.combat_state == CombatState.PLAYER_DEFEAT:
                    # Record defeat for adaptive difficulty
                    self.game.adaptive_difficulty.record_combat_result(
                        victory=False,
                        player_hp_remaining=0,
                        player_max_hp=self.game.player.max_hp
                    )
                    return False
                elif self.combat_manager.combat_state == CombatState.PLAYER_FLED:
                    print("\nYou successfully fled from combat!")
                    
        return True
        
    def _handle_treasure_room(self, room_content: TreasureRoom) -> bool:
        """Handle a room containing treasure."""
        # Show treasure room art
        treasure_art = ASCIIArt.ROOMS["treasure"]
        visual_fx.print_ascii_art(treasure_art, Colors.BRIGHT_YELLOW, center=False)
        
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_YELLOW)
            
        messages = room_content.interact(self.game, "open chest")
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_CYAN)
        
        # Chance of bonus item in treasure chest
        if random.random() < 0.3:  # 30% chance
            from consumables import (HealingPotion, ManaPotion, StrengthPotion,
                                   DefensePotion, RegenerationPotion, Meat)
            
            # Better items in deeper levels
            if self.game.dungeon_level <= 2:
                item_pool = [HealingPotion, Meat]
            elif self.game.dungeon_level <= 4:
                item_pool = [HealingPotion, ManaPotion, StrengthPotion, Meat]
            else:
                item_pool = [StrengthPotion, DefensePotion, RegenerationPotion]
            
            item_class = random.choice(item_pool)
            item = item_class()
            
            if self.game.player.inventory.add_item(item):
                visual_fx.print_colored(f"✨ You also find {item.name} in the chest! ✨", Colors.BRIGHT_MAGENTA)
            else:
                visual_fx.print_colored(f"✨ You also find {item.name} in the chest, but your inventory is full! ✨", Colors.BRIGHT_RED)
            
        return True
        
    def _handle_empty_room(self, room_content) -> bool:
        """Handle an empty room."""
        # Show empty room art
        empty_art = ASCIIArt.ROOMS["empty"]
        visual_fx.print_ascii_art(empty_art, Colors.BRIGHT_BLACK, center=False)
        
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.WHITE)
        return True
        
    def _handle_mimic_room(self, room_content: MonsterRoom) -> bool:
        """Handles a mimic encounter (disguised as treasure)."""
        mimic = room_content.monster
        
        # Show fake treasure art initially  
        treasure_art = ASCIIArt.ROOMS["treasure"]
        visual_fx.print_ascii_art(treasure_art, Colors.BRIGHT_YELLOW, center=False)
        
        # Initially appears as treasure
        fake_gold = random.randint(MIMIC_FAKE_GOLD_MIN, MIMIC_FAKE_GOLD_MAX) * self.game.dungeon_level
        visual_fx.print_colored(f"💰 You enter a room with a large, ornate chest. It appears to contain {fake_gold} gold! 💰", Colors.BRIGHT_YELLOW)
        visual_fx.print_colored("🤔 Do you want to open it? (yes/no)", Colors.BRIGHT_WHITE)
        
        while True:
            try:
                from input_handler import input_handler
                choice = input_handler.get_input_with_arrows("> ").strip().lower()
            except:
                choice = input("> ").strip().lower()
                
            if choice in ['yes', 'y']:
                visual_fx.print_colored("\n⚠️ As you reach for the chest, it suddenly springs to life!", Colors.BRIGHT_RED, bold=True)
                visual_fx.flash_effect("🧌 IT'S A MIMIC! 🧌", Colors.BRIGHT_RED, 3)
                
                # Show mimic art
                mimic_art = ASCIIArt.get_monster_art("mimic")
                visual_fx.print_ascii_art(mimic_art, Colors.BRIGHT_RED)
                
                time.sleep(1)
                # Mimic is no longer disguised
                mimic.is_disguised = False
                # Start combat with the mimic
                return self._handle_monster_room(room_content)
            elif choice in ['no', 'n']:
                visual_fx.print_colored("🧠 Something seems off about this chest. You wisely decide to leave it alone.", Colors.BRIGHT_GREEN)
                return True
            else:
                visual_fx.print_colored("Please answer 'yes' or 'no'.", Colors.BRIGHT_YELLOW)
                
    def _handle_equipment_room(self, room_content: EquipmentRoom) -> bool:
        """Handle a room containing equipment."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            print(msg)
            
        if not room_content.taken:
            equipment = room_content.equipment
            
            # Show comparison with current equipment
            current_equipment = self.game.player.equipment.slots[equipment.slot]
            if current_equipment:
                visual_fx.print_colored(f"\n📊 Equipment Comparison:", Colors.BRIGHT_CYAN)
                visual_fx.print_colored(f"Current: {current_equipment}", Colors.YELLOW)
                
                # Compare stats
                current_stats = current_equipment.stats
                new_stats = equipment.stats
                
                # Attack comparison
                if hasattr(current_stats, 'attack_bonus') and hasattr(new_stats, 'attack_bonus'):
                    diff = new_stats.attack_bonus - current_stats.attack_bonus
                    if diff > 0:
                        visual_fx.print_colored(f"New:     {equipment} (Attack: +{new_stats.attack_bonus} ↑ +{diff})", Colors.BRIGHT_GREEN)
                    elif diff < 0:
                        visual_fx.print_colored(f"New:     {equipment} (Attack: +{new_stats.attack_bonus} ↓ {diff})", Colors.BRIGHT_RED)
                    else:
                        visual_fx.print_colored(f"New:     {equipment} (Attack: +{new_stats.attack_bonus} =)", Colors.WHITE)
                
                # Defense comparison
                elif hasattr(current_stats, 'defense_bonus') and hasattr(new_stats, 'defense_bonus'):
                    diff = new_stats.defense_bonus - current_stats.defense_bonus
                    if diff > 0:
                        visual_fx.print_colored(f"New:     {equipment} (Defense: +{new_stats.defense_bonus} ↑ +{diff})", Colors.BRIGHT_GREEN)
                    elif diff < 0:
                        visual_fx.print_colored(f"New:     {equipment} (Defense: +{new_stats.defense_bonus} ↓ {diff})", Colors.BRIGHT_RED)
                    else:
                        visual_fx.print_colored(f"New:     {equipment} (Defense: +{new_stats.defense_bonus} =)", Colors.WHITE)
                
                # HP comparison (for accessories)
                elif hasattr(current_stats, 'hp_bonus') and hasattr(new_stats, 'hp_bonus'):
                    diff = new_stats.hp_bonus - current_stats.hp_bonus
                    if diff > 0:
                        visual_fx.print_colored(f"New:     {equipment} (HP: +{new_stats.hp_bonus} ↑ +{diff})", Colors.BRIGHT_GREEN)
                    elif diff < 0:
                        visual_fx.print_colored(f"New:     {equipment} (HP: +{new_stats.hp_bonus} ↓ {diff})", Colors.BRIGHT_RED)
                    else:
                        visual_fx.print_colored(f"New:     {equipment} (HP: +{new_stats.hp_bonus} =)", Colors.WHITE)
            else:
                visual_fx.print_colored(f"\n📊 You have no {equipment.slot.value} equipped.", Colors.BRIGHT_CYAN)
                
                # Show what the new equipment provides
                if hasattr(equipment.stats, 'attack_bonus'):
                    visual_fx.print_colored(f"New: {equipment} (Attack: +{equipment.stats.attack_bonus})", Colors.BRIGHT_GREEN)
                elif hasattr(equipment.stats, 'defense_bonus'):
                    visual_fx.print_colored(f"New: {equipment} (Defense: +{equipment.stats.defense_bonus})", Colors.BRIGHT_GREEN)
                elif hasattr(equipment.stats, 'hp_bonus'):
                    visual_fx.print_colored(f"New: {equipment} (HP: +{equipment.stats.hp_bonus})", Colors.BRIGHT_GREEN)
            
            print("\nDo you want to take it? (yes/no)")
            
            while True:
                try:
                    from input_handler import input_handler
                    choice = input_handler.get_input_with_arrows("> ").strip().lower()
                except:
                    choice = input("> ").strip().lower()
                if choice in ['yes', 'y']:
                    # Check if we already have this exact equipment
                    current_equipment = self.game.player.equipment.slots[equipment.slot]
                    
                    if current_equipment and str(current_equipment) == str(equipment):
                        visual_fx.print_colored(f"\nYou already have {equipment} equipped.", Colors.BRIGHT_YELLOW)
                        visual_fx.print_colored("There's no need to replace it with an identical item.", Colors.BRIGHT_WHITE)
                    else:
                        old_equipment = self.game.player.equipment.equip(equipment)
                        room_content.taken = True
                        
                        if old_equipment:
                            visual_fx.print_colored(f"\nYou unequip {old_equipment} and equip {equipment}.", Colors.BRIGHT_GREEN)
                            
                            # Drop the old equipment on the ground
                            # Replace the current room's content with the dropped equipment
                            current_room = self.game.dungeon_map.get_current_room()
                            from room_content import EquipmentRoom
                            dropped_equipment_room = EquipmentRoom(old_equipment)
                            dropped_equipment_room.explored = True  # Mark as explored since we're already here
                            current_room.content = dropped_equipment_room
                            
                            visual_fx.print_colored(f"💎 You drop {old_equipment} on the ground.", Colors.BRIGHT_YELLOW)
                            visual_fx.print_colored("(You can come back for it later)", Colors.BRIGHT_BLACK)
                        else:
                            visual_fx.print_colored(f"\nYou equip {equipment}.", Colors.BRIGHT_GREEN)
                        
                        # Update max HP if needed
                        self.game.player.update_max_hp()
                        
                        # Show new stats
                        visual_fx.print_colored(f"Attack Power: {self.game.player.attack_power}", Colors.BRIGHT_RED)
                        visual_fx.print_colored(f"Defense: {self.game.player.defense}", Colors.BRIGHT_BLUE)
                        visual_fx.print_colored(f"Max HP: {self.game.player.max_hp}", Colors.BRIGHT_CYAN)
                    break
                elif choice in ['no', 'n']:
                    print("You leave the equipment behind.")
                    break
                else:
                    print("Please answer 'yes' or 'no'.")
                    
        return True
        
    def _handle_merchant_room(self, room_content: MerchantRoom) -> bool:
        """Handle a merchant room."""
        # Show merchant room art
        merchant_art = ASCIIArt.ROOMS["merchant"]
        visual_fx.print_ascii_art(merchant_art, Colors.BRIGHT_CYAN, center=False)
        
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_CYAN)
            
        # Show any dropped equipment
        if hasattr(room_content, 'dropped_equipment') and room_content.dropped_equipment:
            visual_fx.print_colored("\n📦 Dropped equipment on the floor:", Colors.BRIGHT_YELLOW)
            for eq in room_content.dropped_equipment:
                visual_fx.print_colored(f"  • {eq}", Colors.YELLOW)
            
        # Show merchant tutorial if this is the first merchant
        if tutorial_manager.should_show_tutorial("merchant"):
            step = tutorial_manager.get_current_step()
            if step:
                print()  # Add spacing
                for line in tutorial_manager.format_tutorial_message(step):
                    print(line)
                tutorial_manager.advance_tutorial("merchant")
            
        while True:
            try:
                from input_handler import input_handler
                choice = input_handler.get_input_with_arrows("> ").strip().lower()
            except:
                choice = input("> ").strip().lower()
            
            if choice == "shop":
                messages = room_content.interact(self.game, "shop")
                for msg in messages:
                    print(msg)
            elif choice.startswith("pickup ") and hasattr(room_content, 'dropped_equipment') and room_content.dropped_equipment:
                # Handle picking up dropped equipment
                item_name = choice[7:].strip().lower()
                picked_up = False
                for i, eq in enumerate(room_content.dropped_equipment):
                    if eq.name.lower() == item_name or eq.name.lower().startswith(item_name):
                        # Pick up the equipment
                        old_equipment = self.game.player.equipment.equip(eq)
                        room_content.dropped_equipment.pop(i)
                        
                        if old_equipment:
                            # Drop the old equipment in its place
                            room_content.dropped_equipment.append(old_equipment)
                            visual_fx.print_colored(f"\nYou pick up {eq} and drop {old_equipment} in its place.", Colors.BRIGHT_GREEN)
                        else:
                            visual_fx.print_colored(f"\nYou pick up and equip {eq}.", Colors.BRIGHT_GREEN)
                        
                        self.game.player.update_max_hp()
                        picked_up = True
                        break
                
                if not picked_up:
                    visual_fx.print_colored(f"There's no '{item_name}' on the floor.", Colors.BRIGHT_RED)
            elif choice.startswith("buy"):
                messages = room_content.interact(self.game, choice)
                for msg in messages:
                    print(msg)
            elif choice in ["leave", "exit", "done"]:
                print("You bid farewell to the merchant.")
                break
            else:
                help_msg = "Type 'shop' to see wares, 'buy [item]' to purchase, or 'leave' to exit."
                if hasattr(room_content, 'dropped_equipment') and room_content.dropped_equipment:
                    help_msg += "\nType 'pickup [item]' to pick up dropped equipment."
                print(help_msg)
                
        return True
        
    def _handle_healing_fountain_room(self, room_content: HealingFountainRoom) -> bool:
        """Handle a healing fountain room."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            print(msg)
            
        if room_content.uses_remaining > 0:
            while True:
                try:
                    from input_handler import input_handler
                    choice = input_handler.get_input_with_arrows("> ").strip().lower()
                except:
                    choice = input("> ").strip().lower()
                
                if choice == "drink":
                    messages = room_content.interact(self.game, "drink")
                    for msg in messages:
                        print(msg)
                    break
                elif choice in ["leave", "skip", "no"]:
                    print("You decide to save the fountain for later.")
                    break
                else:
                    print("Type 'drink' to use the fountain or 'leave' to skip.")
                    
        return True
        
    def _handle_trap_room(self, room_content: TrapRoom) -> bool:
        """Handle a trap room."""
        # Trap triggers automatically on entry
        messages = room_content.on_enter(self.game)
        for msg in messages:
            print(msg)
            time.sleep(0.5)
            
        return self.game.player.is_alive()
        
    def _handle_stairs_room(self, room_content: StairsRoom) -> bool:
        """Handle the stairs room."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            print(msg)
            
        print("\nDescend to the next floor? (yes/no)")
        while True:
            try:
                from input_handler import input_handler
                choice = input_handler.get_input_with_arrows("> ").strip().lower()
            except:
                choice = input("> ").strip().lower()
            if choice in ['yes', 'y']:
                self.game.floor_number += 1
                self.game.dungeon_level = self.game.floor_number
                self.game._generate_new_floor()
                break
            elif choice in ['no', 'n']:
                print("You decide to explore more of this floor first.")
                break
            else:
                print("Please answer 'yes' or 'no'.")
                
        return True
        
    def _handle_boss_room(self, room_content: BossRoom) -> bool:
        """Handle a boss room with special mechanics."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_WHITE)
            
        if not room_content.defeated:
            # Epic boss entrance animation
            visual_fx.boss_entrance_animation(room_content.boss.name)
            # Boss combat with enhanced mechanics
            boss = room_content.boss
            self.combat_manager.start_combat(self.game.player, boss)
            
            while self.combat_manager.combat_state == CombatState.ONGOING:
                # Check for phase transitions
                if hasattr(boss, 'check_phase_transition') and boss.check_phase_transition():
                    print(f"\n🔥 PHASE TRANSITION! The {boss.name} enters Phase {boss.phase}! 🔥")
                    
                    # Handle specific boss phase changes
                    if hasattr(boss, 'enter_berserker_mode') and boss.enter_berserker_mode():
                        print(f"The {boss.name} enters a berserker rage! Attack power increased!")
                    if hasattr(boss, 'enter_shadow_form') and boss.enter_shadow_form():
                        print(f"The {boss.name} becomes wreathed in shadows! Harder to hit!")
                    if hasattr(boss, 'final_form') and boss.final_form():
                        print(f"The {boss.name} assumes its final form! Maximum power!")
                        
                # Show enhanced combat status for bosses with epic styling
                visual_fx.print_colored("\n🔥 === BOSS BATTLE === 🔥", Colors.BRIGHT_RED, bold=True)
                
                # Player health bar with color coding
                player_hp_bar = visual_fx.health_bar(self.game.player.hp, self.game.player.max_hp)
                visual_fx.print_colored(f"🛡️ Your HP: {player_hp_bar}", Colors.WHITE)
                
                # Boss health bar with dramatic styling
                boss_hp_bar = visual_fx.health_bar(boss.hp, boss.max_hp)
                visual_fx.print_colored(f"👹 {boss.name} HP: {boss_hp_bar}", Colors.BRIGHT_RED)
                
                # Show boss phase if applicable with dramatic effect
                if hasattr(boss, 'phase') and hasattr(boss, 'max_phases') and boss.max_phases > 1:
                    visual_fx.print_colored(f"💀 Boss Phase: {boss.phase}/{boss.max_phases} 💀", Colors.BRIGHT_MAGENTA, bold=True)
                
                # Mage mana display with enhanced styling
                if (hasattr(self.game.player, 'character_class') and 
                    hasattr(self.game.player.character_class, 'current_mana')):
                    mana_bar = visual_fx.mana_bar(self.game.player.character_class.current_mana,
                                                self.game.player.character_class.max_mana)
                    visual_fx.print_colored(f"🔮 Mana: {mana_bar}", Colors.BRIGHT_BLUE)
                
                # Display status effects with dramatic colors
                player_effects = self.game.player.status_effects.get_status_descriptions()
                if player_effects:
                    visual_fx.print_colored(f"✨ Your effects: {', '.join(player_effects)}", Colors.BRIGHT_GREEN)
                    
                boss_effects = boss.status_effects.get_status_descriptions()
                if boss_effects:
                    visual_fx.print_colored(f"🌟 Boss effects: {', '.join(boss_effects)}", Colors.BRIGHT_MAGENTA)
                
                # Get available actions
                available_actions = self.combat_manager.get_available_actions()
                action_names = {
                    CombatAction.ATTACK: "attack (a)",
                    CombatAction.DEFEND: "defend (d)",
                    CombatAction.DODGE: "dodge",
                    CombatAction.PARRY: "parry",
                    CombatAction.RUN: "run (r)",
                    CombatAction.SPELL: "spell (s)"
                }
                
                print("Available actions:", ", ".join(action_names[a] for a in available_actions))
                
                # Show usable items
                usable_items = []
                for item_type, count in self.game.player.inventory.get_all_items():
                    if count > 0:
                        items = self.game.player.inventory.items[item_type]
                        if items and items[0].can_use(self.game.player, in_combat=True)[0]:
                            usable_items.append((item_type, items[0].name))
                
                if usable_items:
                    print("Items:", ", ".join(f"use {name.lower()}" for _, name in usable_items))
                
                # Get player choice
                while True:
                    try:
                        from input_handler import input_handler
                        choice = input_handler.get_input_with_arrows("> ").strip().lower()
                    except KeyboardInterrupt:
                        choice = "run"
                    except Exception:
                        choice = input("> ").strip().lower()
                    
                    # Handle item use
                    if choice.startswith("use "):
                        item_name = choice[4:].strip()
                        item_type_to_use = None
                        for item_type, name in usable_items:
                            if name.lower() == item_name or name.lower().startswith(item_name):
                                item_type_to_use = item_type
                                break
                        
                        if item_type_to_use:
                            action = CombatAction.USE_ITEM
                            break
                        else:
                            print("You don't have that item or it can't be used now.")
                            continue
                    
                    # Map shortcuts
                    action_map = {
                        'a': CombatAction.ATTACK, 'attack': CombatAction.ATTACK,
                        'd': CombatAction.DEFEND, 'defend': CombatAction.DEFEND,
                        'dodge': CombatAction.DODGE,
                        'parry': CombatAction.PARRY,
                        'r': CombatAction.RUN, 'run': CombatAction.RUN,
                        's': CombatAction.SPELL, 'spell': CombatAction.SPELL
                    }
                    
                    if choice in action_map and action_map[choice] in available_actions:
                        action = action_map[choice]
                        item_type_to_use = None
                        break
                    else:
                        print("Invalid action. Try again.")
                
                # Execute action
                if action == CombatAction.USE_ITEM:
                    result = self.combat_manager.execute_action(action, item_type_to_use)
                else:
                    result = self.combat_manager.execute_action(action)
                
                # Display messages
                for message in result.messages:
                    print(message)
                    time.sleep(0.5)
                    
                # Show compact combat log every few turns
                if self.combat_manager.turn_count % 3 == 0:
                    print()  # Add spacing
                    combat_log_lines = combat_log.display_inline()
                    for line in combat_log_lines:
                        visual_fx.print_colored(line, Colors.BRIGHT_BLACK)
                
                # Handle boss-specific mechanics after player turn
                if boss.is_alive():
                    # Tick boss ability cooldowns
                    if hasattr(boss, 'tick_cooldowns'):
                        boss.tick_cooldowns()
                    
                    # Boss special abilities before their attack
                    boss_messages = self._handle_boss_special_abilities(boss)
                    for msg in boss_messages:
                        print(msg)
                        time.sleep(0.5)
                
                # Check combat state
                if self.combat_manager.combat_state == CombatState.PLAYER_VICTORY:
                    # Record boss victory for adaptive difficulty (worth more)
                    self.game.adaptive_difficulty.record_combat_result(
                        victory=True, 
                        player_hp_remaining=self.game.player.hp,
                        player_max_hp=self.game.player.max_hp
                    )
                    # Record it again since bosses are more significant
                    self.game.adaptive_difficulty.record_combat_result(
                        victory=True, 
                        player_hp_remaining=self.game.player.hp,
                        player_max_hp=self.game.player.max_hp
                    )
                    
                    room_content.defeated = True
                    visual_fx.print_colored(f"\n🏆 BOSS DEFEATED! 🏆", Colors.BRIGHT_YELLOW, bold=True)
                    visual_fx.print_colored(f"You have slain the mighty {boss.name}!", Colors.BRIGHT_GREEN, bold=True)
                    
                    # Combat manager already handled XP and gold, just check for level up animation
                    for message in result.messages:
                        if "LEVEL UP" in message:
                            visual_fx.level_up_animation(self.game.player.level)
                            break
                    
                    # Boss achievement
                    self.game.achievement_manager.tracker.check_achievement("boss_killer", True)
                    
                    # Boss-specific loot drops
                    self._handle_boss_loot_drop(boss)
                    
                    # Show achievement notifications
                    self._show_achievement_notifications()
                        
                elif self.combat_manager.combat_state == CombatState.PLAYER_DEFEAT:
                    # Handle boss resurrection
                    if hasattr(boss, 'resurrect') and boss.resurrect():
                        print(f"\n💀 The {boss.name} rises from death! 💀")
                        print(f"It resurrects with {boss.hp} HP!")
                        self.combat_manager.combat_state = CombatState.ONGOING
                        continue
                    else:
                        return False
                        
                elif self.combat_manager.combat_state == CombatState.PLAYER_FLED:
                    print(f"\nYou flee from the {boss.name}!")
                    print("The boss battle will resume if you return...")
                    
        return True
        
    def _handle_boss_special_abilities(self, boss) -> list:
        """Handle boss special abilities and return messages."""
        messages = []
        
        # Goblin King abilities
        if hasattr(boss, 'summon_minion'):
            minion = boss.summon_minion()
            if minion:
                messages.append(f"The {boss.name} summons a {minion.name}!")
                # Note: In a full implementation, you'd need to handle minion combat
                
        # Orc Warlord abilities
        if hasattr(boss, 'whirlwind_attack') and boss.whirlwind_attack():
            messages.append(f"The {boss.name} performs a devastating whirlwind attack!")
            
        # Skeleton Lord abilities
        if hasattr(boss, 'bone_spear'):
            spear_damage = boss.bone_spear()
            if spear_damage > 0:
                messages.append(f"The {boss.name} hurls a bone spear for {spear_damage} magic damage!")
                
        # Troll Chieftain abilities
        if hasattr(boss, 'enhanced_regeneration'):
            regen_amount = boss.enhanced_regeneration()
            if regen_amount > 0:
                messages.append(f"The {boss.name} regenerates {regen_amount} HP!")
                
        if hasattr(boss, 'ground_slam'):
            slam_damage = boss.ground_slam()
            if slam_damage > 0:
                messages.append(f"The {boss.name} slams the ground! Massive damage incoming!")
                
        if hasattr(boss, 'intimidate') and boss.intimidate():
            messages.append(f"The {boss.name}'s intimidating roar fills you with dread!")
            
        # Shadow Lord abilities  
        if hasattr(boss, 'shadow_bolt'):
            bolt_damage = boss.shadow_bolt()
            if bolt_damage > 0:
                messages.append(f"The {boss.name} fires a shadow bolt for {bolt_damage} dark damage!")
                
        if hasattr(boss, 'darkness_aura') and boss.darkness_aura():
            messages.append(f"The {boss.name} emanates an aura of darkness!")
            
        return messages
        
    def _handle_boss_loot_drop(self, boss):
        """Handle special loot drops from bosses."""
        from consumables import (HealingPotion, ManaPotion, StrengthPotion, 
                               DefensePotion, RegenerationPotion)
        from equipment import SteelSword, ChainMail, HealthRing
        
        # Bosses always drop good loot
        loot_pool = []
        
        if boss.name == "Goblin King":
            loot_pool = [StrengthPotion, HealingPotion, HealingPotion]
        elif boss.name == "Orc Warlord":
            loot_pool = [SteelSword, ChainMail, DefensePotion]
        elif boss.name == "Skeleton Lord":
            loot_pool = [ManaPotion, RegenerationPotion, HealthRing]
        elif boss.name == "Troll Chieftain":
            loot_pool = [RegenerationPotion, DefensePotion, ChainMail]
        elif boss.name == "Shadow Lord":
            loot_pool = [HealthRing, RegenerationPotion, ManaPotion]
        else:
            # Default boss loot
            loot_pool = [HealingPotion, StrengthPotion]
            
        # Drop 2-3 items from the loot pool
        num_drops = random.randint(2, 3)
        for _ in range(num_drops):
            if loot_pool:
                item_class = random.choice(loot_pool)
                try:
                    item = item_class()
                    if hasattr(item, 'consumable_type'):  # It's a consumable
                        if self.game.player.inventory.add_item(item):
                            print(f"The {boss.name} dropped {item.name}!")
                        else:
                            print(f"The {boss.name} dropped {item.name}, but your inventory is full!")
                    else:  # It's equipment
                        print(f"The {boss.name} dropped {item}!")
                        print("Do you want to take it? (yes/no)")
                        
                        try:
                            from input_handler import input_handler
                            choice = input_handler.get_input_with_arrows("> ").strip().lower()
                        except:
                            choice = input("> ").strip().lower()
                            
                        if choice in ['yes', 'y']:
                            # Check if we already have this exact equipment
                            current_equipment = self.game.player.equipment.slots[item.slot]
                            
                            if current_equipment and str(current_equipment) == str(item):
                                visual_fx.print_colored(f"You already have {item} equipped.", Colors.BRIGHT_YELLOW)
                                visual_fx.print_colored("There's no need to replace it with an identical item.", Colors.BRIGHT_WHITE)
                            else:
                                old_equipment = self.game.player.equipment.equip(item)
                                if old_equipment:
                                    visual_fx.print_colored(f"You unequip {old_equipment} and equip {item}.", Colors.BRIGHT_GREEN)
                                    
                                    # Drop the old equipment on the ground in the merchant's room
                                    current_room = self.game.dungeon_map.get_current_room()
                                    visual_fx.print_colored(f"💎 You drop {old_equipment} on the floor of the shop.", Colors.BRIGHT_YELLOW)
                                    visual_fx.print_colored("The merchant eyes it with interest...", Colors.BRIGHT_BLACK)
                                    
                                    # Store the dropped equipment in the merchant room
                                    if not hasattr(room_content, 'dropped_equipment'):
                                        room_content.dropped_equipment = []
                                    room_content.dropped_equipment.append(old_equipment)
                                else:
                                    visual_fx.print_colored(f"You equip {item}.", Colors.BRIGHT_GREEN)
                                self.game.player.update_max_hp()
                except:
                    # Skip this drop if there's an error
                    continue
        
    def _show_achievement_notifications(self):
        """Display any pending achievement notifications."""
        notifications = self.game.achievement_manager.get_and_clear_notifications()
        
        for achievement in notifications:
            print("\n" + "="*50)
            print("🏆 ACHIEVEMENT UNLOCKED! 🏆")
            print(f"{achievement.name} - {achievement.points} points")
            print(f"{achievement.description}")
            
            if achievement.unlock_reward:
                print(f"\nReward: New content unlocked!")
                
            print("="*50)
            time.sleep(1.5)
            
    def _handle_puzzle_room(self, room_content: PuzzleRoom) -> bool:
        """Handle a puzzle room with interactive challenges."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_CYAN)
            
        if not room_content.puzzle:
            return True
            
        # Set up puzzle in manager if not already done
        room_pos = str(self.game.dungeon_map.current_position)
        if room_pos not in self.game.puzzle_manager.active_puzzles:
            self.game.puzzle_manager.active_puzzles[room_pos] = room_content.puzzle
            
        # Show puzzle interaction menu
        while True:
            if room_content.puzzle.solved:
                visual_fx.print_colored("✅ This puzzle has been solved!", Colors.BRIGHT_GREEN, bold=True)
                if not room_content.rewards_claimed:
                    visual_fx.print_colored("The mystical energy suggests rewards await...", Colors.BRIGHT_MAGENTA)
                break
            elif room_content.puzzle.failed:
                visual_fx.print_colored("❌ This puzzle has failed permanently.", Colors.BRIGHT_RED, bold=True)
                break
                
            visual_fx.print_colored("\n🧩 === PUZZLE CHAMBER === 🧩", Colors.BRIGHT_CYAN, bold=True)
            visual_fx.print_colored("What would you like to do?", Colors.BRIGHT_WHITE)
            visual_fx.print_colored("• examine - Look at the puzzle closely", Colors.BRIGHT_YELLOW)
            visual_fx.print_colored("• solve [answer] - Attempt to solve the puzzle", Colors.BRIGHT_YELLOW)
            visual_fx.print_colored("• hint - Get a hint (if available)", Colors.BRIGHT_YELLOW)
            visual_fx.print_colored("• leave - Exit the puzzle chamber", Colors.BRIGHT_YELLOW)
            
            try:
                from input_handler import input_handler
                choice = input_handler.get_input_with_arrows("> ").strip().lower()
            except:
                choice = input("> ").strip().lower()
                
            if choice == "examine":
                visual_fx.print_colored("\n📋 PUZZLE DETAILS:", Colors.BRIGHT_CYAN, bold=True)
                prompt = room_content.puzzle.get_prompt()
                visual_fx.print_colored(prompt, Colors.BRIGHT_WHITE)
                visual_fx.print_colored(f"\n🎯 Difficulty: {room_content.puzzle.difficulty.value.title()}", Colors.BRIGHT_MAGENTA)
                visual_fx.print_colored(f"🔄 Attempts remaining: {room_content.puzzle.max_attempts - room_content.puzzle.attempts_used}", Colors.BRIGHT_BLUE)
                
            elif choice.startswith("solve "):
                answer = choice[6:].strip()
                if not answer:
                    visual_fx.print_colored("Please provide an answer after 'solve'", Colors.BRIGHT_RED)
                    continue
                    
                messages = room_content.interact(self.game, choice)
                for msg in messages:
                    if "Correct" in msg:
                        visual_fx.print_colored(msg, Colors.BRIGHT_GREEN, bold=True)
                    elif "Incorrect" in msg:
                        visual_fx.print_colored(msg, Colors.BRIGHT_RED)
                    elif "gold" in msg.lower():
                        visual_fx.treasure_animation(0)  # Just the animation
                        visual_fx.print_colored(msg, Colors.BRIGHT_YELLOW)
                    elif "level up" in msg.lower():
                        visual_fx.level_up_animation(self.game.player.level)
                    else:
                        visual_fx.print_colored(msg, Colors.BRIGHT_CYAN)
                        
            elif choice == "hint":
                hint = self.game.puzzle_manager.get_puzzle_hint(room_pos)
                if hint and "No hint" not in hint:
                    visual_fx.print_colored(hint, Colors.BRIGHT_MAGENTA)
                else:
                    visual_fx.print_colored("💡 No hint available yet. Try solving first!", Colors.BRIGHT_BLACK)
                    
            elif choice in ["leave", "exit"]:
                visual_fx.print_colored("You step back from the puzzle.", Colors.BRIGHT_WHITE)
                break
                
            else:
                visual_fx.print_colored("Invalid command. Try 'examine', 'solve [answer]', 'hint', or 'leave'.", Colors.BRIGHT_RED)
                
        return True
        
    def _handle_secret_room(self, room_content: SecretRoomContent) -> bool:
        """Handle a secret room discovered through puzzle solving."""
        messages = room_content.on_enter(self.game)
        for msg in messages:
            visual_fx.print_colored(msg, Colors.BRIGHT_MAGENTA, bold=True)
            
        if not room_content.secret_room or not room_content.secret_room.discovered:
            return True
            
        # Show secret room interaction menu
        while True:
            if room_content.secret_room.looted:
                visual_fx.print_colored("This secret chamber has been thoroughly searched.", Colors.BRIGHT_BLACK)
                break
                
            visual_fx.print_colored("\n🌟 === SECRET CHAMBER === 🌟", Colors.BRIGHT_MAGENTA, bold=True)
            visual_fx.print_colored("Ancient treasures gleam in the mystical light...", Colors.BRIGHT_CYAN)
            visual_fx.print_colored("What would you like to do?", Colors.BRIGHT_WHITE)
            visual_fx.print_colored("• loot - Collect the treasures", Colors.BRIGHT_YELLOW)
            visual_fx.print_colored("• search - Look around carefully", Colors.BRIGHT_YELLOW)
            visual_fx.print_colored("• leave - Exit the secret chamber", Colors.BRIGHT_YELLOW)
            
            try:
                from input_handler import input_handler
                choice = input_handler.get_input_with_arrows("> ").strip().lower()
            except:
                choice = input("> ").strip().lower()
                
            if choice in ["loot", "search", "treasure"]:
                messages = room_content.interact(self.game, choice)
                for msg in messages:
                    if "gold" in msg.lower():
                        visual_fx.treasure_animation(0)  # Just the animation
                        visual_fx.print_colored(msg, Colors.BRIGHT_YELLOW, bold=True)
                    elif "found" in msg.lower():
                        visual_fx.print_colored(msg, Colors.BRIGHT_CYAN, bold=True)
                    else:
                        visual_fx.print_colored(msg, Colors.BRIGHT_WHITE)
                        
            elif choice in ["leave", "exit"]:
                visual_fx.print_colored("You carefully leave the secret chamber.", Colors.BRIGHT_WHITE)
                break
                
            else:
                visual_fx.print_colored("Invalid command. Try 'loot', 'search', or 'leave'.", Colors.BRIGHT_RED)
                
        return True
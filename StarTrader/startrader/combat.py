"""
Tactical turn-based combat system for Star Trader.

This module implements a grid-based combat system with positioning,
different weapon ranges, and special abilities.
"""

import random
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass
from enum import Enum

class CombatantType(Enum):
    PLAYER = "player"
    PIRATE = "pirate"
    BOUNTY = "bounty"
    PATROL = "patrol"
    MERCHANT = "merchant"

class WeaponRange(Enum):
    SHORT = 1  # Adjacent tiles only
    MEDIUM = 2  # 2 tile range
    LONG = 3   # 3 tile range

@dataclass
class Position:
    x: int
    y: int
    
    def distance_to(self, other: 'Position') -> int:
        """Calculate Manhattan distance to another position."""
        return abs(self.x - other.x) + abs(self.y - other.y)

class Combatant:
    """Represents a ship in combat."""
    def __init__(self, name: str, ship_type: CombatantType, hull: int, max_hull: int,
                 shield: int, weapon_damage: int, weapon_range: WeaponRange,
                 speed: int = 2, evasion: int = 0):
        self.name = name
        self.ship_type = ship_type
        self.hull = hull
        self.max_hull = max_hull
        self.shield = shield
        self.max_shield = shield
        self.weapon_damage = weapon_damage
        self.weapon_range = weapon_range
        self.speed = speed  # Movement points per turn
        self.evasion = evasion  # Chance to dodge attacks (0-100)
        self.position = Position(0, 0)
        self.has_moved = False
        self.has_acted = False
        self.special_cooldown = 0
        
    def take_damage(self, damage: int) -> int:
        """Apply damage to shields first, then hull. Returns actual hull damage."""
        # Check for evasion
        if random.randint(0, 100) < self.evasion:
            return 0  # Dodged!
            
        hull_damage = 0
        if self.shield > 0:
            shield_damage = min(damage, self.shield)
            self.shield -= shield_damage
            damage -= shield_damage
            
        if damage > 0:
            hull_damage = min(damage, self.hull)
            self.hull -= hull_damage
            
        return hull_damage
    
    def is_alive(self) -> bool:
        return self.hull > 0
    
    def can_attack(self, target: 'Combatant') -> bool:
        """Check if this combatant can attack the target."""
        distance = self.position.distance_to(target.position)
        return distance <= self.weapon_range.value and not self.has_acted
    
    def reset_turn(self):
        """Reset turn-based flags."""
        self.has_moved = False
        self.has_acted = False
        if self.special_cooldown > 0:
            self.special_cooldown -= 1

class CombatGrid:
    """Represents the combat arena."""
    def __init__(self, width: int = 7, height: int = 7):
        self.width = width
        self.height = height
        self.obstacles: List[Position] = []
        self._generate_obstacles()
        
    def _generate_obstacles(self):
        """Generate random obstacles (asteroids, debris)."""
        num_obstacles = random.randint(3, 6)
        for _ in range(num_obstacles):
            x = random.randint(1, self.width - 2)
            y = random.randint(1, self.height - 2)
            self.obstacles.append(Position(x, y))
    
    def is_valid_position(self, pos: Position) -> bool:
        """Check if a position is valid and unoccupied."""
        if pos.x < 0 or pos.x >= self.width or pos.y < 0 or pos.y >= self.height:
            return False
        return not any(obs.x == pos.x and obs.y == pos.y for obs in self.obstacles)
    
    def get_line_of_sight(self, from_pos: Position, to_pos: Position) -> bool:
        """Check if there's clear line of sight between two positions."""
        # Simple implementation - check if any obstacle blocks the straight line
        # In a more complex system, we'd use proper line-of-sight algorithms
        for obstacle in self.obstacles:
            # Check if obstacle is roughly between the two positions
            if (min(from_pos.x, to_pos.x) <= obstacle.x <= max(from_pos.x, to_pos.x) and
                min(from_pos.y, to_pos.y) <= obstacle.y <= max(from_pos.y, to_pos.y)):
                return False
        return True

class TacticalCombat:
    """Main tactical combat handler."""
    def __init__(self, player_ship, enemy_ships: List[Dict], game):
        self.game = game
        self.grid = CombatGrid()
        self.combatants: List[Combatant] = []
        self.turn_order: List[Combatant] = []
        self.current_turn_index = 0
        self.combat_log: List[str] = []
        
        # Create player combatant
        self.player = self._create_player_combatant(player_ship)
        self.combatants.append(self.player)
        
        # Create enemy combatants
        for i, enemy_data in enumerate(enemy_ships):
            enemy = self._create_enemy_combatant(enemy_data)
            self.combatants.append(enemy)
            
        # Position combatants
        self._position_combatants()
        
        # Determine turn order (based on ship speed/initiative)
        self.turn_order = sorted(self.combatants, key=lambda c: c.speed, reverse=True)
        
    def _create_player_combatant(self, player_ship) -> Combatant:
        """Create combatant from player's ship."""
        # Determine weapon range based on damage level
        weapon_range = WeaponRange.MEDIUM  # Default
        # Higher damage = longer range
        if player_ship.damage >= 30:
            weapon_range = WeaponRange.LONG
        elif player_ship.damage <= 15:
            weapon_range = WeaponRange.SHORT
            
        # Calculate evasion from piloting skill
        evasion = int(self.game.player.get_skill_bonus("piloting") * 30)  # Up to 30% evasion
        
        combatant = Combatant(
            name="Player Ship",
            ship_type=CombatantType.PLAYER,
            hull=player_ship.hull,
            max_hull=player_ship.max_hull,
            shield=player_ship.get_shield_strength(),
            weapon_damage=player_ship.get_weapon_damage(self.game.player),
            weapon_range=weapon_range,
            speed=3 if player_ship.specialization == "combat" else 2,
            evasion=evasion
        )
        return combatant
    
    def _create_enemy_combatant(self, enemy_data: Dict) -> Combatant:
        """Create enemy combatant from data."""
        return Combatant(
            name=enemy_data.get("name", "Pirate"),
            ship_type=CombatantType(enemy_data.get("type", "pirate")),
            hull=enemy_data.get("hull", 50),
            max_hull=enemy_data.get("hull", 50),
            shield=enemy_data.get("shield", 0),
            weapon_damage=enemy_data.get("damage", 15),
            weapon_range=WeaponRange(enemy_data.get("range", WeaponRange.MEDIUM)),
            speed=enemy_data.get("speed", 2),
            evasion=enemy_data.get("evasion", 10)
        )
    
    def _position_combatants(self):
        """Place combatants on the grid."""
        # Player starts on the left side
        self.player.position = Position(0, self.grid.height // 2)
        
        # Enemies start on the right side
        enemy_count = len(self.combatants) - 1
        for i, combatant in enumerate(self.combatants[1:]):
            y_pos = (self.grid.height // (enemy_count + 1)) * (i + 1)
            combatant.position = Position(self.grid.width - 1, y_pos)
    
    def display_grid(self):
        """Display the current combat grid."""
        print("\n" + "=" * 40)
        print("TACTICAL COMBAT VIEW")
        print("=" * 40)
        
        # Create grid display
        for y in range(self.grid.height):
            row = []
            for x in range(self.grid.width):
                pos = Position(x, y)
                
                # Check for combatants
                combatant_here = None
                for c in self.combatants:
                    if c.position.x == x and c.position.y == y and c.is_alive():
                        combatant_here = c
                        break
                
                if combatant_here:
                    if combatant_here.ship_type == CombatantType.PLAYER:
                        row.append("P")
                    elif combatant_here.ship_type == CombatantType.PIRATE:
                        row.append("X")
                    elif combatant_here.ship_type == CombatantType.BOUNTY:
                        row.append("B")
                    else:
                        row.append("E")
                elif any(obs.x == x and obs.y == y for obs in self.grid.obstacles):
                    row.append("#")  # Obstacle
                else:
                    row.append(".")  # Empty space
                    
            print(" ".join(row))
        
        print("\nLegend: P=Player, X=Pirate, B=Bounty, E=Enemy, #=Obstacle")
        print()
        
        # Display combatant status
        for c in self.combatants:
            if c.is_alive():
                shield_str = f"Shield: {c.shield}/{c.max_shield}, " if c.max_shield > 0 else ""
                print(f"{c.name} - Hull: {c.hull}/{c.max_hull}, {shield_str}Pos: ({c.position.x},{c.position.y})")
    
    def get_current_combatant(self) -> Combatant:
        """Get the combatant whose turn it is."""
        return self.turn_order[self.current_turn_index]
    
    def get_possible_moves(self, combatant: Combatant) -> List[Position]:
        """Get all valid positions a combatant can move to."""
        if combatant.has_moved:
            return []
            
        moves = []
        for dx in range(-combatant.speed, combatant.speed + 1):
            for dy in range(-combatant.speed, combatant.speed + 1):
                if abs(dx) + abs(dy) <= combatant.speed:  # Manhattan distance
                    new_pos = Position(combatant.position.x + dx, combatant.position.y + dy)
                    if self.grid.is_valid_position(new_pos):
                        # Check if position is occupied
                        occupied = any(c.position.x == new_pos.x and c.position.y == new_pos.y 
                                     and c.is_alive() for c in self.combatants)
                        if not occupied:
                            moves.append(new_pos)
        return moves
    
    def move_combatant(self, combatant: Combatant, new_pos: Position) -> bool:
        """Move a combatant to a new position."""
        if combatant.has_moved:
            return False
            
        possible_moves = self.get_possible_moves(combatant)
        if new_pos in possible_moves:
            combatant.position = new_pos
            combatant.has_moved = True
            return True
        return False
    
    def get_valid_targets(self, attacker: Combatant) -> List[Combatant]:
        """Get all valid targets for an attacker."""
        if attacker.has_acted:
            return []
            
        targets = []
        for target in self.combatants:
            if target != attacker and target.is_alive():
                if attacker.can_attack(target) and self.grid.get_line_of_sight(attacker.position, target.position):
                    targets.append(target)
        return targets
    
    def attack(self, attacker: Combatant, target: Combatant) -> str:
        """Execute an attack."""
        if not attacker.can_attack(target):
            return "Target out of range!"
            
        if not self.grid.get_line_of_sight(attacker.position, target.position):
            return "No line of sight to target!"
            
        # Calculate damage with some variance
        damage = attacker.weapon_damage + random.randint(-5, 5)
        damage = max(1, damage)  # Minimum 1 damage
        
        # Apply damage
        hull_damage = target.take_damage(damage)
        
        attacker.has_acted = True
        
        if hull_damage == 0 and target.hull > 0:
            return f"{attacker.name} fires at {target.name}, but they evade the attack!"
        else:
            result = f"{attacker.name} fires at {target.name} for {damage} damage!"
            if target.shield > 0:
                result += f" (Shield: {target.shield}/{target.max_shield})"
            if not target.is_alive():
                result += f" {target.name} destroyed!"
            return result
    
    def use_special_ability(self, combatant: Combatant) -> Optional[str]:
        """Use a combatant's special ability if available."""
        if combatant.has_acted or combatant.special_cooldown > 0:
            return None
            
        if combatant.ship_type == CombatantType.PLAYER:
            # Player abilities based on ship specialization
            ship = self.game.player.ship
            if ship.specialization == "combat":
                # Overcharge weapons - double damage next attack
                combatant.weapon_damage *= 2
                combatant.special_cooldown = 3
                combatant.has_acted = True
                return "Weapons overcharged! Double damage on next attack!"
            elif ship.specialization == "exploration":
                # Emergency boost - extra movement
                combatant.speed += 2
                combatant.has_moved = False  # Reset movement
                combatant.special_cooldown = 2
                combatant.has_acted = True
                return "Emergency boosters engaged! Extra movement this turn!"
        
        return None
    
    def ai_turn(self, combatant: Combatant):
        """Execute AI turn for an enemy combatant."""
        # Simple AI - move towards player and attack if possible
        
        # First, check if we can attack
        if self.player.is_alive() and combatant.can_attack(self.player):
            if self.grid.get_line_of_sight(combatant.position, self.player.position):
                result = self.attack(combatant, self.player)
                self.combat_log.append(result)
                return
        
        # If not, try to move closer
        if not combatant.has_moved:
            possible_moves = self.get_possible_moves(combatant)
            if possible_moves:
                # Find move that gets us closest to player
                best_move = min(possible_moves, 
                              key=lambda pos: pos.distance_to(self.player.position))
                self.move_combatant(combatant, best_move)
                self.combat_log.append(f"{combatant.name} moves to ({best_move.x},{best_move.y})")
                
                # Check if we can attack after moving
                if self.player.is_alive() and combatant.can_attack(self.player):
                    if self.grid.get_line_of_sight(combatant.position, self.player.position):
                        result = self.attack(combatant, self.player)
                        self.combat_log.append(result)
    
    def end_turn(self):
        """End the current turn and move to the next combatant."""
        current = self.get_current_combatant()
        current.reset_turn()
        
        # Move to next alive combatant
        attempts = 0
        while attempts < len(self.turn_order):
            self.current_turn_index = (self.current_turn_index + 1) % len(self.turn_order)
            if self.turn_order[self.current_turn_index].is_alive():
                break
            attempts += 1
    
    def check_victory(self) -> Optional[str]:
        """Check if combat has ended."""
        alive_enemies = [c for c in self.combatants if c.is_alive() and c.ship_type != CombatantType.PLAYER]
        
        if not self.player.is_alive():
            return "defeat"
        elif not alive_enemies:
            return "victory"
        return None
    
    def run(self) -> str:
        """Run the tactical combat until completion."""
        print("\n=== TACTICAL COMBAT INITIATED ===")
        print("Use 'help' to see available commands.")
        
        while True:
            # Display current state
            self.display_grid()
            
            # Check for victory/defeat
            result = self.check_victory()
            if result:
                return result
            
            # Display combat log
            if self.combat_log:
                print("\nCombat Log:")
                for log in self.combat_log[-3:]:  # Show last 3 events
                    print(f"  - {log}")
                self.combat_log.clear()
            
            current = self.get_current_combatant()
            
            if current.ship_type == CombatantType.PLAYER:
                # Player turn
                print(f"\nYour turn! (Movement: {current.speed}, Range: {current.weapon_range.value})")
                while True:
                    action = input("Action (move/attack/special/end/help): ").lower()
                    
                    if action == "help":
                        self._show_help()
                    elif action == "move":
                        if self._handle_player_move(current):
                            break
                    elif action == "attack":
                        if self._handle_player_attack(current):
                            break
                    elif action == "board":
                        if self._handle_boarding_attempt(current):
                            break
                    elif action == "special":
                        result = self.use_special_ability(current)
                        if result:
                            self.combat_log.append(result)
                            break
                        else:
                            print("Special ability not available!")
                    elif action == "end":
                        break
                    else:
                        print("Invalid action!")
            else:
                # AI turn
                print(f"\n{current.name}'s turn...")
                self.ai_turn(current)
            
            # End turn
            self.end_turn()
    
    def _show_help(self):
        """Display combat help."""
        print("\nCOMBAT COMMANDS:")
        print("  move - Move your ship (shows available positions)")
        print("  attack - Attack an enemy (shows valid targets)")
        print("  board - Attempt to board an enemy ship (must be adjacent and hull < 30%)")
        print("  special - Use special ability (if available)")
        print("  end - End your turn")
        print("\nCOMBAT TIPS:")
        print("  - Different weapons have different ranges")
        print("  - Obstacles block movement and line of sight")
        print("  - Position matters - flank enemies for advantage")
        print("  - Board damaged ships to capture them intact")
    
    def _handle_player_move(self, player: Combatant) -> bool:
        """Handle player movement."""
        if player.has_moved:
            print("You've already moved this turn!")
            return False
            
        moves = self.get_possible_moves(player)
        if not moves:
            print("No valid moves available!")
            return False
        
        # Display possible moves
        print("\nPossible moves:")
        for i, pos in enumerate(moves):
            dist_to_nearest_enemy = min(pos.distance_to(e.position) 
                                       for e in self.combatants 
                                       if e.is_alive() and e != player)
            print(f"{i+1}. ({pos.x},{pos.y}) - Distance to nearest enemy: {dist_to_nearest_enemy}")
        
        try:
            choice = int(input("Choose move (number) or 0 to cancel: "))
            if choice == 0:
                return False
            if 1 <= choice <= len(moves):
                self.move_combatant(player, moves[choice-1])
                self.combat_log.append(f"You move to ({moves[choice-1].x},{moves[choice-1].y})")
                return False  # Don't end turn, player might want to attack
            else:
                print("Invalid choice!")
                return False
        except ValueError:
            print("Invalid input!")
            return False
    
    def _handle_player_attack(self, player: Combatant) -> bool:
        """Handle player attack."""
        if player.has_acted:
            print("You've already acted this turn!")
            return False
            
        targets = self.get_valid_targets(player)
        if not targets:
            print("No valid targets in range!")
            return False
        
        # Display targets
        print("\nValid targets:")
        for i, target in enumerate(targets):
            print(f"{i+1}. {target.name} - Hull: {target.hull}/{target.max_hull}, Distance: {player.position.distance_to(target.position)}")
        
        try:
            choice = int(input("Choose target (number) or 0 to cancel: "))
            if choice == 0:
                return False
            if 1 <= choice <= len(targets):
                result = self.attack(player, targets[choice-1])
                self.combat_log.append(result)
                return True
            else:
                print("Invalid choice!")
                return False
        except ValueError:
            print("Invalid input!")
            return False
    
    def _handle_boarding_attempt(self, player: Combatant) -> bool:
        """Handle boarding action to capture enemy ships."""
        if player.has_acted:
            print("You've already acted this turn!")
            return False
        
        # Find adjacent enemies with low hull
        boardable_targets = []
        for enemy in self.combatants:
            if enemy != player and enemy.is_alive():
                distance = player.position.distance_to(enemy.position)
                hull_percent = enemy.hull / enemy.max_hull
                if distance == 1 and hull_percent <= 0.3:  # Adjacent and hull <= 30%
                    boardable_targets.append(enemy)
        
        if not boardable_targets:
            print("No valid boarding targets! (Must be adjacent with hull <= 30%)")
            return False
        
        # Display targets
        print("\nBoarding targets:")
        for i, target in enumerate(boardable_targets):
            hull_percent = int((target.hull / target.max_hull) * 100)
            print(f"{i+1}. {target.name} - Hull: {target.hull}/{target.max_hull} ({hull_percent}%)")
        
        try:
            choice = int(input("Choose target (number) or 0 to cancel: "))
            if choice == 0:
                return False
            if 1 <= choice <= len(boardable_targets):
                target = boardable_targets[choice-1]
                
                # Calculate boarding success chance
                base_chance = 0.6  # 60% base chance
                
                # Crew morale affects boarding
                if hasattr(self.game.player, 'crew') and self.game.player.crew:
                    avg_morale = sum(c.morale for c in self.game.player.crew) / len(self.game.player.crew)
                    morale_bonus = (avg_morale - 50) / 100  # -0.5 to +0.5
                    base_chance += morale_bonus * 0.3
                
                # Leadership skill helps
                leadership_bonus = self.game.player.get_skill_bonus("leadership") * 0.2
                base_chance += leadership_bonus
                
                # Target hull percentage affects difficulty
                hull_penalty = (target.hull / target.max_hull) * 0.3
                base_chance -= hull_penalty
                
                success_chance = max(0.2, min(0.9, base_chance))  # Clamp between 20% and 90%
                
                print(f"\nBoarding attempt! Success chance: {int(success_chance * 100)}%")
                print("Your crew prepares to board the enemy vessel...")
                
                if random.random() < success_chance:
                    # Success!
                    print("\nBOARDING SUCCESSFUL!")
                    print(f"Your crew has captured the {target.name}!")
                    
                    # Mark target as captured (remove from combat)
                    target.hull = 0
                    
                    # Store capture info for post-combat processing
                    if not hasattr(self, 'captured_ships'):
                        self.captured_ships = []
                    self.captured_ships.append({
                        'name': target.name,
                        'type': target.ship_type,
                        'max_hull': target.max_hull
                    })
                    
                    # Gain experience
                    self.game.player.give_crew_experience("Weapons Officer", 5)
                    self.game.player.gain_skill("leadership", 3)
                    
                    # Big morale boost
                    self.game.player.adjust_crew_morale(15, "Successfully captured an enemy ship!")
                    
                    self.combat_log.append(f"Captured the {target.name}!")
                else:
                    # Failure
                    print("\nBOARDING FAILED!")
                    print("Your boarding party was repelled!")
                    
                    # Take some damage from the failed attempt
                    damage = random.randint(5, 15)
                    player.hull -= damage
                    print(f"Your ship takes {damage} damage in the failed attempt.")
                    
                    # Morale penalty
                    self.game.player.adjust_crew_morale(-5, "Failed boarding attempt")
                    
                    self.combat_log.append(f"Failed to board the {target.name}")
                
                player.has_acted = True
                return True
            else:
                print("Invalid choice!")
                return False
        except ValueError:
            print("Invalid input!")
            return False
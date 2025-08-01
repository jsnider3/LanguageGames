"""
Room content system for The Shadowed Keep.
Uses abstract base classes and factory pattern for extensible room types.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Type, List
import random
from enum import Enum
from constants import (
    BANDAGE_FIND_CHANCE, BANDAGE_HEAL_MIN, BANDAGE_HEAL_MAX,
    MERCHANT_POTION_PRICE, MERCHANT_POTION_STOCK, MERCHANT_POTION_HEAL,
    FOUNTAIN_HEAL_PERCENTAGE, FOUNTAIN_MIN_HEAL, FOUNTAIN_USES,
    SPIKE_TRAP_DAMAGE_MIN, SPIKE_TRAP_DAMAGE_MAX, SPIKE_TRAP_DODGE_CHANCE,
    DART_TRAP_DAMAGE_MIN, DART_TRAP_DAMAGE_MAX, DART_TRAP_DODGE_CHANCE,
    POISON_GAS_TRAP_DAMAGE_MIN, POISON_GAS_TRAP_DAMAGE_MAX, POISON_GAS_TRAP_DODGE_CHANCE,
    TREASURE_GOLD_MIN, TREASURE_GOLD_MAX,
    MIMIC_SPAWN_CHANCE
)


class RoomContentType(Enum):
    """Types of room content."""
    EMPTY = "empty"
    MONSTER = "monster"
    TREASURE = "treasure"
    EQUIPMENT = "equipment"
    MERCHANT = "merchant"
    HEALING_FOUNTAIN = "healing_fountain"
    TRAP = "trap"
    STAIRS = "stairs"
    BOSS = "boss"
    PUZZLE = "puzzle"
    SECRET_ROOM = "secret_room"


class RoomContent(ABC):
    """Abstract base class for room content."""
    
    def __init__(self):
        self.explored = False
        self.content_type = RoomContentType.EMPTY
        
    @abstractmethod
    def on_enter(self, game) -> List[str]:
        """
        Called when the player enters the room.
        Returns a list of messages to display.
        """
        pass
        
    @abstractmethod
    def get_description(self) -> str:
        """Get a description of the room content."""
        pass
        
    @abstractmethod
    def interact(self, game, action: str) -> List[str]:
        """
        Handle player interaction with the room.
        Returns a list of messages to display.
        """
        pass
        
    def is_cleared(self) -> bool:
        """Check if the room content has been cleared/completed."""
        return self.explored


class EmptyRoom(RoomContent):
    """An empty room with nothing special."""
    
    def __init__(self):
        super().__init__()
        self.content_type = RoomContentType.EMPTY
        self.has_bandages = random.random() < BANDAGE_FIND_CHANCE
        self.bandages_taken = False
        
    def on_enter(self, game) -> List[str]:
        messages = ["The room is empty. You take a moment to catch your breath."]
        
        if self.has_bandages and not self.bandages_taken:
            messages.append("You notice some discarded bandages in the corner.")
            
        self.explored = True
        return messages
        
    def get_description(self) -> str:
        if self.has_bandages and not self.bandages_taken:
            return "An empty room with some bandages in the corner."
        return "An empty room."
        
    def interact(self, game, action: str) -> List[str]:
        if action == "take bandages" and self.has_bandages and not self.bandages_taken:
            heal_amount = random.randint(BANDAGE_HEAL_MIN, BANDAGE_HEAL_MAX)
            game.player.hp = min(game.player.max_hp, game.player.hp + heal_amount)
            self.bandages_taken = True
            return [f"You use the bandages and heal for {heal_amount} HP. Current HP: {game.player.hp}"]
        return ["There's nothing to interact with here."]


class MonsterRoom(RoomContent):
    """A room containing a monster."""
    
    def __init__(self, monster):
        super().__init__()
        self.content_type = RoomContentType.MONSTER
        self.monster = monster
        self.defeated = False
        
    def on_enter(self, game) -> List[str]:
        if not self.defeated:
            return [f"A wild {self.monster.name} with {self.monster.hp} HP appears!"]
        else:
            return ["The defeated monster lies on the ground."]
            
    def get_description(self) -> str:
        if not self.defeated:
            return f"A room with a {self.monster.name}."
        return "A room with a defeated monster."
        
    def interact(self, game, action: str) -> List[str]:
        # Combat is handled separately in the game loop
        return []
        
    def is_cleared(self) -> bool:
        return self.defeated


class TreasureRoom(RoomContent):
    """A room containing treasure."""
    
    def __init__(self, gold_amount: int):
        super().__init__()
        self.content_type = RoomContentType.TREASURE
        self.gold_amount = gold_amount
        self.looted = False
        
    def on_enter(self, game) -> List[str]:
        if not self.looted:
            return ["You enter a quiet room. You find a chest containing gold!"]
        else:
            return ["An empty treasure chest sits open in the room."]
            
    def get_description(self) -> str:
        if not self.looted:
            return "A room with a treasure chest."
        return "A room with an empty chest."
        
    def interact(self, game, action: str) -> List[str]:
        if action == "open chest" and not self.looted:
            game.player.gold += self.gold_amount
            self.looted = True
            self.explored = True
            return [
                f"You find {self.gold_amount} gold!",
                f"Your total gold is now {game.player.gold}."
            ]
        return []
        
    def is_cleared(self) -> bool:
        return self.looted


class EquipmentRoom(RoomContent):
    """A room containing equipment."""
    
    def __init__(self, equipment):
        super().__init__()
        self.content_type = RoomContentType.EQUIPMENT
        self.equipment = equipment
        self.taken = False
        
    def on_enter(self, game) -> List[str]:
        if not self.taken:
            return [
                f"You find a chest containing: {self.equipment}",
                f"Description: {self.equipment.description}"
            ]
        else:
            return ["An empty equipment chest sits in the room."]
            
    def get_description(self) -> str:
        if not self.taken:
            return f"A room with an equipment chest."
        return "A room with an empty equipment chest."
        
    def interact(self, game, action: str) -> List[str]:
        # Equipment interaction is handled in the game loop
        return []
        
    def is_cleared(self) -> bool:
        return self.taken


class StairsRoom(RoomContent):
    """A room containing stairs to the next level."""
    
    def __init__(self):
        super().__init__()
        self.content_type = RoomContentType.STAIRS
        
    def on_enter(self, game) -> List[str]:
        return ["You found the stairs leading deeper into the keep!"]
        
    def get_description(self) -> str:
        return "A room with stairs leading down."
        
    def interact(self, game, action: str) -> List[str]:
        if action == "descend":
            # Descending is handled in the game loop
            return ["You prepare to descend deeper into the keep..."]
        return []


class MerchantRoom(RoomContent):
    """A room containing a merchant."""
    
    def __init__(self):
        super().__init__()
        self.content_type = RoomContentType.MERCHANT
        self.visited = False
        self._generate_inventory()
        
    def _generate_inventory(self):
        """Generate merchant's inventory based on dungeon level."""
        from consumables import (HealingPotion, ManaPotion, Antidote, 
                                 StrengthPotion, DefensePotion, 
                                 Bread, Cheese, SmokeBomb)
        
        # Basic items always available
        self.items_for_sale = {
            "healing_potion": {
                "item": HealingPotion(),
                "price": MERCHANT_POTION_PRICE,
                "stock": MERCHANT_POTION_STOCK
            },
            "bread": {
                "item": Bread(),
                "price": 5,
                "stock": 10
            },
            "antidote": {
                "item": Antidote(),
                "price": 15,
                "stock": 3
            }
        }
        
        # Add more items based on dungeon level
        if hasattr(self, 'game_ref') and self.game_ref:
            level = self.game_ref.dungeon_level
        else:
            level = 1
            
        if level >= 2:
            self.items_for_sale["mana_potion"] = {
                "item": ManaPotion(),
                "price": 30,
                "stock": 3
            }
            self.items_for_sale["cheese"] = {
                "item": Cheese(),
                "price": 8,
                "stock": 5
            }
            
        if level >= 3:
            self.items_for_sale["strength_potion"] = {
                "item": StrengthPotion(),
                "price": 40,
                "stock": 2
            }
            self.items_for_sale["smoke_bomb"] = {
                "item": SmokeBomb(),
                "price": 20,
                "stock": 2
            }
            
        if level >= 4:
            self.items_for_sale["defense_potion"] = {
                "item": DefensePotion(),
                "price": 35,
                "stock": 2
            }
        
    def on_enter(self, game) -> List[str]:
        if not self.visited:
            return [
                "You encounter a hooded merchant in the corner of the room.",
                "'Welcome, adventurer! Care to see my wares?'",
                "Type 'shop' to browse the merchant's inventory."
            ]
        else:
            return [
                "The merchant is still here.",
                "'Back again? My shop is always open!'"
            ]
            
    def get_description(self) -> str:
        return "A room with a merchant selling supplies."
        
    def interact(self, game, action: str) -> List[str]:
        self.visited = True
        self.explored = True
        self.game_ref = game  # Store reference for inventory generation
        
        if action == "shop":
            messages = ["=== MERCHANT'S WARES ==="]
            
            # List all items
            item_num = 1
            self.item_numbers = {}  # Map numbers to item keys
            
            for key, data in self.items_for_sale.items():
                item = data["item"]
                price = data["price"]
                stock = data["stock"]
                
                if stock > 0:
                    messages.append(f"{item_num}. {item.name} - {price}g - {item.description} - {stock} in stock")
                    self.item_numbers[str(item_num)] = key
                    item_num += 1
                else:
                    messages.append(f"{item_num}. {item.name} - SOLD OUT")
                    item_num += 1
                    
            messages.append(f"\nYour gold: {game.player.gold}")
            messages.append("Type 'buy [item name]' or 'buy [quantity] [item name]' to purchase")
            messages.append("Examples: 'buy healing potion', 'buy 3 bread', 'buy 2 antidote'")
            return messages
            
        elif action.startswith("buy"):
            parts = action.split()
            if len(parts) < 2:
                return ["'What would you like to buy? Try 'buy [item name]' or 'buy [quantity] [item name]'.'"]
            
            # Parse quantity and item name
            quantity = 1
            item_name_parts = parts[1:]
            
            # Check if first part after "buy" is a number (quantity)
            try:
                quantity = int(parts[1])
                if quantity <= 0:
                    return ["'You need to buy at least 1 item!'"]
                item_name_parts = parts[2:]
            except ValueError:
                # First part is not a number, so it's part of the item name
                quantity = 1
                item_name_parts = parts[1:]
                
            if not item_name_parts:
                return ["'What item would you like to buy?'"]
            
            # Join item name parts and normalize for matching
            item_name = " ".join(item_name_parts).lower().strip()
            
            # Find matching item
            matching_item_key = None
            for key, data in self.items_for_sale.items():
                item = data["item"]
                # Check for exact match or partial match
                if (item.name.lower() == item_name or 
                    item_name in item.name.lower() or
                    item.name.lower().startswith(item_name)):
                    matching_item_key = key
                    break
            
            if not matching_item_key:
                return [f"'I don't sell '{item_name}'. Type 'shop' to see what's available.'"]
            
            # Process the purchase
            data = self.items_for_sale[matching_item_key]
            item = data["item"]
            price = data["price"]
            stock = data["stock"]
            total_cost = price * quantity
            
            # Check availability and affordability
            if stock <= 0:
                return [f"'Sorry, I'm all out of {item.name}!'"]
            elif quantity > stock:
                return [f"'I only have {stock} {item.name} in stock.'"]
            elif game.player.gold < total_cost:
                return [f"'You need {total_cost} gold for {quantity} {item.name}, but you only have {game.player.gold}!'"]
            else:
                # Check inventory space for all items
                for i in range(quantity):
                    test_item = type(item)()
                    if not game.player.inventory.add_item(test_item):
                        # Remove test items that were added
                        for j in range(i):
                            game.player.inventory.remove_item(test_item.consumable_type)
                        return [f"'Your inventory doesn't have space for {quantity} {item.name}!'"]
                
                # Purchase successful - remove test items and add real ones
                for i in range(quantity):
                    game.player.inventory.remove_item(item.consumable_type)
                
                for i in range(quantity):
                    real_item = type(item)()
                    game.player.inventory.add_item(real_item)
                
                game.player.gold -= total_cost
                data["stock"] -= quantity
                
                if quantity == 1:
                    return [
                        f"You purchase {item.name} for {price} gold.",
                        f"'{item.description}'",
                        "The item has been added to your inventory."
                    ]
                else:
                    return [
                        f"You purchase {quantity} {item.name} for {total_cost} gold.",
                        f"'{item.description}'",
                        f"All {quantity} items have been added to your inventory."
                    ]
                    
        return ["'Feel free to browse!' (Type 'shop' to see wares)"]
        
    def is_cleared(self) -> bool:
        # Merchant rooms are never "cleared" - always accessible
        return False


class HealingFountainRoom(RoomContent):
    """A room containing a healing fountain."""
    
    def __init__(self):
        super().__init__()
        self.content_type = RoomContentType.HEALING_FOUNTAIN
        self.uses_remaining = FOUNTAIN_USES
        
    def on_enter(self, game) -> List[str]:
        messages = ["You discover a mystical fountain glowing with soft blue light."]
        if self.uses_remaining > 0:
            messages.append(f"The fountain's waters look restorative. (Uses remaining: {self.uses_remaining})")
            messages.append("Type 'drink' to drink from the fountain.")
        else:
            messages.append("The fountain has run dry.")
        return messages
        
    def get_description(self) -> str:
        if self.uses_remaining > 0:
            return "A room with a healing fountain."
        return "A room with a dry fountain."
        
    def interact(self, game, action: str) -> List[str]:
        if action == "drink" and self.uses_remaining > 0:
            # Calculate healing amount (25% of max HP)
            heal_amount = max(FOUNTAIN_MIN_HEAL, int(game.player.max_hp * FOUNTAIN_HEAL_PERCENTAGE))
            old_hp = game.player.hp
            game.player.hp = min(game.player.max_hp, game.player.hp + heal_amount)
            actual_heal = game.player.hp - old_hp
            
            self.uses_remaining -= 1
            self.explored = True
            
            messages = [
                "You drink from the fountain's magical waters.",
                f"You heal {actual_heal} HP! Current HP: {game.player.hp}/{game.player.max_hp}"
            ]
            
            if self.uses_remaining > 0:
                messages.append(f"The fountain has {self.uses_remaining} uses remaining.")
            else:
                messages.append("The fountain's glow fades as it runs dry.")
                
            return messages
            
        elif action == "drink" and self.uses_remaining <= 0:
            return ["The fountain is dry."]
            
        return ["The fountain glows invitingly. (Type 'drink' to use)"]
        
    def is_cleared(self) -> bool:
        return self.uses_remaining == 0


class TrapRoom(RoomContent):
    """A room containing a trap."""
    
    def __init__(self, trap_type: str = None):
        super().__init__()
        self.content_type = RoomContentType.TRAP
        self.triggered = False
        
        # Randomly select trap type if not specified
        if trap_type is None:
            trap_types = ["spike", "dart", "poison_gas"]
            self.trap_type = random.choice(trap_types)
        else:
            self.trap_type = trap_type
            
        # Set trap properties
        if self.trap_type == "spike":
            self.damage = random.randint(SPIKE_TRAP_DAMAGE_MIN, SPIKE_TRAP_DAMAGE_MAX)
            self.dodge_chance = SPIKE_TRAP_DODGE_CHANCE
        elif self.trap_type == "dart":
            self.damage = random.randint(DART_TRAP_DAMAGE_MIN, DART_TRAP_DAMAGE_MAX)
            self.dodge_chance = DART_TRAP_DODGE_CHANCE
        elif self.trap_type == "poison_gas":
            self.damage = random.randint(POISON_GAS_TRAP_DAMAGE_MIN, POISON_GAS_TRAP_DAMAGE_MAX)
            self.dodge_chance = POISON_GAS_TRAP_DODGE_CHANCE
            
    def on_enter(self, game) -> List[str]:
        if self.triggered:
            return ["The room contains a triggered trap. You carefully step around it."]
            
        # Trap triggers on entry!
        messages = []
        
        if self.trap_type == "spike":
            messages.append("As you step into the room, you hear a click...")
            messages.append("Spikes shoot up from the floor!")
        elif self.trap_type == "dart":
            messages.append("You trigger a pressure plate!")
            messages.append("Darts shoot from the walls!")
        elif self.trap_type == "poison_gas":
            messages.append("You smell something strange...")
            messages.append("Poison gas fills the room!")
            
        # Check if player dodges
        if random.random() < self.dodge_chance:
            messages.append("You quickly dodge out of the way!")
        else:
            game.player.take_damage(self.damage)
            messages.append(f"You take {self.damage} damage! HP: {game.player.hp}/{game.player.max_hp}")
            
            if not game.player.is_alive():
                messages.append("The trap has claimed another victim...")
                
        self.triggered = True
        self.explored = True
        return messages
        
    def get_description(self) -> str:
        if self.triggered:
            return f"A room with a triggered {self.trap_type} trap."
        return "A seemingly normal room..."
        
    def interact(self, game, action: str) -> List[str]:
        if not self.triggered:
            return ["You haven't fully entered the room yet."]
        return ["The trap has already been triggered."]
        
    def is_cleared(self) -> bool:
        return self.triggered


class BossRoom(RoomContent):
    """A room containing a boss monster with special mechanics."""
    
    def __init__(self, boss_monster):
        super().__init__()
        self.content_type = RoomContentType.BOSS
        self.boss = boss_monster
        self.defeated = False
        self.entrance_message_shown = False
        
    def on_enter(self, game) -> List[str]:
        messages = []
        
        if not self.entrance_message_shown:
            messages.extend([
                "═════════════════════════════════",
                "🔥 BOSS CHAMBER 🔥",
                "═════════════════════════════════",
                "",
                f"The air grows heavy as you enter the chamber...",
                f"A massive {self.boss.name} emerges from the shadows!",
                f"HP: {self.boss.hp}/{self.boss.max_hp} | Attack: {self.boss.attack_power}",
                ""
            ])
            
            if hasattr(self.boss, 'max_phases') and self.boss.max_phases > 1:
                messages.append(f"This creature has {self.boss.max_phases} phases - beware!")
                
            messages.extend([
                "═════════════════════════════════",
                "PREPARE FOR BATTLE!",
                "═════════════════════════════════"
            ])
            
            self.entrance_message_shown = True
            
        elif not self.defeated:
            # Show phase information if applicable
            if hasattr(self.boss, 'phase') and hasattr(self.boss, 'max_phases'):
                if self.boss.max_phases > 1:
                    messages.append(f"The {self.boss.name} - Phase {self.boss.phase}/{self.boss.max_phases}")
                    
        else:
            messages.extend([
                "═════════════════════════════════",
                f"The {self.boss.name} has been defeated!",
                "The chamber is now quiet...",
                "═════════════════════════════════"
            ])
            
        self.explored = True
        return messages
        
    def get_description(self) -> str:
        if not self.defeated:
            return f"A boss chamber containing the {self.boss.name}."
        return f"A chamber where you defeated the {self.boss.name}."
        
    def interact(self, game, action: str) -> List[str]:
        # Boss combat is handled separately in the game loop
        return []
        
    def is_cleared(self) -> bool:
        return self.defeated


class RoomContentFactory:
    """Factory for creating room content."""
    
    # Registry of room content types
    _content_types: Dict[RoomContentType, Type[RoomContent]] = {}
    
    @classmethod
    def register(cls, content_type: RoomContentType, content_class: Type[RoomContent]):
        """Register a room content type."""
        cls._content_types[content_type] = content_class
        
    @classmethod
    def create(cls, content_type: RoomContentType, **kwargs) -> RoomContent:
        """Create room content of the specified type."""
        if content_type not in cls._content_types:
            raise ValueError(f"Unknown room content type: {content_type}")
            
        content_class = cls._content_types[content_type]
        
        # Special handling for different content types
        if content_type == RoomContentType.EMPTY:
            return EmptyRoom()
        elif content_type == RoomContentType.MONSTER:
            if 'monster' not in kwargs:
                raise ValueError("Monster room requires 'monster' parameter")
            return MonsterRoom(kwargs['monster'])
        elif content_type == RoomContentType.TREASURE:
            if 'gold_amount' not in kwargs:
                raise ValueError("Treasure room requires 'gold_amount' parameter")
            return TreasureRoom(kwargs['gold_amount'])
        elif content_type == RoomContentType.EQUIPMENT:
            if 'equipment' not in kwargs:
                raise ValueError("Equipment room requires 'equipment' parameter")
            return EquipmentRoom(kwargs['equipment'])
        elif content_type == RoomContentType.BOSS:
            if 'boss' not in kwargs:
                raise ValueError("Boss room requires 'boss' parameter")
            return BossRoom(kwargs['boss'])
        elif content_type == RoomContentType.STAIRS:
            return StairsRoom()
        elif content_type == RoomContentType.MERCHANT:
            return MerchantRoom()
        elif content_type == RoomContentType.HEALING_FOUNTAIN:
            return HealingFountainRoom()
        elif content_type == RoomContentType.TRAP:
            trap_type = kwargs.get('trap_type', None)
            return TrapRoom(trap_type)
        elif content_type == RoomContentType.PUZZLE:
            # Create puzzle dynamically based on dungeon level
            dungeon_level = kwargs.get('dungeon_level', 1)
            from puzzles import PuzzleFactory
            puzzle = PuzzleFactory.create_random_puzzle(dungeon_level)
            return PuzzleRoom(puzzle)
        elif content_type == RoomContentType.SECRET_ROOM:
            secret_room = kwargs.get('secret_room', None)
            return SecretRoomContent(secret_room)
        else:
            # For future room types
            return content_class(**kwargs)
            
    @classmethod
    def get_random_content(cls, dungeon_level: int, exclude_types: List[RoomContentType] = None) -> RoomContent:
        """Generate random room content based on dungeon level."""
        from monsters import Goblin, Orc, Slime, SkeletonArcher, Bandit, Troll, Mimic, Spider
        from equipment import (RustyDagger, IronSword, SteelSword,
                               LeatherArmor, ChainMail,
                               LuckyCharm, HealthRing)
        
        if exclude_types is None:
            exclude_types = [RoomContentType.STAIRS]  # Never randomly generate stairs
            
        # Define probabilities based on dungeon level
        if dungeon_level <= 2:
            weights = {
                RoomContentType.MONSTER: 0.42,
                RoomContentType.TREASURE: 0.12,
                RoomContentType.EMPTY: 0.18,
                RoomContentType.EQUIPMENT: 0.08,
                RoomContentType.MERCHANT: 0.05,
                RoomContentType.HEALING_FOUNTAIN: 0.05,
                RoomContentType.TRAP: 0.05,
                RoomContentType.PUZZLE: 0.05  # Puzzles start appearing early
            }
        else:
            weights = {
                RoomContentType.MONSTER: 0.35,
                RoomContentType.TREASURE: 0.10,
                RoomContentType.EMPTY: 0.13,
                RoomContentType.EQUIPMENT: 0.12,
                RoomContentType.MERCHANT: 0.06,
                RoomContentType.HEALING_FOUNTAIN: 0.07,
                RoomContentType.TRAP: 0.10,
                RoomContentType.PUZZLE: 0.07  # More puzzles in deeper levels
            }
            
        # Remove excluded types
        for exclude in exclude_types:
            weights.pop(exclude, None)
            
        # Normalize weights
        total = sum(weights.values())
        weights = {k: v/total for k, v in weights.items()}
        
        # Choose content type
        content_type = random.choices(
            list(weights.keys()),
            list(weights.values())
        )[0]
        
        # Generate appropriate content
        if content_type == RoomContentType.MONSTER:
            # Monster selection based on dungeon level
            if dungeon_level <= 2:
                monster_pool = [Goblin, Goblin, Slime, Spider]
            elif dungeon_level <= 4:
                monster_pool = [Goblin, Orc, Slime, Spider, SkeletonArcher, Bandit]
            elif dungeon_level <= 7:
                monster_pool = [Orc, Slime, Spider, SkeletonArcher, Bandit, Troll]
            else:
                monster_pool = [Orc, Spider, SkeletonArcher, Bandit, Troll, Troll]
                
            # Small chance for mimic
            if random.random() < MIMIC_SPAWN_CHANCE:
                return cls.create(RoomContentType.MONSTER, monster=Mimic())
            else:
                monster_class = random.choice(monster_pool)
                return cls.create(RoomContentType.MONSTER, monster=monster_class())
                
        elif content_type == RoomContentType.TREASURE:
            gold_amount = random.randint(TREASURE_GOLD_MIN, TREASURE_GOLD_MAX) * dungeon_level
            return cls.create(RoomContentType.TREASURE, gold_amount=gold_amount)
            
        elif content_type == RoomContentType.EQUIPMENT:
            # Equipment quality based on dungeon level
            if dungeon_level <= 2:
                equipment_pool = [RustyDagger, LeatherArmor, HealthRing]
            elif dungeon_level <= 5:
                equipment_pool = [IronSword, LeatherArmor, ChainMail, LuckyCharm, HealthRing]
            else:
                equipment_pool = [IronSword, SteelSword, ChainMail, LuckyCharm, HealthRing]
                
            equipment_class = random.choice(equipment_pool)
            return cls.create(RoomContentType.EQUIPMENT, equipment=equipment_class())
            
        elif content_type == RoomContentType.MERCHANT:
            return cls.create(RoomContentType.MERCHANT)
            
        elif content_type == RoomContentType.HEALING_FOUNTAIN:
            return cls.create(RoomContentType.HEALING_FOUNTAIN)
            
        elif content_type == RoomContentType.TRAP:
            return cls.create(RoomContentType.TRAP)
            
        else:  # EMPTY
            return cls.create(RoomContentType.EMPTY)
            
    @classmethod
    def create_boss_room(cls, dungeon_level: int) -> RoomContent:
        """Create a boss room appropriate for the dungeon level."""
        from monsters import GoblinKing, OrcWarlord, SkeletonLord, TrollChieftain, ShadowLord
        
        # Choose boss based on dungeon level
        if dungeon_level <= 3:
            boss = GoblinKing()
        elif dungeon_level <= 6:
            boss = OrcWarlord()
        elif dungeon_level <= 10:
            boss = SkeletonLord()
        elif dungeon_level <= 15:
            boss = TrollChieftain()
        else:
            boss = ShadowLord()
            
        return cls.create(RoomContentType.BOSS, boss=boss)
        
    @classmethod
    def get_random_content_with_scaling(cls, dungeon_level: int, game=None, exclude_types=None) -> RoomContent:
        """Create random room content with difficulty scaling applied."""
        content = cls.get_random_content(dungeon_level, exclude_types)
        
        # Apply difficulty scaling if game context is provided
        if game and hasattr(content, 'monster') and content.monster:
            # Apply base difficulty scaling
            game.difficulty_manager.scale_monster_stats(content.monster, dungeon_level)
            
            # Check for elite monster creation
            if game.difficulty_manager.should_create_elite_monster(dungeon_level):
                content.monster = game.difficulty_manager.create_elite_monster(content.monster)
                
        return content


# Register default room types
RoomContentFactory.register(RoomContentType.EMPTY, EmptyRoom)
RoomContentFactory.register(RoomContentType.MONSTER, MonsterRoom)
RoomContentFactory.register(RoomContentType.TREASURE, TreasureRoom)
RoomContentFactory.register(RoomContentType.EQUIPMENT, EquipmentRoom)
RoomContentFactory.register(RoomContentType.STAIRS, StairsRoom)
RoomContentFactory.register(RoomContentType.MERCHANT, MerchantRoom)
RoomContentFactory.register(RoomContentType.HEALING_FOUNTAIN, HealingFountainRoom)
RoomContentFactory.register(RoomContentType.TRAP, TrapRoom)
RoomContentFactory.register(RoomContentType.BOSS, BossRoom)


class PuzzleRoom(RoomContent):
    """A room containing a puzzle that can unlock rewards or secrets."""
    
    def __init__(self, puzzle=None):
        super().__init__()
        self.content_type = RoomContentType.PUZZLE
        self.puzzle = puzzle
        self.rewards_claimed = False
        
    def on_enter(self, game) -> List[str]:
        """Handle entering a puzzle room."""
        if not self.explored:
            self.explored = True
            if self.puzzle:
                return [
                    "🧩 You enter a mysterious chamber filled with ancient mechanisms.",
                    f"📋 {self.puzzle.description}",
                    "Something tells you this puzzle holds secrets..."
                ]
            else:
                return ["🧩 You enter a room with mysterious markings on the walls."]
        else:
            if self.puzzle and self.puzzle.solved and not self.rewards_claimed:
                return ["🧩 The solved puzzle glows with mystical energy."]
            elif self.puzzle and self.puzzle.failed:
                return ["🧩 The failed puzzle mechanism lies dormant and broken."]
            else:
                return ["🧩 You return to the puzzle chamber."]
                
    def get_description(self) -> str:
        """Get description of the puzzle room."""
        if self.puzzle:
            if self.puzzle.solved:
                return "A solved puzzle chamber with mystical energy."
            elif self.puzzle.failed:
                return "A chamber with a broken puzzle mechanism."
            else:
                return f"A chamber containing {self.puzzle.name.lower()}."
        return "A mysterious chamber with ancient markings."
        
    def interact(self, game, action: str) -> List[str]:
        """Handle interaction with the puzzle."""
        if not self.puzzle:
            return ["There's nothing to interact with here."]
            
        if action.lower() == "examine puzzle":
            return [self.puzzle.get_prompt()]
        elif action.lower().startswith("solve "):
            answer = action[6:].strip()  # Remove "solve " prefix
            return self._attempt_solve(game, answer)
        elif action.lower() == "hint":
            hint = game.puzzle_manager.get_puzzle_hint(str(game.dungeon_map.current_position))
            return [hint] if hint else ["No hint available."]
        else:
            return [
                "Available actions:",
                "• 'examine puzzle' - Look at the puzzle",
                "• 'solve [answer]' - Attempt to solve with your answer",
                "• 'hint' - Get a hint (if available)"
            ]
            
    def _attempt_solve(self, game, answer: str) -> List[str]:
        """Attempt to solve the puzzle."""
        room_pos = str(game.dungeon_map.current_position)
        success, message, reward = game.puzzle_manager.solve_puzzle(room_pos, answer)
        
        messages = [message]
        
        if success and reward and not self.rewards_claimed:
            self.rewards_claimed = True
            
            # Award gold
            if reward.gold > 0:
                game.player.gold += reward.gold
                messages.append(f"💰 You receive {reward.gold} gold!")
                
            # Award XP
            if reward.xp > 0:
                leveled = game.player.gain_xp(reward.xp)
                messages.append(f"⭐ You gain {reward.xp} XP!")
                if leveled:
                    messages.append(f"🎉 Level up! You are now level {game.player.level}!")
                    
            # Award items
            for item in reward.items:
                if game.player.inventory.add_item(item):
                    messages.append(f"🎁 You receive {item.name}!")
                else:
                    messages.append(f"🎁 You receive {item.name}, but your inventory is full!")
                    
            # Unlock secret room
            if reward.unlock_secret:
                secret_room = game.puzzle_manager.unlock_secret_room(self.puzzle.puzzle_id)
                if secret_room:
                    discovery_msg = secret_room.discover()
                    messages.append(discovery_msg)
                    
            # Achievement tracking
            game.achievement_manager.check_puzzle_achievements(game.player, self.puzzle)
                    
        return messages


class SecretRoomContent(RoomContent):
    """A secret room that can only be accessed through puzzle solving."""
    
    def __init__(self, secret_room=None):
        super().__init__()
        self.content_type = RoomContentType.SECRET_ROOM
        self.secret_room = secret_room
        
    def on_enter(self, game) -> List[str]:
        """Handle entering a secret room."""
        if not self.secret_room:
            return ["🔍 You enter what appears to be a hidden chamber."]
            
        if not self.secret_room.discovered:
            # This shouldn't happen if properly implemented
            return ["🔍 You sense hidden secrets, but cannot access them yet."]
            
        if not self.explored:
            self.explored = True
            return [
                f"🌟 {self.secret_room.name} 🌟",
                self.secret_room.description,
                "This secret chamber pulses with mysterious energy."
            ]
        else:
            if self.secret_room.looted:
                return [f"🌟 You return to the empty {self.secret_room.name}."]
            else:
                return [f"🌟 You return to the {self.secret_room.name}. Its treasures await."]
                
    def get_description(self) -> str:
        """Get description of the secret room."""
        if self.secret_room:
            if self.secret_room.looted:
                return f"An empty {self.secret_room.name.lower()}."
            else:
                return f"A {self.secret_room.name.lower()} filled with treasures."
        return "A mysterious hidden chamber."
        
    def interact(self, game, action: str) -> List[str]:
        """Handle interaction with the secret room."""
        if not self.secret_room:
            return ["There's nothing special here."]
            
        if action.lower() in ["loot", "search", "treasure"]:
            return self.secret_room.loot(game)
        else:
            if self.secret_room.looted:
                return ["This secret room has already been thoroughly searched."]
            else:
                return [
                    "You see valuable treasures and items scattered about.",
                    "Type 'loot' to collect the treasures."
                ]


# Register the new room types
RoomContentFactory.register(RoomContentType.PUZZLE, PuzzleRoom)
RoomContentFactory.register(RoomContentType.SECRET_ROOM, SecretRoomContent)
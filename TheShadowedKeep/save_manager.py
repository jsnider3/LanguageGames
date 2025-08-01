"""
Save/Load system for The Shadowed Keep.
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional


class SaveManager:
    """Manages game save/load functionality."""
    
    def __init__(self, save_dir: str = "saves"):
        self.save_dir = save_dir
        self.autosave_file = os.path.join(save_dir, "autosave.json")
        self._ensure_save_directory()
        
    def _ensure_save_directory(self):
        """Create save directory if it doesn't exist."""
        if not os.path.exists(self.save_dir):
            os.makedirs(self.save_dir)
            
    def save_game(self, game_state: Dict[str, Any], filename: Optional[str] = None) -> str:
        """
        Save the game state to a file.
        Returns the path to the saved file.
        """
        if filename is None:
            filename = self.autosave_file
        else:
            filename = os.path.join(self.save_dir, filename)
            
        # Add metadata
        save_data = {
            "version": "1.0",
            "timestamp": datetime.now().isoformat(),
            "game_state": game_state
        }
        
        # Write to file
        with open(filename, 'w') as f:
            json.dump(save_data, f, indent=2)
            
        return filename
        
    def load_game(self, filename: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Load a game state from a file.
        Returns the game state or None if not found.
        """
        if filename is None:
            filename = self.autosave_file
        else:
            filename = os.path.join(self.save_dir, filename)
            
        if not os.path.exists(filename):
            return None
            
        try:
            with open(filename, 'r') as f:
                save_data = json.load(f)
                
            # Check version compatibility
            if save_data.get("version") != "1.0":
                print(f"Warning: Save file version {save_data.get('version')} may not be compatible.")
                
            return save_data.get("game_state")
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading save file: {e}")
            return None
            
    def delete_save(self, filename: Optional[str] = None) -> bool:
        """
        Delete a save file.
        Returns True if successful, False otherwise.
        """
        if filename is None:
            filename = self.autosave_file
        else:
            filename = os.path.join(self.save_dir, filename)
            
        if os.path.exists(filename):
            try:
                os.remove(filename)
                return True
            except OSError:
                return False
        return False
        
    def list_saves(self) -> list:
        """
        List all save files in the save directory.
        Returns a list of save file info.
        """
        saves = []
        
        if not os.path.exists(self.save_dir):
            return saves
            
        for filename in os.listdir(self.save_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.save_dir, filename)
                try:
                    with open(filepath, 'r') as f:
                        save_data = json.load(f)
                    
                    saves.append({
                        "filename": filename,
                        "timestamp": save_data.get("timestamp", "Unknown"),
                        "version": save_data.get("version", "Unknown")
                    })
                except (json.JSONDecodeError, IOError):
                    continue
                    
        return sorted(saves, key=lambda x: x["timestamp"], reverse=True)
        
    def has_autosave(self) -> bool:
        """Check if an autosave exists."""
        return os.path.exists(self.autosave_file)


def serialize_game_state(game) -> Dict[str, Any]:
    """
    Convert a Game instance to a serializable dictionary.
    """
    from dungeon_map import RoomState
    
    # Serialize player state
    player_data = {
        "name": game.player.name,
        "hp": game.player.hp,
        "max_hp": game.player.max_hp,
        "base_attack_power": game.player.base_attack_power,
        "base_defense": game.player.base_defense,
        "gold": game.player.gold,
        "dungeon_level": game.player.dungeon_level,
        "level": game.player.level,
        "xp": game.player.xp,
        "xp_to_next_level": game.player.xp_to_next_level,
        "_base_max_hp": game.player._base_max_hp,
        "equipment": serialize_equipment(game.player.equipment),
        "character_class": serialize_character_class(game.player.character_class)
    }
    
    # Serialize dungeon map
    map_data = {
        "width": game.dungeon_map.width,
        "height": game.dungeon_map.height,
        "current_position": game.dungeon_map.current_position,
        "stairs_position": game.dungeon_map.stairs_position,
        "rooms": serialize_rooms(game.dungeon_map.rooms)
    }
    
    # Serialize difficulty data
    difficulty_data = {
        "difficulty_manager": game.difficulty_manager.save_to_dict(),
        "adaptive_difficulty": {
            "player_performance_score": game.adaptive_difficulty.player_performance_score,
            "recent_deaths": game.adaptive_difficulty.recent_deaths,
            "recent_victories": game.adaptive_difficulty.recent_victories,
            "enabled": game.adaptive_difficulty.enabled
        }
    }
    
    # Serialize game state
    return {
        "player": player_data,
        "dungeon_map": map_data,
        "floor_number": game.floor_number,
        "dungeon_level": game.dungeon_level,
        "difficulty": difficulty_data
    }


def serialize_equipment(equipment_manager) -> Dict[str, Any]:
    """Serialize equipment manager state."""
    slots_data = {}
    for slot, item in equipment_manager.slots.items():
        if item:
            slots_data[slot.value] = {
                "name": item.name,
                "class": item.__class__.__name__
            }
        else:
            slots_data[slot.value] = None
    return {"slots": slots_data}


def serialize_character_class(character_class) -> Dict[str, Any]:
    """Serialize character class state."""
    data = {
        "class_type": character_class.class_type.value,
        "name": character_class.name
    }
    
    # Save mage-specific data
    if hasattr(character_class, 'current_mana'):
        data["current_mana"] = character_class.current_mana
        data["max_mana"] = character_class.max_mana
        
    # Save rogue-specific data
    if hasattr(character_class, 'sneak_attack_used'):
        data["sneak_attack_used"] = character_class.sneak_attack_used
        
    return data


def serialize_rooms(rooms: Dict) -> list:
    """Serialize room dictionary."""
    from room_content import RoomContentType
    
    room_list = []
    for pos, room in rooms.items():
        room_data = {
            "x": room.x,
            "y": room.y,
            "state": room.state.value,
            "connections": {d.value: True for d in room.connections}
        }
        
        # Serialize room content if present
        if room.content:
            room_data["content_type"] = room.content.content_type.value
            room_data["content_cleared"] = room.content.is_cleared()
            
            # Add specific content data based on type
            if room.content.content_type == RoomContentType.TREASURE:
                room_data["gold_amount"] = room.content.gold_amount
            elif room.content.content_type == RoomContentType.MONSTER:
                room_data["monster_type"] = room.content.monster.__class__.__name__
                room_data["monster_hp"] = room.content.monster.hp
            elif room.content.content_type == RoomContentType.EQUIPMENT:
                room_data["equipment_type"] = room.content.equipment.__class__.__name__
        else:
            room_data["content_type"] = None
            
        room_list.append(room_data)
    return room_list


def deserialize_game_state(game, state: Dict[str, Any]):
    """
    Restore a Game instance from a serialized state.
    """
    from dungeon_map import Room, RoomState, Direction
    from equipment import (RustyDagger, IronSword, SteelSword,
                          LeatherArmor, ChainMail,
                          LuckyCharm, HealthRing)
    
    # Restore player state
    player_data = state["player"]
    game.player.name = player_data["name"]
    game.player.hp = player_data["hp"]
    game.player.max_hp = player_data["max_hp"]
    game.player.base_attack_power = player_data["base_attack_power"]
    game.player.base_defense = player_data.get("base_defense", 0)
    game.player.gold = player_data["gold"]
    game.player.dungeon_level = player_data["dungeon_level"]
    game.player.level = player_data["level"]
    game.player.xp = player_data["xp"]
    game.player.xp_to_next_level = player_data["xp_to_next_level"]
    game.player._base_max_hp = player_data["_base_max_hp"]
    
    # Restore character class
    if "character_class" in player_data:
        from character_classes import CharacterClassFactory, CharacterClass
        class_data = player_data["character_class"]
        character_class = CharacterClassFactory.create(CharacterClass(class_data["class_type"]))
        
        # Restore mage mana
        if hasattr(character_class, 'current_mana') and "current_mana" in class_data:
            character_class.current_mana = class_data["current_mana"]
            character_class.max_mana = class_data["max_mana"]
            
        # Restore rogue sneak attack state
        if hasattr(character_class, 'sneak_attack_used') and "sneak_attack_used" in class_data:
            character_class.sneak_attack_used = class_data["sneak_attack_used"]
            
        game.player.character_class = character_class
    
    # Restore equipment
    equipment_classes = {
        "RustyDagger": RustyDagger,
        "IronSword": IronSword,
        "SteelSword": SteelSword,
        "LeatherArmor": LeatherArmor,
        "ChainMail": ChainMail,
        "LuckyCharm": LuckyCharm,
        "HealthRing": HealthRing
    }
    
    for slot_name, item_data in player_data["equipment"]["slots"].items():
        if item_data:
            item_class = equipment_classes.get(item_data["class"])
            if item_class:
                item = item_class()
                # Find the correct slot enum
                from equipment import EquipmentSlot
                for slot in EquipmentSlot:
                    if slot.value == slot_name:
                        game.player.equipment.equip(item)
                        break
    
    # Update player HP after equipment
    game.player.update_max_hp()
    
    # Restore dungeon map
    map_data = state["dungeon_map"]
    game.dungeon_map.width = map_data["width"]
    game.dungeon_map.height = map_data["height"]
    game.dungeon_map.current_position = tuple(map_data["current_position"])
    game.dungeon_map.stairs_position = tuple(map_data["stairs_position"]) if map_data["stairs_position"] else None
    
    # Restore rooms
    game.dungeon_map.rooms = {}
    for room_data in map_data["rooms"]:
        room = Room(room_data["x"], room_data["y"])
        room.state = RoomState(room_data["state"])
        
        # Restore room content if present
        if room_data.get("content_type"):
            from room_content import RoomContentType, RoomContentFactory
            from monsters import (Goblin, Orc, Slime, SkeletonArcher, Bandit, Troll, Mimic)
            
            content_type = RoomContentType(room_data["content_type"])
            
            # Recreate room content based on type
            if content_type == RoomContentType.MONSTER:
                # Recreate the monster
                monster_classes = {
                    "Goblin": Goblin,
                    "Orc": Orc,
                    "Slime": Slime,
                    "SkeletonArcher": SkeletonArcher,
                    "Bandit": Bandit,
                    "Troll": Troll,
                    "Mimic": Mimic
                }
                monster_class = monster_classes.get(room_data["monster_type"])
                if monster_class:
                    monster = monster_class()
                    monster.hp = room_data["monster_hp"]
                    room.content = RoomContentFactory.create(content_type, monster=monster)
                    room.content.defeated = room_data["content_cleared"]
                    
            elif content_type == RoomContentType.TREASURE:
                room.content = RoomContentFactory.create(content_type, gold_amount=room_data["gold_amount"])
                room.content.looted = room_data["content_cleared"]
                
            elif content_type == RoomContentType.EQUIPMENT:
                # Recreate equipment
                equipment_class = equipment_classes.get(room_data["equipment_type"])
                if equipment_class:
                    equipment = equipment_class()
                    room.content = RoomContentFactory.create(content_type, equipment=equipment)
                    room.content.taken = room_data["content_cleared"]
                    
            elif content_type == RoomContentType.STAIRS:
                room.content = RoomContentFactory.create(content_type)
                
            elif content_type == RoomContentType.EMPTY:
                room.content = RoomContentFactory.create(content_type)
                room.content.explored = room_data["content_cleared"]
        
        # Restore connections
        for dir_name in room_data["connections"]:
            for direction in Direction:
                if direction.value == dir_name:
                    room.connect(direction)
                    break
                    
        game.dungeon_map.rooms[(room.x, room.y)] = room
    
    # Restore difficulty data
    if "difficulty" in state:
        difficulty_data = state["difficulty"]
        
        # Restore difficulty manager
        if "difficulty_manager" in difficulty_data:
            game.difficulty_manager.load_from_dict(difficulty_data["difficulty_manager"])
            
        # Restore adaptive difficulty
        if "adaptive_difficulty" in difficulty_data:
            adaptive_data = difficulty_data["adaptive_difficulty"]
            game.adaptive_difficulty.player_performance_score = adaptive_data.get("player_performance_score", 0.0)
            game.adaptive_difficulty.recent_deaths = adaptive_data.get("recent_deaths", 0)
            game.adaptive_difficulty.recent_victories = adaptive_data.get("recent_victories", 0)
            game.adaptive_difficulty.enabled = adaptive_data.get("enabled", True)
    
    # Restore game state
    game.floor_number = state["floor_number"]
    game.dungeon_level = state["dungeon_level"]
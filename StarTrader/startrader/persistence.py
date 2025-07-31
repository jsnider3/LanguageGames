"""
Persistence system for Star Trader.

Handles saving and loading game state to/from JSON files, including
player data, galaxy state, missions, ships, crew, and all game progress.
"""

import json
import os
from typing import Dict, Any

from .classes import Ship, Mission, CrewMember, AICaptain, Factory


class SaveLoadManager:
    """Handles saving and loading game state."""
    
    def __init__(self, save_file_name: str = "savegame.json"):
        """Initialize the save/load manager.
        
        Args:
            save_file_name: The filename to use for saves
        """
        self.save_file_name = save_file_name
    
    def save_game(self, game) -> None:
        """Save the current game state to a file.
        
        Args:
            game: The game instance to save
        """
        game_state = self._create_save_data(game)
        
        with open(self.save_file_name, 'w') as f:
            json.dump(game_state, f, indent=4)
        print(f"Game saved to {self.save_file_name}.")
    
    def load_game(self, game) -> bool:
        """Load game state from a file.
        
        Args:
            game: The game instance to load into
            
        Returns:
            True if load successful, False otherwise
        """
        if not os.path.exists(self.save_file_name):
            print("No save file found.")
            return False
        
        try:
            with open(self.save_file_name, 'r') as f:
                game_state = json.load(f)
            
            self._restore_game_state(game, game_state)
            print("Game loaded successfully.")
            return True
            
        except Exception as e:
            print(f"Error loading save file: {e}")
            return False
    
    def save_exists(self) -> bool:
        """Check if a save file exists.
        
        Returns:
            True if save file exists
        """
        return os.path.exists(self.save_file_name)
    
    def _create_save_data(self, game) -> Dict[str, Any]:
        """Create the save data dictionary from game state.
        
        Args:
            game: The game instance
            
        Returns:
            Dictionary containing all save data
        """
        return {
            "player": self._create_player_data(game.player),
            "galaxy": self._create_galaxy_data(game.galaxy),
            "current_day": game.current_day,
            "victory_state": game.victory_manager.to_dict()
        }
    
    def _create_player_data(self, player) -> Dict[str, Any]:
        """Create player save data.
        
        Args:
            player: The player instance
            
        Returns:
            Dictionary containing player data
        """
        return {
            "name": player.name,
            "credits": player.credits,
            "location_name": player.location.name,
            "reputation": player.reputation,
            "skills": player.skills,
            "wanted_level": player.wanted_level,
            "wanted_by": player.wanted_by,
            "visited_systems": list(player.visited_systems),
            "active_missions": [m.to_dict() for m in player.active_missions],
            "crew": [c.to_dict() for c in player.crew],
            "ai_captains": [c.to_dict() for c in player.ai_captains],
            "factories": [f.to_dict() for f in player.factories],
            "active_ship_index": player.active_ship_index,
            "ships": [self._create_ship_data(ship) for ship in player.ships]
        }
    
    def _create_ship_data(self, ship) -> Dict[str, Any]:
        """Create ship save data.
        
        Args:
            ship: The ship instance
            
        Returns:
            Dictionary containing ship data
        """
        return {
            "id": ship.id,
            "ship_class": ship.ship_class,
            "custom_name": ship.custom_name,
            "modules": ship.modules,
            "hull": ship.hull,
            "fuel": ship.fuel,
            "cargo_hold": ship.cargo_hold,
            "location_name": ship.location.name if ship.location else None,
            "experience": ship.experience,
            "specialization": ship.specialization,
            "level": ship.level,
            "visited_systems": list(ship.visited_systems),
            # Store basic attributes for restoration
            "damage": ship.damage,
            "shield": ship.shield,
            "max_shield": ship.max_shield,
            "evasion": ship.evasion
        }
    
    def _create_galaxy_data(self, galaxy) -> Dict[str, Any]:
        """Create galaxy save data.
        
        Args:
            galaxy: The galaxy instance
            
        Returns:
            Dictionary containing galaxy data
        """
        return {
            "active_events": galaxy.active_events,
            "galactic_events": galaxy.galactic_events,
            "faction_relations": galaxy.faction_relations,
            "markets": {name: sys.market for name, sys in galaxy.systems.items()},
            "available_missions": {
                name: [m.to_dict() for m in sys.available_missions] 
                for name, sys in galaxy.systems.items()
            },
            "uncharted_discovered": {
                name: sys.discovered 
                for name, sys in galaxy.uncharted_systems.items() 
                if sys.discovered
            }
        }
    
    def _restore_game_state(self, game, game_state: Dict[str, Any]) -> None:
        """Restore game state from save data.
        
        Args:
            game: The game instance to restore into
            game_state: The loaded save data
        """
        # Restore player
        self._restore_player(game.player, game_state["player"], game.galaxy)
        
        # Restore galaxy
        self._restore_galaxy(game.galaxy, game_state["galaxy"])
        
        # Restore game state
        game.current_day = game_state["current_day"]
        
        # Restore victory state
        if "victory_state" in game_state:
            game.victory_manager.from_dict(game_state["victory_state"])
        else:
            # Backward compatibility with old saves
            game.victory_manager.victory = game_state.get("victory", False)
            game.victory_manager.victory_type = game_state.get("victory_type", None)
            game.victory_manager.victory_announced = game_state.get("victory_announced", False)
        
        # Update player location reference
        game.player.location = game.galaxy.systems[game_state["player"]["location_name"]]
    
    def _restore_player(self, player, player_data: Dict[str, Any], galaxy) -> None:
        """Restore player state from save data.
        
        Args:
            player: The player instance
            player_data: The player save data
            galaxy: The galaxy instance (for mission restoration)
        """
        player.name = player_data["name"]
        player.credits = player_data["credits"]
        player.reputation = player_data["reputation"]
        player.skills = player_data.get("skills", {
            "piloting": 0, "negotiation": 0, "mechanics": 0, "leadership": 0
        })
        player.wanted_level = player_data.get("wanted_level", 0)
        player.wanted_by = player_data.get("wanted_by", {})
        player.visited_systems = set(player_data.get("visited_systems", ["Sol"]))
        
        # Restore fleet
        self._restore_fleet(player, player_data, galaxy)
        
        # Restore crew
        player.crew = [CrewMember.from_dict(cd) for cd in player_data.get("crew", [])]
        
        # Restore AI captains
        player.ai_captains = [AICaptain.from_dict(cd) for cd in player_data.get("ai_captains", [])]
        
        # Assign captains back to ships
        for captain in player.ai_captains:
            if captain.assigned_ship_id:
                for ship in player.ships:
                    if ship.id == captain.assigned_ship_id:
                        ship.captain = captain
                        break
        
        # Restore factories
        player.factories = [Factory.from_dict(fd) for fd in player_data.get("factories", [])]
        
        # Restore missions
        player.active_missions = [
            Mission.from_dict(md, galaxy) 
            for md in player_data["active_missions"]
        ]
    
    def _restore_fleet(self, player, player_data: Dict[str, Any], galaxy) -> None:
        """Restore player's fleet from save data.
        
        Args:
            player: The player instance
            player_data: The player save data
            galaxy: The galaxy instance
        """
        if "ships" in player_data:
            # New save format with multiple ships
            player.ships = []
            for ship_data in player_data["ships"]:
                ship = self._restore_ship(ship_data, galaxy)
                player.ships.append(ship)
            player.active_ship_index = player_data.get("active_ship_index", 0)
        else:
            # Old save format with single ship (backward compatibility)
            ship_data = player_data["ship"]
            player.ships = []
            ship = Ship(ship_data.get("ship_class", "starter_ship"))
            ship.id = "ship_001"
            ship.modules = ship_data["modules"]
            ship.hull = ship_data["hull"]
            ship.fuel = ship_data["fuel"]
            ship.cargo_hold = ship_data["cargo_hold"]
            # Restore experience data
            if "experience" in ship_data:
                ship.experience = ship_data["experience"]
                ship.specialization = ship_data.get("specialization")
                ship.level = ship_data.get("level", 1)
                ship.visited_systems = set(ship_data.get("visited_systems", []))
            player.ships.append(ship)
            player.active_ship_index = 0
    
    def _restore_ship(self, ship_data: Dict[str, Any], galaxy) -> Ship:
        """Restore a ship from save data.
        
        Args:
            ship_data: The ship save data
            galaxy: The galaxy instance
            
        Returns:
            Restored ship instance
        """
        ship = Ship(ship_data["ship_class"])
        ship.id = ship_data["id"]
        ship.custom_name = ship_data.get("custom_name")
        ship.modules = ship_data["modules"]
        ship.hull = ship_data["hull"]
        ship.fuel = ship_data["fuel"]
        ship.cargo_hold = ship_data["cargo_hold"]
        
        if ship_data.get("location_name"):
            ship.location = galaxy.systems[ship_data["location_name"]]
        
        # Restore experience data
        if "experience" in ship_data:
            ship.experience = ship_data["experience"]
            ship.specialization = ship_data.get("specialization")
            ship.level = ship_data.get("level", 1)
            ship.visited_systems = set(ship_data.get("visited_systems", []))
        
        # Restore combat attributes if saved
        if "damage" in ship_data:
            ship.damage = ship_data["damage"]
            ship.shield = ship_data["shield"]
            ship.max_shield = ship_data["max_shield"]
            ship.evasion = ship_data["evasion"]
        
        return ship
    
    def _restore_galaxy(self, galaxy, galaxy_data: Dict[str, Any]) -> None:
        """Restore galaxy state from save data.
        
        Args:
            galaxy: The galaxy instance
            galaxy_data: The galaxy save data
        """
        galaxy.active_events = galaxy_data["active_events"]
        galaxy.galactic_events = galaxy_data.get("galactic_events", {})
        galaxy.faction_relations = galaxy_data.get(
            "faction_relations", 
            galaxy._init_faction_relations()
        )
        
        # Restore markets
        for name, market_data in galaxy_data["markets"].items():
            galaxy.systems[name].market = market_data
        
        # Restore missions
        for name, missions_data in galaxy_data["available_missions"].items():
            galaxy.systems[name].available_missions = [
                Mission.from_dict(md, galaxy) for md in missions_data
            ]
        
        # Restore uncharted system discoveries
        if "uncharted_discovered" in galaxy_data:
            for name in galaxy_data["uncharted_discovered"]:
                if name in galaxy.uncharted_systems:
                    system = galaxy.uncharted_systems[name]
                    system.discovered = True
                    # Re-add to main systems if discovered
                    galaxy.systems[name] = system
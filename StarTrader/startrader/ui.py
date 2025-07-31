"""
User interface and status display system for Star Trader.

Handles formatting and displaying player status, ship information,
and game state to the user.
"""

from typing import TYPE_CHECKING
from .game_data import FACTIONS

if TYPE_CHECKING:
    from .main import Game


class UIManager:
    """Manages user interface display and formatting."""
    
    def __init__(self, game: 'Game'):
        """Initialize the UI manager.
        
        Args:
            game: The game instance
        """
        self.game = game
    
    def get_status(self) -> str:
        """Generate and return the complete player status display.
        
        Returns:
            Formatted status string
        """
        ship = self.game.player.ship
        system = self.game.player.location
        connections = self.game.galaxy.connections.get(system.name, [])
        travel_options = ", ".join(connections) or "None"
        cargo_list = ", ".join(f"{item} ({qty})" for item, qty in ship.cargo_hold.items()) or "Empty"

        # Get faction ranks
        faction_ranks = []
        for faction in ["Federation", "Syndicate"]:
            rank = self.game.player.get_faction_rank(faction)
            rep = self.game.player.reputation.get(faction, 0)
            faction_ranks.append(f"{faction}: {rank['title']} (Rep: {rep})")
        
        # Get wanted status
        wanted_str = ""
        if self.game.player.wanted_level > 0:
            wanted_str = f"Global Wanted: {'★' * self.game.player.wanted_level} | "
        if self.game.player.wanted_by:
            faction_wanted = [f"{f}: {'★' * level}" for f, level in self.game.player.wanted_by.items()]
            wanted_str += " | ".join(faction_wanted)
        
        status = (
            f"--- Captain {self.game.player.name} ---\n"
            f"Credits: {self.game.player.credits}\n"
            f"Skills: Piloting {self.game.player.skills['piloting']} | Negotiation {self.game.player.skills['negotiation']} | Mechanics {self.game.player.skills['mechanics']} | Leadership {self.game.player.skills['leadership']}\n"
            f"Faction Ranks: {' | '.join(faction_ranks)}\n"
        )
        
        if wanted_str:
            status += f"WANTED STATUS: {wanted_str}\n"
            
        status += (
            f"\n--- Current Location: {system.name} ({system.economy_type})\n"
            f"System Faction: {system.faction} ({FACTIONS[system.faction]['name']})\n"
            f"Description: {system.description}\n"
            f"Reachable Systems: {travel_options}\n"
        )
        if system.name in self.game.galaxy.active_events:
            event = self.game.galaxy.active_events[system.name]
            status += f"EVENT: This system is experiencing a {event['type']}!\n"
        
        status += (
            f"\n--- Ship: {ship.name} ({ship.ship_class_data['name']}) ---\n"
            f"Level: {ship.level}"
        )
        if ship.specialization:
            status += f" | Specialization: {ship.specialization.title()}\n"
        else:
            status += "\n"
        status += (
            f"Experience: Trading {ship.experience['trading']} | Combat {ship.experience['combat']} | Exploration {ship.experience['exploration']}\n"
            f"Hull: {ship.hull}/{ship.max_hull}\n"
            f"Fuel: {ship.fuel}/{ship.max_fuel}\n"
            f"Cargo ({ship.get_cargo_used()}/{ship.cargo_capacity}): {cargo_list}\n"
            f"Weapon Damage: {ship.get_weapon_damage(self.game.player)}\n"
            f"Shield Strength: {ship.get_shield_strength()}\n"
            f"Fuel Efficiency: {ship.get_fuel_efficiency(self.game.player)}\n"
            f"\n--- Installed Modules ---\n"
        )
        if ship.modules:
            for module_name in ship.modules:
                status += f"  - {module_name}\n"
        else:
            status += "  None\n"

        if self.game.player.crew:
            status += "\n--- Crew ---\n"
            for member in self.game.player.crew:
                status += f"- {member.name} ({member.role}) | Morale: {member.morale}% | Experience: {member.experience} | Bonus: {member.skill_bonus:.2f}\n"

        if self.game.player.active_missions:
            status += f"\n--- Active Missions (Day {self.game.current_day}) ---\n"
            for mission in self.game.player.active_missions:
                status += f"- ID: {mission.id} | {mission.get_description()} (Expires: Day {mission.expiration_day})\n"
            
        return status
    
    def display_status(self) -> None:
        """Print the player's status to the console."""
        print(self.get_status())
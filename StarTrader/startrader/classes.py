import uuid
from .game_data import SHIP_CLASSES, MODULE_SPECS, GOODS, ILLEGAL_GOODS, FACTIONS

class Mission:
    """Represents a single mission."""
    def __init__(self, origin_system, destination_system, faction, good, quantity, mission_type="DELIVER", target_name=None):
        self.id = str(uuid.uuid4())[:4] # Short, readable ID
        self.type = mission_type
        self.origin_system = origin_system
        self.destination_system = destination_system
        self.faction = faction
        self.good = good
        self.quantity = quantity
        self.target_name = target_name
        
        # Calculate rewards & time limit
        if self.type == "BOUNTY":
            self.reward_credits = 5000
            self.reward_reputation = 25
        else:
            base_good_price = GOODS.get(good, ILLEGAL_GOODS.get(good, {"base_price": 0}))["base_price"]
            distance = 1 # Simplified for now
            self.reward_credits = int((base_good_price * quantity * 0.5) + (distance * 100))
            self.reward_reputation = 10
            
        self.time_limit = 15 # Days
        self.expiration_day = None

    def get_description(self):
        if self.type == "DELIVER":
            return (f"Deliver {self.quantity} {self.good} from {self.origin_system.name} to "
                    f"{self.destination_system.name} for the {self.faction}.")
        elif self.type == "PROCURE":
            return (f"Procure {self.quantity} {self.good} and deliver them to "
                    f"{self.destination_system.name} for the {self.faction}.")
        elif self.type == "BOUNTY":
            return (f"Hunt down the notorious pirate {self.target_name} last seen in the "
                    f"{self.destination_system.name} system for the {self.faction}.")

    def to_dict(self):
        """Converts the mission to a serializable dictionary."""
        return {
            "id": self.id,
            "type": self.type,
            "origin_system_name": self.origin_system.name,
            "destination_system_name": self.destination_system.name,
            "faction": self.faction,
            "good": self.good,
            "quantity": self.quantity,
            "target_name": self.target_name,
            "reward_credits": self.reward_credits,
            "reward_reputation": self.reward_reputation,
            "time_limit": self.time_limit,
            "expiration_day": self.expiration_day,
        }

    @classmethod
    def from_dict(cls, data, galaxy):
        """Creates a Mission object from a dictionary."""
        origin = galaxy.systems[data["origin_system_name"]]
        destination = galaxy.systems[data["destination_system_name"]]
        mission = cls(origin, destination, data["faction"], data["good"], data["quantity"], data["type"], data.get("target_name"))
        mission.id = data["id"]
        mission.reward_credits = data["reward_credits"]
        mission.reward_reputation = data["reward_reputation"]
        mission.time_limit = data["time_limit"]
        mission.expiration_day = data["expiration_day"]
        return mission

class CrewMember:
    """Represents a single crew member."""
    def __init__(self, name, role, skill_bonus, salary, description):
        self.name = name
        self.role = role
        self.skill_bonus = skill_bonus
        self.salary = salary
        self.description = description

    def to_dict(self):
        """Converts the crew member to a serializable dictionary."""
        return {
            "name": self.name,
            "role": self.role,
            "skill_bonus": self.skill_bonus,
            "salary": self.salary,
            "description": self.description,
        }

    @classmethod
    def from_dict(cls, data):
        """Creates a CrewMember object from a dictionary."""
        return cls(data["name"], data["role"], data["skill_bonus"], data["salary"], data["description"])

class StarSystem:
    """Represents a single star system in the galaxy."""
    def __init__(self, name, description, economy_type, faction, x, y, has_shipyard=False):
        self.name = name
        self.description = description
        self.economy_type = economy_type
        self.faction = faction
        self.x = x
        self.y = y
        self.has_shipyard = has_shipyard
        self.market = {}
        self.available_missions = []
        self.has_black_market = False
        self.recruitment_office = []

class Ship:
    """
    Represents the player's starship, composed of a hull and various modules.
    """
    def __init__(self, ship_class="starter_ship"):
        self.ship_class_data = SHIP_CLASSES[ship_class]
        self.name = self.ship_class_data["name"]
        self.hull = self.ship_class_data["base_hull"]
        self.fuel = self.ship_class_data["base_fuel"]
        self.max_fuel = self.ship_class_data["base_fuel"]
        self.cargo_hold = {}
        
        # Equip default modules
        self.modules = {
            "weapon": ["W-1"],
            "shield": ["S-1"],
            "engine": ["E-1"],
            "cargo_hold": ["CH-1"],
        }

    @property
    def max_hull(self):
        return self.ship_class_data["base_hull"]

    @property
    def cargo_capacity(self):
        total_capacity = 0
        for module_id in self.modules.get("cargo_hold", []):
            total_capacity += MODULE_SPECS["cargo_hold"][module_id]["capacity"]
        return total_capacity

    def get_fuel_efficiency(self, player):
        """Calculates fuel efficiency based on engine modules and crew."""
        base_efficiency = 1.0
        for module_id in self.modules.get("engine", []):
            efficiency = MODULE_SPECS["engine"][module_id]["fuel_efficiency"]
            if efficiency < base_efficiency:
                base_efficiency = efficiency
        
        # Apply engineer bonus
        engineer_bonus = player.get_crew_bonus("Engineer")
        return base_efficiency - engineer_bonus

    def get_shield_strength(self):
        total_strength = 0
        for module_id in self.modules.get("shield", []):
            total_strength += MODULE_SPECS["shield"][module_id]["strength"]
        return total_strength

    def get_weapon_damage(self, player):
        total_damage = 0
        for module_id in self.modules.get("weapon", []):
            total_damage += MODULE_SPECS["weapon"][module_id]["damage"]
            
        # Apply weapons officer bonus
        officer_bonus = player.get_crew_bonus("Weapons Officer")
        return total_damage + officer_bonus

    def get_cargo_used(self):
        return sum(self.cargo_hold.values())
    def add_cargo(self, good, quantity):
        self.cargo_hold[good] = self.cargo_hold.get(good, 0) + quantity
    def remove_cargo(self, good, quantity):
        if good in self.cargo_hold:
            self.cargo_hold[good] -= quantity
            if self.cargo_hold[good] <= 0:
                del self.cargo_hold[good]

class Player:
    """
    Represents the player.
    """
    def __init__(self, name="Captain"):
        self.name = name
        self.credits = 1000
        self.ship = Ship()
        self.location = None
        self.reputation = {faction: 0 for faction in FACTIONS}
        self.active_missions = []
        self.crew = []

    def add_reputation(self, faction, amount):
        if faction != "Independent":
            self.reputation[faction] += amount
            if amount > 0:
                print(f"Your reputation with {faction} has increased to {self.reputation[faction]}.")
            elif amount < 0:
                print(f"Your reputation with {faction} has decreased to {self.reputation[faction]}.")

    def get_crew_bonus(self, role):
        """Calculates the total skill bonus for a given role from all crew members."""
        bonus = 0
        for member in self.crew:
            if member.role == role:
                bonus += member.skill_bonus
        return bonus

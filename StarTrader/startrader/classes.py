"""
Core game classes for Star Trader.

This module defines the fundamental game objects including:
- Player: The player character with skills, reputation, and inventory
- Ship: Player's ship with upgrades, cargo, and combat capabilities  
- Mission: Various mission types (delivery, procurement, bounty hunting)
- CrewMember: Crew members with skills and morale
- AICaptain: AI-controlled captains for fleet management
- Factory: Production facilities for manufacturing goods

These classes form the backbone of the game's object model and contain
the core game logic for player progression, ship management, and
economic simulation.
"""

import uuid
import random
from .game_data import SHIP_CLASSES, MODULE_SPECS, GOODS, ILLEGAL_GOODS, FACTIONS, PRODUCTION_RECIPES, FACTION_RANKS

class Mission:
    """
    Represents a single mission that the player can accept and complete.
    
    Missions provide structure and goals for gameplay, offering rewards
    in the form of credits and faction reputation. There are several types:
    - DELIVER: Transport goods from origin to destination
    - PROCURE: Acquire goods and bring them to destination
    - BOUNTY: Hunt down specific pirate targets
    
    Attributes:
        id: Unique short identifier for the mission
        type: Mission type (DELIVER, PROCURE, BOUNTY)
        origin_system: System where mission was offered
        destination_system: System where mission must be completed
        faction: Faction offering the mission
        good: Type of good involved (None for bounty missions)
        quantity: Amount of goods involved (None for bounty missions)
        target_name: Name of bounty target (None for cargo missions)
        reward_credits: Credit reward for completion
        reward_reputation: Reputation reward for completion
        time_limit: Number of days to complete mission
        expiration_day: Game day when mission expires
    """
    def __init__(self, origin_system, destination_system, faction, good, quantity, mission_type="DELIVER", target_name=None):
        """
        Initialize a new mission.
        
        Args:
            origin_system: System where the mission is offered
            destination_system: System where mission must be completed
            faction: Faction offering the mission
            good: Type of good involved (None for bounty missions)
            quantity: Amount of goods (None for bounty missions)
            mission_type: Type of mission (DELIVER, PROCURE, BOUNTY)
            target_name: Name of bounty target (None for cargo missions)
        """
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

class Factory:
    """Represents a production facility owned by the player."""
    def __init__(self, system_name, product, level=1):
        self.id = str(uuid.uuid4())[:8]
        self.system_name = system_name
        self.product = product  # What this factory produces
        self.level = level  # Factory level (affects efficiency)
        self.efficiency = 1.0 + (level - 1) * 0.2  # 20% more efficient per level
        self.daily_cost = 50 * level  # Operating costs
        self.storage = {}  # Stored input materials
        self.output_storage = 0  # Stored output products
        self.days_since_production = 0
        self.total_profit = 0
        self.manager = None  # Can hire a manager for automation
        
    def get_recipe(self):
        """Get the production recipe for this factory's product."""
        return PRODUCTION_RECIPES.get(self.product)
    
    def can_produce(self):
        """Check if factory has enough materials to produce."""
        recipe = self.get_recipe()
        if not recipe:
            return False
            
        for input_good, required in recipe["inputs"].items():
            if self.storage.get(input_good, 0) < required:
                return False
        return True
    
    def produce(self):
        """Produce goods if materials are available."""
        if not self.can_produce():
            return False
            
        recipe = self.get_recipe()
        
        # Consume inputs
        for input_good, required in recipe["inputs"].items():
            self.storage[input_good] -= required
            
        # Produce output (with efficiency bonus)
        output_quantity = int(recipe["output_quantity"] * self.efficiency)
        self.output_storage += output_quantity
        self.days_since_production = 0
        
        return True
    
    def add_input(self, good, quantity):
        """Add input materials to factory storage."""
        self.storage[good] = self.storage.get(good, 0) + quantity
    
    def collect_output(self, quantity):
        """Collect produced goods from factory."""
        available = min(quantity, self.output_storage)
        self.output_storage -= available
        return available
    
    def upgrade(self):
        """Upgrade factory to next level."""
        upgrade_cost = 10000 * (self.level ** 2)
        self.level += 1
        self.efficiency = 1.0 + (self.level - 1) * 0.2
        self.daily_cost = 50 * self.level
        return upgrade_cost
    
    def to_dict(self):
        """Convert factory to dictionary for saving."""
        return {
            "id": self.id,
            "system_name": self.system_name,
            "product": self.product,
            "level": self.level,
            "storage": self.storage,
            "output_storage": self.output_storage,
            "days_since_production": self.days_since_production,
            "total_profit": self.total_profit,
            "manager": self.manager
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create factory from dictionary."""
        factory = cls(data["system_name"], data["product"], data["level"])
        factory.id = data["id"]
        factory.storage = data["storage"]
        factory.output_storage = data["output_storage"]
        factory.days_since_production = data["days_since_production"]
        factory.total_profit = data.get("total_profit", 0)
        factory.manager = data.get("manager")
        return factory

class AICaptain:
    """Represents an AI captain that can autonomously manage a ship."""
    def __init__(self, name, experience_level="novice", trade_style="balanced"):
        self.name = name
        self.experience_level = experience_level  # novice, experienced, veteran
        self.trade_style = trade_style  # aggressive, conservative, balanced
        self.assigned_ship_id = None
        self.trade_route = []  # List of system names
        self.current_target_index = 0
        self.preferred_goods = []  # Goods this captain specializes in
        self.total_profit = 0
        self.trips_completed = 0
        self.daily_wage = self._calculate_wage()
        
    def _calculate_wage(self):
        """Calculate daily wage based on experience."""
        wages = {
            "novice": 50,
            "experienced": 150,
            "veteran": 300
        }
        return wages.get(self.experience_level, 50)
    
    def get_profit_margin(self):
        """Get expected profit margin based on experience and style."""
        base_margins = {
            "novice": 0.05,
            "experienced": 0.10,
            "veteran": 0.15
        }
        style_modifiers = {
            "aggressive": 1.2,
            "conservative": 0.8,
            "balanced": 1.0
        }
        return base_margins[self.experience_level] * style_modifiers[self.trade_style]
    
    def get_risk_tolerance(self):
        """Get risk tolerance for dangerous routes."""
        base_risk = {
            "novice": 0.1,
            "experienced": 0.3,
            "veteran": 0.5
        }
        style_modifiers = {
            "aggressive": 1.5,
            "conservative": 0.5,
            "balanced": 1.0
        }
        return base_risk[self.experience_level] * style_modifiers[self.trade_style]
    
    def to_dict(self):
        """Convert captain to dictionary for saving."""
        return {
            "name": self.name,
            "experience_level": self.experience_level,
            "trade_style": self.trade_style,
            "assigned_ship_id": self.assigned_ship_id,
            "trade_route": self.trade_route,
            "current_target_index": self.current_target_index,
            "preferred_goods": self.preferred_goods,
            "total_profit": self.total_profit,
            "trips_completed": self.trips_completed
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create captain from dictionary."""
        captain = cls(data["name"], data["experience_level"], data["trade_style"])
        captain.assigned_ship_id = data.get("assigned_ship_id")
        captain.trade_route = data.get("trade_route", [])
        captain.current_target_index = data.get("current_target_index", 0)
        captain.preferred_goods = data.get("preferred_goods", [])
        captain.total_profit = data.get("total_profit", 0)
        captain.trips_completed = data.get("trips_completed", 0)
        return captain

class CrewMember:
    """Represents a single crew member."""
    def __init__(self, name, role, skill_bonus, salary, description, morale=50, experience=0):
        self.name = name
        self.role = role
        self.base_skill_bonus = skill_bonus
        self.salary = salary
        self.description = description
        self.morale = morale  # 0-100, affects performance
        self.experience = experience  # Gained through actions, affects skill bonus
        
    @property
    def skill_bonus(self):
        """Calculate effective skill bonus based on morale and experience."""
        experience_multiplier = 1 + (self.experience / 100) * 0.5  # Up to 50% bonus at 100 exp
        morale_multiplier = self.morale / 100  # Morale directly affects performance
        return self.base_skill_bonus * experience_multiplier * morale_multiplier

    def to_dict(self):
        """Converts the crew member to a serializable dictionary."""
        return {
            "name": self.name,
            "role": self.role,
            "skill_bonus": self.base_skill_bonus,
            "salary": self.salary,
            "description": self.description,
            "morale": self.morale,
            "experience": self.experience,
        }

    @classmethod
    def from_dict(cls, data):
        """Creates a CrewMember object from a dictionary."""
        return cls(data["name"], data["role"], data["skill_bonus"], data["salary"], data["description"], 
                  data.get("morale", 50), data.get("experience", 0))

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
        self.id = None  # Will be set when added to fleet
        self.ship_class = ship_class
        self.ship_class_data = SHIP_CLASSES[ship_class]
        self.name = self.ship_class_data["name"]
        self.custom_name = None  # Player can rename ships
        self.hull = self.ship_class_data["base_hull"]
        self.fuel = self.ship_class_data["base_fuel"]
        self.max_fuel = self.ship_class_data["base_fuel"]
        self.cargo_hold = {}
        self.location = None  # For ships not with player
        self.captain = None  # For AI captains
        
        # Ship experience and specialization
        self.experience = {
            "trading": 0,      # Earned from successful trades
            "combat": 0,       # Earned from combat victories
            "exploration": 0   # Earned from visiting new systems
        }
        self.specialization = None  # Will be set when reaching 100 exp in a category
        self.level = 1
        self.visited_systems = set()  # Track visited systems for exploration exp
        
        # Ship attributes (base values)
        self.damage = 10  # Base weapon damage
        self.shield = 20  # Base shield strength  
        self.max_shield = 20
        self.evasion = 10  # Base evasion
        
        # Installed upgrades (new module system)
        self.modules = []  # List of installed module names

    @property
    def max_hull(self):
        return self.ship_class_data["base_hull"]

    @property
    def cargo_capacity(self):
        # Base capacity from ship class
        base_capacity = self.ship_class_data.get("base_cargo", 20)
        
        # Add capacity from modules
        module_capacity = 0
        for module_name in self.modules:
            if module_name in MODULE_SPECS and MODULE_SPECS[module_name]["type"] == "cargo":
                module_capacity += MODULE_SPECS[module_name]["value"]
        
        return base_capacity + module_capacity

    def get_fuel_efficiency(self, player):
        """Calculates fuel efficiency based on engine modules and crew."""
        base_efficiency = 1.0
        
        # Apply engineer bonus and piloting skill
        engineer_bonus = player.get_crew_bonus("Engineer")
        piloting_bonus = player.get_skill_bonus("piloting") * 0.2  # Max 10% from piloting
        
        # Apply exploration specialization bonus
        exploration_bonus = 0
        if self.specialization == "exploration":
            exploration_bonus = (self.level - 1) * 0.05  # 5% per level
            
        return base_efficiency - engineer_bonus - piloting_bonus - exploration_bonus

    def get_shield_strength(self):
        """Get total shield strength including modules."""
        return self.max_shield

    def get_weapon_damage(self, player):
        """Get total weapon damage including modules and crew bonuses."""
        total_damage = self.damage
            
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
    
    def gain_experience(self, category, amount):
        """Add experience to a category and check for specialization/level up."""
        if category not in self.experience:
            return
            
        old_exp = self.experience[category]
        self.experience[category] += amount
        
        # Check for specialization (first category to reach 100)
        if self.specialization is None and self.experience[category] >= 100:
            self.specialization = category
            self.level = 2
            print(f"\n--- SHIP SPECIALIZATION ---")
            print(f"Your ship has specialized in {category.upper()}!")
            print(f"Ship is now level {self.level} with bonuses to {category} activities.")
            
        # Level up every 100 total experience
        total_exp = sum(self.experience.values())
        new_level = 1 + (total_exp // 100)
        if new_level > self.level:
            self.level = new_level
            print(f"Your ship has reached level {self.level}!")
    
    def get_specialization_bonus(self, category):
        """Get bonus multiplier for specialized activities."""
        if self.specialization != category:
            return 1.0
            
        # 10% bonus per level above 1
        return 1.0 + (self.level - 1) * 0.1

class Player:
    """
    Represents the player.
    """
    def __init__(self, name="Captain"):
        self.name = name
        self.credits = 1000
        self.location = None
        self.last_location = None
        self.reputation = {faction: 0 for faction in FACTIONS}
        self.active_missions = []
        self.crew = []
        self.skills = {
            "piloting": 0,      # Affects evasion in combat, fuel efficiency
            "negotiation": 0,   # Affects trade prices
            "mechanics": 0,     # Affects repair efficiency, module installation
            "leadership": 0     # Affects crew morale and performance
        }
        # Fleet management
        self.ships = []
        self.active_ship_index = 0
        # Create initial ship
        initial_ship = Ship()
        initial_ship.id = "ship_001"
        initial_ship.name = "Stardust Drifter"
        self.ships.append(initial_ship)
        
        # AI captains
        self.ai_captains = []
        
        # Factories owned
        self.factories = []
        
        # Wanted system
        self.wanted_level = 0  # 0-5 stars, 0 = not wanted
        self.wanted_by = {}  # {faction: wanted_level} for faction-specific wanted status
        
        # Exploration tracking
        self.visited_systems = {"Sol"}  # Start with Sol visited
    
    @property
    def ship(self):
        """Returns the currently active ship for backwards compatibility."""
        return self.ships[self.active_ship_index] if self.ships else None

    def add_reputation(self, faction, amount):
        if faction != "Independent":
            old_rep = self.reputation[faction]
            self.reputation[faction] += amount
            new_rep = self.reputation[faction]
            
            if amount > 0:
                print(f"Your reputation with {faction} has increased to {new_rep}.")
            elif amount < 0:
                print(f"Your reputation with {faction} has decreased to {new_rep}.")
                
            # Check for rank changes
            old_rank = self.get_faction_rank(faction, old_rep)
            new_rank = self.get_faction_rank(faction, new_rep)
            
            if old_rank["rank"] != new_rank["rank"]:
                if new_rep > old_rep:
                    print(f"\n--- PROMOTION ---")
                    print(f"You've been promoted to {new_rank['rank']} in the {faction}!")
                    print(f"Your new title: {new_rank['title']}")
                else:
                    print(f"\n--- DEMOTION ---")
                    print(f"You've been demoted to {new_rank['rank']} in the {faction}.")
                    print(f"Your new title: {new_rank['title']}")

    def get_crew_bonus(self, role):
        """Calculates the total skill bonus for a given role from all crew members."""
        bonus = 0
        for member in self.crew:
            if member.role == role:
                bonus += member.skill_bonus
        return bonus
    
    def adjust_crew_morale(self, amount, reason=None):
        """Adjusts morale for all crew members."""
        for member in self.crew:
            member.morale = max(0, min(100, member.morale + amount))
        if reason and self.crew:
            if amount > 0:
                print(f"Crew morale improved: {reason}")
            else:
                print(f"Crew morale decreased: {reason}")
    
    def give_crew_experience(self, role, amount):
        """Gives experience to crew members of a specific role."""
        for member in self.crew:
            if member.role == role:
                member.experience += amount
                if amount > 0:
                    print(f"{member.name} gained {amount} experience!")
    
    def gain_skill(self, skill, amount):
        """Increases a player skill."""
        if skill in self.skills:
            old_level = self.skills[skill] // 10  # Skill levels every 10 points
            self.skills[skill] += amount
            new_level = self.skills[skill] // 10
            
            if new_level > old_level:
                print(f"Your {skill} skill improved to level {new_level}!")
    
    def get_skill_bonus(self, skill):
        """Gets the skill bonus as a percentage (0-1)."""
        return min(0.5, self.skills.get(skill, 0) / 100)  # Max 50% bonus at 50 skill points
    
    def get_faction_rank(self, faction, reputation=None):
        """Get the player's rank within a faction based on reputation."""
        if faction not in FACTION_RANKS:
            return {"rank": "Unknown", "title": "Unknown"}
        
        if reputation is None:
            reputation = self.reputation.get(faction, 0)
        
        ranks = FACTION_RANKS[faction]
        current_rank = ranks[0]  # Default to lowest rank
        
        for rank in ranks:
            if reputation >= rank["min_rep"]:
                current_rank = rank
            else:
                break
        
        return current_rank
    
    def get_rank_benefits(self, faction):
        """Get benefits based on faction rank."""
        rank = self.get_faction_rank(faction)
        benefits = {}
        
        if faction == "Federation":
            if rank["rank"] == "Recruit":
                benefits["price_discount"] = 0.05  # 5% discount
            elif rank["rank"] == "Ensign":
                benefits["price_discount"] = 0.10
                benefits["exclusive_missions"] = True
            elif rank["rank"] == "Lieutenant":
                benefits["price_discount"] = 0.15
                benefits["exclusive_missions"] = True
                benefits["shipyard_discount"] = 0.10
            elif rank["rank"] == "Commander":
                benefits["price_discount"] = 0.20
                benefits["exclusive_missions"] = True
                benefits["shipyard_discount"] = 0.15
                benefits["better_mission_rewards"] = 1.5
            elif rank["rank"] == "Captain":
                benefits["price_discount"] = 0.25
                benefits["exclusive_missions"] = True
                benefits["shipyard_discount"] = 0.20
                benefits["better_mission_rewards"] = 2.0
                benefits["special_ships"] = True
            elif rank["rank"] == "Admiral":
                benefits["price_discount"] = 0.30
                benefits["exclusive_missions"] = True
                benefits["shipyard_discount"] = 0.25
                benefits["better_mission_rewards"] = 2.5
                benefits["special_ships"] = True
                benefits["diplomatic_immunity"] = True
        
        elif faction == "Syndicate":
            if rank["rank"] == "Associate":
                benefits["black_market_access"] = True
                benefits["black_market_discount"] = 0.10
            elif rank["rank"] == "Operative":
                benefits["black_market_access"] = True
                benefits["black_market_discount"] = 0.20
                benefits["reduced_customs_scrutiny"] = 0.5
            elif rank["rank"] == "Enforcer":
                benefits["black_market_access"] = True
                benefits["black_market_discount"] = 0.30
                benefits["reduced_customs_scrutiny"] = 0.3
                benefits["intimidation_bonus"] = 1.5
            elif rank["rank"] == "Lieutenant":
                benefits["black_market_access"] = True
                benefits["black_market_discount"] = 0.40
                benefits["reduced_customs_scrutiny"] = 0.2
                benefits["intimidation_bonus"] = 2.0
                benefits["protection_racket"] = True
            elif rank["rank"] == "Boss":
                benefits["black_market_access"] = True
                benefits["black_market_discount"] = 0.50
                benefits["reduced_customs_scrutiny"] = 0.1
                benefits["intimidation_bonus"] = 2.5
                benefits["protection_racket"] = True
                benefits["smuggling_routes"] = True
            elif rank["rank"] == "Kingpin":
                benefits["black_market_access"] = True
                benefits["black_market_discount"] = 0.60
                benefits["reduced_customs_scrutiny"] = 0.05
                benefits["intimidation_bonus"] = 3.0
                benefits["protection_racket"] = True
                benefits["smuggling_routes"] = True
                benefits["crime_lord_network"] = True
        
        return benefits
    
    def increase_wanted_level(self, faction=None, amount=1):
        """Increase wanted level globally or for a specific faction."""
        if faction:
            current = self.wanted_by.get(faction, 0)
            new_level = min(5, current + amount)
            self.wanted_by[faction] = new_level
            
            if new_level > current:
                print(f"\n--- WANTED LEVEL INCREASED ---")
                print(f"You are now wanted by the {faction}! Wanted level: {'★' * new_level}")
                
                if new_level >= 3:
                    print("WARNING: Bounty hunters may now pursue you!")
                    
        else:
            # Global wanted level
            old_level = self.wanted_level
            self.wanted_level = min(5, self.wanted_level + amount)
            
            if self.wanted_level > old_level:
                print(f"\n--- WANTED LEVEL INCREASED ---")
                print(f"Your criminal notoriety has increased! Wanted level: {'★' * self.wanted_level}")
                
                if self.wanted_level >= 3:
                    print("WARNING: Bounty hunters are now actively seeking you!")
    
    def decrease_wanted_level(self, faction=None, amount=1):
        """Decrease wanted level globally or for a specific faction."""
        if faction:
            if faction in self.wanted_by:
                self.wanted_by[faction] = max(0, self.wanted_by[faction] - amount)
                if self.wanted_by[faction] == 0:
                    del self.wanted_by[faction]
                    print(f"You are no longer wanted by the {faction}.")
        else:
            self.wanted_level = max(0, self.wanted_level - amount)
            if self.wanted_level == 0:
                print("Your wanted status has been cleared.")
    
    def get_total_wanted_level(self):
        """Get the effective wanted level considering all factions."""
        faction_max = max(self.wanted_by.values()) if self.wanted_by else 0
        return max(self.wanted_level, faction_max)

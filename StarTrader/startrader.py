import random
import time
import uuid
import json
import os

# --- Game Balance Constants ---
REPAIR_COST_PER_HP = 15
FUEL_COST_PER_UNIT = 10
EVENT_CHANCE = 0.25
MARKET_DRIFT_FACTOR = 4
REPUTATION_DISCOUNT_THRESHOLD = 50
PRICE_IMPACT_FACTOR = 0.05
QUANTITY_IMPACT_DIVISOR = 50
MAX_MISSIONS_PER_SYSTEM = 5
SAVE_FILE_NAME = "savegame.json"
GALAXY_WIDTH = 10
GALAXY_HEIGHT = 10

# --- Procedural Generation Data ---
SYSTEM_NAME_PARTS = {
    "part1": ["Sol", "Alpha", "Beta", "Sirius", "Vega", "Orion", "Cygnus", "Proxima", "Kepler"],
    "part2": ["Centauri", "Majoris", "Minoris", "Prime", "Secundus", "Tertius", "IV", "IX", "X"],
    "part3": ["Nebula", "Cluster", "Expanse", "Reach", "Void", "Core", "Rim", "Drift"]
}

PIRATE_NAMES = ["Blackheart", "Red-Eye", "Iron-Fist", "One-Leg", "Mad-Dog"]

CREW_RECRUITS = [
    {"name": "Jax", "role": "Weapons Officer", "skill_bonus": 5, "salary": 100, "description": "A former navy gunner. Increases weapon damage."},
    {"name": "Sparks", "role": "Engineer", "skill_bonus": 0.05, "salary": 120, "description": "A grease-stained genius. Improves fuel efficiency."},
    {"name": "Slick", "role": "Negotiator", "skill_bonus": 0.1, "salary": 80, "description": "A smooth talker. Gets better prices at the market."},
]

# --- Data ---

SHIP_CLASSES = {
    "starter_ship": {
        "name": "Stardust Drifter",
        "base_hull": 100,
        "base_fuel": 50,
        "crew_quarters": 2,
        "slots": {
            "weapon": 1,
            "shield": 1,
            "engine": 1,
            "cargo_hold": 2,
        }
    }
}

MODULE_SPECS = {
    "cargo_hold": {
        "CH-1": {"name": "Standard Cargo Hold", "cost": 0, "capacity": 20},
        "CH-2": {"name": "Expanded Cargo Hold", "cost": 2500, "capacity": 50},
        "CH-3": {"name": "Large Cargo Bay", "cost": 6000, "capacity": 100},
    },
    "engine": {
        "E-1": {"name": "Basic Engine", "cost": 0, "fuel_efficiency": 1.0},
        "E-2": {"name": "Ion Drive", "cost": 4000, "fuel_efficiency": 0.8},
    },
    "weapon": {
        "W-1": {"name": "Pulse Laser", "cost": 1000, "damage": 10},
        "W-2": {"name": "Heavy Laser", "cost": 3500, "damage": 25},
    },
    "shield": {
        "S-1": {"name": "Basic Shield", "cost": 1500, "strength": 50},
        "S-2": {"name": "Deflector Shield", "cost": 4000, "strength": 100},
    }
}

GOODS = {
    "Food": {"base_price": 20},
    "Medicine": {"base_price": 50},
    "Machinery": {"base_price": 100},
    "Minerals": {"base_price": 80},
    "Luxury Goods": {"base_price": 200}
}

ILLEGAL_GOODS = {
    "Cybernetics": {"base_price": 500},
    "Illegal Arms": {"base_price": 800},
    "Xeno-Artifacts": {"base_price": 1200}
}

FACTIONS = {
    "Federation": {"name": "Terran Federation", "home_system": "Sol"},
    "Syndicate": {"name": "Orion Syndicate", "home_system": "Sirius"},
    "Independent": {"name": "Independent Systems", "home_system": None}
}

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

class Galaxy:
    """Holds the map of all star systems and generates their markets."""
    def __init__(self):
        self.systems = {}
        self.connections = {}
        self.fuel_costs = {}
        self.active_events = {} # e.g., {"Sirius": {"type": "famine", "duration": 5}}
        self._create_galaxy()
        self._generate_markets()
        self._generate_missions()
        self._populate_recruitment_offices()

    def _populate_recruitment_offices(self):
        """Populates the recruitment offices with potential crew members."""
        # For now, all recruits are available in Sol
        for recruit_data in CREW_RECRUITS:
            self.systems["Sol"].recruitment_office.append(CrewMember(**recruit_data))

    def _generate_missions(self):
        """Generates new missions for each system."""
        for system in self.systems.values():
            if system.faction == "Independent": continue # No missions from independents for now
            
            # Remove completed or expired missions before generating new ones
            system.available_missions = [m for m in system.available_missions if not getattr(m, 'is_complete', False)]

            # A system must have connections to generate missions
            if not self.connections.get(system.name):
                continue

            while len(system.available_missions) < MAX_MISSIONS_PER_SYSTEM:
                
                # Determine possible mission types to avoid infinite loops
                possible_types = ["DELIVER", "PROCURE"]
                
                # Check if a BOUNTY mission is possible
                possible_bounty_destinations = [
                    self.systems[s_name] for s_name in self.connections[system.name]
                    if self.systems[s_name].faction != "Federation"
                ]
                if possible_bounty_destinations:
                    possible_types.append("BOUNTY")

                mission_type = random.choice(possible_types)
                
                if mission_type == "BOUNTY":
                    destination = random.choice(possible_bounty_destinations)
                    target_name = random.choice(PIRATE_NAMES)
                    mission = Mission(system, destination, system.faction, None, None, "BOUNTY", target_name)
                else:
                    destination_name = random.choice(self.connections[system.name])
                    destination = self.systems[destination_name]
                    good = random.choice(list(GOODS.keys()))
                    quantity = random.randint(5, 20)
                    mission = Mission(system, destination, system.faction, good, quantity, mission_type)

                system.available_missions.append(mission)

    def _create_galaxy(self):
        """Creates the star systems and their connections in the galaxy."""
        # Create a grid of systems
        grid = [[None for _ in range(GALAXY_WIDTH)] for _ in range(GALAXY_HEIGHT)]
        
        # Place core systems
        grid[5][5] = StarSystem("Sol", "The bustling core of humanity.", "Core", "Federation", 5, 5, has_shipyard=True)
        grid[4][5] = StarSystem("Alpha Centauri", "A verdant agricultural world.", "Agricultural", "Federation", 4, 5)
        grid[5][4] = StarSystem("Sirius", "A heavily industrialized system.", "Industrial", "Syndicate", 5, 4, has_shipyard=True)
        grid[6][4] = StarSystem("Vega", "A remote mining outpost.", "Mining", "Independent", 6, 4)

        # Procedurally generate the rest of the systems
        for y in range(GALAXY_HEIGHT):
            for x in range(GALAXY_WIDTH):
                if grid[y][x] is None and random.random() < 0.3: # 30% chance of a system
                    name = f"{random.choice(SYSTEM_NAME_PARTS['part1'])}-{random.randint(1, 100)}"
                    description = "An unremarkable system."
                    economy_type = random.choice(["Agricultural", "Industrial", "Mining", "Core"])
                    faction = random.choice(["Federation", "Syndicate", "Independent"])
                    has_shipyard = random.random() < 0.2 # 20% chance of a shipyard
                    grid[y][x] = StarSystem(name, description, economy_type, faction, x, y, has_shipyard)

        # Add systems to the main dictionary and create connections
        for y in range(GALAXY_HEIGHT):
            for x in range(GALAXY_WIDTH):
                if grid[y][x]:
                    self.systems[grid[y][x].name] = grid[y][x]
                    
                    # Connect to nearby systems
                    for dx in range(-1, 2):
                        for dy in range(-1, 2):
                            if dx == 0 and dy == 0: continue
                            nx, ny = x + dx, y + dy
                            if 0 <= nx < GALAXY_WIDTH and 0 <= ny < GALAXY_HEIGHT and grid[ny][nx]:
                                if grid[y][x].name not in self.connections:
                                    self.connections[grid[y][x].name] = []
                                self.connections[grid[y][x].name].append(grid[ny][nx].name)
                                
                                # Calculate fuel cost
                                distance = self._calculate_distance(grid[y][x], grid[ny][nx])
                                self.fuel_costs[(grid[y][x].name, grid[ny][nx].name)] = int(distance * 5)

    def _calculate_distance(self, system1, system2):
        """Calculates the distance between two systems."""
        return ((system1.x - system2.x)**2 + (system1.y - system2.y)**2)**0.5

    def _get_base_price_multiplier(self, system_economy, good):
        """Calculates the base price multiplier for a good in a system."""
        if system_economy == "Agricultural" and good == "Food": return 0.6
        if system_economy != "Agricultural" and good == "Food": return 1.4
        if system_economy == "Industrial" and good == "Machinery": return 0.7
        if system_economy != "Industrial" and good == "Machinery": return 1.3
        if system_economy == "Mining" and good == "Minerals": return 0.5
        if system_economy != "Mining" and good == "Minerals": return 1.5
        return 1.0

    def _generate_markets(self):
        """Generates the initial market data for each system."""
        for system in self.systems.values():
            # Legal Market
            for good, data in GOODS.items():
                base_price = data["base_price"]
                multiplier = self._get_base_price_multiplier(system.economy_type, good)
                price = int(base_price * multiplier * random.uniform(0.9, 1.1))
                quantity = random.randint(50, 200)
                system.market[good] = {"price": price, "quantity": quantity}
            
            # Black Market
            if system.has_black_market:
                for good, data in ILLEGAL_GOODS.items():
                    # Illegal goods are always expensive and rare
                    price = int(data["base_price"] * random.uniform(1.2, 1.8))
                    quantity = random.randint(5, 25)
                    system.market[good] = {"price": price, "quantity": quantity}

    def update_markets(self):
        """Updates all markets due to natural economic drift and events."""
        # Decay active events
        for system_name, event in list(self.active_events.items()):
            event["duration"] -= 1
            if event["duration"] <= 0:
                print(f"The {event['type']} in {system_name} has ended.")
                del self.active_events[system_name]

        # Update prices
        for system in self.systems.values():
            for good, data in system.market.items():
                base_price = GOODS.get(good, ILLEGAL_GOODS.get(good, {"base_price": 0}))["base_price"]
                multiplier = self._get_base_price_multiplier(system.economy_type, good)
                
                # Check for events
                if system.name in self.active_events:
                    event = self.active_events[system.name]
                    if event["type"] == "famine" and good == "Food":
                        multiplier *= 3.0 # Famine triples food prices
                    if event["type"] == "mining_strike" and good == "Minerals":
                        multiplier *= 4.0 # Strike quadruples mineral prices
                    if event["type"] == "bountiful_harvest" and good == "Food":
                        multiplier *= 0.5 # Bountiful harvest halves food prices
                    if event["type"] == "mining_boom" and good == "Minerals":
                        multiplier *= 0.4 # Mining boom cuts mineral prices by 60%

                target_price = int(base_price * multiplier)
                # Drift price towards the target price
                data["price"] += (target_price - data["price"]) // MARKET_DRIFT_FACTOR
        
        self._generate_missions()

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


class EventManager:
    """Handles random events during travel."""
    def __init__(self, game):
        self.game = game

    def trigger_event(self):
        """Randomly determines if an event occurs and handles it."""
        if random.random() > EVENT_CHANCE: return

        # Prioritize economic events for now, will add more later
        event_type = random.choice(["famine", "mining_strike", "pirate", "derelict", "asteroid", "customs_scan"])
        print("\n--- EVENT ---")

        if event_type == "famine": self._handle_famine()
        elif event_type == "mining_strike": self._handle_mining_strike()
        elif event_type == "pirate": self._handle_pirate_encounter()
        elif event_type == "derelict": self._handle_derelict_ship()
        elif event_type == "asteroid": self._handle_asteroid_field()
        elif event_type == "customs_scan": self._handle_customs_scan()

    def _handle_customs_scan(self):
        """Handles a random customs scan event."""
        faction = self.game.player.location.faction
        if faction == "Independent" or faction == "Syndicate": # Less likely to be scanned in these systems
            if random.random() > 0.1:
                return
        
        print(f"You are hailed by a {faction} patrol for a routine customs scan.")
        
        illegal_cargo = []
        for good, quantity in self.game.player.ship.cargo_hold.items():
            if good in ILLEGAL_GOODS:
                illegal_cargo.append((good, quantity))
        
        if not illegal_cargo:
            print("The scan reveals nothing illegal. They let you pass.")
            return
            
        print("\n--- CONTRABAND DETECTED! ---")
        total_fine = 0
        for good, quantity in illegal_cargo:
            base_price = ILLEGAL_GOODS[good]["base_price"]
            fine = base_price * quantity * 2 # 200% fine
            total_fine += fine
            print(f"Your {quantity} units of {good} have been confiscated!")
            self.game.player.ship.remove_cargo(good, quantity)
            
        reputation_loss = 25 * len(illegal_cargo)
        print(f"You have been fined {total_fine} credits and your reputation with {faction} has been damaged.")
        self.game.player.credits -= total_fine
        self.game.player.add_reputation(faction, -reputation_loss)
        
        if self.game.player.credits < 0:
            print("You couldn't afford the fine and have been thrown in jail. Your journey ends here.")
            self.game.game_over = True

    def _handle_famine(self):
        system = random.choice(list(self.game.galaxy.systems.values()))
        if system.economy_type == "Agricultural": # Famines don't happen on farm worlds
            print(f"A distress call from a nearby system speaks of a bountiful harvest in {system.name}. Prices for food there may be low.")
            self.game.galaxy.active_events[system.name] = {"type": "bountiful_harvest", "duration": 5}
            return
        print(f"A severe famine has struck {system.name}! Demand for food is critical.")
        self.game.galaxy.active_events[system.name] = {"type": "famine", "duration": 10}

    def _handle_mining_strike(self):
        system = random.choice(list(self.game.galaxy.systems.values()))
        if system.economy_type == "Mining":
            print(f"A new mineral vein was discovered in {system.name}. Mineral prices there may be low.")
            self.game.galaxy.active_events[system.name] = {"type": "mining_boom", "duration": 5}
            return
        print(f"A widespread labor strike has halted all mining operations in {system.name}!")
        self.game.galaxy.active_events[system.name] = {"type": "mining_strike", "duration": 8}

    def _handle_pirate_encounter(self):
        # Check for active bounty missions in the current system
        bounty_mission = None
        for mission in self.game.player.active_missions:
            if mission.type == "BOUNTY" and mission.destination_system == self.game.player.location:
                bounty_mission = mission
                break
        
        if bounty_mission:
            pirate_name = bounty_mission.target_name
            print(f"You've found him! The notorious pirate {pirate_name} is here!")
            pirate_hull = 100 # Bounty targets are tougher
            pirate_damage = 20
        else:
            pirate_name = "a pirate"
            print(f"You've been ambushed by {pirate_name}!")
            pirate_hull = 50
            pirate_damage = 15
        
        while True:
            choice = input("Do you 'fight' or 'flee'? > ").lower()
            if choice == "flee":
                print("You attempt to flee...")
                if random.random() > 0.5:
                    print("You got away safely!")
                    return
                else:
                    print("You couldn't escape!")
            
            # Player's turn
            player_damage = self.game.player.ship.get_weapon_damage(self.game.player)
            pirate_hull -= player_damage
            print(f"You fire your weapons, dealing {player_damage} damage. The pirate has {pirate_hull} hull remaining.")
            if pirate_hull <= 0:
                print(f"You destroyed the {pirate_name}'s ship!")
                
                if bounty_mission:
                    self.game._handle_complete(["complete", bounty_mission.id, "bounty"])
                else:
                    salvage = random.randint(200, 800)
                    self.game.player.credits += salvage
                    print(f"You salvage {salvage} credits from the wreckage.")
                return

            # Pirate's turn
            damage_taken = pirate_damage
            # Apply shield damage first
            shield_strength = self.game.player.ship.get_shield_strength()
            if shield_strength > 0:
                if damage_taken <= shield_strength:
                    print(f"Your shields absorbed {damage_taken} damage.")
                    damage_taken = 0
                else:
                    damage_taken -= shield_strength
                    print(f"Your shields absorbed {shield_strength} damage and collapsed!")
            
            if damage_taken > 0:
                self.game.player.ship.hull -= damage_taken
                print(f"The pirate fires back, dealing {damage_taken} hull damage.")

            if self.game.player.ship.hull <= 0:
                self.game.game_over = True
                print("Your ship was destroyed by pirates...")
                return
            
            print(f"Your Hull: {self.game.player.ship.hull}/{self.game.player.ship.max_hull}, Pirate Hull: {pirate_hull}/50")

    def _handle_derelict_ship(self):
        print("You come across a derelict, drifting ship.")
        salvage = random.randint(50, 200)
        self.game.player.credits += salvage
        print(f"You salvage parts worth {salvage} credits.")

    def _handle_asteroid_field(self):
        print("You navigate a dense asteroid field.")
        damage = random.randint(5, 15)
        self.game.player.ship.hull -= damage
        print(f"You make it through, but your ship takes {damage} hull damage.")
        if self.game.player.ship.hull <= 0:
            self.game.game_over = True
            print("Your ship was destroyed by asteroids...")

class Game:
    """
    Manages the main game loop and player commands.
    """
    def __init__(self):
        self.player = Player()
        self.galaxy = Galaxy()
        self.event_manager = EventManager(self)
        self.game_over = False
        self.player.location = self.galaxy.systems["Sol"]
        self.current_day = 1

    def get_status(self):
        ship = self.player.ship
        system = self.player.location
        connections = self.galaxy.connections.get(system.name, [])
        travel_options = ", ".join(connections) or "None"
        cargo_list = ", ".join(f"{item} ({qty})" for item, qty in ship.cargo_hold.items()) or "Empty"

        status = (
            f"--- Captain {self.player.name} ---\n"
            f"Credits: {self.player.credits}\n"
            f"\nCurrent Location: {system.name} ({system.economy_type})\n"
            f"System Faction: {system.faction} ({FACTIONS[system.faction]['name']})\n"
            f"Description: {system.description}\n"
            f"Reachable Systems: {travel_options}\n"
        )
        if system.name in self.galaxy.active_events:
            event = self.galaxy.active_events[system.name]
            status += f"EVENT: This system is experiencing a {event['type']}!\n"
        
        status += (
            f"\n--- Ship: {ship.name} ({ship.ship_class_data['name']}) ---\n"
            f"Hull: {ship.hull}/{ship.max_hull}\n"
            f"Fuel: {ship.fuel}/{ship.max_fuel}\n"
            f"Cargo ({ship.get_cargo_used()}/{ship.cargo_capacity}): {cargo_list}\n"
            f"Weapon Damage: {ship.get_weapon_damage(self.player)}\n"
            f"Shield Strength: {ship.get_shield_strength()}\n"
            f"Fuel Efficiency: {ship.get_fuel_efficiency(self.player)}\n"
            f"\n--- Installed Modules ---\n"
        )
        for module_type, installed_modules in ship.modules.items():
            status += f"- {module_type.upper()}:\n"
            for module_id in installed_modules:
                specs = MODULE_SPECS[module_type][module_id]
                status += f"  - {specs['name']} ({module_id})\n"

        if self.player.crew:
            status += "\n--- Crew ---\n"
            for member in self.player.crew:
                status += f"- {member.name} ({member.role})\n"

        if self.player.active_missions:
            status += f"\n--- Active Missions (Day {self.current_day}) ---\n"
            for mission in self.player.active_missions:
                status += f"- ID: {mission.id} | {mission.get_description()} (Expires: Day {mission.expiration_day})\n"
            
        return status

    def _handle_status(self, parts):
        """Prints the player's status."""
        print(self.get_status())

    def _handle_trade(self, parts):
        system = self.player.location
        print(f"\n--- Market at {system.name} ---")
        print(f"{'Good':<15} {'Price':>10} {'Quantity':>10}")
        print("-" * 37)
        
        for good, data in sorted(system.market.items()):
            print(f"{good:<15} {data['price']:>10} {data['quantity']:>10}")
        
        print("\nUse 'buy <good> <quantity>' or 'sell <good> <quantity>'.")

    def _handle_buy(self, parts):
        """Handles the 'buy' command."""
        if len(parts) < 3:
            print("Invalid format. Use: buy <good> <quantity>")
            return

        try:
            quantity = int(parts[-1])
            good_name = " ".join(parts[1:-1]).title()
        except ValueError:
            print("Invalid format. The last part of the command must be a number.")
            return

        if quantity <= 0:
            print("Quantity must be positive.")
            return

        system = self.player.location
        if good_name not in system.market:
            print(f"'{good_name}' is not sold here.")
            return
            
        if good_name in ILLEGAL_GOODS and not system.has_black_market:
            print("You can't trade that on the open market!")
            return

        market_data = system.market[good_name]
        if quantity > market_data["quantity"]:
            print(f"Not enough {good_name} in stock. Only {market_data['quantity']} available.")
            return

        total_cost = market_data["price"] * quantity
        
        # Apply negotiator bonus
        negotiator_bonus = self.player.get_crew_bonus("Negotiator")
        if negotiator_bonus > 0:
            total_cost *= (1 - negotiator_bonus)
            total_cost = int(total_cost)
            print(f"Your negotiator secured a better price! You save {int(market_data['price'] * quantity * negotiator_bonus)} credits.")

        if self.player.credits < total_cost:
            print(f"Not enough credits. You need {total_cost}, but only have {self.player.credits}.")
            return

        ship = self.player.ship
        if ship.get_cargo_used() + quantity > ship.cargo_capacity:
            print(f"Not enough cargo space. You need {quantity} slots, but only have {ship.cargo_capacity - ship.get_cargo_used()} free.")
            return

        # All checks passed, execute transaction
        self.player.credits -= total_cost
        market_data["quantity"] -= quantity
        market_data["price"] = int(market_data["price"] * (1 + PRICE_IMPACT_FACTOR * (quantity / QUANTITY_IMPACT_DIVISOR))) + 1 # Price increases on buy
        ship.add_cargo(good_name, quantity)
        print(f"Successfully purchased {quantity} units of {good_name} for {total_cost} credits.")
        
        if good_name in ILLEGAL_GOODS:
            self.player.add_reputation("Federation", -5) # Dealing in illegal goods hurts Fed rep
        else:
            self.player.add_reputation(system.faction, 1)

    def _handle_sell(self, parts):
        """Handles the 'sell' command."""
        if len(parts) < 3:
            print("Invalid format. Use: sell <good> <quantity>")
            return

        try:
            quantity = int(parts[-1])
            good_name = " ".join(parts[1:-1]).title()
        except ValueError:
            print("Invalid format. The last part of the command must be a number.")
            return

        if quantity <= 0:
            print("Quantity must be positive.")
            return

        ship = self.player.ship
        if good_name not in ship.cargo_hold or ship.cargo_hold[good_name] < quantity:
            print(f"You don't have {quantity} units of {good_name} to sell.")
            return

        system = self.player.location
        if good_name in ILLEGAL_GOODS and not system.has_black_market:
            print("You can't trade that on the open market!")
            return
            
        market_data = system.market[good_name]
        total_sale = market_data["price"] * quantity
        
        # Apply negotiator bonus
        negotiator_bonus = self.player.get_crew_bonus("Negotiator")
        if negotiator_bonus > 0:
            bonus_amount = int(total_sale * negotiator_bonus)
            total_sale += bonus_amount
            print(f"Your negotiator secured a better price! You earn an extra {bonus_amount} credits.")

        # All checks passed, execute transaction
        self.player.credits += total_sale
        market_data["quantity"] += quantity
        market_data["price"] = max(1, int(market_data["price"] * (1 - PRICE_IMPACT_FACTOR * (quantity / QUANTITY_IMPACT_DIVISOR))) - 1) # Price decreases on sell, min 1
        ship.remove_cargo(good_name, quantity)
        print(f"Successfully sold {quantity} units of {good_name} for {total_sale} credits.")
        
        if good_name in ILLEGAL_GOODS:
            self.player.add_reputation("Federation", -5) # Dealing in illegal goods hurts Fed rep
        else:
            self.player.add_reputation(system.faction, 1)

    def _handle_travel(self, parts):
        if len(parts) < 2:
            print("Invalid format. Use: travel <system name>"); return
        destination_name = " ".join(parts[1:]).title()
        
        if destination_name not in self.galaxy.systems:
            # Allow for short names
            for system_name_i in self.galaxy.systems:
                if destination_name.lower() in system_name_i.lower():
                    destination_name = system_name_i
                    break
            else:
                print(f"Unknown system: '{destination_name}'"); return

        current_system = self.player.location
        if current_system.name == destination_name:
            print("You are already in that system."); return

        if destination_name not in self.galaxy.connections[current_system.name]:
             print(f"Cannot travel directly from {current_system.name} to {destination_name}."); return
        
        fuel_needed = self.galaxy.fuel_costs.get((current_system.name, destination_name))
        
        # Apply faction discount
        faction = self.player.location.faction
        if self.player.reputation.get(faction, 0) >= REPUTATION_DISCOUNT_THRESHOLD: # Reputation >= 50 gives discount
            fuel_needed *= 0.9 # 10% discount
            print("Your high reputation with this faction gives you a 10% discount on fuel!")

        fuel_needed = int(fuel_needed * self.player.ship.get_fuel_efficiency(self.player))
        if self.player.ship.fuel < fuel_needed:
            print(f"Not enough fuel. You need {fuel_needed}, but only have {self.player.ship.fuel}."); return

        self.player.ship.fuel -= fuel_needed
        self.current_day += 1
        self._handle_daily_costs()
        self.galaxy.update_markets() # Markets change over time
        self._check_mission_failure()
        
        print(f"\nTraveling from {current_system.name} to {destination_name}...")
        time.sleep(1)
        
        self.event_manager.trigger_event()
        if self.game_over: return

        self.player.location = self.galaxy.systems[destination_name]
        print(f"Arrived at {destination_name}. The journey consumed {fuel_needed} fuel.")
        print(f"It is now Day {self.current_day}.")
        print(self.get_status())

    def _handle_daily_costs(self):
        """Handles daily costs like crew salaries."""
        total_salary = sum(member.salary for member in self.player.crew)
        if total_salary > 0:
            print(f"\n--- Daily Costs (Day {self.current_day}) ---")
            print(f"Crew salaries: {total_salary} credits")
            self.player.credits -= total_salary
            if self.player.credits < 0:
                print("You can't afford to pay your crew! They've all quit in disgust.")
                self.player.crew = []
                self.player.credits = max(0, self.player.credits) # Don't go into negative credits from this

    def _handle_shipyard(self, parts):
        if not self.player.location.has_shipyard:
            print("No shipyard available in this system."); return
        
        print("\n--- Shipyard ---")
        print("Available commands: 'repair', 'upgrade <module_id>', 'sellmodule <module_id>'")
        
        faction = self.player.location.faction
        if self.player.reputation.get(faction, 0) >= REPUTATION_DISCOUNT_THRESHOLD:
             print("Your high reputation with this faction gives you a 10% discount on repairs!")
        
        print(f"Hull: {self.player.ship.hull}/{self.player.ship.max_hull}. Repair cost: {REPAIR_COST_PER_HP} credits per point.")
        
        print("\n--- Available Modules for Purchase ---")
        for module_type, modules in MODULE_SPECS.items():
            print(f"\n-- {module_type.upper()} --")
            for module_id, specs in modules.items():
                print(f"  ID: {module_id} | {specs['name']:<20} | Cost: {specs['cost']:<5} | Stats: {specs}")

    def _handle_repair(self, parts):
        ship = self.player.ship
        damage = ship.max_hull - ship.hull
        if damage == 0: print("Ship hull is already at maximum."); return
        
        cost = damage * REPAIR_COST_PER_HP
        
        # Apply faction discount
        faction = self.player.location.faction
        if self.player.reputation.get(faction, 0) >= REPUTATION_DISCOUNT_THRESHOLD: # Reputation >= 50 gives discount
            cost *= 0.9 # 10% discount
        
        cost = int(cost)
        if self.player.credits < cost:
            print(f"Not enough credits to fully repair."); return
        
        self.player.credits -= cost
        ship.hull = ship.max_hull
        print(f"Ship hull repaired for {cost} credits.")

    def _handle_upgrade(self, parts):
        if len(parts) != 2:
            print("Invalid format. Use: upgrade <module_id>"); return
        
        module_id_to_install = parts[1].upper()
        
        # Find the module in the specs
        module_type = None
        module_specs = None
        for m_type, modules in MODULE_SPECS.items():
            if module_id_to_install in modules:
                module_type = m_type
                module_specs = modules[module_id_to_install]
                break
        
        if not module_specs:
            print(f"Unknown module ID: '{module_id_to_install}'."); return
            
        ship = self.player.ship
        
        # Check if the ship has a slot for this module type
        if module_type not in ship.ship_class_data["slots"]:
            print(f"This ship does not have a slot for '{module_type}' modules."); return
            
        # Check if there are enough free slots
        max_slots = ship.ship_class_data["slots"][module_type]
        current_slots_used = len(ship.modules.get(module_type, []))
        if current_slots_used >= max_slots:
            print(f"All '{module_type}' slots are currently in use. You must sell a module to install a new one."); return
            
        cost = module_specs["cost"]
        if self.player.credits < cost:
            print(f"Not enough credits. You need {cost} to install this module."); return
            
        self.player.credits -= cost
        ship.modules.setdefault(module_type, []).append(module_id_to_install)
        
        print(f"Successfully installed {module_specs['name']} for {cost} credits.")

    def _handle_refuel(self, parts):
        """Handles the 'refuel' command."""
        ship = self.player.ship
        fuel_needed = ship.max_fuel - ship.fuel
        if fuel_needed == 0:
            print("Fuel tank is already full.")
            return

        try:
            # Default to max refuel if no amount is given
            amount_to_buy = fuel_needed if len(parts) < 2 else (fuel_needed if parts[1] == 'max' else int(parts[1]))
        except ValueError:
            print("Invalid format. Use: refuel <amount> or refuel max")
            return
        
        if amount_to_buy <= 0:
            print("Amount must be positive.")
            return

        amount_to_buy = min(amount_to_buy, fuel_needed) # Don't overfill
        
        cost = amount_to_buy * FUEL_COST_PER_UNIT
        
        if self.player.credits < cost:
            print(f"Not enough credits. You need {cost} for {amount_to_buy} fuel, but only have {self.player.credits}.")
            return
            
        self.player.credits -= cost
        ship.fuel += amount_to_buy
        print(f"Refueled {amount_to_buy} units for {cost} credits. Fuel is now {ship.fuel}/{ship.max_fuel}.")

    def run(self):
        """The main game loop."""
        print("Welcome to Star Trader!")
        print("Your goal is to make a fortune trading between the stars.")
        
        self.commands = {
            "status": self._handle_status,
            "trade": self._handle_trade,
            "buy": self._handle_buy,
            "sell": self._handle_sell,
            "travel": self._handle_travel,
            "shipyard": self._handle_shipyard,
            "repair": self._handle_repair,
            "upgrade": self._handle_upgrade,
            "refuel": self._handle_refuel,
            "missions": self._handle_missions,
            "accept": self._handle_accept,
            "complete": self._handle_complete,
            "accept": self._handle_accept,
            "complete": self._handle_complete,
            "save": self._handle_save,
            "load": self._handle_load,
            "new": self._handle_new,
            "blackmarket": self._handle_black_market,
            "sellmodule": self._handle_sell_module,
            "recruits": self._handle_recruits,
            "hire": self._handle_hire,
            "crew": self._handle_crew,
            "fire": self._handle_fire,
            "news": self._handle_news,
            "quit": self.quit_game
        }
        
        print(f"Commands: {', '.join(self.commands.keys())}")
        
        if os.path.exists(SAVE_FILE_NAME):
            print("Save file found. Use 'load' to continue or 'new' to start a new game.")
        else:
            self._handle_status(None) # Initial status

        while not self.game_over:
            command = input("> ").strip().lower()
            parts = command.split()
            verb = parts[0] if parts else ""
            
            handler = self.commands.get(verb)
            if handler:
                handler(parts)
            else:
                print(f"Unknown command: '{command}'")
        
        print("You have retired from your life as a trader. Farewell.")

    def _handle_news(self, parts):
        """Displays galactic news and events."""
        print(f"\n--- Galactic News Network (GNN) - Day {self.current_day} ---")
        
        news_items = 0
        
        # Report on active economic events
        if self.galaxy.active_events:
            print("\n-- Economic Events --")
            for system_name, event in self.galaxy.active_events.items():
                if event["type"] == "famine":
                    print(f"  - URGENT: A severe famine continues in the {system_name} system. Demand for Food is critical.")
                elif event["type"] == "mining_strike":
                    print(f"  - BUSINESS: A labor strike in the {system_name} system has halted mineral production.")
                elif event["type"] == "bountiful_harvest":
                    print(f"  - BUSINESS: A bountiful harvest in the {system_name} system has led to a surplus of Food.")
                elif event["type"] == "mining_boom":
                    print(f"  - BUSINESS: A mineral boom in the {system_name} system has flooded the market.")
                news_items += 1
        
        # Report on available bounty missions across the galaxy
        bounties = []
        for system in self.galaxy.systems.values():
            for mission in system.available_missions:
                if mission.type == "BOUNTY":
                    bounties.append(mission)
                    
        if bounties:
            print("\n-- Bounties Posted --")
            for bounty in bounties:
                print(f"  - WANTED: The pirate {bounty.target_name} is wanted by the {bounty.faction}. Last seen near {bounty.destination_system.name}.")
            news_items += len(bounties)
            
        if news_items == 0:
            print("\nNo major news to report across the galaxy.")

    def _handle_recruits(self, parts):
        """Displays available recruits at the current location."""
        system = self.player.location
        print(f"\n--- Recruitment Office at {system.name} ---")
        if not system.recruitment_office:
            print("No one is looking for work here at the moment.")
            return
            
        for recruit in system.recruitment_office:
            print(f"Name: {recruit.name} | Role: {recruit.role} | Salary: {recruit.salary} Cr/day")
            print(f"  Description: {recruit.description}")

    def _handle_hire(self, parts):
        """Hires a new crew member."""
        if len(parts) != 2:
            print("Invalid format. Use: hire <name>")
            return
            
        name_to_hire = parts[1].capitalize()
        system = self.player.location
        
        recruit_to_hire = None
        for recruit in system.recruitment_office:
            if recruit.name == name_to_hire:
                recruit_to_hire = recruit
                break
        
        if not recruit_to_hire:
            print(f"No recruit named '{name_to_hire}' found here.")
            return
            
        if len(self.player.crew) >= self.player.ship.ship_class_data["crew_quarters"]:
            print("Your ship's crew quarters are full.")
            return
            
        # For now, hiring is free. We can add a hiring fee later.
        self.player.crew.append(recruit_to_hire)
        system.recruitment_office.remove(recruit_to_hire)
        print(f"{recruit_to_hire.name} has joined your crew as your new {recruit_to_hire.role}.")

    def _handle_crew(self, parts):
        """Displays the current crew."""
        print("\n--- Your Crew ---")
        if not self.player.crew:
            print("You have no crew.")
            return
            
        for member in self.player.crew:
            print(f"Name: {member.name} | Role: {member.role} | Salary: {member.salary} Cr/day")

    def _handle_fire(self, parts):
        """Fires a crew member."""
        if len(parts) != 2:
            print("Invalid format. Use: fire <name>")
            return
            
        name_to_fire = parts[1].capitalize()
        
        member_to_fire = None
        for member in self.player.crew:
            if member.name == name_to_fire:
                member_to_fire = member
                break
        
        if not member_to_fire:
            print(f"No crew member named '{name_to_fire}' found.")
            return
            
        self.player.crew.remove(member_to_fire)
        # For now, fired crew just disappear. We could have them return to a recruitment office later.
        print(f"You have fired {member_to_fire.name}.")

    def _handle_sell_module(self, parts):
        """Sells an installed module from the player's ship."""
        if len(parts) != 2:
            print("Invalid format. Use: sellmodule <module_id>")
            return

        module_id_to_sell = parts[1].upper()
        ship = self.player.ship
        
        module_type = None
        found_module = False
        for m_type, installed_list in ship.modules.items():
            if module_id_to_sell in installed_list:
                module_type = m_type
                found_module = True
                break
        
        if not found_module:
            print(f"Module '{module_id_to_sell}' not found on your ship.")
            return
            
        # Prevent selling the last module of a critical type
        if module_type in ["engine", "weapon"] and len(ship.modules[module_type]) == 1:
            print(f"Cannot sell your last {module_type}. A ship needs it to function!")
            return

        module_specs = MODULE_SPECS[module_type][module_id_to_sell]
        resale_price = int(module_specs["cost"] * 0.5) # Sell for 50% of original price
        
        ship.modules[module_type].remove(module_id_to_sell)
        self.player.credits += resale_price
        
        print(f"Sold {module_specs['name']} for {resale_price} credits.")

    def _handle_black_market(self, parts):
        """Displays the black market at the current location."""
        system = self.player.location
        if not system.has_black_market:
            print("No black market here. Keep your nose clean.")
            return
            
        print(f"\n--- Black Market at {system.name} ---")
        print("A shady figure in a dimly lit corner of the starport acknowledges you.")
        print(f"{'Good':<15} {'Price':>10} {'Quantity':>10}")
        print("-" * 37)
        
        for good, data in sorted(system.market.items()):
            if good in ILLEGAL_GOODS:
                print(f"{good:<15} {data['price']:>10} {data['quantity']:>10}")
        
        print("\nUse 'buy <good> <quantity>' or 'sell <good> <quantity>'.")

    def _handle_new(self, parts):
        """Starts a new game, overwriting any existing save."""
        self.__init__()
        print("Started a new game.")
        self._handle_status(None)

    def _handle_save(self, parts):
        """Saves the current game state to a file."""
        game_state = {
            "player": {
                "name": self.player.name,
                "credits": self.player.credits,
                "location_name": self.player.location.name,
                "reputation": self.player.reputation,
                "active_missions": [m.to_dict() for m in self.player.active_missions],
                "ship": {
                    "ship_class": "starter_ship", # For now, only one ship class
                    "modules": self.player.ship.modules,
                    "hull": self.player.ship.hull,
                    "fuel": self.player.ship.fuel,
                    "cargo_hold": self.player.ship.cargo_hold,
                }
            },
            "galaxy": {
                "active_events": self.galaxy.active_events,
                "markets": {name: sys.market for name, sys in self.galaxy.systems.items()},
                "available_missions": {name: [m.to_dict() for m in sys.available_missions] for name, sys in self.galaxy.systems.items()}
            },
            "current_day": self.current_day,
        }
        
        with open(SAVE_FILE_NAME, 'w') as f:
            json.dump(game_state, f, indent=4)
        print(f"Game saved to {SAVE_FILE_NAME}.")

    def _handle_load(self, parts):
        """Loads the game state from a file."""
        if not os.path.exists(SAVE_FILE_NAME):
            print("No save file found.")
            return

        with open(SAVE_FILE_NAME, 'r') as f:
            game_state = json.load(f)

        # Restore Player state
        player_data = game_state["player"]
        self.player.name = player_data["name"]
        self.player.credits = player_data["credits"]
        self.player.location = self.galaxy.systems[player_data["location_name"]]
        self.player.reputation = player_data["reputation"]
        
        # Restore Ship state
        ship_data = player_data["ship"]
        self.player.ship = Ship(ship_data["ship_class"])
        self.player.ship.modules = ship_data["modules"]
        self.player.ship.hull = ship_data["hull"]
        self.player.ship.fuel = ship_data["fuel"]
        self.player.ship.cargo_hold = ship_data["cargo_hold"]

        # Restore Galaxy state
        galaxy_data = game_state["galaxy"]
        self.galaxy.active_events = galaxy_data["active_events"]
        for name, market_data in galaxy_data["markets"].items():
            self.galaxy.systems[name].market = market_data
            
        # Restore Missions
        self.player.active_missions = [Mission.from_dict(md, self.galaxy) for md in player_data["active_missions"]]
        for name, missions_data in galaxy_data["available_missions"].items():
            self.galaxy.systems[name].available_missions = [Mission.from_dict(md, self.galaxy) for md in missions_data]

        self.current_day = game_state["current_day"]
        
        print("Game loaded successfully.")
        self._handle_status(None)

    def _handle_missions(self, parts):
        """Displays available missions at the current location."""
        system = self.player.location
        print(f"\n--- Mission Board at {system.name} (Day {self.current_day}) ---")
        if not system.available_missions:
            print("No missions available at this time.")
            return
            
        for mission in system.available_missions:
            print(f"ID: {mission.id} | {mission.get_description()}")
            print(f"  Reward: {mission.reward_credits} Cr, {mission.reward_reputation} Rep | Time Limit: {mission.time_limit} days")

    def _handle_accept(self, parts):
        """Accepts a mission."""
        if len(parts) != 2:
            print("Invalid format. Use: accept <mission_id>")
            return
        
        mission_id = parts[1]
        system = self.player.location
        
        mission_to_accept = None
        for mission in system.available_missions:
            if mission.id == mission_id:
                mission_to_accept = mission
                break
        
        if not mission_to_accept:
            print(f"Mission ID '{mission_id}' not found here.")
            return
            
        # For now, players can only have one mission at a time
        if self.player.active_missions:
            print("You already have an active mission. Complete it first.")
            return
            
        # If it's a delivery mission, check for cargo space and give the cargo to the player.
        if mission_to_accept.type == "DELIVER":
            if self.player.ship.get_cargo_used() + mission_to_accept.quantity > self.player.ship.cargo_capacity:
                print(f"Not enough cargo space to accept this mission. You need {mission_to_accept.quantity} free space.")
                return
            self.player.ship.add_cargo(mission_to_accept.good, mission_to_accept.quantity)
            print(f"{mission_to_accept.quantity} units of {mission_to_accept.good} have been loaded into your cargo hold.")

        mission_to_accept.expiration_day = self.current_day + mission_to_accept.time_limit
        self.player.active_missions.append(mission_to_accept)
        system.available_missions.remove(mission_to_accept)
        print(f"Mission '{mission_to_accept.id}' accepted! It expires on Day {mission_to_accept.expiration_day}.")
        print("Check your status to see your active mission.")

    def _check_mission_failure(self):
        """Checks for and handles failed missions."""
        failed_missions = []
        for mission in self.player.active_missions:
            if self.current_day > mission.expiration_day:
                failed_missions.append(mission)
        
        for mission in failed_missions:
            self.player.active_missions.remove(mission)
            # Harsh penalty for failure
            reputation_penalty = mission.reward_reputation * 2
            self.player.add_reputation(mission.faction, -reputation_penalty)
            print(f"\n--- MISSION FAILED ---")
            print(f"Mission '{mission.id}' expired on Day {mission.expiration_day}.")
            print(f"Your reputation with {mission.faction} has suffered greatly.")

    def _handle_complete(self, parts):
        """Completes a mission."""
        if len(parts) < 2:
            print("Invalid format. Use: complete <mission_id>")
            return
            
        mission_id = parts[1]
        is_bounty_completion = len(parts) > 2 and parts[2] == "bounty"
        
        mission_to_complete = None
        for mission in self.player.active_missions:
            if mission.id == mission_id:
                mission_to_complete = mission
                break
        
        if not mission_to_complete:
            print(f"You do not have an active mission with ID '{mission_id}'.")
            return
            
        if mission_to_complete.type == "BOUNTY":
            if not is_bounty_completion:
                print("You must defeat the bounty target in combat to complete this mission.")
                return
        else:
            # Check if player is at the correct destination
            if self.player.location != mission_to_complete.destination_system:
                print(f"You must be at {mission_to_complete.destination_system.name} to complete this mission.")
                return
                
            # Check if player has the required cargo
            if self.player.ship.cargo_hold.get(mission_to_complete.good, 0) < mission_to_complete.quantity:
                print(f"You don't have the required {mission_to_complete.quantity} units of {mission_to_complete.good}.")
                return
                
            self.player.ship.remove_cargo(mission_to_complete.good, mission_to_complete.quantity)

        # All checks passed, complete the mission
        self.player.credits += mission_to_complete.reward_credits
        self.player.add_reputation(mission_to_complete.faction, mission_to_complete.reward_reputation)
        
        print(f"\n--- MISSION COMPLETE ---")
        print(f"Mission '{mission_to_complete.id}' complete!")
        print(f"You received {mission_to_complete.reward_credits} credits and {mission_to_complete.reward_reputation} reputation with {mission_to_complete.faction}.")
        
        self.player.active_missions.remove(mission_to_complete)
        mission_to_complete.is_complete = True # Mark for cleanup

    def quit_game(self, parts):
        """Sets the game_over flag to True."""
        self.game_over = True


if __name__ == "__main__":
    game = Game()
    game.run()

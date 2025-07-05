import random
from .classes import StarSystem, CrewMember, Mission
from .game_data import (SYSTEM_NAME_PARTS, PIRATE_NAMES, CREW_RECRUITS, 
                      GOODS, ILLEGAL_GOODS, GALAXY_WIDTH, GALAXY_HEIGHT, 
                      MAX_MISSIONS_PER_SYSTEM, MARKET_DRIFT_FACTOR)

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

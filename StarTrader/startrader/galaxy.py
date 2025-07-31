"""
Galaxy generation and management for Star Trader.

This module handles the creation and ongoing management of the game universe.
It generates star systems, establishes trade routes, manages markets and prices,
creates missions, handles crew recruitment, and processes galactic events.

The Galaxy class serves as the central hub for all world-state management,
including economic simulation, faction relationships, and dynamic events
that affect gameplay across multiple systems.
"""

import random
from .classes import StarSystem, CrewMember, Mission, AICaptain, Factory
from .game_data import (SYSTEM_NAME_PARTS, PIRATE_NAMES, CREW_RECRUITS, 
                      GOODS, ILLEGAL_GOODS, GALACTIC_EVENTS,
                      FACTIONS, TECH_TYPES, PRODUCTION_RECIPES, AI_CAPTAIN_NAMES)
from .constants import (GALAXY_WIDTH, GALAXY_HEIGHT, MAX_MISSIONS_PER_SYSTEM, 
                       MARKET_DRIFT_FACTOR)

class Galaxy:
    """
    Manages the game universe including systems, markets, and galactic events.
    
    The Galaxy class is responsible for:
    - Generating star systems with different economy types
    - Creating trade connections and fuel costs between systems
    - Managing dynamic markets with price fluctuations
    - Spawning missions and crew recruitment opportunities
    - Processing galactic events that affect multiple systems
    - Handling faction relationships and conflicts
    - Managing AI captain operations and factory production
    
    Attributes:
        systems: Dictionary of all star systems by name
        connections: Dictionary mapping systems to their connected neighbors
        fuel_costs: Dictionary of fuel costs between connected systems
        active_events: Current events affecting specific systems
        galactic_events: Global events affecting multiple systems
        market_history: Tracking of recent large trades for price persistence
        faction_relations: Relationships between different factions
        uncharted_systems: Hidden systems that can be discovered
    """
    def __init__(self):
        self.systems = {}
        self.connections = {}
        self.fuel_costs = {}
        self.active_events = {} # e.g., {"Sirius": {"type": "famine", "duration": 5}}
        self.galactic_events = {} # Global events affecting multiple systems
        self.market_history = {} # Track recent large trades for persistent effects
        self.faction_relations = self._init_faction_relations()  # Faction relationships
        self.uncharted_systems = {}  # Hidden systems to be discovered
        self._create_galaxy()
        self._create_uncharted_systems()
        self._generate_markets()
        self._generate_missions()
        self._populate_recruitment_offices()
        self.available_captains = []  # AI captains available for hire
        self._generate_available_captains()

    def _init_faction_relations(self):
        """Initialize faction relationships."""
        relations = {}
        factions = [f for f in FACTIONS.keys() if f != "Independent"]
        
        for faction1 in factions:
            relations[faction1] = {}
            for faction2 in factions:
                if faction1 == faction2:
                    relations[faction1][faction2] = 100  # Perfect self-relation
                else:
                    # Start with neutral relations (0)
                    relations[faction1][faction2] = 0
        
        # Set initial relations based on lore
        relations["Federation"]["Syndicate"] = -20  # Mild distrust
        relations["Syndicate"]["Federation"] = -20
        
        return relations
    
    def update_faction_relations(self, faction1, faction2, change):
        """Update relationship between two factions."""
        if faction1 == "Independent" or faction2 == "Independent":
            return
            
        if faction1 in self.faction_relations and faction2 in self.faction_relations[faction1]:
            old_value = self.faction_relations[faction1][faction2]
            new_value = max(-100, min(100, old_value + change))
            self.faction_relations[faction1][faction2] = new_value
            
            # Relations are somewhat reciprocal
            reciprocal_change = change // 2
            self.faction_relations[faction2][faction1] = max(-100, min(100, 
                self.faction_relations[faction2][faction1] + reciprocal_change))
            
            # Announce major changes
            if abs(old_value - new_value) >= 20:
                if new_value > old_value:
                    print(f"\n--- DIPLOMATIC NEWS ---")
                    print(f"Relations between {faction1} and {faction2} have improved!")
                else:
                    print(f"\n--- DIPLOMATIC NEWS ---")
                    print(f"Tensions rising between {faction1} and {faction2}!")
    
    def get_faction_relation_status(self, faction1, faction2):
        """Get descriptive status of faction relations."""
        if faction1 == "Independent" or faction2 == "Independent":
            return "Neutral"
            
        value = self.faction_relations.get(faction1, {}).get(faction2, 0)
        
        if value >= 80:
            return "Allied"
        elif value >= 40:
            return "Friendly"
        elif value >= -20:
            return "Neutral"
        elif value >= -60:
            return "Hostile"
        else:
            return "At War"
    
    def _populate_recruitment_offices(self):
        """Populates the recruitment offices with potential crew members."""
        # For now, all recruits are available in Sol
        for recruit_data in CREW_RECRUITS:
            self.systems["Sol"].recruitment_office.append(CrewMember(**recruit_data))
    
    def _generate_available_captains(self):
        """Generate AI captains available for hire."""
        used_names = set()
        num_captains = random.randint(3, 5)
        
        for _ in range(num_captains):
            # Pick unique name
            name = random.choice([n for n in AI_CAPTAIN_NAMES if n not in used_names])
            used_names.add(name)
            
            # Random experience and style
            experience = random.choice(["novice", "novice", "experienced", "veteran"])  # More novices
            style = random.choice(["aggressive", "conservative", "balanced"])
            
            captain = AICaptain(name, experience, style)
            
            # Give some preferred goods based on style
            if style == "aggressive":
                captain.preferred_goods = random.sample(list(ILLEGAL_GOODS.keys()), min(2, len(ILLEGAL_GOODS)))
            elif style == "conservative":
                captain.preferred_goods = random.sample(["Food", "Medicine", "Minerals"], 2)
            else:
                captain.preferred_goods = random.sample(list(GOODS.keys()), 3)
            
            self.available_captains.append(captain)

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
    
    def _create_uncharted_systems(self):
        """Create hidden systems that can be discovered through exploration."""
        uncharted_names = [
            "Nebula X-47", "Void Echo", "Lost Haven", "Ghost Drift", 
            "Anomaly Prime", "Silent Reach", "Forgotten Nexus", "Shadow Point",
            "Crystal Expanse", "Relic Station", "Temporal Flux", "Dark Harbor"
        ]
        
        # Create 3-5 uncharted systems
        num_uncharted = random.randint(3, 5)
        used_positions = {(s.x, s.y) for s in self.systems.values()}
        
        for i in range(num_uncharted):
            if i >= len(uncharted_names):
                break
                
            # Find a valid position not too close to existing systems
            attempts = 0
            while attempts < 100:
                x = random.randint(0, GALAXY_WIDTH - 1)
                y = random.randint(0, GALAXY_HEIGHT - 1)
                
                # Check if position is valid (not occupied and not too close)
                if (x, y) not in used_positions:
                    too_close = False
                    for px, py in used_positions:
                        if abs(x - px) <= 1 and abs(y - py) <= 1:
                            too_close = True
                            break
                    
                    if not too_close:
                        # Create the uncharted system
                        name = uncharted_names[i]
                        
                        # Determine special properties
                        system_type = random.choice([
                            "ancient_ruins",
                            "resource_rich", 
                            "derelict_fleet",
                            "anomaly",
                            "pirate_haven"
                        ])
                        
                        descriptions = {
                            "ancient_ruins": "An ancient alien civilization once thrived here.",
                            "resource_rich": "Abundant rare minerals float in dense asteroid fields.",
                            "derelict_fleet": "Wreckage of a massive space battle drifts endlessly.",
                            "anomaly": "Strange energy readings emanate from this mysterious system.",
                            "pirate_haven": "A hidden base for the galaxy's most wanted criminals."
                        }
                        
                        economy_types = {
                            "ancient_ruins": "Core",
                            "resource_rich": "Mining",
                            "derelict_fleet": "Industrial",
                            "anomaly": "Core",
                            "pirate_haven": "Independent"
                        }
                        
                        faction = "Independent"  # Most uncharted systems are independent
                        if system_type == "pirate_haven":
                            faction = "Syndicate"
                            
                        system = StarSystem(
                            name, 
                            descriptions[system_type],
                            economy_types[system_type],
                            faction,
                            x, y,
                            has_shipyard=(system_type == "pirate_haven")
                        )
                        
                        # Add special properties
                        system.is_uncharted = True
                        system.discovered = False
                        system.system_type = system_type
                        system.discovery_bonus = random.randint(500, 2000)
                        system.exploration_danger = random.uniform(0.3, 0.8)
                        
                        # Ancient ruins have artifacts
                        if system_type == "ancient_ruins":
                            system.has_artifacts = True
                            system.artifacts_remaining = random.randint(1, 3)
                            
                        # Resource rich systems have special goods
                        if system_type == "resource_rich":
                            system.special_resource = random.choice([
                                "Quantum Crystals", "Dark Matter", "Neutronium", "Exotic Particles"
                            ])
                            
                        self.uncharted_systems[name] = system
                        used_positions.add((x, y))
                        break
                        
                attempts += 1

    def _calculate_distance(self, system1, system2):
        """Calculates the distance between two systems."""
        return ((system1.x - system2.x)**2 + (system1.y - system2.y)**2)**0.5

    def _get_base_price_multiplier(self, system_economy, good):
        """Calculates the base price multiplier for a good in a system."""
        # Original goods
        if system_economy == "Agricultural" and good == "Food": return 0.6
        if system_economy != "Agricultural" and good == "Food": return 1.4
        if system_economy == "Industrial" and good == "Machinery": return 0.7
        if system_economy != "Industrial" and good == "Machinery": return 1.3
        if system_economy == "Mining" and good == "Minerals": return 0.5
        if system_economy != "Mining" and good == "Minerals": return 1.5
        
        # Production chain goods
        if system_economy == "Mining" and good == "Ore": return 0.5
        if system_economy == "Agricultural" and good == "Crops": return 0.5
        if system_economy == "Industrial" and good in ["Chemicals", "Alloys", "Electronics"]: return 0.7
        if system_economy == "Agricultural" and good == "Processed Food": return 0.7
        if system_economy == "Core" and good in ["Ship Components", "Advanced Medicine", "Quantum Processors"]: return 0.8
        
        # Higher prices for goods not produced locally
        if good in ["Ore", "Alloys", "Ship Components"] and system_economy == "Agricultural": return 1.5
        if good in ["Crops", "Processed Food"] and system_economy == "Mining": return 1.5
        
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
                
                # Check for local events
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
                
                # Check for galactic events
                for event in self.galactic_events.values():
                    if event["type"] == "faction_war" and system.faction in event.get("factions", []):
                        multiplier *= 1.2  # War increases prices
                    elif event["type"] == "tech_breakthrough":
                        if event.get("tech_type") == "agricultural" and good == "Food":
                            multiplier *= 0.7  # Tech reduces food prices
                        elif event.get("tech_type") == "medical" and good == "Medicine":
                            multiplier *= 0.7  # Tech reduces medicine prices
                        elif event.get("tech_type") == "mining" and good == "Minerals":
                            multiplier *= 0.8  # Tech reduces mineral prices
                    elif event["type"] == "trade_boom" and system.faction == event.get("faction"):
                        multiplier *= 0.9  # Trade boom reduces all prices slightly
                    elif event["type"] == "plague" and event.get("system") == system.name and good == "Medicine":
                        multiplier *= event["effects"]["medicine_multiplier"]  # Plague massively increases medicine prices

                target_price = int(base_price * multiplier)
                # Drift price towards the target price
                data["price"] += (target_price - data["price"]) // MARKET_DRIFT_FACTOR
        
        self._generate_missions()
        self._update_galactic_events()
        self._update_market_history()
    
    def _update_galactic_events(self):
        """Updates and potentially triggers new galactic events."""
        # Decay existing events
        for event_id in list(self.galactic_events.keys()):
            event = self.galactic_events[event_id]
            event["duration"] -= 1
            if event["duration"] <= 0:
                print(f"\n--- GALACTIC NEWS ---")
                print(f"The {event['name']} has ended.")
                del self.galactic_events[event_id]
        
        # Chance to trigger new event
        if random.random() < 0.1 and len(self.galactic_events) < 2:  # 10% chance, max 2 concurrent events
            self._trigger_galactic_event()
    
    def _trigger_galactic_event(self):
        """Triggers a new galactic event."""
        event_type = random.choice(list(GALACTIC_EVENTS.keys()))
        event_template = GALACTIC_EVENTS[event_type]
        event_id = f"{event_type}_{random.randint(1000, 9999)}"
        
        # Generate event details based on type
        if event_type == "faction_war":
            factions = [f for f in FACTIONS.keys() if f != "Independent"]
            if len(factions) >= 2:
                faction1, faction2 = random.sample(factions, 2)
                description = event_template["description"].format(faction1=faction1, faction2=faction2)
                event_data = {
                    "name": event_template["name"],
                    "type": event_type,
                    "duration": event_template["duration"],
                    "description": description,
                    "factions": [faction1, faction2],
                    "effects": event_template["effects"]
                }
                # War severely damages relations
                self.update_faction_relations(faction1, faction2, -50)
        elif event_type == "tech_breakthrough":
            system = random.choice(list(self.systems.values()))
            tech_type = random.choice(TECH_TYPES)
            description = event_template["description"].format(system=system.name, tech_type=tech_type)
            event_data = {
                "name": event_template["name"],
                "type": event_type,
                "duration": event_template["duration"],
                "description": description,
                "system": system.name,
                "tech_type": tech_type,
                "effects": event_template["effects"]
            }
        elif event_type == "trade_boom":
            faction = random.choice([f for f in FACTIONS.keys() if f != "Independent"])
            description = event_template["description"].format(faction=faction)
            event_data = {
                "name": event_template["name"],
                "type": event_type,
                "duration": event_template["duration"],
                "description": description,
                "faction": faction,
                "effects": event_template["effects"]
            }
        elif event_type == "plague":
            system = random.choice(list(self.systems.values()))
            description = event_template["description"].format(system=system.name)
            event_data = {
                "name": event_template["name"],
                "type": event_type,
                "duration": event_template["duration"],
                "description": description,
                "system": system.name,
                "effects": event_template["effects"]
            }
        
        self.galactic_events[event_id] = event_data
        print(f"\n--- BREAKING NEWS ---")
        print(description)
    
    def record_market_manipulation(self, system_name, good, quantity, action):
        """Records large trades that should affect market prices persistently."""
        # Only record trades that are significant (>30 units or >30% of market)
        market_quantity = self.systems[system_name].market[good]["quantity"]
        
        if quantity > 30 or quantity > market_quantity * 0.3:
            if system_name not in self.market_history:
                self.market_history[system_name] = {}
            
            if good not in self.market_history[system_name]:
                self.market_history[system_name][good] = []
            
            # Record the manipulation
            self.market_history[system_name][good].append({
                "action": action,  # "buy" or "sell"
                "quantity": quantity,
                "impact": quantity / max(50, market_quantity),  # Impact factor
                "duration": 10  # Days the effect lasts
            })
            
            if action == "buy":
                print(f"\n--- MARKET ALERT ---")
                print(f"Large purchase of {good} in {system_name} is affecting regional prices!")
            else:
                print(f"\n--- MARKET ALERT ---")
                print(f"Major influx of {good} in {system_name} is depressing prices across the region!")
    
    def _update_market_history(self):
        """Updates and applies persistent market manipulation effects."""
        systems_to_clean = []
        
        for system_name, goods_history in self.market_history.items():
            goods_to_clean = []
            
            for good, manipulations in goods_history.items():
                # Update and filter active manipulations
                active_manipulations = []
                
                for manip in manipulations:
                    manip["duration"] -= 1
                    if manip["duration"] > 0:
                        active_manipulations.append(manip)
                
                if active_manipulations:
                    goods_history[good] = active_manipulations
                    
                    # Apply cumulative effect to market
                    system = self.systems[system_name]
                    if good in system.market:
                        cumulative_effect = 0
                        
                        for manip in active_manipulations:
                            if manip["action"] == "buy":
                                # Large buys increase prices
                                cumulative_effect += manip["impact"] * 0.2
                            else:
                                # Large sells decrease prices
                                cumulative_effect -= manip["impact"] * 0.2
                        
                        # Apply the effect
                        price_modifier = 1 + cumulative_effect
                        system.market[good]["price"] = int(system.market[good]["price"] * price_modifier)
                        
                        # Affect neighboring systems with reduced impact
                        for neighbor_name in self.connections.get(system_name, []):
                            neighbor = self.systems[neighbor_name]
                            if good in neighbor.market:
                                neighbor_effect = cumulative_effect * 0.3  # 30% spillover
                                neighbor.market[good]["price"] = int(neighbor.market[good]["price"] * (1 + neighbor_effect))
                else:
                    goods_to_clean.append(good)
            
            # Clean up expired goods
            for good in goods_to_clean:
                del goods_history[good]
            
            if not goods_history:
                systems_to_clean.append(system_name)
        
        # Clean up empty systems
        for system_name in systems_to_clean:
            del self.market_history[system_name]
    
    def process_ai_captain_trades(self, player):
        """Process automated trades for all AI captains."""
        captain_reports = []
        
        for captain in player.ai_captains:
            if captain.assigned_ship_id:
                # Find the assigned ship
                ship = None
                for s in player.ships:
                    if s.id == captain.assigned_ship_id:
                        ship = s
                        break
                
                if ship and ship.location and captain.trade_route:
                    report = self._execute_captain_trade(captain, ship)
                    if report:
                        captain_reports.append(report)
        
        return captain_reports
    
    def _execute_captain_trade(self, captain, ship):
        """Execute a single trade action for an AI captain."""
        current_system = self.systems[ship.location]
        
        # Move to next destination in route
        if captain.current_target_index >= len(captain.trade_route):
            captain.current_target_index = 0
        
        if captain.current_target_index < len(captain.trade_route):
            target_system_name = captain.trade_route[captain.current_target_index]
            
            # Check if we're already at target
            if ship.location == target_system_name:
                # Try to trade
                trade_profit = self._captain_trade_at_system(captain, ship, current_system)
                
                # Move to next target
                captain.current_target_index = (captain.current_target_index + 1) % len(captain.trade_route)
                
                if trade_profit > 0:
                    captain.total_profit += trade_profit
                    return f"{captain.name} made {trade_profit} credits trading at {ship.location}"
            else:
                # Travel to target
                if target_system_name in self.connections.get(ship.location, []):
                    fuel_cost = self.fuel_costs.get((ship.location, target_system_name), 10)
                    
                    if ship.fuel >= fuel_cost:
                        ship.fuel -= fuel_cost
                        ship.location = target_system_name
                        return f"{captain.name} traveled from {current_system.name} to {target_system_name}"
                    else:
                        # Refuel if needed
                        refuel_cost = (ship.max_fuel - ship.fuel) * 10
                        if captain.total_profit >= refuel_cost:
                            ship.fuel = ship.max_fuel
                            captain.total_profit -= refuel_cost
                            return f"{captain.name} refueled at {ship.location} for {refuel_cost} credits"
        
        return None
    
    def _captain_trade_at_system(self, captain, ship, system):
        """Execute trades at a system."""
        total_profit = 0
        cargo_space = ship.cargo_capacity - ship.get_cargo_used()
        
        # Sell goods if profitable
        for good, quantity in list(ship.cargo_hold.items()):
            if good in system.market:
                sell_price = system.market[good]["price"]
                # Captains know approximate buy prices
                estimated_buy_price = GOODS.get(good, ILLEGAL_GOODS.get(good, {"base_price": 100}))["base_price"]
                
                if sell_price > estimated_buy_price * (1 + captain.get_profit_margin()):
                    # Sell
                    system.market[good]["quantity"] += quantity
                    ship.remove_cargo(good, quantity)
                    profit = sell_price * quantity
                    total_profit += profit
                    cargo_space += quantity
        
        # Buy goods that look profitable
        for good in captain.preferred_goods:
            if good in system.market and cargo_space > 0:
                buy_price = system.market[good]["price"]
                base_price = GOODS.get(good, ILLEGAL_GOODS.get(good, {"base_price": 100}))["base_price"]
                
                # Buy if price is low
                if buy_price < base_price * (1 - captain.get_profit_margin()):
                    quantity = min(cargo_space, system.market[good]["quantity"], 20)
                    if quantity > 0 and captain.total_profit >= buy_price * quantity:
                        system.market[good]["quantity"] -= quantity
                        ship.add_cargo(good, quantity)
                        captain.total_profit -= buy_price * quantity
                        cargo_space -= quantity
        
        if total_profit > 0:
            captain.trips_completed += 1
        
        return total_profit
    
    def process_factories(self, player):
        """Process all player-owned factories."""
        factory_reports = []
        
        for factory in player.factories:
            system = self.systems.get(factory.system_name)
            if not system:
                continue
                
            # Deduct daily operating costs
            if player.credits >= factory.daily_cost:
                player.credits -= factory.daily_cost
            else:
                factory_reports.append(f"{factory.product} factory in {factory.system_name} shut down - can't afford operating costs!")
                continue
            
            # Try to produce if possible
            factory.days_since_production += 1
            
            if factory.can_produce():
                factory.produce()
                factory_reports.append(f"{factory.product} factory in {factory.system_name} produced goods!")
            
            # If factory has a manager, try to buy inputs automatically
            if factory.manager and player.credits > 1000:
                recipe = factory.get_recipe()
                if recipe:
                    for input_good, required in recipe["inputs"].items():
                        current = factory.storage.get(input_good, 0)
                        needed = max(0, required * 3 - current)  # Keep 3 batches in stock
                        
                        if needed > 0 and input_good in system.market:
                            price = system.market[input_good]["price"]
                            available = system.market[input_good]["quantity"]
                            to_buy = min(needed, available, player.credits // price)
                            
                            if to_buy > 0:
                                cost = to_buy * price
                                player.credits -= cost
                                system.market[input_good]["quantity"] -= to_buy
                                factory.add_input(input_good, to_buy)
                                factory_reports.append(f"Factory manager bought {to_buy} {input_good} for {cost} credits")
        
        return factory_reports

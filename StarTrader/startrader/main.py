import time
import json
import os
from .classes import Player, Ship, Mission
from .galaxy import Galaxy
from .events import EventManager
from .game_data import (FACTIONS, ILLEGAL_GOODS, MODULE_SPECS)

# --- Game Balance Constants ---
CONSTANTS = {
    "REPAIR_COST_PER_HP": 15,
    "FUEL_COST_PER_UNIT": 10,
    "EVENT_CHANCE": 0.25,
    "REPUTATION_DISCOUNT_THRESHOLD": 50,
    "PRICE_IMPACT_FACTOR": 0.05,
    "QUANTITY_IMPACT_DIVISOR": 50,
    "SAVE_FILE_NAME": "savegame.json"
}

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
        self.constants = CONSTANTS

    def get_status(self):
        ship = self.player.ship
        system = self.player.location
        connections = self.galaxy.connections.get(system.name, [])
        travel_options = ", ".join(connections) or "None"
        cargo_list = ", ".join(f"{item} ({qty})" for item, qty in ship.cargo_hold.items()) or "Empty"

        status = (
            f"--- Captain {self.player.name} ---\n"
            f"Credits: {self.player.credits}\n"
            f"\n--- Current Location: {system.name} ({system.economy_type})\n"
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
        market_data["price"] = int(market_data["price"] * (1 + self.constants['PRICE_IMPACT_FACTOR'] * (quantity / self.constants['QUANTITY_IMPACT_DIVISOR']))) + 1 # Price increases on buy
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
        market_data["price"] = max(1, int(market_data["price"] * (1 - self.constants['PRICE_IMPACT_FACTOR'] * (quantity / self.constants['QUANTITY_IMPACT_DIVISOR']))) - 1) # Price decreases on sell, min 1
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
        if self.player.reputation.get(faction, 0) >= self.constants['REPUTATION_DISCOUNT_THRESHOLD']: # Reputation >= 50 gives discount
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
        if self.player.reputation.get(faction, 0) >= self.constants['REPUTATION_DISCOUNT_THRESHOLD']:
             print("Your high reputation with this faction gives you a 10% discount on repairs!")
        
        print(f"Hull: {self.player.ship.hull}/{self.player.ship.max_hull}. Repair cost: {self.constants['REPAIR_COST_PER_HP']} credits per point.")
        
        print("\n--- Available Modules for Purchase ---")
        for module_type, modules in MODULE_SPECS.items():
            print(f"\n-- {module_type.upper()} --")
            for module_id, specs in modules.items():
                print(f"  ID: {module_id} | {specs['name']:<20} | Cost: {specs['cost']:<5} | Stats: {specs}")

    def _handle_repair(self, parts):
        ship = self.player.ship
        damage = ship.max_hull - ship.hull
        if damage == 0: print("Ship hull is already at maximum."); return
        
        cost = damage * self.constants['REPAIR_COST_PER_HP']
        
        # Apply faction discount
        faction = self.player.location.faction
        if self.player.reputation.get(faction, 0) >= self.constants['REPUTATION_DISCOUNT_THRESHOLD']: # Reputation >= 50 gives discount
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
        
        cost = amount_to_buy * self.constants['FUEL_COST_PER_UNIT']
        
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
        
        if os.path.exists(self.constants['SAVE_FILE_NAME']):
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
        
        with open(self.constants['SAVE_FILE_NAME'], 'w') as f:
            json.dump(game_state, f, indent=4)
        print(f"Game saved to {self.constants['SAVE_FILE_NAME']}.")

    def _handle_load(self, parts):
        """Loads the game state from a file."""
        if not os.path.exists(self.constants['SAVE_FILE_NAME']):
            print("No save file found.")
            return

        with open(self.constants['SAVE_FILE_NAME'], 'r') as f:
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

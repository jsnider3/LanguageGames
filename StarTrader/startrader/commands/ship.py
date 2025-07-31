"""
Ship management command handlers.
"""

from .base import BaseCommandHandler
from ..game_data import SHIP_CLASSES, MODULE_SPECS
from ..constants import REPAIR_COST_PER_HP, FUEL_COST_PER_UNIT, REPUTATION_DISCOUNT_THRESHOLD


class ShipCommands(BaseCommandHandler):
    """Handles all ship-related commands."""
    
    def handle_shipyard(self, parts):
        """Display shipyard options and prices."""
        system = self.get_current_system()
        print(f"\n--- {system.name} Shipyard ---")
        
        if system.economy_type == "Agricultural":
            print("This agricultural system doesn't have a shipyard.")
            return
        
        print("Available ships:")
        print(f"{'Ship Class':<15} {'Price':>10} {'Cargo':>10} {'Combat':>10}")
        print("-" * 47)
        
        for ship_class, data in SHIP_CLASSES.items():
            if ship_class != "Shuttle":  # Can't buy shuttles
                print(f"{ship_class:<15} {data['price']:>10} {data['cargo']:>10} {data['combat']:>10}")
        
        print("\nAvailable upgrades:")
        print(f"{'Module':<20} {'Price':>10} {'Effect':<30}")
        print("-" * 62)
        
        for module, data in MODULE_SPECS.items():
            print(f"{module:<20} {data['price']:>10} {data['effect']:<30}")
        
        print("\nUse 'repair' to fix your ship.")
        print("Use 'buyship <ship class>' to purchase a new ship.")
        print("Use 'upgrade <module>' to upgrade your ship.")
        print("Use 'sellmodule <module>' to sell upgrades.")
    
    def handle_repair(self, parts):
        """Repair the player's current ship."""
        ship = self.get_current_ship()
        damage = ship.max_hull - ship.hull
        
        if damage == 0:
            print("Your ship is already in perfect condition.")
            return
        
        total_cost = damage * REPAIR_COST_PER_HP
        
        # Apply faction discount if applicable
        system = self.get_current_system()
        faction = system.faction
        
        if (faction != "Independent" and 
            self.player.reputation.get(faction, 0) >= REPUTATION_DISCOUNT_THRESHOLD):
            discount = int(total_cost * 0.1)
            total_cost -= discount
            print(f"Your good reputation with {faction} gets you a 10% discount!")
        
        print(f"Repairing {damage} hull points will cost {total_cost} credits.")
        
        if self.player.credits < total_cost:
            affordable = self.player.credits // REPAIR_COST_PER_HP
            if affordable > 0:
                print(f"You can only afford to repair {affordable} hull points.")
                print(f"Repair {affordable} hull points? (y/n)")
                if input().strip().lower() == 'y':
                    cost = affordable * REPAIR_COST_PER_HP
                    self.player.credits -= cost
                    ship.hull += affordable
                    print(f"Repaired {affordable} hull points for {cost} credits.")
                    print(f"Hull is now {ship.hull}/{ship.max_hull}.")
            else:
                print("You don't have enough credits to repair any damage.")
        else:
            print("Repair all damage? (y/n)")
            if input().strip().lower() == 'y':
                self.player.credits -= total_cost
                ship.hull = ship.max_hull
                print(f"Ship fully repaired for {total_cost} credits.")
    
    def handle_upgrade(self, parts):
        """Upgrade the player's ship with modules."""
        if not self.validate_command(parts, 2, "upgrade <module name>"):
            return
        
        module_name = " ".join(parts[1:]).title()
        
        if module_name not in MODULE_SPECS:
            print(f"Unknown module: '{module_name}'")
            print(f"Available modules: {', '.join(MODULE_SPECS.keys())}")
            return
        
        ship = self.get_current_ship()
        
        if module_name in ship.modules:
            print(f"Your ship already has the {module_name} module.")
            return
        
        module_data = MODULE_SPECS[module_name]
        cost = module_data["price"]
        
        if self.player.credits < cost:
            print(f"Not enough credits. You need {cost}, but only have {self.player.credits}.")
            return
        
        # Check for economy type restrictions
        system = self.get_current_system()
        if system.economy_type == "Agricultural":
            print("This agricultural system doesn't have advanced shipyard facilities.")
            return
        
        # Apply the upgrade
        self.player.credits -= cost
        ship.modules.append(module_name)
        
        # Apply module effects
        if module_name == "Cargo Expansion":
            ship.cargo_capacity += 20
            print(f"Cargo capacity increased to {ship.cargo_capacity}.")
        elif module_name == "Shield Generator":
            ship.max_shield += 10
            ship.shield = ship.max_shield
            print("Shield capacity increased by 10.")
        elif module_name == "Fuel Tanks":
            ship.max_fuel += 5
            print(f"Fuel capacity increased to {ship.max_fuel}.")
        elif module_name == "Weapon Systems":
            ship.damage += 10
            print("Weapon damage increased by 10.")
        elif module_name == "Engine Upgrade":
            ship.evasion += 5
            print("Ship evasion increased by 5.")
        
        print(f"Successfully installed {module_name} for {cost} credits.")
        
        # Give experience
        self.player.give_crew_experience("Engineer", 2)
    
    def handle_sell_module(self, parts):
        """Sell installed ship modules."""
        if not self.validate_command(parts, 2, "sellmodule <module name>"):
            return
        
        module_name = " ".join(parts[1:]).title()
        ship = self.get_current_ship()
        
        if module_name not in ship.modules:
            print(f"Your ship doesn't have the {module_name} module.")
            print(f"Installed modules: {', '.join(ship.modules) if ship.modules else 'None'}")
            return
        
        module_data = MODULE_SPECS[module_name]
        sell_price = module_data["price"] // 2
        
        print(f"Sell {module_name} for {sell_price} credits? (y/n)")
        if input().strip().lower() != 'y':
            return
        
        # Remove module
        ship.modules.remove(module_name)
        self.player.credits += sell_price
        
        # Reverse module effects
        if module_name == "Cargo Expansion":
            ship.cargo_capacity -= 20
            print(f"Cargo capacity reduced to {ship.cargo_capacity}.")
            # Check if cargo needs to be jettisoned
            if ship.get_cargo_used() > ship.cargo_capacity:
                print("WARNING: Your cargo now exceeds capacity!")
        elif module_name == "Shield Generator":
            ship.max_shield -= 10
            ship.shield = min(ship.shield, ship.max_shield)
            print("Shield capacity reduced by 10.")
        elif module_name == "Fuel Tanks":
            ship.max_fuel -= 5
            ship.fuel = min(ship.fuel, ship.max_fuel)
            print(f"Fuel capacity reduced to {ship.max_fuel}.")
        elif module_name == "Weapon Systems":
            ship.damage -= 10
            print("Weapon damage reduced by 10.")
        elif module_name == "Engine Upgrade":
            ship.evasion -= 5
            print("Ship evasion reduced by 5.")
        
        print(f"Sold {module_name} for {sell_price} credits.")
    
    def handle_buy_ship(self, parts):
        """Purchase a new ship."""
        if not self.validate_command(parts, 2, "buyship <ship class>"):
            return
        
        ship_class = " ".join(parts[1:]).title()
        
        if ship_class not in SHIP_CLASSES or ship_class == "Shuttle":
            print(f"Invalid ship class: '{ship_class}'")
            print(f"Available classes: {', '.join([s for s in SHIP_CLASSES.keys() if s != 'Shuttle'])}")
            return
        
        system = self.get_current_system()
        if system.economy_type == "Agricultural":
            print("This agricultural system doesn't have a shipyard.")
            return
        
        ship_data = SHIP_CLASSES[ship_class]
        cost = ship_data["price"]
        
        # Apply faction discount
        faction = system.faction
        if (faction != "Independent" and 
            self.player.reputation.get(faction, 0) >= REPUTATION_DISCOUNT_THRESHOLD):
            discount = int(cost * 0.1)
            cost -= discount
            print(f"Your good reputation with {faction} gets you a 10% discount!")
        
        if self.player.credits < cost:
            print(f"Not enough credits. You need {cost}, but only have {self.player.credits}.")
            return
        
        # Warn about cargo
        current_ship = self.get_current_ship()
        if current_ship.get_cargo_used() > 0:
            print("\nWARNING: Buying a new ship will transfer your cargo to the new ship.")
            print("Any cargo that doesn't fit will be lost!")
        
        print(f"\nBuy {ship_class} for {cost} credits? (y/n)")
        if input().strip().lower() != 'y':
            return
        
        # Create new ship
        from ..classes import Ship
        new_ship = Ship(ship_class)
        
        # Transfer what cargo fits
        old_cargo = current_ship.cargo_hold.copy()
        transferred = 0
        lost = 0
        
        for good, quantity in old_cargo.items():
            space_available = new_ship.cargo_capacity - new_ship.get_cargo_used()
            to_transfer = min(quantity, space_available)
            
            if to_transfer > 0:
                new_ship.add_cargo(good, to_transfer)
                transferred += to_transfer
            
            if to_transfer < quantity:
                lost += quantity - to_transfer
        
        # Add ship to fleet
        self.player.ships.append(new_ship)
        self.player.current_ship_index = len(self.player.ships) - 1
        self.player.credits -= cost
        
        print(f"\nPurchased {ship_class} for {cost} credits!")
        if transferred > 0:
            print(f"Transferred {transferred} units of cargo.")
        if lost > 0:
            print(f"WARNING: Lost {lost} units of cargo due to insufficient space!")
        
        print(f"You now have {len(self.player.ships)} ships in your fleet.")
    
    def handle_refuel(self, parts):
        """Refuel the player's ship."""
        ship = self.get_current_ship()
        max_fuel_needed = ship.max_fuel - ship.fuel
        
        if max_fuel_needed == 0:
            print("Your fuel tank is already full.")
            return
        
        fuel_price = FUEL_COST_PER_UNIT
        
        # Apply faction discount
        system = self.get_current_system()
        faction = system.faction
        if (faction != "Independent" and 
            self.player.reputation.get(faction, 0) >= REPUTATION_DISCOUNT_THRESHOLD):
            fuel_price = int(fuel_price * 0.9)
            print(f"Your good reputation with {faction} gets you a fuel discount!")
        
        if len(parts) > 1:
            try:
                amount = int(parts[1])
                if amount <= 0:
                    print("Amount must be positive.")
                    return
                amount_to_buy = min(amount, max_fuel_needed)
            except ValueError:
                print("Invalid amount. Use: refuel <amount> or just 'refuel' to fill up.")
                return
        else:
            amount_to_buy = max_fuel_needed
        
        cost = amount_to_buy * fuel_price
        
        if self.player.credits < cost:
            affordable = self.player.credits // fuel_price
            if affordable > 0:
                print(f"You can only afford {affordable} units of fuel.")
                print(f"Buy {affordable} units for {affordable * fuel_price} credits? (y/n)")
                if input().strip().lower() == 'y':
                    cost = affordable * fuel_price
                    self.player.credits -= cost
                    ship.fuel += affordable
                    print(f"Refueled {affordable} units for {cost} credits.")
                    print(f"Fuel is now {ship.fuel}/{ship.max_fuel}.")
            else:
                print("You don't have enough credits to buy any fuel.")
            return
        
        self.player.credits -= cost
        ship.fuel += amount_to_buy
        print(f"Refueled {amount_to_buy} units for {cost} credits. Fuel is now {ship.fuel}/{ship.max_fuel}.")
    
    def handle_fleet(self, parts):
        """Display player's fleet status."""
        print("\n--- YOUR FLEET ---")
        print(f"Ships owned: {len(self.player.ships)}")
        print()
        
        for i, ship in enumerate(self.player.ships):
            status = "ACTIVE" if i == self.player.current_ship_index else "DOCKED"
            captain_name = "You"
            
            # Check if AI captain assigned
            for captain in self.player.ai_captains:
                if captain.ship == ship:
                    captain_name = captain.name
                    status = f"AI: {captain.status}"
                    break
            
            print(f"{i+1}. {ship.name} ({ship.ship_class})")
            print(f"   Status: {status}")
            print(f"   Captain: {captain_name}")
            print(f"   Location: {ship.current_location}")
            print(f"   Hull: {ship.hull}/{ship.max_hull}")
            print(f"   Cargo: {ship.get_cargo_used()}/{ship.cargo_capacity}")
            print(f"   Specialization: {ship.specialization.title()} (Level {ship.level})")
            if ship.modules:
                print(f"   Modules: {', '.join(ship.modules)}")
            print()
        
        print("Commands:")
        print("  switchship <number> - Switch to a different ship")
        print("  renameship <number> <new name> - Rename a ship")
        print("  assigncaptain <captain> <ship number> - Assign AI captain")
    
    def handle_switch_ship(self, parts):
        """Switch to a different ship in the fleet."""
        if not self.validate_command(parts, 2, "switchship <ship number>"):
            return
        
        try:
            ship_num = int(parts[1]) - 1
        except ValueError:
            print("Ship number must be a number.")
            return
        
        if ship_num < 0 or ship_num >= len(self.player.ships):
            print(f"Invalid ship number. You have {len(self.player.ships)} ships.")
            return
        
        # Check if ship has AI captain
        target_ship = self.player.ships[ship_num]
        for captain in self.player.ai_captains:
            if captain.ship == target_ship:
                print(f"That ship is commanded by {captain.name}.")
                print("You must fire the captain first.")
                return
        
        # Check if ships are in same location
        current_ship = self.get_current_ship()
        if current_ship.current_location != target_ship.current_location:
            print(f"That ship is in {target_ship.current_location}, not here.")
            return
        
        self.player.current_ship_index = ship_num
        print(f"Switched to {target_ship.name} ({target_ship.ship_class}).")
    
    def handle_rename_ship(self, parts):
        """Rename a ship in the fleet."""
        if not self.validate_command(parts, 3, "renameship <ship number> <new name>"):
            return
        
        try:
            ship_num = int(parts[1]) - 1
        except ValueError:
            print("Ship number must be a number.")
            return
        
        if ship_num < 0 or ship_num >= len(self.player.ships):
            print(f"Invalid ship number. You have {len(self.player.ships)} ships.")
            return
        
        new_name = " ".join(parts[2:])
        old_name = self.player.ships[ship_num].name
        self.player.ships[ship_num].name = new_name
        print(f"Renamed '{old_name}' to '{new_name}'.")
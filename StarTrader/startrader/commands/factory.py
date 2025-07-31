"""
Factory management command handlers.
"""

import random
from .base import BaseCommandHandler
from ..classes import Factory
from ..game_data import PRODUCTION_RECIPES, GOODS


class FactoryCommands(BaseCommandHandler):
    """Handles all factory-related commands."""
    
    def handle_build_factory(self, parts):
        """Build a factory at the current location."""
        system = self.get_current_system()
        
        # Check if industrial system
        if system.economy_type != "Industrial":
            print("Factories can only be built in Industrial systems.")
            return
        
        # Check if player already owns a factory here
        for factory in self.player.factories:
            if factory.location == system.name:
                print("You already own a factory in this system.")
                return
        
        # Factory cost depends on system
        base_cost = 50000
        if system.economy_type == "High-Tech":
            base_cost = 75000
        
        print(f"\n--- BUILD FACTORY IN {system.name.upper()} ---")
        print(f"Cost: {base_cost} credits")
        print("Factories generate passive income by producing goods.")
        print("You can assign managers and upgrade production capacity.")
        print(f"\nBuild factory? (y/n)")
        
        if input().strip().lower() != 'y':
            return
        
        if self.player.credits < base_cost:
            print(f"Not enough credits. You need {base_cost}, but only have {self.player.credits}.")
            return
        
        # Create factory
        factory = Factory(system.name)
        self.player.factories.append(factory)
        self.player.credits -= base_cost
        
        print(f"\nFactory built in {system.name}!")
        print("Use 'factories' to view all your factories.")
        print("Use 'factorysupply <factory#> <good> <amount>' to supply raw materials.")
    
    def handle_factories(self, parts):
        """Display all owned factories."""
        if not self.player.factories:
            print("You don't own any factories.")
            return
        
        print("\n--- YOUR FACTORIES ---")
        print(f"Total factories: {len(self.player.factories)}")
        print()
        
        for i, factory in enumerate(self.player.factories):
            print(f"{i+1}. Factory in {factory.location}")
            print(f"   Production Level: {factory.production_level}")
            print(f"   Manager: {factory.manager.name if factory.manager else 'None'}")
            print(f"   Efficiency: {factory.efficiency:.0%}")
            
            # Show current production
            if factory.current_recipe:
                recipe = PRODUCTION_RECIPES[factory.current_recipe]
                print(f"   Producing: {factory.current_recipe}")
                print(f"   Progress: {factory.production_progress}/{recipe['time']} days")
            else:
                print("   Status: Idle")
            
            # Show inventory
            if factory.inventory:
                print("   Inventory:")
                for good, amount in factory.inventory.items():
                    print(f"     {good}: {amount}")
            
            # Show stored goods
            if factory.stored_goods:
                print("   Output Storage:")
                for good, amount in factory.stored_goods.items():
                    print(f"     {good}: {amount}")
            
            print(f"   Daily Costs: {factory.daily_cost} credits")
            print()
        
        print("Commands:")
        print("  factorysupply <#> <good> <amount> - Supply raw materials")
        print("  factorycollect <#> - Collect produced goods")
        print("  factoryupgrade <#> - Upgrade production level")
    
    def handle_factory_supply(self, parts):
        """Supply raw materials to a factory."""
        if not self.validate_command(parts, 4, "factorysupply <factory#> <good> <amount>"):
            return
        
        try:
            factory_num = int(parts[1]) - 1
            good_name = parts[2].title()
            amount = int(parts[3])
        except ValueError:
            print("Invalid format. Use: factorysupply <factory#> <good> <amount>")
            return
        
        if factory_num < 0 or factory_num >= len(self.player.factories):
            print(f"Invalid factory number. You have {len(self.player.factories)} factories.")
            return
        
        factory = self.player.factories[factory_num]
        ship = self.get_current_ship()
        
        # Check if ship is at factory location
        if self.player.location.name != factory.location:
            print(f"You must be in {factory.location} to supply this factory.")
            return
        
        # Check cargo
        if good_name not in ship.cargo_hold or ship.cargo_hold[good_name] < amount:
            print(f"You don't have {amount} units of {good_name}.")
            return
        
        # Transfer goods
        ship.remove_cargo(good_name, amount)
        if good_name not in factory.inventory:
            factory.inventory[good_name] = 0
        factory.inventory[good_name] += amount
        
        print(f"Supplied {amount} units of {good_name} to factory.")
        
        # Check if factory can start production
        if not factory.current_recipe:
            self._check_production_start(factory)
    
    def handle_factory_collect(self, parts):
        """Collect produced goods from a factory."""
        if not self.validate_command(parts, 2, "factorycollect <factory#>"):
            return
        
        try:
            factory_num = int(parts[1]) - 1
        except ValueError:
            print("Factory number must be a number.")
            return
        
        if factory_num < 0 or factory_num >= len(self.player.factories):
            print(f"Invalid factory number. You have {len(self.player.factories)} factories.")
            return
        
        factory = self.player.factories[factory_num]
        ship = self.get_current_ship()
        
        # Check location
        if self.player.location.name != factory.location:
            print(f"You must be in {factory.location} to collect from this factory.")
            return
        
        if not factory.stored_goods:
            print("No goods to collect from this factory.")
            return
        
        # Show available goods
        print(f"\n--- Factory Output Storage ---")
        total_units = 0
        for good, amount in factory.stored_goods.items():
            print(f"{good}: {amount} units")
            total_units += amount
        
        cargo_free = ship.cargo_capacity - ship.get_cargo_used()
        print(f"\nYour cargo space: {cargo_free}/{ship.cargo_capacity}")
        
        # Collect what fits
        collected = {}
        for good, amount in list(factory.stored_goods.items()):
            to_collect = min(amount, cargo_free)
            if to_collect > 0:
                ship.add_cargo(good, to_collect)
                collected[good] = to_collect
                factory.stored_goods[good] -= to_collect
                if factory.stored_goods[good] == 0:
                    del factory.stored_goods[good]
                cargo_free -= to_collect
        
        if collected:
            print("\nCollected:")
            for good, amount in collected.items():
                print(f"  {good}: {amount} units")
        else:
            print("No cargo space available!")
    
    def handle_factory_upgrade(self, parts):
        """Upgrade a factory's production level."""
        if not self.validate_command(parts, 2, "factoryupgrade <factory#>"):
            return
        
        try:
            factory_num = int(parts[1]) - 1
        except ValueError:
            print("Factory number must be a number.")
            return
        
        if factory_num < 0 or factory_num >= len(self.player.factories):
            print(f"Invalid factory number. You have {len(self.player.factories)} factories.")
            return
        
        factory = self.player.factories[factory_num]
        
        if factory.production_level >= 5:
            print("Factory is already at maximum production level.")
            return
        
        upgrade_cost = 20000 * factory.production_level
        
        print(f"\n--- UPGRADE FACTORY ---")
        print(f"Current Level: {factory.production_level}")
        print(f"Upgrade Cost: {upgrade_cost} credits")
        print("Benefits: +20% production speed, +1 simultaneous recipe")
        print(f"\nUpgrade factory? (y/n)")
        
        if input().strip().lower() != 'y':
            return
        
        if self.player.credits < upgrade_cost:
            print(f"Not enough credits. You need {upgrade_cost}, but only have {self.player.credits}.")
            return
        
        self.player.credits -= upgrade_cost
        factory.production_level += 1
        factory.daily_cost = 100 * factory.production_level
        
        print(f"Factory upgraded to level {factory.production_level}!")
    
    def handle_hire_factory_manager(self, parts):
        """Hire a manager for a factory."""
        if not self.validate_command(parts, 2, "hirefactorymanager <factory#>"):
            return
        
        try:
            factory_num = int(parts[1]) - 1
        except ValueError:
            print("Factory number must be a number.")
            return
        
        if factory_num < 0 or factory_num >= len(self.player.factories):
            print(f"Invalid factory number. You have {len(self.player.factories)} factories.")
            return
        
        factory = self.player.factories[factory_num]
        
        if factory.manager:
            print(f"This factory already has a manager: {factory.manager.name}")
            return
        
        # Generate available managers
        managers = []
        for _ in range(3):
            name = f"{random.choice(['Alex', 'Sam', 'Jordan', 'Casey'])} {random.choice(['Chen', 'Smith', 'Patel'])}"
            efficiency = random.uniform(0.1, 0.3)
            salary = int(200 + efficiency * 500)
            managers.append({
                "name": name,
                "efficiency_bonus": efficiency,
                "salary": salary
            })
        
        print(f"\n--- Available Factory Managers ---")
        for i, manager in enumerate(managers):
            print(f"{i+1}. {manager['name']}")
            print(f"   Efficiency Bonus: +{manager['efficiency_bonus']:.0%}")
            print(f"   Salary: {manager['salary']} credits/day")
            print()
        
        try:
            choice = int(input("Hire which manager? (0 to cancel) ")) - 1
            if choice == -1:
                return
            if choice < 0 or choice >= len(managers):
                print("Invalid choice.")
                return
        except ValueError:
            print("Invalid input.")
            return
        
        # Create manager object
        from types import SimpleNamespace
        manager = SimpleNamespace(**managers[choice])
        factory.manager = manager
        
        print(f"\nHired {manager.name} as factory manager!")
        print(f"Factory efficiency increased by {manager.efficiency_bonus:.0%}")
    
    def handle_factory_manager(self, parts):
        """View or fire factory managers."""
        has_managers = False
        
        print("\n--- FACTORY MANAGERS ---")
        for i, factory in enumerate(self.player.factories):
            if factory.manager:
                has_managers = True
                print(f"\n{i+1}. {factory.location} Factory")
                print(f"   Manager: {factory.manager.name}")
                print(f"   Efficiency Bonus: +{factory.manager.efficiency_bonus:.0%}")
                print(f"   Salary: {factory.manager.salary} credits/day")
        
        if not has_managers:
            print("You have no factory managers.")
            return
        
        print("\nTo fire a manager, use 'firefactorymanager <factory#>'")
    
    def _check_production_start(self, factory):
        """Check if factory can start producing something."""
        if factory.current_recipe:
            return
        
        # Find recipes we can produce
        available_recipes = []
        for recipe_name, recipe in PRODUCTION_RECIPES.items():
            can_produce = True
            for input_good, amount in recipe["inputs"].items():
                if factory.inventory.get(input_good, 0) < amount:
                    can_produce = False
                    break
            if can_produce:
                available_recipes.append(recipe_name)
        
        if not available_recipes:
            return
        
        print(f"\nFactory can produce: {', '.join(available_recipes)}")
        print("Production will start automatically with the first available recipe.")
        
        # Start production with first available recipe
        recipe_name = available_recipes[0]
        recipe = PRODUCTION_RECIPES[recipe_name]
        
        # Consume inputs
        for input_good, amount in recipe["inputs"].items():
            factory.inventory[input_good] -= amount
            if factory.inventory[input_good] == 0:
                del factory.inventory[input_good]
        
        factory.current_recipe = recipe_name
        factory.production_progress = 0
        print(f"Started producing {recipe_name}. Will complete in {recipe['time']} days.")
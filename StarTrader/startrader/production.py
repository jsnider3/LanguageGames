"""
Production system for Star Trader.

Handles recipe viewing and goods production at appropriate economy types.
"""

from typing import TYPE_CHECKING
from .game_data import PRODUCTION_RECIPES, GOODS
from .constants import PRODUCTION_COST_PERCENTAGE

if TYPE_CHECKING:
    from .main import Game


class ProductionManager:
    """Manages production recipes and goods manufacturing."""
    
    def __init__(self, game: 'Game'):
        """Initialize the production manager.
        
        Args:
            game: The game instance
        """
        self.game = game
    
    def show_recipes(self) -> None:
        """Shows available production recipes at the current location."""
        system = self.game.player.location
        print(f"\n--- Production Recipes ({system.economy_type} Economy) ---")
        
        available_recipes = []
        for product, recipe in PRODUCTION_RECIPES.items():
            if recipe["required_economy"] == system.economy_type:
                available_recipes.append((product, recipe))
        
        if not available_recipes:
            print("No production facilities available in this type of economy.")
            return
            
        for product, recipe in available_recipes:
            print(f"\nProduct: {product}")
            print(f"  Inputs: " + ", ".join(f"{qty} {good}" for good, qty in recipe["inputs"].items()))
            print(f"  Output: {recipe['output_quantity']} {product}")
            print(f"  Time: {recipe['time']} days")
            
            # Check if player has required inputs
            can_produce = True
            for input_good, qty_needed in recipe["inputs"].items():
                player_qty = self.game.player.ship.cargo_hold.get(input_good, 0)
                if player_qty < qty_needed:
                    can_produce = False
                    break
            
            if can_produce:
                print(f"  Status: Ready to produce!")
            else:
                print(f"  Status: Missing required inputs")
        
        print("\nUse 'produce <product>' to start production.")
    
    def produce_good(self, product_name: str) -> bool:
        """Handles production of goods from recipes.
        
        Args:
            product_name: Name of the product to produce
            
        Returns:
            True if production was successful
        """
        if product_name not in PRODUCTION_RECIPES:
            print(f"Unknown product: '{product_name}'")
            print("Use 'recipes' to see available products.")
            return False
            
        recipe = PRODUCTION_RECIPES[product_name]
        system = self.game.player.location
        
        # Check economy type
        if recipe["required_economy"] != system.economy_type:
            print(f"Cannot produce {product_name} here. Requires {recipe['required_economy']} economy.")
            return False
            
        # Check inputs
        missing_inputs = []
        for input_good, qty_needed in recipe["inputs"].items():
            player_qty = self.game.player.ship.cargo_hold.get(input_good, 0)
            if player_qty < qty_needed:
                missing_inputs.append(f"{qty_needed - player_qty} {input_good}")
        
        if missing_inputs:
            print(f"Cannot produce {product_name}. Missing: " + ", ".join(missing_inputs))
            return False
            
        # Check cargo space for output
        space_needed = recipe["output_quantity"]
        space_used = sum(qty for good, qty in recipe["inputs"].items())
        net_space = space_needed - space_used
        
        if net_space > 0 and self.game.player.ship.get_cargo_used() + net_space > self.game.player.ship.cargo_capacity:
            print(f"Not enough cargo space. Production would require {net_space} additional cargo slots.")
            return False
            
        # Production cost 
        output_value = GOODS[product_name]["base_price"] * recipe["output_quantity"]
        production_cost = int(output_value * PRODUCTION_COST_PERCENTAGE)
        
        if self.game.player.credits < production_cost:
            print(f"Not enough credits. Production costs {production_cost} credits.")
            return False
            
        # All checks passed, start production
        print(f"\n--- Starting Production ---")
        print(f"Producing {recipe['output_quantity']} {product_name}...")
        
        # Remove inputs
        for input_good, qty_needed in recipe["inputs"].items():
            self.game.player.ship.remove_cargo(input_good, qty_needed)
            print(f"Consumed {qty_needed} {input_good}")
        
        # Pay cost
        self.game.player.credits -= production_cost
        print(f"Paid {production_cost} credits in production costs.")
        
        # Simulate production time
        print(f"Production will take {recipe['time']} days...")
        self.game.current_day += recipe['time']
        
        # Daily costs during production
        for _ in range(recipe['time']):
            self.game._handle_daily_costs()
        
        # Add output
        self.game.player.ship.add_cargo(product_name, recipe["output_quantity"])
        print(f"\nProduction complete! Received {recipe['output_quantity']} {product_name}.")
        
        # Gain mechanics skill for production
        self.game.player.gain_skill("mechanics", recipe['time'])
        
        return True
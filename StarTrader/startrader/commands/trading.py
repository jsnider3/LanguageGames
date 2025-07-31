"""
Trading-related command handlers.
"""

from .base import BaseCommandHandler
from ..game_data import GOODS, ILLEGAL_GOODS, FACTION_RANKS
from ..constants import (PRICE_IMPACT_FACTOR, QUANTITY_IMPACT_DIVISOR, 
                        REPUTATION_PENALTY_THRESHOLD, REPUTATION_PENALTY_MULTIPLIER)


class TradingCommands(BaseCommandHandler):
    """Handles all trading-related commands."""
    
    def handle_trade(self, parts):
        """Display the current system's market prices."""
        system = self.get_current_system()
        print(f"\n--- {system.name} Market ---")
        print(f"{'Good':<15} {'Price':>10} {'Quantity':>10}")
        print("-" * 37)
        
        # Regular goods
        for good, data in sorted(system.market.items()):
            if good not in ILLEGAL_GOODS:
                print(f"{good:<15} {data['price']:>10} {data['quantity']:>10}")
        
        # Show black market hint if available
        if system.has_black_market:
            print("\n(Black market available - use 'blackmarket' command)")
        
        print("\nUse 'buy <good> <quantity>' or 'sell <good> <quantity>'.")
    
    def handle_buy(self, parts):
        """Handle purchasing goods from the market."""
        if not self.validate_command(parts, 3, "buy <good> <quantity>"):
            return
        
        good_name, quantity = self.parse_quantity(parts)
        if good_name is None:
            return
        
        good_name = good_name.title()
        
        if quantity <= 0:
            print("Quantity must be positive.")
            return
        
        system = self.get_current_system()
        ship = self.get_current_ship()
        
        # Check if good exists
        if good_name not in system.market:
            print(f"'{good_name}' is not available in this market.")
            return
        
        # Check for illegal goods
        if good_name in ILLEGAL_GOODS and not system.has_black_market:
            print("You can't buy that on the open market! Try the black market.")
            return
        
        market_data = system.market[good_name]
        
        # Check stock
        if quantity > market_data["quantity"]:
            print(f"Not enough {good_name} in stock. Only {market_data['quantity']} available.")
            return
        
        total_cost = market_data["price"] * quantity
        
        # Apply trading bonuses
        total_bonus = self.game.calculate_trade_bonus()
        
        if total_bonus > 0:
            savings = int(market_data['price'] * quantity * total_bonus)
            total_cost *= (1 - total_bonus)
            total_cost = int(total_cost)
            # Show appropriate message based on bonus sources
            if ship.specialization == "trading" and ship.level > 1:
                print(f"Your specialized trading ship negotiates better deals!")
            if self.player.get_skill_bonus("negotiation") > 0:
                print(f"Your negotiation skills save you {savings} credits!")
            elif self.player.get_crew_bonus("Negotiator") > 0:
                print(f"Your negotiator secured a better price! You save {savings} credits.")
        
        # Apply reputation effects
        total_cost = self._apply_reputation_effects(total_cost, good_name, "buy")
        
        # Check credits
        if self.player.credits < total_cost:
            print(f"Not enough credits. You need {total_cost}, but only have {self.player.credits}.")
            return
        
        # Check cargo space
        if ship.get_cargo_used() + quantity > ship.cargo_capacity:
            print(f"Not enough cargo space. You need {quantity} slots, but only have {ship.cargo_capacity - ship.get_cargo_used()} free.")
            return
        
        # Execute transaction
        self.player.credits -= total_cost
        market_data["quantity"] -= quantity
        market_data["price"] = int(market_data["price"] * (1 + PRICE_IMPACT_FACTOR * (quantity / QUANTITY_IMPACT_DIVISOR))) + 1
        ship.add_cargo(good_name, quantity)
        print(f"Successfully purchased {quantity} units of {good_name} for {total_cost} credits.")
        
        # Record market manipulation if significant
        self.galaxy.record_market_manipulation(system.name, good_name, quantity, "buy")
        
        # Give experience and reputation
        self.player.give_crew_experience("Negotiator", 1)
        self.player.gain_skill("negotiation", 1)
        
        if good_name in ILLEGAL_GOODS:
            self.player.add_reputation("Federation", -5)
        else:
            self.player.add_reputation(system.faction, 1)
    
    def handle_sell(self, parts):
        """Handle selling goods to the market."""
        if not self.validate_command(parts, 3, "sell <good> <quantity>"):
            return
        
        good_name, quantity = self.parse_quantity(parts)
        if good_name is None:
            return
        
        good_name = good_name.title()
        
        if quantity <= 0:
            print("Quantity must be positive.")
            return
        
        ship = self.get_current_ship()
        
        # Check cargo
        if good_name not in ship.cargo_hold or ship.cargo_hold[good_name] < quantity:
            print(f"You don't have {quantity} units of {good_name} to sell.")
            return
        
        system = self.get_current_system()
        
        # Check for illegal goods
        if good_name in ILLEGAL_GOODS and not system.has_black_market:
            print("You can't trade that on the open market!")
            return
        
        market_data = system.market[good_name]
        total_sale = market_data["price"] * quantity
        
        # Apply trading bonuses
        total_bonus = self.game.calculate_trade_bonus()
        
        if total_bonus > 0:
            bonus_amount = int(total_sale * total_bonus)
            total_sale += bonus_amount
            # Show appropriate message based on bonus sources
            if ship.specialization == "trading" and ship.level > 1:
                print(f"Your specialized trading ship commands premium prices!")
            if self.player.get_skill_bonus("negotiation") > 0:
                print(f"Your negotiation skills earn you an extra {bonus_amount} credits!")
            elif self.player.get_crew_bonus("Negotiator") > 0:
                print(f"Your negotiator secured a better price! You earn an extra {bonus_amount} credits.")
        
        # Apply reputation effects
        original_sale = total_sale
        total_sale = self._apply_reputation_effects(total_sale, good_name, "sell")
        
        # Execute transaction
        ship.remove_cargo(good_name, quantity)
        market_data["quantity"] += quantity
        market_data["price"] = int(market_data["price"] * (1 - PRICE_IMPACT_FACTOR * (quantity / QUANTITY_IMPACT_DIVISOR)))
        market_data["price"] = max(1, market_data["price"])  # Minimum price of 1
        
        self.player.credits += total_sale
        print(f"Successfully sold {quantity} units of {good_name} for {total_sale} credits.")
        
        # Record market manipulation if significant
        self.galaxy.record_market_manipulation(system.name, good_name, quantity, "sell")
        
        # Give experience and reputation
        self.player.give_crew_experience("Negotiator", 1)
        self.player.gain_skill("negotiation", 1)
        
        if good_name in ILLEGAL_GOODS:
            self.player.add_reputation("Federation", -5)
        else:
            self.player.add_reputation(system.faction, 1)
    
    def handle_blackmarket(self, parts):
        """Access the black market for illegal goods."""
        system = self.get_current_system()
        
        if not system.has_black_market:
            print("No black market in this system.")
            return
        
        print(f"\n--- {system.name} Black Market ---")
        print("*whispers* Looking for something... special?")
        print(f"{'Good':<15} {'Price':>10} {'Quantity':>10}")
        print("-" * 37)
        
        for good, data in system.market.items():
            if good in ILLEGAL_GOODS:
                print(f"{good:<15} {data['price']:>10} {data['quantity']:>10}")
        
        print("\nUse 'buy <good> <quantity>' or 'sell <good> <quantity>'.")
        print("Be careful - trading illegal goods affects your reputation!")
    
    def _apply_reputation_effects(self, amount, good_name, action):
        """Apply reputation-based price modifications."""
        system = self.get_current_system()
        faction = system.faction
        
        if faction == "Independent":
            return amount
        
        reputation = self.player.reputation.get(faction, 0)
        
        # Check for penalties
        if reputation < REPUTATION_PENALTY_THRESHOLD:
            penalty = int(amount * REPUTATION_PENALTY_MULTIPLIER)
            if action == "buy":
                amount += penalty
                print(f"Due to your negative reputation with {faction}, prices are 20% higher.")
            else:
                amount -= penalty
                print(f"Due to your negative reputation with {faction}, you receive 20% less.")
            return amount
        
        # Check for rank benefits
        benefits = self.player.get_rank_benefits(faction)
        
        if good_name in ILLEGAL_GOODS and "black_market_discount" in benefits:
            discount = benefits["black_market_discount"]
            savings = int(amount * discount)
            amount = int(amount * (1 - discount))
            rank = self.player.get_faction_rank(faction)['rank']
            print(f"Your {rank} rank gives you a {int(discount * 100)}% black market discount! You save {savings} credits.")
        elif good_name not in ILLEGAL_GOODS and "price_discount" in benefits:
            discount = benefits["price_discount"]
            if action == "buy":
                savings = int(amount * discount)
                amount = int(amount * (1 - discount))
                rank = self.player.get_faction_rank(faction)['rank']
                print(f"Your {rank} rank gives you a {int(discount * 100)}% discount! You save {savings} credits.")
        
        return amount
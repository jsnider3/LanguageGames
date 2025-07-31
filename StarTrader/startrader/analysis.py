"""
Trade analysis and route planning system for Star Trader.

This module provides market analysis, price tracking, trade route optimization,
and automated trading suggestions to help players maximize profits.
"""

from typing import Dict, List, Tuple, Optional
from .game_data import GOODS, ILLEGAL_GOODS


class TradeAnalyzer:
    """Handles all trade analysis and route planning functionality."""
    
    def __init__(self, galaxy, player):
        """Initialize the trade analyzer.
        
        Args:
            galaxy: The galaxy instance containing all systems
            player: The player instance
        """
        self.galaxy = galaxy
        self.player = player
    
    def analyze_markets(self) -> None:
        """Analyze all markets in connected systems."""
        current_system = self.player.location
        connected = self.galaxy.connections.get(current_system.name, [])
        
        if not connected:
            print("No connected systems to analyze.")
            return
            
        print(f"\n--- MARKET ANALYSIS FROM {current_system.name} ---")
        print(f"Connected systems: {', '.join(connected)}")
        print("\nProfitable trades (buy here, sell there):")
        
        opportunities = []
        
        # Check each good in current system
        for good, local_data in current_system.market.items():
            local_price = local_data["price"]
            
            # Check price in each connected system
            for system_name in connected:
                remote_system = self.galaxy.systems[system_name]
                if good in remote_system.market:
                    remote_price = remote_system.market[good]["price"]
                    fuel_cost = self.galaxy.fuel_costs.get((current_system.name, system_name), 10)
                    
                    # Calculate profit
                    profit_per_unit = remote_price - local_price
                    # Account for fuel cost (assuming 10 units minimum trade)
                    net_profit_10 = (profit_per_unit * 10) - (fuel_cost * 10)  # Fuel cost per unit estimate
                    
                    if net_profit_10 > 0:
                        opportunities.append({
                            "good": good,
                            "buy_price": local_price,
                            "sell_system": system_name,
                            "sell_price": remote_price,
                            "profit_per_unit": profit_per_unit,
                            "fuel_cost": fuel_cost
                        })
        
        # Sort by profit
        opportunities.sort(key=lambda x: x["profit_per_unit"], reverse=True)
        
        # Display top opportunities
        if opportunities:
            for i, opp in enumerate(opportunities[:10]):  # Top 10
                print(f"\n{i+1}. {opp['good']}:")
                print(f"   Buy: {opp['buy_price']} cr → Sell in {opp['sell_system']}: {opp['sell_price']} cr")
                print(f"   Profit: {opp['profit_per_unit']} cr/unit (fuel cost: {opp['fuel_cost']})")
        else:
            print("\nNo profitable trades found from this location.")
            
        # Also check for goods to buy elsewhere and sell here
        print("\n\nProfitable imports (buy there, sell here):")
        import_opportunities = []
        
        for system_name in connected:
            remote_system = self.galaxy.systems[system_name]
            for good, remote_data in remote_system.market.items():
                if good in current_system.market:
                    local_price = current_system.market[good]["price"]
                    remote_price = remote_data["price"]
                    fuel_cost = self.galaxy.fuel_costs.get((system_name, current_system.name), 10)
                    
                    profit_per_unit = local_price - remote_price
                    net_profit_10 = (profit_per_unit * 10) - (fuel_cost * 10)
                    
                    if net_profit_10 > 0:
                        import_opportunities.append({
                            "good": good,
                            "buy_system": system_name,
                            "buy_price": remote_price,
                            "sell_price": local_price,
                            "profit_per_unit": profit_per_unit,
                            "fuel_cost": fuel_cost
                        })
        
        import_opportunities.sort(key=lambda x: x["profit_per_unit"], reverse=True)
        
        if import_opportunities:
            for i, opp in enumerate(import_opportunities[:5]):  # Top 5
                print(f"\n{i+1}. {opp['good']}:")
                print(f"   Buy in {opp['buy_system']}: {opp['buy_price']} cr → Sell: {opp['sell_price']} cr")
                print(f"   Profit: {opp['profit_per_unit']} cr/unit (fuel cost: {opp['fuel_cost']})")
        else:
            print("\nNo profitable imports found.")
    
    def analyze_good(self, good_name: str) -> None:
        """Analyze prices for a specific good across all known systems.
        
        Args:
            good_name: The name of the good to analyze
        """
        if good_name not in GOODS and good_name not in ILLEGAL_GOODS:
            print(f"Unknown good: {good_name}")
            return
            
        print(f"\n--- PRICE ANALYSIS: {good_name} ---")
        
        prices = []
        for system_name, system in self.galaxy.systems.items():
            if good_name in system.market:
                prices.append({
                    "system": system_name,
                    "price": system.market[good_name]["price"],
                    "quantity": system.market[good_name]["quantity"],
                    "faction": system.faction,
                    "economy": system.economy_type
                })
        
        if not prices:
            print(f"{good_name} not found in any markets.")
            return
            
        # Sort by price
        prices.sort(key=lambda x: x["price"])
        
        print(f"\nLowest prices:")
        for p in prices[:5]:
            print(f"  {p['system']} ({p['economy']}): {p['price']} cr (qty: {p['quantity']})")
            
        print(f"\nHighest prices:")
        for p in prices[-5:]:
            print(f"  {p['system']} ({p['economy']}): {p['price']} cr (qty: {p['quantity']})")
            
        # Calculate average
        avg_price = sum(p["price"] for p in prices) / len(prices)
        print(f"\nAverage price: {avg_price:.0f} cr")
        
        # Base price reference
        base = GOODS.get(good_name, ILLEGAL_GOODS.get(good_name, {})).get("base_price", 0)
        print(f"Base price: {base} cr")
    
    def analyze_trade_routes(self) -> None:
        """Analyze potential circular trade routes."""
        current = self.player.location
        
        print(f"\n--- TRADE ROUTE ANALYSIS FROM {current.name} ---")
        print("Searching for profitable circular routes...")
        
        # Find 3-system circular routes
        routes = []
        connected = self.galaxy.connections.get(current.name, [])
        
        for second in connected:
            second_connections = self.galaxy.connections.get(second, [])
            
            for third in second_connections:
                if third == current.name:
                    continue  # Skip 2-system routes
                    
                third_connections = self.galaxy.connections.get(third, [])
                if current.name in third_connections:
                    # Found a circular route
                    route = [current.name, second, third]
                    profit = self._calculate_route_profit(route)
                    
                    if profit > 0:
                        routes.append({
                            "path": route,
                            "profit": profit
                        })
        
        if routes:
            routes.sort(key=lambda x: x["profit"], reverse=True)
            
            print(f"\nTop circular trade routes:")
            for i, route in enumerate(routes[:5]):
                print(f"\n{i+1}. Route: {' → '.join(route['path'])} → {current.name}")
                print(f"   Estimated profit per cycle: {route['profit']} cr")
                
                # Show what to trade
                self._show_route_trades(route['path'])
        else:
            print("\nNo profitable circular routes found.")
    
    def _calculate_route_profit(self, route: List[str]) -> int:
        """Calculate estimated profit for a trade route.
        
        Args:
            route: List of system names in the route
            
        Returns:
            Estimated total profit for one complete circuit
        """
        total_profit = 0
        
        for i in range(len(route)):
            current_sys = route[i]
            next_sys = route[(i + 1) % len(route)]
            
            # Find best trade between systems
            best_profit = 0
            current_market = self.galaxy.systems[current_sys].market
            next_market = self.galaxy.systems[next_sys].market
            
            for good, data in current_market.items():
                if good in next_market:
                    profit = next_market[good]["price"] - data["price"]
                    if profit > best_profit:
                        best_profit = profit
                        
            fuel_cost = self.galaxy.fuel_costs.get((current_sys, next_sys), 10)
            total_profit += (best_profit * 10) - fuel_cost  # Assume 10 units traded
            
        return int(total_profit)
    
    def _show_route_trades(self, route: List[str]) -> None:
        """Show what to trade on each leg of a route.
        
        Args:
            route: List of system names in the route
        """
        print("   Suggested trades:")
        
        for i in range(len(route)):
            current_sys = route[i]
            next_sys = route[(i + 1) % len(route)]
            
            current_market = self.galaxy.systems[current_sys].market
            next_market = self.galaxy.systems[next_sys].market
            
            best_trade = None
            best_profit = 0
            
            for good, data in current_market.items():
                if good in next_market:
                    profit = next_market[good]["price"] - data["price"]
                    if profit > best_profit:
                        best_profit = profit
                        best_trade = good
                        
            if best_trade:
                buy_price = current_market[best_trade]["price"]
                sell_price = next_market[best_trade]["price"]
                print(f"   - At {current_sys}: Buy {best_trade} ({buy_price} cr)")
                print(f"     At {next_sys}: Sell {best_trade} ({sell_price} cr) [+{best_profit} cr/unit]")
    
    def plan_trade_route(self) -> None:
        """Interactive trade route planner."""
        print("\n--- TRADE ROUTE PLANNER ---")
        print("This will help you plan an optimal trade route.")
        
        # Get starting credits and cargo space
        credits = self.player.credits
        cargo_space = self.player.ship.cargo_capacity
        
        print(f"\nStarting credits: {credits}")
        print(f"Cargo capacity: {cargo_space}")
        
        # Get destination preference
        print("\nRoute type:")
        print("1. Maximize profit")
        print("2. Minimize risk (avoid dangerous systems)")
        print("3. Quick trades (nearby systems only)")
        
        choice = input("\nSelect route type (1-3): ").strip()
        
        current = self.player.location
        visited = set()
        route = [current.name]
        total_profit = 0
        
        print(f"\nStarting from: {current.name}")
        
        # Plan up to 5 stops
        for stop in range(5):
            # Find best next destination
            best_system = None
            best_profit = 0
            best_good = None
            
            connections = self.galaxy.connections.get(route[-1], [])
            
            for system_name in connections:
                if system_name in visited and stop < 4:  # Allow returning home on last stop
                    continue
                    
                # Evaluate this destination
                current_sys = self.galaxy.systems[route[-1]]
                next_sys = self.galaxy.systems[system_name]
                
                # Skip if dangerous and user wants safe route
                if choice == "2" and next_sys.faction == "Syndicate":
                    continue
                    
                # Skip if far and user wants quick trades
                if choice == "3":
                    fuel_cost = self.galaxy.fuel_costs.get((route[-1], system_name), 10)
                    if fuel_cost > 15:
                        continue
                
                # Find best trade
                for good, data in current_sys.market.items():
                    if good in next_sys.market:
                        buy_price = data["price"]
                        sell_price = next_sys.market[good]["price"]
                        
                        # Check if we can afford it
                        max_qty = min(cargo_space, credits // buy_price)
                        if max_qty == 0:
                            continue
                            
                        profit = (sell_price - buy_price) * max_qty
                        
                        if profit > best_profit:
                            best_profit = profit
                            best_system = system_name
                            best_good = good
            
            if not best_system:
                print(f"\nNo more profitable destinations found.")
                break
                
            # Add to route
            route.append(best_system)
            visited.add(best_system)
            total_profit += best_profit
            
            print(f"\nStop {stop + 1}: {best_system}")
            print(f"  Trade: {best_good}")
            print(f"  Expected profit: {best_profit} cr")
            
        print(f"\n--- ROUTE SUMMARY ---")
        print(f"Route: {' → '.join(route)}")
        print(f"Total expected profit: {total_profit} cr")
        print(f"Number of jumps: {len(route) - 1}")
        
        # Show detailed trading plan
        print(f"\nDetailed trading plan:")
        for i in range(len(route) - 1):
            self._show_single_trade(route[i], route[i + 1])
    
    def _show_single_trade(self, from_system: str, to_system: str) -> None:
        """Show the best trade between two systems.
        
        Args:
            from_system: Source system name
            to_system: Destination system name
        """
        from_market = self.galaxy.systems[from_system].market
        to_market = self.galaxy.systems[to_system].market
        
        best_trade = None
        best_profit = 0
        
        for good, data in from_market.items():
            if good in to_market:
                profit = to_market[good]["price"] - data["price"]
                if profit > best_profit:
                    best_profit = profit
                    best_trade = good
        
        if best_trade:
            print(f"\n{from_system} → {to_system}:")
            print(f"  Buy: {best_trade} @ {from_market[best_trade]['price']} cr")
            print(f"  Sell: {best_trade} @ {to_market[best_trade]['price']} cr")
            print(f"  Profit: {best_profit} cr/unit")
    
    def auto_trade(self) -> None:
        """Start automated trading mode."""
        print("\n--- AUTOMATED TRADING ---")
        print("This will automatically execute trades based on market analysis.")
        print("WARNING: This is experimental. Monitor your ship carefully.")
        
        if not self.player.ship.cargo_hold:
            print("\nNo cargo to trade. Buy some goods first.")
            return
            
        print(f"\nCurrent cargo:")
        for good, qty in self.player.ship.cargo_hold.items():
            print(f"  {good}: {qty} units")
            
        print("\nAnalyzing best markets for your cargo...")
        
        # Find best place to sell current cargo
        best_deals = []
        current = self.player.location
        
        for good, qty in self.player.ship.cargo_hold.items():
            best_system = None
            best_price = 0
            best_profit = -999999
            
            for system_name in self.galaxy.connections.get(current.name, []):
                system = self.galaxy.systems[system_name]
                if good in system.market:
                    sell_price = system.market[good]["price"]
                    buy_price = current.market.get(good, {}).get("price", sell_price)
                    fuel_cost = self.galaxy.fuel_costs.get((current.name, system_name), 10)
                    
                    total_profit = (sell_price * qty) - (buy_price * qty) - fuel_cost
                    
                    if total_profit > best_profit:
                        best_profit = total_profit
                        best_price = sell_price
                        best_system = system_name
                        
            if best_system:
                best_deals.append({
                    "good": good,
                    "quantity": qty,
                    "system": best_system,
                    "price": best_price,
                    "profit": best_profit
                })
        
        if not best_deals:
            print("\nNo profitable trades found for your cargo.")
            return
            
        # Sort by profit
        best_deals.sort(key=lambda x: x["profit"], reverse=True)
        
        print("\nBest deals for your cargo:")
        for i, deal in enumerate(best_deals):
            print(f"\n{i+1}. {deal['good']} ({deal['quantity']} units)")
            print(f"   Sell in {deal['system']} for {deal['price']} cr/unit")
            print(f"   Expected profit: {deal['profit']} cr")
            
        print("\nExecute automatic trading? This will:")
        print("1. Travel to the best market")
        print("2. Sell your most profitable cargo")
        print("3. Buy the best return cargo")
        print("4. Return to your starting location")
        
        confirm = input("\nProceed? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Automated trading cancelled.")
            return
            
        # Execute the trade
        best_deal = best_deals[0]
        print(f"\nExecuting trade plan...")
        print(f"Step 1: Travel to {best_deal['system']}")
        
        # Note: Actual execution would require access to game commands
        # This is just the planning phase
        print("\nNote: Automated execution not yet implemented.")
        print("Please manually execute the suggested trades.")
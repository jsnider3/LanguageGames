#!/usr/bin/env python3
"""
Demo of Star Trader's new features
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from startrader.main import Game

def demo_game():
    """Run a demonstration of the game's features"""
    print("=== STAR TRADER FEATURE DEMO ===\n")
    
    game = Game()
    
    # Set up commands
    game.commands = {
        "status": game._handle_status,
        "trade": game._handle_trade,
        "buy": game._handle_buy,
        "sell": game._handle_sell,
        "travel": game._handle_travel,
        "shipyard": game._handle_shipyard,
        "repair": game._handle_repair,
        "upgrade": game._handle_upgrade,
        "refuel": game._handle_refuel,
        "missions": game._handle_missions,
        "accept": game._handle_accept,
        "complete": game._handle_complete,
        "save": game._handle_save,
        "load": game._handle_load,
        "new": game._handle_new,
        "blackmarket": game._handle_black_market,
        "sellmodule": game._handle_sell_module,
        "recruits": game._handle_recruits,
        "hire": game._handle_hire,
        "crew": game._handle_crew,
        "fire": game._handle_fire,
        "news": game._handle_news,
        "buyship": game._handle_buy_ship,
        "produce": game._handle_produce,
        "recipes": game._handle_recipes,
        "fleet": game._handle_fleet,
        "switchship": game._handle_switch_ship,
        "renameship": game._handle_rename_ship,
        "captains": game._handle_captains,
        "hirecaptain": game._handle_hire_captain,
        "assigncaptain": game._handle_assign_captain,
        "setroute": game._handle_set_route,
        "firecaptain": game._handle_fire_captain,
        "captainstatus": game._handle_captain_status,
        "map": game._handle_map,
        "cargo": game._handle_cargo,
        "help": game._handle_help,
        "quit": game.quit_game
    }
    
    print("1. INITIAL STATUS")
    print("-" * 50)
    game._handle_status(["status"])
    
    print("\n2. FLEET MANAGEMENT")
    print("-" * 50)
    game._handle_fleet(["fleet"])
    game._handle_rename_ship(["renameship", "Star", "Pioneer"])
    print("\nAfter renaming:")
    game._handle_fleet(["fleet"])
    
    print("\n3. PRODUCTION CHAINS")
    print("-" * 50)
    print("Viewing available recipes in Sol (Core economy):")
    game._handle_recipes(["recipes"])
    
    # Give player materials for demo
    print("\n[DEMO: Adding materials for production demo]")
    game.player.ship.add_cargo("Medicine", 2)
    game.player.ship.add_cargo("Chemicals", 2)
    game.player.credits = 5000
    
    print("\nProducing Advanced Medicine:")
    game._handle_produce(["produce", "advanced", "medicine"])
    
    print("\n4. MARKET MANIPULATION")
    print("-" * 50)
    print("Current market in Sol:")
    game._handle_trade(["trade"])
    
    # Add lots of food for market manipulation demo
    print("\n[DEMO: Adding 50 Food for market manipulation demo]")
    game.player.ship.add_cargo("Food", 50)
    
    print("\nSelling large quantity to manipulate market:")
    game._handle_sell(["sell", "food", "50"])
    
    print("\nMarket after manipulation:")
    game._handle_trade(["trade"])
    
    print("\n5. SHIP PURCHASING")
    print("-" * 50)
    print("Checking shipyard:")
    game._handle_shipyard(["shipyard"])
    
    # Give credits for ship purchase
    print("\n[DEMO: Adding credits for ship purchase]")
    game.player.credits = 50000
    
    print("\nBuying a freighter:")
    game._handle_buy_ship(["buyship", "freighter"])
    
    print("\nOur fleet now:")
    game._handle_fleet(["fleet"])
    
    print("\n6. AI CAPTAINS")
    print("-" * 50)
    print("Checking available captains:")
    game._handle_captains(["captains"])
    
    # Give credits for captain hire
    print("\n[DEMO: Adding credits for captain hire]")
    game.player.credits = 10000
    
    print("\nHiring captain 0:")
    game._handle_hire_captain(["hirecaptain", "0"])
    
    print("\nAssigning captain to our freighter:")
    # Find freighter ID
    freighter_id = None
    for ship in game.player.ships:
        if ship.ship_class == "freighter":
            freighter_id = ship.id
            break
    
    if freighter_id:
        captain_name = game.player.ai_captains[0].name if game.player.ai_captains else "Captain"
        game._handle_assign_captain(["assigncaptain", captain_name, freighter_id])
        
        print("\nSetting trade route for captain:")
        game._handle_set_route(["setroute", captain_name, "Sol", "Alpha Centauri", "Sol"])
        
        print("\nCaptain status:")
        game._handle_captain_status(["captainstatus"])
    
    print("\n7. NEWS AND EVENTS")
    print("-" * 50)
    game._handle_news(["news"])
    
    print("\n=== DEMO COMPLETE ===")
    print("\nKey features demonstrated:")
    print("- Production chains: Transform raw materials into advanced goods")
    print("- Market manipulation: Large trades affect prices persistently")
    print("- Fleet management: Own and manage multiple ships")
    print("- AI captains: Hire captains to automate trade routes")
    print("- Dynamic economy: Different goods available in different system types")
    
if __name__ == "__main__":
    demo_game()
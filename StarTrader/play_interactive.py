#!/usr/bin/env python3
"""
Interactive Star Trader Session
This script allows playing the game with predefined command sequences
"""

import sys
import os
from contextlib import redirect_stdout
from io import StringIO

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from startrader.main import Game

class InteractiveSession:
    def __init__(self):
        self.game = Game()
        self.output_buffer = StringIO()
        # Initialize the game commands (normally done in run())
        self._init_game_commands()
    
    def _init_game_commands(self):
        """Initialize game commands"""
        self.game.commands = {
            "status": self.game._handle_status,
            "trade": self.game._handle_trade,
            "buy": self.game._handle_buy,
            "sell": self.game._handle_sell,
            "travel": self.game._handle_travel,
            "shipyard": self.game._handle_shipyard,
            "repair": self.game._handle_repair,
            "upgrade": self.game._handle_upgrade,
            "refuel": self.game._handle_refuel,
            "missions": self.game._handle_missions,
            "accept": self.game._handle_accept,
            "complete": self.game._handle_complete,
            "save": self.game._handle_save,
            "load": self.game._handle_load,
            "new": self.game._handle_new,
            "blackmarket": self.game._handle_black_market,
            "sellmodule": self.game._handle_sell_module,
            "recruits": self.game._handle_recruits,
            "hire": self.game._handle_hire,
            "crew": self.game._handle_crew,
            "fire": self.game._handle_fire,
            "news": self.game._handle_news,
            "buyship": self.game._handle_buy_ship,
            "produce": self.game._handle_produce,
            "recipes": self.game._handle_recipes,
            "fleet": self.game._handle_fleet,
            "switchship": self.game._handle_switch_ship,
            "renameship": self.game._handle_rename_ship,
            "captains": self.game._handle_captains,
            "hirecaptain": self.game._handle_hire_captain,
            "assigncaptain": self.game._handle_assign_captain,
            "setroute": self.game._handle_set_route,
            "firecaptain": self.game._handle_fire_captain,
            "captainstatus": self.game._handle_captain_status,
            "map": self.game._handle_map,
            "cargo": self.game._handle_cargo,
            "help": self.game._handle_help,
            "quit": self.game.quit_game
        }
        
    def execute_command(self, command):
        """Execute a command and capture output"""
        print(f"\n> {command}")
        
        # Capture output
        output = StringIO()
        with redirect_stdout(output):
            parts = command.strip().lower().split()
            if parts:
                verb = parts[0]
                handler = self.game.commands.get(verb)
                if handler:
                    handler(parts)
                else:
                    print(f"Unknown command: '{command}'")
        
        result = output.getvalue()
        print(result)
        return result
    
    def play_sequence(self, commands):
        """Play through a sequence of commands"""
        for cmd in commands:
            if cmd.startswith("#"):
                print(f"\n{cmd}")  # Comment
            else:
                self.execute_command(cmd)

# Example play session
if __name__ == "__main__":
    session = InteractiveSession()
    
    # A sample trading session demonstrating new features
    commands = [
        "# Starting the game - checking initial status",
        "status",
        
        "# Let's check the market in Sol",
        "trade",
        
        "# Buy some raw materials for production",
        "buy ore 10",
        "buy chemicals 5",
        
        "# Check production recipes available",
        "recipes",
        
        "# Travel to Sirius (Industrial system)",
        "travel sirius",
        
        "# Check if we can produce here",
        "recipes",
        
        "# Produce some alloys",
        "produce alloys",
        
        "# Check our cargo",
        "status",
        
        "# Let's manipulate the market - sell a large quantity",
        "trade",
        "sell alloys 2",
        
        "# Check our fleet",
        "fleet",
        
        "# Save our progress",
        "save",
        
        "# Let's travel around and see market effects",
        "travel sol",
        "trade",
        
        "# Back to Sirius to check if our manipulation affected prices",
        "travel sirius", 
        "trade",
        
        "# Let's buy a new ship if we have enough credits",
        "shipyard",
        
        "# View the news to see what's happening",
        "news",
        
        "# Rename our ship",
        "renameship Star Wanderer",
        "fleet",
    ]
    
    print("=== STAR TRADER INTERACTIVE SESSION ===")
    print("Starting a new game...\n")
    
    session.play_sequence(commands)
    
    print("\n=== SESSION COMPLETE ===")
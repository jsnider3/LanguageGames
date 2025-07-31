"""
Navigation and exploration command handlers.
"""

import time
import random
from .base import BaseCommandHandler
from ..constants import (EVENT_CHANCE, EXPLORATION_FUEL_COST, 
                        EXPLORATION_BASE_DISCOVERY_CHANCE, SCAN_TIME_COST)


class NavigationCommands(BaseCommandHandler):
    """Handles all navigation and exploration commands."""
    
    def handle_travel(self, parts):
        """Handle travel between star systems."""
        if not self.validate_command(parts, 2, "travel <system name>"):
            return
            
        destination_name = " ".join(parts[1:]).title()
        
        if destination_name not in self.galaxy.systems:
            # Allow for short names
            for system_name_i in self.galaxy.systems:
                if destination_name.lower() in system_name_i.lower():
                    destination_name = system_name_i
                    break
            else:
                print(f"Unknown system: '{destination_name}'")
                return
        
        current_system = self.player.location
        if current_system.name == destination_name:
            print("You are already in that system.")
            return
        
        if destination_name not in self.galaxy.connections[current_system.name]:
            print(f"Cannot travel directly from {current_system.name} to {destination_name}.")
            return
        
        ship = self.get_current_ship()
        fuel_needed = self.galaxy.fuel_costs[(current_system.name, destination_name)]
        
        if ship.fuel < fuel_needed:
            print(f"Not enough fuel. You need {fuel_needed}, but only have {ship.fuel}.")
            return
        
        # Consume fuel
        ship.fuel -= fuel_needed
        
        # Advance time
        self.game.current_day += 1
        
        # Give experience
        self.player.give_crew_experience("Engineer", 1)
        self.player.gain_skill("piloting", 1)
        
        # Daily costs and market updates
        self.game._handle_daily_costs()
        self.galaxy.update_markets()
        self.game.check_mission_failure()
        
        print(f"\nTraveling from {current_system.name} to {destination_name}...")
        time.sleep(1)
        
        # Trigger random event
        self.game.event_manager.on_travel()
        if self.game.game_over:
            return
        
        # Arrive at destination
        self.player.last_location = self.player.location
        self.player.location = self.galaxy.systems[destination_name]
        print(f"Arrived at {destination_name}. The journey consumed {fuel_needed} fuel.")
        print(f"It is now Day {self.game.current_day}.")
        
        # Track system visits for victory conditions
        if destination_name not in self.player.visited_systems:
            self.player.visited_systems.add(destination_name)
        
        # Ship gains exploration experience for visiting new systems
        if destination_name not in ship.visited_systems:
            ship.visited_systems.add(destination_name)
            ship.gain_experience("exploration", 10)
            print(f"First visit to {destination_name}! Your ship gains exploration experience.")
        
        # Check for docking restrictions
        self._check_docking_restrictions(self.galaxy.systems[destination_name])
    
    def handle_map(self, parts):
        """Display the galactic map."""
        print("\n--- GALACTIC MAP ---")
        print("Systems connected by hyperlanes:")
        print()
        
        # Create a visual grid
        grid = [[" " for _ in range(10)] for _ in range(10)]
        
        # Mark systems on the grid
        for system_name, system in self.galaxy.systems.items():
            # Show first letter of system name, or * for current location
            if system == self.player.location:
                marker = "*"
            else:
                marker = system_name[0]
            grid[system.y][system.x] = marker
        
        # Display the grid
        print("  0 1 2 3 4 5 6 7 8 9")
        for y in range(10):
            print(f"{y} ", end="")
            for x in range(10):
                print(f"{grid[y][x]} ", end="")
            print()
        
        print("\n* = Your current location")
        print("\nConnections from your current location:")
        current = self.player.location
        connections = self.galaxy.connections.get(current.name, [])
        
        if connections:
            for dest in connections:
                fuel_cost = self.galaxy.fuel_costs.get((current.name, dest), "?")
                print(f"  {dest} (Fuel: {fuel_cost})")
        else:
            print("  No connections available")
        
        print(f"\nYour location: {current.name}")
        print(f"Ship fuel: {self.player.ship.fuel}/{self.player.ship.max_fuel}")
    
    def handle_explore(self, parts):
        """Explore deep space for uncharted systems."""
        ship = self.get_current_ship()
        
        if ship.fuel < EXPLORATION_FUEL_COST:
            print(f"Deep space exploration requires {EXPLORATION_FUEL_COST} fuel. You have {ship.fuel}.")
            return
        
        print("\n--- DEEP SPACE EXPLORATION ---")
        print("Venturing beyond known space...")
        print(f"This will consume {EXPLORATION_FUEL_COST} fuel.")
        
        # Consume fuel
        ship.fuel -= EXPLORATION_FUEL_COST
        
        # Advance time
        self.game.current_day += 2  # Exploration takes 2 days
        self.game._handle_daily_costs()
        
        # Gain exploration experience
        ship.gain_experience("exploration", 5)
        self.player.gain_skill("piloting", 2)
        
        # Check for discovery
        discovery_chance = EXPLORATION_BASE_DISCOVERY_CHANCE
        # Better chance with exploration specialization
        if ship.specialization == "exploration":
            discovery_chance += 0.2
            print("Your exploration-specialized ship enhances scanning capabilities...")
        
        if random.random() < discovery_chance:
            # Discover a system!
            undiscovered = [s for s in self.galaxy.uncharted_systems.values() if not s.discovered]
            if undiscovered:
                discovered_system = random.choice(undiscovered)
                discovered_system.discovered = True
                
                print(f"\n--- DISCOVERY ---")
                print(f"You've discovered {discovered_system.name}!")
                print(f"Type: {discovered_system.system_type.replace('_', ' ').title()}")
                print(f"Description: {discovered_system.description}")
                
                # Add to main galaxy
                self.galaxy.systems[discovered_system.name] = discovered_system
                
                # Create connections to nearby systems
                current = self.player.location
                self.galaxy.connections[current.name].append(discovered_system.name)
                self.galaxy.connections[discovered_system.name] = [current.name]
                
                # Calculate fuel cost
                distance = self.galaxy._calculate_distance(current, discovered_system)
                fuel_cost = int(distance * 5)
                self.galaxy.fuel_costs[(current.name, discovered_system.name)] = fuel_cost
                self.galaxy.fuel_costs[(discovered_system.name, current.name)] = fuel_cost
                
                # Generate market for the new system
                self.galaxy._generate_markets()
                
                # Reward
                self.player.credits += discovered_system.discovery_bonus
                print(f"\nDiscovery bonus: {discovered_system.discovery_bonus} credits!")
                
                # Big morale boost
                self.player.adjust_crew_morale(20, "The crew is thrilled by the discovery!")
            else:
                print("\nNo new discoveries this time. All systems have been found!")
        else:
            print("\nYour sensors detect nothing unusual in this region of space.")
            print("Try exploring from different systems.")
            
            # Chance for exploration event
            if random.random() < 0.5:
                self.game.event_manager.on_explore()
    
    def handle_scan(self, parts):
        """Scan the current system for anomalies and special features."""
        system = self.get_current_system()
        ship = self.get_current_ship()
        
        print(f"\n--- SCANNING {system.name.upper()} ---")
        print("Initializing deep space sensors...")
        
        # Scanning takes time
        self.game.current_day += SCAN_TIME_COST
        self.game._handle_daily_costs()
        
        # Basic system info
        print(f"\nSystem Type: {system.economy_type}")
        print(f"Faction: {system.faction}")
        print(f"Coordinates: ({system.x}, {system.y})")
        
        # Check for special features
        if hasattr(system, 'is_uncharted') and system.is_uncharted:
            print(f"\nSpecial Features:")
            print(f"- System Type: {system.system_type.replace('_', ' ').title()}")
            print(f"- Danger Level: {int(system.exploration_danger * 100)}%")
            
            if system.system_type == "ancient_ruins" and hasattr(system, 'artifacts_remaining'):
                print(f"- Artifact Signatures Detected: {system.artifacts_remaining}")
            elif system.system_type == "resource_rich" and hasattr(system, 'special_resource'):
                print(f"- Special Resource: {system.special_resource}")
            elif system.system_type == "derelict_fleet":
                print("- Multiple derelict ship signatures detected")
            elif system.system_type == "anomaly":
                print("- WARNING: Unusual energy readings detected!")
            elif system.system_type == "pirate_haven":
                print("- WARNING: Heavy pirate activity detected!")
        
        # Check for nearby uncharted systems
        print("\nDeep Space Anomalies:")
        found_anomaly = False
        for uncharted in self.galaxy.uncharted_systems.values():
            if not uncharted.discovered:
                distance = self.galaxy._calculate_distance(system, uncharted)
                if distance <= 3:  # Can detect systems within 3 units
                    print(f"- Anomaly detected {distance:.1f} units away")
                    found_anomaly = True
                    break
        
        if not found_anomaly:
            print("- No anomalies detected in scanning range")
        
        # Ship gains experience
        ship.gain_experience("exploration", 2)
        print("\nScan complete.")
    
    def _check_docking_restrictions(self, destination_system):
        """Check if the player can dock at the destination system."""
        faction = destination_system.faction
        if faction != "Independent":
            reputation = self.player.reputation.get(faction, 0)
            if reputation < -50:
                print(f"\nWARNING: Your reputation with {faction} is very poor.")
                print("You may face hostility or be denied services.")
                
                # Chance of being turned away
                if reputation < -75 and random.random() < 0.5:
                    print(f"\n{faction} security forces are preventing you from docking!")
                    print("You'll need to improve your reputation or find another route.")
                    # Force travel back
                    # (In a real implementation, this would be handled better)
                    
        # Check for wanted level
        if self.player.wanted_level >= 3:
            print(f"\nWARNING: You are wanted! (Level {self.player.wanted_level})")
            print("Bounty hunters may be pursuing you!")
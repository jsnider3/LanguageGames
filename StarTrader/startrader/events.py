import random
from .game_data import ILLEGAL_GOODS

class EventManager:
    """Handles random events during travel."""
    def __init__(self, game):
        self.game = game

    def trigger_event(self):
        """Randomly determines if an event occurs and handles it."""
        if random.random() > self.game.constants['EVENT_CHANCE']: return

        # Prioritize economic events for now, will add more later
        event_type = random.choice(["famine", "mining_strike", "pirate", "derelict", "asteroid", "customs_scan"])
        print("\n--- EVENT ---")

        if event_type == "famine": self._handle_famine()
        elif event_type == "mining_strike": self._handle_mining_strike()
        elif event_type == "pirate": self._handle_pirate_encounter()
        elif event_type == "derelict": self._handle_derelict_ship()
        elif event_type == "asteroid": self._handle_asteroid_field()
        elif event_type == "customs_scan": self._handle_customs_scan()

    def _handle_customs_scan(self):
        """Handles a random customs scan event."""
        faction = self.game.player.location.faction
        if faction == "Independent" or faction == "Syndicate": # Less likely to be scanned in these systems
            if random.random() > 0.1:
                return
        
        print(f"You are hailed by a {faction} patrol for a routine customs scan.")
        
        illegal_cargo = []
        for good, quantity in self.game.player.ship.cargo_hold.items():
            if good in ILLEGAL_GOODS:
                illegal_cargo.append((good, quantity))
        
        if not illegal_cargo:
            print("The scan reveals nothing illegal. They let you pass.")
            return
            
        print("\n--- CONTRABAND DETECTED! ---")
        total_fine = 0
        for good, quantity in illegal_cargo:
            base_price = ILLEGAL_GOODS[good]["base_price"]
            fine = base_price * quantity * 2 # 200% fine
            total_fine += fine
            print(f"Your {quantity} units of {good} have been confiscated!")
            self.game.player.ship.remove_cargo(good, quantity)
            
        reputation_loss = 25 * len(illegal_cargo)
        print(f"You have been fined {total_fine} credits and your reputation with {faction} has been damaged.")
        self.game.player.credits -= total_fine
        self.game.player.add_reputation(faction, -reputation_loss)
        
        if self.game.player.credits < 0:
            print("You couldn't afford the fine and have been thrown in jail. Your journey ends here.")
            self.game.game_over = True

    def _handle_famine(self):
        system = random.choice(list(self.game.galaxy.systems.values()))
        if system.economy_type == "Agricultural": # Famines don't happen on farm worlds
            print(f"A distress call from a nearby system speaks of a bountiful harvest in {system.name}. Prices for food there may be low.")
            self.game.galaxy.active_events[system.name] = {"type": "bountiful_harvest", "duration": 5}
            return
        print(f"A severe famine has struck {system.name}! Demand for food is critical.")
        self.game.galaxy.active_events[system.name] = {"type": "famine", "duration": 10}

    def _handle_mining_strike(self):
        system = random.choice(list(self.game.galaxy.systems.values()))
        if system.economy_type == "Mining":
            print(f"A new mineral vein was discovered in {system.name}. Mineral prices there may be low.")
            self.game.galaxy.active_events[system.name] = {"type": "mining_boom", "duration": 5}
            return
        print(f"A widespread labor strike has halted all mining operations in {system.name}!")
        self.game.galaxy.active_events[system.name] = {"type": "mining_strike", "duration": 8}

    def _handle_pirate_encounter(self):
        # Check for active bounty missions in the current system
        bounty_mission = None
        for mission in self.game.player.active_missions:
            if mission.type == "BOUNTY" and mission.destination_system == self.game.player.location:
                bounty_mission = mission
                break
        
        if bounty_mission:
            pirate_name = bounty_mission.target_name
            print(f"You've found him! The notorious pirate {pirate_name} is here!")
            pirate_hull = 100 # Bounty targets are tougher
            pirate_damage = 20
        else:
            pirate_name = "a pirate"
            print(f"You've been ambushed by {pirate_name}!")
            pirate_hull = 50
            pirate_damage = 15
        
        while True:
            choice = input("Do you 'fight' or 'flee'? > ").lower()
            if choice == "flee":
                print("You attempt to flee...")
                if random.random() > 0.5:
                    print("You got away safely!")
                    return
                else:
                    print("You couldn't escape!")
                    continue
            
            # Player's turn
            player_damage = self.game.player.ship.get_weapon_damage(self.game.player)
            pirate_hull -= player_damage
            print(f"You fire your weapons, dealing {player_damage} damage. The pirate has {pirate_hull} hull remaining.")
            if pirate_hull <= 0:
                print(f"You destroyed the {pirate_name}'s ship!")
                
                if bounty_mission:
                    self.game._handle_complete(["complete", bounty_mission.id, "bounty"])
                else:
                    salvage = random.randint(200, 800)
                    self.game.player.credits += salvage
                    print(f"You salvage {salvage} credits from the wreckage.")
                return

            # Pirate's turn
            damage_taken = pirate_damage
            # Apply shield damage first
            shield_strength = self.game.player.ship.get_shield_strength()
            if shield_strength > 0:
                if damage_taken <= shield_strength:
                    print(f"Your shields absorbed {damage_taken} damage.")
                    damage_taken = 0
                else:
                    damage_taken -= shield_strength
                    print(f"Your shields absorbed {shield_strength} damage and collapsed!")
            
            if damage_taken > 0:
                self.game.player.ship.hull -= damage_taken
                print(f"The pirate fires back, dealing {damage_taken} hull damage.")

            if self.game.player.ship.hull <= 0:
                self.game.game_over = True
                print("Your ship was destroyed by pirates...")
                return
            
            print(f"Your Hull: {self.game.player.ship.hull}/{self.game.player.ship.max_hull}, Pirate Hull: {pirate_hull}/50")

    def _handle_derelict_ship(self):
        print("You come across a derelict, drifting ship.")
        salvage = random.randint(50, 200)
        self.game.player.credits += salvage
        print(f"You salvage parts worth {salvage} credits.")

    def _handle_asteroid_field(self):
        print("You navigate a dense asteroid field.")
        damage = random.randint(5, 15)
        self.game.player.ship.hull -= damage
        print(f"You make it through, but your ship takes {damage} hull damage.")
        if self.game.player.ship.hull <= 0:
            self.game.game_over = True
            print("Your ship was destroyed by asteroids...")

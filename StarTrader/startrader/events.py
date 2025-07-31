import random
from .game_data import ILLEGAL_GOODS

class EventManager:
    """Handles random events during travel."""
    def __init__(self, game):
        self.game = game

    def trigger_event(self):
        """Randomly determines if an event occurs and handles it."""
        if random.random() > self.game.constants['EVENT_CHANCE']: return

        # Check for bounty hunter encounters based on wanted level
        wanted_level = self.game.player.get_total_wanted_level()
        if wanted_level >= 3 and random.random() < 0.2 * (wanted_level - 2):
            event_type = "bounty_hunter"
        else:
            # Prioritize economic events for now, will add more later
            event_type = random.choice(["famine", "mining_strike", "pirate", "derelict", "asteroid", "customs_scan"])
        print("\n--- EVENT ---")

        if event_type == "famine": self._handle_famine()
        elif event_type == "mining_strike": self._handle_mining_strike()
        elif event_type == "pirate": self._handle_pirate_encounter()
        elif event_type == "derelict": self._handle_derelict_ship()
        elif event_type == "asteroid": self._handle_asteroid_field()
        elif event_type == "customs_scan": self._handle_customs_scan()
        elif event_type == "bounty_hunter": self._handle_bounty_hunter()

    def _handle_customs_scan(self):
        """Handles a random customs scan event."""
        faction = self.game.player.location.faction
        if faction == "Independent": # No customs in Independent systems
            return
        if faction == "Syndicate": # Less likely to be scanned in Syndicate systems
            if random.random() > 0.1:
                return
        
        # Reputation and rank affect scan likelihood
        reputation = self.game.player.reputation.get(faction, 0)
        scan_chance = 0.3  # Base 30% chance
        
        # Check rank benefits for reduced scrutiny
        benefits = self.game.player.get_rank_benefits(faction)
        if "reduced_customs_scrutiny" in benefits:
            scan_chance *= benefits["reduced_customs_scrutiny"]
        elif "diplomatic_immunity" in benefits:
            scan_chance = 0.05  # Almost never scanned with diplomatic immunity
        
        if reputation < -25:
            scan_chance = min(0.8, scan_chance * 2.5)  # Much more likely for bad reputation
        elif reputation < 0:
            scan_chance = min(0.6, scan_chance * 2)  # More likely for negative reputation
            
        if random.random() > scan_chance:
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
        
        # Offer bribery option
        total_fine = 0
        for good, quantity in illegal_cargo:
            base_price = ILLEGAL_GOODS[good]["base_price"]
            fine = base_price * quantity * 2
            total_fine += fine
            
        bribe_amount = int(total_fine * 0.3)  # Bribe is 30% of fine
        
        if self.game.player.credits >= bribe_amount:
            choice = input(f"Offer a {bribe_amount} credit 'donation' to avoid trouble? (y/n) > ").lower()
            if choice == 'y':
                # Base 70% chance, modified by intimidation bonus
                bribe_success_chance = 0.7
                if "intimidation_bonus" in benefits:
                    # Intimidation makes bribes more likely to succeed
                    bribe_success_chance = min(0.95, 0.7 + (benefits["intimidation_bonus"] - 1) * 0.1)
                
                if random.random() < bribe_success_chance:
                    self.game.player.credits -= bribe_amount
                    print(f"The customs officer pockets the credits and looks the other way.")
                    if "intimidation_bonus" in benefits:
                        print("Your reputation precedes you - the officer seems eager to avoid trouble.")
                    print("Your cargo remains untouched.")
                    return
                else:
                    print("The customs officer refuses your bribe and calls for backup!")
                    total_fine *= 2  # Double fine for attempted bribery
                    self.game.player.add_reputation(faction, -10)  # Extra reputation loss
        
        for good, quantity in illegal_cargo:
            print(f"Your {quantity} units of {good} have been confiscated!")
            self.game.player.ship.remove_cargo(good, quantity)
            
        reputation_loss = 25 * len(illegal_cargo)
        print(f"You have been fined {total_fine} credits and your reputation with {faction} has been damaged.")
        self.game.player.credits -= total_fine
        self.game.player.add_reputation(faction, -reputation_loss)
        
        # Increase wanted level based on severity
        if len(illegal_cargo) >= 3:  # Major smuggling
            self.game.player.increase_wanted_level(faction, 2)
        else:  # Minor smuggling
            self.game.player.increase_wanted_level(faction, 1)
        
        if self.game.player.credits < 0:
            print("You couldn't afford the fine and have been thrown in jail. Your journey ends here.")
            self.game.game_over = True
    
    def _handle_bounty_hunter(self):
        """Handle a bounty hunter encounter."""
        wanted_level = self.game.player.get_total_wanted_level()
        
        # Determine which faction's bounty hunter
        if self.game.player.wanted_by:
            # Pick the faction with highest wanted level
            faction = max(self.game.player.wanted_by.items(), key=lambda x: x[1])[0]
        else:
            faction = "Independent"
        
        hunter_names = ["Steel Wolf", "Black Widow", "The Reaper", "Crimson Blade", "Shadow Strike"]
        hunter_name = random.choice(hunter_names)
        
        print(f"A bounty hunter ship hails you! It's {hunter_name}, working for the {faction}.")
        print(f"\"There's a bounty on your head, Captain. Come quietly or face the consequences!\"")
        
        # Calculate bounty based on wanted level
        bounty = wanted_level * 2000
        
        print(f"\nOptions:")
        print(f"1. Surrender peacefully (pay {bounty} credits fine, clear wanted status)")
        print(f"2. Try to bribe the bounty hunter ({bounty // 2} credits)")
        print(f"3. Attempt to flee")
        print(f"4. Fight!")
        
        choice = input("\nYour choice (1-4): ").strip()
        
        if choice == "1":
            # Surrender
            if self.game.player.credits >= bounty:
                self.game.player.credits -= bounty
                print(f"\nYou transfer {bounty} credits and surrender to the authorities.")
                print("After processing, your wanted status has been cleared.")
                
                # Clear wanted status
                if faction != "Independent":
                    self.game.player.decrease_wanted_level(faction, self.game.player.wanted_by.get(faction, 0))
                else:
                    self.game.player.wanted_level = 0
                    
                # Minor reputation loss for surrendering
                if faction != "Independent":
                    self.game.player.add_reputation(faction, -5)
            else:
                print("\nYou don't have enough credits to pay the bounty!")
                print("The bounty hunter takes what you have and your ship.")
                print("Your journey ends here.")
                self.game.game_over = True
                
        elif choice == "2":
            # Bribe
            bribe_amount = bounty // 2
            if self.game.player.credits >= bribe_amount:
                self.game.player.credits -= bribe_amount
                
                # Success depends on wanted level and negotiation
                success_chance = 0.6 - (wanted_level * 0.1)
                success_chance += self.game.player.get_skill_bonus("negotiation")
                
                if random.random() < success_chance:
                    print(f"\nThe bounty hunter accepts your {bribe_amount} credit bribe.")
                    print("\"I never saw you, Captain. But watch your back - others are looking.\"")
                    
                    # Reduce wanted level slightly
                    if faction != "Independent":
                        self.game.player.decrease_wanted_level(faction, 1)
                    else:
                        self.game.player.decrease_wanted_level(None, 1)
                else:
                    print("\nThe bounty hunter refuses your bribe!")
                    print("\"Nice try, but I have a reputation to maintain.\"")
                    self._bounty_hunter_combat(hunter_name, wanted_level)
            else:
                print("\nYou don't have enough credits for a bribe!")
                self._bounty_hunter_combat(hunter_name, wanted_level)
                
        elif choice == "3":
            # Flee
            flee_chance = 0.4 + self.game.player.get_skill_bonus("piloting")
            flee_chance += self.game.player.get_crew_bonus("Engineer") * 0.1
            
            if self.game.player.ship.specialization == "exploration":
                flee_chance += 0.2  # Exploration ships are better at escaping
                
            if random.random() < flee_chance:
                print("\nYou push your engines to the limit and manage to escape!")
                print("The bounty hunter's threats fade into the distance.")
                
                # Use extra fuel
                fuel_cost = random.randint(5, 10)
                self.game.player.ship.fuel = max(0, self.game.player.ship.fuel - fuel_cost)
                print(f"The escape maneuver consumed {fuel_cost} extra fuel.")
                
                # Gain piloting experience
                self.game.player.gain_skill("piloting", 3)
            else:
                print("\nYour escape attempt fails! The bounty hunter's ship is too fast.")
                self._bounty_hunter_combat(hunter_name, wanted_level)
                
        else:
            # Fight
            self._bounty_hunter_combat(hunter_name, wanted_level)
    
    def _bounty_hunter_combat(self, hunter_name, wanted_level):
        """Handle combat with a bounty hunter."""
        print(f"\n--- COMBAT: {hunter_name} ---")
        
        # Bounty hunter stats scale with wanted level
        hunter_hull = 50 + (wanted_level * 20)
        hunter_damage = 15 + (wanted_level * 5)
        
        player_hull = self.game.player.ship.hull
        player_damage = self.game.player.ship.get_weapon_damage(self.game.player)
        player_shields = self.game.player.ship.get_shield_strength()
        
        print(f"Enemy Hull: {hunter_hull}")
        print(f"Your Hull: {player_hull} | Shields: {player_shields}")
        
        # Combat with shields
        while hunter_hull > 0 and player_hull > 0:
            # Player attacks
            print(f"\nYou fire your weapons for {player_damage} damage!")
            hunter_hull -= player_damage
            
            if hunter_hull <= 0:
                print(f"\n{hunter_name}'s ship explodes! You've defeated the bounty hunter!")
                
                # Rewards
                credits_reward = wanted_level * 1000
                self.game.player.credits += credits_reward
                print(f"You salvage {credits_reward} credits from the wreckage.")
                
                # Gain combat experience
                self.game.player.ship.gain_experience("combat", 10 * wanted_level)
                self.game.player.gain_skill("piloting", 2)
                self.game.player.give_crew_experience("Weapons Officer", 5)
                
                # Increase global wanted level for killing a bounty hunter
                print("\nKilling a bounty hunter has made you even more notorious!")
                self.game.player.increase_wanted_level(None, 1)
                break
                
            # Hunter attacks
            print(f"{hunter_name} returns fire for {hunter_damage} damage!")
            
            # Damage shields first
            if player_shields > 0:
                shield_damage = min(player_shields, hunter_damage)
                player_shields -= shield_damage
                remaining_damage = hunter_damage - shield_damage
                
                if remaining_damage > 0:
                    player_hull -= remaining_damage
                    self.game.player.ship.hull = player_hull
                    print(f"Shields down! Hull damage taken.")
                else:
                    print(f"Shields absorb the impact. Shields at {player_shields}.")
            else:
                player_hull -= hunter_damage
                self.game.player.ship.hull = player_hull
                
            if player_hull <= 0:
                print(f"\nYour ship has been destroyed by {hunter_name}!")
                print("Your journey ends here.")
                self.game.game_over = True
                break

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
        
        # Check if tactical combat is enabled
        use_tactical = input("Engage in tactical combat? (yes/no/flee): ").lower()
        
        if use_tactical == "yes":
            # Use new tactical combat system
            from .combat import TacticalCombat, WeaponRange
            
            enemy_data = [{
                "name": pirate_name if bounty_mission else "Pirate Raider",
                "type": "bounty" if bounty_mission else "pirate",
                "hull": pirate_hull,
                "shield": 20 if bounty_mission else 0,
                "damage": pirate_damage,
                "range": WeaponRange.MEDIUM,
                "speed": 2,
                "evasion": 15 if bounty_mission else 10
            }]
            
            combat = TacticalCombat(self.game.player.ship, enemy_data, self.game)
            result = combat.run()
            
            if result == "victory":
                print("\nVICTORY! You've defeated the enemy!")
                # Apply combat results
                self.game.player.ship.hull = combat.player.hull
                
                # Give combat experience
                self.game.player.give_crew_experience("Weapons Officer", 5)
                self.game.player.ship.gain_experience("combat", 10)
                
                # Boost crew morale
                self.game.player.adjust_crew_morale(10, "Victory in tactical combat!")
                
                # Handle captured ships
                if hasattr(combat, 'captured_ships') and combat.captured_ships:
                    print("\n--- CAPTURED SHIPS ---")
                    for captured in combat.captured_ships:
                        print(f"You've captured the {captured['name']}!")
                        # Give player choice of what to do with captured ship
                        choice = input("What do you want to do? (keep/sell/scrap): ").lower()
                        
                        if choice == "keep":
                            # Add to fleet (simplified - would need proper ship creation in real game)
                            from .classes import Ship
                            new_ship = Ship("starter_ship")  # Simplification - would determine class from captured ship
                            new_ship.id = f"captured_{random.randint(1000, 9999)}"
                            new_ship.custom_name = captured['name']
                            new_ship.hull = captured['max_hull'] // 2  # Damaged from combat
                            new_ship.location = self.game.player.location.name
                            self.game.player.ships.append(new_ship)
                            print(f"Added {captured['name']} to your fleet!")
                        elif choice == "sell":
                            value = captured['max_hull'] * 50  # Base value on hull size
                            self.game.player.credits += value
                            print(f"Sold {captured['name']} for {value} credits!")
                        else:  # scrap
                            parts = captured['max_hull'] * 10
                            self.game.player.credits += parts
                            print(f"Scrapped {captured['name']} for {parts} credits worth of parts!")
                
                if bounty_mission:
                    self.game._handle_complete(["complete", bounty_mission.id, "bounty"])
                else:
                    salvage = random.randint(200, 800)
                    self.game.player.credits += salvage
                    print(f"You salvage {salvage} credits from the wreckage.")
            else:
                # Defeat
                self.game.game_over = True
                print("Your ship was destroyed in combat...")
            return
        elif use_tactical == "flee":
            choice = "flee"
        else:
            # Use classic combat
            choice = use_tactical if use_tactical in ["fight", "flee"] else ""
        
        while True:
            if not choice:
                choice = input("Do you 'fight' or 'flee'? > ").lower()
            if choice == "flee":
                print("You attempt to flee...")
                # Piloting skill improves flee chance
                flee_chance = 0.5 + self.game.player.get_skill_bonus("piloting") * 0.5  # Up to 75% with max skill
                if random.random() < flee_chance:
                    print("You got away safely!")
                    self.game.player.gain_skill("piloting", 2)  # Gain extra piloting for successful escape
                    return
                else:
                    print("You couldn't escape!")
                    continue
            
            # Player's turn
            player_damage = self.game.player.ship.get_weapon_damage(self.game.player)
            pirate_hull -= player_damage
            print(f"You fire your weapons, dealing {player_damage} damage. The pirate has {pirate_hull} hull remaining.")
            
            # Give weapons officer experience
            self.game.player.give_crew_experience("Weapons Officer", 2)
            if pirate_hull <= 0:
                print(f"You destroyed the {pirate_name}'s ship!")
                
                # Boost crew morale for combat victory
                self.game.player.adjust_crew_morale(5, "Victory in combat lifted everyone's spirits")
                
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

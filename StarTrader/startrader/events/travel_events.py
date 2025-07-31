"""
Travel-related events for Star Trader.

Events that can occur while traveling between star systems.
"""

import random
from typing import TYPE_CHECKING
from ..event_system import Event, EventConfig, EventType, EventTrigger, EventRegistry
from ..game_data import ILLEGAL_GOODS
from ..constants import (
    PIRATE_FLEE_BASE_CHANCE, PIRATE_FLEE_EXPLORATION_BONUS, 
    PIRATE_NEGOTIATE_BASE_CHANCE, PIRATE_NEGOTIATE_CREW_BONUS,
    CUSTOMS_SCAN_BASE_CHANCE, CUSTOMS_DIPLOMATIC_IMMUNITY,
    CUSTOMS_BAD_REP_MULTIPLIER, CUSTOMS_NEGATIVE_REP_MULTIPLIER,
    CUSTOMS_BRIBE_PERCENTAGE, CUSTOMS_BRIBE_SUCCESS_CHANCE
)

if TYPE_CHECKING:
    from ..main import Game


class PirateEncounterEvent(Event):
    """Random pirate encounter during travel."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute pirate encounter."""
        pirate_names = ["Blackbeard's Revenge", "Crimson Scourge", "Shadow Raider", "Void Reaper"]
        pirate_name = random.choice(pirate_names)
        
        print(f"You've been ambushed by the pirate ship '{pirate_name}'!")
        print("Options:")
        print("1. Fight")
        print("2. Flee")
        print("3. Negotiate")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == "1":
            # Combat
            from ..classes import Ship
            
            # Create pirate ship
            pirate_ship = Ship("fighter")
            pirate_ship.name = pirate_name
            pirate_ship.hull = random.randint(30, 60)
            # Set base hull to match current hull for pirate
            pirate_ship.ship_class_data["base_hull"] = pirate_ship.hull
            
            # Simple combat
            print(f"\n--- COMBAT: {game.player.ship.name} vs {pirate_ship.name} ---")
            
            while pirate_ship.hull > 0 and game.player.ship.hull > 0:
                # Player attacks
                damage = game.player.ship.get_weapon_damage(game.player)
                pirate_ship.hull -= damage
                print(f"You deal {damage} damage! Pirate hull: {max(0, pirate_ship.hull)}")
                
                if pirate_ship.hull <= 0:
                    break
                    
                # Pirate attacks
                pirate_damage = random.randint(10, 20)
                shield_strength = game.player.ship.get_shield_strength()
                shield_absorbed = min(pirate_damage, shield_strength)
                hull_damage = pirate_damage - shield_absorbed
                
                if shield_absorbed > 0:
                    # Reduce shield strength (this is handled by the shield system)
                    print(f"Shields absorb {shield_absorbed} damage!")
                    
                if hull_damage > 0:
                    game.player.ship.hull -= hull_damage
                    print(f"Hull takes {hull_damage} damage! Your hull: {game.player.ship.hull}")
            
            if pirate_ship.hull <= 0:
                print("\nVictory! The pirate ship is destroyed!")
                loot = random.randint(200, 500)
                game.player.credits += loot
                print(f"You salvage {loot} credits from the wreckage.")
                game.player.ship.gain_experience("combat", 5)
                game.player.give_crew_experience("Weapons Officer", 2)
            else:
                print("\nYour ship has been destroyed!")
                game.game_over = True
                
        elif choice == "2":
            # Flee
            flee_chance = PIRATE_FLEE_BASE_CHANCE + game.player.get_skill_bonus("piloting")
            if game.player.ship.specialization == "exploration":
                flee_chance += PIRATE_FLEE_EXPLORATION_BONUS
                
            if random.random() < flee_chance:
                print("\nYou manage to escape!")
                game.player.gain_skill("piloting", 2)
            else:
                print("\nYou fail to escape!")
                damage = random.randint(15, 30)
                game.player.ship.hull -= damage
                print(f"The pirates deal {damage} damage before you get away!")
                
        elif choice == "3":
            # Negotiate
            negotiate_chance = PIRATE_NEGOTIATE_BASE_CHANCE + game.player.get_skill_bonus("negotiation")
            if game.player.get_crew_bonus("Negotiator") > 0:
                negotiate_chance += PIRATE_NEGOTIATE_CREW_BONUS
                
            if random.random() < negotiate_chance:
                tribute = min(game.player.credits // 3, 1000)
                print(f"\nThe pirates accept {tribute} credits as tribute.")
                game.player.credits -= tribute
                game.player.gain_skill("negotiation", 3)
            else:
                print("\nNegotiations fail! The pirates attack!")
                return self._execute(game, context)  # Force combat
                
        return True


class CustomsScanEvent(Event):
    """Customs inspection event."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute customs scan."""
        faction = game.player.location.faction
        
        reputation = game.player.reputation.get(faction, 0)
        scan_chance = CUSTOMS_SCAN_BASE_CHANCE
        
        # Check rank benefits for reduced scrutiny
        benefits = game.player.get_rank_benefits(faction)
        if "reduced_customs_scrutiny" in benefits:
            scan_chance *= benefits["reduced_customs_scrutiny"]
        elif "diplomatic_immunity" in benefits:
            scan_chance = CUSTOMS_DIPLOMATIC_IMMUNITY
        
        if reputation < -25:
            scan_chance = min(0.8, scan_chance * CUSTOMS_BAD_REP_MULTIPLIER)
        elif reputation < 0:
            scan_chance = min(0.6, scan_chance * CUSTOMS_NEGATIVE_REP_MULTIPLIER)
            
        if random.random() > scan_chance:
            print("The patrol ship passes by without incident.")
            return True
        
        print(f"You are hailed by a {faction} patrol for a routine customs scan.")
        
        illegal_cargo = []
        for good, quantity in game.player.ship.cargo_hold.items():
            if good in ILLEGAL_GOODS:
                illegal_cargo.append((good, quantity))
        
        if not illegal_cargo:
            print("The scan reveals nothing illegal. They let you pass.")
            return True
            
        print("\n--- CONTRABAND DETECTED! ---")
        
        # Calculate fines
        total_fine = 0
        for good, quantity in illegal_cargo:
            base_price = ILLEGAL_GOODS[good]["base_price"]
            fine = base_price * quantity * 2
            total_fine += fine
            
        bribe_amount = int(total_fine * CUSTOMS_BRIBE_PERCENTAGE)
        
        if game.player.credits >= bribe_amount:
            choice = input(f"Offer a {bribe_amount} credit 'donation' to avoid trouble? (y/n) > ").lower()
            if choice == 'y':
                bribe_success_chance = CUSTOMS_BRIBE_SUCCESS_CHANCE
                if "intimidation_bonus" in benefits:
                    bribe_success_chance = min(0.95, CUSTOMS_BRIBE_SUCCESS_CHANCE + (benefits["intimidation_bonus"] - 1) * 0.1)
                
                if random.random() < bribe_success_chance:
                    game.player.credits -= bribe_amount
                    print("The customs officer pockets the credits and looks the other way.")
                    if "intimidation_bonus" in benefits:
                        print("Your reputation precedes you - the officer seems eager to avoid trouble.")
                    return True
                else:
                    print("The customs officer refuses your bribe and calls for backup!")
                    total_fine *= 2
                    game.player.add_reputation(faction, -10)
        
        # Confiscate goods and apply fines
        for good, quantity in illegal_cargo:
            print(f"Your {quantity} units of {good} have been confiscated!")
            game.player.ship.remove_cargo(good, quantity)
            
        reputation_loss = 25 * len(illegal_cargo)
        print(f"You have been fined {total_fine} credits and your reputation with {faction} has been damaged.")
        game.player.credits -= total_fine
        game.player.add_reputation(faction, -reputation_loss)
        
        # Increase wanted level
        if len(illegal_cargo) >= 3:
            game.player.increase_wanted_level(faction, 2)
        else:
            game.player.increase_wanted_level(faction, 1)
        
        if game.player.credits < 0:
            print("You couldn't afford the fine and have been thrown in jail. Your journey ends here.")
            game.game_over = True
            
        return True


class BountyHunterEvent(Event):
    """Bounty hunter encounter for wanted players."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute bounty hunter encounter."""
        wanted_level = game.player.get_total_wanted_level()
        
        # Determine which faction's bounty hunter
        if game.player.wanted_by:
            faction = max(game.player.wanted_by.items(), key=lambda x: x[1])[0]
        else:
            faction = "Independent"
        
        hunter_names = ["Steel Wolf", "Black Widow", "The Reaper", "Crimson Blade", "Shadow Strike"]
        hunter_name = random.choice(hunter_names)
        
        print(f"A bounty hunter ship hails you! It's {hunter_name}, working for the {faction}.")
        print(f'"There\'s a bounty on your head, Captain. Come quietly or face the consequences!"')
        
        bounty = wanted_level * 2000
        
        print(f"\nOptions:")
        print(f"1. Surrender peacefully (pay {bounty} credits fine, clear wanted status)")
        print(f"2. Try to bribe the bounty hunter ({bounty // 2} credits)")
        print(f"3. Attempt to flee")
        print(f"4. Fight!")
        
        choice = input("\nYour choice (1-4): ").strip()
        
        if choice == "1":
            # Surrender
            if game.player.credits >= bounty:
                game.player.credits -= bounty
                print(f"\nYou transfer {bounty} credits and surrender to the authorities.")
                print("After processing, your wanted status has been cleared.")
                
                if faction != "Independent":
                    game.player.decrease_wanted_level(faction, game.player.wanted_by.get(faction, 0))
                else:
                    game.player.wanted_level = 0
                    
                if faction != "Independent":
                    game.player.add_reputation(faction, -5)
            else:
                print("\nYou don't have enough credits to pay the bounty!")
                print("The bounty hunter takes what you have and your ship.")
                game.game_over = True
                
        elif choice == "2":
            # Bribe
            bribe_amount = bounty // 2
            if game.player.credits >= bribe_amount:
                game.player.credits -= bribe_amount
                
                success_chance = 0.6 - (wanted_level * 0.1)
                success_chance += game.player.get_skill_bonus("negotiation")
                
                if random.random() < success_chance:
                    print(f"\nThe bounty hunter accepts your {bribe_amount} credit bribe.")
                    print('"I never saw you, Captain. But watch your back - others are looking."')
                    
                    if faction != "Independent":
                        game.player.decrease_wanted_level(faction, 1)
                    else:
                        game.player.decrease_wanted_level(None, 1)
                else:
                    print('\nThe bounty hunter refuses your bribe!')
                    print('"Nice try, but I have a reputation to maintain."')
                    return self._bounty_hunter_combat(game, hunter_name, wanted_level)
            else:
                print("\nYou don't have enough credits for a bribe!")
                return self._bounty_hunter_combat(game, hunter_name, wanted_level)
                
        elif choice == "3":
            # Flee
            flee_chance = 0.4 + game.player.get_skill_bonus("piloting")
            flee_chance -= wanted_level * 0.05
            
            if random.random() < flee_chance:
                print("\nYou manage to escape the bounty hunter!")
                game.player.gain_skill("piloting", 3)
            else:
                print("\nThe bounty hunter's ship is too fast! You can't escape!")
                return self._bounty_hunter_combat(game, hunter_name, wanted_level)
                
        else:
            # Fight
            return self._bounty_hunter_combat(game, hunter_name, wanted_level)
            
        return True
    
    def _bounty_hunter_combat(self, game: 'Game', hunter_name: str, wanted_level: int) -> bool:
        """Handle combat with bounty hunter."""
        print(f"\n--- COMBAT: {game.player.ship.name} vs {hunter_name} ---")
        
        # Bounty hunter stats scale with wanted level
        hunter_hull = 40 + (wanted_level * 10)
        hunter_damage = 15 + (wanted_level * 3)
        
        while hunter_hull > 0 and game.player.ship.hull > 0:
            # Player attacks
            damage = game.player.ship.get_weapon_damage(game.player)
            hunter_hull -= damage
            print(f"You deal {damage} damage! Hunter hull: {max(0, hunter_hull)}")
            
            if hunter_hull <= 0:
                break
                
            # Hunter attacks
            shield_absorbed = min(hunter_damage, game.player.ship.shields)
            hull_damage = hunter_damage - shield_absorbed
            
            if shield_absorbed > 0:
                game.player.ship.shields -= shield_absorbed
                print(f"Shields absorb {shield_absorbed} damage!")
                
            if hull_damage > 0:
                game.player.ship.hull -= hull_damage
                print(f"Hull takes {hull_damage} damage! Your hull: {game.player.ship.hull}")
        
        if hunter_hull <= 0:
            print(f"\nYou've defeated {hunter_name}!")
            print("Your wanted status remains, but word of this will spread...")
            game.player.ship.gain_experience("combat", 10)
            game.player.gain_skill("leadership", 3)
        else:
            print("\nThe bounty hunter has captured you!")
            game.game_over = True
            
        return True


class DerelictShipEvent(Event):
    """Find a derelict ship while traveling."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute derelict ship discovery."""
        print("Your sensors detect a derelict vessel drifting nearby.")
        print("\nOptions:")
        print("1. Board and search for salvage")
        print("2. Scan from a safe distance")
        print("3. Ignore it and continue")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == "1":
            # Board the ship
            print("\nYou dock with the derelict and board it...")
            
            outcome = random.random()
            if outcome < 0.3:
                # Find valuable cargo
                from ..game_data import GOODS
                found_good = random.choice(list(GOODS.keys()))
                quantity = random.randint(5, 15)
                
                if game.player.ship.get_cargo_used() + quantity <= game.player.ship.cargo_capacity:
                    game.player.ship.add_cargo(found_good, quantity)
                    print(f"You find {quantity} units of {found_good} in the cargo hold!")
                else:
                    print(f"You find {quantity} units of {found_good}, but lack cargo space.")
                    
            elif outcome < 0.5:
                # Find credits
                credits = random.randint(300, 800)
                game.player.credits += credits
                print(f"You recover {credits} credits from the ship's safe!")
                
            elif outcome < 0.7:
                # Find ship logs (gain experience)
                print("You find the ship's logs and learn valuable information.")
                game.player.gain_skill("piloting", 2)
                game.player.gain_skill("mechanics", 2)
                game.player.ship.gain_experience("exploration", 3)
                
            else:
                # Trap!
                print("It's a trap! The ship's automated defenses activate!")
                damage = random.randint(10, 25)
                game.player.ship.hull -= damage
                print(f"You take {damage} hull damage escaping!")
                
        elif choice == "2":
            # Scan only
            print("\nYour scans reveal the ship has been stripped of valuables.")
            print("However, you gather useful tactical data.")
            game.player.ship.gain_experience("exploration", 2)
            
        return True


class AsteroidFieldEvent(Event):
    """Navigate through an asteroid field."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute asteroid field navigation."""
        print("You've entered a dense asteroid field!")
        print("Your navigation computer plots several routes:")
        print("\n1. Safe route (costs 5 extra fuel)")
        print("2. Direct route (risky but fast)")
        print("3. Scenic route (chance to find minerals)")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == "1":
            # Safe route
            if game.player.ship.fuel >= 5:
                game.player.ship.fuel -= 5
                print("\nYou carefully navigate around the asteroids.")
                print("It takes extra fuel, but you make it through safely.")
            else:
                print("\nNot enough fuel for the safe route! Forced to go direct...")
                choice = "2"
                
        if choice == "2":
            # Direct route
            dodge_chance = 0.5 + game.player.get_skill_bonus("piloting")
            if game.player.get_crew_bonus("Navigator") > 0:
                dodge_chance += 0.2
                
            if random.random() < dodge_chance:
                print("\nSkillful piloting gets you through unscathed!")
                game.player.gain_skill("piloting", 3)
            else:
                damage = random.randint(10, 30)
                game.player.ship.hull -= damage
                print(f"\nYou clip several asteroids! Hull damage: -{damage}")
                
        elif choice == "3":
            # Scenic route
            print("\nYou take a longer path, scanning for valuable minerals...")
            
            if random.random() < 0.4:
                # Find minerals
                quantity = random.randint(10, 25)
                if game.player.ship.get_cargo_used() + quantity <= game.player.ship.cargo_capacity:
                    game.player.ship.add_cargo("Minerals", quantity)
                    print(f"You extract {quantity} units of Minerals from asteroids!")
                else:
                    print("You find minerals but lack cargo space to collect them.")
            else:
                print("The asteroids contain only worthless rock.")
                
            # Small chance of danger
            if random.random() < 0.2:
                damage = random.randint(5, 15)
                game.player.ship.hull -= damage
                print(f"A small asteroid impacts your hull! Damage: -{damage}")
                
        return True


def register_travel_events(registry: EventRegistry) -> None:
    """Register all travel events with the event registry.
    
    Args:
        registry: The event registry to register events with
    """
    # Pirate encounter
    pirate_config = EventConfig(
        id="pirate_encounter",
        name="Pirate Ambush",
        description="Pirates have detected your ship!",
        event_type=EventType.COMBAT,
        trigger=EventTrigger.ON_TRAVEL,
        base_chance=0.15,
        weight=10
    )
    registry.register(PirateEncounterEvent(pirate_config))
    
    # Customs scan
    customs_config = EventConfig(
        id="customs_scan",
        name="Customs Inspection",
        description="A patrol ship is approaching for inspection.",
        event_type=EventType.DIPLOMATIC,
        trigger=EventTrigger.ON_TRAVEL,
        base_chance=0.2,
        requirements={
            "faction": ["Federation", "Syndicate"]  # No customs in Independent systems
        },
        weight=8
    )
    registry.register(CustomsScanEvent(customs_config))
    
    # Bounty hunter
    bounty_config = EventConfig(
        id="bounty_hunter",
        name="Bounty Hunter",
        description="Someone is hunting you!",
        event_type=EventType.COMBAT,
        trigger=EventTrigger.ON_TRAVEL,
        base_chance=0.3,
        requirements={
            "min_wanted_level": 3
        },
        weight=15,
        cooldown=5  # Don't spawn too frequently
    )
    registry.register(BountyHunterEvent(bounty_config))
    
    # Derelict ship
    derelict_config = EventConfig(
        id="derelict_ship",
        name="Derelict Vessel",
        description="An abandoned ship floats in the void.",
        event_type=EventType.DISCOVERY,
        trigger=EventTrigger.ON_TRAVEL,
        base_chance=0.1,
        weight=5
    )
    registry.register(DerelictShipEvent(derelict_config))
    
    # Asteroid field
    asteroid_config = EventConfig(
        id="asteroid_field",
        name="Asteroid Field",
        description="Navigation hazard detected!",
        event_type=EventType.EXPLORATION,
        trigger=EventTrigger.ON_TRAVEL,
        base_chance=0.12,
        weight=7
    )
    registry.register(AsteroidFieldEvent(asteroid_config))
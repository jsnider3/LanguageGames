"""
Exploration-related events for Star Trader.

Events that can occur while exploring uncharted space.
"""

import random
from typing import TYPE_CHECKING
from ..event_system import Event, EventConfig, EventType, EventTrigger, EventRegistry

if TYPE_CHECKING:
    from ..main import Game


class DebrisFieldEvent(Event):
    """Discover a debris field from an old battle."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute debris field exploration."""
        print("\nThe debris appears to be from merchant vessels.")
        choice = input("Search for salvage? (y/n) > ").lower()
        
        if choice == 'y':
            if random.random() < 0.5:
                credits = random.randint(100, 500)
                game.player.credits += credits
                print(f"\nYou salvage {credits} credits worth of components!")
                game.player.ship.gain_experience("exploration", 2)
            else:
                damage = random.randint(5, 15)
                game.player.ship.hull -= damage
                print(f"\nMicro-meteorites damage your hull! -{damage} hull points.")
                
        return True


class DistressSignalEvent(Event):
    """Receive a mysterious distress signal."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute distress signal event."""
        print('\n"...anyone... please... failing..."')
        choice = input("Investigate the signal? (y/n) > ").lower()
        
        if choice == 'y':
            if random.random() < 0.6:
                # Genuine distress
                print("\nYou find a damaged escape pod!")
                print("The grateful survivor offers a reward.")
                game.player.credits += 750
                game.player.add_reputation("Independent", 5)
                game.player.gain_skill("leadership", 2)
            else:
                # Pirate trap!
                print("\nIt's a trap! Pirates attack!")
                # Trigger a pirate encounter
                from .travel_events import PirateEncounterEvent
                pirate_event = PirateEncounterEvent(EventConfig(
                    id="trap_pirates",
                    name="Pirate Trap",
                    description="Pirates spring their trap!",
                    event_type=EventType.COMBAT,
                    trigger=EventTrigger.ON_EXPLORE,
                    base_chance=1.0
                ))
                pirate_event.trigger(game, context)
                
        return True


class CosmicAnomalyEvent(Event):
    """Encounter a strange cosmic anomaly."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute cosmic anomaly event."""
        print("\nThe anomaly seems to be affecting local spacetime.")
        choice = input("Investigate closer? (y/n) > ").lower()
        
        if choice == 'y':
            outcome = random.random()
            if outcome < 0.3:
                # Positive effect
                print("\nThe anomaly enhances your ship's systems!")
                game.player.ship.fuel = min(game.player.ship.max_fuel, 
                                           game.player.ship.fuel + 10)
                print("Fuel systems recharged: +10 fuel")
                game.player.ship.gain_experience("exploration", 5)
                
            elif outcome < 0.6:
                # Negative effect
                print("\nThe anomaly disrupts your navigation systems!")
                print("You're thrown off course and lose time.")
                game.current_day += 1
                game._handle_daily_costs()
                
            else:
                # Discovery
                print("\nYou collect valuable scientific data!")
                game.player.credits += 300
                game.player.gain_skill("piloting", 3)
                game.player.ship.gain_experience("exploration", 3)
                
        return True


class RogueAsteroidEvent(Event):
    """Encounter a massive rogue asteroid."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute rogue asteroid event."""
        print("\nYour collision alarm is blaring!")
        
        dodge_chance = 0.5 + game.player.get_skill_bonus("piloting")
        if game.player.ship.specialization == "exploration":
            dodge_chance += 0.2
            
        if random.random() < dodge_chance:
            print("\nSkillful piloting helps you avoid the asteroid!")
            game.player.gain_skill("piloting", 2)
        else:
            damage = random.randint(10, 25)
            game.player.ship.hull -= damage
            print(f"\nThe asteroid clips your ship! Hull damage: -{damage}")
            
        return True


class AncientArtifactEvent(Event):
    """Discover an ancient alien artifact."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute ancient artifact discovery."""
        print("\nYour scanners detect an artificial object of unknown origin.")
        print("It appears to be an ancient artifact!")
        
        print("\nOptions:")
        print("1. Retrieve and study it")
        print("2. Scan from a distance")
        print("3. Mark location and leave")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == "1":
            # Retrieve artifact
            print("\nYou carefully retrieve the artifact...")
            
            outcome = random.random()
            if outcome < 0.4:
                # Valuable artifact
                value = random.randint(2000, 5000)
                game.player.credits += value
                print(f"The artifact is incredibly valuable! You sell it for {value} credits.")
                game.player.ship.gain_experience("exploration", 10)
                
            elif outcome < 0.7:
                # Knowledge artifact
                print("The artifact contains ancient knowledge!")
                print("Studying it improves your skills.")
                game.player.gain_skill("piloting", 5)
                game.player.gain_skill("mechanics", 5)
                game.player.gain_skill("leadership", 3)
                
            else:
                # Dangerous artifact
                print("The artifact emits a strange energy pulse!")
                print("Your ship's systems are damaged!")
                game.player.ship.hull -= 20
                if hasattr(game.player.ship, 'shields'):
                    game.player.ship.shields = 0
                    
        elif choice == "2":
            # Scan only
            print("\nYour scans reveal fascinating data about the artifact.")
            game.player.credits += 500
            game.player.ship.gain_experience("exploration", 5)
            
        else:
            # Mark and leave
            print("\nYou mark the location for future exploration.")
            print("Perhaps someone else will brave the risks.")
            
        return True


class SpaceWhaleEvent(Event):
    """Encounter mysterious space creatures."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute space whale encounter."""
        print("\nYour sensors detect massive life forms in the void!")
        print("They appear to be some kind of space-dwelling creatures.")
        
        print("\nThe creatures are:")
        creature_type = random.choice([
            "majestic and peaceful",
            "curious about your ship",
            "feeding on cosmic radiation",
            "migrating through the system"
        ])
        print(f"- {creature_type}")
        
        print("\nOptions:")
        print("1. Observe and document")
        print("2. Attempt communication")
        print("3. Leave quickly")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == "1":
            # Observe
            print("\nYou spend time observing these magnificent creatures.")
            print("The scientific data you collect is valuable!")
            game.player.credits += 400
            game.player.ship.gain_experience("exploration", 7)
            game.player.gain_skill("piloting", 2)
            
        elif choice == "2":
            # Communicate
            print("\nYou broadcast various signals toward the creatures...")
            
            if random.random() < 0.3:
                print("They respond! The creatures seem intelligent!")
                print("They share cosmic knowledge with you.")
                game.player.gain_skill("piloting", 10)
                game.player.ship.gain_experience("exploration", 15)
                
                # Chance for special reward
                if random.random() < 0.5:
                    print("\nThe creatures guide you to a resource cache!")
                    game.player.credits += 1000
            else:
                print("The creatures ignore your attempts at communication.")
                print("Still, you learn from the experience.")
                game.player.ship.gain_experience("exploration", 3)
                
        return True


class WormholeEvent(Event):
    """Discover an unstable wormhole."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute wormhole discovery."""
        print("\nYour instruments detect a spatial anomaly - it's a wormhole!")
        print("It appears unstable and may not last long.")
        
        print("\nOptions:")
        print("1. Enter the wormhole")
        print("2. Study it from a safe distance")
        print("3. Leave immediately")
        
        choice = input("\nYour choice (1-3): ").strip()
        
        if choice == "1":
            # Enter wormhole
            print("\nYou brave the unknown and enter the wormhole...")
            
            outcome = random.random()
            if outcome < 0.4:
                # Random system jump
                systems = list(game.galaxy.systems.keys())
                current = game.player.location.name
                destinations = [s for s in systems if s != current]
                
                if destinations:
                    destination = random.choice(destinations)
                    game.player.location = game.galaxy.systems[destination]
                    print(f"\nThe wormhole deposits you in {destination}!")
                    print("Your fuel is completely drained from the journey.")
                    game.player.ship.fuel = 0
                else:
                    print("\nThe wormhole collapses! You barely escape!")
                    game.player.ship.hull -= 30
                    
            elif outcome < 0.7:
                # Time dilation
                print("\nTime flows strangely in the wormhole...")
                days = random.randint(5, 15)
                game.current_day += days
                print(f"You emerge {days} days later!")
                
                # Process daily costs
                for _ in range(days):
                    game._handle_daily_costs()
                    
            else:
                # Valuable discovery
                print("\nThe wormhole leads to a pocket of space rich in resources!")
                game.player.credits += 2000
                game.player.ship.gain_experience("exploration", 20)
                
        elif choice == "2":
            # Study only
            print("\nYou collect valuable data about wormhole mechanics.")
            game.player.credits += 300
            game.player.gain_skill("piloting", 3)
            game.player.ship.gain_experience("exploration", 5)
            
        return True


def register_exploration_events(registry: EventRegistry) -> None:
    """Register all exploration events with the event registry.
    
    Args:
        registry: The event registry to register events with
    """
    # Debris field
    debris_config = EventConfig(
        id="debris_field",
        name="Debris Field",
        description="You encounter floating debris from an old battle.",
        event_type=EventType.EXPLORATION,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.15,
        weight=10
    )
    registry.register(DebrisFieldEvent(debris_config))
    
    # Distress signal
    distress_config = EventConfig(
        id="distress_signal",
        name="Distress Signal",
        description="A faint distress signal reaches your communications array.",
        event_type=EventType.DISCOVERY,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.12,
        weight=8
    )
    registry.register(DistressSignalEvent(distress_config))
    
    # Cosmic anomaly
    anomaly_config = EventConfig(
        id="cosmic_anomaly",
        name="Cosmic Anomaly",
        description="Strange energy readings appear on your sensors.",
        event_type=EventType.EXPLORATION,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.1,
        weight=7
    )
    registry.register(CosmicAnomalyEvent(anomaly_config))
    
    # Rogue asteroid
    asteroid_config = EventConfig(
        id="rogue_asteroid",
        name="Rogue Asteroid",
        description="A massive asteroid crosses your path!",
        event_type=EventType.EXPLORATION,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.13,
        weight=9
    )
    registry.register(RogueAsteroidEvent(asteroid_config))
    
    # Ancient artifact (rare)
    artifact_config = EventConfig(
        id="ancient_artifact",
        name="Ancient Artifact",
        description="Sensors detect an object of artificial origin.",
        event_type=EventType.DISCOVERY,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.05,
        weight=3,
        requirements={
            "context": {"event_type": "exploration"}
        }
    )
    registry.register(AncientArtifactEvent(artifact_config))
    
    # Space whale (very rare)
    whale_config = EventConfig(
        id="space_whale",
        name="Space Creatures",
        description="Unknown life forms detected!",
        event_type=EventType.DISCOVERY,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.03,
        weight=2,
        cooldown=20  # Very special event
    )
    registry.register(SpaceWhaleEvent(whale_config))
    
    # Wormhole (extremely rare)
    wormhole_config = EventConfig(
        id="wormhole",
        name="Unstable Wormhole",
        description="A tear in spacetime appears before you!",
        event_type=EventType.DISCOVERY,
        trigger=EventTrigger.ON_EXPLORE,
        base_chance=0.02,
        weight=1,
        cooldown=50,  # Once in a lifetime event
        max_occurrences=3  # Can only happen a few times per game
    )
    registry.register(WormholeEvent(wormhole_config))
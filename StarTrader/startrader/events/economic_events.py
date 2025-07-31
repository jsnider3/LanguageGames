"""
Economic-related events for Star Trader.

Events that affect markets, prices, and trade opportunities.
"""

import random
from typing import TYPE_CHECKING
from ..event_system import Event, EventConfig, EventType, EventTrigger, EventRegistry

if TYPE_CHECKING:
    from ..main import Game


class FamineEvent(Event):
    """A famine strikes a system, drastically increasing food prices."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute famine event."""
        system = game.player.location
        
        # Check if there's already an event in this system
        if system.name in game.galaxy.active_events:
            return False
            
        print(f"\nBreaking news: A severe famine has struck {system.name}!")
        print("Food prices have skyrocketed due to crop failures.")
        
        # Create the famine event
        game.galaxy.active_events[system.name] = {
            "type": "famine",
            "good": "Food",
            "modifier": 5.0,  # 5x price increase
            "duration": random.randint(10, 20),
            "day_started": game.current_day
        }
        
        # Update market immediately
        if "Food" in system.market:
            system.market["Food"]["price"] = int(system.market["Food"]["price"] * 5.0)
            system.market["Food"]["quantity"] = max(1, system.market["Food"]["quantity"] // 3)
            
        # Reputation opportunity
        if "Food" in game.player.ship.cargo_hold:
            print("\nYou have Food in your cargo hold!")
            print("Selling it here would be very profitable but might affect your reputation.")
            
        return True


class MiningStrikeEvent(Event):
    """Workers strike at mines, reducing mineral supply."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute mining strike event."""
        system = game.player.location
        
        # Only happens in mining economies
        if system.economy_type != "Mining":
            return False
            
        # Check if there's already an event in this system
        if system.name in game.galaxy.active_events:
            return False
            
        print(f"\nLabor dispute in {system.name}!")
        print("Mining operations have ground to a halt due to worker strikes.")
        print("Mineral supplies are running low.")
        
        # Create the strike event
        game.galaxy.active_events[system.name] = {
            "type": "mining_strike",
            "good": "Minerals",
            "modifier": 0.1,  # 90% reduction in supply
            "duration": random.randint(7, 15),
            "day_started": game.current_day
        }
        
        # Update market
        if "Minerals" in system.market:
            system.market["Minerals"]["quantity"] = max(1, int(system.market["Minerals"]["quantity"] * 0.1))
            system.market["Minerals"]["price"] = int(system.market["Minerals"]["price"] * 2.5)
            
        return True


class BountifulHarvestEvent(Event):
    """Exceptional harvest leads to food surplus."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute bountiful harvest event."""
        system = game.player.location
        
        # Only happens in agricultural economies
        if system.economy_type != "Agricultural":
            return False
            
        # Check if there's already an event in this system
        if system.name in game.galaxy.active_events:
            return False
            
        print(f"\nExcellent news from {system.name}!")
        print("Perfect weather conditions have led to a record harvest.")
        print("Food is plentiful and cheap!")
        
        # Create the harvest event
        game.galaxy.active_events[system.name] = {
            "type": "bountiful_harvest",
            "good": "Food",
            "modifier": 0.3,  # 70% price reduction
            "duration": random.randint(5, 10),
            "day_started": game.current_day
        }
        
        # Update market
        if "Food" in system.market:
            system.market["Food"]["quantity"] = min(999, system.market["Food"]["quantity"] * 5)
            system.market["Food"]["price"] = max(10, int(system.market["Food"]["price"] * 0.3))
            
        return True


class TechBoomEvent(Event):
    """Technology breakthrough reduces electronics prices."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute tech boom event."""
        system = game.player.location
        
        # Only happens in tech economies
        if system.economy_type != "Tech":
            return False
            
        # Check if there's already an event in this system
        if system.name in game.galaxy.active_events:
            return False
            
        print(f"\nTechnology breakthrough in {system.name}!")
        print("New manufacturing processes have made electronics much cheaper to produce.")
        
        # Create the tech boom event
        game.galaxy.active_events[system.name] = {
            "type": "tech_boom",
            "good": "Electronics",
            "modifier": 0.5,  # 50% price reduction
            "duration": random.randint(8, 12),
            "day_started": game.current_day
        }
        
        # Update market
        if "Electronics" in system.market:
            system.market["Electronics"]["quantity"] = min(999, system.market["Electronics"]["quantity"] * 3)
            system.market["Electronics"]["price"] = max(20, int(system.market["Electronics"]["price"] * 0.5))
            
        return True


class TradeEmbargoEvent(Event):
    """Trade embargo affects certain goods."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute trade embargo event."""
        # This is a galactic event, not system-specific
        if "trade_embargo" in game.galaxy.galactic_events:
            return False
            
        # Pick two factions for the embargo
        factions = ["Federation", "Syndicate"]
        if random.random() < 0.5:
            factions.reverse()
            
        print(f"\n--- GALACTIC NEWS ---")
        print(f"TRADE WAR: The {factions[0]} has imposed trade sanctions on the {factions[1]}!")
        print("Certain goods are now restricted between faction territories.")
        
        # Create galactic event
        restricted_goods = random.sample(["Machinery", "Electronics", "Weapons", "Medicine"], 2)
        game.galaxy.galactic_events["trade_embargo"] = {
            "description": f"{factions[0]}-{factions[1]} trade embargo",
            "factions": factions,
            "restricted_goods": restricted_goods,
            "duration": random.randint(15, 25),
            "day_started": game.current_day
        }
        
        print(f"Restricted goods: {', '.join(restricted_goods)}")
        print("Trading these goods between faction territories may result in penalties.")
        
        # Affect faction relations
        game.galaxy.adjust_faction_relations(factions[0], factions[1], -20)
        
        return True


class MarketCrashEvent(Event):
    """Market crash affects luxury goods prices globally."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute market crash event."""
        if "market_crash" in game.galaxy.galactic_events:
            return False
            
        print(f"\n--- GALACTIC NEWS ---")
        print("ECONOMIC CRISIS: Galactic markets are in turmoil!")
        print("Luxury goods demand has plummeted across all systems.")
        
        # Create galactic event
        game.galaxy.galactic_events["market_crash"] = {
            "description": "Galactic market crash",
            "affected_goods": ["Luxury Goods"],
            "modifier": 0.4,  # 60% price reduction
            "duration": random.randint(20, 30),
            "day_started": game.current_day
        }
        
        # Update all systems
        for system in game.galaxy.systems.values():
            if "Luxury Goods" in system.market:
                system.market["Luxury Goods"]["price"] = int(
                    system.market["Luxury Goods"]["price"] * 0.4
                )
                
        print("Luxury goods prices have crashed galaxy-wide!")
        print("This might be a good time to buy low...")
        
        return True


class PirateBlockadeEvent(Event):
    """Pirates blockade a system, affecting all trade."""
    
    def _execute(self, game: 'Game', context: dict) -> bool:
        """Execute pirate blockade event."""
        system = game.player.location
        
        # Don't blockade Sol or major faction capitals
        if system.name in ["Sol", "New Moscow", "Freeport"]:
            return False
            
        # Check if there's already an event in this system
        if system.name in game.galaxy.active_events:
            return False
            
        print(f"\nDANGER: Pirates have blockaded {system.name}!")
        print("All trade is risky - prices are unstable.")
        
        # Create the blockade event
        game.galaxy.active_events[system.name] = {
            "type": "pirate_blockade",
            "danger_level": random.uniform(0.3, 0.7),
            "duration": random.randint(5, 10),
            "day_started": game.current_day
        }
        
        # Affect all prices randomly
        for good in system.market:
            # Prices become volatile
            modifier = random.uniform(0.7, 2.0)
            system.market[good]["price"] = int(system.market[good]["price"] * modifier)
            # Quantities reduced
            system.market[good]["quantity"] = max(1, int(system.market[good]["quantity"] * 0.5))
            
        print("Market prices are fluctuating wildly!")
        print("There's also increased danger of pirate attacks.")
        
        return True


def register_economic_events(registry: EventRegistry) -> None:
    """Register all economic events with the event registry.
    
    Args:
        registry: The event registry to register events with
    """
    # Famine
    famine_config = EventConfig(
        id="famine",
        name="System Famine",
        description="Crop failures lead to food shortage!",
        event_type=EventType.ECONOMIC,
        trigger=EventTrigger.RANDOM,
        base_chance=0.05,
        weight=8,
        cooldown=20
    )
    registry.register(FamineEvent(famine_config))
    
    # Mining strike
    strike_config = EventConfig(
        id="mining_strike",
        name="Mining Strike",
        description="Labor disputes halt mineral production!",
        event_type=EventType.ECONOMIC,
        trigger=EventTrigger.RANDOM,
        base_chance=0.04,
        requirements={
            "economy_type": ["Mining"]
        },
        weight=6,
        cooldown=15
    )
    registry.register(MiningStrikeEvent(strike_config))
    
    # Bountiful harvest
    harvest_config = EventConfig(
        id="bountiful_harvest",
        name="Bountiful Harvest",
        description="Perfect conditions create food surplus!",
        event_type=EventType.ECONOMIC,
        trigger=EventTrigger.RANDOM,
        base_chance=0.04,
        requirements={
            "economy_type": ["Agricultural"]
        },
        weight=6,
        cooldown=15
    )
    registry.register(BountifulHarvestEvent(harvest_config))
    
    # Tech boom
    tech_boom_config = EventConfig(
        id="tech_boom",
        name="Technology Boom",
        description="Innovation drives down electronics prices!",
        event_type=EventType.ECONOMIC,
        trigger=EventTrigger.RANDOM,
        base_chance=0.03,
        requirements={
            "economy_type": ["Tech"]
        },
        weight=5,
        cooldown=20
    )
    registry.register(TechBoomEvent(tech_boom_config))
    
    # Trade embargo (galactic)
    embargo_config = EventConfig(
        id="trade_embargo",
        name="Trade Embargo",
        description="Political tensions affect trade!",
        event_type=EventType.DIPLOMATIC,
        trigger=EventTrigger.SCHEDULED,
        base_chance=0.02,
        weight=3,
        cooldown=50,
        max_occurrences=5
    )
    registry.register(TradeEmbargoEvent(embargo_config))
    
    # Market crash (galactic)
    crash_config = EventConfig(
        id="market_crash",
        name="Market Crash",
        description="Economic crisis hits the galaxy!",
        event_type=EventType.ECONOMIC,
        trigger=EventTrigger.SCHEDULED,
        base_chance=0.01,
        weight=2,
        cooldown=100,
        max_occurrences=3
    )
    registry.register(MarketCrashEvent(crash_config))
    
    # Pirate blockade
    blockade_config = EventConfig(
        id="pirate_blockade",
        name="Pirate Blockade",
        description="Pirates control system trade routes!",
        event_type=EventType.COMBAT,
        trigger=EventTrigger.RANDOM,
        base_chance=0.03,
        weight=4,
        cooldown=10
    )
    registry.register(PirateBlockadeEvent(blockade_config))
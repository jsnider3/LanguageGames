"""
Centralized event system with registry for Star Trader.

This module provides a flexible event system that allows registering
different types of events (travel, exploration, combat, economic) and
handles their execution with proper context and conditions.
"""

import random
from typing import Dict, List, Callable, Optional, Any, TYPE_CHECKING
from dataclasses import dataclass
from enum import Enum

if TYPE_CHECKING:
    from .main import Game


class EventType(Enum):
    """Types of events that can occur in the game."""
    TRAVEL = "travel"
    EXPLORATION = "exploration"
    ECONOMIC = "economic"
    COMBAT = "combat"
    DIPLOMATIC = "diplomatic"
    DISCOVERY = "discovery"
    SYSTEM = "system"


class EventTrigger(Enum):
    """When events can be triggered."""
    ON_TRAVEL = "on_travel"
    ON_EXPLORE = "on_explore"
    ON_TRADE = "on_trade"
    RANDOM = "random"
    SCHEDULED = "scheduled"
    CONDITIONAL = "conditional"


@dataclass
class EventConfig:
    """Configuration for an event."""
    id: str
    name: str
    description: str
    event_type: EventType
    trigger: EventTrigger
    base_chance: float = 0.1
    requirements: Optional[Dict[str, Any]] = None
    weight: int = 10
    cooldown: int = 0
    max_occurrences: Optional[int] = None


class Event:
    """Base class for all game events."""
    
    def __init__(self, config: EventConfig):
        """Initialize the event with its configuration.
        
        Args:
            config: Event configuration
        """
        self.config = config
        self.occurrences = 0
        self.last_triggered_day = -999
    
    def can_trigger(self, game: 'Game', context: Dict[str, Any]) -> bool:
        """Check if this event can trigger given the current context.
        
        Args:
            game: The game instance
            context: Current game context
            
        Returns:
            True if the event can trigger
        """
        # Check cooldown
        if game.current_day - self.last_triggered_day < self.config.cooldown:
            return False
            
        # Check max occurrences
        if (self.config.max_occurrences is not None and 
            self.occurrences >= self.config.max_occurrences):
            return False
            
        # Check requirements
        if self.config.requirements:
            return self._check_requirements(game, context)
            
        return True
    
    def _check_requirements(self, game: 'Game', context: Dict[str, Any]) -> bool:
        """Check if event requirements are met.
        
        Args:
            game: The game instance
            context: Current game context
            
        Returns:
            True if all requirements are met
        """
        reqs = self.config.requirements
        
        # Check location requirements
        if "location" in reqs:
            if game.player.location.name not in reqs["location"]:
                return False
                
        if "faction" in reqs:
            if game.player.location.faction not in reqs["faction"]:
                return False
                
        if "economy_type" in reqs:
            if game.player.location.economy_type not in reqs["economy_type"]:
                return False
        
        # Check player requirements
        if "min_credits" in reqs:
            if game.player.credits < reqs["min_credits"]:
                return False
                
        if "min_reputation" in reqs:
            for faction, min_rep in reqs["min_reputation"].items():
                if game.player.reputation.get(faction, 0) < min_rep:
                    return False
                    
        if "min_wanted_level" in reqs:
            if game.player.get_total_wanted_level() < reqs["min_wanted_level"]:
                return False
                
        if "has_cargo" in reqs:
            for cargo in reqs["has_cargo"]:
                if cargo not in game.player.ship.cargo_hold:
                    return False
                    
        if "ship_class" in reqs:
            if game.player.ship.ship_class not in reqs["ship_class"]:
                return False
        
        # Check context requirements
        if "context" in reqs:
            for key, value in reqs["context"].items():
                if context.get(key) != value:
                    return False
                    
        return True
    
    def get_chance(self, game: 'Game', context: Dict[str, Any]) -> float:
        """Calculate the chance of this event triggering.
        
        Args:
            game: The game instance
            context: Current game context
            
        Returns:
            Probability between 0 and 1
        """
        chance = self.config.base_chance
        
        # Modify based on context
        if context.get("event_type") == "exploration":
            # Explorer ships more likely to trigger exploration events
            if game.player.ship.specialization == "exploration":
                chance *= 1.5
                
        # Modify based on skills
        if self.config.event_type == EventType.COMBAT:
            # High combat skill reduces combat events
            combat_bonus = game.player.ship.experience.get("combat", 0) / 100
            chance *= max(0.5, 1 - combat_bonus * 0.3)
            
        return min(1.0, chance)
    
    def trigger(self, game: 'Game', context: Dict[str, Any]) -> bool:
        """Execute the event.
        
        Args:
            game: The game instance
            context: Current game context
            
        Returns:
            True if the event was handled successfully
        """
        self.occurrences += 1
        self.last_triggered_day = game.current_day
        
        print(f"\n--- {self.config.name.upper()} ---")
        print(self.config.description)
        
        # Subclasses should override this
        return self._execute(game, context)
    
    def _execute(self, game: 'Game', context: Dict[str, Any]) -> bool:
        """Execute the event logic. Override in subclasses.
        
        Args:
            game: The game instance
            context: Current game context
            
        Returns:
            True if the event was handled successfully
        """
        raise NotImplementedError("Subclasses must implement _execute")


class EventRegistry:
    """Central registry for all game events."""
    
    def __init__(self):
        """Initialize the event registry."""
        self.events: Dict[str, Event] = {}
        self.events_by_trigger: Dict[EventTrigger, List[Event]] = {
            trigger: [] for trigger in EventTrigger
        }
        self.events_by_type: Dict[EventType, List[Event]] = {
            event_type: [] for event_type in EventType
        }
    
    def register(self, event: Event) -> None:
        """Register an event in the system.
        
        Args:
            event: The event to register
        """
        self.events[event.config.id] = event
        self.events_by_trigger[event.config.trigger].append(event)
        self.events_by_type[event.config.event_type].append(event)
    
    def unregister(self, event_id: str) -> None:
        """Remove an event from the registry.
        
        Args:
            event_id: ID of the event to remove
        """
        if event_id in self.events:
            event = self.events[event_id]
            del self.events[event_id]
            
            # Remove from trigger list
            if event in self.events_by_trigger[event.config.trigger]:
                self.events_by_trigger[event.config.trigger].remove(event)
                
            # Remove from type list
            if event in self.events_by_type[event.config.event_type]:
                self.events_by_type[event.config.event_type].remove(event)
    
    def get_eligible_events(self, game: 'Game', trigger: EventTrigger, 
                          context: Dict[str, Any]) -> List[Event]:
        """Get all events that can trigger in the current context.
        
        Args:
            game: The game instance
            trigger: The trigger type
            context: Current game context
            
        Returns:
            List of eligible events
        """
        eligible = []
        
        for event in self.events_by_trigger[trigger]:
            if event.can_trigger(game, context):
                eligible.append(event)
                
        return eligible
    
    def trigger_random_event(self, game: 'Game', trigger: EventTrigger,
                           context: Optional[Dict[str, Any]] = None) -> bool:
        """Attempt to trigger a random event.
        
        Args:
            game: The game instance
            trigger: The trigger type
            context: Current game context
            
        Returns:
            True if an event was triggered
        """
        if context is None:
            context = {}
            
        # Get eligible events
        eligible = self.get_eligible_events(game, trigger, context)
        if not eligible:
            return False
            
        # Calculate weights based on chance and configured weight
        weights = []
        for event in eligible:
            chance = event.get_chance(game, context)
            weights.append(chance * event.config.weight)
            
        # Select event based on weights
        if sum(weights) == 0:
            return False
            
        selected = random.choices(eligible, weights=weights)[0]
        
        # Check if event actually triggers based on its chance
        if random.random() < selected.get_chance(game, context):
            return selected.trigger(game, context)
            
        return False
    
    def trigger_specific_event(self, game: 'Game', event_id: str,
                             context: Optional[Dict[str, Any]] = None) -> bool:
        """Trigger a specific event by ID.
        
        Args:
            game: The game instance
            event_id: ID of the event to trigger
            context: Current game context
            
        Returns:
            True if the event was triggered
        """
        if context is None:
            context = {}
            
        if event_id not in self.events:
            return False
            
        event = self.events[event_id]
        if event.can_trigger(game, context):
            return event.trigger(game, context)
            
        return False
    
    def get_all_events(self) -> List[Event]:
        """Get all registered events.
        
        Returns:
            List of all events
        """
        return list(self.events.values())
    
    def get_event_stats(self) -> Dict[str, Any]:
        """Get statistics about registered events.
        
        Returns:
            Dictionary with event statistics
        """
        stats = {
            "total_events": len(self.events),
            "by_type": {},
            "by_trigger": {},
            "total_occurrences": 0
        }
        
        for event_type in EventType:
            stats["by_type"][event_type.value] = len(self.events_by_type[event_type])
            
        for trigger in EventTrigger:
            stats["by_trigger"][trigger.value] = len(self.events_by_trigger[trigger])
            
        for event in self.events.values():
            stats["total_occurrences"] += event.occurrences
            
        return stats


class EventManager:
    """Manages the event system for the game."""
    
    def __init__(self, game: 'Game'):
        """Initialize the event manager.
        
        Args:
            game: The game instance
        """
        self.game = game
        self.registry = EventRegistry()
        self._initialize_events()
    
    def _initialize_events(self) -> None:
        """Initialize and register all game events."""
        # Import event implementations here to avoid circular imports
        from .events.travel_events import register_travel_events
        from .events.exploration_events import register_exploration_events
        from .events.economic_events import register_economic_events
        from .events.combat_events import register_combat_events
        
        # Register all event types
        register_travel_events(self.registry)
        register_exploration_events(self.registry)
        register_economic_events(self.registry)
        register_combat_events(self.registry)
    
    def on_travel(self) -> None:
        """Called when the player travels between systems."""
        context = {
            "from_system": self.game.player.last_location,
            "to_system": self.game.player.location,
            "ship": self.game.player.ship
        }
        
        self.registry.trigger_random_event(self.game, EventTrigger.ON_TRAVEL, context)
    
    def on_explore(self) -> None:
        """Called when the player explores space."""
        context = {
            "system": self.game.player.location,
            "ship": self.game.player.ship,
            "event_type": "exploration"
        }
        
        self.registry.trigger_random_event(self.game, EventTrigger.ON_EXPLORE, context)
    
    def on_trade(self, trade_type: str, good: str, quantity: int, value: int) -> None:
        """Called when the player makes a trade.
        
        Args:
            trade_type: "buy" or "sell"
            good: The good being traded
            quantity: Amount traded
            value: Total value of the trade
        """
        context = {
            "system": self.game.player.location,
            "trade_type": trade_type,
            "good": good,
            "quantity": quantity,
            "value": value
        }
        
        self.registry.trigger_random_event(self.game, EventTrigger.ON_TRADE, context)
    
    def check_scheduled_events(self) -> None:
        """Check for any scheduled events that should trigger."""
        context = {
            "day": self.game.current_day,
            "system": self.game.player.location
        }
        
        # Get all scheduled events
        for event in self.registry.events_by_trigger[EventTrigger.SCHEDULED]:
            if event.can_trigger(self.game, context):
                # Check if this event is scheduled for today
                if hasattr(event, 'scheduled_day') and event.scheduled_day == self.game.current_day:
                    event.trigger(self.game, context)
    
    def trigger_event(self, event_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> bool:
        """Trigger an event - supports both old and new API.
        
        Args:
            event_id: ID of the event to trigger (None for random event)
            context: Optional context for the event
            
        Returns:
            True if the event was triggered
        """
        if event_id is None:
            # Old API compatibility - trigger a random travel event
            return self.registry.trigger_random_event(self.game, EventTrigger.ON_TRAVEL, context or {})
        else:
            # New API - trigger specific event
            return self.registry.trigger_specific_event(self.game, event_id, context)
    
    def get_economy_modifiers(self, good_name: str) -> Dict[str, float]:
        """Get economy-based price modifiers for a good.
        
        This method is kept for backward compatibility but could be
        moved to a dedicated economy system.
        
        Args:
            good_name: Name of the good
            
        Returns:
            Dictionary of economy type to price modifier
        """
        # Default modifiers based on economy type
        modifiers = {
            "Agricultural": 1.0,
            "Industrial": 1.0,
            "Tech": 1.0,
            "Mining": 1.0,
            "Research": 1.0,
            "Military": 1.0,
            "Trade Hub": 1.0,
            "Frontier": 1.0,
            "Balanced": 1.0
        }
        
        # Apply specific modifiers based on good type
        if good_name == "Food":
            modifiers["Agricultural"] = 0.5
            modifiers["Industrial"] = 2.0
            modifiers["Mining"] = 1.5
            modifiers["Military"] = 1.8
        elif good_name == "Minerals":
            modifiers["Mining"] = 0.6
            modifiers["Industrial"] = 1.2
            modifiers["Tech"] = 1.3
        elif good_name == "Machinery":
            modifiers["Industrial"] = 0.7
            modifiers["Agricultural"] = 1.8
            modifiers["Frontier"] = 2.0
        elif good_name == "Electronics":
            modifiers["Tech"] = 0.6
            modifiers["Industrial"] = 1.0
            modifiers["Agricultural"] = 1.6
            modifiers["Frontier"] = 1.8
        elif good_name == "Luxury Goods":
            modifiers["Balanced"] = 0.8
            modifiers["Industrial"] = 1.4
            modifiers["Mining"] = 1.6
            modifiers["Military"] = 1.3
        elif good_name == "Medicine":
            modifiers["Research"] = 0.7
            modifiers["Agricultural"] = 1.5
            modifiers["Mining"] = 1.8
            modifiers["Frontier"] = 2.2
        
        return modifiers
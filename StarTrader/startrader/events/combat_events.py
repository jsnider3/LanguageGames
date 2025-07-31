"""
Combat-related events for Star Trader.

Combat events are primarily handled in travel_events.py (pirates, bounty hunters).
This module is reserved for future combat-specific events.
"""

from typing import TYPE_CHECKING
from ..event_system import EventRegistry

if TYPE_CHECKING:
    from ..main import Game


def register_combat_events(registry: EventRegistry) -> None:
    """Register all combat events with the event registry.
    
    Args:
        registry: The event registry to register events with
    """
    # Combat events like pirate encounters and bounty hunters are
    # currently registered in travel_events.py
    # 
    # This module is reserved for future combat-specific events such as:
    # - Military patrols
    # - Faction warfare
    # - Mercenary contracts
    # - Space battles
    # - Boarding attempts
    pass
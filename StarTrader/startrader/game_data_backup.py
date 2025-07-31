"""
Game data imports for Star Trader.

This module provides backward compatibility by importing from the reorganized data modules.
Over time, modules should import directly from the data submodules instead of this file.
"""

# Import from reorganized data modules
from .data.ships import SHIP_CLASSES, MODULE_SPECS, OLD_MODULE_SPECS
from .data.goods import GOODS, ILLEGAL_GOODS, PRODUCTION_RECIPES
from .data.factions import FACTIONS, FACTION_RANKS, RANK_BENEFITS
from .data.crew import CREW_RECRUITS, AI_CAPTAIN_NAMES, CREW_ROLES, AI_CAPTAIN_LEVELS
from .data.generation import (
    SYSTEM_NAME_PARTS, PIRATE_NAMES, GALACTIC_EVENTS, TECH_TYPES,
    ECONOMY_TYPES, SYSTEM_DESCRIPTIONS, UNCHARTED_SYSTEM_TYPES, UNCHARTED_DESCRIPTIONS
)

# Re-export everything for backward compatibility
__all__ = [
    # Ships
    'SHIP_CLASSES', 'MODULE_SPECS', 'OLD_MODULE_SPECS',
    
    # Goods
    'GOODS', 'ILLEGAL_GOODS', 'PRODUCTION_RECIPES',
    
    # Factions
    'FACTIONS', 'FACTION_RANKS', 'RANK_BENEFITS',
    
    # Crew
    'CREW_RECRUITS', 'AI_CAPTAIN_NAMES', 'CREW_ROLES', 'AI_CAPTAIN_LEVELS',
    
    # Generation
    'SYSTEM_NAME_PARTS', 'PIRATE_NAMES', 'GALACTIC_EVENTS', 'TECH_TYPES',
    'ECONOMY_TYPES', 'SYSTEM_DESCRIPTIONS', 'UNCHARTED_SYSTEM_TYPES', 'UNCHARTED_DESCRIPTIONS'
]
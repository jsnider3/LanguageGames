"""
Game balance constants for Star Trader.

This file contains all the magic numbers and balance constants used throughout the game.
Keeping them in one place makes it easier to adjust game balance and understand the design.
"""

# Trading Constants
TRADING_SHIP_BONUS_PER_LEVEL = 0.05  # 5% bonus per ship level for trading specialization
NEGOTIATION_SKILL_MULTIPLIER = 0.01  # 1% bonus per skill point
REPUTATION_DISCOUNT_THRESHOLD = 50   # Reputation needed for discounts
REPUTATION_PENALTY_THRESHOLD = -25   # Reputation below which penalties apply
REPUTATION_PENALTY_MULTIPLIER = 0.2  # 20% price penalty for bad reputation

# Combat Constants
BOARDING_HULL_THRESHOLD = 0.3        # Can board ships below 30% hull
BOARDING_BASE_CHANCE = 0.6           # 60% base chance to succeed at boarding
BOARDING_MORALE_EFFECT = 0.3         # Morale affects boarding success by up to 30%
BOARDING_LEADERSHIP_EFFECT = 0.2     # Leadership skill affects boarding by up to 20%
FLEE_BASE_CHANCE = 0.5               # 50% base chance to flee combat
FLEE_PILOTING_MULTIPLIER = 0.5       # Piloting skill can add up to 50% to flee chance

# Event Constants  
PIRATE_FLEE_BASE_CHANCE = 0.5        # Base chance to flee pirate encounter
PIRATE_FLEE_EXPLORATION_BONUS = 0.1  # Exploration ship flee bonus
PIRATE_NEGOTIATE_BASE_CHANCE = 0.4   # Base chance to negotiate with pirates
PIRATE_NEGOTIATE_CREW_BONUS = 0.2    # Negotiator crew member bonus
CUSTOMS_SCAN_BASE_CHANCE = 0.3       # Base chance for customs scan
CUSTOMS_DIPLOMATIC_IMMUNITY = 0.05   # Scan chance with diplomatic immunity
CUSTOMS_BAD_REP_MULTIPLIER = 2.5     # Scan chance multiplier for bad reputation
CUSTOMS_NEGATIVE_REP_MULTIPLIER = 2.0 # Scan chance multiplier for negative reputation
CUSTOMS_BRIBE_PERCENTAGE = 0.3       # Bribe amount as percentage of fine
CUSTOMS_BRIBE_SUCCESS_CHANCE = 0.7   # Base chance for bribe to succeed

# Ship Constants
SHIELD_ABSORPTION = 1.0              # Shields absorb 100% of damage until depleted
REPAIR_COST_PER_HP = 15             # Cost to repair 1 hull point
FUEL_COST_PER_UNIT = 10             # Cost to buy 1 fuel unit
FUEL_TRAVEL_MULTIPLIER = 5          # Fuel cost = distance * this multiplier

# Crew Constants
DEFAULT_CREW_MORALE = 75            # Starting morale for new crew
MORALE_DECAY_PER_DAY = 2           # Daily morale loss from space travel
MORALE_PAY_BONUS = 5               # Morale boost for paying on time
CREW_EXPERIENCE_MULTIPLIER = 0.01   # 1% bonus per experience point

# Mission Constants
MISSION_TIME_LIMIT_BASE = 10        # Base days for mission time limits
MISSION_TIME_LIMIT_VARIANCE = 15    # Additional random days (0-15)
MISSION_FAILURE_REP_LOSS = -10      # Reputation loss for failing a mission
MAX_MISSIONS_PER_SYSTEM = 5         # Maximum concurrent missions per system

# Market Constants
MARKET_DRIFT_FACTOR = 4             # How quickly prices drift to equilibrium
PRICE_IMPACT_FACTOR = 0.05          # How much buying affects price (5%)
QUANTITY_IMPACT_DIVISOR = 50        # Divisor for quantity impact on price
EVENT_CHANCE = 0.25                 # 25% chance for random events during travel

# Galaxy Generation Constants
GALAXY_WIDTH = 10                   # Width of the galaxy grid
GALAXY_HEIGHT = 10                  # Height of the galaxy grid
SAVE_FILE_NAME = "savegame.json"    # Default save file name

# Victory Conditions
VICTORY_WEALTH_GOAL = 1000000       # Credits needed for economic victory
VICTORY_FLEET_GOAL = 5              # Ships needed for trade empire victory
VICTORY_FACTORY_GOAL = 3            # Factories needed for trade empire victory
VICTORY_REPUTATION_GOAL = 200       # Reputation needed with faction for political victory
VICTORY_CREW_GOAL = 5               # Crew members needed for personal victory
VICTORY_CREW_EXP_GOAL = 50          # Total crew experience for personal victory

# Exploration Constants
EXPLORATION_FUEL_COST = 20          # Fuel cost to explore deep space
EXPLORATION_BASE_DISCOVERY_CHANCE = 0.3  # 30% base chance to find uncharted system
SCAN_TIME_COST = 1                  # Days consumed by scanning
ARTIFACT_SEARCH_DANGER = 0.3        # 30% chance of danger when searching artifacts

# Production Constants
PRODUCTION_COST_PERCENTAGE = 0.1    # Production costs 10% of output value

# Factory Constants
FACTORY_BUILD_COST_BASE = 10000     # Base cost to build a factory
FACTORY_DAILY_COST_MULTIPLIER = 50  # Daily operating cost = level * this
FACTORY_EFFICIENCY_PER_LEVEL = 0.2  # 20% efficiency boost per level
FACTORY_MANAGER_COST = 5000         # Cost to hire a factory manager

# AI Captain Constants
AI_CAPTAIN_HIRE_COST = 5000         # Base cost to hire an AI captain
AI_CAPTAIN_DAILY_WAGE = {
    "novice": 50,
    "experienced": 100,
    "veteran": 200
}
AI_CAPTAIN_PROFIT_MARGIN = {
    "aggressive": 0.15,     # 15% profit margin
    "conservative": 0.3,    # 30% profit margin
    "balanced": 0.2         # 20% profit margin
}

# Rank Benefits
RANK_BENEFITS = {
    "price_discount": {
        "Ensign": 0.05,      # 5% discount
        "Lieutenant": 0.1,    # 10% discount
        "Commander": 0.15,    # 15% discount
        "Captain": 0.2,       # 20% discount
        "Admiral": 0.25       # 25% discount
    },
    "fuel_discount": {
        "Lieutenant": 0.1,    # 10% discount
        "Commander": 0.15,    # 15% discount
        "Captain": 0.2,       # 20% discount
        "Admiral": 0.3        # 30% discount
    }
}
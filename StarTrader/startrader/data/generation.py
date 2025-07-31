"""
Procedural generation data for Star Trader.

Contains data used for generating galaxy content.
"""

# System name generation parts
SYSTEM_NAME_PARTS = {
    "part1": ["Sol", "Alpha", "Beta", "Sirius", "Vega", "Orion", "Cygnus", "Proxima", "Kepler"],
    "part2": ["Centauri", "Majoris", "Minoris", "Prime", "Secundus", "Tertius", "IV", "IX", "X"],
    "part3": ["Nebula", "Cluster", "Expanse", "Reach", "Void", "Core", "Rim", "Drift"]
}

# Pirate name pool
PIRATE_NAMES = ["Blackheart", "Red-Eye", "Iron-Fist", "One-Leg", "Mad-Dog"]

# Galactic event templates
GALACTIC_EVENTS = {
    "faction_war": {
        "name": "Faction War",
        "duration": 20,
        "description": "War has broken out between {faction1} and {faction2}! Trade routes are disrupted.",
        "effects": {"trade_penalty": 0.2, "reputation_change": -10}
    },
    "tech_breakthrough": {
        "name": "Technology Breakthrough", 
        "duration": 15,
        "description": "Scientists in {system} have made a breakthrough in {tech_type} technology!",
        "effects": {"price_change": -0.3}
    },
    "trade_boom": {
        "name": "Trade Boom",
        "duration": 10,
        "description": "A new trade agreement has boosted commerce in {faction} space!",
        "effects": {"trade_bonus": 0.2}
    },
    "plague": {
        "name": "Space Plague",
        "duration": 15,
        "description": "A mysterious plague is spreading through {system}! Medicine prices skyrocket.",
        "effects": {"medicine_multiplier": 5.0}
    }
}

# Technology types for events
TECH_TYPES = ["warp drive", "shield", "medical", "agricultural", "mining"]

# System economy types
ECONOMY_TYPES = [
    "Agricultural",
    "Industrial", 
    "Tech",
    "Mining",
    "Research",
    "Military",
    "Trade Hub",
    "Frontier",
    "Balanced"
]

# System descriptions by economy type
SYSTEM_DESCRIPTIONS = {
    "Agricultural": [
        "Vast farmlands stretch across the planet's surface.",
        "Hydroponic farms orbit the main planet.",
        "Known for its fertile soil and perfect climate."
    ],
    "Industrial": [
        "Massive factories dominate the landscape.",
        "Heavy industry and manufacturing centers.",
        "The air is thick with the smoke of progress."
    ],
    "Tech": [
        "Gleaming research facilities and tech labs.",
        "Home to cutting-edge technology development.",
        "Silicon valleys and quantum computing centers."
    ],
    "Mining": [
        "Rich mineral deposits throughout the system.",
        "Asteroid mining operations run continuously.",
        "Deep core drilling platforms extract rare metals."
    ],
    "Research": [
        "Universities and laboratories fill the colonies.",
        "Scientific breakthroughs happen regularly here.",
        "Knowledge is the primary export."
    ],
    "Military": [
        "Military bases and shipyards dominate the system.",
        "Training grounds for the faction's forces.",
        "Heavily fortified and well-defended."
    ],
    "Trade Hub": [
        "A bustling center of commerce and trade.",
        "Merchants from across the galaxy gather here.",
        "Warehouses and markets as far as the eye can see."
    ],
    "Frontier": [
        "A wild and untamed system on the edge of space.",
        "Settlers struggle to build a new life here.",
        "Law and order are more suggestions than rules."
    ],
    "Balanced": [
        "A well-rounded economy with diverse industries.",
        "Something for everyone in this system.",
        "A model of economic stability."
    ]
}

# Special uncharted system types
UNCHARTED_SYSTEM_TYPES = [
    "ancient_ruins",
    "derelict_fleet",
    "resource_rich",
    "pirate_haven",
    "anomaly",
    "pristine"
]

# Uncharted system descriptions
UNCHARTED_DESCRIPTIONS = {
    "ancient_ruins": "Mysterious structures of alien origin dot the planets.",
    "derelict_fleet": "The wreckage of an ancient battle drifts in space.",
    "resource_rich": "Untapped resources await exploitation.",
    "pirate_haven": "A hidden base for outlaws and smugglers.",
    "anomaly": "Strange energy readings defy explanation.",
    "pristine": "An untouched system of breathtaking beauty."
}
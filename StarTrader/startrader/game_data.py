# --- Game Balance Constants ---
REPAIR_COST_PER_HP = 15
FUEL_COST_PER_UNIT = 10
EVENT_CHANCE = 0.25
MARKET_DRIFT_FACTOR = 4
REPUTATION_DISCOUNT_THRESHOLD = 50
PRICE_IMPACT_FACTOR = 0.05
QUANTITY_IMPACT_DIVISOR = 50
MAX_MISSIONS_PER_SYSTEM = 5
SAVE_FILE_NAME = "savegame.json"
GALAXY_WIDTH = 10
GALAXY_HEIGHT = 10

# --- Procedural Generation Data ---
SYSTEM_NAME_PARTS = {
    "part1": ["Sol", "Alpha", "Beta", "Sirius", "Vega", "Orion", "Cygnus", "Proxima", "Kepler"],
    "part2": ["Centauri", "Majoris", "Minoris", "Prime", "Secundus", "Tertius", "IV", "IX", "X"],
    "part3": ["Nebula", "Cluster", "Expanse", "Reach", "Void", "Core", "Rim", "Drift"]
}

PIRATE_NAMES = ["Blackheart", "Red-Eye", "Iron-Fist", "One-Leg", "Mad-Dog"]

CREW_RECRUITS = [
    {"name": "Jax", "role": "Weapons Officer", "skill_bonus": 5, "salary": 100, "description": "A former navy gunner. Increases weapon damage."},
    {"name": "Sparks", "role": "Engineer", "skill_bonus": 0.05, "salary": 120, "description": "A grease-stained genius. Improves fuel efficiency."},
    {"name": "Slick", "role": "Negotiator", "skill_bonus": 0.1, "salary": 80, "description": "A smooth talker. Gets better prices at the market."},
]

# --- Data ---

SHIP_CLASSES = {
    "starter_ship": {
        "name": "Stardust Drifter",
        "base_hull": 100,
        "base_fuel": 50,
        "crew_quarters": 2,
        "slots": {
            "weapon": 1,
            "shield": 1,
            "engine": 1,
            "cargo_hold": 2,
        }
    }
}

MODULE_SPECS = {
    "cargo_hold": {
        "CH-1": {"name": "Standard Cargo Hold", "cost": 0, "capacity": 20},
        "CH-2": {"name": "Expanded Cargo Hold", "cost": 2500, "capacity": 50},
        "CH-3": {"name": "Large Cargo Bay", "cost": 6000, "capacity": 100},
    },
    "engine": {
        "E-1": {"name": "Basic Engine", "cost": 0, "fuel_efficiency": 1.0},
        "E-2": {"name": "Ion Drive", "cost": 4000, "fuel_efficiency": 0.8},
    },
    "weapon": {
        "W-1": {"name": "Pulse Laser", "cost": 1000, "damage": 10},
        "W-2": {"name": "Heavy Laser", "cost": 3500, "damage": 25},
    },
    "shield": {
        "S-1": {"name": "Basic Shield", "cost": 1500, "strength": 50},
        "S-2": {"name": "Deflector Shield", "cost": 4000, "strength": 100},
    }
}

GOODS = {
    "Food": {"base_price": 20},
    "Medicine": {"base_price": 50},
    "Machinery": {"base_price": 100},
    "Minerals": {"base_price": 80},
    "Luxury Goods": {"base_price": 200}
}

ILLEGAL_GOODS = {
    "Cybernetics": {"base_price": 500},
    "Illegal Arms": {"base_price": 800},
    "Xeno-Artifacts": {"base_price": 1200}
}

FACTIONS = {
    "Federation": {"name": "Terran Federation", "home_system": "Sol"},
    "Syndicate": {"name": "Orion Syndicate", "home_system": "Sirius"},
    "Independent": {"name": "Independent Systems", "home_system": None}
}

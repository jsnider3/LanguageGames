"""
Ship and module data for Star Trader.

Contains all ship classes and module specifications.
"""

# Ship class definitions
SHIP_CLASSES = {
    "starter_ship": {
        "name": "Rust Bucket",
        "cost": 0,
        "base_hull": 100,
        "base_fuel": 50, 
        "base_cargo": 50,
        "crew_quarters": 2,
        "slots": {
            "weapon": 1,
            "shield": 1,
            "engine": 1,
            "cargo": 2
        }
    },
    "freighter": {
        "name": "Heavy Freighter",
        "cost": 50000,
        "base_hull": 150,
        "base_fuel": 40,
        "base_cargo": 200,
        "crew_quarters": 4,
        "slots": {
            "weapon": 1,
            "shield": 2,
            "engine": 2,
            "cargo": 4
        }
    },
    "fighter": {
        "name": "Strike Fighter",
        "cost": 75000,
        "base_hull": 120,
        "base_fuel": 60,
        "base_cargo": 30,
        "crew_quarters": 3,
        "slots": {
            "weapon": 3,
            "shield": 2,
            "engine": 3,
            "cargo": 1
        }
    },
    "explorer": {
        "name": "Deep Space Explorer",
        "cost": 100000,
        "base_hull": 140,
        "base_fuel": 100,
        "base_cargo": 75,
        "crew_quarters": 5,
        "slots": {
            "weapon": 2,
            "shield": 2,
            "engine": 3,
            "cargo": 3
        }
    }
}

# Legacy module format (for backward compatibility)
OLD_MODULE_SPECS = {
    "Cargo Expansion": {"price": 5000, "type": "cargo", "effect": "Increases cargo capacity by 20"},
    "Shield Generator": {"price": 10000, "type": "shield", "effect": "Adds 10 shields"},
    "Fuel Tanks": {"price": 3000, "type": "engine", "effect": "Increases fuel capacity by 5"},
    "Weapon Systems": {"price": 15000, "type": "weapon", "effect": "Increases weapon damage by 10"},
    "Engine Upgrade": {"price": 8000, "type": "engine", "effect": "Improves evasion by 5"},
    "Medical Bay": {"price": 12000, "type": "cargo", "effect": "Improves crew health"},
    "Mining Laser": {"price": 7000, "type": "weapon", "effect": "Allows asteroid mining"},
    "Scanner Array": {"price": 6000, "type": "shield", "effect": "Improves exploration discovery"},
    "Stealth System": {"price": 20000, "type": "engine", "effect": "Reduces encounter chance"},
    "Tractor Beam": {"price": 9000, "type": "weapon", "effect": "Improves salvage operations"}
}

# Current module format
MODULE_SPECS = {
    "Cargo Expansion": {
        "price": 5000,
        "type": "cargo",
        "effect": "Increases cargo capacity by 20",
        "stats": {"cargo_capacity": 20}
    },
    "Shield Generator": {
        "price": 10000,
        "type": "shield", 
        "effect": "Adds 10 shield points",
        "stats": {"shields": 10}
    },
    "Fuel Tanks": {
        "price": 3000,
        "type": "engine",
        "effect": "Increases fuel capacity by 5",
        "stats": {"fuel_capacity": 5}
    },
    "Weapon Systems": {
        "price": 15000,
        "type": "weapon",
        "effect": "Increases weapon damage by 10",
        "stats": {"weapon_damage": 10}
    },
    "Engine Upgrade": {
        "price": 8000,
        "type": "engine",
        "effect": "Improves evasion by 5",
        "stats": {"evasion": 5}
    }
}
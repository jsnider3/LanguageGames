"""
Faction data for Star Trader.

Contains faction definitions and rank progressions.
"""

# Major faction definitions
FACTIONS = {
    "Federation": {"name": "Galactic Federation", "type": "government"},
    "Syndicate": {"name": "The Syndicate", "type": "criminal"},
    "Independent": {"name": "Independent Colonies", "type": "neutral"},
    "Rebels": {"name": "Rebel Alliance", "type": "revolutionary"},
    "Corporation": {"name": "MegaCorp Consortium", "type": "corporate"}
}

# Faction rank progressions
FACTION_RANKS = {
    "Federation": [
        {"rank": "Civilian", "min_rep": -999, "title": "Civilian"},
        {"rank": "Recruit", "min_rep": 10, "title": "Federation Recruit"},
        {"rank": "Ensign", "min_rep": 50, "title": "Federation Ensign"},
        {"rank": "Lieutenant", "min_rep": 100, "title": "Federation Lieutenant"},
        {"rank": "Commander", "min_rep": 150, "title": "Federation Commander"},
        {"rank": "Captain", "min_rep": 200, "title": "Federation Captain"},
        {"rank": "Admiral", "min_rep": 250, "title": "Federation Admiral"}
    ],
    "Syndicate": [
        {"rank": "Outsider", "min_rep": -999, "title": "Outsider"},
        {"rank": "Associate", "min_rep": 10, "title": "Syndicate Associate"},
        {"rank": "Operative", "min_rep": 40, "title": "Syndicate Operative"},
        {"rank": "Enforcer", "min_rep": 80, "title": "Syndicate Enforcer"},
        {"rank": "Lieutenant", "min_rep": 120, "title": "Syndicate Lieutenant"},
        {"rank": "Boss", "min_rep": 180, "title": "Syndicate Boss"},
        {"rank": "Kingpin", "min_rep": 250, "title": "Syndicate Kingpin"}
    ],
    "Independent": [
        {"rank": "Outsider", "min_rep": -999, "title": "Outsider"},
        {"rank": "Trader", "min_rep": 0, "title": "Independent Trader"},
        {"rank": "Merchant", "min_rep": 50, "title": "Respected Merchant"},
        {"rank": "Tycoon", "min_rep": 100, "title": "Trade Tycoon"}
    ]
}

# Rank benefits configuration
RANK_BENEFITS = {
    "Federation": {
        "Civilian": {
            "description": "No benefits"
        },
        "Recruit": {
            "trade_discount": 0.05,
            "description": "5% trade discount"
        },
        "Ensign": {
            "trade_discount": 0.10,
            "mission_access": "exclusive",
            "description": "10% discount, exclusive missions"
        },
        "Lieutenant": {
            "trade_discount": 0.15,
            "shipyard_discount": 0.10,
            "mission_access": "exclusive",
            "description": "15% discount, 10% shipyard discount"
        },
        "Commander": {
            "trade_discount": 0.20,
            "shipyard_discount": 0.15,
            "mission_multiplier": 1.5,
            "description": "20% discount, 15% shipyard, 1.5x mission rewards"
        },
        "Captain": {
            "trade_discount": 0.25,
            "shipyard_discount": 0.20,
            "mission_multiplier": 2.0,
            "special_ships": True,
            "description": "25% discount, 20% shipyard, 2x missions, special ships"
        },
        "Admiral": {
            "trade_discount": 0.30,
            "shipyard_discount": 0.25,
            "mission_multiplier": 2.5,
            "special_ships": True,
            "diplomatic_immunity": True,
            "description": "30% discount, 25% shipyard, 2.5x missions, immunity"
        }
    },
    "Syndicate": {
        "Outsider": {
            "description": "No benefits"
        },
        "Associate": {
            "black_market_access": True,
            "black_market_discount": 0.10,
            "description": "Black market access, 10% contraband discount"
        },
        "Operative": {
            "black_market_discount": 0.20,
            "reduced_customs_scrutiny": 0.7,
            "description": "20% black market discount, reduced scrutiny"
        },
        "Enforcer": {
            "black_market_discount": 0.30,
            "reduced_customs_scrutiny": 0.5,
            "intimidation_bonus": 1.3,
            "description": "30% discount, intimidation bonus"
        },
        "Lieutenant": {
            "black_market_discount": 0.40,
            "reduced_customs_scrutiny": 0.3,
            "intimidation_bonus": 1.5,
            "protection_income": 100,
            "description": "40% discount, protection racket"
        },
        "Boss": {
            "black_market_discount": 0.50,
            "reduced_customs_scrutiny": 0.2,
            "intimidation_bonus": 1.7,
            "protection_income": 250,
            "smuggling_routes": True,
            "description": "50% discount, smuggling routes"
        },
        "Kingpin": {
            "black_market_discount": 0.60,
            "reduced_customs_scrutiny": 0.1,
            "intimidation_bonus": 2.0,
            "protection_income": 500,
            "smuggling_routes": True,
            "crime_network": True,
            "description": "60% discount, crime network, near immunity"
        }
    }
}
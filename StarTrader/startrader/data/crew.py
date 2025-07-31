"""
Crew and AI captain data for Star Trader.

Contains crew recruit templates and AI captain names.
"""

# Crew recruit templates
CREW_RECRUITS = [
    {"name": "Jack 'Steady' Williams", "role": "Navigator", "skill_bonus": 0.15, "salary": 50, "description": "Experienced navigator with steady hands"},
    {"name": "Elena Vasquez", "role": "Weapons Officer", "skill_bonus": 0.20, "salary": 75, "description": "Former military weapons specialist"},
    {"name": "Dr. Chen Wei", "role": "Medic", "skill_bonus": 0.25, "salary": 100, "description": "Skilled doctor with years of space medicine experience"},
    {"name": "Marcus 'Tank' Johnson", "role": "Security", "skill_bonus": 0.20, "salary": 80, "description": "Former security guard with combat training"},
    {"name": "Sophia 'Whisper' Klein", "role": "Negotiator", "skill_bonus": 0.30, "salary": 120, "description": "Smooth-talking diplomat and deal-maker"}
]

# AI captain name pool
AI_CAPTAIN_NAMES = [
    "Captain Rex 'Iron' Morrison",
    "Captain Luna Starweaver", 
    "Captain Zara 'Vortex' Chen",
    "Captain Marcus Blackwood",
    "Captain Aria Nightingale",
    "Captain Kai 'Thunder' Tanaka",
    "Captain Nova Sterling",
    "Captain Orion Cross"
]

# Crew role definitions
CREW_ROLES = {
    "Navigator": {
        "description": "Reduces fuel consumption and improves navigation",
        "base_salary": 50,
        "skill_range": (0.10, 0.30)
    },
    "Weapons Officer": {
        "description": "Increases combat damage and accuracy",
        "base_salary": 75,
        "skill_range": (0.15, 0.35)
    },
    "Engineer": {
        "description": "Improves fuel efficiency and repair costs",
        "base_salary": 60,
        "skill_range": (0.10, 0.25)
    },
    "Medic": {
        "description": "Reduces crew casualties and improves morale",
        "base_salary": 100,
        "skill_range": (0.20, 0.40)
    },
    "Negotiator": {
        "description": "Better trade prices and mission rewards",
        "base_salary": 120,
        "skill_range": (0.25, 0.45)
    },
    "Security": {
        "description": "Improves boarding success and defense",
        "base_salary": 80,
        "skill_range": (0.15, 0.30)
    }
}

# AI captain experience levels
AI_CAPTAIN_LEVELS = {
    "Novice": {
        "skill_bonus": 0.10,
        "daily_wage": 100,
        "trade_efficiency": 0.80,
        "description": "New to autonomous trading"
    },
    "Experienced": {
        "skill_bonus": 0.20,
        "daily_wage": 200,
        "trade_efficiency": 0.90,
        "description": "Solid track record"
    },
    "Veteran": {
        "skill_bonus": 0.30,
        "daily_wage": 350,
        "trade_efficiency": 1.00,
        "description": "Years of successful trading"
    },
    "Elite": {
        "skill_bonus": 0.40,
        "daily_wage": 500,
        "trade_efficiency": 1.10,
        "description": "Among the best in the galaxy"
    }
}
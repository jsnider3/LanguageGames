"""
Trade goods and production data for Star Trader.

Contains all legal and illegal goods, as well as production recipes.
"""

# Legal trade goods
GOODS = {
    "Food": {"base_price": 100, "category": "essential"},
    "Minerals": {"base_price": 200, "category": "raw_material"},
    "Machinery": {"base_price": 500, "category": "industrial"},
    "Electronics": {"base_price": 800, "category": "high_tech"},
    "Luxury Goods": {"base_price": 1200, "category": "consumer"},
    "Medicine": {"base_price": 600, "category": "essential"},
    "Chemicals": {"base_price": 400, "category": "industrial"},
    "Alloys": {"base_price": 700, "category": "processed"},
    "Energy": {"base_price": 300, "category": "utility"},
    "Water": {"base_price": 150, "category": "essential"},
    "Rations": {"base_price": 250, "category": "processed"},
    "Components": {"base_price": 1000, "category": "high_tech"},
    "Organics": {"base_price": 350, "category": "raw_material"},
    "Textiles": {"base_price": 450, "category": "consumer"},
    "Polymers": {"base_price": 550, "category": "industrial"},
    "Data Cores": {"base_price": 1500, "category": "high_tech"},
    "Fuel Cells": {"base_price": 900, "category": "utility"},
    "Rare Metals": {"base_price": 2000, "category": "raw_material"}
}

# Illegal/contraband goods
ILLEGAL_GOODS = {
    "Weapons": {"base_price": 2000, "category": "military"},
    "Drugs": {"base_price": 3000, "category": "contraband"},
    "Stolen Goods": {"base_price": 1000, "category": "contraband"}
}

# Production recipes for factories
PRODUCTION_RECIPES = {
    "Rations": {
        "inputs": {"Food": 2, "Water": 1},
        "output_quantity": 3,
        "time": 1,
        "required_economy": "Agricultural"
    },
    "Alloys": {
        "inputs": {"Minerals": 3, "Energy": 1},
        "output_quantity": 2,
        "time": 2,
        "required_economy": "Industrial"
    },
    "Components": {
        "inputs": {"Electronics": 1, "Alloys": 2},
        "output_quantity": 1,
        "time": 3,
        "required_economy": "Tech"
    },
    "Medicine": {
        "inputs": {"Chemicals": 2, "Organics": 1},
        "output_quantity": 2,
        "time": 2,
        "required_economy": "Research"
    },
    "Fuel Cells": {
        "inputs": {"Energy": 2, "Chemicals": 1},
        "output_quantity": 2,
        "time": 2,
        "required_economy": "Industrial"
    },
    "Polymers": {
        "inputs": {"Chemicals": 2, "Organics": 1},
        "output_quantity": 3,
        "time": 1,
        "required_economy": "Industrial"
    },
    "Data Cores": {
        "inputs": {"Electronics": 2, "Rare Metals": 1},
        "output_quantity": 1,
        "time": 4,
        "required_economy": "Tech"
    }
}
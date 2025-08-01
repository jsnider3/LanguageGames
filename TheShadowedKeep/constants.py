"""
Constants and configuration values for The Shadowed Keep.
"""

# Game Configuration
GAME_TITLE = "The Shadowed Keep"
STARTING_FLOOR = 1

# Player Defaults
DEFAULT_PLAYER_NAME = "Hero"
PLAYER_BASE_HP = 20
PLAYER_BASE_ATTACK = 5
PLAYER_BASE_DEFENSE = 0

# Level Progression
XP_PER_LEVEL_MULTIPLIER = 10  # XP needed = level * 10
HP_PER_LEVEL = 3
ATTACK_PER_LEVEL = 1

# Combat System
CRITICAL_HIT_CHANCE = 0.1  # 10%
CRITICAL_HIT_MULTIPLIER = 2.0
DEFEND_DAMAGE_REDUCTION = 0.5  # 50% reduction
DODGE_SUCCESS_CHANCE = 0.75  # 75%
DODGE_COOLDOWN = 3
PARRY_SUCCESS_CHANCE = 0.5  # 50%
PARRY_COOLDOWN = 2
PARRY_COUNTER_DAMAGE = 0.5  # 50% of attack power
RUN_PARTING_SHOT_CHANCE = 0.25  # 25%

# Map Generation
MAP_WIDTH = 9
MAP_HEIGHT = 9
MIN_ROOMS = 15
MAX_ROOMS = 20

# Difficulty Scaling
DIFFICULTY_MULTIPLIER_PER_FLOOR = 0.05  # 5% increase per floor
MAX_DIFFICULTY_MULTIPLIER = 2.0  # Cap at 200% difficulty
ELITE_MONSTER_CHANCE_BASE = 0.1  # 10% base chance for elite monsters
ELITE_MONSTER_CHANCE_PER_FLOOR = 0.02  # +2% per floor
ELITE_HP_MULTIPLIER = 1.5
ELITE_ATTACK_MULTIPLIER = 1.3
ELITE_GOLD_MULTIPLIER = 2.0
ELITE_XP_MULTIPLIER = 1.5

# New Game Plus
NG_PLUS_DIFFICULTY_MULTIPLIER = 0.5  # +50% difficulty per NG+ cycle
NG_PLUS_MAX_CYCLES = 5  # Maximum NG+ cycles
NG_PLUS_BONUS_GOLD_MULTIPLIER = 0.25  # +25% gold per cycle
NG_PLUS_BONUS_XP_MULTIPLIER = 0.25  # +25% XP per cycle
NG_PLUS_RARE_ITEM_CHANCE = 0.1  # 10% chance for rare items per cycle

# Room Generation Weights
ROOM_WEIGHTS = {
    "monster": 0.40,
    "treasure": 0.20,
    "empty": 0.15,
    "equipment": 0.10,
    "merchant": 0.05,
    "fountain": 0.05,
    "trap": 0.05
}

# Monster Selection by Dungeon Level
EARLY_GAME_MONSTERS = ["Goblin", "Goblin", "Slime"]  # Levels 1-2
MID_GAME_MONSTERS = ["Goblin", "Orc", "Slime", "SkeletonArcher", "Bandit"]  # Levels 3-4
LATE_GAME_MONSTERS = ["Orc", "Slime", "SkeletonArcher", "Bandit", "Troll"]  # Levels 5-7
END_GAME_MONSTERS = ["Orc", "SkeletonArcher", "Bandit", "Troll", "Troll"]  # Level 8+

# Equipment Tiers by Dungeon Level
EARLY_EQUIPMENT = ["RustyDagger", "LeatherArmor", "HealthRing"]  # Levels 1-2
MID_EQUIPMENT = ["IronSword", "LeatherArmor", "ChainMail", "LuckyCharm", "HealthRing"]  # Levels 3-5
LATE_EQUIPMENT = ["IronSword", "SteelSword", "ChainMail", "LuckyCharm", "HealthRing"]  # Level 6+

# Treasure Generation
TREASURE_GOLD_MIN = 5
TREASURE_GOLD_MAX = 20
TREASURE_GOLD_MULTIPLIER = 1  # Gold = random(min, max) * level * multiplier

# Merchant Shop
MERCHANT_POTION_PRICE = 20
MERCHANT_POTION_STOCK = 3
MERCHANT_POTION_HEAL = 10

# Healing Fountain
FOUNTAIN_HEAL_PERCENTAGE = 0.25  # 25% of max HP
FOUNTAIN_MIN_HEAL = 5
FOUNTAIN_USES = 3

# Trap Room
SPIKE_TRAP_DAMAGE_MIN = 3
SPIKE_TRAP_DAMAGE_MAX = 6
SPIKE_TRAP_DODGE_CHANCE = 0.5
DART_TRAP_DAMAGE_MIN = 2
DART_TRAP_DAMAGE_MAX = 4
DART_TRAP_DODGE_CHANCE = 0.7
POISON_GAS_TRAP_DAMAGE_MIN = 4
POISON_GAS_TRAP_DAMAGE_MAX = 8
POISON_GAS_TRAP_DODGE_CHANCE = 0.3

# Empty Room
BANDAGE_FIND_CHANCE = 0.3  # 30%
BANDAGE_HEAL_MIN = 1
BANDAGE_HEAL_MAX = 5

# Special Monster Properties
SLIME_SPLIT_COUNT = 2
SKELETON_ARCHER_DAMAGE_BONUS = 1.2  # 20% bonus at range
BANDIT_STEAL_CHANCE = 0.3  # 30%
BANDIT_STEAL_RANGE = (1, 5)  # Steal 1-5 gold
TROLL_REGENERATION = 2

# Mage Class
MAGE_SPELL_COST = 3
MAGE_SPELL_POWER_MULTIPLIER = 1.5  # 50% damage bonus
MAGE_MANA_REGEN_PER_ROOM = 2

# Save System
SAVE_DIRECTORY = "saves"
AUTOSAVE_FILENAME = "autosave.json"
SAVE_VERSION = "1.0"

# UI Settings
MAX_MESSAGE_LENGTH = 30000  # Maximum characters in output before truncation
ROOM_EXPLORED_SYMBOL = "."
ROOM_CURRENT_SYMBOL = "@"
ROOM_UNEXPLORED_SYMBOL = "?"
ROOM_STAIRS_SYMBOL = ">"

# Mimic Properties
MIMIC_FAKE_GOLD_MIN = 20
MIMIC_FAKE_GOLD_MAX = 50

# Monster Gold Rewards
GOBLIN_GOLD_MIN = 1
GOBLIN_GOLD_MAX = 5
ORC_GOLD_MIN = 5
ORC_GOLD_MAX = 12
SLIME_GOLD_MIN = 2
SLIME_GOLD_MAX = 5
SKELETON_ARCHER_GOLD_MIN = 4
SKELETON_ARCHER_GOLD_MAX = 8
BANDIT_GOLD_MIN = 8
BANDIT_GOLD_MAX = 15
TROLL_GOLD_MIN = 10
TROLL_GOLD_MAX = 20
MIMIC_GOLD_MIN = 15
MIMIC_GOLD_MAX = 30

# Room Content Spawn Chance
MIMIC_SPAWN_CHANCE = 0.02  # 2% chance for mimic instead of regular monster
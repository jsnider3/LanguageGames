"""
Tutorial system for The Shadowed Keep.
Provides interactive tutorials and contextual help for new players.
"""
from typing import Dict, List, Optional, Callable
from enum import Enum
from abc import ABC, abstractmethod
from visual_effects import visual_fx, Colors


class TutorialStage(Enum):
    """Stages of the tutorial."""
    INTRO = "intro"
    CHARACTER_CREATION = "character_creation"
    FIRST_ROOM = "first_room"
    FIRST_COMBAT = "first_combat"
    COMBAT_OPTIONS = "combat_options"
    POST_COMBAT = "post_combat"
    EXPLORATION = "exploration"
    MERCHANT = "merchant"
    INVENTORY = "inventory"
    LEVELING = "leveling"
    ADVANCED_COMBAT = "advanced_combat"
    COMPLETED = "completed"


class TutorialStep:
    """A single step in the tutorial."""
    
    def __init__(self, stage: TutorialStage, title: str, content: List[str], 
                 highlight_commands: List[str] = None, wait_for_action: str = None):
        self.stage = stage
        self.title = title
        self.content = content
        self.highlight_commands = highlight_commands or []
        self.wait_for_action = wait_for_action  # Action to wait for before proceeding
        self.completed = False


class ContextualHelp:
    """Provides context-sensitive help based on game state."""
    
    def __init__(self):
        self.help_topics = {
            "combat": [
                "⚔️ COMBAT BASICS:",
                "• Attack (a) - Standard damage to enemy",
                "• Defend (d) - Reduce incoming damage by 50%",
                "• Dodge - 75% chance to avoid all damage (3 turn cooldown)",
                "• Parry - 50% chance to block and counter (2 turn cooldown)",
                "• Run (r) - Flee combat (25% chance enemy gets parting shot)"
            ],
            "exploration": [
                "🗺️ EXPLORATION:",
                "• Move with: north (n), south (s), east (e), west (w)",
                "• Look around (l) - Examine the current room",
                "• Map (m) - View dungeon map",
                "• Inventory (i) - Check your items",
                "• Stats - View character statistics",
                "• Log - View recent combat actions"
            ],
            "merchant": [
                "🏪 SHOPPING:",
                "• Type 'shop' to view merchant's wares",
                "• Buy items with: 'buy [item name]' or 'buy [quantity] [item name]'",
                "• Examples: 'buy healing potion', 'buy 3 bread'",
                "• Items are added to your inventory automatically"
            ],
            "items": [
                "🎒 USING ITEMS:",
                "• Type 'inventory' or 'i' to see your items",
                "• Use items with: 'use [item name]'",
                "• Examples: 'use healing potion', 'use antidote'",
                "• Some items can only be used outside combat"
            ],
            "progression": [
                "⭐ CHARACTER PROGRESSION:",
                "• Gain XP by defeating enemies",
                "• Level up increases HP and attack power",
                "• Different classes get different bonuses",
                "• Equipment improves your combat stats"
            ],
            "puzzles": [
                "🧩 PUZZLES:",
                "• Type 'examine puzzle' to see the challenge",
                "• Solve with: 'solve [your answer]'",
                "• Type 'hint' for a clue (if available)",
                "• Solving puzzles unlocks rewards and secrets"
            ],
            "status_effects": [
                "✨ STATUS EFFECTS:",
                "• Poison (🟢) - Damage over time",
                "• Stun (⚡) - Skip your next turn",
                "• Weakness (💔) - Reduced attack power",
                "• Regeneration (💚) - Heal over time",
                "• Strength (💪) - Increased attack power",
                "• Shield (🛡️) - Temporary damage reduction"
            ]
        }
        
    def get_help(self, topic: str) -> List[str]:
        """Get help for a specific topic."""
        topic_lower = topic.lower()
        
        # Find matching topic
        for key, content in self.help_topics.items():
            if topic_lower in key or key in topic_lower:
                return content
                
        # No specific topic found, return general help
        return self.get_general_help()
        
    def get_general_help(self) -> List[str]:
        """Get general help overview."""
        return [
            "📚 THE SHADOWED KEEP - HELP",
            "===========================",
            "Available help topics:",
            "• help combat - Combat system guide",
            "• help exploration - Movement and exploration",
            "• help merchant - Shopping and trading",
            "• help items - Using inventory items",
            "• help progression - Leveling and stats",
            "• help puzzles - Puzzle solving tips",
            "• help status - Status effects guide",
            "",
            "💡 TIP: Most commands work with just the first letter!",
            "Example: 'n' for north, 'a' for attack, 'i' for inventory"
        ]
        
    def get_contextual_tip(self, game_state: Dict) -> Optional[str]:
        """Get a contextual tip based on current game state."""
        tips = []
        
        # Low health tip
        if game_state.get("player_hp", 25) < game_state.get("player_max_hp", 25) * 0.3:
            tips.append("💡 TIP: Your health is low! Use healing items or find a healing fountain.")
            
        # First combat tip
        if game_state.get("in_combat") and game_state.get("combat_turn", 0) == 1:
            tips.append("💡 TIP: Try different combat actions! Defend reduces damage, dodge avoids it entirely.")
            
        # Merchant tip
        if game_state.get("in_merchant_room"):
            tips.append("💡 TIP: Type 'shop' to see what's for sale. Buy items with 'buy [item name]'.")
            
        # Level up tip
        if game_state.get("close_to_level_up"):
            tips.append("💡 TIP: You're close to leveling up! Defeat one more enemy for increased stats.")
            
        # Puzzle tip
        if game_state.get("in_puzzle_room"):
            tips.append("💡 TIP: Stuck on a puzzle? Type 'hint' for a clue, or 'solve [answer]' to attempt it.")
            
        return tips[0] if tips else None


class TutorialManager:
    """Manages the tutorial flow and progression."""
    
    def __init__(self):
        self.current_stage = TutorialStage.INTRO
        self.tutorial_active = False
        self.steps_completed = set()
        self.contextual_help = ContextualHelp()
        self._initialize_tutorial_steps()
        
    def _initialize_tutorial_steps(self):
        """Initialize all tutorial steps."""
        self.tutorial_steps = {
            TutorialStage.INTRO: TutorialStep(
                TutorialStage.INTRO,
                "Welcome to The Shadowed Keep!",
                [
                    "🏰 Welcome, brave adventurer!",
                    "",
                    "You are about to enter the dangerous depths of The Shadowed Keep,",
                    "an ancient dungeon filled with monsters, treasures, and mysteries.",
                    "",
                    "This tutorial will guide you through the basics of survival.",
                    "You can skip the tutorial at any time by typing 'skip tutorial'.",
                    "",
                    "Press Enter to continue..."
                ],
                wait_for_action="continue"
            ),
            
            TutorialStage.CHARACTER_CREATION: TutorialStep(
                TutorialStage.CHARACTER_CREATION,
                "Creating Your Character",
                [
                    "⚔️ CHARACTER CLASSES:",
                    "",
                    "• WARRIOR - Balanced fighter with extra HP per level",
                    "• MAGE - Magic user with spell power (costs mana)",
                    "• ROGUE - Agile fighter with critical hit bonuses",
                    "",
                    "Each class has unique abilities and playstyles.",
                    "Choose the one that matches your preferred strategy!",
                    "",
                    "Type the name of your chosen class..."
                ],
                highlight_commands=["warrior", "mage", "rogue"]
            ),
            
            TutorialStage.FIRST_ROOM: TutorialStep(
                TutorialStage.FIRST_ROOM,
                "Exploring Your First Room",
                [
                    "🗺️ NAVIGATION BASICS:",
                    "",
                    "• Use directional commands to move: north (n), south (s), east (e), west (w)",
                    "• Type 'look' or 'l' to examine your surroundings",
                    "• Type 'map' or 'm' to see the dungeon layout",
                    "• Unexplored rooms appear as [?] on the map",
                    "",
                    "Try moving to an adjacent room now!"
                ],
                highlight_commands=["north", "south", "east", "west", "n", "s", "e", "w", "look", "map"]
            ),
            
            TutorialStage.FIRST_COMBAT: TutorialStep(
                TutorialStage.FIRST_COMBAT,
                "Your First Battle!",
                [
                    "⚔️ COMBAT ENCOUNTER!",
                    "",
                    "An enemy blocks your path! In combat, you have several options:",
                    "",
                    "• Attack (a) - Deal damage equal to your attack power",
                    "• Defend (d) - Reduce incoming damage by 50%",
                    "• Run (r) - Attempt to flee (25% chance enemy attacks)",
                    "",
                    "Start with 'attack' to defeat this enemy!"
                ],
                highlight_commands=["attack", "a", "defend", "d", "run", "r"],
                wait_for_action="combat"
            ),
            
            TutorialStage.COMBAT_OPTIONS: TutorialStep(
                TutorialStage.COMBAT_OPTIONS,
                "Advanced Combat Tactics",
                [
                    "🎯 ADVANCED COMBAT:",
                    "",
                    "As you progress, you'll unlock more combat options:",
                    "",
                    "• Dodge - 75% chance to avoid all damage (cooldown: 3 turns)",
                    "• Parry - 50% chance to block and counter (cooldown: 2 turns)",
                    "• Special abilities based on your class",
                    "",
                    "Timing these abilities well is key to defeating tough enemies!"
                ]
            ),
            
            TutorialStage.POST_COMBAT: TutorialStep(
                TutorialStage.POST_COMBAT,
                "Victory and Rewards!",
                [
                    "🏆 COMBAT REWARDS:",
                    "",
                    "Defeating enemies grants:",
                    "• Gold - Use at merchants to buy items",
                    "• XP - Level up to increase your stats",
                    "• Sometimes items or equipment",
                    "",
                    "Check your progress with 'stats' command!"
                ],
                highlight_commands=["stats"]
            ),
            
            TutorialStage.MERCHANT: TutorialStep(
                TutorialStage.MERCHANT,
                "Shopping at Merchants",
                [
                    "🏪 MERCHANT ENCOUNTER!",
                    "",
                    "Merchants sell useful items for your journey:",
                    "",
                    "1. Type 'shop' to see available items",
                    "2. Buy with: 'buy [item name]' or 'buy [quantity] [item name]'",
                    "3. Examples: 'buy healing potion', 'buy 3 bread'",
                    "",
                    "Stock up on healing items for tough battles ahead!"
                ],
                highlight_commands=["shop", "buy"]
            ),
            
            TutorialStage.INVENTORY: TutorialStep(
                TutorialStage.INVENTORY,
                "Managing Your Inventory",
                [
                    "🎒 INVENTORY MANAGEMENT:",
                    "",
                    "• Type 'inventory' or 'i' to see your items",
                    "• Use items with: 'use [item name]'",
                    "• Example: 'use healing potion'",
                    "",
                    "Some items can only be used outside combat!",
                    "Plan ahead and stock up on supplies."
                ],
                highlight_commands=["inventory", "i", "use"]
            ),
            
            TutorialStage.LEVELING: TutorialStep(
                TutorialStage.LEVELING,
                "Character Progression",
                [
                    "⭐ LEVELING UP:",
                    "",
                    "As you gain XP and level up:",
                    "• Your max HP increases",
                    "• Your attack power grows",
                    "• You're fully healed",
                    "• Class-specific bonuses apply",
                    "",
                    "Higher dungeon levels have tougher enemies but better rewards!"
                ]
            ),
            
            TutorialStage.ADVANCED_COMBAT: TutorialStep(
                TutorialStage.ADVANCED_COMBAT,
                "Advanced Tips",
                [
                    "💡 PRO TIPS:",
                    "",
                    "• Boss enemies have multiple phases - adapt your strategy!",
                    "• Status effects can turn the tide of battle",
                    "• Solve puzzles for bonus rewards and secret rooms",
                    "• Some equipment has special properties",
                    "• Save regularly - the dungeon is unforgiving!",
                    "",
                    "Good luck, adventurer! Type 'help' anytime for assistance."
                ],
                wait_for_action="complete"
            )
        }
        
    def start_tutorial(self):
        """Start the tutorial from the beginning."""
        self.tutorial_active = True
        self.current_stage = TutorialStage.INTRO
        self.steps_completed.clear()
        return self.get_current_step()
        
    def skip_tutorial(self):
        """Skip the tutorial entirely."""
        self.tutorial_active = False
        self.current_stage = TutorialStage.COMPLETED
        return ["Tutorial skipped. Type 'help' anytime for assistance!"]
        
    def get_current_step(self) -> Optional[TutorialStep]:
        """Get the current tutorial step."""
        if not self.tutorial_active or self.current_stage == TutorialStage.COMPLETED:
            return None
        return self.tutorial_steps.get(self.current_stage)
        
    def advance_tutorial(self, action_performed: str = None) -> Optional[TutorialStep]:
        """Advance to the next tutorial step."""
        if not self.tutorial_active:
            return None
            
        current_step = self.get_current_step()
        if current_step:
            # Check if we should wait for a specific action
            if current_step.wait_for_action and action_performed != current_step.wait_for_action:
                return current_step  # Don't advance yet
                
            current_step.completed = True
            self.steps_completed.add(self.current_stage)
            
        # Advance to next stage
        stages = list(TutorialStage)
        current_index = stages.index(self.current_stage)
        
        if current_index < len(stages) - 1:
            self.current_stage = stages[current_index + 1]
            return self.get_current_step()
        else:
            self.tutorial_active = False
            self.current_stage = TutorialStage.COMPLETED
            return None
            
    def should_show_tutorial(self, context: str) -> bool:
        """Check if tutorial should be shown for given context."""
        if not self.tutorial_active:
            return False
            
        context_mapping = {
            "character_creation": TutorialStage.CHARACTER_CREATION,
            "first_room": TutorialStage.FIRST_ROOM,
            "combat_start": TutorialStage.FIRST_COMBAT,
            "combat_victory": TutorialStage.POST_COMBAT,
            "merchant": TutorialStage.MERCHANT,
            "inventory": TutorialStage.INVENTORY
        }
        
        expected_stage = context_mapping.get(context)
        return expected_stage == self.current_stage
        
    def format_tutorial_message(self, step: TutorialStep) -> List[str]:
        """Format a tutorial step for display."""
        messages = []
        
        # Add tutorial header
        messages.append("=" * 50)
        messages.append(visual_fx.colorize(f"📚 TUTORIAL: {step.title}", Colors.BRIGHT_CYAN, bold=True))
        messages.append("=" * 50)
        
        # Add content
        for line in step.content:
            if line.startswith("•"):
                messages.append(visual_fx.colorize(line, Colors.BRIGHT_WHITE))
            elif line.isupper() and ":" in line:
                messages.append(visual_fx.colorize(line, Colors.BRIGHT_YELLOW, bold=True))
            else:
                messages.append(line)
                
        # Highlight commands
        if step.highlight_commands:
            messages.append("")
            messages.append(visual_fx.colorize("Available commands: ", Colors.BRIGHT_GREEN) + 
                          ", ".join([visual_fx.colorize(cmd, Colors.BRIGHT_CYAN) for cmd in step.highlight_commands]))
            
        messages.append("=" * 50)
        
        return messages
        
    def get_help(self, topic: str = None) -> List[str]:
        """Get help on a specific topic or general help."""
        if topic:
            return self.contextual_help.get_help(topic)
        return self.contextual_help.get_general_help()
        
    def get_contextual_tip(self, game_state: Dict) -> Optional[str]:
        """Get a contextual tip based on game state."""
        # Don't show tips during active tutorial
        if self.tutorial_active:
            return None
        return self.contextual_help.get_contextual_tip(game_state)
        
    def is_tutorial_complete(self) -> bool:
        """Check if tutorial has been completed."""
        return self.current_stage == TutorialStage.COMPLETED


# Global tutorial manager instance
tutorial_manager = TutorialManager()
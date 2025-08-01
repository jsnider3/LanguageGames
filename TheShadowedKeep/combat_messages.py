"""
Combat message variety system for The Shadowed Keep.
Provides varied and dynamic combat feedback to reduce repetition.
"""
import random
from typing import List, Dict, Optional


class CombatMessageGenerator:
    """Generates varied combat messages based on context."""
    
    def __init__(self):
        self._initialize_message_pools()
        self.recent_messages = []  # Track recent messages to avoid repetition
        self.max_recent = 5
        
    def _initialize_message_pools(self):
        """Initialize all message pools."""
        # Player attack messages
        self.player_attacks = {
            "normal": [
                "You strike {enemy} with your weapon for {damage} damage!",
                "Your attack connects, dealing {damage} damage to {enemy}!",
                "You land a solid blow on {enemy} for {damage} damage!",
                "Your weapon finds its mark, inflicting {damage} damage!",
                "You attack {enemy}, causing {damage} points of damage!",
                "With precision, you deal {damage} damage to {enemy}!",
                "Your strike hits {enemy} for {damage} damage!",
                "You slash at {enemy}, dealing {damage} damage!"
            ],
            "weak": [
                "Your attack barely scratches {enemy} for {damage} damage.",
                "You manage only a glancing blow for {damage} damage.",
                "Your weak strike deals just {damage} damage to {enemy}.",
                "The attack connects poorly, dealing {damage} damage."
            ],
            "strong": [
                "You unleash a powerful attack for {damage} damage!",
                "Your mighty blow crushes {enemy} for {damage} damage!",
                "With great force, you deal {damage} damage to {enemy}!",
                "Your devastating strike inflicts {damage} damage!"
            ]
        }
        
        # Critical hit messages
        self.critical_hits = [
            "CRITICAL HIT! Your perfectly-aimed strike deals {damage} damage!",
            "CRITICAL STRIKE! You find a weak spot for {damage} damage!",
            "DEVASTATING BLOW! Your critical attack inflicts {damage} damage!",
            "PERFECT HIT! You deal a crushing {damage} damage!",
            "CRITICAL! Your precise strike causes {damage} damage!"
        ]
        
        # Enemy attack messages
        self.enemy_attacks = {
            "normal": [
                "{enemy} attacks you for {damage} damage!",
                "{enemy} strikes, dealing {damage} damage!",
                "{enemy} hits you for {damage} damage!",
                "{enemy} lands a blow for {damage} damage!",
                "You take {damage} damage from {enemy}'s attack!",
                "{enemy} wounds you for {damage} damage!"
            ],
            "weak": [
                "{enemy} grazes you for {damage} damage.",
                "{enemy}'s weak attack deals {damage} damage.",
                "You shrug off most of {enemy}'s attack, taking {damage} damage.",
                "{enemy} barely hurts you for {damage} damage."
            ],
            "strong": [
                "{enemy} lands a vicious blow for {damage} damage!",
                "{enemy} strikes hard, dealing {damage} damage!",
                "You reel from {enemy}'s powerful attack - {damage} damage!",
                "{enemy} savages you for {damage} damage!"
            ]
        }
        
        # Dodge messages
        self.dodge_success = [
            "You nimbly dodge out of the way!",
            "With quick reflexes, you evade the attack!",
            "You roll aside, avoiding the blow completely!",
            "The attack misses as you dance away!",
            "Your agile dodge leaves {enemy} swinging at air!"
        ]
        
        self.dodge_fail = [
            "{enemy} anticipates your dodge and strikes true!",
            "Your dodge fails! {enemy} adjusts and hits you!",
            "Too slow! {enemy} catches you mid-dodge!",
            "{enemy} reads your movement and lands the blow!"
        ]
        
        # Parry messages
        self.parry_success = [
            "Perfect parry! You deflect the attack and counter!",
            "You skillfully parry and riposte!",
            "Excellent timing! You turn aside the blow and strike back!",
            "Your parry creates an opening for a counter-attack!"
        ]
        
        self.parry_fail = [
            "Your parry fails! The attack breaks through!",
            "Mistimed! Your parry doesn't stop the blow!",
            "You fail to deflect the attack!",
            "{enemy} powers through your attempted parry!"
        ]
        
        # Defense messages
        self.defend_messages = [
            "You brace yourself, reducing the impact of attacks.",
            "You take a defensive stance, ready to absorb blows.",
            "You focus on defense, minimizing incoming damage.",
            "Your defensive posture will reduce damage this turn."
        ]
        
        # Victory messages
        self.victory_messages = [
            "Victory! {enemy} falls before you!",
            "{enemy} collapses, defeated!",
            "You have vanquished {enemy}!",
            "With a final blow, {enemy} is defeated!",
            "{enemy} lies defeated at your feet!",
            "You emerge victorious over {enemy}!"
        ]
        
        # Death messages by enemy type
        self.death_messages = {
            "goblin": [
                "The goblin lets out a final shriek before collapsing!",
                "With a whimper, the goblin falls to the ground.",
                "The goblin's eyes go dark as it crumbles."
            ],
            "orc": [
                "The orc roars one last time before falling silent.",
                "With a heavy thud, the orc crashes to the ground.",
                "The mighty orc finally succumbs to its wounds."
            ],
            "slime": [
                "The slime dissolves into a puddle of goo!",
                "With a wet splat, the slime loses cohesion.",
                "The slime bubbles once more before melting away."
            ],
            "skeleton": [
                "The skeleton crumbles into a pile of bones!",
                "With a clatter, the skeleton falls apart.",
                "The undead warrior collapses into dust."
            ],
            "spider": [
                "The spider curls up its legs and dies.",
                "With a final twitch, the spider goes still.",
                "The arachnid menace is no more."
            ],
            "default": [
                "Your enemy breathes its last.",
                "The creature falls, never to rise again.",
                "Death claims your foe."
            ]
        }
        
        # Status effect application messages
        self.status_messages = {
            "poison": [
                "{target} is poisoned! Green venom courses through their veins!",
                "Toxic poison seeps into {target}'s wounds!",
                "{target} turns a sickly green as poison takes hold!"
            ],
            "stun": [
                "{target} is stunned! They reel from the impact!",
                "The blow leaves {target} dazed and unable to act!",
                "{target} staggers, momentarily stunned!"
            ],
            "weakness": [
                "{target} feels their strength drain away!",
                "Weakness overcomes {target}, sapping their power!",
                "{target}'s attacks will be less effective!"
            ]
        }
        
    def get_message(self, message_type: str, context: Dict) -> str:
        """Get a contextual combat message avoiding recent repetition."""
        pool = self._get_message_pool(message_type, context)
        
        # Filter out recently used messages
        available = [msg for msg in pool if msg not in self.recent_messages]
        
        # If all messages were recently used, use the full pool
        if not available:
            available = pool
            self.recent_messages.clear()
            
        # Select and format message
        message = random.choice(available)
        formatted = self._format_message(message, context)
        
        # Track this message
        self.recent_messages.append(message)
        if len(self.recent_messages) > self.max_recent:
            self.recent_messages.pop(0)
            
        return formatted
        
    def _get_message_pool(self, message_type: str, context: Dict) -> List[str]:
        """Get the appropriate message pool based on type and context."""
        if message_type == "player_attack":
            damage_percent = context.get("damage_percent", 0.5)
            if damage_percent < 0.3:
                return self.player_attacks["weak"]
            elif damage_percent > 0.7:
                return self.player_attacks["strong"]
            else:
                return self.player_attacks["normal"]
                
        elif message_type == "critical_hit":
            return self.critical_hits
            
        elif message_type == "enemy_attack":
            damage_percent = context.get("damage_percent", 0.5)
            if damage_percent < 0.3:
                return self.enemy_attacks["weak"]
            elif damage_percent > 0.7:
                return self.enemy_attacks["strong"]
            else:
                return self.enemy_attacks["normal"]
                
        elif message_type == "dodge_success":
            return self.dodge_success
            
        elif message_type == "dodge_fail":
            return self.dodge_fail
            
        elif message_type == "parry_success":
            return self.parry_success
            
        elif message_type == "parry_fail":
            return self.parry_fail
            
        elif message_type == "defend":
            return self.defend_messages
            
        elif message_type == "victory":
            return self.victory_messages
            
        elif message_type == "death":
            enemy_type = context.get("enemy_type", "").lower()
            return self.death_messages.get(enemy_type, self.death_messages["default"])
            
        elif message_type.startswith("status_"):
            status = message_type.replace("status_", "")
            return self.status_messages.get(status, [])
            
        # Default fallback
        return ["Combat action performed."]
        
    def _format_message(self, message: str, context: Dict) -> str:
        """Format a message with context values."""
        try:
            return message.format(**context)
        except KeyError:
            # If formatting fails, return the message as-is
            return message
            
    def get_contextual_flavor(self, enemy_name: str, player_hp_percent: float) -> Optional[str]:
        """Get contextual flavor text based on battle state."""
        flavor_texts = []
        
        # Low player health
        if player_hp_percent < 0.3:
            flavor_texts.extend([
                "You're badly wounded!",
                "Your strength is fading!",
                "You can't take much more!",
                "Death looms near!"
            ])
            
        # Enemy-specific taunts
        enemy_taunts = {
            "goblin": ["The goblin cackles wickedly!", "The goblin dances around you!"],
            "orc": ["The orc bellows a war cry!", "The orc pounds its chest!"],
            "skeleton": ["The skeleton's bones rattle menacingly!", "Empty eye sockets stare at you!"],
            "spider": ["The spider clicks its mandibles!", "Eight eyes focus on you hungrily!"],
            "troll": ["The troll's wounds begin to close!", "The troll grins, showing yellowed tusks!"]
        }
        
        if enemy_name.lower() in enemy_taunts:
            flavor_texts.extend(enemy_taunts[enemy_name.lower()])
            
        return random.choice(flavor_texts) if flavor_texts else None


# Global message generator instance
combat_messages = CombatMessageGenerator()
"""
Puzzle system for The Shadowed Keep.
Handles environmental puzzles, riddles, and interactive challenges.
"""
import random
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
from enum import Enum


class PuzzleType(Enum):
    """Types of puzzles available in the game."""
    RIDDLE = "riddle"
    LEVER_SEQUENCE = "lever_sequence"  
    NUMBER_LOCK = "number_lock"
    PATTERN_MATCH = "pattern_match"
    WORD_CIPHER = "word_cipher"
    PRESSURE_PLATE = "pressure_plate"


class PuzzleDifficulty(Enum):
    """Puzzle difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    LEGENDARY = "legendary"


class PuzzleReward:
    """Represents rewards for solving puzzles."""
    
    def __init__(self, gold: int = 0, xp: int = 0, items: List = None, 
                 unlock_secret: bool = False, unlock_passage: bool = False):
        self.gold = gold
        self.xp = xp
        self.items = items or []
        self.unlock_secret = unlock_secret
        self.unlock_passage = unlock_passage


class Puzzle(ABC):
    """Abstract base class for all puzzles."""
    
    def __init__(self, puzzle_id: str, name: str, description: str, 
                 difficulty: PuzzleDifficulty, reward: PuzzleReward,
                 max_attempts: int = 3):
        self.puzzle_id = puzzle_id
        self.name = name
        self.description = description
        self.difficulty = difficulty
        self.reward = reward
        self.max_attempts = max_attempts
        self.attempts_used = 0
        self.solved = False
        self.failed = False
        
    @abstractmethod
    def get_prompt(self) -> str:
        """Get the puzzle prompt for the player."""
        pass
        
    @abstractmethod
    def check_answer(self, answer: str) -> bool:
        """Check if the player's answer is correct."""
        pass
        
    @abstractmethod
    def get_hint(self) -> str:
        """Get a hint for the puzzle."""
        pass
        
    def attempt_solve(self, answer: str) -> Tuple[bool, str]:
        """Attempt to solve the puzzle with the given answer."""
        if self.solved or self.failed:
            return False, "This puzzle has already been completed."
            
        self.attempts_used += 1
        
        if self.check_answer(answer):
            self.solved = True
            return True, "🎉 Correct! You solved the puzzle!"
        else:
            remaining = self.max_attempts - self.attempts_used
            if remaining <= 0:
                self.failed = True
                return False, "❌ Incorrect! You've used all your attempts. The puzzle locks permanently."
            else:
                return False, f"❌ Incorrect! You have {remaining} attempts remaining."
                
    def can_get_hint(self) -> bool:
        """Check if a hint can be provided."""
        return self.attempts_used > 0 and not self.solved and not self.failed
        
    def get_difficulty_multiplier(self) -> float:
        """Get reward multiplier based on difficulty."""
        multipliers = {
            PuzzleDifficulty.EASY: 1.0,
            PuzzleDifficulty.MEDIUM: 1.5,
            PuzzleDifficulty.HARD: 2.0,
            PuzzleDifficulty.LEGENDARY: 3.0
        }
        return multipliers.get(self.difficulty, 1.0)


class RiddlePuzzle(Puzzle):
    """A riddle-based puzzle."""
    
    def __init__(self, puzzle_id: str, riddle: str, answer: str, 
                 difficulty: PuzzleDifficulty, reward: PuzzleReward,
                 hint: str = "", alternative_answers: List[str] = None):
        name = "Ancient Riddle"
        description = "An ancient riddle carved into the stone."
        super().__init__(puzzle_id, name, description, difficulty, reward)
        
        self.riddle = riddle
        self.correct_answer = answer.lower().strip()
        self.hint_text = hint
        self.alternative_answers = [alt.lower().strip() for alt in (alternative_answers or [])]
        
    def get_prompt(self) -> str:
        return f"📜 {self.riddle}\n\n💭 What is your answer?"
        
    def check_answer(self, answer: str) -> bool:
        answer = answer.lower().strip()
        return (answer == self.correct_answer or 
                answer in self.alternative_answers)
                
    def get_hint(self) -> str:
        if self.hint_text:
            return f"💡 Hint: {self.hint_text}"
        else:
            # Generate a generic hint based on answer length
            length = len(self.correct_answer)
            return f"💡 Hint: The answer is {length} letters long."


class LeverSequencePuzzle(Puzzle):
    """A puzzle requiring pulling levers in the correct sequence."""
    
    def __init__(self, puzzle_id: str, sequence: List[int], 
                 difficulty: PuzzleDifficulty, reward: PuzzleReward,
                 num_levers: int = 5):
        name = "Lever Mechanism"
        description = "A complex mechanism with multiple levers."
        super().__init__(puzzle_id, name, description, difficulty, reward)
        
        self.correct_sequence = sequence
        self.num_levers = num_levers
        self.current_sequence = []
        
    def get_prompt(self) -> str:
        lever_display = " ".join([f"[{i+1}]" for i in range(self.num_levers)])
        return (f"🔧 There are {self.num_levers} levers before you: {lever_display}\n"
                f"Current sequence: {self.current_sequence if self.current_sequence else 'None'}\n"
                f"Enter lever numbers separated by spaces (e.g., '1 3 2'):")
                
    def check_answer(self, answer: str) -> bool:
        try:
            sequence = [int(x) for x in answer.split()]
            # Validate lever numbers
            if not all(1 <= lever <= self.num_levers for lever in sequence):
                return False
            return sequence == self.correct_sequence
        except (ValueError, TypeError):
            return False
            
    def get_hint(self) -> str:
        if len(self.correct_sequence) > 2:
            # Give the first lever as a hint
            return f"💡 Hint: The sequence starts with lever {self.correct_sequence[0]}."
        else:
            return f"💡 Hint: You need to pull {len(self.correct_sequence)} levers in total."


class NumberLockPuzzle(Puzzle):
    """A puzzle with a numerical combination lock."""
    
    def __init__(self, puzzle_id: str, combination: str, 
                 difficulty: PuzzleDifficulty, reward: PuzzleReward,
                 clue: str = ""):
        name = "Combination Lock"
        description = "An ancient lock requiring a numerical combination."
        super().__init__(puzzle_id, name, description, difficulty, reward)
        
        self.combination = combination
        self.clue = clue
        
    def get_prompt(self) -> str:
        prompt = "🔒 You see a combination lock with rotating dials.\n"
        if self.clue:
            prompt += f"📋 Inscription: {self.clue}\n"
        prompt += "Enter the combination (e.g., '1234'):"
        return prompt
        
    def check_answer(self, answer: str) -> bool:
        return answer.strip() == self.combination
        
    def get_hint(self) -> str:
        if len(self.combination) > 2:
            # Show the first digit
            return f"💡 Hint: The combination starts with {self.combination[0]}."
        else:
            return f"💡 Hint: The combination is {len(self.combination)} digits long."


class PatternMatchPuzzle(Puzzle):
    """A puzzle requiring matching a visual pattern."""
    
    def __init__(self, puzzle_id: str, pattern: List[str], 
                 difficulty: PuzzleDifficulty, reward: PuzzleReward,
                 symbols: Dict[str, str] = None):
        name = "Pattern Lock"
        description = "A mystical pattern that must be replicated."
        super().__init__(puzzle_id, name, description, difficulty, reward)
        
        self.pattern = pattern
        self.symbols = symbols or {
            'A': '◆', 'B': '●', 'C': '▲', 'D': '■', 'E': '★'
        }
        
    def get_prompt(self) -> str:
        # Display the pattern with symbols
        pattern_display = []
        for row in self.pattern:
            visual_row = ""
            for char in row:
                visual_row += self.symbols.get(char.upper(), char) + " "
            pattern_display.append(visual_row.strip())
            
        prompt = "🎭 Replicate this pattern:\n"
        for row in pattern_display:
            prompt += f"   {row}\n"
        prompt += "\nEnter the pattern using letters (A=◆, B=●, C=▲, D=■, E=★):"
        return prompt
        
    def check_answer(self, answer: str) -> bool:
        answer_lines = [line.strip().upper() for line in answer.split('\n') if line.strip()]
        return answer_lines == self.pattern
        
    def get_hint(self) -> str:
        if self.pattern:
            return f"💡 Hint: The pattern has {len(self.pattern)} rows."
        return "💡 Hint: Look carefully at the symbols and their positions."


class PuzzleFactory:
    """Factory for creating different types of puzzles."""
    
    @staticmethod
    def create_random_puzzle(dungeon_level: int) -> Puzzle:
        """Create a random puzzle appropriate for the dungeon level."""
        # Determine difficulty based on dungeon level
        if dungeon_level <= 2:
            difficulty = random.choice([PuzzleDifficulty.EASY, PuzzleDifficulty.MEDIUM])
        elif dungeon_level <= 4:
            difficulty = random.choice([PuzzleDifficulty.MEDIUM, PuzzleDifficulty.HARD])
        else:
            difficulty = random.choice([PuzzleDifficulty.HARD, PuzzleDifficulty.LEGENDARY])
            
        # Create reward based on difficulty
        base_gold = 50 * dungeon_level
        base_xp = 25 * dungeon_level
        multiplier = {
            PuzzleDifficulty.EASY: 1.0,
            PuzzleDifficulty.MEDIUM: 1.5,
            PuzzleDifficulty.HARD: 2.0,
            PuzzleDifficulty.LEGENDARY: 3.0
        }[difficulty]
        
        reward = PuzzleReward(
            gold=int(base_gold * multiplier),
            xp=int(base_xp * multiplier),
            unlock_secret=random.random() < 0.3  # 30% chance for secret unlock
        )
        
        # Choose puzzle type
        puzzle_type = random.choice(list(PuzzleType))
        puzzle_id = f"{puzzle_type.value}_{random.randint(1000, 9999)}"
        
        if puzzle_type == PuzzleType.RIDDLE:
            return PuzzleFactory._create_riddle(puzzle_id, difficulty, reward)
        elif puzzle_type == PuzzleType.LEVER_SEQUENCE:
            return PuzzleFactory._create_lever_sequence(puzzle_id, difficulty, reward)
        elif puzzle_type == PuzzleType.NUMBER_LOCK:
            return PuzzleFactory._create_number_lock(puzzle_id, difficulty, reward)
        elif puzzle_type == PuzzleType.PATTERN_MATCH:
            return PuzzleFactory._create_pattern_match(puzzle_id, difficulty, reward)
        else:
            # Default to riddle
            return PuzzleFactory._create_riddle(puzzle_id, difficulty, reward)
            
    @staticmethod
    def _create_riddle(puzzle_id: str, difficulty: PuzzleDifficulty, reward: PuzzleReward) -> RiddlePuzzle:
        """Create a riddle puzzle."""
        riddles = {
            PuzzleDifficulty.EASY: [
                ("I have keys but no locks. I have space but no room. You can enter but not go inside. What am I?", "keyboard", "I'm used for typing.", ["keys"]),
                ("What gets wet while drying?", "towel", "You use it after a bath.", ["cloth"]),
                ("What has hands but cannot clap?", "clock", "It tells time.", ["watch", "timepiece"]),
            ],
            PuzzleDifficulty.MEDIUM: [
                ("I speak without a mouth and hear without ears. I have no body, but come alive with the wind. What am I?", "echo", "Sound bounces back.", ["sound", "voice"]),
                ("The more you take, the more you leave behind. What am I?", "footsteps", "They mark your path.", ["steps", "tracks"]),
                ("I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", "map", "I show the world.", ["chart"]),
            ],
            PuzzleDifficulty.HARD: [
                ("I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?", "fire", "I consume to live.", ["flame", "blaze"]),
                ("What can travel around the world while staying in a corner?", "stamp", "It goes on mail.", ["postage"]),
                ("I have a golden head and a golden tail, but no golden body. What am I?", "coin", "I'm currency.", ["money", "gold piece"]),
            ],
            PuzzleDifficulty.LEGENDARY: [
                ("This thing all things devours: Birds, beasts, trees, flowers; Gnaws iron, bites steel; Grinds hard stones to meal. What am I?", "time", "I am inevitable.", ["age", "ages"]),
                ("Alive without breath, as cold as death; Never thirsty, ever drinking, all in mail never clinking. What am I?", "fish", "I live in water.", ["sea creature"]),
                ("What has roots that nobody sees, is taller than trees, up, up it goes, and yet never grows?", "mountain", "I touch the sky.", ["peak", "hill"]),
            ]
        }
        
        riddle_data = random.choice(riddles[difficulty])
        return RiddlePuzzle(puzzle_id, riddle_data[0], riddle_data[1], difficulty, 
                          reward, riddle_data[2], riddle_data[3])
                          
    @staticmethod
    def _create_lever_sequence(puzzle_id: str, difficulty: PuzzleDifficulty, reward: PuzzleReward) -> LeverSequencePuzzle:
        """Create a lever sequence puzzle."""
        num_levers = {
            PuzzleDifficulty.EASY: 3,
            PuzzleDifficulty.MEDIUM: 4,
            PuzzleDifficulty.HARD: 5,
            PuzzleDifficulty.LEGENDARY: 6
        }[difficulty]
        
        sequence_length = {
            PuzzleDifficulty.EASY: 2,
            PuzzleDifficulty.MEDIUM: 3,
            PuzzleDifficulty.HARD: 4,
            PuzzleDifficulty.LEGENDARY: 5
        }[difficulty]
        
        sequence = random.sample(range(1, num_levers + 1), sequence_length)
        return LeverSequencePuzzle(puzzle_id, sequence, difficulty, reward, num_levers)
        
    @staticmethod
    def _create_number_lock(puzzle_id: str, difficulty: PuzzleDifficulty, reward: PuzzleReward) -> NumberLockPuzzle:
        """Create a number lock puzzle."""
        length = {
            PuzzleDifficulty.EASY: 3,
            PuzzleDifficulty.MEDIUM: 4,
            PuzzleDifficulty.HARD: 5,
            PuzzleDifficulty.LEGENDARY: 6
        }[difficulty]
        
        combination = ''.join([str(random.randint(0, 9)) for _ in range(length)])
        
        # Create a clue for the combination
        clues = [
            f"The sum of all digits is {sum(int(d) for d in combination)}",
            f"All digits are between {min(combination)} and {max(combination)}",
            f"The first digit is {combination[0]}",
            f"The last digit is {combination[-1]}"
        ]
        
        clue = random.choice(clues) if difficulty != PuzzleDifficulty.LEGENDARY else ""
        
        return NumberLockPuzzle(puzzle_id, combination, difficulty, reward, clue)
        
    @staticmethod
    def _create_pattern_match(puzzle_id: str, difficulty: PuzzleDifficulty, reward: PuzzleReward) -> PatternMatchPuzzle:
        """Create a pattern matching puzzle."""
        size = {
            PuzzleDifficulty.EASY: 2,
            PuzzleDifficulty.MEDIUM: 3,
            PuzzleDifficulty.HARD: 4,
            PuzzleDifficulty.LEGENDARY: 5
        }[difficulty]
        
        symbols = ['A', 'B', 'C', 'D', 'E']
        pattern = []
        
        for _ in range(size):
            row = ''.join(random.choices(symbols[:3], k=size))  # Use first 3 symbols
            pattern.append(row)
            
        return PatternMatchPuzzle(puzzle_id, pattern, difficulty, reward)


class SecretRoom:
    """Represents a secret room that can be unlocked by puzzles."""
    
    def __init__(self, room_id: str, name: str, description: str, 
                 treasure_value: int, special_items: List = None):
        self.room_id = room_id
        self.name = name
        self.description = description
        self.treasure_value = treasure_value
        self.special_items = special_items or []
        self.discovered = False
        self.looted = False
        
    def discover(self) -> str:
        """Discover the secret room."""
        if self.discovered:
            return "You've already discovered this secret room."
            
        self.discovered = True
        return (f"🔍 SECRET DISCOVERED! 🔍\n"
                f"You have found: {self.name}\n"
                f"{self.description}")
                
    def loot(self, game) -> List[str]:
        """Loot the secret room."""
        if self.looted:
            return ["This secret room has already been looted."]
            
        if not self.discovered:
            return ["You haven't discovered this secret room yet."]
            
        messages = []
        self.looted = True
        
        # Award treasure
        if self.treasure_value > 0:
            game.player.gold += self.treasure_value
            messages.append(f"💰 You found {self.treasure_value} gold!")
            
        # Award special items
        for item_class in self.special_items:
            try:
                item = item_class()
                if hasattr(item, 'consumable_type'):  # It's a consumable
                    if game.player.inventory.add_item(item):
                        messages.append(f"✨ You found {item.name}!")
                    else:
                        messages.append(f"✨ You found {item.name}, but your inventory is full!")
                else:  # It's equipment
                    messages.append(f"✨ You found {item}! Do you want to equip it? (yes/no)")
                    # Note: Equipment handling would need additional logic in the caller
            except Exception:
                continue
                
        if not messages:
            messages.append("The secret room appears to be empty...")
            
        return messages


class PuzzleManager:
    """Manages puzzles and secret rooms in the game."""
    
    def __init__(self):
        self.active_puzzles: Dict[str, Puzzle] = {}  # room_position -> puzzle  
        self.secret_rooms: Dict[str, SecretRoom] = {}  # secret_id -> secret_room
        self.solved_puzzles: List[str] = []
        
    def place_puzzle_in_room(self, room_position: str, dungeon_level: int) -> Puzzle:
        """Place a random puzzle in a room."""
        if room_position in self.active_puzzles:
            return self.active_puzzles[room_position]
            
        puzzle = PuzzleFactory.create_random_puzzle(dungeon_level)
        self.active_puzzles[room_position] = puzzle
        
        # If puzzle unlocks a secret, create one
        if puzzle.reward.unlock_secret:
            self._create_secret_room(puzzle.puzzle_id, dungeon_level)
            
        return puzzle
        
    def _create_secret_room(self, puzzle_id: str, dungeon_level: int):
        """Create a secret room unlocked by a puzzle."""
        secret_names = [
            "Hidden Vault", "Secret Treasury", "Ancient Cache", 
            "Forgotten Chamber", "Mystic Sanctum", "Lost Archive"
        ]
        
        descriptions = [
            "A hidden chamber filled with ancient treasures.",
            "A secret vault containing forgotten riches.", 
            "A mystical room glowing with magical energy.",
            "An ancient storage room left by previous adventurers.",
            "A hidden sanctum of a long-dead wizard.",
            "A forgotten treasury of a lost civilization."
        ]
        
        name = random.choice(secret_names)
        description = random.choice(descriptions)
        treasure_value = random.randint(100, 300) * dungeon_level
        
        # Add special items based on dungeon level
        special_items = []
        if dungeon_level >= 3:
            from consumables import RegenerationPotion, StrengthPotion
            special_items.extend([RegenerationPotion, StrengthPotion])
        if dungeon_level >= 5:
            from equipment import HealthRing
            special_items.append(HealthRing)
            
        secret_room = SecretRoom(puzzle_id, name, description, treasure_value, special_items)
        self.secret_rooms[puzzle_id] = secret_room
        
    def solve_puzzle(self, room_position: str, answer: str) -> Tuple[bool, str, Optional[PuzzleReward]]:
        """Attempt to solve a puzzle in a room."""
        if room_position not in self.active_puzzles:
            return False, "There's no puzzle here.", None
            
        puzzle = self.active_puzzles[room_position]
        success, message = puzzle.attempt_solve(answer)
        
        if success:
            self.solved_puzzles.append(puzzle.puzzle_id)
            return True, message, puzzle.reward
        else:
            return False, message, None
            
    def get_puzzle_hint(self, room_position: str) -> Optional[str]:
        """Get a hint for the puzzle in a room."""
        if room_position not in self.active_puzzles:
            return None
            
        puzzle = self.active_puzzles[room_position]
        if puzzle.can_get_hint():
            return puzzle.get_hint()
        else:
            return "No hint available for this puzzle."
            
    def unlock_secret_room(self, puzzle_id: str) -> Optional[SecretRoom]:
        """Unlock a secret room by solving its associated puzzle."""
        if puzzle_id in self.secret_rooms:
            return self.secret_rooms[puzzle_id]
        return None
        
    def save_to_dict(self) -> Dict:
        """Save puzzle manager state to dictionary."""
        return {
            'solved_puzzles': self.solved_puzzles,
            'secret_rooms_discovered': [sr.room_id for sr in self.secret_rooms.values() if sr.discovered],
            'secret_rooms_looted': [sr.room_id for sr in self.secret_rooms.values() if sr.looted]
        }
        
    def load_from_dict(self, data: Dict):
        """Load puzzle manager state from dictionary."""
        self.solved_puzzles = data.get('solved_puzzles', [])
        
        # Mark secret rooms as discovered/looted based on saved data
        discovered = data.get('secret_rooms_discovered', [])
        looted = data.get('secret_rooms_looted', [])
        
        for room_id in discovered:
            if room_id in self.secret_rooms:
                self.secret_rooms[room_id].discovered = True
                
        for room_id in looted:
            if room_id in self.secret_rooms:
                self.secret_rooms[room_id].looted = True
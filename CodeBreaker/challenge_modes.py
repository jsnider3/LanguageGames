"""
Challenge Modes
Special gameplay modes for additional difficulty and variety.
"""

import time
import random
from typing import Dict, Any, Optional
from xenocode_vm import XenocodeVM
from ui import UI


class ChallengeMode:
    """Base class for challenge modes."""

    def __init__(self, ui: UI):
        self.ui = ui
        self.start_time = None

    def start(self):
        """Start the challenge."""
        self.start_time = time.time()

    def get_elapsed_time(self) -> float:
        """Get elapsed time in seconds."""
        if self.start_time:
            return time.time() - self.start_time
        return 0


class TimedMode(ChallengeMode):
    """Complete puzzle within time limit."""

    def __init__(self, ui: UI, time_limit: int = 60):
        super().__init__(ui)
        self.time_limit = time_limit

    def check_time_remaining(self) -> bool:
        """Check if time is still remaining. Returns False if time's up."""
        elapsed = self.get_elapsed_time()
        remaining = self.time_limit - elapsed

        if remaining <= 0:
            self.ui.print_error(f"⏱️  TIME'S UP! You had {self.time_limit} seconds.")
            return False

        if remaining <= 10:
            self.ui.print_warning(f"⏱️  {int(remaining)} seconds remaining!")

        return True

    def get_time_bonus(self) -> int:
        """Calculate time bonus points."""
        elapsed = self.get_elapsed_time()
        if elapsed < self.time_limit / 3:
            return 20  # Very fast
        elif elapsed < self.time_limit / 2:
            return 10  # Fast
        elif elapsed < self.time_limit:
            return 5   # Made it
        return 0


class BlindMode(ChallengeMode):
    """See output only, must deduce what code does without seeing it."""

    def __init__(self, ui: UI):
        super().__init__(ui)

    def show_puzzle(self, puzzle: Dict[str, Any]):
        """Show puzzle with code hidden."""
        self.ui.clear_screen()
        self.ui.print_title(f"BLIND MODE: {puzzle['title']}")

        print("🔒 CODE IS HIDDEN\n")
        print("Run the code to see outputs. Deduce what it does!\n")
        print(f"Arc: {puzzle['arc']}")
        print(f"Difficulty: {puzzle['difficulty']}\n")


class CipherMode(ChallengeMode):
    """Symbols are randomized but consistent within the puzzle."""

    def __init__(self, ui: UI, seed: Optional[int] = None):
        super().__init__(ui)
        self.seed = seed or random.randint(1, 999999)
        self.cipher_map = self._generate_cipher()

    def _generate_cipher(self) -> Dict[str, str]:
        """Generate randomized symbol mapping."""
        random.seed(self.seed)

        original_ops = ['⊕', '⊖', '⊛', '⊗', '⊘', '≈', '¬']
        shuffled_ops = original_ops.copy()
        random.shuffle(shuffled_ops)

        cipher = {}
        for orig, shuffled in zip(original_ops, shuffled_ops):
            cipher[orig] = shuffled

        return cipher

    def encipher_code(self, code: str) -> str:
        """Apply cipher to code."""
        enciphered = code
        for orig, cipher in self.cipher_map.items():
            enciphered = enciphered.replace(orig, f"TEMP_{orig}_")
        for orig, cipher in self.cipher_map.items():
            enciphered = enciphered.replace(f"TEMP_{orig}_", cipher)
        return enciphered

    def show_cipher_key(self):
        """Reveal the cipher key."""
        self.ui.print_title("CIPHER KEY")
        print("Original → Enciphered")
        for orig, cipher in sorted(self.cipher_map.items()):
            print(f"  {orig} → {cipher}")
        print()


class ModeManager:
    """Manages different challenge modes."""

    def __init__(self, ui: UI):
        self.ui = ui
        self.current_mode: Optional[ChallengeMode] = None
        self.mode_name: str = "normal"

    def activate_mode(self, mode_name: str, **kwargs) -> bool:
        """Activate a challenge mode."""
        if mode_name == "timed":
            self.current_mode = TimedMode(self.ui, kwargs.get('time_limit', 60))
            self.mode_name = "timed"
            return True
        elif mode_name == "blind":
            self.current_mode = BlindMode(self.ui)
            self.mode_name = "blind"
            return True
        elif mode_name == "cipher":
            self.current_mode = CipherMode(self.ui, kwargs.get('seed'))
            self.mode_name = "cipher"
            return True
        elif mode_name == "normal":
            self.current_mode = None
            self.mode_name = "normal"
            return True

        return False

    def is_mode_active(self) -> bool:
        """Check if any challenge mode is active."""
        return self.current_mode is not None

    def get_mode_name(self) -> str:
        """Get current mode name."""
        return self.mode_name
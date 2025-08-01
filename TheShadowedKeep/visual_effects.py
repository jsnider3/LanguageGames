"""
Visual effects system for The Shadowed Keep.
Handles ASCII art, color coding, animations, and visual enhancements.
"""
import sys
import time
import random
from typing import List, Dict, Optional


class Colors:
    """ANSI color codes for terminal output."""
    
    # Basic colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Bright colors
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'
    
    # Background colors
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'
    
    # Text formatting
    BOLD = '\033[1m'
    DIM = '\033[2m'
    ITALIC = '\033[3m'
    UNDERLINE = '\033[4m'
    BLINK = '\033[5m'
    REVERSE = '\033[7m'
    STRIKETHROUGH = '\033[9m'
    
    # Reset
    RESET = '\033[0m'
    END = '\033[0m'
    
    @classmethod
    def supports_color(cls) -> bool:
        """Check if the terminal supports ANSI colors."""
        # Check for common terminals that support colors
        term = sys.stdout.isatty()
        return term and (sys.platform != "win32" or "ANSICON" in sys.environ or "WT_SESSION" in sys.environ)


class ASCIIArt:
    """Collection of ASCII art for game elements."""
    
    # Monster ASCII art
    MONSTERS = {
        "goblin": [
            "   /\\   /\\  ",
            "  (  >.<  ) ",
            "   \\_\\_\\_/  ",
            "    |^^^|   "
        ],
        "slime": [
            "   ~~~~   ",
            "  /~~~~\\  ",
            " ( o  o ) ",
            "  \\____/  ",
            "   ^^^^   "
        ],
        "orc": [
            "  /\\_____/\\",
            " |  >   <  |",
            "  \\   ^   /",
            "   |-----|"
        ],
        "skeleton": [
            "    ___    ",
            "   /   \\   ",
            "  | () () |",
            "   \\  ^  / ",
            "    |||||  "
        ],
        "spider": [
            "  /\\  /\\  ",
            " /  \\/  \\ ",
            "(  ●  ●  )",
            " \\      / ",
            "  ||||||  "
        ],
        "troll": [
            "  /\\_____/\\",
            " |    _    |",
            " | (o) (o) |",
            "  \\   <>   /",
            "   |  __  | ",
            "   \\______/"
        ],
        "dragon": [
            "      /\\   /\\",
            "     (  . .)  ",
            "    o_)\\   /(_o",
            "         \\_/"
        ],
        "mimic": [
            " ┌─────────┐",
            " │ $$$$$$$ │",
            " │ ◉     ◉ │",
            " └─^─^─^─^─┘"
        ]
    }
    
    # Boss ASCII art
    BOSSES = {
        "goblin_king": [
            "      👑      ",
            "    /\\_👑_/\\  ",
            "   ( >   < ) ",
            "    \\  ∆  /  ",
            "   __|---|__ ",
            "  /  KING   \\"
        ],
        "orc_warlord": [
            "   ⚔️ WAR ⚔️   ",
            "  /\\_______/\\",
            " |  ▲     ▲  |",
            "  \\    ⌐   /",
            "   |WARLORD|",
            "   \\______/"
        ],
        "skeleton_lord": [
            "     💀👑💀     ",
            "    _______    ",
            "   /  ___  \\   ",
            "  | (💀) (💀) |",
            "   \\   ⌐   / ",
            "    |||||||||  ",
            "   LORD OF BONES"
        ],
        "shadow_lord": [
            "   ░▒▓ 👑 ▓▒░   ",
            "  ░▒▓▓▓▓▓▓▓▒░  ",
            " ░▒▓ ●   ● ▓▒░ ",
            "  ░▒▓▓ ∆ ▓▓▒░  ",
            "   ░▒▓▓▓▓▓▒░   ",
            "    SHADOW     "
        ]
    }
    
    # Item ASCII art
    ITEMS = {
        "sword": ["🗡️", "⚔️", "🔪"],
        "shield": ["🛡️", "🔰"],
        "potion": ["🧪", "⚗️"],
        "treasure": ["💰", "💎", "🏆"],
        "key": ["🗝️", "🔑"],
        "scroll": ["📜", "📋"]
    }
    
    # Room type ASCII art
    ROOMS = {
        "empty": [
            "┌─────────────────┐",
            "│                 │",
            "│       ...       │",
            "│                 │",
            "└─────────────────┘"
        ],
        "treasure": [
            "┌─────────────────┐",
            "│        💰       │",
            "│   💎  💰  💎    │",
            "│        💰       │",
            "└─────────────────┘"
        ],
        "monster": [
            "┌─────────────────┐",
            "│     ⚔️ 👹 ⚔️     │",
            "│       FIGHT      │",
            "│                 │",
            "└─────────────────┘"
        ],
        "boss": [
            "╔═════════════════╗",
            "║  🔥 👑 BOSS 👑 🔥  ║",
            "║    BEWARE!!!    ║",
            "║                 ║",
            "╚═════════════════╝"
        ],
        "merchant": [
            "┌─────────────────┐",
            "│      🏪 SHOP     │",
            "│  💰 ➤ 🛡️ ⚔️ 🧪   │",
            "│    WELCOME!     │",
            "└─────────────────┘"
        ]
    }
    
    # Title art
    TITLE = [
        "╔═══════════════════════════════════════════════════════════╗",
        "║                                                           ║",
        "║  ████████ ██   ██ ███████    ███████ ██   ██  █████     ║",
        "║     ██    ██   ██ ██         ██      ██   ██ ██   ██    ║",
        "║     ██    ███████ █████      ███████ ███████ ███████    ║",
        "║     ██    ██   ██ ██              ██ ██   ██ ██   ██    ║",
        "║     ██    ██   ██ ███████    ███████ ██   ██ ██   ██    ║",
        "║                                                           ║",
        "║         ██████   ██████  ██     ██ ███████ ██████        ║",
        "║         ██   ██ ██    ██ ██     ██ ██      ██   ██       ║",
        "║         ██   ██ ██    ██ ██  █  ██ █████   ██   ██       ║",
        "║         ██   ██ ██    ██ ██ ███ ██ ██      ██   ██       ║",
        "║         ██████   ██████   ███ ███  ███████ ██████        ║",
        "║                                                           ║",
        "║    ██   ██ ███████ ███████ ██████      ██                ║",
        "║    ██  ██  ██      ██      ██   ██    ██                 ║",
        "║    █████   █████   █████   ██████    ██                  ║",
        "║    ██  ██  ██      ██      ██       ██                   ║",
        "║    ██   ██ ███████ ███████ ██      ███████               ║",
        "║                                                           ║",
        "╚═══════════════════════════════════════════════════════════╝"
    ]
    
    @classmethod
    def get_monster_art(cls, monster_name: str) -> List[str]:
        """Get ASCII art for a monster."""
        name_lower = monster_name.lower()
        
        # Check for exact matches first
        if name_lower in cls.MONSTERS:
            return cls.MONSTERS[name_lower]
            
        # Check for partial matches
        for key in cls.MONSTERS:
            if key in name_lower or name_lower in key:
                return cls.MONSTERS[key]
                
        # Default generic monster
        return [
            "   /\\_/\\  ",
            "  ( o.o ) ",
            "   > ^ <  "
        ]
        
    @classmethod
    def get_boss_art(cls, boss_name: str) -> List[str]:
        """Get ASCII art for a boss."""
        name_lower = boss_name.lower().replace(" ", "_")
        
        if name_lower in cls.BOSSES:
            return cls.BOSSES[name_lower]
            
        # Default boss art
        return [
            "   👑 BOSS 👑   ",
            "  /\\_______/\\",
            " |  ▲     ▲  |",
            "  \\   ⌐   /",
            "   |DANGER|",
            "   \\______/"
        ]


class VisualEffects:
    """Handles visual effects, animations, and colored output."""
    
    def __init__(self):
        self.colors_enabled = Colors.supports_color()
        self.animations_enabled = True
        
    def colorize(self, text: str, color: str, bold: bool = False) -> str:
        """Add color to text if colors are supported."""
        if not self.colors_enabled:
            return text
            
        result = color + text + Colors.RESET
        if bold:
            result = Colors.BOLD + result
        return result
        
    def print_colored(self, text: str, color: str = Colors.WHITE, bold: bool = False):
        """Print colored text."""
        print(self.colorize(text, color, bold))
        
    def print_centered(self, text: str, width: int = 80, color: str = Colors.WHITE):
        """Print centered colored text."""
        centered = text.center(width)
        self.print_colored(centered, color)
        
    def animate_text(self, text: str, delay: float = 0.03):
        """Animate text by typing it out character by character."""
        if not self.animations_enabled:
            print(text)
            return
            
        for char in text:
            print(char, end='', flush=True)
            time.sleep(delay)
        print()  # New line at the end
        
    def print_ascii_art(self, art_lines: List[str], color: str = Colors.WHITE, center: bool = True):
        """Print ASCII art with optional color and centering."""
        for line in art_lines:
            if center:
                self.print_centered(line, color=color)
            else:
                self.print_colored(line, color)
                
    def flash_effect(self, text: str, color: str = Colors.BRIGHT_RED, flashes: int = 3):
        """Create a flashing text effect."""
        if not self.animations_enabled:
            self.print_colored(text, color, bold=True)
            return
            
        for i in range(flashes):
            print(f"\r{self.colorize(text, color, bold=True)}", end='', flush=True)
            time.sleep(0.2)
            print(f"\r{' ' * len(text)}", end='', flush=True)
            time.sleep(0.2)
        print(f"\r{self.colorize(text, color, bold=True)}")
        
    def progress_bar(self, current: int, maximum: int, width: int = 20, color: str = Colors.GREEN) -> str:
        """Create a colored progress bar."""
        if maximum == 0:
            percentage = 0
        else:
            percentage = current / maximum
            
        filled_width = int(width * percentage)
        bar = "█" * filled_width + "░" * (width - filled_width)
        
        if self.colors_enabled:
            # Color the filled portion
            filled_part = self.colorize("█" * filled_width, color)
            empty_part = self.colorize("░" * (width - filled_width), Colors.BRIGHT_BLACK)
            bar = filled_part + empty_part
            
        return f"[{bar}] {current}/{maximum}"
        
    def health_bar(self, current_hp: int, max_hp: int) -> str:
        """Create a colored health bar."""
        percentage = current_hp / max_hp if max_hp > 0 else 0
        
        if percentage > 0.6:
            color = Colors.GREEN
        elif percentage > 0.3:
            color = Colors.YELLOW
        else:
            color = Colors.RED
            
        return self.progress_bar(current_hp, max_hp, color=color)
        
    def mana_bar(self, current_mana: int, max_mana: int) -> str:
        """Create a colored mana bar."""
        return self.progress_bar(current_mana, max_mana, color=Colors.BLUE)
        
    def combat_animation(self, attacker: str, target: str, damage: int):
        """Animate a combat action."""
        if not self.animations_enabled:
            return
            
        # Simple combat animation
        combat_frames = [
            f"{attacker} ⚡    {target}",
            f"{attacker}  ⚡   {target}",
            f"{attacker}   ⚡  {target}",
            f"{attacker}    ⚡ {target}",
            f"{attacker}     💥{target}"
        ]
        
        for frame in combat_frames:
            print(f"\r{frame}", end='', flush=True)
            time.sleep(0.15)
            
        print(f"\r{' ' * len(combat_frames[-1])}", end='\r')
        self.flash_effect(f"💥 {damage} damage!", Colors.BRIGHT_RED, 1)
        
    def level_up_animation(self, new_level: int):
        """Animate level up with visual flair."""
        if self.animations_enabled:
            for i in range(3):
                self.print_colored("✨ ⭐ ✨ LEVEL UP! ✨ ⭐ ✨", Colors.BRIGHT_YELLOW, bold=True)
                time.sleep(0.3)
                print("\033[1A\033[2K", end='')  # Move up and clear line
                time.sleep(0.3)
                
        self.print_colored(f"🎉 CONGRATULATIONS! You reached level {new_level}! 🎉", Colors.BRIGHT_YELLOW, bold=True)
        
    def treasure_animation(self, gold_amount: int):
        """Animate treasure discovery."""
        treasure_frames = ["💰", "✨💰", "✨💰✨", "🌟✨💰✨🌟"]
        
        if self.animations_enabled:
            for frame in treasure_frames:
                print(f"\r{frame.center(20)}", end='', flush=True)
                time.sleep(0.2)
                
        self.print_colored(f"\n💰 Found {gold_amount} gold! 💰", Colors.BRIGHT_YELLOW, bold=True)
        
    def boss_entrance_animation(self, boss_name: str):
        """Epic boss entrance animation."""
        if self.animations_enabled:
            # Screen shake effect
            for _ in range(5):
                print("\n" * random.randint(0, 2), end='')
                time.sleep(0.1)
                
        # Boss title
        boss_art = ASCIIArt.get_boss_art(boss_name)
        self.print_colored("═" * 60, Colors.BRIGHT_RED)
        self.print_ascii_art(boss_art, Colors.BRIGHT_RED)
        self.print_colored("═" * 60, Colors.BRIGHT_RED)
        
        if self.animations_enabled:
            time.sleep(1)
            
    def death_animation(self):
        """Player death animation."""
        death_frames = [
            "💀",
            "⚰️",
            "🪦"
        ]
        
        if self.animations_enabled:
            for frame in death_frames:
                self.print_centered(frame, color=Colors.BRIGHT_RED)
                time.sleep(0.5)
                
        self.print_colored("GAME OVER", Colors.BRIGHT_RED, bold=True)
        
    def victory_animation(self):
        """Victory celebration animation."""
        if self.animations_enabled:
            celebration = ["🎉", "🎊", "🏆", "👑", "🌟"]
            for _ in range(10):
                symbol = random.choice(celebration)
                print(symbol, end=' ', flush=True)
                time.sleep(0.1)
            print()
            
        self.print_colored("🎉 VICTORY! 🎉", Colors.BRIGHT_YELLOW, bold=True)


# Global visual effects instance
visual_fx = VisualEffects()
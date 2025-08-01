"""
Combat log system for The Shadowed Keep.
Tracks and displays recent combat actions for better readability.
"""
from typing import List, Optional, Tuple, Dict
from collections import deque
from datetime import datetime
from visual_effects import visual_fx, Colors


class CombatLogEntry:
    """A single entry in the combat log."""
    
    def __init__(self, message: str, log_type: str = "action", turn: int = 0):
        self.message = message
        self.log_type = log_type  # action, damage, healing, status, system
        self.turn = turn
        self.timestamp = datetime.now()
        
    def format(self) -> str:
        """Format the log entry for display."""
        # Color based on type
        color_map = {
            "action": Colors.WHITE,
            "damage": Colors.BRIGHT_RED,
            "healing": Colors.BRIGHT_GREEN,
            "status": Colors.BRIGHT_YELLOW,
            "system": Colors.BRIGHT_CYAN,
            "critical": Colors.BRIGHT_MAGENTA
        }
        
        color = color_map.get(self.log_type, Colors.WHITE)
        
        # Add turn indicator for actions
        if self.turn > 0:
            turn_text = f"[Turn {self.turn}] "
        else:
            turn_text = ""
            
        return visual_fx.colorize(f"{turn_text}{self.message}", color)


class CombatLog:
    """Manages the combat log with a rolling buffer of recent actions."""
    
    def __init__(self, max_entries: int = 10):
        self.max_entries = max_entries
        self.entries = deque(maxlen=max_entries)
        self.current_turn = 0
        self.combat_active = False
        
    def start_combat(self):
        """Mark the start of a new combat."""
        self.combat_active = True
        self.current_turn = 0
        self.add_entry("⚔️ === COMBAT STARTED === ⚔️", "system")
        
    def end_combat(self, victory: bool = True):
        """Mark the end of combat."""
        self.combat_active = False
        if victory:
            self.add_entry("🏆 === VICTORY! === 🏆", "system")
        else:
            self.add_entry("💀 === DEFEATED === 💀", "system")
            
    def new_turn(self):
        """Increment the turn counter."""
        if self.combat_active:
            self.current_turn += 1
            
    def add_entry(self, message: str, log_type: str = "action"):
        """Add a new entry to the combat log."""
        entry = CombatLogEntry(message, log_type, self.current_turn)
        self.entries.append(entry)
        
    def add_action(self, action: str, actor: str = "You"):
        """Add a combat action to the log."""
        self.add_entry(f"{actor} used {action}!", "action")
        
    def add_damage(self, attacker: str, target: str, damage: int, critical: bool = False):
        """Add damage information to the log."""
        if critical:
            self.add_entry(f"💥 CRITICAL! {attacker} → {target}: {damage} damage!", "critical")
        else:
            self.add_entry(f"⚔️ {attacker} → {target}: {damage} damage", "damage")
            
    def add_healing(self, target: str, amount: int):
        """Add healing information to the log."""
        self.add_entry(f"💚 {target} healed {amount} HP", "healing")
        
    def add_status(self, target: str, status: str, applied: bool = True):
        """Add status effect information to the log."""
        if applied:
            self.add_entry(f"✨ {target} is now {status}!", "status")
        else:
            self.add_entry(f"✨ {target} is no longer {status}", "status")
            
    def add_miss(self, attacker: str, reason: str = "dodged"):
        """Add a miss/dodge to the log."""
        self.add_entry(f"✗ {attacker}'s attack was {reason}!", "action")
        
    def get_recent_entries(self, count: Optional[int] = None) -> List[CombatLogEntry]:
        """Get the most recent log entries."""
        if count is None:
            return list(self.entries)
        else:
            return list(self.entries)[-count:]
            
    def display(self, count: int = 5):
        """Display the combat log."""
        entries = self.get_recent_entries(count)
        
        if not entries:
            return
            
        # Display with a border
        print("\n" + "─" * 60)
        print(visual_fx.colorize("📜 COMBAT LOG (Last {} actions)".format(min(count, len(entries))), 
                               Colors.BRIGHT_CYAN, bold=True))
        print("─" * 60)
        
        for entry in entries:
            print(entry.format())
            
        print("─" * 60)
        
    def display_inline(self) -> List[str]:
        """Get the combat log as a list of formatted strings for inline display."""
        entries = self.get_recent_entries(5)
        if not entries:
            return []
            
        lines = []
        lines.append("─" * 40)
        lines.append("📜 Recent Actions:")
        
        for entry in entries:
            # Simplified format for inline display
            if entry.turn > 0:
                lines.append(f"  T{entry.turn}: {entry.message}")
            else:
                lines.append(f"  {entry.message}")
                
        return lines
        
    def clear(self):
        """Clear the combat log."""
        self.entries.clear()
        self.current_turn = 0
        self.combat_active = False
        
    def get_summary(self) -> Dict[str, int]:
        """Get a summary of combat actions."""
        summary = {
            "total_turns": self.current_turn,
            "actions": 0,
            "damage_dealt": 0,
            "damage_taken": 0,
            "healing": 0,
            "criticals": 0
        }
        
        for entry in self.entries:
            if entry.log_type == "action":
                summary["actions"] += 1
            elif entry.log_type == "critical":
                summary["criticals"] += 1
                
            # Parse damage/healing from messages
            if "damage" in entry.message and "→" in entry.message:
                try:
                    damage = int(entry.message.split(":")[1].split("damage")[0].strip())
                    if "You →" in entry.message:
                        summary["damage_dealt"] += damage
                    elif "→ You" in entry.message:
                        summary["damage_taken"] += damage
                except:
                    pass
                    
            if "healed" in entry.message:
                try:
                    healing = int(entry.message.split("healed")[1].split("HP")[0].strip())
                    summary["healing"] += healing
                except:
                    pass
                    
        return summary


# Global combat log instance
combat_log = CombatLog()
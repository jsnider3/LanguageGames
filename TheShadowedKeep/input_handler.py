"""
Input handler for The Shadowed Keep.
Handles keyboard input including arrow keys and special keys.
"""
import sys
import termios
import tty
from typing import Optional


class InputHandler:
    """Handles keyboard input including arrow keys."""
    
    def __init__(self):
        self.is_windows = sys.platform.startswith('win')
        
    def get_key(self) -> str:
        """
        Get a single keypress from the user.
        Returns the key as a string, with special handling for arrow keys.
        """
        if self.is_windows:
            return self._get_key_windows()
        else:
            return self._get_key_unix()
            
    def _get_key_windows(self) -> str:
        """Get key input on Windows."""
        try:
            import msvcrt
            
            # Get the first character
            key = msvcrt.getch()
            
            # Handle special keys (arrow keys, function keys, etc.)
            if key == b'\xe0' or key == b'\x00':  # Special key prefix
                key = msvcrt.getch()
                if key == b'H':  # Up arrow
                    return 'UP'
                elif key == b'P':  # Down arrow
                    return 'DOWN'
                elif key == b'K':  # Left arrow
                    return 'LEFT'
                elif key == b'M':  # Right arrow
                    return 'RIGHT'
                else:
                    return f'SPECIAL_{ord(key)}'
            else:
                # Regular key
                return key.decode('utf-8', errors='ignore')
                
        except ImportError:
            # Fallback if msvcrt not available
            return input().strip()
            
    def _get_key_unix(self) -> str:
        """Get key input on Unix/Linux/Mac."""
        try:
            # Save terminal settings
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            
            try:
                # Set terminal to raw mode
                tty.setraw(sys.stdin.fileno())
                
                # Read the key
                key = sys.stdin.read(1)
                
                # Handle escape sequences (arrow keys)
                if key == '\x1b':  # ESC sequence
                    # Read the next two characters
                    seq = sys.stdin.read(2)
                    if seq == '[A':
                        return 'UP'
                    elif seq == '[B':
                        return 'DOWN'
                    elif seq == '[D':
                        return 'LEFT'
                    elif seq == '[C':
                        return 'RIGHT'
                    else:
                        return f'ESC_{seq}'
                else:
                    return key
                    
            finally:
                # Restore terminal settings
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
                
        except (termios.error, tty.error):
            # Fallback if terminal control not available
            return input().strip()
            
    def get_input_with_arrows(self, prompt: str = "> ") -> str:
        """
        Get input from user, supporting both typed commands and arrow keys.
        Returns the command as a string.
        """
        print(prompt, end='', flush=True)
        
        if self.is_windows:
            return self._get_input_windows()
        else:
            return self._get_input_unix()
            
    def _get_input_windows(self) -> str:
        """Get line input on Windows with arrow key support."""
        try:
            import msvcrt
            
            line = ""
            while True:
                key = msvcrt.getch()
                
                # Handle special keys
                if key == b'\xe0' or key == b'\x00':
                    key = msvcrt.getch()
                    if key == b'H':  # Up arrow
                        return 'north'
                    elif key == b'P':  # Down arrow
                        return 'south'
                    elif key == b'K':  # Left arrow
                        return 'west'
                    elif key == b'M':  # Right arrow
                        return 'east'
                    # Ignore other special keys
                    continue
                    
                # Handle regular keys
                if key == b'\r':  # Enter
                    print()  # New line
                    return line.strip()
                elif key == b'\x08':  # Backspace
                    if line:
                        line = line[:-1]
                        print('\b \b', end='', flush=True)
                elif key == b'\x03':  # Ctrl+C
                    print()
                    raise KeyboardInterrupt
                else:
                    try:
                        char = key.decode('utf-8')
                        if char.isprintable():
                            line += char
                            print(char, end='', flush=True)
                    except UnicodeDecodeError:
                        pass
                        
        except ImportError:
            # Fallback
            return input().strip()
            
    def _get_input_unix(self) -> str:
        """Get line input on Unix with arrow key support."""
        try:
            import readline  # For better line editing
        except ImportError:
            pass
            
        try:
            # Save terminal settings
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            
            line = ""
            
            try:
                # Set terminal to cbreak mode (not raw, so we can handle Ctrl+C)
                tty.setcbreak(sys.stdin.fileno())
                
                while True:
                    key = sys.stdin.read(1)
                    
                    # Handle escape sequences
                    if key == '\x1b':
                        # Try to read the escape sequence
                        try:
                            seq = sys.stdin.read(2)
                            if seq == '[A':  # Up arrow
                                return 'north'
                            elif seq == '[B':  # Down arrow
                                return 'south'
                            elif seq == '[D':  # Left arrow
                                return 'west'
                            elif seq == '[C':  # Right arrow
                                return 'east'
                        except:
                            pass
                        continue
                        
                    # Handle regular keys
                    if key == '\n' or key == '\r':  # Enter
                        print()
                        return line.strip()
                    elif key == '\x7f' or key == '\x08':  # Backspace/Delete
                        if line:
                            line = line[:-1]
                            print('\b \b', end='', flush=True)
                    elif key == '\x03':  # Ctrl+C
                        print()
                        raise KeyboardInterrupt
                    elif key.isprintable():
                        line += key
                        print(key, end='', flush=True)
                        
            finally:
                # Restore terminal settings
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
                
        except (termios.error, tty.error):
            # Fallback to regular input
            return input().strip()


# Global input handler instance
input_handler = InputHandler()
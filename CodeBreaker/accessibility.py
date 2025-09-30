"""
Accessibility Features
Color-blind modes, adjustable font sizes, and other accessibility options.
"""

from enum import Enum
from typing import Dict


class ColorScheme(Enum):
    """Available color schemes."""
    DEFAULT = "default"
    COLORBLIND_DEUTERANOPIA = "deuteranopia"  # Red-green
    COLORBLIND_PROTANOPIA = "protanopia"       # Red-green variant
    COLORBLIND_TRITANOPIA = "tritanopia"       # Blue-yellow
    HIGH_CONTRAST = "high_contrast"
    MONOCHROME = "monochrome"


class FontSize(Enum):
    """Font size options (via terminal scaling hints)."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    XLARGE = "xlarge"


class AccessibilityManager:
    """Manages accessibility settings."""

    COLOR_SCHEMES = {
        ColorScheme.DEFAULT: {
            'keyword': '\033[96m',    # Cyan
            'operator': '\033[95m',   # Magenta
            'string': '\033[93m',     # Yellow
            'number': '\033[92m',     # Green
            'error': '\033[91m',      # Red
            'success': '\033[92m',    # Green
            'info': '\033[94m',       # Blue
            'reset': '\033[0m'
        },
        ColorScheme.COLORBLIND_DEUTERANOPIA: {
            'keyword': '\033[96m',    # Cyan
            'operator': '\033[94m',   # Blue
            'string': '\033[93m',     # Yellow
            'number': '\033[97m',     # White
            'error': '\033[91m',      # Red → Orange (approximated)
            'success': '\033[94m',    # Blue instead of green
            'info': '\033[96m',       # Cyan
            'reset': '\033[0m'
        },
        ColorScheme.HIGH_CONTRAST: {
            'keyword': '\033[1;97m',  # Bold white
            'operator': '\033[1;93m', # Bold yellow
            'string': '\033[1;96m',   # Bold cyan
            'number': '\033[1;92m',   # Bold green
            'error': '\033[1;91m',    # Bold red
            'success': '\033[1;92m',  # Bold green
            'info': '\033[1;94m',     # Bold blue
            'reset': '\033[0m'
        },
        ColorScheme.MONOCHROME: {
            'keyword': '\033[1m',     # Bold
            'operator': '\033[4m',    # Underline
            'string': '\033[3m',      # Italic
            'number': '\033[1m',      # Bold
            'error': '\033[1;4m',     # Bold + underline
            'success': '\033[1m',     # Bold
            'info': '\033[2m',        # Dim
            'reset': '\033[0m'
        },
    }

    FONT_SIZE_HINTS = {
        FontSize.SMALL: "Consider setting terminal font to 10-12pt",
        FontSize.MEDIUM: "Default terminal font size (12-14pt)",
        FontSize.LARGE: "Consider setting terminal font to 16-18pt",
        FontSize.XLARGE: "Consider setting terminal font to 20-24pt"
    }

    def __init__(self):
        self.color_scheme = ColorScheme.DEFAULT
        self.font_size = FontSize.MEDIUM
        self.screen_reader_mode = False
        self.reduce_motion = False

    def set_color_scheme(self, scheme: ColorScheme):
        """Set color scheme."""
        self.color_scheme = scheme

    def set_font_size(self, size: FontSize):
        """Set font size preference."""
        self.font_size = size
        print(f"\n{self.FONT_SIZE_HINTS[size]}\n")

    def get_colors(self) -> Dict[str, str]:
        """Get current color scheme."""
        return self.COLOR_SCHEMES[self.color_scheme]

    def enable_screen_reader_mode(self):
        """Enable screen reader friendly mode."""
        self.screen_reader_mode = True
        self.color_scheme = ColorScheme.MONOCHROME

    def enable_reduce_motion(self):
        """Reduce animations and transitions."""
        self.reduce_motion = True
#!/usr/bin/env python3
"""
LanguageGames Launcher
A unified launcher for all games in the LanguageGames collection.
"""

import os
import sys
import subprocess
import json
import webbrowser
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import shutil
import time
import socket

class Game:
    """Represents a game in the collection."""
    
    def __init__(self, name: str, path: Path, game_type: str, description: str, 
                 launch_file: str, genre: str = "Unknown"):
        self.name = name
        self.path = path
        self.game_type = game_type  # "python" or "web"
        self.description = description
        self.launch_file = launch_file
        self.genre = genre
        self.has_tests = self._check_for_tests()
        self.has_saves = self._check_for_saves()
    
    def _check_for_tests(self) -> bool:
        """Check if the game has test files."""
        test_patterns = ['test_*.py', '*_test.py', 'tests/', 'run_tests.py']
        for pattern in test_patterns:
            if list(self.path.glob(pattern)):
                return True
        return False
    
    def _check_for_saves(self) -> bool:
        """Check if the game has save functionality."""
        save_patterns = ['saves/', 'savegame.json', '*save*.json']
        for pattern in save_patterns:
            if list(self.path.glob(pattern)):
                return True
        return False
    
    def launch(self) -> bool:
        """Launch the game."""
        try:
            if self.game_type == "python":
                print(f"\n{'='*60}")
                print(f"Launching {self.name}...")
                print(f"{'='*60}\n")
                time.sleep(1)
                
                launch_path = self.path / self.launch_file
                try:
                    subprocess.run([sys.executable, str(launch_path)], cwd=str(self.path))
                except KeyboardInterrupt:
                    print(f"\n\n⏹️  {self.name} was interrupted by user.")
                return True
                
            elif self.game_type == "web":
                # Use a deterministic port based on the game name
                # Range 8000 - 8999
                port_offset = sum(ord(c) for c in self.name) % 1000
                target_port = 8000 + port_offset
                
                # Verify port is free (simple check)
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex(('localhost', target_port))
                if result == 0:
                    # Port is open (in use), try next one
                    print(f"Port {target_port} in use, trying next...")
                    target_port += 1
                sock.close()
                
                port = target_port
                
                print(f"\nStarting local server for {self.name} on port {port}...")
                
                try:
                    # Start server process
                    # We use python -m http.server to avoid CORS issues with ES modules
                    server_cmd = [sys.executable, "-m", "http.server", str(port)]
                    process = subprocess.Popen(server_cmd, cwd=str(self.path), 
                                             stdout=subprocess.DEVNULL, 
                                             stderr=subprocess.DEVNULL)
                    
                    # Wait a moment for startup
                    time.sleep(0.5)
                    
                    # Open browser
                    url = f"http://localhost:{port}/{self.launch_file}"
                    print(f"Opening {url}")
                    print("Press Ctrl+C to stop server and return to menu.")
                    
                    webbrowser.open(url)
                    
                    # Wait for user to stop
                    try:
                        process.wait()
                    except KeyboardInterrupt:
                        print("\nStopping server...")
                        process.terminate()
                        process.wait()
                        
                except Exception as e:
                    print(f"Error running web server: {e}")
                
                return True
                
        except Exception as e:
            print(f"Error launching {self.name}: {e}")
            return False
    
    def run_tests(self) -> bool:
        """Run the game's tests if available."""
        if not self.has_tests:
            print(f"No tests found for {self.name}")
            return False
        
        print(f"\nRunning tests for {self.name}...")
        try:
            # Try different test running methods
            if (self.path / "run_tests.py").exists():
                subprocess.run([sys.executable, "run_tests.py"], cwd=str(self.path))
            elif (self.path / "tests").exists():
                subprocess.run([sys.executable, "-m", "unittest", "discover", "tests"], 
                             cwd=str(self.path))
            else:
                # Look for test_*.py files
                test_files = list(self.path.glob("test_*.py"))
                if test_files:
                    for test_file in test_files:
                        subprocess.run([sys.executable, str(test_file)], cwd=str(self.path))
            return True
        except Exception as e:
            print(f"Error running tests: {e}")
            return False


class GameLauncher:
    """Main launcher application."""
    
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.games: List[Game] = []
        self.load_games()
    
    def load_games(self):
        """Discover and load all games in the collection."""
        # Define games with their metadata
        game_configs = [
            # Python games
            ("TheShadowedKeep", "python", "shadowkeep.py", "Roguelike/RPG",
             "A text-based roguelike dungeon crawler with procedural generation"),
            ("StarTrader", "python", "run_game.py", "Trading/Simulation",
             "A space trading simulation - build a trading empire in a dangerous galaxy"),
            ("CodeBreaker", "python", "main.py", "Puzzle/Programming",
             "Decode an alien programming language across 50 puzzles"),
            ("EchoBase", "python", "echobase.py", "Colony Simulation",
             "Command a base on a newly discovered planet"),
            ("TheCrimsonCase", "python", "game.py", "Detective/Mystery",
             "An interactive detective game where players solve a murder mystery"),
            ("ExplorerQuest", "python", "main.py", "Adventure",
             "A Python-based exploration game"),

            # Web games
            ("SaintDoom", "web", "index.html", "FPS/Action",
             "A 3D first-person shooter with demonic combat and boss battles"),
            ("NeonLogic", "web", "index.html", "Puzzle/Logic",
             "Cyberpunk circuit repair puzzle with drag-and-drop logic gates"),
            ("SyntaxCity", "web", "index.html", "Tower Defense/Educational",
             "Tower defense where towers and enemies are programming concepts"),
            ("Petri", "web", "index.html", "Simulation",
             "A programmable life simulator with customizable species"),
            ("StreetBrawler1992", "web", "index.html", "Arcade/Fighting",
             "A retro-style street fighting game"),
            ("VectorDodger", "web", "index.html", "Arcade/Bullet Hell",
             "A minimalist bullet hell arcade game with vector graphics"),
            ("TheShiftingSanity", "web", "index.html", "Horror/Interactive Fiction",
             "A psychological horror exploration game in a haunted mansion"),
            ("BlackHoleSim", "web", "blackhole-simulation.html", "Educational/Simulation",
             "An interactive 3D visualization of black hole physics"),
            ("VirtualEcosystem", "web", "index.html", "Simulation/Educational",
             "A browser-based ecosystem simulation"),
            ("VoidSpireDeckBuilder", "web", "index.html", "Roguelike Deck Builder",
             "A roguelike deck-builder - ascend the Void Spire through card combat"),
        ]
        
        for name, game_type, launch_file, genre, description in game_configs:
            game_path = self.base_path / name
            if game_path.exists():
                game = Game(name, game_path, game_type, description, launch_file, genre)
                self.games.append(game)
    
    def display_header(self):
        """Display the launcher header."""
        os.system('cls' if os.name == 'nt' else 'clear')
        print("╔" + "═" * 78 + "╗")
        print("║" + " " * 25 + "LANGUAGEGAMES LAUNCHER" + " " * 31 + "║")
        print("║" + " " * 20 + "AI-Generated Gaming Collection" + " " * 28 + "║")
        print("╚" + "═" * 78 + "╝")
        print()
    
    def display_games_menu(self):
        """Display the games selection menu."""
        print("\n📚 GAME LIBRARY:\n")
        
        # Group games by type
        python_games = [g for g in self.games if g.game_type == "python"]
        web_games = [g for g in self.games if g.game_type == "web"]
        
        if python_games:
            print("  🖥️  Terminal Games:")
            for i, game in enumerate(python_games, 1):
                status_icons = []
                if game.has_tests:
                    status_icons.append("🧪")
                if game.has_saves:
                    status_icons.append("💾")
                icons = " ".join(status_icons) if status_icons else ""
                print(f"    [{i:2}] {game.name:<20} - {game.genre:<20} {icons}")
                print(f"         {game.description}")
        
        if web_games:
            print("\n  🌐 Browser Games:")
            for i, game in enumerate(web_games, len(python_games) + 1):
                print(f"    [{i:2}] {game.name:<20} - {game.genre}")
                print(f"         {game.description}")
        
        print("\n  Legend: 🧪 = Has tests  💾 = Has save system")
    
    def display_options_menu(self):
        """Display additional options."""
        print("\n⚙️  OPTIONS:\n")
        print("    [T] Run tests for a game")
        print("    [R] Open repository README")
        print("    [S] Show game statistics")
        print("    [Q] Quit launcher")
    
    def show_statistics(self):
        """Display statistics about the game collection."""
        print("\n📊 COLLECTION STATISTICS:\n")
        
        total_games = len(self.games)
        python_count = sum(1 for g in self.games if g.game_type == "python")
        web_count = sum(1 for g in self.games if g.game_type == "web")
        test_count = sum(1 for g in self.games if g.has_tests)
        save_count = sum(1 for g in self.games if g.has_saves)
        
        # Count Python lines of code
        py_files = list(self.base_path.glob("**/*.py"))
        total_lines = 0
        for py_file in py_files:
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    total_lines += sum(1 for _ in f)
            except:
                pass
        
        print(f"  📦 Total Games: {total_games}")
        print(f"  🖥️  Terminal Games: {python_count}")
        print(f"  🌐 Browser Games: {web_count}")
        print(f"  🧪 Games with Tests: {test_count}")
        print(f"  💾 Games with Saves: {save_count}")
        print(f"  📝 Python Lines of Code: {total_lines:,}")
        print(f"  📁 Python Files: {len(py_files)}")
        
        # Genre breakdown
        genres = {}
        for game in self.games:
            genre = game.genre.split('/')[0]
            genres[genre] = genres.get(genre, 0) + 1
        
        print("\n  🎮 Genres:")
        for genre, count in sorted(genres.items()):
            print(f"     • {genre}: {count}")
    
    def run_tests_menu(self):
        """Menu for running game tests."""
        print("\n🧪 SELECT GAME TO TEST:\n")
        
        testable_games = [g for g in self.games if g.has_tests]
        if not testable_games:
            print("  No games with tests found.")
            return
        
        for i, game in enumerate(testable_games, 1):
            print(f"  [{i}] {game.name}")
        
        print("  [0] Cancel")
        
        try:
            choice = input("\n  Enter choice: ").strip()
            if choice == "0":
                return
            
            idx = int(choice) - 1
            if 0 <= idx < len(testable_games):
                testable_games[idx].run_tests()
                input("\nPress Enter to continue...")
        except (ValueError, IndexError):
            print("Invalid choice.")
    
    def run(self):
        """Main launcher loop."""
        while True:
            self.display_header()
            self.display_games_menu()
            self.display_options_menu()
            
            try:
                choice = input("\n🎮 Enter your choice: ").strip().upper()
            except (KeyboardInterrupt, EOFError):
                print("\n\n👋 Thanks for using LanguageGames Launcher!")
                break
            
            if choice == 'Q':
                print("\nThanks for playing! Goodbye! 👋")
                break
            
            elif choice == 'T':
                self.run_tests_menu()
            
            elif choice == 'R':
                readme_path = self.base_path / "README.md"
                if readme_path.exists():
                    with open(readme_path, 'r') as f:
                        content = f.read()
                    # Use less or more for pagination if available
                    if shutil.which('less'):
                        subprocess.run(['less'], input=content.encode())
                    else:
                        print(content)
                        input("\nPress Enter to continue...")
            
            elif choice == 'S':
                self.show_statistics()
                input("\nPress Enter to continue...")
            
            else:
                # Try to launch a game by number
                try:
                    game_idx = int(choice) - 1
                    if 0 <= game_idx < len(self.games):
                        self.games[game_idx].launch()
                        if self.games[game_idx].game_type == "python":
                            try:
                                input("\n\nPress Enter to return to launcher...")
                            except (KeyboardInterrupt, EOFError):
                                pass  # Just continue to the menu
                    else:
                        print("Invalid game number.")
                        time.sleep(1)
                except ValueError:
                    print("Invalid choice. Please enter a number or option letter.")
                    time.sleep(1)
                except KeyboardInterrupt:
                    # If interrupted during game launch, just continue
                    pass


def main():
    """Entry point for the launcher."""
    try:
        launcher = GameLauncher()
        
        # Check if a specific game was requested via command line
        if len(sys.argv) > 1:
            # Clean up the input - remove trailing slashes and path separators
            game_name = sys.argv[1].strip('/\\').lower()
            
            # Also handle if user provides a path like ./StreetBrawler1992
            if '/' in game_name or '\\' in game_name:
                game_name = os.path.basename(game_name).lower()
            
            for game in launcher.games:
                if game.name.lower() == game_name:
                    game.launch()
                    # Wait for user input after Python games when launched directly
                    if game.game_type == "python":
                        try:
                            input("\n\nPress Enter to exit...")
                        except (KeyboardInterrupt, EOFError):
                            pass
                    return
            print(f"Game '{sys.argv[1]}' not found.")
            print("Available games:", ", ".join(g.name for g in launcher.games))
        else:
            # Run interactive launcher
            launcher.run()
    
    except KeyboardInterrupt:
        print("\n\n🛑 Launcher interrupted. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
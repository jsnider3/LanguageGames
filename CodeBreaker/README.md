# CodeBreaker: A Reverse-Engineering Puzzle Game

![Version](https://img.shields.io/badge/version-1.0-blue)
![Python](https://img.shields.io/badge/python-3.7+-green)
![License](https://img.shields.io/badge/license-MIT-orange)

## 🌟 Overview

**CodeBreaker** is a terminal-based puzzle game where you play as a xenolinguist tasked with deciphering alien code recovered from a crashed spacecraft. You don't have documentation—just working programs and their observable behaviors.

**The Hook:** Learn by observation and experimentation. Each program is a mystery where you must infer what the code does by running it, testing inputs, and recognizing patterns.

## 🎮 Game Features

### Core Gameplay
- **50 Unique Puzzles** across 6 thematic arcs
- **Pattern Recognition** - Decode an alien programming language
- **Progressive Learning** - Start simple, master complex algorithms
- **Multiple Solution Paths** - Experiment your way or analyze systematically

### Systems
- **Analysis Tools** - Unlock 8 powerful debugging/analysis tools
- **Notebook System** - Document discoveries and build your symbol dictionary
- **Hint System** - Get unstuck with progressive hints (with score penalty)
- **Save System** - Your progress is automatically saved
- **Achievements** - Track your mastery
- **Rich Narrative** - Discover the truth behind the crashed ship

### Story Arcs
1. **Tutorial Arc (1-5)** - First Contact
2. **Logic Arc (6-12)** - Understanding Thought
3. **Iteration Arc (13-20)** - Patterns in Time
4. **Functions Arc (21-28)** - Modular Minds
5. **Data Structures Arc (29-36)** - Complex Organizations
6. **Advanced Arc (37-42)** - Alien Paradigms
7. **Final Challenge (43-50)** - The Message

## 📦 Installation

### Requirements
- Python 3.7 or higher
- No external dependencies required!

### Setup

```bash
# Clone or download the repository
cd CodeBreaker

# Make the main script executable (optional)
chmod +x main.py

# Run the game
python3 main.py
```

## 🎯 How to Play

### Starting the Game

```bash
python3 main.py
```

On first launch, you'll see the cinematic intro explaining your mission.

### Main Menu

- **Continue Game** - Resume from your current puzzle
- **Select Puzzle** - Jump to any unlocked puzzle
- **View Notebook** - Review your notes and discoveries
- **Analysis Tools** - Access unlocked debugging tools
- **Achievements** - Track your progress
- **Settings** - Configure game options

### Playing a Puzzle

When viewing a puzzle, you have these commands:

#### [R]un
Execute the current program with default or custom inputs. Watch the output to understand behavior.

```
Example:
>R
[OUTPUT]
  42
```

#### [I]nput
Change the input values for the program. Test edge cases!

```
Example:
>I
Enter new input value: 100
```

#### [A]nalyze
Use unlocked analysis tools:
- **Execution Tracer** - Step through code line-by-line
- **Pattern Matcher** - Find similar code in other puzzles
- **Frequency Analysis** - See which symbols appear most
- **Decompiler** - Get rough pseudocode translation
- **Cross-Reference** - Find related puzzles

#### [N]otes
Access your notebook:
- Add notes about observations
- View all notes across puzzles
- Check your symbol dictionary

#### [H]int
Get a progressive hint (costs points). Use sparingly!

```
Example:
>H
This is hint 1 of 3
Score penalty: -5 points
Use a hint? (y/n): y

[HINT]
  💡 Try running this with different array sizes
```

#### [S]olve
Submit your solution. Describe what the program does in your own words.

```
Example:
>S
Describe what this program does:
Solution: adds two numbers together and outputs the sum

✓ Perfect! You understood the code completely.
Score: 100/100
```

#### [B]ack
Return to main menu

## 🧩 The Xenocode Language

### Structural Keywords
- `§begin` / `§end` - Program blocks
- `§iterate` / `§end_iterate` - Loops
- `§if` / `§else` / `§end_if` - Conditionals
- `§function` / `§end_function` - Functions

### Data Commands
- `§transmit` - Output
- `§receive` - Input
- `§create_map` - Create dictionary
- `§create_array` - Create list
- `§exists` - Check if key exists
- `§null` - Null value

### Operators
- `←` - Assignment
- `⊕` - Addition
- `⊖` - Subtraction
- `⊗` - Greater than
- `⊘` - Less than
- `≈` - Equality
- `¬` - Logical NOT

## 💡 Tips for Success

1. **Always run the code first** - See what it does with default inputs
2. **Experiment with inputs** - Change values to understand behavior
3. **Look for patterns** - Symbols repeat for a reason
4. **Take notes** - Document your discoveries
5. **Compare puzzles** - Later puzzles build on earlier concepts
6. **Use analysis tools** - Unlock and leverage them strategically
7. **Read error messages** - They contain valuable clues

## 🏆 Achievements

- **First Contact** - Complete your first puzzle
- **Quick Learner** - Solve without hints
- **Pattern Master** - Complete 10 puzzles
- **Xenolinguist** - Complete 25 puzzles
- **Code Breaker** - Complete all 50 puzzles
- **Perfect Arc** - Complete an arc without hints
- **Diligent Scholar** - Write notes for 20 puzzles
- **Experimenter** - Run code 100 times
- **Speed Demon** - Solve a puzzle in under 2 minutes
- **True Understanding** - Unlock all analysis tools

## 🔧 Advanced Features

### Analysis Tools (Unlockable)

| Tool | Unlock At | Function |
|------|-----------|----------|
| Syntax Highlighter | Puzzle 3 | Colors similar constructs |
| Symbol Dictionary | Puzzle 5 | Auto-tracks symbol meanings |
| Execution Tracer | Puzzle 8 | Step-by-step execution |
| Pattern Matcher | Puzzle 12 | Find code across programs |
| Cross-Reference | Puzzle 15 | Map puzzle relationships |
| Behavior Comparator | Puzzle 20 | Compare outputs |
| Code Generator | Puzzle 25 | Test your own Xenocode |
| Decompiler | Puzzle 35 | Pseudocode translation |

### Notebook Export

Export all your notes to a text file:
1. Go to Settings
2. Select "Export Notebook"
3. Find `notebook_export.txt` in the game directory

### Save File

Your progress is saved in `codebreaker_save.json`. You can:
- Back it up to preserve progress
- Delete it to start fresh
- Share it with friends (though that's cheating!)

## 📚 File Structure

```
CodeBreaker/
├── main.py              # Main game loop
├── xenocode_vm.py       # Alien code interpreter
├── ui.py                # Terminal UI rendering
├── game_state.py        # Save/load system
├── puzzle_manager.py    # Puzzle loading
├── notebook.py          # Notes system
├── hints.py             # Hint delivery
├── analyzer.py          # Analysis tools
├── narrative.py         # Story system
├── scoring.py           # Achievements/scoring
├── puzzles/             # 50 puzzle files
│   ├── puzzle_01.json
│   ├── puzzle_02.json
│   └── ...
├── DESIGN.md            # Design document
└── README.md            # This file
```

## 🎨 Technical Details

### The Virtual Machine

The Xenocode VM is a custom interpreter that:
- Executes alien programs safely (sandboxed)
- Provides deterministic behavior
- Supports execution tracing
- Handles all Xenocode constructs

### Puzzle Format

Puzzles are JSON files with:
```json
{
  "id": "puzzle_01",
  "title": "First Contact",
  "difficulty": 1,
  "code": "§begin greeting\n  §transmit \"◈◈◈\"\n§end",
  "expected_output": "◈◈◈",
  "solution_description": "outputs a string",
  "hints": ["Try running it", "§transmit means output"],
  "unlock_requirements": [],
  "rewards": []
}
```

## 🐛 Troubleshooting

### Game won't start
```bash
# Check Python version
python3 --version  # Should be 3.7+

# Try running directly
python3 main.py
```

### Display issues
The game uses ANSI color codes. If colors don't work:
- Use a modern terminal (Terminal.app, iTerm2, Windows Terminal)
- Ensure TERM is set: `echo $TERM`

### Save file corrupted
Delete `codebreaker_save.json` to reset (loses progress)

## 🎯 Speedrun Mode Ideas

Want an extra challenge? Try:
- **No Hints Run** - Complete all puzzles without hints
- **Perfect Score** - Get 100/100 on every puzzle
- **Speed Run** - Complete the game in under 2 hours
- **Blind Run** - No notes, no analysis tools

## 🤝 Contributing

This is a complete game, but you can extend it:
- Create custom puzzles (add JSON files to `puzzles/`)
- Design new analysis tools
- Add languages for the UI
- Create alternate puzzle sets

## 📜 License

MIT License - Feel free to modify and share!

## 🙏 Credits

**Created by:** Claude (Anthropic)
**Genre:** Puzzle / Mystery / Programming
**Inspiration:** Every programmer who's ever stared at unfamiliar code trying to understand what it does

## 🌌 The Story

> Year 2157. A spacecraft of unknown origin crashed in the Mojave Desert.
> Inside: no crew, just a data core containing thousands of programs in an
> incomprehensible language.
>
> You're brought in as a pattern analyst. Your mission: decode these programs.
> What are they? Where did they come from? And what message are they trying
> to convey?
>
> Complete all 50 puzzles to uncover the truth...

## 🚀 Quick Start

```bash
# Install (no dependencies!)
cd CodeBreaker

# Play
python3 main.py

# Enjoy the journey!
```

---

*"May those who follow understand."* - Inscription found in the data core

---

## FAQ

**Q: Do I need to know programming?**
A: No! The game teaches pattern recognition, not syntax. Programmers will enjoy it, but non-programmers can succeed too.

**Q: How long does it take to complete?**
A: 5-10 hours depending on your pace. Some puzzles take minutes, others might need breaks.

**Q: Can I skip puzzles?**
A: Puzzles unlock sequentially. You must complete earlier ones to progress.

**Q: What if I'm completely stuck?**
A: Use hints! That's what they're for. You can also take breaks and come back with fresh eyes.

**Q: Is there a story?**
A: Yes! The narrative unfolds as you progress, with a powerful revelation at the end.

**Q: Can I create my own puzzles?**
A: Absolutely! Just create a JSON file following the puzzle format and add it to the `puzzles/` directory.

---

**Enjoy your journey through the alien code! Good luck, Xenolinguist.** 🛸
# The Shadowed Keep - Test Suite

This directory contains all unit and integration tests for The Shadowed Keep.

## Running Tests

### Run All Tests
```bash
# From the project root directory
python run_tests.py
```

### Run Specific Test File
```bash
# Run a specific test module
python -m unittest tests.test_combat

# Run with verbose output
python -m unittest tests.test_combat -v
```

### Run Specific Test Method
```bash
# Run a single test method
python -m unittest tests.test_combat.TestCombatManager.test_attack_action
```

## Test Organization

### Core System Tests
- `test_combat.py` - Combat mechanics and damage calculations
- `test_player.py` - Player stats, leveling, and character management
- `test_monsters.py` - Monster behaviors and special abilities
- `test_equipment.py` - Equipment system and stat modifiers
- `test_dungeon_map.py` - Map generation and navigation

### Feature Tests
- `test_achievements.py` - Achievement tracking and unlocks
- `test_bosses.py` - Boss mechanics and multi-phase battles
- `test_character_classes.py` - Class-specific abilities
- `test_consumables.py` - Item usage and inventory
- `test_status_effects.py` - Status effect application and duration

### System Tests
- `test_save_system.py` - Save/load functionality
- `test_room_content.py` - Room generation and variety
- `test_new_rooms.py` - Special room types (merchant, fountain, etc.)
- `test_difficulty.py` - Difficulty scaling and adaptation

### Specialized Tests
- `test_critical_hits.py` - Critical hit mechanics
- `test_progression.py` - XP and leveling system

## Writing New Tests

### Test Structure
```python
import unittest
from module_to_test import ClassToTest

class TestClassName(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.test_object = ClassToTest()
        
    def test_specific_behavior(self):
        """Test a specific behavior or method."""
        result = self.test_object.method_to_test()
        self.assertEqual(result, expected_value)
        
    def tearDown(self):
        """Clean up after each test method."""
        pass
```

### Testing Guidelines
1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should describe what they test
3. **Coverage**: Aim for both happy path and edge cases
4. **Speed**: Keep individual tests fast (<100ms)
5. **Determinism**: Use fixed seeds for random elements

### Common Test Patterns

#### Testing Combat
```python
def test_combat_scenario(self):
    player = Player("TestHero")
    enemy = Goblin()
    combat = CombatManager()
    combat.start_combat(player, enemy)
    
    result = combat.execute_action(CombatAction.ATTACK)
    self.assertTrue(result.damage_dealt > 0)
```

#### Testing with Mocks
```python
from unittest.mock import patch

def test_random_event(self):
    with patch('random.random', return_value=0.5):
        result = self.object.random_method()
        self.assertEqual(result, expected_for_0_5)
```

## Test Coverage

Current test coverage includes:
- Combat system: 95%+ coverage
- Player mechanics: 90%+ coverage
- Save/Load: 85%+ coverage
- Room generation: 80%+ coverage

## Continuous Testing

The test suite is designed to:
- Run quickly for rapid development feedback
- Catch regressions before they reach players
- Validate game balance and mechanics
- Ensure save compatibility

## Future Testing Goals

- [ ] Property-based testing for room generation
- [ ] Performance benchmarking suite
- [ ] Automated playtesting bots
- [ ] Integration tests for full game sessions
- [ ] Mutation testing for test quality
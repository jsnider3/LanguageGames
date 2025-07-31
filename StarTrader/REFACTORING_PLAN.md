# Star Trader Refactoring Plan

## Overview
The codebase has grown significantly and needs refactoring to improve maintainability, testability, and code organization.

## Priority 1: Critical Issues

### 1. Break up main.py (3611 lines)
The Game class has too many responsibilities. Extract into focused modules:

**Proposed structure:**
```
startrader/
├── commands/
│   ├── __init__.py
│   ├── trading.py      # buy, sell, trade, blackmarket
│   ├── navigation.py   # travel, map, explore, scan
│   ├── ship.py        # shipyard, repair, upgrade, fleet, switchship
│   ├── crew.py        # recruits, hire, fire, crew
│   ├── missions.py    # missions, accept, complete
│   ├── production.py  # produce, recipes, buildfactory, factories
│   └── game.py        # save, load, status, help, quit
```

### 2. Extract repeated patterns
Create a base command handler class with common validation.

### 3. Fix failing tests
Update tests to handle dynamic bonuses properly.

## Priority 2: Code Quality

### 1. Extract magic numbers to constants
Create a `constants.py` file for all game balance values.

### 2. Consolidate duplicate code
- Trade bonus calculations
- Reputation discount logic
- Command validation patterns

### 3. Improve error handling consistency
Establish patterns for validation and error messages.

## Priority 3: Architecture Improvements

### 1. Create service classes
- `TradingService` - handle all trading logic
- `NavigationService` - handle travel and exploration
- `CombatService` - handle combat encounters
- `EconomyService` - handle market updates and manipulation

### 2. Improve data structures
- Use dataclasses for complex data
- Create proper DTOs for save/load
- Type hints throughout

### 3. Better separation of concerns
- UI (command parsing) separate from business logic
- Data access separate from game logic
- Events/notifications system for game updates

## Implementation Order

1. **Fix failing tests** - Get back to green
2. **Extract constants** - Low risk, high value
3. **Create command modules** - Start with trading.py as pilot
4. **Refactor Game class** - Gradually move methods to new modules
5. **Add service layer** - After commands are extracted
6. **Improve tests** - Make them more resilient to changes

## Success Metrics
- No file > 500 lines
- All tests passing
- Clear separation of concerns
- Easier to add new features
- Better code reuse
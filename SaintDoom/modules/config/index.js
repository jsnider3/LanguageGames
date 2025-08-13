// Unified config wrapper to provide a single import surface
// for gameplay tuning (GAME_CONFIG) and engine/system constants (Constants.js).

import { GAME_CONFIG } from '../GameConfig.js';
import { THEME } from './theme.js';
import {
  PHYSICS as ENGINE_PHYSICS,
  MOVEMENT,
  COMBAT as ENGINE_COMBAT,
  ENEMY_AI,
  LEVEL_BOUNDS,
  RENDERING,
  AUDIO as ENGINE_AUDIO,
  UI as ENGINE_UI,
  ANIMATION as ENGINE_ANIMATION,
  PICKUPS as ENGINE_PICKUPS,
  NETWORK,
  PERFORMANCE,
  GAME_STATES,
  DAMAGE_TYPES,
  OBJECTIVE_TYPES,
  LEVEL_CONFIG,
  TIMERS,
  COLLISION,
  SHADOWS
} from '../Constants.js';

// Export a merged view while keeping gameplay vs engine namespaces distinct
export const Config = {
  gameplay: GAME_CONFIG,
  theme: THEME,
  engine: {
    PHYSICS: ENGINE_PHYSICS,
    MOVEMENT,
    COMBAT: ENGINE_COMBAT,
    ENEMY_AI,
    LEVEL_BOUNDS,
    RENDERING,
    AUDIO: ENGINE_AUDIO,
    UI: ENGINE_UI,
    ANIMATION: ENGINE_ANIMATION,
    PICKUPS: ENGINE_PICKUPS,
    NETWORK,
    PERFORMANCE,
    GAME_STATES,
    DAMAGE_TYPES,
    OBJECTIVE_TYPES,
    LEVEL_CONFIG,
    TIMERS,
    COLLISION,
    SHADOWS
  }
};

// Re-export the gameplay config and theme for convenience
export { GAME_CONFIG, THEME };


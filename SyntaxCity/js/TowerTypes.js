// SyntaxCity - Tower Types
// Most towers use the base Tower class with special properties
// This file is for any towers that need custom behavior

import { Tower } from './Tower.js';

// Factory function to create towers
export function createTower(type, gridX, gridY, x, y) {
    // All towers currently use the base Tower class
    // with their unique behavior defined by the special properties
    return new Tower(type, gridX, gridY, x, y);
}

// Export Tower class for use in other modules
export { Tower };

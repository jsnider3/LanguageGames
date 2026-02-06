/**
 * Species definitions for Petri
 * A species defines the appearance, attributes, and behaviors of a type of organism
 */

let speciesIdCounter = 0;

export function createSpecies(config = {}) {
    const id = `species_${++speciesIdCounter}`;

    return {
        id: id,
        name: config.name || `Species ${speciesIdCounter}`,
        color: config.color || getRandomColor(),
        size: config.size || 6,

        // Movement
        maxSpeed: config.maxSpeed || 80,
        senseRange: config.senseRange || 60,

        // Energy
        startingEnergy: config.startingEnergy || 100,
        energyDecay: config.energyDecay || 5, // energy lost per second

        // Reproduction
        reproductionThreshold: config.reproductionThreshold || 150,
        reproductionCost: config.reproductionCost || 60,
        mutationRate: config.mutationRate || 0.05,

        // Behaviors with weights
        behaviors: {
            wander: {
                enabled: config.behaviors?.wander?.enabled ?? true,
                weight: config.behaviors?.wander?.weight ?? 0.5
            },
            seekFood: {
                enabled: config.behaviors?.seekFood?.enabled ?? true,
                weight: config.behaviors?.seekFood?.weight ?? 1.0
            },
            avoidEdge: {
                enabled: config.behaviors?.avoidEdge?.enabled ?? false,
                weight: config.behaviors?.avoidEdge?.weight ?? 1.0
            },
            flock: {
                enabled: config.behaviors?.flock?.enabled ?? false,
                weight: config.behaviors?.flock?.weight ?? 0.5
            },
            align: {
                enabled: config.behaviors?.align?.enabled ?? false,
                weight: config.behaviors?.align?.weight ?? 0.5
            },
            avoidCrowding: {
                enabled: config.behaviors?.avoidCrowding?.enabled ?? false,
                weight: config.behaviors?.avoidCrowding?.weight ?? 0.8
            },
            fleePredator: {
                enabled: config.behaviors?.fleePredator?.enabled ?? false,
                weight: config.behaviors?.fleePredator?.weight ?? 1.5
            },
            huntPrey: {
                enabled: config.behaviors?.huntPrey?.enabled ?? false,
                weight: config.behaviors?.huntPrey?.weight ?? 1.0
            },
            seekCenter: {
                enabled: config.behaviors?.seekCenter?.enabled ?? false,
                weight: config.behaviors?.seekCenter?.weight ?? 0.3
            },
            avoidSameSpecies: {
                enabled: config.behaviors?.avoidSameSpecies?.enabled ?? false,
                weight: config.behaviors?.avoidSameSpecies?.weight ?? 1.0
            }
        }
    };
}

/**
 * Generate a random pleasing color
 */
function getRandomColor() {
    const hue = Math.random() * 360;
    const saturation = 60 + Math.random() * 30;
    const lightness = 50 + Math.random() * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Default species presets
 */
export const presets = {
    grazer: () => createSpecies({
        name: 'Grazer',
        color: '#4CAF50',
        size: 5,
        maxSpeed: 60,
        senseRange: 80,
        startingEnergy: 80,
        reproductionThreshold: 120,
        reproductionCost: 50,
        behaviors: {
            wander: { enabled: true, weight: 0.3 },
            seekFood: { enabled: true, weight: 1.2 },
            avoidEdge: { enabled: true, weight: 1.0 },
            flock: { enabled: true, weight: 0.6 },
            align: { enabled: true, weight: 0.3 },
            avoidCrowding: { enabled: true, weight: 0.5 },
            fleePredator: { enabled: true, weight: 1.5 },
            huntPrey: { enabled: false, weight: 0 },
            seekCenter: { enabled: false, weight: 0 },
            avoidSameSpecies: { enabled: false, weight: 0 }
        }
    }),

    predator: () => createSpecies({
        name: 'Predator',
        color: '#f44336',
        size: 10,
        maxSpeed: 100,
        senseRange: 100,
        startingEnergy: 150,
        energyDecay: 8,
        reproductionThreshold: 200,
        reproductionCost: 80,
        behaviors: {
            wander: { enabled: true, weight: 0.4 },
            seekFood: { enabled: true, weight: 0.5 },
            avoidEdge: { enabled: true, weight: 1.0 },
            flock: { enabled: false, weight: 0 },
            align: { enabled: false, weight: 0 },
            avoidCrowding: { enabled: true, weight: 0.3 },
            fleePredator: { enabled: false, weight: 0 },
            huntPrey: { enabled: true, weight: 1.5 },
            seekCenter: { enabled: false, weight: 0 },
            avoidSameSpecies: { enabled: true, weight: 0.8 }
        }
    }),

    swarmer: () => createSpecies({
        name: 'Swarmer',
        color: '#FF9800',
        size: 4,
        maxSpeed: 90,
        senseRange: 50,
        startingEnergy: 60,
        reproductionThreshold: 100,
        reproductionCost: 40,
        behaviors: {
            wander: { enabled: true, weight: 0.2 },
            seekFood: { enabled: true, weight: 1.0 },
            avoidEdge: { enabled: true, weight: 0.8 },
            flock: { enabled: true, weight: 1.2 },
            align: { enabled: true, weight: 0.8 },
            avoidCrowding: { enabled: true, weight: 0.8 },
            fleePredator: { enabled: true, weight: 1.0 },
            huntPrey: { enabled: false, weight: 0 },
            seekCenter: { enabled: false, weight: 0 },
            avoidSameSpecies: { enabled: false, weight: 0 }
        }
    }),

    loner: () => createSpecies({
        name: 'Loner',
        color: '#9C27B0',
        size: 7,
        maxSpeed: 70,
        senseRange: 120,
        startingEnergy: 120,
        reproductionThreshold: 180,
        reproductionCost: 70,
        behaviors: {
            wander: { enabled: true, weight: 0.6 },
            seekFood: { enabled: true, weight: 1.0 },
            avoidEdge: { enabled: true, weight: 1.0 },
            flock: { enabled: false, weight: 0 },
            align: { enabled: false, weight: 0 },
            avoidCrowding: { enabled: true, weight: 1.5 },
            fleePredator: { enabled: true, weight: 1.2 },
            huntPrey: { enabled: false, weight: 0 },
            seekCenter: { enabled: false, weight: 0 },
            avoidSameSpecies: { enabled: true, weight: 1.0 }
        }
    }),

    blob: () => createSpecies({
        name: 'Blob',
        color: '#00BCD4',
        size: 12,
        maxSpeed: 40,
        senseRange: 40,
        startingEnergy: 200,
        energyDecay: 3,
        reproductionThreshold: 250,
        reproductionCost: 100,
        behaviors: {
            wander: { enabled: true, weight: 0.8 },
            seekFood: { enabled: true, weight: 0.8 },
            avoidEdge: { enabled: true, weight: 0.5 },
            flock: { enabled: false, weight: 0 },
            align: { enabled: false, weight: 0 },
            avoidCrowding: { enabled: false, weight: 0 },
            fleePredator: { enabled: false, weight: 0 },
            huntPrey: { enabled: false, weight: 0 },
            seekCenter: { enabled: true, weight: 0.5 },
            avoidSameSpecies: { enabled: false, weight: 0 }
        }
    })
};

/**
 * Clone a species with modifications
 */
export function cloneSpecies(species, modifications = {}) {
    const cloned = JSON.parse(JSON.stringify(species));
    cloned.id = `species_${++speciesIdCounter}`;

    // Apply modifications
    Object.assign(cloned, modifications);

    return cloned;
}

/**
 * Challenge system for Petri
 * Defines goals and tracks progress
 */

export const challenges = {
    sandbox: {
        id: 'sandbox',
        name: 'Sandbox',
        description: 'Free play mode. Experiment with different species and see what emerges.',
        goals: [],
        check: () => ({ complete: false, progress: null })
    },

    survival: {
        id: 'survival',
        name: 'Survival',
        description: 'Keep at least one organism alive for 60 seconds.',
        goals: [
            { text: 'Survive for 60 seconds', target: 60 }
        ],
        check: (sim) => {
            if (sim.organisms.length === 0) {
                return { complete: false, progress: 'Failed! All organisms died.', failed: true };
            }
            const progress = Math.min(sim.time, 60);
            return {
                complete: sim.time >= 60,
                progress: `${Math.floor(progress)}/60 seconds`
            };
        }
    },

    dominance: {
        id: 'dominance',
        name: 'Dominance',
        description: 'Grow a single species to 100 population.',
        goals: [
            { text: 'Reach 100 population', target: 100 }
        ],
        check: (sim) => {
            const maxPop = sim.organisms.length;
            return {
                complete: maxPop >= 100,
                progress: `${maxPop}/100 organisms`
            };
        }
    },

    ecosystem: {
        id: 'ecosystem',
        name: 'Ecosystem',
        description: 'Maintain 3 or more species coexisting (each with 5+ population) for 30 seconds.',
        goals: [
            { text: 'Have 3+ species with 5+ each', target: 3 },
            { text: 'Maintain for 30 seconds', target: 30 }
        ],
        state: { stableTime: 0 },
        check: (sim, dt, state) => {
            // Count species with 5+ population
            const speciesCounts = new Map();
            for (const org of sim.organisms) {
                const count = speciesCounts.get(org.species.id) || 0;
                speciesCounts.set(org.species.id, count + 1);
            }

            let viableSpecies = 0;
            for (const count of speciesCounts.values()) {
                if (count >= 5) viableSpecies++;
            }

            if (viableSpecies >= 3) {
                state.stableTime = (state.stableTime || 0) + dt;
            } else {
                state.stableTime = 0;
            }

            return {
                complete: state.stableTime >= 30,
                progress: viableSpecies >= 3
                    ? `${viableSpecies} species stable: ${Math.floor(state.stableTime)}/30s`
                    : `${viableSpecies}/3 viable species`
            };
        }
    },

    predatorPrey: {
        id: 'predatorPrey',
        name: 'Predator & Prey',
        description: 'Create a stable predator-prey cycle. Both must survive for 90 seconds.',
        goals: [
            { text: 'Have predators and prey coexist', target: 2 },
            { text: 'Maintain for 90 seconds', target: 90 }
        ],
        state: { stableTime: 0 },
        check: (sim, dt, state) => {
            let hasPredator = false;
            let hasPrey = false;

            for (const org of sim.organisms) {
                if (org.species.behaviors.huntPrey?.enabled) {
                    hasPredator = true;
                } else {
                    hasPrey = true;
                }
            }

            if (hasPredator && hasPrey) {
                state.stableTime = (state.stableTime || 0) + dt;
            } else {
                state.stableTime = 0;
            }

            return {
                complete: state.stableTime >= 90,
                progress: hasPredator && hasPrey
                    ? `Coexisting: ${Math.floor(state.stableTime)}/90s`
                    : `Need both predators and prey`
            };
        }
    },

    extinction: {
        id: 'extinction',
        name: 'Controlled Extinction',
        description: 'Create a predator species that drives prey to extinction, then dies out itself.',
        goals: [
            { text: 'Prey goes extinct', target: 1 },
            { text: 'Predators follow', target: 1 }
        ],
        state: { preyExtinct: false, predatorExtinct: false },
        check: (sim, dt, state) => {
            let predatorCount = 0;
            let preyCount = 0;

            for (const org of sim.organisms) {
                if (org.species.behaviors.huntPrey?.enabled) {
                    predatorCount++;
                } else {
                    preyCount++;
                }
            }

            if (preyCount === 0 && predatorCount > 0) {
                state.preyExtinct = true;
            }

            if (state.preyExtinct && predatorCount === 0) {
                state.predatorExtinct = true;
            }

            if (state.predatorExtinct) {
                return { complete: true, progress: 'Complete! The ecosystem collapsed.' };
            } else if (state.preyExtinct) {
                return { complete: false, progress: `Prey extinct. Predators: ${predatorCount}` };
            } else {
                return { complete: false, progress: `Prey: ${preyCount}, Predators: ${predatorCount}` };
            }
        }
    },

    swarm: {
        id: 'swarm',
        name: 'Swarm Intelligence',
        description: 'Create a species that moves as a cohesive swarm of 50+ organisms.',
        goals: [
            { text: 'Have 50+ organisms', target: 50 },
            { text: 'All within close proximity', target: 1 }
        ],
        check: (sim) => {
            if (sim.organisms.length < 50) {
                return { complete: false, progress: `${sim.organisms.length}/50 organisms` };
            }

            // Check if organisms are clustered
            const cx = sim.organisms.reduce((sum, o) => sum + o.x, 0) / sim.organisms.length;
            const cy = sim.organisms.reduce((sum, o) => sum + o.y, 0) / sim.organisms.length;

            let inCluster = 0;
            const clusterRadius = 150;

            for (const org of sim.organisms) {
                const dx = org.x - cx;
                const dy = org.y - cy;
                if (dx * dx + dy * dy < clusterRadius * clusterRadius) {
                    inCluster++;
                }
            }

            const clusterRatio = inCluster / sim.organisms.length;

            return {
                complete: clusterRatio >= 0.8,
                progress: `${Math.round(clusterRatio * 100)}% in swarm (need 80%)`
            };
        }
    }
};

export class ChallengeManager {
    constructor(simulation) {
        this.simulation = simulation;
        this.currentChallenge = challenges.sandbox;
        this.challengeState = {};
        this.onProgressUpdate = null;
    }

    setChallenge(challengeId) {
        this.currentChallenge = challenges[challengeId] || challenges.sandbox;
        this.challengeState = {};
    }

    update(dt) {
        if (!this.currentChallenge || this.currentChallenge.id === 'sandbox') {
            return;
        }

        const result = this.currentChallenge.check(this.simulation, dt, this.challengeState);

        if (this.onProgressUpdate) {
            this.onProgressUpdate(result);
        }

        return result;
    }
}

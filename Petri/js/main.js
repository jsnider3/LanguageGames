/**
 * Petri - Programmable Life Simulator
 * Main entry point
 */

import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { ChallengeManager, challenges } from './challenges.js';
import { PopulationGraph } from './graph.js';
import { EffectsSystem } from './effects.js';

class Petri {
    constructor() {
        this.canvas = document.getElementById('petri-dish');
        this.simulation = null;
        this.renderer = null;
        this.ui = null;
        this.challengeManager = null;
        this.populationGraph = null;
        this.effects = null;

        this.lastTime = 0;
        this.running = true;

        this.init();
    }

    init() {
        // Create simulation
        this.simulation = new Simulation(700, 700);

        // Create effects system
        this.effects = new EffectsSystem();

        // Create renderer
        this.renderer = new Renderer(this.canvas, this.simulation);
        this.renderer.effects = this.effects;

        // Hook up simulation events for effects
        this.simulation.onOrganismBorn = (organism) => {
            this.effects.birth(organism.x, organism.y, organism.species.color);
        };

        this.simulation.onOrganismDied = (organism) => {
            this.effects.death(organism.x, organism.y, organism.species.color);
        };

        // Create challenge manager
        this.challengeManager = new ChallengeManager(this.simulation);
        this.challengeManager.onProgressUpdate = (result) => {
            const progressEl = document.getElementById('challenge-progress');
            if (progressEl) {
                progressEl.textContent = result.progress || '';
                if (result.complete) {
                    progressEl.style.color = '#4CAF50';
                    progressEl.textContent = 'Challenge Complete! ' + result.progress;
                } else if (result.failed) {
                    progressEl.style.color = '#f44336';
                } else {
                    progressEl.style.color = '';
                }
            }
        };

        // Create UI
        this.ui = new UI(this.simulation, this.renderer);

        // Create population graph
        const graphCanvas = document.getElementById('population-graph');
        this.populationGraph = new PopulationGraph(graphCanvas);

        // Hook up challenge selector
        const challengeSelect = document.getElementById('challenge-select');
        challengeSelect.addEventListener('change', () => {
            this.challengeManager.setChallenge(challengeSelect.value);
            document.getElementById('challenge-progress').textContent = '';
            document.getElementById('challenge-progress').style.color = '';
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.resize();
            this.populationGraph.resize();
        });

        // Clear graph on reset
        const origReset = this.ui.resetSimulation.bind(this.ui);
        this.ui.resetSimulation = () => {
            origReset();
            this.populationGraph.clear();
        };

        // Start the game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));

        console.log('Petri initialized');
        console.log('Click the dish to spawn food');
        console.log('Shift+click a species in the list, then click the dish to spawn organisms');
    }

    gameLoop(currentTime) {
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap delta time to prevent huge jumps
        const cappedDt = Math.min(dt, 0.1);

        // Update simulation
        this.simulation.update(cappedDt);

        // Update effects
        this.effects.update(cappedDt);

        // Update challenge
        if (this.simulation.running) {
            this.challengeManager.update(cappedDt);
            this.populationGraph.sample(this.simulation);
        }

        // Render
        this.renderer.render();
        this.populationGraph.render(this.simulation);

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.petri = new Petri();
});

// Debug helper
window.debugPetri = function() {
    const sim = window.petri.simulation;
    console.log('=== Petri Debug ===');
    console.log('Running:', sim.running);
    console.log('Time:', sim.time.toFixed(1) + 's');
    console.log('Organisms:', sim.organisms.length);
    console.log('Food:', sim.food.length);
    console.log('Species:', sim.species.size);
    console.log('Generation:', sim.generation);
    console.log('Stats:', sim.getStats());
};

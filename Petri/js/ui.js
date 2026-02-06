/**
 * UI management for Petri
 * Handles all user interface interactions
 */

import { createSpecies, presets, cloneSpecies } from './species.js';

export class UI {
    constructor(simulation, renderer) {
        this.simulation = simulation;
        this.renderer = renderer;

        this.editingSpecies = null;
        this.selectedSpecies = null;
        this.placingObstacle = false;

        this.initControls();
        this.initModal();
        this.initSpeciesEditor();
        this.initChallenges();

        // Create default species
        this.createDefaultSpecies();
    }

    /**
     * Initialize simulation controls
     */
    initControls() {
        // Play/Pause button
        const btnPlay = document.getElementById('btn-play');
        btnPlay.addEventListener('click', () => {
            const running = this.simulation.toggle();
            btnPlay.querySelector('.icon').textContent = running ? '⏸' : '▶';
        });

        // Step button
        document.getElementById('btn-step').addEventListener('click', () => {
            this.simulation.step();
        });

        // Reset button
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.resetSimulation();
        });

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', () => {
            this.simulation.speed = parseFloat(speedSlider.value);
            speedValue.textContent = `${speedSlider.value}x`;
        });

        // Food spawn rate
        const foodRateSlider = document.getElementById('food-rate');
        const foodRateValue = document.getElementById('food-rate-value');
        foodRateSlider.addEventListener('input', () => {
            this.simulation.foodSpawnRate = parseFloat(foodRateSlider.value);
            foodRateValue.textContent = `${foodRateSlider.value}/s`;
        });

        // Food energy
        const foodEnergySlider = document.getElementById('food-energy');
        const foodEnergyValue = document.getElementById('food-energy-value');
        foodEnergySlider.addEventListener('input', () => {
            this.simulation.foodEnergy = parseInt(foodEnergySlider.value);
            foodEnergyValue.textContent = foodEnergySlider.value;
        });

        // New species button
        document.getElementById('btn-new-species').addEventListener('click', () => {
            this.openSpeciesEditor(null);
        });

        // Preset selector
        const presetSelect = document.getElementById('preset-select');
        presetSelect.addEventListener('change', () => {
            const presetName = presetSelect.value;
            if (presetName && presets[presetName]) {
                const species = presets[presetName]();
                this.simulation.addSpecies(species);
                this.updateSpeciesList();

                // Spawn initial organisms
                for (let i = 0; i < 10; i++) {
                    this.simulation.spawnOrganism(species);
                }
            }
            presetSelect.value = ''; // Reset selection
        });

        // Obstacle controls
        document.getElementById('btn-add-obstacle').addEventListener('click', () => {
            this.placingObstacle = true;
            this.selectedSpecies = null;
            this.updateSpeciesList();
            document.getElementById('obstacle-hint').style.display = 'block';
            this.renderer.canvas.style.cursor = 'crosshair';
        });

        document.getElementById('btn-clear-obstacles').addEventListener('click', () => {
            this.simulation.clearObstacles();
        });

        // Canvas click - spawn food, organisms, or obstacles
        this.renderer.canvas.addEventListener('click', (e) => {
            const pos = this.renderer.getClickPosition(e);
            if (this.renderer.isInsideDish(pos.x, pos.y)) {
                if (this.placingObstacle) {
                    // Place obstacle
                    const radius = 20 + Math.random() * 20;
                    this.simulation.addObstacle(pos.x, pos.y, radius);
                    this.placingObstacle = false;
                    document.getElementById('obstacle-hint').style.display = 'none';
                    this.renderer.canvas.style.cursor = 'crosshair';
                } else if (this.selectedSpecies) {
                    // Spawn organism of selected species
                    this.simulation.spawnOrganism(this.selectedSpecies, pos.x, pos.y);
                } else {
                    // Spawn food
                    this.simulation.spawnFood(pos.x, pos.y);
                }
            }
        });

        // Stats update callback
        this.simulation.onStatsUpdate = (stats) => {
            this.updateStats(stats);
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    btnPlay.click();
                    break;
                case 'KeyR':
                    if (!e.ctrlKey && !e.metaKey) {
                        document.getElementById('btn-reset').click();
                    }
                    break;
                case 'Period':
                    document.getElementById('btn-step').click();
                    break;
            }
        });
    }

    /**
     * Initialize modal functionality
     */
    initModal() {
        const modal = document.getElementById('species-modal');
        const closeBtn = document.getElementById('btn-close-modal');

        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * Initialize species editor
     */
    initSpeciesEditor() {
        // Update weight display values
        const weightInputs = document.querySelectorAll('.behavior-config input[type="range"]');
        weightInputs.forEach(input => {
            const valueSpan = input.nextElementSibling;
            input.addEventListener('input', () => {
                valueSpan.textContent = input.value;
            });
        });

        // Update attribute display values
        const attrIds = ['species-size', 'species-speed', 'species-sense', 'species-energy',
            'repro-threshold', 'repro-cost', 'mutation-rate'];
        attrIds.forEach(id => {
            const input = document.getElementById(id);
            const valueSpan = document.getElementById(id + '-value');
            if (input && valueSpan) {
                input.addEventListener('input', () => {
                    if (id === 'mutation-rate') {
                        valueSpan.textContent = `${Math.round(input.value * 100)}%`;
                    } else {
                        valueSpan.textContent = input.value;
                    }
                });
            }
        });

        // Save button
        document.getElementById('btn-save-species').addEventListener('click', () => {
            this.saveSpecies();
        });

        // Spawn button
        document.getElementById('btn-spawn-species').addEventListener('click', () => {
            this.spawnFromEditor(10);
        });

        // Delete button
        document.getElementById('btn-delete-species').addEventListener('click', () => {
            this.deleteSpecies();
        });
    }

    /**
     * Initialize challenge system
     */
    initChallenges() {
        const challengeSelect = document.getElementById('challenge-select');
        const description = document.getElementById('challenge-description');

        const challenges = {
            sandbox: 'Free play mode. Experiment with different species and see what emerges.',
            survival: 'Keep at least one organism alive for 60 seconds.',
            dominance: 'Grow a single species to 100 population.',
            ecosystem: 'Maintain 3+ species (each with 5+ population) coexisting for 30 seconds.',
            predatorPrey: 'Create a stable predator-prey cycle. Both must survive for 90 seconds.',
            swarm: 'Create a species that moves as a cohesive swarm of 50+ organisms.',
            extinction: 'Create a predator that drives prey to extinction, then dies out itself.'
        };

        challengeSelect.addEventListener('change', () => {
            const challenge = challengeSelect.value;
            description.textContent = challenges[challenge] || '';
        });

        // Set initial description
        description.textContent = challenges.sandbox;
    }

    /**
     * Create default species to start with
     */
    createDefaultSpecies() {
        const grazer = presets.grazer();
        this.simulation.addSpecies(grazer);
        this.updateSpeciesList();

        // Spawn some initial organisms
        for (let i = 0; i < 15; i++) {
            this.simulation.spawnOrganism(grazer);
        }

        // Spawn some initial food
        for (let i = 0; i < 30; i++) {
            this.simulation.spawnFood();
        }

        // Auto-start the simulation
        this.simulation.start();
        document.getElementById('btn-play').querySelector('.icon').textContent = '⏸';
    }

    /**
     * Reset the simulation
     */
    resetSimulation() {
        this.simulation.reset();

        // Respawn organisms for each species
        for (const species of this.simulation.species.values()) {
            for (let i = 0; i < 10; i++) {
                this.simulation.spawnOrganism(species);
            }
        }

        // Spawn initial food
        for (let i = 0; i < 30; i++) {
            this.simulation.spawnFood();
        }

        // Auto-start after reset
        this.simulation.start();
        document.getElementById('btn-play').querySelector('.icon').textContent = '⏸';
    }

    /**
     * Update the species list in the UI
     */
    updateSpeciesList() {
        const list = document.getElementById('species-list');
        list.innerHTML = '';

        for (const species of this.simulation.species.values()) {
            const item = document.createElement('div');
            item.className = 'species-item';
            if (this.selectedSpecies === species) {
                item.classList.add('selected');
                item.style.borderColor = 'var(--accent)';
            }

            item.innerHTML = `
                <div class="species-color" style="background-color: ${species.color}"></div>
                <div class="species-info">
                    <div class="species-name">${species.name}</div>
                    <div class="species-count">Pop: <span data-species-id="${species.id}">0</span></div>
                </div>
            `;

            // Right-click to select for spawning
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.selectedSpecies = this.selectedSpecies === species ? null : species;
                this.updateSpeciesList();
            });

            item.addEventListener('click', (e) => {
                if (e.shiftKey) {
                    // Shift+click to select for spawning
                    this.selectedSpecies = this.selectedSpecies === species ? null : species;
                    this.updateSpeciesList();
                } else {
                    // Regular click to edit
                    this.openSpeciesEditor(species);
                }
            });

            list.appendChild(item);
        }
    }

    /**
     * Open the species editor modal
     */
    openSpeciesEditor(species) {
        const modal = document.getElementById('species-modal');
        this.editingSpecies = species;

        if (species) {
            // Editing existing species
            document.getElementById('species-name').value = species.name;
            document.getElementById('species-color').value = this.colorToHex(species.color);
            document.getElementById('species-size').value = species.size;
            document.getElementById('species-speed').value = species.maxSpeed;
            document.getElementById('species-sense').value = species.senseRange;
            document.getElementById('species-energy').value = species.startingEnergy;
            document.getElementById('repro-threshold').value = species.reproductionThreshold;
            document.getElementById('repro-cost').value = species.reproductionCost;
            document.getElementById('mutation-rate').value = species.mutationRate;

            // Load behaviors
            for (const [name, config] of Object.entries(species.behaviors)) {
                const checkbox = document.getElementById(`beh-${this.camelToKebab(name)}`);
                const weightSlider = document.getElementById(`beh-${this.camelToKebab(name)}-weight`);
                if (checkbox) checkbox.checked = config.enabled;
                if (weightSlider) {
                    weightSlider.value = config.weight;
                    weightSlider.nextElementSibling.textContent = config.weight;
                }
            }

            document.getElementById('btn-delete-species').style.display = 'block';
        } else {
            // Creating new species
            document.getElementById('species-name').value = '';
            document.getElementById('species-color').value = this.getRandomHexColor();
            document.getElementById('species-size').value = 6;
            document.getElementById('species-speed').value = 80;
            document.getElementById('species-sense').value = 60;
            document.getElementById('species-energy').value = 100;
            document.getElementById('repro-threshold').value = 150;
            document.getElementById('repro-cost').value = 60;
            document.getElementById('mutation-rate').value = 0.05;

            // Reset behaviors to defaults
            document.getElementById('beh-wander').checked = true;
            document.getElementById('beh-seek-food').checked = true;
            document.getElementById('beh-avoid-edge').checked = false;
            document.getElementById('beh-flock').checked = false;
            document.getElementById('beh-align').checked = false;
            document.getElementById('beh-avoid-others').checked = false;
            document.getElementById('beh-flee-predator').checked = false;
            document.getElementById('beh-hunt').checked = false;
            document.getElementById('beh-seek-center').checked = false;
            document.getElementById('beh-avoid-same').checked = false;

            document.getElementById('btn-delete-species').style.display = 'none';
        }

        // Update all display values
        this.updateEditorDisplayValues();

        modal.classList.remove('hidden');
    }

    /**
     * Update all display values in the editor
     */
    updateEditorDisplayValues() {
        const updates = [
            ['species-size', 'species-size-value'],
            ['species-speed', 'species-speed-value'],
            ['species-sense', 'species-sense-value'],
            ['species-energy', 'species-energy-value'],
            ['repro-threshold', 'repro-threshold-value'],
            ['repro-cost', 'repro-cost-value']
        ];

        updates.forEach(([inputId, valueId]) => {
            const input = document.getElementById(inputId);
            const value = document.getElementById(valueId);
            if (input && value) value.textContent = input.value;
        });

        const mutRate = document.getElementById('mutation-rate');
        const mutValue = document.getElementById('mutation-rate-value');
        if (mutRate && mutValue) {
            mutValue.textContent = `${Math.round(mutRate.value * 100)}%`;
        }
    }

    /**
     * Close the modal
     */
    closeModal() {
        document.getElementById('species-modal').classList.add('hidden');
        this.editingSpecies = null;
    }

    /**
     * Save species from editor
     */
    saveSpecies() {
        const config = {
            name: document.getElementById('species-name').value || 'Unnamed Species',
            color: document.getElementById('species-color').value,
            size: parseInt(document.getElementById('species-size').value),
            maxSpeed: parseInt(document.getElementById('species-speed').value),
            senseRange: parseInt(document.getElementById('species-sense').value),
            startingEnergy: parseInt(document.getElementById('species-energy').value),
            reproductionThreshold: parseInt(document.getElementById('repro-threshold').value),
            reproductionCost: parseInt(document.getElementById('repro-cost').value),
            mutationRate: parseFloat(document.getElementById('mutation-rate').value),
            behaviors: {
                wander: {
                    enabled: document.getElementById('beh-wander').checked,
                    weight: parseFloat(document.getElementById('beh-wander-weight').value)
                },
                seekFood: {
                    enabled: document.getElementById('beh-seek-food').checked,
                    weight: parseFloat(document.getElementById('beh-seek-food-weight').value)
                },
                avoidEdge: {
                    enabled: document.getElementById('beh-avoid-edge').checked,
                    weight: parseFloat(document.getElementById('beh-avoid-edge-weight').value)
                },
                flock: {
                    enabled: document.getElementById('beh-flock').checked,
                    weight: parseFloat(document.getElementById('beh-flock-weight').value)
                },
                align: {
                    enabled: document.getElementById('beh-align').checked,
                    weight: parseFloat(document.getElementById('beh-align-weight').value)
                },
                avoidCrowding: {
                    enabled: document.getElementById('beh-avoid-others').checked,
                    weight: parseFloat(document.getElementById('beh-avoid-others-weight').value)
                },
                fleePredator: {
                    enabled: document.getElementById('beh-flee-predator').checked,
                    weight: parseFloat(document.getElementById('beh-flee-predator-weight').value)
                },
                huntPrey: {
                    enabled: document.getElementById('beh-hunt').checked,
                    weight: parseFloat(document.getElementById('beh-hunt-weight').value)
                },
                seekCenter: {
                    enabled: document.getElementById('beh-seek-center').checked,
                    weight: parseFloat(document.getElementById('beh-seek-center-weight').value)
                },
                avoidSameSpecies: {
                    enabled: document.getElementById('beh-avoid-same').checked,
                    weight: parseFloat(document.getElementById('beh-avoid-same-weight').value)
                }
            }
        };

        if (this.editingSpecies) {
            // Update existing species
            Object.assign(this.editingSpecies, config);
        } else {
            // Create new species
            const species = createSpecies(config);
            this.simulation.addSpecies(species);
        }

        this.updateSpeciesList();
        this.closeModal();
    }

    /**
     * Spawn organisms from editor
     */
    spawnFromEditor(count) {
        // First save any changes
        this.saveSpecies();

        // Find the species we just saved
        const species = this.editingSpecies || Array.from(this.simulation.species.values()).pop();

        if (species) {
            for (let i = 0; i < count; i++) {
                this.simulation.spawnOrganism(species);
            }
        }
    }

    /**
     * Delete the currently editing species
     */
    deleteSpecies() {
        if (this.editingSpecies) {
            this.simulation.removeSpecies(this.editingSpecies.id);
            this.updateSpeciesList();
            this.closeModal();
        }
    }

    /**
     * Update stats display
     */
    updateStats(stats) {
        document.getElementById('population-count').textContent = `Population: ${stats.population}`;
        document.getElementById('generation-count').textContent = `Generation: ${stats.generation}`;
        document.getElementById('time-elapsed').textContent = `Time: ${Math.floor(stats.time)}s`;

        // Update per-species counts
        for (const [speciesId, count] of stats.speciesCounts) {
            const countSpan = document.querySelector(`[data-species-id="${speciesId}"]`);
            if (countSpan) {
                countSpan.textContent = count;
            }
        }
    }

    /**
     * Helper: Convert color to hex
     */
    colorToHex(color) {
        if (color.startsWith('#')) return color;

        // Handle HSL
        if (color.startsWith('hsl')) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        return color;
    }

    /**
     * Helper: Get random hex color
     */
    getRandomHexColor() {
        const hue = Math.floor(Math.random() * 360);
        return this.hslToHex(hue, 70, 60);
    }

    /**
     * Helper: Convert HSL to hex
     */
    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    /**
     * Helper: camelCase to kebab-case
     */
    camelToKebab(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
}

/**
 * Core simulation engine for Petri
 * Handles the world state, physics, spatial partitioning, and update loop
 */

export class Simulation {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.radius = Math.min(width, height) / 2 - 10;

        this.organisms = [];
        this.food = [];
        this.obstacles = [];
        this.species = new Map();

        this.time = 0;
        this.generation = 0;
        this.running = false;
        this.speed = 1;

        this.foodSpawnRate = 2; // per second
        this.foodEnergy = 30;
        this.maxFood = 100;
        this.foodSpawnAccumulator = 0;

        // Spatial partitioning for efficient neighbor queries
        this.gridSize = 50;
        this.grid = new Map();

        // Stats tracking
        this.stats = {
            population: 0,
            births: 0,
            deaths: 0,
            foodEaten: 0
        };

        // Event callbacks
        this.onStatsUpdate = null;
        this.onOrganismBorn = null;
        this.onOrganismDied = null;
    }

    /**
     * Check if a point is inside the petri dish
     */
    isInsideDish(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    /**
     * Get the grid cell key for a position
     */
    getGridKey(x, y) {
        const gx = Math.floor(x / this.gridSize);
        const gy = Math.floor(y / this.gridSize);
        return `${gx},${gy}`;
    }

    /**
     * Add an organism to the spatial grid
     */
    addToGrid(organism) {
        const key = this.getGridKey(organism.x, organism.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, new Set());
        }
        this.grid.get(key).add(organism);
        organism.gridKey = key;
    }

    /**
     * Update an organism's position in the grid
     */
    updateGridPosition(organism) {
        const newKey = this.getGridKey(organism.x, organism.y);
        if (newKey !== organism.gridKey) {
            if (organism.gridKey && this.grid.has(organism.gridKey)) {
                this.grid.get(organism.gridKey).delete(organism);
            }
            if (!this.grid.has(newKey)) {
                this.grid.set(newKey, new Set());
            }
            this.grid.get(newKey).add(organism);
            organism.gridKey = newKey;
        }
    }

    /**
     * Remove an organism from the grid
     */
    removeFromGrid(organism) {
        if (organism.gridKey && this.grid.has(organism.gridKey)) {
            this.grid.get(organism.gridKey).delete(organism);
        }
    }

    /**
     * Get all organisms within a radius of a point
     */
    getOrganismsInRadius(x, y, radius) {
        const results = [];
        const minGx = Math.floor((x - radius) / this.gridSize);
        const maxGx = Math.floor((x + radius) / this.gridSize);
        const minGy = Math.floor((y - radius) / this.gridSize);
        const maxGy = Math.floor((y + radius) / this.gridSize);

        const radiusSq = radius * radius;

        for (let gx = minGx; gx <= maxGx; gx++) {
            for (let gy = minGy; gy <= maxGy; gy++) {
                const key = `${gx},${gy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const organism of cell) {
                        const dx = organism.x - x;
                        const dy = organism.y - y;
                        if (dx * dx + dy * dy <= radiusSq) {
                            results.push(organism);
                        }
                    }
                }
            }
        }

        return results;
    }

    /**
     * Add a species to the simulation
     */
    addSpecies(species) {
        this.species.set(species.id, species);
    }

    /**
     * Remove a species from the simulation
     */
    removeSpecies(speciesId) {
        this.species.delete(speciesId);
        // Remove all organisms of this species
        this.organisms = this.organisms.filter(o => {
            if (o.species.id === speciesId) {
                this.removeFromGrid(o);
                return false;
            }
            return true;
        });
    }

    /**
     * Spawn an organism at a random position
     */
    spawnOrganism(species, x = null, y = null) {
        if (x === null || y === null) {
            // Random position inside dish
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * this.radius * 0.8;
            x = this.centerX + Math.cos(angle) * r;
            y = this.centerY + Math.sin(angle) * r;
        }

        const organism = {
            id: Date.now() + Math.random(),
            species: species,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            energy: species.startingEnergy,
            age: 0,
            generation: this.generation,
            alive: true,
            gridKey: null,
            // For wandering behavior
            wanderAngle: Math.random() * Math.PI * 2
        };

        this.organisms.push(organism);
        this.addToGrid(organism);
        this.stats.population++;
        this.stats.births++;

        if (this.onOrganismBorn) {
            this.onOrganismBorn(organism);
        }

        return organism;
    }

    /**
     * Spawn food at a random position
     */
    spawnFood(x = null, y = null) {
        if (this.food.length >= this.maxFood) return null;

        if (x === null || y === null) {
            // Try to find a position not inside an obstacle
            let attempts = 10;
            while (attempts > 0) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * this.radius * 0.9;
                x = this.centerX + Math.cos(angle) * r;
                y = this.centerY + Math.sin(angle) * r;

                if (!this.isInsideObstacle(x, y)) break;
                attempts--;
            }
        }

        const foodItem = {
            id: Date.now() + Math.random(),
            x: x,
            y: y,
            energy: this.foodEnergy
        };

        this.food.push(foodItem);
        return foodItem;
    }

    /**
     * Add an obstacle to the simulation
     */
    addObstacle(x, y, radius) {
        // Make sure obstacle is inside the dish
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist + radius > this.radius) {
            // Adjust to fit inside
            const maxDist = this.radius - radius - 5;
            if (maxDist < 0) return null;

            x = this.centerX + (dx / dist) * maxDist;
            y = this.centerY + (dy / dist) * maxDist;
        }

        const obstacle = {
            id: Date.now() + Math.random(),
            x: x,
            y: y,
            radius: radius
        };

        this.obstacles.push(obstacle);
        return obstacle;
    }

    /**
     * Remove an obstacle
     */
    removeObstacle(id) {
        this.obstacles = this.obstacles.filter(o => o.id !== id);
    }

    /**
     * Clear all obstacles
     */
    clearObstacles() {
        this.obstacles = [];
    }

    /**
     * Check if a point is inside any obstacle
     */
    isInsideObstacle(x, y, padding = 0) {
        for (const obstacle of this.obstacles) {
            const dx = x - obstacle.x;
            const dy = y - obstacle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < obstacle.radius + padding) {
                return obstacle;
            }
        }
        return null;
    }

    /**
     * Remove dead organisms and eaten food
     */
    cleanup() {
        // Remove dead organisms
        for (let i = this.organisms.length - 1; i >= 0; i--) {
            const organism = this.organisms[i];
            if (!organism.alive) {
                this.removeFromGrid(organism);
                this.organisms.splice(i, 1);
                this.stats.population--;
                this.stats.deaths++;

                if (this.onOrganismDied) {
                    this.onOrganismDied(organism);
                }
            }
        }

        // Remove eaten food (energy <= 0)
        this.food = this.food.filter(f => f.energy > 0);
    }

    /**
     * Main simulation update
     */
    update(dt) {
        if (!this.running) return;

        const scaledDt = dt * this.speed;
        this.time += scaledDt;

        // Spawn food
        this.foodSpawnAccumulator += scaledDt;
        while (this.foodSpawnAccumulator >= 1 / this.foodSpawnRate && this.food.length < this.maxFood) {
            this.spawnFood();
            this.foodSpawnAccumulator -= 1 / this.foodSpawnRate;
        }

        // Update organisms
        for (const organism of this.organisms) {
            if (!organism.alive) continue;

            this.updateOrganism(organism, scaledDt);
        }

        // Cleanup dead organisms
        this.cleanup();

        // Update stats callback
        if (this.onStatsUpdate) {
            this.onStatsUpdate(this.getStats());
        }
    }

    /**
     * Update a single organism
     */
    updateOrganism(organism, dt) {
        const species = organism.species;

        // Energy decay
        organism.energy -= species.energyDecay * dt;
        organism.age += dt;

        // Death check
        if (organism.energy <= 0) {
            organism.alive = false;
            return;
        }

        // Calculate steering forces from behaviors
        let steerX = 0;
        let steerY = 0;

        const neighbors = this.getOrganismsInRadius(organism.x, organism.y, species.senseRange);
        const nearbyFood = this.food.filter(f => {
            const dx = f.x - organism.x;
            const dy = f.y - organism.y;
            return dx * dx + dy * dy <= species.senseRange * species.senseRange;
        });

        // Apply behaviors
        for (const [behaviorName, config] of Object.entries(species.behaviors)) {
            if (!config.enabled) continue;

            const force = this.applyBehavior(organism, behaviorName, config, neighbors, nearbyFood);
            steerX += force.x * config.weight;
            steerY += force.y * config.weight;
        }

        // Apply steering force
        organism.vx += steerX * dt;
        organism.vy += steerY * dt;

        // Limit speed
        const speed = Math.sqrt(organism.vx * organism.vx + organism.vy * organism.vy);
        if (speed > species.maxSpeed) {
            organism.vx = (organism.vx / speed) * species.maxSpeed;
            organism.vy = (organism.vy / speed) * species.maxSpeed;
        }

        // Apply friction
        organism.vx *= 0.98;
        organism.vy *= 0.98;

        // Update position
        organism.x += organism.vx * dt;
        organism.y += organism.vy * dt;

        // Keep inside dish
        this.constrainToDish(organism);

        // Update grid position
        this.updateGridPosition(organism);

        // Try to eat food
        this.tryEatFood(organism);

        // Try to reproduce
        this.tryReproduce(organism);
    }

    /**
     * Apply a specific behavior and return the steering force
     */
    applyBehavior(organism, behaviorName, config, neighbors, nearbyFood) {
        const species = organism.species;

        switch (behaviorName) {
            case 'wander':
                return this.behaviorWander(organism);

            case 'seekFood':
                return this.behaviorSeek(organism, nearbyFood);

            case 'avoidEdge':
                return this.behaviorAvoidEdge(organism);

            case 'flock':
                return this.behaviorFlock(organism, neighbors.filter(n => n.species.id === species.id && n !== organism));

            case 'avoidCrowding':
                return this.behaviorAvoidCrowding(organism, neighbors.filter(n => n !== organism));

            case 'fleePredator':
                return this.behaviorFlee(organism, neighbors.filter(n => n !== organism && n.species.size > species.size * 1.2));

            case 'huntPrey':
                return this.behaviorSeek(organism, neighbors.filter(n => n !== organism && n.species.size < species.size * 0.8));

            case 'align':
                return this.behaviorAlign(organism, neighbors.filter(n => n.species.id === species.id && n !== organism));

            case 'seekCenter':
                return this.behaviorSeekCenter(organism);

            case 'avoidSameSpecies':
                return this.behaviorFlee(organism, neighbors.filter(n => n.species.id === species.id && n !== organism));

            default:
                return { x: 0, y: 0 };
        }
    }

    /**
     * Wander behavior - random movement
     */
    behaviorWander(organism) {
        // Slowly change wander angle
        organism.wanderAngle += (Math.random() - 0.5) * 0.5;

        return {
            x: Math.cos(organism.wanderAngle) * 50,
            y: Math.sin(organism.wanderAngle) * 50
        };
    }

    /**
     * Seek behavior - move toward targets
     */
    behaviorSeek(organism, targets) {
        if (targets.length === 0) return { x: 0, y: 0 };

        // Find closest target
        let closest = null;
        let closestDist = Infinity;

        for (const target of targets) {
            const dx = target.x - organism.x;
            const dy = target.y - organism.y;
            const dist = dx * dx + dy * dy;
            if (dist < closestDist) {
                closestDist = dist;
                closest = target;
            }
        }

        if (!closest) return { x: 0, y: 0 };

        const dx = closest.x - organism.x;
        const dy = closest.y - organism.y;
        const dist = Math.sqrt(closestDist);

        if (dist < 1) return { x: 0, y: 0 };

        return {
            x: (dx / dist) * 100,
            y: (dy / dist) * 100
        };
    }

    /**
     * Flee behavior - move away from targets
     */
    behaviorFlee(organism, threats) {
        if (threats.length === 0) return { x: 0, y: 0 };

        let fleeX = 0;
        let fleeY = 0;

        for (const threat of threats) {
            const dx = organism.x - threat.x;
            const dy = organism.y - threat.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) continue;

            // Inverse square falloff
            const strength = 1 / (dist * dist) * 10000;
            fleeX += (dx / dist) * strength;
            fleeY += (dy / dist) * strength;
        }

        return { x: fleeX, y: fleeY };
    }

    /**
     * Avoid edge behavior - stay inside the dish
     */
    behaviorAvoidEdge(organism) {
        const dx = organism.x - this.centerX;
        const dy = organism.y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const margin = 30;

        if (dist > this.radius - margin) {
            const strength = (dist - (this.radius - margin)) / margin;
            return {
                x: -(dx / dist) * strength * 200,
                y: -(dy / dist) * strength * 200
            };
        }

        return { x: 0, y: 0 };
    }

    /**
     * Flock behavior - stay near same species
     */
    behaviorFlock(organism, flockmates) {
        if (flockmates.length === 0) return { x: 0, y: 0 };

        // Calculate center of mass
        let cx = 0, cy = 0;
        for (const mate of flockmates) {
            cx += mate.x;
            cy += mate.y;
        }
        cx /= flockmates.length;
        cy /= flockmates.length;

        const dx = cx - organism.x;
        const dy = cy - organism.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) return { x: 0, y: 0 };

        return {
            x: (dx / dist) * 50,
            y: (dy / dist) * 50
        };
    }

    /**
     * Avoid crowding - maintain personal space
     */
    behaviorAvoidCrowding(organism, neighbors) {
        if (neighbors.length === 0) return { x: 0, y: 0 };

        let avoidX = 0;
        let avoidY = 0;
        const personalSpace = organism.species.size * 3;

        for (const other of neighbors) {
            const dx = organism.x - other.x;
            const dy = organism.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < personalSpace && dist > 0) {
                const strength = (personalSpace - dist) / personalSpace;
                avoidX += (dx / dist) * strength * 100;
                avoidY += (dy / dist) * strength * 100;
            }
        }

        return { x: avoidX, y: avoidY };
    }

    /**
     * Align behavior - match velocity with nearby same-species organisms (boids)
     */
    behaviorAlign(organism, flockmates) {
        if (flockmates.length === 0) return { x: 0, y: 0 };

        let avgVx = 0, avgVy = 0;
        for (const mate of flockmates) {
            avgVx += mate.vx;
            avgVy += mate.vy;
        }
        avgVx /= flockmates.length;
        avgVy /= flockmates.length;

        // Steer toward average velocity
        return {
            x: (avgVx - organism.vx) * 0.5,
            y: (avgVy - organism.vy) * 0.5
        };
    }

    /**
     * Seek center - move toward center of the dish
     */
    behaviorSeekCenter(organism) {
        const dx = this.centerX - organism.x;
        const dy = this.centerY - organism.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) return { x: 0, y: 0 }; // Already near center

        return {
            x: (dx / dist) * 30,
            y: (dy / dist) * 30
        };
    }

    /**
     * Keep organism inside the petri dish and outside obstacles
     */
    constrainToDish(organism) {
        const size = organism.species.size;

        // Constrain to dish edge
        const dx = organism.x - this.centerX;
        const dy = organism.y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > this.radius - size) {
            // Push back inside
            const pushDist = this.radius - size;
            organism.x = this.centerX + (dx / dist) * pushDist;
            organism.y = this.centerY + (dy / dist) * pushDist;

            // Bounce velocity
            const dot = organism.vx * dx + organism.vy * dy;
            organism.vx -= 1.5 * dot * dx / (dist * dist);
            organism.vy -= 1.5 * dot * dy / (dist * dist);
        }

        // Constrain to outside obstacles
        for (const obstacle of this.obstacles) {
            const odx = organism.x - obstacle.x;
            const ody = organism.y - obstacle.y;
            const odist = Math.sqrt(odx * odx + ody * ody);
            const minDist = obstacle.radius + size;

            if (odist < minDist && odist > 0) {
                // Push away from obstacle
                organism.x = obstacle.x + (odx / odist) * minDist;
                organism.y = obstacle.y + (ody / odist) * minDist;

                // Bounce velocity
                const dot = organism.vx * odx + organism.vy * ody;
                organism.vx -= 1.5 * dot * odx / (odist * odist);
                organism.vy -= 1.5 * dot * ody / (odist * odist);
            }
        }
    }

    /**
     * Try to eat nearby food
     */
    tryEatFood(organism) {
        const eatRange = organism.species.size * 1.5;

        for (const foodItem of this.food) {
            if (foodItem.energy <= 0) continue;

            const dx = foodItem.x - organism.x;
            const dy = foodItem.y - organism.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < eatRange) {
                organism.energy += foodItem.energy;
                foodItem.energy = 0;
                this.stats.foodEaten++;
                break; // Only eat one food per tick
            }
        }

        // Predation - eat smaller organisms
        if (organism.species.behaviors.huntPrey?.enabled) {
            const huntRange = organism.species.size * 2;
            const neighbors = this.getOrganismsInRadius(organism.x, organism.y, huntRange);

            for (const prey of neighbors) {
                if (prey === organism || !prey.alive) continue;
                if (prey.species.size >= organism.species.size * 0.8) continue;

                const dx = prey.x - organism.x;
                const dy = prey.y - organism.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < huntRange) {
                    organism.energy += prey.energy * 0.5;
                    prey.alive = false;
                    break;
                }
            }
        }
    }

    /**
     * Try to reproduce
     */
    tryReproduce(organism) {
        const species = organism.species;

        if (organism.energy >= species.reproductionThreshold) {
            // Spend energy to reproduce
            organism.energy -= species.reproductionCost;

            // Spawn offspring nearby
            const angle = Math.random() * Math.PI * 2;
            const dist = species.size * 3;
            const childX = organism.x + Math.cos(angle) * dist;
            const childY = organism.y + Math.sin(angle) * dist;

            // Apply mutation if enabled
            let childSpecies = species;
            if (species.mutationRate > 0 && Math.random() < species.mutationRate) {
                childSpecies = this.mutateSpecies(species);
            }

            const child = this.spawnOrganism(childSpecies, childX, childY);
            child.generation = organism.generation + 1;

            if (child.generation > this.generation) {
                this.generation = child.generation;
            }
        }
    }

    /**
     * Create a mutated copy of a species
     */
    mutateSpecies(species) {
        // For now, just return the same species
        // Could implement actual mutation later
        return species;
    }

    /**
     * Get current simulation stats
     */
    getStats() {
        const speciesCounts = new Map();
        for (const organism of this.organisms) {
            const count = speciesCounts.get(organism.species.id) || 0;
            speciesCounts.set(organism.species.id, count + 1);
        }

        return {
            population: this.organisms.length,
            generation: this.generation,
            time: this.time,
            foodCount: this.food.length,
            speciesCounts: speciesCounts,
            births: this.stats.births,
            deaths: this.stats.deaths,
            foodEaten: this.stats.foodEaten
        };
    }

    /**
     * Reset the simulation
     */
    reset() {
        this.organisms = [];
        this.food = [];
        // Note: obstacles are preserved on reset
        this.grid.clear();
        this.time = 0;
        this.generation = 0;
        this.stats = {
            population: 0,
            births: 0,
            deaths: 0,
            foodEaten: 0
        };
        this.foodSpawnAccumulator = 0;
    }

    /**
     * Start/resume the simulation
     */
    start() {
        this.running = true;
    }

    /**
     * Pause the simulation
     */
    pause() {
        this.running = false;
    }

    /**
     * Toggle running state
     */
    toggle() {
        this.running = !this.running;
        return this.running;
    }

    /**
     * Step the simulation by one frame
     */
    step() {
        const wasRunning = this.running;
        this.running = true;
        this.update(1/60);
        this.running = wasRunning;
    }
}

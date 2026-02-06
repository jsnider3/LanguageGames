/**
 * Canvas renderer for Petri
 * Handles all visualization of the simulation
 */

export class Renderer {
    constructor(canvas, simulation) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.simulation = simulation;

        // Visual settings
        this.showTrails = false;
        this.showSenseRange = false;
        this.showEnergy = true;
        this.showVelocity = false;

        // Effects system (set externally)
        this.effects = null;

        // Trail buffer (for optional trails effect)
        this.trailCanvas = document.createElement('canvas');
        this.trailCtx = this.trailCanvas.getContext('2d');

        this.resize();
    }

    /**
     * Resize canvas to fit container
     */
    resize() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth - 40, container.clientHeight - 40, 700);

        this.canvas.width = size;
        this.canvas.height = size;

        this.trailCanvas.width = size;
        this.trailCanvas.height = size;

        // Update simulation dimensions
        this.simulation.width = size;
        this.simulation.height = size;
        this.simulation.centerX = size / 2;
        this.simulation.centerY = size / 2;
        this.simulation.radius = size / 2 - 10;
    }

    /**
     * Main render loop
     */
    render() {
        const ctx = this.ctx;
        const sim = this.simulation;

        // Clear canvas
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw dish background with gradient
        this.drawDishBackground();

        // Draw trails if enabled
        if (this.showTrails) {
            this.drawTrails();
        }

        // Draw obstacles
        this.drawObstacles();

        // Draw food
        this.drawFood();

        // Draw organisms
        this.drawOrganisms();

        // Draw effects
        if (this.effects) {
            this.effects.render(ctx);
        }

        // Draw dish border
        this.drawDishBorder();
    }

    /**
     * Draw the petri dish background
     */
    drawDishBackground() {
        const ctx = this.ctx;
        const sim = this.simulation;

        // Create radial gradient for dish
        const gradient = ctx.createRadialGradient(
            sim.centerX, sim.centerY, 0,
            sim.centerX, sim.centerY, sim.radius
        );
        gradient.addColorStop(0, '#0f1020');
        gradient.addColorStop(0.7, '#0a0a15');
        gradient.addColorStop(1, '#050508');

        ctx.beginPath();
        ctx.arc(sim.centerX, sim.centerY, sim.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add subtle grid pattern
        ctx.save();
        ctx.beginPath();
        ctx.arc(sim.centerX, sim.centerY, sim.radius, 0, Math.PI * 2);
        ctx.clip();

        ctx.strokeStyle = 'rgba(78, 204, 163, 0.03)';
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw the dish border
     */
    drawDishBorder() {
        const ctx = this.ctx;
        const sim = this.simulation;

        ctx.beginPath();
        ctx.arc(sim.centerX, sim.centerY, sim.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Outer glow
        ctx.beginPath();
        ctx.arc(sim.centerX, sim.centerY, sim.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(78, 204, 163, 0.1)';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    /**
     * Draw obstacles
     */
    drawObstacles() {
        const ctx = this.ctx;

        for (const obstacle of this.simulation.obstacles) {
            // Obstacle shadow
            ctx.beginPath();
            ctx.arc(obstacle.x + 3, obstacle.y + 3, obstacle.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();

            // Obstacle body - rocky gradient
            const gradient = ctx.createRadialGradient(
                obstacle.x - obstacle.radius * 0.3,
                obstacle.y - obstacle.radius * 0.3,
                0,
                obstacle.x,
                obstacle.y,
                obstacle.radius
            );
            gradient.addColorStop(0, '#5a5a6e');
            gradient.addColorStop(0.5, '#3a3a4a');
            gradient.addColorStop(1, '#2a2a3a');

            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.arc(
                obstacle.x - obstacle.radius * 0.3,
                obstacle.y - obstacle.radius * 0.3,
                obstacle.radius * 0.3,
                0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fill();

            // Edge
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#1a1a2a';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * Draw food particles
     */
    drawFood() {
        const ctx = this.ctx;

        for (const food of this.simulation.food) {
            if (food.energy <= 0) continue;

            // Food glow
            const gradient = ctx.createRadialGradient(
                food.x, food.y, 0,
                food.x, food.y, 8
            );
            gradient.addColorStop(0, 'rgba(76, 175, 80, 0.8)');
            gradient.addColorStop(0.5, 'rgba(76, 175, 80, 0.3)');
            gradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

            ctx.beginPath();
            ctx.arc(food.x, food.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Food core
            ctx.beginPath();
            ctx.arc(food.x, food.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#8BC34A';
            ctx.fill();
        }
    }

    /**
     * Draw all organisms
     */
    drawOrganisms() {
        const ctx = this.ctx;

        for (const organism of this.simulation.organisms) {
            if (!organism.alive) continue;

            this.drawOrganism(organism);
        }
    }

    /**
     * Draw a single organism
     */
    drawOrganism(organism) {
        const ctx = this.ctx;
        const species = organism.species;
        const size = species.size;

        // Parse color for manipulation
        const color = species.color;

        // Draw sense range if enabled
        if (this.showSenseRange) {
            ctx.beginPath();
            ctx.arc(organism.x, organism.y, species.senseRange, 0, Math.PI * 2);
            ctx.strokeStyle = `${color}33`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw velocity vector if enabled
        if (this.showVelocity) {
            const velScale = 0.3;
            ctx.beginPath();
            ctx.moveTo(organism.x, organism.y);
            ctx.lineTo(
                organism.x + organism.vx * velScale,
                organism.y + organism.vy * velScale
            );
            ctx.strokeStyle = `${color}88`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Organism glow
        const glowGradient = ctx.createRadialGradient(
            organism.x, organism.y, 0,
            organism.x, organism.y, size * 2
        );
        glowGradient.addColorStop(0, `${color}66`);
        glowGradient.addColorStop(1, `${color}00`);

        ctx.beginPath();
        ctx.arc(organism.x, organism.y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Organism body
        ctx.beginPath();
        ctx.arc(organism.x, organism.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(organism.x - size * 0.3, organism.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Energy indicator
        if (this.showEnergy) {
            const energyRatio = Math.min(1, organism.energy / species.reproductionThreshold);
            const barWidth = size * 2;
            const barHeight = 3;
            const barY = organism.y + size + 4;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(organism.x - barWidth / 2, barY, barWidth, barHeight);

            // Energy fill
            let energyColor;
            if (energyRatio >= 1) {
                energyColor = '#4CAF50'; // Ready to reproduce
            } else if (energyRatio > 0.3) {
                energyColor = '#FFC107'; // Healthy
            } else {
                energyColor = '#f44336'; // Low energy
            }

            ctx.fillStyle = energyColor;
            ctx.fillRect(organism.x - barWidth / 2, barY, barWidth * energyRatio, barHeight);
        }
    }

    /**
     * Draw motion trails
     */
    drawTrails() {
        // Fade existing trails
        this.trailCtx.fillStyle = 'rgba(10, 10, 18, 0.1)';
        this.trailCtx.fillRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);

        // Draw current positions to trail canvas
        for (const organism of this.simulation.organisms) {
            if (!organism.alive) continue;

            this.trailCtx.beginPath();
            this.trailCtx.arc(organism.x, organism.y, 2, 0, Math.PI * 2);
            this.trailCtx.fillStyle = organism.species.color + '44';
            this.trailCtx.fill();
        }

        // Composite trails onto main canvas
        this.ctx.drawImage(this.trailCanvas, 0, 0);
    }

    /**
     * Handle click on the dish - could spawn organisms or food
     */
    getClickPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x, y };
    }

    /**
     * Check if a click is inside the dish
     */
    isInsideDish(x, y) {
        return this.simulation.isInsideDish(x, y);
    }
}

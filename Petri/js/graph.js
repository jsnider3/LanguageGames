/**
 * Population graph for Petri
 * Visualizes population dynamics over time
 */

export class PopulationGraph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Graph settings
        this.maxDataPoints = 300; // ~5 minutes at 1 sample/second
        this.sampleInterval = 1; // seconds between samples
        this.lastSampleTime = 0;

        // Data storage: Map of speciesId -> array of population counts
        this.data = new Map();
        this.timeData = [];
        this.speciesColors = new Map();

        // Graph bounds
        this.maxPopulation = 50;
        this.padding = { top: 20, right: 20, bottom: 30, left: 40 };

        this.resize();
    }

    resize() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }

    /**
     * Record a data point
     */
    sample(simulation) {
        const currentTime = simulation.time;

        // Only sample at intervals
        if (currentTime - this.lastSampleTime < this.sampleInterval) {
            return;
        }
        this.lastSampleTime = currentTime;

        // Record time
        this.timeData.push(currentTime);
        if (this.timeData.length > this.maxDataPoints) {
            this.timeData.shift();
        }

        // Count population per species
        const counts = new Map();
        for (const org of simulation.organisms) {
            const count = counts.get(org.species.id) || 0;
            counts.set(org.species.id, count + 1);
        }

        // Update data for each species
        for (const species of simulation.species.values()) {
            if (!this.data.has(species.id)) {
                this.data.set(species.id, []);
                this.speciesColors.set(species.id, species.color);
            }

            const speciesData = this.data.get(species.id);
            speciesData.push(counts.get(species.id) || 0);

            if (speciesData.length > this.maxDataPoints) {
                speciesData.shift();
            }
        }

        // Update max population for scaling
        let maxPop = 10;
        for (const speciesData of this.data.values()) {
            for (const pop of speciesData) {
                if (pop > maxPop) maxPop = pop;
            }
        }
        this.maxPopulation = Math.ceil(maxPop * 1.2 / 10) * 10; // Round up to nearest 10

        // Clean up species that no longer exist
        for (const speciesId of this.data.keys()) {
            if (!simulation.species.has(speciesId)) {
                // Keep the data but mark as extinct (gray out in render)
            }
        }
    }

    /**
     * Clear all data
     */
    clear() {
        this.data.clear();
        this.timeData = [];
        this.speciesColors.clear();
        this.lastSampleTime = 0;
        this.maxPopulation = 50;
    }

    /**
     * Render the graph
     */
    render(simulation) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const p = this.padding;

        const graphWidth = width - p.left - p.right;
        const graphHeight = height - p.top - p.bottom;

        // Clear
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = p.top + (graphHeight / ySteps) * i;
            ctx.beginPath();
            ctx.moveTo(p.left, y);
            ctx.lineTo(width - p.right, y);
            ctx.stroke();

            // Y-axis labels
            const value = Math.round(this.maxPopulation * (1 - i / ySteps));
            ctx.fillStyle = '#666';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(value.toString(), p.left - 5, y + 3);
        }

        // Vertical grid lines (time)
        const xSteps = 6;
        for (let i = 0; i <= xSteps; i++) {
            const x = p.left + (graphWidth / xSteps) * i;
            ctx.beginPath();
            ctx.moveTo(x, p.top);
            ctx.lineTo(x, height - p.bottom);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.left, p.top);
        ctx.lineTo(p.left, height - p.bottom);
        ctx.lineTo(width - p.right, height - p.bottom);
        ctx.stroke();

        // Draw data lines
        if (this.timeData.length < 2) {
            // Not enough data yet
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Collecting data...', width / 2, height / 2);
            return;
        }

        // Draw each species line
        for (const [speciesId, speciesData] of this.data.entries()) {
            if (speciesData.length < 2) continue;

            const color = this.speciesColors.get(speciesId) || '#888';
            const isExtinct = !simulation.species.has(speciesId);

            ctx.strokeStyle = isExtinct ? '#444' : color;
            ctx.lineWidth = isExtinct ? 1 : 2;
            ctx.beginPath();

            for (let i = 0; i < speciesData.length; i++) {
                const x = p.left + (i / (this.maxDataPoints - 1)) * graphWidth;
                const y = p.top + graphHeight - (speciesData[i] / this.maxPopulation) * graphHeight;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();

            // Draw current value at end of line
            if (!isExtinct && speciesData.length > 0) {
                const lastValue = speciesData[speciesData.length - 1];
                const lastX = p.left + ((speciesData.length - 1) / (this.maxDataPoints - 1)) * graphWidth;
                const lastY = p.top + graphHeight - (lastValue / this.maxPopulation) * graphHeight;

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw legend
        let legendY = p.top + 5;
        for (const [speciesId, color] of this.speciesColors.entries()) {
            const species = simulation.species.get(speciesId);
            const name = species ? species.name : 'Extinct';
            const isExtinct = !species;

            ctx.fillStyle = isExtinct ? '#444' : color;
            ctx.fillRect(width - p.right - 80, legendY, 10, 10);

            ctx.fillStyle = isExtinct ? '#444' : '#aaa';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(name, width - p.right - 65, legendY + 9);

            legendY += 15;
        }

        // Title
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Population Over Time', width / 2, 12);
    }
}

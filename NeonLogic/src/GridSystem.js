/**
 * GridSystem
 * Handles coordinate mapping and drawing the background grid.
 */
export class GridSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.cellSize = 40; // Pixels per grid cell
        this.width = 0;
        this.height = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
    }

    /**
     * Convert screen pixel coordinates to grid coordinates
     */
    toGrid(x, y) {
        return {
            x: Math.floor((x - this.offsetX) / this.cellSize),
            y: Math.floor((y - this.offsetY) / this.cellSize)
        };
    }

    /**
     * Convert grid coordinates to screen pixel coordinates (center of cell)
     */
    toScreen(gridX, gridY) {
        return {
            x: (gridX * this.cellSize) + this.offsetX + (this.cellSize / 2),
            y: (gridY * this.cellSize) + this.offsetY + (this.cellSize / 2)
        };
    }

    /**
     * Snap a pixel coordinate to the nearest grid node (intersection)
     * Useful for wire endpoints
     */
    snapToNode(x, y) {
        // Snap to CENTER of the cell (matching component placement)
        const gridX = Math.floor((x - this.offsetX) / this.cellSize);
        const gridY = Math.floor((y - this.offsetY) / this.cellSize);

        return {
            x: (gridX * this.cellSize) + this.offsetX + (this.cellSize / 2),
            y: (gridY * this.cellSize) + this.offsetY + (this.cellSize / 2),
            gx: gridX,
            gy: gridY
        };
    }

    draw() {
        const ctx = this.ctx;

        ctx.strokeStyle = '#1a1a25';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = this.offsetX % this.cellSize; x < this.width; x += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = this.offsetY % this.cellSize; y < this.height; y += this.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Draw "Dots" at intersections to give it a techy feel
        ctx.fillStyle = '#222233';
        for (let x = this.offsetX % this.cellSize; x < this.width; x += this.cellSize) {
            for (let y = this.offsetY % this.cellSize; y < this.height; y += this.cellSize) {
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
    }
}

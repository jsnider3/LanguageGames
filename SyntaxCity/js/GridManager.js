// SyntaxCity - Grid Management System

import { GRID, COLORS } from './Constants.js';
import { worldToGrid, isInBounds } from './Utils.js';

export class GridManager {
    constructor() {
        this.cols = GRID.COLS;
        this.rows = GRID.ROWS;
        this.tileSize = GRID.TILE_SIZE;

        // Grid data: 0 = unbuildable, 1 = buildable, 2 = path
        this.grid = [];
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = 1;  // Default buildable
            }
        }

        this.towers = [];
    }

    setLevel(levelData) {
        // Clear grid
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = 1;  // Buildable
            }
        }

        // Mark path tiles as unbuildable
        if (levelData.paths) {
            for (let path of levelData.paths) {
                for (let waypoint of path.gridWaypoints) {
                    this.setTile(waypoint.x, waypoint.y, 2);  // Path
                    // Also mark adjacent tiles as unbuildable
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const nx = waypoint.x + dx;
                            const ny = waypoint.y + dy;
                            if (isInBounds(nx, ny, this.cols, this.rows)) {
                                if (this.grid[ny][nx] !== 2) {
                                    this.grid[ny][nx] = 0;  // Unbuildable near path
                                }
                            }
                        }
                    }
                }
            }
        }

        // Mark special unbuildable zones
        if (levelData.unbuildableZones) {
            for (let zone of levelData.unbuildableZones) {
                for (let y = zone.y; y < zone.y + zone.height; y++) {
                    for (let x = zone.x; x < zone.x + zone.width; x++) {
                        if (isInBounds(x, y, this.cols, this.rows)) {
                            this.grid[y][x] = 0;
                        }
                    }
                }
            }
        }
    }

    setTile(gridX, gridY, value) {
        if (isInBounds(gridX, gridY, this.cols, this.rows)) {
            this.grid[gridY][gridX] = value;
        }
    }

    getTile(gridX, gridY) {
        if (!isInBounds(gridX, gridY, this.cols, this.rows)) {
            return 0;
        }
        return this.grid[gridY][gridX];
    }

    canBuild(gridX, gridY) {
        if (!isInBounds(gridX, gridY, this.cols, this.rows)) {
            return false;
        }

        // Check if buildable
        if (this.grid[gridY][gridX] !== 1) {
            return false;
        }

        // Check if tower already exists
        return !this.hasTower(gridX, gridY);
    }

    hasTower(gridX, gridY) {
        return this.towers.some(tower =>
            tower.gridX === gridX && tower.gridY === gridY
        );
    }

    getTowerAt(gridX, gridY) {
        return this.towers.find(tower =>
            tower.gridX === gridX && tower.gridY === gridY
        );
    }

    addTower(tower) {
        this.towers.push(tower);
    }

    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
        }
    }

    getAdjacentTowers(gridX, gridY) {
        const adjacent = [];
        const offsets = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];

        for (let [dx, dy] of offsets) {
            const nx = gridX + dx;
            const ny = gridY + dy;
            const tower = this.getTowerAt(nx, ny);
            if (tower) {
                adjacent.push(tower);
            }
        }

        return adjacent;
    }

    render(ctx) {
        // Draw grid tiles
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;

                const tileValue = this.grid[y][x];

                // Draw tile background
                if (tileValue === 0) {
                    ctx.fillStyle = COLORS.UNBUILDABLE;
                } else if (tileValue === 1) {
                    ctx.fillStyle = COLORS.BUILDABLE;
                } else if (tileValue === 2) {
                    ctx.fillStyle = COLORS.PATH;
                }

                ctx.fillRect(worldX, worldY, this.tileSize, this.tileSize);

                // Draw grid lines
                ctx.strokeStyle = COLORS.GRID_LINE;
                ctx.lineWidth = 1;
                ctx.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
            }
        }
    }

    renderOverlay(ctx, mouseGridX, mouseGridY, placingTower) {
        if (!isInBounds(mouseGridX, mouseGridY, this.cols, this.rows)) {
            return;
        }

        const worldX = mouseGridX * this.tileSize;
        const worldY = mouseGridY * this.tileSize;

        // Highlight tile under mouse
        if (placingTower) {
            if (this.canBuild(mouseGridX, mouseGridY)) {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            } else {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            }
            ctx.fillRect(worldX, worldY, this.tileSize, this.tileSize);

            ctx.strokeStyle = placingTower.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
        } else {
            // Just highlight
            ctx.strokeStyle = COLORS.SELECTION_HIGHLIGHT;
            ctx.lineWidth = 2;
            ctx.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
        }
    }

    clear() {
        this.towers = [];
    }
}

// SyntaxCity - Rendering System

import { GRID, COLORS } from './Constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = GRID.WIDTH;
        this.height = GRID.HEIGHT;

        // Set canvas size
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    render(game) {
        this.clear();

        // Render grid
        if (game.grid) {
            game.grid.render(this.ctx);
        }

        // Render level paths (visual guide)
        if (game.currentLevel && game.showPaths) {
            this.renderPaths(game.currentLevel.paths);
        }

        // Render towers
        if (game.grid && game.grid.towers) {
            for (let tower of game.grid.towers) {
                tower.render(this.ctx);
            }
        }

        // Render tower range if selected
        if (game.selectedTower) {
            game.selectedTower.renderRange(this.ctx);
        }

        // Render combo connections
        if (game.showCombos) {
            this.renderComboConnections(game);
        }

        // Render enemies
        if (game.enemies) {
            for (let enemy of game.enemies) {
                enemy.render(this.ctx);
            }
        }

        // Render projectiles
        if (game.projectiles) {
            for (let projectile of game.projectiles) {
                if (projectile.render) {
                    projectile.render(this.ctx);
                } else if (projectile.getActiveProjectiles) {
                    // MultiProjectile
                    for (let proj of projectile.getActiveProjectiles()) {
                        proj.render(this.ctx);
                    }
                }
            }
        }

        // Render effects
        if (game.effects) {
            game.effects.render(this.ctx);
        }

        // Render tower placement preview
        if (game.placingTower && game.mouseGridX !== null) {
            this.renderTowerPreview(game);
        }

        // Render grid overlay
        if (game.grid && game.mouseGridX !== null && game.mouseGridY !== null) {
            game.grid.renderOverlay(
                this.ctx,
                game.mouseGridX,
                game.mouseGridY,
                game.placingTower ? { color: game.placingTowerType ? COLORS.SELECTION_HIGHLIGHT : '#ff0000' } : null
            );
        }

        // Render selected enemy info
        if (game.selectedEnemy && game.selectedEnemy.isAlive()) {
            game.selectedEnemy.renderInfo(this.ctx);
        }
    }

    renderPaths(paths) {
        for (let path of paths) {
            this.ctx.strokeStyle = '#ffffff30';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();

            const start = path.getStartPosition();
            this.ctx.moveTo(start.x, start.y);

            for (let i = 1; i < path.waypoints.length; i++) {
                const wp = path.waypoints[i];
                this.ctx.lineTo(wp.x, wp.y);
            }

            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw waypoint markers
            for (let wp of path.waypoints) {
                this.ctx.fillStyle = '#ffffff50';
                this.ctx.beginPath();
                this.ctx.arc(wp.x, wp.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    renderTowerPreview(game) {
        if (!game.placingTowerType || game.mouseWorldX === null) return;

        const towerStats = game.getTowerStats(game.placingTowerType);
        if (!towerStats) return;

        const canBuild = game.grid.canBuild(game.mouseGridX, game.mouseGridY);

        // Draw range preview
        this.ctx.strokeStyle = canBuild ? towerStats.color + '60' : '#ff000060';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(game.mouseWorldX, game.mouseWorldY, towerStats.range, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = canBuild ? towerStats.color + '20' : '#ff000020';
        this.ctx.beginPath();
        this.ctx.arc(game.mouseWorldX, game.mouseWorldY, towerStats.range, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw tower preview
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = canBuild ? towerStats.color : '#ff0000';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(game.mouseWorldX, game.mouseWorldY, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(towerStats.symbol, game.mouseWorldX, game.mouseWorldY);
        this.ctx.globalAlpha = 1.0;
    }

    renderComboConnections(game) {
        if (!game.grid || !game.grid.towers) return;

        for (let tower of game.grid.towers) {
            const adjacent = game.grid.getAdjacentTowers(tower.gridX, tower.gridY);

            for (let other of adjacent) {
                // Check if there's a combo
                if (this.hasCombo(tower, other)) {
                    this.ctx.strokeStyle = '#00ff8840';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(tower.x, tower.y);
                    this.ctx.lineTo(other.x, other.y);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            }
        }
    }

    hasCombo(tower1, tower2) {
        // Check if towers have combo synergy
        // Simplified check - in real game would check COMBO_BONUSES
        return true;  // Show all connections for now
    }
}

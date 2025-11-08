// SyntaxCity - Pathfinding System

import { distance, lerp, gridToWorld } from './Utils.js';
import { GRID } from './Constants.js';

export class Path {
    constructor(waypoints) {
        // Waypoints are in grid coordinates
        this.gridWaypoints = waypoints;
        // Convert to world coordinates
        this.waypoints = waypoints.map(wp =>
            gridToWorld(wp.x, wp.y, GRID.TILE_SIZE)
        );
        this.totalLength = this.calculateLength();
    }

    calculateLength() {
        let length = 0;
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const current = this.waypoints[i];
            const next = this.waypoints[i + 1];
            length += distance(current.x, current.y, next.x, next.y);
        }
        return length;
    }

    getPositionAtProgress(progress) {
        if (progress <= 0) return { ...this.waypoints[0] };
        if (progress >= 1) return { ...this.waypoints[this.waypoints.length - 1] };

        const targetDistance = progress * this.totalLength;
        let currentDistance = 0;

        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const current = this.waypoints[i];
            const next = this.waypoints[i + 1];
            const segmentLength = distance(current.x, current.y, next.x, next.y);

            if (currentDistance + segmentLength >= targetDistance) {
                const segmentProgress = (targetDistance - currentDistance) / segmentLength;
                return {
                    x: lerp(current.x, next.x, segmentProgress),
                    y: lerp(current.y, next.y, segmentProgress)
                };
            }

            currentDistance += segmentLength;
        }

        return { ...this.waypoints[this.waypoints.length - 1] };
    }

    getNextWaypoint(currentIndex) {
        if (currentIndex >= this.waypoints.length - 1) {
            return null;
        }
        return this.waypoints[currentIndex + 1];
    }

    getStartPosition() {
        return { ...this.waypoints[0] };
    }

    getEndPosition() {
        return { ...this.waypoints[this.waypoints.length - 1] };
    }
}

export class PathFollower {
    constructor(path, speed) {
        this.path = path;
        this.baseSpeed = speed;
        this.speed = speed;
        this.progress = 0;  // 0.0 to 1.0
        this.position = path.getStartPosition();
        this.currentWaypointIndex = 0;
        this.completed = false;
    }

    update(dt) {
        if (this.completed) return;

        // Move along path
        const distanceMoved = this.speed * dt;
        const progressIncrement = distanceMoved / this.path.totalLength;
        this.progress += progressIncrement;

        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.position = this.path.getEndPosition();
            this.completed = true;
        } else {
            this.position = this.path.getPositionAtProgress(this.progress);
        }
    }

    setSpeed(newSpeed) {
        this.speed = newSpeed;
    }

    resetSpeed() {
        this.speed = this.baseSpeed;
    }

    teleportToProgress(newProgress) {
        this.progress = Math.max(0, Math.min(1, newProgress));
        this.position = this.path.getPositionAtProgress(this.progress);
        if (this.progress >= 1.0) {
            this.completed = true;
        }
    }

    isCompleted() {
        return this.completed;
    }

    getPosition() {
        return { ...this.position };
    }

    getProgress() {
        return this.progress;
    }
}

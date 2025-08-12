// Timer Management System
// Centralized management of intervals, timeouts, and animation frames to prevent memory leaks

export class TimerManager {
    constructor() {
        this.intervals = new Map();
        this.timeouts = new Map();
        this.animationFrames = new Map();
        this.nextId = 1;
    }

    /**
     * Create a managed interval
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {string} [name] - Optional name for debugging
     * @returns {number} - Timer ID for cancellation
     */
    setInterval(callback, delay, name = '') {
        const id = this.nextId++;
        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                console.error(`[TimerManager] Error in interval ${name || id}:`, error);
                this.clearInterval(id); // Auto-cleanup on error
            }
        }, delay);
        
        this.intervals.set(id, {
            intervalId,
            callback,
            delay,
            name,
            startTime: Date.now()
        });
        
        return id;
    }

    /**
     * Create a managed timeout
     * @param {Function} callback - Function to execute
     * @param {number} delay - Delay in milliseconds
     * @param {string} [name] - Optional name for debugging
     * @returns {number} - Timer ID for cancellation
     */
    setTimeout(callback, delay, name = '') {
        const id = this.nextId++;
        const timeoutId = setTimeout(() => {
            try {
                callback();
            } catch (error) {
                console.error(`[TimerManager] Error in timeout ${name || id}:`, error);
            } finally {
                this.timeouts.delete(id); // Auto-cleanup
            }
        }, delay);
        
        this.timeouts.set(id, {
            timeoutId,
            callback,
            delay,
            name,
            startTime: Date.now()
        });
        
        return id;
    }

    /**
     * Create a managed animation frame
     * @param {Function} callback - Function to execute
     * @param {string} [name] - Optional name for debugging
     * @returns {number} - Timer ID for cancellation
     */
    requestAnimationFrame(callback, name = '') {
        const id = this.nextId++;
        const frameId = requestAnimationFrame(() => {
            try {
                callback();
            } catch (error) {
                console.error(`[TimerManager] Error in animation frame ${name || id}:`, error);
            } finally {
                this.animationFrames.delete(id); // Auto-cleanup
            }
        });
        
        this.animationFrames.set(id, {
            frameId,
            callback,
            name,
            startTime: Date.now()
        });
        
        return id;
    }

    /**
     * Clear a managed interval
     * @param {number} id - Timer ID returned from setInterval
     */
    clearInterval(id) {
        const timer = this.intervals.get(id);
        if (timer) {
            clearInterval(timer.intervalId);
            this.intervals.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Clear a managed timeout
     * @param {number} id - Timer ID returned from setTimeout
     */
    clearTimeout(id) {
        const timer = this.timeouts.get(id);
        if (timer) {
            clearTimeout(timer.timeoutId);
            this.timeouts.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Cancel a managed animation frame
     * @param {number} id - Timer ID returned from requestAnimationFrame
     */
    cancelAnimationFrame(id) {
        const frame = this.animationFrames.get(id);
        if (frame) {
            cancelAnimationFrame(frame.frameId);
            this.animationFrames.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Clear all timers (for cleanup on level change/game end)
     */
    clearAll() {
        // Clear all intervals
        for (const [id, timer] of this.intervals) {
            clearInterval(timer.intervalId);
        }
        this.intervals.clear();

        // Clear all timeouts
        for (const [id, timer] of this.timeouts) {
            clearTimeout(timer.timeoutId);
        }
        this.timeouts.clear();

        // Cancel all animation frames
        for (const [id, frame] of this.animationFrames) {
            cancelAnimationFrame(frame.frameId);
        }
        this.animationFrames.clear();
    }

    /**
     * Clear timers by name pattern
     * @param {string} namePattern - Name pattern to match
     */
    clearByName(namePattern) {
        const regex = new RegExp(namePattern);
        
        // Clear matching intervals
        for (const [id, timer] of this.intervals) {
            if (regex.test(timer.name)) {
                this.clearInterval(id);
            }
        }

        // Clear matching timeouts
        for (const [id, timer] of this.timeouts) {
            if (regex.test(timer.name)) {
                this.clearTimeout(id);
            }
        }

        // Clear matching animation frames
        for (const [id, frame] of this.animationFrames) {
            if (regex.test(frame.name)) {
                this.cancelAnimationFrame(id);
            }
        }
    }

    /**
     * Get debug information about active timers
     */
    getDebugInfo() {
        return {
            intervals: Array.from(this.intervals.entries()).map(([id, timer]) => ({
                id,
                name: timer.name,
                delay: timer.delay,
                runningFor: Date.now() - timer.startTime
            })),
            timeouts: Array.from(this.timeouts.entries()).map(([id, timer]) => ({
                id,
                name: timer.name,
                delay: timer.delay,
                startTime: timer.startTime
            })),
            animationFrames: Array.from(this.animationFrames.entries()).map(([id, frame]) => ({
                id,
                name: frame.name,
                startTime: frame.startTime
            }))
        };
    }

    /**
     * Log current timer status
     */
    logStatus() {
        const info = this.getDebugInfo();
        console.log(`[TimerManager] Active timers:
        - Intervals: ${info.intervals.length}
        - Timeouts: ${info.timeouts.length} 
        - Animation Frames: ${info.animationFrames.length}
        Total: ${info.intervals.length + info.timeouts.length + info.animationFrames.length}`);
        
        if (info.intervals.length + info.timeouts.length + info.animationFrames.length > 50) {
            console.warn('[TimerManager] High number of active timers detected - potential memory leak');
        }
    }
}

// Global timer manager instance
export const timerManager = new TimerManager();

// Convenience functions that use the global instance
export const setManagedInterval = (callback, delay, name) => timerManager.setInterval(callback, delay, name);
export const setManagedTimeout = (callback, delay, name) => timerManager.setTimeout(callback, delay, name);
export const requestManagedAnimationFrame = (callback, name) => timerManager.requestAnimationFrame(callback, name);
export const clearManagedInterval = (id) => timerManager.clearInterval(id);
export const clearManagedTimeout = (id) => timerManager.clearTimeout(id);
export const cancelManagedAnimationFrame = (id) => timerManager.cancelAnimationFrame(id);
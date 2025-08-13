// Centralized Logging System
// Provides structured logging with levels, categories, and performance tracking

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4,
    NONE: 5
};

export const LogCategory = {
    PLAYER: 'Player',
    ENEMY: 'Enemy',
    WEAPON: 'Weapon',
    PHYSICS: 'Physics',
    COLLISION: 'Collision',
    LEVEL: 'Level',
    ZONE: 'Zone',
    PERFORMANCE: 'Performance',
    AUDIO: 'Audio',
    INPUT: 'Input',
    NARRATIVE: 'Narrative',
    SYSTEM: 'System',
    DEBUG: 'Debug'
};

class Logger {
    constructor() {
        // Default to INFO in production, DEBUG in development
        this.level = LogLevel.INFO;
        this.enabledCategories = new Set(Object.values(LogCategory));
        this.performanceMarkers = new Map();
        this.logHistory = [];
        this.maxHistorySize = 1000;
        
        // Performance tracking
        this.frameCount = 0;
        this.totalFrameTime = 0;
        this.slowFrames = 0;
        
        // Console styling
        this.styles = {
            [LogLevel.DEBUG]: 'color: #888; font-size: 0.9em',
            [LogLevel.INFO]: 'color: #333',
            [LogLevel.WARN]: 'color: #ff9800; font-weight: bold',
            [LogLevel.ERROR]: 'color: #f44336; font-weight: bold',
            [LogLevel.CRITICAL]: 'color: #fff; background: #f44336; font-weight: bold; padding: 2px 4px'
        };
    }
    
    setLevel(level) {
        this.level = level;
    }
    
    enableCategory(category) {
        this.enabledCategories.add(category);
    }
    
    disableCategory(category) {
        this.enabledCategories.delete(category);
    }
    
    enableOnlyCategories(...categories) {
        this.enabledCategories.clear();
        categories.forEach(cat => this.enabledCategories.add(cat));
    }
    
    disableAllCategories() {
        this.enabledCategories.clear();
    }
    
    enableAllCategories() {
        Object.values(LogCategory).forEach(cat => this.enabledCategories.add(cat));
    }
    
    log(level, category, message, data = null) {
        // Check if we should log this
        if (level < this.level || !this.enabledCategories.has(category)) {
            return;
        }
        
        const timestamp = performance.now();
        const logEntry = {
            timestamp,
            level,
            category,
            message,
            data
        };
        
        // Add to history
        this.logHistory.push(logEntry);
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
        
        // Format and output
        const levelName = this.getLevelName(level);
        const style = this.styles[level] || '';
        const prefix = `[${category}]`;
        
        if (data) {
            console.log(`%c${prefix} ${message}`, style, data);
        } else {
            console.log(`%c${prefix} ${message}`, style);
        }
    }
    
    debug(category, message, data) {
        this.log(LogLevel.DEBUG, category, message, data);
    }
    
    info(category, message, data) {
        this.log(LogLevel.INFO, category, message, data);
    }
    
    warn(category, message, data) {
        this.log(LogLevel.WARN, category, message, data);
    }
    
    error(category, message, data) {
        this.log(LogLevel.ERROR, category, message, data);
        
        // Also log stack trace for errors
        if (data instanceof Error) {
            console.error(data.stack);
        }
    }
    
    critical(category, message, data) {
        this.log(LogLevel.CRITICAL, category, message, data);
        
        // Critical errors should always show stack
        console.trace();
    }
    
    // Performance tracking methods
    startTimer(label) {
        this.performanceMarkers.set(label, performance.now());
    }
    
    endTimer(label, category = LogCategory.PERFORMANCE) {
        const startTime = this.performanceMarkers.get(label);
        if (!startTime) {
            this.warn(category, `Timer '${label}' was not started`);
            return;
        }
        
        const duration = performance.now() - startTime;
        this.performanceMarkers.delete(label);
        
        // Only log if it's significant (> 1ms)
        if (duration > 1) {
            this.debug(category, `${label}: ${duration.toFixed(2)}ms`);
        }
        
        return duration;
    }
    
    frameStart() {
        this.frameStartTime = performance.now();
    }
    
    frameEnd(targetFPS = 60) {
        if (!this.frameStartTime) return;
        
        const frameTime = performance.now() - this.frameStartTime;
        const targetFrameTime = 1000 / targetFPS;
        
        this.frameCount++;
        this.totalFrameTime += frameTime;
        
        if (frameTime > targetFrameTime * 1.5) {
            this.slowFrames++;
            
            // Log slow frames periodically
            if (this.slowFrames % 10 === 0) {
                this.warn(LogCategory.PERFORMANCE, 
                    `Slow frame detected: ${frameTime.toFixed(1)}ms (target: ${targetFrameTime.toFixed(1)}ms)`);
            }
        }
        
        // Log average performance every 60 frames
        if (this.frameCount % 60 === 0) {
            const avgFrameTime = this.totalFrameTime / this.frameCount;
            const avgFPS = 1000 / avgFrameTime;
            
            if (avgFPS < targetFPS * 0.9) {
                this.info(LogCategory.PERFORMANCE, 
                    `Average FPS: ${avgFPS.toFixed(1)} (${this.slowFrames} slow frames)`);
            }
            
            // Reset counters
            this.frameCount = 0;
            this.totalFrameTime = 0;
            this.slowFrames = 0;
        }
    }
    
    // Utility methods
    getLevelName(level) {
        const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
        return names[level] || 'UNKNOWN';
    }
    
    getHistory(filter = {}) {
        let history = [...this.logHistory];
        
        if (filter.level !== undefined) {
            history = history.filter(entry => entry.level >= filter.level);
        }
        
        if (filter.category) {
            history = history.filter(entry => entry.category === filter.category);
        }
        
        if (filter.since) {
            history = history.filter(entry => entry.timestamp >= filter.since);
        }
        
        return history;
    }
    
    clearHistory() {
        this.logHistory = [];
    }
    
    // Group logging for related operations
    group(label) {
        console.group(label);
    }
    
    groupEnd() {
        console.groupEnd();
    }
    
    // Table logging for structured data
    table(data, columns) {
        console.table(data, columns);
    }
}

// Create singleton instance
const logger = new Logger();

// Export singleton and utilities
export default logger;

// Convenience functions for common operations
export function logPlayerAction(action, details) {
    logger.info(LogCategory.PLAYER, action, details);
}

export function logEnemyAction(enemyType, action, details) {
    logger.debug(LogCategory.ENEMY, `${enemyType}: ${action}`, details);
}

export function logWeaponAction(weapon, action, details) {
    logger.debug(LogCategory.WEAPON, `${weapon}: ${action}`, details);
}

export function logCollision(objectA, objectB, details) {
    logger.debug(LogCategory.COLLISION, `${objectA} <-> ${objectB}`, details);
}

export function logPerformance(metric, value, threshold) {
    if (value > threshold) {
        logger.warn(LogCategory.PERFORMANCE, `${metric} exceeded threshold`, {
            value,
            threshold,
            excess: value - threshold
        });
    }
}

export function logError(category, error, context) {
    logger.error(category, error.message, {
        error,
        context,
        stack: error.stack
    });
}

// Development helpers
export function enableDebugMode() {
    logger.setLevel(LogLevel.DEBUG);
    logger.enableAllCategories();
    console.log('%c[Logger] Debug mode enabled', 'color: #4caf50; font-weight: bold');
}

export function enableProductionMode() {
    logger.setLevel(LogLevel.WARN);
    logger.disableCategory(LogCategory.DEBUG);
    logger.disableCategory(LogCategory.PERFORMANCE);
}

// Performance profiling helper
export function profile(fn, label = 'Operation') {
    return function(...args) {
        logger.startTimer(label);
        try {
            const result = fn.apply(this, args);
            const duration = logger.endTimer(label);
            
            // Log if unusually slow
            if (duration > 16) { // More than one frame at 60fps
                logger.warn(LogCategory.PERFORMANCE, `Slow operation: ${label}`, {
                    duration: `${duration.toFixed(2)}ms`,
                    args
                });
            }
            
            return result;
        } catch (error) {
            logger.endTimer(label);
            logger.error(LogCategory.SYSTEM, `Error in ${label}`, error);
            throw error;
        }
    };
}
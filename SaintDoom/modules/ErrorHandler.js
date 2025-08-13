// Error Handling System
// Provides centralized error handling with recovery strategies

import logger, { LogCategory } from './Logger.js';

export class GameError extends Error {
    constructor(message, category = LogCategory.SYSTEM, recoverable = true) {
        super(message);
        this.name = 'GameError';
        this.category = category;
        this.recoverable = recoverable;
        this.timestamp = Date.now();
    }
}

export class AssetError extends GameError {
    constructor(message, assetPath) {
        super(message, LogCategory.SYSTEM, true);
        this.name = 'AssetError';
        this.assetPath = assetPath;
    }
}

export class PhysicsError extends GameError {
    constructor(message, object) {
        super(message, LogCategory.PHYSICS, true);
        this.name = 'PhysicsError';
        this.object = object;
    }
}

export class NetworkError extends GameError {
    constructor(message, statusCode) {
        super(message, LogCategory.SYSTEM, true);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
    }
}

class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.errorThreshold = 10; // Max errors per minute before emergency mode
        this.lastMinuteErrors = [];
        this.recoveryStrategies = new Map();
        this.isInEmergencyMode = false;
        
        // Register default recovery strategies
        this.registerDefaultStrategies();
        
        // Setup global error handlers
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.handleError(new GameError(
                `Uncaught error: ${event.message}`,
                LogCategory.SYSTEM,
                false
            ), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
            
            // Prevent default error handling
            event.preventDefault();
        });
        
        // Handle promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new GameError(
                `Unhandled promise rejection: ${event.reason}`,
                LogCategory.SYSTEM,
                false
            ));
            
            // Prevent default error handling
            event.preventDefault();
        });
    }
    
    registerDefaultStrategies() {
        // Asset loading errors
        this.registerRecoveryStrategy('AssetError', async (error) => {
            logger.warn(LogCategory.SYSTEM, `Asset loading failed: ${error.assetPath}`, {
                path: error.assetPath,
                message: error.message
            });
            
            // Try to use fallback asset
            return {
                success: true,
                fallback: 'default',
                message: 'Using default asset'
            };
        });
        
        // Physics errors
        this.registerRecoveryStrategy('PhysicsError', async (error) => {
            logger.warn(LogCategory.PHYSICS, 'Physics error detected', {
                object: error.object,
                message: error.message
            });
            
            // Reset object to safe state
            if (error.object && error.object.position) {
                error.object.position.set(0, 0, 0);
                error.object.velocity?.set(0, 0, 0);
            }
            
            return {
                success: true,
                message: 'Object reset to safe state'
            };
        });
        
        // Network errors
        this.registerRecoveryStrategy('NetworkError', async (error) => {
            logger.error(LogCategory.SYSTEM, 'Network error', {
                statusCode: error.statusCode,
                message: error.message
            });
            
            // Could implement retry logic here
            return {
                success: false,
                message: 'Network error - manual intervention required'
            };
        });
        
        // Generic game errors
        this.registerRecoveryStrategy('GameError', async (error) => {
            if (error.recoverable) {
                logger.warn(error.category, 'Recoverable error', {
                    message: error.message
                });
                
                return {
                    success: true,
                    message: 'Error logged, continuing execution'
                };
            } else {
                logger.critical(error.category, 'Non-recoverable error', {
                    message: error.message
                });
                
                return {
                    success: false,
                    message: 'Critical error - game state may be corrupted'
                };
            }
        });
    }
    
    registerRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }
    
    async handleError(error, context = {}) {
        this.errorCount++;
        
        // Track error history
        const errorEntry = {
            error,
            context,
            timestamp: Date.now(),
            handled: false
        };
        
        this.errorHistory.push(errorEntry);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
        
        // Check error rate
        this.updateErrorRate();
        
        // Log the error
        logger.error(error.category || LogCategory.SYSTEM, error.message, {
            error,
            context,
            errorCount: this.errorCount,
            isEmergencyMode: this.isInEmergencyMode
        });
        
        // Try recovery strategy
        const strategy = this.recoveryStrategies.get(error.name) || 
                        this.recoveryStrategies.get('GameError');
        
        if (strategy) {
            try {
                const result = await strategy(error, context);
                errorEntry.handled = true;
                errorEntry.recoveryResult = result;
                
                if (!result.success && !this.isInEmergencyMode) {
                    this.enterEmergencyMode();
                }
                
                return result;
            } catch (recoveryError) {
                logger.critical(LogCategory.SYSTEM, 'Recovery strategy failed', {
                    originalError: error,
                    recoveryError
                });
            }
        }
        
        // No recovery strategy available
        if (!this.isInEmergencyMode) {
            this.enterEmergencyMode();
        }
        
        return {
            success: false,
            message: 'No recovery strategy available'
        };
    }
    
    updateErrorRate() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove old errors from rate tracking
        this.lastMinuteErrors = this.lastMinuteErrors.filter(
            timestamp => timestamp > oneMinuteAgo
        );
        
        // Add current error
        this.lastMinuteErrors.push(now);
        
        // Check if we've exceeded threshold
        if (this.lastMinuteErrors.length > this.errorThreshold && !this.isInEmergencyMode) {
            logger.critical(LogCategory.SYSTEM, 'Error rate threshold exceeded', {
                errorCount: this.lastMinuteErrors.length,
                threshold: this.errorThreshold
            });
            this.enterEmergencyMode();
        }
    }
    
    enterEmergencyMode() {
        if (this.isInEmergencyMode) return;
        
        this.isInEmergencyMode = true;
        logger.critical(LogCategory.SYSTEM, 'ENTERING EMERGENCY MODE', {
            errorCount: this.errorCount,
            recentErrors: this.lastMinuteErrors.length
        });
        
        // Notify game to enter safe mode
        if (window.game) {
            window.game.enterSafeMode?.();
        }
        
        // Show error UI to user
        this.showErrorUI();
    }
    
    exitEmergencyMode() {
        if (!this.isInEmergencyMode) return;
        
        this.isInEmergencyMode = false;
        this.lastMinuteErrors = [];
        logger.info(LogCategory.SYSTEM, 'Exiting emergency mode');
        
        // Hide error UI
        this.hideErrorUI();
    }
    
    showErrorUI() {
        // Create or update error overlay
        let errorOverlay = document.getElementById('error-overlay');
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'error-overlay';
            errorOverlay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(255, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(errorOverlay);
        }
        
        errorOverlay.innerHTML = `
            <strong>⚠️ EMERGENCY MODE</strong><br>
            Multiple errors detected<br>
            Errors: ${this.errorCount}<br>
            <small>Game running in safe mode</small><br>
            <button onclick="window.errorHandler.attemptRecovery()" 
                    style="margin-top: 5px; cursor: pointer;">
                Attempt Recovery
            </button>
        `;
    }
    
    hideErrorUI() {
        const errorOverlay = document.getElementById('error-overlay');
        if (errorOverlay) {
            errorOverlay.remove();
        }
    }
    
    attemptRecovery() {
        logger.info(LogCategory.SYSTEM, 'Attempting recovery from emergency mode');
        
        // Clear error history
        this.errorHistory = [];
        this.lastMinuteErrors = [];
        this.errorCount = 0;
        
        // Exit emergency mode
        this.exitEmergencyMode();
        
        // Try to restart game
        if (window.game) {
            window.game.restart?.();
        }
    }
    
    getErrorStats() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const fiveMinutesAgo = now - 300000;
        
        return {
            totalErrors: this.errorCount,
            lastMinute: this.lastMinuteErrors.length,
            lastFiveMinutes: this.errorHistory.filter(
                e => e.timestamp > fiveMinutesAgo
            ).length,
            isEmergencyMode: this.isInEmergencyMode,
            errorTypes: this.getErrorTypeBreakdown()
        };
    }
    
    getErrorTypeBreakdown() {
        const breakdown = {};
        
        this.errorHistory.forEach(entry => {
            const type = entry.error.name || 'Unknown';
            breakdown[type] = (breakdown[type] || 0) + 1;
        });
        
        return breakdown;
    }
    
    clearErrors() {
        this.errorHistory = [];
        this.errorCount = 0;
        this.lastMinuteErrors = [];
        logger.info(LogCategory.SYSTEM, 'Error history cleared');
    }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export singleton and utilities
export default errorHandler;

// Convenience wrapper for try-catch with automatic error handling
export async function safely(fn, context = {}) {
    try {
        return await fn();
    } catch (error) {
        const gameError = error instanceof GameError ? 
            error : 
            new GameError(error.message, LogCategory.SYSTEM, true);
        
        const result = await errorHandler.handleError(gameError, context);
        
        if (!result.success) {
            throw gameError;
        }
        
        return result.fallback;
    }
}

// Decorator for automatic error handling on class methods
export function handleErrors(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
        try {
            return await originalMethod.apply(this, args);
        } catch (error) {
            const gameError = error instanceof GameError ? 
                error : 
                new GameError(
                    `Error in ${target.constructor.name}.${propertyName}: ${error.message}`,
                    LogCategory.SYSTEM,
                    true
                );
            
            await errorHandler.handleError(gameError, {
                class: target.constructor.name,
                method: propertyName,
                args
            });
            
            throw gameError;
        }
    };
    
    return descriptor;
}

// Make error handler globally accessible for UI
window.errorHandler = errorHandler;
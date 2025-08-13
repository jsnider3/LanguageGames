// Input Manager Module
// Handles all keyboard and mouse input for the game

export class InputManager {
    constructor(gameRef = null) {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.mouseButtons = {};
        this.isPointerLocked = false;
        this.gameRef = gameRef;
        
        this.setupEventListeners();
    }
    
    setGame(gameRef) {
        this.gameRef = gameRef;
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // F3 toggles debug mode
            if (e.code === 'F3') {
                e.preventDefault();
                const game = this.gameRef || (typeof window !== 'undefined' ? window.currentGame : null);
                if (game) {
                    game.debugMode = !game.debugMode;
                    console.log(`Debug mode: ${game.debugMode ? 'ON' : 'OFF'}`);
                    if (game.debugMode) game.showDebugInfo();
                }
            }
            
            // E key handled silently
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'KeyE'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseDeltaX = e.movementX;
                this.mouseDeltaY = e.movementY;
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            // Check both document.body and the canvas element for pointer lock
            this.isPointerLocked = document.pointerLockElement === document.body || 
                                  document.pointerLockElement === document.getElementById('gameCanvas') ||
                                  document.pointerLockElement !== null;
            if (!this.isPointerLocked) {
                this.mouseDeltaX = 0;
                this.mouseDeltaY = 0;
            }
        });
        
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    getInput() {
        const input = {
            forward: this.keys['KeyW'] || false,
            backward: this.keys['KeyS'] || false,
            left: this.keys['KeyA'] || false,
            right: this.keys['KeyD'] || false,
            jump: this.keys['Space'] || false,
            sprint: this.keys['ShiftLeft'] || false,
            attack: this.mouseButtons[0] || false,
            block: this.mouseButtons[2] || false,
            weapon1: this.keys['Digit1'] || false,
            weapon2: this.keys['Digit2'] || false,
            weapon3: this.keys['Digit3'] || false,
            weapon4: this.keys['Digit4'] || false,
            rage: this.keys['KeyR'] || false,
            interact: this.keys['KeyE'] || false,
            mouseDeltaX: this.mouseDeltaX,
            mouseDeltaY: this.mouseDeltaY,
            pause: this.keys['Escape'] || false
        };
        
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        
        // Clear weapon switch and rage inputs after reading
        this.keys['Digit1'] = false;
        this.keys['Digit2'] = false;
        this.keys['Digit3'] = false;
        this.keys['Digit4'] = false;
        this.keys['KeyR'] = false;
        // Don't clear KeyE here - let it be handled naturally
        
        return input;
    }
    
    reset() {
        this.keys = {};
        this.mouseButtons = {};
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
    }
}

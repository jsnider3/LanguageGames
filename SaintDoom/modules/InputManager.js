// Input Manager Module
// Handles all keyboard and mouse input for the game

export class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.mouseButtons = {};
        this.isPointerLocked = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
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
            
            // Request pointer lock if game is running and not paused
            if (!this.isPointerLocked) {
                const game = window.currentGame; // We'll set this reference
                if (game && game.isRunning && !game.isPaused) {
                    document.body.requestPointerLock();
                }
            }
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
            this.isPointerLocked = document.pointerLockElement === document.body;
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
        this.mouseButtons[0] = false;
        
        // Clear weapon switch and rage inputs after reading
        this.keys['Digit1'] = false;
        this.keys['Digit2'] = false;
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
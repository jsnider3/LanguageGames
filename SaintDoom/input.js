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
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events
        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
            
            // Request pointer lock on click
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
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
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
            
            if (!this.isPointerLocked) {
                // Reset mouse deltas when pointer lock is lost
                this.mouseDeltaX = 0;
                this.mouseDeltaY = 0;
            }
        });
        
        // Prevent right-click context menu
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    getInput() {
        const input = {
            // Movement
            forward: this.keys['KeyW'] || false,
            backward: this.keys['KeyS'] || false,
            left: this.keys['KeyA'] || false,
            right: this.keys['KeyD'] || false,
            jump: this.keys['Space'] || false,
            sprint: this.keys['ShiftLeft'] || false,
            
            // Combat
            attack: this.mouseButtons[0] || false,  // Left click
            block: this.mouseButtons[2] || false,   // Right click
            
            // Weapon switching
            weapon1: this.keys['Digit1'] || false,
            weapon2: this.keys['Digit2'] || false,
            weapon3: this.keys['Digit3'] || false,
            weapon4: this.keys['Digit4'] || false,
            
            // Interaction
            use: this.keys['KeyE'] || false,
            reload: this.keys['KeyR'] || false,
            
            // Mouse look
            mouseDeltaX: this.mouseDeltaX,
            mouseDeltaY: this.mouseDeltaY,
            
            // System
            pause: this.keys['Escape'] || false
        };
        
        // Reset mouse deltas after reading
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        
        // Clear single-press inputs
        this.mouseButtons[0] = false; // Attack is single press
        
        return input;
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    isMouseButtonPressed(button) {
        return this.mouseButtons[button] || false;
    }
    
    reset() {
        this.keys = {};
        this.mouseButtons = {};
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
    }
}
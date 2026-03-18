import { LANE_KEYS } from './Constants.js';

// ═══════════════════════════════════════════════════════════
// INPUT MANAGER - Keyboard and mouse input handling
// ═══════════════════════════════════════════════════════════

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Lane key states (4 lanes)
        this.lanePressed = [false, false, false, false];
        this.laneJustPressed = [false, false, false, false];
        this.laneJustReleased = [false, false, false, false];
        this.lanePressTimestamps = [0, 0, 0, 0];

        // UI key states
        this.escapePressed = false;
        this.enterPressed = false;
        this.arrowUpPressed = false;
        this.arrowDownPressed = false;
        this.arrowLeftPressed = false;
        this.arrowRightPressed = false;
        this.qPressed = false;
        this.clickedThisFrame = false;

        // Bind handlers so we can remove them later
        this._boundKeyDown = this._onKeyDown.bind(this);
        this._boundKeyUp = this._onKeyUp.bind(this);
        this._boundClick = this._onClick.bind(this);

        window.addEventListener('keydown', this._boundKeyDown);
        window.addEventListener('keyup', this._boundKeyUp);
        canvas.addEventListener('click', this._boundClick);
    }

    // ───────────────────────────────────────────────────────
    // KEY DOWN
    // ───────────────────────────────────────────────────────

    _onKeyDown(e) {
        // Lane keys
        for (let i = 0; i < LANE_KEYS.length; i++) {
            if (e.key === LANE_KEYS[i]) {
                e.preventDefault();
                if (!this.lanePressed[i]) {
                    this.lanePressed[i] = true;
                    this.laneJustPressed[i] = true;
                    this.lanePressTimestamps[i] = performance.now();
                }
                return;
            }
        }

        // UI keys
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.escapePressed = true;
                break;
            case 'Enter':
                e.preventDefault();
                this.enterPressed = true;
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.arrowUpPressed = true;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.arrowDownPressed = true;
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.arrowLeftPressed = true;
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.arrowRightPressed = true;
                break;
            case 'q':
            case 'Q':
                e.preventDefault();
                this.qPressed = true;
                break;
        }
    }

    // ───────────────────────────────────────────────────────
    // KEY UP
    // ───────────────────────────────────────────────────────

    _onKeyUp(e) {
        for (let i = 0; i < LANE_KEYS.length; i++) {
            if (e.key === LANE_KEYS[i]) {
                this.lanePressed[i] = false;
                this.laneJustReleased[i] = true;
                return;
            }
        }
    }

    // ───────────────────────────────────────────────────────
    // CLICK
    // ───────────────────────────────────────────────────────

    _onClick() {
        this.clickedThisFrame = true;
    }

    // ───────────────────────────────────────────────────────
    // FRAME CLEANUP
    // ───────────────────────────────────────────────────────

    consumeFrameInputs() {
        for (let i = 0; i < 4; i++) {
            this.laneJustPressed[i] = false;
            this.laneJustReleased[i] = false;
        }
        this.escapePressed = false;
        this.enterPressed = false;
        this.arrowUpPressed = false;
        this.arrowDownPressed = false;
        this.arrowLeftPressed = false;
        this.arrowRightPressed = false;
        this.qPressed = false;
        this.clickedThisFrame = false;
    }

    // ───────────────────────────────────────────────────────
    // LANE PRESS TIMESTAMP
    // ───────────────────────────────────────────────────────

    getLanePressTime(lane) {
        return this.lanePressTimestamps[lane];
    }

    // ───────────────────────────────────────────────────────
    // DESTROY
    // ───────────────────────────────────────────────────────

    destroy() {
        window.removeEventListener('keydown', this._boundKeyDown);
        window.removeEventListener('keyup', this._boundKeyUp);
        this.canvas.removeEventListener('click', this._boundClick);
    }
}

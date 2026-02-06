/**
 * LevelManager.js
 * Handles loading levels and verifying win conditions.
 */
import { LEVELS } from './Levels.js';

export class LevelManager {
    constructor(engine) {
        this.engine = engine;
        this.currentLevelIdx = 0;
        this.currentLevel = null;

        // Validation State
        this.isValidating = false;
        this.currentTestCase = 0;
        this.testCaseTimer = 0;
        this.results = []; // Array of bools
    }

    loadLevel(index) {
        if (index < 0 || index >= LEVELS.length) return;

        this.currentLevelIdx = index;
        this.currentLevel = LEVELS[index];
        // Full reset for new level (remove even locked components)
        this.engine.components.components = [];
        this.engine.components.wires = [];
        this.isValidating = false;

        console.log(`Loading Level ${index}: ${this.currentLevel.title}`);

        // Update UI
        document.getElementById('level-objective').innerText =
            `LVL ${index}: ${this.currentLevel.title}\n${this.currentLevel.description}`;

        // Spawn Fixed Layout
        this.currentLevel.layout.forEach(item => {
            const comp = this.engine.components.addComponent(item.type, item.x, item.y, true); // true = locked
            comp.label = item.label;
            comp.id = item.id;
        });
    }

    startValidation() {
        this.isValidating = true;
        this.currentTestCase = 0;
        this.testCaseTimer = 0;
        this.results = [];
        this.engine.isRunning = true;

        this.applyIterativeInputs();
        this.updateValidationUI("RUNNING TESTS...");
    }

    stopValidation() {
        this.isValidating = false;
        this.engine.isRunning = false;
        this.resetInputs();
        this.updateValidationUI("HALTED");
    }

    update(dt) {
        if (!this.isValidating) return;

        this.testCaseTimer += dt;

        // Wait X seconds per test case to allow signal to propagate
        const TEST_DURATION = 1500; // 1.5 seconds per case

        // Sampling point: check at 80% of duration to be safe
        if (this.testCaseTimer > TEST_DURATION * 0.8 && this.results.length === this.currentTestCase) {
            this.checkCurrentCase();
        }

        if (this.testCaseTimer > TEST_DURATION) {
            this.nextTestCase();
        }
    }

    applyIterativeInputs() {
        if (this.currentTestCase >= this.currentLevel.testCases.length) return;

        const testCase = this.currentLevel.testCases[this.currentTestCase];
        const inputs = testCase.inputs;

        // Apply to Emitter Components
        // We assume emitters are indexed 'in_0', 'in_1' etc match the input array
        inputs.forEach((val, idx) => {
            const flowVal = val === 1;
            // Find the component
            const comp = this.engine.components.getComponentById(`in_${idx}`);
            if (comp) {
                comp.forceOutput = flowVal; // Tell logic simulator to force this
                comp.output = flowVal;
                comp.state = flowVal;
            }
        });
    }

    checkCurrentCase() {
        const testCase = this.currentLevel.testCases[this.currentTestCase];
        const expected = testCase.expected;

        let allMatch = true;
        expected.forEach((val, idx) => {
            const comp = this.engine.components.getComponentById(`out_${idx}`);
            if (comp) {
                const actual = comp.inputs[0] ? 1 : 0; // Receiver state comes from its input
                if (actual !== val) allMatch = false;
            } else {
                allMatch = false;
            }
        });

        this.results.push(allMatch);
        const status = allMatch ? "PASS" : "FAIL";
        console.log(`Test Case ${this.currentTestCase}: ${status}`);

        this.updateValidationUI(`TEST ${this.currentTestCase + 1}/${this.currentLevel.testCases.length}: ${status}`);
    }

    nextTestCase() {
        this.currentTestCase++;
        this.testCaseTimer = 0;

        if (this.currentTestCase >= this.currentLevel.testCases.length) {
            this.finishValidation();
        } else {
            this.applyIterativeInputs();
        }
    }

    finishValidation() {
        this.isValidating = false;
        this.engine.isRunning = false;

        const allPassed = this.results.every(r => r === true);
        if (allPassed) {
            this.updateValidationUI("SEQUENCE COMPLETE: SUCCESS");

            // Calc stats
            const silicon = this.engine.components.components.length; // Raw count
            const cycles = this.engine.totalCycles;

            // Save
            this.engine.saveSystem.markLevelComplete(this.currentLevelIdx, silicon, cycles);

            // UI
            if (this.engine.ui) {
                this.engine.ui.showVictory(silicon, cycles);
            }
        } else {
            this.updateValidationUI("SEQUENCE FAILED. CHECK LOGIC.");
            this.engine.audio.playFail();
        }
    }

    resetInputs() {
        // Reset all emitters to OFF
        this.engine.components.components.forEach(c => {
            if (c.type === 'EMITTER') {
                c.output = false;
                c.state = false;
                c.forceOutput = undefined;
            }
        });
    }

    updateValidationUI(msg) {
        // We can reuse the objective text or add a status bar
        // For now let's just log it or carefuly append
        // Ideally we'd have a specific status element
        const statusEl = document.querySelector('.system-status .value.online');
        if (statusEl) statusEl.innerText = msg;
    }
}

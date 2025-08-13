import { BelialState } from '../../core/BelialState.js';

export class BelialFinalPhaseState extends BelialState {
    constructor(belial) {
        super(belial);
        this.belial.phase = 4;
    }

    enter() {
        console.log("Belial entered Final Phase State");
        this.belial.revealTrueForm();
    }

    update(deltaTime, player) {
        const currentTime = Date.now();

        // Constant form shifting
        if (currentTime - this.belial.lastFormChange > 5000) {
            this.belial.rapidFormShift();
        }

        // Maximum illusions
        while (this.belial.illusions.length < this.belial.maxIllusions) {
            this.belial.spawnIllusion();
        }

        // Continuous attacks
        if (currentTime - this.belial.lastAttackTime > 800) {
            this.performAttack(player);
            this.belial.darknessIncarnate(player);
            this.belial.lastAttackTime = currentTime;
        }

        // Reality breaking
        if (currentTime - this.belial.lastAbilityUse > 3000) {
            this.belial.breakReality(player);
            this.belial.lastAbilityUse = currentTime;
        }

        // Teleport frequently
        if (Math.random() < 0.02) {
            this.belial.teleportToIllusion();
        }
    }

    exit() {
        console.log("Belial exiting Final Phase State");
    }
}

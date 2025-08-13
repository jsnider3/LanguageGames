import { BelialState } from '../../core/BelialState.js';

export class BelialPhaseTwoState extends BelialState {
    constructor(belial) {
        super(belial);
        this.belial.phase = 2;
    }

    enter() {
        console.log("Belial entered Phase Two State");
        // Visual changes for Phase Two if any (e.g., more intense aura)
        // Ensure Belial is in a specific form for this phase, or allow random forms
        this.belial.changeForm(); // Belial will now randomly change forms
    }

    update(deltaTime, player) {
        const currentTime = Date.now();
        const playerPosition = player.position || player.mesh.position;
        const distance = this.belial.position.distanceTo(playerPosition);

        if (currentTime - this.belial.lastAbilityUse > 5000) {
            this.belial.castLie(player);
            this.belial.lastAbilityUse = currentTime;
        }

        if (this.belial.illusions.length < 3) {
            this.belial.spawnIllusion();
        }

        // Teleporting between positions
        if (Math.random() < 0.01) {
            this.belial.teleportToIllusion();
        }

        // Ranged attacks
        if (distance <= this.belial.attackRange && currentTime - this.belial.lastAttackTime > 1500) {
            this.performAttack(player);
            this.belial.shadowWave(player);
            this.belial.lastAttackTime = currentTime;
        }

        // Check for phase transition
        this.belial.updatePhase();
    }

    exit() {
        console.log("Belial exiting Phase Two State");
    }
}

import { BelialState } from '../../core/BelialState.js';

export class BelialPhaseThreeState extends BelialState {
    constructor(belial) {
        super(belial);
        this.belial.phase = 3;
    }

    enter() {
        console.log("Belial entered Phase Three State");
        this.belial.changeForm(); // Belial will now randomly change forms
        // Activate Shadow Realm
        this.belial.activateShadowRealm();
    }

    update(deltaTime, player) {
        const currentTime = Date.now();
        const playerPosition = player.position || player.mesh.position;
        const distance = this.belial.position.distanceTo(playerPosition);

        // Maintain shadow realm
        if (this.belial.shadowRealm) {
            this.belial.updateShadowRealm(player);
        }

        // Create reality tears
        if (currentTime - this.belial.lastAbilityUse > 4000) {
            this.belial.createRealityTear(player);
            this.belial.lastAbilityUse = currentTime;
        }

        // Aggressive illusion spawning
        if (this.belial.illusions.length < this.belial.maxIllusions) {
            this.belial.spawnIllusion();
        }

        // Mind prison
        if (Math.random() < 0.005 && !this.belial.mindPrison) {
            this.belial.createMindPrison(player);
        }

        // Combat
        if (currentTime - this.belial.lastAttackTime > 1000) {
            this.performAttack(player);
            this.belial.lastAttackTime = currentTime;
        }

        // Check for phase transition
        this.belial.updatePhase();
    }

    exit() {
        console.log("Belial exiting Phase Three State");
    }
}

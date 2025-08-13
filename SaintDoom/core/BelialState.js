export class BelialState {
    constructor(belial) {
        this.belial = belial;
    }

    enter() {
        // Called when entering this state
    }

    update(deltaTime, player) {
        // Called every frame while in this state
    }

    exit() {
        // Called when exiting this state
    }

    // Helper to perform attacks based on current form's abilities
    performAttack(player) {
        const abilities = this.belial.forms[this.belial.currentForm].abilities;
        const ability = abilities[Math.floor(Math.random() * abilities.length)];

        switch (ability) {
            case 'shadow_wave':
                this.belial.shadowWave(player);
                break;
            case 'illusion_army':
                this.belial.spawnIllusionArmy();
                break;
            case 'reality_tear':
                this.belial.createRealityTear(player);
                break;
            case 'mind_prison':
                this.belial.createMindPrison(player);
                break;
            case 'false_light':
                this.belial.falseLight(player);
                break;
            case 'corrupt_blessing':
                this.belial.corruptBlessing(player);
                break;
            case 'divine_deception':
                this.belial.divineDeception(player);
                break;
            case 'dark_sermon':
                this.belial.darkSermon(player);
                break;
            case 'corrupt_prayer':
                this.belial.corruptPrayer(player);
                break;
            case 'false_martyrdom':
                this.belial.falseMartyrdom(player);
                break;
            case 'summon_agents':
                this.belial.summonAgents();
                break;
            case 'temporal_shift':
                this.belial.temporalShift(player);
                break;
            case 'mind_control':
                this.belial.mindControl(player);
                break;
            case 'void_strike':
                this.belial.voidStrike(player);
                break;
            case 'darkness_incarnate':
                this.belial.darknessIncarnate(player);
                break;
            case 'shadow_split':
                this.belial.shadowSplit();
                break;
        }
    }
}

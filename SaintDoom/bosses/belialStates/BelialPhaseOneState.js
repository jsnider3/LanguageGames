import { BelialState } from '../../core/BelialState.js';

export class BelialPhaseOneState extends BelialState {
    constructor(belial) {
        super(belial);
        this.belial.currentForm = 'true'; // Ensure initial form is true
        this.belial.phase = 1;
    }

    enter() {
        console.log("Belial entered Phase One State (True Form)");
        // Apply true form visuals
        this.belial.body.material.color.setHex(this.belial.forms.true.color);
        this.belial.body.material.emissive = new THREE.Color(0x220000);
        this.belial.body.material.emissiveIntensity = 0.5;
        this.belial.body.material.opacity = 0.9;

        // Ensure wings are visible and set to true form appearance
        this.belial.wings.forEach(wing => {
            wing.visible = true;
            wing.children[0].material.color.setHex(0x440000);
            wing.children[0].material.emissive = new THREE.Color(0x220000);
            wing.children[0].material.emissiveIntensity = 0.3;
            wing.children[0].material.opacity = 0.7;
        });

        // Reset faces to true form demonic eyes
        this.belial.faces.forEach(face => {
            face.children[0].material.color.setHex(0xffddaa);
            face.children[1].material.color.setHex(0xff0000);
            face.children[2].material.color.setHex(0xff0000);
        });

        // Hide false halo if it exists from previous forms
        if (this.belial.falseHalo) {
            this.belial.mesh.remove(this.belial.falseHalo);
            this.belial.falseHalo = null;
        }

        // Reset stats for this phase
        this.belial.damage = this.belial.forms.true.damage;
        this.belial.speed = 2.5;
    }

    update(deltaTime, player) {
        // Deceptive combat - form switching and basic illusions
        const playerPosition = player.position || player.mesh.position;
        const distance = this.belial.position.distanceTo(playerPosition);

        if (distance <= this.belial.attackRange) {
            const currentTime = Date.now();
            
            if (currentTime - this.belial.lastAttackTime > 2000) {
                this.performAttack(player);
                this.belial.lastAttackTime = currentTime;
            }

            if (currentTime - this.belial.lastIllusionSpawn > 8000) {
                this.belial.spawnIllusion();
                this.belial.lastIllusionSpawn = currentTime;
            }
        }

        // Movement pattern - slow approach
        if (distance > 5) {
            const direction = new THREE.Vector3()
                .subVectors(playerPosition, this.belial.position)
                .normalize();
            this.belial.position.add(direction.multiplyScalar(this.belial.speed * deltaTime));
        }

        // Check for phase transition
        this.belial.updatePhase();
    }

    exit() {
        console.log("Belial exiting Phase One State");
        // Clean up any state-specific effects if necessary
    }
}

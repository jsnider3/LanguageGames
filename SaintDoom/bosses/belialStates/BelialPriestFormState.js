import { BelialState } from '../../core/BelialState.js';
import * as THREE from 'three';

export class BelialPriestFormState extends BelialState {
    constructor(belial) {
        super(belial);
    }

    enter() {
        console.log("Belial transformed to Priest Form");
        // Black robes effect
        this.belial.wings.forEach(wing => {
            wing.visible = true;
            wing.children[0].material.color.setHex(0x000000);
            wing.children[0].material.opacity = 0.9;
        });

        // Corrupt rosary
        this.belial.createCorruptRosary();

        // Update appearance
        if (this.belial.body) {
            this.belial.body.material.color.setHex(this.belial.forms.priest.color);
        }

        // Update stats
        this.belial.damage = this.belial.forms.priest.damage;
    }

    update(deltaTime, player) {
        // Priest form specific update logic
    }

    exit() {
        console.log("Belial exiting Priest Form");
        // Clean up corrupt rosary if necessary
    }
}

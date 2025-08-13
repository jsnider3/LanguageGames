import { BelialState } from '../../core/BelialState.js';
import * as THREE from 'three';

export class BelialShadowFormState extends BelialState {
    constructor(belial) {
        super(belial);
    }

    enter() {
        console.log("Belial transformed to Shadow Form");
        // Pure darkness
        this.belial.body.material.opacity = 0.5;
        this.belial.wings.forEach(wing => {
            wing.visible = true;
            wing.children[0].material.color.setHex(0x000000);
            wing.children[0].material.opacity = 0.3;
        });

        // Shadow particles
        this.belial.createShadowParticles();

        // Update appearance
        if (this.belial.body) {
            this.belial.body.material.color.setHex(this.belial.forms.shadow.color);
        }

        // Update stats
        this.belial.damage = this.belial.forms.shadow.damage;
    }

    update(deltaTime, player) {
        // Shadow form specific update logic
    }

    exit() {
        console.log("Belial exiting Shadow Form");
        // Restore opacity
        this.belial.body.material.opacity = 0.9;
        this.belial.wings.forEach(wing => {
            wing.children[0].material.opacity = 0.7;
        });
        // Clean up shadow particles if necessary
    }
}

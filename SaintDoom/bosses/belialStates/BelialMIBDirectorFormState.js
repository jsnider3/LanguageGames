import { BelialState } from '../../core/BelialState.js';
import * as THREE from 'three';

export class BelialMIBDirectorFormState extends BelialState {
    constructor(belial) {
        super(belial);
    }

    enter() {
        console.log("Belial transformed to MIB Director Form");
        // MIB suit appearance
        this.belial.wings.forEach(wing => {
            wing.visible = false;
        });

        // Sunglasses effect on faces
        this.belial.faces.forEach(face => {
            face.children[1].material.color.setHex(0x000000);
            face.children[2].material.color.setHex(0x000000);
        });

        // Update appearance
        if (this.belial.body) {
            this.belial.body.material.color.setHex(this.belial.forms.mib_director.color);
        }

        // Update stats
        this.belial.damage = this.belial.forms.mib_director.damage;
    }

    update(deltaTime, player) {
        // MIB Director form specific update logic
    }

    exit() {
        console.log("Belial exiting MIB Director Form");
        // Restore wings visibility
        this.belial.wings.forEach(wing => {
            wing.visible = true;
        });
        // Restore original eye colors
        this.belial.faces.forEach(face => {
            face.children[1].material.color.setHex(0xff0000);
            face.children[2].material.color.setHex(0xff0000);
        });
    }
}

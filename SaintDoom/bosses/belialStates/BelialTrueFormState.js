import { BelialState } from '../../core/BelialState.js';
import * as THREE from 'three';

export class BelialTrueFormState extends BelialState {
    constructor(belial) {
        super(belial);
    }

    enter() {
        console.log("Belial transformed to True Form");
        // True form appearance
        this.belial.body.material.color.setHex(0x000000);
        this.belial.body.material.emissive = new THREE.Color(0x660000);
        this.belial.body.material.emissiveIntensity = 1.0;
        this.belial.body.scale.setScalar(1.5);

        // All faces become demonic
        this.belial.faces.forEach(face => {
            face.children[0].material.color.setHex(0x660000);
            face.children[1].material.color.setHex(0xffff00);
            face.children[2].material.color.setHex(0xffff00);
        });

        // Wings become massive
        this.belial.wings.forEach(wing => {
            wing.visible = true;
            wing.scale.setScalar(2);
            wing.children[0].material.color.setHex(0x000000);
            wing.children[0].material.emissive = new THREE.Color(0x440000);
        });

        // Update stats
        this.belial.damage = this.belial.forms.true.damage;
    }

    update(deltaTime, player) {
        // True form specific update logic
    }

    exit() {
        console.log("Belial exiting True Form");
        // Reset visuals if necessary
        this.belial.body.scale.setScalar(1);
        this.belial.wings.forEach(wing => {
            wing.scale.setScalar(1);
        });
    }
}

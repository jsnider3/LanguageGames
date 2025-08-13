import { BelialState } from '../../core/BelialState.js';
import * as THREE from 'three';

export class BelialAngelFormState extends BelialState {
    constructor(belial) {
        super(belial);
    }

    enter() {
        console.log("Belial transformed to Angel Form");
        // White wings and holy light (corrupted)
        this.belial.wings.forEach(wing => {
            wing.visible = true;
            wing.children[0].material.color.setHex(0xffffaa);
            wing.children[0].material.emissive = new THREE.Color(0xaaaa00);
            wing.children[0].material.emissiveIntensity = 0.5;
        });

        // False halo
        const haloGeometry = new THREE.TorusGeometry(1.2, 0.1, 8, 32);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xaaaa00,
            emissiveIntensity: 1.0
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.y = 7;
        halo.rotation.x = Math.PI / 2;
        this.belial.mesh.add(halo);
        this.belial.falseHalo = halo;

        // Update appearance
        if (this.belial.body) {
            this.belial.body.material.color.setHex(this.belial.forms.angel.color);
        }

        // Update stats
        this.belial.damage = this.belial.forms.angel.damage;
    }

    update(deltaTime, player) {
        // Angel form specific update logic
        // This state primarily defines visual and ability set
        // Combat logic is handled by the current phase state
    }

    exit() {
        console.log("Belial exiting Angel Form");
        // Clean up false halo
        if (this.belial.falseHalo) {
            this.belial.mesh.remove(this.belial.falseHalo);
            this.belial.falseHalo = null;
        }
    }
}

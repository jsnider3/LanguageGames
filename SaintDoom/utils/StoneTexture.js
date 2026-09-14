import * as THREE from "three";

/** A small, repeatable stone pattern; no downloaded texture assets. */
export function createStoneTexture(repeatX = 1, repeatY = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "#74706a";
  context.fillRect(0, 0, 256, 256);
  let seed = 17;
  for (let i = 0; i < 5000; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % 256;
    seed = (seed * 16807) % 2147483647;
    const y = seed % 256;
    context.fillStyle = i % 2 ? "#ffffff08" : "#0000000d";
    context.fillRect(x, y, 2, 2);
  }
  context.strokeStyle = "#2f2e2c";
  context.lineWidth = 3;
  context.strokeRect(0, 0, 256, 128);
  context.strokeRect(-128, 128, 256, 128);
  context.strokeRect(128, 128, 256, 128);
  context.strokeStyle = "#bbb3a622";
  context.lineWidth = 1;
  context.strokeRect(3, 3, 250, 122);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

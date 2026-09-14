import * as THREE from "three";
const loader = new THREE.TextureLoader();
function load(name, repeat = 1) {
  const texture = loader.load(`${import.meta.env.BASE_URL}textures/${name}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  return texture;
}
export const steel = load("armor-steel.png");
export const concrete = load("bunker-concrete.png");
export const groundConcrete = load("bunker-concrete.png", 20);
export const rockConcrete = load("bunker-concrete.png", 3);

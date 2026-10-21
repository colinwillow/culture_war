// three.js setup + tiny mesh helpers shared by all render code.
import * as THREE from 'three';

export { THREE };
export const canvas = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa9c8de);
scene.fog = new THREE.Fog(0xa9c8de, 140, 300);
export const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 700);
// Day light: cool sky fill, warm low-ish sun. ONE shadow-casting light whose small shadow box follows the camera
// target, and only units + player buildings cast (the city does not), so it stays cheap on a phone.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const hemi = new THREE.HemisphereLight(0xdcecff, 0x5a5048, 0.85);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xffe0b0, 1.25);
export const SUN_OFF = new THREE.Vector3(30, 60, 22);
sun.position.copy(SUN_OFF);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 10, far: 160 });
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
scene.add(sun, sun.target);
/** Keep the shadow box centred on what the camera looks at; snapped to texels so shadows don't shimmer while panning. */
export function followSun(x, z) {
  const step = 80 / 1024; x = Math.round(x / step) * step; z = Math.round(z / step) * step;
  sun.target.position.set(x, 0, z); sun.position.set(x + SUN_OFF.x, SUN_OFF.y, z + SUN_OFF.z);
}
/** Time of day, k = 0 (morning) .. 1 (golden hour): the sun drops lower, warmer and longer-shadowed, the sky
 * and fog go peach, the sky fill dims. Only colours and one direction change, so it costs nothing per frame. */
const DAY = { sun: new THREE.Color(0xffe0b0), dusk: new THREE.Color(0xff9c55), sky: new THREE.Color(0xa9c8de), skyD: new THREE.Color(0xf2b98e), hemi: new THREE.Color(0xdcecff), hemiD: new THREE.Color(0xffd2b0) };
export function setTimeOfDay(k) {
  sun.color.copy(DAY.sun).lerp(DAY.dusk, k); sun.intensity = 1.25 - 0.1 * k;
  SUN_OFF.set(30 + 25 * k, 60 - 18 * k, 22 + 14 * k);
  scene.background.copy(DAY.sky).lerp(DAY.skyD, k); scene.fog.color.copy(scene.background);
  hemi.color.copy(DAY.hemi).lerp(DAY.hemiD, k); hemi.intensity = 0.85 - 0.08 * k;
}
/** Mark a subtree as shadow casters. */
export function casts(o) { o.traverse((n) => { if (n.isMesh) n.castShadow = true; }); return o; }

const matCache = new Map();
const cached = new Set();
export function mat(c) {
  if (!matCache.has(c)) { const m = new THREE.MeshLambertMaterial({ color: c }); matCache.set(c, m); cached.add(m); }
  return matCache.get(c);
}
export function box(w, h, d, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); return m; }
export function cyl(rt, rb, h, c, x = 0, y = 0, z = 0, seg = 12) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y, z); return m; }
export function basic(c, o = 1) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide }); }
export function ringMesh(r0, r1, c, o) { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 40), basic(c, o)); m.rotation.x = -Math.PI / 2; m.position.y = 0.1; return m; }
export function disposeObj(o) {
  scene.remove(o);
  o.traverse((n) => {
    if (n.isSkinnedMesh) n.skeleton.dispose();
    if (n.userData.shared) return; // character clones share geometry/material with their prototype
    if (n.geometry) n.geometry.dispose();
    if (n.material && !cached.has(n.material) && n.material.dispose) n.material.dispose();
  });
}

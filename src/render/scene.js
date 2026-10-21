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
scene.add(new THREE.HemisphereLight(0xe4f0ff, 0x4a4a52, 0.95));
const sun = new THREE.DirectionalLight(0xfff0d8, 1.0);
sun.position.set(40, 80, 25);
scene.add(sun);

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
    if (n.geometry) n.geometry.dispose();
    if (n.material && !cached.has(n.material) && n.material.dispose) n.material.dispose();
  });
}

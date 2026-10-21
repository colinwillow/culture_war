// RTS camera: target point + distance + yaw. Pitch flattens as you zoom in ("ghost cam").
import { camera } from '../render/scene.js?v=71';
import { walkH } from '../map/layout.js?v=71';
import { smooth } from '../util/math.js?v=71';

export const CAM = { tx: 0, tz: 64, dist: 60, distT: 60, yaw: 0, view: 'high' };
let landscape = null;
const pitchFor = (d) => 0.38 + (1.12 - 0.38) * smooth(14, 110, d);
export const homeDist = () => (landscape ? 56 : 70);

export function applyCam(dt) {
  CAM.dist += (CAM.distT - CAM.dist) * Math.min(1, dt * 6);
  const pitch = pitchFor(CAM.dist), h = CAM.dist * Math.cos(pitch), v = CAM.dist * Math.sin(pitch), ty = walkH(CAM.tx, CAM.tz);
  camera.position.set(CAM.tx + Math.sin(CAM.yaw) * h, ty + v + 1, CAM.tz + Math.cos(CAM.yaw) * h);
  const minY = Math.max(0, walkH(camera.position.x, camera.position.z)) + 2.5;
  if (camera.position.y < minY) camera.position.y = minY;
  camera.lookAt(CAM.tx, ty + 1, CAM.tz);
  // Shake: jitter the view a little, decaying fast. Applied after lookAt so it never drifts the target.
  if (shakeK > 0.002) {
    const a = shakeK * (CAM.dist / 60);
    camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; camera.position.z += (Math.random() - 0.5) * a;
    shakeK *= Math.exp(-dt * 9);
  }
}
let shakeK = 0;
/** Kick the camera: strength in metres at the default zoom, softened by distance from what the camera looks at. */
export function shake(k, x, z) {
  const d = x === undefined ? 0 : Math.hypot(x - CAM.tx, z - CAM.tz);
  if (d > 60) return;
  shakeK = Math.min(2.5, Math.max(shakeK, k * (1 - d / 60)));
}
export function clampCam() {
  CAM.tx = Math.max(-62, Math.min(62, CAM.tx));
  CAM.tz = Math.max(-104, Math.min(104, CAM.tz));
  CAM.distT = Math.max(12, Math.min(150, CAM.distT));
}
export function panBy(dx, dy) {
  const k = (2 * CAM.dist * Math.tan((camera.fov * Math.PI) / 360)) / window.innerHeight, sp = Math.sin(pitchFor(CAM.dist));
  const rx = Math.cos(CAM.yaw), rz = -Math.sin(CAM.yaw), fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw);
  CAM.tx += (-dx * rx + (dy * fx) / sp) * k;
  CAM.tz += (-dx * rz + (dy * fz) / sp) * k;
  clampCam();
}
export function focus(x, z) { CAM.tx = x; CAM.tz = z; clampCam(); }
/** Player 0 sits at +z looking toward -z. */
export function resetCam() { CAM.yaw = 0; CAM.tx = 0; CAM.tz = 66; CAM.distT = CAM.dist = homeDist(); CAM.view = 'high'; clampCam(); }
export function toggleView(target) {
  if (CAM.view === 'high') { CAM.view = 'low'; CAM.distT = 16; if (target) focus(target.x, target.z); }
  else { CAM.view = 'high'; CAM.distT = homeDist(); }
  clampCam();
}
export function onResize() {
  const l = window.innerWidth > window.innerHeight;
  const changed = l !== landscape;
  landscape = l;
  return changed;
}
export function pxPerUnit() { return window.innerHeight / (2 * CAM.dist * Math.tan((camera.fov * Math.PI) / 360)); }

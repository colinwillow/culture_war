// RTS camera: target point + distance + yaw. Pitch flattens as you zoom in ("ghost cam").
import { camera, GLOBE } from '../render/scene.js?v=250';
import { walkH } from '../map/layout.js?v=250';
import { smooth } from '../util/math.js?v=250';

export const CAM = { tx: 0, tz: 64, dist: 60, distT: 60, yaw: 0, view: 'high' };
let landscape = null;
// B247 TELEPHOTO (the references: high, narrow lens, everything readable): fov 28, steeper, distances x1.65
const pitchFor = (d) => 0.78 + (1.08 - 0.78) * smooth(24, 180, d);
// CLOSER BY DEFAULT (Colin: "the best part of this game is up close"): a match starts near the action and the camera
// cannot pull out past ZOOM.max; the whole-map overview is the minimap's job.
export const ZOOM = { home: 74, homeLand: 62, max: 130, dip: 44, idleT: 6 };
export const homeDist = () => (landscape ? ZOOM.homeLand : ZOOM.home);

// AUTO-DIP: no touch for ZOOM.idleT seconds and a fight on screen -> the camera eases down toward it. Any touch ends it.
let lastTouch = 0, clock = 0;
addEventListener('pointerdown', () => { lastTouch = clock; }, { capture: true });
addEventListener('wheel', () => { lastTouch = clock; }, { capture: true, passive: true });
export function applyCam(dt, spot) {
  clock += dt; updateFling(dt);
  // NaN guard (B246, Colin: "at one point the screen went completely white and stayed white"): one bad number in the
  // camera (a zero-length pinch, a NaN spot) poisons it for good and the view is all sky/fog. Snap back home instead.
  if (![CAM.tx, CAM.tz, CAM.dist, CAM.distT, CAM.yaw].every(Number.isFinite)) { CAM.tx = 0; CAM.tz = 58; CAM.dist = CAM.distT = ZOOM.home; CAM.yaw = 0; }
  if (spot && clock - lastTouch > ZOOM.idleT && Math.hypot(spot[0] - CAM.tx, spot[1] - CAM.tz) < CAM.dist * 0.9) {
    const k = 1 - Math.exp(-dt * 0.6); CAM.tx += (spot[0] - CAM.tx) * k; CAM.tz += (spot[1] - CAM.tz) * k; CAM.distT += (ZOOM.dip - CAM.distT) * k;
  }
  GLOBE.u.x = CAM.tx; GLOBE.u.y = CAM.tz; // the globe look bends the world around where you are looking
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
  CAM.distT = Math.max(20, Math.min(ZOOM.max, CAM.distT));
}
export function panBy(dx, dy) {
  const k = (2 * CAM.dist * Math.tan((camera.fov * Math.PI) / 360)) / window.innerHeight, sp = Math.sin(pitchFor(CAM.dist));
  const rx = Math.cos(CAM.yaw), rz = -Math.sin(CAM.yaw), fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw);
  CAM.tx += (-dx * rx + (dy * fx) / sp) * k;
  CAM.tz += (-dx * rz + (dy * fz) / sp) * k;
  clampCam();
}
// Pan momentum: after a flick the map keeps sliding (screen px/s) and eases to a stop.
const FL = { vx: 0, vy: 0 };
export function fling(vx, vy) { const sp = Math.hypot(vx, vy), cap = 4000; FL.vx = sp > cap ? (vx / sp) * cap : vx; FL.vy = sp > cap ? (vy / sp) * cap : vy; if (sp < 60) FL.vx = FL.vy = 0; }
function updateFling(dt) {
  if (!FL.vx && !FL.vy) return;
  panBy(FL.vx * dt, FL.vy * dt);
  const k = Math.exp(-dt * 4.5); FL.vx *= k; FL.vy *= k;
  if (Math.hypot(FL.vx, FL.vy) < 15) FL.vx = FL.vy = 0;
}
export function focus(x, z) { CAM.tx = x; CAM.tz = z; clampCam(); }
/** Player 0 sits at +z looking toward -z. */
export function resetCam() { CAM.yaw = 0; CAM.tx = 0; CAM.tz = 58; CAM.distT = CAM.dist = homeDist(); CAM.view = 'high'; clampCam(); }
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

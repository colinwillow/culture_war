// Under-attack alert: when something of yours is hit somewhere the camera is not looking, a red arrow pulses on
// the screen edge pointing at it. Tap the arrow to fly there. Newest fight wins; it fades 5 s after the last hit.
import { THREE, camera } from '../render/scene.js?v=66';
import { walkH } from '../map/layout.js?v=66';
import { focus } from '../camera/camera.js?v=66';
import { svg } from './icons.js?v=66';

const el = document.getElementById('alert');
el.innerHTML = svg('up');
let spot = null; // { x, z, t }
const v = new THREE.Vector3();

function onScreen(x, z) {
  v.set(x, walkH(x, z) + 1, z).project(camera);
  return v.z < 1 && Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.95;
}
/** Read this tick's events (before fx drains them). */
export function noteAlerts(S) {
  for (const ev of S.events) {
    if ((ev.k !== 'hit' && ev.k !== 'shot') || ev.to !== 0) continue;
    if (onScreen(ev.tx, ev.tz)) continue;
    spot = { x: ev.tx, z: ev.tz, t: 5 };
  }
}
export function updateAlert(dt) {
  if (spot && (spot.t -= dt) <= 0) spot = null;
  if (!spot || onScreen(spot.x, spot.z)) { el.hidden = true; return; }
  el.hidden = false;
  // Direction from screen centre to the spot (flip if behind the camera), clamped to an inset edge box.
  v.set(spot.x, walkH(spot.x, spot.z) + 1, spot.z).project(camera);
  let dx = v.x, dy = v.y; if (v.z > 1) { dx = -dx; dy = -dy; }
  const W = window.innerWidth, H = window.innerHeight, mx = W / 2 - 46, my = H / 2 - 110;
  const k = Math.min(mx / Math.max(1e-3, Math.abs(dx * W / 2)), my / Math.max(1e-3, Math.abs(dy * H / 2)));
  const sx = W / 2 + dx * W / 2 * k, sy = H / 2 - dy * H / 2 * k;
  const ang = Math.atan2(dx * W, dy * H);
  el.style.transform = `translate(${sx - 30}px, ${sy - 30}px)`;
  el.firstElementChild.style.transform = `rotate(${ang}rad)`;
}
el.addEventListener('pointerup', (e) => { e.stopPropagation(); if (spot) { focus(spot.x, spot.z); spot = null; el.hidden = true; } });
el.addEventListener('pointerdown', (e) => e.stopPropagation());
export function clearAlert() { spot = null; el.hidden = true; }

// BATTLE CAM (Colin: "the best part is up close... watching them fight side on, like the arena"): a picture-in-picture
// window, bottom-left, that follows the hottest fight from a low side angle. It only exists while a fight is on (a
// cluster of recent hits); tap it and the main camera swoops down there. Render-only: a second camera, scissored into
// the same canvas after the main render, so no extra canvas or render target.
import { THREE } from './scene.js?v=239';
import { walkH } from '../map/layout.js?v=239';

export const BCAM = { on: true, minHits: 3, window: 3.5, w: 0.4, aspect: 1.25, dist: 9, height: 2.4, fov: 40 };
try { BCAM.on = localStorage.getItem('cw-bcam') !== '0'; } catch (e) {}
const hits = []; // { x, z, t }
let now = 0, live = false, fade = 0;
const cam = new THREE.PerspectiveCamera(BCAM.fov, BCAM.aspect, 0.5, 400);
const focus = new THREE.Vector3(), want = new THREE.Vector3();
let side = 1, el = null;

let lastSpot = null;
export const battleSpot = () => lastSpot; // the hottest fight right now, or null (the camera's auto-dip reads it)
export function noteHit(x, z) { BCAM.seen = (BCAM.seen || 0) + 1; hits.push({ x, z, t: now }); if (hits.length > 80) hits.shift(); }

function hottest() { // the recent hit with the most recent hits within 8 m of it, and their centroid
  while (hits.length && now - hits[0].t > BCAM.window) hits.shift();
  let best = null, bn = 0;
  for (const h of hits) { let n = 0; for (const o of hits) if (Math.abs(o.x - h.x) < 8 && Math.abs(o.z - h.z) < 8) n++; if (n > bn) { bn = n; best = h; } }
  if (!best || bn < BCAM.minHits) return null;
  let cx = 0, cz = 0, n = 0; for (const o of hits) if (Math.abs(o.x - best.x) < 8 && Math.abs(o.z - best.z) < 8) { cx += o.x; cz += o.z; n++; }
  return [cx / n, cz / n];
}
function rect() {
  const W = innerWidth, H = innerHeight, w = Math.round(Math.min(W * BCAM.w, 360)), h = Math.round(w / BCAM.aspect);
  return { x: 10, y: Math.round(H * 0.2), w, h }; // y from the bottom (WebGL viewport space)
}
function frameEl(r, show, onTap) {
  if (!el) {
    el = document.createElement('div'); el.id = 'bcam';
    el.style.cssText = 'position:fixed;z-index:4;border:3px solid #fff;border-radius:12px;box-shadow:0 4px 0 #0008;pointer-events:auto;transition:opacity .3s;';
    el.addEventListener('pointerup', (e) => { e.stopPropagation(); onTap(); });
    document.body.appendChild(el);
  }
  el.style.left = r.x + 'px'; el.style.bottom = r.y + 'px'; el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
  el.style.opacity = show ? 1 : 0; el.style.pointerEvents = show ? 'auto' : 'none';
}
/** Call after the main render. onTap(x, z) moves the main camera there. */
export function renderBattleCam(renderer, scene, mainCam, dt, running, onTap) {
  now += dt;
  const spot = running ? hottest() : null; lastSpot = spot;
  if (!BCAM.on) { if (el) el.style.opacity = 0; return; }
  if (spot) {
    if (!live) { // pick the side of the fight that faces away from the main camera's look, so it reads side-on
      const dx = spot[0] - mainCam.position.x, dz = spot[1] - mainCam.position.z; side = Math.sign(dx || 1);
      focus.set(spot[0], walkH(spot[0], spot[1]) + 1, spot[1]); live = true;
    }
    focus.lerp(want.set(spot[0], walkH(spot[0], spot[1]) + 1, spot[1]), 1 - Math.exp(-dt * 2));
    fade = Math.min(1, fade + dt * 3);
  } else { fade = Math.max(0, fade - dt * 1.5); if (fade === 0) live = false; }
  const r = rect();
  frameEl(r, fade > 0.5, () => onTap(focus.x, focus.z));
  if (fade <= 0) return;
  // low and side-on: offset across the main camera's view direction
  const v = new THREE.Vector3(); mainCam.getWorldDirection(v); v.y = 0; v.normalize();
  const across = new THREE.Vector3(-v.z, 0, v.x).multiplyScalar(side);
  cam.position.copy(focus).addScaledVector(across, BCAM.dist).addScaledVector(v, -BCAM.dist * 0.35); cam.position.y = focus.y + BCAM.height;
  cam.lookAt(focus); cam.aspect = r.w / r.h; cam.updateProjectionMatrix();
  const sh = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; // reuse the main pass's shadows
  renderer.setScissorTest(true); renderer.setScissor(r.x, r.y, r.w, r.h); renderer.setViewport(r.x, r.y, r.w, r.h);
  renderer.render(scene, cam);
  renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.shadowMap.autoUpdate = sh;
}

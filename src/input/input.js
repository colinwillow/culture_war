// Touch / mouse / keyboard on the 3D view.
//   1 finger drag   = pan map (or drag the building ghost while placing)
//   tap             = select / order (move, attack, gather) / aim power / drop ghost
//   hold then drag  = box select
//   2 fingers       = pinch zoom + twist to rotate + drag to pan
//   mouse: right-drag = box select, wheel = zoom; keys WASD/arrows pan, Q/E rotate, V ghost cam, Esc cancel
import { THREE, camera, canvas } from '../render/scene.js?v=224';
import { walkH } from '../map/layout.js?v=224';
import { getSim, command } from '../sim/sim.js?v=224';
import { UI, select, selSquads } from '../ui/state.js?v=224';
import { CAM, panBy, clampCam, toggleView, pxPerUnit, fling } from '../camera/camera.js?v=224';
import { fxMarker } from '../fx/fx.js?v=224';
import { ack } from '../render/sync.js?v=224';

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
export function groundAt(cx, cy) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction;
  if (d.y >= -0.01) return null;
  let t = (o.y - 1) / -d.y;
  const p = new THREE.Vector3();
  for (let i = 0; i < 30; i++) { p.copy(o).addScaledVector(d, t); const diff = p.y - walkH(p.x, p.z); if (Math.abs(diff) < 0.05) break; t += diff / -d.y; }
  return p;
}
function toScreen(x, y, z) { tmp.set(x, y, z).project(camera); return [((tmp.x + 1) / 2) * window.innerWidth, ((1 - tmp.y) / 2) * window.innerHeight]; }
function pickSquad(S, cx, cy, owner) {
  let best = null, bd = 1e9;
  const ppu = pxPerUnit();
  for (const s of S.squads) {
    if (s.owner !== owner) continue;
    const [sx, sy] = toScreen(s.x, walkH(s.x, s.z) + (s.def.flies ? 3.8 : 0.9), s.z);
    const d = Math.hypot(sx - cx, sy - cy), lim = 26 + s.r * ppu;
    if (d < lim && d < bd) { bd = d; best = s; }
  }
  return best;
}
const pickBld = (S, g, owner) => S.blds.find((b) => b.owner === owner && Math.hypot(b.x - g.x, b.z - g.z) < b.r + 0.8) || null;
const pickNode = (S, g) => S.nodes.find((n) => n.amount > 0 && Math.hypot(n.x - g.x, n.z - g.z) < 3.2) || null;

function onTap(cx, cy) {
  const S = getSim();
  if (!S || S.over) return;
  const g = groundAt(cx, cy);
  if (!g) return;
  if (UI.place) { UI.place.x = g.x; UI.place.z = g.z; return; }
  if (UI.armed !== null) { command(0, { type: 'power', idx: UI.armed, x: g.x, z: g.z }); fxMarker(g.x, g.z, 0xf5b83a); UI.armed = null; return; }
  const own = pickSquad(S, cx, cy, 0);
  if (own) {
    const now = performance.now();
    if (now - UI.lastTap.t < 340 && UI.lastTap.id === own.id) select({ type: 'sq', ids: S.squads.filter((s) => s.owner === 0 && s.slot === own.slot).map((s) => s.id) });
    else select({ type: 'sq', ids: [own.id] });
    UI.lastTap = { t: now, id: own.id };
    return;
  }
  // Downtown: tap a drifter to recruit them (builders: a job; wreckers: a spray can). Costs cash; no selection needed.
  const dr = S.drift && S.drift.find((d) => Math.hypot(d.x - g.x, d.z - g.z) < 1.6);
  if (dr) { command(0, { type: 'recruit', id: dr.id }); fxMarker(dr.x, dr.z, 0xf5b83a); return; }
  const sel = selSquads(), ids = sel.map((s) => s.id);
  const enemy = pickSquad(S, cx, cy, 1) || pickSquad(S, cx, cy, 2) || pickBld(S, g, 1);
  if (enemy && sel.length) { command(0, { type: 'attack', ids, target: enemy.id }); fxMarker(enemy.x, enemy.z, 0xff5a4f); ack(ids, true); return; }
  // A city storefront: workers selected = rebuild it (if it is damaged); fighters selected = smash it, floor by floor.
  const cb = S.city && S.city.find((b) => Math.abs(g.x - b.x) < b.sx / 2 + 0.6 && Math.abs(g.z - b.z) < b.sz / 2 + 0.6);
  if (cb && sel.length) {
    const workers = sel.filter((s) => s.slot === 'worker'), fighters = sel.filter((s) => s.slot !== 'worker');
    if (workers.length && (cb.hp < cb.maxHp || cb.tag || (S.down && S.down.role[0] === 'b' && !cb.shop))) { command(0, { type: 'repair', ids: workers.map((s) => s.id), id: cb.id }); fxMarker(cb.x, cb.z, 0xf2c232); ack(ids); }
    if (fighters.length && cb.hp > 0) { command(0, { type: 'attack', ids: fighters.map((s) => s.id), target: cb.id }); fxMarker(cb.x, cb.z, 0xff5a4f); ack(ids, true); }
    if (workers.length || fighters.length) return;
  }
  const node = pickNode(S, g);
  if (node && sel.some((s) => s.slot === 'worker')) { command(0, { type: 'gather', ids, node: node.id }); fxMarker(node.x, node.z, 0xf5b83a); ack(ids); return; }
  const ob = pickBld(S, g, 0);
  // Squads selected + tap your finished tower = send one squad in to man it.
  // Workers selected + tap one of your damaged buildings = go fix it.
  if (ob && ob.built >= 1 && ob.hp < ob.maxHp && sel.some((s) => s.slot === 'worker')) { command(0, { type: 'repair', ids, id: ob.id }); fxMarker(ob.x, ob.z, 0xf2c232); ack(ids); return; }
  if (ob && sel.length && ob.kind === 'tower' && ob.built >= 1 && !ob.garrison && sel.some((s) => !s.def.vehicle && !s.def.flies && s.slot !== 'worker' && s.slot !== 'hero')) { command(0, { type: 'garrison', ids, tower: ob.id }); fxMarker(ob.x, ob.z, 0x7fd1ff); ack(ids); return; }
  if (ob) { select({ type: 'bld', id: ob.id }); return; }
  if (sel.length) { command(0, { type: 'move', ids, x: g.x, z: g.z }); fxMarker(g.x, g.z, 0x9dff78); ack(ids); return; }
  // A production building is selected and the ground was tapped: plant its rally flag there (selection stays).
  const sb = UI.sel && UI.sel.type === 'bld' && S.blds.find((b) => b.id === UI.sel.id);
  if (sb && sb.owner === 0 && (sb.kind === 'barracks' || sb.kind === 'hq')) { command(0, { type: 'rally', id: sb.id, x: g.x, z: g.z }); fxMarker(g.x, g.z, 0x7fd1ff); return; }
  select(null);
}

const boxEl = document.getElementById('box');
function boxSelect(x0, y0, x1, y1) {
  const S = getSim();
  const l = Math.min(x0, x1), r = Math.max(x0, x1), t = Math.min(y0, y1), b = Math.max(y0, y1);
  const ids = S.squads.filter((s) => { if (s.owner !== 0) return false; const [sx, sy] = toScreen(s.x, walkH(s.x, s.z) + 0.9, s.z); return sx >= l && sx <= r && sy >= t && sy <= b; }).map((s) => s.id);
  if (ids.length) select({ type: 'sq', ids });
}

// Hold still on the ground: after the box-select delay a ring starts filling under the finger; let go once it is full
// (without dragging) to grab every army squad you can see.
const ringEl = document.getElementById('holdRing');
const HOLD_ALL = 750;
function showRing(x, y) { Object.assign(ringEl.style, { left: x - 34 + 'px', top: y - 34 + 'px' }); ringEl.hidden = false; ringEl.classList.remove('fill'); void ringEl.offsetWidth; ringEl.classList.add('fill'); }
function selectAllOnScreen() {
  const S = getSim(), W = window.innerWidth, H = window.innerHeight;
  const ids = S.squads.filter((s) => { if (s.owner !== 0 || s.slot === 'worker' || s.gar) return false; const [sx, sy] = toScreen(s.x, walkH(s.x, s.z) + 0.9, s.z); return sx >= 0 && sx <= W && sy >= 0 && sy <= H; }).map((s) => s.id);
  if (ids.length) select({ type: 'sq', ids });
}
const pointers = new Map();
let gesture = null, pressTimer = null;
function pinchInfo() { const [a, b] = [...pointers.values()]; return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x) }; }

export function initInput() {
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    clearTimeout(pressTimer);
    fling(0, 0); // a new touch catches the sliding map
    if (pointers.size === 1) {
      const rightMouse = e.pointerType === 'mouse' && e.button !== 0;
      gesture = { type: rightMouse ? 'box' : 'press', x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, t0: performance.now() };
      if (!rightMouse && !UI.place) pressTimer = setTimeout(() => { if (gesture && gesture.type === 'press') { gesture.type = 'box'; gesture.ring = true; boxEl.style.display = 'block'; showRing(gesture.x0, gesture.y0); } }, 380);
    } else if (pointers.size === 2) { gesture = { type: 'pinch', ...pinchInfo() }; boxEl.style.display = 'none'; ringEl.hidden = true; }
    else gesture = { type: 'none' };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (UI.armed !== null) { const g = groundAt(e.clientX, e.clientY); if (g) UI.aim = { x: g.x, z: g.z }; } // power preview ring follows the finger
    const pt = pointers.get(e.pointerId);
    if (!pt || !gesture) return;
    pt.x = e.clientX; pt.y = e.clientY;
    if (gesture.type === 'press' && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 10) { clearTimeout(pressTimer); gesture.type = UI.place ? 'ghost' : 'pan'; }
    if (gesture.type === 'box' && gesture.ring && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 10) { gesture.ring = false; ringEl.hidden = true; }
    if (gesture.type === 'box') {
      const l = Math.min(gesture.x0, e.clientX), t = Math.min(gesture.y0, e.clientY);
      Object.assign(boxEl.style, { display: 'block', left: l + 'px', top: t + 'px', width: Math.abs(e.clientX - gesture.x0) + 'px', height: Math.abs(e.clientY - gesture.y0) + 'px' });
    } else if (gesture.type === 'pan') {
      const dx = e.clientX - gesture.lx, dy = e.clientY - gesture.ly, now = performance.now(), dtm = Math.max(1, now - (gesture.lt || now - 16));
      panBy(dx, dy); gesture.lx = e.clientX; gesture.ly = e.clientY; gesture.lt = now;
      // finger velocity (px/s), smoothed, so a flick can carry on after the finger lifts
      gesture.vx = (gesture.vx || 0) * 0.6 + (dx / dtm) * 1000 * 0.4; gesture.vy = (gesture.vy || 0) * 0.6 + (dy / dtm) * 1000 * 0.4;
    }
    else if (gesture.type === 'ghost') { const g = groundAt(e.clientX, e.clientY); if (g) { UI.place.x = g.x; UI.place.z = g.z; } }
    else if (gesture.type === 'pinch' && pointers.size === 2) {
      const n = pinchInfo();
      panBy(n.cx - gesture.cx, n.cy - gesture.cy);
      if (gesture.d > 0 && n.d > 0) { CAM.distT *= gesture.d / n.d; clampCam(); CAM.dist = CAM.distT; }
      let da = n.ang - gesture.ang; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      CAM.yaw += da; // turn the way the fingers turn (B126: was inverted)
      Object.assign(gesture, n);
    }
  });
  const end = (e, cancel) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    clearTimeout(pressTimer);
    if (gesture && !cancel) {
      if (gesture.type === 'press' && pointers.size === 0) onTap(e.clientX, e.clientY);
      else if (gesture.type === 'pan' && pointers.size === 0 && performance.now() - (gesture.lt || 0) < 80) fling(gesture.vx || 0, gesture.vy || 0); // throw the map
      else if (gesture.type === 'box') {
        boxEl.style.display = 'none';
        if (Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 6) boxSelect(gesture.x0, gesture.y0, e.clientX, e.clientY);
        else if (gesture.ring && performance.now() - gesture.t0 >= HOLD_ALL) selectAllOnScreen();
      }
    }
    if (pointers.size === 0) { gesture = null; boxEl.style.display = 'none'; ringEl.hidden = true; }
    else if (gesture && gesture.type === 'pinch') gesture = { type: 'none' };
  };
  canvas.addEventListener('pointerup', (e) => end(e, false));
  canvas.addEventListener('pointercancel', (e) => end(e, true));
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); CAM.distT *= Math.exp(e.deltaY * 0.0015); clampCam(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase(), s = 48;
    if (k === 'w' || k === 'arrowup') panBy(0, s);
    if (k === 's' || k === 'arrowdown') panBy(0, -s);
    if (k === 'a' || k === 'arrowleft') panBy(s, 0);
    if (k === 'd' || k === 'arrowright') panBy(-s, 0);
    if (k === 'q') CAM.yaw += 0.1;
    if (k === 'e') CAM.yaw -= 0.1;
    if (k === 'v') toggleView(selSquads()[0]);
    if (k === 'escape') { UI.armed = null; UI.place = null; select(null); }
  });
}

/** Stop the browser zooming the page (double-tap, pinch, iOS gestures). Project rule. */
export function lockPageZoom() {
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, (e) => e.preventDefault(), { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  let last = 0;
  document.addEventListener('touchend', (e) => { const n = Date.now(); if (n - last <= 320) e.preventDefault(); last = n; }, { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

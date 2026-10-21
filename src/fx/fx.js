// Visual effects. Reads sim events, never changes the sim.
// To add an effect for a new mechanic: emit S.events.push({k:'myThing', ...}) in the sim,
// then add a case in handleEvents below.
import { THREE, scene, mat, cyl, basic, disposeObj } from '../render/scene.js?v=3';
import { walkH } from '../map/layout.js?v=3';
import { FC } from '../render/models.js?v=3';
import { updateParticles, clearParticles, burstHit, burstShot, burstCoins } from './particles.js?v=3';

const fx = [];
function addFx(obj, life, upd) { scene.add(obj); fx.push({ obj, life, t: 0, upd }); }
export function updateFx(dt) {
  updateParticles(dt);
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.t += dt;
    const k = Math.min(1, f.t / f.life);
    f.upd(f.obj, k, dt);
    if (f.t >= f.life) { disposeObj(f.obj); fx.splice(i, 1); }
  }
}
export function clearFx() { for (const f of fx) disposeObj(f.obj); fx.length = 0; clearParticles(); }

const gy = (x, z, o = 0) => walkH(x, z) + o;
export function fxLine(x, z, tx, tz, y0, c) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, gy(x, z, y0), z), new THREE.Vector3(tx, gy(tx, tz, 0.9), tz)]);
  addFx(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true })), 0.18, (o, k) => (o.material.opacity = 1 - k));
}
export function fxRing(x, z, r0, r1, c, life, y = 0.12) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 40), basic(c, 1));
  m.rotation.x = -Math.PI / 2; m.position.set(x, gy(x, z, y), z);
  addFx(m, life, (o, k) => { const r = r0 + (r1 - r0) * k; o.scale.set(r, r, r); o.material.opacity = 1 - k; });
}
function fxPuff(x, y, z, c, s = 0.5) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), basic(c, 1));
  m.position.set(x, gy(x, z, y), z);
  addFx(m, 0.25, (o, k) => { const q = 1 + k * 1.5; o.scale.set(q, q, q); o.material.opacity = 1 - k; o.rotation.y = k * 3; });
}
export function fxBits(x, z, c, n = 4, y = 0.6, spd = 4) {
  const g0 = gy(x, z);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), basic(c, 1));
    m.position.set(x, g0 + y, z);
    const v = new THREE.Vector3((Math.random() - 0.5) * spd, 3 + Math.random() * 3, (Math.random() - 0.5) * spd);
    addFx(m, 0.7, (o, k, dt) => { v.y -= 14 * dt; o.position.addScaledVector(v, dt); if (o.position.y < g0 + 0.1) { o.position.y = g0 + 0.1; v.set(0, 0, 0); } o.rotation.x += dt * 8; o.material.opacity = 1 - k * k; });
  }
}
function fxCoin(x, y, z) {
  const g0 = gy(x, z, y);
  const m = cyl(0.4, 0.4, 0.1, 0xf5b83a, x, g0, z, 14);
  m.material = basic(0xf5b83a, 1); m.rotation.x = Math.PI / 2;
  addFx(m, 1, (o, k, dt) => { o.position.y = g0 + k * 2.5; o.rotation.z += dt * 8; o.material.opacity = 1 - k * k; });
}
function fxArc(x, z, tx, tz, c, onEnd) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), basic(c, 1));
  const H = 5 + Math.hypot(tx - x, tz - z) * 0.25, y0 = gy(x, z, 1), y1 = gy(tx, tz, 0.5);
  addFx(m, 0.6, (o, k) => { o.position.set(x + (tx - x) * k, y0 + (y1 - y0) * k + H * 4 * k * (1 - k), z + (tz - z) * k); if (k >= 1 && onEnd) { onEnd(); onEnd = null; } });
}
function fxSpark(x, y, z, c, v, life = 0.9) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), basic(c, 1));
  m.position.set(x, gy(x, z, y), z);
  addFx(m, life, (o, k, dt) => { v.y -= 6 * dt; o.position.addScaledVector(v, dt); o.material.opacity = 1 - k; });
}
const CONF = [0xff5a4f, 0xf5b83a, 0x7ee05b, 0x6fc3ff, 0xe85d9a, 0xffffff];
export function fxConfetti(x, z, n = 10) {
  const g0 = gy(x, z);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.15), basic(CONF[i % CONF.length], 1));
    m.position.set(x + (Math.random() - 0.5) * 3, g0 + 4 + Math.random() * 2, z + (Math.random() - 0.5) * 3);
    const sp = Math.random() * 10;
    addFx(m, 1.4, (o, k, dt) => { o.position.y -= dt * 3; o.rotation.x += dt * sp; o.rotation.y += dt * 6; o.material.opacity = 1 - k * k; });
  }
}
function fxPie(x, z) {
  const g0 = gy(x, z);
  const m = cyl(0.9, 0.7, 0.4, 0xe7c48a, x, g0 + 16, z, 14);
  addFx(m, 0.45, (o, k) => { o.position.y = g0 + 16 - 14 * k * k; o.rotation.x = k * 6; if (k >= 1) { fxBits(x, z, 0xfff8ec, 8, 2, 5); fxRing(x, z, 0.5, 3, 0xfff8ec, 0.4, 2); } });
}
function fxFireworks(x, z, r) {
  fxRing(x, z, 1, r, 0xf5b83a, 0.6);
  for (let i = 0; i < 34; i++) { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 7; fxSpark(x, 3, z, CONF[i % CONF.length], new THREE.Vector3(Math.cos(a) * s, 4 + Math.random() * 5, Math.sin(a) * s), 1.1); }
}
/** Order marker: ring closes in, four chevrons slide onto the spot, an arrow bounces down onto it. */
export function fxMarker(x, z, c) {
  fxRing(x, z, 2.2, 0.4, c, 0.45, 0.14);
  const g0 = gy(x, z, 0.15), m = basic(c, 1);
  const root = new THREE.Group(); root.position.set(x, g0, z);
  for (let i = 0; i < 4; i++) {
    const ch = new THREE.Group(); ch.rotation.y = (i * Math.PI) / 2;
    const arm = new THREE.Group(); ch.add(arm); // chevron lies flat, its point aimed at the centre
    for (const sgn of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.55), m); b.position.set(sgn * 0.18, 0, 0.2); b.rotation.y = sgn * 0.75; arm.add(b); }
    root.add(ch);
  }
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), m); cone.rotation.x = Math.PI; root.add(cone);
  addFx(root, 0.75, (o, k) => {
    for (let i = 0; i < 4; i++) o.children[i].children[0].position.z = 1.8 * (1 - k) + 0.2;
    const b = Math.abs(Math.cos(k * Math.PI * 2.5)) * (1 - k);
    cone.position.y = 0.6 + b * 1.6;
    m.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
  });
}
export function fxDeath(x, z, f) { fxBits(x, z, FC[f].main, 3); }

/** Drain this tick's sim events into effects. bump(id) makes a squad lunge. */
export function handleEvents(S, bump) {
  for (const ev of S.events) {
    switch (ev.k) {
      case 'shot':
        if (ev.slot === 'siege' && ev.f === 'bw') fxArc(ev.x, ev.z, ev.tx, ev.tz, 0xd63c3c, () => { fxRing(ev.tx, ev.tz, 0.5, 3.5, 0xf5b83a, 0.4); fxBits(ev.tx, ev.tz, 0xf5b83a, 5); });
        else if (ev.f === 'ac' && ev.slot === 'ranged') { fxLine(ev.x, ev.z, ev.tx, ev.tz, 1, 0xe85d9a); fxRing(ev.tx, ev.tz, 0.3, 1.6, 0xe85d9a, 0.3, 1); }
        else { const y0 = ev.y0 || 1.25; burstShot(ev.x, gy(ev.x, ev.z, y0), ev.z, ev.tx, gy(ev.tx, ev.tz, 0.95), ev.tz, ev.slot === 'hq' ? 0xffffff : 0xfff2a8); }
        bump(ev.id); break;
      case 'hit':
        if (ev.area) { fxRing(ev.tx, ev.tz, 0.6, 3, 0xc9a875, 0.35); fxBits(ev.tx, ev.tz, 0x8a7a55, 4); }
        else { const hx = ev.tx + (Math.random() - 0.5) * 0.8, hz = ev.tz + (Math.random() - 0.5) * 0.8; burstHit(hx, gy(hx, hz, 1), hz, gy(hx, hz)); }
        bump(ev.id); break;
      case 'boom': fxRing(ev.x, ev.z, 1, ev.r * 3, 0xff8a3c, 0.7); fxBits(ev.x, ev.z, 0x6b5a45, 16, 1.5, 9); break;
      case 'done': fxRing(ev.x, ev.z, 0.5, 4, 0xffffff, 0.5, 0.2); break;
      case 'scrap': fxBits(ev.x, ev.z, 0x9a9a9a, 6, 1, 5); fxCoin(ev.x, 2, ev.z); break;
      case 'income': if (ev.owner === 0) for (const b of S.blds) if (b.owner === 0 && b.kind === 'depot' && b.built >= 1) fxCoin(b.x, 3.2, b.z); break;
      case 'deposit': burstCoins(ev.x, gy(ev.x, ev.z, 2.5), ev.z, gy(ev.x, ev.z)); if (ev.owner === 0) fxCoin(ev.x, 3.5, ev.z); break;
      case 'gather': fxBits(ev.x, ev.z, 0xf5b83a, 3, 1.5, 3); break;
      case 'levelup': fxRing(ev.x, ev.z, 1, 5, 0xf5b83a, 0.7, 0.2); break;
      case 'rank': fxRing(ev.x, ev.z, 0.5, 2.5, 0xf5b83a, 0.5, 0.3); break;
      case 'screech': fxRing(ev.x, ev.z, 1, 6, 0xffffff, 0.5, 3.8); fxRing(ev.x, ev.z, 0.5, 5, 0xffffff, 0.6, 0.2); break;
      case 'bullhorn': fxRing(ev.x, ev.z, 0.5, 8, 0xe85d9a, 0.6, 0.2); fxRing(ev.x, ev.z, 0.3, 5, 0xf5b83a, 0.5, 1.6); break;
      case 'pie': fxPie(ev.x, ev.z); break;
      case 'parade': for (const s of S.squads) if (s.owner === ev.owner) fxConfetti(s.x, s.z, 14); break;
      case 'mud': fxRing(ev.x, ev.z, 1, 8, 0x5b4026, 0.5, 0.15); fxBits(ev.x, ev.z, 0x5b4026, 10, 0.3, 8); break;
      case 'fwlaunch': { const p = S.players[ev.owner]; for (let i = 0; i < 6; i++) fxSpark(p.hqx + (Math.random() - 0.5) * 3, 4, p.hqz, CONF[i], new THREE.Vector3(0, 14, 0), 0.8); break; }
      case 'fwboom': fxFireworks(ev.x, ev.z, ev.r); break;
      case 'spawn': fxRing(ev.x, ev.z, 0.5, 2.2, 0xf3efe2, 0.35); break;
    }
  }
  S.events.length = 0;
}

// Visual effects. Reads sim events, never changes the sim.
// To add an effect for a new mechanic: emit S.events.push({k:'myThing', ...}) in the sim,
// then add a case in handleEvents below.
import { THREE, scene, mat, cyl, basic, disposeObj } from '../render/scene.js?v=31';
import { walkH } from '../map/layout.js?v=31';
import { FC } from '../render/models.js?v=31';
import { emit, updateParticles, clearParticles, burstHit, burstShot, burstCoins } from './particles.js?v=31';

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
  addFx(m, 0.45, (o, k) => { o.position.y = g0 + 16 - 14 * k * k; o.rotation.x = k * 6; if (k >= 1) { fxBits(x, z, 0xfff8ec, 8, 2, 5); fxRing(x, z, 0.5, 3, 0xfff8ec, 0.4, 2); pieSplat(x, z); } });
}
/** A rocket streaks from the launcher to the target on a high arc, shedding sparks. */
function fxRocket(x, z, tx, tz, c, life) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 6), basic(c, 1));
  const y0 = gy(x, z, 4), y1 = gy(tx, tz, 0.5), H = 18 + Math.random() * 6;
  const prev = new THREE.Vector3(x, y0, z);
  addFx(m, life, (o, k) => {
    o.position.set(x + (tx - x) * k, y0 + (y1 - y0) * k + H * 4 * k * (1 - k), z + (tz - z) * k);
    const d = o.position.clone().sub(prev); if (d.lengthSq() > 1e-6) o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    prev.copy(o.position);
    emit({ x: o.position.x, y: o.position.y, z: o.position.z, vx: (Math.random() - 0.5), vy: -0.5, vz: (Math.random() - 0.5), c: Math.random() < 0.5 ? 0xffe9a8 : c, s: 0.18, life: 0.5, g: 3 });
  });
}
/** Aerial shell: a ball of coloured stars that blooms, droops and fades. */
function shell(x, y, z, c) {
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1), sp = 7 + Math.random() * 2;
    emit({ x, y, z, vx: Math.sin(b) * Math.cos(a) * sp, vy: Math.cos(b) * sp, vz: Math.sin(b) * Math.sin(a) * sp, c: i % 5 ? c : 0xffffff, s: 0.28, life: 1.3, g: 3, drag: 1.8 });
  }
}
function confettiCannon(x, z) {
  const g0 = gy(x, z);
  for (let i = 0; i < 26; i++) emit({ x: x + (Math.random() - 0.5), y: g0 + 1.5, z: z + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 5, vy: 9 + Math.random() * 5, vz: (Math.random() - 0.5) * 5, c: CONF[i % CONF.length], s: 0.22, life: 2.4, g: 6, drag: 1.4, floor: g0 + 0.05 });
}
/** Whipped-cream splat that stays on the ground a few seconds. */
function pieSplat(x, z) {
  const g = new THREE.Group(), m = basic(0xfff8ec, 0.95);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 18), m); disc.rotation.x = -Math.PI / 2; g.add(disc);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28 + Math.random() * 0.4, d = new THREE.Mesh(new THREE.CircleGeometry(0.35 + Math.random() * 0.3, 10), m); d.rotation.x = -Math.PI / 2; d.position.set(Math.cos(a) * 2, 0.005, Math.sin(a) * 2); g.add(d); }
  g.position.set(x, gy(x, z, 0.13), z);
  addFx(g, 6, (o, k) => { const q = k < 0.05 ? k / 0.05 : 1; o.scale.set(q, 1, q); m.opacity = k > 0.75 ? (1 - k) / 0.25 * 0.95 : 0.95; });
  for (let i = 0; i < 16; i++) emit({ x, y: gy(x, z, 2), z, vx: (Math.random() - 0.5) * 8, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 8, c: i % 3 ? 0xfff8ec : 0xe7c48a, s: 0.3, life: 0.8, g: 14, floor: gy(x, z, 0.1) });
}
function fxFireworks(x, z, r) {
  for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28, d = Math.random() * r * 0.6; shell(x + Math.cos(a) * d, gy(x, z, 7 + Math.random() * 5), z + Math.sin(a) * d, CONF[(i * 2) % CONF.length]); }
  fxRing(x, z, 1, r, 0xf5b83a, 0.6);
  for (let i = 0; i < 34; i++) { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 7; fxSpark(x, 3, z, CONF[i % CONF.length], new THREE.Vector3(Math.cos(a) * s, 4 + Math.random() * 5, Math.sin(a) * s), 1.1); }
}
/** Order marker: ring closes in, four chevrons slide onto the spot, an arrow bounces down onto it. */
/** Rubble left where a building fell: a heap of tumbled blocks that settles, lingers, then sinks away. */
function fxRubble(x, z, r) {
  const g = new THREE.Group(), g0 = gy(x, z), cols = [0x8a8378, 0x6b655c, 0xa39b8c, 0x5a3a22];
  for (let i = 0; i < 9 + r * 4; i++) {
    const s = 0.4 + Math.random() * r * 0.45, a = Math.random() * 6.28, d = Math.random() * r * 0.9;
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * (0.4 + Math.random() * 0.6), s * (0.6 + Math.random() * 0.6)), mat(cols[i % 4]));
    m.position.set(Math.cos(a) * d, s * 0.25 + (r - d) * 0.25, Math.sin(a) * d); m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    g.add(m);
  }
  g.position.set(x, g0 - 0.6, z);
  addFx(g, 24, (o, k) => { o.position.y = g0 - (k < 0.06 ? 0.6 * (1 - k / 0.06) : k > 0.85 ? (k - 0.85) / 0.15 * 1.5 : 0); });
}
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
        if (ev.slot === 'hero' && ev.f === 'ac') { // bullhorn blast: rings roll from him to the target
          const dx = ev.tx - ev.x, dz = ev.tz - ev.z;
          for (let k = 0; k < 3; k++) setTimeout(() => fxRing(ev.x + dx * (0.3 + k * 0.3), ev.z + dz * (0.3 + k * 0.3), 0.3, 1.4 + k * 0.4, 0xe85d9a, 0.3, 1.4), k * 90);
        }
        if (ev.area) { fxRing(ev.tx, ev.tz, 0.6, 3, 0xc9a875, 0.35); fxBits(ev.tx, ev.tz, 0x8a7a55, 4); }
        else { const hx = ev.tx + (Math.random() - 0.5) * 0.8, hz = ev.tz + (Math.random() - 0.5) * 0.8; burstHit(hx, gy(hx, hz, 1), hz, gy(hx, hz)); }
        bump(ev.id); break;
      case 'boom': fxRing(ev.x, ev.z, 1, ev.r * 3, 0xff8a3c, 0.7); fxBits(ev.x, ev.z, 0x6b5a45, 16, 1.5, 9); fxRubble(ev.x, ev.z, ev.r); break;
      case 'done': fxRing(ev.x, ev.z, 0.5, 4, 0xffffff, 0.5, 0.2); break;
      case 'scrap': fxBits(ev.x, ev.z, 0x9a9a9a, 6, 1, 5); fxCoin(ev.x, 2, ev.z); break;
      case 'income': if (ev.owner === 0) for (const b of S.blds) if (b.owner === 0 && b.kind === 'depot' && b.built >= 1) fxCoin(b.x, 3.2, b.z); break;
      case 'refund': if (ev.owner === 0) { burstCoins(ev.x, gy(ev.x, ev.z, 3), ev.z, gy(ev.x, ev.z)); fxCoin(ev.x, 3.5, ev.z); } break;
      case 'heal': for (let k = 0; k < 4; k++) emit({ x: ev.x + (Math.random() - 0.5) * 2, y: gy(ev.x, ev.z, 0.5), z: ev.z + (Math.random() - 0.5) * 2, vy: 1.5 + Math.random(), c: k % 2 ? 0x7ee05b : 0xd6ffcf, s: 0.22, life: 0.9, g: -0.5 }); break;
      case 'enter': fxRing(ev.x, ev.z, 0.5, 3, 0x7fd1ff, 0.4, 4.6); break;
      case 'eject': fxRing(ev.x, ev.z, 0.4, 2.5, 0x7fd1ff, 0.4); break;
      case 'deposit': burstCoins(ev.x, gy(ev.x, ev.z, 2.5), ev.z, gy(ev.x, ev.z)); if (ev.owner === 0) fxCoin(ev.x, 3.5, ev.z); break;
      case 'gather': fxBits(ev.x, ev.z, 0xf5b83a, 3, 1.5, 3); break;
      case 'levelup': fxRing(ev.x, ev.z, 1, 5, 0xf5b83a, 0.7, 0.2); break;
      case 'rank': {
        fxRing(ev.x, ev.z, 0.5, ev.hero ? 5 : 2.5, 0xf5b83a, 0.5, 0.3);
        // Rank-up: a spiral of gold sparks climbs round the squad (taller and longer for a hero level).
        const n = ev.hero ? 28 : 16, g0 = gy(ev.x, ev.z);
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 4, r = ev.hero ? 1.6 : 1.1; emit({ x: ev.x + Math.cos(a) * r, y: g0 + 0.3 + i * 0.08, z: ev.z + Math.sin(a) * r, vx: -Math.sin(a) * 2, vy: 3 + (ev.hero ? 2 : 0), vz: Math.cos(a) * 2, c: i % 3 ? 0xf5b83a : 0xffffff, s: 0.2, life: 1.1, g: 2, drag: 1 }); }
        break;
      }
      case 'screech': fxRing(ev.x, ev.z, 1, 6, 0xffffff, 0.5, 3.8); fxRing(ev.x, ev.z, 0.5, 5, 0xffffff, 0.6, 0.2); break;
      case 'bullhorn': fxRing(ev.x, ev.z, 0.5, 8, 0xe85d9a, 0.6, 0.2); fxRing(ev.x, ev.z, 0.3, 5, 0xf5b83a, 0.5, 1.6); break;
      case 'pie': fxPie(ev.x, ev.z); break;
      case 'parade': for (const s of S.squads) if (s.owner === ev.owner) { fxConfetti(s.x, s.z, 14); confettiCannon(s.x, s.z); } break;
      case 'mud': fxRing(ev.x, ev.z, 1, 8, 0x5b4026, 0.5, 0.15); fxBits(ev.x, ev.z, 0x5b4026, 10, 0.3, 8); break;
      case 'fwlaunch': { const p = S.players[ev.owner]; for (let i = 0; i < 6; i++) fxRocket(p.hqx + (Math.random() - 0.5) * 3, p.hqz, ev.x + (Math.random() - 0.5) * 8, ev.z + (Math.random() - 0.5) * 8, CONF[i], 1.5 + i * 0.05); break; }
      case 'fwboom': fxFireworks(ev.x, ev.z, ev.r); break;
      case 'spawn': fxRing(ev.x, ev.z, 0.5, 2.2, 0xf3efe2, 0.35); break;
    }
  }
  S.events.length = 0;
}

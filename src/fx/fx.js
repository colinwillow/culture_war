// Visual effects. Reads sim events, never changes the sim.
// To add an effect for a new mechanic: emit S.events.push({k:'myThing', ...}) in the sim,
// then add a case in handleEvents below.
import { THREE, scene, mat, cyl, basic, disposeObj } from '../render/scene.js?v=112';
import { walkH } from '../map/layout.js?v=112';
import { sfx } from './sfx.js?v=112';
import { shake, CAM } from '../camera/camera.js?v=112';
import { FC } from '../render/models.js?v=112';
import { emit, updateParticles, clearParticles, burstHit, burstShot, burstCoins } from './particles.js?v=112';

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
/** Junkyard: a dead Backwoods vehicle leaves a charred, tilted husk with its wheels off, smoking for ~20 s, then sinks. */
function fxWreck(x, z, big, h) {
  const g = new THREE.Group(), g0 = gy(x, z), s = big ? 1 : 0.65;
  const body = new THREE.Group(); body.rotation.set(0.12, 0, big ? 0.35 : -0.25); g.add(body);
  body.add(new THREE.Mesh(new THREE.BoxGeometry(1.8 * s, 0.7 * s, 2.6 * s), mat(0x2b2724)));
  if (big) { const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.1), mat(0x1c1a18)); cab.position.set(0, 0.55, -0.3); cab.rotation.z = 0.2; body.add(cab); }
  body.position.y = 0.45 * s;
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.75 * s, 0.75 * s, 0.5 * s, 12), mat(0x161616));
    const a = i * 1.57 + Math.random() * 0.6, d = (1.6 + Math.random()) * s;
    w.position.set(Math.cos(a) * d, 0.25 * s, Math.sin(a) * d); w.rotation.set(Math.random() < 0.6 ? 0 : 1.57, Math.random() * 3, Math.random() < 0.6 ? 1.57 : 0);
    g.add(w);
  }
  g.position.set(x, g0, z); g.rotation.y = h;
  let puff = 0;
  addFx(g, 22, (o, k, dt) => {
    if (k > 0.9) o.position.y = g0 - ((k - 0.9) / 0.1) * 1.5;
    if ((puff -= dt) <= 0 && k < 0.85) {
      puff = 0.25 + k * 0.6;
      emit({ x: x + (Math.random() - 0.5) * s, y: g0 + 0.9 * s, z: z + (Math.random() - 0.5) * s, vx: (Math.random() - 0.5) * 0.4 + 0.3, vy: 1.1 + Math.random() * 0.5, vz: (Math.random() - 0.5) * 0.4, c: Math.random() < 0.6 ? 0x3a3a3a : 0x555555, s: 0.5 * s + 0.2, life: 2, g: -0.3, drag: 0.8, grow: 3 });
      if (k < 0.3 && Math.random() < 0.5) emit({ x, y: g0 + 0.8 * s, z, vx: (Math.random() - 0.5), vy: 1.5 + Math.random(), vz: (Math.random() - 0.5), c: Math.random() < 0.5 ? 0xff7a1c : 0xffc23a, s: 0.3, life: 0.5, g: -1 });
    }
  });
}
/** Banner Tower: lobs a paint balloon that bursts into a bright splat (decal fades after a few seconds). */
const PAINT = [0xe85d9a, 0x2cc2ad, 0xf5b83a, 0x6fc3ff];
function paintBalloon(x, z, tx, tz) {
  const c = PAINT[(Math.random() * PAINT.length) | 0];
  fxArc(x, z, tx, tz, c, () => {
    const g0 = gy(tx, tz, 0.12), m = basic(c, 0.85), g = new THREE.Group();
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.9, 14), m); d.rotation.x = -Math.PI / 2; g.add(d);
    for (let i = 0; i < 5; i++) { const a = Math.random() * 6.28, b = new THREE.Mesh(new THREE.CircleGeometry(0.2 + Math.random() * 0.2, 8), m); b.rotation.x = -Math.PI / 2; b.position.set(Math.cos(a) * 1.3, 0.005, Math.sin(a) * 1.3); g.add(b); }
    g.position.set(tx, g0, tz); g.rotation.y = Math.random() * 6;
    addFx(g, 4, (o, k) => { m.opacity = k > 0.6 ? (1 - k) / 0.4 * 0.85 : 0.85; });
    for (let i = 0; i < 10; i++) emit({ x: tx, y: g0 + 0.6, z: tz, vx: (Math.random() - 0.5) * 6, vy: 2 + Math.random() * 3, vz: (Math.random() - 0.5) * 6, c, s: 0.2, life: 0.6, g: 14, floor: g0 });
  });
}
/** Megaphone blast: three bright arcs ("((( ") travel from the crew to the target, widening as they go. */
function soundWaves(x, z, tx, tz) {
  const yaw = Math.atan2(tx - x, tz - z), y0 = gy(x, z, 1.3), y1 = gy(tx, tz, 1);
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 16, 1, Math.PI * 0.25, Math.PI * 0.5), basic(k === 1 ? 0xffffff : 0xe85d9a, 0.9));
    const holder = new THREE.Group(); holder.add(m); holder.rotation.y = yaw;
    m.rotation.set(0, Math.PI / 2, 0); // upright arc, its plane edge-on to the direction of travel
    addFx(holder, 0.42, (o, kk) => {
      const t = Math.max(0, Math.min(1, kk * 1.3 - k * 0.15));
      o.position.set(x + (tx - x) * t, y0 + (y1 - y0) * t, z + (tz - z) * t);
      const sc = 0.8 + t * 1.6; o.scale.set(sc, sc, sc);
      m.material.opacity = t <= 0 ? 0 : 0.9 * (1 - t * t);
    });
  }
}
/** Wrecking Ball: a huge iron ball on a chain swings in from the sky in a pendulum arc and lands on the target
 *  (timed to the sim's 1.4 s), then swings back up and away. */
function wreckingBall(x, z) {
  const g0 = gy(x, z), top = g0 + 34, len = 32, start = -1.1;
  const pivot = new THREE.Group(); pivot.position.set(x, top, z);
  const arm = new THREE.Group(); pivot.add(arm);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), mat(0x2b2b2b)); ball.position.y = -len; arm.add(ball);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, len, 5), mat(0x777777)); chain.position.y = -len / 2; arm.add(chain);
  arm.rotation.x = start;
  addFx(pivot, 2.4, (o, k) => {
    const t = k * 2.4;
    if (t < 1.4) { const u = t / 1.4; arm.rotation.x = start * (1 - u * u); } // accelerates down into the bottom of the swing
    else { const u = (t - 1.4) / 1.0; arm.rotation.x = Math.sin(u * Math.PI * 0.5) * 0.9; o.position.y = top + u * 20; }
  });
}
/** Graffiti Tagger: a spray of paint arcs onto the target and, on a building, a tag splat stays on the wall
 * facing him (up to 40 tags in the world; each lasts 40 s or until the building falls). */
const TAGS = [], TAGC = [0x7a3fd1, 0x7ee05b, 0xff5ad1, 0x5ae0ff, 0xf5b83a];
function sprayTag(S, ev) {
  for (let k = 0; k < 8; k++) { const u = Math.random(); emit({ x: ev.x + (ev.tx - ev.x) * u, y: gy(ev.x, ev.z, 1.4 + Math.sin(u * Math.PI)), z: ev.z + (ev.tz - ev.z) * u, vx: (Math.random() - 0.5), vy: Math.random(), vz: (Math.random() - 0.5), c: TAGC[k % 5], s: 0.18, life: 0.5, g: 2 }); }
  const b = ev.tb !== undefined && S.blds.find((o) => o.id === ev.tb);
  if (!b) return;
  // Snap to the wall facing him: buildings are axis-aligned boxes about this half-width (a guess per kind, all factions).
  const a = Math.atan2(ev.x - b.x, ev.z - b.z) + (Math.random() - 0.5) * 0.5, sa = Math.sin(a), ca = Math.cos(a);
  const hw = ({ hq: 2.5, depot: 1.3, barracks: 1.9, tower: 0.85 })[b.kind] + 0.08, side = Math.abs(sa) > Math.abs(ca);
  const r = hw / Math.max(Math.abs(sa), Math.abs(ca));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8 + Math.random() * 0.9, 0.5 + Math.random() * 0.6), basic(TAGC[(Math.random() * 5) | 0]));
  m.position.set(b.x + Math.sin(a) * r, gy(b.x, b.z, 0.7 + Math.random() * 1.6), b.z + Math.cos(a) * r); m.rotation.y = side ? Math.sign(sa) * Math.PI / 2 : ca > 0 ? 0 : Math.PI; m.rotation.z = (Math.random() - 0.5) * 0.6;
  const bid = b.id;
  addFx(m, 40, (o, k) => { if (!S.blds.some((x) => x.id === bid)) o.visible = false; });
  TAGS.push(m); if (TAGS.length > 40) { const old = TAGS.shift(); old.visible = false; }
}
/** A hero walks out: a spotlight beam drops onto the HQ door for 2.5 s, plus one on-trope flourish per faction. */
function heroEntrance(ev) {
  const g0 = gy(ev.x, ev.z), beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.2, 22, 20, 1, true), basic(0xfff3c4, 0));
  beam.position.set(ev.x, g0 + 11, ev.z);
  addFx(beam, 2.5, (o, k) => { o.material.opacity = Math.min(1, k * 8) * (1 - k) * 0.35; });
  fxRing(ev.x, ev.z, 0.5, 4, 0xfff3c4, 0.8, 0.15); shake(0.4, ev.x, ev.z);
  const up = (c, n, vy, s = 0.18) => { for (let i = 0; i < n; i++) emit({ x: ev.x + (Math.random() - 0.5) * 2, y: g0 + 0.5, z: ev.z + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 3, vy: vy + Math.random() * 3, vz: (Math.random() - 0.5) * 3, c: c[i % c.length], s, life: 1.6, g: 6, drag: 1 }); };
  if (ev.f === 'bw') { up([0x6b4a2a, 0xffffff, 0x3a2416], 16, 5, 0.22); sfx('sting', 0.6); } // feathers: the eagle has landed
  else if (ev.f === 'ac') { fxRing(ev.x, ev.z, 0.5, 7, 0xe85d9a, 0.6, 0.2); fxRing(ev.x, ev.z, 0.3, 5, 0xf5b83a, 0.5, 1.4); }
  else if (ev.f === 'hh') { up([0xf2c232, 0xffffff], 20, 6, 0.14); sfx('ding', 0.6); } // whistle sparks
  else if (ev.f === 'om') { up([0xf5b83a, 0x7cc46a], 24, 7, 0.24); sfx('ding', 0.8); } // money shower
  else if (ev.f === 'sc') { up([0x7a3fd1, 0x7ee05b, 0xff5ad1], 18, 5); sfx('scratch', 0.9); } // record scratch
}
/** Mixtape Drop: a giant spinning vinyl record falls out of the sky and lands flat at 1.2 s (the bass drop). */
function vinylDrop(x, z) {
  const g0 = gy(x, z), rec = new THREE.Group();
  rec.add(new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.15, 28), mat(0x111111)), new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.17, 18), mat(0x7a3fd1)));
  addFx(rec, 1.2, (o, k) => { o.position.set(x, g0 + 0.2 + (1 - k * k) * 26, z); o.rotation.y = k * 18; o.rotation.x = (1 - k) * 0.9; });
}
/** Private Jet: a little white jet streaks over the target, drops a gold crate on a parachute that lands at 1.6 s. */
function jetFlyover(x, z) {
  const g0 = gy(x, z), jet = new THREE.Group();
  jet.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 4), mat(0xffffff)), new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 1), mat(0xe8e0cc)), new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.7), mat(0xd9b44a)));
  jet.children[2].position.set(0, 0.6, -1.7);
  addFx(jet, 1.6, (o, k) => { o.position.set(x + (k - 0.5) * 70, g0 + 22, z - (k - 0.5) * 20); o.rotation.y = Math.atan2(70, -20); emit({ x: o.position.x, y: o.position.y, z: o.position.z, c: 0xffffff, s: 0.35, life: 0.6, g: 0, grow: 2 }); });
  const drop = new THREE.Group(), chute = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xd9b44a));
  chute.position.y = 2.4; drop.add(chute, new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0x5a3a22)));
  addFx(drop, 1.6, (o, k) => { o.position.set(x, g0 + 0.5 + (1 - k) * 20, z); o.rotation.y = k * 3; });
}
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
// Each fallen fighter loses one on-trope item: it pops up, tumbles, bounces once and lies there a few seconds.
// (Old Money sheds bills instead - they flutter down as particles.)
const DROP = {
  bw: () => [new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.34), mat(0xc62f2f))], // trucker cap
  ac: () => [new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.04), mat(0xf4f1de)), new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), mat(0x8a6a3e))], // placard
  hh: () => [new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf2c232))], // hard hat
  sc: () => [new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.32), mat(0xffffff)), new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.33), mat(0x7a3fd1))], // sneaker
  nd: () => [new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 10), mat(0x111111)), new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 10), mat(0x111111))], // glasses
};
export function fxDeath(x, z, f) {
  fxBits(x, z, FC[f].main, 3);
  const g0 = gy(x, z);
  if (f === 'om') { for (let i = 0; i < 6; i++) emit({ x, y: g0 + 1.2, z, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, c: i % 2 ? 0x7cc46a : 0x5aa05a, s: 0.18, life: 2.2, g: 2.5, drag: 2.5, floor: g0 + 0.05 }); return; }
  if (!DROP[f]) return;
  const o = new THREE.Group(), parts = DROP[f]();
  parts.forEach((m, i) => { o.add(m); if (f === 'ac' && i === 1) m.position.y = -0.3; if (f === 'nd') m.position.x = i ? 0.09 : -0.09; if (f === 'sc' && i === 1) m.position.y = -0.07; });
  const vx = (Math.random() - 0.5) * 3, vz = (Math.random() - 0.5) * 3, spin = (Math.random() - 0.5) * 14;
  let y = g0 + 1.3, vy = 4 + Math.random() * 1.5, px = x, pz = z, bounced = false;
  addFx(o, 4, (ob, k, dt) => {
    if (y > g0 + 0.08 || vy > 0) { vy -= 14 * dt; y += vy * dt; px += vx * dt; pz += vz * dt; ob.rotation.x += spin * dt; ob.rotation.z += spin * 0.6 * dt; }
    if (y < g0 + 0.08 && vy < 0) { y = g0 + 0.08; if (!bounced) { bounced = true; vy = 2; } else { vy = 0; ob.rotation.x *= 0.9; } }
    ob.position.set(px, y - (k > 0.85 ? (k - 0.85) * 2 : 0), pz);
  });
}

/** Drain this tick's sim events into effects. bump(id) makes a squad lunge. */
const SND = { hit: 'thud', shot: 'pop', boom: 'boom', fwboom: 'boom', wreckboom: 'boom', rank: 'chime', levelup: 'chime', done: 'chime',
  mud: 'sting', fwlaunch: 'whoosh', wrecklaunch: 'whoosh', parade: 'sting', pie: 'sting', cones: 'sting', screech: 'sting', bullhorn: 'sting', overtime: 'chime', takeover: 'ding', jetfly: 'whoosh', jetdrop: 'thud', heroin: 'fanfare', hush: 'ding', golive: 'ding', wifi: 'sting', patch: 'chime', hill: 'chime', blockparty: 'sting', dropbeat: 'sting', mixlaunch: 'whoosh', mixboom: 'boom', spawn: 'blip', repair: 'tap' };
function playFor(ev) {
  let name = SND[ev.k];
  if ((ev.k === 'deposit' || ev.k === 'income' || ev.k === 'refund' || ev.k === 'scrap') && ev.owner === 0) name = 'ding';
  if (!name) return;
  const x = ev.tx ?? ev.x, z = ev.tz ?? ev.z, d = x === undefined ? 0 : Math.hypot(x - CAM.tx, z - CAM.tz);
  sfx(name, Math.max(0, 1 - d / (40 + CAM.dist * 0.6)));
}
export function handleEvents(S, bump) {
  for (const ev of S.events) {
    playFor(ev);
    switch (ev.k) {
      case 'shot':
        if (ev.slot === 'siege' && ev.f === 'sc') sprayTag(S, ev);
        if (ev.slot === 'siege' && ev.f === 'bw') for (let k = 0; k < 6; k++) emit({ x: ev.x + (Math.random() - 0.5) * 1.2, y: gy(ev.x, ev.z, 1.6), z: ev.z + (Math.random() - 0.5) * 1.2, vx: (Math.random() - 0.5) * 0.8, vy: 0.8 + Math.random(), vz: (Math.random() - 0.5) * 0.8, c: k % 2 ? 0x9a9a9a : 0xd8d8d8, s: 0.5, life: 1.6 + Math.random(), g: -0.3, drag: 1, grow: 3 });
        if (ev.slot === 'siege' && ev.f === 'bw') fxArc(ev.x, ev.z, ev.tx, ev.tz, 0xd63c3c, () => { fxRing(ev.tx, ev.tz, 0.5, 3.5, 0xf5b83a, 0.4); fxBits(ev.tx, ev.tz, 0xf5b83a, 5); });
        else if ((ev.f === 'ac' || ev.f === 'sc') && ev.slot === 'ranged') { soundWaves(ev.x, ev.z, ev.tx, ev.tz); fxRing(ev.tx, ev.tz, 0.3, 1.6, 0xe85d9a, 0.3, 1); }
        else if (ev.f === 'bw' && ev.slot === 'ranged') { // shotgun: three pellets in a spread
          const dx = ev.tx - ev.x, dz = ev.tz - ev.z, L = Math.hypot(dx, dz) || 1, px = -dz / L, pz = dx / L;
          for (const k of [-1, 0, 1]) { const sp = k * (0.5 + Math.random() * 0.5); burstShot(ev.x, gy(ev.x, ev.z, 1.25), ev.z, ev.tx + px * sp, gy(ev.tx, ev.tz, 0.8 + Math.random() * 0.4), ev.tz + pz * sp, 0xfff2a8); }
        }
        else if (ev.bk === 'tower' && ev.f === 'ac') paintBalloon(ev.x, ev.z, ev.tx, ev.tz);
        else if (ev.bk === 'tower' && ev.f === 'bw') { // Deer Stand: a heavy slug and a fat puff of gunsmoke off the stand
          burstShot(ev.x, gy(ev.x, ev.z, 5), ev.z, ev.tx, gy(ev.tx, ev.tz, 0.95), ev.tz, 0xffe9a8);
          for (let k = 0; k < 4; k++) emit({ x: ev.x + (ev.tx - ev.x) * 0.06, y: gy(ev.x, ev.z, 5), z: ev.z + (ev.tz - ev.z) * 0.06, vx: (Math.random() - 0.5), vy: 0.6 + Math.random() * 0.5, vz: (Math.random() - 0.5), c: 0xcfcfcf, s: 0.6, life: 1.3, g: -0.2, drag: 1.5, grow: 2.5 });
        }
        else { const y0 = ev.y0 || 1.25; burstShot(ev.x, gy(ev.x, ev.z, y0), ev.z, ev.tx, gy(ev.tx, ev.tz, 0.95), ev.tz, ev.slot === 'hq' ? 0xffffff : 0xfff2a8); }
        bump(ev.id); break;
      case 'hit':
        if (ev.area && ev.slot === 'cav') shake(0.5, ev.tx, ev.tz); // monster truck slam
        if (ev.slot === 'hero' && ev.f === 'ac') { // bullhorn blast: rings roll from him to the target
          const dx = ev.tx - ev.x, dz = ev.tz - ev.z;
          for (let k = 0; k < 3; k++) setTimeout(() => fxRing(ev.x + dx * (0.3 + k * 0.3), ev.z + dz * (0.3 + k * 0.3), 0.3, 1.4 + k * 0.4, 0xe85d9a, 0.3, 1.4), k * 90);
        }
        if (ev.area) { fxRing(ev.tx, ev.tz, 0.6, 3, 0xc9a875, 0.35); fxBits(ev.tx, ev.tz, 0x8a7a55, 4); }
        else { const hx = ev.tx + (Math.random() - 0.5) * 0.8, hz = ev.tz + (Math.random() - 0.5) * 0.8; burstHit(hx, gy(hx, hz, 1), hz, gy(hx, hz)); }
        bump(ev.id); break;
      case 'boom': shake(1.6, ev.x, ev.z); fxRing(ev.x, ev.z, 1, ev.r * 3, 0xff8a3c, 0.7); fxBits(ev.x, ev.z, 0x6b5a45, 16, 1.5, 9); fxRubble(ev.x, ev.z, ev.r); break;
      case 'done': fxRing(ev.x, ev.z, 0.5, 4, 0xffffff, 0.5, 0.2); break;
      case 'scrap': fxBits(ev.x, ev.z, 0x9a9a9a, 6, 1, 5); fxCoin(ev.x, 2, ev.z); fxWreck(ev.x, ev.z, ev.slot === 'cav', ev.h || 0); break;
      case 'income': if (ev.owner === 0) for (const b of S.blds) if (b.owner === 0 && b.kind === 'depot' && b.built >= 1) fxCoin(b.x, 3.2, b.z); break;
      case 'refund': if (ev.owner === 0) { burstCoins(ev.x, gy(ev.x, ev.z, 3), ev.z, gy(ev.x, ev.z)); fxCoin(ev.x, 3.5, ev.z); } break;
      case 'heal': for (let k = 0; k < 4; k++) emit({ x: ev.x + (Math.random() - 0.5) * 2, y: gy(ev.x, ev.z, 0.5), z: ev.z + (Math.random() - 0.5) * 2, vy: 1.5 + Math.random(), c: k % 2 ? 0x7ee05b : 0xd6ffcf, s: 0.22, life: 0.9, g: -0.5 }); break;
      case 'enter': fxRing(ev.x, ev.z, 0.5, 3, 0x7fd1ff, 0.4, 4.6); break;
      case 'eject': fxRing(ev.x, ev.z, 0.4, 2.5, 0x7fd1ff, 0.4); break;
      case 'repair': for (let k = 0; k < 5; k++) emit({ x: ev.x, y: gy(ev.x, ev.z, 1.2 + Math.random()), z: ev.z, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 4, c: k % 2 ? 0xffe14d : 0xffffff, s: 0.12, life: 0.35, g: 14 }); break;
      case 'cones': fxRing(ev.x, ev.z, 0.5, ev.r, 0xf28c28, 0.5, 0.15); fxBits(ev.x, ev.z, 0xf28c28, 10, 0.5, 6); break;
      case 'wrecklaunch': wreckingBall(ev.x, ev.z); break;
      case 'wreckboom': {
        fxRing(ev.x, ev.z, 1, ev.r * 1.6, 0x8a8378, 0.6); fxBits(ev.x, ev.z, 0x6b655c, 14, 1, 8); shake(1.4, ev.x, ev.z);
        const g0 = gy(ev.x, ev.z);
        for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28; emit({ x: ev.x + Math.cos(a), y: g0 + 0.4, z: ev.z + Math.sin(a), vx: Math.cos(a) * (4 + Math.random() * 3), vy: 1 + Math.random() * 2, vz: Math.sin(a) * (4 + Math.random() * 3), c: 0xb3a58a, s: 0.7, life: 1.4, g: -0.2, drag: 2, grow: 2.6 }); }
        break;
      }
      case 'overtime': { // whistle: two yellow rings + a burst of little hard-hat-yellow sparks rising round the Foreman
        fxRing(ev.x, ev.z, 0.5, 9, 0xf2c232, 0.6, 0.25); fxRing(ev.x, ev.z, 0.5, 12, 0xffffff, 0.8, 0.2);
        for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; emit({ x: ev.x + Math.cos(a) * 2, y: gy(ev.x, ev.z, 0.4), z: ev.z + Math.sin(a) * 2, vx: Math.cos(a) * 3, vy: 3, vz: Math.sin(a) * 3, c: i % 2 ? 0xf2c232 : 0xf28c28, s: 0.22, life: 0.9, g: 5 }); }
        break;
      }
      case 'takeover': { const g0 = gy(ev.x, ev.z); for (let i = 0; i < 30; i++) emit({ x: ev.x + (Math.random() - 0.5) * 4, y: g0 + 8 + Math.random() * 4, z: ev.z + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5), vy: -4, vz: (Math.random() - 0.5), c: i % 3 ? 0x7cc46a : 0xf5b83a, s: 0.3, life: 2, g: 2, drag: 1, floor: g0 + 0.1 }); fxRing(ev.x, ev.z, 0.5, 4, 0xd9b44a, 0.6); break; }
      case 'jetfly': fxRing(ev.x, ev.z, 3, 0.5, 0xd9b44a, 1.6, 0.15); jetFlyover(ev.x, ev.z); break;
      case 'blockparty': for (const s of S.squads) if (s.owner === ev.owner) { // the speakers kick in: bass rings pulse off every squad + coloured sparks
        fxRing(s.x, s.z, 0.5, 4, 0x7a3fd1, 0.5, 0.2); fxRing(s.x, s.z, 0.3, 3, 0x7ee05b, 0.5, 1.4);
        for (let k = 0; k < 8; k++) emit({ x: s.x, y: gy(s.x, s.z, 1.6), z: s.z, vx: (Math.random() - 0.5) * 4, vy: 3 + Math.random() * 3, vz: (Math.random() - 0.5) * 4, c: [0x7a3fd1, 0x7ee05b, 0xff5ad1, 0x5ae0ff][k % 4], s: 0.18, life: 1.4, g: 5, drag: 1 });
      } break;
      case 'dropbeat': for (let k = 0; k < 3; k++) fxRing(ev.x, ev.z, 0.5, 9, [0x7a3fd1, 0x7ee05b, 0xff5ad1][k], 0.45 + k * 0.2, 0.15 + k * 0.4); shake(0.4, ev.x, ev.z); break;
      case 'mixlaunch': fxRing(ev.x, ev.z, 7, 0.5, 0x7a3fd1, 1.2, 0.15); vinylDrop(ev.x, ev.z); break;
      case 'mixboom': { // the drop: three bass rings roll out, everything bounces, a spray of purple/green
        shake(1.2, ev.x, ev.z);
        for (let k = 0; k < 3; k++) fxRing(ev.x, ev.z, 0.5, ev.r * (1 + k * 0.25), [0x7a3fd1, 0x7ee05b, 0xff5ad1][k], 0.5 + k * 0.15, 0.3);
        fxBits(ev.x, ev.z, 0x7a3fd1, 10, 1, 8); fxBits(ev.x, ev.z, 0x7ee05b, 10, 1, 8);
        break;
      }
      case 'jetdrop': fxRing(ev.x, ev.z, 0.5, 4, 0xffffff, 0.5); fxBits(ev.x, ev.z, 0xd9b44a, 8, 1, 5); break;
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
      case 'screech': {
        // Eagle's cry: three sound rings roll out from the bird in quick succession, at its height and on the ground,
        // and a burst of brown and white feathers drifts down.
        for (let k = 0; k < 3; k++) setTimeout(() => { fxRing(ev.x, ev.z, 1, 7 + k, 0xffffff, 0.55, 3.8 - k * 0.6); fxRing(ev.x, ev.z, 0.5, 5.5 + k, 0xf5e6c8, 0.6, 0.2); }, k * 120);
        shake(0.4, ev.x, ev.z);
        for (let i = 0; i < 18; i++) emit({ x: ev.x, y: gy(ev.x, ev.z, 3.8), z: ev.z, vx: (Math.random() - 0.5) * 7, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 7, c: i % 3 ? 0x5a3a22 : 0xffffff, s: 0.18, life: 2.2, g: 1.5, drag: 2.2 });
        break;
      }
      case 'bullhorn': fxRing(ev.x, ev.z, 0.5, 8, 0xe85d9a, 0.6, 0.2); fxRing(ev.x, ev.z, 0.3, 5, 0xf5b83a, 0.5, 1.6); break;
      case 'pie': fxPie(ev.x, ev.z); break;
      case 'parade': for (const s of S.squads) if (s.owner === ev.owner) { fxConfetti(s.x, s.z, 14); confettiCannon(s.x, s.z); } break;
      case 'mud': fxRing(ev.x, ev.z, 1, 8, 0x5b4026, 0.5, 0.15); fxBits(ev.x, ev.z, 0x5b4026, 10, 0.3, 8); break;
      case 'fwlaunch': { const p = S.players[ev.owner]; for (let i = 0; i < 6; i++) fxRocket(p.hqx + (Math.random() - 0.5) * 3, p.hqz, ev.x + (Math.random() - 0.5) * 8, ev.z + (Math.random() - 0.5) * 8, CONF[i], 1.5 + i * 0.05); break; }
      case 'fwboom': fxFireworks(ev.x, ev.z, ev.r); shake(1.2, ev.x, ev.z); break;
      case 'hill': if (ev.owner >= 0) { fxRing(ev.x, ev.z, 1, 9, ev.owner === 0 ? 0x7fd1ff : 0xff5a4f, 0.7, 0.3); fxBits(ev.x, ev.z, ev.owner === 0 ? 0x7fd1ff : 0xff5a4f, 10, 1, 6); } break;
      case 'wifi': { // the signal dies: wifi arcs collapse inward, then a red static crackle over the area
        for (let k = 0; k < 3; k++) fxRing(ev.x, ev.z, ev.r * (1 - k * 0.25), 0.4, 0x5aa9e6, 0.5 + k * 0.15, 0.3 + k * 0.4);
        fxRing(ev.x, ev.z, 0.5, ev.r, 0xff5a4f, 0.4, 0.2);
        for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, d = Math.random() * ev.r; emit({ x: ev.x + Math.cos(a) * d, y: gy(ev.x, ev.z, 0.5 + Math.random() * 2), z: ev.z + Math.sin(a) * d, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vz: (Math.random() - 0.5) * 6, c: i % 2 ? 0xffffff : 0x5aa9e6, s: 0.12, life: 0.25 + Math.random() * 0.3, g: 0 }); }
        break;
      }
      case 'patch': for (const s of S.squads) if (s.owner === ev.owner) { // green code bits stream up off every squad
        fxRing(s.x, s.z, 0.4, 3, 0x7ee05b, 0.5, 0.2);
        for (let k = 0; k < 6; k++) emit({ x: s.x + (Math.random() - 0.5) * 2, y: gy(s.x, s.z, 0.3), z: s.z + (Math.random() - 0.5) * 2, vy: 2.5 + Math.random() * 2, c: k % 2 ? 0x7ee05b : 0xd6ffcf, s: 0.14, life: 1.2, g: -0.5 });
      } break;
      case 'golive': { // camera flashes: a white pop over each stunned squad, a live-red ring off the Streamer
        fxRing(ev.x, ev.z, 0.5, 6, 0xff3040, 0.6, 1.6);
        for (const s of S.squads) if (ev.ids.includes(s.id)) for (let k = 0; k < 4; k++) emit({ x: s.x + (Math.random() - 0.5) * 2.5, y: gy(s.x, s.z, 1.4 + Math.random()), z: s.z + (Math.random() - 0.5) * 2.5, c: 0xffffff, s: 0.5, life: 0.15 + k * 0.12, g: 0 });
        break;
      }
      case 'hush': { // a briefcase arcs over, pops open into a coin spray on the bribed squad
        fxArc(ev.x, ev.z, ev.tx, ev.tz, 0x3a2416, () => { const g0 = gy(ev.tx, ev.tz); for (let i = 0; i < 18; i++) emit({ x: ev.tx, y: g0 + 1.5, z: ev.tz, vx: (Math.random() - 0.5) * 5, vy: 3 + Math.random() * 4, vz: (Math.random() - 0.5) * 5, c: i % 3 ? 0xf5b83a : 0x7cc46a, s: 0.2, life: 1.2, g: 12, floor: g0 + 0.1 }); fxRing(ev.tx, ev.tz, 0.5, 3.5, 0xd9b44a, 0.5); });
        break;
      }
      case 'heroin': heroEntrance(ev); break;
      case 'spawn': fxRing(ev.x, ev.z, 0.5, 2.2, 0xf3efe2, 0.35); break;
    }
  }
  S.events.length = 0;
}

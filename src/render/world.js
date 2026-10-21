// Static city: streets, sidewalks, buildings, parks, freeway trench + overpasses, ambient traffic.
// Built once from map/layout.js. Mostly InstancedMesh so it stays cheap on phones.
import { THREE, scene, mat, box } from './scene.js?v=11';
import { MAP, BLOCKS, TREES, PARKED, TRENCH, OVERPASSES, AVENUES, CROSS_STREETS, HOME_Z, inRect } from '../map/layout.js?v=11';
import { hash } from '../util/math.js?v=11';
import { emit } from '../fx/particles.js?v=11';

const COL = {
  asphalt: 0x3d4148, sidewalk: 0xa8a49a, grass: 0x6f9e50, lawn: 0x7cab58, lot: 0x4b4f56, stripe: 0xe8e2c8,
  trench: 0x585c62, wall: 0x8c8a84, deck: 0x9a978f, rail: 0x6d6b66, glass: 0x2a3a4c, roof: 0x55524c,
};
const FACADES = [0xb5523b, 0xc9b79a, 0x6f8f9c, 0xd8cfb8, 0x8a6f5a, 0x9fae8a, 0xc7865a, 0x7a7f8c];
const SIGNS = [0xf2b632, 0xe85d9a, 0x2cc2ad, 0xd64545, 0x6fc3ff];

const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sv = new THREE.Vector3(), C = new THREE.Color();
function instanced(geo, color, list, perInstanceColor) {
  const im = new THREE.InstancedMesh(geo, mat(perInstanceColor ? 0xffffff : color), list.length);
  list.forEach((it, i) => {
    Q.setFromAxisAngle(V.set(0, 1, 0), it.rot || 0);
    M.compose(V.set(it.x, it.y, it.z), Q, Sv.set(it.sx || 1, it.sy || 1, it.sz || 1));
    im.setMatrixAt(i, M);
    if (perInstanceColor) im.setColorAt(i, C.setHex(it.c));
  });
  scene.add(im);
  return im;
}
const unitBox = new THREE.BoxGeometry(1, 1, 1);

let traffic = null, life = null, wt = 0;

export function buildWorld() {
  // Ground: asphalt everywhere except the trench.
  const span = MAP.h / 2 - TRENCH.half;
  for (const s of [1, -1]) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w, span), mat(COL.asphalt));
    g.rotation.x = -Math.PI / 2; g.position.set(0, 0, s * (TRENCH.half + span / 2)); scene.add(g);
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w, MAP.h / 2 - HOME_Z), mat(COL.lawn));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.03, s * (HOME_Z + (MAP.h / 2 - HOME_Z) / 2)); scene.add(lawn);
  }
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), mat(0x5d6a54));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.2; scene.add(outer);

  // Freeway trench: floor, walls, lane dashes, overpasses with pillars.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w + 40, TRENCH.half * 2), mat(COL.trench));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -TRENCH.depth; scene.add(floor);
  for (const s of [1, -1]) scene.add(box(MAP.w + 40, TRENCH.depth, 0.6, COL.wall, 0, -TRENCH.depth / 2, s * (TRENCH.half - 0.3)));
  const dashes = [];
  for (let x = -78; x < 78; x += 6) for (const z of [-2, 0, 2]) dashes.push({ x, y: -TRENCH.depth + 0.02, z, sx: 2.5, sy: 0.02, sz: z === 0 ? 0.35 : 0.18 });
  instanced(unitBox, COL.stripe, dashes);
  for (const [a, b] of OVERPASSES) {
    const w = b - a, cx = (a + b) / 2;
    scene.add(box(w, 0.7, TRENCH.half * 2 + 1, COL.deck, cx, -0.35, 0));
    for (const rx of [a + 0.2, b - 0.2]) scene.add(box(0.35, 1.1, TRENCH.half * 2 + 1, COL.rail, rx, 0.55, 0));
    for (const px of [a + 2, b - 2]) scene.add(box(1.2, TRENCH.depth, 1.2, COL.wall, px, -TRENCH.depth / 2 - 0.35, 0));
  }

  // Street lane markings (skip where a block sits).
  const lines = [];
  for (const ax of AVENUES) for (let z = -98; z < 98; z += 5) {
    if (Math.abs(z) < TRENCH.half + 1) continue;
    if (BLOCKS.some((b) => inRect(ax, z, b, 0.5))) continue;
    if (Math.abs(z) > HOME_Z) continue;
    lines.push({ x: ax, y: 0.02, z, sx: 0.25, sy: 0.02, sz: 2.4 });
  }
  for (const cz0 of CROSS_STREETS) for (const cz of [cz0, -cz0]) for (let x = -58; x < 58; x += 5) {
    if (BLOCKS.some((b) => inRect(x, cz, b, 0.5))) continue;
    lines.push({ x, y: 0.02, z: cz, sx: 2.4, sy: 0.02, sz: 0.25 });
  }
  instanced(unitBox, COL.stripe, lines);

  // Blocks: sidewalks, then park grass / lot asphalt / buildings.
  const walks = [], greens = [], lots = [], stalls = [];
  const bodies = [], bands = [], roofs = [], signs = [], acs = [];
  for (const b of BLOCKS) {
    walks.push({ x: (b.x0 + b.x1) / 2, y: 0.08, z: (b.z0 + b.z1) / 2, sx: b.x1 - b.x0 + 1.6, sy: 0.16, sz: b.z1 - b.z0 + 1.6 });
    if (b.kind === 'park') greens.push({ x: (b.x0 + b.x1) / 2, y: 0.17, z: (b.z0 + b.z1) / 2, sx: b.x1 - b.x0 - 1, sy: 0.02, sz: b.z1 - b.z0 - 1 });
    if (b.kind === 'lot') {
      lots.push({ x: (b.x0 + b.x1) / 2, y: 0.17, z: (b.z0 + b.z1) / 2, sx: b.x1 - b.x0 - 1, sy: 0.02, sz: b.z1 - b.z0 - 1 });
      for (let x = b.x0 + 2; x < b.x1 - 1; x += 3) stalls.push({ x, y: 0.19, z: (b.z0 + b.z1) / 2, sx: 0.15, sy: 0.02, sz: b.z1 - b.z0 - 2 });
    }
    if (b.kind !== 'bld') continue;
    // Split the block into storefront chunks along its long side.
    const alongX = b.x1 - b.x0 >= b.z1 - b.z0;
    const len = alongX ? b.x1 - b.x0 : b.z1 - b.z0;
    let pos = 0, k = 0;
    while (pos < len - 0.5) {
      const seed = Math.round(b.x0 * 13 + b.z0 * 7 + k * 31);
      let w = 6 + hash(seed, 3) * 6;
      if (len - pos - w < 4) w = len - pos;
      const h = 5 + Math.floor(hash(seed, 4) * 4) * 3 + (Math.abs(b.z0) >= 44 ? 3 : 0);
      const cx = alongX ? b.x0 + pos + w / 2 : (b.x0 + b.x1) / 2;
      const cz = alongX ? (b.z0 + b.z1) / 2 : b.z0 + pos + w / 2;
      const sx = alongX ? w - 0.25 : b.x1 - b.x0, sz = alongX ? b.z1 - b.z0 : w - 0.25;
      bodies.push({ x: cx, y: h / 2, z: cz, sx, sy: h, sz, c: FACADES[Math.floor(hash(seed, 5) * FACADES.length)] });
      roofs.push({ x: cx, y: h + 0.2, z: cz, sx: sx + 0.3, sy: 0.4, sz: sz + 0.3 });
      for (let fy = 4; fy < h - 1; fy += 3) bands.push({ x: cx, y: fy, z: cz, sx: sx + 0.12, sy: 0.8, sz: sz + 0.12 });
      signs.push({ x: cx, y: 2.4, z: cz, sx: sx + 0.2, sy: 0.6, sz: sz + 0.2, c: SIGNS[Math.floor(hash(seed, 6) * SIGNS.length)] });
      if (hash(seed, 7) > 0.4) acs.push({ x: cx + (hash(seed, 8) - 0.5) * sx * 0.5, y: h + 0.9, z: cz + (hash(seed, 9) - 0.5) * sz * 0.5, sx: 1.4, sy: 1, sz: 1.2 });
      pos += w; k++;
    }
  }
  instanced(unitBox, COL.sidewalk, walks);
  instanced(unitBox, COL.grass, greens);
  instanced(unitBox, COL.lot, lots);
  instanced(unitBox, COL.stripe, stalls);
  instanced(unitBox, 0, bodies, true);
  instanced(unitBox, COL.glass, bands);
  instanced(unitBox, COL.roof, roofs);
  instanced(unitBox, 0, signs, true);
  instanced(unitBox, 0x8f939a, acs);

  // Trees.
  const crowns = [], trunks = [];
  TREES.forEach((t, i) => {
    const s = 0.8 + hash(i, 5) * 0.5;
    crowns.push({ x: t.x, y: 2.6 * s + 0.6, z: t.z, sx: s, sy: s, sz: s, rot: hash(i, 6) * 6 });
    trunks.push({ x: t.x, y: 0.8, z: t.z });
  });
  const crownIM = instanced(new THREE.IcosahedronGeometry(1.5, 0), 0x4f7f3a, crowns);
  crownIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instanced(new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6), 0x5a3d26, trunks);

  // Street lamps along avenues.
  const poles = [], heads = [];
  for (const ax of AVENUES) for (let z = 10; z < HOME_Z; z += 12) for (const s of [1, -1]) {
    const x = s * ax + (ax ? 5.6 : 5.6) * (s > 0 ? 1 : -1), zz = s * z;
    if (BLOCKS.some((b) => b.kind === 'bld' && inRect(x, zz, b, 0.2))) continue;
    poles.push({ x, y: 2.5, z: zz, sx: 0.15, sy: 5, sz: 0.15 });
    heads.push({ x, y: 5.1, z: zz, sx: 0.6, sy: 0.25, sz: 0.6 });
  }
  instanced(unitBox, 0x3a3a3a, poles);
  instanced(unitBox, 0xfff1b0, heads);

  // Parked cars.
  const carBodies = PARKED.map((p) => ({ x: p.x, y: 0.6, z: p.z, sx: 1.8, sy: 0.9, sz: 3.8, rot: p.rot, c: p.c }));
  const carTops = PARKED.map((p) => ({ x: p.x, y: 1.35, z: p.z, sx: 1.5, sy: 0.6, sz: 1.9, rot: p.rot }));
  instanced(unitBox, 0, carBodies, true);
  instanced(unitBox, 0x2b3a4c, carTops);

  // Traffic lights on the corner of every open intersection: pole + a 3-lamp head. Lamps cycle green/amber/red.
  const tlPoles = [], tlHeads = [], tlLamps = [];
  const open = (x, z) => !BLOCKS.some((b) => inRect(x, z, b, 0.3));
  for (const ax of AVENUES) for (const cz0 of CROSS_STREETS) for (const sz of [1, -1]) {
    const cz = sz * cz0, x = ax + 5.4, z = cz + 4.6 * sz;
    if (!open(x, z) && !open(ax, cz)) continue;
    tlPoles.push({ x, y: 2, z, sx: 0.14, sy: 4, sz: 0.14 });
    tlHeads.push({ x, y: 4.3, z, sx: 0.45, sy: 1.3, sz: 0.4 });
    for (let k = 0; k < 3; k++) tlLamps.push({ x, y: 4.75 - k * 0.42, z: z - 0.22 * sz, sx: 0.3, sy: 0.3, sz: 0.1, c: 0x333333, ph: (ax + cz) * 0.37 });
  }
  instanced(unitBox, 0x2e2e2e, tlPoles);
  instanced(unitBox, 0x1e1e1e, tlHeads);
  const lampIM = tlLamps.length ? instanced(unitBox, 0, tlLamps, true) : null;
  if (lampIM) lampIM.material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // lamps glow, unlit

  // Steam vents: manholes in the open street that breathe a puff now and then.
  const vents = [];
  for (const ax of AVENUES) for (const z of [-30, -9, 9, 30]) if (open(ax + 2, z)) vents.push({ x: ax + 2, z, t: hash(ax + 50, z + 50) * 3 });
  instanced(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 10), 0x2a2a2a, vents.map((v) => ({ x: v.x, y: 0.03, z: v.z })));

  // Birds: a few small flocks circling over the parks, wings flapping.
  const birds = [], parks = BLOCKS.filter((b) => b.kind === 'park');
  parks.forEach((p, pi) => { for (let i = 0; i < 6; i++) birds.push({ cx: (p.x0 + p.x1) / 2, cz: (p.z0 + p.z1) / 2, r: 6 + hash(pi * 9 + i, 1) * 6, h: 13 + hash(pi * 9 + i, 2) * 5, a: hash(pi * 9 + i, 3) * 6.28, w: (0.25 + hash(pi * 9 + i, 4) * 0.2) * (pi % 2 ? 1 : -1) }); });
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, -0.7, 0, -0.1, 0, 0, -0.2, 0, 0, 0.25, 0, 0, -0.2, 0.7, 0, -0.1], 3));
  wing.computeVertexNormals();
  const birdIM = new THREE.InstancedMesh(wing, new THREE.MeshBasicMaterial({ color: 0x2a2a30, side: THREE.DoubleSide }), birds.length);
  birdIM.frustumCulled = false; scene.add(birdIM);
  life = { crownIM, crowns, lampIM, tlLamps, vents, birds, birdIM };

  // Freeway traffic (render only, loops forever).
  const lanes = [-3.2, -1, 1, 3.2];
  const cars = [];
  for (let i = 0; i < 18; i++) cars.push({ lane: lanes[i % 4], x: -80 + hash(i, 2) * 160, v: (i % 4 < 2 ? -1 : 1) * (12 + hash(i, 3) * 8), c: [0xd64545, 0x3d6fd6, 0xe8e0cc, 0x2a2a2a, 0xf2b632][i % 5], truck: hash(i, 4) > 0.75 });
  const im = new THREE.InstancedMesh(unitBox, mat(0xffffff), cars.length);
  cars.forEach((c, i) => im.setColorAt(i, C.setHex(c.c)));
  scene.add(im);
  traffic = { im, cars };
}

const _e = new THREE.Euler(), LAMP = [0x5dff7a, 0xffc23a, 0xff4a3c], OFF = 0x333333;
function updateLife(dt) {
  if (!life) return;
  wt += dt;
  const { crownIM, crowns, lampIM, tlLamps, vents, birds, birdIM } = life;
  // Trees sway: a slow lean plus a faster rustle, each tree on its own phase.
  crowns.forEach((t, i) => {
    const ph = i * 1.7, sway = Math.sin(wt * 0.9 + ph) * 0.06 + Math.sin(wt * 2.3 + ph * 0.5) * 0.02;
    Q.setFromEuler(_e.set(sway, t.rot, sway * 0.6));
    M.compose(V.set(t.x, t.y, t.z), Q, Sv.set(t.sx, t.sy, t.sz));
    crownIM.setMatrixAt(i, M);
  });
  crownIM.instanceMatrix.needsUpdate = true;
  // Lights: 9 s cycle (5 green, 1 amber, 3 red), offset per intersection.
  if (lampIM) {
    for (let i = 0; i < tlLamps.length; i += 3) {
      const c = (wt + tlLamps[i].ph * 9) % 9, on = c < 3 ? 0 : c < 4 ? 1 : 2; // top red, middle amber, bottom green
      for (let k = 0; k < 3; k++) lampIM.setColorAt(i + k, C.setHex((k === 0 && on === 0) || (k === 1 && on === 1) || (k === 2 && on === 2) ? LAMP[2 - k] : OFF));
    }
    lampIM.instanceColor.needsUpdate = true;
  }
  // Steam: every couple of seconds a vent breathes three soft grey puffs.
  for (const v of vents) {
    v.t -= dt;
    if (v.t > 0) continue;
    v.t = 1.6 + Math.random() * 2.5;
    for (let k = 0; k < 3; k++) emit({ x: v.x + (Math.random() - 0.5) * 0.4, y: 0.2, z: v.z + (Math.random() - 0.5) * 0.4, vx: (Math.random() - 0.5) * 0.6, vy: 1.4 + Math.random(), vz: (Math.random() - 0.5) * 0.6, c: k ? 0xd9dde2 : 0xffffff, s: 0.5, life: 1.6, g: -0.3, drag: 1.2, grow: 3 });
  }
  // Birds circle and flap (flap = squash the wing span).
  birds.forEach((b, i) => {
    b.a += b.w * dt;
    const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r, flap = 0.35 + Math.abs(Math.sin(wt * 9 + i)) * 0.9;
    Q.setFromEuler(_e.set(0, -b.a + (b.w > 0 ? 0 : Math.PI), 0));
    M.compose(V.set(x, b.h + Math.sin(wt * 1.3 + i) * 0.6, z), Q, Sv.set(flap, 1, 1));
    birdIM.setMatrixAt(i, M);
  });
  birdIM.instanceMatrix.needsUpdate = true;
}

export function updateWorld(dt) {
  updateLife(dt);
  if (!traffic) return;
  const { im, cars } = traffic;
  cars.forEach((c, i) => {
    c.x += c.v * dt;
    if (c.x > 80) c.x -= 160;
    if (c.x < -80) c.x += 160;
    Q.identity();
    M.compose(V.set(c.x, -TRENCH.depth + (c.truck ? 1.2 : 0.6), c.lane), Q, Sv.set(c.truck ? 7 : 3.8, c.truck ? 2.2 : 1.1, 1.8));
    im.setMatrixAt(i, M);
  });
  im.instanceMatrix.needsUpdate = true;
}

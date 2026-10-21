// Static city: streets, sidewalks, buildings, parks, freeway trench + overpasses, ambient traffic.
// Built once from map/layout.js. Mostly InstancedMesh so it stays cheap on phones.
import { THREE, scene, mat, box } from './scene.js?v=2';
import { MAP, BLOCKS, TREES, PARKED, TRENCH, OVERPASSES, AVENUES, CROSS_STREETS, HOME_Z, inRect } from '../map/layout.js?v=2';
import { hash } from '../util/math.js?v=2';

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

let traffic = null;

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
  instanced(new THREE.IcosahedronGeometry(1.5, 0), 0x4f7f3a, crowns);
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

  // Freeway traffic (render only, loops forever).
  const lanes = [-3.2, -1, 1, 3.2];
  const cars = [];
  for (let i = 0; i < 18; i++) cars.push({ lane: lanes[i % 4], x: -80 + hash(i, 2) * 160, v: (i % 4 < 2 ? -1 : 1) * (12 + hash(i, 3) * 8), c: [0xd64545, 0x3d6fd6, 0xe8e0cc, 0x2a2a2a, 0xf2b632][i % 5], truck: hash(i, 4) > 0.75 });
  const im = new THREE.InstancedMesh(unitBox, mat(0xffffff), cars.length);
  cars.forEach((c, i) => im.setColorAt(i, C.setHex(c.c)));
  scene.add(im);
  traffic = { im, cars };
}

export function updateWorld(dt) {
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

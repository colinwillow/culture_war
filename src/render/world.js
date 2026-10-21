// Static city: streets, sidewalks, buildings, parks, freeway trench + overpasses, ambient traffic.
// Built once from map/layout.js. Mostly InstancedMesh so it stays cheap on phones.
import { THREE, scene, mat, box, setOvercast } from './scene.js?v=115';
import { CAM } from '../camera/camera.js?v=115';
import { MAP, BLOCKS, TREES, PARKED, TRENCH, OVERPASSES, AVENUES, CROSS_STREETS, HOME_Z, inRect, walkH } from '../map/layout.js?v=115';
import { hash } from '../util/math.js?v=115';
import { emit } from '../fx/particles.js?v=115';

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
    g.rotation.x = -Math.PI / 2; g.position.set(0, 0, s * (TRENCH.half + span / 2)); g.receiveShadow = true; scene.add(g);
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w, MAP.h / 2 - HOME_Z), mat(COL.lawn));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.03, s * (HOME_Z + (MAP.h / 2 - HOME_Z) / 2)); lawn.receiveShadow = true; scene.add(lawn);
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
  for (const im of [instanced(unitBox, COL.sidewalk, walks), instanced(unitBox, COL.grass, greens), instanced(unitBox, COL.lot, lots)]) im.receiveShadow = true;
  instanced(unitBox, COL.stripe, stalls);
  instanced(unitBox, 0, bodies, true);
  windows = instanced(unitBox, COL.glass, bands); windows.material = new THREE.MeshLambertMaterial({ color: COL.glass });
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
  lampHeads = instanced(unitBox, 0xfff1b0, heads); lampHeads.material = new THREE.MeshLambertMaterial({ color: 0xfff1b0 });

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
  // Pigeons: little flocks pecking on the park grass. Walk a squad through them and they burst up and away,
  // circle, and glide back to the same spot a few seconds later.
  const pigeons = [];
  parks.forEach((p, pi) => { for (let i = 0; i < 9; i++) { const hx = p.x0 + 3 + hash(pi * 31 + i, 7) * (p.x1 - p.x0 - 6), hz = p.z0 + 3 + hash(pi * 31 + i, 8) * (p.z1 - p.z0 - 6); pigeons.push({ hx, hz, x: hx, y: 0.2, z: hz, vx: 0, vy: 0, vz: 0, st: 'peck', t: hash(i, 9) * 6, rot: hash(i, 10) * 6 }); } });
  const pgeo = new THREE.BoxGeometry(0.22, 0.18, 0.34);
  const pigIM = new THREE.InstancedMesh(pgeo, new THREE.MeshLambertMaterial({ color: 0x8d929c }), pigeons.length);
  pigIM.frustumCulled = false; scene.add(pigIM);
  // City cars: a few little cars cruise the open stretches of each avenue (U-turning at dead ends), keep right,
  // stop for red lights at intersections and wait politely if troops are in the road ahead.
  const segs = [];
  for (const ax of AVENUES) {
    let run = null;
    for (let z = -HOME_Z + 2; z <= HOME_Z - 2; z += 1) {
      const ok = !BLOCKS.some((b) => b.kind === 'bld' && (inRect(ax - 2, z, b, 0.6) || inRect(ax + 2, z, b, 0.6)));
      if (ok) { if (!run) run = { ax, z0: z, z1: z }; else run.z1 = z; } else if (run) { segs.push(run); run = null; }
    }
    if (run) segs.push(run);
  }
  const ccars = [];
  segs.filter((g) => g.z1 - g.z0 > 20).forEach((g, gi) => { for (let k = 0; k < 2; k++) ccars.push({ g, z: g.z0 + hash(gi * 7 + k, 3) * (g.z1 - g.z0), dir: k ? 1 : -1, v: 0, top: 6 + hash(gi, k) * 3, c: [0xd64545, 0x3d6fd6, 0xe8e0cc, 0x2a2a2a, 0xf2b632, 0x7cab58][(gi * 2 + k) % 6] }); });
  const ccIM = new THREE.InstancedMesh(unitBox, mat(0xffffff), Math.max(1, ccars.length * 2));
  ccars.forEach((c, i) => { ccIM.setColorAt(i * 2, C.setHex(c.c)); ccIM.setColorAt(i * 2 + 1, C.setHex(0x2b3a4c)); });
  ccIM.count = ccars.length * 2; ccIM.frustumCulled = false; scene.add(ccIM);
  const lightAt = []; // intersections that have a lamp, with their phase (same formula as the lamps themselves)
  for (const ax of AVENUES) for (const cz0 of CROSS_STREETS) for (const sz of [1, -1]) { const cz = sz * cz0; if (open(ax + 5.4, cz + 4.6 * sz) || open(ax, cz)) lightAt.push({ ax, cz, ph: (ax + cz) * 0.37 }); }
  // Cloud shadows: three huge soft dark blobs (a radial-gradient texture) drifting slowly across the city.
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const cx = cv.getContext('2d'), gr = cx.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 128, 128);
  const ctex = new THREE.CanvasTexture(cv);
  const clouds = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ctex, transparent: true, opacity: 0.16, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.scale.set(38 + i * 9, 26 + i * 6, 1); m.position.set(-60 + i * 50, 0.3, -80 + i * 70); m.renderOrder = 2;
    scene.add(m); clouds.push({ m, vx: 1.6 + i * 0.4, vz: 0.9 + i * 0.2 });
  }
  life = { crownIM, crowns, lampIM, tlLamps, vents, birds, birdIM, pigeons, pigIM, ccars, ccIM, lightAt, clouds };

  // Freeway traffic (render only, loops forever).
  const lanes = [-3.2, -1, 1, 3.2];
  const cars = [];
  for (let i = 0; i < 18; i++) cars.push({ lane: lanes[i % 4], x: -80 + hash(i, 2) * 160, v: (i % 4 < 2 ? -1 : 1) * (12 + hash(i, 3) * 8), c: [0xd64545, 0x3d6fd6, 0xe8e0cc, 0x2a2a2a, 0xf2b632][i % 5], truck: hash(i, 4) > 0.75 });
  const im = new THREE.InstancedMesh(unitBox, mat(0xffffff), cars.length);
  cars.forEach((c, i) => im.setColorAt(i, C.setHex(c.c)));
  scene.add(im);
  // Lights: 2 warm headlights at the nose, 2 red taillights at the tail of every car (one unlit instanced draw).
  const lights = new THREE.InstancedMesh(unitBox, new THREE.MeshBasicMaterial({ color: 0xffffff }), cars.length * 4);
  cars.forEach((c, i) => { for (let k = 0; k < 4; k++) lights.setColorAt(i * 4 + k, C.setHex(k < 2 ? 0xfff3c0 : 0xff2a1a)); });
  scene.add(lights);
  traffic = { im, cars, lights };
}

const _e = new THREE.Euler(), LAMP = [0x5dff7a, 0xffc23a, 0xff4a3c], OFF = 0x333333;
function updateLife(dt, S) {
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
  for (const c of life.clouds) { // drift diagonally; wrap round once fully off the map
    c.m.position.x += c.vx * dt; c.m.position.z += c.vz * dt;
    if (c.m.position.x > 100) c.m.position.x -= 200;
    if (c.m.position.z > 130) c.m.position.z -= 260;
  }
  const { ccars, ccIM, lightAt } = life;
  ccars.forEach((c, i) => {
    const x = c.g.ax + c.dir * 1.8; // keep right
    let stop = false;
    for (const L of lightAt) { if (L.ax !== c.g.ax) continue; const ahead = (L.cz - c.z) * c.dir - 4.5; if (ahead > 0 && ahead < 5 && (wt + L.ph * 9) % 9 < 3) stop = true; }
    if (S && S.squads.some((q) => Math.abs(q.x - x) < 3 && (q.z - c.z) * c.dir > 0 && (q.z - c.z) * c.dir < 6)) stop = true;
    c.v += ((stop ? 0 : c.top) - c.v) * Math.min(1, dt * (stop ? 4 : 1.2));
    c.z += c.v * c.dir * dt;
    if (c.z > c.g.z1) { c.z = c.g.z1; c.dir = -1; } else if (c.z < c.g.z0) { c.z = c.g.z0; c.dir = 1; }
    const y = walkH(x, c.z);
    Q.setFromEuler(_e.set(0, c.dir > 0 ? 0 : Math.PI, 0));
    M.compose(V.set(x, y + 0.45, c.z), Q, Sv.set(1.5, 0.7, 3)); ccIM.setMatrixAt(i * 2, M);
    M.compose(V.set(x, y + 1.0, c.z - c.dir * 0.2), Q, Sv.set(1.25, 0.45, 1.5)); ccIM.setMatrixAt(i * 2 + 1, M);
  });
  ccIM.instanceMatrix.needsUpdate = true;
  const { pigeons, pigIM } = life;
  pigeons.forEach((p, i) => {
    if (p.st === 'peck') {
      if (S && S.squads.some((q) => !q.def.flies && Math.abs(q.x - p.x) < 4.5 && Math.abs(q.z - p.z) < 4.5)) {
        const a = Math.random() * 6.28; p.st = 'fly'; p.t = 3 + Math.random() * 3; p.vx = Math.cos(a) * 5; p.vz = Math.sin(a) * 5; p.vy = 6 + Math.random() * 2;
      } else { p.t -= dt; if (p.t < 0) { p.t = 1 + Math.random() * 4; p.rot += (Math.random() - 0.5) * 2; } }
    } else if (p.st === 'fly') {
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy = Math.max(0, p.vy - 4 * dt); p.rot = Math.atan2(p.vx, p.vz);
      if ((p.t -= dt) <= 0) p.st = 'home';
    } else { // glide back down onto the home spot
      const dx = p.hx - p.x, dz = p.hz - p.z, d = Math.hypot(dx, dz);
      p.x += (dx / (d || 1)) * Math.min(d, 6 * dt); p.z += (dz / (d || 1)) * Math.min(d, 6 * dt); p.y += (0.2 - p.y) * Math.min(1, dt * (d < 3 ? 3 : 0.6)); p.rot = Math.atan2(dx, dz);
      if (d < 0.1 && p.y < 0.3) { p.st = 'peck'; p.y = 0.2; p.t = 1 + Math.random() * 3; }
    }
    const air = p.st !== 'peck', peck = !air && Math.sin(wt * 9 + i) > 0.7 ? 0.25 : 0;
    Q.setFromEuler(_e.set(peck, p.rot, 0));
    M.compose(V.set(p.x, p.y, p.z), Q, Sv.set(air ? 1.6 + Math.abs(Math.sin(wt * 18 + i)) * 1.4 : 1, 1, 1)); // airborne = wings out (wider)
    pigIM.setMatrixAt(i, M);
  });
  pigIM.instanceMatrix.needsUpdate = true;
}

let lampHeads = null, windows = null;
/** Late in the day the street lamps light up and the office windows glow warm (k 0..1). */
export function setDusk(k) {
  if (lampHeads) lampHeads.material.emissive.setRGB(1 * k, 0.85 * k, 0.45 * k);
  if (windows) windows.material.emissive.setRGB(0.5 * k, 0.36 * k, 0.12 * k);
}
// Rain: 500 thin streaks in a box that follows the camera target, each landing with a tiny splash. One draw call.
let rain = null;
let low = false;
/** LOW graphics: no rain, no pedestrians. */
export function setLowWorld(v) { low = v; if (peds) { peds.body.visible = peds.head.visible = !v; } if (v) setRain(false); }
export function setRain(on) {
  if (low) on = false;
  if (!on) { if (rain) { rain.im.visible = false; rain.on = false; } setOvercast(0); return; }
  if (!rain) {
    const N = 500, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), new THREE.MeshBasicMaterial({ color: 0xcfe2f2, transparent: true, opacity: 0.45, depthWrite: false }), N);
    im.frustumCulled = false; scene.add(im);
    rain = { im, N, drops: Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * 80, y: Math.random() * 30, z: (Math.random() - 0.5) * 80 })) };
  }
  rain.on = true; rain.im.visible = true; setOvercast(1);
}
function updateRain(dt) {
  if (!rain || !rain.on) return;
  Q.identity(); Sv.set(1, 1, 1);
  rain.drops.forEach((d, i) => {
    d.y -= dt * 22; d.x += dt * 2;
    const wx = CAM.tx + d.x, wz = CAM.tz + d.z, gy = walkH(wx, wz);
    if (d.y < gy) {
      if (i % 6 === 0) emit({ x: wx, y: gy + 0.05, z: wz, vx: (Math.random() - 0.5), vy: 1.2, vz: (Math.random() - 0.5), c: 0xdbe8f2, s: 0.08, life: 0.25, g: 9 });
      d.y = gy + 20 + Math.random() * 10; d.x = (Math.random() - 0.5) * 80; d.z = (Math.random() - 0.5) * 80;
    }
    M.compose(V.set(wx, d.y, wz), Q, Sv); rain.im.setMatrixAt(i, M);
  });
  rain.im.instanceMatrix.needsUpdate = true;
}
// Pedestrians (render only): townsfolk stroll the avenue sidewalks, turn back at the freeway trench and the map edge,
// and run the other way when a fight breaks out near them. Two instanced draws (bodies, heads).
let peds = null;
const PED_SHIRTS = [0xd64545, 0x3d6fd6, 0xf2b632, 0x7ee05b, 0xe85d9a, 0xf4f1de, 0x8a6a3e, 0x6fc3ff];
function buildPeds() {
  const list = [];
  for (const ax of AVENUES) for (const sd of [1, -1]) for (const side of [1, -1]) {
    const x = sd * ax + 5.6 * (sd > 0 ? 1 : -1) * (side > 0 ? 1 : 0.88), z = side * (12 + Math.random() * 40);
    list.push({ x, z, dir: Math.random() < 0.5 ? 1 : -1, v: 1 + Math.random() * 0.6, run: 0, ph: Math.random() * 6 });
  }
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.8, 0.28), mat(0xffffff), list.length);
  const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat(0xe0b48c), list.length);
  list.forEach((p, i) => body.setColorAt(i, C.setHex(PED_SHIRTS[i % PED_SHIRTS.length])));
  scene.add(body, head);
  peds = { list, body, head };
}
function updatePeds(dt, S) {
  if (!peds) { buildPeds(); peds.body.visible = peds.head.visible = !low; }
  if (low) return;
  const fights = S ? S.squads.filter((q) => q.slot !== 'worker' && S.squads.some((o) => o.owner !== q.owner && Math.abs(o.x - q.x) < 9 && Math.abs(o.z - q.z) < 9)) : [];
  peds.list.forEach((p, i) => {
    const f = fights.find((q) => Math.abs(q.x - p.x) < 14 && Math.abs(q.z - p.z) < 14);
    if (f) { p.dir = Math.sign(p.z - f.z) || 1; p.run = 2.5; }
    p.run = Math.max(0, p.run - dt);
    const sp = p.run > 0 ? 5 : p.v;
    p.z += p.dir * sp * dt;
    const az = Math.abs(p.z);
    if (az < TRENCH.half + 3 || az > HOME_Z - 2) { p.dir = -p.dir; p.z = Math.sign(p.z) * Math.min(HOME_Z - 2, Math.max(TRENCH.half + 3, az)); }
    p.ph += dt * sp * 3;
    const y = walkH(p.x, p.z), bob = Math.abs(Math.sin(p.ph)) * (p.run > 0 ? 0.16 : 0.06);
    Q.setFromAxisAngle(V.set(0, 1, 0), p.dir > 0 ? 0 : Math.PI);
    M.compose(V.set(p.x, y + 0.65 + bob, p.z), Q, Sv.set(1, 1, 1)); peds.body.setMatrixAt(i, M);
    M.compose(V.set(p.x, y + 1.25 + bob, p.z), Q, Sv); peds.head.setMatrixAt(i, M);
  });
  peds.body.instanceMatrix.needsUpdate = true; peds.head.instanceMatrix.needsUpdate = true;
}
export function updateWorld(dt, S) {
  updateRain(dt);
  updatePeds(dt, S);
  updateLife(dt, S);
  if (!traffic) return;
  const { im, cars, lights } = traffic;
  // Which overpasses have troops on them right now? Cars passing underneath honk: a bounce and a little yellow toot.
  const busy = OVERPASSES.map(([a, b]) => !!(S && S.squads.some((q) => !q.def.flies && Math.abs(q.z) < TRENCH.half + 1 && q.x > a - 1 && q.x < b + 1)));
  cars.forEach((c, i) => {
    c.x += c.v * dt;
    if (c.x > 80) c.x -= 160;
    if (c.x < -80) c.x += 160;
    const under = OVERPASSES.findIndex(([a, b]) => c.x > a - 2 && c.x < b + 2);
    if (under >= 0 && busy[under] && !(c.hop > 0) && !c.honked) { c.hop = 0.45; c.honked = true; for (let k = 0; k < 3; k++) emit({ x: c.x + Math.sign(c.v) * 2, y: -TRENCH.depth + 2, z: c.lane, vx: Math.sign(c.v) * 2 + (Math.random() - 0.5), vy: 2 + Math.random(), vz: (Math.random() - 0.5) * 2, c: 0xffe14d, s: 0.25, life: 0.5, g: 2 }); }
    if (under < 0) c.honked = false;
    const hop = c.hop > 0 ? Math.sin((c.hop / 0.45) * Math.PI) * 0.5 : 0; if (c.hop > 0) c.hop -= dt;
    const h = c.truck ? 2.2 : 1.1, L = c.truck ? 7 : 3.8, y = -TRENCH.depth + h / 2 + hop, dir = Math.sign(c.v);
    Q.identity();
    M.compose(V.set(c.x, y, c.lane), Q, Sv.set(L, h, 1.8));
    im.setMatrixAt(i, M);
    for (let k = 0; k < 4; k++) {
      const front = k < 2, side = k % 2 ? 0.6 : -0.6;
      M.compose(V.set(c.x + dir * (front ? 1 : -1) * (L / 2 + 0.03), y - h * 0.15, c.lane + side), Q, Sv.set(0.08, 0.22, 0.42));
      lights.setMatrixAt(i * 4 + k, M);
    }
  });
  im.instanceMatrix.needsUpdate = true;
  lights.instanceMatrix.needsUpdate = true;
}

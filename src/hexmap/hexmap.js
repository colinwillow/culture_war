// Hex city prototype (Colin, Oct 22 2026): a board of hexagonal DISTRICTS with SQUARE streets inside them.
// Flat-top hexes. Each hex has one vertical street through its top and bottom edge midpoints and two horizontal
// avenues at +-h/2, which leave through the midpoints of the four slanted edges. Avenues line up across neighbours and
// run straight across the whole board; vertical streets only continue through hexes in the same column, so crossing
// columns means a jog: the bends and chokepoints fall out of the hex structure itself, and every block is still square.
// The hex decides the ZONING (downtown, shops, houses, industrial, park, water); the grid decides the streets.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { svg } from '../ui/icons.js?v=193';

const R = 12, H = R * Math.sqrt(3) / 2, RW = 2.4, RINGS = 3;    // circumradius, half-height, road width, board radius in hexes
const ZONE = { downtown: 0x8c93a3, shops: 0xb59a7c, houses: 0xa9b57c, industrial: 0x9a8a7a, park: 0x6fa65a, water: 0x3f8fb0, plaza: 0xc9b08a };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
let rng = mulberry(7);

// ---------------------------------------------------------------- three
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa9c8de); scene.fog = new THREE.Fog(0xa9c8de, 120, 260);
const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 600);
scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x4a3c2c, 1.1));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2); sun.position.set(40, 70, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 220 }); scene.add(sun);
const world = new THREE.Group(); scene.add(world);
const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 48), new THREE.MeshStandardMaterial({ color: 0x5d6a54, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);

// ---------------------------------------------------------------- the board
// axial hex coords (q, r) -> world (x, z); flat-top: x = 1.5 R q, z = H (2 r + q)
const hexAt = (q, r) => [1.5 * R * q, H * (2 * r + q)];
function zoneFor(q, r, ring) { // rings out from the centre: downtown core, shops, houses + industry, then the edges
  const u = rng();
  if (ring === 0) return 'downtown';
  if (ring === 1) return u < 0.5 ? 'downtown' : u < 0.85 ? 'shops' : 'plaza';
  if (ring === 2) return u < 0.35 ? 'houses' : u < 0.6 ? 'shops' : u < 0.8 ? 'industrial' : 'park';
  return u < 0.4 ? 'houses' : u < 0.55 ? 'industrial' : u < 0.75 ? 'park' : 'water';
}
function hexShape(inset = 0) { const s = new THREE.Shape(); for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i, x = Math.cos(a) * (R - inset), y = Math.sin(a) * (R - inset); i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath(); return s; }
const halfWidthAt = (y) => R * (1 - Math.abs(y) / (2 * H)); // a flat-top hex's half width at height y (|y| <= H)

function build() {
  while (world.children.length) { const o = world.children.pop(); o.traverse((m) => { if (m.geometry) m.geometry.dispose(); }); }
  const tiles = {}, roads = [], blocks = [], boxes = [], trees = [], waters = [];
  for (let q = -RINGS; q <= RINGS; q++) for (let r = Math.max(-RINGS, -q - RINGS); r <= Math.min(RINGS, -q + RINGS); r++) {
    const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)), zone = zoneFor(q, r, ring), [cx, cz] = hexAt(q, r);
    (tiles[zone] = tiles[zone] || []).push(new THREE.ShapeGeometry(hexShape(0.25)).rotateX(-Math.PI / 2).translate(cx, 0, cz));
    if (zone === 'water') { waters.push(new THREE.ShapeGeometry(hexShape(1.2)).rotateX(-Math.PI / 2).translate(cx, 0.06, cz)); continue; }
    // STREETS: vertical through the N/S edge midpoints; avenues at +-H/2 out through the slanted edges' midpoints
    roads.push(new THREE.PlaneGeometry(RW, 2 * H).rotateX(-Math.PI / 2).translate(cx, 0.03, cz));
    for (const s of [-1, 1]) roads.push(new THREE.PlaneGeometry(2 * halfWidthAt(H / 2), RW).rotateX(-Math.PI / 2).translate(cx, 0.03, cz + s * H / 2));
    // BLOCKS: the six rectangles the streets leave, clipped to the hex (each row's width = the hex's width at its far edge)
    const rows = [[-H + 0.6, -H / 2 - RW / 2], [-H / 2 + RW / 2, H / 2 - RW / 2], [H / 2 + RW / 2, H - 0.6]];
    for (const [z0, z1] of rows) for (const side of [-1, 1]) {
      const far = Math.max(Math.abs(z0), Math.abs(z1)), w = halfWidthAt(far) - RW / 2 - 0.6, x0 = side * (RW / 2 + 0.3), x1 = side * (RW / 2 + 0.3 + w);
      const bx = Math.min(x0, x1) + 0.3, bw = Math.abs(x1 - x0) - 0.6, bz = z0 + 0.3, bd = z1 - z0 - 0.6;
      if (bw < 2 || bd < 2) continue;
      blocks.push(new THREE.PlaneGeometry(bw, bd).rotateX(-Math.PI / 2).translate(cx + bx + bw / 2, 0.02, cz + bz + bd / 2));
      fill(zone, cx + bx, cz + bz, bw, bd, boxes, trees);
    }
  }
  const add = (geos, color, extra = {}) => { if (!geos.length) return; const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra })); m.receiveShadow = true; world.add(m); };
  for (const z in tiles) add(tiles[z], ZONE[z]);
  add(roads, 0x3c3f47); add(blocks, 0x7d7368);
  add(waters, 0x2e7fa3, { roughness: 0.3, metalness: 0.1 });
  // buildings: one instanced box; trees: one instanced cone + trunk
  const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.9 }), Math.max(1, boxes.length));
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
  boxes.forEach((b, i) => { M.compose(P.set(b.x, 0, b.z), Q, S.set(b.w, b.h, b.d)); bm.setMatrixAt(i, M); bm.setColorAt(i, new THREE.Color(b.c)); });
  bm.castShadow = bm.receiveShadow = true; bm.count = boxes.length; world.add(bm);
  const tm = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x3f7f3a, roughness: 1 }), Math.max(1, trees.length));
  trees.forEach((t, i) => { M.compose(P.set(t.x, 0.3, t.z), Q, S.set(t.r, t.h, t.r)); tm.setMatrixAt(i, M); });
  tm.castShadow = true; tm.count = trees.length; world.add(tm);
  // hex borders: a faint outline so the districts read
  const edges = []; for (let q = -RINGS; q <= RINGS; q++) for (let r = Math.max(-RINGS, -q - RINGS); r <= Math.min(RINGS, -q + RINGS); r++) { const [cx, cz] = hexAt(q, r); for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i, b = a + Math.PI / 3; edges.push(cx + Math.cos(a) * R, 0.08, cz + Math.sin(a) * R, cx + Math.cos(b) * R, 0.08, cz + Math.sin(b) * R); } }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(edges, 3)); world.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2d35, transparent: true, opacity: 0.55 })));
  window.hex = { boxes: boxes.length, trees: trees.length, hexes: 3 * RINGS * (RINGS + 1) + 1 };
}
// what stands on a block, by zone: the SILHOUETTE varies (towers, slabs, little houses, sheds, trees) so districts read from the air
function fill(zone, x, z, w, d, boxes, trees) {
  const pal = { downtown: [0x6d7fa3, 0x8893ad, 0x5a6a8a, 0xa8b0c4], shops: [0xd9a05b, 0xc96a4b, 0xe0c27a, 0xb07a5a], houses: [0xd8c7a6, 0xc4a58a, 0xe8d8b8, 0xb89a7c], industrial: [0x8a8a86, 0x6f6a62, 0xa39b8c], plaza: [], park: [] }[zone] || [];
  if (zone === 'park' || zone === 'plaza') { const n = zone === 'park' ? 2 + (rng() * 5) | 0 : (rng() * 2) | 0; for (let i = 0; i < n; i++) trees.push({ x: x + 0.8 + rng() * (w - 1.6), z: z + 0.8 + rng() * (d - 1.6), r: 1.2 + rng() * 1.2, h: 3 + rng() * 3 }); return; }
  if (zone === 'downtown') { // one or two tall towers with a stepped silhouette, filling most of the block
    const n = w > 7 && rng() < 0.6 ? 2 : 1, cw = (w - 1 - (n - 1)) / n;
    for (let i = 0; i < n; i++) { const h = 12 + rng() * 20, c = pal[(rng() * pal.length) | 0], bx = x + 0.5 + i * (cw + 1);
      boxes.push({ x: bx + cw / 2, z: z + d / 2, w: cw, d: d - 1, h: h * 0.6, c }); boxes.push({ x: bx + cw / 2, z: z + d / 2, w: cw * 0.7, d: (d - 1) * 0.7, h, c }); }
    return;
  }
  // shops: a row of mid boxes along the street; houses: small boxes with gaps; industrial: one long low shed + a tank
  const cell = zone === 'houses' ? 3.2 : zone === 'shops' ? 3.6 : w, nx = Math.max(1, Math.floor(w / cell)), nz = zone === 'industrial' ? 1 : Math.max(1, Math.floor(d / cell));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    if (zone === 'houses' && rng() < 0.25) continue;
    const cw = w / nx, cd = d / nz, h = zone === 'shops' ? 4 + rng() * 5 : zone === 'houses' ? 2.5 + rng() * 2.5 : 5 + rng() * 5;
    boxes.push({ x: x + i * cw + cw / 2, z: z + j * cd + cd / 2, w: cw - 0.8, d: cd - 0.8, h, c: pal[(rng() * pal.length) | 0] });
    if (zone === 'industrial' && rng() < 0.5) boxes.push({ x: x + 1.5 + rng() * (w - 3), z: z + d / 2, w: 1.6, d: 1.6, h: 9 + rng() * 4, c: 0xb0b0b0 });
  }
}

// ---------------------------------------------------------------- camera: pan, orbit, pinch; globe look
const view = { x: 0, z: 0, d: 110, yaw: 0.4, globe: false };
let drag = null; const pts = new Map();
const pinchD = () => { const v = [...pts.values()]; return v.length >= 2 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0; };
canvas.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, vx: view.x, vz: view.z, d: view.d, pd: pinchD(), yaw: view.yaw }; });
canvas.addEventListener('pointermove', (e) => {
  if (!pts.has(e.pointerId) || !drag) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
  if (pts.size >= 2 && drag.pd) { view.d = Math.min(260, Math.max(30, drag.d * drag.pd / pinchD())); return; }
  const k = view.d / innerHeight * 1.6, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k, s = Math.sin(view.yaw), c = Math.cos(view.yaw);
  view.x = drag.vx - (dx * c - dy * s); view.z = drag.vz - (dx * s + dy * c);
});
const lift = (e) => { pts.delete(e.pointerId); if (!pts.size) drag = null; };
canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
canvas.addEventListener('wheel', (e) => { view.d = Math.min(260, Math.max(30, view.d * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: true });
function applyCam() {
  const pitch = 0.55 + 0.5 * Math.min(1, view.d / 200), hh = view.d * Math.cos(pitch), v = view.d * Math.sin(pitch);
  camera.position.set(view.x + Math.sin(view.yaw) * hh, v, view.z + Math.cos(view.yaw) * hh); camera.lookAt(view.x, 0, view.z);
  GLOBE.u.x = view.x; GLOBE.u.y = view.z;
}
// the little-planet bend from the RTS (B153): vertices drop by d^2/2R from the view focus; render only
const GLOBE = { u: { x: 0, y: 0, z: 0 }, R: 140 };
THREE.ShaderChunk.common = 'uniform vec3 cwGlobe;\n' + THREE.ShaderChunk.common;
THREE.ShaderChunk.project_vertex = THREE.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;', 'vec4 cwW = modelMatrix * mvPosition; vec2 cwD = cwW.xz - cwGlobe.xy; cwW.y -= dot( cwD, cwD ) * cwGlobe.z; mvPosition = viewMatrix * cwW;');
for (const k in THREE.ShaderLib) THREE.ShaderLib[k].uniforms.cwGlobe = { value: GLOBE.u };

// ---------------------------------------------------------------- UI
document.querySelectorAll('[data-i]').forEach((el) => (el.outerHTML = svg(el.dataset.i)));
const tap = (id, fn) => document.getElementById(id).addEventListener('pointerup', (e) => { e.stopPropagation(); fn(); });
tap('home', () => { location.href = './'; });
tap('seed', () => { rng = mulberry((Math.random() * 1e9) | 0); build(); });
tap('globe', () => { view.globe = !view.globe; GLOBE.u.z = view.globe ? 1 / (2 * GLOBE.R) : 0; document.getElementById('globe').classList.toggle('on', view.globe); });
tap('view', () => { view.x = 0; view.z = 0; view.d = 110; view.yaw = 0.4; });
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 60 : 45; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
build(); document.getElementById('load').remove();
(function frame() { requestAnimationFrame(frame); applyCam(); sun.position.set(view.x + 40, 70, view.z + 30); sun.target.position.set(view.x, 0, view.z); sun.target.updateMatrixWorld(); renderer.render(scene, camera); })();

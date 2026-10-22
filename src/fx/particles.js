// Pooled particles: ONE InstancedMesh (one draw call) for every spark, dust puff, flash and coin chip.
// The old fx.js effects build a mesh + geometry + material per bit, which is fine for a ring but not for a battle.
// A particle fades by shrinking (instanced opacity would need a custom shader), which reads fine at RTS distance.
import { THREE, scene } from '../render/scene.js?v=194';

const MAX = 900;
const geo = new THREE.BoxGeometry(1, 1, 1);
const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
mesh.frustumCulled = false;
mesh.count = 0;
scene.add(mesh);

// struct-of-arrays so the per-frame loop allocates nothing
const px = new Float32Array(MAX), py = new Float32Array(MAX), pz = new Float32Array(MAX);
const vx = new Float32Array(MAX), vy = new Float32Array(MAX), vz = new Float32Array(MAX);
const sz = new Float32Array(MAX), life = new Float32Array(MAX), age = new Float32Array(MAX);
const grav = new Float32Array(MAX), drag = new Float32Array(MAX), floor = new Float32Array(MAX), grow = new Float32Array(MAX), spin = new Float32Array(MAX);
let n = 0;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

/** One particle. o: { x,y,z, vx,vy,vz, c, s(size m), life(s), g(gravity), drag(1/s), floor(y), grow(size x at death) } */
export function emit(o) {
  let i;
  if (n < MAX) i = n++;
  else { i = (Math.random() * MAX) | 0; } // full: overwrite a random one rather than drop the new effect
  px[i] = o.x; py[i] = o.y; pz[i] = o.z;
  vx[i] = o.vx || 0; vy[i] = o.vy || 0; vz[i] = o.vz || 0;
  sz[i] = o.s || 0.2; life[i] = o.life || 0.6; age[i] = 0;
  grav[i] = o.g === undefined ? 14 : o.g; drag[i] = o.drag || 0; floor[i] = o.floor === undefined ? -1e9 : o.floor;
  grow[i] = o.grow || 0; spin[i] = (Math.random() - 0.5) * 12;
  mesh.setColorAt(i, _c.setHex(o.c === undefined ? 0xffffff : o.c));
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function kill(i) {
  const j = --n;
  if (i === j) return;
  px[i] = px[j]; py[i] = py[j]; pz[i] = pz[j]; vx[i] = vx[j]; vy[i] = vy[j]; vz[i] = vz[j];
  sz[i] = sz[j]; life[i] = life[j]; age[i] = age[j]; grav[i] = grav[j]; drag[i] = drag[j]; floor[i] = floor[j]; grow[i] = grow[j]; spin[i] = spin[j];
  mesh.getColorAt(j, _c); mesh.setColorAt(i, _c);
}

export function updateParticles(dt) {
  for (let i = n - 1; i >= 0; i--) {
    age[i] += dt;
    if (age[i] >= life[i]) { kill(i); continue; }
    const d = Math.exp(-drag[i] * dt);
    vx[i] *= d; vz[i] *= d; vy[i] = vy[i] * d - grav[i] * dt;
    px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt;
    if (py[i] < floor[i]) { py[i] = floor[i]; vy[i] *= -0.3; vx[i] *= 0.5; vz[i] *= 0.5; }
  }
  for (let i = 0; i < n; i++) {
    const k = age[i] / life[i];
    const s = sz[i] * (grow[i] ? 1 + (grow[i] - 1) * k : 1) * (1 - k * k);
    _e.set(age[i] * spin[i], age[i] * spin[i] * 0.7, 0); _q.setFromEuler(_e);
    _m.compose(_p.set(px[i], py[i], pz[i]), _q, _s.set(s, s, s));
    mesh.setMatrixAt(i, _m);
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
export function clearParticles() { n = 0; mesh.count = 0; }

const R = (a) => (Math.random() - 0.5) * a;

/** Melee impact: hot sparks + a kick of dust at the target's feet. */
export function burstHit(x, y, z, g0, c = 0xffe14d) {
  for (let i = 0; i < 6; i++) emit({ x, y, z, vx: R(7), vy: 2 + Math.random() * 4, vz: R(7), c: i % 3 ? c : 0xffffff, s: 0.12, life: 0.35 + Math.random() * 0.2, g: 18, floor: g0 + 0.05 });
  for (let i = 0; i < 4; i++) emit({ x: x + R(0.8), y: g0 + 0.15, z: z + R(0.8), vx: R(2), vy: 0.8 + Math.random(), vz: R(2), c: 0xc9b48a, s: 0.35, life: 0.6, g: -0.5, drag: 3, grow: 2.2 });
}
/** Gun: a flash at the muzzle and one fast bright slug down the line to the target. */
export function burstShot(x, y, z, tx, ty, tz, c = 0xfff2a8) {
  const dx = tx - x, dy = ty - y, dz = tz - z, L = Math.hypot(dx, dy, dz) || 1, ux = dx / L, uy = dy / L, uz = dz / L;
  const mx = x + ux * 0.7, my = y + uy * 0.7, mz = z + uz * 0.7;
  emit({ x: mx, y: my, z: mz, c: 0xffffff, s: 0.45, life: 0.07, g: 0 });
  for (let i = 0; i < 4; i++) emit({ x: mx, y: my, z: mz, vx: ux * 6 + R(3), vy: uy * 6 + R(3), vz: uz * 6 + R(3), c: 0xffb43c, s: 0.14, life: 0.12, g: 0 });
  const sp = 70;
  emit({ x: mx, y: my, z: mz, vx: ux * sp, vy: uy * sp, vz: uz * sp, c, s: 0.16, life: Math.max(0.03, (L - 0.7) / sp), g: 0 });
  for (let i = 0; i < 3; i++) emit({ x: tx, y: ty, z: tz, vx: R(4) - ux * 2, vy: 1 + Math.random() * 3, vz: R(4) - uz * 2, c: 0xffe14d, s: 0.1, life: 0.25, g: 16 });
}
/** Cash landing: gold chips fountain up and rain down. */
export function burstCoins(x, y, z, g0) {
  for (let i = 0; i < 9; i++) emit({ x, y, z, vx: R(4), vy: 5 + Math.random() * 4, vz: R(4), c: i % 4 ? 0xf5b83a : 0xfff2a8, s: 0.2, life: 1, g: 16, floor: g0 + 0.1 });
}

// GROUND CLUTTER (B249, Colin's RTS references: Northgard / AoE Mobile -- organic ground, rocks, bushes, trees, tufts).
// The geometry worker's batch 10 pieces (models/gen/e_*.glb, one mesh each, origin on the ground) scattered as ONE
// InstancedMesh per piece: a forest ring round the playable map, rocks and bushes on the lawn edges, tufts everywhere
// grass is. Seeded, so the same every match. Render only: the sim never sees any of it.
import { THREE, scene } from './scene.js?v=249';
import { BLOCKS, BASES, HOME_Z, walkH } from '../map/layout.js?v=249';

const rnd = ((a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; })(1234);
const R = (a, b) => a + rnd() * (b - a);
const PLAY = { x: 62, z: 102 }; // the playable rectangle (sim clamps squads to +-58 / +-98)
const outer = () => { for (;;) { const x = R(-150, 150), z = R(-190, 190); if (Math.abs(x) > PLAY.x || Math.abs(z) > PLAY.z) return [x, z]; } };
const nearBase = (x, z, r) => BASES.some((b) => Math.hypot(x - b.x, z - b.z) < r);
const lawn = () => { for (let k = 0; k < 40; k++) { const x = R(-58, 58), s = rnd() < 0.5 ? 1 : -1, z = s * R(HOME_Z + 2, 98); if (!nearBase(x, z, 26)) return [x, z]; } return outer(); };
const lawnEdge = () => { for (let k = 0; k < 40; k++) { const s = rnd() < 0.5 ? 1 : -1, x = s * R(46, 60), z = (rnd() < 0.5 ? 1 : -1) * R(HOME_Z + 2, 100); if (!nearBase(x, z, 26)) return [x, z]; } return outer(); };
const park = () => { const ps = BLOCKS.filter((b) => b.kind === 'park'); if (!ps.length) return lawn(); const b = ps[Math.floor(rnd() * ps.length)]; return [R(b.x0 + 1, b.x1 - 1), R(b.z0 + 1, b.z1 - 1)]; };
const parkEdge = () => { const ps = BLOCKS.filter((b) => b.kind === 'park'); if (!ps.length) return lawnEdge(); const b = ps[Math.floor(rnd() * ps.length)], t = rnd(), side = Math.floor(rnd() * 4);
  return side === 0 ? [b.x0 + 1, b.z0 + t * (b.z1 - b.z0)] : side === 1 ? [b.x1 - 1, b.z0 + t * (b.z1 - b.z0)] : side === 2 ? [b.x0 + t * (b.x1 - b.x0), b.z0 + 1] : [b.x0 + t * (b.x1 - b.x0), b.z1 - 1]; };

// piece -> how many, where, size range
const PLAN = [
  ['e_tree_a', 70, outer, [0.9, 1.4]], ['e_tree_b', 90, outer, [0.9, 1.5]], ['e_tree_c', 20, outer, [0.9, 1.2]],
  ['e_tree_a', 14, parkEdge, [0.7, 1]], ['e_tree_b', 8, lawnEdge, [0.8, 1.1]],
  ['e_rock_a', 50, outer, [0.8, 1.6]], ['e_rock_b', 30, outer, [0.8, 1.4]], ['e_rock_c', 16, outer, [0.8, 1.3]],
  ['e_rock_a', 14, lawnEdge, [0.6, 1.1]], ['e_rock_b', 6, lawnEdge, [0.6, 1]],
  ['e_bush_a', 70, outer, [0.8, 1.4]], ['e_bush_b', 50, outer, [0.8, 1.3]], ['e_bush_a', 24, parkEdge, [0.7, 1]], ['e_bush_b', 14, lawnEdge, [0.7, 1]],
  ['e_grass_tuft', 900, lawn, [1.2, 2.2]], ['e_grass_tuft', 500, outer, [1.4, 2.6]], ['e_grass_tuft', 160, park, [1.2, 2]],
];

export async function buildClutter(loader) {
  const names = [...new Set(PLAN.map((p) => p[0]))], src = {};
  await Promise.all(names.map((n) => loader.loadAsync('./models/gen/' + n + '.glb').then((g) => { let m = null; g.scene.traverse((o) => { if (!m && o.isMesh) m = o; }); if (m) { m.updateWorldMatrix(true, false); src[n] = m; } }).catch(() => {})));
  const lists = {};
  for (const [n, count, where, [s0, s1]] of PLAN) { if (!src[n]) continue; (lists[n] = lists[n] || []); for (let i = 0; i < count; i++) { const [x, z] = where(); lists[n].push([x, z, R(s0, s1), R(0, 6.283)]); } }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const n in lists) {
    const m = src[n], L = lists[n], geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const im = new THREE.InstancedMesh(geo, m.material, L.length);
    L.forEach(([x, z, s, r], i) => { Q.setFromAxisAngle(up, r); M.compose(V.set(x, Math.abs(x) > 60 || Math.abs(z) > 100 ? -0.2 : walkH(x, z), z), Q, S.setScalar(s)); im.setMatrixAt(i, M); });
    im.castShadow = !n.includes('tuft'); im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
  }
}

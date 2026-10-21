// Placeholder unit / building / business models.
// SWAP POINT FOR REAL ART: replace makeMember / bldMesh / nodeMesh bodies with GLB clones.
// Keep the same contract: return a THREE.Group, feet at y=0, facing +z, roughly to the scale below
// (humans ~1.6 m, monster truck ~3 m long). userData.legs (optional) = [leftLeg, rightLeg] for walk swing.
import { THREE, box, cyl, mat } from './scene.js?v=27';

export const FC = {
  bw: { main: 0xe8792b, dark: 0x5a3a22, skin: 0xf2c9a0, alt: 0x3d5a80, hair: 0x4a2e1a },
  ac: { main: 0x2cc2ad, dark: 0x1c4f57, skin: 0xe8b892, alt: 0xe85d9a, hair: 0x2a2a2a },
};

function humanoid(C, shirt, hat) {
  const g = new THREE.Group();
  const l = box(0.16, 0.5, 0.18, C.dark, -0.12, 0.25, 0), r = box(0.16, 0.5, 0.18, C.dark, 0.12, 0.25, 0);
  g.add(l, r, box(0.46, 0.6, 0.3, shirt, 0, 0.8, 0), box(0.32, 0.32, 0.32, C.skin, 0, 1.28, 0), box(0.34, 0.1, 0.34, hat || C.hair, 0, 1.48, 0),
    box(0.12, 0.5, 0.14, C.skin, 0.3, 0.78, 0), box(0.12, 0.5, 0.14, C.skin, -0.3, 0.78, 0));
  g.userData.legs = [l, r];
  g.userData.head = g.children[3]; g.userData.hat = g.children[4]; g.userData.arms = [g.children[5], g.children[6]];
  return g;
}
// A wheel spins about its axle via rotation.x (sync.js); the hub bar is what makes the spin readable.
function wheel(r, w, x, y, z, c = 0x222222) {
  const m = cyl(r, r, w, c, x, y, z, 14); m.rotation.z = Math.PI / 2;
  if (r > 0.25) m.add(box(r * 1.7, w * 1.08, r * 0.28, 0xb8b8b8));
  return m;
}
const tagWheels = (g) => { g.userData.wheels = g.children.filter((c) => c.geometry && c.geometry.type === 'CylinderGeometry' && Math.abs(c.rotation.z - Math.PI / 2) < 1e-6); return g; };

/** One member of a squad (a squad of 5 farmers = 5 of these). */
export function makeMember(f, slot) {
  const C = FC[f];
  let g;
  if (f === 'bw') {
    if (slot === 'worker') { g = humanoid(C, 0x7a6a4a, 0x8a1f1f); g.add(box(0.7, 0.35, 0.6, 0x7a7a7a, 0, 0.45, 0.6), wheel(0.22, 0.1, 0, 0.22, 0.95), box(0.05, 0.05, 0.7, 0x5a3d26, 0.25, 0.55, 0.25), box(0.05, 0.05, 0.7, 0x5a3d26, -0.25, 0.55, 0.25)); }
    else if (slot === 'pike') { g = humanoid(C, 0x3d5a80, 0x6b4a2a); g.add(box(0.06, 1.9, 0.06, C.dark, 0.34, 1, 0.1), box(0.34, 0.07, 0.07, 0xcccccc, 0.34, 1.95, 0.1)); }
    else if (slot === 'melee') { g = humanoid(C, C.main, 0xc62f2f); g.children[2].scale.set(1.3, 1.1, 1.2); }
    else if (slot === 'ranged') { g = humanoid(C, 0x6b7a3a, 0xf28b2c); g.add(box(0.08, 0.08, 1, 0x333333, 0.32, 0.95, 0.45)); }
    else if (slot === 'cav') {
      g = new THREE.Group();
      const body = new THREE.Group(); // rides the suspension (sync.js bobs + pitches it)
      body.add(box(1.8, 0.75, 2.6, C.main, 0, 1.7), box(1.3, 0.6, 1.2, C.dark, 0, 2.35, -0.2), box(0.2, 0.2, 0.9, 0xdddddd, -0.6, 1.45, 1.35), box(0.2, 0.2, 0.9, 0xdddddd, 0.6, 1.45, 1.35));
      for (const x of [-0.95, 0.95]) for (const z of [0.9, -0.9]) body.add(box(0.12, 0.7, 0.12, 0x888888, x * 0.8, 1.15, z)); // shocks
      g.add(body); g.userData.chassis = body; g.userData.dust = 1.2;
      for (const [x, z] of [[1, 0.9], [-1, 0.9], [1, -0.9], [-1, -0.9]]) g.add(wheel(0.8, 0.55, x, 0.8, z));
      tagWheels(g);
    } else if (slot === 'siege') {
      g = new THREE.Group();
      g.add(box(1.5, 0.5, 1.9, C.dark, 0, 0.45));
      for (const [x, z] of [[0.75, 0.7], [-0.75, 0.7], [0.75, -0.7], [-0.75, -0.7]]) g.add(wheel(0.3, 0.2, x, 0.3, z));
      tagWheels(g); g.userData.dust = 0.6;
      for (let i = -1; i <= 1; i++) { const t = cyl(0.17, 0.17, 1.4, i === 0 ? 0xd63c3c : 0x3d6fd6, i * 0.38, 1.1, 0.1, 8); t.rotation.x = -0.6; g.add(t); }
    } else {
      // Bald eagle: body, white head, beak, tail, talons, and two wings on shoulder pivots (sync.js flaps them).
      g = new THREE.Group();
      const bird = new THREE.Group(); g.add(bird);
      bird.add(box(0.6, 0.5, 1.2, 0x5a3a22), box(0.42, 0.42, 0.42, 0xffffff, 0, 0.22, 0.72), box(0.15, 0.12, 0.3, 0xf5b83a, 0, 0.16, 1.03),
        box(0.5, 0.08, 0.55, 0xffffff, 0, 0.05, -0.8), box(0.08, 0.08, 0.08, 0x111111, 0.12, 0.3, 0.92), box(0.08, 0.08, 0.08, 0x111111, -0.12, 0.3, 0.92));
      const talons = new THREE.Group(); talons.position.set(0, -0.3, 0.1);
      for (const x of [-0.15, 0.15]) talons.add(box(0.1, 0.3, 0.1, 0xf5b83a, x, 0, 0), box(0.2, 0.06, 0.25, 0xf5b83a, x, -0.15, 0.08));
      bird.add(talons);
      const wings = [];
      for (const sd of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(sd * 0.3, 0.12, 0);
        piv.add(box(1.4, 0.08, 0.8, 0x4a2e1a, sd * 0.7, 0, 0), box(0.6, 0.06, 0.6, 0x3a2416, sd * 1.6, 0, -0.1));
        bird.add(piv); wings.push(piv);
      }
      g.userData.eagle = { bird, wings, talons };
    }
  } else {
    if (slot === 'worker') { g = humanoid(C, 0xf4f1de, C.hair); g.add(box(0.4, 0.5, 0.4, C.alt, 0, 0.5, 0.5), box(0.42, 0.06, 0.42, 0x222222, 0, 0.78, 0.5)); }
    else if (slot === 'pike') { g = humanoid(C, C.main, C.hair); g.add(box(0.05, 1.5, 0.05, 0xcccccc, 0.3, 1.1, 0), box(0.8, 0.55, 0.05, 0xf4f1de, 0.3, 1.95, 0)); }
    else if (slot === 'melee') { g = humanoid(C, C.main, C.alt); }
    else if (slot === 'ranged') { g = humanoid(C, C.dark, C.hair); const m = cyl(0.08, 0.26, 0.5, C.alt, 0.3, 1.05, 0.4, 10); m.rotation.x = Math.PI / 2; g.add(m); }
    else if (slot === 'cav') { g = humanoid(C, C.main, C.hair); g.position.y = 0.35; g.add(box(0.1, 0.45, 1.2, 0x333333, 0, 0.1, 0)); for (const z of [0.5, -0.5]) g.add(wheel(0.33, 0.08, 0, -0.02, z, 0x111111)); tagWheels(g); g.userData.pedal = true; }
    else if (slot === 'siege') {
      g = new THREE.Group();
      g.add(box(1, 2.3, 0.8, C.alt, 0, 1.35));
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), mat(0xf4f1de)); h.position.y = 3.2; g.add(h);
      g.add(box(0.25, 1.8, 0.25, C.alt, 0.8, 1.7), box(0.25, 1.8, 0.25, C.alt, -0.8, 1.7), box(0.2, 0.2, 0.2, 0x222222, -0.25, 3.3, 0.7), box(0.2, 0.2, 0.2, 0x222222, 0.25, 3.3, 0.7));
    } else {
      // March leader: bullhorn on a raisable right arm (sync.js lifts it to the mouth when he shouts).
      g = humanoid(C, C.dark, C.alt); g.children[2].scale.set(1.15, 1.2, 1.15);
      const arm = new THREE.Group(); arm.position.set(0.3, 1.03, 0); g.children[5].position.set(0, -0.25, 0); arm.add(g.children[5]);
      const horn = cyl(0.1, 0.4, 0.65, 0xf5b83a, 0, -0.45, 0.35, 10); horn.rotation.x = Math.PI / 2; arm.add(horn);
      g.add(arm); g.userData.horn = arm;
    }
  }
  return g;
}

/** Building mesh, front facing +z. userData.coin = spinning coin (depots). */
export function bldMesh(kind, f) {
  const mesh = new THREE.Group(), C = FC[f];
  if (kind === 'hq') {
    if (f === 'bw') mesh.add(box(5.4, 3.2, 5.4, 0x9c3b2b, 0, 1.6), box(5.9, 0.5, 5.9, 0xe8e0cc, 0, 3.4), box(2.2, 4.4, 2.2, 0x9c3b2b, 2, 2.2, -2), box(1.5, 1.5, 0.1, 0x3a2416, 0, 1, 2.72), box(6.5, 0.3, 1.6, 0xc9b98a, 0, 0.15, 3.6));
    else mesh.add(box(6, 2.8, 5, 0x2a6f75, 0, 1.4), box(5, 0.9, 4, 0xf4f1de, 0, 3.25), box(3.6, 1.1, 0.1, C.alt, 0, 2.2, 2.52), box(1.2, 1.2, 1.2, 0xf4f1de, 2, 4.3, 1.2));
    mesh.add(cyl(0.08, 0.08, 5, 0xdddddd, -2.2, 5.2, 2, 6), box(1.6, 0.9, 0.06, C.main, -1.4, 7.2, 2));
  } else if (kind === 'depot') {
    mesh.add(box(2.6, 1.7, 2.2, f === 'bw' ? 0x8b5a2b : 0x2a8f82, 0, 0.85), box(2.9, 0.28, 2.5, f === 'bw' ? 0x5a3a22 : 0xf4f1de, 0, 1.84), box(1, 1, 0.1, 0x1a1a12, 0, 0.5, 1.12));
    const coin = cyl(0.75, 0.75, 0.16, 0xf5b83a, 0, 3, 0, 16); coin.rotation.x = Math.PI / 2; mesh.add(coin); mesh.userData.coin = coin;
  } else if (kind === 'barracks') {
    mesh.add(box(3.9, 2.2, 3.3, f === 'bw' ? 0x6b4226 : 0x1c4f57, 0, 1.1), box(4.2, 0.45, 3.6, f === 'bw' ? 0x3a2416 : 0xf4f1de, 0, 2.42), box(1.3, 1.4, 0.1, 0x1a1a12, 0, 0.7, 1.67), box(0.6, 0.6, 0.6, 0x333333, 1.3, 2.9, -0.8));
  } else {
    mesh.add(cyl(1, 1.2, 4.2, f === 'bw' ? 0x8a6a3e : 0x6b7a85, 0, 2.1, 0, 8), box(2.6, 0.5, 2.6, f === 'bw' ? 0x3a2416 : 0xf4f1de, 0, 4.35), box(0.4, 0.9, 0.4, 0x333333, 0, 4.9, 0.8));
  }
  return mesh;
}

/** A neutral business workers work at: a food truck with a cash sign. First 4 children shrink as it runs dry. */
export function nodeMesh() {
  const g = new THREE.Group();
  const truck = new THREE.Group();
  truck.add(box(2, 1.9, 4, 0xf4f1de, 0, 1.35, 0), box(2.02, 0.5, 4.02, 0xe85d9a, 0, 1.9, 0), box(1.9, 1, 1.2, 0x2b3a4c, 0, 1.5, 2.2), box(0.1, 0.8, 2.2, 0x2b3a4c, 1.02, 1.6, -0.3));
  for (const [x, z] of [[1, 1.3], [-1, 1.3], [1, -1.3], [-1, -1.3]]) truck.add(wheel(0.4, 0.3, x, 0.4, z));
  const sign = new THREE.Group();
  sign.add(cyl(0.06, 0.06, 1.4, 0x888888, 0, 3, 0, 6));
  const coin = cyl(0.55, 0.55, 0.12, 0xf5b83a, 0, 4, 0, 14); coin.rotation.x = Math.PI / 2; sign.add(coin);
  const awning = box(0.8, 0.08, 3, 0xf2b632, 1.4, 2.3, -0.3); awning.rotation.z = -0.3;
  // Team flag on the sign pole + own (un-shared) awning material, so sync.js can tint them to whoever works here.
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55, 4, 1), new THREE.MeshLambertMaterial({ color: 0xf2b632, side: THREE.DoubleSide }));
  flag.position.set(0.5, 3.4, 0); sign.add(flag);
  awning.material = new THREE.MeshLambertMaterial({ color: 0xf2b632 });
  g.add(truck, sign, awning, box(0.8, 0.9, 0.8, 0x8a6a3e, -1.7, 0.45, -1.2));
  g.userData.coin = coin; g.userData.flag = flag; g.userData.awning = awning;
  return g;
}

export function formation(n) {
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), sp = 0.95, out = [];
  for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); out.push([(c - (cols - 1) / 2) * sp, (r - (rows - 1) / 2) * sp]); }
  return out;
}

// Placeholder unit / building / business models.
// SWAP POINT FOR REAL ART: replace makeMember / bldMesh / nodeMesh bodies with GLB clones.
// Keep the same contract: return a THREE.Group, feet at y=0, facing +z, roughly to the scale below
// (humans ~1.6 m, monster truck ~3 m long). userData.legs (optional) = [leftLeg, rightLeg] for walk swing.
import { THREE, box, cyl, mat } from './scene.js?v=151';

export const FC = {
  bw: { main: 0xe8792b, dark: 0x5a3a22, skin: 0xf2c9a0, alt: 0x3d5a80, hair: 0x4a2e1a },
  ac: { main: 0x2cc2ad, dark: 0x1c4f57, skin: 0xe8b892, alt: 0xe85d9a, hair: 0x2a2a2a },
  om: { main: 0x2f6b4f, dark: 0x1d2b45, skin: 0xf0c8a8, alt: 0xd9b44a, hair: 0x2a2a2a },
  sc: { main: 0x7a3fd1, dark: 0x1e1e2a, skin: 0xc68a5e, alt: 0x7ee05b, hair: 0x1a1a1a },
  nd: { main: 0x4a6fe3, dark: 0x22252e, skin: 0xe8c4a0, alt: 0xf2e14c, hair: 0x5a3a22 },
  city: { main: 0x2b3f7a, dark: 0x1a1f2e, skin: 0xe0b48c, alt: 0xf3efe2, hair: 0x1a1f2e },
  hh: { main: 0xf28c28, dark: 0x3a3a3a, skin: 0xd9a77e, alt: 0xf2c232, hair: 0xf2c232 },
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
  if (f === 'city') { // the city's own people: hi-vis road crews, navy police, an armoured car with a light bar
    if (slot === 'worker') { g = humanoid(C, 0xf28c28, 0xf2c232); g.add(box(0.52, 0.08, 0.34, 0xe8ff3a, 0, 0.95, 0)); }
    else if (slot === 'cav') {
      g = new THREE.Group(); const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.dust = 0.5;
      body.add(box(1.7, 0.8, 3.4, 0x1a1f2e, 0, 0.75, 0), box(1.5, 0.6, 1.8, 0xf3efe2, 0, 1.45, -0.2), box(1.4, 0.4, 0.06, 0x9fd6ff, 0, 1.5, 0.72), box(1.74, 0.12, 3.44, 0xf3efe2, 0, 0.75, 0));
      const red = box(0.5, 0.18, 0.3, 0xff3030, -0.3, 1.85, -0.2), blue = box(0.5, 0.18, 0.3, 0x3060ff, 0.3, 1.85, -0.2);
      red.material = new THREE.MeshBasicMaterial({ color: 0xff3030 }); blue.material = new THREE.MeshBasicMaterial({ color: 0x3060ff });
      body.add(red, blue); g.userData.siren = [red, blue];
      for (const [x, z] of [[0.8, 1.1], [-0.8, 1.1], [0.8, -1.1], [-0.8, -1.1]]) g.add(wheel(0.36, 0.3, x, 0.36, z));
      tagWheels(g);
    } else if (slot === 'truck') { // olive army truck: cab, canvas-covered bed
      g = new THREE.Group(); const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.dust = 0.8;
      body.add(box(1.9, 0.5, 4.6, 0x3f4a2a, 0, 0.75, 0), box(1.8, 1.0, 1.3, 0x4f5b35, 0, 1.45, 1.55), box(1.6, 0.4, 0.06, 0x9fd6ff, 0, 1.65, 2.21));
      body.add(box(1.9, 1.3, 2.9, 0x6b6a4a, 0, 1.65, -0.75), box(1.92, 0.1, 2.94, 0x4f5b35, 0, 2.32, -0.75));
      for (const [x, z] of [[0.85, 1.5], [-0.85, 1.5], [0.85, -0.6], [-0.85, -0.6], [0.85, -1.6], [-0.85, -1.6]]) g.add(wheel(0.42, 0.34, x, 0.42, z));
      tagWheels(g);
    } else if (slot === 'army') { // soldiers: olive fatigues, round helmet, rifle
      g = humanoid({ ...C, dark: 0x3f4a2a }, 0x5b6b3a, 0x3f4a2a);
      g.add(cyl(0.24, 0.26, 0.16, 0x4f5b35, 0, 1.55, 0, 10), box(0.07, 0.09, 0.8, 0x222222, 0.3, 0.95, 0.35));
    } else if (slot === 'robot') { // riot mech: a slab-armoured walker with a police light bar, twice anyone's height
      g = humanoid({ ...C, dark: 0x2a3040, skin: 0x8a90a0 }, 0x1a1f2e, 0x2a3040); g.scale.setScalar(2.6);
      g.add(box(0.5, 0.22, 0.05, 0x9fd6ff, 0, 1.35, 0.17), box(0.62, 0.5, 0.4, 0xf3efe2, 0, 1.0, 0), box(0.12, 0.12, 0.5, 0x444444, 0.34, 0.85, 0.25), box(0.12, 0.12, 0.5, 0x444444, -0.34, 0.85, 0.25));
      const red = box(0.18, 0.08, 0.12, 0xff3030, -0.11, 1.62, 0), blue = box(0.18, 0.08, 0.12, 0x3060ff, 0.11, 1.62, 0);
      red.material = new THREE.MeshBasicMaterial({ color: 0xff3030 }); blue.material = new THREE.MeshBasicMaterial({ color: 0x3060ff });
      g.add(red, blue); g.userData.siren = [red, blue];
    } else if (slot === 'melee') { g = humanoid(C, 0xc62f2f, 0xf2c232); g.add(box(0.52, 0.1, 0.34, 0xe8ff3a, 0, 0.7, 0), box(0.36, 0.1, 0.46, 0xf2c232, 0, 1.47, 0.04), box(0.08, 0.08, 0.7, 0x3a3a3a, 0.3, 0.8, 0.35)); }
    else if (slot === 'civ') { const sh = [0x6fc3ff, 0xe85d9a, 0x7ee05b, 0xf2b632, 0xc9b79a, 0x8a6f5a][(Math.random() * 6) | 0]; g = humanoid({ ...C, skin: [0xf2c9a0, 0xc68a5e, 0x8d5a3b, 0xe0b48c][(Math.random() * 4) | 0], dark: 0x3d4a5a }, sh, [0x2a2a2a, 0x8a5a3a, 0xd9c08a][(Math.random() * 3) | 0]); }
    else { g = humanoid(C, C.main, C.dark); g.add(box(0.36, 0.06, 0.42, C.dark, 0, 1.47, 0.08), box(0.1, 0.1, 0.04, 0xf2c232, 0.12, 1.0, 0.17)); if (slot === 'ranged') g.add(box(0.5, 0.55, 0.06, 0x3a3a3a, -0.1, 0.85, 0.2)); else g.add(box(0.05, 0.05, 0.6, 0x111111, 0.32, 0.7, 0.25)); }
    return g;
  }
  if (f === 'om' && (slot === 'cav' || slot === 'siege' || slot === 'hero')) {
    if (slot === 'cav') {
      // Golf cart: white tub, striped canopy on four posts, a bag of clubs on the back.
      g = new THREE.Group();
      const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.dust = 0.5;
      body.add(box(1.3, 0.5, 2.2, 0xf4f1de, 0, 0.6, 0), box(1.2, 0.5, 0.5, 0x2f6b4f, 0, 1.0, -0.2), box(1.4, 0.08, 2.0, 0x2f6b4f, 0, 2.05, 0));
      for (const x of [-0.6, 0.6]) for (const z of [0.7, -0.8]) body.add(box(0.06, 1.1, 0.06, 0xcccccc, x, 1.5, z));
      body.add(box(0.35, 0.9, 0.35, 0x5a3a22, 0, 1.0, -1.15), box(0.08, 0.4, 0.08, 0xcccccc, 0.08, 1.6, -1.15), box(0.08, 0.4, 0.08, 0xcccccc, -0.08, 1.55, -1.1));
      for (const [x, z] of [[0.6, 0.75], [-0.6, 0.75], [0.6, -0.75], [-0.6, -0.75]]) g.add(wheel(0.26, 0.2, x, 0.26, z));
      tagWheels(g);
    } else if (slot === 'siege') {
      // Armoured limo: long black stretch, tinted windows, gold trim, little flags on the bonnet.
      g = new THREE.Group();
      const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.dust = 0.6;
      body.add(box(1.7, 0.7, 5.2, 0x111111, 0, 0.75, 0), box(1.5, 0.55, 3.2, 0x1d2b45, 0, 1.35, -0.3), box(1.72, 0.08, 5.22, 0xd9b44a, 0, 0.9, 0));
      for (const x of [-0.7, 0.7]) body.add(box(0.04, 0.4, 0.04, 0xcccccc, x, 1.3, 2.4), box(0.28, 0.18, 0.02, 0xd9b44a, x + 0.14, 1.45, 2.4));
      for (const [x, z] of [[0.85, 1.8], [-0.85, 1.8], [0.85, -1.8], [-0.85, -1.8]]) g.add(wheel(0.36, 0.3, x, 0.36, z));
      tagWheels(g);
    } else {
      // The Tycoon: top hat, monocle, gold-topped cane.
      g = humanoid(C, C.dark, 0x111111); g.children[2].scale.set(1.25, 1.1, 1.25);
      g.add(box(0.26, 0.4, 0.26, 0x111111, 0, 1.72, 0), box(0.4, 0.04, 0.4, 0x111111, 0, 1.52, 0));
      g.add(cyl(0.06, 0.06, 0.02, 0xd9b44a, 0.08, 1.3, 0.17, 10));
      g.add(box(0.04, 0.9, 0.04, 0x3a2416, 0.36, 0.45, 0.15), box(0.08, 0.08, 0.08, 0xd9b44a, 0.36, 0.92, 0.15));
    }
  } else if (f === 'hh' && (slot === 'cav' || slot === 'siege' || slot === 'hero')) {
    if (slot === 'cav') {
      // Forklift: squat yellow body, cage, mast with two forks out front (forks jab forward on a hit via lunge).
      g = new THREE.Group();
      const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.dust = 0.7;
      body.add(box(1.4, 0.8, 1.9, C.alt, 0, 0.75, -0.1), box(1.2, 0.08, 1.1, 0x222222, 0, 2.05, -0.3), box(1.3, 0.5, 0.5, 0x333333, 0, 0.9, -1.1));
      for (const x of [-0.55, 0.55]) for (const z of [0.25, -0.85]) body.add(box(0.07, 0.95, 0.07, 0x222222, x, 1.55, z));
      body.add(box(0.12, 2.2, 0.12, 0x444444, -0.4, 1.3, 0.95), box(0.12, 2.2, 0.12, 0x444444, 0.4, 1.3, 0.95));
      const forks = new THREE.Group(); forks.position.set(0, 0.3, 1.0); forks.add(box(0.12, 0.06, 1.1, 0x888888, -0.3, 0, 0.55), box(0.12, 0.06, 1.1, 0x888888, 0.3, 0, 0.55), box(0.9, 0.5, 0.08, 0x666666, 0, 0.25, 0));
      body.add(forks); g.userData.forks = forks;
      for (const [x, z] of [[0.75, 0.6], [-0.75, 0.6], [0.75, -0.8], [-0.75, -0.8]]) g.add(wheel(0.32, 0.3, x, 0.32, z));
      tagWheels(g);
    } else if (slot === 'siege') {
      // Excavator: tracked base, turning cab, boom + stick + bucket on pivots (sync.js swings it).
      g = new THREE.Group();
      for (const x of [-0.85, 0.85]) g.add(box(0.5, 0.55, 2.6, 0x2a2a2a, x, 0.28, 0));
      const cab = new THREE.Group(); cab.position.y = 0.6; g.add(cab);
      cab.add(box(1.7, 0.8, 1.9, C.alt, 0, 0.45, -0.2), box(0.8, 0.9, 0.8, 0x2b3a4c, 0.4, 1.25, 0.2), box(1.6, 0.4, 0.6, 0x333333, 0, 0.6, -1.2));
      const boom = new THREE.Group(); boom.position.set(-0.4, 0.8, 0.6); cab.add(boom);
      boom.add(box(0.3, 0.3, 2.2, C.alt, 0, 0, 1.1)); boom.rotation.x = -0.5;
      const stick = new THREE.Group(); stick.position.set(0, 0, 2.2); boom.add(stick);
      stick.add(box(0.25, 0.25, 1.6, C.alt, 0, 0, 0.8)); stick.rotation.x = 1.4;
      const bucket = new THREE.Group(); bucket.position.set(0, 0, 1.6); stick.add(bucket);
      bucket.add(box(0.7, 0.45, 0.5, 0x444444, 0, -0.1, 0.15)); bucket.rotation.x = 0.4;
      g.userData.dig = { cab, boom, stick, bucket }; g.userData.dust = 0.8;
    } else {
      // The Foreman: hi-vis vest, white hard hat, clipboard in hand.
      g = humanoid(C, C.alt, 0xffffff); g.children[2].scale.set(1.15, 1.15, 1.15);
      g.add(box(0.3, 0.38, 0.04, 0x8a6a3e, 0.3, 0.95, 0.25), box(0.24, 0.28, 0.02, 0xffffff, 0.3, 0.97, 0.28));
    }
  } else if (f === 'nd' && (slot === 'cav' || slot === 'siege' || slot === 'hero')) {
    if (slot === 'cav') { // Segway Patrol: a nerd in a bike helmet on a two-wheel scooter, leaning forward (chassis wobbles)
      g = new THREE.Group();
      const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.dust = 0.3;
      const rider = humanoid(C, C.main, 0xffffff); rider.position.y = 0.35; rider.rotation.x = 0.12; body.add(rider);
      body.add(box(0.7, 0.1, 0.45, 0x333333, 0, 0.3, 0), box(0.06, 1, 0.06, 0x888888, 0, 0.8, 0.3), box(0.6, 0.06, 0.06, 0x333333, 0, 1.3, 0.3));
      g.add(wheel(0.28, 0.12, 0.42, 0.28, 0), wheel(0.28, 0.12, -0.42, 0.28, 0)); tagWheels(g);
    } else if (slot === 'siege') { // Mech Suit: a cardboard-and-LED walking mech, nerd in the cockpit
      g = humanoid({ ...C, dark: 0x5a6070, skin: 0x8a90a0 }, 0x9aa2b5, C.alt); g.scale.setScalar(1.9);
      g.add(box(0.36, 0.2, 0.05, 0x9fd6ff, 0, 0.92, 0.16), box(0.18, 0.18, 0.18, 0xe8c4a0, 0, 0.92, 0.1), box(0.08, 0.08, 0.02, 0xff3030, 0.14, 1.32, 0.17), box(0.08, 0.08, 0.02, 0xff3030, -0.14, 1.32, 0.17));
      g.add(box(0.1, 0.1, 0.5, 0x444444, 0.3, 0.6, 0.3), box(0.1, 0.1, 0.5, 0x444444, -0.3, 0.6, 0.3)); // arm cannons
    } else { // The Streamer: headset, a phone on a selfie stick and a ring light floating behind
      g = humanoid(C, C.alt, 0x222222); g.children[2].scale.set(1.1, 1.1, 1.1);
      g.add(box(0.4, 0.06, 0.06, 0x111111, 0, 1.47, 0), box(0.06, 0.14, 0.14, 0x111111, 0.2, 1.3, 0), box(0.06, 0.14, 0.14, 0x111111, -0.2, 1.3, 0));
      g.add(box(0.03, 0.8, 0.03, 0x888888, 0.35, 1.2, 0.3), box(0.14, 0.24, 0.03, 0x111111, 0.35, 1.6, 0.42));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 20), mat(0xffffff)); ring.position.set(0, 1.4, -0.6); g.add(ring, box(0.03, 1.2, 0.03, 0x555555, 0, 0.6, -0.6));
    }
  } else if (f === 'sc' && slot === 'cav') {
    // Lowrider: long, low, purple with chrome trim and whitewall wheels. sync.js pumps the hydraulics (userData.hydro).
    g = new THREE.Group();
    const body = new THREE.Group(); g.add(body); g.userData.chassis = body; g.userData.hydro = true; g.userData.dust = 0.5;
    body.add(box(1.6, 0.45, 3.6, C.main, 0, 0.55, 0), box(1.4, 0.4, 1.6, C.main, 0, 0.98, -0.3), box(1.3, 0.32, 0.06, 0x9fd6ff, 0, 1.0, 0.52));
    body.add(box(1.64, 0.06, 3.64, 0xd8d8d8, 0, 0.5, 0), box(1.5, 0.12, 0.08, 0xd8d8d8, 0, 0.5, 1.82), box(1.5, 0.12, 0.08, 0xd8d8d8, 0, 0.5, -1.82));
    body.add(box(0.06, 0.04, 2.8, C.alt, 0.81, 0.7, 0), box(0.06, 0.04, 2.8, C.alt, -0.81, 0.7, 0)); // pinstripe
    for (const [x, z] of [[0.75, 1.2], [-0.75, 1.2], [0.75, -1.2], [-0.75, -1.2]]) { g.add(wheel(0.3, 0.22, x, 0.3, z)); g.add(wheel(0.18, 0.24, x, 0.3, z, 0xf4f4f4)); }
    tagWheels(g);
  } else if (f === 'bw') {
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
    else if (slot === 'cav') {
      // Bike Collective: rider on a real-looking bike - two spoked wheels, a diamond frame, saddle, bars and a bell.
      g = humanoid(C, C.main, C.hair); g.position.y = 0.35;
      for (const z of [0.55, -0.55]) g.add(wheel(0.33, 0.06, 0, -0.02, z, 0x111111));
      const fr = (len, x, y, z, rx) => { const m = box(0.06, len, 0.06, C.alt, x, y, z); m.rotation.x = rx; g.add(m); };
      fr(0.95, 0, 0.32, 0.02, Math.PI / 2);       // top tube
      fr(0.75, 0, 0.12, 0.22, -0.95);             // down tube to the bottom bracket
      fr(0.55, 0, 0.1, -0.2, 0.25);               // seat tube
      fr(0.6, 0, -0.02, -0.37, Math.PI / 2 - 0.2); // chain stay
      fr(0.5, 0, 0.15, 0.52, -0.25);              // fork
      g.add(box(0.5, 0.05, 0.05, 0x222222, 0, 0.48, 0.5), box(0.18, 0.06, 0.28, 0x222222, 0, 0.42, -0.25));
      const bell = box(0.1, 0.1, 0.1, 0xf5b83a, 0.18, 0.53, 0.5); g.add(bell); g.userData.bell = bell;
      g.userData.wheels = g.children.filter((c) => c.geometry && c.geometry.type === 'CylinderGeometry'); g.userData.pedal = true;
    }
    else if (slot === 'siege') {
      // Parade puppet: a tall body, a big paper-mache head (eyes ride on it) and two floppy arms hung from shoulder pivots.
      g = new THREE.Group();
      g.add(box(1, 2.3, 0.8, C.alt, 0, 1.35));
      const head = new THREE.Group(); head.position.y = 3.2; g.add(head);
      head.add(new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), mat(0xf4f1de)), box(0.2, 0.2, 0.2, 0x222222, -0.25, 0.1, 0.7), box(0.2, 0.2, 0.2, 0x222222, 0.25, 0.1, 0.7), box(0.5, 0.08, 0.1, 0xd64545, 0, -0.3, 0.72));
      const arms = [];
      for (const sd of [-1, 1]) { const pv = new THREE.Group(); pv.position.set(sd * 0.62, 2.45, 0); pv.add(box(0.25, 1.8, 0.25, C.alt, sd * 0.18, -0.85, 0), box(0.4, 0.4, 0.4, 0xf4f1de, sd * 0.18, -1.8, 0)); g.add(pv); arms.push(pv); }
      g.userData.puppet = { head, arms };
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
// A tower crane: lattice mast, slewing jib with counterweight and a hanging hook (sync.js turns userData.jib).
function crane(h, reach, x = 0, z = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(box(0.5, h, 0.5, 0xf2c232, 0, h / 2, 0));
  for (let y = 1; y < h; y += 1.2) g.add(box(0.56, 0.08, 0.56, 0x9a7a1a, 0, y, 0));
  const jib = new THREE.Group(); jib.position.y = h; g.add(jib);
  jib.add(box(0.4, 0.4, reach, 0xf2c232, 0, 0, reach / 2 - 1), box(0.9, 0.7, 0.9, 0x555555, 0, -0.1, -1.6), box(0.7, 0.6, 0.7, 0x2b3a4c, 0, -0.55, 0.3));
  jib.add(box(0.04, 3, 0.04, 0x333333, 0, -1.5, reach - 2), box(0.3, 0.3, 0.3, 0xd64545, 0, -3, reach - 2));
  g.userData.jib = jib;
  return g;
}
export function bldMesh(kind, f) {
  const mesh = new THREE.Group(), C = FC[f];
  if (f === 'om') {
    // Old Money: white columns, gold trim, manicured hedges.
    if (kind === 'hq') {
      mesh.add(box(6, 3.4, 4.4, 0xf4f1de, 0, 1.7, -0.3), box(6.4, 0.4, 4.8, 0xd9b44a, 0, 3.6, -0.3), box(4.6, 1.4, 3.4, 0xe8e0cc, 0, 4.5, -0.6), box(2.4, 0.6, 1.2, 0x1d2b45, 0, 5.4, -0.6));
      for (let i = -2; i <= 2; i++) mesh.add(cyl(0.18, 0.2, 3, 0xffffff, i * 1.1, 1.5, 2.2, 10));
      mesh.add(box(5.4, 0.25, 0.6, 0xffffff, 0, 3.1, 2.2), box(1.2, 1.9, 0.1, 0x3a2416, 0, 0.95, 1.93));
      for (const x of [-3.6, 3.6]) mesh.add(box(0.8, 0.8, 3.6, 0x2f6b4f, x, 0.4, 0.4));
    } else if (kind === 'depot') {
      mesh.add(box(2.8, 2, 2.4, 0x9a9a9a, 0, 1), box(3, 0.3, 2.6, 0xd9b44a, 0, 2.15));
      const door = cyl(0.75, 0.75, 0.15, 0x5a5a5a, 0, 1, 1.25, 16); door.rotation.x = Math.PI / 2; mesh.add(door, box(0.5, 0.08, 0.08, 0xd9b44a, 0, 1, 1.35));
      const coin = cyl(0.75, 0.75, 0.16, 0xf5b83a, 0, 3.2, 0, 16); coin.rotation.x = Math.PI / 2; mesh.add(coin); mesh.userData.coin = coin;
    } else if (kind === 'barracks') {
      mesh.add(box(4.2, 2.2, 3.4, 0xf4f1de, 0, 1.1), box(4.6, 0.6, 3.8, 0x2f6b4f, 0, 2.5), box(1.4, 1.4, 0.1, 0x1d2b45, 0, 0.7, 1.72));
      mesh.add(cyl(0.05, 0.05, 2.4, 0xcccccc, 1.8, 3.9, 1.2, 6), box(0.8, 0.5, 0.04, 0xd9b44a, 2.2, 4.8, 1.2));
    } else {
      mesh.add(box(0.2, 2.6, 0.2, 0x555555, -0.6, 1.3, -0.6), box(0.2, 2.6, 0.2, 0x555555, 0.6, 1.3, -0.6), box(0.2, 2.6, 0.2, 0x555555, -0.6, 1.3, 0.6), box(0.2, 2.6, 0.2, 0x555555, 0.6, 1.3, 0.6));
      mesh.add(box(1.8, 1.4, 1.8, 0xf4f1de, 0, 3.3, 0), box(1.9, 0.5, 1.9, 0x2b3a4c, 0, 3.4, 0), box(2.1, 0.3, 2.1, 0xd9b44a, 0, 4.15, 0));
    }
    return mesh;
  }
  if (f === 'nd') {
    // Nerds: neon-trimmed boxes, satellite dishes and blinking server LEDs (userData.leds blink in sync.js).
    const leds = [];
    const led = (x, y, z, c) => { const m = box(0.12, 0.12, 0.04, c, x, y, z); m.material = new THREE.MeshBasicMaterial({ color: c }); mesh.add(m); leds.push(m); };
    if (kind === 'hq') { // Game Shop: storefront with a giant pixel controller on the roof and a dish
      mesh.add(box(6, 3.2, 4.6, 0x3a3f52, 0, 1.6), box(6.3, 0.3, 4.9, C.main, 0, 3.35), box(4.4, 1.6, 0.1, 0x9fd6ff, 0, 1.3, 2.32), box(6.1, 0.1, 0.1, 0xff5ad1, 0, 2.5, 2.36));
      mesh.add(box(3, 1, 0.6, 0x2a2a2a, 0, 4.1, 0), box(0.8, 0.8, 0.62, 0x2a2a2a, -1.5, 3.9, 0), box(0.8, 0.8, 0.62, 0x2a2a2a, 1.5, 3.9, 0));
      led(0.9, 4.2, 0.32, 0xff3030); led(1.2, 4.0, 0.32, 0x3aff5a); led(-1.0, 4.1, 0.32, C.alt);
      const dish = cyl(0.9, 0.2, 0.3, 0xdddddd, 2.4, 4.0, -1.5, 14); dish.rotation.x = -0.8; mesh.add(dish);
      // Block dressing: a cosplay photo-op cutout (face hole), a glowing vending machine, cable spaghetti and a folding table with dice.
      mesh.add(box(1.4, 2, 0.08, C.alt, -4.2, 1, 2.6), box(0.36, 0.36, 0.1, 0x1b1d24, -4.2, 1.55, 2.6), box(1.2, 0.5, 0.09, C.main, -4.2, 0.6, 2.62), box(0.1, 0.6, 0.5, 0x8a6a3e, -4.2, 0.3, 2.3));
      mesh.add(box(1, 2, 0.8, 0xc62f2f, 4.2, 1, 2.2)); led(4.2, 1.3, 2.62, 0x9fd6ff); led(4.0, 1.0, 2.62, C.alt); led(4.4, 0.7, 2.62, 0x3aff5a);
      for (let i = 0; i < 6; i++) { const c = cyl(0.04, 0.04, 2.4, [0x111111, 0x2255aa, 0xd64545, 0xf2e14c][i % 4], 1 + i * 0.25, 0.04, 2.9 + Math.sin(i) * 0.3, 5); c.rotation.z = Math.PI / 2; c.rotation.y = (i - 2.5) * 0.25; mesh.add(c); }
      mesh.add(box(1.6, 0.06, 0.8, 0xdddddd, -1.8, 0.75, 3.4), box(0.05, 0.75, 0.05, 0x666666, -2.5, 0.37, 3.1), box(0.05, 0.75, 0.05, 0x666666, -1.1, 0.37, 3.7));
      for (const [x, z, c] of [[-2, 3.3, 0xff3030], [-1.7, 3.5, 0x3aff5a], [-1.5, 3.25, C.alt]]) { const d = box(0.14, 0.14, 0.14, c, x, 0.86, z); d.rotation.y = x * 3; mesh.add(d); }
    } else if (kind === 'depot') { // Server Rack: a black rack with rows of blinking LEDs
      mesh.add(box(2.4, 2.4, 2, 0x1b1d24, 0, 1.2), box(2.5, 0.2, 2.1, C.main, 0, 2.5));
      for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 4; c2++) led(-0.75 + c2 * 0.5, 0.5 + r * 0.5, 1.02, [0x3aff5a, 0x3aff5a, C.alt, 0x5aa9e6][(r + c2) % 4]);
      const coin = cyl(0.75, 0.75, 0.16, 0xf5b83a, 0, 3.4, 0, 16); coin.rotation.x = Math.PI / 2; mesh.add(coin); mesh.userData.coin = coin;
    } else if (kind === 'barracks') { // LAN Cafe: glass front, glowing screens inside, gamer-chair sign
      mesh.add(box(4.4, 2.3, 3.6, 0x2f3446, 0, 1.15), box(4.6, 0.3, 3.8, C.main, 0, 2.45), box(3.6, 1.2, 0.1, 0x16304a, 0, 1.1, 1.82));
      for (let i = 0; i < 4; i++) led(-1.35 + i * 0.9, 1.15, 1.88, [0x5aa9e6, 0xff5ad1, 0x3aff5a, C.alt][i]);
      mesh.add(box(1.6, 0.6, 0.1, 0x111111, 0, 3.0, 1.2), box(1.4, 0.4, 0.02, C.alt, 0, 3.0, 1.26));
    } else { // Antenna Tower: a lattice mast with a dish and a red beacon
      for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) mesh.add(box(0.1, 4.6, 0.1, 0x888888, x * 0.8, 2.3, z * 0.8));
      for (let y = 0.8; y < 4.6; y += 0.9) mesh.add(box(0.9, 0.06, 0.9, 0x777777, 0, y, 0));
      const dish = cyl(0.7, 0.15, 0.25, 0xdddddd, 0, 4.2, 0.5, 14); dish.rotation.x = -1.1; mesh.add(dish, box(0.08, 1.4, 0.08, 0xaaaaaa, 0, 5.2, 0)); led(0, 5.95, 0, 0xff3030);
    }
    mesh.userData.leds = leds;
    return mesh;
  }
  if (f === 'sc') {
    // Street Crew: graffiti-painted brick, neon trim, and speakers everywhere (userData.speakers thump to a beat in sync.js).
    const spk = [], speaker = (w, h, x, y, z) => { mesh.add(box(w, h, 0.6, 0x1e1e2a, x, y, z)); const c = cyl(w * 0.32, w * 0.32, 0.08, 0x555555, x, y, z + 0.32, 12); c.rotation.x = Math.PI / 2; mesh.add(c); spk.push(c); };
    const tag = (w, h, x, y, z, c) => mesh.add(box(w, h, 0.04, c, x, y, z));
    if (kind === 'hq') { // Record Shop: brick front, big vinyl on the roof, a neon strip and two speaker stacks by the door
      mesh.add(box(6, 3.4, 4.6, 0x8a4a3a, 0, 1.7), box(6.3, 0.35, 4.9, 0x1e1e2a, 0, 3.55), box(4.2, 1.4, 0.1, 0x9fd6ff, 0, 1.3, 2.32), box(6.1, 0.12, 0.12, C.alt, 0, 2.6, 2.36));
      tag(1.6, 0.8, -2, 2.9, 2.32, 0xff5ad1); tag(1.2, 0.6, 2.1, 0.5, 2.32, C.alt);
      const disc = cyl(1.8, 1.8, 0.12, 0x111111, 0, 5.2, 0, 24); disc.rotation.x = Math.PI / 2; disc.add(cyl(0.6, 0.6, 0.14, C.main, 0, 0, 0, 16)); mesh.add(disc, box(0.3, 1.6, 0.3, 0x333333, 0, 3.9, 0)); mesh.userData.disc = disc;
      speaker(0.9, 1.1, -3.6, 0.55, 2.2); speaker(0.9, 1.1, -3.6, 1.65, 2.2); speaker(0.9, 1.1, 3.6, 0.55, 2.2);
      // Block dressing: a half basketball court, a parked boombox on a milk crate, tagged dumpsters and a bench.
      mesh.add(box(3.6, 0.03, 4.4, 0x3a5a7a, -5.6, 0.03, 0.4), box(3.6, 0.04, 0.08, 0xffffff, -5.6, 0.05, 2.55), box(0.08, 0.04, 4.4, 0xffffff, -3.84, 0.05, 0.4), box(0.08, 0.04, 4.4, 0xffffff, -7.36, 0.05, 0.4));
      const key = cyl(1, 1, 0.04, 0xffffff, -5.6, 0.04, -1.2, 20); key.scale.z = 0.6; mesh.add(key, cyl(0.9, 0.9, 0.05, 0x3a5a7a, -5.6, 0.05, -1.2, 20));
      mesh.add(box(0.12, 3, 0.12, 0x888888, -5.6, 1.5, -2.1), box(1.1, 0.75, 0.06, 0xffffff, -5.6, 2.9, -1.95), box(0.45, 0.04, 0.45, 0xf28c28, -5.6, 2.62, -1.65));
      mesh.add(box(0.6, 0.45, 0.6, 0x3a6fd6, 3.9, 0.22, 3.4), box(0.8, 0.42, 0.26, 0x2a2a2a, 3.9, 0.66, 3.4), box(0.6, 0.04, 0.04, 0x999999, 3.9, 0.92, 3.4));
      speaker(0.36, 0.3, 3.75, 0.66, 3.28); speaker(0.36, 0.3, 4.05, 0.66, 3.28);
      for (const [x, z, c] of [[4.6, -1.6, 0x2f6b3a], [4.6, 0.2, 0x3a3a46]]) { mesh.add(box(1.3, 1.1, 1.6, c, x, 0.55, z), box(1.35, 0.08, 1.65, 0x222222, x, 1.14, z)); tag(0.04, 0.6, x + 0.67, 0.6, z, [0xff5ad1, C.alt][z > 0 ? 1 : 0]); }
      mesh.add(box(1.8, 0.1, 0.45, 0x8a6a3e, -1.6, 0.45, 3.4), box(0.1, 0.45, 0.4, 0x444444, -2.3, 0.22, 3.4), box(0.1, 0.45, 0.4, 0x444444, -0.9, 0.22, 3.4));
    } else if (kind === 'depot') { // Sneaker Store: white box, a giant sneaker on the roof
      mesh.add(box(2.8, 1.9, 2.4, 0xf4f4f4, 0, 0.95), box(3, 0.28, 2.6, C.main, 0, 2.04), box(1.8, 0.9, 0.08, 0x9fd6ff, 0, 1, 1.22));
      mesh.add(box(0.9, 0.5, 2, 0xffffff, 0, 2.5, 0), box(0.95, 0.15, 2.05, C.main, 0, 2.25, 0), box(0.8, 0.6, 0.8, C.alt, 0, 2.9, -0.5));
      const coin = cyl(0.75, 0.75, 0.16, 0xf5b83a, 0, 3.9, 0, 16); coin.rotation.x = Math.PI / 2; mesh.add(coin); mesh.userData.coin = coin;
    } else if (kind === 'barracks') { // Rec Centre: low gym with a hoop on the side and painted murals
      mesh.add(box(4.4, 2.4, 3.6, 0xc9b98a, 0, 1.2), box(4.6, 0.3, 3.8, 0x3a3a46, 0, 2.55), box(1.4, 1.6, 0.1, 0x1e1e2a, 0, 0.8, 1.82));
      tag(1.3, 1, -1.4, 1.4, 1.82, C.main); tag(1, 0.9, 1.5, 1.5, 1.82, 0xff5ad1); tag(0.04, 1, 2.22, 1.3, 0, C.alt);
      mesh.add(box(0.12, 3.4, 0.12, 0x888888, 2.9, 1.7, 1), box(0.1, 0.8, 1.1, 0xffffff, 2.9, 3.2, 1.3), box(0.5, 0.04, 0.5, 0xf28c28, 2.9, 2.95, 1.75));
    } else { // Speaker Stack tower: a scaffold tower of speakers
      for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) mesh.add(box(0.15, 4.4, 0.15, 0x555555, x, 2.2, z));
      speaker(1.5, 1.2, 0, 1, 0.1); speaker(1.5, 1.2, 0, 2.3, 0.1); speaker(1.2, 1, 0, 3.5, 0.1); mesh.add(box(1.8, 0.2, 1.8, C.main, 0, 4.4, 0));
    }
    mesh.userData.speakers = spk;
    return mesh;
  }
  if (f === 'hh') {
    // Hard Hats: everything is a building site - portable cabins, corrugated sheds, and a crane over the base.
    if (kind === 'hq') {
      mesh.add(box(5.6, 2, 2.6, 0xe8e0cc, 0, 1, 0.9), box(5.6, 2, 2.6, 0xf2c232, 0, 3, 0.9), box(5.6, 2, 2.4, 0xe8e0cc, 0, 1, -1.6));
      mesh.add(box(1, 1.2, 0.1, 0x2b3a4c, -1.6, 3, 2.22), box(1, 1.2, 0.1, 0x2b3a4c, 1.6, 3, 2.22), box(0.9, 1.6, 0.1, 0x3a2416, 0, 0.8, 2.22));
      const cr = crane(9, 9, -2.6, -2.4); mesh.add(cr); mesh.userData.jib = cr.userData.jib;
      // Site dressing: a porta-potty, a dumpster, a lumber stack, pipes and a barrier.
      mesh.add(box(1, 2.2, 1, 0x3d6fd6, 4.2, 1.1, -1.2), box(0.6, 1.6, 0.04, 0x2a4fa0, 4.2, 0.95, -0.68), box(0.18, 0.3, 0.18, 0xdddddd, 4.2, 2.35, -1.2));
      mesh.add(box(2.2, 1.1, 1.3, 0x2f6b3a, -4.4, 0.55, 1.4), box(2.3, 0.1, 1.4, 0x244f2b, -4.4, 1.15, 1.4));
      for (let i = 0; i < 4; i++) mesh.add(box(2.4, 0.18, 0.3, 0xc9a26a, 4.4, 0.1 + i * 0.19, 1.4 + (i % 2) * 0.1));
      for (let i = 0; i < 3; i++) { const pp = cyl(0.22, 0.22, 2.6, 0x8a8a8a, -4.5, 0.22 + (i === 2 ? 0.38 : 0), -1.6 + (i === 2 ? 0 : (i - 0.5) * 0.46), 8); pp.rotation.x = Math.PI / 2; mesh.add(pp); }
      mesh.add(box(0.08, 0.6, 0.08, 0xffffff, 1.3, 0.3, 3.9), box(0.08, 0.6, 0.08, 0xffffff, -1.3, 0.3, 3.9), box(2.8, 0.22, 0.06, 0xf28c28, 0, 0.62, 3.9));
    } else if (kind === 'depot') {
      mesh.add(box(2.8, 1.8, 2.3, 0x9aa3ab, 0, 0.9), box(3, 0.2, 2.5, 0x6b7a85, 0, 1.9), box(1.2, 1.2, 0.1, 0xf2c232, 0, 0.6, 1.16));
      for (let i = -1; i <= 1; i++) mesh.add(box(0.06, 1.8, 2.32, 0x7a838b, i * 0.9, 0.9, 0));
    } else if (kind === 'barracks') {
      mesh.add(box(4, 2.4, 3.4, 0x6b7a85, 0, 1.2), box(4.3, 0.35, 3.7, 0xf28c28, 0, 2.55), box(1.4, 1.5, 0.1, 0x1a1a12, 0, 0.75, 1.72), box(2.4, 0.5, 0.06, 0xf2c232, 0, 2.05, 1.74));
    } else {
      const cr = crane(6, 6); mesh.add(cr, box(1.6, 0.5, 1.6, 0x555555, 0, 0.25, 0)); mesh.userData.jib = cr.userData.jib;
    }
    if (kind !== 'tower') mesh.add(box(0.5, 0.75, 0.5, 0xf28c28, 3.3, 0.38, 2.6), box(0.5, 0.75, 0.5, 0xf28c28, -3.3, 0.38, 2.6));
    if (kind === 'depot') { const coin = cyl(0.75, 0.75, 0.16, 0xf5b83a, 0, 3, 0, 16); coin.rotation.x = Math.PI / 2; mesh.add(coin); mesh.userData.coin = coin; }
    return mesh;
  }
  if (kind === 'hq') {
    // Faction dressing round each HQ: Backwoods hay bales + a tyre; Activists a bike rack + a placard stack.
    if (f === 'bw') { for (const [x, z] of [[3.8, 2.6], [4.4, 1.4], [3.9, 1.9]]) { const h = cyl(0.55, 0.55, 0.9, 0xd9b44a, x, 0.55, z, 10); h.rotation.z = Math.PI / 2; mesh.add(h); } const t = cyl(0.6, 0.6, 0.35, 0x1c1c1c, -4, 0.2, 2.6, 12); mesh.add(t); }
    else for (let i = 0; i < 4; i++) { mesh.add(box(0.05, 0.7, 0.9, 0x888888, -3.6 + i * 0.4, 0.35, 3), box(0.6, 0.4, 0.04, [0xe85d9a, 0xf4f1de, 0x2cc2ad, 0xf2b632][i], 3.8 + (i % 2) * 0.3, 0.5 + i * 0.05, 2.2 - i * 0.25)); }
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
  // Vendor in the serving hatch: torso, head, paper hat; sync.js bobs and turns them while the truck has stock.
  const vendor = new THREE.Group(); vendor.position.set(1.15, 1.25, -0.3); // leaning out of the side hatch
  vendor.add(box(0.36, 0.45, 0.3, 0xf4f1de, 0, 0, 0), box(0.26, 0.26, 0.26, 0xe8b892, 0, 0.36, 0), box(0.24, 0.16, 0.24, 0xffffff, 0, 0.56, 0));
  truck.add(vendor);
  g.userData.coin = coin; g.userData.flag = flag; g.userData.awning = awning; g.userData.vendor = vendor; g.userData.awnRot = awning.rotation.z;
  return g;
}

export function formation(n) {
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), sp = 0.95, out = [];
  for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); out.push([(c - (cols - 1) / 2) * sp, (r - (rows - 1) / 2) * sp]); }
  return out;
}

// Colin's real characters (borrowed from the weirdport repo). Every rig is the Mixamo skeleton, so one set of
// clips drives all of them: the clips come from three DONOR files and are retargeted onto each rig by bone name.
// Nothing here is required: until the files load (or if they fail, e.g. the single-file artifact build) the
// box placeholders in models.js are used, and sync.js swaps squads over once this reports ready.
import { buildClutter } from './clutter.js?v=249';
import { GENB, BASE_PRE, SHIPS } from './models.js?v=249';
import { THREE } from './scene.js?v=249';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// Paths are relative to the PAGE, so this works on GitHub Pages (served from a subfolder, no build) and in vite dev.
const ROOT = new URL('./', document.baseURI).href;
const BASE = ROOT + 'models/characters/';
const HIPS = 'mixamorig_Hips', HAND = 'mixamorig_RightHand';

// Characters. h = drawn height in metres (humans ~1.6). own = clips the file carries that we use as-is.
const BRUTE_OWN = { idle: 'standing_idle', walk: 'standing_walk_forward', run: 'standing_run_forward', hit: 'Hit_To_Body', die: 'Shoulder_Hit_And_Fall', swing: 'standing_melee_attack_horizontal', stab: 'standing_melee_attack_downward', shoot: 'rifle_shoot_stationary_01' };
const CHARS = {
  hick: { file: 'hick_skinny.glb', h: 1.72, own: { idle: 'drunk_idle', walk: 'walking', run: 'running' } },
  biker1: { file: 'fat_biker_01.glb', h: 1.7 },
  biker2: { file: 'fat_biker_02.glb', h: 1.72 },
  activist: { file: 'fat_activist_01.glb', h: 1.6 },
  hippie: { file: 'fat_hippie.glb', h: 1.66 },
  hipster: { file: 'fat_hipster.glb', h: 1.68 },
  guard: { file: 'fat_secret_service.glb', h: 1.78 },
  moussa: { file: 'moussa.glb', h: 1.78, own: { idle: 'idle_neutral', walk: 'walk_fwd_swagger', run: 'run_fwd' } },
  jack: { file: 'jack.glb', h: 1.74 },
  blonde: { file: 'beautiful_blonde.glb', h: 1.66 },
  asian: { file: 'beautiful_asian.glb', h: 1.62, own: { walk: 'female_walk' } },
  officer: { file: 'dummy_officer.glb', h: 1.8 },
  // Colin's Brutes (Oct 22): Tripo meshes off his art, ARP rigs renamed to Mixamo, the warrior's + Colin's clips
  // baked in, so every state is an OWN clip (no retarget). The shooter walks with the rifle set.
  brute_grunt: { file: 'brute_grunt.glb', h: 1.5, own: BRUTE_OWN },
  brute_plated: { file: 'brute_plated.glb', h: 2.2, own: BRUTE_OWN },
  brute_hero: { file: 'brute_hero.glb', h: 2.4, own: BRUTE_OWN },
  brute_worker: { file: 'brute_worker.glb', h: 1.9, own: BRUTE_OWN },
  brute_skater: { file: 'brute_skater.glb', h: 2.0, own: BRUTE_OWN },
  brute_heavy: { file: 'brute_heavy.glb', h: 3.2, own: BRUTE_OWN },
  brute_cook: { file: 'brute_cook.glb', h: 1.6, own: BRUTE_OWN },
  brute_shooter: { file: 'brute_shooter.glb', h: 2.1, own: { ...BRUTE_OWN, idle: 'rifle_idle_01', walk: 'rifle_walk_fwd_01', run: 'rifle_run' } },
  builder: { file: 'contruction_worker.glb', h: 1.76, own: { idle: 'idle', walk: 'walk_fwd', swing: '1-handed_swing_01', stab: '2-handed-swing', hit: 'take_damage_01', die: 'hit_and_fall' } },
};
// Clip donors: our state name -> [donor key, clip name in that file].
// fat_biker_02 is the sober civilian set on a fat rig (what most of the cast is); the construction worker
// swings, the officer shoots.
const DONORS = { biker2: 'fat_biker_02.glb', worker: 'contruction_worker.glb', officer: 'dummy_officer.glb', moussa: 'moussa.glb' };
const CLIPS = {
  idle: ['biker2', 'idle'],
  walk: ['biker2', 'walk_fwd'],
  run: ['biker2', 'run_fwd'],
  hit: ['biker2', 'hit_take_damage_00'],
  die: ['biker2', 'hit_take_damage_and_fall'],
  swing: ['worker', '1-handed_swing_01'],
  stab: ['worker', '2-handed-swing'],
  shoot: ['officer', 'shoot_pistol'],
  // moussa's hip-hop set, retargeted onto everyone: Street Crew Breakdancers attack by dancing at you.
  dance1: ['moussa', 'dance_hiphop_01'],
  dance2: ['moussa', 'dance_hiphop_02'],
  dance3: ['moussa', 'dance_hiphop_03'],
};
export const ONCE = new Set(['hit', 'die', 'swing', 'stab', 'shoot', 'dance1', 'dance2', 'dance3']);
const DANCE = new Set(['dance1', 'dance2', 'dance3']);

// Who plays which unit. Members of a squad cycle through the list. prop = what is in the right hand.
// Slots not listed (vehicles, heroes, bikes) keep their placeholder.
export const CAST = {
  // Backwoods wears the BRUTES for now (Colin, Oct 22: "implement the alien race into the main game"): the species
  // factions are not in the sim yet, so the first species rides the first faction's slots. Grunts swarm, the plated
  // Brute and the Hero share the melee line, the thin Shooter shoots. Fists, no props: their swings are their own.
  bw: {
    worker: { who: ['brute_worker'], prop: 'pipewrench', atk: 'swing' },
    pike: { who: ['brute_grunt'], prop: 'club', atk: ['swing', 'stab'] },
    melee: { who: ['brute_plated', 'brute_hero'], prop: ['wrenchhammer', 'cleaver'], atk: ['swing', 'stab'] },
    ranged: { who: ['brute_shooter'], prop: 'blunderbuss', atk: 'shoot' },
  },
  om: {
    worker: { who: ['guard'], atk: 'swing' },
    pike: { who: ['guard'], prop: 'mallet', atk: 'swing' },
    melee: { who: ['guard'], atk: 'swing' },
    ranged: { who: ['guard'], prop: 'shotgun', atk: 'shoot' },
  },
  hh: {
    worker: { who: ['builder'], atk: 'swing' },
    pike: { who: ['builder'], prop: 'nailgun', atk: 'shoot' },
    melee: { who: ['builder'], prop: 'sledge', atk: 'stab' },
    ranged: { who: ['builder'], prop: 'level', atk: 'shoot' },
  },
  ac: {
    worker: { who: ['hipster'], atk: 'swing' },
    pike: { who: ['activist', 'hippie', 'hipster'], prop: 'sign', atk: 'stab' },
    melee: { who: ['hippie', 'activist'], atk: 'swing' },
    ranged: { who: ['hipster', 'activist'], prop: 'megaphone', atk: 'shoot' },
  },
  // Nerds: whoever is free on a Saturday - hipster, jack and the two women again, in costume (props do the talking).
  nd: {
    worker: { who: ['hipster', 'asian'], atk: 'swing' },
    pike: { who: ['jack', 'blonde', 'hipster', 'asian'], prop: 'foamsword', atk: 'stab' },
    melee: { who: ['blonde', 'jack', 'asian', 'hippie'], prop: 'shield', atk: 'swing' },
    ranged: { who: ['hipster', 'asian', 'jack'], prop: 'controller', atk: 'shoot' },
  },
  // The city (computer-run): road crews are the construction worker, police are the officer + the suited guard.
  city: {
    worker: { who: ['builder'], atk: 'swing' },
    pike: { who: ['officer', 'guard'], prop: 'baton', atk: 'swing' },
    ranged: { who: ['officer'], prop: 'shotgun', atk: 'shoot' },
    civ: { who: ['hipster', 'jack', 'blonde', 'hippie', 'asian', 'biker1', 'activist', 'moussa'], atk: 'swing' },
  },
  // Street Crew: a mixed crew (moussa, jack and the two women), everyone in sneakers. atk can be a list: one per member.
  sc: {
    worker: { who: ['jack', 'blonde'], atk: 'swing' },
    pike: { who: ['moussa', 'blonde', 'jack', 'asian'], prop: 'sneaker', atk: 'swing' },
    melee: { who: ['moussa', 'asian', 'jack', 'blonde'], atk: ['dance1', 'dance2', 'dance3'] },
    ranged: { who: ['asian', 'moussa', 'blonde', 'jack'], prop: 'boombox', atk: 'shoot' },
  },
};

const P = {}; // loaded prototypes: key -> { scene, scale, clips, hand }
let ready = false;
export const charsReady = () => ready;

const draco = new DRACOLoader();
draco.setDecoderPath(ROOT + 'draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
const LOADS = {}; // moussa is both a character and a clip donor: fetch each file once
const load = (f) => LOADS[f] || (LOADS[f] = loader.loadAsync(BASE + f));

// Rest pose: every bone's local rotation, plus the frame the Hips live in (its parents up to the model).
// Two export families exist (Armature > Hips, Armature > root > Hips) with the same net rotation, so a
// retarget between them is one constant rotation at the Hips. Same method as weirdport's `retarget`.
function bindOf(model) {
  const bones = {};
  model.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const h = bones[HIPS];
  if (!h) return null;
  const rest = {};
  for (const n in bones) rest[n] = bones[n].quaternion.clone();
  const pq = new THREE.Quaternion();
  for (let o = h.parent; o && o !== model; o = o.parent) pq.premultiply(o.quaternion);
  return { bones, rest, pq, t: h.position.clone() };
}

const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
function retarget(S, T, clip, name) {
  const D = T.pq.clone().invert().multiply(S.pq);
  const k = T.t.length() / (S.t.length() || 1);
  const tracks = [];
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.'), bone = t.name.slice(0, dot), prop = t.name.slice(dot + 1);
    if (!T.bones[bone]) continue;
    if (prop === 'position') {
      if (bone !== HIPS) continue; // bone lengths belong to the target
      const v = t.values, o = new Float32Array(v.length);
      for (let i = 0; i < v.length; i += 3) {
        _v.set(v[i] - S.t.x, v[i + 1] - S.t.y, v[i + 2] - S.t.z).applyQuaternion(D).multiplyScalar(k).add(T.t);
        // Keep the bob, drop the travel: the sim moves the squad, so root motion would slide him off his spot.
        o[i] = T.t.x; o[i + 1] = _v.y; o[i + 2] = T.t.z;
      }
      tracks.push(new t.constructor(t.name, t.times, o));
    } else if (prop === 'quaternion') {
      if (bone !== HIPS) { tracks.push(t); continue; }
      const v = t.values, o = new Float32Array(v.length);
      for (let i = 0; i < v.length; i += 4) {
        _q.set(v[i], v[i + 1], v[i + 2], v[i + 3]).premultiply(D);
        o[i] = _q.x; o[i + 1] = _q.y; o[i + 2] = _q.z; o[i + 3] = _q.w;
      }
      tracks.push(new t.constructor(t.name, t.times, o));
    }
  }
  return new THREE.AnimationClip(name, clip.duration, tracks);
}

// Authored height off the raw GEOMETRY. A skin is drawn by its bones and ignores its own node transform at
// bind (which here carries the armature's 0.01), so neither setFromObject nor matrixWorld gives the size.
function heightOf(model) {
  model.updateMatrixWorld(true);
  const b = new THREE.Box3();
  model.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox); } });
  return b.max.y - b.min.y || 1;
}

function fixMaterials(model) {
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false; // skinned bounds are the bind pose; a swing can leave them
    o.userData.shared = true; // geometry/material are shared by every clone: disposeObj must leave them
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) { m.side = THREE.FrontSide; m.transparent = false; m.alphaTest = 0; }
  });
}

export async function loadChars() {
  buildClutter(loader).catch(() => {}); // B249 ground clutter, in parallel with the cast
  try {
    const keys = Object.keys(CHARS), dk = Object.keys(DONORS);
    const [gl, dl] = await Promise.all([Promise.all(keys.map((k) => load(CHARS[k].file))), Promise.all(dk.map((k) => load(DONORS[k])))]);
    await Promise.all(Object.entries(GEN).map(([k, f]) => loader.loadAsync(ROOT + 'models/gen/' + f).then((g) => { GENS[k] = g.scene; }).catch(() => {})));
    const bases = [...Object.values(BASE_PRE).flatMap((p) => ['hq', 'depot', 'barracks', 'tower', 'wall'].map((k) => p + k)), ...Object.values(SHIPS).flatMap((o) => Object.values(o))];
    await Promise.all(bases.map((k) => loader.loadAsync(ROOT + 'models/gen/' + k + '.glb').then((g) => { GENB[k] = g.scene; }).catch(() => {})));
    const donor = {};
    dk.forEach((k, i) => (donor[k] = { bind: bindOf(dl[i].scene), clips: Object.fromEntries(dl[i].animations.map((a) => [a.name, a])) }));
    keys.forEach((k, i) => {
      const C = CHARS[k], g = gl[i], model = g.scene;
      fixMaterials(model);
      const bind = bindOf(model);
      const scale = C.h / heightOf(model);
      const clips = {};
      for (const st in CLIPS) {
        const [dkey, nm] = CLIPS[st], d = donor[dkey], src = d && d.clips[nm];
        if (src && bind && d.bind) clips[st] = retarget(d.bind, bind, src, st);
      }
      if (C.own) for (const st in C.own) { const a = g.animations.find((x) => x.name === C.own[st]); if (a) clips[st] = retarget(bind, bind, a, st); }
      // Hand frame at bind, so a prop can be given a direction in the model's own frame (+z forward, +y up).
      const hand = bind && bind.bones[HAND];
      let handQ = null, handS = 1;
      if (hand) {
        handQ = new THREE.Quaternion(); hand.getWorldQuaternion(handQ);
        const mq = new THREE.Quaternion(); model.getWorldQuaternion(mq); handQ.premultiply(mq.invert());
        hand.getWorldScale(_v); handS = _v.x;
      }
      P[k] = { model, scale, clips, handQ, handS };
    });
    ready = true;
  } catch (e) {
    console.warn('[chars] real characters unavailable, keeping placeholders:', e);
  }
}

// Props in metres, built pointing along +z, grip at the origin.
// The geometry worker's pieces (art/DELIVERED.md): metres, origin at the grip, business end along +Z -- the same
// frame these hand props use, so a worker piece drops straight in. Loaded with the cast; missing = the box prop.
const GEN = { club: 'w_brute_club.glb', blunderbuss: 'w_brute_blunderbuss.glb', wrenchhammer: 'w_brute_wrenchhammer.glb', cleaver: 'w_brute_cleaver.glb', pipewrench: 'w_brute_pipewrench.glb' };
const GENS = {};
// A melee prop held in a fist (same rule as the arena, B227): the haft runs pinky side to index side, edge where the
// fingers point. Guns and finger-less rigs keep the bind-forward rule.
const GUNS = new Set(['blunderbuss', 'shotgun', 'nailgun']);
function fistQ(hand, kind) {
  if (GUNS.has(kind)) return null;
  const kid = (n) => hand.children.find((o) => o.name === HAND + n);
  if (!kid('Index1') || !kid('Pinky1') || !kid('Middle1')) return null;
  const z = kid('Index1').position.clone().sub(kid('Pinky1').position).normalize(), fd = kid('Middle1').position.clone().normalize();
  const y = fd.negate().addScaledVector(z, -fd.dot(z)).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(y, z), y, z));
}
function prop(kind) {
  if (GENS[kind]) { const c = GENS[kind].clone(true); c.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.userData.shared = true; } }); return c; }
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const C2 = () => 0xf2e14c;
  const bx = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); g.add(m); };
  if (kind === 'pitchfork') { bx(0.05, 0.05, 1.8, 0x6b4a2a, 0, 0, 0.35); bx(0.3, 0.04, 0.04, 0xcccccc, 0, 0, 1.25); for (const x of [-0.13, 0, 0.13]) bx(0.03, 0.03, 0.3, 0xcccccc, x, 0, 1.4); }
  else if (kind === 'shotgun') { bx(0.07, 0.09, 0.9, 0x333333, 0, 0.02, 0.35); bx(0.08, 0.14, 0.35, 0x6b4a2a, 0, -0.02, -0.15); }
  else if (kind === 'bottle') { bx(0.09, 0.09, 0.26, 0x3c7a3a, 0, 0, 0.12); bx(0.04, 0.04, 0.12, 0x3c7a3a, 0, 0, 0.3); }
  else if (kind === 'nailgun') { bx(0.1, 0.18, 0.4, 0xf28c28, 0, 0, 0.18); bx(0.06, 0.06, 0.14, 0x333333, 0, 0.03, 0.42); bx(0.08, 0.2, 0.08, 0x333333, 0, -0.12, 0.02); }
  else if (kind === 'sledge') { bx(0.05, 0.05, 1.1, 0x6b4a2a, 0, 0, 0.35); bx(0.3, 0.18, 0.18, 0x555555, 0, 0, 0.9); }
  else if (kind === 'level') { bx(0.14, 0.14, 0.3, 0xf2c232, 0, 0, 0.12); bx(0.06, 0.06, 0.06, 0xff3030, 0, 0, 0.3); }
  else if (kind === 'mallet') { bx(0.04, 0.04, 1.2, 0xd9c8a0, 0, 0, 0.45); bx(0.28, 0.12, 0.12, 0xf4f1de, 0, 0, 1.05); }
  else if (kind === 'megaphone') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.4, 10), M(0xe85d9a)); c.rotation.x = Math.PI / 2; c.position.z = 0.25; g.add(c); }
  else if (kind === 'foamsword') { bx(0.06, 0.06, 0.25, 0x333333, 0, 0, 0.05); bx(0.3, 0.06, 0.06, C2(), 0, 0, 0.18); bx(0.1, 0.05, 1.1, 0x7fd1ff, 0, 0, 0.75); }
  else if (kind === 'shield') { bx(0.08, 0.6, 0.5, 0xd9d9d9, 0.12, 0, 0.1); bx(0.09, 0.3, 0.12, 0xf2e14c, 0.13, 0, 0.1); }
  else if (kind === 'controller') { bx(0.3, 0.08, 0.16, 0x222222, 0, 0, 0.12); bx(0.06, 0.04, 0.06, 0xff3030, 0.08, 0.05, 0.12); bx(0.03, 0.3, 0.03, 0x888888, -0.1, 0.15, 0.12); }
  else if (kind === 'baton') { bx(0.05, 0.05, 0.6, 0x111111, 0, 0, 0.25); bx(0.03, 0.12, 0.03, 0x111111, 0, -0.06, 0.05); }
  else if (kind === 'sneaker') { bx(0.12, 0.08, 0.3, 0xffffff, 0, 0, 0.18); bx(0.13, 0.03, 0.31, 0x7a3fd1, 0, -0.05, 0.18); bx(0.1, 0.1, 0.1, 0x7ee05b, 0, 0.07, 0.08); }
  else if (kind === 'boombox') {
    bx(0.5, 0.28, 0.14, 0x2a2a2a, 0, 0.18, 0.12); bx(0.4, 0.04, 0.04, 0x888888, 0, 0.35, 0.12);
    for (const x of [-0.14, 0.14]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 12), M(0x7a3fd1)); c.rotation.x = Math.PI / 2; c.position.set(x, 0.18, 0.2); g.add(c); }
  }
  else if (kind === 'sign') {
    bx(0.04, 0.04, 1.3, 0xcccccc, 0, 0, 0.45);
    bx(0.8, 0.05, 0.55, 0xf4f1de, 0, 0, 1.1); bx(0.5, 0.06, 0.1, 0xe85d9a, 0, 0, 1.15);
    g.rotation.x = -0.9; // tilt the board up off forward
    const w = new THREE.Group(); w.add(g); return w;
  }
  return g;
}

/** Worker kit: the Odd-Jobber pushes a wheelbarrow, the Gig Worker wears a delivery bag. Cash shows in it while carrying
 *  (sync.js toggles userData.cash / bulges userData.bag). Built in metres on the member group, not on a bone. */
function addCarry(g, f) {
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const bx = (p, w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); p.add(m); return m; };
  const cash = new THREE.Group();
  if (f === 'om') { // Old Money butlers carry a black briefcase that fattens with cash
    const bag = new THREE.Group(); bag.position.set(0.42, 0.75, 0.1); g.add(bag);
    bx(bag, 0.12, 0.38, 0.5, 0x1a1a1a, 0, 0, 0); bx(bag, 0.06, 0.08, 0.16, 0xd9b44a, 0, 0.22, 0);
    for (let i = 0; i < 2; i++) bx(cash, 0.1, 0.1, 0.16, 0x7cc46a, 0, 0.26, (i - 0.5) * 0.18);
    bag.add(cash); g.userData.bag = bag;
  } else if (f === 'sc') { // Street Crew Hustlers carry a sneaker box under the arm, cash poking out of the lid
    const bag = new THREE.Group(); bag.position.set(0.4, 0.85, 0.05); g.add(bag);
    bx(bag, 0.22, 0.2, 0.42, 0xf28c28, 0, 0, 0); bx(bag, 0.24, 0.05, 0.44, 0xffffff, 0, 0.12, 0); bx(bag, 0.23, 0.04, 0.12, 0x7a3fd1, 0, 0, 0.16);
    for (let i = 0; i < 3; i++) bx(cash, 0.06, 0.12, 0.14, 0x7cc46a, 0, 0.2, (i - 1) * 0.13);
    bag.add(cash); g.userData.bag = bag;
  } else if (f === 'nd') { // Nerds' Tech Support wear a laptop messenger bag on the hip that bulges with cash
    const bag = new THREE.Group(); bag.position.set(-0.3, 0.8, 0); g.add(bag);
    bx(bag, 0.1, 0.36, 0.48, 0x2f3446, 0, 0, 0); bx(bag, 0.11, 0.06, 0.48, 0x4a6fe3, 0, 0.12, 0); bx(bag, 0.03, 0.9, 0.06, 0x4a6fe3, 0.18, 0.35, 0);
    for (let i = 0; i < 2; i++) bx(cash, 0.1, 0.1, 0.16, 0x7cc46a, 0, 0.24, (i - 0.5) * 0.18);
    bag.add(cash); g.userData.bag = bag;
  } else if (f !== 'ac') { // Backwoods and Hard Hats push wheelbarrows
    const wb = new THREE.Group(); wb.position.set(0, 0, 0.75); g.add(wb);
    bx(wb, 0.62, 0.08, 0.7, 0x7a7a7a, 0, 0.42, 0.1); bx(wb, 0.62, 0.3, 0.06, 0x7a7a7a, 0, 0.55, 0.45); bx(wb, 0.06, 0.3, 0.7, 0x7a7a7a, 0.31, 0.55, 0.1); bx(wb, 0.06, 0.3, 0.7, 0x7a7a7a, -0.31, 0.55, 0.1);
    for (const x of [-0.22, 0.22]) bx(wb, 0.05, 0.05, 0.75, 0x5a3d26, x, 0.6, -0.4);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), M(0x222222)); w.rotation.z = Math.PI / 2; w.position.set(0, 0.18, 0.5); wb.add(w);
    for (let i = 0; i < 6; i++) bx(cash, 0.18, 0.1, 0.12, i % 2 ? 0x7cc46a : 0xf5b83a, (i % 3 - 1) * 0.17, 0.62 + (i > 2 ? 0.1 : 0), 0.05 + (i % 2) * 0.12);
    wb.add(cash); g.userData.wheel = w;
  } else {
    const bag = new THREE.Group(); bag.position.set(0, 1.15, -0.3); g.add(bag);
    bx(bag, 0.5, 0.48, 0.32, 0x2cc2ad, 0, 0, 0); bx(bag, 0.52, 0.08, 0.34, 0x1c4f57, 0, 0.26, 0);
    for (let i = 0; i < 3; i++) bx(cash, 0.16, 0.12, 0.1, 0x7cc46a, (i - 1) * 0.15, 0.36, 0);
    bag.add(cash); g.userData.bag = bag;
  }
  cash.visible = false; g.userData.cash = cash;
}
/** A real character for (faction, slot), or null if not cast / not loaded. Same contract as makeMember. */
export function makeChar(f, slot, i) {
  const c = ready && CAST[f] && CAST[f][slot];
  if (!c) return null;
  const p = P[c.who[i % c.who.length]];
  if (!p) return null;
  const m = skClone(p.model);
  m.scale.setScalar(p.scale);
  const g = new THREE.Group(); g.add(m);
  if (c.prop && p.handQ) {
    let hand = null; m.traverse((o) => { if (o.isBone && o.name === HAND) hand = o; });
    if (hand) {
      const kind = Array.isArray(c.prop) ? c.prop[i % c.prop.length] : c.prop, pr = prop(kind);
      pr.quaternion.copy(fistQ(hand, kind) || p.handQ.clone().invert()); // a club through the FIST, else model-forward at bind
      pr.scale.setScalar(1 / (p.handS * p.scale)); // metres in the world: the hand's armature scale AND the body's height fit
      // (B228: without the second the Brutes, authored small and scaled up, waved wrench-hammers the size of a door)
      hand.add(pr);
    }
  }
  const mixer = new THREE.AnimationMixer(m), actions = {};
  for (const st in p.clips) {
    const a = mixer.clipAction(p.clips[st]);
    if (ONCE.has(st)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    actions[st] = a;
  }
  if (slot === 'worker') addCarry(g, f);
  g.userData.anim = { jit: 0.88 + Math.random() * 0.24, mixer, actions, cur: null, atk: Array.isArray(c.atk) ? c.atk[i % c.atk.length] : c.atk, lock: 0 };
  if (actions.idle) { actions.idle.play(); g.userData.anim.cur = 'idle'; mixer.update(Math.random() * 3); }
  return g;
}

/** Cross-fade a member to a state. ONCE states hold for their clip length (lock) unless forced. */
export function play(g, st, force) {
  const A = g.userData.anim;
  if (!A || !A.actions[st]) return;
  if (A.cur === st && !ONCE.has(st)) return;
  if (A.lock > 0 && !force) return;
  if (force && st === A.cur && DANCE.has(st) && A.lock > 0) return; // a dance runs its course: each hit does not restart it
  const next = A.actions[st], prev = A.cur && A.actions[A.cur];
  next.reset(); next.setEffectiveTimeScale(1); next.setEffectiveWeight(1);
  if (!ONCE.has(st)) next.time = Math.random() * next.getClip().duration; // loops start at a random point: no marching in lockstep
  if (prev && prev !== next) next.crossFadeFrom(prev, 0.18, false);
  next.play();
  A.cur = st;
  A.lock = ONCE.has(st) ? Math.min(DANCE.has(st) ? 4 : 99, next.getClip().duration * 0.85) : 0;
}

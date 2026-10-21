// Colin's real characters (borrowed from the weirdport repo). Every rig is the Mixamo skeleton, so one set of
// clips drives all of them: the clips come from three DONOR files and are retargeted onto each rig by bone name.
// Nothing here is required: until the files load (or if they fail, e.g. the single-file artifact build) the
// box placeholders in models.js are used, and sync.js swaps squads over once this reports ready.
import { THREE } from './scene.js?v=20';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// Paths are relative to the PAGE, so this works on GitHub Pages (served from a subfolder, no build) and in vite dev.
const ROOT = new URL('./', document.baseURI).href;
const BASE = ROOT + 'models/characters/';
const HIPS = 'mixamorig_Hips', HAND = 'mixamorig_RightHand';

// Characters. h = drawn height in metres (humans ~1.6). own = clips the file carries that we use as-is.
const CHARS = {
  hick: { file: 'hick_skinny.glb', h: 1.72, own: { idle: 'drunk_idle', walk: 'walking', run: 'running' } },
  biker1: { file: 'fat_biker_01.glb', h: 1.7 },
  biker2: { file: 'fat_biker_02.glb', h: 1.72 },
  activist: { file: 'fat_activist_01.glb', h: 1.6 },
  hippie: { file: 'fat_hippie.glb', h: 1.66 },
  hipster: { file: 'fat_hipster.glb', h: 1.68 },
};
// Clip donors: our state name -> [donor key, clip name in that file].
// fat_biker_02 is the sober civilian set on a fat rig (what most of the cast is); the construction worker
// swings, the officer shoots.
const DONORS = { biker2: 'fat_biker_02.glb', worker: 'contruction_worker.glb', officer: 'dummy_officer.glb' };
const CLIPS = {
  idle: ['biker2', 'idle'],
  walk: ['biker2', 'walk_fwd'],
  run: ['biker2', 'run_fwd'],
  hit: ['biker2', 'hit_take_damage_00'],
  die: ['biker2', 'hit_take_damage_and_fall'],
  swing: ['worker', '1-handed_swing_01'],
  stab: ['worker', '2-handed-swing'],
  shoot: ['officer', 'shoot_pistol'],
};
export const ONCE = new Set(['hit', 'die', 'swing', 'stab', 'shoot']);

// Who plays which unit. Members of a squad cycle through the list. prop = what is in the right hand.
// Slots not listed (vehicles, heroes, bikes) keep their placeholder.
export const CAST = {
  bw: {
    worker: { who: ['hick'], atk: 'swing' },
    pike: { who: ['hick'], prop: 'pitchfork', atk: 'stab' },
    melee: { who: ['biker1', 'biker2'], prop: 'bottle', atk: 'swing' },
    ranged: { who: ['hick'], prop: 'shotgun', atk: 'shoot' },
  },
  ac: {
    worker: { who: ['hipster'], atk: 'swing' },
    pike: { who: ['activist', 'hippie', 'hipster'], prop: 'sign', atk: 'stab' },
    melee: { who: ['hippie', 'activist'], atk: 'swing' },
    ranged: { who: ['hipster', 'activist'], prop: 'megaphone', atk: 'shoot' },
  },
};

const P = {}; // loaded prototypes: key -> { scene, scale, clips, hand }
let ready = false;
export const charsReady = () => ready;

const draco = new DRACOLoader();
draco.setDecoderPath(ROOT + 'draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
const load = (f) => loader.loadAsync(BASE + f);

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
  try {
    const keys = Object.keys(CHARS), dk = Object.keys(DONORS);
    const [gl, dl] = await Promise.all([Promise.all(keys.map((k) => load(CHARS[k].file))), Promise.all(dk.map((k) => load(DONORS[k])))]);
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
function prop(kind) {
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const bx = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); g.add(m); };
  if (kind === 'pitchfork') { bx(0.05, 0.05, 1.8, 0x6b4a2a, 0, 0, 0.35); bx(0.3, 0.04, 0.04, 0xcccccc, 0, 0, 1.25); for (const x of [-0.13, 0, 0.13]) bx(0.03, 0.03, 0.3, 0xcccccc, x, 0, 1.4); }
  else if (kind === 'shotgun') { bx(0.07, 0.09, 0.9, 0x333333, 0, 0.02, 0.35); bx(0.08, 0.14, 0.35, 0x6b4a2a, 0, -0.02, -0.15); }
  else if (kind === 'bottle') { bx(0.09, 0.09, 0.26, 0x3c7a3a, 0, 0, 0.12); bx(0.04, 0.04, 0.12, 0x3c7a3a, 0, 0, 0.3); }
  else if (kind === 'megaphone') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.4, 10), M(0xe85d9a)); c.rotation.x = Math.PI / 2; c.position.z = 0.25; g.add(c); }
  else if (kind === 'sign') {
    bx(0.04, 0.04, 1.3, 0xcccccc, 0, 0, 0.45);
    bx(0.8, 0.05, 0.55, 0xf4f1de, 0, 0, 1.1); bx(0.5, 0.06, 0.1, 0xe85d9a, 0, 0, 1.15);
    g.rotation.x = -0.9; // tilt the board up off forward
    const w = new THREE.Group(); w.add(g); return w;
  }
  return g;
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
      const pr = prop(c.prop);
      pr.quaternion.copy(p.handQ).invert(); // undo the hand's bind rotation: the prop points model-forward at bind
      pr.scale.setScalar(1 / p.handS); // the hand lives under the 0.01 armature: give the prop metres back
      hand.add(pr);
    }
  }
  const mixer = new THREE.AnimationMixer(m), actions = {};
  for (const st in p.clips) {
    const a = mixer.clipAction(p.clips[st]);
    if (ONCE.has(st)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    actions[st] = a;
  }
  g.userData.anim = { mixer, actions, cur: null, atk: c.atk, lock: 0 };
  if (actions.idle) { actions.idle.play(); g.userData.anim.cur = 'idle'; mixer.update(Math.random() * 3); }
  return g;
}

/** Cross-fade a member to a state. ONCE states hold for their clip length (lock) unless forced. */
export function play(g, st, force) {
  const A = g.userData.anim;
  if (!A || !A.actions[st]) return;
  if (A.cur === st && !ONCE.has(st)) return;
  if (A.lock > 0 && !force) return;
  const next = A.actions[st], prev = A.cur && A.actions[A.cur];
  next.reset(); next.setEffectiveTimeScale(1); next.setEffectiveWeight(1);
  if (prev && prev !== next) next.crossFadeFrom(prev, 0.18, false);
  next.play();
  A.cur = st;
  A.lock = ONCE.has(st) ? next.getClip().duration * 0.85 : 0;
}

// Duel arena (Colin, Oct 22 2026): drop two fighters in a ring and watch them go at it, up close and side-on.
// A sandbox for the "every fight is a little duel" direction (docs/design.md, Combat depth): blocks, misses, glancing
// hits, staggers, knockdowns and some luck, tuned here before squads in the RTS inherit it. Standalone page: it shares
// three.js, the Draco decoder and the icons with the game and nothing else.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { svg } from '../ui/icons.js?v=157';

// ---------------------------------------------------------------- data (all the numbers worth tuning live here)
// Contact fractions (`at`) are MEASURED, not guessed: the striking hand or foot's fastest frame in the clip
// (blender-addons/pipeline/contact.py on the warrior's clips). `spd` plays a clip faster than authored.
const MELEE = {
  reach: 1.7, idle: 'standing_idle', walk: 'standing_walk_forward', run: 'standing_run_forward',
  attacks: [
    { c: 'standing_melee_attack_horizontal', at: 0.41, dmg: 16, reach: 2.1, spd: 1.35 },
    { c: 'standing_melee_attack_downward', at: 0.38, dmg: 21, reach: 2.0, spd: 1.35, big: 0.25 },
    { c: 'standing_melee_attack_backhand', at: 0.35, dmg: 14, reach: 2.0, spd: 1.45 },
    { c: 'standing_melee_attack_kick_ver._1', at: 0.31, dmg: 10, reach: 1.9, spd: 1.3, knock: 2.6 },
  ],
  block: 'standing_block_idle', blockHit: 'standing_block_react_large',
  hits: ['Hit_To_Body', 'Head_Hit', 'standing_react_large_gut'], fall: 'Shoulder_Hit_And_Fall', getup: 'Getting_Up',
  taunt: 'standing_taunt_chest_thump',
};
const GUN = {
  ...MELEE, reach: 1.7, keep: [4.5, 8.5], idle: 'rifle_idle_01', walk: 'rifle_walk_fwd_01', run: 'rifle_run',
  shoot: { c: 'rifle_shoot_stationary_01', at: 0.31, dmg: 7, spd: 1 }, fall: 'fall_to_back', getup: 'get_up_from_back',
};
const RIGS = {
  warrior: { file: 'models/characters/alien_warrior.glb', own: 'mace' },   // his own weapon_root bone carries the mace
  demon: { file: 'models/characters/demon.glb', tail: /^c_tail_\d+/ },
};
// Borrowed weapons. A rig with no mount bone still gets the weapon in its RIGHT HAND at the grip the weapon's own rig
// holds it at in rest pose: offset from the hand / rig height, rotation in model space (both donors read IDENTITY),
// mount scale / rig height. Measured from the donor files (blender-addons/pipeline/mount.mjs), not typed by eye.
const WEAPONS = {
  mace: { file: 'models/weapons/spikey_mace.glb', off: [-0.0817, -0.0321, 0.0023], s: 0.0129 },          // alien_warrior
  blaster: { file: 'models/weapons/alien_antenna_blaster_game.glb', off: [-0.0877, 0.0171, 0.0425], s: 0.011 }, // zap
};
const ROSTER = [
  { name: 'WARRIOR', rig: 'warrior', style: MELEE, h: 1.9, hp: 150, speed: 1, weapon: 'mace' },
  { name: 'BRUTE', rig: 'demon', style: MELEE, h: 2.25, hp: 180, speed: 0.9, weapon: 'mace' },
  { name: 'GUNNER', rig: 'demon', style: GUN, h: 2.05, hp: 130, speed: 1, weapon: 'blaster' },
];
const RULE = {
  think: 0.22,       // seconds between decisions
  miss: 0.12,        // a swing that just whiffs
  dodge: 0.08,       // defender steps out of it (only if not busy)
  glance: 0.25,      // half damage, light flinch
  crit: 0.1,         // a clean hit that floors him
  readBlock: 0.35,   // chance a fighter sees a swing coming and blocks it
  blockKeep: 0.12,   // damage that gets through a block
  hitstop: 0.075,    // both fighters freeze on a clean hit
  ring: 9,           // arena radius (m)
};

// ---------------------------------------------------------------- three setup
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b2f3a); scene.fog = new THREE.Fog(0x2b2f3a, 18, 40);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x4a3c2c, 1.3));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.4); sun.position.set(6, 12, 4); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
scene.add(sun);
const rim = new THREE.DirectionalLight(0x9fc6ff, 1.1); rim.position.set(-6, 5, -8); scene.add(rim);
{ // the ring: sand disc, a darker rope line, a few posts
  const floor = new THREE.Mesh(new THREE.CircleGeometry(RULE.ring + 1.5, 64), new THREE.MeshStandardMaterial({ color: 0xb79c74, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const line = new THREE.Mesh(new THREE.RingGeometry(RULE.ring - 0.12, RULE.ring, 64), new THREE.MeshBasicMaterial({ color: 0x5a4632 }));
  line.rotation.x = -Math.PI / 2; line.position.y = 0.01; scene.add(line);
  const outer = new THREE.Mesh(new THREE.CircleGeometry(60, 32), new THREE.MeshStandardMaterial({ color: 0x3a3f4c, roughness: 1 }));
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.02; scene.add(outer);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x6b4a2a }));
    p.position.set(Math.cos(a) * (RULE.ring + 0.3), 0.7, Math.sin(a) * (RULE.ring + 0.3)); p.castShadow = true; scene.add(p);
  }
}

// ---------------------------------------------------------------- loading
const ROOT = new URL('../../', import.meta.url).href;
const draco = new DRACOLoader(); draco.setDecoderPath(ROOT + 'draco/');
const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
const load = (p) => new Promise((ok, no) => loader.load(ROOT + p, ok, undefined, no));
const HIPS = 'mixamorig_Hips';
function heightOf(model) { // skinned geometry bounds (the armature carries 0.01, so setFromObject lies)
  const b = new THREE.Box3();
  model.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox); } });
  return b;
}
function inPlace(clip) { // keep the hips' bob, drop their travel: the duel moves the fighter itself
  for (const t of clip.tracks) {
    if (!t.name.endsWith('.position') || !t.name.startsWith(HIPS)) continue;
    const v = t.values, x0 = v[0], z0 = v[2];
    for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
  }
  return clip;
}
async function loadRig(key) {
  const R = RIGS[key], g = await load(R.file);
  const clips = {}; for (const c of g.animations) clips[c.name] = inPlace(c);
  return { key, scene: g.scene, clips, box: heightOf(g.scene), R };
}
async function loadWeapon(key) { // geometry + transform relative to the file's own weapon_root (Weirdport's weaponParts)
  const w = await load(WEAPONS[key].file); let root = null;
  w.scene.traverse((o) => { if (!root && /^weapon_root/.test(o.name)) root = o; });
  if (!root) return null;
  w.scene.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert(); const parts = [];
  root.traverse((o) => { if (o.isMesh) parts.push({ g: o.geometry, m: o.material, x: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld) }); });
  return { key, root: root.name, parts };
}
const WEAPDATA = {};
function weaponMesh(W, mats) {
  const g = new THREE.Group();
  for (const q of W.parts) { const m = new THREE.Mesh(q.g, tint(q.m.clone(), mats)); m.matrixAutoUpdate = false; m.matrix.copy(q.x); m.castShadow = true; m.frustumCulled = false; g.add(m); }
  return g;
}

// ---------------------------------------------------------------- effects
const SPARK_N = 400;
const spark = { pos: new Float32Array(SPARK_N * 3), col: new Float32Array(SPARK_N * 3), vel: [], life: new Float32Array(SPARK_N), i: 0 };
for (let i = 0; i < SPARK_N; i++) spark.vel.push(new THREE.Vector3());
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(spark.pos, 3)); sparkGeo.setAttribute('color', new THREE.BufferAttribute(spark.col, 3));
const sparkPts = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
sparkPts.frustumCulled = false; scene.add(sparkPts);
function burst(p, dir, color, n, speed) {
  const c = new THREE.Color(color);
  for (let k = 0; k < n; k++) {
    const i = spark.i = (spark.i + 1) % SPARK_N;
    spark.pos.set([p.x, p.y, p.z], i * 3); spark.col.set([c.r, c.g, c.b], i * 3); spark.life[i] = 0.25 + Math.random() * 0.35;
    spark.vel[i].set(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(speed).addScaledVector(dir, speed * 0.8);
  }
}
function stepSparks(dt) {
  for (let i = 0; i < SPARK_N; i++) {
    if (spark.life[i] <= 0) continue;
    spark.life[i] -= dt; const v = spark.vel[i]; v.y -= 9 * dt; v.multiplyScalar(Math.exp(-3 * dt));
    spark.pos[i * 3] += v.x * dt; spark.pos[i * 3 + 1] += v.y * dt; spark.pos[i * 3 + 2] += v.z * dt;
    if (spark.life[i] <= 0) { spark.pos[i * 3 + 1] = -99; }
  }
  sparkGeo.attributes.position.needsUpdate = true;
}
const tracers = [];
function tracer(a, b, hit) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: hit ? 0xfff2a8 : 0xa0d8ff, transparent: true }));
  scene.add(l); tracers.push({ l, t: 0.09 });
}
let shake = 0;

// sound: Colin's own recordings from Weirdport, decoded on the first tap (browsers block audio before one)
const SND = { hit: ['hit_sound_01', 'hit_sound_02', 'hit_sound_03'], heavy: ['hit_sound_gound_01'], swing: ['swoosh_01', 'swoosh_02', 'swoosh_03'],
  clang: ['metal_clang_01', 'metal_clang_02'], grunt: ['alien_orc_grunt_01', 'alien_orc_grunt_03', 'alien_orc_grunt_05'], shot: ['blaster_sound_01'] };
let actx = null; const buf = {};
function audioOn() {
  if (actx) return; actx = new (window.AudioContext || window.webkitAudioContext)();
  for (const k in SND) for (const n of SND[k]) fetch(ROOT + 'audio/duel/' + n + '.mp3').then((r) => r.arrayBuffer()).then((a) => actx.decodeAudioData(a)).then((b) => (buf[n] = b)).catch(() => {});
}
function sound(kind, vol = 0.7) {
  if (!actx) return; const list = SND[kind], b = buf[list[(Math.random() * list.length) | 0]]; if (!b) return;
  const s = actx.createBufferSource(), g = actx.createGain(); s.buffer = b; s.playbackRate.value = 0.92 + Math.random() * 0.16; g.gain.value = vol;
  s.connect(g).connect(actx.destination); s.start();
}

// ---------------------------------------------------------------- team tint
// Rotates the HUE of the strongly coloured texels only (painted armour, cloth, skin markings); greys, steel and leather
// stay put, so "same race, other team" reads at a glance. One uniform object per fighter, shared by all his materials.
const TEAM_HUE = [0, 2.6];   // radians; the right-hand fighter starts on another team
const HUES = [0, 1.05, 2.1, 2.6, 3.6, 4.6];
function tint(mat, list, hue) {
  mat.emissive = new THREE.Color(0); list.push(mat);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uHue = mat.userData.hue || hue || { value: 0 };
    sh.fragmentShader = 'uniform float uHue;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      {
        vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
        float w = smoothstep(0.3, 0.5, mx > 0.0 ? (mx - mn) / mx : 0.0) * step(0.001, abs(uHue));
        const mat3 toY = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
        const mat3 toR = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
        vec3 y = toY * c; float h = atan(y.z, y.y) + uHue, r = length(y.yz); y.yz = vec2(cos(h), sin(h)) * r;
        diffuseColor.rgb = mix(c, max(toR * y, 0.0), w);
      }`);
  };
  return mat;
}

// ---------------------------------------------------------------- fighters
let rng = Math.random;
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const RIGDATA = {};
const fighters = [];
function spawn(def, side) {
  const R = RIGDATA[def.rig], model = skClone(R.scene), k = def.h / (R.box.max.y - R.box.min.y);
  const root = new THREE.Group(); model.scale.setScalar(k); model.position.y = -R.box.min.y * k; root.add(model);
  const mats = [], hue = { value: TEAM_HUE[side < 0 ? 0 : 1] };
  model.traverse((o) => {
    if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
    o.material = tint(o.material.clone(), mats, hue);
  });
  let hand = null; model.traverse((o) => { if (!hand && o.isBone && o.name === 'mixamorig_RightHand') hand = o; });
  const W = def.weapon && WEAPDATA[def.weapon];
  if (W) {
    let own = null; if (R.R.own === def.weapon) model.traverse((o) => { if (!own && o.isBone && o.name === W.root) own = o; });
    if (own) own.add(weaponMesh(W, mats)); // his own mount bone: identity
    else if (hand) { // borrowed: the donor's rest grip, carried over in model space and scaled by height
      model.updateMatrixWorld(true);
      const toModel = model.matrixWorld.clone().invert(), handM = toModel.clone().multiply(hand.matrixWorld);
      const H = R.box.max.y - R.box.min.y, G = WEAPONS[def.weapon], hp = new THREE.Vector3().setFromMatrixPosition(handM);
      const want = new THREE.Matrix4().compose(hp.add(new THREE.Vector3(...G.off).multiplyScalar(H)), new THREE.Quaternion(), new THREE.Vector3().setScalar(G.s * H));
      const mount = new THREE.Group(); mount.matrixAutoUpdate = false; mount.matrix.copy(handM.invert().multiply(want));
      mount.add(weaponMesh(W, mats)); hand.add(mount);
    }
  }
  for (const m of mats) m.userData.hue = hue;
  const tail = []; if (R.R.tail) model.traverse((o) => { if (o.isBone && R.R.tail.test(o.name)) tail.push({ b: o, q: o.quaternion.clone() }); });
  tail.sort((a, b) => a.b.name.localeCompare(b.b.name));
  const mixer = new THREE.AnimationMixer(model), actions = {};
  for (const n in R.clips) actions[n] = mixer.clipAction(R.clips[n]);
  const f = { def, side, root, model, mixer, actions, mats, hand, tail, hue, hp: def.hp, cur: null, state: 'idle', t: 0, think: 0,
    vel: new THREE.Vector3(), flash: 0, swingDone: false, move: null, ko: false, h: def.h };
  root.position.set(side * 3.2, 0, 0); scene.add(root); play(f, def.style.idle);
  return f;
}
function play(f, name, once = false, speed = 1, fade = 0.15) {
  const a = f.actions[name]; if (!a) return null;
  if (!once && f.cur === a) return a;
  a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.timeScale = speed; a.setEffectiveWeight(1); a.play();
  if (f.cur && f.cur !== a) f.cur.crossFadeTo(a, fade, false);
  f.cur = a; return a;
}
const dur = (f, name, speed = 1) => (f.actions[name] ? f.actions[name].getClip().duration / speed : 0.6);
const other = (f) => fighters.find((o) => o !== f);
const flat = (a, b) => new THREE.Vector3(b.root.position.x - a.root.position.x, 0, b.root.position.z - a.root.position.z);
const facing = (a, b) => { const d = flat(a, b).normalize(); return Math.sin(a.root.rotation.y) * d.x + Math.cos(a.root.rotation.y) * d.z; };
const chest = (f) => f.root.position.clone().setY(f.h * 0.62);
function setState(f, s, t) { f.state = s; f.t = t; }

function brain(f, dt) {
  const o = other(f), S = f.def.style, d = flat(f, o).length();
  if (o.ko) { if (f.state !== 'taunt') { setState(f, 'taunt', 99); play(f, S.taunt, false); } return; }
  if (!['idle', 'move'].includes(f.state)) return;
  if ((f.think -= dt) > 0) return; f.think = RULE.think * (0.6 + rng() * 0.8);
  // seeing a swing coming: block it
  if (o.state === 'attack' && o.move && o.prog < o.move.at && d < o.move.reach + 0.6 && rng() < RULE.readBlock) {
    setState(f, 'block', 0.5 + rng() * 0.5); play(f, S.block); return;
  }
  if (S.shoot && d > S.keep[0] && d < S.keep[1]) return startShot(f);
  const want = S.shoot && d > S.keep[1] ? S.keep[1] - 1 : S.reach;
  if (d > want + 0.2) { setState(f, 'move', 0); return; }
  const r = rng();
  if (r < 0.62) startAttack(f, S.attacks[(rng() * S.attacks.length) | 0]);
  else if (r < 0.8) { setState(f, 'block', 0.4 + rng() * 0.6); play(f, S.block); }
  else { setState(f, 'idle', 0); f.think = 0.3 + rng() * 0.4; play(f, S.idle); }
}
function startAttack(f, m) {
  f.move = m; f.prog = 0; f.swingDone = false; setState(f, 'attack', dur(f, m.c, m.spd)); play(f, m.c, true, m.spd, 0.1); sound('swing', 0.35);
}
function startShot(f) {
  const m = f.def.style.shoot; f.move = { ...m, reach: 99, ranged: true }; f.prog = 0; f.swingDone = false;
  setState(f, 'attack', dur(f, m.c, m.spd)); play(f, m.c, true, m.spd, 0.1);
}
function resolve(a) { // the moment of contact: block, miss, dodge, glance, hit or floor
  const b = other(a), m = a.move, d = flat(a, b).length(), dir = flat(a, b).normalize(), at = chest(b);
  if (m.ranged) {
    const from = a.hand ? a.hand.getWorldPosition(new THREE.Vector3()) : chest(a);
    sound('shot', 0.4); burst(from, dir, 0xffd27a, 6, 2);
    const hitP = Math.max(0.25, 0.85 - d * 0.04);
    if (b.ko || b.state === 'down' || rng() > hitP) { tracer(from, at.clone().add(new THREE.Vector3(rng() - 0.5, rng() * 0.6, rng() - 0.5)), false); return; }
    tracer(from, at, true);
    if (b.state === 'block' && facing(b, a) > 0.2) return blocked(a, b, m, dir, 0.3);
    return hurt(a, b, m.dmg * (0.8 + rng() * 0.4), dir, 0.35, false);
  }
  if (b.ko || b.state === 'down' || b.state === 'getup' || d > m.reach + 0.3 || facing(a, b) < 0.3) { sound('swing', 0.25); return; }
  if (b.state === 'block' && facing(b, a) > 0.2) return blocked(a, b, m, dir, RULE.blockKeep);
  const r = rng();
  if (r < RULE.miss) { sound('swing', 0.3); return; }
  if (r < RULE.miss + RULE.dodge && ['idle', 'move'].includes(b.state)) { // sidestep
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(rng() < 0.5 ? 1 : -1);
    b.vel.addScaledVector(side, 4).addScaledVector(dir, 1.5); sound('swing', 0.3); return;
  }
  if (r < RULE.miss + RULE.dodge + RULE.glance) return hurt(a, b, m.dmg * 0.5, dir, 0.4, false, true);
  const floor = rng() < (m.big || RULE.crit);
  hurt(a, b, m.dmg * (0.85 + rng() * 0.3), dir, m.knock || 1.3, floor);
}
function blocked(a, b, m, dir, keep) {
  b.hp -= m.dmg * keep; play(b, b.def.style.blockHit, true, 1.2, 0.08); setState(b, 'block', dur(b, b.def.style.blockHit, 1.2) * 0.7);
  b.vel.addScaledVector(dir, 1.2); burst(chest(b).addScaledVector(dir, -0.3), dir.clone().negate(), 0x9fe0ff, 14, 3); sound('clang', 0.5); shake = Math.max(shake, 0.06);
  if (b.hp <= 0) ko(b, dir);
}
function hurt(a, b, dmg, dir, knock, floor, light = false) {
  b.hp -= dmg; b.flash = 1; hitstop = RULE.hitstop * (light ? 0.5 : 1); shake = Math.max(shake, light ? 0.06 : floor ? 0.25 : 0.14);
  const p = chest(b).addScaledVector(dir, -0.25);
  burst(p, dir.clone().negate().add(new THREE.Vector3(0, 0.4, 0)), floor ? 0xffa040 : 0xffe07a, light ? 10 : 24, light ? 2.5 : 4.5);
  sound(floor ? 'heavy' : 'hit', light ? 0.45 : 0.8); if (rng() < 0.35) setTimeout(() => sound('grunt', 0.5), 60);
  b.vel.addScaledVector(dir, knock * 2.2);
  if (b.hp <= 0) return ko(b, dir);
  const S = b.def.style;
  if (floor) { setState(b, 'down', dur(b, S.fall, 1.2) * 0.85); play(b, S.fall, true, 1.2, 0.08); b.vel.addScaledVector(dir, 2.5); return; }
  const h = light ? S.hits[1] : S.hits[(rng() * S.hits.length) | 0];
  setState(b, 'hit', dur(b, h, 1.4) * 0.75); play(b, h, true, 1.4, 0.06);
}
function ko(b, dir) {
  b.ko = true; b.hp = 0; setState(b, 'ko', 99); play(b, b.def.style.fall, true, 1, 0.08); b.vel.addScaledVector(dir, 3);
  sound('heavy', 0.9); shake = 0.3; hud();
}
let hitstop = 0;

function stepFighter(f, dt) {
  const o = other(f), S = f.def.style;
  f.t -= dt; brain(f, dt);
  // turn to face the other one (not while flat on the floor)
  if (!['down', 'ko', 'getup'].includes(f.state)) {
    const d = flat(f, o), want = Math.atan2(d.x, d.z); let dy = want - f.root.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.root.rotation.y += dy * Math.min(1, dt * 8);
  }
  if (f.state === 'move') {
    const d = flat(f, o), dist = d.length(), want = S.shoot && dist > S.keep[1] ? S.keep[1] - 1 : S.reach;
    if (dist <= want) { setState(f, 'idle', 0); play(f, S.idle); }
    else { const run = dist > 4.5, sp = (run ? 3.4 : 1.4) * f.def.speed * (f.h / 1.9); play(f, run ? S.run : S.walk); f.root.position.addScaledVector(d.normalize(), sp * dt); }
  }
  if (f.state === 'attack') {
    f.prog = 1 - f.t / dur(f, f.move.c, f.move.spd);
    if (!f.swingDone && f.prog >= f.move.at) { f.swingDone = true; resolve(f); }
    if (f.t <= 0) { setState(f, 'idle', 0); f.think = 0.15 + rng() * 0.35; play(f, S.idle); }
  }
  if ((f.state === 'block' || f.state === 'hit') && f.t <= 0) { setState(f, 'idle', 0); play(f, S.idle); }
  if (f.state === 'down' && f.t <= 0) { setState(f, 'getup', dur(f, S.getup, 1.3) * 0.9); play(f, S.getup, true, 1.3, 0.1); }
  if (f.state === 'getup' && f.t <= 0) { setState(f, 'idle', 0); play(f, S.idle, false, 1, 0.25); }
  // knockback slide, ring edge, and no walking through each other
  f.root.position.addScaledVector(f.vel, dt); f.vel.multiplyScalar(Math.exp(-6 * dt));
  const r = Math.hypot(f.root.position.x, f.root.position.z); if (r > RULE.ring - 0.6) f.root.position.multiplyScalar((RULE.ring - 0.6) / r);
  const d = flat(o, f), dl = d.length(), min = 0.95;
  if (dl < min && dl > 1e-4) f.root.position.addScaledVector(d.normalize(), (min - dl) * 0.5);
  // hit flash
  if (f.flash > 0) { f.flash = Math.max(0, f.flash - dt * 6); for (const m of f.mats) m.emissive.setRGB(f.flash * 0.6, f.flash * 0.1, f.flash * 0.06); }
}
function stepTail(f, time) { // procedural sway: a travelling wave down the chain, bigger towards the tip, kicked by speed
  if (!f.tail.length) return;
  const sp = Math.min(1.5, f.vel.length() * 0.3 + (f.state === 'move' ? 0.6 : 0.15));
  f.tail.forEach((t, i) => {
    const k = (i + 1) / f.tail.length, a = Math.sin(time * 3.2 - i * 0.7) * 0.22 * k * (0.5 + sp);
    t.b.quaternion.copy(t.q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(time * 2.1 - i * 0.5) * 0.05 * k, 0, a)));
  });
}

// ---------------------------------------------------------------- camera: side-on, framing both, drag to orbit
const view = { orbit: 0, zoom: 1, cx: 0, cz: 0, d: 8 };
let drag = null; const pts = new Map();
canvas.addEventListener('pointerdown', (e) => { audioOn(); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, o: view.orbit, z: view.zoom, pd: pinchD() }; });
canvas.addEventListener('pointermove', (e) => {
  if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
  if (pts.size >= 2 && drag.pd) view.zoom = Math.min(2.5, Math.max(0.45, drag.z * drag.pd / pinchD()));
  else if (drag) view.orbit = drag.o + (e.clientX - drag.x) * 0.008;
});
const lift = (e) => { pts.delete(e.pointerId); if (!pts.size) drag = null; };
canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
canvas.addEventListener('wheel', (e) => { view.zoom = Math.min(2.5, Math.max(0.45, view.zoom * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: true });
function pinchD() { const v = [...pts.values()]; return v.length >= 2 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0; }
function stepCamera(dt) {
  const [a, b] = fighters; if (!a) return;
  const mid = a.root.position.clone().add(b.root.position).multiplyScalar(0.5), sep = flat(a, b).length();
  const dir = flat(a, b).normalize(), perp = new THREE.Vector3(-dir.z, 0, dir.x);
  const k = 1 - Math.exp(-dt * 3); view.cx += (mid.x - view.cx) * k; view.cz += (mid.z - view.cz) * k;
  // fit both fighters (plus a body-width margin) across the SCREEN WIDTH and a tall fighter top to bottom
  const vh = THREE.MathUtils.degToRad(camera.fov) / 2, hh = Math.atan(Math.tan(vh) * camera.aspect);
  const fit = Math.max((sep / 2 + 1.3) / Math.tan(hh), 1.7 / Math.tan(vh), 4);
  view.d += (fit * view.zoom - view.d) * k;
  const ang = Math.atan2(perp.x, perp.z) + view.orbit;
  const sx = (shake > 0 ? (Math.random() - 0.5) * shake : 0), sy = (shake > 0 ? (Math.random() - 0.5) * shake : 0);
  camera.position.set(view.cx + Math.sin(ang) * view.d + sx, 1.6 + view.d * 0.18 + sy, view.cz + Math.cos(ang) * view.d);
  camera.lookAt(view.cx, 1.15, view.cz);
  shake = Math.max(0, shake - dt * 1.2);
}

// ---------------------------------------------------------------- UI
const picks = [0, 1];
let slow = false;
function hud() {
  const [a, b] = fighters;
  document.getElementById('nameA').textContent = ROSTER[picks[0]].name; document.getElementById('nameB').textContent = ROSTER[picks[1]].name;
  document.querySelector('#pickA b').textContent = ROSTER[picks[0]].name; document.querySelector('#pickB b').textContent = ROSTER[picks[1]].name;
  if (!a) return;
  document.getElementById('hpA').style.width = Math.max(0, (a.hp / a.def.hp) * 100) + '%';
  document.getElementById('hpB').style.width = Math.max(0, (b.hp / b.def.hp) * 100) + '%';
  document.getElementById('barA').classList.toggle('win', b.ko && !a.ko); document.getElementById('barB').classList.toggle('win', a.ko && !b.ko);
}
function fight() {
  for (const f of fighters) { scene.remove(f.root); f.mixer.stopAllAction(); }
  fighters.length = 0; rng = mulberry((Math.random() * 1e9) | 0);
  const a = spawn(ROSTER[picks[0]], -1), b = spawn(ROSTER[picks[1]], 1);
  a.root.rotation.y = Math.PI / 2; b.root.rotation.y = -Math.PI / 2; fighters.push(a, b); hud();
}
document.querySelectorAll('[data-i]').forEach((el) => (el.outerHTML = svg(el.dataset.i)));
const tap = (id, fn) => document.getElementById(id).addEventListener('pointerup', (e) => { e.stopPropagation(); audioOn(); fn(); });
tap('pickA', () => { picks[0] = (picks[0] + 1) % ROSTER.length; fight(); });
tap('pickB', () => { picks[1] = (picks[1] + 1) % ROSTER.length; fight(); });
tap('fight', fight);
tap('slow', () => { slow = !slow; document.getElementById('slow').classList.toggle('on', slow); });
tap('view', () => { view.orbit = 0; view.zoom = 1; });
tap('hue', () => { // the right-hand fighter's team colour, live (no respawn)
  TEAM_HUE[1] = HUES[(HUES.indexOf(TEAM_HUE[1]) + 1) % HUES.length]; if (fighters[1]) fighters[1].hue.value = TEAM_HUE[1];
});
tap('home', () => { location.href = './'; });

// ---------------------------------------------------------------- go
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 55 : 40; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let time = 0;
function frame() {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, clock.getDelta()) * (slow ? 0.3 : 1);
  if (hitstop > 0) { hitstop -= dt; dt *= 0.05; }
  time += dt;
  for (const f of fighters) stepFighter(f, dt);
  for (const f of fighters) { f.mixer.update(dt); stepTail(f, time); }
  stepSparks(dt);
  for (let i = tracers.length - 1; i >= 0; i--) { const t = tracers[i]; t.t -= dt; t.l.material.opacity = Math.max(0, t.t / 0.09); if (t.t <= 0) { scene.remove(t.l); t.l.geometry.dispose(); tracers.splice(i, 1); } }
  stepCamera(dt); hud();
  renderer.render(scene, camera);
}
Promise.all([...Object.keys(RIGS).map(loadRig), ...Object.keys(WEAPONS).map((k) => loadWeapon(k).then((w) => ({ weapon: k, w })))]).then((rs) => {
  for (const r of rs) if (r.weapon) WEAPDATA[r.weapon] = r.w; else RIGDATA[r.key] = r;
  document.getElementById('load').remove(); fight(); frame();
  window.duel = { fighters, RULE, ROSTER, MELEE, GUN, RIGDATA, WEAPDATA, TEAM_HUE }; // live tuning from a desktop console
});

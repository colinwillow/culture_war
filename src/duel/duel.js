// Duel arena (Colin, Oct 22 2026): drop two fighters in a ring and watch them go at it, up close and side-on.
// A sandbox for the "every fight is a little duel" direction (docs/design.md, Combat depth): blocks, misses, glancing
// hits, staggers, knockdowns and some luck, tuned here before squads in the RTS inherit it. Standalone page: it shares
// three.js, the Draco decoder and the icons with the game and nothing else.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { svg } from '../ui/icons.js?v=171';

// ---------------------------------------------------------------- data (all the numbers worth tuning live here)
// Contact fractions (`at`) are MEASURED, not guessed: the striking hand or foot's fastest frame in the clip
// (blender-addons/pipeline/contact.py on the warrior's clips). `spd` plays a clip faster than authored.
const MELEE = {
  reach: 1.7, idle: 'standing_idle', walk: 'standing_walk_forward', run: 'standing_run_forward',
  attacks: [
    { c: 'standing_melee_attack_horizontal', at: 0.41, dmg: 16, reach: 2.1, spd: 1.35 },
    { c: 'standing_melee_attack_downward', at: 0.38, dmg: 21, reach: 2.0, spd: 1.35, big: 0.25 },
    { c: 'standing_melee_attack_backhand', at: 0.35, dmg: 14, reach: 2.0, spd: 1.45 },
    { c: 'standing_melee_attack_kick_ver._1', at: 0.31, dmg: 10, reach: 1.9, spd: 1.3, knock: 2.6, limb: 'foot' },
  ],
  block: 'standing_block_idle', blockHit: 'standing_block_react_large',
  hits: ['Hit_To_Body', 'Head_Hit', 'standing_react_large_gut'], fall: 'Shoulder_Hit_And_Fall', getup: 'Getting_Up',
  react: { head: 'Head_Hit', body: 'Hit_To_Body', gut: 'standing_react_large_gut', left: 'standing_react_large_from_left', right: 'standing_react_large_from_right' },
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
  pace: 1.35,        // EVERYTHING plays this much faster than authored (Colin: "a little quicker")
  think: 0.14,       // seconds between decisions
  // (no dice for a MISS any more: a swing misses when the weapon physically does not reach the body -- see touches)
  reachTol: 0.28,    // m of slack round the body capsule for a weapon tip (fists/feet get 60% of it)
  dodge: 0.08,       // defender steps out of it (only if not busy)
  glance: 0.25,      // half damage, light flinch
  crit: 0.1,         // a clean hit that floors him
  readBlock: 0.25,   // chance a fighter sees a swing coming and blocks it
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
  const box = new THREE.Box3();
  for (const q of W.parts) {
    const m = new THREE.Mesh(q.g, tint(q.m.clone(), mats)); m.matrixAutoUpdate = false; m.matrix.copy(q.x); m.castShadow = true; m.frustumCulled = false; g.add(m);
    q.g.computeBoundingBox(); box.union(q.g.boundingBox.clone().applyMatrix4(q.x));
  }
  // the TIP: the far end of the weapon's long axis from the grip (the mount is at the origin), centred on the other two
  const size = box.getSize(new THREE.Vector3()), ax = size.x > size.y ? (size.x > size.z ? 'x' : 'z') : (size.y > size.z ? 'y' : 'z');
  const tip = new THREE.Object3D(); box.getCenter(tip.position);
  tip.position[ax] = Math.abs(box.max[ax]) > Math.abs(box.min[ax]) ? box.max[ax] : box.min[ax];
  g.add(tip); g.userData.tip = tip;
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
// DUST + DEBRIS: soft puffs that grow and fade (normal blending, so dust reads as dust, not glow) and little pebbles that
// fall. One Points draw call; point size is in world metres at any lens (size * uPx / depth).
const DUST_N = 260;
const dust = { pos: new Float32Array(DUST_N * 3), col: new Float32Array(DUST_N * 3), size: new Float32Array(DUST_N), alpha: new Float32Array(DUST_N),
  vel: Array.from({ length: DUST_N }, () => new THREE.Vector3()), life: new Float32Array(DUST_N), max: new Float32Array(DUST_N), grow: new Float32Array(DUST_N), grav: new Float32Array(DUST_N), i: 0 };
const dustGeo = new THREE.BufferGeometry();
for (const [k, n] of [['position', 3], ['color', 3], ['size', 1], ['alpha', 1]]) dustGeo.setAttribute(k, new THREE.BufferAttribute(dust[k === 'position' ? 'pos' : k === 'color' ? 'col' : k], n));
const dustMat = new THREE.ShaderMaterial({
  uniforms: { uPx: { value: 400 } }, transparent: true, depthWrite: false,
  vertexShader: 'attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uPx;\n' +
    'void main() { vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * uPx / -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'varying vec3 vC; varying float vA; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; gl_FragColor = vec4(vC, vA * (1.0 - d * d)); }',
});
const dustPts = new THREE.Points(dustGeo, dustMat); dustPts.frustumCulled = false; scene.add(dustPts);
function puff(p, n, o = {}) { // o: spread, up, size, grow, life, color, grav, vel(dir), alpha
  const c = new THREE.Color(o.color ?? 0xeadcc0); // paler than the sand so it reads against it
  for (let k = 0; k < n; k++) {
    const i = dust.i = (dust.i + 1) % DUST_N, sp = o.spread ?? 1.2;
    dust.pos.set([p.x + (Math.random() - 0.5) * 0.3, p.y + 0.05, p.z + (Math.random() - 0.5) * 0.3], i * 3);
    dust.vel[i].set((Math.random() - 0.5) * sp, (o.up ?? 0.6) * (0.5 + Math.random()), (Math.random() - 0.5) * sp);
    if (o.vel) dust.vel[i].addScaledVector(o.vel, 0.6 + Math.random() * 0.6);
    const v = 0.85 + Math.random() * 0.3; dust.col.set([c.r * v, c.g * v, c.b * v], i * 3);
    dust.size[i] = (o.size ?? 0.35) * (0.7 + Math.random() * 0.6); dust.grow[i] = o.grow ?? 1.4; dust.grav[i] = o.grav ?? -0.3;
    dust.max[i] = dust.life[i] = (o.life ?? 0.9) * (0.7 + Math.random() * 0.6); dust.alpha[i] = o.alpha ?? 0.7;
  }
}
const pebbles = (p, dir, n) => puff(p, n, { color: 0x5a4632, size: 0.07, grow: 0, life: 0.8, grav: 9, up: 3.2, spread: 2.2, vel: dir.clone().multiplyScalar(2.5), alpha: 1 });
function stepDust(dt) {
  for (let i = 0; i < DUST_N; i++) {
    if (dust.life[i] <= 0) { dust.alpha[i] = 0; continue; }
    dust.life[i] -= dt; const v = dust.vel[i], k = dust.life[i] / dust.max[i];
    v.y -= dust.grav[i] * dt; v.multiplyScalar(Math.exp(-2.5 * dt));
    dust.pos[i * 3] += v.x * dt; dust.pos[i * 3 + 1] = Math.max(0.03, dust.pos[i * 3 + 1] + v.y * dt); dust.pos[i * 3 + 2] += v.z * dt;
    dust.size[i] += dust.grow[i] * dt; if (dust.grow[i] > 0) dust.alpha[i] = Math.min(dust.alpha[i], 0.7 * Math.sin(Math.PI * Math.min(1, k * 1.2)));
    if (dust.life[i] <= 0) dust.alpha[i] = 0;
  }
  for (const k of ['position', 'size', 'alpha', 'color']) dustGeo.attributes[k].needsUpdate = true;
  dustMat.uniforms.uPx.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
}
// SCUFF MARKS: a dark smear left on the sand where a body hits the floor (and where a slide drags), fading over 25 s
const scuffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(60,40,25,.55)'); g.addColorStop(1, 'rgba(60,40,25,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const scuffs = [];
function scuff(p, dir, len, wid) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: scuffTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(dir.x, dir.z); m.scale.set(wid, len, 1); m.position.set(p.x, 0.012, p.z); scene.add(m);
  scuffs.push({ m, t: 25 }); if (scuffs.length > 40) { const o = scuffs.shift(); scene.remove(o.m); o.m.material.dispose(); }
}
function stepScuffs(dt) { for (const q of scuffs) { q.t -= dt; q.m.material.opacity = Math.min(1, q.t / 6); } }
const tracers = [];
function tracer(a, b, hit) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: hit ? 0xfff2a8 : 0xa0d8ff, transparent: true }));
  scene.add(l); tracers.push({ l, t: 0.09 });
}
let shake = 0;

// SLASH TRAILS: a ribbon swept by the striking point (weapon tip, fist or foot) over the swing's active frames,
// fading by age, in the fighter's team colour. Additive, so fading the colour to black IS the fade.
const TRAIL_N = 24, TRAIL_LIFE = 0.2;
function makeTrail() {
  const pos = new Float32Array(TRAIL_N * 2 * 3), col = new Float32Array(TRAIL_N * 2 * 3), idx = [];
  for (let i = 0; i < TRAIL_N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; scene.add(mesh);
  return { mesh, pts: [] }; // pts: { a: tip, b: base, age }
}
const teamColor = (hue) => new THREE.Color().setHSL((0.08 + hue / (Math.PI * 2)) % 1, 0.95, 0.62);
const _ta = new THREE.Vector3(), _tb = new THREE.Vector3();
function stepTrail(f, dt) {
  const T = f.trail, m = f.move;
  for (const p of T.pts) p.age += dt;
  while (T.pts.length && T.pts[0].age > TRAIL_LIFE) T.pts.shift();
  if (f.state === 'attack' && m && !m.ranged && f.prog > m.at - 0.2 && f.prog < m.at + 0.12) {
    const src = m.limb === 'foot' ? f.foot : f.tip || f.hand;
    if (src) {
      src.getWorldPosition(_ta);
      if (f.tip && m.limb !== 'foot') f.hand.getWorldPosition(_tb).lerp(_ta, 0.35); // blade-length ribbon: grip side to tip
      else _tb.copy(_ta).addScaledVector(new THREE.Vector3(0, 1, 0), -0.18);         // fist/foot: a short streak
      T.pts.push({ a: _ta.clone(), b: _tb.clone(), age: 0 }); if (T.pts.length > TRAIL_N) T.pts.shift();
    }
  }
  const pos = T.mesh.geometry.attributes.position, col = T.mesh.geometry.attributes.color, c = teamColor(f.hue.value);
  for (let i = 0; i < TRAIL_N; i++) {
    const p = T.pts[Math.min(i, T.pts.length - 1)];
    if (!p) { pos.setXYZ(i * 2, 0, -99, 0); pos.setXYZ(i * 2 + 1, 0, -99, 0); continue; }
    const k = Math.pow(Math.max(0, 1 - p.age / TRAIL_LIFE), 1.5) * (i < T.pts.length ? 1 : 0);
    pos.setXYZ(i * 2, p.a.x, p.a.y, p.a.z); pos.setXYZ(i * 2 + 1, p.b.x, p.b.y, p.b.z);
    col.setXYZ(i * 2, c.r * k, c.g * k, c.b * k); col.setXYZ(i * 2 + 1, c.r * k * 0.15, c.g * k * 0.15, c.b * k * 0.15);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
}

// IMPACT FLASHES: camera-facing sprites (a starburst glow and a slash streak along the swing) that pop and fade.
const flashTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, '#fff'); g.addColorStop(0.25, 'rgba(255,240,200,.9)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 4; i++) { x.save(); x.translate(64, 64); x.rotate((i * Math.PI) / 4); x.beginPath(); x.moveTo(-64, 0); x.lineTo(0, -5); x.lineTo(64, 0); x.lineTo(0, 5); x.fill(); x.restore(); }
  return new THREE.CanvasTexture(c);
})();
const slashTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(0, 16); x.quadraticCurveTo(128, 2, 256, 16); x.quadraticCurveTo(128, 30, 0, 16); x.fill();
  return new THREE.CanvasTexture(c);
})();
const pops = [];
function pop(p, color, size, life, tex = flashTex, angle = 0, stretch = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, rotation: angle }));
  s.position.copy(p); s.renderOrder = 5; scene.add(s); pops.push({ s, t: 0, life, size, stretch });
}
function stepPops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const q = pops[i]; q.t += dt; const k = q.t / q.life, grow = 1 - Math.pow(1 - Math.min(1, k * 2.2), 3);
    q.s.scale.set(q.size * grow * q.stretch, q.size * grow * (q.stretch > 1 ? 0.35 : 1), 1); q.s.material.opacity = Math.max(0, 1 - k);
    if (q.t >= q.life) { scene.remove(q.s); q.s.material.dispose(); pops.splice(i, 1); }
  }
}
function slashAngle(f, dir) { // screen-space angle of the swing (from the trail's last points), else across the push
  const T = f.trail.pts, n = T.length;
  const a = n > 2 ? T[n - 3].a.clone() : new THREE.Vector3(), b = n > 2 ? T[n - 1].a.clone() : a.clone().add(new THREE.Vector3(-dir.z, 0.3, dir.x));
  a.project(camera); b.project(camera);
  return Math.atan2((b.y - a.y) / camera.aspect, b.x - a.x);
}

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
function spawn(def, side, slot = 0, n = 1) {
  const R = RIGDATA[def.rig], model = skClone(R.scene), k = def.h / (R.box.max.y - R.box.min.y);
  const root = new THREE.Group(); model.scale.setScalar(k); model.position.y = -R.box.min.y * k; root.add(model);
  const mats = [], hue = { value: TEAM_HUE[side < 0 ? 0 : 1] }; // one team colour per side
  model.traverse((o) => {
    if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
    o.material = tint(o.material.clone(), mats, hue);
  });
  let hand = null; model.traverse((o) => { if (!hand && o.isBone && o.name === 'mixamorig_RightHand') hand = o; });
  const W = def.weapon && WEAPDATA[def.weapon]; let weaponTip = null;
  if (W) {
    let own = null; if (R.R.own === def.weapon) model.traverse((o) => { if (!own && o.isBone && o.name === W.root) own = o; });
    if (own) { const wm = weaponMesh(W, mats); own.add(wm); weaponTip = wm.userData.tip; } // his own mount bone: identity
    else if (hand) { // borrowed: the donor's rest grip, carried over in model space and scaled by height
      model.updateMatrixWorld(true);
      const toModel = model.matrixWorld.clone().invert(), handM = toModel.clone().multiply(hand.matrixWorld);
      const H = R.box.max.y - R.box.min.y, G = WEAPONS[def.weapon], hp = new THREE.Vector3().setFromMatrixPosition(handM);
      const want = new THREE.Matrix4().compose(hp.add(new THREE.Vector3(...G.off).multiplyScalar(H)), new THREE.Quaternion(), new THREE.Vector3().setScalar(G.s * H));
      const mount = new THREE.Group(); mount.matrixAutoUpdate = false; mount.matrix.copy(handM.invert().multiply(want));
      const wm = weaponMesh(W, mats); mount.add(wm); hand.add(mount); weaponTip = wm.userData.tip;
    }
  }
  for (const m of mats) m.userData.hue = hue;
  const tail = []; if (R.R.tail) model.traverse((o) => { if (o.isBone && R.R.tail.test(o.name)) tail.push({ b: o, q: o.quaternion.clone() }); });
  tail.sort((a, b) => a.b.name.localeCompare(b.b.name));
  const mixer = new THREE.AnimationMixer(model), actions = {};
  for (const n in R.clips) actions[n] = mixer.clipAction(R.clips[n]);
  let foot = null, footL = null, hips = null;
  model.traverse((o) => { if (!o.isBone) return; if (o.name === 'mixamorig_RightToeBase') foot = o; if (o.name === 'mixamorig_LeftToeBase') footL = o; if (o.name === 'mixamorig_Hips') hips = o; });
  const trail = makeTrail(); trail.mesh.visible = true;
  const f = { def, side, root, model, mixer, actions, mats, hand, tail, hue, tip: weaponTip, foot, footL, hips, feetUp: [false, false], fell: false, trail, hp: def.hp, cur: null, state: 'idle', t: 0, think: 0,
    vel: new THREE.Vector3(), flash: 0, swingDone: false, move: null, ko: false, h: def.h };
  f.team = side < 0 ? 0 : 1; // two lines facing each other, a stagger so the back row is not hidden
  root.position.set(side * (3.2 + (slot % 2) * 1.3), 0, (slot - (n - 1) / 2) * 1.5); root.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(root); play(f, def.style.idle);
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
// whoever he is fighting: his current target if still standing, else the nearest enemy still up (brawls), else anyone
const foes = (f) => fighters.filter((o) => o.team !== f.team && !o.ko);
function nearestFoe(f) { let best = null, bd = 1e9; for (const o of foes(f)) { const d = flat(f, o).length(); if (d < bd) { bd = d; best = o; } } return best; }
const other = (f) => (f.target && !f.target.ko ? f.target : (f.target = nearestFoe(f))) || f.target || fighters.find((o) => o !== f);
const flat = (a, b) => new THREE.Vector3(b.root.position.x - a.root.position.x, 0, b.root.position.z - a.root.position.z);
const facing = (a, b) => { const d = flat(a, b).normalize(); return Math.sin(a.root.rotation.y) * d.x + Math.cos(a.root.rotation.y) * d.z; };
const chest = (f) => f.root.position.clone().setY(f.h * 0.62);
function setState(f, s, t) { f.state = s; f.t = t; }

function brain(f, dt) {
  if (!foes(f).length) { if (f.state !== 'taunt' && !f.ko) { setState(f, 'taunt', 99); play(f, f.def.style.taunt, false); } return; } // last team standing
  if (!['idle', 'move'].includes(f.state)) return;
  if ((f.think -= dt) > 0) return; f.think = RULE.think * (0.6 + rng() * 0.8);
  if (rng() < 0.08) f.target = nearestFoe(f); // in a brawl, now and then turn to whoever is closest
  const o = other(f), S = f.def.style, d = flat(f, o).length();
  // seeing a swing coming (from anyone aimed at him): block it
  const threat = fighters.find((x) => x.team !== f.team && x.target === f && x.state === 'attack' && x.move && x.prog < x.move.at && flat(f, x).length() < x.move.reach + 0.6);
  if (threat && rng() < RULE.readBlock) {
    setState(f, 'block', 0.35 + rng() * 0.35); play(f, S.block); return;
  }
  if (S.shoot && d > S.keep[0] && d < S.keep[1]) return startShot(f);
  const want = S.shoot && d > S.keep[1] ? S.keep[1] - 1 : S.reach - Math.min(0.6, (f.whiffs || 0) * 0.15); // whiffing? step in
  if (d > want + 0.2) { setState(f, 'move', 0); return; }
  const r = rng();
  if (r < 0.62) startAttack(f, S.attacks[(rng() * S.attacks.length) | 0]);
  else if (r < 0.8) { setState(f, 'block', 0.3 + rng() * 0.4); play(f, S.block); }
  else { setState(f, 'idle', 0); f.think = 0.15 + rng() * 0.25; play(f, S.idle); }
}
function startAttack(f, m) {
  stats.swings++; f.lastStrike = null;
  f.move = m; f.prog = 0; f.swingDone = false; const sp = m.spd * RULE.pace; f.move = { ...m, spd: sp }; setState(f, 'attack', dur(f, m.c, sp)); play(f, m.c, true, sp, 0.08); sound('swing', 0.35);
}
function startShot(f) {
  const m = f.def.style.shoot; f.move = { ...m, reach: 99, ranged: true }; f.prog = 0; f.swingDone = false;
  const sp = m.spd * RULE.pace; f.move.spd = sp; setState(f, 'attack', dur(f, m.c, sp)); play(f, m.c, true, sp, 0.08);
}
function resolve(a, hp) { // the moment of contact: block, dodge, glance, hit or floor (a miss never gets here)
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
  if (b.ko || b.state === 'down' || b.state === 'getup') { sound('swing', 0.25); return; }
  if (b.state === 'block' && facing(b, a) > 0.2) return blocked(a, b, m, dir, RULE.blockKeep);
  const r = rng();
  if (r < RULE.dodge && ['idle', 'move'].includes(b.state)) { // sidestep
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(rng() < 0.5 ? 1 : -1);
    b.vel.addScaledVector(side, 4).addScaledVector(dir, 1.5); sound('swing', 0.3); stats.dodge++; return;
  }
  if (r < RULE.dodge + RULE.glance) return hurt(a, b, m.dmg * 0.5, dir, 0.4, false, true, hp);
  const floor = rng() < (m.big || RULE.crit);
  hurt(a, b, m.dmg * (0.85 + rng() * 0.3), dir, m.knock || 1.3, floor, false, hp);
}
// THE STRIKING POINT and the BODY it has to reach. A swing lands on the first frame, inside its active window, where the
// weapon tip (fist, foot) is inside the defender's capsule; if the window closes first it whiffed, whatever the dice say.
function strikePoint(f) { const src = f.move.limb === 'foot' ? f.foot : f.tip || f.hand; return src ? src.getWorldPosition(new THREE.Vector3()) : chest(f); }
function touches(p, b, tol) {
  const r = 0.3 * b.h / 1.9 + tol, y = Math.min(Math.max(p.y, 0.2 * b.h), 0.95 * b.h);
  return Math.hypot(p.x - b.root.position.x, p.z - b.root.position.z) < r && Math.abs(p.y - y) < r;
}
function whereHit(b, p) { // head / gut / body, or the side it came from (in the defender's own frame)
  const lx = p.x - b.root.position.x, lz = p.z - b.root.position.z, s = Math.sin(b.root.rotation.y), c = Math.cos(b.root.rotation.y);
  const side = lx * c - lz * s; // +X is his LEFT
  if (p.y > 0.8 * b.h) return 'head';
  if (Math.abs(side) > 0.22 * b.h / 1.9 && Math.abs(side) > Math.abs(lx * s + lz * c)) return side > 0 ? 'left' : 'right';
  return p.y < 0.55 * b.h ? 'gut' : 'body';
}
function blocked(a, b, m, dir, keep) {
  stats.block++;
  b.hp -= m.dmg * keep; play(b, b.def.style.blockHit, true, 1.2 * RULE.pace, 0.08); setState(b, 'block', dur(b, b.def.style.blockHit, 1.2 * RULE.pace) * 0.6);
  b.vel.addScaledVector(dir, 1.2); burst(chest(b).addScaledVector(dir, -0.3), dir.clone().negate(), 0x9fe0ff, 14, 3);
  pop(chest(b).addScaledVector(dir, -0.35), 0x9fe0ff, 0.8, 0.14); sound('clang', 0.5); shake = Math.max(shake, 0.06);
  if (b.hp <= 0) ko(b, dir);
}
function hurt(a, b, dmg, dir, knock, floor, light = false, hp = null) {
  if (a.move && a.move.limb === 'foot') pebbles(b.root.position.clone(), dir, 8); // a kick throws up the sand
  if (!(a.move && a.move.ranged)) stats[light ? 'glance' : floor ? 'floor' : 'hit']++;
  b.hp -= dmg; b.flash = 1; hitstop = RULE.hitstop * (light ? 0.5 : 1); shake = Math.max(shake, light ? 0.06 : floor ? 0.25 : 0.14);
  const p = hp ? hp.clone() : chest(b).addScaledVector(dir, -0.25); // sparks where it actually struck
  burst(p, dir.clone().negate().add(new THREE.Vector3(0, 0.4, 0)), floor ? 0xffa040 : 0xffe07a, light ? 10 : 24, light ? 2.5 : 4.5);
  const tc = teamColor(a.hue.value);
  pop(p, 0xffffff, light ? 0.55 : floor ? 1.3 : 0.95, light ? 0.12 : 0.18);
  if (!a.move || !a.move.ranged) pop(p, tc, light ? 1.0 : 1.7, 0.16, slashTex, slashAngle(a, dir), 3);
  sound(floor ? 'heavy' : 'hit', light ? 0.45 : 0.8); if (rng() < 0.35) setTimeout(() => sound('grunt', 0.5), 60);
  b.vel.addScaledVector(dir, knock * 2.2);
  if (b.hp <= 0) return ko(b, dir);
  const S = b.def.style;
  if (floor) { setState(b, 'down', dur(b, S.fall, 1.2 * RULE.pace) * 0.85); play(b, S.fall, true, 1.2 * RULE.pace, 0.08); b.vel.addScaledVector(dir, 2.5); return; }
  const where = hp ? whereHit(b, hp) : null, want = where && S.react && S.react[where];
  const h = want && b.actions[want] ? want : light ? S.hits[1] : S.hits[(rng() * S.hits.length) | 0];
  setState(b, 'hit', dur(b, h, 1.4 * RULE.pace) * 0.65); play(b, h, true, 1.4 * RULE.pace, 0.06);
}
const _fp = new THREE.Vector3();
function groundFx(f, dt) {
  // footfalls: a toe that comes down after being up kicks a small puff (bigger when running)
  // a PLANT is a toe that was swinging fast and stops near the ground (a height test missed: these walks barely lift)
  if (!f.toeLast) f.toeLast = [new THREE.Vector3(), new THREE.Vector3()];
  [f.foot, f.footL].forEach((t, i) => {
    if (!t || dt <= 0) return; t.getWorldPosition(_fp); const v = _fp.distanceTo(f.toeLast[i]) / dt; f.toeLast[i].copy(_fp);
    if (v > 1.6 * f.h / 1.9) f.feetUp[i] = true;
    else if (v < 0.5 && f.feetUp[i] && _fp.y < 0.12 * f.h) { f.feetUp[i] = false; puff(_fp, f.state === 'move' ? 4 : 2, { size: 0.24, spread: 0.7, up: 0.45, life: 0.7 }); }
  });
  // a body hitting the floor: hips come down low during a fall -> a ring of dust, a heavy thud, a scuff
  // (by TIME into the fall clip: the hips only sink to ~0.3 of his height, late and not reliably enough to test)
  if (f.state === 'down' || f.state === 'ko') f.downT = (f.downT || 0) + dt; else f.downT = 0;
  if ((f.state === 'down' || f.state === 'ko') && f.hips && !f.fell) {
    f.hips.getWorldPosition(_fp); _fp.y = 0;
    if (f.downT > 0.45 * dur(f, f.def.style.fall, 1.2 * RULE.pace)) {
      f.fell = true; const d = f.vel.clone().setY(0); if (d.lengthSq() < 1e-4) d.set(Math.sin(f.root.rotation.y), 0, Math.cos(f.root.rotation.y)).negate();
      puff(_fp, 16, { size: 0.5, spread: 3.2, up: 0.5, life: 1.2, grow: 1.8 }); pebbles(_fp, d.normalize(), 6);
      scuff(_fp, d, 1.4 * f.h / 1.9, 0.9 * f.h / 1.9); sound('heavy', 0.6); shake = Math.max(shake, 0.12);
    }
  }
  if (f.state !== 'down' && f.state !== 'ko') f.fell = false;
  // dragged across the sand by a big knockback: a dust trail behind the feet
  const sp = f.vel.length();
  if (sp > 2.2 && Math.random() < dt * 30) { const p = f.root.position.clone(); puff(p, 1, { size: 0.3, spread: 0.4, up: 0.3, life: 0.7, vel: f.vel.clone().multiplyScalar(-0.15) }); if (Math.random() < 0.15) scuff(p, f.vel, 0.6, 0.4); }
}
function ko(b, dir) {
  b.ko = true; b.hp = 0; setState(b, 'ko', 99); play(b, b.def.style.fall, true, 1, 0.08); b.vel.addScaledVector(dir, 3);
  sound('heavy', 0.9); shake = 0.3; hud();
}
let hitstop = 0;
const stats = { swings: 0, whiff: 0, block: 0, dodge: 0, glance: 0, hit: 0, floor: 0 }; // live tally (window.duel.stats)

function stepFighter(f, dt) {
  const o = other(f), S = f.def.style;
  f.t -= dt; brain(f, dt);
  // turn to face the other one (not while flat on the floor)
  if (!['down', 'ko', 'getup'].includes(f.state)) {
    const d = flat(f, o), want = Math.atan2(d.x, d.z); let dy = want - f.root.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.root.rotation.y += dy * Math.min(1, dt * 8);
  }
  if (f.state === 'move') {
    const d = flat(f, o), dist = d.length(), want = S.shoot && dist > S.keep[1] ? S.keep[1] - 1 : S.reach - Math.min(0.6, (f.whiffs || 0) * 0.15);
    if (dist <= want) { setState(f, 'idle', 0); play(f, S.idle); }
    else { const run = dist > 3.2, sp = (run ? 4.2 : 1.8) * f.def.speed * (f.h / 1.9); play(f, run ? S.run : S.walk); f.root.position.addScaledVector(d.normalize(), sp * dt); }
  }
  if (f.state === 'attack') {
    f.prog = 1 - f.t / dur(f, f.move.c, f.move.spd);
    if (!f.swingDone && f.move.ranged && f.prog >= f.move.at) { f.swingDone = true; resolve(f); }
    else if (!f.swingDone && f.prog >= f.move.at - 0.1) { // melee: the active window
      const now = strikePoint(f), tol = RULE.reachTol * (f.tip && f.move.limb !== 'foot' ? 1 : 0.6);
      // swept: test the path the tip travelled since last frame, so a low frame rate cannot skip the body
      const from = f.lastStrike || now; let hp = null;
      for (let i = 1; i <= 6 && !hp; i++) { const q = from.clone().lerp(now, i / 6); if (touches(q, o, tol)) hp = q; }
      f.lastStrike = now;
      if (hp) { f.swingDone = true; resolve(f, hp); }
      else if (f.prog > f.move.at + 0.07) { f.swingDone = true; sound('swing', 0.3); f.whiffs = (f.whiffs || 0) + 1; stats.whiff++; }
    }
    if (f.t <= 0 || f.prog > 0.8) { setState(f, 'idle', 0); f.think = 0.05 + rng() * 0.2; play(f, S.idle, false, 1, 0.2); } // cut the long recoveries
  }
  if ((f.state === 'block' || f.state === 'hit') && f.t <= 0) { setState(f, 'idle', 0); play(f, S.idle); }
  if (f.state === 'down' && f.t <= 0) { setState(f, 'getup', dur(f, S.getup, 1.3 * RULE.pace) * 0.9); play(f, S.getup, true, 1.3 * RULE.pace, 0.1); }
  if (f.state === 'getup' && f.t <= 0) { setState(f, 'idle', 0); play(f, S.idle, false, 1, 0.25); }
  // knockback slide, ring edge, and no walking through each other
  f.root.position.addScaledVector(f.vel, dt); f.vel.multiplyScalar(Math.exp(-6 * dt));
  const r = Math.hypot(f.root.position.x, f.root.position.z); if (r > RULE.ring - 0.6) f.root.position.multiplyScalar((RULE.ring - 0.6) / r);
  for (const x of fighters) { // no walking through anybody (bodies on the floor included)
    if (x === f) continue; const d = flat(x, f), dl = d.length(), min = 0.95;
    if (dl < min && dl > 1e-4) f.root.position.addScaledVector(d.normalize(), (min - dl) * 0.5);
  }
  // hit flash
  groundFx(f, dt);
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
  if (!fighters.length) return;
  const up = fighters.filter((f) => !f.ko).length ? fighters.filter((f) => !f.ko) : fighters;
  const mid = new THREE.Vector3(); for (const f of up) mid.add(f.root.position); mid.multiplyScalar(1 / up.length);
  let sep = 0; for (const f of up) sep = Math.max(sep, 2 * Math.hypot(f.root.position.x - mid.x, f.root.position.z - mid.z));
  // side-on to the line between the two teams' centres
  const ca = new THREE.Vector3(), cb = new THREE.Vector3(); let na = 0, nb = 0;
  for (const f of up) { if (f.team) { cb.add(f.root.position); nb++; } else { ca.add(f.root.position); na++; } }
  const dir = na && nb ? cb.multiplyScalar(1 / nb).sub(ca.multiplyScalar(1 / na)).setY(0).normalize() : new THREE.Vector3(1, 0, 0), perp = new THREE.Vector3(-dir.z, 0, dir.x);
  if (view.dir) { view.dir.lerp(perp, 1 - Math.exp(-dt * 1.5)).normalize(); perp.copy(view.dir); } else view.dir = perp.clone();
  const k = 1 - Math.exp(-dt * 3); view.cx += (mid.x - view.cx) * k; view.cz += (mid.z - view.cz) * k;
  // fit both fighters (plus a body-width margin) across the SCREEN WIDTH and a tall fighter top to bottom
  const vh = THREE.MathUtils.degToRad(camera.fov) / 2, hh = Math.atan(Math.tan(vh) * camera.aspect);
  // extents in the camera's own frame: across the screen (along dir) and towards it (along perp)
  let wide = 0, deep = 0;
  for (const f of up) { const dx = f.root.position.x - view.cx, dz = f.root.position.z - view.cz; wide = Math.max(wide, Math.abs(dx * dir.x + dz * dir.z)); deep = Math.max(deep, Math.abs(dx * perp.x + dz * perp.z)); }
  const crowd = up.length > 2;
  const fit = Math.max((wide + 1.3) / Math.tan(hh) + deep, 1.7 / Math.tan(vh) + deep, 4) * (crowd ? 1.1 : 1);
  view.d += (fit * view.zoom - view.d) * k;
  const ang = Math.atan2(perp.x, perp.z) + view.orbit;
  const sx = (shake > 0 ? (Math.random() - 0.5) * shake : 0), sy = (shake > 0 ? (Math.random() - 0.5) * shake : 0);
  camera.position.set(view.cx + Math.sin(ang) * view.d + sx, 1.6 + view.d * (crowd ? 0.42 : 0.18) + sy, view.cz + Math.cos(ang) * view.d); // crowds: look down on them
  camera.lookAt(view.cx, 1.15, view.cz);
  shake = Math.max(0, shake - dt * 1.2);
}

// ---------------------------------------------------------------- UI
const picks = [0, 1];
const SIZES = [1, 3, 5]; let size = 0; // 1v1, 3v3, 5v5 (Colin: "see the hordes fight")
let slow = false;
function hud() {
  const team = (t) => fighters.filter((f) => f.team === t), sum = (l, k) => l.reduce((v, f) => v + Math.max(0, k(f)), 0);
  const A = team(0), B = team(1), a = A.length && { hp: sum(A, (f) => f.hp), def: { hp: sum(A, (f) => f.def.hp) }, ko: A.every((f) => f.ko) },
    b = B.length && { hp: sum(B, (f) => f.hp), def: { hp: sum(B, (f) => f.def.hp) }, ko: B.every((f) => f.ko) };
  const nm = (i, n) => (n > 1 ? n + ' ' : '') + ROSTER[picks[i]].name;
  document.getElementById('nameA').textContent = nm(0, A.length); document.getElementById('nameB').textContent = nm(1, B.length);
  document.querySelector('#pickA b').textContent = ROSTER[picks[0]].name; document.querySelector('#pickB b').textContent = ROSTER[picks[1]].name;
  if (!a) return;
  document.getElementById('hpA').style.width = Math.max(0, (a.hp / a.def.hp) * 100) + '%';
  document.getElementById('hpB').style.width = Math.max(0, (b.hp / b.def.hp) * 100) + '%';
  document.getElementById('barA').classList.toggle('win', b.ko && !a.ko); document.getElementById('barB').classList.toggle('win', a.ko && !b.ko);
}
function fight() {
  for (const f of fighters) { scene.remove(f.root); scene.remove(f.trail.mesh); f.trail.mesh.geometry.dispose(); f.mixer.stopAllAction(); }
  for (const q of scuffs) { scene.remove(q.m); q.m.material.dispose(); } scuffs.length = 0;
  fighters.length = 0; rng = mulberry((Math.random() * 1e9) | 0);
  const n = SIZES[size];
  for (let i = 0; i < n; i++) fighters.push(spawn(ROSTER[picks[0]], -1, i, n), spawn(ROSTER[picks[1]], 1, i, n));
  view.dir = null; hud();
}
document.querySelectorAll('[data-i]').forEach((el) => (el.outerHTML = svg(el.dataset.i)));
const tap = (id, fn) => document.getElementById(id).addEventListener('pointerup', (e) => { e.stopPropagation(); audioOn(); fn(); });
tap('pickA', () => { picks[0] = (picks[0] + 1) % ROSTER.length; fight(); });
tap('pickB', () => { picks[1] = (picks[1] + 1) % ROSTER.length; fight(); });
tap('fight', fight);
tap('size', () => { size = (size + 1) % SIZES.length; document.querySelector('#size small').textContent = SIZES[size] + 'V' + SIZES[size]; fight(); });
tap('slow', () => { slow = !slow; document.getElementById('slow').classList.toggle('on', slow); });
tap('view', () => { view.orbit = 0; view.zoom = 1; });
tap('hue', () => { // the right-hand fighter's team colour, live (no respawn)
  TEAM_HUE[1] = HUES[(HUES.indexOf(TEAM_HUE[1]) + 1) % HUES.length]; for (const f of fighters) if (f.team === 1) f.hue.value = TEAM_HUE[1];
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
  stepSparks(dt); stepPops(dt); stepDust(dt); stepScuffs(dt);
  for (const f of fighters) stepTrail(f, dt);
  for (let i = tracers.length - 1; i >= 0; i--) { const t = tracers[i]; t.t -= dt; t.l.material.opacity = Math.max(0, t.t / 0.09); if (t.t <= 0) { scene.remove(t.l); t.l.geometry.dispose(); tracers.splice(i, 1); } }
  stepCamera(dt); hud();
  renderer.render(scene, camera);
}
Promise.all([...Object.keys(RIGS).map(loadRig), ...Object.keys(WEAPONS).map((k) => loadWeapon(k).then((w) => ({ weapon: k, w })))]).then((rs) => {
  for (const r of rs) if (r.weapon) WEAPDATA[r.weapon] = r.w; else RIGDATA[r.key] = r;
  document.getElementById('load').remove(); fight(); frame();
  window.duel = { dust, scuffs, stats, fighters, RULE, ROSTER, MELEE, GUN, RIGDATA, WEAPDATA, TEAM_HUE }; // live tuning from a desktop console
});

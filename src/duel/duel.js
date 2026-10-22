// Duel arena (Colin, Oct 22 2026): drop two fighters in a ring and watch them go at it, up close and side-on.
// A sandbox for the "every fight is a little duel" direction (docs/design.md, Combat depth): blocks, misses, glancing
// hits, staggers, knockdowns and some luck, tuned here before squads in the RTS inherit it. Standalone page: it shares
// three.js, the Draco decoder and the icons with the game and nothing else.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as skClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { svg } from '../ui/icons.js?v=198';
import { makePops, slashTex } from '../fx/pops.js?v=198';

// ---------------------------------------------------------------- data (all the numbers worth tuning live here)
// Contact fractions (`at`) are MEASURED, not guessed: the striking hand or foot's fastest frame in the clip
// (blender-addons/pipeline/contact.py on the warrior's clips). `spd` plays a clip faster than authored.
const MELEE = {
  reach: 1.7, idle: 'standing_idle', walk: 'standing_walk_forward', run: 'standing_run_forward',
  left: 'standing_walk_left', right: 'standing_walk_right', back: 'standing_walk_back',
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
  left: 'rifle_strafe_left', right: 'rifle_strafe_right', back: 'rifle_walk_fwd_01',
  shoot: { c: 'rifle_shoot_stationary_01', at: 0.31, dmg: 7, spd: 1 }, fall: 'fall_to_back', getup: 'get_up_from_back',
};
const RIGS = {
  warrior: { file: 'models/characters/alien_warrior.glb', own: 'mace' },   // his own weapon_root bone carries the mace
  demon: { file: 'models/characters/demon.glb', tail: /^c_tail_\d+/ },
  // Colin's Brutes (Oct 22): Tripo meshes off his art, ARP rigs, the warrior's + Colin's clips baked on. Team colour
  // is a KEY: only the crimson pieces (shoulder plates, banner, emblem) take the team hue; the skin is left alone.
  brute_grunt: { file: 'models/characters/brute_grunt.glb', key: true },
  brute_shooter: { file: 'models/characters/brute_shooter.glb', key: true },
  brute_plated: { file: 'models/characters/brute_plated.glb', key: true },
  brute_hero: { file: 'models/characters/brute_hero.glb', key: true },
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
  { name: 'GRUNT', rig: 'brute_grunt', style: MELEE, h: 1.5, hp: 110, speed: 1.1, weapon: 'mace' },
  { name: 'SHOOTER', rig: 'brute_shooter', style: GUN, h: 2.1, hp: 120, speed: 1.05, weapon: 'blaster' },
  { name: 'PLATED', rig: 'brute_plated', style: MELEE, h: 2.2, hp: 200, speed: 0.85, weapon: 'mace' },
  { name: 'HERO', rig: 'brute_hero', style: MELEE, h: 2.4, hp: 220, speed: 0.95, weapon: 'mace' },
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
  guard: 100,        // guard meter: blocks drain it by the blow's damage, it refills 18/s out of block; empty = GUARD BREAK (stunned)
  guardRegen: 7,     // (18 never let a break happen: 7 blocks in 40 s and the bar stayed above 60)
  breakStun: 1.1,    // seconds helpless after a guard break
  parry: 0.22,       // seconds after a block lands in which a COUNTER is open (the defender swings back at once, unblockable)
  parryP: 0.6,       // chance he takes it
  combo: 0.45,       // chance a landed swing chains straight into a second one (no recovery)
  circle: 0.14,      // in range: chance to strafe round him instead of swinging
  backstep: 0.5,     // after taking a hit: chance to step back out of range before re-engaging
  roll: 0.3,         // on reading a swing: chance to DODGE ROLL sideways instead of blocking (untouchable while rolling)
  rollT: 0.42,
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
scene.background = new THREE.Color(0x2e3140); scene.fog = new THREE.Fog(0x3a3d4c, 14, 42);
// GRADE: warm key light, cool fill and shadows, filmic tone curve (the duel reads like late afternoon)
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
// HEIGHT FOG: three's fog is by distance only; this makes it thicker near the ground (a haze that pools in the ring
// and thins out above head height), by patching the fog chunks every material in this page uses.
THREE.ShaderChunk.fog_pars_vertex = THREE.ShaderChunk.fog_pars_vertex.replace('varying float vFogDepth;', 'varying float vFogDepth; varying float vFogH;');
THREE.ShaderChunk.fog_vertex = THREE.ShaderChunk.fog_vertex.replace('vFogDepth = - mvPosition.z;', 'vFogDepth = - mvPosition.z; vFogH = ( modelMatrix * vec4( position, 1.0 ) ).y;' /* position, not transformed: Points and Sprites have no transformed */);
THREE.ShaderChunk.fog_pars_fragment = THREE.ShaderChunk.fog_pars_fragment.replace('varying float vFogDepth;', 'varying float vFogDepth; varying float vFogH;');
THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace('float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );',
  'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth ); fogFactor = clamp( fogFactor * mix( 1.4, 0.35, clamp( vFogH / 5.0, 0.0, 1.0 ) ) + 0.10 * ( 1.0 - clamp( vFogH / 1.6, 0.0, 1.0 ) ) * smoothstep( 2.0, 12.0, vFogDepth ), 0.0, 1.0 );');
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xa9c4ef, 0x5a4330, 1.15)); // cool sky, warm bounce off the sand
const sun = new THREE.DirectionalLight(0xffe2b8, 2.6); sun.position.set(6, 12, 4); sun.castShadow = true;
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

// THE POND: a small pool just outside the rope line. A real water shader, not a blue disc: the surface heaves on three
// crossed sine waves, shades from a shallow sandy edge to a deep teal middle, catches the sun as a moving highlight,
// brightens at grazing angles (fresnel), and wears an animated foam ring where it meets the sand. Leaves that blow
// onto it float, bob and drift. Two draw calls (water + the dug rim).
const POND = { x: 0, z: -13.5, r: 4.2, y: 0.03 };
const pondMat = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uSun: { value: sun.position.clone().normalize() }, uCam: { value: new THREE.Vector3() },
    fogColor: { value: scene.fog.color.clone() }, fogNear: { value: scene.fog.near }, fogFar: { value: scene.fog.far } }, // a COPY: a ShaderMaterial's uniforms are used in place, and sharing the scene's own Color object turned the fog white
  transparent: true, depthWrite: false, fog: true,
  vertexShader: `uniform float uT; varying vec3 vW; varying vec3 vN; varying float vR;
    #include <fog_pars_vertex>
    float h(vec2 p, float t) { return sin(p.x * 2.1 + t * 1.3) * 0.5 + sin(p.y * 2.7 - t * 1.1) * 0.35 + sin((p.x + p.y) * 1.4 + t * 0.7) * 0.4; }
    void main() { vR = length(position.xy) / ${POND.r.toFixed(2)}; vec3 pos = position; vec2 q = position.xy;
      float e = 0.08, H = h(q, uT) * 0.022; pos.z += H;
      float hx = h(q + vec2(e, 0.0), uT) * 0.022 - H, hy = h(q + vec2(0.0, e), uT) * 0.022 - H;
      vN = normalize(vec3(-hx / e, -hy / e, 1.0)); // in the plane's own space (z up); the mesh is laid flat below
      vec4 w = modelMatrix * vec4(pos, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: `uniform float uT; uniform vec3 uSun; uniform vec3 uCam; varying vec3 vW; varying vec3 vN; varying float vR;
    #include <fog_pars_fragment>
    void main() { vec3 n = normalize(vec3(vN.x, vN.z, -vN.y)); // plane space -> world (the mesh is rotated -90 about x)
      vec3 v = normalize(uCam - vW); float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      vec3 deep = vec3(0.07, 0.30, 0.34), shallow = vec3(0.42, 0.62, 0.55), sky = vec3(0.66, 0.77, 0.94);
      vec3 col = mix(deep, shallow, smoothstep(0.55, 1.0, vR)); col = mix(col, sky, fres * 0.55);
      float spec = pow(max(dot(reflect(-uSun, n), v), 0.0), 60.0); col += vec3(1.0, 0.95, 0.85) * spec * 0.9;
      float foam = smoothstep(0.86, 0.93, vR + sin(atan(vW.z - ${POND.z.toFixed(1)}, vW.x) * 9.0 + uT * 1.7) * 0.025) * (1.0 - smoothstep(0.985, 1.0, vR));
      col = mix(col, vec3(0.93, 0.95, 0.92), foam * (0.55 + 0.45 * sin(uT * 2.3 + vR * 40.0)));
      gl_FragColor = vec4(col, 0.92 - fres * 0.1);
      #include <fog_fragment>
    }`,
});
const pond = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 72), pondMat); pond.rotation.x = -Math.PI / 2; pond.position.set(POND.x, POND.y, POND.z); pond.renderOrder = 1; scene.add(pond);
{ const rim = new THREE.Mesh(new THREE.RingGeometry(POND.r - 0.05, POND.r + 0.9, 72), new THREE.MeshStandardMaterial({ color: 0x8a7352, roughness: 1 })); rim.rotation.x = -Math.PI / 2; rim.position.set(POND.x, 0.012, POND.z); scene.add(rim); }
function stepPond(time) { pondMat.uniforms.uT.value = time; pondMat.uniforms.uCam.value.copy(camera.position); }
const inPond = (x, z) => Math.hypot(x - POND.x, z - POND.z) < POND.r - 0.15;

// GOD RAYS: no post-processing on a phone, so the shafts are billboards: long soft planes hung along the sun's own
// direction, additive, slowly breathing. One draw call each, six of them.
const rays = new THREE.Group(); scene.add(rays);
{
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,230,190,0)'); g.addColorStop(0.3, 'rgba(255,230,190,.9)'); g.addColorStop(1, 'rgba(255,230,190,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  const side = x.createLinearGradient(0, 0, 64, 0); side.addColorStop(0, 'rgba(0,0,0,1)'); side.addColorStop(0.5, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = side; x.fillRect(0, 0, 64, 256);
  const tex = new THREE.CanvasTexture(c), dir = sun.position.clone().normalize();
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4 + Math.random() * 1.6, 22), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    // hang the shaft along the sun vector, spread across the ring, each turned a little about the sun axis
    const a = (i / 6) * Math.PI * 2, off = new THREE.Vector3(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5);
    m.position.copy(dir).multiplyScalar(6).add(off); m.position.y = 7 + Math.random() * 2; // HIGH: at 3.5 m they sat between camera and fighters and stacked into a white sky
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); m.rotateY(Math.random() * Math.PI);
    m.userData = { base: 0.08 + Math.random() * 0.06, ph: Math.random() * 6.28, sp: 0.15 + Math.random() * 0.15 }; m.renderOrder = 3; rays.add(m);
  }
}
function stepRays(time) { for (const m of rays.children) m.material.opacity = m.userData.base * (0.6 + 0.4 * Math.sin(time * m.userData.sp + m.userData.ph)); }

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
// LEAVES + DEBRIS (Colin: "little stuff like leaves that blow in the wind... when people swing stuff they push out of
// the way"). One InstancedMesh of tiny two-triangle quads, no texture: a gusting wind field drifts them, they tumble
// in the air and skid on the sand, and anything moving fast near them (a body, a knockback, a weapon tip mid-swing)
// shoves them away. Cheap: 1 draw call, ~5 ms of maths per 1000 at 60 fps on a phone.
const LEAF_N = 420, LEAF_R = RULE.ring + 4;
const leafGeo = (() => { const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, -0.04, 0.07, 0, -0.04, 0.05, 0, 0.06, -0.05, 0, 0.06], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; })();
const leafMesh = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ vertexColors: false, side: THREE.DoubleSide, roughness: 1 }), LEAF_N);
leafMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(LEAF_N * 3), 3);
leafMesh.frustumCulled = false; leafMesh.castShadow = false; scene.add(leafMesh);
const leaves = [];
{ const palette = [0xc96a2b, 0xd9a441, 0x8b5a2b, 0xb8432a, 0x6b6b58, 0x9c8b6a]; // autumn leaves + a few grey scraps
  for (let i = 0; i < LEAF_N; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * LEAF_R;
    leaves.push({ p: new THREE.Vector3(Math.cos(a) * r, Math.random() < 0.8 ? 0.01 : Math.random() * 2.5, Math.sin(a) * r), v: new THREE.Vector3(), rot: new THREE.Euler(0, Math.random() * 6.28, 0), spin: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6), s: 0.7 + Math.random() * 0.7, k: Math.random() });
    leafMesh.setColorAt(i, new THREE.Color(palette[i % palette.length]).offsetHSL(0, 0, (Math.random() - 0.5) * 0.15));
  }
  leafMesh.instanceColor.needsUpdate = true; }
const _lm = new THREE.Matrix4(), _lq = new THREE.Quaternion(), _ls = new THREE.Vector3(), _wind = new THREE.Vector3(), _tipP = new THREE.Vector3();
const wind = { dir: 0.9, t: 0 };
function stepLeaves(dt, time) {
  // a slow-turning wind with gusts: base breeze + a sine gust + a rare strong one that lifts the settled ones
  wind.t += dt; wind.dir += Math.sin(time * 0.11) * 0.08 * dt;
  const gust = Math.max(0, Math.sin(time * 0.6) + Math.sin(time * 1.7) * 0.5) ; const big = Math.sin(time * 0.23) > 0.97 ? 1 : 0;
  const w = 0.35 + gust * 0.9 + big * 3; _wind.set(Math.cos(wind.dir), 0, Math.sin(wind.dir)).multiplyScalar(w);
  // shovers: every fighter's feet (with his velocity), plus the weapon tip of anyone mid-swing
  const sh = [];
  for (const f of fighters) { sh.push({ p: f.root.position, r: 0.9, v: f.vel, push: 1.5 + f.vel.length() * 0.6 + (f.state === 'move' ? 1.2 : 0) }); if (f.state === 'attack' && f.tip && f.move && !f.move.ranged && f.prog > f.move.at - 0.25) { f.tip.getWorldPosition(_tipP); sh.push({ p: _tipP.clone(), r: 1.1, v: null, push: 7 }); } }
  for (let i = 0; i < LEAF_N; i++) {
    const L = leaves[i], onGround = L.p.y <= 0.012;
    // wind: airborne leaves take it fully; settled ones only in a gust strong enough to lift them (per-leaf threshold)
    if (!onGround) L.v.addScaledVector(_wind, dt * 1.6); else if (w > 1.1 + L.k * 1.6) { L.v.addScaledVector(_wind, dt * 2.5); L.v.y += (0.6 + Math.random() * 1.2); }
    for (const q of sh) { const dx = L.p.x - q.p.x, dz = L.p.z - q.p.z, d2 = dx * dx + dz * dz; if (d2 < q.r * q.r && d2 > 1e-4) { const d = Math.sqrt(d2), k = (1 - d / q.r) * q.push; L.v.x += (dx / d) * k * dt * 8; L.v.z += (dz / d) * k * dt * 8; L.v.y += k * dt * 4 * (q.v ? 0.6 : 1.4); if (q.v) L.v.addScaledVector(q.v, k * dt * 2); } }
    L.v.y -= (onGround ? 0 : 2.6) * dt; L.v.multiplyScalar(Math.exp(-(onGround ? 4.5 : 1.3) * dt)); // leaves fall slowly (drag), skid briefly on the ground
    L.p.addScaledVector(L.v, dt);
    if (inPond(L.p.x, L.p.z) && L.p.y < POND.y + 0.05) { // afloat: ride the water, bob, drift with the breeze, lie flat
      L.p.y = POND.y + 0.012 + Math.sin(time * 1.6 + L.k * 6.28) * 0.012; L.v.y = 0; L.v.multiplyScalar(Math.exp(-2 * dt)); L.v.addScaledVector(_wind, dt * 0.12);
      L.rot.x *= 1 - 4 * dt; L.rot.z *= 1 - 4 * dt; L.rot.y += 0.3 * dt;
    } else if (L.p.y < 0.01) { L.p.y = 0.01; L.v.y = 0; }
    const r = Math.hypot(L.p.x, L.p.z); if (r > LEAF_R) { const a = Math.atan2(-L.p.z, -L.p.x) + (Math.random() - 0.5); L.p.set(Math.cos(a) * LEAF_R * 0.98, 0.01, Math.sin(a) * LEAF_R * 0.98); L.v.set(0, 0, 0); } // blown out: come back in upwind
    const sp = L.v.length();
    if (!onGround || sp > 0.3) { L.rot.x += L.spin.x * dt * (0.3 + sp); L.rot.y += L.spin.y * dt * (0.3 + sp); L.rot.z += L.spin.z * dt * (0.3 + sp); } // tumble in the air, lie still on the ground
    else { L.rot.x *= 1 - 3 * dt; L.rot.z *= 1 - 3 * dt; } // settle flat
    _lq.setFromEuler(L.rot); _ls.setScalar(L.s); _lm.compose(L.p, _lq, _ls); leafMesh.setMatrixAt(i, _lm);
  }
  leafMesh.instanceMatrix.needsUpdate = true;
}
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
// a team's colour as a THREE.Color (its palette entry, or the warm default for 'as painted')
const teamColor = (t) => new THREE.Color(PALETTE[TEAM[t]] ?? 0xffb040);
// the YIQ hue angle of a colour: what the paint shader swings the coloured texels to
const yiqAngle = (c) => Math.atan2(0.211 * c.r - 0.523 * c.g + 0.312 * c.b, 0.596 * c.r - 0.274 * c.g - 0.322 * c.b);
const hueOf = (t) => (PALETTE[TEAM[t]] == null ? 99 : yiqAngle(new THREE.Color(PALETTE[TEAM[t]])));
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
  const pos = T.mesh.geometry.attributes.position, col = T.mesh.geometry.attributes.color, c = teamColor(f.team);
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
const POPS = makePops(scene);
const pop = POPS.pop, stepPops = POPS.step;
function slashAngle(f, dir) { // screen-space angle of the swing (from the trail's last points), else across the push
  const T = f.trail.pts, n = T.length;
  const a = n > 2 ? T[n - 3].a.clone() : new THREE.Vector3(), b = n > 2 ? T[n - 1].a.clone() : a.clone().add(new THREE.Vector3(-dir.z, 0.3, dir.x));
  a.project(camera); b.project(camera);
  return Math.atan2((b.y - a.y) / camera.aspect, b.x - a.x);
}

// sound: Colin's own recordings from Weirdport, decoded on the first tap (browsers block audio before one)
const SND = { hit: ['hit_sound_01', 'hit_sound_02', 'hit_sound_03'], heavy: ['hit_sound_gound_01'], swing: ['swoosh_01', 'swoosh_02', 'swoosh_03'],
  clang: ['metal_clang_01', 'metal_clang_02'], grunt: ['alien_orc_grunt_01', 'alien_orc_grunt_03', 'alien_orc_grunt_05'], shot: ['blaster_sound_01'],
  step: ['footstep_l', 'footstep_r', 'footstep_2_l', 'footstep_2_r'] };
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
// ABSOLUTE team colours (B172 rotated the hue, so one 'team' came out purple on the warrior and blue on the demon --
// the paint starts from different hues). Now every strongly coloured texel takes the team's hue outright, keeping its own
// brightness and saturation, so a whole team matches its swatch. null = as painted.
const PALETTE = [null, 0xe0402a, 0xf2a020, 0x3fcf5a, 0x2ec8e0, 0x3a62f0, 0xb050f0];
const TEAM = [0, 5];  // left as painted, right blue
function tint(mat, list, hue) {
  mat.emissive = new THREE.Color(0); list.push(mat);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uHue = mat.userData.hue || hue || { value: 0 };
    sh.uniforms.uKey = { value: mat.userData.key ? 1.0 : 0.0 };
    sh.fragmentShader = 'uniform float uHue; uniform float uKey;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      {
        vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), d = mx - mn, sat = mx > 0.0 ? d / mx : 0.0;
        float w = smoothstep(0.28, 0.45, sat) * step(uHue, 50.0); // 99 = as painted
        if (uKey > 0.5) { // KEY rigs: only pure crimson (hue within ~18 deg of 352, sat > .55, value > .3) is team paint
          float h = 0.0;
          if (d > 0.0) { if (mx == c.r) h = mod((c.g - c.b) / d, 6.0); else if (mx == c.g) h = (c.b - c.r) / d + 2.0; else h = (c.r - c.g) / d + 4.0; h *= 60.0; }
          float dh = min(abs(h - 352.0), 360.0 - abs(h - 352.0));
          w = (1.0 - smoothstep(14.0, 22.0, dh)) * smoothstep(0.45, 0.6, sat) * step(0.3, mx) * step(uHue, 50.0);
        }
        const mat3 toY = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
        const mat3 toR = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
        vec3 y = toY * c; float r = length(y.yz); y.yz = vec2(cos(uHue), sin(uHue)) * r; // swing to the team hue
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
  const mats = [], hue = { value: hueOf(side < 0 ? 0 : 1) }; // one team colour per side
  model.traverse((o) => {
    if (!o.isMesh) return; o.castShadow = true; o.frustumCulled = false;
    o.material = o.material.clone(); o.material.userData.key = !!RIGS[def.rig].key; o.material = tint(o.material, mats, hue);
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
  const f = { def, side, root, model, mixer, actions, mats, hand, tail, hue, tip: weaponTip, foot, footL, hips, feetUp: [false, false], fell: false, trail, hp: def.hp, guard: RULE.guard, parryT: 0, combo: 0, cur: null, state: 'idle', t: 0, think: 0,
    vel: new THREE.Vector3(), flash: 0, swingDone: false, move: null, ko: false, h: def.h };
  f.team = side < 0 ? 0 : 1; // two lines facing each other, a stagger so the back row is not hidden
  root.position.set(side * (3.2 + (slot % 2) * 1.3), 0, (slot - (n - 1) / 2) * 1.5); root.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  scene.add(root); play(f, def.style.idle);
  return f;
}
function play(f, name, once = false, speed = 1, fade = 0.15, fallback = null) {
  const a = f.actions[name] || (fallback && f.actions[fallback]); if (!a) return null;
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

// YOU vs one: the left fighter is driven by a thumb (virtual stick, ATTACK / BLOCK buttons, a flick to dodge roll).
// Same rules as the AI: same moves, same guard, same parry; only the decisions come from the pad.
const PAD = { on: false, x: 0, y: 0, mag: 0, rx: 0, ry: 0, rmag: 0, rhold: false, flick: null, rflick: false, jump: false, charge: 0 };
// WEIRDPORT'S MAP (Colin): left stick = move, flick = roll. Right stick = camera drag; FLICK = a strike that way;
// hold UP = fire (gun) / wind up a heavy swing (melee, released on the lift); hold DOWN = block; a TAP on either = jump.
const RPAD = { fireAt: 0.78, keepAt: 0.5, blockAt: 0.55, arc: 0.35, chargeT: 0.8, tapT: 220, flickT: 260 }; // tap / flick windows in ms
function padStep(f, dt) {
  const S = f.def.style, o = other(f);
  const busy = ['attack', 'hit', 'break', 'down', 'ko', 'getup', 'dodge', 'backstep'].includes(f.state);
  if (PAD.flick && !busy) { // left flick: dodge roll that way, untouchable for the roll
    const d = flat(f, o), fwd = d.clone().normalize(), side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    f.rollDir = PAD.flick.dot(side) >= 0 ? 1 : -1; setState(f, 'dodge', RULE.rollT); stats.roll++;
    play(f, S.run, false, 1.6, 0.06); puff(f.root.position.clone(), 4, { size: 0.3, spread: 1, up: 0.5, life: 0.6 });
  }
  PAD.flick = null;
  if (PAD.jump && !busy && !f.air) { f.air = 4.6; puff(f.root.position.clone(), 3, { size: 0.25, spread: 0.6, up: 0.3, life: 0.5 }); } // a hop; no clip for it yet
  PAD.jump = false;
  if (f.air !== undefined && f.air !== null) { f.root.position.y += f.air * dt; f.air -= 14 * dt; if (f.root.position.y <= 0) { f.root.position.y = 0; f.air = null; } }
  const up = PAD.rhold && -PAD.ry > (PAD.firing ? RPAD.keepAt : RPAD.fireAt) && Math.abs(PAD.rx) < RPAD.arc + 0.2;
  const down = PAD.rhold && PAD.ry > RPAD.blockAt && Math.abs(PAD.rx) < RPAD.arc + 0.2;
  PAD.firing = up;
  if (busy) { PAD.rflick = false; if (!up) PAD.charge = 0; return; }
  if (PAD.rflick) { PAD.rflick = false; PAD.charge = 0; if (S.attacks && S.attacks.length) return startAttack(f, S.attacks[(rng() * S.attacks.length) | 0]); if (S.shoot) return startShot(f); }
  if (up) { // the trigger: a gun fires on its own; a melee winds up (charge builds while held)
    if (S.shoot) { PAD.charge = 0; return startShot(f); }
    PAD.charge = Math.min(1, PAD.charge + dt / RPAD.chargeT);
    if (f.state !== 'charge') { setState(f, 'charge', 99); play(f, S.block, false, 0.6, 0.15); } // wind-up pose stands in for a charge clip
    return;
  }
  if (f.state === 'charge') { // released: the heavy swing, harder and a touch slower the longer it was held
    const c = PAD.charge; PAD.charge = 0; const m = S.attacks[(rng() * S.attacks.length) | 0];
    return startAttack(f, { ...m, dmg: m.dmg * (1 + 0.8 * c), spd: m.spd * (1 - 0.15 * c), heavy: c > 0.5 });
  }
  if (down && f.guard > 0) { if (f.state !== 'block') { setState(f, 'block', 99); play(f, S.block); } return; }
  if (f.state === 'block') { setState(f, 'idle', 0); play(f, S.idle); }
  if (PAD.mag > 0.15) { // walk/run where the left thumb points, screen-relative, still facing him
    const cf = new THREE.Vector3(view.cx - camera.position.x, 0, view.cz - camera.position.z).normalize(), cr = new THREE.Vector3(-cf.z, 0, cf.x);
    const dir = cr.multiplyScalar(PAD.x).add(cf.multiplyScalar(-PAD.y)).normalize();
    const run = PAD.mag > 0.7, sp = (run ? 4.2 : 1.8) * f.def.speed * (f.h / 1.9);
    f.root.position.addScaledVector(dir, sp * dt);
    const face = new THREE.Vector3(Math.sin(f.root.rotation.y), 0, Math.cos(f.root.rotation.y)), along = dir.dot(face), across = dir.dot(new THREE.Vector3(-face.z, 0, face.x));
    const clip = along < -0.5 ? S.back : Math.abs(across) > 0.7 ? (across > 0 ? S.left : S.right) : run ? S.run : S.walk;
    if (f.state !== 'pmove') setState(f, 'pmove', 0); play(f, clip, false, run ? 1 : 1.1, 0.12, S.walk);
  } else if (f.state === 'pmove') { setState(f, 'idle', 0); play(f, S.idle); }
}
function brain(f, dt) {
  if (f.player) return padStep(f, dt);
  if (!foes(f).length) { if (koCam && koCam.t < KO.beat) return; if (f.state !== 'taunt' && !f.ko) { setState(f, 'taunt', 99); play(f, f.def.style.taunt, false); } return; } // last team standing
  const strafing = f.state === 'circle'; // a strafe can be cut short by a read; nothing else can
  if (!['idle', 'move'].includes(f.state) && !strafing) return;
  if ((f.think -= dt) > 0) return; f.think = RULE.think * (0.6 + rng() * 0.8);
  if (rng() < 0.08) f.target = nearestFoe(f); // in a brawl, now and then turn to whoever is closest
  const o = other(f), S = f.def.style, d = flat(f, o).length();
  // seeing a swing coming (from anyone aimed at him): block it, or roll
  const threat = fighters.find((x) => x.team !== f.team && x.target === f && x.state === 'attack' && x.move && x.prog < x.move.at && flat(f, x).length() < x.move.reach + 0.6);
  if (strafing && !threat) return;
  if (threat && rng() < RULE.readBlock) {
    if (rng() < RULE.roll || f.guard <= 25) { // DODGE ROLL: out of the line of the swing, untouchable for the roll
      f.rollDir = rng() < 0.5 ? 1 : -1; setState(f, 'dodge', RULE.rollT); stats.roll++;
      play(f, S.run, false, 1.6, 0.06); puff(f.root.position.clone(), 4, { size: 0.3, spread: 1, up: 0.5, life: 0.6 }); return;
    }
    setState(f, 'block', 0.35 + rng() * 0.35); play(f, S.block); return;
  }
  if (f.hurtT > 0 && rng() < RULE.backstep) { f.hurtT = 0; setState(f, 'backstep', 0.35 + rng() * 0.25); stats.backstep++; return; } // just got hit: get out of range
  if (S.shoot && d > S.keep[0] && d < S.keep[1]) { // gunner: shoot, or strafe along the keep band between shots
    if (rng() < 0.35) { f.circleDir = rng() < 0.5 ? 1 : -1; setState(f, 'circle', 0.5 + rng() * 0.5); stats.circle++; return; }
    return startShot(f);
  }
  const want = S.shoot && d > S.keep[1] ? S.keep[1] - 1 : S.reach - Math.min(0.6, (f.whiffs || 0) * 0.15); // whiffing? step in
  if (d > want + 0.2) { setState(f, 'move', 0); return; }
  const r = rng();
  if (r < 0.62) startAttack(f, S.attacks[(rng() * S.attacks.length) | 0]);
  else if (r < 0.62 + RULE.circle) { f.circleDir = rng() < 0.5 ? 1 : -1; setState(f, 'circle', 0.4 + rng() * 0.5); stats.circle++; } // footwork: circle him
  else if (r < 0.62 + RULE.circle + 0.16 && f.guard > 25) { setState(f, 'block', 0.3 + rng() * 0.4); play(f, S.block); }
  else { setState(f, 'idle', 0); f.think = 0.15 + rng() * 0.25; play(f, S.idle); }
}
function startAttack(f, m) {
  stats.swings++; f.lastStrike = null; f.landed = false;
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
  if (b.state === 'dodge') { sound('swing', 0.35); stats.dodge++; return; } // rolled clear
  if (b.state === 'block' && facing(b, a) > 0.2 && !m.counter) return blocked(a, b, m, dir, RULE.blockKeep);
  const r = rng();
  if (b.state !== 'break' && r < RULE.dodge && ['idle', 'move'].includes(b.state)) { // sidestep
    const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(rng() < 0.5 ? 1 : -1);
    b.vel.addScaledVector(side, 4).addScaledVector(dir, 1.5); sound('swing', 0.3); stats.dodge++; return;
  }
  if (b.state !== 'break' && r < RULE.dodge + RULE.glance) return hurt(a, b, m.dmg * 0.5, dir, 0.4, false, true, hp);
  const floor = rng() < (b.state === 'break' ? 0.6 : m.big || RULE.crit);
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
  b.hp -= m.dmg * keep; b.guard -= m.dmg * (m.big ? 2.8 : 2.1);
  b.vel.addScaledVector(dir, 1.2); burst(chest(b).addScaledVector(dir, -0.3), dir.clone().negate(), 0x9fe0ff, 14, 3);
  pop(chest(b).addScaledVector(dir, -0.35), 0x9fe0ff, 0.8, 0.14); sound('clang', 0.5); shake = Math.max(shake, 0.06);
  if (b.hp <= 0) return ko(b, dir);
  if (b.guard <= 0) { // GUARD BREAK: the shield arm drops, he reels, wide open
    b.guard = 0; stats.breaks++; setState(b, 'break', RULE.breakStun); play(b, b.def.style.hits[2] || b.def.style.hits[0], true, 0.7, 0.08);
    b.vel.addScaledVector(dir, 2.5); pop(chest(b), 0xffffff, 1.6, 0.25); burst(chest(b), new THREE.Vector3(0, 1, 0), 0xffffff, 30, 4); sound('heavy', 0.7); shake = Math.max(shake, 0.2);
    hitstop = RULE.hitstop; return;
  }
  play(b, b.def.style.blockHit, true, 1.2 * RULE.pace, 0.08); setState(b, 'block', dur(b, b.def.style.blockHit, 1.2 * RULE.pace) * 0.6);
  b.parryT = RULE.parry; // the counter window
}
function hurt(a, b, dmg, dir, knock, floor, light = false, hp = null) {
  a.landed = true; b.hurtT = 1.2;
  if (a.move && a.move.limb === 'foot') pebbles(b.root.position.clone(), dir, 8); // a kick throws up the sand
  if (!(a.move && a.move.ranged)) stats[light ? 'glance' : floor ? 'floor' : 'hit']++;
  b.hp -= dmg; b.flash = 1; hitstop = RULE.hitstop * (light ? 0.5 : 1); shake = Math.max(shake, light ? 0.06 : floor ? 0.25 : 0.14);
  const p = hp ? hp.clone() : chest(b).addScaledVector(dir, -0.25); // sparks where it actually struck
  burst(p, dir.clone().negate().add(new THREE.Vector3(0, 0.4, 0)), teamColor(a.team).lerp(new THREE.Color(1, 0.95, 0.8), floor ? 0.2 : 0.45), light ? 10 : 24, light ? 2.5 : 4.5);
  const tc = teamColor(a.team);
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
    else if (v < 0.5 && f.feetUp[i] && _fp.y < 0.12 * f.h) { f.feetUp[i] = false; footstep(f); puff(_fp, f.state === 'move' ? 4 : 2, { size: 0.24, spread: 0.7, up: 0.45, life: 0.7 }); }
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
// footsteps: one per planted foot, quieter in a crowd, never more than one every 70 ms across the whole arena
let stepGap = 0;
function footstep(f) {
  if (stepGap > 0) return; stepGap = 0.07;
  sound('step', (f.state === 'move' ? 0.32 : 0.2) * Math.min(1.4, f.h / 1.9) * (fighters.length > 2 ? 0.6 : 1));
}
// KO MOMENT: the blow that ends the fight drops the world into slow motion, the camera pushes in on the one going down,
// and the winner waits a beat before the taunt. Real-time seconds; window.duel.KO to tune.
const KO = { slow: 0.22, hold: 1.1, ease: 0.6, push: 0.55, beat: 1.9 };
let koCam = null; // { t, who }
function ko(b, dir) {
  if (fighters.filter((f) => f.team === b.team && f !== b).every((f) => f.ko)) koCam = { t: 0, who: b };
  b.ko = true; b.hp = 0; setState(b, 'ko', 99); play(b, b.def.style.fall, true, 1, 0.08); b.vel.addScaledVector(dir, 3);
  sound('heavy', 0.9); shake = 0.3; hud();
}
let hitstop = 0;
const stats = { swings: 0, whiff: 0, block: 0, dodge: 0, glance: 0, hit: 0, floor: 0, breaks: 0, parry: 0, combo: 0, circle: 0, backstep: 0, roll: 0 }; // live tally (window.duel.stats)

function stepFighter(f, dt) {
  const o = other(f), S = f.def.style;
  f.t -= dt; brain(f, dt);
  // turn to face the other one (not while flat on the floor)
  if (!['down', 'ko', 'getup'].includes(f.state)) {
    const d = flat(f, o), want = Math.atan2(d.x, d.z); let dy = want - f.root.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.root.rotation.y += dy * Math.min(1, dt * 8);
  }
  if (f.state === 'circle' || f.state === 'backstep' || f.state === 'dodge') { // footwork, always facing him
    const d = flat(f, o), dist = d.length() || 1, fwd = d.clone().divideScalar(dist), side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const base = f.def.speed * (f.h / 1.9);
    if (f.state === 'circle') { f.root.position.addScaledVector(side, f.circleDir * 1.7 * base * dt); if (dist > S.reach + 0.4 && !S.shoot) f.root.position.addScaledVector(fwd, 0.6 * base * dt); play(f, f.circleDir > 0 ? S.left : S.right, false, 1.1, 0.15, S.walk); }
    else if (f.state === 'backstep') { f.root.position.addScaledVector(fwd, -2.2 * base * dt); play(f, S.back, false, 1.2, 0.1, S.walk); }
    else { f.root.position.addScaledVector(side, f.rollDir * 6 * base * dt); f.root.position.addScaledVector(fwd, -0.8 * base * dt); }
    if (f.t <= 0) { setState(f, 'idle', 0); f.think = 0.05 + rng() * 0.15; play(f, S.idle); }
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
    if (f.t <= 0 || f.prog > 0.8) {
      const o = other(f);
      if (f.landed && !f.move.ranged && f.combo < 1 && o && !o.ko && !['down', 'ko'].includes(o.state) && flat(f, o).length() < f.move.reach + 0.5 && rng() < RULE.combo) {
        f.combo++; const next = S.attacks.filter((x) => x.c !== f.move.c); startAttack(f, next[(rng() * next.length) | 0]); stats.combo++; // COMBO: straight into the next swing
      } else { f.combo = 0; setState(f, 'idle', 0); f.think = 0.05 + rng() * 0.2; play(f, S.idle, false, 1, 0.2); } // cut the long recoveries
    }
  }
  if ((f.state === 'block' || f.state === 'hit' || f.state === 'break') && f.t <= 0 && !(f.player && f.state === 'block')) { setState(f, 'idle', 0); play(f, S.idle); }
  if (f.state !== 'block') f.guard = Math.min(RULE.guard, f.guard + RULE.guardRegen * dt);
  if (f.hurtT > 0) f.hurtT -= dt;
  if (f.parryT > 0) { f.parryT -= dt; const o = other(f); // PARRY: counter straight out of the block, unblockable, fast
    if (f.state === 'block' && o && !o.ko && flat(f, o).length() < f.def.style.reach + 0.5 && rng() < RULE.parryP * dt * 12) {
      f.parryT = 0; const m = S.attacks[0]; startAttack(f, { ...m, spd: m.spd * 1.3, dmg: m.dmg * 1.3, counter: true }); stats.parry++;
      pop(chest(f), teamColor(f.team), 1.1, 0.2, slashTex, 0, 2.5);
    }
  }
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
let stick = null, rstick = null; // { id, x0, y0, t0 }
const stickEl = document.getElementById('stick'), knobEl = document.getElementById('knob'), rstickEl = document.getElementById('rstick'), rknobEl = document.getElementById('rknob');
canvas.addEventListener('pointerdown', (e) => {
  audioOn();
  if (PAD.on && !stick && e.clientX < innerWidth * 0.5) { // the left stick appears under the thumb
    stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), far: 0 };
    stickEl.hidden = false; stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; knobEl.style.transform = 'translate(0,0)'; return;
  }
  if (PAD.on && !rstick && e.clientX >= innerWidth * 0.5) { // the right stick: camera, trigger, block, strike
    rstick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), far: 0, o: view.orbit };
    rstickEl.hidden = false; rstickEl.style.left = e.clientX + 'px'; rstickEl.style.top = e.clientY + 'px'; rknobEl.style.transform = 'translate(0,0)'; PAD.rhold = true; return;
  }
  pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, o: view.orbit, z: view.zoom, pd: pinchD() };
});
const STICK_R = 56;
canvas.addEventListener('pointermove', (e) => {
  if (stick && e.pointerId === stick.id) {
    let dx = e.clientX - stick.x0, dy = e.clientY - stick.y0; const L = Math.hypot(dx, dy); stick.far = Math.max(stick.far, L);
    if (L > STICK_R) { dx *= STICK_R / L; dy *= STICK_R / L; }
    PAD.x = dx / STICK_R; PAD.y = dy / STICK_R; PAD.mag = Math.min(1, L / STICK_R); knobEl.style.transform = `translate(${dx}px,${dy}px)`; return;
  }
  if (rstick && e.pointerId === rstick.id) {
    let dx = e.clientX - rstick.x0, dy = e.clientY - rstick.y0; const L = Math.hypot(dx, dy); rstick.far = Math.max(rstick.far, L);
    if (L > STICK_R) { dx *= STICK_R / L; dy *= STICK_R / L; }
    PAD.rx = dx / STICK_R; PAD.ry = dy / STICK_R; PAD.rmag = Math.min(1, L / STICK_R); rknobEl.style.transform = `translate(${dx}px,${dy}px)`;
    if (Math.abs(PAD.rx) > RPAD.arc || Math.abs(PAD.ry) < 0.3) view.orbit = rstick.o + (e.clientX - rstick.x0) * 0.008; // sideways: the camera
    return;
  }
  if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
  if (pts.size >= 2 && drag.pd) view.zoom = Math.min(2.5, Math.max(0.45, drag.z * drag.pd / pinchD()));
  else if (drag) view.orbit = drag.o + (e.clientX - drag.x) * 0.008;
});
const lift = (e) => {
  if (stick && e.pointerId === stick.id) { // a quick sweep across the pad is a FLICK: dodge that way
    const dt = performance.now() - stick.t0, dx = e.clientX - stick.x0, dy = e.clientY - stick.y0;
    if (dt < RPAD.flickT && Math.hypot(dx, dy) > STICK_R * 0.9 && fighters[0]) {
      const cf = new THREE.Vector3(view.cx - camera.position.x, 0, view.cz - camera.position.z).normalize(), cr = new THREE.Vector3(-cf.z, 0, cf.x);
      PAD.flick = cr.multiplyScalar(dx).add(cf.multiplyScalar(-dy)).normalize();
    }
    else if (dt < RPAD.tapT && stick.far < 12) PAD.jump = true; // a tap: jump
    stick = null; PAD.x = PAD.y = PAD.mag = 0; stickEl.hidden = true; return;
  }
  if (rstick && e.pointerId === rstick.id) {
    const dt = performance.now() - rstick.t0, dx = e.clientX - rstick.x0, dy = e.clientY - rstick.y0;
    if (dt < RPAD.flickT && Math.hypot(dx, dy) > STICK_R * 0.9) PAD.rflick = true; // a sweep: strike
    else if (dt < RPAD.tapT && rstick.far < 12) PAD.jump = true; // a tap: jump
    rstick = null; PAD.rx = PAD.ry = PAD.rmag = 0; PAD.rhold = false; rstickEl.hidden = true; return;
  }
  pts.delete(e.pointerId); if (!pts.size) drag = null;
};
canvas.addEventListener('pointerup', lift); canvas.addEventListener('pointercancel', lift);
canvas.addEventListener('wheel', (e) => { view.zoom = Math.min(2.5, Math.max(0.45, view.zoom * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: true });
function pinchD() { const v = [...pts.values()]; return v.length >= 2 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0; }
function koPush() { // 0..1: how far the KO push-in is (in, hold, then back out)
  if (!koCam) return 0; const t = koCam.t;
  return t < KO.ease * 0.5 ? t / (KO.ease * 0.5) : t < KO.hold ? 1 : Math.max(0, 1 - (t - KO.hold) / KO.ease);
}
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
  const push = koPush(); if (push > 0) mid.lerp(koCam.who.root.position, push);
  const k = 1 - Math.exp(-dt * (push > 0 ? 6 : 3)); view.cx += (mid.x - view.cx) * k; view.cz += (mid.z - view.cz) * k;
  // fit both fighters (plus a body-width margin) across the SCREEN WIDTH and a tall fighter top to bottom
  const vh = THREE.MathUtils.degToRad(camera.fov) / 2, hh = Math.atan(Math.tan(vh) * camera.aspect);
  // extents in the camera's own frame: across the screen (along dir) and towards it (along perp)
  let wide = 0, deep = 0;
  for (const f of up) { const dx = f.root.position.x - view.cx, dz = f.root.position.z - view.cz; wide = Math.max(wide, Math.abs(dx * dir.x + dz * dir.z)); deep = Math.max(deep, Math.abs(dx * perp.x + dz * perp.z)); }
  const crowd = up.length > 2;
  const fit = Math.max((wide + 1.3) / Math.tan(hh) + deep, 1.7 / Math.tan(vh) + deep, 4) * (crowd ? 1.1 : 1);
  view.d += (fit * view.zoom * (1 - push * (1 - KO.push)) - view.d) * k;
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
  document.getElementById('gdA').style.width = (sum(A, (f) => f.guard) / (A.length * RULE.guard)) * 100 + '%';
  document.getElementById('gdB').style.width = (sum(B, (f) => f.guard) / (B.length * RULE.guard)) * 100 + '%';
  document.getElementById('barA').classList.toggle('win', b.ko && !a.ko); document.getElementById('barB').classList.toggle('win', a.ko && !b.ko);
}
function fight() {
  koCam = null;
  for (const f of fighters) { scene.remove(f.root); scene.remove(f.trail.mesh); f.trail.mesh.geometry.dispose(); f.mixer.stopAllAction(); }
  for (const q of scuffs) { scene.remove(q.m); q.m.material.dispose(); } scuffs.length = 0;
  fighters.length = 0; rng = mulberry((Math.random() * 1e9) | 0);
  const n = SIZES[size];
  for (let i = 0; i < n; i++) fighters.push(spawn(ROSTER[picks[0]], -1, i, n), spawn(ROSTER[picks[1]], 1, i, n));
  if (PAD.on && fighters[0]) fighters[0].player = true;
  view.dir = null; hud(); paintTeams();
}
document.querySelectorAll('[data-i]').forEach((el) => (el.outerHTML = svg(el.dataset.i)));
const tap = (id, fn) => document.getElementById(id).addEventListener('pointerup', (e) => { e.stopPropagation(); audioOn(); fn(); });
tap('pickA', () => { picks[0] = (picks[0] + 1) % ROSTER.length; fight(); });
tap('pickB', () => { picks[1] = (picks[1] + 1) % ROSTER.length; fight(); });
tap('fight', fight);
tap('size', () => { size = (size + 1) % SIZES.length; document.querySelector('#size small').textContent = SIZES[size] + 'V' + SIZES[size]; fight(); });
tap('slow', () => { slow = !slow; document.getElementById('slow').classList.toggle('on', slow); });
tap('view', () => { view.orbit = 0; view.zoom = 1; });
tap('you', () => { PAD.on = !PAD.on; document.getElementById('you').classList.toggle('on', PAD.on); document.body.classList.toggle('you', PAD.on); if (PAD.on) { size = 0; document.querySelector('#size small').textContent = '1V1'; } fight(); });

// TEAM COLOURS: tap a side's bar to step its colour; live, no respawn. Paint, trails, sparks, swatch and bar all follow.
function paintTeams() {
  for (const t of [0, 1]) {
    const c = teamColor(t), css = '#' + c.getHexString(), hi = '#' + c.clone().lerp(new THREE.Color(1, 1, 1), 0.45).getHexString();
    document.getElementById(t ? 'swB' : 'swA').style.background = css;
    document.getElementById(t ? 'hpB' : 'hpA').style.background = `linear-gradient(${hi}, ${css})`;
    for (const f of fighters) if (f.team === t) f.hue.value = hueOf(t);
    document.getElementById(t ? 'swB' : 'swA').classList.toggle('orig', PALETTE[TEAM[t]] == null);
  }
}
for (const [id, t] of [['barA', 0], ['barB', 1]]) document.getElementById(id).addEventListener('pointerup', (e) => {
  e.stopPropagation(); audioOn();
  let k = (TEAM[t] + 1) % PALETTE.length; if (k === TEAM[1 - t] && k) k = (k + 1) % PALETTE.length; // never both the same colour
  TEAM[t] = k; paintTeams();
});
tap('home', () => { location.href = './'; });

// ---------------------------------------------------------------- go
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 55 : 40; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let time = 0;
function frame() {
  requestAnimationFrame(frame);
  const real = Math.min(0.05, clock.getDelta()); let dt = real * (slow ? 0.3 : 1);
  stepGap -= real;
  if (koCam) { koCam.t += real; if (koCam.t < KO.hold) dt *= KO.slow; else if (koCam.t < KO.hold + KO.ease) dt *= KO.slow + (1 - KO.slow) * (koCam.t - KO.hold) / KO.ease; }
  if (hitstop > 0) { hitstop -= dt; dt *= 0.05; }
  time += dt;
  for (const f of fighters) stepFighter(f, dt);
  for (const f of fighters) { f.mixer.update(dt); stepTail(f, time); }
  stepSparks(dt); stepPops(dt); stepDust(dt); stepScuffs(dt); stepLeaves(dt, time); stepRays(time); stepPond(time);
  for (const f of fighters) stepTrail(f, dt);
  for (let i = tracers.length - 1; i >= 0; i--) { const t = tracers[i]; t.t -= dt; t.l.material.opacity = Math.max(0, t.t / 0.09); if (t.t <= 0) { scene.remove(t.l); t.l.geometry.dispose(); tracers.splice(i, 1); } }
  stepCamera(dt); hud();
  renderer.render(scene, camera);
}
Promise.all([...Object.keys(RIGS).map(loadRig), ...Object.keys(WEAPONS).map((k) => loadWeapon(k).then((w) => ({ weapon: k, w })))]).then((rs) => {
  for (const r of rs) if (r.weapon) WEAPDATA[r.weapon] = r.w; else RIGDATA[r.key] = r;
  document.getElementById('load').remove(); fight(); frame();
  window.duel = { PAD, RPAD, KO, POND, inPond, rays, pond, leaves, dust, scuffs, stats, fighters, RULE, ROSTER, MELEE, GUN, RIGDATA, WEAPDATA, TEAM, PALETTE }; // live tuning from a desktop console
});

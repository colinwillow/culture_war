// Mirrors sim state into the scene every frame. Reads the sim, never writes to it.
import { THREE, scene, camera, mat, box, basic, ringMesh, disposeObj, casts } from './scene.js?v=137';
import { makeMember, bldMesh, nodeMesh, formation, FC } from './models.js?v=137';
import { makeChar, charsReady, play, CAST } from './chars.js?v=137';
import { emit } from '../fx/particles.js?v=137';
import { bark } from '../fx/sfx.js?v=137';
import { TICK } from '../config/factions.js?v=137';
import { walkH } from '../map/layout.js?v=137';
import { NODE_AMOUNT, BLD, BUILD_RADIUS, FACTIONS } from '../config/factions.js?v=137';
import { CAM } from '../camera/camera.js?v=137';
const fac0 = (S) => FACTIONS[S.players[0].f];
import { Q, pl, getSim } from '../sim/sim.js?v=137';
import { UI } from '../ui/state.js?v=137';
import { fxConfetti, fxDeath } from '../fx/fx.js?v=137';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { lerpAngle } from '../util/math.js?v=137';
// Selection rings take your faction colour, washed toward white so they still pop on any ground.
const selCol = () => { const S = getSim(), f = S && S.players[0].f; return f ? new THREE.Color(FC[f].main).lerp(new THREE.Color(0xffffff), 0.35).getHex() : 0xffffff; };

const corpses = []; // squads wiped out: their last bodies finish falling before removal
const dying = []; // buildings collapsing: { root, t, tilt }
const R = { sq: new Map(), bl: new Map(), nodes: new Map(), zones: new Map(), pend: new Map(), ghost: null };

function makeBar(w) {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.08, 0.24), basic(0x000000, 0.6));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.16), basic(0x7ee05b, 1));
  fill.position.z = 0.01; g.add(bg, fill); g.renderOrder = 5;
  return { g, fill, w };
}
function setBar(bar, f, color) {
  f = Math.max(0.001, Math.min(1, f));
  bar.fill.scale.x = f; bar.fill.position.x = (-(1 - f) * bar.w) / 2;
  bar.fill.material.color.setHex(color || (f > 0.5 ? 0x7ee05b : f > 0.25 ? 0xf2c232 : 0xff5a4f));
}
function makeSquadObj(s) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const offs = s.def.n > 1 ? formation(s.def.n) : [[0, 0]];
  const members = offs.map(([ox, oz], i) => {
    const m = makeChar(s.f, s.slot, i) || makeMember(s.f, s.slot); const y = s.def.flies ? 3.8 : 0;
    ox += (Math.random() - 0.5) * 0.35; oz += (Math.random() - 0.5) * 0.35; // nobody stands on an exact grid
    casts(m); m.position.set(ox, y, oz); m.rotation.y += (Math.random() - 0.5) * 0.25; m.userData.by = y; m.userData.bz = oz; m.userData.hp = s.members[i]; if (s.members[i] <= 0) m.userData.deadT = 0; body.add(m); return m;
  });
  const real = !!members[0].userData.anim;
  // Cast but not loaded yet: syncRender rebuilds this squad once the real characters arrive.
  const wait = !real && !!(CAST[s.f] && CAST[s.f][s.slot]);
  const team = new THREE.Mesh(new THREE.CircleGeometry(s.r + 0.25, 28), basic(s.owner === 0 ? 0x7fd1ff : 0xff5a4f, 0.25));
  team.rotation.x = -Math.PI / 2; team.position.y = 0.08; root.add(team);
  const sel = ringMesh(s.r + 0.45, s.r + 0.72, selCol(), 0.95); sel.visible = false; root.add(sel);
  const shield = ringMesh(s.r + 0.15, s.r + 0.4, 0x6fc3ff, 0.85); shield.visible = false; root.add(shield);
  const h = real ? 1.85 : new THREE.Box3().setFromObject(body).max.y;
  const bar = makeBar(Math.max(1.4, s.r * 1.5)); bar.g.position.y = h + 0.7; root.add(bar.g);
  const stun = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 6, 14), mat(0xffe14d)); stun.rotation.x = Math.PI / 2; stun.position.y = h + 0.25; stun.visible = false; root.add(stun);
  const pie = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat(0xfff8ec)); pie.scale.y = 0.6; pie.position.y = h + 0.05; pie.visible = false; root.add(pie);
  const carry = box(0.5, 0.4, 0.5, 0xf5b83a, 0, h + 0.1, 0); carry.visible = false; root.add(carry);
  const rank = new THREE.Group(); rank.position.y = h + 1.05;
  const nPip = s.slot === 'hero' ? 5 : 2;
  for (let i = 0; i < nPip; i++) { const d = box(0.2, 0.2, 0.2, 0xf5b83a, (i - (nPip - 1) / 2) * 0.32, 0, 0); d.rotation.z = Math.PI / 4; d.visible = false; rank.add(d); }
  root.add(rank);
  // Veterans wear a second ring under the team disc: silver at rank 1, gold at 2; heroes' glows brighter per level.
  const vet = ringMesh(s.r + 0.28, s.r + 0.42, 0xd8dde3, 0.9); vet.visible = false; root.add(vet);
  scene.add(root);
  return { root, body, members, team, sel, shield, bar, stun, pie, carry, rank, vet, yaw: s.heading, lunge: 0, atk: false, real, wait, lastAlive: s.def.n, confT: 0 };
}
function makeBldObj(b) {
  const root = new THREE.Group(), mesh = casts(mergeStatic(bldMesh(b.kind, b.f))); root.add(mesh);
  const pips = new THREE.Group(); pips.position.set(0, b.kind === 'barracks' ? 3 : 0, 0);
  if (b.kind === 'barracks') for (let i = 0; i < 3; i++) pips.add(box(0.4, 0.4, 0.4, 0xf5b83a, (i - 1) * 0.6, 0, 0));
  root.add(pips);
  // Scaffolding: four yellow poles and plank rings, built as a unit-tall frame that sync.js stretches up with progress.
  const scaff = new THREE.Group(), sw = b.r * 1.9, half = sw / 2;
  for (const x of [-half, half]) for (const z of [-half, half]) scaff.add(box(0.12, 1, 0.12, 0xf2c232, x, 0.5, z));
  for (const y of [0.33, 0.66, 1]) { scaff.add(box(sw, 0.06, 0.25, 0xc9a24a, 0, y, half), box(sw, 0.06, 0.25, 0xc9a24a, 0, y, -half), box(0.25, 0.06, sw, 0xc9a24a, half, y, 0), box(0.25, 0.06, sw, 0xc9a24a, -half, y, 0)); }
  root.add(scaff);
  const sel = ringMesh(b.r + 0.3, b.r + 0.6, selCol(), 0.95); sel.visible = false; root.add(sel);
  const team = new THREE.Mesh(new THREE.CircleGeometry(b.r + 0.2, 32), basic(b.owner === 0 ? 0x7fd1ff : 0xff5a4f, 0.2));
  team.rotation.x = -Math.PI / 2; team.position.y = 0.07; root.add(team);
  const h = new THREE.Box3().setFromObject(mesh).max.y;
  const bar = makeBar(b.r * 1.4); bar.g.position.y = h + 0.8; root.add(bar.g);
  root.position.set(b.x, walkH(b.x, b.z), b.z);
  if (b.owner === 0) mesh.rotation.y = Math.PI; // face the enemy
  scene.add(root);
  return { root, mesh, coin: mesh.userData.coin, speakers: mesh.userData.speakers, disc: mesh.userData.disc, leds: mesh.userData.leds, pips, scaff, sel, bar, h, r: b.r, smokeT: 0, buildFx: 0, wasBuilt: b.built >= 1, scaffDrop: b.built >= 1 ? 1 : 0 };
}
function makeNodeObj(n) {
  const g = nodeMesh();
  const ring = ringMesh(2.6, 2.9, 0xf5b83a, 0.5); g.add(ring);
  g.position.set(n.x, walkH(n.x, n.z), n.z);
  g.rotation.y = (n.x * 7 + n.z) % 6;
  ring.rotation.z = 0;
  scene.add(g);
  return { g, ring, coin: g.userData.coin, flag: g.userData.flag, awning: g.userData.awning, vendor: g.userData.vendor, awnRot: g.userData.awnRot, steamT: Math.random() };
}

export function bump(id) { const o = R.sq.get(id); if (o) { o.lunge = 0.15; o.atk = true; o.lastAtk = 0; } }
export function squadObj(id) { return R.sq.get(id); }
const ud0 = (m) => m.userData;
/** Idle fidgets for box people standing still: look around, stretch both arms up, or scratch the head. */
function fidget(m, dt, idle, hornArm) {
  const u = m.userData, [ra, la] = u.arms;
  if (u.fy0 === undefined) { u.fy0 = [ra.position.y, la.position.y]; u.ft = 1 + Math.random() * 5; u.fk = null; u.fp = 0; }
  if (!idle) { u.fk = null; u.ft = 1 + Math.random() * 4; }
  else if (u.fk) { u.fp += dt / 1.6; if (u.fp >= 1) { u.fk = null; u.ft = 2 + Math.random() * 6; } }
  else if ((u.ft -= dt) <= 0) { u.fk = ['look', 'stretch', 'scratch'][(Math.random() * 3) | 0]; u.fp = 0; }
  const e = u.fk ? Math.sin(u.fp * Math.PI) : 0; // ease in and back out
  u.head.rotation.y = u.fk === 'look' ? Math.sin(u.fp * Math.PI * 2) * 0.9 : 0;
  u.hat.rotation.y = u.head.rotation.y;
  const up = u.fk === 'stretch' ? e * 0.55 : 0;
  if (!hornArm || ra.parent === m) ra.position.y = u.fy0[0] + up + (u.fk === 'scratch' ? e * 0.6 : 0);
  la.position.y = u.fy0[1] + up;
  if (u.fk === 'stretch') m.scale.y *= 1 + e * 0.06;
}
/** Hit flash: a quick squash-and-stretch plus a red pop, readable without per-member materials. */
function squash(m, dt) {
  const f = m.userData.flashT;
  if (!(f > 0)) return;
  m.userData.flashT = f - dt;
  const k = Math.sin((f / 0.16) * Math.PI);
  m.scale.x *= 1 + 0.25 * k; m.scale.z *= 1 + 0.25 * k; m.scale.y *= 1 - 0.2 * k;
  if (f > 0.13) { m.getWorldPosition(_wp); emit({ x: _wp.x, y: _wp.y + 1, z: _wp.z, vx: (Math.random() - 0.5) * 3, vy: 2, vz: (Math.random() - 0.5) * 3, c: 0xff4a3c, s: 0.14, life: 0.3, g: 12 }); }
}
const _wp = new THREE.Vector3();
const BELL_ON = new THREE.MeshBasicMaterial({ color: 0xfff6b0 }), BELL_OFF = mat(0xf5b83a);
/** Ragdoll-lite death for box placeholders: knocked back and up, tumbling, then sinks out. Returns visibility. */
function fling(m, dt, heavy) {
  const u = m.userData;
  if (u.deadT === undefined) { u.deadT = 1.3; u.fv = new THREE.Vector3((Math.random() - 0.5) * 3, heavy ? 3 : 5 + Math.random() * 2, heavy ? -1 : -2 - Math.random() * 2); u.fs = new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8); u.fy = m.position.y; }
  if (u.deadT <= 0) return false;
  u.deadT -= dt;
  u.fv.y -= 18 * dt;
  m.position.addScaledVector(u.fv, dt);
  if (m.position.y < u.fy) { m.position.y = u.fy; u.fv.multiplyScalar(0.3); u.fv.y = Math.abs(u.fv.y); u.fs.multiplyScalar(0.5); }
  m.rotation.x += u.fs.x * dt; m.rotation.z += u.fs.z * dt; m.rotation.y += u.fs.y * dt;
  if (u.deadT < 0.4) m.position.y -= (0.4 - u.deadT) * 2 * dt * 3; // sink into the ground at the end
  return true;
}
// Activists' Rally: a pink link between every pair of rallied Activist squads standing within 8 m (the sim's radius).
// One LineSegments for everything, rebuilt each frame; opacity pulses so the bond reads as alive.
const RL_MAX = 120, rlPos = new Float32Array(RL_MAX * 6);
const rlGeo = new THREE.BufferGeometry(); rlGeo.setAttribute('position', new THREE.BufferAttribute(rlPos, 3).setUsage(THREE.DynamicDrawUsage));
const rallyLines = new THREE.LineSegments(rlGeo, new THREE.LineBasicMaterial({ color: 0xe85d9a, transparent: true, opacity: 0.7, depthWrite: false }));
rallyLines.frustumCulled = false; scene.add(rallyLines);
function updateRallyLines(S, time) {
  let n = 0;
  const a = S.squads.filter((q) => q.rally > 0 && !q.gar);
  for (let i = 0; i < a.length && n < RL_MAX; i++) for (let j = i + 1; j < a.length && n < RL_MAX; j++) {
    const p = a[i], q = a[j];
    if (p.owner !== q.owner || Math.hypot(p.x - q.x, p.z - q.z) >= 8) continue;
    const k = n * 6, lift = 0.35 + 0.15 * Math.sin(time * 4 + i);
    rlPos[k] = p.x; rlPos[k + 1] = walkH(p.x, p.z) + lift; rlPos[k + 2] = p.z;
    rlPos[k + 3] = q.x; rlPos[k + 4] = walkH(q.x, q.z) + lift; rlPos[k + 5] = q.z;
    n++;
  }
  rlGeo.setDrawRange(0, n * 2); rlGeo.attributes.position.needsUpdate = true;
  rallyLines.material.opacity = 0.45 + 0.35 * Math.abs(Math.sin(time * 3));
}
/** Squads answer an order with a little hop, so a command visibly lands. */
// Perf: a placeholder building is 10-40 separate boxes. Merge its plain static ones into one mesh per material, so a
// base costs a handful of draws. Anything sync.js animates (named in userData: coin, disc, speakers, leds, jib...),
// anything with children, and anything transparent stays a separate object.
function mergeStatic(g) {
  const keep = new Set(), mark = (v) => { if (v && v.isObject3D) keep.add(v); else if (Array.isArray(v)) v.forEach(mark); };
  Object.values(g.userData).forEach(mark);
  const groups = new Map();
  g.updateMatrix(); g.updateMatrixWorld(true);
  for (const c of g.children) {
    if (!c.isMesh || keep.has(c) || c.children.length || c.material.transparent || Array.isArray(c.material)) continue;
    if (!groups.has(c.material)) groups.set(c.material, []);
    groups.get(c.material).push(c);
  }
  for (const [m, list] of groups) {
    if (list.length < 2) continue;
    const geos = list.map((c) => { c.updateMatrix(); const ge = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); ge.applyMatrix4(c.matrix); for (const k of Object.keys(ge.attributes)) if (!['position', 'normal', 'uv'].includes(k)) ge.deleteAttribute(k); return ge; });
    const merged = mergeGeometries(geos, false);
    geos.forEach((ge) => ge.dispose());
    if (!merged) continue;
    list.forEach((c) => g.remove(c));
    g.add(new THREE.Mesh(merged, m));
  }
  return g;
}
export function ack(ids, attack) {
  for (const id of ids) { const o = R.sq.get(id); if (o) o.ack = 0.45; }
  const s = getSim() && getSim().squads.find((q) => q.id === ids[0]); // one voice answers for the whole selection
  if (s) bark(s.f, s.slot, attack);
}
const hop = (o, i) => { if (!(o.ack > 0)) return 0; const k = 1 - o.ack / 0.45 - i * 0.04; return k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.4 : 0; };

export function syncRender(S, alpha, dt, time) {
  const selIds = new Set(UI.sel && UI.sel.type === 'sq' ? UI.sel.ids : []);
  hillRender(S, time);
  driftRender(S, time);
  capRender(S, time);
  aimRender(S, time);
  const seen = new Set();
  for (const s of S.squads) {
    seen.add(s.id);
    let o = R.sq.get(s.id);
    if (o && o.wait && charsReady()) { const keep = o.lastAlive; disposeObj(o.root); o = null; R.sq.delete(s.id); o = makeSquadObj(s); o.lastAlive = keep; R.sq.set(s.id, o); }
    if (!o) { o = makeSquadObj(s); R.sq.set(s.id, o); }
    const x = s.px + (s.x - s.px) * alpha, z = s.pz + (s.z - s.pz) * alpha;
    o.root.position.set(x, walkH(x, z), z);
    o.root.visible = !s.gar;
    o.yaw = lerpAngle(o.yaw, s.heading, Math.min(1, dt * 10)); o.body.rotation.y = o.yaw;
    const moving = Math.abs(s.x - s.px) + Math.abs(s.z - s.pz) > 0.0005;
    const par = pl(s.owner).parade > 0, bs = par ? 18 : s.bull > 0 ? 14 : 10;
    let alive = 0;
    // Footstep dust under running infantry, and a skid puff round the squad's feet when it pulls up from a run.
    if (!s.def.vehicle && !s.def.flies) {
      const sp = Math.hypot(s.x - s.px, s.z - s.pz) / TICK;
      if (sp > 2 && Math.random() < dt * 4 * s.def.n) {
        const m = o.members[(Math.random() * o.members.length) | 0];
        if (m.visible) { m.getWorldPosition(_wp); emit({ x: _wp.x, y: walkH(_wp.x, _wp.z) + 0.1, z: _wp.z, vx: (Math.random() - 0.5) * 0.8 - Math.sin(o.yaw) * 0.8, vy: 0.4 + Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.8 - Math.cos(o.yaw) * 0.8, c: 0xc2b28e, s: 0.22, life: 0.55, g: -0.2, drag: 2.5, grow: 2.2 }); }
      }
      if (o.lastSp > 2 && sp < 0.15) for (const m of o.members) if (m.visible) {
        m.getWorldPosition(_wp);
        for (let k = 0; k < 2; k++) emit({ x: _wp.x, y: walkH(_wp.x, _wp.z) + 0.1, z: _wp.z, vx: Math.sin(o.yaw) * 1.5 + (Math.random() - 0.5), vy: 0.5, vz: Math.cos(o.yaw) * 1.5 + (Math.random() - 0.5), c: 0xc2b28e, s: 0.28, life: 0.5, g: 0, drag: 3, grow: 2 });
      }
      o.lastSp = sp;
    }
    if (o.real) {
      const v = Math.hypot(s.x - s.px, s.z - s.pz) / TICK;
      const gather = s.slot === 'worker' && ((s.gatherT > 0 && s.task && s.task.state === 'gather') || s.order.type === 'repair' && Math.hypot(s.x - s.px, s.z - s.pz) < 0.01);
      for (let i = 0; i < o.members.length; i++) {
        const m = o.members[i], A = m.userData.anim, live = s.members[i] > 0;
        A.lock -= dt;
        if (!live) {
          if (m.userData.deadT === undefined) { m.userData.deadT = 1.8; play(m, 'die', true); }
          m.userData.deadT -= dt;
          m.visible = m.userData.deadT > 0;
          if (m.visible) A.mixer.update(dt);
          continue;
        }
        alive++;
        if (S.over) { // the match is decided: the winners dance (moussa's clips, on loop), the losers slump to the ground
          if (s.owner === S.over.winner) { if (A.lock <= 0 || !String(A.cur).startsWith('dance')) play(m, 'dance' + ((i + s.id) % 3 + 1), true); }
          else if (!m.userData.slump) { m.userData.slump = true; play(m, 'die', true); }
          A.mixer.update(dt); continue;
        }
        if (s.members[i] < m.userData.hp - 0.5) { m.userData.flashT = 0.16; if (!o.atk) play(m, 'hit'); }
        m.scale.set(1, 1, 1); squash(m, dt);
        m.userData.hp = s.members[i];
        if (o.atk && m.userData.atkIn === undefined) m.userData.atkIn = Math.random() * 0.3; // members swing a beat apart, not as one
        if (m.userData.atkIn !== undefined) { m.userData.atkIn -= dt; if (m.userData.atkIn <= 0) { m.userData.atkIn = undefined; play(m, A.atk, true); } }
        else if (gather && A.lock <= 0) play(m, A.atk);
        else if (A.lock <= 0) {
          const st = v < 0.15 ? 'idle' : v < 1.8 ? 'walk' : 'run';
          play(m, st);
          // Clip speed follows ground speed so feet roughly match (refs are guesses: walk 1.2, run 3.0 m/s).
          if (st !== 'idle') A.actions[st].setEffectiveTimeScale(Math.min(1.8, Math.max(0.6, v / (st === 'walk' ? 1.2 : 3.0))) * (A.jit || 1)); // each member's own stride rate
        }
        A.mixer.update(dt * (s.stun > 0 ? 0.25 : 1));
        m.position.z = m.userData.bz + o.lunge * 2.5;
        m.position.y = m.userData.by + hop(o, i);
      }
      o.atk = false;
    } else for (let i = 0; i < o.members.length; i++) {
      const m = o.members[i], live = s.members[i] > 0;
      if (!live) { m.visible = fling(m, dt, s.def.vehicle); continue; }
      m.visible = true;
      alive++;
      if (s.members[i] < (m.userData.hp ?? s.members[i]) - 0.5) m.userData.flashT = 0.16;
      m.userData.hp = s.members[i];
      let y = m.userData.by;
      if (s.def.flies) y += Math.sin(time * 3 + i) * 0.3;
      else if (moving && s.def.vehicle) y += Math.abs(Math.sin(time * 16)) * 0.1;
      else if (moving) y += Math.abs(Math.sin(time * bs + i * 1.3)) * 0.08;
      m.position.y = y + hop(o, i); m.scale.set(1, s.sit ? 0.55 : 1, 1); squash(m, dt); m.position.z = m.userData.bz + o.lunge * 2.5;
      const legs = m.userData.legs;
      if (legs) { const sw = moving ? Math.sin(time * bs + i * 1.3) * 0.7 : 0; legs[0].rotation.x = sw; legs[1].rotation.x = -sw; }
      if (ud0(m).head) fidget(m, dt, !moving && !(o.lunge > 0), m.userData.horn);
      const dg = m.userData.dig;
      if (dg) { // excavator: idle sway of the cab, slam the bucket down on a hit
        const hit = o.lunge > 0 ? Math.sin((o.lunge / 0.15) * Math.PI) : 0;
        dg.cab.rotation.y = Math.sin(time * 0.7 + i) * 0.25;
        dg.boom.rotation.x = -0.5 - Math.sin(time * 1.3) * 0.08 + hit * 0.55; dg.stick.rotation.x = 1.4 - hit * 0.5; dg.bucket.rotation.x = 0.4 + hit * 0.8;
        if (hit > 0.9) { m.getWorldPosition(_wp); emit({ x: _wp.x, y: _wp.y + 0.3, z: _wp.z, vx: (Math.random() - 0.5) * 3, vy: 3, vz: (Math.random() - 0.5) * 3, c: 0x7a5a3a, s: 0.3, life: 0.6, g: 12 }); }
      }
      const pp = m.userData.puppet;
      if (pp) { // floppy parade sway: arms swing out of phase, head bobs and tilts; bigger while walking
        const k = moving ? 1 : 0.35;
        pp.arms[0].rotation.z = -0.25 - Math.sin(time * 3) * 0.5 * k; pp.arms[1].rotation.z = 0.25 - Math.sin(time * 3 + 1.4) * 0.5 * k;
        pp.arms[0].rotation.x = Math.sin(time * 2.2) * 0.3 * k; pp.arms[1].rotation.x = -Math.sin(time * 2.2) * 0.3 * k;
        pp.head.position.y = 3.2 + Math.abs(Math.sin(time * 3)) * 0.15 * k; pp.head.rotation.z = Math.sin(time * 1.5) * 0.18; pp.head.rotation.y = Math.sin(time * 0.9) * 0.3;
        if (o.lunge > 0) { pp.arms[0].rotation.x = pp.arms[1].rotation.x = -1.6; } // both arms come down on the target
      }
      const eg = m.userData.eagle;
      if (eg) {
        // Flap: fast beats while climbing out of a dive, a lazy glide otherwise. Dive: swoop down onto the target on a hit.
        const dive = o.lunge > 0 ? Math.sin((o.lunge / 0.15) * Math.PI) : 0;
        const beat = Math.sin(time * (moving || dive ? 14 : 5) + i);
        eg.wings[0].rotation.z = -beat * 0.6 - dive * 0.9; eg.wings[1].rotation.z = beat * 0.6 + dive * 0.9;
        eg.bird.rotation.z = Math.sin(time * 1.3) * 0.15; eg.bird.rotation.x = dive * 0.7;
        eg.talons.rotation.x = -dive * 1.2;
        m.position.y = y + hop(o, i) - dive * 3.2;
      } else if (s.def.flies) m.children[0].rotation.z = Math.sin(time * 6) * 0.15;
      if (m.userData.horn) { const sh = o.lunge > 0 || s.abil > 23 ? 1 : 0; m.userData.horn.rotation.x = -sh * 1.9 + (moving ? Math.sin(time * bs) * 0.3 : 0); }
      // Vehicles: wheels roll with ground speed, the chassis rides its springs, dust kicks out behind.
      const ud = m.userData;
      if (ud.wheels) {
        const v = Math.hypot(s.x - s.px, s.z - s.pz) / TICK;
        for (const w of ud.wheels) w.rotation.x += (v * dt) / (w.geometry.parameters.radiusTop || 0.5);
        if (ud.chassis) {
          const ch = ud.chassis, k = Math.min(1, v / 5);
          ch.position.y = (Math.sin(time * 11 + i) * 0.12 + Math.sin(time * 17.3) * 0.06) * k + (o.lunge > 0 ? 0.25 : 0);
          ch.rotation.x = Math.sin(time * 7.1) * 0.06 * k - (o.lunge > 0 ? 0.15 : 0);
          ch.rotation.z = Math.sin(time * 5.3 + 1) * 0.05 * k;
          if (ud.hydro) { // lowrider hydraulics: parked it hops front/back to the beat, on a hit it bounces high
            const bt = time * 4.2 + i, up = Math.max(0, Math.sin(bt)) * (1 - k);
            ch.position.y += up * 0.45 + (o.lunge > 0 ? 0.55 : 0);
            ch.rotation.x += Math.sin(bt * 0.5) * up * 0.22;
          }
        }
        if (ud.forks) ud.forks.position.z = 1.0 + (o.lunge > 0 ? Math.sin((o.lunge / 0.15) * Math.PI) * 0.6 : 0);
        if (ud.pedal) { // lean into turns like a cyclist; ring the bell (flash) on each hit
          const dy = Math.atan2(Math.sin(s.heading - o.yaw), Math.cos(s.heading - o.yaw));
          m.rotation.z += (Math.max(-0.35, Math.min(0.35, -dy * 1.2)) - m.rotation.z) * Math.min(1, dt * 6);
          if (ud.bell) { ud.bell.material = o.lunge > 0 && Math.sin(time * 60) > 0 ? BELL_ON : BELL_OFF; ud.bell.scale.setScalar(o.lunge > 0 ? 1.6 : 1); }
        }
        if (ud.pedal && legs) { const c = time * (4 + v * 2); legs[0].rotation.x = Math.sin(c) * 0.9; legs[1].rotation.x = -Math.sin(c) * 0.9; }
        if (ud.dust && v > 0.8 && Math.random() < dt * 14 * ud.dust) {
          const bx = x - Math.sin(o.yaw) * 1.6 * ud.dust + (Math.random() - 0.5), bz = z - Math.cos(o.yaw) * 1.6 * ud.dust + (Math.random() - 0.5), g0 = walkH(bx, bz);
          emit({ x: bx, y: g0 + 0.3, z: bz, vx: (Math.random() - 0.5) * 1.5, vy: 0.6 + Math.random(), vz: (Math.random() - 0.5) * 1.5, c: 0xb9a57e, s: 0.45 * ud.dust, life: 0.9, g: -0.3, drag: 2, grow: 2.6 });
        }
      }
      m.rotation.x = s.slot === 'worker' && s.gatherT > 0 && s.task && s.task.state === 'gather' ? Math.sin(time * 10) * 0.25 : 0;
    }
    if (o.lunge > 0) o.lunge = Math.max(0, o.lunge - dt);
    if (o.ack > 0) o.ack -= dt;
    // On shift: every second a worker at a truck flips a coin up ("ka-ching") with a little white glint.
    if (s.slot === 'worker' && s.gatherT > 0 && s.task && s.task.state === 'gather') {
      o.kaching = (o.kaching || 0) - dt;
      if (o.kaching <= 0) {
        o.kaching = 0.9 + Math.random() * 0.3;
        const g0 = walkH(x, z);
        emit({ x, y: g0 + 2, z, vx: (Math.random() - 0.5) * 0.8, vy: 4.5, vz: (Math.random() - 0.5) * 0.8, c: 0xf5b83a, s: 0.32, life: 0.8, g: 9 });
        emit({ x, y: g0 + 2.3, z, vy: 1, c: 0xffffff, s: 0.18, life: 0.25, g: 0, grow: 2 });
      }
    }
    // Victory: a squad that was just fighting and has no enemy left within 12 m celebrates - three hops, then
    // Activists throw confetti and Backwoods toss their hats in the air.
    if (o.lastAtk !== undefined) {
      o.lastAtk += dt;
      if (o.lastAtk > 1.6 && s.slot !== 'worker' && !s.def.vehicle) {
        o.lastAtk = undefined;
        if (!S.squads.some((e) => e.owner !== s.owner && !e.gar && Math.hypot(e.x - s.x, e.z - s.z) < 12)) o.cheer = 1.4;
      }
    }
    if (s.beatAt !== undefined && s.beatAt !== o.beatAt) { o.beatAt = s.beatAt; if (s.slot !== 'worker') o.cheer = 1.4; } // the DJ's beat: everyone hops
    if (o.cheer > 0) {
      const before = o.cheer; o.cheer -= dt;
      for (const t of [1.4, 0.95, 0.5]) if (before > t - 0.0001 && o.cheer <= t) o.ack = 0.45; // a hop on each beat
      if (before >= 1.4 - 1e-4) for (const m of o.members) if (m.visible) {
        m.getWorldPosition(_wp);
        if (s.f === 'sc') for (let k = 0; k < 3; k++) emit({ x: _wp.x, y: _wp.y + 1.9, z: _wp.z, vx: (Math.random() - 0.5) * 2, vy: 2.5 + Math.random(), vz: (Math.random() - 0.5) * 2, c: [0x7a3fd1, 0x7ee05b, 0xff5ad1][k], s: 0.2, life: 1.3, g: -0.6, drag: 1 });
        else if (s.f === 'ac') for (let k = 0; k < 6; k++) emit({ x: _wp.x, y: _wp.y + 1.8, z: _wp.z, vx: (Math.random() - 0.5) * 3, vy: 4 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, c: [0xff5a4f, 0xf5b83a, 0x7ee05b, 0x6fc3ff, 0xe85d9a][k % 5], s: 0.16, life: 1.8, g: 5, drag: 1.5 });
        else emit({ x: _wp.x, y: _wp.y + 1.8, z: _wp.z, vx: (Math.random() - 0.5) * 1.5, vy: 7 + Math.random() * 2, vz: (Math.random() - 0.5) * 1.5, c: Math.random() < 0.5 ? 0xc62f2f : 0x6b4a2a, s: 0.32, life: 1.4, g: 12, floor: walkH(_wp.x, _wp.z) + 0.1 });
      }
    }
    if (alive < o.lastAlive) for (let k = 0; k < o.lastAlive - alive; k++) fxDeath(x, z, s.f);
    o.lastAlive = alive;
    o.sel.visible = selIds.has(s.id);
    o.team.material.opacity = 0.25 + s.rally * 2 + (s.bull > 0 || s.ot > 0 ? 0.25 : 0);
    o.team.material.color.setHex(s.bull > 0 ? 0xe85d9a : s.ot > 0 ? 0xf2c232 : s.owner === 0 ? 0x7fd1ff : 0xff5a4f);
    let tot = 0; for (const h of s.members) tot += h;
    setBar(o.bar, tot / (s.members.length * s.mhp));
    o.bar.g.visible = tot < s.members.length * s.mhp || o.sel.visible;
    o.bar.g.quaternion.copy(camera.quaternion);
    o.stun.visible = s.stun > 0 && s.stun <= 2.5; o.stun.rotation.z = time * 6;
    // Dazed: a stunned squad wobbles drunkenly on the spot until it shakes it off.
    o.body.rotation.z = o.stun.visible ? Math.sin(time * 9) * 0.12 : 0; o.body.rotation.x = o.stun.visible ? Math.cos(time * 7) * 0.08 : 0;
    o.pie.visible = s.stun > 2.5; o.shield.visible = s.sit; const kit = o.members[0].userData.cash;
    o.carry.visible = s.carry > 0 && !kit;
    if (kit) {
      const u = o.members[0].userData, full = s.carry > 0;
      kit.visible = full;
      if (u.bag) { const k = full ? 1.3 + Math.sin(time * 8) * 0.03 : 1; u.bag.scale.set(k, k, k); }
      if (u.wheel) u.wheel.rotation.x += (Math.hypot(s.x - s.px, s.z - s.pz) / TICK) * dt / 0.18;
    }
    o.rank.children.forEach((c, i) => (c.visible = i < s.rank)); o.rank.quaternion.copy(camera.quaternion);
    o.vet.visible = s.rank > 0;
    // Hold-ground squads show a small planted flag beside their bar.
    if (s.hold && !o.holdFlag) { const f = new THREE.Group(); f.add(box(0.06, 0.9, 0.06, 0xdddddd, 0, 0.45, 0), box(0.45, 0.28, 0.04, 0x7fd1ff, 0.24, 0.75, 0)); f.position.set(s.r + 0.6, 0, 0); o.root.add(f); o.holdFlag = f; }
    if (o.holdFlag) o.holdFlag.visible = !!s.hold;
    if (s.rank > 0) {
      const hero = s.slot === 'hero', top = hero ? s.rank >= 3 : s.rank >= 2;
      o.vet.material.color.setHex(top ? 0xf5b83a : 0xd8dde3);
      o.vet.material.opacity = hero ? 0.55 + 0.4 * Math.abs(Math.sin(time * (1 + s.rank * 0.6))) : 0.9;
      if (hero) { const k = 1 + 0.06 * s.rank; o.body.scale.setScalar(k); o.vet.scale.setScalar(1 + 0.05 * Math.sin(time * 3)); }
    }
    if (par) { o.confT -= dt; if (o.confT <= 0) { o.confT = 0.5; fxConfetti(x, z, 4); } }
  }
  updateRallyLines(S, time);
  for (const [id, o] of R.sq) if (!seen.has(id)) { R.sq.delete(id); o.bar.g.visible = o.sel.visible = o.team.visible = false; corpses.push({ o, t: 1.6 }); }
  for (let ci = corpses.length - 1; ci >= 0; ci--) {
    const c = corpses[ci]; c.t -= dt;
    for (const m of c.o.members) { if (m.userData.anim) { if (m.userData.deadT === undefined) { m.userData.deadT = 1.6; play(m, 'die', true); } m.userData.anim.mixer.update(dt); } else if (m.visible) m.visible = fling(m, dt, false); }
    if (c.t <= 0) { disposeObj(c.o.root); corpses.splice(ci, 1); }
  }

  const seenB = new Set();
  for (const b of S.blds) {
    seenB.add(b.id);
    let o = R.bl.get(b.id);
    if (!o) { o = makeBldObj(b); R.bl.set(b.id, o); }
    o.mesh.scale.y = 0.25 + 0.75 * b.built;
    if (b.kind === 'tower') {
      if (!o.crew) { o.crew = new THREE.Group(); for (let k = 0; k < 3; k++) { const f = new THREE.Group(); f.add(box(0.28, 0.45, 0.22, b.owner === 0 ? 0x7fd1ff : 0xff5a4f, 0, 0.23, 0), box(0.22, 0.22, 0.22, 0xf2c9a0, 0, 0.58, 0)); f.position.set((k - 1) * 0.7, 4.6, k === 1 ? 0.6 : -0.4); o.crew.add(f); } casts(o.crew); o.root.add(o.crew); }
      o.crew.visible = !!b.garrison;
      if (b.garrison) o.crew.children.forEach((f, k) => { f.position.y = 4.6 + Math.abs(Math.sin(time * 4 + k * 2)) * 0.12; f.rotation.y = Math.sin(time * 1.3 + k) * 0.8; });
    }
    // Construction: scaffold climbs ahead of the walls, crates lob in from the ground, hammer sparks flash on top.
    if (b.built < 1) {
      o.scaff.visible = true; o.scaff.scale.y = Math.max(0.5, o.h * (0.35 + 0.75 * b.built)); o.scaff.position.y = 0;
      o.buildFx -= dt;
      if (o.buildFx <= 0) {
        o.buildFx = 0.18 + Math.random() * 0.2;
        const top = o.root.position.y + o.h * (0.25 + 0.75 * b.built);
        const a = Math.random() * 6.28, sx = b.x + Math.cos(a) * b.r, sz = b.z + Math.sin(a) * b.r;
        for (let k = 0; k < 3; k++) emit({ x: sx, y: top, z: sz, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, c: k ? 0xffe14d : 0xffffff, s: 0.12, life: 0.35, g: 14 });
        if (Math.random() < 0.35) { const ca = Math.random() * 6.28, cx = b.x + Math.cos(ca) * (b.r + 4), cz = b.z + Math.sin(ca) * (b.r + 4), T = 0.7;
          emit({ x: cx, y: walkH(cx, cz) + 0.3, z: cz, vx: (b.x - cx) / T, vy: (top - walkH(cx, cz)) / T + 7 * T, vz: (b.z - cz) / T, c: 0x9a6a3a, s: 0.55, life: T, g: 14 }); }
      }
    } else if (!o.wasBuilt) { o.wasBuilt = true; o.scaffDrop = 0.0001; }
    // Finished: the scaffold drops through the ground in a puff of dust and is gone.
    if (o.scaffDrop > 0 && o.scaffDrop < 1) {
      o.scaffDrop = Math.min(1, o.scaffDrop + dt / 0.7);
      o.scaff.position.y = -o.scaff.scale.y * o.scaffDrop * o.scaffDrop;
      if (Math.random() < dt * 25) { const a = Math.random() * 6.28; emit({ x: b.x + Math.cos(a) * b.r, y: o.root.position.y + 0.3, z: b.z + Math.sin(a) * b.r, vx: Math.cos(a) * 2, vy: 1, vz: Math.sin(a) * 2, c: 0xc2b28e, s: 0.5, life: 0.8, g: -0.2, drag: 2, grow: 2.4 }); }
    }
    if (b.built >= 1 && o.scaffDrop >= 1) o.scaff.visible = false;
    if (o.coin) o.coin.rotation.z += dt * 2.5;
    if (o.leds) o.leds.forEach((m, k) => (m.visible = Math.sin(time * (3 + (k % 5)) + k * 1.7) > -0.3)); // server LEDs blink
    if (o.disc) o.disc.rotation.y += dt * 3; // the record on the shop roof spins
    if (o.speakers && o.speakers.length) { const th = 1 + Math.max(0, Math.sin(time * 9.4)) ** 4 * 0.35; for (const c of o.speakers) c.scale.set(th, 1, th); } // cones thump
    if (o.mesh.userData.jib) o.mesh.userData.jib.rotation.y = Math.sin(time * 0.15 + b.id) * 2.2; // crane slowly slews back and forth
    o.pips.children.forEach((p, i) => { p.visible = i < b.level || (b.up > 0 && i === b.level && Math.sin(time * 10) > 0); });
    o.sel.visible = !!(UI.sel && UI.sel.type === 'bld' && UI.sel.id === b.id);
    setBar(o.bar, b.built < 1 ? b.built : b.hp / b.maxHp, b.built < 1 ? 0xf2c232 : 0);
    o.bar.g.visible = b.built < 1 || b.hp < b.maxHp || o.sel.visible;
    o.bar.g.quaternion.copy(camera.quaternion);
    // Rally flag: shown while the building is selected, with a dotted trail from the door to the pole.
    if (b.rally && o.sel.visible) {
      if (!o.flag) {
        const fl = new THREE.Group();
        fl.add(box(0.1, 3, 0.1, 0xdddddd, 0, 1.5, 0));
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8, 6, 1), new THREE.MeshLambertMaterial({ color: 0x7fd1ff, side: THREE.DoubleSide }));
        cloth.position.set(0.7, 2.55, 0); fl.add(cloth); fl.userData.cloth = cloth;
        const dots = new THREE.Group(); for (let k = 0; k < 12; k++) dots.add(box(0.25, 0.06, 0.25, 0x7fd1ff)); 
        scene.add(fl, dots); o.flag = fl; o.dots = dots;
      }
      const gy = walkH(b.rally.x, b.rally.z);
      o.flag.visible = o.dots.visible = true;
      o.flag.position.set(b.rally.x, gy, b.rally.z);
      const pos = o.flag.userData.cloth.geometry.attributes.position; // ripple the cloth
      for (let k = 0; k < pos.count; k++) { const px = pos.getX(k); pos.setZ(k, Math.sin(time * 6 - px * 4) * 0.15 * (px + 0.65)); }
      pos.needsUpdate = true;
      o.dots.children.forEach((d, k) => { const t = ((k + (time * 1.5) % 1) / 12); const dx = b.x + (b.rally.x - b.x) * t, dz = b.z + (b.rally.z - b.z) * t; d.position.set(dx, walkH(dx, dz) + 0.2, dz); });
    } else if (o.flag) { o.flag.visible = o.dots.visible = false; }
    // Damage states: dark smoke below half health, flames on top of it below a quarter. More damage = more of both.
    const hpK = b.built < 1 ? 1 : b.hp / b.maxHp;
    if (hpK < 0.5) {
      o.smokeT -= dt;
      if (o.smokeT <= 0) {
        o.smokeT = 0.08 + hpK * 0.4;
        const gx = b.x + (Math.random() - 0.5) * b.r, gz = b.z + (Math.random() - 0.5) * b.r, top = o.root.position.y + o.h * 0.8;
        emit({ x: gx, y: top, z: gz, vx: (Math.random() - 0.5) * 0.6 + 0.5, vy: 1.6 + Math.random(), vz: (Math.random() - 0.5) * 0.6, c: Math.random() < 0.5 ? 0x3b3b3b : 0x5a5a5a, s: 0.6, life: 2.2, g: -0.4, drag: 0.8, grow: 3.2 });
        if (hpK < 0.25) for (let k = 0; k < 2; k++) emit({ x: gx + (Math.random() - 0.5) * 0.6, y: top - 0.3, z: gz + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 0.8, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 0.8, c: [0xff4a1c, 0xff8a1c, 0xffd23a][k + (Math.random() < 0.5 ? 1 : 0)], s: 0.45, life: 0.55, g: -1, drag: 1.5 });
      }
    }
    o.mesh.position.x = hpK < 0.25 ? Math.sin(time * 40) * 0.03 : 0; // a burning building trembles
  }
  // Destroyed: the shell sinks and keels over into a dust cloud instead of vanishing (rubble pile is fx 'boom').
  for (const [id, o] of R.bl) if (!seenB.has(id)) { if (o.flag) { disposeObj(o.flag); disposeObj(o.dots); } R.bl.delete(id); o.bar.g.visible = false; o.sel.visible = false; dying.push({ root: o.root, mesh: o.mesh, h: o.h, t: 0, tilt: (Math.random() - 0.5) * 0.8 }); }
  for (let i = dying.length - 1; i >= 0; i--) {
    const d = dying[i]; d.t += dt;
    const k = Math.min(1, d.t / 1.4);
    d.mesh.position.y = -d.h * k * k * 0.9; d.mesh.rotation.z = d.tilt * k; d.mesh.rotation.x = d.tilt * 0.5 * k;
    d.mesh.position.x = Math.sin(d.t * 50) * 0.08 * (1 - k);
    if (Math.random() < dt * 30 * (1 - k)) { const p = d.root.position; emit({ x: p.x + (Math.random() - 0.5) * 5, y: p.y + 0.4, z: p.z + (Math.random() - 0.5) * 5, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, c: 0xb3a58a, s: 0.8, life: 1.4, g: -0.2, drag: 1.5, grow: 2.5 }); }
    if (k >= 1) { disposeObj(d.root); dying.splice(i, 1); }
  }

  for (const n of S.nodes) {
    let o = R.nodes.get(n.id);
    if (!o) { o = makeNodeObj(n); R.nodes.set(n.id, o); }
    const k = n.amount / NODE_AMOUNT;
    o.g.visible = k > 0;
    o.coin.rotation.z += dt * 2;
    o.coin.scale.setScalar(0.4 + 0.6 * k);
    // Who works this truck right now? Workers of each side on it (heading there, working, or leaving with cash).
    let mine = 0, theirs = 0;
    for (const w of S.squads) if (w.slot === 'worker' && w.task && w.task.node === n && Math.hypot(w.x - n.x, w.z - n.z) < 9) { if (w.owner === 0) mine++; else theirs++; }
    const own = mine && theirs ? 'both' : mine ? 0 : theirs ? 1 : null;
    const col = own === 0 ? 0x7fd1ff : own === 1 ? 0xff5a4f : own === 'both' ? (Math.sin(time * 8) > 0 ? 0x7fd1ff : 0xff5a4f) : 0xf5b83a;
    o.ring.material.color.setHex(col);
    o.ring.material.opacity = own === 'both' ? 0.75 : own === null ? 0.3 + 0.2 * Math.sin(time * 2) : 0.6;
    o.flag.material.color.setHex(own === null ? 0xf2b632 : col);
    o.awning.material.color.setHex(own === 0 ? 0x4aa8d8 : own === 1 ? 0xd8483f : own === 'both' ? col : 0xf2b632);
    // Open for business: the vendor bobs and turns, the awning flaps, the grill steams. A sold-out truck goes still.
    if (k > 0) {
      o.vendor.position.y = 1.25 + Math.abs(Math.sin(time * 3 + n.id)) * 0.06; o.vendor.rotation.y = Math.PI / 2 + Math.sin(time * 0.8 + n.id) * 0.7;
      o.awning.rotation.z = o.awnRot + Math.sin(time * 2.4 + n.id) * 0.06;
      if ((o.steamT -= dt) <= 0) {
        o.steamT = 0.35 + Math.random() * 0.4;
        o.g.updateMatrixWorld(); _wp.set(0.2, 2.5, 0.6).applyMatrix4(o.g.matrixWorld);
        emit({ x: _wp.x, y: _wp.y, z: _wp.z, vx: (Math.random() - 0.5) * 0.4, vy: 0.9 + Math.random() * 0.5, vz: (Math.random() - 0.5) * 0.4, c: 0xf2f2f2, s: 0.35, life: 1.6, g: -0.2, drag: 0.8, grow: 2.8 });
      }
    }
    const fp = o.flag.geometry.attributes.position; // flag ripples
    for (let k = 0; k < fp.count; k++) { const fx = fp.getX(k); fp.setZ(k, Math.sin(time * 7 - fx * 5 + n.id) * 0.1 * (fx + 0.45)); }
    fp.needsUpdate = true;
  }

  const seenZ = new Set();
  for (const zn of S.zones) {
    seenZ.add(zn.id);
    let m = R.zones.get(zn.id);
    if (!m) {
      m = new THREE.Group();
      const cones = zn.kind === 'cones';
      const d = new THREE.Mesh(new THREE.CircleGeometry(zn.r, 40), basic(cones ? 0xf28c28 : 0x5b4026, cones ? 0.18 : 0.85)); d.rotation.x = -Math.PI / 2; d.position.y = 0.11; m.add(d);
      if (cones) for (let i = 0; i < 22; i++) {
        // Road Closed: cones round the rim with striped barriers between every other pair; they drop in from the sky
        const a = (i / 22) * Math.PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 8), mat(i % 3 ? 0xf28c28 : 0xffffff)); c.position.set(Math.cos(a) * zn.r, 0.38, Math.sin(a) * zn.r); c.userData.drop = 0.3 + i * 0.03; m.add(c);
        if (i % 2 === 0) { const a2 = a + Math.PI / 22, bar = new THREE.Group(); bar.position.set(Math.cos(a2) * zn.r, 0, Math.sin(a2) * zn.r); bar.rotation.y = -a2; bar.add(box(0.08, 0.5, 0.08, 0xffffff, 0, 0.25, -0.5), box(0.08, 0.5, 0.08, 0xffffff, 0, 0.25, 0.5), box(0.06, 0.18, 1.3, i % 4 ? 0xf28c28 : 0xffffff, 0, 0.55, 0)); bar.userData.drop = 0.35 + i * 0.03; m.add(bar); }
      }
      else for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, rr = Math.random() * zn.r * 0.8; const bl = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 7, 5), mat(0x4a331d)); bl.scale.y = 0.4; bl.position.set(Math.cos(a) * rr, 0.12, Math.sin(a) * rr); m.add(bl); }
      m.position.set(zn.x, walkH(zn.x, zn.z), zn.z); scene.add(m); R.zones.set(zn.id, m);
    }
    m.children[0].material.opacity = Math.min(0.85, zn.t) * (zn.kind === 'cones' ? 0.25 : 1);
    if (zn.kind === 'cones') { m.userData.age = (m.userData.age || 0) + dt; for (const c of m.children) if (c.userData.drop) { const k = Math.min(1, Math.max(0, (m.userData.age - c.userData.drop + 0.3) / 0.3)); c.position.y = (c.geometry ? 0.38 : 0) + (1 - k) * 8; } }
    // Mud bubbles: blobs well up all over the bog and pop.
    if (zn.kind === 'mud' && Math.random() < dt * zn.r * 2.2) {
      const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * zn.r * 0.9, bx = zn.x + Math.cos(a) * rr, bz = zn.z + Math.sin(a) * rr;
      emit({ x: bx, y: walkH(bx, bz) + 0.15, z: bz, vy: 0.5 + Math.random() * 0.4, c: Math.random() < 0.5 ? 0x5b4026 : 0x7a5a3a, s: 0.35, life: 0.6, g: 0, grow: 1.9 });
      if (Math.random() < 0.3) for (let k = 0; k < 3; k++) emit({ x: bx, y: walkH(bx, bz) + 0.3, z: bz, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 2, vz: (Math.random() - 0.5) * 3, c: 0x4a331d, s: 0.14, life: 0.5, g: 14 });
    }
  }
  for (const [id, m] of R.zones) if (!seenZ.has(id)) { disposeObj(m); R.zones.delete(id); }

  const seenP = new Set();
  for (const pd of S.pending) {
    seenP.add(pd.id);
    let m = R.pend.get(pd.id);
    if (!m) { m = ringMesh(pd.r - 0.4, pd.r, 0xff5a4f, 0.8); m.position.set(pd.x, walkH(pd.x, pd.z) + 0.14, pd.z); scene.add(m); R.pend.set(pd.id, m); }
    m.material.opacity = 0.4 + 0.4 * Math.abs(Math.sin(time * 12));
  }
  for (const [id, m] of R.pend) if (!seenP.has(id)) { disposeObj(m); R.pend.delete(id); }

  // Building placement ghost (green = OK, red = blocked).
  if (UI.place) {
    if (!R.ghost || R.ghost.kind !== UI.place.kind) {
      if (R.ghost) disposeObj(R.ghost.g);
      const g = bldMesh(UI.place.kind, pl(0).f);
      g.rotation.y = Math.PI;
      g.traverse((n) => { if (n.material) { n.material = n.material.clone(); n.material.transparent = true; n.material.opacity = 0.55; } });
      const r = BLD[UI.place.kind].r;
      const ring = ringMesh(r + 0.4, r + 0.9, 0x9dff78, 0.9); g.add(ring);
      scene.add(g); R.ghost = { g, ring, kind: UI.place.kind };
    }
    const ok = Q.canPlace(pl(0), UI.place.kind, UI.place.x, UI.place.z);
    UI.place.ok = ok;
    R.ghost.g.position.set(UI.place.x, walkH(UI.place.x, UI.place.z), UI.place.z);
    R.ghost.ring.material.color.setHex(ok ? 0x9dff78 : 0xff6557);
    R.ghost.g.traverse((n) => { if (n.material && n !== R.ghost.ring) n.material.color.setHex(ok ? 0xffffff : 0xff6557); });
  } else if (R.ghost) { disposeObj(R.ghost.g); R.ghost = null; }
  // Build zone: while placing, every finished building of yours shows the circle you may build inside
  // (faint fill + a slowly turning dashed rim). Rebuilt only when the set of buildings changes.
  const own = UI.place ? S.blds.filter((b) => b.owner === 0 && b.built >= 1) : [];
  const key = own.map((b) => b.id).join(',');
  if (R.zoneKey !== key) {
    if (R.zone) disposeObj(R.zone);
    R.zone = null; R.zoneKey = key;
    if (own.length) {
      const g = new THREE.Group(), fill = basic(0x9dff78, 0.07), rim = basic(0x9dff78, 0.55);
      for (const b of own) {
        const c = new THREE.Mesh(new THREE.CircleGeometry(BUILD_RADIUS, 48), fill); c.rotation.x = -Math.PI / 2; c.position.set(b.x, walkH(b.x, b.z) + 0.09, b.z); c.renderOrder = 1; g.add(c);
        const r = new THREE.Group(); r.position.copy(c.position); r.userData.spin = true;
        for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2, d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.35), rim); d.rotation.set(-Math.PI / 2, 0, -a); d.position.set(Math.cos(a) * BUILD_RADIUS, 0.02, Math.sin(a) * BUILD_RADIUS); r.add(d); }
        g.add(r);
      }
      scene.add(g); R.zone = g;
    }
  }
  if (R.zone) R.zone.children.forEach((c) => { if (c.userData.spin) c.rotation.y = time * 0.05; });
}

// Power aiming preview: while a targeted power is armed, a ring of its real radius sits under the finger (or the screen
// centre until the finger moves), in your faction colour, pulsing. Radii mirror the sim (A.power / resolvePending).
const AIM_R = { mud: 8, cones: 7, wreck: 5, takeover: 7, jet: 3, fireworks: 7, mixtape: 7, wifi: 8 };
function aimRender(S, time) {
  const pw = UI.armed !== null && S.players[0] && fac0(S).powers[UI.armed];
  if (!pw || !AIM_R[pw.id]) { if (R.aim) R.aim.visible = false; if (UI.armed === null) UI.aim = null; return; }
  const r = AIM_R[pw.id];
  if (!R.aim || R.aim.userData.r !== r) {
    if (R.aim) disposeObj(R.aim);
    R.aim = new THREE.Group(); R.aim.userData.r = r;
    const ring = ringMesh(r - 0.35, r, selCol(), 0.9), fill = new THREE.Mesh(new THREE.CircleGeometry(r - 0.35, 40), basic(selCol(), 0.15));
    fill.rotation.x = -Math.PI / 2; fill.position.y = 0.09; R.aim.add(ring, fill); scene.add(R.aim);
  }
  const x = UI.aim ? UI.aim.x : CAM.tx, z = UI.aim ? UI.aim.z : CAM.tz;
  R.aim.visible = true; R.aim.position.set(x, walkH(x, z), z); R.aim.scale.setScalar(1 + Math.sin(time * 6) * 0.03);
}
// King of the Hill marker: a glowing ring + flag on the middle overpass, tinted to the holder, flickering when contested.
// Drifters (Downtown): neutral street folk in faded clothes holding a cardboard sign. They sway, and shake when upset
// (one more floor falling next to them and they join the wreckers).
const DRIFT_SHIRT = [0x8a7f6a, 0x6b7f8a, 0x7a6a8a, 0x8a6a5a, 0x6a8a6a], DRIFT_SKIN = [0xf2c9a0, 0xc68a5e, 0x8d5a3b, 0xe0b48c];
function driftMesh(i) {
  const g = new THREE.Group(), sh = DRIFT_SHIRT[i % 5], sk = DRIFT_SKIN[(i * 3) % 4];
  g.add(box(0.16, 0.5, 0.18, 0x3a3a3a, -0.12, 0.25, 0), box(0.16, 0.5, 0.18, 0x3a3a3a, 0.12, 0.25, 0), box(0.5, 0.62, 0.32, sh, 0, 0.82, 0), box(0.32, 0.32, 0.32, sk, 0, 1.3, 0), box(0.36, 0.12, 0.36, 0x5a4a3a, 0, 1.5, 0));
  g.add(box(0.6, 0.42, 0.03, 0xc9a26a, 0, 0.95, 0.3), box(0.04, 0.5, 0.04, 0x6b4a2a, 0, 0.6, 0.28)); // cardboard sign
  return casts(g);
}
function driftRender(S, time) {
  if (!R.drift) R.drift = new Map();
  const live = new Set();
  for (const d of S.drift || []) {
    live.add(d.id);
    let g = R.drift.get(d.id);
    if (!g) { g = driftMesh(d.id); g.rotation.y = d.ph; scene.add(g); R.drift.set(d.id, g); }
    const y = walkH(d.x, d.z), shake = d.upset ? Math.sin(time * 30) * 0.04 * d.upset : 0;
    g.position.set(d.x + shake, y + Math.abs(Math.sin(time * 1.3 + d.ph)) * 0.03, d.z);
    g.rotation.z = Math.sin(time * 0.8 + d.ph) * 0.05;
  }
  for (const [id, g] of R.drift) if (!live.has(id)) { disposeObj(g); R.drift.delete(id); }
}
function flagMarker(x, z, r) {
  const g = new THREE.Group(), ring = ringMesh(r - 0.5, r, 0xffffff, 0.8), fill = new THREE.Mesh(new THREE.CircleGeometry(r - 0.5, 40), basic(0xffffff, 0.12));
  fill.rotation.x = -Math.PI / 2; fill.position.y = 0.08;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), basic(0xffffff, 0.95)); flag.position.set(0.72, 3.5, 0);
  g.add(ring, fill, box(0.12, 4, 0.12, 0xdddddd, 0, 2, 0), flag); g.position.set(x, walkH(x, z), z); scene.add(g);
  return { g, ring, fill, flag };
}
function capRender(S, time) {
  if (!S.cap) { if (R.cap) { R.cap.forEach((o) => disposeObj(o.g)); R.cap = null; } return; }
  if (!R.cap) R.cap = S.cap.pts.map((f) => flagMarker(f.x, f.z, f.r));
  S.cap.pts.forEach((f, i) => {
    const o = R.cap[i], c = f.contested ? (Math.sin(time * 18) > 0 ? 0x7fd1ff : 0xff5a4f) : f.owner === 0 ? 0x7fd1ff : f.owner === 1 ? 0xff5a4f : 0xf3efe2;
    o.ring.material.color.setHex(c); o.fill.material.color.setHex(c); o.flag.material.color.setHex(c);
    o.flag.position.y = 1.2 + Math.abs(f.prog) * 2.3; // the flag climbs the pole as it is captured
    o.flag.rotation.y = Math.sin(time * 3 + i) * 0.3;
  });
}
function hillRender(S, time) {
  if (!S.hill) { if (R.hill) { disposeObj(R.hill.g); R.hill = null; } return; }
  if (!R.hill) {
    const g = new THREE.Group(), h = S.hill, y = walkH(h.x, h.z);
    const ring = ringMesh(h.r - 0.5, h.r, 0xffffff, 0.8), fill = new THREE.Mesh(new THREE.CircleGeometry(h.r - 0.5, 40), basic(0xffffff, 0.12));
    fill.rotation.x = -Math.PI / 2; fill.position.y = 0.08;
    const pole = box(0.12, 4, 0.12, 0xdddddd, 0, 2, 0), flag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), basic(0xffffff, 0.95));
    flag.position.set(0.72, 3.5, 0);
    g.add(ring, fill, pole, flag); g.position.set(h.x, y, h.z); scene.add(g);
    R.hill = { g, ring, fill, flag };
  }
  const h = S.hill, o = R.hill, c = h.contested ? (Math.sin(time * 18) > 0 ? 0x7fd1ff : 0xff5a4f) : h.holder === 0 ? 0x7fd1ff : h.holder === 1 ? 0xff5a4f : 0xf3efe2;
  o.ring.material.color.setHex(c); o.fill.material.color.setHex(c); o.flag.material.color.setHex(c);
  o.fill.material.opacity = 0.1 + (h.holder >= 0 ? 0.08 + Math.sin(time * 4) * 0.05 : 0);
  o.flag.rotation.y = Math.sin(time * 3) * 0.3; o.flag.scale.x = 1 + Math.sin(time * 7) * 0.08;
}
export function clearRender() {
  if (R.drift) { for (const g of R.drift.values()) disposeObj(g); R.drift.clear(); }
  if (R.aim) { disposeObj(R.aim); R.aim = null; }
  if (R.hill) { disposeObj(R.hill.g); R.hill = null; }
  if (R.cap) { R.cap.forEach((o) => disposeObj(o.g)); R.cap = null; }
  for (const o of R.sq.values()) disposeObj(o.root);
  for (const o of R.bl.values()) { disposeObj(o.root); if (o.flag) { disposeObj(o.flag); disposeObj(o.dots); } }
  for (const o of R.nodes.values()) disposeObj(o.g);
  for (const m of R.zones.values()) disposeObj(m);
  for (const m of R.pend.values()) disposeObj(m);
  if (R.ghost) disposeObj(R.ghost.g);
  R.ghost = null;
  if (R.zone) disposeObj(R.zone); R.zone = null; R.zoneKey = '';
  for (const d of dying) disposeObj(d.root); dying.length = 0;
  for (const c of corpses) disposeObj(c.o.root); corpses.length = 0;
  R.sq.clear(); R.bl.clear(); R.nodes.clear(); R.zones.clear(); R.pend.clear();
}

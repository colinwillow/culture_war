// Mirrors sim state into the scene every frame. Reads the sim, never writes to it.
import { THREE, scene, camera, mat, box, basic, ringMesh, disposeObj } from './scene.js?v=10';
import { makeMember, bldMesh, nodeMesh, formation, FC } from './models.js?v=10';
import { makeChar, charsReady, play, CAST } from './chars.js?v=10';
import { emit } from '../fx/particles.js?v=10';
import { TICK } from '../config/factions.js?v=10';
import { walkH } from '../map/layout.js?v=10';
import { NODE_AMOUNT, BLD } from '../config/factions.js?v=10';
import { Q, pl } from '../sim/sim.js?v=10';
import { UI } from '../ui/state.js?v=10';
import { fxConfetti, fxDeath } from '../fx/fx.js?v=10';
import { lerpAngle } from '../util/math.js?v=10';

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
    m.position.set(ox, y, oz); m.userData.by = y; m.userData.bz = oz; m.userData.hp = s.members[i]; if (s.members[i] <= 0) m.userData.deadT = 0; body.add(m); return m;
  });
  const real = !!members[0].userData.anim;
  // Cast but not loaded yet: syncRender rebuilds this squad once the real characters arrive.
  const wait = !real && !!(CAST[s.f] && CAST[s.f][s.slot]);
  const team = new THREE.Mesh(new THREE.CircleGeometry(s.r + 0.25, 28), basic(s.owner === 0 ? 0x7fd1ff : 0xff5a4f, 0.25));
  team.rotation.x = -Math.PI / 2; team.position.y = 0.08; root.add(team);
  const sel = ringMesh(s.r + 0.45, s.r + 0.72, 0xffffff, 0.95); sel.visible = false; root.add(sel);
  const shield = ringMesh(s.r + 0.15, s.r + 0.4, 0x6fc3ff, 0.85); shield.visible = false; root.add(shield);
  const h = real ? 1.85 : new THREE.Box3().setFromObject(body).max.y;
  const bar = makeBar(Math.max(1.4, s.r * 1.5)); bar.g.position.y = h + 0.7; root.add(bar.g);
  const stun = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 6, 14), mat(0xffe14d)); stun.rotation.x = Math.PI / 2; stun.position.y = h + 0.25; stun.visible = false; root.add(stun);
  const pie = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat(0xfff8ec)); pie.scale.y = 0.6; pie.position.y = h + 0.05; pie.visible = false; root.add(pie);
  const carry = box(0.5, 0.4, 0.5, 0xf5b83a, 0, h + 0.1, 0); carry.visible = false; root.add(carry);
  const rank = new THREE.Group(); rank.position.y = h + 1.05;
  for (let i = 0; i < 2; i++) { const d = box(0.2, 0.2, 0.2, 0xf5b83a, (i - 0.5) * 0.32, 0, 0); d.visible = false; rank.add(d); }
  root.add(rank);
  scene.add(root);
  return { root, body, members, team, sel, shield, bar, stun, pie, carry, rank, yaw: s.heading, lunge: 0, atk: false, real, wait, lastAlive: s.def.n, confT: 0 };
}
function makeBldObj(b) {
  const root = new THREE.Group(), mesh = bldMesh(b.kind, b.f); root.add(mesh);
  const pips = new THREE.Group(); pips.position.set(0, b.kind === 'barracks' ? 3 : 0, 0);
  if (b.kind === 'barracks') for (let i = 0; i < 3; i++) pips.add(box(0.4, 0.4, 0.4, 0xf5b83a, (i - 1) * 0.6, 0, 0));
  root.add(pips);
  const scaff = new THREE.Mesh(new THREE.BoxGeometry(b.r * 1.8, 2.8, b.r * 1.8), new THREE.MeshBasicMaterial({ color: 0xf2c232, wireframe: true }));
  scaff.position.y = 1.4; root.add(scaff);
  const sel = ringMesh(b.r + 0.3, b.r + 0.6, 0xffffff, 0.95); sel.visible = false; root.add(sel);
  const team = new THREE.Mesh(new THREE.CircleGeometry(b.r + 0.2, 32), basic(b.owner === 0 ? 0x7fd1ff : 0xff5a4f, 0.2));
  team.rotation.x = -Math.PI / 2; team.position.y = 0.07; root.add(team);
  const h = new THREE.Box3().setFromObject(mesh).max.y;
  const bar = makeBar(b.r * 1.4); bar.g.position.y = h + 0.8; root.add(bar.g);
  root.position.set(b.x, walkH(b.x, b.z), b.z);
  if (b.owner === 0) mesh.rotation.y = Math.PI; // face the enemy
  scene.add(root);
  return { root, mesh, coin: mesh.userData.coin, pips, scaff, sel, bar, h, r: b.r, smokeT: 0 };
}
function makeNodeObj(n) {
  const g = nodeMesh();
  const ring = ringMesh(2.6, 2.9, 0xf5b83a, 0.5); g.add(ring);
  g.position.set(n.x, walkH(n.x, n.z), n.z);
  g.rotation.y = (n.x * 7 + n.z) % 6;
  ring.rotation.z = 0;
  scene.add(g);
  return { g, ring, coin: g.userData.coin };
}

export function bump(id) { const o = R.sq.get(id); if (o) { o.lunge = 0.15; o.atk = true; } }
export function squadObj(id) { return R.sq.get(id); }
/** Squads answer an order with a little hop, so a command visibly lands. */
export function ack(ids) { for (const id of ids) { const o = R.sq.get(id); if (o) o.ack = 0.45; } }
const hop = (o, i) => { if (!(o.ack > 0)) return 0; const k = 1 - o.ack / 0.45 - i * 0.04; return k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.4 : 0; };

export function syncRender(S, alpha, dt, time) {
  const selIds = new Set(UI.sel && UI.sel.type === 'sq' ? UI.sel.ids : []);
  const seen = new Set();
  for (const s of S.squads) {
    seen.add(s.id);
    let o = R.sq.get(s.id);
    if (o && o.wait && charsReady()) { const keep = o.lastAlive; disposeObj(o.root); o = null; R.sq.delete(s.id); o = makeSquadObj(s); o.lastAlive = keep; R.sq.set(s.id, o); }
    if (!o) { o = makeSquadObj(s); R.sq.set(s.id, o); }
    const x = s.px + (s.x - s.px) * alpha, z = s.pz + (s.z - s.pz) * alpha;
    o.root.position.set(x, walkH(x, z), z);
    o.yaw = lerpAngle(o.yaw, s.heading, Math.min(1, dt * 10)); o.body.rotation.y = o.yaw;
    const moving = Math.abs(s.x - s.px) + Math.abs(s.z - s.pz) > 0.0005;
    const par = pl(s.owner).parade > 0, bs = par ? 18 : s.bull > 0 ? 14 : 10;
    let alive = 0;
    if (o.real) {
      const v = Math.hypot(s.x - s.px, s.z - s.pz) / TICK;
      const gather = s.slot === 'worker' && s.gatherT > 0 && s.task && s.task.state === 'gather';
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
        if (s.members[i] < m.userData.hp - 0.5 && !o.atk) play(m, 'hit');
        m.userData.hp = s.members[i];
        if (o.atk) play(m, A.atk, true);
        else if (gather && A.lock <= 0) play(m, A.atk);
        else if (A.lock <= 0) {
          const st = v < 0.15 ? 'idle' : v < 1.8 ? 'walk' : 'run';
          play(m, st);
          // Clip speed follows ground speed so feet roughly match (refs are guesses: walk 1.2, run 3.0 m/s).
          if (st !== 'idle') A.actions[st].setEffectiveTimeScale(Math.min(1.8, Math.max(0.6, v / (st === 'walk' ? 1.2 : 3.0))));
        }
        A.mixer.update(dt * (s.stun > 0 ? 0.25 : 1));
        m.position.z = m.userData.bz + o.lunge * 2.5;
        m.position.y = m.userData.by + hop(o, i);
      }
      o.atk = false;
    } else for (let i = 0; i < o.members.length; i++) {
      const m = o.members[i], live = s.members[i] > 0;
      m.visible = live;
      if (!live) continue;
      alive++;
      let y = m.userData.by;
      if (s.def.flies) y += Math.sin(time * 3 + i) * 0.3;
      else if (moving && s.def.vehicle) y += Math.abs(Math.sin(time * 16)) * 0.1;
      else if (moving) y += Math.abs(Math.sin(time * bs + i * 1.3)) * 0.08;
      m.position.y = y + hop(o, i); m.scale.y = s.sit ? 0.55 : 1; m.position.z = m.userData.bz + o.lunge * 2.5;
      const legs = m.userData.legs;
      if (legs) { const sw = moving ? Math.sin(time * bs + i * 1.3) * 0.7 : 0; legs[0].rotation.x = sw; legs[1].rotation.x = -sw; }
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
    if (alive < o.lastAlive) for (let k = 0; k < o.lastAlive - alive; k++) fxDeath(x, z, s.f);
    o.lastAlive = alive;
    o.sel.visible = selIds.has(s.id);
    o.team.material.opacity = 0.25 + s.rally * 2 + (s.bull > 0 ? 0.25 : 0);
    o.team.material.color.setHex(s.bull > 0 ? 0xe85d9a : s.owner === 0 ? 0x7fd1ff : 0xff5a4f);
    let tot = 0; for (const h of s.members) tot += h;
    setBar(o.bar, tot / (s.members.length * s.mhp));
    o.bar.g.visible = tot < s.members.length * s.mhp || o.sel.visible;
    o.bar.g.quaternion.copy(camera.quaternion);
    o.stun.visible = s.stun > 0 && s.stun <= 2.5; o.stun.rotation.z = time * 6;
    o.pie.visible = s.stun > 2.5; o.shield.visible = s.sit; o.carry.visible = s.carry > 0;
    o.rank.children.forEach((c, i) => (c.visible = i < s.rank)); o.rank.quaternion.copy(camera.quaternion);
    if (par) { o.confT -= dt; if (o.confT <= 0) { o.confT = 0.5; fxConfetti(x, z, 4); } }
  }
  for (const [id, o] of R.sq) if (!seen.has(id)) { disposeObj(o.root); R.sq.delete(id); }

  const seenB = new Set();
  for (const b of S.blds) {
    seenB.add(b.id);
    let o = R.bl.get(b.id);
    if (!o) { o = makeBldObj(b); R.bl.set(b.id, o); }
    o.mesh.scale.y = 0.25 + 0.75 * b.built; o.scaff.visible = b.built < 1;
    if (o.coin) o.coin.rotation.z += dt * 2.5;
    o.pips.children.forEach((p, i) => { p.visible = i < b.level || (b.up > 0 && i === b.level && Math.sin(time * 10) > 0); });
    o.sel.visible = !!(UI.sel && UI.sel.type === 'bld' && UI.sel.id === b.id);
    setBar(o.bar, b.built < 1 ? b.built : b.hp / b.maxHp, b.built < 1 ? 0xf2c232 : 0);
    o.bar.g.visible = b.built < 1 || b.hp < b.maxHp || o.sel.visible;
    o.bar.g.quaternion.copy(camera.quaternion);
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
  for (const [id, o] of R.bl) if (!seenB.has(id)) { R.bl.delete(id); o.bar.g.visible = false; o.sel.visible = false; dying.push({ root: o.root, mesh: o.mesh, h: o.h, t: 0, tilt: (Math.random() - 0.5) * 0.8 }); }
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
    o.ring.material.opacity = 0.3 + 0.2 * Math.sin(time * 2);
  }

  const seenZ = new Set();
  for (const zn of S.zones) {
    seenZ.add(zn.id);
    let m = R.zones.get(zn.id);
    if (!m) {
      m = new THREE.Group();
      const d = new THREE.Mesh(new THREE.CircleGeometry(zn.r, 40), basic(0x5b4026, 0.85)); d.rotation.x = -Math.PI / 2; d.position.y = 0.11; m.add(d);
      for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28, rr = Math.random() * zn.r * 0.8; const bl = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 7, 5), mat(0x4a331d)); bl.scale.y = 0.4; bl.position.set(Math.cos(a) * rr, 0.12, Math.sin(a) * rr); m.add(bl); }
      m.position.set(zn.x, walkH(zn.x, zn.z), zn.z); scene.add(m); R.zones.set(zn.id, m);
    }
    m.children[0].material.opacity = Math.min(0.85, zn.t);
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
}

export function clearRender() {
  for (const o of R.sq.values()) disposeObj(o.root);
  for (const o of R.bl.values()) disposeObj(o.root);
  for (const o of R.nodes.values()) disposeObj(o.g);
  for (const m of R.zones.values()) disposeObj(m);
  for (const m of R.pend.values()) disposeObj(m);
  if (R.ghost) disposeObj(R.ghost.g);
  R.ghost = null;
  for (const d of dying) disposeObj(d.root); dying.length = 0;
  R.sq.clear(); R.bl.clear(); R.nodes.clear(); R.zones.clear(); R.pend.clear();
}

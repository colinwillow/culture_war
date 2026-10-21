// Game simulation. Pure logic: no three.js, no DOM.
// Contract:
//   - newSim(faction, seed) creates the match; getSim() returns state (read-only for everyone else).
//   - command(playerIndex, cmd) queues an order; it is applied at the start of the next tick.
//     This is the ONLY way UI/input/network change the game (lockstep-multiplayer ready).
//   - step() advances one fixed TICK. Uses S.rng only, never Math.random.
//   - S.events: list of things that happened this tick ({k:'shot'|'hit'|'boom'|...}); render/fx drain it.
//   - Q: read-only queries (canPlace, canTrain, ...) the UI may call for instant button feedback.
import {
  TICK, START_CASH, BUILD_RADIUS, MAX_WORKERS, NODE_AMOUNT, GATHER_T, CARRY, BASE_INCOME, DEPOT_INCOME,
  COUNTER, REQ, UPG, UPT, BLD, FACTIONS,
} from '../config/factions.js?v=131';
import { MAP, NODES, BASES, CITY, walkH } from '../map/layout.js?v=131';
import { markCircle, isBlocked, lineClear, nearestFree, findPath, blocked, cellOf, cellCenter, inGrid } from '../map/grid.js?v=131';
import { mulberry32 } from '../util/math.js?v=131';
import { aiStep } from './ai.js?v=131';

let S = null;
export const getSim = () => S;
export const pl = (i) => S.players[i];
export const fac = (p) => FACTIONS[p.f];

function mkPlayer(i, f, side) {
  return { i, f, side, inc: 1, cash: START_CASH, st: { kills: 0, earned: 0, built: 0, razed: 0 }, meter: 0, incomeT: 0, parade: 0, party: 0, hqx: BASES[i].x, hqz: BASES[i].z };
}

// diff: 0 easy, 1 normal, 2 hard - the computer earns 70% / 100% / 135% and attacks with smaller / bigger waves.
export function newSim(pf, seed = 12345, diff = 1, mode = 'vs') {
  if (S) for (const b of S.blds) markCircle(b.x, b.z, b.r, -1); // free old building cells
  const others = Object.keys(FACTIONS).filter((k) => k !== pf), af = others[seed % others.length]; // random opponent
  S = {
    t: 0, nid: 1, rng: mulberry32(seed),
    players: [mkPlayer(0, pf, 1), mkPlayer(1, af, -1)],
    squads: [], blds: [], nodes: [], zones: [], pending: [], events: [], cmds: [], over: null,
    ai: { t: 0, wave: [30, 20, 14][diff], waveMax: [32, 45, 60][diff] },
    mode,
    // King of the Hill: the middle overpass. Holding it alone (no enemy fighters on it) fills your bar; full = win.
    // Resource Race: first to EARN this much (income + deposits + scrap; spending doesn't count against you) wins.
    race: mode === 'race' ? { goal: 2500 } : null,
    // Downtown: one side wrecks the city, the other keeps it standing. meter = share of all floors still up.
    down: mode === 'down-w' || mode === 'down-b' ? { role: mode === 'down-w' ? ['w', 'b'] : ['b', 'w'], meter: 1, start: 0, total: 0, limit: 480, lose: 0.35, win: 0.97, hold: 0.6, hot: null } : null,
    // Capture and Hold: three flags (the middle overpass + one park on each side). Fighters of one side alone at a flag
    // swing it over in ~6 s; every second, the side holding MORE flags drains the other's 300-point counter by the margin.
    cap: mode === 'cap' ? { pts: [[0, 0], [-18, 29], [18, -29]].map(([x, z]) => ({ x, z, r: 6, prog: 0, owner: -1 })), score: [300, 300], max: 300, t: 0 } : null,
    hill: mode === 'hill' ? { x: 0, z: 0, r: 7, prog: [0, 0], holder: -1, contested: false, win: 90 } : null,
  };
  S.players[1].inc = [0.7, 1, 1.35][diff];
  for (const p of S.players) { const tr = fac(p).traits || {}; p.cash = Math.round(p.cash * (tr.cash || 1)); p.inc *= tr.inc || 1; } // Old Money: a trust fund
  for (const [x, z] of NODES) S.nodes.push({ id: S.nid++, x, z, amount: NODE_AMOUNT });
  // The city itself: every storefront is a neutral target with FLOOR_HP per floor. Smashing knocks floors off from the
  // top; workers rebuild them one at a time. owner -1 = nobody's, so it never counts as anyone's base.
  S.city = CITY.map((c, i) => ({ id: S.nid++, ci: i, isBld: true, city: true, kind: 'city', owner: -1, x: c.x, z: c.z, sx: c.sx, sz: c.sz,
    r: (Math.min(c.sx, c.sz) + Math.max(c.sx, c.sz)) / 4, floors: c.floors, fl: c.floors, maxHp: c.floors * FLOOR_HP, hp: c.floors * FLOOR_HP, built: 1, dead: false }));
  for (const p of S.players) {
    addBld(p, 'hq', p.hqx, p.hqz, true);
    for (let i = 0; i < 2; i++) { const w = spawnSquad(p, 'worker', p.hqx + (i ? 5 : -5), p.hqz - p.side * 6); w.task = { state: 'find' }; }
    if (mode === 'hero') { const h = spawnSquad(p, 'hero', p.hqx, p.hqz - p.side * 12); h.post = { x: h.x, z: h.z }; } // Hero vs Hero: just the hero
    else spawnSquad(p, 'melee', p.hqx, p.hqz - p.side * 12);
  }
  if (mode === 'hero') S.duel = true;
  if (S.down) { // the city starts already battered: about a third of the floors are missing (rubble on some blocks)
    for (const b of S.city) { const k = S.rng(); const lost = k < 0.12 ? b.floors : k < 0.5 ? Math.floor(S.rng() * b.floors * 0.7) : 0; b.fl = b.floors - lost; b.hp = b.fl * FLOOR_HP; b.dead = b.fl === 0; }
    S.down.total = S.city.reduce((a, b) => a + b.floors, 0);
    S.down.meter = S.down.start = S.city.reduce((a, b) => a + b.fl, 0) / S.down.total;
  }
  return S;
}

export const count = (p, k) => S.blds.filter((b) => b.owner === p.i && b.kind === k).length;
export const builtCount = (p, k) => S.blds.filter((b) => b.owner === p.i && b.kind === k && b.built >= 1).length;
export const cpCap = (p) => 50 + 5 * builtCount(p, 'depot');
export function cpUsed(p) {
  let c = 0;
  for (const s of S.squads) if (s.owner === p.i) c += s.def.cp;
  for (const b of S.blds) if (b.owner === p.i) for (const q of b.queue) c += fac(p).units[q].cp;
  return c;
}
export const barracksOf = (p) => S.blds.find((b) => b.owner === p.i && b.kind === 'barracks' && b.built >= 1);
export const hqOf = (p) => S.blds.find((b) => b.owner === p.i && b.kind === 'hq');
export const workersOf = (p) => S.squads.filter((s) => s.owner === p.i && s.slot === 'worker');
const heroBusy = (p) => { const hq = hqOf(p); return S.squads.some((s) => s.owner === p.i && s.slot === 'hero') || (hq && hq.queue.includes('hero')); };
export const aliveN = (s) => { let n = 0; for (const h of s.members) if (h > 0) n++; return n; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) - a.r - b.r;
const sqR = (def, slot) => (def.n > 1 ? 1.3 : def.vehicle ? 1.4 : slot === 'hero' ? 0.8 : slot === 'worker' ? 0.6 : 1.1);
const byId = (id) => S.squads.find((s) => s.id === id) || S.blds.find((b) => b.id === id) || S.city.find((b) => b.id === id) || null;
const FLOOR_HP = 100;
// Floors standing for a city storefront's hp: a floor is gone once its slice of hp is fully gone.
const floorsFor = (b) => Math.max(0, Math.min(b.floors, Math.ceil(b.hp / FLOOR_HP - 1e-6)));

function addBld(p, kind, x, z, done) {
  const d = BLD[kind];
  const hp = d.hp * ((fac(p).traits && fac(p).traits.bldHp) || 1);
  const b = { id: S.nid++, isBld: true, kind, owner: p.i, f: p.f, x, z, r: d.r, maxHp: hp, hp: done ? hp : hp * 0.1, built: done ? 1 : 0, level: 1, up: 0, upT: 1, queue: [], prodT: 0, cd: 0, dead: false, rally: null, garrison: null };
  S.blds.push(b);
  markCircle(x, z, d.r, 1);
  return b;
}

// ---------- Queries (safe to call from UI) ----------
export const Q = {
  canPlace(p, kind, x, z) {
    const r = BLD[kind].r;
    if (Math.abs(x) > MAP.w / 2 - r - 2 || Math.abs(z) > MAP.h / 2 - r - 2) return false;
    if (walkH(x, z) !== 0 || Math.abs(z) < 8) return false;
    const [c0, r0] = cellOf(x - r, z - r), [c1, r1] = cellOf(x + r, z + r);
    for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) {
      if (!inGrid(c, rr)) return false;
      const [cx, cz] = cellCenter(c, rr);
      if (Math.hypot(cx - x, cz - z) < r + 1 && blocked[c + rr * MAP.cols]) return false;
    }
    for (const n of S.nodes) if (Math.hypot(n.x - x, n.z - z) < r + 3) return false;
    for (const s of S.squads) if (Math.hypot(s.x - x, s.z - z) < r + s.r) return false;
    if (!S.blds.some((b) => b.owner === p.i && b.built >= 1 && Math.hypot(b.x - x, b.z - z) < BUILD_RADIUS)) return false;
    return true;
  },
  canBuild(p, kind) { return count(p, kind) < BLD[kind].max && p.cash >= BLD[kind].cost; },
  /** null if OK, else 'lock' | 'busy' | 'cash' | 'cp' */
  canTrain(p, b, slot) {
    const def = fac(p).units[slot];
    if (S.duel && slot !== 'worker') return 'lock'; // Hero vs Hero: workers only
    if (slot === 'hero') { if (b.kind !== 'hq' || heroBusy(p)) return 'lock'; }
    else if (slot === 'worker') { if (b.kind !== 'hq' || workersOf(p).length + b.queue.filter((q) => q === 'worker').length >= MAX_WORKERS) return 'lock'; }
    else { if (b.kind !== 'barracks' || b.level < REQ[slot]) return 'lock'; if (b.queue.length >= 5) return 'busy'; }
    if (b.built < 1 || b.up > 0) return 'busy';
    if (p.cash < def.cost) return 'cash';
    if (cpUsed(p) + def.cp > cpCap(p)) return 'cp';
    return null;
  },
  canUpgrade(p, b) { return b.kind === 'barracks' && b.level < 3 && !b.up && b.built >= 1 && p.cash >= UPG[b.level]; },
  powerReady(p, idx) {
    const pw = fac(p).powers[idx];
    if (p.meter < pw.cost) return false;
    if (pw.id === 'pie') return S.squads.some((o) => o.owner !== p.i && o.slot === 'hero');
    return true;
  },
};

// ---------- Actions (only run inside the tick) ----------
export const A = {
  build(p, kind, x, z) {
    if (!Q.canPlace(p, kind, x, z) || !Q.canBuild(p, kind)) return false;
    p.cash -= BLD[kind].cost; addBld(p, kind, x, z, false); return true;
  },
  upgrade(p, b) {
    if (!Q.canUpgrade(p, b)) return false;
    p.cash -= UPG[b.level]; b.up = UPT[b.level]; b.upT = b.up; return true;
  },
  train(p, b, slot) {
    if (Q.canTrain(p, b, slot)) return false;
    p.cash -= fac(p).units[slot].cost; b.queue.push(slot); return true;
  },
  power(p, idx, x, z) {
    const pw = fac(p).powers[idx];
    if (!pw || !Q.powerReady(p, idx)) return false;
    if (pw.id === 'pie') { const h = S.squads.find((o) => o.owner !== p.i && o.slot === 'hero'); h.stun = 15; S.events.push({ k: 'pie', x: h.x, z: h.z }); }
    else if (pw.id === 'blockparty') { p.party = 12; S.events.push({ k: 'blockparty', owner: p.i }); } // whole army +30% damage and speed
    else if (pw.id === 'mixtape') { S.pending.push({ id: S.nid++, kind: 'mixtape', owner: p.i, x, z, r: 7, t: 1.2 }); S.events.push({ k: 'mixlaunch', x, z, owner: p.i }); }
    else if (pw.id === 'wifi') { // Wi-Fi Outage: everyone on the other side within 8 m freezes (3 s) and their towers there go dark (6 s)
      for (const o of S.squads) if (o.owner !== p.i && Math.hypot(o.x - x, o.z - z) < 8 + o.r) o.stun = Math.max(o.stun, 3);
      for (const b of S.blds) if (b.owner !== p.i && (b.kind === 'tower' || b.kind === 'hq') && Math.hypot(b.x - x, b.z - z) < 8 + b.r) b.jam = 6;
      S.events.push({ k: 'wifi', x, z, r: 8 });
    }
    else if (pw.id === 'patch') { // Patch Notes: every squad of yours is patched up 25% and hits 25% harder for 12 s
      for (const o of S.squads) if (o.owner === p.i) { o.members = o.members.map((h) => (h > 0 ? Math.min(o.mhp, h + o.mhp * 0.25) : h)); o.patch = 12; }
      S.events.push({ k: 'patch', owner: p.i });
    }
    else if (pw.id === 'parade') { p.parade = 15; S.events.push({ k: 'parade', owner: p.i }); }
    else if (pw.id === 'mud') { S.zones.push({ id: S.nid++, kind: 'mud', owner: p.i, x, z, r: 8, t: 10 }); S.events.push({ k: 'mud', x, z }); }
    else if (pw.id === 'cones') { S.zones.push({ id: S.nid++, kind: 'cones', owner: p.i, x, z, r: 7, t: 12 }); S.events.push({ k: 'cones', x, z, r: 7 }); }
    else if (pw.id === 'wreck') { S.pending.push({ id: S.nid++, kind: 'wreck', owner: p.i, x, z, r: 5, t: 1.4 }); S.events.push({ k: 'wrecklaunch', x, z, owner: p.i }); }
    else if (pw.id === 'takeover') { // money rains on the nearest enemy squad (not a hero) - they pocket it and change sides
      let t = null, bd = 7;
      for (const o of S.squads) { if (o.owner === p.i || o.slot === 'hero' || o.gar) continue; const d = Math.hypot(o.x - x, o.z - z); if (d < bd) { bd = d; t = o; } }
      if (!t) return false;
      t.owner = p.i; setOrder(t, { type: 'idle' }); t.post = { x: t.x, z: t.z }; t.hold = false;
      S.events.push({ k: 'takeover', x: t.x, z: t.z, id: t.id, owner: p.i });
    }
    else if (pw.id === 'jet') { S.pending.push({ id: S.nid++, kind: 'jet', owner: p.i, x, z, r: 3, t: 1.6 }); S.events.push({ k: 'jetfly', x, z, owner: p.i }); }
    else if (pw.id === 'fireworks') { S.pending.push({ id: S.nid++, kind: 'fireworks', owner: p.i, x, z, r: 7, t: 1.8 }); S.events.push({ k: 'fwlaunch', x, z, owner: p.i }); }
    p.meter -= pw.cost; return true;
  },
};

// ---------- Commands ----------
export function command(pi, cmd) { if (S && !S.over) S.cmds.push({ pi, ...cmd }); }
const ORDER_PRI = { pike: 0, melee: 0, cav: 1, hero: 1, ranged: 2, siege: 3, worker: 4 };
function ownSquads(pi, ids) { return ids.map((id) => S.squads.find((s) => s.id === id)).filter((s) => s && s.owner === pi); }
function moveFormation(sel, x, z) {
  const n = sel.length, cols = Math.ceil(Math.sqrt(n)), sp = 3.2;
  let cx = 0, cz = 0; sel.forEach((s) => { cx += s.x; cz += s.z; }); cx /= n; cz /= n;
  const h = Math.atan2(x - cx, z - cz), fx = Math.sin(h), fz = Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
  [...sel].sort((a, b) => ORDER_PRI[a.slot] - ORDER_PRI[b.slot]).forEach((s, i) => {
    const c = i % cols, r = Math.floor(i / cols), ox = (c - (cols - 1) / 2) * sp, oz = -r * sp;
    const [px, pz] = nearestFree(x + rx * ox + fx * oz, z + rz * ox + fz * oz);
    setOrder(s, { type: 'move', x: px, z: pz });
  });
}
function applyCmd(c) {
  const p = pl(c.pi);
  switch (c.type) {
    case 'build': A.build(p, c.kind, c.x, c.z); break;
    case 'upgrade': { const b = byId(c.id); if (b && b.owner === p.i) A.upgrade(p, b); break; }
    case 'train': { const b = byId(c.id); if (b && b.owner === p.i) A.train(p, b, c.slot); break; }
    case 'power': A.power(p, c.idx, c.x, c.z); break;
    case 'rally': { const b = byId(c.id); if (b && b.owner === p.i && (b.kind === 'barracks' || b.kind === 'hq')) { const [rx, rz] = nearestFree(c.x, c.z); b.rally = { x: rx, z: rz }; } break; }
    case 'stance': ownSquads(p.i, c.ids).forEach((s) => { if (s.slot !== 'worker') { s.hold = !!c.hold; if (s.hold && s.order.type === 'idle') s.post = { x: s.x, z: s.z }; } }); break;
    case 'garrison': { const b = byId(c.tower); if (b && b.owner === p.i && b.kind === 'tower' && b.built >= 1 && !b.garrison) { const q = ownSquads(p.i, c.ids).find((s) => !s.def.vehicle && !s.def.flies && s.slot !== 'worker' && s.slot !== 'hero' && !s.gar); if (q) { setOrder(q, { type: 'enter', tower: b }); b.garrison = q.id; } } break; }
    case 'eject': { const b = byId(c.id); if (b && b.owner === p.i && b.garrison) ejectTower(b); break; }
    case 'repair': { const b = byId(c.id); if (b && (b.owner === p.i || b.city) && b.built >= 1 && b.hp < b.maxHp) ownSquads(p.i, c.ids).forEach((s) => { if (s.slot === 'worker') setOrder(s, { type: 'repair', b }); }); break; }
    case 'cancel': { const b = byId(c.id); if (b && b.owner === p.i && b.queue[c.idx]) { p.cash += fac(p).units[b.queue[c.idx]].cost; b.queue.splice(c.idx, 1); if (c.idx === 0) b.prodT = 0; S.events.push({ k: 'refund', x: b.x, z: b.z, owner: p.i }); } break; }
    case 'move': { const sel = ownSquads(p.i, c.ids); if (sel.length) moveFormation(sel, c.x, c.z); break; }
    case 'attack': { const t = byId(c.target); if (t && t.owner !== p.i) ownSquads(p.i, c.ids).forEach((s) => { if (s.slot !== 'worker') setOrder(s, { type: 'attack', target: t }); }); break; }
    case 'gather': { const n = S.nodes.find((q) => q.id === c.node); if (n) ownSquads(p.i, c.ids).forEach((s) => { if (s.slot === 'worker') { setOrder(s, { type: 'gather', node: n }); s.task = { state: 'find' }; } }); break; }
    case 'sit': ownSquads(p.i, c.ids).forEach((s) => { if (s.f === 'ac' && s.slot === 'melee') { s.sit = !!c.on; if (s.sit) { s.order = { type: 'idle' }; s.path = null; } } }); break;
  }
}

// ---------- Units ----------
const AGGRO = 10, LEASH = 14; // idle guard radius / how far an idle squad will chase from its post
export function spawnSquad(p, slot, x, z) {
  const def = fac(p).units[slot];
  const s = {
    id: S.nid++, owner: p.i, f: p.f, slot, def, x, z, px: x, pz: z, mhp: def.hp, members: new Array(def.n).fill(def.hp), r: sqR(def, slot),
    order: { type: 'idle' }, path: null, pathT: 0, cd: 0, kills: 0, rank: 0, stun: 0, debuff: 0, bull: 0, sit: false, abil: 4,
    heading: p.side > 0 ? Math.PI : 0, post: { x, z }, rally: 0, dead: false, carry: 0, gatherT: 0, task: null,
  };
  S.squads.push(s);
  return s;
}
export function setOrder(s, o) {
  s.sit = false; s.order = o; s.path = null; s.pathT = 0;
  if (s.slot === 'worker' && o.type !== 'gather') s.task = null;
}
function perHit(s, t) {
  let m = 1 + (s.slot === 'hero' ? 0.12 : 0.2) * s.rank;
  if (s.rally) m *= 1 + s.rally;
  if (s.debuff > 0) m *= 0.8;
  if (s.bull > 0) m *= 1.25;
  if (pl(s.owner).party > 0) m *= 1.3;
  if (s.patch > 0) m *= 1.25;
  let d = s.def.dmg * m;
  if (t.isBld) d *= s.slot === 'siege' ? 3 : 0.5;
  else if (s.slot === 'siege') d *= 0.5;
  else if (COUNTER[s.slot] === t.slot) d *= 2;
  return d;
}
const HERO_LV = [4, 10, 18, 28, 40];
function credit(a, k) {
  if (!a || a.dead) return;
  a.kills += k;
  // Squads: 2 ranks (+20% each). Heroes level up to 5 times on fewer kills (+12% each) and grow a little.
  const hero = a.slot === 'hero', T = hero ? HERO_LV : [10, 25], up = hero ? 1.12 : 1.2;
  while (a.rank < T.length && a.kills >= T[a.rank]) {
    a.rank++; a.mhp *= up;
    for (let i = 0; i < a.members.length; i++) if (a.members[i] > 0) a.members[i] *= up;
    S.events.push({ k: 'rank', x: a.x, z: a.z, hero, lv: a.rank });
  }
}
function hitSquad(t, dmg, area, attacker, cap = 5) {
  if (t.dead) return 0;
  if (t.sit) dmg *= 0.5;
  let killed = 0;
  if (area) {
    let k = 0;
    for (let i = 0; i < t.members.length && k < cap; i++) if (t.members[i] > 0) { k++; t.members[i] -= dmg; if (t.members[i] <= 0) { t.members[i] = 0; killed++; } }
  } else {
    let rem = dmg;
    for (let i = 0; i < t.members.length && rem > 0; i++) if (t.members[i] > 0) { const take = Math.min(t.members[i], rem); t.members[i] -= take; rem -= take; if (t.members[i] <= 0) { t.members[i] = 0; killed++; } }
  }
  if (killed) { credit(attacker, killed); pl(1 - t.owner).st.kills += killed; }
  if (aliveN(t) === 0) killSquad(t);
  return killed;
}
function killSquad(t) {
  t.dead = true;
  const i = S.squads.indexOf(t); if (i >= 0) S.squads.splice(i, 1);
  if (t.f === 'bw' && t.def.vehicle) { pl(t.owner).cash += Math.round(t.def.cost * 0.5); pl(t.owner).st.earned += Math.round(t.def.cost * 0.5); S.events.push({ k: 'scrap', x: t.x, z: t.z, owner: t.owner, slot: t.slot, h: t.heading }); }
}
function hitBld(b, d, by) {
  if (b.city) { // a storefront: floors come off from the top, the ground floor last; rubble stays and can be rebuilt
    if (b.hp <= 0) return;
    b.hp = Math.max(0, b.hp - d);
    const fl = floorsFor(b);
    while (b.fl > fl) {
      b.fl--; S.events.push({ k: 'chunk', ci: b.ci, x: b.x, z: b.z, fl: b.fl, floors: b.floors });
      if (S.down) { S.down.hot = { x: b.x, z: b.z, t: S.t }; if (by !== undefined && S.down.role[by] === 'w') { const p = pl(by); p.cash += 20; p.st.earned += 20; S.events.push({ k: 'deposit', x: b.x, z: b.z, owner: by }); } } // looting a floor pays the wreckers
    }
    if (b.hp <= 0) { b.dead = true; S.events.push({ k: 'boom', x: b.x, z: b.z, r: b.r * 0.6 }); }
    return;
  }
  if (b.dead) return;
  b.hp -= d;
  if (b.hp <= 0) {
    b.dead = true;
    const i = S.blds.indexOf(b); if (i >= 0) S.blds.splice(i, 1);
    markCircle(b.x, b.z, b.r, -1);
    pl(1 - b.owner).st.razed++;
    if (b.garrison) ejectTower(b);
    S.events.push({ k: 'boom', x: b.x, z: b.z, r: b.r });
    if (b.kind === 'hq' && !S.over) S.over = { winner: 1 - b.owner };
  }
}
function attack(s, t) {
  const ph = perHit(s, t), n = aliveN(s);
  let total;
  if (t.isBld) { total = ph * n; hitBld(t, total, s.owner); }
  else if (s.def.area) { total = ph * Math.min(5, aliveN(t)); hitSquad(t, ph, true, s); }
  else { total = ph * n; hitSquad(t, total, false, s); }
  if (!t.isBld && s.f === 'ac' && s.slot === 'ranged') t.debuff = 5;
  const p = pl(s.owner); p.meter = Math.min(100, p.meter + total / 15 * (fac(p).traits?.hype || 1));
  S.events.push({ k: s.def.range > 3 ? 'shot' : 'hit', id: s.id, x: s.x, z: s.z, tx: t.x, tz: t.z, area: !!s.def.area, f: s.f, slot: s.slot, to: t.owner, tb: t.isBld ? t.id : undefined });
}
function nearestEnemy(s, maxD) {
  let best = null, bd = maxD;
  for (const o of S.squads) { if (o.owner === s.owner || o.gar) continue; const d = dist(s, o) + (o.slot === 'worker' ? 2 : 0); if (d < bd) { bd = d; best = o; } }
  for (const b of S.blds) { if (b.owner === s.owner) continue; const d = dist(s, b) + 2; if (d < bd) { bd = d; best = b; } }
  return best;
}
function speedMult(s) {
  let m = 1;
  for (const z of S.zones) if ((z.kind === 'mud' || z.kind === 'cones') && z.owner !== s.owner && !s.def.flies && Math.hypot(z.x - s.x, z.z - s.z) < z.r) m *= z.kind === 'mud' ? 0.5 : 0.35; // Road Closed: enemies squeeze through the cones
  if (pl(s.owner).parade > 0 || pl(s.owner).party > 0) m *= 1.3;
  if (s.bull > 0) m *= 1.25;
  if (s.ot > 0) m *= 1.2;
  return m;
}
function stepToward(s, x, z, dt) {
  const dx = x - s.x, dz = z - s.z, d = Math.hypot(dx, dz);
  if (d < 0.05) return true;
  const st = Math.min(d, s.def.speed * 0.9 * speedMult(s) * dt);
  s.x += (dx / d) * st; s.z += (dz / d) * st; s.heading = Math.atan2(dx, dz);
  return d <= st + 0.01;
}
function moveTo(s, x, z, dt) {
  if (s.def.flies) return stepToward(s, x, z, dt);
  s.pathT -= dt;
  if (!s.path || s.path.dest[0] !== x || s.path.dest[1] !== z || (s.pathT <= 0 && s.path.pts.length > 1)) { s.path = { dest: [x, z], pts: findPath(s.x, s.z, x, z), i: 0 }; s.pathT = 1.5; }
  const pts = s.path.pts;
  if (s.path.i >= pts.length) return true;
  const [wx, wz] = pts[s.path.i];
  if (stepToward(s, wx, wz, dt) || Math.hypot(wx - s.x, wz - s.z) < 0.5) { s.path.i++; if (s.path.i >= pts.length) return true; }
  return false;
}
function chase(s, t, dt) {
  if (s.def.flies || lineClear(s.x, s.z, t.x, t.z)) { stepToward(s, t.x, t.z, dt); s.path = null; return; }
  s.pathT -= dt;
  if (!s.path || s.path.tid !== t.id || s.pathT <= 0) { s.path = { tid: t.id, dest: [t.x, t.z], pts: findPath(s.x, s.z, t.x, t.z), i: 0 }; s.pathT = 1; }
  const pts = s.path.pts;
  if (s.path.i < pts.length) { const [wx, wz] = pts[s.path.i]; if (stepToward(s, wx, wz, dt) || Math.hypot(wx - s.x, wz - s.z) < 0.5) s.path.i++; }
}
function heroAbility(s) {
  if (s.abil > 0) return;
  if (s.f === 'bw') {
    const near = S.squads.filter((o) => o.owner !== s.owner && Math.hypot(o.x - s.x, o.z - s.z) < 5 + o.r);
    if (near.length) { near.forEach((o) => (o.stun = Math.max(o.stun, 2))); s.abil = 20; S.events.push({ k: 'screech', x: s.x, z: s.z }); }
  } else if (s.f === 'hh') {
    // The Foreman's Overtime whistle: when there's work nearby (a building going up or training) or a fight,
    // squads within 9 m move 20% faster and buildings within 12 m build/train twice as fast, for 10 s.
    const blds = S.blds.filter((b) => b.owner === s.owner && Math.hypot(b.x - s.x, b.z - s.z) < 12 + b.r);
    if (nearestEnemy(s, 6) || blds.some((b) => b.built < 1 || b.queue.length)) {
      S.squads.forEach((o) => { if (o.owner === s.owner && Math.hypot(o.x - s.x, o.z - s.z) < 9) o.ot = 10; });
      blds.forEach((b) => (b.ot = 10));
      s.abil = 22; S.events.push({ k: 'overtime', x: s.x, z: s.z });
    }
  } else if (s.f === 'om') {
    // The Tycoon's Hush Money: the nearest enemy squad within 6 m (not a hero) pockets a briefcase and stands down 3 s.
    let t = null, bd = 6;
    for (const o of S.squads) { if (o.owner === s.owner || o.slot === 'hero' || o.slot === 'worker' || o.gar) continue; const d = Math.hypot(o.x - s.x, o.z - s.z) - o.r; if (d < bd) { bd = d; t = o; } }
    if (t) { t.stun = Math.max(t.stun, 3); s.abil = 14; S.events.push({ k: 'hush', x: s.x, z: s.z, tx: t.x, tz: t.z }); }
  } else if (s.f === 'nd') {
    // The Streamer goes live: every enemy within 6 m stops to stare at the phone for 2 s.
    const near = S.squads.filter((o) => o.owner !== s.owner && !o.def.vehicle && Math.hypot(o.x - s.x, o.z - s.z) < 6 + o.r);
    if (near.length) { near.forEach((o) => (o.stun = Math.max(o.stun, 2))); s.abil = 16; S.events.push({ k: 'golive', x: s.x, z: s.z, ids: near.map((o) => o.id) }); }
  } else if (s.f === 'sc') {
    // The DJ drops the beat: in a fight, squads within 9 m get +20% speed for 8 s and everyone in range hops to it.
    if (nearestEnemy(s, 6)) {
      S.squads.forEach((o) => { if (o.owner === s.owner && Math.hypot(o.x - s.x, o.z - s.z) < 9) { o.ot = 8; o.beatAt = S.t; } });
      s.abil = 18; S.events.push({ k: 'dropbeat', x: s.x, z: s.z });
    }
  } else if (nearestEnemy(s, 4)) {
    S.squads.forEach((o) => { if (o.owner === s.owner && Math.hypot(o.x - s.x, o.z - s.z) < 8) o.bull = 10; });
    s.abil = 25; S.events.push({ k: 'bullhorn', x: s.x, z: s.z });
  }
}
function nearestNode(x, z) { let best = null, bd = 1e9; for (const n of S.nodes) { if (n.amount <= 0) continue; const d = Math.hypot(n.x - x, n.z - z); if (d < bd) { bd = d; best = n; } } return best; }
function nearestDepot(s) { let best = null, bd = 1e9; for (const b of S.blds) { if (b.owner !== s.owner || b.built < 1 || (b.kind !== 'hq' && b.kind !== 'depot')) continue; const d = Math.hypot(b.x - s.x, b.z - s.z); if (d < bd) { bd = d; best = b; } } return best; }
function updateWorker(s, dt) {
  const o = s.order;
  if (o.type === 'move') { if (moveTo(s, o.x, o.z, dt)) { setOrder(s, { type: 'idle' }); s.task = { state: 'find' }; } return; }
  // Repair: walk to the building, then patch it up at 25 hp/s per worker for 1 cash per 10 hp; back to work when done.
  if (o.type === 'repair') {
    const b = o.b, p = pl(s.owner);
    if ((b.dead && !b.city) || b.hp >= b.maxHp || p.cash < 1) { setOrder(s, { type: 'idle' }); s.task = { state: 'find' }; return; }
    if (Math.hypot(b.x - s.x, b.z - s.z) > b.r + 2.2) { moveTo(s, b.x, b.z, dt); return; }
    s.heading = Math.atan2(b.x - s.x, b.z - s.z);
    const hp = Math.min(b.maxHp - b.hp, 25 * dt);
    b.hp += hp; p.cash -= hp / 10;
    if (b.city) { // a storefront goes back up a whole floor at a time, once that floor's hp is fully paid for
      b.dead = false;
      const fl = Math.floor(b.hp / FLOOR_HP + 1e-6);
      while (b.fl < Math.min(b.floors, fl)) { S.events.push({ k: 'chunkfix', ci: b.ci, x: b.x, z: b.z, fl: b.fl, floors: b.floors }); b.fl++; }
    }
    s.gatherT = 1; // reads as "working" to the renderer (swing animation)
    s.repT = (s.repT || 0) - dt;
    if (s.repT <= 0) { s.repT = 0.5; S.events.push({ k: 'repair', x: s.x + (b.x - s.x) * 0.6, z: s.z + (b.z - s.z) * 0.6 }); }
    return;
  }
  if (!s.task) s.task = { state: 'find' };
  const t = s.task;
  if (t.state === 'find') {
    const n = o.type === 'gather' && o.node && o.node.amount > 0 ? o.node : nearestNode(s.x, s.z);
    if (!n) return;
    t.node = n; t.state = s.carry > 0 ? 'return' : 'toNode';
  }
  if (t.state === 'toNode') {
    const n = t.node;
    if (!n || n.amount <= 0) { t.state = 'find'; return; }
    if (Math.hypot(n.x - s.x, n.z - s.z) < 2.8) { t.state = 'gather'; s.gatherT = GATHER_T; s.heading = Math.atan2(n.x - s.x, n.z - s.z); }
    else moveTo(s, n.x, n.z, dt);
    return;
  }
  if (t.state === 'gather') {
    const n = t.node;
    if (n.amount <= 0) { t.state = 'find'; return; }
    s.gatherT -= dt;
    if (s.gatherT <= 0) { const take = Math.min(CARRY, n.amount); n.amount -= take; s.carry = take; t.state = 'return'; S.events.push({ k: 'gather', x: n.x, z: n.z }); }
    return;
  }
  if (t.state === 'return') {
    const d = nearestDepot(s);
    if (!d) return;
    if (Math.hypot(d.x - s.x, d.z - s.z) < d.r + 1.8) { const got = Math.round(s.carry * pl(s.owner).inc); pl(s.owner).cash += got; pl(s.owner).st.earned += got; S.events.push({ k: 'deposit', x: d.x, z: d.z, owner: s.owner }); s.carry = 0; t.state = t.node && t.node.amount > 0 ? 'toNode' : 'find'; }
    else moveTo(s, d.x, d.z, dt);
  }
}
/** Garrison: a squad inside a tower is hidden and untouchable; the tower gets +4 range and +50% damage. */
function ejectTower(b) {
  const q = S.squads.find((s) => s.id === b.garrison); b.garrison = null;
  if (!q) return;
  const [x, z] = nearestFree(b.x, b.z - pl(b.owner).side * (b.r + 2)); q.x = q.px = x; q.z = q.pz = z; q.gar = null;
  setOrder(q, { type: 'idle' }); q.post = { x, z };
  S.events.push({ k: 'eject', x, z });
}
function updateSquad(s, dt) {
  if (s.gar) return;
  if (s.order.type === 'enter') {
    const b = s.order.tower;
    if (b.dead || b.garrison !== s.id) { setOrder(s, { type: 'idle' }); return; }
    if (Math.hypot(b.x - s.x, b.z - s.z) < b.r + 2.2) { s.gar = b.id; s.path = null; S.events.push({ k: 'enter', x: b.x, z: b.z }); return; }
    moveTo(s, b.x, b.z - pl(s.owner).side * (b.r + 1.5), dt); return;
  }
  if (s.cd > 0) s.cd -= dt;
  // Patch-up at home: a squad standing by its own HQ or depot with no enemy close heals 4%/s (both sides).
  if (s.slot !== 'worker') {
    const home = S.blds.find((b) => b.owner === s.owner && b.built >= 1 && (b.kind === 'hq' || b.kind === 'depot') && Math.hypot(b.x - s.x, b.z - s.z) < b.r + 9);
    let hurt = false; for (const h of s.members) if (h > 0 && h < s.mhp) hurt = true;
    if (home && hurt && !nearestEnemy(s, 12)) {
      for (let i = 0; i < s.members.length; i++) if (s.members[i] > 0) s.members[i] = Math.min(s.mhp, s.members[i] + s.mhp * 0.04 * dt);
      s.healT = (s.healT || 0) - dt;
      if (s.healT <= 0) { s.healT = 1.2; S.events.push({ k: 'heal', x: s.x, z: s.z }); }
    }
  }
  if (s.debuff > 0) s.debuff -= dt;
  if (s.bull > 0) s.bull -= dt;
  if (s.ot > 0) s.ot -= dt;
  if (s.patch > 0) s.patch -= dt;
  if (s.abil > 0) s.abil -= dt;
  if (s.stun > 0) { s.stun -= dt; return; }
  if (s.slot === 'worker') { updateWorker(s, dt); return; }
  if (s.slot === 'hero') heroAbility(s);
  if (s.sit) return;
  const o = s.order;
  let t = null;
  if (o.type === 'move') { if (moveTo(s, o.x, o.z, dt)) { setOrder(s, { type: 'idle' }); s.post = { x: s.x, z: s.z }; } return; }
  if (o.type === 'attack') { if (o.target && !o.target.dead) t = o.target; else { setOrder(s, { type: 'idle' }); s.post = { x: s.x, z: s.z }; } }
  // Walking home after a leash break: only fight back at point-blank, never get pulled out again.
  if (o.type === 'return') {
    t = nearestEnemy(s, s.def.range + 0.5);
    if (!t) { if (moveTo(s, s.post.x, s.post.z, dt)) setOrder(s, { type: 'idle' }); return; }
  }
  // Idle squads guard their post: they pick fights that come within AGGRO, but break off past LEASH and go back.
  // Hold ground: an idle squad on hold only fights what is already in its weapon range and never steps off its spot.
  if (!t && s.hold && o.type === 'idle') {
    t = nearestEnemy(s, s.def.range + 0.3);
    if (t) { s.heading = Math.atan2(t.x - s.x, t.z - s.z); if (s.cd <= 0) { s.cd = 1; attack(s, t); } }
    return;
  }
  if (!t) {
    t = nearestEnemy(s, Math.max(s.def.range + 4, AGGRO));
    const away = Math.hypot(s.x - s.post.x, s.z - s.post.z);
    if (o.type === 'idle' && (t ? away > LEASH && dist(s, t) > s.def.range : away > 3)) { setOrder(s, { type: 'return' }); return; }
  }
  if (!t) { if (o.type === 'amove' && moveTo(s, o.x, o.z, dt)) { setOrder(s, { type: 'idle' }); s.post = { x: s.x, z: s.z }; } return; }
  if (dist(s, t) > s.def.range) chase(s, t, dt);
  else { s.heading = Math.atan2(t.x - s.x, t.z - s.z); if (s.cd <= 0) { s.cd = 1; attack(s, t); } }
}
function separate() {
  const a = S.squads;
  for (let i = 0; i < a.length; i++) {
    const p = a[i]; if (p.def.flies || p.gar) continue;
    for (let j = i + 1; j < a.length; j++) {
      const q = a[j]; if (q.def.flies || q.gar) continue;
      let dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz);
      const min = p.r + q.r;
      if (d < min) {
        if (d < 0.001) { dx = S.rng() - 0.5; dz = S.rng() - 0.5; d = Math.hypot(dx, dz); }
        const push = (min - d) * 0.6, nx = dx / d, nz = dz / d;
        const wp = p.sit ? 0 : q.sit ? 1 : 0.5, wq = q.sit ? 0 : p.sit ? 1 : 0.5;
        p.x -= nx * push * wp; p.z -= nz * push * wp; q.x += nx * push * wq; q.z += nz * push * wq;
      }
    }
    for (const b of S.blds) { const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz), min = p.r + b.r; if (d < min && d > 0.001) { p.x = b.x + (dx / d) * min; p.z = b.z + (dz / d) * min; } }
    if (isBlocked(p.x, p.z)) { const [fx, fz] = nearestFree(p.x, p.z); p.x += (fx - p.x) * 0.3; p.z += (fz - p.z) * 0.3; }
  }
  for (const s of a) { s.x = Math.max(-58, Math.min(58, s.x)); s.z = Math.max(-98, Math.min(98, s.z)); }
}
function resolvePending(pd) {
  if (pd.kind === 'fireworks') {
    for (const o of [...S.squads]) if (o.owner !== pd.owner && Math.hypot(o.x - pd.x, o.z - pd.z) < pd.r + o.r) hitSquad(o, 60, true, null, 99);
    for (const b of [...S.blds]) if (b.owner !== pd.owner && Math.hypot(b.x - pd.x, b.z - pd.z) < pd.r + b.r) hitBld(b, 300);
    S.events.push({ k: 'fwboom', x: pd.x, z: pd.z, r: pd.r });
  } else if (pd.kind === 'jet') {
    const [x, z] = nearestFree(pd.x, pd.z), q = spawnSquad(pl(pd.owner), 'melee', x, z);
    q.post = { x, z }; S.events.push({ k: 'jetdrop', x, z });
  } else if (pd.kind === 'mixtape') { // the bass drops: everyone caught in it is knocked flat for a moment
    for (const o of [...S.squads]) if (o.owner !== pd.owner && Math.hypot(o.x - pd.x, o.z - pd.z) < pd.r + o.r) { hitSquad(o, 20, true, null, 99); o.stun = Math.max(o.stun, 2.5); }
    S.events.push({ k: 'mixboom', x: pd.x, z: pd.z, r: pd.r });
  } else if (pd.kind === 'wreck') {
    for (const o of [...S.squads]) if (o.owner !== pd.owner && Math.hypot(o.x - pd.x, o.z - pd.z) < pd.r + o.r) { hitSquad(o, 80, true, null, 99); o.stun = Math.max(o.stun, 1.5); }
    for (const b of [...S.blds]) if (b.owner !== pd.owner && Math.hypot(b.x - pd.x, b.z - pd.z) < pd.r + b.r) hitBld(b, 450);
    S.events.push({ k: 'wreckboom', x: pd.x, z: pd.z, r: pd.r });
  }
}
function stepDown(dt) {
  const D = S.down;
  D.meter = S.city.reduce((a, b) => a + b.fl, 0) / D.total;
  const wi = D.role.indexOf('w'), bi = D.role.indexOf('b');
  // City taxes: every 10 s the builders collect more the more of the city is standing.
  D.taxT = (D.taxT || 0) + dt;
  if (D.taxT >= 10) { D.taxT -= 10; const p = pl(bi), inc = Math.round(40 * D.meter); p.cash += inc; p.st.earned += inc; S.events.push({ k: 'income', owner: bi }); }
  if (D.meter <= D.lose) S.over = { winner: wi, down: true };
  else if (D.meter >= D.win) S.over = { winner: bi, down: true };
  else if (S.t >= D.limit) S.over = { winner: D.meter >= D.hold ? bi : wi, down: true };
}
function stepCap(dt) {
  const c = S.cap;
  for (const f of c.pts) {
    const on = [false, false];
    for (const s of S.squads) if (s.slot !== 'worker' && !s.gar && aliveN(s) > 0 && Math.hypot(s.x - f.x, s.z - f.z) < f.r) on[s.owner] = true;
    if (on[0] !== on[1]) {
      const dir = on[0] ? 1 : -1, before = f.owner;
      f.prog = Math.max(-1, Math.min(1, f.prog + (dir * dt) / 6));
      if (f.prog >= 1) f.owner = 0; else if (f.prog <= -1) f.owner = 1; else if (Math.sign(f.prog) !== dir) f.owner = -1;
      if (f.owner !== before) S.events.push({ k: 'hill', owner: f.owner, x: f.x, z: f.z });
    }
    f.contested = on[0] && on[1];
  }
  c.t += dt;
  if (c.t >= 1) {
    c.t -= 1;
    const n0 = c.pts.filter((f) => f.owner === 0).length, n1 = c.pts.filter((f) => f.owner === 1).length;
    if (n0 > n1) c.score[1] -= n0 - n1; else if (n1 > n0) c.score[0] -= n1 - n0;
    if (c.score[0] <= 0) S.over = { winner: 1, cap: true }; else if (c.score[1] <= 0) S.over = { winner: 0, cap: true };
  }
}
function stepHill(dt) {
  const h = S.hill, on = [false, false];
  for (const s of S.squads) if (s.slot !== 'worker' && !s.gar && aliveN(s) > 0 && Math.hypot(s.x - h.x, s.z - h.z) < h.r) on[s.owner] = true;
  const holder = on[0] && on[1] ? -1 : on[0] ? 0 : on[1] ? 1 : -1;
  h.contested = on[0] && on[1];
  if (holder !== h.holder) { h.holder = holder; S.events.push({ k: 'hill', owner: holder, x: h.x, z: h.z }); }
  if (holder >= 0) {
    h.prog[holder] = Math.min(1, h.prog[holder] + dt / h.win);
    if (h.prog[holder] >= 1) S.over = { winner: holder, hill: true };
  }
}
export const rallyPoint = (p) => [p.hqx, p.hqz - p.side * 20];

export function step() {
  const dt = TICK;
  S.t += dt;
  for (const c of S.cmds) applyCmd(c);
  S.cmds.length = 0;
  for (const s of S.squads) { s.px = s.x; s.pz = s.z; }
  for (const p of S.players) {
    p.incomeT += dt;
    if (p.incomeT >= 10) { p.incomeT -= 10; { const inc = Math.round((BASE_INCOME + DEPOT_INCOME * builtCount(p, 'depot')) * p.inc); p.cash += inc; p.st.earned += inc; } S.events.push({ k: 'income', owner: p.i }); }
    if (p.parade > 0) p.parade -= dt;
    if (p.party > 0) p.party -= dt;
  }
  if (S.hill && !S.over) stepHill(dt);
  if (S.cap && !S.over) stepCap(dt);
  if (S.duel && !S.over) for (const p of S.players) if (!S.squads.some((q) => q.owner === p.i && q.slot === 'hero' && aliveN(q) > 0)) { S.over = { winner: 1 - p.i, duel: true }; break; }
  if (S.down && !S.over) stepDown(dt);
  if (S.race && !S.over) for (const p of S.players) if (p.st.earned >= S.race.goal) { S.over = { winner: p.i, race: true }; break; }
  for (const b of [...S.blds]) {
    if (b.dead) continue;
    const p = pl(b.owner);
    if (b.ot > 0) b.ot -= dt;
    if (b.jam > 0) b.jam -= dt;
    // Hard Hats trait: finished buildings slowly patch themselves when no enemy is near.
    const sr = fac(p).traits && fac(p).traits.selfRepair;
    if (sr && b.built >= 1 && b.hp < b.maxHp && !S.squads.some((q) => q.owner !== b.owner && Math.hypot(q.x - b.x, q.z - b.z) < 14)) {
      b.hp = Math.min(b.maxHp, b.hp + sr * dt); b.srT = (b.srT || 0) - dt;
      if (b.srT <= 0) { b.srT = 1; S.events.push({ k: 'repair', x: b.x + (S.rng() - 0.5) * b.r, z: b.z + (S.rng() - 0.5) * b.r }); }
    }
    if (b.built < 1) {
      const bt = BLD[b.kind].build / ((fac(p).traits && fac(p).traits.buildMul) || 1);
      if (b.ot > 0) b.built = Math.min(1, b.built + dt / bt); // Overtime: a second dose of progress
      b.built = Math.min(1, b.built + dt / bt); b.hp = Math.min(b.maxHp, b.hp + (b.maxHp * 0.9 * dt) / bt);
      if (b.built >= 1) { S.events.push({ k: 'done', x: b.x, z: b.z }); pl(b.owner).st.built++; }
      continue;
    }
    if (b.up > 0) { b.up -= dt; if (b.up <= 0) { b.up = 0; b.level++; S.events.push({ k: 'levelup', x: b.x, z: b.z }); } continue; }
    if (b.queue.length) {
      const def = fac(p).units[b.queue[0]];
      b.prodT += dt * (b.ot > 0 ? 2 : 1);
      if (b.prodT >= def.build) {
        b.prodT = 0;
        const slot = b.queue.shift();
        const [sx, sz] = nearestFree(b.x + (S.rng() - 0.5) * 2, b.z - p.side * (b.r + 1.4));
        const s = spawnSquad(p, slot, sx, sz);
        if (slot === 'worker') s.task = { state: 'find' };
        else {
          // A building's own rally flag wins (tight cluster round it); otherwise the default muster in front of the HQ.
          const rp = b.rally, [rx, rz] = rp ? [rp.x, rp.z] : rallyPoint(p), jx = rp ? 3 : 12, jz = rp ? 3 : 6;
          const [fx, fz] = nearestFree(rx + (S.rng() - 0.5) * jx, rz + (S.rng() - 0.5) * jz); setOrder(s, { type: 'move', x: fx, z: fz });
        }
        S.events.push({ k: slot === 'hero' ? 'heroin' : 'spawn', x: sx, z: sz, f: p.f, owner: p.i });
      }
    }
    if (b.kind === 'hq' || b.kind === 'tower') {
      b.cd -= dt;
      if (b.cd <= 0 && !(b.jam > 0)) {
        const tm = b.kind === 'tower' ? (fac(p).traits?.towerMul || 1) : 1; // Nerds: souped-up towers
        const gar = b.kind === 'tower' && b.garrison, rng = b.kind === 'hq' ? 10 : (BLD.tower.range + (gar ? 4 : 0)) * tm, dmg = b.kind === 'hq' ? 15 : BLD.tower.dmg * (gar ? 1.5 : 1) * tm;
        let t = null, bd = rng;
        for (const o of S.squads) { if (o.owner === b.owner || o.gar) continue; const d = dist(b, o); if (d < bd) { bd = d; t = o; } }
        if (t) { b.cd = 1; S.events.push({ k: 'shot', x: b.x, z: b.z, tx: t.x, tz: t.z, y0: b.kind === 'hq' ? 4 : 5, f: b.f, slot: 'hq', bk: b.kind, to: t.owner }); hitSquad(t, dmg, false, null); }
      }
    }
  }
  for (const z of S.zones) z.t -= dt;
  S.zones = S.zones.filter((z) => z.t > 0);
  for (const pd of S.pending) { pd.t -= dt; if (pd.t <= 0) resolvePending(pd); }
  S.pending = S.pending.filter((p) => p.t > 0);
  for (const s of S.squads) {
    if (s.f !== 'ac' || s.slot === 'worker') { s.rally = 0; continue; }
    let c = 0;
    for (const o of S.squads) if (o !== s && o.owner === s.owner && o.slot !== 'worker' && Math.hypot(o.x - s.x, o.z - s.z) < 8) c++;
    s.rally = Math.min(0.2, c * 0.05); // balance B67: cap 25% -> 20%
  }
  for (const s of [...S.squads]) if (!s.dead) updateSquad(s, dt);
  separate();
  aiStep(S, dt);
}

// Computer opponent. Runs inside the sim tick, uses only S.rng.
import { BLD, UPG, COUNTER, REQ, TRAIN_SLOTS } from '../config/factions.js?v=3';
import { A, Q, pl, fac, count, barracksOf, hqOf, workersOf, setOrder } from './sim.js?v=3';

function aiSpot(S, p, kind, cx, cz, r0 = 7, r1 = 19) {
  for (let i = 0; i < 30; i++) {
    const a = S.rng() * Math.PI * 2, r = r0 + S.rng() * (r1 - r0);
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (Q.canPlace(p, kind, x, z)) return [x, z];
  }
  return null;
}
function aiPick(S, p, e, bar) {
  const slots = TRAIN_SLOTS.filter((sl) => bar.level >= REQ[sl]);
  const cnt = {};
  for (const s of S.squads) if (s.owner === e.i && COUNTER[s.slot]) cnt[s.slot] = (cnt[s.slot] || 0) + 1;
  let common = null, mx = 0;
  for (const k in cnt) if (cnt[k] > mx) { mx = cnt[k]; common = k; }
  let choice = null;
  if (common && S.rng() < 0.6) { const c = Object.keys(COUNTER).find((x) => COUNTER[x] === common); if (c && slots.includes(c)) choice = c; }
  if (!choice) choice = slots[Math.floor(S.rng() * slots.length)];
  if (choice === 'siege' && S.rng() < 0.5) choice = 'melee';
  return Q.canTrain(p, bar, choice) ? null : choice;
}
function aiPower(S, p, i, pw) {
  const mine = S.squads.filter((s) => s.owner === p.i && s.slot !== 'worker'), foes = S.squads.filter((s) => s.owner !== p.i && s.slot !== 'worker');
  if (pw.id === 'pie') { const h = foes.find((s) => s.slot === 'hero'); if (h && mine.some((m) => Math.hypot(m.x - h.x, m.z - h.z) < 15)) A.power(p, i); return; }
  if (pw.id === 'parade') { if (mine.length >= 3 && mine.some((m) => m.order.type !== 'idle')) A.power(p, i); return; }
  let best = null, bc = 1;
  for (const f of foes) {
    if (!mine.some((m) => Math.hypot(m.x - f.x, m.z - f.z) < 16) && Math.hypot(f.x - p.hqx, f.z - p.hqz) > 30) continue;
    let c = 0;
    for (const g of foes) if (Math.hypot(g.x - f.x, g.z - f.z) < 7) c++;
    if (c > bc) { bc = c; best = f; }
  }
  if (best) A.power(p, i, best.x, best.z);
}

export function aiStep(S, dt) {
  const ai = S.ai;
  ai.t += dt;
  if (ai.t < 1) return;
  ai.t = 0;
  const p = pl(1), e = pl(0), F = fac(p), bar = barracksOf(p), hq = hqOf(p);
  if (!hq) return;
  const nDep = count(p, 'depot'), nBar = count(p, 'barracks'), nW = workersOf(p).length;
  if (nW < 6 && !hq.queue.includes('worker') && p.cash >= F.units.worker.cost + (nBar ? 0 : 200)) A.train(p, hq, 'worker');
  let spot;
  if (!nBar && p.cash >= BLD.barracks.cost && (spot = aiSpot(S, p, 'barracks', hq.x, hq.z))) A.build(p, 'barracks', spot[0], spot[1]);
  else if (nDep < 3 && p.cash >= BLD.depot.cost && nBar && (spot = aiSpot(S, p, 'depot', hq.x, hq.z))) A.build(p, 'depot', spot[0], spot[1]);
  else if (S.t > 120 && count(p, 'tower') < 3 && p.cash >= BLD.tower.cost + 200) {
    // guard the base openings (they sit at x=0 and x=+36 on this side)
    const gx = count(p, 'tower') % 2 ? 36 : 0;
    spot = aiSpot(S, p, 'tower', gx, p.hqz - p.side * 22, 0, 6);
    if (spot) A.build(p, 'tower', spot[0], spot[1]);
  }
  if (bar) {
    if (bar.level === 1 && S.t > 90 && p.cash >= UPG[1] + 100) A.upgrade(p, bar);
    else if (bar.level === 2 && S.t > 220 && p.cash >= UPG[2] + 100) A.upgrade(p, bar);
    if (bar.queue.length < 2) { const sl = aiPick(S, p, e, bar); if (sl) A.train(p, bar, sl); }
  }
  if (S.t > 160 && p.cash >= F.units.hero.cost + 150) A.train(p, hq, 'hero');
  F.powers.forEach((pw, i) => { if (p.meter >= pw.cost) aiPower(S, p, i, pw); });
  const mine = S.squads.filter((s) => s.owner === 1 && s.slot !== 'worker');
  const threat = S.squads.find((s) => s.owner === 0 && s.slot !== 'worker' && Math.hypot(s.x - p.hqx, s.z - p.hqz) < 36);
  if (threat) { mine.forEach((s) => { if (s.order.type !== 'attack') setOrder(s, { type: 'attack', target: threat }); }); return; }
  const armyCp = mine.reduce((a, s) => a + s.def.cp, 0);
  if (armyCp >= ai.wave) {
    ai.wave = Math.min(45, ai.wave + 8);
    mine.forEach((s) => setOrder(s, { type: 'amove', x: e.hqx + (S.rng() - 0.5) * 8, z: e.hqz - e.side * 6 }));
  }
}

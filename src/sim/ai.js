// Computer opponent. Runs inside the sim tick, uses only S.rng.
import { BLD, UPG, COUNTER, REQ, TRAIN_SLOTS } from '../config/factions.js?v=141';
import { A, Q, pl, fac, count, barracksOf, hqOf, workersOf, setOrder, aliveN, command } from './sim.js?v=141';

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
  if (pw.id === 'parade' || pw.id === 'blockparty' || pw.id === 'patch') { if (mine.length >= 3 && mine.some((m) => m.order.type !== 'idle')) A.power(p, i); return; }
  let best = null, bc = 1;
  for (const f of foes) {
    if (!mine.some((m) => Math.hypot(m.x - f.x, m.z - f.z) < 16) && Math.hypot(f.x - p.hqx, f.z - p.hqz) > 30) continue;
    let c = 0;
    for (const g of foes) if (Math.hypot(g.x - f.x, g.z - f.z) < 7) c++;
    if (c > bc) { bc = c; best = f; }
  }
  if (best) A.power(p, i, best.x, best.z);
}

// pi = which player this brain drives (the game runs it for player 1; balance tests also run it for player 0).
export function aiStep(S, dt, pi = 1) {
  const ai = pi === 1 ? S.ai : (S.ai0 = S.ai0 || { t: 0, wave: 20, waveMax: 45 });
  ai.t += dt;
  if (ai.t < 1) return;
  ai.t = 0;
  const p = pl(pi), e = pl(1 - pi), F = fac(p), bar = barracksOf(p), hq = hqOf(p);
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
  // Expand: once the base runs, send a third of the workers to the richest contested truck on our half,
  // and park an escort squad on it.
  const workers = workersOf(p);
  if (S.t > 70 && workers.length >= 4) {
    const half = S.nodes.filter((n) => n.amount > 300 && Math.sign(n.z) === p.side && Math.abs(n.z) < 50);
    half.sort((a, b) => b.amount - a.amount);
    const tgt = half[0];
    if (tgt) {
      const want = Math.ceil(workers.length / 3), on = workers.filter((w) => w.task && w.task.node === tgt);
      for (const w of workers) { if (on.length >= want) break; if (w.task && w.task.node !== tgt && !w.carry) { setOrder(w, { type: 'gather', node: tgt }); w.task = { state: 'find' }; on.push(w); } }
      if (!ai.escort || ai.escort.dead) {
        const free = S.squads.find((s) => s.owner === pi && s.slot !== 'worker' && s.slot !== 'hero' && s.order.type === 'idle');
        if (free) { ai.escort = free; free.escortFor = tgt; setOrder(free, { type: 'move', x: tgt.x + 3, z: tgt.z - p.side * 3 }); }
      }
    }
  }
  // Retreat: a squad down to under a third of its health (and not a lone vehicle) walks home to patch up.
  for (const s of S.squads) {
    if (s.owner !== pi || s.slot === 'worker') continue;
    let hp = 0; for (const h of s.members) hp += h;
    const k = hp / (Math.max(1, aliveN(s)) * s.mhp); // survivors' health: the fallen cannot be patched up
    if (!s.retreat && k < 0.33 && Math.hypot(s.x - p.hqx, s.z - p.hqz) > 20) { s.retreat = true; setOrder(s, { type: 'move', x: p.hqx + (S.rng() - 0.5) * 10, z: p.hqz - p.side * 10 }); }
    else if (s.retreat && k > 0.9) s.retreat = false;
  }
  // Garrison: when enemies come within 24 m of one of our empty towers, the nearest ranged squad (else any infantry) within 45 m climbs in.
  for (const b of S.blds) {
    if (b.owner !== pi || b.kind !== 'tower' || b.built < 1 || b.garrison) continue;
    if (!S.squads.some((o) => o.owner !== pi && o.slot !== 'worker' && Math.hypot(o.x - b.x, o.z - b.z) < 24)) continue;
    let q = null, bd = 45;
    for (const o of S.squads) { if (o.owner !== pi || !(o.slot === 'ranged' || o.slot === 'pike' || o.slot === 'melee') || o.gar || o.retreat || o === ai.escort || o.order.type === 'enter') continue; const d = Math.hypot(o.x - b.x, o.z - b.z) - (o.slot === 'ranged' ? 15 : 0); if (d < bd) { bd = d; q = o; } }
    if (q) { setOrder(q, { type: 'enter', tower: b }); b.garrison = q.id; }
  }
  const mine = S.squads.filter((s) => s.owner === pi && s.slot !== 'worker' && !s.retreat && s !== ai.escort && !s.gar && s.order.type !== 'enter');
  const threat = S.squads.find((s) => s.owner === 1 - pi && s.slot !== 'worker' && Math.hypot(s.x - p.hqx, s.z - p.hqz) < 36);
  if (threat) { mine.forEach((s) => { if (s.order.type !== 'attack') setOrder(s, { type: 'attack', target: threat }); }); return; }
  const armyCp = mine.reduce((a, s) => a + s.def.cp, 0);
  // King of the Hill: the army's job is the hill - go take it (or retake it) as soon as there is a squad or two to send,
  // and keep it there; full waves still go for the HQ.
  if (S.down) { // Downtown
    const role = S.down.role[pi];
    // Both sides recruit the nearest drifter when they have the cash to spare.
    if (S.drift && S.drift.length && p.cash > (role === 'b' ? 160 : 110)) {
      const d = S.drift.slice().sort((a, b) => Math.hypot(a.x - p.hqx, a.z - p.hqz) - Math.hypot(b.x - p.hqx, b.z - p.hqz))[0];
      command(pi, { type: 'recruit', id: d.id });
    }
    if (role === 'b') {
      // two workers keep patching the most-wrecked storefront nearest home; the army guards wherever the city was last hit
      // jobs in order: rebuild missing floors first, then scrub tags, then open shops - nearest to home within each
      const safe = (b) => !S.squads.some((o) => o.owner !== pi && o.slot !== 'worker' && Math.hypot(o.x - b.x, o.z - b.z) < 12); // no point scrubbing under fire
      const near = (a, b) => Math.hypot(a.x - p.hqx, a.z - p.hqz) - Math.hypot(b.x - p.hqx, b.z - p.hqz);
      const hurt = S.city.filter((b) => b.hp < b.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp + near(a, b) / 200)[0]
        || S.city.filter((b) => b.tag && safe(b)).sort(near)[0] || S.city.filter((b) => !b.shop && safe(b)).sort(near)[0];
      if (hurt && p.cash > 60) workersOf(p).filter((w) => w.order.type === 'repair').length < 3 && workersOf(p).filter((w) => w.order.type !== 'repair' && !w.carry).slice(0, 1).forEach((w) => setOrder(w, { type: 'repair', b: hurt }));
      const hot = S.down.hot;
      if (hot && S.t - hot.t < 20) mine.forEach((s) => { if (s.order.type === 'idle' && Math.hypot(s.x - hot.x, s.z - hot.z) > 10) setOrder(s, { type: 'amove', x: hot.x + (S.rng() - 0.5) * 6, z: hot.z + (S.rng() - 0.5) * 6 }); });
    } else {
      // wreckers: every idle fighter goes to smash the nearest storefront still standing
      for (const s of mine) {
        if (s.order.type !== 'idle' && !(s.order.type === 'move' && !s.escortFor)) continue;
        let best = null, bd = 1e9;
        for (const b of S.city) { if (b.hp <= 0) continue; const d = Math.hypot(b.x - s.x, b.z - s.z) - (b.shop ? 25 : 0); if (d < bd) { bd = d; best = b; } } // shops first: there is loot in them
        if (best) setOrder(s, { type: 'attack', target: best });
      }
    }
    return;
  }
  if (S.duel) { // Hero vs Hero: the hero hunts the other hero (and goes home to heal when hurt - the retreat rule above)
    const me = mine.find((s) => s.slot === 'hero'), them = S.squads.find((s) => s.owner !== pi && s.slot === 'hero');
    if (me && them && me.order.type !== 'attack') setOrder(me, { type: 'attack', target: them });
    return;
  }
  if (S.cap && armyCp >= 8 && armyCp < ai.wave) { // Capture and Hold: go for the nearest flag that isn't ours
    const f = S.cap.pts.filter((q) => q.owner !== pi).sort((a, b) => Math.hypot(a.x - p.hqx, a.z - p.hqz) - Math.hypot(b.x - p.hqx, b.z - p.hqz))[0];
    if (f) { mine.forEach((s) => { if (s.order.type === 'idle' || (s.order.type === 'move' && !s.escortFor)) setOrder(s, { type: 'amove', x: f.x + (S.rng() - 0.5) * 5, z: f.z + (S.rng() - 0.5) * 5 }); }); return; }
  }
  if (S.hill && armyCp >= 8 && armyCp < ai.wave && S.hill.holder !== pi) {
    mine.forEach((s) => { if (s.order.type === 'idle' || (s.order.type === 'move' && !s.escortFor)) setOrder(s, { type: 'amove', x: S.hill.x + (S.rng() - 0.5) * 6, z: S.hill.z + (S.rng() - 0.5) * 6 }); });
    return;
  }
  if (armyCp >= ai.wave) {
    ai.wave = Math.min(ai.waveMax || 45, ai.wave + 8);
    mine.forEach((s) => setOrder(s, { type: 'amove', x: e.hqx + (S.rng() - 0.5) * 8, z: e.hqz - e.side * 6 }));
  }
}

// HUD: resource chips, context panel, command buttons, floating placement confirm, long-press labels.
// Buttons are described as data ("specs") each refresh; the DOM is rebuilt only when the set of buttons changes.
// Every action goes through sim.command(); Q.* is used only for instant feedback (shake, dim).
import { svg } from './icons.js?v=236';
import { UI, select, selSquads } from './state.js?v=236';
import { getSim, pl, fac, Q, command, count, cpUsed, cpCap, hqOf, HQ_UP } from '../sim/sim.js?v=236';
import { BLD, BUILD_KINDS, TRAIN_SLOTS, UPG, REQ } from '../config/factions.js?v=236';
import { CAM, toggleView, focus } from '../camera/camera.js?v=236';
import { camera } from '../render/scene.js?v=236';
import { walkH } from '../map/layout.js?v=236';
import { THREE } from '../render/scene.js?v=236';
import { showHint } from './hint.js?v=236';
import { sfx } from '../fx/sfx.js?v=236';

const panelEl = document.getElementById('panel'), cmdEl = document.getElementById('cmd'), queueEl = document.getElementById('queue');
const placeBar = document.getElementById('placeBar'), tipEl = document.getElementById('tip');
const specs = new Map();
// First match ever on this phone: the build (hammer) button pulses until it is first tapped. No words.
let builtOnce = false;
let trainedOnce = false;
try { builtOnce = localStorage.getItem('cw-built') === '1'; trainedOnce = localStorage.getItem('cw-trained') === '1'; } catch (e) {}

// One short word under every icon (Colin, after his first full playtest: icons alone were guesswork at first).
const SHORT = { 'Ghost cam': 'View', 'Select army': 'Army', 'Go home': 'Home', 'Leave tower': 'Leave', 'Sit In': 'Sit-in', Close: 'Close' };
function shortName(b) {
  if (b.short) return b.short;
  const n = (b.name || '').replace(/^The /, '');
  if (SHORT[b.name]) return SHORT[b.name];
  if (/^Upgrade/.test(n)) return 'Upgrade';
  if (n.length <= 8) return n;
  const w = n.split(/[\s-]/); return w[w.length - 1]; // the noun: Pitchfork Farmers -> Farmers, Monster Truck -> Truck
}
function btnHTML(b) {
  return `<button type="button" class="btn${b.noCost ? ' noCost' : ''}${b.cls ? ' ' + b.cls : ''}" data-id="${b.id}" aria-label="${b.name || b.id}"><span class="gauge"></span><span class="pips"></span><span class="ic">${svg(b.icon)}</span><span class="lbl">${shortName(b)}</span>${b.noCost ? '' : '<span class="cost"></span>'}<span class="badge"></span><span class="prog"></span></button>`;
}
function applyBtn(el, b) {
  for (const k of ['dis', 'poor', 'ready', 'armed', 'on']) el.classList.toggle(k, !!b[k]);
  el.classList.toggle('cpblock', !!b.cp);
  el.classList.toggle('nudge', !!b.nudge);
  // Power-ready ping: the moment a power's button turns ready it pops once (gold burst) with a soft chime.
  if (b.id && b.id.startsWith('pw-')) { if (b.ready && !el.dataset.wasReady) { el.classList.remove('ping'); void el.offsetWidth; el.classList.add('ping'); sfx('ding', 0.5); } el.dataset.wasReady = b.ready ? '1' : ''; }
  const c = el.querySelector('.cost'); if (c && c.textContent !== String(b.cost)) c.textContent = b.cost;
  const bd = el.querySelector('.badge'), bt = b.badge ? String(b.badge) : ''; if (bd.textContent !== bt) bd.textContent = bt;
  el.querySelector('.prog').style.width = (b.prog != null ? Math.round(b.prog * 100) : 0) + '%';
  el.querySelector('.gauge').style.height = (b.gauge != null ? Math.round(b.gauge * 100) : 0) + '%';
  const pips = el.querySelector('.pips'), pn = b.pips || 0; if (pips.childElementCount !== pn) pips.innerHTML = '<span></span>'.repeat(pn);
  if (b.pipsOn != null) [...pips.children].forEach((c, i) => c.classList.toggle('off', i >= b.pipsOn));
  if (b.hp != null) { const pr = el.querySelector('.prog'); pr.style.width = Math.round(b.hp * 100) + '%'; pr.style.background = b.hp > 0.5 ? '#7ee05b' : b.hp > 0.25 ? '#f2c232' : '#ff5a4f'; }
  if (b.ring != null) el.style.setProperty('--ring', Math.round(Math.min(1, b.ring) * 360) + 'deg');
}

function startPlace(kind) {
  const p = pl(0), hq = hqOf(p);
  let x = hq.x, z = hq.z - 12;
  for (let i = 0; i < 60 && !Q.canPlace(p, kind, x, z); i++) { const a = Math.random() * 6.28, r = 6 + Math.random() * 16; x = hq.x + Math.cos(a) * r; z = hq.z + Math.sin(a) * r; }
  UI.place = { kind, x, z, ok: false }; UI.sel = null; UI.buildMenu = false;
  focus(CAM.tx + (x - CAM.tx) * 0.6, CAM.tz + (z - CAM.tz) * 0.6);
  showHint('drag');
}

function panelSpec() {
  const S = getSim(), p = pl(0), F = fac(p), out = [];
  if (UI.place) return out; // confirm/cancel float next to the ghost instead
  if (UI.buildMenu) {
    for (const k of BUILD_KINDS) out.push({ id: 'b-' + k, name: F.bldNames[k] || 'Wall', icon: k, cost: BLD[k].cost, dis: count(p, k) >= BLD[k].max, poor: p.cash < BLD[k].cost, tap: () => startPlace(k) });
    out.push({ id: 'close', name: 'Close', icon: 'x', noCost: true, cls: 'close', tap: () => { UI.buildMenu = false; } });
    return out;
  }
  const sel = UI.sel;
  if (!sel) return out;
  if (sel.type === 'bld') {
    const b = S.blds.find((x) => x.id === sel.id);
    if (!b) { select(null); return out; }
    if (b.kind === 'barracks') {
      for (const sl of TRAIN_SLOTS) {
        const def = F.units[sl], why = Q.canTrain(p, b, sl), q = b.queue.filter((x) => x === sl).length;
        out.push({ id: 't-' + sl, name: def.name, icon: sl, cost: def.cost, dis: why === 'lock' || b.built < 1, poor: why === 'cash', cp: why === 'cp', badge: q || '', prog: b.queue[0] === sl ? b.prodT / def.build : null, pips: b.level < REQ[sl] ? REQ[sl] : 0, tap: () => (why ? false : command(0, { type: 'train', id: b.id, slot: sl })) });
      }
      // First match ever: the first trainable slot pulses until a squad is trained once (remembered).
      if (!trainedOnce && b.built >= 1) { const f = out.find((o) => o.id && o.id.startsWith('t-') && !o.dis); if (f) { f.nudge = true; const t0 = f.tap; f.tap = () => { const r = t0(); if (r !== false) { trainedOnce = true; try { localStorage.setItem('cw-trained', '1'); } catch (e) {} } return r; }; } }
      if (b.level < 3) out.push({ id: 'up', name: 'Upgrade to level ' + (b.level + 1), icon: 'up', cost: UPG[b.level], dis: b.built < 1 || b.up > 0, poor: p.cash < UPG[b.level], pips: b.level + 1, prog: b.up > 0 ? 1 - b.up / b.upT : null, tap: () => (Q.canUpgrade(p, b) ? command(0, { type: 'upgrade', id: b.id }) : false) });
    } else if (b.kind === 'tower' && b.garrison) {
      const q = S.squads.find((x) => x.id === b.garrison);
      if (q) out.push({ id: 'eject', name: 'Leave tower', icon: q.slot, noCost: true, cls: 'card', tap: () => command(0, { type: 'eject', id: b.id }) });
    } else if (b.kind === 'hq') {
      const w = F.units.worker, ww = Q.canTrain(p, b, 'worker'), wq = b.queue.filter((x) => x === 'worker').length;
      out.push({ id: 't-worker', name: w.name, icon: 'worker', cost: w.cost, dis: ww === 'lock' || b.built < 1, poor: ww === 'cash', cp: ww === 'cp', badge: wq || '', prog: b.queue[0] === 'worker' ? b.prodT / w.build : null, tap: () => (ww ? false : command(0, { type: 'train', id: b.id, slot: 'worker' })) });
      if (S.down && p.hqLvl < 3) { // Downtown: grow City Hall (builders) / the Hideout (wreckers)
        const cost = HQ_UP[p.hqLvl - 1], build = S.down.role[0] === 'b';
        out.push({ id: 'hqup', name: (build ? 'City Hall' : 'Hideout') + ' level ' + (p.hqLvl + 1), short: build ? 'Hall' : 'Hideout', icon: 'up', cost, poor: p.cash < cost, pips: p.hqLvl + 1, tap: () => command(0, { type: 'hqup' }) });
      }
      const def = F.units.hero, why = Q.canTrain(p, b, 'hero');
      out.push({ id: 't-hero', name: def.name, icon: 'hero', cost: def.cost, dis: why === 'lock' && !b.queue.includes('hero'), poor: why === 'cash', cp: why === 'cp', prog: b.queue[0] === 'hero' ? b.prodT / def.build : null, tap: () => (why ? false : command(0, { type: 'train', id: b.id, slot: 'hero' })) });
    }
  } else if (sel.type === 'sq') {
    const sq = selSquads();
    if (!sq.length) { select(null); return out; }
    // Command card: one portrait per selected squad (max 6) - members alive as pips, health bar, rank as stars.
    // Tap a portrait: select just that squad and fly the camera to it.
    for (const q of sq.slice(0, 6)) {
      let hp = 0, alive = 0; for (const h of q.members) { hp += h; if (h > 0) alive++; }
      out.push({ id: 'sq-' + q.id, name: q.def.name, icon: q.slot === 'civ' ? 'people' : q.slot, noCost: true, cls: 'card', pips: q.members.length > 1 ? q.members.length : 0, pipsOn: alive, hp: hp / (q.members.length * q.mhp),
        badge: q.rank ? '\u2605'.repeat(Math.min(q.rank, 5)) : '', tap: () => { select({ type: 'sq', ids: [q.id] }); focus(q.x, q.z); } });
    }
    // Stance: one big toggle for the whole selection - a planted flag (hold ground) or crossed blades (charge in).
    const fighters = sq.filter((s) => s.slot !== 'worker');
    if (fighters.length) { const allHold = fighters.every((s) => s.hold); out.push({ id: 'stance', name: allHold ? 'Hold ground' : 'Aggressive', icon: allHold ? 'hold' : 'charge', noCost: true, on: allHold, tap: () => command(0, { type: 'stance', ids: fighters.map((s) => s.id), hold: !allHold }) }); }
    const sitters = sq.filter((s) => s.f === 'ac' && s.slot === 'melee');
    if (sitters.length) { const allSit = sitters.every((s) => s.sit); out.push({ id: 'sit', name: 'Sit In', icon: 'shield', noCost: true, on: allSit, tap: () => command(0, { type: 'sit', ids: sitters.map((s) => s.id), on: !allSit }) }); }
  }
  out.push({ id: 'close', name: 'Close', icon: 'x', noCost: true, cls: 'close', tap: () => select(null) });
  return out;
}
/** The selected building's production queue: one round icon per order, the front one fills a ring. Tap = cancel + refund. */
function queueSpec() {
  const S = getSim(), p = pl(0), F = fac(p), sel = UI.sel;
  if (UI.place || !sel || sel.type !== 'bld') return [];
  const b = S.blds.find((x) => x.id === sel.id);
  if (!b || !b.queue.length) return [];
  return b.queue.map((sl, i) => ({ id: 'q' + i + '-' + sl, name: F.units[sl].name, icon: sl, noCost: true, cls: 'sm q', ring: i === 0 ? b.prodT / F.units[sl].build : 0,
    tap: () => command(0, { type: 'cancel', id: b.id, idx: i }) }));
}
function cmdSpec() {
  const S = getSim(), p = pl(0), F = fac(p);
  const out = [
    { id: 'view', name: 'Ghost cam', icon: 'eye', noCost: true, cls: 'sm view', on: CAM.view === 'low', tap: () => toggleView(selSquads()[0]) },
    { id: 'build', name: 'Build', icon: 'hammer', noCost: true, cls: 'sm build', on: UI.buildMenu, nudge: !builtOnce, tap: () => { UI.sel = null; UI.place = null; UI.buildMenu = !UI.buildMenu; if (!builtOnce) { builtOnce = true; try { localStorage.setItem('cw-built', '1'); } catch (e) {} } } },
    { id: 'army', name: 'Select army', icon: 'people', noCost: true, cls: 'sm army', tap: () => { const army = S.squads.filter((s) => s.owner === 0 && s.slot !== 'worker'); if (!army.length) return false; select({ type: 'sq', ids: army.map((s) => s.id) }); focus(army[0].x, army[0].z); } },
    { id: 'home', name: 'Go home', icon: 'home', noCost: true, cls: 'sm', tap: () => { const hq = hqOf(p); if (!hq) return false; focus(hq.x, hq.z - 10); select({ type: 'bld', id: hq.id }); } },
  ];
  // Hero button: appears once your hero is on the field; the fill shows its health, stars its level. Tap = select + fly to it.
  const hero = S.squads.find((s) => s.owner === 0 && s.slot === 'hero');
  if (hero) out.push({ id: 'hero', name: F.units.hero.name, icon: 'hero', noCost: true, cls: 'sm herob', gauge: hero.members[0] / hero.mhp, badge: hero.rank ? '\u2605'.repeat(hero.rank) : '',
    on: UI.sel && UI.sel.type === 'sq' && UI.sel.ids.length === 1 && UI.sel.ids[0] === hero.id, tap: () => { select({ type: 'sq', ids: [hero.id] }); focus(hero.x, hero.z); } });
  F.powers.forEach((pw, i) => {
    const ready = Q.powerReady(p, i);
    out.push({ id: 'pw-' + pw.id, name: pw.name, short: pw.short, icon: pw.icon, noCost: true, cls: 'sm', gauge: Math.min(1, p.meter / pw.cost), ready, armed: UI.armed === i, dis: !ready && p.meter >= pw.cost,
      tap: () => { if (!Q.powerReady(p, i)) return false; if (pw.target) UI.armed = UI.armed === i ? null : i; else command(0, { type: 'power', idx: i }); } });
  });
  return out;
}
function renderButtons(el, spec) {
  const key = spec.map((b) => b.id).join('|');
  if (el.dataset.key !== key) { el.innerHTML = spec.map(btnHTML).join(''); el.dataset.key = key; }
  spec.forEach((b) => { specs.set(b.id, b); const node = el.querySelector(`[data-id="${b.id}"]`); if (node) applyBtn(node, b); });
}
export function refreshHUD() {
  const S = getSim(); if (!S) return;
  specs.clear();
  renderButtons(panelEl, panelSpec());
  renderButtons(cmdEl, cmdSpec());
  renderButtons(queueEl, queueSpec());
  const p = pl(0);
  // Cash chip flashes green and bumps up when money comes in, red and dips when it goes out.
  const cash = Math.floor(p.cash), chip = document.getElementById('cash');
  if (lastCash !== null && cash !== lastCash) {
    chip.classList.remove('gain', 'spend'); void chip.offsetWidth;
    chip.classList.add(cash > lastCash ? 'gain' : 'spend');
  }
  lastCash = cash;
  document.querySelector('#cash b').textContent = cash;
  const used = cpUsed(p), cap = cpCap(p);
  document.querySelector('#cp b').textContent = used + '/' + cap;
  document.getElementById('cp').classList.toggle('full', used >= cap);
  // Heat: how much attention the city is paying you (police at 6, SWAT at 15, armour at 30); the siren flashes while hunted.
  const heat = document.getElementById('heatChip');
  heat.style.display = S.heat ? '' : 'none';
  if (S.heat) {
    document.getElementById('heatBar').style.setProperty('--w', Math.min(1, (S.heat.v[0] + S.heat.base) / 65) * 100 + '%');
    heat.classList.toggle('hunted', S.squads.some((q) => q.owner === 2 && q.hunt === 0 && q.slot !== 'worker' && q.order.type !== 'leave'));
  }
  const hc = document.getElementById('hillChip');
  hc.style.display = S.hill || S.race || S.cap || S.down ? '' : 'none';
  if (S.hill) {
    document.getElementById('hillMe').style.setProperty('--w', S.hill.prog[0] * 100 + '%');
    document.getElementById('hillThem').style.setProperty('--w', S.hill.prog[1] * 100 + '%');
    hc.className = 'chip hillc' + (S.hill.contested ? ' hc' : S.hill.holder >= 0 ? ' h' + S.hill.holder : '');
  } else if (S.cap) { // Capture and Hold: the bars are each side's remaining counter
    document.getElementById('hillMe').style.setProperty('--w', Math.max(0, S.cap.score[0] / S.cap.max) * 100 + '%');
    document.getElementById('hillThem').style.setProperty('--w', Math.max(0, S.cap.score[1] / S.cap.max) * 100 + '%');
    const n0 = S.cap.pts.filter((f) => f.owner === 0).length, n1 = S.cap.pts.filter((f) => f.owner === 1).length;
    hc.className = 'chip hillc' + (n0 > n1 ? ' h0' : n1 > n0 ? ' h1' : '');
  } else if (S.down) { // Downtown: top bar = how much of the city is standing, bottom bar = time left
    const D = S.down;
    document.getElementById('hillMe').style.setProperty('--w', D.meter * 100 + '%');
    document.getElementById('hillThem').style.setProperty('--w', Math.max(0, 1 - S.t / D.limit) * 100 + '%');
    if (hc.dataset.i !== 'home') { hc.dataset.i = 'home'; hc.querySelector('.ic').innerHTML = svg('home'); }
    hc.className = 'chip hillc down ' + (D.meter >= D.hold ? 'up' : 'low');
  } else if (S.race) { // Resource Race: same two bars, filled by money earned; a coin instead of the flag
    document.getElementById('hillMe').style.setProperty('--w', Math.min(1, S.players[0].st.earned / S.race.goal) * 100 + '%');
    document.getElementById('hillThem').style.setProperty('--w', Math.min(1, S.players[1].st.earned / S.race.goal) * 100 + '%');
    if (hc.dataset.i !== 'coin') { hc.dataset.i = 'coin'; hc.querySelector('.ic').innerHTML = svg('coin'); }
    hc.className = 'chip hillc race';
  }
  if ((S.hill || S.cap) && hc.dataset.i && hc.dataset.i !== 'flag') { hc.dataset.i = ''; hc.querySelector('.ic').innerHTML = svg('flag'); }
  document.getElementById('meterFill').style.width = Math.round(p.meter) + '%';
}
let lastCash = null;
export function resetHUD() { lastCash = null; panelEl.dataset.key = ''; cmdEl.dataset.key = ''; queueEl.dataset.key = ''; }

// ---- Placement confirm floats above the ghost ----
const v3 = new THREE.Vector3();
export function updatePlaceBar() {
  if (!UI.place) { placeBar.hidden = true; return; }
  placeBar.hidden = false;
  v3.set(UI.place.x, walkH(UI.place.x, UI.place.z) + 5, UI.place.z).project(camera);
  const x = ((v3.x + 1) / 2) * window.innerWidth, y = ((1 - v3.y) / 2) * window.innerHeight;
  const w = placeBar.offsetWidth || 136, h = placeBar.offsetHeight || 64;
  placeBar.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
  placeBar.style.top = Math.max(60, Math.min(window.innerHeight - h - 90, y - h)) + 'px';
  const okBtn = document.getElementById('placeOk');
  okBtn.classList.toggle('dis', !UI.place.ok || pl(0).cash < BLD[UI.place.kind].cost);
}
function confirmPlace() {
  if (!UI.place || !UI.place.ok || !Q.canBuild(pl(0), UI.place.kind)) return false;
  command(0, { type: 'build', kind: UI.place.kind, x: UI.place.x, z: UI.place.z });
  UI.place = null;
}

// ---- Press handling: tap = action, hold = show the button's name ----
let hold = null;
function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
export function showTip(el, text) {
  tipEl.textContent = text; tipEl.hidden = false;
  const r = el.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  tipEl.style.top = Math.max(8, r.top - h - 10) + 'px';
}
function down(e) {
  const el = e.target.closest('.btn'); if (!el) return;
  e.preventDefault(); e.stopPropagation();
  const id = el.dataset.id || el.id;
  hold = { el, id, long: false, t: setTimeout(() => { hold.long = true; const b = specs.get(id); showTip(el, b ? b.name : el.getAttribute('aria-label')); }, 420) };
}
function up(e) {
  if (!hold) return;
  e.preventDefault(); e.stopPropagation();
  clearTimeout(hold.t); tipEl.hidden = true;
  const { el, id, long } = hold; hold = null;
  if (long) return;
  let ok;
  if (id === 'placeOk') ok = confirmPlace();
  else if (id === 'placeNo') { UI.place = null; ok = true; }
  else { const b = specs.get(id); ok = b && !b.dis ? b.tap() : false; }
  if (ok === false) shake(el);
  refreshHUD();
}
function cancel() { if (hold) { clearTimeout(hold.t); hold = null; tipEl.hidden = true; } }
for (const el of [panelEl, cmdEl, queueEl, placeBar]) {
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);
}

// HUD: resource chips, context panel, command buttons, floating placement confirm, long-press labels.
// Buttons are described as data ("specs") each refresh; the DOM is rebuilt only when the set of buttons changes.
// Every action goes through sim.command(); Q.* is used only for instant feedback (shake, dim).
import { svg } from './icons.js?v=89';
import { UI, select, selSquads } from './state.js?v=89';
import { getSim, pl, fac, Q, command, count, cpUsed, cpCap, hqOf } from '../sim/sim.js?v=89';
import { BLD, BUILD_KINDS, TRAIN_SLOTS, UPG, REQ } from '../config/factions.js?v=89';
import { CAM, toggleView, focus } from '../camera/camera.js?v=89';
import { camera } from '../render/scene.js?v=89';
import { walkH } from '../map/layout.js?v=89';
import { THREE } from '../render/scene.js?v=89';
import { showHint } from './hint.js?v=89';

const panelEl = document.getElementById('panel'), cmdEl = document.getElementById('cmd'), queueEl = document.getElementById('queue');
const placeBar = document.getElementById('placeBar'), tipEl = document.getElementById('tip');
const specs = new Map();

function btnHTML(b) {
  return `<button type="button" class="btn${b.noCost ? ' noCost' : ''}${b.cls ? ' ' + b.cls : ''}" data-id="${b.id}" aria-label="${b.name || b.id}"><span class="gauge"></span><span class="pips"></span><span class="ic">${svg(b.icon)}</span>${b.noCost ? '' : '<span class="cost"></span>'}<span class="badge"></span><span class="prog"></span></button>`;
}
function applyBtn(el, b) {
  for (const k of ['dis', 'poor', 'ready', 'armed', 'on']) el.classList.toggle(k, !!b[k]);
  el.classList.toggle('cpblock', !!b.cp);
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
    for (const k of BUILD_KINDS) out.push({ id: 'b-' + k, name: F.bldNames[k], icon: k, cost: BLD[k].cost, dis: count(p, k) >= BLD[k].max, poor: p.cash < BLD[k].cost, tap: () => startPlace(k) });
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
      if (b.level < 3) out.push({ id: 'up', name: 'Upgrade to level ' + (b.level + 1), icon: 'up', cost: UPG[b.level], dis: b.built < 1 || b.up > 0, poor: p.cash < UPG[b.level], pips: b.level + 1, prog: b.up > 0 ? 1 - b.up / b.upT : null, tap: () => (Q.canUpgrade(p, b) ? command(0, { type: 'upgrade', id: b.id }) : false) });
    } else if (b.kind === 'tower' && b.garrison) {
      const q = S.squads.find((x) => x.id === b.garrison);
      if (q) out.push({ id: 'eject', name: 'Leave tower', icon: q.slot, noCost: true, cls: 'card', tap: () => command(0, { type: 'eject', id: b.id }) });
    } else if (b.kind === 'hq') {
      const w = F.units.worker, ww = Q.canTrain(p, b, 'worker'), wq = b.queue.filter((x) => x === 'worker').length;
      out.push({ id: 't-worker', name: w.name, icon: 'worker', cost: w.cost, dis: ww === 'lock' || b.built < 1, poor: ww === 'cash', cp: ww === 'cp', badge: wq || '', prog: b.queue[0] === 'worker' ? b.prodT / w.build : null, tap: () => (ww ? false : command(0, { type: 'train', id: b.id, slot: 'worker' })) });
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
      out.push({ id: 'sq-' + q.id, name: F.units[q.slot].name, icon: q.slot, noCost: true, cls: 'card', pips: q.members.length > 1 ? q.members.length : 0, pipsOn: alive, hp: hp / (q.members.length * q.mhp),
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
    { id: 'build', name: 'Build', icon: 'hammer', noCost: true, cls: 'sm build', on: UI.buildMenu, tap: () => { UI.sel = null; UI.place = null; UI.buildMenu = !UI.buildMenu; } },
    { id: 'army', name: 'Select army', icon: 'people', noCost: true, cls: 'sm army', tap: () => { const army = S.squads.filter((s) => s.owner === 0 && s.slot !== 'worker'); if (!army.length) return false; select({ type: 'sq', ids: army.map((s) => s.id) }); focus(army[0].x, army[0].z); } },
    { id: 'home', name: 'Go home', icon: 'home', noCost: true, cls: 'sm', tap: () => { const hq = hqOf(p); if (!hq) return false; focus(hq.x, hq.z - 10); select({ type: 'bld', id: hq.id }); } },
  ];
  // Hero button: appears once your hero is on the field; the fill shows its health, stars its level. Tap = select + fly to it.
  const hero = S.squads.find((s) => s.owner === 0 && s.slot === 'hero');
  if (hero) out.push({ id: 'hero', name: F.units.hero.name, icon: 'hero', noCost: true, cls: 'sm herob', gauge: hero.members[0] / hero.mhp, badge: hero.rank ? '\u2605'.repeat(hero.rank) : '',
    on: UI.sel && UI.sel.type === 'sq' && UI.sel.ids.length === 1 && UI.sel.ids[0] === hero.id, tap: () => { select({ type: 'sq', ids: [hero.id] }); focus(hero.x, hero.z); } });
  F.powers.forEach((pw, i) => {
    const ready = Q.powerReady(p, i);
    out.push({ id: 'pw-' + pw.id, name: pw.name, icon: pw.icon, noCost: true, cls: 'sm', gauge: Math.min(1, p.meter / pw.cost), ready, armed: UI.armed === i, dis: !ready && p.meter >= pw.cost,
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
  const hc = document.getElementById('hillChip');
  hc.style.display = S.hill ? '' : 'none';
  if (S.hill) {
    document.getElementById('hillMe').style.setProperty('--w', S.hill.prog[0] * 100 + '%');
    document.getElementById('hillThem').style.setProperty('--w', S.hill.prog[1] * 100 + '%');
    hc.className = 'chip hillc' + (S.hill.contested ? ' hc' : S.hill.holder >= 0 ? ' h' + S.hill.holder : '');
  }
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
function showTip(el, text) {
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

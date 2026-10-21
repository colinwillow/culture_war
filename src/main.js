// Entry point: wires sim + render + input + UI and runs the fixed-step loop.
import { renderer, scene, camera, followSun, THREE, setTimeOfDay } from './render/scene.js?v=101';
import { buildWorld, updateWorld, setDusk, setRain } from './render/world.js?v=101';
import { syncRender, clearRender, bump } from './render/sync.js?v=101';
import { handleEvents, updateFx, clearFx } from './fx/fx.js?v=101';
import { newSim, getSim, step } from './sim/sim.js?v=101';
import { TICK } from './config/factions.js?v=101';
import { CAM, applyCam, resetCam, onResize } from './camera/camera.js?v=101';
import { initInput, lockPageZoom } from './input/input.js?v=101';
import { refreshHUD, resetHUD, updatePlaceBar } from './ui/hud.js?v=101';
import { resetUI } from './ui/state.js?v=101';
import { fillIcons, svg } from './ui/icons.js?v=101';
import { noteAlerts, updateAlert, clearAlert } from './ui/alert.js?v=101';
import { updateMinimap } from './ui/minimap.js?v=101';
import { isMuted, setMuted } from './fx/sfx.js?v=101';
import { loadChars } from './render/chars.js?v=101';
import { FC } from './render/models.js?v=101';

export const BUILD = 101; // written by `npm run bump`
lockPageZoom();
fillIcons();
buildWorld();
initInput();
loadChars();

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (onResize() && getSim()) resetCam();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
resize();
resetCam();

const menu = document.getElementById('menu'), endEl = document.getElementById('end');
let running = false;
let lastF = null;
function start(f) {
  lastF = f;
  clearRender(); clearFx(); clearAlert();
  const seed = (Date.now() & 0xffffff) + 1;
  newSim(f, seed, diff, mode);
  setRain(seed % 4 === 0); // about one match in four is rainy (render only)
  // Your faction's colour tints the HUD accents (power meter, command cards); friend/foe stays blue/red.
  const fc = new THREE.Color(FC[f].main), hx = (c) => '#' + c.getHexString(), root = document.documentElement.style;
  root.setProperty('--fc', hx(fc)); root.setProperty('--fc2', hx(fc.clone().lerp(new THREE.Color(0xffffff), 0.45)));
  resetUI(); resetHUD();
  menu.hidden = true; endEl.hidden = true; running = true; setPause(false);
  cin = null; resetCam(); refreshHUD();
  // Intro: start over the enemy HQ and fly home in ~2.5 s (a tap anywhere skips it).
  const en = getSim().players[1];
  intro = { t: 0, x0: en.hqx, z0: en.hqz, d0: 46, yaw0: Math.PI * 0.35, x: CAM.tx, z: CAM.tz, d: CAM.dist, yaw: CAM.yaw };
  CAM.tx = en.hqx; CAM.tz = en.hqz; CAM.dist = CAM.distT = 46; CAM.yaw = intro.yaw0;
}
// Difficulty: 1-3 stars on the menu, remembered on this phone.
let diff = 1;
try { diff = +(localStorage.getItem('cw-diff') ?? 1); } catch (e) {}
const diffBtns = document.querySelectorAll('#diff button[data-d]');
const showDiff = () => diffBtns.forEach((b) => b.classList.toggle('on', +b.dataset.d === diff));
diffBtns.forEach((b) => b.addEventListener('pointerup', () => { diff = +b.dataset.d; showDiff(); try { localStorage.setItem('cw-diff', diff); } catch (e) {} }));
showDiff();
// Mode: Versus (destroy the HQ) or King of the Hill (hold the middle overpass), also remembered.
let mode = 'vs';
try { mode = localStorage.getItem('cw-mode') || 'vs'; } catch (e) {}
const modeBtns = document.querySelectorAll('#diff button[data-m]');
const showMode = () => modeBtns.forEach((b) => b.classList.toggle('on', b.dataset.m === mode));
modeBtns.forEach((b) => b.addEventListener('pointerup', () => { mode = b.dataset.m; showMode(); try { localStorage.setItem('cw-mode', mode); } catch (e) {} }));
showMode();
document.querySelectorAll('.pick').forEach((b) => b.addEventListener('pointerup', () => start(b.dataset.f)));
// Rematch: same faction, mode and difficulty, straight back in (a fresh seed, so a new opponent may be drawn).
document.getElementById('rematch').addEventListener('pointerup', () => { if (lastF) start(lastF); });
document.getElementById('again').addEventListener('pointerup', () => { endEl.hidden = true; menu.hidden = false; running = false; setPause(false); });

// Pause: freezes the sim and every animation (dt 0) but keeps drawing; tap the dim to resume. Auto-pauses when the
// phone switches away from the tab.
let paused = false;
const pauseDim = document.getElementById('pauseDim'), pauseBtn = document.getElementById('pauseBtn');
// Mute: a speaker button shown on the menu and while paused (never over the battlefield).
const muteBtn = document.getElementById('muteBtn');
const drawMute = () => { muteBtn.innerHTML = svg(isMuted() ? 'mute' : 'sound'); document.body.classList.toggle('show-mute', !running || paused); };
muteBtn.addEventListener('pointerup', (e) => { e.stopPropagation(); setMuted(!isMuted()); drawMute(); });
muteBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
function setPause(on) { paused = on && running; pauseDim.hidden = !paused; drawMute(); }
pauseBtn.addEventListener('pointerup', (e) => { e.stopPropagation(); setPause(true); });
pauseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
pauseDim.addEventListener('pointerup', (e) => { e.stopPropagation(); setPause(false); });
pauseDim.addEventListener('pointerdown', (e) => e.stopPropagation());
document.addEventListener('visibilitychange', () => { if (document.hidden) setPause(true); });
drawMute();
// Dev readout: tap the B# on the menu title to toggle FPS / frame ms / units / draw calls (remembered on the phone).
const devEl = document.getElementById('devInfo');
let devOn = false; try { devOn = localStorage.getItem('cw-dev') === '1'; } catch (e) {}
devEl.hidden = !devOn;
document.getElementById('build').addEventListener('pointerup', (e) => { e.stopPropagation(); devOn = !devOn; devEl.hidden = !devOn; try { localStorage.setItem('cw-dev', devOn ? '1' : '0'); } catch (er) {} });
let devN = 0, devT = 0, devWorst = 0;
function devTick(dt, S) {
  if (!devOn) return;
  devN++; devT += dt; devWorst = Math.max(devWorst, dt);
  if (devT < 0.5) return;
  const units = S ? S.squads.reduce((a, s) => a + s.members.filter((h) => h > 0).length, 0) : 0;
  devEl.textContent = `${Math.round(devN / devT)} fps · worst ${Math.round(devWorst * 1000)} ms · ${units} units · ${renderer.info.render.calls} draws · ${renderer.info.render.triangles} tris`;
  devN = 0; devT = 0; devWorst = 0;
}
let last = performance.now(), acc = 0, hudT = 0;
// End-of-match cinematic: the camera swoops down onto the fallen HQ and slowly circles the rubble; stats follow.
let cin = null, intro = null;
function introCam(dt) {
  if (!intro) return;
  intro.t += dt;
  const k = Math.min(1, intro.t / 2.5), e = k * k * (3 - 2 * k), lift = Math.sin(k * Math.PI) * 25; // arcs up and over the city
  CAM.tx = intro.x0 + (intro.x - intro.x0) * e; CAM.tz = intro.z0 + (intro.z - intro.z0) * e;
  CAM.dist = CAM.distT = intro.d0 + (intro.d - intro.d0) * e + lift; CAM.yaw = intro.yaw0 + (intro.yaw - intro.yaw0) * e;
  if (k >= 1) intro = null;
}
window.addEventListener('pointerdown', () => { if (intro && intro.t > 0.2) { intro.t = 2.5; introCam(0); } }, { capture: true });
function cinema(dt) {
  if (!cin) return;
  cin.t += dt;
  const k = Math.min(1, cin.t / 2), e = k * k * (3 - 2 * k);
  CAM.tx = cin.x0 + (cin.x - cin.x0) * e; CAM.tz = cin.z0 + (cin.z - cin.z0) * e;
  CAM.distT = cin.d0 + (24 - cin.d0) * e;
  CAM.yaw = cin.yaw0 + e * 0.8 + Math.max(0, cin.t - 2) * 0.12;
}
function frame(now) {
  const dt = paused ? 0 : Math.min(0.1, (now - last) / 1000);
  last = now;
  const time = now / 1000, S = getSim();
  if (S && running && !S.over) {
    acc += dt;
    let n = 0;
    while (acc >= TICK && n < 4) { step(); acc -= TICK; n++; }
    if (acc > TICK) acc = 0;
  }
  if (S) { noteAlerts(S); handleEvents(S, bump); syncRender(S, Math.min(1, acc / TICK), dt, time); }
  updateFx(dt);
  updateWorld(dt, S);
  if (S && S.over && running) {
    running = false;
    const won = S.over.winner === 0, ic = document.getElementById('endIcon');
    ic.innerHTML = svg(won ? 'trophy' : 'skull'); ic.className = 'big' + (won ? '' : ' lose');
    // Stats: per row an icon, then your bar (blue) and theirs (red), growing in one after another.
    const rows = [['skull', 'kills'], ['coin', 'earned'], ['home', 'built'], ['tower', 'razed']], a = S.players[0].st, e = S.players[1].st;
    document.getElementById('stats').innerHTML = rows.map(([ic, k], i) => {
      const mx = Math.max(1, a[k], e[k]);
      return `<div class="srow" style="--d:${0.3 + i * 0.25}s"><span class="ic">${svg(ic)}</span><div class="bars"><i class="me" style="--w:${(a[k] / mx) * 100}%"><b>${a[k]}</b></i><i class="them" style="--w:${(e[k] / mx) * 100}%"><b>${e[k]}</b></i></div></div>`;
    }).join('');
    const lost = S.players[1 - S.over.winner];
    cin = { t: 0, x0: CAM.tx, z0: CAM.tz, d0: CAM.dist, yaw0: CAM.yaw, x: S.over.hill ? S.hill.x : lost.hqx, z: S.over.hill ? S.hill.z : lost.hqz }; // a hill win swoops onto the hill
    setTimeout(() => (endEl.hidden = false), 2600);
  }
  hudT -= dt;
  if (hudT <= 0) { hudT = 0.15; refreshHUD(); }
  cinema(dt);
  introCam(dt);
  // The day wears on: morning at the start, golden hour by ~11 minutes in; lamps and windows come on in the last half.
  if (S && running) { const k = Math.min(1, Math.max(0, (S.t - 60) / 600)); if (Math.abs(k - (frame.tod ?? -1)) > 0.002) { frame.tod = k; setTimeOfDay(k); setDusk(Math.max(0, k * 2 - 1)); } }
  else if (!S && frame.tod) { frame.tod = 0; setTimeOfDay(0); setDusk(0); }
  applyCam(dt);
  followSun(CAM.tx, CAM.tz);
  if (S && running) { updateMinimap(dt); updateAlert(dt); }
  updatePlaceBar();
  renderer.render(scene, camera);
  devTick((now - (frame.prev || now)) / 1000, S); frame.prev = now;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cwBooted = true;

// Entry point: wires sim + render + input + UI and runs the fixed-step loop.
import { renderer, scene, camera, followSun } from './render/scene.js?v=73';
import { buildWorld, updateWorld } from './render/world.js?v=73';
import { syncRender, clearRender, bump } from './render/sync.js?v=73';
import { handleEvents, updateFx, clearFx } from './fx/fx.js?v=73';
import { newSim, getSim, step } from './sim/sim.js?v=73';
import { TICK } from './config/factions.js?v=73';
import { CAM, applyCam, resetCam, onResize } from './camera/camera.js?v=73';
import { initInput, lockPageZoom } from './input/input.js?v=73';
import { refreshHUD, resetHUD, updatePlaceBar } from './ui/hud.js?v=73';
import { resetUI } from './ui/state.js?v=73';
import { fillIcons, svg } from './ui/icons.js?v=73';
import { noteAlerts, updateAlert, clearAlert } from './ui/alert.js?v=73';
import { updateMinimap } from './ui/minimap.js?v=73';
import { isMuted, setMuted } from './fx/sfx.js?v=73';
import { loadChars } from './render/chars.js?v=73';

export const BUILD = 73; // written by `npm run bump`
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
function start(f) {
  clearRender(); clearFx(); clearAlert();
  newSim(f, (Date.now() & 0xffffff) + 1, diff);
  resetUI(); resetHUD();
  menu.hidden = true; endEl.hidden = true; running = true; setPause(false);
  resetCam(); refreshHUD();
}
// Difficulty: 1-3 stars on the menu, remembered on this phone.
let diff = 1;
try { diff = +(localStorage.getItem('cw-diff') ?? 1); } catch (e) {}
const diffBtns = document.querySelectorAll('#diff button');
const showDiff = () => diffBtns.forEach((b) => b.classList.toggle('on', +b.dataset.d === diff));
diffBtns.forEach((b) => b.addEventListener('pointerup', () => { diff = +b.dataset.d; showDiff(); try { localStorage.setItem('cw-diff', diff); } catch (e) {} }));
showDiff();
document.querySelectorAll('.pick').forEach((b) => b.addEventListener('pointerup', () => start(b.dataset.f)));
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
    setTimeout(() => (endEl.hidden = false), 900);
  }
  hudT -= dt;
  if (hudT <= 0) { hudT = 0.15; refreshHUD(); }
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

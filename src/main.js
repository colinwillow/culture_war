// Entry point: wires sim + render + input + UI and runs the fixed-step loop.
import { renderer, scene, camera } from './render/scene.js?v=2';
import { buildWorld, updateWorld } from './render/world.js?v=2';
import { syncRender, clearRender, bump } from './render/sync.js?v=2';
import { handleEvents, updateFx, clearFx } from './fx/fx.js?v=2';
import { newSim, getSim, step } from './sim/sim.js?v=2';
import { TICK } from './config/factions.js?v=2';
import { applyCam, resetCam, onResize } from './camera/camera.js?v=2';
import { initInput, lockPageZoom } from './input/input.js?v=2';
import { refreshHUD, resetHUD, updatePlaceBar } from './ui/hud.js?v=2';
import { resetUI } from './ui/state.js?v=2';
import { fillIcons, svg } from './ui/icons.js?v=2';
import { loadChars } from './render/chars.js?v=2';

export const BUILD = 2; // written by `npm run bump`
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
  clearRender(); clearFx();
  newSim(f, (Date.now() & 0xffffff) + 1);
  resetUI(); resetHUD();
  menu.hidden = true; endEl.hidden = true; running = true;
  resetCam(); refreshHUD();
}
document.querySelectorAll('.pick').forEach((b) => b.addEventListener('pointerup', () => start(b.dataset.f)));
document.getElementById('again').addEventListener('pointerup', () => { endEl.hidden = true; menu.hidden = false; running = false; });

let last = performance.now(), acc = 0, hudT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const time = now / 1000, S = getSim();
  if (S && running && !S.over) {
    acc += dt;
    let n = 0;
    while (acc >= TICK && n < 4) { step(); acc -= TICK; n++; }
    if (acc > TICK) acc = 0;
  }
  if (S) { handleEvents(S, bump); syncRender(S, Math.min(1, acc / TICK), dt, time); }
  updateFx(dt);
  updateWorld(dt);
  if (S && S.over && running) {
    running = false;
    const won = S.over.winner === 0, ic = document.getElementById('endIcon');
    ic.innerHTML = svg(won ? 'trophy' : 'skull'); ic.className = 'big' + (won ? '' : ' lose');
    setTimeout(() => (endEl.hidden = false), 900);
  }
  hudT -= dt;
  if (hudT <= 0) { hudT = 0.15; refreshHUD(); }
  applyCam(dt);
  updatePlaceBar();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cwBooted = true;

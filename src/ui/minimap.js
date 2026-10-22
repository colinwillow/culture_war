// Minimap, top-left under the resource chips. Fixed orientation: your base at the bottom (+z), enemy at the top.
// Tap or drag on it to move the camera there. Static city is drawn once; units/buildings redraw ~10x a second.
import { MAP, BLOCKS, TRENCH } from '../map/layout.js?v=233';
import { CAM, focus } from '../camera/camera.js?v=233';
import { getSim } from '../sim/sim.js?v=233';
import { seen } from '../render/fog.js?v=233';

const cv = document.getElementById('mini'), ctx = cv.getContext('2d');
const bg = document.createElement('canvas'), bctx = bg.getContext('2d');
let W = 0, H = 0, dpr = 1, acc = 0;
const px = (x) => ((x + MAP.w / 2) / MAP.w) * W, pz = (z) => ((z + MAP.h / 2) / MAP.h) * H;

function size() {
  const r = cv.getBoundingClientRect();
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
  if (!W || !H) return;
  cv.width = bg.width = W; cv.height = bg.height = H;
  const c = bctx;
  c.fillStyle = '#3d4148'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#7cab58'; c.fillRect(0, 0, W, pz(-56)); c.fillRect(0, pz(56), W, H - pz(56)); // home lawns
  c.fillStyle = '#26292e'; c.fillRect(0, pz(-TRENCH.half), W, pz(TRENCH.half) - pz(-TRENCH.half)); // freeway trench
  for (const b of BLOCKS) {
    c.fillStyle = b.kind === 'park' ? '#5f8f45' : b.kind === 'lot' ? '#55595f' : '#9a948a';
    c.fillRect(px(b.x0), pz(b.z0), px(b.x1) - px(b.x0), pz(b.z1) - pz(b.z0));
  }
}

export function updateMinimap(dt) {
  acc -= dt; if (acc > 0) return; acc = 0.1;
  if (!W) size();
  const S = getSim(); if (!S || !W) return;
  ctx.drawImage(bg, 0, 0);
  const u = dpr;
  // Objectives: the hill / capture flags as rings in their holder's colour (white = nobody), flickering when contested.
  const objs = S.hill ? [{ ...S.hill, owner: S.hill.holder }] : S.cap ? S.cap.pts : S.obj ? S.obj.pts : [];
  for (const f of objs) {
    ctx.strokeStyle = f.contested ? (Math.sin(performance.now() / 60) > 0 ? '#7fd1ff' : '#ff5a4f') : f.owner === 0 ? '#7fd1ff' : f.owner === 1 ? '#ff5a4f' : '#f3efe2';
    ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(px(f.x), pz(f.z), Math.max(4 * u, (pz(f.r) - pz(0)) * Math.sign(pz(1) - pz(0))), 0, 6.29); ctx.stroke();
  }
  for (const n of S.nodes) if (n.amount > 0) { ctx.fillStyle = '#f5b83a'; ctx.beginPath(); ctx.arc(px(n.x), pz(n.z), 2.4 * u, 0, 6.29); ctx.fill(); }
  for (const b of S.blds) {
    const s = (b.kind === 'hq' ? 6 : 4) * u;
    ctx.fillStyle = b.owner === 0 ? '#7fd1ff' : '#ff5a4f'; ctx.fillRect(px(b.x) - s / 2, pz(b.z) - s / 2, s, s);
    ctx.strokeStyle = '#000'; ctx.lineWidth = u; ctx.strokeRect(px(b.x) - s / 2, pz(b.z) - s / 2, s, s);
  }
  for (const s of S.squads) {
    if (s.owner === 1 && !seen(S, s.x, s.z)) continue; // fog: unseen enemies are not on the map either
    ctx.fillStyle = s.owner === 0 ? '#bdf0ff' : s.owner === 2 || s.disg > 0 ? (s.slot === 'worker' ? '#f2a64c' : '#ffffff') : '#ff8a80';
    const r = (s.slot === 'worker' ? 1.3 : s.slot === 'hero' ? 3 : 2.1) * u;
    ctx.beginPath(); ctx.arc(px(s.x), pz(s.z), r, 0, 6.29); ctx.fill();
  }
  // What the camera is looking at: a box round the target, turned with the camera's yaw.
  const half = CAM.dist * 0.45;
  ctx.save(); ctx.translate(px(CAM.tx), pz(CAM.tz)); ctx.rotate(-CAM.yaw);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * u;
  ctx.strokeRect((-half / MAP.w) * W, (-half * 0.8 / MAP.h) * H, ((2 * half) / MAP.w) * W, ((1.6 * half) / MAP.h) * H);
  ctx.restore();
}

function toWorld(e) {
  const r = cv.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * MAP.w - MAP.w / 2, ((e.clientY - r.top) / r.height) * MAP.h - MAP.h / 2];
}
let drag = false;
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); drag = true; cv.setPointerCapture(e.pointerId); focus(...toWorld(e)); acc = 0; });
cv.addEventListener('pointermove', (e) => { if (!drag) return; e.preventDefault(); e.stopPropagation(); focus(...toWorld(e)); acc = 0; });
const end = (e) => { drag = false; e.stopPropagation(); };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
window.addEventListener('resize', () => { W = 0; });

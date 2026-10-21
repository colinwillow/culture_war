// Sound effects synthesised with WebAudio: no audio files to download. Phones only allow sound after a user
// gesture, so the context is created/resumed on the first tap anywhere. Each sound is throttled (a battle fires
// dozens of hits a second) and quieter the further it is from where the camera looks.
let ctx = null, master = null, muted = false;
try { muted = localStorage.getItem('cw-mute') === '1'; } catch (e) {}

function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}
window.addEventListener('pointerdown', unlock, { capture: true });

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('cw-mute', m ? '1' : '0'); } catch (e) {}
  if (master) master.gain.value = m ? 0 : 0.5;
}

const last = {};
function ok(key, gap) { const t = performance.now(); if (last[key] && t - last[key] < gap) return false; last[key] = t; return true; }

let noiseBuf = null;
function noise() {
  if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; return s;
}
function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function tone(type, f0, f1, dur, vol, delay = 0) {
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, 0.005, vol, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function burst(dur, vol, fc, q = 1, delay = 0) {
  const t = ctx.currentTime + delay, s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.setValueAtTime(fc, t); f.frequency.exponentialRampToValueAtTime(Math.max(60, fc * 0.2), t + dur); f.Q.value = q;
  env(g, t, 0.004, vol, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}

/** Play a named sound. k = loudness 0..1 (distance falloff is applied by the caller). */
export function sfx(name, k = 1) {
  if (!ctx || muted || ctx.state !== 'running' || k < 0.05) return;
  switch (name) {
    case 'thud': if (ok(name, 70)) { tone('sine', 140, 60, 0.12, 0.35 * k); burst(0.06, 0.15 * k, 900); } break;
    case 'pop': if (ok(name, 60)) { burst(0.08, 0.3 * k, 3000); tone('square', 900, 200, 0.05, 0.05 * k); } break;
    case 'ding': if (ok(name, 90)) { tone('triangle', 1320, 1320, 0.18, 0.18 * k); tone('triangle', 1760, 1760, 0.25, 0.12 * k, 0.07); } break;
    case 'boom': if (ok(name, 150)) { tone('sine', 90, 30, 0.6, 0.6 * k); burst(0.7, 0.5 * k, 1200); } break;
    case 'chime': tone('triangle', 660, 660, 0.15, 0.15 * k); tone('triangle', 880, 880, 0.15, 0.15 * k, 0.1); tone('triangle', 1320, 1320, 0.3, 0.15 * k, 0.2); break;
    case 'sting': tone('sawtooth', 220, 440, 0.35, 0.12 * k); tone('square', 330, 660, 0.35, 0.08 * k, 0.05); burst(0.3, 0.12 * k, 2500); break;
    case 'whoosh': burst(0.5, 0.25 * k, 1800, 4); break;
    case 'blip': if (ok(name, 120)) tone('sine', 520, 780, 0.08, 0.1 * k); break;
    case 'tap': if (ok(name, 40)) tone('sine', 700, 500, 0.04, 0.08 * k); break;
  }
}

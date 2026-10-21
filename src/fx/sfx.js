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
    case 'fanfare': tone('triangle', 523, 523, 0.14, 0.16 * k); tone('triangle', 659, 659, 0.14, 0.16 * k, 0.12); tone('triangle', 784, 784, 0.4, 0.18 * k, 0.24); tone('square', 392, 392, 0.5, 0.05 * k, 0.24); break;
    case 'scratch': burst(0.12, 0.25 * k, 3500, 6); burst(0.1, 0.22 * k, 1800, 6, 0.14); break;
    case 'siren': if (ok(name, 1500)) { for (let i = 0; i < 3; i++) { tone('square', 700, 980, 0.32, 0.05 * k, i * 0.64); tone('square', 980, 700, 0.32, 0.05 * k, i * 0.64 + 0.32); } } break;
    case 'tap': if (ok(name, 40)) tone('sine', 700, 500, 0.04, 0.08 * k); break;
  }
}

// Voice barks when you give an order: a two-syllable "hup!" made of a buzzy voice through a vowel filter.
// Each faction has its own pitch and contour (Backwoods low "yee-HAW" rise, Old Money a snooty fall, Street Crew
// a quick "yo-yo"...). Attack orders are louder and higher; vehicles honk instead; heroes are lower.
const VOICE = { bw: [130, 1.5, 700], ac: [250, 1.15, 1100], hh: [115, 0.9, 600], om: [190, 0.7, 900], sc: [210, 1.25, 1000] };
function syll(f0, f1, vowel, t0, dur, vol) {
  const t = ctx.currentTime + t0, o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  bp.type = 'bandpass'; bp.frequency.value = vowel; bp.Q.value = 4;
  env(g, t, 0.012, vol, dur); o.connect(bp); bp.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
export function bark(f, slot, attack) {
  if (!ctx || muted || ctx.state !== 'running' || !ok('bark', 260)) return;
  if (slot === 'cav' || slot === 'siege') { tone('square', attack ? 520 : 440, attack ? 520 : 440, 0.09, 0.07); tone('square', attack ? 660 : 440, attack ? 660 : 440, 0.12, 0.07, 0.12); return; }
  const [p, c, v] = VOICE[f] || VOICE.ac, base = p * (slot === 'hero' ? 0.75 : 1) * (attack ? 1.2 : 1) * (0.94 + Math.random() * 0.12), vol = attack ? 0.22 : 0.15;
  syll(base, base * (c > 1 ? 1 : c), v, 0, 0.08, vol);
  syll(base * (c > 1 ? 1 : 1.1), base * c, v * 1.3, 0.1, attack ? 0.16 : 0.12, vol);
  if (f === 'sc') syll(base * 1.1, base * 1.3, v * 1.3, 0.24, 0.08, vol * 0.8);
}

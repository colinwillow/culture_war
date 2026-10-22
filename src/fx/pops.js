// Impact flashes shared by the arena and the RTS: camera-facing additive sprites (a starburst glow, and a slash streak
// laid along the swing) that pop and fade. One module so a tweak to the look lands in both games.
import * as THREE from 'three';

export const flashTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, '#fff'); g.addColorStop(0.25, 'rgba(255,240,200,.9)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 4; i++) { x.save(); x.translate(64, 64); x.rotate((i * Math.PI) / 4); x.beginPath(); x.moveTo(-64, 0); x.lineTo(0, -5); x.lineTo(64, 0); x.lineTo(0, 5); x.fill(); x.restore(); }
  return new THREE.CanvasTexture(c);
})();
export const slashTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(0, 16); x.quadraticCurveTo(128, 2, 256, 16); x.quadraticCurveTo(128, 30, 0, 16); x.fill();
  return new THREE.CanvasTexture(c);
})();

/** pops(scene, cap): pop(p, color, size, life, tex, angle, stretch) adds one; step(dt) ages them; clear() drops all.
 *  `cap` bounds how many live at once (the oldest goes first), so a big brawl cannot pile up draw calls. */
export function makePops(scene, cap = 64) {
  const list = [];
  function drop(i) { const q = list[i]; scene.remove(q.s); q.s.material.dispose(); list.splice(i, 1); }
  return {
    pop(p, color, size, life, tex = flashTex, angle = 0, stretch = 1) {
      if (list.length >= cap) drop(0);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, rotation: angle }));
      s.position.copy(p); s.renderOrder = 5; scene.add(s); list.push({ s, t: 0, life, size, stretch });
    },
    step(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const q = list[i]; q.t += dt; const k = q.t / q.life, grow = 1 - Math.pow(1 - Math.min(1, k * 2.2), 3);
        q.s.scale.set(q.size * grow * q.stretch, q.size * grow * (q.stretch > 1 ? 0.35 : 1), 1); q.s.material.opacity = Math.max(0, 1 - k);
        if (q.t >= q.life) drop(i);
      }
    },
    clear() { while (list.length) drop(list.length - 1); },
  };
}

/** Screen-space angle of the line a -> b (world points), for laying a slash streak along a swing. */
export function screenAngle(camera, a, b) {
  const p = a.clone().project(camera), q = b.clone().project(camera);
  return Math.atan2((q.y - p.y) / camera.aspect, q.x - p.x);
}

// Soft fog of war (gaps.md A8, render-only): an enemy squad is drawn, and shown on the minimap, only while one of
// YOUR squads or buildings is within reach of it. The sim knows everything (lockstep needs that); only what you see
// changes. The city's own people are always visible: the city is the star. Off switch: localStorage cw-fog = '0'.
export const FOG = { on: true, squad: 40, bld: 30 };
try { FOG.on = localStorage.getItem('cw-fog') !== '0'; } catch (e) {}
export function seen(S, x, z) {
  if (!FOG.on) return true;
  const r2 = FOG.squad * FOG.squad, b2 = FOG.bld * FOG.bld;
  for (const q of S.squads) if (q.owner === 0 && !q.dead) { const dx = q.x - x, dz = q.z - z; if (dx * dx + dz * dz < r2) return true; }
  for (const b of S.blds) if (b.owner === 0 && b.built >= 1) { const dx = b.x - x, dz = b.z - z; if (dx * dx + dz * dz < b2) return true; }
  return false;
}

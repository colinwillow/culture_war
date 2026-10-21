// Local (per-player, non-sim) UI state: what's selected, what's being placed, which power is aimed.
import { getSim } from '../sim/sim.js?v=46';

export const UI = {
  sel: null, // {type:'sq', ids:[...]} | {type:'bld', id}
  armed: null, // index of a targeted power waiting for a tap
  place: null, // {kind, x, z, ok} while placing a building
  buildMenu: false,
  lastTap: { t: 0, id: 0 },
};
export function select(sel) { UI.sel = sel; UI.buildMenu = false; }
export function selSquads() {
  const S = getSim();
  if (!S || !UI.sel || UI.sel.type !== 'sq') return [];
  const out = UI.sel.ids.map((id) => S.squads.find((s) => s.id === id)).filter(Boolean);
  UI.sel.ids = out.map((s) => s.id);
  return out;
}
export function resetUI() { UI.sel = null; UI.armed = null; UI.place = null; UI.buildMenu = false; }

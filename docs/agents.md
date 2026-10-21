# Running parallel agents on this repo

Parallel agents work here only because each area lives in its own files and talks to the rest through a fixed
contract. Give each agent ONE lane, tell it which files it owns, and tell it not to edit files outside its lane.
If a lane needs a change in someone else's files, it writes the request in its summary instead of editing.

| Lane | Owns (may edit) | Must not change | Contract it relies on |
| --- | --- | --- | --- |
| Game logic (keep in the main session) | `src/sim/*`, `src/config/factions.js` | render, ui | — (it defines the contract) |
| Map / level | `src/map/layout.js`, `src/render/world.js` | sim rules | `walkH()`, `BLOCKS`, `NODES`, `BASES`, rotational symmetry |
| Effects & projectiles | `src/fx/fx.js` | sim | `S.events` shapes listed in `handleEvents` |
| UI / menus | `src/ui/*`, `index.html` | sim | `command()` types, `Q.*` queries |
| Unit & building visuals | `src/render/models.js`, `src/render/sync.js` (visual parts only) | sim | `makeMember(f, slot)`, `bldMesh(kind, f)`, `nodeMesh()` return a Group, feet at y=0, facing +z |
| Camera & input feel | `src/camera/*`, `src/input/*` | sim | `command()` |

Tips
- Run lanes on separate git branches/worktrees and merge one at a time.
- New sim events are the most common cross-lane need: the logic lane adds `S.events.push({k:'x', ...})`, the FX lane adds the visual.
- Real art: Colin's models replace `models.js` bodies; don't have agents "remodel" characters.

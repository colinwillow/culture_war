# Culture Wars

Live real-time strategy game for mobile (three.js + Vite, plain JS ES modules). Structure is modeled on
*The Lord of the Rings: The Battle for Middle-earth II* (Xbox 360): build a base, gather money, train squads,
level up buildings, fight live. The twist: factions are lighthearted, blocky, cartoon tropes of modern
subcultures (Backwoods/rednecks, Activists, Nerds, Old Money, Street Crew, Hard Hats...) fighting over a city.

Owner: Colin (colinwillow). He is the artist/animator; strongest on art, animation and feel, and asked for the
most help on game logic. Full design: `docs/design.md`. History of decisions and feedback: `docs/decisions.md`.

## Run
```
npm install
npm run dev            # vite --host, open on phone over LAN
npm run build          # normal build -> dist/
npm run build:artifact # single self-contained HTML -> dist-artifact/index.html (for sharing as one page)
```

## Working rules (from Colin — follow these)
- **Workflow:** make the requested change quickly, say it is unverified, and let Colin playtest on his phone and
  report back. Do not run long self-playtests. A quick load check that the page boots without errors is fine.
- **Mobile first.** Must play in both portrait and landscape. Desktop browser later.
- **Always lock page zoom** (no accidental double-tap / pinch page zoom). See `lockPageZoom()` in `src/input/input.js`.
  Pinch-to-zoom is the in-game camera, handled on the canvas.
- **No physics libraries** (no Rapier, cannon-es, three-mesh-bvh). Collision/pathing is hand-written (`src/map/grid.js`).
- **Units:** 1 unit = 1 metre, Y up. Humans ~1.6 m.
- **Show, don't label.** Every power/ability must read from the animation alone. No words on screen to explain an
  effect. Overlap between factions is fine; the exaggerated on-trope visual is what makes each one distinct.
- **UI must be painfully obvious:** big icon buttons, no click-through tutorial popups. Current icons are
  placeholders; real button art will be image-generated later. Long-press any button shows its name (dev aid).
- **App Store safe:** factions are lifestyles/subcultures, never race, religion, ethnicity or gender. Every faction
  is mixed-race and mixed-gender. No real people. Roast every faction equally.
- Colin's characters are usually rigged on the Mixamo skeleton; textures 512–2K; keep files under ~20 MB.
- Don't add explanatory text to the game screen; don't make placeholder art fancier than needed — real models
  will replace `src/render/models.js`.

## Architecture (module contracts)
The sim never touches three.js or the DOM. Everything else reads the sim and talks to it only through commands.

| Module | Owns | Talks to others via |
| --- | --- | --- |
| `src/config/factions.js` | All balance numbers, unit/building/power data, names | imported read-only |
| `src/map/layout.js` | City layout data (blocks, avenues, freeway trench, overpasses, businesses, trees, parked cars), `walkH()` | imported read-only |
| `src/map/grid.js` | Walkability grid, A* `findPath`, `nearestFree`, `lineClear` | sim calls it |
| `src/sim/sim.js` | Match state `S`, fixed-step `step()`, `command(player, cmd)`, read-only `Q.*` queries, `S.events` | commands in, events out |
| `src/sim/ai.js` | Computer opponent (runs inside the tick) | sim internals |
| `src/render/scene.js` | three.js renderer/scene/camera + mesh helpers | — |
| `src/render/world.js` | Static city meshes + ambient freeway traffic | reads layout |
| `src/render/models.js` | **Placeholder unit/building/business models** (fallback + vehicles/heroes/buildings) | returns THREE.Group |
| `src/render/chars.js` | **Colin's real characters**: `CHARS` (files), `CAST` (who plays which unit + hand prop), `CLIPS` (donor clips retargeted onto every Mixamo rig) | `makeChar(f, slot, i)`, `play(g, state)` |
| `src/render/sync.js` | Mirrors sim state into meshes each frame; placement ghost | reads sim + UI state |
| `src/fx/fx.js` | Visual effects, driven by `S.events` | `handleEvents(S, bump)` |
| `src/camera/camera.js` | RTS camera, ghost cam (pitch flattens as you zoom in) | — |
| `src/input/input.js` | Pointer/keyboard on the 3D view -> `command()` | sim commands, UI state |
| `src/ui/*` | HUD, buttons, floating placement confirm, tooltips, icons, CSS | sim commands + `Q.*` |

Rules that keep this multiplayer-ready (lockstep):
- The sim uses only `S.rng` (seeded), never `Math.random`. Render/FX may use `Math.random`.
- UI/input never mutate sim objects. They call `command(0, {type: 'move'|'attack'|'gather'|'train'|'upgrade'|'build'|'power'|'sit', ...})`.
  Commands apply at the start of the next tick.
- New mechanic = sim change + `S.events.push({k: '...'})` + a case in `fx/handleEvents`.

## Current state (greybox 04)
- Backwoods vs Activists, one city map, Versus vs computer. Win by destroying the enemy HQ.
- City map: 120 x 200 m, rotationally symmetric. Sunken freeway across the middle, crossable only at 3 overpasses.
  Each base sits behind a wall of buildings with 2 openings (one avenue is a dead end). Parks and a parking lot are
  the open fighting areas. 10 businesses (food trucks): 2 safe per side, 3 contested per side.
- Workers ("Odd-Jobbers" / "Gig Workers") auto-work shifts at businesses and carry cash home.
- Free building placement (ghost + floating confirm/cancel next to it), build radius from owned buildings.
- Buildings: HQ (trains workers + hero), Depot (income + army cap + drop-off), Barracks (3 levels), Tower.
- Squads, counter loop, ranks, power meter, faction powers (Mud Bog, Fourth of July, Parade, Pie in the Face).
- One-finger drag pans; hold-then-drag box selects; pinch zoom + twist rotate; eye button = ghost cam.

## Real characters (greybox 04)
- GLBs live in `public/models/characters/` (copied from the weirdport repo), Draco decoder in `public/draco/`.
- Most of the cast has no clips of its own. Clips come from three DONOR files (`fat_biker_02` idle/walk/run/hit/fall,
  `contruction_worker` swings, `dummy_officer` shoot) and are retargeted by bone name (same method as weirdport's
  `retarget`: rotation tracks shared, one constant rotation at the Hips, Hips travel dropped because the sim moves units).
- Height is measured off the raw skin GEOMETRY, never `Box3.setFromObject`/`matrixWorld` (armature carries 0.01).
- Props are attached to `mixamorig_RightHand` and point model-forward at bind.
- Everything falls back to the box placeholders if loading fails (the single-file artifact build cannot fetch GLBs).
- `fat_trump.glb` from weirdport is deliberately NOT used: no real people / politicians (App Store rule above).

## Next steps Colin has asked about
- More passes on UI (generated button art), map feel, unit visuals/animation, attack effects (mostly code-driven particles).
- More real models: vehicles (monster truck, bikes), heroes, buildings; other factions from the weirdport cast.
- Fill out the other launch factions: Nerds, Old Money, Street Crew, Hard Hats (template = Backwoods).
- Game modes (Versus, Capture and Hold, King of the Hill, Resource Race, Hero vs Hero). Multiplayer later.
- Possible later: possess a unit in first/third person. Alien-races edition on the same engine.

Parallel agents: see `docs/agents.md` for how to split work without collisions.

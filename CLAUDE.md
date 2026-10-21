# Culture Wars

Live real-time strategy game for mobile (three.js + Vite, plain JS ES modules). Structure is modeled on
*The Lord of the Rings: The Battle for Middle-earth II* (Xbox 360): build a base, gather money, train squads,
level up buildings, fight live. The twist: factions are lighthearted, blocky, cartoon tropes of modern
subcultures (Backwoods/rednecks, Activists, Nerds, Old Money, Street Crew, Hard Hats...) fighting over a city.

Owner: Colin (colinwillow). He is the artist/animator; strongest on art, animation and feel, and asked for the
most help on game logic. Full design: `docs/design.md`. History of decisions and feedback: `docs/decisions.md`.

## Run
**GitHub Pages serves `main` as-is, with no build** (https://colinwillow.github.io/culture_war/). So the source must run
unbuilt in a browser: `three` and its addons resolve through the import map in `index.html` to `vendor/three/`
(copied from node_modules, three 0.160), CSS is a `<link>`, and nothing may use `import.meta.env` or import CSS/JSON
from JS. Assets (`models/`, `draco/`) sit at the repo root and are fetched relative to the page. New three addon =
copy it into `vendor/three/jsm/` too. Push to `main` = live on his phone.
**Run `npm run bump` before EVERY push.** It raises `version.json`'s build, stamps `?v=N` on every relative
script/CSS URL, and writes `B<N>` on the menu title. Without it iOS Safari runs the new `index.html` against cached
OLD modules (seen: dead team buttons, then "ERROR could not load src/main.js"). Boot errors print in a red box on the
menu (`#bootErr`), because a phone has no console; ask him for a screenshot of it.
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

## Current state (greybox 04, build B112 — overnight loop Oct 21 2026; see ROADMAP.md + docs/decisions.md)
- **6 playable factions** (menu: 2 columns portrait, one row landscape): Backwoods, Activists, Hard Hats (builder),
  Old Money (elite squads of 3, Trust Fund), Street Crew (rush, Hype meter, breakdancers attack by dancing), Nerds
  (tech: +30% towers, Wi-Fi Outage / Patch Notes). Opponent is random from the other five. Difficulty 1/2/3 stars.
  Per-faction traits live in `FACTIONS[f].traits`; `docs/design.md` has the table.
- **Modes**: Versus (destroy the HQ), King of the Hill (`S.hill`: middle overpass, 90 s held alone wins; ring + flag
  + HUD bars), Resource Race (`S.race`: first to earn 2500) and Capture and Hold (`S.cap`: 3 flags, holding more drains
  the other's 300 counter). All shown on the minimap. Toggle row beside/under the stars, remembered in
  localStorage (`cw-mode`, `cw-diff`). Every hero has its own ability (`heroAbility` in sim.js).
- Economy: workers auto-work food trucks (trucks tint to who works them); workers can be ordered to **repair** buildings.
- Buildings: HQ, Depot, Barracks (3 levels), Tower (can be **garrisoned** by one squad: +range/+dmg; the AI does it
  too). Rally flags per production building. Production queue with tap-to-cancel refunds. Build-zone preview.
- Squads: counter loop, ranks (+hero levels 1-5), guard/leash aggro, stance toggle, heal at own HQ/depot, power meter +
  2 powers per faction, hero abilities (eagle screech, bullhorn, overtime whistle, DJ drop the beat).
- AI (`src/sim/ai.js`, `aiStep(S, dt, pi)`): expands, escorts, retreats wounded, garrisons towers, plays the hill.
- Input: one-finger pan, hold-then-drag box select, hold still = select army on screen, pinch zoom/twist, minimap,
  under-attack edge arrow, hero button, pause (auto on tab switch), command cards. Orders get a voice bark.
- Render/FX: pooled particles (`src/fx/particles.js`), one shadow sun following the camera, time of day
  (`setTimeOfDay`/`setDusk`), city life, construction/damage/collapse, per-faction projectiles/powers/buildings,
  end-of-match camera swoop onto the fallen HQ (or the hill) + victory dance, match intro fly-over (tap skips), rain on
  ~1 in 4 matches (`setRain`), pedestrians, hero entrance spotlight, death flourishes, faction-coloured HUD (`--fc`),
  power aim ring. Pause screen has quit-to-menu; end screen has rematch.
- Perf: placeholder buildings merge their static boxes per material at spawn (`mergeStatic` in sync.js); a busy
  mid-match frame is ~160-190 draws / ~790k tris (tris are the real characters + shadow pass). Menu graphics toggle
  (`cw-low`): LOW = no shadows, pixel ratio 1, no rain/pedestrians.
- Audio: WebAudio synth SFX + voice barks only (`src/fx/sfx.js`), mute toggle on menu/pause.
- Test harness used by the loop: fast-forward with `import('./src/sim/sim.js?v=N')` + `step()` in a headless page;
  balance: `node tools/balance.cjs [seeds]` (AI vs AI round robin).

## Real characters (greybox 04)
- GLBs live in `models/characters/` (copied from the weirdport repo), Draco decoder in `draco/` (both repo root).
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
- All six launch factions exist; next is real art for their vehicles/heroes/buildings and more modes.
- Game modes (Versus, Capture and Hold, King of the Hill, Resource Race, Hero vs Hero). Multiplayer later.
- Possible later: possess a unit in first/third person. Alien-races edition on the same engine.

Parallel agents: see `docs/agents.md` for how to split work without collisions.

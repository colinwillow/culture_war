# Decisions and feedback log

Newest first. Colin's feedback in his words where it matters.

## Greybox 04 (Oct 21, 2026)
- B16 (overnight loop): powers pass: Fourth of July fires 6 rockets on high arcs with spark trails, then aerial star shells bloom over the target; mud bog bubbles and spits the whole time; Parade fires confetti cannons from every squad; Pie leaves a whipped-cream splat with flying cream
- B15 (overnight loop): smarter computer: after ~70 s it sends a third of its workers to the richest contested truck on its half with an escort squad guarding it; badly hurt squads retreat home. New rule for BOTH sides: squads standing by their own HQ/depot with no enemy near heal 4%/s (green sparkles)
- B13 (overnight loop): food trucks show who works them: ring, awning and a rippling flag on the sign pole turn blue (yours) / red (theirs), flash blue-red when both sides' workers are on it, gold when nobody is
- B12 (overnight loop): minimap top-left under the chips: city blocks, trench, businesses (gold), buildings (blue/red squares), squads (dots), white camera box; tap or drag on it to fly the camera there
- B11 (overnight loop): rally flags: select a barracks/HQ and tap the ground to plant its flag (waving cloth + dotted trail, shown while selected); new squads from it muster there in a tight cluster (workers still go to work)
- B10 (overnight loop): building damage: dark smoke under 50% hp, flames + trembling under 25% (both scale with damage); a destroyed building sinks and keels over in a dust cloud, leaving a rubble heap that lingers ~20 s
- B9 (overnight loop): heroes: eagle rebuilt with white head/tail, talons and pivoting wings - glides, beats hard when moving, swoops down talons-first on every strike; march leader raises his bullhorn arm to shout and his blasts roll pink rings onto the target
- B8 (overnight loop): vehicles move: monster truck chassis rides visible shocks (bob/pitch/roll, rears up on a hit), wheels roll with ground speed (hub bars show the spin), dust trails behind truck + fireworks cart; bike collective pedals faster with speed
- B7 (overnight loop): production queue strip: one round icon per order, front one fills a green ring; tap an icon to cancel it (full refund + coin pop); portrait above the dock, landscape beside it
- B5 (overnight loop): idle squads guard a post: engage within 10 m, break off past a 14 m leash and walk back (only fighting back point-blank on the way)
- B4 (overnight loop): city life: trees sway, traffic lights cycle at intersections, manholes puff steam, bird flocks circle the parks
- B3 (overnight loop): order marker (chevrons slide in, arrow bounces onto the spot) and ordered squads answer with a hop
- B2 (overnight loop): pooled particles (`src/fx/particles.js`, one InstancedMesh): melee sparks + dust, muzzle flash + tracer slug, coin fountain on deposit.
- **Runs on GitHub Pages unbuilt.** Colin opened Pages and got bare unstyled HTML: Pages served the raw source, which
  needed Vite. Now an import map + vendored three make `main` playable directly.
- **Real characters in.** Colin: borrow the example models from the weirdport repo so this starts looking like a game.
  Backwoods: hick (workers, pitchfork farmers, shotgun hunters), fat bikers (bar brawlers). Activists: fat activist,
  hippie, hipster (gig workers, sign wavers, picket line, megaphone crew). Vehicles, bikes and heroes still placeholders.
- Animation states: idle / walk / run (by ground speed), attack swing/stab/shoot on each hit event, hit flinch, fall on death.
- The Trump model is not used (no real politicians, App Store 1.1.1). Secret service / firefighter / officer / construction
  worker are candidates for Old Money and Hard Hats.

## Greybox 03 (Oct 20, 2026)
- Moved into this repo, split into modules (see CLAUDE.md). Sim is deterministic and command-driven for future multiplayer.
- **Placement confirm/cancel now float next to the building ghost** (Colin: the yes/no should be up next to where the building is being placed, not in the lower corner).
- **Map rethemed to a city** (Colin: it's a culture war, the map should be urban; grassland read as knights and castles).
  Sunken freeway with 3 overpasses splits the map; bases sit behind building walls with two openings; parks and a parking lot are the open fights; food trucks are the businesses workers work at.
- Long-press any button to see its name (Colin didn't understand what the placeholder icons meant). Real button art will be image-generated later.
- Colin wants many more passes on UI, the level, unit movement/animation and attack effects (mostly code-driven particles). He sees the greybox "dance" of moving characters as worth the time even though art is the selling point.

## Greybox 02
Colin's feedback on 01 ("like a little board game"):
- Wants a fully developed 3D map, angled-down third-person-game look, not a flat board.
- Wants to zoom right down to watch battles up close, a "ghost" camera; maybe later possess a unit in first/third person (left out for now).
- Building placement must be free and strategic (choose where; openings and chokepoints matter), not preset circles.
- Wants workers going out to gather money (equivalent of mining/lumber).
- One-finger drag must pan the map (box-select moved to hold-then-drag).
- Units should run out from the base; bases shouldn't start right in front of each other.
- Menus need to be much better.
Built: terrain map with river/fords, free placement with ghost + confirm, workers + resource piles, towers, one-finger pan, ghost cam, rally point.
Bug in 02: duplicate function name broke the script (faction screen did nothing) — fixed.

## Greybox 01
First playable: Backwoods vs Activists, flat board, preset build pads, Versus vs computer.

## Design conversation (before code)
- Live RTS like BFME II / Warcraft, not Clash-style async raids, not turn-based.
- Factions are subculture tropes; keep it light; App Store 1.1.1 safe (no race-coded factions, no real politicians).
  "Gangsters" reframed as Street Crew: hip-hop, streetwear, car culture, open to anyone.
- Merged similar groups (goth/emo/punk -> Alt Kids; skate/surf/snow -> Shredders; rednecks + patriots -> Backwoods).
- Launch six chosen by Colin: Backwoods, Nerds, Old Money, Street Crew, Activists, Hard Hats.
- Powers must be visual ("Cancel" as a word on screen fails; Colin liked the Cancel idea itself though).
- Alien-races edition is a planned second game on the same engine.
- Parallel agents ("ultracode"): only after the code is split into modules with clear contracts; keep game logic in one place. See agents.md.

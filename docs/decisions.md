# Decisions and feedback log

Newest first. Colin's feedback in his words where it matters.

## Greybox 04 (Oct 21, 2026)
- B46 (overnight loop): ka-ching: while a worker is on shift at a food truck, a gold coin flips up off them about once a second with a white glint, so a working truck reads as earning at a glance
- B45 (overnight loop): city traffic: little cars cruise the open stretches of each avenue (keeping right, crossing the overpasses, U-turning at dead ends), brake for red lights at intersections and wait if troops are in the road ahead - render only, no gameplay effect
- B44 (overnight loop): hold to grab the army: press and hold still on the map - a green ring fills under your finger; let go once it's full to select every army squad on screen (workers and garrisons left out). Drag instead and it's the usual box select
- B43 (overnight loop): eagle Screech: three sound rings roll out at bird height and on the ground in quick succession, a small camera kick, and a burst of brown/white feathers drifts down; stunned squads (anyone, any stun) wobble dazed on the spot until it wears off
- B42 (overnight loop): tower shots by faction: Deer Stand fires a heavy slug with a fat puff of gunsmoke off the stand; Banner Tower lobs paint balloons that burst into bright splats (pink/teal/gold/blue) with droplets, fading after a few seconds
- B41 (overnight loop): pigeons: little grey flocks peck around the park grass; walk any squad within ~4 m and they burst up and away flapping, circle off, then glide back down to their spot a few seconds later (one instanced draw for all of them)
- B40 (overnight loop): build zone preview: while placing a building, each of your finished buildings shows the 26 m circle you're allowed to build in - faint green fill with a slowly turning dashed rim; disappears when you confirm or cancel
- B39 (overnight loop): Rally made visible: thin pink lines link every pair of Activist squads close enough to rally each other (same 8 m as the bonus), gently pulsing and bobbing - more lines = bigger damage bonus
- B38 (overnight loop): Junkyard made visible: a destroyed monster truck or fireworks cart leaves a charred, tilted husk with its wheels knocked off, smoking (flames at first) for ~20 s before it sinks away - next to the existing coin pop for the 50% scrap refund
- B37 (overnight loop): food trucks open for business: a box vendor in a paper hat leans out of the side hatch, bobbing and looking around; the awning flaps; the grill puffs steam - all of it stops once the truck sells out
- B35 (overnight loop): difficulty: 1/2/3-star picker above the team buttons (remembered on the phone). Easy: computer earns 70%, first wave at 30 cp, caps at 32. Normal: as before. Hard: 135% income, first wave at 14 cp, waves grow to 60
- B34 (overnight loop): pause: round pause button top-right freezes the sim and every animation and dims the screen behind a big play icon; tap anywhere on the dim to resume; the game also auto-pauses when you switch away from the tab
- B33 (overnight loop): parade puppet rebuilt with a separate head (eyes + red mouth) and floppy arms on shoulder pivots - arms swing out of phase, head bobs/tilts/looks around (bigger while walking), both arms flop down onto the target on a hit; fireworks cart leaves a lingering grey smoke cloud after each launch
- B32 (overnight loop): camera shake: a building collapsing, a Fourth of July barrage landing and each monster truck slam kick the view; strength fades with distance from where you're looking and dies out in a fraction of a second
- B31 (overnight loop): victory cheer: ~1.6 s after a squad's last swing, if no enemy is left within 12 m it hops three times; Activists throw confetti, Backwoods fling their caps into the air (they bounce on the ground)
- B30 (overnight loop): garrison towers: with infantry selected, tap your finished tower - one squad walks in and vanishes, three tiny team-coloured lookouts appear on the roof, the tower gets +4 range and +50% damage; select the tower and tap the squad portrait to send them out (they also pop out if the tower falls)
- B29 (overnight loop): construction: real yellow scaffolding (poles + plank rings) climbs ahead of the rising walls, crates lob in from the ground, hammer sparks flash along the top; when done the scaffold drops into the ground in a dust ring
- B28 (overnight loop): under-attack alert: when your squads/buildings take hits off-screen, a pulsing red arrow sits on the screen edge pointing at the fight (newest wins, fades 5 s after the last hit); tap it to fly the camera there
- B27 (overnight loop): worker kit: the Odd-Jobber (hick) pushes a wheelbarrow whose wheel rolls with speed and fills with cash bundles on the way home; the Gig Worker (hipster) wears a teal delivery bag that bulges and pulses with cash sticking out; replaces the floating gold box for them
- B26 (overnight loop): stance toggle: a big button on the squad card flips the selection between aggressive (crossed blades: guard radius + leash as before) and hold ground (planted flag: only hits what is already in weapon range, never steps off its spot); held squads show a small blue flag
- B25 (overnight loop): freeway traffic: every car/truck has warm headlights and red taillights facing the way it drives; cars passing under an overpass with troops on it honk - a bounce and a little yellow toot
- B24 (overnight loop): footstep dust kicks up behind running infantry (more members = more dust) and a skid puff spurts forward round their feet when a squad pulls up from a run; no water in the trench so no splash
- B23 (overnight loop): idle fidgets: standing box people now look around, stretch both arms up or scratch their head every few seconds (each on its own timer), and stop the moment they move or fight
- B22 (overnight loop): command card: one portrait per selected squad (up to 6) with alive/dead member dots, a green-amber-red health bar and gold rank stars; tap a portrait to pick just that squad and fly the camera to it
- B21 (overnight loop): veterancy: heroes level up to 5 (kills 4/10/18/28/40, +12% hp/dmg each) and grow 6% per level with a pulsing ring that turns gold at level 3; veteran squads wear a silver then gold ring; every rank-up throws a spiral of gold sparks
- B20 (overnight loop): lighting: warmer sun + cooler sky fill; ONE soft shadow-casting sun whose 80 m shadow box follows the camera (texel-snapped, no shimmer); only units and player buildings cast, ground/lawns/sidewalks receive
- B19 (overnight loop): end screen stats: four icon rows (kills, cash earned, buildings built, buildings razed), your blue bar vs their red bar growing in one after another, numbers pop in at the bar ends; sim now tracks per-player stats
- B17 (overnight loop): deaths + hit flash: box units get knocked back and up, tumble, bounce and sink (vehicles flip heavier); a wiped-out squad's last bodies finish falling instead of vanishing; every damaged member (box or real character) squash-pops with a red spark
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

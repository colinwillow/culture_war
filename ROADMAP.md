# Roadmap

## EVENING LOOP (Oct 22 2026) -- stop at 07:00 UTC (midnight Pacific, Colin's "about 12 tonight")
Loop rules: `git pull origin main`, read this file, take the FIRST unchecked item in THIS section, ship it as ONE build
(`npm run bump`, boot check of index.html AND duel.html, push to `main`), tick it with the build number, one line in
`docs/decisions.md`, end the pass. Too big? Split it here and ship the first half. Never ship a page that does not boot.
All builds are UNVERIFIED on the phone. Assets: Colin's own (weirdport, blender-addons pipeline); Tripo credits only if an
item says so.

### STEER (Colin, Oct 22 -- outranks everything below)
- "Keep making this game sick. Make sure the hits are landing. Make sure the gameplay is really interesting. Make sure
  there's slashes and particles. Make sure the colour system is sweet."
- "Start working on the map. Make the map cool, maybe do the hexagonal, maybe start making buildings."
- "Little stuff like leaves that blow in the wind, around the map, and when people swing stuff they push out of the way
  -- really low poly leaves and other debris. God rays for the sun, fog, atmosphere, an actual water shader."
- Standing rules: show, don't label; painfully obvious UI with one short word under each icon; portrait + landscape;
  App Store safe; the RTS sim stays deterministic (S.rng only).

### Items
- [x] (B159) Duel: weapon SLASH TRAILS (ribbon from the weapon's measured tip over the swing's active frames, team-tinted) + impact flashes that face the camera
- [x] (B162) Duel: hits that LAND -- resolve contact from the real weapon-tip / fist position against the defender's body (miss if it really missed), react direction from where it hit (front/side), stagger toward the push
- [x] (B171) Duel: ground FX -- dust puffs on footsteps/landings/knockdowns, scuff marks where a body hits the floor, debris kicked by the kick
- [x] (B174) Duel: colour system v2 -- both sides pick a team colour (palette of 6 with names-free swatches), weapon trails/sparks/HP bar take the team colour, tint threshold tuned so skin markings + paint shift but steel/leather never do
- [x] (B178) Duel: gameplay depth 1 -- guard meter (blocking drains it, guard break stuns), parry window right after a block lands (counter-attack), 2-hit combos
- [x] (B180) Duel: gameplay depth 2 -- footwork: circle/strafe, back-step out of range, dodge roll on a read; gunner strafes with the rifle strafe clips
- [x] (B166) Duel: BRAWL mode -- 2v2 and 3v3 in the ring (target choice, flanking), same rules
- [x] (B181) Atmosphere (arena first): wind-blown low-poly LEAVES + debris (instanced, cheap), pushed away by swings, bodies and knockbacks
- [x] (B183) Atmosphere: god rays (billboard sun shafts), height fog, warm/cool grade
- [x] (B188) Atmosphere: a small pond in the arena with a real WATER shader (waves, fresnel, foam ring), leaves float on it
- [x] (B189) Map: HEX prototype page (hexmap.html) -- a hex board of districts; inside each hex a small grid of square city blocks, roads leaving through the hex-edge midpoints (Colin: "roads tend to be more square")
- [x] (B189) Map: buildings on the hex districts -- low-poly procedural blocks per district type (downtown towers, shops, houses, park, industrial), varied silhouettes
- [x] (B189) Map: hex board under the globe bend (B153) -- does the little-planet look sell it?
- [x] (B191) Map: leaves/debris + god rays on the RTS map (reuse the arena code); no water body on this map (the hex city has water hexes); whether the hex board replaces the current map is Colin's call

### Items, batch 2 (added 02:50 UTC by the loop; same rules, same steer; the species-war direction from docs/roster.md v3)
- [x] (B193) RTS: the arena's slash trails + impact flashes + hitstop on squad fights near the camera (reuse duel.js code via a shared module; the sim is untouched)
- [x] (B194) Arena: KO moment -- slow-mo on the final blow, camera push-in on the loser, a beat before the winner's taunt; footstep sounds from weirdport's footsteps folder
- [ ] Arena: YOU vs one -- a left virtual stick to move, two big buttons (ATTACK / BLOCK), dodge on a stick flick; the AI fighter opposite; same rules
- [ ] Hex: street walkability grid + A* on the hex city, a dozen wandering civilians on its streets (the first step toward the hex board carrying the living city)
- [ ] Core: move the living city (stepCity/fires/civ/crew/cop/truck + alienVerb) from sim.js into src/core/city.js behind a tiny interface {rng, nearestFree, events}; prove no behaviour change with tools/balance.cjs on fixed seeds before and after (identical winners + times)
- [ ] Hex: two RTS squads spawn on the hex map and fight along its streets (the merge, first half: squads + pathing only, no economy)
- [ ] Arena: Spores verb prototype -- a GOO fighter: no weapon, spits a slowing puddle, splits into two smaller on death (placeholder body: the warrior tinted green, scaled .7)


## Earlier (overnight loop, Oct 21 2026)

### STEER (Oct 21)
- "Keep developing it: UI, game logic, particle effects, map, placeholder 3D animated objects."
- Show, don't label. Painfully obvious UI. Portrait + landscape. App Store safe. Sim stays deterministic (S.rng only).

## Items
- [x] (B2) FX: hit sparks + dust puffs on melee hits, muzzle flash + tracer on ranged, coin pop on deposit (pooled, cheap)
- [x] (B3) Units: selected squad gets a bounce/cheer on command; move-order ground marker (animated chevrons)
- [x] (B4) Map: animated city life — pedestrians-free ambient: swaying trees, blinking traffic lights, steam vents, birds
- [x] (B5) Logic: squads auto-acquire nearby enemies when idle (aggro radius) and return to post; no chasing across the map
- [x] (B7) UI: train queue shown as icons with progress rings on the barracks/HQ panel; tap to cancel (refund)
- [x] (B8) Placeholder vehicles: monster truck bounces on suspension, wheels spin, dust trail; bike collective pedal anim
- [x] (B9) Placeholder heroes: bald eagle wing flap + dive attack; march leader with bullhorn shockwave rings
- [x] (B10) FX: building damage states (smoke at <50%, fire at <25%), collapse into rubble pile on death
- [x] (B11) Logic: rally point per production building (tap ground after selecting building), shown as a flag
- [x] (B12) UI: minimap in a corner (tap to jump camera), shows squads, buildings, businesses, fog-free
- [x] (B13) Map: capture-flag business ownership ring colour + team awning tint so contested trucks read at a glance
- [x] (B15) Logic: AI improvements — expands to contested businesses, builds towers, retreats wounded squads
- [x] (B16) FX: power visuals pass — mud bog bubbles, fireworks streaks + bursts, parade confetti cannons, pie splat
- [x] (B17) Units: death ragdoll-lite (fling + fade) for placeholder units; hit flash on damaged members
- [x] (B19) UI: end-of-match screen with animated stats bars (kills, cash, buildings) — icons only
- [x] (B20) Map: day lighting pass — warmer sun, soft shadows on units only (one shadow-casting light, small map)
- [x] (B21) Logic: veterancy visuals + hero leveling (hero gains levels from kills, scales slightly, new ring)

## Batch 2 (added 10:12 UTC by the loop, same rules)
- [x] (B22) UI: selected squad's command card — unit portrait icon, member pips (alive/dead), rank stars; tap portrait to centre camera
- [x] (B23) Units: idle fidgets for box placeholders (look around, stretch, scratch) so a parked army never looks frozen
- [x] (B24) FX: footstep dust under running squads + skid puff when a squad stops; water splash in the trench? (skip if none)
- [x] (B25) Map: animated freeway traffic gets headlights/taillights + a honk bounce when units cross overpasses above
- [x] (B26) Logic: stance toggle per squad (aggressive / hold ground) as a big icon button on the card
- [x] (B27) FX: worker carry visuals — Odd-Jobber pushes a cash-filled wheelbarrow, Gig Worker a delivery bag that bulges with cash
- [x] (B28) UI: under-attack alert — a red pulsing edge arrow pointing to off-screen fights involving your stuff; tap it to jump there
- [x] (B29) Map: building construction animation — scaffolding rises, crates fly in, hammer sparks, then scaffold drops away
- [x] (B30) Logic: garrison towers — tap a squad onto your tower to boost its range/damage (visible: tiny figures on top)
- [x] (B31) Units: celebration when a squad wins a fight (nearby enemies gone): quick cheer/hop + confetti for Activists, hat toss for Backwoods

## Batch 3 (added 10:39 UTC by the loop, same rules)
- [x] (B32) FX: camera shake on big hits (building destroyed, fireworks, monster truck slam) — small, decays fast
- [x] (B33) Placeholder: parade puppet sways its arms + bobs its head as it walks; fireworks cart tubes smoke after each shot
- [x] (B34) UI: pause button (big icon, top-right) — freezes the sim, dims the screen; tap anywhere on the dim to resume
- [x] (B35) UI: difficulty picker on the menu — three big icons (easy / normal / hard) that change AI wave size + income
- [x] (B37) Map: food trucks come alive — grill steam, a vendor box-person behind the hatch, the awning flaps
- [x] (B38) FX: Backwoods Junkyard — destroyed Backwoods vehicles leave a smoking wreck husk for a while (the scrap refund made visible)
- [x] (B39) FX: Activists Rally — thin pulsing lines link nearby Activist squads while the rally bonus is active
- [x] (B40) UI: build-radius preview — while placing, a soft ring around each of your buildings shows where you are allowed to build
- [x] (B41) Map: pigeons in the parks scatter (fly up and away) when a squad walks through them, then settle back
- [x] (B42) FX: tower shots get faction flavour — Deer Stand fires a slug with a puff of smoke, Banner Tower throws a paint balloon splat

## Batch 4 (added 11:03 UTC by the loop, same rules)
- [x] (B43) Units: Backwoods hero Screech — the bald eagle's stun cry gets a visible shockwave (expanding sound rings + feathers) and stunned squads wobble
- [x] (B44) UI: tap-and-hold on empty ground = select all your army squads on screen (big friendly gesture; hold ring fills under the finger)
- [x] (B45) Map: overpass traffic — little cars also drive the city avenues (render only), stopping at the red lights
- [x] (B46) FX: worker gather sparkle — while a worker is on shift a chef-hat steam puff / cash register 'ka-ching' coin flips up every second
- [x] (B47) Logic: building repair — idle workers near a damaged own building fix it slowly (hammer sparks), costs a trickle of cash
- [x] (B48) UI: income ticker — the cash chip briefly flashes green and bumps when money comes in, red when spent
- [x] (B49) Placeholder: Bike Collective rides real bikes — frame triangle, handlebars, bell flash on attack; rider leans into turns
- [x] (B51) FX: projectile variety — Shotgun Hunters spray 3 pellets, Megaphone Crew fires visible sound-wave arcs
- [x] (B52) Map: weather — light drifting clouds casting moving soft shadow patches over the city (cheap: 3 big transparent decals)
- [x] (B55) UI: hero portrait button — a big round hero button appears once your hero exists; tap = select + jump to hero

## Batch 5 (added 11:28 UTC by the loop, same rules) — a third launch faction: HARD HATS (design.md: Turtle / builder)
- [x] (B56) Logic: Hard Hats faction data — units (Odd-job → Apprentice worker, Nail-gunners pike, Wrecking crew melee, Surveyors ranged, Forklift cav, Excavator siege, Foreman hero), building names, 2 powers (Road Closed cones wall, Wrecking Ball); builds 2x faster + Overtime. Opponent picked at random from the other two
- [x] (B57) UI: menu shows three faction picks (Hard Hats in safety orange with a hard-hat icon); end screen + HUD work for all three
- [x] (B58) Units: Hard Hats cast with Colin's construction worker GLB (it already has its own swing / carry / hit clips) + placeholder vehicles (forklift, excavator with swinging arm)
- [x] (B59) FX: Hard Hats powers visuals — Road Closed drops a line of traffic cones + barriers that block movement; Wrecking Ball swings in from the sky and smashes
- [x] (B60) Logic: Hard Hats building trait visible — their buildings go up with extra cranes/scaffold and repair themselves slowly
- [x] (B61) Map: Hard Hats base dressing — cones, barriers and a porta-potty around their HQ

## Batch 6 (added 11:42 UTC by the loop, same rules)
- [x] (B62) Audio: tiny WebAudio synth SFX (punch thud, gun pop, coin ding, explosion boom, power stingers) — no files, unlocked on first tap; mute toggle (speaker icon) on the menu + pause screen
- [x] (B63) Logic: The Foreman's own ability — Overtime whistle: nearby squads +20% speed and nearby own buildings train/build 2x for 10 s (hard-hat sparkle rings)
- [x] (B64) Logic: 4th launch faction OLD MONEY (Elite) data — few, expensive, strong units; buy instantly is too big, so: Hostile Takeover (enemy squad near the tycoon switches sides) + Private Jet drop (a squad of bodyguards lands)
- [x] (B65) Units: Old Money cast with Colin's fat_secret_service GLB (bodyguards, sunglasses vibe) + placeholders (golf cart cav, armoured limo siege, monocled tycoon hero)
- [x] (B66) Map: Old Money buildings (mansion HQ, bank-vault depot, country club barracks, guard booth tower) + menu pick + power visuals (money rain, jet flyover)

## Batch 7 (added 11:57 UTC by the loop, same rules)
- [x] (B66 docs) Docs: refresh CLAUDE.md "Current state" + docs/design.md with what is actually built now (4 factions, systems added overnight) so future sessions start from the truth
- [x] (B69) Logic: AI-vs-AI balance pass — fast-forward round-robin matches between all 4 factions (sim has no player input needed if both sides run the AI), nudge numbers where one faction always wins
- [x] (B70) UI: dev readout — tap the B# on the menu title to toggle a tiny FPS + unit-count line in the corner (helps judge phone performance)
- [x] (B71) Logic: STREET CREW (Rush) data — sneakerhead runners, breakdancers, boombox crew (sound-wave ranged), lowrider cav, graffiti tagger siege, DJ hero; powers Block Party (army buff) + Mixtape Drop (shockwave stun)
- [x] (B72) Units: Street Crew cast with Colin's moussa GLB (has hip-hop dance clips - breakdancers attack by dancing) + bouncing lowrider placeholder
- [x] (B73) Map: Street Crew buildings (record shop HQ, sneaker store depot, rec centre barracks, speaker-stack tower) + menu card + power visuals
- [x] (B74) FX: end-of-match cinematic — on victory/defeat the camera swoops to the destroyed HQ before the stats screen

## Batch 8 (added 12:24 UTC by the loop, same rules)
- [x] (B75) Logic: Street Crew traits made visible — the DJ's own ability "Drop the Beat" (nearby squads dance-cheer, +speed), Graffiti Tagger tags hit buildings (paint splats stay on walls)
- [x] (B76) Logic: Old Money balance — it won 1/24 in the B71 round robin; tune until it sits mid-pack again (rerun tools/balance.cjs)
- [x] (B77) UI: faction-coloured HUD accents — the power meter, selection rings and command card take your faction colour (5 factions now)
- [x] (B78) FX: unit voice barks — tiny synth "hup!" / cheer blips per faction pitch when a squad is ordered (throttled, respects mute)
- [x] (B79) Map: Street Crew base dressing — basketball court lines, a parked boombox and graffiti-tagged dumpsters round their HQ
- [x] (B80) Units: hero entrance — when a hero is trained, a short spotlight + faction flourish (eagle cry / bullhorn / whistle / jet / record scratch)
- [x] (B81) Logic: Hard Hats + Street Crew balance — after B76 they win 8/24 and 7/24 in tools/balance.cjs; nudge toward mid-pack without touching starting cash much

## Batch 9 (added 12:52 UTC by the loop, same rules)
- [x] (B82) Logic: AI garrisons its towers — when a fight comes near one of its towers, the AI sends its nearest ranged squad in
- [x] (B84) Map: time of day — the match slowly drifts from morning light to golden hour; street lamps and windows glow as it gets late
- [x] (B85) Logic: King of the Hill mode (sim) — a hill zone in the central park; holding it alone fills your bar, first to full wins; mode toggle on the menu (Versus / Hill)
- [x] (B86) UI: King of the Hill visuals — glowing ring that tints to the holder and flickers when contested, two progress bars in the HUD, AI goes for the hill
- [x] (B88) Logic: NERDS faction data (Tech) — LARPers, cosplay knights, drone pilots (ranged), segway cav, giant mech-suit siege, the Streamer hero; powers Wi-Fi Outage (enemy stun) + Patch Notes (army buff)
- [x] (B89) Units + Map: Nerds cast + placeholders, buildings (game shop HQ, server rack depot, LAN cafe barracks, antenna tower) + menu card + power visuals
- [x] (B90) Logic: balance pass with 6 factions — B88 round robin (3 seeds, 30 games each): bw 12 ac 11 hh 13 om 17 sc 22 nd 14; pull Street Crew back toward mid-pack, maybe run 5 seeds for less noise

## Batch 10 (added 13:11 UTC by the loop, same rules)
- [x] (B91) Docs: refresh CLAUDE.md "Current state" + docs/design.md for 6 factions, King of the Hill, time of day, AI garrisons, balance tool usage
- [x] (B92) Units: The Streamer's own ability "Go Live" — nearby enemies stop to stare at the phone (2 s stun) with camera-flash sparkles; the Nerds hero stops being a bullhorn copy
- [x] (B93) UI: power aiming preview — while aiming a targeted power, a ring of its real radius follows the finger in the faction colour
- [x] (B94) Map: Nerds base dressing — a cosplay photo-op cutout, a vending machine, cable spaghetti and a folding table with dice
- [x] (B95) FX: weather — some matches roll light rain (streaks, ground ripples, slightly darker sky); decided by the match seed
- [x] (B96) UI: match intro — the camera flies from the enemy HQ to yours in ~2.5 s at the start (tap to skip)

## Batch 11 (added 13:26 UTC by the loop, same rules)
- [x] (B97) Units: The Tycoon's own ability "Hush Money" — the nearest enemy squad within 6 m pockets a briefcase of cash and stands down (3 s stun), a coin spray; Old Money hero stops borrowing the bullhorn
- [x] (B98) UI: end screen rematch — a second big button that replays the same faction + mode + difficulty straight away
- [x] (B100) Logic: Resource Race mode — third mode button (coin icon); first to earn 2500 wins; HUD bars like the hill
- [x] (B101) FX: faction death flourishes — Old Money drops bills, Nerds lose their glasses, Street Crew a sneaker, Hard Hats a hard hat bounces
- [x] (B102) Map: pedestrians — a few render-only civilians walk the sidewalks and run away from fights

## Batch 12 (added 13:42 UTC by the loop, same rules)
- [x] (B103) UI: pause screen home button — a big round home icon on the pause dim quits the match to the menu
- [x] (B104) Units: Street Crew + Nerds worker kit — Hustler carries a shoebox that fills with cash, Tech Support a laptop bag that bulges
- [x] (B105) FX: victory dance — when the match ends, the winner's surviving real characters dance (moussa's clips) and the loser's slump
- [x] (B106) Docs: overnight wrap-up — CLAUDE.md current state + a short "what happened overnight" note at the top of docs/decisions.md

## Batch 13 (added 13:52 UTC by the loop, same rules)
- [x] (B107) Perf: measure draws/triangles mid-match (6 factions, rain, pedestrians); merge each placeholder building's static boxes into one mesh per colour so a base costs a handful of draws
- [x] (B108) UI: graphics toggle on the menu (sparkle icon): LOW = no shadows, pixel ratio 1, no rain/pedestrians; remembered on the phone
- [x] (B110) Logic: Capture and Hold mode — three flags (hill + the two side parks); holding more of them drains the enemy's counter

## Batch 14 (added 14:01 UTC by the loop, same rules)
- [x] (B111) UI: minimap shows the hill / capture flags as rings in their holder's colour
- [x] (B112) Docs: CLAUDE.md + docs/design.md for Capture and Hold, Resource Race, graphics toggle and the perf numbers
- [x] (B113) Logic: Hero vs Hero mode — each side starts with its hero beside the HQ and nothing else to train but workers; a hero falling ends the match

## Batch 15 (added 14:08 UTC by the loop, same rules)
- [x] (B114) Logic: hero duel balance — round robin all 6 heroes in Hero vs Hero (AI vs AI, several seeds); nudge outliers
- [x] (B115) UI: end screen shows both factions' icons (yours vs theirs, the winner's bigger) above the stats

## Batch 16 (added 14:14 UTC by the loop, same rules)
- [x] (B116) FX: rain reads better — longer, brighter streaks and little ripple rings on the ground where drops land
- [x] (B117) UI: first match ever — the build (hammer) button pulses gently until it is first used (show, don't label), remembered on the phone

## Batch 17 (added 14:19 UTC by the loop, same rules)
- [x] (B118) UI: first match ever — once a barracks stands, its first train button pulses until a squad is trained (remembered)
- [x] (B119) FX: menu backdrop — while the menu is up, the camera slowly orbits the city centre

## Batch 18 (added 14:24 UTC by the loop, same rules)
- [x] (B120) UI: menu buttons (factions, difficulty, modes, sound, graphics) show their name on long-press, like the HUD buttons (dev aid)
- [x] (B121) Docs: final overnight touch-up — CLAUDE.md current state for Hero vs Hero, first-match nudges, menu backdrop; summary line in docs/decisions.md

## Batch 19 (added 14:28 UTC by the loop, same rules)
- [x] (B122) UI: game speed — a 1x/2x button on the pause screen (handy for playtesting on the phone), remembered
- [x] (B123) FX: HQ in danger — when your HQ is under 40%, a soft red vignette pulses at the screen edges

## Batch 20 (added 14:32 UTC by the loop, same rules)
- [x] (B124) FX: win confetti — when you win, confetti in your faction's colours rains over the camera swoop (losing: a slow grey drizzle of ash instead)
- [x] (B125) UI: power-ready ping — when a power's meter fills, its button pops once with a gold burst and a soft chime

## Downtown (Colin, Oct 21 2026 - see docs/design.md "Downtown")
- [x] (B129) Step 1: breakable city - every storefront is a stack of floors that gets smashed off from the top (chunks tumble, dust, shake); workers rebuild floor by floor for cash. Tap a storefront with fighters = smash, with workers = rebuild
- [x] (B131) Step 2: city meter + Downtown mode - one side Wreckers, one side Builders (picked from the existing factions); the meter swings with floors standing; timer win
- [x] (B133) City look: storefronts in different shapes (setback towers, gables, domes, water towers, spires, L-plans) so blocks are easy to tell apart (Colin)
- [x] (B137) Step 3: drifters - neutral street people; cash/jobs turn them into rebuild workers, neglect or wreckage turns them into wreckers
- [x] (B141) Step 4a: tags, shops, looting
- [x] (B143) Step 4b: City Hall (builders) / Hideout (wreckers) - each side upgrades its HQ for side-specific perks
- [ ] Downtown balance: AI-vs-AI has wreckers winning ~2/3 - tune after Colin plays both sides (computer builders may just play worse)
- [ ] Step 5: Colin's building kit pieces (weirdport models/building_kit) replace the floor slabs
- [ ] Later: hex city layout (Catan-like blocks, bending streets, real chokepoints)

## The living city (main direction - see docs/design.md "Main direction")
- [x] (B145) Step 1: the city as a computer-run third side - heat per player (smashing storefronts, hurting city people, street brawls, +0.6/min baseline), patrol cops at 6, SWAT at 15, armoured car at 30, from the map edge nearest the trouble; they leave when the heat drops; 2 road crews rebuild storefronts; heat meter + flashing siren in the HUD
- [x] (B146) Step 2: fires + firefighters (a floor coming down has a 30% chance to start a fire; it burns the storefront, can jump next door, fire crews roll in with sirens and hose it out), 10 civilians as sim units who stroll, flee fights and get hurt (hurting them is heavy heat)
- [x] (B147) Step 3: army tier at heat 45 (an olive truck drives at the trouble and drops 6 soldiers; kill the truck first and nobody gets out) and a Riot Mech at 65 (2.5x tall, light bar, stamps on the hunted side's buildings, never the HQ); heat bar now fills at 65
- [x] (B148) Step 4: alien verbs prototyped on existing factions - Nerds ABDUCT (any squad beams up a civilian within 10 m every 8 s: +30 cash, +8 power, a little heat; green tractor beam), Activists POSSESS (a squad that walks into a civilian wears them for 60 s - drawn as civilians, invisible to enemies, towers, police, the AI and the enemy minimap - and its first strike hits double; civilians never run from Activists)
- [x] (B149) Step 5: the other three verbs on existing factions - Old Money EAT (a hurt squad gulps a civilian within 7 m and heals to full), Street Crew MIND-CONTROL (hypnotises a civilian within 8 m to fight for them for 40 s, 3 at once), Backwoods INFECT (goo spit within 8 m: the civilian turns green, walks at the nearest enemy, passes it to one more civilian, and bursts for area damage). Civilians now only panic inside 6 m

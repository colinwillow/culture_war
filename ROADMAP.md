# Roadmap (overnight loop, Oct 21 2026 — stop at 14:55 UTC / 8 am Colin)

Loop rules: `git pull origin main`, read this file, take the FIRST unchecked item, ship it as ONE build
(`npm run bump`, quick boot check, push to `main`), tick it with the build number, end the pass.
Too big for one build? Split it here and ship the first half. Never ship a page that does not boot.
Log every build in `docs/decisions.md` (newest first, one or two lines). All builds are UNVERIFIED on the phone.

## STEER (Colin's words outrank everything below)
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
- [ ] Map: Street Crew base dressing — basketball court lines, a parked boombox and graffiti-tagged dumpsters round their HQ
- [ ] Units: hero entrance — when a hero is trained, a short spotlight + faction flourish (eagle cry / bullhorn / whistle / jet / record scratch)
- [ ] Logic: Hard Hats + Street Crew balance — after B76 they win 8/24 and 7/24 in tools/balance.cjs; nudge toward mid-pack without touching starting cash much

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
- [ ] FX: Backwoods Junkyard — destroyed Backwoods vehicles leave a smoking wreck husk for a while (the scrap refund made visible)
- [ ] FX: Activists Rally — thin pulsing lines link nearby Activist squads while the rally bonus is active
- [ ] UI: build-radius preview — while placing, a soft ring around each of your buildings shows where you are allowed to build
- [ ] Map: pigeons in the parks scatter (fly up and away) when a squad walks through them, then settle back
- [ ] FX: tower shots get faction flavour — Deer Stand fires a slug with a puff of smoke, Banner Tower throws a paint balloon splat

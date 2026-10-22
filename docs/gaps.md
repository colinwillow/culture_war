# What a fun match still lacks, and the flyers (Oct 22 2026, loop pass for Colin's steer 2)

Ranked by FUN PER BUILD: how much better a match feels divided by how many builds it costs. Compared against the games
this one copies (BFME II, Warcraft III, Age of Empires) and against what the sim already has (counter loop, ranks, hero
levels, powers, garrison, repair, rally, five modes, the living city with its heat tiers and the alien verbs).

## A. Missing, high fun per build (one build each)

1. **Unit voices and hit sounds for the species.** Orders already bark; fights are nearly silent at RTS zoom. The arena has
   Colin's hits/swooshes/grunts; route them through the RTS `hit`/`shot` events with distance falloff, one grunt per species.
2. **Squad formations and facing.** Squads are blobs. A 2-row line that turns to face the enemy, Shooters behind Brutes
   when both are in one army, is the single biggest "this is an army" read. Sim: a slot offset per member + a facing.
3. **Veterancy you can SEE.** Ranks exist (+dmg) but a Veteran looks like a Recruit. Rule from roster.md: a shoulder piece
   / glow per rank. Cheap now: a team-coloured chevron sprite over the squad, and the arena's rim light on Elites.
4. **Base defence that matters.** Towers are the only static defence. Add a WALL piece (cheap, blocks pathing, breakable)
   and a GATE; the hex streets make chokepoints that walls can close. BFME's whole base game is this.
5. **A real death.** Squads vanish. KO moment from the arena at RTS scale: ragdoll-ish fall clip, a 1 s body, a puff.
   Already have fall/getup clips on every species rig.
6. **Hero abilities on the species.** Humans' heroes have four; the species have none yet. One per launch faction tied to
   its verb: Brutes' Hero EATS a civilian for a heal + a roar; Greys' beams a whole squad up; Reptilians' swaps places
   with a possessed civilian; Spores' bursts into goo.
7. **Objectives on the map.** Capture points exist in one mode. Put 2-3 neutral spots on every map (a power plant, a
   bank, a radio tower) that give a small bonus to whoever holds them. Fights happen where the bonus is.
8. **Map vision / fog.** No fog of war. Even a soft one (enemy squads hidden past 40 m from any of yours) makes scouting
   and the Fast class mean something.

## B. Missing, medium (2-4 builds)

9. **Smart AI, phase 2.** The AI expands and retreats; it does not scout, flank, counter-pick, or use the verbs. Next: it
   reads the player's army mix and trains the counter; it sends the Fast class round the back; it uses its powers.
10. **Economy with a choice.** One resource (cash) from trucks. Add a second (TECH from the verb: abductions, possession
    intel, eaten biomass, spore mass) that gates T2/T3. The verb then IS the economy, which is the design's whole point.
11. **Buildings that look like the species.** All factions share the white-box kit. Per-faction HQ silhouette first
    (saucer base, hive, scrap fort, goo mound), then the rest from the weirdport building kit.
12. **Possess a unit in third person** (YOU mode on the RTS map): the arena's pad is done; the RTS needs a follow cam and
    the sim to accept a possessed unit's moves as commands.

## C. Big (a week+): multiplayer lockstep, campaign, the portable core.

## Flyers: every species has ships

Design rule: a flyer is the species' FAST or HEAVY slot, never both, so the counter loop still holds and no faction gets
two air units at launch. Flyers path on a second grid that ignores buildings and walls but not the board edge; they are
hit by Shooters and Towers only (Grunts and Brutes cannot reach them), which is what makes Shooters worth training.

| Species | Flyer | Slot | What it does | Counter |
|---|---|---|---|---|
| Greys | **Saucer** | Fast | hovers, tractor-beams one civilian or Grunt squad member up (the abduct verb from the air) | Shooters, towers |
| Reptilians | **Drop pod / cloaked skiff** | Fast | ferries a possessed civilian deep into the enemy base, lands, the squad pours out | towers (detect), Shooters |
| Brutes | **Scrap gunship** | Heavy | slow, loud, plated; drops a Brute squad and strafes; the EAT verb heals it when it lands on civilians | Shooters, Heavy, towers |
| Spores | **Spore cloud** | Fast | a drifting cloud, barely a unit: infects anything it passes over, dies to any fire | everything that shoots |

Mechanics needed: an `air: true` flag on the unit def; `grid.js` gets `findPathAir` (straight line, clamped to the
board); `lineClear` ignores air for melee; towers and `ranged` get `canHitAir`; the renderer gives flyers a bob and a
shadow blob. Hex board: flyers cross water and blocks, which is the strategy Colin described (routes over vs around).
Art: one GLB per flyer, no rig (a bob is procedural); Tripo from a single image is enough.

## What to do first
A1 (sounds) + A2 (formations) + A5 (deaths) in one evening make fights FEEL like fights; A4 (walls) + A7 (objectives)
make the map matter; then flyers, Greys' Saucer first because it is the abduct verb and the most iconic ship.

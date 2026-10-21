# Culture Wars — Game Design Doc

Exported Oct 20, 2026. Live version (editable, may be newer): https://claude.ai/artifact/PsqXyiVpCimKE6xiN15fmi
Where the code differs from this doc (economy numbers, workers, towers, city map), the code + `CLAUDE.md` describe
what is actually built; update this doc when a design decision changes.

## Concept
Culture Wars is a live real-time strategy game for mobile, built on the structure of *The Lord of the Rings: The
Battle for Middle-earth II* (Xbox 360, 2006). Instead of elves and orcs, the factions are lighthearted, blocky,
cartoon tropes of modern subcultures, each with its own units, vehicles, buildings and special powers.

- **Live battles, not turns.** Real-time control of squads, with cinematic effects and big animations.
- **Painfully obvious UI.** Big icon buttons (heart, shield, sword), no tutorial popups, no click-through helpers. If a player has to read, the design failed.
- **Roast everyone equally.** Every faction is equally ridiculous and equally lovable. Nobody is the villain.

**App Store guardrails (Apple guideline 1.1.1).** Factions are defined by lifestyle, style and hobbies, never by
race, religion, ethnicity or gender. Every faction is mixed-race and mixed-gender. No real people or real
politicians by name or likeness.

## Platform and visual rules
**Show, don't label.** Every power, ability and mechanic must read from the animation alone, with no word on
screen. If a power needs a text label to explain it, it gets redesigned. Overlap between factions is fine (every
faction has some kind of siege attack); the exaggerated, funny, on-trope visual is what sets each one apart, like
the oversized toon monster truck flattening a squad.

- **Mobile first.** Designed and tested on phones before anything else.
- **Portrait and landscape.** Both orientations fully playable; buttons re-dock (bottom in portrait, right side in landscape).
- **Browser later.** Same build should run in a desktop browser eventually; not a launch target.
- **Page zoom locked.** No accidental page zoom from double-tap or pinch (viewport no-scale + touch-action none + iOS gesture/double-tap blocking). Pinch is the in-game camera zoom.

## Core rules (borrowed from BFME II)
- **Battalions:** units train as a squad of about five and move as one. Essential for thumb control.
- **Counter loop:** pike beats cavalry, cavalry beats ranged, ranged beats melee, melee beats pike. Siege beats buildings. Heroes are strong against everything but can be swarmed.
- **Building levels:** buildings upgrade up to three levels; each level unlocks better units.
- **Ranks:** squads gain experience in combat and rank up. Heroes level higher.
- **Command points:** a cap on army size, raised by building more.
- **Power meter:** fills as you fight and unlocks big faction powers.
- **Resources:** kept simple and mostly automatic (as in BFME II) so the focus stays on fighting. Workers gather from businesses around the city.

## Playstyle archetypes
The trope is the costume; the archetype is how the faction plays. No two launch factions share an archetype.

| Archetype | How it plays | Best-fit factions |
| --- | --- | --- |
| Swarm | Tons of cheap weak units, wins by numbers | Activists |
| Elite | Very few, very expensive, very strong units | Old Money |
| Late-game economy | Weak early, snowballs later | (Tech Bros, folded into Nerds/Old Money) |
| Brute | Slow, tanky, hits hard up close | Backwoods, Jocks |
| Rush / raider | Fastest units, hit-and-run | Street Crew, Shredders |
| Turtle / builder | Best walls and towers, builds fastest | Hard Hats |
| Trickster | Debuffs, fines, stealing and converting enemy units | Suburbia, Influencers |
| Summoner | Spawns creatures and constructs, magic-like powers | Nerds, Alt Kids |
| Sustain / healer | Heals and buffs, hard to wear down | Crunchy |
| Wildcard | Breaks the rules: teleports, abductions | Aliens |

## Launch roster (Colin's picks)
1. **Backwoods** (Brute) — must-have, Colin's favorite. Pitchfork farmers, bar brawlers, shotgun hunters, monster trucks/tractors, fireworks launcher. Hero: bald eagle. Mechanic: Junkyard (wrecked vehicles refund scrap). Powers: Mud Bog, Fourth of July barrage.
2. **Nerds** (Summoner, absorbs tech-bro gadgets) — LARPers with foam swords, foam-dart snipers, cosplayers, drones, robot dogs, homemade mech suit, tabletop wizard. Hero: the Dungeon Master. Mechanic: Save Point (fallen squads respawn once). Powers: Inflatable Dragon summon, Lag Spike (slows enemies).
3. **Old Money** (Elite) — hired security, butlers, skeet-shooting snipers, polo riders, yacht fortress. Hero: monocled tycoon. Mechanic: buy units instantly but pay upkeep. Powers: Hostile Takeover (tycoon rains money bags on an enemy squad; they pocket it and walk over to his side), Private Jet drop.
4. **Street Crew** (Rush; hip-hop, streetwear and car culture, open to anyone) — sneakerhead runners, breakdancers, boombox crews firing sound waves, hopping lowriders, graffiti tagger. Hero: DJ on a sound-system truck. Mechanics: Tags (spray to claim zones), Hype (flashy moves fill the meter faster). Powers: Block Party (army buff), Mixtape Drop (shockwave stun).
5. **Activists** (Swarm) — sign wavers, picket line (Sit In), megaphone crew, bike collective, giant parade puppet. Hero: march leader with a bullhorn. Mechanic: Rally (stronger together). Powers: Pie in the Face, Parade. (Colin also liked "Cancel" — visual idea: a mob of phones surrounds the enemy hero, thumbs-down icons rain, the hero shrinks and sulks under a rain cloud.)
6. **Hard Hats** (Turtle / builder; blue-collar trades) — construction crews, nail-gunners, forklifts, excavators, wrecking-ball crane. Hero: the foreman. Mechanic: builds and repairs twice as fast; Overtime production boost. Powers: Road Closed (cones block lanes), Wrecking Ball.

**Season 2 candidates:** Jocks, Shredders (skate/surf/snow), Alt Kids (goth/emo/punk/metal — "the edgy one"), Suburbia (HOA, minivans, grill dads).
**Season 3 candidates:** Crunchy (hippies, hipsters, van life), Valley / Influencer (mixed-gender trickster: selfies that stun, follower swarms, Collab converts enemies).
**Dropped:** Tech Bros as its own faction (split into Nerds and Old Money). Homeless faction (reads as punching down; App Store risk).
**Aliens:** campaign villain and neutral invader; playable later.

Balance load: 6 factions = 21 matchups (incl. mirrors); 14 factions = 105.

### Other faction sketches (for later seasons)
- **Jocks** (Brute): linemen, flexing gym bros, quarterbacks throwing footballs, frat party bus, keg cannon. Hero: team captain. Pump (bulk up idle at the gym). Powers: Hail Mary airstrike, Pep Rally.
- **Shredders** (Rush): skaters, surfers, snowball throwers, surf van. Hero: pro skater. Momentum; grind rails as fast lanes. Powers: Tidal Wave, Avalanche.
- **Alt Kids** (Summoner): moshers, punks, guitarists with amp stacks, hearse, giant bat. Hero: metal frontman. Mosh Pit area damage; Gloom fog. Powers: Wall of Death, Eternal Night.
- **Suburbia** (Trickster): leaf-blower crews, grill dads lobbing flaming burgers, minivans, sprinkler towers. Hero: HOA president. Fines drain enemy money. Powers: Speak to the Manager, Neighborhood Watch.
- **Crunchy** (Healer): healing drum circles, fixie bikers, festival van, crystal towers. Hero: festival shaman. Good Vibes healing. Powers: Festival (enemies dance), Compost.

## Game modes
Match length is set by the mode, as in BFME II (Xbox 360 had Versus plus Capture and Hold, King of the Hill, Resource Race, Hero vs. Hero).

| Mode | Win condition | Rough length |
| --- | --- | --- |
| Versus | Destroy the enemy HQ and army | 15–25 min |
| Capture and Hold | Hold most control points when the timer ends | 10 min |
| King of the Hill | Hold the center zone for a set total time | 8–12 min |
| Resource Race | First to a cash target | 8–12 min |
| Hero vs. Hero | Heroes only, last hero standing | 3–5 min |

First build: Versus only, vs computer. Alien story campaign later.

## Variant: alien races edition
Same engine and rules, factions from UFO lore. Archetypes carry over.

| Faction | Archetype | Units and signature mechanic |
| --- | --- | --- |
| Greys | Trickster | Probe drones, saucers, clone vats. Abduction beam steals units; mind control flips a squad for 10 s. |
| Reptilians | Brute + infiltrator | Lizard troopers, winged Draconian heavies. Shapeshift: disguised as enemy units until they attack. |
| Hive (insectoids + mantis) | Swarm | Bug drones, mantis blade-warriors, egg-laying queen. Fallen units leave eggs. |
| Nordics (+ Tall Whites) | Sustain / elite | Few tall glowing soldiers. Heal and shield; strongest per unit. |
| Martians (retro 1950s) | Rush | Little green men, ray guns, tripods, fast saucers. |
| The Agency (humans) | Turtle / builder | Agents in black suits, hangars, radar towers. Cover-up hides their base. |

Later: Blue Avians, Arcturians, hybrids, Anunnaki. Crossover: the Culture Wars alien villain is one of these races.

## Vertical slice: Backwoods vs. Activists (first-guess numbers, tune after playtests)
- Attacks once per second; damage is per member per hit. Counter hit 2x. Siege 3x to buildings, 0.5x to units. Non-siege 0.5x to buildings.
- Army cap 50 command points (squad 5, vehicle/siege 10, hero 15, worker 1); each depot +5.
- Barracks: L1 pike + melee; L2 (400) ranged + cavalry; L3 (800) siege.
- Ranks after 10 and 25 kills, +20% HP and damage each.

| Backwoods unit | Slot | Members | HP each | Dmg | Range | Speed | Cost | Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pitchfork Farmers | Pike | 5 | 60 | 8 | melee | 3 | 100 | 10 s |
| Bar Brawlers | Melee | 5 | 80 | 10 | melee | 3 | 120 | 12 s |
| Shotgun Hunters | Ranged | 5 | 45 | 12 | 8 | 3 | 140 | 14 s |
| Monster Truck | Cavalry | 1 | 500 | 30 trample | melee | 7 | 300 | 25 s |
| Fireworks Launcher | Siege | 1 | 200 | 60 area | 14 | 2 | 350 | 30 s |
| Bald Eagle (hero) | Hero | 1 | 600 | 25 | melee, flies | 8 | 800 | 45 s |

Junkyard: destroyed vehicles refund 50%. Screech: stuns nearby enemies 2 s. Powers: Mud Bog (50% slow, 10 s), Fourth of July (wide strike).

| Activists unit | Slot | Members | HP each | Dmg | Range | Speed | Cost | Build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sign Wavers | Pike | 8 | 30 | 4 | melee | 4 | 80 | 8 s |
| Picket Line | Melee | 8 | 35 | 5 | melee | 4 | 90 | 9 s |
| Megaphone Crew | Ranged | 5 | 25 | 6 | 9 | 4 | 120 | 12 s |
| Bike Collective | Cavalry | 6 | 40 | 7 | melee | 8 | 180 | 15 s |
| Parade Puppet | Siege | 1 | 250 | 40 | 2 | 2 | 300 | 28 s |
| March Leader (hero) | Hero | 1 | 450 | 12 | melee | 5 | 700 | 40 s |

Rally: +5% damage per nearby friendly squad (max +25%). Sit In: unmovable wall, half damage, can't attack. Megaphone hits: target deals 20% less for 5 s. Bullhorn: nearby squads +25% speed and damage for 10 s. Powers: Pie in the Face (enemy hero blind 15 s), Parade (army +30% speed 15 s).

## Open questions
- [ ] Second faction-flavored resource (scrap, hype, followers) later, or cash only?
- [ ] Faction home maps vs shared neutral maps (current: shared city map).
- [ ] Full unit lists for Nerds, Old Money, Street Crew, Hard Hats (template = Backwoods).

# Roster v3: four factions, four shapes, the city as the star (Oct 22 2026)

**Direction (Colin, Oct 22, revised the same night):** a war for Earth between alien species over the living human city.
**The city is the star**: neutral, computer-run (civilians, crews, firefighters, police -> SWAT -> army -> riot mech, all
built), and every faction is defined by its VERB on it. Humans are not a pick; they are the board that fights back. Robots
are the city's top tier, not a camp. **Launch with FOUR factions, each a different SHAPE of army**, chosen for the strongest
and most different verbs; add more camps later, including species Colin invents that fit no lore. The known UFO-lore
species (greys, reptilians) are a useful scaffold, not the generic part: the generic part was nine factions all filling the
same seven slots with a different skin.

The test for any new faction or unit: what does it do to the city that nothing else does? "Shoots harder" = cut.

## Launch four

| Faction | Verb | Shape of the army | Art |
|---|---|---|---|
| **Greys** | abduct | few, elite, saucers; abductions are the economy; weak in a brawl, strong late | `alien_grey_medium` |
| **Reptilians** (the Hornbacks table below; Mimics folds in) | possess | infiltrators who wear humans and strike from inside the crowd; ambush, retreat | the red demon (rigged, tail) |
| **Tuskers** | eat | big, slow, hungry; eating heals and grows them; the front-line brawlers | the alien warrior (rigged, mace) |
| **Spores** (the Ooze & Spores table) | infect | cheap swarms, goo creep across the map, civilians become bombs | none yet |

Later camps: Mantids (mind-control), Monsters, and Colin's own inventions. 4 x 7 = 28 characters at launch.

**Working titles:** *War for the World* (front-runner), *World War Weird*, *Planet Brawl*, *Invasion Block*.
"Race War" is a no: an app store will not take it and it reads as the real thing whatever the joke is. *The War of the
Worlds* is public domain but crowded. **Wording rule in the game:** they are SPECIES / FACTIONS, never "races".

**App-store guard:** no species may be a caricature of a real human group (accents, dress, features coded to a real
ethnicity, religion or nationality). Humans in the game are a mixed, fictional military, not any real country or agency.

How to use this file: pick one SUB-FACTION and ask for its prompts (one image per class, front view T-pose, plain
background, then Tripo multiview -> pipeline). Names below are placeholders until Colin likes them.

---

## 1. Classes (every faction fills the same seven slots)

The slot in brackets is the unit slot the game already runs on, so new art drops straight in. Sizes are at a 1.6 m human.

| # | Class | Slot | Size | Squad | Job | Duel move set |
|---|---|---|---|---|---|---|
| 1 | **Worker** | `worker` | small | 1 | builds, repairs, gathers, does the faction's VERB to civilians | tool swings, flee |
| 2 | **Grunt** | `pike` | small | 6-8 | cheap swarm, reach weapon, beats Fast | light melee, mob |
| 3 | **Brute** | `melee` | big | 3-4 | the front line, heavy weapon or shield, beats Shooters | heavy melee + block (the warrior's set) |
| 4 | **Shooter** | `ranged` | medium | 4-5 | ranged infantry, beats Grunts | rifle set (Colin's set) + melee fallback |
| 5 | **Fast** | `cav` | mount / bike / flyer | 1-4 | raids and flanks, beats Brutes | charge, hit-and-run |
| 6 | **Heavy** | `siege` | huge (3-6 m) | 1 | walker, tank, giant beast: wrecks buildings | slam, stomp |
| 7 | **Hero** | `hero` | stand-out | 1 | one per side, levels 1-5, one signature power | full set + special |

Counter loop (already in the sim): Grunt > Fast > Shooter > Brute > Grunt. Heavy and Hero sit outside it.
Small on a phone = **silhouette over detail**: horns, tails, hunches, glowing bits and big weapons read; fingers and
faces barely do.

## 2. Ranks

- **Units:** Recruit -> **Veteran** (after 10 kills: +20% damage, a shoulder piece / glow) -> **Elite** (after 25: +40%,
  a second trim colour). Same art, an extra bolt-on mesh per rank.
- **Heroes:** levels 1-5 from kills and objectives; each level adds to the signature power.
- **Faction tech tiers:** T1 (HQ: Worker, Grunt) -> T2 (Barracks L2: Brute, Shooter, Fast) -> T3 (L3: Heavy) -> Hero.

## 3. Sub-factions

Every faction has **three sub-factions** (clans, divisions, models). A sub-faction is the SAME seven classes with its own
**look** (palette + gear kit), one **twist** (a passive or one swapped unit), and a name. The player picks the faction,
then the sub-faction. Art-wise: one base model per class, three outfits.

---

## 4. The factions

Each faction has a **verb**: what it does to the human city. That verb is its identity in both games.

### HUMANS: *Earthguard* (verb: DEFEND / REBUILD)
The home team: rebuild what breaks, shield civilians, grow stronger the more of the city stands.

| Sub-faction | Look | Twist |
|---|---|---|
| **Iron Line** (regular army) | olive armour, big helmets, sandbags | bunkers on any rubble |
| **Halcyon Security** (corporate private force) | white-and-chrome armour, visors, drones | hires mercenaries with cash |
| **Block Watch** (civilian resistance) | mismatched gear, hoodies, hockey pads, junk weapons | civilians join them instead of fleeing |

Classes: Engineer, Rifleman Squad (Grunt: bayonets), Shield Trooper (Brute: riot shield), Marksman (Shooter),
Bike Scout (Fast), Walker Tank (Heavy), Commander (Hero: airstrike).

### ROBOTS: *The Assembly* (verb: CONVERT: scrap and buildings become more robots)
Machines that turn the city into more machines. Slow to start, a flood once the factories run.

| Sub-faction | Look | Twist |
|---|---|---|
| **Factory Line** (industrial) | yellow-black hazard paint, claws, conveyor parts | Workers build twice as fast |
| **Defense Grid** (military AI) | sleek gunmetal, red optics | Shooters overcharge (burst fire) |
| **Junkers** (rogue scrapbots) | rust, mismatched parts, sparks | rebuild dead units from wreckage |

Classes: Fixbot, Drone Swarm (Grunt), Crusher (Brute: hydraulic fists), Gunbot (Shooter), Wheelbot (Fast),
Megawalker (Heavy), Prime Unit (Hero: overclock aura).

### MONSTERS: *The Brood* (verb: FEED: eating civilians grows them)
Earth's own nightmares, woken by the war: things from sewers, swamps and labs.

| Sub-faction | Look | Twist |
|---|---|---|
| **Sewer Kin** | slimy, pale, glowing eyes | tunnel under walls |
| **Swamp Things** | moss, bark, vines | heal standing in water/parks |
| **Lab Escapes** | stitched, tubes, mismatched mutations | random mutation per squad |

Classes: Crawler (Worker), Biter Pack (Grunt), Hulk (Brute), Spitter (Shooter: acid), Leaper (Fast),
Behemoth (Heavy), Alpha (Hero: roar that panics enemies).

### ALIEN SPECIES

**Greys** (verb: ABDUCT: beam civilians up for tech). Art: `alien_grey_medium`. Cold, clinical, saucers.

| Sub-faction | Look | Twist |
|---|---|---|
| **Probe Corps** | white lab suits, probes | abductions give more tech |
| **Saucer Wing** | flight suits, small hover discs | Fast and Heavy can fly |
| **Silent Choir** | robed, big glowing heads | psychic stun on the Hero |

Classes: Drone Tech, Probe Squad, Psi Guard, Ray Gunner, Hover Disc, Mothership Leg (tripod walker), Overseer.

**Mantids** (verb: MIND-CONTROL: hypnotise civilians to fight for them). Insectoid, elegant, hypnotic.

| Sub-faction | Look | Twist |
|---|---|---|
| **Hive Court** | gold-trimmed carapace | thralls last longer |
| **Silkweavers** | pale, webbing | webs slow enemies |
| **Swarmborn** | small, many, buzzing | Grunt squads +50% bigger |

Classes: Drone, Scythe Swarm, Mantis Knight, Stinger (Shooter), Wing Rider, Hive Queen Walker, Hivelord.

**Hornbacks** (verb: RAID / BURN: loot and set the city alight). Art: **the red demon** (horns, mace tail, tusked jaw).
Dino-lizard raiders: loud, armoured, tails as weapons.

| Sub-faction | Look | Twist |
|---|---|---|
| **Scorch Clan** | red, black iron, burn marks | hits set fires |
| **Bone Riders** | bleached bone armour, war paint patterns (abstract, not cultural) | Fast units are beasts |
| **Scrap Raiders** | rusted plates, junk guns | loot gives double cash |

Classes: Thrall, Tailspike Pack, Gorehorn (Brute: the demon), Scrap Gunner (the demon GUNNER), Raptor Rider,
Siege Saurus, Warchief.

**Tuskers** (verb: EAT: gulp civilians to heal). Art: **the alien warrior** (tusks, spiked mace, purple hide).
Boar-rhino brutes: tough, hungry, simple.

| Sub-faction | Look | Twist |
|---|---|---|
| **Iron Tusk** | heavy plate, spiked maces | Brutes +30% HP |
| **Mud Snouts** | mud, hides, bones | regenerate in rubble |
| **Feast Band** | belly armour, cooking pots | eating heals the whole squad |

Classes: Gobbler, Tusk Gang, Warbeast (Brute: the warrior), Blunderbuss (Shooter), Boar Rider, Gut Titan, Big Tusk.

**Mimics** (verb: POSSESS: wear a human, invisible until they strike). Shapeshifters, gooey underneath.

| Sub-faction | Look | Twist |
|---|---|---|
| **Masks** | porcelain-smooth faces | disguise lasts longer |
| **Doubles** | half-human, half-ooze | ambush hits triple |
| **Veil** | translucent, shimmering | short cloak on Fast |

Classes: Seeper, Faceless Pack, Husk Brute, Lure (Shooter: hypnotic shot), Slider, Amalgam (Heavy), Prime Mimic.

**Ooze & Spores** (verb: INFECT: civilians become walking goo bombs). Slime and fungus: grows over the map.

| Sub-faction | Look | Twist |
|---|---|---|
| **Slime Hive** | bright green goo | goo pools slow and hurt |
| **Spore Choir** | mushrooms, caps, spore clouds | infection spreads further |
| **Rot Knights** | goo inside rusted armour | Brutes split in two on death |

Classes: Blob, Splitter Swarm, Goo Knight, Spore Spitter, Puddle Racer, Mother Mound, Overgrowth.

**Antennae** (the neutral alien: Colin's hero `alien_antenna_game` / zap and friends: `alien_female_purple`,
`alien_rollerskate_blue`). The quiet power keeping the peace in the third-person game. In the RTS: a **mercenary /
neutral faction** that sides with whoever is losing, or the player's species in a campaign. Not a launch faction.

---

## 5. Launch scope (superseded by 'Launch four' above)

Six factions x 3 sub-factions x 7 classes is the full dream (126 looks). For launch:
- **4 factions:** Humans, Robots, Hornbacks (the demon), Tuskers (the warrior): two already have a rigged Brute.
- **1 sub-faction each** at launch, the other two as palettes and gear variants later.
- That is **28 characters**, and Tripo + the rig pipeline makes each one about 2 minutes and ~120 credits.

## 6. Decisions waiting on Colin

1. Title.
2. Which 4 at launch (or a different count).
3. Humans: playable faction, or neutral city only?
4. Monsters as their own faction, or fold the best ideas into the alien species?
5. Names you like / hate in the tables above.

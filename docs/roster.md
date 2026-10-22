# Roster: alien races and their unit tiers (working draft, Oct 22 2026)

The alien direction (see `design.md`, "Main direction") needs a cast before it needs code. This is the sheet to fill in:
every race gets the same set of **tiers**, so each piece of art lands in a slot the game already has. Colin designs and
generates the art; `blender-addons/pipeline/` turns four views into a rigged character (Tripo -> Auto-Rig Pro).

## The tiers (shared by every race)

These are the game's existing unit slots. Each race fills every slot, and its own look and verb set it apart.

| Tier | Code slot | Size on the map | Squad | What it is for |
|---|---|---|---|---|
| Worker | `worker` | small (~1.2 m) | 1 | Builds, repairs, gathers. The humble one. |
| Grunts | `pike` | small (~1.3 m) | 5-8 | Cheap swarm with reach. Beats fast units. |
| Brutes | `melee` | medium-big (~1.9 m) | 3-5 | The punch-up line. Beats shooters. |
| Shooters | `ranged` | medium (~1.6 m) | 4-5 | Fragile, hit from range. Beats grunts. |
| Fast | `cav` | mount or vehicle | 1-6 | Flanks and raids. Beats brutes. |
| Big | `siege` | huge (3-5 m) or machine | 1 | Knocks buildings down. Slow, weak up close. |
| Hero | `hero` | stand-out (~2 m) | 1 | One per side, one special ability. |

Counter loop (already in the sim): grunts > fast > shooters > brutes > grunts. Big and Hero sit outside it.
Humans 1.6 m for scale. Units are tiny on a phone screen, so **silhouette beats detail**: horns, tails, hunches and
weapons read; fingers and faces barely do (procedural tails and props matter more than finger bones here).

## Races (draft: names and verbs are placeholders until Colin picks)

Each race has one **verb** toward the human city: the thing that makes it different to play.

| Race (working name) | Verb on humans | Feel | Built in code as |
|---|---|---|---|
| Greys | **Abduct**: beam civilians up for cash/tech | Cold, techy, saucers | Nerds' `traits.abduct` (B148) |
| Mantids | **Mind-control**: hypnotised humans fight for them | Elegant, insect, hypnotic | Street Crew's `traits.mind` (B149) |
| Shapeshifters / lizards | **Possess**: wear a human, invisible until they strike | Sneaky, scaly | Activists' `traits.possess` (B148) |
| Brutes / toads | **Eat**: gulp a human to heal | Big, loud, hungry | Old Money's `traits.eat` (B149) |
| Parasites | **Infect**: humans become walking goo bombs | Gross, spreading | Backwoods' `traits.infect` (B149) |
| Fungus / spores | (spare) **Spread**: territory creep | Slow, inevitable | not built |

The six current factions keep running as stand-ins until a race's art exists; each verb then moves to its race.

## Where the red demon fits

The horned red guy with the mace tail (first Tripo -> Auto-Rig Pro test, Oct 21) reads as a **Brute**-tier unit or a
**Hero**: big frame, heavy armour, a tail weapon. He could anchor the Brutes/toads race (the jaw and gut) or a
lizard/dino race (the tail and scales). **Colin's call.** He is already rigged with a 6-bone tail for procedural sway.

## Art checklist (per character)

1. **Four views**: front, left, back, right. Same lighting, plain background, square images (his 1254 px are fine).
   The front is required; Tripo can work from two, but four is better.
2. **T-pose or A-pose**, hands open with fingers apart (the finger AI fails on fists and chunky gloves; for units this
   small, finger bones are optional anyway).
3. **One character per image set.** Props he holds come out welded to the hand; give them a separate set of views if
   they need to be swappable.
4. Drop the images in `blender-addons/art/<race>/<tier>/` (private repo), named `front/left/back/right.png`.
5. The pipeline makes it: Tripo P2 quad mesh about 5,000 quads, 4K texture with lighting kept, then the Auto-Rig Pro AI
   rig with voxel weights and an optional tail chain. About 120 credits and 2 minutes per character.

## Decisions waiting on Colin

- **Species per faction, or mixed?** The design note says "mix species across every faction; costume/gear defines the
  side, never the body". A race-per-faction roster (StarCraft style) contradicts it. Fictional aliens are not human
  ethnicities; the line to hold is that no species may be a caricature of a real human group. Pick one model.
- Race names, colours and the verb for each.
- How many races at launch (6 tiers x N races = the art list).
- Is the demon a brute, a hero or a dino race?

# Geometry requests (game session writes; worker takes the first undelivered item)
Format: `- [id] name -- size (W x H x D m) -- notes`. Output: `models/gen/<id>.glb` (+ `<id>_chunks.glb` if BREAKABLE).
Read art/STYLE.md first. Ship each piece as soon as it is done (one commit per piece or per small group).

## Batch 1 -- Brute weapons (the arena + RTS hands; origin at the grip, along +Z)
- [w_brute_club] scrap club: a pipe with a bolt-studded iron lump on the end -- 0.12 x 0.12 x 0.9
- [w_brute_blunderbuss] blunderbuss: flared barrel bound with wire, a glowing amber shell chamber, wooden stock -- 0.15 x 0.25 x 1.1
- [w_brute_wrenchhammer] giant riveted wrench-hammer, two-handed -- 0.35 x 0.2 x 1.4
- [w_brute_cleaver] heavy cleaver with a wrench jaw cut into the back of the blade -- 0.08 x 0.4 x 1.0
- [w_brute_pipewrench] big pipe wrench (Worker tool) -- 0.1 x 0.25 x 0.7
- [w_brute_cannon] shoulder cannon for the Heavy: a fat riveted tube with amber vents; origin at the shoulder mount -- 0.5 x 0.5 x 1.6
- [p_skateboard] scrap skateboard: dented steel deck, four chunky wheels, a crimson grip stripe; origin under the deck centre -- 0.3 x 0.15 x 0.9

## Batch 2 -- city kit for fights (RTS ground level)
- [c_car_sedan] boxy sedan, BREAKABLE -- 1.9 x 1.4 x 4.2
- [c_car_van] delivery van, BREAKABLE -- 2.1 x 2.3 x 5.0
- [c_bus] city bus -- 2.5 x 3.0 x 11
- [c_lamp] street lamp -- 0.4 x 5.5 x 0.4
- [c_hydrant] fire hydrant -- 0.4 x 0.8 x 0.4
- [c_bench] park bench -- 1.8 x 0.9 x 0.6
- [c_barrier] concrete jersey barrier, BREAKABLE -- 2.0 x 0.9 x 0.6
- [c_dumpster] dumpster -- 2.0 x 1.4 x 1.2
- [c_tree] chunky low-poly street tree (3 variants in one GLB: tree_a, tree_b, tree_c) -- 3 x 5 x 3

## Batch 3 -- breakable building kit (so buildings come apart in chunks when shot)
- [b_wall_brick] wall panel 4 m wide x 3 m tall x 0.3, BREAKABLE (8 chunks)
- [b_wall_window] same panel with a window hole, BREAKABLE
- [b_wall_door] same panel with a door hole, BREAKABLE
- [b_floor] floor slab 4 x 0.3 x 4, BREAKABLE
- [b_roof_edge] parapet / roof edge 4 x 0.6 x 0.3
- [b_rubble] rubble pile (3 sizes in one GLB: rubble_s, rubble_m, rubble_l) -- up to 3 x 1 x 3

## Batch 4 -- Brute base (RTS buildings, 3/4 view readable; crimson team panels)
- [bb_hq] scrap fortress: stacked shipping containers, a smokestack, a big bitten-gear emblem plate -- 9 x 8 x 9
- [bb_barracks] corrugated-steel fight hall, big open doors, a ring inside -- 7 x 5 x 7
- [bb_depot] scrapyard: a small crane, stacked crates, a fence -- 5 x 4 x 5
- [bb_tower] rickety welded-pipe lookout with a gun nest on top -- 3 x 9 x 3
- [bb_wall] wall segment of car doors and sheet metal welded together, BREAKABLE -- 2.2 x 1.6 x 0.9

## Batch 5 -- species bases (placeholders; one silhouette idea each, crimson team panels; same five pieces per species)
Each species' base must read as THAT species from 40 m: the silhouette carries it, not the detail.
### Greys (abduct; clinical tech: smooth white + gunmetal, glowing cyan #39e0ff, saucer shapes, domes)
- [gb_hq] landed mothership hub: a low flying-saucer dome on three legs, a ring of cyan windows, a crimson band -- 10 x 6 x 10
- [gb_barracks] cloning lab: a squat dome with 3 glowing pods on the side -- 7 x 5 x 7
- [gb_depot] abduction beam dish: a tall dish on a mast pointing up, a cyan glow cup -- 4 x 7 x 4
- [gb_tower] probe spire: a thin white needle with a floating ring near the top -- 2.5 x 10 x 2.5
- [gb_wall] energy fence post pair with a translucent cyan panel between, BREAKABLE -- 2.2 x 1.8 x 0.5
### Reptilians (possess; jungle-temple-meets-street: mossy stone, bronze, graffiti, magenta + lime accents)
- [rb_hq] stepped stone temple with a serpent-head gate and a graffiti-tagged billboard on top -- 10 x 8 x 10
- [rb_barracks] sunken pit arena ringed with stone teeth -- 7 x 3 x 7
- [rb_depot] market stall stack with hanging lanterns and crates -- 5 x 4 x 5
- [rb_tower] totem pole of stacked lizard heads with a lookout on top -- 2.5 x 9 x 2.5
- [rb_wall] carved stone block wall with a moss top, BREAKABLE -- 2.2 x 1.6 x 0.9
### Spores (infect; organic: bulbous fungus, goo, translucent sacs, acid green #7cff4a + purple)
- [sb_hq] giant mushroom cluster mother-mound with a glowing sac core -- 10 x 9 x 10
- [sb_barracks] spawning pod bed: 5 egg sacs in a goo pool -- 7 x 3 x 7
- [sb_depot] spore silo: a tall puffball with vents -- 4 x 6 x 4
- [sb_tower] spitter stalk: a bent stalk with a gaping bulb on top -- 2.5 x 8 x 2.5
- [sb_wall] fungal growth wall, BREAKABLE -- 2.2 x 1.6 x 0.9

## Batch 6 -- ships (one per species; flyers on the Fast or Heavy slot, docs/gaps.md; hover height is the game's job, model at y=0)
- [s_brute_gunship] scrap gunship: a fat riveted flying barge, big rear propeller, open sides, crimson panels -- 6 x 3 x 9
- [s_grey_saucer] classic saucer: smooth disc, glass dome, a ring of cyan lights underneath, a crimson rim stripe -- 6 x 2 x 6
- [s_rept_skiff] cloaked drop skiff: a sleek wedge with fins and a belly hatch, magenta glow -- 4 x 1.6 x 7
- [s_spore_cloud] spore carrier: a floating translucent sac with dangling tendrils and a green glow core -- 4 x 5 x 4
- [s_brute_truck] (ground vehicle) armoured scrap truck with a plough, crimson doors -- 2.6 x 2.6 x 6

## Batch 7 -- neutral city buildings (the living city between the bases; low, chunky, breakable in pieces)
- [n_shop] corner shop, 2 floors, awning, BREAKABLE (by floor) -- 8 x 7 x 8
- [n_apartment] 4-floor apartment block, balconies, BREAKABLE (by floor) -- 10 x 13 x 8
- [n_gas] gas station: canopy, two pumps, a small kiosk -- 12 x 5 x 8
- [n_diner] roadside diner with a big sign -- 10 x 5 x 7
- [n_water_tower] rooftop-style water tower on legs -- 4 x 9 x 4

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

# Brute depot: scrapyard with a small crane, stacked crates, a fence. Origin ground centre, gate faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
spike, crown, banner = brute_style()   # Brute sheets: gear-wrench brand, iron studs
box((5.0, 5.0, 0.15), (0, 0, 0.075), 'asphalt', bevel=0.03)                       # yard
# fence: posts + sheet panels on 3 sides and either side of the gate
def fence(x0, y0, x1, y1):
    L = math.hypot(x1 - x0, y1 - y0); n = max(1, round(L / 1.2))
    for i in range(n + 1):
        t = i / n; cyl(0.06, 1.4, (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.85), 'iron', n=6)
    ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
    box((L, 0.06, 1.0), ((x0 + x1) / 2, (y0 + y1) / 2, 0.75), 'steel', rot=(0, 0, ang), bevel=0.0)
    box((L, 0.08, 0.08), ((x0 + x1) / 2, (y0 + y1) / 2, 1.45), 'rust', rot=(0, 0, ang), bevel=0.0)
E = 2.4
fence(-E, E, E, E); fence(-E, -E, -E, E); fence(E, -E, E, E)
fence(-E, -E, -1.0, -E); fence(1.0, -E, E, -E)
box((0.9, 0.08, 0.6), (-1.7, -E - 0.06, 0.9), 'team', bevel=0.02)                 # crimson fence panels
box((0.9, 0.08, 0.6), (1.7, -E - 0.06, 0.9), 'team', bevel=0.02)
# crane: base, mast, jib, hook (back-left)
box((1.1, 1.1, 0.5), (-1.4, 1.4, 0.4), 'iron', bevel=0.05)
box((0.35, 0.35, 3.2), (-1.4, 1.4, 2.2), 'orange', bevel=0.04)
for z in (1.0, 1.8, 2.6, 3.4):
    box((0.45, 0.45, 0.08), (-1.4, 1.4, z), 'iron', bevel=0.0)
box((3.6, 0.3, 0.3), (-0.2, 1.4, 3.75), 'orange', rot=(0, -6, 0), bevel=0.04)      # jib leaning out to +X
box((0.6, 0.5, 0.5), (-1.9, 1.4, 3.6), 'iron', bevel=0.04)                         # counterweight
cyl(0.025, 1.6, (1.4, 1.4, 2.8), 'iron', n=4)                                       # cable
box((0.5, 0.5, 0.15), (1.4, 1.4, 2.0), 'steel', bevel=0.02)                         # magnet plate
cyl(0.32, 0.25, (1.4, 1.4, 1.8), 'iron', n=8)
# crates + scrap
for (x, y, z, s, c) in ((1.3, 0.2, 0.15, 0.9, 'wood'), (1.3, 0.2, 1.05, 0.8, 'wood'), (0.3, 0.4, 0.15, 0.8, 'olive'),
                         (1.7, -1.2, 0.15, 0.7, 'wood'), (-1.5, -1.1, 0.15, 0.9, 'olive'), (-1.5, -1.1, 1.05, 0.6, 'wood')):
    box((s, s, s), (x, y, z + s / 2), c, bevel=0.04)
    box((s + 0.02, 0.1, s + 0.02), (x, y, z + s / 2), 'iron', bevel=0.0)             # crate bands
cyl(0.35, 0.9, (-0.4, -0.9, 0.6), 'rust', n=8, bevel=0.03)                          # barrels
cyl(0.35, 0.9, (0.3, -1.3, 0.6), 'orange', n=8, bevel=0.03)
box((1.2, 0.8, 0.6), (0.0, 1.6, 0.45), 'steel', rot=(0, 15, 25), bevel=0.05)        # scrap heap
box((0.9, 0.6, 0.5), (0.5, 1.2, 0.5), 'rust', rot=(10, -20, 60), bevel=0.05)

# ---- v2 detail pass: spikes on fence corners + crane top, a glow canister rack, crown tags, hook chain
for x in (-E, E):
    for y in (-E, E):
        spike(0.09, 0.4, (x, y, 1.5), (x * 0.05, y * 0.05, 1))
spike(0.12, 0.5, (-1.4, 1.4, 3.92), (0, 0, 1))
for i, x in enumerate((-0.3, 0.05, 0.4)):
    canister(0.13, 0.7, (x, -1.9, 0.5), (0, 0, 1), 'glow', bars=3, ribs=1)            # canister rack (the stock)
box((1.1, 0.35, 0.08), (0.05, -1.9, 0.12), 'iron', bevel=0.02)
box((1.1, 0.35, 0.06), (0.05, -1.9, 0.88), 'iron', bevel=0.02)
crown(0.7, (0, E + 0.05, 0.8), normal=(0, 1, 0), up=(0, 0, 1), t=0.03)
crown(0.6, (-E - 0.05, 0, 0.8), normal=(-1, 0, 0), up=(0, 0, 1), t=0.03)
crown(0.5, (1.3, 0.2 - 0.41, 1.45), normal=(0, -1, 0), up=(0, 0, 1), t=0.02)
chain((1.4, 1.4, 3.55), (1.4, 1.4, 2.1), 0.05)

# ---- detail pass 2: crimson crown banner on the crane mast, hazard stripes on the crane base, rust patches
banner(0.6, 1.0, (-1.4, 1.2, 3.3), (0, -1, 0), mark='crown')
for k in range(4): box((0.28, 0.06, 0.5), (-1.85 + k * 0.3, 0.83, 0.4), 'orange' if k % 2 else 'dark', bevel=0.0)
box((0.6, 0.04, 0.4), (0.8, -E - 0.04, 0.6), 'rust', bevel=0.0)

# ---- BRUTE PASS: orange painted crane cab plate with gear brand, octagonal pads on the gate posts, a bandolier on a crate
box((0.62, 0.08, 0.6), (-1.4, 0.85, 2.6), 'paint', bevel=0.03); gearmark(0.45, (-1.4, 0.8, 2.6), (0, -1, 0), (0, 0, 1), 'ivory')
for x in (-1.0, 1.0): octpad(0.4, (x, -E - 0.08, 0.9), (0, -1, 0))
bandolier((1.0, -0.25, 1.1), (1.6, 0.65, 1.1), 0.08)
print(ship('bb_depot'))

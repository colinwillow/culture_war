# Brute barracks: corrugated-steel fight hall, big open doors, a fight ring inside (seen through the open front
# and a wide roof gap). Origin ground centre, doors face +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
spike, crown, banner = brute_style()   # Brute sheets: gear-wrench brand, iron studs
Wd, D, Hw = 6.6, 6.6, 3.8
box((7.0, 7.0, 0.25), (0, 0, 0.125), 'concrete', bevel=0.05)                     # pad
# side + back walls with corrugation ribs
for s in (-1, 1):
    box((0.2, D, Hw), (s * Wd / 2, 0, Hw / 2 + 0.25), 'steel', bevel=0.04)
    for i in range(10):
        y = -D / 2 + (i + 0.5) * D / 10
        box((0.1, 0.18, Hw - 0.2), (s * (Wd / 2 + 0.1), y, Hw / 2 + 0.25), 'steel', bevel=0.0)
box((Wd, 0.2, Hw), (0, D / 2, Hw / 2 + 0.25), 'steel', bevel=0.04)
for i in range(10):
    box((0.18, 0.1, Hw - 0.2), (-Wd / 2 + (i + 0.5) * Wd / 10, D / 2 + 0.1, Hw / 2 + 0.25), 'steel', bevel=0.0)
# front: posts + header with the open doorway, doors swung open outward
for x in (-2.9, 2.9):
    box((0.8, 0.3, Hw), (x, -D / 2, Hw / 2 + 0.25), 'rust', bevel=0.04)
box((Wd + 0.2, 0.4, 0.8), (0, -D / 2, Hw + 0.25 - 0.1), 'rust', bevel=0.05)
box((2.6, 0.08, 0.6), (0, -D / 2 - 0.22, Hw - 0.15), 'team', bevel=0.02)          # crimson sign plate over the door
for s in (-1, 1):
    box((1.5, 0.12, 3.2), (s * 2.75, -D / 2 - 0.25, 1.85), 'steel', bevel=0.03)   # big sliding doors, slid open
    box((1.5, 0.14, 0.3), (s * 2.75, -D / 2 - 0.27, 2.6), 'iron', bevel=0.02)
    box((1.5, 0.14, 0.3), (s * 2.75, -D / 2 - 0.27, 1.0), 'iron', bevel=0.02)
# gabled roof: two slopes that stop short, leaving a wide gap along the ridge
for s in (-1, 1):
    box((1.9, D + 0.4, 0.15), (s * 2.6, 0, Hw + 0.6), 'iron', rot=(0, s * 14, 0), bevel=0.03)
box((0.15, D + 0.4, 0.15), (-1.2, 0, Hw + 0.95), 'rust', bevel=0.0)              # ridge beams over the gap
box((0.15, D + 0.4, 0.15), (1.2, 0, Hw + 0.95), 'rust', bevel=0.0)
for y in (-2.0, 0.0, 2.0):
    box((2.5, 0.15, 0.15), (0, y, Hw + 0.95), 'rust', bevel=0.0)                 # cross beams
# fight ring inside
box((3.4, 3.4, 0.4), (0, 0.4, 0.45), 'olive', bevel=0.05)                         # canvas platform
for x in (-1.6, 1.6):
    for y in (-1.2, 2.0):
        cyl(0.1, 1.3, (x, y, 1.3), 'iron', n=6)                                   # corner posts
for z in (1.1, 1.5):
    for s in (-1, 1):
        box((3.2, 0.06, 0.06), (0, 0.4 + s * 1.6, z), 'team', bevel=0.0)        # crimson ropes
        box((0.06, 3.2, 0.06), (s * 1.6, 0.4, z), 'team', bevel=0.0)
cyl(0.5, 0.06, (2.6, -2.2, 0.3), 'tire', n=8)                                     # tyre stack (training)
cyl(0.5, 0.3, (2.6, -2.2, 0.45), 'tire', n=8)
box((0.4, 0.4, 1.2), (-2.6, 2.4, 0.85), 'bone', bevel=0.05)                       # punching bag

# ---- v2 detail pass: spikes on the roof corners + ridge, glow canisters by the door, crown tags, chain at the door
for x in (-3.3, 3.3):
    for y in (-3.3, 3.3):
        spike(0.2, 0.75, (x, y, Hw + 0.3), (x * 0.1, y * 0.06, 1))
    canister(0.22, 1.2, (x * 0.88, -D / 2 - 0.35, 1.0), (0, 0, 1), 'glow', bars=3, ribs=1)
for y in (-2.0, 0.0, 2.0):
    spike(0.13, 0.45, (-1.2, y, Hw + 1.03), (0, 0, 1)); spike(0.13, 0.45, (1.2, y, Hw + 1.03), (0, 0, 1))
crown(1.4, (0, -D / 2 - 0.27, Hw - 0.15), normal=(0, -1, 0), up=(0, 0, 1), t=0.04)       # white crown on the crimson sign
for s in (-1, 1):
    crown(2.2, (s * (Wd / 2 + 0.16), 0.5, 1.9), normal=(s, 0, 0), up=(0, 0, 1), t=0.05)
    box((0.5, 0.12, 0.5), (s * 2.9, -D / 2 - 0.16, Hw - 0.3), 'ivory', bevel=0.04)
    hexbolt(0.07, (s * 2.9, -D / 2 - 0.23, Hw - 0.3), (0, -1, 0))

# ---- detail pass 2: crimson skull banners on the front posts, hazard stripes on the door edges, rust streaks
for s in (-1, 1):
    banner(0.7, 1.4, (s * 2.9, -D / 2 - 0.2, Hw - 0.6), (0, -1, 0), mark='skull' if s < 0 else 'crown')
    for z in (0.5, 1.1, 1.7, 2.3, 2.9): box((0.1, 0.16, 0.3), (s * 2.05, -D / 2 - 0.3, z), 'orange' if int(z * 10) % 12 == 5 else 'dark', bevel=0.0)
    box((0.04, 0.2, 1.2), (s * (Wd / 2 + 0.16), 2.4, 1.4), 'rust', bevel=0.0)

# ---- detail pass 6 (silhouette): two huge tusks curving up off the front of the roof, a skull between them
for s_ in (-1, 1):
    spike(0.3, 1.5, (s_ * 1.2, -D / 2 + 0.1, Hw + 0.95), (s_ * 0.45, -0.35, 1))
skull(0.45, (0, -D / 2 - 0.1, Hw + 1.0), (0, -1, 0), 'ivory')

# ---- BRUTE PASS: orange painted plates with gear brands on the front posts, octagonal pads on the doors, a bandolier
# draped over the sign, red armband wraps on the corner posts
for s_ in (-1, 1):
    box((0.85, 0.1, 1.0), (s_ * 2.9, -D / 2 - 0.2, 1.4), 'paint', bevel=0.04)
    gearmark(0.75, (s_ * 2.9, -D / 2 - 0.26, 1.4), (0, -1, 0), (0, 0, 1), 'ivory')
    octpad(0.8, (s_ * 2.75, -D / 2 - 0.32, 2.4), (0, -1, 0))
bandolier((-1.6, -D / 2 - 0.3, Hw + 0.1), (1.6, -D / 2 - 0.3, Hw + 0.1), 0.12)
print(ship('bb_barracks'))

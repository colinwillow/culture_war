# Reptilian tower: totem pole of stacked lizard heads with a lookout on top. Origin ground centre, faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((2.2, 2.2, 0.4), (0, 0, 0.2), 'stone', bevel=0.08)
box((2.3, 2.3, 0.12), (0, 0, 0.4), 'moss', bevel=0.04)
cols = ('stone', 'bronze', 'moss', 'stone')
z = 0.45
for i, c in enumerate(cols):
    h = 1.5
    box((1.4, 1.4, h), (0, 0, z + h / 2), c, bevel=0.12)                            # head block
    box((1.0, 0.9, 0.55), (0, -0.95, z + 0.45), c, bevel=0.1, taper=(0.8, 0.8))      # snout (lower jaw)
    box((1.1, 0.95, 0.4), (0, -0.95, z + 0.95), c, bevel=0.1, taper=(0.7, 0.9))      # upper snout
    for s in (-1, 1):
        ball(0.17, (s * 0.45, -0.72, z + 1.25), 'gmagenta' if i % 2 == 0 else 'glime', 1)   # eyes
        box((0.25, 0.4, 0.45), (s * 0.72, 0.0, z + 1.3), c, rot=(0, s * 25, 0), bevel=0.04) # crest/ear frills
    for k in (-0.3, 0.0, 0.3):
        cyl(0.07, 0.18, (k, -1.38, z + 0.66), 'bone', rot=(180, 0, 0), n=5, r2=0.0)          # teeth
    z += h
# crimson sash between heads 2 and 3
box((1.5, 1.5, 0.25), (0, 0, 0.45 + 1.5 * 2), 'team', bevel=0.03)
# lookout: platform, low wall, posts and a bronze cone roof
box((2.5, 2.5, 0.25), (0, 0, z + 0.12), 'wood', bevel=0.04)
for s in (-1, 1):
    box((2.5, 0.15, 0.6), (0, s * 1.17, z + 0.55), 'wood', bevel=0.02)
    box((0.15, 2.5, 0.6), (s * 1.17, 0, z + 0.55), 'wood', bevel=0.02)
box((2.5, 0.08, 0.35), (0, -1.27, z + 0.55), 'team', bevel=0.0)
for x in (-1.1, 1.1):
    for y in (-1.1, 1.1):
        cyl(0.07, 1.4, (x, y, z + 0.9), 'wood', n=5)
cyl(1.4, 1.0, (0, 0, z + 2.0), 'bronze', n=8, r2=0.1)                               # roof

# ---- v2 detail pass: orange-tipped cone spikes as head crests, crown tag on the lookout rail, magenta canister lamps
z2 = 0.45
for i in range(4):
    for s in (-1, 1):
        spike(0.09, 0.4, (s * 0.65, 0.3, z2 + 1.45), (s * 0.7, 0.3, 1))
    z2 += 1.5
crown(0.7, (0, -1.32, z + 0.55), normal=(0, -1, 0), up=(0, 0, 1), t=0.02)
for x in (-1.1, 1.1):
    canister(0.1, 0.4, (x, -1.1, z + 1.25), (0, 0, 1), 'gmagenta', bars=3, ribs=1)
spike(0.12, 0.5, (0, 0, z + 2.45), (0, 0, 1))
print(ship('rb_tower'))

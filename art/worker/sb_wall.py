# Spore wall: fungal growth wall, BREAKABLE. Runs along X, origin ground centre.
import sys, os, random; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
crown, banner = spore_style()   # Spore brand: cracked pod bursting spores
rnd = random.Random(7)
ball(1.2, (0, 0, 0), 'goo', 2, (0.95, 0.38, 0.75))                                 # core growth (clipped)
for x in (-0.75, 0.0, 0.75):
    ball(0.55, (x, 0, 0.8 + rnd.uniform(-0.1, 0.15)), 'purple' if x else 'fungus', 2, (1, 0.75, 1.15))   # lumps
for (x, z, s) in ((-0.9, 1.25, 0.45), (0.4, 1.3, 0.5), (0.95, 0.9, 0.35)):                            # shelf brackets
    cyl(s, 0.14, (x, -0.28, z), 'fungus', rot=(10, 0, 0), n=8)
    cyl(s * 0.9, 0.06, (x, -0.28, z - 0.09), 'bone', rot=(10, 0, 0), n=8)
for (x, z) in ((-0.4, 0.55), (0.5, 0.45), (-0.2, 1.1), (0.75, 1.15)):
    ball(0.13, (x, -0.38, z), 'gacid', 1)                                             # glowing pustules
ball(0.28, (-0.35, -0.2, 1.42), 'team', 1, (1.2, 1, 0.7))                             # crimson growths (team)
ball(0.22, (0.75, 0.2, 1.35), 'team', 1, (1.2, 1, 0.7))
for x in (-0.6, 0.3):
    cyl(0.07, 0.5, (x, 0, 1.55), 'purple', n=5, r2=0.0)                               # spikes / sprouts

# ---- v2 detail pass: thorn spikes, a small acid canister bound in with a chain, a white crown tag on a shelf
for (x, d) in ((-1.0, (-0.6, -0.4, 0.6)), (1.0, (0.6, -0.4, 0.6)), (-0.2, (0, -0.6, 0.6))):
    spike(0.07, 0.3, (x, -0.2, 0.9), d)
canister(0.09, 0.4, (0.3, -0.4, 0.35), (0, 0, 1), 'gacid', bars=3, ribs=1)
crown(0.3, (0.4, -0.38, 1.37), normal=(0, -0.2, 1), up=(0, 1, 0), t=0.01)

# ---- detail pass 2: a small crimson crown banner on a thorn, goo drips down the face
banner(0.4, 0.5, (-0.6, -0.42, 1.35), (0, -1, 0), mark='crown')
for x in (-0.2, 0.7): cyl(0.06, 0.4, (x, -0.4, 0.9), 'goo', n=5, r2=0.02)

# ---- SPORE PASS: a rusty iron band + strap holding the growth together, pores
strap((-1.0, -0.42, 0.3), (1.0, -0.42, 0.5), 0.12)
spots((0, 0, 0.6), 0.9, 8, seed=64, col='pore', size=0.07, zmin=0.4, scale=(1.1, 0.45, 0.9))
for o in bpy.context.scene.objects: o.location.y += 0.164   # centre the depth
print(ship('sb_wall', clip=True, fit=(0.83, 0.75, 0.92), chunk_cuts={'x': [-0.4, 0.35], 'z': [0.75]}))

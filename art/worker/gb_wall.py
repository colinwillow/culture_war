# Greys wall: energy-fence post pair with a translucent cyan panel between, BREAKABLE. Runs along X, origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
for s in (-1, 1):
    x = s * 0.92
    box((0.5, 0.5, 0.2), (x, 0, 0.1), 'gunmetal', bevel=0.05)                    # foot
    box((0.34, 0.34, 1.6), (x, 0, 0.95), 'pearl', bevel=0.08, taper=(0.75, 0.75))  # post
    box((0.36, 0.06, 0.5), (x, -0.18, 0.7), 'team', bevel=0.0)                   # crimson post panels
    box((0.36, 0.06, 0.5), (x, 0.18, 0.7), 'team', bevel=0.0)
    ball(0.17, (x, 0, 1.75), 'gcyan', 1)                                          # emitter tips
    for z in (0.35, 1.5):
        box((0.12, 0.12, 0.1), (x - s * 0.18, 0, z), 'gcyan', bevel=0.0)          # emitter nubs facing in
box((1.5, 0.06, 1.2), (0, 0, 0.95), 'ccyan', bevel=0.0)                           # translucent energy panel
for z in (0.4, 0.95, 1.5):
    box((1.5, 0.09, 0.04), (0, 0, z), 'gcyan', bevel=0.0)                         # bright scan lines

# ---- v2 detail pass: rust bolted bands on the posts, cyan canister on each foot, crown tag on a post, cable between posts
for s in (-1, 1):
    x = s * 0.92
    box((0.38, 0.38, 0.1), (x, 0, 1.25), 'rust', bevel=0.02)
    hexbolt(0.03, (x, -0.2, 1.25), (0, -1, 0)); hexbolt(0.03, (x, 0.2, 1.25), (0, 1, 0))
    canister(0.07, 0.35, (x + s * 0.2, -0.2, 0.3), (0, 0, 1), 'gcyan', bars=3, ribs=1)
crown(0.26, (-0.92, -0.215, 1.0), normal=(0, -1, 0), up=(0, 0, 1), t=0.01)
c = cyl(0.025, 1.9, (0, 0.12, 1.62), 'dark', (0, 90, 0), n=5)
print(ship('gb_wall', chunk_cuts={'x': [-0.45, 0.45], 'z': [0.95]}))

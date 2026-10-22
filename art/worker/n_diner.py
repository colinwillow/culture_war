# Neutral roadside diner with a big sign. Origin ground centre, front (windows + door) faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((10.0, 7.0, 0.15), (0, 0, 0.075), 'asphalt', bevel=0.0)                        # lot
# rounded railcar-style body: box + half-cylinder roof
box((7.6, 4.0, 2.4), (-0.6, 0.6, 1.45), 'white', bevel=0.25)
r = cyl(2.0, 7.6, (-0.6, 0.6, 2.65), 'steel', n=12)
r.rotation_euler = (0, math.radians(90), 0); r.scale = (0.35, 1, 1)               # flattened barrel roof
box((7.7, 4.1, 0.35), (-0.6, 0.6, 0.55), 'blue', bevel=0.05)                       # blue base stripe
box((7.7, 4.1, 0.2), (-0.6, 0.6, 2.3), 'yellow', bevel=0.03)                        # yellow trim
for x in (-3.6, -2.4, -1.2, 0.0, 1.2):
    box((1.0, 0.1, 1.0), (x, -1.42, 1.5), 'glass', bevel=0.0)                       # front windows
box((1.2, 1.0, 2.3), (2.7, -1.1, 1.25), 'white', bevel=0.08)                        # entry vestibule
box((0.9, 0.1, 2.0), (2.7, -1.62, 1.15), 'glass', bevel=0.0)
box((1.6, 1.2, 0.15), (2.7, -1.2, 2.5), 'blue', bevel=0.03)
box((2.0, 2.6, 2.6), (3.9, 1.5, 1.45), 'concrete', bevel=0.08)                    # kitchen block
cyl(0.25, 1.2, (4.2, 2.0, 3.3), 'steel', n=6)                                       # kitchen vent
# the big sign: pole + chunky sign board with a glowing border
box((0.4, 0.4, 5.0), (-3.6, -2.6, 2.5), 'steel', bevel=0.04)
box((2.6, 0.5, 1.6), (-3.6, -2.6, 4.2), 'yellow', bevel=0.12)
box((2.2, 0.56, 1.2), (-3.6, -2.6, 4.2), 'blue', bevel=0.05)
box((2.8, 0.3, 0.12), (-3.6, -2.6, 5.05), 'glow', bevel=0.0)
box((2.8, 0.3, 0.12), (-3.6, -2.6, 3.35), 'glow', bevel=0.0)
cyl(0.45, 0.62, (-3.6, -2.6, 4.2), 'white', (90, 0, 0), n=10)                       # coffee-cup disc

# ---- v2 detail pass: neon outline on the roof edge, crown graffiti on the kitchen block, AC + vent junk, trash bags,
# a parked shopping cart
box((7.6, 0.08, 0.08), (-0.6, -1.45, 2.42), 'glow', bevel=0.0)
crown(1.0, (4.92, 1.5, 1.4), normal=(1, 0, 0), up=(0, 0, 1), t=0.02, col='dark')
box((1.0, 0.8, 0.6), (3.6, 1.4, 3.05), 'steel', bevel=0.05)
for (x, y) in ((4.6, 3.0), (4.1, 3.2)): ball(0.35, (x, y, 0.4), 'dark', 1, (1, 1, 0.8))
box((0.6, 0.9, 0.5), (3.6, -2.6, 0.55), 'steel', bevel=0.0); cyl(0.1, 0.1, (3.4, -2.3, 0.15), 'tire', (0, 90, 0), n=6)
print(ship('n_diner'))

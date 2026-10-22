# park bench: chunky wood slats on iron legs. Origin ground centre, seat faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
for y in (-0.18, -0.04, 0.10):
    box((1.8, 0.12, 0.06), (0, y, 0.45), 'wood', bevel=0.015)                # seat slats
for z in (0.62, 0.78):
    box((1.8, 0.05, 0.11), (0, 0.24, z), 'wood', rot=(-12, 0, 0), bevel=0.015)  # back slats
for x in (-0.72, 0.72):
    box((0.08, 0.5, 0.08), (x, -0.04, 0.38), 'iron', bevel=0.015)           # seat rail
    box((0.08, 0.08, 0.38), (x, -0.22, 0.19), 'iron', bevel=0.015)          # front leg
    box((0.08, 0.08, 0.88), (x, 0.22, 0.44), 'iron', rot=(-10, 0, 0), bevel=0.015)  # back leg/upright
    box((0.06, 0.32, 0.06), (x, -0.06, 0.6), 'iron', bevel=0.012)            # armrest
    box((0.12, 0.5, 0.03), (x, 0.0, 0.015), 'iron', bevel=0.008)            # foot

# ---- v2 detail pass: crown graffiti on the back slat, a missing/broken slat, bolts, a bottle
crown(0.3, (0.3, 0.205, 0.7), normal=(0, -0.97, 0.2), up=(0, 0.2, 1), t=0.008)
for x in (-0.72, 0.72):
    for y in (-0.18, -0.04, 0.10): hexbolt(0.015, (x, y, 0.485), (0, 0, 1), 'ivory')
box((0.4, 0.13, 0.06), (0.7, 0.1, 0.4), 'wood', rot=(0, 25, 0), bevel=0.01)                  # broken slat end
cyl(0.03, 0.18, (-0.4, -0.05, 0.57), 'olive', n=6)

# ---- detail pass 2: graffiti streak on a seat slat, rust on the legs, a newspaper on the seat
box((0.5, 0.125, 0.005), (-0.3, 0.1, 0.483), 'magenta', bevel=0.0)
for x in (-0.72, 0.72): box((0.085, 0.085, 0.1), (x, -0.22, 0.1), 'rust', bevel=0.0)
box((0.35, 0.25, 0.02), (0.5, -0.05, 0.49), 'white', rot=(0, 0, 15), bevel=0.0)
print(ship('c_bench'))

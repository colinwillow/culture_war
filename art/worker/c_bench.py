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
print(ship('c_bench'))

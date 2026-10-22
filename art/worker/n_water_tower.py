# Neutral water tower (rooftop style) on legs. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
for x in (-1.4, 1.4):
    for y in (-1.4, 1.4):
        box((0.5, 0.5, 0.3), (x, y, 0.15), 'concrete', bevel=0.04)
        box((0.25, 0.25, 4.2), (x, y, 2.35), 'iron', bevel=0.02)                     # legs
for z in (1.6, 3.2):                                                                   # cross ties
    for s in (-1, 1):
        box((2.8, 0.12, 0.12), (0, s * 1.4, z), 'iron', bevel=0.0)
        box((0.12, 2.8, 0.12), (s * 1.4, 0, z), 'iron', bevel=0.0)
    box((0.1, 0.1, 2.2), (0, -1.4, z - 0.8), 'iron', rot=(0, 52, 0), bevel=0.0)
box((3.4, 3.4, 0.25), (0, 0, 4.55), 'wood', bevel=0.04)                               # platform
cyl(1.75, 3.0, (0, 0, 6.15), 'wood', n=14)                                            # wooden tank (top ~7.65)
for z in (5.0, 6.15, 7.3):
    cyl(1.8, 0.14, (0, 0, z), 'iron', n=14)                                           # steel hoops
cyl(1.95, 1.3, (0, 0, 8.3), 'iron', n=14, r2=0.15)                                    # conical roof (top ~8.95)
cyl(0.12, 0.3, (0, 0, 9.0), 'iron', n=6)
for z in range(1, 9):                                                                  # ladder up the front
    box((0.6, 0.06, 0.06), (0, -1.8, z * 0.75), 'steel', bevel=0.0)
for x in (-0.3, 0.3):
    box((0.07, 0.07, 6.6), (x, -1.8, 3.3), 'steel', bevel=0.0)
cyl(0.12, 4.5, (0.6, 0.6, 2.3), 'steel', n=6)                                         # outlet pipe
print(ship('n_water_tower'))

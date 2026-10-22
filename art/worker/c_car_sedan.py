# boxy sedan, BREAKABLE. Origin on the ground at the footprint centre, front along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
B = 'blue'
box((1.86, 4.1, 0.55), (0, 0, 0.62), B, bevel=0.08, seg=1)                    # lower body
box((1.84, 1.05, 0.12), (0, -1.45, 0.94), B, bevel=0.05)                      # hood top
box((1.78, 2.0, 0.08), (0, 0.15, 0.92), B, bevel=0.03)                       # belt line
box((1.70, 1.9, 0.42), (0, 0.15, 1.16), 'glass', bevel=0.04, taper=(0.9, 0.78))  # glasshouse
box((1.58, 1.56, 0.08), (0, 0.15, 1.38), B, bevel=0.03)                       # roof
for x in (-1, 1):
    for y, r in ((-0.72, -24), (0.15, 0), (1.0, 22)):
        box((0.08, 0.1, 0.46), (x * 0.78, y, 1.15), B, rot=(r, x * 6, 0), bevel=0.0)   # pillars
for s in (-1, 1):
    box((1.95, 0.16, 0.24), (0, s * 2.05, 0.5), 'steel', bevel=0.05)          # bumpers
for x in (-0.62, 0.62):
    box((0.34, 0.06, 0.16), (x, -2.06, 0.75), 'bone', bevel=0.02)             # headlights
    box((0.30, 0.06, 0.12), (x, 2.06, 0.75), 'orange', bevel=0.02)            # tail lights (orange: no red)
box((0.6, 0.05, 0.2), (0, -2.07, 0.6), 'iron', bevel=0.02)                    # grille
for x in (-1, 1):
    for y in (-1.3, 1.3):
        cyl(0.36, 0.28, (x * 0.8, y, 0.36), 'tire', (0, 90, 0), n=10, bevel=0.05)
        cyl(0.18, 0.30, (x * 0.8, y, 0.36), 'steel', (0, 90, 0), n=8)
    box((0.05, 0.9, 0.04), (x * 0.94, 0.15, 0.62), 'iron', bevel=0.0)         # door seam strip
    box((0.12, 0.08, 0.08), (x * 0.98, -0.55, 1.0), 'iron', bevel=0.02)       # mirrors
print(ship('c_car_sedan', chunk_cuts={'x': [0.0], 'y': [-0.75, 0.75]}))

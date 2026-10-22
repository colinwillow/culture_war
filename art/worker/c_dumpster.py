# dumpster: olive steel bin, sloped lid, side pockets, casters. Origin ground centre, front +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
G = 'olive'
box((1.9, 1.05, 1.1), (0, 0.02, 0.7), G, bevel=0.05, taper=(1.0, 1.12))   # bin, flares toward the top
box((1.96, 0.62, 0.08), (0, -0.22, 1.33), 'iron', rot=(-8, 0, 0), bevel=0.02)  # front lid
box((1.96, 0.62, 0.08), (0, 0.38, 1.29), 'iron', rot=(-8, 0, 0), bevel=0.02)   # rear lid
box((1.98, 1.2, 0.1), (0, 0.04, 1.22), G, bevel=0.03)                       # top rim
for x in (-1, 1):
    box((0.1, 0.5, 0.3), (x * 0.98, 0, 0.9), 'iron', bevel=0.02)          # fork pockets
box((1.6, 0.04, 0.14), (0, -0.56, 0.95), 'orange', bevel=0.0)              # hazard band
box((0.5, 0.04, 0.3), (0.5, -0.55, 0.6), 'steel', bevel=0.0)               # dent patch plate
for x in (-0.75, 0.75):
    for y in (-0.38, 0.38):
        box((0.1, 0.1, 0.1), (x, y, 0.13), 'iron', bevel=0.02)
        cyl(0.07, 0.07, (x, y, 0.07), 'tire', (0, 90, 0), n=8)              # casters
print(ship('c_dumpster'))

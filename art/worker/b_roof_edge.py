# parapet / roof edge 4 x 0.6 x 0.3. Origin ground centre (sits on the roof slab), runs along X.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((4.0, 0.24, 0.48), (0, 0, 0.24), 'brick', bevel=0.02)                       # parapet wall
box((4.0, 0.3, 0.1), (0, 0, 0.54), 'concrete', bevel=0.025)                     # coping cap
box((4.0, 0.03, 0.04), (0, -0.135, 0.3), 'bone', bevel=0.0)                     # mortar line
box((4.0, 0.03, 0.04), (0, 0.135, 0.3), 'bone', bevel=0.0)
for x in (-1.6, 0, 1.6):
    box((0.12, 0.05, 0.1), (x, -0.15, 0.38), 'iron', bevel=0.01)               # drain spouts / brackets
print(ship('b_roof_edge'))

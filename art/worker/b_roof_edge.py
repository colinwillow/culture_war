# parapet / roof edge 4 x 0.6 x 0.3. Origin ground centre (sits on the roof slab), runs along X.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((4.0, 0.24, 0.48), (0, 0, 0.24), 'brick', bevel=0.02)                       # parapet wall
box((4.0, 0.3, 0.1), (0, 0, 0.54), 'concrete', bevel=0.025)                     # coping cap
box((4.0, 0.03, 0.04), (0, -0.135, 0.3), 'bone', bevel=0.0)                     # mortar line
box((4.0, 0.03, 0.04), (0, 0.135, 0.3), 'bone', bevel=0.0)
for x in (-1.6, 0, 1.6):
    box((0.12, 0.05, 0.1), (x, -0.15, 0.38), 'iron', bevel=0.01)               # drain spouts / brackets

# ---- v2 detail pass: crown graffiti on the outer face, a rusted downspout, cracked coping
crown(0.45, (0.9, -0.125, 0.25), normal=(0, -1, 0), up=(0, 0, 1), t=0.01)
box((0.5, 0.02, 0.06), (-0.8, -0.13, 0.42), 'magenta', rot=(0, 6, 0), bevel=0.0)
cyl(0.05, 0.55, (-1.0, -0.2, 0.3), 'rust', n=6)
box((0.3, 0.31, 0.05), (1.6, 0, 0.6), 'dark', rot=(0, 0, 20), bevel=0.0)
print(ship('b_roof_edge'))

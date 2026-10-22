# floor slab 4 x 0.3 x 4, BREAKABLE. Origin at the slab's bottom centre (y = 0).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((4.0, 4.0, 0.24), (0, 0, 0.12), 'concrete', bevel=0.03)                     # slab
box((3.9, 3.9, 0.06), (0, 0, 0.27), 'steel', bevel=0.02)                        # worn top screed
for i in range(-1, 2):
    box((3.9, 0.04, 0.012), (0, i * 1.3, 0.3), 'iron', bevel=0.0)               # tile seams
    box((0.04, 3.9, 0.012), (i * 1.3, 0, 0.3), 'iron', bevel=0.0)
for x in (-1.0, 0.4, 1.4):
    cyl(0.025, 0.25, (x, 2.05, 0.12), 'rust', (90, 0, 0), n=5)                   # rebar stubs at the edges
    cyl(0.025, 0.25, (2.05, x - 0.3, 0.12), 'rust', (0, 90, 0), n=5)
print(ship('b_floor', chunk_cuts={'x': [-0.6, 0.8], 'y': [0.2]}))

# EXTRA (not requested): Reptilian fang blade -- a curved ivory/orange fang-shaped blade (like a giant claw) set into a
# scaly leather hilt with gold rings, a crimson crown rag tied at the guard. Origin at the grip, blade along +Z, edge down.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
cyl(0.026, 0.18, (0, 0.02, 0), 'leather', X, n=8)
for y in (0.08, -0.04): cyl(0.03, 0.02, (0, y, 0), 'gold', X, n=8)
horn(0.03, 0.06, (0, 0.11, 0), (0, 1, 0), segs=1)                                        # pommel spike
box((0.05, 0.05, 0.12), (0, -0.09, 0), 'iron', bevel=0.012)                              # guard
banner(0.06, 0.08, (0.03, -0.09, 0.02), (1, 0, 0), mark='crown')
horn(0.055, 0.62, (0, -0.11, 0.0), (0, -1, 0.05), (0, -0.2, 0.9), segs=4)                # the fang blade, curving up
horn(0.035, 0.18, (0, -0.25, 0.04), (0, -0.4, 1), segs=2)                                # back barb

# ---- REPTILIAN PASS 2: glow-slot guard plate, dark crown plate on the pommel
box((0.054, 0.02, 0.06), (0, -0.115, 0.0), 'glow', bevel=0.0)
print(ship('w_rept_blade'))

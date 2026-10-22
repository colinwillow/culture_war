# EXTRA (not requested): Reptilian street pistol (the holster gun on Colin's sheets) -- chunky ivory/iron slab sides,
# a magenta glow coil, a crown grip plate, a spined top rail, a chain lanyard. Origin at the grip, barrel along +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
box((0.045, 0.07, 0.14), (0, 0.0, -0.03), 'leather', rot=(-15, 0, 0), bevel=0.012)        # grip
box((0.05, 0.05, 0.07), (0, 0.0, -0.03), 'ivory', rot=(-15, 0, 0), bevel=0.008)
crown(0.04, (0.026, 0.0, -0.03), normal=(1, 0, 0), up=(0, 0.26, 0.97), t=0.003, col='dark')
box((0.055, 0.26, 0.07), (0, -0.09, 0.07), 'iron', bevel=0.012)                         # frame/slide
box((0.058, 0.14, 0.035), (0, -0.05, 0.08), 'ivory', bevel=0.008)                       # slab plate
cyl(0.022, 0.12, (0, -0.27, 0.08), 'iron', X, n=8)                                      # barrel
cyl(0.03, 0.03, (0, -0.33, 0.08), 'leather', X, n=8)
canister(0.022, 0.09, (0, -0.15, 0.125), (0, -1, 0), 'gmagenta', bars=3, ribs=0)          # glow coil on top
for y in (-0.02, 0.03): horn(0.008, 0.035, (0, y, 0.105), (0, 0.4, 1), segs=2)          # rail spines
box((0.012, 0.05, 0.012), (0, 0.03, -0.0), 'iron', bevel=0.003)                          # trigger guard
chain((0, 0.035, -0.1), (0.01, 0.06, -0.18), 0.008)
print(ship('w_rept_pistol'))

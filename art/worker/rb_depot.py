# Reptilian depot: market stall stack with hanging lanterns and crates. Origin ground centre, front faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((5.0, 5.0, 0.15), (0, 0, 0.075), 'stone', bevel=0.04)
# lower stall: counter + 4 posts + striped awning
box((4.2, 1.0, 1.0), (0, -1.2, 0.65), 'wood', bevel=0.05)
box((4.4, 1.1, 0.1), (0, -1.2, 1.2), 'bronze', bevel=0.02)
for x in (-2.0, 2.0):
    for y in (-1.8, 1.8):
        box((0.18, 0.18, 2.2), (x, y, 1.25), 'wood', bevel=0.02)
for i in range(6):                                                           # striped awning sloping to the front
    x = -2.1 + i * 0.84
    box((0.84, 1.8, 0.08), (x, -1.9, 2.25), 'magenta' if i % 2 else 'lime', rot=(-14, 0, 0), bevel=0.0)
box((4.4, 3.6, 0.2), (0, 0.0, 2.35), 'wood', bevel=0.03)                     # floor of the upper stall
# upper stall (set back) with a crimson cloth roof
box((3.2, 2.4, 1.2), (0, 0.6, 3.05), 'stone', bevel=0.08)
box((3.6, 2.8, 0.15), (0, 0.6, 3.75), 'team', rot=(-8, 0, 0), bevel=0.02)
box((1.2, 0.1, 0.8), (0, -0.62, 3.0), 'iron', bevel=0.0)                     # dark doorway
# hanging lanterns (magenta glow) on strings under the awning edge and the upper roof
for x in (-1.5, -0.5, 0.5, 1.5):
    cyl(0.015, 0.4, (x, -2.6, 1.9), 'iron', n=4)
    ball(0.17, (x, -2.6, 1.62), 'gmagenta', 1, (1, 1, 1.3))
for x in (-1.3, 1.3):
    ball(0.17, (x, -0.85, 3.45), 'glime', 1, (1, 1, 1.3))
# crates and baskets
for (x, y, z, s, c) in ((-1.4, -1.25, 1.25, 0.45, 'wood'), (1.2, -1.25, 1.25, 0.4, 'bronze'), (2.0, 1.9, 0.15, 0.8, 'wood'),
                        (2.0, 1.9, 0.95, 0.6, 'wood'), (-2.0, 1.9, 0.15, 0.7, 'moss'), (1.0, 2.0, 0.15, 0.6, 'wood')):
    box((s, s, s), (x, y, z + s / 2), c, bevel=0.04)
cyl(0.3, 0.4, (0.2, -1.25, 1.45), 'lime', n=8, r2=0.36)                      # fruit basket
print(ship('rb_depot'))

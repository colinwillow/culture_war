# Neutral apartment block: 4 floors, balconies, BREAKABLE by floor. Origin ground centre, balconies face +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
F = 3.0
W, D = 9.6, 6.8
for k in range(4):
    box((W, D, F), (0, 0.4, k * F + F / 2), 'concrete' if k % 2 else 'brick', bevel=0.05)
    box((W + 0.15, D + 0.15, 0.2), (0, 0.4, max(k * F, 0.1)), 'steel', bevel=0.03)   # floor bands
    for x in (-3.6, -1.2, 1.2, 3.6):
        z = k * F + 1.6
        box((1.3, 0.1, 1.4), (x, 0.4 - D / 2 - 0.02, z), 'glass', bevel=0.0)             # front windows / balcony doors
        box((0.1, 1.2, 1.3), (W / 2 + 0.02, x * 0.6 + 0.4, z), 'glass', bevel=0.0)        # side windows
        box((0.1, 1.2, 1.3), (-W / 2 - 0.02, x * 0.6 + 0.4, z), 'glass', bevel=0.0)
        box((1.3, 0.1, 1.4), (x, 0.4 + D / 2 + 0.02, z), 'glass', bevel=0.0)              # back windows
        if k > 0 and x in (-3.6, 1.2):                                                    # balconies (two per floor)
            box((2.0, 0.9, 0.15), (x + 0.6 * (1 if x > 0 else 1), 0.4 - D / 2 - 0.45, k * F + 0.15), 'concrete', bevel=0.03)
            box((2.0, 0.06, 0.8), (x + 0.6, 0.4 - D / 2 - 0.88, k * F + 0.6), 'iron', bevel=0.0)
            for sx in (-1, 1):
                box((0.06, 0.9, 0.8), (x + 0.6 + sx * 0.97, 0.4 - D / 2 - 0.45, k * F + 0.6), 'iron', bevel=0.0)
box((2.0, 0.15, 2.4), (0, 0.4 - D / 2 - 0.03, 1.2), 'wood', bevel=0.0)                  # entrance door
box((2.6, 1.0, 0.15), (0, 0.4 - D / 2 - 0.5, 2.6), 'steel', bevel=0.03)                # door canopy
box((1.6, 0.1, 0.25), (0, 0.4 - D / 2 - 0.12, 2.9), 'glow', bevel=0.0)                  # lit address strip
for sd in (-1, 1):                                                                       # roof parapet
    box((W + 0.2, 0.3, 0.6), (0, 0.4 + sd * (D / 2), 4 * F + 0.3), 'concrete', bevel=0.03)
    box((0.3, D + 0.2, 0.6), (sd * W / 2, 0.4, 4 * F + 0.3), 'concrete', bevel=0.03)
box((1.8, 1.8, 0.9), (2.5, 1.5, 4 * F + 0.45), 'steel', bevel=0.05)                    # roof stair hut
print(ship('n_apartment', chunk_cuts={'x': [0.0], 'z': [F, 2 * F, 3 * F]}))

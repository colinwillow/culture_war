# scrap club: pipe + bolt-studded iron lump. Origin at the grip, head along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)  # cylinder axis -> Y
cyl(0.022, 0.62, (0, -0.21, 0), 'steel', X, n=8)                 # pipe, y +0.10 .. -0.52
cyl(0.03, 0.16, (0, 0.0, 0), 'olive', X, n=8, bevel=0.006)        # cloth grip wrap
cyl(0.032, 0.03, (0, 0.10, 0), 'iron', X, n=8, bevel=0.006)       # pommel cap
cyl(0.03, 0.03, (0, -0.08, 0), 'rust', X, n=8)                    # wire band
box((0.09, 0.26, 0.09), (0, -0.66, 0), 'iron', bevel=0.02, taper=None)  # the lump
box((0.085, 0.06, 0.085), (0, -0.50, 0), 'rust', bevel=0.012)    # collar where pipe meets lump
for x in (-1, 1):
    for y in (-0.6, -0.72):
        cyl(0.011, 0.022, (x * 0.05, y, 0), 'bone', (0, 90 * x, 0), n=6, r2=0.004)   # bolt studs sides
        cyl(0.011, 0.022, (0, y, x * 0.05), 'bone', (0 if x > 0 else 180, 0, 0), n=6, r2=0.004)    # top/bottom
cyl(0.011, 0.022, (0, -0.795, 0), 'bone', (90, 0, 0), n=6, r2=0.004)
print(ship('w_brute_club'))

# street lamp: chunky post-top lantern (keeps the 0.4 m footprint). Origin at the base centre on the ground.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((0.4, 0.4, 0.12), (0, 0, 0.06), 'concrete', bevel=0.03)                 # footing
cyl(0.17, 0.5, (0, 0, 0.37), 'iron', n=8, r2=0.1, bevel=0.0)               # flared base
cyl(0.09, 4.3, (0, 0, 2.75), 'iron', n=8)                                   # pole
cyl(0.12, 0.14, (0, 0, 1.4), 'steel', n=8, bevel=0.02)                     # collar
cyl(0.12, 0.14, (0, 0, 4.85), 'steel', n=8, bevel=0.02)
box((0.36, 0.36, 0.08), (0, 0, 4.95), 'iron', bevel=0.02)                   # lantern base
box((0.28, 0.28, 0.32), (0, 0, 5.15), 'glow', bevel=0.0, taper=(1.15, 1.15))  # light
for x in (-1, 1):
    for y in (-1, 1):
        box((0.04, 0.04, 0.34), (x * 0.16, y * 0.16, 5.15), 'iron', bevel=0.0)
box((0.4, 0.4, 0.1), (0, 0, 5.35), 'iron', bevel=0.03, taper=(0.5, 0.5))   # cap
cyl(0.03, 0.12, (0, 0, 5.44), 'iron', n=6)
print(ship('c_lamp'))

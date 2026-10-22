# shoulder cannon for the Heavy: fat riveted tube, amber vents. Origin at the shoulder mount, muzzle along +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0); ZC = 0.22
cyl(0.19, 1.25, (0, -0.30, ZC), 'steel', X, n=10)                          # main tube y +0.33 .. -0.93
cyl(0.23, 0.14, (0, -1.0, ZC), 'iron', X, n=10, bevel=0.02)               # muzzle ring
cyl(0.15, 0.04, (0, -1.08, ZC), 'iron', X, n=10)                           # bore face
cyl(0.11, 0.05, (0, -1.10, ZC), 'tire', X, n=10)                           # dark bore
cyl(0.21, 0.18, (0, 0.40, ZC), 'iron', X, n=10, bevel=0.02)               # breech cap
cyl(0.12, 0.10, (0, 0.53, ZC), 'rust', X, n=8, bevel=0.015)               # breech knob
for y in (0.15, -0.35, -0.75):
    cyl(0.205, 0.07, (0, y, ZC), 'iron', X, n=10, bevel=0.01)             # riveted bands
    for a in range(0, 360, 60):
        r = math.radians(a)
        ob = cyl(0.018, 0.03, (0.215 * math.cos(r), y, ZC + 0.215 * math.sin(r)), 'bone', (0, 0, 0), n=6, r2=0.008)
        ob.rotation_euler = (0, math.pi / 2 - r, 0)
cyl(0.198, 0.06, (0, -0.55, ZC), 'team', X, n=10)                          # crimson team band
# amber vents: three slits each side
for s in (-1, 1):
    for y in (-0.05, -0.15, -0.25):
        box((0.014, 0.05, 0.15), (s * 0.222, y, ZC), 'glow', bevel=0.0)
    box((0.06, 0.34, 0.22), (s * 0.19, -0.15, ZC), 'iron', bevel=0.015)
# shoulder mount: saddle plate + bracket
box((0.30, 0.40, 0.06), (0, 0.0, 0.0), 'iron', bevel=0.02)
box((0.12, 0.30, 0.10), (0, 0.0, 0.07), 'rust', bevel=0.02)
box((0.04, 0.06, 0.10), (0.1, -0.15, 0.03), 'steel', bevel=0.01)
box((0.04, 0.06, 0.10), (-0.1, -0.15, 0.03), 'steel', bevel=0.01)
box((0.06, 0.10, 0.14), (0.0, 0.32, 0.35), 'steel', bevel=0.015)          # sight block
print(ship('w_brute_cannon'))

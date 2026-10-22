# Heavy's shoulder cannon v2 (detail pass, after Colin's Heavy sheet): fat riveted barrel with glowing amber
# windows between iron rings, ivory/orange cone spikes, crimson team band, crown tag, feed hoses.
# Origin at the shoulder mount, muzzle along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
spike, crown, banner = brute_style()   # Brute sheets: gear-wrench brand, iron studs
X = (90, 0, 0); ZC = 0.22
cyl(0.17, 1.2, (0, -0.3, ZC), 'iron', X, n=10)                                   # core tube
for y in (-0.05, -0.45):                                                          # glowing sections, caged
    cyl(0.185, 0.22, (0, y, ZC), 'glow', X, n=10)
    for a in range(0, 360, 45):
        r = math.radians(a)
        b = box((0.04, 0.24, 0.04), (math.cos(r) * 0.19, y, ZC + math.sin(r) * 0.19), 'iron', bevel=0.0)
        b.rotation_euler = (0, -r, 0)
for y in (0.12, -0.25, -0.65):
    cyl(0.215, 0.09, (0, y, ZC), 'iron', X, n=10, bevel=0.012)                    # heavy rings
    for a in range(0, 360, 60):
        r = math.radians(a); hexbolt(0.016, (math.cos(r) * 0.22, y, ZC + math.sin(r) * 0.22), (math.cos(r), 0, math.sin(r)), 'ivory')
cyl(0.2, 0.12, (0, -0.8, ZC), 'team', X, n=10)                                    # crimson team band
cyl(0.24, 0.16, (0, -0.98, ZC), 'iron', X, n=10, bevel=0.02)                      # muzzle
cyl(0.16, 0.03, (0, -1.065, ZC), 'glow', X, n=10)                                  # glowing bore
cyl(0.12, 0.035, (0, -1.07, ZC), 'dark', X, n=10)
for a in (30, 150, 270):
    r = math.radians(a); spike(0.03, 0.09, (math.cos(r) * 0.23, -0.98, ZC + math.sin(r) * 0.23), (math.cos(r), -0.35, math.sin(r)))
# breech: ivory armour plate with a crown tag + spikes
cyl(0.22, 0.2, (0, 0.33, ZC), 'ivory', X, n=10, bevel=0.03)
cyl(0.12, 0.1, (0, 0.47, ZC), 'iron', X, n=6, bevel=0.015)
crown(0.16, (0.0, -0.25, ZC + 0.222), normal=(0, 0, 1), up=(0, -1, 0), t=0.006)
spike(0.03, 0.1, (0, 0.33, ZC + 0.22), (0, 0.2, 1))
# feed hoses from the breech down to the mount
for s in (-1, 1):
    cyl(0.03, 0.4, (s * 0.12, 0.3, 0.06), 'dark', (60, 0, 0), n=6)
# shoulder mount
box((0.3, 0.4, 0.06), (0, 0.0, 0.0), 'iron', bevel=0.02)
box((0.12, 0.3, 0.1), (0, 0.0, 0.07), 'burnt', bevel=0.02)
box((0.06, 0.1, 0.14), (0.0, 0.32, 0.43), 'steel', bevel=0.015)                   # sight block

# ---- detail pass 2: panel lines on the rings, rust wear, a crimson stripe on the breech cap, hazard notch on the muzzle
for y in (0.28, 0.38): cyl(0.223, 0.012, (0, y, ZC), 'dark', (90, 0, 0), n=10)
box((0.06, 0.18, 0.01), (0.12, -0.25, ZC + 0.2), 'rust', rot=(0, 30, 0), bevel=0.0)
cyl(0.224, 0.04, (0, 0.33, ZC), 'team', (90, 0, 0), n=10)

# ---- BRUTE PASS: an orange painted plate with a gear brand on the breech side, a bandolier feeding the breech
box((0.006, 0.2, 0.14), (0.22, 0.25, ZC), 'paint', bevel=0.0)
gearmark(0.12, (0.224, 0.25, ZC), (1, 0, 0), (0, 0, 1), 'ivory', 0.004)
bandolier((0.1, 0.45, 0.02), (0.14, 0.05, -0.08), 0.03)
print(ship('w_brute_cannon'))

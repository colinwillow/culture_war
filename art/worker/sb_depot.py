# Spore depot: spore silo -- a tall puffball with vents. Origin ground centre, front +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(2.0, (0, 0, 0.2), 'goo', 1, (1, 1, 0.3))                                   # root mat
for a in range(0, 360, 60):                                                       # root tendrils
    r = math.radians(a)
    t = cyl(0.25, 1.6, (math.cos(r) * 1.4, math.sin(r) * 1.4, 0.35), 'purple', n=5, r2=0.08)
    t.rotation_euler = (0, math.radians(70), r)
cyl(1.1, 1.6, (0, 0, 1.0), 'fungus', n=10, r2=1.4)                                # neck flaring into the ball
ball(1.85, (0, 0, 3.4), 'fungus', 2, (1, 1, 1.25))                                # the puffball (top ~5.7)
for i in range(6):                                                                # warty bumps
    r = math.radians(i * 60 + 20)
    ball(0.3, (math.cos(r) * 1.75, math.sin(r) * 1.75, 3.0 + (i % 2) * 1.0), 'purple', 1)
for z, a in ((4.6, 0), (3.6, 120), (4.1, 240)):                                   # glowing vents (rings + core)
    r = math.radians(a - 90)
    x, y = math.cos(r) * 1.6, math.sin(r) * 1.6
    v = torus(0.32, 0.1, (x, y, z), 'purple', n=10, m=5); v.rotation_euler = (math.radians(90), 0, r + math.pi / 2)
    b = ball(0.26, (x, y, z), 'gacid', 1)
torus(0.45, 0.14, (0, 0, 5.7), 'purple', n=10, m=5)                               # top vent
cyl(0.42, 0.1, (0, 0, 5.75), 'gacid', n=10)
box((1.3, 0.1, 0.5), (0, -1.38, 1.4), 'team', rot=(10, 0, 0), bevel=0.0)        # crimson bands front/back of the neck
box((1.3, 0.1, 0.5), (0, 1.38, 1.4), 'team', rot=(-10, 0, 0), bevel=0.0)

# ---- v2 detail pass: thorn spikes on the puffball, an acid canister cage at the base, crown tag, chain round the neck
for i in range(5):
    r = math.radians(i * 72 + 40); spike(0.14, 0.55, (math.cos(r) * 1.7, math.sin(r) * 1.7, 4.2), (math.cos(r), math.sin(r), 0.5))
for a in (200, 330):
    r = math.radians(a); canister(0.17, 0.75, (math.cos(r) * 1.6, math.sin(r) * 1.6, 0.6), (0, 0, 1), 'gacid', bars=3, ribs=1)
crown(0.9, (0, -1.85, 3.2), normal=(0, -1, 0), up=(0, 0, 1), t=0.03)
for a in range(0, 360, 30):
    r = math.radians(a); torus(0.09, 0.03, (math.cos(r) * 1.28, math.sin(r) * 1.28, 1.75), 'iron', rot=(0, 90 * (a // 30 % 2), a), n=8, m=4)

# ---- detail pass 2: crimson crown banner on the neck, goo drips under the puffball, extra pustules
banner(0.7, 0.8, (0.9, -1.25, 2.3), (0, -1, 0), mark='crown')
for a in (30, 150, 270): r = math.radians(a); cyl(0.1, 0.5, (math.cos(r) * 1.2, math.sin(r) * 1.2, 2.0), 'goo', n=6, r2=0.03)
# ---- hex board (Colin, Oct 22): flat-top HEX pad under the building, rim lip + 6 corner nubs
hexplinth(2.1, 0.14, (0, 0, 0), 'goo', bevel=0.04)  # HEX pad
hexplinth(2.1 + 0.06, 0.06, (0, 0, 0.1), 'cyan' if 'goo' == 'gunmetal' else 'purple', bevel=0.0)
for k in range(6):
    a = math.radians(60 * k); ball(2.1 * 0.06, (math.cos(a) * 2.1, math.sin(a) * 2.1, 0.16), 'gcyan' if 'goo' == 'gunmetal' else 'gacid', 1)
print(ship('sb_depot', clip=True))

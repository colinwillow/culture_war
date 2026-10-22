# Spore tower: spitter stalk -- a bent stalk with a gaping bulb on top (mouth faces +Z). Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(1.2, (0, 0, 0.1), 'goo', 1, (1, 1, 0.35))                                     # root base
cyl(0.9, 0.5, (0, 0, 0.3), 'team', n=8, r2=0.8)                                      # crimson root collar
# stalk: segments bending back then forward (an S), getting thinner
pts = [(0, 0.0, 0.4), (0, 0.35, 2.0), (0, 0.55, 3.6), (0, 0.3, 5.0), (0, -0.25, 6.0)]
rads = [0.55, 0.48, 0.42, 0.38]
for i in range(4):
    a, b = Vector(pts[i]), Vector(pts[i + 1]); d = b - a
    s = cyl(rads[i], d.length + 0.3, tuple((a + b) / 2), 'fungus' if i % 2 == 0 else 'purple', n=8, r2=rads[i] * 0.85)
    s.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    ball(rads[i] * 1.1, tuple(b), 'purple', 1)                                       # knuckle joints
# the bulb, tilted to face forward/down, with a gaping mouth
B = Vector((0, -0.6, 6.8))
ball(1.15, tuple(B), 'fungus', 2, (1, 1.05, 1.0))
ball(0.75, tuple(B + Vector((0, -1.0, 0))), 'gacid', 2, (1, 0.45, 1.0))          # glowing throat in the open mouth
torus(0.72, 0.18, tuple(B + Vector((0, -1.12, 0))), 'purple', rot=(90, 0, 0), n=12, m=5)   # lips
for i in range(8):                                                                   # teeth round the lips
    a = 2 * math.pi * i / 8
    t = cyl(0.09, 0.3, tuple(B + Vector((math.cos(a) * 0.55, -1.15, math.sin(a) * 0.55))), 'bone', n=4, r2=0.0)
    t.rotation_euler = (math.radians(90), 0, 0); t.rotation_euler.rotate_axis('Y', 0)
    t.rotation_euler = Vector((-math.cos(a), 0, -math.sin(a))).to_track_quat('Z', 'Y').to_euler()
for (x, z) in ((-0.8, 7.3), (0.75, 7.2), (0.0, 7.9)):
    ball(0.22, (x, -0.2, z), 'gacid', 1)                                             # pustules on the bulb

# ---- v2 detail pass: thorn spikes along the stalk + on the bulb, acid canister strapped to the stalk, crown tag
for i, (x, y, z) in enumerate(((0.45, 0.4, 1.8), (-0.45, 0.6, 3.0), (0.4, 0.5, 4.2), (-0.38, 0.0, 5.4))):
    spike(0.08, 0.35, (x, y, z), (x, 0.2, 0.4))
for (x, z) in ((-1.0, 7.0), (1.0, 6.9), (0.0, 7.95)):
    spike(0.1, 0.4, (x, -0.4, z), (x, 0.2, 0.6 if z < 7.5 else 1))
canister(0.16, 0.7, (0.0, -0.05, 2.8), (0, 0.15, 1), 'gacid', bars=3, ribs=1)
crown(0.6, (0, -0.85, 0.5), normal=(0, -1, 0.3), up=(0, 0, 1), t=0.02)

# ---- detail pass 2: crimson crown pennant on the stalk, goo dripping from the lips
banner(0.5, 0.7, (0, -0.2, 4.6), (0, -1, 0), mark='crown')
for x in (-0.3, 0.25): cyl(0.07, 0.5, (x, -1.65, 6.3), 'goo', n=5, r2=0.02)
print(ship('sb_tower', clip=True))

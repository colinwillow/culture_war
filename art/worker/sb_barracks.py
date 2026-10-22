# Spore barracks: spawning pod bed -- 5 egg sacs in a goo pool. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(3.5, (0, 0, 0), 'goo', 2, (1, 1, 0.12))                                   # pool mound (rim)
cyl(3.0, 0.1, (0, 0, 0.4), 'gacid', n=16)                                       # glowing goo surface
for a in range(0, 360, 40):                                                      # fungal rim lumps
    r = math.radians(a)
    ball(0.6, (math.cos(r) * 3.1, math.sin(r) * 3.1, 0.25), 'fungus' if a % 80 else 'purple', 1, (1, 1, 0.7))
cyl(0.5, 0.3, (3.1, 0, 0.5), 'team', n=8)                                         # crimson markers on two rim lumps
cyl(0.5, 0.3, (-3.1, 0, 0.5), 'team', n=8)
eggs = ((0, 0, 1.3), (1.6, 0.9, 1.0), (-1.5, 1.0, 1.1), (1.2, -1.4, 0.9), (-1.2, -1.3, 1.0))
for (x, y, s) in eggs:
    ball(0.45 * s, (x, y, 0.4 + 0.9 * s), 'gacid', 1, (1, 1, 1.3))                  # glowing embryo
    ball(0.85 * s, (x, y, 0.35 + 0.95 * s), 'cpurple', 2, (1, 1, 1.35))             # translucent egg sac
    cyl(0.25 * s, 0.4, (x, y, 0.45), 'purple', n=6)                                   # stalk into the goo

# ---- v2 detail pass: thorn spikes on the rim lumps, acid canisters feeding the pool, crown tags on two rim stones
for a in range(20, 360, 80):
    r = math.radians(a); spike(0.12, 0.5, (math.cos(r) * 3.1, math.sin(r) * 3.1, 0.55), (math.cos(r) * 0.4, math.sin(r) * 0.4, 1))
for a in (120, 240):
    r = math.radians(a); canister(0.2, 0.9, (math.cos(r) * 3.3, math.sin(r) * 3.3, 0.6), (0, 0, 1), 'gacid', bars=3, ribs=1)
for a in (60, 300):
    r = math.radians(a); crown(0.6, (math.cos(r) * 3.55, math.sin(r) * 3.55, 0.45), normal=(math.cos(r), math.sin(r), 0.4), up=(0, 0, 1), t=0.02)

# ---- detail pass 2: crimson crown pennants on two stakes by the pool, goo drips on the rim
for a in (-60, -120):
    r = math.radians(a); x, y = math.cos(r) * 3.4, math.sin(r) * 3.4
    cyl(0.05, 1.6, (x, y, 0.8), 'iron', n=4); banner(0.5, 0.6, (x, y - 0.05, 1.55), (0, -1, 0), mark='crown')

# ---- detail pass 6 (silhouette): two tall mushrooms rising behind the pool + a glowing cap ring
for (x, y, h, r) in ((-1.9, 2.6, 2.9, 1.0), (1.4, 2.9, 2.3, 0.8)):
    cyl(r * 0.4, h, (x, y, h / 2), 'fungus', n=8, r2=r * 0.3)
    ball(r, (x, y, h), 'purple', 2, (1, 1, 0.45))
    cyl(r * 0.8, 0.12, (x, y, h - 0.15), 'gacid', n=10)
print(ship('sb_barracks', clip=True))

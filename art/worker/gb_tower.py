# Greys tower: probe spire -- thin white needle with a floating ring near the top. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
cyl(1.25, 0.4, (0, 0, 0.2), 'gunmetal', n=12, bevel=0.05)                    # base disc
cyl(1.0, 0.8, (0, 0, 0.8), 'pearl', n=12, r2=0.45)                           # flared foot
box((0.9, 0.08, 0.35), (0, -0.92, 0.55), 'team', rot=(-20, 0, 0), bevel=0.0)  # crimson panels (front/back)
box((0.9, 0.08, 0.35), (0, 0.92, 0.55), 'team', rot=(20, 0, 0), bevel=0.0)
cyl(0.45, 6.5, (0, 0, 4.45), 'pearl', n=10, r2=0.18)                         # the needle
cyl(0.18, 1.3, (0, 0, 8.35), 'pearl', n=8, r2=0.0)                           # tip
for z in (2.4, 4.4):
    cyl(0.42, 0.12, (0, 0, z), 'gcyan', n=10)                                # glow seams
# floating ring (no attachment) + emitter bulb
torus(1.0, 0.2, (0, 0, 7.6), 'gunmetal', rot=(8, 0, 0), n=16, m=6)          # tilted, touching nothing
for i in range(6):
    a = 2 * math.pi * i / 6
    box((0.3, 0.44, 0.1), (math.cos(a) * 1.0, math.sin(a) * 1.0 * 0.99, 7.6 + math.sin(a) * 0.14), 'gcyan', rot=(8, 0, math.degrees(a) + 90), bevel=0.0)
ball(0.3, (0, 0, 9.0), 'gcyan', 1)                                           # top glow

# ---- v2 detail pass: rust bands + bolts up the needle, cable spiral, cyan canister pair at the foot, crown tag
for z in (1.5, 3.4, 5.4):
    cyl(0.44 - z * 0.035, 0.18, (0, 0, z), 'rust', n=10)
for a in (45, 225):
    r = math.radians(a); canister(0.16, 0.9, (math.cos(r) * 1.0, math.sin(r) * 1.0, 1.0), (0, 0, 1), 'gcyan', bars=3, ribs=1)
for i in range(10):
    a = i * 0.9; z = 1.4 + i * 0.55; rr = 0.48 - z * 0.035
    ball(0.07, (math.cos(a) * rr, math.sin(a) * rr, z), 'dark', 1)
crown(0.6, (0, -0.56, 1.1), normal=(0, -1, 0.35), up=(0, 0, 1), t=0.02)

# ---- detail pass 2: crimson crown pennant below the ring, panel lines up the needle
banner(0.5, 0.9, (0, -0.33, 6.6), (0, -1, 0), mark='crown')
for z in (2.0, 3.0, 4.0, 5.0): cyl(0.45 - z * 0.037, 0.02, (0, 0, z), 'dark', n=10)
print(ship('gb_tower'))

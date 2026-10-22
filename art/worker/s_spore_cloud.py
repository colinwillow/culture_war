# Spore carrier: floating translucent sac with dangling tendrils and a green glow core.
# Lowest tendril tip at y 0, origin under the centre.
import sys, os, random; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
rnd = random.Random(3)
ball(1.15, (0, 0, 3.3), 'gacid', 2)                                             # glow core
ball(1.95, (0, 0, 3.35), 'cacid', 2, (1, 1, 0.85))                              # translucent sac (top ~5)
for a in range(0, 360, 60):                                                      # purple vein ribs over the sac
    r = math.radians(a)
    t = torus(1.9, 0.07, (0, 0, 3.35), 'purple', n=16, m=4)
    t.scale = (1, 1, 0.85); t.rotation_euler = (math.radians(90), 0, r)
ball(0.7, (0, 0, 1.75), 'purple', 1, (1, 1, 0.6))                                # under-knot
cyl(0.9, 0.25, (0, 0, 1.75), 'team', n=10)                                       # crimson band on the knot
for i in range(7):                                                               # dangling tendrils (two segments each)
    a = 2 * math.pi * i / 7 + rnd.uniform(-0.2, 0.2)
    x0, y0 = math.cos(a) * 0.5, math.sin(a) * 0.5
    x1, y1 = math.cos(a) * 1.0, math.sin(a) * 1.0
    L1 = rnd.uniform(0.7, 1.0)
    seg = cyl(0.12, 1.0, ((x0 + x1) / 2, (y0 + y1) / 2, 1.2), 'purple', n=5, r2=0.09)
    seg.rotation_euler = Vector((x1 - x0, y1 - y0, -1.0)).to_track_quat('Z', 'Y').to_euler()
    zt = rnd.uniform(0.0, 0.3) if i else 0.0
    seg2 = cyl(0.09, 0.75 - zt, (x1 * 1.05, y1 * 1.05, 0.35 + zt / 2), 'goo', n=5, r2=0.03)
    ball(0.1, (x1 * 1.05, y1 * 1.05, zt + 0.0 + 0.08), 'gacid', 1)                # glowing drip tips

# ---- v2 detail pass: scavenged harness -- an iron band + bolts round the sac, two acid canisters hung off it with
# chains, thorn spikes on the knot, a crown tag on the band
torus(1.98, 0.08, (0, 0, 3.0), 'iron', n=16, m=4)
for a in range(0, 360, 60):
    r = math.radians(a); hexbolt(0.06, (math.cos(r) * 2.05, math.sin(r) * 2.05, 3.0), (math.cos(r), math.sin(r), 0))
for a in (60, 240):
    r = math.radians(a); x, y = math.cos(r) * 2.05, math.sin(r) * 2.05
    chain((x, y, 2.95), (x * 1.02, y * 1.02, 2.3), 0.04)
    canister(0.14, 0.55, (x * 1.02, y * 1.02, 1.95), (0, 0, 1), 'gacid', bars=3, ribs=1)
for a in (0, 120, 240):
    r = math.radians(a); spike(0.08, 0.35, (math.cos(r) * 0.6, math.sin(r) * 0.6, 1.75), (math.cos(r), math.sin(r), -0.3))
crown(0.45, (0, -2.07, 3.0), normal=(0, -1, 0), up=(0, 0, 1), t=0.015)

# ---- detail pass 2: a crimson crown pennant trailing off the harness, goo drips on the sac
banner(0.35, 0.5, (0, 2.08, 2.95), (0, 1, 0), mark='crown')
for a in (30, 150, 270): r = math.radians(a); cyl(0.08, 0.4, (math.cos(r) * 1.5, math.sin(r) * 1.5, 2.1), 'goo', n=5, r2=0.02)
print(ship('s_spore_cloud'))

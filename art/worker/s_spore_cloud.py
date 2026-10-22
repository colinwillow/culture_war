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
print(ship('s_spore_cloud'))

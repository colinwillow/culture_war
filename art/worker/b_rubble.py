# v2 detail pass
# rubble piles, 3 sizes in one GLB (rubble_s ~1 x 0.4 x 1, rubble_m ~2 x 0.7 x 2, rubble_l ~3 x 1 x 3).
# Each origin at its ground centre; nodes spread along X (reset node position when placing).
import sys, os, random; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
def pile(size, h, n, seed):
    rnd = random.Random(seed); out = []
    out.append(ball(size * 0.45, (0, 0, 0), 'concrete', 1, (1, 0.9, h * 1.6 / size)))  # mound core
    cols = ['concrete', 'brick', 'brick', 'concrete', 'steel']
    for i in range(n):
        r = rnd.uniform(0.1, 0.45) * size / 2
        ang = rnd.uniform(0, 6.28); d = rnd.uniform(0, size * 0.32)
        x, y = math.cos(ang) * d, math.sin(ang) * d
        z = max(r * 0.4, (h * (1 - d / (size * 0.5)) - r * 0.3))
        s = (rnd.uniform(0.25, 0.5) * size, rnd.uniform(0.15, 0.4) * size, rnd.uniform(0.08, 0.2) * size)
        out.append(box(s, (x, y, z * 0.85), rnd.choice(cols), rot=(rnd.uniform(-30, 30), rnd.uniform(-30, 30), rnd.uniform(0, 90)), bevel=0.02))
    for i in range(max(1, n // 4)):
        ang = rnd.uniform(0, 6.28)
        out.append(cyl(0.025, size * 0.45, (math.cos(ang) * size * 0.2, math.sin(ang) * size * 0.2, h * 0.6), 'rust',
                       (rnd.uniform(30, 70), 0, math.degrees(ang)), n=5))
    # ---- v2 detail pass: extra rebar, a crown-tagged slab, a glowing ember
    for i in range(2):
        ang = rnd.uniform(0, 6.28)
        out.append(cyl(0.03, size * 0.5, (math.cos(ang) * size * 0.15, math.sin(ang) * size * 0.15, h * 0.7), 'rust',
                       (rnd.uniform(20, 60), 0, math.degrees(ang)), n=5))
    out.append(box((size * 0.35, size * 0.25, size * 0.05), (0, -size * 0.12, h * 0.75), 'brick', rot=(25, 0, 10), bevel=0.01))
    out.append(crown(size * 0.2, (0, -size * 0.12 - size * 0.06, h * 0.75 + size * 0.04), normal=(0, -0.42, 0.9), up=(0, 0.9, 0.42), t=0.006))
    out.append(ball(size * 0.05, (size * 0.15, size * 0.1, h * 0.4), 'glow', 1))
    return out
g = {'rubble_s': pile(1.0, 0.4, 6, 1), 'rubble_m': pile(2.0, 0.7, 10, 2), 'rubble_l': pile(3.0, 1.0, 14, 3)}
# clip anything below ground: the mound cores extend under y=0, cut them flat
print(ship_multi('b_rubble', g, spacing=3.5, clip=True))

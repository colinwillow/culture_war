# Reptilian barracks: sunken pit arena ringed with stone teeth. Origin ground centre, entrance faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
N = 12
cyl(3.0, 0.1, (0, 0, 0.05), 'fungus', n=N)                                   # sand floor at ground level (the pit)
cyl(1.0, 0.04, (0, 0, 0.11), 'iron', n=8)                                     # dark stain in the middle
for i in range(N):                                                            # rim: stone blocks in a ring, open at the front
    a = 2 * math.pi * (i + 0.5) / N
    if i == 9: continue
    seg = box((1.15, 2 * math.pi * 2.95 / N + 0.1, 1.0), (math.cos(a) * 2.95, math.sin(a) * 2.95, 0.5), 'stone', bevel=0.08)
    seg.rotation_euler = (0, 0, a)
    m = box((1.2, 2 * math.pi * 2.95 / N + 0.12, 0.14), (math.cos(a) * 2.95, math.sin(a) * 2.95, 1.0), 'moss', bevel=0.04)
    m.rotation_euler = (0, 0, a)
for i in range(N):                                                            # stone teeth round the rim, leaning in
    a = 2 * math.pi * (i + 0.5) / N
    if i == 9: continue                                                       # gap = entrance at the front (-Y)
    h = 2.0 if i % 2 else 1.6
    t = cyl(0.45, h, (math.cos(a) * 2.95, math.sin(a) * 2.95, 0.9 + h / 2), 'stone', n=5, r2=0.06)
    t.rotation_euler = (0, 0, a); t.rotation_euler.rotate_axis('Y', math.radians(-14))
for i in (2, 5):                                                              # crimson banners hung on two teeth
    a = 2 * math.pi * (i + 0.5) / N
    b = box((0.7, 0.06, 1.0), (math.cos(a) * 3.38, math.sin(a) * 3.38, 1.6), 'team', bevel=0.0)
    b.rotation_euler = (0, 0, a + math.pi / 2)
# ramp into the pit through the gap, with two lime torches
box((1.4, 1.2, 0.12), (0, -2.95, 0.12), 'stone', bevel=0.03)                 # threshold slab
for s in (-1, 1):
    cyl(0.1, 1.3, (s * 1.0, -3.3, 0.65), 'bronze', n=6)
    ball(0.22, (s * 1.0, -3.3, 1.4), 'glime', 1)
print(ship('rb_barracks'))

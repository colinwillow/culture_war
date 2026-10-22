# Greys HQ: landed mothership hub -- low saucer dome on three legs, ring of cyan windows, crimson band.
# Origin ground centre, boarding ramp faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
N = 20
cyl(4.9, 0.8, (0, 0, 2.8), 'pearl', n=N, r2=4.9)                    # rim band body (y 1.9 .. 2.8)
cyl(4.9, 0.8, (0, 0, 2.0), 'gunmetal', n=N, r2=2.2) .rotation_euler = (math.pi, 0, 0)   # underside cone (wide at top)
cyl(4.95, 0.3, (0, 0, 2.8), 'team', n=N)                             # crimson band round the rim
cyl(4.9, 0.8, (0, 0, 3.6), 'pearl', n=N, r2=3.0)                      # upper deck slope
ball(2.7, (0, 0, 3.9), 'pearl', 2, (1, 1, 0.62))                       # dome (top ~6 m)
cyl(1.0, 0.3, (0, 0, 5.55), 'gunmetal', n=12)                          # dome cap
cyl(0.5, 0.25, (0, 0, 5.75), 'gcyan', n=12)                            # cyan beacon
for i in range(12):                                                    # ring of cyan windows on the upper slope
    a = 2 * math.pi * (i + 0.5) / 12
    w = box((0.9, 0.12, 0.35), (math.cos(a) * 4.15, math.sin(a) * 4.15, 3.6), 'gcyan', bevel=0.0)
    w.rotation_euler = (math.radians(-55), 0, a + math.pi / 2)
    w.rotation_euler = (0, 0, a + math.pi / 2); w.rotation_euler.rotate_axis('X', math.radians(-38))
for i in range(3):                                                     # three landing legs
    a = 2 * math.pi * i / 3 + math.pi / 2 + math.pi / 3
    x, y = math.cos(a), math.sin(a)
    leg = box((0.45, 0.45, 2.7), (x * 3.6, y * 3.6, 1.3), 'gunmetal', bevel=0.06)
    leg.rotation_euler = (0, 0, a); leg.rotation_euler.rotate_axis('Y', math.radians(-22))
    cyl(0.75, 0.2, (x * 4.1, y * 4.1, 0.1), 'gunmetal', n=10, bevel=0.04)  # foot pads
    cyl(0.35, 0.08, (x * 4.1, y * 4.1, 0.24), 'gcyan', n=10)
# boarding ramp down to +Z with a glow strip, and the belly hatch light
r = box((1.8, 3.0, 0.15), (0, -2.6, 1.0), 'pearl', rot=(-34, 0, 0), bevel=0.03)
box((0.3, 2.8, 0.05), (0, -2.55, 1.1), 'gcyan', rot=(-34, 0, 0), bevel=0.0)
cyl(1.4, 0.12, (0, 0, 1.6), 'gcyan', n=12)

# ---- v2 detail pass (scrappy Greys): rust patch plates with bolts on the hull, antenna masts, cyan canisters on the legs,
# cables, crown tags on the rim
for a in (20, 110, 200, 290):
    r = math.radians(a); x, y = math.cos(r) * 3.9, math.sin(r) * 3.9
    p = box((1.6, 1.0, 0.1), (x, y, 3.62), 'rust', bevel=0.03); p.rotation_euler = (0, 0, r + math.pi / 2)
    p.rotation_euler.rotate_axis('X', math.radians(23))
    for k in (-0.4, 0.4): hexbolt(0.06, (x + math.cos(r + math.pi / 2) * k, y + math.sin(r + math.pi / 2) * k, 3.75), (math.cos(r), math.sin(r), 0.8))
for a in (60, 240):
    r = math.radians(a); x, y = math.cos(r) * 1.6, math.sin(r) * 1.6
    cyl(0.05, 2.2, (x, y, 5.6), 'rust', n=5); ball(0.12, (x, y, 6.75), 'gcyan', 1)
    cyl(0.18, 0.12, (x, y, 5.9), 'gunmetal', n=6)
for i in range(3):
    a = 2 * math.pi * i / 3 + math.pi / 2 + math.pi / 3; x, y = math.cos(a), math.sin(a)
    canister(0.22, 1.0, (x * 3.75, y * 3.75, 1.1), (x * 0.4, y * 0.4, 1), 'gcyan', bars=3, ribs=1)
for a in (0, 90, 180, 270):
    r = math.radians(a + 45)
    crown(0.75, (math.cos(r) * 4.97, math.sin(r) * 4.97, 2.62), normal=(math.cos(r), math.sin(r), 0), up=(0, 0, 1), t=0.03)
print(ship('gb_hq'))

# Grey saucer: smooth disc, glass dome, ring of cyan lights underneath, crimson rim stripe. Bottom at y 0, front +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
N = 20
cyl(1.4, 0.55, (0, 0, 0.3), 'gunmetal', n=N, r2=3.0).rotation_euler = (0, 0, 0)   # belly cone (narrow at the bottom)
cyl(3.0, 0.3, (0, 0, 0.72), 'pearl', n=N)                                          # rim
cyl(3.03, 0.12, (0, 0, 0.72), 'team', n=N)                                         # crimson rim stripe
cyl(3.0, 0.45, (0, 0, 1.09), 'pearl', n=N, r2=1.5)                                 # upper slope
ball(1.25, (0, 0, 1.25), 'cglass', 2, (1, 1, 0.68))                                # glass dome (top ~2.1)
ball(0.45, (0, 0.1, 1.45), 'gunmetal', 1, (0.8, 1, 1.1))                            # pilot silhouette
for i in range(10):                                                                 # ring of cyan lights underneath
    a = 2 * math.pi * i / 10
    ball(0.17, (math.cos(a) * 2.05, math.sin(a) * 2.05, 0.2), 'gcyan', 1)
cyl(0.7, 0.08, (0, 0, 0.04), 'gcyan', n=12)                                        # tractor-beam lens

# ---- v2 detail pass (scrappy Greys): bolted rust patches on the disc, rear thruster canisters, antenna, crown tags
for a in (40, 160, 280):
    r = math.radians(a); x, y = math.cos(r) * 2.3, math.sin(r) * 2.3
    p = box((0.9, 0.55, 0.06), (x, y, 1.15), 'rust', bevel=0.02); p.rotation_euler = (0, 0, r + math.pi / 2); p.rotation_euler.rotate_axis('X', math.radians(17))
    hexbolt(0.05, (x, y, 1.2), (0, 0, 1))
for x in (-0.7, 0.7):
    canister(0.18, 0.8, (x, 2.75, 0.75), (0, 1, 0), 'gcyan', bars=3, ribs=1)        # rear thrusters
cyl(0.03, 0.9, (0.5, 0.4, 2.2), 'rust', n=4); ball(0.07, (0.5, 0.4, 2.65), 'gcyan', 1)
for a in (90, 270):
    r = math.radians(a + 45); crown(0.5, (math.cos(r) * 3.04, math.sin(r) * 3.04, 0.72), normal=(math.cos(r), math.sin(r), 0), up=(0, 0, 1), t=0.015)

# ---- detail pass 2: crimson crown pennants trailing from the rear, panel lines on the disc, cyan rim running lights
for x in (-0.4, 0.4): banner(0.35, 0.35, (x, 3.0, 0.85), (0, 1, 0), mark='crown')
cyl(2.6, 0.02, (0, 0, 1.0), 'dark', n=N); cyl(2.0, 0.02, (0, 0, 1.2), 'dark', n=N)
for a in range(0, 360, 30): r = math.radians(a); box((0.2, 0.05, 0.05), (math.cos(r) * 3.03, math.sin(r) * 3.03, 0.82), 'gcyan', rot=(0, 0, a + 90), bevel=0.0)
print(ship('s_grey_saucer'))

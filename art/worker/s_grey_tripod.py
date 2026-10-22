# EXTRA (not requested; from Colin's Grey sheet "HEAVY (TRIPOD PILOT)"): the tripod walker -- a riveted bone-and-iron
# pod with a crimson rim band, an orange glass dome over a Grey pilot, glowing orange portholes, a belly lamp, antennas,
# three jointed legs with crimson UFO-mark plates and big toed feet. Origin ground centre, front +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
from kit import _aim
reset()
crown, banner = grey_style()
P = Vector((0, 0, 3.0))                                                  # pod centre
ball(1.5, tuple(P), 'pearl', 2, (1.0, 1.05, 0.72))                      # pod
cyl(1.52, 0.35, tuple(P + Vector((0, 0, 0.25))), 'team', n=16)            # crimson rim band
cyl(1.45, 0.5, tuple(P + Vector((0, 0, -0.35))), 'pearl', n=16, r2=1.0)  # bone lower hull
speckle(tuple(P), 1.5, 24, seed=51, scale=(1, 1.05, 0.72), size=0.06)
ball(1.05, tuple(P + Vector((0, -0.15, 0.55))), 'corange', 2, (1, 1, 0.85))   # orange glass dome
ball(0.32, tuple(P + Vector((0, -0.1, 0.65))), 'pearl', 1, (1, 0.9, 1.15))  # pilot head
for s in (-1, 1): ball(0.09, tuple(P + Vector((s * 0.12, -0.38, 0.68))), 'dark', 1, (1, 0.6, 1.3))
ufomark(0.7, tuple(P + Vector((0.6, -1.33, 0.25))), (0.35, -1, 0), (0, 0, 1), 'ivory')
for a in (-50, 50, 180):                                                  # glowing portholes
    r = math.radians(a - 90); speaker(0.22, tuple(P + Vector((math.cos(r) * 1.45, math.sin(r) * 1.45, -0.15))), (math.cos(r), math.sin(r), 0), 'gorange')
ball(0.3, tuple(P + Vector((0, 0, -1.05))), 'iron', 1); ball(0.18, tuple(P + Vector((0, -0.05, -1.25))), 'gorange', 1)   # belly lamp
for x in (-0.8, 0.9):
    cyl(0.05, 1.3, tuple(P + Vector((x, 0.6, 1.4))), 'iron', n=5); ball(0.12, tuple(P + Vector((x, 0.6, 2.1))), 'gorange', 1)
# three legs: hip -> knee (out and up) -> foot
for k, a in enumerate((-90 + 60, -90 - 60, 90)):
    r = math.radians(a); d = Vector((math.cos(r), math.sin(r), 0))
    hip = P + d * 1.2 + Vector((0, 0, -0.2)); knee = P + d * 2.3 + Vector((0, 0, 0.4)); foot = d * 2.6
    for p0, p1, rad, col in ((hip, knee, 0.25, 'pearl'), (knee, foot + Vector((0, 0, 0.35)), 0.2, 'gunmetal')):
        dd = p1 - p0; seg = cyl(rad, dd.length, tuple((p0 + p1) / 2), col, n=8); _aim(seg, dd)
    ball(0.33, tuple(hip), 'iron', 1); speaker(0.3, tuple(knee), tuple(d.cross(Vector((0, 0, 1)))), 'gorange')
    mid = knee + (foot + Vector((0, 0, 0.35)) - knee) * 0.45
    pl = box((0.55, 0.08, 0.7), tuple(mid + d * 0.22), 'team', bevel=0.02); pl.rotation_euler = (0, 0, r + math.pi / 2)
    ufomark(0.42, tuple(mid + d * 0.27), tuple(d), (0, 0, 1), 'ivory')
    box((0.9, 0.7, 0.3), tuple(foot + Vector((0, 0, 0.15))), 'pearl', rot=(0, 0, a), bevel=0.06)   # foot
    for t in (-1, 1): box((0.25, 0.2, 0.2), tuple(foot + d * 0.5 + d.cross(Vector((0, 0, 1))) * t * 0.25 + Vector((0, 0, 0.1))), 'gunmetal', rot=(0, 0, a), bevel=0.03)
print(ship('s_grey_tripod'))

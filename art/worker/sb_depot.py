# Spore depot: spore silo -- a tall puffball with vents. Origin ground centre, front +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(2.0, (0, 0, 0.2), 'goo', 1, (1, 1, 0.3))                                   # root mat
for a in range(0, 360, 60):                                                       # root tendrils
    r = math.radians(a)
    t = cyl(0.25, 1.6, (math.cos(r) * 1.4, math.sin(r) * 1.4, 0.35), 'purple', n=5, r2=0.08)
    t.rotation_euler = (0, math.radians(70), r)
cyl(1.1, 1.6, (0, 0, 1.0), 'fungus', n=10, r2=1.4)                                # neck flaring into the ball
ball(1.85, (0, 0, 3.4), 'fungus', 2, (1, 1, 1.25))                                # the puffball (top ~5.7)
for i in range(6):                                                                # warty bumps
    r = math.radians(i * 60 + 20)
    ball(0.3, (math.cos(r) * 1.75, math.sin(r) * 1.75, 3.0 + (i % 2) * 1.0), 'purple', 1)
for z, a in ((4.6, 0), (3.6, 120), (4.1, 240)):                                   # glowing vents (rings + core)
    r = math.radians(a - 90)
    x, y = math.cos(r) * 1.6, math.sin(r) * 1.6
    v = torus(0.32, 0.1, (x, y, z), 'purple', n=10, m=5); v.rotation_euler = (math.radians(90), 0, r + math.pi / 2)
    b = ball(0.26, (x, y, z), 'gacid', 1)
torus(0.45, 0.14, (0, 0, 5.7), 'purple', n=10, m=5)                               # top vent
cyl(0.42, 0.1, (0, 0, 5.75), 'gacid', n=10)
box((1.3, 0.1, 0.5), (0, -1.38, 1.4), 'team', rot=(10, 0, 0), bevel=0.0)        # crimson bands front/back of the neck
box((1.3, 0.1, 0.5), (0, 1.38, 1.4), 'team', rot=(-10, 0, 0), bevel=0.0)
print(ship('sb_depot', clip=True))

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
print(ship('s_grey_saucer'))

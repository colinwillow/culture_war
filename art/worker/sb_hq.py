# Spore HQ: giant mushroom-cluster mother-mound with a glowing sac core. Origin ground centre, sac faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(4.6, (0, 0.3, 0), 'goo', 2, (1.0, 0.95, 0.45))                              # mound (clipped at ground)
ball(2.2, (2.3, 1.8, 0.4), 'goo', 1, (1, 1, 0.7))
ball(2.0, (-2.5, 1.6, 0.3), 'goo', 1, (1, 1, 0.6))
def shroom(x, y, h, r, cap='purple', lean=(0, 0)):
    cyl(r * 0.45, h, (x, y, h / 2), 'fungus', rot=(lean[0], lean[1], 0), n=8, r2=r * 0.32)
    cx = x + math.sin(math.radians(lean[1])) * h; cy = y - math.sin(math.radians(lean[0])) * h
    ball(r, (cx, cy, h), cap, 2, (1, 1, 0.45))                                        # cap
    cyl(r * 0.85, 0.15, (cx, cy, h - 0.12), 'bone', n=12)                             # gill ring
    return cx, cy
cx, cy = shroom(0.0, 1.0, 8.1, 2.4, 'purple')                                         # the big one (top ~9 m)
for a in (0, 72, 144, 216, 288):                                                       # crimson spots on the big cap
    r = math.radians(a)
    ball(0.42, (cx + math.cos(r) * 1.3, cy + math.sin(r) * 1.3, 8.1 + 0.75), 'team', 1, (1, 1, 0.4))
ball(0.5, (cx, cy, 8.1 + 1.05), 'team', 1, (1, 1, 0.4))
shroom(-2.8, 0.6, 5.0, 1.7, 'fungus', (0, -9))
shroom(2.9, 0.4, 5.6, 1.6, 'purple', (0, 10))
shroom(1.6, 3.2, 3.6, 1.2, 'fungus', (14, 0))
shroom(-1.8, 3.0, 3.2, 1.1, 'purple', (12, -10))
# glowing sac core at the front: translucent outer sac round a bright acid core, veins
ball(0.95, (0, -3.0, 1.2), 'gacid', 2)
ball(1.6, (0, -3.0, 1.35), 'cacid', 2, (1, 0.9, 1.0))
for a in (-40, 0, 40):
    v = cyl(0.12, 2.4, (math.sin(math.radians(a)) * 1.2, -1.8, 1.6), 'purple', rot=(-60, 0, a), n=5)
# little glowing pustules over the mound
for (x, y) in ((-3.2, -1.2), (3.0, -1.5), (-1.5, -2.0), (2.0, 2.6), (-3.6, 2.4)):
    ball(0.3, (x, y, 0.9), 'gacid', 1)
print(ship('sb_hq', clip=True))

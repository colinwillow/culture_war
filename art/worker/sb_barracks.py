# Spore barracks: spawning pod bed -- 5 egg sacs in a goo pool. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(3.5, (0, 0, 0), 'goo', 2, (1, 1, 0.12))                                   # pool mound (rim)
cyl(3.0, 0.1, (0, 0, 0.4), 'gacid', n=16)                                       # glowing goo surface
for a in range(0, 360, 40):                                                      # fungal rim lumps
    r = math.radians(a)
    ball(0.6, (math.cos(r) * 3.1, math.sin(r) * 3.1, 0.25), 'fungus' if a % 80 else 'purple', 1, (1, 1, 0.7))
cyl(0.5, 0.3, (3.1, 0, 0.5), 'team', n=8)                                         # crimson markers on two rim lumps
cyl(0.5, 0.3, (-3.1, 0, 0.5), 'team', n=8)
eggs = ((0, 0, 1.3), (1.6, 0.9, 1.0), (-1.5, 1.0, 1.1), (1.2, -1.4, 0.9), (-1.2, -1.3, 1.0))
for (x, y, s) in eggs:
    ball(0.45 * s, (x, y, 0.4 + 0.9 * s), 'gacid', 1, (1, 1, 1.3))                  # glowing embryo
    ball(0.85 * s, (x, y, 0.35 + 0.95 * s), 'cpurple', 2, (1, 1, 1.35))             # translucent egg sac
    cyl(0.25 * s, 0.4, (x, y, 0.45), 'purple', n=6)                                   # stalk into the goo
print(ship('sb_barracks', clip=True))

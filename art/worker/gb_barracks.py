# Greys barracks: cloning lab -- squat dome with 3 glowing pods on the side. Origin ground centre, door faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
cyl(3.0, 0.5, (0, 0, 0.25), 'gunmetal', n=16, bevel=0.05)                 # plinth
cyl(2.8, 1.0, (0, 0, 1.0), 'pearl', n=16)                                  # drum
ball(2.8, (0, 0, 1.5), 'pearl', 2, (1, 1, 0.85))                           # squat dome (top ~3.9)
cyl(2.85, 0.25, (0, 0, 1.45), 'team', n=16)                                # crimson band
cyl(0.7, 0.4, (0, 0, 4.0), 'gunmetal', n=10)                               # vent cap
cyl(0.4, 0.15, (0, 0, 4.25), 'gcyan', n=10)
box((1.4, 0.4, 1.6), (0, -2.75, 1.3), 'gunmetal', bevel=0.1)              # door frame
box((1.0, 0.1, 1.3), (0, -2.97, 1.2), 'gcyan', bevel=0.0)                 # glowing door
# three clone pods on the +X side: capsule tubes with cyan fluid and a body shadow
for i, a in enumerate((-50, 0, 50)):
    r = math.radians(a)
    x, y = math.cos(r) * 3.0, math.sin(r) * 3.0
    x, y = x * 1.08, y * 1.08
    cyl(0.6, 0.3, (x, y, 0.15), 'gunmetal', n=10, bevel=0.04)             # pod base
    cyl(0.5, 2.6, (x, y, 1.6), 'ccyan', n=10)                              # translucent glass tube
    cyl(0.3, 2.3, (x, y, 1.55), 'gcyan', n=8)                              # glowing fluid core
    ball(0.5, (x, y, 2.9), 'gunmetal', 1, (1, 1, 0.6))                     # pod cap
    box((0.2, 0.9, 0.2), ((x + math.cos(r) * 2.5) / 2 + 0.6, y * 0.85, 2.7), 'gunmetal', rot=(0, 0, a), bevel=0.02)  # feed pipe
print(ship('gb_barracks', clip=True))

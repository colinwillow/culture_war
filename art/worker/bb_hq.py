# Brute HQ: scrap fortress of stacked shipping containers, a smokestack, a big bitten-gear emblem plate (team crimson).
# Origin ground centre, front (gate + emblem) faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
# ground layer: U of containers, open front with a gate
container(8.4, (-3.3, 0.2, 0), 'rust', 'Y')
container(8.4, (3.3, 0.2, 0), 'olive', 'Y')
container(4.2, (0, 3.2, 0), 'steel', 'X')
box((4.2, 6.0, 0.3), (0, -0.6, 0.15), 'iron', bevel=0.05)                       # yard floor
# second layer: one long container across, one along the right
container(9.0, (0, 0.6, 2.6), 'olive', 'X')
container(5.0, (3.3, 2.0, 2.6), 'rust', 'Y')
# top: a lookout cabin of steel plates
box((3.0, 2.6, 1.6), (-1.6, 1.2, 6.0), 'steel', bevel=0.08)
box((3.4, 3.0, 0.2), (-1.6, 1.2, 6.9), 'iron', bevel=0.05)
box((2.0, 0.05, 0.5), (-1.6, -0.12, 6.1), 'glow', bevel=0.0)                   # lit slit window
# gate: heavy frame + crimson banner plates
for x in (-1.9, 1.9):
    box((0.4, 0.5, 2.6), (x, -3.9, 1.3), 'iron', bevel=0.06)
box((4.2, 0.5, 0.5), (0, -3.9, 2.45), 'iron', bevel=0.06)
for x in (-1.2, 0, 1.2):
    box((1.0, 0.08, 1.8), (x, -4.0, 1.2), 'steel', bevel=0.03)                  # gate doors (plates)
for x in (-3.3, 3.3):
    box((1.6, 0.1, 1.8), (x, -4.0, 1.3), 'team', bevel=0.03)                    # crimson end panels on the containers
# emblem: bitten gear on the front of the upper container
gear(1.3, (0, -0.93, 3.9), 'team', teeth=10, bite=2, thick=0.3)
box((3.4, 0.15, 2.4), (0, -0.72, 3.9), 'iron', bevel=0.05)                     # backing plate
# smokestack (back-left), up to 8 m
cyl(0.55, 5.2, (-3.3, 3.2, 5.2), 'iron', n=10)
cyl(0.7, 0.4, (-3.3, 3.2, 7.8), 'rust', n=10, bevel=0.04)
for z in (3.6, 5.2, 6.8):
    cyl(0.6, 0.15, (-3.3, 3.2, z), 'steel', n=10)
cyl(0.42, 0.1, (-3.3, 3.2, 8.0), 'tire', n=10)                                  # soot mouth
# rivet rows + spikes on the roofline
for x in (-4.0, -2.0, 0.0, 2.0, 4.0):
    cyl(0.12, 0.6, (x, -0.6, 5.5), 'bone', n=6, r2=0.0)
for x in (-3.0, -1.0, 1.0, 3.0):
    rivets([(x, -0.62, 3.0), (x, -0.62, 4.8)], 0.07, 'bone', 'Y')
print(ship('bb_hq'))

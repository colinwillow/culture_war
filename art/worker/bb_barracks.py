# Brute barracks: corrugated-steel fight hall, big open doors, a fight ring inside (seen through the open front
# and a wide roof gap). Origin ground centre, doors face +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
Wd, D, Hw = 6.6, 6.6, 3.8
box((7.0, 7.0, 0.25), (0, 0, 0.125), 'concrete', bevel=0.05)                     # pad
# side + back walls with corrugation ribs
for s in (-1, 1):
    box((0.2, D, Hw), (s * Wd / 2, 0, Hw / 2 + 0.25), 'steel', bevel=0.04)
    for i in range(10):
        y = -D / 2 + (i + 0.5) * D / 10
        box((0.1, 0.18, Hw - 0.2), (s * (Wd / 2 + 0.1), y, Hw / 2 + 0.25), 'steel', bevel=0.0)
box((Wd, 0.2, Hw), (0, D / 2, Hw / 2 + 0.25), 'steel', bevel=0.04)
for i in range(10):
    box((0.18, 0.1, Hw - 0.2), (-Wd / 2 + (i + 0.5) * Wd / 10, D / 2 + 0.1, Hw / 2 + 0.25), 'steel', bevel=0.0)
# front: posts + header with the open doorway, doors swung open outward
for x in (-2.9, 2.9):
    box((0.8, 0.3, Hw), (x, -D / 2, Hw / 2 + 0.25), 'rust', bevel=0.04)
box((Wd + 0.2, 0.4, 0.8), (0, -D / 2, Hw + 0.25 - 0.1), 'rust', bevel=0.05)
box((2.6, 0.08, 0.6), (0, -D / 2 - 0.22, Hw - 0.15), 'team', bevel=0.02)          # crimson sign plate over the door
for s in (-1, 1):
    box((1.5, 0.12, 3.2), (s * 2.75, -D / 2 - 0.25, 1.85), 'steel', bevel=0.03)   # big sliding doors, slid open
    box((1.5, 0.14, 0.3), (s * 2.75, -D / 2 - 0.27, 2.6), 'iron', bevel=0.02)
    box((1.5, 0.14, 0.3), (s * 2.75, -D / 2 - 0.27, 1.0), 'iron', bevel=0.02)
# gabled roof: two slopes that stop short, leaving a wide gap along the ridge
for s in (-1, 1):
    box((1.9, D + 0.4, 0.15), (s * 2.6, 0, Hw + 0.6), 'iron', rot=(0, s * 14, 0), bevel=0.03)
box((0.15, D + 0.4, 0.15), (-1.2, 0, Hw + 0.95), 'rust', bevel=0.0)              # ridge beams over the gap
box((0.15, D + 0.4, 0.15), (1.2, 0, Hw + 0.95), 'rust', bevel=0.0)
for y in (-2.0, 0.0, 2.0):
    box((2.5, 0.15, 0.15), (0, y, Hw + 0.95), 'rust', bevel=0.0)                 # cross beams
# fight ring inside
box((3.4, 3.4, 0.4), (0, 0.4, 0.45), 'olive', bevel=0.05)                         # canvas platform
for x in (-1.6, 1.6):
    for y in (-1.2, 2.0):
        cyl(0.1, 1.3, (x, y, 1.3), 'iron', n=6)                                   # corner posts
for z in (1.1, 1.5):
    for s in (-1, 1):
        box((3.2, 0.06, 0.06), (0, 0.4 + s * 1.6, z), 'team', bevel=0.0)        # crimson ropes
        box((0.06, 3.2, 0.06), (s * 1.6, 0.4, z), 'team', bevel=0.0)
cyl(0.5, 0.06, (2.6, -2.2, 0.3), 'tire', n=8)                                     # tyre stack (training)
cyl(0.5, 0.3, (2.6, -2.2, 0.45), 'tire', n=8)
box((0.4, 0.4, 1.2), (-2.6, 2.4, 0.85), 'bone', bevel=0.05)                       # punching bag
print(ship('bb_barracks'))

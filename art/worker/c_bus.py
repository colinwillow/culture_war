# city bus. Origin on the ground at the footprint centre, front along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
Y = 'yellow'
box((2.45, 10.8, 1.2), (0, 0, 0.95), Y, bevel=0.1)                         # lower body
box((2.42, 10.6, 1.0), (0, 0.05, 2.05), 'glass', bevel=0.06)               # window band
box((2.45, 10.8, 0.4), (0, 0, 2.75), Y, bevel=0.1)                         # roof band
box((2.0, 3.0, 0.25), (0, 1.5, 3.05), 'steel', bevel=0.06)                  # roof AC unit
for y in [-3.6 + i * 1.45 for i in range(7)]:
    for x in (-1, 1):
        box((0.06, 0.16, 1.0), (x * 1.215, y, 2.05), Y, bevel=0.0)         # window pillars
box((2.3, 0.08, 1.05), (0, -5.41, 2.0), 'glass', bevel=0.02)               # windscreen
box((2.3, 0.1, 0.35), (0, -5.42, 2.75), 'iron', bevel=0.03)                # destination sign
box((1.6, 0.06, 0.18), (0, -5.47, 2.75), 'glow', bevel=0.0)                # amber sign text strip
box((0.05, 1.1, 1.9), (-1.24, -4.2, 1.35), 'iron', bevel=0.0)              # front door (+X is right; door on -X? kerb side)
box((0.05, 1.1, 1.9), (-1.24, 0.6, 1.35), 'iron', bevel=0.0)               # mid door
box((2.47, 10.82, 0.2), (0, 0, 0.75), 'blue', bevel=0.02)                  # stripe
for s in (-1, 1):
    box((2.5, 0.2, 0.35), (0, s * 5.45, 0.5), 'steel', bevel=0.06)         # bumpers
for x in (-0.85, 0.85):
    box((0.36, 0.06, 0.2), (x, -5.47, 0.95), 'bone', bevel=0.02)
    box((0.3, 0.06, 0.3), (x, 5.47, 1.0), 'orange', bevel=0.02)
for x in (-1, 1):
    for y in (-3.4, 3.2):
        cyl(0.5, 0.36, (x * 1.0, y, 0.5), 'tire', (0, 90, 0), n=10, bevel=0.05)
        cyl(0.25, 0.38, (x * 1.0, y, 0.5), 'steel', (0, 90, 0), n=8)
    box((0.14, 0.1, 0.35), (x * 1.32, -5.2, 2.2), 'iron', bevel=0.03)      # mirrors
print(ship('c_bus'))

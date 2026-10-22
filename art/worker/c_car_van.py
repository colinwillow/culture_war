# delivery van, BREAKABLE. Origin on the ground at the footprint centre, front along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
W = 'white'
box((2.0, 3.7, 1.85), (0, 0.55, 1.33), W, bevel=0.08)                       # cargo box y -1.3 .. 2.4
box((1.96, 1.2, 0.9), (0, -1.85, 0.85), W, bevel=0.08)                      # nose/engine y -2.45 .. -1.25
box((1.94, 0.7, 0.95), (0, -1.15, 1.55), 'glass', bevel=0.05, taper=(0.95, 0.6))  # windscreen wedge
box((2.02, 3.0, 0.22), (0, 0.6, 0.78), 'orange', bevel=0.02)                # side stripe
box((1.7, 0.05, 1.5), (0, 2.43, 1.35), 'steel', bevel=0.02)                 # rear doors
box((0.04, 0.05, 1.5), (0, 2.46, 1.35), 'iron', bevel=0.0)                  # door split
for s in (-1, 1):
    box((2.05, 0.16, 0.26), (0, s * 2.45, 0.45), 'steel', bevel=0.05)       # bumpers
    box((0.05, 0.6, 0.55), (s * 0.99, -1.6, 1.2), 'glass', bevel=0.0)       # side windows
for x in (-0.68, 0.68):
    box((0.34, 0.06, 0.18), (x, -2.46, 0.95), 'bone', bevel=0.02)
    box((0.22, 0.06, 0.3), (x, 2.46, 0.95), 'orange', bevel=0.02)
box((0.8, 0.05, 0.26), (0, -2.46, 0.7), 'iron', bevel=0.02)
for x in (-1, 1):
    for y in (-1.6, 1.6):
        cyl(0.4, 0.3, (x * 0.85, y, 0.4), 'tire', (0, 90, 0), n=10, bevel=0.05)
        cyl(0.2, 0.32, (x * 0.85, y, 0.4), 'steel', (0, 90, 0), n=8)
    box((0.12, 0.08, 0.14), (x * 1.04, -1.4, 1.35), 'iron', bevel=0.02)     # mirrors
box((1.4, 2.6, 0.08), (0, 0.6, 2.28), 'steel', bevel=0.02)                  # roof rack
print(ship('c_car_van', chunk_cuts={'x': [0.0], 'y': [-1.0, 0.8]}))

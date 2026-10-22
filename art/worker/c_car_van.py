# delivery van, BREAKABLE. Origin on the ground at the footprint centre, front along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
city_style()   # Colin's key-art palette
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

# ---- v2 detail pass: crown graffiti + tags on the cargo sides, rust streaks, dented panel, roof junk, ladder
for s in (-1, 1):
    crown(1.3, (s * 1.015, 0.9, 1.55), normal=(s, 0, 0), up=(0, 0, 1), t=0.02, col='dark')
    box((0.03, 0.3, 0.9), (s * 1.0, 2.0, 1.0), 'rust', bevel=0.0)
    box((0.03, 0.8, 0.12), (s * 1.01, -0.2, 2.0), 'magenta' if s > 0 else 'lime', rot=(10, 0, 0), bevel=0.0)  # spray streaks
box((0.06, 1.0, 0.7), (1.0, -0.3, 1.1), 'white', rot=(0, 0, -5), bevel=0.04)                   # dented panel
for x in (-0.4, 0.4): box((0.06, 0.06, 1.6), (x, 2.48, 1.3), 'iron', bevel=0.0)                 # rear ladder
for z in (0.8, 1.2, 1.6, 2.0): box((0.86, 0.05, 0.05), (0, 2.48, z), 'iron', bevel=0.0)
box((1.0, 0.8, 0.5), (-0.2, -0.2, 2.57), 'wood', bevel=0.04); cyl(0.3, 0.7, (0.4, 1.2, 2.67), 'burnt', n=8, bevel=0.03)
for x in (-1, 1):
    for y in (-1.6, 1.6): cyl(0.13, 0.34, (x * 0.85, y, 0.4), 'ivory', (0, 90, 0), n=6)

# ---- detail pass 2: panel lines on the cargo box, a number plate, a smashed headlight
for y in (-0.6, 0.9, 2.0): box((2.03, 0.03, 1.7), (0, y, 1.33), 'steel', bevel=0.0)
box((0.5, 0.04, 0.15), (0, -2.54, 0.55), 'yellow', bevel=0.0)
box((0.36, 0.07, 0.2), (0.68, -2.47, 0.95), 'dark', bevel=0.0)
print(ship('c_car_van', chunk_cuts={'x': [0.0], 'y': [-1.0, 0.8]}))

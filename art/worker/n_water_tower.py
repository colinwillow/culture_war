# Neutral water tower (rooftop style) on legs. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
city_style()   # Colin's key-art palette
for x in (-1.4, 1.4):
    for y in (-1.4, 1.4):
        box((0.5, 0.5, 0.3), (x, y, 0.15), 'concrete', bevel=0.04)
        box((0.25, 0.25, 4.2), (x, y, 2.35), 'iron', bevel=0.02)                     # legs
for z in (1.6, 3.2):                                                                   # cross ties
    for s in (-1, 1):
        box((2.8, 0.12, 0.12), (0, s * 1.4, z), 'iron', bevel=0.0)
        box((0.12, 2.8, 0.12), (s * 1.4, 0, z), 'iron', bevel=0.0)
    box((0.1, 0.1, 2.2), (0, -1.4, z - 0.8), 'iron', rot=(0, 52, 0), bevel=0.0)
box((3.4, 3.4, 0.25), (0, 0, 4.55), 'wood', bevel=0.04)                               # platform
cyl(1.75, 3.0, (0, 0, 6.15), 'wood', n=14)                                            # wooden tank (top ~7.65)
for z in (5.0, 6.15, 7.3):
    cyl(1.8, 0.14, (0, 0, z), 'iron', n=14)                                           # steel hoops
cyl(1.95, 1.3, (0, 0, 8.3), 'iron', n=14, r2=0.15)                                    # conical roof (top ~8.95)
cyl(0.12, 0.3, (0, 0, 9.0), 'iron', n=6)
for z in range(1, 9):                                                                  # ladder up the front
    box((0.6, 0.06, 0.06), (0, -1.8, z * 0.75), 'steel', bevel=0.0)
for x in (-0.3, 0.3):
    box((0.07, 0.07, 6.6), (x, -1.8, 3.3), 'steel', bevel=0.0)
cyl(0.12, 4.5, (0.6, 0.6, 2.3), 'steel', n=6)                                         # outlet pipe

# ---- v2 detail pass: big crown graffiti on the tank, rust streaks, a leak drip, a warning light on the roof
crown(1.6, (0, -1.79, 6.2), normal=(0, -1, 0), up=(0, 0, 1), t=0.03)
for a in (30, 150, 250):
    r = math.radians(a); box((0.15, 0.03, 1.2), (math.cos(r) * 1.77, math.sin(r) * 1.77, 5.6), 'rust', rot=(0, 0, a + 90), bevel=0.0)
ball(0.12, (0, 0, 9.2), 'glow', 1)
cyl(0.04, 0.5, (1.2, -1.2, 4.3), 'blue', n=5)

# ---- detail pass 2: plank lines on the tank, bolts on the hoops, a hanging rope
for a in range(0, 360, 30):
    r = math.radians(a); box((0.03, 0.03, 2.9), (math.cos(r) * 1.76, math.sin(r) * 1.76, 6.15), 'dark', bevel=0.0)
cyl(0.02, 2.0, (1.6, 1.0, 5.0), 'bone', n=4)

# ---- CITY PASS (key art): teal onion-dome roof spire, a violet screen on the tank, flowers on the platform
spire(0.5, 2.0, (0, 0, 8.8), 'teal')
screen(1.0, 0.7, (1.79, 0, 6.2), (1, 0, 0))
flowers((-1.2, -1.2, 4.8), 0.3, 4, seed=4)
print(ship('n_water_tower'))

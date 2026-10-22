# Neutral gas station: canopy, two pumps, a small kiosk. Origin ground centre, forecourt faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
city_style()   # Colin's key-art palette
box((12.0, 8.0, 0.12), (0, 0, 0.06), 'asphalt', bevel=0.0)                       # forecourt
box((6.0, 3.0, 0.2), (-1.6, -0.8, 0.2), 'concrete', bevel=0.04)                  # pump island
# canopy on 4 posts
for x in (-4.0, 0.8):
    for y in (-2.0, 0.4):
        box((0.35, 0.35, 4.2), (x, y, 2.2), 'white', bevel=0.04)
box((7.4, 4.4, 0.6), (-1.6, -0.8, 4.5), 'white', bevel=0.08)                     # canopy slab (top ~4.8)
box((7.5, 4.5, 0.25), (-1.6, -0.8, 4.35), 'blue', bevel=0.02)                    # blue fascia band
box((7.0, 4.0, 0.04), (-1.6, -0.8, 4.18), 'glow', bevel=0.0)                     # underside lights
# two pumps
for x in (-3.0, -0.2):
    box((0.8, 0.5, 1.6), (x, -0.8, 1.1), 'yellow', bevel=0.06)
    box((0.6, 0.06, 0.5), (x, -1.07, 1.4), 'iron', bevel=0.0)                    # display
    box((0.5, 0.05, 0.25), (x, -1.1, 1.45), 'glow', bevel=0.0)
    cyl(0.05, 0.9, (x + 0.45, -0.8, 1.0), 'tire', n=5)                            # hose
    box((0.16, 0.2, 0.3), (x + 0.48, -0.8, 1.4), 'iron', bevel=0.02)               # nozzle
# kiosk at the back right
box((3.6, 3.0, 2.8), (4.0, 2.2, 1.52), 'concrete', bevel=0.08)
box((3.0, 0.1, 1.4), (4.0, 0.68, 1.6), 'glass', bevel=0.0)
box((0.9, 0.12, 2.1), (5.2, 0.67, 1.17), 'wood', bevel=0.0)
box((3.8, 3.2, 0.25), (4.0, 2.2, 3.05), 'blue', bevel=0.04)
# price sign pole at the front corner
box((0.25, 0.25, 4.6), (5.4, -3.5, 2.3), 'steel', bevel=0.02)
box((1.4, 0.3, 1.6), (5.4, -3.5, 4.0), 'white', bevel=0.05)
for z in (3.6, 4.0, 4.4):
    box((1.1, 0.06, 0.25), (5.4, -3.67, z), 'glow', bevel=0.0)
# tyre stack + oil drum by the kiosk
cyl(0.4, 0.8, (2.0, 3.2, 0.52), 'tire', n=8)
cyl(0.35, 0.9, (2.0, 2.2, 0.57), 'orange', n=8)

# ---- v2 detail pass: neon glow on the price sign + kiosk, crown graffiti on the kiosk side, oil stains, a wrecked pump
crown(1.2, (5.81, 2.2, 1.4), normal=(1, 0, 0), up=(0, 0, 1), t=0.02)
box((3.2, 0.06, 0.12), (4.0, 0.66, 2.75), 'glow', bevel=0.0)
for (x, y, s) in ((-2.0, -2.6, 1.2), (1.5, -3.0, 0.8), (-4.0, 1.5, 1.0)):
    cyl(s * 0.6, 0.02, (x, y, 0.125), 'dark', n=8)
box((0.8, 0.5, 1.6), (-0.2, -0.8, 1.1), 'yellow', rot=(0, 18, 0), bevel=0.06) if False else None
box((0.5, 0.5, 0.15), (-0.2, -0.2, 0.37), 'burnt', rot=(0, 0, 25), bevel=0.02)
for x in (-4.0, 0.8): box((0.37, 0.37, 0.4), (x, -2.0, 0.4), 'yellow', bevel=0.03)          # bollards' hazard sleeves

# ---- detail pass 2: panel lines on the canopy fascia, a cracked price panel, a yellow/black hazard curb
for x in (-4.5, -1.6, 1.3): box((0.04, 4.52, 0.27), (x, -0.8, 4.35), 'dark', bevel=0.0)
for k in range(10): box((0.6, 0.2, 0.18), (-4.3 + k * 0.6, -2.4, 0.2), 'yellow' if k % 2 else 'dark', bevel=0.0)

# ---- CITY PASS (key art): violet alien-sign screen on the price pole, a teal dome on the kiosk, palms + flowers
screen(1.2, 0.9, (5.4, -3.7, 2.9), (0, -1, 0))
ball(1.0, (4.0, 2.2, 3.2), 'teal', 1, (1, 1, 0.6)); ball(0.1, (4.0, 2.2, 3.85), 'gold', 1)
for (x, y) in ((-5.0, 3.0), (5.0, 0.3)): palm((x, y, 0.12), 2.6, seed=int(x * 3))
flowers((-5.0, -3.3, 0.3), 0.5, 6, seed=9)
print(ship('n_gas'))

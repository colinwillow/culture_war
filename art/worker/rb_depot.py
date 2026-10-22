# Reptilian depot: market stall stack with hanging lanterns and crates. Origin ground centre, front faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((5.0, 5.0, 0.15), (0, 0, 0.075), 'stone', bevel=0.04)
# lower stall: counter + 4 posts + striped awning
box((4.2, 1.0, 1.0), (0, -1.2, 0.65), 'wood', bevel=0.05)
box((4.4, 1.1, 0.1), (0, -1.2, 1.2), 'bronze', bevel=0.02)
for x in (-2.0, 2.0):
    for y in (-1.8, 1.8):
        box((0.18, 0.18, 2.2), (x, y, 1.25), 'wood', bevel=0.02)
for i in range(6):                                                           # striped awning sloping to the front
    x = -2.1 + i * 0.84
    box((0.84, 1.8, 0.08), (x, -1.9, 2.25), 'magenta' if i % 2 else 'lime', rot=(-14, 0, 0), bevel=0.0)
box((4.4, 3.6, 0.2), (0, 0.0, 2.35), 'wood', bevel=0.03)                     # floor of the upper stall
# upper stall (set back) with a crimson cloth roof
box((3.2, 2.4, 1.2), (0, 0.6, 3.05), 'stone', bevel=0.08)
box((3.6, 2.8, 0.15), (0, 0.6, 3.75), 'team', rot=(-8, 0, 0), bevel=0.02)
box((1.2, 0.1, 0.8), (0, -0.62, 3.0), 'iron', bevel=0.0)                     # dark doorway
# hanging lanterns (magenta glow) on strings under the awning edge and the upper roof
for x in (-1.5, -0.5, 0.5, 1.5):
    cyl(0.015, 0.4, (x, -2.6, 1.9), 'iron', n=4)
    ball(0.17, (x, -2.6, 1.62), 'gmagenta', 1, (1, 1, 1.3))
for x in (-1.3, 1.3):
    ball(0.17, (x, -0.85, 3.45), 'glime', 1, (1, 1, 1.3))
# crates and baskets
for (x, y, z, s, c) in ((-1.4, -1.25, 1.25, 0.45, 'wood'), (1.2, -1.25, 1.25, 0.4, 'bronze'), (2.0, 1.9, 0.15, 0.8, 'wood'),
                        (2.0, 1.9, 0.95, 0.6, 'wood'), (-2.0, 1.9, 0.15, 0.7, 'moss'), (1.0, 2.0, 0.15, 0.6, 'wood')):
    box((s, s, s), (x, y, z + s / 2), c, bevel=0.04)
cyl(0.3, 0.4, (0.2, -1.25, 1.45), 'lime', n=8, r2=0.36)                      # fruit basket

# ---- v2 detail pass: magenta canisters on the counter, crown tags on the awning post + upper stall, spikes on the roof
for x in (-0.9, -0.5):
    canister(0.12, 0.45, (x, -1.25, 1.5), (0, 0, 1), 'gmagenta', bars=3, ribs=1)
crown(0.8, (0, -0.63, 3.45), normal=(0, -1, 0), up=(0, 0, 1), t=0.02)
crown(0.6, (0, -1.72, 0.75), normal=(0, -1, 0), up=(0, 0, 1), t=0.02)
for x in (-1.7, 1.7):
    spike(0.1, 0.45, (x, 1.9, 3.95), (x * 0.1, 0.3, 1))
    spike(0.1, 0.45, (x, -0.7, 3.65), (x * 0.1, -0.3, 1))
chain((2.0, -1.8, 2.3), (2.0, -1.8, 1.6), 0.04)

# ---- detail pass 2: crimson crown banner on the upper stall, panel lines on the counter, a moss tuft on the roof
banner(0.7, 0.8, (1.2, -0.62, 3.5), (0, -1, 0), mark='crown')
for x in (-1.0, 1.0): box((0.03, 0.06, 0.9), (x, -1.71, 0.65), 'dark', bevel=0.0)
ball(0.3, (-1.4, 1.6, 3.95), 'moss', 1, (1.4, 1, 0.4))
print(ship('rb_depot'))

# Reptilian wall: carved stone block wall with a moss top, BREAKABLE. Runs along X, origin ground centre, face +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
# two courses of big blocks, offset like masonry
for i, x in enumerate((-0.75, 0.0, 0.75)):
    box((0.72, 0.8, 0.62), (x, 0, 0.31), 'stone', bevel=0.06)
for x in (-0.82, -0.05, 0.75):
    w = 0.56 if x == -0.82 else 0.74 if x == -0.05 else 0.68
    box((w, 0.74, 0.58), (x, 0, 0.93), 'stone', bevel=0.06)
box((2.2, 0.82, 0.12), (0, 0, 1.28), 'stone', bevel=0.03)
# moss top: lumpy cushions
for x in (-0.8, -0.2, 0.45, 0.9):
    ball(0.35, (x, 0, 1.36), 'moss', 1, (1.0, 1.15, 0.5))
for x in (-0.5, 0.6):
    box((0.25, 0.04, 0.4), (x, -0.42, 1.1), 'moss', bevel=0.0)                 # moss drips
# carvings on the face: a serpent glyph + eyes, a crimson painted band
box((0.5, 0.05, 0.08), (0.0, -0.41, 0.4), 'bronze', bevel=0.0)
box((0.08, 0.05, 0.4), (-0.21, -0.41, 0.55), 'bronze', bevel=0.0)
box((0.4, 0.05, 0.08), (0.0, -0.41, 0.72), 'bronze', bevel=0.0)
ball(0.07, (0.15, -0.42, 0.95), 'gmagenta', 1)
ball(0.07, (-0.15, -0.42, 0.95), 'gmagenta', 1)
box((2.2, 0.84, 0.14), (0, 0, 0.64), 'team', bevel=0.0)                      # crimson band between courses

# ---- v2 detail pass: white crown tag graffiti, cone spikes poking out of the moss, magenta cloth tied on
crown(0.45, (0.72, -0.385, 0.95), normal=(0, -1, 0), up=(0, 0, 1), t=0.012)
for x in (-0.6, 0.15, 0.85):
    spike(0.06, 0.25, (x, 0, 1.45), (x * 0.2, 0, 1))
box((0.3, 0.86, 0.3), (-0.82, 0, 0.93), 'magenta', bevel=0.02)
print(ship('rb_wall', chunk_cuts={'x': [-0.4, 0.38], 'z': [0.64]}))

# Neutral corner shop: 2 floors, awning, BREAKABLE by floor. Origin ground centre, shopfront faces +Z (and +X corner).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
F = 3.2  # floor height
box((7.6, 7.6, F), (0, 0, F / 2), 'brick', bevel=0.06)                           # ground floor
box((7.6, 7.6, F), (0, 0, F * 1.5), 'concrete', bevel=0.06)                      # first floor
box((7.8, 7.8, 0.25), (0, 0, F), 'steel', bevel=0.04)                            # floor band
for sd in (-1, 1):                                                                # parapet ring (top ~6.85)
    box((7.8, 0.3, 0.6), (0, sd * 3.75, F * 2 + 0.3), 'brick', bevel=0.04)
    box((0.3, 7.8, 0.6), (sd * 3.75, 0, F * 2 + 0.3), 'brick', bevel=0.04)
box((7.0, 7.0, 0.1), (0, 0, F * 2 + 0.05), 'asphalt', bevel=0.0)                # roof
# shopfront glass on the two street faces (-Y front, +X side) + door
box((5.4, 0.1, 2.0), (-0.6, -3.82, 1.35), 'glass', bevel=0.0)
box((0.1, 5.4, 2.0), (3.82, 0.6, 1.35), 'glass', bevel=0.0)
box((1.1, 0.12, 2.3), (2.8, -3.83, 1.15), 'wood', bevel=0.0)                     # corner door
# awning: striped, sloping out over both shopfronts
for i in range(8):
    box((0.9, 1.3, 0.08), (-3.4 + i * 0.9, -4.25, 2.75), 'blue' if i % 2 else 'white', rot=(-20, 0, 0), bevel=0.0)
    box((1.3, 0.9, 0.08), (4.25, 3.4 - i * 0.9, 2.75), 'blue' if i % 2 else 'white', rot=(0, 20, 0), bevel=0.0)
box((3.6, 0.15, 0.6), (-1.0, -3.85, 3.6), 'yellow', bevel=0.03)                 # shop sign board
box((3.2, 0.06, 0.3), (-1.0, -3.95, 3.6), 'glow', bevel=0.0)
# upstairs windows
for x in (-2.6, -0.9, 0.9, 2.6):
    box((1.0, 0.1, 1.2), (x, -3.82, 4.9), 'glass', bevel=0.0)
    box((1.2, 0.18, 0.12), (x, -3.85, 4.25), 'white', bevel=0.0)
    box((0.1, 1.0, 1.2), (3.82, -x, 4.9), 'glass', bevel=0.0)
    box((0.18, 1.2, 0.12), (3.85, -x, 4.25), 'white', bevel=0.0)
box((1.2, 1.0, 0.9), (-2.0, 2.0, F * 2 + 0.55), 'steel', bevel=0.05)              # rooftop AC
for o in bpy.context.scene.objects: o.location.x -= 0.44; o.location.y += 0.44   # centre incl. awnings
print(ship('n_shop', chunk_cuts={'x': [-0.44], 'z': [F]}))

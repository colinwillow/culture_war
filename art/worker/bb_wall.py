# Brute wall segment: car doors and sheet metal welded together, BREAKABLE. Runs along X, origin ground centre,
# outer face +Z. 0.9 deep because of the angled props/feet at the back.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((2.2, 0.12, 1.2), (0, 0, 0.75), 'steel', bevel=0.02)                                   # backing sheet
# car doors on the outer face, slightly tilted, different colours
for x, col, r in ((-0.72, 'blue', 3), (0.0, 'white', -2), (0.72, 'yellow', 4)):
    box((0.7, 0.1, 0.62), (x, -0.1, 0.55), col, rot=(0, r, 0), bevel=0.03)                # lower door skin
    box((0.62, 0.06, 0.4), (x, -0.08, 1.08), 'glass', rot=(0, r, 0), bevel=0.0)            # (broken) window
    box((0.7, 0.1, 0.07), (x, -0.1, 0.88), col, rot=(0, r, 0), bevel=0.0)                  # sill
    box((0.16, 0.05, 0.05), (x + 0.18, -0.17, 0.72), 'iron', bevel=0.0)                    # handle
# sheet metal patches + top spikes
box((1.0, 0.06, 0.5), (-0.4, -0.18, 0.3), 'rust', rot=(0, 8, 0), bevel=0.0)
box((0.8, 0.06, 0.4), (0.6, -0.18, 1.35), 'rust', rot=(0, -10, 0), bevel=0.0)
box((2.2, 0.08, 0.16), (0, -0.16, 0.95), 'team', bevel=0.01)                               # crimson weld stripe
for x in (-0.95, -0.45, 0.1, 0.6, 1.0):
    cyl(0.06, 0.3, (x, 0, 1.45), 'iron', n=5, r2=0.0)                                      # spikes
# weld seams
for x in (-0.36, 0.36):
    box((0.05, 0.14, 1.2), (x, -0.08, 0.75), 'orange', bevel=0.0)
# feet + back props
box((2.2, 0.5, 0.15), (0, 0.15, 0.075), 'iron', bevel=0.03)
for x in (-0.8, 0.8):
    box((0.12, 0.9, 0.12), (x, 0.4, 0.55), 'iron', rot=(55, 0, 0), bevel=0.0)
    box((0.3, 0.3, 0.12), (x, 0.7, 0.06), 'iron', bevel=0.02)
for o in bpy.context.scene.objects:   # centre the 0.9 m-deep footprint on the origin
    o.location.y -= 0.32; o.location.z += 0.02
print(ship('bb_wall', chunk_cuts={'x': [-0.55, 0.0, 0.55], 'z': [0.8]}))

# giant riveted wrench-hammer, two-handed. Origin at the lower grip, head along +Z (Blender -Y).
# Head: wrench jaw opens to +X, flat hammer face to -X.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
box((0.055, 1.06, 0.05), (0, -0.40, 0), 'steel', bevel=0.012)            # flat wrench shaft, y +0.13 .. -0.93
cyl(0.038, 0.20, (0, 0.0, 0), 'olive', X, n=8, bevel=0.006)               # lower grip wrap
cyl(0.038, 0.16, (0, -0.42, 0), 'olive', X, n=8, bevel=0.006)             # upper grip wrap
box((0.08, 0.04, 0.07), (0, 0.13, 0), 'iron', bevel=0.012)               # end knob
box((0.075, 0.12, 0.065), (0, -0.82, 0), 'rust', bevel=0.012)            # neck plate
# head block
box((0.15, 0.22, 0.2), (0, -1.12, 0), 'iron', bevel=0.025)
# jaw (+X): two prongs leaving a gap
for y in (-1.04, -1.20):
    box((0.11, 0.06, 0.17), (0.12, y, 0), 'steel', bevel=0.015)
box((0.04, 0.05, 0.08), (0.08, -1.12, 0), 'orange', bevel=0.008)        # adjuster screw in the jaw
# hammer face (-X)
box((0.06, 0.2, 0.2), (-0.10, -1.12, 0), 'steel', bevel=0.02)
box((0.03, 0.17, 0.17), (-0.145, -1.12, 0), 'bone', bevel=0.012)       # worn strike face
# rivets on both flat sides of the head
for s in (-1, 1):
    for x in (-0.045, 0.045):
        for y in (-1.06, -1.18):
            cyl(0.016, 0.02, (x, y, s * 0.105), 'bone', (0 if s > 0 else 180, 0, 0), n=6, r2=0.008)
print(ship('w_brute_wrenchhammer'))

# heavy cleaver with a wrench jaw cut into the back (spine) of the blade.
# Origin at the grip, blade along +Z (Blender -Y), edge down, spine (with jaw notch) up.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
cyl(0.03, 0.26, (0, -0.0, 0), 'wood', X, n=8, bevel=0.006)                 # handle
for y in (0.06, -0.06):
    cyl(0.034, 0.025, (0, y, 0), 'iron', X, n=8)                             # handle bands
box((0.05, 0.05, 0.08), (0, 0.15, 0), 'iron', bevel=0.012)                 # pommel
box((0.06, 0.06, 0.12), (0, -0.16, 0.0), 'iron', bevel=0.012)              # bolster
# blade body (lower part, full length) y -0.19 .. -0.85
box((0.03, 0.66, 0.24), (0, -0.52, -0.06), 'steel', bevel=0.008)
box((0.02, 0.64, 0.06), (0, -0.52, -0.205), 'bone', bevel=0.006, taper=(1.8, 1))  # bright edge (wider at top joins body)
# upper blade / spine, split by the jaw notch (gap y -0.60 .. -0.72, depth 0.09)
box((0.034, 0.41, 0.10), (0, -0.395, 0.11), 'steel', bevel=0.008)          # y -0.19 .. -0.60
box((0.034, 0.13, 0.10), (0, -0.785, 0.11), 'steel', bevel=0.008)          # y -0.72 .. -0.85 (fixed jaw)
box((0.04, 0.035, 0.04), (0, -0.62, 0.12), 'orange', bevel=0.006)         # jaw thread nub
box((0.04, 0.41, 0.025), (0, -0.395, 0.17), 'iron', bevel=0.006)          # spine strip
box((0.04, 0.13, 0.025), (0, -0.785, 0.17), 'iron', bevel=0.006)
# rivets along the blade, both faces
for s in (-1, 1):
    for y in (-0.28, -0.42, -0.56, -0.78):
        cyl(0.014, 0.016, (s * 0.022, y, 0.02), 'bone', (0, 90 * s, 0), n=6, r2=0.007)
print(ship('w_brute_cleaver'))

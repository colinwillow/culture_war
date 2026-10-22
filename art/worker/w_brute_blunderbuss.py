# blunderbuss: flared barrel bound with wire, glowing amber shell chamber, wooden stock.
# Origin at the (pistol) grip, muzzle along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0); Z0 = 0.075  # bore height above the grip
box((0.05, 0.07, 0.15), (0, 0.0, -0.02), 'wood', rot=(-15, 0, 0), bevel=0.012)        # pistol grip
box((0.07, 0.30, 0.09), (0, 0.24, 0.035), 'wood', rot=(-8, 0, 0), bevel=0.02, taper=(1, 1))  # stock
box((0.075, 0.04, 0.11), (0, 0.40, 0.02), 'iron', bevel=0.01)                        # butt plate
box((0.08, 0.22, 0.08), (0, -0.04, Z0), 'iron', bevel=0.015)                        # receiver
cyl(0.045, 0.12, (0, -0.10, Z0 + 0.0), 'glow', X, n=8)                               # amber shell chamber
for y in (-0.035, -0.165):
    cyl(0.05, 0.02, (0, y, Z0), 'steel', X, n=8, bevel=0.004)                        # chamber rings
cyl(0.035, 0.40, (0, -0.37, Z0), 'steel', X, n=8)                                   # barrel
cyl(0.035, 0.16, (0, -0.65, Z0), 'steel', X, n=8, r2=0.072)                          # flare (top=-Y after rot? see below)
for y in (-0.26, -0.30, -0.44, -0.48):
    cyl(0.04, 0.018, (0, y, Z0), 'rust', X, n=8)                                     # wire bindings
cyl(0.075, 0.03, (0, -0.735, Z0), 'iron', X, n=8, bevel=0.006)                      # muzzle lip
box((0.012, 0.05, 0.03), (0, -0.04, Z0 + 0.055), 'iron', bevel=0.004)               # hammer
box((0.015, 0.06, 0.012), (0, 0.04, -0.02), 'iron', bevel=0.004)                     # trigger guard
print(ship('w_brute_blunderbuss'))

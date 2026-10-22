# blunderbuss v2 (detail pass): flared riveted barrel with a spiked muzzle lip, wire bindings, a caged glowing
# amber shell canister, a burnt-orange side box, wooden stock with an ivory crown plate.
# Origin at the pistol grip, muzzle along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
spike, crown, banner = brute_style()   # Brute sheets: gear-wrench brand, iron studs
X = (90, 0, 0); Z0 = 0.075
box((0.05, 0.07, 0.15), (0, 0.0, -0.02), 'wood', rot=(-15, 0, 0), bevel=0.012)        # pistol grip
for z in (-0.05, 0.02): box((0.054, 0.074, 0.012), (0, 0.0 + z * 0.27, z), 'dark', rot=(-15, 0, 0), bevel=0.0)
box((0.07, 0.30, 0.09), (0, 0.24, 0.035), 'wood', rot=(-8, 0, 0), bevel=0.02)          # stock
box((0.074, 0.14, 0.06), (0, 0.25, 0.04), 'ivory', rot=(-8, 0, 0), bevel=0.01)        # painted plate
crown(0.05, (0.0375, 0.25, 0.042), normal=(1, 0, 0), up=(0, 0, 1), t=0.003, col='dark')  # crown tag (dark on ivory)
box((0.075, 0.04, 0.11), (0, 0.40, 0.02), 'iron', bevel=0.01)                          # butt plate
box((0.085, 0.22, 0.085), (0, -0.04, Z0), 'iron', bevel=0.015)                         # receiver
canister(0.05, 0.16, (0, -0.06, Z0 + 0.075), (0, -1, 0), 'glow', bars=4, ribs=1)       # shell canister on top
box((0.03, 0.1, 0.07), (0.06, -0.04, Z0 - 0.01), 'burnt', bevel=0.01)                 # side ammo box
for y in (0.03, -0.11): hexbolt(0.01, (0.045, y, Z0 + 0.03), (1, 0, 0))
cyl(0.036, 0.40, (0, -0.37, Z0), 'steel', X, n=8)                                     # barrel
cyl(0.036, 0.16, (0, -0.65, Z0), 'steel', X, n=8, r2=0.072)                           # flare
for y in (-0.22, -0.26, -0.40, -0.44, -0.55):
    cyl(0.041, 0.016, (0, y, Z0), 'rust', X, n=8)                                     # wire bindings
cyl(0.077, 0.03, (0, -0.735, Z0), 'iron', X, n=8, bevel=0.006)                        # muzzle lip
cyl(0.055, 0.02, (0, -0.75, Z0), 'dark', X, n=8)
for a in range(45, 360, 90):
    r = math.radians(a); spike(0.014, 0.05, (math.cos(r) * 0.075, -0.73, Z0 + math.sin(r) * 0.075), (math.cos(r), -0.4, math.sin(r)))
box((0.012, 0.05, 0.03), (0, 0.04, Z0 + 0.05), 'iron', bevel=0.004)                   # hammer
box((0.015, 0.06, 0.012), (0, 0.04, -0.02), 'iron', bevel=0.004)                      # trigger guard
chain((0.0, 0.03, -0.09), (0.02, 0.06, -0.19), 0.01)

# ---- detail pass 2: crimson team band on the barrel, panel line on the receiver, rust wear on the flare
cyl(0.04, 0.035, (0, -0.33, Z0), 'team', (90, 0, 0), n=8)
box((0.087, 0.006, 0.087), (0, -0.04, Z0), 'dark', bevel=0.0)
box((0.03, 0.06, 0.006), (0.02, -0.66, Z0 + 0.06), 'rust', rot=(-14, 0, 0), bevel=0.0)

# ---- BRUTE PASS: an ammo bandolier slung from the stock, orange painted receiver plate
bandolier((0.05, 0.38, 0.0), (0.06, 0.05, -0.12), 0.025)
box((0.006, 0.12, 0.06), (0.046, -0.04, Z0), 'paint', bevel=0.0)
print(ship('w_brute_blunderbuss'))

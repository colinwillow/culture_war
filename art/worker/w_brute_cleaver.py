# heavy cleaver v2 (detail pass): ivory/orange painted blade with a wrench-jaw notch in the spine, cone spikes on the
# spine, a glowing amber slit, a big crown tag, riveted bolster, wrapped handle + chain.
# Origin at the grip, blade along +Z (Blender -Y), edge down, spine up.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
cyl(0.03, 0.26, (0, 0.0, 0), 'olive', X, n=8, bevel=0.006)                           # wrapped handle
for y in (0.07, 0.0, -0.07): cyl(0.033, 0.015, (0, y, 0), 'dark', X, n=8)
cyl(0.036, 0.05, (0, 0.15, 0), 'iron', X, n=6, bevel=0.008)                           # hex pommel
chain((0, 0.17, -0.01), (0.01, 0.19, -0.14), 0.012)
box((0.06, 0.06, 0.13), (0, -0.16, 0.0), 'iron', bevel=0.012)                        # bolster
for z in (-0.04, 0.04): hexbolt(0.01, (0.031, -0.16, z), (1, 0, 0))
box((0.03, 0.66, 0.24), (0, -0.52, -0.06), 'steel', bevel=0.008)                     # blade body
box((0.034, 0.36, 0.2), (0, -0.62, -0.06), 'ivory', bevel=0.006)                     # painted panel
box((0.036, 0.1, 0.2), (0, -0.4, -0.06), 'burnt', bevel=0.006)                       # orange stripe
box((0.02, 0.64, 0.06), (0, -0.52, -0.205), 'bone', bevel=0.006, taper=(1.8, 1))    # edge
box((0.038, 0.12, 0.02), (0, -0.28, -0.02), 'glow', bevel=0.0)                       # glowing slit
for s in (-1, 1):
    crown(0.13, (s * 0.0185, -0.64, -0.05), normal=(s, 0, 0), up=(0, 0, 1), t=0.004, col='dark')
box((0.034, 0.41, 0.10), (0, -0.395, 0.11), 'steel', bevel=0.008)                   # upper blade (notch gap)
box((0.034, 0.13, 0.10), (0, -0.785, 0.11), 'steel', bevel=0.008)
box((0.04, 0.035, 0.04), (0, -0.62, 0.12), 'burnt', bevel=0.006)
box((0.04, 0.41, 0.025), (0, -0.395, 0.17), 'iron', bevel=0.006)
box((0.04, 0.13, 0.025), (0, -0.785, 0.17), 'iron', bevel=0.006)
for y in (-0.26, -0.38, -0.5): spike(0.016, 0.05, (0, y, 0.18), (0, -0.25, 1))       # spine spikes
for s in (-1, 1):
    for y in (-0.24, -0.82): hexbolt(0.011, (s * 0.017, y, 0.06), (s, 0, 0), 'ivory')

# ---- detail pass 2: crimson team stripe along the spine, panel lines on the blade, rust wear near the edge
box((0.042, 0.41, 0.03), (0, -0.395, 0.135), 'team', bevel=0.004)
for y in (-0.46, -0.8): box((0.037, 0.006, 0.2), (0, y, -0.06), 'dark', bevel=0.0)
box((0.036, 0.08, 0.03), (0, -0.7, -0.16), 'rust', bevel=0.0)
print(ship('w_brute_cleaver'))

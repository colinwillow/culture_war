# Worker's pipe wrench v2 (detail pass, after Colin's worker sheet): burnt-orange/rust painted handle with ivory
# gear-wrench mark, riveted jaws, knurled nut, a small glowing gauge, chain + tag at the end.
# Origin at the grip, jaws along +Z (Blender -Y), hook jaw up.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((0.05, 0.5, 0.06), (0, -0.12, 0), 'burnt', bevel=0.014, taper=(0.9, 1))         # handle
for y in (0.0, 0.05, 0.1): box((0.054, 0.02, 0.064), (0, y, 0), 'dark', bevel=0.004) # grip ridges
box((0.054, 0.12, 0.064), (0, -0.25, 0), 'rust', bevel=0.01)                          # scuffed patch
box((0.06, 0.04, 0.07), (0, 0.15, 0), 'iron', bevel=0.012)
cyl(0.014, 0.075, (0, 0.13, 0), 'iron', (0, 90, 0), n=6)
chain((0.0, 0.17, -0.02), (0.0, 0.19, -0.12), 0.011)
box((0.006, 0.03, 0.04), (0, 0.19, -0.14), 'ivory', bevel=0.002)
for s in (-1, 1):                                                                     # ivory gear mark on both sides
    cyl(0.022, 0.006, (s * 0.027, -0.12, 0), 'ivory', (0, 90, 0), n=8)
    cyl(0.009, 0.008, (s * 0.027, -0.12, 0), 'dark', (0, 90, 0), n=6)
    for y in (-0.04, -0.2): hexbolt(0.009, (s * 0.027, y, 0), (s, 0, 0))
box((0.07, 0.14, 0.09), (0, -0.43, 0.01), 'iron', bevel=0.015)                       # heel jaw housing
box((0.072, 0.05, 0.05), (0, -0.53, 0.03), 'steel', bevel=0.01)
for z in (0.0, 0.025, 0.05): box((0.074, 0.008, 0.008), (0, -0.556, z + 0.01), 'dark', bevel=0.0)  # teeth
box((0.035, 0.05, 0.2), (0, -0.40, 0.11), 'steel', bevel=0.008)                      # shank
cyl(0.045, 0.05, (0, -0.42, 0.10), 'burnt', (0, 0, 0), n=10, bevel=0.006)            # knurl nut
for a in range(0, 360, 36):
    r = math.radians(a); box((0.006, 0.006, 0.05), (math.cos(r) * 0.047, -0.42 + math.sin(r) * 0.047, 0.1), 'dark', bevel=0.0)
box((0.075, 0.22, 0.06), (0, -0.48, 0.20), 'iron', bevel=0.014)                      # hook jaw bar
box((0.075, 0.05, 0.07), (0, -0.565, 0.155), 'steel', bevel=0.01)
for x in (-0.039, 0.039): hexbolt(0.01, (x, -0.42, 0.2), (1 if x > 0 else -1, 0, 0), 'ivory')
cyl(0.02, 0.012, (0.036, -0.43, 0.02), 'glow', (0, 90, 0), n=8)                      # tiny glowing gauge

# ---- detail pass 2: crimson team band on the handle, panel line, rust wear on the hook jaw
box((0.056, 0.04, 0.066), (0, -0.33, 0), 'team', bevel=0.006)
box((0.077, 0.006, 0.062), (0, -0.44, 0.2), 'dark', bevel=0.0)
box((0.04, 0.05, 0.006), (0.0, -0.5, 0.232), 'rust', bevel=0.0)
print(ship('w_brute_pipewrench'))

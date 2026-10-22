# scrap club v2 (detail pass, AESTHETIC.md): pipe handle + a riveted iron head with ivory/orange cone spikes,
# amber glow slits and a white crown tag. Origin at the grip, head along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
cyl(0.022, 0.62, (0, -0.21, 0), 'steel', X, n=8)                                 # pipe
cyl(0.03, 0.17, (0, 0.0, 0), 'olive', X, n=8, bevel=0.006)                        # cloth grip wrap
for y in (0.075, -0.075): cyl(0.033, 0.018, (0, y, 0), 'dark', X, n=8)          # wrap bindings
cyl(0.036, 0.04, (0, 0.11, 0), 'iron', X, n=6, bevel=0.006)                       # hex pommel
chain((0, 0.13, -0.01), (0, 0.15, -0.13), 0.012)                                  # dangling chain
box((0.03, 0.006, 0.04), (0, 0.15, -0.155), 'iron', bevel=0.002)                 # tag
cyl(0.03, 0.05, (0, -0.47, 0), 'rust', X, n=8, bevel=0.006)                      # collar
# head: iron block with an orange painted band and glowing slits
box((0.1, 0.27, 0.1), (0, -0.65, 0), 'iron', bevel=0.016)
box((0.104, 0.07, 0.104), (0, -0.56, 0), 'burnt', bevel=0.012)
for s in (-1, 1):
    box((0.006, 0.08, 0.02), (s * 0.052, -0.69, 0.02), 'glow', bevel=0.0)
    box((0.006, 0.08, 0.02), (s * 0.052, -0.69, -0.02), 'glow', bevel=0.0)
crown(0.06, (0, -0.69, 0.0505), normal=(0, 0, 1), up=(0, -1, 0), t=0.003)        # crown tag on top
for y in (-0.6, -0.75):
    for d in ((1, 0, 0), (-1, 0, 0), (0, 0, -1)):
        spike(0.02, 0.065, (d[0] * 0.05, y, d[2] * 0.05), d)
spike(0.024, 0.07, (0, -0.785, 0), (0, -1, 0))                                    # tip spike
for p in ((0.05, -0.53, 0.05), (-0.05, -0.53, 0.05), (0.05, -0.77, 0.05), (-0.05, -0.77, 0.05)):
    hexbolt(0.009, p, (0, 0, 1))

# ---- detail pass 2: crimson team wrap on the head, panel-line grooves, rust wear, a bigger tip spike collar
box((0.106, 0.035, 0.106), (0, -0.72, 0), 'team', bevel=0.01)
for y in (-0.6, -0.66): box((0.104, 0.006, 0.104), (0, y, 0), 'dark', bevel=0.0)
box((0.03, 0.06, 0.004), (-0.02, -0.66, -0.051), 'rust', bevel=0.0)
cyl(0.034, 0.02, (0, -0.79, 0), 'burnt', (90, 0, 0), n=6)
print(ship('w_brute_club'))

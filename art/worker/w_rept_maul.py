# EXTRA (not requested; Colin asked for Reptilian weapons to match the sheets): the heavy's giant spiked maul --
# a riveted barrel head with glowing orange windows, a crown plate, ivory/orange cone spikes all round, dangling
# chains with weights, a long banded haft with a spiked pommel. Origin at the lower grip, head along +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
cyl(0.045, 1.5, (0, -0.55, 0), 'leather', X, n=8)                                  # haft y +0.2 .. -1.3
for y in (0.1, -0.15, -0.5, -0.9): cyl(0.055, 0.05, (0, y, 0), 'iron', X, n=8)
spike(0.05, 0.16, (0, 0.2, 0), (0, 1, 0))                                         # spiked pommel
cyl(0.06, 0.08, (0, 0.18, 0), 'gold', X, n=8)
# head: barrel across the haft (axis X), 0.62 long
H = Vector((0, -1.45, 0))
cyl(0.24, 0.62, tuple(H), 'iron', (0, 90, 0), n=10)
for x in (-0.25, 0.0, 0.25): cyl(0.255, 0.06, tuple(H + Vector((x, 0, 0))), 'leather', (0, 90, 0), n=10)
for x in (-0.13, 0.13):
    for a in (0, 90, 180, 270):
        r = math.radians(a); g = box((0.1, 0.03, 0.06), tuple(H + Vector((x, math.cos(r) * 0.245, math.sin(r) * 0.245))), 'glow', bevel=0.0)
        g.rotation_euler = (r, 0, 0)
for s in (-1, 1):
    cyl(0.2, 0.06, tuple(H + Vector((s * 0.33, 0, 0))), 'ivory', (0, 90, 0), n=8)
    spike(0.07, 0.24, tuple(H + Vector((s * 0.36, 0, 0))), (s, 0, 0))             # end spikes
    for a in (45, 135, 225, 315):
        r = math.radians(a); spike(0.045, 0.16, tuple(H + Vector((s * 0.2, math.cos(r) * 0.24, math.sin(r) * 0.24))), (0, math.cos(r), math.sin(r)))
box((0.22, 0.02, 0.2), tuple(H + Vector((0, -0.255, 0))), 'dark', bevel=0.0)
crown(0.16, tuple(H + Vector((0, -0.27, 0))), normal=(0, -1, 0), up=(0, 0, 1), t=0.008)
spike(0.06, 0.22, tuple(H + Vector((0, -0.24, 0))) if False else tuple(H + Vector((0, 0, 0.24))), (0, 0, 1))
for x in (-0.18, 0.18):
    chain(tuple(H + Vector((x, 0.05, -0.24))), tuple(H + Vector((x, 0.08, -0.5))), 0.02)
    cyl(0.035, 0.08, tuple(H + Vector((x, 0.08, -0.55))), 'iron', n=6, r2=0.015)
print(ship('w_rept_maul'))

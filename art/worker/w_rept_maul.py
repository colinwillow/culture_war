# Reptilian heavy's maul v2 (Colin's lizard sheet #2): a huge riveted block head -- dark iron + bone-white plates, orange
# glowing slots, dark crown plates on both faces, bone/orange cone spikes all over, chains ending in spiked weights,
# a ribbed haft with a glowing spiked pommel. Origin at the lower grip, head along +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
cyl(0.05, 1.5, (0, -0.55, 0), 'iron', X, n=8)                                      # haft y +0.2 .. -1.3
for k in range(8): cyl(0.062, 0.05, (0, 0.1 - k * 0.16, 0), 'leather', X, n=8)     # ribs/wraps
cyl(0.075, 0.12, (0, 0.24, 0), 'iron', X, n=8)
cyl(0.05, 0.03, (0, 0.31, 0), 'glow', X, n=8)                                      # glowing pommel ring
spike(0.06, 0.2, (0, 0.33, 0), (0, 1, 0))
# head block (axis X across the haft), 0.7 x 0.5 x 0.5
H = Vector((0, -1.45, 0))
box((0.7, 0.5, 0.5), tuple(H), 'iron', bevel=0.05)
for s in (-1, 1):
    box((0.12, 0.54, 0.54), tuple(H + Vector((s * 0.32, 0, 0))), 'plate', bevel=0.04)          # bone end caps
    spike(0.09, 0.3, tuple(H + Vector((s * 0.38, 0, 0))), (s, 0, 0))
    for (dy, dz) in ((0.18, 0.18), (-0.18, 0.18), (0.18, -0.18), (-0.18, -0.18)):
        spike(0.05, 0.18, tuple(H + Vector((s * 0.36, dy, dz))), (s, dy, dz))
for nrm in ((0, -1, 0), (0, 1, 0)):
    crownplate(0.32, tuple(H + Vector(nrm) * 0.25), nrm, (0, 0, 1))
    for x in (-0.2, 0.2):
        g = box((0.07, 0.02, 0.22), tuple(H + Vector(nrm) * 0.255 + Vector((x, 0, 0))), 'glow', bevel=0.0)
for nrm in ((0, 0, 1), (0, 0, -1)):
    for x in (-0.18, 0.0, 0.18):
        spike(0.055, 0.2, tuple(H + Vector(nrm) * 0.25 + Vector((x, 0, 0))), nrm)
    box((0.4, 0.2, 0.02), tuple(H + Vector(nrm) * 0.255), 'glow', bevel=0.0)
for x in (-0.25, 0.25):                                                             # chains with spiked weights
    chain(tuple(H + Vector((x, 0.1, -0.25))), tuple(H + Vector((x, 0.12, -0.6))), 0.022)
    cyl(0.04, 0.1, tuple(H + Vector((x, 0.12, -0.66))), 'iron', n=6)
    spike(0.03, 0.09, tuple(H + Vector((x, 0.12, -0.71))), (0, 0, -1))
print(ship('w_rept_maul'))

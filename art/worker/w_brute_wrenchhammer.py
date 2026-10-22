# giant wrench-hammer v2 (detail pass): flat riveted shaft with an amber glow canister, block head with an
# adjustable wrench jaw (+X) and a spiked hammer face (-X), orange paint plates, crown tags, chain at the grip.
# Origin at the lower grip, head along +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
box((0.055, 1.0, 0.05), (0, -0.40, 0), 'steel', bevel=0.012)                       # shaft y +0.10 .. -0.90
cyl(0.038, 0.2, (0, 0.0, 0), 'olive', X, n=8, bevel=0.006)                          # grips
cyl(0.038, 0.14, (0, -0.36, 0), 'olive', X, n=8, bevel=0.006)
for y in (0.1, -0.1, -0.29, -0.43): cyl(0.041, 0.016, (0, y, 0), 'dark', X, n=8)
box((0.085, 0.05, 0.075), (0, 0.13, 0), 'iron', bevel=0.012)                        # end knob
chain((0.03, 0.13, -0.03), (0.04, 0.16, -0.17), 0.013)
canister(0.035, 0.2, (0, -0.6, 0), (0, -1, 0), 'glow', bars=3, ribs=1)             # glow canister in the shaft
box((0.08, 0.1, 0.07), (0, -0.78, 0), 'burnt', bevel=0.012)                         # neck plate
for y in (-0.75, -0.81): hexbolt(0.01, (0, y, 0.037), (0, 0, 1))
# head block
box((0.15, 0.24, 0.2), (0, -1.1, 0), 'iron', bevel=0.025)
box((0.152, 0.08, 0.202), (0, -1.0, 0), 'burnt', bevel=0.02)                       # orange paint band
for s in (-1, 1):
    crown(0.09, (0, -1.13, s * 0.101), normal=(0, 0, s), up=(0, -1, 0), t=0.004)    # crown tags both faces
    for x in (-0.055, 0.055):
        for y in (-1.01, -1.2): hexbolt(0.012, (x, y, s * 0.1), (0, 0, s))
# wrench jaw (+X): two prongs, adjuster screw
for y in (-1.03, -1.19):
    box((0.11, 0.06, 0.17), (0.12, y, 0), 'steel', bevel=0.015)
cyl(0.022, 0.12, (0.08, -1.11, 0), 'burnt', X, n=8)
# hammer face (-X) with four cone spikes
box((0.06, 0.2, 0.2), (-0.1, -1.1, 0), 'steel', bevel=0.02)
for y in (-1.04, -1.16):
    for z in (-0.055, 0.055):
        spike(0.022, 0.06, (-0.13, y, z), (-1, 0, 0))
spike(0.03, 0.09, (0, -1.22, 0), (0, -1, 0))                                         # top spike

# ---- detail pass 2: crimson team strip round the head, panel lines, rust wear on the jaw, a second chain
box((0.154, 0.035, 0.204), (0, -1.21, 0), 'team', bevel=0.01)
for y in (-1.06, -1.15): box((0.152, 0.006, 0.202), (0, y, 0), 'dark', bevel=0.0)
box((0.06, 0.05, 0.01), (0.13, -1.03, 0.086), 'rust', bevel=0.0)
chain((-0.03, 0.13, -0.03), (-0.05, 0.15, -0.13), 0.011)
print(ship('w_brute_wrenchhammer'))

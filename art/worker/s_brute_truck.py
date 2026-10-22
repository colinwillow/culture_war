# Brute truck: armoured scrap truck with a plough, crimson doors. Origin ground centre, front (plough) +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((2.3, 5.0, 0.5), (0, 0.2, 0.75), 'iron', bevel=0.08)                          # chassis
box((2.3, 1.6, 1.0), (0, -1.5, 1.45), 'olive', bevel=0.12)                        # engine block / hood
box((2.4, 1.7, 1.2), (0, 0.15, 1.9), 'olive', bevel=0.12)                         # armoured cab (top ~2.5)
box((2.0, 0.08, 0.3), (0, -0.72, 2.2), 'iron', bevel=0.0)                         # vision slit
box((1.7, 0.06, 0.12), (0, -0.77, 2.2), 'glow', bevel=0.0)                        # amber slit glow
for s in (-1, 1):
    box((0.08, 1.2, 0.9), (s * 1.22, 0.15, 1.8), 'team', bevel=0.02)              # crimson doors
    rivets([(s * 1.27, y, z) for y in (-0.35, 0.65) for z in (1.4, 2.2)], 0.05, 'bone', 'X')
box((2.4, 2.4, 0.8), (0, 1.95, 1.4), 'rust', bevel=0.08)                          # flatbed tub
for x in (-0.9, 0.9):
    box((0.15, 2.3, 0.4), (x, 1.95, 2.0), 'steel', bevel=0.0)                     # bed rails
box((0.6, 0.6, 0.6), (0.3, 2.3, 2.1), 'wood', bevel=0.04)                         # crate in the back
for s in (-1, 1):
    cyl(0.13, 0.9, (s * 0.9, -1.3, 2.2), 'iron', n=6)                             # exhaust stacks
# plough: angled blade + arms
box((2.6, 0.25, 0.9), (0, -2.65, 0.65), 'steel', rot=(-25, 0, 0), bevel=0.05, taper=(1.0, 1.0))
for x in (-1.0, -0.33, 0.33, 1.0):
    box((0.08, 0.3, 0.9), (x, -2.75, 0.65), 'orange', rot=(-25, 0, 0), bevel=0.0)  # hazard stripes on the blade
for x in (-0.7, 0.7):
    box((0.15, 0.8, 0.15), (x, -2.25, 0.75), 'iron', bevel=0.0)
# wheels
for x in (-1, 1):
    for y in (-1.3, 0.6, 1.9):
        cyl(0.52, 0.42, (x * 1.12, y, 0.52), 'tire', (0, 90, 0), n=10, bevel=0.05)
        cyl(0.25, 0.44, (x * 1.12, y, 0.52), 'steel', (0, 90, 0), n=6)

# ---- v2 detail pass: cone spikes on the plough + cab roof, glow canisters on the bed, crown tags, ivory hood plate
for x in (-1.0, 0.0, 1.0):
    spike(0.1, 0.4, (x, -2.8, 0.95), (0, -1, 0.35))
for x in (-0.9, 0.9):
    spike(0.1, 0.4, (x, 0.15, 2.5), (x * 0.3, 0, 1))
box((1.6, 1.0, 0.08), (0, -1.5, 1.98), 'ivory', bevel=0.03)
crown(0.6, (0, -1.5, 2.03), normal=(0, 0, 1), up=(0, -1, 0), t=0.02, col='dark')
for s in (-1, 1):
    crown(0.5, (s * 1.27, 0.15, 1.85), normal=(s, 0, 0), up=(0, 0, 1), t=0.02)
for x in (-0.6, -0.15):
    canister(0.18, 0.8, (x, 2.0, 2.25), (0, 0, 1), 'glow', bars=3, ribs=1)
chain((1.2, -2.3, 0.75), (1.25, -2.0, 0.35), 0.04)
print(ship('s_brute_truck'))

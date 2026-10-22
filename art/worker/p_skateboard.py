# scrap skateboard v2 (detail pass): riveted steel deck with kicked nose/tail, crimson grip stripe + white crown tag,
# glowing amber wheel hubs, spiked nose/tail bumpers, a dangling chain. Origin on the ground under the deck centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
DZ = 0.115
box((0.26, 0.62, 0.03), (0, 0, DZ), 'steel', bevel=0.01)
for s in (-1, 1):
    box((0.26, 0.15, 0.03), (0, s * 0.37, DZ + 0.025), 'steel', rot=(s * 20, 0, 0), bevel=0.01)
    box((0.27, 0.04, 0.04), (0, s * 0.44, DZ + 0.05), 'iron', bevel=0.008)                  # bumper bars
    for x in (-0.09, 0.09): spike(0.012, 0.04, (x, s * 0.46, DZ + 0.05), (0, s, 0.3))       # bumper spikes
box((0.27, 0.50, 0.012), (0, 0, DZ + 0.018), 'dark', bevel=0.004)                         # grip
box((0.27, 0.10, 0.014), (0, 0, DZ + 0.02), 'team', bevel=0.004)                          # crimson stripe
crown(0.1, (0, -0.15, DZ + 0.025), normal=(0, 0, 1), up=(0, -1, 0), t=0.003)              # crown tag
box((0.06, 0.06, 0.012), (-0.07, 0.17, DZ + 0.027), 'burnt', bevel=0.004)                 # welded patch
for x, y in ((0.1, 0.2), (-0.1, 0.2), (0.1, -0.2), (-0.1, -0.2), (0.11, 0.0), (-0.11, 0.0)):
    hexbolt(0.008, (x, y, DZ + 0.026), (0, 0, 1), 'ivory')
for s in (-1, 1):
    y = s * 0.27
    box((0.16, 0.06, 0.035), (0, y, DZ - 0.03), 'iron', bevel=0.008)
    cyl(0.012, 0.30, (0, y, 0.05), 'steel', (0, 90, 0), n=6)
    for x in (-1, 1):
        cyl(0.05, 0.05, (x * 0.125, y, 0.05), 'dark', (0, 90, 0), n=8, bevel=0.012)
        cyl(0.028, 0.054, (x * 0.125, y, 0.05), 'glow', (0, 90, 0), n=8)                  # glowing hubs
chain((0.13, 0.05, DZ - 0.01), (0.15, 0.12, DZ - 0.06), 0.009)

# ---- detail pass 2: crimson team edge rails, scuff wear on the nose, panel line across the deck
for x in (-0.135, 0.135): box((0.012, 0.6, 0.02), (x, 0, DZ + 0.005), 'team', bevel=0.0)
box((0.12, 0.06, 0.006), (0.04, -0.37, DZ + 0.055), 'rust', rot=(-20, 0, 0), bevel=0.0)
box((0.27, 0.006, 0.014), (0, 0.12, DZ + 0.025), 'steel', bevel=0.0)
print(ship('p_skateboard'))

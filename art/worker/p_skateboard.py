# scrap skateboard: dented steel deck, four chunky wheels, crimson grip stripe.
# Origin on the ground (wheel bottoms) under the deck centre; nose along +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
DZ = 0.115  # deck centre height
box((0.26, 0.62, 0.03), (0, 0, DZ), 'steel', bevel=0.01)                       # deck middle
for s in (-1, 1):
    box((0.26, 0.15, 0.03), (0, s * 0.37, DZ + 0.025), 'steel', rot=(s * 20, 0, 0), bevel=0.01)  # kicked nose/tail
box((0.08, 0.10, 0.006), (0.05, 0.12, DZ - 0.016), 'iron', bevel=0.0)         # dent patch (underside plate)
box((0.27, 0.50, 0.012), (0, 0, DZ + 0.018), 'iron', bevel=0.004)             # dark grip
box((0.27, 0.10, 0.014), (0, 0, DZ + 0.02), 'team', bevel=0.004)              # crimson grip stripe
box((0.06, 0.06, 0.012), (-0.07, -0.18, DZ + 0.027), 'steel', bevel=0.004)    # welded patch on top
for s in (-1, 1):
    y = s * 0.27
    box((0.16, 0.06, 0.035), (0, y, DZ - 0.03), 'iron', bevel=0.008)           # truck baseplate/hanger
    cyl(0.012, 0.30, (0, y, 0.05), 'steel', (0, 90, 0), n=6)                   # axle
    for x in (-1, 1):
        cyl(0.05, 0.05, (x * 0.125, y, 0.05), 'orange', (0, 90, 0), n=8, bevel=0.012)   # chunky wheels
        cyl(0.02, 0.054, (x * 0.125, y, 0.05), 'iron', (0, 90, 0), n=6)                 # hub
for x, y in ((0.06, 0.2), (-0.06, 0.2), (0.06, -0.2), (-0.06, -0.2)):
    cyl(0.01, 0.01, (x, y + (0.06 if y > 0 else -0.06), DZ + 0.026), 'bone', n=6)      # bolt heads
print(ship('p_skateboard'))

# Brute HQ v2 (detail pass, AESTHETIC.md): + cone-spike crowns on the roofline, glow canister pylons, a giant
# white crown tag, chains over the gate, glowing smokestack. Was:
# Brute HQ: scrap fortress of stacked shipping containers, a smokestack, a big bitten-gear emblem plate (team crimson).
# Origin ground centre, front (gate + emblem) faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
spike, crown, banner = brute_style()   # Brute sheets: gear-wrench brand, iron studs
# ground layer: U of containers, open front with a gate
container(8.4, (-3.3, 0.2, 0), 'rust', 'Y')
container(8.4, (3.3, 0.2, 0), 'paint', 'Y')
container(4.2, (0, 3.2, 0), 'steel', 'X')
box((4.2, 6.0, 0.3), (0, -0.6, 0.15), 'iron', bevel=0.05)                       # yard floor
# second layer: one long container across, one along the right
container(9.0, (0, 0.6, 2.6), 'paint', 'X')
container(5.0, (3.3, 2.0, 2.6), 'rust', 'Y')
# top: a lookout cabin of steel plates
box((3.0, 2.6, 1.6), (-1.6, 1.2, 6.0), 'steel', bevel=0.08)
box((3.4, 3.0, 0.2), (-1.6, 1.2, 6.9), 'iron', bevel=0.05)
box((2.0, 0.05, 0.5), (-1.6, -0.12, 6.1), 'glow', bevel=0.0)                   # lit slit window
# gate: heavy frame + crimson banner plates
for x in (-1.9, 1.9):
    box((0.4, 0.5, 2.6), (x, -3.9, 1.3), 'iron', bevel=0.06)
box((4.2, 0.5, 0.5), (0, -3.9, 2.45), 'iron', bevel=0.06)
for x in (-1.2, 0, 1.2):
    box((1.0, 0.08, 1.8), (x, -4.0, 1.2), 'steel', bevel=0.03)                  # gate doors (plates)
for x in (-3.3, 3.3):
    box((1.6, 0.1, 1.8), (x, -4.0, 1.3), 'team', bevel=0.03)                    # crimson end panels on the containers
# emblem: bitten gear on the front of the upper container
gear(1.3, (0, -0.93, 3.9), 'team', teeth=10, bite=2, thick=0.3)
box((3.4, 0.15, 2.4), (0, -0.72, 3.9), 'iron', bevel=0.05)                     # backing plate
# smokestack (back-left), up to 8 m
cyl(0.55, 5.2, (-3.3, 3.2, 5.2), 'iron', n=10)
cyl(0.7, 0.4, (-3.3, 3.2, 7.8), 'rust', n=10, bevel=0.04)
for z in (3.6, 5.2, 6.8):
    cyl(0.6, 0.15, (-3.3, 3.2, z), 'steel', n=10)
cyl(0.42, 0.1, (-3.3, 3.2, 8.0), 'tire', n=10)                                  # soot mouth
# rivet rows + spikes on the roofline
for x in (-4.0, -2.0, 0.0, 2.0, 4.0):
    cyl(0.12, 0.6, (x, -0.6, 5.5), 'bone', n=6, r2=0.0)
for x in (-3.0, 3.0):                                                               # (pass 6: trimmed for the 6k budget)
    rivets([(x, -0.62, 3.0), (x, -0.62, 4.8)], 0.07, 'bone', 'Y')

# ---- v2 detail pass
for x in (-4.4, -2.9, 2.9, 4.4):                                                    # big spikes along the top container
    spike(0.28, 1.0, (x, -0.6, 5.2), (x * 0.08, -0.25, 1))
for y in (1.2, 2.6):
    spike(0.24, 0.8, (4.5, y, 5.2), (0.5, 0, 1)); spike(0.22, 0.7, (-4.5, y - 0.8, 2.6), (-0.6, 0, 1))
for x in (-3.3, 3.3):                                                               # glow canister pylons at the gate
    canister(0.32, 1.6, (x, -4.25, 3.4), (0, 0, 1), 'glow', bars=4, ribs=2)
    spike(0.2, 0.6, (x, -4.25, 4.2), (0, 0, 1))
crown(2.0, (2.0, -4.02, 1.4), normal=(0, -1, 0), up=(0, 0, 1), t=0.06)             # giant crown tag on the gate panel
crown(1.6, (4.56, 1.5, 1.4), normal=(1, 0, 0), up=(0, 0, 1), t=0.05)              # and on the side container
for x0, x1 in ((-1.9, 1.9),):                                           # chains swagging over the gate
    chain((x0, -4.15, 2.6), ((x0 + x1) / 2, -4.2, 2.1), 0.16); chain(((x0 + x1) / 2, -4.2, 2.1), (x1, -4.15, 2.6), 0.16)
cyl(0.62, 0.2, (-3.3, 3.2, 6.0), 'glow', n=10)                                     # glowing band on the stack
for a in (0, 120, 240):
    r = math.radians(a); spike(0.14, 0.5, (-3.3 + math.cos(r) * 0.7, 3.2 + math.sin(r) * 0.7, 7.85), (math.cos(r), math.sin(r), 1.2))
for x in ():
    box((0.6, 0.12, 0.3), (x, -1.0, 2.75), 'ivory', bevel=0.03)                    # ivory armour plates on the emblem backing
    hexbolt(0.07, (x, -1.07, 2.75), (0, -1, 0))

# ---- detail pass 2: tattered crimson banners (crown + skull) on the containers, hazard stripes on the gate posts,
# rust streaks, panel lines
banner(1.3, 1.5, (-3.3, -4.12, 2.4), (0, -1, 0), mark='skull')
banner(1.2, 1.8, (4.62, -1.6, 4.9), (1, 0, 0), mark='crown')

for x in ():
    for z in (0.4, 1.0, 1.6, 2.2): box((0.42, 0.52, 0.18), (x, -3.9, z), 'orange' if int(z * 10) % 12 == 4 or z in (0.4, 1.6) else 'dark', bevel=0.0)
for (x, y, z) in ((-2.0, -0.12, 4.0), (1.0, -0.12, 3.6), (4.62, 2.8, 1.4)):
    box((0.12, 0.04, 0.9) if x < 4 else (0.04, 0.12, 0.9), (x, y if x < 4 else y, z), 'rust', bevel=0.0)

# ---- detail pass 6 (silhouette): giant ivory tusked skull crowning the gate, tusks curling up either side
skull(0.95, (0, -4.05, 3.55), (0, -1, 0), 'ivory')
for s_ in (-1, 1):
    spike(0.22, 1.2, (s_ * 0.75, -4.1, 2.75), (s_ * 0.5, -0.25, 1))

# ---- BRUTE PASS (Colin's Brute sheets): orange-painted riveted armour plates with the ivory gear-wrench brand, octagonal
# pads, ammo bandoliers slung over the containers, red armband wraps on the smokestack
for (x, y, z, nrm) in ((-3.3, -4.07, 1.3, (0, -1, 0)), (4.57, 0.2, 1.3, (1, 0, 0)), (-4.57, 0.2, 1.3, (-1, 0, 0))):
    pl = box((2.0, 0.12, 1.6) if nrm[1] else (0.12, 2.0, 1.6), (x, y, z), 'paint', bevel=0.06)
    gearmark(1.3, (x + nrm[0] * 0.07, y + nrm[1] * 0.07, z), nrm, (0, 0, 1), 'ivory')
for (x, z) in ((-1.6, 1.0),): octpad(0.9, (x, -4.15, z), (0, -1, 0))
bandolier((-4.5, -4.0, 2.55), (-2.0, -4.0, 4.9), 0.14)

for z in (4.3, 6.6): cyl(0.6, 0.35, (-3.3, 3.2, z), 'team', n=10)
print(ship('bb_hq'))

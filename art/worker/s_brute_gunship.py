# Brute gunship: fat riveted flying barge, big rear propeller, open sides, crimson panels.
# Bottom of the hull at y = 0 (hover height is the game's job), nose +Z (Blender -Y), prop at the back.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
spike, crown, banner = brute_style()   # Brute sheets: gear-wrench brand, iron studs
box((4.2, 7.0, 1.1), (0, -0.3, 0.75), 'paint', bevel=0.2, taper=(1.15, 1.0))         # hull (flares out)
box((3.0, 1.6, 0.9), (0, -4.0, 0.9), 'rust', rot=(-18, 0, 0), bevel=0.2, taper=(1.2, 1))  # blunt bow
box((2.0, 6.0, 0.5), (0, -0.3, 0.25), 'iron', bevel=0.12)                           # keel
box((4.6, 7.2, 0.15), (0, -0.4, 1.38), 'wood', bevel=0.04)                          # open deck
for s in (-1, 1):
    for y in (-3.4, -1.8, -0.2, 1.4, 2.8):
        cyl(0.07, 0.8, (s * 2.2, y, 1.8), 'iron', n=5)                              # rail posts
    box((0.1, 6.4, 0.1), (s * 2.2, -0.3, 2.2), 'iron', bevel=0.0)                   # rail
    box((0.12, 2.6, 0.7), (s * 2.25, -2.2, 0.85), 'team', bevel=0.02)               # crimson hull panels
    rivets([(s * 2.32, y, 1.15) for y in (-3.4, -2.4, -1.2, 0.0, 1.2, 2.4)], 0.07, 'bone', 'X')
    # stubby wing + downward fan pod
    box((1.4, 1.4, 0.25), (s * 2.55, 0.4, 1.0), 'steel', bevel=0.06)
    cyl(0.6, 0.6, (s * 2.75, 0.4, 0.75), 'iron', n=10, bevel=0.05)
    cyl(0.48, 0.08, (s * 2.75, 0.4, 0.42), 'glow', n=10)                              # amber lift glow
# cabin + gun at the bow
box((1.6, 1.4, 1.0), (0, 2.0, 1.95), 'steel', bevel=0.1)
box((1.4, 0.06, 0.35), (0, 1.28, 2.1), 'glow', bevel=0.0)
cyl(0.35, 0.5, (0, -3.0, 1.7), 'iron', n=8)
cyl(0.15, 1.6, (0, -3.9, 1.9), 'iron', (90, 0, 0), n=8)
# big rear propeller on a mount
box((0.5, 0.9, 1.0), (0, 3.4, 1.7), 'iron', bevel=0.08)
cyl(0.4, 0.6, (0, 3.9, 1.95), 'steel', (90, 0, 0), n=8)
torus(1.05, 0.12, (0, 4.15, 1.95), 'orange', rot=(90, 0, 0), n=16, m=5)               # prop guard
for a in (0, 120, 240):                                                               # three fat blades
    b = box((0.35, 0.08, 0.95), (0, 4.2, 1.95), 'steel', bevel=0.02)
    b.rotation_euler = (0, math.radians(a), 0)
    b.location = (math.sin(math.radians(a)) * 0.5, 4.2, 1.95 + math.cos(math.radians(a)) * 0.5)
    b.rotation_euler.rotate_axis('Z', math.radians(20))

# ---- v2 detail pass: ivory bow armour + ram spikes, crown tags on the hull, glow canisters on the fan pods, rail spikes
box((2.6, 0.3, 0.8), (0, -4.45, 0.95), 'ivory', rot=(-18, 0, 0), bevel=0.08)
for x in (-0.9, 0.0, 0.9):
    spike(0.16, 0.6, (x, -4.6, 1.0), (0, -1, -0.15))
for s in (-1, 1):
    crown(1.0, (s * 2.33, 0.6, 0.85), normal=(s, 0, 0), up=(0, 0, 1), t=0.03)
    canister(0.16, 0.9, (s * 2.75, 0.4, 1.35), (0, 1, 0), 'glow', bars=3, ribs=1)
    for y in (-3.4, -0.2, 2.8):
        spike(0.07, 0.3, (s * 2.2, y, 2.25), (s * 0.3, 0, 1))
crown(0.9, (0, 2.0, 2.46), normal=(0, 0, 1), up=(0, -1, 0), t=0.03)
crown(2.2, (0, -1.0, 1.46), normal=(0, 0, 1), up=(0, -1, 0), t=0.02)                 # big crown painted on the deck
for (x, y) in ((-1.4, 0.9), (-1.4, 1.6), (1.5, 1.2)):
    box((0.6, 0.6, 0.6), (x, y, 1.75), 'wood', bevel=0.04); box((0.62, 0.1, 0.62), (x, y, 1.75), 'iron', bevel=0.0)
cyl(0.28, 0.75, (1.5, -2.4, 1.83), 'burnt', n=8, bevel=0.03); cyl(0.28, 0.75, (1.0, -2.6, 1.83), 'rust', n=8, bevel=0.03)
chain((2.2, -1.0, 2.2), (2.25, -1.0, 1.4), 0.06); chain((-2.2, 1.0, 2.2), (-2.25, 1.0, 1.4), 0.06)

# ---- detail pass 2: crimson crown banner off the stern mount, skull on the bow armour, hazard stripes on the stern
banner(0.9, 1.0, (0, 3.6, 2.3), (0, 1, 0), mark='crown')
skull(0.3, (0, -4.62, 1.15), (0, -1, -0.3), 'ivory')
for k in range(6): box((0.5, 0.1, 0.25), (-1.25 + k * 0.5, 3.12, 1.1), 'orange' if k % 2 else 'dark', bevel=0.0)

# ---- detail pass 6 (silhouette): twin side cannons on swivels + a big ivory ram spike under the bow
for s_ in (-1, 1):
    cyl(0.3, 0.4, (s_ * 1.7, -1.8, 1.65), 'iron', n=8)
    cyl(0.14, 1.6, (s_ * 1.85, -2.6, 1.95), 'iron', (90, 0, s_ * 10), n=8)
    cyl(0.2, 0.25, (s_ * 1.97, -3.35, 1.95), 'burnt', (90, 0, s_ * 10), n=8)
spike(0.35, 1.4, (0, -4.3, 0.5), (0, -1, -0.1))

# ---- BRUTE PASS: orange painted hull plates with big gear brands, octagonal pads on the fan pods, bandoliers on the rails
for s_ in (-1, 1):
    box((0.1, 2.2, 0.75), (s_ * 2.36, 1.6, 0.9), 'paint', bevel=0.03)
    gearmark(0.75, (s_ * 2.42, 1.6, 0.9), (s_, 0, 0), (0, 0, 1), 'ivory')
    octpad(0.7, (s_ * 3.38, 0.4, 0.75), (s_, 0, 0))
    bandolier((s_ * 2.25, -3.0, 2.2), (s_ * 2.25, 0.0, 2.2), 0.08)
print(ship('s_brute_gunship'))

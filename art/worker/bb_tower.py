# Brute tower: rickety welded-pipe lookout with a gun nest on top. Origin ground centre, gun faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
P = 1.1   # leg half-spread at the base
legs = [(-P, -P), (P, -P), (P, P), (-P, P)]
for i, (x, y) in enumerate(legs):
    box((0.5, 0.5, 0.3), (x, y, 0.15), 'concrete', bevel=0.04)                          # footings
    # leg leans in to 0.8 at the top, slight wobble (rickety)
    tx, ty = x * 0.75, y * 0.75
    h = 6.6; dx, dy = tx - x, ty - y
    ob = cyl(0.11, math.sqrt(h * h + dx * dx + dy * dy), ((x + tx) / 2, (y + ty) / 2, h / 2 + 0.2), 'steel', n=6)
    ob.rotation_euler = (math.atan2(-dy, h) * 1.0 + (0.02 if i % 2 else -0.02), math.atan2(dx, h), 0)
# cross bracing (pipes) at three levels, some mismatched colour
for z, col in ((1.6, 'rust'), (3.4, 'steel'), (5.2, 'rust')):
    k = 1 - (z / 6.6) * 0.25
    for a, b in ((0, 1), (1, 2), (2, 3), (3, 0)):
        (x0, y0), (x1, y1) = legs[a], legs[b]
        cx, cy = (x0 + x1) / 2 * k, (y0 + y1) / 2 * k
        L = 2 * P * k
        box((L, 0.1, 0.1) if y0 == y1 else (0.1, L, 0.1), (cx, cy, z), col, bevel=0.0)
        # diagonal X on two faces
    box((0.08, 0.08, 2.0), (0, -P * k, z - 0.9), col, rot=(0, 50, 0), bevel=0.0)
cyl(0.2, 0.14, (P * 0.92, -P * 0.92, 3.4), 'orange', n=6)                               # weld blobs
cyl(0.2, 0.14, (-P * 0.86, P * 0.86, 5.2), 'orange', n=6)
# ladder up the back
for s in (-1, 1):
    box((0.06, 0.06, 6.6), (s * 0.25, P * 0.92, 3.5), 'iron', rot=(-2, 0, 0), bevel=0.0)
for z in range(1, 13):
    box((0.5, 0.05, 0.05), (0, P * 0.92 - z * 0.004, z * 0.5), 'iron', bevel=0.0)
# gun nest platform + sandbag-ish armour plates
box((2.8, 2.8, 0.25), (0, 0, 6.85), 'iron', bevel=0.05)
for s in (-1, 1):
    box((2.8, 0.15, 0.9), (0, s * 1.35, 7.4), 'steel', bevel=0.04)
    box((0.15, 2.8, 0.9), (s * 1.35, 0, 7.4), 'steel', bevel=0.04)
box((1.6, 0.18, 0.6), (0, -1.38, 7.35), 'team', bevel=0.03)                             # crimson front plate
box((0.18, 1.4, 0.5), (1.38, 0.2, 7.35), 'team', bevel=0.03)                            # crimson side plate
rivets([(x, -1.47, 7.75) for x in (-1.1, -0.5, 0.5, 1.1)], 0.06, 'bone', 'Y')
# the gun: chunky barrel over the front plate on a swivel
cyl(0.25, 0.8, (0, -0.2, 7.4), 'iron', n=8)
box((0.6, 0.8, 0.45), (0, -0.4, 7.95), 'steel', bevel=0.06)
cyl(0.19, 1.1, (0, -1.2, 8.05), 'iron', (90, 0, 0), n=8)
cyl(0.26, 0.2, (0, -1.72, 8.05), 'iron', (90, 0, 0), n=8, bevel=0.02)
box((0.22, 0.3, 0.12), (0, -0.55, 8.27), 'glow', bevel=0.0)                              # amber sight
# roof: tilted tin sheet on two poles
for x in (-1.2, 1.2):
    cyl(0.06, 1.9, (x, 1.2, 7.95), 'iron', n=5)
box((3.0, 1.8, 0.08), (0, 0.6, 8.85), 'rust', rot=(-12, 0, 4), bevel=0.0)

# ---- v2 detail pass: spike ring on the nest, glow canisters strapped to two legs, crown tag on the front plate
for x in (-1.3, 1.3):
    for y in (-1.3, 1.3):
        spike(0.12, 0.5, (x, y, 7.85), (x * 0.3, y * 0.3, 1))
for y in (-1.3, 1.3):
    spike(0.1, 0.4, (0, y, 7.85), (0, y * 0.3, 1))
crown(0.9, (0, -1.48, 7.36), normal=(0, -1, 0), up=(0, 0, 1), t=0.03)
for (x, y) in ((P * 0.9, -P * 0.9), (-P * 0.88, -P * 0.88)):
    canister(0.14, 0.8, (x, y - 0.12, 2.6), (0, 0, 1), 'glow', bars=3, ribs=1)
spike(0.1, 0.35, (0, 0.6, 9.0), (0, 0, 1))
print(ship('bb_tower'))

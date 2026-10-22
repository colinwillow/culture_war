# Spore HQ: giant mushroom-cluster mother-mound with a glowing sac core. Origin ground centre, sac faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(4.6, (0, 0.3, 0), 'goo', 2, (1.0, 0.95, 0.45))                              # mound (clipped at ground)
ball(2.2, (2.3, 1.8, 0.4), 'goo', 1, (1, 1, 0.7))
ball(2.0, (-2.5, 1.6, 0.3), 'goo', 1, (1, 1, 0.6))
def shroom(x, y, h, r, cap='purple', lean=(0, 0)):
    cyl(r * 0.45, h, (x, y, h / 2), 'fungus', rot=(lean[0], lean[1], 0), n=8, r2=r * 0.32)
    cx = x + math.sin(math.radians(lean[1])) * h; cy = y - math.sin(math.radians(lean[0])) * h
    ball(r, (cx, cy, h), cap, 2, (1, 1, 0.45))                                        # cap
    cyl(r * 0.85, 0.15, (cx, cy, h - 0.12), 'bone', n=12)                             # gill ring
    return cx, cy
cx, cy = shroom(0.0, 1.0, 8.1, 2.4, 'purple')                                         # the big one (top ~9 m)
for a in (0, 72, 144, 216, 288):                                                       # crimson spots on the big cap
    r = math.radians(a)
    ball(0.42, (cx + math.cos(r) * 1.3, cy + math.sin(r) * 1.3, 8.1 + 0.75), 'team', 1, (1, 1, 0.4))
ball(0.5, (cx, cy, 8.1 + 1.05), 'team', 1, (1, 1, 0.4))
shroom(-2.8, 0.6, 5.0, 1.7, 'fungus', (0, -9))
shroom(2.9, 0.4, 5.6, 1.6, 'purple', (0, 10))
shroom(1.6, 3.2, 3.6, 1.2, 'fungus', (14, 0))
shroom(-1.8, 3.0, 3.2, 1.1, 'purple', (12, -10))
# glowing sac core at the front: translucent outer sac round a bright acid core, veins
ball(0.95, (0, -3.0, 1.2), 'gacid', 2)
ball(1.6, (0, -3.0, 1.35), 'cacid', 2, (1, 0.9, 1.0))
for a in (-40, 0, 40):
    v = cyl(0.12, 2.4, (math.sin(math.radians(a)) * 1.2, -1.8, 1.6), 'purple', rot=(-60, 0, a), n=5)
# little glowing pustules over the mound
for (x, y) in ((-3.2, -1.2), (3.0, -1.5), (-1.5, -2.0), (2.0, 2.6), (-3.6, 2.4)):
    ball(0.3, (x, y, 0.9), 'gacid', 1)

def surf(x, y):
    rr = math.hypot(x, (y - 0.3) / 0.95) / 4.6
    return 4.6 * 0.45 * math.sqrt(max(0.0, 1 - rr * rr))
# ---- v2 detail pass: thorn spikes out of the mound, scavenged acid canisters plugged into the mound with hoses,
# a white crown tag painted on the big cap, chains binding the sac
for (x, y, d) in ((-3.6, -0.5, (-1, -0.3, 0.6)), (3.5, -0.8, (1, -0.3, 0.6)), (-2.0, 2.8, (-0.4, 0.6, 0.8)),
                  (2.6, 2.4, (0.5, 0.5, 0.8)), (0.0, -2.0, (0, -0.4, 1)), (-1.2, -1.4, (-0.3, -0.5, 1))):
    spike(0.34, 1.4, (x, y, surf(x, y) - 0.2), d)
for x in (-2.0, 2.0):
    canister(0.3, 1.3, (x, -2.4, surf(x, -2.4) + 0.45), (x * 0.1, 0, 1), 'gacid', bars=4, ribs=2)
    h = cyl(0.08, 1.4, (x * 0.6, -2.2, 1.6), 'dark', n=5); h.rotation_euler = Vector((-x * 0.4, -0.3, 0.5)).to_track_quat('Z', 'Y').to_euler()
crown(1.3, (cx, cy - 2.2, 8.55), normal=(0, -0.6, 0.8), up=(0, 0.8, 0.6), t=0.04)
chain((-1.4, -3.0, 2.6), (0, -3.6, 1.9), 0.08); chain((0, -3.6, 1.9), (1.4, -3.0, 0.5), 0.08)

# ---- detail pass 2: crimson crown banners strung between the shroom stems, goo drips under the caps, spore glow dots
banner(1.0, 1.4, (-1.4, -0.1, 4.2), (0, -1, 0), mark='crown')
for (x, y, z) in ((-0.8, -1.5, 7.6), (0.9, -1.2, 7.7), (-2.6, -0.4, 4.2), (2.5, -0.4, 4.9)):
    cyl(0.12, 0.6, (x, y, z), 'goo', n=6, r2=0.03)
    ball(0.1, (x, y, z - 0.35), 'gacid', 1)

# ---- detail pass 5 (silhouette): translucent spore haze puffs over the caps, tendrils dangling from the big cap rim
for (x, y, z, r) in ((cx + 1.5, cy - 1.0, 9.6, 0.9), (cx - 1.6, cy + 0.4, 9.4, 0.7), (cx + 0.2, cy + 1.6, 9.9, 0.6)):
    ball(r, (x, y, z), 'cacid', 1)
for a in range(0, 360, 45):
    r = math.radians(a); x, y = cx + math.cos(r) * 2.1, cy + math.sin(r) * 2.1
    cyl(0.07, 1.2, (x, y, 7.4), 'purple', n=5, r2=0.02)
    ball(0.09, (x, y, 6.8), 'gacid', 1)
print(ship('sb_hq', clip=True))

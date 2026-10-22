# Greys barracks: cloning lab -- squat dome with 3 glowing pods on the side. Origin ground centre, door faces +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
crown, banner = grey_style()   # Grey sheets: bone plate + UFO-beam brand
cyl(3.0, 0.5, (0, 0, 0.25), 'gunmetal', n=16, bevel=0.05)                 # plinth
cyl(2.8, 1.0, (0, 0, 1.0), 'pearl', n=16)                                  # drum
ball(2.8, (0, 0, 1.5), 'pearl', 2, (1, 1, 0.85))                           # squat dome (top ~3.9)
cyl(2.85, 0.25, (0, 0, 1.45), 'team', n=16)                                # crimson band
cyl(0.7, 0.4, (0, 0, 4.0), 'gunmetal', n=10)                               # vent cap
cyl(0.4, 0.15, (0, 0, 4.25), 'gcyan', n=10)
box((1.4, 0.4, 1.6), (0, -2.75, 1.3), 'gunmetal', bevel=0.1)              # door frame
box((1.0, 0.1, 1.3), (0, -2.97, 1.2), 'gcyan', bevel=0.0)                 # glowing door
# three clone pods on the +X side: capsule tubes with cyan fluid and a body shadow
for i, a in enumerate((-50, 0, 50)):
    r = math.radians(a)
    x, y = math.cos(r) * 3.0, math.sin(r) * 3.0
    x, y = x * 1.08, y * 1.08
    cyl(0.6, 0.3, (x, y, 0.15), 'gunmetal', n=10, bevel=0.04)             # pod base
    cyl(0.5, 2.6, (x, y, 1.6), 'ccyan', n=10)                              # translucent glass tube
    cyl(0.3, 2.3, (x, y, 1.55), 'gcyan', n=8)                              # glowing fluid core
    ball(0.5, (x, y, 2.9), 'gunmetal', 1, (1, 1, 0.6))                     # pod cap
    box((0.2, 0.9, 0.2), ((x + math.cos(r) * 2.5) / 2 + 0.6, y * 0.85, 2.7), 'gunmetal', rot=(0, 0, a), bevel=0.02)  # feed pipe

# ---- v2 detail pass: rust bolted patches, cables from the dome to each pod, antenna, crown tags, cyan vents
for a in (150, 210, 270):
    r = math.radians(a); x, y = math.cos(r) * 2.6, math.sin(r) * 2.6
    p = box((1.0, 0.08, 0.7), (x, y, 2.2), 'rust', bevel=0.02); p.rotation_euler = (0, 0, r + math.pi / 2); p.rotation_euler.rotate_axis('X', math.radians(-30))
    hexbolt(0.06, (x * 1.02, y * 1.02, 2.45), (math.cos(r), math.sin(r), 0.5))
cyl(0.05, 1.6, (-0.8, 0.8, 4.5), 'rust', n=5); ball(0.12, (-0.8, 0.8, 5.3), 'gcyan', 1)
for a in (90, 200):
    r = math.radians(a); crown(1.0, (math.cos(r) * 2.82, math.sin(r) * 2.82, 1.0), normal=(math.cos(r), math.sin(r), 0), up=(0, 0, 1), t=0.03)
crown(0.7, (0, -2.98, 2.35), normal=(0, -1, 0), up=(0, 0, 1), t=0.02)

# ---- detail pass 2: crimson crown banner by the door, panel lines on the dome drum, cyan status lights
banner(0.7, 1.0, (-1.2, -2.85, 2.3), (0, -1, 0), mark='crown')
for z in (0.7, 1.2): cyl(2.82, 0.03, (0, 0, z), 'dark', n=16)
for a in (100, 140, 180): r = math.radians(a); box((0.18, 0.06, 0.06), (math.cos(r) * 2.83, math.sin(r) * 2.83, 1.85), 'gcyan', rot=(0, 0, a + 90), bevel=0.0)

# ---- detail pass 6 (silhouette): a needle spire on the dome cap with a floating ring (echoes the probe tower)
cyl(0.18, 1.6, (0, 0, 5.0), 'pearl', n=8, r2=0.05)
torus(0.55, 0.1, (0, 0, 5.2), 'gunmetal', rot=(10, 0, 0), n=12, m=4)
ball(0.14, (0, 0, 5.85), 'gcyan', 1)
# ---- hex board (Colin, Oct 22): flat-top HEX pad under the building, rim lip + 6 corner nubs
hexplinth(3.4, 0.14, (0, 0, 0), 'gunmetal', bevel=0.04)  # HEX pad
hexplinth(3.4 + 0.06, 0.06, (0, 0, 0.1), 'brass', bevel=0.0)
for k in range(6):
    a = math.radians(60 * k); ball(3.4 * 0.06, (math.cos(a) * 3.4, math.sin(a) * 3.4, 0.16), 'gorange', 1)

# ---- GREY PASS: crimson plates with UFO marks on the drum, speckles, speaker discs, a neon tube rack by the door,
# brass rings round the pods, orange lens over the door
speckle((0, 0, 1.5), 2.8, 30, seed=42, scale=(1, 1, 0.85), zmin=2.0, size=0.07)
for a in (120, 240):
    r = math.radians(a); nx, ny = math.cos(r), math.sin(r)
    pl = box((1.1, 0.1, 0.6), (nx * 2.86, ny * 2.86, 0.95), 'team', bevel=0.03); pl.rotation_euler = (0, 0, r + math.pi / 2)
    ufomark(0.5, (nx * 2.92, ny * 2.92, 0.95), (nx, ny, 0), (0, 0, 1), 'ivory')
for s_ in (-1, 1): speaker(0.35, (s_ * 1.6, -2.3, 2.6), (s_ * 0.5, -1, 0.3), 'gorange')
neon_rack((-1.2, -2.9, 0.9), (0, 0, 1), 4, 0.07, 0.6)
for i, a in enumerate((-50, 0, 50)):
    r = math.radians(a); ring(0.55, 0.06, (math.cos(r) * 3.24, math.sin(r) * 3.24, 0.6), rot=(0, 0, 0))
ball(0.2, (0, -2.95, 2.3), 'gorange', 1)
print(ship('gb_barracks', clip=True))

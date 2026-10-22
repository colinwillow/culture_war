# Reptilian HQ: stepped stone temple, serpent-head gate, graffiti-tagged billboard on top.
# Origin ground centre, gate faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
for i, (w, h, z) in enumerate(((9.6, 1.4, 0), (7.6, 1.3, 1.4), (5.6, 1.2, 2.7))):
    box((w, w, h), (0, 0.2, z + h / 2), 'stone', bevel=0.12)                         # tiers
    box((w + 0.1, w + 0.1, 0.18), (0, 0.2, z + h - 0.05), 'moss', bevel=0.05)        # mossy lip
box((4.0, 4.0, 1.2), (0, 0.3, 4.5), 'stone', bevel=0.1)                              # shrine block
box((4.2, 4.2, 0.2), (0, 0.3, 5.15), 'bronze', bevel=0.05)
# front stair down the middle
for k in range(7):
    box((2.4, 0.6, 0.55 * (k + 1)), (0, -4.4 + k * 0.55, 0.275 * (k + 1)), 'stone', bevel=0.04)
# serpent-head gate at the stair foot: two fangs + upper jaw arch + eyes
box((3.6, 1.4, 1.0), (0, -4.6, 3.1), 'bronze', bevel=0.2)                              # upper head/jaw
box((3.2, 1.2, 0.6), (0, -4.75, 3.7), 'bronze', bevel=0.2, taper=(0.7, 0.8))            # brow/snout
for s in (-1, 1):
    box((0.8, 1.0, 2.6), (s * 1.55, -4.6, 1.3), 'bronze', bevel=0.12)                  # jaw pillars
    cyl(0.18, 0.8, (s * 0.8, -5.0, 2.25), 'bone', rot=(180, 0, 0), n=6, r2=0.0)      # fangs
    ball(0.3, (s * 0.95, -5.2, 3.8), 'gmagenta', 1)                               # glowing eyes
box((0.5, 0.6, 0.12), (0, -5.25, 3.5), 'iron', bevel=0.02)                            # nostrils
# crimson banners down the tier faces
for x in (-3.0, 3.0):
    box((1.0, 0.08, 2.2), (x, -4.53, 1.6), 'team', bevel=0.0)
box((1.4, 0.08, 1.4), (0, -1.73, 4.4), 'team', bevel=0.0)
# billboard on top: posts + panel with graffiti tags
for x in (-1.4, 1.4):
    box((0.18, 0.18, 1.6), (x, 0.9, 6.0), 'iron', bevel=0.0)
box((4.4, 0.2, 1.8), (0, 0.9, 7.1), 'white', bevel=0.04)                             # panel (top ~8 m)
box((3.9, 0.25, 0.12), (0, 0.9, 6.38), 'iron', bevel=0.0)
for (x, z, w, h, r, c) in ((-1.0, 7.4, 1.2, 0.35, 15, 'magenta'), (0.6, 7.0, 1.6, 0.3, -12, 'lime'),
                           (0.9, 7.6, 0.8, 0.25, 30, 'magenta'), (-0.8, 6.8, 0.9, 0.22, -25, 'lime'),
                           (-1.4, 7.0, 0.3, 0.8, 0, 'lime'), (1.5, 6.9, 0.3, 0.7, 10, 'magenta')):
    box((w, 0.06, h), (x, 0.78, z), c, rot=(0, r, 0), bevel=0.0)                     # tags
box((3.6, 0.15, 0.1), (0, 0.75, 7.95), 'glime', bevel=0.0)                           # lime strip light
# bronze bowls + vines
for x in (-2.6, 2.6):
    cyl(0.5, 0.5, (x, -2.6, 4.15), 'bronze', n=8, r2=0.3)
    ball(0.3, (x, -2.6, 4.45), 'glime', 1)

# ---- v2 detail pass (Reptilian street-temple): cone spikes on the tier corners + serpent brow, magenta canisters
# flanking the stair, white crown tags on the tiers, magenta cloth drapes, chains on the gate
for (w, z) in ((9.6, 1.4), (7.6, 2.7), (5.6, 3.9)):
    for x in (-1, 1):
        for y in (-1, 1):
            spike(0.2, 0.7, (x * (w / 2 - 0.25), 0.2 + y * (w / 2 - 0.25), z), (x * 0.25, y * 0.25, 1))
for x in (-0.9, 0.0, 0.9):
    spike(0.16, 0.6, (x, -4.9, 4.0), (0, -0.3, 1))
for x in (-2.2, 2.2):
    canister(0.3, 1.5, (x, -4.3, 1.55), (0, 0, 1), 'gmagenta', bars=4, ribs=2)
crown(1.4, (-3.0, -4.36, 0.75), normal=(0, -1, 0), up=(0, 0, 1), t=0.04)
crown(1.4, (3.0, -4.36, 0.75), normal=(0, -1, 0), up=(0, 0, 1), t=0.04)
crown(1.6, (0, -3.53, 3.35), normal=(0, -1, 0), up=(0, 0, 1), t=0.04)
for x in (-4.86, 4.86):
    box((0.08, 1.6, 1.2), (x, -1.0, 0.75), 'magenta', bevel=0.0)                        # cloth drapes on the sides
chain((-1.55, -5.1, 3.3), (0, -5.2, 2.7), 0.09); chain((0, -5.2, 2.7), (1.55, -5.1, 3.3), 0.09)

# ---- detail pass 2: long crimson crown banners down the shrine front, moss drips, panel lines on the billboard
for x in (-1.3, 1.3):
    banner(0.8, 1.6, (x, -1.75, 5.1), (0, -1, 0), mark='crown')
for x in (-4.0, -1.0, 2.5): box((0.3, 0.05, 0.5), (x, -4.53, 1.15), 'moss', bevel=0.0)
box((4.4, 0.03, 0.04), (0, 0.79, 7.1), 'dark', bevel=0.0)

# ---- detail pass 5 (silhouette): a stone serpent coiling up round the temple tiers, head rearing beside the billboard
pts = []
for i in range(26):
    t = i / 25; a = -math.pi * 0.75 + t * 2.3 * math.pi; z = 0.45 + t * 5.0
    hw = 4.8 if z < 1.4 else 3.8 if z < 2.7 else 2.8 if z < 3.9 else 2.1
    R = hw + 0.6                                                           # pass 6: pushed out so the coil reads
    cx_, cy_ = math.cos(a), math.sin(a)
    sq = lambda v: math.copysign(abs(v) ** 0.35, v)                     # squarish path hugging the tiers
    pts.append(Vector((sq(cx_) * R, 0.2 + sq(cy_) * R, z)))
for i in range(len(pts) - 1):
    a_, b_ = pts[i], pts[i + 1]; d = b_ - a_; r = 0.52 - i * 0.009
    seg = cyl(r, d.length + 0.15, tuple((a_ + b_) / 2), 'moss' if i % 2 else 'bronze', n=8); seg.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    if i % 3 == 0: spike(0.1, 0.35, tuple(a_ + Vector((0, 0, r * 0.8))), (0, 0, 1))
H = pts[-1]
box((0.9, 1.3, 0.6), tuple(H + Vector((0, 0, 0.4))), 'bronze', bevel=0.15, taper=(0.7, 0.8))
for s_ in (-1, 1):
    ball(0.13, tuple(H + Vector((s_ * 0.3, -0.5, 0.65))), 'gmagenta', 1)
    cyl(0.06, 0.35, tuple(H + Vector((s_ * 0.2, -0.6, 0.05))), 'bone', rot=(180, 0, 0), n=5, r2=0.0)
print(ship('rb_hq', clip=True))

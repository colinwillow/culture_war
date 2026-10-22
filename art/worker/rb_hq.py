# Reptilian HQ v3 (Colin's lizard-punk sheets, Oct 22): organic + spiky on a flat-top HEX plinth. A scaled dome mound
# with a giant crimson-rimmed frill crest, a horned spine ridge, a fanged mouth gate with glowing eyes, crimson crown
# rags, gold rings, skulls, chains, magenta lanterns. Origin ground centre, mouth gate faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
hexplinth(5.0, 0.5, (0, 0, 0), 'stone', bevel=0.1)
hexplinth(5.05, 0.12, (0, 0, 0.44), 'moss', bevel=0.03)
# the mound: three stacked squashed scaly domes + a cream belly band
ball(4.2, (0, 0.3, 0.5), 'scale', 2, (1.0, 0.95, 0.55))
ball(3.1, (0, 0.6, 2.3), 'scale2', 2, (1.0, 0.95, 0.62))
ball(2.0, (0, 0.8, 4.0), 'scale', 2, (1.0, 1.0, 0.75))
cyl(3.9, 0.35, (0, 0.3, 1.65), 'belly', n=6, r2=3.3)
spots((0, 0.3, 0.5), 4.2, 30, seed=3, size=0.32, zmin=0.9, scale=(1.0, 0.95, 0.55))
spots((0, 0.6, 2.3), 3.1, 16, seed=4, size=0.26, zmin=2.7, scale=(1.0, 0.95, 0.62))
spots((0, 0.8, 4.0), 2.0, 10, seed=5, size=0.2, zmin=4.3, scale=(1.0, 1.0, 0.75))
# giant frill crest behind the top, facing front
frill(3.2, (0, 1.6, 4.4), normal=(0, -1, 0.25), up=(0, 0.25, 1), spread=210, spines=9, t=0.12)
# horned spine ridge from the frill down the back
for i, (y, z) in enumerate(((1.9, 5.3), (2.6, 4.6), (3.2, 3.6), (3.7, 2.4), (4.0, 1.3))):
    horn(0.28 - i * 0.03, 1.3 - i * 0.12, (0, y, z), (0, 0.5, 1), (0, 1.2, 0), segs=3)
    ring(0.2 - i * 0.02, 0.04, (0, y + 0.05, z + 0.25), rot=(60, 0, 0))
# fanged mouth gate at the front: dark maw, upper/lower fangs, brow ridge with glowing eyes
ball(1.7, (0, -3.0, 1.3), 'dark', 2, (1.0, 0.45, 0.75))
ball(1.95, (0, -2.75, 2.4), 'scale', 2, (1.05, 0.6, 0.45))                                # brow ridge
for x in (-1.0, -0.4, 0.4, 1.0):
    horn(0.16, 0.8, (x, -3.55, 2.2), (0, -0.2, -1), (0, -0.4, 0), segs=2)                  # upper fangs
for x in (-0.7, 0.0, 0.7):
    horn(0.13, 0.6, (x, -3.55, 0.55), (0, -0.2, 1), (0, -0.3, 0), segs=2)                  # lower fangs
for s in (-1, 1):
    ball(0.32, (s * 1.0, -3.85, 2.75), 'gmagenta', 1, (1.2, 0.6, 0.7))                    # eyes
    horn(0.3, 1.8, (s * 1.4, -2.9, 3.0), (s * 0.6, -0.2, 1), (s * 0.6, 0.3, -0.3), segs=3)  # brow horns
crown(1.0, (0, -3.77, 3.25), normal=(0, -1, 0.3), up=(0, 0.3, 1), t=0.04)                  # crown tag on the brow
# crimson tattered rags with crowns + skulls + chains on the flanks
for s in (-1, 1):
    banner(1.1, 1.7, (s * 3.2, -2.35, 2.3), (s * 0.4, -1, 0), mark='crown')
    skull(0.35, (s * 3.75, -1.0, 1.35), (s * 0.7, -0.7, 0), 'ivory')
    chain((s * 2.6, -2.6, 2.4), (s * 3.6, -1.2, 1.7), 0.08)
    for k in range(3):
        a = math.radians(-150 + k * 25) if s < 0 else math.radians(-30 - k * 25)
        horn(0.22, 1.1, (math.cos(a) * 4.3, 0.3 + math.sin(a) * 4.0, 0.7), (math.cos(a) * 0.6, math.sin(a) * 0.6, 1), (0, 0, 0.3), segs=2)
# magenta canister lanterns on gold-ringed posts at the plinth corners (front two)
for x in (-3.3, 3.3):
    cyl(0.1, 2.2, (x, -3.6, 1.6), 'leather', n=5)
    canister(0.18, 0.6, (x, -3.6, 2.9), (0, 0, 1), 'gmagenta', bars=3, ribs=1)
    ring(0.14, 0.04, (x, -3.6, 1.2), rot=(0, 0, 0))
print(ship('rb_hq', clip=True))

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
print(ship('rb_hq'))

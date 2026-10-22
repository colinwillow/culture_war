# Reptilian tower v3: a tall twisting scaly spine-stalk on a HEX base (like a lizard tail standing up), banded with
# gold rings and crimson rags, spines all the way up, crowned by a big frill around a fanged lookout head with
# glowing magenta eyes. Origin ground centre, faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
from kit import _aim
reset()
hexplinth(1.25, 0.35, (0, 0, 0), 'stone', bevel=0.06)
pts = [Vector((math.sin(t * 2.2) * 0.25, math.cos(t * 2.2) * 0.2, 0.3 + t * 6.0)) for t in [i / 7 for i in range(8)]]
for i in range(7):
    a_, b_ = pts[i], pts[i + 1]; d = b_ - a_; r0 = 0.62 - i * 0.045
    seg = cyl(r0, d.length + 0.12, tuple((a_ + b_) / 2), 'scale' if i % 2 == 0 else 'spot', n=8, r2=r0 - 0.045)
    _aim(seg, d)
    b = cyl(r0 * 0.75, d.length * 0.9, tuple((a_ + b_) / 2 + Vector((0, -r0 * 0.3, 0))), 'belly', n=6, r2=(r0 - 0.045) * 0.75); _aim(b, d)
    horn(0.13, 0.75 - i * 0.04, tuple(a_ + Vector((0, r0 * 0.8, 0.2))), (0, 1, 0.6), (0, 0, 0.5), segs=2)        # back spines
    for s in (-1, 1):
        if i % 2: horn(0.1, 0.5, tuple(a_ + Vector((s * r0 * 0.85, 0, 0.3))), (s, 0.1, 0.5), (0, 0, 0.4), segs=2)
    if i in (1, 4): ring(r0 * 1.02, 0.06, tuple(a_ + Vector((0, 0, 0.35))), rot=(0, 0, 0))
cyl(0.5, 0.35, tuple(pts[3] + Vector((0, 0, 0.1))), 'team', n=8)                 # crimson rag wrap
banner(0.5, 0.9, tuple(pts[3] + Vector((0, -0.45, 0.2))), (0, -1, 0), mark='crown')
# lookout head on top: fanged lizard skull-head platform with a big frill behind
T = pts[-1] + Vector((0, 0, 0.3))
ball(0.95, tuple(T), 'scale', 2, (1.0, 1.15, 0.6))
box((1.0, 0.9, 0.45), tuple(T + Vector((0, -0.9, -0.1))), 'scale', bevel=0.15, taper=(0.7, 0.8))          # snout
for s in (-1, 1):
    ball(0.17, tuple(T + Vector((s * 0.42, -0.85, 0.25))), 'gmagenta', 1)
    horn(0.16, 1.0, tuple(T + Vector((s * 0.55, 0.0, 0.35))), (s * 0.5, 0.2, 1), (s * 0.4, 0.4, 0), segs=3)
for x in (-0.3, 0.0, 0.3): horn(0.06, 0.3, tuple(T + Vector((x, -1.25, -0.25))), (0, -0.2, -1), segs=2)
frill(1.2, tuple(T + Vector((0, 0.5, 0.0))), normal=(0, -1, 0.2), up=(0, 0.2, 1), spread=230, spines=9, t=0.06)
crown(0.5, tuple(T + Vector((0, -0.65, 0.48))), normal=(0, -0.3, 1), up=(0, 1, 0.3), t=0.02)
print(ship('rb_tower', clip=True))

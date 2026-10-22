# Reptilian depot v3: a street-market nest on a HEX plinth -- a squat scaly egg-dome hut with a frill awning over the
# counter, crimson crown rag curtains, stacked crates + baskets, gold rings + chains, magenta lanterns on horn posts.
# Origin ground centre, counter faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
hexplinth(2.5, 0.25, (0, 0, 0), 'stone', bevel=0.06)
ball(1.9, (0, 0.4, 0.25), 'scale2', 2, (1.0, 0.9, 1.05))                         # egg-dome hut
spots((0, 0.4, 0.25), 1.9, 14, seed=11, size=0.18, zmin=0.6, scale=(1.0, 0.9, 1.05))
cyl(1.85, 0.3, (0, 0.4, 0.4), 'belly', n=10)                                      # belly band
ball(0.9, (0, -1.15, 1.0), 'dark', 1, (1.1, 0.4, 0.9))                            # dark doorway
box((2.6, 0.7, 0.9), (0, -1.75, 0.7), 'leather', bevel=0.08)                       # counter
for x in (-0.9, -0.3, 0.3, 0.9): ball(0.06, (x, -2.11, 1.0), 'gold', 1)             # studs
frill(1.6, (0, -1.3, 2.1), normal=(0, -0.6, 0.8), up=(0, 0.8, 0.6), spread=170, spines=7, t=0.06)   # frill awning
for s in (-1, 1):
    banner(0.55, 0.9, (s * 0.65, -1.55, 1.9), (0, -1, 0), mark='crown')           # rag curtains
    horn(0.14, 2.4, (s * 1.6, -1.6, 0.25), (0, 0, 1), (s * 0.2, -0.3, 0), segs=3)  # horn posts
    canister(0.12, 0.4, (s * 1.65, -1.9, 2.0), (0, 0, 1), 'gorange', bars=3, ribs=1)
    chain((s * 1.6, -1.7, 2.3), (s * 1.62, -1.85, 2.2), 0.04)
horn(0.25, 1.4, (0, 0.6, 2.0), (0, 0.3, 1), (0, 0.6, 0), segs=3)                  # crest horn on the dome
for k in range(4): horn(0.12, 0.7, (math.cos(math.radians(30 + 40 * k)) * 1.3, 0.4 + math.sin(math.radians(30 + 40 * k)) * 1.2, 1.8), (math.cos(math.radians(30 + 40 * k)), math.sin(math.radians(30 + 40 * k)), 0.8), segs=2)
# goods
for (x, y, z, sz, c) in ((1.6, 1.0, 0.25, 0.6, 'wood'), (1.6, 1.0, 0.85, 0.45, 'leather'), (-1.5, 1.1, 0.25, 0.65, 'wood'),
                         (-1.0, -1.6, 1.15, 0.35, 'leather'), (0.7, -1.6, 1.15, 0.3, 'wood')):
    box((sz, sz, sz), (x, y, z + sz / 2), c, bevel=0.04); box((sz + 0.02, 0.06, sz + 0.02), (x, y, z + sz / 2), 'iron', bevel=0.0)
cyl(0.28, 0.3, (0.0, -1.65, 1.3), 'lime', n=8, r2=0.33)
ring(0.3, 0.05, (1.6, 1.0, 1.4), rot=(0, 0, 0))

# ---- REPTILIAN PASS 2: dark crown plate on the counter, a skull on the dome crest, glow-slot plate on the hut
crownplate(0.45, (0, -2.12, 0.75), (0, -1, 0), (0, 0, 1))
skull(0.2, (0, 0.2, 2.1), (0, -1, 0.3), 'plate')
glowslots(0.6, 0.4, (1.25, -0.6, 1.0), (0.7, -0.7, 0), 2)
print(ship('rb_depot', clip=True))

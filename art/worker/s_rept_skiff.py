# Reptilian skiff v3 (lizard-punk sheets): an organic flying lizard -- a scaly teal hull shaped like a flattened lizard
# body with a frill crest behind a glass canopy "head", a spined tail fin, swept membrane wings with crimson rims and
# ivory/orange spines, magenta engine canisters, gold rings, a crimson crown rag. Belly at y 0, nose +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
ball(1.0, (0, 0.2, 0.75), 'scale', 2, (1.1, 2.7, 0.62))                           # body
ball(0.7, (0, 0.2, 0.55), 'belly', 2, (1.1, 2.5, 0.45))                           # belly
ball(0.62, (0, -2.6, 0.85), 'scale', 2, (0.9, 1.3, 0.62))                         # head
ball(0.42, (0, -2.65, 1.12), 'cglass', 2, (0.9, 1.4, 0.6))                        # glass canopy
for s in (-1, 1):
    ball(0.13, (s * 0.42, -3.15, 0.95), 'gorange', 1)                            # eyes/headlights
    horn(0.12, 0.7, (s * 0.35, -2.3, 1.15), (s * 0.4, 0.6, 0.6), (0, 0.6, -0.2), segs=2)
for x in (-0.18, 0.18): horn(0.06, 0.25, (x, -3.25, 0.62), (0, -0.2, -1), segs=2)   # fangs
spots((0, 0.2, 0.75), 1.0, 18, seed=31, size=0.09, zmin=0.9, scale=(1.1, 2.7, 0.62))
frill(0.9, (0, -1.8, 1.15), normal=(0, -1, 0.35), up=(0, 0.35, 1), spread=200, spines=7, t=0.05)
for i, y in enumerate((-0.9, -0.2, 0.5, 1.2, 1.9)):
    horn(0.11 - i * 0.01, 0.55 - i * 0.05, (0, y, 1.3 - i * 0.07), (0, 0.4, 1), (0, 0.5, 0), segs=2)   # dorsal spines
# tail
for i in range(4):
    y = 2.8 + i * 0.35; r = 0.32 - i * 0.07
    ball(r, (0, y, 0.7 + i * 0.08), 'scale' if i % 2 == 0 else 'spot', 1, (1, 1.3, 1))
horn(0.1, 0.7, (0, 3.6, 1.0), (0, 0.6, 0.8), segs=2)
# membrane wings: webbing wedges between spines, crimson rims
for s in (-1, 1):
    frill(1.6, (s * 0.85, 0.3, 0.85), normal=(0, 0, 1), up=(s, 0.35, 0), spread=110, spines=5, t=0.05)
    canister(0.2, 0.8, (s * 0.65, 2.3, 0.6), (0, 1, 0), 'gorange', bars=3, ribs=1)
    ring(0.2, 0.045, (s * 0.65, 1.85, 0.6), rot=(90, 0, 0))
banner(0.4, 0.45, (0.5, 1.0, 1.0), (1, 0, 0), mark='crown')

# ---- REPTILIAN PASS 2: goggle-lens headlights, a dark crown plate on the nose, glow slots on the flanks, a skull
for s in (-1, 1): speaker(0.15, (s * 0.3, -3.1, 1.15), (0, -1, 0.3), 'gorange')
crownplate(0.35, (0, -3.0, 1.25), (0, -0.6, 0.8), (0, 0.8, 0.6))
for s in (-1, 1): glowslots(0.6, 0.3, (s * 1.0, 0.6, 0.85), (s, 0, 0), 2)
for o in bpy.context.scene.objects: o.location.z -= 0.13   # belly on y 0
print(ship('s_rept_skiff', clip=True))

# Reptilian wall v3, BREAKABLE: a scaly organic ridge (like a lizard's back lying along X) with a row of big ivory/orange
# dorsal spines, a cream belly band, blue spots, a crimson crown rag and gold rings. Origin ground centre, face +Z.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
for i, x in enumerate((-0.75, 0.0, 0.75)):
    ball(0.62, (x, 0, 0.45), 'scale' if i != 1 else 'scale2', 2, (0.75, 0.62, 0.95))   # humps
ball(1.15, (0, 0, 0.0), 'scale', 2, (0.98, 0.38, 0.55))                               # long base ridge
box((2.15, 0.06, 0.18), (0, -0.33, 0.28), 'belly', bevel=0.03)                        # belly band, front
spots((0, 0, 0.45), 1.0, 12, seed=21, size=0.1, zmin=0.35, scale=(1.05, 0.42, 0.95))
for i, x in enumerate((-0.85, -0.42, 0.0, 0.42, 0.85)):
    horn(0.13 if i % 2 else 0.17, 0.55 if i % 2 else 0.8, (x, 0, 0.95), (x * 0.15, 0, 1), (0, 0.15, 0.0), segs=2)
banner(0.4, 0.5, (0.42, -0.34, 0.85), (0, -1, 0), mark='crown')
ring(0.14, 0.035, (-0.6, -0.3, 0.55), rot=(90, 0, 0))
ring(0.12, 0.03, (0.75, 0.3, 0.6), rot=(90, 0, 0))
print(ship('rb_wall', clip=True, chunk_cuts={'x': [-0.4, 0.38], 'z': [0.62]}))

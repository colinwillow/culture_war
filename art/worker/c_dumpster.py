# dumpster: olive steel bin, sloped lid, side pockets, casters. Origin ground centre, front +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
city_style()   # Colin's key-art palette
G = 'olive'
box((1.9, 1.05, 1.1), (0, 0.02, 0.7), G, bevel=0.05, taper=(1.0, 1.12))   # bin, flares toward the top
box((1.96, 0.62, 0.08), (0, -0.22, 1.33), 'iron', rot=(-8, 0, 0), bevel=0.02)  # front lid
box((1.96, 0.62, 0.08), (0, 0.38, 1.29), 'iron', rot=(-8, 0, 0), bevel=0.02)   # rear lid
box((1.98, 1.2, 0.1), (0, 0.04, 1.22), G, bevel=0.03)                       # top rim
for x in (-1, 1):
    box((0.1, 0.5, 0.3), (x * 0.98, 0, 0.9), 'iron', bevel=0.02)          # fork pockets
box((1.6, 0.04, 0.14), (0, -0.56, 0.95), 'orange', bevel=0.0)              # hazard band
box((0.5, 0.04, 0.3), (0.5, -0.55, 0.6), 'steel', bevel=0.0)               # dent patch plate
for x in (-0.75, 0.75):
    for y in (-0.38, 0.38):
        box((0.1, 0.1, 0.1), (x, y, 0.13), 'iron', bevel=0.02)
        cyl(0.07, 0.07, (x, y, 0.07), 'tire', (0, 90, 0), n=8)              # casters

# ---- v2 detail pass: crown graffiti, rust streaks, a lid propped open with junk spilling, bolts, a chain lock
crown(0.7, (-0.45, -0.575, 0.65), normal=(0, -1, 0.06), up=(0, 0, 1), t=0.015)
for x in (-0.9, 0.2): box((0.12, 0.03, 0.6), (x, -0.57, 0.55), 'rust', bevel=0.0)
box((0.6, 0.4, 0.3), (0.5, 0.35, 1.45), 'wood', rot=(10, 20, 30), bevel=0.03)
box((0.4, 0.3, 0.3), (-0.4, 0.4, 1.42), 'orange', rot=(-10, 5, -20), bevel=0.03)
for x in (-0.85, 0.85):
    for z in (0.5, 1.0): hexbolt(0.03, (x, -0.57, z), (0, -1, 0), 'ivory')
chain((0.8, -0.6, 1.25), (0.95, -0.62, 0.95), 0.03)

# ---- detail pass 2: hazard stripes on the corners, panel lines
for x in (-0.95, 0.95): 
    for k in range(3): box((0.08, 0.03, 0.15), (x, -0.58, 0.4 + k * 0.3), 'orange' if k % 2 == 0 else 'dark', bevel=0.0)
for x in (-0.3, 0.3): box((0.02, 0.03, 0.9), (x, -0.57, 0.7), 'dark', bevel=0.0)
print(ship('c_dumpster'))

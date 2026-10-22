# fire hydrant (hazard orange -- never red, red is the team key). Origin at the base centre on the ground.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
city_style()   # Colin's key-art palette
O = 'orange'
cyl(0.2, 0.08, (0, 0, 0.04), 'iron', n=8, bevel=0.015)                      # flange
for a in range(0, 360, 60):
    r = math.radians(a + 22)
    cyl(0.018, 0.03, (0.16 * math.cos(r), 0.16 * math.sin(r), 0.09), 'steel', n=6)   # flange bolts
cyl(0.13, 0.5, (0, 0, 0.33), O, n=8, bevel=0.02)                           # barrel
cyl(0.16, 0.06, (0, 0, 0.57), O, n=8, bevel=0.015)                         # top ring
cyl(0.14, 0.14, (0, 0, 0.66), O, n=8, r2=0.06, bevel=0.0)                  # dome
cyl(0.035, 0.06, (0, 0, 0.75), 'steel', n=5)                                # top nut
for x in (-1, 1):
    cyl(0.06, 0.12, (x * 0.15, 0, 0.42), O, (0, 90, 0), n=8, bevel=0.01)   # side outlets
    cyl(0.065, 0.03, (x * 0.205, 0, 0.42), 'steel', (0, 90, 0), n=6)       # caps
cyl(0.08, 0.1, (0, -0.15, 0.36), O, (90, 0, 0), n=8, bevel=0.01)           # front outlet
cyl(0.085, 0.04, (0, -0.2, 0.36), 'steel', (90, 0, 0), n=6)
cyl(0.14, 0.05, (0, 0, 0.25), 'bone', n=8)                  # white band

# ---- v2 detail pass: chain on the front cap, crown tag, bolts on the barrel, rust drips
chain((0.0, -0.25, 0.36), (0.12, -0.15, 0.2), 0.02)
crown(0.12, (0, -0.135, 0.33), normal=(0, -1, 0), up=(0, 0, 1), t=0.006, col='dark')
for a in (45, 135, 225, 315):
    r = math.radians(a); hexbolt(0.02, (math.cos(r) * 0.135, math.sin(r) * 0.135, 0.5), (math.cos(r), math.sin(r), 0))
box((0.03, 0.02, 0.15), (0.1, -0.1, 0.45), 'rust', bevel=0.0)

# ---- detail pass 2: hazard-white reflective band on the top, panel line, a small puddle disc
cyl(0.162, 0.03, (0, 0, 0.6), 'white', n=8)
cyl(0.19, 0.01, (0.0, 0.0, 0.085), 'blue', n=8)
print(ship('c_hydrant'))

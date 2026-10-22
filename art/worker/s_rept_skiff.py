# Reptilian skiff: cloaked drop skiff -- sleek wedge with fins and a belly hatch, magenta glow.
# Bottom at y 0, origin under the centre, nose +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
box((3.2, 0.9, 6.6), (0, 0, 0.75), 'moss', rot=(90, 0, 0), bevel=0.08, taper=(0.12, 0.45))     # hull wedge (nose -> +Z)
box((2.2, 0.5, 4.2), (0, 0.6, 1.3), 'bronze', rot=(90, 0, 0), bevel=0.06, taper=(0.2, 0.5))   # dorsal spine plate
box((1.0, 0.35, 1.6), (0, -0.9, 1.25), 'cglass', rot=(90, 0, 0), bevel=0.05, taper=(0.4, 0.6))  # canopy
for s in (-1, 1):
    w = box((1.2, 0.12, 2.4), (s * 1.45, 1.3, 0.75), 'moss', bevel=0.03, taper=(0.3, 1.0))        # swept side fins
    w.rotation_euler = (math.radians(90), math.radians(s * 12), 0)
    box((0.08, 1.2, 0.5), (s * 1.82, 1.8, 0.85), 'team', bevel=0.0)                               # crimson fin tips
    f = box((0.12, 1.0, 1.0), (s * 0.6, 2.6, 1.6), 'bronze', rot=(0, s * 18, 0), bevel=0.02, taper=(1, 0.4))  # tail fins
    box((0.1, 2.6, 0.08), (s * 1.0, 0.6, 1.12), 'gmagenta', rot=(0, 0, s * 6), bevel=0.0)        # magenta glow lines
for x in (-0.6, 0.6):
    cyl(0.3, 0.3, (x, 3.3, 0.75), 'gmagenta', rot=(90, 0, 0), n=8)                               # engine glows
    cyl(0.4, 0.4, (x, 3.1, 0.75), 'iron', rot=(90, 0, 0), n=8)
box((1.2, 1.6, 0.06), (0, 0.6, 0.29), 'iron', bevel=0.0)                                         # belly hatch
box((1.0, 1.4, 0.06), (0, 0.6, 0.26), 'gmagenta', bevel=0.0)                                     # glowing seam inside

# ---- v2 detail pass: magenta engine canisters, cone spikes on the nose + fin roots, a crown tag on the spine, chains
for x in (-0.6, 0.6):
    canister(0.22, 0.9, (x, 2.8, 0.52), (0, 1, 0), 'gmagenta', bars=3, ribs=1)
spike(0.12, 0.5, (0, -3.1, 0.55), (0, -1, 0.1))
for s in (-1, 1):
    spike(0.08, 0.35, (s * 0.9, 0.2, 0.9), (s * 0.5, 0.2, 1))
crown(0.7, (0, 0.6, 1.5), normal=(0, 0.25, 1), up=(0, -1, 0), t=0.02)
chain((1.5, 1.6, 0.6), (1.55, 1.7, 0.3), 0.04)

# ---- detail pass 2: crimson crown pennant off a tail fin, panel lines on the hull, a lime/magenta graffiti streak
banner(0.3, 0.45, (0.6, 3.0, 1.75), (1, 0, 0), mark='crown')
for y in (-1.5, 0.5): box((2.4, 0.03, 0.03), (0, y, 1.08), 'dark', bevel=0.0)
box((0.05, 1.4, 0.1), (1.35, 0.4, 0.75), 'lime', rot=(8, 0, 0), bevel=0.0)
for o in bpy.context.scene.objects: o.location.z -= 0.23   # belly on y 0
print(ship('s_rept_skiff'))

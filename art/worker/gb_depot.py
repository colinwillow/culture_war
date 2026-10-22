# Greys depot: abduction beam dish -- tall dish on a mast pointing up, cyan glow cup. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
crown, banner = grey_style()   # Grey sheets: bone plate + UFO-beam brand
cyl(1.9, 0.4, (0, 0, 0.2), 'gunmetal', n=12, bevel=0.05)                   # base
cyl(1.5, 0.3, (0, 0, 0.55), 'pearl', n=12, bevel=0.04)
box((1.2, 0.08, 0.3), (0, -1.53, 0.55), 'team', bevel=0.0)                   # crimson base plates
box((1.2, 0.08, 0.3), (0, 1.53, 0.55), 'team', bevel=0.0)
cyl(0.35, 4.0, (0, 0, 2.7), 'pearl', n=10)                                    # mast
for z in (1.6, 3.0, 4.2):
    cyl(0.45, 0.15, (0, 0, z), 'gunmetal', n=10)
for i in range(3):                                                            # struts
    a = 2 * math.pi * i / 3
    st = box((0.18, 0.18, 2.4), (math.cos(a) * 0.8, math.sin(a) * 0.8, 1.6), 'gunmetal', bevel=0.02)
    st.rotation_euler = (0, 0, a); st.rotation_euler.rotate_axis('Y', math.radians(-20))
cyl(0.6, 0.4, (0, 0, 4.85), 'gunmetal', n=10)                                 # dish hub
cyl(0.6, 1.4, (0, 0, 5.7), 'pearl', n=16, r2=2.0)                             # dish (cone opening up)
cyl(1.75, 0.06, (0, 0, 6.43), 'gcyan', n=16)                           # glowing inner face
cyl(0.25, 0.6, (0, 0, 6.7), 'gunmetal', n=8)                                  # emitter post
ball(0.55, (0, 0, 7.0), 'gcyan', 2)                                           # glow cup

# ---- v2 detail pass: rust struts + bolts, cyan canisters round the base, cable up the mast, crown tag, antenna spikes
for a in (30, 150, 270):
    r = math.radians(a)
    canister(0.18, 0.8, (math.cos(r) * 1.55, math.sin(r) * 1.55, 0.95), (0, 0, 1), 'gcyan', bars=3, ribs=1)
cyl(0.06, 4.0, (0.42, 0, 2.7), 'dark', n=5)
for z in (2.0, 3.5): box((0.2, 0.2, 0.2), (0.4, 0, z), 'rust', bevel=0.02)
crown(0.9, (0, -1.53, 0.95), normal=(0, -1, 0), up=(0, 0, 1), t=0.02)
for a in (0, 120, 240):
    r = math.radians(a); cyl(0.04, 0.8, (math.cos(r) * 1.9, math.sin(r) * 1.9, 6.75), 'rust', n=4, r2=0.0)
    hexbolt(0.07, (math.cos(r) * 1.8, math.sin(r) * 1.8, 6.38), (0, 0, 1))

# ---- detail pass 2: crimson crown pennant on the mast, panel line on the dish, hazard ring on the base
banner(0.5, 0.8, (0, -0.4, 4.0), (0, -1, 0), mark='crown')
cyl(1.3, 0.03, (0, 0, 5.9), 'dark', n=16)
for a in range(0, 360, 30): r = math.radians(a); box((0.3, 0.1, 0.06), (math.cos(r) * 1.8, math.sin(r) * 1.8, 0.41), 'orange' if a % 60 else 'dark', rot=(0, 0, a + 90), bevel=0.0)
# ---- hex board (Colin, Oct 22): flat-top HEX pad under the building, rim lip + 6 corner nubs
hexplinth(2.1, 0.14, (0, 0, 0), 'gunmetal', bevel=0.04)  # HEX pad
hexplinth(2.1 + 0.06, 0.06, (0, 0, 0.1), 'brass', bevel=0.0)
for k in range(6):
    a = math.radians(60 * k); ball(2.1 * 0.06, (math.cos(a) * 2.1, math.sin(a) * 2.1, 0.16), 'gorange', 1)

# ---- GREY PASS: crimson plate with the UFO mark on the base, brass collars on the mast, speaker disc, speckles on the dish,
# a neon rack replacing one canister, orange lens on the emitter
for a in (90, 270):
    r = math.radians(a); nx, ny = math.cos(r), math.sin(r)
    ufomark(0.6, (nx * 1.58, ny * 1.58, 0.75), (nx, ny, 0), (0, 0, 1), 'ivory')
for z in (1.2, 3.8): ring(0.42, 0.06, (0, 0, z), rot=(0, 0, 0))
speaker(0.35, (0.0, -0.45, 3.0), (0, -1, 0), 'gorange')
speckle((0, 0, 5.7), 1.6, 18, seed=43, scale=(1, 1, 0.5), zmin=5.8, size=0.06)
neon_rack((1.4, -1.0, 0.95), (0, 0, 1), 3, 0.07, 0.6)
print(ship('gb_depot'))

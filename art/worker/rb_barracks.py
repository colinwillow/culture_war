# Reptilian barracks v3 (lizard-punk sheets): a sunken fight pit inside a flat-top HEX rim of scaly stone, ringed with
# big curved ivory/orange horns leaning in, crimson crown rags tied on, frill-crested gate posts, skulls, chains.
# Origin ground centre, entrance gap faces +Z (Blender -Y).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
R = 3.4
cyl(R - 0.6, 0.1, (0, 0, 0.05), 'fungus', rot=(0, 0, 30), n=6)                          # sand floor (hex)
cyl(1.0, 0.03, (0.3, 0.2, 0.11), 'rust', n=8)                                            # stain
verts = [(math.cos(math.radians(60 * k)) * R, math.sin(math.radians(60 * k)) * R) for k in range(6)]
for k in range(6):
    (x0, y0), (x1, y1) = verts[k], verts[(k + 1) % 6]
    mx, my = (x0 + x1) / 2, (y0 + y1) / 2
    if k == 4:                                                                           # gap at the front (-Y edge)
        for s in (-1, 1):
            px, py = mx + s * 1.25, my
            box((1.0, 0.9, 1.0), (px, py, 0.5), 'stone', bevel=0.1)
        continue
    seg = box((R * 1.02, 0.9, 1.0), (mx, my, 0.5), 'scale', bevel=0.12)
    seg.rotation_euler = (0, 0, math.atan2(y1 - y0, x1 - x0))
    m = box((R * 1.04, 0.95, 0.14), (mx, my, 1.02), 'moss', bevel=0.04); m.rotation_euler = seg.rotation_euler
    spots((mx, my, 0.5), 0.55, 3, seed=k, size=0.12, zmin=0.4)
for k in range(6):                                                                       # big horns at the vertices, leaning in
    x, y = verts[k]
    if k in (4, 5): pass
    horn(0.42, 2.7, (x * 0.97, y * 0.97, 0.9), (-x * 0.08, -y * 0.08, 1), (-x * 0.35, -y * 0.35, 0), segs=3)
    ring(0.24, 0.05, (x * 0.96, y * 0.96, 1.3), rot=(0, 0, 0))
for k in (0, 1, 2, 3, 5):                                                                # smaller horns mid-edge
    (x0, y0), (x1, y1) = verts[k], verts[(k + 1) % 6]; mx, my = (x0 + x1) / 2 * 0.95, (y0 + y1) / 2 * 0.95
    horn(0.26, 1.6, (mx, my, 1.0), (-mx * 0.05, -my * 0.05, 1), (-mx * 0.25, -my * 0.25, 0), segs=2)
# crimson crown rags tied round two horns, a skull on another
for k in (1, 3):
    x, y = verts[k]; cyl(0.36, 0.4, (x * 0.94, y * 0.94, 1.6), 'team', n=6)
    banner(0.5, 0.6, (x * 1.0, y * 1.0, 1.75), (x, y, 0), mark='crown')
x, y = verts[2]; skull(0.28, (x * 0.88, y * 0.88, 1.9), (-x, -y, 0), 'ivory')
# frill-crested gate posts at the entrance
for s in (-1, 1):
    gx, gy = s * 1.25, -R * 0.87
    cyl(0.25, 1.8, (gx, gy - 0.1, 0.9), 'scale', n=6)
    frill(0.8, (gx, gy - 0.1, 1.8), normal=(0, -1, 0), up=(0, 0, 1), spread=180, spines=5, t=0.05)
    canister(0.12, 0.45, (gx, gy - 0.45, 1.1), (0, 0, 1), 'gorange', bars=3, ribs=1)
chain((-1.0, -R * 0.87 - 0.2, 1.7), (0, -R * 0.87 - 0.25, 1.35), 0.06); chain((0, -R * 0.87 - 0.25, 1.35), (1.0, -R * 0.87 - 0.2, 1.7), 0.06)

# ---- REPTILIAN PASS 2: dark crown plates on two rim blocks, glow-slot plates on the gate posts
for k in (0, 2):
    (x0, y0), (x1, y1) = verts[k], verts[(k + 1) % 6]; mx, my = (x0 + x1) / 2, (y0 + y1) / 2; d = Vector((mx, my, 0)).normalized()
    crownplate(0.6, (mx + d.x * 0.47, my + d.y * 0.47, 0.5), tuple(d), (0, 0, 1))
for s in (-1, 1): glowslots(0.4, 0.5, (s * 1.25, -R * 0.87 - 0.36, 0.6), (0, -1, 0), 1)
print(ship('rb_barracks', clip=True))

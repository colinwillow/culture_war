# Batch 10: RTS ground clutter for the Northgard / AoE-Mobile look (seen from ~70 m up, telephoto): chunky faceted
# shapes, soft painterly colours, flat bottoms at y 0. One GLB per variant so the game can instance each.
import sys, os, random; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
from kit import _aim
city_style()
out = {}

def go(name, build, clip=True):
    reset(); city_style(); build(); out[name] = ship(name, clip=clip)

# ---- rocks: 1, 2, 3 m, mossy tops
def rock(size, seed):
    def b():
        rnd = random.Random(seed)
        o = lump(size * 0.5, (0, 0, size * 0.18), 'rockg', seed, 2, 0.22, (1.0, 0.85, 0.62)); paint_up(o, 'mossg', 0.6, 'rockd')
        for k in range(2):
            a = rnd.uniform(0, 6.28); d = size * 0.38
            o = lump(size * 0.24, (math.cos(a) * d, math.sin(a) * d, size * 0.05), 'rockd', seed + k + 1, 1, 0.2, (1, 0.9, 0.7))
            paint_up(o, 'mossg', 0.7)
    return b
for nm, s, sd in (('e_rock_a', 1.0, 1), ('e_rock_b', 2.0, 2), ('e_rock_c', 3.0, 3)): go(nm, rock(s, sd))

# ---- bushes: 1 and 1.5 m with flower dots
def bush(size, seed, flower):
    def b():
        rnd = random.Random(seed)
        lump(size * 0.42, (0, 0, size * 0.38), 'leafb', seed, 2, 0.15, (1, 1, 0.85))
        for k in range(3):
            a = 2.1 * k + rnd.uniform(0, 1); d = size * 0.3
            lump(size * 0.28, (math.cos(a) * d, math.sin(a) * d, size * 0.25), 'leaf2' if k % 2 else 'leaf', seed + k, 1, 0.15)
        for k in range(7):
            a = rnd.uniform(0, 6.28); e = rnd.uniform(0.2, 1.2)
            p = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e))) * size * 0.44
            ball(size * 0.05, (p.x, p.y, size * 0.38 + p.z * 0.85), flower, 1)
    return b
go('e_bush_a', bush(1.0, 11, 'flower')); go('e_bush_b', bush(1.5, 12, 'yellow'))

# ---- grass tuft: 6 crossed blades, < 60 tris, no bevel
def tuft():
    import bmesh as bm_
    rnd = random.Random(5)
    me = bpy.data.meshes.new('t'); bm = bm_.new()
    for k in range(7):
        a = rnd.uniform(0, 6.28); lean = rnd.uniform(0.1, 0.3); h = rnd.uniform(0.35, 0.5); w = 0.07
        d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0))
        base = d * rnd.uniform(0, 0.12)
        for flip in (False, True):                                                   # two-sided (separate verts)
            v1 = bm.verts.new(base - side * w); v2 = bm.verts.new(base + side * w)
            v3 = bm.verts.new(base + d * lean * h + Vector((0, 0, h)))
            bm.faces.new((v3, v2, v1) if flip else (v1, v2, v3))
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('t', me); bpy.context.scene.collection.objects.link(ob)
    a = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    for p in me.polygons:
        for li in p.loop_indices:
            z = me.vertices[me.loops[li].vertex_index].co.z
            c = PAL['grass2'] if z < 0.05 else PAL['grass']
            a.data[li].color = c
    ob['mat'] = 'kit'
go('e_grass_tuft', tuft, clip=False)

# ---- trees: round broadleaf, tall pine, palm (5-8 m, chunky trunks)
def broadleaf():
    cyl(0.45, 0.5, (0, 0, 0.25), 'bark', n=6, r2=0.32)
    cyl(0.32, 3.0, (0, 0, 1.75), 'bark', n=6, r2=0.24)
    lump(1.9, (0, 0, 4.4), 'leafb', 21, 2, 0.16, (1, 1, 0.82))
    lump(1.2, (1.1, -0.4, 3.8), 'leaf', 22, 1, 0.15); lump(1.1, (-1.0, 0.5, 4.0), 'leaf2', 23, 1, 0.15)
    lump(1.0, (0.2, 0.2, 5.6), 'leaf2', 24, 1, 0.15)
def pinetree():
    cyl(0.4, 0.4, (0, 0, 0.2), 'bark', n=6, r2=0.3)
    cyl(0.28, 2.0, (0, 0, 1.2), 'bark', n=6, r2=0.22)
    for i, (r, z, h) in enumerate(((2.0, 1.9, 2.4), (1.6, 3.4, 2.2), (1.15, 4.8, 2.0), (0.7, 6.1, 1.9))):
        cyl(r, h, (0, 0, z + h / 2), 'pine' if i % 2 == 0 else 'leaf', n=7, r2=r * 0.15)
def palmtree():
    # chunky curved trunk of stacked rings, big drooping fronds, coconuts
    pts = [Vector((math.sin(t * 1.3) * 0.6 * t, 0, t * 6.0)) for t in [i / 6 for i in range(7)]]
    for i in range(6):
        a_, b_ = pts[i], pts[i + 1]; d = b_ - a_
        o = cyl(0.42 - i * 0.04, d.length * 1.05, tuple((a_ + b_) / 2), 'bark' if i % 2 else 'wood', n=7, r2=0.38 - i * 0.04); _aim(o, d)
    top = pts[-1]
    for k in range(8):
        a = 2 * math.pi * k / 8
        for j, (L, dz) in enumerate(((1.4, 0.1), (1.4, -0.55))):
            dd = Vector((math.cos(a), math.sin(a), dz)).normalized()
            base = top + Vector((math.cos(a), math.sin(a), 0)) * (1.3 * j)
            f = box((0.6, L * 1.05, 0.06), tuple(base + dd * L * 0.5), 'palm' if (k + j) % 2 else 'palm2', bevel=0.0, taper=(0.35, 1))
            f.rotation_euler = dd.to_track_quat('Y', 'Z').to_euler()
    for k in range(3): ball(0.2, tuple(top + Vector((math.cos(k * 2.1) * 0.3, math.sin(k * 2.1) * 0.3, -0.3))), 'bark', 1)
    cyl(0.55, 0.4, (0, 0, 0.2), 'bark', n=7, r2=0.42)
go('e_tree_a', broadleaf); go('e_tree_b', pinetree); go('e_tree_c', palmtree)

# ---- crates + barrels stack, 1.5 m
def crates():
    for (x, y, z, s) in ((0, 0, 0, 0.75), (0.8, 0.1, 0, 0.7), (0.35, 0.05, 0.75, 0.65)):
        box((s, s, s), (x, y, z + s / 2), 'crate', bevel=0.04)
        for d in (-1, 1): box((s + 0.02, 0.08, 0.08), (x, y + d * s * 0.3, z + s / 2), 'iron', bevel=0.0)
        for d in (-1, 1): box((0.08, s + 0.02, s + 0.02), (x + d * s * 0.42, y, z + s / 2), 'wood', bevel=0.0)   # corner battens
    for (x, y) in ((-0.75, 0.3), (-0.7, -0.45)):
        cyl(0.32, 0.85, (x, y, 0.425), 'burnt' if x < -0.72 else 'teal', n=10, bevel=0.03)
        for z in (0.15, 0.7): cyl(0.335, 0.06, (x, y, z), 'iron', n=10)
go('e_crates', crates)

# ---- debris: rubble + broken slabs, 2 m
def debris():
    rnd = random.Random(41)
    lump(0.9, (0, 0, 0.0), 'sand', 41, 1, 0.25, (1.1, 1.0, 0.45))
    for k in range(9):
        a = rnd.uniform(0, 6.28); d = rnd.uniform(0, 0.8); s = rnd.uniform(0.25, 0.55)
        box((s, s * 0.7, s * 0.4), (math.cos(a) * d, math.sin(a) * d, rnd.uniform(0.1, 0.45)), rnd.choice(['ochre', 'sand', 'rockd']),
            rot=(rnd.uniform(-35, 35), rnd.uniform(-35, 35), rnd.uniform(0, 90)), bevel=0.02)
    box((1.4, 0.9, 0.18), (0.2, -0.1, 0.5), 'sand', rot=(18, -10, 25), bevel=0.03)
    box((1.0, 0.7, 0.16), (-0.4, 0.3, 0.3), 'ochre', rot=(-12, 22, -40), bevel=0.03)
    for k in range(3):
        a = rnd.uniform(0, 6.28); c = cyl(0.03, 0.9, (math.cos(a) * 0.3, math.sin(a) * 0.3, 0.6), 'rust', n=5)
        c.rotation_euler = (rnd.uniform(0.3, 0.9), 0, a)
    ball(0.12, (0.3, 0.4, 0.35), 'glow', 1)
go('e_debris', debris)

# ---- hex base pad: 12 m flat-top (vertex on +X), stone rim, crimson team inlay
def hexpad():
    hexplinth(6.0, 0.18, (0, 0, 0), 'rockg', bevel=0.06)
    hexplinth(5.4, 0.08, (0, 0, 0.16), 'sand', bevel=0.02)
    hexplinth(3.6, 0.06, (0, 0, 0.2), 'team', bevel=0.0)                 # crimson team inlay ring
    hexplinth(3.2, 0.07, (0, 0, 0.21), 'sandlt', bevel=0.0)
    for k in range(6):                                                    # rim corner blocks + inlay spokes
        a = math.radians(60 * k)
        box((0.8, 0.8, 0.45), (math.cos(a) * 5.6, math.sin(a) * 5.6, 0.22), 'rockd', rot=(0, 0, 60 * k), bevel=0.08)
        sp = box((1.6, 0.25, 0.05), (math.cos(a + math.pi / 6) * 4.3, math.sin(a + math.pi / 6) * 4.3, 0.215), 'team', bevel=0.0)
        sp.rotation_euler = (0, 0, a + math.pi / 6)
go('e_hexpad', hexpad)
for k, v in out.items(): print('OUT', k, v['tris'], v['W'], v['H'], v['D'], v['mats'])

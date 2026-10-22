"""Geometry worker kit: palette, chunky parts, join, chunk split, export, verify, preview.
Run a piece:  ~/bl/bin/python art/worker/<id>.py   (writes models/gen/<id>.glb + art/worker/previews/<id>.png)
Every part is a separate object with a bevel; finish() applies everything, joins to ONE mesh with a
vertex-colour attribute "Col" and one material ("kit"); amber glow parts go to a second emissive material ("glow").
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Quaternion

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'models', 'gen')
PREV = os.path.join(ROOT, 'art', 'worker', 'previews')

def _lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

PAL = {k: _lin(v) for k, v in dict(
    steel='6f6960', iron='3a3632', rust='8a4b2a', orange='e8761c', olive='5d6a3a', bone='d8cfb8',
    glow='ffb347', team='D0102A',
    # neutral city extras (still no red): concrete, asphalt, wood, glass, leaf greens, bark
    concrete='9a968c', asphalt='3f3f42', wood='7a5a3a', glass='4a6a78', leaf='4f7a34', leaf2='6a8f3c',
    bark='5a4232', brick='8a5a40', white='e6e2d6', yellow='e8c21c', blue='3a5a8a', tire='222222',
    # species (batch 5+): Greys, Reptilians, Spores
    pearl='eef0f2', gunmetal='4a4f57', cyan='39e0ff', stone='7d7a68', moss='4e6b2c', bronze='9a6a2c',
    magenta='e0249a', lime='a6e22e', acid='7cff4a', purple='6a3a9a', fungus='c9b89a', goo='4a7a3a').items()}
# parts coloured with these keys get their own emissive material (glTF cannot emit from vertex colours)
GLOW = {'glow': 'glow', 'gcyan': 'glow_cyan', 'gmagenta': 'glow_magenta', 'gacid': 'glow_acid', 'glime': 'glow_lime'}
GLOW_HEX = {'glow': 'ffb347', 'gcyan': '39e0ff', 'gmagenta': 'e0249a', 'gacid': '7cff4a', 'glime': 'a6e22e'}
# translucent (alpha-blended) parts
CLEAR = {'corange': ('clear_orange', 'ff8a2a', 0.5), 'ccyan': ('clear_cyan', '39e0ff', 0.45), 'cacid': ('clear_acid', '7cff4a', 0.5), 'cpurple': ('clear_purple', '8a5ac0', 0.55),
         'cglass': ('clear_glass', '9fd8e8', 0.4)}
for k, h in GLOW_HEX.items(): PAL[k] = _lin(h)
for k, (n, h, a) in CLEAR.items(): PAL[k] = _lin(h)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def _color(ob, col):
    me = ob.data
    a = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    c = PAL[col] if isinstance(col, str) else col
    for d in a.data: d.color = c
    ob['mat'] = GLOW.get(col) or (CLEAR[col][0] if col in CLEAR else 'kit')
    ob['team'] = (col == 'team')

def _place(ob, loc, rot):
    ob.location = loc
    ob.rotation_euler = [math.radians(r) for r in rot]

EDGE_WEAR = 0.32   # detail pass 3: bevel faces get lighter, chipped-paint edges (0 = off)

def _bevel(ob, bevel, seg=1):
    if bevel > 0:
        m = ob.modifiers.new('bv', 'BEVEL'); m.width = bevel; m.segments = seg
        m.limit_method = 'ANGLE'; m.harden_normals = False
        m.material = 1                      # tag the bevel faces (slot 1) so join() can paint edge wear on them

def box(size, loc=(0, 0, 0), col='steel', rot=(0, 0, 0), bevel=0.02, seg=1, taper=None):
    """size (x,y,z) in Blender axes (Z up). taper=(sx,sy) scales the top face."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    ob = bpy.context.object; ob.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if taper:
        for v in ob.data.vertices:
            if v.co.z > 0: v.co.x *= taper[0]; v.co.y *= taper[1]
    _place(ob, loc, rot); _bevel(ob, bevel, seg); _color(ob, col); return ob

def cyl(r, depth, loc=(0, 0, 0), col='steel', rot=(0, 0, 0), n=8, bevel=0.0, r2=None, seg=1):
    """Cylinder along local Z. r2 = top radius (cone/flare)."""
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=depth)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r, radius2=r2, depth=depth)
    ob = bpy.context.object; _place(ob, loc, rot); _bevel(ob, bevel, seg); _color(ob, col); return ob

def ball(r, loc=(0, 0, 0), col='steel', sub=1, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r)
    ob = bpy.context.object; ob.scale = scale; ob.location = loc; _color(ob, col); return ob

def rivets(points, r=0.025, col='iron', axis='Y', n=6):
    """Little studs. axis = the direction the rivet faces out."""
    rot = {'X': (0, 90, 0), 'Y': (90, 0, 0), 'Z': (0, 0, 0)}[axis]
    return [cyl(r, r * 1.2, p, col, rot, n=n, r2=r * 0.6) for p in points]

def plate(size, loc, col='steel', rot=(0, 0, 0), riv=True, rr=None):
    """Riveted plate: bevelled box + a rivet at each corner of its largest face."""
    obs = [box(size, loc, col, rot, bevel=min(size) * 0.3)]
    if riv:
        sx, sy, sz = size; t = sorted(range(3), key=lambda i: size[i])[0]
        ax = 'XYZ'[t]; rr = rr or max(0.015, min(sx, sy, sz, 0.3) * 0.35)
        u, w = [i for i in range(3) if i != t]
        pts = []
        for a in (-1, 1):
            for b in (-1, 1):
                p = [0, 0, 0]; p[u] = a * (size[u] / 2 - rr * 2); p[w] = b * (size[w] / 2 - rr * 2)
                p[t] = size[t] / 2
                pts.append(p)
        R = Matrix.Rotation(0, 3, 'X')
        eul = __import__('mathutils').Euler([math.radians(x) for x in rot])
        R = eul.to_matrix()
        pts = [tuple(Vector(loc) + R @ Vector(p)) for p in pts]
        for r_ in rivets(pts, rr, 'iron', ax):
            r_.rotation_euler.rotate(eul)
        obs += []
    return obs[0]

def _apply_all():
    for ob in bpy.context.scene.objects:
        if ob.type != 'MESH': continue
        bpy.context.view_layer.objects.active = ob
        for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)

def _mat(name):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.85; b.inputs['Metallic'].default_value = 0.0
    if name.startswith('glow'):
        key = [k for k, v in GLOW.items() if v == name][0]
        b.inputs['Emission Color'].default_value = PAL[key]; b.inputs['Emission Strength'].default_value = 2.0
    if name.startswith('clear'):
        a = [v for v in CLEAR.values() if v[0] == name][0][2]
        b.inputs['Alpha'].default_value = a; b.inputs['Roughness'].default_value = 0.2
        try: m.surface_render_method = 'BLENDED'
        except Exception: m.blend_method = 'BLEND'
    return m

def _edge_wear(o):
    """Lighten bevel faces (material_index 1 from _bevel) toward a worn bone colour. Skips glow/clear/team parts."""
    me = o.data; a = me.color_attributes.get('Col')
    if not a or EDGE_WEAR <= 0 or o.get('mat', 'kit') != 'kit' or o.get('team'): return
    w = EDGE_WEAR; bone = PAL['bone']
    for p in me.polygons:
        if p.material_index == 1:
            for li in p.loop_indices:
                c = a.data[li].color
                a.data[li].color = tuple(c[i] * (1 - w) + bone[i] * w for i in range(3)) + (1.0,)
        p.material_index = 0

def join(name, obs=None):
    """Apply modifiers/transforms of all (or given) mesh objects and join them into one object `name`.
    One material per kind actually used: kit (vertex colours), glow_* (emissive), clear_* (alpha blend)."""
    obs = obs or [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True); bpy.context.view_layer.objects.active = o
        if o.modifiers and len(o.data.materials) < 2:
            while len(o.data.materials) < 2: o.data.materials.append(None)
        for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
        _edge_wear(o)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    names = sorted({o.get('mat', 'kit') for o in obs}, key=lambda n: (n != 'kit', n))
    mats = [_mat(n) for n in names]
    for o in obs:
        o.data.materials.clear()
        for m in mats: o.data.materials.append(m)
        mi = names.index(o.get('mat', 'kit'))
        for p in o.data.polygons: p.material_index = mi
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.join()
    ob = bpy.context.object; ob.name = name; ob.data.name = name
    return ob


def yup_note():
    """Blender is Z-up, faces -Y by convention; the glTF exporter (+Y up) maps Blender -Y -> glTF +Z.
    So: build in Blender with FRONT toward -Y, up +Z, and it arrives facing +Z, Y up."""

def export(path, objs=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in (objs or [o for o in bpy.context.scene.objects if o.type == 'MESH']): o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True,
                              export_yup=True, export_draco_mesh_compression_enable=False,
                              export_cameras=False, export_lights=False, export_materials='EXPORT')

def chunks(ob, cuts, name, tilt=0.35, seed=1):
    """Split `ob` (joined) into pieces by cut planes. cuts = {'x':[...], 'y':[...], 'z':[...]} (Blender coords).
    Each cut plane is tilted a little (random, shared by both neighbours) so the pieces break as wedges, not boxes.
    Each non-empty cell becomes chunk_i with its origin at its own centre. Cut faces are capped."""
    import random
    rnd = random.Random(seed)
    planes = {}
    for ax, key in ((0, 'x'), (1, 'y'), (2, 'z')):
        lst = []
        for v in sorted(cuts.get(key, [])):
            no = Vector((0, 0, 0)); no[ax] = 1
            for o in range(3):
                if o != ax: no[o] = rnd.uniform(-tilt, tilt)
            co = Vector((0, 0, 0)); co[ax] = v
            lst.append((co, no.normalized()))
        planes[ax] = lst
    out = []
    import itertools
    ranges = [range(len(planes[a]) + 1) for a in range(3)]
    for cell in itertools.product(*ranges):
        bm = bmesh.new(); bm.from_mesh(ob.data)
        for ax in range(3):
            i = cell[ax]
            for k, (co, no) in enumerate(planes[ax]):
                if k == i - 1: keep_pos = True        # cell is on the + side of plane k
                elif k == i: keep_pos = False         # cell is on the - side of plane k
                else: continue
                geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
                bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no,
                                       clear_inner=keep_pos, clear_outer=not keep_pos)
                bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
        if len(bm.faces) < 4:
            bm.free(); continue
        me = bpy.data.meshes.new('c'); bm.to_mesh(me); bm.free()
        for m in ob.data.materials: me.materials.append(m)
        o = bpy.data.objects.new('c', me); bpy.context.scene.collection.objects.link(o)
        out.append(o)
    for n, o in enumerate(out):
        o.name = o.data.name = f'chunk_{n}'
        c = sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices)
        o.data.transform(Matrix.Translation(-c)); o.location = c
    ob.hide_set(True)
    return out

def tris(ob):
    ob.data.calc_loop_triangles(); return len(ob.data.loop_triangles)

def verify(path):
    """Re-import the GLB in a clean scene; print tris, bbox size (glTF axes W x H x D) and origin offset."""
    reset()
    bpy.ops.import_scene.gltf(filepath=path)
    t = 0; mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3); mats = set(); names = []
    for o in bpy.context.scene.objects:
        if o.type != 'MESH': continue
        names.append(o.name); t += tris(o)
        for m in o.data.materials: mats.add(m.name)
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    s = mx - mn
    # Blender re-import is Z-up again: W = x, H = z, D = y
    info = dict(tris=t, W=round(s.x, 3), H=round(s.z, 3), D=round(s.y, 3),
                minx=round(mn.x, 3), maxx=round(mx.x, 3), miny_h=round(mn.z, 3), maxy_h=round(mx.z, 3),
                minz_d=round(-mx.y, 3), maxz_d=round(-mn.y, 3), mats=sorted(mats), objs=len(names))
    print('VERIFY', os.path.basename(path), info)
    return info

def preview(path, png, dist=None):
    """Workbench 256px 3/4-from-above preview of the GLB at `path` (call after verify(), scene has the import)."""
    sc = bpy.context.scene
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in sc.objects:
        if o.type != 'MESH': continue
        for v in o.data.vertices:
            w = o.matrix_world @ v.co; mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    c = (mn + mx) / 2; r = max((mx - mn).length / 2, 0.05)
    cam = bpy.data.cameras.new('cam'); co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co)
    # 3/4 view from front-right, above (front = -Y in Blender)
    d = Vector((1.0, -1.3, 1.0)).normalized() * r * 2.3
    co.location = c + d
    co.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cam.lens = 50; sc.camera = co
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading; sh.color_type = 'VERTEX'; sh.light = 'STUDIO'; sh.show_cavity = True
    sh.background_type = 'VIEWPORT'
    sc.render.resolution_x = sc.render.resolution_y = 384; sc.render.resolution_percentage = 100
    sc.render.filepath = png; sc.render.image_settings.file_format = 'PNG'
    w = bpy.data.worlds.new('w'); sc.world = w
    bpy.ops.render.render(write_still=True)

GROUND_DIRT = (0.8, 0.3)   # detail pass 4: (height m, strength) of the grime gradient at the base of grounded pieces

def ground_dirt(ob):
    """Darken vertex colours near y=0 toward a dirt brown (kit faces only; glow/clear/team untouched)."""
    h, k = GROUND_DIRT; me = ob.data; a = me.color_attributes.get('Col')
    if not a or k <= 0: return
    dirt = _lin('3b3026'); team = PAL['team']
    kit_idx = [i for i, m in enumerate(me.materials) if m and m.name == 'kit']
    for p in me.polygons:
        if p.material_index not in kit_idx: continue
        for li in p.loop_indices:
            z = me.vertices[me.loops[li].vertex_index].co.z
            if z >= h: continue
            c = a.data[li].color
            if all(abs(c[i] - team[i]) < 1e-3 for i in range(3)): continue
            f = k * (1 - max(z, 0) / h)
            a.data[li].color = tuple(c[i] * (1 - f) + dirt[i] * f for i in range(3)) + (1.0,)

def budget_for(name):
    """STYLE.md triangle budgets: props/weapons 2000, vehicles 4000, buildings 6000."""
    if name.startswith(('w_', 'p_')) or name in ('c_lamp', 'c_hydrant', 'c_bench', 'c_barrier', 'c_dumpster', 'c_tree', 'b_rubble'):
        return 2000
    if name.startswith(('s_', 'c_')): return 4000
    return 6000

def fit_budget(ob, limit):
    """Collapse-decimate `ob` to just under `limit` triangles (keeps vertex colours, UV-free)."""
    t = tris(ob)
    if t <= limit: return t
    bpy.context.view_layer.objects.active = ob
    m = ob.modifiers.new('dec', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = limit / t * 0.97
    m.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    return tris(ob)

def ship(name, objs=None, chunk_cuts=None, clip=False, fit=None, chunk_tilt=0.35):
    """Join everything, export <name>.glb (+ <name>_chunks.glb), verify + preview. Returns verify info.
    clip=True cuts away anything below the ground (y 0)."""
    os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)
    ob = join(name, objs)
    if clip: clip_ground(ob)
    if not name.startswith(('w_', 'p_', 's_')) or name == 's_brute_truck':
        ground_dirt(ob)
    fit_budget(ob, budget_for(name))
    if fit:   # non-uniform squash in Blender axes (x, y=depth, z=up) about the origin
        ob.data.transform(Matrix.Diagonal((fit[0], fit[1], fit[2], 1.0)))
    p = os.path.join(OUT, name + '.glb'); export(p, [ob])
    if chunk_cuts:
        cs = chunks(ob, chunk_cuts, name, tilt=chunk_tilt)
        export(os.path.join(OUT, name + '_chunks.glb'), cs)
    info = verify(p)
    preview(p, os.path.join(PREV, name + '.png'))
    if chunk_cuts:
        ci = verify(os.path.join(OUT, name + '_chunks.glb'))
        for o in bpy.context.scene.objects:          # exploded view, to eyeball the capped cuts
            if o.type == 'MESH': o.location = o.location * 1.35
        preview(None, os.path.join(PREV, name + '_chunks.png'))
        info['chunks'] = ci
    return info

def chunk_report(path):
    reset(); bpy.ops.import_scene.gltf(filepath=path)
    for o in sorted(bpy.context.scene.objects, key=lambda o: o.name):
        if o.type == 'MESH':
            print('  ', o.name, 'origin', tuple(round(v, 2) for v in o.location), 'tris', tris(o))

def clip_ground(ob):
    """Cut away everything below z = 0 and cap the cut."""
    bm = bmesh.new(); bm.from_mesh(ob.data)
    r = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0),
                               plane_no=(0, 0, 1), clear_inner=True)
    bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
    bm.to_mesh(ob.data); bm.free()

def ship_multi(name, groups, spacing=0.0, clip=False):
    """Several named variants in one GLB. groups = {'tree_a': [objs], ...}; each joined mesh keeps its origin at
    its own base centre (world 0,0,0 when built), then the nodes are spread along X by `spacing` (node offset only)."""
    os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)
    out = []
    for i, (n, obs) in enumerate(groups.items()):
        ob = join(n, obs); out.append(ob)
        if clip: clip_ground(ob)
        ground_dirt(ob)
    for i, ob in enumerate(out):
        ob.location.x = (i - (len(out) - 1) / 2) * spacing
    p = os.path.join(OUT, name + '.glb'); export(p, out)
    info = verify(p); preview(p, os.path.join(PREV, name + '.png'))
    for o in bpy.context.scene.objects:
        if o.type == 'MESH': print('  ', o.name, 'node at', tuple(round(v, 2) for v in o.location), 'tris', tris(o))
    return info

def container(length, loc, col='rust', axis='Y', h=2.6, w=2.4, ribs=True, doors=True):
    """Shipping container (chunky) lying along `axis` ('X' or 'Y'), loc = bottom centre."""
    x, y, z = loc
    L, Wd = (length, w)
    size = (Wd, L, h) if axis == 'Y' else (L, Wd, h)
    obs = [box(size, (x, y, z + h / 2), col, bevel=0.06)]
    n = max(2, int(L / 0.7))
    if ribs:
        for i in range(n):
            t = -L / 2 + (i + 0.5) * L / n
            for s in (-1, 1):
                if axis == 'Y': obs.append(box((0.06, 0.16, h - 0.3), (x + s * (Wd / 2 + 0.02), y + t, z + h / 2), col, bevel=0.0))
                else: obs.append(box((0.16, 0.06, h - 0.3), (x + t, y + s * (Wd / 2 + 0.02), z + h / 2), col, bevel=0.0))
    # corner castings
    for a in (-1, 1):
        for b in (-1, 1):
            for c in (0.12, h - 0.12):
                p = (x + a * (Wd / 2 - 0.08), y + b * (L / 2 - 0.08)) if axis == 'Y' else (x + a * (L / 2 - 0.08), y + b * (Wd / 2 - 0.08))
                obs.append(box((0.24, 0.24, 0.24), (p[0], p[1], z + c), 'iron', bevel=0.0))
    return obs

def gear(r, loc, col='team', teeth=10, bite=2, thick=0.25, rot=(90, 0, 0), hub='iron'):
    """Bitten gear emblem: disc + teeth, `bite` teeth missing with a dark notch. Faces along local Z (rot -> facing)."""
    import mathutils
    ob = []
    E = mathutils.Euler([math.radians(v) for v in rot]).to_matrix()
    c = Vector(loc)
    ob.append(cyl(r, thick, loc, col, rot, n=teeth * 2))
    for i in range(teeth):
        if i < bite: continue
        a = 2 * math.pi * i / teeth
        p = c + E @ Vector((math.cos(a) * (r + r * 0.12), math.sin(a) * (r + r * 0.12), 0))
        t = box((r * 0.3, r * 0.26, thick), tuple(p), col, bevel=0.0)
        t.rotation_euler = (E @ mathutils.Matrix.Rotation(a, 3, 'Z')).to_euler()
    a = 2 * math.pi * (bite - 1) / teeth / 2
    for k in range(3):   # bite marks: dark scallops on the rim
        aa = a + (k - 1) * 0.28
        p = c + E @ Vector((math.cos(aa) * r * 0.9, math.sin(aa) * r * 0.9, 0))
        ob.append(cyl(r * 0.22, thick * 1.1, tuple(p), 'iron', rot, n=8))
    ob.append(cyl(r * 0.35, thick * 1.3, loc, hub, rot, n=8, bevel=0.02))
    return ob

def torus(R, r, loc=(0, 0, 0), col='steel', rot=(0, 0, 0), n=16, m=6):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=n, minor_segments=m)
    ob = bpy.context.object; _place(ob, loc, rot); _color(ob, col); return ob

# ---------------------------------------------------------------- detail-pass parts (see AESTHETIC.md)
PAL['ivory'] = _lin('e9dcc0'); PAL['burnt'] = _lin('c4561a'); PAL['dark'] = _lin('24211f')

def _aim(ob, d):
    ob.rotation_euler = Vector(d).normalized().to_track_quat('Z', 'Y').to_euler()

def spike(r, h, loc, d=(0, 0, 1), n=6):
    """Two-tone cone spike pointing along d: ivory base, burnt-orange tip. Base sits at loc."""
    d = Vector(d).normalized(); p = Vector(loc)
    a = cyl(r, h * 0.62, tuple(p + d * h * 0.31), 'ivory', n=n, r2=r * 0.5); _aim(a, d)
    b = cyl(r * 0.5, h * 0.38, tuple(p + d * h * 0.81), 'burnt', n=n, r2=0.0); _aim(b, d)
    c = cyl(r * 1.15, h * 0.08, tuple(p + d * h * 0.02), 'iron', n=n); _aim(c, d)       # iron collar
    return [a, b, c]

def hexbolt(r, loc, d=(0, 0, 1), col='steel'):
    o = cyl(r, r * 0.7, loc, col, n=6); _aim(o, d); return o

def canister(r, L, loc, d=(0, 0, 1), glow='glow', bars=3, ribs=2):
    """Caged glow tube along d centred at loc: glowing core, iron end caps, bars, rib rings."""
    d = Vector(d).normalized(); p = Vector(loc); obs = []
    o = cyl(r * 0.78, L * 0.86, tuple(p), glow, n=8); _aim(o, d); obs.append(o)
    for s in (-1, 1):
        o = cyl(r, L * 0.12, tuple(p + d * s * L * 0.44), 'iron', n=8, bevel=r * 0.15); _aim(o, d); obs.append(o)
    side = d.orthogonal().normalized()
    for i in range(bars):
        q = Quaternion(d, 2 * math.pi * i / bars) @ side
        o = box((r * 0.28, r * 0.28, L * 0.8), tuple(p + q * r * 0.92), 'iron', bevel=0.0)
        o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); obs.append(o)
    for k in range(ribs):
        t = (k + 1) / (ribs + 1) - 0.5
        o = cyl(r * 0.95, L * 0.05, tuple(p + d * t * L * 0.8), 'iron', n=8); _aim(o, d); obs.append(o)
    return obs

def crown(w, loc, normal=(0, -1, 0), col='white', t=None, up=(0, 0, 1)):
    """Drippy graffiti crown tag (flat, extruded `t`), width w, facing `normal`, crown points toward `up`."""
    t = t or w * 0.06; h = w * 0.62
    pts = [(-0.5, -0.32), (-0.5, 0.42), (-0.28, 0.08), (0.0, 0.5), (0.28, 0.08), (0.5, 0.42), (0.5, -0.32),
           (0.36, -0.32), (0.36, -0.5), (0.26, -0.5), (0.26, -0.32), (-0.08, -0.32), (-0.08, -0.62), (-0.18, -0.62),
           (-0.18, -0.32)]                                                   # crown + two drips
    bm = bmesh.new()
    vs = [bm.verts.new((x * w, y * h * 1.1, 0)) for x, y in pts]
    f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.z += t
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('crown'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('crown', me); bpy.context.scene.collection.objects.link(ob)
    n = Vector(normal).normalized(); u = Vector(up).normalized()
    x = u.cross(n).normalized(); y = n.cross(x).normalized()
    M = Matrix((x, y, n)).transposed()
    ob.matrix_world = Matrix.Translation(Vector(loc)) @ M.to_4x4()
    _color(ob, col); return ob

def chain(p0, p1, r=0.03, col='iron'):
    """Chain of alternating links from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length; n = max(2, int(L / (r * 2.6)))
    obs = []
    for i in range(n):
        o = torus(r, r * 0.3, tuple(p0 + d * (i + 0.5) / n), col, n=8, m=4)
        o.scale = (1, 1.6, 1)
        q = d.normalized().to_track_quat('Y', 'Z')
        o.rotation_euler = (q @ Quaternion(Vector((0, 1, 0)), (i % 2) * math.pi / 2)).to_euler(); obs.append(o)
    return obs

def banner(w, h, loc, normal=(0, -1, 0), col='team', mark='crown', mark_col='white'):
    """Tattered hanging cloth banner (top edge at loc), facing `normal`, with a crown (or skull) mark. Ragged bottom."""
    n = Vector(normal).normalized(); up = Vector((0, 0, 1)); x = up.cross(n).normalized()
    p = Vector(loc); obs = []
    obs.append(box((w + 0.1, 0.06, 0.06), tuple(p), 'iron', bevel=0.0))                     # hanging rod
    obs[-1].rotation_euler = n.to_track_quat('Y', 'Z').to_euler()
    c = box((w, 0.03, h), tuple(p - up * h / 2 + n * 0.02), col, bevel=0.0)
    c.rotation_euler = n.to_track_quat('Y', 'Z').to_euler(); obs.append(c)
    for k in range(4):                                                                      # ragged tails
        t = -w / 2 + (k + 0.5) * w / 4
        L = h * (0.18 + 0.12 * ((k * 7) % 3))
        tl = box((w / 4 * 0.8, 0.03, L), tuple(p + x * t - up * (h + L / 2 - 0.01) + n * 0.02), col, bevel=0.0, taper=(1.0, 1.0))
        tl.rotation_euler = n.to_track_quat('Y', 'Z').to_euler(); obs.append(tl)
    mp = p - up * h * 0.5 + n * 0.04
    if mark == 'crown':
        obs.append(_CROWN_ORIG(w * 0.7, tuple(mp), normal=tuple(n), up=(0, 0, 1), t=0.015, col=mark_col) if '_CROWN_ORIG' in globals() else crown(w * 0.7, tuple(mp), normal=tuple(n), up=(0, 0, 1), t=0.015, col=mark_col))
    elif mark == 'gear':
        obs += gearmark(w * 0.75, tuple(mp), tuple(n), (0, 0, 1), 'ivory' if mark_col == 'white' else mark_col, 0.015)
    elif mark == 'skull':
        obs += skull(w * 0.32, tuple(mp), tuple(n), mark_col)
    return obs

def skull(r, loc, normal=(0, -1, 0), col='ivory'):
    """Chunky skull badge facing `normal`: dome + jaw, dark eye sockets and nose."""
    n = Vector(normal).normalized(); up = Vector((0, 0, 1)); x = up.cross(n).normalized(); p = Vector(loc)
    obs = [ball(r, tuple(p + up * r * 0.2), col, 1, (1, 0.6, 0.9)), box((r * 1.2, r * 0.5, r * 0.6), tuple(p - up * r * 0.6), col, bevel=r * 0.1)]
    obs[1].rotation_euler = n.to_track_quat('Y', 'Z').to_euler()
    obs[0].rotation_euler = n.to_track_quat('Y', 'Z').to_euler()
    for s in (-1, 1):
        obs.append(ball(r * 0.28, tuple(p + x * s * r * 0.4 + up * r * 0.1 + n * r * 0.45), 'dark', 1))
    obs.append(ball(r * 0.14, tuple(p - up * r * 0.25 + n * r * 0.5), 'dark', 1))
    return obs

# ---------------------------------------------------------------- Reptilian organic parts (Colin's lizard-punk sheets)
for _k, _h in dict(scale='3f6a6c', scale2='8f8a3a', belly='e6cfa2', spot='1f2b45', leather='4a3022', gold='c99a2e',
                   web='ead7b0', scaledark='2a3a3a').items():
    PAL[_k] = _lin(_h)

def hexplinth(r, h, loc=(0, 0, 0), col='stone', bevel=0.08):
    """Flat-top hexagonal plinth (vertex on +X, like the board's hexes), bottom at loc z."""
    x, y, z = loc
    return cyl(r, h, (x, y, z + h / 2), col, rot=(0, 0, 30), n=6, bevel=bevel)   # Blender's cylinder starts at +Y

def horn(r, L, loc, d=(0, 0, 1), bend=(0, 0, 0), segs=3):
    """Curved horn/spine: tapering cone segments bending toward `bend`; ivory base -> burnt tip."""
    p = Vector(loc); d = Vector(d).normalized(); b = Vector(bend); obs = []
    for i in range(segs):
        t0, t1 = i / segs, (i + 1) / segs
        seg_len = L / segs
        r0, r1 = r * (1 - t0 * 0.85), r * (1 - t1 * 0.85) if i < segs - 1 else 0.0
        col = 'ivory' if i < segs - 1 else 'burnt'
        q = p + d * seg_len
        o = cyl(r0, seg_len * 1.05, tuple((p + q) / 2), col, n=6, r2=r1); _aim(o, d); obs.append(o)
        p = q; d = (d + b * (1.0 / segs)).normalized()
    return obs

def frill(R, loc, normal=(0, -1, 0), up=(0, 0, 1), spread=200, spines=7, t=0.06, rim='team', spots=True):
    """Lizard frill fan: webbing wedges between ivory/orange spines, crimson rim, blue spots. Fan opens around `up`."""
    n = Vector(normal).normalized(); u = Vector(up).normalized(); x = u.cross(n).normalized(); u = n.cross(x).normalized()
    c = Vector(loc); obs = []
    a0 = math.radians(90 + spread / 2); a1 = math.radians(90 - spread / 2)
    angs = [a0 + (a1 - a0) * k / (spines - 1) for k in range(spines)]
    for k in range(spines - 1):
        aa, ab = angs[k], angs[k + 1]
        pa = c + (x * math.cos(aa) + u * math.sin(aa)) * R; pb = c + (x * math.cos(ab) + u * math.sin(ab)) * R
        mid = (aa + ab) / 2; pm = c + (x * math.cos(mid) + u * math.sin(mid)) * R * 0.82         # scalloped edge dips
        bm = bmesh.new()
        vs = [bm.verts.new(tuple(v)) for v in (c, pa, pm, pb)]
        bm.faces.new(vs)
        r_ = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
        for v in [g for g in r_['geom'] if isinstance(g, bmesh.types.BMVert)]: v.co += n * t
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new('w'); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new('w', me); bpy.context.scene.collection.objects.link(o); _color(o, 'web'); obs.append(o)
        # crimson rim band along the scalloped edge
        for p0, p1 in ((pa, pm), (pm, pb)):
            dd = p1 - p0; rb = box((0.1 * R, t * 1.6, dd.length), tuple((p0 + p1) / 2 + n * t / 2), rim, bevel=0.0)
            rb.rotation_euler = dd.to_track_quat('Z', 'Y').to_euler(); obs.append(rb)
        if spots:
            for f in (0.45, 0.65):
                sp = c + (x * math.cos(mid) + u * math.sin(mid)) * R * f
                s = cyl(R * 0.06 * (1.2 - f * 0.5), t * 1.4, tuple(sp + n * t / 2), 'spot', n=6); _aim(s, n); obs.append(s)
    for a in angs:                                                     # spines
        dirv = x * math.cos(a) + u * math.sin(a)
        obs += horn(R * 0.085, R * 1.12, tuple(c + n * t / 2), tuple(dirv), (0, 0, 0), segs=2)
    return obs

def spots(obj_center, radius, n_spots, seed=0, col='spot', size=0.12, zmin=None, scale=(1, 1, 1)):
    """Scatter flattened scale spots on an ellipsoid surface (centre, radius, per-axis scale), sitting just proud."""
    import random
    rnd = random.Random(seed); c = Vector(obj_center); obs = []
    for i in range(n_spots):
        v = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.2, 1))).normalized()
        p = c + Vector((v.x * scale[0], v.y * scale[1], v.z * scale[2])) * radius * 0.97
        v = Vector((v.x / scale[0], v.y / scale[1], v.z / scale[2])).normalized()          # ellipsoid normal
        if zmin is not None and p.z < zmin: continue
        s = cyl(size * rnd.uniform(0.6, 1.3), size * 0.3, tuple(p), col, n=6); _aim(s, v); obs.append(s)
    return obs

def studs(points, r=0.03, col='gold'):
    return [ball(r, p, col, 1) for p in points]

def ring(R, r, loc, rot=(90, 0, 0), col='gold'):
    return torus(R, r, loc, col, rot=rot, n=10, m=4)

# ---------------------------------------------------------------- Brute style (Colin's Brute sheets, Oct 22):
# orange spotted ogres; brand = GEAR-AND-WRENCH mark (ivory on orange/crimson plates), orange-painted riveted plate over
# dark iron, octagonal pads, ammo bandoliers (orange/red shells), red armbands, olive cloth. Crowns are Reptilian.
PAL['paint'] = _lin('d8641e'); PAL['paint2'] = _lin('b8471a'); PAL['shell'] = _lin('c23a1c')

def gearmark(w, loc, normal=(0, -1, 0), up=(0, 0, 1), col='ivory', t=None, teeth=8):
    """Flat Brute brand: a gear ring with a wrench cutting up through it (extruded `t`), width w, facing `normal`."""
    t = t or w * 0.06; n = Vector(normal).normalized(); u = Vector(up).normalized()
    x = u.cross(n).normalized(); u = n.cross(x).normalized(); c = Vector(loc); obs = []
    R = w * 0.36
    def flat(sx, sy, px, py, rot=0.0):
        o = box((sx, t, sy), (0, 0, 0), col, bevel=0.0)
        M = Matrix((x, n, u)).transposed().to_4x4()
        o.matrix_world = Matrix.Translation(c + x * px + u * py + n * t / 2) @ M @ Matrix.Rotation(rot, 4, 'Y')
        return o
    for k in range(12):                                              # ring as 12 short slabs
        a = 2 * math.pi * k / 12
        if 0.2 < (a % (2 * math.pi)) < 1.1: continue                 # the bitten gap (upper right)
        obs.append(flat(R * 0.6, R * 0.28, math.cos(a) * R, math.sin(a) * R, -(a + math.pi / 2)))
    for k in range(teeth):                                           # teeth
        a = 2 * math.pi * (k + 0.5) / teeth
        if 0.2 < (a % (2 * math.pi)) < 1.1: continue
        obs.append(flat(R * 0.32, R * 0.3, math.cos(a) * R * 1.3, math.sin(a) * R * 1.3, -(a + math.pi / 2)))
    obs.append(flat(R * 0.26, R * 1.5, 0, -R * 0.15))                # wrench shaft
    for s in (-1, 1):
        obs.append(flat(R * 0.22, R * 0.45, s * R * 0.24, R * 0.62, s * 0.35))   # wrench jaw prongs
    return obs

def octpad(w, loc, normal=(0, -1, 0), col='paint', rim='iron', t=None):
    """Octagonal riveted armour pad (knee/shoulder look) facing `normal`."""
    t = t or w * 0.18; n = Vector(normal).normalized(); obs = []
    o = cyl(w * 0.5, t, tuple(Vector(loc) + n * t / 2), rim, n=8, bevel=t * 0.2); _aim(o, n); obs.append(o)
    o = cyl(w * 0.42, t * 0.5, tuple(Vector(loc) + n * t * 1.1), col, n=8); _aim(o, n); obs.append(o)
    side = n.orthogonal().normalized()
    for k in range(4):
        q = Quaternion(n, math.pi / 2 * k + math.pi / 4) @ side
        obs.append(hexbolt(w * 0.05, tuple(Vector(loc) + n * t * 1.3 + q * w * 0.33), tuple(n)))
    return obs

def bandolier(p0, p1, r=0.09, col_a='paint2', col_b='shell'):
    """Strap with a row of ammo shells (alternating orange/red, brass caps) from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length; obs = []
    s = box((r * 1.2, r * 0.5, L), tuple((p0 + p1) / 2), 'leather', bevel=0.0)
    s.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); obs.append(s)
    n = max(2, int(L / (r * 2.4)))
    side = d.normalized().orthogonal().normalized()
    for i in range(n):
        p = p0 + d * (i + 0.5) / n
        o = cyl(r * 0.8, r * 2.2, tuple(p), col_a if i % 2 else col_b, n=8); _aim(o, side); obs.append(o)
        o = cyl(r * 0.82, r * 0.5, tuple(p + side * r * 1.0), 'gold', n=8); _aim(o, side); obs.append(o)
    return obs

_SPIKE_ORIG = spike
_CROWN_ORIG = crown
_BANNER_ORIG = banner

def brute_style():
    """Call at the top of a Brute script: crowns -> gear-wrench marks, spikes -> chunky dark-iron studs,
    banners carry the gear mark."""
    g = globals()
    def stud_spike(r, h, loc, d=(0, 0, 1), n=6):
        d_ = Vector(d).normalized(); p = Vector(loc)
        a = cyl(r * 1.15, h * 0.35, tuple(p + d_ * h * 0.17), 'iron', n=n); _aim(a, d_)
        b = cyl(r * 0.9, h * 0.55, tuple(p + d_ * h * 0.6), 'steel', n=n, r2=r * 0.2); _aim(b, d_)
        return [a, b]
    def gear_crown(w, loc, normal=(0, -1, 0), col='white', t=None, up=(0, 0, 1)):
        return gearmark(w * 1.1, loc, normal, up, 'ivory' if col in ('white', 'ivory') else col, t)
    def gear_banner(w, h, loc, normal=(0, -1, 0), col='team', mark='crown', mark_col='white'):
        return _BANNER_ORIG(w, h, loc, normal, col, 'skull' if mark == 'skull' else 'gear', mark_col)
    g['spike'] = stud_spike; g['crown'] = gear_crown; g['banner'] = gear_banner
    import builtins
    return stud_spike, gear_crown, gear_banner

# ---------------------------------------------------------------- Grey style (Colin's Grey sheets, Oct 22):
# speckled bone-white plate over dark rusty iron, brass rings, crimson plates with the ivory UFO-and-beam mark,
# headphone/speaker discs, rainbow neon tubes, orange glowing lenses. Crowns appear only as small tags.
PAL['brass'] = _lin('b07a32'); PAL['plate'] = _lin('e4dccd'); PAL['rustdk'] = _lin('5a2e1a')
for _k, _h in dict(gorange='ff8a2a', gneon_g='7cff4a', gneon_m='e04cff', gneon_c='39e0ff').items():
    PAL[_k] = _lin(_h)
GLOW.update(gorange='glow_orange', gneon_g='glow_acid', gneon_m='glow_magenta', gneon_c='glow_cyan')
GLOW_HEX.update(gorange='ff8a2a', gneon_g='7cff4a', gneon_m='e04cff', gneon_c='39e0ff')

def ufomark(w, loc, normal=(0, -1, 0), up=(0, 0, 1), col='ivory', t=None):
    """Grey brand: a saucer (dome + disc) with a fanned abduction beam of 4 strokes under it, width w."""
    t = t or w * 0.05; n = Vector(normal).normalized(); u = Vector(up).normalized()
    x = u.cross(n).normalized(); u = n.cross(x).normalized(); c = Vector(loc)
    M = Matrix((x, n, u)).transposed().to_4x4(); obs = []
    def flat(o, px, py, rot=0.0):
        o.matrix_world = Matrix.Translation(c + x * px + u * py + n * t / 2) @ M @ Matrix.Rotation(rot, 4, 'Y'); return o
    def oval(rx, rz, px, py):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=1)
        o = bpy.context.object; _color(o, col)
        o.matrix_world = Matrix.Translation(c + x * px + u * py + n * t / 2) @ M @ Matrix.Diagonal((rx, t / 2, rz, 1))
        return o
    obs.append(oval(w * 0.46, w * 0.075, 0, w * 0.3))                      # disc
    obs.append(oval(w * 0.19, w * 0.15, 0, w * 0.36))                      # dome
    for px, ang in ((-0.15, 0.32), (-0.05, 0.11), (0.05, -0.11), (0.15, -0.32)):   # beam fans out downward
        s_ = box((w * 0.06, t, w * 0.48), (0, 0, 0), col, bevel=0.0); obs.append(flat(s_, w * px * 1.5, -w * 0.02, ang))
    return obs

def speaker(r, loc, d=(1, 0, 0), lens='gneon_c'):
    """Headphone/speaker disc: brass ring, bone-white cup, dark grille, glowing centre lens."""
    d_ = Vector(d).normalized(); p = Vector(loc); obs = []
    o = cyl(r, r * 0.5, tuple(p), 'plate', n=12, bevel=r * 0.08); _aim(o, d_); obs.append(o)
    o = cyl(r * 1.05, r * 0.15, tuple(p + d_ * r * 0.22), 'brass', n=12); _aim(o, d_); obs.append(o)
    o = cyl(r * 0.72, r * 0.1, tuple(p + d_ * r * 0.28), 'iron', n=12); _aim(o, d_); obs.append(o)
    o = cyl(r * 0.32, r * 0.1, tuple(p + d_ * r * 0.33), lens, n=10); _aim(o, d_); obs.append(o)
    return obs

def neon_rack(loc, d=(0, 0, 1), n=4, r=0.06, L=0.5, spread=None):
    """A row of rainbow neon tubes with dark caps (like the Grey DJ's belt)."""
    cols = ['gneon_g', 'gneon_m', 'gneon_c', 'gneon_g', 'gneon_m']
    p = Vector(loc); d_ = Vector(d).normalized(); side = d_.orthogonal().normalized(); obs = []
    sp = spread or r * 2.6
    for i in range(n):
        q = p + side * (i - (n - 1) / 2) * sp
        o = cyl(r, L, tuple(q), cols[i % len(cols)], n=8); _aim(o, d_); obs.append(o)
        for s in (-1, 1):
            o = cyl(r * 1.15, L * 0.12, tuple(q + d_ * s * L * 0.5), 'iron', n=8); _aim(o, d_); obs.append(o)
    return obs

def speckle(center, radius, n, seed=0, scale=(1, 1, 1), zmin=None, size=0.05):
    """Rust speckles over a bone-white surface (like the Greys' skin and plate)."""
    return spots(center, radius, n, seed=seed, col='rustdk', size=size, zmin=zmin, scale=scale)

def grey_style():
    """Call at the top of a Grey script: pearl -> speckled bone plate, gunmetal -> dark rusty iron, crown tags ->
    ivory UFO-beam marks, banners carry the UFO mark."""
    PAL['pearl'] = PAL['plate']; PAL['gunmetal'] = _lin('3a2c24')
    g = globals()
    def ufo_crown(w, loc, normal=(0, -1, 0), col='white', t=None, up=(0, 0, 1)):
        return ufomark(w * 1.1, loc, normal, up, 'ivory' if col in ('white', 'ivory') else col, t)
    def ufo_banner(w, h, loc, normal=(0, -1, 0), col='team', mark='crown', mark_col='white'):
        obs = _BANNER_ORIG(w, h, loc, normal, col, 'none', mark_col)
        n = Vector(normal).normalized(); mp = Vector(loc) - Vector((0, 0, h * 0.5)) + n * 0.04
        return obs + ufomark(w * 0.8, tuple(mp), tuple(n), (0, 0, 1), 'ivory', 0.015)
    g['crown'] = ufo_crown; g['banner'] = ufo_banner
    return ufo_crown, ufo_banner

# ---------------------------------------------------------------- Reptilian pass 2 (Colin's lizard sheets #2)
def crownplate(w, loc, normal=(0, -1, 0), up=(0, 0, 1), t=None):
    """Dark riveted plate with a white crown tag (belt buckles, helmet bands, maul faces on the sheets)."""
    t = t or w * 0.12; n = Vector(normal).normalized(); p = Vector(loc); obs = []
    o = box((w, t, w * 0.8), tuple(p + n * t / 2), 'dark', bevel=t * 0.3)
    o.rotation_euler = n.to_track_quat('Y', 'Z').to_euler(); obs.append(o)
    obs.append(_CROWN_ORIG(w * 0.62, tuple(p + n * t * 1.02), normal=tuple(n), up=up, t=t * 0.3, col='white'))
    side = n.orthogonal().normalized()
    return obs

def glowslots(w, h, loc, normal=(0, -1, 0), n_slots=2, col='glow'):
    """Bone-white armour plate with recessed dark frames holding orange glowing slots."""
    nn = Vector(normal).normalized(); p = Vector(loc); obs = []
    q = nn.to_track_quat('Y', 'Z').to_euler()
    o = box((w, w * 0.1, h), tuple(p + nn * w * 0.05), 'plate', bevel=w * 0.04); o.rotation_euler = q; obs.append(o)
    x = Vector((0, 0, 1)).cross(nn).normalized()
    for i in range(n_slots):
        off = (i - (n_slots - 1) / 2) * w / n_slots
        f = box((w / n_slots * 0.7, w * 0.04, h * 0.6), tuple(p + nn * w * 0.11 + x * off), 'dark', bevel=0.0); f.rotation_euler = q; obs.append(f)
        g = box((w / n_slots * 0.5, w * 0.04, h * 0.45), tuple(p + nn * w * 0.13 + x * off), col, bevel=0.0); g.rotation_euler = q; obs.append(g)
    return obs

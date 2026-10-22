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
CLEAR = {'ccyan': ('clear_cyan', '39e0ff', 0.45), 'cacid': ('clear_acid', '7cff4a', 0.5), 'cpurple': ('clear_purple', '8a5ac0', 0.55),
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

def ship(name, objs=None, chunk_cuts=None, clip=False, fit=None, chunk_tilt=0.35):
    """Join everything, export <name>.glb (+ <name>_chunks.glb), verify + preview. Returns verify info.
    clip=True cuts away anything below the ground (y 0)."""
    os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)
    ob = join(name, objs)
    if clip: clip_ground(ob)
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
        obs.append(crown(w * 0.7, tuple(mp), normal=tuple(n), up=(0, 0, 1), t=0.015, col=mark_col))
    else:
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

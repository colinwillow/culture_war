# concrete jersey barrier, BREAKABLE. Origin ground centre, long axis X.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
import bmesh
reset()
# jersey profile (y, z) extruded along X
prof = [(-0.3, 0), (-0.3, 0.08), (-0.22, 0.3), (-0.1, 0.9), (0.1, 0.9), (0.22, 0.3), (0.3, 0.08), (0.3, 0)]
me = bpy.data.meshes.new('jb'); bm = bmesh.new()
L = [bm.verts.new((-1.0, y, z)) for y, z in prof]; R = [bm.verts.new((1.0, y, z)) for y, z in prof]
n = len(prof)
for i in range(n):
    j = (i + 1) % n
    bm.faces.new((L[i], L[j], R[j], R[i]))
bm.faces.new(list(reversed(L))); bm.faces.new(R)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
ob = bpy.data.objects.new('jb', me); bpy.context.scene.collection.objects.link(ob)
bv = ob.modifiers.new('bv', 'BEVEL'); bv.width = 0.03; bv.limit_method = 'ANGLE'
from kit import _color; _color(ob, 'concrete')
for x in (-0.95, 0.95):
    box((0.06, 0.62, 0.12), (x, 0, 0.06), 'asphalt', bevel=0.0)                # end scuffs
box((1.7, 0.02, 0.1), (0, -0.2, 0.55), 'orange', rot=(-11, 0, 0), bevel=0.0)    # hazard stripe both faces
box((1.7, 0.02, 0.1), (0, 0.2, 0.55), 'orange', rot=(11, 0, 0), bevel=0.0)
for x in (-0.6, 0.6):
    box((0.2, 0.64, 0.08), (x, 0, 0.04), 'asphalt', bevel=0.0)                 # forklift slots
cyl(0.04, 0.12, (-0.85, 0, 0.92), 'rust', n=6)                                  # rebar stubs
cyl(0.04, 0.12, (0.85, 0, 0.92), 'rust', n=6)

# ---- v2 detail pass: crown graffiti + a spray streak on the face, cracks, chunk missing from a top corner
crown(0.5, (0.45, -0.23, 0.42), normal=(0, -0.95, 0.3), up=(0, 0.3, 0.95), t=0.01, col='dark')
box((0.7, 0.02, 0.07), (-0.5, -0.22, 0.35), 'magenta', rot=(-11, 0, 8), bevel=0.0)
box((0.25, 0.02, 0.02), (-0.2, -0.19, 0.7), 'asphalt', rot=(-11, 0, 40), bevel=0.0)
box((0.25, 0.02, 0.02), (0.6, 0.19, 0.6), 'asphalt', rot=(11, 0, -30), bevel=0.0)

# ---- detail pass 2: a stencilled number + reflectors on the ends
for x in (-0.85, 0.85):
    box((0.1, 0.02, 0.1), (x, -0.21, 0.6), 'yellow', rot=(-11, 0, 0), bevel=0.0)
print(ship('c_barrier', chunk_cuts={'x': [-0.5, 0.0, 0.5], 'z': [0.45]}))

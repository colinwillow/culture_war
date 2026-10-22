# shared builder for the breakable wall panels (b_wall_brick / b_wall_window / b_wall_door).
# Panel 4 m along X, 3 m tall, 0.3 m thick (Y). Origin ground centre. Built from boxes around the hole (no booleans).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
W, H, T = 4.0, 3.0, 0.3

def slab_with_hole(hole):
    """hole = (x0, x1, z0, z1) or None -> boxes covering the panel minus the hole."""
    if not hole:
        return [box((W, T, H), (0, 0, H / 2), 'brick', bevel=0.03)]
    x0, x1, z0, z1 = hole; out = []
    def b(xa, xb, za, zb):
        if xb - xa > 0.01 and zb - za > 0.01:
            out.append(box((xb - xa, T, zb - za), ((xa + xb) / 2, 0, (za + zb) / 2), 'brick', bevel=0.02))
    b(-W / 2, x0, 0, H); b(x1, W / 2, 0, H); b(x0, x1, 0, z0); b(x0, x1, z1, H)
    return out

def build(name, hole=None, frame='wood'):
    reset()
    slab_with_hole(hole)
    box((W + 0.04, T + 0.12, 0.2), (0, 0, 0.1), 'concrete', bevel=0.03)          # footing
    box((W + 0.04, T + 0.08, 0.14), (0, 0, H - 0.07), 'concrete', bevel=0.03)    # cap
    # mortar courses (slightly proud strips) on both faces, broken around the hole
    for z in (0.5, 0.95, 1.4, 1.85, 2.3, 2.7):
        segs = [(-W / 2 + 0.05, W / 2 - 0.05)]
        if hole and hole[2] - 0.02 < z < hole[3] + 0.02:
            segs = [(-W / 2 + 0.05, hole[0] - 0.02), (hole[1] + 0.02, W / 2 - 0.05)]
        for a, c in segs:
            for s in (-1, 1):
                box((c - a, 0.02, 0.04), ((a + c) / 2, s * (T / 2 + 0.005), z), 'bone', bevel=0.0)
    # a few proud bricks, staggered
    for x, z in ((-1.5, 0.72), (-0.9, 1.62), (1.1, 0.72), (1.6, 2.07), (-1.3, 2.5), (0.4, 2.5)):
        if hole and hole[0] - 0.3 < x < hole[1] + 0.3 and hole[2] - 0.2 < z < hole[3] + 0.2:
            continue
        for s in (-1, 1):
            box((0.42, 0.04, 0.19), (x, s * (T / 2 + 0.01), z), 'brick', bevel=0.01)
    if hole:
        x0, x1, z0, z1 = hole
        fz0 = z0 if z0 > 0.01 else 0.0
        # frame: jambs + lintel (+ sill for a window)
        for x in (x0 + 0.05, x1 - 0.05):
            box((0.1, T + 0.06, z1 - fz0), (x, 0, (z1 + fz0) / 2), frame, bevel=0.01)
        box((x1 - x0 + 0.2, T + 0.1, 0.16), ((x0 + x1) / 2, 0, z1 + 0.06), 'concrete', bevel=0.02)   # lintel
        if z0 > 0.01:
            box((x1 - x0 + 0.16, T + 0.14, 0.08), ((x0 + x1) / 2, 0, z0 - 0.02), 'concrete', bevel=0.015)  # sill
    cuts = {'x': [-1.0, 0.0, 1.0], 'z': [1.45]}
    return ship(name, chunk_cuts=cuts)

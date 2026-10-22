# chunky low-poly street trees, 3 variants (tree_a round, tree_b tall cone, tree_c lumpy cluster) in one GLB.
# Each tree's origin is at its trunk base; nodes are spread 4 m apart along X (reset the node position on use).
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
def trunk(h, r=0.26):
    return [cyl(r * 1.4, 0.3, (0, 0, 0.15), 'bark', n=6, r2=r), cyl(r, h, (0, 0, h / 2), 'bark', n=6)]
a = trunk(2.2) + [ball(1.3, (0, 0, 3.2), 'leaf', 2, (1.1, 1.1, 1.0)), ball(0.75, (0.6, -0.3, 3.9), 'leaf2', 2),
                  ball(0.7, (-0.7, 0.4, 2.7), 'leaf2', 2)]
b = trunk(1.4, 0.24) + [cyl(1.4, 1.6, (0, 0, 2.0), 'leaf', n=7, r2=0.9), cyl(1.15, 1.4, (0, 0, 3.1), 'leaf2', n=7, r2=0.55),
                        cyl(0.7, 1.3, (0, 0, 4.25), 'leaf', n=7, r2=0.0)]
c = trunk(2.0, 0.28) + [cyl(0.1, 1.2, (0.4, 0, 2.3), 'bark', (0, 35, 0), n=5), cyl(0.1, 1.2, (-0.35, 0.2, 2.2), 'bark', (0, -35, 0), n=5),
                       ball(0.9, (0.9, 0, 3.0), 'leaf2', 2), ball(0.95, (-0.8, 0.3, 2.9), 'leaf', 2),
                       ball(1.05, (0, -0.2, 3.7), 'leaf', 2), box((1.2, 1.2, 0.9), (0.1, 0.5, 3.4), 'leaf2', rot=(10, 20, 30), bevel=0.15)]
for g in (a, b, c):
    for o in g:
        if o.name.startswith('Ico'): o.rotation_euler = (0.3, 0.2, len(g) * 0.7)
print(ship_multi('c_tree', {'tree_a': a, 'tree_b': b, 'tree_c': c}, spacing=4.0))

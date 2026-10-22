import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from walls import build
# window hole 1.4 x 1.1, sill at 0.95
print(build('b_wall_window', hole=(-0.7, 0.7, 0.95, 2.05)))

import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from walls import build
# door hole 1.2 x 2.2 from the ground
print(build('b_wall_door', hole=(-0.6, 0.6, 0.0, 2.2)))

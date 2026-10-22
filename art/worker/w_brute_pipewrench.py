# big pipe wrench (Worker tool). Origin at the grip, jaws along +Z (Blender -Y), hook jaw opens upward.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
X = (90, 0, 0)
box((0.05, 0.50, 0.06), (0, -0.12, 0), 'orange', bevel=0.014, taper=(0.9, 1))  # I-beam handle, y +0.13 .. -0.37
box((0.06, 0.04, 0.07), (0, 0.13, 0), 'iron', bevel=0.012)                    # handle end
cyl(0.012, 0.07, (0, 0.10, 0), 'iron', (0, 90, 0), n=6)                       # hang hole pin
box((0.07, 0.14, 0.09), (0, -0.43, 0.01), 'steel', bevel=0.015)               # heel jaw housing
box((0.07, 0.05, 0.05), (0, -0.53, 0.03), 'iron', bevel=0.01)                 # heel jaw teeth
box((0.035, 0.05, 0.20), (0, -0.40, 0.11), 'steel', bevel=0.008)              # sliding shank (vertical)
cyl(0.045, 0.05, (0, -0.42, 0.10), 'rust', (0, 0, 0), n=8, bevel=0.006)        # knurl nut
box((0.075, 0.22, 0.06), (0, -0.48, 0.20), 'steel', bevel=0.014)              # hook jaw top bar
box((0.075, 0.05, 0.07), (0, -0.565, 0.155), 'iron', bevel=0.01)              # hook jaw teeth (down)
for y in (-0.05, -0.2):
    cyl(0.014, 0.08, (0, y, 0), 'iron', (0, 90, 0), n=6)                      # handle rivets through
print(ship('w_brute_pipewrench'))

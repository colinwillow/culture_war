# Greys depot: abduction beam dish -- tall dish on a mast pointing up, cyan glow cup. Origin ground centre.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from kit import *
reset()
cyl(1.9, 0.4, (0, 0, 0.2), 'gunmetal', n=12, bevel=0.05)                   # base
cyl(1.5, 0.3, (0, 0, 0.55), 'pearl', n=12, bevel=0.04)
box((1.2, 0.08, 0.3), (0, -1.53, 0.55), 'team', bevel=0.0)                   # crimson base plates
box((1.2, 0.08, 0.3), (0, 1.53, 0.55), 'team', bevel=0.0)
cyl(0.35, 4.0, (0, 0, 2.7), 'pearl', n=10)                                    # mast
for z in (1.6, 3.0, 4.2):
    cyl(0.45, 0.15, (0, 0, z), 'gunmetal', n=10)
for i in range(3):                                                            # struts
    a = 2 * math.pi * i / 3
    st = box((0.18, 0.18, 2.4), (math.cos(a) * 0.8, math.sin(a) * 0.8, 1.6), 'gunmetal', bevel=0.02)
    st.rotation_euler = (0, 0, a); st.rotation_euler.rotate_axis('Y', math.radians(-20))
cyl(0.6, 0.4, (0, 0, 4.85), 'gunmetal', n=10)                                 # dish hub
cyl(0.6, 1.4, (0, 0, 5.7), 'pearl', n=16, r2=2.0)                             # dish (cone opening up)
cyl(1.75, 0.06, (0, 0, 6.43), 'gcyan', n=16)                           # glowing inner face
cyl(0.25, 0.6, (0, 0, 6.7), 'gunmetal', n=8)                                  # emitter post
ball(0.55, (0, 0, 7.0), 'gcyan', 2)                                           # glow cup
print(ship('gb_depot'))

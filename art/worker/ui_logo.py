# Title lockup "WAR FOR THE WORLD": outlined Boldonse paths, the O of WORLD is a ringed planet. currentColor, no text.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from svgkit import *
top, tw, _ = text_path('WAR FOR THE', 'Boldonse-Regular.ttf', 16, 0, 0, track=3)
big, bw, boxes = text_path('WORLD', 'Boldonse-Regular.ttf', 40, 0, 0, track=4, skip=(1,))
W = max(tw, bw) + 40
tx = (W - tw) / 2; bx = (W - bw) / 2
# planet in place of the O: disc + tilted ring; the ring's back arc hides behind the disc, its front arc cuts a gap in it
ox, oadv = boxes[1]; cx = bx + ox + oadv / 2; cy = 94 - 20; r = 15.5; rx, ry = 25, 6.5
T = f'rotate(-18 {cx:.1f} {cy:.1f})'
front = f'M{cx - rx:.1f} {cy:.1f}A{rx} {ry} 0 0 0 {cx + rx:.1f} {cy:.1f}'
back = f'M{cx - rx:.1f} {cy:.1f}A{rx} {ry} 0 0 1 {cx + rx:.1f} {cy:.1f}'
planet = (f'<mask id="wftw-m1"><rect x="{cx - 40:.0f}" y="{cy - 40:.0f}" width="80" height="80" fill="#fff"/>'
          f'<path d="{front}" transform="{T}" fill="none" stroke="#000" stroke-width="9"/></mask>'
          f'<mask id="wftw-m2"><rect x="{cx - 40:.0f}" y="{cy - 40:.0f}" width="80" height="80" fill="#fff"/>'
          f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r + 2.5}" fill="#000"/></mask>'
          f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" mask="url(#wftw-m1)"/>'
          f'<g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round">'
          f'<path d="{back}" transform="{T}" mask="url(#wftw-m2)"/><path d="{front}" transform="{T}"/></g>')
H = 100
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H}" fill="currentColor">'
       f'<path transform="translate({tx:.1f} 30)" d="{top}"/>'
       f'<path transform="translate({bx:.1f} 94)" d="{big}"/>{planet}</svg>')
write('ui_logo', svg); preview('ui_logo', 512, 160, '#ff7a2e')

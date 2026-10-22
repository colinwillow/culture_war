# Title lockup "BATTLE FOR EARTH" (Colin's rename): outlined Boldonse paths, "BATTLE FOR" over a big "EARTH", with a
# small cracked ringed planet + a saucer above the H. currentColor, no text elements, mask ids prefixed bfe-.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from svgkit import *
top, tw, _ = text_path('BATTLE FOR', 'Boldonse-Regular.ttf', 16, 0, 0, track=3)
big, bw, boxes = text_path('EARTH', 'Boldonse-Regular.ttf', 40, 0, 0, track=4)
W = max(tw + 44, bw) + 40; tx = (W - tw - 44) / 2 + 14; bx = (W - bw) / 2
# planet floats right of "BATTLE FOR", above the H
cx = tx - 14 + tw + 26; cy = 22; r = 10; rx, ry = 17, 4.2
T = f'rotate(-18 {cx:.1f} {cy:.1f})'
front = f'M{cx - rx:.1f} {cy:.1f}A{rx} {ry} 0 0 0 {cx + rx:.1f} {cy:.1f}'
back = f'M{cx - rx:.1f} {cy:.1f}A{rx} {ry} 0 0 1 {cx + rx:.1f} {cy:.1f}'
crack = f'M{cx - 4:.1f} {cy - 9:.1f}L{cx - 1:.1f} {cy - 3:.1f}L{cx - 5:.1f} {cy + 1:.1f}L{cx - 1:.1f} {cy + 8:.1f}'
planet = (f'<mask id="bfe-m1"><rect x="{cx - 30:.0f}" y="{cy - 30:.0f}" width="60" height="60" fill="#fff"/>'
          f'<path d="{front}" transform="{T}" fill="none" stroke="#000" stroke-width="6"/>'
          f'<path d="{crack}" fill="none" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/></mask>'
          f'<mask id="bfe-m2"><rect x="{cx - 30:.0f}" y="{cy - 30:.0f}" width="60" height="60" fill="#fff"/>'
          f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r + 2}" fill="#000"/></mask>'
          f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" mask="url(#bfe-m1)"/>'
          f'<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">'
          f'<path d="{back}" transform="{T}" mask="url(#bfe-m2)"/><path d="{front}" transform="{T}"/></g>')
# tiny saucer zipping in from the left of the planet
sx, sy = cx + 4, cy - 17
saucer = (f'<ellipse cx="{sx:.1f}" cy="{sy:.1f}" rx="6" ry="1.8"/><path d="M{sx - 2.6:.1f} {sy - 0.8:.1f}A2.8 2.6 0 0 1 {sx + 2.6:.1f} {sy - 0.8:.1f}Z"/>'
          f'<path d="M{sx - 11:.1f} {sy + 0.5:.1f}H{sx - 7.5:.1f}M{sx - 13:.1f} {sy + 2.5:.1f}H{sx - 8.5:.1f}" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} 100" fill="currentColor">'
       f'<path transform="translate({tx - 14:.1f} 30)" d="{top}"/>'
       f'<path transform="translate({bx:.1f} 94)" d="{big}"/>{planet}{saucer}</svg>')
write('ui_logo_bfe', svg); preview('ui_logo_bfe', 512, 250, '#7fe3ff')

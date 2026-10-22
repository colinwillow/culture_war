# Species emblems: 64x64, one flat colour (fill=currentColor), no text/gradients, < 4 KB. Masks get unique id prefixes.
import sys, os, math; sys.path.insert(0, os.path.dirname(__file__)); from svgkit import *
def f(v): return ('%.1f' % v).rstrip('0').rstrip('.')
def svg(body): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">{body}</svg>'
def poly(pts): return 'M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in pts) + 'Z'

# --- Brute: heavy bitten gear with tusks -------------------------------------------------------------
cx, cy, R, r, n = 32, 33, 27, 21, 9
pts = []
for i in range(n):
    a0 = 2 * math.pi * i / n - math.pi / 2
    for da, rad in ((-0.17, r), (-0.12, R), (0.12, R), (0.17, r)):
        a = a0 + da * 1.0; pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
    a = a0 + math.pi / n; pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
gear = poly(pts)
bite = ''.join(f'<circle cx="{f(cx + math.cos(a) * 24)}" cy="{f(cy + math.sin(a) * 24)}" r="7.5" fill="#000"/>'
               for a in (math.radians(-60), math.radians(-35), math.radians(-10)))
mouth = '<path d="M17 30Q32 24 47 30L45 44Q32 50 19 44Z" fill="#000"/>'          # jaw hole cut through the gear
tusks = '<path d="M21 45L23 31L28 44ZM43 45L41 31L36 44Z"/>'                     # two tusks rising in the jaw
rivets = ''.join(f'<circle cx="{f(cx + math.cos(a) * 17.5)}" cy="{f(cy + math.sin(a) * 17.5)}" r="1.5" fill="#000"/>'
                 for a in [math.radians(v) for v in (110, 150, 190, 230, 270)])
crack = '<path d="M50 40L44 42L46 46L41 48" fill="none" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>'
brute = svg(f'<mask id="emb-m"><rect width="64" height="64" fill="#fff"/>{bite}{mouth}{rivets}{crack}'
            f'<circle cx="{cx}" cy="18" r="3" fill="#000"/></mask>'
            f'<path d="{gear}" mask="url(#emb-m)"/>' + tusks)
write('ui_em_brute', brute); preview('ui_em_brute', 128, 128, '#ff7a2e')

# --- Grey: saucer + abduction beam (beam broken into bands) ------------------------------------------
grey = svg('<mask id="emg-m"><rect width="64" height="64" fill="#fff"/>'
           '<rect x="0" y="42" width="64" height="2.6" fill="#000"/><rect x="0" y="49" width="64" height="2.6" fill="#000"/>'
           '<rect x="0" y="56" width="64" height="2.6" fill="#000"/>'
           '<circle cx="32" cy="40.5" r="2.2" fill="#000"/><path d="M29 44H35L34 52H30Z" fill="#000"/>'
           '<path d="M28 45L25 41M36 45L39 41" stroke="#000" stroke-width="1.6" stroke-linecap="round"/>'
           '<ellipse cx="32" cy="24" rx="27" ry="5" fill="none" stroke="#000" stroke-width="2"/></mask>'
           '<g mask="url(#emg-m)">'
           '<path d="M21 21C21 10 43 10 43 21Z"/>'                               # dome
           '<path d="M38 13L44 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="44.5" cy="3.5" r="2"/>'
           '<ellipse cx="32" cy="25" rx="30" ry="8.5"/>'                         # disc
           '<path d="M24 31H40L52 62H12Z" opacity="1"/></g>'                     # beam
           '<circle cx="18" cy="25" r="2" fill="#000" fill-opacity="0"/>')
grey = grey.replace('<circle cx="18" cy="25" r="2" fill="#000" fill-opacity="0"/>', '')
# cut light-ports into the disc rim
grey = grey.replace('<rect x="0" y="42"', ''.join(f'<circle cx="{x}" cy="27" r="2.2" fill="#000"/>' for x in (12, 22, 32, 42, 52)) + '<rect x="0" y="42"')
write('ui_em_grey', grey); preview('ui_em_grey', 128, 128, '#7fe3ff')

# --- Reptilian: slit-pupil eye with brow scales ------------------------------------------------------
rept = svg('<path fill-rule="evenodd" d="M2 34C14 14 50 14 62 34C50 54 14 54 2 34Z'
           'M32 19A15 15 0 1 0 32.01 19Z"/>'                                     # almond with the iris cut out
           '<path d="M32 21C27 27 27 41 32 47C37 41 37 27 32 21Z"/>'            # slit pupil
           '<path d="M10 20L14 9L19 17ZM22 14L28 3L32 12ZM34 12L40 3L44 14ZM47 17L52 9L56 21Z"/>'
           '<path d="M24 55L27 62L30 55ZM34 55L37 62L40 55Z"/>'                  # fangs below
           )   # brow spikes
write('ui_em_rept', rept); preview('ui_em_rept', 128, 128, '#9dff4a')

# --- Spore: bursting pod cluster ----------------------------------------------------------------------
pods = [(30, 38, 13), (46, 44, 8), (16, 48, 7), (44, 28, 6)]
body = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in pods)
holes = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#000"/>' for x, y, r in ((27, 34, 3.4), (34, 41, 2.2), (46, 44, 2.6), (16, 48, 2.2)))
burst = ''
for i, a in enumerate(range(-150, -20, 26)):                                       # spores flying out of the top
    t = math.radians(a)
    for k, (d, rr) in enumerate(((19, 2.6), (25, 1.9))):
        burst += f'<circle cx="{f(30 + math.cos(t) * (d + i % 2 * 3))}" cy="{f(36 + math.sin(t) * (d + i % 2 * 3))}" r="{rr}"/>'
crack = '<path d="M30 25L27 30L32 31L29 36" fill="none" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>'
spore = svg(f'<mask id="ems-m"><rect width="64" height="64" fill="#fff"/>{holes}{crack}</mask>'
            f'<g mask="url(#ems-m)">{body}</g>{burst}'
            '<path d="M24 50C24 55 22 57 22 59A2 2 0 0 0 26 59C26 57 24 55 24 50Z"/>'
            '<circle cx="54" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/>'
            '<circle cx="9" cy="24" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/>')
write('ui_em_spore', spore); preview('ui_em_spore', 128, 128, '#e06bff')

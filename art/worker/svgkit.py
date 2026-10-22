"""2D UI art helpers: font glyphs -> outlined SVG paths (fontTools), and a Chromium preview to PNG.
Fonts are SIL OFL (outlined paths embedded in the SVG; no font file shipped)."""
import os, subprocess, re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
UI = os.path.join(ROOT, 'models', 'gen', 'ui')
PREV = os.path.join(ROOT, 'art', 'worker', 'previews')
FONTS = '/mnt/skills/examples/canvas-design/canvas-fonts/'

def _round(d, nd=1):
    return re.sub(r'-?\d+\.\d+', lambda m: ('%.*f' % (nd, float(m.group()))).rstrip('0').rstrip('.'), d)

def text_path(txt, font, size, x=0, y=0, track=0.0, skip=()):
    """Outline `txt` at (x, baseline y), height `size` = units per em scaled. Returns (d, width).
    skip = indexes of characters to leave out (their advance is kept), for swapping in a custom shape."""
    f = TTFont(FONTS + font); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    cap = f['OS/2'].sCapHeight or upm * 0.7
    s = size / cap                                            # `size` = CAP HEIGHT in output units
    pen = SVGPathPen(gs); bp = BoundsPen(gs); cx = x; boxes = []
    for i, ch in enumerate(txt):
        gname = cmap[ord(ch)]; adv = f['hmtx'][gname][0] * s
        if i not in skip:
            gs[gname].draw(TransformPen(pen, (s, 0, 0, -s, cx, y)))
            gs[gname].draw(TransformPen(bp, (s, 0, 0, -s, cx, y)))
        boxes.append((cx, adv)); cx += adv + track
    text_path.bounds = bp.bounds   # (xmin, ymin, xmax, ymax) of what was drawn
    return _round(pen.getCommands()), cx - x - track, boxes

def write(name, svg):
    os.makedirs(UI, exist_ok=True)
    p = os.path.join(UI, name + '.svg'); open(p, 'w').write(svg)
    print(name, len(svg.encode()), 'bytes'); return p

def preview(name, w=256, h=256, colour='#7fe3ff'):
    """Render the SVG tinted with `colour` on a dark background via headless Chromium -> previews/<name>.png"""
    p = os.path.join(UI, name + '.svg'); svg = open(p).read()
    html = os.path.join(PREV, '_' + name + '.html')
    open(html, 'w').write(f'<html><body style="margin:0;background:#15161a;color:{colour}">'
                          f'<div style="padding:8px">{svg.replace("<svg ", f"<svg width=\"{w - 16}\" height=\"{h - 16}\" ")}</div></body></html>')
    out = os.path.join(PREV, name + '.png')
    chrome = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
    subprocess.run([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                    f'--window-size={w},{max(h, 400)}', f'--screenshot={out}', 'file://' + html],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    subprocess.run(['python3', '-c', f"from PIL import Image; Image.open('{out}').crop((0, 0, {w}, {h})).save('{out}')"])
    os.remove(html); return out

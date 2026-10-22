# Command icons: 24x24, stroke-only (stroke=currentColor, width 2.2, round joins/caps), no fill, no text.
import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from svgkit import *
HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">')
ICONS = {
    'train':  '<circle cx="9" cy="7" r="3.2"/><path d="M3 20V18A5 5 0 0 1 8 13H10A5 5 0 0 1 15 18V20"/><path d="M19 8V14M16 11H22"/>',
    'build':  '<path d="M14.4 3.6L20.4 9.6L17.6 12.4L11.6 6.4Z"/><path d="M14.5 9.5L4 20"/>',
    'attack': '<path d="M3 3L16 16M14 18L18 14M16 16L20.5 20.5"/><path d="M21 3L8 16M10 18L6 14M8 16L3.5 20.5"/>',
    'move':   '<path d="M4 20L20 4"/><path d="M11 4H20V13"/><circle cx="5" cy="19" r="1.4"/>',
    'stop':   '<path d="M8 3H16L21 8V16L16 21H8L3 16V8Z"/><path d="M8 12H16"/>',
    'power':  '<path d="M13 2L5 13H11L10 22L19 10H13Z"/>',
    'repair': '<path d="M14.5 6.5A4.2 4.2 0 0 1 20 3.5L17 6.5L17.5 9L20 9.5L23 6.5A4.2 4.2 0 0 1 18 11.5L8 21.5A2.1 2.1 0 0 1 5 18.5L15 8.5"/>',
    'hero':   '<path d="M3 18L4.5 7L9 11L12 5L15 11L19.5 7L21 18Z"/><path d="M3 21H21"/>',
}
for k, d in ICONS.items():
    write('ui_ic_' + k, HEAD + d + '</svg>'); preview('ui_ic_' + k, 64, 64, '#e8e6df')

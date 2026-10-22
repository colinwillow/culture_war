# Key the baked checkerboard out of Colin's BATTLE FOR EARTH logo: flood-fill from the border through low-saturation
# light pixels (the grey/white checks), make them transparent, soften the edge by 1 px. Interior whites (FOR) survive
# because the logo's dark outline seals them off from the border.
import sys
from PIL import Image, ImageFilter
from collections import deque
src, dst, maxw = sys.argv[1], sys.argv[2], int(sys.argv[3])
im = Image.open(src).convert('RGB'); W, H = im.size; px = im.load()
def bg(c):
    r, g, b = c; return min(r, g, b) > 150 and max(r, g, b) - min(r, g, b) < 18
mask = bytearray(W * H); q = deque()
for x in range(W):
    for y in (0, H - 1): q.append((x, y))
for y in range(H):
    for x in (0, W - 1): q.append((x, y))
while q:
    x, y = q.popleft(); i = y * W + x
    if mask[i] or not bg(px[x, y]): continue
    mask[i] = 1
    if x > 0: q.append((x - 1, y))
    if x < W - 1: q.append((x + 1, y))
    if y > 0: q.append((x, y - 1))
    if y < H - 1: q.append((x, y + 1))
# enclosed pockets of checkerboard (inside pipe loops; the squares there are separate islands): key any pixel whose
# 15x15 neighbourhood is >=80% checker greys (~165 and ~245, low saturation) with both tones present >=20% each.
# Letters (FOR) are textured off-white, so they never hit both tones that cleanly.
import numpy as np
A = np.asarray(im).astype(np.int16)
sat = A.max(2) - A.min(2); mn = A.min(2)
dk = ((sat < 14) & (A.mean(2) > 155) & (A.mean(2) < 205)).astype(np.float32)
lt = ((sat < 18) & (mn > 232)).astype(np.float32)
def boxsum(m, r=7):
    c = np.pad(m, r, mode='edge').cumsum(0).cumsum(1); c = np.pad(c, ((1, 0), (1, 0)))
    k = 2 * r + 1
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
fd, fl = boxsum(dk), boxsum(lt)
pocket = (fd + fl > 0.8) & (fd > 0.2) & (fl > 0.2) & ((dk + lt) > 0)
M = np.frombuffer(bytes(mask), dtype=np.uint8).reshape(H, W).copy()
M[pocket] = 1
mask = bytearray(M.tobytes())
a = Image.frombytes('L', (W, H), bytes(0 if m else 255 for m in mask))
a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
out = im.convert('RGBA'); out.putalpha(a)
bb = out.getbbox(); print('crop', bb); out = out.crop(bb)
if out.width > maxw: out = out.resize((maxw, round(out.height * maxw / out.width)), Image.LANCZOS)
out.save(dst, optimize=True)
print(dst, out.size)

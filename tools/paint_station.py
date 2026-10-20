"""Paint an HD top-down station platform (Prologue map) in the style of the
VTT battlemaps: muted ink-and-wash, hatching, dark outlines.
Grid is 20x11 cells; output 80 px/cell = 1600x880 (WebP)."""
import numpy as np, random, math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

C = 80
W, H = 20 * C, 11 * C
rng = np.random.default_rng(7)
random.seed(7)

def noise(w, h, scale, octaves=4, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0
    for o in range(octaves):
        s = max(1, int(scale / (2 ** o)))
        small = r.random((h // s + 2, w // s + 2)).astype(np.float32)
        im = Image.fromarray((small * 255).astype(np.uint8)).resize(((w // s + 2) * s, (h // s + 2) * s), Image.BICUBIC)
        out += amp * (np.asarray(im, np.float32)[:h, :w] / 255.0)
        tot += amp; amp *= .5
    return out / tot

def col(hexs):
    hexs = hexs.lstrip('#'); return tuple(int(hexs[i:i + 2], 16) for i in (0, 2, 4))

base = np.zeros((H, W, 3), np.float32)

def paint(mask, c, tex=None, tex_amt=0.0):
    c = np.array(col(c), np.float32)
    layer = np.broadcast_to(c, base.shape).copy()
    if tex is not None:
        layer *= (1 - tex_amt + tex_amt * 2 * tex)[..., None]
    m = mask[..., None]
    base[:] = base * (1 - m) + layer * m

Y, X = np.mgrid[0:H, 0:W]
n1 = noise(W, H, 120, 5, 1); n2 = noise(W, H, 30, 4, 2); n3 = noise(W, H, 8, 3, 3)

# ---- ground: dark moor grass everywhere ----
paint(np.ones((H, W), np.float32), '#26301f', n1 * .6 + n2 * .4, .55)
# darker woods top band
woods = (Y < 2.3 * C).astype(np.float32)
paint(woods, '#141a14', n1, .5)

# ---- gravel ballast + rails (rows 8-9, plus soft edges) ----
ry0, ry1 = int(7.95 * C), int(10.05 * C)
grav = ((Y >= ry0) & (Y < ry1)).astype(np.float32)
paint(grav, '#4a4744', n3 * .7 + n2 * .3, .7)
# speckle stones
sp = (n3 > .72) & (grav > 0)
base[sp] *= 1.25
sp2 = (n3 < .25) & (grav > 0)
base[sp2] *= .65

img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(img, 'RGBA')

# railway ties
for x in range(-20, W + 40, 46):
    jx = x + random.randint(-3, 3)
    d.rectangle([jx, ry0 + 20, jx + 26, ry1 - 22], fill=(58, 44, 32, 255), outline=(16, 12, 10, 255), width=3)
    for k in range(3):
        yy = ry0 + 30 + k * 40 + random.randint(-6, 6)
        d.line([jx + 5, yy, jx + 20, yy + random.randint(-3, 3)], fill=(30, 22, 16, 160), width=2)
# rails (centre of track = 9*C, train strip is centred there)
for ry in (int(9 * C - 34), int(9 * C + 34)):
    d.rectangle([0, ry - 7, W, ry + 7], fill=(28, 28, 32, 255))
    d.rectangle([0, ry - 5, W, ry + 2], fill=(118, 122, 130, 255))
    d.line([0, ry - 4, W, ry - 4], fill=(180, 186, 196, 255), width=2)

# ---- the platform: weathered planks, rows 3.5..8 ----
px0, py0, py1 = 0, int(3.55 * C), int(7.98 * C)
plank_h = 26
rr = random.Random(3)
y = py0
while y < py1:
    x = -rr.randint(0, 200)
    while x < W:
        L = rr.randint(160, 340)
        shade = rr.uniform(.82, 1.12)
        c0 = np.array(col('#6b4f36')) * shade
        d.rectangle([x, y, x + L, y + plank_h], fill=tuple(int(v) for v in c0) + (255,), outline=(22, 15, 10, 255), width=2)
        # grain
        for g in range(4):
            gy = y + 4 + g * 6 + rr.randint(-1, 1)
            d.line([x + 4, gy, x + L - 4, gy + rr.randint(-2, 2)], fill=(40, 28, 18, 90), width=1)
        # knots & nails
        if rr.random() < .5:
            kx = x + rr.randint(20, max(21, L - 20)); d.ellipse([kx - 4, y + 9, kx + 6, y + 16], outline=(30, 20, 12, 200), width=2)
        for nx in (x + 8, x + L - 10):
            d.rectangle([nx, y + 6, nx + 3, y + 9], fill=(20, 18, 18, 220)); d.rectangle([nx, y + 16, nx + 3, y + 19], fill=(20, 18, 18, 220))
        x += L
    y += plank_h
# platform front edge: worn painted safety strip + shadow onto gravel
d.rectangle([0, py1 - 14, W, py1], fill=(150, 128, 70, 255), outline=(20, 15, 10, 255), width=3)
for x in range(0, W, 18):
    if rr.random() < .35: d.rectangle([x, py1 - 12, x + rr.randint(4, 14), py1 - 3], fill=(90, 72, 44, 255))
d.rectangle([0, py1, W, py1 + 18], fill=(0, 0, 0, 110))

def tree(cx, cy, r, dark=False):
    # top-down canopy: lumpy ink blob with hatched shading
    pts = []
    k = rr.randint(9, 13)
    for i in range(k):
        a = i / k * 2 * math.pi; rad = r * rr.uniform(.72, 1.08)
        pts.append((cx + math.cos(a) * rad, cy + math.sin(a) * rad))
    base_c = (26, 36, 26) if dark else (38, 52, 34)
    d.polygon(pts, fill=base_c + (255,), outline=(6, 8, 6, 255))
    for i in range(6):
        a = rr.uniform(0, 6.28); rr2 = r * rr.uniform(.2, .55)
        x2, y2 = cx + math.cos(a) * rr2, cy + math.sin(a) * rr2
        s = r * rr.uniform(.25, .45)
        d.ellipse([x2 - s, y2 - s, x2 + s, y2 + s], fill=(base_c[0] + 14, base_c[1] + 18, base_c[2] + 12, 255), outline=(8, 12, 8, 200), width=2)
    for i in range(10):
        a = rr.uniform(.6, 2.4)
        x2, y2 = cx + math.cos(a) * r * .6, cy + math.sin(a) * r * .6
        d.line([x2, y2, x2 + 10, y2 - 6], fill=(4, 6, 4, 150), width=2)

def deadtree(cx, cy, r):
    for i in range(rr.randint(5, 8)):
        a = rr.uniform(0, 6.28); L = r * rr.uniform(.6, 1.1)
        x2, y2 = cx + math.cos(a) * L, cy + math.sin(a) * L
        d.line([cx, cy, x2, y2], fill=(30, 22, 18, 255), width=7)
        d.line([cx, cy, x2, y2], fill=(58, 44, 34, 255), width=3)
        for j in range(2):
            b = a + rr.uniform(-.8, .8); L2 = L * .4
            d.line([x2, y2, x2 + math.cos(b) * L2, y2 + math.sin(b) * L2], fill=(30, 22, 18, 255), width=3)
    d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=(48, 36, 28, 255), outline=(14, 10, 8, 255), width=3)

for i in range(26):
    tree(rr.randint(-40, W + 40), rr.randint(-40, int(.9 * C)), rr.randint(46, 80), dark=True)
for i in range(9):
    tree(rr.randint(int(9.0 * C) + 40, W + 30), rr.randint(int(.8 * C), int(2.3 * C)), rr.randint(40, 62))
# ---- station house (left, rows 0.6..3.55, cols 0..9) ----
hx0, hx1, hy0, hy1 = 0, int(9.0 * C), int(.55 * C), int(3.55 * C)
# roof: shingles
d.rectangle([hx0 - 10, hy0, hx1, hy1 - 34], fill=(46, 40, 52, 255), outline=(10, 8, 12, 255), width=5)
for yy in range(hy0 + 6, hy1 - 40, 18):
    off = 0 if (yy // 18) % 2 else 13
    for xx in range(hx0 - 10 + off, hx1, 26):
        s = rr.uniform(.8, 1.15)
        d.rectangle([xx, yy, xx + 24, yy + 16], fill=(int(70 * s), int(62 * s), int(78 * s), 255), outline=(18, 14, 22, 255), width=2)
# ridge line and chimney
d.rectangle([hx0 - 10, hy0 + (hy1 - hy0) // 2 - 30, hx1, hy0 + (hy1 - hy0) // 2 - 18], fill=(30, 26, 34, 255))
d.rectangle([int(2.0 * C), hy0 + 18, int(2.0 * C) + 46, hy0 + 64], fill=(78, 52, 44, 255), outline=(12, 8, 8, 255), width=4)
d.rectangle([int(2.0 * C) + 8, hy0 + 26, int(2.0 * C) + 38, hy0 + 56], fill=(12, 10, 10, 255))
# front wall face + overhang shadow
d.rectangle([hx0, hy1 - 34, hx1, hy1], fill=(58, 64, 70, 255), outline=(10, 10, 12, 255), width=4)
for xx in range(hx0, hx1, 30):
    d.line([xx, hy1 - 32, xx, hy1 - 2], fill=(36, 40, 46, 255), width=2)
d.rectangle([hx0, hy1, hx1, hy1 + 22], fill=(0, 0, 0, 120))
# ticket booth window at col 5 (x 5..6)
bx = int(5 * C)
d.rectangle([bx + 6, hy1 - 70, bx + C - 6, hy1 + 6], fill=(92, 62, 40, 255), outline=(12, 8, 6, 255), width=5)
d.rectangle([bx + 16, hy1 - 60, bx + C - 16, hy1 - 22], fill=(170, 220, 190, 255), outline=(12, 8, 6, 255), width=3)
d.line([bx + C // 2, hy1 - 60, bx + C // 2, hy1 - 22], fill=(12, 8, 6, 255), width=3)
d.rectangle([bx + 2, hy1 - 6, bx + C - 2, hy1 + 10], fill=(120, 86, 54, 255), outline=(12, 8, 6, 255), width=3)  # counter
# a couple of windows
for wx in (int(1.2 * C), int(3.2 * C), int(7.2 * C)):
    d.rectangle([wx, hy1 - 30, wx + 40, hy1 - 6], fill=(150, 180, 160, 255), outline=(10, 10, 10, 255), width=3)
    d.line([wx + 20, hy1 - 30, wx + 20, hy1 - 6], fill=(10, 10, 10, 255), width=2)

# ---- fence + dead trees along the woods edge (right side, rows 1..3.5) ----
fy = int(3.35 * C)
for x in range(hx1 + 10, W, 34):
    d.rectangle([x, fy - 34, x + 8, fy + 6], fill=(64, 48, 34, 255), outline=(14, 10, 8, 255), width=2)
d.rectangle([hx1, fy - 22, W, fy - 16], fill=(70, 52, 36, 255), outline=(14, 10, 8, 255), width=2)
d.rectangle([hx1, fy - 6, W, fy], fill=(70, 52, 36, 255), outline=(14, 10, 8, 255), width=2)

deadtree(int(12.6 * C), int(1.9 * C), 70); deadtree(int(17.2 * C), int(1.6 * C), 64)
# bottom: dark ditch/void with reeds
for i in range(40):
    x = rr.randint(0, W); y2 = rr.randint(int(10.15 * C), H)
    d.line([x, y2, x + rr.randint(-6, 6), y2 - rr.randint(10, 26)], fill=(30, 40, 26, 255), width=2)

# ---- benches (cols 1 & 13, row 5), the far lamp post (col 17 row 5) ----
def bench(cx, cy):
    d.rectangle([cx - 54, cy - 18, cx + 54, cy + 18], fill=(0, 0, 0, 90))
    d.rectangle([cx - 56, cy - 22, cx + 52, cy + 12], fill=(98, 66, 40, 255), outline=(14, 10, 6, 255), width=4)
    for k in range(3):
        d.line([cx - 52, cy - 14 + k * 10, cx + 48, cy - 14 + k * 10], fill=(52, 34, 20, 255), width=2)
    d.rectangle([cx - 58, cy - 30, cx + 54, cy - 20], fill=(70, 46, 28, 255), outline=(14, 10, 6, 255), width=3)
    for ex in (cx - 52, cx + 44):
        d.rectangle([ex, cy - 32, ex + 8, cy + 14], fill=(30, 30, 34, 255), outline=(8, 8, 8, 255), width=2)
bench(int(1.5 * C), int(5.5 * C)); bench(int(13.5 * C), int(5.5 * C))
lx, ly = int(17.5 * C), int(5.5 * C)
d.ellipse([lx - 26, ly - 10, lx + 26, ly + 14], fill=(0, 0, 0, 110))
d.ellipse([lx - 16, ly - 16, lx + 16, ly + 16], fill=(34, 34, 40, 255), outline=(6, 6, 8, 255), width=4)
d.ellipse([lx - 9, ly - 9, lx + 9, ly + 9], fill=(170, 255, 220, 255), outline=(20, 40, 34, 255), width=2)
# crates & luggage near the booth / far end
def crate(x, y, s=46):
    d.rectangle([x + 6, y + 6, x + s + 6, y + s + 6], fill=(0, 0, 0, 100))
    d.rectangle([x, y, x + s, y + s], fill=(110, 80, 48, 255), outline=(14, 10, 6, 255), width=4)
    d.line([x, y, x + s, y + s], fill=(60, 42, 24, 255), width=4); d.line([x + s, y, x, y + s], fill=(60, 42, 24, 255), width=4)
crate(int(9.2 * C), int(3.62 * C)); crate(int(9.2 * C) + 50, int(3.62 * C) + 6, 38)
def trunk(x, y):
    d.rectangle([x + 5, y + 5, x + 70, y + 45], fill=(0, 0, 0, 100))
    d.rounded_rectangle([x, y, x + 64, y + 40], 6, fill=(70, 36, 34, 255), outline=(12, 6, 6, 255), width=4)
    d.line([x + 20, y, x + 20, y + 40], fill=(150, 120, 60, 255), width=4); d.line([x + 44, y, x + 44, y + 40], fill=(150, 120, 60, 255), width=4)
trunk(int(18.9 * C), int(3.7 * C))


# ---- grime, puddles, leaves, weeds ----
for i in range(6):
    x=rr.randint(0,W); y2=rr.randint(py0+10,py1-20); rw=rr.randint(30,70); rh=rw*rr.uniform(.3,.5)
    d.ellipse([x-rw,y2-rh,x+rw,y2+rh],fill=(20,24,30,70)); d.ellipse([x-rw*.7,y2-rh*.6,x+rw*.5,y2+rh*.2],fill=(120,150,160,40))
for i in range(260):
    x=rr.randint(0,W); y2=rr.randint(0,H); s2=rr.randint(6,12); a=rr.uniform(0,6.28)
    c2=rr.choice([(150,80,30),(120,60,24),(170,110,40),(90,40,20),(140,50,30)])
    pts=[(x+math.cos(a+k*2.1)*s2*(1 if k%2==0 else .5),y2+math.sin(a+k*2.1)*s2*(1 if k%2==0 else .5)) for k in range(6)]
    d.polygon(pts,fill=c2+(220,),outline=(30,14,6,200))
for i in range(90):
    x=rr.randint(0,W); y2=rr.choice([py0+rr.randint(0,6),py1-16+rr.randint(-4,2),fy+rr.randint(2,14)])
    for k in range(3): d.line([x+k*3,y2,x+k*3+rr.randint(-5,5),y2-rr.randint(6,16)],fill=(56,76,44,230),width=2)
# ---- ink pass: darken, soft vignette of mist, slight blur + texture ----
img = img.filter(ImageFilter.GaussianBlur(.6))
arr = np.asarray(img).astype(np.float32)
tex = (noise(W, H, 6, 2, 11) - .5) * 18
arr += tex[..., None]
gr = noise(W, H, 90, 4, 21)
arr *= (0.72 + 0.4 * gr)[..., None]
# paper-ish desaturation toward the VTT look
g = arr.mean(axis=2, keepdims=True)
arr = arr * .82 + g * .18
# misty bands at the far edges
mist = np.clip((np.abs(Y - H * .5) / (H * .5)) ** 3, 0, 1) * .25
arr = arr * (1 - mist[..., None]) + np.array([150, 170, 175]) * mist[..., None] * .5
img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
img = img.filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
out = sys.argv[1] if len(sys.argv) > 1 else 'build/station.webp'
img.save(out, 'WEBP', quality=86, method=6)
img.resize((W // 2, H // 2)).save(out.replace('.webp', '_prev.png'))
print('ok', out)

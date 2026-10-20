"""v8 art pass: re-embed monster / NPC / PC art from the 300-400px originals.

usage: python3 tools/build_v8_art.py "<…>/Crooked Moon/_build/src"
writes build/assets_v8.js  (window.ASSETS_V8 = {mon, por, npc, pc})
  mon : painted monster art, longest side 300, WebP
  por : NPC bust portraits, 128x128 crisp pixel (64 colours) PNG
  npc : NPC full-body art, height 300, WebP (cast / codex / walk-ups)
  pc  : {card: 400-tall WebP, por: 128 crisp pixel bust}
The old 64px/120px art in build/assets.js is stripped by build.py when this file exists."""
import io, base64, json, glob, os, sys
from PIL import Image, ImageEnhance

SRC = sys.argv[1] if len(sys.argv) > 1 else 'src'

def b64(im, fmt='PNG', **kw):
    b = io.BytesIO(); im.save(b, fmt, **kw)
    return 'data:image/%s;base64,' % fmt.lower() + base64.b64encode(b.getvalue()).decode()

def webp(im, q=82):
    return b64(im, 'WEBP', quality=q, method=4)

def crisp(im, colors=64):
    """pixel portrait: hard alpha, median-cut palette, no dither"""
    im = im.convert('RGBA')
    a = im.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    rgb = Image.new('RGB', im.size, (0, 0, 0)); rgb.paste(im.convert('RGB'), mask=a)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.06)
    q = rgb.quantize(colors=colors - 1, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGBA')
    q.putalpha(a); return b64(q, 'PNG', optimize=True)

def bust(im, crop=None):
    im = im.convert('RGBA'); w, h = im.size
    if crop:
        side, cx, y0 = crop
    else:
        side = int(min(w, h) * 0.92); cx = w // 2; y0 = 0
    return im.crop((cx - side // 2, y0, cx + side // 2, y0 + side))

# bust crops tuned by hand for the art whose head isn't top-centre (in source px, 300 tall)
CROP = {'Adela_Druskenvald': (66, 76, 2), 'Phillip_Druskenvald': (66, 92, 0), 'The_Vagrant': (124, 100, 8)}

out = {'mon': {}, 'por': {}, 'npc': {}, 'pc': {}}
for f in sorted(glob.glob(os.path.join(SRC, 'mon', '*.png'))):
    n = os.path.basename(f)[:-4].split('_', 1)[1]
    im = Image.open(f).convert('RGBA'); im.thumbnail((300, 300), Image.LANCZOS)
    out['mon'][n] = webp(im, 80)
for f in sorted(glob.glob(os.path.join(SRC, 'npc', '*.png'))):
    n = os.path.basename(f)[4:-4]
    im = Image.open(f).convert('RGBA')
    full = im.copy(); full.thumbnail((300, 300), Image.LANCZOS)
    out['npc'][n] = webp(full, 78)
    out['por'][n] = crisp(bust(im, CROP.get(n)).resize((128, 128), Image.LANCZOS), 64)
PCMAP = {'Azareth': 'Azareth', 'Krodha': 'Krodha', 'Lucky': 'Lucky', 'Tessie': 'Nessie', 'Poppi': 'poppi'}
for k, fn in PCMAP.items():
    im = Image.open(os.path.join(SRC, 'pc', fn + '.png')).convert('RGBA'); w, h = im.size
    card = im.copy(); card.thumbnail((400, 400), Image.LANCZOS)
    side = int(w * 0.62); cx = w // 2; y0 = int(h * 0.10)
    por = im.crop((cx - side // 2, y0, cx + side // 2, y0 + side)).resize((128, 128), Image.LANCZOS)
    out['pc'][k] = {'card': webp(card, 84), 'por': crisp(por, 64)}

os.makedirs('build', exist_ok=True)
js = 'window.ASSETS_V8=' + json.dumps(out) + ';'
open('build/assets_v8.js', 'w').write(js)
print('assets_v8 KB', len(js) // 1024, {g: len(out[g]) for g in out},
      {g: sum(len(v) if isinstance(v, str) else len(v['card']) + len(v['por']) for v in out[g].values()) // 1024 for g in out})

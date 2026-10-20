"""v7 assets: title art, logo, HD station, embedded fonts -> build/assets_v7.js + build/fonts_v7.css"""
import base64, io, json
from PIL import Image
def webp(im, q=82):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
logo = Image.open('art_v7/cm_logo.png').convert('RGBA'); logo = logo.resize((900, int(900 * logo.height / logo.width)), Image.LANCZOS)
bg = Image.open('art_v7/title_bg.png').convert('RGB')
station = Image.open('build/station.webp').convert('RGB')
A = {'logo': webp(logo, 88), 'title_bg': webp(bg, 80), 'station': webp(station, 86)}
open('build/assets_v7.js', 'w').write('window.ASSETS_V7=' + json.dumps(A) + ';')
F = [('CMTitle', 'jacquard-24-latin-400-normal', 400, 'normal'), ('CMPixel', 'pixelify-sans-latin-400-normal', 400, 'normal'),
     ('CMPixel', 'pixelify-sans-latin-600-normal', 600, 'normal'), ('CMPixel', 'pixelify-sans-latin-700-normal', 700, 'normal'),
     ('CMLabel', 'silkscreen-latin-400-normal', 400, 'normal'), ('CMLabel', 'silkscreen-latin-700-normal', 700, 'normal'),
     ('CMFell', 'im-fell-english-latin-400-normal', 400, 'normal'), ('CMFell', 'im-fell-english-latin-400-italic', 400, 'italic'),
     ('CMFellSC', 'im-fell-english-sc-latin-400-normal', 400, 'normal')]
css = ''
jb = base64.b64encode(open('art_v7/jersey-10-latin-400-normal.woff2', 'rb').read()).decode()
for fam, f, w, st in F:
    b = base64.b64encode(open('art_v7/' + f + '.woff2', 'rb').read()).decode()
    ur = ';unicode-range:U+0-2F,U+3A-FFFF' if fam == 'CMPixel' else ''
    css += "@font-face{font-family:'%s';src:url(data:font/woff2;base64,%s) format('woff2');font-weight:%d;font-style:%s;font-display:block%s}\n" % (fam, b, w, st, ur)
    if fam == 'CMPixel':  # Pixelify's 8 reads as S; borrow Jersey 10's digits
        css += "@font-face{font-family:'CMPixel';src:url(data:font/woff2;base64,%s) format('woff2');font-weight:%d;font-style:normal;font-display:block;unicode-range:U+30-39;size-adjust:118%%}\n" % (jb, w)
open('build/fonts_v7.css', 'w').write(css)
print('assets_v7 KB', sum(len(v) for v in A.values()) // 1024, 'fonts KB', len(css) // 1024)

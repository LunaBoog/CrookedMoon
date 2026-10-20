import sys,re
from PIL import Image,ImageDraw,ImageFont
# usage: gridprev.py src cols rows x0 y0 x1 y1 px out [gridfile]
src,c,r,x0,y0,x1,y1,P,out=sys.argv[1:10]
c,r,x0,y0,x1,y1,P=map(int,(c,r,x0,y0,x1,y1,P))
grid=None
if len(sys.argv)>10:
    grid=[l.rstrip('\n') for l in open(sys.argv[10]) if l.strip()!='' ]
im=Image.open(src).convert('RGB')
sx=im.width/c; sy=im.height/r
crop=im.crop((int(x0*sx),int(y0*sy),int((x1+1)*sx),int((y1+1)*sy))).resize(((x1-x0+1)*P,(y1-y0+1)*P),Image.LANCZOS)
W=crop.width+20;H=crop.height+20
can=Image.new('RGB',(W,H));can.paste(crop,(20,20))
d=ImageDraw.Draw(can,'RGBA')
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',11)
except: f=ImageFont.load_default()
for gx in range(x0,x1+1):
    for gy in range(y0,y1+1):
        X=20+(gx-x0)*P;Y=20+(gy-y0)*P
        if grid:
            ch=grid[gy][gx]
            if ch=='#': d.rectangle([X,Y,X+P,Y+P],fill=(255,0,0,90))
            elif ch!='.': d.rectangle([X,Y,X+P,Y+P],fill=(0,120,255,110)); d.text((X+P//2-4,Y+P//2-6),ch,fill=(255,255,255),font=f)
for gx in range(x0,x1+2): d.line([(20+(gx-x0)*P,20),(20+(gx-x0)*P,H)],fill=(255,0,255,140))
for gy in range(y0,y1+2): d.line([(20,20+(gy-y0)*P),(W,20+(gy-y0)*P)],fill=(255,0,255,140))
for gx in range(x0,x1+1): d.text((20+(gx-x0)*P+P//2-6,4),str(gx),fill=(255,255,0),font=f)
for gy in range(y0,y1+1): d.text((2,20+(gy-y0)*P+P//2-6),str(gy),fill=(255,255,0),font=f)
can.save(out)

import io,base64,json,re,glob,os
from PIL import Image, ImageOps, ImageEnhance
T=24
def b64(im,fmt='PNG',**kw):
    b=io.BytesIO(); im.save(b,fmt,optimize=True,**kw); return 'data:image/%s;base64,'%fmt.lower()+base64.b64encode(b.getvalue()).decode()
def retro(im,colors=64,dither=True):
    q=im.convert('RGB').quantize(colors=colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG if dither else Image.Dither.NONE)
    return q
def retro_rgba(im,colors=32):
    im=im.convert('RGBA')
    a=im.getchannel('A').point(lambda v:255 if v>110 else 0)
    rgb=Image.new('RGB',im.size,(0,0,0)); rgb.paste(im.convert('RGB'),mask=a)
    q=rgb.quantize(colors=colors-1,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA')
    q.putalpha(a); return q
MAPS={
 'car_passenger':('GL_10_1_Passenger_Car_24x7',24,7),'car_sleeper':('GL_10_2_Sleeper_Car_24x7',24,7),
 'car_lounge':('GL_10_3_Lounge_Car_24x7',24,7),'car_dining':('GL_10_4_Dining_Car_24x7',24,7),
 'car_mail':('GL_10_5_Mail_Car_24x7',24,7),'car_baggage':('GL_10_6_Baggage_Car_24x7',24,7),
 'car_circus':('GL_10_7_Circus_Car_24x7',24,7),'car_tender':('GL_10_8_Tender_24x7',24,7),
 'wreckage':('GL_10_9_Ghostlight_Wreckage_33x16',33,16),'founders':("GL_11_1_The_Founder's_Round_22x22",22,22),
 'house1':('GL_12_1_The_Crooked_House_1_21x24',21,24),'house2':('GL_12_2_The_Crooked_House_2_21x24',21,24),
 'house3':('GL_12_3_The_Crooked_House_3_21x24',21,24),'attic':('GL_12_4_The_Crooked_House_4_21x24',21,24),
 'marsh':('GL_15_1_Swamp_Encounters_25x18',25,18),'temple':('GL_19_7_Tomb_of_the_Shrouded_base_22x16',22,16),
 'darkwood':('GL_22_2_Dark_Wood_17x16',17,16),'wytchwood':('GL_24_2_Wytchwood_Encounters_25x18',25,18),
 'village':('village',30,40),
}
out={'maps':{},'por':{},'mon':{},'pc':{}}
sizes={}
for mid,(fn,c,r) in MAPS.items():
    im=Image.open('src/maps/%s.jpg'%fn).convert('RGB').resize((c*T,r*T),Image.LANCZOS)
    if mid=='village':
        g=ImageOps.grayscale(im); duo=ImageOps.colorize(g,black=(22,18,40),mid=(112,98,92),white=(226,208,164))
        im=Image.blend(im,duo,0.55); im=ImageEnhance.Contrast(im).enhance(1.12)
    if mid=='temple':
        im=ImageEnhance.Color(im).enhance(0.55)
    im=ImageEnhance.Contrast(im).enhance(1.05)
    out['maps'][mid]=b64(retro(im,64,True)); sizes[mid]=len(out['maps'][mid])
# region map for travel screen
im=Image.open('src/maps/hollow.jpg').convert('RGB'); im=im.resize((960,624),Image.LANCZOS)
out['hollow']=b64(retro(im,96,True))
# NPC portraits (busts) -> 64x64
def bust(im,full=False,top=0.0):
    im=im.convert('RGBA'); w,h=im.size
    if full: # full-body: take head+shoulders region
        side=int(w*0.9) if w<h*0.5 else int(min(w,h)*0.55)
        side=max(side,int(h*0.26)); cx=w//2; y0=int(h*top)
        im=im.crop((cx-side//2,y0,cx+side//2,y0+side))
    else:
        side=min(w,h); im=im.crop(((w-side)//2,0,(w-side)//2+side,side))
    return im
FULL={'NPC_Adela_Druskenvald':0.02,'NPC_Phillip_Druskenvald':0.03,'NPC_The_Vagrant':0.05}
for f in sorted(glob.glob('src/npc/*.png')):
    n=os.path.basename(f)[4:-4]
    im=Image.open(f)
    CROP={'Adela_Druskenvald':(62,62,22),'Phillip_Druskenvald':(66,75,2),'The_Vagrant':(150,120,20)}
    if n in CROP:
        side,cx,y0=CROP[n]; im=im.convert('RGBA').crop((cx-side//2,y0,cx+side//2,y0+side))
    else: im=bust(im)
    im=im.resize((64,64),Image.LANCZOS)
    out['por'][n]=b64(retro_rgba(im,40))
for f in sorted(glob.glob('src/mon/*.png')):
    n=os.path.basename(f)[:-4].split('_',1)[1]
    im=Image.open(f).convert('RGBA'); im.thumbnail((120,120),Image.LANCZOS)
    out['mon'][n]=b64(retro_rgba(im,40))
    # also portrait crop for dialog
PCMAP={'Azareth':'Azareth','Krodha':'Krodha','Lucky':'Lucky','Tessie':'Nessie','Poppi':'poppi'}
for k,fn in PCMAP.items():
    im=Image.open('src/pc/%s.png'%fn).convert('RGBA'); w,h=im.size
    card=im.copy(); card.thumbnail((96,144),Image.LANCZOS)
    # portrait: upper-middle square
    side=int(w*0.62); cx=w//2; y0=int(h*0.10)
    por=im.crop((cx-side//2,y0,cx+side//2,y0+side)).resize((64,64),Image.LANCZOS)
    out['pc'][k]={'card':b64(retro_rgba(card,48)),'por':b64(retro_rgba(por,40))}
js='window.ASSETS='+json.dumps(out)+';'
open('build/assets.js','w').write(js)
print('total KB',len(js)//1024)
print({k:v//1024 for k,v in sizes.items()})

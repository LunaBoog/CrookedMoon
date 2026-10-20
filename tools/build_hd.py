"""v6.1 HD map pipeline. Rebuilds the map art in build/assets.js from the ORIGINAL
Crooked Moon VTT battlemaps (140 px per grid square) — no colour quantising, no
dithering — and adds the arrival-cutscene art (a top-down train cut from the real
car maps + the Chapter 8 'Ghostlight Express' scene painting).
usage: python3 tools/build_hd.py <VTT_Asset_Pack_V2 dir>"""
import io,base64,json,sys,os
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
sys.path.insert(0,os.path.dirname(__file__))
from train_sprite import cut
V=sys.argv[1].rstrip('/');BM=V+'/Maps/Battlemaps/Gridless/WebP/'
def b64(im,q=80,lossless=False):
    b=io.BytesIO();im.save(b,'WEBP',quality=q,method=6,lossless=lossless);return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
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
}
PPC={'car':112}  # px per grid square in the asset; train cars are viewed at 1.5x zoom
txt=open('build/assets.js').read();A=json.loads(txt[len('window.ASSETS='):-1])
sizes={}
def finish(mid,im):
    if mid=='temple':im=ImageEnhance.Color(im).enhance(0.6)
    im=im.filter(ImageFilter.UnsharpMask(radius=1.4,percent=55,threshold=2))
    return im
for mid,(fn,c,r) in MAPS.items():
    ppc=112 if mid.startswith('car_') else 80
    im=Image.open(BM+fn+'.webp').convert('RGB').resize((c*ppc,r*ppc),Image.LANCZOS)
    A['maps'][mid]=b64(finish(mid,im),80);sizes[mid]=len(A['maps'][mid])//1024
# Wickermoor village: the region map at its native 50 px/square, lighter sepia than v5
im=Image.open(V+'/Maps/Region Maps/MAP_11_2_Wickermoor_Village.jpeg').convert('RGB').resize((1500,2000),Image.LANCZOS)
g=ImageOps.grayscale(im);duo=ImageOps.colorize(g,black=(22,18,40),mid=(112,98,92),white=(226,208,164))
im=Image.blend(im,duo,0.35);im=ImageEnhance.Contrast(im).enhance(1.08).filter(ImageFilter.UnsharpMask(radius=1.2,percent=50,threshold=2))
A['maps']['village']=b64(im,82);sizes['village']=len(A['maps']['village'])//1024
im=Image.open(V+'/Maps/Region Maps/MAP_Wickermoor_Hollow.jpeg').convert('RGB').resize((1600,1040),Image.LANCZOS)
A['hollow']=b64(im,80)
# the arrival: a top-down train cut from the real cars (dining, passenger, tender+locomotive)
parts=[cut(BM+f+'.webp') for f in ['GL_10_4_Dining_Car_24x7','GL_10_1_Passenger_Car_24x7','GL_10_8_Tender_24x7']]
H=240;gap=-6;parts=[p.resize((int(p.width*H/p.height),H),Image.LANCZOS) for p in parts]
W=sum(p.width for p in parts)+gap*(len(parts)-1);strip=Image.new('RGBA',(W,H),(0,0,0,0));x=0
for p in parts: strip.alpha_composite(p,(x,0));x+=p.width+gap
A['train']={'strip':b64(strip,82),'w':W,'h':H,'cars':[p.width for p in parts]}
sc=Image.open(V+'/Art/Scenes/Adventure/SCENE_Chapter8_Ghostlight_Express.jpeg').convert('RGB').resize((1280,720),Image.LANCZOS)
A['scene_train']=b64(sc,78)
js='window.ASSETS='+json.dumps(A)+';';open('build/assets.js','w').write(js)
print('assets KB',len(js)//1024,sizes,'train',W,'x',H)

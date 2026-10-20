"""Cut the real Ghostlight Express cars out of the VTT battlemaps: the shroud
background is every non-black region touching the image border; the car's
black hull outline separates it from the interior."""
import sys,numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
def cut(path):
    im=Image.open(path).convert('RGB');a=np.asarray(im).astype(int);lum=a.max(2)
    nonblack=lum>34
    lab,n=ndimage.label(nonblack)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    # black regions connected only to the background (shadows of nothing) also go
    lab2,n2=ndimage.label(~bg)
    sizes=ndimage.sum(np.ones_like(lab2),lab2,range(1,n2+1));keep=1+int(np.argmax(sizes))
    alpha=(lab2==keep).astype('uint8')*255
    al=Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2))
    rgba=im.convert('RGBA');rgba.putalpha(al);return rgba.crop(Image.fromarray(alpha).getbbox())
if __name__=='__main__':
    out=sys.argv[1]
    for f in sys.argv[2:]:
        r=cut(f);print(f.split('/')[-1],r.size);r.save(out+'/cut_'+f.split('/')[-1].split('_')[2]+'.png')

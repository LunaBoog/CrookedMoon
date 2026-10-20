import sys,json
from PIL import Image
import numpy as np
def auto(src,c,r,pct,smooth=1,bias=None):
    im=Image.open(src).convert('RGB').resize((c*16,r*16),Image.LANCZOS)
    a=np.asarray(im.convert('L')).astype(float)
    lum=a.reshape(r,16,c,16).mean(axis=(1,3))
    sd=a.reshape(r,16,c,16).std(axis=(1,3))
    score=lum-0.6*sd
    th=np.percentile(score,pct)
    g=(score>=th).astype(int)
    for _ in range(smooth):
        p=np.pad(g,1,mode='edge'); s=sum(p[1+dy:r+1+dy,1+dx:c+1+dx] for dy in(-1,0,1) for dx in(-1,0,1))
        g=np.where(s>=5,1,np.where(s<=3,0,g))
    return g
def carve(g,pts):
    r,c=g.shape
    # connect all pts to first via L-shaped carve if not connected
    from collections import deque
    def comp(start):
        seen={start};q=deque([start])
        while q:
            x,y=q.popleft()
            for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny=x+dx,y+dy
                if 0<=nx<c and 0<=ny<r and g[ny,nx] and (nx,ny) not in seen: seen.add((nx,ny));q.append((nx,ny))
        return seen
    for (x,y) in pts: g[y,x]=1
    base=pts[0]
    for p in pts[1:]:
        s=comp(base)
        if p in s: continue
        # carve from nearest cell in s to p
        best=min(s,key=lambda q:abs(q[0]-p[0])+abs(q[1]-p[1]))
        x,y=best
        while x!=p[0]: x+=1 if p[0]>x else -1; g[y,x]=1
        while y!=p[1]: y+=1 if p[1]>y else -1; g[y,x]=1
    return g
def tostr(g): return [''.join('.' if v else '#' for v in row) for row in g]
if __name__=='__main__':
    src,c,r,pct,out=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),float(sys.argv[4]),sys.argv[5]
    pts=json.loads(sys.argv[6]) if len(sys.argv)>6 else []
    g=auto(src,c,r,pct,2)
    if pts: g=carve(g,[tuple(p) for p in pts])
    s=tostr(g); open(out,'w').write('\n'.join(s)+'\n'); print('\n'.join(s))

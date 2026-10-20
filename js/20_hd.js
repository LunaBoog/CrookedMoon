/* ================================= hd.js (v6.1) ========================= *
 * The sharper look. The world and battle canvases now render at the screen's
 * real resolution (RS = render scale) instead of 480x336 blown up 3-4x; the
 * maps are the original VTT battlemaps (tools/build_hd.py) drawn smoothly;
 * the little pixel people stay pixel-crisp and get a dark outline + soft rim
 * so NPCs read clearly against busy art. The station arrival uses the real
 * Ghostlight Express: the Chapter 8 scene painting, then the actual cars
 * (dining · passenger · tender + locomotive) rolling in on the rails. */
let RS=1;
const HD={outline:true,rim:true,dim:.12,cap:4,ft:[]};
function hdResize(){
  const dpr=window.devicePixelRatio||1,r=clamp(Math.ceil(VSCALE*dpr-.05),1,HD.cap);
  if(r===RS&&cv.width===VW*r)return;RS=r;
  cv.width=VW*RS;cv.height=VH*RS;ctx.imageSmoothingEnabled=false;
  light.width=VW*RS;light.height=VH*RS;
  bcv.width=VW*RS;bcv.height=VH*RS;bx.imageSmoothingEnabled=false;
}
{const _sc=sizeCanvas;sizeCanvas=function(){_sc();hdResize();};}
window.addEventListener("resize",hdResize);
{const _db=drawBattle;drawBattle=function(){bx.setTransform(RS,0,0,RS,0,0);bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality="high";_db();};}
{const _dw=drawWorld;drawWorld=function(t){ctx.setTransform(RS,0,0,RS,0,0);ctx.imageSmoothingEnabled=false;_dw(t);drawTrainGlow(t);drawCine(t);hdBudget(t);};}
/* weak device? if the world can't hold ~40fps, step the render scale down (never below 2x) */
function hdBudget(t){const F=HD.ft;if(F.last&&!document.hidden){const d=t-F.last;if(d<250)F.push(d);}F.last=t;
  if(F.length>=120){const avg=F.reduce((a,b)=>a+b,0)/F.length;F.length=0;
    if(avg>25&&RS>2){HD.cap=RS-1;hdResize();}else if(avg>25&&HD.rim)HD.rim=false;}}
function smooth(c,on){c.imageSmoothingEnabled=on;if(on)c.imageSmoothingQuality="high";}

/* ---- sprite outlines: each sprite is painted into a small tile, then stamped
 *      onto the world with a dark 1px ring (and a faint moon-coloured rim) ---- */
const TIL=document.createElement("canvas"),tilx=TIL.getContext("2d");
const SIL=document.createElement("canvas"),silx=SIL.getContext("2d");
let SHADOW_C=null; // shadows go straight to the world so they don't get outlined
const O4=[[1,0],[-1,0],[0,1],[0,-1]],BOX={x:-14,y:-30,w:52,h:60}; // world px around a cell's top-left
function drawOutlined(c,item,fn){
  if(!HD.outline||item.x===undefined){fn(c);return;}
  const m=c.getTransform(),a=m.a,o=Math.max(1,Math.round(a*.75));
  const DX=Math.floor(a*(item.x+BOX.x)+m.e)-2*o,DY=Math.floor(m.d*(item.y+BOX.y)+m.f)-2*o;
  const W=Math.ceil(BOX.w*a)+4*o,H=Math.ceil(BOX.h*m.d)+4*o;
  if(DX>c.canvas.width||DY>c.canvas.height||DX+W<0||DY+H<0)return;
  if(TIL.width<W||TIL.height<H){TIL.width=SIL.width=Math.max(W,TIL.width);TIL.height=SIL.height=Math.max(H,TIL.height);}
  tilx.setTransform(1,0,0,1,0,0);tilx.globalAlpha=1;tilx.globalCompositeOperation="source-over";tilx.clearRect(0,0,W,H);
  tilx.setTransform(a,0,0,m.d,m.e-DX,m.f-DY);tilx.imageSmoothingEnabled=false;
  SHADOW_C=c;try{fn(tilx);}finally{SHADOW_C=null;}
  silx.setTransform(1,0,0,1,0,0);silx.globalCompositeOperation="source-over";silx.clearRect(0,0,W,H);silx.drawImage(TIL,0,0,W,H,0,0,W,H);
  silx.globalCompositeOperation="source-in";
  c.save();c.setTransform(1,0,0,1,0,0);
  if(HD.rim){silx.fillStyle="#f1dca0";silx.fillRect(0,0,W,H);c.globalAlpha=.24;O4.forEach(([dx,dy])=>c.drawImage(SIL,0,0,W,H,DX+dx*o*2,DY+dy*o*2,W,H));}
  silx.fillStyle="#06050b";silx.fillRect(0,0,W,H);c.globalAlpha=.95;O4.forEach(([dx,dy])=>c.drawImage(SIL,0,0,W,H,DX+dx*o,DY+dy*o,W,H));
  c.globalAlpha=1;c.drawImage(TIL,0,0,W,H,DX,DY,W,H);c.restore();
}

/* ---- the Ghostlight Express pulls in (station) ---- */
function trainGeom(){const A=(window.ASSETS||{}).train;const tr=STAGE.train;if(!A||!tr)return null;
  const s=tr.h/A.h;return {A,s,w:A.w*s,y:tr.y-tr.h/2,lampX:tr.x+A.w*s*.792,lampY:tr.y,noseX:tr.x+A.w*s};}
function drawTrainStage(c,t){const tr=STAGE.train;if(!tr)return;const im=IMG.train_strip;if(!im||!trainGeom())return;
  const now=performance.now(),p=clamp((now-tr.t0)/tr.dur,0,1),e=1-Math.pow(1-p,3);tr.x=lerp(tr.x0,tr.x1,e);tr.p=p;
  const G=trainGeom(),dt=Math.min(.05,(now-(tr.last||now))/1000);tr.last=now;
  c.save();
  c.fillStyle="rgba(0,0,0,.5)";c.beginPath();c.ellipse(tr.x+G.w/2,tr.y+tr.h*.42,G.w/2,6,0,0,7);c.fill();
  smooth(c,true);c.drawImage(im,tr.x,G.y,G.w,tr.h);smooth(c,false);
  // steam from the stack (trails behind while moving) + mist curling off the rails
  tr.puffs=tr.puffs||[];const spd=(1-p)*3;
  if(Math.random()<(.25+spd*.4))tr.puffs.push({x:G.lampX+G.w*.06,y:tr.y+rnd(-8,8),r:rnd(6,12),a:.5,vx:-rnd(10,30)*(1+spd),vy:rnd(-12,-4)});
  tr.puffs.forEach(f=>{f.x+=f.vx*dt;f.y+=f.vy*dt;f.r+=dt*14;f.a-=dt*.28;});tr.puffs=tr.puffs.filter(f=>f.a>0);
  tr.puffs.forEach(f=>{c.fillStyle=`rgba(150,255,220,${f.a*.35})`;c.beginPath();c.arc(f.x,f.y,f.r,0,7);c.fill();});
  c.restore();
}
function drawTrainGlow(t){const tr=STAGE.train;if(!tr||STAGE.cine)return;const G=trainGeom();if(!G)return;
  const sx=v=>(v-CAM.x)*CAM.z,sy=v=>(v-CAM.y)*CAM.z,c=ctx;const fl=1+.06*Math.sin(t/90);
  c.save();c.globalCompositeOperation="lighter";
  const lx2=sx(G.lampX),ly2=sy(G.lampY),R=46*fl;let g=c.createRadialGradient(lx2,ly2,2,lx2,ly2,R);g.addColorStop(0,"rgba(150,255,225,.55)");g.addColorStop(1,"rgba(0,80,60,0)");c.fillStyle=g;c.fillRect(lx2-R,ly2-R,R*2,R*2);
  // headlamp beam ahead of the nose
  const nx=sx(G.noseX)-6,ny=ly2;g=c.createLinearGradient(nx,0,nx+170,0);g.addColorStop(0,"rgba(120,255,210,.28)");g.addColorStop(1,"rgba(120,255,210,0)");
  c.fillStyle=g;c.beginPath();c.moveTo(nx,ny-8);c.lineTo(nx+170,ny-40);c.lineTo(nx+170,ny+40);c.lineTo(nx,ny+8);c.fill();
  c.restore();
}
/* full-screen cinematic of the Chapter 8 painting (Ken Burns push toward the lamp) */
function drawCine(t){const C=STAGE.cine;if(!C)return;const now=performance.now(),k=clamp((now-C.t0)/C.dur,0,1);
  const a=C.out?clamp(1-(now-C.out)/600,0,1):clamp((now-C.t0)/700,0,1);if(C.out&&a<=0){STAGE.cine=null;return;}
  const c=ctx,im=IMG.scene_train;c.save();c.globalAlpha=a;c.fillStyle="#000";c.fillRect(0,0,VW,VH);
  if(im){const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const base=Math.max(VW/im.width,VH/im.height),z=base*lerp(1.02,1.38,e);
    const fx=lerp(.55,.40,e)*im.width,fy=lerp(.5,.43,e)*im.height;let ox=VW/2-fx*z,oy=VH/2-fy*z;
    ox=clamp(ox,VW-im.width*z,0);oy=clamp(oy,VH-im.height*z,0);
    smooth(c,true);c.drawImage(im,ox,oy,im.width*z,im.height*z);smooth(c,false);
    // the lamp breathes
    const lx2=ox+.385*im.width*z,ly2=oy+.40*im.height*z,R=60*z/base*(1+.08*Math.sin(t/110));
    c.globalCompositeOperation="lighter";const g=c.createRadialGradient(lx2,ly2,2,lx2,ly2,R);g.addColorStop(0,"rgba(140,255,220,.35)");g.addColorStop(1,"rgba(0,60,50,0)");c.fillStyle=g;c.fillRect(lx2-R,ly2-R,R*2,R*2);c.globalCompositeOperation="source-over";}
  // fog streaming past
  C.fog=C.fog||Array.from({length:18},()=>({x:rnd(0,VW),y:rnd(VH*.45,VH),r:rnd(30,70),v:rnd(40,110),a:rnd(.05,.12)}));
  C.fog.forEach(f=>{f.x-=f.v/60;if(f.x<-f.r)f.x=VW+f.r;c.save();c.translate(f.x,f.y);c.scale(1,.3);const g=c.createRadialGradient(0,0,0,0,0,f.r);g.addColorStop(0,`rgba(190,230,225,${f.a*1.6})`);g.addColorStop(1,"rgba(190,230,225,0)");c.fillStyle=g;c.fillRect(-f.r,-f.r,f.r*2,f.r*2);c.restore();});
  // letterbox + title
  const bar=lerp(0,30,clamp((now-C.t0)/600,0,1));c.fillStyle="#000";c.fillRect(0,0,VW,bar);c.fillRect(0,VH-bar,VW,bar);
  const ta=clamp((now-C.t0-1400)/900,0,1);if(ta>0){c.globalAlpha=a*ta;c.textAlign="center";
    c.font="bold 7px monospace";c.fillStyle="#9fe0b0";c.fillText("OUT OF THE MIST",VW/2,VH-38);
    c.font="bold 16px monospace";c.fillStyle="#000";c.fillText("THE GHOSTLIGHT EXPRESS",VW/2+1,VH-19);c.fillStyle="#f1dca0";c.fillText("THE GHOSTLIGHT EXPRESS",VW/2,VH-20);c.textAlign="left";}
  c.restore();
}
async function trainCinematic(){
  STAGE.cine={t0:performance.now(),dur:5600};
  SFX.whistle();await sleep(1500);shake(3);await sleep(1500);SFX.whistle();await sleep(2400);
  STAGE.cine.out=performance.now();await sleep(650);STAGE.cine=null;
}
async function trainPullsIn(){
  const A=(window.ASSETS||{}).train;if(!A){await sleep(1200);return;}
  const h=60,s=h/A.h,w=A.w*s;
  // stop with the locomotive's nose just inside the right edge, so its lamp is on screen
  const M=curMap(),stopAt=Math.min(M.w*T,VW)-10-w;
  STAGE.train={x0:-w-40,x1:stopAt,x:-w-40,y:9*T,h,t0:performance.now(),dur:4200};
  const chug=setInterval(()=>{const tr=STAGE.train;if(!tr||tr.p>=1){clearInterval(chug);return;}if(typeof noise==="function")noise(.07,.05*(1-tr.p)+.01,260);shake(1.5*(1-tr.p));},230);
  await sleep(4300);clearInterval(chug);shake(4);if(typeof noise==="function")noise(.6,.05,900); // the hiss of the brakes
}

/* ---- the shroud outside the cars: fewer, fainter streaks so the cars read ---- */
{const _np=newPart;newPart=function(k,init){if(k==="shroud"){return {x:rnd(0,VW),y:rnd(0,VH),vx:-rnd(140,260),vy:0,s:rnd(8,24),a:rnd(.02,.06),c:"180,255,230"};}return _np(k,init);};}
{const _ia=initAmbient;initAmbient=function(){_ia();const M=curMap();if(M.amb==="shroud")AMB.parts.length=Math.min(AMB.parts.length,18);};}

/* ---- train cars: the mist outside the car body sits back, so the car reads ---- */
// car-body extents (in grid cells) measured from the VTT art's black outline (tools/build_hd.py era)
const CAR_BODY={car_baggage:[6.6,16.4],car_circus:[6.6,16.4],car_dining:[6.6,18.4],car_lounge:[6.6,18.4],car_mail:[6.6,16.4],car_passenger:[5.7,19.4],car_sleeper:[6.6,18.4],car_tender:[3.6,19.8]};
function carBody(M){const b=CAR_BODY[M.art];if(!b)return null;return {x:b[0]*T,y:1.72*T,w:(b[1]-b[0])*T,h:3.54*T};}
function dimOutsideCar(c,M){if(M.theme!=="train"||!M.art)return;const b=carBody(M),W=M.w*T,H=M.h*T;if(!b)return;
  c.save();c.fillStyle="rgba(3,10,12,.5)";c.beginPath();c.rect(-200,-200,W+400,H+400);c.rect(b.x,b.y,b.w,b.h);c.fill("evenodd");c.restore();}

/* ============================== v8 · sprites ============================ *
 * The pixel people, redrawn at twice the detail. Every character is painted
 * once per (look, facing, walk frame) into a 40×64 "art pixel" canvas and
 * cached; one art pixel = ¾ of a world pixel (SPR8.S), so at the usual 4×
 * render scale each art pixel is a crisp 3×3 block. Three-tone shading (hue-shifted
 * shadows), real side and back views, a 4-frame walk cycle, blinking.
 * The five PCs (and Caster) are bespoke, matched to their card art; everyone
 * else is built from the same LOOK parameters the v5 renderer used, so no
 * NPC data changed. The old renderer is kept as SPR8.old for fallback. */
const SPR8={on:true,S:.75,cache:new Map(),keys:new WeakMap(),seq:0,AW:40,AH:64,old:{drawChar,drawMonSprite}};

/* ---------------------------------------------------------------- colour */
function hx8(c){c=String(c||"#888");if(c[0]!=="#")return [136,136,136];if(c.length===4)c="#"+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
  const n=parseInt(c.slice(1,7),16);return [(n>>16)&255,(n>>8)&255,n&255];}
function rgb8(a){return "#"+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");}
function mix8(a,b,k){const A=hx8(a),B=hx8(b);return rgb8(A.map((v,i)=>v+(B[i]-v)*k));}
const lo8=(c,k)=>mix8(mix8(c,"#000",k||.3),"#2a1840",.22);   // shadow: darker, nudged toward violet
const hi8=(c,k)=>mix8(c,"#fff2d0",k||.22);                    // light: warmer
const dk8=c=>mix8(c,"#08060c",.62);                           // line / seam

/* ----------------------------------------------------- tiny paint kit */
function kit8(g){
  const R=(x,y,w,h,c)=>{if(w<=0||h<=0||!c)return;g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0);};
  const P=(x,y,c)=>R(x,y,1,1,c);
  // rounded box with simple 3-tone shading: light from top-left
  const B=(x,y,w,h,c,o)=>{o=o||{};R(x,y,w,h,c);
    if(o.round!==0){P(x,y,null);g.clearRect(x,y,1,1);g.clearRect(x+w-1,y,1,1);if(o.round===2){g.clearRect(x,y+h-1,1,1);g.clearRect(x+w-1,y+h-1,1,1);}}
    if(o.shade!==false){R(x+w-(o.sw||2),y+1,o.sw||2,h-1,lo8(c,.28));R(x+1,y+h-1,w-1,1,lo8(c,.34));R(x,y+(o.round!==0?1:0),1,Math.max(1,h-3),hi8(c,.2));}};
  return {R,P,B,g};
}

/* --------------------------------------------------- cache + dispatcher */
function lookKey8(look){
  if(typeof look==="string")return look;
  if(!look)return "none";
  let k=SPR8.keys.get(look);if(!k){k="L"+(++SPR8.seq)+":"+JSON.stringify(look);SPR8.keys.set(look,k);}return k;
}
function frame8(look,dir,f,v){
  const key=lookKey8(look)+"|"+dir+"|"+f+"|"+(v||"");
  let c=SPR8.cache.get(key);if(c)return c;
  c=document.createElement("canvas");c.width=SPR8.AW;c.height=SPR8.AH;const g=c.getContext("2d");
  const L=typeof look==="string"?(LOOK[look]||{}):look||{};
  const flip=dir==="right";const d=flip?"left":dir;
  if(flip){g.translate(SPR8.AW,0);g.scale(-1,1);}
  try{paint8(g,L,d,f,v);}catch(e){console.warn("sprite8",e);}
  SPR8.cache.set(key,c);if(SPR8.cache.size>2400)SPR8.cache.delete(SPR8.cache.keys().next().value);
  return c;
}
function paint8(g,L,d,f,v){
  const k=L.kind||"human";
  const fn=PAINT8[k];if(fn)return fn(g,L,d,f,v);
  return PAINT8.human(g,L,d,f,v);
}
/* walk frame from the clock so movement animates smoothly between tiles */
function walkF8(opt){if(!opt||!opt.moving)return 0;const sp=(typeof KEY!=="undefined"&&KEY.run)?95:150;return Math.floor((performance.now()+(opt.seed||0)*37)/sp)%4;}
function blink8(seed){const t=performance.now()/1000+(seed||0)*1.7;return (t%4.2)<.13?"b":"";}

/* --------------------------------------------------------- new drawChar */
drawChar=function(c,x,y,look,dir,frame,opt){
  opt=opt||{};
  if(!SPR8.on)return SPR8.old.drawChar(c,x,y,look,dir,frame,opt);
  if(typeof look==="string"&&look.startsWith("mon:")){drawMonSprite(c,x,y,look.slice(4),opt);return;}
  const L=typeof look==="string"?(LOOK[look]||{}):(look||{});
  const k=L.kind||"human",t=performance.now();
  const ghost=L.ghost||opt.ghost||k==="dog"||k==="baby"||k==="tiger";
  const f=walkF8(opt);
  const facing=dir||"down";
  let v=blink8(opt.seed);
  if(k==="scarecrow")v=(Math.floor(t/210)%3===0?"g":"")+v;          // Azareth's jack-o'-lantern flickers
  if(k==="goat")v+=hasF("goatFree")?"f":"";                           // the sack comes off
  if(k==="crooked")v="s"+(Math.floor(t/120)%8);                       // the Crooked Man sways
  const im=frame8(look,facing,f,v);
  const bob=opt.moving?0:Math.round(Math.sin(t/420+(opt.seed||0))*.5)*.5;
  c.save();
  if(ghost)c.globalAlpha*=(.7+Math.sin(t/300+(opt.seed||0))*.1);
  // shadow (to the world, not into the outline tile)
  {const sc=SHADOW_C||c,wide=k==="dog"||k==="goat"||k==="tiger"?10:k==="weasel"||k==="cat"?6:8;
    sc.save();sc.globalAlpha=c.globalAlpha;sc.fillStyle=ghost?"rgba(120,255,200,.16)":"rgba(0,0,0,.45)";sc.beginPath();sc.ellipse(x+12,y+22,wide,3,0,0,7);sc.fill();sc.restore();}
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  const S=SPR8.S;c.drawImage(im,x+12-SPR8.AW/2*S,y+22.5-60*S+bob,SPR8.AW*S,SPR8.AH*S);
  c.imageSmoothingEnabled=sm;
  c.restore();
};
/* a baked outline copy (for battles / cards where drawOutlined isn't used) */
function outlined8(src,col){
  const key=src;if(src.v8o)return src.v8o;
  const w=src.width,h=src.height,o=document.createElement("canvas");o.width=w+2;o.height=h+2;const g=o.getContext("2d");
  const s=src.getContext("2d").getImageData(0,0,w,h).data,od=g.createImageData(w+2,h+2),D=od.data,cc=hx8(col||"#07050c");
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:s[(y*w+x)*4+3];
  for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){if(A(x,y)>40)continue;if(A(x-1,y)>40||A(x+1,y)>40||A(x,y-1)>40||A(x,y+1)>40){const i=((y+1)*(w+2)+(x+1))*4;D[i]=cc[0];D[i+1]=cc[1];D[i+2]=cc[2];D[i+3]=235;}}
  g.putImageData(od,0,0);g.drawImage(src,1,1);src.v8o=o;return o;
}
/* draw a character big (battle / menus): scale = screen-ish px per art px in the target ctx's units */
function drawChar8Big(c,cx,footY,look,dir,opt){
  opt=opt||{};const L=typeof look==="string"?(LOOK[look]||{}):(look||{});const k=L.kind||"human",t=performance.now();
  let v=blink8(opt.seed);if(k==="scarecrow")v=(Math.floor(t/210)%3===0?"g":"")+v;if(k==="crooked")v="s"+(Math.floor(t/120)%8);if(k==="goat")v+=hasF("goatFree")?"f":"";
  const im=outlined8(frame8(look,dir||"down",opt.frame||0,v),opt.ol);const s=opt.scale||1;
  const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;
  c.drawImage(im,cx-im.width*s/2,footY-(SPR8.AH-3)*s,im.width*s,im.height*s);c.imageSmoothingEnabled=sm;
}

/* =================================================================== *
 *                              PAINTERS                               *
 * art canvas 40×64, centre x 20, feet on row 59. "left" is painted and *
 * mirrored for "right".                                               *
 * =================================================================== */
const PAINT8={};
const SKIN8=["#f2cfb0","#e8c09c","#d8a880","#b98a60","#8a5a3a","#5a3a2a"];

/* body layout shared by humans and most PCs */
function lay8(L){
  const child=!!L.child,tall=!!L.tall;
  const shoe=2,leg=child?5:tall?10:8,torso=child?10:tall?15:13,head=child?14:15;
  const FY=59,legTop=FY-shoe-leg+1,torsoTop=legTop-torso,headTop=torsoTop-head+1;
  const tw=L.wide?18:child?12:14;
  return {FY,shoe,leg,torso,head,legTop,torsoTop,headTop,tw,tx:20-tw/2,child,tall};
}
/* legs + shoes with the walk cycle */
function legs8(K,y,d,f,col,shoes,o){
  const {R}=K;o=o||{};const lo=lo8(col,.3),sh=shoes||"#2a1d18";
  const top=y.legTop,len=y.leg;
  if(d==="left"){
    const pose=[[0,0],[-3,3],[0,0],[3,-3]][f];
    // back leg first (darker), then front leg
    const legsAt=[[18+pose[1],lo,f===1||f===3?1:0],[19+pose[0],col,0]];
    legsAt.forEach(([x,c,lift])=>{R(x-1,top,4,len-lift,c);R(x+2,top,1,len-lift,lo8(c,.2));R(x-2,top+len-lift,5,2,sh);R(x-2,top+len-lift,1,1,lo8(sh,.1));});
    return;}
  // front / back
  const lift=[[0,0],[2,0],[0,0],[0,2]][f];
  [[15,lift[0]],[21,lift[1]]].forEach(([x,l])=>{R(x,top,4,len-l,col);R(x+3,top,1,len-l,lo);if(d==="down"){R(x-1,top+len-l,5,2,sh);R(x-1,top+len-l,5,1,hi8(sh,.12));}else R(x-1,top+len-l,5,2,lo8(sh,.1));});
}
/* arms: front/back views have two, side has the near one swinging */
function arms8(K,y,d,f,col,skin,o){
  const {R,B}=K;o=o||{};const top=y.torsoTop+1,len=Math.max(6,y.torso-4);const lo=lo8(col,.3);
  if(d==="left"){const sw=[0,-2,0,2][f];
    R(18+sw,top,3,len,col);R(20+sw,top,1,len,lo);if(!o.noHands)R(18+sw,top+len,3,2,skin);return;}
  const sw=[[0,0],[-1,1],[0,0],[1,-1]][f];
  const xl=y.tx-3,xr=y.tx+y.tw;
  R(xl,top+sw[0],3,len,col);R(xl,top+sw[0],1,len,hi8(col,.15));R(xr,top+sw[1],3,len,col);R(xr+2,top+sw[1],1,len,lo);
  if(!o.noHands){R(xl,top+len+sw[0],3,2,skin);R(xr,top+len+sw[1],3,2,skin);}
}
/* torso (or dress) */
function torso8(K,y,d,L,col){
  const {R,B,P}=K;const tw=d==="left"?Math.max(10,y.tw-3):y.tw,tx=20-tw/2,top=y.torsoTop;
  if(L.dress){const hem=y.FY-2,w0=tw,w1=tw+(y.child?4:8);
    for(let r=top;r<=hem;r++){const k=(r-top)/(hem-top),w=Math.round(w0+(w1-w0)*Math.max(0,k-.25)/.75*(k>.25?1:0)),x=20-w/2;R(x,r,w,1,col);R(x+w-2,r,2,1,lo8(col,.3));R(x,r,1,1,hi8(col,.18));}
    R(20-w1/2,hem,w1,1,lo8(col,.38));
    for(let i=0;i<w1;i+=3)P(20-w1/2+i,hem-1,lo8(col,.18));
  }else{B(tx,top,tw,y.torso,col,{round:0});}
  if(L.stripe)for(let i=1;i<y.torso;i+=3)R(tx+1,top+i,tw-3,1,"rgba(255,255,255,.28)");
  if(!L.dress&&!y.child)R(tx,top+y.torso-3,tw,1,lo8(col,.45)); // belt line
  if(L.apron&&d!=="up"){const aw=d==="left"?5:Math.max(6,tw-6),ax=d==="left"?tx:20-aw/2;R(ax,top+3,aw,y.torso+(L.dress?6:-1),L.apron);R(ax+aw-1,top+3,1,y.torso+(L.dress?6:-1),lo8(L.apron,.2));R(ax,top+3,aw,1,hi8(L.apron,.2));}
  if(L.scarf){R(tx,top,tw,3,L.scarf);R(tx,top+2,tw,1,lo8(L.scarf,.3));if(d!=="up")R(tx+(d==="left"?1:tw-4),top+3,3,5,L.scarf);}
  if(L.paint&&d!=="up"){P(tx+3,top+4,"#c33");P(tx+4,top+4,"#c33");P(tx+tw-5,top+7,"#39c");P(tx+tw-4,top+8,"#39c");P(tx+5,top+9,"#e8c040");}
  if(d==="down"&&!L.dress&&!L.apron&&!L.scarf&&!y.child){P(19,top,lo8(col,.4));P(20,top,lo8(col,.4));P(19,top+1,lo8(col,.25));} // collar notch
}
/* head + face + hair; returns head box for hats */
function head8(K,y,d,L,v){
  const {R,P,B,g}=K;const skin=L.skin||"#e8c09c",hair=L.hair||"#3a2a1a",hs=L.hairStyle;
  const top=y.headTop,hh=y.head-1,hw=14,hx=13;
  const lo=lo8(skin,.24);
  if(d==="left"){
    B(hx+1,top+1,hw-1,hh,skin,{sw:1});P(hx,top+8,skin);P(hx,top+9,lo);         // profile + nose
    R(hx+1,top+hh,4,1,lo);                                                     // jaw
    if(!v.includes("b")){R(hx+2,top+7,1,2,"#1a1018");}else R(hx+2,top+8,2,1,lo8(skin,.4));
    P(hx+2,top+11,"#8a4a40");                                                   // mouth
    R(hx+8,top+7,2,3,lo);                                                       // ear
    if(L.glasses){R(hx+1,top+6,3,1,"#e8e8f0");R(hx+1,top+9,3,1,"#e8e8f0");R(hx+1,top+6,1,4,"#e8e8f0");R(hx+4,top+7,5,1,"#8a8a98");}
  }else if(d==="down"){
    B(hx,top+1,hw,hh,skin,{sw:1});R(hx+1,top+hh,hw-2,1,lo);
    if(!v.includes("b")){R(hx+2,top+7,2,2,"#1a1018");R(hx+10,top+7,2,2,"#1a1018");P(hx+2,top+7,"#4a3a58");P(hx+10,top+7,"#4a3a58");}
    else{R(hx+2,top+8,2,1,lo8(skin,.45));R(hx+10,top+8,2,1,lo8(skin,.45));}
    R(hx+6,top+12,2,1,"#8a4a40");P(hx+6,top+10,lo);
    g.fillStyle="rgba(230,110,110,.32)";g.fillRect(hx+1,top+10,2,1);g.fillRect(hx+11,top+10,2,1);
    if(L.glasses){R(hx+1,top+6,4,1,"#e8e8f0");R(hx+9,top+6,4,1,"#e8e8f0");R(hx+1,top+9,4,1,"#e8e8f0");R(hx+9,top+9,4,1,"#e8e8f0");R(hx+1,top+6,1,4,"#e8e8f0");R(hx+12,top+6,1,4,"#e8e8f0");R(hx+5,top+7,4,1,"#b8b8c8");}
  }else{B(hx,top+1,hw,hh,skin,{sw:1});}
  // hair
  if(hs!=="bald"){
    const H=hair,Hl=lo8(hair,.3),Hh=hi8(hair,.18);
    if(d==="up"){R(hx-1,top-1,hw+2,hh-2,H);R(hx+hw-1,top,2,hh-3,Hl);R(hx,top-1,hw-2,1,Hh);
      if(hs==="long"||hs==="braid"||hs==="curly")R(hx,top+hh-3,hw,7,H);
      if(hs==="bun"){R(hx+4,top-4,6,4,H);R(hx+5,top-4,3,1,Hh);}
      if(hs==="braid"){R(hx+6,top+hh+3,3,9,H);for(let i=0;i<9;i+=2)P(hx+7,top+hh+3+i,Hl);}
    }else if(d==="left"){
      R(hx+1,top-1,hw,4,H);R(hx+6,top+2,hw-5,hs==="long"||hs==="curly"?14:hs==="bob"?10:7,H);R(hx+hw-1,top+1,2,hs==="long"?15:8,Hl);R(hx+2,top-1,hw-3,1,Hh);
      R(hx+1,top+3,2,2,H);                                                     // fringe
      if(hs==="bun"){R(hx+10,top-3,5,5,H);P(hx+11,top-3,Hh);}
      if(hs==="wild"){R(hx,top-3,hw+2,3,H);P(hx+2,top-4,H);P(hx+7,top-4,H);P(hx+12,top-4,H);R(hx+hw,top+2,2,6,Hl);}
      if(hs==="braid"){R(hx+hw-2,top+8,3,14,H);for(let i=0;i<14;i+=2)P(hx+hw-1,top+8+i,Hl);}
      if(hs==="curly"){for(let i=0;i<5;i++)P(hx+hw+1,top+3+i*3,Hl);}
    }else{
      R(hx-1,top-1,hw+2,4,H);R(hx,top-1,hw,1,Hh);R(hx-1,top+3,2,hs==="long"||hs==="curly"?13:hs==="bob"?9:5,H);R(hx+hw-1,top+3,2,hs==="long"||hs==="curly"?13:hs==="bob"?9:5,Hl);
      // fringe with a ragged edge
      for(let i=0;i<hw;i++)if(i%3!==1)P(hx+i,top+3,H);
      if(hs==="bun"){R(hx+4,top-4,6,4,H);R(hx+5,top-4,3,1,Hh);}
      if(hs==="wild"){R(hx-2,top-3,hw+4,3,H);P(hx,top-4,H);P(hx+5,top-5,H);P(hx+9,top-4,H);P(hx+13,top-5,H);R(hx-2,top+2,2,6,H);R(hx+hw,top+2,2,6,Hl);}
      if(hs==="braid"){R(hx+hw,top+4,3,16,H);for(let i=0;i<16;i+=2)P(hx+hw+1,top+4+i,Hl);}
      if(hs==="curly"){for(let i=0;i<5;i++){P(hx-2,top+3+i*3,H);P(hx+hw+1,top+3+i*3,Hl);}}
    }
  }
  // facial hair
  if(L.beard&&d!=="up"){const bx=d==="left"?hx+1:hx+1,bw=d==="left"?7:hw-2;R(bx,top+10,bw,5,L.beard);R(bx+1,top+15,bw-2,2,L.beard);R(bx+bw-2,top+10,2,6,lo8(L.beard,.3));if(d==="down")R(hx+5,top+11,4,1,"#5a2a28");}
  if(L.mustache&&d!=="up"){const mc=hair==="#999"?"#aaa":hair;if(d==="left")R(hx+1,top+10,4,1,mc);else{R(hx+3,top+10,8,1,mc);P(hx+2,top+11,mc);P(hx+11,top+11,mc);}}
  if(L.pipe&&d!=="up"){if(d==="left"){R(hx-3,top+11,4,1,"#5a3a1a");R(hx-4,top+9,2,2,"#3a2410");}else{R(hx+9,top+11,5,1,"#5a3a1a");R(hx+13,top+9,2,2,"#3a2410");}}
  return {hx,hw,top,hh};
}
function hat8(K,y,d,L,hb){
  const {R,P}=K;const hc=L.hatCol||"#222",lo=lo8(hc,.35),hi=hi8(hc,.2),{hx,hw,top}=hb;
  const sx=d==="left"?1:0;
  if(L.hat==="top"){R(hx-2+sx,top+1,hw+4-sx,2,hc);R(hx+2+sx,top-9,hw-4,11,hc);R(hx+2+sx,top-9,hw-4,1,hi);R(hx+hw-4,top-8,2,10,lo);R(hx+2+sx,top-1,hw-4,1,"#6a2a2a");}
  else if(L.hat==="wide"){R(hx-5+sx,top+1,hw+10-sx,2,hc);R(hx-5+sx,top+2,hw+10-sx,1,lo);R(hx+1+sx,top-5,hw-2,7,hc);R(hx+1+sx,top-5,hw-2,1,hi);R(hx+1+sx,top,hw-2,1,lo8(hc,.5));}
  else if(L.hat==="cap"){R(hx-1,top-2,hw+2,5,hc);R(hx-1,top-2,hw+2,1,hi);R(hx+hw-1,top-1,2,4,lo);if(d==="left")R(hx-4,top+2,5,2,lo);else if(d==="down")R(hx+1,top+3,hw-2,1,lo);}
  else if(L.hat==="bonnet"){R(hx-2,top-2,hw+4,6,hc);R(hx-2,top-2,hw+4,1,hi);if(d!=="up"){R(hx-2,top+4,2,8,hc);R(hx+hw,top+4,2,8,lo);R(hx+5,top+13,4,1,hc);}else R(hx-2,top+4,hw+4,6,hc);}
  else if(L.hat==="jester"){R(hx-1,top-2,hw+2,4,hc);R(hx-4,top-6,5,5,hc);R(hx+hw-1,top-6,5,5,lo);R(hx-5,top-8,3,3,"#ffe060");R(hx+hw+2,top-8,3,3,"#ffe060");R(hx+3,top-4,hw-6,3,hi8(hc,.1));}
  if(L.feather){R(hx+hw-1,top-8,1,8,"#c8a040");P(hx+hw,top-9,"#e8c860");P(hx+hw-2,top-6,"#a88030");}
}
/* ------------------------------------------------------------ human */
PAINT8.human=function(g,L,d,f,v){
  const K=kit8(g),y=lay8(L),skin=L.skin||"#e8c09c",top=L.top||"#4a4a5a",bot=L.bottom||"#2a2a3a";
  const bob=(f===1||f===3)?1:0;
  if(L.wheel){ // Oswick's chair
    const {R}=K;R(8,44,24,3,"#4a3a2a");R(10,30,3,16,"#3a2a1a");R(27,30,3,16,"#3a2a1a");
    g.strokeStyle="#2a1f14";g.lineWidth=2;g.beginPath();g.arc(12,52,6,0,7);g.stroke();g.beginPath();g.arc(28,52,6,0,7);g.stroke();
    g.fillStyle="#6a5a4a";g.fillRect(11,51,2,2);g.fillRect(27,51,2,2);
    const y2=Object.assign({},y,{legTop:46,leg:6,torsoTop:33,headTop:19});
    R(14,46,4,8,bot);R(22,46,4,8,bot);R(13,53,5,2,"#2a1d18");R(21,53,5,2,"#2a1d18");
    torso8(K,y2,d==="up"?"up":"down",L,top);arms8(K,y2,"down",0,top,skin);const hb=head8(K,y2,d,L,v);hat8(K,y2,d,L,hb);return;}
  if(bob)g.translate(0,1);
  if(L.cane&&d==="left"){K.R(10,y.torsoTop+8,1,y.FY-y.torsoTop-8,"#c8c8d0");K.R(9,y.torsoTop+7,3,1,"#e8e8f0");}
  if(!L.dress)legs8(K,y,d,f,bot,L.shoes);
  else{const {R}=K;const sh=L.shoes||"#2a1d18";if(d==="left"){R(15+[0,-2,0,2][f],y.FY-1,5,2,sh);}else{R(15,y.FY-1,5,2,sh);R(21,y.FY-1,5,2,sh);}}
  torso8(K,y,d,L,top);
  arms8(K,y,d,f,top,skin);
  if(L.cane&&d!=="left"){const cx=y.tx+y.tw+1;K.R(cx,y.torsoTop+8,1,y.FY-y.torsoTop-8,"#c8c8d0");K.R(cx-1,y.torsoTop+7,3,1,"#e8e8f0");}
  // neck
  if(d!=="up")K.R(18,y.torsoTop-1,4,1,lo8(skin,.3));
  const hb=head8(K,y,d,L,v);hat8(K,y,d,L,hb);
  if(L.pigeon){const px=d==="left"?24:y.tx+y.tw-3;K.R(px,y.torsoTop-4,5,4,"#8a8a98");K.R(px+4,y.torsoTop-5,2,2,"#9a9aa8");K.P(px+6,y.torsoTop-4,"#e84");K.P(px+4,y.torsoTop-5,"#111");K.R(px,y.torsoTop-1,4,1,"#6a6a78");}
};

/* ------------------------------------------------------------ PCs */
/* Azareth — Harvestborn cleric: jack-o'-lantern head, crooked witch hat,
   tattered dark cloak stuffed with straw, a scythe across her back. */
PAINT8.scarecrow=function(g,L,d,f,v){
  const K=kit8(g),{R,P,B}=K,y=lay8({}),glow=v.includes("g")?"#ffb028":"#ffe25a";
  const bob=(f===1||f===3)?1:0;if(bob)g.translate(0,1);
  // scythe behind
  if(d!=="left"){R(d==="up"?10:30,y.headTop-6,2,40,"#5a3a1e");R(d==="up"?10:30,y.headTop-6,1,40,"#7a5230");
    const bx=d==="up"?6:24;R(bx,y.headTop-8,10,2,"#9aa0a8");R(d==="up"?bx:bx+8,y.headTop-6,3,2,"#9aa0a8");R(bx+1,y.headTop-8,8,1,"#d8dce4");}
  else{g.save();g.strokeStyle="#5a3a1e";g.lineWidth=2;g.beginPath();g.moveTo(31,y.torsoTop+12);g.lineTo(14,y.headTop-4);g.stroke();g.restore();R(8,y.headTop-6,9,2,"#9aa0a8");R(8,y.headTop-6,8,1,"#d8dce4");}
  // stick legs w/ straw
  legs8(K,y,d,f,"#5a3e22","#3a2814");
  R(14,y.FY-3,3,1,"#d8b04a");R(23,y.FY-3,3,1,"#d8b04a");
  // ragged cloak (wider, to the knee)
  const cl="#3a2a34",cll=lo8(cl,.3),tw=d==="left"?12:16,tx=20-tw/2,top=y.torsoTop,hem=y.legTop+4;
  for(let r=top;r<=hem;r++){const w=tw+Math.round((r-top)/(hem-top)*4);R(20-w/2,r,w,1,cl);R(20+w/2-2,r,2,1,cll);}
  for(let i=0;i<tw+4;i++){if(i%2)P(20-(tw+4)/2+i,hem+1,cl);if(i%3===0)P(20-(tw+4)/2+i,hem+2,cll);}
  R(tx+1,top+6,tw-2,1,"#6a3a20");                                                     // rope belt
  if(d!=="up"){R(18,top+1,4,5,"#d8b04a");P(19,top+6,"#b8902a");}                       // straw at the neck
  // sleeves + straw hands
  arms8(K,Object.assign({},y,{tx,tw}),d,f,cl,"#d8b04a");
  // pumpkin head
  const hx=12,hw=16,ht=y.headTop+1,hh=14,pk="#e07a2a";
  B(hx,ht,hw,hh,pk,{sw:2});R(hx+1,ht,hw-2,1,hi8(pk,.25));
  if(d!=="left"){R(hx+4,ht+1,1,hh-2,lo8(pk,.22));R(hx+11,ht+1,1,hh-2,lo8(pk,.22));}else{R(hx+7,ht+1,1,hh-2,lo8(pk,.22));}
  if(d==="down"){
    // carved face: triangle eyes, jagged grin
    R(hx+2,ht+5,4,1,glow);R(hx+3,ht+4,2,1,glow);R(hx+10,ht+5,4,1,glow);R(hx+11,ht+4,2,1,glow);
    R(hx+3,ht+9,10,2,glow);P(hx+5,ht+9,pk);P(hx+9,ht+9,pk);P(hx+4,ht+11,glow);P(hx+7,ht+11,glow);P(hx+11,ht+11,glow);
  }else if(d==="left"){R(hx+1,ht+5,3,1,glow);P(hx+2,ht+4,glow);R(hx+1,ht+9,5,2,glow);P(hx+3,ht+9,pk);}
  // crooked witch hat (tip bends back)
  const hc="#241c26",hl=lo8(hc,.3),hh2=hi8(hc,.25);
  R(hx-4,ht-1,hw+8,2,hc);R(hx-4,ht,hw+8,1,hl);R(hx-3,ht-2,hw+6,1,hh2);
  R(hx+3,ht-6,hw-6,5,hc);R(hx+5,ht-10,hw-9,4,hc);R(hx+7,ht-13,4,3,hc);R(hx+9,ht-15,4,2,hc);R(hx+12,ht-16,3,2,hc);P(hx+15,ht-15,hc);
  R(hx+3,ht-3,hw-6,1,"#7a3a1e");                                                       // band
  R(hx+hw-6,ht-6,2,5,hl);
};
/* Lucky McQuest — Relicborn rogue (and bard): grinning skull, long dark hair,
   pirate hat with gold trim, brown greatcoat over a cream shirt, a pistol. */
PAINT8.skeleton=function(g,L,d,f,v){
  const K=kit8(g),{R,P,B}=K,y=lay8({}),bone="#efe8d8",bl=lo8(bone,.22);
  const bob=(f===1||f===3)?1:0;if(bob)g.translate(0,1);
  legs8(K,y,d,f,"#2a2230","#1a120c");
  // coat with tails
  const coat="#6a4022",tw=d==="left"?12:16,tx=20-tw/2,top=y.torsoTop;
  B(tx,top,tw,y.torso+3,coat,{round:0});
  if(d!=="up"){R(tx+3+(d==="left"?-2:0),top+y.torso,3,4,lo8(coat,.2));R(tx+tw-6,top+y.torso,3,4,lo8(coat,.3));}else R(tx+1,top+y.torso,tw-2,4,lo8(coat,.15));
  if(d==="down"){R(18,top,4,y.torso-2,"#e8dcc0");P(19,top+3,"#b8a888");P(19,top+6,"#b8a888");R(tx+2,top+y.torso-4,tw-4,2,"#2a1a10");R(19,top+y.torso-4,2,2,"#e3b64f");
    R(tx+tw-3,top+y.torso-3,2,4,"#5a5a64");P(tx+tw-3,top+y.torso-3,"#8a8a98");}             // pistol at the hip
  else if(d==="left"){R(tx,top,3,y.torso-2,"#e8dcc0");R(tx,top+y.torso-4,tw,2,"#2a1a10");R(tx+4,top+y.torso-3,4,2,"#5a5a64");}
  arms8(K,Object.assign({},y,{tx,tw}),d,f,coat,bone);
  // hair (behind the skull, long)
  const hx=13,hw=14,ht=y.headTop+1,hair="#2a1f1a";
  if(d!=="left"){R(hx-2,ht+3,3,13,hair);R(hx+hw-1,ht+3,3,13,lo8(hair,.2));}else R(hx+8,ht+3,7,13,hair);
  if(d==="up")R(hx-1,ht+2,hw+2,14,hair);
  else{
    B(hx,ht,hw,13,bone,{sw:1});R(hx+2,ht+12,hw-4,2,bone);R(hx+2,ht+13,hw-4,1,bl);
    if(d==="down"){R(hx+2,ht+5,4,3,"#120c10");R(hx+8,ht+5,4,3,"#120c10");P(hx+3,ht+6,"#e3b64f");P(hx+9,ht+6,"#e3b64f");
      R(hx+6,ht+9,2,1,"#3a3030");for(let i=0;i<8;i++)P(hx+3+i,ht+12,i%2?"#c8c0b0":"#3a3030");}
    else{R(hx+1,ht+5,3,3,"#120c10");P(hx+2,ht+6,"#e3b64f");P(hx,ht+9,"#3a3030");for(let i=0;i<4;i++)P(hx+1+i,ht+12,i%2?"#c8c0b0":"#3a3030");}
  }
  // pirate hat
  const hc="#4a3020",hl=lo8(hc,.3);
  R(hx-4,ht-1,hw+8,3,hc);R(hx-4,ht-1,hw+8,1,"#d9a441");R(hx-5,ht-3,3,3,hc);R(hx+hw+2,ht-3,3,3,hl);
  R(hx+1,ht-6,hw-2,6,hc);R(hx+1,ht-6,hw-2,1,hi8(hc,.2));R(hx+hw-3,ht-5,2,5,hl);
  if(d!=="up")R(hx+5,ht-4,4,2,"#e8dcc0");                                              // little skull badge
};
/* Poppi — Threadborn sorcerer: porcelain doll, red-and-black pigtails, white
   ruff, harlequin diamonds, ball joints. */
PAINT8.doll=function(g,L,d,f,v){
  if(L.small)return PAINT8.sally(g,L,d,f,v);
  const K=kit8(g),{R,P,B}=K,y=lay8({}),por="#f6efe8",pl=lo8(por,.18),red="#c8283a",blk="#1e161c";
  const bob=(f===1||f===3)?1:0;if(bob)g.translate(0,1);
  // striped legs
  {const top=y.legTop,len=y.leg,lift=d==="left"?[0,0,0,0]:[[0,0],[2,0],[0,0],[0,2]][f];
   if(d==="left"){const sw=[0,-3,0,3][f];[[18-sw,blk],[19+sw,red]].forEach(([x,c])=>{for(let r=0;r<len;r++)R(x,top+r,3,1,r%2?c:por);R(x-1,top+len,4,2,blk);});}
   else [[15,lift[0]],[21,lift[1]]].forEach(([x,l],i)=>{for(let r=0;r<len-l;r++)R(x,top+r,4,1,(r%2)^i?red:blk);R(x-1,top+len-l,5,2,blk);P(x+1,top+2,"#b8a8a0");});}
  // harlequin body
  const tw=d==="left"?11:14,tx=20-tw/2,top=y.torsoTop;
  for(let r=0;r<y.torso;r++)for(let c=0;c<tw;c++){const dd=((Math.floor((c+r)/3)+Math.floor((c-r+30)/3))%2);R(tx+c,top+r,1,1,dd?red:blk);}
  R(tx+tw-1,top,1,y.torso,lo8(red,.4));
  R(tx-1,top+y.torso-2,tw+2,3,red);R(tx-1,top+y.torso,tw+2,1,lo8(red,.3));             // little skirt
  arms8(K,Object.assign({},y,{tx,tw}),d,f,blk,por);
  if(d!=="left"){P(tx-2,top+5,"#b8a8a0");P(tx+tw+1,top+5,"#b8a8a0");}                   // elbow joints
  // ruff collar
  R(tx-2,top-1,tw+4,3,"#f0ece6");for(let i=0;i<tw+4;i+=2)P(tx-2+i,top+2,"#c8c0c8");
  // head
  const hx=13,hw=14,ht=y.headTop+1;
  if(d==="up"){R(hx-1,ht-1,hw/2+1,14,red);R(hx+hw/2,ht-1,hw/2+1,14,blk);}
  else{B(hx,ht,hw,14,por,{sw:1});
    if(d==="down"){R(hx+2,ht+6,3,3,"#1a1018");R(hx+9,ht+6,3,3,"#1a1018");P(hx+2,ht+6,"#7a2a3a");P(hx+9,ht+6,"#7a2a3a");if(v.includes("b")){R(hx+2,ht+6,3,3,por);R(hx+2,ht+8,3,1,pl);R(hx+9,ht+6,3,3,por);R(hx+9,ht+8,3,1,pl);}
      R(hx+1,ht+10,2,1,"#e88a9a");R(hx+11,ht+10,2,1,"#e88a9a");R(hx+6,ht+11,2,1,red);
      P(hx+11,ht+3,"#a8a0a8");P(hx+12,ht+4,"#a8a0a8");P(hx+11,ht+5,"#a8a0a8");}       // the crack
    else{R(hx+1,ht+6,2,3,"#1a1018");P(hx+1,ht+10,"#e88a9a");P(hx+1,ht+11,red);}}
  // pigtails: red on one side, black on the other
  if(d!=="up"){R(hx-1,ht-1,hw/2+1,4,red);R(hx+hw/2,ht-1,hw/2+1,4,blk);R(hx-1,ht-1,hw+2,1,hi8(red,.1));
    if(d==="down"){R(hx-4,ht+2,4,9,red);R(hx-5,ht+4,2,6,lo8(red,.2));R(hx+hw,ht+2,4,9,blk);R(hx+hw+2,ht+4,2,6,"#3a2a34");R(hx-3,ht+2,2,1,"#f0ece6");R(hx+hw+1,ht+2,2,1,"#f0ece6");}
    else{R(hx+6,ht-1,9,6,blk);R(hx+12,ht+3,4,10,blk);R(hx+13,ht+5,2,6,"#3a2a34");}}
  else{R(hx-4,ht+2,4,9,red);R(hx+hw,ht+2,4,9,blk);}
};
/* Sally Lockwood (small doll) */
PAINT8.sally=function(g,L,d,f,v){const K=kit8(g),{R,P,B}=K;
  R(15,50,10,9,"#b8905a");R(15,50,10,1,hi8("#b8905a",.2));R(23,50,2,9,lo8("#b8905a",.3));R(16,59-1,3,1,"#3a2a1a");R(21,58,3,1,"#3a2a1a");
  B(14,40,12,11,"#e8c8a0",{sw:1});R(13,39,14,3,"#5a3a1a");R(13,41,2,6,"#5a3a1a");R(25,41,2,6,lo8("#5a3a1a",.2));
  if(d!=="up"){R(16,45,2,2,"#1a1018");R(22,45,2,2,"#1a1018");R(19,48,2,1,"#a83a3a");}};
/* Krodha, Silas of Tsen — Plagueborn monk: deep brown hood and robe, face in
   shadow (the scars on one side), rope belt and gourd, a long staff. */
PAINT8.monk=function(g,L,d,f,v){
  const K=kit8(g),{R,P,B}=K,y=lay8({tall:true}),rb="#5a4630",rl=lo8(rb,.3),rh=hi8(rb,.18);
  const bob=(f===1||f===3)?1:0;if(bob)g.translate(0,1);
  // staff
  const sx=d==="left"?11:30,sxu=d==="up"?9:sx;
  R(sxu,y.headTop-7,2,y.FY-y.headTop+6,"#6a4a2a");R(sxu,y.headTop-7,1,y.FY-y.headTop+6,"#8a6a40");R(sxu-1,y.headTop-8,4,2,"#4a3018");
  // feet (wraps) peek under the robe
  {const sh="#c8b898";if(d==="left"){const s=[0,-2,0,2][f];R(14+s,y.FY-1,5,2,sh);R(19-s,y.FY-1,4,2,lo8(sh,.2));}else{const l=[[0,0],[1,0],[0,0],[0,1]][f];R(14,y.FY-1-l[0],5,2,sh);R(21,y.FY-1-l[1],5,2,sh);}}
  // robe to the ankles
  const tw=d==="left"?12:15,top=y.torsoTop,hem=y.FY-2;
  for(let r=top;r<=hem;r++){const w=tw+Math.round(Math.max(0,(r-top-6))/(hem-top-6)*5);R(20-w/2,r,w,1,rb);R(20+w/2-2,r,2,1,rl);R(20-w/2,r,1,1,rh);}
  if(d!=="left"){const sw=[0,1,0,-1][f];for(let r=top+y.torso;r<=hem;r++)P(20+sw,r,rl);}
  R(20-tw/2,top+8,tw,1,"#c8a860");R(20-tw/2,top+9,tw,1,lo8("#c8a860",.3));
  if(d==="down"){R(20+tw/2-4,top+10,3,4,"#a8784a");P(20+tw/2-3,top+9,"#6a4a2a");}
  else if(d==="left"){R(20+tw/2-2,top+10,3,4,"#a8784a");}
  arms8(K,Object.assign({},y,{tx:20-tw/2,tw}),d,f,rb,"#d8c8a8");
  if(d==="down"){P(20-tw/2-2,top+y.torso-1,"#9fe0b0");}                                // a flicker of ki
  // hood
  const hx=12,hw=16,ht=y.headTop;
  B(hx,ht,hw,16,rb,{sw:2});R(hx+1,ht,hw-2,1,rh);R(hx-1,ht+10,hw+2,6,rb);R(hx+hw-1,ht+10,2,6,rl);
  if(d==="down"){R(hx+3,ht+4,hw-6,10,"#2a1c18");R(hx+4,ht+6,hw-8,8,"#7a5a44");R(hx+4,ht+6,hw-8,2,"#3a2a22");
    R(hx+5,ht+8,2,1,v.includes("b")?"#5a4030":"#e8e0c8");R(hx+9,ht+8,2,1,v.includes("b")?"#5a4030":"#e8e0c8");
    R(hx+9,ht+10,3,3,"#a85a4a");P(hx+10,ht+11,"#8a4038");R(hx+6,ht+12,3,1,"#4a2a24");}
  else if(d==="left"){R(hx,ht+4,6,10,"#2a1c18");R(hx+1,ht+6,4,8,"#7a5a44");P(hx+1,ht+8,v.includes("b")?"#5a4030":"#e8e0c8");R(hx+1,ht+12,2,1,"#4a2a24");}
  else{R(hx+6,ht+2,2,12,rl);}
};
/* Tessie — Deepborn ranger: teal scales, a fin crest, fin "ears", huge eyes,
   a bow and quiver. */
PAINT8.deepborn=function(g,L,d,f,v){
  const K=kit8(g),{R,P,B}=K,y=lay8({}),sk="#3fa0a8",sl=lo8(sk,.3),sh2=hi8(sk,.25),fin="#2a7a88",tip="#9fe8e0";
  const bob=(f===1||f===3)?1:0;if(bob)g.translate(0,1);
  // bow + quiver behind
  if(d==="up"||d==="left"){R(d==="up"?24:25,y.torsoTop-4,3,12,"#5a3a2a");P(d==="up"?24:25,y.torsoTop-5,"#e8e0d0");P(d==="up"?26:27,y.torsoTop-6,"#e8e0d0");
    g.save();g.strokeStyle="#8a6a3a";g.lineWidth=1.5;g.beginPath();g.arc(d==="up"?15:27,y.torsoTop+8,11,-1.25,1.25);g.stroke();g.restore();}
  legs8(K,y,d,f,sk,fin);
  const tw=d==="left"?12:14,tx=20-tw/2,top=y.torsoTop,ar="#2a5a5a";
  B(tx,top,tw,y.torso,ar,{round:0});
  for(let r=1;r<y.torso-1;r+=2)for(let c=(r>>1)%2;c<tw-1;c+=2)P(tx+c,top+r,hi8(ar,.18));
  if(d==="down"){g.save();g.strokeStyle="#6a4028";g.lineWidth=1;g.beginPath();g.moveTo(tx,top);g.lineTo(tx+tw,top+y.torso-2);g.stroke();g.restore();R(tx,top+y.torso-3,tw,1,"#6a4028");}
  arms8(K,Object.assign({},y,{tx,tw}),d,f,sk,sh2);
  if(d==="down"){g.save();g.strokeStyle="#8a6a3a";g.lineWidth=1.6;g.beginPath();g.arc(tx-13,top+9,10,-1.05,1.05);g.stroke();g.strokeStyle="rgba(230,230,220,.7)";g.lineWidth=.7;g.beginPath();g.moveTo(tx-8,top+0.5);g.lineTo(tx-8,top+17.5);g.stroke();g.restore();
    R(tx+tw,top-4,3,10,"#5a3a2a");P(tx+tw,top-5,"#e8e0d0");P(tx+tw+2,top-6,"#e8e0d0");}
  // head
  const hx=13,hw=14,ht=y.headTop+1;
  // fin crest
  for(let i=0;i<5;i++){const fx=d==="left"?hx+4+i*2:hx+2+i*2,fh=[3,5,6,5,3][i];R(fx,ht-fh,2,fh,fin);P(fx,ht-fh,tip);}
  B(hx,ht,hw,14,sk,{sw:2});R(hx+2,ht+10,hw-4,3,d==="up"?sk:"#8fd0c8");
  if(d==="down"){R(hx-3,ht+3,3,6,fin);P(hx-3,ht+3,tip);R(hx+hw,ht+3,3,6,lo8(fin,.2));P(hx+hw+2,ht+3,tip);
    R(hx+1,ht+5,4,4,"#f0e070");R(hx+9,ht+5,4,4,"#f0e070");R(hx+2,ht+6,2,2,"#06202a");R(hx+10,ht+6,2,2,"#06202a");if(v.includes("b")){R(hx+1,ht+5,4,4,sl);R(hx+9,ht+5,4,4,sl);}
    R(hx+5,ht+11,4,1,"#1e5a60");}
  else if(d==="left"){R(hx+8,ht+3,4,6,fin);P(hx+11,ht+3,tip);R(hx,ht+5,4,4,"#f0e070");R(hx,ht+6,2,2,"#06202a");if(v.includes("b"))R(hx,ht+5,4,4,sl);R(hx,ht+11,3,1,"#1e5a60");}
  else{R(hx-3,ht+3,3,6,fin);R(hx+hw,ht+3,3,6,fin);for(let i=0;i<3;i++)R(hx+3,ht+3+i*3,hw-6,1,sl);}
};
/* the Vagrant — the fiddling frog in a top hat */
PAINT8.frog=function(g,L,d,f,v){
  const K=kit8(g),{R,P,B}=K,y=lay8({}),gr="#7aa04a",top=L.top||"#3b2f4a";
  const bob=(f===1||f===3)?1:0;if(bob)g.translate(0,1);
  if(d!=="down"){R(d==="up"?14:24,y.torsoTop,5,13,"#6a3a1a");R(d==="up"?15:25,y.torsoTop+2,3,3,"#3a2010");}
  legs8(K,y,d,f,L.bottom||"#5a5048",gr);
  B(20-7,y.torsoTop,14,y.torso,top,{round:0});R(18,y.torsoTop,4,y.torso-3,"#c8b890");
  arms8(K,y,d,f,top,gr);
  const hx=12,hw=16,ht=y.headTop+2;
  B(hx,ht+2,hw,12,gr,{sw:2});R(hx+2,ht+10,hw-4,3,"#c8d898");
  if(d!=="up"){const ex=d==="left"?[hx,hx+6]:[hx+1,hx+10];ex.forEach(x=>{R(x,ht,5,5,gr);R(x+1,ht+1,3,3,"#ffe890");P(x+2,ht+2,v.includes("b")?"#c8b860":"#111");});R(hx+2,ht+9,hw-4,1,"#3a5020");}
  const hc=L.hatCol||"#241c2c";R(hx,ht+1,hw,2,hc);R(hx+3,ht-7,hw-6,8,hc);R(hx+3,ht-7,hw-6,1,hi8(hc,.2));R(hx+3,ht-1,hw-6,1,"#6a4a2a");
  if(d==="down"){R(hx+hw-1,ht+14,4,9,"#6a3a1a");R(hx+hw,ht+16,2,3,"#3a2010");}
};
/* the Crooked Man — too tall, bent, smiling */
PAINT8.crooked=function(g,L,d,f,v){
  const K=kit8(g),{R,P}=K,s=Math.sin((+String(v).slice(1)||0)/8*Math.PI*2)*2;
  g.save();g.globalAlpha=.92;
  g.fillStyle="#0c0a10";g.beginPath();g.moveTo(12,60);g.lineTo(16+s,30);g.lineTo(13+s,22);g.lineTo(22+s,14);g.lineTo(27+s,18);g.lineTo(22,34);g.lineTo(28,60);g.fill();
  R(26+s,18,2,22,"#0c0a10");R(9+s,22,2,18,"#0c0a10");
  R(17+s,6,9,9,"#d8d0c0");R(17+s,13,9,2,"#b8b0a0");
  if(d!=="up"){R(19+s,9,2,2,"#000");R(23+s,9,2,2,"#000");R(18+s,12,8,1,"#2a1a1a");P(18+s,11,"#2a1a1a");P(25+s,11,"#2a1a1a");}
  R(15+s,4,13,2,"#0c0a10");R(18+s,-6,7,11,"#0c0a10");R(18+s,1,7,1,"#3a2a3a");
  g.restore();
};
/* Caster — the ghost greyhound */
PAINT8.dog=function(g,L,d,f,v){
  const K=kit8(g),{R,P}=K,c="#cfe8f0",l=lo8(c,.18),hi="#f0fbff";const s=[0,1,0,-1][f];
  if(d==="left"){
    R(11,44,18,6,c);R(12,43,14,1,hi);R(12,49,14,2,l);R(9,40,6,6,c);R(5,42,5,3,c);P(4,43,c);P(6,42,"#223");P(10,39,c);P(11,38,c);
    R(12,49,2,9+s,c);R(15,49,2,9-s,l);R(25,49,2,9-s,c);R(28,49,2,9+s,l);R(29,44,6,2,c);R(34,42,2,3,c);}
  else if(d==="down"){R(15,42,10,10,c);R(16,36,8,8,c);R(15,34,2,4,c);R(23,34,2,4,c);P(18,39,"#223");P(21,39,"#223");R(19,42,2,2,"#9ab");R(16,52,2,7,c);R(22,52,2,7,l);R(16,42,8,1,hi);}
  else{R(15,40,10,12,c);R(16,35,8,6,c);R(15,33,2,4,c);R(23,33,2,4,c);R(16,52,2,7,c);R(22,52,2,7,l);R(19,50,2,6,c);}
};
PAINT8.cat=function(g,L,d,f,v){const K=kit8(g),{R,P}=K,c="#6a6a72",l=lo8(c,.3);const s=[0,1,0,-1][f];
  if(d==="left"){R(14,50,14,6,c);R(14,55,14,1,l);R(10,45,7,7,c);P(10,44,c);P(15,44,c);P(11,47,"#ffd84a");R(27,44,2,7,c);P(28,43,c);R(15,56,2,3+s,c);R(24,56,2,3-s,l);}
  else{R(14,49,12,9,c);R(15,43,10,7,c);P(15,42,c);P(16,41,c);P(23,42,c);P(24,41,c);if(d==="down"){P(17,46,"#ffd84a");P(22,46,"#ffd84a");P(19,48,"#e8a0a0");}R(25,47,2,8,l);R(15,57,2,2,c);R(23,57,2,2,c);}};
PAINT8.goat=function(g,L,d,f,v){const K=kit8(g),{R,P}=K,c="#e8e0d0",l=lo8(c,.2),h="#8a7a60";const s=[0,1,0,-1][f];
  if(d==="left"||d==="right"){R(12,44,16,9,c);R(12,52,16,1,l);R(8,38,7,8,c);R(8,36,1,3,h);R(11,35,1,3,h);P(9,41,"#222");R(8,45,3,2,"#d8d0c0");R(13,53,2,6+s,h);R(25,53,2,6-s,h);R(27,44,2,3,c);}
  else{R(14,42,12,12,c);R(15,36,10,8,c);R(15,33,1,4,h);R(24,33,1,4,h);if(d==="down"){P(17,39,"#222");P(22,39,"#222");}R(15,54,2,5,h);R(23,54,2,5,h);}
  if(!String(v).includes("f")){g.fillStyle="#7a6a4a";g.fillRect(6,32,28,26);g.fillStyle="#5a4a3a";g.fillRect(6,42,28,2);g.fillRect(19,32,2,26);g.fillStyle="#8a7a5a";g.fillRect(6,32,28,2);}};
PAINT8.baby=function(g,L,d,f,v){const K=kit8(g),{R,P}=K,c="#cfeff0";R(14,44,12,12,c);R(15,35,10,10,"#dff8f8");if(d!=="up"){P(17,39,"#224");P(22,39,"#224");R(19,42,2,1,"#224");}R(15,55,10,2,lo8(c,.15));};
PAINT8.weasel=function(g,L,d,f,v){const K=kit8(g),{R,P}=K,c="#8a5a3a",l=lo8(c,.3),b=L.big?4:0;const s=[0,1,0,-1][f];
  R(10-b,50-b,20+b*2,6+b/2,c);R(10-b,55,20+b*2,1,l);R(6-b,46-b,7+b/2,7+b/2,c);P(7-b,48-b,"#ff3a3a");R(4-b,51-b,3,2,"#e8d0b0");R(29+b,48,8,2,c);R(36+b,46,2,3,c);
  R(12,56,2,3+s,l);R(26,56,2,3-s,l);R(12-b,52,10,3,"#e8d0b0");};
PAINT8.tiger=function(g,L,d,f,v){const K=kit8(g),{R,P}=K,c="#8ff0e0",st="#2a8a80";const s=[0,1,0,-1][f];
  R(2,42,30,12,c);R(28,34,12,12,c);for(let i=0;i<7;i++)R(5+i*4,42,2,12,st);P(31,38,"#023");P(36,38,"#023");R(-4+4,40,4,3,c);R(4,54,3,6+s,c);R(26,54,3,6-s,c);R(30,46,6,2,"#c8fff8");};
PAINT8.supplicant=function(g,L,d,f,v){const K=kit8(g),{R}=K,c="#3a2e3a";R(8,42,24,16,c);R(13,36,14,10,"#2a222a");R(15,40,10,6,"#1a141a");R(10,57,20,2,"#1a141a");R(8,42,24,1,hi8(c,.15));R(29,43,3,15,lo8(c,.3));};

/* ---------------------------------------------- world monster sprites */
drawMonSprite=function(c,x,y,key,opt){
  opt=opt||{};const im=IMG["mon:"+key]||IMG["por:"+key];const t=performance.now();
  const H=opt.big?46:32,bob=Math.sin(t/300+(opt.seed||0))*1.2,breath=1+Math.sin(t/520+(opt.seed||0))*.025;
  {const sc=SHADOW_C||c;sc.fillStyle="rgba(0,0,0,.5)";sc.beginPath();sc.ellipse(x+12,y+22,opt.big?13:10,3.4,0,0,7);sc.fill();}
  if(!im){c.fillStyle="#523";c.fillRect(x+6,y+4,12,18);return;}
  const s=H/Math.max(im.width,im.height);const w=im.width*s*breath,h=im.height*s/breath*breath;
  c.save();smooth(c,true);c.drawImage(im,x+12-w/2,y+22-h+bob,w,h);c.restore();
};
/* the outline stamp: thinner ring that matches the art-pixel size */
{const _do=drawOutlined;drawOutlined=function(c,item,fn){
  if(!SPR8.on)return _do(c,item,fn);
  const k=HD.oK;HD.oK=.5;try{return _do8(c,item,fn);}finally{HD.oK=k;}};}
function _do8(c,item,fn){
  if(!HD.outline||item.x===undefined){fn(c);return;}
  const m=c.getTransform(),a=m.a,o=Math.max(1,Math.round(a*SPR8.S*.9));
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
  if(HD.rim){silx.fillStyle="#f1dca0";silx.fillRect(0,0,W,H);c.globalAlpha=.2;O4.forEach(([dx,dy])=>c.drawImage(SIL,0,0,W,H,DX+dx*o*2,DY+dy*o*2,W,H));}
  silx.fillStyle="#06050b";silx.fillRect(0,0,W,H);c.globalAlpha=.92;O4.forEach(([dx,dy])=>c.drawImage(SIL,0,0,W,H,DX+dx*o,DY+dy*o,W,H));
  c.globalAlpha=1;c.drawImage(TIL,0,0,W,H,DX,DY,W,H);c.restore();
}

/* NPCs that are sliding between tiles get their walk cycle too (drawWorld
 * passes no "moving" flag for them, so match them by position this frame) */
const MV8=new Set();
{const _un=updateNpcs;updateNpcs=function(dt){_un(dt);MV8.clear();
  curMap().npcs.forEach(n=>{if(n.rx===undefined)return;if(Math.abs(n.rx-n.x*T)>.6||Math.abs(n.ry-n.y*T)>.6)MV8.add(Math.round(n.rx*4)+","+Math.round(n.ry*4));});};}
{const _dc=drawChar;drawChar=function(c,x,y,look,dir,frame,opt){
  if(MV8.size&&!(opt&&opt.moving)&&MV8.has(Math.round(x*4)+","+Math.round(y*4)))opt=Object.assign({},opt,{moving:true});
  return _dc(c,x,y,look,dir,frame,opt);};}

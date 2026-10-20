/* =============================== v7 · battle ============================ *
 * Same rules, same dice, same flow — a new stage:
 *   · battle intro bars + boss title cards
 *   · portrait turn-order ribbon, party panel with lagging HP bars
 *   · a real tumbling d20 (NAT 20 burst · NAT 1 crack · ADV / DIS badges)
 *   · typed hit effects (fire embers, radiant rays, necrotic wisps, slashes)
 *   · bouncing damage numbers, crit flashes, sprite-shatter deaths
 *   · a victory screen with XP bar, gold and level-up callout */
const B7={parts:[],rings:[],slashes:[],lag:{},turn:null,intro:null,critT:0};
const DMGCOL={fire:"#ff8a3a",radiant:"#fff1a0",necrotic:"#a07aff",psychic:"#ff7ad9",piercing:"#f0e6d0",slashing:"#ffffff",bludgeoning:"#e0cfa8",force:"#9fd8ff",poison:"#9fe060",cold:"#a8e8ff",lightning:"#ffff90",thunder:"#c8d0ff",acid:"#b8ff70"};
const nolig=s=>String(s).replace(/f([il])/g,"f‌$1");
function bText(c,s,x,y,col,px,w,align,fam){c.font=F7(px,w||600,fam);c.textAlign=align||"left";s=nolig(s);c.fillStyle="rgba(0,0,0,.85)";c.fillText(s,x+.6,y+.8);c.fillStyle=col;c.fillText(s,x,y);c.textAlign="left";}

/* ---------------------------------------------------------- intro + boss */
{const _bt=battle;battle=async function(e,o){V7.enc=ENC[e];const r=await _bt(e,o);V7.enc=null;return r;};}
battleSwirl=async function(){
  SFX.hit();const enc=V7.enc;B7.intro={t0:performance.now(),dur:620};
  tone(196,.5,"sawtooth",.04,-60);noise(.35,.06,600);
  await sleep(640);B7.intro=null;
  const boss=enc&&enc.foes.map(k=>MON[k]).find(M=>M&&M.boss);
  if(boss){const el=$("bossc7");el.innerHTML=`<div class="band"></div><div class="bk">— BOSS —</div><div class="bn">${esc(boss.name)}</div>`;el.classList.add("on");
    SFX.toll&&SFX.toll();shake(6);await sleep(1700);el.classList.remove("on");}
};
{const d=document.createElement("div");d.id="bossc7";$("viewport").appendChild(d);
 const v=document.createElement("div");v.id="vic7";$("battle").appendChild(v);}
{const _dw=drawWorld;drawWorld=function(t){_dw(t);const I=B7.intro;if(!I)return;const k=clamp((performance.now()-I.t0)/I.dur,0,1),c=ctx;
  c.save();c.setTransform(RS,0,0,RS,0,0);const n=9,h=VH/n;for(let i=0;i<n;i++){const kk=clamp(k*1.6-i*.06,0,1),e=kk*kk*(3-2*kk),w=VW*e;c.fillStyle=i%2?"#06040c":"#0d0918";
    if(i%2)c.fillRect(VW-w,i*h,w,h+1);else c.fillRect(0,i*h,w,h+1);}
  if(k<.25){c.fillStyle=`rgba(255,255,255,${(.25-k)*3})`;c.fillRect(0,0,VW,VH);}c.restore();};}

/* --------------------------------------------------------------- layout */
layoutFoes=function(){
  const B=BATTLE,n=B.foes.length,area=[22,300];
  const sp=(area[1]-area[0])/Math.max(1,n);
  B.foes.forEach((f,i)=>{const big=f.big?1.45:f.boss?1.28:1;f.w=f.h=Math.round(Math.min(98*big,n>1?sp*1.25*big:999));f.sp=sp;
    const cx=n===1?162:area[0]+sp*i+sp/2;
    f.x=Math.round(clamp(cx-f.w/2,6,320-f.w));f.y=Math.round(Math.max(44,(n>2&&i%2?238:222)-f.h));f.plateY=n>2&&i%2?f.y-6:f.y-16;});
  B.party.forEach((p,i)=>{p.x=336+i*18;p.y=86+i*22;p.w=46;p.h=50;});
};

/* ------------------------------------------------------------ hooks: fx */
{const _dm=damage;damage=async function(att,tgt,expr,type,crit,extra){tgt._type=type;tgt._crit=crit;const n=await _dm(att,tgt,expr,type,crit,extra);tgt._type=null;tgt._crit=false;return n;};}
{const _dr=dealRaw;dealRaw=function(c,n,col){const before=c.hp;_dr(c,n,col);const lost=before-c.hp;B7.lag[c.id]=B7.lag[c.id]??before;
  const cx=(c.x||0)+(c.w?c.w/2:24),cy=(c.y||0)+(c.h?c.h*.5:26);
  if(c.side==="pc"){burst(cx,cy,"#ff5a5a",10,60);B7.slashes.push({x:cx,y:cy,born:performance.now(),col:"#ff9a9a",ang:-.6});const el=$("partyhud").querySelector(`[data-id="${c.id}"]`);if(el){el.classList.remove("hit");void el.offsetWidth;el.classList.add("hit");}}
  else hitFX(c,c._type,c._crit,lost);};}
function burst(x,y,col,n,sp,opt){opt=opt||{};const now=performance.now();for(let i=0;i<n;i++){const a=opt.up?rnd(-2.6,-.5):rnd(0,6.28),v=rnd(sp*.3,sp);B7.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(opt.lift||0),g:opt.g??80,life:rnd(400,opt.life||800),born:now,col,s:rnd(1,opt.s||2.4),glow:opt.glow});}}
function hitFX(f,type,crit,n){const cx=f.x+f.w/2,cy=f.y+f.h*.55,col=DMGCOL[type]||"#ffd0a0",now=performance.now();
  B7.rings.push({x:cx,y:cy,born:now,col,r:crit?46:28});
  if(type==="fire")burst(cx,cy,col,crit?34:20,70,{up:true,g:-40,glow:1,life:1000});
  else if(type==="radiant"){for(let i=0;i<10;i++)B7.slashes.push({x:cx,y:cy,born:now,col,ang:i/10*6.28,ray:1});burst(cx,cy,col,16,60,{glow:1});}
  else if(type==="necrotic"||type==="psychic")burst(cx,cy,col,crit?30:18,40,{up:true,g:-30,glow:1,life:1200,s:3});
  else if(type==="slashing"||type==="piercing"){B7.slashes.push({x:cx,y:cy,born:now,col,ang:type==="piercing"?0:-.7});if(crit)B7.slashes.push({x:cx,y:cy,born:now+60,col,ang:.7});burst(cx,cy,"#fff",10,90);}
  else burst(cx,cy,col,crit?26:14,90);
  if(crit){B7.critT=now;FX.flash=.55;FX.flashCol="#fff";}}
{const _pt=popText;popText=function(c,t,col){_pt(c,t,col);const f=BATTLE.fx[BATTLE.fx.length-1];if(!f)return;f.num=/^[-+]\d+$/.test(t);f.crit=!!c._crit&&/^-/.test(t);f.vx=rnd(-14,14);
  if(f.num){f.x=(c.x||0)+(c.w?c.w/2:24);f.y=(c.y||0)+(c.h?c.h*.3:10);}if(!f.num)f.y-=6;};}
{const _kf=killFoe;killFoe=async function(f){shatter(f);SFX.hit();await _kf(f);};}
function shatter(f){const im=monImage(f.M);if(!im)return;try{const N=26,cv2=document.createElement("canvas");cv2.width=cv2.height=N;const g=cv2.getContext("2d");
  const s=Math.min(N/im.width,N/im.height);g.drawImage(im,(N-im.width*s)/2,(N-im.height*s)/2,im.width*s,im.height*s);const d2=g.getImageData(0,0,N,N).data;
  const s2=Math.min(f.w/im.width,f.h/im.height),w=im.width*s2,h=im.height*s2,ox=f.x+(f.w-w)/2,oy=f.y+f.h-h,now=performance.now();
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4;if(d2[i+3]<120)continue;if(Math.random()<.35)continue;
    const px2=ox+(x-(N-im.width*s)/2)/(im.width*s)*w,py2=oy+(y-(N-im.height*s)/2)/(im.height*s)*h;
    B7.parts.push({x:px2,y:py2,vx:rnd(-20,20),vy:rnd(-50,-10),g:-10,life:rnd(700,1400),born:now+rnd(0,300),col:`rgb(${d2[i]},${d2[i+1]},${d2[i+2]})`,s:rnd(1.4,2.6),sq:1});}}catch(e){}}

/* ---------------------------------------------------- turn sweep banner */
{const _pt=pcTurn;pcTurn=function(c){B7.turn={who:c.id,born:performance.now()};tone(660,.05,"square",.03);tone(880,.07,"square",.03,0,.05);
  return _pt(c);};}
{const _ft=foeTurn;foeTurn=function(f){B7.turn={foe:f,born:performance.now()};return _ft(f);};}

/* ----------------------------------------------------------------- dice */
function d20Shape(c,r){const V=[];for(let k=0;k<6;k++){const a=-Math.PI/2+k*Math.PI/3;V.push([Math.cos(a)*r,Math.sin(a)*r]);}
  const I=[[0,-r*.5],[r*.433,r*.25],[-r*.433,r*.25]];return {V,I};}
function drawD20(c,x,y,r,rot,col,edge){const {V,I}=d20Shape(c,r);c.save();c.translate(x,y);c.rotate(rot);
  c.fillStyle="rgba(0,0,0,.45)";c.beginPath();c.ellipse(2,r*1.05,r*.9,r*.25,0,0,7);c.fill();
  const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);c.fillStyle=g;c.beginPath();V.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();
  c.strokeStyle=edge;c.lineWidth=1.3;c.stroke();c.beginPath();I.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fillStyle="rgba(255,255,255,.08)";c.fill();c.stroke();
  c.lineWidth=.8;c.globalAlpha=.7;c.beginPath();[[0,0],[0,1],[1,1],[1,2],[2,3],[2,4],[0,5]].forEach(([ii,vv])=>{c.moveTo(I[ii][0],I[ii][1]);c.lineTo(V[vv][0],V[vv][1]);});c.moveTo(I[1][0],I[1][1]);c.lineTo(V[2][0],V[2][1]);c.moveTo(I[2][0],I[2][1]);c.lineTo(V[4][0],V[4][1]);c.stroke();c.globalAlpha=1;
  c.rotate(-rot);c.restore();}
function drawDice7(c,t){const B=BATTLE,D=B.dice;if(!D)return;const age=t-D.t,span=STATE.fast?820:1250;if(age>span)return;
  const cx=240,cy=92,spin=D.spin,fadeA=age>span-200?(span-age)/200:1;
  if(!spin&&!D.fx){D.fx=1;D.land=t;if(D.nat===20){burst(cx,cy,"#ffe08a",40,140,{glow:1,life:1100});FX.flash=.5;FX.flashCol="#fff6c8";tone(1568,.2,"square",.04);tone(2093,.3,"square",.035,0,.1);}
    else if(D.nat===1){shake(5);tone(110,.35,"sawtooth",.05,-40);}}
  c.save();c.globalAlpha=fadeA;
  c.fillStyle="rgba(6,4,12,.72)";c.beginPath();c.roundRect?c.roundRect(cx-70,cy-44,140,96,10):c.rect(cx-70,cy-44,140,96);c.fill();
  const okc=D.ok?(D.crit?"#ffd96a":"#7fe0a0"):"#e05a5a";c.strokeStyle=spin?"#5a4f86":okc;c.lineWidth=1.5;c.stroke();
  const land=spin?0:clamp((t-(D.land||t))/180,0,1),bounce=spin?Math.abs(Math.sin(age/70))*6:(1-land)*-6;
  const rot=spin?age/55:0,sc=spin?1:1+.25*Math.sin(land*Math.PI);
  const isNat20=!spin&&D.nat===20,isNat1=!spin&&D.nat===1;
  drawD20(c,cx,cy-12-bounce,22*sc,rot,isNat20?["#ffe9a0","#b8862a"]:isNat1?["#5a1a24","#2a0a10"]:["#3a2f62","#1a1430"],isNat20?"#fff6c8":isNat1?"#ff6a6a":"#f1dca0");
  if(isNat1){c.strokeStyle="#ff6a6a";c.lineWidth=1.2;c.beginPath();c.moveTo(cx-8,cy-30);c.lineTo(cx-2,cy-18);c.lineTo(cx-7,cy-10);c.lineTo(cx+3,cy+2);c.stroke();}
  bText(c,spin?String(d(20)):String(D.nat),cx,cy-7-bounce,isNat20?"#3a2406":isNat1?"#ffb0b0":"#fff3cf",spin?10:12,700,"center","CMLabel");
  if(D.adv)bText(c,D.adv>0?"ADVANTAGE":"DISADVANTAGE",cx,cy-38,D.adv>0?"#9fe0b0":"#e08080",5.5,400,"center","CMLabel");
  if(!spin){bText(c,`${D.nat} ${D.bonus>=0?"+":"-"} ${Math.abs(D.bonus)} = ${D.nat+D.bonus}  VS ${String(D.vs).toUpperCase()}`,cx,cy+24,"#d9cfee",5.2,400,"center","CMLabel");
    const lab=isNat20&&!D.isSave?"NATURAL 20!":D.isSave?(D.ok?"SAVED":"FAILED"):(D.crit?"CRITICAL HIT!":D.ok?"HIT":"MISS");
    const ls=1+.2*Math.max(0,1-land*1.2);c.save();c.translate(cx,cy+42);c.scale(ls,ls);bText(c,lab,0,0,okc,isNat20||D.crit?11:10,700,"center");c.restore();}
  c.restore();}

/* ----------------------------------------------------------------- draw */
const BAR=(c,x,y,w,h,frac,lag,col,bg)=>{c.fillStyle=bg||"#2a0e17";c.fillRect(x,y,w,h);if(lag>frac){c.fillStyle="rgba(255,240,220,.85)";c.fillRect(x,y,w*lag,h);}c.fillStyle=col;c.fillRect(x,y,w*Math.max(0,frac),h);c.fillStyle="rgba(255,255,255,.18)";c.fillRect(x,y,w*Math.max(0,frac),Math.max(.6,h*.35));c.strokeStyle="rgba(0,0,0,.8)";c.lineWidth=.6;c.strokeRect(x,y,w,h);};
function lagFrac(o){const k=o.id;const cur=Math.max(0,o.hp);let L=B7.lag[k];if(L===undefined||L<cur){B7.lag[k]=cur;return cur/o.hpMax;}if(o.hurt&&performance.now()-o.hurt<450)return L/o.hpMax;B7.lag[k]=Math.max(cur,L-o.hpMax*.02);return B7.lag[k]/o.hpMax;}
function circlePortrait(c,im,x,y,r,ring){c.save();c.beginPath();c.arc(x,y,r,0,7);c.fillStyle="#0b0916";c.fill();c.clip();if(im){const s=Math.max(2*r/im.width,2*r/im.height);c.drawImage(im,x-im.width*s/2,y-r*1.05,im.width*s,im.height*s);}c.restore();
  c.strokeStyle=ring;c.lineWidth=1.2;c.beginPath();c.arc(x,y,r,0,7);c.stroke();}
drawBattle=function(){
  bx.setTransform(RS,0,0,RS,0,0);bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality="high";
  const B=BATTLE,c=bx,t=performance.now();
  c.save();
  if(FX.shake>0){c.translate(rnd(-FX.shake,FX.shake),rnd(-FX.shake,FX.shake));FX.shake*=.86;if(FX.shake<.3)FX.shake=0;}
  // backdrop
  c.fillStyle="#06050b";c.fillRect(-12,-12,504,360);
  const art=IMG["map:"+(BG_ART[B.bg]||curMap().art||"")];
  if(art){const s=Math.max(480/art.width,336/art.height)*1.7;const cx=(art.width*s-480)/2,cy=(art.height*s-336)/2;c.globalAlpha=.5;c.drawImage(art,-cx+Math.sin(t/5000)*14,-cy+Math.cos(t/7000)*6,art.width*s,art.height*s);c.globalAlpha=1;}
  let g=c.createLinearGradient(0,0,0,336);g.addColorStop(0,"rgba(6,4,14,.55)");g.addColorStop(.45,"rgba(6,4,14,.12)");g.addColorStop(1,"rgba(6,4,14,.92)");c.fillStyle=g;c.fillRect(0,0,480,336);
  g=c.createRadialGradient(240,190,60,240,190,330);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.6)");c.fillStyle=g;c.fillRect(0,0,480,336);
  if(B.bg==="blood"){c.fillStyle=`rgba(140,0,20,${.25+(1-(B.timer||0)/6)*.35})`;c.fillRect(0,336-(1-(B.timer||6)/6)*220-40,480,400);}
  // stage pools of light
  g=c.createRadialGradient(165,236,10,165,236,170);g.addColorStop(0,"rgba(255,220,170,.10)");g.addColorStop(1,"rgba(255,220,170,0)");c.fillStyle=g;c.fillRect(0,120,340,216);
  c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.ellipse(165,234,165,24,0,0,7);c.fill();
  c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(400,252,80,16,0,0,7);c.fill();
  // foes
  B.foes.forEach((f,i)=>{
    const dying=f.dead&&t-f.deathT<650;if(f.dead&&!dying)return;
    const im=monImage(f.M);const bob=Math.sin(t/430+i)*2,breath=1+Math.sin(t/600+i*1.3)*.015;
    let dx=0;if(f.lunge&&t-f.lunge<300)dx=Math.sin((t-f.lunge)/300*Math.PI)*20;
    if(f.hurt&&t-f.hurt<260)dx-=Math.sin((t-f.hurt)/260*Math.PI)*8;
    if(!im)return;const s=Math.min(f.w/im.width,f.h/im.height);const w=im.width*s,h=im.height*s,x=f.x+dx+(f.w-w)/2,y=f.y+f.h-h+bob;
    c.save();
    if(B.cur===f&&!f.dead){const gg=c.createRadialGradient(f.x+f.w/2,f.y+f.h,4,f.x+f.w/2,f.y+f.h,f.w*.6);gg.addColorStop(0,"rgba(255,90,90,.35)");gg.addColorStop(1,"rgba(255,90,90,0)");c.fillStyle=gg;c.fillRect(f.x-20,f.y+f.h-30,f.w+40,60);}
    c.fillStyle="rgba(0,0,0,.45)";c.beginPath();c.ellipse(f.x+f.w/2+dx,f.y+f.h+2,w*.42,6,0,0,7);c.fill();
    if(dying){const k=(t-f.deathT)/650;c.globalAlpha=Math.max(0,1-k*1.4);c.translate(x+w/2,y+h);c.scale(1+k*.2,1-k*.5);c.translate(-(x+w/2),-(y+h));}
    if(has(f,"charmed")){c.shadowColor="#ff7ab8";c.shadowBlur=16;}
    if(f.M.tint)c.filter="hue-rotate(20deg) saturate(1.4)";
    c.translate(x+w/2,y+h);c.scale(1,breath);c.translate(-(x+w/2),-(y+h));
    c.drawImage(im,x,y,w,h);c.filter="none";c.shadowBlur=0;
    if(f.hurt&&t-f.hurt<140){c.globalCompositeOperation="lighter";c.globalAlpha=.7;c.drawImage(im,x,y,w,h);c.globalCompositeOperation="source-over";}
    c.restore();
    if(!f.dead){const bw=Math.max(56,Math.min(110,f.w,(f.sp||999)-6)),nx=clamp(f.x+f.w/2-bw/2,4,320-bw),ny=Math.max(36,f.plateY??f.y-16);
      c.fillStyle="rgba(8,6,16,.78)";c.beginPath();c.roundRect?c.roundRect(nx-3,ny-9,bw+6,17,4):c.rect(nx-3,ny-9,bw+6,17);c.fill();
      c.save();c.beginPath();c.rect(nx-2,ny-10,bw-22,12);c.clip();bText(c,f.name,nx,ny-1.5,f.boss?"#ffd96a":"#f1e8d0",7,600);c.restore();
      bText(c,`${Math.max(0,f.hp)}/${f.hpMax}`,nx+bw,ny-1.5,"#a79cc0",5,400,"right","CMLabel");
      BAR(c,nx,ny+2,bw,3.4,f.hp/f.hpMax,lagFrac(f),f.boss?"#e3b64f":"#e05a5a");
      const sts=Object.keys(f.st).filter(s=>f.st[s]>0&&s!=="feinted");let sx=nx;sts.slice(0,4).forEach(s=>{const lab=stName(s).slice(0,6);c.font=F7(4.6,400,"CMLabel");const w2=c.measureText(lab).width+5;c.fillStyle="rgba(120,80,200,.75)";c.fillRect(sx,f.y+f.h+6,w2,7);bText(c,lab,sx+2.5,f.y+f.h+11.5,"#f0e6ff",4.6,400,"left","CMLabel");sx+=w2+2;});
      if(B.pick===f){const k=1.5*Math.sin(t/120);c.strokeStyle="#ffd96a";c.lineWidth=1.5;const x0=f.x-4-k,y0=f.y-2-k,x1=f.x+f.w+4+k,y1=f.y+f.h+4+k,L=8;c.beginPath();c.moveTo(x0,y0+L);c.lineTo(x0,y0);c.lineTo(x0+L,y0);c.moveTo(x1-L,y0);c.lineTo(x1,y0);c.lineTo(x1,y0+L);c.moveTo(x1,y1-L);c.lineTo(x1,y1);c.lineTo(x1-L,y1);c.moveTo(x0+L,y1);c.lineTo(x0,y1);c.lineTo(x0,y1-L);c.stroke();
        bText(c,"▼",f.x+f.w/2,ny-12+Math.sin(t/120)*2,"#ffd96a",9,700,"center");}}
  });
  // summoned allies
  B.order.filter(a=>a.side==="ally"&&!a.dead).forEach(a=>{c.save();c.translate(a.x,a.y);c.scale(2.2,2.2);drawChar(c,0,0,{kind:"weasel",big:true},"left",0,{});c.restore();});
  // party
  B.party.forEach((p,i)=>{
    let dx=0;if(p.lunge&&t-p.lunge<300)dx=-Math.sin((t-p.lunge)/300*Math.PI)*22;
    if(p.hurt&&t-p.hurt<260)dx+=Math.sin((t-p.hurt)/260*Math.PI)*7;
    const act=B.cur===p,down=p.hp<=0;if(act)dx-=6;
    if(act){const gg=c.createRadialGradient(p.x+24+dx,p.y+48,2,p.x+24+dx,p.y+48,28);gg.addColorStop(0,"rgba(255,217,106,.55)");gg.addColorStop(1,"rgba(255,217,106,0)");c.fillStyle=gg;c.fillRect(p.x-10+dx,p.y+30,70,36);}
    c.save();c.translate(p.x+dx,p.y);
    if(down){c.globalAlpha=.5;c.translate(4,40);c.rotate(-Math.PI/2);c.translate(-4,-40);}
    else{const br=1+Math.sin(t/520+i)*.02;c.translate(0,48);c.scale(1,br);c.translate(0,-48);}
    c.scale(2,2);
    if(p.hurt&&t-p.hurt<240&&((t/45|0)%2))c.globalAlpha=.35;
    drawChar(c,0,0,PARTY_DEF[p.id].look,"left",0,{seed:i});
    c.restore();
    if(p.st.hidden){c.fillStyle="rgba(10,8,20,.45)";c.fillRect(p.x,p.y,48,50);}
    if(B.pick===p){c.strokeStyle="#9fe0b0";c.lineWidth=1.5;c.strokeRect(p.x-3,p.y-3,54,56);}
  });
  B.party.forEach(p=>{if(p.id===ME()&&p.hp>0){const x=p.x-6,y=p.y+30;c.fillStyle="rgba(10,30,24,.85)";c.fillRect(x-9,y-5,18,7);bText(c,"YOU",x,y+.6,"#7fe0b8",4.4,400,"center","CMLabel");}});
  if(hasF("caster")){const te=B.party.find(p=>p.id==="tessie");if(te){c.save();c.translate(te.x+32,te.y+24);c.scale(1.5,1.5);drawChar(c,0,0,{kind:"dog"},"left",0,{});c.restore();}}
  // party panel
  const px0=318,pw=158;c.fillStyle="rgba(10,8,20,.84)";c.beginPath();c.roundRect?c.roundRect(px0,5,pw,8+B.party.length*15,6):c.rect(px0,5,pw,8+B.party.length*15);c.fill();c.strokeStyle="rgba(201,164,74,.7)";c.lineWidth=.8;c.stroke();
  B.party.forEach((p,i)=>{const y=11+i*15;const cur=B.cur===p;
    if(cur){c.fillStyle="rgba(255,217,106,.12)";c.fillRect(px0+2,y-3,pw-4,15);}
    circlePortrait(c,portraitImg(p.id),px0+10,y+4.5,6,cur?"#ffd96a":p.id===ME()?"#7fe0b8":"#3a3160");
    bText(c,(PARTY_DEF[p.id].short||p.name).split(" ")[0],px0+20,y+3.5,cur?"#ffd96a":p.hp<=0?"#a55":"#efe3c4",6.4,600);
    BAR(c,px0+62,y-.5,60,4,p.hp/p.hpMax,lagFrac(p),p.hp/p.hpMax<.3?"#e05a5a":"#5fd08a");
    if(p.temp>0){c.fillStyle="#9fe0ff";c.fillRect(px0+62,y+4,Math.min(60,p.temp*4),1.2);}
    bText(c,`${Math.max(0,p.hp)}/${p.hpMax}`,px0+pw-5,y+3.5,"#efe3c4",5,400,"right","CMLabel");
    const P2=STATE.pcs[p.id],s=pcStat(p.id);let res="";if(s.slotsMax)res="◆".repeat(P2.slots)+"◇".repeat(Math.max(0,s.slotsMax-P2.slots));if(p.id==="krodha")res="●".repeat(P2.ki)+"○".repeat(Math.max(0,s.kiMax-P2.ki));if(p.id==="lucky")res="⁍".repeat(Math.min(10,P2.ammo));
    c.font=F7(4.2);c.fillStyle="#b89cf0";c.fillText(res.slice(0,10),px0+62,y+9.6);
    const sts=Object.keys(p.st).filter(s=>p.st[s]>0);if(sts.length)bText(c,stName(sts[0]).slice(0,7),px0+pw-5,y+10,"#c8a8ff",4.2,400,"right","CMLabel");});
  // turn order ribbon
  {let ox=10;const y=14;c.fillStyle="rgba(10,8,20,.78)";const live=B.order.filter(o=>!o.dead&&o.hp>0);const w=Math.min(300,24+live.length*17);c.beginPath();c.roundRect?c.roundRect(4,4,w,20,10):c.rect(4,4,w,20);c.fill();
    bText(c,"R"+B.round,ox,y+2.5,"#a79cc0",6,700,"left","CMLabel");ox+=16;
    live.forEach(o=>{const cur=o===B.cur,r=cur?7:5.6;const im=o.side==="pc"?portraitImg(o.id):o.side==="foe"?monImage(o.M):null;
      circlePortrait(c,im,ox+r,y,r,cur?"#ffd96a":o.side==="pc"?"#5fd08a":o.side==="ally"?"#d8b060":"#e05a5a");ox+=r*2+3.5;});}
  if(B.enc.ritual){bText(c,"RITUAL",8,36,"#ff7a7a",6,400,"left","CMLabel");for(let k=0;k<3;k++){c.fillStyle=k<B.ritual?"#e03a4a":"rgba(255,255,255,.15)";c.fillRect(44+k*9,30.5,7,6);}}
  if(B.enc.timer)bText(c,"BLOOD RISING · "+B.timer,8,36,"#ff5a5a",6,400,"left","CMLabel");
  // effects
  B7.rings=B7.rings.filter(r=>t-r.born<420);B7.rings.forEach(r=>{const k=(t-r.born)/420;c.strokeStyle=r.col;c.globalAlpha=1-k;c.lineWidth=2*(1-k)+.5;c.beginPath();c.arc(r.x,r.y,r.r*(.3+k),0,7);c.stroke();c.globalAlpha=1;});
  B7.slashes=B7.slashes.filter(s=>t-s.born<300);B7.slashes.forEach(s=>{const k=(t-s.born)/300;if(k<0)return;c.save();c.translate(s.x,s.y);c.rotate(s.ang);c.globalAlpha=1-k;c.strokeStyle=s.col;c.lineCap="round";
    if(s.ray){c.lineWidth=2;c.beginPath();c.moveTo(8+k*10,0);c.lineTo(22+k*26,0);c.stroke();}else{c.lineWidth=3*(1-k)+.6;c.beginPath();c.moveTo(-26+k*10,0);c.lineTo(26*k+4,0);c.stroke();}c.restore();});
  c.save();B7.parts=B7.parts.filter(p=>t-p.born<p.life);B7.parts.forEach(p=>{const age=(t-p.born)/1000;if(age<0)return;const k=(t-p.born)/p.life;const x=p.x+p.vx*age,y=p.y+p.vy*age+.5*p.g*age*age;
    c.globalAlpha=1-k;if(p.glow){c.globalCompositeOperation="lighter";}c.fillStyle=p.col;c.fillRect(x-p.s/2,y-p.s/2,p.s,p.s);c.globalCompositeOperation="source-over";});c.restore();c.globalAlpha=1;
  // floating numbers
  B.fx=B.fx.filter(f=>t-f.born<f.life);B.fx.forEach(f=>{const k=(t-f.born)/f.life;
    if(f.num){const up=Math.min(1,k*3.2),bounce=k<.32?-Math.sin(up*Math.PI)*16:-(k-.32)*10,sc=f.crit?(k<.12?1+(.12-k)*8:1.25):(k<.1?1+(.1-k)*5:1);
      c.save();c.globalAlpha=k>.7?(1-k)/.3:1;c.translate(f.x+(f.vx||0)*k,f.y+bounce);c.scale(sc,sc);bText(c,f.t,0,0,f.crit?"#ffd96a":f.col,f.crit?13:10,700,"center","CMLabel");if(f.crit)bText(c,"CRIT!",0,-13,"#fff3cf",6,400,"center","CMLabel");c.restore();}
    else{c.globalAlpha=1-k;bText(c,f.t,f.x,f.y-k*18,f.col,6.4,400,"center","CMLabel");c.globalAlpha=1;}});
  // turn sweep
  if(B7.turn){const k=(t-B7.turn.born)/900;if(k<1){const a=k<.2?k/.2:k>.75?(1-k)/.25:1;c.save();c.globalAlpha=a;
      const pc=B7.turn.who,lab=pc?(pc===ME()?"YOUR TURN":`${(PARTY_DEF[pc].short||PARTY_DEF[pc].name).toUpperCase()}'S TURN`):`${(B7.turn.foe.name||"").toUpperCase()}`;
      const yy=72,sw=lerp(0,480,Math.min(1,k*4));g=c.createLinearGradient(240-sw/2,0,240+sw/2,0);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.5,pc?"rgba(40,30,80,.75)":"rgba(80,10,20,.7)");g.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=g;c.fillRect(0,yy-11,480,18);
      bText(c,lab,240+(1-Math.min(1,k*5))*-30,yy+2.5,pc?"#ffd96a":"#ffb0a0",pc?10:8,400,"center","CMFellSC");c.restore();}else B7.turn=null;}
  drawDice7(c,t);
  if(FX.flash>0){c.globalAlpha=FX.flash;c.fillStyle=FX.flashCol;c.fillRect(-10,-10,500,360);c.globalAlpha=1;FX.flash=Math.max(0,FX.flash-.1);}
  c.restore();
};

/* --------------------------------------------------------------- victory */
battleEnd=async function(res,opt){
  const B=BATTLE;
  B.party.forEach(p=>{STATE.pcs[p.id].hp=Math.max(0,p.hp);});
  if(res==="win"){
    STATE.stats.wins++;playSong("victory");SFX.win();
    let xp=0,gold=0;B.foes.forEach(f=>{xp+=f.M.xp||0;const g2=f.M.gold||[0,0];gold+=ri(g2[0],g2[1]);});
    if(B.enc.foes.some(k=>MON[k].boss)&&!B.koAny)badge("noKO");
    B.party.forEach(p=>{if(STATE.pcs[p.id].hp<=0)STATE.pcs[p.id].hp=1;});
    $("bmenu").style.display="none";blog(`<b style="color:var(--gold)">Victory!</b>`);
    const L0=STATE.level,xp0=STATE.xp;addGold(gold);const lv=addXP(xp,true);
    const span=l=>[LEVEL_XP[l-1],LEVEL_XP[Math.min(5,l)]];const [a0,b0]=span(L0);const f0=L0>=5?1:(xp0-a0)/(b0-a0);const [a1,b1]=span(STATE.level);const f1=STATE.level>=5?1:(STATE.xp-a1)/(b1-a1);
    const v=$("vic7");const boss=B.foes.find(f=>f.boss);
    v.innerHTML=`<div class="vb"><div class="vt">Victory!</div>${boss?`<div class="sub" style="color:var(--ghost)">${esc(boss.name)} is defeated.</div>`:""}
      <div class="vr"><div><b>+${xp}</b><span>EXPERIENCE</span></div><div><b>+${gold}</b><span>GOLD</span></div><div><b>${B.round}</b><span>ROUNDS</span></div></div>
      <div class="xpb"><i id="vxp" style="width:${Math.round(f0*100)}%"></i></div><div class="xpl">LEVEL ${STATE.level}${STATE.level<5?` · ${STATE.xp} / ${LEVEL_XP[STATE.level]} XP`:" · MAX"}</div>
      ${B.koAny?`<div class="loot">Everyone who fell gets back up with 1 HP.</div>`:`<div class="loot">Nobody went down.</div>`}
      ${lv?`<div class="lvup">✦ Level up! ✦</div>`:""}<div class="go">PRESS A</div></div>`;
    v.classList.add("on");setTimeout(()=>{const i=$("vxp");if(i)i.style.width=(lv?100:Math.round(f1*100))+"%";},120);
    for(let k=0;k<30;k++)setTimeout(()=>burst(rnd(60,420),rnd(40,120),pick(["#ffd96a","#7fe0b8","#f1dca0"]),6,60,{glow:1,life:900}),k*40);
    await sleep(500);await new Promise(r=>{const h=pushH(k=>{if(k==="A"||k==="B"||k==="START"){popH(h);r();}});v.onclick=()=>{popH(h);r();};});
    v.classList.remove("on");v.onclick=null;
    if(lv)await levelUpFanfare();
  }else if(res==="flee"){blog("You fled.");await bwait(700);}
  else if(res==="rescued"){blog("The door bursts open — Azareth hauls Lucky out of the blood!");B.party.forEach(p=>{if(STATE.pcs[p.id].hp<=0)STATE.pcs[p.id].hp=1;});await waitA();B.result="win";return;}
  else{SFX.lose();playSong(null);blog("<b style='color:var(--blood)'>The party falls…</b>");await sleep(1200);await gameOver();}
  B7.parts=[];B7.rings=[];B7.slashes=[];B7.lag={};
};

/* ------------------------------------------------- level up + game over */
levelUpFanfare=async function(){
  SFX.level();const L=STATE.level;
  const newAb=[];PARTY_ORDER.forEach(id=>PARTY_DEF[id].abil.forEach(a=>{if(ABIL[a].lvl===L&&(!ABIL[a].need||hasF(ABIL[a].need)))newAb.push([id,ABIL[a].name]);}));
  let h=`<div style="text-align:center"><div class="sc-k">THE WHOLE PARTY GROWS STRONGER</div><div style="font-family:var(--f-goth);font-size:72px;line-height:1;color:#ffd96a;text-shadow:0 4px 0 #000,0 0 30px rgba(255,206,58,.4)">Level ${L}</div>
    <div class="grid2" style="margin-top:12px;grid-template-columns:repeat(5,1fr)">`;
  PARTY_ORDER.forEach(id=>{const s=pcStat(id);h+=`<div class="card" style="text-align:center;padding:6px"><div style="width:100%;aspect-ratio:2/3;border-radius:5px;background:url('${cardSrc(id)}') center/cover;border:1px solid #000"></div>
    <h4 style="margin:6px 0 2px;font-family:var(--f-title);font-weight:400;font-size:18px">${esc(PARTY_DEF[id].short||PARTY_DEF[id].name)}</h4><div class="sub">HP <b style="color:var(--ok)">${s.hpMax}</b> · AC ${s.ac}${s.slotsMax?" · "+s.slotsMax+" slots":""}${s.kiMax?" · "+s.kiMax+" ki":""}${id==="lucky"?" · Sneak "+s.sneak:""}</div>
    ${newAb.filter(n=>n[0]===id).map(n=>`<div class="chip g" style="margin-top:4px;display:inline-block">NEW · ${esc(n[1])}</div>`).join("")}</div>`;});
  h+=`</div><p class="sub" style="margin-top:10px">Everyone is fully restored.</p><button class="btn nav" onclick="closeModal()">Onward</button></div>`;
  await modalAwait("✦ Level Up ✦","",h,navList());
};
gameOver=async function(){
  const h=`<div style="text-align:center;padding:10px 0"><div style="font-family:var(--f-goth);font-size:60px;line-height:1;color:#e05a5a;text-shadow:0 4px 0 #000,0 0 30px rgba(200,40,60,.4)">The Hollow claims you</div>
    <p style="font-size:16px">…and spits you back out. You wake at your last rest, lighter in the purse.</p><button class="btn nav" onclick="closeModal()">Continue (lose 10% gold)</button></div>`;
  await modalAwait("✝","",h,navList());
  STATE.gold=Math.floor(STATE.gold*.9);PARTY_ORDER.forEach(refillPC);
  const r=STATE.restPoint;await warp(r.map,r.x,r.y,"down",{banner:["…","You wake up."]});
};

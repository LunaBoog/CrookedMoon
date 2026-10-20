/* =============================== v7 · world ============================= *
 * World-feel: warm lamp glows, footstep dust, a proper quest marker (gold
 * diamond + ground ring), twinkling ✦ on things worth examining, nicer "…"
 * bubbles, and a soft spotlight on the leader. */
const DUST=[];
const LIGHTS7={station:[[17.5,5.5,"#9fffe0",2.6]]}; // painted lamps that the art carries but no prop does
{const _ar=onArrive;onArrive=function(){const M=curMap();
  if(M.theme!=="train"&&M.theme!=="house"&&(M.art||M.theme==="station")){for(let i=0;i<3;i++)DUST.push({x:P.rx+12+rnd(-5,5),y:P.ry+21+rnd(-1,2),vx:rnd(-8,8),vy:rnd(-6,-1),r:rnd(1.5,3),a:.35,t:0});}
  _ar();};}
drawMarkers=function(c,t){
  const M=curMap();const tgt=objectiveTarget();
  // dust
  for(let i=DUST.length-1;i>=0;i--){const d2=DUST[i];d2.t+=1/60;d2.x+=d2.vx/60;d2.y+=d2.vy/60;d2.r+=.05;d2.a-=.012;if(d2.a<=0){DUST.splice(i,1);continue;}
    c.fillStyle=`rgba(200,190,170,${d2.a})`;c.beginPath();c.arc(d2.x,d2.y,d2.r,0,7);c.fill();}
  // ✦ on unexamined things
  M.props.forEach(p=>{if(!vis(p)||!p.talk)return;if(STATE.inspected[M.id+":"+p.id])return;const a=.45+.55*Math.max(0,Math.sin(t/300+p.x*1.7+p.y));
    const x=p.x*T+12,y=p.y*T-1;c.save();c.globalAlpha=a;c.fillStyle="#fff3c4";c.beginPath();const r=3.2*(.8+.4*a);
    c.moveTo(x,y-r);c.lineTo(x+r*.28,y-r*.28);c.lineTo(x+r,y);c.lineTo(x+r*.28,y+r*.28);c.lineTo(x,y+r);c.lineTo(x-r*.28,y+r*.28);c.lineTo(x-r,y);c.lineTo(x-r*.28,y-r*.28);c.fill();
    c.globalAlpha=a*.35;c.beginPath();c.arc(x,y,r*1.8,0,7);c.fill();c.restore();});
  // "…" over people you haven't met
  M.npcs.forEach(n=>{if(!vis(n)||STATE.talked[n.id]||n.wander&&!["rusty","rain"].includes(n.id))return;const x=(n.rx??n.x*T)+13,y=(n.ry??n.y*T)-8+Math.sin(t/400+n.x)*.8;
    c.fillStyle="rgba(10,8,20,.88)";c.beginPath();c.roundRect?c.roundRect(x-1,y-6,13,8,3):c.rect(x-1,y-6,13,8);c.fill();c.beginPath();c.moveTo(x+2,y+2);c.lineTo(x+5,y+2);c.lineTo(x+2,y+4.5);c.fill();
    c.fillStyle="#f1dca0";for(let k=0;k<3;k++){const o=((t/220|0)%3)===k?-.6:0;c.fillRect(x+1.5+k*3.4,y-2.5+o,1.6,1.6);}});
  // objective: ground ring + floating diamond
  if(tgt){const gx=tgt.x*T+12,gy=tgt.y*T+20,ph=(t/900)%1;const col=tgt.exit?"159,224,176":"255,206,58";
    c.save();c.strokeStyle=`rgba(${col},${.55*(1-ph)})`;c.lineWidth=1.2;c.beginPath();c.ellipse(gx,gy,6+10*ph,2.5+4*ph,0,0,7);c.stroke();c.restore();
    const bx2=tgt.x*T+12,by2=tgt.y*T-12+Math.sin(t/220)*2.2,s=4.2;
    c.save();c.translate(bx2,by2);c.fillStyle=`rgba(${col},.22)`;c.beginPath();c.arc(0,0,8,0,7);c.fill();
    c.fillStyle="#120c04";c.beginPath();c.moveTo(0,-s-1.4);c.lineTo(s+1.4,0);c.lineTo(0,s+1.4);c.lineTo(-s-1.4,0);c.fill();
    c.fillStyle=`rgb(${col})`;c.beginPath();c.moveTo(0,-s);c.lineTo(s,0);c.lineTo(0,s);c.lineTo(-s,0);c.fill();
    c.fillStyle="rgba(255,255,255,.7)";c.beginPath();c.moveTo(0,-s);c.lineTo(s*.45,-s*.1);c.lineTo(0,0);c.lineTo(-s*.45,-s*.1);c.fill();c.restore();}
  // faced thing: a soft bracket, the label lives in the HTML chip
  if(canWalk()){const f=facedEntity();if(f){const e=f.e;const x=(e.rx??e.x*T),y=(e.ry??e.y*T);const k=1.5*Math.sin(t/160);
    c.strokeStyle="rgba(241,220,160,.85)";c.lineWidth=1.2;const L=5,x0=x+1-k,y0=y+1-k,x1=x+23+k,y1=y+23+k;
    c.beginPath();c.moveTo(x0,y0+L);c.lineTo(x0,y0);c.lineTo(x0+L,y0);c.moveTo(x1-L,y0);c.lineTo(x1,y0);c.lineTo(x1,y0+L);c.moveTo(x1,y1-L);c.lineTo(x1,y1);c.lineTo(x1-L,y1);c.moveTo(x0+L,y1);c.lineTo(x0,y1);c.lineTo(x0,y1-L);c.stroke();}}
  CAM.tgt=tgt;
};
/* warm glows (additive, after the darkness) */
{const _dl=drawLighting;drawLighting=function(M,t){_dl(M,t);
  const c=ctx,S=(wx,wy)=>[(wx-CAM.x)*CAM.z,(wy-CAM.y)*CAM.z];c.save();c.globalCompositeOperation="lighter";
  const glow=(wx,wy,r,col,a)=>{const [x,y]=S(wx,wy);const R=r*CAM.z;if(x<-R||y<-R||x>VW+R||y>VH+R)return;const g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,col.replace("A",a));g.addColorStop(1,col.replace("A",0));c.fillStyle=g;c.fillRect(x-R,y-R,R*2,R*2);};
  const fl=1+.07*Math.sin(t/90)+.04*Math.sin(t/37);
  M.props.forEach(p=>{if(!vis(p))return;if(p.art==="lamp")glow(p.x*T+12,p.y*T+4,T*1.6*fl,"rgba(160,255,215,A)",.32);if(p.art==="fire")glow(p.x*T+12,p.y*T+12,T*2.2*fl,"rgba(255,150,60,A)",.38);if(p.art==="jar")glow(p.x*T+12,p.y*T+12,T*1.3*fl,"rgba(120,255,170,A)",.35);});
  (LIGHTS7[M.id]||[]).forEach(([gx,gy,col,r])=>{const h=col.replace("#","");const rr=parseInt(h.slice(0,2),16),gg=parseInt(h.slice(2,4),16),bb=parseInt(h.slice(4,6),16);
    glow(gx*T,gy*T,T*r*fl,`rgba(${rr},${gg},${bb},A)`,.34);});
  // leader spotlight in the dark places
  if((M.dark||0)>.3)glow(P.rx+12,P.ry+14,T*2.4,"rgba(255,230,190,A)",.06);
  c.restore();};}

/* the arrival cinematic (v6.1 drawCine) with its title card in the new type */
drawCine=function(t){const C=STAGE.cine;if(!C)return;const now=performance.now(),k=clamp((now-C.t0)/C.dur,0,1);
  const a=C.out?clamp(1-(now-C.out)/600,0,1):clamp((now-C.t0)/700,0,1);if(C.out&&a<=0){STAGE.cine=null;return;}
  const c=ctx,im=IMG.scene_train;c.save();c.globalAlpha=a;c.fillStyle="#000";c.fillRect(0,0,VW,VH);
  if(im){const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const base=Math.max(VW/im.width,VH/im.height),z=base*lerp(1.02,1.38,e);
    const fx=lerp(.55,.40,e)*im.width,fy=lerp(.5,.43,e)*im.height;let ox=VW/2-fx*z,oy=VH/2-fy*z;
    ox=clamp(ox,VW-im.width*z,0);oy=clamp(oy,VH-im.height*z,0);
    smooth(c,true);c.drawImage(im,ox,oy,im.width*z,im.height*z);smooth(c,false);
    const lx2=ox+.385*im.width*z,ly2=oy+.40*im.height*z,R=60*z/base*(1+.08*Math.sin(t/110));
    c.globalCompositeOperation="lighter";const g=c.createRadialGradient(lx2,ly2,2,lx2,ly2,R);g.addColorStop(0,"rgba(140,255,220,.35)");g.addColorStop(1,"rgba(0,60,50,0)");c.fillStyle=g;c.fillRect(lx2-R,ly2-R,R*2,R*2);c.globalCompositeOperation="source-over";}
  C.fog=C.fog||Array.from({length:18},()=>({x:rnd(0,VW),y:rnd(VH*.45,VH),r:rnd(30,70),v:rnd(40,110),a:rnd(.05,.12)}));
  C.fog.forEach(f=>{f.x-=f.v/60;if(f.x<-f.r)f.x=VW+f.r;c.save();c.translate(f.x,f.y);c.scale(1,.3);const g=c.createRadialGradient(0,0,0,0,0,f.r);g.addColorStop(0,`rgba(190,230,225,${f.a*1.6})`);g.addColorStop(1,"rgba(190,230,225,0)");c.fillStyle=g;c.fillRect(-f.r,-f.r,f.r*2,f.r*2);c.restore();});
  const bar=lerp(0,30,clamp((now-C.t0)/600,0,1));c.fillStyle="#000";c.fillRect(0,0,VW,bar);c.fillRect(0,VH-bar,VW,bar);
  const ta=clamp((now-C.t0-1400)/900,0,1);if(ta>0){c.globalAlpha=a*ta;c.textAlign="center";
    c.font=F7(6,400,"CMLabel");c.fillStyle="#9fe0b0";c.fillText("OUT OF THE MIST",VW/2,VH-42);
    c.font=F7(22,400,"CMFellSC");c.fillStyle="#000";c.fillText("The Ghostlight Express",VW/2+1,VH-19);c.fillStyle="#f6e5b0";c.fillText("The Ghostlight Express",VW/2,VH-20);c.textAlign="left";}
  c.restore();};

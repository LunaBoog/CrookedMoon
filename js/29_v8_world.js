/* =============================== v8 · world ============================= *
 *   · markers sit above the taller v8 sprites (… bubbles, quest diamond)
 *   · Wickermoor's time of day you can see: warm windows at Dusk and Night,
 *     fireflies, a cold blue night grade; fireflies in the woods
 *   · the tracker says WHERE: a compass arrow and how far ("12 steps",
 *     "2 areas away")
 *   · finishing a task stamps it: a wax-seal card slides out under the tracker
 *   · banners queue instead of stacking (quest banner waits for the place name) */

/* ------------------------------------------------------------- markers */
drawMarkers=function(c,t){
  const M=curMap();const tgt=objectiveTarget();
  for(let i=DUST.length-1;i>=0;i--){const d2=DUST[i];d2.t+=1/60;d2.x+=d2.vx/60;d2.y+=d2.vy/60;d2.r+=.05;d2.a-=.012;if(d2.a<=0){DUST.splice(i,1);continue;}
    c.fillStyle=`rgba(200,190,170,${d2.a})`;c.beginPath();c.arc(d2.x,d2.y,d2.r,0,7);c.fill();}
  M.props.forEach(p=>{if(!vis(p)||!p.talk)return;if(STATE.inspected[M.id+":"+p.id])return;const a=.45+.55*Math.max(0,Math.sin(t/300+p.x*1.7+p.y));
    const x=p.x*T+12,y=p.y*T-1;c.save();c.globalAlpha=a;c.fillStyle="#fff3c4";c.beginPath();const r=3.2*(.8+.4*a);
    c.moveTo(x,y-r);c.lineTo(x+r*.28,y-r*.28);c.lineTo(x+r,y);c.lineTo(x+r*.28,y+r*.28);c.lineTo(x,y+r);c.lineTo(x-r*.28,y+r*.28);c.lineTo(x-r,y);c.lineTo(x-r*.28,y-r*.28);c.fill();
    c.globalAlpha=a*.35;c.beginPath();c.arc(x,y,r*1.8,0,7);c.fill();c.restore();});
  const isNpc=e=>M.npcs.includes(e);
  M.npcs.forEach(n=>{if(!vis(n)||STATE.talked[n.id]||n.wander&&!["rusty","rain"].includes(n.id))return;
    const tall=typeof n.look==="string"&&n.look.startsWith("mon:")?(n.big?16:6):0;
    const x=(n.rx??n.x*T)+17,y=(n.ry??n.y*T)-15-tall+Math.sin(t/400+n.x)*.8;
    c.fillStyle="rgba(10,8,20,.9)";c.beginPath();c.roundRect?c.roundRect(x-1,y-6,13,8,3):c.rect(x-1,y-6,13,8);c.fill();c.beginPath();c.moveTo(x+1,y+2);c.lineTo(x+4,y+2);c.lineTo(x,y+5);c.fill();
    c.fillStyle="#f1dca0";for(let k=0;k<3;k++){const o=((t/220|0)%3)===k?-.6:0;c.fillRect(x+1.5+k*3.4,y-2.5+o,1.6,1.6);}});
  if(tgt){const gx=tgt.x*T+12,gy=tgt.y*T+20,ph=(t/900)%1;const col=tgt.exit?"159,224,176":"255,206,58";
    const ent=!tgt.exit&&(M.npcs.find(n=>vis(n)&&n.x===tgt.x&&n.y===tgt.y));const lift=ent?(typeof ent.look==="string"&&ent.look.startsWith("mon:")?(ent.big?30:22):24):12;
    c.save();c.strokeStyle=`rgba(${col},${.55*(1-ph)})`;c.lineWidth=1.2;c.beginPath();c.ellipse(gx,gy,6+10*ph,2.5+4*ph,0,0,7);c.stroke();c.restore();
    const bx2=tgt.x*T+12,by2=tgt.y*T-lift+Math.sin(t/220)*2.2,s=4.2;
    c.save();c.translate(bx2,by2);c.fillStyle=`rgba(${col},.22)`;c.beginPath();c.arc(0,0,8,0,7);c.fill();
    c.fillStyle="#120c04";c.beginPath();c.moveTo(0,-s-1.4);c.lineTo(s+1.4,0);c.lineTo(0,s+1.4);c.lineTo(-s-1.4,0);c.fill();
    c.fillStyle=`rgb(${col})`;c.beginPath();c.moveTo(0,-s);c.lineTo(s,0);c.lineTo(0,s);c.lineTo(-s,0);c.fill();
    c.fillStyle="rgba(255,255,255,.7)";c.beginPath();c.moveTo(0,-s);c.lineTo(s*.45,-s*.1);c.lineTo(0,0);c.lineTo(-s*.45,-s*.1);c.fill();c.restore();}
  if(canWalk()){const f=facedEntity();if(f){const e=f.e;const x=(e.rx??e.x*T),y=(e.ry??e.y*T);const k=1.5*Math.sin(t/160);const up=f.type==="npc"?10:0;
    c.strokeStyle="rgba(241,220,160,.85)";c.lineWidth=1.2;const L=5,x0=x+1-k,y0=y+1-k-up,x1=x+23+k,y1=y+23+k;
    c.beginPath();c.moveTo(x0,y0+L);c.lineTo(x0,y0);c.lineTo(x0+L,y0);c.moveTo(x1-L,y0);c.lineTo(x1,y0);c.lineTo(x1,y0+L);c.moveTo(x1,y1-L);c.lineTo(x1,y1);c.lineTo(x1-L,y1);c.moveTo(x0+L,y1);c.lineTo(x0,y1);c.lineTo(x0,y1-L);c.stroke();}}
  CAM.tgt=tgt;
};

/* ------------------------------------------------- time of day you can see */
const WIN8=VBLD.filter(r=>!["stones","statue","oak","compass","gazebo","aviary"].includes(r[4])).map((r,i)=>({x:(r[0]+r[2]+1)/2,y:(r[1]+r[3]+1)/2,w:r[2]-r[0]+1,ph:i*1.37,big:["inn","townhall","manor","church","trading"].includes(r[4])}));
const FLY8={list:[],map:null};
function phase8(){if(!STATE||!STATE.v6||!hasF("ch2"))return -1;try{return X().phase;}catch(e){return -1;}}
{const _dl=drawLighting;drawLighting=function(M,t){
  if(!v8opt("tod")){_dl(M,t);return;}
  const ph=M.id==="village"?phase8():-1;
  _dl(M,t);
  const c=ctx,S=(wx,wy)=>[(wx-CAM.x)*CAM.z,(wy-CAM.y)*CAM.z];
  // night grade: cool shadows, a touch of moonlight
  if(ph===3){c.save();c.globalCompositeOperation="multiply";c.fillStyle="rgba(120,135,200,.35)";c.fillRect(0,0,VW,VH);c.restore();}
  if(ph===2){c.save();c.globalCompositeOperation="soft-light";c.fillStyle="rgba(255,140,80,.28)";c.fillRect(0,0,VW,VH);c.restore();}
  if(ph===0){c.save();c.globalCompositeOperation="soft-light";c.fillStyle="rgba(255,190,140,.22)";c.fillRect(0,0,VW,VH);c.restore();}
  c.save();c.globalCompositeOperation="lighter";
  const glow=(wx,wy,r,col,a)=>{const [x,y]=S(wx,wy);const R=r*CAM.z;if(x<-R||y<-R||x>VW+R||y>VH+R)return;const g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(x-R,y-R,R*2,R*2);};
  if(ph>=2){const A=ph===3?.34:.18;WIN8.forEach(w=>{const fl=.85+.15*Math.sin(t/(170+w.ph*20)+w.ph)+.05*Math.sin(t/53+w.ph);glow(w.x*T,w.y*T+T*.4,T*(w.big?1.9:1.2),"255,190,110",A*fl);});}
  // fireflies: the village after dusk, the woods always
  const wantFly=(ph>=2)||M.theme==="woods";
  if(wantFly){if(FLY8.map!==M.id){FLY8.map=M.id;FLY8.list=Array.from({length:M.theme==="woods"?26:20},()=>({x:rnd(0,M.w*T),y:rnd(0,M.h*T),vx:rnd(-6,6),vy:rnd(-6,6),ph:rnd(0,6)}));}
    FLY8.list.forEach(f=>{f.ph+=.03;f.x+=f.vx/60+Math.sin(f.ph)*.15;f.y+=f.vy/60+Math.cos(f.ph*.7)*.15;if(f.x<0||f.x>M.w*T)f.vx*=-1;if(f.y<0||f.y>M.h*T)f.vy*=-1;
      const a=Math.max(0,Math.sin(f.ph*1.3));if(a<.05)return;const [x,y]=S(f.x,f.y);if(x<-6||y<-6||x>VW+6||y>VH+6)return;
      c.fillStyle=`rgba(210,255,140,${.75*a})`;c.fillRect(x-.6,y-.6,1.2,1.2);const g=c.createRadialGradient(x,y,0,x,y,5);g.addColorStop(0,`rgba(190,255,120,${.28*a})`);g.addColorStop(1,"rgba(190,255,120,0)");c.fillStyle=g;c.fillRect(x-5,y-5,10,10);});}
  c.restore();};}

/* ------------------------------------------------- tracker: where to go */
function where8(){
  const o=objective();if(!o||!o.tgt)return null;const g=o.tgt;
  if(g.map&&g.map!==STATE.map){
    // areas away (BFS through exits)
    const prev={};prev[STATE.map]=0;const q=[STATE.map];let hops=null;
    while(q.length){const m=q.shift();if(m===g.map){hops=prev[m];break;}for(const e of MAPS[m].exits){if(!e.to||!MAPS[e.to]||prev[e.to]!==undefined)continue;prev[e.to]=prev[m]+1;q.push(e.to);}}
    const tg=objectiveTarget();const dir=tg?arrow8(tg.x-STATE.x,tg.y-STATE.y):"";
    return {dir,txt:hops===1?`next door · ${esc(MAPS[g.map].name)}`:hops?`${hops} areas away · ${esc(MAPS[g.map].name)}`:esc(MAPS[g.map].name)};}
  const tg=objectiveTarget();if(!tg)return null;
  const dx=tg.x-STATE.x,dy=tg.y-STATE.y,dist=Math.abs(dx)+Math.abs(dy);
  if(dist<=1)return {dir:"✦",txt:"right here"};
  return {dir:arrow8(dx,dy),txt:dist<=4?"close by":`${dist} steps`};
}
function arrow8(dx,dy){if(!dx&&!dy)return "✦";const a=Math.atan2(dy,dx),i=(Math.round(a/(Math.PI/4))+8)%8;return ["→","↘","↓","↙","←","↖","↑","↗"][i];}
{const _tr=v7tracker;v7tracker=function(){_tr();const el=$("trk7");if(!el||el.classList.contains("hide"))return;
  let w=el.querySelector(".w8");const W=where8();
  if(!W){if(w)w.remove();return;}
  if(!w){w=document.createElement("div");w.className="w8";const t=el.querySelector(".s")||el.querySelector(".t");if(t)t.after(w);else el.appendChild(w);}
  const h=`<b>${W.dir}</b><span>${W.txt}</span>`;if(w.innerHTML!==h)w.innerHTML=h;};}

/* --------------------------------------------------------- task stamps */
const STAMP8={q:[],busy:false};
function stamp8(label,prog){STAMP8.q.push({label,prog});pumpStamp8();}
async function pumpStamp8(){if(STAMP8.busy)return;STAMP8.busy=true;
  try{while(STAMP8.q.length){while(DLG_OPEN||MODAL||BATTLE.on||(SCRIPT.running&&!inWorld()))await sleep(200);
      const s=STAMP8.q.shift();let el=$("stamp8");if(!el){el=document.createElement("div");el.id="stamp8";($("hud7")||$("viewport")).appendChild(el);}
      const [a,b]=(s.prog||"").split("/").map(Number);
      el.innerHTML=`<div class="seal">✓</div><div class="tx"><div class="k">TASK DONE${s.prog?` · ${s.prog}`:""}</div><div class="n">${esc(s.label)}</div>${b?`<div class="pb"><i style="width:${Math.round(100*(a-1)/b)}%"></i></div>`:""}</div>`;
      el.classList.remove("on");void el.offsetWidth;el.classList.add("on");
      setTimeout(()=>{const i=el.querySelector(".pb i");if(i)i.style.width=Math.round(100*a/b)+"%";},350);
      noise(.06,.09,900);tone(196,.12,"square",.05);tone(988,.06,"square",.03,0,.12);tone(1318,.14,"square",.03,0,.18);
      try{X8().stamps=(X8().stamps||0)+1;}catch(e){}
      await sleep(2300);el.classList.remove("on");await sleep(380);}}
  finally{STAMP8.busy=false;}}
{const _to=toast;toast=function(t,kind){t=String(t);
  if(v8opt("stamps")&&kind==="gold"&&/^✓ /.test(t)&&!/^✓ Quest complete/.test(t)){const m=/^✓ (.*?)(?: · (\d+\/\d+))?$/.exec(t);if(m){trackerFlash();stamp8(m[1],m[2]||"");return;}}
  return _to(t,kind);};}

/* --------------------------------------- banners take turns, not stack */
{const _bn=banner;banner=function(a,b){banner.until=performance.now()+2600;return _bn(a,b);};banner.until=0;}
{const _qb=questBanner;questBanner=function(kind,name,done){v7queue(async()=>{while(performance.now()<(banner.until||0)||BATTLE.on)await sleep(150);});_qb(kind,name,done);};}

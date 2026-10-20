/* ================================ v7 · core ============================= *
 * THE GLOW-UP. Everything here layers on top of v6.1 the same way v6 did:
 * function declarations are re-assigned, nothing in the save format moves.
 *   · loading screen, embedded fonts, the HD station platform
 *   · options (text speed, volume, shake, iris, CRT, minimap, tracker)
 *   · HUD overlay over the world: quest tracker, minimap, "A ▸ Talk" prompt
 *   · quest banners + achievement pops, right-stacked toasts
 *   · the dialog box (voices, narration style, "you" tag), iris transitions
 *   · title screen (the Crooked Moon painting + logo), "Who do you play?"
 *   · postcards (P), run (Shift), new keys (N minimap · T tracker)
 * STATE.me = the PC the player plays at Moon's table (set at New Game).  */
const V7={ver:"v7",opt:{text:"normal",music:.8,sfx:.9,shake:1,iris:1,crt:0,mini:1,trk:1,trkOpen:0},q:[],qBusy:false,lastFace:null};
try{Object.assign(V7.opt,JSON.parse(sget("v7opts")||"{}"));}catch(e){}
function v7save(){sset("v7opts",JSON.stringify(V7.opt));}
const F7=(px,w,fam)=>`${w||""} ${px}px ${fam||"CMPixel"}, ui-monospace, monospace`.trim();
const ME=()=>STATE&&(STATE.me||STATE.lead);

/* ---------------------------------------------------------------- loading */
{const _li=loadImg;let tot=0,got=0;
  loadImg=function(k,src){tot++;return _li(k,src).then(()=>{got++;const b=$("l7bar");if(b)b.style.width=Math.round(100*got/Math.max(1,tot))+"%";});};
  const _la=loadAssets;loadAssets=async function(){
    const A7=window.ASSETS_V7||{};const jobs=[_la()];
    if(A7.logo)jobs.push(loadImg("v7logo",A7.logo));if(A7.title_bg)jobs.push(loadImg("v7title",A7.title_bg));if(A7.station)jobs.push(loadImg("map:station",A7.station));
    if(document.fonts)jobs.push(Promise.all(["16px CMTitle","400 16px CMPixel","600 16px CMPixel","700 16px CMPixel","16px CMLabel","16px CMFell","16px CMFellSC"].map(f=>document.fonts.load(f).catch(()=>{}))));
    const lines=["Summoning the Ghostlight Express…","Counting Old Rusty's graves…","Feeding the weasels…","Lighting the soul-furnace…","Shuffling Adela's tarot…"];let li=0;
    const iv=setInterval(()=>{const s=$("l7s");if(s)s.textContent=lines[++li%lines.length];},900);
    try{await Promise.all(jobs);}finally{clearInterval(iv);}
    ["CMTitle","CMPixel","CMLabel"].forEach(f=>{try{document.fonts.load(`16px ${f}`);}catch(e){}});
    if(MAPS.station&&IMG["map:station"])MAPS.station.art="station";
    v7applyOpts();
    setTimeout(()=>{const l=$("load7");if(l){l.classList.add("gone");setTimeout(()=>l.remove(),700);}},250);
  };}

/* ---------------------------------------------------------------- options */
function v7applyOpts(){document.body.classList.toggle("crt",!!V7.opt.crt);if(MUS.gain)MUS.gain.gain.value=.55*V7.opt.music;}
{const _t=tone;tone=function(f,dur,type,vol,slide,delay){if(V7.opt.sfx<=0)return;_t(f,dur,type,(vol||.05)*V7.opt.sfx,slide,delay);};
 const _n=noise;noise=function(dur,vol,hp){if(V7.opt.sfx<=0)return;_n(dur,(vol||.08)*V7.opt.sfx,hp);};
 const _ps=playSong;playSong=function(id){_ps(id);if(MUS.gain)MUS.gain.gain.value=.55*V7.opt.music;};
 const _sh=shake;shake=function(n){if(!V7.opt.shake)return;_sh((n||6)*V7.opt.shake);};}

/* ------------------------------------------------- HUD overlay placement */
function v7place(){const w=$("world"),vp=$("viewport"),h=$("hud7");if(!w||!vp||!h)return;
  const a=w.getBoundingClientRect(),b=vp.getBoundingClientRect();
  Object.assign(h.style,{left:(a.left-b.left)+"px",top:(a.top-b.top)+"px",width:a.width+"px",height:a.height+"px"});h.style.setProperty("--hs",clamp(a.width/1000,.85,1.4).toFixed(3));
  const crt=$("crt7");if(crt)Object.assign(crt.style,{left:(a.left-b.left)+"px",top:(a.top-b.top)+"px",width:a.width+"px",height:a.height+"px",right:"auto",bottom:"auto"});}
{const _sc=sizeCanvas;sizeCanvas=function(){_sc();requestAnimationFrame(v7place);};}
window.addEventListener("resize",()=>requestAnimationFrame(v7place));
function inWorld(){return !!STATE&&!STAGE.cine&&$("title").style.display==="none"&&!BATTLE.on&&$("minigame").style.display!=="flex"&&!$("arcade").classList.contains("on")&&$("credits").style.display!=="block";}

/* ------------------------------------------------------- quest tracker */
const TRK={last:"",flashT:0};
function taskLabel(t){return typeof t.label==="function"?t.label():t.label;}
function v7tracker(){
  const el=$("trk7");if(!el)return;
  const show=V7.opt.trk&&inWorld()&&!DLG_OPEN&&!MODAL;
  el.classList.toggle("hide",!show);if(!show)return;
  const o=objective();let h="";
  const x=STATE.v6?X():null,n=x?x.session:0,S=x&&SESSIONS[n];
  const head=S?(S.between?"BETWEEN SESSIONS":"SESSION "+n):"NEXT UP";
  h+=`<div class="k">✦ ${esc(head)}${S&&!S.between?` · <span style="color:#9a90bb">${esc(S.title)}</span>`:""}<span class="key">[T]</span></div>`;
  if(o)h+=`<div class="t">${esc(o.text)}</div>${o.sub?`<div class="s">${esc(o.sub)}</div>`:""}`;
  if(S){const T=sessTasks(n);const req=T.filter(t=>!t.opt),dn=req.filter(taskDone).length;
    if(!S.between&&req.length)h+=`<div class="pg"><span class="lbl">TASKS</span><span class="bar"><i style="width:${Math.round(100*dn/req.length)}%"></i></span><span class="n">${dn}/${req.length}</span></div>`;
    const rows=T.map(t=>({t,d:taskDone(t)}));const open=rows.filter(r=>!r.d),done=rows.filter(r=>r.d);
    const list=[...open.slice(0,7),...done.slice(-2)];
    h+=`<ul>${list.map(r=>`<li class="${r.d?"d":""}${r.t.opt&&!r.d?" o":""}"><i>${r.d?"✓":r.t.opt?"◇":"▸"}</i><span>${esc(taskLabel(r.t))}${r.t.opt&&!r.d?" <span style='opacity:.7'>(optional)</span>":""}</span></li>`).join("")}${open.length>7?`<li class="o"><i>…</i><span>${open.length-7} more in Menu ▸ Session</span></li>`:""}</ul>`;}
  el.classList.toggle("open",!!V7.opt.trkOpen);
  if(h!==TRK.last){el.innerHTML=h;TRK.last=h;}
}
$("trk7").onclick=()=>{V7.opt.trkOpen=V7.opt.trkOpen?0:1;v7save();TRK.last="";v7tracker();SFX.sel();};
function trackerFlash(){const el=$("trk7");if(!el)return;el.classList.remove("flash");void el.offsetWidth;el.classList.add("flash");const p=$("hudSess");if(p){p.classList.add("pulse");setTimeout(()=>p.classList.remove("pulse"),1400);}}

/* ---------------------------------------------------------------- minimap */
const MM={cache:{},t:0};
function mmBase(M){
  if(MM.cache[M.id])return MM.cache[M.id];
  const W=M.w*T,H=M.h*T,s=Math.min(280/W,180/H),c=document.createElement("canvas");c.width=Math.round(W*s);c.height=Math.round(H*s);const g=c.getContext("2d");
  const art=M.art&&IMG["map:"+M.art];
  if(art){g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(art,0,0,c.width,c.height);g.fillStyle="rgba(6,4,12,.25)";g.fillRect(0,0,c.width,c.height);}
  else{const cw=c.width/M.w,ch=c.height/M.h;for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++){const k=M.grid[y][x];g.fillStyle=SOLID.has(k)?(k==="~"?"#0b1014":"#1c1828"):k==="g"?"#2a3a24":k==="d"||k==="p"?"#4a3a2a":"#3d3346";g.fillRect(x*cw,y*ch,Math.ceil(cw),Math.ceil(ch));}}
  MM.cache[M.id]={c,s};return MM.cache[M.id];}
function v7minimap(t){
  const box=$("mm7");if(!box)return;const show=V7.opt.mini&&inWorld()&&!DLG_OPEN&&!MODAL&&!STAGE.cine;box.classList.toggle("hide",!show);if(!show)return;
  const M=curMap();if(M.w*M.h<60){box.classList.add("hide");return;}
  const B=mmBase(M),cv2=$("mmcv"),g=cv2.getContext("2d");const dpr=2;
  if(cv2.width!==B.c.width*dpr){cv2.width=B.c.width*dpr;cv2.height=B.c.height*dpr;cv2.style.width=B.c.width*.62+"px";cv2.style.height=B.c.height*.62+"px";box.style.width=(B.c.width*.62+10)+"px";}
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,B.c.width,B.c.height);g.drawImage(B.c,0,0);
  const s=B.s,P2=(x,y)=>[(x*T+12)*s,(y*T+12)*s];
  // view rectangle
  g.strokeStyle="rgba(241,220,160,.35)";g.lineWidth=1;g.strokeRect(CAM.x*s,CAM.y*s,VW/CAM.z*s,VH/CAM.z*s);
  // exits
  M.exits.forEach(e=>{if(!e.to||e.hidden&&(!e.need||!hasF(e.need)))return;const [x,y]=P2(e.x,e.y);g.fillStyle=!e.need||hasF(e.need)?"#7fe0b8":"#c33d4a";g.fillRect(x-2,y-2,4,4);});
  // npcs
  M.npcs.forEach(n=>{if(!vis(n))return;const [x,y]=P2(n.x,n.y);g.fillStyle=STATE.talked[n.id]?"#a79cc0":"#f1dca0";g.beginPath();g.arc(x,y,2,0,7);g.fill();});
  if(window.VISITORS)VISITORS.forEach(v=>{if(v.map!==STATE.map||v.gone)return;const [x,y]=P2(v.x,v.y);g.fillStyle="#ffce3a";g.font=F7(9,700);g.fillText("!",x-2,y+3);});
  ROAM.forEach(r=>{if(r.dead)return;const [x,y]=P2(r.x,r.y);g.fillStyle="#e05a5a";g.fillRect(x-2,y-2,4,4);});
  // objective
  const tg=objectiveTarget();if(tg){const [x,y]=P2(tg.x,tg.y);const k=1+.25*Math.sin(t/200);g.save();g.translate(x,y);g.rotate(Math.PI/4);g.fillStyle="#000";g.fillRect(-4*k,-4*k,8*k,8*k);g.fillStyle=tg.exit?"#7fe0b8":"#ffce3a";g.fillRect(-3*k,-3*k,6*k,6*k);g.restore();}
  // player
  const [px2,py2]=[(P.rx+12)*s,(P.ry+12)*s];g.fillStyle="#000";g.beginPath();g.arc(px2,py2,4,0,7);g.fill();g.fillStyle=(t/300|0)%2?"#ffffff":"#9fe0ff";g.beginPath();g.arc(px2,py2,2.6,0,7);g.fill();
  $("mmlbl").textContent=M.name+(M.sub?" · "+M.sub:"");
}

/* ------------------------------------------------- "A ▸ Talk" prompt chip */
function v7prompt(){
  const el=$("pr7");if(!el)return;let f=null;
  if(inWorld()&&canWalk())f=facedEntity();
  const key=f?(f.type+":"+(f.e.id||f.e.name)):"";
  if(key===V7.lastFace)return;V7.lastFace=key;
  if(!f){el.classList.remove("on");return;}
  const e=f.e;let verb="Examine",nm=e.name||"";
  if(f.type==="npc"){verb="Talk";nm=e.name||nameOf(e.id);}else if(f.type==="roam"){verb="Fight";nm=(MON[(e.look||"").slice(4)]||{}).name||"Something";}
  else if(!nm){nm=(e.art?String(e.art):"something");nm=nm.charAt(0).toUpperCase()+nm.slice(1);}
  el.innerHTML=`<span class="a">A</span><span class="v">${verb.toUpperCase()}</span><span>${esc(nm)}</span>`;el.classList.add("on");
}

/* ------------------------------------------------- banners, toasts, pops */
{const _bn=banner;banner=function(a,b){_bn(a,b);const B=$("banner");B.classList.remove("in");void B.offsetWidth;B.classList.add("in");};}
function v7queue(fn){V7.q.push(fn);if(!V7.qBusy)v7drain();}
async function v7drain(){V7.qBusy=true;while(V7.q.length){const f=V7.q.shift();try{await f();}catch(e){console.error(e);}}V7.qBusy=false;}
function questBanner(kind,name,done){v7queue(async()=>{const q=$("qban7");q.className=done?"done":"";q.innerHTML=`<div class="q1">${esc(kind)}</div><div class="q2">${esc(name)}</div><div class="q3"></div>`;
  void q.offsetWidth;q.classList.add("on");if(done){[523,659,784,1046,1318].forEach((f,i)=>tone(f,.16,"square",.04,0,i*.08));}else{[392,523,659].forEach((f,i)=>tone(f,.14,"triangle",.045,0,i*.09));}
  await sleep(2300);q.classList.remove("on");await sleep(420);});}
function achievePop(icon,name,desc){v7queue(async()=>{const a=$("ach7");a.innerHTML=`<div class="ic">${icon}</div><div><div class="k">ACHIEVEMENT UNLOCKED</div><div class="n">${esc(name)}</div><div class="d">${esc(desc)}</div></div>`;
  a.classList.add("on");[784,988,1175,1568].forEach((f,i)=>tone(f,.12,"square",.035,0,i*.07));await sleep(2600);a.classList.remove("on");await sleep(450);});}
{const _to=toast;toast=function(t,kind){t=String(t);
  let m;
  if((m=/^📜 New quest: (.*)$/.exec(t))){questBanner("NEW QUEST",m[1]);return;}
  if((m=/^✓ Quest complete: (.*)$/.exec(t))){questBanner("QUEST COMPLETE",m[1],true);return;}
  if((m=/^(\S+) Badge: (.*)$/.exec(t))){const k=Object.keys(BADGES).find(k=>BADGES[k][1]===m[2]);achievePop(m[1],m[2],k?BADGES[k][2]:"");return;}
  if(/^✓ /.test(t)&&kind==="gold"){trackerFlash();tone(988,.06,"square",.03);tone(1318,.12,"square",.03,0,.06);}
  _to(t,kind);};}

/* ------------------------------------------------- top bar party chips */
const HPPREV={};
{const _uh=updateHUD;updateHUD=function(){_uh();if(!STATE)return;const ph=$("partyhud");
  [...ph.children].forEach(d2=>{const id=d2.dataset.id;if(!d2.querySelector(".meta")){const bar=d2.querySelector(".bar");const m=document.createElement("div");m.className="meta";m.innerHTML=`<span class="nm">${esc((PARTY_DEF[id].short||PARTY_DEF[id].name).toUpperCase())}</span>`;m.appendChild(bar);d2.appendChild(m);
      const cr=document.createElement("span");cr.className="crown";cr.textContent="♛";d2.appendChild(cr);const y=document.createElement("span");y.className="you";y.textContent="YOU";d2.appendChild(y);}
    const s=pcStat(id),p=STATE.pcs[id];d2.classList.toggle("me",id===ME());d2.classList.toggle("low",p.hp/s.hpMax<.3);
    if(HPPREV[id]!==undefined&&p.hp<HPPREV[id]){d2.classList.remove("hit");void d2.offsetWidth;d2.classList.add("hit");}HPPREV[id]=p.hp;
    d2.title=`${PARTY_DEF[id].name}${id===ME()?" (you)":""} · ${p.hp}/${s.hpMax} HP · click to lead`;
    const c=d2.querySelector("canvas");if(!c.v7){const im=portraitImg(id);if(im){c.width=56;c.height=56;const g=c.getContext("2d");g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(im,0,0,56,56);c.v7=1;c.done=1;}}});};}

/* ---------------------------------------------------------------- dialog */
const VOICE={azareth:[300,"triangle"],lucky:[560,"square"],poppi:[680,"triangle"],krodha:[240,"square"],tessie:[760,"sine"]};
function voiceOf(who){if(VOICE[who])return VOICE[who];let h=0;String(who).split("").forEach(ch=>h=(h*31+ch.charCodeAt(0))|0);return [320+Math.abs(h)%420,["square","triangle","sine"][Math.abs(h>>3)%3]];}
setPortrait=function(el,who,opt){
  el.innerHTML="";const img=opt&&opt.img?opt.img:portraitImg(who);
  if(img){const c=document.createElement("canvas");c.width=216;c.height=216;const g=c.getContext("2d");g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";
    g.fillStyle="#0b0916";g.fillRect(0,0,216,216);const s=Math.max(216/img.width,216/img.height);const w=img.width*s,h=img.height*s;g.drawImage(img,(216-w)/2,Math.min(0,216-h)*.15,w,h);
    const gr=g.createLinearGradient(0,150,0,216);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,"rgba(0,0,0,.45)");g.fillStyle=gr;g.fillRect(0,0,216,216);el.appendChild(c);el.style.display="block";return;}
  if(who&&(LOOK[who]||PARTY_DEF[who])){const c=document.createElement("canvas");c.width=24;c.height=24;c.style.imageRendering="pixelated";const g=c.getContext("2d");g.imageSmoothingEnabled=false;
    drawChar(g,0,0,PARTY_DEF[who]?PARTY_DEF[who].look:LOOK[who],"down",0,{});el.appendChild(c);el.style.display="block";return;}
  el.style.display="none";};
dialog=function(who,text,choices,opt){
  opt=opt||{};
  return new Promise(resolve=>{
    DLG_OPEN=true;const box=$("dlg");box.style.display="block";box.classList.toggle("narr",!who&&!opt.name);
    box.style.animation="none";void box.offsetWidth;box.style.animation="";
    setPortrait($("dpor"),who,opt);
    const nm=opt.name||(who?nameOf(who):"");
    $("dwho").innerHTML=esc(nm)+(who&&who===ME()?`<span class="me7">YOU</span>`:"")+(opt.sub?`<small>${esc(opt.sub)}</small>`:(PARTY_DEF[who]?`<small>${esc(PARTY_DEF[who].cls.toUpperCase())}</small>`:""));
    $("dwho").style.display=nm?"block":"none";
    const sayEl=$("dsay"),chEl=$("dch");chEl.innerHTML="";$("dmore").style.display="none";
    let i=0,done=false,sel=0;const full=String(text||"");
    const sp={slow:1.7,normal:1,fast:.45,instant:0}[V7.opt.text]??1;
    const base=(who?24:17)*sp;const [vf,vt]=voiceOf(who||"narr");
    let tmr=null;
    const tick=()=>{if(i<full.length){const step=sp===0?full.length:2;i=Math.min(full.length,i+step);sayEl.textContent=full.slice(0,i);
        const ch=full[i-1];if(who&&i%5<2&&/\w/.test(ch||""))tone(vf*(1+((i*7)%5)/30),.025,vt,.011);
        const pause=/[.!?…]/.test(ch)&&full[i]!=="\""?base*7:/[,;:—]/.test(ch)?base*3:base;tmr=setTimeout(tick,pause);}else finish();};
    const finish=()=>{if(done)return;done=true;clearTimeout(tmr);sayEl.textContent=full;
      if(choices&&choices.length){renderChoices();}else $("dmore").style.display="block";};
    const renderChoices=()=>{chEl.innerHTML="";choices.forEach((ch,k)=>{const b=document.createElement("button");b.className="ch"+(k===sel?" sel":"");
      b.innerHTML=`<span class="k">${k+1}</span>${esc(ch)}`;b.onclick=()=>{sel=k;close(k);};b.onmouseenter=()=>{if(sel!==k){sel=k;[...chEl.children].forEach((x,j)=>x.classList.toggle("sel",j===k));}};chEl.appendChild(b);});};
    const close=v=>{popH(h);box.style.display="none";DLG_OPEN=false;SFX.blip();resolve(v);};
    const h=pushH((k)=>{
      if(!done){if(k==="A"||k==="B"||k==="START")finish();return;}
      if(choices&&choices.length){
        if(k==="up"){sel=(sel+choices.length-1)%choices.length;renderChoices();SFX.sel();}
        else if(k==="down"){sel=(sel+1)%choices.length;renderChoices();SFX.sel();}
        else if(k&&k[0]==="N"){const n=parseInt(k.slice(1))-1;if(n<choices.length)close(n);}
        else if(k==="A"||k==="START")close(sel);
        else if(k==="B"&&opt.cancel!=null)close(opt.cancel);
      }else if(k==="A"||k==="B"||k==="START")close(0);
    });
    if(!full){finish();}else tick();
    box.onclick=e=>{if(e.target.closest&&e.target.closest(".ch"))return;if(!done)finish();else if(!(choices&&choices.length))close(0);};
  });};

/* ---------------------------------------------------- iris transitions */
const IRIS={r:null};
function irisCenter(){const w=$("world").getBoundingClientRect(),vp=$("viewport").getBoundingClientRect();
  if(!STATE||!w.width)return [vp.width/2,vp.height/2];const k=w.width/VW;
  return [w.left-vp.left+((P.rx+12-CAM.x)*CAM.z)*k,w.top-vp.top+((P.ry+10-CAM.y)*CAM.z)*k];}
{const _ft=fadeTo;fadeTo=function(v,ms){
  if(!V7.opt.iris||!inWorld()||STAGE.cine)return _ft(v,ms);
  const f=$("fade"),vp=$("viewport").getBoundingClientRect(),dur=Math.max(260,(ms||350)*1.25);
  return new Promise(res=>{const t0=performance.now();const maxR=Math.hypot(vp.width,vp.height);f.style.transition="none";f.style.opacity=1;
    const step=()=>{const k=Math.min(1,(performance.now()-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;const [cx,cy]=irisCenter();
      const r=v>=1?lerp(maxR,0,e):lerp(0,maxR,e);
      const m=`radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, #000 ${r+1.5}px)`;f.style.webkitMaskImage=m;f.style.maskImage=m;
      if(k<1)requestAnimationFrame(step);else{if(v<1){f.style.opacity=0;f.style.webkitMaskImage=f.style.maskImage="none";}else{f.style.webkitMaskImage=f.style.maskImage="none";}res();}};
    requestAnimationFrame(step);});};}

/* ------------------------------------------------------------- run + keys */
KEY.run=false;
window.addEventListener("keydown",e=>{if(e.key==="Shift")KEY.run=true;
  if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.metaKey||e.ctrlKey||e.altKey)return;
  const k=e.key.toLowerCase();
  if(!inWorld()||MODAL||DLG_OPEN||HANDLERS.length)return;
  if(k==="n"){V7.opt.mini=V7.opt.mini?0:1;v7save();SFX.sel();}
  else if(k==="t"){V7.opt.trkOpen=V7.opt.trkOpen?0:1;v7save();TRK.last="";SFX.sel();}
  else if(k==="p"){postcard();}});
window.addEventListener("keyup",e=>{if(e.key==="Shift")KEY.run=false;});
window.addEventListener("blur",()=>{KEY.run=false;});
{const _um=updateMove;updateMove=function(dt){_um(KEY.run?dt*1.65:dt);};}

/* -------------------------------------------------------------- postcards */
async function postcard(){
  const src=$("world");const W=1200,H=Math.round(W*VH/VW),pad=36,cap=92;
  const c=document.createElement("canvas");c.width=W+pad*2;c.height=H+pad+cap;const g=c.getContext("2d");
  g.fillStyle="#efe3c4";g.fillRect(0,0,c.width,c.height);g.fillStyle="rgba(120,80,30,.12)";for(let i=0;i<1400;i++)g.fillRect(Math.random()*c.width,Math.random()*c.height,1,1);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(src,pad,pad,W,H);g.strokeStyle="#2a1d10";g.lineWidth=3;g.strokeRect(pad,pad,W,H);
  const x=STATE.v6?X():null,M=curMap();
  g.fillStyle="#2a1d10";g.font=F7(46,"","CMTitle");g.fillText(M.name,pad,H+pad+52);
  g.font=F7(20,"italic","CMFell");g.fillText(`${x&&hasF("ch2")?"Day "+x.day+" · ":""}${x?(SESSIONS[x.session]&&SESSIONS[x.session].between?"Between Sessions":"Session "+x.session):""} · ${PARTY_DEF[ME()].name} & company`,pad,H+pad+80);
  g.textAlign="right";g.font=F7(30,"","CMTitle");g.fillText("The Crooked Moon",W+pad,H+pad+52);g.font=F7(16,"","CMFell");g.fillText("a postcard from Wickermoor Hollow",W+pad,H+pad+78);
  const im=IMG.v7logo;if(im){}
  const a=document.createElement("a");a.download=`crooked-moon-${M.id}-${Date.now()%100000}.png`;a.href=c.toDataURL("image/png");document.body.appendChild(a);a.click();a.remove();
  const f=$("photo7");f.style.transition="none";f.style.opacity=.85;void f.offsetWidth;f.style.transition="opacity .6s";f.style.opacity=0;
  noise(.05,.08,3000);tone(1800,.04,"square",.02,0,.05);toast("📸 Postcard saved to your Downloads","gold");
}

/* ------------------------------------------------------------- per-frame */
{let acc=0;const _lp=loop;loop=function(t){_lp(t);acc++;
  if(acc%3===0){v7prompt();}
  if(acc%6===0){v7minimap(t);}
  if(acc%12===0){v7tracker();const h=$("hud7");h.classList.toggle("off",!inWorld());}};}
setInterval(v7place,1500);

/* ---------------------------------------------------------------- title */
const TT={leaves:[],fog:[],bats:[],lights:null,train:-1,t0:0,ghost:0};
function titleLights(im){
  if(TT.lights)return TT.lights;TT.lights=[];
  try{const c=document.createElement("canvas"),w=128,h=192;c.width=w;c.height=h;const g=c.getContext("2d");g.drawImage(im,0,0,w,h);const d2=g.getImageData(0,0,w,h).data;
    for(let y=Math.floor(h*.5);y<h*.75;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,r=d2[i],gg=d2[i+1],b=d2[i+2];if(r>120&&gg>70&&b<90&&r>b*2.1)TT.lights.push({x:(x+.5)/w,y:(y+.5)/h,p:Math.random()*6,s:.6+Math.random()*.8});}}catch(e){}
  return TT.lights;}
function leaf(init,W,H){return {x:Math.random()*W,y:init?Math.random()*H:-20,vx:rnd(-18,26),vy:rnd(22,48),r:rnd(0,6),vr:rnd(-2,2),s:rnd(3,7),c:pick(["#b8662a","#8a3f1c","#c98b3a","#6e2f18","#a3502a"]),ph:rnd(0,6)};}
drawTitle=function(t){
  const cvs=$("titlecv"),dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(cvs.clientWidth*dpr),H=Math.round(cvs.clientHeight*dpr);
  if(!W||!H)return;if(cvs.width!==W||cvs.height!==H){cvs.width=W;cvs.height=H;}
  const c=cvs.getContext("2d");c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";
  if(!TT.t0)TT.t0=t;const T2=(t-TT.t0)/1000;
  c.fillStyle="#040308";c.fillRect(0,0,W,H);
  const im=IMG.v7title;
  if(im){const z=1.15,S=Math.max(W/im.width,H/im.height)*z,dw=im.width*S,dh=im.height*S;
    const ox=-(dw-W)*.08;
    // pan: graves → moon over ~16 s, then a slow breathing drift
    const k=Math.min(1,T2/16),e=1-Math.pow(1-k,3);const fy=lerp(.62,.12,e)+(k>=1?.035*Math.sin((T2-16)/9):0);
    const oy=clamp(-(fy*dh-H*.32),H-dh,0);
    c.drawImage(im,ox,oy,dw,dh);
    // moon glow
    const mx2=ox+.555*dw,my2=oy+.165*dh,R=dw*.12*(1+.04*Math.sin(T2*1.3));c.globalCompositeOperation="lighter";
    let g=c.createRadialGradient(mx2,my2,R*.1,mx2,my2,R);g.addColorStop(0,"rgba(255,220,140,.28)");g.addColorStop(1,"rgba(255,200,120,0)");c.fillStyle=g;c.fillRect(mx2-R,my2-R,R*2,R*2);
    // village windows flicker
    titleLights(im).forEach(L=>{const x=ox+L.x*dw,y=oy+L.y*dh;if(y<-20||y>H+20)return;const a=.18+.14*Math.sin(T2*3*L.s+L.p)+(Math.random()<.004?.3:0);const r=6*dpr*L.s;
      g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,180,80,${a})`);g.addColorStop(1,"rgba(255,140,40,0)");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);});
    // the ghost train crossing the far hills now and then
    if(TT.train<0&&Math.random()<.003&&T2>6)TT.train=0;
    if(TT.train>=0){TT.train+=1/60;const p=TT.train/14,hy=oy+.6*dh;const x0=lerp(-W*.2,W*1.2,p);
      for(let i=0;i<7;i++){const x=x0-i*16*dpr,y=hy+Math.sin((x/W)*6)*3*dpr;g=c.createRadialGradient(x,y,0,x,y,9*dpr);g.addColorStop(0,"rgba(140,255,215,.55)");g.addColorStop(1,"rgba(60,200,160,0)");c.fillStyle=g;c.fillRect(x-9*dpr,y-9*dpr,18*dpr,18*dpr);}
      if(p>1)TT.train=-1;}
    c.globalCompositeOperation="source-over";}
  // fog banks
  if(!TT.fog.length)for(let i=0;i<14;i++)TT.fog.push({x:Math.random(),y:.7+Math.random()*.32,r:rnd(.18,.4),v:rnd(.004,.012),a:rnd(.05,.12)});
  TT.fog.forEach(f=>{f.x+=f.v/60;if(f.x>1.4)f.x=-.4;const x=f.x*W,y=f.y*H,r=f.r*W;c.save();c.translate(x,y);c.scale(1,.28);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(170,180,200,${f.a})`);g.addColorStop(1,"rgba(170,180,200,0)");c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore();});
  // falling leaves
  if(!TT.leaves.length)for(let i=0;i<46;i++)TT.leaves.push(leaf(true,W,H));
  TT.leaves.forEach((L,i)=>{L.ph+=.03;L.x+=(L.vx+Math.sin(L.ph)*20)/60*dpr;L.y+=L.vy/60*dpr;L.r+=L.vr/60;if(L.y>H+20||L.x>W+30||L.x<-30)TT.leaves[i]=leaf(false,W,H);
    c.save();c.translate(L.x,L.y);c.rotate(L.r);c.scale(1,.55+.45*Math.abs(Math.sin(L.ph*1.3)));c.fillStyle=L.c;const s=L.s*dpr;c.beginPath();
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2-Math.PI/2;c.lineTo(Math.cos(a)*s,Math.sin(a)*s);c.lineTo(Math.cos(a+.63)*s*.45,Math.sin(a+.63)*s*.45);}c.fill();c.restore();});
  // bats across the moon
  if(Math.random()<.002&&TT.bats.length<1)for(let i=0;i<5;i++)TT.bats.push({x:-30-i*24,y:H*rnd(.12,.3),v:rnd(90,140),ph:rnd(0,6)});
  TT.bats.forEach(b=>{b.x+=b.v/60*dpr;b.ph+=.4;const w=Math.sin(b.ph)*5*dpr;c.fillStyle="#08060a";c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-8*dpr,b.y-w);c.lineTo(b.x-3*dpr,b.y);c.lineTo(b.x+3*dpr,b.y);c.lineTo(b.x+8*dpr,b.y-w);c.fill();});
  TT.bats=TT.bats.filter(b=>b.x<W+60);
  // vignette
  const g=c.createRadialGradient(W/2,H*.45,H*.3,W/2,H*.5,H*.95);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.72)");c.fillStyle=g;c.fillRect(0,0,W,H);
};
{const _st=showTitle;showTitle=function(){_st();TT.t0=0;const p=$("tpanel");
  const lg=p.querySelector(".logo");if(lg&&IMG.v7logo){const im=document.createElement("img");im.className="logo7";im.src=IMG.v7logo.src;im.alt="The Crooked Moon";lg.replaceWith(im);}
  const sl=p.querySelector(".sublogo");if(sl)sl.textContent="The Ghostlight Express";
  p.querySelectorAll("p.sub").forEach(x=>x.remove());
  const tb=p.querySelector(".tbtns");if(tb){const n=document.createElement("div");n.className="tnote";n.innerHTML=`A pocket RPG of Moon's Crooked Moon table · Sessions 1–8 &amp; Between Sessions<br><span style="color:#6e6590">Arrows/WASD move · Z/Space = A · X/Esc = B · Enter = Menu</span>`;
    const ps=p.querySelector(".press-start");(ps||tb).after(n);}
  const hs=p.querySelector(".title-hs");if(hs){hs.style.marginTop="14px";}
  if(!$("tver")){const v=document.createElement("div");v.className="tver";v.id="tver";v.textContent="v7 · THE GLOW-UP";$("title").appendChild(v);}};}

/* ------------------------------------------------- "Who do you play?" */
const PC_COLOR={azareth:"#e0782a",lucky:"#d9a441",poppi:"#c8384a",krodha:"#6fbf73",tessie:"#4fb6c9"};
const PC_HOOK={azareth:"Heals the party. Burns the dead. Says exactly what she's thinking.",lucky:"Picks locks, bets on everything, shoots first.",poppi:"Blood magic, forbidden books, a family curse.",krodha:"Drunken-master fists, ki, and a philosophy of breathing.",tessie:"Longbow, hunter's mark — and Caster, the ghost greyhound."};
function cardSrc(id){const k=id==="tessie"?"Tessie":PARTY_DEF[id].name.split(" ")[0];return ((window.ASSETS.pc||{})[k]||{}).card||"";}
charSelect=function(){
  if(showTitle.h){popH(showTitle.h);showTitle.h=null;}
  const has=!!sget("save");let sel=PARTY_ORDER.indexOf(sget("v7me")||"krodha");if(sel<0)sel=3;
  const render=()=>{const id=PARTY_ORDER[sel],D=PARTY_DEF[id];
    $("tpanel").innerHTML=`<div class="cs7h">Which one are you?</div><div class="cs7s">Pick your character from Moon's table. You'll lead the party as them — swap anytime with Q.</div>
    <div id="cs7">${PARTY_ORDER.map((p,i)=>`<div class="cs7${i===sel?" sel":""}" data-i="${i}" style="--c:${PC_COLOR[p]}"><div class="im" style="background-image:url('${cardSrc(p)}')"></div><div class="nm">${esc(PARTY_DEF[p].short||PARTY_DEF[p].name)}</div><div class="cl">${esc((PARTY_DEF[p].species+" "+PARTY_DEF[p].cls).toUpperCase())}</div></div>`).join("")}</div>
    <div id="csinfo7" style="--c:${PC_COLOR[id]}"><div class="h"><b>${esc(D.name)}</b><span>${esc((D.cls+" · "+D.sub+" · thread: "+D.thread).toUpperCase())}</span></div>
      <p>${esc(D.blurb)}</p><div class="st7"><span>HP <b>${D.hp[0]}</b></span><span>AC <b>${D.ac}</b></span><span>${esc(PC_HOOK[id])}</span></div></div>
    <div class="tbtns"><button class="btn" id="csGo">▶ Board as ${esc(D.short||D.name)}</button>${has?`<div class="sub" style="color:#c9a44a">Starting fresh replaces your saved game.</div>`:""}<button class="btn alt" id="csBack">◀ Back</button></div>`;
    $("tpanel").querySelectorAll(".cs7").forEach(e=>e.onclick=()=>{if(sel===+e.dataset.i){start();return;}sel=+e.dataset.i;render();SFX.sel();});
    $("csGo").onclick=start;$("csBack").onclick=()=>{popH(h);showTitle();};};
  const start=async()=>{popH(h);const id=PARTY_ORDER[sel];sset("v7me",id);STATE=freshState(id);STATE.me=id;PARTY_ORDER.forEach(refillPC);sdel("save");SFX.ok();
    const f=$("fade");f.style.transition="opacity .5s";f.style.opacity=1;await sleep(520);hideTitle();await startWorld(false);f.style.opacity=0;};
  const h=pushH(k=>{if(k==="left"){sel=(sel+4)%5;render();SFX.sel();}else if(k==="right"){sel=(sel+1)%5;render();SFX.sel();}else if(k==="A"||k==="START")start();else if(k==="B"){popH(h);showTitle();}});
  render();};
{const _lg=loadGame;loadGame=function(){const s=_lg();if(s&&!s.me)s.me=s.lead;return s;};}

/* ----------------------------------------------- new-game intro + controls */
const ME_LINE={azareth:"\"The mist is looking at us. I am going to look back.\"",lucky:"\"Five strangers, five tickets, nobody remembers buying one. I like these odds.\"",
  poppi:"\"A train in the fog that nobody bought a ticket for. I would like to read every book on it.\"",krodha:"\"…Huh. Okay. Let's just breathe.\"",tessie:"\"(…Caster's ears are up. Something's coming.)\""};
startWorld=async function(cont){
  P.rx=STATE.x*T;P.ry=STATE.y*T;resetTrail();initMap();updateHUD();
  playSong(curMap().music);requestAnimationFrame(v7place);
  if(!cont){
    banner("PROLOGUE","A Platform in the Mist");
    await sleep(900);
    runScript(async()=>{
      await say(null,"Mist. A train platform in the middle of nowhere. You don't remember arriving.\nFive strangers, each holding a ticket they don't remember buying.");
      await say(ME(),ME_LINE[ME()]||ME_LINE.krodha);
      await controlsCard();
    });
  }else banner(curMap().sub||"",curMap().name);
};
function controlsHTML(){return `<div class="keys7">
  <kbd>←↑→↓ / WASD</kbd><span>Walk · hold <b>Shift</b> to run</span>
  <kbd>Z · E · Space</kbd><span><b>A</b> — talk, examine, confirm</span>
  <kbd>X · Esc</kbd><span><b>B</b> — back</span>
  <kbd>Enter</kbd><span>Menu (party, items, session tasks, journal…)</span>
  <kbd>J · M</kbd><span>Journal · Map of the Hollow</span>
  <kbd>Q · Tab</kbd><span>Swap who leads the party</span>
  <kbd>T</kbd><span>Expand the quest tracker (top-left)</span>
  <kbd>N</kbd><span>Minimap on/off</span>
  <kbd>P</kbd><span>Save a postcard of the screen</span>
  <kbd>1–9</kbd><span>Pick a dialog choice</span>
  <kbd>\`</kbd><span>DM Screen (Moon's tools)</span></div>`;}
function controlsCard(){return modalAwait("How to play","the table rules",`<div class="scard"><div class="sc-k">WELCOME ABOARD, ${esc((PARTY_DEF[ME()].short||PARTY_DEF[ME()].name).toUpperCase())}</div>
  <p style="margin:6px 0">This game follows Moon's table session by session. The <b style="color:var(--moon)">tracker</b> in the top-left always shows what's next; the gold <b style="color:var(--gold)">◆</b> on the minimap marks where to go. ✦ sparkles are things worth examining; <b>…</b> bubbles are people you haven't met.</p>
  ${controlsHTML()}</div><div class="row" style="justify-content:center;margin-top:12px"><button class="btn nav" onclick="closeModal()">Let's go</button></div>`,navList());}

/* ------------------------------------------------------------- settings */
MENU_HTML.system=()=>{const o=V7.opt,t=Math.floor(STATE.stats.time/60);
  const seg=(k,vals,lab)=>`<div class="seg">${vals.map(([v,l])=>`<button data-o="${k}" data-v="${v}" class="${String(o[k])===String(v)?"on":""}">${l}</button>`).join("")}</div>`;
  return `<div class="row"><button class="btn nav" data-sys="save">💾 Save game</button><button class="btn alt nav" data-sys="title">⏏ Title screen</button><button class="btn alt nav" data-sys="keys">⌨ Controls</button></div>
  <h4 style="color:var(--moon);margin:14px 0 4px">Options</h4><div class="set7">
   <label>Text speed</label>${seg("text",[["slow","SLOW"],["normal","NORMAL"],["fast","FAST"],["instant","INSTANT"]])}
   <label>Music volume</label><input type="range" min="0" max="1" step=".05" value="${o.music}" data-r="music">
   <label>Sound effects</label><input type="range" min="0" max="1" step=".05" value="${o.sfx}" data-r="sfx">
   <label>Screen shake</label>${seg("shake",[[0,"OFF"],[.5,"LOW"],[1,"FULL"]])}
   <label>Scene transitions</label>${seg("iris",[[1,"IRIS"],[0,"FADE"]])}
   <label>Retro CRT filter</label>${seg("crt",[[0,"OFF"],[1,"ON"]])}
   <label>Minimap (N)</label>${seg("mini",[[1,"ON"],[0,"OFF"]])}
   <label>Quest tracker (T)</label>${seg("trk",[[1,"ON"],[0,"OFF"]])}
   <label>Battle pacing</label><div class="seg"><button data-st="fast" data-v="0" class="${STATE.fast?"":"on"}">NORMAL</button><button data-st="fast" data-v="1" class="${STATE.fast?"on":""}">FAST</button></div>
   <label>Party follows the leader</label><div class="seg"><button data-st="noFollow" data-v="0" class="${STATE.noFollow?"":"on"}">ON</button><button data-st="noFollow" data-v="1" class="${STATE.noFollow?"on":""}">OFF</button></div>
  </div>
  <p class="sub" style="margin-top:12px">Playing as <b style="color:var(--ghost)">${esc(PARTY_DEF[ME()].name)}</b> · Play time ${Math.floor(t/60)}h ${t%60}m · Steps ${STATE.stats.steps} · Battles ${STATE.stats.wins}/${STATE.stats.battles} · Crits ${STATE.stats.crits} · Nat 20s ${STATE.stats.nat20} · Nat 1s ${STATE.stats.nat1}</p>`;};
MENU_WIRE.push((tab,render)=>{if(tab!=="system")return;const b=$("mbody");
  b.querySelectorAll("[data-o]").forEach(x=>x.onclick=()=>{const k=x.dataset.o,v=x.dataset.v;V7.opt[k]=isNaN(+v)?v:+v;v7save();v7applyOpts();SFX.sel();openMenu("system");});
  b.querySelectorAll("[data-st]").forEach(x=>x.onclick=()=>{STATE[x.dataset.st]=x.dataset.v==="1";SFX.sel();openMenu("system");});
  b.querySelectorAll("[data-r]").forEach(x=>x.oninput=()=>{V7.opt[x.dataset.r]=+x.value;v7save();v7applyOpts();if(x.dataset.r==="sfx")SFX.blip();});
  const k=b.querySelector("[data-sys=keys]");if(k)k.onclick=()=>{closeModal();runScript(controlsCard);};});

/* ------------------------------------------- canvas overlays (v7 redraw) */
/* the objective card moved to the HTML tracker; the off-screen arrow, party
 * banter and flashes are redrawn with the new type. */
drawOverlays=function(t){
  const c=ctx;
  const g=c.createRadialGradient(VW/2,VH/2,VH*.38,VW/2,VH/2,VH*.82);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.42)");c.fillStyle=g;c.fillRect(0,0,VW,VH);
  if(CAM.tgt&&!DLG_OPEN){const x=(CAM.tgt.x*T+12-CAM.x)*CAM.z,y=(CAM.tgt.y*T+12-CAM.y)*CAM.z;if(x<0||y<0||x>VW||y>VH){const cx=VW/2,cy=VH/2,a=Math.atan2(y-cy,x-cx);
    const ex=clamp(cx+Math.cos(a)*400,18,VW-18),ey=clamp(cy+Math.sin(a)*400,18,VH-18),p=1+.12*Math.sin(t/160);
    c.save();c.translate(ex,ey);c.rotate(a);c.scale(p,p);c.fillStyle="rgba(0,0,0,.55)";c.beginPath();c.arc(0,0,9,0,7);c.fill();
    c.fillStyle=CAM.tgt.exit?"#9fe0b0":"#ffce3a";c.beginPath();c.moveTo(7,0);c.lineTo(-4,-5);c.lineTo(-2,0);c.lineTo(-4,5);c.fill();c.restore();}}
  if(AMB.bark&&!DLG_OPEN){const b=AMB.bark;c.font=F7(8,500);const tx=b.text.replace(/f([il])/g,"f‌$1");const w=Math.min(330,c.measureText(tx).width+36);const x=VW/2-w/2,y=VH-46;const a=Math.min(1,b.t*2);
    c.globalAlpha=a;c.fillStyle="rgba(12,9,24,.9)";c.beginPath();c.roundRect?c.roundRect(x,y,w,24,6):c.rect(x,y,w,24);c.fill();c.strokeStyle=PARTY_DEF[b.who].color;c.lineWidth=1;c.stroke();
    const im=portraitImg(b.who);if(im){smooth(c,true);c.save();c.beginPath();c.arc(x+13,y+12,9,0,7);c.clip();c.drawImage(im,x+4,y+3,18,18);c.restore();smooth(c,false);}
    c.fillStyle="#efe3c4";c.fillText(tx,x+28,y+15.5);c.globalAlpha=1;}
  if(FX.flash>0){c.globalAlpha=FX.flash;c.fillStyle=FX.flashCol;c.fillRect(0,0,VW,VH);c.globalAlpha=1;FX.flash=Math.max(0,FX.flash-.06);}
};
{const _st=showTitle;showTitle=function(){document.body.classList.add("titleon");_st();};
 const _ht=hideTitle;hideTitle=function(){document.body.classList.remove("titleon");_ht();requestAnimationFrame(v7place);};}
$("brand").innerHTML="Crooked <i>Moon</i>";

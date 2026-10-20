/* =============================== v8 · menus ============================= *
 *   · Session board: chapter art header, progress ring, an UP NEXT card with
 *     who asked and which way to go, tasks grouped To do / Optional / Done
 *   · Options: action commands, time-of-day lighting, task stamps, sprites
 *   · Liar's Dice at a real table (cups, ivory dice, the Wainwrights seated)
 *   · every minigame gets a vignette + film grain
 *   · title: a Continue card (who, where, which session, how long)
 *   · the ADVENTURER'S CARD: a shareable PNG of your run (★ You tab, the
 *     arcade screen, the end of the credits) — for sending back to Moon
 *   · THE STORY SO FAR: a scrapbook of your session notes, page by page */

/* ------------------------------------------------------- name → portrait */
const FROMPOR8={};
function porFor8(name){
  if(!name)return null;if(!FROMPOR8._built){FROMPOR8._built=1;
    Object.values(MAPS).forEach(M=>(M.npcs||[]).forEach(n=>{const k=PORT[n.id]||(typeof n.look==="string"&&PORT[n.look]);if(n.name&&k)FROMPOR8[n.name.toLowerCase()]=k;}));
    Object.values(PERSONA).forEach(p=>{const k=p.por&&PORT[p.por];if(k)FROMPOR8[p.name.toLowerCase()]=k;});
    Object.keys(PORT).forEach(id=>{const k=PORT[id];FROMPOR8[k.replace(/_/g," ").toLowerCase()]=k;});
    PARTY_ORDER.forEach(id=>{FROMPOR8[PARTY_DEF[id].name.toLowerCase()]="pc:"+id;FROMPOR8[(PARTY_DEF[id].short||"").toLowerCase()]="pc:"+id;});}
  const n=name.toLowerCase().replace(/^the /,"").replace(/'s.*$/,"");
  let k=FROMPOR8[name.toLowerCase()]||FROMPOR8[n]||FROMPOR8["the "+n];
  if(!k){const hit=Object.keys(FROMPOR8).find(s=>s.length>3&&(s.startsWith(n.split(" ")[0]+" ")||s===n.split(" ")[0]));if(hit)k=FROMPOR8[hit];}
  if(!k)return null;if(k.startsWith("pc:"))return portraitImg(k.slice(3));return IMG["por:"+k]||null;}
const SESS_ART8={1:"car_passenger",2:"wreckage",3:"wytchwood",4:"marsh",5:"village",6:"house1",7:"house2",8:"attic",9:"village",10:"village"};

/* ---------------------------------------------------------- Session board */
{const _sh=MENU_HTML.session;MENU_HTML.session=()=>{
  const x=X(),n=x.session,S=SESSIONS[n];if(!S)return _sh();
  const T=sessTasks(n),[a,b]=sessCount(n),pct=b?a/b:0;
  const art=IMG["map:"+(SESS_ART8[n]||"village")];
  const rows=T.map(t=>({t,d:taskDone(t)}));const todo=rows.filter(r=>!r.d&&!r.t.opt),opt=rows.filter(r=>!r.d&&r.t.opt),done=rows.filter(r=>r.d);
  const lab=t=>esc(typeof t.label==="function"?t.label():t.label);
  const R=26,C=2*Math.PI*R;
  let h=`<div class="sb8"${art?` style="--art:url('${art.src}')"`:""}><div class="sb8-in">
    <div class="ring8"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" class="bg"/><circle cx="32" cy="32" r="${R}" class="fg" style="stroke-dasharray:${C};stroke-dashoffset:${C*(1-pct)}"/></svg><b>${S.between?"∞":a+"/"+b}</b></div>
    <div><div class="sc-k">${S.between?"BETWEEN SESSIONS":"SESSION "+n+" · "+esc(S.date)}</div><div class="sb8-t">${esc(S.title)}</div>
    <div class="sub">${S.between?"Open-ended days. ▸ marks where the table hasn't played yet.":(a>=b?"Every required task is done. Wrap the session when you're ready.":`${b-a} required task${b-a===1?"":"s"} to go`)}${hasF("ch2")?` · Day ${x.day}, ${PHASES[x.phase].icon} ${PHASES[x.phase].name}`:""}</div></div></div></div>`;
  {const o=objective(),W=where8();
    if(o){const e=o.tgt&&o.tgt.id?findEnt(o.tgt.map,o.tgt.id):null;const pk=e&&(PORT[e.id]||(typeof e.look==="string"&&PORT[e.look]));
      h+=`<div class="nx8"><canvas class="por8" data-from="${esc(pk?pk.replace(/_/g," "):(todo[0]?todo[0].t.from||"":""))}" width="128" height="128"></canvas><div><div class="sc-k">UP NEXT</div><div class="nx8-t">${esc(o.text)}</div>
        <div class="sub">${esc(o.sub||"")}${W?` · <b style="color:var(--gold)">${W.dir}</b> ${W.txt}`:""}</div></div></div>`;}}
  const card=(r,cls)=>`<div class="tk8 ${cls}"><canvas class="por8" data-from="${esc(r.t.from||"")}" width="128" height="128"></canvas><div><div class="tk8-t">${r.d?"✓ ":""}${lab(r.t)}</div><div class="tk8-f">from ${esc(r.t.from||"—")}${r.t.front&&!r.d?" · ▸ at the table":""}</div></div></div>`;
  if(todo.length)h+=`<h4 class="h8">To do <span>${todo.length}</span></h4><div class="tk8g">${todo.map(r=>card(r,"todo")).join("")}</div>`;
  if(opt.length)h+=`<h4 class="h8">Optional <span>${opt.length}</span></h4><div class="tk8g">${opt.map(r=>card(r,"opt")).join("")}</div>`;
  if(done.length)h+=`<details class="dn8"><summary><h4 class="h8">Done <span>${done.length}</span></h4></summary><div class="tk8g">${done.map(r=>card(r,"done")).join("")}</div></details>`;
  if(!S.open&&!SESS_BREAK_INLINE[n]&&!x.wrapped[n]&&SESSIONS[n+1])h+=`<div class="row" style="margin-top:10px"><button class="btn nav" data-wrap="1" ${sessReady(n)?"":"disabled"}>✍ Wrap Session ${n}${sessReady(n)?"":" (finish the required tasks first)"}</button></div>`;
  const N=notesFor(n);h+=`<h4 class="h8">Session notes <span>${N.length}</span></h4>`+(N.length?N.slice().reverse().map(q=>`<div class="qitem"><span>${q.icon} ${esc(q.text)}</span><span class="st">Day ${q.day}</span></div>`).join(""):`<div class="sub">Nothing logged yet. The notes write themselves as things happen.</div>`);
  const past=Object.keys(x.recaps).map(Number);if(past.length)h+=`<h4 class="h8">Recaps written <span>${past.length}</span></h4>`+past.map(k=>{const r=x.recaps[k];return `<div class="qitem">Session Recap #${k} — ${r.got}/${r.real} highlights${r.fakes?` · ${r.fakes} rumor(s)`:""}${r.perfect?" · ✦ perfect":""}</div>`;}).join("");
  h+=`<div class="row" style="margin-top:12px"><button class="btn alt nav" data-story8="1">📖 The Story So Far</button></div>`;
  return h;};}
{const _pm=paintMenuCanvases;paintMenuCanvases=function(){_pm();
  $("mbody").querySelectorAll("canvas.por8").forEach(c=>{const g=c.getContext("2d");const im=porFor8(c.dataset.from);
    g.fillStyle="#120e22";g.fillRect(0,0,128,128);
    if(im)v8drawPortrait(g,im,0,0,128,128,{cover:true,top:true});
    else{g.fillStyle="#2a2244";g.font="64px serif";g.textAlign="center";g.fillText("✦",64,84);}});};}
MENU_WIRE.push(tab=>{const b=$("mbody").querySelector("[data-story8]");if(b)b.onclick=()=>{closeModal();runScript(storySoFar8);};});

/* ---------------------------------------------------------------- options */
{const _sy=MENU_HTML.system;MENU_HTML.system=()=>{const seg=(k,vals)=>`<div class="seg">${vals.map(([v,l])=>`<button data-o8="${k}" data-v="${v}" class="${String(+v8opt(k))===String(v)?"on":""}">${l}</button>`).join("")}</div>`;
  return _sy()+`<h4 style="color:var(--moon);margin:14px 0 4px">v8 · Full Moon</h4><div class="set7">
    <label>Action commands in battle</label>${seg("acts",[[1,"ON"],[0,"OFF"]])}
    <label>Time-of-day lighting</label>${seg("tod",[[1,"ON"],[0,"OFF"]])}
    <label>Task-done stamps</label>${seg("stamps",[[1,"ON"],[0,"OFF"]])}
    <label>Character art in dialog</label>${seg("figs",[[1,"ON"],[0,"OFF"]])}
    <label>Character sprites</label><div class="seg"><button data-spr8="1" class="${SPR8.on?"on":""}">V8 DETAILED</button><button data-spr8="0" class="${SPR8.on?"":"on"}">CLASSIC</button></div>
  </div><div class="row" style="margin-top:10px"><button class="btn alt nav" data-card8="1">🃏 Make my Adventurer's Card</button><button class="btn alt nav" data-story8="1">📖 The Story So Far</button></div>`;};}
MENU_WIRE.push(tab=>{if(tab!=="system")return;const b=$("mbody");
  b.querySelectorAll("[data-o8]").forEach(x=>x.onclick=()=>{v8set(x.dataset.o8,+x.dataset.v);SFX.sel();openMenu("system");});
  b.querySelectorAll("[data-spr8]").forEach(x=>x.onclick=()=>{SPR8.on=x.dataset.spr8==="1";v8set("spr",SPR8.on?1:0);SFX.sel();openMenu("system");});
  b.querySelectorAll("[data-card8]").forEach(x=>x.onclick=()=>{closeModal();runScript(()=>adventurerCard8());});});
setTimeout(()=>{try{if(V7.opt&&V7.opt.v8_spr===0)SPR8.on=false;}catch(e){}},0);

/* ---------------------------------------------- ★ You: card + story buttons */
{const _yh=MENU_HTML.you;if(_yh)MENU_HTML.you=()=>`<div class="row" style="justify-content:flex-end;gap:6px;margin-bottom:6px"><button class="btn alt nav" data-card8="1">🃏 Adventurer's Card</button><button class="btn alt nav" data-story8="1">📖 The Story So Far</button></div>`+_yh();}
MENU_WIRE.push(tab=>{if(tab!=="you")return;$("mbody").querySelectorAll("[data-card8]").forEach(x=>x.onclick=()=>{closeModal();runScript(()=>adventurerCard8());});});

/* --------------------------------------------------- minigames: vignette */
{const _ml=mgLoop;mgLoop=function(fn){return _ml((dt,t,end)=>{fn(dt,t,end);const r=+mg.dataset.rs||1;mx.save();mx.setTransform(r,0,0,r,0,0);
  const g=mx.createRadialGradient(240,168,120,240,168,330);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.55)");mx.fillStyle=g;mx.fillRect(0,0,480,336);
  mx.globalAlpha=.05;for(let i=0;i<70;i++){mx.fillStyle=i%2?"#fff":"#000";mx.fillRect(Math.random()*480,Math.random()*336,1,1);}mx.restore();});};}

/* ------------------------------------------------- Liar's Dice, at a table */
MG.liarsdice=async()=>{
  mgOpen();playSong("village");
  addGold(-5);
  const P=[{n:"Lucky",dice:3,you:true,look:PARTY_DEF.lucky.look},{n:"Ronald",dice:3,look:"villagerC"},{n:"Wilma",dice:3,look:"villagerD"}];
  const SEAT=[[240,262],[96,104],[384,104]];
  let turn=0,bid=null,msg="Each player shakes three dice under a cup. Bid on how many of a face are on the WHOLE table (1s are wild).";
  let hands=[];const rollAll=()=>{hands=P.map(p=>Array.from({length:p.dice},()=>d(6)).sort());shakeT=performance.now();};let shakeT=0;rollAll();
  const count=f=>hands.flat().filter(v=>v===f||v===1).length;
  let reveal=false,winner=null,myQ=1,myF=2;
  const total=()=>P.reduce((s,p)=>s+p.dice,0);
  const die=(x,y,v,s,rot)=>{mx.save();mx.translate(x,y);mx.rotate(rot||0);const r=s*.18;
    mx.fillStyle="rgba(0,0,0,.35)";mx.beginPath();mx.roundRect?mx.roundRect(-s/2+2,-s/2+3,s,s,r):mx.rect(-s/2+2,-s/2+3,s,s);mx.fill();
    const g=mx.createLinearGradient(-s/2,-s/2,s/2,s/2);g.addColorStop(0,"#fffaf0");g.addColorStop(1,"#d8ccb0");mx.fillStyle=g;mx.beginPath();mx.roundRect?mx.roundRect(-s/2,-s/2,s,s,r):mx.rect(-s/2,-s/2,s,s);mx.fill();
    mx.strokeStyle="rgba(80,60,30,.6)";mx.lineWidth=.8;mx.stroke();
    const p=s*.24,L={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[v]||[];
    mx.fillStyle=v===1?"#a8121c":"#1d140e";L.forEach(([a,b])=>{mx.beginPath();mx.arc(a*p,b*p,s*.085,0,7);mx.fill();});mx.restore();};
  const cup=(x,y,s,wob)=>{mx.save();mx.translate(x,y);mx.rotate(wob||0);mx.fillStyle="rgba(0,0,0,.35)";mx.beginPath();mx.ellipse(2,s*.55,s*.62,s*.16,0,0,7);mx.fill();
    const g=mx.createLinearGradient(-s/2,0,s/2,0);g.addColorStop(0,"#3a2010");g.addColorStop(.45,"#7a4a26");g.addColorStop(1,"#2a160a");mx.fillStyle=g;
    mx.beginPath();mx.moveTo(-s*.42,-s*.5);mx.lineTo(s*.42,-s*.5);mx.lineTo(s*.55,s*.5);mx.lineTo(-s*.55,s*.5);mx.closePath();mx.fill();
    mx.fillStyle="#2a160a";mx.beginPath();mx.ellipse(0,-s*.5,s*.42,s*.1,0,0,7);mx.fill();mx.strokeStyle="#c9a44a";mx.lineWidth=1.2;mx.beginPath();mx.moveTo(-s*.5,s*.3);mx.lineTo(s*.5,s*.3);mx.stroke();mx.restore();};
  const render=t=>{
    // tavern: wood planks, lamp light
    let g=mx.createLinearGradient(0,0,0,336);g.addColorStop(0,"#2a1a10");g.addColorStop(1,"#120a06");mx.fillStyle=g;mx.fillRect(0,0,480,336);
    mx.strokeStyle="rgba(0,0,0,.35)";mx.lineWidth=1;for(let y=0;y<336;y+=22){mx.beginPath();mx.moveTo(0,y);mx.lineTo(480,y);mx.stroke();}
    g=mx.createRadialGradient(240,40,10,240,120,320);g.addColorStop(0,"rgba(255,200,120,.32)");g.addColorStop(1,"rgba(255,200,120,0)");mx.fillStyle=g;mx.fillRect(0,0,480,336);
    // seated players (behind the table)
    P.forEach((p,i)=>{if(i===0)return;const [sx,sy]=SEAT[i];drawChar8Big(mx,sx,sy+6,p.look,"down",{scale:1.6,seed:i});});
    // table
    mx.fillStyle="rgba(0,0,0,.45)";mx.beginPath();mx.ellipse(242,182,214,104,0,0,7);mx.fill();
    g=mx.createLinearGradient(0,70,0,290);g.addColorStop(0,"#6a3e1e");g.addColorStop(1,"#3a200e");mx.fillStyle=g;mx.beginPath();mx.ellipse(240,176,212,100,0,0,7);mx.fill();
    g=mx.createRadialGradient(240,160,20,240,176,200);g.addColorStop(0,"#3c7a40");g.addColorStop(1,"#1e4224");mx.fillStyle=g;mx.beginPath();mx.ellipse(240,174,190,84,0,0,7);mx.fill();
    mx.strokeStyle="rgba(201,164,74,.55)";mx.lineWidth=1;mx.beginPath();mx.ellipse(240,174,184,79,0,0,7);mx.stroke();
    // the pot
    for(let k=0;k<7;k++){mx.fillStyle=k%2?"#e3b64f":"#c9a44a";mx.beginPath();mx.ellipse(240+(k%3-1)*6,154-k*2,7,3,0,0,7);mx.fill();mx.strokeStyle="#6a4a14";mx.lineWidth=.5;mx.stroke();}
    // hands
    const shk=t-shakeT<500?Math.sin(t/30)*.12:0;
    P.forEach((p,i)=>{const [sx,sy]=SEAT[i],tx=i===0?240:sx<240?150:330,ty=i===0?214:150;
      if(!p.dice){bText(mx,"OUT",tx,ty+4,"#a79cc0",8,700,"center","CMLabel");return;}
      if(p.you||reveal)hands[i].forEach((v,k)=>die(tx+(k-(hands[i].length-1)/2)*24,ty,v,18,(k-1)*.08+shk));
      else{cup(tx,ty-2,30,shk);bText(mx,"×"+p.dice,tx+24,ty+10,"#efe3c4",7,700,"left","CMLabel");}
      // name plate
      const ny=i===0?318:sy-58;mx.fillStyle=i===turn&&!reveal&&winner===null?"rgba(255,217,106,.92)":"rgba(10,8,20,.82)";const w=72;mx.beginPath();mx.roundRect?mx.roundRect(sx-w/2,ny-9,w,14,7):mx.rect(sx-w/2,ny-9,w,14);mx.fill();
      bText(mx,p.n+(p.you?" (you)":""),sx,ny+1.5,i===turn&&!reveal&&winner===null?"#2a1a04":"#efe3c4",7,700,"center");
      for(let k=0;k<3;k++){mx.fillStyle=k<p.dice?"#efe3c4":"rgba(255,255,255,.15)";mx.fillRect(sx+w/2+4+k*5,ny-4,3.5,3.5);}});
    // bid plaque
    mx.fillStyle="rgba(10,8,20,.78)";mx.beginPath();mx.roundRect?mx.roundRect(170,72,140,22,11):mx.rect(170,72,140,22);mx.fill();
    if(bid){bText(mx,`${bid.q} ×`,226,88,"#ffd96a",12,700,"right");die(242,83,bid.f,14,0);bText(mx,`${P[bid.by].n}`,256,87,"#cfc4ea",6.5,400,"left","CMLabel");}
    else bText(mx,"No bid yet",240,87,"#a79cc0",8,400,"center","CMLabel");
    mgText("LIAR'S DICE · pot 15gp",240,22,"#e3b64f",10);
    // message strip
    mx.fillStyle="rgba(6,4,12,.7)";mx.fillRect(0,290,480,18);bText(mx,msg,240,302,"#efe3c4",6.6,400,"center");
    if(turn===0&&!reveal&&winner===null){mx.fillStyle="rgba(255,217,106,.12)";mx.fillRect(0,236,480,52);
      bText(mx,`YOUR BID:  ${myQ} ×`,196,253,"#ffd96a",10,700,"right");die(212,248,myF,14,0);
      bText(mx,"←→ face · ↑↓ count · A bid · B call LIAR",240,284,"#cfc4ea",5.6,400,"center","CMLabel");}
    if(winner!==null){mx.fillStyle="rgba(0,0,0,.55)";mx.fillRect(0,0,480,336);bText(mx,winner==="lucky"?"Lucky takes the pot!":"Out of dice…",240,170,winner==="lucky"?"#ffd96a":"#e08080",18,700,"center","CMFellSC");}};
  const valid=(q,f)=>!bid||q>bid.q||(q===bid.q&&f>bid.f);
  const aiAct=async i=>{await sleep(900);
    const mine=hands[i];const exp=f=>mine.filter(v=>v===f||v===1).length+(total()-mine.length)/3;
    if(bid&&bid.q>exp(bid.f)+1.2&&Math.random()<.8)return {call:true};
    let best=null;for(let f=2;f<=6;f++){let q=Math.max(bid?bid.q:1,Math.round(exp(f)-.3));if(!valid(q,f))q++;if(!valid(q,f))continue;const risk=q-exp(f);if(!best||risk<best.risk)best={q,f,risk};}
    if(!best||best.risk>1.5)return {call:true};return {q:best.q,f:best.f};};
  const h=pushH(k=>{if(turn!==0||reveal||winner!==null)return;
    if(k==="left"){myF=myF>2?myF-1:6;}if(k==="right"){myF=myF<6?myF+1:2;}if(k==="up")myQ=Math.min(total(),myQ+1);if(k==="down")myQ=Math.max(1,myQ-1);
    if(k==="A"){if(valid(myQ,myF)){bid={q:myQ,f:myF,by:0};msg=`Lucky bids ${myQ} × ${myF}s.`;SFX.blip();turn=next(0);aiLoop();}else{msg="Bid must be higher!";SFX.bad();}}
    if(k==="B"&&bid){callLiar(0);}});
  const next=i=>{let j=i;do{j=(j+1)%3;}while(!P[j].dice);return j;};
  const callLiar=async i=>{reveal=true;const c=count(bid.f);const liar=c<bid.q;const loser=liar?bid.by:i;
    msg=`${P[i].n} calls LIAR! There are ${c} × ${bid.f}s. ${P[loser].n} loses a die.`;SFX.dice();
    await sleep(2400);P[loser].dice--;reveal=false;bid=null;rollAll();
    const alive=P.filter(p=>p.dice>0);if(!P[0].dice){winner="them";}else if(alive.length===1){winner="lucky";}
    turn=P[loser].dice?loser:next(loser);if(turn!==0)aiLoop();};
  const aiLoop=async()=>{while(turn!==0&&winner===null&&!reveal){const a=await aiAct(turn);if(winner!==null||reveal)return;
    if(a.call&&bid){await callLiar(turn);return;}bid={q:a.q||1,f:a.f||2,by:turn};msg=`${P[turn].n} bids ${bid.q} × ${bid.f}s.`;SFX.blip();turn=next(turn);
    if(turn===0){if(bid.f<6){myQ=bid.q;myF=bid.f+1;}else{myQ=bid.q+1;myF=2;}}}};
  await mgLoop((dt,t,end)=>{mx.imageSmoothingEnabled=true;render(t);if(winner!==null&&!end.f){end.f=1;setTimeout(end,1600);}});
  popH(h);
  if(winner==="lucky"){addGold(15);SFX.win();STATE.stats.dice=(STATE.stats.dice||0)+1;badge("gambler");if(STATE.stats.dice>=3)badge("highRoller");mgUI("Lucky rakes in the pot: +15gp.");}
  else mgUI("The Wainwrights split your buy-in. \"Again tomorrow, skeleton?\"");
  await sleep(1200);return winner==="lucky";
};

/* ------------------------------------------------------- title: continue */
{const _st=showTitle;showTitle=function(){_st();
  const v=$("tver");if(v)v.textContent=V8.ver.toUpperCase();
  let s=null;try{s=JSON.parse(sget("save")||"null");}catch(e){}
  const p=$("tpanel"),tb=p&&p.querySelector(".tbtns");if(!s||!tb||p.querySelector(".cont8"))return;
  const me=s.me||s.lead||"krodha",D=PARTY_DEF[me];if(!D)return;
  const x=s.v6||{},S=SESSIONS[x.session||1],M=MAPS[s.map];const t=Math.floor(((s.stats||{}).time||0)/60);
  const d=document.createElement("div");d.className="cont8";
  d.innerHTML=`<div class="im" style="background-image:url('${cardSrc(me)}')"></div><div class="tx"><div class="k">YOUR SAVED GAME</div><div class="n">${esc(D.short||D.name)} · Level ${s.level||1}</div>
    <div class="s">${S?(S.between?"Between Sessions":"Session "+(x.session||1)+" · "+esc(S.title)):""}</div><div class="s">${M?esc(M.name):""}${x.day&&s.flags&&s.flags.ch2?" · Day "+x.day:""} · ${Math.floor(t/60)}h ${t%60}m played</div></div>`;
  d.onclick=()=>{const b=$("tCont");if(b)b.click();};tb.before(d);};}

/* --------------------------------------------------- Adventurer's Card */
function cardStats8(){
  const x=STATE.v6?X():null,S=STATE.stats,v8=STATE.v8||{};let F=null;try{F=finalScore();}catch(e){}
  const sess=x?(SESSIONS[x.session]&&SESSIONS[x.session].between?"Between Sessions":"Session "+x.session):"Session 1";
  const ini=(()=>{try{const a=loadHS().filter(e=>e.ch===nameOf(STATE.lead)||true);const last=a.sort((p,q)=>q.t-p.t)[0];return last?last.i:"";}catch(e){return "";}})();
  return {x,S,v8,F,sess,ini};}
function adventurerCard8(){return new Promise(async res=>{
  const id=ME(),D=PARTY_DEF[id],{x,S,v8,F,sess,ini}=cardStats8();
  const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  // background: night, moon, frame
  let gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"#120e22");gr.addColorStop(1,"#05040a");g.fillStyle=gr;g.fillRect(0,0,W,H);
  const tb=IMG.v7title||IMG.title7||null;if(tb){g.globalAlpha=.25;g.drawImage(tb,0,0,W,H);g.globalAlpha=1;}
  for(let i=0;i<160;i++){g.fillStyle=`rgba(241,220,160,${Math.random()*.6})`;g.fillRect(Math.random()*W,Math.random()*H*.5,1.5,1.5);}
  g.fillStyle="#f1dca0";g.beginPath();g.arc(986,96,40,0,7);g.fill();g.fillStyle="#120e22";g.beginPath();g.arc(1001,85,37,0,7);g.fill();
  g.strokeStyle="#c9a44a";g.lineWidth=4;g.strokeRect(28,28,W-56,H-56);g.strokeStyle="rgba(201,164,74,.4)";g.lineWidth=1.5;g.strokeRect(44,44,W-88,H-88);
  const col=PC_COLOR[id]||"#c9a44a";
  g.textAlign="center";g.fillStyle="#9fe0b0";g.font=F7(22,400,"CMLabel");g.fillText("THE CROOKED MOON · THE GHOSTLIGHT EXPRESS",W/2,104);
  g.fillStyle="#f6e5b0";g.font=F7(64,400,"CMFellSC");g.fillText("Adventurer's Card",W/2,176);
  // card art
  const art=IMG["card:"+(id==="tessie"?"Tessie":D.name.split(" ")[0])];
  const ax=90,ay=230,aw=440,ah=660;g.fillStyle="#000";g.fillRect(ax-6,ay-6,aw+12,ah+12);
  if(art){const s=Math.max(aw/art.width,ah/art.height);g.save();g.beginPath();g.rect(ax,ay,aw,ah);g.clip();g.imageSmoothingQuality="high";g.drawImage(art,ax+(aw-art.width*s)/2,ay+(ah-art.height*s)/2,art.width*s,art.height*s);g.restore();}
  g.strokeStyle=col;g.lineWidth=5;g.strokeRect(ax-3,ay-3,aw+6,ah+6);
  // sprite badge
  g.fillStyle="rgba(10,8,20,.85)";g.beginPath();g.arc(ax+aw-10,ay+ah-10,74,0,7);g.fill();g.strokeStyle=col;g.lineWidth=4;g.stroke();
  drawChar8Big(g,ax+aw-10,ay+ah+42,D.look,"down",{scale:2.4});
  // name block
  const rx=580;g.textAlign="left";g.fillStyle=col;g.font=F7(20,400,"CMLabel");g.fillText(ini?`PLAYED BY ${ini}`:"PLAYED AT MOON'S TABLE",rx,262);
  g.fillStyle="#f6e5b0";g.font=F7(58,400,"CMFellSC");wrapText8(g,D.name,rx,322,430,58);
  g.fillStyle="#cfc4ea";g.font=F7(24,400,"CMLabel");g.fillText((D.species+" "+D.cls).toUpperCase(),rx,D.name.length>16?440:388);
  g.fillStyle="#a79cc0";g.font=F7(26,400,"CMFell");g.fillText("Thread of Fate: "+D.thread,rx,D.name.length>16?478:426);
  // grade
  const gy=D.name.length>16?520:470;
  if(F){g.fillStyle="rgba(255,217,106,.1)";g.fillRect(rx,gy,420,150);g.strokeStyle="rgba(255,217,106,.6)";g.lineWidth=2;g.strokeRect(rx,gy,420,150);
    g.fillStyle="#ffd96a";g.font=F7(120,400,"CMTitle");g.textAlign="center";g.fillText(F.grade,rx+90,gy+122);g.textAlign="left";
    g.fillStyle="#efe3c4";g.font=F7(22,400,"CMLabel");g.fillText("SCORE SO FAR",rx+190,gy+56);g.fillStyle="#fff3cf";g.font=F7(56,700,"CMPixel");g.fillText(F.total.toLocaleString(),rx+190,gy+114);}
  // stats grid
  const st=[["Reached",sess],["Level",String(STATE.level)],["Battles won",String(S.wins)],["Natural 20s",String(S.nat20)],
    ["Perfect strikes",String(v8.perfect||0)],["Secrets",String(Object.keys(STATE.secrets).length)],["Spirits helped",spiritsFreed()+"/6"],
    ["Days in the Hollow",x&&hasF("ch2")?String(x.day):"—"],["Tasks stamped",String(v8.stamps||0)],["Play time",(()=>{const t=Math.floor(S.time/60);return Math.floor(t/60)+"h "+(t%60)+"m";})()]];
  let sy=gy+(F?178:20);st.forEach((r,i)=>{const cx=rx+(i%2)*215,cy=sy+Math.floor(i/2)*58;g.fillStyle="#7fe0b8";g.font=F7(18,400,"CMLabel");g.fillText(r[0].toUpperCase(),cx,cy);g.fillStyle="#f1dca0";g.font=F7(34,700,"CMPixel");g.fillText(r[1],cx,cy+36);});
  // a moment
  let note=null;if(x){const mine=(x.notes||[]).filter(n=>new RegExp(nameOf(id).split(" ")[0],"i").test(n.text));note=(mine.length?mine:(x.notes||[]))[Math.floor(Math.random()*Math.max(1,(mine.length?mine:(x.notes||[])).length))];}
  g.fillStyle="rgba(234,223,196,.94)";g.fillRect(90,968,W-180,236);g.strokeStyle="#2a1d10";g.lineWidth=3;g.strokeRect(90,968,W-180,236);
  g.fillStyle="#8a1420";g.font=F7(20,400,"CMLabel");g.fillText("A MOMENT FROM THE RUN",120,1010);
  g.fillStyle="#241708";g.font=F7(34,400,"CMFell");wrapText8(g,note?"“"+note.text+"”":"“Five strangers, five tickets, nobody remembers buying one.”",120,1060,W-240,42,3);
  g.fillStyle="#6e5a3a";g.font=F7(20,400,"CMLabel");g.fillText(note?`SESSION ${note.s} · DAY ${note.day}`:"PROLOGUE",120,1184);
  g.textAlign="center";g.fillStyle="#6e6590";g.font=F7(20,400,"CMLabel");g.fillText(`${V8.ver.toUpperCase()} · A POCKET RPG OF MOON'S CROOKED MOON TABLE`,W/2,H-62);
  X8().cards=(X8().cards||0)+1;
  const url=c.toDataURL("image/png");
  const h=`<div style="text-align:center"><img src="${url}" style="width:min(360px,70vw);border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.7)"><p class="sub" style="margin:10px 0">Save it and send it to Moon (or the group chat).</p>
    <div class="row" style="justify-content:center"><button class="btn nav" id="card8dl">⬇ Save the card</button><button class="btn alt nav" onclick="closeModal()">Close</button></div></div>`;
  const p=modalAwait("🃏 Adventurer's Card","your run, so far",h,navList());
  $("card8dl").onclick=()=>{const a=document.createElement("a");a.download=`crooked-moon-${id}-card.png`;a.href=url;document.body.appendChild(a);a.click();a.remove();toast("🃏 Card saved to your Downloads","gold");SFX.ok();};
  await p;res();});}
function wrapText8(g,txt,x,y,maxW,lh,maxLines){const words=String(txt).split(" ");let line="",n=0;
  for(const w of words){const t=line?line+" "+w:w;if(g.measureText(t).width>maxW&&line){g.fillText(line,x,y);y+=lh;line=w;if(++n>=(maxLines||9)-1){line+=" …";break;}}else line=t;}
  if(line)g.fillText(line,x,y);}
/* the arcade screen grows a card button next to "Back to Wickermoor" */
if(typeof MutationObserver!=="undefined")new MutationObserver(()=>{const b=$("arBack");if(b&&!$("arCard8")){const c=document.createElement("button");c.className="ar-btn ghost";c.id="arCard8";c.textContent="🃏 Adventurer's Card";
  c.onclick=()=>{b.click();setTimeout(()=>runScript(()=>adventurerCard8()),200);};b.after(c);}}).observe(document.body,{childList:true,subtree:true});

/* ------------------------------------------------- The Story So Far */
async function storySoFar8(){
  const x=X(),pages=[];
  for(let n=1;n<=10;n++){const S=SESSIONS[n];if(!S)continue;const N=notesFor(n);if(!N.length&&n>x.session)continue;if(!N.length&&!x.wrapped[n]&&n!==x.session)continue;
    pages.push({n,S,N});}
  if(!pages.length){await say(null,"Nothing in the scrapbook yet. Go make some memories.");return;}
  let i=pages.length-1;
  await new Promise(res=>{
    const render=()=>{const pg=pages[i],S=pg.S,art=IMG["map:"+(SESS_ART8[pg.n]||"village")];const R=x.recaps[pg.n];
      $("mbody").innerHTML=`<div class="book8"><div class="pg8"${art?` style="--art:url('${art.src}')"`:""}>
        <div class="hd"><div class="sc-k">${S.between?"BETWEEN SESSIONS":"SESSION "+pg.n+" · "+esc(S.date)}</div><div class="t">${esc(S.title)}</div>${R?`<div class="sub">Recap #${pg.n} written · ${R.got}/${R.real} highlights${R.perfect?" · ✦ perfect":""}</div>`:""}</div>
        <div class="nt">${pg.N.length?pg.N.slice(0,14).map(q=>`<div class="ln"><i>${q.icon}</i><span>${esc(q.text)}</span><em>Day ${q.day}</em></div>`).join("")+(pg.N.length>14?`<div class="ln more">…and ${pg.N.length-14} more in the Session tab</div>`:""):`<div class="ln">The notes write themselves as things happen.</div>`}</div>
        <div class="ft"><button class="btn alt nav" data-p="-1" ${i?"":"disabled"}>◀</button><span>${i+1} / ${pages.length}</span><button class="btn alt nav" data-p="1" ${i<pages.length-1?"":"disabled"}>▶</button></div></div></div>`;
      $("mbody").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{i=clamp(i+(+b.dataset.p),0,pages.length-1);render();SFX.sel();});};
    openModal("📖 The Story So Far","← → turn pages · Esc close","",k=>{if(k==="left"&&i>0){i--;render();SFX.sel();}else if(k==="right"&&i<pages.length-1){i++;render();SFX.sel();}else if(k==="B"||k==="START")closeModal();});
    MODAL_CB=()=>res();render();});
}

/* ------------------------------------------------- credits: your run */
{const _rc=rollCredits;rollCredits=function(){_rc();const R=$("croll");if(!R)return;
  R.innerHTML=R.innerHTML.replace("v7 “The Glow-Up”","v8 “Full Moon”");
  const end=[...R.children].find(e=>/To be continued/.test(e.textContent));
  const S=STATE.stats,v8=STATE.v8||{},x=STATE.v6?X():null;
  const blk=document.createElement("div");blk.innerHTML=`<h3>YOUR RUN</h3><div class="run8">${[["Battles won",S.wins],["Natural 20s",S.nat20],["Perfect strikes",v8.perfect||0],["Secrets learned",Object.keys(STATE.secrets).length],["Spirits helped",spiritsFreed()+" / 6"],["Days in the Hollow",x&&hasF("ch2")?x.day:"—"]].map(([a,b])=>`<div><b>${b}</b><span>${a}</span></div>`).join("")}</div>
    <div style="color:var(--dim);margin-top:8px">Menu ▸ ★ You ▸ 🃏 Adventurer's Card — save it, send it to Moon.</div>`;
  if(end)R.insertBefore(blk,end);else R.appendChild(blk);};}

/* ------------------------------------- dialog portraits: crisp pixel busts */
{const _sp=setPortrait;setPortrait=function(el,who,opt){
  const img=opt&&opt.img?opt.img:portraitImg(who);
  if(!img||!img.v8crisp)return _sp(el,who,opt);
  el.innerHTML="";const c=document.createElement("canvas");c.width=256;c.height=256;const g=c.getContext("2d");
  g.fillStyle="#0b0916";g.fillRect(0,0,256,256);g.imageSmoothingEnabled=false;g.drawImage(img,0,0,256,256);
  const gr=g.createLinearGradient(0,180,0,256);gr.addColorStop(0,"rgba(0,0,0,0)");gr.addColorStop(1,"rgba(0,0,0,.4)");g.fillStyle=gr;g.fillRect(0,0,256,256);
  c.style.imageRendering="pixelated";el.appendChild(c);el.style.display="block";};}

/* ------------------------------ dialog: the speaker stands behind the box */
const FIG8={who:null,hideT:0};
function fig8El(){let f=$("fig8");if(!f){f=document.createElement("div");f.id="fig8";f.innerHTML="<img alt=''>";$("viewport").appendChild(f);
  const z=parseInt(getComputedStyle($("dlg")).zIndex)||40;f.style.zIndex=z-1;}return f;}
{const _dg=dialog;dialog=function(who,text,choices,opt){
  try{const k=who&&!PARTY_DEF[who]&&(PORT[who]||(typeof who==="string"&&IMG["npc:"+who]?who:null));const im=k&&v8opt("figs")&&IMG["npc:"+k];
    const f=fig8El();clearTimeout(FIG8.hideT);
    if(im){if(FIG8.who!==k){f.classList.remove("on");void f.offsetWidth;f.querySelector("img").src=im.src;FIG8.who=k;}f.classList.add("on");}
    else{f.classList.remove("on");FIG8.who=null;}$("dlg").classList.toggle("fig8on",!!im&&!document.body.classList.contains("touch"));}catch(e){}
  const p=_dg(who,text,choices,opt);
  p.then(()=>{FIG8.hideT=setTimeout(()=>{if(!DLG_OPEN){const f=$("fig8");if(f)f.classList.remove("on");FIG8.who=null;}},140);});
  return p;};}
V8.opt.figs=1;

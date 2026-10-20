/* =============================== v7 · menus ============================= *
 * Party cards with the character art, a proper bestiary, achievements with
 * progress, an HD pass for the minigames, and the new credits roll. */
MENU_HTML.party=()=>{
  const nx=STATE.level<5?LEVEL_XP[STATE.level]:null,px=LEVEL_XP[STATE.level-1];
  let h=`<div class="row" style="justify-content:space-between;margin-bottom:8px"><div><span class="sc-k">THE PARTY · LEVEL ${STATE.level}</span></div><div class="sub">XP ${STATE.xp}${nx?" / "+nx:" · max level"}</div></div>
    <div style="height:6px;background:#221a3a;border-radius:3px;overflow:hidden;margin-bottom:12px;box-shadow:inset 0 0 0 1px #000"><i style="display:block;height:100%;width:${nx?Math.round(100*(STATE.xp-px)/(nx-px)):100}%;background:linear-gradient(90deg,var(--ghost),#bff7d8)"></i></div><div class="grid2" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">`;
  PARTY_ORDER.forEach(id=>{const {s,p,D,res}=pcLine(id);
    const ab=D.abil.filter(a=>abilUnlocked(id,a)).map(a=>ABIL[a].name);
    const gear=Object.keys(GEAR).filter(g=>GEAR[g].who===id&&hasF(g)).map(g=>GEAR[g].name);
    h+=`<div class="card" style="${id===STATE.lead?"border-color:var(--gold2);box-shadow:0 0 0 1px rgba(201,164,74,.35)":""}"><div class="pc7">
      <div class="art" style="background-image:url('${cardSrc(id)}')">${id===STATE.lead?`<span class="lv">♛ LEADS</span>`:""}${id===ME()?`<span class="you">YOU</span>`:""}</div>
      <div><h4>${esc(D.name)}</h4><div class="cls">${esc((D.species+" "+D.cls+" · "+D.sub).toUpperCase())}</div>
        <div class="row" style="gap:6px"><span class="stat"><b>${p.hp}/${s.hpMax}</b>HP</span><span class="stat"><b>${s.ac}</b>AC</span><span class="stat"><b>+${s.atk+s.atkBonus}</b>ATK</span></div>
        <div class="hpb"><i style="width:${Math.round(100*Math.max(0,p.hp)/s.hpMax)}%"></i></div>
        <div class="sub">${esc(res.join(" · "))}${res.length?" · ":""}Thread: ${esc(D.thread)}</div>
        <div class="chips">${ab.map(a=>`<span class="chip">${esc(a)}</span>`).join("")}${gear.map(g=>`<span class="chip g">⚒ ${esc(g)}</span>`).join("")}</div>
        <div class="sub" style="margin-top:6px">${esc(D.blurb)}</div>
        ${id===STATE.lead?"":`<button class="btn alt nav" data-lead="${id}" style="margin-top:8px;padding:5px 10px;font-size:12px">Make leader</button>`}</div></div></div>`;});
  return h+"</div>";};
MENU_HTML.bestiary=()=>{
  const all=Object.keys(MON),seen=all.filter(m=>STATE.seen[m]);
  let h=`<div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="sc-k">BESTIARY · ${seen.length}/${all.length} SEEN · ${Object.keys(STATE.secrets).length} SECRETS</span><span class="sub">Study secrets with Eleanor at the Antique Bookstore.</span></div><div class="grid2" style="grid-template-columns:repeat(auto-fill,minmax(330px,1fr))">`;
  all.forEach(m=>{const M=MON[m];if(!STATE.seen[m]){h+=`<div class="card lock"><div class="mon7"><canvas width="72" height="72"></canvas><div><h4>???</h4><div class="sub">Not yet encountered.</div></div></div></div>`;return;}
    const sec=M.secret&&SECRETS[M.secret],known=sec&&STATE.secrets[M.secret];
    h+=`<div class="card"><div class="mon7"><canvas class="monart7" data-mon="${m}" width="144" height="144"></canvas><div>
      <h4 style="font-family:var(--f-title);font-weight:400;font-size:20px">${esc(M.name)}</h4><div class="sub">${esc(M.type)}${M.noFight?"":` · AC ${M.ac} · HP ${M.hp}`}${M.boss?' · <b style="color:var(--gold)">BOSS</b>':""}</div>
      <div class="sub" style="color:var(--dim)">Defeated ×${STATE.defeated[m]||0}</div></div></div>
      <div class="sub" style="margin-top:6px">${esc(M.desc)}</div>
      ${sec?`<div class="sub" style="margin-top:6px;padding:5px 7px;border-radius:5px;background:${known?"rgba(127,224,184,.08)":"rgba(255,255,255,.03)"};border:1px dashed ${known?"var(--ghost)":"#3a3160"};color:${known?"var(--ghost)":"var(--dim)"}">🔑 ${known?`<b>${esc(sec.name)}</b> — ${esc(sec.text)}`:`Secret unknown · ${esc(sec.study)}`}</div>`:""}</div>`;});
  return h+"</div>";};
MENU_HTML.badges=()=>{const ks=Object.keys(BADGES),got=ks.filter(k=>STATE.badges[k]).length;
  let h=`<div class="row" style="justify-content:space-between"><span class="sc-k">ACHIEVEMENTS · ${got}/${ks.length}</span></div>
    <div style="height:6px;background:#221a3a;border-radius:3px;overflow:hidden;margin:6px 0 12px;box-shadow:inset 0 0 0 1px #000"><i style="display:block;height:100%;width:${Math.round(100*got/ks.length)}%;background:linear-gradient(90deg,var(--gold3),var(--gold))"></i></div><div class="grid2">`;
  ks.forEach(k=>{const b=BADGES[k],on=STATE.badges[k];h+=`<div class="card${on?"":" lock"}" style="display:flex;gap:10px;align-items:center"><div style="width:40px;height:40px;flex:0 0 40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;background:radial-gradient(#3a2e5a,#120e22);border:2px solid ${on?"var(--gold)":"#3a3160"}">${on?b[0]:"🔒"}</div>
    <div><h4 style="margin:0">${esc(b[1])}</h4><div class="sub">${on?esc(b[2]):"Keep playing to find out."}</div>${on&&typeof on==="number"&&on>1e12?`<div class="sub" style="color:#6e6590;font-size:10px">${new Date(on).toLocaleDateString()}</div>`:""}</div></div>`;});
  return h+"</div>";};
{const _pm=paintMenuCanvases;paintMenuCanvases=function(){_pm();
  $("mbody").querySelectorAll("canvas.monart7").forEach(c=>{const g=c.getContext("2d");g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";const im=monImage(MON[c.dataset.mon]);if(im){const s=Math.min(136/im.width,136/im.height);g.drawImage(im,(144-im.width*s)/2,(144-im.height*s)/2,im.width*s,im.height*s);}});};}
/* menu tab labels with icons */
{const IC={party:"♛",items:"⚱",session:"✦",journal:"✎",bestiary:"☠",lore:"❦",ledger:"⚖",glossary:"§",badges:"★",system:"⚙"};
  MENU_TABS.forEach(t=>{if(IC[t[0]]&&!t[1].startsWith(IC[t[0]]))t[1]=IC[t[0]]+" "+t[1].replace("Badges","Achievements").replace("Save/Options","Options");});}

/* --------------------------------------------------- minigames in HD */
{const _mo=mgOpen;mgOpen=function(){_mo();const r=Math.max(1,Math.min(4,Math.ceil((parseFloat(mg.style.width)/480)*(window.devicePixelRatio||1))));if(mg.width!==480*r){mg.width=480*r;mg.height=336*r;}mg.dataset.rs=r;mx.setTransform(r,0,0,r,0,0);mx.imageSmoothingEnabled=false;};
 const _ml=mgLoop;mgLoop=function(fn){return _ml((dt,t,end)=>{const r=+mg.dataset.rs||1;mx.setTransform(r,0,0,r,0,0);fn(dt,t,end);});};
 mgText=function(t,x,y,col,size,align){mx.fillStyle=col||"#efe3c4";mx.font=F7(size||10,700);mx.textAlign=align||"center";mx.fillText(nolig(t),x,y);mx.textAlign="left";};}

/* -------------------------------------------------------------- credits */
const CAST_POR={"The Vagrant":"The_Vagrant","Adela Druskenvald":"Adela_Druskenvald","Phillip Druskenvald":"Phillip_Druskenvald","The Daydreamer":"The_Daydreamer","The Mariner":"The_Mariner","The Songstress":"The_Songstress","The Sweetheart":"The_Sweetheart","The Jailbird":"The_Jailbird","The Harlequin":"The_Harlequin","Mayor Wendel Somerton":"Mayor_Wendel_Somerton","Alda Farnum":"Alda_Farnum","Baltus Tolliver":"Baltus_Tolliver","Eleanor Heyling":"Eleanor_Heyling","Thomasin Ardor":"Thomasin_Ardor","Solomon Roderick":"Solomon_Roderick","Doris Squire":"Doris_Squire","Howie Butterman":"Howie_Butterman","Weston Murdoch":"Weston_Murdoch","Morgan":"Morgan","Hilda Brom":"Hilda_Brom","Finneas Trout":"Finneas_Trout","Randall Graham":"Randall_Graham","Holly Aster":"Holly_Aster","Jean Myriel":"Jean_Myriel","Theodora Mayville":"Theodora_Mayville","Old Rusty":"Old_Rusty","Sister Rain":"Sister_Rain","The Jenkin family":"Walter_Jenkin","The Crooked Man":"The_Crooked_Man","Vessla Browntooth":"Vessla_Browntooth"};
rollCredits=function(){
  const cast=["The Vagrant","Adela Druskenvald","Phillip Druskenvald","The Daydreamer","The Mariner","The Songstress","The Sweetheart","The Jailbird","The Harlequin","Mayor Wendel Somerton","Alda Farnum","Baltus Tolliver","Eleanor Heyling","Thomasin Ardor","Solomon Roderick","Doris Squire","Howie Butterman","Weston Murdoch","Morgan","Hilda Brom","Finneas Trout","Randall Graham","Holly Aster","Jean Myriel","Theodora Mayville","Old Rusty","Sister Rain","The Jenkin family","Sally Lockwood","Joseph Patrini","Petunia","Gail","Whisp","The Crooked Man","Vessla Browntooth"];
  const por=n=>{const k=CAST_POR[n];const im=k&&IMG["por:"+k];return im?`<img src="${im.src}" alt="">`:`<span style="display:inline-block;width:34px"></span>`;};
  const me=ME(),D=PARTY_DEF[me];
  const role={azareth:"Harvestborn Cleric",lucky:"Relicborn Rogue (and, lately, Bard)",poppi:"Threadborn Sorcerer",krodha:"Plagueborn Monk · Silas of Tsen",tessie:"Deepborn Ranger · and Caster, a very good ghost"};
  const C=$("credits");C.innerHTML=`<div class="bgc" style="background-image:url('${IMG.v7title?IMG.v7title.src:""}')"></div><div class="roll" id="croll"></div><div class="skip">PRESS A TO SKIP</div>`;
  $("croll").innerHTML=`${IMG.v7logo?`<img class="logoC" src="${IMG.v7logo.src}" alt="The Crooked Moon">`:"<h1>The Crooked Moon</h1>"}
   <div style="font-family:var(--f-goth);font-size:36px;color:var(--ghost)">The Ghostlight Express</div><div style="color:var(--dim)">Sessions 1–8 · Between Sessions</div>
   <h3>STARRING</h3><div><b style="font-family:var(--f-title);font-size:30px;font-weight:400;color:#f6e5b0">you</b> <span style="color:var(--dim)">as</span> <b style="font-family:var(--f-title);font-size:30px;font-weight:400;color:#f6e5b0">${esc(D.name)}</b></div>
   <h3>DUNGEON MASTER</h3><div style="font-family:var(--f-title);font-size:28px;color:#f6e5b0">Moon</div>
   <h3>THE PARTY</h3><div>${PARTY_ORDER.map(id=>`<div class="star7${id===me?" you":""}"><img src="${cardSrc(id)}" alt=""><b>${esc(PARTY_DEF[id].short||PARTY_DEF[id].name)}</b><span>${esc(role[id])}</span></div>`).join("")}</div>
   <h3>THE CAST</h3><div style="max-width:880px;margin:auto">${cast.map(n=>`<span class="cast7">${por(n)}<span>${esc(n)}</span></span>`).join("")}</div>
   <h3>SPECIAL THANKS</h3><div>A baby goat, who ran away</div><div>Forty weasel pelts</div><div>A mouth full of teeth</div>
   <h3>CAMPAIGN &amp; ART</h3><div>The Crooked Moon — Avantris</div><div>Maps, monsters &amp; NPC art from the Crooked Moon VTT Asset Pack</div>
   <h3>BUILT ON</h3><div>TableForge Lite · the On Location engine · v7 “The Glow-Up”</div><div style="color:var(--dim);font-size:13px">Type: Jacquard 24 · Pixelify Sans · Silkscreen · Jersey 10 · IM Fell English (SIL Open Font License)</div>
   <h3>NEXT TIME</h3><div>Session 9 · Dinner with the Druskenvalds, and the Patrini book</div><div>Memory's Rest · The Grey · The Bakery · Foxwillow · Maidenmist</div><div>Stonoga Blackstinger &amp; Gollub Graygullet.</div>
   <div style="font-family:var(--f-goth);font-size:56px;color:#f6e5b0;margin-top:70px">To be continued…</div><div style="color:var(--dim)">see you at the table</div><div style="height:30vh"></div>`;
  C.style.display="block";playSong("title");
  const done=()=>{popH(h);C.style.display="none";playSong(curMap().music);};
  const h=pushH(k=>{if(k==="B"||k==="START"||k==="A")done();});
  C.onclick=done;
  setTimeout(()=>{if(C.style.display==="block")done();},62000);
};

/* ------------------------------------------------- skill checks: a real d20 */
diceModal=function(label,nat,bonus,dc,ok){
  return new Promise(res=>{
    const html=`<div style="text-align:center"><div class="sc-k">${esc(label.toUpperCase())} · DC ${dc}</div>
      <canvas class="dice7" id="dc7" width="480" height="300"></canvas><div class="dres7" id="dieres"></div>
      <div style="margin-top:10px"><button class="btn nav" id="dieok" disabled>Continue</button></div></div>`;
    openModal("🎲 Roll","the dice decide",html,navList());MODAL_CB=()=>res();
    const cv2=$("dc7"),g=cv2.getContext("2d");g.setTransform(2,0,0,2,0,0);const t0=performance.now(),spinMs=760;let landed=0;const parts=[];
    SFX.dice();
    const frame=()=>{if(!$("dc7"))return;const t=performance.now(),age=t-t0,spin=age<spinMs;g.clearRect(0,0,240,150);
      const gg=g.createRadialGradient(120,70,10,120,70,110);gg.addColorStop(0,"rgba(80,60,140,.25)");gg.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gg;g.fillRect(0,0,240,150);
      if(!spin&&!landed){landed=t;if(nat===20){for(let i=0;i<46;i++){const a=rnd(0,6.28),v=rnd(30,120);parts.push({x:120,y:66,vx:Math.cos(a)*v,vy:Math.sin(a)*v,b:t,l:rnd(600,1100)});}tone(1568,.2,"square",.04);tone(2093,.3,"square",.035,0,.1);}
        else if(nat===1)tone(110,.35,"sawtooth",.05,-40);
        const r=$("dieres");if(r)r.innerHTML=`${nat} ${bonus>=0?"+":"−"} ${Math.abs(bonus)} = <b>${nat+bonus}</b> &nbsp;→&nbsp; <span class="big" style="color:${ok?"var(--ok)":"var(--blood)"}">${ok?"SUCCESS":"FAIL"}</span>${nat===20?' · <b style="color:var(--gold)">NAT 20!</b>':nat===1?' · <b style="color:var(--blood)">NAT 1…</b>':""}`;
        ok?SFX.ok():SFX.bad();const b=$("dieok");if(b){b.disabled=false;b.onclick=()=>closeModal();}}
      const land=spin?0:clamp((t-landed)/220,0,1),bounce=spin?Math.abs(Math.sin(age/80))*14*(1-age/spinMs):0;
      const x=spin?lerp(40,120,age/spinMs):120,rot=spin?age/50:0,sc=spin?1:1+.22*Math.sin(land*Math.PI);
      const n20=!spin&&nat===20,n1=!spin&&nat===1;
      drawD20(g,x,66-bounce,40*sc,rot,n20?["#ffe9a0","#b8862a"]:n1?["#5a1a24","#2a0a10"]:["#3a2f62","#1a1430"],n20?"#fff6c8":n1?"#ff6a6a":"#f1dca0");
      bText(g,spin?String(d(20)):String(nat),x,73-bounce,n20?"#3a2406":n1?"#ffb0b0":"#fff3cf",spin?16:20,700,"center","CMLabel");
      parts.forEach(p=>{const a=(t-p.b)/1000,k=(t-p.b)/p.l;if(k>1)return;g.globalAlpha=1-k;g.fillStyle="#ffe08a";g.fillRect(p.x+p.vx*a-1.5,p.y+p.vy*a+40*a*a-1.5,3,3);g.globalAlpha=1;});
      if(age<4000)requestAnimationFrame(frame);};
    requestAnimationFrame(frame);
  });};

/* ------------------------------------------------------- autosave chip */
{const s=document.createElement("div");s.id="save7";s.innerHTML="<i></i>SAVED";$("viewport").appendChild(s);let tm=null,last=0;
 const _sg=saveGame;saveGame=function(){_sg();const now=performance.now();if(now-last<4000||!inWorld())return;last=now;s.classList.add("on");clearTimeout(tm);tm=setTimeout(()=>s.classList.remove("on"),1300);};}

/* arcade gets the painting behind it */
{const _sa=showArcade;showArcade=function(arc){const A=$("arcade");if(A&&IMG.v7title)A.style.setProperty("--arbg",`url('${IMG.v7title.src}')`);return _sa(arc);};}

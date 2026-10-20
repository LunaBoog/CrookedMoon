/* ================================ score.js (v6) ========================= *
 * One score, arcade style (On Location v7.3): FINAL SCORE line items slide
 * in → grade → 3-letter initials → top-10 board. The board lives in its
 * own storage key (cm_hiscores), OUTSIDE the cmgb1: save prefix, so New
 * Game never wipes it. Runs are scored at "Sessions 1–8" and again at
 * "Through Dinner"; the arc is stored with each entry. */
const HS_KEY="cm_hiscores";
function loadHS(){try{return JSON.parse(localStorage.getItem(HS_KEY)||"[]");}catch(e){return window.__cmhs||[];}}
function saveHS(a){window.__cmhs=a;try{localStorage.setItem(HS_KEY,JSON.stringify(a));}catch(e){}}
const GRADES=[["S",19500],["A",16000],["B",12500],["C",9000],["D",0]]; // "Through Dinner"; the Sessions 1–8 arc uses ×0.9 (calibrated with play7)
function finalScore(arc){const R=[],add=(l,d,pts)=>{if(pts)R.push([l,d,Math.round(pts)]);};const x=X(),S=STATE.stats;
  let req=0,reqD=0,opt=0,optD=0;for(let n=1;n<=8;n++){if(!x.wrapped[n])continue;sessTasks(n).forEach(t=>{if(t.opt){opt++;if(taskDone(t))optD++;}else{req++;if(taskDone(t))reqD++;}});}
  add("Session tasks done",`${reqD} of ${req}`,reqD*100);add("Session tasks missed",`${req-reqD}`,-(req-reqD)*75);add("Optional tasks",`${optD} of ${opt}`,optD*60);
  if(x.session>=9){const T=DOWNTIME_TASKS,dd=T.filter(taskDone).length;add("Between Sessions",`${dd} of ${T.length}`,dd*100);}
  const sp=spiritsFreed();add("Spirits helped to move on",`${sp} of 6`,sp*150);
  const hl=heirloomCount()||(hasF("vesslaDone")?6:0);add("Heirlooms found",`${hl} of 6`,hl*100);
  const rc=Object.values(x.recaps);add("Session recaps written",`${rc.length}`,rc.length*100);
  add("Recap highlights remembered",`${rc.reduce((a,r)=>a+r.got,0)}`,rc.reduce((a,r)=>a+r.got,0)*20);
  add("Perfect recaps",`${rc.filter(r=>r.perfect).length}`,rc.filter(r=>r.perfect).length*200);
  add("Rumors written down as fact",`${rc.reduce((a,r)=>a+r.fakes,0)}`,-rc.reduce((a,r)=>a+r.fakes,0)*40);
  const hon=Object.values(x.honest).filter(h=>h.ok).length;add("Honest about open promises",`${hon}`,hon*100);
  const pk=Object.values(x.promises).filter(p=>p.by==="us"&&p.kept).length;add("Promises kept",`${pk}`,pk*100);
  add("Villagers: nailed it",`${x.best}`,x.best*75);add("Villagers: heard out",`${Math.max(0,x.heard-x.best)}`,Math.max(0,x.heard-x.best)*25);add("Villagers cut off",`${x.cut}`,-x.cut*40);
  add("Party calls answered",`${x.calls} (${x.callsBest} best)`,x.calls*30+x.callsBest*40);
  const L=Object.values(x.look),lk=L.filter(l=>l.looked).length,bl=L.filter(l=>l.blind).length;add("Looked closer first",`${lk}`,lk*40);add("Took it blind",`${bl}`,-bl*60);
  add("Books for Eleanor",`${x.books}`,x.books*50);
  add("Caster walked back",`${x.casterFound}`,x.casterFound*100);add("The baby goat, found",x.goatFound?"yes":"",x.goatFound?100:0);
  add("Nights on the moors",`${x.roamers}`,x.roamers*50);
  add("Monster secrets learned",`${Object.keys(STATE.secrets).length}`,Object.keys(STATE.secrets).length*50);
  add("Bestiary entries",`${Object.keys(STATE.seen).length}`,Object.keys(STATE.seen).length*25);
  add("Badges earned",`${Object.keys(STATE.badges).length}`,Object.keys(STATE.badges).length*40);
  add("Lore & glossary",`${Object.keys(STATE.lore).length+Object.keys(x.gloss).length}`,(Object.keys(STATE.lore).length+Object.keys(x.gloss).length)*10);
  add("Battles won",`${S.wins}`,S.wins*30);add("Natural 20s",`${S.nat20}`,S.nat20*20);add("Party members downed",`${S.kos}`,-S.kos*40);
  add("Standing in the Hollow",`⭐ ${standingTotal()}`,standingTotal()*10);
  const asked=x.heard+x.calls,acc=asked?(x.best+x.callsBest)/asked:0;if(asked)add("Best-answer accuracy",`${Math.round(acc*100)}%`,acc*500);
  const hints=Object.values(x.hints).reduce((a,b)=>a+b,0);add("Asked Caster for a hint",`${hints}`,-hints*50);
  const total=Math.max(0,R.reduce((a,r)=>a+r[2],0));const k=(arc||(hasF("dinnerDone")?"Through Dinner":"Sessions 1–8"))==="Through Dinner"?1:.9;const grade=GRADES.find(g=>total>=g[1]*k)[0];
  return {rows:R,total,grade};}
function hsTable(highlight,limit){const a=loadHS().slice(0,limit||10);
  if(!a.length)return `<div class="hs-empty">No scores yet. Be the first!</div>`;
  return a.map((e,i)=>`<div class="hs-row${highlight&&e.t===highlight?" me":""}"><span class="r">${i+1}.</span><b>${esc(e.i)}</b><span class="c">${esc(e.ch)} · ${esc(e.arc||"")} · ${esc(e.g)}</span><span class="n">${e.s.toLocaleString()}</span></div>`).join("");}
function showArcade(arc){return new Promise(res=>{
  const A=$("arcade"),F=finalScore(arc),x=X();A.classList.add("on");SFX.level();
  const done=arc&&x.scored[arc];
  A.innerHTML=`<div class="ar-box"><div class="ar-h">FINAL SCORE</div><div class="ar-sub">Crooked Moon · ${esc(arc||"Score so far")} · led by ${esc(nameOf(STATE.lead))}</div>
    <div class="ar-rows">${F.rows.map(r=>`<div class="r${r[2]<0?" neg":""}"><span>${esc(r[0])} <i>· ${esc(r[1])}</i></span><span>${r[2]>0?"+":""}${r[2].toLocaleString()}</span></div>`).join("")}</div>
    <div class="ar-total" id="arTot">0</div><div class="ar-grade">GRADE ${F.grade}</div><div id="arBottom"></div></div>`;
  const h=pushH(()=>{});let key=null;
  const close=()=>{A.classList.remove("on");popH(h);if(key)window.removeEventListener("keydown",key,true);res();};
  const rows=[...A.querySelectorAll(".ar-rows .r")];rows.forEach((r,i)=>setTimeout(()=>{r.classList.add("in");tone(520+i*14,.03,"square",.02);},90*i));
  const tot=$("arTot"),t0=performance.now(),dur=Math.min(3000,300+rows.length*90);
  const tick=n=>{const k=Math.min(1,(n-t0)/dur);tot.textContent=Math.round(F.total*k).toLocaleString();if(k<1)requestAnimationFrame(tick);else{SFX.win();bottom();}};requestAnimationFrame(tick);
  const endBtns=()=>`<div class="row" style="justify-content:center;margin-top:10px"><button class="ar-btn" id="arBack">▶ Back to Wickermoor</button><button class="ar-btn ghost" id="arCred">🎬 Credits</button></div>`;
  const wireEnd=()=>{$("arBack").onclick=close;$("arCred").onclick=()=>{close();rollCredits();};
    key=key||(e=>{if(!A.classList.contains("on"))return;if(e.key==="Enter"||e.key==="Escape"||e.key===" "){e.preventDefault();e.stopPropagation();close();}});window.addEventListener("keydown",key,true);};
  const bottom=()=>{const B=$("arBottom");
    if(!arc||done){B.innerHTML=`<div class="hs"><h3>HIGH SCORES</h3>${hsTable(done||x.hsT[arc])}</div>`+(arc?"":`<div class="ar-sub">(A preview. Scores are saved at the end of Session 8 and after dinner.)</div>`)+endBtns();wireEnd();return;}
    const ini=["A","A","A"];let cur=0;
    B.innerHTML=`<div class="ar-sub" style="color:#ffce3a">ENTER YOUR INITIALS</div><div class="ini">${[0,1,2].map(i=>`<div class="slot" data-i="${i}"><button data-u="${i}">▲</button><div class="ch">A</div><button data-d="${i}">▼</button></div>`).join("")}</div>
      <div class="ar-sub">${document.body.classList.contains("touch")?"Tap ▲▼ to pick letters":"Type letters, or ↑↓ to change · ←→ to move · Enter to save"}</div><button class="ar-btn" id="arSave">SAVE SCORE</button>`;
    const draw=()=>B.querySelectorAll(".slot").forEach((s,i)=>{s.querySelector(".ch").textContent=ini[i];s.classList.toggle("cur",i===cur);});
    const bump=(i,dv)=>{ini[i]=String.fromCharCode((ini[i].charCodeAt(0)-65+dv+26)%26+65);cur=i;draw();tone(700,.02,"square",.02);};
    B.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>bump(+b.dataset.u,1));B.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>bump(+b.dataset.d,-1));
    B.querySelectorAll(".slot .ch").forEach((c,i)=>c.onclick=()=>{cur=i;draw();});draw();
    const save=()=>{window.removeEventListener("keydown",key,true);key=null;const t=Date.now();
      const a=loadHS();a.push({i:ini.join(""),s:F.total,g:F.grade,ch:nameOf(STATE.lead),t,d:new Date().toISOString().slice(0,10),arc});a.sort((p,q)=>q.s-p.s);saveHS(a.slice(0,50));
      x.scored[arc]=t;x.hsT[arc]=t;saveGame();const rank=a.findIndex(e=>e.t===t)+1;
      B.innerHTML=`<div class="ar-sub" style="color:#7fe0a0;font-size:14px">${rank<=10?`YOU'RE #${rank} ON THE BOARD!`:`SAVED · RANK #${rank}`}</div><div class="hs"><h3>HIGH SCORES</h3>${hsTable(t)}</div>`+endBtns();SFX.win();wireEnd();};
    key=e=>{if(!A.classList.contains("on"))return;const k=e.key;
      if(/^[a-zA-Z]$/.test(k)){ini[cur]=k.toUpperCase();cur=Math.min(2,cur+1);draw();tone(700,.02,"square",.02);}
      else if(k==="ArrowUp")bump(cur,1);else if(k==="ArrowDown")bump(cur,-1);else if(k==="ArrowLeft"){cur=Math.max(0,cur-1);draw();}else if(k==="ArrowRight"){cur=Math.min(2,cur+1);draw();}
      else if(k==="Backspace"){cur=Math.max(0,cur-1);draw();}else if(k==="Enter"){save();}else return;
      e.preventDefault();e.stopPropagation();};
    window.addEventListener("keydown",key,true);$("arSave").onclick=save;};
});}
{const d=document.createElement("div");d.id="arcade";$("viewport").appendChild(d);}

/* the end of Session 8 → the arcade, then Between Sessions */
{const _sc=openScorecard;openScorecard=async function(){if(!STATE.v6)return _sc();await showArcade(hasF("dinnerDone")?"Through Dinner":hasF("gameDone")?"Sessions 1–8":null);};}

/* ---------------------------------- menu & title ------------------------ */
{const _sh=MENU_HTML.system;MENU_HTML.system=()=>_sh()+`<div class="row" style="margin-top:8px"><button class="btn nav" data-arc="1">🕹 ${hasF("gameDone")?"Final score & high scores":"Score so far"}</button></div>`;}
MENU_WIRE.push(tab=>{if(tab!=="system")return;const b=$("mbody").querySelector("[data-arc]");if(b)b.onclick=async()=>{closeModal();await showArcade(hasF("dinnerDone")?"Through Dinner":hasF("gameDone")?"Sessions 1–8":null);};});
{const _st=showTitle;showTitle=function(){_st();const p=$("tpanel");const d=document.createElement("div");d.className="hs title-hs";d.innerHTML=`<h3>HIGH SCORES</h3>${hsTable(null,10)}`;p.appendChild(d);
  const pr=document.createElement("div");pr.className="press-start press";pr.textContent="PRESS START";const tb=p.querySelector(".tbtns");if(tb)tb.after(pr);
  const sl=p.querySelector(".sublogo");if(sl)sl.innerHTML="THE GHOSTLIGHT EXPRESS · <span style='color:var(--moon)'>v6</span>";
  const sub=p.querySelector("p.sub.press");if(sub){sub.classList.remove("press");sub.textContent="A Game Boy–style RPG of Moon's Crooked Moon campaign · Sessions 1–8 · Between Sessions";}};}
{const _rc=rollCredits;rollCredits=function(){_rc();const c=$("croll");if(!c)return;
  c.innerHTML=c.innerHTML.replace("The Ghostlight Express · Sessions 1–8","The Ghostlight Express · Sessions 1–8 · Between Sessions")
    .replace("<div>TableForge Lite · the On Location engine</div>","<div>TableForge Lite · the On Location engine (v7.3 layer: sessions, days, villagers, look closer, the arcade)</div>")
    .replace(/<h3>NEXT TIME<\/h3>[\s\S]*?<h1/,`<h3>NEXT TIME</h3><div>Session 9 · Dinner with the Druskenvalds, and the Patrini book</div><div>Memory's Rest · The Grey · The Bakery · Foxwillow · Maidenmist</div><div>Stonoga Blackstinger & Gollub Graygullet.</div><h1`);};}

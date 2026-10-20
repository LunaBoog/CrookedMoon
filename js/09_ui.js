/* ================================== ui.js ============================== */
let DLG_OPEN=false, INPUT_LOCK=false;
function lockInput(v){INPUT_LOCK=v;}
function nameOf(who){
  if(!who)return "";
  if(PARTY_DEF[who])return PARTY_DEF[who].short||PARTY_DEF[who].name;
  const n=findNpcName(who);return n||who;
}
function findNpcName(id){for(const m in MAPS){const e=MAPS[m].npcs.find(n=>n.id===id||n.look===id);if(e)return e.name;}return null;}
function setPortrait(el,who,opt){
  el.innerHTML="";const img=opt&&opt.img?opt.img:portraitImg(who);
  if(img){const c=document.createElement("canvas");c.width=64;c.height=64;const g=c.getContext("2d");g.imageSmoothingEnabled=false;
    g.fillStyle="#0b0916";g.fillRect(0,0,64,64);const s=Math.min(64/img.width,64/img.height);const w=img.width*s,h=img.height*s;g.drawImage(img,(64-w)/2,64-h,w,h);el.appendChild(c);el.style.display="block";return;}
  if(who&&(LOOK[who]||PARTY_DEF[who])){const c=document.createElement("canvas");c.width=24;c.height=24;const g=c.getContext("2d");g.imageSmoothingEnabled=false;
    drawChar(g,0,0,PARTY_DEF[who]?PARTY_DEF[who].look:LOOK[who],"down",0,{});el.appendChild(c);el.style.display="block";return;}
  el.style.display="none";
}
/* typewriter say() — resolves on A. ask() adds choices. */
function say(who,text,opt){return dialog(who,text,null,opt);}
function ask(who,text,choices,opt){return dialog(who,text,choices,opt);}
function dialog(who,text,choices,opt){
  opt=opt||{};
  return new Promise(resolve=>{
    DLG_OPEN=true;const box=$("dlg");box.style.display="block";
    setPortrait($("dpor"),who,opt);
    const nm=opt.name||(who?nameOf(who):"");$("dwho").innerHTML=esc(nm)+(opt.sub?`<small>${esc(opt.sub)}</small>`:(PARTY_DEF[who]?`<small>${PARTY_DEF[who].cls}</small>`:""));
    $("dwho").style.display=nm?"block":"none";
    const sayEl=$("dsay"),chEl=$("dch");chEl.innerHTML="";$("dmore").style.display="none";
    let i=0,done=false,sel=0,full=String(text||"");
    const speed=who?22:16;
    let tmr=null;
    const tick=()=>{if(i<full.length){i=Math.min(full.length,i+2);sayEl.textContent=full.slice(0,i);if(i%6===0&&who)tone(who&&PARTY_DEF[who]?520:420,.02,"square",.012);tmr=setTimeout(tick,speed);}else finish();};
    const finish=()=>{if(done)return;done=true;clearTimeout(tmr);sayEl.textContent=full;
      if(choices&&choices.length){renderChoices();}else $("dmore").style.display="block";};
    const renderChoices=()=>{chEl.innerHTML="";choices.forEach((ch,k)=>{const b=document.createElement("button");b.className="ch"+(k===sel?" sel":"");
      b.innerHTML=`<span class="k">${k+1}</span>${esc(ch)}`;b.onclick=()=>{sel=k;close(k);};chEl.appendChild(b);});};
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
    box.onclick=e=>{if(e.target.classList.contains("ch"))return;if(!done)finish();else if(!(choices&&choices.length))close(0);};
  });
}
/* ---- toasts, banner, fades ---- */
function toast(t,kind){const d=document.createElement("div");d.className="toast "+(kind||"");d.textContent=t;const tc=$("toast");tc.appendChild(d);while(tc.children.length>4)tc.firstChild.remove();setTimeout(()=>{d.style.transition="opacity .5s";d.style.opacity="0";setTimeout(()=>d.remove(),500);},2600);}
function banner(a,b){$("ban1").textContent=a||"";$("ban2").textContent=b||"";$("banner").style.opacity=1;clearTimeout(banner.t);banner.t=setTimeout(()=>$("banner").style.opacity=0,2400);}
function fadeTo(v,ms){return new Promise(r=>{const f=$("fade");f.style.transition=`opacity ${ms||350}ms`;f.style.opacity=v;setTimeout(r,ms||350);});}
const FX={shake:0,flash:0,flashCol:"#fff",vignette:null,warp:0};
function shake(n){FX.shake=Math.max(FX.shake,n||6);}
function flash(col){FX.flash=1;FX.flashCol=col||"#fff";}

/* ---- modal ---- */
let MODAL=null;
function openModal(title,tag,html,onKey){
  $("mtitle").textContent=title;$("mtag").textContent=tag||"";$("mbody").innerHTML=html||"";$("modalbg").style.display="flex";$("modal").scrollTop=0;
  if(MODAL)popH(MODAL.h);
  const h=pushH(k=>{if(k==="B"||(k==="START"&&!onKey)){closeModal();return;}if(onKey)onKey(k);});
  MODAL={h};
}
function closeModal(){if(!MODAL)return;popH(MODAL.h);MODAL=null;$("modalbg").style.display="none";if(MODAL_CB){const f=MODAL_CB;MODAL_CB=null;f();}}
let MODAL_CB=null;
function modalAwait(title,tag,html,onKey){return new Promise(r=>{MODAL_CB=r;openModal(title,tag,html,onKey);});}
$("mclose").onclick=()=>closeModal();
/* keyboard list navigation inside modal (buttons with .nav) */
function navList(noLR){let i=0;const items=()=>[...$("mbody").querySelectorAll(".nav:not(:disabled)")];
  const paint=()=>{items().forEach((b,k)=>b.classList.toggle("sel",k===i));const b=items()[i];if(b)b.scrollIntoView({block:"nearest"});};
  setTimeout(paint,0);
  return k=>{const it=items();if(!it.length)return;if(k==="down"||(!noLR&&k==="right")){i=(i+1)%it.length;paint();SFX.sel();}else if(k==="up"||(!noLR&&k==="left")){i=(i+it.length-1)%it.length;paint();SFX.sel();}else if(k==="A"){it[i]&&it[i].click();}};}

/* ---- skill checks: a big d20 on the screen ---- */
const SKILLS={
  azareth:{Investigation:4,Insight:5,Religion:2,Nature:2,Perception:3,Survival:3,Persuasion:-1,Deception:-1,Medicine:5},
  lucky:{Deception:7,"Sleight of Hand":7,Stealth:5,Persuasion:5,Perception:1,Insight:3,Acrobatics:5},
  poppi:{Arcana:2,Investigation:2,Deception:4,Persuasion:4,Intimidation:4,Perception:1,History:2},
  krodha:{Acrobatics:5,Athletics:2,Insight:4,Perception:4,Stealth:5,Survival:2},
  tessie:{Perception:5,Survival:5,Stealth:5,Nature:3,Investigation:2,"Animal Handling":4},
};
async function check(pc,skill,dc){
  const bonus=(SKILLS[pc]&&SKILLS[pc][skill])||1;
  const nat=d(20);const total=nat+bonus;const ok=nat===20||(nat!==1&&total>=dc);
  if(nat===20){STATE.stats.nat20++;badge("nat20");}if(nat===1){STATE.stats.nat1++;badge("nat1");}
  await diceModal(`${nameOf(pc)} · ${skill}`,nat,bonus,dc,ok);
  return {ok,nat,total};
}
function diceModal(label,nat,bonus,dc,ok){
  return new Promise(res=>{
    const html=`<div style="text-align:center"><div style="color:var(--dim);font-size:12px;letter-spacing:.1em">${esc(label)} · DC ${dc}</div>
      <div id="bigdie" style="font-size:64px;font-weight:900;color:var(--moon);margin:10px 0;text-shadow:0 4px 0 #000">?</div>
      <div id="dieres" style="font-size:16px;min-height:24px"></div><div style="margin-top:10px"><button class="btn nav" id="dieok" disabled>Continue</button></div></div>`;
    openModal("🎲 ROLL","", html,navList());MODAL_CB=()=>res();
    let n=0;SFX.dice();const iv=setInterval(()=>{$("bigdie").textContent=d(20);if(++n>12){clearInterval(iv);
      $("bigdie").textContent=nat;$("bigdie").style.color=nat===20?"var(--gold)":nat===1?"var(--blood)":"var(--moon)";
      $("dieres").innerHTML=`${nat} ${bonus>=0?"+":"−"} ${Math.abs(bonus)} = <b>${nat+bonus}</b> → ${ok?'<span style="color:var(--ok)">SUCCESS</span>':'<span style="color:var(--blood)">FAIL</span>'}${nat===20?" · NAT 20!":nat===1?" · NAT 1…":""}`;
      ok?SFX.ok():SFX.bad();const b=$("dieok");b.disabled=false;b.onclick=()=>closeModal();}},60);
  });
}

/* ---- the START menu ---- */
const MENU_TABS=[["party","Party"],["items","Items"],["journal","Journal"],["bestiary","Bestiary"],["lore","Lore"],["badges","Badges"],["system","Save/Options"]];
const MENU_HTML={party:()=>partyHTML(),items:()=>itemsHTML(),journal:()=>journalHTML(),bestiary:()=>bestiaryHTML(),lore:()=>loreHTML(),badges:()=>badgesHTML(),system:()=>systemHTML()};
const MENU_WIRE=[]; // v6 layers push extra wiring fns
function openMenu(tab){
  tab=tab||"party";
  const tabs=MENU_TABS;
  const body=()=>{
    let h=`<div class="tabs">${tabs.map(([k,n])=>`<button class="tab${k===tab?" on":""}" data-t="${k}">${n}</button>`).join("")}</div>`;
    const f=MENU_HTML[tab];if(f)h+=f();
    return h;};
  const order=tabs.map(t=>t[0]);
  const render=()=>{$("mbody").innerHTML=body();$("mbody").querySelectorAll(".tab").forEach(b=>b.onclick=()=>{tab=b.dataset.t;render();});wireMenu();MENU_WIRE.forEach(f=>f(tab,render));paintMenuCanvases();};
  const nav=navList(true);
  openModal("☰ MENU","← → tabs · ↑↓ A select · Esc close","",k=>{if(k==="left"||k==="right"){let i=order.indexOf(tab);i=(i+(k==="right"?1:order.length-1))%order.length;tab=order[i];render();SFX.sel();}else nav(k);});
  render();
}
function pcLine(id){const s=pcStat(id),p=STATE.pcs[id],D=PARTY_DEF[id];
  const res=[];if(s.slotsMax)res.push(`Slots ${p.slots}/${s.slotsMax}`);if(id==="krodha")res.push(`Ki ${p.ki}/${s.kiMax}`);if(id==="poppi"&&s.spMax)res.push(`SP ${p.sp}/${s.spMax}`);if(id==="lucky")res.push(`Bullets ${p.ammo}/10`);
  return {s,p,D,res};}
function partyHTML(){
  let h=`<p class="sub" style="color:var(--dim)">Level <b style="color:var(--moon)">${STATE.level}</b> · XP ${STATE.xp}${STATE.level<5?" / "+LEVEL_XP[STATE.level]:""} · Leader: <b>${nameOf(STATE.lead)}</b> (Q / Tab to swap)</p><div class="grid2">`;
  PARTY_ORDER.forEach(id=>{const {s,p,D,res}=pcLine(id);
    const ab=D.abil.filter(a=>abilUnlocked(id,a)).map(a=>ABIL[a].name).join(" · ");
    const gear=Object.keys(GEAR).filter(g=>GEAR[g].who===id&&hasF(g)).map(g=>GEAR[g].name);
    h+=`<div class="card${id===STATE.lead?" lead":""}" style="${id===STATE.lead?"border-color:var(--moon)":""}"><div class="row" style="align-items:flex-start;flex-wrap:nowrap">
      <canvas class="art pcpor" data-pc="${id}" width="64" height="64" style="width:64px;height:64px;border-radius:5px;border:2px solid #000"></canvas>
      <div><h4>${D.name} <span class="sub">${D.cls} · ${D.sub}</span></h4><div class="sub">${D.species} · ${D.bg} · Thread: ${D.thread}</div>
      <div style="margin-top:3px"><span class="stat"><b>${p.hp}/${s.hpMax}</b>HP</span><span class="stat"><b>${s.ac}</b>AC</span><span class="stat"><b>+${s.atk}</b>ATK</span></div>
      <div class="sub">${res.join(" · ")}</div></div></div>
      <div class="sub" style="margin-top:4px">${esc(D.blurb)}</div>
      <div class="sub" style="margin-top:4px;color:var(--ghost)">${esc(ab)}</div>
      ${gear.length?`<div class="sub" style="color:var(--gold)">Gear: ${esc(gear.join(", "))}</div>`:""}
      <button class="btn alt nav" data-lead="${id}" style="margin-top:6px">Make leader</button></div>`;});
  return h+"</div>";}
function itemsHTML(){
  let h=`<p><b>🪙 ${STATE.gold} gp</b></p><h4 style="color:var(--moon);margin:6px 0">Consumables</h4><div class="grid2">`;
  const inv=Object.keys(STATE.items).filter(k=>STATE.items[k]>0);
  if(!inv.length)h+=`<div class="sub">Nothing. Shops: Apothecary, Trading Post, Bakery, Smithy.</div>`;
  inv.forEach(k=>{const it=ITEMS[k];if(!it)return;h+=`<div class="card"><h4>${it.icon} ${it.name} ×${STATE.items[k]}</h4><div class="sub">${esc(it.desc)}</div>${(it.use==="both"&&it.heal)?`<button class="btn alt nav" data-use="${k}" style="margin-top:4px">Use (field)</button>`:""}</div>`;});
  h+=`</div><h4 style="color:var(--moon);margin:10px 0 6px">Key Items</h4><div class="grid2">`;
  Object.keys(STATE.keys).filter(k=>STATE.keys[k]>0).forEach(k=>{const it=KEYITEMS[k];if(!it)return;h+=`<div class="card"><h4>${it.icon} ${it.name}${STATE.keys[k]>1?" ×"+STATE.keys[k]:""}</h4><div class="sub">${esc(it.desc)}</div></div>`;});
  return h+"</div>";}
function journalHTML(){
  let h="";const act=QORDER.filter(q=>STATE.quests[q]&&!STATE.quests[q].done),dn=QORDER.filter(q=>STATE.quests[q]&&STATE.quests[q].done);
  const obj=objective();if(obj)h+=`<div class="qitem main" style="border-left-color:var(--ghost)"><b>NEXT UP:</b> ${esc(obj.text)}<span class="st">${esc(obj.sub||"")}</span></div>`;
  h+=`<h4 style="color:var(--moon);margin:8px 0 4px">Active</h4>`;
  if(!act.length)h+=`<div class="sub">No active quests.</div>`;
  act.forEach(q=>{const Q=QUESTS[q],s=STATE.quests[q];h+=`<div class="qitem ${Q.main?"main":""}"><b>${Q.main?"★ ":""}${esc(Q.name)}</b>`;
    Q.steps.forEach((st,i)=>{if(i<s.step)h+=`<span class="st" style="text-decoration:line-through;opacity:.6">✓ ${esc(st)}</span>`;else if(i===s.step)h+=`<span class="st" style="color:var(--ink)">▸ ${esc(st)}</span>`;});h+=`</div>`;});
  h+=`<h4 style="color:var(--moon);margin:10px 0 4px">Completed</h4>`;dn.forEach(q=>h+=`<div class="qitem done">${esc(QUESTS[q].name)}</div>`);
  h+=`<h4 style="color:var(--moon);margin:10px 0 4px">Places to Visit</h4><div class="sub">Crimson Monastery (resonates with Poppi) · Drowned Crossroads (rapscallions; a Soul Eater spotted) · Memory's Rest (resonates with Azareth) · Hartsblight Forest · Foxwillow (farms) · The Howlers (very dangerous) · The mine (just an old abandoned mine…)</div>`;
  return h;}
function bestiaryHTML(){
  const seen=Object.keys(MON).filter(m=>STATE.seen[m]);
  let h=`<p class="sub">Seen ${seen.length}/${Object.keys(MON).length} · Secrets known ${Object.keys(STATE.secrets).length}. Study unknown secrets with Eleanor at the Antique Bookstore.</p><div class="grid2">`;
  Object.keys(MON).forEach(m=>{const M=MON[m];if(!STATE.seen[m]){h+=`<div class="card lock"><h4>???</h4><div class="sub">Not yet encountered.</div></div>`;return;}
    const sec=M.secret&&SECRETS[M.secret];const known=sec&&STATE.secrets[M.secret];
    h+=`<div class="card"><div class="row" style="flex-wrap:nowrap;align-items:flex-start"><canvas class="art monart" data-mon="${m}" width="56" height="56" style="width:56px;height:56px"></canvas><div>
      <h4>${esc(M.name)}</h4><div class="sub">${M.type}${M.noFight?"":` · AC ${M.ac} · HP ${M.hp}`} · defeated ×${STATE.defeated[m]||0}</div></div></div>
      <div class="sub" style="margin-top:4px">${esc(M.desc)}</div>
      ${sec?`<div class="sub" style="margin-top:4px;color:${known?"var(--ghost)":"var(--dim)"}">🔑 SECRET: ${known?`<b>${esc(sec.name)}</b> — ${esc(sec.text)}`:`??? (${esc(sec.study)})`}</div>`:""}</div>`;});
  return h+"</div>";}
const LORE={
  shroud:["The Shroud","The impenetrable mist outside the Ghostlight Express. Those who enter are lost forever, forced to wander endlessly."],
  soulcoal:["Soul Coal","The train is fueled by lost souls with unfinished business who never move on. The furnace is their final destination."],
  mcquest:["The McQuest Debt","A letter from a famous gambler to a McQuest: 'Your father doesn't own your soul.' Wager it right and entice a being to take the bet."],
  crookedQueen:["The Crooked Queen","Before the Druskenvalds, these lands were ruled by the Crooked Queen. Her magic is older than the Old Ways — and it's still here."],
  greenQueen:["Keller, the Green Queen","Before Druskenvald, this land was an eden — a demi-plane of forests ruled by Keller the Green Queen. Her reign ended. Crooked Queen, Green Queen… the same woman?"],
  oldWays:["The Old Ways","Survival is a privilege granted by natural and spiritual worlds, requiring ritual, sacrifice, and obedience. The oak needs blood."],
  patientLady:["The Fold of the Patient Lady","The Patient Lady provides all that is needed; nature is kind, not cruel. Led by Sister Rain."],
  brightsingers:["The Brightsingers","Only the Brightsinger is pure. Gentleness, kindness, living in harmony. They worship at the ruined church."],
  censored:["A Censored History","The town history book has pages torn out and blacked over. Someone doesn't want people to know."],
  grey:["The Grey","A curse of Edwardia in three parts: a grey fog, a mark on its natives, and a two-headed beast — accept death, the mastiff; reject it, the wolf."],
  tsen:["Silas of Tsen","Krodha, born Silas in Tsen Village. Trained in the Temple of Ten Thousand Leaves. His body meditates at a monastery; his spirit walks here."],
  lockwoods:["The Lockwoods","The previous owners of the manor. An arcane spell changed the house. The patriarch, Eustace Lockwood, is the Crooked Man."],
  divided:["The Divided Soul","Krodha has no reflection and no shadow. His other half acts under his name. 'All is necessary.'"],
  lordOfDeath:["The Lord of Death","Phillip Druskenvald lost his powers as the Lord of Death upon entering Wickermoor Hollow. He doesn't know why."],
  malediction:["Malediction","Poppi's family curse: all daughters die at 21. A library book matches it — with many blank pages, eyes and wings."],
  lethica:["Matron Lethica","Head of Memory's Rest. Wrote an essay on memory in a psych book in the Crooked House library."],
  beast:["The Beast","Half dog, half bear, crazy eyes. It sucked the souls out of Tessie's clan. It is not dead."],
  coven:["The Vermintoll Coven","Three hag sisters: Vessla Browntooth (weasels), Stonoga Blackstinger (centipedes), Gollub Graygullet (pigeons). Each believes she alone serves the Crooked Queen."],
};
function learnLore(k){if(!LORE[k]||STATE.lore[k])return;STATE.lore[k]=1;toast("📖 Lore: "+LORE[k][0],"ghost");}
function loreHTML(){let h=`<p class="sub">Things the party has learned about Druskenvald.</p>`;Object.keys(LORE).forEach(k=>{h+=STATE.lore[k]?`<div class="qitem"><b>${esc(LORE[k][0])}</b><span class="st">${esc(LORE[k][1])}</span></div>`:`<div class="qitem" style="opacity:.4">???</div>`;});return h;}
const BADGES={
  waxOn:["🕯","Wax On","Sealed the Shroud out with candle wax."],allAboard:["🚂","All Aboard","Helped all six spirits move on."],tigerTamer:["🐯","Here, Kitty","Fed the ghost tiger."],
  cageBreaker:["🗝","Open Cages","Unlocked every cage on the circus car."],soulCollector:["🏮","Soul Collector","Found all 8 soul-flame jars."],goatRescuer:["🐐","Goat Rescuer","Freed the ritual goat."],
  democracy:["🗳","Democracy Now","Challenged the mayor to a duel."],smoothTalker:["🎭","Sent by the Druskenvalds","Lied to a constable. Successfully."],detective:["🔎","Case Closed","Solved the Dead Man and the Marble Finger."],
  hexbreaker:["👝","Hexbreaker","Destroyed the hex bag."],readingIsFundamental:["📚","Reading Is Fundamental","Lucky bought an encyclopedia."],hypebeast:["🧥","Hype Beast","Lucky got his studded puffer."],
  puzzler:["✋","The Hand Will Give","Solved the three bowls."],fingerCollector:["☝","Fourteen Fingers","Tessie's new necklace."],handsOff:["🖐","Hands Off","Defeated the Hand-Taker."],
  pestControl:["🐀","Pest Control","Killed the grandfather clock and its weasels."],lurkerInTheLight:["💡","Lurker-in-the-Light","Put a sign on it."],babysitter:["🧸","Babysitter","Calmed the spectral baby."],
  hagSlayer:["🧙","Hag Slayer","Defeated Vessla Browntooth."],nat20:["🎲","Natural 20","Rolled a nat 20."],nat1:["💀","Natural 1","Rolled a nat 1. It happens."],
  gambler:["🃏","Crossroads Gambler","Won at Liar's Dice."],highRoller:["💰","High Roller","Won Liar's Dice three times."],lockpicker:["🔓","Five-Finger Discount","Picked 5 locks."],
  encore:["🎹","Encore!","A perfect harpsichord duet."],noKO:["🛡","Nobody Left Behind","Won a boss fight with nobody downed."],secretKeeper:["🔑","Scholar of the Forbidden","Used a monster's SECRET in battle."],
  critMachine:["💥","Crit Happens","Landed 10 critical hits."],tarot:["🃏","The Cards Have Spoken","Had your fates read by Adela."],
};
function badge(k){if(!BADGES[k]||STATE.badges[k])return;STATE.badges[k]=Date.now();SFX.item();toast(BADGES[k][0]+" Badge: "+BADGES[k][1],"gold");}
function badgesHTML(){let h=`<p class="sub">${Object.keys(STATE.badges).length}/${Object.keys(BADGES).length} earned</p><div class="grid2">`;
  Object.keys(BADGES).forEach(k=>{const b=BADGES[k],on=STATE.badges[k];h+=`<div class="card${on?"":" lock"}"><h4>${on?b[0]:"🔒"} ${esc(b[1])}</h4><div class="sub">${on?esc(b[2]):"???"}</div></div>`;});return h+"</div>";}
function systemHTML(){
  const t=Math.floor(STATE.stats.time/60);
  return `<div class="row"><button class="btn nav" data-sys="save">💾 Save game</button><button class="btn alt nav" data-sys="sound">${SOUND?"🔊 Sound on":"🔇 Sound off"}</button><button class="btn alt nav" data-sys="music">${MUSIC?"🎵 Music on":"🎵 Music off"}</button>
    <button class="btn alt nav" data-sys="speed">Battle text: ${STATE.fast?"fast":"normal"}</button><button class="btn alt nav" data-sys="followers">Party trail: ${STATE.noFollow?"off":"on"}</button><button class="btn alt nav" data-sys="title">⏏ Title screen</button></div>
    <p class="sub" style="margin-top:10px">Play time ${Math.floor(t/60)}h ${t%60}m · Steps ${STATE.stats.steps} · Battles ${STATE.stats.wins}/${STATE.stats.battles} · Crits ${STATE.stats.crits} · Nat 20s ${STATE.stats.nat20} · Nat 1s ${STATE.stats.nat1}</p>
    <p class="sub">Controls: Arrows/WASD move · Z/E/Space = A (talk/confirm) · X/Esc = B (back) · Enter = Menu · M = Map · J = Journal · Q/Tab = swap leader · \` = DM Screen</p>`;}
function wireMenu(){
  const b=$("mbody");
  b.querySelectorAll("[data-lead]").forEach(x=>x.onclick=()=>{STATE.lead=x.dataset.lead;SFX.ok();openMenu("party");});
  b.querySelectorAll("[data-use]").forEach(x=>x.onclick=async()=>{const k=x.dataset.use;closeModal();await useFieldItem(k);openMenu("items");});
  b.querySelectorAll("[data-sys]").forEach(x=>x.onclick=()=>{const s=x.dataset.sys;
    if(s==="save"){saveGame();toast("💾 Saved","gold");}
    if(s==="sound"){SOUND=!SOUND;sset("sound",SOUND?"1":"0");}
    if(s==="music")setMusic(!MUSIC);
    if(s==="speed")STATE.fast=!STATE.fast;
    if(s==="followers")STATE.noFollow=!STATE.noFollow;
    if(s==="title"){saveGame();closeModal();showTitle();return;}
    openMenu("system");});
}
function paintMenuCanvases(){
  $("mbody").querySelectorAll("canvas.pcpor").forEach(c=>{const g=c.getContext("2d");g.imageSmoothingEnabled=false;const im=portraitImg(c.dataset.pc);if(im)g.drawImage(im,0,0,64,64);});
  $("mbody").querySelectorAll("canvas.monart").forEach(c=>{const g=c.getContext("2d");g.imageSmoothingEnabled=false;const im=monImage(MON[c.dataset.mon]);if(im){const s=56/Math.max(im.width,im.height);g.drawImage(im,(56-im.width*s)/2,(56-im.height*s)/2,im.width*s,im.height*s);}});
}
async function useFieldItem(k){
  const it=ITEMS[k];if(!it||!countItem(k))return;
  const c=await ask(null,`Use ${it.name} on whom?`,PARTY_ORDER.map(id=>`${nameOf(id)} (${STATE.pcs[id].hp}/${pcStat(id).hpMax})`).concat(["Cancel"]),{cancel:5});
  if(c>=5)return;const id=PARTY_ORDER[c];
  takeItem(k);if(it.heal){const n=roll(it.heal).total;healPC(id,n);toast(`${nameOf(id)} +${n} HP`,"ghost");SFX.heal();}
  if(it.cure){STATE.pcs[id].down=false;toast(nameOf(id)+" feels better");}
}

/* ---- shops ---- */
const SHOPS={
  trading:{name:"Tolliver's Trading Post",who:"baltus",stock:["bottle","iron","salts","antitoxin"]},
  apoth:{name:"The Apothecary",who:"morgan",stock:["potion","antitoxin","holywater","salts"]},
  bakery:{name:"Bread by Holly",who:"holly",stock:["honeycake"]},
  smithy:{name:"The Smithy",who:"jean",stock:["iron"],gear:["smithAz","smithLu","smithPo","smithKr","smithTe"]},
};
function openShop(id){
  const S=SHOPS[id];
  const render=()=>{let h=`<p>🪙 <b>${STATE.gold}</b> gp</p><div class="grid2">`;
    S.stock.forEach(k=>{const it=ITEMS[k];h+=`<div class="card"><h4>${it.icon} ${it.name} — ${it.price}gp</h4><div class="sub">${esc(it.desc)}</div><div class="sub">Owned: ${countItem(k)}</div><button class="btn nav" data-buy="${k}" ${STATE.gold<it.price?"disabled":""}>Buy</button></div>`;});
    (S.gear||[]).forEach(g=>{const G2=GEAR[g];h+=`<div class="card${hasF(g)?" lock":""}"><h4>⚒ ${G2.name} — 40gp</h4><div class="sub">${esc(G2.desc)} (${nameOf(G2.who)})</div>${hasF(g)?`<div class="sub">Done.</div>`:`<button class="btn nav" data-gear="${g}" ${STATE.gold<40?"disabled":""}>Commission</button>`}</div>`;});
    h+=`</div>`;$("mbody").innerHTML=h;
    $("mbody").querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>{const it=ITEMS[b.dataset.buy];if(STATE.gold<it.price)return;addGold(-it.price);giveItem(b.dataset.buy,1);SFX.coin();render();});
    $("mbody").querySelectorAll("[data-gear]").forEach(b=>b.onclick=()=>{if(STATE.gold<40)return;addGold(-40);setF(b.dataset.gear);SFX.item();toast("⚒ "+GEAR[b.dataset.gear].name,"gold");render();});
  };
  const nav=navList();openModal("🛒 "+S.name,"Esc to leave","",nav);render();
}

/* ---- travel map (the Travel Ledger — village square only) ---- */
const REGIONS=[
  {id:"village",name:"Wickermoor Village",x:.61,y:.63,to:["village",14,25],need:"ch2"},
  {id:"wytch",name:"The Wytchwood (edge)",x:.53,y:.32,to:["wytchwood",7,15],need:"wytchwoodIn"},
  {id:"chapel",name:"Chapel of the Hands",x:.58,y:.22,to:["chapelyard",8,9],need:"handtakerDone"},
  {id:"manor",name:"Druskenvald Manor",x:.585,y:.585,to:["village",8,10],need:"ch4"},
  {id:"memory",name:"Memory's Rest",x:.29,y:.44,lock:"Chapter 5 · Morgan's suggestion"},
  {id:"foxwillow",name:"Foxwillow",x:.76,y:.47,lock:"Randall's lift · someday"},
  {id:"cemetery",name:"Maidenmist Cemetery",x:.72,y:.78,lock:"It keeps getting bigger…"},
  {id:"monastery",name:"The Crimson Monastery",x:.22,y:.73,lock:"Resonates with Poppi"},
  {id:"crossroads",name:"The Drowned Crossroads",x:.74,y:.2,lock:"Rapscallions & a Soul Eater"},
  {id:"mine",name:"Skitterdeep Mine",x:.42,y:.53,lock:"Just an old abandoned mine…"},
  {id:"hartsblight",name:"Hartsblight Forest",x:.27,y:.2,lock:"Heart Blight"},
];
function openTravel(viewOnly){
  const full=hasF("gotMap");
  let h=`<div style="position:relative;width:100%;max-width:680px;margin:auto"><canvas id="tvmap" width="960" height="624" style="width:100%;image-rendering:pixelated;border:2px solid #000;border-radius:4px"></canvas>`;
  REGIONS.forEach((r,i)=>{if(!full&&r.lock)return;const ok=r.to&&hasF(r.need);
    h+=`<button class="btn ${ok?"":"alt"} nav" data-rg="${i}" ${ok&&!viewOnly?"":"disabled"} style="position:absolute;left:${r.x*100}%;top:${r.y*100}%;transform:translate(-50%,-50%);font-size:10px;padding:3px 6px;${ok?"":"opacity:.75"}">${ok?"📍":"🔒"} ${esc(r.name)}</button>`;});
  h+=`</div><p class="sub" style="text-align:center">${viewOnly?"View only — fast travel from the Community Board (the Travel Ledger) in the village square.":"Choose a destination. Locked pins are future chapters."}${full?"":" (Get Finneas's map to chart the whole Hollow.)"}</p>`;
  openModal("🗺 WICKERMOOR HOLLOW",full?"Finneas's map":"",h,navList());
  const c=$("tvmap").getContext("2d");if(IMG.hollow)c.drawImage(IMG.hollow,0,0,960,624);
  $("mbody").querySelectorAll("[data-rg]").forEach(b=>{const r=REGIONS[+b.dataset.rg];b.title=r.lock||"";b.onclick=async()=>{closeModal();await warp(r.to[0],r.to[1],r.to[2],"down",{banner:["TRAVEL",r.name]});};});
}

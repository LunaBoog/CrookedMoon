/* ================================= dm.js (v6) =========================== *
 * DM Screen controls for the new systems (it's a table game too):
 * jump to any session, wrap the session, roll/fire today's pools, move the
 * clock, send the invitation, keep a Table Log, and test the arcade. */
const S_FLAGS={
  2:["boarded","shroudDone","cracksealed","harlequinDealt","harlequinGone","trainCrash","metDrusk","tarotDone"],
  3:["jarQuest","jar1","jar2","jar3","jar4","jar5","jar6","jarsDone","jarsHalf","locoDefeated","druskReward","lvl2","arrived","wolvesDone","goatFree","ritualTalked","ch2","metAlda","innNight1","boardRead","metBaltus","metEleanor","metThomasin","taylorKnown"],
  4:["metSolomon","key_finger","fingerIdentified","fingerReturned","taylorUnlocked","key_hexbag","hexMorgan","hexKnown","knowsCult","metHilda","hildaGuide","metFinneas","gotMap","wytchwoodIn","lightCast","caster","bodySeen","campFound","forkChosen","forkFresh","riverCrossed","marshHaintDone","goodberry"],
  5:["gravesRobbed","gateOpen","inscription","handOpen","chalked","alchOpen","templeSeen","noHands","handtakerDone"],
  6:["mysterySolved","ch3back","reportedDoris","hexDestroyed","weaselsKnown","ch4","metRandall","metJenkins","enteredHouse"],
  7:["portraitsSeen","peacockDone","weaselsF1Done","ouijaDone","petuniaAsked","got_cup","greenScarf","feastDone","pearl","musicWeasels","harpDone","floor2Open"],
  8:["krodhaMirror","clockDone","sallyMet","chk_bed","chk_closet","chk_dresser","chk_toybox","chk_window","lurkerDone","got_doll","bathDone","key_journal","jasperDone","balconySeen","floor3Open"],
  9:["key_pin","readLibrary","luckyBard","taleTold","beastCalled","stuffiesDone","got_bear","atticReady","inAttic","runesOpen","vesslaDone","gameDone",],
};
const S_SPOT={1:["car_passenger",8,3],2:["wreckage",10,8],3:["village",14,25],4:["marsh",4,13],5:["village",15,30],6:["house1",8,16],7:["house1",13,15],8:["house3",7,10],9:["village",15,30]};
const S_LVL={1:1,2:2,3:3,4:3,5:4,6:4,7:4,8:4,9:5};
const S_KEYS={7:["gem","cup","key","greenscarf","pearl"],8:["doll","journal","pocketwatch","satchel","duck"],9:["bear","pin"]};
async function applySessionPreset(n){if(DM.open)toggleDM();V6_QUIET=true;
  try{STATE.flags={};STATE.keys={};STATE.quests={};for(let k=2;k<=n;k++){(S_FLAGS[k]||[]).forEach(f=>STATE.flags[f]=1);(S_KEYS[k]||[]).forEach(q=>STATE.keys[q]=1);}
    if(n>=9){STATE.lore.malediction=1;STATE.lore.lethica=1;STATE.lore.coven=1;}if(n>=4)STATE.items.tooth=(STATE.items.tooth||0);if(n>=8)STATE.items.tooth=Math.max(STATE.items.tooth||0,10);
    const qs={2:["spirits","survive"],3:["finger","cursed","cook","antiquarian","explore","escort"],4:["memory","grey","finger"],5:["weasels","house"],9:["son","mailbox","bakery","cemetery"]};
    for(let k=1;k<=n;k++)(qs[k]||[]).forEach(q=>{if(!STATE.quests[q])STATE.quests[q]={step:0,done:false};});
    if(n>=3){STATE.quests.train={step:9,done:true};STATE.quests.spirits={step:9,done:true};STATE.quests.survive={step:9,done:true};STATE.quests.escort={step:9,done:true};STATE.quests.explore={step:9,done:true};}
    if(n>=6)STATE.quests.finger={step:9,done:true};if(n>=9){STATE.quests.house={step:9,done:true};STATE.quests.weasels={step:9,done:true};}
    const x=X(),keep={explained:x.explained,scored:x.scored,hsT:x.hsT,tableLog:x.tableLog};STATE.v6=Object.assign(freshX(),keep);const y=STATE.v6;
    y.session=n;for(let k=1;k<n;k++)y.wrapped[k]=1;y.day=({1:1,2:1,3:2,4:6,5:12,6:14,7:15,8:16,9:18})[n];y.sessStart[n]=statSnap();
    for(let d2=2;d2<=y.day;d2++)y.graves[d2]=ri(1,3);if(n>=9)y.dinnerDay=y.day+2;
    STATE.level=1;STATE.xp=0;}
  finally{V6_QUIET=false;}
  await levelTo(S_LVL[n]||1);PARTY_ORDER.forEach(refillPC);if(hasF("caster"))learnSecret("canine");
  const sp=S_SPOT[n];const c=nearestFree(sp[0],sp[1],sp[2])||{x:sp[1],y:sp[2]};
  await warp(sp[0],c.x,c.y,"down");toast("🎲 DM: Session "+n+(n===9?" (Between Sessions)":"")+" preset","gold");
  runScript(()=>openSessionCard(n));}
const DAY={
  roll:()=>{const x=X();delete x.roll[x.day];x.sched=null;return rollDay();},
  advance:()=>{advanceDay(1);},
  phase:()=>{const x=X();if(x.phase<3){x.phase++;x.phaseT=0;onPhase();}},
  trouble:()=>{if(STATE.map!=="village"){toast("Villagers walk up in the village square.");return false;}const d=pick(eligibleTroubles());if(!d){toast("No eligible villager troubles left.");return false;}return spawnTrouble(d);},
  call:()=>{const c=pick(eligibleCalls(true))||pick(eligibleCalls());if(!c){toast("No eligible party calls left.");return false;}if(SCRIPT.running)return runCall(c);runScript(()=>runCall(c));return true;},
  roamer:()=>{if(STATE.map!=="village"){toast("Night encounters come in from the moors around the village.");return false;}const x=X();x.phase=3;updateHUD();const r=rollDay().roamer||{n:8,att:roll("1d6+2").total};return spawnRoamer(r);},
  find:k=>{if(X().goFind){toast("Already looking for something.");return;}startGoFind(k||pick(["caster","goat"]));},
  invite:()=>{const x=X();x.dinnerDay=x.day;if(x.session>=9&&!hasF("dt_invite")){setF("dt_invite");setF("dt_inviteRead");qStep("dinner",1);toast("✉️ The dinner invitation arrives.","gold");}},
};
window.DAY=DAY;window.V6={applySessionPreset,sessionBreak,finalScore,showArcade,X:()=>X()};
{const _rd=renderDM;renderDM=function(){_rd();const x=X(),r=x.roll[x.day]||{};
  const add=document.createElement("div");
  add.innerHTML=`<h3>SESSIONS (v6)</h3><p class="sub" style="color:var(--dim)">Now: ${SESSIONS[x.session]?(SESSIONS[x.session].between?"Between Sessions":"Session "+x.session+" · "+esc(SESSIONS[x.session].title)):"?"} · ${sessCount(x.session).join("/")} tasks</p>
    ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="btn alt" data-sp="${n}">${n===9?"Between":"S"+n}</button>`).join("")}
    <div><button class="btn" id="dmWrap">✍ Wrap this session now</button></div>
    <h3>WICKERMOOR DAYS</h3><p class="sub" style="color:var(--dim)">Day ${x.day} · ${PHASES[x.phase].name} · clock ${Math.round(x.clockT)}s · roll: ${(r.troubles||[]).join(", ")||"—"} | calls: ${(r.calls||[]).join(", ")||"—"} | night: ${r.roamer?"d8 "+r.roamer.n+" (att "+r.roamer.att+")":"—"} | books: ${(r.books||[]).length}</p>
    <button class="btn alt" id="dmPhase">Advance time of day</button><button class="btn alt" id="dmDay">Next day (skip the night)</button><button class="btn alt" id="dmReroll">Reroll today's pools</button>
    <div><button class="btn alt" id="dmTrouble">Fire: villager walk-up</button><button class="btn alt" id="dmCall">Fire: party call</button><button class="btn alt" id="dmRoam">Fire: night encounter</button><button class="btn alt" id="dmFind">Fire: go-find (Caster/goat)</button></div>
    <button class="btn alt" id="dmInvite">Send the dinner invitation now</button>
    <h3>TABLE LOG</h3><p class="sub" style="color:var(--dim)">Jot what the table did tonight. It shows in the Quest Log until the next recap is built in.</p>
    <input id="dmLog" placeholder="e.g. Session 9: dinner, Phillip opened the Patrini book"><button class="btn alt" id="dmLogAdd">Add to the log</button>
    ${x.tableLog.map((t,i)=>`<div class="sub">• ${esc(t.t)} <a href="#" data-dl="${i}" style="color:var(--blood)">✕</a></div>`).join("")}
    <h3>SCORE</h3><button class="btn alt" id="dmArc">Open the arcade (preview)</button><button class="btn alt" id="dmHS">${DM.hsArm?"Really clear the board?":"Clear high scores"}</button>`;
  $("dm").appendChild(add);
  add.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>applySessionPreset(+b.dataset.sp));
  $("dmWrap").onclick=()=>{toggleDM();runScript(()=>sessionBreak(X().session));};
  $("dmPhase").onclick=()=>{DAY.phase();renderDM();};$("dmDay").onclick=()=>{DAY.advance();renderDM();};$("dmReroll").onclick=()=>{DAY.roll();toast("Today's pools rerolled");renderDM();};
  $("dmTrouble").onclick=()=>{toggleDM();DAY.trouble();};$("dmCall").onclick=()=>{toggleDM();DAY.call();};$("dmRoam").onclick=()=>{toggleDM();DAY.roamer();};$("dmFind").onclick=()=>{toggleDM();DAY.find();};
  $("dmInvite").onclick=()=>{DAY.invite();renderDM();};
  $("dmLogAdd").onclick=()=>{const t=$("dmLog").value.trim();if(!t)return;X().tableLog.push({t,s:X().session,d:new Date().toISOString().slice(0,10)});saveGame();toast("📓 Added to the Table Log");renderDM();};
  add.querySelectorAll("[data-dl]").forEach(a=>a.onclick=e=>{e.preventDefault();X().tableLog.splice(+a.dataset.dl,1);saveGame();renderDM();});
  $("dmArc").onclick=()=>{toggleDM();showArcade(null);};
  $("dmHS").onclick=()=>{if(!DM.hsArm){DM.hsArm=true;renderDM();return;}DM.hsArm=false;saveHS([]);toast("High scores cleared");renderDM();};};}
{const _ap=applyPreset;applyPreset=async function(k){V6_QUIET=true;try{await _ap(k);}finally{V6_QUIET=false;}const x=X();x.session=sessionFromFlags(STATE.flags);for(let n=1;n<x.session;n++)x.wrapped[n]=1;x.sessStart[x.session]=statSnap();updateHUD();};}

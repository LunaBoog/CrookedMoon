/* ================================ days.js (v6) ========================== *
 * WICKERMOOR DAYS. The campaign keeps real in-world time: long rests, the
 * Twilight Hour, "come back in a few days", "five-ish days back to town".
 * No 3-day limit: every long rest is a new day, forever.
 *  - Time of day: Twilight Hour → Afternoon → Dusk → Night (active play only;
 *    paused in dialog, menus, battles, minigames). Night lasts until you rest.
 *  - Each day rolls its pools ONCE (saved): villager troubles, party calls,
 *    tonight's Moors encounter, and the books for Eleanor.
 *  - An event clock fires them in rolled windows with a global cooldown. */
const PHASES=[{name:"Twilight Hour",icon:"🌅",dark:0,tint:"rgba(255,170,120,.05)"},{name:"Afternoon",icon:"☀",dark:0,tint:null},
  {name:"Dusk",icon:"🌇",dark:.16,tint:"rgba(255,120,60,.08)"},{name:"Night",icon:"🌙",dark:.40,tint:"rgba(30,50,130,.12)"}];
const PHASE_LEN=150; // seconds of active play per phase
const inWickermoor=()=>hasF("ch2");
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function seeded(seed){let s=seed>>>0||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}

/* ---------------------------------- days --------------------------------- */
function advanceDay(n){const x=X();n=n||1;x.day+=n;x.phase=0;x.phaseT=0;x.sched=null;x.clockT=0;x.fired={};x.cd=6;
  VISITORS.slice().forEach(v=>{if(v.kind!=="find")removeVisitor(v);});
  for(let i=0;i<n;i++)x.graves[x.day-i]=x.graves[x.day-i]||ri(1,3);
  clearBooks();updateHUD();}
function gravesCount(day){const x=X();let t=212;for(let d=2;d<=day;d++)t+=(x.graves[d]||0);return t;}
function eligibleTroubles(){const x=X(),n=x.session;return TROUBLES.filter(d=>!x.heardIds[d.id]&&n>=d.s[0]&&n<=d.s[1]&&(()=>{try{return d.need();}catch(e){return false;}})());}
function eligibleCalls(where){const x=X(),n=x.session;return CALLS.filter(c=>!x.callIds[c.id]&&n>=c.s[0]&&n<=c.s[1]&&(!where||whereOK(c.where))&&(()=>{try{return c.need();}catch(e){return false;}})()&&!(c.go&&x.goFind));}
function whereOK(w){const M=curMap();if(!M||M.id==="station")return false;
  if(w==="any")return true;if(w==="village")return M.id==="village";if(w==="train")return M.theme==="train";if(w==="house")return M.theme==="house";if(w==="woods")return M.theme==="woods"||M.theme==="yard";return false;}
function rollDay(){const x=X();if(x.roll[x.day])return x.roll[x.day];
  const r={troubles:[],calls:[],roamer:null,books:[]};
  if(x.session>=2)r.troubles=shuffle(eligibleTroubles()).slice(0,2).map(d=>d.id);
  r.calls=shuffle(eligibleCalls()).slice(0,2).map(c=>c.id);
  if(x.session>=2){let n;do{n=d(8);}while(!ROAMERS[n]);r.roamer={n,att:roll(ROAMERS[n].att).total};}
  if(hasF("metEleanor"))r.books=pickBookSpots(x.day);
  x.roll[x.day]=r;saveGame();return r;}
function ensureSched(){const x=X();if(x.sched&&x.sched.day===x.day)return x.sched;const r=rollDay();const R2=(a,b)=>Math.round(rnd(a,b));
  const ev=[];r.troubles.forEach((id,i)=>ev.push({k:"trouble",id,t:i===0?R2(30,75):R2(150,260)}));
  r.calls.forEach((id,i)=>ev.push({k:"call",id,t:i===0?R2(20,60):R2(130,240)}));
  if(r.roamer)ev.push({k:"roamer",id:"r"+r.roamer.n,night:true});
  x.sched={day:x.day,ev};placeBooks();return x.sched;}
function daysTick(dt){
  if(!STATE||!STATE.v6||!hasF("boarded"))return;const x=X();
  if(!canWalk()||WRAPPING)return;
  ensureSched();x.clockT+=dt;if(x.cd>0)x.cd-=dt;
  if(inWickermoor()&&x.phase<3){x.phaseT+=dt;if(x.phaseT>=PHASE_LEN){x.phase++;x.phaseT=0;onPhase();}}
  if(x.cd>0||VISITORS.some(v=>v.seek&&!v.gone))return;
  for(const ev of x.sched.ev){const key=ev.k+":"+ev.id+":"+x.day;if(x.fired[key])continue;
    if(ev.night?x.phase<3:x.clockT<ev.t)continue;
    if(tryFire(ev)){x.fired[key]=1;x.cd=18;break;}}
}
function onPhase(){const x=X(),P=PHASES[x.phase];updateHUD();
  const msg={1:"The day wears on in Wickermoor.",2:"Dusk. The clocktower tolls. Lamps come on in the square.",3:"Night. Things walk the moors in the darkest hours. (Rest at the Inn to end the day.)"}[x.phase];
  toast(P.icon+" "+P.name+" · "+msg,"ghost");if(x.phase===2)SFX.toll();
  if(x.phase>=2&&curMap().id==="village")runScript(()=>explainOnce("days"));}
function tryFire(ev){
  if(SCRIPT.running)return false;
  if(ev.k==="trouble"){if(STATE.map!=="village"||X().session<2)return false;
    let d=TROUBLES.find(q=>q.id===ev.id);if(!d||X().heardIds[d.id]){d=eligibleTroubles()[0];if(!d)return true;}
    return spawnTrouble(d);}
  if(ev.k==="call"){let c=CALLS.find(q=>q.id===ev.id);
    if(!c||X().callIds[c.id]||!whereOK(c.where)||!(()=>{try{return c.need();}catch(e){return false;}})()){const alt=shuffle(eligibleCalls(true));c=alt[0];if(!c)return false;}
    runScript(()=>runCall(c));return true;}
  if(ev.k==="roamer"){if(STATE.map!=="village")return false;const r=rollDay().roamer;if(!r)return true;return spawnRoamer(r);}
  return true;}

/* ---------------------------------- visitors ----------------------------- */
const VISITORS=[];
function spawnVisitor(o){const M=MAPS[o.map];const v=Object.assign({dir:"down",talk:"__vis",v6:true,t:0,st:.4,name:"",look:"villagerA"},o);
  v.rx=v.x*T;v.ry=v.y*T;v.hx=v.x;v.hy=v.y;M.npcs.push(v);VISITORS.push(v);if(STATE)STATE.talked[v.id]=1;return v;}
function removeVisitor(v){v.gone=true;const M=MAPS[v.map];const i=M.npcs.indexOf(v);if(i>=0)M.npcs.splice(i,1);const j=VISITORS.indexOf(v);if(j>=0)VISITORS.splice(j,1);}
function freeCell(map,x,y){const M=MAPS[map];if(x<0||y<0||x>=M.w||y>=M.h)return false;if(SOLID.has(M.grid[y][x]))return false;
  if(M.exits.some(e=>e.x===x&&e.y===y))return false;if(M.npcs.some(n=>vis(n)&&n.x===x&&n.y===y))return false;if(M.props.some(p=>vis(p)&&p.x===x&&p.y===y&&!p.walk))return false;
  if(map===STATE.map&&x===STATE.x&&y===STATE.y)return false;return true;}
function reachFrom(map,sx,sy){const M=MAPS[map],D={},q=[[sx,sy]];D[sx+","+sy]=0;
  while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+","+ny;if(k in D)continue;if(!freeCell(map,nx,ny))continue;D[k]=D[x+","+y]+1;q.push([nx,ny]);}}return D;}
function nearestFree(map,x,y){if(freeCell(map,x,y))return {x,y};for(let r=1;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(freeCell(map,x+dx,y+dy))return {x:x+dx,y:y+dy};}return null;}
function spawnSpot(minD,maxD){const D=reachFrom(STATE.map,STATE.x,STATE.y);const c=Object.keys(D).filter(k=>D[k]>=minD&&D[k]<=maxD);if(!c.length)return null;const [x,y]=pick(c).split(",").map(Number);return {x,y};}
function bfsStep(v,tx,ty){const M=curMap(),prev={},q=[[v.x,v.y]];prev[v.x+","+v.y]=null;let found=null;
  const pass=(x,y)=>x>=0&&y>=0&&x<M.w&&y<M.h&&!SOLID.has(M.grid[y][x])&&!M.exits.some(e=>e.x===x&&e.y===y)&&!M.props.some(p=>vis(p)&&p.x===x&&p.y===y&&!p.walk)&&!M.npcs.some(n=>n!==v&&vis(n)&&n.x===x&&n.y===y);
  let guard=0;while(q.length&&guard++<2500){const [x,y]=q.shift();if(Math.abs(x-tx)+Math.abs(y-ty)===1){found=[x,y];break;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+","+ny;if(k in prev)continue;if(nx===tx&&ny===ty)continue;if(!pass(nx,ny))continue;if(wallBetween(x,y,nx,ny))continue;prev[k]=[x,y];q.push([nx,ny]);}}
  if(!found)return null;let cur=found;while(prev[cur[0]+","+cur[1]]&&!(prev[cur[0]+","+cur[1]][0]===v.x&&prev[cur[0]+","+cur[1]][1]===v.y))cur=prev[cur[0]+","+cur[1]];
  if(cur[0]===v.x&&cur[1]===v.y)return null;return cur;}
function visitorsTick(dt){
  if(!STATE)return;
  VISITORS.slice().forEach(v=>{if(v.map!==STATE.map||v.gone)return;
    if(!canWalk())return;v.st-=dt;v.t+=dt;if(v.st>0)return;
    if(v.leaving){v.st=.3;if(v.t>2.4){removeVisitor(v);return;}const dist=(a,b)=>Math.abs(a-STATE.x)+Math.abs(b-STATE.y);
      const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[v.x+dx,v.y+dy]).filter(([a,b])=>freeCell(v.map,a,b)&&dist(a,b)>dist(v.x,v.y));
      if(opts.length){const s=pick(opts);v.dir=s[0]>v.x?"right":s[0]<v.x?"left":s[1]>v.y?"down":"up";v.x=s[0];v.y=s[1];}return;}
    if(v.seek){v.st=v.slow?.5:.32;
      if(Math.abs(v.x-STATE.x)+Math.abs(v.y-STATE.y)===1){if(!SCRIPT.running&&!P.moving){v.dir=STATE.x>v.x?"right":STATE.x<v.x?"left":STATE.y>v.y?"down":"up";runScript(()=>visTalk(v));}return;}
      if(v.t>50){v.seek=false;v.leaving=true;v.t=0;toast("🚶 "+(v.name||"They")+" gives up. They'll catch you another time.");requeue(v);return;}
      const s=bfsStep(v,STATE.x,STATE.y);if(s&&!(s[0]===STATE.x&&s[1]===STATE.y)){v.dir=s[0]>v.x?"right":s[0]<v.x?"left":s[1]>v.y?"down":"up";v.x=s[0];v.y=s[1];}return;}
    if(v.wanderR){v.st=rnd(1.2,2.6);const d2=pick([[1,0],[-1,0],[0,1],[0,-1]]);const nx=v.x+d2[0],ny=v.y+d2[1];if(Math.abs(nx-v.hx)<=v.wanderR&&Math.abs(ny-v.hy)<=v.wanderR&&freeCell(v.map,nx,ny)){v.x=nx;v.y=ny;v.dir=d2[0]>0?"right":d2[0]<0?"left":d2[1]>0?"down":"up";}}
  });
}
function requeue(v){const x=X();if(v.kind==="trouble"){delete x.heardIds[v.data.id];x.sched&&x.sched.ev.push({k:"trouble",id:v.data.id,t:x.clockT+90});}}
TALK.__vis=async(e)=>{await visTalk(e);};
async function visTalk(v){if(v.busy)return;v.busy=true;v.seek=false;
  try{if(v.kind==="trouble")await runTrouble(v);else if(v.kind==="roamer")await runRoamer(v);else if(v.kind==="find")await runFind(v);}
  finally{v.busy=false;if(v.kind!=="find"||!v.gone){v.leaving=true;v.t=0;}}}
{const _w=warp;warp=async function(map,x,y,dir,opt){
  VISITORS.slice().forEach(v=>{if(v.kind==="find")removeVisitor(v);else if(!v.busy){if(v.seek)requeue(v);removeVisitor(v);}});
  await _w(map,x,y,dir,opt);if(STATE&&STATE.v6){placeBooks();spawnFindIfHere();}};}

/* ---------------------------------- villager walk-ups -------------------- */
function spawnTrouble(d){const P=PERSONA[d.who];const s=spawnSpot(7,13)||spawnSpot(4,20);if(!s)return false;
  X().heardIds[d.id]=1;
  spawnVisitor({id:"v_"+d.id,kind:"trouble",map:STATE.map,x:s.x,y:s.y,look:P.look,name:P.name,seek:true,data:d,seekText:P.name+" wants a word"});
  toast("❗ "+P.name+" is heading your way…","gold");SFX.blip();return true;}
const LISTEN=["Mm-hm.","Keep listening…","Nod.","Let them finish.","I hear you.","Mm."];
async function runTrouble(v){const d=v.data,P=PERSONA[d.who],who=P.por||P.look,o={name:P.name,sub:P.sub};
  await explainOnce("walkup");
  for(let i=0;i<d.lines.length;i++){const canCut=d.lines.length>=3&&i<d.lines.length-1;
    const c=await ask(who,"\""+d.lines[i]+"\"",canCut?[LISTEN[i%LISTEN.length],"Cut in: \"Sorry, we've got a lot going on—\""]:[LISTEN[i%LISTEN.length]],o);
    if(c===1){X().cut++;await say(who,"\"Oh, YOU'VE got a lot going on? YOU?\" They storm off.",o);
      addStanding(P.fac,-1,"cut them off");await say(null,"💬 They didn't need you to fix anything. They needed you to listen for a minute. (−1 standing)");
      addNote("villager","🗣",P.name+" tried to tell us something. We cut them off.");return;}}
  await answerQ(who,o,d.ask,d.opts,{kind:"villager",fac:P.fac,label:P.name,id:d.id});
}
const hintsLeft=()=>3-(X().hints[X().session]||0);
const hintLabel=()=>(hasF("caster")?"🐕 Ask Caster — he's very wise":"🃏 Remember Adela's reading")+` (${hintsLeft()} left · −50 pts)`;
async function answerQ(who,o,q,opts,meta){const x=X();
  const order=shuffle(opts);let starred=false;let e;
  for(;;){const labels=order.map(z=>(starred&&z[1]===2?"★ ":"")+z[0]);const canHint=!starred&&hintsLeft()>0;if(canHint)labels.push(hintLabel());
    const c=await ask(who,meta.kind==="call"?q:"\""+q+"\"",labels,o);
    if(canHint&&c===order.length){x.hints[x.session]=(x.hints[x.session]||0)+1;starred=true;
      await say(hasF("caster")?"tessie":null,hasF("caster")?"Caster's ears go up. He looks, very pointedly, at one of the answers. (★)":"You remember Adela's reading. One answer feels right. (★)");continue;}
    e=order[c];break;}
  const sc=e[1];
  if(meta.kind==="villager"){x.heard++;if(sc===2)x.best++;addStanding(meta.fac,sc===2?2:sc===1?1:-1,meta.label,true);}
  else{x.calls++;if(sc===2)x.callsBest++;}
  if(e[3])try{e[3]();}catch(err){console.error(err);}
  await say(meta.kind==="call"?who:who,e[2],o);
  const verdict=sc===2?"✦ Nailed it.":sc===1?"Okay. Not the best, not the worst.":"Hm. That landed badly.";
  if(meta.kind==="villager"){toast((sc===2?"⭐ +2":sc===1?"+1":"−1")+" standing · "+FACTION_NAME[meta.fac],sc===2?"gold":sc===0?"bad":"");
    addNote("villager","🗣",`${meta.label}: "${q}" We said: ${e[0].replace(/^"|"$/g,"").slice(0,80)}`,{quiet:true});
    if(x.heard===1||sc<2)await say(null,"💬 "+verdict+" People mostly just want to be heard. Let them finish, answer the actual question, and be honest.");}
  else{toast("📣 "+verdict,sc===2?"gold":sc===0?"bad":"");addNote("call","📣",`${nameOf(who)} asked: "${q.slice(0,70)}${q.length>70?"…":""}" We said: ${e[0].slice(0,70)}`,{quiet:true});}
  if(x.heard>=5)badge("listener");if(x.callsBest>=6)badge("goodCall");
  SFX[sc===2?"ok":sc===1?"blip":"bad"]();return sc;}

/* ---------------------------------- party calls -------------------------- */
async function runCall(c){const x=X();x.callIds[c.id]=1;
  toast("📣 "+nameOf(c.who)+" pulls "+nameOf(LEAD())+" aside","ghost");SFX.blip();
  await explainOnce("partycall");
  const o={name:nameOf(c.who),sub:"party call · "+PARTY_DEF[c.who].cls};
  await answerQ(c.who,o,c.ask,c.opts,{kind:"call",id:c.id});
  if(c.go)startGoFind(c.go);
}

/* ---------------------------------- go find (no arrow, a hint) ----------- */
const HIDEOUTS={
  caster:[{x:8,y:25,hint:"He likes the smell of the bakery."},{x:5,y:21,hint:"He likes old stone and quiet. Churchy quiet."},{x:17,y:29,hint:"The well. Something down there says thank you. He likes that."},
          {x:19,y:13,hint:"Birds. He watches birds. Lots of birds, in a tower."},{x:16,y:25,hint:"The oak with all the faces. He listens to them."},{x:3,y:29,hint:"Horses. He likes horses. They don't like him."},{x:12,y:14,hint:"Old Rusty. Caster likes sad old people."}],
  goat:[{x:4,y:29,hint:"It was headed for the stables. Goats love stables."},{x:6,y:21,hint:"It was eating the flowers outside the church."},{x:16,y:28,hint:"It was drinking from the well. Or trying to."},
        {x:20,y:13,hint:"It was bleating at the pigeons in the aviary."},{x:21,y:36,hint:"It was headed toward the Taylor farm. Nobody's there to mind it."}],
};
function startGoFind(k){const H=pick(HIDEOUTS[k]);const c=nearestFree("village",H.x,H.y);if(!c)return;
  X().goFind={k,map:"village",x:c.x,y:c.y,hint:(k==="caster"?"Tessie: \"":"Azareth: \"")+H.hint+"\"",text:k==="caster"?"Find Caster (no arrow · follow the hint)":"Catch the baby goat (no arrow · follow the hint)"};
  if(k==="caster")X().casterAway=true;toast("🔍 "+X().goFind.text,"gold");spawnFindIfHere();updateHUD();}
function spawnFindIfHere(){const g=X().goFind;if(!g||STATE.map!==g.map||VISITORS.some(v=>v.kind==="find"))return;const c=nearestFree(g.map,g.x,g.y);if(!c)return;
  spawnVisitor({id:"find_"+g.k,kind:"find",map:g.map,x:c.x,y:c.y,look:g.k==="caster"?"caster":"goat",name:g.k==="caster"?"Caster":"The baby goat",seek:false,data:g,wanderR:g.k==="goat"?1:0});}
async function runFind(v){const x=X(),g=x.goFind;if(!g)return;
  if(g.k==="caster"){await say("tessie","\"CASTER.\" He's sitting there looking extremely wise, like he meant to be found exactly here, by exactly you. Tessie hugs him anyway.");
    x.casterFound++;x.casterAway=false;x.goFind=null;removeVisitor(v);addNote("find","🐕","Caster wandered off to be wise somewhere. We found him.");badge("goodBoy");SFX.item();}
  else{await say(null,"The baby goat. Bigger now. It bleats at you like you owe it money.");
    const c=await ask("azareth","Where does it go?",["Back to Jeremiah Stover's pen. He's owed a goat.","To the Mayor. The oak is still hungry.","Let it go on the moors. It's earned it.","Give it to Holly's girls. Everyone needs a goat."]);
    const out=[["Jeremiah stares at the goat, then at you. \"…Thank you. I won't tell the Mayor.\"","oldWays",2],["The Mayor beams. The goat does not. Sister Rain turns away when she hears.","oldWays",1],["It bounds off into the heather. Azareth waves. \"Goodbye, goat.\"","patientLady",1],["Lavender and Violet shriek with joy. Holly sighs and fetches a rope.","village",2]][c];
    await say(null,out[0]);addStanding(out[1],out[2],"the goat");if(c===1)addStanding("patientLady",-1,"the goat");
    x.goatFound=1;x.goFind=null;removeVisitor(v);addNote("find","🐐","We caught the baby goat from the ritual sack. "+["It went back to Jeremiah's pen.","We gave it to the Mayor.","We let it go on the moors.","Holly's girls have a goat now."][c]);badge("goatWhisperer");}
  updateHUD();}

/* ---------------------------------- night roamers (Moors table) ---------- */
function spawnRoamer(r){const R=ROAMERS[r.n];const s=spawnSpot(9,16)||spawnSpot(5,24);if(!s)return false;const A=attitudeOf(r.att);
  spawnVisitor({id:"roam_"+X().day,kind:"roamer",map:STATE.map,x:s.x,y:s.y,look:R.look,name:R.name,seek:!R.sight&&A!=="Indifferent",slow:A==="Friendly",wanderR:R.sight||A==="Indifferent"?2:0,data:r,seekText:"Something's out there on the moors"});
  toast("🌙 Something moves out on the moors…","bad");SFX.flap();return true;}
function attitudeModal(expr,total){return new Promise(res=>{const A=attitudeOf(total),col=A==="Hostile"?"var(--blood)":A==="Friendly"?"var(--ok)":"var(--gold)";
  const h=`<div style="text-align:center"><div class="sub">STARTING ATTITUDE · ${esc(expr)}</div><div id="attN" style="font-size:56px;font-weight:900;color:var(--moon)">?</div>
    <div id="attR" style="min-height:26px;font-size:18px;font-weight:900"></div><div class="sub">4 or lower Hostile · 5–8 Indifferent · 9 or higher Friendly</div>
    <div class="sub" style="margin-top:4px">Hostile doesn't mean it fights. It means it views you unfavorably.</div><button class="btn nav" id="attOk" disabled style="margin-top:8px">Continue</button></div>`;
  openModal("🎲 THE MOORS AT NIGHT","",h,navList());MODAL_CB=()=>res(A);SFX.dice();let n=0;const iv=setInterval(()=>{$("attN").textContent=ri(1,12);if(++n>12){clearInterval(iv);$("attN").textContent=total;$("attR").innerHTML=`<span style="color:${col}">${A.toUpperCase()}</span>`;const b=$("attOk");b.disabled=false;b.onclick=()=>closeModal();}},60);});}
async function runRoamer(v){const x=X(),r=v.data,R=ROAMERS[r.n];x.roamers++;x.metRoamerDay=x.day;
  await explainOnce("roamer");learnTerm("attitude");
  const mk=R.look.startsWith("mon:")?R.look.slice(4):null;if(mk){const key={Boogleswarm:"boogleswarm",Skitterswarm:"skitterswarm",Gobblegeist:"gobblegeist",Old_Ways_Chosen:"oldwayschosen"}[mk];if(key)seeMon(key);}
  await say(null,"🌙 MOORS ENCOUNTER (d8 → "+r.n+")\n"+R.text,{name:"The Moors at Night",sub:"Wickermoor Hollow: Encounters"});
  const A=await attitudeModal(R.att,r.att);
  const note=t=>addNote("roamer","🌙",t,{quiet:true});
  if(r.n===1){
    if(A==="Friendly"){const c=await ask(null,"A masked figure waves you up the hill. \"Guests of the Hollow! Eat!\"",["Eat a little, politely, and leave before the feast ends.","Sit and eat. All of it.","Decline and walk away."]);
      if(c===0){await say(null,"Bread, dark ale, a nod from a stag mask. You're gone before the end. You don't look back.");addStanding("oldWays",2,"the hilltop feast");}
      if(c===1){await say(null,"You stay too long. You see what happens after. You wish you hadn't.");addStanding("oldWays",1,"the hilltop feast");addStanding("patientLady",-1,"the hilltop feast");}
      if(c===2){await say(null,"The masks watch you go. Nobody follows.");}
      note("A masked Old Ways Chosen invited us to a hilltop feast on the moors.");}
    else if(A==="Indifferent"){const c=await ask(null,"Torches on a low hilltop. Masks. A long table. Nobody has noticed you.",["Watch from the dark, and learn what you can.","Leave quietly."]);
      if(c===0){await say(null,"The leader's mask never comes off. Everything it does, it does through the mask.");learnSecret("animalMask");}
      note("A ritual feast on a hilltop in the moors: an Old Ways Chosen and ten followers.");}
    else{const c=await ask(null,"The masks turn toward you, all at once. The chanting stops.",["Back away slowly. Hands where they can see them.","Stand your ground. (Intimidation)","Interrupt the ritual."]);
      if(c===1){const k=await check(LEAD(),"Persuasion",14);await say(null,k.ok?"They let you go. For now.":"They follow you, silent, all the way to the village edge.");}
      if(c===2){await say(null,"You charge the torches. The masks scatter into the heather, and whatever they meant to sacrifice tonight bolts past you into the dark.");addStanding("patientLady",2,"broke up a ritual");addStanding("oldWays",-2,"broke up a ritual");}
      if(c===0)await say(null,"Slowly. Slowly. The chanting starts again behind you.");
      note("Masks on the moors turned toward us. We got away.");}}
  if(r.n===2){
    if(A==="Hostile"){const c=await ask(null,"Two scouts level crossbows at you. \"Back off. We're tracking something.\"",["Hands up. Tell them you're staying at the Green Queen.","Offer Tessie's help tracking it.","\"Make us.\""]);
      if(c===0){await say(null,"The crossbows lower. \"Newcomers. Stay in town after dark.\"");addStanding("village",1,"the scouts");}
      if(c===1){const k=await check("tessie","Survival",12);await say("tessie",k.ok?"\"…It came from the west. Didn't eat what it killed.\" The scouts stare at her, then nod.":"\"Um. There are… tracks?\"");}
      if(c===2){await say(null,"They don't shoot. They just leave, and tell everyone at the Inn about you.");addStanding("village",-1,"the scouts");}}
    else{await say(null,"Two scouts crouch over the heather. \"Something took three sheep from Stover's field and didn't eat them.\"");
      const c=await ask("tessie","(Tessie looks at the tracks for a long time.)",["Tessie, help them.","Wish them luck and head home."]);
      if(c===0){const k=await check("tessie","Survival",12);await say("tessie",k.ok?"\"It's big. It went west. It isn't hungry. It's… something else.\"":"\"I lost it at the stream.\"");addStanding("oldWays",1,"helped the scouts");}}
    note("Two scouts on the moors, tracking whatever took Jeremiah's sheep.");}
  if(r.n===3){
    if(A==="Hostile"){await say(null,"The ground skitters toward you!");const res=await battle("skitter");if(res==="win"){note("A Skitterswarm from Skitterdeep Mine came at us out of the heather. We won.");x.roamersBeat=(x.roamersBeat||0)+1;}}
    else{const c=await ask(null,"A carpet of centipedes pours past, not interested in you, toward the cemetery road. They smell of sickness.",["Let them go. Watch where they're headed.","Attack them before they reach town."]);
      if(c===0){await say(null,"They go straight for the cemetery. Straight for the dead.");learnSecret("bodyBurrow");}
      else{const res=await battle("skitter");if(res==="win")x.roamersBeat=(x.roamersBeat||0)+1;}
      note("A Skitterswarm from Skitterdeep Mine skittered toward Maidenmist Cemetery.");}}
  if(r.n===5){
    if(A==="Hostile"){const opts=["Dive under the eaves (Stealth)","Stand your ground"];if(countItem("wickerstar"))opts.unshift("Hold up Oswick's wicker star");
      const c=await ask(null,"Wings the size of a barn. It circles lower. And lower. Something dead and goat-shaped dangles from its talons.",opts);const o=opts[c];
      if(o.startsWith("Hold")){await say(null,"You hold up the seven-pointed star. The gobblegeist BANKS HARD, shrieks, and beats away over the Howlers.");learnSecret("stars");badge("starCatcher");}
      else if(o.startsWith("Dive")){const k=await check(LEAD(),"Stealth",13);if(k.ok)await say(null,"You press into the shadow of the eaves. It passes over.");else{await say(null,"It stoops. Claws.");await trapDamage("2d6","slashing","DEX",13);}}
      else{await say(null,"It stoops on you like a hawk on a mouse.");await trapDamage("3d6","slashing","DEX",14);}}
    else if(A==="Indifferent")await say("azareth","It flies on toward the Howlers, the goat dangling.\n\"…Please do not be OUR goat.\"");
    else await say(null,"It lands on the church roof, folds its wings, and watches you with one yellow eye. Then it leaves. Almost politely.");
    note("A Gobblegeist flew over Wickermoor with a freshly killed goat.");}
  if(r.n===6){
    if(A==="Hostile"){const k=await check(LEAD(),"Persuasion",12);await say(null,k.ok?"\"BANDITS!\" yells the Tough Boss, and then, squinting: \"…oh. You're the train lot. Sorry.\"":"\"BANDITS!\" The cart rattles past at speed. Someone throws a turnip.");if(!k.ok)addStanding("village",-1,"the cart");}
    else if(A==="Indifferent")await say(null,"A cart rattles past with a dozen tired commoners. The Tough Boss nods. Nobody stops.");
    else{const c=await ask(null,"The Tough Boss pulls up. \"Evening! News from the road: Foxwillow's crows are bad this year. Need anything? I've got a spare potion, cheap.\"",["Buy a healing potion (30gp)","Just the news, thanks."]);
      if(c===0){if(STATE.gold>=30){addGold(-30);giveItem("potion",1);}else await say(null,"You can't cover it.");}}
    note("A cart on the moor road, to or from Wickermoor.");}
  if(r.n===8){
    const hasCake=countItem("honeycake")>0;
    if(A==="Hostile"){const opts=["Fight!"];if(hasCake)opts.unshift("Throw them a honey cake (Sweet Tooth)");
      const c=await ask(null,"Tiny giggling voices. \"TEEEETH.\" They smell Azareth's. All of them.",opts);
      if(opts[c].startsWith("Throw")){takeItem("honeycake");await say(null,"Sugar! The swarms go WILD for the cake and forget all about you.");learnSecret("sweetTooth");}
      else{const res=await battle("boogle");if(res==="win")x.roamersBeat=(x.roamersBeat||0)+1;}}
    else if(A==="Indifferent"){const opts=["Let Azareth keep her teeth. Walk away.","Swat them."];if(hasCake)opts.unshift("Toss them a honey cake");
      const c=await ask("azareth","They swirl around Azareth's mouth, sniffing.\n\"These are MY teeth.\"",opts);
      if(opts[c].startsWith("Toss")){takeItem("honeycake");await say(null,"They mob the cake and leave, humming.");learnSecret("sweetTooth");}
      else if(opts[c].startsWith("Swat")){const res=await battle("boogle");if(res==="win")x.roamersBeat=(x.roamersBeat||0)+1;}
      else await say(null,"Azareth clamps her jaw shut. They lose interest.");}
    else{const has=countItem("tooth")>0;const c=await ask(null,"Tiny voices, very polite: \"Trade? A tooth for a coin?\"",has?["Trade them a tooth.","No thanks."]:["No thanks. (You have no spare teeth. Azareth isn't sharing.)"]);
      if(has&&c===0){takeItem("tooth");addGold(4);await say(null,"They pay in tiny, sticky coins. Tooth faeries. Actual tooth faeries.");}}
    note("Two Boogleswarms came through town at night, searching for teeth.");}
  removeVisitor(v);
}

/* ---------------------------------- the morning card -------------------- */
async function openMorning(){const x=X(),S=SESSIONS[x.session],r=rollDay();
  await explainOnce("days");
  const T=sessTasks(x.session).filter(t=>!taskDone(t)&&!t.opt).slice(0,5);
  const prev=gravesCount(x.day-1),now=gravesCount(x.day);
  const around=[];
  if(r.troubles.length)around.push("Somebody in the square has been asking about you.");
  if(hasF("metEleanor"))around.push(`Eleanor's accord: ${r.books.length} lost book${r.books.length===1?"":"s"} somewhere around town, if you find them.`);
  if(hasF("rustyCem")||hasF("gotMap"))around.push(`Old Rusty counted ${now} graves at Maidenmist this morning. (${now-prev>0?"+"+(now-prev)+" overnight":"no change"}.)`);
  if(x.goFind)around.push(x.goFind.text+" · "+x.goFind.hint);
  DOWNTIME_MORNING(around);
  around.push("After Dusk comes Night. Things walk the moors in the darkest hours.");
  const h=`<div class="scard"><div class="sc-k">${PHASES[0].icon} DAY ${x.day} · THE TWILIGHT HOUR</div><div class="sc-t" style="font-size:20px">Morning in Wickermoor</div>
    <div class="sc-d">${S&&S.between?"Between Sessions":"Session "+x.session+" · "+esc(S?S.title:"")}</div>
    ${T.length?`<p class="doc-k">Today's list:</p><ol class="doc-l">${T.map(t=>`<li>${esc(typeof t.label==="function"?t.label():t.label)} <span class="sub">— ${esc(t.from||"")}</span></li>`).join("")}</ol>`:""}
    <p class="doc-k">Around town:</p><ul class="doc-l">${around.map(a=>`<li>${esc(a)}</li>`).join("")}</ul>
    <button class="btn nav" id="mnGo">☀ Get up</button></div>`;
  await new Promise(res=>{openModal("🌅 GOOD MORNING","Day "+x.day,h,navList());MODAL_CB=()=>res();$("mnGo").onclick=()=>closeModal();});
}
{const _rp=restParty;restParty=async function(kind,where,quiet){const x=X(),before=x.session;
  const wasNight=x.metRoamerDay===x.day;advanceDay(1);if(wasNight){x.nightsSurvived++;if(x.nightsSurvived>=3)badge("nightOwl");}
  await _rp(kind,where,quiet);
  if(where==="inn"&&!quiet&&inWickermoor()&&X().session===before)await openMorning();};}

/* ---------------------------------- books for Eleanor -------------------- */
function bookCandidates(map){const M=MAPS[map];const out=[];const st=M.start||{x:1,y:1};const D=reachFrom(map,st.x,st.y);
  for(const k in D){const [x,y]=k.split(",").map(Number);if(map==="village"&&(y>37||y<9))continue;
    const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>{const yy=y+dy,xx=x+dx;return yy<0||xx<0||yy>=M.h||xx>=M.w||SOLID.has(M.grid[yy][xx]);}).length;
    if(nb>=1&&!(st.x===x&&st.y===y))out.push({map,x,y});}
  return out;}
function pickBookSpots(day){const rnd2=seeded(day*7919+13);const maps=BOOK_MAPS.slice().sort(()=>rnd2()-.5).slice(0,3);
  return maps.map((m,i)=>{const c=bookCandidates(m);if(!c.length)return null;const s=c[Math.floor(rnd2()*c.length)];return {map:s.map,x:s.x,y:s.y,title:BOOK_TITLES[Math.floor(rnd2()*BOOK_TITLES.length)],i};}).filter(Boolean);}
function clearBooks(){for(const m in MAPS){const M=MAPS[m];for(let i=M.props.length-1;i>=0;i--)if(M.props[i].v6book)M.props.splice(i,1);}}
function placeBooks(){if(!STATE||!STATE.v6)return;const x=X();clearBooks();const r=x.roll[x.day];if(!r||!r.books)return;const got=x.booksDay[x.day]||[];
  r.books.forEach(b=>{if(got.includes(b.i))return;const M=MAPS[b.map];if(!M||!freeCell(b.map,b.x,b.y))return;
    M.props.push({id:"book_"+x.day+"_"+b.i,x:b.x,y:b.y,art:"book",name:"A lost book",talk:"__book",v6book:true,book:b,walk:false});});}
TALK.__book=async(p)=>{const x=X(),b=p.book;x.booksDay[x.day]=(x.booksDay[x.day]||[]).concat([b.i]);x.bookBag=(x.bookBag||0)+1;
  const M=curMap();const i=M.props.indexOf(p);if(i>=0)M.props.splice(i,1);SFX.item();
  await say("poppi",`A book, dropped and forgotten: "${b.title}".\nPoppi hugs it. "Eleanor will want this."`);
  toast("📚 Book for Eleanor ("+x.bookBag+" carried)","gold");await explainOnce("books");};
{const _dp=drawProp;drawProp=function(c,p,t){if(p.art==="book"){const x=p.x*T,y=p.y*T;px(c,x+6,y+10,12,9,"#6a2a2a");px(c,x+7,y+11,10,7,"#8a3a3a");px(c,x+6,y+17,12,2,"#e8dcc0");
  const g=.5+.5*Math.sin(t/260+p.x);c.fillStyle=`rgba(241,220,160,${g})`;c.fillRect(x+16,y+6,2,2);return;}_dp(c,p,t);};}

/* ---------------------------------- drawing hooks ------------------------ */
{const _dl=drawLighting;drawLighting=function(M,t){if(M.id==="village"&&STATE&&STATE.v6){const ph=PHASES[X().phase]||PHASES[0];const base=M.dark||0;M.dark=Math.min(.8,base+ph.dark);try{_dl(M,t);}finally{M.dark=base;}
  if(ph.tint){ctx.fillStyle=ph.tint;ctx.fillRect(0,0,VW,VH);}}else _dl(M,t);};}
{const _dw=drawWorld;drawWorld=function(t){const away=STATE&&STATE.v6&&STATE.v6.casterAway&&STATE.flags.caster;if(away)delete STATE.flags.caster;
  try{_dw(t);}finally{if(away)STATE.flags.caster=1;}
  // "!" over walk-ups, "?" near a go-find target, 🌙 over roamers
  VISITORS.forEach(v=>{if(v.map!==STATE.map||v.gone)return;const sx=(v.rx+12-CAM.x)*CAM.z,sy=(v.ry-14-CAM.y)*CAM.z;
    let ch=null;if(v.kind==="trouble"&&v.seek)ch="!";else if(v.kind==="roamer")ch="☾";else if(v.kind==="find"&&Math.abs(v.x-STATE.x)+Math.abs(v.y-STATE.y)<=4)ch="?";
    if(!ch)return;const b=Math.sin(t/160)*2;ctx.fillStyle="rgba(10,8,20,.9)";ctx.fillRect(sx-7,sy-9+b,14,13);ctx.strokeStyle=ch==="☾"?"#9fb0ff":"#ffce3a";ctx.strokeRect(sx-6.5,sy-8.5+b,13,12);
    ctx.fillStyle=ch==="☾"?"#9fb0ff":"#ffce3a";ctx.font="bold 10px monospace";ctx.textAlign="center";ctx.fillText(ch,sx,sy+1+b);ctx.textAlign="left";});};}

/* ---------------------------------- the per-frame driver ---------------- */
let V6_LAST=performance.now();
{const _lp=loop;loop=function(t){_lp(t);const dt=Math.min(.05,(t-V6_LAST)/1000);V6_LAST=t;
  if(!STATE||!STATE.v6||$("title").style.display!=="none"||BATTLE.on)return;
  try{sessionTick(dt);daysTick(dt);visitorsTick(dt);}catch(e){console.error(e);}};}

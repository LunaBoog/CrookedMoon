/* ================================= game.js ============================= */
LOOK.caster={kind:"dog",ghost:true};LOOK.supplicant={kind:"supplicant"};
KEYITEMS.grass={name:"Handful of Wet Grass",icon:"🌿",desc:"What's green will grow."};
const SOLID=new Set("#tfG~RBS=TcbFOKPAHMnasrkCoVWLZYh".split(""));
const STAGE={train:null};

/* ---------------------------------- state -------------------------------- */
let STATE=null;
function freshState(lead){
  const s={v:1,map:"station",x:3,y:6,dir:"right",lead:lead||"krodha",gold:10,xp:0,level:1,flags:{},keys:{},items:{potion:2},
    pcs:{},quests:{},seen:{},defeated:{},secrets:{},lore:{},badges:{},roamDead:{},talked:{},inspected:{},visited:{},
    stats:{battles:0,wins:0,kos:0,crits:0,nat20:0,nat1:0,dmg:0,steps:0,time:0,locks:0,dice:0},
    restPoint:{map:"station",x:3,y:6},fast:false,noFollow:false,started:Date.now()};
  PARTY_ORDER.forEach(id=>{s.pcs[id]={hp:PARTY_DEF[id].hp[0],slots:0,ki:0,sp:0,ammo:10,used:{}};});
  return s;
}
function refillPC(id){const s=pcStat(id),p=STATE.pcs[id];p.hp=s.hpMax;p.slots=s.slotsMax;p.ki=s.kiMax;p.sp=s.spMax;p.ammo=10;p.used={};}
function pcStat(id){
  const D=PARTY_DEF[id],L=STATE?STATE.level:1;let ac=D.ac,atkB=0,dmgB=0,slots=D.slots?D.slots[L-1]:0;
  for(const g in GEAR)if(GEAR[g].who===id&&hasF(g)){ac+=GEAR[g].ac||0;atkB+=GEAR[g].atk||0;dmgB+=GEAR[g].dmg||0;slots+=GEAR[g].slots||0;}
  if(id==="lucky"&&hasF("tarot_lucky"))atkB++;if(id==="azareth"&&hasF("tarot_azareth"))slots++;if((id==="tessie"&&hasF("tarot_tessie"))||(id==="krodha"&&hasF("tarot_krodha")))ac++;
  return {level:L,hpMax:D.hp[L-1],ac,atk:5,atkBonus:atkB,dmgBonus:dmgB,slotsMax:slots,kiMax:id==="krodha"?Math.max(2,L):0,spMax:id==="poppi"&&L>=2?L:0,sneak:L<3?"1d6":L<5?"2d6":"3d6"};
}
function abilUnlocked(id,a){const A=ABIL[a];if(!A)return false;if(A.lvl&&STATE.level<A.lvl)return false;if(A.need&&!hasF(A.need))return false;return true;}
const hasF=f=>!!(STATE&&STATE.flags[f]);
function setF(f){STATE.flags[f]=1;}
function clrF(f){delete STATE.flags[f];}
const hasKey=k=>(STATE.keys[k]||0)>0;
function giveKey(k){STATE.keys[k]=(STATE.keys[k]||0)+1;const it=KEYITEMS[k];if(it)toast(it.icon+" "+it.name,"gold");SFX.item();}
function takeKey(k){if(STATE.keys[k])STATE.keys[k]--;}
const countItem=k=>STATE.items[k]||0;
function giveItem(k,n){STATE.items[k]=(STATE.items[k]||0)+(n||1);const it=ITEMS[k];if(it)toast(`${it.icon} ${it.name}${n>1?" ×"+n:""}`,"gold");}
function takeItem(k){if(STATE.items[k])STATE.items[k]--;}
function addGold(n){STATE.gold=Math.max(0,STATE.gold+n);if(n>0){toast("🪙 +"+n+" gp","gold");SFX.coin();}updateHUD();}
function qStart(q){if(!STATE.quests[q]){STATE.quests[q]={step:0,done:false};toast("📜 New quest: "+QUESTS[q].name,"ghost");}}
function qStep(q,n){qStart(q);const s=STATE.quests[q];if(n>s.step)s.step=n;}
function qDone(q){qStart(q);STATE.quests[q].done=true;STATE.quests[q].step=QUESTS[q].steps.length;toast("✓ Quest complete: "+QUESTS[q].name,"gold");}
const qState=q=>STATE.quests[q];
function seeMon(k){if(!STATE.seen[k]){STATE.seen[k]=1;}}
function learnSecret(s){if(!SECRETS[s]||STATE.secrets[s])return;STATE.secrets[s]=1;toast("🔑 SECRET learned: "+SECRETS[s].name+" ("+SECRETS[s].of+")","ghost");SFX.magic();}
function seeNpcPortrait(){} // portraits come from the art pack; nothing to unlock
function moveNpc(id){const m=curMap();const n=m.npcs.find(e=>e.id===id);if(n)n.gone=true;}
function healPC(id,n){const p=STATE.pcs[id];p.hp=Math.min(pcStat(id).hpMax,p.hp+n);}
function healParty(frac){PARTY_ORDER.forEach(id=>healPC(id,Math.ceil(pcStat(id).hpMax*frac)));SFX.heal();}
function addXP(n,quiet){const before=STATE.level;STATE.xp+=n;let lv=1;for(let i=0;i<5;i++)if(STATE.xp>=LEVEL_XP[i])lv=i+1;lv=Math.min(5,lv);
  if(!quiet)toast("✦ +"+n+" XP","ghost");
  if(lv>before){applyLevel(lv);if(!quiet)levelUpFanfare();return true;}return false;}
function applyLevel(lv){const old=STATE.level;STATE.level=lv;PARTY_ORDER.forEach(id=>{const p=STATE.pcs[id];const s=pcStat(id);p.hp=Math.min(s.hpMax,p.hp+(PARTY_DEF[id].hp[lv-1]-PARTY_DEF[id].hp[old-1]));p.slots=s.slotsMax;p.ki=s.kiMax;p.sp=s.spMax;});}
async function levelTo(n,line){if(STATE.level>=n)return;STATE.xp=Math.max(STATE.xp,LEVEL_XP[n-1]);applyLevel(n);PARTY_ORDER.forEach(refillPC);if(line)await say(null,line);await levelUpFanfare();}
async function levelUpFanfare(){
  SFX.level();const L=STATE.level;
  const newAb=[];PARTY_ORDER.forEach(id=>PARTY_DEF[id].abil.forEach(a=>{if(ABIL[a].lvl===L&&(!ABIL[a].need||hasF(ABIL[a].need)))newAb.push(nameOf(id)+": "+ABIL[a].name);}));
  let h=`<div style="text-align:center"><div style="font-size:40px;font-weight:900;color:var(--moon)">LEVEL ${L}</div><div class="grid2" style="margin-top:10px">`;
  PARTY_ORDER.forEach(id=>{const s=pcStat(id);h+=`<div class="card"><h4>${esc(nameOf(id))}</h4><div class="sub">HP ${s.hpMax} · AC ${s.ac}${s.slotsMax?" · "+s.slotsMax+" slots":""}${s.kiMax?" · "+s.kiMax+" ki":""}${id==="lucky"?" · Sneak "+s.sneak:""}</div></div>`;});
  h+=`</div>${newAb.length?`<p style="color:var(--ghost)">New: ${esc(newAb.join(" · "))}</p>`:""}<button class="btn nav" onclick="closeModal()">Onward</button></div>`;
  await modalAwait("✦ LEVEL UP ✦","Everyone is fully restored",h,navList());
}
/* after modalAwait is called its body is set — fix ordering */
async function modalHTML(title,tag,html){const p=modalAwait(title,tag,html,navList());return p;}
async function restParty(kind,where,quiet){
  if(!quiet){await fadeTo(1,500);}
  PARTY_ORDER.forEach(refillPC);STATE.roamDead={};
  if(hasF("goodberry"))STATE.items.goodberry=Math.max(STATE.items.goodberry||0,5);
  if(where)STATE.restPoint={map:STATE.map,x:STATE.x,y:STATE.y};
  saveGame();
  if(!quiet){await sleep(300);await fadeTo(0,500);toast("🛏 Long rest — fully restored. (Game saved)","ghost");SFX.heal();
    if(where==="inn"&&!hasF("innNight1")&&hasF("ch2")){setF("innNight1");
      await say("azareth","Azareth has a nightmare. The apocalypse, again. She goes downstairs to listen to Lucky play music and revel. He's been festive for four hours minimum.");}}
}
async function trapDamage(dice,type,stat,dc){for(const id of PARTY_ORDER){const nat=d(20);const ok=nat+(SAVES[id][stat]||0)>=dc;let n=roll(dice).total;if(ok)n=Math.floor(n/2);STATE.pcs[id].hp=Math.max(0,STATE.pcs[id].hp-n);}
  shake(10);SFX.hit();PARTY_ORDER.forEach(id=>{if(STATE.pcs[id].hp<=0)STATE.pcs[id].hp=1;});updateHUD();toast("The trap hits the party!","bad");}
const LEAD=()=>STATE.lead;

/* ---------------------------------- map helpers --------------------------- */
const curMap=()=>MAPS[STATE?STATE.map:"station"];
function vis(e){if(e.gone)return false;if(e.hide&&hasF(e.hide))return false;if(e.need&&!hasF(e.need))return false;if(e.hide&&e.hide.startsWith("jar")&&hasF(e.hide))return false;return true;}
function npcAt(x,y){return curMap().npcs.find(n=>vis(n)&&n.x===x&&n.y===y);}
function propAt(x,y){return curMap().props.find(p=>vis(p)&&p.x===x&&p.y===y);}
function exitAt(x,y){return curMap().exits.find(e=>e.x===x&&e.y===y);}
function roamAt(x,y){return ROAM.find(r=>!r.dead&&r.x===x&&r.y===y);}
function wallBetween(ax,ay,bx,by){const m=curMap();for(const w of m.walls){const [k,a,b,c2]=w.split(" ");const A=+a,Bv=+b,C=+c2;
  if(k==="v"&&ay===by&&Math.max(ax,bx)===A&&Math.min(ax,bx)===A-1&&ay>=Bv&&ay<=C)return true;
  if(k==="h"&&ax===bx&&Math.max(ay,by)===A&&Math.min(ay,by)===A-1&&ax>=Bv&&ax<=C)return true;}return false;}
function cellSolid(x,y){const m=curMap();if(x<0||y<0||x>=m.w||y>=m.h)return true;if(exitAt(x,y))return false;return SOLID.has(m.grid[y][x]);}
function blockedFor(x,y,fx,fy){if(cellSolid(x,y))return true;if(wallBetween(fx,fy,x,y))return true;if(npcAt(x,y))return true;const p=propAt(x,y);if(p&&!p.walk)return true;return false;}

/* ---------------------------------- warp ---------------------------------- */
async function warp(map,x,y,dir,opt){
  opt=opt||{};
  if(!MAPS[map]){console.warn("no map",map);return;}
  if(!opt.noFade)await fadeTo(1,280);
  STATE.map=map;STATE.x=x;STATE.y=y;STATE.dir=dir||STATE.dir;
  P.rx=x*T;P.ry=y*T;P.moving=false;resetTrail();initMap();
  const M=curMap();STATE.visited[map]=1;updateHUD();
  if(!opt.noCheckpoint)STATE.restPoint={map,x,y};
  if(map==="darkwood"&&!hasF("walkRest")){setF("walkRest");healParty(.6);toast("The long walk — the party catches its breath (+60% HP)","ghost");}
  playSong(M.music||"village");
  if(opt.banner)banner(opt.banner[0],opt.banner[1]);else banner(M.sub||"",M.name);
  saveGame();
  if(!opt.noFade)await fadeTo(0,280);
}
/* ---------------------------------- player & party ----------------------- */
const P={rx:0,ry:0,moving:false,fx:0,fy:0,tx:0,ty:0,t:0,frame:0};
let TRAIL=[];
function resetTrail(){TRAIL=[];for(let i=0;i<5;i++)TRAIL.push({x:STATE.x,y:STATE.y,dir:STATE.dir,px:STATE.x*T,py:STATE.y*T});}
const MOVE_MS=150;
function tryMove(dir){
  if(P.moving)return;
  const dv={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];STATE.dir=dir;
  const nx=STATE.x+dv[0],ny=STATE.y+dv[1];
  const r=roamAt(nx,ny);if(r){startRoamBattle(r);return;}
  const ex=exitAt(nx,ny);
  if(ex&&!wallBetween(STATE.x,STATE.y,nx,ny)){
    if(ex.need&&!hasF(ex.need)){if(ex.hidden&&!ex.lock)return;SFX.bump();shake(2);if(ex.lock)runScript(()=>say(null,ex.lock));return;}
    SFX.door();runScript(async()=>{if(ex.event&&EVENTS[ex.event]){const go=await EVENTS[ex.event](ex);if(!go)return;}if(ex.to)await warp(ex.to,ex.tx,ex.ty,ex.dir);});return;}
  if(blockedFor(nx,ny,STATE.x,STATE.y)){if(!P.bumpT||performance.now()-P.bumpT>300){SFX.bump();P.bumpT=performance.now();}return;}
  P.moving=true;P.fx=STATE.x;P.fy=STATE.y;P.tx=nx;P.ty=ny;P.t=0;
  TRAIL.unshift({x:STATE.x,y:STATE.y,dir});TRAIL.length=5;
  STATE.x=nx;STATE.y=ny;STATE.stats.steps++;if(STATE.stats.steps%2===0)SFX.step();
}
function updateMove(dt){
  if(P.moving){P.t+=dt*1000;const k=Math.min(1,P.t/MOVE_MS);P.rx=lerp(P.fx,P.tx,k)*T;P.ry=lerp(P.fy,P.ty,k)*T;
    if(k>=1){P.moving=false;P.frame++;onArrive();if(P.queued&&canWalk()){const q=P.queued;P.queued=null;tryMove(q);}}}
  else{P.rx=STATE.x*T;P.ry=STATE.y*T;}
  if(!P.moving&&canWalk()){const d2=KEY.up?"up":KEY.down?"down":KEY.left?"left":KEY.right?"right":null;if(d2)tryMove(d2);}
}
function canWalk(){return !DLG_OPEN&&!MODAL&&!INPUT_LOCK&&!BATTLE.on&&!SCRIPT.running&&!HANDLERS.length&&$("title").style.display==="none"&&$("minigame").style.display!=="flex";}
function onArrive(){
  // roaming monsters: contact check
  for(const r of ROAM){if(!r.dead&&Math.abs(r.x-STATE.x)+Math.abs(r.y-STATE.y)===0){startRoamBattle(r);return;}}
  const p=propAt(STATE.x,STATE.y);if(p&&p.walk&&p.talk)interactWith(p);
}
/* ---------------------------------- scripts ------------------------------ */
const SCRIPT={running:false};
async function runScript(fn){if(SCRIPT.running)return;SCRIPT.running=true;try{await fn();}catch(e){console.error(e);}finally{SCRIPT.running=false;updateHUD();}}
function facedCell(){const dv={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[STATE.dir];return [STATE.x+dv[0],STATE.y+dv[1]];}
function facedEntity(){const [x,y]=facedCell();const r=roamAt(x,y);if(r)return {type:"roam",e:r};const n=npcAt(x,y);if(n)return {type:"npc",e:n};const p=propAt(x,y);if(p)return {type:"prop",e:p};
  // big props that cover a noDraw cell
  return null;}
function interact(){
  const f=facedEntity();if(!f)return;
  if(f.type==="roam"){startRoamBattle(f.e);return;}
  const e=f.e;
  if(f.type==="npc"){const opp={up:"down",down:"up",left:"right",right:"left"}[STATE.dir];e.dir=opp;STATE.talked[e.id]=1;}
  else STATE.inspected[curMap().id+":"+e.id]=1;
  interactWith(e);
}
function interactWith(e){
  const fn=TALK[e.talk];
  if(!fn){runScript(()=>say(null,e.name?`${e.name}.`:"Nothing interesting."));return;}
  runScript(()=>fn(e));
}
/* ---------------------------------- roaming monsters --------------------- */
let ROAM=[];
function initMap(){
  const M=curMap();ROAM=[];
  (M.roam||[]).forEach(r=>{if(STATE.roamDead[r.id])return;if(r.need&&!hasF(r.need))return;ROAM.push({...r,hx:r.x,hy:r.y,rx:r.x*T,ry:r.y*T,cd:rnd(.5,1.5)});});
  M.npcs.forEach(n=>{n.hx=n.hx??n.x;n.hy=n.hy??n.y;n.rx=n.x*T;n.ry=n.y*T;n.wt=rnd(1,4);});
  initAmbient();
}
function startRoamBattle(r){
  if(SCRIPT.running)return;r.dead=true;
  runScript(async()=>{const res=await battle(r.enc);if(res==="win"){STATE.roamDead[r.id]=1;}else if(res==="flee"){r.dead=false;r.x=r.hx;r.y=r.hy;r.rx=r.x*T;r.ry=r.y*T;r.cd=3;}});
}
function updateRoam(dt){
  if(!canWalk())return;
  ROAM.forEach(r=>{if(r.dead)return;r.rx=lerp(r.rx,r.x*T,Math.min(1,dt*10));r.ry=lerp(r.ry,r.y*T,Math.min(1,dt*10));
    r.cd-=dt;if(r.cd>0)return;r.cd=rnd(.55,.95);
    const dx=STATE.x-r.x,dy=STATE.y-r.y,dist=Math.abs(dx)+Math.abs(dy);
    let nx=r.x,ny=r.y;
    if(dist<=5){if(Math.abs(dx)>Math.abs(dy))nx+=Math.sign(dx);else ny+=Math.sign(dy);r.aggro=true;}
    else{r.aggro=false;const d2=pick([[1,0],[-1,0],[0,1],[0,-1],[0,0]]);nx+=d2[0];ny+=d2[1];if(Math.abs(nx-r.hx)>3||Math.abs(ny-r.hy)>3)return;}
    if(nx===STATE.x&&ny===STATE.y){startRoamBattle(r);return;}
    if(cellSolid(nx,ny)||npcAt(nx,ny)||propAt(nx,ny)||exitAt(nx,ny)||ROAM.some(o=>o!==r&&!o.dead&&o.x===nx&&o.y===ny))return;
    r.x=nx;r.y=ny;});
}
function updateNpcs(dt){
  const M=curMap();
  M.npcs.forEach(n=>{n.rx=lerp(n.rx??n.x*T,n.x*T,Math.min(1,dt*9));n.ry=lerp(n.ry??n.y*T,n.y*T,Math.min(1,dt*9));
    if(!n.wander||!vis(n)||!canWalk())return;n.wt-=dt;if(n.wt>0)return;n.wt=rnd(1.5,4.5);
    const d2=pick([[1,0],[-1,0],[0,1],[0,-1]]);const nx=n.x+d2[0],ny=n.y+d2[1];
    if(Math.abs(nx-n.hx)>n.wander||Math.abs(ny-n.hy)>n.wander)return;
    if(cellSolid(nx,ny)||exitAt(nx,ny)||npcAt(nx,ny)||propAt(nx,ny)||(nx===STATE.x&&ny===STATE.y)||TRAIL.slice(0,4).some(t=>t.x===nx&&t.y===ny))return;
    n.x=nx;n.y=ny;n.dir=d2[0]>0?"right":d2[0]<0?"left":d2[1]>0?"down":"up";});
}
/* ---------------------------------- objective ---------------------------- */
function ent(map,id){return {map,id};}
function nearestJar(){for(let i=1;i<=8;i++)if(!hasF("jar"+i))return ent("wreckage","jar"+i);return null;}
function objective(){
  if(!STATE)return null;
  const H=hasF;
  const L=[
    [!H("boarded"),"Find out where your ticket leads","Wait on the platform for the train.",hasKey("ticket")?ent("station","edge"):ent("station","booth")],
    [!H("shroudDone"),"Deal with the crooked-necked passenger","The Vagrant asked nicely.",ent("car_passenger","crookedpass")],
    [!H("harlequinDealt"),"Walk the train, car to car → the Circus Car","Help spirits with unfinished business ("+spiritsFreed()+"/6)",ent("car_circus","harlequin")],
    [!H("trainCrash"),"Enter the furnace car","The Vagrant waits by the soul furnace.",ent("car_tender","furnace")],
    [!H("jarQuest"),"Talk to the Vagrant","He's tearing at the vines on the wreck.",ent("wreckage","vagrantW")],
    [!H("jarsDone"),"Collect soul-flame jars ("+jarCount()+"/6)","They glow green in the trees.",nearestJar()],
    [!H("locoDefeated"),"Pour the jars into the Locomotive","…and stand well back.",ent("wreckage","engine")],
    [!H("druskReward"),"Talk to Phillip Druskenvald","He owes you. He knows it.",ent("wreckage","phillipW")],
    [!H("arrived"),"Walk through the woods to Wickermoor","North, past the tall pine.",{map:"founders"}],
    [!H("ritualTalked"),"Stop the wolves at the Founder's Round","Something is staked by the oak.",ent("founders","goat")],
    [!H("boardRead"),"Read the Community Board","In the village square, by the faceless statue.",ent("village","board")],
    [!H("metSolomon"),"Ask the Mason about the marble finger","Roderick Masonry — north-east, by the stone pile.",ent("mason","solomon")],
    [!hasKey("finger")&&!H("fingerReturned"),"Get the marble finger from the Constable","The Constabulary, north of the square.",ent("constab","doris")],
    [!H("fingerIdentified"),"Show the finger to Solomon","He'll know which statue it came from.",ent("mason","solomon")],
    [!H("fingerReturned"),"Return the finger to the Brightsinger church","The ruined church, west side.",ent("church","weston")],
    [!hasKey("hexbag")&&!H("hexMorgan")&&!H("hexDestroyed"),"Search the Taylor Farm","South-east edge of town. Check the porch.",ent("village","porch")],
    [!H("hexMorgan"),"Show the Hex Bag to Morgan","The Apothecary, west of the square.",ent("apoth","morgan")],
    [!H("hexKnown"),"Ask the Antiquarian about the Hex Bag","The Antique Bookstore.",ent("books","eleanor")],
    [!H("hildaGuide"),"Find Hilda at the Inn","She found Ed Hardy's body.",ent("inn","hilda")],
    [!H("wytchwoodIn"),"Meet Hilda at the Wytchwood's edge","North path out of the village.",ent("village","hildaV")],
    [!H("bodySeen"),"Look where the body was found","Hilda's showing you.",ent("wytchwood","bodysite")],
    [!H("campFound"),"Follow the freshest tracks","North-east, through the archway.",ent("wytchwood","camp")],
    [!H("riverCrossed"),"Go deeper — east","Something skitters in the underbrush.",{map:"marsh"}],
    [!H("marshHaintDone"),"Cross the Marsh of Hunger","Footsteps behind you…",ent("marsh","haintM")],
    [!H("gateOpen"),"Reach the iron gate","South-east, past the ancient graves.",ent("marsh","gate")],
    [!H("handOpen"),"Solve the Chapel of the Hands","Three bowls. One inscription.",ent("chapel","hand")],
    [!H("handtakerDone"),"Descend. Find what the handless pray to.","Crossroads — take the left path.",ent("temple","boss")],
    [!H("reportedDoris"),"Report back to Constable Doris","The Dead Man mystery is solved.",ent("constab","doris")],
    [!H("weaselsKnown"),"Why are there so many weasels?","One's staring at you in the square.",ent("village","weaselV")],
    [!H("ch4"),"Show Eleanor the finger effigy","The Antique Bookstore.",ent("books","eleanor")],
    [!H("enteredHouse"),"Go up the hill to the Druskenvald Manor","North-west. Past the aviary path. Say hi to the Jenkins.",ent("village","walterV")],
    [heirloomCount()<3,"Find the heirlooms ("+heirloomCount()+"/6)","Gem · Cup · Key — ground floor.",!H("peacockDone")?ent("house1","peacock"):!H("got_cup")?(hasF("petuniaAsked")&&!countItem("wine")?ent("house1","wineshelf"):ent("house1","petunia")):ent("house1","harpsichord")],
    [!H("floor3Open"),"Upper floor: a doll, a clock, a bed","Sally wants you to check for monsters.",!H("got_doll")?ent("house2","sally"):ent("house2","suitbed")],
    [heirloomCount()<6,"Top floor: find the Bear and the Pin ("+heirloomCount()+"/6)","The nursery. The trophy room.",!hasKey("bear")?ent("house3","baby"):ent("house3","bearT")],
    [!H("inAttic"),"Open the trapdoor to the attic","Six heirlooms. Six holes.",ent("house3","hatch")],
    [!H("vesslaDone"),"The Hag in the Attic","Slot the heirlooms. Save the Druskenvalds.",!H("runesOpen")?ent("attic","runes"):ent("attic","figure")],
    [true,"Epilogue: dinner with the Druskenvalds (soon)","Talk to Adela & Phillip in the village. Open quests await in Chapter 5.",ent("village","adelaV")],
  ];
  // never point backwards: once a later milestone is reached, earlier steps are skipped
  const MILE=[[1,"boarded"],[4,"trainCrash"],[7,"locoDefeated"],[8,"druskReward"],[10,"ritualTalked"],[11,"boardRead"],[20,"wytchwoodIn"],[27,"handtakerDone"],[31,"enteredHouse"],[36,"vesslaDone"]];
  let floor=0;MILE.forEach(([i,f])=>{if(H(f))floor=Math.max(floor,i);});
  for(let i=floor;i<L.length;i++){const [c,text,sub,tgt]=L[i];if(c)return {text,sub,tgt};}
  return null;
}
function findEnt(map,id){const M=MAPS[map];if(!M)return null;return M.npcs.find(n=>n.id===id)||M.props.find(p=>p.id===id)||null;}
function routeStep(goal){ // BFS through exits
  if(!goal)return null;const start=STATE.map;if(goal===start)return null;
  const prev={};prev[start]=null;const q=[start];
  while(q.length){const m=q.shift();for(const e of MAPS[m].exits){if(!e.to||!MAPS[e.to])continue;if(e.need&&e.need==="__never")continue;if(prev[e.to]!==undefined)continue;prev[e.to]={m,e};if(e.to===goal){q.length=0;break;}q.push(e.to);}}
  if(prev[goal]===undefined)return null;let cur=goal,step=null;while(prev[cur]&&prev[cur].m!==start){cur=prev[cur].m;}step=prev[cur];return step?step.e:null;
}
function objectiveTarget(){const o=objective();if(!o||!o.tgt)return null;const g=o.tgt;
  if(g.map===STATE.map){if(g.id){const e=findEnt(g.map,g.id);if(e&&vis(e))return {x:e.x,y:e.y};return null;}return null;}
  const ex=routeStep(g.map);return ex?{x:ex.x,y:ex.y,exit:true}:null;}

/* ---------------------------------- HUD ---------------------------------- */
function updateHUD(){
  if(!STATE)return;$("hudLoc").textContent=curMap().name;$("hudGold").textContent=STATE.gold;
  const ph=$("partyhud");if(!ph.children.length){PARTY_ORDER.forEach(id=>{const d2=document.createElement("div");d2.className="ph";d2.dataset.id=id;d2.innerHTML=`<canvas width="24" height="24"></canvas><div class="bar"><i></i></div>`;d2.onclick=()=>{STATE.lead=id;updateHUD();SFX.sel();};ph.appendChild(d2);});}
  [...ph.children].forEach(d2=>{const id=d2.dataset.id;const s=pcStat(id),p=STATE.pcs[id];d2.classList.toggle("lead",id===STATE.lead);d2.querySelector("i").style.width=(100*Math.max(0,p.hp)/s.hpMax)+"%";
    d2.querySelector("i").style.background=p.hp/s.hpMax<.3?"var(--blood)":"var(--ok)";d2.title=`${nameOf(id)} ${p.hp}/${s.hpMax}`;
    const c=d2.querySelector("canvas"),g=c.getContext("2d");if(!c.done){const im=portraitImg(id);if(im){g.imageSmoothingEnabled=false;g.drawImage(im,0,0,24,24);c.done=1;}}});
}

/* ---------------------------------- ambient ------------------------------ */
const AMB={parts:[],birds:[],bark:null,barkT:25,flashT:0};
function initAmbient(){AMB.parts=[];AMB.birds=[];const M=curMap();const n={shroud:40,mist:26,wisps:22,leaves:18,fog:14,rain:90,smoke:20,dust:26,village:10}[M.amb]||0;
  for(let i=0;i<n;i++)AMB.parts.push(newPart(M.amb,true));}
function newPart(k,init){const W=VW,H=VH;
  if(k==="shroud")return {x:rnd(0,W),y:rnd(0,H),vx:-rnd(120,260),vy:0,s:rnd(10,40),a:rnd(.05,.18),c:"180,255,230"};
  if(k==="mist"||k==="fog")return {x:rnd(-60,W),y:rnd(0,H),vx:rnd(6,16),vy:0,s:rnd(30,70),a:rnd(.04,.1),c:"200,220,230"};
  if(k==="wisps")return {x:rnd(0,W),y:rnd(0,H),vx:rnd(-6,6),vy:-rnd(4,12),s:rnd(1.5,3),a:rnd(.4,.9),c:"140,255,190",glow:1,ph:rnd(0,6)};
  if(k==="leaves")return {x:rnd(0,W),y:init?rnd(0,H):-5,vx:rnd(-12,12),vy:rnd(14,28),s:2,a:.8,c:"150,90,50",ph:rnd(0,6)};
  if(k==="rain")return {x:rnd(0,W),y:init?rnd(0,H):-10,vx:-40,vy:rnd(320,420),s:1,a:.35,c:"180,200,230",rain:1};
  if(k==="smoke")return {x:rnd(0,W),y:rnd(0,H),vx:rnd(-4,4),vy:-rnd(6,14),s:rnd(18,40),a:rnd(.03,.07),c:"200,200,220"};
  if(k==="dust")return {x:rnd(0,W),y:rnd(0,H),vx:rnd(-3,3),vy:rnd(-3,3),s:1,a:rnd(.2,.5),c:"240,220,180",ph:rnd(0,6)};
  if(k==="village")return {x:rnd(0,W),y:rnd(0,H),vx:rnd(-4,4),vy:rnd(-2,2),s:1,a:rnd(.15,.35),c:"240,230,200",ph:rnd(0,6)};
  return {x:0,y:0,vx:0,vy:0,s:0,a:0,c:"0,0,0"};}
function updateAmbient(dt){const M=curMap();
  AMB.parts.forEach((p,i)=>{p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.ph!==undefined){p.ph+=dt*2;p.x+=Math.sin(p.ph)*.3;}
    if(p.x<-80||p.x>VW+80||p.y<-60||p.y>VH+20){AMB.parts[i]=newPart(M.amb,false);if(M.amb==="shroud")AMB.parts[i].x=VW+40;}});
  if(M.amb==="rain"&&Math.random()<dt*.05){AMB.flashT=1;SFX.thunder();}
  if(AMB.flashT>0)AMB.flashT-=dt*3;
  // crows in village/woods
  if((M.amb==="village"||M.theme==="woods")&&Math.random()<dt*.04&&AMB.birds.length<3)AMB.birds.push({x:-10,y:rnd(20,160),vx:rnd(50,80),ph:0});
  AMB.birds.forEach(b=>{b.x+=b.vx*dt;b.ph+=dt*12;});AMB.birds=AMB.birds.filter(b=>b.x<VW+20);
  // party banter
  AMB.barkT-=dt;if(AMB.barkT<=0&&canWalk()){AMB.barkT=rnd(35,70);const b=banterFor(M);if(b)AMB.bark={who:b[0],text:b[1],t:4.5};}
  if(AMB.bark){AMB.bark.t-=dt;if(AMB.bark.t<=0)AMB.bark=null;}
}
const BANTER={
  train:[["lucky","\"Anybody else notice we're all dead? No? Just me?\""],["krodha","\"Nice train. Haunted, but nice.\""],["azareth","\"The mist is looking at us.\""],["tessie","\"(…is it rude to ask ghosts how they died?)\""],["poppi","\"I want to read every piece of mail in that car.\""]],
  woods:[["tessie","\"Tracks. Lots of them.\""],["krodha","\"The trees are breathing, man. Let's breathe with them.\""],["azareth","\"I will make light if it gets darker. It is getting darker.\""],["lucky","\"If anything jumps out, I call dibs on its hat.\""],["poppi","\"Something has been following me since I found that book.\""]],
  village:[["lucky","\"This town needs a casino. And elections.\""],["azareth","\"Everyone here looks human. We look very out of place.\""],["krodha","\"Good tavern. Decent company. That's the dream.\""],["poppi","\"I want to go back to the bookstore.\""],["tessie","\"(…Caster likes the bakery smell.)\""]],
  house:[["poppi","\"Don't touch anything that screams.\""],["lucky","\"I'm going to touch everything that screams.\""],["krodha","\"This house has rot in its ki.\""],["azareth","\"The walls have teeth. I want them.\""],["tessie","\"The paintings keep looking at me.\""]],
  interior:[["krodha","\"Corner seat. Nursing a drink. That's where the wisdom is.\""],["lucky","\"Think they'd notice if I…? Okay, okay.\""]],
  stone:[["azareth","\"Stone floors are good for kneeling. I don't know why I know that.\""]],
};
function banterFor(M){const k=M.theme==="train"?"train":M.theme==="woods"||M.theme==="yard"?"woods":M.theme==="village"?"village":M.theme==="house"?"house":M.theme==="stone"||M.theme==="crypt"?"stone":"interior";const L=BANTER[k];return L?pick(L):null;}

/* ---------------------------------- draw world --------------------------- */
const light=document.createElement("canvas");light.width=VW;light.height=VH;const lx=light.getContext("2d");
let CAM={x:0,y:0,z:1};
function computeCam(){
  const M=curMap(),z=M.zoom||1,vw=VW/z,vh=VH/z,W=M.w*T,H=M.h*T;
  let cx=P.rx+T/2-vw/2,cy=P.ry+T/2-vh/2;
  cx=W<=vw?(W-vw)/2:clamp(cx,0,W-vw);cy=H<=vh?(H-vh)/2:clamp(cy,0,H-vh);
  CAM={x:Math.round(cx*z*RS)/(z*RS),y:Math.round(cy*z*RS)/(z*RS),z};
}
function drawWorld(t){
  const M=curMap();let c=ctx;computeCam();
  c.save();c.fillStyle=M.bg||"#000";c.fillRect(0,0,VW,VH);
  let sx=0,sy=0;if(FX.shake>0){sx=rnd(-FX.shake,FX.shake);sy=rnd(-FX.shake,FX.shake);FX.shake*=.85;if(FX.shake<.3)FX.shake=0;}
  c.translate(sx,sy);c.scale(CAM.z,CAM.z);c.translate(-CAM.x,-CAM.y);
  if(FX.warp){c.translate(Math.sin(t/200)*3,0);}
  // outside-map atmosphere for the train (shroud streaks under)
  if(M.theme==="train"){c.fillStyle="#0e1f1e";c.fillRect(-200,-200,M.w*T+400,M.h*T+400);}
  // floor
  if(M.art&&IMG["map:"+M.art]){smooth(c,true);c.drawImage(IMG["map:"+M.art],0,0,M.w*T,M.h*T);smooth(c,false);if(HD.dim){c.fillStyle=`rgba(4,3,10,${HD.dim})`;c.fillRect(0,0,M.w*T,M.h*T);}dimOutsideCar(c,M);}
  else{const th=TH[M.theme]||TH.interior;const x0=Math.max(0,Math.floor(CAM.x/T)),y0=Math.max(0,Math.floor(CAM.y/T)),x1=Math.min(M.w-1,Math.ceil((CAM.x+VW/CAM.z)/T)),y1=Math.min(M.h-1,Math.ceil((CAM.y+VH/CAM.z)/T));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)drawTile(c,M.grid[y][x],x,y,th);}
  if(DM.showGrid)drawCollision(c,M);
  // exits (doors / couplings) markers
  M.exits.forEach(e=>{if(!e.to||e.hidden&&(!e.need||!hasF(e.need)))return;const ok=!e.need||hasF(e.need);
    c.fillStyle=ok?"rgba(241,220,160,"+(.18+.12*Math.sin(t/300))+")":"rgba(200,60,70,.12)";c.fillRect(e.x*T+4,e.y*T+4,T-8,T-8);});
  // train arrival stage
  if(STAGE.train)drawTrainStage(c,t);
  // entities sorted by y
  const list=[];
  M.props.forEach(p=>{if(vis(p)&&!p.noDraw&&p.art)list.push({x:p.x*T,y:p.y*T,draw:()=>drawProp(c,p,t)});});
  M.npcs.forEach((n,i)=>{if(!vis(n))return;list.push({x:n.rx??n.x*T,y:(n.ry??n.y*T)+.1,draw:()=>{const x=n.rx??n.x*T,y=n.ry??n.y*T;
    if(typeof n.look==="string"&&n.look.startsWith("mon:"))drawMonSprite(c,x,y,n.look.slice(4),{big:n.big,seed:i});else drawChar(c,x,y,n.look,n.dir,0,{seed:i});}});});
  ROAM.forEach((r,i)=>{if(r.dead)return;list.push({x:r.rx,y:r.ry+.2,draw:()=>{drawMonSprite(c,r.rx,r.ry,r.look.slice(4),{seed:i+9});if(r.aggro){c.fillStyle="#ff5a5a";c.font="bold 10px monospace";c.fillText("!",r.rx+10,r.ry-12);}}});});
  // party trail
  if(!STATE.noFollow&&!M.solo){const k=P.moving?Math.min(1,P.t/MOVE_MS):1;
    for(let i=PARTY_ORDER.length-1;i>=0;i--){const id=PARTY_ORDER.filter(x=>x!==STATE.lead)[i];if(!id)continue;const a=TRAIL[i+1]||TRAIL[TRAIL.length-1],b=TRAIL[i];
      const fx=lerp(a.x,b.x,k)*T,fy=lerp(a.y,b.y,k)*T;if(Math.abs(fx-P.rx)<2&&Math.abs(fy-P.ry)<2)continue;
      const dir=b.dir||STATE.dir;list.push({x:fx,y:fy-.05,draw:()=>drawChar(c,fx,fy,PARTY_DEF[id].look,dir,P.frame+i,{moving:P.moving,seed:i})});}
    if(hasF("caster")){const a=TRAIL[4];list.push({x:a.x*T+6,y:a.y*T-.06,draw:()=>drawChar(c,a.x*T+6,a.y*T+4,{kind:"dog"},a.dir,0,{})});}}
  list.push({x:P.rx,y:P.ry,draw:()=>drawChar(c,P.rx,P.ry,PARTY_DEF[STATE.lead].look,STATE.dir,P.frame,{moving:P.moving})});
  list.sort((a,b)=>a.y-b.y);list.forEach(o=>drawOutlined(ctx,o,sc=>{c=sc;try{o.draw();}finally{c=ctx;}}));
  drawMarkers(c,t);
  c.restore();
  // ambient layer (screen space)
  drawAmbient(t);
  // lighting
  drawLighting(M,t);
  // bark bubble & prompts (screen space)
  drawOverlays(t);
}
function drawCollision(c,M){for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++){if(SOLID.has(M.grid[y][x])){c.fillStyle="rgba(255,0,0,.28)";c.fillRect(x*T,y*T,T,T);}if(exitAt(x,y)){c.fillStyle="rgba(0,140,255,.4)";c.fillRect(x*T,y*T,T,T);}}
  c.strokeStyle="rgba(255,255,0,.8)";c.lineWidth=2;M.walls.forEach(w=>{const [k,a,b,e]=w.split(" ");c.beginPath();if(k==="v"){c.moveTo(+a*T,+b*T);c.lineTo(+a*T,(+e+1)*T);}else{c.moveTo(+b*T,+a*T);c.lineTo((+e+1)*T,+a*T);}c.stroke();});}
function drawMarkers(c,t){
  const M=curMap();const tgt=objectiveTarget();
  // unsearched sparkles on props, speech dots on unmet NPCs
  M.props.forEach(p=>{if(!vis(p)||!p.talk)return;if(STATE.inspected[M.id+":"+p.id])return;const a=.5+.5*Math.sin(t/260+p.x);c.fillStyle=`rgba(241,220,160,${a})`;c.font="bold 9px monospace";c.fillText("✦",p.x*T+8,p.y*T+2);});
  M.npcs.forEach(n=>{if(!vis(n)||STATE.talked[n.id]||n.wander&&!["rusty","rain"].includes(n.id))return;c.fillStyle="rgba(10,8,20,.8)";c.fillRect((n.rx??n.x*T)+14,(n.ry??n.y*T)-10,10,8);c.fillStyle="#f1dca0";c.font="bold 8px monospace";c.fillText("…",(n.rx??n.x*T)+15,(n.ry??n.y*T)-3);});
  if(tgt){const bx2=tgt.x*T+12,by2=tgt.y*T-10+Math.sin(t/180)*3;c.fillStyle="#000";c.beginPath();c.moveTo(bx2-6,by2-7);c.lineTo(bx2+6,by2-7);c.lineTo(bx2,by2+1);c.fill();c.fillStyle=tgt.exit?"#9fe0b0":"#f1dca0";c.beginPath();c.moveTo(bx2-5,by2-6);c.lineTo(bx2+5,by2-6);c.lineTo(bx2,by2);c.fill();}
  // A-prompt over faced entity
  if(canWalk()){const f=facedEntity();if(f){const e=f.e;const x=(e.rx??e.x*T)+12,y=(e.ry??e.y*T)-18;c.fillStyle="rgba(10,8,20,.9)";c.fillRect(x-7,y-7,14,11);c.strokeStyle="#f1dca0";c.strokeRect(x-6.5,y-6.5,13,10);c.fillStyle="#f1dca0";c.font="bold 8px monospace";c.fillText("A",x-3,y+1);}}
  CAM.tgt=tgt;
}
function drawAmbient(t){
  const c=ctx;
  AMB.parts.forEach(p=>{c.fillStyle=`rgba(${p.c},${p.a})`;
    if(p.rain){c.fillRect(p.x,p.y,1,7);}
    else if(p.glow){const a=p.a*(.6+.4*Math.sin(t/300+p.ph));c.fillStyle=`rgba(${p.c},${a})`;c.fillRect(p.x,p.y,p.s,p.s);c.fillStyle=`rgba(${p.c},${a*.2})`;c.fillRect(p.x-2,p.y-2,p.s+4,p.s+4);}
    else if(p.s>5){c.beginPath();c.ellipse(p.x,p.y,p.s,p.s*.35,0,0,7);c.fill();}
    else c.fillRect(p.x,p.y,p.s,p.s);});
  AMB.birds.forEach(b=>{c.fillStyle="#0a0a0a";const w=Math.sin(b.ph)*3;c.fillRect(b.x,b.y,3,2);c.fillRect(b.x-3,b.y-w,3,1);c.fillRect(b.x+3,b.y-w,3,1);});
  if(AMB.flashT>0){c.fillStyle=`rgba(220,230,255,${AMB.flashT*.35})`;c.fillRect(0,0,VW,VH);}
}
function drawLighting(M,t){
  const dark=M.dark||0;if(dark<=0.02)return;
  lx.setTransform(RS,0,0,RS,0,0);lx.clearRect(0,0,VW,VH);lx.globalCompositeOperation="source-over";lx.fillStyle=`rgba(4,3,10,${dark})`;lx.fillRect(0,0,VW,VH);
  lx.globalCompositeOperation="destination-out";
  const hole=(wx,wy,r,s)=>{const x=(wx-CAM.x)*CAM.z,y=(wy-CAM.y)*CAM.z;const R=r*CAM.z;const g=lx.createRadialGradient(x,y,R*.15,x,y,R);g.addColorStop(0,`rgba(0,0,0,${s})`);g.addColorStop(1,"rgba(0,0,0,0)");lx.fillStyle=g;lx.fillRect(x-R,y-R,R*2,R*2);};
  const rad=((M.light||6)+(hasF("lightCast")&&M.theme==="woods"?1:0))*T*(1+.03*Math.sin(t/240));
  hole(P.rx+12,P.ry+12,rad,1);
  M.props.forEach(p=>{if(!vis(p))return;if(p.art==="fire")hole(p.x*T+12,p.y*T+12,T*3.2*(1+.08*Math.sin(t/90)),1);if(p.art==="jar")hole(p.x*T+12,p.y*T+12,T*2.2,.9);if(p.art==="lamp")hole(p.x*T+12,p.y*T+4,T*3,.9);});
  M.npcs.forEach(n=>{if(!vis(n))return;const L=typeof n.look==="string"?LOOK[n.look]:n.look;if(L&&L.ghost)hole((n.rx??n.x*T)+12,(n.ry??n.y*T)+12,T*1.6,.6);});
  lx.globalCompositeOperation="source-over";
  ctx.drawImage(light,0,0,VW,VH);
  // colored glow
  if(M.theme==="train"||M.amb==="wisps"){ctx.fillStyle="rgba(60,255,180,.035)";ctx.fillRect(0,0,VW,VH);}
  if(FX.vignette){ctx.fillStyle=FX.vignette;ctx.globalAlpha=.25;ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=1;}
}
function drawOverlays(t){
  const c=ctx;
  // vignette
  const g=c.createRadialGradient(VW/2,VH/2,VH*.35,VW/2,VH/2,VH*.8);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.45)");c.fillStyle=g;c.fillRect(0,0,VW,VH);
  // objective tracker
  const o=objective();if(o&&!DLG_OPEN&&!BATTLE.on){c.font="bold 8px monospace";const w=Math.min(280,Math.max(c.measureText(o.text).width,c.measureText(o.sub||"").width*0.9)+18);
    c.fillStyle="rgba(10,8,20,.82)";c.fillRect(6,6,w,28);c.strokeStyle="rgba(241,220,160,.7)";c.strokeRect(6.5,6.5,w-1,27);
    c.fillStyle="#9fe0b0";c.fillText("NEXT",11,16);c.fillStyle="#f1dca0";c.fillText(o.text.slice(0,48),34,16);c.fillStyle="#a79cc0";c.font="7px monospace";c.fillText((o.sub||"").slice(0,60),11,28);}
  // off-screen arrow toward target
  if(CAM.tgt&&!DLG_OPEN){const x=(CAM.tgt.x*T+12-CAM.x)*CAM.z,y=(CAM.tgt.y*T+12-CAM.y)*CAM.z;if(x<0||y<0||x>VW||y>VH){const cx=VW/2,cy=VH/2,a=Math.atan2(y-cy,x-cx);const ex=clamp(cx+Math.cos(a)*400,14,VW-14),ey=clamp(cy+Math.sin(a)*400,40,VH-14);
    c.save();c.translate(ex,ey);c.rotate(a);c.fillStyle="#f1dca0";c.beginPath();c.moveTo(8,0);c.lineTo(-6,-6);c.lineTo(-6,6);c.fill();c.restore();}}
  // bark
  if(AMB.bark&&!DLG_OPEN){const b=AMB.bark;c.font="8px monospace";const w=Math.min(300,c.measureText(b.text).width+34);const x=VW/2-w/2,y=VH-44;
    c.fillStyle="rgba(10,8,20,.88)";c.fillRect(x,y,w,24);c.strokeStyle=PARTY_DEF[b.who].color;c.strokeRect(x+.5,y+.5,w-1,23);const im=portraitImg(b.who);if(im){smooth(c,true);c.drawImage(im,x+3,y+3,18,18);smooth(c,false);}
    c.fillStyle="#efe3c4";c.fillText(b.text.slice(0,56),x+26,y+15);}
  if(FX.flash>0){c.globalAlpha=FX.flash;c.fillStyle=FX.flashCol;c.fillRect(0,0,VW,VH);c.globalAlpha=1;FX.flash=Math.max(0,FX.flash-.06);}
}

/* ---------------------------------- input -------------------------------- */
window.worldKey=(k)=>{
  if(!STATE||$("title").style.display!=="none")return;
  if(k==="DM"){toggleDM();return;}
  if(SCRIPT.running||INPUT_LOCK||BATTLE.on)return;
  if(["up","down","left","right"].includes(k)){if(canWalk()){if(P.moving)P.queued=k;else tryMove(k);}return;}
  if(k==="A"){if(!P.moving)interact();}
  else if(k==="START")openMenu("party");
  else if(k==="MAP")openTravel(true);
  else if(k==="JOURNAL")openMenu("journal");
  else if(k==="SWAP"){const i=PARTY_ORDER.indexOf(STATE.lead);STATE.lead=PARTY_ORDER[(i+1)%5];SFX.sel();toast(nameOf(STATE.lead)+" takes the lead");updateHUD();}
};
$("bMenu").onclick=()=>{if(STATE&&canWalk())openMenu("party");};
$("bJournal").onclick=()=>{if(STATE&&canWalk())openMenu("journal");};
$("bMap").onclick=()=>{if(STATE&&canWalk())openTravel(true);};
$("bSound").onclick=()=>{SOUND=!SOUND;sset("sound",SOUND?"1":"0");$("bSound").textContent=SOUND?"🔊":"🔇";};
$("bMusic").onclick=()=>{setMusic(!MUSIC);$("bMusic").style.opacity=MUSIC?1:.4;};
$("bDM").onclick=()=>toggleDM();

/* ---------------------------------- save/load ---------------------------- */
function saveGame(){if(!STATE)return;try{sset("save",JSON.stringify(STATE));}catch(e){}}
function loadGame(){try{const s=sget("save");if(!s)return null;const o=JSON.parse(s);const f=freshState(o.lead);return Object.assign(f,o,{stats:Object.assign(f.stats,o.stats||{})});}catch(e){return null;}}
async function gameOver(){
  const h=`<div style="text-align:center"><div style="font-size:30px;font-weight:900;color:var(--blood);letter-spacing:.1em">THE HOLLOW CLAIMS YOU</div>
    <p>…and spits you back out. You wake at your last rest, lighter in the purse.</p><button class="btn nav" onclick="closeModal()">Continue (lose 10% gold)</button></div>`;
  await modalAwait("✝","",h,navList());
  STATE.gold=Math.floor(STATE.gold*.9);PARTY_ORDER.forEach(refillPC);
  const r=STATE.restPoint;await warp(r.map,r.x,r.y,"down",{banner:["…","You wake up."]});
}

/* ---------------------------------- DM screen ---------------------------- */
const DM={showGrid:false,open:false};
function toggleDM(){DM.open=!DM.open;$("dm").classList.toggle("open",DM.open);if(DM.open)renderDM();}
const PRESETS={
  "Ch.1 · Board the train":{map:["car_passenger",8,3],flags:["boarded"],lvl:1},
  "Ch.1 · The wreckage":{map:["wreckage",10,8],flags:["boarded","shroudDone","cracksealed","harlequinDealt","harlequinGone","trainCrash","metDrusk"],lvl:1},
  "Ch.2 · Wickermoor Village":{map:["village",14,25],flags:["boarded","shroudDone","harlequinDealt","trainCrash","jarQuest","jar1","jar2","jar3","jar4","jar5","jar6","jarsDone","jarsHalf","locoDefeated","druskReward","lvl2","arrived","wolvesDone","goatFree","ritualTalked","ch2"],lvl:3,quests:["finger","cursed"]},
  "Ch.3 · Into the Wytchwood":{map:["village",7,2],flags:["boarded","shroudDone","harlequinDealt","trainCrash","jarQuest","jarsDone","locoDefeated","druskReward","arrived","wolvesDone","goatFree","ritualTalked","ch2","boardRead","metSolomon","fingerIdentified","fingerReturned","taylorKnown","taylorUnlocked","hexMorgan","hexKnown","knowsCult","metHilda","hildaGuide","metEleanor"],lvl:3},
  "Ch.4 · Up the hill":{map:["village",8,11],flags:["boarded","shroudDone","harlequinDealt","trainCrash","jarQuest","jarsDone","locoDefeated","druskReward","arrived","wolvesDone","goatFree","ritualTalked","ch2","boardRead","metSolomon","fingerIdentified","fingerReturned","hexMorgan","hexKnown","knowsCult","hildaGuide","wytchwoodIn","lightCast","caster","bodySeen","campFound","riverCrossed","marshHaintDone","gateOpen","handOpen","handtakerDone","mysterySolved","ch3back","reportedDoris","weaselsKnown","ch4","metEleanor","metJenkins"],lvl:4},
  "Ch.4 · The Attic":{map:["house3",12,6],flags:["boarded","trainCrash","locoDefeated","arrived","wolvesDone","ritualTalked","ch2","boardRead","fingerReturned","hexKnown","hildaGuide","wytchwoodIn","caster","handtakerDone","mysterySolved","ch3back","weaselsKnown","ch4","enteredHouse","peacockDone","got_cup","harpDone","floor2Open","got_doll","jasperDone","floor3Open","got_bear","atticReady","krodhaMirror","luckyBard"],keys:["gem","cup","key","doll","bear","pin"],lvl:4,items:{tooth:6}},
};
function renderDM(){
  const maps=Object.keys(MAPS).map(k=>`<option value="${k}">${esc(MAPS[k].name)}</option>`).join("");
  const encs=Object.keys(ENC).map(k=>`<option value="${k}">${k} — ${ENC[k].foes.map(f=>MON[f].name).join(", ")}</option>`).join("");
  const mons=Object.keys(MON).map(k=>`<option value="${k}">${esc(MON[k].name)}</option>`).join("");
  $("dm").innerHTML=`<div class="row" style="justify-content:space-between"><b style="color:var(--blood);letter-spacing:.2em">🎲 DM SCREEN</b><button class="tbtn" onclick="toggleDM()">✕</button></div>
  <p class="sub" style="color:var(--dim)">TableForge-style controls. You run the world; the table walks it.</p>
  <h3>JUMP TO CHAPTER</h3>${Object.keys(PRESETS).map(k=>`<button class="btn alt" data-pre="${esc(k)}">${esc(k)}</button>`).join("")}
  <h3>PUSH PLAYERS TO MAP</h3><select id="dmMap">${maps}</select><button class="btn" id="dmGo">Warp</button>
  <h3>START A BATTLE</h3><select id="dmEnc">${encs}</select><button class="btn" id="dmFight">Begin combat</button>
  <h3>INTRODUCE A CREATURE</h3><select id="dmMon">${mons}</select><button class="btn" id="dmReveal">Reveal card</button>
  <h3>PARTY</h3><button class="btn alt" id="dmHeal">Full heal</button><button class="btn alt" id="dmGold">+50 gp</button><button class="btn alt" id="dmXP">+300 XP</button><button class="btn alt" id="dmPot">+3 potions</button>
  <h3>TABLE TOOLS</h3><button class="btn alt" id="dmGod">Plot armor: ${STATE.god?"ON":"off"}</button><button class="btn alt" id="dmGrid">${DM.showGrid?"Hide":"Show"} collision</button><button class="btn alt" id="dmRoll">Roll d20</button><button class="btn alt" id="dmSecrets">Reveal all secrets</button>
  <input id="dmFlag" placeholder="set flag (e.g. caster)"><button class="btn alt" id="dmSetF">Set flag</button>
  <p class="sub" style="color:var(--dim)">Map: ${esc(curMap().name)} · (${STATE.x},${STATE.y})</p>`;
  $("dm").querySelectorAll("[data-pre]").forEach(b=>b.onclick=()=>applyPreset(b.dataset.pre));
  $("dmGo").onclick=()=>{const m=MAPS[$("dmMap").value];toggleDM();warp(m.id,m.start?m.start.x:1,m.start?m.start.y:1,"down");};
  $("dmFight").onclick=()=>{toggleDM();runScript(()=>battle($("dmEnc").value));};
  $("dmReveal").onclick=()=>{const k=$("dmMon").value;seeMon(k);toggleDM();revealCard(k);};
  $("dmHeal").onclick=()=>{PARTY_ORDER.forEach(refillPC);updateHUD();toast("Party restored");};
  $("dmGold").onclick=()=>addGold(50);$("dmXP").onclick=()=>{addXP(300);updateHUD();};$("dmPot").onclick=()=>giveItem("potion",3);
  $("dmGod").onclick=()=>{STATE.god=!STATE.god;renderDM();};
  $("dmGrid").onclick=()=>{DM.showGrid=!DM.showGrid;renderDM();};
  $("dmRoll").onclick=()=>{const n=d(20);toast("🎲 d20: "+n,n===20?"gold":n===1?"bad":"");SFX.dice();};
  $("dmSecrets").onclick=()=>{Object.keys(SECRETS).forEach(learnSecret);};
  $("dmSetF").onclick=()=>{const f=$("dmFlag").value.trim();if(f){setF(f);toast("flag: "+f);}};
}
async function applyPreset(k){const p=PRESETS[k];if(DM.open)toggleDM();
  STATE.flags={};p.flags.forEach(setF);STATE.keys={};(p.keys||[]).forEach(x=>STATE.keys[x]=1);Object.assign(STATE.items,p.items||{});
  STATE.level=1;STATE.xp=0;await levelTo(p.lvl||1);PARTY_ORDER.forEach(refillPC);
  (p.quests||[]).forEach(qStart);if(hasF("caster"))learnSecret("canine");
  await warp(p.map[0],p.map[1],p.map[2],"down");}
function revealCard(k){const M=MON[k];const im=monImage(M);
  openModal("👁 "+M.name,M.type,`<div style="text-align:center"><canvas id="rvc" width="240" height="240" style="width:240px;height:240px;image-rendering:pixelated"></canvas><p>${esc(M.desc)}</p></div>`,navList());
  const c=$("rvc").getContext("2d");c.imageSmoothingEnabled=false;if(im){const s=240/Math.max(im.width,im.height);c.drawImage(im,(240-im.width*s)/2,(240-im.height*s)/2,im.width*s,im.height*s);}SFX.magic();}

/* ---------------------------------- scorecard & credits ------------------ */
async function openScorecard(){
  const S=STATE.stats;const found=Object.keys(STATE.badges).length,tb=Object.keys(BADGES).length;
  const sp=spiritsFreed(),bs=Object.keys(STATE.seen).length,sec=Object.keys(STATE.secrets).length;
  const pct=(sp/6)*.2+(Math.min(1,found/tb))*.3+(Math.min(1,bs/20))*.2+(Math.min(1,sec/8))*.15+(S.kos===0?.15:S.kos<5?.1:.05);
  const grade=pct>=.85?"S":pct>=.7?"A":pct>=.55?"B":pct>=.4?"C":"D";
  const t=Math.floor(S.time/60);
  const h=`<div style="text-align:center"><div style="font-size:12px;letter-spacing:.3em;color:var(--ghost)">SESSIONS 1–8 COMPLETE</div><div style="font-size:56px;font-weight:900;color:var(--moon)">${grade}</div>
    <div class="grid2" style="margin:10px 0">${[["Spirits helped",sp+"/6"],["Badges",found+"/"+tb],["Bestiary",bs],["Secrets",sec],["Battles won",S.wins],["Party KOs",S.kos],["Crits",S.crits],["Nat 20s / 1s",S.nat20+" / "+S.nat1],["Damage dealt",S.dmg],["Gold",STATE.gold],["Steps",S.steps],["Play time",Math.floor(t/60)+"h "+(t%60)+"m"]].map(([a,b])=>`<div class="stat"><b>${b}</b>${a}</div>`).join("")}</div>
    <p class="sub">The Weasel Hag is dead. Her sisters are not. Dinner at the Druskenvalds' in a few days…</p>
    <div class="row" style="justify-content:center"><button class="btn nav" id="scCred">🎬 Roll credits</button><button class="btn alt nav" onclick="closeModal()">Keep exploring</button></div></div>`;
  const p=modalAwait("✦ THAT'S A SESSION ✦","",h,navList());$("scCred").onclick=()=>{closeModal();rollCredits();};await p;
}
function rollCredits(){
  const cast=["The Vagrant","Adela Druskenvald","Phillip Druskenvald","The Daydreamer","The Mariner","The Songstress","The Sweetheart","The Jailbird","The Harlequin","Mayor Wendel Somerton","Alda Farnum","Baltus Tolliver","Eleanor Heyling","Thomasin Ardor","Solomon Roderick","Doris Squire","Howie Butterman","Weston Murdoch","Morgan","Hilda Brom","Finneas Trout","Randall Graham","Holly Aster","Jean Myriel","Theodora Mayville","Old Rusty","Sister Rain","The Jenkin family","Sally Lockwood","Joseph Patrini","Petunia","Gail","Whisp","The Crooked Man","Vessla Browntooth"];
  $("croll").innerHTML=`<h1>CROOKED MOON</h1><div>The Ghostlight Express · Sessions 1–8</div>
   <h3>DUNGEON MASTER</h3><div>Moon</div>
   <h3>THE PARTY</h3><div>Azareth — Harvestborn Cleric</div><div>Lucky McQuest — Relicborn Rogue (and, lately, Bard)</div><div>Poppi — Threadborn Sorcerer</div><div>Krodha, Silas of Tsen — Plagueborn Monk</div><div>Tessie — Deepborn Ranger · and Caster, a very good ghost</div>
   <h3>THE CAST</h3>${cast.map(n=>`<div>${esc(n)}</div>`).join("")}
   <h3>SPECIAL THANKS</h3><div>A baby goat, who ran away</div><div>Forty weasel pelts</div><div>A mouth full of teeth</div>
   <h3>CAMPAIGN & ART</h3><div>The Crooked Moon — Avantris</div><div>Maps, monsters & NPC art from the Crooked Moon VTT Asset Pack</div>
   <h3>BUILT ON</h3><div>TableForge Lite · the On Location engine</div>
   <h3>NEXT TIME</h3><div>Memory's Rest · The Grey · The Bakery · Dinner with the Druskenvalds</div><div>Stonoga Blackstinger & Gollub Graygullet are coming.</div>
   <h1 style="margin-top:60px">TO BE CONTINUED…</h1>`;
  $("credits").style.display="block";playSong("title");
  const h=pushH(k=>{if(k==="B"||k==="START"||k==="A"){popH(h);$("credits").style.display="none";playSong(curMap().music);}});
  setTimeout(()=>{if($("credits").style.display==="block"){popH(h);$("credits").style.display="none";playSong(curMap().music);}},50000);
}

/* ---------------------------------- title -------------------------------- */
let TITLE_T=0;
function drawTitle(t){
  const c=$("titlecv").getContext("2d");c.imageSmoothingEnabled=false;const W=320,H=200;
  c.fillStyle="#07060d";c.fillRect(0,0,W,H);
  for(let i=0;i<60;i++){c.fillStyle=`rgba(241,220,160,${.2+.3*Math.sin(t/700+i)})`;c.fillRect((i*73)%W,(i*37)%120,1,1);}
  // crooked moon
  c.fillStyle="#f1dca0";c.beginPath();c.arc(230,50,26,0,7);c.fill();c.fillStyle="#07060d";c.beginPath();c.arc(241,43,24,0,7);c.fill();
  c.strokeStyle="#07060d";c.lineWidth=2;c.beginPath();c.moveTo(215,30);c.lineTo(220,45);c.lineTo(214,58);c.stroke();
  // hills & trees
  c.fillStyle="#120f1e";c.beginPath();c.moveTo(0,150);for(let x=0;x<=W;x+=10)c.lineTo(x,140-Math.sin(x/40)*10-Math.sin(x/13)*3);c.lineTo(W,H);c.lineTo(0,H);c.fill();
  for(let i=0;i<14;i++){const x=i*25+5,h=20+(i*7)%18;c.fillStyle="#0a0814";c.fillRect(x,140-h,3,h);c.fillRect(x-4,140-h+4,11,2);}
  // ghost train
  const tx=((t/40)%(W+260))-200;c.fillStyle="rgba(120,255,200,.12)";c.fillRect(0,158,W,2);
  c.save();c.globalAlpha=.8;for(let k=0;k<4;k++){c.fillStyle=k===0?"#2a4a44":"#1f3a36";c.fillRect(tx+k*52,150,48,16);c.fillStyle="rgba(140,255,200,.7)";for(let w=0;w<4;w++)c.fillRect(tx+k*52+5+w*10,154,6,4);}
  c.fillStyle="rgba(140,255,200,.5)";c.beginPath();c.arc(tx+210,158,5,0,7);c.fill();c.restore();
  for(let i=0;i<20;i++){c.fillStyle="rgba(200,240,230,.05)";c.beginPath();c.ellipse(((i*53+t/30)%(W+80))-40,160+(i%5)*8,40,6,0,0,7);c.fill();}
}
function showTitle(){
  $("title").style.display="flex";playSong("title");
  const has=!!sget("save");
  $("tpanel").innerHTML=`<div class="logo">CROOKED <i>MOON</i></div><div class="sublogo">THE GHOSTLIGHT EXPRESS</div>
    <div class="tbtns">${has?`<button class="btn" id="tCont">▶ CONTINUE</button>`:""}<button class="btn ${has?"alt":""}" id="tNew">✦ NEW GAME</button></div>
    <p class="sub press" style="color:var(--dim);margin-top:14px">A Game Boy–style RPG of Moon's Crooked Moon campaign · Sessions 1–8</p>
    <p class="sub" style="color:var(--dim)">Arrows/WASD · Z/E/Space = A · X/Esc = B · Enter = Menu · \` = DM Screen</p>`;
  const go=async(cont)=>{ac();if(cont){STATE=loadGame();if(!STATE){STATE=freshState();}hideTitle();await startWorld(true);}else charSelect();};
  if(has)$("tCont").onclick=()=>go(true);$("tNew").onclick=()=>go(false);
  const h=pushH(k=>{if(k==="A"||k==="START"){popH(h);go(has);}else if(k==="B"||k==="down"){popH(h);go(false);}});
  showTitle.h=h;
}
function hideTitle(){$("title").style.display="none";if(showTitle.h)popH(showTitle.h);showTitle.h=null;}
function charSelect(){
  if(showTitle.h){popH(showTitle.h);showTitle.h=null;}
  let sel=3;
  const render=()=>{$("tpanel").innerHTML=`<div class="logo" style="font-size:26px">CHOOSE YOUR LEADER</div><div class="sublogo">the whole party travels together · swap anytime with Q</div>
    <div id="cs">${PARTY_ORDER.map((id,i)=>`<div class="csc${i===sel?" sel":""}" data-i="${i}"><img src="${(window.ASSETS.pc[id==="tessie"?"Tessie":PARTY_DEF[id].name.split(" ")[0]]||{}).card||""}"><div class="nm">${esc(PARTY_DEF[id].short||PARTY_DEF[id].name)}</div><div class="cl">${PARTY_DEF[id].species} ${PARTY_DEF[id].cls}</div></div>`).join("")}</div>
    <div id="csinfo"><b style="color:var(--moon)">${esc(PARTY_DEF[PARTY_ORDER[sel]].name)}</b> — ${esc(PARTY_DEF[PARTY_ORDER[sel]].sub)} · Thread of Fate: ${esc(PARTY_DEF[PARTY_ORDER[sel]].thread)}<br>${esc(PARTY_DEF[PARTY_ORDER[sel]].blurb)}</div>
    <div class="tbtns"><button class="btn" id="csGo">▶ BEGIN — Tickets in hand</button></div>`;
    $("tpanel").querySelectorAll(".csc").forEach(e=>e.onclick=()=>{sel=+e.dataset.i;render();SFX.sel();});$("csGo").onclick=start;};
  const start=async()=>{popH(h);STATE=freshState(PARTY_ORDER[sel]);PARTY_ORDER.forEach(refillPC);sdel("save");hideTitle();await startWorld(false);};
  const h=pushH(k=>{if(k==="left"){sel=(sel+4)%5;render();SFX.sel();}else if(k==="right"){sel=(sel+1)%5;render();SFX.sel();}else if(k==="A"||k==="START")start();else if(k==="B"){popH(h);showTitle();}});
  render();
}
async function startWorld(cont){
  P.rx=STATE.x*T;P.ry=STATE.y*T;resetTrail();initMap();updateHUD();
  playSong(curMap().music);
  if(!cont){
    banner("PROLOGUE","A Platform in the Mist");
    await sleep(600);
    runScript(async()=>{
      await say(null,"Mist. A train platform in the middle of nowhere. You don't remember arriving.\nFive strangers, each holding a ticket they don't remember buying.");
      await say("krodha","\"…Huh. Okay. Let's just breathe.\"");
      await say(null,"(Arrows / WASD to move · A (Z/E/Space) to talk & examine · Enter for the Menu · Q to swap leader.)\nFollow the ✦ NEXT UP card in the corner.");
    });
  }else banner(curMap().sub||"",curMap().name);
}

/* ---------------------------------- loop --------------------------------- */
let lastT=performance.now();
function loop(t){
  const dt=Math.min(.05,(t-lastT)/1000);lastT=t;
  if($("title").style.display!=="none"){drawTitle(t);}
  else if(STATE&&!BATTLE.on){
    STATE.stats.time+=dt;
    updateMove(dt);updateNpcs(dt);updateRoam(dt);updateAmbient(dt);
    drawWorld(t);
  }
  requestAnimationFrame(loop);
}
async function boot(){
  bindTouch();sizeCanvas();
  await loadAssets();
  showTitle();requestAnimationFrame(loop);
}
/* boot() moved to 99_boot.js so v6 layers (13_–19_) install first */

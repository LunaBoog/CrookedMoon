/* ============================== v8 · battle ============================= *
 * Same 5e dice underneath. On top:
 *   · ACTION COMMANDS (Options ▸ on by default). When a PC attacks, a ring
 *     closes on the target — press A as it meets the circle: PERFECT gives
 *     advantage on that roll ("Inspired"), GOOD gives +1. When a monster's
 *     attack lands on a PC, a ring snaps around them — BRACE: PERFECT halves
 *     the damage, GOOD takes 2 off. Miss the timing and the dice decide alone.
 *   · a staged backdrop (soft-focus location art, ground fog in two layers,
 *     drifting motes per location), the new sprites big and outlined, the
 *     active hero stepping forward with a walk cycle.
 *   · real art for the wolf pack (the Hypnovulfen, greyed for the pack) and
 *     repainted procedural monsters (peacock, clock, feast, tablecloth, bath,
 *     supplicant).
 *   · Moors encounter 4: the Herald of Fools (art now in the pack). */
const ACT8={on:null,fx:[]};
const STAGE8={mist:[],motes:[],t:0};

/* ------------------------------------------------------- action commands */
function act8N(){return (V7.opt&&V7.opt.v8_actN)||0;}
function actPrompt8(kind,who){
  if(!v8opt("acts")||!BATTLE.on||!who)return Promise.resolve(0);
  const fast=STATE.fast;const dur=(kind==="strike"?1050:780)*(fast?.8:1);
  const cx=who.side==="pc"?(who.x||0)+23:(who.x||0)+(who.w||40)/2,cy=who.side==="pc"?(who.y||0)+26:(who.y||0)+(who.h||40)*.5;
  return new Promise(res=>{
    const A={kind,x:cx,y:cy,t0:performance.now()+(kind==="strike"?160:60),dur,res:null,done:false,teach:act8N()<4};ACT8.on=A;
    if(kind==="brace"){tone(980,.05,"square",.03);}
    const finish=v=>{if(A.done)return;A.done=true;A.res=v;A.tEnd=performance.now();popH(h);clearTimeout(to);
      ACT8.fx.push({x:cx,y:cy-(kind==="strike"?26:30),t:v===2?(kind==="strike"?"PERFECT!":"PERFECT BLOCK!"):v===1?(kind==="strike"?"GOOD":"BRACED"):(A.pressed?(A.early?"early":"late"):""),col:v===2?"#ffd96a":v===1?"#7fe0b8":"#a79cc0",born:performance.now()});
      if(v===2){tone(1320,.08,"square",.04);tone(1760,.12,"square",.035,0,.06);if(kind==="strike")burst(cx,cy,"#ffe08a",14,70,{glow:1,life:700});else burst(cx,cy,"#9fe0ff",14,60,{glow:1,life:700});}
      else if(v===1)tone(990,.07,"square",.035);
      if(A.pressed&&V7.opt){V7.opt.v8_actN=act8N()+1;try{v7save();}catch(e){}}
      setTimeout(()=>{if(ACT8.on===A)ACT8.on=null;},260);res(v);};
    const h=pushH(k=>{if(k!=="A")return;const now=performance.now();if(now<A.t0-40)return;A.pressed=true;
      const p=(now-A.t0)/A.dur,err=(p-.75)*A.dur;A.early=err<0;const e=Math.abs(err);finish(e<60?2:e<140?1:0);});
    const to=setTimeout(()=>finish(0),A.t0-performance.now()+dur+180);
  });
}
{const _ar=attackRoll;attackRoll=async function(att,tgt,bonus,opt){
  opt=opt||{};
  if(att&&att.side==="pc"&&tgt&&tgt.side==="foe"){
    const r=await actPrompt8("strike",tgt);
    if(r===2){opt=Object.assign({},opt,{adv:true});popText(att,"INSPIRED","#ffd96a");}else if(r===1)bonus=(bonus||0)+1;
    if(r)X8().acts=(X8().acts||0)+1;if(r===2)X8().perfect=(X8().perfect||0)+1;}
  const res=await _ar(att,tgt,bonus,opt);
  if(att&&att.side==="foe"&&tgt&&tgt.side==="pc"&&res.hit&&tgt.hp>0){const b=await actPrompt8("brace",tgt);tgt._brace=b;if(b)X8().braces=(X8().braces||0)+1;}
  return res;};}
{const _dr=dealRaw;dealRaw=function(c,n,col){
  if(c&&c._brace&&n>0){const b=c._brace;c._brace=0;const n0=n;n=b===2?Math.floor(n/2):Math.max(1,n-2);if(n<n0)setTimeout(()=>popText(c,"−"+(n0-n)+" blocked","#9fe0ff"),120);}
  return _dr(c,n,col);};}
{const _ft=foeTurn;foeTurn=async function(f){try{return await _ft(f);}finally{(BATTLE.party||[]).forEach(p=>p._brace=0);}};}
/* tiny v8 stats bag on the save (STATE.v8) */
function X8(){if(!STATE.v8)STATE.v8={acts:0,perfect:0,braces:0,stamps:0,cards:0};return STATE.v8;}

/* ---------------------------------------------- repainted procedural art */
const PROC8={};
{const _pa=procArt;procArt=function(key){
  if(PROC8[key])return PROC8[key];
  if(key==="wolf"){const im=IMG["mon:Hypnovulfen"];if(!im)return _pa(key);
    const c=document.createElement("canvas");c.width=im.width;c.height=im.height;const g=c.getContext("2d");
    g.filter="grayscale(.55) brightness(1.18) contrast(.95)";g.drawImage(im,0,0);g.filter="none";
    // calmer eyes for the rank-and-file
    return PROC8[key]=c;}
  const P=PAINT_PROC8[key];if(!P)return _pa(key);
  const c=document.createElement("canvas");c.width=c.height=240;const g=c.getContext("2d");
  try{P(g);}catch(e){console.warn(e);return _pa(key);}
  return PROC8[key]=c;};}
function grad8(g,x0,y0,x1,y1,stops){const G=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,c])=>G.addColorStop(o,c));return G;}
function rgrad8(g,x,y,r0,r1,stops){const G=g.createRadialGradient(x,y,r0,x,y,r1);stops.forEach(([o,c])=>G.addColorStop(o,c));return G;}
const PAINT_PROC8={
  supplicant(g){ // kneeling, hooded, handless arms raised
    g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(120,214,74,12,0,0,7);g.fill();
    g.fillStyle=grad8(g,60,90,180,220,[[0,"#5a465a"],[1,"#211a24"]]);
    g.beginPath();g.moveTo(52,214);g.bezierCurveTo(48,160,70,118,104,104);g.lineTo(140,104);g.bezierCurveTo(172,118,192,160,190,214);g.closePath();g.fill();
    // raised sleeves
    g.fillStyle="#3e3040";[[-1,78],[1,162]].forEach(([s,x])=>{g.beginPath();g.moveTo(x,128);g.quadraticCurveTo(x+s*28,90,x+s*22,52);g.lineTo(x+s*40,48);g.quadraticCurveTo(x+s*46,98,x+s*16,140);g.fill();
      g.fillStyle="#d8c8b0";g.beginPath();g.ellipse(x+s*31,50,10,6,s*.4,0,7);g.fill();g.fillStyle="#8a2a2a";g.beginPath();g.ellipse(x+s*31,48,6,3,s*.4,0,7);g.fill();g.fillStyle="#3e3040";});
    // hood, bowed
    g.fillStyle=grad8(g,90,60,150,130,[[0,"#4a3a4c"],[1,"#1c161e"]]);g.beginPath();g.moveTo(88,128);g.bezierCurveTo(84,80,104,62,122,62);g.bezierCurveTo(142,62,160,84,154,128);g.closePath();g.fill();
    g.fillStyle="#0a070c";g.beginPath();g.ellipse(121,108,18,22,0,0,7);g.fill();
    g.fillStyle="rgba(255,120,120,.55)";g.fillRect(112,104,4,2);g.fillRect(126,104,4,2);
    g.strokeStyle="rgba(255,230,210,.18)";g.lineWidth=2;g.beginPath();g.moveTo(92,120);g.bezierCurveTo(90,84,106,66,122,64);g.stroke();},
  peacock(g){ // a marble peacock, tail fanned
    g.fillStyle="rgba(0,0,0,.35)";g.beginPath();g.ellipse(120,222,70,10,0,0,7);g.fill();
    for(let i=0;i<13;i++){const a=-Math.PI/2+(i-6)*.2;g.save();g.translate(120,150);g.rotate(a+Math.PI/2);
      g.fillStyle=grad8(g,0,0,0,-118,[[0,"#9c9ca8"],[1,i%2?"#e6e6ee":"#d8d8e2"]]);g.beginPath();g.ellipse(0,-62,13,62,0,0,7);g.fill();
      g.strokeStyle="rgba(90,90,110,.35)";g.lineWidth=1;g.beginPath();g.moveTo(0,0);g.lineTo(0,-118);g.stroke();
      g.fillStyle="#6c6c84";g.beginPath();g.ellipse(0,-104,8,10,0,0,7);g.fill();g.fillStyle="#b8b8cc";g.beginPath();g.ellipse(0,-104,4,5,0,0,7);g.fill();g.restore();}
    g.fillStyle=grad8(g,90,120,150,220,[[0,"#f0f0f6"],[1,"#9a9aa8"]]);g.beginPath();g.ellipse(120,172,30,40,0,0,7);g.fill();
    g.beginPath();g.moveTo(112,140);g.quadraticCurveTo(104,96,124,80);g.lineTo(136,84);g.quadraticCurveTo(122,104,132,142);g.fill();
    g.beginPath();g.ellipse(132,80,13,11,0,0,7);g.fill();g.fillStyle="#c8a040";g.beginPath();g.moveTo(143,80);g.lineTo(156,84);g.lineTo(143,86);g.fill();
    g.fillStyle="#c01818";g.beginPath();g.arc(135,78,3,0,7);g.fill();g.fillStyle="#fff";g.fillRect(135,76,1.5,1.5);
    for(let i=0;i<3;i++){g.fillStyle="#d8d8e4";g.fillRect(124+i*4,62-i*2,2,14);g.beginPath();g.arc(125+i*4,61-i*2,3,0,7);g.fill();}
    g.strokeStyle="rgba(120,120,140,.45)";g.lineWidth=1;for(let i=0;i<6;i++){g.beginPath();g.moveTo(100+i*7,150+i*5);g.bezierCurveTo(110+i*6,170,104+i*5,190,116+i*4,206);g.stroke();}
    g.fillStyle="#7a7a88";g.fillRect(96,206,48,10);g.fillStyle="#8e8e9c";g.fillRect(90,214,60,8);},
  feast(g){ // a banquet with a mouth
    g.fillStyle="rgba(0,0,0,.4)";g.beginPath();g.ellipse(120,220,96,12,0,0,7);g.fill();
    g.fillStyle=grad8(g,0,90,0,210,[[0,"#c8884a"],[1,"#5a3218"]]);g.beginPath();g.moveTo(22,120);g.quadraticCurveTo(120,70,218,120);g.lineTo(206,212);g.quadraticCurveTo(120,226,34,212);g.closePath();g.fill();
    g.fillStyle="#2a0606";g.beginPath();g.moveTo(44,140);g.quadraticCurveTo(120,112,196,140);g.quadraticCurveTo(120,206,44,140);g.fill();
    g.fillStyle="#f0e8d0";for(let i=0;i<11;i++){const x=54+i*13;g.beginPath();g.moveTo(x,134-Math.sin(i/10*Math.PI)*12);g.lineTo(x+6,152-Math.sin(i/10*Math.PI)*10);g.lineTo(x+12,134-Math.sin(i/10*Math.PI)*12);g.fill();
      g.beginPath();g.moveTo(x+4,176-Math.sin(i/10*Math.PI)*6);g.lineTo(x+9,160-Math.sin(i/10*Math.PI)*6);g.lineTo(x+14,176-Math.sin(i/10*Math.PI)*6);g.fill();}
    g.fillStyle="#b04a2a";g.beginPath();g.ellipse(70,96,26,18,-.3,0,7);g.fill();g.fillStyle="#e8d0a8";g.fillRect(48,90,10,5);g.fillStyle="#7a2a12";g.beginPath();g.ellipse(70,92,20,10,-.3,0,7);g.fill();
    g.fillStyle="#8a1a28";g.beginPath();g.arc(160,92,16,0,7);g.fill();g.fillStyle="#c84a5a";g.beginPath();g.arc(156,88,6,0,7);g.fill();
    [[110,60],[130,58]].forEach(([x,y])=>{g.fillStyle="#efe6c8";g.fillRect(x,y,6,28);g.fillStyle=rgrad8(g,x+3,y-4,0,10,[[0,"rgba(255,230,140,1)"],[1,"rgba(255,180,60,0)"]]);g.fillRect(x-8,y-14,22,20);});
    g.fillStyle="#ffd040";g.beginPath();g.arc(98,150,5,0,7);g.arc(140,150,5,0,7);g.fill();},
  tablecloth(g){ // floating linen with a striped hem
    g.fillStyle="rgba(0,0,0,.25)";g.beginPath();g.ellipse(120,226,60,8,0,0,7);g.fill();
    g.fillStyle=grad8(g,0,20,0,200,[[0,"rgba(246,244,250,.96)"],[1,"rgba(200,200,220,.85)"]]);
    g.beginPath();g.moveTo(40,48);g.quadraticCurveTo(120,8,200,48);g.lineTo(214,196);g.lineTo(190,182);g.lineTo(170,206);g.lineTo(148,186);g.lineTo(122,210);g.lineTo(96,186);g.lineTo(72,206);g.lineTo(50,182);g.lineTo(26,196);g.closePath();g.fill();
    g.strokeStyle="#c83a4a";g.lineWidth=4;for(let i=0;i<2;i++){g.beginPath();g.moveTo(30,170+i*10);g.lineTo(210,170+i*10);g.stroke();}
    g.strokeStyle="rgba(140,140,170,.4)";g.lineWidth=2;for(let i=0;i<5;i++){g.beginPath();g.moveTo(70+i*25,50);g.quadraticCurveTo(64+i*25,120,78+i*25,180);g.stroke();}
    g.fillStyle="#0c0a12";g.beginPath();g.ellipse(96,88,10,14,0,0,7);g.ellipse(144,88,10,14,0,0,7);g.fill();g.beginPath();g.ellipse(120,124,16,8,0,0,7);g.fill();
    g.fillStyle="rgba(255,90,110,.6)";g.beginPath();g.arc(96,90,2.5,0,7);g.arc(144,90,2.5,0,7);g.fill();},
  clock(g){ // the grandfather clock, awake
    g.fillStyle="rgba(0,0,0,.4)";g.beginPath();g.ellipse(120,228,46,8,0,0,7);g.fill();
    g.fillStyle=grad8(g,80,0,160,0,[[0,"#2a160c"],[.5,"#5a3420"],[1,"#24130a"]]);g.fillRect(84,40,72,188);g.fillRect(76,30,88,18);g.beginPath();g.moveTo(76,30);g.quadraticCurveTo(120,0,164,30);g.fill();
    g.fillStyle="#d8d0b0";g.beginPath();g.arc(120,72,26,0,7);g.fill();g.strokeStyle="#8a6a3a";g.lineWidth=3;g.stroke();
    g.fillStyle="#2a1a10";for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.fillRect(120+Math.cos(a)*21-1,72+Math.sin(a)*21-1,2.5,2.5);}
    g.strokeStyle="#111";g.lineWidth=3;g.beginPath();g.moveTo(120,72);g.lineTo(120,54);g.moveTo(120,72);g.lineTo(134,78);g.stroke();
    g.fillStyle="#ff3a3a";g.beginPath();g.ellipse(110,64,4,2,0,0,7);g.ellipse(130,64,4,2,0,0,7);g.fill();
    g.fillStyle="#120804";g.fillRect(96,108,48,106);g.fillStyle=grad8(g,96,0,144,0,[[0,"rgba(255,220,140,.05)"],[1,"rgba(255,220,140,.18)"]]);g.fillRect(96,108,48,106);
    g.strokeStyle="#b8903a";g.lineWidth=3;g.beginPath();g.moveTo(120,110);g.lineTo(132,178);g.stroke();g.fillStyle="#d8b040";g.beginPath();g.arc(132,184,10,0,7);g.fill();
    g.fillStyle="#f0e8d0";for(let i=0;i<7;i++){g.beginPath();g.moveTo(98+i*7,214);g.lineTo(101+i*7,204);g.lineTo(104+i*7,214);g.fill();}},
  bloodbath(g){ // the clawfoot tub, overflowing
    g.fillStyle="rgba(120,0,10,.45)";g.beginPath();g.ellipse(120,214,104,16,0,0,7);g.fill();
    g.fillStyle=grad8(g,0,110,0,200,[[0,"#f0f0f4"],[1,"#a8a8b4"]]);g.beginPath();g.moveTo(20,118);g.lineTo(220,118);g.quadraticCurveTo(214,196,170,200);g.lineTo(70,200);g.quadraticCurveTo(26,196,20,118);g.fill();
    g.fillStyle="#7a0a12";g.beginPath();g.ellipse(120,120,98,14,0,0,7);g.fill();g.fillStyle="#a8121c";g.beginPath();g.ellipse(112,118,70,8,0,0,7);g.fill();
    g.fillStyle="#8a0a14";[[40,4],[70,7],[150,5],[190,8]].forEach(([x,l])=>{g.beginPath();g.moveTo(x-5,124);g.quadraticCurveTo(x,124+l*8,x+5,124);g.fill();});
    g.fillStyle="#a8121c";[[70,92],[150,84],[110,70]].forEach(([x,y],i)=>{g.beginPath();g.moveTo(x-8,122);g.lineTo(x-6,y);g.lineTo(x-9,y-10);g.lineTo(x-4,y-6);g.lineTo(x-2,y-14);g.lineTo(x+1,y-6);g.lineTo(x+5,y-12);g.lineTo(x+6,y);g.lineTo(x+8,122);g.fill();});
    g.fillStyle="#c8a040";[[48,200],[192,200]].forEach(([x,y])=>{g.beginPath();g.moveTo(x-8,y);g.lineTo(x+8,y);g.lineTo(x+4,y+16);g.lineTo(x-4,y+16);g.fill();});},
};

/* ---------------------------------------------------- the Herald of Fools */
Object.assign(MON,{herald:{name:"Herald of Fools",art:"mon:Herald_of_Fools",type:"fiend",hp:52,ac:14,dex:4,xp:300,gold:[8,20],
  desc:"Leader of fiendish revels. It dances, and those who dance with it dance until they drop. It must never stop dancing.",
  atk:[{name:"Capering Kick",bonus:6,dmg:"2d6+3",type:"bludgeoning",w:3},{name:"Mad Jig",save:{stat:"WIS",dc:13},status:{id:"confused",turns:1},aoe:true,w:1}],secret:"endlessFootwork"}});
Object.assign(SECRETS,{endlessFootwork:{name:"Endless Footwork",of:"Herald of Fools",how:"act:pin",
  text:"Heralds of fools must never stop dancing, or they quickly perish. Pin its feet and it can't dance: attacks against it have advantage, and it takes 20 necrotic damage.",
  study:"DC 20 Religion · Festivals, dance halls, theaters, traveling performers, bards"}});
Object.assign(ENC,{herald:{foes:["herald"],bg:"founders",intro:"The Herald of Fools spins out of the heather, bells ringing. Behind it, two old soldiers dance on bleeding feet."}});
ROAMERS[4]={name:"The Herald of Fools",att:"1d10+2",look:"mon:Herald_of_Fools",text:"1 Herald of Fools leads 2 cavorting Warrior Veterans who have danced half to death."};
{const _so=secretOptions;secretOptions=function(id){const out=_so(id);
  if(STATE.secrets.endlessFootwork&&alive("foe").some(f=>f.M.secret==="endlessFootwork")&&!out.some(o=>o.act==="sec:endlessFootwork"))
    out.push({label:"🦶 Endless Footwork — pin its feet",act:"sec:endlessFootwork",desc:SECRETS.endlessFootwork.text+" (Athletics, DC 14)"});
  return out;};}
{const _us=useSecret;useSecret=async function(c,s){
  if(s!=="endlessFootwork")return _us(c,s);
  const t=alive("foe").find(f=>f.M.secret===s);if(!t)return false;badge("secretKeeper");
  blog(`${esc(c.name)} dives for the Herald's feet…`);await bwait(400);
  const b=(SAVES[c.id].STR||0)+2,n=d(20),ok=n===20||(n!==1&&n+b>=14);await showDice(n,b,"Athletics DC 14",ok,false,0,true);
  if(ok){addSt(t,"restrained",2);SFX.magic();flash("#a07aff");const dd=await damage(c,t,"20","necrotic",false);blog(`Its feet stop. It can't dance. It <b>withers</b> (−${dd}), and everyone has advantage on it.`);}
  else blog("It skips out of reach, laughing, bells ringing.");
  await bwait(800);return true;};}
{const _rr=runRoamer;runRoamer=async function(v){
  const r=v.data;if(!r||r.n!==4)return _rr(v);
  const x=X(),R=ROAMERS[4];x.roamers++;x.metRoamerDay=x.day;await explainOnce("roamer");learnTerm("attitude");seeMon("herald");
  await say(null,"🌙 MOORS ENCOUNTER (d8 → 4)\n"+R.text,{name:"The Moors at Night",sub:"Wickermoor Hollow: Encounters"});
  const A=await attitudeModal(R.att,r.att);const note=t=>addNote("roamer","🌙",t,{quiet:true});
  if(A==="Hostile"){
    const c=await ask(null,"Bells. A figure in motley spins toward you, and the two old soldiers behind it dance on, weeping, unable to stop. It holds out a hand: \"DANCE.\"",["Fight it!","Grab its ankles. Make it stop. (Athletics)","Back away, and keep backing away."]);
    if(c===0){const res=await battle("herald");if(res==="win"){x.roamersBeat=(x.roamersBeat||0)+1;await say(null,"The bells stop. The two veterans collapse into the heather, gasping, and for the first time in days, they rest.");note("The Herald of Fools came dancing out of the moors. We fought it. Its two dancers finally sat down.");}}
    else if(c===1){const k=await check(LEAD(),"Athletics",14);
      if(k.ok){learnSecret("endlessFootwork");await say(null,"You catch its ankles. It shrieks, and it withers like a burnt page. It tears free and flees, limping, bells cracked. The veterans fall where they stand, asleep before they hit the ground.");addStanding("village",1,"stopped the Herald's dance");}
      else await say(null,"It skips out of your grip, laughing, and spins away into the dark with its dancers.");
      note("A Herald of Fools on the moors. It must never stop dancing.");}
    else{await say(null,"You back away. It dances after you for a while, mocking every step, then loses interest.");note("A dancing Herald of Fools followed us across the moor, mocking.");}}
  else if(A==="Indifferent"){
    const c=await ask(null,"A dance on the moor, under no music you can hear. A capering figure in motley, two old soldiers dancing behind it, feet bleeding through their boots.",["Watch, from a distance.","Walk on."]);
    if(c===0){await say(null,"It never stops. Not for a heartbeat. When one of the soldiers stumbles, the figure flinches like it was the one who fell.");learnSecret("endlessFootwork");}
    else await say(null,"The bells fade behind you.");
    note("A Herald of Fools danced across the moor with two exhausted soldiers.");}
  else{
    const c=await ask("lucky","\"Oh, I like him.\"",["Let Lucky play. (Performance)","Politely decline the dance."]);
    if(c===0){const k=await check("lucky","Performance",13);
      if(k.ok){await say(null,"Lucky plays; the Herald dances to it, delighted, and lets its two dancers sit out a song. They fall asleep in the heather. The Herald bows, tosses a few coins, and is gone.");addGold(6);}
      else await say(null,"Lucky's tune goes sour. The Herald's smile doesn't. It dances off, a little too fast.");}
    else await say(null,"It bows low, bells chiming, and capers off into the dark.");
    note("A friendly Herald of Fools on the moors. Lucky had opinions.");}
  removeVisitor(v);};}

/* -------------------------------------------------------------- the stage */
const BGTINT8={train:["#0f2a28","rgba(80,255,190,"],wreck:["#13221c","rgba(110,255,170,"],founders:["#1a1410","rgba(255,200,140,"],woods:["#0e1a12","rgba(170,255,140,"],
  marsh:["#10161a","rgba(170,220,255,"],temple:["#120e14","rgba(255,170,120,"],house:["#140c14","rgba(255,190,150,"],blood:["#1a0608","rgba(255,90,90,"],attic:["#120a10","rgba(255,200,160,"]};
function stageMotes8(bg,t){
  const M=STAGE8;if(M.bg!==bg){M.bg=bg;M.mist=[];M.motes=[];for(let i=0;i<14;i++)M.mist.push({x:rnd(-80,560),y:rnd(196,300),r:rnd(40,90),v:rnd(6,16)*(Math.random()<.5?-1:1),a:rnd(.05,.12),front:i%3===0});
    for(let i=0;i<26;i++)M.motes.push({x:rnd(0,480),y:rnd(20,300),vx:rnd(-6,6),vy:rnd(-10,-2),s:rnd(.8,2),ph:rnd(0,6)});}
  return M;}
function drawStageBack8(c,B,t){
  const T8=BGTINT8[B.bg]||BGTINT8.founders;c.fillStyle=T8[0];c.fillRect(-12,-12,504,360);
  const art=IMG["map:"+(BG_ART[B.bg]||curMap().art||"")];
  if(art){const key=(BG_ART[B.bg]||curMap().art)+"|"+RS;
    if(STAGE8.bgKey!==key){STAGE8.bgKey=key;const s=Math.max(480/art.width,336/art.height)*1.75,W=Math.ceil(520*RS),H=Math.ceil(360*RS);
      const o=document.createElement("canvas");o.width=W;o.height=H;const g=o.getContext("2d");g.imageSmoothingQuality="high";
      g.filter=`blur(${1.6*RS}px) saturate(.85)`;const cx=(art.width*s-520)/2,cy=(art.height*s-360)/2;g.drawImage(art,-cx*RS,-cy*RS,art.width*s*RS,art.height*s*RS);g.filter="none";STAGE8.bgC=o;}
    c.save();c.globalAlpha=.62;c.drawImage(STAGE8.bgC,-20+Math.sin(t/5200)*16,-12+Math.cos(t/7400)*7,520,360);c.restore();}
  let g=c.createLinearGradient(0,0,0,336);g.addColorStop(0,"rgba(6,4,14,.62)");g.addColorStop(.42,"rgba(6,4,14,.12)");g.addColorStop(.72,"rgba(6,4,14,.30)");g.addColorStop(1,"rgba(6,4,14,.94)");c.fillStyle=g;c.fillRect(0,0,480,336);
  g=c.createRadialGradient(240,200,70,240,200,340);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.62)");c.fillStyle=g;c.fillRect(0,0,480,336);
  // god-rays from the top-left
  c.save();c.globalCompositeOperation="lighter";for(let i=0;i<3;i++){const x=60+i*70+Math.sin(t/3000+i)*10;g=c.createLinearGradient(x,0,x+120,300);g.addColorStop(0,T8[1]+".07)");g.addColorStop(1,T8[1]+"0)");c.fillStyle=g;
    c.beginPath();c.moveTo(x,0);c.lineTo(x+30,0);c.lineTo(x+170,320);c.lineTo(x+110,320);c.fill();}c.restore();
  if(B.bg==="blood"){c.fillStyle=`rgba(140,0,20,${.25+(1-(B.timer||0)/6)*.35})`;c.fillRect(0,336-(1-(B.timer||6)/6)*220-40,480,400);}
  // pools of light on the ground
  g=c.createRadialGradient(165,236,10,165,236,180);g.addColorStop(0,T8[1]+".13)");g.addColorStop(1,T8[1]+"0)");c.fillStyle=g;c.fillRect(0,110,350,226);
  g=c.createRadialGradient(392,250,6,392,250,110);g.addColorStop(0,"rgba(255,226,170,.10)");g.addColorStop(1,"rgba(255,226,170,0)");c.fillStyle=g;c.fillRect(270,150,210,186);
  c.fillStyle="rgba(0,0,0,.38)";c.beginPath();c.ellipse(165,234,168,24,0,0,7);c.fill();
  c.fillStyle="rgba(0,0,0,.32)";c.beginPath();c.ellipse(398,246,92,18,0,0,7);c.fill();
  const M=stageMotes8(B.bg,t);mist8(c,M,t,false);
}
function mist8(c,M,t,front){
  M.mist.forEach(m=>{if(m.front!==front)return;m.x+=m.v/60;if(m.x<-120)m.x=600;if(m.x>600)m.x=-120;
    c.save();c.translate(m.x,m.y);c.scale(1,.28);const g=c.createRadialGradient(0,0,0,0,0,m.r);g.addColorStop(0,`rgba(200,214,230,${m.a*(front?.8:1.3)})`);g.addColorStop(1,"rgba(200,214,230,0)");c.fillStyle=g;c.fillRect(-m.r,-m.r,m.r*2,m.r*2);c.restore();});}
function drawStageFront8(c,B,t){
  const M=stageMotes8(B.bg,t),T8=BGTINT8[B.bg]||BGTINT8.founders;mist8(c,M,t,true);
  c.save();c.globalCompositeOperation="lighter";
  M.motes.forEach(p=>{p.x+=p.vx/60;p.y+=p.vy/60;p.ph+=.03;if(p.y<0){p.y=320;p.x=rnd(0,480);}if(p.x<0)p.x=480;if(p.x>480)p.x=0;
    const a=.25+.25*Math.sin(p.ph);c.fillStyle=T8[1]+a+")";c.fillRect(p.x+Math.sin(p.ph)*3,p.y,p.s,p.s);});
  c.restore();
}

/* ----------------------------------------------------------- the party */
function drawParty8(c,B,t){
  B.party.forEach((p,i)=>{
    let dx=0;if(p.lunge&&t-p.lunge<300)dx=-Math.sin((t-p.lunge)/300*Math.PI)*24;
    if(p.hurt&&t-p.hurt<260)dx+=Math.sin((t-p.hurt)/260*Math.PI)*8;
    const act=B.cur===p,down=p.hp<=0;if(act)dx-=8;
    const fx=p.x+23+dx,fy=p.y+52;
    if(act){const gg=c.createRadialGradient(fx,fy,2,fx,fy,30);gg.addColorStop(0,"rgba(255,217,106,.55)");gg.addColorStop(1,"rgba(255,217,106,0)");c.fillStyle=gg;c.fillRect(fx-34,fy-16,68,32);}
    c.fillStyle="rgba(0,0,0,.45)";c.beginPath();c.ellipse(fx,fy-1,13,3.4,0,0,7);c.fill();
    c.save();
    if(down){c.globalAlpha=.55;c.translate(fx,fy-4);c.rotate(-Math.PI/2);c.translate(-fx,-(fy-4));}
    else{const br=1+Math.sin(t/520+i)*.018;c.translate(fx,fy);c.scale(1,br);c.translate(-fx,-fy);}
    if(p.hurt&&t-p.hurt<240&&((t/45|0)%2))c.globalAlpha=.35;
    if(PARTY_DEF[p.id].look.kind==="dog"||p.st.hidden)c.globalAlpha*=.6;
    const walking=(p.lunge&&t-p.lunge<300)||act;
    drawChar8Big(c,fx,fy,PARTY_DEF[p.id].look,"left",{scale:1.42,frame:walking&&!down?Math.floor(t/130)%4:0,seed:i});
    if(act&&!down){c.globalCompositeOperation="lighter";c.globalAlpha=.08+.05*Math.sin(t/180);drawChar8Big(c,fx,fy,PARTY_DEF[p.id].look,"left",{scale:1.42,seed:i});c.globalCompositeOperation="source-over";}
    c.restore();
    if(B.pick===p){const k=1.5*Math.sin(t/120);c.strokeStyle="#9fe0b0";c.lineWidth=1.5;c.strokeRect(p.x-4-k,p.y-14-k,56+2*k,70+2*k);}
  });
  B.party.forEach(p=>{if(p.id===ME()&&p.hp>0){const x=p.x+2,y=p.y+60;c.fillStyle="rgba(10,30,24,.85)";c.beginPath();c.roundRect?c.roundRect(x-10,y-5,20,7.5,3):c.rect(x-10,y-5,20,7.5);c.fill();bText(c,"YOU",x,y+.8,"#7fe0b8",4.4,400,"center","CMLabel");}});
  if(hasF("caster")){const te=B.party.find(p=>p.id==="tessie");if(te){c.save();c.globalAlpha=.75+.1*Math.sin(t/300);drawChar8Big(c,te.x+2,te.y+60,{kind:"dog"},"left",{scale:1.15});c.restore();}}
  B.order.filter(a=>a.side==="ally"&&!a.dead).forEach(a=>{drawChar8Big(c,a.x+20,a.y+40,{kind:"weasel",big:true},"left",{scale:1.2});});
}

/* ---------------------------------------------- action-command overlay */
function drawActs8(c,t){
  const A=ACT8.on;
  if(A){const p=clamp((t-A.t0)/A.dur,0,1.2),R0=34,r=Math.max(0,R0*(1-p)),tr=R0*.25,pre=t<A.t0;
    c.save();
    // target circle
    c.strokeStyle=A.kind==="brace"?"rgba(159,224,255,.95)":"rgba(255,245,220,.95)";c.lineWidth=1.4;c.setLineDash([2,2]);c.beginPath();c.arc(A.x,A.y,tr,0,7);c.stroke();c.setLineDash([]);
    c.fillStyle=A.kind==="brace"?"rgba(120,200,255,.12)":"rgba(255,217,106,.12)";c.beginPath();c.arc(A.x,A.y,tr,0,7);c.fill();
    if(!A.done&&!pre){const near=Math.abs(r-tr)<4;c.strokeStyle=near?"#ffffff":A.kind==="brace"?"#9fe0ff":"#ffd96a";c.lineWidth=near?3:2;c.beginPath();c.arc(A.x,A.y,r,0,7);c.stroke();
      c.globalAlpha=.35;c.lineWidth=6;c.beginPath();c.arc(A.x,A.y,r,0,7);c.stroke();c.globalAlpha=1;}
    if(A.done&&A.res){const k=clamp((t-A.tEnd)/260,0,1);c.globalAlpha=1-k;c.strokeStyle=A.res===2?"#ffd96a":"#7fe0b8";c.lineWidth=3*(1-k)+.5;c.beginPath();c.arc(A.x,A.y,tr+k*26,0,7);c.stroke();c.globalAlpha=1;}
    if(!A.done){const lab=A.kind==="strike"?"STRIKE":"BRACE!";bText(c,lab,A.x,A.y-R0-6,A.kind==="strike"?"#ffd96a":"#9fe0ff",7,700,"center","CMLabel");
      if(A.teach)bText(c,"press A as the rings meet",A.x,A.y+R0+12,"#efe3c4",5.2,400,"center","CMLabel");}
    c.restore();}
  ACT8.fx=ACT8.fx.filter(f=>t-f.born<900&&f.t);ACT8.fx.forEach(f=>{const k=(t-f.born)/900;c.save();c.globalAlpha=k>.7?(1-k)/.3:1;const sc=k<.12?1+(.12-k)*4:1;c.translate(f.x,f.y-k*10);c.scale(sc,sc);bText(c,f.t,0,0,f.col,/^[a-z]/.test(f.t)?5.5:f.t.length>9?7.5:9,700,"center","CMLabel");c.restore();});
}

/* ------------------------------------------------------ drawBattle (v8) */
{const _db7=drawBattle;drawBattle=function(){
  bx.setTransform(RS,0,0,RS,0,0);bx.imageSmoothingEnabled=true;bx.imageSmoothingQuality="high";
  const B=BATTLE,c=bx,t=performance.now();
  if(!SPR8.on){_db7();return;}
  c.save();
  if(FX.shake>0){c.translate(rnd(-FX.shake,FX.shake),rnd(-FX.shake,FX.shake));FX.shake*=.86;if(FX.shake<.3)FX.shake=0;}
  drawStageBack8(c,B,t);
  // foes (same as v7, with a cooler rim when they're the active one)
  B.foes.forEach((f,i)=>{
    const dying=f.dead&&t-f.deathT<650;if(f.dead&&!dying)return;
    const im=monImage(f.M);const bob=Math.sin(t/430+i)*2,breath=1+Math.sin(t/600+i*1.3)*.018;
    let dx=0;if(f.lunge&&t-f.lunge<300)dx=Math.sin((t-f.lunge)/300*Math.PI)*22;
    if(f.hurt&&t-f.hurt<260)dx-=Math.sin((t-f.hurt)/260*Math.PI)*9;
    if(!im)return;const s=Math.min(f.w/im.width,f.h/im.height);const w=im.width*s,h=im.height*s,x=f.x+dx+(f.w-w)/2,y=f.y+f.h-h+bob;
    c.save();
    if(B.cur===f&&!f.dead){const gg=c.createRadialGradient(f.x+f.w/2,f.y+f.h,4,f.x+f.w/2,f.y+f.h,f.w*.65);gg.addColorStop(0,"rgba(255,90,90,.38)");gg.addColorStop(1,"rgba(255,90,90,0)");c.fillStyle=gg;c.fillRect(f.x-20,f.y+f.h-30,f.w+40,60);}
    c.fillStyle="rgba(0,0,0,.5)";c.beginPath();c.ellipse(f.x+f.w/2+dx,f.y+f.h+2,w*.42,6,0,0,7);c.fill();
    if(dying){const k=(t-f.deathT)/650;c.globalAlpha=Math.max(0,1-k*1.4);c.translate(x+w/2,y+h);c.scale(1+k*.2,1-k*.5);c.translate(-(x+w/2),-(y+h));}
    if(has(f,"charmed")){c.shadowColor="#ff7ab8";c.shadowBlur=16;}
    if(has(f,"restrained")||has(f,"ironed")){c.shadowColor="#a07aff";c.shadowBlur=12;}
    if(f.M.tint)c.filter="hue-rotate(20deg) saturate(1.4)";
    c.translate(x+w/2,y+h);c.scale(1,breath);c.translate(-(x+w/2),-(y+h));
    c.drawImage(im,x,y,w,h);c.filter="none";c.shadowBlur=0;
    if(f.hurt&&t-f.hurt<140){c.globalCompositeOperation="lighter";c.globalAlpha=.7;c.drawImage(im,x,y,w,h);c.globalCompositeOperation="source-over";}
    c.restore();
    if(!f.dead){const bw=Math.max(56,Math.min(110,f.w,(f.sp||999)-6)),nx=clamp(f.x+f.w/2-bw/2,4,320-bw),ny=Math.max(36,f.plateY??f.y-16);
      c.fillStyle="rgba(8,6,16,.8)";c.beginPath();c.roundRect?c.roundRect(nx-3,ny-9,bw+6,17,4):c.rect(nx-3,ny-9,bw+6,17);c.fill();
      if(f.boss){c.strokeStyle="rgba(255,217,106,.55)";c.lineWidth=.7;c.stroke();}
      c.save();c.beginPath();c.rect(nx-2,ny-10,bw-22,12);c.clip();bText(c,f.name,nx,ny-1.5,f.boss?"#ffd96a":"#f1e8d0",7,600);c.restore();
      bText(c,`${Math.max(0,f.hp)}/${f.hpMax}`,nx+bw,ny-1.5,"#a79cc0",5,400,"right","CMLabel");
      BAR(c,nx,ny+2,bw,3.4,f.hp/f.hpMax,lagFrac(f),f.boss?"#e3b64f":"#e05a5a");
      const sts=Object.keys(f.st).filter(s=>f.st[s]>0&&s!=="feinted");let sx=nx;sts.slice(0,4).forEach(s=>{const lab=stName(s).slice(0,6);c.font=F7(4.6,400,"CMLabel");const w2=c.measureText(lab).width+5;c.fillStyle="rgba(120,80,200,.75)";c.fillRect(sx,f.y+f.h+6,w2,7);bText(c,lab,sx+2.5,f.y+f.h+11.5,"#f0e6ff",4.6,400,"left","CMLabel");sx+=w2+2;});
      if(B.pick===f){const k=1.5*Math.sin(t/120);c.strokeStyle="#ffd96a";c.lineWidth=1.5;const x0=f.x-4-k,y0=f.y-2-k,x1=f.x+f.w+4+k,y1=f.y+f.h+4+k,L=8;c.beginPath();c.moveTo(x0,y0+L);c.lineTo(x0,y0);c.lineTo(x0+L,y0);c.moveTo(x1-L,y0);c.lineTo(x1,y0);c.lineTo(x1,y0+L);c.moveTo(x1,y1-L);c.lineTo(x1,y1);c.lineTo(x1-L,y1);c.moveTo(x0+L,y1);c.lineTo(x0,y1);c.lineTo(x0,y1-L);c.stroke();
        bText(c,"▼",f.x+f.w/2,ny-12+Math.sin(t/120)*2,"#ffd96a",9,700,"center");}}
  });
  drawParty8(c,B,t);
  drawStageFront8(c,B,t);
  // party panel
  const px0=318,pw=158;c.fillStyle="rgba(10,8,20,.86)";c.beginPath();c.roundRect?c.roundRect(px0,5,pw,8+B.party.length*15,6):c.rect(px0,5,pw,8+B.party.length*15);c.fill();c.strokeStyle="rgba(201,164,74,.7)";c.lineWidth=.8;c.stroke();
  B.party.forEach((p,i)=>{const y=11+i*15;const cur=B.cur===p;
    if(cur){c.fillStyle="rgba(255,217,106,.12)";c.fillRect(px0+2,y-3,pw-4,15);}
    circlePortrait(c,portraitImg(p.id),px0+10,y+4.5,6,cur?"#ffd96a":p.id===ME()?"#7fe0b8":"#3a3160");
    bText(c,(PARTY_DEF[p.id].short||p.name).split(" ")[0],px0+20,y+3.5,cur?"#ffd96a":p.hp<=0?"#a55":"#efe3c4",6.4,600);
    BAR(c,px0+62,y-.5,60,4,p.hp/p.hpMax,lagFrac(p),p.hp/p.hpMax<.3?"#e05a5a":"#5fd08a");
    if(p.temp>0){c.fillStyle="#9fe0ff";c.fillRect(px0+62,y+4,Math.min(60,p.temp*4),1.2);}
    bText(c,`${Math.max(0,p.hp)}/${p.hpMax}`,px0+pw-5,y+3.5,"#efe3c4",5,400,"right","CMLabel");
    const P2=STATE.pcs[p.id],s=pcStat(p.id);let res="";if(s.slotsMax)res="◆".repeat(P2.slots)+"◇".repeat(Math.max(0,s.slotsMax-P2.slots));if(p.id==="krodha")res="●".repeat(P2.ki)+"○".repeat(Math.max(0,s.kiMax-P2.ki));if(p.id==="lucky")res="⁍".repeat(Math.min(10,P2.ammo));
    c.font=F7(4.2);c.fillStyle="#b89cf0";c.fillText(res.slice(0,10),px0+62,y+9.6);
    const sts=Object.keys(p.st).filter(s=>p.st[s]>0);if(sts.length)bText(c,stName(sts[0]).slice(0,7),px0+pw-5,y+10,"#c8a8ff",4.2,400,"right","CMLabel");});
  // turn order ribbon
  {let ox=10;const y=14;c.fillStyle="rgba(10,8,20,.8)";const live=B.order.filter(o=>!o.dead&&o.hp>0);const w=Math.min(300,24+live.length*17);c.beginPath();c.roundRect?c.roundRect(4,4,w,20,10):c.rect(4,4,w,20);c.fill();
    bText(c,"R"+B.round,ox,y+2.5,"#a79cc0",6,700,"left","CMLabel");ox+=16;
    live.forEach(o=>{const cur=o===B.cur,r=cur?7:5.6;const im=o.side==="pc"?portraitImg(o.id):o.side==="foe"?monImage(o.M):null;
      circlePortrait(c,im,ox+r,y,r,cur?"#ffd96a":o.side==="pc"?"#5fd08a":o.side==="ally"?"#d8b060":"#e05a5a");ox+=r*2+3.5;});}
  if(B.enc.ritual){bText(c,"RITUAL",8,36,"#ff7a7a",6,400,"left","CMLabel");for(let k=0;k<3;k++){c.fillStyle=k<B.ritual?"#e03a4a":"rgba(255,255,255,.15)";c.fillRect(44+k*9,30.5,7,6);}}
  if(B.enc.timer)bText(c,"BLOOD RISING · "+B.timer,8,36,"#ff5a5a",6,400,"left","CMLabel");
  if(v8opt("acts")&&B.round===1&&act8N()<1)bText(c,"ACTION COMMANDS ON · tap A on the rings",8,330,"rgba(239,227,196,.7)",4.8,400,"left","CMLabel");
  // effects
  B7.rings=B7.rings.filter(r=>t-r.born<420);B7.rings.forEach(r=>{const k=(t-r.born)/420;c.strokeStyle=r.col;c.globalAlpha=1-k;c.lineWidth=2*(1-k)+.5;c.beginPath();c.arc(r.x,r.y,r.r*(.3+k),0,7);c.stroke();c.globalAlpha=1;});
  B7.slashes=B7.slashes.filter(s=>t-s.born<300);B7.slashes.forEach(s=>{const k=(t-s.born)/300;if(k<0)return;c.save();c.translate(s.x,s.y);c.rotate(s.ang);c.globalAlpha=1-k;c.strokeStyle=s.col;c.lineCap="round";
    if(s.ray){c.lineWidth=2;c.beginPath();c.moveTo(8+k*10,0);c.lineTo(22+k*26,0);c.stroke();}else{c.lineWidth=3*(1-k)+.6;c.beginPath();c.moveTo(-26+k*10,0);c.lineTo(26*k+4,0);c.stroke();}c.restore();});
  c.save();B7.parts=B7.parts.filter(p=>t-p.born<p.life);B7.parts.forEach(p=>{const age=(t-p.born)/1000;if(age<0)return;const k=(t-p.born)/p.life;const x=p.x+p.vx*age,y=p.y+p.vy*age+.5*p.g*age*age;
    c.globalAlpha=1-k;if(p.glow){c.globalCompositeOperation="lighter";}c.fillStyle=p.col;c.fillRect(x-p.s/2,y-p.s/2,p.s,p.s);c.globalCompositeOperation="source-over";});c.restore();c.globalAlpha=1;
  B.fx=B.fx.filter(f=>t-f.born<f.life);B.fx.forEach(f=>{const k=(t-f.born)/f.life;
    if(f.num){const up=Math.min(1,k*3.2),bounce=k<.32?-Math.sin(up*Math.PI)*16:-(k-.32)*10,sc=f.crit?(k<.12?1+(.12-k)*8:1.25):(k<.1?1+(.1-k)*5:1);
      c.save();c.globalAlpha=k>.7?(1-k)/.3:1;c.translate(f.x+(f.vx||0)*k,f.y+bounce);c.scale(sc,sc);bText(c,f.t,0,0,f.crit?"#ffd96a":f.col,f.crit?13:10,700,"center","CMLabel");if(f.crit)bText(c,"CRIT!",0,-13,"#fff3cf",6,400,"center","CMLabel");c.restore();}
    else{c.globalAlpha=1-k;bText(c,f.t,f.x,f.y-k*18,f.col,6.4,400,"center","CMLabel");c.globalAlpha=1;}});
  if(B7.turn){const k=(t-B7.turn.born)/900;if(k<1){const a=k<.2?k/.2:k>.75?(1-k)/.25:1;c.save();c.globalAlpha=a;
      const pc=B7.turn.who,lab=pc?(pc===ME()?"YOUR TURN":`${(PARTY_DEF[pc].short||PARTY_DEF[pc].name).toUpperCase()}'S TURN`):`${(B7.turn.foe.name||"").toUpperCase()}`;
      const yy=72,sw=lerp(0,480,Math.min(1,k*4));const g=c.createLinearGradient(240-sw/2,0,240+sw/2,0);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(.5,pc?"rgba(40,30,80,.75)":"rgba(80,10,20,.7)");g.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=g;c.fillRect(0,yy-11,480,18);
      bText(c,lab,240+(1-Math.min(1,k*5))*-30,yy+2.5,pc?"#ffd96a":"#ffb0a0",pc?10:8,400,"center","CMFellSC");c.restore();}else B7.turn=null;}
  drawDice7(c,t);
  drawActs8(c,t);
  if(FX.flash>0){c.globalAlpha=FX.flash;c.fillStyle=FX.flashCol;c.fillRect(-10,-10,500,360);c.globalAlpha=1;FX.flash=Math.max(0,FX.flash-.1);}
  c.restore();
};}
/* the party stands a touch further back so the bigger sprites fit */
{const _lf=layoutFoes;layoutFoes=function(){_lf();BATTLE.party.forEach((p,i)=>{p.x=336+i*22;p.y=90+i*21;p.w=46;p.h=52;});};}

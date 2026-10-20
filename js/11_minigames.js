/* ============================== minigames.js =========================== *
 * Tarot (Adela), Flippy Card (the Harlequin bet), Liar's Dice (the Inn),
 * Lockpicking (Lucky), the River Surge (Wytchwood), the Chase (the
 * Hand-Taker), the Spirit Board (Ouija), and the Harpsichord duet. */
const mg=$("mgcv"),mx=mg.getContext("2d");mx.imageSmoothingEnabled=false;
function mgOpen(){$("minigame").style.display="flex";const s=Math.max(.5,Math.min((window.innerWidth-20)/480,(window.innerHeight-110-(document.body.classList.contains("touch")?190:0))/336));mg.style.width=480*s+"px";mg.style.height=336*s+"px";}
function mgClose(){$("minigame").style.display="none";$("mgui").innerHTML="";}
function mgUI(h){$("mgui").innerHTML=h;}
async function minigame(name,opt){
  const f=MG[name];if(!f)return true;
  const prev=MUS.want;
  const r=await f(opt||{});
  mgClose();if(prev)playSong(prev);
  return r;
}
function mgLoop(fn){return new Promise(res=>{let last=performance.now(),done=false;const end=v=>{done=true;res(v);};const step=t=>{if(done)return;const dt=Math.min(.05,(t-last)/1000);last=t;try{fn(dt,t,end);}catch(e){console.error('mg',e&&e.stack||e);}requestAnimationFrame(step);};requestAnimationFrame(step);});}
function mgText(t,x,y,col,size,align){mx.fillStyle=col||"#efe3c4";mx.font=`bold ${size||10}px monospace`;mx.textAlign=align||"center";mx.fillText(t,x,y);mx.textAlign="left";}
const MG={};

/* ---------------------------- TAROT ------------------------------------ */
const TAROT=[
  {pc:"lucky",card:"THE CHARIOT",lines:["Freedom.","Breaking free from self-doubt.","Banishing your inner demons.","Trust yourself."],boon:"+1 to hit (Lucky)",flag:"tarot_lucky"},
  {pc:"poppi",card:"THE LOVERS",lines:["Love.","Someone came — or will come — into your life and knock it off its axis.","Don't let love overtake logic."],boon:"+2 to healing received (Poppi)",flag:"tarot_poppi"},
  {pc:"azareth",card:"TEMPERANCE",lines:["Change in evidence.","Look for the good in the bad.","Embrace the change to come."],boon:"+1 spell slot (Azareth)",flag:"tarot_azareth"},
  {pc:"tessie",card:"WHEEL OF FORTUNE",lines:["Everything will change.","Fate can be scary without control.","Everything is a result of your choices — but you can always pick a new one."],boon:"+1 AC (Tessie)",flag:"tarot_tessie"},
  {pc:"krodha",card:"THE HANGED MAN",lines:["The world may feel upside down.","You may feel powerless, trapped.","Live in the moment. Be patient. Let it come to you."],boon:"+1 AC (Krodha)",flag:"tarot_krodha"},
];
MG.tarot=async()=>{
  mgOpen();playSong("house");
  for(let i=0;i<TAROT.length;i++){
    const C=TAROT[i];let flip=0;const t0=performance.now();
    mgUI(`<b style="color:var(--moon)">${nameOf(C.pc)}</b>'s card… <span class="press">(A to reveal)</span>`);
    let revealed=false;const h=pushH(k=>{if(k==="A")revealed=true;});
    await mgLoop((dt,t,end)=>{
      mx.fillStyle="#150f22";mx.fillRect(0,0,480,336);
      for(let s=0;s<40;s++){mx.fillStyle="rgba(241,220,160,"+(.2+.2*Math.sin(t/500+s))+")";mx.fillRect((s*97)%480,(s*53)%336,1,1);}
      TAROT.forEach((c2,j)=>{if(j<i){drawCard(40+j*80,250,.45,c2.card,true);}});
      if(revealed)flip=Math.min(1,flip+dt*2.5);
      drawCard(240,150,1,C.card,flip>.5,Math.abs(Math.cos(flip*Math.PI)));
      const por=portraitImg(C.pc);if(por)mx.drawImage(por,20,20,64,64);
      mgText(nameOf(C.pc),52,98,"#f1dca0",9);
      if(flip>=1){C.lines.forEach((l,k)=>mgText(l,370,70+k*18,"#efe3c4",8));mgText("✦ "+C.boon,370,70+C.lines.length*18+10,"#9fe0b0",8);}
      if(flip>=1&&!end.fired){end.fired=1;setTimeout(()=>end(),50);}
    });
    popH(h);setF(C.flag);SFX.magic();
    mgUI(`<b style="color:var(--moon)">${C.card}</b> — ${esc(C.boon)} <span class="press">(A)</span>`);await waitKey();
  }
  badge("tarot");return true;
};
function drawCard(cx,cy,s,title,face,sq){
  sq=sq===undefined?1:sq;const w=90*s*Math.max(.05,sq),h=140*s;
  mx.fillStyle="#000";mx.fillRect(cx-w/2-2,cy-h/2-2,w+4,h+4);
  if(!face){mx.fillStyle="#3a1f4a";mx.fillRect(cx-w/2,cy-h/2,w,h);mx.strokeStyle="#e3b64f";mx.strokeRect(cx-w/2+4,cy-h/2+4,w-8,h-8);
    mx.fillStyle="#e3b64f";mx.beginPath();mx.arc(cx,cy,12*s*sq,0,7);mx.fill();mx.fillStyle="#3a1f4a";mx.beginPath();mx.arc(cx+5*s*sq,cy-3*s,11*s*sq,0,7);mx.fill();return;}
  mx.fillStyle="#efe3c4";mx.fillRect(cx-w/2,cy-h/2,w,h);mx.strokeStyle="#3a1f4a";mx.lineWidth=2;mx.strokeRect(cx-w/2+4,cy-h/2+4,w-8,h-8);
  mx.fillStyle="#3a1f4a";mx.beginPath();mx.arc(cx,cy-10*s,22*s*sq,0,7);mx.fill();mx.fillStyle="#e3b64f";mx.beginPath();mx.arc(cx,cy-10*s,14*s*sq,0,7);mx.fill();
  if(sq>.5){mx.fillStyle="#3a1f4a";mx.font=`bold ${Math.round(8*s)}px monospace`;mx.textAlign="center";mx.fillText(title,cx,cy+h/2-14*s);mx.textAlign="left";}
}
function waitKey(){return new Promise(r=>{const h=pushH(k=>{if(k==="A"||k==="B"||k==="START"){popH(h);r(k);}});});}

/* ---------------------------- FLIPPY CARD (Harlequin's bet) ------------ */
MG.flippy=async()=>{
  mgOpen();SFX.fiddle();
  mgUI("Follow the <b style='color:var(--moon)'>JESTER</b>. The Harlequin shuffles… ←/→ then A.");
  const pos=[0,1,2];let jester=1;let phase="show",t0=performance.now(),sel=1,swaps=0,swapA=-1,swapB=-1,swapT=0;
  const h=pushH(k=>{if(phase!=="pick")return;if(k==="left"){sel=(sel+2)%3;SFX.sel();}if(k==="right"){sel=(sel+1)%3;SFX.sel();}if(k==="A")phase="reveal";});
  let result=null;
  await mgLoop((dt,t,end)=>{
    mx.fillStyle="#1a0f14";mx.fillRect(0,0,480,336);mgText("THE HARLEQUIN'S BET",240,30,"#e3b64f",14);
    const e=t-t0;
    if(phase==="show"&&e>1300){phase="shuffle";t0=t;}
    if(phase==="shuffle"){if(swapA<0||t-swapT>420){if(swaps>=7){phase="pick";swapA=-1;}else{swapA=ri(0,2);swapB=(swapA+ri(1,2))%3;swapT=t;swaps++;SFX.pick();}}}
    for(let slot=0;slot<3;slot++){
      let cx=120+slot*120;
      if(phase==="shuffle"&&swapA>=0){const k=Math.min(1,(t-swapT)/400);if(slot===swapA)cx=lerp(120+swapA*120,120+swapB*120,k);if(slot===swapB)cx=lerp(120+swapB*120,120+swapA*120,k);
        if(k>=1&&slot===swapA){/*apply*/}}
      const face=phase==="show"||phase==="reveal";
      drawCard(cx,170,.8,slot===jester?"JESTER":"FOOL",face);
      if(phase==="pick"&&slot===sel){mx.fillStyle="#f1dca0";mx.fillText("▲",cx-4,250);}
    }
    if(phase==="shuffle"&&swapA>=0&&t-swapT>=400){if(jester===swapA)jester=swapB;else if(jester===swapB)jester=swapA;swapA=-1;}
    if(phase==="reveal"&&result===null){result=sel===jester;(result?SFX.win:SFX.bad)();t0=t;}
    if(phase==="reveal"){mgText(result?"LUCKY WINS THE FLIPPY CARD!":"The Harlequin cackles…",240,290,result?"#9fe0b0":"#e05a5a",12);if(t-t0>1600)end();}
  });
  popH(h);return result;
};

/* ---------------------------- LIAR'S DICE ------------------------------ */
MG.liarsdice=async()=>{
  mgOpen();playSong("village");
  addGold(-5);
  const P=[{n:"Lucky",dice:3,you:true},{n:"Ronald",dice:3},{n:"Wilma",dice:3}];
  let turn=0,bid=null,msg="Each player shakes three dice under a cup. Bid on how many of a face are on the WHOLE table (1s are wild).";
  let hands=[];const rollAll=()=>{hands=P.map(p=>Array.from({length:p.dice},()=>d(6)).sort());};rollAll();
  const count=f=>hands.flat().filter(v=>v===f||v===1).length;
  let reveal=false,winner=null,myQ=1,myF=2;
  const total=()=>P.reduce((s,p)=>s+p.dice,0);
  const render=()=>{mx.fillStyle="#1d140e";mx.fillRect(0,0,480,336);mx.fillStyle="#3a2414";mx.fillRect(20,40,440,230);mx.fillStyle="#2c5a2e";mx.fillRect(28,48,424,214);
    mgText("LIAR'S DICE · Crooked Moon rules · pot 15gp",240,28,"#e3b64f",10);
    P.forEach((p,i)=>{const y=74+i*64;mgText(p.n+(p.dice?` (${p.dice})`:" — OUT"),90,y,i===turn&&!reveal?"#f1dca0":"#efe3c4",10);
      hands[i].forEach((v,k)=>{const x=150+k*34;mx.fillStyle="#efe3c4";mx.fillRect(x,y-18,26,26);if(p.you||reveal){mx.fillStyle="#1d140e";pips(x,y-18,v);}else{mx.fillStyle="#6a4a2a";mx.fillRect(x+3,y-15,20,20);}});});
    mgText(bid?`Current bid: ${bid.q} × ${bid.f}s (by ${P[bid.by].n})`:"No bid yet.",240,286,"#9fe0b0",10);
    mgText(msg,240,306,"#efe3c4",8);
    if(turn===0&&!reveal&&winner===null)mgText(`Your bid: ${myQ} × ${myF}s   (←/→ face · ↑/↓ count · A bid · B call LIAR)`,240,326,"#f1dca0",8);};
  const pips=(x,y,v)=>{const s=[[],[[13,13]],[[7,7],[19,19]],[[7,7],[13,13],[19,19]],[[7,7],[19,7],[7,19],[19,19]],[[7,7],[19,7],[13,13],[7,19],[19,19]],[[7,7],[19,7],[7,13],[19,13],[7,19],[19,19]]][v];s.forEach(([a,b])=>mx.fillRect(x+a-2,y+b-2,4,4));};
  const valid=(q,f)=>!bid||q>bid.q||(q===bid.q&&f>bid.f);
  const aiAct=async i=>{await sleep(900);
    const mine=hands[i];const exp=f=>mine.filter(v=>v===f||v===1).length+(total()-mine.length)/3;
    if(bid&&bid.q>exp(bid.f)+1.2&&Math.random()<.8)return {call:true};
    let best=null;for(let f=2;f<=6;f++){let q=Math.max(bid?bid.q:1,Math.round(exp(f)-.3));if(!valid(q,f))q++;if(!valid(q,f))continue;const risk=q-exp(f);if(!best||risk<best.risk)best={q,f,risk};}
    if(!best||best.risk>1.5)return {call:true};return {q:best.q,f:best.f};};
  let games=0,luckyWin=false;
  const h=pushH(k=>{if(turn!==0||reveal||winner!==null)return;
    if(k==="left"){myF=myF>2?myF-1:6;}if(k==="right"){myF=myF<6?myF+1:2;}if(k==="up")myQ=Math.min(total(),myQ+1);if(k==="down")myQ=Math.max(1,myQ-1);
    if(k==="A"){if(valid(myQ,myF)){bid={q:myQ,f:myF,by:0};msg=`Lucky bids ${myQ} × ${myF}s.`;SFX.blip();turn=next(0);aiLoop();}else{msg="Bid must be higher!";SFX.bad();}}
    if(k==="B"&&bid){callLiar(0);}});
  const next=i=>{let j=i;do{j=(j+1)%3;}while(!P[j].dice);return j;};
  const callLiar=async i=>{reveal=true;const c=count(bid.f);const liar=c<bid.q;const loser=liar?bid.by:i;
    msg=`${P[i].n} calls LIAR! There are ${c} × ${bid.f}s. ${P[loser].n} loses a die.`;SFX.dice();
    await sleep(2200);P[loser].dice--;reveal=false;bid=null;rollAll();
    const alive=P.filter(p=>p.dice>0);if(!P[0].dice){winner="them";}else if(alive.length===1){winner="lucky";}
    turn=P[loser].dice?loser:next(loser);if(turn!==0)aiLoop();};
  const aiLoop=async()=>{while(turn!==0&&winner===null&&!reveal){const a=await aiAct(turn);if(winner!==null||reveal)return;
    if(a.call&&bid){await callLiar(turn);return;}bid={q:a.q||1,f:a.f||2,by:turn};msg=`${P[turn].n} bids ${bid.q} × ${bid.f}s.`;SFX.blip();turn=next(turn);
    if(turn===0){if(bid.f<6){myQ=bid.q;myF=bid.f+1;}else{myQ=bid.q+1;myF=2;}}}};
  await mgLoop((dt,t,end)=>{render();if(winner!==null&&!end.f){end.f=1;setTimeout(end,1600);}});
  popH(h);
  if(winner==="lucky"){addGold(15);SFX.win();STATE.stats.dice=(STATE.stats.dice||0)+1;badge("gambler");if(STATE.stats.dice>=3)badge("highRoller");mgUI("Lucky rakes in the pot: +15gp.");}
  else mgUI("The Wainwrights split your buy-in. \"Again tomorrow, skeleton?\"");
  await sleep(1200);return winner==="lucky";
};

/* ---------------------------- LOCKPICK --------------------------------- */
MG.lockpick=async(o)=>{
  mgOpen();const pins=(o.diff||1)+1;let got=0,miss=0,pos=0,dir=1,zone=rnd(.25,.7),zw=.16-(o.diff||1)*.02;
  const bonus=hasF("tarot_lucky")?.03:0;zw+=bonus;
  mgUI("Lucky's thieves' tools. Press <b>A</b> when the pick is in the <b style='color:var(--ok)'>green</b>. Three slips and the lock jams.");
  let res=null,flashT=0,flashC="";
  const h=pushH(k=>{if(k!=="A"||res!==null)return;if(pos>zone&&pos<zone+zw){got++;SFX.pick();SFX.unlock();flashT=performance.now();flashC="#9fe0b0";zone=rnd(.2,.72);if(got>=pins)res=true;}
    else{miss++;SFX.bad();flashT=performance.now();flashC="#e05a5a";if(miss>=3)res=false;}});
  await mgLoop((dt,t,end)=>{
    pos+=dir*dt*(.55+got*.18);if(pos>1){pos=1;dir=-1;}if(pos<0){pos=0;dir=1;}
    mx.fillStyle="#141018";mx.fillRect(0,0,480,336);
    mgText("🔓 PICK THE LOCK",240,40,"#e3b64f",14);
    // lock body
    mx.fillStyle="#6a6470";mx.fillRect(170,70,140,120);mx.fillStyle="#3a3640";mx.fillRect(225,120,30,50);
    for(let i=0;i<pins;i++){mx.fillStyle=i<got?"#9fe0b0":"#2a2630";mx.fillRect(190+i*30,85,18,24);}
    mx.fillStyle="#2a2630";mx.fillRect(60,230,360,20);mx.fillStyle="#3a8a4a";mx.fillRect(60+zone*360,230,zw*360,20);
    mx.fillStyle="#f1dca0";mx.fillRect(60+pos*360-2,222,4,36);
    mgText(`pins ${got}/${pins} · slips ${miss}/3`,240,285,"#efe3c4",10);
    if(t-flashT<200){mx.fillStyle=flashC;mx.globalAlpha=.25;mx.fillRect(0,0,480,336);mx.globalAlpha=1;}
    if(res!==null&&!end.f){end.f=1;mgText(res?"*click*":"The pick slips. Jammed.",240,315,res?"#9fe0b0":"#e05a5a",12);setTimeout(end,900);}
  });
  popH(h);
  if(res){STATE.stats.locks=(STATE.stats.locks||0)+1;if(STATE.stats.locks>=5)badge("lockpicker");}
  else toast("The lock resists. Try again.","bad");
  return res;
};

/* ---------------------------- RIVER SURGE ------------------------------ */
MG.river=async()=>{
  mgOpen();playSong("battle");
  mgUI("The river rushes BACK! Cross the riverbed — ←/→ to dodge logs and surges, ↑ to push forward. Hits hurt.");
  let px2=240,prog=0,hits=0,inv=0,obs=[],spawn=0,T0=performance.now();
  const L=pushH(()=>{});
  const res=await mgLoop((dt,t,end)=>{
    const sp=KEY.up?70:45;prog+=dt*sp;if(KEY.left)px2-=dt*170;if(KEY.right)px2+=dt*170;px2=clamp(px2,70,410);
    spawn-=dt;if(spawn<=0){spawn=rnd(.35,.7);const log=Math.random()<.7;obs.push({x:rnd(70,410),y:-20,w:log?rnd(40,80):24,h:log?14:24,v:rnd(120,190)+prog*.3,log,rot:0});}
    obs.forEach(o=>{o.y+=o.v*dt;o.x+=Math.sin(t/300+o.w)*20*dt;});obs=obs.filter(o=>o.y<360);
    inv-=dt;
    obs.forEach(o=>{if(inv<=0&&Math.abs(o.x-px2)<o.w/2+8&&Math.abs(o.y-270)<o.h/2+8){hits++;inv=1;SFX.hit();shake(6);}});
    // draw
    mx.fillStyle="#2a3a3a";mx.fillRect(0,0,480,336);
    const off=(t/8)%40;for(let y=-40;y<336;y+=40){mx.fillStyle="#335a5a";mx.fillRect(60,y+off,360,20);mx.fillStyle="#2e4a4a";mx.fillRect(60,y+off+20,360,20);}
    mx.fillStyle="#3a2e24";mx.fillRect(0,0,60,336);mx.fillRect(420,0,60,336);
    for(let i=0;i<12;i++){mx.fillStyle="#1c2a1c";mx.beginPath();mx.arc(20+(i%2)*15,((i*60+t/5)%400)-30,16,0,7);mx.fill();mx.beginPath();mx.arc(455-(i%2)*15,((i*60+t/5+30)%400)-30,16,0,7);mx.fill();}
    obs.forEach(o=>{if(o.log){mx.fillStyle="#6a4424";mx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h);mx.fillStyle="#8a5a30";mx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,3);}else{mx.fillStyle="#9fe0f0";mx.globalAlpha=.7;mx.beginPath();mx.arc(o.x,o.y,12,0,7);mx.fill();mx.globalAlpha=1;}});
    if(inv<=0||((t/80|0)%2)){mx.save();mx.translate(px2-24,246);mx.scale(2,2);drawChar(mx,0,0,PARTY_DEF[STATE.lead].look,"up",(t/150|0),{moving:true});mx.restore();}
    mx.fillStyle="#000";mx.fillRect(10,10,460,10);mx.fillStyle="#9fe0b0";mx.fillRect(10,10,460*Math.min(1,prog/520),10);
    mgText(`HITS ${hits}`,440,36,"#e05a5a",10);
    if(prog>=520&&!end.f){end.f=1;setTimeout(()=>end({hits}),600);}
  });
  popH(L);
  for(let i=0;i<res.hits;i++){const id=pick(PARTY_ORDER);const n=d(4)+1;STATE.pcs[id].hp=Math.max(1,STATE.pcs[id].hp-n);}
  if(res.hits)toast(`The surge batters the party (${res.hits} hits)`,"bad");else toast("Not a scratch — soaked, but whole!","ghost");
  return res;
};

/* ---------------------------- CHASE ------------------------------------ */
MG.chase=async()=>{
  mgOpen();playSong("boss");
  mgUI("The Hand-Taker flees with the idol! Mash <b>A</b> to run — press the arrow shown when it turns a corner!");
  let meter=40,them=60,dirCue=null,cueT=0,tt=0,ok=null;
  const dirs=["left","right","up","down"],arrow={left:"◀",right:"▶",up:"▲",down:"▼"};
  const h=pushH(k=>{if(ok!==null)return;if(k==="A"){meter+=4.2;SFX.step();}else if(dirCue&&k===dirCue){meter+=12;dirCue=null;SFX.ok();}else if(dirCue&&dirs.includes(k)){meter-=8;dirCue=null;SFX.bad();}});
  await mgLoop((dt,t,end)=>{
    tt+=dt;meter-=dt*9;cueT-=dt;if(cueT<=0){dirCue=pick(dirs);cueT=rnd(1.4,2.2);}
    const gap=them-meter;
    mx.fillStyle="#0a0710";mx.fillRect(0,0,480,336);
    for(let i=0;i<10;i++){mx.fillStyle="#1a1520";mx.fillRect(((i*60-tt*200)%600+600)%600-60,60,30,210);}
    mx.fillStyle="#2a2230";mx.fillRect(0,270,480,66);
    const hx=320+Math.min(120,Math.max(0,gap*3)),hy=200;const im=IMG["mon:Old_Ways_Chosen"];if(im)mx.drawImage(im,hx-30,hy-60,60,72);
    mx.save();mx.translate(120,190);mx.scale(2.5,2.5);drawChar(mx,0,0,PARTY_DEF[STATE.lead].look,"right",(t/90|0),{moving:true});mx.restore();
    if(dirCue){mgText(arrow[dirCue],240,110,"#f1dca0",48);}
    mx.fillStyle="#000";mx.fillRect(40,300,400,12);mx.fillStyle=gap<15?"#9fe0b0":"#e3b64f";mx.fillRect(40,300,400*clamp(1-gap/80,0,1),12);
    mgText("CLOSE THE GAP",240,295,"#efe3c4",8);
    if(gap<=0&&ok===null){ok=true;SFX.win();}
    if(tt>9&&ok===null){ok=false;SFX.bad();}
    if(ok!==null&&!end.f){end.f=1;mgText(ok?"CAUGHT IT!":"It slips away into the smoke…",240,160,ok?"#9fe0b0":"#e05a5a",14);setTimeout(end,1000);}
  });
  popH(h);return ok;
};

/* ---------------------------- OUIJA ------------------------------------ */
const OUIJA_QA=[["Who are you?","PATRINI"],["What's your favorite color?","NO"],["How did you get here?","HAG"],["Where is the hag?","ATTIC"],["Where are the Druskenvalds?","UPSTAIRS"],
  ["Are you trapped here?","YES"],["What do you need to be untrapped?","SIX MEMENTOS"],["What are mementos?","HEIRLOOMS"],["What are the heirlooms?","GEM KEY CUP DOLL BEAR PIN"],["Where is the next heirloom?","GARDEN"],["What does A.D. stand for?","ADELE DRUSKENVALD"]];
MG.ouija=async()=>{
  mgOpen();playSong("house");
  const who=await ask(null,"Who puts their fingers on the planchette?",["Everyone except Azareth (she sits out)","Everyone","Just Poppi and Krodha"]);
  const touchers=who===0?["lucky","poppi","krodha","tessie"]:who===1?PARTY_ORDER.slice():["poppi","krodha"];
  let asked=0;const done=new Set();
  mgUI("The fireplace BURSTS into flame the moment you say hello.");SFX.thunder();
  const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const pos=ch=>{if(ch===" ")return {x:240,y:250};if(ch==="Y")return {x:90,y:60};if(ch==="N"&&false)return {x:390,y:60};const i=letters.indexOf(ch);const row=i<13?0:1;const col=row?i-13:i;return {x:60+col*28,y:130+row*50-Math.sin(col/12*Math.PI)*16};};
  let pl={x:240,y:200},spelled="",target=null,queue=[];
  const draw=(t)=>{mx.fillStyle="#1a1008";mx.fillRect(0,0,480,336);mx.fillStyle="#8a6a3a";mx.fillRect(20,30,440,260);mx.fillStyle="#a8844a";mx.fillRect(28,38,424,244);
    mgText("YES",90,64,"#2a1a0a",14);mgText("NO",390,64,"#2a1a0a",14);mgText("GOOD BYE",240,272,"#2a1a0a",12);
    for(let i=0;i<26;i++){const p=pos(letters[i]);mgText(letters[i],p.x,p.y,"#2a1a0a",13);}
    mx.fillStyle="rgba(240,220,180,.85)";mx.beginPath();mx.moveTo(pl.x,pl.y-18);mx.lineTo(pl.x+14,pl.y+10);mx.lineTo(pl.x-14,pl.y+10);mx.fill();mx.fillStyle="#3a2a1a";mx.beginPath();mx.arc(pl.x,pl.y-2,5,0,7);mx.fill();
    mgText("A.D.",pl.x,pl.y+8,"#3a2a1a",6);
    mgText(spelled,240,318,"#f1dca0",14);
    const f=(t/120|0)%3;mx.fillStyle="#e8742a";mx.fillRect(440,300-f*3,20,20+f*3);};
  const spell=async word=>{spelled="";for(const ch of word){const p=ch==="Y"&&word==="YES"?{x:90,y:60}:word==="NO"?{x:390,y:60}:pos(ch);
      const s={...pl};const t0=performance.now();await mgLoop((dt,t,end)=>{const k=Math.min(1,(t-t0)/(ch===" "?200:420));pl.x=lerp(s.x,p.x,k)+Math.sin(t/60)*1.5;pl.y=lerp(s.y,p.y,k);draw(t);if(k>=1)end();});
      spelled+=ch;if(word==="YES"||word==="NO"){spelled=word;SFX.pick();break;}SFX.pick();await sleep(120);}};
  const iv=setInterval(()=>draw(performance.now()),50);
  while(true){
    const opts=OUIJA_QA.filter((q,i)=>!done.has(i)).map(q=>q[0]);
    if(asked>=5||!opts.length)opts.push("Say goodbye");
    const c=await ask(null,"Ask the spirit board…",opts);
    if(opts[c]==="Say goodbye")break;
    const idx=OUIJA_QA.findIndex(q=>q[0]===opts[c]);done.add(idx);asked++;
    clearInterval(iv);await spell(OUIJA_QA[idx][1]);
    if(OUIJA_QA[idx][1]==="GARDEN")setF("hintGarden");
    await sleep(500);
  }
  clearInterval(iv);
  await spell("FIND MY SON");await sleep(300);shake(12);SFX.scream();
  await spell("HE LIVES");
  for(const id of touchers){if(id==="lucky"&&who===0)continue;STATE.pcs[id].hp=Math.max(1,STATE.pcs[id].hp-(id==="poppi"?5:10));}
  mgUI("FIND MY SON! HE LIVES! — the board repeats it, over and over. Psychic damage burns through everyone touching the planchette"+(touchers.includes("poppi")?" (Poppi resists — innocent mind).":"."));
  await sleep(2400);
  await say(null,"Lucky bolts into the conservatory the second the heirlooms are listed. Azareth follows him — she never touched the board to begin with.");
  return true;
};

/* ---------------------------- HARPSICHORD ------------------------------ */
MG.harpsichord=async()=>{
  mgOpen();MUS.cur=null;
  mgUI("Duet with the ghost of Joseph Patrini! Press ←↓↑→ as the notes reach the line.");
  const lanes=["left","down","up","right"],lx=[150,210,270,330],freq=[262,330,392,523];
  const song=[];let tm=1.2;for(let i=0;i<32;i++){song.push({lane:[0,2,1,3,2,0,3,1][i%8]^(i>15?1:0),t:tm,hit:null});tm+=i%4===3?.72:.36;}
  let T0=performance.now(),score=0,judged=0,msg="",msgT=0;
  const h=pushH(k=>{const L=lanes.indexOf(k);if(L<0)return;const now=(performance.now()-T0)/1000;
    const n=song.find(s=>s.lane===L&&s.hit===null&&Math.abs(s.t-now)<.2);
    if(n){n.hit=Math.abs(n.t-now)<.09?2:1;score+=n.hit;judged++;SFX.harp(freq[L]*(n.hit===2?1:1));msg=n.hit===2?"PERFECT":"GOOD";msgT=performance.now();}else{SFX.miss();}});
  await mgLoop((dt,t,end)=>{
    const now=(t-T0)/1000;
    mx.fillStyle="#120c1a";mx.fillRect(0,0,480,336);
    // harpsichord
    mx.fillStyle="#3a2214";mx.fillRect(120,250,240,60);for(let i=0;i<24;i++){mx.fillStyle=i%7===2||i%7===6?"#111":"#efe3c4";mx.fillRect(124+i*10,256,8,30);}
    lanes.forEach((l,i)=>{mx.strokeStyle="rgba(241,220,160,.25)";mx.beginPath();mx.moveTo(lx[i],20);mx.lineTo(lx[i],240);mx.stroke();mgText(["◀","▼","▲","▶"][i],lx[i],236,"#f1dca0",12);});
    mx.fillStyle="rgba(241,220,160,.5)";mx.fillRect(120,222,240,2);
    song.forEach(s=>{if(s.hit!==null)return;if(now-s.t>.22){s.hit=0;judged++;msg="MISS";msgT=performance.now();return;}const y=222-(s.t-now)*180;if(y<-10||y>262)return;mx.fillStyle=["#c8384a","#4fb6c9","#e0782a","#6fbf73"][s.lane];mx.fillRect(lx[s.lane]-12,y-5,24,10);});
    // ghost Patrini
    mx.globalAlpha=.6+.2*Math.sin(t/300);mx.save();mx.translate(390,180);mx.scale(2.5,2.5);drawChar(mx,0,0,LOOK.patrini,"left",0,{});mx.restore();mx.globalAlpha=1;
    mx.save();mx.translate(60,180);mx.scale(2.5,2.5);drawChar(mx,0,0,PARTY_DEF.lucky.look,"right",0,{});mx.restore();
    if(performance.now()-msgT<400)mgText(msg,240,120,msg==="PERFECT"?"#e3b64f":msg==="MISS"?"#c8384a":"#9fe0b0",16);
    mgText(`♪ ${score}`,440,30,"#f1dca0",10);
    if(judged>=song.length&&!end.f){end.f=1;setTimeout(end,700);}
  });
  popH(h);const ratio=score/(song.length*2);
  if(ratio>=.9)badge("encore");
  mgUI(`Duet complete — ${Math.round(ratio*100)}%`);await sleep(900);
  return ratio;
};

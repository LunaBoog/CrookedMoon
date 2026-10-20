/* ================================ battle.js ============================ *
 * Turn-based, dice-forward battles. Every attack rolls a real d20 vs AC,
 * every save is a d20 vs DC, crits double the dice — shown on screen.
 * The 5 PCs, their class kits, statuses, SECRETS, summons, boss mechanics. */
const BATTLE={on:false};
const bcv=$("bcv"),bx=bcv.getContext("2d");bx.imageSmoothingEnabled=false;
const SAVES={azareth:{STR:1,DEX:3,CON:1,INT:0,WIS:5,CHA:1},lucky:{STR:-1,DEX:5,CON:1,INT:2,WIS:1,CHA:3},poppi:{STR:-1,DEX:3,CON:4,INT:0,WIS:1,CHA:4},
  krodha:{STR:2,DEX:5,CON:1,INT:0,WIS:2,CHA:0},tessie:{STR:3,DEX:5,CON:1,INT:0,WIS:2,CHA:0}};
function blog(t){$("blog").innerHTML=t;}
const bwait=ms=>sleep(STATE.fast?ms*.55:ms);

async function battle(encId,opt){
  opt=opt||{};const enc=ENC[encId];if(!enc){console.warn("no enc",encId);return "win";}
  STATE.stats.battles++;
  const prevSong=MUS.want;
  playSong(enc.music||"battle");
  // intro swirl
  await battleSwirl();
  const B=BATTLE;Object.assign(B,{on:true,enc,encId,round:1,foes:[],party:[],allies:[],order:[],turn:0,fx:[],dice:null,ritual:0,timer:enc.timer||0,t0:performance.now(),result:null,msg:"",koAny:false,bg:enc.bg});
  const pcs=enc.solo?[enc.solo]:PARTY_ORDER;
  pcs.forEach((id,i)=>{const s=pcStat(id),p=STATE.pcs[id];B.party.push({side:"pc",id,key:id,name:nameOf(id),hp:p.hp,hpMax:s.hpMax,ac:s.ac,dex:PARTY_DEF[id].dex,st:{},temp:0,dead:p.hp<=0,slot:i});});
  const addFoe=(k,i)=>{const M=MON[k];const f={side:"foe",id:k+"_"+i+"_"+Math.random().toString(36).slice(2,5),key:k,name:M.name,hp:M.hp,hpMax:M.hp,ac:M.ac,dex:M.dex||0,st:{},temp:0,M,boss:M.boss,big:M.big};
    if(enc.hpPct)f.hp=Math.round(M.hp*enc.hpPct);B.foes.push(f);seeMon(k);return f;};
  const names={};enc.foes.forEach((k,i)=>{const f=addFoe(k,i);names[k]=(names[k]||0)+1;});
  // number duplicate names
  const cnt={};B.foes.forEach(f=>{if(names[f.key]>1){cnt[f.key]=(cnt[f.key]||0)+1;f.name+=" "+String.fromCharCode(64+cnt[f.key]);}});
  layoutFoes();
  $("battle").style.display="block";$("bmenu").style.display="none";
  const loop=()=>{if(!B.on)return;drawBattle();requestAnimationFrame(loop);};loop();
  blog(esc(enc.intro||("Enemies appear: "+B.foes.map(f=>f.name).join(", ")+"!")));
  await bwait(900);await waitA();
  // initiative
  const all=[...B.party.filter(p=>!p.dead),...B.foes];
  all.forEach(c=>c.init=d(20)+(c.dex||0)+(c.side==="pc"?0:0)+(opt.pre==="surprise"&&c.side==="pc"?10:0));
  B.order=all.sort((a,b)=>b.init-a.init);
  blog("🎲 Initiative: "+B.order.map(c=>`${esc(c.name.split(" ")[0])} ${c.init}`).join(" · "));SFX.dice();await bwait(1100);
  // main loop
  let guard=0;
  while(!B.result&&guard++<400){
    for(B.turn=0;B.turn<B.order.length&&!B.result;B.turn++){
      const c=B.order[B.turn];if(c.dead||c.hp<=0&&c.side!=="pc")continue;if(c.side==="pc"&&c.hp<=0)continue;
      B.cur=c;
      const skip=await startOfTurn(c);if(B.result)break;
      if(!skip){
        if(c.side==="pc")await pcTurn(c);else if(c.side==="ally")await allyTurn(c);else await foeTurn(c);
      }
      endCheck();
    }
    if(B.result)break;
    B.round++;
    // summons expire
    B.order.filter(c=>c.side==="ally"&&!c.dead).forEach(a=>{if(--a.life<=0){a.dead=true;blog(esc(a.name)+" slips away.");}});
    if(B.enc.timer){await bloodTide();endCheck();}
  }
  const res=B.result;
  await battleEnd(res,opt);
  $("battle").style.display="none";$("bmenu").style.display="none";B.on=false;
  playSong(prevSong||curMap().music);
  updateHUD();
  return B.result||res;
}
function waitA(){return new Promise(r=>{const h=pushH(k=>{if(k==="A"||k==="B"||k==="START"){popH(h);r();}});setTimeout(()=>{popH(h);r();},STATE.fast?700:1600);});}
async function battleSwirl(){
  SFX.hit();for(let i=0;i<3;i++){FX.flash=1;FX.flashCol=i%2?"#000":"#fff";await sleep(90);}
}
function layoutFoes(){
  const B=BATTLE,n=B.foes.length;
  B.foes.forEach((f,i)=>{const big=f.big?1.5:f.boss?1.25:1;f.w=96*big;f.h=96*big;
    f.x=n===1?160:40+i*(230/Math.max(1,n-1))+ (n===1?0:0);f.y=n>2&&i%2?150:130;if(n===1){f.x=150;f.y=120;}f.x=Math.min(f.x,250);});
  B.party.forEach((p,i)=>{p.x=345+i*14-(B.party.length===1?0:0);p.y=86+i*30;});
}
function alive(side){const B=BATTLE;return side==="pc"?B.party.filter(p=>p.hp>0):side==="foe"?B.foes.filter(f=>f.hp>0&&!f.dead):B.order.filter(c=>c.side==="ally"&&!c.dead);}
function endCheck(){const B=BATTLE;if(!alive("foe").length&&B.enc.then&&!B.thenDone){B.thenDone=true;B.enc.then.forEach((k,i)=>{const M=MON[k];const nf={side:"foe",id:k+"_t"+i,key:k,name:M.name,hp:M.hp,hpMax:M.hp,ac:M.ac,dex:M.dex||0,st:{},temp:0,M,boss:M.boss};B.foes.push(nf);B.order.push(nf);seeMon(k);});layoutFoes();blog("…but part of it flies into another passenger, who MUTATES and lunges at you!");shake(8);SFX.scream();return;}
  if(!alive("foe").length)B.result="win";else if(!alive("pc").length)B.result=B.enc.solo?"rescued":"lose";}
function has(c,s){return c.st[s]>0;}
function addSt(c,s,turns){c.st[s]=Math.max(c.st[s]||0,turns);popText(c,stName(s),"#c8a8ff");}
function stName(s){return {restrained:"RESTRAINED",frightened:"FRIGHTENED",prone:"PRONE",poisoned:"POISONED",bane:"BANED",doomed:"DOOMED",marked:"MARKED",paralyzed:"PARALYZED",stunned:"STUNNED",
  confused:"CONFUSED",blinded:"BLINDED",dodge:"DODGING",hidden:"HIDDEN",turned:"TURNED",ironed:"IRON-BOUND",charmed:"CHARMED",painted:"IN A PAINTING",feinted:"FEINTED",disadv:"RATTLED",warded:"WARDED",trapped:"BOTTLED"}[s]||s.toUpperCase();}
async function startOfTurn(c){
  const B=BATTLE;
  if(B.protect&&B.protect.by===c)B.protect=null;
  // tick statuses owned by this combatant
  let skip=false;
  if(has(c,"poisoned")&&c.hp>0){const n=d(4);dealRaw(c,n,"#9c6");blog(`${esc(c.name)} suffers the plague (${n}).`);await bwait(600);if(c.hp<=0&&c.side!=="pc"){await killFoe(c);return true;}}
  for(const s of ["paralyzed","stunned","painted","turned","ironed","charmed","trapped"])if(has(c,s)){skip=true;blog(`${esc(c.name)} is ${stName(s).toLowerCase()} and can't act.`);await bwait(700);break;}
  if(!skip&&has(c,"confused")&&Math.random()<.5){skip=true;blog(`${esc(c.name)} stumbles around, confused.`);await bwait(700);}
  for(const s in c.st){if(["hidden","feinted","marked","doomed","warded"].includes(s))continue;if(c.st[s]>0)c.st[s]--;}
  if(c.st.dodge!==undefined&&c.side==="pc"){} // dodge lasts until own next turn -> cleared now
  if(c.side==="pc")delete c.st.dodge;
  return skip;
}
/* ---------------------------------- PC turn ------------------------------ */
function pcTurn(c){
  return new Promise(resolve=>{
    const id=c.id,B=BATTLE;let level="root",sel=0,items=[];
    const P=STATE.pcs[id];
    blog(`<b style="color:var(--moon)">${esc(c.name)}</b>'s turn. <span style="color:var(--dim)">Round ${B.round}</span>`);
    const menu=$("bmenu");menu.style.display="block";
    const build=()=>{
      items=[];
      if(level==="root"){
        const acts=PARTY_DEF[id].abil.filter(a=>abilUnlocked(id,a));
        const weapons=acts.filter(a=>["weapon","multi","spell"].includes(ABIL[a].kind)&&!ABIL[a].cost);
        weapons.forEach(a=>items.push({label:"⚔ "+ABIL[a].name,act:a,desc:ABIL[a].desc,cost:ABIL[a].dmg}));
        items.push({label:"✨ Skills & Spells",sub:"skills",desc:"Class abilities. Costs shown."});
        items.push({label:"🎒 Items",sub:"items",desc:"Potions, holy water — and things monsters fear."});
        const secretsUsable=secretOptions(id);if(secretsUsable.length)items.push({label:"🔑 SECRET",sub:"secret",desc:"Exploit a monster's weakness you've learned."});
        if(B.enc.ritual)items.push({label:"🧪 Disrupt the cauldron",act:"__disrupt",desc:"Kick the cauldron's fire apart (STR or INT, DC 13). Slows Vessla's ritual."});
        items.push({label:"🛡 Protect an ally",act:"__protect",desc:"Stand guard: attacks against an ally target YOU instead this round."+(hasFoe("crookedman")?"":"")});
        if(!B.enc.noFlee&&!B.enc.solo)items.push({label:"🏃 Run",act:"__run",desc:"Try to flee (60%)."});
      }else if(level==="skills"){
        PARTY_DEF[id].abil.filter(a=>abilUnlocked(id,a)).forEach(a=>{const A=ABIL[a];if(["weapon","multi","spell"].includes(A.kind)&&!A.cost)return;
          const ok=canPay(id,A,a);items.push({label:A.name,act:a,desc:A.desc,cost:costLabel(id,A,a),dis:!ok});});
        items.push({label:"← Back",back:1});
      }else if(level==="items"){
        Object.keys(STATE.items).filter(k=>STATE.items[k]>0&&ITEMS[k]&&ITEMS[k].use!=="key").forEach(k=>{const it=ITEMS[k];items.push({label:it.icon+" "+it.name,act:"item:"+k,cost:"×"+STATE.items[k],desc:it.desc});});
        if(!items.length)items.push({label:"(nothing usable)",dis:true});
        items.push({label:"← Back",back:1});
      }else if(level==="secret"){
        secretOptions(id).forEach(o=>items.push(o));items.push({label:"← Back",back:1});
      }
      sel=Math.min(sel,items.length-1);
      menu.innerHTML=`<div class="bh">${esc(c.name.toUpperCase())} · ${level==="root"?"ACTION":level.toUpperCase()}</div>`+
        items.map((it,i)=>`<button class="${i===sel?"sel":""}" ${it.dis?"disabled":""} data-i="${i}"><span>${esc(it.label)}</span><span class="c">${esc(it.cost||"")}</span></button>`).join("")+
        `<div class="desc">${esc((items[sel]||{}).desc||"")}</div>`;
      menu.querySelectorAll("button").forEach(b=>b.onclick=()=>{sel=+b.dataset.i;choose();});
    };
    const choose=async()=>{
      const it=items[sel];if(!it||it.dis)return;SFX.blip();
      if(it.back){level="root";sel=0;build();return;}
      if(it.sub){level=it.sub;sel=0;build();return;}
      popH(h);menu.style.display="none";
      const ok=await doAction(c,it.act,it);
      if(ok===false){menu.style.display="block";pushH(h);build();return;}
      resolve();
    };
    const h=pushH(k=>{
      if(k==="up"){sel=(sel+items.length-1)%items.length;SFX.sel();build();}
      else if(k==="down"){sel=(sel+1)%items.length;SFX.sel();build();}
      else if(k==="A")choose();
      else if(k==="B"){if(level!=="root"){level="root";sel=0;build();}}
      else if(k&&k[0]==="N"){const n=+k.slice(1)-1;if(items[n]){sel=n;choose();}}
    });
    build();
  });
}
function hasFoe(k){return BATTLE.foes.some(f=>f.key===k&&f.hp>0);}
function costLabel(id,A,a){const c=A.cost||{};if(c.slot)return c.slot+" slot";if(c.ki)return c.ki+" ki";if(c.sp)return c.sp+" SP";if(c.ammo)return "1 bullet";if(c.rest)return (restUsed(id,c.pool||a)?"used":"1/rest");if(c.battle)return (BATTLE["b_"+id+a]?"used":"1/battle");return "";}
function restUsed(id,a){return !!STATE.pcs[id].used[a];}
function canPay(id,A,a){const c=A.cost||{},P=STATE.pcs[id];if(c.slot&&P.slots<c.slot)return false;if(c.ki&&P.ki<c.ki)return false;if(c.sp&&P.sp<c.sp)return false;if(c.ammo&&P.ammo<1)return false;
  if(c.rest&&restUsed(id,c.pool||a))return false;if(c.battle&&BATTLE["b_"+id+a])return false;if(a==="sicCaster"&&!hasF("caster"))return false;return true;}
function pay(id,A,a){const c=A.cost||{},P=STATE.pcs[id];if(c.slot)P.slots-=c.slot;if(c.ki)P.ki-=c.ki;if(c.sp)P.sp-=c.sp;if(c.ammo)P.ammo--;if(c.rest)P.used[c.pool||a]=1;if(c.battle)BATTLE["b_"+id+a]=1;}
function secretOptions(id){
  const out=[];const B=BATTLE;
  const foes=alive("foe");
  foes.forEach(f=>{const s=f.M.secret;if(!s||!STATE.secrets[s])return;const S=SECRETS[s];
    const how=S.how;
    if(how.startsWith("item:")){const k=how.slice(5);if(countItem(k)>0&&!out.some(o=>o.act==="sec:"+s))out.push({label:`${ITEMS[k].icon} ${S.name} (${ITEMS[k].name})`,act:"sec:"+s,desc:S.text,cost:"×"+countItem(k)});}
    if(how==="act:feint"&&id==="lucky"&&!out.some(o=>o.act==="sec:"+s))out.push({label:"🃏 "+S.name+" (Feint)",act:"sec:"+s,desc:S.text});
    if(how==="act:caster"&&id==="tessie"&&hasF("caster")&&!out.some(o=>o.act==="sec:"+s))out.push({label:"🐕 "+S.name+" (Caster)",act:"sec:"+s,desc:S.text});
    if(how==="target:firebox"&&!out.some(o=>o.act==="sec:"+s))out.push({label:"🔥 "+S.name+" — hit the firebox",act:"sec:"+s,desc:S.text});
  });
  return out;
}
/* target picker */
function pickTarget(list,label){
  return new Promise(resolve=>{
    if(list.length===1){resolve(list[0]);return;}
    const B=BATTLE;let i=0;B.pick=list[i];
    blog(`${esc(label)} — choose a target (←/→, A). B to cancel.`);
    const h=pushH(k=>{
      if(k==="left"||k==="up"){i=(i+list.length-1)%list.length;B.pick=list[i];SFX.sel();}
      else if(k==="right"||k==="down"){i=(i+1)%list.length;B.pick=list[i];SFX.sel();}
      else if(k==="A"){popH(h);B.pick=null;resolve(list[i]);}
      else if(k==="B"){popH(h);B.pick=null;resolve(null);}
    });
    bcv.onclick=e=>{const r=bcv.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*480,my=(e.clientY-r.top)/r.height*336;
      const hit=list.find(t=>mx>t.x-10&&mx<t.x+(t.w||40)&&my>t.y-10&&my<t.y+(t.h||40));if(hit){popH(h);B.pick=null;bcv.onclick=null;resolve(hit);}};
  });
}
/* ---- the core roll ---- */
async function attackRoll(att,tgt,bonus,opt){
  opt=opt||{};
  let adv=0;
  if(has(tgt,"restrained")||has(tgt,"prone")||has(tgt,"paralyzed")||has(tgt,"stunned")||has(tgt,"feinted")||has(tgt,"blinded"))adv++;
  if(att.st&&has(att,"hidden"))adv++;
  if(has(att,"frightened")||has(att,"restrained")||has(att,"poisoned")||has(att,"blinded")||has(att,"disadv"))adv--;
  if(has(tgt,"dodge"))adv--;
  if(opt.adv)adv++;
  if(att.side==="foe"&&att.M&&att.M.pack&&!att.boss&&alive("foe").filter(f=>f.M.pack).length>2)adv++;
  const r1=d(20),r2=d(20);const nat=adv>0?Math.max(r1,r2):adv<0?Math.min(r1,r2):r1;
  let b=bonus;if(has(att,"bane"))b-=d(4);
  const ac=tgt.ac-(has(tgt,"doomed")?2:0);
  const critRange=has(tgt,"doomed")?19:20;
  const crit=nat>=critRange||has(tgt,"paralyzed")&&nat>1||(opt.forceCrit&&nat>1);
  const hit=nat!==1&&(crit||nat+b>=ac);
  if(has(tgt,"feinted"))delete tgt.st.feinted;
  await showDice(nat,b,"AC "+ac,hit,crit,adv);
  if(att.side==="pc"){if(nat===20){STATE.stats.nat20++;badge("nat20");}if(nat===1){STATE.stats.nat1++;badge("nat1");}if(crit){STATE.stats.crits++;if(STATE.stats.crits>=10)badge("critMachine");}}
  return {hit,crit,nat};
}
async function saveRoll(tgt,stat,dc){
  let b=0;if(tgt.side==="pc")b=SAVES[tgt.id][stat]||0;else b=Math.floor(((tgt.M.hp||10)/20))+(stat==="DEX"?tgt.dex:0)+(tgt.boss?2:0);
  if(tgt.side==="pc"&&has(tgt,"bane"))b-=d(4);
  const nat=d(20);const ok=nat===20||(nat!==1&&nat+b>=dc);
  await showDice(nat,b,stat+" save DC "+dc,ok,false,0,true);
  return ok;
}
function showDice(nat,bonus,vs,ok,crit,adv,isSave){
  const B=BATTLE;B.dice={nat,bonus,vs,ok,crit,adv,isSave,t:performance.now(),spin:true};SFX.dice();
  return new Promise(r=>setTimeout(()=>{B.dice.spin=false;(ok?(crit?SFX.crit:()=>{}):SFX.miss)();setTimeout(()=>{r();},STATE.fast?260:480);},STATE.fast?300:520));
}
function popText(c,t,col){BATTLE.fx.push({x:(c.x||0)+(c.w?c.w/2:20),y:(c.y||0)-4,t,col:col||"#fff",life:1100,born:performance.now()});}
function dealRaw(c,n,col){if(STATE.god&&c.side==="pc")n=0;if(c.temp>0){const a=Math.min(c.temp,n);c.temp-=a;n-=a;}c.hp=Math.max(0,c.hp-n);c.hurt=performance.now();popText(c,"-"+n,col||"#ff6a6a");
  if(c.side==="pc"){STATE.pcs[c.id].hp=c.hp;if(c.hp<=0){c.down=true;BATTLE.koAny=true;STATE.stats.kos++;popText(c,"DOWN!","#ff3a4a");SFX.bad();}}}
function mult(tgt,type){const M=tgt.M;if(!M)return 1;if(type==="radiant"&&M.type==="undead")return 1.5;if(has(tgt,"ironed"))return 1.5;return 1;}
async function damage(att,tgt,dmgExpr,type,crit,extra){
  let r=roll(dmgExpr,crit);let n=r.total+(extra||0);
  if(tgt.side==="foe"){n=Math.round(n*mult(tgt,type));}
  if(tgt.st.charmed&&tgt.side==="foe"){delete tgt.st.charmed;popText(tgt,"CHARM BROKEN","#ffd060");}
  if(tgt.st.turned){delete tgt.st.turned;}
  dealRaw(tgt,n);crit?shake(8):shake(3);(crit?SFX.crit:SFX.hit)();
  STATE.stats.dmg+=att&&att.side==="pc"?n:0;
  if(tgt.side==="foe"&&tgt.hp<=0)await killFoe(tgt);
  return n;
}
async function killFoe(f){f.dead=true;f.deathT=performance.now();STATE.defeated[f.key]=(STATE.defeated[f.key]||0)+1;popText(f,"DEFEATED","#ffd060");await bwait(400);}
function markedBy(tgt){return tgt.st.marked&&tgt.markBy==="tessie";}
/* ---- actions ---- */
async function doAction(c,act,it){
  const B=BATTLE,id=c.id,P=STATE.pcs[id],S=pcStat(id);
  if(act==="__run"){const ok=Math.random()<.6;blog(ok?"You got away!":"Couldn't escape!");await bwait(700);if(ok)B.result="flee";return true;}
  if(act==="__protect"){const t=await pickTarget(alive("pc").filter(p=>p!==c),"Protect whom?");if(!t)return false;
    B.protect={by:c,of:t};blog(`${esc(c.name)} stands in front of ${esc(t.name)}.`);SFX.ok();await bwait(600);return true;}
  if(act==="__disrupt"){const stat=["krodha","tessie","azareth"].includes(id)?"STR":"INT";const bonus=stat==="STR"?(SAVES[id].STR):(SAVES[id].INT);
    const n=d(20);const ok=n+bonus>=13;await showDice(n,bonus,"DC 13",ok);if(ok){B.ritual=Math.max(0,B.ritual-1);blog(`${esc(c.name)} scatters the cauldron fire! Ritual ${B.ritual}/3.`);}else blog("The cauldron fire roars on.");await bwait(800);return true;}
  if(act.startsWith("item:"))return await useItemBattle(c,act.slice(5));
  if(act.startsWith("sec:"))return await useSecret(c,act.slice(4));
  const A=ABIL[act];if(!A)return true;
  if(!canPay(id,A,act)){blog("Not enough resources.");await bwait(600);return false;}
  const bonusAtk=(A.bonus||S.atk)+(S.atkBonus||0);
  const dmgExpr=(S.level>=5&&A.dmgL5)?A.dmgL5:A.dmg;
  const tgtFoe=async lbl=>await pickTarget(alive("foe"),lbl||A.name);
  switch(A.kind){
    case "weapon":case "spell":{
      const t=await tgtFoe();if(!t)return false;pay(id,A,act);lunge(c);
      blog(`${esc(c.name)} uses <b>${A.name}</b> on ${esc(t.name)}…`);
      const doubleCrit=P.buffCrit;if(doubleCrit)delete P.buffCrit;
      const r=await attackRoll(c,t,bonusAtk,{forceCrit:doubleCrit||(t.st.charmed&&t.side==="foe")});
      if(!r.hit){blog(`${esc(c.name)}'s ${A.name} misses.`);delete c.st.hidden;await bwait(500);return true;}
      let extra=(S.dmgBonus||0);let note="";
      if(A.sneak&&(c.st.hidden||B.hitThisRound&&B.hitThisRound[t.id]||has(t,"feinted"))){const sd=roll(S.sneak,r.crit).total;extra+=sd;note+=` +Sneak ${sd}`;}
      if(A.cull&&t.hp<=t.hpMax/2&&!B["cull_"+B.round]){B["cull_"+B.round]=1;const cd=roll("1d12").total;extra+=cd;note+=` +Culling ${cd}`;}
      if(A.mark&&markedBy(t)){const md=roll("1d6",r.crit).total;extra+=md;note+=` +Mark ${md}`;}
      if(P.buffWell&&A.kind==="spell"){delete P.buffWell;const w=roll("1d8").total;extra+=w;note+=` +Blood Well ${w}`;}
      if(B.reaping&&B.reaping[id]){extra+=2;delete B.reaping[id];note+=" +Reaping 2";}
      delete c.st.hidden;
      const n=await damage(c,t,dmgExpr,A.type,r.crit,extra);
      blog(`${r.crit?"<b style='color:var(--gold)'>CRITICAL!</b> ":""}${A.name} hits ${esc(t.name)} for <b>${n}</b>${note}.`);
      (B.hitThisRound=B.hitThisRound||{})[t.id]=B.round;
      if(act==="bloodBolt"&&P.buffTwin){delete P.buffTwin;const t2=alive("foe").find(f=>f!==t);if(t2){const r2=await attackRoll(c,t2,bonusAtk);if(r2.hit){const n2=await damage(c,t2,dmgExpr,A.type,r2.crit);blog(`Twinned! Blood Bolt also hits ${esc(t2.name)} for <b>${n2}</b>.`);}}}
      await bwait(650);return true;}
    case "multi":{
      pay(id,A,act);let t=await tgtFoe();if(!t)return false;
      for(let i=0;i<A.hits&&alive("foe").length;i++){
        if(t.hp<=0)t=alive("foe")[0];lunge(c);
        const r=await attackRoll(c,t,bonusAtk);
        if(r.hit){const n=await damage(c,t,A.dmg,A.type,r.crit,S.dmgBonus||0);blog(`Strike ${i+1}: ${r.crit?"CRIT! ":""}<b>${n}</b> to ${esc(t.name)}.`);(B.hitThisRound=B.hitThisRound||{})[t.id]=B.round;
          if(A.plague&&t.hp>0&&!has(t,"poisoned")){const sv=await saveRoll(t,"CON",11);if(!sv){addSt(t,"poisoned",3);blog(`Plague Bearer: ${esc(t.name)}'s own rot turns on it. POISONED.`);}}}
        else blog(`Strike ${i+1} misses.`);
        await bwait(450);}
      return true;}
    case "save":{
      const t=await tgtFoe();if(!t)return false;pay(id,A,act);
      blog(`${esc(c.name)} casts <b>${A.name}</b> at ${esc(t.name)}!`);SFX.magic();
      const ok=await saveRoll(t,A.stat,A.dc);
      if(ok){blog(`${esc(t.name)} resists!`);await bwait(500);return true;}
      let extra=0;if(A.cull&&t.hp<=t.hpMax/2&&!B["cull_"+B.round]){B["cull_"+B.round]=1;extra+=roll("1d12").total;}
      if(P.buffWell){delete P.buffWell;extra+=roll("1d8").total;}
      const n=await damage(c,t,dmgExpr,A.type,false,extra);blog(`${A.name}: <b>${n}</b> ${A.type} to ${esc(t.name)}.`);
      if(A.status&&t.hp>0)addSt(t,A.status,A.turns+1);
      await bwait(600);return true;}
    case "heal":{
      const list=B.party.filter(p=>A.revive||p.hp>0);const t=await pickTarget(list,A.name);if(!t)return false;pay(id,A,act);
      const n=roll(A.heal).total;healCombatant(t,n);SFX.heal();blog(`${esc(c.name)} casts <b>${A.name}</b>: ${esc(t.name)} +${n} HP${t.down?"":" "}.`);await bwait(700);return true;}
    case "aoeStatus":{pay(id,A,act);SFX.magic();blog(`${esc(c.name)} casts <b>${A.name}</b>!`);await bwait(400);
      const tg=alive("foe").slice(0,A.max||9);for(const t of tg){const ok=await saveRoll(t,A.stat,A.dc);if(!ok){addSt(t,A.status,A.turns+1);blog(`${esc(t.name)} is ${stName(A.status).toLowerCase()}!`);}else blog(`${esc(t.name)} resists.`);await bwait(350);}
      return true;}
    case "status":{const t=await tgtFoe();if(!t)return false;
      if(A.humanoid&&!["humanoid","fey"].includes(t.M.type)){blog(`${A.name} only works on humanoids. ${esc(t.name)} is not one.`);await bwait(800);return false;}
      pay(id,A,act);SFX.magic();blog(`${esc(c.name)} uses <b>${A.name}</b> on ${esc(t.name)}!`);
      if(A.auto){addSt(t,A.status,A.turns+1);blog(`${esc(t.name)} is ${stName(A.status)} — its AC drops, and crits come on 19–20.`);await bwait(700);return true;}
      const ok=await saveRoll(t,A.stat,A.dc);if(!ok){addSt(t,A.status,A.turns+1);blog(`${esc(t.name)} is ${stName(A.status).toLowerCase()}!`);}else blog(`${esc(t.name)} shrugs it off.`);await bwait(600);return true;}
    case "partyTemp":{pay(id,A,act);SFX.heal();alive("pc").forEach(p=>{p.temp=Math.max(p.temp,A.temp);popText(p,"+"+A.temp+" temp","#9fe0b0");});blog(`Azareth's holy symbol glows. Sowing! Everyone gains ${A.temp} temp HP.`);await bwait(800);return true;}
    case "buffParty":{pay(id,A,act);SFX.magic();B.reaping={};alive("pc").forEach(p=>B.reaping[p.id]=1);blog("Reaping! Every ally's next hit deals +2 necrotic.");await bwait(700);return true;}
    case "turn":{pay(id,A,act);SFX.magic();blog("Azareth presents the holy symbol: TURN UNDEAD!");await bwait(400);
      for(const t of alive("foe").filter(f=>f.M.type==="undead")){const ok=await saveRoll(t,A.stat,A.dc);if(!ok){addSt(t,"turned",3);blog(`${esc(t.name)} is turned and cowers!`);}await bwait(300);}
      if(!alive("foe").some(f=>f.M.type==="undead"))blog("…nothing here is undead.");return true;}
    case "selfBuff":{pay(id,A,act);SFX.magic();
      if(A.buff==="bloodWell"){P.buffWell=1;blog("Poppi opens her Blood Well. Her next spell hits harder.");}
      if(A.buff==="twinned"){P.buffTwin=1;blog("Twinned Spell — her next Blood Bolt splits in two.");}
      if(A.buff==="dodge"){c.st.dodge=1;blog("Krodha sways like a drunk, like a leaf. \"Let's just breathe, friend.\" (Attacks vs him have disadvantage.)");}
      await bwait(700);return true;}
    case "sacrifice":{const n=d(6);if(P.slots>=pcStat(id).slotsMax){blog("Poppi's slots are already full.");await bwait(600);return false;}
      dealRaw(c,n,"#c33");P.slots++;SFX.magic();blog(`Poppi opens a vein: -${n} HP, +1 spell slot. The thread wants more.`);await bwait(800);return true;}
    case "feint":{const t=await tgtFoe();if(!t)return false;const n=d(20);const dc=11+(t.dex||0);const ok=n+7>=dc;
      await showDice(n,7,"DC "+dc,ok);if(ok){addSt(t,"feinted",3);blog(`Lucky's feint works — ${esc(t.name)} is wide open! Next attack has advantage (and Sneak Attack).`);}else blog(`${esc(t.name)} doesn't fall for it.`);await bwait(700);return true;}
    case "gamble":{pay(id,A,act);blog("Lucky flips the lucky coin…");await bwait(600);const heads=Math.random()<.5;
      if(heads){P.buffCrit=1;SFX.coin();blog("<b style='color:var(--gold)'>HEADS.</b> Lucky's next hit is a CRIT.");}else{const n=d(4);dealRaw(c,n);blog(`Tails. The coin bites back (−${n}).`);}await bwait(800);return true;}
    case "hide":{c.st.hidden=1;SFX.ok();blog("Lucky melts into the shadows. Next attack: advantage and Sneak Attack.");await bwait(600);return true;}
    case "summon":{pay(id,A,act);const w={side:"ally",id:"weasel_"+B.round,key:"giantweasel",name:"Giant Weasel",hp:9,hpMax:9,ac:13,dex:3,st:{},temp:0,life:3,x:c.x-30,y:c.y+26};
      B.order.splice(B.turn+1,0,w);SFX.squeak();blog("Krodha whistles — his GIANT WEASEL scrambles into the fight!");await bwait(700);return true;}
    case "sinEater":{const t=await tgtFoe();if(!t)return false;pay(id,A,act);lunge(c);SFX.magic();
      const n=await damage(c,t,"2d8","necrotic",false);healCombatant(c,n);blog(`Krodha CONSUMES ${esc(t.name)}'s sin: ${n} necrotic, and he heals ${n}. \"All is necessary.\"`);await bwait(800);return true;}
    case "stun":{const t=await tgtFoe();if(!t)return false;pay(id,A,act);lunge(c);const r=await attackRoll(c,t,bonusAtk);
      if(r.hit){const n=await damage(c,t,A.dmg,A.type,r.crit);blog(`Stunning Strike: ${n}.`);if(t.hp>0){const ok=await saveRoll(t,A.stat,A.dc);if(!ok){addSt(t,"stunned",2);blog(`${esc(t.name)} is STUNNED.`);}}}else blog("Miss.");await bwait(600);return true;}
    case "mark":{const t=await tgtFoe();if(!t)return false;pay(id,A,act);t.st.marked=99;t.markBy="tessie";popText(t,"MARKED","#9fe0b0");SFX.magic();blog(`Tessie marks ${esc(t.name)} as her quarry.`);await bwait(600);return true;}
    case "caster":{const t=await tgtFoe();if(!t)return false;SFX.squeak();blog(`"Sic 'em, Caster!" The ghost greyhound lunges at ${esc(t.name)}.`);
      const r=await attackRoll(c,t,5);if(r.hit){const n=await damage(c,t,"1d6+2","necrotic",r.crit);blog(`Caster bites for <b>${n}</b>.`);}else blog("Caster misses.");
      if(t.hp>0&&t.M.secret==="canine"){addSt(t,"frightened",3);blog(`${esc(t.name)} is TERRIFIED of the dog!`);}
      await bwait(600);return true;}
    case "aoe":{pay(id,A,act);blog(`${esc(c.name)} looses a VOLLEY!`);for(const t of alive("foe")){const r=await attackRoll(c,t,bonusAtk);if(r.hit){const n=await damage(c,t,A.dmg,A.type,r.crit);blog(`${esc(t.name)} −${n}.`);}await bwait(250);}return true;}
  }
  return true;
}
function healCombatant(t,n){const was=t.hp;t.hp=Math.min(t.hpMax,t.hp+n);if(t.side==="pc"){STATE.pcs[t.id].hp=t.hp;if(was<=0&&t.hp>0){t.down=false;popText(t,"REVIVED","#9fe0b0");
  if(!BATTLE.order.includes(t)){BATTLE.order.push(t);}}}popText(t,"+"+n,"#9fe0b0");}
async function useItemBattle(c,k){
  const it=ITEMS[k],B=BATTLE;
  if(it.secret){return await useSecret(c,it.secret);}
  if(it.target==="enemy"){const t=await pickTarget(alive("foe"),it.name);if(!t)return false;takeItem(k);
    if(it.undeadOnly&&!["undead","fiend"].includes(t.M.type)){blog(`The holy water splashes harmlessly off ${esc(t.name)}.`);await bwait(700);return true;}
    const n=await damage(c,t,it.dmg,it.type,false);blog(`${it.name} scalds ${esc(t.name)} for <b>${n}</b>!`);await bwait(700);return true;}
  const list=it.target==="downed"?B.party.filter(p=>p.hp<=0):it.revive?B.party:B.party.filter(p=>p.hp>0);
  if(!list.length){blog("No valid target.");await bwait(600);return false;}
  const t=await pickTarget(list,it.name);if(!t)return false;takeItem(k);
  if(it.revive){healCombatant(t,Math.ceil(t.hpMax/4));blog(`${esc(t.name)} sputters awake!`);}
  else if(it.heal){const n=roll(it.heal).total;healCombatant(t,n);blog(`${esc(t.name)} uses ${it.name}: +${n} HP.`);}
  if(it.cure){delete t.st.poisoned;delete t.st.frightened;blog(`${esc(t.name)} is cured.`);}
  SFX.heal();await bwait(700);return true;
}
async function useSecret(c,s){
  const S=SECRETS[s],B=BATTLE;const cand=alive("foe").filter(f=>f.M.secret===s);if(!cand.length){blog("No foe here is weak to that.");await bwait(700);return false;}
  const t=await pickTarget(cand,S.name);if(!t)return false;
  badge("secretKeeper");
  if(S.how.startsWith("item:")){const k=S.how.slice(5);if(!countItem(k)){blog("You don't have "+ITEMS[k].name+".");await bwait(700);return false;}takeItem(k);}
  SFX.magic();flash("#9fe0b0");
  if(s==="bottleTrap"){blog(`${esc(c.name)} sets an upright, empty bottle in ${esc(t.name)}'s path…`);await bwait(600);
    const nat=d(20);const ok=nat+1>=16;await showDice(nat,1,"CHA save DC 16",ok,false,0,true);
    if(!ok){t.hp=0;blog(`${esc(t.name)} is SUCKED INTO THE BOTTLE. A cork appears. *pop*`);await killFoe(t);}else blog(`${esc(t.name)} resists the bottle's pull!`);}
  else if(s==="ironLine"){addSt(t,"ironed",3);blog(`A line of IRON FILINGS. ${esc(t.name)} can't cross it — can't act, and takes +50% damage!`);}
  else if(s==="infighting"){blog("Lucky: \"Psst. The one on the left? Been stealing your teeth.\"");const n=d(20);const ok=n+7>=15;await showDice(n,7,"DC 15",ok);
    if(ok){const dd=await damage(c,t,"10","necrotic",false);blog(`The swarm turns on itself! <b>${dd}</b> necrotic.`);}else blog("The weasels don't buy it.");}
  else if(s==="canine"){addSt(t,"frightened",3);const dd=await damage(c,t,"1d6+2","necrotic",false);blog(`Caster BARKS. ${esc(t.name)} is terrified of dogs! (−${dd})`);}
  else if(s==="wardInnocence"){addSt(t,"frightened",3);c.st.warded=99;t.ward=c.id;blog(`${esc(c.name)} clutches the stuffed rabbit. The Lurker flinches — it can't bring itself near!`);}
  else if(s==="toothGift"){addSt(t,"charmed",99);blog(`Azareth offers ${esc(t.name)} a tooth, freely given. She CANNOT refuse it. She's charmed — until someone hurts her (and that first blow will CRIT).`);}
  else if(s==="soulCoal"){const fb=alive("foe").find(f=>f.key==="firebox");if(fb){const r=await attackRoll(c,fb,6,{adv:1});if(r.hit){const n=await damage(c,fb,"2d8+3","force",r.crit);blog(`You smash the firebox: <b>${n}</b>!`);}else blog("Missed the firebox!");}else blog("The firebox is already out.");}
  await bwait(900);return true;
}
function lunge(c){c.lunge=performance.now();}
/* ---------------------------------- foes -------------------------------- */
async function foeTurn(f){
  const B=BATTLE,M=f.M;
  const avail=M.atk.filter(a=>(!a.needAlly||alive("foe").some(x=>x.key===a.needAlly))&&!(a.self&&a.heal&&f.hp>f.hpMax*.7));
  let tot=avail.reduce((s,a)=>s+(a.w||1),0),r=Math.random()*tot,A=avail[0];for(const a of avail){r-=(a.w||1);if(r<=0){A=a;break;}}
  lunge(f);
  if(A.ritual){B.ritual++;blog(`${esc(f.name)} stirs the cauldron! <b>Ritual ${B.ritual}/3</b>`);SFX.magic();await bwait(900);
    if(B.ritual>=3){B.ritual=0;blog("<b style='color:var(--blood)'>THE RITUAL SURGES!</b> Psychic agony tears through the party!");flash("#c33");shake(12);
      for(const p of alive("pc")){const n=roll("3d6").total;dealRaw(p,n,"#c3f");await bwait(200);}healFoe(f,15);await bwait(700);}return;}
  if(A.summon){const k=A.summon;if(alive("foe").length<5){const M2=MON[k];const nf={side:"foe",id:k+"_s"+B.round,key:k,name:M2.name,hp:M2.hp,hpMax:M2.hp,ac:M2.ac,dex:M2.dex,st:{},temp:0,M:M2};B.foes.push(nf);layoutFoes();B.order.push(nf);seeMon(k);
      blog(`${esc(f.name)}: "${esc(A.name)}" — a ${esc(M2.name)} scurries out of the walls!`);SFX.squeak();}else blog(`${esc(f.name)} shrieks for more vermin — none come.`);await bwait(800);return;}
  if(A.heal&&A.self){healFoe(f,A.heal);blog(`${esc(f.name)} uses <b>${esc(A.name)}</b> and recovers ${A.heal}!`);SFX.heal();await bwait(800);return;}
  if(A.aoe||A.save&&A.aoe){
    blog(`${esc(f.name)} uses <b>${esc(A.name)}</b>!`);SFX.hit();await bwait(500);
    for(const p of alive("pc")){
      if(A.save){const ok=await saveRoll(p,A.save.stat,A.save.dc);
        if(A.dmg){let n=roll(A.dmg).total;if(ok)n=A.save.half?Math.floor(n/2):0;if(n>0)dealRaw(p,n);if(A.status&&!ok)addSt(p,A.status.id,A.status.turns+1);}
        else if(A.status&&!ok)addSt(p,A.status.id,A.status.turns+1);}
      else{const r=await attackRoll(f,p,A.bonus);if(r.hit)dealRaw(p,roll(A.dmg,r.crit).total);}
      await bwait(220);}
    await bwait(400);return;}
  // single target
  let targets=alive("pc").filter(p=>!(p.st.warded&&f.ward===p.id));if(!targets.length)targets=alive("pc");
  let t=targets.sort((a,b)=>(a.hp/a.hpMax)-(b.hp/b.hpMax))[Math.random()<.45?0:Math.floor(Math.random()*targets.length)];
  if(B.protect&&B.protect.of===t&&B.protect.by.hp>0){const g=B.protect.by;blog(`${esc(g.name)} steps in front of ${esc(t.name)}!`);t=g;
    const cm=alive("foe").find(x=>x.key==="crookedman");}
  if(A.save){blog(`${esc(f.name)} uses <b>${esc(A.name)}</b> on ${esc(t.name)}!`);const ok=await saveRoll(t,A.save.stat,A.save.dc);
    if(A.dmg){let n=roll(A.dmg).total;if(ok)n=A.save.half?Math.floor(n/2):0;if(n>0)dealRaw(t,n);}
    if(A.status&&!ok)addSt(t,A.status.id,A.status.turns+1);
    if(ok&&!A.dmg)blog(`${esc(t.name)} resists.`);await bwait(600);return;}
  const hits=A.multi||1;
  for(let i=0;i<hits&&t.hp>0;i++){
    blog(`${esc(f.name)} uses <b>${esc(A.name)}</b> on ${esc(t.name)}…`);
    const r=await attackRoll(f,t,A.bonus);
    if(r.hit){let n=roll(A.dmg,r.crit).total;dealRaw(t,n);shake(r.crit?8:4);SFX.hit();blog(`${r.crit?"<b style='color:var(--blood)'>CRIT!</b> ":""}${esc(t.name)} takes <b>${n}</b>.`);
      if(A.drain)healFoe(f,Math.ceil(n/2));
      if(A.status&&t.hp>0){if(A.status.save){const ok=await saveRoll(t,A.status.save.stat,A.status.save.dc);if(!ok)addSt(t,A.status.id,A.status.turns+1);}else addSt(t,A.status.id,A.status.turns+1);}}
    else blog(`${esc(f.name)} misses ${esc(t.name)}.`);
    await bwait(550);}
}
function healFoe(f,n){f.hp=Math.min(f.hpMax,f.hp+n);popText(f,"+"+n,"#9fe0b0");}
async function allyTurn(a){const t=alive("foe")[Math.floor(Math.random()*alive("foe").length)];if(!t)return;lunge(a);blog(`The Giant Weasel bites ${esc(t.name)}…`);
  const r=await attackRoll(a,t,5);if(r.hit){const n=await damage(a,t,"1d6+2","piercing",r.crit);blog(`…for <b>${n}</b>!`);}else blog("…and misses.");await bwait(500);}
async function bloodTide(){const B=BATTLE;B.timer--;const p=alive("pc")[0];if(!p)return;const n=d(4)+Math.floor(B.round/2);dealRaw(p,n,"#c22");
  blog(`The blood rises (${B.timer} rounds until it reaches the ceiling)… ${esc(p.name)} −${n}.`);SFX.hit();await bwait(900);
  if(B.timer<=0){B.result="rescued";}}
/* ---------------------------------- end --------------------------------- */
async function battleEnd(res,opt){
  const B=BATTLE;
  // sync PC hp
  B.party.forEach(p=>{STATE.pcs[p.id].hp=Math.max(0,p.hp);});
  if(res==="win"){
    STATE.stats.wins++;playSong("victory");SFX.win();
    let xp=0,gold=0;B.foes.forEach(f=>{xp+=f.M.xp||0;const g=f.M.gold||[0,0];gold+=ri(g[0],g[1]);});
    if(B.enc.foes.some(k=>MON[k].boss)&&!B.koAny)badge("noKO");
    // downed PCs get up with 1 HP after a win
    B.party.forEach(p=>{if(STATE.pcs[p.id].hp<=0)STATE.pcs[p.id].hp=1;});
    blog(`<b style="color:var(--gold)">VICTORY!</b> +${xp} XP · +${gold} gp`);
    addGold(gold);await bwait(400);const lv=addXP(xp,true);await waitA();
    if(lv)await levelUpFanfare();
  }else if(res==="flee"){blog("You fled.");await bwait(700);}
  else if(res==="rescued"){blog("The door bursts open — Azareth hauls Lucky out of the blood!");B.party.forEach(p=>{if(STATE.pcs[p.id].hp<=0)STATE.pcs[p.id].hp=1;});await waitA();B.result="win";return;}
  else{
    SFX.lose();playSong(null);blog("<b style='color:var(--blood)'>The party falls…</b>");await sleep(1200);
    await gameOver();
  }
}
/* ---------------------------------- draw -------------------------------- */
const BG_ART={train:"car_lounge",wreck:"wreckage",founders:"founders",woods:"wytchwood",marsh:"marsh",temple:"temple",house:"house1",blood:"house2",attic:"attic"};
function drawBattle(){
  const B=BATTLE,c=bx,t=performance.now();
  c.save();
  if(FX.shake>0){c.translate(rnd(-FX.shake,FX.shake),rnd(-FX.shake,FX.shake));FX.shake*=.86;if(FX.shake<.3)FX.shake=0;}
  // backdrop
  c.fillStyle="#08070e";c.fillRect(-10,-10,500,360);
  const art=IMG["map:"+(BG_ART[B.bg]||curMap().art||"")];
  if(art){const s=Math.max(480/art.width,336/art.height)*1.6;const cx=(art.width*s-480)/2,cy=(art.height*s-336)/2;c.globalAlpha=.55;c.drawImage(art,-cx+Math.sin(t/4000)*10,-cy,art.width*s,art.height*s);c.globalAlpha=1;}
  const g=c.createLinearGradient(0,0,0,336);g.addColorStop(0,"rgba(8,6,16,.35)");g.addColorStop(.55,"rgba(8,6,16,.15)");g.addColorStop(1,"rgba(8,6,16,.9)");c.fillStyle=g;c.fillRect(0,0,480,336);
  if(B.bg==="blood"){c.fillStyle=`rgba(140,0,20,${.25+ (1-(B.timer||0)/6)*.35})`;c.fillRect(0,336-(1-(B.timer||6)/6)*220-40,480,400);}
  // ground ellipse
  c.fillStyle="rgba(0,0,0,.35)";c.beginPath();c.ellipse(170,232,170,26,0,0,7);c.fill();
  // foes
  B.foes.forEach((f,i)=>{
    if(f.dead&&t-f.deathT>700)return;
    const im=monImage(f.M);const bob=Math.sin(t/420+i)*2;
    let dx=0;if(f.lunge&&t-f.lunge<260)dx=Math.sin((t-f.lunge)/260*Math.PI)*16;
    c.save();
    if(f.dead){c.globalAlpha=Math.max(0,1-(t-f.deathT)/700);}
    if(f.hurt&&t-f.hurt<200&&((t/40|0)%2))c.globalAlpha=.3;
    if(has(f,"charmed")){c.shadowColor="#ff7ab8";c.shadowBlur=14;}
    if(im){const s=Math.min(f.w/im.width,f.h/im.height);const w=im.width*s,h=im.height*s;
      c.fillStyle="rgba(0,0,0,.4)";c.beginPath();c.ellipse(f.x+w/2+dx,f.y+f.h+2,w*.4,6,0,0,7);c.fill();
      if(f.M.tint){c.filter="hue-rotate(20deg) saturate(1.4)";}
      c.drawImage(im,f.x+dx+(f.w-w)/2,f.y+f.h-h+bob,w,h);c.filter="none";}
    c.restore();
    if(!f.dead){// name + hp
      const bw=Math.min(100,f.w);c.fillStyle="rgba(0,0,0,.7)";c.fillRect(f.x,f.y-14,bw,11);
      c.fillStyle="#3b1320";c.fillRect(f.x+2,f.y-5,bw-4,3);c.fillStyle=f.boss?"#e3b64f":"#e05a5a";c.fillRect(f.x+2,f.y-5,(bw-4)*f.hp/f.hpMax,3);
      c.fillStyle="#efe3c4";c.font="bold 7px monospace";c.fillText(f.name.slice(0,22),f.x+2,f.y-7);
      const sts=Object.keys(f.st).filter(s=>f.st[s]>0);if(sts.length){c.fillStyle="#c8a8ff";c.font="6px monospace";c.fillText(sts.map(s=>stName(s).slice(0,5)).join(" "),f.x+2,f.y+f.h+12);}
      if(B.pick===f){c.strokeStyle="#f1dca0";c.lineWidth=2;c.strokeRect(f.x-2,f.y-2,f.w+4,f.h+4);c.fillStyle="#f1dca0";c.fillText("▼",f.x+f.w/2-3,f.y-18+Math.sin(t/120)*2);}
      if(B.cur===f){c.fillStyle="#ff6a6a";c.fillText("▶",f.x-8,f.y+f.h/2);}
    }
  });
  // allies (weasel)
  B.order.filter(a=>a.side==="ally"&&!a.dead).forEach(a=>{c.save();c.translate(a.x,a.y);c.scale(2,2);drawChar(c,0,0,{kind:"weasel",big:true},"left",0,{});c.restore();});
  // party sprites
  B.party.forEach((p,i)=>{
    let dx=0;if(p.lunge&&t-p.lunge<260)dx=-Math.sin((t-p.lunge)/260*Math.PI)*18;
    c.save();c.translate(p.x+dx,p.y);c.scale(2,2);
    if(p.hp<=0){c.globalAlpha=.45;c.translate(0,6);}
    if(p.hurt&&t-p.hurt<220&&((t/40|0)%2))c.globalAlpha=.3;
    drawChar(c,0,0,PARTY_DEF[p.id].look,"left",0,{seed:i});
    c.restore();
    if(p.st.hidden){c.fillStyle="rgba(10,8,20,.5)";c.fillRect(p.x,p.y,48,48);}
    if(B.pick===p){c.strokeStyle="#9fe0b0";c.lineWidth=2;c.strokeRect(p.x-2,p.y-2,52,52);}
    if(B.cur===p){c.fillStyle="#f1dca0";c.font="bold 9px monospace";c.fillText("▶",p.x-10,p.y+26);}
  });
  // Caster the greyhound beside Tessie
  if(hasF("caster")){const te=B.party.find(p=>p.id==="tessie");if(te){c.save();c.translate(te.x+30,te.y+22);c.scale(1.4,1.4);drawChar(c,0,0,{kind:"dog"},"left",0,{});c.restore();}}
  // party panel (top right)
  const px0=312;c.fillStyle="rgba(10,8,20,.85)";c.fillRect(px0,4,164,8+B.party.length*15);c.strokeStyle="#f1dca0";c.strokeRect(px0+.5,4.5,163,7+B.party.length*15);
  B.party.forEach((p,i)=>{const y=10+i*15;const im=portraitImg(p.id);if(im)c.drawImage(im,px0+4,y-2,12,12);
    c.fillStyle=B.cur===p?"#f1dca0":p.hp<=0?"#a55":"#efe3c4";c.font="bold 7px monospace";c.fillText(p.name.split(" ")[0].slice(0,8),px0+19,y+3);
    c.fillStyle="#3b1320";c.fillRect(px0+62,y-2,60,5);c.fillStyle=p.hp/p.hpMax<.3?"#e05a5a":"#7fe0a0";c.fillRect(px0+62,y-2,60*Math.max(0,p.hp)/p.hpMax,5);
    if(p.temp>0){c.fillStyle="#9fe0ff";c.fillRect(px0+62,y+3,Math.min(60,p.temp*4),1);}
    c.fillStyle="#efe3c4";c.font="7px monospace";c.fillText(`${Math.max(0,p.hp)}/${p.hpMax}`,px0+125,y+3);
    const P=STATE.pcs[p.id],s=pcStat(p.id);let res="";if(s.slotsMax)res="◆".repeat(P.slots);if(p.id==="krodha")res="●".repeat(P.ki);if(p.id==="lucky")res=P.ammo+"🔫";
    c.fillStyle="#b89cf0";c.font="6px monospace";c.fillText(res.slice(0,7),px0+62,y+10);
    const sts=Object.keys(p.st).filter(s=>p.st[s]>0);if(sts.length){c.fillStyle="#c8a8ff";c.fillText(stName(sts[0]).slice(0,6),px0+125,y+10);}
  });
  // turn order ribbon
  c.fillStyle="rgba(10,8,20,.75)";c.fillRect(4,4,300,14);c.font="bold 7px monospace";let ox=8;
  c.fillStyle="#a79cc0";c.fillText("R"+B.round,ox,14);ox+=18;
  B.order.forEach(o=>{if(o.dead||o.hp<=0)return;const n=o.name.split(" ")[0].slice(0,7);c.fillStyle=o===B.cur?"#f1dca0":o.side==="pc"?"#9fe0b0":o.side==="ally"?"#d8b060":"#e08080";c.fillText(n,ox,14);ox+=c.measureText(n).width+6;});
  if(B.enc.ritual){c.fillStyle="#c33";c.fillText("RITUAL "+"■".repeat(B.ritual)+"□".repeat(3-B.ritual),8,28);}
  if(B.enc.timer){c.fillStyle="#f55";c.fillText("BLOOD RISING: "+B.timer,8,28);}
  // floating text
  B.fx=B.fx.filter(f=>t-f.born<f.life);B.fx.forEach(f=>{const a=(t-f.born)/f.life;c.globalAlpha=1-a;c.fillStyle="#000";c.font="bold 12px monospace";c.fillText(f.t,f.x-10+1,f.y-a*24+1);c.fillStyle=f.col;c.fillText(f.t,f.x-10,f.y-a*24);c.globalAlpha=1;});
  // dice
  if(B.dice&&t-B.dice.t<(STATE.fast?700:1100)){const D=B.dice;const cx=240,cy=150;
    c.fillStyle="rgba(0,0,0,.55)";c.fillRect(cx-70,cy-44,140,86);c.strokeStyle=D.spin?"#a79cc0":D.ok?(D.crit?"#e3b64f":"#7fe0a0"):"#e05a5a";c.lineWidth=2;c.strokeRect(cx-70,cy-44,140,86);
    // d20 glyph
    c.save();c.translate(cx,cy-8);c.rotate(D.spin?t/60:0);c.fillStyle="#2a2244";c.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;c.lineTo(Math.cos(a)*24,Math.sin(a)*24);}c.fill();c.strokeStyle="#f1dca0";c.stroke();c.restore();
    c.fillStyle=D.nat===20&&!D.spin?"#e3b64f":D.nat===1&&!D.spin?"#e05a5a":"#f1dca0";c.font="bold 18px monospace";c.textAlign="center";
    c.fillText(D.spin?d(20):D.nat,cx,cy-2);c.font="bold 8px monospace";c.fillStyle="#efe3c4";
    if(!D.spin){c.fillText(`${D.nat}${D.bonus>=0?"+":""}${D.bonus} = ${D.nat+D.bonus} vs ${D.vs}`,cx,cy+22);c.fillStyle=D.ok?"#7fe0a0":"#e05a5a";c.fillText(D.isSave?(D.ok?"SAVED":"FAILED"):(D.crit?"CRITICAL HIT!":D.ok?"HIT":"MISS"),cx,cy+34);}
    if(D.adv)c.fillText(D.adv>0?"ADVANTAGE":"DISADVANTAGE",cx,cy-34);
    c.textAlign="left";}
  if(FX.flash>0){c.globalAlpha=FX.flash;c.fillStyle=FX.flashCol;c.fillRect(0,0,480,336);c.globalAlpha=1;FX.flash=Math.max(0,FX.flash-.12);}
  c.restore();
}

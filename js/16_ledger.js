/* ============================== ledger.js (v6) ========================== *
 *  - STANDING with the Hollow's factions (Factions & NPCs sheet).
 *  - PROMISES: what we promised, and what was promised to us — seeded from
 *    the real promises in the recaps, reconciled honestly at every wrap.
 *  - LOOK CLOSER: On Location's "grab the receipt" becomes the table's
 *    running lesson — look before you touch. Big button = do it; small gray
 *    link = look closer first (Investigation / Arcana / Detect Magic).
 *  - EXPLAINERS: the first time you touch a system, a picture + the rule.
 *  - GLOSSARY: a term unlocks the first time someone uses it. */

/* ---------------------------------- standing ----------------------------- */
const FACTION_NAME={village:"Wickermoor",oldWays:"Followers of the Old Ways",patientLady:"Fold of the Patient Lady",brightsingers:"Brightsingers",newcomers:"Newcomers"};
function addStanding(fac,n,why,quiet){if(!STATE||V6_QUIET)return;const x=X();if(!(fac in x.standing))fac="village";x.standing[fac]+=n;
  if(!quiet)toast((n>0?"⭐ +":"▼ ")+n+" standing · "+FACTION_NAME[fac]+(why?" ("+why+")":""),n>0?"gold":"bad");updateHUD();}
const standingTotal=()=>Object.values(X().standing).reduce((a,b)=>a+b,0);

/* ---------------------------------- promises ----------------------------- */
function promise(id,text,who,by){if(!STATE||V6_QUIET)return;const x=X();if(x.promises[id])return;x.promises[id]={id,text,who,by:by||"us",s:x.session,day:x.day,kept:false};
  toast((by==="them"?"🤝 Promised to us: ":"🤞 We promised: ")+text,"ghost");}
function keepPromise(id){if(!STATE)return;const x=X(),p=x.promises[id];if(!p||p.kept)return;p.kept=true;p.keptS=x.session;
  if(!V6_QUIET)toast((p.by==="them"?"🤝 They kept their word: ":"✓ Promise kept: ")+p.text,"gold");
  if(p.by==="us"&&Object.values(x.promises).filter(q=>q.by==="us"&&q.kept).length>=8)badge("promiseKeeper");}
const PROMISE_FLAGS={ // make on flag → [id,text,who,by]; keep on flag
  make:{marinerKnown:["mariner","Return the Mariner to the sea","The Mariner","us"],songKnown:["songstress","Find the Songstress her song","The Songstress","us"],
    jailbirdHungry:["jailbird","Bring the Jailbird steak and eggs","The Jailbird","us"],jarQuest:["jars","Collect six soul-flame jars","The Vagrant","us"],
    locoDefeated:["vagrant","\"Back in a few days… or weeks.\"","The Vagrant","them"],metEleanor:["accord","Bring Eleanor books (the accord)","Eleanor Heyling","us"],
    jacketOrdered:["jacket","Pay Thomasin for Lucky's jacket when it's done","Thomasin Ardor","us"],cloakOrdered:["cloak","Pick up Azareth's wolf cloak","Thomasin Ardor","us"],
    hildaGuide:["hilda","Show us where the body was found","Hilda Brom","them"],taylorNote:["taylorNote","\"We're looking for you. We stay at the Inn.\"","Seth & Isabella Taylor","us"],
    hexMorgan:["hexbag","Destroy the hex bag (Morgan's warning)","Morgan","us"],metRandall:["lift","A lift to Foxwillow once the weasels are sorted","Randall Graham","them"],
    petuniaAsked:["wine","Bring the teacup ghost her wine","Petunia","us"],got_cup:["children","\"Help my children.\"","Petunia","us"],sallyMet:["monsters","Check for monsters","Sally Lockwood","us"],
    ouijaDone:["son","FIND MY SON. HE LIVES.","Joseph Patrini (the spirit board)","us"]},
  keep:{freed_mariner:"mariner",freed_songstress:"songstress",freed_jailbird:"jailbird",freed_sweetheart:"sweetheart",jarsDone:"jars",luckyJacket:"jacket",wolfCloak:"cloak",
    bodySeen:"hilda",hexDestroyed:"hexbag",got_cup:"wine",lurkerDone:"monsters",gotMap:"map",ch4:"eleanorPoppi",dinnerDone:"dinner",dt_greyNotes:"grey"},
};
for(const f in PROMISE_FLAGS.make){const a=PROMISE_FLAGS.make[f];const prev=FLAG_HOOKS[f];FLAG_HOOKS[f]=()=>{if(prev)prev();promise(a[0],a[1],a[2],a[3]);};}
for(const f in PROMISE_FLAGS.keep){const id=PROMISE_FLAGS.keep[f];const prev=FLAG_HOOKS[f];FLAG_HOOKS[f]=()=>{if(prev)prev();keepPromise(id);};}
const addHook=(f,fn)=>{const prev=FLAG_HOOKS[f];FLAG_HOOKS[f]=()=>{if(prev)prev();fn();};};
addHook("metEleanor",()=>{promise("eleanorPoppi","Research for Poppi: come back in a few days","Eleanor Heyling","them");promise("eleanorAz","Research for Azareth: her book, her ring, the song","Eleanor Heyling","them");});
addHook("metFinneas",()=>{promise("map","A map at the schoolhouse in the morning","Finneas Trout","them");promise("grey","Compile his research on the Grey for Krodha","Finneas Trout","them");});
addHook("gameDone",()=>{promise("dinner","Dinner at the manor in a few days","Adela & Phillip Druskenvald","them");promise("patriniBook","Look for a book about the Patrini family","Adela & Phillip Druskenvald","them");});
const kidsCheck=()=>{if(hasF("got_doll")&&hasF("got_bear"))keepPromise("children");};addHook("got_doll",kidsCheck);addHook("got_bear",kidsCheck);
{const _sw=TALK.sweetheart;TALK.sweetheart=async(e)=>{await _sw(e);if(!hasF("freed_sweetheart"))promise("sweetheart","Help the Sweetheart find her love","The Sweetheart","us");};}
// standing from what the table did
addHook("sacrificeOffered",()=>addStanding("oldWays",2,"wolves for the oak"));
addHook("badge_democracy",()=>addStanding("oldWays",-1,"a duel for the mayorship"));
addHook("goatFree",()=>addStanding("oldWays",-1,"the ritual interrupted"));
addHook("fingerReturned",()=>addStanding("brightsingers",3,"the knight's finger"));
addHook("badge_smoothTalker",()=>addStanding("patientLady",-1,"lied to the Constable"));
addHook("reportedDoris",()=>addStanding("patientLady",2,"case closed"));
addHook("hexDestroyed",()=>addStanding("village",1,"hex bag destroyed"));
addHook("vesslaDone",()=>{addStanding("newcomers",3,"saved the Druskenvalds");addStanding("village",2,"no more weasels");});
addHook("metJenkins",()=>addStanding("oldWays",1,"said hello to the Jenkins"));

/* ---------------------------------- look closer -------------------------- */
function modalChoice(title,tag,html,btns){return new Promise(res=>{let v="leave";
  openModal(title,tag,html+`<div class="lc-btns">${btns.map(b=>`<button class="${b.cls||"btn"} nav" data-v="${b.v}">${b.label}</button>`).join("")}</div>`,navList(true));
  MODAL_CB=()=>res(v);$("mbody").querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>{v=b.dataset.v;closeModal();});});}
async function lookCloser(o){
  const x=X();const L=x.look[o.id]||(x.look[o.id]={looked:false,did:false,catch:o.catch!==false});
  await explainOnce("look");
  let reveal=L.reveal||null;
  for(;;){
    const html=`<div class="lc"><p>${esc(o.desc)}</p>${reveal?`<div class="banner ${reveal.ok?"fact":"no"}">🔍 ${esc(reveal.text)}</div>`:""}</div>`;
    const btns=[{v:"do",label:(reveal?"✋ ":"")+esc(reveal?(o.anywayLabel||o.doLabel+" anyway"):o.doLabel),cls:"btn lc-big"}];
    if(!reveal)btns.push({v:"look",label:"🔍 Look closer first ("+esc(nameOf(o.pc))+" · "+esc(o.skill)+")",cls:"lc-small"});
    btns.push({v:"leave",label:esc(o.leaveLabel||"Leave it for now"),cls:"btn alt"});
    const v=await modalChoice("✋ "+o.title,reveal?"You looked. Now decide.":"A Enter = the big button",html,btns);
    if(v==="look"){const r=await check(o.pc,o.skill,o.dc);L.looked=true;reveal={ok:r.ok,text:r.ok?o.catchText:(o.missText||"You can't tell. Something about it feels wrong, though.")};L.reveal=reveal;
      if(!L.counted){L.counted=true;addNote("look","🔍",`Looked closer at ${o.title.toLowerCase()} first. ${r.ok?o.catchText:""}`.slice(0,160),{quiet:true});}
      if(Object.values(x.look).filter(l=>l.looked).length>=8)badge("lookFirst");continue;}
    if(v==="do"){L.did=true;if(!L.looked&&L.catch){L.blind=true;toast("✋ Took it blind…","bad");}return "do";}
    return "leave";}
}
/* the table's real touch-it moments, with look-closer in front of them */
{const _t=TALK.druskTrunks;TALK.druskTrunks=async()=>{
  const v=await lookCloser({id:"trunks",title:"The Druskenvald trunks",desc:"The newest luggage in the car: art, trunks, and little glowing locks. Lucky's fingers twitch.",doLabel:"Lucky: just a peek",leaveLabel:"Don't touch (like the table)",pc:"poppi",skill:"Arcana",dc:10,catchText:"Arcana: arcane locks. Touch one and it tells its owners exactly who touched it."});
  if(v==="do"){SFX.bad();await say(null,"Every lock in the car CHIMES. Somewhere up the train, Phillip Druskenvald sets down his drink.");addStanding("newcomers",-2,"the trunks tattled");addNote("look","🔒","Lucky touched the Druskenvald trunks. The arcane locks told on him.");}
  else await _t();};}
{const _c=TALK.cabin2;TALK.cabin2=async()=>{if(hasF("visionSeen"))return _c();
  const v=await lookCloser({id:"record",title:"The record player in Cabin #2",desc:"Cabin #2 is ajar. A record player, with a record on it. Lucky is already halfway through the door.",doLabel:"Lucky: lift the record",pc:"azareth",skill:"Insight",dc:10,catchText:"Insight: Azareth goes very still. \"I know that song. I do not want to hear it.\""});
  if(v==="do")await _c();};}
{const _p=TALK.taylorPorch;TALK.taylorPorch=async(e)=>{
  if(hasKey("hexbag")||hasF("hexDestroyed")||!hasF("taylorKnown")||hasF("porchSeen"))return _p(e);
  const r=await check("tessie","Perception",11);if(!r.ok){await say(null,"Porch steps up to the door. One of the beams looks loose… it's just loose. Probably. (Try again, sharper eyes?)");return;}
  setF("porchSeen");await say(null,"Porch steps up to the door. One of the beams looks loose. Under the porch: a little sack.");
  const v=await lookCloser({id:"hexbag",title:"The little sack under the porch",desc:"A little sack, tied tight, stuffed under the Taylors' porch beam.",doLabel:"Grab it",pc:"poppi",skill:"Arcana",dc:12,catchText:"Arcana: a hex bag. Very old, very cursed magic of the land, and it's ACTIVE. Wrap it in cloth. Don't let it touch skin."});
  if(v!=="do"){clrF("porchSeen");return;}
  const L=X().look.hexbag;await say(null,"A HEX BAG, stuffed with dried herbs, bones and powders"+(L.looked?", wrapped in a scarf so nobody's skin touches it.":". Whoever grabbed it bare-handed gets a toothache that won't quit."));
  giveKey("hexbag");qStep("cursed",1);addXP(60);
  await say("poppi","\"Oh, that's… that's REALLY bad. That's old. Someone put this here on purpose.\"");
  const c=await ask(null,"",["Leave a note: 'We're looking for you. We stay at the Inn.'","Leave it"]);if(c===0)setF("taylorNote");};}
{const _pk=TALK.peacockStatue;TALK.peacockStatue=async()=>{
  const v=await lookCloser({id:"peacock",title:"The marble peacock",desc:"A marble peacock with a single jeweled eye: a dull red bloodstone. Lucky wants it. For Tessie.",doLabel:"Lucky: steal the eye for Tessie",pc:"poppi",skill:"Arcana",dc:12,catchText:"Arcana: the whole statue is an animated guardian. Touch the eye and it wakes up. (It's also one of the six heirlooms.)"});
  if(v!=="do")return;
  // run v5's script past its own "steal it?" question
  const _ask=ask;ask=async(w,t,ch,o)=>{ask=_ask;return 0;};try{await _pk();}finally{ask=_ask;}};}
{const _ov=TALK.ovenDoor;TALK.ovenDoor=async()=>{if(hasF("ovenOpened"))return _ov();
  await say(null,"An iron door on the big brick oven, sealed with a thick iron lock. Muffled SCREAMING from behind it. The smell of burning flesh.");
  const v=await lookCloser({id:"oven",title:"The screaming oven",desc:"Screaming behind an iron door. Lucky already has his picks out. Poppi is shouting something.",doLabel:"Lucky picks the lock",pc:"poppi",skill:"Investigation",dc:11,catchText:"Investigation: the screams loop. The same scream, every nine seconds. It isn't a person. It's a trap."});
  if(v!=="do"){await say("poppi","\"No. NO. We are not opening the screaming oven.\" Wise.");return;}
  const ok=await minigame("lockpick",{diff:1});if(!ok)return;
  setF("ovenOpened");await say(null,"The door opens and the room fills with SMOKE. A magical trap!");
  await trapDamage("2d6","fire","DEX",X().look.oven.looked?10:12);await say(null,"Some of you go down. You get everyone back up.");};}
{const _bt=TALK.bathroom;TALK.bathroom=async()=>{if(hasF("bathDone"))return _bt();
  const v=await lookCloser({id:"bath",title:"The steamy bathroom",desc:"Rank, full of mold, and someone appears to be showering. Lucky's hand is already on the curtain.",doLabel:"Lucky pulls back the curtain and accepts his fate",pc:"tessie",skill:"Perception",dc:12,catchText:"Perception: the water under the door is RED. And it's rising."});
  if(v!=="do")return;const _ask=ask;ask=async()=>{ask=_ask;return 0;};try{await _bt();}finally{ask=_ask;}};}
{const _tb=TALK.taxidermyBear;TALK.taxidermyBear=async()=>{if(hasKey("pin"))return _tb();
  const v=await lookCloser({id:"bear",title:"The stuffed bear",desc:"An animal trophy room full of creepy taxidermy. Lucky has a knife and a theory about the bear's stomach.",doLabel:"Lucky: cut open the bear",pc:"azareth",skill:"Perception",dc:12,catchText:"Perception: the bear's mouth is sewn shut, and something behind the stitches is breathing. (Detect Magic says: the ceiling, too.)"});
  if(v==="do")await _tb();};}

/* ---------------------------------- explainers --------------------------- */
const EXPLAIN={
  sessions:{t:"HOW IT WORKS · Sessions & Recaps",who:"poppi",rule:"\"Every session ends where the table stopped. Then someone writes the recap. That's me. It's always me.\"",
    plan:["Play the session. Session Notes write themselves as things happen.","At the end: write the recap. Tick only what REALLY happened. Rumors are in there too.","Update the Quest Log, the way the real Quests doc works.","Next time: the \"Last Time…\" card and the next session's list."],goal:"A perfect recap (every real highlight, no rumors) earns the Scribe badge and big points.",draw:"recap"},
  walkup:{t:"HOW IT WORKS · Villagers",who:"krodha",rule:"\"Let's just breathe, friend. They don't need you to fix it. They need you to listen.\"",
    plan:["A villager with a ! walks up to you.","Let them finish. Cutting in costs standing.","Answer the question they actually asked.","Best answer +2 standing · okay +1 · worse −1."],goal:"Hear everyone out. Standing with the Hollow's factions carries forward.",draw:"walkup"},
  partycall:{t:"HOW IT WORKS · Party Calls",who:"lucky",rule:"\"Sometimes one of us pulls you aside. You're the leader. Make the call. (Say yes to me.)\"",
    plan:["A party member asks you something, in their own voice.","Pick an answer. Some are what the table actually did.","Some calls send you to go find something: no arrow, just a hint.","Stuck? Ask Caster (3 per session, costs points)."],goal:"Good calls add up on the final score.",draw:"call"},
  look:{t:"HOW IT WORKS · Look Closer",who:"poppi",rule:"\"Before you touch it, LOOK at it. Investigation. Arcana. Detect Magic. THEN decide. (Lucky.)\"",
    plan:["The big button does the thing, right now.","The small gray link looks closer first: someone rolls.","If you see the catch, you can still do it, knowing.","Taking something blind when there was a catch costs points."],goal:"Look before you leap. It's the easiest thing to skip, and it's the lesson.",draw:"look"},
  days:{t:"HOW IT WORKS · Days in Wickermoor",who:"tessie",rule:"\"(whispers) Every long rest is a new day. Twilight Hour, Afternoon, Dusk, then Night. Night belongs to the moors.\"",
    plan:["Time only passes while you're walking around.","Each day rolls its own villagers, party calls and night encounters.","After Dusk comes Night: something walks in from the moors.","Rest at the Inn to end the day. There's no day limit."],goal:"Live in the Hollow. The days keep going, like the campaign.",draw:"days"},
  roamer:{t:"HOW IT WORKS · The Moors at Night",who:"hilda",rule:"\"Out on the moors you meet things. Roll their attitude first. Hostile doesn't mean it'll fight. It means it doesn't like you.\"",
    plan:["Encounters come from the book's Moors table (d8).","Starting Attitude: roll the dice. 4 or lower Hostile, 5–8 Indifferent, 9+ Friendly.","The attitude sets the tone. What you do decides the rest.","Not every encounter is a fight."],goal:"Survive the night. Learn their secrets.",draw:"roamer",need:()=>countItem("wickerstar")?null:"Tip: Oswick Frey sells seven-pointed wicker stars. The Old Ways swear by them."},
  books:{t:"HOW IT WORKS · Eleanor's Accord",who:"eleanor",rule:"\"I buy books from people who read them. Bring me what you find, and I'll do the research you can't.\"",
    plan:["Every day a few lost books turn up around town (✦ sparkles).","Pick them up. They go in your bag.","Hand them to Eleanor at the Antique Bookstore.","She pays, and she remembers."],goal:"Keep the accord. It's in the Quest Log.",draw:"books"},
};
async function explainOnce(k){if(!STATE||!STATE.v6||V6_QUIET)return;const x=X();if(x.explained[k])return;x.explained[k]=1;const E=EXPLAIN[k];if(!E)return;
  const need=E.need?E.need():null;
  const h=`<div class="ex"><canvas id="exCv" width="240" height="90"></canvas>
    <div class="row" style="flex-wrap:nowrap;align-items:flex-start;margin-top:8px"><canvas id="exPor" width="48" height="48" style="width:48px;height:48px;image-rendering:pixelated;border-radius:5px;border:2px solid #000;flex:0 0 auto"></canvas><div style="font-style:italic">${esc(E.rule)}<div class="sub">— ${esc(nameOf(E.who)||"")}</div></div></div>
    <ol class="doc-l">${E.plan.map(p=>`<li>${esc(p)}</li>`).join("")}</ol><div class="banner ok">🎯 ${esc(E.goal)}</div>${need?`<div class="banner no">${esc(need)}</div>`:""}
    <button class="btn nav" id="exOk" style="margin-top:8px">Got it</button></div>`;
  await new Promise(res=>{openModal("💡 "+E.t.replace(/^HOW IT WORKS · /,""),"how it works · first time only",h,navList());MODAL_CB=()=>res();$("exOk").onclick=()=>closeModal();
    const pc=$("exPor").getContext("2d");pc.imageSmoothingEnabled=false;const im=portraitImg(E.who);if(im)pc.drawImage(im,0,0,48,48);else drawChar(pc,12,12,PARTY_DEF[E.who]?PARTY_DEF[E.who].look:E.who,"down",0,{});
    drawExplainer($("exCv").getContext("2d"),E.draw);});}
function drawExplainer(c,k){c.imageSmoothingEnabled=false;c.fillStyle="#0b0916";c.fillRect(0,0,240,90);const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};const Tx=(t,x,y,col,s)=>{c.fillStyle=col||"#efe3c4";c.font=`bold ${s||9}px monospace`;c.fillText(t,x,y);};
  if(k==="recap"){P(20,8,120,76,"#e8dcc0");Tx("Session Recap #",28,22,"#2a1a0a");[["☑","real",36],["☑","real",50],["☐","rumor",64]].forEach(([b,t,y])=>{Tx(b,30,y,"#2a1a0a",11);P(44,y-7,t==="rumor"?60:80,3,t==="rumor"?"#c33d4a":"#6a5a4a");});
    P(150,20,70,50,"#211b3a");Tx("QUESTS",160,34,"#f1dca0");P(158,42,54,3,"#a79cc0");P(158,50,44,3,"#a79cc0");P(158,58,50,3,"#a79cc0");Tx("→",140,48,"#9fe0b0",12);}
  if(k==="walkup"){drawChar(c,20,40,LOOK.villagerA,"right",0,{});Tx("!",30,34,"#ffce3a",12);Tx("…",52,44,"#f1dca0",12);Tx("…",72,44,"#f1dca0",12);Tx("?",92,44,"#ffce3a",12);
    drawChar(c,110,40,PARTY_DEF.krodha.look,"left",0,{});[["best +2","#7fe0a0"],["okay +1","#e3b64f"],["worse −1","#c33d4a"]].forEach(([t,col],i)=>{P(146,14+i*24,84,18,"#211b3a");Tx(t,152,26+i*24,col);});}
  if(k==="call"){drawChar(c,40,40,PARTY_DEF.lucky.look,"right",0,{});drawChar(c,80,40,PARTY_DEF.azareth.look,"left",0,{});P(24,8,110,22,"#211b3a");Tx("\"Can I pick it?\"",30,22,"#f1dca0");
    [["\"Not now.\"","#7fe0a0"],["\"Ask Tessie.\"","#e3b64f"],["\"Do it.\"","#c33d4a"]].forEach(([t,col],i)=>{P(146,14+i*24,84,18,"#211b3a");Tx(t,152,26+i*24,col);});}
  if(k==="look"){P(20,40,40,30,"#6a4a2a");P(24,44,32,6,"#8a6a3a");P(36,52,8,6,"#d8b040");c.strokeStyle="#f1dca0";c.lineWidth=3;c.beginPath();c.arc(70,36,14,0,7);c.stroke();P(80,46,14,4,"#f1dca0");
    P(120,16,110,24,"#f1dca0");Tx("DO IT (big button)",126,31,"#1a1206");Tx("🔍 look closer first",126,58,"#a79cc0");P(126,62,100,1,"#a79cc0");}
  if(k==="days"){["#e8a070","#f1dca0","#e8743b","#3a4a8a"].forEach((col,i)=>{P(12+i*56,30,52,24,col);});["DAWN","NOON","DUSK","NIGHT"].forEach((t,i)=>Tx(t,20+i*56,46,"#1a1206"));Tx("🛏 long rest → next day",60,76,"#9fe0b0");}
  if(k==="roamer"){[["≤4 HOSTILE","#c33d4a"],["5–8 INDIFF.","#e3b64f"],["≥9 FRIENDLY","#7fe0a0"]].forEach(([t,col],i)=>{P(10+i*78,30,72,26,col);Tx(t,14+i*78,47,"#0b0916");});Tx("d8 Moors table · then roll attitude",14,76,"#a79cc0");}
  if(k==="books"){P(40,34,24,18,"#6a2a2a");P(42,36,20,14,"#8a3a3a");P(40,50,24,3,"#e8dcc0");Tx("✦",66,32,"#f1dca0",12);Tx("→",90,48,"#9fe0b0",14);P(120,20,90,50,"#211b3a");Tx("ELEANOR",134,40,"#f1dca0");Tx("+gold  +accord",126,58,"#9fe0b0");}
}
PORT.hilda=PORT.hilda||"Hilda_Brom";

/* ---------------------------------- glossary ----------------------------- */
const GLOSS={
  abilityCheck:["rules","Ability Check","Roll a d20, add your bonus, and meet or beat the DC. The big die on the screen."],
  dc:["rules","DC (Difficulty Class)","The number you need to meet or beat. 10 easy · 15 hard · 20 very hard."],
  initiative:["rules","Initiative","At the start of a fight everyone rolls a d20 (plus DEX). Highest goes first."],
  ac:["rules","AC (Armor Class)","How hard you are to hit. An attack roll has to meet or beat it."],
  savingThrow:["rules","Saving Throw","A d20 roll to resist something: a spell, a trap, a breath. DEX, CON, WIS…"],
  crit:["rules","Critical Hit","A natural 20 on an attack. Roll the damage dice twice."],
  nat1:["rules","Natural 1","A 1 on the d20. It always fails. Lucky knows."],
  advantage:["rules","Advantage / Disadvantage","Roll two d20s and take the higher (advantage) or the lower (disadvantage)."],
  longRest:["rules","Long Rest","Eight hours of sleep: everyone's HP, spell slots and powers come back. In the Hollow, it's also a new day."],
  exhaustion:["rules","Exhaustion","Rest badly (rain, no shelter) and you gain levels of it: disadvantage on checks, then worse. A long rest removes one level."],
  attunement:["rules","Attunement","Some magic items only work after you spend a short rest bonding with them. Some can't be let go of: cursed."],
  hexTravel:["rules","Hex (travel)","A map hex is 6 miles. Two hexes a day, one if the ground or the light is bad. (Session 3.)"],
  attitude:["rules","Starting Attitude","Roll the listed dice when you meet something on the road: 4 or lower Hostile, 5–8 Indifferent, 9 or higher Friendly."],
  restrained:["rules","Restrained","Can't move. Attacks against you have advantage; yours have disadvantage."],
  frightened:["rules","Frightened","Disadvantage on attacks while the source of your fear is around."],
  prone:["rules","Prone","Knocked flat. Melee attacks against you have advantage."],
  poisoned:["rules","Poisoned","Disadvantage on attack rolls and ability checks."],
  paralyzed:["rules","Paralyzed","Can't move or act. Any hit from close up is a critical hit."],
  stunned:["rules","Stunned","You lose your turn."],
  secret:["hollow","Monster Secrets","Every Crooked Moon monster has a SECRET. Study it (Eleanor, libraries) and you get a special way to beat it."],
  shroud:["hollow","The Shroud","The mist outside the Ghostlight Express. Those who enter are lost forever."],
  haint:["hollow","Haint","A wayward spirit bound to a regret. Unfinished business keeps them here."],
  soulCoal:["hollow","Soul Coal","Lost souls with unfinished business, burned as fuel in the Ghostlight furnace."],
  fatedTarot:["hollow","Fated Tarot","Adela's reading. The cards stay with you."],
  threadOfFate:["hollow","Thread of Fate","Every one of you arrived in Druskenvald with a thread: a debt, a curse, a hunt. It pulls."],
  oldWays:["hollow","The Old Ways","Survival is a privilege granted by nature and spirits: ritual, sacrifice, obedience. The oak needs blood."],
  patientLady:["hollow","The Fold of the Patient Lady","Nature is kind, not cruel. Live in harmony, without appeasement. Led by Sister Rain."],
  brightsingers:["hollow","The Brightsingers","Only the Brightsinger is pure. Kindness and example. They worship at the ruined church."],
  newcomers:["hollow","The Newcomers","Reason and civilization should replace old superstition. Phillip Druskenvald shares their ideas."],
  twilightHour:["hollow","The Twilight Hour","Dawn in Wickermoor: roughly 7 to 11 in the morning. (Session 2.)"],
  heirloom:["hollow","Heirlooms (Mementos)","Gem, Cup, Key, Doll, Bear, Pin. Six mementos that held the Crooked House shut."],
  hexBag:["hollow","Hex Bag","Herbs, bones and powders bound with land magic older than the Old Ways. A grenade on a random timer."],
  wickerVigil:["hollow","The Wicker Vigil","At the end of the year everyone in Wickermoor burns a little wicker man. Oswick says it's lovely."],
  bloodyCup:["hollow","The Bloody Cup","Wickermoor's annual sporting event. Date: soon. Ulf Harga plans to win."],
  coven:["hollow","The Vermintoll Coven","Three hag sisters: Vessla Browntooth (weasels), Stonoga Blackstinger (centipedes), Gollub Graygullet (pigeons)."],
};
function learnTerm(k){if(!STATE||!STATE.v6||V6_QUIET||!GLOSS[k])return;const x=X();if(x.gloss[k])return;x.gloss[k]=Date.now();toast("📘 New term: "+GLOSS[k][1],"ghost");}
{const _ck=check;check=async function(pc,skill,dc){learnTerm("abilityCheck");learnTerm("dc");const r=await _ck(pc,skill,dc);if(r.nat===1)learnTerm("nat1");return r;};}
{const _ar=attackRoll;attackRoll=async function(att,tgt,b,o){learnTerm("ac");const r=await _ar(att,tgt,b,o);if(r.crit)learnTerm("crit");if(r.nat===1&&att.side==="pc")learnTerm("nat1");return r;};}
{const _sv=saveRoll;saveRoll=async function(t,s,dc){learnTerm("savingThrow");return _sv(t,s,dc);};}
{const _as=addSt;addSt=function(c,s,turns){_as(c,s,turns);if(GLOSS[s])learnTerm(s);if(s==="disadv"||s==="hidden")learnTerm("advantage");};}
{const _bt=battle;battle=async function(e,o){learnTerm("initiative");return _bt(e,o);};}
{const _ls=learnSecret;learnSecret=function(s){_ls(s);learnTerm("secret");};}
{const _rp=restParty;restParty=async function(k,w,q){learnTerm("longRest");return _rp(k,w,q);};}
[["boarded","shroud"],["shroudDone","shroud"],["trainCrash","soulCoal"],["tarotDone","fatedTarot"],["ritualTalked","oldWays"],["innNight1","twilightHour"],["boardRead","bloodyCup"],
 ["gotMap","hexTravel"],["wytchwoodIn","hexTravel"],["marshHaintDone","haint"],["handOpen","exhaustion"],["key_hexbag","hexBag"],["key_gem","heirloom"],["greenScarf","attunement"],["pearl","attunement"],
 ["gameDone","coven"],["lore_patientLady","patientLady"],["lore_brightsingers","brightsingers"],["metFinneas","newcomers"]].forEach(([f,t])=>addHook(f,()=>learnTerm(t)));

/* ---------------------------------- menu: Ledger & Glossary ------------- */
MENU_TABS.splice(MENU_TABS.findIndex(t=>t[0]==="lore")+1,0,["ledger","Ledger"],["glossary","Glossary"]);
MENU_HTML.ledger=()=>{const x=X();const P=Object.values(x.promises);
  let h=`<h4 style="color:var(--moon);margin:4px 0">Standing in the Hollow</h4><div class="grid2">${Object.keys(FACTION_NAME).map(k=>`<div class="stat" style="text-align:left;min-width:150px"><b>${x.standing[k]>0?"+":""}${x.standing[k]}</b>${esc(FACTION_NAME[k])}</div>`).join("")}</div>
    <p class="sub">Villagers heard: ${x.heard} (${x.best} best answers) · cut off: ${x.cut} · party calls: ${x.calls} · Caster hints this session: ${x.hints[x.session]||0}/3</p>
    <h4 style="color:var(--moon);margin:10px 0 4px">Promises we made</h4>${P.filter(p=>p.by==="us").map(p=>`<div class="qitem${p.kept?" done":""}">${p.kept?"✓":"○"} ${esc(p.text)}<span class="st">to ${esc(p.who)} · Session ${p.s}${p.kept?" · kept":""}</span></div>`).join("")||"<div class='sub'>None yet.</div>"}
    <h4 style="color:var(--moon);margin:10px 0 4px">Promised to us</h4>${P.filter(p=>p.by==="them").map(p=>`<div class="qitem${p.kept?" done":""}">${p.kept?"✓":"○"} ${esc(p.text)}<span class="st">${esc(p.who)} · Session ${p.s}${p.kept?" · kept":""}</span></div>`).join("")||"<div class='sub'>None yet.</div>"}
    <h4 style="color:var(--moon);margin:10px 0 4px">Looked closer</h4>`;
  const L=Object.entries(x.look);h+=L.length?L.map(([k,l])=>`<div class="qitem">${l.looked?"🔍 Looked first":"✋ Took it blind"} · ${esc(k)}${l.did?"":" · left it"}</div>`).join(""):"<div class='sub'>Nothing yet. (The small gray link. Always the small gray link.)</div>";
  return h;};
MENU_HTML.glossary=()=>{const x=X();const row=k=>x.gloss[k]?`<div class="qitem"><b>${esc(GLOSS[k][1])}</b><span class="st">${esc(GLOSS[k][2])}</span></div>`:`<div class="qitem" style="opacity:.4">??? <span class="st">Not heard yet.</span></div>`;
  const R=Object.keys(GLOSS).filter(k=>GLOSS[k][0]==="rules"),H=Object.keys(GLOSS).filter(k=>GLOSS[k][0]==="hollow");
  return `<p class="sub">Terms unlock the first time someone uses them. ${Object.keys(x.gloss).length}/${Object.keys(GLOSS).length} learned.</p><h4 style="color:var(--moon);margin:6px 0 4px">5e rules</h4>${R.map(row).join("")}<h4 style="color:var(--moon);margin:10px 0 4px">Words of the Hollow</h4>${H.map(row).join("")}`;};

/* ---------------------------------- v6 badges ---------------------------- */
Object.assign(BADGES,{
  scribe:["📝","Scribe","Wrote a perfect session recap: every highlight, no rumors."],
  honest:["🤞","Honest Ledger","Told the truth about how many promises were still open."],
  promiseKeeper:["🤝","Promise Keeper","Kept eight promises the party made."],
  listener:["👂","Good Listener","Heard out five villagers."],
  goodCall:["📣","Good Call","Made six best party calls."],
  lookFirst:["🔍","Look Before You Leap","Looked closer first, eight times."],
  goodBoy:["🐕","Good Boy","Found Caster when he wandered off to be wise."],
  goatWhisperer:["🐐","Goat Whisperer","Caught the baby goat from the ritual sack."],
  starCatcher:["✴","Seven Points","Held off a gobblegeist with a wicker star."],
  nightOwl:["🦉","Night Owl","Survived three nights with something on the moors."],
  bookworm:["📚","The Accord Holds","Brought Eleanor five books."],
  accessorized:["🪢","Accessorized","Azareth got her weasel-pelt belt."],
  festive:["🎻","Festive, Not Sleepy","Bard Lucky played the Green Queen."],
  gravecounter:["⚰","Counting Graves","Heard Old Rusty's count on three different days."],
});

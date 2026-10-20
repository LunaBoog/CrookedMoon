/* ============================ downtime.js (v6) ========================== *
 * BETWEEN SESSIONS — the days after Session 8, built only from what the
 * table has actually set up (Session Recap #8 + Quests.docx). Every open
 * thread plays up to the edge of what the table knows, then shows
 *   ▸ AT THE TABLE — this hasn't been played yet.
 * The game never invents how a thread ends. When a new recap lands, the
 * next session gets added to SESSIONS and the frontier moves.
 * The capstone is the promised dinner with the Druskenvalds ("in a few
 * days"), which is exactly where the real campaign is right now. */

/* ---------------------------------- the quest log, Quests.docx-true ----- */
Object.assign(QUESTS.antiquarian,{main:true,frontier:"Azareth's answers: Eleanor still needs time"});
Object.assign(QUESTS.memory,{main:true,frontier:"the table hasn't gone yet",steps:["Morgan the Apothecary suggested it as a place to help recover memories (Azareth). West-northwest of town."]});
Object.assign(QUESTS.grey,{main:true,frontier:"Edwardia is far, and the provinces are hard to cross"});
Object.assign(QUESTS.bakery,{main:true,frontier:"Holly's cellar is still locked"});
Object.assign(QUESTS.cursed,{frontier:"the Taylors haven't come back"});
Object.assign(QUESTS.son,{frontier:"the Druskenvalds will say at dinner"});
Object.assign(QUESTS.cook,{frontier:"nobody will name the cook"});
Object.assign(QUESTS.cemetery,{frontier:"not visited yet",steps:["Apparently it's been getting bigger and bigger each night."]});
QUESTS.checkins={name:"Get Quests from the Antiquarian",main:false,steps:["Check in with Eleanor regularly. Bring her the books you find."]};
QUESTS.troupe={name:"A Performance Troupe Is Coming",main:false,steps:["The Community Board says a performance troupe comes through Wickermoor Hollow soon."],frontier:"date unknown"};
QUESTS.bloodycup={name:"The Bloody Cup",main:false,steps:["The annual sporting event is coming soon. Date: ???"],frontier:"date unknown"};
QUESTS.dinner={name:"Dinner with the Druskenvalds",main:true,steps:["\"Come back for dinner in a few days.\" Wait for the invitation.","Go to the manor for dinner."],frontier:"Session 9"};
["checkins","troupe","bloodycup","dinner"].forEach(q=>{if(!QORDER.includes(q))QORDER.push(q);});
addHook("boardRead",()=>{qStart("troupe");qStart("bloodycup");});
addHook("metEleanor",()=>qStart("checkins"));
addHook("gameDone",()=>{qStart("dinner");X().dinnerDay=X().day+3;});
REGIONS.forEach(r=>{if(r.lock)r.lock="▸ at the table · "+r.lock.replace(/^Chapter \d+ · /,"");});

/* ---------------------------------- frontier ----------------------------- */
async function frontier(thread,line){
  await say(null,"▸ AT THE TABLE\n"+line+"\n\n(This thread hasn't been played at the table yet. When it is, it comes to the game.)",{name:"The Frontier",sub:thread});
  addNote("frontier","▸",thread+": "+line,{key:"front:"+thread,quiet:true});}

/* ---------------------------------- the list ---------------------------- */
const rustyDays=()=>Object.keys(X().dt.rusty||{}).length;
const DOWNTIME_TASKS=[
  {id:"dinner",label:()=>hasF("dt_invite")?"Dinner with the Druskenvalds":"Wait for the dinner invitation (\"a few days\")",from:"Adela & Phillip",front:true,done:()=>hasF("dinnerDone"),
   route:()=>{const x=X();if(!hasF("dt_invite")){const left=Math.max(1,x.dinnerDay-x.day);return {text:"Wait for the Druskenvalds' invitation",sub:`"Dinner in a few days." Long rest at the Inn to pass the days (${left} to go).`,tgt:ent("inn","bed")};}
     if(hasF("dt_inviteMail")&&!hasF("dt_inviteRead"))return R("post","cubbies","Check your mailbox","Something with a goat-skull seal.");
     return R("village","walterM","Dinner at Druskenvald Manor","Walter Jenkin waits at the manor gate"+(x.phase<2?" (dinner is at Dusk).":"."));}},
  {id:"mailbox",label:"Get a mailbox at the Post Office",from:"Quests.docx",done:()=>hasF("mailboxOpen"),route:()=>R("post","theodora","Open a mailbox at the Post Office","Theodora Mayville, the Postmaster.")},
  {id:"randall",label:"Tell Randall the weasels are handled",from:"Randall's promise",done:()=>hasF("dt_randall"),route:()=>R("barber","randallB","Tell Randall the weasel problem is solved","He promised a lift to Foxwillow.")},
  {id:"eleanor",label:"Tell Eleanor what Poppi found in the library",from:"the accord",done:()=>hasF("dt_eleanor"),route:()=>R("books","eleanor","Report to Eleanor","The curse book with the blank pages.")},
  {id:"finneas",label:"Ask Finneas for his notes on the Grey",from:"Finneas's promise",done:()=>hasF("dt_greyNotes"),route:()=>R("school","finneasS","Ask Finneas about his Grey research",hasF("dt_greyAsked")?"He said to give him a couple of days.":"He promised Krodha a compilation.")},
  {id:"taylor",label:"Check the Taylor farm for your note",from:"The Cursed Wife",front:true,done:()=>hasF("dt_taylor"),route:()=>hasF("taylorUnlocked")?R("taylor","taylortable","Check the Taylor farm","Is your note still on the table?"):R("village","porch","Check the Taylor farm","South-east edge of town.")},
  {id:"belt",label:"A weasel-pelt belt for Azareth's cloak",from:"Azareth (Session 6)",opt:true,done:()=>hasF("dt_belt"),route:()=>R("tailor","thomasin","Ask Thomasin about a belt","Azareth wants one to go with her cloak.")},
  {id:"graves",label:()=>"Hear Old Rusty's grave count on three days ("+Math.min(3,rustyDays())+"/3)",from:"the growing cemetery",opt:true,front:true,done:()=>rustyDays()>=3,route:()=>R("village","rusty","Ask Old Rusty for today's count","The cemetery grows every night.")},
  {id:"bakery",label:"Listen at the bakery cellar after dark",from:"Investigate the Bakery",opt:true,front:true,done:()=>hasF("dt_bakery"),route:()=>R("bakery","cellar","Listen at the bakery cellar",X().phase>=2?"It's dark enough now.":"Wait for Dusk.")},
  {id:"cook",label:"Ask Alda about the slovenly cook",from:"Quests.docx",opt:true,front:true,done:()=>hasF("dt_cook"),route:()=>R("inn","alda","Ask Alda about the slovenly cook","Rat pies? Plagueborn rats?")},
  {id:"memory",label:"Ask Morgan the way to Memory's Rest",from:"Morgan's suggestion",opt:true,front:true,done:()=>hasF("dt_memory"),route:()=>R("apoth","morgan","Ask Morgan the way to Memory's Rest","Azareth's memories.")},
  {id:"bard",label:"Lucky plays the Green Queen",from:"Bard Lucky",opt:true,done:()=>hasF("dt_bard"),route:()=>R("inn","alda","Lucky's gig at the Green Queen","Ask Alda for the corner by the hearth.")},
  {id:"books",label:()=>"Keep Eleanor's accord: deliver books ("+X().books+"/3)",from:"the accord",opt:true,done:()=>X().books>=3},
];
function DOWNTIME_MORNING(around){const x=X();if(x.session<9)return;
  if(!hasF("dt_invite")&&x.day>=x.dinnerDay&&x.dinnerDay){setF("dt_invite");
    if(hasF("mailboxOpen")){setF("dt_inviteMail");around.unshift("📬 Something arrived in your mailbox overnight: a letter sealed with a goat skull.");}
    else{setF("dt_inviteRead");qStep("dinner",1);around.unshift("✉️ Slipped under the Inn door: the Druskenvalds' dinner invitation, sealed with a goat skull. Tonight, at Dusk.");}}
  else if(!hasF("dt_invite")&&x.dinnerDay)around.unshift(`The Druskenvalds said dinner in a few days. (${Math.max(1,x.dinnerDay-x.day)} to go.)`);
}

/* ---------------------------------- the townsfolk, between sessions ----- */
KEYITEMS.greyNotes={name:"Finneas's Notes on the Grey",icon:"📓",desc:"A schoolteacher's compilation: the grey fog, the mark on Edwardia's natives, and the two-headed beast. Accept death: the mastiff. Reject it: the wolf."};
KEYITEMS.letterDrusk={name:"Dinner Invitation",icon:"✉️",desc:"From Adela and Phillip Druskenvald. Sealed with a goat skull. 'Dinner, at Dusk.'"};
GEAR.weaselBelt={who:"azareth",name:"Weasel-Pelt Belt",desc:"To go with the wolf cloak. (Style points only.)"};
{const _t=TALK.cubbies;TALK.cubbies=async()=>{if(hasF("dt_inviteMail")&&!hasF("dt_inviteRead")){setF("dt_inviteRead");giveKey("letterDrusk");qStep("dinner",1);
    await say(null,"Your mailbox: a heavy letter sealed with a goat skull.\n\"Dinner, at Dusk. We have so much to ask you. — A. & P. Druskenvald\"");return;}await _t();};}
{const _t=TALK.randallShop;TALK.randallShop=async(e)=>{if(X().session>=9&&hasF("vesslaDone")&&!hasF("dt_randall")){seeNpcPortrait("randall");
    await say("randall","\"The weasels? GONE? Not a tooth missing from my jar in three nights.\" He stares into the jar a little too long.\n\"A deal's a deal. My next delivery run to Foxwillow, you ride along. I'll send word when the cart's loaded.\"",{name:"Randall Graham",sub:"Barber-Surgeon-Moonshiner"});
    setF("dt_randall");addNote("downtime","✂️","Told Randall the weasels are handled. He'll send word about the Foxwillow run.");
    await frontier("Foxwillow","Randall's lift to Foxwillow is promised. When the cart rolls is up to the table.");return;}await _t(e);};}
{const _t=TALK.eleanor;TALK.eleanor=async(e)=>{const x=X();
  if(hasF("metEleanor")&&(x.bookBag||0)>0){const n=x.bookBag;x.bookBag=0;x.books+=n;seeNpcPortrait("eleanor");
    await say("eleanor",`"${n===1?"A book":n+" books"}. Hm. Dog-eared. Beloved. Good." She pays without haggling: ${n*3}gp.\n"The accord holds."`,{name:"Eleanor Heyling",sub:"The Antiquarian"});
    addGold(n*3);keepPromise("accord");addNote("downtime","📚",`Delivered ${n} book${n===1?"":"s"} to Eleanor. The accord holds.`,{quiet:true});if(x.books>=5)badge("bookworm");
    qStep("checkins",0);}
  if(x.session>=9&&!hasF("dt_eleanor")&&!!STATE.lore.malediction){seeNpcPortrait("eleanor");
    await say("poppi","Poppi tells her everything: the library in the manor, a book in the language of her stolen page, her curse, an incantation, and page after page of nothing.");
    await say("eleanor","\"Blank pages. Eyes and wings.\" She takes her spectacles off, which she never does. \"Keep it close, Poppi. Don't write in it. Not yet.\"",{name:"Eleanor Heyling",sub:"The Antiquarian"});
    if(!!STATE.lore.lethica)await say("eleanor","\"And Azareth: an essay by Matron Lethica? Memory's Rest. Morgan was right to send you there.\"");
    await say("eleanor","\"Your answers, Azareth… give me a few more days.\"");
    setF("dt_eleanor");addNote("downtime","📚","Told Eleanor about Poppi's curse book. She still needs time for Azareth.");
    await frontier("Information for the Antiquarian","Eleanor is still researching Azareth's book, ring and song.");return;}
  await _t(e);};}
{const _t=TALK.finneasSchool;TALK.finneasSchool=async(e)=>{const x=X();
  if(x.session>=9&&!hasF("dt_greyNotes")&&hasF("metFinneas")){seeNpcPortrait("finneas");
    if(!hasF("dt_greyAsked")){setF("dt_greyAsked");x.dt.greyDay=x.day;await say("finneas","\"The compilation! Yes. Nearly. Give me a couple of days. There's a footnote that keeps growing.\"",{name:"Finneas Trout",sub:"The Schoolteacher"});return;}
    if(x.day<(x.dt.greyDay||0)+2){await say("finneas","\"Not yet, not yet. That footnote.\"",{name:"Finneas Trout",sub:"The Schoolteacher"});return;}
    await say("finneas","\"Here. Everything I know about the Grey, in one place. It's… not as much as I'd like.\"\n(The fog. The mark. The two-headed beast. Accept death: the mastiff. Reject it: the wolf.)",{name:"Finneas Trout",sub:"The Schoolteacher"});
    giveKey("greyNotes");setF("dt_greyNotes");await say("krodha","\"Opposites. Moral relativism. The other half of me.\" He tucks the notes into his robe. \"Thanks, friend.\"");
    await frontier("Krodha's Grey","The Grey is in Edwardia, and the provinces are hard to cross. Where Krodha takes this is up to the table.");return;}
  await _t(e);};}
{const _t=TALK.thomasin;TALK.thomasin=async(e)=>{const x=X();
  if((x.session>=9||hasF("clockDone"))&&hasF("wolfCloak")&&!hasF("dt_belt")&&hasF("metThomasin")){
    if(!hasF("dt_beltOrdered")){const c=await ask("azareth","\"I have weasel pelts. Two good ones. I want a belt. To go with my cloak.\"",["Order the belt (10gp)","Not now"]);
      if(c===0){if(STATE.gold<10){await say(null,"Not enough gold (10).");return;}addGold(-10);setF("dt_beltOrdered");x.dt.beltDay=x.day;await say("thomasin","\"Weasel. Of course it's weasel.\" She takes the pelts. \"Tomorrow.\"",{name:"Thomasin Ardor",sub:"The Tailor · Old Ways"});return;}}
    else if(x.day>x.dt.beltDay){setF("dt_belt");setF("weaselBelt");SFX.item();badge("accessorized");await say("azareth","Azareth puts on the weasel-pelt belt. It matches the wolf cloak. She stands very straight. \"Good.\"");return;}
    else{await say("thomasin","\"Tomorrow, I said.\"",{name:"Thomasin Ardor",sub:"The Tailor · Old Ways"});return;}}
  await _t(e);};}
{const _t=TALK.taylorTable;TALK.taylorTable=async(e)=>{if(X().session>=9&&!hasF("dt_taylor")){setF("dt_taylor");
    await say(null,hasF("taylorNote")?"Your note is still on the kitchen table where you left it. Untouched. Dust on it now.":"The kitchen table. The dried flower. The carved word: 'SADIE'. Nobody's been back.");
    addNote("downtime","🏚","The Taylor farm: nobody's been back. "+(hasF("taylorNote")?"Our note is still there.":""));
    await frontier("The Cursed Wife","The Taylors haven't come back. Seth and Isabella are out there somewhere, and so is whoever made that hex bag.");return;}await _t(e);};}
{const _t=TALK.taylorPorch;TALK.taylorPorch=async(e)=>{if(X().session>=9&&!hasF("taylorUnlocked")&&!hasF("dt_taylor")){setF("dt_taylor");await say(null,"The farmhouse is shut up. Nobody's been back.");await frontier("The Cursed Wife","The Taylors haven't come back.");return;}await _t(e);};}
{const _t=TALK.bakeryCellar;TALK.bakeryCellar=async(e)=>{if(hasF("metHolly")&&X().session>=9&&!hasF("dt_bakery")){
    if(X().phase<2){await say(null,"A cellar hatch with a new padlock. Quiet. Too quiet, in daylight. (Try after dark.)");return;}
    setF("dt_bakery");await say(null,"You put your ear to the hatch. Scratching. Lots of it. And something that might be giggling.");
    addNote("downtime","🥖","At night, something scratches (and maybe giggles) under Holly's bakery.");
    await frontier("Investigate the Bakery","The cellar is padlocked and Holly won't talk about it. Opening it is for the table.");return;}await _t(e);};}
{const _t=TALK.alda;TALK.alda=async(e)=>{const x=X();
  if(x.session>=9&&!hasF("dt_cook")&&hasF("metAlda")){setF("dt_cook");seeNpcPortrait("alda");
    await say("alda","\"The cook? The PIES?\" She laughs, a little too long. \"Everyone cooks in Wickermoor, love. Everyone.\"",{name:"Alda Farnum",sub:"The Innkeeper"});
    addNote("downtime","🥧","Asked Alda about the slovenly cook. She laughed it off.");await frontier("The Slovenly Cook","Nobody will name the cook, and the rats keep disappearing.");return;}
  if(x.session>=9&&!hasF("dt_bard")&&(hasF("bardGig")||hasF("luckyBard"))){const c=await ask("lucky","\"Alda. The corner by the hearth. Tonight. Bard Lucky.\"",["Lucky plays the Green Queen","Not tonight"]);
    if(c===0){await say("alda","\"FESTIVE,\" Alda says. \"Not sleepy. Go on then.\"",{name:"Alda Farnum",sub:"The Innkeeper"});
      setTimeout(()=>{try{mgUI("Bard Lucky plays the Green Queen! Press ←↓↑→ as the notes reach the line.");}catch(err){}},60);
      const res=await minigame("harpsichord");const tips=Math.max(3,Math.round((res||0)*30));setF("dt_bard");addGold(tips);badge("festive");
      await say(null,(res>=.8?"The whole inn is on its feet. Somebody cries. It might be Krodha.":"Not bad for one book of music theory. People clap. Some of them mean it.")+` (+${tips}gp in tips)`);
      addNote("downtime","🎵","Bard Lucky played the Green Queen. "+tips+"gp in tips.");return;}}
  await _t(e);};}
{const _t=TALK.morgan;TALK.morgan=async(e)=>{if(X().session>=9&&!hasF("dt_memory")&&hasF("metMorgan")){setF("dt_memory");seeNpcPortrait("morgan");
    await say("morgan","\"Memory's Rest. West-northwest of town. They supposedly help with memory loss.\" She rubs her temple. \"I keep meaning to go myself. I keep forgetting.\"",{name:"Morgan",sub:"The Apothecary"});
    if(!!STATE.lore.lethica)await say("azareth","\"Matron Lethica wrote an essay. In a book. In the house that ate us.\"\n\"…That's a recommendation, I suppose,\" Morgan says.");
    addNote("downtime","🌿","Morgan pointed the way to Memory's Rest: west-northwest.");await frontier("Go to Memory's Rest","Azareth's memories are out there. The table hasn't gone yet.");return;}await _t(e);};}
{const _t=TALK.oldRusty;TALK.oldRusty=async(e)=>{const x=X();if(hasF("ch4")&&!hasF("enteredHouse")){setF("rustyWarned");return _t(e);}
  if(hasF("gotMap")&&(x.session>=5)){x.dt.rusty=x.dt.rusty||{};const first=!x.dt.rusty[x.day];x.dt.rusty[x.day]=1;const n=gravesCount(x.day),p=gravesCount(x.day-1);seeNpcPortrait("rusty");
    await say("rusty",`"${n}. ${n} GRAVES out at Maidenmist this morning. Yesterday, ${p}. I counted twice! THRICE!"`,{name:"Old Rusty",sub:"The Groundskeeper"});
    if(first)addNote("downtime","⚰",`Old Rusty's count: ${n} graves at Maidenmist on Day ${x.day} (+${n-p}).`,{quiet:true});
    if(!hasF("rustyCem")){setF("rustyCem");qStart("cemetery");}
    if(rustyDays()===3){badge("gravecounter");await frontier("Explore the Cemetery","Maidenmist grows every night. Going out there is for the table.");}
    return;}
  await _t(e);};}
{const _t=TALK.oswick;TALK.oswick=async(e)=>{await _t(e);const c=await ask("oswick","\"Candles AND wickerwork! Seven-pointed stars for the eaves. Honey cakes from Holly's, too.\"",["Browse the Wickery","Just passing"],{name:"Oswick Frey",sub:"The Chandler"});if(c===0)openShop("wickery");};}

/* ---------------------------------- the manor, and dinner --------------- */
MAPS.village.npcs.push(N("walterM",8,10,{name:"Walter Jenkin",look:"walter",talk:"walterManor",need:"gameDone"}));
{const _ev=EVENTS.crookedArrival;EVENTS.crookedArrival=async(ex)=>{if(hasF("vesslaDone")){await TALK.walterManor();return false;}return _ev(ex);};}
TALK.walterManor=async()=>{const x=X();seeNpcPortrait("walter");
  if(hasF("dinnerDone")){await say("walter","(Walter signs 'thank you', then 'goodnight', then something that might be 'come back soon'.)",{name:"Walter Jenkin",sub:"The Butler"});return;}
  if(!hasF("dt_invite")){await say("walter","(Walter signs something. You catch 'resting', 'soon', and 'dinner'. He mimes a few sleeps with two fingers.)\n(\"Dinner in a few days.\" Rest at the Inn.)",{name:"Walter Jenkin",sub:"The Butler"});return;}
  if(!hasF("dt_inviteRead")){setF("dt_inviteRead");qStep("dinner",1);await say("walter","(Walter taps his chest, then the manor, then you. He hands you a letter sealed with a goat skull: the same one waiting in your mailbox.)");}
  if(x.phase<2){const c=await ask("walter","(Walter points at the sun, then at the horizon. Dinner is at Dusk.)",["Wait at the gate until Dusk","Come back later"],{name:"Walter Jenkin",sub:"The Butler"});
    if(c!==0)return;await fadeTo(1,500);x.phase=2;x.phaseT=0;updateHUD();await sleep(300);await fadeTo(0,500);toast("🌇 Dusk","ghost");}
  await dinnerFrontier();};
async function dinnerFrontier(){
  lockInput(true);await fadeTo(1,600);banner("DRUSKENVALD MANOR","Dinner with the Druskenvalds");SFX.toll();await sleep(900);await fadeTo(.55,600);lockInput(false);
  await say(null,"The manor is a house again. Candles along a long table. The portraits in the foyer are just portraits. (You check. Twice.)");
  seeNpcPortrait("adela");
  await say("adela","\"You came! Sit, sit. Phillip, they CAME.\"",{name:"Adela Druskenvald",sub:"The Lady of Druskenvald"});
  await say("phillip","\"Of course they came. We promised dinner.\" He sets a heavy book beside his plate. On the spine: PATRINI.",{name:"Phillip Druskenvald",sub:"The Lord of Druskenvald"});
  await say("lucky","\"Is there dessert? Asking for a skeleton.\"");
  setF("dinnerDone");qDone("dinner");keepPromise("dinner");
  await say(null,"▸ AT THE TABLE\nAnd that's where the story is, right now.\nDinner with the Druskenvalds, the Patrini book, and whatever comes after: that's the next session at Moon's table.",{name:"The Frontier",sub:"Session 9"});
  addNote("frontier","🍽","Sat down to dinner with the Druskenvalds. Phillip brought a book: PATRINI. The next session starts here.");
  await fadeTo(0,500);
  await showArcade("Through Dinner");
  rollCredits();
}

/* ---------------------------------- the green scarf (S7 canon attunement) */
{const _sb=sessionBreak;sessionBreak=async function(n,o){await _sb(n,o);if(X().session>=7&&hasKey("greenscarf")&&!hasF("greenScarf")){setF("greenScarf");toast("🧣 Tessie attunes to Petunia's green scarf: OP, but cursed.","gold");}};}

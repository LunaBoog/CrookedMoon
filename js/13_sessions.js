/* ============================ sessions.js (v6) ========================= *
 * THE SESSION SPINE. On Location's "days" become the table's real SESSIONS.
 * Each session has its task list (from that recap's Quests header), ends
 * where the table actually stopped, and closes with the ritual:
 *   1) Write Session Recap #N  (tick the real highlights, skip the rumors)
 *   2) The Quest Log            (Quests.docx format + session by the numbers)
 *   3) Level up if the table did, then "Last Time…" opens the next session.
 * Session 9 is "Between Sessions": open-ended Wickermoor days (17_downtime).
 * Everything new lives on STATE.v6 so v5 saves load without a wipe. */

/* ---------------------------------- state -------------------------------- */
function freshX(){return {v:6,session:0,wrapped:{},snooze:{},sessStart:{},day:1,phase:0,phaseT:0,clockT:0,sched:null,fired:{},cd:0,
  roll:{},notes:[],heardIds:{},callIds:{},heard:0,best:0,cut:0,calls:0,callsBest:0,look:{},promises:{},
  standing:{village:0,oldWays:0,patientLady:0,brightsingers:0,newcomers:0},hints:{},recaps:{},honest:{},books:0,booksDay:{},bookSpots:{},
  gloss:{},explained:{},goFind:null,casterFound:0,goatFound:0,roamers:0,roamersTalked:0,graves:{},done:{},scored:{},hsT:{},tableLog:[],
  dinnerDay:0,dt:{},wickerStar:0,nightsSurvived:0}}
function X(){if(!STATE.v6)STATE.v6=freshX();return STATE.v6;}
let V6_QUIET=false; // true while DM presets rewrite flags (no notes/toasts)
{const _fs=freshState;freshState=function(l){const s=_fs(l);s.v6=freshX();s.v6.session=1;return s;};}
{const _lg=loadGame;loadGame=function(){const s=_lg();if(!s)return s;let raw={};try{raw=JSON.parse(sget("save")||"{}");}catch(e){}
  if(!raw.v6){ // a v5 save: keep it, derive where the table is from its flags
    s.v6=freshX();s.v6.session=sessionFromFlags(s.flags||{});for(let n=1;n<s.v6.session;n++)s.v6.wrapped[n]=1;}
  else{s.v6=Object.assign(freshX(),raw.v6);s.v6.standing=Object.assign(freshX().standing,raw.v6.standing||{});}
  return s;};}
function sessionFromFlags(F){const H=f=>!!F[f]; // top-down: the latest milestone the table reached wins
  if(H("gameDone"))return 9;
  if(H("floor3Open")||(H("jasperDone")&&H("got_doll")))return 8;
  if(H("harpDone"))return 7;
  if(H("enteredHouse"))return 6;
  if(H("handtakerDone"))return 5;
  if(H("marshHaintDone"))return 4;
  if(H("metSolomon")||H("hexMorgan")||H("wytchwoodIn")||H("fingerReturned")||(H("boardRead")&&H("metBaltus")&&H("metEleanor")&&H("metThomasin")))return 3;
  if(H("trainCrash"))return 2;
  return 1;}

/* ---------------------------------- helpers ------------------------------ */
const R=(map,id,text,sub)=>({text,sub:sub||"",tgt:id?ent(map,id):{map}});
const curSessNo=()=>STATE&&STATE.v6?STATE.v6.session||1:1;
const curSession=()=>SESSIONS[curSessNo()]||null;
function sessTasks(n){const S=SESSIONS[n];if(!S)return [];return typeof S.tasks==="function"?S.tasks():S.tasks;}
function taskDone(t){try{return !!t.done();}catch(e){return false;}}
function sessCount(n){const T=sessTasks(n).filter(t=>!t.opt);return [T.filter(taskDone).length,T.length];}
function sessReady(n){const S=SESSIONS[n];if(!S||S.open)return false;if(S.ready)return S.ready();return sessTasks(n).filter(t=>!t.opt).every(taskDone);}

/* ---------------------------------- notes -------------------------------- */
function addNote(cat,icon,text,opt){if(V6_QUIET||!STATE)return;opt=opt||{};const x=X();
  if(opt.key&&x.notes.some(n=>n.key===opt.key))return;
  let sn=opt.s||x.session;if(opt.s&&opt.s<x.session&&x.wrapped[opt.s])sn=x.session; // already-recapped session? log it under this one
  x.notes.push({s:sn,day:x.day,cat,icon,text,key:opt.key||null,real:true});
  if(!opt.quiet)toast("📝 "+text.slice(0,70)+(text.length>70?"…":""),"ghost");}
function notesFor(n){return X().notes.filter(q=>q.s===n);}

/* flag → the highlight line, in the recap's own words (Session Recaps #1–#8) */
const NOTE_FLAGS={
  // Session 1
  boarded:["🚂","The Ghostlight Express came out of the fog. The Vagrant, a frogman with a fiddle, took our tickets. Next stop: Druskenvald."],
  shroudDone:["👁","Lucky confronted the crooked-necked passenger. He cracked the window, sucked in the mist and turned into a Shrouded. We put it down, and the passenger it infected."],
  cracksealed:["🕯","Lucky sealed the cracked window with candle wax."],
  metDrusk:["🥂","Met Adela and Phillip Druskenvald in the lounge car. Alive, headed for Wickermoor. Don't call him King."],
  tarotDone:["🃏","Adela read our tarot: Lucky the Chariot, Poppi the Lovers, Azareth Temperance, Tessie the Wheel of Fortune, Krodha the Hanged Man."],
  freed_daydreamer:["🌭","Sausage Kid moved on after Lucky told him to just stop feeling bad. Lucky took the sausage plate."],
  visionSeen:["💿","Lucky lifted the record in Cabin #2. It played Azareth's apocalypse song: a porch, masked nurses, a figure in a rocking chair muttering her name."],
  freed_songstress:["🎶","Lucky played the mail-car record on the phonograph. The Songstress sang her grand operatic finish and moved on."],
  freed_sweetheart:["💌","Krodha gave the love letter to the weeping woman in Cabin #3. She clutched it and moved on."],
  freed_mariner:["🖼","Poppi brought the sailor the seascape painting from the lounge. He moved on."],
  tigerFed:["🐯","Tessie fed the ghost tiger a steak and slipped the iron ring off its paw."],
  freed_jailbird:["🍳","The haggard jailbird wanted steak and eggs. We fetched it from the dining car; he ate and moved on."],
  key_mcquestcase:["🧳","Behind the tiger: a familiar case. Gambling gear and a letter to a McQuest. Classic McQuest."],
  harlequinDealt:["🃏","The Harlequin wanted the tiger dead. Lucky made a bet with her instead."],
  cagesOpen:["🗝","Azareth unlocked every cage on the circus car."],
  harlequinBeaten:["🤡","The Harlequin came back for a fight, annoyed at how she was released."],
  trainCrash:["💥","Black mist crept into the furnace car and the firebox door flew off its hinges. The Ghostlight Express went off the rails."],
  // Session 2
  lvl2:["✦","We all leveled up before the fight."],
  jarsDone:["🏮","Collected six soul-flame jars from the trees around the wreck."],
  locoDefeated:["🚂","The jars woke the Locomotive and it attacked us. We won; the Vagrant drove off without us. Back in a few days… or weeks."],
  druskReward:["🪙","Phillip Druskenvald paid us 25gp each, plus a treasure."],
  climbedPine:["🌲","Krodha climbed a tree: halfway there. A house on a hill, a fairly large town."],
  wolvesDone:["🐺","Wolves stalked a staked figure by the Oak of Faces. We fought them off."],
  goatFree:["🐐","The 'sacrifice' was a sack with a baby goat in it. It ran away."],
  ritualTalked:["🎩","Mayor Wendel Somerton: we interrupted a sacred Old Ways ritual. The tree needs blood."],
  sacrificeOffered:["🩸","Azareth dragged the wolf corpses to the oak instead, and told the mayor to put up a sign next time."],
  badge_democracy:["🗳","Lucky challenged the mayor to a duel for the mayorship. The mayor refused."],
  metAlda:["🍺","The Green Queen Inn: rooms a copper each. Lucky called the town sleepy. Alda: FESTIVE, not sleepy."],
  innNight1:["😴","Azareth had the apocalypse nightmare again and went down to listen to Lucky play. We woke in the Twilight Hour."],
  boardRead:["📌","The Community Board: Seth Taylor's cursed wife, a Mystery Body holding a marble finger, a performance troupe, the Bloody Cup."],
  metBaltus:["🏪","Tolliver's Trading Post. Baltus named Seth Taylor and pointed us to the Apothecary, the Bread Shop, the Bookstore and the Apparel Shop."],
  metEleanor:["📚","Eleanor Heyling the Antiquarian saw Poppi's affliction and offered an accord: she researches, we fetch. Come back in a few days."],
  ency:["📖","Lucky tried to steal from the bookstore and bought an encyclopedia instead."],
  metThomasin:["🧵","A Stitch in Time: Seth married Isabella fast after it ended with Sadie Hardy."],
  jacketOrdered:["🧥","Lucky commissioned a studded-armor puffer jacket."],
  cloakOrdered:["🐺","Azareth asked Thomasin to make her wolf pelt into a cloak."],
  // Session 3
  metSolomon:["🪨","Solomon Roderick the mason: bring him the finger. Ed Hardy is buried by the old Brightsinger church."],
  key_finger:["☝","Constable Doris handed over the marble finger."],
  badge_smoothTalker:["🎭","Lucky told the Constable the Druskenvalds sent us. She bought it."],
  fingerIdentified:["🗿","Solomon: the finger belongs to the knight statue in the old Brightsinger church."],
  fingerReturned:["⛪","Weston Murdoch was astounded. The knight's finger, missing for centuries."],
  taylorUnlocked:["🏚","The Taylor farm: nobody home, everything dead. Lucky picked the locks."],
  key_hexbag:["👝","Under the Taylor porch: a hex bag full of very old, cursed land magic."],
  taylorNote:["✉️","We left the Taylors a note: we're looking for them, we stay at the Inn."],
  hexMorgan:["🌿","Morgan the Apothecary bonded with Azareth over lost memories, suggested Memory's Rest, and begged us to destroy the hex bag."],
  hexKnown:["📚","Eleanor: the hex bag is Crooked Queen magic. There may be practitioners in town."],
  metHilda:["🐇","Hilda burst into the inn with rabbits from the Wytchwood. Poppi talked to her; Tessie was too shy."],
  metFinneas:["🎓","Finneas Trout the schoolteacher said Krodha looked familiar and told us about the Grey."],
  gotMap:["🗺","Finneas gave us a map: the growing cemetery, the Crimson Monastery, Memory's Rest, the Drowned Crossroads…"],
  caster:["🐕","A ghostly greyhound joined us in the Wytchwood: Caster. Very wise, maybe not so strong."],
  bodySeen:["🦶","Hilda showed us where the body was found. Barefoot tracks."],
  campFound:["🔪","A crude campsite: a dull, bloody knife and a hand made of sticks."],
  riverCrossed:["🌊","The dry riverbed rushed back. Krodha and Poppi barely made it."],
  marshHaintDone:["👻","A wayward haint shuffled up behind us in the Marsh of Hunger. Lucky pointed his gun."],
  goodberry:["🫐","Azareth cast Goodberry and ate five."],
  // Session 4
  gravesRobbed:["⚰","We robbed some ancient graves. Only Tessie and Poppi found anything."],
  gateOpen:["🔓","Lucky picked the chained iron gate. He kept the lock."],
  inscription:["✋","Krodha's weasel found the inscription on the back of the great hand."],
  handOpen:["🌿","Water, grass, and a lit candle in the three bowls. The hand moved. Stairs down."],
  chalked:["✏️","Lucky chalked the walls so we could find our way back."],
  alchOpen:["⚗️","Behind a locked iron door: a storage and alchemy room."],
  luckyPotion:["💨","Lucky tried to craft a potion. It failed."],
  noHands:["🙏","The figures prostrate in the smoke had no hands."],
  handtakerDone:["🖐","We killed the creature on the platform and took its idol of mangled fingers."],
  // Session 5
  mysterySolved:["🔎","Mystery solved: Ed Hardy was killed by the monster and its cultists. Poppi grew an extra finger touching the effigy."],
  ch3back:["🥾","Five-ish days to walk back to town. Rations, not exhaustion."],
  luckyJacket:["🧥","Lucky picked up his hype-beast armor."],
  wolfCloak:["🐺","Azareth got her wolf-pelt cloak."],
  reportedDoris:["🏛","We told the Constable everything. 10gp each. They very much did not want the effigy."],
  hexDestroyed:["🔥","Morgan destroyed the hex bag for us."],
  effigyMorgan:["🧪","Morgan took the effigy: magical, not alchemical. The woods twist time."],
  weaselsKnown:["🐀","A LOT of weasels in town. Krodha's giant weasel got one answer: 'Teeth for the Master.'"],
  greenQueenLore:["👑","Eleanor: before Druskenvald, an eden ruled by Keller the Green Queen. Crooked Queen vs Green Queen?"],
  greyTalk2:["🐺","Finneas on the Grey again: accept death, the mastiff; reject it, the wolf. Meditate on opposites."],
  metRandall:["✂️","Randall Graham, barber-surgeon-moonshiner: weasels steal teeth from his shop. Sort it out and he'll give us a lift to Foxwillow."],
  poppiFinger:["✂️","Randall snipped off Poppi's extra finger."],
  rustyWarned:["🧓","A crazy old man on the hill: 'Death, doom, pain, crooked moon, crooked mansion.' Don't go in the house."],
  metJenkins:["🏡","Walter, Gilly and Dani Jenkin waved from the barn. Walter signs; Gilly interprets."],
  enteredHouse:["🏚","At the door the house turned crooked. The Crooked Man: 'We've been expecting you. You are cursed.'"],
  // Session 6
  portraitsSeen:["🖼","Portraits in the foyer: the Lockwoods, the Druskenvalds… and us, smiling, with no teeth."],
  peacockDone:["🦚","Lucky went for the peacock's bloodstone eye for Tessie. It animated; he got stuck in a painting. The Gem."],
  weaselsF1Done:["🐀","Lucky's nat 1 brought weasels out of the walls. Azareth kept two pelts."],
  ouijaDone:["🔮","The spirit board (A.D.): Patrini, trapped by the hag in the attic. Six heirlooms. FIND MY SON! HE LIVES!"],
  petuniaAsked:["🍵","Lucky charmed the ghost with the teacup into wanting wine. No kiss."],
  ovenOpened:["🔥","Lucky picked the screaming oven's lock while Poppi yelled at him to stop. It was a trap."],
  got_cup:["🍷","Petunia traded her cup for the wine. 'Help my children.' Her green scarf fell to the floor."],
  feastDone:["🦃","The turkey was a monster. Tessie finished it: a gold ring and a Pearl of Power."],
  musicWeasels:["🐀","Weasels in the music room: 'Fesela Browntooth will sacrifice your soul.'"],
  harpDone:["🎹","Lucky and the ghost of Joseph Patrini played the harpsichord together. A black key popped out."],
  // Session 7
  krodhaMirror:["🪞","Krodha's mirror double: 'You are born to sin and must consume sin to survive.'"],
  clockDone:["🕰","The grandfather clock struck twelve: spirits covered in weasels. Lucky killed the clock; Azareth put teeth in her mouth. A pocketwatch: 'Remember the 3rd.'"],
  sallyMet:["🪆","Sally Lockwood, a wooden doll, asked us to check for monsters."],
  lurkerDone:["👁","The monster was in the window. Poppi got the killing blow. Azareth's sign: LURKER-IN-THE-LIGHT."],
  bathDone:["🛁","Lucky pulled back the shower curtain and accepted his fate. Azareth saved him from drowning in blood. A wooden ducky."],
  key_satchel:["👝","Krodha took a satchel with an eye on it: a bag of holding with a Lurker-in-the-Dark inside."],
  got_doll:["🪆","Sally tucked herself into bed. The Doll."],
  key_journal:["📓","Phillip's journal: in Wickermoor he lost his powers as the Lord of Death."],
  jasperDone:["🤵","Phillip's suit full of weasels, and Filthy Jasper. 'Fesla, Fesla, Fesla.'"],
  balconySeen:["⛈","The balcony: a horrible storm, black mists and shrouds."],
  // Session 8
  key_pin:["📌","Lucky cut open the bear. A woman's face in its mouth. Gail left a bobby pin in its nose. The Pin."],
  taleTold:["📖","Lucky told Whisp a tale and a book filled itself with the story."],
  whispGone:["🐈","Poppi shot at Whisp the cat. He was a Ketgrinn and flew out the window."],
  beastCalled:["🐻","A taxidermy beast that looked like the one Tessie hunts locked eyes with her. It is not dead."],
  luckyBard:["🎵","Lucky devoured music theory and fairytales: the beginning of Bard Lucky."],
  lore_malediction:["📕","Poppi found a book in the language of her stolen page: her curse, blank pages, eyes and wings."],
  lore_lethica:["🧠","Azareth found an essay by Matron Lethica of Memory's Rest."],
  got_bear:["🧸","Caster brought the blue bear to the crying baby. Lucky held him until he faded. The Bear."],
  runesOpen:["🔴","Six heirlooms in the runes. The door opened onto a floor of teeth and a red cauldron."],
  vesslaDone:["🧙","Vessla Browntooth was pretending to be Adela. Krodha's face was disfigured; Poppi obliterated the hag. 'Sisters!'"],
  gameDone:["🍽","The Druskenvalds: confused, not happy we went through their things, grateful. Dinner in a few days. Stonoga Blackstinger & Gollub Graygullet scratched in the walls."],
};
const NOTE_SESSION={"badge_smoothTalker":3,"harlequinBeaten":1,"boarded":1,"shroudDone":1,"cracksealed":1,"metDrusk":1,"tarotDone":1,"freed_daydreamer":1,"visionSeen":1,"freed_songstress":1,"freed_sweetheart":1,"freed_mariner":1,"tigerFed":1,"freed_jailbird":1,"key_mcquestcase":1,"harlequinDealt":1,"cagesOpen":1,"trainCrash":1,"lvl2":2,"jarsDone":2,"locoDefeated":2,"druskReward":2,"climbedPine":2,"wolvesDone":2,"goatFree":2,"ritualTalked":2,"sacrificeOffered":2,"badge_democracy":2,"metAlda":2,"innNight1":2,"boardRead":2,"metBaltus":2,"metEleanor":2,"ency":2,"metThomasin":2,"jacketOrdered":2,"cloakOrdered":2,"metSolomon":3,"key_finger":3,"fingerIdentified":3,"fingerReturned":3,"taylorUnlocked":3,"key_hexbag":3,"taylorNote":3,"hexMorgan":3,"hexKnown":3,"metHilda":3,"metFinneas":3,"gotMap":3,"caster":3,"bodySeen":3,"campFound":3,"riverCrossed":3,"marshHaintDone":3,"goodberry":3,"gravesRobbed":4,"gateOpen":4,"inscription":4,"handOpen":4,"chalked":4,"alchOpen":4,"luckyPotion":4,"noHands":4,"handtakerDone":4,"mysterySolved":5,"ch3back":5,"luckyJacket":5,"wolfCloak":5,"reportedDoris":5,"hexDestroyed":5,"effigyMorgan":5,"weaselsKnown":5,"greenQueenLore":5,"greyTalk2":5,"metRandall":5,"poppiFinger":5,"rustyWarned":5,"metJenkins":5,"enteredHouse":5,"portraitsSeen":6,"peacockDone":6,"weaselsF1Done":6,"ouijaDone":6,"petuniaAsked":6,"ovenOpened":6,"got_cup":6,"feastDone":6,"musicWeasels":6,"harpDone":6,"krodhaMirror":7,"clockDone":7,"sallyMet":7,"lurkerDone":7,"bathDone":7,"key_satchel":7,"got_doll":7,"key_journal":7,"jasperDone":7,"balconySeen":7,"key_pin":8,"taleTold":8,"whispGone":8,"beastCalled":8,"luckyBard":8,"lore_malediction":8,"lore_lethica":8,"got_bear":8,"runesOpen":8,"vesslaDone":8,"gameDone":8}; // canonical session of each highlight

function onFlag(f){
  if(V6_QUIET)return;
  const n=NOTE_FLAGS[f];if(n)addNote("canon",n[0],n[1],{key:"f:"+f,quiet:true,s:NOTE_SESSION[f]||0});
  if(FLAG_HOOKS[f])try{FLAG_HOOKS[f]();}catch(e){console.error(e);}
}
const FLAG_HOOKS={}; // filled by ledger/days layers
{const _sf=setF;setF=function(f){const was=STATE&&STATE.flags[f];_sf(f);if(!was)onFlag(f);};}
{const _gk=giveKey;giveKey=function(k){_gk(k);if(STATE&&!STATE.flags["key_"+k])setF("key_"+k);};}
{const _bd=badge;badge=function(k){const had=STATE&&STATE.badges[k];_bd(k);if(!had&&STATE&&STATE.badges[k])onFlag("badge_"+k);};}
{const _ll=learnLore;learnLore=function(k){const had=STATE&&STATE.lore[k];_ll(k);if(!had&&STATE&&STATE.lore[k])onFlag("lore_"+k);};}

/* ---------------------------------- false rumors (recap distractors) ---- */
const RUMORS={
  1:["Tessie killed the ghost tiger for the Harlequin.","The Vagrant let Lucky drive the train for a while.","Phillip let Lucky open the Druskenvald trunks.","Krodha sealed the cracked window with his gourd.","Poppi read every single letter in the mail car.","The Sweetheart gave Azareth her locket."],
  2:["Lucky won a duel against the Mayor.","The Vagrant drove us all the way to Wickermoor.","The ritual goat was sacrificed to the oak after all.","Lucky sold his soul-flame jar to Baltus for a fortune.","Eleanor let Lucky borrow from the occult section.","Krodha finished his wolf disguise."],
  3:["Morgan kept the hex bag as a paperweight.","Hilda walked us all the way to the chapel.","Constable Doris made Lucky an honorary deputy.","Seth and Isabella Taylor were home and made us tea.","Finneas let Lucky teach a class.","Weston sold the marble finger to the mason."],
  4:["Lucky rode the Hand-Taker like a horse.","Azareth's Hold Person worked perfectly.","Krodha's giant weasel pulled the iron gate off its hinges.","We had a long, dry, comfortable rest in the chapel yard.","The handless figures sang hymns to us."],
  5:["Randall Graham drove us to Foxwillow.","The Constable kept the finger effigy on her desk.","The weasels told us exactly who their Master was.","Finneas finally let Lucky teach at the schoolhouse.","The Jenkins came into the house with us."],
  6:["There was a real person in the oven and we saved them.","Petunia kissed Lucky.","Azareth ran the spirit board for everyone.","The turkey was delicious.","Tessie rode the peacock."],
  7:["Sally came with us happily from the start.","Krodha's mirror double shook his hand.","Lucky took a nice, relaxing bath.","Phillip's journal was left unlocked.","The clock paid out forty gold pieces."],
  8:["Whisp told us everything he knew.","Azareth's Entangle only caught the hag.","The Druskenvalds were thrilled we went through their things.","Lucky adopted the spectral baby.","Poppi's crossbow bolt hit the cat."],
  9:["The Taylors came home and thanked us.","Randall already drove us to Foxwillow.","Eleanor finished Azareth's research.","We went to Memory's Rest.","Old Rusty says the cemetery is shrinking.","Holly showed us what's in her cellar."],
};

/* ---------------------------------- the sessions ------------------------ */
const hk=k=>hasKey(k);
const SESSIONS=[null,
 {n:1,title:"The Mists and the Ghost Train",date:"Dec 24, 2025",
  last:"Mist. A train platform in the middle of nowhere. Five strangers, each holding a ticket they don't remember buying.",
  quests:["Wait for and Board the Ghost Train","Fight the Mist-Infused Spirits","Survive"],
  tasks:[
   {id:"board",label:"Wait for and board the Ghostlight Express",from:"a ticket nobody bought",done:()=>hasF("boarded")},
   {id:"shroud",label:"Deal with the crooked-necked passenger",from:"The Vagrant",done:()=>hasF("shroudDone")},
   {id:"crack",label:"Seal the cracked window",from:"The Vagrant",opt:true,done:()=>hasF("cracksealed")},
   {id:"drusk",label:"Meet the living couple in the lounge",from:"the lounge car",done:()=>hasF("metDrusk")},
   {id:"tarot",label:"Have your fates read",from:"Adela Druskenvald",opt:true,done:()=>hasF("tarotDone")},
   {id:"spirits",label:()=>"Help spirits with unfinished business ("+spiritsFreed()+"/6)",from:"The Vagrant",opt:true,done:()=>spiritsFreed()>=6},
   {id:"harl",label:"Settle things with the Harlequin",from:"the circus car",done:()=>hasF("harlequinDealt")},
   {id:"furnace",label:"Enter the furnace car",from:"The Vagrant",done:()=>hasF("trainCrash")}]},
 {n:2,title:"Fight the Train · Wickermoor",date:"Feb 15, 2026",levelAtStart:[2,"We all level up before the fight."],
  last:"The Ghostlight Express went off the rails and threw us into the black woods. The locomotive swung around with a giant, gaping mouth. Boss battle time.",
  quests:["Survive","Fight the Train","Escort Phillip and Adela Druskenvald to Wickermoor Hollow","Gain more information for the Antiquarian","The Cursed Wife","The Dead Man and the Marble Finger"],
  tasks:[
   {id:"jars",label:()=>"Collect soul-flame jars ("+Math.min(6,jarCount())+"/6)",from:"The Vagrant",done:()=>hasF("jarsDone")},
   {id:"loco",label:"Fight the Train",from:"the Locomotive",done:()=>hasF("locoDefeated")},
   {id:"reward",label:"Collect the Druskenvalds' thanks",from:"Phillip Druskenvald",done:()=>hasF("druskReward")},
   {id:"pine",label:"Climb a tall pine and get a look",from:"Krodha",opt:true,done:()=>hasF("climbedPine")},
   {id:"escort",label:"Escort Phillip & Adela to Wickermoor",from:"Phillip Druskenvald",done:()=>hasF("arrived")},
   {id:"wolves",label:"Stop the wolves at the Founder's Round",from:"the clocktower",done:()=>hasF("wolvesDone")},
   {id:"mayor",label:"Hear out the Mayor",from:"Mayor Somerton",done:()=>hasF("ritualTalked")},
   {id:"inn",label:"Spend the night at the Green Queen Inn",from:"Alda Farnum",done:()=>hasF("innNight1")},
   {id:"board",label:"Read the Community Board",from:"the innkeeper",done:()=>hasF("boardRead")},
   {id:"trade",label:"Visit Tolliver's Trading Post",from:"the square",done:()=>hasF("metBaltus")},
   {id:"books",label:"Visit the Antique Bookstore",from:"Baltus Tolliver",done:()=>hasF("metEleanor")},
   {id:"tailor",label:"Visit A Stitch in Time",from:"Baltus Tolliver",done:()=>hasF("metThomasin")},
   {id:"jacket",label:"Commission Lucky's puffer jacket",from:"Lucky",opt:true,done:()=>hasF("jacketOrdered")}]},
 {n:3,title:"The Masonry, the Hex Bag & the Wytchwood",date:"Mar 7, 2026",
  last:"We fought the train, walked the Druskenvalds to Wickermoor, broke up a wolf ritual, and read the Community Board: a cursed wife and a dead man holding a marble finger.",
  quests:["The Cursed Wife","The Dead Man and the Marble Finger"],
  tasks:[
   {id:"mason",label:"Ask the Mason about the marble finger",from:"Thomasin Ardor",done:()=>hasF("metSolomon")},
   {id:"finger",label:"Get the finger from the Constabulary",from:"Solomon Roderick",done:()=>hasF("key_finger")||hasF("fingerReturned")},
   {id:"ident",label:"Show Solomon the finger",from:"Solomon Roderick",done:()=>hasF("fingerIdentified")},
   {id:"church",label:"Return the finger to the Brightsinger church",from:"Solomon Roderick",done:()=>hasF("fingerReturned")},
   {id:"taylor",label:"Search the Taylor farm",from:"Seth Taylor's note",done:()=>hasF("key_hexbag")||hasF("hexMorgan")},
   {id:"note",label:"Leave the Taylors a note",from:"the empty farmhouse",opt:true,done:()=>hasF("taylorNote")},
   {id:"morgan",label:"Show the hex bag to Morgan",from:"the hex bag",done:()=>hasF("hexMorgan")},
   {id:"elea",label:"Ask the Antiquarian about the hex bag",from:"Morgan",done:()=>hasF("hexKnown")},
   {id:"hilda",label:"Talk to Hilda at the Inn",from:"Weston Murdoch",done:()=>hasF("hildaGuide")},
   {id:"map",label:"Pick up Finneas's map at the schoolhouse",from:"Finneas Trout",done:()=>hasF("gotMap")},
   {id:"wood",label:"Follow Hilda into the Wytchwood",from:"Hilda Brom",done:()=>hasF("wytchwoodIn")},
   {id:"body",label:"See where the body was found",from:"Hilda Brom",done:()=>hasF("bodySeen")},
   {id:"camp",label:"Follow the freshest tracks",from:"Tessie",done:()=>hasF("campFound")},
   {id:"river",label:"Cross the river",from:"the trail",done:()=>hasF("riverCrossed")},
   {id:"marsh",label:"Into the Marsh of Hunger",from:"the trail",done:()=>hasF("marshHaintDone")}]},
 {n:4,title:"Deeper into the Woods · The Chapel of the Hands",date:"Apr 7, 2026",
  last:"The finger went home to the knight. Hilda led us into the Wytchwood, Caster found Tessie, and past the river, in the Marsh of Hunger, a haint shuffled up behind us.",
  quests:["The Dead Man and the Marble Finger","Looking for the Creature that Killed Ed Hardy"],
  tasks:[
   {id:"graves",label:"Search the ancient graves",from:"the marsh",opt:true,done:()=>hasF("gravesRobbed")},
   {id:"gate",label:"Get past the chained iron gate",from:"the road",done:()=>hasF("gateOpen")},
   {id:"bowls",label:"Solve the three bowls",from:"the great hand",done:()=>hasF("handOpen")},
   {id:"chalk",label:"Mark the way back",from:"Lucky",opt:true,done:()=>hasF("chalked")},
   {id:"alch",label:"Open the locked iron door",from:"the corridor",opt:true,done:()=>hasF("alchOpen")},
   {id:"smoke",label:"Descend into the smoke",from:"the stairs",done:()=>hasF("templeSeen")},
   {id:"boss",label:"Find what the handless pray to",from:"the platform",done:()=>hasF("handtakerDone")}]},
 {n:5,title:"Out of the Woods · Back to Town",date:"Apr 21, 2026",
  last:"Ancient graves, an iron gate, the three bowls. Down in the smoke the handless prayed to something on a platform. We killed it and took its idol of fingers.",
  quests:["The Dead Man and the Marble Finger","Looking for the Creature that Killed Ed Hardy","The Weasels Want Your Teeth","The Crooked House"],
  tasks:[
   {id:"solve",label:"Loot the temple and solve the mystery",from:"the Chapel of the Hands",done:()=>hasF("mysterySolved")},
   {id:"back",label:"Walk back to Wickermoor",from:"five-ish days",done:()=>hasF("ch3back")},
   {id:"doris",label:"Report to Constable Doris",from:"the Dead Man case",done:()=>hasF("reportedDoris")},
   {id:"jacket",label:"Pick up Lucky's jacket",from:"Thomasin Ardor",opt:true,done:()=>hasF("luckyJacket")},
   {id:"cloak",label:"Azareth's wolf-pelt cloak",from:"Thomasin Ardor",opt:true,done:()=>hasF("wolfCloak")||!hasF("cloakOrdered")&&!hk("pelt")},
   {id:"hex",label:"Have Morgan destroy the hex bag",from:"Morgan",done:()=>hasF("hexDestroyed")},
   {id:"weasel",label:"Why are there so many weasels?",from:"the square",done:()=>hasF("weaselsKnown")},
   {id:"effigy",label:"Show Eleanor the finger effigy",from:"the case",done:()=>hasF("ch4")},
   {id:"green",label:"Ask Eleanor about the weasels and teeth",from:"the weasels",opt:true,done:()=>hasF("greenQueenLore")},
   {id:"grey",label:"Hear Finneas out on the Grey",from:"Finneas Trout",opt:true,done:()=>hasF("greyTalk2")},
   {id:"randall",label:"Meet Randall Graham",from:"the Inn",done:()=>hasF("metRandall")},
   {id:"jenkins",label:"Say hello to the Jenkins",from:"the hill",opt:true,done:()=>hasF("metJenkins")},
   {id:"manor",label:"Go up the hill to the Druskenvald manor",from:"Eleanor",done:()=>hasF("enteredHouse")}]},
 {n:6,title:"The Crooked House · Ground Floor",date:"May 5, 2026",
  last:"Back in town: case closed, 'Teeth for the Master', and Eleanor sent Poppi to the manor's library. At the front door the house turned crooked. The Crooked Man was waiting.",
  quests:["The Weasels Want Your Teeth","Investigate / Survive the Crooked House","Find / Save the children, Adela and Phillip","Find the 6 Mementos"],
  tasks:[
   {id:"portraits",label:"Look at the foyer portraits",from:"the foyer",opt:true,done:()=>hasF("portraitsSeen")},
   {id:"gem",label:"The marble peacock (Gem)",from:"the turret room",done:()=>hasF("peacockDone")},
   {id:"ouija",label:"Ask the spirit board",from:"the parlour",done:()=>hasF("ouijaDone")},
   {id:"cup",label:"The ghost with the teacup (Cup)",from:"the conservatory",done:()=>hasF("got_cup")},
   {id:"oven",label:"The screaming oven",from:"the kitchen",opt:true,done:()=>hasF("ovenOpened")},
   {id:"feast",label:"The Feast",from:"the dining room",opt:true,done:()=>hasF("feastDone")},
   {id:"key",label:"The harpsichord (Key)",from:"the music room",done:()=>hasF("harpDone")}]},
 {n:7,title:"The Crooked House · Upper Floor",date:"Aug 12, 2026",
  last:"Portraits of us with no teeth, a peacock, the spirit board ('FIND MY SON'), Petunia's cup, the Feast, and a duet with Joseph Patrini. We slept in the Music Room behind the Immovable Rod.",
  quests:["The Weasels Want Your Teeth","Investigate / Survive the Crooked House","Find / Save the children, Adela and Phillip","Find the 6 Mementos (4/6)"],
  tasks:[
   {id:"mirror",label:"Krodha and the crooked mirror",from:"the music room",opt:true,done:()=>hasF("krodhaMirror")},
   {id:"clock",label:"The grandfather clock",from:"the sitting room",done:()=>hasF("clockDone")},
   {id:"doll",label:"Check for monsters (Doll)",from:"Sally Lockwood",done:()=>hasF("got_doll")},
   {id:"bath",label:"The steamy bathroom",from:"Lucky's curiosity",opt:true,done:()=>hasF("bathDone")},
   {id:"journal",label:"Phillip's locked journal",from:"the master bedroom",opt:true,done:()=>hasF("key_journal")},
   {id:"jasper",label:"The thing under the sheet",from:"the master bedroom",done:()=>hasF("jasperDone")},
   {id:"balcony",label:"The balcony doors",from:"the master bedroom",opt:true,done:()=>hasF("balconySeen")}]},
 {n:8,title:"The Crooked House · The Attic",date:"Sep 17, 2026",
  last:"The clock of weasels, Sally and the Lurker, Lucky's blood bath, Filthy Jasper in Phillip's suit, and a storm outside the balcony. Eustace Lockwood is the Crooked Man.",
  quests:["The Weasels Want Your Teeth","Investigate / Survive the Crooked House","Find / Save the children, Adela and Phillip","Find the 6 Mementos (4/6)"],
  tasks:[
   {id:"pin",label:"The trophy room (Pin)",from:"the top floor",done:()=>hasF("key_pin")||hasF("vesslaDone")},
   {id:"library",label:"Search the library",from:"Eleanor's advice",opt:true,done:()=>hasF("readLibrary")},
   {id:"whisp",label:"The gray cat",from:"the library",opt:true,done:()=>hasF("taleTold")||hasF("whispGone")},
   {id:"bear",label:"The crying baby (Bear)",from:"the nursery",done:()=>hasF("got_bear")},
   {id:"attic",label:"Up through the trapdoor",from:"the Crooked Man",done:()=>hasF("inAttic")},
   {id:"runes",label:"Slot the six heirlooms",from:"the runes",done:()=>hasF("runesOpen")},
   {id:"hag",label:"The Hag in the Attic",from:"the Druskenvalds",done:()=>hasF("vesslaDone")}]},
 {n:9,title:"Between Sessions · Days in Wickermoor",date:"after Sep 17, 2026",open:true,between:true,
  last:"We killed Vessla Browntooth in the attic and saved the Druskenvalds. Dinner in a few days. Two more names scratched in the walls: Stonoga Blackstinger and Gollub Graygullet.",
  quests:["The Cursed Wife","Information for the Antiquarian","Go to Memory's Rest","Krodha's Grey","Investigate the Bakery","Find / Save the Son","Get a Mailbox"],
  tasks:()=>DOWNTIME_TASKS},
];
const SESS_BREAK_INLINE={1:1,3:1,4:1,5:1,6:1,8:1}; // these end mid-script, exactly where the table stopped

/* ---------------------------------- the ritual --------------------------- */
function statSnap(){const S=STATE.stats,x=X();return {battles:S.battles,wins:S.wins,crits:S.crits,nat20:S.nat20,nat1:S.nat1,kos:S.kos,gold:STATE.gold,xp:STATE.xp,heard:x.heard,calls:x.calls,look:Object.values(x.look).filter(l=>l.looked).length,day:x.day,secrets:Object.keys(STATE.secrets).length,badges:Object.keys(STATE.badges).length};}
async function sessionBreak(n,opt){
  const x=X();if(!x.session)x.session=sessionFromFlags(STATE.flags);
  while(x.session<=n&&!x.wrapped[x.session]){const k=x.session;await wrapSession(k,k===n?opt:null);}
}
let WRAPPING=false;
async function wrapSession(n,opt){opt=opt||{};
  const x=X();if(x.wrapped[n])return;WRAPPING=true;
  try{
    lockInput(true);banner("THAT'S THE SESSION","Session "+n+" · "+SESSIONS[n].title);SFX.toll();await sleep(1600);lockInput(false);
    await explainOnce("sessions");
    await openRecapComposer(n);
    await openQuestLog(n);
    x.wrapped[n]=Date.now();x.session=n+1;x.sessStart[n+1]=statSnap();x.snooze={};
    const S2=SESSIONS[n+1];
    if(S2&&S2.levelAtStart&&STATE.level<S2.levelAtStart[0]){setF("lvl"+S2.levelAtStart[0]);await levelTo(S2.levelAtStart[0],S2.levelAtStart[1]);}
    saveGame();
    if(S2&&!opt.noCard)await openSessionCard(n+1);
  }finally{WRAPPING=false;}
}
function docHead(title,sub){return `<div class="doc"><div class="doc-h">${esc(title)}</div>${sub?`<div class="doc-s">${esc(sub)}</div>`:""}`;}
function openRecapComposer(n){
  return new Promise(res=>{
    const S=SESSIONS[n],x=X();
    const real=notesFor(n).map(q=>({t:q.icon+" "+q.text,real:true}));
    const fakes=(RUMORS[n]||RUMORS[9]).slice().sort(()=>Math.random()-.5).slice(0,3).map(t=>({t:"🗣 "+t,real:false}));
    const items=real.concat(fakes).sort(()=>Math.random()-.5);
    const T=sessTasks(n);
    let h=docHead("Session Recap #"+n,S.title+" · recap dated "+S.date)+
      `<p class="doc-k">Last Time:</p><p class="doc-p">${esc(S.last)}</p>
       <p class="doc-k">Quests:</p><ul class="doc-l">${S.quests.map(q=>`<li>${esc(q)}</li>`).join("")}</ul>
       <p class="doc-k">Done this session:</p><ul class="doc-l">${T.filter(taskDone).map(t=>`<li>✓ ${esc(typeof t.label==="function"?t.label():t.label)}</li>`).join("")||"<li>—</li>"}</ul>
       <p class="doc-k">Highlights:</p><p class="sub" style="color:var(--dim)">Tick every highlight that really happened this session, and nothing that didn't. (Rumors travel fast in the Hollow.)</p></div>
       <div id="rcItems"></div><div class="row" style="margin-top:10px"><button class="btn nav" id="rcSend">✍ Finish the recap</button></div>`;
    openModal("📝 WRITE THE SESSION RECAP","Session "+n+" · ↑↓ A to tick",h,navList(true));
    MODAL_CB=()=>res();
    const sel=new Set(),box=$("rcItems");
    items.forEach((it,k)=>{const b=document.createElement("button");b.className="rcit nav";b.innerHTML=`<span class="ck">☐</span> ${esc(it.t)}`;
      b.onclick=()=>{if(sel.has(k)){sel.delete(k);b.classList.remove("on");b.querySelector(".ck").textContent="☐";}else{sel.add(k);b.classList.add("on");b.querySelector(".ck").textContent="☑";}tone(620,.02,"square",.012);};box.appendChild(b);});
    if(!real.length)box.innerHTML+=`<p class="sub">(Nothing was logged this session — maybe you jumped ahead with the DM Screen. Just finish the recap.)</p>`;
    $("rcSend").onclick=()=>{
      const got=items.filter((it,k)=>it.real&&sel.has(k)).length,missed=items.filter((it,k)=>it.real&&!sel.has(k)),extra=items.filter((it,k)=>!it.real&&sel.has(k));
      const perfect=!missed.length&&!extra.length&&real.length>0;
      x.recaps[n]={real:real.length,got,fakes:extra.length,perfect};
      let who,line;
      if(perfect){who="poppi";line="\"Perfect. Every detail, nothing made up. I'd put this in a library.\"";badge("scribe");}
      else if(extra.length){who="lucky";line=`"For the record: ${extra.map(e=>e.t.replace(/^\S+\s/,"")).join(" ALSO: ")} …did NOT happen. Although I wish it had."`;}
      else {who="azareth";line=`"You forgot: ${missed.slice(0,3).map(m=>m.t.replace(/^\S+\s/,"")).join(" / ")}${missed.length>3?" …and "+(missed.length-3)+" more":""}. If it is not in the recap, it did not happen. That is how I lose things."`;}
      $("mbody").innerHTML=docHead("Session Recap #"+n+" — filed",`${got}/${real.length} highlights · ${extra.length} rumor${extra.length===1?"":"s"}`)+
        `<div class="banner ${perfect?"ok":extra.length?"no":"fact"}">${perfect?"✦ A perfect recap.":"The table reads it back…"}</div></div>
        <div class="card" style="margin-top:8px"><h4>${esc(nameOf(who))}</h4><div>${esc(line)}</div></div>
        <div class="row" style="margin-top:10px"><button class="btn nav" id="rcNext">📜 Update the Quest Log</button></div>`;
      if(perfect)SFX.win();else SFX.ok();
      $("rcNext").onclick=()=>closeModal();};
  });
}
function questLogHTML(opt){opt=opt||{};
  const QS=QORDER.filter(q=>STATE.quests[q]);const act=QS.filter(q=>!STATE.quests[q].done),dn=QS.filter(q=>STATE.quests[q].done);
  const line=q=>{const Q=QUESTS[q],s=STATE.quests[q];const st=Q.steps[Math.min(s.step,Q.steps.length-1)];return `<li><b>${esc(Q.name)}</b>${s.done?"":`<div class="sub">▸ ${esc(st)}</div>`}${Q.frontier&&!s.done?`<div class="sub front">▸ at the table: ${esc(Q.frontier)}</div>`:""}</li>`;};
  let h=`<p class="doc-k">Current Main Quests:</p><ul class="doc-l">${act.filter(q=>QUESTS[q].main).map(line).join("")||"<li>—</li>"}</ul>
    <p class="doc-k">Other Quests:</p><ul class="doc-l">${act.filter(q=>!QUESTS[q].main).map(line).join("")||"<li>—</li>"}</ul>`;
  if(hasF("gotMap"))h+=`<p class="doc-k">Places to Visit:</p><ul class="doc-l">${REGIONS.filter(r=>r.lock).map(r=>`<li>${esc(r.name)} <span class="sub">— ${esc(r.lock)}</span></li>`).join("")}</ul>`;
  h+=`<p class="doc-k">Completed Quests:</p><ul class="doc-l done">${dn.map(q=>`<li>${esc(QUESTS[q].name)}</li>`).join("")||"<li>—</li>"}</ul>`;
  const P=Object.values(X().promises);
  if(P.length)h+=`<p class="doc-k">Promises:</p><ul class="doc-l">${P.map(p=>`<li>${p.kept?"✓":"○"} ${esc(p.text)} <span class="sub">— ${p.by==="us"?"we promised":"promised to us"} · ${esc(p.who)}</span></li>`).join("")}</ul>`;
  if(X().tableLog.length)h+=`<p class="doc-k">From the table (DM notes):</p><ul class="doc-l">${X().tableLog.map(t=>`<li>${esc(t.t)} <span class="sub">— S${t.s} · ${esc(t.d)}</span></li>`).join("")}</ul>`;
  return h;}
function openQuestLog(n){
  return new Promise(res=>{
    const x=X(),a=x.sessStart[n]||{battles:0,wins:0,crits:0,nat20:0,nat1:0,kos:0,gold:10,xp:0,heard:0,calls:0,look:0,day:1,secrets:0,badges:0},b=statSnap();
    const nums=[["Battles won",b.wins-a.wins],["Crits",b.crits-a.crits],["Nat 20s / 1s",(b.nat20-a.nat20)+" / "+(b.nat1-a.nat1)],["Party KOs",b.kos-a.kos],["Gold",(b.gold-a.gold>=0?"+":"")+(b.gold-a.gold)],
      ["XP","+"+(b.xp-a.xp)],["Days passed",b.day-a.day],["Villagers heard",b.heard-a.heard],["Party calls",b.calls-a.calls],["Looked closer",b.look-a.look],["Secrets",b.secrets-a.secrets],["Badges",b.badges-a.badges]];
    const open=Object.values(x.promises).filter(p=>p.by==="us"&&!p.kept).length;
    const [dn,tot]=sessCount(n);
    let h=docHead("Quests","updated after Session "+n+" · "+dn+"/"+tot+" session tasks")+questLogHTML()+
      `<p class="doc-k">This session by the numbers:</p><div class="grid2">${nums.map(([k,v])=>`<div class="stat"><b>${v}</b>${k}</div>`).join("")}</div></div>`;
    if(open>0||Object.values(x.promises).some(p=>p.by==="us")){
      h+=`<div class="card" style="margin-top:10px"><h4>Before you close the log…</h4><div class="sub">How many promises did <b>we</b> make that we haven't kept yet? Be honest.</div><div class="row" id="qlHon" style="margin-top:6px">${[0,1,2,3,4,5,6].map(k=>`<button class="btn alt nav" data-h="${k}">${k}${k===6?"+":""}</button>`).join("")}</div><div id="qlHonR"></div></div>`;
    }
    const nx=SESSIONS[n+1];
    h+=`<div class="row" style="margin-top:10px"><button class="btn nav" id="qlGo">${nx?"▶ Next time: "+esc(nx.between?"Between Sessions":"Session "+(n+1)):"Close"}</button></div>`;
    openModal("📜 THE QUEST LOG","Quests.docx · Session "+n,h,navList(true));MODAL_CB=()=>res();
    $("mbody").querySelectorAll("[data-h]").forEach(bn=>bn.onclick=()=>{if(x.honest[n]!=null)return;const g=+bn.dataset.h,ok=g===Math.min(6,open);
      x.honest[n]={said:g,open,ok};if(ok){addStanding("village",1,"honest about promises",true);badge("honest");}
      $("qlHonR").innerHTML=`<div class="banner ${ok?"ok":"no"}">${ok?`Honest. ${open} still open — and they're on the list.`:`It's ${open}. The Hollow keeps count even when you don't.`}</div>`;ok?SFX.ok():SFX.bad();});
    $("qlGo").onclick=()=>closeModal();
  });
}
function openSessionCard(n){
  return new Promise(res=>{
    const S=SESSIONS[n];const T=sessTasks(n);
    const h=`<div class="scard"><div class="sc-k">${S.between?"BETWEEN SESSIONS":"SESSION RECAP #"+n}</div><div class="sc-t">${esc(S.title)}</div>
      <div class="sc-d">${S.between?"The table hasn't played this yet — the days in Wickermoor keep going.":"Recap dated "+esc(S.date)}</div>
      <p class="doc-k">Last Time:</p><p class="doc-p">${esc(S.last)}</p>
      <p class="doc-k">Quests:</p><ol class="doc-l">${S.quests.map(q=>`<li>${esc(q)}</li>`).join("")}</ol>
      <p class="doc-k">${S.between?"Things to do":"Today's list"} (${T.filter(t=>!t.opt).length} + ${T.filter(t=>t.opt).length} optional):</p>
      <ol class="doc-l small">${T.map(t=>`<li>${esc(typeof t.label==="function"?t.label():t.label)}${t.opt?" <span class='sub'>(optional)</span>":""} <span class="sub">— ${esc(t.from||"")}</span></li>`).join("")}</ol>
      <button class="btn nav" id="scGo">▶ ${S.between?"Wake up in Wickermoor":"Play Session "+n}</button></div>`;
    openModal(S.between?"✦ BETWEEN SESSIONS":"✦ SESSION "+n,"",h,navList());MODAL_CB=()=>res();$("scGo").onclick=()=>closeModal();SFX.level();
  });
}

/* ---------------------------------- conditional wraps (S2, S7) ---------- */
let WRAP_T=0;
function sessionTick(dt){
  if(!STATE||!STATE.v6||WRAPPING)return;const x=X();WRAP_T+=dt;if(WRAP_T<.6)return;WRAP_T=0;
  // task toasts
  const n=x.session;sessTasks(n).forEach(t=>{const k=n+":"+t.id;if(!x.done[k]&&taskDone(t)){x.done[k]=1;if(!V6_QUIET){const [a,b]=sessCount(n);toast("✓ "+(typeof t.label==="function"?t.label():t.label)+(t.opt?"":" · "+a+"/"+b),"gold");}}});
  if(!canWalk()||SESSION_BLOCK())return;
  if(SESS_BREAK_INLINE[n])return;
  // a later session's content already started? wrap without asking
  const nx=SESSIONS[n+1];
  if(nx&&!nx.between&&sessReady(n)&&sessTasks(n+1).some(taskDone)){runScript(()=>sessionBreak(n));return;}
  if(sessReady(n)&&!x.snooze[n])runScript(async()=>{
    x.snooze[n]=1;
    const c=await ask(null,"📖 That's where Session "+n+" ended at the table.\nWrap the session and write the recap?",["Wrap it up (write Session Recap #"+n+")","Not yet — keep exploring (wrap from the Journal, or rest at the Inn)"]);
    if(c===0)await sessionBreak(n);});
}
const SESSION_BLOCK=()=>!!(X().goFind&&X().goFind.urgent);
{const _rp=restParty;restParty=async function(kind,where,quiet){await _rp(kind,where,quiet);const x=X();
  if(!quiet&&!WRAPPING&&!SESS_BREAK_INLINE[x.session]&&sessReady(x.session)&&!x.wrapped[x.session]&&SESSIONS[x.session+1]){await sessionBreak(x.session);}};}

/* ---------------------------------- NEXT UP ----------------------------- */
{const _obj=objective;objective=function(){
  if(!STATE)return null;const x=X();
  if(x.goFind){const g=x.goFind;return {text:g.text,sub:g.hint,tgt:null,go:true};}
  const V=VISITORS.find(v=>v.map===STATE.map&&v.seek&&!v.gone);if(V)return {text:V.seekText||"Someone wants a word",sub:"They're walking up to you.",tgt:{map:STATE.map,id:V.id},vis:true};
  const n=x.session;
  if(!SESS_BREAK_INLINE[n]&&sessReady(n)&&!x.wrapped[n]&&SESSIONS[n+1])return {text:"Wrap Session "+n+": write the recap",sub:"Journal ▸ Session ▸ Wrap — or take a long rest at the Inn.",tgt:null};
  const S=SESSIONS[n];
  if(S&&S.between){const t=sessTasks(n).find(t=>!taskDone(t)&&t.route);if(t){const r=t.route();if(r)return r;}return {text:"Live a day in Wickermoor",sub:"Villagers, errands, books for Eleanor. Rest at the Inn to end the day.",tgt:null};}
  return _obj();};}
{const _ot=objectiveTarget;objectiveTarget=function(){const o=objective();if(o&&o.vis){const V=VISITORS.find(v=>v.id===o.tgt.id);if(V)return {x:V.x,y:V.y};}return _ot();};}

/* ---------------------------------- HUD pill ----------------------------- */
{const pill=document.createElement("span");pill.className="pill";pill.id="hudSess";pill.style.cursor="pointer";pill.title="Session tasks (Journal)";
  const g=$("hudGold").parentElement;g.after(pill);pill.onclick=()=>{if(STATE&&canWalk())openMenu("session");};}
{const _uh=updateHUD;updateHUD=function(){_uh();if(!STATE||!STATE.v6)return;const x=X(),n=x.session,S=SESSIONS[n];if(!S)return;
  const [a,b]=sessCount(n);const ph=PHASES[x.phase]||PHASES[0];
  $("hudSess").innerHTML=(S.between?"📜 <b>Between Sessions</b>":`📜 <b>S${n}</b> ${a}/${b}`)+(hasF("ch2")?` · ${ph.icon} <b>Day ${x.day}</b> <span class="hphase">${ph.name}</span>`:"");};}

/* ---------------------------------- Journal ▸ Session tab --------------- */
MENU_TABS.splice(2,0,["session","Session"]);
MENU_HTML.session=()=>{const x=X(),n=x.session,S=SESSIONS[n];if(!S)return "";
  const T=sessTasks(n);const [a,b]=sessCount(n);
  let h=`<div class="scard" style="text-align:left"><div class="sc-k">${S.between?"BETWEEN SESSIONS":"SESSION "+n+" · "+esc(S.date)}</div><div class="sc-t" style="font-size:18px">${esc(S.title)}</div>
    <p class="sub">${S.between?"Open-ended days. The Quest Log keeps the threads; ▸ marks where the table hasn't played yet.":a+"/"+b+" required tasks done."} ${hasF("ch2")?"· Day "+x.day+", "+PHASES[x.phase].name:""}</p></div>
    <h4 style="color:var(--moon);margin:8px 0 4px">Tasks</h4>`;
  T.forEach(t=>{const d=taskDone(t);h+=`<div class="qitem${d?" done":""}${t.opt?"":" main"}">${d?"✓":"▸"} ${esc(typeof t.label==="function"?t.label():t.label)}${t.opt?" <span class='sub'>(optional)</span>":""}<span class="st">from ${esc(t.from||"—")}${t.front&&!d?" · ▸ at the table":""}</span></div>`;});
  if(!S.open&&!SESS_BREAK_INLINE[n]&&!x.wrapped[n]&&SESSIONS[n+1])h+=`<div class="row" style="margin-top:8px"><button class="btn nav" data-wrap="1" ${sessReady(n)?"":"disabled"}>✍ Wrap Session ${n}${sessReady(n)?"":" (finish the required tasks first)"}</button></div>`;
  const N=notesFor(n);h+=`<h4 style="color:var(--moon);margin:10px 0 4px">Session notes (${N.length})</h4>`+(N.length?N.slice().reverse().map(q=>`<div class="qitem"><span>${q.icon} ${esc(q.text)}</span><span class="st">Day ${q.day}</span></div>`).join(""):`<div class="sub">Nothing logged yet. The notes write themselves as things happen.</div>`);
  const past=Object.keys(x.recaps).map(Number);if(past.length)h+=`<h4 style="color:var(--moon);margin:10px 0 4px">Recaps written</h4>`+past.map(k=>{const r=x.recaps[k];return `<div class="qitem">Session Recap #${k} — ${r.got}/${r.real} highlights${r.fakes?` · ${r.fakes} rumor(s)`:""}${r.perfect?" · ✦ perfect":""}</div>`;}).join("");
  return h;};
MENU_WIRE.push((tab)=>{if(tab!=="session")return;const b=$("mbody").querySelector("[data-wrap]");if(b)b.onclick=()=>{closeModal();runScript(()=>sessionBreak(X().session));};});
{const _jh=MENU_HTML.journal;MENU_HTML.journal=()=>{const x=X();return `<div class="qitem main" style="border-left-color:var(--ghost)"><b>${SESSIONS[x.session]&&SESSIONS[x.session].between?"Between Sessions":"Session "+x.session}</b> — see the Session tab for today's list and notes.</div>`+
  `<details class="qlog"><summary>📜 Open the Quest Log (Quests.docx view)</summary>${questLogHTML()}</details>`+_jh();};}

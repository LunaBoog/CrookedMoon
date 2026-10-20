/* ================================ story.js ============================= *
 * Everything the party can talk to, poke, steal or set on fire — scripted
 * as async functions (await say / ask / battle / minigame). Canon comes
 * from Session Recaps #1–#8 and Quests.docx. */
const TALK={};
const EVENTS={};

/* ---- Quests (flag-reactive journal) ---- */
const QUESTS={
  train:{name:"Wait for and Board the Ghost Train",main:true,steps:["Find out where the tickets lead.","Board the Ghostlight Express."]},
  spirits:{name:"Fight the Mist-Infused Spirits",main:true,steps:["Deal with the crooked passenger.","Walk the train, car to car.","Reach the furnace car."]},
  unfinished:{name:"Unfinished Business",main:false,steps:["Passengers with unfinished business fuel the train. Help them move on — or leave them be. (6 spirits)"]},
  survive:{name:"Survive",main:true,steps:["The Ghostlight Express is going off the rails!","Collect 6 soul-flame jars for the Vagrant.","Restart the train… and fight it."]},
  escort:{name:"Escort Phillip & Adela to Wickermoor Hollow",main:true,steps:["Walk through the woods to the village.","Arrive at Wickermoor."]},
  explore:{name:"Explore the Town",main:true,steps:["Check the Community Board in the square.","Get your bearings: Inn, Trading Post, Bookstore, Tailor…"]},
  finger:{name:"The Dead Man and the Marble Finger",main:true,steps:["A body was found scared to death, holding a marble finger. Ask the Mason about it.",
    "Get the finger from the Constable.","Take the finger back to the Mason.","Return the finger to the Church and speak with Weston Murdoch.",
    "Meet Hilda at the Inn — she'll show you where the body was found.","Investigate the Wytchwood.","Find the creature that killed Ed Hardy (the Chapel of the Hands)."]},
  cursed:{name:"The Cursed Wife",main:true,steps:["Seth Taylor believes his new wife Isabella has been cursed — he blames his ex, Sadie Hardy. Go to the Taylor Farm.",
    "Figure out who put the Hex Bag in the Taylor Farm.","Speak with Seth and Isabella / wait for them to return."]},
  antiquarian:{name:"Information for the Antiquarian",main:false,steps:["Eleanor Heyling wants an accord: she researches, you fetch. Come back in a few days.","Go to the Library in the Druskenvald Manor.","Eleanor needs more time for Azareth's answers."]},
  memory:{name:"Go to Memory's Rest",main:false,steps:["Morgan the Apothecary suggested it as a place to help recover memories. (Azareth) — Chapter 5."]},
  grey:{name:"Krodha's \"Grey\" in Edwardia",main:false,steps:["Finneas Trout studies a curse called the Grey. Hear him out.","Meditate on opposites and moral relativism."]},
  bakery:{name:"Investigate the Bakery",main:false,steps:["Something is off at Bread by Holly."]},
  weasels:{name:"The Weasels Want Your Teeth",main:true,steps:["\"Teeth for the Master.\" Figure out what's controlling the weasels.","Randall Graham will give you a lift to Foxwillow if you solve it.","Find the Master."]},
  house:{name:"Explore / Escape the Crooked House",main:true,steps:["Go up the hill to the Druskenvald Manor.","Survive the Crooked House. Find the 6 Heirlooms: Gem, Cup, Key, Doll, Bear, Pin.","Find and save Adela & Phillip.","Defeat the Hag in the Attic."]},
  son:{name:"Find/Save the Son",main:false,steps:["\"FIND MY SON! HE LIVES!\" — the spirit board. Ask the Druskenvalds about the Patrini family."]},
  mailbox:{name:"Get a Mailbox",main:false,steps:["Open a mailbox at the Post Office."]},
  cook:{name:"The Slovenly Cook",main:false,steps:["Someone might be making rat pies out of Plagueborn. The bartender wasn't sure."]},
  cemetery:{name:"Explore the Cemetery Outside Town",main:false,steps:["Apparently it's been getting bigger and bigger each night. — Chapter 9."]},
};
const QORDER=Object.keys(QUESTS);

/* ---- helpers used across story ---- */
function heirloomCount(){return ["gem","cup","key","doll","bear","pin"].filter(k=>hasKey(k)).length;}
function jarCount(){let n=0;for(let i=1;i<=8;i++)if(hasF("jar"+i))n++;return n;}
function spiritsFreed(){return ["daydreamer","mariner","songstress","sweetheart","jailbird","harlequin"].filter(s=>hasF("freed_"+s)).length;}
function freeSpirit(id,name){setF("freed_"+id);toast("✦ "+name+" moves on ("+spiritsFreed()+"/6)","ghost");SFX.magic();addXP(40);
  if(spiritsFreed()>=6)badge("allAboard");}

/* ======================= PROLOGUE: THE PLATFORM ======================= */
TALK.stationBooth=async()=>{await say(null,"The ticket booth is shuttered. A card in the window, written in a spidery hand:\n\"NO FURTHER TICKETS REQUIRED. YOU ALREADY HAVE YOURS.\"");
  if(!hasKey("ticket")){giveKey("ticket");await say(null,"You check your pockets. There's a ticket there that wasn't a minute ago.");}};
TALK.stationSign=async()=>{await say(null,"The platform sign has one word, freshly painted over something older:\nDRUSKENVALD →");};
TALK.stationBench=async()=>{
  await say("krodha","\"Nice bench. Good bench. I think I was… meditating? And then there was a bar, and a bench, and now there's this bench.\"");
  await say("lucky","\"I don't remember buying a ticket. I remember WINNING something. Could've been a ticket.\"");
  await say("azareth","\"I don't remember anything. That is normal for me.\"");};
TALK.stationLamp=async()=>{await say(null,"The gas lamp gutters green. The fog beyond the platform edge is total — like the world was erased there.");};
TALK.stationEdge=async()=>{
  if(hasF("boarded"))return;
  if(!hasKey("ticket")){await say("tessie","(Tessie whispers) \"…Shouldn't we have tickets? The booth, maybe.\"");return;}
  await cutscene_trainArrives();
};
async function cutscene_trainArrives(){
  lockInput(true);
  SFX.whistle();shake(10);await sleep(600);
  await say(null,"A train whistle. Ghostly fiddling. The ground shakes and rumbles —");
  await trainCinematic();
  await say(null,"Out of the mist comes a locomotive with a lamp like a drowned moon, green smoke pouring off its stacks…");
  await trainPullsIn();
  SFX.fiddle();
  await say(null,"The Ghostlight Express glides in on rails that weren't there a moment ago. The fog parts, a door slides open, and out steps a frogman with a fiddle.");
  seeNpcPortrait("vagrant");
  await say("vagrant","\"Tickets, please! Ah — first-timers. Lovely.\"\n\"This is the Ghostlight Express. Next stop: DRUSKENVALD. Folks aboard can better explain where you are, and why.\"",{name:"The Vagrant",sub:"Conductor · Celestial"});
  await say("vagrant","\"Take a seat. Mind the other passengers — mostly spirits with unfinished business. Leave them alone, they'll leave you alone.\"\n\"Mostly.\"");
  const c=await ask("lucky","",["\"What's outside the train?\"","\"Where exactly IS Druskenvald?\"","\"All aboard!\""]);
  if(c===0)await say("vagrant","\"The Shroud. Those who enter are lost forever, wandering. So: don't open the windows.\"");
  if(c===1)await say("vagrant","\"A land of many provinces. The Druskenvalds rule it. You'll meet them — they're in the lounge.\"");
  takeKey("ticket");setF("boarded");qDone("train");qStart("spirits");qStart("unfinished");
  lockInput(false);STAGE.train=null;
  await warp("car_passenger",8,3,"right",{banner:["CHAPTER 1","The Ghostlight Express"]});
  playSong("train");
}

/* ======================= CH.1 THE GHOSTLIGHT EXPRESS =================== */
TALK.vagrantCar1=async()=>{
  if(!hasF("shroudDone"))await say("vagrant","\"That one there — crooked neck, staring at you. I'd not stare back.\"\n\"Actually, please DO deal with him. He's making the others nervous.\"");
  else if(!hasF("cracksealed"))await say("vagrant","\"The window's cracked. The Shroud gets in through cracks. Somebody ought to seal that.\"");
  else await say("vagrant","\"The spaces between the cars are liminal — black nothing. Walk quickly. The train is fueled by lost souls with unfinished business who never move on. You're welcome to help them… or leave them be.\"");
};
TALK.ghostPassenger=async()=>{await say(null,pick(["A passenger stares straight through you, at a station long gone.","\"…is this my stop?\" the ghost asks nobody.","The ghost is humming a song from a century you've never heard of."]));};
TALK.seatLoot=async()=>{if(hasF("seatLooted")){await say(null,"Just lint and a ghost's forgotten glove.");return;}
  setF("seatLooted");addGold(3);await say("lucky","\"Between the cushions: the three most beautiful words. 'Loose. Silver. Coins.'\"");};
TALK.crookedPassenger=async()=>{
  const lead=LEAD();
  await say(null,"The passenger's neck is bent at a wrong angle. Psycho-looking. He's staring at you. Only you.");
  const c=await ask(lead==="lucky"?"lucky":null,"",["Confront him (Lucky's way)","Politely ask if he's all right","Back away slowly"]);
  if(c===2){await say(null,"You back away. He turns his whole body to keep watching you. His neck makes a sound like a knuckle.");return;}
  if(c===0)await say("lucky","\"Hey pal. You got a problem? Because I've got a pistol and a VERY loose relationship with consequences.\"");
  else await say("azareth","\"Excuse me. Your neck is broken. Is that why you're looking at us?\"");
  shake(8);SFX.scream();
  await say(null,"Tendrils burst from him. He grows taller… and taller… CRACK — the window splinters, the mist pours in, and he SUCKS IT IN.");
  await say("vagrant","\"Ah. That's a Shrouded. Would you kindly?\"");
  const r=await battle("shroudpass");
  if(r==="win"){setF("shroudDone");seeMon("shroudpass");qStep("spirits",1);
    await say(null,"Part of it flees out the broken window. The other part tried to infect another passenger — and you put that down too.");
    await say("vagrant","\"Well struck! You'll want to seal that crack before more gets in.\"");}
};
TALK.windowCrack=async()=>{
  if(hasF("cracksealed")){await say(null,"A glob of candle wax seals the crack. It's holding. Mostly.");return;}
  await say("lucky","\"Candle wax. Burglar's pack. Never leave home without it.\"");
  setF("cracksealed");SFX.ok();addXP(20);await say(null,"Lucky seals the crack with candle wax. The mist outside presses against it, disappointed.");
  badge("waxOn");
};
TALK.daydreamer=async()=>{
  seeNpcPortrait("daydreamer");
  await say("daydreamer","\"Mmf. Want some sausage? It's pretend sausage. Everything's pretend here.\"",{name:"The Daydreamer",sub:"Ghost · 'Sausage Kid'"});
  const c=await ask(null,"",["\"What's waiting for you?\"","\"Why are you still on the train?\"","(Take a sausage)"]);
  if(c===2){giveKey("sausage");await say("lucky","\"Don't mind if I do.\" (Lucky pockets the whole plate.)");return;}
  await say("daydreamer","\"Everyone's mad at me. I stole things. A painted rock. Stuff. I keep eating so I don't have to think about it.\"");
  const d=await ask(null,"",["\"Just stop feeling bad.\" (Lucky)","\"You were a kid. Kids take rocks. You're forgiven.\"","\"Stealing is wrong.\""]);
  if(d===2){await say("daydreamer","\"…I KNOW.\" He goes back to chewing, sulking.");return;}
  await say("daydreamer",d===0?"\"…Huh. Just… stop? I can do that?\"":"\"Forgiven?\" He looks at his plate like he's never seen it.");
  await say(null,"The Daydreamer smiles — plump cheeks, floppy cap — and dissipates like steam off a plate.");
  if(!hasKey("sausage"))giveKey("sausage");freeSpirit("daydreamer","The Daydreamer");
};
TALK.deadDiner=async()=>{await say(null,pick(["Posh ghosts in evening wear. They don't see you. They don't react to you. Dreams are not trustworthy.","A spirit raises a glass to a toast that ended a hundred years ago.","The diner is cutting a steak that never gets smaller."]));};
TALK.diningTable=async()=>{await say(null,"An oval table set for twelve. Everything is perfect and nothing is edible. Except the kitchen still seems to be cooking…");};
TALK.diningKitchen=async()=>{
  if(!hasF("jailbirdHungry")){await say(null,"The galley stove is warm. Ghostly cooks move pans around. None of them look up.");return;}
  if(hasKey("steak")){await say(null,"You've already got two plates of steak & eggs.");return;}
  await say("tessie","(Tessie, very quietly) \"Um. Two steak and eggs, please? …And one extra steak. For a tiger.\"");
  await say(null,"A cook who's been dead since before plates were round slides three plates onto the counter.");
  giveKey("steak");SFX.item();};
TALK.mariner=async()=>{
  seeNpcPortrait("mariner");
  await say("mariner","\"Where's the sea? I have to be returned to the sea. I don't— I can't—\"",{name:"The Mariner",sub:"Ghost · a spectral gull on his hat"});
  if(hasKey("painting")){const c=await ask("poppi","",["Give him the seascape painting","Not yet"]);
    if(c===0){takeKey("painting");await say("poppi","\"It's the sea. It's a painting of the sea, but — it's the sea.\"");
      await say(null,"The Mariner stares into the painted storm. His shoulders drop. \"Aye. There she is.\" And he's gone, gull and all.");freeSpirit("mariner","The Mariner");}
    return;}
  await say("tessie","(Tessie talks to him.) \"…He needs to be returned to the sea. We don't have a sea.\"");setF("marinerKnown");
};
TALK.wetGhost=async()=>{await say(null,"A wet-looking ghost bursts out of a mail pile, knows you're there — and does not care. It sinks back into the envelopes.");};
TALK.mailPile=async()=>{
  if(hasKey("vinyl")){await say(null,"Letters to the dead, from the dead. Nothing else of use.");return;}
  await say("lucky","\"Mail, mail, bills… ooh.\" Lucky gets lucky: a VINYL RECORD in a paper sleeve.");giveKey("vinyl");};
TALK.mailSacks=async()=>{if(hasF("mailSacks")){await say(null,"Soggy postcards from the Shroud. 'Wish you were here.' Awful.");return;}setF("mailSacks");addGold(5);await say(null,"A sack of undeliverable mail. A coin purse slips out. 5gp.");};
TALK.adelaTrain=async()=>{
  seeNpcPortrait("adela");setF("metDrusk");
  if(!hasF("tarotDone")){
    await say("adela","\"First-timers! Oh, you have that look. Come, sit. I'm Adela — Adela Druskenvald. We're alive, if you're wondering. Not dead, not transformed. Headed home, to Wickermoor Hollow.\"",{name:"Adela Druskenvald",sub:"The Lady of Druskenvald"});
    await say("adela","\"Would you like your cards read? I do insist. My dreams are… prophetic, lately.\"");
    const c=await ask(null,"",["Have Adela read your fates (Tarot)","Maybe later"]);
    if(c===0){await minigame("tarot");setF("tarotDone");}
    return;}
  await say("adela",pick(["\"Druskenvald has many provinces, all full of people who look like you. Well. Mostly.\"","\"The Wheel of Fortune for the shy one. Everything will change. Isn't that thrilling?\"","\"Phillip hates when people call him King. Terribly pretentious. Call him Lord of Death instead — he hates that less.\""]));
};
TALK.phillipTrain=async()=>{seeNpcPortrait("phillip");setF("metDrusk");
  await say("phillip","\"Phillip Druskenvald. Leader of the communities hereabouts. Not 'King' — it's terribly pretentious.\"\n\"We're headed for our mansion near Wickermoor. You'll find the Hollow… traditional.\"",{name:"Phillip Druskenvald",sub:"Lord of Druskenvald"});
  if(LEAD()==="lucky")await say("lucky","\"Any chance of a barony? For a guy who, say, saves your life on a haunted train?\"\n\n\"…Ask me after the haunted train.\"");
};
TALK.songstress=async()=>{
  seeNpcPortrait("songstress");
  await say("songstress","\"I never got to be the singer. Always second string. There's a song — MY song — if I could hear it once more…\"",{name:"The Songstress",sub:"Ghost · fur stole, curled hair"});
  if(hasF("freed_songstress"))return;
  await say("poppi","\"Is there a place to play a record?\"\n\"The phonograph, darling. Over there. If anyone had the song.\"");setF("songKnown");};
TALK.phonograph=async()=>{
  if(hasF("freed_songstress")){await say(null,"The phonograph turns silently. Somewhere, applause.");return;}
  if(!hasKey("vinyl")){await say(null,"A brass-horned phonograph with no record on it.");return;}
  await say("lucky","\"Maestro.\" Lucky drops the needle on the record from the mail car.");
  SFX.harp(523);await sleep(150);SFX.harp(659);await sleep(150);SFX.harp(784);
  await say(null,"The Songstress begins to sing along — softly, then enormously — a GRAND OPERATIC FINISH that rattles the glasses behind the bar.\nShe bows. She dissipates.");
  freeSpirit("songstress","The Songstress");giveKey("vinyl");await say("lucky","\"And I keep the record. Now I have TWO. (…I have one. I'm counting the moral victory.)\"");};
TALK.loungePainting=async()=>{if(hasKey("painting")||hasF("freed_mariner")){await say(null,"A pale rectangle on the wallpaper where the painting hung.");return;}
  await say(null,"A stormy seascape in a gilt frame. Waves the color of old bottles.");
  if(hasF("marinerKnown")){const c=await ask("poppi","",["Take the painting (for the Mariner)","Leave it"]);if(c===0){giveKey("painting");await say("poppi","\"He needs the sea. We'll bring him the sea.\"");}}
  else await say(null,"(Someone on this train might want it.)");};
TALK.loungeLetter=async()=>{if(hasKey("loveletter")||hasF("freed_sweetheart")){await say(null,"An empty envelope.");return;}
  await say("krodha","\"A love letter. Unsigned. 'My dearest — I will come back for you.' …Man. That's heavy. I'm keeping it. For, uh. Safekeeping.\"");giveKey("loveletter");};
TALK.loungeBar=async()=>{await say(null,"Bottles of spirits (the drinking kind) and spirits (the other kind). A bartender who is mostly a mustache polishes one glass forever.");
  if(!hasF("barCoin")){setF("barCoin");addGold(4);await say(null,"Poppi finds 4gp under a coaster.");}};
TALK.cabin1=async()=>{await say(null,"Cabin #1 is locked, and smells of expensive perfume. It's obviously where Phillip and Adela sleep.");};
TALK.cabin2=async()=>{
  if(hasF("visionSeen")){await say(null,"The record player sits silent. Azareth won't look at it.");return;}
  await say("lucky","\"Cabin two's ajar. And there's a record player. With a RECORD.\" He sneaks in and lifts it off—");
  await say(null,"It starts playing anyway. A song Azareth knows. Her apocalypse song.");
  await flashback();
  setF("visionSeen");qStart("memory");addXP(30);
  await say("azareth","\"…I was on a porch. A farm in the middle of nowhere. Masked nurses around a figure in a rocking chair. It was muttering my name.\"\n\"I do not like this song.\"");};
TALK.sweetheart=async()=>{
  seeNpcPortrait("sweetheart");
  await say("sweetheart","\"My love is gone.\" A weeping woman in a lovely bonnet, clutching a locket full of letters she can't read.",{name:"The Sweetheart",sub:"Ghost · Cabin #3"});
  if(hasKey("loveletter")){const c=await ask("krodha","",["Give her the love letter","Offer to help find him"]);
    if(c===0){takeKey("loveletter");await say("krodha","\"Here, friend. I think this was meant for you. I read it. Sorry. It's good.\"");
      await say(null,"She lights up. Clutches the locket and the letter to her chest — and she's gone, bonnet ribbons last.");freeSpirit("sweetheart","The Sweetheart");return;}}
  await say("poppi","\"We'll help you find him. We promise.\"");};
TALK.ghostTiger=async()=>{
  seeMon("tiger");
  if(hasF("tigerFed")){await say(null,"The ghost tiger is asleep on a Druskenvald steamer trunk, purring like a furnace.");return;}
  await say(null,"A spectral TIGER blocks the aisle, sulking. It has an iron ring around one paw.");
  const opts=["Offer it a sausage (Poppi)","Back off"];if(hasKey("steak"))opts.unshift("Give it the extra steak (Tessie)");
  const c=await ask(null,"",opts);const pickd=opts[c];
  if(pickd.startsWith("Give")){await say("tessie","\"H-here, kitty.\" She holds out the steak. The tiger takes it very gently.");
    setF("tigerFed");giveKey("ironring");addXP(40);badge("tigerTamer");await say(null,"While it eats, Tessie slips the iron ring off its paw.");}
  else if(pickd.startsWith("Offer")){if(hasKey("sausage")){await say("poppi","\"Here, kitty kitty.\"");await say(null,"The tiger looks at the ghostly sausage. It looks at Poppi. It is PISSED OFF. But not attacking.");}else await say(null,"You have nothing it wants.");}
};
TALK.jailbird=async()=>{
  if(!hasF("jailbirdFound")){await say(null,"Another snoring sound. You move some baggage and reveal—");setF("jailbirdFound");}
  seeNpcPortrait("jailbird");
  await say("jailbird","\"…Hungry. So HUNGRY.\" A haggard man in a striped jumpsuit, ball and chain on one ankle.",{name:"The Jailbird",sub:"Ghost · Striped uniform"});
  if(hasKey("steak")&&!hasF("freed_jailbird")){const c=await ask(null,"",["Give him steak & eggs","Offer jerky"]);
    if(c===0){await say(null,"He eats like a man who hasn't eaten in eighty years (he hasn't). With the last bite of egg, he dissipates.");freeSpirit("jailbird","The Jailbird");
      if(hasF("tigerFed"))takeKey("steak");return;}}
  if(hasKey("sausage")&&!hasF("jbSausage")){setF("jbSausage");await say(null,"You feed him a ghostly sausage. \"Still hungry.\" Jerky? \"STEAK. And EGGS.\"");setF("jailbirdHungry");return;}
  await say("jailbird","\"Steak and eggs. That's the last meal I never got.\"");setF("jailbirdHungry");
};
TALK.druskTrunks=async()=>{await say(null,"The Druskenvalds' luggage — the newest in here. Art, trunks, all protected with arcane locks that would tell them if you touched.\n(Lucky's fingers twitch. He does not touch.)");};
TALK.luckyCase=async()=>{
  if(hasKey("mcquestcase")){await say(null,"Your family's case. Heavy with history.");return;}
  await say("lucky","\"That case. That's… familiar.\" Gambling stuff, and a letter from a famous gambler to a McQuest:\n\"'Your father doesn't own your soul. Wager it right and entice a being to take the bet.'\" …Classic McQuest nonsense.");
  giveKey("mcquestcase");addXP(30);learnLore("mcquest");};
TALK.luggageSearch=async()=>{
  if(hasF("bagLoot")){await say(null,"You've gone through all of it. Krodha gave Azareth 5sp because he's nice.");return;}
  setF("bagLoot");addGold(12);giveKey("rubyring");
  await say(null,"Everybody rummages. Poppi finds 75 silver (7gp). Krodha finds a silver ring set with rubies — worth a lot — and gives Azareth 5sp because he's nice.");};
TALK.harlequin=async()=>{
  seeNpcPortrait("harlequin");
  if(hasF("harlequinDealt")){await say(null,"Only a jingle of bells lingers where the Harlequin was.");return;}
  await say("harlequin","\"Ta-da… ta-da…\" The Harlequin performs, painfully. Every tumble looks like it hurts.",{name:"The Harlequin",sub:"Ghost · Big-top penance"});
  const c=await ask(null,"",["\"Are you okay?\"","Applaud","Ignore her"]);
  if(c===2)return;
  if(c===1){await say(null,"The applause makes her flinch. \"Don't. You don't know what I did.\"");}
  await say("harlequin","\"No. I'm not okay. I hurt people. The act went wrong. The TIGER got loose. It should be put down. Kill the tiger and I'll rest.\"");
  const d=await ask("lucky","",["\"Tell you what. Let's make a bet.\" (Lucky)","\"We're not killing the tiger.\""]);
  if(d===1){await say("harlequin","\"Then I'll never stop performing.\" She resumes tumbling. Somehow sadder.");return;}
  await say("lucky","\"Flippy card. I win, you move on. You win… we talk about the tiger.\"");
  const win=await minigame("flippy");
  if(win){await say(null,"Lucky wins the flippy card. The Harlequin stares at it — then, reluctantly, bows and dissipates.");
    setF("harlequinDealt");setF("harlequinGone");freeSpirit("harlequin","The Harlequin (for now)");qStep("spirits",2);}
  else{await say("harlequin","\"I WIN! The tiger dies!\"\n\"…We're still not killing the tiger.\"\n\"THEN YOU DIE!\"");
    const r=await battle("harlequin");if(r==="win"){setF("harlequinDealt");setF("harlequinGone");setF("harlequinBeaten");qStep("spirits",2);}}
};
TALK.keyring=async()=>{setF("got_keyring");giveKey("keyring");await say("azareth","\"Keys. Cage keys. I will take them. Keys are for opening things.\"");};
TALK.cages=async()=>{
  if(hasF("cagesOpen")){await say(null,"The cages hang open. Nothing wants to go back in.");return;}
  if(!hasKey("keyring")){await say(null,"Empty cages, all locked. The tiger was probably from in here. A tattered banner: 'THE BLOODY CIRCUS'.");return;}
  setF("cagesOpen");SFX.unlock();addXP(20);await say("azareth","Azareth unlocks every cage. They were empty. She seems satisfied anyway. \"Now they are open. That is better.\"");badge("cageBreaker");};
TALK.circusBanner=async()=>{await say(null,"A faded banner: 'THE BLOODY CIRCUS — ONE NIGHT ONLY'. Somebody has scratched 'NEVER AGAIN' beneath it.");};
TALK.vagrantFurnace=async()=>{
  if(hasF("trainCrash"))return;
  const n=spiritsFreed();
  await say("vagrant","\"Because you dealt with the loud one, you can be in here. Welcome to the furnace car.\"\n\""+(n>=4?"And you helped so many! I'm pleased. Truly.":"You could've helped more of them. Ah well.")+"\"");
  learnSecret("soulCoal");
  await say("vagrant","\"Soul coal feeds the furnace — the final destination of souls who stay aboard. The tank goes to the furnace. Everything goes to the furnace, eventually.\"");
};
TALK.soulCoal=async()=>{await say(null,"A tender full of soul coal, glowing a sickly blue-green. Faint whispers come from every lump.");};
TALK.furnace=async()=>{
  if(hasF("trainCrash"))return;
  await say(null,"The engine is running fine. But as you inspect it, black mist creeps in from the open door…");
  shake(6);await say(null,"Branch-like tendrils pour into the soul canister. The storage EMPTIES. The firebox door flies off its hinges —");
  SFX.scream();
  await say(null,"The furnace comes to life! And through the smoke comes a jingle of bells—");
  if(!hasF("harlequinBeaten")){await say("harlequin","\"You thought I'd rest? After how you RELEASED me?\"");const r=await battle("harlequin");if(r!=="win")return;setF("harlequinBeaten");}
  await crashCutscene();
};
async function crashCutscene(){
  lockInput(true);
  await say(null,"You win — but the train starts to BREAK. The Ghostlight Express is going OFF THE RAILS!");
  for(let i=0;i<6;i++){shake(14);SFX.hit();await sleep(220);}
  flash("#fff");SFX.crit();await fadeTo(1,400);
  setF("trainCrash");qDone("spirits");qStart("survive");qStep("survive",1);
  await warp("wreckage",10,8,"down",{banner:["THROWN FROM THE TRAIN","The Ghostlight Wreckage"],noFade:true});
  await fadeTo(0,700);lockInput(false);
  await say(null,"Crashing through thick black woods. You're thrown clear. The locomotive lies on its side — vines already growing onto it.");
  await say("vagrant","\"Everyone alive? More or less? Good, good.\" The Vagrant is already ripping at the vines.");
  await say(null,"The locomotive lies on its side… then swings around. A giant, GAPING MOUTH.\nBoss battle time.");
  await sessionBreak(1);
}
async function flashback(){
  lockInput(true);FX.vignette="#3a0a14";await fadeTo(.85,500);
  await say(null,"…a porch. A farm, in the middle of nowhere.\nMasked nurses stand around a figure in a rocking chair.\nIt is muttering a name.\n\"Az…a…reth…\"",{name:"A VISION"});
  await fadeTo(0,500);FX.vignette=null;lockInput(false);
}

/* ============================ THE WRECKAGE ============================ */
TALK.vagrantWreck=async()=>{
  seeNpcPortrait("vagrant");
  const n=jarCount();
  if(hasF("locoDefeated")){await say("vagrant","\"She's whole again, thanks to you. I'll be back in a few days. Or weeks. Time's funny out here.\"");return;}
  if(!hasF("jarQuest")){setF("jarQuest");
    await say("vagrant","\"The roots won't come off. She needs fuel to wake. See those glowing jars hanging from the trees? Soul-flame. Collect SIX of 'em. That'll restart her.\"");
    qStep("survive",1);return;}
  if(n<6){await say("vagrant","\""+n+" of 6. Keep looking — they glow green. You'll see 'em in the dark.\"");return;}
  await say("vagrant","\"Six! Lovely. Pour 'em into the firebox — the engine, there — and stand well back.\"");
};
TALK.adelaWreck=async()=>{seeNpcPortrait("adela");await say("adela",hasF("locoDefeated")?"\"The Hollow isn't far. We have an estate there, I think. Shall we walk?\"":"\"We're fine. Shaken. Phillip tried to fix the train — nothing happened. He's sulking about it.\"");};
TALK.phillipWreck=async()=>{seeNpcPortrait("phillip");
  if(hasF("locoDefeated")&&!hasF("druskReward")){setF("druskReward");
    await say("phillip","\"Remarkable. Absolutely remarkable. You'll be compensated — 25 gold apiece — and a treasure each from our luggage.\"");
    addGold(125);giveItem("potion",2);giveItem("salts",1);giveItem("holywater",1);qStep("escort",0);qStart("escort");
    await say(null,"+125gp · 2 Healing Potions · Smelling Salts · Holy Water");
    await say("phillip","\"These woods aren't far from Wickermoor Hollow — where Adela and I were headed. We might have an estate there. Shall we?\"");return;}
  await say("phillip",hasF("locoDefeated")?"\"Onward, then. The road is through the woods — west.\"":"\"I tried to remove the roots. They're… not interested in being removed.\"");};
TALK.soulJar=async(p)=>{
  if(!hasF("jarQuest")){await say(null,"A jar hangs from a branch, full of ghostly green flame. It's warm. It whispers.");
    if(LEAD()==="lucky"||true){await say("lucky","Lucky shakes it. Pockets it. \"Finders keepers.\"");}}
  setF(p.id);giveKey("soulJar");SFX.item();const n=jarCount();toast("🏮 Soul-flame jar "+n+"/6","ghost");
  if(n>=3)setF("jarsHalf");if(n>=6&&!hasF("jarsDone")){setF("jarsDone");qStep("survive",2);await say("vagrant","(from across the wreck) \"THAT'S SIX! Bring 'em to the engine!\"");}
  if(n>=8)badge("soulCollector");
};
TALK.engineWreck=async()=>{
  if(hasF("locoDefeated")){await say(null,"The locomotive is gone — rematerialized and driven off. Only scorched roots remain.");return;}
  if(jarCount()<6){await say(null,"The Ghostlight Locomotive lies on its side, wrapped in roots. Cold. It needs soul-flame. ("+jarCount()+"/6 jars)");return;}
  await say(null,"You pour the soul-flame jars into the firebox, one by one.");
  if(!hasF("lvl2")){setF("lvl2");await levelTo(2,"Before the fight, the Vagrant plays one high, strange note on his fiddle. You feel… more.");}
  await say(null,"The engine groans. Its lamp opens like an eye. It swings around — with a giant, GAPING MOUTH.");
  const r=await battle("loco");
  if(r==="win"){setF("locoDefeated");qDone("survive");seeMon("loco");
    await say(null,"The locomotive shudders, then the whole train REMATERIALIZES on the rails of nothing.");
    await say("vagrant","\"She's whole! Bless you. Now — I've got a schedule. I'll be back in a few days… or weeks.\" And he drives off. Without any of you.");
    moveNpc("vagrantW",-1,-1);await say("lucky","\"…He LEFT us?\"\n\"He LEFT us.\"");}
};
TALK.restPoint=async(p)=>{
  const c=await ask(null,"Rest here? (Short rest: heal half, restore 1/rest abilities is for long rests only.)",["Long rest (full heal, restore everything)","Not now"]);
  if(c===0){await restParty("long",p.rest);}
};

/* ============================ THE WALK ================================= */
TALK.adelaWalk=async()=>{seeNpcPortrait("adela");setF("walkTalk");
  const c=await ask("adela","\"Ask me anything. Walking is dull.\"",["\"Any major wars?\"","\"What are the Old Ways?\"","\"What was here before the Druskenvalds?\""]);
  if(c===0)await say("adela","\"Just the usual squabbles between the provinces. Nothing a good dinner party can't fix.\"");
  if(c===1)await say("adela","\"A rising tension. Blood and ritual and bountiful harvests. The villagers are… devoted.\"");
  if(c===2){await say("adela","\"Before us, the lands were ruled by the CROOKED QUEEN. But those were very different times.\"");learnLore("crookedQueen");}};
TALK.phillipWalk=async()=>{seeNpcPortrait("phillip");await say("phillip","\"About four hours through this terrain, I'd guess. If someone climbed a tree, they could tell us how far.\"");};
TALK.tallPine=async()=>{
  if(hasF("climbedPine")){await say(null,"Krodha's handprints go all the way up.");return;}
  await say("krodha","\"Hold my gourd.\" Krodha climbs. Up and up, like the old days in the Whisperwood.");
  setF("climbedPine");addXP(25);
  await say("krodha","\"We're halfway. I see a house on a hill — big, kinda crooked. A fairly large town. Quaint houses. And… is that a clocktower?\"");learnLore("tsen");};

/* ============================ THE FOUNDER'S ROUND ====================== */
async function eventArrival(){
  if(hasF("arrived"))return true;
  setF("arrived");qDone("escort");
  await warp("founders",11,19,"up",{banner:["CHAPTER 2","Wickermoor Village"]});
  lockInput(true);
  SFX.toll();await sleep(900);SFX.toll();
  await say(null,"The clocktower tolls. In the center of the square stands an oak with HUNDREDS OF FACES. Across from it, a faceless statue.");
  await say(null,"By the tree, a struggling figure is tied and staked to the ground.");
  SFX.howl();await sleep(500);
  await say(null,"A guttural growl. Wolves — and a dire wolf pack leader — stalk toward the staked figure. It looks like a SACRIFICE.");
  lockInput(false);
  await TALK.sack();
  return false;
}
EVENTS.arrival=eventArrival;
TALK.sack=async()=>{
  if(!hasF("wolvesDone")){
    await say(null,"The wolves turn from the staked figure — toward YOU.");
    const r=await battle("wolves");
    if(r==="win"){setF("wolvesDone");giveKey("pelt");seeMon("wolf");seeMon("direwolf");
      await say(null,"The figure survives. But up close — it's a SACK shaped like a person, with something small inside.");
      await say("azareth","Azareth opens it, carefully—");
      SFX.squeak();setF("goatFree");badge("goatRescuer");
      await say(null,"A BABY GOAT bursts out and runs away bleating.");
      await levelTo(3,"You feel the Hollow take notice of you.");
      await mayorEntrance();}
    return;}
};
async function mayorEntrance(){
  seeNpcPortrait("mayor");
  await say("mayor","\"WHAT have you DONE?! You interrupted a SACRED RITUAL!\" A portly man with a waxed handlebar mustache storms across the square.",{name:"Mayor Wendel Somerton",sub:"Followers of the Old Ways"});
  await say("mayor","\"Most here follow the Old Ways. The tree needs BLOOD to appease the land and the old gods — to ensure a bountiful harvest, via the Green Queen!\"");
  const c=await ask(null,"",["Azareth: \"We could drag the wolf corpses over. That is also blood.\"","Lucky: \"I challenge you to a duel. For the mayorship.\"","\"Maybe put up a sign, next time.\""]);
  if(c===0){setF("sacrificeOffered");await say("mayor","\"…That is… acceptable. Most acceptable!\" The wolves are laid beneath the oak. The faces seem to smile.");
    await say("azareth","\"Also, you should put up a sign if you're going to have a sacred ritual that looks like human sacrifice.\"");addXP(30);}
  if(c===1){await say("mayor","\"There are no elections. I have ALWAYS been the mayor.\"\n\"Then a duel!\"\n\"ABSOLUTELY NOT.\"");badge("democracy");}
  if(c===2)await say("mayor","\"A SIGN? …Hm. A sign.\" He seems to actually consider it.");
  setF("ritualTalked");
  await say("phillip","\"Mayor! Wonderful to meet you. Phillip and Adela Druskenvald — we're told there's a mansion?\"\nThe mayor goes pale, then beams. \"THE mansion. Of course, my lord. Right this way.\"");
  await say(null,"Phillip and Adela leave with the mayor for their new home. The Inn faces the square. Your adventure in Wickermoor begins.");
  qStart("explore");setF("ch2");
  await warp("village",14,22,"down",{banner:["WICKERMOOR VILLAGE","Your hub from now on"]});
}
TALK.mayorRitual=async()=>{if(!hasF("ritualTalked"))await mayorEntrance();};
TALK.facelessStatue=async()=>{await say(null,"The town's founder. But since no one knows who founded the town, the statue is faceless, and the plaque has no name.\nIt is notably un-notable.");
  if(LEAD()==="krodha")await say("krodha","\"A man with no face. Relatable. I have no reflection.\"");};
TALK.oakFaces=async()=>{await say(null,"An oak with hundreds of faces in its bark. "+(hasF("sacrificeOffered")?"The faces look… satisfied. The wolf blood soaked in.":"Some of them look hungry."));learnLore("oldWays");};

/* ========================== story: WICKERMOOR ========================== */
function cultSecret(line){return hasF("hexKnown")?"\n\n"+line:"";}

TALK.communityBoard=async()=>{
  const first=!hasF("boardRead");
  await say(null,"THE COMMUNITY BOARD. Posters, ads, and one furious handwritten note.");
  await say(null,"📌 \"HELP! My wife has been CURSED! And my EX-WIFE is responsible >:(\" — Seth Taylor, Taylor Farm (edge of town)");
  await say(null,"📌 MYSTERY BODY: A man found at the Wytchwood's edge, apparently scared to death. He held a MARBLE FINGER, pointing ahead of him.");
  await say(null,"📌 A PERFORMANCE TROUPE comes through Wickermoor Hollow soon!\n📌 The annual BLOODY CUP is coming (date: ???)");
  if(first){setF("boardRead");qDone("explore");qStart("finger");qStart("cursed");qStart("cook");setF("taylorKnown");
    await say("lucky","\"A curse AND a corpse. This town's got everything.\"");}
  const c=await ask(null,"",["Open the Travel Ledger (region map)","Done"]);
  if(c===0)openTravel();
};
TALK.innSign=async()=>{await say(null,"THE GREEN QUEEN INN. Beneath it, newer paint: 'Festive, Not Sleepy.'");};
TALK.villageWell=async()=>{await say(null,"You drop a pebble in the well. It takes a long time to hit water. Something down there says 'thank you'.");
  if(!hasF("wellCoin")){setF("wellCoin");addGold(2);await say(null,"…and a coin floats up. 2gp. Weird town.");}};
TALK.mailbox=async()=>{await say(null,"A post box. 'LETTERS FOR THE PROVINCES — DELIVERY NOT GUARANTEED.' Theodora's office is right there.");};
TALK.aviary=async()=>{await say(null,"An aviary — a pigeon coop tower full of mail pigeons and carrier pigeons. Hundreds of little eyes. They all turn to look at you at the same time.");SFX.flap();
  if(hasF("gameDone"))await say(null,"(One pigeon is wearing a tiny hat. You decide not to think about it. — Chapter 10.)");};
TALK.stonePile=async()=>{await say(null,"A heap of cut local stone outside Roderick Masonry.");};
TALK.taylorPorch=async()=>{
  if(hasKey("hexbag")||hasF("hexDestroyed")){await say(null,"The loose porch beam, and the empty dark beneath it.");return;}
  if(!hasF("taylorKnown")){await say(null,"A rickety porch on a rickety farmhouse. Everything in the garden is dead.");return;}
  await say(null,"Porch steps up to the door. One of the beams looks loose…");
  const r=await check("tessie","Perception",11);
  if(!r.ok){await say(null,"…it's just loose. Probably. (Try again — someone with sharper eyes?)");return;}
  await say(null,"Under the porch: a little sack. A HEX BAG, stuffed with dried herbs, bones and powders — and very powerful, very cursed magic of the land.");
  giveKey("hexbag");qStep("cursed",1);addXP(60);
  await say("poppi","\"Oh, that's… that's REALLY bad. That's old. Someone put this here on purpose.\"");
  const c=await ask(null,"",["Leave a note: 'We're looking for you — we stay at the Inn.'","Leave it"]);if(c===0)setF("taylorNote");
};
EVENTS.taylorDoor=async()=>{
  if(hasF("taylorUnlocked"))return true;
  if(!hasF("taylorKnown")){await say(null,"A rickety farmhouse, locked tight.");return false;}
  await say(null,"Nobody answers. The door is locked.");
  const c=await ask("lucky","",["Lucky picks the lock","Leave it"]);if(c!==0)return false;
  const ok=await minigame("lockpick",{diff:1});
  if(ok){setF("taylorUnlocked");qStep("cursed",0);return true;}
  return false;
};
TALK.taylorBed=async()=>{await say(null,"Nothing inside. No photos, no clothes. The bed hasn't been slept in for a long, long time. The Taylors left in a hurry — or never really lived here.");};
TALK.taylorTable=async()=>{await say(null,"A kitchen table with two chairs. On it, a single dried flower and a knife-carved word: 'SADIE'.");setF("taylorVisited");};

/* ---------------------------- townsfolk --------------------------------- */
TALK.hildaEdge=async()=>{seeNpcPortrait("hilda");await say("hilda","\"There you are. Path starts right here. Keep up, and keep your voices down. Things listen in the Wytchwood.\"",{name:"Hilda Brom",sub:"The Huntress"});await say(null,"(Walk NORTH, off the edge of the village, to enter the Wytchwood.)");};
TALK.oldRusty=async()=>{seeNpcPortrait("rusty");
  if(hasF("ch4")&&!hasF("enteredHouse")){await say("rusty","\"DEATH. DOOM. PAIN. CROOKED MOON, CROOKED MANSION!\" His eyes dart. His breath is labored. \"DON'T GO IN THAT HOUSE!\"",{name:"Old Rusty",sub:"The Groundskeeper"});return;}
  await say("rusty",pick(["\"Round and round the Founder's Round. Mind the roots. Mind the FACES.\"","\"Sweep the leaves, sweep the teeth. Sweep the leaves, sweep the teeth.\"","\"The cemetery's BIGGER. I counted. I counted twice!\""]),{name:"Old Rusty",sub:"The Groundskeeper"});
  if(!hasF("rustyCem")){setF("rustyCem");qStart("cemetery");}};
TALK.sisterRain=async()=>{seeNpcPortrait("rain");await say("rain",pick(["\"The Patient Lady provides all that is needed. Nature is kind, not cruel.\"","\"The Old Ways ask for blood. The Patient Lady asks only for patience.\"","\"Be gentle with the land, travelers. It remembers.\""]),{name:"Sister Rain",sub:"Fold of the Patient Lady"});learnLore("patientLady");};
TALK.marianna=async()=>{seeNpcPortrait("marianna");await say("marianna","\"Oh — h-hello. The horses don't like the woods lately. They won't go north at all.\"",{name:"Marianna Grey",sub:"The Stablemistress"});};
TALK.siv=async()=>{seeNpcPortrait("siv");await say("siv","\"Shop's closed for the Bloody Cup. The meat's fresh, and it was treated kindly. That's all that matters.\"",{name:"Siv Harga",sub:"The Butcher"});};
TALK.mori=async()=>{seeNpcPortrait("mori");await say("mori","\"The dead talk, if you're quiet. Lately they've been… crowded. The cemetery keeps needing more room.\"",{name:"Mori Shade",sub:"The Undertaker"});
  if(!hasF("rustyCem")){setF("rustyCem");qStart("cemetery");}};
TALK.oswick=async()=>{seeNpcPortrait("oswick");await say("oswick",pick(["\"Candles AND wickerwork, that's the Wickery! Want to hear about the Wicker Vigil? Everyone burns a little man at the end of the year. It's lovely!\"","\"Gossip? Oh, I have gossip. The postmaster reads everyone's mail. You didn't hear it from me.\""]),{name:"Oswick Frey",sub:"The Chandler"});};
TALK.gaston=async()=>{seeNpcPortrait("gaston");await say("gaston","\"The light here is wrong. I paint it anyway. Would you sit for a portrait? I'd paint you… smiling.\"",{name:"Gaston Doray",sub:"The Artist"});
  if(hasF("hexKnown"))await say(null,"(His sketchbook, half-open: a family portrait with the TEETH scratched out. You get a chill.)");};
TALK.beatrice=async()=>{seeNpcPortrait("beatrice");await say("beatrice","\"If you're passing the old church, tell Weston the new pews are nearly done. Four kids and a church to rebuild — the Brightsinger keeps me busy!\"",{name:"Beatrice Wells",sub:"The Carpenter"});};
TALK.jeremiah=async()=>{seeNpcPortrait("jeremiah");await say("jeremiah","\"Harvest's thin. Mayor says the oak needs more. Farmers say the oak needs LESS and the rain needs more. Nobody asks the farmers.\"",{name:"Jeremiah Stover",sub:"Farmer Spokesman"});};
TALK.villageKid=async()=>{await say(null,pick(["\"Are you a SKELETON? Can I touch your ribs?\"","\"My mum says don't go near the big house on the hill. So I go near it every day.\"","\"There's WEASELS in the walls. I heard them saying 'teeth'!\"","\"Wanna see my tooth? I lost it. I put it under my pillow and something TOOK it.\""]));};
TALK.villager=async()=>{await say(null,pick(["\"Newcomers, eh? Keep close to the village. The Hollow is unkind to strangers.\"","\"Green Queen bless.\"","\"The clocktower's been tolling thirteen at midnight. Nobody talks about it.\"","\"You're the ones who stopped the ritual! …My cousin says thank you. Quietly.\""]));};
TALK.weaselStare=async()=>{
  seeMon("weasel");
  await say(null,"A weasel sits in the road, staring at you. Then another. And another. There are a LOT of weasels in Wickermoor.");
  await say("krodha","\"I got this. I speak weasel. Sort of.\" Krodha summons his Giant Weasel and asks it to infiltrate them.");
  await say(null,"The weasels swarm the Giant Weasel. It's bigger, and less feral. They KNOW it's not one of them. Tense. Very tense.");
  await say("krodha","\"What's going on, little dudes?\"\nThe weasels, in one voice: \"TEETH. FOR. THE. MASTER.\"");
  await say(null,"They're being controlled. The identity of their Master has been wiped out of their minds. Then they scatter into the walls.");
  setF("weaselsKnown");qStart("weasels");addXP(40);learnSecret("infighting");
};

/* ------------------------------- the Inn -------------------------------- */
TALK.alda=async()=>{seeNpcPortrait("alda");
  const first=!hasF("metAlda");setF("metAlda");
  if(first)await say("alda","\"Welcome to the Green Queen Inn. No one stays here, so take any room — a copper each.\"\n(Lucky: \"This town's sleepy.\" Alda: \"FESTIVE. We are festive, not sleepy.\")",{name:"Alda Farnum",sub:"The Innkeeper"});
  else await say("alda","\"Room's a copper. Drinks are more. Gossip is free — if I like you.\""+cultSecret("(Her smile doesn't reach her eyes. You notice she writes down every name in a little book… and reads it to a man with a ruddy beard.)"),{name:"Alda Farnum",sub:"The Innkeeper"});
  const c=await ask(null,"",["Rent rooms and rest (1cp)","\"Who are the dirtiest louts in town?\" (Lucky)","\"Seen any evil twins?\" (Krodha)","Never mind"]);
  if(c===0){await restParty("long","inn");}
  if(c===1)await say("alda","\"…What a strange question. I wouldn't know. Talk to whomever you like.\"");
  if(c===2){await say("alda","\"Not since the last Plagueborn came through, and that was ages ago. There IS a slovenly cook in town who might be filling his pies with rats. Can't say if they're normal rats.\"");qStep("cook",0);}
};
TALK.innRest=async()=>{const c=await ask(null,"Your room at the Green Queen Inn. (1 copper — the Druskenvalds have been subsidizing it.)",["Long rest","Not yet"]);if(c===0)await restParty("long","inn");};
TALK.hearth=async()=>{await say(null,"A crackling hearth. Lucky has been festive in front of it for four hours minimum.");};
TALK.innBooks=async()=>{await say("poppi","Poppi reads a few dusty books from the inn shelf. One mentions an ANTIQUE BOOKSTORE — the small house next to the Trading Post.");};
TALK.patron=async()=>{await say(null,pick(["\"Everyone here looks human. You lot… look very out of place.\"","\"Bloody Cup's coming. My money's on the butcher.\"","\"I saw the skeleton buy the whole bar a round. Good skeleton. Great skeleton.\""]));};
TALK.liarsDiceTable=async()=>{
  await say(null,"The Wainwrights' card table — tonight it's Liar's Dice, Crooked Moon rules. Lucky's eyes light up like a jack-o'-lantern.");
  const c=await ask("lucky","",["Play Liar's Dice (buy-in 5gp)","Pass"]);
  if(c===0){if(STATE.gold<5){await say(null,"You can't cover the buy-in.");return;}await minigame("liarsdice");}
};
TALK.hildaInn=async()=>{seeNpcPortrait("hilda");
  if(!hasF("metHilda")){setF("metHilda");
    await say(null,"The door bursts open. A wild, unsocial woman stomps in with freshly caught rabbits over her shoulder, meant for the cook.");
    await say("tessie","(Tessie wants to talk to her, but she's too shy.)");}
  await say("poppi","\"Where do the rabbits come from?\"\n\"The Wytchwood.\"\n\"…And Ed Hardy? The finger guy?\"");
  await say("hilda","\"I found the body. I'll show you where, in the morning. If you can keep up. People don't tend to come back from the Wytchwood.\"",{name:"Hilda Brom",sub:"The Huntress"});
  setF("hildaGuide");qStep("finger",5);
  await say(null,"(Hilda will meet you at the NORTH edge of the village, where the path enters the Wytchwood.)");};
TALK.finneasInn=async()=>{seeNpcPortrait("finneas");setF("metFinneas");
  await say("finneas","\"Oh! Hello. Finneas. The schoolteacher — new-ish in town. From Baskerton, the electric city, in Edwardia.\"",{name:"Finneas Trout",sub:"The Schoolteacher"});
  await say("finneas","\"If you come by the schoolhouse in the morning, I'll give you a MAP. Everyone should have a map.\"");
  await say("finneas","(He squints at Krodha.) \"You look familiar. A presence… followed by a grisly string of murders. Similar to you, but not quite.\"");
  await greyLore();qStart("grey");};
async function greyLore(){
  await say("finneas","\"I studied a curse called THE GREY, from Edwardia. It's three parts of a whole:\n1) A dense grey fog that shrouds people in gloom.\n2) A curse that marks the natives — they live to extremes and die early.\n3) A two-headed beast: one head wolf, one head mastiff.\"");
  await say("finneas","\"Accept your death and the mastiff grants a swift, painless end. Reject it, and the wolf tears you to pieces.\"");
  await say("krodha","\"…Duality. The shadow self. Yeah. I don't have a shadow, man.\"");learnLore("grey");
}
TALK.randallInn=async()=>{seeNpcPortrait("randall");setF("metRandall");
  await say("randall","\"Randall Graham — barber, surgeon, and brewer of the finest moonshine in the Hollow. Sit in my chair anytime.\"",{name:"Randall Graham",sub:"Barber-Surgeon-Moonshiner"});
  await say("randall","\"The WEASELS have been stealing teeth out of my shop. Right out of the jar! Sort out the weasel problem, and I'll give you a lift to Foxwillow on my next delivery.\""+cultSecret("(His warmth has edges. His barber's apron has a crooked moon embroidered on the inside. You weren't meant to see that.)"));
  qStart("weasels");qStep("weasels",1);
};

/* ------------------------------ shops etc -------------------------------- */
TALK.baltus=async()=>{seeNpcPortrait("baltus");const first=!hasF("metBaltus");setF("metBaltus");
  if(first){await say("baltus","\"Welcome to Tolliver's! We buy, we sell. Mind the children — Wilma, Ronald, shoo them into the back!\"",{name:"Baltus Tolliver",sub:"The Merchant"});
    await say("baltus","\"The cursed wife fellow? Seth TAYLOR. Out on the farm at the edge of town.\"\n(He recommends the Apothecary, the Bread Shop, the Bookstore, and the Apparel shop.)");
    await say(null,"You tell him about the train. He's horrified. Concerned. He asks a LOT of questions about exactly which of you survived."+cultSecret(" And he writes the answers down."));}
  const c=await ask(null,"",["Shop","Sell things","\"The statue in the square?\"","Leave"]);
  if(c===0)openShop("trading");
  if(c===1)await sellMenu();
  if(c===2)await say("baltus","\"The founder. Nobody knows who founded Wickermoor — so, no face, no name. Very civic.\"");
};
async function sellMenu(){
  const opts=[];if(hasKey("rubyring"))opts.push(["Sell the Ruby Ring (50gp)","rubyring",50]);
  if(hasKey("soulJar"))opts.push(["Sell a soul-flame jar (lowball: 3gp)","soulJar",3]);
  if(hasKey("vinyl"))opts.push(["Sell the vinyl (lowball: 2gp)","vinyl",2]);
  opts.push(["Nothing","",0]);
  const c=await ask("baltus","\"What've you got?\"",opts.map(o=>o[0]));const o=opts[c];if(!o[1])return;
  if(o[2]<5){const d=await ask("lucky","\"That offer's an INSULT.\"",["Take it anyway","Refuse (keep it)"]);if(d===1){await say(null,"Lucky ultimately doesn't sell — the payment offered was too low.");return;}}
  takeKey(o[1]);addGold(o[2]);SFX.coin();}
TALK.wainwrights=async()=>{await say(null,"Wilma and Ronald Wainwright guard the shop. They and their three adopted kids live in the basement under it.\n\"Front and back doors are locked at night,\" Ronald says, looking straight at Lucky.");};
TALK.tradeShelves=async()=>{await say(null,"Some clothes (not much), no seeds, few books. Simple weapons and trade goods. The cellar door in back is padlocked and barred.");};
TALK.eleanor=async()=>{seeNpcPortrait("eleanor");
  if(!hasF("metEleanor")){setF("metEleanor");
    await say("eleanor","\"Mm? Customers. Eleanor Heyling. Antiquarian. I sell books to people who read them — and I despise people who don't.\"",{name:"Eleanor Heyling",sub:"The Antiquarian"});
    await say("eleanor","(She peers at Poppi over her spectacles.) \"…You have an affliction. A need to know. I can see it on you like ink.\"\n\"Let's enter an ACCORD. I research for you, and you find me things — places, books. Come back in a few days.\"");
    qStart("antiquarian");
    await say("azareth","Azareth overshares about her book, her ring, and the song in her apocalypse dreams. For a long time.\n\"…Come back in a few days,\" Eleanor says, faintly.");
    await say("krodha","Krodha asks about town history. She hands him a book on it — pages torn out, blacked out. Censored. Someone doesn't want people to know.");learnLore("censored");
    return;}
  const opts=["Study a monster's SECRET (10gp)","\"About the Old Ways…\""];
  if(hasKey("hexbag")&&!hasF("hexKnown"))opts.unshift("Show her the Hex Bag");
  if(hasF("mysterySolved")&&!hasF("ch4"))opts.unshift("Show her the finger effigy");
  if(hasF("weaselsKnown")&&!hasF("greenQueenLore"))opts.push("Ask about the weasels & teeth");
  opts.push("Leave");
  const c=await ask("eleanor","\"Hm?\"",opts);const o=opts[c];
  if(o==="Show her the Hex Bag"){await say("lucky","\"Sources of evil. Go.\"");
    await say("eleanor","\"This is CROOKED QUEEN magic. Old — beyond the Old Ways. Nothing good. There may be practitioners here in town. Infiltrating the good ways.\"");
    setF("hexKnown");setF("knowsCult");learnLore("crookedQueen");qStep("cursed",1);addXP(50);
    await say(null,"✦ You now suspect a CULT OF THE CROOKED QUEEN in Wickermoor. (Certain townsfolk will say more — or less — around you now.)");
    const d=await ask(null,"",["Agree to destroy it (take it to Morgan)","Keep it for now"]);if(d===0)setF("destroyHex");}
  else if(o==="Show her the finger effigy"){
    await say("eleanor","\"I don't like it. Hand gods? People who worship HANDS? I'll research, but there isn't much.\"");
    await say("eleanor","\"Poppi — for YOUR answers, try the library at the Druskenvald Manor. The locals call it… the Crooked House.\"");
    qStep("antiquarian",1);setF("ch4");qStart("house");
    await say(null,"✦ The manor on the hill (north-west, past the aviary path) is now open to you.");}
  else if(o==="Ask about the weasels & teeth"){
    await say("eleanor","\"Wytch shit. Crooked Queen magic. The Dark Arts.\"\n\"Before Druskenvald, this land was green — an eden. A demi-plane of forests ruled by KELLER, the Green Queen.\"");
    await say("eleanor","\"At some point, her reign ended. Things changed into what they are now. Crooked Queen, Green Queen… were they different people? Who knows.\"");
    await say("azareth","\"…This story is familiar. I do not know why.\"");setF("greenQueenLore");learnLore("greenQueen");}
  else if(o.startsWith("Study"))await studyMenu();
  else if(o.startsWith("\"About"))await say("eleanor","\"Many here follow the Old Ways. Forbidden knowledge is a passion of mine. What exactly ARE the Old Ways? Nobody will tell me straight.\"");
};
async function studyMenu(){
  const list=Object.keys(STATE.seen).filter(m=>MON[m]&&MON[m].secret&&!STATE.secrets[MON[m].secret]).map(m=>MON[m].secret).filter((v,i,a)=>a.indexOf(v)===i);
  if(!list.length){await say("eleanor","\"Bring me something new to research. Monsters you've SEEN, specifically.\"");return;}
  const c=await ask("eleanor","\"Which creature? Research takes time — and 10 gold for tea and candles.\"",list.map(s=>SECRETS[s].of+" — "+SECRETS[s].study).concat(["Never mind"]));
  if(c>=list.length)return;if(STATE.gold<10){await say(null,"Not enough gold.");return;}
  addGold(-10);await say(null,"…A few days pass in dusty pages…");learnSecret(list[c]);};
TALK.bookShelf=async()=>{await say(null,"Books of all types, plus writing and book supplies. Lucky looks for something to steal and ends up BUYING an encyclopedia instead.");if(!hasF("ency")){setF("ency");badge("readingIsFundamental");}};
TALK.occultShelf=async()=>{await say(null,"The occult section. Eleanor has marked it 'NOT FOR SALE' in three languages.");};
TALK.thomasin=async()=>{seeNpcPortrait("thomasin");
  if(!hasF("metThomasin")){setF("metThomasin");
    await say("thomasin","\"A Stitch in Time. Clothier and tailor. Most people here want drab, functional clothes.\"",{name:"Thomasin Ardor",sub:"The Tailor · Old Ways"});
    await say("lucky","\"I want to be your SPOKESMODEL. The avant-garde stuff. Extra slim. I'll soon have a barony.\"");
    await say("thomasin","\"The Taylors? Seth married fast after the last one ended. Old wife: Sadie Hardy. New one: Isabella.\"");setF("sadieKnown");}
  const opts=[];
  if(!hasF("jacketOrdered"))opts.push("Commission Lucky's studded puffer jacket (75gp)");
  else if(!hasF("luckyJacket")&&hasF("ch3back"))opts.push("Pick up Lucky's jacket (pay 50gp)");
  if(hasKey("pelt")&&!hasF("cloakOrdered"))opts.push("Have the wolf pelt made into a cloak (25gp)");
  else if(hasF("cloakOrdered")&&!hasF("wolfCloak")&&hasF("ch3back"))opts.push("Pick up Azareth's wolf cloak");
  opts.push("Leave");
  const c=await ask("thomasin","",opts);const o=opts[c];
  if(o.startsWith("Commission")){await say("thomasin","\"Leather armor in the form of a… 'dope-ass puffer jacket'. It will take time. Pay when it's done.\"");setF("jacketOrdered");}
  if(o.startsWith("Pick up Lucky")){if(STATE.gold<50){await say(null,"Not enough gold (50).");return;}addGold(-50);setF("luckyJacket");toast("🧥 Lucky: +1 AC (Studded Puffer Jacket)","gold");SFX.item();badge("hypebeast");}
  if(o.startsWith("Have the wolf")){if(STATE.gold<25){await say(null,"Not enough gold (25).");return;}addGold(-25);takeKey("pelt");setF("cloakOrdered");await say("thomasin","\"A cloak with advantage on stealth. Come back after your next trip.\"");}
  if(o.startsWith("Pick up Azareth")){setF("wolfCloak");toast("🐺 Azareth: +1 AC (Wolf-Pelt Cloak)","gold");SFX.item();}
};
TALK.fabric=async()=>{await say(null,"Drab, functional, utilitarian. Brown. Browner. Brownest.");};
TALK.avantGarde=async()=>{await say("lucky","\"THIS. This is the good stuff. Sequins. A cravat with ATTITUDE.\"");};
TALK.solomon=async()=>{seeNpcPortrait("solomon");
  const st=qState("finger");
  if(!hasF("metSolomon")){setF("metSolomon");
    await say("solomon","\"Roderick Masonry. I know local stone and statuary. What do you want.\"",{name:"Solomon Roderick",sub:"The Stonemason · Brightsinger"});
    await say("solomon","\"The marble finger? Bring it to me and I'll tell you what statue it came from. The dead man — Edmund Hardy. Ed. I carved his headstone. He's buried by the old Brightsinger church.\"");
    await say("solomon","\"The Taylors live at the edge of town on a small farm. New-ish. Broken up for a while. Constable Doris Squire has the finger — and Deputy Butterman.\"");
    if(st&&st.step<1)qStep("finger",1);learnLore("brightsingers");return;}
  if(hasKey("finger")&&!hasF("fingerIdentified")){setF("fingerIdentified");qStep("finger",3);
    await say("solomon","\"Local stone. Missing a long time. It belongs to the KNIGHT STATUE in the old Brightsinger church — the mythic protector of the town. Take it home.\"");addXP(40);return;}
  await say("solomon","\"Brightsingers preach gentleness, kindness, helping others. Less pagan than the Old Ways. We don't bleed our trees.\"");};
TALK.headstones=async()=>{await say(null,"Unfinished headstones. One is carved with a hand. Another just says 'HE WAS SCARED'.");};
TALK.doris=async()=>{seeNpcPortrait("doris");
  if(hasF("mysterySolved")&&!hasF("reportedDoris")){setF("reportedDoris");
    await say(null,"You tell Doris and Howie everything — the chapel, the handless, the Hand-Taker. You show them the finger effigy. They very much do NOT want it.");
    await say("doris","\"…Case closed, then. 10 gold each, from the village. And thank you.\"",{name:"Constable Doris Squire",sub:"Fold of the Patient Lady"});addGold(50);qDone("finger");badge("detective");return;}
  if(hasKey("finger")||hasF("fingerReturned")){await say("doris","\"Be careful in the Wytchwood. People don't tend to come back.\"",{name:"Constable Doris Squire",sub:"The Constable"});return;}
  await say("doris","\"You're poking your heads into the Hardy matter. I don't love that.\"",{name:"Constable Doris Squire",sub:"The Constable"});
  const c=await ask(null,"",["Lucky: \"Adela and Phillip Druskenvald SENT us.\" (Deception)","\"We just want to help.\" (Persuasion)","Leave"]);
  if(c===2)return;
  const r=c===0?await check("lucky","Deception",13):await check(LEAD(),"Persuasion",16);
  if(!r.ok){await say("doris","\"Nice try. Get out of my constabulary.\"");return;}
  await say("doris","\"…The Druskenvalds, eh. Fine. We found him at the edge of the WYTCHWOOD. Scared to death. Clutching the marble finger in what was left of his hands.\"");
  await say("howie","\"All his fingers were gone. Cut off with a dull blade. He was facing the woods — pointing.\"",{name:"Deputy Howie Butterman",sub:"The Deputy"});
  await say("doris","\"And no — there are NO rituals in this town involving human sacrifice. Or fingers.\"");
  giveKey("finger");qStep("finger",2);addXP(40);if(c===0)badge("smoothTalker");
};
TALK.howie=async()=>{seeNpcPortrait("howie");await say("howie","\"Deputy Butterman, at your service! Anything the Mayor needs. Anything at all.\""+cultSecret("(He keeps glancing at the Barber-Surgeon's shop through the window. His manacles are engraved with a crooked moon.)"),{name:"Howie Butterman",sub:"The Deputy"});};
TALK.wantedPosters=async()=>{await say(null,"WANTED: Whoever keeps moving the headstones.\nWANTED: The goat from the ritual. (Reward: one goat.)");};
TALK.holdingCell=async()=>{await say(null,"An empty holding cell. The lock is excellent. Lucky makes a note.");};
TALK.weston=async()=>{seeNpcPortrait("weston");
  if(hasKey("finger")&&hasF("fingerIdentified")){
    await say("weston","\"Is that— the knight's finger? Missing for CENTURIES! Where did you—\"",{name:"Weston Murdoch",sub:"The Pilgrim · Brightsinger"});
    takeKey("finger");setF("fingerReturned");qStep("finger",4);addXP(60);SFX.magic();
    await say(null,"The finger slots into the knight statue's hand with a soft click. For a moment, the ruined church feels warm.");
    await say("weston","\"Edmund Hardy was one of my flock. Nothing else strange with the Brightsingers… but he wouldn't have gone into the Wytchwood without reason. Talk to Hilda Brom — she found him. She drinks at the Inn.\"");return;}
  await say("weston","\"The church is under reconstruction — slowly. The Brightsinger teaches kindness. We're rebuilding with it.\"",{name:"Weston Murdoch",sub:"The Pilgrim · Brightsinger"});};
TALK.knightStatue=async()=>{await say(null,"A knight statue — the mythic protector of Wickermoor. "+(hasF("fingerReturned")?"Its hand is whole again, pointing north. Toward the Wytchwood.":"One marble finger is missing from its outstretched hand."));};
TALK.churchAltar=async()=>{await say(null,"A simple altar, scrubbed clean. Someone leaves fresh flowers here every day.");};
TALK.morgan=async()=>{seeNpcPortrait("morgan");
  if(!hasF("metMorgan")){setF("metMorgan");await say("morgan","\"Morgan. Apothecary. I have seeds, potions of all kinds — healing potions, 50 gold. Sadie Hardy? She doesn't live in town anymore.\"",{name:"Morgan",sub:"The Apothecary"});}
  const opts=["Shop"];
  if(hasKey("hexbag")&&!hasF("hexMorgan"))opts.unshift("Show Morgan the Hex Bag");
  if(hasKey("hexbag")&&hasF("hexMorgan")&&(hasF("destroyHex")||hasF("hexKnown")))opts.unshift("Ask Morgan to destroy the Hex Bag");
  if(hasF("mysterySolved")&&hasKey("fingerEffigy")&&!hasF("effigyMorgan"))opts.unshift("Show her the finger effigy");
  opts.push("Leave");
  const c=await ask("morgan","",opts);const o=opts[c];
  if(o==="Shop")openShop("apoth");
  if(o==="Show Morgan the Hex Bag"){setF("hexMorgan");
    await say("morgan","\"This seems… familiar. I have trouble remembering things. Blackouts.\" Azareth and Morgan bond over their missing memories.");
    await say("morgan","\"There's a place — MEMORY'S REST, west-northwest of town. They supposedly help with memory loss.\"");qStart("memory");
    await say("morgan","\"This bag is old, local magic — beyond the Old Ways, back to the CROOKED QUEEN. It's a ticking time bomb. A grenade that goes off at random. DESTROY IT.\"\n(Maybe the Antiquarian or the schoolteacher would know more…)");}
  if(o==="Ask Morgan to destroy the Hex Bag"){takeKey("hexbag");setF("hexDestroyed");qStep("cursed",2);SFX.magic();addXP(40);badge("hexbreaker");
    await say(null,"Morgan burns the hex bag in a copper bowl. The smoke screams. Then it's just smoke.");}
  if(o==="Show her the finger effigy"){setF("effigyMorgan");takeKey("fingerEffigy");
    await say("morgan","\"Not alchemical. Magical. I'll take it — and Poppi, see the SURGEON about that extra finger.\"\n\"And be careful. The woods twist time.\"");
    await say("azareth","Azareth offers Morgan the herbs from the chapel. \"Blood-clotting potions,\" Morgan says. \"Someone there bleeds a lot.\"");giveItem("potion",1);}
};
TALK.apothBrew=async()=>{await say(null,"Something green bubbles. It smells like mint and regret.");};
TALK.seedDrawers=async()=>{await say(null,"Hundreds of tiny drawers of seeds. One is labelled 'DO NOT PLANT'.");};
TALK.holly=async()=>{seeNpcPortrait("holly");
  if(!hasF("metHolly")){setF("metHolly");qStart("bakery");}
  await say("holly","\"Bread by Holly! Fresh loaves, honey cakes. My girls, Lavender and Violet, help.\""+(hasF("hexKnown")?"\n(Her smile falters when you mention family. There's a curse she won't talk about.)":""),{name:"Holly Aster",sub:"The Baker · Old Ways"});
  const c=await ask(null,"",["Buy honey cakes","\"Anything strange lately?\"","Leave"]);
  if(c===0)openShop("bakery");if(c===1)await say("holly","\"Strange? No. Nothing strange. Sugar keeps the little ones away, my gran used to say. Leave a cake on the sill.\"");};
TALK.hollyKids=async()=>{await say(null,pick(["\"Mum says don't talk about the cellar.\"","\"We leave honey cakes out so the tooth faeries eat those instead of our TEETH.\""]));};
TALK.bakeryOven=async()=>{await say(null,"Two brick ovens, warm. Nothing inside but bread. …Right?");};
TALK.bakeryCellar=async()=>{await say(null,"A cellar hatch with a new padlock. Scratching, from below. (Something to investigate — in a later chapter.)");};
TALK.finneasSchool=async()=>{seeNpcPortrait("finneas");
  if(hasF("metFinneas")&&!hasF("gotMap")){setF("gotMap");giveKey("map");SFX.item();
    await say("finneas","\"The map! Here. Interesting places: the CEMETERY is getting bigger each night. The CRIMSON MONASTERY. The DROWNED CROSSROADS — swampy, full of rapscallions. MEMORY'S REST. Hartsblight. Foxwillow, the next town over. The Howlers — very dangerous. And the mine is just an old abandoned mine.\"",{name:"Finneas Trout",sub:"The Schoolteacher"});
    await say("poppi","\"The Crimson Monastery… that resonates. I don't know why.\"\n\"Memory's Rest resonates with me,\" says Azareth.");
    await say(null,"✦ The Travel Ledger (Community Board) now shows the whole of Wickermoor Hollow.");return;}
  if(hasF("ch3back")&&!hasF("greyTalk2")){setF("greyTalk2");
    await say("finneas","\"My compilation on the Grey isn't ready, but — the third part IS the entity. The Grey. Two heads. Accept your death: the mastiff. Reject it: the wolf.\"\n\"Meditate on opposites, Krodha. On moral relativism.\"");qStep("grey",1);
    await say("lucky","\"Can I teach a class?\"\n\"No.\"");return;}
  await say("finneas","\"Reason and civilization, that's what this place needs. And chalk. We always need chalk.\"",{name:"Finneas Trout",sub:"The Schoolteacher"});};
TALK.chalkboard=async()=>{await say(null,"Today's lesson, in neat chalk: 'SUPERSTITION IS A CANDLE IN AN EMPTY ROOM.' Someone has added underneath, in a child's hand: 'but whats in the room'.");};
TALK.randallShop=async()=>{seeNpcPortrait("randall");
  await say("randall",hasF("metRandall")?"\"Shave? Tooth pulled? Something stronger? My moonshine could strip paint.\"":"\"Randall Graham. Barber. Surgeon. Brewer. Have a seat, friend.\"",{name:"Randall Graham",sub:"Barber-Surgeon"});
  if(hasF("effigyMorgan")&&!hasF("poppiFinger")&&!hasF("noExtraFinger")){setF("poppiFinger");await say("poppi","\"Morgan said to see you about… this.\" (Poppi shows her extra finger.)\n\"Fascinating. Hold still.\" Snip. It's gone. He keeps it.\""+cultSecret("\n(He drops the finger into a jar labeled with a crooked moon.)"));}};
TALK.teethJar=async()=>{await say(null,"A big jar labeled TEETH. It's half empty. \"The weasels,\" Randall says. \"Every night.\"");};
TALK.moonshine=async()=>{await say(null,"A copper still, ticking with heat. The moonshine smells like a bonfire in a pine forest.");};
TALK.jean=async()=>{seeNpcPortrait("jean");
  await say("jean","\"The Smithy. I make practical things for practical people. I'll hone your gear — 40 gold a piece — and I keep iron filings for the superstitious.\"",{name:"Jean Myriel",sub:"The Smith · Newcomer"});openShop("smithy");};
TALK.forge=async()=>{await say(null,"The forge roars. Jean has hung a horseshoe over it upside down. \"I don't believe in luck,\" he says. \"But why risk it.\"");};
TALK.mayor=async()=>{seeNpcPortrait("mayor");
  await say("mayor",hasF("gameDone")?"\"The Druskenvalds — saved! By YOU! I shall… consider… a sign. For the next ritual.\"":"\"The Old Ways keep us fed and safe. Blood for the oak, bread for the table. Tradition!\""+cultSecret("\n(He leads the Old Ways rites himself. He genuinely has no idea the cult is inside his own flock.)"),{name:"Mayor Wendel Somerton",sub:"The Mayor"});
  if(LEAD()==="lucky")await say("lucky","\"About those elections—\"\n\"NO.\"");};
TALK.myrtle=async()=>{await say(null,"Myrtle Somerton, the mayor's wife, offers you tea and a biscuit. \"Wendel means well. He always means well.\"");};
TALK.townCharter=async()=>{await say(null,"The Town Charter. Article 1: 'The Mayor shall be the Mayor.' Article 2: 'See Article 1.'");};
TALK.theodora=async()=>{seeNpcPortrait("theodora");
  await say("theodora","\"Post office. Letters, parcels, mailboxes. A pigeon for anything urgent.\" A pigeon on her shoulder stares at you.",{name:"Theodora Mayville",sub:"The Postmaster"});
  if(!hasF("mailboxOpen")){const c=await ask(null,"",["Open a mailbox (5gp)","No thanks"]);if(c===0&&STATE.gold>=5){addGold(-5);setF("mailboxOpen");qDone("mailbox");toast("📬 Mailbox opened","gold");}}
  if(hasF("hexKnown"))await say(null,"(Her violet eyes linger on your letters a moment too long. The pigeon coos a word that sounds a lot like 'teeth'.)");};
TALK.geneva=async()=>{await say(null,"Geneva Fairchild, the postmaster's assistant — lilac eyes the village whispers about. \"I'm proving myself here. Please don't mention my eyes.\"");};
TALK.cubbies=async()=>{if(!hasF("mailboxOpen")){await say(null,"Rows of mail cubbies. One is labeled with your party's name already. Creepy.");qStart("mailbox");return;}
  await say(null,"Your mailbox: "+(hasF("gameDone")?"a dinner invitation from the Druskenvalds, sealed with a goat skull.":"empty. For now."));};

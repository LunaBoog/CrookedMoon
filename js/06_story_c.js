/* ===================== story: THE WYTCHWOOD & THE CHAPEL ================ */
EVENTS.wytchwoodEnter=async()=>{
  if(hasF("wytchwoodIn"))return true;
  setF("wytchwoodIn");qStep("finger",5);
  await warp("wytchwood",7,16,"up",{banner:["CHAPTER 3","The Wytchwood"]});
  await say("hilda","\"Stay close. It's darker than it was a few days ago.\"",{name:"Hilda Brom",sub:"The Huntress"});
  await say(null,"It's pitch black. The trees lean in.");
  await say("azareth","\"I can make light.\" Azareth casts LIGHT on her sickle. The dark backs off — a little.");
  setF("lightCast");MAPS.wytchwood.light=5;
  await sleep(300);
  await say(null,"Something pale moves between the trunks. A GHOSTLY GREYHOUND pads up to Tessie and sits at her feet like it's always been there.");
  return false;
};
TALK.casterJoin=async()=>{
  await say("tessie","\"…Caster? Is that your name?\" The greyhound's ears flick. It is very wise — maybe not so strong.");
  setF("caster");toast("🐕 Caster the ghost greyhound joins Tessie!","ghost");SFX.item();
  await say(null,"✦ Tessie learned SIC 'EM, CASTER! — and weasels and vermin familiars are TERRIFIED of dogs.");learnSecret("canine");};
TALK.hildaWood=async()=>{seeNpcPortrait("hilda");
  if(!hasF("bodySeen"))await say("hilda","\"The body was just there, by the old stump. Look at the ground.\"",{name:"Hilda Brom",sub:"The Huntress"});
  else if(!hasF("campFound"))await say("hilda","\"Tracks go everywhere. The archway leads deeper. Trust your ranger.\"",{name:"Hilda Brom",sub:"The Huntress"});
  else await say("hilda","\"This is as far as I go. Each hex is six miles — two a day, if the ground's kind. Bring me back a good story.\"",{name:"Hilda Brom",sub:"The Huntress"});};
TALK.bodySite=async()=>{
  if(hasF("bodySeen")){await say(null,"The place where Ed Hardy died, facing the woods, pointing ahead.");return;}
  setF("bodySeen");qStep("finger",6);
  await say(null,"Hilda shows you where the body was found. Scuffed earth. And tracks: humanoid, BAREFOOT. Too many to tell if there was more than one.");
  const r=await check("tessie","Survival",12);
  await say("tessie",r.ok?"\"This way. Only one set went OUT recently. Toward that archway in the brush.\"":"\"There's… a lot of feet. I think the archway?\"");addXP(30);};
TALK.archway=async()=>{setF("archSeen");await say(null,"An archway in the brush reveals a small trail leading deeper into the woods. Everyone rolls perception — and does pretty well.");};
TALK.trailFork=async()=>{
  if(hasF("forkChosen")){await say(null,"The fork. You took the "+(hasF("forkFresh")?"fresh path.":"side path — and lost time."));return;}
  const c=await ask("azareth","\"Tessie. Which path?\"",["\"The freshest tracks.\" (the north-east path)","\"The side path looks quicker.\""]);
  setF("forkChosen");if(c===0){setF("forkFresh");await say("tessie","\"…Freshest. North-east. To the camp.\"");}
  else{await say(null,"You take the side path and lose time. The woods are happy about that. Something follows you back.");await battle("wood4");}};
TALK.campsite=async()=>{
  if(hasF("campFound")){const c=await ask(null,"The crude campsite. Safe enough to rest?",["Camp and take shifts (long rest)","Move on"]);if(c===0)await restParty("long","wytchwood");return;}
  setF("campFound");
  await say(null,"At the end of the trail: a web of underbrush tunnels and a VERY crude campsite. A few tools. A dull, bloody knife.");
  giveKey("knife");await say(null,"The knife is rusty scrap metal with cloth on one end. This is almost certainly the knife that cut off Ed Hardy's fingers.");
  await say(null,"No fingers around. The footprints are barefoot. Only one recently went out.");
  addXP(60);await say(null,"(A bundle of sticks tied into the shape of a HAND lies nearby.)");};
TALK.stickHand=async()=>{setF("got_handeffigy");giveKey("handeffigy");await say("azareth","Azareth checks it. \"Not cursed.\" She puts the hand effigy in her inventory. It seems to wave. It does not.");};
EVENTS.river=async()=>{
  if(hasF("riverCrossed"))return true;
  await say(null,"Deeper in, it's eerily quiet — save for inaudible whispers and skittering in the underbrush, moving all around you.");
  await say(null,"You come across a DRIED RIVERBED. Fish flop on the stones — freshly dry. The path continues on the other side.");
  await say(null,"As you start across, you hear it: a ROAR upstream. The river is rushing BACK.");
  const res=await minigame("river");
  setF("riverCrossed");
  if(res&&res.hits>=3){await say(null,"Krodha and Poppi barely survive the surge. On the far bank, everyone takes a short break to heal.");}
  else await say(null,"You scramble up the far bank as the water thunders past behind you. Soaked, but whole.");
  addXP(80);
  await say(null,"The tracks you were following are gone. You're on a larger, well-used path now… leading down into marshy lowlands.");
  await warp("marsh",1,5,"right",{banner:["THE MARSH OF HUNGER","Ankle-deep and sloshing"]});
  return false;
};
TALK.marshHaint=async()=>{
  await say("lucky","Lucky hears the impression of footsteps and turns — pointing his gun at a WAYWARD HAINT shuffling toward you.");
  const r=await battle("haint");
  if(r==="win"){setF("marshHaintDone");seeMon("haint");
    if(!hasF("goodberry")){setF("goodberry");giveItem("goodberry",10);await say("azareth","Azareth casts Goodberry and eats five. \"There are five left. For you.\"\n(✦ Azareth now makes Goodberries on every long rest.)");}
    await sessionBreak(3);}};
TALK.ancientGraves=async()=>{
  if(hasF("gravesRobbed")){await say(null,"The ancient graves, now thoroughly robbed. Mostly hands and bones of hands.");return;}
  await say(null,"Ancient graves, half-sunk in the marsh. Which you promptly rob.");
  const rp=await check("poppi","Investigation",12),rt=await check("tessie","Perception",12);
  setF("gravesRobbed");
  if(rp.ok){setF("woolCloak");await say(null,"Poppi finds a FINE WOOL CLOAK — patchwork, but nice. (Poppi +1 AC)");}
  if(rt.ok){await say(null,"Tessie finds a NECKLACE OF SEVERED FINGERS. Fourteen of them.\n\"…I'll hold onto it.\"");badge("fingerCollector");}
  if(!rp.ok&&!rt.ok)await say(null,"Nothing but hands and bones of hands. Lucky, Krodha and Azareth all come up empty.");
  else await say(null,"Only Tessie and Poppi succeed. Lol.");
  addXP(40);};
TALK.ironGate=async()=>{
  if(hasF("gateOpen")){await say(null,"The gate hangs open. Lucky kept the lock.");return;}
  await say(null,"The path used to be manicured. Now it's wrecked. At its end: a CHAINED-SHUT old iron gate, blocking the whole road — and beyond, a small chapel in a clearing.");
  const c=await ask(null,"",["Krodha's Giant Weasel tries to open it","Lucky picks the lock","Azareth tries a Religion check on it"]);
  if(c===0){await say(null,"The Giant Weasel strains, squeaks, and gives up. It does not work.");return;}
  if(c===2){await say(null,"Azareth stares at the gate very religiously. She learns nothing.");return;}
  const ok=await minigame("lockpick",{diff:2});
  if(ok){setF("gateOpen");await say("lucky","\"And I'm keeping the lock.\"");addXP(40);}};
TALK.grassPatch=async()=>{if(hasKey("grass")){await say(null,"Wet grass. You already have a handful.");return;}giveKey("grass");await say("azareth","Azareth takes some grass. \"What is green will grow.\"");};
TALK.yardGrave=async()=>{await say(null,"A worn headstone: a hand, palm out. 'THE HAND WILL TAKE, THE HAND WILL GIVE.'");};
TALK.greatHand=async()=>{
  if(hasF("handOpen")){await say(null,"The great hand has moved aside. A staircase leads down.");return;}
  await say(null,"A huge stone HAND rises behind three bowls. Poppi's Arcana check: the bowls and the hand might open something.");
  if(!hasF("inscription")){await say("krodha","Krodha's weasel sniffs around the back of the statue and finds an inscription:");
    await say(null,"\"The hand will take, the hand will give,\nThree gifts you make if you would live:\nWhat's WET will rise, what's GREEN will grow,\nThe seed awake, with WARMTH will glow.\"");setF("inscription");}};
TALK.bowl=async(p)=>{
  const k="bowl"+p.bowl;
  if(hasF(k)){await say(null,"The bowl and its pedestal have risen.");return;}
  const opts=["Water (from your flask)","Grass"+(hasKey("grass")?"":" (you have none)"),"A lit candle (Lucky)","A gold coin","Nothing"];
  const c=await ask(null,"What do you place in the "+p.name.toLowerCase()+"?",opts);
  const want={M:0,L:1,R:2}[p.bowl];
  if(c===4)return;
  if(c===1&&!hasKey("grass")){await say(null,"You don't have any grass. There's some in the courtyard.");return;}
  if(c===want){setF(k);SFX.unlock();shake(4);await say(null,"The bowl and its pedestal RISE.");
    if(hasF("bowlL")&&hasF("bowlM")&&hasF("bowlR")){setF("handOpen");SFX.thunder();shake(12);
      await say(null,"With a grinding roar, the great hand MOVES — revealing a staircase leading downward.");addXP(100);badge("puzzler");
      await say(null,"Before you go down, you try to long rest — but it's raining and exposed. Tessie takes two levels of exhaustion. Everyone else, one.\n(You head down at night, because of the rain.)");}}
  else{await say(null,"Nothing happens. The hand seems… disappointed.");if(c===3){addGold(-1);await say("lucky","\"Worth a shot.\"");}}};
TALK.crossroads=async()=>{await say("lucky",hasF("chalked")?"Lucky's chalk arrows point back the way you came.":"\"Crossroads. Left-hand path. And—\" Lucky chalks an arrow on the wall. \"—so we can find our way back. Thinking ahead!\"");setF("chalked");};
TALK.alchemyDoor=async()=>{
  await say(null,"Another locked iron door. Lucky cracks his knuckles, which, on a skeleton, is extremely loud.");
  const ok=await minigame("lockpick",{diff:2});if(ok){setF("alchOpen");await say(null,"It's a storage and alchemy room!");}};
TALK.alchemyTable=async()=>{await say(null,"A basic alchemy table and brewing things. Plant matter — branches, herbs, powders — boxes, and more hand effigies. A mortar and pestle.");
  if(!hasF("luckyPotion")){setF("luckyPotion");await say("lucky","Lucky tries to craft a potion. It fails. It fails LOUDLY. (It smells like feet.)");}};
TALK.alchemyHerbs=async()=>{if(hasF("gotHerbs")){await say(null,"Just stems now.");return;}setF("gotHerbs");giveItem("potion",1);
  await say("azareth","Azareth takes a few pinches — some a mystery, some known to her as health-related. (She mixes a Healing Potion.)");};
TALK.magicSap=async()=>{setF("got_sap");giveItem("antitoxin",1);giveItem("potion",1);await say("poppi","Poppi finds a bottle of sap with magical properties. It hums. (+1 Healing Potion, +1 Antitoxin — and it's WARM.)");};
EVENTS.templeEnter=async()=>{
  if(hasF("templeSeen"))return true;setF("templeSeen");
  await say(null,"The room at the bottom of the staircase is shrouded in light smoke, heavy with incense. Everyone rolls stealth. You send the Giant Weasel in first.");
  return true;};
TALK.supplicantTalk=async()=>{
  await say(null,"Bodies prostrate on the floor, all facing the far end of the room. They don't react to light. They stay shadowed.");
  if(!hasF("noHands")){setF("noHands");await say("poppi","Poppi leans close to see a face — impossible, they're hunched too far. But she sees their arms.\nThey have NO HANDS.");}};
TALK.sarcophagus=async()=>{await say(null,"A stone sarcophagus carved with hands — hundreds of them, reaching. A low magical hum. Whatever they pray to seems to be working.");};
TALK.handtaker=async()=>{
  if(hasF("handtakerDone"))return;
  await say(null,"Lit candles. Braziers glowing, a smell vaguely herbal and grassy. On the raised platform, through the haze: the outline of a humanoid creature.");
  await say(null,"It starts. It turns suddenly toward you.");
  const c=await ask(null,"",["Azareth: cast Hold Person!","Poppi: jump out — \"ALL HAIL THE HAND!\" (Deception)","Attack!"]);
  let pre=null;
  if(c===0){await say(null,"Azareth casts Hold Person… it doesn't work. The creature takes a few steps forward.");}
  if(c===1){const r=await check("poppi","Deception",14);
    if(r.ok){await say(null,"The creature hesitates — confused, almost pleased. You get the first strike!");pre="surprise";}
    else await say(null,"\"…All hail… the hand?\" It is not fooled.");}
  let r=await battle("handtaker",{pre});
  if(r!=="win")return;
  await say(null,"At the brink, the creature snatches up an EFFIGY — an idol of mangled fingers — and FLEES into the smoke!");
  const caught=await minigame("chase");
  await say(null,caught?"You run it down in the dark corridors. Cornered, it fights like an animal.":"It slips away — but Tessie tracks it by its barefoot prints. Cornered, it turns.");
  r=await battle("handtaker2");
  if(r!=="win")return;
  setF("handtakerDone");seeMon("handtaker");
  await say(null,"The creature EXPLODES. Poppi takes the idol of mangled fingers.");giveKey("fingerEffigy");
  await say(null,"You go back to the storage room to rest after the long, hard fight. (Roll for the long rest next session.)");
  await sessionBreak(4);
  await say(null,"Back in the alchemy room. Lucky taps every wall for secrets. There aren't any. You long rest.");
  await restParty("long","crypt",true);
  await levelTo(4,"The Chapel of the Hands is quiet. You are not who you were in the Ghostlight lounge.");
  await say(null,"Looting the temple: Detect Magic only highlights the finger effigy and the entranceway. You each get 50gp.");addGold(250);
  await say(null,"Treasure: 2 copper chalices with silver filigree (Krodha & Azareth), a silver ewer (Tessie), a small golden bracelet (Lucky), each worth 25gp — and a single black arrow with crow fletching (Poppi).");addGold(100);
  const lc=await lookCloser({id:"altar",title:"The finger effigy and the altar",desc:"Poppi turns the idol of mangled fingers over in her hands. The altar is right there. It would fit perfectly.",doLabel:"Poppi: put the effigy on the altar",leaveLabel:"Don't. Pocket it.",pc:"azareth",skill:"Arcana",dc:10,catchText:"Detect Magic: only two things in the temple glow, the effigy and the entranceway. The effigy WANTS the altar."});
  if(lc==="do")await say("poppi","Poppi puts the finger effigy on the altar… and GROWS AN EXTRA FINGER. She takes it off the altar. Nothing happens. She pockets it anyway.");
  else{setF("noExtraFinger");await say("poppi","Poppi pockets the effigy without letting it touch the altar. (At the table, she didn't. She got an extra finger.)");}
  await say("tessie","Tessie finds a foot from the exploded monster. \"…This is the foot. The tracks we've been following. The barefoot ones.\"");
  setF("mysterySolved");qStep("finger",6);badge("handsOff");
  await say(null,"THE MYSTERY IS SOLVED: Ed Hardy was killed by the monster, and its cultists.");
  await say(null,"It takes you five-ish days to get back to town. You use rations rather than take exhaustion.");advanceDay(5);
  setF("ch3back");
  await warp("village",15,30,"up",{banner:["BACK TO TOWN","Five days later"]});
  await say(null,"Wickermoor looks the same. Except… there are a lot more WEASELS around.");
};

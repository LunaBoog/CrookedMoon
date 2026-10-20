/* ======================= story: THE CROOKED HOUSE ====================== */
function checkFloors(){
  if(heirloomCount()>=3&&!hasF("floor2Open")){setF("floor2Open");toast("The stairs creak open…","ghost");}
  if(hasF("got_doll")&&hasF("jasperDone")&&!hasF("floor3Open")){setF("floor3Open");toast("The upper stairs clear…","ghost");}
  if(heirloomCount()>=6&&!hasF("atticReady")){setF("atticReady");toast("✦ All six heirlooms! Something waits in the attic.","gold");qStep("house",2);}
}
function gotHeirloom(k){giveKey(k);SFX.item();toast("🗝 Heirloom: "+KEYITEMS[k].name.split(": ")[1]+" ("+heirloomCount()+"/6)","gold");addXP(80);checkFloors();}
TALK.jenkins=async()=>{seeNpcPortrait("walter");
  if(!hasF("metJenkins")){setF("metJenkins");
    await say(null,"Three people emerge from the barn and wave. Walter, Gilly, and Dani Jenkin. Walter signs; Gilly interprets.");
    await say("gilly","\"Walter says: he's the caretaker, and welcome. The Druskenvalds are WAITING for you inside — the library's upstairs. We're off into town.\"",{name:"Gilly Jenkin",sub:"The Caretaker"});}
  else await say("walter","(Walter signs something warm and worried. Gilly: \"He says… mind the stairs.\")",{name:"Walter Jenkin",sub:"The Butler"});};
TALK.dani=async()=>{seeNpcPortrait("dani");
  await say("dani","\"The house doesn't like being looked at. Don't look at it too long.\" A grey cat yowls at you from the bushes, then slinks under the porch.",{name:"Dani Jenkin",sub:"The Caretaker's Daughter"});};
EVENTS.crookedArrival=async()=>{
  if(hasF("enteredHouse"))return true;
  if(!hasF("metJenkins")){await say(null,"(The Jenkin family is waiting by the gate. Say hello first?)");}
  await say(null,"You go up to the front door of the Druskenvald Manor.");
  shake(6);FX.warp=1;SFX.scream();
  await say(null,"A wave of NAUSEA hits you. The once-pristine house becomes moldy, rotten, CROOKED — like something out of a nightmare.");
  seeMon("crookedman");
  await say("crookedman","\"We've been expecting you.\" A twisted form on the porch. \"You are cursed. EVERYONE is cursed. Return to blood and ashes — for the Crooked Queen.\"",{name:"The Crooked Man",sub:"???"});
  FX.warp=0;setF("enteredHouse");qStep("house",1);qStart("house");
  await say("crookedman","\"Return to blood and ashes.\"",{name:"The Crooked Man",sub:"???"});
  await sessionBreak(5);
  await warp("house1",8,16,"up",{banner:["CHAPTER 4","The Crooked House"]});
  await say("lucky","Lucky does a double backflip through the door. Everyone else follows. (Less flippingly.)");
  return false;
};
TALK.crookedMan=async()=>{await say(null,"The Crooked Man runs at Lucky — and passes right through him. It does no damage. He just wanted you to flinch.");setF("cmGone1");};
TALK.portraits=async()=>{
  const c=await ask(null,"The foyer is lined with portraits — all scared, and their eyes follow you. Three stand out:",["1) The Lockwoods","2) The Druskenvalds","3) …Is that US?","Leave them"]);
  if(c===0){await say(null,"The LOCKWOODS — the previous owners, painted inside this house. Unsettling. An arcane spell was used to CHANGE the house. The patriarch looks like the Crooked Man. What happened to the others in the portrait?");learnLore("lockwoods");}
  if(c===1)await say(null,"The DRUSKENVALDS — in a very different posture. Adela is stoic, with red and orange flowers and a WICKER CHOKER at her throat. Phillip is crying, wearing a black six-pointed crown with a crescent moon pin.");
  if(c===2){await say(null,"A painting of YOU. All five of you, standing side by side, wearing crazed smiles… distinctly MISSING YOUR TEETH.");shake(4);}
  setF("portraitsSeen");};
TALK.dourBusts=async()=>{await say(null,"Landscapes and dour busts with distorted placards. The placards change when you aren't reading them.");};
TALK.peacockStatue=async()=>{
  await say(null,"A marble PEACOCK statue with a single jeweled eye — a dull red BLOODSTONE — in one socket.");
  const c=await ask("lucky","",["Lucky: steal the eye for Tessie","Leave it"]);if(c!==0)return;
  await say(null,"The peacock ANIMATES the moment Lucky's fingers touch the gem.");
  const r=await battle("peacock");
  if(r!=="win")return;
  setF("peacockDone");seeMon("peacock");
  await say(null,"Lucky strikes the killing blow and takes the eye. A screaming elderly woman's shade bursts from the wreckage — and disappears.");
  gotHeirloom("gem");
  await say(null,"Then Lucky rolls a NAT ONE while celebrating. He fucks up. You find out.");
  const r2=await battle("weaselsF1");
  if(r2==="win"){setF("weaselsF1Done");giveItem("tooth",6);
    await say("azareth","Azareth gets two weasel pelts in good condition. \"I want a belt. To go with my cloak.\" She also collects… the teeth. All of them.");}
};
TALK.ouija=async()=>{
  if(hasF("ouijaDone")){await say(null,"The round table. The spirit board is still. The fire is choked again.");return;}
  await say(null,"The round-table parlour. Dusty furnishings, a choked fire, and on the table: a SPIRIT BOARD. The planchette is engraved 'A.D.'");
  await minigame("ouija");
  setF("ouijaDone");qStart("son");
};
TALK.roseBed=async()=>{await say(null,"The conservatory. A large green tree bears fruit — everything else is dead. Azareth takes some leaves, but leaves the unripe bergamot.");};
TALK.petunia=async()=>{
  await say(null,"A figure in a faded green scarf sits on a bench with a cup of tea. A ghost, lost in memories, attached to this space.");
  if(countItem("wine")){await say("lucky","\"As promised, madam.\" Lucky presents the wine with a flourish.");
    takeItem("wine");await say(null,"She trades the wine for her CUP. \"Help my children,\" she begs — and disappears.");
    gotHeirloom("cup");setF("got_cup");giveKey("greenscarf");setF("greenScarf");
    await say(null,"Her faded green scarf falls to the ground. Azareth picks it up — it needs attuning. (Later: it's OP but CURSED, so it goes to Tessie. +1 hit & damage.)");return;}
  await say("lucky","\"Hello. Are you a ghost?\" …\"Would you like to go out for some wine with me?\"");
  await say(null,"\"Bring the wine to me, dear. I can't leave the tree.\" Lucky asks for a kiss. Denied. He goes in search of wine.");setF("petuniaAsked");};
TALK.pantry=async()=>{
  if(!hasF("petuniaAsked")||countItem("wine")||hasF("got_cup")){await say(null,"The kitchen is ruined, collapsed in places. A large brick oven. The smell of burning flesh.");return;}
  giveItem("wine",1);SFX.item();await say("lucky","\"Wine! Dusty, suspicious, probably fine.\"");};
TALK.ovenDoor=async()=>{
  if(hasF("ovenOpened")){await say(null,"The oven hangs open, cold and empty. It was never anyone. It was a trap.");return;}
  await say(null,"An iron door on the big brick oven, sealed with a thick iron lock. Muffled SCREAMING from behind it. The smell of burning flesh.");
  const c=await ask(null,"",["Lucky picks the lock","Leave it — that's clearly a trap (Poppi)"]);
  if(c===1){await say("poppi","\"No. NO. We are not opening the screaming oven.\" Wise.");return;}
  const ok=await minigame("lockpick",{diff:1});if(!ok)return;
  setF("ovenOpened");await say(null,"The door opens and the room fills with SMOKE. A magical trap!");
  await trapDamage("2d6","fire","DEX",12);await say(null,"Some of you go down — you get everyone back up.");};
TALK.feastTable=async()=>{
  if(hasF("feastDone")){await say(null,"The table, finally just a table.");return;}
  await say(null,"The dining room. A very clean table laden with food that looks and smells AMAZING. As you step closer, the dishes shake ominously.");
  await say("tessie","Tessie: \"No heirlooms. But… something's glinting in the turkey.\"");
  await say("lucky","Lucky uses the 10-foot pole to poke the turkey—");
  const r=await battle("feast");
  if(r!=="win")return;setF("feastDone");
  await say(null,"Tessie gets the final blow on the turkey and retrieves the glinting things: a GOLDEN RING (75gp) and a PEARL OF POWER.");
  addGold(75);giveKey("pearl");setF("pearl");toast("⚪ Azareth: +1 spell slot (Pearl of Power)","gold");};
TALK.harpsichord=async()=>{
  if(hasF("harpDone")){await say(null,"The harpsichord is quiet. Joseph Patrini's ghost bows from the mirror.");return;}
  await say(null,"Old instruments and a crooked, cracked mirror. The harpsichord is open, exposed — and it begins to PLAY on its own. The mirror shows the room full of dancing spectral figures.");
  if(!hasF("musicWeasels")){await say(null,"Then the weasels appear. \"FESELA BROWNTOOTH WILL SACRIFICE YOUR SOULS!\"");
    const r=await battle("musicweasels");if(r!=="win")return;setF("musicWeasels");giveItem("tooth",3);}
  await say(null,"Lucky sits at the keys. A ghost sits beside him — JOSEPH PATRINI, summoned by the music.");
  const res=await minigame("harpsichord");
  setF("harpDone");
  await say(null,res>=0.8?"A NAT 20 PERFORMANCE. The spirits vanish in applause, the last weasel drops dead, and it is dope as hell.":"You finish the duet together. The spectral dancers bow and fade.");
  await say(null,"A BLACK KEY pops out of the instrument. Lucky pockets it.");gotHeirloom("key");
  await say(null,"(This corner of the music room is safe. Azareth bars the door with the Immovable Rod.)");
  await say(null,"We now have 3 of 6 heirlooms. You decide to long rest in the Music Room.");
  await restParty("long","house1",true);
  await sessionBreak(6);};
TALK.mirror=async()=>{
  if(hasF("krodhaMirror")){await say(null,"Just a cracked mirror. Krodha still has no reflection in it.");return;}
  if(!hasF("harpDone")){await say(null,"The crooked mirror shows the room full of dancers. None of them are you.");return;}
  await say("krodha","Krodha stares into the mirror. The reflection darkens… taints… until an EVIL DOPPELGANGER stares back, wreathed in sin, an axe in one hand, a field of corpses behind it.");
  await say(null,"\"You are born to sin and must consume sin to survive. Druskenvald is full of it. Consume sin itself and it will make you stronger. ALL is necessary.\"",{name:"Evil Krodha"});
  setF("krodhaMirror");await say(null,"✦ Krodha learned SIN EATER.");learnLore("divided");SFX.magic();};
/* ---------------------------- floor 2 ---------------------------------- */
TALK.grandfatherClock=async()=>{
  await say(null,"The Formal Sitting Room: fine furniture, antiques — and a grandfather clock ticking in the corner. As Azareth approaches, its hands spin wilder and wilder—");
  await say(null,"—and STOP at midnight. BONG. BONG. BONG… twelve chimes.");
  const r=await battle("clock");if(r!=="win")return;
  setF("clockDone");giveItem("tooth",4);
  await say(null,"Lucky kills the clock. Azareth kills the weasels — and puts their teeth in her mouth. Lucky collects forty weasel pelts.");
  await say(null,"The devoured spirits leave behind a golden pocketwatch (100gp), inscribed: \"Remember the 3rd.\"");giveKey("pocketwatch");badge("pestControl");};
TALK.sally=async()=>{
  if(!hasF("sallyMet")){setF("sallyMet");
    await say(null,"A pair of child-sized beds, a closet (slightly ajar), a toy box, a window. The small wooden doll on the toy box ANIMATES.");
    await say(null,"\"Please… check for MONSTERS.\" Her name is Sally. Sally Lockwood.",{name:"Sally",sub:"a wooden doll"});}
  if(hasF("lurkerDone")){await say(null,"Sally crawls into the bed, tucks herself in, and goes still as the spirit leaves the doll.");gotHeirloom("doll");setF("got_doll");return;}
  const left=["bed","closet","dresser","toybox","window"].filter(k=>!hasF("chk_"+k));
  await say(null,"\"Did you check EVERYWHERE?\" ("+(5-left.length)+"/5 spots checked: beds, closet, dresser, toy box… and the window.)",{name:"Sally"});};
TALK.childBeds=async()=>{setF("chk_bed");setF("chk_closet");setF("chk_dresser");
  await say("poppi","Poppi and Krodha check under the beds. Azareth lights the room and gets a high perception check on the closet. Poppi checks the dresser. No monsters.");};
TALK.toyBox=async()=>{setF("chk_toybox");
  if(!countItem("toyrabbit")&&!hasF("rabbitTaken")){setF("rabbitTaken");giveItem("toyrabbit",1);SFX.item();
    await say(null,"Toys — tops, marbles, a stuffed RABBIT loved nearly bald. Tessie tucks it into her pack. It feels important.");}
  else await say(null,"The toy box. Nothing's hiding in it. Probably.");};
TALK.bedroomWindow=async()=>{
  if(hasF("lurkerDone")){await say(null,"Just a dark window. Now.");return;}
  const left=["bed","closet","dresser","toybox"].filter(k=>!hasF("chk_"+k));
  if(left.length){await say(null,"A dark window, a mist of dark fog outside. (Check the rest of the room first.)");return;}
  setF("chk_window");
  await say(null,"Poppi checks the window — the only thing left. Outside: dark fog. And in the reflection of the ambient light… a soft outline. The shadow of a face, looking back at her.");
  const r=await battle("lurker");if(r!=="win")return;
  setF("lurkerDone");seeMon("lurker");badge("lurkerInTheLight");
  await say("azareth","Azareth marches over to the Lurker's corpse and puts a sign on it: \"LURKER-IN-THE-LIGHT.\"");
  await say("krodha","Krodha finds a moving satchel with an eye on it. A bag of holding… that holds a Lurker-in-the-Dark. \"Cool. Cool cool cool.\"");giveKey("satchel");
  await TALK.sally();};
TALK.bathroom=async()=>{
  if(hasF("bathDone")){await say(null,"The tub is dry now. Horribly, suspiciously dry.");return;}
  await say(null,"Lucky opens the door to a steamy bathroom — rank, filled with mold. Someone appears to be showering within.");
  const c=await ask("lucky","",["Lucky pulls back the curtain and accepts his fate","Close the door"]);if(c!==0)return;
  const r=await battle("bloodbath");if(r!=="win")return;
  setF("bathDone");
  await say("azareth","Azareth runs in, gets the door open, and saves Lucky. \"You were drowning. In blood. That is not normal.\"");
  await say(null,"Next to Lucky: a wooden YELLOW DUCKY. A Figurine of Wondrous Power — throw it, it becomes a silver 'raven' duck with an Animal Messenger spell.");giveKey("duck");};
TALK.lockedJournal=async()=>{
  if(hasKey("journal")){await say(null,"Phillip's desk.");return;}
  await say("krodha","Krodha picks up a journal — Phillip Druskenvald's. Locked. \"Lucky?\"");
  const ok=await minigame("lockpick",{diff:1});if(!ok)return;giveKey("journal");
  await say(null,"\"Upon entering Wickermoor Hollow I lost my powers as the LORD OF DEATH. I do not know why, and I dread it. Adela begs us to leave. I will not — not until I know the reason. Jenkin says it is dangerous to live here, but I must rekindle the trust of the minor provinces…\"");
  learnLore("lordOfDeath");addXP(40);};
TALK.suitBed=async()=>{
  if(hasF("jasperDone")){await say(null,"Lucky destroyed the bed, the sheets, and 'the stuff'.");return;}
  await say(null,"The master bedroom. A bed with a squirming, human-sized shape under the sheet. Lucky tosses the sheet—");
  await say(null,"Phillip's chalk-stripe suit, filled with twelve weasels and a larger leader in the middle. FILTHY JASPER.\n\"FESLA BROWNTOOTH WILL LIVE IN YOUR NIGHTMARES!\"");
  const r=await battle("jasper");if(r!=="win")return;
  setF("jasperDone");giveItem("tooth",6);seeMon("jasper");
  await say(null,"Lucky kills Filthy Jasper. His skull EXPLODES with volatile magic, and his voice echoes: \"Fesla… Fesla… Fesla…\"");
  await say(null,"Krodha gets a perfect Filthy Jasper pelt. Azareth gets more teeth. (75% of them.) Lucky takes the empty chalk-stripe suit.");checkFloors();};
TALK.balconyDoor=async()=>{
  if(hasF("balconySeen")){await say(null,"The balcony doors rattle in the storm.");return;}
  await say(null,"Double doors to the balcony. Locked.");const ok=await minigame("lockpick",{diff:2});if(!ok)return;
  setF("balconySeen");SFX.thunder();flash("#cde");
  await say(null,"Outside: a horrible storm. Black mists and shrouds, pressing against the house from every side. There is no outside. Not anymore.");};
/* ---------------------------- floor 3 ---------------------------------- */
TALK.taxidermyBear=async()=>{
  if(hasKey("pin")){await say(null,"The gutted bear. Sawdust everywhere.");return;}
  await say(null,"An animal trophy room, full of creepy taxidermy. Azareth notes a magical aura from the ceiling — and a trapdoor that leads up to the attic.");
  await say("lucky","Lucky cuts open the bear's stomach—");shake(5);SFX.scream();
  await say(null,"—and the face of a horrified woman stares out of the bear's MOUTH, straight at him. He falls back screaming. Pounds of sawdust pour out.");
  await say(null,"The spirit, Gail, is confused and scared. She exits the bear, sticks a BOBBY PIN into its nose, and disappears.",{name:"Gail",sub:"a spirit"});
  await say("azareth","Azareth takes the pin.");gotHeirloom("pin");};
TALK.trophies=async()=>{
  if(hasF("beastCalled")){await say(null,"The half-dog, half-bear trophy. Its eyes still follow Tessie.");return;}
  setF("beastCalled");
  await say("tessie","Tessie looks for the beast she hunts. One of the taxidermied animals looks JUST like it — half dog, half bear, crazy eyes. It calls to her. It locks eyes with her. It is not dead.");
  await say(null,"Tessie shoots it with her bow — it releases only a cloud of sawdust. Things shift. A taxidermied crow comes alive briefly, then goes still.\nThey put the crow in the bag of holding.");learnLore("beast");};
TALK.whisp=async()=>{
  await say(null,"A cluttered library. A grey cat watches you from a stack of books.");
  const c=await ask(null,"\"Tell me a tale,\" says the cat. His name is WHISP.",["Lucky tells a tale","Pick up the cat","Poppi shoots a crossbow bolt at it"]);
  if(c===0){await say("lucky","Lucky tells a TALL tale about a skeleton, a haunted train, and a baby goat. As he talks, a book flips open and fills itself with the story.");
    if(!hasF("taleTold")){setF("taleTold");await say(null,"Lucky takes the book. The cat is displeased.");}return;}
  if(c===1){await say(null,"Lucky tries to pick up the cat. He fails. The cat is VERY displeased.");return;}
  await say(null,"The bolt misses — and the cat takes its TRUE FORM: a KETGRINN. It dematerializes and flies out the window.");
  seeMon("ketgrinn");setF("whispGone");learnSecret("riddle");};
TALK.libraryBooks=async()=>{
  const opts=["Poppi: the curse book","Azareth: memory & apocalypse","Lucky: music theory & fairytales","Krodha: the evil 'twin'","Tessie: the beast"];
  const c=await ask(null,"Everyone reads, searching for knowledge.",opts.concat(["Stop reading"]));if(c<5)setF("readLibrary");
  if(c===0){await say("poppi","A book titled in the same language as the stolen page Poppi carries. It tells of a curse that matches her own, shows part of an incantation — and has many BLANK pages. Secrets collected by demons. Symbols of eyes and wings.");qStep("antiquarian",2);learnLore("malediction");}
  if(c===1){await say("azareth","One comprehensive psych book — with an essay by MATRON LETHICA, the head of Memory's Rest.");learnLore("lethica");}
  if(c===2){if(!hasF("luckyBard")){setF("luckyBard");await say("lucky","Lucky devours books on music theory, history, and fairytales. For the first time in his life (death?).\n✦ THE BEGINNING OF BARD LUCKY — he learned VICIOUS MOCKERY.");SFX.level();}else await say("lucky","\"I'm a BARD now.\"");}
  if(c===3)await say("krodha","Krodha searches for his 'twin'. Only basic information. \"…The Divided Soul. Yeah. I knew that part.\"");
  if(c===4)await say("tessie","Nothing about her beast in the library. \"…The trophy room. It's in the trophy room.\"");};
TALK.readingDesk=async()=>{await say(null,"A reading desk with a green chair. Someone left a book open: 'On the Coven of Vermintoll — Three Sisters of Tooth, Pest and Flesh.'");learnLore("coven");};
TALK.crib=async()=>{
  if(hasKey("bear")){await say(null,"The cradle is empty now.");return;}
  await say(null,"An infant's wail. A nursery: a crib and cradle, both riddled with holes. The spectral baby's cries fill you with dread.");
  if(!hasF("stuffiesDone")){
    await say(null,"Nothing comforts it. Tessie summons Caster — no good. Lucky leaves to go read. Krodha finds four stuffies in the crib— and they ATTACK!");
    const r=await battle("stuffies");if(r!=="win")return;setF("stuffiesDone");}
  await say(null,"Caster pads up with the BLUE BEAR in his mouth and drops it in the cradle. The baby cuddles it and calms.");
  await say(null,"The baby motions to be held. Lucky picks him up and holds him until he dissipates.");
  gotHeirloom("bear");setF("got_bear");badge("babysitter");
  await say(null,"You take a short rest. Lucky starts to feel RAGE — an insatiable bloodthirst that demands violence… but he shakes it off.");healParty(.5);};
TALK.trapdoor=async()=>{
  if(!hasF("atticReady")){await say(null,"A trapdoor in the ceiling, glowing faintly red at the seams. A magical aura. It won't budge. ("+heirloomCount()+"/6 heirlooms — the house wants its mementos.)");return;}
  await TALK.crookedMan3();};
TALK.crookedMan3=async()=>{
  if(hasF("inAttic")){await warp("attic",10,8,"up");return;}
  await say("crookedman","The Crooked Man appears. Rectangular this time. Cackling.\n\"She stuffed me into the crack of the FOUNDATION.\"",{name:"The Crooked Man",sub:"Eustace Lockwood"});
  learnSecret("selfSacrifice");
  await say(null,"You stealthily head up to the attic…");setF("inAttic");
  await warp("attic",10,8,"up",{banner:["THE ATTIC","The Hag in the Attic"]});
  await say(null,"A cramped secret landing. A pulsing blood-red glow. Runic symbols cover the walls — and a small door glowing the same color, off to one side.");};
TALK.crookedManAttic=async()=>{await say("crookedman","\"Six little mementos. Six little holes. Go on, then.\" He grins with far too many angles.",{name:"The Crooked Man"});};
TALK.runeDoor=async()=>{
  if(heirloomCount()<6){await say(null,"Spaces between the runes. Six of them. ("+heirloomCount()+"/6)");return;}
  await say(null,"You slot the heirlooms into the spaces — Gem, Cup, Key, Doll, Bear, Pin. The runic circles glow, and the barrier falls. The door clicks open.");
  setF("runesOpen");SFX.unlock();shake(6);
  await say(null,"You sneak down the hall into a larger room. The floor is covered with a layer of HUMAN TEETH that crunch beneath your feet.");
  await say(null,"In the center: a massive CAULDRON glowing red. Bound and slumped against it: Adela and Phillip. A cloaked figure sways beside them, and doesn't seem to notice you.");};
TALK.adelaBound=async()=>{await say(null,"Adela, bound and slumped against the cauldron. Her eyes roll back. She's squirming — struggling.");await vesslaFight();};
TALK.phillipBound=async()=>{await say(null,"Phillip is unconscious. His crown-less head lolls. The noxious potion hisses.");};
TALK.cloakedFigure=async()=>{await vesslaFight();};
TALK.cauldron=async()=>{await say(null,"An acidic potion hisses. A profane ritual is almost complete. The stench is unbearable.");if(!hasF("vesslaDone"))await vesslaFight();};
async function vesslaFight(){
  if(hasF("vesslaDone"))return;
  if(!hasF("runesOpen"))return;
  const c=await ask("azareth","The cloaked figure sways over the cauldron. The ritual is nearly done.",["Azareth: cast ENTANGLE on the hag!","Rush the cloaked figure","Insight: something's wrong here…"]);
  if(c===0){await say(null,"Azareth's Entangle grips the figure — and Krodha, too. The cloak falls away: it's a very POSSESSED ADELA, grappled, eyes rolling back, squirming.");
    await say(null,"And the spell seems to have HELPED the ritual along.");}
  else if(c===2){const r=await check("azareth","Insight",13);await say(null,r.ok?"You see it: the cloaked figure is ADELA, possessed. The one bound by the cauldron — the one pretending to be Adela — is NOT HER.":"You can't tell who's who. The ritual pulses.");}
  else await say(null,"You rush the figure — it's ADELA, possessed! You pull up short.");
  await say(null,"The fake \"Adela\" bound at the cauldron grins — and transforms into the real VESSLA BROWNTOOTH, launching a surprise attack on Krodha!");
  seeNpcPortrait("vessla");
  await say("vessla","\"TEETH FOR THE MASTER! Your souls for the cauldron!\"",{name:"Vessla Browntooth",sub:"The Weasel Hag"});
  const r=await battle("vessla");
  if(r!=="win")return;
  setF("vesslaDone");seeMon("vessla");qDone("house");qDone("weasels");
  await vesslaAftermath();
}
async function vesslaAftermath(){
  await say(null,"Krodha's face is permanently disfigured in the fight. Poppi OBLITERATES the hag.");
  await say("vessla","\"SISTERS! My sisters—\" She collapses.",{name:"Vessla Browntooth"});
  await say("azareth","Azareth now has a mouth full of teeth. And a stomach full of teeth.");
  shake(10);FX.warp=1;await fadeTo(1,900);FX.warp=0;
  await say(null,"The Crooked House RESHAPES itself back into Druskenvald Manor. The cauldron, the runes, all the magical stuff — gone.");
  await fadeTo(0,700);
  seeNpcPortrait("adela");
  await say("adela","\"…Where— what happened? Why are you in our BEDROOM things? …You saved us. Didn't you.\"",{name:"Adela Druskenvald"});
  await say("phillip","\"Extremely confused. Not very happy you went through our things. VERY happy you saved us. Come back for dinner in a few days. 75 gold each, and our thanks.\"",{name:"Phillip Druskenvald"});
  addGold(375);
  await say(null,"You ask about the Patrini son. \"We might have a book about the family. Let us check — we'll tell you at dinner.\"");
  qStep("son",0);
  await say("poppi","Poppi finds scratchings left in the walls. Two names are legible:\nSTONOGA BLACKSTINGER.\nGOLLUB GRAYGULLET.");
  seeNpcPortrait("stonoga");await say(null,"The other two hag sisters of the Vermintoll Coven. They know what you did.",{name:"STONOGA BLACKSTINGER",sub:"The Centipede Hag · Skitterdeep Mine"});
  seeNpcPortrait("gollub");await say(null,"And they're coming.",{name:"GOLLUB GRAYGULLET",sub:"The Pigeon Hag · The Roving Rookery"});
  learnLore("coven");
  setF("gameDone");
  await say(null,"You head back to the inn to long rest… and LEVEL UP!");
  await restParty("long","inn",true);
  await levelTo(5,"The Weasel Hag is dead. The Hollow knows your names now.");
  badge("hagSlayer");
  await warp("village",15,30,"up",{banner:["THE END OF SESSION 8","…to be continued"]});
  await sessionBreak(8,{noCard:true});
  await showArcade("Sessions 1–8");
  await openSessionCard(9);
}
TALK.epilogueDrusk=async()=>{
  seeNpcPortrait("adela");
  const c=await ask("adela",hasF("dinnerDone")?"\"Thank you for coming to dinner. Phillip hasn't put that book down since.\"":"\"Dinner is in a few days. Phillip is looking for the Patrini book. You'll come?\"",["Roll the credits","\"What's next for us?\"","\"We'll be there.\""]);
  if(c===0)rollCredits();
  if(c===1){await say(null,"OPEN THREADS:\n• Memory's Rest — Azareth's memories (Morgan)\n• The Grey in Edwardia — Krodha\n• Investigate the Bakery\n• The Slovenly Cook & Plagueborn pies\n• The growing cemetery\n• The Patrini son — HE LIVES\n• Foxwillow — Randall's lift\n• Stonoga Blackstinger & Gollub Graygullet — the coven");}
};

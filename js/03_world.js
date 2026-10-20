/* ================================ world.js ============================= *
 * MAPS: real Crooked Moon battlemaps (art + hand-traced collision) and
 * hand-built ASCII interiors. Exits warp between maps. Thin walls (the
 * painted walls sit on cell boundaries) are "v x y0 y1" / "h y x0 x1". */
const T=24; // logical px per cell
const MAPS={};
function G(rows){return rows.map(r=>r.split(""));}
function fill(w,h,c){const g=[];for(let y=0;y<h;y++)g.push(new Array(w).fill(c));return g;}
function rect(g,x0,y0,x1,y1,c){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(g[y]&&x>=0&&x<g[y].length)g[y][x]=c;}
function clearAround(g,pts){pts.forEach(([x,y])=>{for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const r=g[y+dy];if(r&&r[x+dx]!==undefined&&!(dx===0&&dy===0))r[x+dx]=".";}});return g;}
function def(id,o){o.id=id;o.npcs=o.npcs||[];o.props=o.props||[];o.exits=o.exits||[];o.roam=o.roam||[];o.walls=o.walls||[];
  o.h=o.grid.length;o.w=o.grid[0].length;MAPS[id]=o;return o;}

/* ---- chibi looks for NPCs (overworld sprites) ---- */
const L=(skin,hair,top,bottom,x)=>Object.assign({kind:"human",skin,hair,top,bottom},x||{});
const LOOK={
  vagrant:{kind:"frog",top:"#3b2f4a",bottom:"#2a2233",hat:"top",hatCol:"#241c2c"},
  adela:L("#f0c9a8","#8a3b1f","#6b2f6e","#4a1f4e",{hairStyle:"bob",dress:true,accent:"#e8d9b0"}),
  phillip:L("#e9c9a8","#1a1414","#2b2a33","#1c1b22",{hat:null,cane:true,stripe:true,mustache:true}),
  daydreamer:L("#bfe","#8ce","#6bc","#4a9",{ghost:true,hat:"cap",hatCol:"#6ab",child:true}),
  harlequin:L("#bfe","#7cd","#5ab","#399",{ghost:true,hat:"jester",hatCol:"#6cc"}),
  jailbird:L("#bfe","#7cd","#9cd","#9cd",{ghost:true,stripe:true}),
  mariner:L("#bfe","#8cd","#5aa","#488",{ghost:true,hat:"cap",hatCol:"#4a8",beard:"#9de"}),
  songstress:L("#bfe","#8cd","#6bc","#6bc",{ghost:true,dress:true,hairStyle:"curly"}),
  sweetheart:L("#bfe","#8cd","#7bd","#7bd",{ghost:true,dress:true,hat:"bonnet",hatCol:"#9de"}),
  crookedpass:L("#9aa","#333","#445","#334",{ghost:true,tall:true}),
  passengerA:L("#bfe","#8cd","#5ab","#488",{ghost:true}),passengerB:L("#bfe","#8cd","#6ab","#499",{ghost:true,dress:true}),
  mayor:L("#f0c9a8","#999","#3a2a2a","#2a1f1f",{wide:true,mustache:true,hat:"top",hatCol:"#1d1a1a"}),
  alda:L("#e8c09c","#6a4a2a","#4a3a5a","#3a2a4a",{hat:"wide",hatCol:"#2a1f33",dress:true}),
  baltus:L("#e8c09c","#222","#6b6b72","#4a4a52",{pipe:true}),
  eleanor:L("#efd3b8","#8a8a8a","#1f2430","#171b24",{glasses:true,hairStyle:"bun",dress:true}),
  thomasin:L("#f1d9c8","#1a1a1a","#39343f","#2a2530",{hairStyle:"long",dress:true}),
  solomon:L("#c89878","#c89878","#6a5a48","#4a4032",{wide:true,apron:"#8a7a60"}),
  doris:L("#e8c09c","#9a9a9a","#3a3a3a","#2a2a2a",{hat:"cap",hatCol:"#222"}),
  howie:L("#e8c09c","#6a4a2a","#2f3f5a","#1f2f45",{hat:"cap",hatCol:"#1f2f45"}),
  weston:L("#efd3b8","#c9a25a","#e8e2d0","#9a8f78",{}),
  morgan:L("#efd3b8","#c98a4a","#4a6a3a","#3a4a2a",{apron:"#8a9a6a",hairStyle:"long"}),
  hilda:L("#b98a60","#4a2a1a","#5a4a2a","#3a2a1a",{hairStyle:"braid",feather:true}),
  finneas:L("#efd3b8","#7a4a2a","#3a4a6a","#2a3a4a",{glasses:true}),
  randall:L("#e0b890","#a87a4a","#6a2a2a","#3a2a2a",{beard:"#a87a4a",wide:true}),
  walter:L("#e8c09c","#c8c8c8","#2a2a2a","#1a1a1a",{tall:true}),
  gilly:L("#e8c09c","#4a2a1a","#6a5a4a","#4a3a2a",{apron:"#e8e0d0",dress:true}),
  dani:L("#f0d0b0","#e8d080","#7a8aa0","#5a6a80",{child:true,hairStyle:"braid"}),
  rusty:L("#e0b090","#c8704a","#5a4a3a","#3a3028",{beard:"#c8704a",hairStyle:"wild"}),
  holly:L("#f0c0a0","#e8e0b0","#6a5a4a","#4a3a2a",{apron:"#f0ece0",hairStyle:"bun"}),
  jean:L("#a07050","#1a1a1a","#4a3a2a","#2a2018",{apron:"#6a4a2a",beard:"#1a1a1a",wide:true}),
  theodora:L("#f0dcc8","#f0e8c0","#4a3a2a","#3a2a1a",{hat:"wide",hatCol:"#4a3020",pigeon:true}),
  oswick:L("#f0d8c8","#d8482a","#3a5a3a","#2a3a2a",{wheel:true}),
  mori:L("#5a3a2a","#f0f0f0","#111","#111",{hairStyle:"long",dress:true}),
  rain:L("#f0d8c8","#d8482a","#3a7a3a","#2a5a2a",{hairStyle:"long",dress:true}),
  siv:L("#f0d8c8","#e8d080","#5a4a3a","#3a2a1a",{hairStyle:"braid",apron:"#b04040"}),
  marianna:L("#e0b890","#1a1a1a","#5a6a4a","#3a4a2a",{}),
  gaston:L("#efd3b8","#3a2a1a","#6a5a4a","#4a3a2a",{hairStyle:"wild",paint:true}),
  beatrice:L("#8a5a3a","#2a1a1a","#d8a040","#a07030",{hat:"wide",hatCol:"#b04030"}),
  jeremiah:L("#d8a880","#8a8a8a","#6a5a3a","#4a3a2a",{hat:"cap",hatCol:"#4a3a2a",wide:true}),
  villagerA:L("#e8c09c","#5a3a1a","#6a5a4a","#3a3028",{}),villagerB:L("#d8a880","#2a1a1a","#4a5a6a","#3a3a4a",{dress:true}),
  villagerC:L("#f0d0b0","#a07030","#7a4a3a","#4a3028",{hat:"cap",hatCol:"#3a3028"}),villagerD:L("#b88a60","#1a1a1a","#5a6a4a","#3a4a2a",{dress:true,hairStyle:"bun"}),
  wainwright:L("#e8c09c","#4a2a1a","#5a4a3a","#3a2a1a",{wide:true}),
  kid:L("#f0d0b0","#7a4a2a","#8a6a4a","#5a4a3a",{child:true}),
  crookedman:{kind:"crooked"},
  petunia:L("#bfe","#8cd","#6bc","#6bc",{ghost:true,dress:true,scarf:"#4a8a4a"}),
  patrini:L("#bfe","#8cd","#5aa","#488",{ghost:true,tall:true}),
  sally:{kind:"doll",small:true},gail:L("#bfe","#8cd","#7bd","#6ac",{ghost:true,dress:true}),
  baby:{kind:"baby"},cat:{kind:"cat"},goat:{kind:"goat"},
  weaselbig:{kind:"weasel",big:true},
  tiger:{kind:"tiger"},
};
/* portrait art keys for NPCs (real Crooked Moon art) */
const PORT={vagrant:"The_Vagrant",adela:"Adela_Druskenvald",phillip:"Phillip_Druskenvald",daydreamer:"The_Daydreamer",harlequin:"The_Harlequin",
  jailbird:"The_Jailbird",mariner:"The_Mariner",songstress:"The_Songstress",sweetheart:"The_Sweetheart",mayor:"Mayor_Wendel_Somerton",alda:"Alda_Farnum",
  baltus:"Baltus_Tolliver",eleanor:"Eleanor_Heyling",thomasin:"Thomasin_Ardor",solomon:"Solomon_Roderick",doris:"Doris_Squire",howie:"Howie_Butterman",
  weston:"Weston_Murdoch",morgan:"Morgan",hilda:"Hilda_Brom",finneas:"Finneas_Trout",randall:"Randall_Graham",walter:"Walter_Jenkin",gilly:"Gilly_Jenkin",
  dani:"Dani_Jenkin",rusty:"Old_Rusty",holly:"Holly_Aster",jean:"Jean_Myriel",theodora:"Theodora_Mayville",oswick:"Oswick_Frey",mori:"Mori_Shade",
  rain:"Sister_Rain",siv:"Siv_Harga",marianna:"Mariana_Grey",gaston:"Gaston_Doray",beatrice:"Beatrice_Wells",jeremiah:"Jeremiah_Stover",
  crookedman:"The_Crooked_Man",vessla:"Vessla_Browntooth",stonoga:"Stonoga_Blackstinger",gollub:"Gollub_Graygullet",lethica:"Matron_Lethica"};

const N=(id,x,y,o)=>Object.assign({id,x,y,dir:"down"},o||{});   // npc
const PR=(id,x,y,o)=>Object.assign({id,x,y},o||{});                 // prop
const E=(x,y,to,tx,ty,dir,o)=>Object.assign({x,y,to,tx,ty,dir:dir||"down"},o||{}); // exit

/* ============================ PROLOGUE: STATION ========================= */
def("station",{name:"A Platform in the Mist",sub:"Prologue",music:"title",theme:"station",dark:.35,amb:"mist",bg:"#0c1418",
  grid:G([
    "tttttttttttttttttttt",
    "t~~~~~~~~~~~~~~~~~~t",
    "~~~~~~~~~~~~~~~~~~~~",
    "#####=###pppppppppp~",
    "pppppppppppppppppppp",
    "pnppLppppppppnpppLpp",
    "pppppppppppppppppppp",
    "pppppppppppppppppppp",
    "RRRRRRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRRRRRR",
    "~~~~~~~~~~~~~~~~~~~~"]),
  start:{x:3,y:6,dir:"right"},
  npcs:[],
  props:[PR("booth",5,3,{name:"Ticket Booth",talk:"stationBooth"}),PR("sign",12,3,{name:"Platform Sign",art:"sign",talk:"stationSign"}),
         PR("bench1",1,5,{name:"Bench",talk:"stationBench"}),PR("lamp1",4,5,{art:"lamp",talk:"stationLamp"}),PR("edge",15,7,{name:"Platform Edge",talk:"stationEdge",hot:true})],
});

/* ============================ CH.1 THE GHOSTLIGHT EXPRESS =============== */
function carGrid(x0,x1,extra,solidExtra){const g=fill(24,7,"#");for(let x=x0;x<=x1;x++)g[3][x]=".";(extra||[]).forEach(([x,y])=>g[y][x]=".");(solidExtra||[]).forEach(([x,y])=>g[y][x]="#");return g;}
const CAR={art:true,theme:"train",music:"train",dark:.15,amb:"shroud",bg:"#0b1a1a",zoom:1.5,sub:"Ch.1 · The Ghostlight Express"};
def("car_passenger",Object.assign({},CAR,{name:"The Passenger Car",art:"car_passenger",grid:carGrid(6,18),start:{x:8,y:3,dir:"right"},
  npcs:[N("crookedpass",14,2,{name:"Crooked-Necked Passenger",look:"crookedpass",talk:"crookedPassenger",hide:"shroudDone",dir:"down"}),
        N("vagrant",8,4,{name:"The Vagrant",look:"vagrant",talk:"vagrantCar1",dir:"up"}),
        N("pA",11,2,{name:"Quiet Passenger",look:"passengerA",talk:"ghostPassenger",dir:"down"}),N("pB",16,4,{name:"Veiled Passenger",look:"passengerB",talk:"ghostPassenger",dir:"up"})],
  props:[PR("crack",13,4,{name:"Cracked Window",talk:"windowCrack",need:"shroudDone"}),PR("seatloot",9,2,{name:"Seat Cushions",talk:"seatLoot"})],
  exits:[E(6,3,null,0,0,"left",{lock:"Beyond the coupling there is only thick, impenetrable fog. There's no going back."}),
         E(18,3,"car_dining",7,3,"right",{need:"shroudDone",lock:"The Vagrant blocks the door: \"Deal with THAT first, if you please.\""})]}));
def("car_dining",Object.assign({},CAR,{name:"The Dining Car",art:"car_dining",
  grid:carGrid(6,18,[[13,2],[14,2],[13,4],[14,4],[15,2],[16,2],[15,4],[16,4]]),start:{x:7,y:3,dir:"right"},
  npcs:[N("daydreamer",10,2,{name:"The Daydreamer",look:"daydreamer",talk:"daydreamer",hide:"freed_daydreamer",dir:"down"}),
        N("diner1",8,4,{name:"Deceased Diner",look:"passengerB",talk:"deadDiner",dir:"up"}),N("diner2",12,4,{name:"Deceased Diner",look:"passengerA",talk:"deadDiner",dir:"up"})],
  props:[PR("kitchen",16,4,{name:"Galley Stove",art:"stove",talk:"diningKitchen"}),PR("booth",14,2,{name:"Round Table",art:"table",talk:"diningTable"})],
  exits:[E(6,3,"car_passenger",17,3,"left"),E(18,3,"car_mail",7,3,"right")]}));
def("car_mail",Object.assign({},CAR,{name:"The Mail Car",art:"car_mail",grid:carGrid(6,16),start:{x:7,y:3,dir:"right"},
  npcs:[N("mariner",13,2,{name:"The Mariner",look:"mariner",talk:"mariner",hide:"freed_mariner",dir:"down"}),
        N("wetghost",9,4,{name:"Soggy Ghost",look:"passengerA",talk:"wetGhost",dir:"up"})],
  props:[PR("mailpile",11,4,{name:"Heaps of Mail",talk:"mailPile"}),PR("sacks",8,2,{name:"Mail Sacks",talk:"mailSacks"})],
  exits:[E(6,3,"car_dining",17,3,"left"),E(16,3,"car_lounge",7,3,"right")]}));
def("car_lounge",Object.assign({},CAR,{name:"The Lounge Car",art:"car_lounge",grid:carGrid(6,18),start:{x:7,y:3,dir:"right"},
  npcs:[N("adela",12,2,{name:"Adela Druskenvald",look:"adela",talk:"adelaTrain",dir:"down"}),N("phillip",13,2,{name:"Phillip Druskenvald",look:"phillip",talk:"phillipTrain",dir:"down"}),
        N("songstress",16,4,{name:"The Songstress",look:"songstress",talk:"songstress",hide:"freed_songstress",dir:"up"})],
  props:[PR("phonograph",10,4,{name:"Phonograph",art:"phonograph",talk:"phonograph"}),PR("painting",8,2,{name:"Seascape Painting",talk:"loungePainting"}),
         PR("letter",15,2,{name:"Abandoned Letter",talk:"loungeLetter"}),PR("bar",9,2,{name:"The Bar",talk:"loungeBar"})],
  exits:[E(6,3,"car_mail",15,3,"left"),E(18,3,"car_sleeper",7,3,"right")]}));
def("car_sleeper",Object.assign({},CAR,{name:"The Sleeping Car",art:"car_sleeper",
  grid:(()=>{const g=fill(24,7,"#");for(let x=7;x<=17;x++)g[4][x]=".";[2,3,4].forEach(y=>{g[y][7]=".";g[y][17]=".";});g[3][6]=".";g[3][18]=".";return g;})(),
  start:{x:7,y:3,dir:"right"},
  npcs:[N("sweetheart",15,3,{name:"The Sweetheart",look:"sweetheart",talk:"sweetheart",hide:"freed_sweetheart",dir:"down",solid:true})],
  props:[PR("cabin1",9,3,{name:"Cabin #1",talk:"cabin1"}),PR("cabin2",12,3,{name:"Cabin #2 (ajar)",talk:"cabin2"})],
  exits:[E(6,3,"car_lounge",17,3,"left"),E(18,3,"car_baggage",7,3,"right")]}));
def("car_baggage",Object.assign({},CAR,{name:"The Baggage Car",art:"car_baggage",grid:carGrid(6,16,[[10,2],[11,4]]),start:{x:7,y:3,dir:"right"},
  npcs:[N("tiger",13,2,{name:"Ghost Tiger",look:"tiger",talk:"ghostTiger",dir:"down"}),
        N("jailbird",9,4,{name:"Snoring Baggage",look:"jailbird",talk:"jailbird",hide:"freed_jailbird",dir:"up"})],
  props:[PR("trunks",8,2,{name:"Druskenvald Trunks",talk:"druskTrunks"}),PR("case",14,2,{name:"A Familiar Small Case",talk:"luckyCase"}),PR("baglook",12,4,{name:"Luggage Pile",talk:"luggageSearch"})],
  exits:[E(6,3,"car_sleeper",17,3,"left"),E(16,3,"car_circus",7,3,"right")]}));
def("car_circus",Object.assign({},CAR,{name:"The Bloody Circus Car",art:"car_circus",grid:carGrid(6,16),start:{x:7,y:3,dir:"right"},
  npcs:[N("harlequin",14,2,{name:"The Harlequin",look:"harlequin",talk:"harlequin",hide:"harlequinGone",dir:"down"})],
  props:[PR("cages",12,4,{name:"Locked Cages",talk:"cages"}),PR("keys",9,2,{name:"Ring of Keys",talk:"keyring",hide:"got_keyring"}),PR("banner",11,2,{name:"Tattered Banner",talk:"circusBanner"})],
  exits:[E(6,3,"car_baggage",15,3,"left"),E(16,3,"car_tender",4,3,"right",{need:"harlequinDealt",lock:"A heavy door. Behind it, whispers. The Vagrant said: help the passengers first — at least the loud one."})]}));
def("car_tender",Object.assign({},CAR,{name:"The Furnace Car",art:"car_tender",
  grid:(()=>{const g=fill(24,7,"#");for(let y=2;y<=4;y++){g[y][4]=".";g[y][8]=".";g[y][9]=".";}[5,6,7].forEach(x=>{g[2][x]=".";g[4][x]=".";});g[3][3]=".";return g;})(),
  start:{x:4,y:3,dir:"right"},
  npcs:[N("vagrantF",8,2,{name:"The Vagrant",look:"vagrant",talk:"vagrantFurnace",dir:"down"})],
  props:[PR("furnace",10,3,{name:"The Soul Furnace",talk:"furnace"}),PR("coal",6,3,{name:"Soul-Coal Tender",talk:"soulCoal"})],
  exits:[E(3,3,"car_circus",15,3,"left")]}));

/* ============================ THE WRECKAGE ============================= */
def("wreckage",{name:"The Ghostlight Wreckage",sub:"Ch.1 · Thrown from the train",art:"wreckage",theme:"woods",music:"woods",dark:.45,light:5,amb:"wisps",bg:"#060b0b",
  grid:clearAround(G(GRIDS.wreckage).map((r,y)=>r.map((c,x)=>((x>=14&&x<=23&&y>=1&&y<=4)||(x>=27&&y<=7))?"#":c)),[[4,5],[8,12],[16,9],[21,13],[29,11],[2,13],[12,5],[25,14],[11,9],[25,8],[12,6],[13,6],[26,7]]),
  start:{x:10,y:8,dir:"down"},
  npcs:[N("vagrantW",25,8,{name:"The Vagrant",look:"vagrant",talk:"vagrantWreck",dir:"left"}),
        N("adelaW",12,6,{name:"Adela Druskenvald",look:"adela",talk:"adelaWreck"}),N("phillipW",13,6,{name:"Phillip Druskenvald",look:"phillip",talk:"phillipWreck"})],
  props:[
    PR("jar1",4,5,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar1"}),PR("jar2",8,12,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar2"}),
    PR("jar3",16,9,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar3"}),PR("jar4",21,13,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar4"}),
    PR("jar5",29,11,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar5"}),PR("jar6",2,13,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar6"}),
    PR("jar7",12,2,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar7"}),PR("jar8",25,14,{name:"Glowing Jar",art:"jar",talk:"soulJar",hide:"jar8"}),
    PR("engine",26,6,{name:"The Toppled Locomotive",talk:"engineWreck",hot:true}),PR("campfire",11,9,{name:"Campfire",art:"fire",talk:"restPoint",rest:"wreckage"})],
  roam:[{id:"rw1",enc:"wreck1",x:6,y:9,look:"mon:Wayward_Haint"},{id:"rw2",enc:"wreck2",x:19,y:12,look:"mon:Shrouded_Reaper",need:"jarsHalf"}],
  exits:[E(0,11,"darkwood",8,14,"up",{need:"locoDefeated",lock:"The Vagrant: \"Six jars, friends. Then we talk about leaving.\""}),E(0,12,"darkwood",8,14,"up",{need:"locoDefeated",lock:"The woods can wait. The jars can't."})]});

/* ============================ CH.2 THE WALK / VILLAGE ================== */
def("darkwood",{name:"The Walk Through the Woods",sub:"Ch.2 · Toward Wickermoor",art:"darkwood",theme:"woods",music:"woods",dark:.35,light:6,amb:"leaves",bg:"#070a0c",
  grid:G(GRIDS.darkwood),start:{x:8,y:14,dir:"up"},
  npcs:[N("adelaD",6,10,{name:"Adela Druskenvald",look:"adela",talk:"adelaWalk",hide:"arrived"}),N("phillipD",10,10,{name:"Phillip Druskenvald",look:"phillip",talk:"phillipWalk",hide:"arrived"})],
  props:[PR("pine",3,8,{name:"A Very Tall Pine",talk:"tallPine"})],
  exits:[E(8,15,"wreckage",1,11,"left",{lock:"Back toward the wreck? The Druskenvalds are already walking the other way.",need:"__never"}),E(8,0,"founders",11,20,"up",{event:"arrival"})]});
def("founders",{name:"The Founder's Round",sub:"Ch.2 · Wickermoor Village",art:"founders",theme:"village",music:"village",dark:.3,light:7,amb:"none",bg:"#0b0b10",
  grid:(()=>{const g=fill(22,22,".");rect(g,0,0,21,0,"#");rect(g,0,21,21,21,"#");rect(g,0,0,0,21,"#");rect(g,21,0,21,21,"#");
    rect(g,0,0,2,3,"#");rect(g,18,0,21,4,"#");rect(g,0,17,3,21,"#");rect(g,18,16,21,21,"#");g[8][8]="#";rect(g,11,14,13,15,"#");g[21][11]=".";return g;})(),
  start:{x:11,y:20,dir:"up"},
  npcs:[N("mayorF",15,6,{name:"Mayor Wendel Somerton",look:"mayor",talk:"mayorRitual",need:"wolvesDone"}),N("goat",10,11,{name:"The Struggling Figure",look:"goat",talk:"sack",hide:"goatFree"})],
  props:[PR("statueF",8,8,{name:"Faceless Statue",talk:"facelessStatue"}),PR("oakF",12,14,{name:"The Oak of Faces",talk:"oakFaces"})],
  exits:[E(11,21,"village",15,30,"down",{need:"wolvesDone",lock:"Not with the wolves circling!"}),E(10,0,"village",15,22,"up",{need:"ritualTalked",lock:"The mayor is still talking at you."})]});

/* Wickermoor Village — the real village map, hand-traced */
const VBLD=[ // footprint rects (solid) [x0,y0,x1,y1,label]
  [3,3,8,8,"manor"],[2,17,8,20,"church"],[10,16,11,17,"gazebo"],[13,18,14,20,"hA"],[12,21,13,22,"hB"],[16,20,17,22,"tailor"],[17,17,19,19,"constab"],
  [18,21,20,23,"trading"],[20,18,21,20,"hF"],[21,20,23,22,"books"],[23,18,25,20,"mason"],[26,18,26,18,"stones"],[24,22,26,24,"hI"],
  [5,22,6,24,"apoth"],[7,22,8,24,"bakery"],[10,21,11,23,"school"],[17,25,20,28,"townhall"],[21,24,22,26,"post"],[23,25,24,27,"butcher"],[25,25,25,27,"chandler"],
  [26,25,29,28,"carpentry"],[2,25,4,28,"stables"],[7,26,8,27,"barber"],[9,25,13,29,"inn"],[6,29,8,31,"smithy"],[10,28,11,29,"hK"],[11,30,13,31,"undertaker"],
  [20,29,22,30,"hM"],[23,28,24,30,"hN"],[3,31,4,32,"hP"],[15,31,16,32,"hQ"],[17,31,18,32,"hR"],[19,32,20,33,"hS"],
  [22,30,23,32,"hT"],[7,33,8,34,"hV"],[5,34,6,35,"hW"],[10,34,11,35,"hX"],[12,33,13,34,"hY"],[17,34,19,35,"hZ"],[23,33,25,35,"taylor"],
  [18,37,19,38,"hFarm"],[19,10,19,11,"aviary"],[22,14,22,15,"hTop"],[14,23,14,23,"statue"],[15,24,15,24,"oak"],[22,2,26,5,"compass"],
];
const VTREES=[[0,12,3,19],[4,13,8,15],[26,4,29,11],[26,12,29,19],[0,29,2,39],[0,35,5,39],[22,37,29,39],[28,29,29,35],[3,1,3,2],[10,5,10,7],[13,6,14,7],[17,5,18,6],[24,10,25,11],[9,32,9,32]];
function buildVillage(){
  const g=fill(30,40,".");
  VTREES.forEach(r=>rect(g,r[0],r[1],r[2],r[3],"#"));
  VBLD.forEach(r=>rect(g,r[0],r[1],r[2],r[3],"#"));
  // clear the paths through tree lines
  [[6,0],[7,0],[6,1],[7,1],[0,23],[0,24],[1,23],[1,24],[29,14],[28,14],[27,14],[26,14],[14,39],[15,39],[14,38],[15,38],[8,12]].forEach(([x,y])=>g[y][x]=".");
  return g;
}
def("village",{name:"Wickermoor Village",sub:"The hub · Ch.2–4",art:"village",theme:"village",music:"village",dark:.12,amb:"village",bg:"#15121c",
  grid:G(buildVillage().map(r=>r.join(""))),start:{x:15,y:30,dir:"up"},
  npcs:[
    N("rusty",11,13,{name:"Old Rusty",look:"rusty",talk:"oldRusty",wander:2}),
    N("rain",17,30,{name:"Sister Rain",look:"rain",talk:"sisterRain",wander:3}),
    N("marianna",5,29,{name:"Marianna Grey",look:"marianna",talk:"marianna"}),
    N("siv",22,28,{name:"Siv Harga",look:"siv",talk:"siv"}),
    N("mori",13,32,{name:"Mori Shade",look:"mori",talk:"mori"}),
    N("oswick",27,24,{name:"Oswick Frey",look:"oswick",talk:"oswick"}),
    N("gaston",9,19,{name:"Gaston Doray",look:"gaston",talk:"gaston",wander:2}),
    N("beatrice",26,29,{name:"Beatrice Wells",look:"beatrice",talk:"beatrice"}),
    N("jeremiah",20,36,{name:"Jeremiah Stover",look:"jeremiah",talk:"jeremiah",wander:2}),
    N("vkid1",12,24,{name:"Village Kid",look:"kid",talk:"villageKid",wander:3}),
    N("vA",20,31,{name:"Villager",look:"villagerA",talk:"villager",wander:4}),N("vB",6,26,{name:"Villager",look:"villagerB",talk:"villager",wander:4}),
    N("vC",16,16,{name:"Villager",look:"villagerC",talk:"villager",wander:4}),N("vD",16,30,{name:"Villager",look:"villagerD",talk:"villager",wander:3}),
    N("walterV",8,10,{name:"Walter Jenkin",look:"walter",talk:"jenkins",need:"ch4",hide:"enteredHouse"}),N("gillyV",9,10,{name:"Gilly Jenkin",look:"gilly",talk:"jenkins",need:"ch4",hide:"enteredHouse"}),
    N("daniV",9,11,{name:"Dani Jenkin",look:"dani",talk:"dani",need:"ch4",hide:"enteredHouse"}),
    N("hildaV",7,2,{name:"Hilda Brom",look:"hilda",talk:"hildaEdge",need:"hildaGuide",hide:"wytchwoodIn"}),
    N("weaselV",16,26,{name:"A Weasel",look:"weaselbig",talk:"weaselStare",need:"ch3back",hide:"weaselsKnown",wander:3}),
    N("adelaV",16,34,{name:"Adela & Phillip",look:"adela",talk:"epilogueDrusk",need:"gameDone"}),
  ],
  props:[
    PR("board",13,24,{name:"Community Board",art:"board",talk:"communityBoard",hot:true}),
    PR("statueV",14,23,{name:"Faceless Founder",talk:"facelessStatue",noDraw:true}),PR("oakV",15,24,{name:"The Oak of Faces",talk:"oakFaces",noDraw:true}),
    PR("aviary",19,12,{name:"The Aviary",talk:"aviary"}),PR("porch",23,36,{name:"Taylor Porch Steps",talk:"taylorPorch"}),
    PR("stonesV",26,19,{name:"Stone Pile",talk:"stonePile"}),PR("well",16,29,{art:"well",name:"Village Well",talk:"villageWell"}),
    PR("inn_sign",13,26,{name:"Sign: The Green Queen Inn",noDraw:true,talk:"innSign"}),
    PR("mailbox",21,27,{name:"Post Box",art:"mailbox",talk:"mailbox"}),
  ],
  exits:[
    E(7,0,"wytchwood",7,16,"up",{need:"hildaGuide",lock:"The path north runs into the Wytchwood. People don't tend to come back. (You need a guide — and a reason.)",event:"wytchwoodEnter"}),
    E(6,0,"wytchwood",7,16,"up",{need:"hildaGuide",lock:"The Wytchwood. Not without a guide.",event:"wytchwoodEnter"}),
    E(14,39,"darkwood",8,1,"down",{lock:"The road back south leads to the wreck. Nothing there for you now.",need:"__never"}),E(15,39,"darkwood",8,1,"down",{need:"__never",lock:"The road back south leads only to the wreck."}),
    E(0,23,"",0,0,"left",{need:"__never",lock:"West: the Howlers and Memory's Rest. (Chapter 4 — Morgan says it can help with memories.)"}),E(0,24,"",0,0,"left",{need:"__never",lock:"West lies Memory's Rest. Not yet."}),
    E(29,14,"",0,0,"right",{need:"__never",lock:"East: the road to Foxwillow. Randall Graham has promised a lift… someday."}),
    // doors
    E(7,8,"house1",8,16,"up",{need:"ch4",lock:"The manor on the hill. The Druskenvalds aren't receiving guests yet.",event:"crookedArrival"}),
    E(5,20,"church",7,10,"up"),E(14,20,"",0,0,"up",{need:"__never",lock:"A tall, narrow house. Nobody answers."}),
    E(13,22,"",0,0,"up",{need:"__never",lock:"Locked. A child's face watches from the upstairs window, then vanishes."}),
    E(16,22,"tailor",6,7,"up"),E(18,19,"constab",6,7,"up"),E(19,23,"trading",6,7,"up"),E(22,22,"books",6,7,"up"),E(24,20,"mason",6,7,"up"),
    E(5,24,"apoth",6,7,"up"),E(8,24,"bakery",6,7,"up"),E(11,23,"school",6,7,"up"),E(18,28,"townhall",7,8,"up"),E(22,26,"post",6,7,"up"),
    E(8,27,"barber",6,7,"up"),E(13,27,"inn",14,5,"left"),E(8,31,"smithy",6,7,"up"),E(24,35,"taylor",5,6,"up",{need:"taylorUnlocked",lock:"The Taylor farmhouse. Locked. Nobody's home.",event:"taylorDoor"}),
    E(23,27,"",0,0,"up",{need:"__never",lock:"Harga's Meats. Closed — a sign reads 'BACK AFTER THE BLOODY CUP'."}),
    E(3,28,"",0,0,"up",{need:"__never",lock:"The stables. Horses snort in the dark."}),E(27,28,"",0,0,"up",{need:"__never",lock:"The Wells Carpentry Workshop. Sawdust and hymns."}),
  ]});

/* ---- ASCII interiors ---- */
const IN={theme:"interior",music:"village",dark:.1,amb:"dust",bg:"#0d0b12"};
function room(id,name,rows,o){return def(id,Object.assign({},IN,{name,grid:G(rows)},o));}
room("inn","The Green Queen Inn",[
  "################",
  "#BF#SSS==SSS#WB#",
  "#,,.........,,,#",
  "#,T,..T...T.,T,#",
  "#,c,..c...c.,c,#",
  "#...............",
  "#..T...T....ObO#",
  "#..c...c....,,,#",
  "#...........,b,#",
  "#P..........,,,#",
  "################"],{start:{x:14,y:5,dir:"left"},music:"village",sub:"Rooms 1cp · Festive, not sleepy",
  npcs:[N("alda",7,1,{name:"Alda Farnum",look:"alda",talk:"alda",solid:true}),N("hilda",2,5,{name:"Hilda Brom",look:"hilda",talk:"hildaInn",need:"fingerReturned",hide:"hildaGuide"}),
        N("finneasI",11,4,{name:"Finneas Trout",look:"finneas",talk:"finneasInn",need:"hexKnown",hide:"gotMap"}),
        N("randallI",10,7,{name:"Randall Graham",look:"randall",talk:"randallInn",need:"ch3back"}),
        N("patron1",3,4,{name:"Farmhand",look:"villagerC",talk:"patron"}),N("patron2",14,3,{name:"Tipsy Patron",look:"villagerA",talk:"patron"}),
        N("wain",8,7,{name:"Card Players",look:"wainwright",talk:"liarsDiceTable"})],
  props:[PR("bed",13,8,{name:"Your Room",art:"bed",talk:"innRest",rest:"inn"}),PR("books",14,1,{name:"Dusty Books",talk:"innBooks"}),PR("fireI",2,1,{name:"Hearth",talk:"hearth"})],
  exits:[E(15,5,"village",14,27,"right")]});
room("trading","Tolliver's Trading Post",[
  "############",
  "#SSS#==#SSS#",
  "#..........#",
  "#K........O#",
  "#K..T......#",
  "#..........#",
  "#O........P#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("baltus",5,1,{name:"Baltus Tolliver",look:"baltus",talk:"baltus",solid:true}),N("wilma",2,5,{name:"Wilma Wainwright",look:"villagerD",talk:"wainwrights"}),N("ronald",9,5,{name:"Ronald Wainwright",look:"wainwright",talk:"wainwrights"}),
        N("tkid",7,6,{name:"Wainwright Kid",look:"kid",talk:"villageKid",wander:2})],
  props:[PR("shelf",2,1,{name:"Shelves",talk:"tradeShelves"})],
  exits:[E(6,8,"village",19,24,"down")]});
room("books","The Antique Bookstore",[
  "############",
  "#BBBBB#BBBB#",
  "#....,,,...#",
  "#B...,T,..B#",
  "#B...,c,..B#",
  "#B........B#",
  "#..B....B..#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("eleanor",6,2,{name:"Eleanor Heyling",look:"eleanor",talk:"eleanor"})],
  props:[PR("bshelf",3,1,{name:"The Collection",talk:"bookShelf"}),PR("occult",10,3,{name:"Occult Section",talk:"occultShelf"})],
  exits:[E(6,8,"village",22,23,"down")]});
room("tailor","A Stitch in Time",[
  "############",
  "#SS=====#MM#",
  "#..........#",
  "#M.......M.#",
  "#..,,,,,,..#",
  "#..,,,,,,..#",
  "#M........M#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("thomasin",5,2,{name:"Thomasin Ardor",look:"thomasin",talk:"thomasin"})],
  props:[PR("fabric",2,1,{name:"Bolts of Drab Fabric",talk:"fabric"}),PR("avant",9,1,{name:"The Avant-Garde Rack",talk:"avantGarde"})],
  exits:[E(6,8,"village",16,23,"down")]});
room("constab","The Constabulary",[
  "############",
  "#S#=====#bb#",
  "#..........#",
  "#T.....#..##",
  "#c.....#...#",
  "#......##-##",
  "#O.........#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("doris",4,2,{name:"Constable Doris Squire",look:"doris",talk:"doris"}),N("howie",2,5,{name:"Deputy Howie Butterman",look:"howie",talk:"howie"})],
  props:[PR("wanted",1,1,{name:"Wanted Posters",talk:"wantedPosters"}),PR("cell",9,4,{name:"Holding Cell",talk:"holdingCell"})],
  exits:[E(6,8,"village",18,20,"down")]});
room("mason","Roderick Masonry",[
  "############",
  "#ss.rrr.Kss#",
  "#..........#",
  "#s..A...s..#",
  "#..........#",
  "#rr......rr#",
  "#s........s#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},theme:"stone",
  npcs:[N("solomon",6,3,{name:"Solomon Roderick",look:"solomon",talk:"solomon"})],
  props:[PR("headstone",2,3,{name:"Unfinished Headstone",talk:"headstones"})],
  exits:[E(6,8,"village",24,21,"down")]});
room("church","The Old Brightsinger Church",[
  "###############",
  "#r####a####r###",
  "#r....,s,....r#",
  "#.....,,,.....#",
  "#.nn..,,,..nn.#",
  "#.nn..,,,..nn.#",
  "#r....,,,....r#",
  "#.nn..,,,..nn.#",
  "#.....,,,....r#",
  "#r....,,,.....#",
  "#.....,,,.....#",
  "#######.#######"],{start:{x:7,y:10,dir:"up"},theme:"stone",music:"house",dark:.2,amb:"dust",sub:"Partially ruined · under reconstruction",
  npcs:[N("weston",9,3,{name:"Weston Murdoch",look:"weston",talk:"weston"})],
  props:[PR("knight",7,2,{name:"The Knight Statue",talk:"knightStatue"}),PR("altar",6,1,{name:"Altar",talk:"churchAltar",noDraw:true})],
  exits:[E(7,11,"village",5,21,"down")]});
room("apoth","The Apothecary",[
  "############",
  "#SSSS=SSSSS#",
  "#..........#",
  "#P..C...P..#",
  "#..........#",
  "#SS.....SS.#",
  "#.........O#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("morgan",5,2,{name:"Morgan",look:"morgan",talk:"morgan"})],
  props:[PR("brew",4,3,{name:"Bubbling Cauldron",talk:"apothBrew"}),PR("seeds",9,5,{name:"Seed Drawers",talk:"seedDrawers"})],
  exits:[E(6,8,"village",5,25,"down")]});
room("bakery","Bread by Holly",[
  "############",
  "#oo#==S==SS#",
  "#..........#",
  "#T.......T.#",
  "#c.......c.#",
  "#..........#",
  "#O.K....K.O#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},sub:"Investigate the Bakery",
  npcs:[N("holly",6,2,{name:"Holly Aster",look:"holly",talk:"holly"}),N("lavender",3,5,{name:"Lavender",look:"kid",talk:"hollyKids"}),N("violet",8,5,{name:"Violet",look:"dani",talk:"hollyKids"})],
  props:[PR("oven",1,1,{name:"Bread Ovens",talk:"bakeryOven"}),PR("cellar",10,7,{name:"Cellar Hatch",talk:"bakeryCellar"})],
  exits:[E(6,8,"village",8,25,"down")]});
room("school","Wickermoor Schoolhouse",[
  "#############",
  "#BB###=###BB#",
  "#...........#",
  "#.T.T.T.T.T.#",
  "#.c.c.c.c.c.#",
  "#.T.T.T.T.T.#",
  "#.c.c.c.c.c.#",
  "#...........#",
  "######.######"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("finneasS",6,2,{name:"Finneas Trout",look:"finneas",talk:"finneasSchool"})],
  props:[PR("chalk",3,1,{name:"Chalkboard",talk:"chalkboard"})],
  exits:[E(6,8,"village",11,24,"down")]});
room("barber","Graham's Barber-Surgery",[
  "############",
  "#SS=M=SSS#V#",
  "#..........#",
  "#.c...c....#",
  "#..........#",
  "#T....,,,,.#",
  "#.....,b,,.#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},sub:"Barber · Surgeon · Moonshiner",
  npcs:[N("randallB",4,2,{name:"Randall Graham",look:"randall",talk:"randallShop"})],
  props:[PR("teethjar",7,1,{name:"A Jar of Teeth",talk:"teethJar"}),PR("still",10,1,{name:"Moonshine Still",talk:"moonshine"})],
  exits:[E(6,8,"village",8,28,"down")]});
room("smithy","The Smithy",[
  "############",
  "#HH#A..KKO.#",
  "#..........#",
  "#.A.....A..#",
  "#..........#",
  "#O........K#",
  "#..........#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},theme:"stone",
  npcs:[N("jean",5,2,{name:"Jean Myriel",look:"jean",talk:"jean"})],
  props:[PR("forge",1,1,{name:"The Forge",talk:"forge"})],
  exits:[E(6,8,"village",8,32,"down")]});
room("townhall","Wickermoor Town Hall",[
  "###############",
  "#BB###=a=###BB#",
  "#.............#",
  "#..,,,,,,,,,..#",
  "#..,T,T,T,T,..#",
  "#..,c,c,c,c,..#",
  "#..,,,,,,,,,..#",
  "#P...........P#",
  "#.............#",
  "#######.#######"],{start:{x:7,y:8,dir:"up"},
  npcs:[N("mayor",7,2,{name:"Mayor Wendel Somerton",look:"mayor",talk:"mayor"}),N("myrtle",11,7,{name:"Myrtle Somerton",look:"villagerD",talk:"myrtle"})],
  props:[PR("charter",2,1,{name:"The Town Charter",talk:"townCharter"})],
  exits:[E(7,9,"village",18,29,"down")]});
room("post","Wickermoor Post Office",[
  "############",
  "#SSSS==SSSS#",
  "#..........#",
  "#K........K#",
  "#..........#",
  "#.P......P.#",
  "#..........#",
  "#..........#",
  "######.#####"],{start:{x:6,y:7,dir:"up"},
  npcs:[N("theodora",5,2,{name:"Theodora Mayville",look:"theodora",talk:"theodora"}),N("geneva",8,2,{name:"Geneva Fairchild",look:"villagerB",talk:"geneva"})],
  props:[PR("cubbies",2,1,{name:"Mail Cubbies",talk:"cubbies"})],
  exits:[E(6,8,"village",22,27,"down")]});
room("taylor","The Taylor Farmhouse",[
  "##########",
  "#S#.....K#",
  "#........#",
  "#.T....b.#",
  "#.c......#",
  "#........#",
  "#O.......#",
  "#####.####"],{start:{x:5,y:6,dir:"up"},dark:.3,amb:"dust",music:"house",sub:"Nobody home. Not in a long time.",
  props:[PR("taylorbed",7,3,{name:"Unmade Bed",talk:"taylorBed"}),PR("taylortable",2,3,{name:"Kitchen Table",talk:"taylorTable"})],
  exits:[E(5,7,"village",24,36,"down")]});

/* ============================ CH.3 THE WYTCHWOOD ====================== */
def("wytchwood",{name:"The Wytchwood",sub:"Ch.3 · The Dead Man and the Marble Finger",art:"wytchwood",theme:"woods",music:"woods",dark:.72,light:3,amb:"wisps",bg:"#050807",
  grid:G(GRIDS.wytchwood),start:{x:7,y:16,dir:"up"},
  npcs:[N("hildaW",8,15,{name:"Hilda Brom",look:"hilda",talk:"hildaWood"}),N("caster",6,13,{name:"A Ghostly Greyhound",look:"caster",talk:"casterJoin",hide:"caster"})],
  props:[PR("bodysite",5,13,{name:"Where the Body Was Found",talk:"bodySite"}),PR("arch",12,9,{name:"Archway in the Brush",talk:"archway"}),
         PR("camp",20,3,{name:"Crude Campsite",talk:"campsite",art:"fire"}),PR("handfx",21,4,{name:"Stick Hand Effigy",talk:"stickHand",hide:"got_handeffigy"}),
         PR("fork",16,12,{name:"A Fork in the Trail",talk:"trailFork"})],
  roam:[{id:"ww1",enc:"wood1",x:15,y:6,look:"mon:Woodwarped"},{id:"ww2",enc:"wood2",x:2,y:10,look:"mon:Crooked_Effigy"},{id:"ww3",enc:"wood3",x:20,y:10,look:"mon:Bathound"},
        {id:"ww4",enc:"kackle",x:11,y:3,look:"mon:Kackle"}],
  exits:[E(7,17,"village",7,1,"down"),E(24,9,"marsh",1,5,"right",{need:"campFound",lock:"Tessie shakes her head. \"The freshest tracks go through the camp. Find the camp.\"",event:"river"})]});
def("marsh",{name:"The Marsh of Hunger",sub:"Ch.3 · Deeper into the woods",art:"marsh",theme:"woods",music:"woods",dark:.6,light:4,amb:"fog",bg:"#06080b",
  grid:G(GRIDS.marsh),start:{x:1,y:5,dir:"right"},
  npcs:[N("haintM",8,6,{name:"Shuffling Figure",look:"mon:Wayward_Haint",talk:"marshHaint",hide:"marshHaintDone",monster:true})],
  props:[PR("graves",20,3,{name:"Ancient Graves",talk:"ancientGraves"}),PR("gate",23,14,{name:"Chained Iron Gate",talk:"ironGate",hot:true,hide:"gateOpen"}),PR("campM",4,14,{name:"Soggy Camp",art:"fire",talk:"restPoint",rest:"marsh"})],
  roam:[{id:"mh1",enc:"haint",x:16,y:9,look:"mon:Wayward_Haint"},{id:"mh2",enc:"haint2",x:12,y:15,look:"mon:Wayward_Haint",need:"marshHaintDone"}],
  exits:[E(0,5,"wytchwood",23,9,"left"),E(24,14,"chapelyard",8,10,"up",{need:"gateOpen",lock:"A chained iron gate blocks the road."})]});
def("chapelyard",{name:"The Chapel of the Hands",sub:"Ch.3 · A clearing, a ruined chapel",theme:"yard",music:"dungeon",dark:.5,light:5,amb:"rain",bg:"#07080b",
  grid:G([
    "ffffffffffffffff",
    "fgggGggggggGgggf",
    "fggg#########ggf",
    "fGgg#:::::::#ggf",
    "fggg#:::::::#gGf",
    "fggg####:####ggf",
    "fgGgggggdggggggf",
    "fgggggggdgggGggf",
    "fggGggggdggggggf",
    "fgggggggdggggggf",
    "fggggggdddgggggf",
    "fffffffdddffffff"]),start:{x:8,y:10,dir:"up"},
  props:[PR("grass",3,7,{name:"Tall Wet Grass",talk:"grassPatch"}),PR("yardgrave",12,7,{name:"Worn Headstone",talk:"yardGrave"})],
  exits:[E(8,11,"marsh",22,14,"down"),E(7,11,"marsh",22,14,"down"),E(9,11,"marsh",22,14,"down"),E(8,5,"chapel",5,7,"up")]});
def("chapel",{name:"Chapel of the Hands",sub:"Three bowls and a big hand",theme:"stone",music:"dungeon",dark:.45,light:5,amb:"dust",bg:"#07060b",
  grid:G([
    "###########",
    "#::::s::::#",
    "#:::::::::#",
    "#:::::::::#",
    "#:::::::::#",
    "#:::::::::#",
    "#:::::::::#",
    "#:::::::::#",
    "#####:#####"]),start:{x:5,y:7,dir:"up"},
  props:[PR("hand",5,1,{name:"The Great Hand",talk:"greatHand"}),PR("bowlL",3,3,{name:"Left Bowl",art:"bowl",talk:"bowl",bowl:"L"}),
         PR("bowlM",5,3,{name:"Middle Bowl",art:"bowl",talk:"bowl",bowl:"M"}),PR("bowlR",7,3,{name:"Right Bowl",art:"bowl",talk:"bowl",bowl:"R"})],
  exits:[E(5,8,"chapelyard",8,6,"down"),E(6,1,"crypt",1,6,"right",{need:"handOpen",hidden:true,lock:"Just the base of the great hand."})]});
def("crypt",{name:"Beneath the Chapel",sub:"Dug into dirt, laid with stone",theme:"crypt",music:"dungeon",dark:.8,light:3,amb:"dust",bg:"#040305",
  grid:G([
    "####################",
    "####################",
    "##########::::::::##",
    "##########:#####::##",
    "##########:#,,,#::##",
    "##########:#,T,#::##",
    "X::::::::::#,,,X::##",
    "##:#######:#,,,#::##",
    "##:#######:#####::##",
    "##:#######::::::::##",
    "##:################:",
    "##::::::::::::::::::",
    "####################",
    "####################"]),start:{x:1,y:6,dir:"right"},
  props:[PR("chalk1",9,5,{name:"Crossroads",talk:"crossroads"}),PR("alchdoor",15,6,{name:"Locked Iron Door",talk:"alchemyDoor",hide:"alchOpen",solid:true}),
         PR("alch",13,5,{name:"Alchemy Table",talk:"alchemyTable"}),PR("herbs",12,4,{name:"Dried Herbs",talk:"alchemyHerbs"}),PR("sap",14,7,{name:"A Bottle of Sap",talk:"magicSap",hide:"got_sap"}),
         PR("restA",12,7,{name:"Quiet Corner",art:"bedroll",talk:"restPoint",rest:"crypt"})],
  exits:[E(0,6,"chapel",5,2,"up"),E(19,11,"temple",1,7,"right",{event:"templeEnter"})]});
def("temple",{name:"The Temple of the Hand",sub:"Smoke, incense, and the handless",art:"temple",theme:"stone",music:"dungeon",dark:.62,light:4,amb:"smoke",bg:"#03050a",
  grid:G(["##########....#.#....#","##########....#.#....#","#########.............","#########..##.....##..","#########.............","#########......#......",
          "......................",".............#...#....","#########.............","#########.............","#########......#......","#########......#......",
          "##########...........#","###########.........##","############.......###","######################"]),
  start:{x:1,y:6,dir:"right"},
  npcs:[N("s1",11,6,{name:"Prostrate Figure",look:"supplicant",talk:"supplicantTalk",hide:"handtakerDone",solid:true,dir:"up"}),N("s2",12,9,{name:"Prostrate Figure",look:"supplicant",talk:"supplicantTalk",hide:"handtakerDone",solid:true,dir:"up"}),
        N("s3",18,9,{name:"Prostrate Figure",look:"supplicant",talk:"supplicantTalk",hide:"handtakerDone",solid:true,dir:"up"}),N("s4",19,6,{name:"Prostrate Figure",look:"supplicant",talk:"supplicantTalk",hide:"handtakerDone",solid:true,dir:"up"}),
        N("boss",15,1,{name:"Something on the Platform",look:"mon:Old_Ways_Chosen",talk:"handtaker",hide:"handtakerDone",monster:true,big:true})],
  props:[PR("altarT",15,11,{name:"Stone Sarcophagus",talk:"sarcophagus"})],
  exits:[E(0,6,"crypt",18,11,"left"),E(0,7,"crypt",18,11,"left")]});

/* ============================ CH.4 THE CROOKED HOUSE ================== */
const HOUSE={theme:"house",music:"house",dark:.5,light:5,amb:"dust",bg:"#07060c",sub:"Ch.4 · The Crooked House"};
def("house1",Object.assign({},HOUSE,{name:"The Crooked House · Ground Floor",art:"house1",
  grid:G(["#####################","#####################","#####.....###########","#####.....###########","#####..##.#.....#####","#####..##.#.....#####",
          "#####.....#.....#####","#####...........#####","#####.....#.....#####","#####.....#..#.######","#####...#.#..#.######","#####.....#..#.######",
          "###...#...#.....#####","##....#...#.#..######","##........#.#...#####","##....#...#.....#####","###...#...#.....#####","########.############",
          "#######...###########","#####################","#####################","#####################","#####################","#####################"]),
  walls:["v 12 8 8","v 12 10 11","v 12 12 14","v 12 16 16","h 12 6 9","h 8 5 8","h 8 12 15","h 12 12 15"],
  start:{x:8,y:16,dir:"up"},
  npcs:[N("petunia",6,3,{name:"Ghost with a Teacup",look:"petunia",talk:"petunia",hide:"got_cup"}),N("cmF1",8,14,{name:"The Crooked Man",look:"crookedman",talk:"crookedMan",need:"cmShow1",hide:"cmGone1"})],
  props:[PR("portraits",6,13,{name:"Portraits (Foyer)",talk:"portraits",noDraw:true}),PR("peacock",2,14,{name:"Marble Peacock",art:"peacock",talk:"peacockStatue",hide:"peacockDone"}),
         PR("busts",3,16,{name:"Dour Busts",talk:"dourBusts"}),PR("ouija",8,10,{name:"Round Table & Spirit Board",talk:"ouija",noDraw:true}),
         PR("roses",7,4,{name:"Rose Bed",talk:"roseBed",noDraw:true}),PR("oven",15,6,{name:"Iron Oven Door",talk:"ovenDoor"}),PR("wineshelf",11,4,{name:"Collapsed Pantry",talk:"pantry"}),
         PR("turkey",13,10,{name:"The Feast",talk:"feastTable",noDraw:true}),PR("harpsichord",15,13,{name:"Harpsichord",talk:"harpsichord",noDraw:true}),PR("mirror",15,15,{name:"Crooked Mirror",talk:"mirror"}),
         PR("restM",13,16,{name:"Music Room Corner",art:"bedroll",talk:"restPoint",rest:"house1",need:"harpDone"})],
  exits:[E(8,17,"village",7,9,"down",{need:"gameDone",lock:"The door won't budge. The house has you now."}),E(9,13,"house2",8,13,"up",{need:"floor2Open",lock:"The stairs creak… and something on the landing whispers 'not yet'. (Find more heirlooms — 3 of 6.)"})]}));
def("house2",Object.assign({},HOUSE,{name:"The Crooked House · Upper Floor",art:"house2",
  grid:G(["#####################","#####################","#####################","#####################","#####################","#####.#.#.#..#.######",
          "#####.....#....######","#######.###.....#####","####............#####","####............#####","####..........#######","####..........#######",
          "###..####.###.#######","##..............#####","##.#............#####","##..............#####","###.............#####","#####################",
          "#####################","#####################","#####################","#####################","#####################","#####################"]),
  walls:["v 6 13 16","v 11 13 16","h 8 12 15"],start:{x:9,y:14,dir:"up"},
  npcs:[N("sally",7,6,{name:"A Small Wooden Doll",look:"sally",talk:"sally",hide:"got_doll"})],
  props:[PR("clock",2,15,{name:"Grandfather Clock",art:"clock",talk:"grandfatherClock",hide:"clockDone"}),PR("bedroom",8,5,{name:"Child-Sized Beds",talk:"childBeds",noDraw:true}),
         PR("toybox",9,6,{name:"Toy Box",art:"chest",talk:"toyBox"}),PR("window",5,6,{name:"The Window",talk:"bedroomWindow"}),
         PR("tub",15,6,{name:"Steamy Bathroom",talk:"bathroom",noDraw:true}),PR("journal",12,10,{name:"Desk & Locked Journal",talk:"lockedJournal"}),
         PR("suitbed",14,11,{name:"Something Under the Sheet",talk:"suitBed",noDraw:true}),PR("balcony",13,12,{name:"Balcony Doors",talk:"balconyDoor"})],
  exits:[E(10,13,"house1",8,13,"down"),E(5,9,"house3",7,10,"up",{need:"floor3Open",lock:"The upper stairs are choked with weasel nests. (Deal with this floor first.)"})]}));
def("house3",Object.assign({},HOUSE,{name:"The Crooked House · Top Floor",art:"house3",
  grid:G(["#####################","#####################","#####################","#####################","#####################","#####.....#.....#####",
          "#####...#.#.....#####","#####.....#.....#####","#####.....#.....#####","#####.....#.....#####","#####...........#####","#####...........#####",
          "#########.###########","######......#...#####","######.......##.#####","######..........#####","##########....#######","#####################",
          "#####################","#####################","#####################","#####################","#####################","#####################"]),
  walls:["h 9 6 9","v 11 5 10","h 11 11 11","h 11 13 15"],start:{x:7,y:10,dir:"right"},
  npcs:[N("baby",8,6,{name:"A Crying Spectral Baby",look:"baby",talk:"crib",hide:"got_bear",solid:true}),N("whisp",11,14,{name:"A Gray Cat",look:"cat",talk:"whisp",hide:"whispGone"}),
        N("cmF3",12,6,{name:"The Crooked Man",look:"crookedman",talk:"crookedMan3",need:"atticReady",hide:"inAttic"})],
  props:[PR("bearT",14,9,{name:"Stuffed Bear",talk:"taxidermyBear"}),PR("trophies",15,6,{name:"Mounted Trophies",talk:"trophies"}),PR("hatch",12,5,{name:"Trapdoor (Ceiling)",talk:"trapdoor",hot:true}),
         PR("lib1",8,12,{name:"Library Shelves",talk:"libraryBooks"}),PR("lib2",14,14,{name:"Reading Desk",talk:"readingDesk"})],
  exits:[E(6,9,"house2",7,9,"down")]}));
def("attic",Object.assign({},HOUSE,{name:"The Attic",art:"attic",dark:.35,music:"boss",sub:"Ch.4 · The Hag in the Attic",
  grid:G(["#####################","#####################","#####################","#####################","#####################","#####################",
          "#####################","#########.....#######","#########.....#######","###########.#########","#########......######","#########......######",
          "#########......######","#########......######","#########......######","#####################",
          "#####################","#####################","#####################","#####################","#####################","#####################","#####################","#####################"]),
  start:{x:10,y:8,dir:"up"},
  npcs:[N("cmA",12,7,{name:"The Crooked Man",look:"crookedman",talk:"crookedManAttic",hide:"runesOpen"}),
        N("adelaA",10,11,{name:"Adela (bound)",look:"adela",talk:"adelaBound",hide:"vesslaDone"}),N("phillipA",12,12,{name:"Phillip (bound)",look:"phillip",talk:"phillipBound",hide:"vesslaDone"}),
        N("figure",13,10,{name:"A Cloaked Figure",look:"alda",talk:"cloakedFigure",hide:"vesslaDone"})],
  props:[PR("runes",11,9,{name:"Runic Door",talk:"runeDoor",hide:"runesOpen",solid:true}),PR("cauldron",11,11,{name:"The Cauldron",talk:"cauldron"})],
  exits:[E(9,7,"house3",11,6,"down")]}));

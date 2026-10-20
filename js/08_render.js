/* ================================ render.js ============================ */
const VW=480, VH=336;
const cv=$("world"), ctx=cv.getContext("2d");ctx.imageSmoothingEnabled=false;
const IMG={}; // decoded asset images
function loadImg(key,src){return new Promise(res=>{const i=new Image();i.onload=()=>{IMG[key]=i;res();};i.onerror=()=>res();i.src=src;});}
async function loadAssets(){
  const A=window.ASSETS||{},jobs=[];
  for(const k in (A.maps||{}))jobs.push(loadImg("map:"+k,A.maps[k]));
  for(const k in (A.por||{}))jobs.push(loadImg("por:"+k,A.por[k]));
  for(const k in (A.mon||{}))jobs.push(loadImg("mon:"+k,A.mon[k]));
  for(const k in (A.pc||{})){jobs.push(loadImg("pc:"+k,A.pc[k].por));jobs.push(loadImg("card:"+k,A.pc[k].card));}
  if(A.hollow)jobs.push(loadImg("hollow",A.hollow));
  if(A.train)jobs.push(loadImg("train_strip",A.train.strip));
  if(A.scene_train)jobs.push(loadImg("scene_train",A.scene_train));
  await Promise.all(jobs);
}
let VSCALE=1;
function sizeCanvas(){
  const vp=$("viewport"),tch=document.body.classList.contains("touch"),w=vp.clientWidth-(tch?8:16),h=vp.clientHeight-16-(tch?176:0);
  VSCALE=Math.min(w/VW,h/VH);VSCALE=VSCALE>=1?Math.floor(VSCALE*4)/4:Math.max(.4,Math.floor(VSCALE*20)/20);
  for(const c of [cv]){c.style.width=(VW*VSCALE)+"px";c.style.height=(VH*VSCALE)+"px";}
  const b=$("bcv");b.style.width=(VW*VSCALE)+"px";b.style.height=(VH*VSCALE)+"px";
  document.documentElement.style.setProperty("--cvh",(VH*VSCALE)+"px");
}
window.addEventListener("resize",sizeCanvas);

/* ---- theme palettes for procedural tiles ---- */
const TH={
  interior:{floor:"#5a3d2a",floor2:"#4d3323",wall:"#2a1d18",wallTop:"#3b2a22",wallFace:"#4a3528",rug:"#6b2130",rug2:"#8a3a3a"},
  stone:{floor:"#4a4650",floor2:"#3d3a44",wall:"#1f1d24",wallTop:"#34313b",wallFace:"#46424e",rug:"#3a2a4a",rug2:"#5a3a6a"},
  crypt:{floor:"#3a342c",floor2:"#2f2a23",wall:"#15120f",wallTop:"#26211b",wallFace:"#3a3128",rug:"#4a2a1a",rug2:"#6a3a1a"},
  station:{floor:"#4a3a2c",floor2:"#3e3024",wall:"#1d2226",wallTop:"#2c3338",wallFace:"#3a4248",rug:"#333",rug2:"#444"},
  yard:{floor:"#4a4650",floor2:"#3d3a44",wall:"#2a2630",wallTop:"#3b3742",wallFace:"#4c4755",rug:"#333",rug2:"#444"},
  house:{floor:"#3a2c34",floor2:"#2f232b",wall:"#140d14",wallTop:"#241821",wallFace:"#33222d",rug:"#4a1a2a",rug2:"#6a2a3a"},
};
function drawTile(c,ch,gx,gy,th){
  const x=gx*T,y=gy*T,h=hash2(gx,gy);
  const floor=()=>{c.fillStyle=(gx+gy)%2?th.floor:th.floor2;c.fillRect(x,y,T,T);c.fillStyle="rgba(0,0,0,.18)";c.fillRect(x,y+((gx%2)?11:5),T,1);
    if(h>.7){c.fillStyle="rgba(255,255,255,.05)";c.fillRect(x+ri(2,18)*0+ (h*20|0),y+(h*17|0),3,1);}};
  switch(ch){
    case ".":case "X":floor();break;
    case ":":c.fillStyle=(gx+gy)%2?th.floor:th.floor2;c.fillRect(x,y,T,T);c.strokeStyle="rgba(0,0,0,.35)";c.strokeRect(x+.5,y+.5,T-1,T-1);
      if(h>.8){c.fillStyle="rgba(0,0,0,.25)";c.fillRect(x+5,y+9,6,2);}break;
    case ",":c.fillStyle=th.rug;c.fillRect(x,y,T,T);c.fillStyle=th.rug2;c.fillRect(x+3,y+3,T-6,T-6);c.fillStyle="rgba(255,220,150,.12)";c.fillRect(x+6,y+6,T-12,2);break;
    case "g":c.fillStyle=h>.5?"#2c3a26":"#27331f";c.fillRect(x,y,T,T);c.fillStyle="#3b4d30";for(let i=0;i<4;i++)c.fillRect(x+((h*97*(i+1))%20|0),y+((h*53*(i+2))%20|0),1,3);break;
    case "d":c.fillStyle=h>.5?"#4a3c2c":"#42362a";c.fillRect(x,y,T,T);c.fillStyle="rgba(0,0,0,.2)";c.fillRect(x+(h*18|0),y+(h*14|0),3,2);break;
    case "p":c.fillStyle="#4a3a2a";c.fillRect(x,y,T,T);c.fillStyle="#3a2c20";for(let i=0;i<T;i+=6)c.fillRect(x,y+i,T,1);c.fillStyle="#5a4632";c.fillRect(x+(gy%2?4:14),y,1,T);break;
    case "~":c.fillStyle="#0e1a1c";c.fillRect(x,y,T,T);break;
    case "R":c.fillStyle="#1a1a1c";c.fillRect(x,y,T,T);c.fillStyle="#4a3a2a";for(let i=2;i<T;i+=8)c.fillRect(x+i,y,4,T);c.fillStyle="#7a7f88";c.fillRect(x,y+(gy%2?4:18),T,2);break;
    case "#":{c.fillStyle=th.wall;c.fillRect(x,y,T,T);c.fillStyle=th.wallTop;c.fillRect(x+1,y+1,T-2,T-2);
      c.fillStyle="rgba(0,0,0,.25)";c.fillRect(x+(gy%2?6:16),y+2,1,T-4);
      const below=curMap().grid[gy+1];if(below&&below[gx]&&".,:XpgdLn".includes(below[gx])){c.fillStyle=th.wallFace;c.fillRect(x,y+T-9,T,9);c.fillStyle="rgba(0,0,0,.3)";c.fillRect(x,y+T-9,T,1);
        c.fillStyle="rgba(255,255,255,.06)";c.fillRect(x+(gx%3)*7,y+T-7,4,5);}break;}
    case "t":c.fillStyle="#0c1410";c.fillRect(x,y,T,T);c.fillStyle="#1a2a1c";c.beginPath();c.arc(x+12,y+12,11,0,7);c.fill();c.fillStyle="#24382a";c.beginPath();c.arc(x+9,y+9,6,0,7);c.fill();break;
    case "f":floor2(c,x,y,"#2c3a26");c.fillStyle="#1a1a1e";c.fillRect(x,y+8,T,2);c.fillRect(x,y+16,T,2);for(let i=2;i<T;i+=6){c.fillRect(x+i,y+3,2,17);c.fillRect(x+i,y+1,2,2);}break;
    case "G":floor2(c,x,y,"#2c3a26");c.fillStyle="#6a6a72";c.fillRect(x+6,y+5,12,15);c.beginPath();c.arc(x+12,y+6,6,Math.PI,0);c.fill();c.fillStyle="#4a4a52";c.fillRect(x+8,y+10,8,1);c.fillRect(x+9,y+13,6,1);break;
    default: floor();drawFurniture(c,ch,x,y,th,h);
  }
}
function floor2(c,x,y,col){c.fillStyle=col;c.fillRect(x,y,T,T);}
function drawFurniture(c,ch,x,y,th,h){
  const W=(col,xx,yy,ww,hh)=>{c.fillStyle=col;c.fillRect(x+xx,y+yy,ww,hh);};
  switch(ch){
    case "B":W("#2a1a12",0,0,24,24);W("#3a2618",1,1,22,22);[3,10,17].forEach((yy,i)=>{W("#1a100a",2,yy+5,20,2);for(let k=0;k<6;k++)W(["#7a2a2a","#2a4a6a","#6a5a2a","#3a5a3a","#5a3a5a","#8a6a3a"][(k+i+(h*9|0))%6],3+k*3,yy,2,5);});break;
    case "S":W("#2a1a12",0,0,24,24);W("#3a2618",1,1,22,22);[4,12].forEach(yy=>{W("#1a100a",2,yy+6,20,2);for(let k=0;k<5;k++){W(["#5a8a6a","#8a4a4a","#6a6aa0","#a08a4a","#4a8a8a"][(k+(h*7|0))%5],3+k*4,yy+1,3,5);W("rgba(255,255,255,.3)",3+k*4,yy+1,1,2);}});break;
    case "=":W("#2a1a12",0,6,24,18);W("#6a4a30",0,4,24,6);W("#8a6440",0,4,24,2);W("rgba(0,0,0,.3)",0,20,24,4);break;
    case "T":W("rgba(0,0,0,.3)",3,18,19,4);W("#5a3a24",2,5,20,13);W("#7a5434",2,5,20,3);W("#3a2414",4,17,2,5);W("#3a2414",18,17,2,5);if(h>.5){W("#d8d0b8",8,8,6,4);}else{W("#b8a060",10,8,3,4);}break;
    case "c":W("#4a2e1c",7,4,10,5);W("#5a3a24",7,9,10,8);W("#3a2414",8,17,2,4);W("#3a2414",14,17,2,4);break;
    case "b":W("#3a2414",1,1,22,22);W("#d8d0c0",3,2,18,7);W(th.rug2,3,9,18,13);W("rgba(0,0,0,.2)",3,9,18,2);break;
    case "F":W("#2a2a2e",0,0,24,24);W("#3a3a42",2,2,20,20);W("#120a08",5,8,14,14);{const f=(Date.now()/120|0)%3;W("#e8742a",7,14-f,10,8+f);W("#ffd060",10,17,4,5);}break;
    case "O":W("rgba(0,0,0,.3)",4,18,16,5);W("#6a4424",5,3,14,18);W("#4a2e18",5,6,14,2);W("#4a2e18",5,15,14,2);W("#8a5a30",7,3,10,2);break;
    case "K":W("rgba(0,0,0,.3)",3,18,19,5);W("#7a5a34",3,4,18,16);W("#5a3e22",3,4,18,2);W("#5a3e22",11,4,2,16);W("#5a3e22",3,11,18,2);break;
    case "P":W("#6a3a24",7,14,10,8);W("#2c5a2e",4,3,16,12);W("#3a7a3e",7,5,8,6);break;
    case "A":W("rgba(0,0,0,.3)",3,18,18,4);W("#2a2a30",4,8,16,6);W("#3a3a44",2,6,20,4);W("#1a1a1e",8,14,8,7);break;
    case "H":W("#3a2020",0,0,24,24);W("#1a0c0a",3,6,18,16);{const f=(Date.now()/100|0)%3;W("#ff6a2a",5,14-f,14,8+f);W("#ffd060",9,17,6,5);}break;
    case "M":W("#8a7a60",10,2,4,4);W("#c8b898",7,6,10,10);W("#5a4a3a",11,16,2,7);break;
    case "n":W("#4a2e1c",1,6,22,5);W("#5a3a24",1,11,22,6);W("#3a2414",2,17,2,5);W("#3a2414",20,17,2,5);break;
    case "a":W("#6a6470",2,6,20,16);W("#8a8490",2,6,20,3);W("#d8c070",10,2,4,6);break;
    case "s":W("rgba(0,0,0,.35)",4,19,16,4);W("#8a8894",8,1,8,8);W("#9a98a4",6,9,12,11);W("#6a6874",6,19,12,3);break;
    case "r":W("#4a4650",3,12,8,8);W("#5a5660",12,8,9,11);W("#3a3640",6,18,14,4);break;
    case "k":W("#3a2418",4,1,16,22);W("#4a3020",6,3,12,18);W("#8a7a50",11,8,2,8);W("#8a7a50",8,11,8,2);break;
    case "C":W("#1a1a1e",3,8,18,14);W("#2a2a30",2,7,20,4);W("#3a8a4a",5,8,14,3);break;
    case "o":W("#6a3a2a",0,0,24,24);W("#5a2e22",2,2,20,20);W("#1a0c08",5,10,14,10);W("#8a5a4a",2,2,20,3);break;
    case "V":W("#c8c8d0",3,6,18,14);W("#a8a8b0",5,8,14,10);break;
    case "W":W(th.wall,0,0,24,24);W("#2a3a5a",4,6,16,12);W("#4a6a9a",5,7,6,5);W("#4a6a9a",13,7,6,5);break;
    case "L":W("#1a1a1a",11,4,2,19);W("#3a3a3a",8,2,8,4);W("#9fe0b0",9,3,6,2);break;
    case "Z":W("#5a5660",4,6,16,16);W("#0a0a10",7,9,10,10);W("#3a2a1a",3,3,18,3);break;
    case "Y":W("#2a2018",10,6,4,17);W("#2a2018",5,8,6,2);W("#2a2018",13,4,7,2);break;
    case "h":W("#b89a4a",2,6,20,14);W("#8a7030",2,6,20,3);break;
  }
}

/* ---- sprite painter: chibi 16x22 figures in a 24 cell ---- */
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x|0,y|0,w,h);}
function drawChar(c,x,y,look,dir,frame,opt){
  opt=opt||{};look=look||{};
  if(typeof look==="string"&&look.startsWith("mon:")){drawMonSprite(c,x,y,look.slice(4),opt);return;}
  if(typeof look==="string")look=LOOK[look]||{};
  const k=look.kind||"human";
  const ghost=look.ghost||opt.ghost;
  const t=performance.now();
  const bob=(opt.moving?0:Math.round(Math.sin(t/380+(opt.seed||0))*.6));
  const X=x+4,Y=y+1+bob;
  c.save();
  if(ghost){c.globalAlpha=.72+Math.sin(t/300+(opt.seed||0))*.12;}
  // shadow
  {const sc=SHADOW_C||c;if(!ghost){sc.fillStyle="rgba(0,0,0,.5)";sc.beginPath();sc.ellipse(x+12,y+22,8,3,0,0,7);sc.fill();}
  else{sc.fillStyle="rgba(120,255,200,.16)";sc.beginPath();sc.ellipse(x+12,y+22,8,3,0,0,7);sc.fill();}}
  const step=opt.moving?(frame%2):0;
  const facing=dir||"down";
  if(k==="frog"){drawFrog(c,X,Y,look,facing,step);}
  else if(k==="scarecrow"){drawPC(c,X,Y,"scarecrow",facing,step);}
  else if(k==="skeleton"){drawPC(c,X,Y,"skeleton",facing,step);}
  else if(k==="doll"&&!look.small){drawPC(c,X,Y,"doll",facing,step);}
  else if(k==="monk"){drawPC(c,X,Y,"monk",facing,step);}
  else if(k==="deepborn"){drawPC(c,X,Y,"deepborn",facing,step);}
  else if(k==="crooked"){drawCrooked(c,x,y,t);}
  else if(k==="cat"){px(c,X+3,Y+14,10,6,"#6a6a72");px(c,X+10,Y+10,6,6,"#6a6a72");px(c,X+10,Y+9,2,2,"#6a6a72");px(c,X+14,Y+9,2,2,"#6a6a72");px(c,X+11,Y+12,1,1,"#ffd84a");px(c,X+14,Y+12,1,1,"#ffd84a");px(c,X+1,Y+11,2,8,"#6a6a72");}
  else if(k==="dog"){c.globalAlpha=.7;px(c,X+1,Y+11,13,5,"#cfe8f0");px(c,X+12,Y+7,5,6,"#cfe8f0");px(c,X+15,Y+10,3,2,"#cfe8f0");px(c,X+2,Y+16,2,5,"#cfe8f0");px(c,X+11,Y+16,2,5,"#cfe8f0");px(c,X-1,Y+9,3,2,"#cfe8f0");px(c,X+14,Y+9,1,1,"#223");}
  else if(k==="goat"){px(c,X+2,Y+12,11,6,"#e8e0d0");px(c,X+11,Y+8,5,6,"#e8e0d0");px(c,X+12,Y+6,1,3,"#8a7a60");px(c,X+15,Y+6,1,3,"#8a7a60");px(c,X+3,Y+18,2,4,"#8a7a60");px(c,X+10,Y+18,2,4,"#8a7a60");px(c,X+14,Y+10,1,1,"#222");
    if(!hasF("goatFree")){c.fillStyle="#7a6a4a";c.fillRect(X-1,Y+2,18,20);c.fillStyle="#5a4a3a";c.fillRect(X-1,Y+8,18,2);c.fillRect(X+6,Y+2,2,20);}}
  else if(k==="baby"){c.globalAlpha=.75;px(c,X+3,Y+10,10,9,"#cfeff0");px(c,X+4,Y+5,8,7,"#dff8f8");px(c,X+6,Y+8,1,1,"#224");px(c,X+9,Y+8,1,1,"#224");px(c,X+7,Y+10,2,1,"#224");}
  else if(k==="weasel"){const s=look.big?1.3:1;px(c,X+1,Y+14,12*s,5,"#8a5a3a");px(c,X+11,Y+11,5,5,"#8a5a3a");px(c,X+13,Y+12,1,1,"#ff3a3a");px(c,X-2,Y+13,4,2,"#8a5a3a");px(c,X+12,Y+15,4,2,"#e8d0b0");}
  else if(k==="tiger"){c.globalAlpha=.7;px(c,X-4,Y+10,20,8,"#8ff0e0");px(c,X+12,Y+5,8,8,"#8ff0e0");for(let i=0;i<5;i++)px(c,X-2+i*4,Y+10,1,8,"#2a8a80");px(c,X+14,Y+8,1,1,"#023");px(c,X+17,Y+8,1,1,"#023");px(c,X-7,Y+9,4,2,"#8ff0e0");px(c,X-3,Y+18,2,4,"#8ff0e0");px(c,X+10,Y+18,2,4,"#8ff0e0");}
  else if(k==="doll"){px(c,X+5,Y+10,6,8,"#b8905a");px(c,X+5,Y+5,6,6,"#d8b07a");px(c,X+6,Y+7,1,1,"#222");px(c,X+9,Y+7,1,1,"#222");px(c,X+4,Y+4,8,2,"#5a3a1a");}
  else if(k==="supplicant"){px(c,X,Y+11,16,9,"#3a2e3a");px(c,X+3,Y+8,10,5,"#2a222a");px(c,X+1,Y+19,14,2,"#1a141a");}
  else drawHuman(c,X,Y,look,facing,step);
  c.restore();
}
function drawHuman(c,X,Y,L,dir,step){
  const skin=L.skin||"#e8c09c",hair=L.hair||"#3a2a1a",top=L.top||"#4a4a5a",bot=L.bottom||"#2a2a3a";
  const tall=L.tall?-2:0,child=L.child?4:0,wide=L.wide?1:0;
  const hy=Y+tall+child;
  // legs
  if(!L.dress&&!L.wheel){px(c,X+4-wide,Y+17,3,4+(step?1:0),bot);px(c,X+9+wide,Y+17,3,4+(step?0:1),bot);px(c,X+4-wide,Y+20+(step?1:0),3,1,"#1a1410");px(c,X+9+wide,Y+20+(step?0:1),3,1,"#1a1410");}
  if(L.wheel){px(c,X,Y+15,16,6,"#4a3a2a");c.strokeStyle="#2a1f14";c.beginPath();c.arc(X+3,Y+19,3,0,7);c.stroke();c.beginPath();c.arc(X+13,Y+19,3,0,7);c.stroke();}
  // body
  const by=hy+10;
  if(L.dress){c.fillStyle=top;c.beginPath();c.moveTo(X+4,by);c.lineTo(X+12,by);c.lineTo(X+15,Y+21);c.lineTo(X+1,Y+21);c.fill();}
  else px(c,X+3-wide,by,10+wide*2,8-child/2,top);
  if(L.stripe){for(let i=0;i<4;i++)px(c,X+3,by+1+i*2,10,1,"rgba(255,255,255,.35)");}
  if(L.apron)px(c,X+5,by+2,6,7,L.apron);
  if(L.scarf)px(c,X+4,by,8,2,L.scarf);
  // arms
  const sw=step?1:0;px(c,X+1-wide,by+1+sw,2,6,top);px(c,X+13+wide,by+1+(1-sw),2,6,top);px(c,X+1-wide,by+7+sw,2,1,skin);px(c,X+13+wide,by+7+(1-sw),2,1,skin);
  if(L.cane)px(c,X+15,by+2,1,10,"#c8c8d0");
  if(L.pipe)px(c,X+12,hy+7,3,1,"#5a3a1a");
  // head
  px(c,X+4,hy+1,8,9,skin);
  // hair
  const hs=L.hairStyle;
  if(hs==="long"){px(c,X+3,hy,10,3,hair);px(c,X+3,hy+2,2,10,hair);px(c,X+11,hy+2,2,10,hair);}
  else if(hs==="bun"){px(c,X+4,hy,8,3,hair);px(c,X+6,hy-2,4,3,hair);}
  else if(hs==="braid"){px(c,X+4,hy,8,3,hair);px(c,X+3,hy+2,1,3,hair);px(c,X+12,hy+2,2,9,hair);}
  else if(hs==="wild"){px(c,X+2,hy-1,12,4,hair);px(c,X+2,hy+2,2,4,hair);px(c,X+12,hy+2,2,4,hair);}
  else if(hs==="bob"){px(c,X+3,hy,10,3,hair);px(c,X+3,hy+2,2,6,hair);px(c,X+11,hy+2,2,6,hair);}
  else if(hs==="curly"){px(c,X+3,hy-1,10,4,hair);px(c,X+2,hy+2,3,5,hair);px(c,X+11,hy+2,3,5,hair);}
  else if(hs!=="bald"){px(c,X+4,hy,8,3,hair);px(c,X+4,hy+2,1,2,hair);px(c,X+11,hy+2,1,2,hair);}
  if(dir==="up"){px(c,X+4,hy+1,8,7,hair);}
  // face
  if(dir!=="up"){const ex=dir==="left"?-1:dir==="right"?1:0;
    if(L.glasses){px(c,X+5+ex,hy+4,3,2,"#ddd");px(c,X+9+ex,hy+4,3,2,"#ddd");}
    px(c,X+6+ex,hy+5,1,1,"#1a1010");px(c,X+10+ex,hy+5,1,1,"#1a1010");
    if(L.mustache)px(c,X+5+ex,hy+7,6,1,hair==="#999"?"#aaa":hair);
    if(L.beard)px(c,X+4,hy+6,8,4,L.beard);}
  // hats
  const hc=L.hatCol||"#222";
  if(L.hat==="top"){px(c,X+3,hy,10,2,hc);px(c,X+5,hy-5,6,6,hc);}
  else if(L.hat==="wide"){px(c,X+1,hy,14,2,hc);px(c,X+4,hy-3,8,4,hc);}
  else if(L.hat==="cap"){px(c,X+4,hy-1,8,3,hc);px(c,X+(dir==="left"?1:9),hy+1,6,1,hc);}
  else if(L.hat==="bonnet"){px(c,X+3,hy-1,10,5,hc);px(c,X+2,hy+2,2,5,hc);px(c,X+12,hy+2,2,5,hc);}
  else if(L.hat==="jester"){px(c,X+3,hy-1,10,3,hc);px(c,X+1,hy-4,4,4,hc);px(c,X+11,hy-4,4,4,hc);px(c,X+1,hy-5,2,2,"#ff5");px(c,X+13,hy-5,2,2,"#ff5");}
  if(L.feather)px(c,X+12,hy-3,1,5,"#c8a040");
  if(L.pigeon){px(c,X+12,by-3,4,3,"#8a8a98");px(c,X+15,by-3,1,1,"#e84");}
  if(L.paint){px(c,X+5,by+3,2,2,"#c33");px(c,X+9,by+5,2,1,"#39c");}
}
function drawFrog(c,X,Y,L,dir,step){
  px(c,X+4,Y+17,3,4,"#2a3a1a");px(c,X+9,Y+17,3,4,"#2a3a1a");
  px(c,X+2,Y+9,12,9,L.top);px(c,X+6,Y+10,4,8,"#c8b890");
  px(c,X+3,Y+1,10,9,"#7aa04a");px(c,X+3,Y,4,3,"#8ab85a");px(c,X+9,Y,4,3,"#8ab85a");
  px(c,X+4,Y+1,2,2,"#ffe890");px(c,X+10,Y+1,2,2,"#ffe890");px(c,X+5,Y+1,1,1,"#111");px(c,X+10,Y+1,1,1,"#111");
  px(c,X+4,Y+7,8,1,"#3a5020");px(c,X+2,Y-3,12,2,L.hatCol);px(c,X+4,Y-7,8,5,L.hatCol);
  px(c,X-1,Y+8,3,9,"#6a3a1a");px(c,X-1,Y+6,1,3,"#3a2010"); // fiddle on back
}
function drawCrooked(c,x,y,t){
  c.save();c.globalAlpha=.85;
  const sway=Math.sin(t/250)*2;
  c.fillStyle="#0c0a10";c.beginPath();c.moveTo(x+6,y+23);c.lineTo(x+9+sway,y+4);c.lineTo(x+15+sway,y+2);c.lineTo(x+13,y+12);c.lineTo(x+19,y+23);c.fill();
  c.fillStyle="#d8d0c0";c.fillRect(x+10+sway,y-3,6,6);c.fillStyle="#000";c.fillRect(x+11+sway,y-1,1,1);c.fillRect(x+14+sway,y-1,1,1);
  c.fillStyle="#0c0a10";c.fillRect(x+8+sway,y-7,9,3);c.fillRect(x+10+sway,y-14,5,8);
  c.restore();
}
function drawPC(c,X,Y,kind,dir,step){
  const lg=(col,s)=>{px(c,X+4,Y+17,3,4+(s?1:0),col);px(c,X+9,Y+17,3,4+(s?0:1),col);};
  const face=(ex,col)=>{if(dir==="up")return;const o=dir==="left"?-1:dir==="right"?1:0;px(c,X+6+o,Y+5,1,1,col);px(c,X+9+o,Y+5,1,1,col);};
  if(kind==="scarecrow"){ // Azareth: pumpkin head, straw hat, tattered cloak
    lg("#6a4a2a",step);px(c,X+2,Y+10,12,8,"#5a3e22");px(c,X+2,Y+16,12,2,"#4a321a");px(c,X+1,Y+11,2,6,"#5a3e22");px(c,X+13,Y+11,2,6,"#5a3e22");
    px(c,X,Y+15,2,2,"#d8b04a");px(c,X+14,Y+15,2,2,"#d8b04a");px(c,X+7,Y+10,2,7,"#d8b04a");
    px(c,X+3,Y+1,10,9,"#e0782a");px(c,X+5,Y+1,1,9,"#c8641c");px(c,X+10,Y+1,1,9,"#c8641c");
    if(dir!=="up"){const o=dir==="left"?-1:dir==="right"?1:0;const gl=(Date.now()/200|0)%2?"#ffe060":"#ffc030";px(c,X+5+o,Y+4,2,2,gl);px(c,X+9+o,Y+4,2,2,gl);px(c,X+5+o,Y+7,6,1,gl);}
    px(c,X,Y,16,2,"#b8923a");px(c,X+4,Y-4,8,5,"#b8923a");px(c,X+4,Y-1,8,1,"#6a2a1a");}
  else if(kind==="skeleton"){ // Lucky: skull, tricorn, red coat
    lg("#e8e0d0",step);px(c,X+2,Y+10,12,8,"#8a2020");px(c,X+6,Y+10,4,8,"#e8e0d0");px(c,X+7,Y+11,2,1,"#aaa");px(c,X+7,Y+13,2,1,"#aaa");
    px(c,X+1,Y+11,2,6,"#8a2020");px(c,X+13,Y+11,2,6,"#8a2020");px(c,X+1,Y+17,2,1,"#e8e0d0");px(c,X+13,Y+17,2,1,"#e8e0d0");
    px(c,X+4,Y+1,8,9,"#efe8d8");if(dir!=="up"){const o=dir==="left"?-1:dir==="right"?1:0;px(c,X+5+o,Y+4,2,2,"#111");px(c,X+9+o,Y+4,2,2,"#111");px(c,X+7+o,Y+6,2,1,"#333");px(c,X+5+o,Y+8,6,1,"#555");}
    px(c,X+1,Y,14,2,"#1a1410");px(c,X+4,Y-3,8,4,"#1a1410");px(c,X+1,Y-1,2,2,"#1a1410");px(c,X+13,Y-1,2,2,"#1a1410");px(c,X+6,Y-2,4,1,"#d9a441");
    px(c,X+14,Y+13,3,2,"#444");}
  else if(kind==="doll"){ // Poppi: porcelain, red hair, crimson dress, joints
    c.fillStyle="#9a1a2a";c.beginPath();c.moveTo(X+4,Y+10);c.lineTo(X+12,Y+10);c.lineTo(X+15,Y+20);c.lineTo(X+1,Y+20);c.fill();px(c,X+5,Y+20,2,2,"#f0e8e0");px(c,X+9,Y+20,2,2,"#f0e8e0");
    px(c,X+1,Y+11,2,6,"#f0e8e0");px(c,X+13,Y+11,2,6,"#f0e8e0");px(c,X+1,Y+13,2,1,"#b8a8a0");px(c,X+13,Y+13,2,1,"#b8a8a0");
    px(c,X+4,Y+1,8,9,"#f4ece6");px(c,X+3,Y,10,3,"#c8384a");px(c,X+2,Y+2,2,9,"#c8384a");px(c,X+12,Y+2,2,9,"#c8384a");
    if(dir==="up")px(c,X+4,Y+1,8,8,"#c8384a");else{const o=dir==="left"?-1:dir==="right"?1:0;px(c,X+5+o,Y+5,2,2,"#4a1a2a");px(c,X+9+o,Y+5,2,2,"#4a1a2a");px(c,X+7+o,Y+8,2,1,"#c8384a");}
    px(c,X+7,Y+9,2,1,"#b8a8a0");}
  else if(kind==="monk"){ // Krodha: green hood & robe
    lg("#3a2a1a",step);px(c,X+2,Y+9,12,10,"#2e5a34");px(c,X+2,Y+14,12,1,"#c8a860");px(c,X+1,Y+11,2,6,"#2e5a34");px(c,X+13,Y+11,2,6,"#2e5a34");
    px(c,X+3,Y,10,10,"#24482a");px(c,X+5,Y+3,6,6,"#d8b890");
    if(dir==="up")px(c,X+5,Y+3,6,6,"#24482a");else{const o=dir==="left"?-1:dir==="right"?1:0;px(c,X+6+o,Y+5,1,1,"#111");px(c,X+9+o,Y+5,1,1,"#111");px(c,X+5+o,Y+4,2,1,"#a8785a");px(c,X+7+o,Y+7,2,1,"#8a5a4a");}
    px(c,X+13,Y+14,3,4,"#a8784a");}
  else if(kind==="deepborn"){ // Tessie: teal skin, fins, green cloak, bow
    lg("#2a3a3a",step);px(c,X+2,Y+10,12,8,"#2a5a4a");px(c,X+1,Y+10,2,9,"#1e4438");px(c,X+13,Y+10,2,9,"#1e4438");
    px(c,X+4,Y+1,8,9,"#5ab8c8");px(c,X+2,Y+3,2,4,"#3a98a8");px(c,X+12,Y+3,2,4,"#3a98a8");px(c,X+4,Y,8,2,"#2a6a78");
    if(dir==="up")px(c,X+4,Y+1,8,7,"#2a6a78");else{const o=dir==="left"?-1:dir==="right"?1:0;px(c,X+5+o,Y+5,2,1,"#ffffff");px(c,X+9+o,Y+5,2,1,"#ffffff");px(c,X+6+o,Y+5,1,1,"#023");px(c,X+10+o,Y+5,1,1,"#023");}
    c.strokeStyle="#8a6a3a";c.beginPath();c.arc(X+1,Y+12,6,-1.2,1.2);c.stroke();}
}
function drawMonSprite(c,x,y,key,opt){
  const im=IMG["mon:"+key]||IMG["por:"+key];const t=performance.now();
  const H=opt.big?44:30,bob=Math.sin(t/300+(opt.seed||0))*1.5;
  {const sc=SHADOW_C||c;sc.fillStyle="rgba(0,0,0,.5)";sc.beginPath();sc.ellipse(x+12,y+22,9,3,0,0,7);sc.fill();}
  if(!im){px(c,x+6,y+4,12,18,"#523");return;}
  const s=H/Math.max(im.width,im.height);const w=im.width*s,h=im.height*s;
  c.save();smooth(c,true);c.drawImage(im,x+12-w/2,y+22-h+bob,w,h);c.restore();
}

/* ---- props ---- */
function drawProp(c,p,t){
  const x=p.x*T,y=p.y*T;const a=p.art;
  if(a==="jar"){const g=.6+Math.sin(t/300+p.x)*.3;px(c,x+11,y,2,6,"#2a2a2a");px(c,x+7,y+6,10,12,"#1a2a24");c.fillStyle=`rgba(120,255,180,${g})`;c.fillRect(x+8,y+8,8,9);px(c,x+7,y+5,10,2,"#3a3a3a");}
  else if(a==="fire"){px(c,x+4,y+17,16,4,"#3a2a1a");const f=(t/120|0)%3;c.fillStyle="#e8742a";c.beginPath();c.moveTo(x+6,y+18);c.lineTo(x+12,y+4+f);c.lineTo(x+18,y+18);c.fill();c.fillStyle="#ffd060";c.beginPath();c.moveTo(x+9,y+18);c.lineTo(x+12,y+10+f);c.lineTo(x+15,y+18);c.fill();}
  else if(a==="sign"){px(c,x+11,y+10,2,13,"#3a2a1a");px(c,x+3,y+3,18,9,"#6a4a2a");px(c,x+5,y+6,14,1,"#2a1a0a");px(c,x+5,y+8,10,1,"#2a1a0a");}
  else if(a==="board"){px(c,x+2,y+2,20,15,"#5a3e22");px(c,x+4,y+4,16,11,"#c8b890");px(c,x+5,y+5,6,4,"#f0e8d0");px(c,x+12,y+6,6,5,"#e8d8b0");px(c,x+7,y+10,5,4,"#f0e0c0");px(c,x+4,y+17,2,6,"#3a2a1a");px(c,x+18,y+17,2,6,"#3a2a1a");}
  else if(a==="lamp"){px(c,x+11,y+4,2,19,"#1a1a1a");px(c,x+8,y+1,8,5,"#2a2a2a");px(c,x+9,y+2,6,3,"#9fe0b0");}
  else if(a==="well"){px(c,x+3,y+8,18,14,"#5a5660");px(c,x+6,y+10,12,8,"#0a0a10");px(c,x+2,y+2,20,3,"#4a3020");px(c,x+3,y+2,2,9,"#4a3020");px(c,x+19,y+2,2,9,"#4a3020");}
  else if(a==="mailbox"){px(c,x+11,y+12,2,11,"#2a2a2a");px(c,x+6,y+4,12,9,"#8a2a2a");px(c,x+6,y+4,12,2,"#aa3a3a");}
  else if(a==="bed"){drawFurniture(c,"b",x,y,TH.interior,0);}
  else if(a==="bowl"){const k="bowl"+p.bowl,up=hasF(k);px(c,x+9,y+(up?4:10),6,up?16:10,"#6a6470");px(c,x+5,y+(up?2:8),14,4,"#8a8490");if(up)px(c,x+7,y+2,10,2,k==="bowlM"?"#4a8ac8":k==="bowlL"?"#4a8a3a":"#ffb040");}
  else if(a==="peacock"){px(c,x+6,y+12,12,9,"#c8c8d0");px(c,x+10,y+4,4,9,"#d8d8e0");px(c,x+12,y+4,4,3,"#d8d8e0");px(c,x+13,y+5,1,1,"#c02020");
    for(let i=0;i<5;i++)px(c,x+1+i*3,y+2+Math.abs(2-i),2,11,"#a8a8b8");}
  else if(a==="clock"){px(c,x+6,y-6,12,28,"#3a2214");px(c,x+8,y-4,8,8,"#d8d0b0");const an=t/80;c.strokeStyle="#111";c.beginPath();c.moveTo(x+12,y);c.lineTo(x+12+Math.cos(an)*3,y+Math.sin(an)*3);c.stroke();px(c,x+11,y+7,2,10,"#b8903a");}
  else if(a==="chest"){drawFurniture(c,"K",x,y,TH.interior,0);px(c,x+10,y+10,4,3,"#d8b040");}
  else if(a==="bedroll"){px(c,x+2,y+8,20,10,"#5a4a3a");px(c,x+2,y+8,6,10,"#8a7a5a");}
  else if(a==="stove"){px(c,x+2,y+4,20,18,"#2a2a30");px(c,x+4,y+10,16,8,"#1a0a08");px(c,x+6,y+12,12,4,"#e8742a");}
  else if(a==="phonograph"){px(c,x+6,y+14,12,8,"#5a3a24");px(c,x+11,y+8,2,7,"#c8a040");c.fillStyle="#d8b050";c.beginPath();c.moveTo(x+12,y+9);c.lineTo(x+4,y+1);c.lineTo(x+14,y+1);c.fill();}
  else if(a==="table"){drawFurniture(c,"T",x,y,TH.interior,.2);}
}
/* ---- procedural monster art for battles (wolf, peacock, feast, clock…) ---- */
const PROC_ART={};
function procArt(key){
  if(PROC_ART[key])return PROC_ART[key];
  const c2=document.createElement("canvas");c2.width=120;c2.height=120;const c=c2.getContext("2d");
  const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  if(key==="wolf"){P(20,50,60,26,"#6a6a78");P(70,34,28,24,"#6a6a78");P(92,44,14,8,"#5a5a68");P(74,26,6,10,"#5a5a68");P(86,26,6,10,"#5a5a68");P(88,40,4,4,"#ffd040");P(100,50,6,3,"#eee");
    P(24,74,8,24,"#5a5a68");P(40,74,8,24,"#5a5a68");P(60,74,8,24,"#5a5a68");P(72,74,8,24,"#5a5a68");P(4,46,20,8,"#6a6a78");P(30,52,40,6,"#7a7a88");}
  else if(key==="supplicant"){P(20,60,80,40,"#3a2e3a");P(40,40,40,30,"#2a222a");P(46,48,28,16,"#1a141a");P(14,86,20,10,"#3a2e3a");P(86,86,20,10,"#3a2e3a");P(20,96,12,6,"#5a3a3a");P(88,96,12,6,"#5a3a3a");}
  else if(key==="peacock"){for(let i=0;i<9;i++){c.fillStyle=i%2?"#b8b8c8":"#a0a0b4";c.beginPath();c.ellipse(60,70,10,52,(i-4)*.32,0,7);c.fill();c.fillStyle="#7a7a90";c.beginPath();c.arc(60+Math.sin((i-4)*.32)*44,70-Math.cos((i-4)*.32)*44,5,0,7);c.fill();}
    P(46,60,28,40,"#d8d8e4");P(54,26,12,40,"#e0e0ea");P(58,20,16,12,"#e0e0ea");P(72,24,8,4,"#c8a040");P(64,24,4,4,"#c01818");P(48,100,24,8,"#8a8898");}
  else if(key==="feast"){P(20,50,80,50,"#b8783a");P(26,56,68,10,"#d8984a");P(10,70,20,30,"#c8884a");P(90,70,20,30,"#c8884a");P(30,70,60,20,"#3a0a0a");for(let i=0;i<8;i++)P(34+i*7,70,4,8,"#f0e8d0");P(40,40,40,14,"#e8e0d0");P(56,80,10,6,"#ffd040");}
  else if(key==="tablecloth"){c.fillStyle="rgba(230,230,240,.9)";c.beginPath();c.moveTo(20,20);c.quadraticCurveTo(60,0,100,20);c.lineTo(110,100);c.lineTo(90,90);c.lineTo(75,104);c.lineTo(60,92);c.lineTo(45,104);c.lineTo(30,90);c.lineTo(10,100);c.fill();
    P(44,40,8,10,"#111");P(68,40,8,10,"#111");P(52,62,16,6,"#111");c.strokeStyle="#c83a4a";for(let i=0;i<5;i++){c.beginPath();c.moveTo(20,30+i*16);c.lineTo(100,30+i*16);c.stroke();}}
  else if(key==="clock"){P(34,4,52,112,"#3a2214");P(40,10,40,40,"#d8d0b0");c.strokeStyle="#111";c.lineWidth=3;c.beginPath();c.moveTo(60,30);c.lineTo(60,14);c.moveTo(60,30);c.lineTo(72,30);c.stroke();P(44,56,32,52,"#1a0e08");P(58,60,4,34,"#b8903a");c.fillStyle="#d8b040";c.beginPath();c.arc(60,96,7,0,7);c.fill();P(46,78,6,4,"#8a5a3a");P(66,70,6,4,"#8a5a3a");}
  else if(key==="bloodbath"){P(10,50,100,50,"#d8d8e0");P(16,54,88,30,"#8a0a14");P(16,54,88,6,"#b81a24");for(let i=0;i<6;i++)P(20+i*15,40-(i%2)*8,6,18,"#a8121c");P(20,96,8,16,"#8a8a90");P(92,96,8,16,"#8a8a90");}
  PROC_ART[key]=c2;return c2;
}
function monImage(m){const a=m.art||"";if(a.startsWith("mon:"))return IMG[a]||null;if(a.startsWith("por:"))return IMG[a]||null;if(a.startsWith("proc:"))return procArt(a.slice(5));return null;}

/* ---- portraits ---- */
function portraitImg(who){
  if(!who)return null;
  if(PARTY_DEF[who])return IMG["pc:"+(who==="tessie"?"Tessie":PARTY_DEF[who].name.split(" ")[0])];
  if(PORT[who])return IMG["por:"+PORT[who]];
  if(IMG["por:"+who])return IMG["por:"+who];
  return null;
}

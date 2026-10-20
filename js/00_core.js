"use strict";
/* ===================================================================== *
 *  CROOKED MOON · GHOSTLIGHT EXPRESS — a Game Boy–style explore & battle
 *  RPG of Moon's Crooked Moon campaign (Sessions 1–8).
 *  Single file · runs from file:// · real campaign art embedded as data.
 *  Sections mirror src/ modules:
 *   core → party → monsters → world → story → render → ui → battle →
 *   minigames → systems → game
 * ===================================================================== */

/* ================================ core.js ============================== */
const PREFIX="cmgb1:", MEM={};
let LS=null;
try{LS=window.localStorage;const t=PREFIX+"__t";LS.setItem(t,"1");LS.removeItem(t);}catch(e){LS=null;}
function sget(k){try{return LS?LS.getItem(PREFIX+k):(k in MEM?MEM[k]:null);}catch(e){return k in MEM?MEM[k]:null;}}
function sset(k,v){try{if(LS)LS.setItem(PREFIX+k,v);else MEM[k]=v;}catch(e){MEM[k]=v;}}
function sdel(k){try{if(LS)LS.removeItem(PREFIX+k);}catch(e){}delete MEM[k];}

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function hash2(x,y){let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967295;}

/* ---- dice: the heart of it ---- */
function d(n){return 1+Math.floor(Math.random()*n);}
function parseDice(s){ // "2d6+3" -> {n,s,m}
  const m=/^(\d*)d(\d+)([+-]\d+)?$/.exec(String(s).replace(/\s/g,""));
  if(!m)return {n:0,s:0,m:parseInt(s)||0};
  return {n:parseInt(m[1]||"1"),s:parseInt(m[2]),m:parseInt(m[3]||"0")};
}
function roll(s,crit){const p=parseDice(s);let t=p.m,rolls=[];const n=crit?p.n*2:p.n;for(let i=0;i<n;i++){const r=d(p.s);rolls.push(r);t+=r;}return {total:Math.max(0,t),rolls,expr:s};}
function avgDice(s){const p=parseDice(s);return p.n*(p.s+1)/2+p.m;}

/* ============================== audio.js =============================== */
let AC=null, SOUND=sget("sound")!=="0", MUSIC=sget("music")!=="0";
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;}}if(AC&&AC.state==="suspended")AC.resume();return AC;}
function tone(f,dur,type,vol,slide,delay){
  if(!SOUND)return;const a=ac();if(!a)return;
  const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();
  o.type=type||"square";o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+dur);
  g.gain.setValueAtTime(vol||.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02);
}
function noise(dur,vol,hp){
  if(!SOUND)return;const a=ac();if(!a)return;
  const len=Math.floor(a.sampleRate*dur),buf=a.createBuffer(1,len,a.sampleRate),dt=buf.getChannelData(0);
  for(let i=0;i<len;i++)dt[i]=(Math.random()*2-1)*(1-i/len);
  const s=a.createBufferSource();s.buffer=buf;const g=a.createGain();g.gain.value=vol||.08;
  const f=a.createBiquadFilter();f.type="highpass";f.frequency.value=hp||800;
  s.connect(f).connect(g).connect(a.destination);s.start();
}
const SFX={
  step(){tone(170+Math.random()*30,.03,"triangle",.012);},
  bump(){tone(90,.08,"square",.035,-30);},
  blip(){tone(880,.05,"square",.03);},
  sel(){tone(660,.04,"square",.025);},
  ok(){tone(660,.07,"square",.04);tone(990,.1,"square",.04,0,.07);},
  bad(){tone(220,.15,"sawtooth",.04,-80);},
  door(){tone(300,.08,"triangle",.05,120);tone(180,.12,"triangle",.04,-40,.08);},
  coin(){tone(1320,.05,"square",.04);tone(1760,.12,"square",.04,0,.05);},
  item(){[523,659,784,1046].forEach((f,i)=>tone(f,.09,"square",.04,0,i*.07));},
  hit(){noise(.12,.12,600);tone(140,.12,"square",.05,-60);},
  crit(){noise(.2,.16,400);tone(90,.25,"sawtooth",.07,-40);tone(1200,.08,"square",.04,600,.05);},
  miss(){tone(500,.12,"triangle",.03,-300);},
  heal(){[523,659,784,988,1318].forEach((f,i)=>tone(f,.12,"triangle",.035,0,i*.06));},
  magic(){for(let i=0;i<6;i++)tone(400+i*140,.08,"sine",.03,200,i*.04);},
  dice(){for(let i=0;i<5;i++)noise(.03,.05,2500);},
  whistle(){tone(740,.9,"sine",.05,-40);tone(932,.9,"sine",.04,-50);},
  howl(){tone(300,1.2,"sine",.05,300);tone(310,1.2,"triangle",.02,280,.1);},
  toll(){tone(196,1.6,"sine",.07,-4);tone(392,1.2,"sine",.03,-8);},
  scream(){tone(900,.5,"sawtooth",.03,-600);noise(.4,.04,1800);},
  level(){[392,523,659,784,659,784,1046].forEach((f,i)=>tone(f,.14,"square",.045,0,i*.1));},
  win(){[523,523,523,659,784,659,784,1046].forEach((f,i)=>tone(f,.13,"square",.045,0,i*.11));},
  lose(){[392,370,349,330,262].forEach((f,i)=>tone(f,.3,"triangle",.05,0,i*.25));},
  flap(){noise(.15,.05,1500);},
  squeak(){tone(1600,.05,"square",.02,400);tone(1900,.05,"square",.02,-400,.06);},
  unlock(){tone(1200,.04,"square",.04);tone(700,.06,"square",.04,0,.05);tone(1500,.08,"square",.04,0,.12);},
  pick(){tone(2400,.02,"square",.02);},
  thunder(){noise(1.2,.18,80);},
  harp(f){tone(f,.35,"triangle",.05);tone(f*2,.2,"sine",.02);},
  fiddle(){[659,784,880,784,659,587].forEach((f,i)=>tone(f,.16,"sawtooth",.018,6,i*.14));},
};

/* ---- procedural chiptune (lookahead scheduler, song per area) ---- */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
// songs: bpm, loops of [bass pattern], [lead pattern]; notes as midi or 0 rest
const SONGS={
  title:{bpm:84,lead:[69,0,72,0,76,0,74,72,69,0,67,0,69,0,0,0, 69,0,72,0,77,0,76,74,72,0,71,0,69,0,0,0],bass:[45,45,45,45,41,41,43,43],wave:"triangle",pad:[57,60,64]},
  train:{bpm:112,lead:[76,0,75,76,79,0,76,0,74,0,72,74,76,0,0,0, 72,0,71,72,76,0,72,0,71,0,69,68,69,0,0,0],bass:[45,52,45,52,43,50,40,47],wave:"sawtooth",pad:[57,60,64]},
  woods:{bpm:70,lead:[64,0,0,0,67,0,0,0,65,0,64,0,62,0,0,0, 60,0,0,0,62,0,0,0,64,0,0,0,0,0,0,0],bass:[40,40,38,38,36,36,35,35],wave:"sine",pad:[52,55,59]},
  village:{bpm:96,lead:[69,71,72,0,74,72,71,69,67,0,69,71,69,0,0,0, 72,74,76,0,77,76,74,72,71,0,72,74,72,0,0,0],bass:[45,52,48,55,43,50,45,52],wave:"triangle",pad:[57,60,64]},
  house:{bpm:76,lead:[81,0,80,0,81,0,76,0,77,0,76,0,74,0,0,0, 72,0,71,0,72,0,69,0,70,0,69,0,68,0,0,0],bass:[45,45,44,44,43,43,42,42],wave:"sine",pad:[57,60,63]},
  dungeon:{bpm:66,lead:[57,0,0,60,0,0,58,0,57,0,0,0,53,0,0,0],bass:[33,33,34,34],wave:"triangle",pad:[45,48,51]},
  battle:{bpm:148,lead:[64,64,67,64,69,64,67,64,62,62,65,62,67,62,65,62, 60,60,64,60,67,60,64,60,59,59,62,59,64,59,62,59],bass:[40,40,38,38,36,36,35,35],wave:"square",pad:[52,55,59]},
  boss:{bpm:160,lead:[64,65,64,0,71,70,71,0,64,65,64,0,72,71,70,69, 64,65,64,0,71,70,71,0,74,72,71,70,69,68,67,66],bass:[40,40,41,41,40,40,39,39],wave:"sawtooth",pad:[52,55,58]},
  victory:{bpm:132,lead:[72,72,72,72,68,0,70,0,72,0,70,72,0,0,0,0],bass:[48,44,46,48],wave:"square",pad:[60,64,67],once:true},
};
const MUS={gain:null,next:0,step:0,song:null,timer:null,cur:null,want:null};
function musNote(freq,t,dur,type,vol){
  const a=AC;if(!a||!MUS.gain)return;const o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(MUS.gain);o.start(t);o.stop(t+dur+.05);
}
function musicTick(){
  const a=AC;if(!a||!MUS.cur)return;
  const s=SONGS[MUS.cur];const spb=60/s.bpm/2;
  while(MUS.next<a.currentTime+.25){
    const i=MUS.step;
    const n=s.lead[i%s.lead.length];if(n)musNote(NOTE(n),MUS.next,spb*1.6,s.wave,.035);
    if(i%4===0){const b=s.bass[Math.floor(i/4)%s.bass.length];musNote(NOTE(b),MUS.next,spb*3.6,"triangle",.06);}
    if(i%16===0&&s.pad)s.pad.forEach(p=>musNote(NOTE(p),MUS.next,spb*14,"sine",.012));
    if(s.bpm>120&&i%2===0)musNote(3000+Math.random()*2000,MUS.next,.02,"square",.004);
    MUS.next+=spb;MUS.step++;
    if(s.once&&MUS.step>=s.lead.length){MUS.cur=null;break;}
  }
}
function playSong(id){
  MUS.want=id;if(!MUSIC){MUS.cur=null;return;}
  const a=ac();if(!a)return;
  if(!MUS.gain){MUS.gain=a.createGain();MUS.gain.gain.value=.55;MUS.gain.connect(a.destination);}
  if(MUS.cur===id)return;MUS.cur=id;MUS.step=0;MUS.next=a.currentTime+.08;
  if(!MUS.timer)MUS.timer=setInterval(musicTick,40);
}
function setMusic(on){MUSIC=on;sset("music",on?"1":"0");if(!on){MUS.cur=null;}else if(MUS.want)playSong(MUS.want);}

/* ============================== input.js =============================== */
const KEY={up:false,down:false,left:false,right:false};
const HANDLERS=[]; // stack of {key:fn(k)} – topmost receives presses
function pushH(fn){HANDLERS.push(fn);return fn;}
function popH(fn){const i=HANDLERS.lastIndexOf(fn);if(i>=0)HANDLERS.splice(i,1);}
const KMAP={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right",W:"up",S:"down",A:"left",D:"right",
  z:"A",Z:"A",e:"A",E:"A"," ":"A",x:"B",X:"B",Escape:"B",Backspace:"B",Enter:"START",m:"MAP",M:"MAP",j:"JOURNAL",J:"JOURNAL",
  q:"SWAP",Q:"SWAP",Tab:"SWAP","`":"DM","~":"DM"};
function keyPress(k,raw){
  if(HANDLERS.length){HANDLERS[HANDLERS.length-1](k,raw);return;}
  if(window.worldKey)window.worldKey(k,raw);
}
window.addEventListener("keydown",e=>{
  if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="SELECT"||e.target.tagName==="TEXTAREA"))return;
  const k=KMAP[e.key]||(/^[1-9]$/.test(e.key)?"N"+e.key:null)||(/^[a-dA-D]$/.test(e.key)?null:null);
  if(k&&["up","down","left","right"].includes(k))KEY[k]=true;
  if(k){e.preventDefault();ac();if(!e.repeat||["up","down","left","right"].includes(k))keyPress(k,e.key);}
  else if(/^[1-9]$/.test(e.key)){keyPress("N"+e.key,e.key);}
});
window.addEventListener("keyup",e=>{const k=KMAP[e.key];if(k&&k in KEY)KEY[k]=false;});
window.addEventListener("blur",()=>{for(const k in KEY)KEY[k]=false;});
function bindTouch(){
  const coarse=window.matchMedia&&matchMedia("(pointer:coarse)").matches;
  if(coarse){$("touch").style.display="block";document.body.classList.add("touch");if(window.sizeCanvas)setTimeout(sizeCanvas,0);}
  const hold=(id,k)=>{const el=$(id);const on=e=>{e.preventDefault();ac();KEY[k]=true;keyPress(k);};const off=e=>{e.preventDefault();KEY[k]=false;};
    el.addEventListener("touchstart",on,{passive:false});el.addEventListener("touchend",off);el.addEventListener("touchcancel",off);
    el.addEventListener("mousedown",on);el.addEventListener("mouseup",off);el.addEventListener("mouseleave",off);};
  hold("tu","up");hold("td","down");hold("tl","left");hold("tr","right");
  const tap=(id,k)=>{const el=$(id);const f=e=>{e.preventDefault();ac();keyPress(k);};el.addEventListener("touchstart",f,{passive:false});el.addEventListener("click",f);};
  tap("ta","A");tap("tb","B");tap("tst","START");
}

/* ============================== v8.1 · explore ========================== *
 * Moon, Oct 20: "the collision on the Wickermoor map makes it hard to walk
 * around — let us walk freely, and enter buildings with an interact button,
 * not by walking into them."
 *   · Wickermoor Village: buildings and tree lines no longer block. Only the
 *     map edge, people and solid props do.
 *   · Every exit (doors, train couplings, paths off a map) is now ENTERED
 *     with A / Space / Z while standing on it or facing it. Walking onto a
 *     door just puts you on the doorstep. Locked ways still say why when you
 *     press A. The prompt chip reads "A ▸ ENTER <place>". */
(function freeVillage(){
  const M=MAPS.village;if(!M)return;
  M.grid=M.grid.map(r=>{const a=Array.isArray(r)?r.slice():r.split("");for(let i=0;i<a.length;i++)if(a[i]==="#")a[i]=".";return Array.isArray(r)?a:a.join("");});
})();

/* walking: exits are just floor now (hidden, still-locked secret ways stay solid) */
tryMove=function(dir){
  if(P.moving)return;
  const dv={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];STATE.dir=dir;
  const nx=STATE.x+dv[0],ny=STATE.y+dv[1];
  const r=roamAt(nx,ny);if(r){startRoamBattle(r);return;}
  const ex=exitAt(nx,ny);
  if(ex&&ex.hidden&&ex.need&&!hasF(ex.need))return;
  const M=curMap();if(nx<0||ny<0||nx>=M.w||ny>=M.h)return;
  if(blockedFor(nx,ny,STATE.x,STATE.y)){if(!P.bumpT||performance.now()-P.bumpT>300){SFX.bump();P.bumpT=performance.now();}return;}
  P.moving=true;P.fx=STATE.x;P.fy=STATE.y;P.tx=nx;P.ty=ny;P.t=0;
  TRAIL.unshift({x:STATE.x,y:STATE.y,dir});TRAIL.length=5;
  STATE.x=nx;STATE.y=ny;STATE.stats.steps++;if(STATE.stats.steps%2===0)SFX.step();
};

/* which way does this exit go, in words */
function exitName8(ex){
  if(ex.to&&MAPS[ex.to]&&!(ex.need==="__never")){const nm=MAPS[ex.to].name;return {verb:MAPS[ex.to].theme==="village"||MAPS[ex.to].theme==="woods"?"GO":"ENTER",nm};}
  return {verb:"LOOK",nm:ex.dir==="left"?"The road west":ex.dir==="right"?"The road east":ex.dir==="down"?"The road south":ex.dir==="up"?"The path north":"The way on"};}
function usableExit8(ex){return ex&&!(ex.hidden&&(!ex.need||!hasF(ex.need)));}

/* facing: people / things first, then a door ahead, then the doorstep you're on */
{const _fe=facedEntity;facedEntity=function(){
  const f=_fe();if(f)return f;if(!STATE)return null;
  const [x,y]=facedCell();let ex=exitAt(x,y);if(!(usableExit8(ex)&&!wallBetween(STATE.x,STATE.y,x,y)))ex=null;
  if(!ex){const h=exitAt(STATE.x,STATE.y);if(usableExit8(h))ex=h;}
  if(!ex)return null;const n=exitName8(ex);
  return {type:"exit",e:Object.assign({},ex,{name:n.nm,_verb:n.verb,_ex:ex})};};}
function useExit8(ex){
  if(ex.need&&!hasF(ex.need)){SFX.bump();shake(2);if(ex.lock)runScript(()=>say(null,ex.lock));return;}
  SFX.door();runScript(async()=>{if(ex.event&&EVENTS[ex.event]){const go=await EVENTS[ex.event](ex);if(!go)return;}if(ex.to)await warp(ex.to,ex.tx,ex.ty,ex.dir);});}
{const _in=interact;interact=function(){
  const f=facedEntity();if(f&&f.type==="exit"){useExit8(f.e._ex);return;}
  return _in();};}

/* the prompt chip says ENTER / GO / LOOK for ways out */
{const _vp=v7prompt;v7prompt=function(){_vp();
  const el=$("pr7");if(!el||!el.classList.contains("on"))return;
  const f=inWorld()&&canWalk()?facedEntity():null;if(!f||f.type!=="exit")return;
  const v=el.querySelector(".v");if(v&&v.textContent!==f.e._verb)v.textContent=f.e._verb;};}
{const _ch=controlsHTML;controlsHTML=function(){return _ch().replace("<b>A</b> — talk, examine, confirm","<b>A</b> — talk, examine, confirm, <b>enter doors</b>");};}

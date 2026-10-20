const fs=require('fs'),vm=require('vm');
let src=fs.readFileSync('build/game.js','utf8');
src=src.replace(/boot\(\);\s*$/,'');
src+='\n;globalThis.__X__={SESSIONS,TROUBLES,CALLS,PERSONA,ROAMERS,HIDEOUTS,DOWNTIME_TASKS,NOTE_FLAGS,GLOSS,EXPLAIN,PROMISE_FLAGS,RUMORS,MAPS,TALK,EVENTS,MON,ENC,SECRETS,ITEMS,KEYITEMS,QUESTS,LOOK,PORT,SOLID,ABIL,PARTY_DEF,SHOPS,BADGES,LORE};';
const noop=()=>{};
const ctxStub=new Proxy({},{get:(t,k)=>k==='measureText'?(()=>({width:10})):k==='createRadialGradient'||k==='createLinearGradient'?(()=>({addColorStop:noop})):k==='getImageData'?(()=>({data:[]})):noop,set:()=>true});
function el(){return new Proxy({style:{},classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},dataset:{},children:[],appendChild:noop,querySelectorAll:()=>[],querySelector:()=>el(),getContext:()=>ctxStub,addEventListener:noop,getBoundingClientRect:()=>({left:0,top:0,width:480,height:336}),scrollIntoView:noop,remove:noop,after:noop,before:noop,insertAdjacentHTML:noop},{get:(t,k)=>k in t?t[k]:(k==='innerHTML'||k==='textContent'?'':k==='parentElement'?el():noop),set:(t,k,v)=>{t[k]=v;return true;}});}
const sandbox={console,Math,JSON,Date,Set,Map,Promise,setTimeout,clearTimeout,setInterval:()=>0,clearInterval:noop,performance:{now:()=>0},
  document:{getElementById:()=>el(),createElement:()=>el(),body:el()},window:{addEventListener:noop,matchMedia:()=>({matches:false}),ASSETS:{maps:{},por:{},mon:{},pc:{}},localStorage:null,innerWidth:1000,innerHeight:800},
  requestAnimationFrame:noop,Image:function(){},AudioContext:undefined};
sandbox.window.window=sandbox.window;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(src,sandbox);
const X=sandbox.__X__;
if(process.argv[2]){const M=X.MAPS[process.argv[2]];console.log(M.grid.map((r,y)=>r.map((c,x)=>{const e=M.exits.find(e=>e.x===x&&e.y===y);if(e)return 'E';const n=[...M.npcs,...M.props].find(n=>n.x===x&&n.y===y);if(n)return 'o';return c;}).join('')).map((r,y)=>(y<10?' ':'')+y+' '+r).join('\n'));process.exit(0);}const {MAPS,TALK,EVENTS,MON,ENC,SOLID}=X;
let errs=[],warns=[];
const E=m=>errs.push(m),W=m=>warns.push(m);
for(const id in MAPS){const M=MAPS[id];
  M.grid.forEach((r,y)=>{if(r.length!==M.w)E(`${id}: row ${y} length ${r.length}!=${M.w}`);});
  const solid=(x,y)=>x<0||y<0||x>=M.w||y>=M.h||SOLID.has(M.grid[y][x]);
  const exitAt=(x,y)=>M.exits.find(e=>e.x===x&&e.y===y);
  if(M.start&&solid(M.start.x,M.start.y)&&!exitAt(M.start.x,M.start.y))E(`${id}: start solid`);
  M.exits.forEach(e=>{if(e.x<0||e.y<0||e.x>=M.w||e.y>=M.h)E(`${id}: exit oob ${e.x},${e.y}`);
    if(e.to){const T=MAPS[e.to];if(!T){E(`${id}: exit to missing ${e.to}`);return;}
      const tx=e.tx,ty=e.ty;if(tx<0||ty<0||tx>=T.w||ty>=T.h)E(`${id}->${e.to}: target oob`);
      else if(SOLID.has(T.grid[ty][tx])&&!T.exits.some(x=>x.x===tx&&x.y===ty))E(`${id}->${e.to}: target (${tx},${ty}) solid '${T.grid[ty][tx]}'`);
      if(T.exits.some(x=>x.x===tx&&x.y===ty))W(`${id}->${e.to}: lands on exit tile (${tx},${ty})`);
      const occ=[...T.npcs,...T.props].find(n=>n.x===tx&&n.y===ty);if(occ)E(`${id}->${e.to}: target occupied by ${occ.id}`);}
    if(e.event&&!EVENTS[e.event])E(`${id}: missing event ${e.event}`);});
  const ents=[...M.npcs.map(n=>({...n,k:'npc'})),...M.props.map(p=>({...p,k:'prop'}))];
  ents.forEach(e=>{if(e.x<0||e.y<0||e.x>=M.w||e.y>=M.h)E(`${id}: ${e.id} oob`);
    if(e.talk&&!TALK[e.talk])E(`${id}: ${e.id} missing TALK.${e.talk}`);
    if(e.k==='npc'&&typeof e.look==='string'&&!e.look.startsWith('mon:')&&!X.LOOK[e.look])E(`${id}: ${e.id} missing LOOK ${e.look}`);
    if(exitAt(e.x,e.y))E(`${id}: ${e.id} on exit`);
    // adjacency: has at least one walkable neighbor
    const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>!solid(e.x+dx,e.y+dy));if(!nb)E(`${id}: ${e.id} has no walkable neighbor`);});
  // duplicates
  const seen={};ents.forEach(e=>{const k=e.x+','+e.y;if(seen[k]&&!(e.hide||seen[k].hide||e.need||seen[k].need))W(`${id}: ${e.id} overlaps ${seen[k].id}`);seen[k]=e;});
  // flood fill from start / entries: all entities reachable
  const entries=[];if(M.start)entries.push([M.start.x,M.start.y]);for(const m2 in MAPS)MAPS[m2].exits.forEach(e=>{if(e.to===id)entries.push([e.tx,e.ty]);});
  const walls=M.walls||[];const wb=(ax,ay,bx,by)=>walls.some(w=>{const [k,a,b,c]=w.split(' ').map((v,i)=>i?+v:v);if(k==='v'&&ay===by&&Math.max(ax,bx)===a&&Math.min(ax,bx)===a-1&&ay>=b&&ay<=c)return true;if(k==='h'&&ax===bx&&Math.max(ay,by)===a&&Math.min(ay,by)===a-1&&ax>=b&&ax<=c)return true;return false;});
  const blockEnt=(x,y)=>ents.some(e=>e.x===x&&e.y===y&&!(e.walk)&&!e.hide&&!e.need);
  const R=new Set();const q=[];entries.forEach(([x,y])=>{const k=x+','+y;if(!R.has(k)){R.add(k);q.push([x,y]);}});
  while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(R.has(k))continue;if(solid(nx,ny)&&!exitAt(nx,ny))continue;if(wb(x,y,nx,ny))continue;if(blockEnt(nx,ny))continue;R.add(k);if(!exitAt(nx,ny))q.push([nx,ny]);}}
  ents.forEach(e=>{const ok=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>R.has((e.x+dx)+','+(e.y+dy))&&!wb(e.x,e.y,e.x+dx,e.y+dy));if(!ok)W(`${id}: ${e.id} (${e.x},${e.y}) not reachable from entries`);});
  M.exits.forEach(e=>{if(!R.has(e.x+','+e.y)&&!e.hidden)W(`${id}: exit (${e.x},${e.y})->${e.to||'locked'} unreachable`);});
  (M.roam||[]).forEach(r=>{if(!ENC[r.enc])E(`${id}: roam ${r.id} bad enc`);if(solid(r.x,r.y))E(`${id}: roam ${r.id} on solid`);});
}
for(const k in ENC)ENC[k].foes.forEach(f=>{if(!MON[f])E(`ENC ${k}: missing mon ${f}`);});
for(const k in MON){if(MON[k].secret&&!X.SECRETS[MON[k].secret])E(`MON ${k}: bad secret`);}

/* ---- v6 checks ---- */
{const {SESSIONS,TROUBLES,CALLS,PERSONA,ROAMERS,HIDEOUTS,DOWNTIME_TASKS,NOTE_FLAGS,RUMORS}=X;
 const allTalk=new Set(Object.keys(TALK));
 for(let n=1;n<SESSIONS.length;n++){const S=SESSIONS[n];if(!S.title||!S.last||!S.quests)E(`session ${n}: missing fields`);if(!RUMORS[n])E(`session ${n}: no rumors`);}
 TROUBLES.forEach(t=>{if(!PERSONA[t.who])E(`trouble ${t.id}: persona ${t.who} missing`);const p=PERSONA[t.who];if(p&&!X.LOOK[p.look])E(`trouble ${t.id}: look ${p.look} missing`);
   const best=t.opts.filter(o=>o[1]===2).length;if(best!==1)E(`trouble ${t.id}: ${best} best answers`);if(t.opts.length!==3)W(`trouble ${t.id}: ${t.opts.length} options`);if(!(t.lines.length>=1))E(`trouble ${t.id}: no lines`);});
 const tid=new Set();TROUBLES.forEach(t=>{if(tid.has(t.id))E('dup trouble '+t.id);tid.add(t.id);});
 const cid=new Set();CALLS.forEach(c=>{if(cid.has(c.id))E('dup call '+c.id);cid.add(c.id);if(!X.PARTY_DEF[c.who])E(`call ${c.id}: who ${c.who}`);const best=c.opts.filter(o=>o[1]===2).length;if(best!==1)E(`call ${c.id}: ${best} best answers`);
   if(!["any","village","train","house","woods"].includes(c.where))E(`call ${c.id}: where ${c.where}`);if(c.go&&!HIDEOUTS[c.go])E(`call ${c.id}: go ${c.go} has no hideouts`);});
 const V=MAPS.village,solid=(x,y)=>x<0||y<0||x>=V.w||y>=V.h||SOLID.has(V.grid[y][x]);
 for(const k in HIDEOUTS)HIDEOUTS[k].forEach(h=>{if(solid(h.x,h.y))W(`hideout ${k} (${h.x},${h.y}) solid; nearestFree will move it`);});
 for(const n in ROAMERS){const R=ROAMERS[n];if(R.enc&&!ENC[R.enc])E(`roamer ${n}: enc ${R.enc}`);if(R.look.startsWith("mon:")){}else if(!X.LOOK[R.look])E(`roamer ${n}: look ${R.look}`);}
 DOWNTIME_TASKS.forEach(t=>{if(t.route&&!t.opt){}});
 console.log(JSON.stringify({sessions:SESSIONS.length-1,troubles:TROUBLES.length,calls:CALLS.length,roamers:Object.keys(ROAMERS).length,notes:Object.keys(NOTE_FLAGS).length,downtime:DOWNTIME_TASKS.length}));}
console.log(JSON.stringify({maps:Object.keys(MAPS).length,talk:Object.keys(TALK).length,mons:Object.keys(MON).length,encs:Object.keys(ENC).length,quests:Object.keys(X.QUESTS).length,badges:Object.keys(X.BADGES).length}));
console.log('ERRORS',errs.length);errs.forEach(e=>console.log(' E',e));
console.log('WARNINGS',warns.length);warns.forEach(e=>console.log(' W',e));

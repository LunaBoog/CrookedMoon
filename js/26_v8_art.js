/* ================================ v8 · art ============================== *
 * v8 "Full Moon". The portrait / monster / PC art now comes from the 300-400px
 * originals (tools/build_v8_art.py → build/assets_v8.js):
 *   ASSETS.mon  painted monster art (300px)        → IMG["mon:*"]
 *   ASSETS.por  crisp 128px pixel busts (64 colour) → IMG["por:*"]
 *   ASSETS.pc   card 400px + 128px pixel bust       → IMG["card:*"], IMG["pc:*"]
 *   ASSETS_V8.npc  full-body NPC art (300px)        → IMG["npc:*"]  (cast, walk-ups, credits)
 * build.py strips the old 64/120px copies out of assets.js, so the two sets
 * never ship together. Same keys, so every v5-v7 caller just gets sharper art. */
const V8={ver:"v8 · Full Moon",opt:{acts:1,tod:1,stamps:1}};
(function mergeV8Art(){
  const A8=window.ASSETS_V8;if(!A8||!window.ASSETS)return;
  ["mon","por","pc"].forEach(k=>{if(A8[k]&&Object.keys(A8[k]).length)window.ASSETS[k]=A8[k];});
})();
{const _la=loadAssets;loadAssets=async function(){
  await _la();
  const A8=window.ASSETS_V8||{},jobs=[];
  for(const k in (A8.npc||{}))jobs.push(loadImg("npc:"+k,A8.npc[k]));
  await Promise.all(jobs);
  // pixel busts are drawn crisp wherever they appear
  for(const k in IMG)if(/^(por|pc):/.test(k))IMG[k].v8crisp=1;
};}
/* options live with the v7 ones (outside the save, survive New Game) */
function v8opt(k){const o=(typeof V7!=="undefined"&&V7.opt)||{};return o["v8_"+k]===undefined?V8.opt[k]:o["v8_"+k];}
function v8set(k,v){if(typeof V7==="undefined")return;V7.opt["v8_"+k]=v;try{v7save();}catch(e){}}

/* draw a pixel bust crisp (nearest-neighbour) at integer-ish scale; painted art smooth */
function v8drawPortrait(g,im,x,y,w,h,opt){
  if(!im)return;opt=opt||{};
  const crisp=im.v8crisp||opt.crisp;
  g.save();g.imageSmoothingEnabled=!crisp;if(!crisp)g.imageSmoothingQuality="high";
  if(opt.cover){const s=Math.max(w/im.width,h/im.height);const dw=im.width*s,dh=im.height*s;
    g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(im,x+(w-dw)/2,y+(opt.top?0:(h-dh)/2),dw,dh);}
  else g.drawImage(im,x,y,w,h);
  g.restore();
}
/* full-body art for an NPC id / persona / portrait key */
function npcArt(who){if(!who)return null;const k=PORT[who]||who;return IMG["npc:"+k]||null;}

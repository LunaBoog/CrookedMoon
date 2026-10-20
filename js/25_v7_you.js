/* ================================ v7 · you ============================== *
 * The player is one of Moon's players. "★ You" is their character's page:
 * thread of fate, lore that's about them, and every logged moment that
 * mentions them. Plus: a SESSION COMPLETE banner the moment the required
 * tasks are done. */
const ME_LORE={azareth:[],lucky:["mcquest"],poppi:["malediction","lethica"],krodha:["tsen","divided"],tessie:["beast"]};
const ME_ALIAS={azareth:["Azareth"],lucky:["Lucky","McQuest"],poppi:["Poppi"],krodha:["Krodha","Silas"],tessie:["Tessie","Caster"]};
MENU_TABS.splice(1,0,["you","★ You"]);
MENU_HTML.you=()=>{const id=ME(),D=PARTY_DEF[id],s=pcStat(id),p=STATE.pcs[id];
  const al=ME_ALIAS[id]||[D.name];const notes=(STATE.v6?X().notes:[]).filter(n=>al.some(a=>n.text.includes(a)));
  const lore=(ME_LORE[id]||[]).filter(k=>LORE[k]);
  const gear=Object.keys(GEAR).filter(g=>GEAR[g].who===id&&hasF(g)).map(g=>GEAR[g]);
  const keys=Object.keys(STATE.keys).filter(k=>STATE.keys[k]>0&&KEYITEMS[k]&&al.some(a=>KEYITEMS[k].desc.includes(a)||KEYITEMS[k].name.includes(a)));
  let h=`<div class="pc7" style="grid-template-columns:150px 1fr;gap:16px"><div class="art" style="width:150px;height:225px;background-image:url('${cardSrc(id)}')"><span class="you">YOU</span></div>
    <div><div class="sc-k">YOUR CHARACTER</div><h4 style="font-size:34px">${esc(D.name)}</h4><div class="cls">${esc((D.species+" "+D.cls+" · "+D.sub+" · background: "+D.bg).toUpperCase())}</div>
    <p style="margin:6px 0">${esc(D.blurb)}</p>
    <div class="row" style="gap:6px"><span class="stat"><b>${p.hp}/${s.hpMax}</b>HP</span><span class="stat"><b>${s.ac}</b>AC</span><span class="stat"><b>${STATE.level}</b>LEVEL</span>${s.slotsMax?`<span class="stat"><b>${p.slots}/${s.slotsMax}</b>SLOTS</span>`:""}${s.kiMax?`<span class="stat"><b>${p.ki}/${s.kiMax}</b>KI</span>`:""}</div>
    <div class="scard" style="margin-top:10px;padding:8px 12px"><div class="sc-k">THREAD OF FATE</div><div style="font-family:var(--f-title);font-size:24px;color:#f6e5b0">${esc(D.thread)}</div>
      ${lore.map(k=>STATE.lore[k]?`<div class="sub" style="margin-top:4px"><b style="color:var(--ghost)">${esc(LORE[k][0])}</b> — ${esc(LORE[k][1])}</div>`:`<div class="sub" style="margin-top:4px;opacity:.6">??? — something about you the Hollow hasn't revealed yet.</div>`).join("")||`<div class="sub" style="margin-top:4px">No one in the Hollow knows yet. Neither do you.</div>`}</div>
    ${gear.length||keys.length?`<div class="chips" style="margin-top:8px">${gear.map(g=>`<span class="chip g">⚒ ${esc(g.name)}</span>`).join("")}${keys.map(k=>`<span class="chip">${KEYITEMS[k].icon} ${esc(KEYITEMS[k].name)}</span>`).join("")}</div>`:""}
    </div></div>
    <h4 style="color:var(--moon);margin:14px 0 4px">Your moments (${notes.length})</h4>
    ${notes.length?notes.slice().reverse().map(n=>`<div class="qitem"><span>${n.icon} ${esc(n.text)}</span><span class="st">Session ${n.s} · Day ${n.day}</span></div>`).join(""):`<div class="sub">Nothing with your name on it yet. Go make some trouble.</div>`}
    <p class="sub" style="margin-top:10px">Not you? Pick who you play: ${PARTY_ORDER.map(k=>`<button class="btn alt nav" data-me="${k}" style="padding:3px 8px;font-size:11px;${k===id?"outline:1px solid var(--ghost)":""}">${esc(PARTY_DEF[k].short||PARTY_DEF[k].name)}</button>`).join(" ")}</p>`;
  return h;};
MENU_WIRE.push((tab)=>{if(tab!=="you")return;$("mbody").querySelectorAll("[data-me]").forEach(b=>b.onclick=()=>{STATE.me=b.dataset.me;sset("v7me",STATE.me);SFX.ok();updateHUD();openMenu("you");});});

/* SESSION COMPLETE */
{let last=null;setInterval(()=>{if(!STATE||!STATE.v6||!inWorld())return;const x=X(),n=x.session,S=SESSIONS[n];if(!S||S.between)return;
  const k=n+":"+(sessReady(n)?1:0);if(last===null){last=k;return;}
  if(k===last)return;if(DLG_OPEN||BATTLE.on)return; // wait until the talking stops
  last=k;if(sessReady(n)&&!x.wrapped[n]&&!V6_QUIET&&!MODAL&&!WRAPPING)questBanner("SESSION "+n+" COMPLETE",S.title,true);},700);}

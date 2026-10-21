/* ============================== v8.1 · DM: end battle ==================== *
 * Moon, Oct 20: a DM-panel button to back out of any battle in progress.
 *   ⚔ END BATTLE section at the top of the DM Screen (` key / DM button):
 *     · "Retreat"        → the battle ends as a flee: no XP, no game over,
 *                          everyone keeps their current HP (downed PCs get 1).
 *     · "Call it a win"  → every foe drops: normal victory screen, XP, gold,
 *                          and story fights continue as if won.
 * Works mid-menu or mid-target-pick: pcTurn is raced against an abort signal
 * and any input handlers the battle left on the stack are cleared. */
const ABORT8={p:null,fire:null,hLen:0};
function armAbort8(){ABORT8.p=new Promise(r=>{ABORT8.fire=r;});}
{const _bt=battle;battle=async function(e,o){armAbort8();ABORT8.hLen=HANDLERS.length;try{return await _bt(e,o);}finally{ABORT8.fire=null;}};}
{const _pt=pcTurn;pcTurn=function(c){const p=_pt(c);return ABORT8.p?Promise.race([p,ABORT8.p]):p;};}
function dmEndBattle8(kind){
  const B=BATTLE;if(!B.on){toast("No battle in progress.");return;}
  if(DM.open)toggleDM();
  if(kind==="win"){B.thenDone=true;B.foes.forEach(f=>{f.hp=0;f.dead=true;f.deathT=performance.now();});B.result="win";}
  else{B.result="flee";B.party.forEach(p=>{if(p.hp<=0)p.hp=1;});}
  // tidy anything the battle was waiting on
  HANDLERS.length=Math.min(HANDLERS.length,ABORT8.hLen);
  $("bmenu").style.display="none";B.pick=null;if(typeof ACT8!=="undefined")ACT8.on=null;
  blog(kind==="win"?"<b style='color:var(--gold)'>The DM calls it.</b> The fight is over.":"<b style='color:var(--ghost)'>The DM calls a retreat.</b> The party backs away.");
  SFX.sel();if(ABORT8.fire)ABORT8.fire();
}
{const _rd=renderDM;renderDM=function(){_rd();
  const d=$("dm"),on=BATTLE.on,sec=document.createElement("div");
  sec.innerHTML=`<h3>⚔ END BATTLE</h3><p class="sub" style="color:var(--dim)">${on?`In battle: <b style="color:var(--moon)">${esc(BATTLE.foes.filter(f=>!f.dead&&f.hp>0).map(f=>f.name).join(", ")||"—")}</b> · round ${BATTLE.round}`:"No battle right now. These work during any fight (open this panel with ` or the DM button)."}</p>
    <button class="btn" id="dmFlee8" ${on?"":"disabled"}>🏃 Retreat (end, no XP)</button><button class="btn alt" id="dmWin8" ${on?"":"disabled"}>🏆 Call it a win</button>`;
  const first=d.firstElementChild;if(first&&first.nextSibling)d.insertBefore(sec,first.nextSibling.nextSibling||null);else d.appendChild(sec);
  $("dmFlee8").onclick=()=>dmEndBattle8("flee");$("dmWin8").onclick=()=>dmEndBattle8("win");};}
/* the ` key opens the DM Screen even mid-battle (the battle menu used to swallow it) */
{const _kp=keyPress;keyPress=function(k,raw){if(k==="DM"&&STATE&&$("title").style.display==="none"&&!MODAL){toggleDM();return;}return _kp(k,raw);};}

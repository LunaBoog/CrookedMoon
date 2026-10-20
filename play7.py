"""play7 — v6 end-to-end: Sessions 1–8 through the ritual, Between Sessions, dinner, arcade.
Drives the real TALK/EVENTS scripts with an in-page autopilot that answers dialogs,
writes recaps (ticking only real highlights), answers the honesty check, looks closer,
fights (god mode), and enters initials. Minigames are stubbed (v5 already tests them)."""
import asyncio,sys,json
from pw import G
AUTO=r"""
window.__auto=function(){
 const q=id=>document.getElementById(id);
 const A=q("arcade");
 if(A&&A.classList.contains("on")){const s=q("arSave");if(s){"BOT".split("").forEach(ch=>window.dispatchEvent(new KeyboardEvent('keydown',{key:ch})));s.click();return "arcade-save";}
   const b=q("arBack");if(b){b.click();return "arcade-back";}return "arcade-wait";}
 if(q("credits").style.display==="block"){keyPress("B");return "credits";}
 if(MODAL){
   if(q("rcSend")){document.querySelectorAll("#rcItems .rcit").forEach(b=>{if(!b.textContent.includes("🗣"))b.click();});q("rcSend").click();return "recap";}
   if(q("rcNext")){q("rcNext").click();return "recap2";}
   const hon=document.querySelector("#qlHon [data-h]");if(hon&&q("qlHonR")&&!q("qlHonR").innerHTML){const open=Object.values(V6.X().promises).filter(p=>p.by==="us"&&!p.kept).length;document.querySelector(`#qlHon [data-h="${Math.min(6,open)}"]`).click();return "honest";}
   for(const id of ["qlGo","scGo","mnGo","exOk"])if(q(id)){q(id).click();return id;}
   if(q("attOk")){if(!q("attOk").disabled){q("attOk").click();return "att";}return "att-wait";}
   if(q("dieok")){if(!q("dieok").disabled){q("dieok").click();return "die";}return "die-wait";}
   const lk=document.querySelector('#mbody [data-v="look"]');if(lk){lk.click();return "look";}
   const dd=document.querySelector('#mbody [data-v="do"]');if(dd){dd.click();return "do";}
   if(q("mnGo")){q("mnGo").click();return "mn";}
   closeModal();return "close";}
 if(DLG_OPEN){keyPress("A");return "dlg";}
 if(BATTLE.on){keyPress("A");return "battle";}
 if(q("minigame").style.display==="flex"){keyPress("A");return "mg";}
 return null;};
MG.lockpick=async()=>true;MG.ouija=async()=>true;MG.flippy=async()=>true;MG.river=async()=>({hits:0});MG.chase=async()=>true;MG.harpsichord=async()=>0.9;MG.liarsdice=async()=>true;
window.__pickNext=function(n){const _a=ask;ask=async(w,t,c,o)=>{ask=_a;return n;};};
"""
async def settle(g,label,maxn=900,idle_ms=0):
    n=0;busy_seen=False
    while n<maxn:
        a=await g.ev("__auto()")
        if a is None:
            s=await g.ev("SCRIPT.running")
            if not s:
                if idle_ms:
                    await g.pg.wait_for_timeout(idle_ms);idle_ms=0
                    continue
                return True
        n+=1
        await g.pg.wait_for_timeout(40 if a in ("dlg","battle","mg") else 70)
    print("  STUCK at",label,await g.ev("[STATE.map,MODAL?document.getElementById('mtitle').textContent:'',DLG_OPEN?document.getElementById('dsay').textContent.slice(0,80):'']"),flush=True)
    return False
async def run(g,js,label,maxn=2500,idle=0):
    for i in range(200):
        if not await g.ev("SCRIPT.running"): break
        await settle(g,"pre-"+label,50)
    await g.ev("void runScript(async()=>{%s})"%js)
    await g.pg.wait_for_timeout(60)
    ok=await settle(g,label,maxn,idle)
    st=await g.ev("[STATE.map,STATE.level,STATE.v6.session,STATE.v6.day,STATE.gold]")
    print(f"{label:28s} {'ok' if ok else 'STUCK'} {st}",flush=True)
    return ok
async def idle(g,ms,label="idle"):
    t=0
    while t<ms:
        await settle(g,label,300);await g.pg.wait_for_timeout(200);t+=200
async def main():
    g=G();await g.start()
    await g.newgame();await g.mash("!DLG_OPEN",20)
    await g.ev(AUTO);await g.ev("STATE.god=true;STATE.fast=true")
    await settle(g,"intro")
    # ---------------- Session 1
    for js,l in [("await TALK.stationBooth()","booth"),("await TALK.stationEdge()","train arrives"),("await TALK.crookedPassenger()","crooked passenger"),("await TALK.windowCrack()","wax"),
        ("await warp('car_dining',7,3)","->dining"),("await TALK.daydreamer()","daydreamer"),("await warp('car_mail',7,3)","->mail"),("await TALK.mariner()","mariner1"),("await TALK.mailPile()","vinyl"),
        ("await warp('car_lounge',7,3)","->lounge"),("await TALK.adelaTrain()","tarot"),("await TALK.phillipTrain()","phillip"),("await TALK.songstress()","songstress"),("await TALK.phonograph()","phonograph"),
        ("await TALK.loungePainting()","painting"),("await TALK.loungeLetter()","letter"),("await warp('car_mail',7,3)","->mail"),("await TALK.mariner()","mariner2"),
        ("await warp('car_sleeper',7,3)","->sleeper"),("await TALK.cabin2()","cabin2 (look closer)"),("await TALK.sweetheart()","sweetheart"),
        ("await warp('car_baggage',7,3)","->baggage"),("await TALK.druskTrunks()","trunks (look closer)"),("await TALK.jailbird()","jailbird1"),("await warp('car_dining',7,3)","->dining"),("await TALK.diningKitchen()","steak"),
        ("await warp('car_baggage',7,3)","->baggage"),("await TALK.ghostTiger()","tiger"),("await TALK.jailbird()","jailbird2"),("await TALK.luckyCase()","case"),("await TALK.luggageSearch()","luggage"),
        ("await warp('car_circus',7,3)","->circus"),("await TALK.keyring()","keys"),("await TALK.cages()","cages"),("await TALK.harlequin()","harlequin"),
        ("await warp('car_tender',4,3)","->tender"),("await TALK.vagrantFurnace()","vagrant"),("await TALK.furnace()","FURNACE → S1 wrap")]:
        await run(g,js,l)
    print("S1:",await g.ev("JSON.stringify({s:V6.X().session,recaps:V6.X().recaps,notes:V6.X().notes.length,spirits:spiritsFreed(),lvl:STATE.level})"))
    # ---------------- Session 2
    for js,l in [("await TALK.vagrantWreck()","vagrant jars")]+[("await TALK.soulJar({id:'jar%d'})"%i,"jar%d"%i) for i in range(1,7)]+[("await TALK.engineWreck()","LOCOMOTIVE"),("await TALK.phillipWreck()","reward"),
        ("await warp('darkwood',8,14)","->darkwood"),("await TALK.adelaWalk()","adela walk"),("await TALK.tallPine()","pine"),("await eventArrival()","arrival+wolves+mayor"),
        ("await warp('inn',14,5)","->inn"),("await TALK.alda()","alda rest (night)"),("await warp('village',14,25)","->square"),("await TALK.communityBoard()","board"),
        ("await warp('trading',6,7)","->trading"),("await TALK.baltus()","baltus"),("await warp('books',6,7)","->books"),("await TALK.eleanor()","eleanor"),("await warp('tailor',6,7)","->tailor"),("await TALK.thomasin()","thomasin")]:
        await run(g,js,l)
    await idle(g,2500,"S2 wrap prompt")
    print("S2:",await g.ev("JSON.stringify({s:V6.X().session,recaps:Object.keys(V6.X().recaps),day:V6.X().day,prom:Object.keys(V6.X().promises)})"))
    # ---------------- Session 3
    for js,l in [("await warp('mason',6,7)","->mason"),("await TALK.solomon()","mason1"),("await warp('constab',6,7)","->constab"),("await TALK.doris()","doris"),("await warp('mason',6,7)","->mason"),("await TALK.solomon()","mason2"),
        ("await warp('church',7,10)","->church"),("await TALK.weston()","weston"),("await warp('village',24,37)","->taylor"),("await EVENTS.taylorDoor()","taylor door"),("setF('taylorKnown');for(let i=0;i<8&&!hasKey('hexbag');i++){await TALK.taylorPorch();}","porch (look closer)"),
        ("await warp('apoth',6,7)","->apoth"),("await TALK.morgan()","morgan"),("await warp('books',6,7)","->books"),("await TALK.eleanor()","eleanor hex"),
        ("await warp('inn',14,5)","->inn"),("await TALK.hildaInn()","hilda"),("await TALK.finneasInn()","finneas"),("await warp('school',6,7)","->school"),("await TALK.finneasSchool()","map"),
        ("await warp('village',7,1,'up')","->north"),("await EVENTS.wytchwoodEnter()","wytchwood"),("await TALK.casterJoin()","caster"),("await TALK.bodySite()","body"),("await TALK.trailFork()","fork"),("await TALK.campsite()","camp"),("await TALK.stickHand()","sticks"),("await EVENTS.river()","river"),
        ("await TALK.marshHaint()","MARSH HAINT → S3 wrap")]:
        await run(g,js,l)
    print("S3:",await g.ev("JSON.stringify({s:V6.X().session,recaps:Object.keys(V6.X().recaps)})"))
    # ---------------- Session 4
    for js,l in [("await TALK.ancientGraves()","graves"),("__pickNext(1);await TALK.ironGate()","gate"),("await warp('chapel',5,4,'up')","->chapel")]+[("giveKey('grass');await TALK.bowl({bowl:'%s',name:'bowl'})"%b,"bowl"+b) for b in "MLR"]+[
        ("await warp('crypt',1,6)","->crypt"),("await TALK.crossroads()","chalk"),("await TALK.alchemyDoor()","alchemy"),("await warp('temple',1,6)","->temple"),("await EVENTS.templeEnter()","smoke"),("await TALK.supplicantTalk()","handless"),
        ("await warp('temple',14,3,'up')","->platform"),("await TALK.handtaker()","HAND-TAKER → S4 wrap → S5")]:
        await run(g,js,l,1500)
    print("S4/5:",await g.ev("JSON.stringify({s:V6.X().session,recaps:Object.keys(V6.X().recaps),day:V6.X().day,lvl:STATE.level})"))
    # ---------------- Session 5
    for js,l in [("await warp('constab',6,7)","->constab"),("await TALK.doris()","report"),("await warp('apoth',6,7)","->apoth"),("await TALK.morgan()","destroy hex"),("await TALK.morgan()","effigy"),
        ("await warp('village',16,27)","->square"),("await TALK.weaselStare()","weasels"),("await warp('books',6,7)","->books"),("await TALK.eleanor()","effigy→manor"),("await TALK.eleanor()","green queen?"),
        ("await warp('inn',14,5)","->inn"),("await TALK.randallInn()","randall"),("await warp('village',8,12)","->hill"),("await TALK.oldRusty()","rusty warning"),("await TALK.jenkins()","jenkins"),("await EVENTS.crookedArrival()","CROOKED MAN → S5 wrap")]:
        await run(g,js,l)
    # ---------------- Session 6
    for js,l in [("await TALK.portraits()","portraits"),("await TALK.peacockStatue()","peacock (look closer)"),("await TALK.ouija()","ouija"),("await TALK.petunia()","petunia1"),("await TALK.pantry()","pantry"),("await TALK.petunia()","petunia2"),
        ("await TALK.ovenDoor()","oven (look closer)"),("await TALK.feastTable()","feast"),("await TALK.harpsichord()","HARPSICHORD → S6 wrap")]:
        await run(g,js,l,1400)
    # ---------------- Session 7
    for js,l in [("await TALK.mirror()","mirror"),("await warp('house2',9,14,'up')","->floor2"),("await TALK.grandfatherClock()","clock"),("await TALK.sally()","sally"),("await TALK.childBeds()","beds"),("await TALK.toyBox()","toybox"),
        ("await TALK.bedroomWindow()","lurker"),("await TALK.bathroom()","bath (look closer)"),("await TALK.lockedJournal()","journal"),("await TALK.suitBed()","jasper"),("await TALK.balconyDoor()","balcony")]:
        await run(g,js,l,1400)
    await idle(g,2500,"S7 wrap prompt")
    print("S7:",await g.ev("JSON.stringify({s:V6.X().session,recaps:Object.keys(V6.X().recaps)})"))
    # ---------------- Session 8
    for js,l in [("await warp('house3',7,10,'right')","->floor3"),("await TALK.taxidermyBear()","bear (look closer)"),("await TALK.trophies()","trophies"),("await TALK.whisp()","whisp"),("await TALK.libraryBooks()","library"),
        ("await TALK.crib()","crib"),("await TALK.trapdoor()","trapdoor"),("await TALK.runeDoor()","runes"),("await TALK.cloakedFigure()","VESSLA → S8 wrap → arcade")]:
        await run(g,js,l,2400)
    print("S8:",await g.ev("JSON.stringify({s:V6.X().session,recaps:Object.keys(V6.X().recaps),lvl:STATE.level,scored:V6.X().scored,hs:loadHS().length})"))
    await g.shot("30_between")
    # ---------------- Between Sessions
    for js,l in [("await warp('village',15,24)","->square"),("DAY.trouble()","walk-up spawn")]:
        await run(g,js,l)
    for i in range(40):
        a=await g.ev("VISITORS.length?[VISITORS[0].x,VISITORS[0].y,STATE.x,STATE.y]:null")
        if not a: break
        await settle(g,"walkup");await g.pg.wait_for_timeout(300)
    await run(g,"await sleep(10)","walk-up done")
    await run(g,"DAY.call()","party call")
    await run(g,"await warp('village',15,24);DAY.roamer();await sleep(50);const v=VISITORS.find(v=>v.kind==='roamer');if(v)await visTalk(v)","night roamer")
    await run(g,"DAY.find('caster');await sleep(50);const v=VISITORS.find(v=>v.kind==='find');if(v)await visTalk(v)","go-find caster")
    for js,l in [("await warp('post',6,7)","->post"),("await TALK.theodora()","mailbox"),("await warp('barber',6,7)","->barber"),("await TALK.randallShop()","randall lift"),
        ("await warp('books',6,7)","->books"),("await TALK.eleanor()","eleanor report"),("await warp('school',6,7)","->school"),("await TALK.finneasSchool()","finneas ask"),
        ("await warp('village',24,37)","->taylor"),("await warp('taylor',5,6)","->farmhouse"),("await TALK.taylorTable()","taylor note"),
        ("await warp('apoth',6,7)","->apoth"),("await TALK.morgan()","memory's rest"),("await warp('inn',14,5)","->inn"),("await TALK.alda()","alda cook"),("await TALK.alda()","alda bard"),
        ("await TALK.innRest()","rest (day+1)"),("await warp('village',12,13)","->rusty"),("await TALK.oldRusty()","rusty 1"),("await warp('tailor',6,7)","->tailor"),("await TALK.thomasin()","belt order"),
        ("await warp('inn',14,5)","->inn"),("await TALK.innRest()","rest (day+2)"),("await warp('village',12,13)","->rusty"),("await TALK.oldRusty()","rusty 2"),("await warp('tailor',6,7)","->tailor"),("await TALK.thomasin()","belt pickup"),
        ("await warp('school',6,7)","->school"),("await TALK.finneasSchool()","grey notes"),("await warp('inn',14,5)","->inn"),("await TALK.innRest()","rest (day+3)"),("await warp('village',12,13)","->rusty"),("await TALK.oldRusty()","rusty 3"),
        ("await warp('bakery',6,7)","->bakery"),("V6.X().phase=3;await TALK.bakeryCellar()","bakery at night"),("await warp('post',6,7)","->post"),("await TALK.cubbies()","mailbox letter"),
        ("await warp('village',8,11)","->manor gate"),("await TALK.walterManor()","DINNER → arcade")]:
        await run(g,js,l,1500)
    print("END:",await g.ev("JSON.stringify({s:V6.X().session,day:V6.X().day,dinner:hasF('dinnerDone'),scored:V6.X().scored,hs:loadHS().map(e=>[e.i,e.s,e.g,e.arc]),dt:DOWNTIME_TASKS.map(t=>t.id+':'+taskDone(t)).join(' ')})"))
    print("SCORE:",await g.ev("JSON.stringify(V6.finalScore())"))
    print("X:",await g.ev("JSON.stringify({heard:V6.X().heard,best:V6.X().best,calls:V6.X().calls,look:V6.X().look,promises:Object.values(V6.X().promises).map(p=>(p.kept?'✓':'○')+p.id),standing:V6.X().standing,gloss:Object.keys(V6.X().gloss).length,notes:V6.X().notes.length,recaps:V6.X().recaps,honest:V6.X().honest})"))
    await g.shot("31_end")
    errs=[e for e in g.errs if "PAGEERR" in e or "console:" in e]
    print("\n".join(errs[:30]) or "no errors")
    await g.close()
asyncio.run(main())

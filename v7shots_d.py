import asyncio,sys
from pw import G
async def main():
    g=G();await g.start()
    await g.pg.reload();await g.pg.wait_for_timeout(3500)
    await g.key("z");await g.pg.wait_for_timeout(500);await g.key("z");await g.pg.wait_for_timeout(2000)
    await g.mash("!DLG_OPEN&&!MODAL",30)
    await g.ev("STATE.god=true;STATE.fast=true")
    await g.ev("void V6.applySessionPreset(3)")
    for i in range(30):
        if await g.ev("!!document.getElementById('scGo')"): break
        await g.ev("if(MODAL&&!document.getElementById('scGo'))closeModal()");await g.pg.wait_for_timeout(300)
    await g.pg.wait_for_timeout(600);await g.shot("d7_01_session_card")
    await g.ev("document.getElementById('scGo').click()");await g.pg.wait_for_timeout(1500)
    for i in range(8):
        await g.ev("if(MODAL)closeModal();else if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(300)
    await g.pg.wait_for_timeout(1500);await g.shot("d7_02_village")
    await g.ev("V7.opt.trkOpen=1;TRK.last=''");await g.pg.wait_for_timeout(600);await g.shot("d7_03_village_trk")
    for t in ["party","session","journal","bestiary","badges","system","items","ledger"]:
        await g.ev(f"if(MODAL)closeModal();openMenu('{t}')");await g.pg.wait_for_timeout(500);await g.shot("d7_m_"+t)
    await g.ev("closeModal();Object.keys(MON).forEach(seeMon)");await g.ev("openMenu('bestiary')");await g.pg.wait_for_timeout(500);await g.shot("d7_m_bestiary_full")
    await g.ev("closeModal();openTravel(true)");await g.pg.wait_for_timeout(500);await g.shot("d7_travel")
    await g.ev("closeModal();void minigame('liarsdice',{})");await g.pg.wait_for_timeout(1500);await g.shot("d7_mg_liars")
    await g.key("Escape");await g.pg.wait_for_timeout(300)
    await g.ev("mgClose();HANDLERS.length=0;SCRIPT.running=false")
    await g.ev("rollCredits()");await g.pg.wait_for_timeout(9000);await g.shot("d7_credits1");await g.pg.wait_for_timeout(14000);await g.shot("d7_credits2")
    print("\n".join([e for e in g.errs][:20]) or "no errors")
    await g.close()
asyncio.run(main())

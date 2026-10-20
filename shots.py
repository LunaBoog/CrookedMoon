import asyncio
from pw import G
async def main():
    g=G();await g.start()
    await g.ev("localStorage.setItem('cm_hiscores',JSON.stringify([{i:'MOO',s:16420,g:'S',ch:'Lucky',t:1,d:'2026-09-30',arc:'Sessions 1–8'},{i:'AZR',s:12100,g:'A',ch:'Azareth',t:2,d:'2026-09-30',arc:'Through Dinner'}]))")
    await g.pg.reload();await g.pg.wait_for_timeout(2500)
    await g.shot("40_title")
    await g.newgame();await g.mash("!DLG_OPEN",20)
    await g.ev("STATE.god=true;STATE.fast=true")
    await g.ev("void V6.applySessionPreset(3)")
    for i in range(30):
        if await g.ev("!!document.getElementById('scGo')"): break
        await g.ev("if(MODAL&&!document.getElementById('scGo'))closeModal()");await g.pg.wait_for_timeout(300)
    await g.shot("41_session_card")
    await g.ev("document.getElementById('scGo').click()");await g.pg.wait_for_timeout(600)
    await g.ev("V6.X().explained={};V6.X().phase=2");await g.pg.wait_for_timeout(300)
    await g.shot("42_village_dusk")
    await g.ev("DAY.trouble()");await g.pg.wait_for_timeout(1500)
    await g.shot("43_walkup_coming")
    await g.pg.wait_for_timeout(5000)
    await g.shot("44_walkup_dialog")
    for i in range(3):
        await g.ev("if(MODAL&&document.getElementById('exOk'))document.getElementById('exOk').click()");await g.pg.wait_for_timeout(300)
    await g.shot("45_walkup_dialog2")
    for i in range(12):
        await g.ev("if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(250)
    await g.shot("46_after_walkup")
    await g.ev("closeModal();V6.X().phase=3;DAY.roamer()");await g.pg.wait_for_timeout(800)
    await g.shot("47_night_roamer")
    await g.ev("void runScript(async()=>{const v=VISITORS.find(v=>v.kind==='roamer');if(v)await visTalk(v);})");await g.pg.wait_for_timeout(700)
    for i in range(6):
        await g.ev("if(MODAL&&document.getElementById('exOk'))document.getElementById('exOk').click();else if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(400)
    await g.pg.wait_for_timeout(1200);await g.shot("48_attitude")
    await g.ev("closeModal()");await g.pg.wait_for_timeout(300)
    for i in range(20):
        await g.ev("if(MODAL)closeModal();else if(DLG_OPEN)keyPress('A');else if(BATTLE.on)keyPress('A')");await g.pg.wait_for_timeout(200)
    await g.ev("void runScript(()=>openMenu('session'))");await g.pg.wait_for_timeout(600);await g.shot("49_menu_session")
    await g.ev("closeModal();openMenu('ledger')");await g.pg.wait_for_timeout(500);await g.shot("50_menu_ledger")
    await g.ev("closeModal();openMenu('glossary')");await g.pg.wait_for_timeout(500);await g.shot("51_menu_glossary")
    await g.ev("closeModal();openMenu('journal')");await g.pg.wait_for_timeout(500);await g.shot("52_menu_journal")
    await g.ev("closeModal()")
    await g.ev("void runScript(()=>V6.sessionBreak(3))");await g.pg.wait_for_timeout(3000)
    for i in range(3):
        await g.ev("if(document.getElementById('exOk'))document.getElementById('exOk').click()");await g.pg.wait_for_timeout(400)
    await g.shot("53_recap_composer")
    for i in range(20):
        if await g.ev("!!document.getElementById('rcSend')"): break
        await g.pg.wait_for_timeout(300)
    await g.shot("53_recap_composer")
    await g.ev("document.querySelectorAll('#rcItems .rcit').forEach((b,i)=>{if(i%2===0)b.click()});document.getElementById('rcSend').click()");await g.pg.wait_for_timeout(500)
    await g.shot("54_recap_reply")
    await g.ev("document.getElementById('rcNext').click()");await g.pg.wait_for_timeout(600)
    await g.shot("55_questlog")
    await g.ev("const b=document.querySelector('#qlHon [data-h]');if(b)b.click()");await g.pg.wait_for_timeout(300)
    await g.ev("document.getElementById('modal').scrollTop=99999");await g.pg.wait_for_timeout(200);await g.shot("56_questlog_bottom")
    await g.ev("document.getElementById('qlGo').click()");await g.pg.wait_for_timeout(1500)
    await g.shot("57_next_session_card")
    await g.ev("closeModal()");await g.pg.wait_for_timeout(300)
    await g.ev("void V6.applySessionPreset(6)")
    for i in range(30):
        if await g.ev("!!document.getElementById('scGo')"): break
        await g.ev("if(MODAL&&!document.getElementById('scGo'))closeModal()");await g.pg.wait_for_timeout(300)
    await g.ev("document.getElementById('scGo').click()");await g.pg.wait_for_timeout(600)
    await g.ev("V6.X().explained={};void runScript(()=>TALK.peacockStatue())");await g.pg.wait_for_timeout(1500)
    await g.ev("if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(700);await g.ev("if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(700)
    await g.shot("58_explainer_look")
    await g.ev("if(document.getElementById('exOk'))document.getElementById('exOk').click()");await g.pg.wait_for_timeout(600)
    await g.shot("59_lookcloser")
    await g.ev("closeModal()");await g.pg.wait_for_timeout(500)
    await g.ev("void runScript(()=>DAY.call())");await g.pg.wait_for_timeout(1500)
    for i in range(3):
        await g.ev("if(document.getElementById('exOk'))document.getElementById('exOk').click();");await g.pg.wait_for_timeout(300)
    await g.ev("if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(300)
    await g.shot("60_partycall")
    for i in range(10):
        await g.ev("if(MODAL)closeModal();else if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(250)
    await g.ev("void V6.showArcade('Sessions 1–8')");await g.pg.wait_for_timeout(4500)
    await g.shot("61_arcade")
    await g.pg.keyboard.type("MOO");await g.pg.keyboard.press("Enter");await g.pg.wait_for_timeout(800)
    await g.shot("62_arcade_board")
    await g.ev("document.getElementById('arBack').click()")
    # mobile
    await g.pg.set_viewport_size({"width":390,"height":844});await g.pg.wait_for_timeout(500)
    await g.ev("void V6.applySessionPreset(9)")
    for i in range(30):
        if await g.ev("!!document.getElementById('scGo')"): break
        await g.ev("if(MODAL&&!document.getElementById('scGo'))closeModal()");await g.pg.wait_for_timeout(300)
    await g.shot("63_mobile_between_card")
    await g.ev("closeModal()");await g.pg.wait_for_timeout(500);await g.shot("64_mobile_world")
    await g.ev("void runScript(()=>openMorning())");await g.pg.wait_for_timeout(800);await g.shot("65_mobile_morning")
    await g.ev("closeModal();void V6.showArcade(null)");await g.pg.wait_for_timeout(4000);await g.shot("66_mobile_arcade")
    print("\n".join([e for e in g.errs if 'PAGEERR' in e][:10]) or "no errors")
    await g.close()
asyncio.run(main())

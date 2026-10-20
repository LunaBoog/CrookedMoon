import asyncio,sys
from pw import G
async def main():
    g=G();await g.start()
    await g.pg.reload();await g.pg.wait_for_timeout(3500)
    await g.key("z");await g.pg.wait_for_timeout(500);await g.key("z");await g.pg.wait_for_timeout(2000)
    await g.mash("!DLG_OPEN&&!MODAL",30)
    await g.ev("STATE.god=true")
    await g.ev("void runScript(()=>battle('wolves'))");await g.pg.wait_for_timeout(300);await g.shot("b7_00_intro")
    await g.pg.wait_for_timeout(1500);await g.shot("b7_01_start")
    for i in range(40):
        st=await g.ev("[BATTLE.on, document.getElementById('bmenu').style.display, !!document.getElementById('vic7').classList.contains('on'), BATTLE.dice&&BATTLE.dice.spin]")
        if not st[0]: break
        if st[2]:
            await g.shot("b7_09_victory");await g.key("z");await g.pg.wait_for_timeout(800);continue
        if st[1]=="block":
            await g.shot("b7_02_menu_%d"%i)
            await g.key("z");await g.pg.wait_for_timeout(200);await g.key("z")
            await g.pg.wait_for_timeout(350);await g.shot("b7_03_dice_%d"%i)
            await g.pg.wait_for_timeout(700);await g.shot("b7_04_hit_%d"%i)
        else:
            await g.pg.wait_for_timeout(400)
            if i%5==0: await g.shot("b7_05_foe_%d"%i)
    print("\n".join([e for e in g.errs][:20]) or "no errors")
    await g.close()
asyncio.run(main())

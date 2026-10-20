import asyncio,sys
from pw import G
async def main():
    g=G();await g.start()
    await g.pg.reload();await g.pg.wait_for_timeout(3500)
    await g.key("z");await g.pg.wait_for_timeout(500);await g.key("z");await g.pg.wait_for_timeout(2000)
    await g.mash("!DLG_OPEN&&!MODAL",30)
    await g.ev("STATE.god=true")
    enc=sys.argv[1] if len(sys.argv)>1 else 'wolves'
    await g.ev(f"void runScript(()=>battle('{enc}'))");await g.pg.wait_for_timeout(500);await g.shot("c7_00_pre")
    await g.pg.wait_for_timeout(1700);await g.shot("c7_01_start")
    for i in range(60):
        st=await g.ev("[BATTLE.on, document.getElementById('bmenu').style.display, !!document.getElementById('vic7').classList.contains('on')]")
        if not st[0]: break
        if st[2]:
            await g.pg.wait_for_timeout(900);await g.shot("c7_09_victory");await g.key("z");await g.pg.wait_for_timeout(800);continue
        if st[1]=="block":
            await g.ev("BATTLE.foes.forEach(f=>{if(f.hp>3)f.hp=Math.max(3,f.hp-12)})")
            if i<6: await g.shot("c7_02_menu_%d"%i)
            await g.key("z");await g.pg.wait_for_timeout(150);await g.key("z")
            await g.pg.wait_for_timeout(700);
            if i<12: await g.shot("c7_03_dice_%d"%i)
            await g.pg.wait_for_timeout(500);
            if i<12: await g.shot("c7_04_hit_%d"%i)
        else:
            await g.key("z");await g.pg.wait_for_timeout(300)
    await g.pg.wait_for_timeout(1000);await g.shot("c7_10_after")
    print("\n".join([e for e in g.errs][:20]) or "no errors")
    await g.close()
asyncio.run(main())

import asyncio,sys
from pw import G
async def main():
    g=G();await g.start()
    await g.pg.reload();await g.pg.wait_for_timeout(600);await g.shot("v7_00_loading")
    await g.pg.wait_for_timeout(3000);await g.shot("v7_01_title")
    await g.pg.wait_for_timeout(9000);await g.shot("v7_02_title_later")
    await g.key("z");await g.pg.wait_for_timeout(600);await g.shot("v7_03_charselect")
    await g.key("ArrowLeft",2);await g.pg.wait_for_timeout(400);await g.shot("v7_03b_charselect_lucky")
    await g.key("z");await g.pg.wait_for_timeout(2500);await g.shot("v7_04_intro")
    for i in range(3):
        await g.key("z");await g.pg.wait_for_timeout(1500)
    await g.shot("v7_05_intro2")
    for i in range(4):
        await g.key("z");await g.pg.wait_for_timeout(700)
    await g.shot("v7_06_controls")
    await g.ev("if(MODAL)closeModal()");await g.pg.wait_for_timeout(500)
    await g.hold("ArrowRight",900);await g.hold("ArrowUp",500);await g.pg.wait_for_timeout(500);await g.shot("v7_07_station")
    print("\n".join([e for e in g.errs][:20]) or "no errors")
    await g.close()
asyncio.run(main())

import asyncio,sys
from pw import G
async def main():
    g=G();await g.start()
    if len(sys.argv)>1: await g.pg.set_viewport_size({"width":int(sys.argv[1]),"height":int(sys.argv[2])})
    pre=sys.argv[3] if len(sys.argv)>3 else "hd"
    await g.pg.wait_for_timeout(500)
    await g.newgame();await g.mash("!DLG_OPEN",30)
    print(await g.ev("[RS,VSCALE,document.getElementById('world').width,devicePixelRatio]"))
    await g.ev("closeModal&&MODAL&&closeModal()")
    await g.ev("void runScript(async()=>{await warp('station',15,6,'down');})");await g.pg.wait_for_timeout(1200)
    await g.shot(pre+"_01_station")
    await g.ev("STATE.keys.ticket=1;void runScript(()=>cutscene_trainArrives())");await g.pg.wait_for_timeout(1500)
    await g.ev("keyPress('A')");await g.pg.wait_for_timeout(2500);await g.shot(pre+"_02_cine_a")
    await g.pg.wait_for_timeout(2600);await g.shot(pre+"_03_cine_b")
    for i in range(10):
        if await g.ev("!!STAGE.train"): break
        await g.ev("if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(300)
    await g.pg.wait_for_timeout(1500);await g.shot(pre+"_04_pulling")
    await g.pg.wait_for_timeout(3200);await g.shot(pre+"_05_stopped")
    await g.ev("if(DLG_OPEN)keyPress('A')");await g.pg.wait_for_timeout(600);await g.shot(pre+"_06_vagrant")
    for m,x,y in [("car_passenger",10,3),("car_mail",8,3),("car_dining",9,3),("car_lounge",9,3),("village",14,25),("house1",8,16),("wytchwood",6,10),("founders",8,8)]:
        await g.ev(f"if(MODAL)closeModal();DLG_OPEN&&keyPress('A')")
        await g.ev(f"SCRIPT.running=false;lockInput(false);STAGE.train=null;STAGE.cine=null;void warp('{m}',{x},{y},'down')");await g.pg.wait_for_timeout(1400)
        await g.ev("if(MODAL)closeModal()");await g.pg.wait_for_timeout(300)
        await g.shot(pre+"_m_"+m)
    print("\n".join(g.errs[:20]))
    await g.close()
asyncio.run(main())

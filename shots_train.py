import asyncio,sys
from pw import G
async def main():
    g=G();await g.start()
    if len(sys.argv)>1: await g.pg.set_viewport_size({"width":int(sys.argv[1]),"height":int(sys.argv[2])})
    pre=sys.argv[3] if len(sys.argv)>3 else "tr"
    await g.newgame();await g.mash("!DLG_OPEN",30)
    await g.ev("void runScript(async()=>{await warp('station',15,6,'down');STATE.keys.ticket=1;await trainPullsIn();})");
    await g.pg.wait_for_timeout(2400);await g.shot(pre+"_a")
    await g.pg.wait_for_timeout(1300);await g.shot(pre+"_b")
    await g.pg.wait_for_timeout(1800);await g.shot(pre+"_c")
    print("\n".join(g.errs[:20]))
    await g.close()
asyncio.run(main())

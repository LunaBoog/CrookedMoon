import asyncio
from pw import G
async def main():
    g=G();await g.start()
    await g.shot("v6_title")
    await g.newgame();await g.mash("!DLG_OPEN",20)
    print(await g.ev("[STATE.v6.session,STATE.v6.day,document.getElementById('hudSess').textContent]"))
    await g.shot("v6_start")
    print("\n".join(g.errs[:30]) or "no errors")
    await g.close()
asyncio.run(main())

import asyncio,json
from pw import G
async def main():
    g=G();await g.start()
    await g.newgame();await g.mash("!DLG_OPEN",20)
    # fabricate a v5-style mid-game save (no v6 block) at Session 5-ish
    await g.ev("void applyPreset('Ch.4 · Up the hill')");await g.pg.wait_for_timeout(2500)
    await g.mash("!MODAL&&!DLG_OPEN&&!SCRIPT.running",40);await g.pg.wait_for_timeout(1500)
    await g.ev("const s=JSON.parse(JSON.stringify(STATE));delete s.v6;sset('save',JSON.stringify(s))")
    await g.pg.reload();await g.pg.wait_for_timeout(2500)
    await g.key("z");await g.pg.wait_for_timeout(2500)
    print(await g.ev("JSON.stringify({map:STATE.map,session:STATE.v6.session,day:STATE.v6.day,pill:document.getElementById('hudSess').textContent,obj:objective()&&objective().text})"))
    print("\n".join([e for e in g.errs if 'PAGEERR' in e][:5]) or "no errors")
    await g.close()
asyncio.run(main())

import asyncio
from playwright.async_api import async_playwright
async def main():
    p=await async_playwright().start();b=await p.chromium.launch()
    ctx=await b.new_context(viewport={"width":390,"height":844},device_scale_factor=3,is_mobile=True,has_touch=True)
    pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto("file:///home/claude/cm/build/crooked-moon-gb.html");await pg.wait_for_timeout(2500)
    await pg.evaluate("localStorage.clear()")
    await pg.keyboard.press("z");await pg.wait_for_timeout(400);await pg.keyboard.press("z");await pg.wait_for_timeout(1500)
    for i in range(30):
        if not await pg.evaluate("DLG_OPEN||!!MODAL"):break
        await pg.keyboard.press("Escape" if await pg.evaluate("!!MODAL") else "z");await pg.wait_for_timeout(200)
    print(await pg.evaluate("[RS,VSCALE,document.getElementById('world').width]"))
    await pg.evaluate("void warp('car_passenger',10,3,'down')");await pg.wait_for_timeout(1500)
    await pg.screenshot(path="shots/m_car.png")
    # fps probe
    fps=await pg.evaluate("new Promise(r=>{let n=0,t0=performance.now();function f(){n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2);}requestAnimationFrame(f);})")
    print("fps",fps)
    await pg.evaluate("void runScript(()=>battle('shroudpass'))");await pg.wait_for_timeout(2500)
    await pg.screenshot(path="shots/m_battle.png")
    print(errs[:5]);await b.close();await p.stop()
asyncio.run(main())

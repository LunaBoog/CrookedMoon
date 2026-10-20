import asyncio
from playwright.async_api import async_playwright
class G:
    async def start(self,fresh=True):
        self.p=await async_playwright().start()
        self.b=await self.p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        self.pg=await self.b.new_page(viewport={"width":1280,"height":860})
        self.errs=[]
        self.pg.on("pageerror",lambda e:self.errs.append("PAGEERR "+str(e)+" | "+str(getattr(e,"stack",""))[:600]))
        self.pg.on("console",lambda m:self.errs.append("console:"+m.text) if m.type in("error","warning") else None)
        await self.pg.goto("file:///home/claude/cm/build/crooked-moon-gb.html")
        await self.pg.wait_for_timeout(2200)
        if fresh: await self.pg.evaluate("localStorage.clear()")
    async def key(self,k,n=1,wait=120):
        for i in range(n):
            await self.pg.keyboard.press(k);await self.pg.wait_for_timeout(wait)
    async def hold(self,k,ms):
        await self.pg.keyboard.down(k);await self.pg.wait_for_timeout(ms);await self.pg.keyboard.up(k)
    async def ev(self,js): return await self.pg.evaluate(js)
    async def shot(self,name): await self.pg.screenshot(path="shots/"+name+".png")
    async def mash(self,cond_js,maxn=200,wait=180,k="z"):
        for i in range(maxn):
            st=await self.ev("["+cond_js+",!!MODAL]")
            if st[0]: return True
            await self.pg.keyboard.press("Escape" if st[1] else k);await self.pg.wait_for_timeout(wait)
        return False
    async def newgame(self,lead=3):
        await self.key("z");await self.pg.wait_for_timeout(400)
        await self.key("z");await self.pg.wait_for_timeout(1800)
        for i in range(40):
            st=await self.ev("[DLG_OPEN,!!MODAL,SCRIPT.running]")
            if not st[0] and not st[1] and not st[2]: break
            await self.pg.keyboard.press("Escape" if st[1] else "z");await self.pg.wait_for_timeout(250)
    async def close(self):
        await self.b.close();await self.p.stop()

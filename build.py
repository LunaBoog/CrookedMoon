import json,glob,subprocess,sys,os
grids={}
for n in ['wreckage','darkwood','wytchwood','marsh']:
    grids[n]=[l.rstrip('\n') for l in open('grids/%s.txt'%n) if l.strip()]
js='"use strict";\nconst GRIDS='+json.dumps(grids)+';\n'
for f in sorted(glob.glob('js/*.js')):
    s=open(f).read()
    if s.startswith('"use strict";'): s=s[len('"use strict";'):]
    js+='\n'+s
open('build/game.js','w').write(js)
r=subprocess.run(['node','--check','build/game.js'],capture_output=True,text=True)
if r.returncode: print(r.stderr[:3000]); sys.exit(1)
shell=open('shell.html').read()
assets=open('build/assets.js').read()
if os.path.exists('build/assets_v8.js'):
    # v8: the 64/120px portrait+monster+PC art is superseded by assets_v8.js — strip it
    _A=json.loads(assets[len('window.ASSETS='):].rstrip().rstrip(';'))
    for _k in ('por','mon','pc'): _A[_k]={}
    assets='window.ASSETS='+json.dumps(_A)+';'
a8=open('build/assets_v8.js').read() if os.path.exists('build/assets_v8.js') else ''
v8css=open('css/v8.css').read() if os.path.exists('css/v8.css') else ''
v7css=open('css/v7.css').read()
out=shell.replace('/*__FONTS__*/',open('build/fonts_v7.css').read()).replace('/*__V7CSS__*/',v7css).replace('/*__V8CSS__*/',v8css).replace('/*__ASSETS8__*/',a8).replace('/*__ASSETS7__*/',open('build/assets_v7.js').read()).replace('/*__ASSETS__*/',assets).replace('/*__SCRIPT__*/',js.replace('</script>','<\\/script>'))
open('build/crooked-moon-gb.html','w').write(out)
# re-extract & check
import re
m=re.findall(r'<script>([\s\S]*?)</script>',out)
open('build/_check.js','w').write(m[-1])
r=subprocess.run(['node','--check','build/_check.js'],capture_output=True,text=True)
print('embedded check', 'OK' if r.returncode==0 else r.stderr[:500])
print('size MB',round(len(out)/1e6,2),'script KB',len(js)//1024)

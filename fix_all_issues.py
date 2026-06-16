"""Final clean fix for chromaticity-demo.html tooltip."""
import re

path = r'E:\公众号\opticskit\public\tools\chromaticity-demo.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find 2nd <script> (JS code)
first_end = html.index('</script>') + len('</script>')
sec_start = html.index('<script>', first_end) + len('<script>')
sec_end = html.index('</script>', sec_start)
pre = html[:sec_start]
post = html[sec_end:]
js = html[sec_start:sec_end]

# ====== 1. Add D65 to illPoints ======
# The D65 whitepoint is drawn separately. Add it to _illPoints right after drawing.
# Find: "ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.stroke();}\n\n  if(1)"
d65_old = "ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.stroke();}\n\n  if(1)"
assert d65_old in js
d65_new = "ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.stroke();window._illPoints.push({x:wp[0],y:wp[1],name:'D65 标准光源 6500K'});}\n\n  if(1)"
js = js.replace(d65_old, d65_new)

# ====== 2. Add tooltip rendering in draw() ======
# Insert before "function drawMacAdam"
drw_old = '}\n\nfunction drawMacAdam'
assert drw_old in js
drw_new = '  if(window._illTooltip){var t=window._illTooltip;ctx.font="11px sans-serif";var tw=ctx.measureText(t.text).width;ctx.fillStyle="rgba(0,0,0,0.88)";ctx.fillRect(t.x-tw/2-6,t.y-28,tw+12,20);ctx.strokeStyle="#666";ctx.lineWidth=1;ctx.strokeRect(t.x-tw/2-6,t.y-28,tw+12,20);ctx.fillStyle="#fff";ctx.fillText(t.text,t.x-tw/2,t.y-12);}\n}\n\nfunction drawMacAdam'
js = js.replace(drw_old, drw_new)

# ====== 3. Add tooltip detection in updateHover ======
# Insert after hoverInfo.classList.add('on')
hov_old = "hoverInfo.classList.add('on');"
assert hov_old in js
hov_new = "hoverInfo.classList.add('on');window._illTooltip=null;{var ihit=null,imind=64;var icr=canvas.getBoundingClientRect();for(var ih=0;ih<(window._illPoints||[]).length;ih++){var ihp=window._illPoints[ih];var idx2=(mouseCache.cx-icr.left)-ihp.x,idy2=(mouseCache.cy-icr.top)-ihp.y;var id2=idx2*idx2+idy2*idy2;if(id2<imind){imind=id2;ihit=ihp;}}if(ihit){window._illTooltip={x:ihit.x,y:ihit.y,text:ihit.name};draw();}}"
js = js.replace(hov_old, hov_new)

# ====== 4. Remove old bad DOM-modifying illPoints blocks ======
# These blocks are: {var hit=null,minD=64;...} and they modify DOM (getElementById)
# They appear directly after our tooltip detection in the same line
# Pattern: after "draw();}}" we have blocks like "{var hit=null,minD=64;..."
# Need to remove them without breaking balance

# The bad blocks are all in the form:
# {var hit=null,minD=64;var cr=...getElementById('h-xy').textContent=hit.name...
# Remove any block starting with {var hit=null,minD=64 that contains getElementById
# Use a regex to find and remove them

bad_re = re.compile(r'\{var hit=null,minD=64;.*?getElementById\([^)]*hit\.name[^}]*\}')
# Count matches
matches = list(bad_re.finditer(js))
print(f'Bad blocks found: {len(matches)}')
# Remove them in reverse
for m in reversed(matches):
    js = js[:m.start()] + js[m.end():]

# ====== 5. mouseleave cleanup ======
ml_old = "mouseCache=null;}"
assert ml_old in js
ml_new = "mouseCache=null;window._illTooltip=null;draw();}"
js = js.replace(ml_old, ml_new)

# ====== Verify ======
b = js.count('{') - js.count('}')
p = js.count('(') - js.count(')')
print(f'Brace:{b} Paren:{p}')
assert b == 0 and p == 0, f'UNBALANCED'

# ====== Double-check illPoints loop is intact ======
assert 'for(var ii=0;ii<illuminants.length;ii++)' in js, 'illPoints loop missing!'

result = pre + js + post
with open(path, 'w', encoding='utf-8') as f:
    f.write(result)
print('OK')

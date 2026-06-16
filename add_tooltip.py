import re

with open(r'E:\公众号\opticskit\public\tools\chromaticity-demo.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the 2nd <script> tag (the JS code, not the data)
first_script_end = html.index('</script>') + len('</script>')
rest = html[first_script_end:]
second_script_start = rest.index('<script>') + len('<script>') + first_script_end
second_script_end = html.index('</script>', second_script_start)

pre = html[:second_script_start]
post = html[second_script_end:]
js = html[second_script_start:second_script_end]

print(f'JS length: {len(js)}')

# ====== 1: Add illTooltip rendering at end of draw() ======
old1 = '}\n\nfunction drawMacAdam'
assert old1 in js, f'old1 not found'
new1 = '  if(window._illTooltip){var t=window._illTooltip;ctx.font="11px sans-serif";var tw=ctx.measureText(t.text).width;ctx.fillStyle="rgba(0,0,0,0.88)";ctx.fillRect(t.x-tw/2-6,t.y-28,tw+12,20);ctx.strokeStyle="#666";ctx.lineWidth=1;ctx.strokeRect(t.x-tw/2-6,t.y-28,tw+12,20);ctx.fillStyle="#fff";ctx.fillText(t.text,t.x-tw/2,t.y-12);}\n}\n\nfunction drawMacAdam'
js = js.replace(old1, new1, 1)

# ====== 2: Add illTooltip detection ======
old2 = "hoverInfo.classList.add('on');"
assert old2 in js, f'old2 not found'
new2 = "hoverInfo.classList.add('on');window._illTooltip=null;{var ihit=null,imind=64;var icr=canvas.getBoundingClientRect();for(var ih=0;ih<(window._illPoints||[]).length;ih++){var ihp=window._illPoints[ih];var idx2=(mouseCache.cx-icr.left)-ihp.x,idy2=(mouseCache.cy-icr.top)-ihp.y;var id2=idx2*idx2+idy2*idy2;if(id2<imind){imind=id2;ihit=ihp;}}if(ihit){window._illTooltip={x:ihit.x,y:ihit.y,text:ihit.name};}}"
js = js.replace(old2, new2, 1)

# ====== 3: Add cleanup in mouseleave ======
old3 = "mouseCache=null;}"
assert old3 in js, f'old3 not found'
new3 = "mouseCache=null;window._illTooltip=null;}"
js = js.replace(old3, new3, 1)

# Verify
b = js.count('{') - js.count('}')
p = js.count('(') - js.count(')')
assert b == 0 and p == 0, f'Brace:{b} Paren:{p}'

new_html = pre + js + post
with open(r'E:\公众号\opticskit\public\tools\chromaticity-demo.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
print(f'OK (Brace:{b} Paren:{p})')

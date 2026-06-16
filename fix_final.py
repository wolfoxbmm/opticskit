import re

# Read current stable version
with open(r'E:\公众号\opticskit\public\tools\chromaticity-demo_stable.html', 'r', encoding='utf-8') as f:
    html = f.read()

first_script_end = html.index('</script>') + len('</script>')
sec_start = html.index('<script>', first_script_end) + len('<script>')
sec_end = html.index('</script>', sec_start)
pre = html[:sec_start]
post = html[sec_end:]
js = html[sec_start:sec_end]

# ====== CHANGE 1: After draw() closing brace, before drawMacAdam, add tooltip rendering ======
old1 = "}\n\nfunction drawMacAdam"
new1 = "  if(window._illTooltip){var t=window._illTooltip;ctx.font=\"11px sans-serif\";var tw=ctx.measureText(t.text).width;ctx.fillStyle=\"rgba(0,0,0,0.88)\";ctx.fillRect(t.x-tw/2-6,t.y-28,tw+12,20);ctx.strokeStyle=\"#666\";ctx.lineWidth=1;ctx.strokeRect(t.x-tw/2-6,t.y-28,tw+12,20);ctx.fillStyle=\"#fff\";ctx.fillText(t.text,t.x-tw/2,t.y-12);}\n}\n\nfunction drawMacAdam"
assert old1 in js
js = js.replace(old1, new1, 1)

# ====== CHANGE 2: Replace whole polluted hoverInfo line with clean illTooltip detection only ======
# The line is: hoverInfo.classList.add('on');{var hit=null,minD=64;......}}}}}}
# Replace with: hoverInfo.classList.add('on');[clean illTooltip detection]

# Find the exact polluted segment
hover_idx = js.index("hoverInfo.classList.add('on');")
# Find where the next "  });}" is (end of the rAF callback)
next_closing = js.index("  });}", hover_idx)
# Extract the polluted section
polluted = js[hover_idx:next_closing]
# Build replacement
replacement = "hoverInfo.classList.add('on');window._illTooltip=null;{var ihit=null,imind=64;var icr=canvas.getBoundingClientRect();for(var ih=0;ih<(window._illPoints||[]).length;ih++){var ihp=window._illPoints[ih];var idx2=(mouseCache.cx-icr.left)-ihp.x,idy2=(mouseCache.cy-icr.top)-ihp.y;var id2=idx2*idx2+idy2*idy2;if(id2<imind){imind=id2;ihit=ihp;}}if(ihit){window._illTooltip={x:ihit.x,y:ihit.y,text:ihit.name};draw();}}"
js = js.replace(polluted, replacement, 1)

# ====== CHANGE 3: mouseleave cleanup ======
old3 = "mouseCache=null;}"
new3 = "mouseCache=null;window._illTooltip=null;draw();}"
assert old3 in js
js = js.replace(old3, new3, 1)

# ====== CHANGE 4: Add D65 to illPoints (after D65 drawing code in draw()) ======
old4 = "ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.stroke();}"
new4 = "ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.stroke();window._illPoints.push({x:wp[0],y:wp[1],name:'D65 标准光源 6500K'});}"
assert old4 in js
js = js.replace(old4, new4, 1)

# Verify
b = js.count('{') - js.count('}')
p = js.count('(') - js.count(')')
print(f'Brace:{b} Paren:{p}')
assert b == 0 and p == 0, f'UNBALANCED'

# Ensure illPoints loop is intact
assert 'for(var ii=0;ii<illuminants.length;ii++)' in js

result = pre + js + post
with open(r'E:\公众号\opticskit\public\tools\chromaticity-demo.html', 'w', encoding='utf-8') as f:
    f.write(result)
print('OK')

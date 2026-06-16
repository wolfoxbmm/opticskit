import re

path = r'E:\公众号\opticskit\public\tools\chromaticity-demo.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find 2nd <script>
idx_data_end = html.index('</script>') + len('</script>')
sec_start = html.index('<script>', idx_data_end) + len('<script>')
sec_end = html.index('</script>', sec_start)
js = html[sec_start:sec_end]

# The crucial fix: after setting _illTooltip, call draw() to render the tooltip
# Find: window._illTooltip={x:ihit.x,y:ihit.y,text:ihit.name};
# Replace with: window._illTooltip={...};draw();
old = 'window._illTooltip={x:ihit.x,y:ihit.y,text:ihit.name};'
new = 'window._illTooltip={x:ihit.x,y:ihit.y,text:ihit.name};draw();'
js = js.replace(old, new)

b = js.count('{') - js.count('}')
p = js.count('(') - js.count(')')
assert b == 0 and p == 0, f'Brace:{b} Paren:{p}'

result = html[:sec_start] + js + html[sec_end:]
with open(path, 'w', encoding='utf-8') as f:
    f.write(result)
print('OK')

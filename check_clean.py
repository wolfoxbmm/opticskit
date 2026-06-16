import re

path = r'E:\公众号\opticskit-prototypes\chromaticity-v2\clean_demo.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

print(f'illPoints: {html.count("_illPoints")}')
print(f'illTooltip: {html.count("illTooltip")}')
print(f'illLabels: {html.count("illLabels")}')

# Find 2nd script
idx1 = html.index('<script>') + len('<script>')
idx2 = html.index('</script>')
sec_start = html.index('<script>', idx2) + len('<script>')
sec_end = html.index('</script>', sec_start)
js = html[sec_start:sec_end]

b = js.count('{') - js.count('}')
p = js.count('(') - js.count(')')
print(f'JS Brace:{b} Paren:{p}')
print(f'JS len:{len(js)}')

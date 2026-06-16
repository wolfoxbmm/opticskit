import re

path = r'E:\公众号\opticskit\public\tools\chromaticity-demo.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Find 2nd <script>
idx_data_end = html.index('</script>') + len('</script>')
sec_start = html.index('<script>', idx_data_end) + len('<script>')
sec_end = html.index('</script>', sec_start)
js = html[sec_start:sec_end]

# Show surrounding context of our bad block deletion
# Find the section around line 248
idx = js.find('hoverInfo.classList.add')
if idx > 0:
    snippet = js[idx:idx+200]
    print(repr(snippet[:200]))
    print('...')
    
# Show the ending
idx_end = js.find('});}')
if idx_end > 0:
    print(repr(js[idx_end-50:idx_end+10]))

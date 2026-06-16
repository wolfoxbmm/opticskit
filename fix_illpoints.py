import re

path = r'E:\公众号\opticskit\public\tools\chromaticity-demo.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

first_script_end = html.index('</script>') + len('</script>')
sec_start = html.index('<script>', first_script_end) + len('<script>')
sec_end = html.index('</script>', sec_start)
pre = html[:sec_start]
post = html[sec_end:]
js = html[sec_start:sec_end]

# The problem is in draw() line ~127: illLabels/illVisible defined 3 times with window._illPoints=[]
# Pattern: after "if(1){" there are 3 identical blocks of "var illLabels=...var illVisible=...window._illPoints=[]"
# Keep only one clear + the final loop

# Find the "if(1){" block
block_start = js.index('if(1){var illOffsets')
# Find the matching closing brace of the entire if(1) block
# Navigate from block_start, counting braces
depth = 0
i = block_start
while i < len(js):
    ch = js[i]
    if ch == '{': depth += 1
    elif ch == '}': 
        depth -= 1
        if depth == 0:
            block_end = i + 1
            break
    i += 1

ill_block = js[block_start:block_end]
print(f'illPoints block length: {len(ill_block)}')

# Rewrite the block cleanly:
# Keep the illOffsets, keep ONE set of illLabels/illVisible, keep the loop
# Remove duplicate illLabels/illVisible definitions

# Extract just the loop part
loop_start = ill_block.rfind('for(var ii=')
if loop_start == -1:
    print('ERROR: loop not found')
    exit(1)
loop_part = ill_block[loop_start:]

# Build clean replacement
clean_block = '''if(1){window._illPoints=[];var illLabels={A:'钨丝灯 2856K',C:'北向日光 6774K',D50:'日光5000K (Adobe白点)',D55:'日光 5500K',D75:'日光 7500K',E:'等能白 5454K'};var illVisible={A:function(){return document.getElementById('show-bb').checked;},C:function(){return document.getElementById('show-bb').checked;},D50:function(){return document.getElementById('show-adobergb').checked;},D55:function(){return document.getElementById('show-bb').checked;},D75:function(){return document.getElementById('show-bb').checked;},E:function(){return document.getElementById('show-bb').checked;}};''' + loop_part

js = js[:block_start] + clean_block + js[block_end:]

# Verify
b = js.count('{') - js.count('}')
p = js.count('(') - js.count(')')
print(f'Brace:{b} Paren:{p}')
assert b == 0 and p == 0

result = pre + js + post
with open(path, 'w', encoding='utf-8') as f:
    f.write(result)
print('OK')

import re
with open(r'E:\公众号\opticskit\public\tools\chromaticity-demo.html','r',encoding='utf-8') as f:
    html = f.read()
m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
if m:
    js = m.group(1)
    b=js.count('{')-js.count('}')
    p=js.count('(')-js.count(')')
    bk=js.count('[')-js.count(']')
    print(f'Brace:{b} Paren:{p} Bracket:{bk}')
else:
    print('no script')

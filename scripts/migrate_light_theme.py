"""批量更新所有工具页面从暗色到浅色主题"""
import os
import re

BASE = r"E:\公众号\opticskit\src\app"

# 需要处理的文件列表
files = [
    os.path.join(BASE, "tools", "chromaticity", "page.tsx"),
    os.path.join(BASE, "tools", "diffraction", "page.tsx"),
    os.path.join(BASE, "tools", "laser", "page.tsx"),
    os.path.join(BASE, "tools", "lens", "page.tsx"),
    os.path.join(BASE, "tools", "light-source", "page.tsx"),
    os.path.join(BASE, "tools", "spectrum", "page.tsx"),
    os.path.join(BASE, "about", "page.tsx"),
]

# 颜色映射 (Tailwind class 替换)
REPLACEMENTS = [
    # Border colors
    ("border-[#1a1a1a]", "border-[#E9ECEF]"),
    ("border-[#27272a]", "border-[#DEE2E6]"),
    ("border-[#333]", "border-[#DEE2E6]"),
    ("border-[#3f3f46]", "border-[#DEE2E6]"),
    # Backgrounds
    ("bg-[#0A0A0A]", "bg-white"),
    ("bg-[#0a0a0a]", "bg-white"),
    ("bg-[#101010]", "bg-[#F8F9FA]"),
    ("bg-[#141414]", "bg-[#F1F3F5]"),
    ("bg-[#18181b]", "bg-[#F8F9FA]"),
    ("bg-[#0A0A0A]/80", "bg-white/80"),
    ("bg-black/70", "bg-white/80"),
    ("bg-black/60", "bg-white/70"),
    # Text colors
    ("text-zinc-100", "text-[#1A1A2E]"),
    ("text-zinc-200", "text-[#1A1A2E]"),
    ("text-zinc-300", "text-[#495057]"),
    ("text-zinc-400", "text-[#495057]"),
    ("text-zinc-500", "text-[#868E96]"),
    ("text-zinc-600", "text-[#ADB5BD]"),
    ("text-zinc-700", "text-[#ADB5BD]"),
    ("text-neutral-200", "text-[#1A1A2E]"),
    ("text-neutral-400", "text-[#868E96]"),
    ("text-neutral-500", "text-[#868E96]"),
    ("text-neutral-600", "text-[#ADB5BD]"),
    ("text-neutral-700", "text-[#ADB5BD]"),
    # Backdrop
    ("backdrop-blur-sm", "backdrop-blur-lg"),
    # Accent adjustments (keep canvas accent colors but adjust surrounding)
    # Header link colors
    ("text-[#00BFFF]", "text-[#228BE6]"),
    ("text-[#00BFFF]", "text-[#228BE6]"),
    ("text-zinc-100", "text-[#1A1A2E]"),
    # "← 工具箱" → "← 首页" 统一
    ("← 工具箱", "← 首页"),
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f"  SKIP (not found): {filepath}")
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  UPDATED: {os.path.basename(os.path.dirname(filepath))}/page.tsx")
    else:
        print(f"  NO CHANGE: {os.path.basename(os.path.dirname(filepath))}/page.tsx")

print("\nDone.")

import re

path = r'E:\公众号\opticskit\src\components\FeedbackWidget.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = '''      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[100] w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200 flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg shadow-black/30"
        title="反馈"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>'''

new = '''      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[100] h-11 px-4 rounded-xl bg-white text-black text-[13px] font-medium flex items-center gap-2 transition-all duration-200 hover:bg-neutral-200 hover:scale-105 shadow-lg shadow-white/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        反馈
      </button>'''

if old not in content:
    # File was corrupted, restore from known good state
    print("File corrupted, restoring...")
    content = '''"use client";

import { useState } from "react";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    const existing = JSON.parse(localStorage.getItem("opticskit_feedback") || "[]");
    existing.push({
      text: text.trim(),
      time: new Date().toISOString(),
      url: window.location.href,
    });
    localStorage.setItem("opticskit_feedback", JSON.stringify(existing));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setText("");
    }, 2000);
  };

  return (
    <>
''' + new + '''

      {open && (
        <div className="fixed bottom-20 right-6 z-[100] w-80 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/50 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-medium text-neutral-200">发送反馈</h3>
            <button onClick={() => setOpen(false)} className="text-neutral-600 hover:text-neutral-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {sent ? (
            <div className="text-center py-6 space-y-2">
              <div className="text-2xl">✓</div>
              <p className="text-[13px] text-neutral-400">感谢反馈！已保存。</p>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Bug 报告 / 功能建议 / 使用体验..."
                rows={4}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-[13px] text-neutral-200 placeholder-neutral-600 outline-none focus:border-neutral-600 resize-none"
              />
              <p className="text-[11px] text-neutral-600">
                反馈保存在浏览器本地。后续版本会支持在线提交。
              </p>
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="w-full py-2 rounded-lg bg-neutral-100 text-black text-[13px] font-medium hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                提交反馈
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
'''

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")

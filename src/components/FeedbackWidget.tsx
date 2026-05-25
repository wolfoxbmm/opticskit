"use client";

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
      {/* Floating button — larger, colored, prominent */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[100] h-12 px-5 rounded-full bg-[#228BE6] text-white text-[14px] font-semibold flex items-center gap-2 transition-all duration-200 hover:bg-[#1c7ed6] hover:scale-105 shadow-lg shadow-[#228BE6]/25 hover:shadow-xl hover:shadow-[#228BE6]/35"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        反馈建议
      </button>

      {open && (
        <div className="fixed bottom-[72px] right-5 z-[100] w-[340px] bg-white border border-[#DEE2E6] rounded-2xl shadow-2xl shadow-black/8 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#1A1A2E]">帮助我们改进</h3>
            <button onClick={() => setOpen(false)} className="text-[#ADB5BD] hover:text-[#495057] transition-colors p-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {sent ? (
            <div className="text-center py-8 space-y-2">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0CA678" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="text-[14px] text-[#1A1A2E] font-medium">感谢反馈！</p>
              <p className="text-[12px] text-[#868E96]">已保存到本地浏览器</p>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="有什么 Bug 或功能建议？缺什么光学工具？&#10;告诉我们，帮助 OpticsKit 做得更好 ✨"
                rows={4}
                className="w-full bg-[#F2F3F5] border border-[#DEE2E6] rounded-xl p-3 text-[13px] text-[#1A1A2E] placeholder-[#ADB5BD] outline-none focus:border-[#228BE6] focus:ring-2 focus:ring-[#228BE6]/10 resize-none transition-all"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#ADB5BD]">保存在浏览器，后续会支持在线提交</span>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  className="px-5 py-2 rounded-full bg-[#228BE6] text-white text-[13px] font-medium hover:bg-[#1c7ed6] transition-colors disabled:opacity-35 disabled:cursor-not-allowed shadow-sm"
                >
                  提交
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

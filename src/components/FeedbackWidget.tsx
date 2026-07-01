"use client";

import { useState } from "react";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    const title = encodeURIComponent("[用户反馈] " + text.trim().slice(0, 60));
    const bodyLines = [
      "## 反馈内容",
      "",
      text.trim(),
      "",
      "---",
      "",
      "**页面地址:** " + window.location.href,
      "**User Agent:** " + navigator.userAgent,
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));
    const labels = "feedback";
    const url = "https://github.com/wolfoxbmm/opticskit/issues/new?title=" + title + "&body=" + body + "&labels=" + labels;
    window.open(url, "_blank");
    setText("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[100] h-12 px-5 rounded-full bg-[#2563EB] text-white text-[14px] font-semibold flex items-center gap-2 transition-all duration-200 hover:bg-[#1D4ED8] hover:scale-105 shadow-lg shadow-[#2563EB]/25 hover:shadow-xl hover:shadow-[#2563EB]/35"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        反馈建议
      </button>

      {open && (
        <div className="fixed bottom-[72px] right-5 z-[100] w-[340px] bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl shadow-black/8 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#111827]">帮助我们改进</h3>
            <button onClick={() => setOpen(false)} className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors p-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"有什么 Bug 或功能建议？缺什么光学工具？\n告诉我们，帮助 OpticsKit 做得更好 ✨"}
            rows={4}
            className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl p-3 text-[13px] text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 resize-none transition-all"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9CA3AF]">提交后将跳转到 GitHub Issues</span>
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="px-5 py-2 rounded-full bg-[#2563EB] text-white text-[13px] font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-35 disabled:cursor-not-allowed shadow-sm"
            >
              提交
            </button>
          </div>
        </div>
      )}
    </>
  );
}
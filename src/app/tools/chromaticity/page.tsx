"use client";

import Link from "next/link";
import FeedbackWidget from "@/components/FeedbackWidget";

export default function ChromaticityPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 导航栏 - 参考网站白色风格 */}
      <header className="border-b border-[#E9ECEF] bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight no-underline hover:no-underline">
            <span className="text-[#228BE6]">λ</span>
            <span className="text-[#1A1A2E]">OpticsKit</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/tools"
              className="text-sm text-[#495057] hover:text-[#1A1A2E] no-underline"
            >
              工具箱
            </Link>
            <Link
              href="/#resources"
              className="text-sm text-[#495057] hover:text-[#1A1A2E] no-underline"
            >
              资源
            </Link>
            <Link
              href="/faq"
              className="text-sm text-[#495057] hover:text-[#1A1A2E] no-underline"
            >
              常见问题
            </Link>
          </div>
        </div>
      </header>

      <iframe
        src="/tools/chromaticity-demo.html"
        style={{ flex: 1, border: "none", width: "100%", minHeight: "calc(100vh - 56px)" }}
        title="色度分析工具"
      />

      <FeedbackWidget />
    </div>
  );
}

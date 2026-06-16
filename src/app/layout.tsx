import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpticsKit · 光谱实验室 - 免费光学工具箱在线 | 光学计算器 色度图 光谱分析 光学模拟",
  description: "OpticsKit 是为中国光学研究者打造的免费在线光学工具箱，提供色度图在线计算、光谱分析工具、光学模拟、衍射干涉模拟、透镜成像、薄膜干涉、材料折射率查询、激光参数速查、柯西色散拟合、相机镜头选型等 10 个光学在线工具，基于 CIE/ISO 国际标准",
  keywords: "光学工具箱在线,光学计算器,色度图在线,光谱分析工具,光学模拟,CIE色度图,衍射模拟,薄膜干涉,折射率查询,透镜成像,激光参数,光学工具箱",
  openGraph: {
    title: "OpticsKit · 光谱实验室 - 免费光学工具箱在线",
    description: "为中国光学研究者打造的在线光学计算与可视化工具集，色度图、光谱分析、光学模拟等10个免费工具",
    type: "website",
    url: "https://opticskit.cn",
  },
  metadataBase: new URL("https://opticskit.cn"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta name="baidu-site-verification" content="codeva-Rjrm7U8PDo" />
        <meta name="msvalidate.01" content="B107E2CE79BF9358C8C9128FD4AFBC09" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&display=swap" rel="stylesheet" />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="e5d4a374-05f1-43da-bf5a-466bb2e7b40b"></script>
      </head>
      <body className="min-h-full flex flex-col bg-[#F2F3F5] text-[#1A1A2E]">
        <header className="sticky top-0 z-50 border-b border-[#E9ECEF] bg-white/80 backdrop-blur-lg h-14 flex items-center">
          <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 no-underline hover:no-underline shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#228BE6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[22px] sm:h-[22px]">
                <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10"/>
              </svg>
              <span className="text-[13px] sm:text-[16px] font-semibold tracking-[-0.02em] text-[#1A1A2E] whitespace-nowrap">OpticsKit</span>
              <span className="hidden sm:inline text-[14px] sm:text-[16px] font-semibold tracking-[-0.02em] text-[#1A1A2E] whitespace-nowrap">· 光谱实验室</span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-0 sm:gap-2">
              <Link href="/community" className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-[10px] text-[12px] sm:text-[14px] font-medium text-[#495057] hover:bg-[#E7F5FF] hover:text-[#228BE6] transition-all no-underline hover:no-underline whitespace-nowrap">
                💬 社区
              </Link>
              <Link href="/contact" className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-[10px] text-[12px] sm:text-[14px] font-medium text-[#495057] hover:bg-[#E7F5FF] hover:text-[#228BE6] transition-all no-underline hover:no-underline whitespace-nowrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[16px] sm:h-[16px]"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                联系我们
              </Link>
              <Link href="/about" className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-[10px] text-[12px] sm:text-[14px] font-medium text-[#495057] hover:bg-[#E7F5FF] hover:text-[#228BE6] transition-all no-underline hover:no-underline whitespace-nowrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[16px] sm:h-[16px]"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                关于
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

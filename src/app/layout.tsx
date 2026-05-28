import type { Metadata } from "next";
import FeedbackWidget from "@/components/FeedbackWidget";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpticsKit — 光谱实验室",
  description: "为中国光学研究者打造的免费在线计算与可视化工具集。色度图、衍射模拟、光谱分析、薄膜干涉、材料折射率查询。",
  keywords: "光谱实验室, 光学工具箱, CIE色度图, 衍射模拟, 薄膜干涉, 折射率查询, 色温计算, CRI, 透镜成像, 光学计算",
  openGraph: {
    title: "OpticsKit — 光谱实验室",
    description: "用光的语言，理解颜色与波前",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&display=swap" rel="stylesheet" />
        <script defer src="https://cloud.umami.is/script.js" data-website-id="e5d4a374-05f1-43da-bf5a-466bb2e7b40b"></script>
      </head>
      <body className="min-h-full flex flex-col bg-[#F2F3F5] text-[#1A1A2E]">
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "色度分析工具 | 在线色坐标计算、色域图、色温查询 - OpticsKit · 光谱实验室",
  description: "交互式 CIE 1931 色度图在线工具，点击查色坐标 xy、相关色温 CCT、Duv 色偏差，sRGB 和 DCI-P3 色域叠加显示，基于 CIE 1931 2° 标准观察者 ISO/CIE 11664-1:2019",
  keywords: ["CIE 1931色度图", "色度图在线", "色坐标计算", "色域图", "色温查询", "色温计算器", "马蹄图", "sRGB色域", "DCI-P3色域", "xy色坐标", "CCT", "Duv", "光学工具箱"],
  openGraph: {
    title: "色度分析工具 | 在线色坐标计算、色域图、色温查询",
    description: "交互式 CIE 1931 色度图，点击查色坐标/色温/Duv，sRGB与DCI-P3色域叠加",
    type: "website",
    url: "https://opticskit.cn/tools/chromaticity",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/chromaticity",
  },
};

export default function ChromaticityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </main>
  );
}

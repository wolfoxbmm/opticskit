import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光源光谱对比 | 标准光源 D65 D50 A光源 LED 光谱 - OpticsKit · 光谱实验室",
  description: "在线光源光谱对比工具，支持 D65、D50、A 光源等 CIE 标准照明体，以及典型 LED 光谱，SPD → XYZ → xy → CCT/Duv/近似CRI 全链路自动计算，支持多光源对比",
  keywords: ["光源光谱", "标准光源", "D65光源", "D50光源", "A光源", "LED光谱", "SPD", "色温计算", "CRI显色指数", "光学工具箱", "光源对比"],
  openGraph: {
    title: "光源光谱对比 | 标准光源 D65 D50 A光源 LED 光谱",
    description: "SPD→XYZ→xy→CCT/Duv/近似CRI全链路自动计算，支持多光源对比",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function LightSourceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

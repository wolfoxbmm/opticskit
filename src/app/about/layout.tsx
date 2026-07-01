import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 OpticsKit | 光学工具箱在线 - OpticsKit ",
  description: "OpticsKit 是一套为中国光学研究者打造的免费在线光学计算与可视化工具集，覆盖色度学、光谱分析、薄膜光学、成像光学、激光技术和材料数据库方向，目前共 9 个工具模块",
  keywords: ["光学工具箱", "光谱实验室", "色度学", "光谱分析", "薄膜光学", "光学计算", "在线工具"],
  openGraph: {
    title: "关于 OpticsKit | 光学工具箱在线",
    description: "为中国光学研究者打造的免费在线光学计算与可视化工具集",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "透镜成像模拟 | 凸透镜凹透镜 薄透镜近轴光线追迹 - OpticsKit · 光谱实验室",
  description: "在线透镜成像模拟工具，支持凸透镜和凹透镜的薄透镜近轴光线追迹，拖动滑块实时交互调节物距、焦距，观察像距和放大率变化，支持分享链接",
  keywords: ["透镜成像", "凸透镜", "凹透镜", "光线追迹", "近轴光学", "薄透镜公式", "光学模拟", "焦距计算", "像距计算", "光学工具箱"],
  openGraph: {
    title: "透镜成像模拟 | 凸透镜凹透镜 薄透镜近轴光线追迹",
    description: "凸透镜与凹透镜薄透镜近轴光线追迹，拖动滑块实时交互",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function LensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

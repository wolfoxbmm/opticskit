import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "高斯光束传播计算器 | 束腰计算 瑞利长度 发散角 透镜聚焦 - OpticsKit",
  description: "在线高斯光束传播计算器，输入波长和束腰尺寸，计算瑞利长度、远场发散角、透镜聚焦变换，可视化光束双曲线包络，支持 M² 因子，基于 Kogelnik 激光理论",
  keywords: ["透镜成像", "凸透镜", "凹透镜", "光线追迹", "近轴光学", "薄透镜公式", "光学模拟", "焦距计算", "像距计算", "光学工具箱"],
  openGraph: {
    title: "透镜成像模拟 | 凸透镜凹透镜 薄透镜近轴光线追迹",
    description: "输入波长与束腰，实时计算高斯光束传播与透镜聚焦变换",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function LensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

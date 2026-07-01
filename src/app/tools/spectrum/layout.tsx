import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光谱数据可视化 | SPD 光谱曲线绘制 XYZ 色坐标计算 - OpticsKit ",
  description: "在线光谱分析工具，导入 SPD 光谱功率分布数据，叠加黑体辐射参考曲线，自动导出 XYZ 三刺激值和 xy 色坐标，支持色温 CCT 和 Duv 计算",
  keywords: ["光谱可视化", "SPD曲线", "光谱分析工具", "XYZ色坐标", "xy色坐标", "黑体辐射", "色温计算", "光谱数据", "光学工具箱", "光谱仪数据"],
  openGraph: {
    title: "光谱数据可视化 | SPD 光谱曲线绘制 XYZ 色坐标计算",
    description: "导入SPD曲线，叠加黑体辐射对比，自动导出XYZ/xy坐标",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function SpectrumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "相机镜头参数 | 焦距光圈景深 等效焦距换算 - OpticsKit ",
  description: "在线相机镜头选型计算器，输入传感器靶面尺寸 + 工作距离 + 视野 → 推荐焦距、像元分辨率、角视场，支持等效焦距换算和景深估算，工业视觉选型参考",
  keywords: ["相机镜头", "镜头参数", "焦距计算", "景深计算", "等效焦距", "传感器靶面", "工业镜头选型", "视场角", "光学工具箱"],
  openGraph: {
    title: "相机镜头参数 | 焦距光圈景深 等效焦距换算",
    description: "传感器靶面+工作距离+视野→推荐焦距·像元分辨率·角视场",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function CameraLensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

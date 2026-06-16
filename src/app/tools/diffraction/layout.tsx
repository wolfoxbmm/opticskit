import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "衍射与干涉模拟 | 单缝双缝多缝衍射 Fraunhofer 条纹 - OpticsKit · 光谱实验室",
  description: "在线衍射模拟工具，支持单缝衍射、双缝干涉、多缝光栅的 Fraunhofer 衍射条纹和光强分布实时渲染，可调节波长、缝宽、缝间距、观察距离等参数",
  keywords: ["衍射模拟", "干涉模拟", "单缝衍射", "双缝干涉", "多缝衍射", "光栅衍射", "Fraunhofer衍射", "光学模拟", "光强分布", "衍射条纹", "光学工具箱"],
  openGraph: {
    title: "衍射与干涉模拟 | 单缝双缝多缝衍射 Fraunhofer 条纹",
    description: "单缝/双缝/多缝衍射在线模拟，Fraunhofer衍射条纹与光强分布实时渲染",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function DiffractionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

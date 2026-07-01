import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "薄膜干涉模拟 | 光学薄膜反射率 增透膜高反膜 - OpticsKit ",
  description: "在线薄膜干涉模拟工具，基于传输矩阵法 TMM 计算单层光学薄膜反射率 vs 波长和膜厚扫描，含 13 种预设场景（SiO2增透膜、TiO2高反膜等），正入射计算",
  keywords: ["薄膜干涉", "光学薄膜", "增透膜", "高反膜", "TMM传输矩阵", "薄膜反射率", "光学镀膜", "光学模拟", "膜厚设计", "光学工具箱"],
  openGraph: {
    title: "薄膜干涉模拟 | 光学薄膜反射率 增透膜高反膜",
    description: "TMM传输矩阵法，单层膜反射率vs波长&膜厚扫描，13种预设场景",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function ThinFilmLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

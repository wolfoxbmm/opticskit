import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光学材料折射率数据库 | 玻璃材料光学常数 色散曲线 - OpticsKit ",
  description: "460 种光学材料的折射率 n(λ) 与消光系数 k(λ) 在线查询，含 Schott 玻璃库、Sellmeier 色散公式、色散曲线图表，CC0 公共领域数据，中英文双语检索",
  keywords: ["光学材料", "折射率数据库", "玻璃折射率", "Sellmeier方程", "色散曲线", "Schott玻璃", "光学常数", "消光系数", "光学玻璃", "光学工具箱"],
  openGraph: {
    title: "光学材料折射率数据库 | 玻璃材料光学常数 色散曲线",
    description: "460种光学材料折射率n(λ)与消光系数k(λ)，含Schott玻璃库",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function MaterialDbLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

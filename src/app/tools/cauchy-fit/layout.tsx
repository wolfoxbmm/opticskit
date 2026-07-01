import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cauchy 色散拟合 | 折射率波长拟合 Sellmeier 方程 - OpticsKit ",
  description: "在线 Cauchy 色散拟合工具，用 Cauchy 公式 n(λ)=A+B/λ²+C/λ⁴ 拟合折射率色散曲线，可见光实测数据外推红外波段折射率，含 8 种预设光学材料",
  keywords: ["Cauchy拟合", "色散拟合", "折射率拟合", "Sellmeier方程", "色散公式", "光学材料", "波长折射率", "光学工具箱"],
  openGraph: {
    title: "Cauchy 色散拟合 | 折射率波长拟合 Sellmeier 方程",
    description: "Cauchy公式拟合折射率色散，可见光实测外推红外波段折射率",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function CauchyFitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

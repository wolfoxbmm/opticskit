import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光学材料折射率数据库 | Schott/Ohara/CDGM/红外 色散公式 - OpticsKit",
  description: "在线光学材料折射率数据库，Schott/Ohara/CDGM/Corning等主流玻璃牌号，Sellmeier/柯西色散系数查询，折射率n随波长变化曲线，红外材料ZnSe/ZnS/Ge/Si",
  keywords: "折射率数据库,光学玻璃,Schott,Ohara,CDGM,成都光明,Sellmeier系数,色散曲线,红外材料,光学材料,折射率查询",
  openGraph: {
    title: "光学材料折射率数据库 | Schott/Ohara/CDGM/红外 色散公式 - OpticsKit",
    description: "在线光学材料折射率数据库，Schott/Ohara/CDGM/Corning等主流玻璃牌号，Sellmeier/柯西色散系数查询，折射率n随波长变化曲线，红外材料ZnSe/ZnS/Ge/Si",
    type: "website",
    url: "https://opticskit.cn/tools/material-db",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/material-db",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

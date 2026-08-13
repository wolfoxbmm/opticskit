import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "标准光源数据 | D65 A C D50 D55 光源光谱 显色指数 CRI - OpticsKit",
  description: "在线标准光源光谱数据库，CIE D65/A/C/D50/D55/D75等标准照明体光谱分布，显色指数CRI/Ra计算，相关色温CCT，色坐标查询",
  keywords: "标准光源,D65光源,A光源,显色指数,CRI,CIE标准照明体,光源光谱,色温,D50,D55,光谱分布",
  openGraph: {
    title: "标准光源数据 | D65 A C D50 D55 光源光谱 显色指数 CRI - OpticsKit",
    description: "在线标准光源光谱数据库，CIE D65/A/C/D50/D55/D75等标准照明体光谱分布，显色指数CRI/Ra计算，相关色温CCT，色坐标查询",
    type: "website",
    url: "https://opticskit.cn/tools/light-source",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/light-source",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

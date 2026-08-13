import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CIE 1931 色度图在线 | xy色坐标 色温 Planck轨迹 色域覆盖 - OpticsKit",
  description: "在线CIE 1931 xy色度图，色坐标实时计算，Planck黑体轨迹/等温线绘制，sRGB/DCI-P3/Rec.2020色域一键叠加，光谱/色温/色坐标三向互算",
  keywords: "CIE色度图,色度图在线,色坐标,xy色度图,色温,Planck轨迹,色域,sRGB,DCI-P3,主波长,色纯度",
  openGraph: {
    title: "CIE 1931 色度图在线 | xy色坐标 色温 Planck轨迹 色域覆盖 - OpticsKit",
    description: "在线CIE 1931 xy色度图，色坐标实时计算，Planck黑体轨迹/等温线绘制，sRGB/DCI-P3/Rec.2020色域一键叠加，光谱/色温/色坐标三向互算",
    type: "website",
    url: "https://opticskit.cn/tools/chromaticity",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/chromaticity",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

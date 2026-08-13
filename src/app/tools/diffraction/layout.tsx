import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "夫琅禾费衍射模拟 | 单缝/圆孔/方孔 衍射图样 艾里斑 瑞利判据 - OpticsKit",
  description: "在线夫琅禾费衍射模拟工具，单缝/圆孔/方孔/双缝/光栅5种孔径，2D衍射图样伪彩色渲染，1D强度剖面曲线，Airy斑半径与瑞利判据计算",
  keywords: "夫琅禾费衍射,衍射模拟,单缝衍射,圆孔衍射,艾里斑,瑞利判据,双缝衍射,光栅衍射,衍射图样,方孔衍射",
  openGraph: {
    title: "夫琅禾费衍射模拟 | 单缝/圆孔/方孔 衍射图样 艾里斑 瑞利判据 - OpticsKit",
    description: "在线夫琅禾费衍射模拟工具，单缝/圆孔/方孔/双缝/光栅5种孔径，2D衍射图样伪彩色渲染，1D强度剖面曲线，Airy斑半径与瑞利判据计算",
    type: "website",
    url: "https://opticskit.cn/tools/diffraction",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/diffraction",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

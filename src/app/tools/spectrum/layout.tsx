import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光谱分析工具 | CIE色匹配函数 光源光谱 物体色计算 色度学 - OpticsKit",
  description: "在线光谱分析与色度学工具，CIE 1931/1964色匹配函数，Planck黑体/标准光源光谱，物体反射光谱→色坐标/色温自动计算，光谱可视化对比",
  keywords: "光谱分析,色匹配函数,光谱色度学,CIE标准色度观察者,黑体辐射,物体色,光谱可视化,反射光谱,透射光谱,色度计算",
  openGraph: {
    title: "光谱分析工具 | CIE色匹配函数 光源光谱 物体色计算 色度学 - OpticsKit",
    description: "在线光谱分析与色度学工具，CIE 1931/1964色匹配函数，Planck黑体/标准光源光谱，物体反射光谱→色坐标/色温自动计算，光谱可视化对比",
    type: "website",
    url: "https://opticskit.cn/tools/spectrum",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/spectrum",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

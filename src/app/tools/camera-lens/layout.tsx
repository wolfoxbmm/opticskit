import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "相机镜头选型 | 焦距/视场角/工作距离 镜头参数计算 - OpticsKit",
  description: "在线相机镜头选型计算工具，镜头焦距/视场角/工作距离联动计算，多传感器型号速选，放大倍率/像元分辨率/角视场输出，机器视觉工业镜头选型推荐",
  keywords: "镜头选型,相机镜头,焦距计算,视场角,工作距离,传感器靶面,工业镜头,机器视觉镜头,镜头参数,放大倍率",
  openGraph: {
    title: "相机镜头选型 | 焦距/视场角/工作距离 镜头参数计算 - OpticsKit",
    description: "在线相机镜头选型计算工具，镜头焦距/视场角/工作距离联动计算，多传感器型号速选，放大倍率/像元分辨率/角视场输出，机器视觉工业镜头选型推荐",
    type: "website",
    url: "https://opticskit.cn/tools/camera-lens",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/camera-lens",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

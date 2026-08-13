import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "薄膜干涉模拟 | 单层/多层增透膜 高反膜 滤光片设计 - OpticsKit",
  description: "在线薄膜干涉模拟工具，单层/多层膜系反射率/透射率光谱计算，增透膜AR/高反膜HR/带通滤光片，特征矩阵法TMM，入射角/偏振角度可调，支持材料库快捷填充",
  keywords: "薄膜干涉,薄膜光学,增透膜,高反膜,滤光片,TMM,传输矩阵法,膜系设计,光学镀膜,反射率,透射率",
  openGraph: {
    title: "薄膜干涉模拟 | 单层/多层增透膜 高反膜 滤光片设计 - OpticsKit",
    description: "在线薄膜干涉模拟工具，单层/多层膜系反射率/透射率光谱计算，增透膜AR/高反膜HR/带通滤光片，特征矩阵法TMM，入射角/偏振角度可调，支持材料库快捷填充",
    type: "website",
    url: "https://opticskit.cn/tools/thin-film",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/thin-film",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "柯西色散拟合 | Cauchy公式 n(λ)色散曲线 可见光到红外外推 - OpticsKit",
  description: "在线柯西色散拟合工具，基于Cauchy公式拟合折射率色散曲线n(λ)，支持可见光实测数据到红外波段n值外推，8种预设材料，光学色散在线计算器",
  keywords: "柯西拟合,Cauchy色散,折射率色散,色散曲线,红外外推,材料色散,光学常数,色散公式,折射率拟合,柯西系数",
  openGraph: {
    title: "柯西色散拟合 | Cauchy公式 n(λ)色散曲线 可见光到红外外推 - OpticsKit",
    description: "在线柯西色散拟合工具，基于Cauchy公式拟合折射率色散曲线n(λ)，支持可见光实测数据到红外波段n值外推，8种预设材料，光学色散在线计算器",
    type: "website",
    url: "https://opticskit.cn/tools/cauchy-fit",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/cauchy-fit",
  },
};

export default function CauchyFitPage() {
  return (
    <>
      <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        柯西色散拟合 | 折射率 n(λ) 色散曲线拟合工具
      </h1>
      <iframe
        src="/tools/cauchy-fit.html"
        style={{ width: "100%", height: "calc(100vh - 56px)", border: "none", background: "#E8EAED" }}
        title="柯西拟合工具"
      />
    </>
  );
}

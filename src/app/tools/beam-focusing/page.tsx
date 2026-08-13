import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "光束聚焦计算器 | 高斯光束薄透镜聚焦 焦点光斑 焦深 - OpticsKit",
  description: "在线光束聚焦计算器，高斯光束薄透镜聚焦分析，自动计算焦点光斑半径、焦深DOF、峰值功率密度，束腰演化曲线实时预览",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>光束聚焦计算器 | 薄透镜聚焦 焦点光斑 焦深</h1>
      <iframe src="/tools/beam-focusing.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="光束聚焦计算器" />
    </>
  );
}

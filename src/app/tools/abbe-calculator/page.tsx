import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "阿贝数计算器 | 光学玻璃色散 v_d P_gF ΔP 阿贝图 - OpticsKit",
  description: "免费在线阿贝数计算器，内置 156 种 Schott 光学玻璃数据。支持 v_d 色散计算、部分色散 P_gF、ΔP 偏差分析和交互式 n_d-v_d 阿贝图。适用于光学设计选材与色散参数校核。",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>阿贝数计算器 | v_d P_gF 部分色散 ΔP 阿贝图 光学玻璃色散</h1>
      <iframe src="/tools/abbe-calculator.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="阿贝数计算器" />
    </>
  );
}

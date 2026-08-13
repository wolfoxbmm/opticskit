import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "衍射光栅计算器 | 光栅方程 角色散 分辨率 闪耀角 - OpticsKit",
  description: "在线衍射光栅计算器，支持光栅方程、角色散、分辨率、自由光谱范围、闪耀角计算。适用于光谱仪设计、激光调谐和光通信波长选择。",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>衍射光栅计算器 | 光栅方程 角色散 分辨本领 FSR 闪耀角</h1>
      <iframe src="/tools/grating-calculator.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="衍射光栅计算器" />
    </>
  );
}

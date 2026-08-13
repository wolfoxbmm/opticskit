import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "激光损伤阈值 (LIDT) 计算器 | 波长脉宽光斑缩放 安全裕度 - OpticsKit",
  description: "在线激光损伤阈值计算器，基于波长/脉宽/光斑直径缩放公式，安全裕度评估，6种激光器预设，支持 Nd:YAG/CO₂/BK7 等常见材料",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>激光损伤阈值计算器 | LIDT 缩放 安全裕度</h1>
      <iframe src="/tools/lidt-calculator.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="激光损伤阈值计算器" />
    </>
  );
}

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "高斯光束传播计算器 | w(z) 束腰 瑞利范围 M² 发散角 - OpticsKit",
  description: "在线高斯光束传播计算器，w(z)光斑演化曲线、瑞利范围、发散角、Gouy相位计算，M²因子对比分析，激光光束在线模拟",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>高斯光束传播计算器 | w(z) 光斑演化 M² 对比</h1>
      <iframe src="/tools/gaussian-beam.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="高斯光束传播计算器" />
    </>
  );
}

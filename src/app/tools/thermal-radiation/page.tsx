import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "热辐射计算器 | Planck黑体辐射 Wien位移 Stefan-Boltzmann - OpticsKit",
  description: "在线热辐射计算器，基于Planck黑体辐射公式，光谱辐出度曲线绘制，Wien位移定律，Stefan-Boltzmann热辐射功率计算",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>热辐射计算器 | Planck黑体辐射光谱</h1>
      <iframe src="/tools/thermal-radiation-v6.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#0a0a0a"}} title="热辐射计算器" />
    </>
  );
}

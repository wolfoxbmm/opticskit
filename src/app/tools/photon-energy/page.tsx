import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "波长频率光子能量换算 | 电磁波谱 λ/ν/E 联动计算 - OpticsKit",
  description: "在线波长频率光子能量换算工具，λ↔ν↔E四参数实时联动，电磁波谱渐变条定位，介质折射率补偿（真空/空气/水/BK7/硅快捷切换）",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>波长频率光子能量换算 | λ↔ν↔E 四参数联动</h1>
      <iframe src="/tools/photon-energy.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="波长频率光子能量换算" />
    </>
  );
}

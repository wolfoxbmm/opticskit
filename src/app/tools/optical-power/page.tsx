import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "光功率单位换算 | W/mW/dBm 功率密度 脉冲能量 - OpticsKit",
  description: "在线光功率单位换算工具，支持W↔mW↔dBm绝对功率换算，IEC 60825激光安全等级对照，含功率密度和脉冲能量计算",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>光功率单位换算 | W↔mW↔dBm 激光安全等级</h1>
      <iframe src="/tools/optical-power.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="光功率单位换算" />
    </>
  );
}

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "工程单位换算中心 | 光学工程物理量换算 - OpticsKit",
  description: "在线工程单位换算中心，支持长度/角度/面积/光强等10大类物理量双向换算，光子学四参数联动，光学工程师日常必备工具",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>工程单位换算中心 | 10大类物理量双向换算</h1>
      <iframe src="/tools/unit-converter.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="工程单位换算中心" />
    </>
  );
}

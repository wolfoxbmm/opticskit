import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "菲涅尔反射计算器 | s/p偏振 布儒斯特角 临界角 反射率 - OpticsKit",
  description: "在线菲涅尔反射计算器，s/p偏振反射率曲线实时绘制，布儒斯特角/临界角标注，材料折射率库联动，角度双向查询",
};
export default function Page() {
  return (
    <>
      <h1 style={{position:"absolute",width:"1px",height:"1px",padding:0,margin:"-1px",overflow:"hidden",clip:"rect(0,0,0,0)",whiteSpace:"nowrap",border:0}}>菲涅尔反射计算器 | s/p偏振 反射率 布儒斯特角</h1>
      <iframe src="/tools/fresnel-reflection.html" style={{width:"100%",height:"calc(100vh - 56px)",border:"none",background:"#F3F4F6"}} title="菲涅尔反射计算器" />
    </>
  );
}

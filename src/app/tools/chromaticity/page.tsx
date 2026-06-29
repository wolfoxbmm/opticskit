export default function ChromaticityPage() {
  return (
    <>
      <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        CIE 1931 色度图 | 在线色坐标计算与色域查询
      </h1>
      <iframe
        src="/tools/chromaticity-demo.html"
        style={{ flex: 1, width: "100%", border: "none", display: "block" }}
        title="色度分析工具"
      />
    </>
  );
}

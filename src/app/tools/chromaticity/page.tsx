export default function ChromaticityPage() {
  return (
    <div style={{ padding: 16, height: "calc(100vh - 56px)", boxSizing: "border-box" }}>
      <iframe
        src="/tools/chromaticity/index.html"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
          borderRadius: 12,
        }}
        title="色度分析工具"
      />
    </div>
  );
}

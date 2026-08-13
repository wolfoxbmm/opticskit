"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChromaticityCanvas, { type PointInfo, type BatchPoint } from "./chromaticity-canvas";
import BatchPanel from "./batch-panel";
import { trackPageView, trackExport, trackInteract } from "@/lib/analytics";
import { spectrumToXYZ, xyzToChromaticity, deltaE76 } from "@/lib/colorimetry";

type DiagramMode = "xy" | "uv";

function ChromaticityContent() {
  const searchParams = useSearchParams();
  const spdParam = searchParams.get("spd");

  const [diagramMode, setDiagramMode] = useState<DiagramMode>("xy");
  const [showMacAdam, setShowMacAdam] = useState(false);
  const [showBB, setShowBB] = useState(true);
  const [showSRGB, setShowSRGB] = useState(true);
  const [showP3, setShowP3] = useState(true);
  const [showAdobeRGB, setShowAdobeRGB] = useState(false);
  const [showACES, setShowACES] = useState(false);
  const [showRec2020, setShowRec2020] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [locateX, setLocateX] = useState(0);
  const [locateY, setLocateY] = useState(0);
  const [inputX, setInputX] = useState("0.3127");
  const [inputY, setInputY] = useState("0.3290");
  const [pointInfo, setPointInfo] = useState<PointInfo | null>(null);
  const [pt1, setPt1] = useState<PointInfo | null>(null);
  const [pt2, setPt2] = useState<PointInfo | null>(null);
  const [deltaE, setDeltaE] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [batchPoints, setBatchPoints] = useState<BatchPoint[]>([]);

  useEffect(() => { trackPageView("chromaticity"); }, []);

  useEffect(() => {
    if (spdParam) {
      try {
        const spd = JSON.parse(decodeURIComponent(spdParam));
        if (spd.wl && spd.val) {
          const XYZ = spectrumToXYZ(spd.val, spd.wl);
          const xy = xyzToChromaticity(XYZ);
          setInputX(xy.x.toFixed(4));
          setInputY(xy.y.toFixed(4));
          setLocateX(xy.x);
          setLocateY(xy.y);
        }
      } catch {}
    }
  }, [spdParam]);

  const handleLocate = useCallback((x: number, y: number, info: PointInfo | null) => {
    setShowHint(false);
    setLocateX(x); setLocateY(y);
    // 点击图外(info=null)时不更新/清空已有信息，避免“点了没反应”
    if (info) setPointInfo(info);
    if (info) {
      setInputX(info.x.toFixed(4)); setInputY(info.y.toFixed(4));
      trackInteract("chromaticity", "canvas-click");
    }
  }, []);

  const [locateError, setLocateError] = useState("");
  const handleInputLocate = () => {
    const x = parseFloat(inputX), y = parseFloat(inputY);
    if (isNaN(x) || isNaN(y)) { setLocateError("请输入有效数值"); return; }
    if (x < 0 || x > 0.85 || y < -0.1 || y > 1.0) { setLocateError("坐标超出范围 (x: 0~0.85, y: -0.1~1.0)"); return; }
    setLocateError("");
    setLocateX(x); setLocateY(y);
    trackInteract("chromaticity", "input-locate", x.toFixed(3) + "," + y.toFixed(3));
  };

  const handleExportPNG = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "chromaticity-diagram.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    trackExport("chromaticity", "png");
  }, []);

  useEffect(() => {
    if (pt1 && pt2) setDeltaE(deltaE76(pt1.Lab, pt2.Lab));
    else setDeltaE(null);
  }, [pt1, pt2]);

  const handleReset = () => {
    setPt1(null); setPt2(null); setDeltaE(null);
    setLocateX(0); setLocateY(0); setPointInfo(null);
    setInputX("0.3127"); setInputY("0.3290");
  };

  const modeLabel = diagramMode === "xy" ? "CIE xy" : "CIE uv";

    const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    // Hide hint after 8 seconds or on click
    const t = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", overflow: "hidden", padding: 20, gap: 16, background: "#0a0a0a", color: "#bbb" }}>
      <ChromaticityCanvas
        diagramMode={diagramMode}
        showMacAdam={showMacAdam}
        showBB={showBB}
        showSRGB={showSRGB}
        showP3={showP3}
        showAdobeRGB={showAdobeRGB}
        showACES={showACES}
        showRec2020={showRec2020}
        showLabels={showLabels}
        locateX={locateX}
        locateY={locateY}
        onLocate={handleLocate}
        point1={pt1}
        point2={pt2}
        batchPoints={batchPoints}
      />
      {showHint && (
        <div onClick={() => setShowHint(false)} style={{ position: "absolute", top: 80, left: "calc(50% - 200px)", width: 360, background: "rgba(0,191,255,0.12)", border: "1px solid rgba(0,191,255,0.3)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#00bfff", textAlign: "center", cursor: "pointer", zIndex: 20, backdropFilter: "blur(8px)" }}>
          💡 点击色度图上任意位置查看该颜色的 CCT、RGB 等参数
        </div>
      )}

      <div style={{ width: 380, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ paddingBottom: 12, borderBottom: "1px solid #222" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>色度分析工具</h1>
          <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0 0" }}>CIE 1931 / 1976 uv - colour-science (BSD-3)</p>
        </div>

        {/* Tab 切换 */}
        <div style={{ display: "flex", gap: 3, background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 8, padding: 3 }}>
          <button onClick={() => setActiveTab("single")} style={{ flex: 1, padding: "7px 0", fontSize: 13, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: activeTab === "single" ? "#00bfff" : "transparent", color: activeTab === "single" ? "#000" : "#999", fontWeight: activeTab === "single" ? 600 : 400 }}>单点分析</button>
          <button onClick={() => setActiveTab("batch")} style={{ flex: 1, padding: "7px 0", fontSize: 13, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: activeTab === "batch" ? "#00bfff" : "transparent", color: activeTab === "batch" ? "#000" : "#999", fontWeight: activeTab === "batch" ? 600 : 400 }}>批量分析</button>
        </div>

        {activeTab === "batch" ? (
          <BatchPanel batchPoints={batchPoints} setBatchPoints={setBatchPoints} />
        ) : (
        <>
        <div style={sectionCard}>
          <div style={sectionTitle}>色度图切换</div>
          <div style={{ display: "flex", gap: 3 }}>
            <button onClick={() => setDiagramMode("xy")} style={btnStyle(diagramMode === "xy")}>CIE 1931 xy</button>
            <button onClick={() => setDiagramMode("uv")} style={btnStyle(diagramMode === "uv")}>CIE 1976 uv</button>
          </div>
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>覆盖图层</div>
          {[
            ["MacAdam 椭圆", "#e040fb", showMacAdam, setShowMacAdam],
            ["黑体轨迹", "#ff6b00", showBB, setShowBB],
            ["sRGB 色域", "#00e676", showSRGB, setShowSRGB],
            ["DCI-P3 色域", "#00bfff", showP3, setShowP3],
            ["Adobe RGB 色域", "#ff7043", showAdobeRGB, setShowAdobeRGB],
            ["ACES AP0 色域", "#ce93d8", showACES, setShowACES],
            ["Rec.2020 色域", "#ffd600", showRec2020, setShowRec2020],
            ["波长标注", "#888", showLabels, setShowLabels],
          ].map(([label, color, state, set]) => (
            <label key={label as string} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={state as boolean} onChange={() => (set as any)(!(state as boolean))} />
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color as string, flexShrink: 0 }} />
              {label as string}
            </label>
          ))}
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>坐标定位 <span style={{ fontWeight: 400 }}>({modeLabel})</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{diagramMode === "xy" ? "x" : "u'"}</label>
              <input type="number" step="0.001" value={inputX} onChange={e => setInputX(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{diagramMode === "xy" ? "y" : "v'"}</label>
              <input type="number" step="0.001" value={inputY} onChange={e => setInputY(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button onClick={handleInputLocate} style={primaryBtnStyle}>定位</button>
          {locateError && <p style={{ fontSize: 11, color: "#ff6b6b", marginTop: 4 }}>{locateError}</p>}
        </div>

        {pointInfo && (
          <div style={sectionCard}>
            <div style={sectionTitle}>选中点信息</div>
            {pointInfo.outsideLocus && (
              <div style={{ fontSize: 11, color: "#ffb020", background: "rgba(255,176,32,0.1)", border: "1px solid rgba(255,176,32,0.3)", borderRadius: 6, padding: "6px 10px", marginBottom: 8 }}>⚠ 该点在 CIE 色度图可见光谱轨迹之外（非真实可见光颜色）</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px", fontSize: 13 }}>
              <span style={{ color: "#888" }}>x, y</span><span style={valStyle}>{pointInfo.x.toFixed(4)}, {pointInfo.y.toFixed(4)}</span>
              <span style={{ color: "#888" }}>u', v'</span><span style={valStyle}>{pointInfo.up.toFixed(4)}, {pointInfo.vp.toFixed(4)}</span>
              <span style={{ color: "#888" }}>CCT</span><span style={{ color: "#ff6b00", textAlign: "right" }}>{pointInfo.cct?.toFixed(0) ?? "-"} K</span>
              <span style={{ color: "#888" }}>Duv</span><span style={valStyle} title="Duv 表示该颜色偏离黑体轨迹的程度">{pointInfo.duv?.toFixed(5) ?? "-"}</span>
              <span style={{ color: "#888", marginTop: 6 }}>RGB</span><span style={{ ...valStyle, marginTop: 6 }}>({pointInfo.rgb.r}, {pointInfo.rgb.g}, {pointInfo.rgb.b})
            {(pointInfo.rgb.r < 0 || pointInfo.rgb.g < 0 || pointInfo.rgb.b < 0) && 
              <span style={{ fontSize: 10, color: "#ff6b6b", display: "block", marginTop: 2 }}>⚠ 该颜色超出sRGB色域范围</span>
            }</span>
              <span style={{ color: "#888" }}>XYZ</span><span style={valStyle}>{pointInfo.XYZ.X.toFixed(3)}, {pointInfo.XYZ.Y.toFixed(3)}, {pointInfo.XYZ.Z.toFixed(3)}</span>
              <span style={{ color: "#888" }}>Lab</span><span style={valStyle}>{pointInfo.Lab.L.toFixed(1)}, {pointInfo.Lab.a.toFixed(1)}, {pointInfo.Lab.b.toFixed(1)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #333", background: `rgb(${pointInfo.rgb.r},${pointInfo.rgb.g},${pointInfo.rgb.b})` }} />
              {pointInfo.gamutIn.length > 0 && <span style={{ fontSize: 12 }}>在{pointInfo.gamutIn.join(", ")}色域内</span>}
            </div>
          </div>
        )}

        <div style={sectionCard}>
          <div style={sectionTitle}>色差计算</div>
          <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>先点击图上选点，再设为点1/点2，计算 CIE76 色差</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "#888" }}>点 1</span><span style={valStyle}>{pt1 ? `(${pt1.x.toFixed(3)}, ${pt1.y.toFixed(3)})` : "未选"}</span>
            <span style={{ color: "#888" }}>点 2</span><span style={valStyle}>{pt2 ? `(${pt2.x.toFixed(3)}, ${pt2.y.toFixed(3)})` : "未选"}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: deltaE !== null ? (deltaE < 1 ? "#00e676" : deltaE < 10 ? "#ffd600" : "#ff6b6b") : "#00bfff", textAlign: "center", padding: "8px 0", background: deltaE !== null ? "rgba(0,191,255,0.08)" : "transparent", borderRadius: 8 }}>
          {deltaE !== null ? deltaE.toFixed(2) : "-"}
          {deltaE !== null && <div style={{ fontSize: 10, fontWeight: 400, color: "#888", marginTop: 2 }}>{deltaE < 1 ? "肉眼难以分辨" : deltaE < 10 ? "可察觉色差" : "显著色差"}</div>}
        </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => setPt1(pointInfo)} style={pt1 ? smallBtnActive : smallBtnStyle} title="将当前选中的点设为色差点1">设为点 1{pt1 ? " ✓" : ""}</button>
            <button onClick={() => setPt2(pointInfo)} style={pt2 ? smallBtnActive : smallBtnStyle} title="将当前选中的点设为色差点2">设为点 2{pt2 ? " ✓" : ""}</button>
            <button onClick={handleReset} style={smallBtnStyle}>重置</button>
            <button onClick={() => { const t = pt1; setPt1(pt2); setPt2(t); }} style={smallBtnStyle} title="交换点1和点2">⇄</button>
          </div>
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>导出</div>
          <button onClick={handleExportPNG} style={{ width: "100%", padding: 9, background: "#1a3a2a", border: "1px solid #2a5a3a", color: "#00e676", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>导出 PNG</button>
        </div>
        <p style={{ fontSize: 10, color: "#555", textAlign: "center" }}>OpticsKit - colour-science (BSD-3) - CIE 15:2018</p>
        </>
        )}
      </div>
    </div>
  );
}

export default function ChromaticityPage() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#6B7280" }}>加载中...</div>}>
      <ChromaticityContent />
    </Suspense>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 10 };
const sectionCard: React.CSSProperties = { background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 };
const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: "7px 14px", fontSize: 13, border: "1px solid " + (active ? "#00bfff" : "#3a3a3a"),
  background: active ? "#00bfff" : "transparent", color: active ? "#000" : "#999",
  borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 600 : 400,
  transition: "all 0.15s ease",
  transform: "scale(1)",
});
const smallBtnStyle: React.CSSProperties = { padding: "5px 10px", fontSize: 11, border: "1px solid #3a3a3a", background: "transparent", color: "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" };
const smallBtnActive: React.CSSProperties = { padding: "5px 10px", fontSize: 11, border: "1px solid #00e676", background: "rgba(0,230,118,0.15)", color: "#00e676", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#d0d0d0", fontFamily: "monospace", fontSize: 13, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#999", display: "block", marginBottom: 3 };
const primaryBtnStyle: React.CSSProperties = { width: "100%", padding: 9, background: "#00bfff", color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 };
const valStyle: React.CSSProperties = { color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" };

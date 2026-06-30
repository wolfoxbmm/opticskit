"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChromaticityCanvas, { type PointInfo } from "./chromaticity-canvas";
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
    setLocateX(x); setLocateY(y); setPointInfo(info);
    if (info) {
      setInputX(info.x.toFixed(4)); setInputY(info.y.toFixed(4));
      trackInteract("chromaticity", "canvas-click");
    }
  }, []);

  const handleInputLocate = () => {
    const x = parseFloat(inputX), y = parseFloat(inputY);
    if (isNaN(x) || isNaN(y)) return;
    setLocateX(x); setLocateY(y);
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
      />

      <div style={{ width: 380, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ paddingBottom: 12, borderBottom: "1px solid #222" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>色度分析工具</h1>
          <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0 0" }}>CIE 1931 / 1976 uv - colour-science (BSD-3)</p>
        </div>

        <div className="sec">
          <div className="sec-tt">色度图切换</div>
          <div style={{ display: "flex", gap: 3 }}>
            <button onClick={() => setDiagramMode("xy")} style={btnStyle(diagramMode === "xy")}>CIE 1931 xy</button>
            <button onClick={() => setDiagramMode("uv")} style={btnStyle(diagramMode === "uv")}>CIE 1976 uv</button>
          </div>
        </div>

        <div className="sec">
          <div className="sec-tt">覆盖图层</div>
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

        <div className="sec">
          <div className="sec-tt">坐标定位 <span style={{ fontWeight: 400 }}>({modeLabel})</span></div>
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
        </div>

        {pointInfo && (
          <div className="sec">
            <div className="sec-tt">选中点信息</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px", fontSize: 13 }}>
              <span style={{ color: "#888" }}>x, y</span><span style={valStyle}>{pointInfo.x.toFixed(4)}, {pointInfo.y.toFixed(4)}</span>
              <span style={{ color: "#888" }}>u', v'</span><span style={valStyle}>{pointInfo.up.toFixed(4)}, {pointInfo.vp.toFixed(4)}</span>
              <span style={{ color: "#888" }}>CCT</span><span style={{ color: "#ff6b00", textAlign: "right" }}>{pointInfo.cct?.toFixed(0) ?? "-"} K</span>
              <span style={{ color: "#888" }}>Duv</span><span style={valStyle}>{pointInfo.duv?.toFixed(5) ?? "-"}</span>
              <span style={{ color: "#888", marginTop: 6 }}>RGB</span><span style={{ ...valStyle, marginTop: 6 }}>({pointInfo.rgb.r}, {pointInfo.rgb.g}, {pointInfo.rgb.b})</span>
              <span style={{ color: "#888" }}>XYZ</span><span style={valStyle}>{pointInfo.XYZ.X.toFixed(3)}, {pointInfo.XYZ.Y.toFixed(3)}, {pointInfo.XYZ.Z.toFixed(3)}</span>
              <span style={{ color: "#888" }}>Lab</span><span style={valStyle}>{pointInfo.Lab.L.toFixed(1)}, {pointInfo.Lab.a.toFixed(1)}, {pointInfo.Lab.b.toFixed(1)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #333", background: `rgb(${pointInfo.rgb.r},${pointInfo.rgb.g},${pointInfo.rgb.b})` }} />
              {pointInfo.gamutIn.length > 0 && <span style={{ fontSize: 12 }}>在{pointInfo.gamutIn.join(", ")}色域内</span>}
            </div>
          </div>
        )}

        <div className="sec">
          <div className="sec-tt">色差计算</div>
          <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>先点击图上选点，再设为点1/点2，计算 CIE76 色差</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "#888" }}>点 1</span><span style={valStyle}>{pt1 ? `(${pt1.x.toFixed(3)}, ${pt1.y.toFixed(3)})` : "未选"}</span>
            <span style={{ color: "#888" }}>点 2</span><span style={valStyle}>{pt2 ? `(${pt2.x.toFixed(3)}, ${pt2.y.toFixed(3)})` : "未选"}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#00bfff", textAlign: "center", padding: "4px 0" }}>{deltaE !== null ? deltaE.toFixed(2) : "-"}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => setPt1(pointInfo)} style={smallBtnStyle}>设为点 1</button>
            <button onClick={() => setPt2(pointInfo)} style={smallBtnStyle}>设为点 2</button>
            <button onClick={handleReset} style={smallBtnStyle}>重置</button>
          </div>
        </div>

        <div className="sec">
          <div className="sec-tt">导出</div>
          <button onClick={handleExportPNG} style={{ width: "100%", padding: 9, background: "#1a3a2a", border: "1px solid #2a5a3a", color: "#00e676", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>导出 PNG</button>
        </div>
        <p style={{ fontSize: 10, color: "#555", textAlign: "center" }}>OpticsKit - colour-science (BSD-3) - CIE 15:2018</p>
      </div>
    </div>
  );
}

export default function ChromaticityPage() {
  return (
    <Suspense fallback={<div style={{ height: "calc(100vh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#868E96" }}>加载中...</div>}>
      <ChromaticityContent />
    </Suspense>
  );
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: "7px 14px", fontSize: 13, border: "1px solid #3a3a3a",
  background: active ? "#00bfff" : "transparent", color: active ? "#000" : "#999",
  borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: active ? 600 : 400,
});
const smallBtnStyle: React.CSSProperties = { padding: "5px 10px", fontSize: 11, border: "1px solid #3a3a3a", background: "transparent", color: "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#d0d0d0", fontFamily: "monospace", fontSize: 13, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 12, color: "#999", display: "block", marginBottom: 3 };
const primaryBtnStyle: React.CSSProperties = { width: "100%", padding: 9, background: "#00bfff", color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 };
const valStyle: React.CSSProperties = { color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" };

"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChromaticityCanvas, { type PointInfo } from "./chromaticity-canvas";
import { trackPageView, trackCalculate, trackExport, trackInteract } from "@/lib/analytics";

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

  // Color difference points
  const [pt1, setPt1] = useState<PointInfo | null>(null);
  const [pt2, setPt2] = useState<PointInfo | null>(null);
  const [deltaE, setDeltaE] = useState<number | null>(null);

  // Track page view
  useEffect(() => {
    trackPageView("chromaticity");
  }, []);

  // Handle SPD param from other tools
  useEffect(() => {
    if (spdParam) {
      try {
        const spd = JSON.parse(decodeURIComponent(spdParam));
        if (spd.wl && spd.val) {
          // Compute xy and locate
          const { spectrumToXYZ, xyzToChromaticity } = require("@/lib/colorimetry");
          const XYZ = spectrumToXYZ(spd.val, spd.wl);
          const xy = xyzToChromaticity(XYZ);
          setInputX(xy.x.toFixed(4));
          setInputY(xy.y.toFixed(4));
          setLocateX(xy.x);
          setLocateY(xy.y);
        }
      } catch {
        // ignore invalid spd
      }
    }
  }, [spdParam]);

  const handleLocate = useCallback(
    (x: number, y: number, info: PointInfo | null) => {
      setLocateX(x);
      setLocateY(y);
      setPointInfo(info);
      if (info) {
        setInputX(info.x.toFixed(4));
        setInputY(info.y.toFixed(4));
        trackInteract("chromaticity", "canvas-click", `${info.x.toFixed(3)},${info.y.toFixed(3)}`);
      }
    },
    []
  );

  const handleInputLocate = () => {
    const x = parseFloat(inputX);
    const y = parseFloat(inputY);
    if (isNaN(x) || isNaN(y)) return;

    let xyX = x, xyY = y;
    if (diagramMode === "uv") {
      const xy = require("@/lib/colorimetry").uvPrimeToXy(x, y);
      xyX = xy.x;
      xyY = xy.y;
    }

    setLocateX(xyX);
    setLocateY(xyY);
    trackInteract("chromaticity", "input-locate", `${x},${y}`);
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

  const handleSetPt1 = () => {
    if (pointInfo) {
      setPt1(pointInfo);
      updateDeltaE(pointInfo, pt2);
    }
  };

  const handleSetPt2 = () => {
    if (pointInfo) {
      setPt2(pointInfo);
      updateDeltaE(pt1, pointInfo);
    }
  };

  const updateDeltaE = (p1: PointInfo | null, p2: PointInfo | null) => {
    if (p1 && p2) {
      const { deltaE76 } = require("@/lib/colorimetry");
      setDeltaE(deltaE76(p1.Lab, p2.Lab));
    }
  };

  const handleReset = () => {
    setPt1(null);
    setPt2(null);
    setDeltaE(null);
    setLocateX(0);
    setLocateY(0);
    setPointInfo(null);
    setInputX("0.3127");
    setInputY("0.3290");
  };

  const modeLabel = diagramMode === "xy" ? "CIE xy" : "CIE uv";
  const lblX = diagramMode === "xy" ? "x" : "u'";
  const lblY = diagramMode === "xy" ? "y" : "v'";

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", overflow: "hidden", padding: 20, gap: 16, background: "#0a0a0a", color: "#bbb" }}>
      {/* Canvas area */}
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
      />

      {/* Side panel */}
      <div style={{
        width: 380, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12,
        overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16,
        scrollbarWidth: "auto", scrollbarColor: "#555 #1a1a1a"
      }}>
        {/* Title */}
        <div style={{ paddingBottom: 12, borderBottom: "1px solid #222", marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>色度分析工具</h1>
          <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0 0" }}>CIE 1931 / 1976 uv - colour-science (BSD-3)</p>
        </div>

        {/* Diagram toggle */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>色度图切换</div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" as const }}>
            <button
              onClick={() => setDiagramMode("xy")}
              style={{ padding: "7px 14px", fontSize: 13, border: "1px solid #3a3a3a", background: diagramMode === "xy" ? "#00bfff" : "transparent", color: diagramMode === "xy" ? "#000" : "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: diagramMode === "xy" ? 600 : 400 }}
            >
              CIE 1931 xy
            </button>
            <button
              onClick={() => setDiagramMode("uv")}
              style={{ padding: "7px 14px", fontSize: 13, border: "1px solid #3a3a3a", background: diagramMode === "uv" ? "#00bfff" : "transparent", color: diagramMode === "uv" ? "#000" : "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontWeight: diagramMode === "uv" ? 600 : 400 }}
            >
              CIE 1976 uv
            </button>
          </div>
        </div>

        {/* Overlay layers */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>覆盖图层</div>
          {[
            { label: "MacAdam 椭圆", color: "#e040fb", state: showMacAdam, set: setShowMacAdam },
            { label: "黑体轨迹", color: "#ff6b00", state: showBB, set: setShowBB },
            { label: "sRGB 色域", color: "#00e676", state: showSRGB, set: setShowSRGB },
            { label: "DCI-P3 色域", color: "#00bfff", state: showP3, set: setShowP3 },
            { label: "Adobe RGB 色域", color: "#ff7043", state: showAdobeRGB, set: setShowAdobeRGB },
            { label: "ACES AP0 色域", color: "#ce93d8", state: showACES, set: setShowACES },
            { label: "Rec.2020 色域", color: "#ffd600", state: showRec2020, set: setShowRec2020 },
            { label: "波长标注", color: "#888", state: showLabels, set: setShowLabels },
          ].map(({ label, color, state, set }) => (
            <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13, color: "#bbb", cursor: "pointer" }}>
              <input type="checkbox" checked={state} onChange={() => set(!state)} />
              <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
              {label}
            </label>
          ))}
        </div>

        {/* Coordinate input */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            坐标定位 <span style={{ fontWeight: 400, textTransform: "none" }}>({modeLabel})</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: "#999", display: "block", marginBottom: 3 }}>{lblX}</label>
              <input
                type="number"
                step="0.001"
                value={inputX}
                onChange={(e) => setInputX(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#d0d0d0", fontFamily: "monospace", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: "#999", display: "block", marginBottom: 3 }}>{lblY}</label>
              <input
                type="number"
                step="0.001"
                value={inputY}
                onChange={(e) => setInputY(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#d0d0d0", fontFamily: "monospace", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>
          <button
            onClick={handleInputLocate}
            style={{ width: "100%", padding: 9, background: "#00bfff", color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
          >
            定位
          </button>
        </div>

        {/* Selected point info */}
        {pointInfo && (
          <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>选中点信息</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px", fontSize: 13 }}>
              <span style={{ color: "#888" }}>x, y</span>
              <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>{pointInfo.x.toFixed(4)}, {pointInfo.y.toFixed(4)}</span>
              <span style={{ color: "#888" }}>u', v'</span>
              <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>{pointInfo.up.toFixed(4)}, {pointInfo.vp.toFixed(4)}</span>
              <span style={{ color: "#888" }}>CCT</span>
              <span style={{ color: "#ff6b00", textAlign: "right" }}>{pointInfo.cct?.toFixed(0) ?? "-"} K</span>
              <span style={{ color: "#888" }}>Duv</span>
              <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>{pointInfo.duv?.toFixed(5) ?? "-"}</span>
              <span style={{ color: "#888", marginTop: 6 }}>RGB</span>
              <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right", marginTop: 6 }}>({pointInfo.rgb.r}, {pointInfo.rgb.g}, {pointInfo.rgb.b})</span>
              <span style={{ color: "#888" }}>XYZ</span>
              <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>{pointInfo.XYZ.X.toFixed(3)}, {pointInfo.XYZ.Y.toFixed(3)}, {pointInfo.XYZ.Z.toFixed(3)}</span>
              <span style={{ color: "#888" }}>Lab</span>
              <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>{pointInfo.Lab.L.toFixed(1)}, {pointInfo.Lab.a.toFixed(1)}, {pointInfo.Lab.b.toFixed(1)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #333", background: `rgb(${pointInfo.rgb.r},${pointInfo.rgb.g},${pointInfo.rgb.b})` }} />
              {pointInfo.gamutIn.length > 0 && (
                <span style={{ fontSize: 12 }}>
                  在{pointInfo.gamutIn.join(", ")}色域内
                </span>
              )}
            </div>
          </div>
        )}

        {/* Color difference */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>色差计算</div>
          <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>先点击图上选点，再设为点1/点2，计算 CIE76 色差</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 16px", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "#888" }}>点 1</span>
            <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>
              {pt1 ? `(${pt1.x.toFixed(3)}, ${pt1.y.toFixed(3)})` : "未选"}
            </span>
            <span style={{ color: "#888" }}>点 2</span>
            <span style={{ color: "#e0e0e0", fontFamily: "monospace", textAlign: "right" }}>
              {pt2 ? `(${pt2.x.toFixed(3)}, ${pt2.y.toFixed(3)})` : "未选"}
            </span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#00bfff", textAlign: "center", padding: "4px 0" }}>
            {deltaE !== null ? deltaE.toFixed(2) : "-"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={handleSetPt1} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid #3a3a3a", background: "transparent", color: "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>设为点 1</button>
            <button onClick={handleSetPt2} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid #3a3a3a", background: "transparent", color: "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>设为点 2</button>
            <button onClick={handleReset} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid #3a3a3a", background: "transparent", color: "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>重置</button>
          </div>
        </div>

        {/* Export */}
        <div style={{ background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>导出</div>
          <button
            onClick={handleExportPNG}
            style={{ width: "100%", padding: 9, background: "#1a3a2a", border: "1px solid #2a5a3a", color: "#00e676", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            导出 PNG
          </button>
        </div>

        <p style={{ fontSize: 10, color: "#555", textAlign: "center", paddingTop: 4 }}>
          OpticsKit - colour-science (BSD-3) - CIE 15:2018
        </p>
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

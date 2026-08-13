"use client";

import { useRef, useState, useCallback } from "react";
import { GAMUTS } from "@/lib/colorimetry/chromaticity-data";
import { xyToUvPrime, cctWithDuv, pointInGamut } from "@/lib/colorimetry";

export interface BatchPoint {
  x: number;
  y: number;
  label: string | null;
  cct: number | null;
  inZone: boolean | null; // null = 未判定
}

export type ZoneMode = "sRGB" | "DCI-P3" | "Adobe RGB" | "Rec.2020";

interface BatchPanelProps {
  batchPoints: BatchPoint[];
  setBatchPoints: React.Dispatch<React.SetStateAction<BatchPoint[]>>;
}

export default function BatchPanel({ batchPoints, setBatchPoints }: BatchPanelProps) {
  const [inputText, setInputText] = useState("");
  const [zone, setZone] = useState<ZoneMode>("sRGB");
  const [judged, setJudged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseData = useCallback((text: string): BatchPoint[] => {
    const points: BatchPoint[] = [];
    const lines = text.split(/[\n\r]+/);
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      const parts = t.split(/[,\t\s]+/);
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (isNaN(x) || isNaN(y)) continue;
      const label = parts[2] || null;
      const uv = xyToUvPrime(x, y);
      const cctRes = cctWithDuv(uv);
      points.push({ x, y, label, cct: Number.isFinite(cctRes.cct) ? cctRes.cct : null, inZone: null });
    }
    return points;
  }, []);

  const handleImport = () => {
    const pts = parseData(inputText);
    if (pts.length > 0) {
      setBatchPoints(pts);
      setJudged(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || "");
      setInputText(text);
      const pts = parseData(text);
      if (pts.length > 0) {
        setBatchPoints(pts);
        setJudged(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const getZoneVertices = useCallback((): { x: number; y: number }[] => {
    const g = GAMUTS[zone];
    if (!g) return [];
    return [{ x: g.R[0], y: g.R[1] }, { x: g.G[0], y: g.G[1] }, { x: g.B[0], y: g.B[1] }];
  }, [zone]);

  const runJudgment = () => {
    const g = GAMUTS[zone];
    if (batchPoints.length === 0 || !g) return;
    const pts = batchPoints.map((bp) => ({
      ...bp,
      inZone: pointInGamut(bp.x, bp.y, g.R, g.G, g.B),
    }));
    setBatchPoints(pts);
    setJudged(true);
  };

  const clearAll = () => {
    setBatchPoints([]);
    setJudged(false);
    setInputText("");
  };

  const exportCSV = () => {
    let csv = "序号,标签,x,y,CCT,判定\n";
    batchPoints.forEach((bp, i) => {
      csv += `${i + 1},${bp.label || ""},${bp.x},${bp.y},${bp.cct != null ? bp.cct.toFixed(0) : ""},${bp.inZone == null ? "" : bp.inZone ? "合格" : "不合格"}\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "色度判定结果.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const passCount = batchPoints.filter((p) => p.inZone === true).length;
  const failCount = batchPoints.filter((p) => p.inZone === false).length;

  const zoneNames: Record<ZoneMode, string> = {
    sRGB: "sRGB",
    "DCI-P3": "DCI-P3",
    "Adobe RGB": "Adobe RGB",
    "Rec.2020": "Rec.2020",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. 导入数据 */}
      <div style={sectionCard}>
        <div style={sectionTitle}>1. 导入数据</div>
        <p style={{ fontSize: 11, color: "#666", margin: "0 0 8px" }}>每行一个点，格式：x,y,标签。支持粘贴或上传 CSV/TXT。</p>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={"0.3127,0.3290,样品A\n0.3205,0.3412,样品B\n0.3050,0.3150\n0.3400,0.3500,样品D\n0.2800,0.2900,样品E"}
          style={{ width: "100%", height: 90, padding: "8px 10px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#d0d0d0", fontFamily: "monospace", fontSize: 12, outline: "none", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={handleImport} style={{ ...primaryBtnStyle, marginTop: 0, flex: 1 }}>导入并标注</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ ...smallBtnStyle, flex: 1, padding: 9, fontSize: 13 }}>📁 上传文件</button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFile} />
        </div>
        <button onClick={clearAll} style={{ ...smallBtnStyle, width: "100%", marginTop: 6, color: "#ff6b6b", borderColor: "#5a2a2a" }}>清除数据点</button>
      </div>

      {/* 2. 判定色区 */}
      <div style={sectionCard}>
        <div style={sectionTitle}>2. 判定色区</div>
        <p style={{ fontSize: 11, color: "#666", margin: "0 0 8px" }}>选择预设色域，判断样本点是否落在色域内。</p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
          {(["sRGB", "DCI-P3", "Adobe RGB", "Rec.2020"] as ZoneMode[]).map((z) => (
            <button key={z} onClick={() => { setZone(z); setJudged(false); }} style={{ ...smallBtnStyle, border: zone === z ? "1px solid #00e676" : "1px solid #3a3a3a", background: zone === z ? "rgba(0,230,118,0.15)" : "transparent", color: zone === z ? "#00e676" : "#999", fontWeight: zone === z ? 600 : 400 }}>
              {zoneNames[z]}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>
          当前色区：{zoneNames[zone]}（{getZoneVertices().length} 个顶点）
        </div>
      </div>

      {/* 3. 执行判定 */}
      <div style={sectionCard}>
        <div style={sectionTitle}>3. 执行判定</div>
        <button onClick={runJudgment} disabled={batchPoints.length === 0 || getZoneVertices().length < 3} style={{ ...primaryBtnStyle, marginTop: 0, opacity: batchPoints.length === 0 || getZoneVertices().length < 3 ? 0.4 : 1 }}>
          {batchPoints.length === 0 ? "先导入数据" : "▶ 执行判定"}
        </button>
        {judged && (
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12 }}>
            <span style={{ color: "#00e676" }}>✓ 合格: {passCount}</span>
            <span style={{ color: "#ff5252" }}>✗ 不合格: {failCount}</span>
            <span style={{ color: "#888" }}>共 {batchPoints.length} 个</span>
          </div>
        )}
      </div>

      {/* 结果表格 */}
      {batchPoints.length > 0 && (
        <div style={sectionCard}>
          <div style={{ ...sectionTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>判定结果</span>
            <button onClick={exportCSV} style={{ ...smallBtnStyle, color: "#00e676", borderColor: "#2a5a3a" }}>📥 导出 CSV</button>
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>标签</th>
                  <th style={thStyle}>x</th>
                  <th style={thStyle}>y</th>
                  <th style={thStyle}>CCT</th>
                  <th style={thStyle}>判定</th>
                </tr>
              </thead>
              <tbody>
                {batchPoints.map((bp, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1f1f1f" }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{bp.label || "—"}</td>
                    <td style={tdStyle}>{bp.x.toFixed(4)}</td>
                    <td style={tdStyle}>{bp.y.toFixed(4)}</td>
                    <td style={tdStyle}>{bp.cct != null ? bp.cct.toFixed(0) + " K" : "—"}</td>
                    <td style={{ ...tdStyle, color: bp.inZone == null ? "#666" : bp.inZone ? "#00e676" : "#ff5252" }}>
                      {bp.inZone == null ? "未判定" : bp.inZone ? "✓ 合格" : "✗ 不合格"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 10 };
const sectionCard: React.CSSProperties = { background: "#0d0d0d", border: "1px solid #1f1f1f", borderRadius: 10, padding: 14 };
const primaryBtnStyle: React.CSSProperties = { width: "100%", padding: 9, background: "#00bfff", color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 };
const smallBtnStyle: React.CSSProperties = { padding: "5px 10px", fontSize: 11, border: "1px solid #3a3a3a", background: "transparent", color: "#999", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "6px 4px", color: "#888", fontWeight: 600, fontSize: 11 };
const tdStyle: React.CSSProperties = { padding: "6px 4px", color: "#d0d0d0", fontFamily: "monospace", fontSize: 12 };

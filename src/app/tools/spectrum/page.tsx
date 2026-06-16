"use client";



import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { CIE_WAVELENGTHS, CIE_X_BAR, CIE_Y_BAR, CIE_Z_BAR } from "@/lib/colorimetry/cmf-generated";
import { planckSpectrum, wavelengthToColor, spectrumToXYZ, xyzToChromaticity } from "@/lib/colorimetry";

export default function SpectrumPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cct, setCct] = useState(5500);
  const [showData, setShowData] = useState(false);
  const [uploadedData, setUploadedData] = useState<{ wl: number[]; val: number[] } | null>(null);
  const [xyzResult, setXyzResult] = useState<{ X: number; Y: number; Z: number; x: number; y: number } | null>(null);
  const [overlayBB, setOverlayBB] = useState(true);

  const exportCSV = useCallback(() => {
    if (!uploadedData) return;
    const { wl, val } = uploadedData;
    const header = "wavelength(nm),intensity";
    const rows = wl.map((w, i) => `${w},${val[i]}`);
    const csv = [header, ...rows].join("\n");
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `spd_export_${ts}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [uploadedData]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const wl: number[] = [];
      const val: number[] = [];
      for (const line of lines) {
        const parts = line.trim().split(/[\t, ]+/);
        if (parts.length >= 2) {
          const a = parseFloat(parts[0]);
          const b = parseFloat(parts[1]);
          if (!isNaN(a) && !isNaN(b)) {
            wl.push(a);
            val.push(b);
          }
        }
      }
      if (wl.length > 0) {
        setUploadedData({ wl, val });
        setShowData(true);
      }
    };
    reader.readAsText(file);
  }, []);

  useEffect(() => {
    if (uploadedData && showData) {
      try {
        const xyz = spectrumToXYZ(uploadedData.val, uploadedData.wl);
        const xy = xyzToChromaticity(xyz);
        setXyzResult({ X: xyz.X, Y: xyz.Y, Z: xyz.Z, x: xy.x, y: xy.y });
      } catch { setXyzResult(null); }
    } else { setXyzResult(null); }
  }, [uploadedData, showData]);

  // Generate sample data (simulated LED spectrum)
  const loadSampleData = useCallback(() => {
    const wl: number[] = [];
    const val: number[] = [];
    for (let i = 380; i <= 780; i += 2) {
      wl.push(i);
      // Two-peak LED simulation: blue peak at 450nm + broad yellow peak at 570nm
      const blue = Math.exp(-((i - 450) ** 2) / (2 * 20 ** 2));
      const yellow = 0.6 * Math.exp(-((i - 570) ** 2) / (2 * 60 ** 2));
      val.push(blue + yellow);
    }
    setUploadedData({ wl, val });
    setShowData(true);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 30, right: 50, bottom: 50, left: 60 };
    const pw = w - margin.left - margin.right;
    const ph = h - margin.top - margin.bottom;

    const toCanvas = (wlNm: number, value: number): [number, number] => {
      const x = margin.left + ((wlNm - 380) / 400) * pw;
      const y = margin.top + ph - (value * ph);
      return [x, y];
    };

    // Grid
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.5;
    for (let wl = 400; wl <= 780; wl += 50) {
      const [x] = toCanvas(wl, 0);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + ph);
      ctx.stroke();
      ctx.fillStyle = "#ccc";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${wl}`, x - 12, margin.top + ph + 16);
    }
    for (let i = 0; i <= 1; i += 0.25) {
      const [, y] = toCanvas(400, i);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + pw, y);
      ctx.stroke();
      ctx.fillStyle = "#ccc";
      ctx.font = "bold 12px monospace";
      ctx.fillText(i.toFixed(2), margin.left - 30, y + 4);
    }
    // Y-axis label — vertical
    ctx.save();
    ctx.fillStyle = "#aaa";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.translate(14, margin.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Rel. Intensity", 0, 0);
    ctx.restore();

    // Axis
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + ph);
    ctx.lineTo(margin.left + pw, margin.top + ph);
    ctx.stroke();
    ctx.fillStyle = "#bbb";
    ctx.font = "bold 12px monospace";
    ctx.fillText("Wavelength (nm)", margin.left + pw / 2 - 50, margin.top + ph + 32);

    // Blackbody
    if (!showData && cct > 0) {
      const bbWl = Array.from({ length: 401 }, (_, i) => 380 + i);
      const bbSpd = planckSpectrum(cct, bbWl);
      const bbMax = Math.max(...bbSpd);
      ctx.beginPath();
      for (let i = 0; i < bbWl.length; i++) {
        const [x, y] = toCanvas(bbWl[i], bbSpd[i] / bbMax);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#FF6B00";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#FF6B00";
      ctx.font = "13px sans-serif";
      ctx.fillText(`黑体辐射 · ${cct} K`, margin.left + 10, margin.top + 20);
    }

    // Uploaded data
    if (showData && uploadedData) {
      const dataMax = Math.max(...uploadedData.val) || 1;
      const { wl, val } = uploadedData;

      // Shared max: data + optional blackbody
      let globalMax = dataMax;
      const bbWl2 = Array.from({ length: 401 }, (_, i) => 380 + i);
      const bbSpd2 = planckSpectrum(cct, bbWl2);
      if (overlayBB && cct > 0) {
        const bbMax2 = Math.max(...bbSpd2, 1);
        globalMax = Math.max(globalMax, bbMax2);
      }

      if (overlayBB && cct > 0) {
        ctx.beginPath();
        for (let i = 0; i < bbWl2.length; i++) {
          const [x2, y2] = toCanvas(bbWl2[i], bbSpd2[i] / globalMax);
          if (i === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        ctx.strokeStyle = "rgba(255,107,0,0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Spectrum curve as gradient
      ctx.beginPath();
      for (let i = 0; i < wl.length; i++) {
        const [x, y] = toCanvas(wl[i], val[i] / globalMax);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const gradient = ctx.createLinearGradient(margin.left, 0, margin.left + pw, 0);
      for (let wlNm = 380; wlNm <= 780; wlNm += 20) {
        const col = wavelengthToColor(wlNm);
        const x = (wlNm - 380) / 400;
        gradient.addColorStop(x, `rgb(${col.r},${col.g},${col.b})`);
      }
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Fill under curve
      ctx.lineTo(toCanvas(wl[wl.length - 1], 0)[0], margin.top + ph);
      ctx.lineTo(toCanvas(wl[0], 0)[0], margin.top + ph);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,191,255,0.05)";
      ctx.fill();

      ctx.fillStyle = "#00BFFF";
      ctx.font = "12px sans-serif";
      ctx.fillText("光谱数据", margin.left + 10, margin.top + 20);
    }
  }, [cct, showData, uploadedData, overlayBB]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
      render();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col"><main className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 min-h-0 overflow-hidden">
        <div className="flex-1 relative min-h-0 rounded-xl overflow-hidden border border-[#E9ECEF]">
          <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <aside className="w-full lg:w-[300px] lg:border-l lg:border border-[#E9ECEF] rounded-xl bg-white px-4 py-3 space-y-3 overflow-y-auto flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-[#1A1A2E]">📊 光谱数据可视化</h1>
            <p className="text-xs text-[#868E96]">导入光谱功率分布 (SPD) 数据，查看曲线。</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#495057] block mb-1">黑体辐射色温对比</label>
              <input
                type="range"
                min={1000}
                max={20000}
                step={100}
                value={cct}
                onChange={e => { setCct(parseInt(e.target.value)); }}
                className="w-full accent-[#FF6B00]"
              />
              <span className="text-xs text-[#FF6B00] font-mono">{cct} K</span>
            </div>

            <div className="space-y-2">
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.txt,.dat"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-[#495057] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[#DEE2E6] file:text-xs file:bg-white file:text-[#495057] hover:file:bg-[#F2F3F5] file:cursor-pointer file:transition-colors"
                />
              </label>
              <p className="text-xs text-[#ADB5BD]">CSV或TXT，每行：波长[tab/空格/逗号]强度</p>
              <button
                onClick={loadSampleData}
                className="text-xs text-[#228BE6] hover:underline"
              >
                ↗ 加载示例LED数据
              </button>
            </div>

            {uploadedData && (
              <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3 space-y-2">
                <p className="text-xs text-[#495057]">
                  {uploadedData.wl.length} 个数据点 · {uploadedData.wl[0]}–{uploadedData.wl[uploadedData.wl.length - 1]} nm
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => setShowData(!showData)} className="text-xs text-[#228BE6] hover:underline">
                    {showData ? "✕ 隐藏" : "✓ 显示"}
                  </button>
                  <label className="flex items-center gap-1 text-xs text-[#495057] cursor-pointer">
                    <input type="checkbox" checked={overlayBB} onChange={e => setOverlayBB(e.target.checked)} className="accent-[#FF6B00]" />叠加黑体
                  </label>
                  <button
                    onClick={exportCSV}
                    className="text-xs bg-[#228BE6] text-white rounded px-3 py-1 hover:bg-[#1c7ed6] transition-colors"
                  >
                    ⬇ 导出 CSV
                  </button>
                </div>
                {xyzResult && (
                  <div className="text-xs text-[#868E96] border-t border-[#E9ECEF] pt-2 mt-1">
                    <p>XYZ: ({xyzResult.X.toFixed(1)}, {xyzResult.Y.toFixed(1)}, {xyzResult.Z.toFixed(1)})</p>
                    <p>xy: ({xyzResult.x.toFixed(4)}, {xyzResult.y.toFixed(4)})</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <a href="/community" className="flex items-center justify-between px-3 py-2 mt-3 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] hover:border-[#228BE6] hover:bg-[#E7F5FF] transition-all no-underline group">
              <span className="text-xs text-[#495057] group-hover:text-[#228BE6] flex items-center gap-1.5">
                <span className="text-sm">💬</span> 有问题或建议？去留言区聊聊
              </span>
              <span className="text-[10px] text-[#ADB5BD] group-hover:text-[#228BE6]">→</span>
            </a>

          <p className="text-xs text-[#ADB5BD] pt-4">
            导入格式简单：两列（波长/强度），380–780nm 最佳，步长任意。
            可叠加黑体辐射曲线作为对比参考。
          </p>
        </aside>
      </main>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CIE_WAVELENGTHS, CIE_X_BAR, CIE_Y_BAR, CIE_Z_BAR } from "@/lib/colorimetry/cmf-generated";
import { planckSpectrum, wavelengthToColor, spectrumToXYZ, xyzToChromaticity } from "@/lib/colorimetry";
import { formatValue, isValidNumber } from "@/lib/utils/number";
import { trackPageView, trackCalculate, trackExport, trackImport, trackInteract } from "@/lib/analytics";

export default function SpectrumPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cct, setCct] = useState(5500);
  const [showData, setShowData] = useState(false);
  const [uploadedData, setUploadedData] = useState<{ wl: number[]; val: number[] } | null>(null);
  const [xyzResult, setXyzResult] = useState<{ X: number; Y: number; Z: number; x: number; y: number } | null>(null);
  const [overlayBB, setOverlayBB] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    trackExport("spectrum", "csv");
  }, [uploadedData]);

  const openInLightSource = useCallback(() => {
    if (!uploadedData) return;
    const spd = JSON.stringify({ wl: uploadedData.wl, val: uploadedData.val });
    trackInteract("spectrum", "open-in-light-source");
    router.push(`/tools/light-source?spd=${encodeURIComponent(spd)}`);
  }, [uploadedData, router]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const wl: number[] = [];
      const val: number[] = [];
      let lineNum = 0;
      for (const line of lines) {
        lineNum++;
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
      setLoading(false);
      if (wl.length === 0) {
        setError("未解析到有效数据。请确保文件包含两列：波长 强度（空格/逗号/Tab 分隔）");
        return;
      }
      // Validate wavelength range
      if (wl[0] < 300 || wl[wl.length - 1] > 830) {
        setError("部分波长超出可见光范围 (380-780nm)，结果可能不准确");
      }
      trackImport("spectrum", "file");
      setUploadedData({ wl, val });
      setShowData(true);
    };
    reader.onerror = () => {
      setLoading(false);
      setError("文件读取失败，请重试");
    };
    reader.readAsText(file);
  }, []);

  // Analytics: track page load
  useEffect(() => { trackPageView("spectrum"); }, []);

  useEffect(() => {
    if (uploadedData && showData) {
      try {
        const xyz = spectrumToXYZ(uploadedData.val, uploadedData.wl);
        const xy = xyzToChromaticity(xyz);
        setXyzResult({ X: xyz.X, Y: xyz.Y, Z: xyz.Z, x: xy.x, y: xy.y });
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "XYZ 计算失败，请检查数据格式");
        setXyzResult(null);
      }
    } else { setXyzResult(null); }
  }, [uploadedData, showData]);

  // Generate sample data (simulated LED spectrum)
  const loadSampleData = useCallback(() => {
    setError(null);
    const wl: number[] = [];
    const val: number[] = [];
    for (let i = 380; i <= 780; i += 2) {
      wl.push(i);
      // Two-peak LED simulation: blue peak at 450nm + broad yellow peak at 570nm
      const blue = Math.exp(-((i - 450) ** 2) / (2 * 20 ** 2));
      const yellow = 0.6 * Math.exp(-((i - 570) ** 2) / (2 * 60 ** 2));
      val.push(blue + yellow);
    }
    trackImport("spectrum", "file");
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
      ctx.fillText(formatValue(i, { precision: 2 }), margin.left - 30, y + 4);
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
    // X-axis label
    ctx.fillStyle = "#aaa";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Wavelength (nm)", margin.left + pw / 2, margin.top + ph + 38);

    // Border
    ctx.strokeStyle = "#2A2A2A";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin.left, margin.top, pw, ph);

    // SPD data
    if (showData && uploadedData) {
      const { wl, val } = uploadedData;
      const maxVal = Math.max(...val);
      const norm = maxVal > 0 ? 1 / maxVal : 1;

      // Fill under curve
      ctx.beginPath();
      for (let i = 0; i < wl.length; i++) {
        const [x, y] = toCanvas(wl[i], val[i] * norm);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const lastX = margin.left + ((wl[wl.length - 1] - 380) / 400) * pw;
      ctx.lineTo(lastX, margin.top + ph);
      ctx.lineTo(margin.left + ((wl[0] - 380) / 400) * pw, margin.top + ph);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + ph);
      gradient.addColorStop(0, "rgba(34, 139, 230, 0.35)");
      gradient.addColorStop(1, "rgba(34, 139, 230, 0.02)");
      ctx.fillStyle = gradient;
      ctx.fill();

      // SPD line
      ctx.beginPath();
      ctx.strokeStyle = "#57B8FF";
      ctx.lineWidth = 2;
      for (let i = 0; i < wl.length; i++) {
        const [x, y] = toCanvas(wl[i], val[i] * norm);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Blackbody radiation overlay
    if (overlayBB) {
      const bbWl: number[] = [];
      for (let wl = 380; wl <= 780; wl += 2) {
        bbWl.push(wl);
      }
      const bbVal = planckSpectrum(cct, bbWl);
      const maxBB = Math.max(...bbVal);
      const normBB = maxBB > 0 ? 1 / maxBB : 1;

      ctx.beginPath();
      ctx.strokeStyle = "#FF6B00";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      for (let i = 0; i < bbWl.length; i++) {
        const [x, y] = toCanvas(bbWl[i], bbVal[i] * normBB);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // CCT label
      ctx.fillStyle = "#FF6B00";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${cct} K`, margin.left + pw - 6, margin.top + 18);
    }

    // Horizontal zero line
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    const [, y0] = toCanvas(400, 0);
    ctx.beginPath();
    ctx.moveTo(margin.left, y0);
    ctx.lineTo(margin.left + pw, y0);
    ctx.stroke();
  }, [showData, uploadedData, cct, overlayBB]);

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      render();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col"><main className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 min-h-0 overflow-hidden">
        <div className="flex-1 relative min-h-0 rounded-xl overflow-hidden border border-[#E5E7EB]">
          <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0"
            style={{ width: "100%", height: "100%" }}
            aria-label="光谱数据可视化图表"
            role="img"
          />
        </div>

        <aside className="w-full lg:w-[300px] lg:border-l lg:border border-[#E5E7EB] rounded-xl bg-white px-4 py-3 space-y-3 overflow-y-auto flex-shrink-0">
          <div>
            <h1 className="text-base font-semibold text-[#111827]">📈 光谱数据可视化</h1>
            <p className="text-xs text-[#6B7280]">导入光谱功率分布 (SPD) 数据，查看曲线。</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#4B5563] block mb-1">黑体辐射色温对比</label>
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
                  className="block w-full text-xs text-[#4B5563] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[#E5E7EB] file:text-xs file:bg-white file:text-[#4B5563] hover:file:bg-[#F3F4F6] file:cursor-pointer file:transition-colors"
                />
              </label>
              <p className="text-xs text-[#9CA3AF]">CSV或TXT，每行：波长[tab/空格/逗号]强度</p>
              <button
                onClick={loadSampleData}
                className="text-xs text-[#2563EB] hover:underline"
              >
                → 加载示例LED数据
              </button>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
                <p className="text-xs text-[#6B7280] animate-pulse">正在解析文件...</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-[#FFF5F5] border border-[#FFC9C9] rounded-lg p-3">
                <p className="text-xs text-[#E03131]">⚠ {error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-[#6B7280] mt-1 hover:underline"
                >
                  关闭
                </button>
              </div>
            )}

            {uploadedData && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 space-y-2">
                <p className="text-xs text-[#4B5563]">
                  {uploadedData.wl.length} 个数据点 · {uploadedData.wl[0]}–{uploadedData.wl[uploadedData.wl.length - 1]} nm
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={() => setShowData(!showData)} className="text-xs text-[#2563EB] hover:underline">
                    {showData ? "✓ 隐藏" : "✓ 显示"}
                  </button>
                  <label className="flex items-center gap-1 text-xs text-[#4B5563] cursor-pointer">
                    <input type="checkbox" checked={overlayBB} onChange={e => setOverlayBB(e.target.checked)} className="accent-[#FF6B00]" />叠加黑体
                  </label>
                  <button
                    onClick={exportCSV}
                    className="text-xs bg-[#2563EB] text-white rounded px-3 py-1 hover:bg-[#1D4ED8] transition-colors"
                  >
                    ⬇ 导出 CSV
                  </button>
                </div>
                {/* Light Source CTA */}
                <div className="border-t border-[#E5E7EB] pt-3">
                  <button
                    onClick={openInLightSource}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#0b8e67] hover:to-[#087f5b] text-white transition-all shadow-sm hover:shadow-md group"
                  >
                    <span className="text-lg flex-shrink-0">💡</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold block">计算光源指标</span>
                      <span className="text-xs text-white/70 block">CCT · Duv · 近似 CRI 全链路分析</span>
                    </div>
                    <span className="text-white/50 group-hover:translate-x-0.5 transition-transform flex-shrink-0">→</span>
                  </button>
                </div>
                {xyzResult && (
                  <div className="text-xs text-[#6B7280] border-t border-[#E5E7EB] pt-2 mt-1">
                    <p>XYZ: ({formatValue(xyzResult.X, { precision: 1 })}, {formatValue(xyzResult.Y, { precision: 1 })}, {formatValue(xyzResult.Z, { precision: 1 })})</p>
                    <p>xy: ({formatValue(xyzResult.x, { precision: 4 })}, {formatValue(xyzResult.y, { precision: 4 })})</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <a href="/community" className="flex items-center justify-between px-3 py-2 mt-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-all no-underline group">
              <span className="text-xs text-[#4B5563] group-hover:text-[#2563EB] flex items-center gap-1.5">
                <span className="text-sm">💬</span> 有问题或建议？去留言区聊聊
              </span>
              <span className="text-[10px] text-[#9CA3AF] group-hover:text-[#2563EB]">→</span>
            </a>

          <p className="text-xs text-[#9CA3AF] pt-4">
            导入格式简单：两列（波长 强度），380–780nm 最佳，步长任意。
            可叠加黑体辐射曲线作为对比参考。
          </p>
        </aside>
      </main>
    </div>
  );
}

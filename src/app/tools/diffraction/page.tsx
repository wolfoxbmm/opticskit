"use client";



import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { colormap, type ColormapName } from "./lib/colormap";
import { compute2DIntensity, compute1DIntensity, type DiffractionParams } from "./lib/physics";
import { trackPageView, trackCalculate, trackExport, trackImport } from "@/lib/analytics";

export default function DiffractionPage() {
  const patternCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { trackPageView("diffraction"); }, []);
  const intensityCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"single" | "double" | "grating">("double");
  const [wavelength, setWavelength] = useState(550);
  const [slitWidth, setSlitWidth] = useState(50);
  const [slitSep, setSlitSep] = useState(200);
  const [slitCount, setSlitCount] = useState(5);
  const [screenDist, setScreenDist] = useState(1000);
  const [cmap, setCmap] = useState<ColormapName>("inferno");
  const [showLabels, setShowLabels] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<"help" | "formula" | "fringe">("help");
  // Local input state for numeric inputs (free typing, commit on blur/Enter)
  const [wlInput, setWlInput] = useState(String(wavelength));
  const [swInput, setSwInput] = useState(String(slitWidth));
  const [ssInput, setSsInput] = useState(String(slitSep));
  const [scInput, setScInput] = useState(String(slitCount));
  const [sdInput, setSdInput] = useState(String(screenDist));

  // Sync local state when slider value changes
  useEffect(() => { setWlInput(String(wavelength)); }, [wavelength]);
  useEffect(() => { setSwInput(String(slitWidth)); }, [slitWidth]);
  useEffect(() => { setSsInput(String(slitSep)); }, [slitSep]);
  useEffect(() => { setScInput(String(slitCount)); }, [slitCount]);
  useEffect(() => { setSdInput(String(screenDist)); }, [screenDist]);

  const clampCommit = (raw: string, min: number, max: number, setter: (v: number) => void) => {
    const v = parseInt(raw);
    if (!isNaN(v)) setter(Math.min(max, Math.max(min, v)));
  };


  const wl = wavelength * 1e-9;
  const a = slitWidth * 1e-6;
  const d = slitSep * 1e-6;
  const L = screenDist * 1e-3;

  const params: DiffractionParams = {
    mode,
    wavelengthNm: wavelength,
    slitWidthUm: slitWidth,
    slitSepUm: slitSep,
    slitCount,
    screenDistMm: screenDist,
  };

  // === Render 2D pattern with colormap ===
  const renderPattern = useCallback(() => {
    const canvas = patternCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;

    const xRange = 60; // mm
    const data = compute2DIntensity(params, w, h, xRange);

    const imageData = ctx.createImageData(w, h);
    const GAMMA = 0.55;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx4 = (py * w + px) * 4;
        const I = data[py * w + px];
        const t = Math.pow(Math.max(0, I), GAMMA);
        const [r, g, b] = colormap(t, cmap);
        // Dark background for near-zero values
        const alpha = t < 0.003 ? (t / 0.003) * 255 : 255;
        imageData.data[idx4] = r;
        imageData.data[idx4 + 1] = g;
        imageData.data[idx4 + 2] = b;
        imageData.data[idx4 + 3] = 255; // opaque, colormap handles the dark bg
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Labels
    if (showLabels) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `bold ${w < 500 ? 11 : 13}px monospace`;
      ctx.fillText(`λ=${wavelength}nm  a=${slitWidth}μm`, 12, 20);
      if (mode !== "single") ctx.fillText(`d=${slitSep}μm`, 12, 40);
      if (mode === "grating") ctx.fillText(`N=${slitCount}`, 12, 60);
    }
  }, [params, cmap, mode, wavelength, slitWidth, slitSep, slitCount, showLabels]);

  // === Render 1D intensity curve ===
  const renderIntensity = useCallback(() => {
    const canvas = intensityCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 20, right: 20, bottom: 35, left: 50 };
    const pw = w - margin.left - margin.right;
    const ph = h - margin.top - margin.bottom;

    // Axes
    ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + ph);
    ctx.lineTo(margin.left + pw, margin.top + ph);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#AAA"; ctx.font = `${w < 500 ? 10 : 12}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("I/I₀", margin.left - 28, margin.top + ph / 2);

    const xLabelText = w < 500 ? "x (mm)" : "位置 x (mm)";
    ctx.font = `${w < 500 ? 10 : 12}px monospace`;
    ctx.fillText(xLabelText, margin.left + pw / 2, margin.top + ph + 20);
    ctx.textAlign = "start";

    // Compute 1D profile
    const xRange = 60;
    const numPoints = 600;
    const profile = compute1DIntensity(params, numPoints, xRange);

    // Draw curve with gradient color
    ctx.beginPath();
    let firstPoint = true;
    for (let i = 0; i < numPoints; i++) {
      const px = margin.left + (i / (numPoints - 1)) * pw;
      const y = margin.top + ph - profile[i] * ph;
      if (firstPoint) {
        ctx.moveTo(px, y);
        firstPoint = false;
      } else {
        ctx.lineTo(px, y);
      }
    }
    // Fill area under curve with gradient
    ctx.save();
    const grad = ctx.createLinearGradient(0, margin.top, 0, margin.top + ph);
    grad.addColorStop(0, "rgba(240, 80, 40, 0.9)");
    grad.addColorStop(0.3, "rgba(240, 180, 40, 0.85)");
    grad.addColorStop(0.7, "rgba(60, 180, 220, 0.8)");
    grad.addColorStop(1, "rgba(20, 80, 180, 0.7)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Subtle fill under curve
    ctx.lineTo(margin.left + pw, margin.top + ph);
    ctx.lineTo(margin.left, margin.top + ph);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, margin.top, 0, margin.top + ph);
    fillGrad.addColorStop(0, "rgba(240, 80, 40, 0.12)");
    fillGrad.addColorStop(0.5, "rgba(240, 180, 40, 0.08)");
    fillGrad.addColorStop(1, "rgba(20, 80, 180, 0.05)");
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.restore();

    // Dark fringe markers
    const xRangeHalf = xRange / 2;
    const xToPxFn = (x_mm: number) => margin.left + ((x_mm + xRangeHalf) / xRange) * pw;

    const drawDarkFringe = (x_mm: number, color: string, label: string) => {
      if (Math.abs(x_mm) > xRangeHalf) return;
      const xPx = xToPxFn(x_mm);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xPx, margin.top);
      ctx.lineTo(xPx, margin.top + ph);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = `${w < 500 ? 9 : 10}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(label, xPx, margin.top + ph + 12);
    };

    const drawEnvelopeDarkFringes = (color: string, labelPrefix: string) => {
      for (let m = 1; m <= 8; m++) {
        const sinThetaM = (m * wl) / a;
        if (sinThetaM < 1) {
          const x_mm = L * Math.tan(Math.asin(sinThetaM)) * 1e3;
          drawDarkFringe(x_mm, color, `${labelPrefix}${m}`);
          drawDarkFringe(-x_mm, color, `${labelPrefix}${m}`);
        }
      }
    };

    if (mode === "single") {
      drawEnvelopeDarkFringes("#FF4444", "m");
    } else if (mode === "double" || mode === "grating") {
      drawEnvelopeDarkFringes("#FF4444", "e");
      for (let m = 0; m <= 8; m++) {
        const sinThetaM = ((m + 0.5) * wl) / d;
        if (sinThetaM < 1) {
          const x_mm = L * Math.tan(Math.asin(sinThetaM)) * 1e3;
          drawDarkFringe(x_mm, "#FF8800", `i${m}`);
          drawDarkFringe(-x_mm, "#FF8800", `i${m}`);
        }
      }
    }
  }, [params, mode, wavelength, slitWidth, slitSep, slitCount, screenDist, wl, a, d, L]);

  // Resize & render
  useEffect(() => {
    const c1 = patternCanvasRef.current;
    const c2 = intensityCanvasRef.current;
    if (!c1 || !c2) return;
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      c1.width = c1.clientWidth * dpr;
      c1.height = c1.clientHeight * dpr;
      c2.width = c2.clientWidth * dpr;
      c2.height = c2.clientHeight * dpr;
      renderPattern();
      renderIntensity();
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderPattern, renderIntensity]);

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 min-h-0 overflow-hidden">
        {/* Display area */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden border border-[#E9ECEF]">
          {/* 2D Diffraction pattern — colormap */}
          <div className="relative" style={{ flexBasis: "65%", minHeight: 200 }}>
            <canvas ref={patternCanvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
          </div>
          {/* Intensity curve */}
          <div className="relative border-t border-[#E9ECEF]" style={{ flexBasis: "35%", minHeight: 140 }}>
            <canvas ref={intensityCanvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>

        {/* Mobile collapse toggle */}
        <div className="lg:hidden border-t border-[#E9ECEF] bg-white">
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-full py-2.5 px-4 flex items-center justify-between text-sm font-medium text-[#495057] hover:bg-[#F8F9FA] transition-colors"
          >
            <span>参数控制</span>
            <span className="text-xs transition-transform duration-200" style={{ transform: panelOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              ▼
            </span>
          </button>
        </div>

        {/* Controls sidebar */}
        <aside className={`w-full lg:w-[320px] lg:border border-[#E9ECEF] rounded-xl bg-white px-4 py-3 space-y-3 overflow-y-auto flex-shrink-0
          ${panelOpen ? "block" : "hidden lg:block"}`}>
          <div>
            <h1 className="text-base font-semibold text-[#1A1A2E]">🌊 衍射与干涉模拟</h1>
            <p className="text-xs text-[#868E96]">标量衍射 · Fraunhofer 远场 · 2D 光强分布</p>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1 bg-[#F1F3F5] rounded-lg p-1">
            {(["single", "double", "grating"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                  mode === m ? "bg-[#1A1A2E] text-white font-medium" : "text-[#495057] hover:text-[#1A1A2E]"
                }`}
              >
                {m === "single" ? "单缝" : m === "double" ? "双缝" : "多缝(N)"}
              </button>
            ))}
          </div>

          {/* Colormap selector */}
          <div>
            <label className="text-xs font-medium text-[#495057] block mb-1.5">🎨 色谱方案</label>
            <div className="flex flex-wrap gap-1">
              {(["inferno", "jet", "hot", "viridis", "thermal"] as ColormapName[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCmap(c)}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    cmap === c
                      ? "border-[#1A1A2E] bg-[#1A1A2E] text-white"
                      : "border-[#DEE2E6] text-[#868E96] hover:border-[#ADB5BD]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[#343A40] block mb-1">波长 λ (nm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={380} max={780} step={5} value={wavelength}
                  onChange={e => setWavelength(parseInt(e.target.value))}
                  className="flex-1 accent-[#228BE6]" />
                <input type="text" inputMode="numeric" value={wlInput}
                  onChange={e => setWlInput(e.target.value)}
                  onBlur={() => clampCommit(wlInput, 380, 780, setWavelength)}
                  onKeyDown={e => { if (e.key === "Enter") clampCommit(wlInput, 380, 780, setWavelength); }}
                  className="w-[58px] text-xs text-center font-mono font-semibold text-[#228BE6] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#228BE6] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#343A40] block mb-1">缝宽 a (μm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={5} max={300} step={1} value={slitWidth}
                  onChange={e => setSlitWidth(parseInt(e.target.value))}
                  className="flex-1 accent-[#00E676]" />
                <input type="text" inputMode="numeric" value={swInput}
                  onChange={e => setSwInput(e.target.value)}
                  onBlur={() => clampCommit(swInput, 5, 300, setSlitWidth)}
                  onKeyDown={e => { if (e.key === "Enter") clampCommit(swInput, 5, 300, setSlitWidth); }}
                  className="w-[54px] text-xs text-center font-mono font-semibold text-[#00E676] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#00E676] focus:outline-none"
                />
              </div>
            </div>
            {mode !== "single" && (
              <div>
                <label className="text-sm font-medium text-[#343A40] block mb-1">缝间距 d (μm)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={slitWidth + 5} max={800} step={5} value={slitSep}
                    onChange={e => setSlitSep(parseInt(e.target.value))}
                    className="flex-1 accent-[#FFD740]" />
                  <input type="text" inputMode="numeric" value={ssInput}
                    onChange={e => setSsInput(e.target.value)}
                    onBlur={() => clampCommit(ssInput, slitWidth + 5, 800, setSlitSep)}
                    onKeyDown={e => { if (e.key === "Enter") clampCommit(ssInput, slitWidth + 5, 800, setSlitSep); }}
                    className="w-[54px] text-xs text-center font-mono font-semibold text-[#FFD740] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#FFD740] focus:outline-none"
                  />
                </div>
              </div>
            )}
            {mode === "grating" && (
              <div>
                <label className="text-sm font-medium text-[#343A40] block mb-1">缝数 N</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={2} max={20} step={1} value={slitCount}
                    onChange={e => setSlitCount(parseInt(e.target.value))}
                    className="flex-1 accent-[#FF6B00]" />
                  <input type="text" inputMode="numeric" value={scInput}
                    onChange={e => setScInput(e.target.value)}
                    onBlur={() => clampCommit(scInput, 2, 20, setSlitCount)}
                    onKeyDown={e => { if (e.key === "Enter") clampCommit(scInput, 2, 20, setSlitCount); }}
                    className="w-[44px] text-xs text-center font-mono font-semibold text-[#FF6B00] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#FF6B00] focus:outline-none"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-[#343A40] block mb-1">屏幕距离 L (mm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={200} max={5000} step={50} value={screenDist}
                  onChange={e => setScreenDist(parseInt(e.target.value))}
                  className="flex-1 accent-[#9C27B0]" />
                <input type="text" inputMode="numeric" value={sdInput}
                  onChange={e => setSdInput(e.target.value)}
                  onBlur={() => clampCommit(sdInput, 200, 5000, setScreenDist)}
                  onKeyDown={e => { if (e.key === "Enter") clampCommit(sdInput, 200, 5000, setScreenDist); }}
                  className="w-[58px] text-xs text-center font-mono font-semibold text-[#9C27B0] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#9C27B0] focus:outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="accent-[#1A1A2E]" />
              显示参数标签
            </label>
          </div>

          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg overflow-hidden">
            <div className="flex border-b border-[#DEE2E6]">
              {(["help", "formula", "fringe"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setInfoTab(t)}
                  className={`flex-1 py-1.5 text-xs transition-colors ${
                    infoTab === t ? "bg-white text-[#1A1A2E] font-medium" : "text-[#868E96] hover:text-[#495057]"
                  }`}
                >
                  {t === "help" ? "📖 说明" : t === "formula" ? "📐 公式" : "🌑 暗纹"}
                </button>
              ))}
            </div>
            <div className="p-3 text-xs text-[#868E96] space-y-1">
              {infoTab === "help" && (
                <>
                  <p>上方为 2D 衍射斑图（伪彩色光强分布），下方为 1D 光强曲线 I/I₀。</p>
                  <p>拖动滑块调整参数，所有图形实时更新。可切换色谱方案。</p>
                  <p>顶部的「单缝/双缝/多缝」可切换衍射模式。</p>
                </>
              )}
              {infoTab === "formula" && (
                <>
                  {mode === "single" && <p>I = I₀ · [sin(β)/β]²</p>}
                  {mode === "double" && <p>I = I₀ · [sin(β)/β]² · cos²(γ)</p>}
                  {mode === "grating" && <p>I = I₀ · [sin(β)/β]² · [sin(Nγ)/(N sin(γ))]²</p>}
                  <p>β = πa sin(θ)/λ</p>
                  {(mode === "double" || mode === "grating") && <p>γ = πd sin(θ)/λ</p>}
                </>
              )}
              {infoTab === "fringe" && (
                <>
                  {mode === "single" && (
                    <>
                      <p><span className="text-red-400">━</span> 单缝衍射暗纹 a·sinθ = mλ</p>
                      <p>m = ±1, ±2, ±3, …</p>
                      <p>位置 x = L·tan(arcsin(mλ/a))</p>
                    </>
                  )}
                  {mode === "double" && (
                    <>
                      <p><span className="text-red-400">━</span> 单缝包络暗纹 a·sinθ = mλ, m = ±1, ±2, …</p>
                      <p><span className="text-orange-400">━</span> 干涉暗纹 d·sinθ = (m+½)λ, m = 0, 1, 2, …</p>
                      <p>x = L·tan(arcsin((m+½)λ/d))</p>
                    </>
                  )}
                  {mode === "grating" && (
                    <>
                      <p><span className="text-red-400">━</span> 单缝包络暗纹 a·sinθ = mλ, m = ±1, ±2, …</p>
                      <p><span className="text-orange-400">━</span> 干涉暗纹 d·sinθ = (m+½)λ, m = 0, 1, 2, …</p>
                      <p>x = L·tan(arcsin((m+½)λ/d))</p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <a href="/community" className="flex items-center justify-between px-3 py-2 mt-3 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] hover:border-[#228BE6] hover:bg-[#E7F5FF] transition-all no-underline group">
              <span className="text-xs text-[#495057] group-hover:text-[#228BE6] flex items-center gap-1.5">
                <span className="text-sm">💬</span> 有问题或建议？去留言区聊聊
              </span>
              <span className="text-[10px] text-[#ADB5BD] group-hover:text-[#228BE6]">→</span>
            </a>

          <p className="text-xs text-[#ADB5BD] pt-2">
            ⚠ 基于 Fraunhofer 远场标量衍射（屏幕距离远大于缝宽）。
            不包含近场 Fresnel 衍射或矢量衍射效应。
          </p>
        </aside>
      </main>
    </div>
  );
}

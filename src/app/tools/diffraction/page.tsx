"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

export default function DiffractionPage() {
  const patternCanvasRef = useRef<HTMLCanvasElement>(null);
  const intensityCanvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"single" | "double" | "grating">("double");
  const [wavelength, setWavelength] = useState(550);
  const [slitWidth, setSlitWidth] = useState(50);
  const [slitSep, setSlitSep] = useState(200);
  const [slitCount, setSlitCount] = useState(5);
  const [screenDist, setScreenDist] = useState(1000);
  const [showLabels, setShowLabels] = useState(true);

  const wl = wavelength * 1e-9;
  const a = slitWidth * 1e-6;
  const d = slitSep * 1e-6;
  const L = screenDist * 1e-3;

  const renderPattern = useCallback(() => {
    const canvas = patternCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const xRange = 60; // mm on screen
    const scale = w / xRange;

    // Compute intensity at each pixel
    const imageData = ctx.createImageData(w, h);
    for (let px = 0; px < w; px++) {
      const x_mm = (px - cx) / scale;
      const theta = Math.atan2(x_mm, L);
      const sinTheta = Math.sin(theta);

      let I = 0;
      if (mode === "single") {
        const beta = (Math.PI * a * sinTheta) / wl;
        I = Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
      } else if (mode === "double") {
        const beta = (Math.PI * a * sinTheta) / wl;
        const gamma = (Math.PI * d * sinTheta) / wl;
        const sinc = Math.abs(beta) < 1e-9 ? 1 : Math.sin(beta) / beta;
        I = Math.pow(sinc, 2) * Math.pow(Math.cos(gamma), 2);
      } else {
        const beta = (Math.PI * a * sinTheta) / wl;
        const gamma = (Math.PI * d * sinTheta) / wl;
        const sinc = Math.abs(beta) < 1e-9 ? 1 : Math.sin(beta) / beta;
        const absSinGamma = Math.abs(Math.sin(gamma));
        let interference: number;
        if (absSinGamma < 1e-9) {
          interference = 1;
        } else {
          const num = Math.sin(slitCount * gamma);
          const denom = Math.sin(gamma);
          interference = (num / denom) * (num / denom) / (slitCount * slitCount);
        }
        I = Math.pow(sinc, 2) * interference;
      }

      // Map intensity to brightness (0-255), with gamma for visibility
      const brightness = Math.min(255, Math.pow(I, 0.6) * 300);
      for (let py = 0; py < h; py++) {
        const idx = (py * w + px) * 4;
        imageData.data[idx] = brightness;
        imageData.data[idx + 1] = brightness;
        imageData.data[idx + 2] = brightness;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Labels
    if (showLabels) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px monospace";
      ctx.fillText(`λ=${wavelength}nm  a=${slitWidth}μm`, 10, 16);
      if (mode !== "single") ctx.fillText(`d=${slitSep}μm`, 10, 32);
      if (mode === "grating") ctx.fillText(`N=${slitCount}`, 10, 48);
    }
  }, [mode, wavelength, slitWidth, slitSep, slitCount, screenDist, showLabels]);

  const renderIntensity = useCallback(() => {
    const canvas = intensityCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 20, right: 20, bottom: 35, left: 45 };
    const pw = w - margin.left - margin.right;
    const ph = h - margin.top - margin.bottom;

    // Axes
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + ph);
    ctx.lineTo(margin.left + pw, margin.top + ph);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#666"; ctx.font = "10px monospace";
    ctx.fillText("I/I₀", margin.left - 30, margin.top + ph / 2);
    ctx.fillText("位置 (mm)", margin.left + pw / 2 - 25, margin.top + ph + 22);

    // Plot intensity curve
    ctx.beginPath();
    const xRange = 40;
    let maxI = 0;
    const points: [number, number][] = [];
    for (let i = 0; i <= 400; i++) {
      const x_mm = ((i / 400) - 0.5) * xRange;
      const px = margin.left + (i / 400) * pw;
      const theta = Math.atan2(x_mm, L);
      const sinTheta = Math.sin(theta);

      let I = 0;
      if (mode === "single") {
        const beta = (Math.PI * a * sinTheta) / wl;
        I = Math.abs(beta) < 1e-9 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
      } else if (mode === "double") {
        const beta = (Math.PI * a * sinTheta) / wl;
        const gamma = (Math.PI * d * sinTheta) / wl;
        const sinc = Math.abs(beta) < 1e-9 ? 1 : Math.sin(beta) / beta;
        I = Math.pow(sinc, 2) * Math.pow(Math.cos(gamma), 2);
      } else {
        const beta = (Math.PI * a * sinTheta) / wl;
        const gamma = (Math.PI * d * sinTheta) / wl;
        const sinc = Math.abs(beta) < 1e-9 ? 1 : Math.sin(beta) / beta;
        const absSinGamma = Math.abs(Math.sin(gamma));
        let interference: number;
        if (absSinGamma < 1e-9) {
          interference = 1;
        } else {
          const num = Math.sin(slitCount * gamma);
          const denom = Math.sin(gamma);
          interference = (num / denom) * (num / denom) / (slitCount * slitCount);
        }
        I = Math.pow(sinc, 2) * interference;
      }
      maxI = Math.max(maxI, I);
      points.push([px, I]);
    }

    for (let i = 1; i < points.length; i++) {
      const [px1, i1] = points[i - 1];
      const [px2, i2] = points[i];
      const y1 = margin.top + ph - (i1 / maxI) * ph;
      const y2 = margin.top + ph - (i2 / maxI) * ph;
      ctx.beginPath();
      ctx.moveTo(px1, y1);
      ctx.lineTo(px2, y2);
      ctx.strokeStyle = "#00BFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw dark fringe markers
    const xRangeHalf = xRange / 2;
    const xToPx = (x_mm: number) => margin.left + ((x_mm + xRangeHalf) / xRange) * pw;

    const drawDarkFringe = (x_mm: number, color: string, label: string) => {
      if (Math.abs(x_mm) > xRangeHalf) return;
      const px = xToPx(x_mm);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(px, margin.top);
      ctx.lineTo(px, margin.top + ph);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label at bottom
      ctx.fillStyle = color;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, px, margin.top + ph + 12);
    };

    // Single-slit envelope dark fringes: a·sinθ = mλ → x = L·tan(asin(mλ/a))
    const drawEnvelopeDarkFringes = (color: string, labelPrefix: string) => {
      for (let m = 1; m <= 8; m++) {
        const sinThetaM = (m * wl) / a;
        if (sinThetaM < 1) {
          const x_mm = L * Math.tan(Math.asin(sinThetaM)) * 1e3; // convert to mm
          drawDarkFringe(x_mm, color, `${labelPrefix}${m}`);
          drawDarkFringe(-x_mm, color, `${labelPrefix}${m}`);
        }
      }
    };

    if (mode === "single") {
      // Single slit: only envelope dark fringes
      drawEnvelopeDarkFringes("#FF4444", "m");
    } else if (mode === "double" || mode === "grating") {
      // Envelope dark fringes (red)
      drawEnvelopeDarkFringes("#FF4444", "e");
      // Interference dark fringes (orange): d·sinθ = (m+0.5)λ → x = L·tan(asin((m+0.5)λ/d))
      for (let m = 0; m <= 8; m++) {
        const sinThetaM = ((m + 0.5) * wl) / d;
        if (sinThetaM < 1) {
          const x_mm = L * Math.tan(Math.asin(sinThetaM)) * 1e3;
          drawDarkFringe(x_mm, "#FF8800", `i${m}`);
          drawDarkFringe(-x_mm, "#FF8800", `i${m}`);
        }
      }
    }
  }, [mode, wavelength, slitWidth, slitSep, slitCount, screenDist]);

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#E9ECEF] bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg no-underline hover:no-underline">
            <span className="text-[#228BE6]">λ</span>
            <span className="text-[#1A1A2E]">OpticsKit</span>
          </Link>
          <Link href="/" className="text-sm text-[#495057] hover:text-[#1A1A2E]">← 首页</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Display area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Diffraction pattern */}
          <div className="flex-1 relative" style={{ minHeight: 300 }}>
            <canvas ref={patternCanvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
          </div>
          {/* Intensity curve */}
          <div className="h-40 relative border-t border-[#E9ECEF]">
            <canvas ref={intensityCanvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
          </div>
        </div>

        {/* Controls */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#E9ECEF] p-6 space-y-4 overflow-y-auto">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">🌊 衍射与干涉模拟</h2>
            <p className="text-xs text-[#868E96]">基于标量衍射理论 · Fraunhofer 远场近似</p>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1 bg-[#F1F3F5] rounded-lg p-1">
            {(["single", "double", "grating"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${
                  mode === m ? "bg-[#00BFFF] text-black font-medium" : "text-[#495057] hover:text-[#1A1A2E]"
                }`}
              >
                {m === "single" ? "单缝" : m === "double" ? "双缝" : "多缝(N)"}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#495057] block mb-1">波长 λ (nm)</label>
              <input type="range" min={380} max={780} step={5} value={wavelength}
                onChange={e => setWavelength(parseInt(e.target.value))}
                className="w-full accent-[#00BFFF]" />
              <span className="text-xs text-[#228BE6] font-mono">{wavelength} nm</span>
            </div>
            <div>
              <label className="text-xs text-[#495057] block mb-1">缝宽 a (μm)</label>
              <input type="range" min={5} max={300} step={1} value={slitWidth}
                onChange={e => setSlitWidth(parseInt(e.target.value))}
                className="w-full accent-[#00E676]" />
              <span className="text-xs text-[#00E676] font-mono">{slitWidth} μm</span>
            </div>
            {mode !== "single" && (
              <div>
                <label className="text-xs text-[#495057] block mb-1">缝间距 d (μm)</label>
                <input type="range" min={slitWidth + 5} max={800} step={5} value={slitSep}
                  onChange={e => setSlitSep(parseInt(e.target.value))}
                  className="w-full accent-[#FFD740]" />
                <span className="text-xs text-[#FFD740] font-mono">{slitSep} μm</span>
              </div>
            )}
            {mode === "grating" && (
              <div>
                <label className="text-xs text-[#495057] block mb-1">缝数 N</label>
                <input type="range" min={2} max={20} step={1} value={slitCount}
                  onChange={e => setSlitCount(parseInt(e.target.value))}
                  className="w-full accent-[#FF6B00]" />
                <span className="text-xs text-[#FF6B00] font-mono">{slitCount}</span>
              </div>
            )}
            <div>
              <label className="text-xs text-[#495057] block mb-1">屏幕距离 L (mm)</label>
              <input type="range" min={200} max={5000} step={50} value={screenDist}
                onChange={e => setScreenDist(parseInt(e.target.value))}
                className="w-full accent-[#9C27B0]" />
              <span className="text-xs text-[#9C27B0] font-mono">{screenDist} mm</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="accent-[#00BFFF]" />
              显示参数标签
            </label>
          </div>

          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3 text-xs text-[#868E96] space-y-1">
            <p className="text-[#495057] font-medium mb-1">📖 使用说明</p>
            <p>拖动右侧滑块调整参数，上方区域实时显示衍射条纹图样，下方曲线为光强分布 I/I₀。</p>
            <p>顶部的「单缝/双缝/多缝」可切换衍射模式。</p>
          </div>
          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3 text-xs text-[#868E96] space-y-1">
            <p className="text-[#495057] font-medium mb-1">公式</p>
            {mode === "single" && (
              <p>I = I₀ · [sin(β)/β]²</p>
            )}
            {mode === "double" && (
              <p>I = I₀ · [sin(β)/β]² · cos²(γ)</p>
            )}
            {mode === "grating" && (
              <p>I = I₀ · [sin(β)/β]² · [sin(Nγ)/(N sin(γ))]²</p>
            )}
            <p>β = πa sin(θ)/λ</p>
            {(mode === "double" || mode === "grating") && <p>γ = πd sin(θ)/λ</p>}
          </div>

          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3 text-xs space-y-1">
            <p className="text-[#495057] font-medium mb-1">🌑 暗纹条件</p>
            {mode === "single" && (
              <>
                <p><span className="text-red-400">━</span> 单缝衍射暗纹 a·sinθ = mλ</p>
                <p className="text-[#868E96]">m = ±1, ±2, ±3, …</p>
                <p className="text-[#868E96]">位置 x = L·tan(arcsin(mλ/a))</p>
              </>
            )}
            {mode === "double" && (
              <>
                <p><span className="text-red-400">━</span> 单缝包络暗纹 a·sinθ = mλ</p>
                <p className="text-[#868E96]">m = ±1, ±2, ±3, …</p>
                <p className="mt-1"><span className="text-orange-400">━</span> 干涉暗纹 d·sinθ = (m+½)λ</p>
                <p className="text-[#868E96]">m = 0, 1, 2, 3, …</p>
                <p className="text-[#868E96] mt-0.5">x = L·tan(arcsin((m+½)λ/d))</p>
              </>
            )}
            {mode === "grating" && (
              <>
                <p><span className="text-red-400">━</span> 单缝包络暗纹 a·sinθ = mλ</p>
                <p className="text-[#868E96]">m = ±1, ±2, ±3, …</p>
                <p className="mt-1"><span className="text-orange-400">━</span> 干涉暗纹 d·sinθ = (m+½)λ</p>
                <p className="text-[#868E96]">m = 0, 1, 2, 3, …</p>
                <p className="text-[#868E96] mt-0.5">x = L·tan(arcsin((m+½)λ/d))</p>
              </>
            )}
          </div>

          <p className="text-xs text-[#ADB5BD] pt-2">
            ⚠ 基于 Fraunhofer 远场标量衍射（屏幕距离远大于缝宽）。
            不包含近场 Fresnel 衍射或矢量衍射效应。
          </p>
        </aside>
      </main>
    </div>
  );
}

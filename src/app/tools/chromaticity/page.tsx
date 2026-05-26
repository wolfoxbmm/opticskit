"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import {
  CIE_WAVELENGTHS,
  CIE_X_BAR,
  CIE_Y_BAR,
  CIE_Z_BAR,
} from "@/lib/colorimetry/cmf-generated";
import {
  xyzToChromaticity,
  xyToUvPrime,
  cctWithDuv,
  xyzToSRGB,
  wavelengthToColor,
  planckSpectrum,
} from "@/lib/colorimetry";

// ============================================================
// 预计算 CIE 1931 光谱轨迹 + 色域边界
// ============================================================
interface Point {
  x: number;
  y: number;
}

let cachedSpectralLocus: Point[] | null = null;
let cachedWhitePoint: Point | null = null;
let cachedBlackbodyLocus: Point[] | null = null;
let cachedSRGBGamut: Point[] | null = null;
let cachedDisplayP3Gamut: Point[] | null = null;

function getSpectralLocus(): Point[] {
  if (cachedSpectralLocus) return cachedSpectralLocus;
  const locus: Point[] = [];
  for (let i = 0; i < CIE_WAVELENGTHS.length; i++) {
    const X = CIE_X_BAR[i];
    const Y = CIE_Y_BAR[i];
    const Z = CIE_Z_BAR[i];
    const sum = X + Y + Z;
    if (sum > 0) {
      locus.push({ x: X / sum, y: Y / sum });
    }
  }
  cachedSpectralLocus = locus;
  return locus;
}

function getWhitePoint(): Point {
  if (cachedWhitePoint) return cachedWhitePoint;
  // D65: x=0.31271, y=0.32902
  cachedWhitePoint = { x: 0.31271, y: 0.32902 };
  return cachedWhitePoint;
}

function getBlackbodyLocus(): Point[] {
  if (cachedBlackbodyLocus) return cachedBlackbodyLocus;
  const points: Point[] = [];
  const temps = [
    1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800,
    3000, 3200, 3400, 3600, 3800, 4000, 4200, 4400, 4600, 4800,
    5000, 5500, 6000, 6500, 7000, 8000, 9000, 10000, 12000, 14000, 16000, 20000, 25000, 30000, 40000
  ];
  const wls = Array.from(CIE_WAVELENGTHS);
  for (const T of temps) {
    const spd = planckSpectrum(T, wls);
    let X = 0, Y = 0, Z = 0;
    for (let i = 0; i < wls.length; i++) {
      X += spd[i] * CIE_X_BAR[i];
      Y += spd[i] * CIE_Y_BAR[i];
      Z += spd[i] * CIE_Z_BAR[i];
    }
    const sum = X + Y + Z;
    if (sum > 0) points.push({ x: X / sum, y: Y / sum });
  }
  cachedBlackbodyLocus = points;
  return points;
}

function getSRGBGamut(): Point[] {
  if (cachedSRGBGamut) return cachedSRGBGamut;
  // sRGB primaries in CIE xy
  cachedSRGBGamut = [
    { x: 0.64, y: 0.33 },   // Red
    { x: 0.30, y: 0.60 },   // Green
    { x: 0.15, y: 0.06 },   // Blue
  ];
  return cachedSRGBGamut;
}

function getDisplayP3Gamut(): Point[] {
  if (cachedDisplayP3Gamut) return cachedDisplayP3Gamut;
  cachedDisplayP3Gamut = [
    { x: 0.68, y: 0.32 },
    { x: 0.265, y: 0.69 },
    { x: 0.15, y: 0.06 },
  ];
  return cachedDisplayP3Gamut;
}

// ============================================================
// Canvas 渲染
// ============================================================
export default function ChromaticityPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    wavelength?: number;
    color: string;
    cct?: number;
  } | null>(null);
  const [clickInfo, setClickInfo] = useState<{
    x: number;
    y: number;
    uPrime: number;
    vPrime: number;
    cct: number;
    duv: number;
    color: string;
    inGamut: boolean;
  } | null>(null);
  const [showSRGB, setShowSRGB] = useState(true);
  const [showP3, setShowP3] = useState(false);
  const [showBlackbody, setShowBlackbody] = useState(true);
  const [inputX, setInputX] = useState("");
  const [inputY, setInputY] = useState("");

  // 共享的点击/定位逻辑
  const locatePoint = useCallback(
    (xy: Point) => {
      const uv = xyToUvPrime(xy.x, xy.y);
      const cctResult = cctWithDuv(uv);
      const cctVal = Number.isFinite(cctResult.cct) ? cctResult.cct : 0;
      const duv = cctResult.duv;
      const yy = 1.0;
      const denom = xy.y || 1e-9;
      const xyz = { X: (xy.x / denom) * yy, Y: yy, Z: ((1 - xy.x - xy.y) / denom) * yy };
      const srgb = xyzToSRGB({ X: xyz.X / 100, Y: xyz.Y / 100, Z: xyz.Z / 100 });
      const inGamut = srgb.r >= 0 && srgb.r <= 1 && srgb.g >= 0 && srgb.g <= 1 && srgb.b >= 0 && srgb.b <= 1;
      const cr = Math.max(0, Math.min(255, Math.round(srgb.r * 255)));
      const cg = Math.max(0, Math.min(255, Math.round(srgb.g * 255)));
      const cb = Math.max(0, Math.min(255, Math.round(srgb.b * 255)));

      setClickInfo({
        x: xy.x,
        y: xy.y,
        uPrime: uv.uPrime,
        vPrime: uv.vPrime,
        cct: cctVal,
        duv,
        color: `rgb(${cr},${cg},${cb})`,
        inGamut,
      });
    },
    []
  );

  const w2c = useCallback((canvas: HTMLCanvasElement, px: number, py: number): Point | null => {
    const w = canvas.width;
    const h = canvas.height;
    const margin = 50;
    const pw = w - margin * 2;
    const ph = h - margin * 2;
    // CIE xy 范围: x ∈ [0, 0.8], y ∈ [0, 0.9]
    const cx = ((px - margin) / pw) * 0.8;
    const cy = ((ph - (py - margin)) / ph) * 0.9;
    return { x: cx, y: cy };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const margin = 50;
    const pw = w - margin * 2;
    const ph = h - margin * 2;

    const toCanvas = (cx: number, cy: number): [number, number] => {
      return [margin + (cx / 0.8) * pw, h - margin - (cy / 0.9) * ph];
    };

    // 背景
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, h);

    // 光谱轨迹填充 (带波长颜色)
    const locus = getSpectralLocus();
    if (locus.length > 0) {
      // 绘制色域填充
      ctx.beginPath();
      const [sx0, sy0] = toCanvas(locus[0].x, locus[0].y);
      ctx.moveTo(sx0, sy0);
      for (let i = 1; i < locus.length; i++) {
        const [cx, cy] = toCanvas(locus[i].x, locus[i].y);
        ctx.lineTo(cx, cy);
      }
      // 闭合纯光谱紫线
      const [lx, ly] = toCanvas(locus[locus.length - 1].x, locus[locus.length - 1].y);
      const [fx, fy] = toCanvas(locus[0].x, locus[0].y);
      ctx.lineTo(lx, ly); // 实际应该连回起点，CIE 用紫线连接两端
      ctx.closePath();
      ctx.fillStyle = "rgba(0, 191, 255, 0.05)";
      ctx.fill();

      // 光谱轨迹曲线 (渐变彩色)
      for (let i = 1; i < locus.length; i++) {
        const wl = 360 + i;
        const wlColor = wavelengthToColor(wl);
        const [x1, y1] = toCanvas(locus[i - 1].x, locus[i - 1].y);
        const [x2, y2] = toCanvas(locus[i].x, locus[i].y);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgb(${wlColor.r},${wlColor.g},${wlColor.b})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 关键波长标注
      const markWls = [400, 450, 500, 550, 600, 650, 700];
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "9px monospace";
      for (const wl of markWls) {
        const idx = wl - 360;
        if (idx >= 0 && idx < locus.length) {
          const [lx, ly] = toCanvas(locus[idx].x, locus[idx].y);
          ctx.fillText(`${wl}`, lx + 3, ly - 4);
        }
      }

      // 紫线 (380-780nm 直线连接)
      const [sx, sy] = toCanvas(locus[0].x, locus[0].y);
      const [ex, ey] = toCanvas(locus[locus.length - 1].x, locus[locus.length - 1].y);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 白点
    const wp = getWhitePoint();
    const [wpx, wpy] = toCanvas(wp.x, wp.y);
    ctx.beginPath();
    ctx.arc(wpx, wpy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 黑体轨迹
    if (showBlackbody) {
      const bb = getBlackbodyLocus();
      const bbTemps = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000, 15000, 20000, 30000, 40000];
      ctx.beginPath();
      const [bbx0, bby0] = toCanvas(bb[0].x, bb[0].y);
      ctx.moveTo(bbx0, bby0);
      for (let i = 1; i < bb.length; i++) {
        const [bx, by] = toCanvas(bb[i].x, bb[i].y);
        ctx.lineTo(bx, by);
      }
      ctx.strokeStyle = "rgba(255, 107, 0, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Temperature labels along blackbody locus
      ctx.fillStyle = "rgba(255, 107, 0, 0.7)";
      ctx.font = "9px monospace";
      const bbIndexMap: Record<number, number> = { 2000: 5, 3000: 9, 4000: 13, 5000: 16, 6500: 20, 10000: 24, 20000: 30 };
      for (const [tk, idx] of Object.entries(bbIndexMap)) {
        if (idx < bb.length) {
          const [lx, ly] = toCanvas(bb[idx].x, bb[idx].y);
          const label = parseInt(tk) >= 10000 ? `${parseInt(tk) / 1000}KK` : `${tk}K`;
          ctx.fillText(label, lx + 4, ly - 4);
        }
      }
    }

    // sRGB 色域
    if (showSRGB) {
      drawGamutTriangle(ctx, getSRGBGamut(), toCanvas, "rgba(0, 230, 118, 0.3)", "rgba(0, 230, 118, 0.5)");
    }

    // Display P3 色域
    if (showP3) {
      drawGamutTriangle(ctx, getDisplayP3Gamut(), toCanvas, "rgba(0, 191, 255, 0.3)", "rgba(0, 191, 255, 0.5)");
    }

    // 坐标轴标签
    ctx.fillStyle = "#666";
    ctx.font = "11px monospace";
    ctx.fillText("0.0", margin - 4, h - margin + 14);
    ctx.fillText("0.2", margin + pw * 0.25 - 10, h - margin + 14);
    ctx.fillText("0.4", margin + pw * 0.5 - 10, h - margin + 14);
    ctx.fillText("0.6", margin + pw * 0.75 - 10, h - margin + 14);
    ctx.fillText("0.8", margin + pw - 14, h - margin + 14);
    ctx.fillText("x", margin + pw / 2, h - margin + 28);
    ctx.fillText("0.0", margin - 20, h - margin + 4);
    ctx.fillText("0.2", margin - 20, h - margin - ph * 0.222 + 4);
    ctx.fillText("0.4", margin - 20, h - margin - ph * 0.444 + 4);
    ctx.fillText("0.6", margin - 20, h - margin - ph * 0.667 + 4);
    ctx.fillText("0.8", margin - 20, margin + 4);
    ctx.fillText("y", margin - 16, margin + ph / 2);

    // 坐标系
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, h - margin);
    ctx.lineTo(margin + pw, h - margin);
    ctx.moveTo(margin, h - margin);
    ctx.lineTo(margin, margin);
    ctx.stroke();
  }, [showSRGB, showP3, showBlackbody]);

  function drawGamutTriangle(
    ctx: CanvasRenderingContext2D,
    gamut: Point[],
    toCanvas: (x: number, y: number) => [number, number],
    fillColor: string,
    strokeColor: string
  ) {
    ctx.beginPath();
    const [x0, y0] = toCanvas(gamut[0].x, gamut[0].y);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < gamut.length; i++) {
      const [xi, yi] = toCanvas(gamut[i].x, gamut[i].y);
      ctx.lineTo(xi, yi);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const xy = w2c(canvas, mx, my);
      if (!xy) return;
      // 计算最近波长
      const locus = getSpectralLocus();
      let bestWl = 0;
      let bestDist = Infinity;
      for (let i = 0; i < locus.length; i++) {
        const dx = xy.x - locus[i].x;
        const dy = xy.y - locus[i].y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestWl = 360 + i;
        }
      }
      const wlColor = wavelengthToColor(bestWl);
      const uv = xyToUvPrime(xy.x, xy.y);
      const cctResult = cctWithDuv(uv);
      setHoverInfo({
        x: xy.x,
        y: xy.y,
        wavelength: bestDist < 0.005 ? bestWl : undefined,
        color: `rgb(${wlColor.r},${wlColor.g},${wlColor.b})`,
        cct: Number.isFinite(cctResult.cct) ? cctResult.cct : undefined,
      });
    },
    [w2c]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const xy = w2c(canvas, mx, my);
      if (!xy) return;
      locatePoint(xy);
    },
    [w2c, locatePoint]
  );

  useEffect(() => {
    render();
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#E9ECEF] bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight no-underline hover:no-underline">
            <span className="text-[#228BE6]">λ</span>
            <span className="text-[#1A1A2E]">OpticsKit</span>
          </Link>
          <Link href="/" className="text-sm text-[#495057] hover:text-[#1A1A2E]">
            ← 首页
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas */}
        <div className="flex-1 relative min-h-[500px]">
          <canvas
            ref={canvasRef}
            className="w-full h-full absolute inset-0 cursor-crosshair"
            style={{ width: "100%", height: "100%" }}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
          />
          {/* Hover info overlay */}
          {hoverInfo && (
            <div className="absolute top-4 left-4 bg-[#F1F3F5]/90 backdrop-blur-lg border border-[#DEE2E6] rounded-lg px-4 py-3 text-sm z-10">
              <div className="text-[#495057]">
                光标: <span className="text-[#1A1A2E] font-mono">({hoverInfo.x.toFixed(4)}, {hoverInfo.y.toFixed(4)})</span>
              </div>
              {hoverInfo.wavelength && (
                <div className="text-[#495057]">
                  波长: <span className="text-[#1A1A2E] font-mono">{hoverInfo.wavelength} nm</span>
                </div>
              )}
              <div className="text-[#495057]">
                色温: <span className="text-[#1A1A2E] font-mono">{hoverInfo.cct?.toFixed(0) ?? "—"} K</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-6 h-6 rounded border border-[#DEE2E6]"
                  style={{ backgroundColor: hoverInfo.color }}
                />
                <span className="font-mono text-xs text-[#868E96]">{hoverInfo.color}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#E9ECEF] p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">CIE 1931 色度图</h2>
            <p className="text-xs text-[#868E96]">
              基于 ISO/CIE 11664-1:2019 标准 · CIE 1931 2° 标准观察者
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input
                type="checkbox"
                checked={showSRGB}
                onChange={(e) => setShowSRGB(e.target.checked)}
                className="accent-[#00E676]"
              />
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#00E676]" />
              sRGB 色域
            </label>
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input
                type="checkbox"
                checked={showP3}
                onChange={(e) => setShowP3(e.target.checked)}
                className="accent-[#00BFFF]"
              />
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#00BFFF]" />
              DCI-P3 色域
            </label>
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input
                type="checkbox"
                checked={showBlackbody}
                onChange={(e) => setShowBlackbody(e.target.checked)}
                className="accent-[#FF6B00]"
              />
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#FF6B00]" />
              黑体轨迹
            </label>
          </div>

          {/* Coordinate input */}
          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#1A1A2E]">坐标输入定位</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-[#868E96] block mb-0.5">x</label>
                <input
                  type="number"
                  min={0}
                  max={0.8}
                  step={0.0001}
                  value={inputX}
                  onChange={e => setInputX(e.target.value)}
                  placeholder="0.3127"
                  className="w-full bg-white border border-[#DEE2E6] rounded px-2 py-1.5 text-sm font-mono text-[#1A1A2E] outline-none focus:border-[#228BE6]"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#868E96] block mb-0.5">y</label>
                <input
                  type="number"
                  min={0}
                  max={0.9}
                  step={0.0001}
                  value={inputY}
                  onChange={e => setInputY(e.target.value)}
                  placeholder="0.3290"
                  className="w-full bg-white border border-[#DEE2E6] rounded px-2 py-1.5 text-sm font-mono text-[#1A1A2E] outline-none focus:border-[#228BE6]"
                />
              </div>
            </div>
            <button
              onClick={() => {
                const x = parseFloat(inputX);
                const y = parseFloat(inputY);
                if (isNaN(x) || isNaN(y)) return;
                if (x < 0 || x > 0.8 || y < 0 || y > 0.9) return;
                locatePoint({ x, y });
              }}
              className="w-full bg-[#228BE6] text-white text-sm font-medium rounded-lg py-2 hover:bg-[#1c7ed6] transition-colors"
            >
              定位
            </button>
            <div className="text-xs text-[#ADB5BD] leading-relaxed">
              <p className="mb-1">示例坐标：</p>
              <p>D65: <span className="font-mono text-[#495057]">0.3127, 0.3290</span></p>
              <p>等能白: <span className="font-mono text-[#495057]">0.3333, 0.3333</span></p>
              <p>sRGB 红: <span className="font-mono text-[#495057]">0.6400, 0.3300</span></p>
            </div>
          </div>

          {/* Click result */}
          {clickInfo && (
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-[#1A1A2E]">选中点</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-[#868E96]">x, y</span>
                <span className="font-mono text-[#1A1A2E]">({clickInfo.x.toFixed(4)}, {clickInfo.y.toFixed(4)})</span>
                <span className="text-[#868E96]">u', v'</span>
                <span className="font-mono text-[#1A1A2E]">({clickInfo.uPrime.toFixed(4)}, {clickInfo.vPrime.toFixed(4)})</span>
                <span className="text-[#868E96]">CCT</span>
                <span className="font-mono text-[#FF6B00]">{Number.isFinite(clickInfo.cct) && clickInfo.cct > 0 ? clickInfo.cct.toFixed(0) + " K" : "—"}</span>
                <span className="text-[#868E96]">Duv</span>
                <span className="font-mono text-[#1A1A2E]">{Number.isFinite(clickInfo.duv) ? clickInfo.duv.toFixed(5) : "—"}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded border border-[#DEE2E6]"
                  style={{ backgroundColor: clickInfo.color }}
                />
                <span className="text-xs text-[#868E96]">
                  {clickInfo.inGamut ? "✓ 在 sRGB 色域内" : "⚠ 超出 sRGB 色域 (颜色仅示意)"}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-[#ADB5BD] leading-relaxed pt-4">
            点击马蹄图形区域任意位置查看色坐标和色温。
            超出 sRGB 色域的颜色为近似显示，物理上无法在普通屏幕上精准再现。
          </p>
        </aside>
      </main>
    </div>
  );
}

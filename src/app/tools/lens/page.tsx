"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

export default function LensPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objectDist, setObjectDist] = useState(200);
  const [focalLength, setFocalLength] = useState(150);
  const [objectHeight, setObjectHeight] = useState(50);
  const [showRays, setShowRays] = useState(true);

  const eps = 1e-6;
  const f = focalLength;
  const u = objectDist;
  const h = objectHeight;
  const v = Math.abs(f) > eps && Math.abs(u - f) > eps ? (u * f) / (u - f) : 0;
  const m = u !== 0 ? -v / u : 0;
  const hi = Math.abs(m * h);
  const isVirtual = v < 0;
  const isConcave = f < 0;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, hc = canvas.height;
    ctx.clearRect(0, 0, w, hc);
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, hc);

    const scale = Math.min(w / 800, hc / 400);
    const cx = w / 2;
    const cy = hc / 2;
    const lensX = cx + (Math.abs(f) > 200 ? 40 * scale : 0);

    // Optical axis
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy); ctx.stroke();

    const D = 140 * scale, halfD = D / 2;
    const edgeThick = 8 * scale;
    const centerThick = isConcave ? 3 * scale : 28 * scale;
    const leftCx = lensX - centerThick / 2;
    const rightCx = lensX + centerThick / 2;
    const leftEdgeX = lensX - edgeThick / 2;
    const rightEdgeX = lensX + edgeThick / 2;

    ctx.strokeStyle = "rgba(0,191,255,0.7)"; ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(0,191,255,0.06)";

    ctx.beginPath();
    ctx.moveTo(leftEdgeX, cy - halfD);
    ctx.quadraticCurveTo(leftCx, cy, leftEdgeX, cy + halfD);
    ctx.lineTo(rightEdgeX, cy + halfD);
    ctx.quadraticCurveTo(rightCx, cy, rightEdgeX, cy - halfD);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(leftEdgeX, cy - halfD);
    ctx.quadraticCurveTo(leftCx, cy, leftEdgeX, cy + halfD);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEdgeX, cy + halfD);
    ctx.quadraticCurveTo(rightCx, cy, rightEdgeX, cy - halfD);
    ctx.stroke();

    // Focal points — F = object-side focal point, F' = image-side focal point
    // For convex lens (f>0): F left of lens, F' right of lens
    // For concave lens (f<0): F right of lens, F' left of lens
    const fObjX = lensX - scale * f;  // object-side focal point (F)
    const fImgX = lensX + scale * f;  // image-side focal point (F')
    [
      { x: fObjX, label: isConcave ? "F'" : "F" },
      { x: fImgX, label: isConcave ? "F" : "F'" }
    ].forEach(fp => {
      if (fp.x > 20 && fp.x < w - 20) {
        ctx.fillStyle = "#FFD740";
        ctx.beginPath(); ctx.arc(fp.x, cy, 4 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#FFD740";
        ctx.font = `${10 * scale}px monospace`;
        ctx.fillText(fp.label, fp.x - 4 * scale, cy + 14 * scale);
      }
    });

    // Object
    const objX = lensX - scale * u;
    if (objX > 10) {
      const top = cy - scale * h;
      ctx.strokeStyle = "#00E676"; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(objX, cy); ctx.lineTo(objX, top); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(objX, top); ctx.lineTo(objX - 5 * scale, top + 8 * scale);
      ctx.moveTo(objX, top); ctx.lineTo(objX + 5 * scale, top + 8 * scale);
      ctx.stroke();
    }

    // Image — real image to the right of lens (convex u>f) or left (concave)
    const imgX = lensX + scale * v;
    if (Math.abs(v) > 0 && isVirtual && imgX > 10 && imgX < w - 10) {
      // Virtual image — same side as object (lens left side for convex, right side for concave)
      const imgTop = cy + (m < 0 ? -1 : 1) * scale * hi;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "rgba(255,82,82,0.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(imgX, cy); ctx.lineTo(imgX, imgTop); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,82,82,0.7)";
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.fillText("虚像", imgX - 18 * scale, cy - 6 * scale);
    } else if (Math.abs(v) > 0 && imgX > 10 && imgX < w - 10) {
      const imgTop = cy - scale * hi;
      ctx.strokeStyle = "#FF5252"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(imgX, cy); ctx.lineTo(imgX, imgTop); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(imgX, imgTop); ctx.lineTo(imgX - 5 * scale, imgTop + 8 * scale);
      ctx.moveTo(imgX, imgTop); ctx.lineTo(imgX + 5 * scale, imgTop + 8 * scale);
      ctx.stroke();
      ctx.fillStyle = "#FF5252";
      ctx.font = `${10 * scale}px sans-serif`;
      ctx.fillText("实像" + (m < 0 ? " (倒立)" : ""), imgX - 22 * scale, imgTop - 6 * scale);
    }

    // Principal rays
    if (showRays && h > 0 && objX > 10) {
      const objTop = cy - scale * h;
      const lensTop = cy - D / 2;
      // Where the parallel ray hits the lens (clamped to lens aperture)
      const hitY = Math.max(objTop, lensTop);
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.45;

      // Ray 1: parallel to axis → through (or from) focal point
      ctx.strokeStyle = "#00E676"; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(objX, objTop); ctx.lineTo(lensX, hitY); ctx.stroke();
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(lensX, hitY); ctx.lineTo(isConcave ? fObjX : fImgX, cy); ctx.stroke();

      // Ray 2: straight through center
      ctx.setLineDash([3, 3]); ctx.strokeStyle = "#FFD740";
      if (!isVirtual && Math.abs(v) > 0) {
        const imgTop = cy - scale * hi;
        ctx.beginPath(); ctx.moveTo(objX, objTop); ctx.lineTo(lensX, cy); ctx.moveTo(lensX, cy); ctx.lineTo(imgX, imgTop); ctx.stroke();
      } else if (isVirtual && Math.abs(v) > 0) {
        const imgTop = cy + (m < 0 ? -1 : 1) * scale * hi;
        ctx.beginPath(); ctx.moveTo(objX, objTop); ctx.lineTo(imgX, imgTop); ctx.stroke();
      }

      // Ray 3: through focal point → parallel
      const focalEntrance = isConcave ? fImgX : fObjX;
      ctx.strokeStyle = "#FF6B00"; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(objX, objTop); ctx.lineTo(focalEntrance, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(focalEntrance, cy); ctx.lineTo(lensX, hitY); ctx.stroke();
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(lensX, hitY); ctx.lineTo(isConcave ? lensX - 500 * scale : lensX + 500 * scale, hitY); ctx.stroke();

      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }, [focalLength, objectDist, objectHeight, showRays]);

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

  const vInfo = isVirtual ? `${Math.abs(v).toFixed(0)} mm (虚像, 同侧)` : `${v.toFixed(0)} mm${v < 0 ? " (同侧)" : ""}`;
  const mInfo = m.toFixed(2) + "×" + (m < 0 ? " (倒立)" : m > 0 ? " (正立)" : "");

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
        <div className="flex-1 relative min-h-[400px]">
          <canvas ref={canvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
        </div>

        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#E9ECEF] p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">🔬 透镜成像模拟</h2>
            <p className="text-xs text-[#868E96]">
              薄透镜近轴近似 · {isConcave ? "凹透镜" : "凸透镜"} · 光线追迹
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#495057] block mb-1">焦距 f (mm) {isConcave ? "(负值 = 凹透镜)" : "(正值 = 凸透镜)"}</label>
              <input type="range" min={-400} max={400} step={5} value={focalLength}
                onChange={e => setFocalLength(parseInt(e.target.value))}
                className="w-full accent-[#00BFFF]" />
              <span className="text-xs text-[#228BE6] font-mono">{focalLength} mm</span>
            </div>
            <div>
              <label className="text-xs text-[#495057] block mb-1">物距 u (mm)</label>
              <input type="range" min={20} max={600} step={5} value={objectDist}
                onChange={e => setObjectDist(parseInt(e.target.value))}
                className="w-full accent-[#00E676]" />
              <span className="text-xs text-[#00E676] font-mono">{objectDist} mm</span>
            </div>
            <div>
              <label className="text-xs text-[#495057] block mb-1">物高 h (mm)</label>
              <input type="range" min={5} max={120} step={1} value={objectHeight}
                onChange={e => setObjectHeight(parseInt(e.target.value))}
                className="w-full accent-[#FFD740]" />
              <span className="text-xs text-[#FFD740] font-mono">{objectHeight} mm</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input type="checkbox" checked={showRays} onChange={e => setShowRays(e.target.checked)} className="accent-[#00BFFF]" />
              显示光线追迹
            </label>
          </div>

          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#868E96]">像距 v</span><span className="font-mono text-[#1A1A2E]">{v !== 0 && !isNaN(v) ? vInfo : "u = f (不成像)"}</span></div>
            <div className="flex justify-between"><span className="text-[#868E96]">放大率 M</span><span className="font-mono text-[#1A1A2E]">{mInfo}</span></div>
            <div className="flex justify-between"><span className="text-[#868E96]">像高</span><span className="font-mono text-[#1A1A2E]">{hi.toFixed(1)} mm</span></div>
            <div className="flex justify-between"><span className="text-[#868E96]">1/f = 1/u + 1/v</span><span className="font-mono text-[#ADB5BD] text-xs">薄透镜公式</span></div>
          </div>

          <p className="text-xs text-[#ADB5BD] pt-4">
            ⚠ 薄透镜近轴近似，不替代专业光学设计（Zemax、Code V）。
            绿=平行光线，黄=过中心光线，橙=过焦点光线。
          </p>
        </aside>
      </main>
    </div>
  );
}

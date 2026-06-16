"use client";



﻿"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export default function LensPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objectDist, setObjectDist] = useState(300);
  const [focalLength, setFocalLength] = useState(150);
  const [objectHeight, setObjectHeight] = useState(50);
  const [focalInput, setFocalInput] = useState(String(150));
  const [odInput, setOdInput] = useState(String(300));
  const [ohInput, setOhInput] = useState(String(50));

  // Sync input display when slider value changes
  useEffect(() => { setFocalInput(String(focalLength)); }, [focalLength]);
  useEffect(() => { setOdInput(String(objectDist)); }, [objectDist]);
  useEffect(() => { setOhInput(String(objectHeight)); }, [objectHeight]);

  const [showRays, setShowRays] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uParam = params.get('u');
    const fParam = params.get('f');
    const hParam = params.get('h');
    if (uParam) setObjectDist(Number(uParam));
    if (fParam) setFocalLength(Number(fParam));
    if (hParam) setObjectHeight(Number(hParam));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    params.set('u', String(objectDist));
    params.set('f', String(focalLength));
    params.set('h', String(objectHeight));
    const newUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newUrl);
  }, [objectDist, focalLength, objectHeight, hydrated]);

  const eps = 1e-6;
  const f = focalLength;
  const u = objectDist;
  const h = objectHeight;
  const v = Math.abs(f) > eps && Math.abs(u - f) > eps ? (u * f) / (u - f) : 0;
  const m = u !== 0 ? -v / u : 0;
  const hi = Math.abs(m * h);
  const isVirtual = v < 0;
  const isConcave = f < 0;
  const noImage = Math.abs(u - f) < eps || Math.abs(v) < eps;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const w = canvas.width, hc = canvas.height;
    ctx.clearRect(0, 0, w, hc);
    // Dark lab bench background
    ctx.fillStyle = "#0D1117";
    ctx.fillRect(0, 0, w, hc);

    // Auto-scale
    let scale = Math.min(w / 800, hc / 400);
    const cx = w / 2;
    const cy = hc / 2;
    {
      const margin = 50;
      const tmpLensX = cx + (Math.abs(f) > 200 ? 40 * scale : 0);
      const objX0 = tmpLensX - scale * u;
      const imgX0 = tmpLensX + scale * v;
      const fObjX0 = tmpLensX - scale * f;
      const fImgX0 = tmpLensX + scale * f;
      const allX = [objX0, imgX0, fObjX0, fImgX0];
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      if (minX < margin) {
        const leftSpan = tmpLensX - minX;
        scale = Math.min(scale, (tmpLensX - margin) / Math.max(leftSpan / scale, 1));
      }
      if (maxX > w - margin) {
        const rightSpan = maxX - tmpLensX;
        const allowedRight = (w - margin) - tmpLensX;
        if (rightSpan > 0 && allowedRight > 0) {
          scale = Math.min(scale, (allowedRight / (rightSpan / scale)));
        }
      }
      const needTop = scale * h + margin;
      if (needTop > cy) scale = Math.min(scale, (cy - margin) / h);
      if (hi > 0) {
        const needBottom = scale * hi + margin;
        const availableBot = hc - cy;
        if (needBottom > availableBot) scale = Math.min(scale, (availableBot - margin) / hi);
      }
    }
    const lensX = cx + (Math.abs(f) > 200 ? 40 * scale : 0);

    // ===== Optical axis with arrow =====
    ctx.strokeStyle = "#2A3040"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(15, cy); ctx.lineTo(w - 15, cy); ctx.stroke();
    // Arrow tip
    ctx.fillStyle = "#2A3040";
    ctx.beginPath();
    ctx.moveTo(w - 15, cy);
    ctx.lineTo(w - 25, cy - 6);
    ctx.lineTo(w - 25, cy + 6);
    ctx.closePath();
    ctx.fill();

    // ===== Scale ruler (top) =====
    const rulerY = 16;
    ctx.strokeStyle = "#1E2530"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(15, rulerY); ctx.lineTo(w - 15, rulerY); ctx.stroke();
    // Tick marks every 50mm
    const tickStart = Math.ceil((-lensX / scale) / 50) * 50;
    const tickEnd = Math.floor(((w - lensX) / scale) / 50) * 50;
    for (let mm = tickStart; mm <= tickEnd; mm += 50) {
      const tx = lensX + scale * mm;
      if (tx < 15 || tx > w - 15) continue;
      const tickH = mm % 100 === 0 ? 10 * scale : 5 * scale;
      ctx.strokeStyle = "#3A4050"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, rulerY); ctx.lineTo(tx, rulerY + tickH); ctx.stroke();
      if (mm % 100 === 0) {
        ctx.fillStyle = "#4A5060";
        ctx.font = `${Math.max(9, 9 * scale)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(`${mm}`, tx, rulerY + tickH + 12 * scale);
      }
    }

    // ===== Lens =====
    const D = 140 * scale, halfD = D / 2;
    const centerThick = isConcave ? 3 * scale : 16 * scale;
    const edgeThickOuter = isConcave ? 26 * scale : 3 * scale;
    const lEdgeX = lensX - (isConcave ? edgeThickOuter : centerThick) / 2;
    const rEdgeX = lensX + (isConcave ? edgeThickOuter : centerThick) / 2;
    const lCx = isConcave ? lEdgeX + halfD * 0.15 : lEdgeX - halfD * 0.2;
    const rCx = isConcave ? rEdgeX - halfD * 0.15 : rEdgeX + halfD * 0.2;

    // Draw lens body with glass-like radial gradient
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lEdgeX, cy - halfD);
    ctx.quadraticCurveTo(lCx, cy, lEdgeX, cy + halfD);
    ctx.lineTo(rEdgeX, cy + halfD);
    ctx.quadraticCurveTo(rCx, cy, rEdgeX, cy - halfD);
    ctx.closePath();

    // Glass gradient: dark edges → bright center
    const lensGrad = ctx.createLinearGradient(lensX - halfD, cy, lensX + halfD, cy);
    lensGrad.addColorStop(0, "rgba(25,60,120,0.6)");
    lensGrad.addColorStop(0.3, "rgba(40,140,220,0.75)");
    lensGrad.addColorStop(0.5, "rgba(80,200,255,0.85)");
    lensGrad.addColorStop(0.7, "rgba(40,140,220,0.75)");
    lensGrad.addColorStop(1, "rgba(25,60,120,0.6)");
    ctx.fillStyle = lensGrad;
    ctx.fill();

    // Lens outline
    ctx.strokeStyle = "rgba(60,160,240,0.9)"; ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight reflection (specular)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(200,230,255,0.35)"; ctx.lineWidth = 1.5;
    const hlY = cy - halfD * 0.3;
    const hlH = halfD * 0.4;
    ctx.moveTo(lensX - centerThick * 0.3, hlY);
    if (isConcave) {
      ctx.quadraticCurveTo(lensX - centerThick * 0.1, hlY + hlH * 0.5, lensX - centerThick * 0.3, hlY + hlH);
    } else {
      ctx.quadraticCurveTo(lensX + centerThick * 0.05, hlY + hlH * 0.5, lensX + centerThick * 0.3, hlY + hlH);
    }
    ctx.stroke();
    ctx.restore();

    // ===== Focal points (F, F', 2F, 2F') =====
    const fObjX = lensX - scale * f;
    const fImgX = lensX + scale * f;
    const f2ObjX = lensX - scale * 2 * f;
    const f2ImgX = lensX + scale * 2 * f;

    const drawFocalPoint = (x: number, label: string, color: string) => {
      if (x < 25 || x > w - 25) return;
      // Marker dot
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, cy, 4 * scale, 0, Math.PI * 2); ctx.fill();
      // Glow
      ctx.shadowColor = color; ctx.shadowBlur = 6 * scale;
      ctx.beginPath(); ctx.arc(x, cy, 3 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Label
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.max(9, 10 * scale)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(label, x, cy + 16 * scale);
    };

    drawFocalPoint(fObjX, "F", "#FFD740");
    drawFocalPoint(fImgX, "F'", "#FFD740");
    drawFocalPoint(f2ObjX, "2F", "#FF8A65");
    drawFocalPoint(f2ImgX, "2F'", "#FF8A65");

    // ===== Object (glowing green) =====
    const objX = lensX - scale * u;
    if (objX > 10) {
      const top = cy - scale * h;
      // Glow effect
      ctx.shadowColor = "#00E676"; ctx.shadowBlur = 6 * scale;
      ctx.strokeStyle = "#00E676"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(objX, cy); ctx.lineTo(objX, top); ctx.stroke();
      ctx.shadowBlur = 0;
      // Arrow head
      ctx.fillStyle = "#00E676";
      ctx.beginPath();
      ctx.moveTo(objX, top);
      ctx.lineTo(objX - 7 * scale, top + 10 * scale);
      ctx.lineTo(objX + 7 * scale, top + 10 * scale);
      ctx.closePath();
      ctx.fill();
      // Label
      ctx.fillStyle = "#00E676";
      ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText("物", objX - 10 * scale, cy - scale * h / 2);
    }

    // ===== Image =====
    const imgX = lensX + scale * v;
    // Correct direction: m>0 upright (above axis), m<0 inverted (below axis)
    const imageUpright = m > 0;
    const imgTop = imageUpright ? cy - scale * hi : cy + scale * hi;
    const capDir = imageUpright ? 1 : -1; // arrow cap toward axis

    if (!noImage && Math.abs(v) > 0 && imgX > 10 && imgX < w - 10) {
      if (isVirtual) {
        // Virtual image: dashed
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = "rgba(255,82,82,0.8)"; ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(255,82,82,0.3)"; ctx.shadowBlur = 4 * scale;
        ctx.beginPath(); ctx.moveTo(imgX, cy); ctx.lineTo(imgX, imgTop); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

        ctx.strokeStyle = "rgba(255,82,82,0.6)"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(imgX, imgTop);
        ctx.lineTo(imgX - 6 * scale, imgTop + capDir * 10 * scale);
        ctx.moveTo(imgX, imgTop);
        ctx.lineTo(imgX + 6 * scale, imgTop + capDir * 10 * scale);
        ctx.stroke();

        const vl = `虚像${imageUpright ? ' (正立)' : ' (倒立)'}`;
        const vlx = imgX < lensX ? imgX - 40 * scale : imgX + 12 * scale;
        const vly = imgX < lensX ? imgTop - capDir * 18 * scale : imgTop - capDir * 16 * scale;
        ctx.fillStyle = "rgba(255,82,82,0.9)";
        ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
        ctx.textAlign = imgX < lensX ? "right" : "left";
        ctx.fillText(vl, imgX < lensX ? imgX - 8 * scale : imgX + 12 * scale, vly);
      } else {
        // Real image: solid
        ctx.strokeStyle = "#FF5252"; ctx.lineWidth = 2.5;
        ctx.shadowColor = "#FF5252"; ctx.shadowBlur = 6 * scale;
        ctx.beginPath(); ctx.moveTo(imgX, cy); ctx.lineTo(imgX, imgTop); ctx.stroke();
        ctx.shadowBlur = 0;
        // Arrow head
        ctx.fillStyle = "#FF5252";
        ctx.beginPath();
        ctx.moveTo(imgX, imgTop);
        ctx.lineTo(imgX - 7 * scale, imgTop + capDir * 10 * scale);
        ctx.lineTo(imgX + 7 * scale, imgTop + capDir * 10 * scale);
        ctx.closePath();
        ctx.fill();
        // Label
        const rl = "实像" + (m < 0 ? " (倒立)" : "");
        ctx.fillStyle = "#FF5252";
        ctx.font = `bold ${Math.max(9, 10 * scale)}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(rl, imgX + 12 * scale, imgTop - capDir * 14 * scale);
      }
    } else if (noImage && Math.abs(f) > eps) {
      // No image formed (u ≈ f)
      ctx.fillStyle = "#6A7080";
      ctx.font = `italic ${Math.max(9, 10 * scale)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("不成像 (u = f, 出射平行光)", lensX + (isConcave ? -100 : 100) * scale, cy - 40 * scale);
    }

    // ===== Principal Rays =====
    if (showRays && h > 0 && objX > 10) {
      const objTop = cy - scale * h;
      const lensTop = cy - halfD;
      const lensBot = cy + halfD;
      const hitY = Math.max(Math.min(objTop, lensBot), lensTop);
        // Dynamic extension: ensure rays reach focus point + beyond
    const extendLen = Math.max(300 * scale, Math.abs(f) * scale * 1.5, scale * u * 1.2, Math.abs(v) * scale * 1.2);
      ctx.globalAlpha = 0.85;

      const drawRay = (x1: number, y1: number, x2: number, y2: number, color: string, dashed = false, glow = 0) => {
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.setLineDash(dashed ? [4, 3] : []);
        if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.setLineDash([]);
      };

      // ── Ray 1 (Cyan): parallel → lens → toward F' ──
      drawRay(objX, objTop, lensX, hitY, "#00E5FF");
      if (Math.abs(f) > eps) {
        if (isConcave) {
          const slope = (hitY - cy) / (0.001 + Math.abs(fImgX - lensX));
          drawRay(lensX, hitY, lensX + extendLen, hitY + slope * extendLen, "#00E5FF", false, 3);
          drawRay(lensX, hitY, fImgX, cy, "#00E5FF", true, 2);
        } else {
          drawRay(lensX, hitY, fImgX, cy, "#00E5FF", true, 2);
          if (isVirtual) {
            const slope = -(hitY - cy) / (0.001 + Math.abs(fImgX - lensX));
            drawRay(lensX, hitY, lensX + extendLen, hitY + slope * extendLen, "#00E5FF", false, 3);
          }
        }
      }

      // ── Ray 2 (Yellow): through center → undeviated ──
      if (!noImage) {
        const r2Slope = -(objTop - cy) / (lensX - objX);
        if (isConcave || isVirtual) {
          drawRay(objX, objTop, lensX, cy, "#FFD740", false, 3);
          drawRay(lensX, cy, lensX + extendLen, cy + r2Slope * extendLen, "#FFD740", false, 2);
          if (Math.abs(v) > 0 && imgX > 10 && imgX < w - 10) {
            drawRay(lensX, cy, imgX, imgTop, "#FFD740", true, 2);
          }
        } else {
          drawRay(objX, objTop, lensX, cy, "#FFD740", false, 3);
          drawRay(lensX, cy, imgX, imgTop, "#FFD740", false, 3);
        }
      } else {
        const r2Slope = -(objTop - cy) / (lensX - objX);
        drawRay(objX, objTop, lensX, cy, "#FFD740", false, 3);
        drawRay(lensX, cy, lensX + extendLen, cy + r2Slope * extendLen, "#FFD740", false, 2);
      }

      // ── Ray 3 (Orange): through F → parallel after lens ──
      if (Math.abs(f) > eps) {
        const r3HitY = cy + (objTop - cy) * (lensX - fObjX) / (objX - fObjX);
        const actualHitY3 = Math.max(Math.min(r3HitY, lensBot), lensTop);
        drawRay(objX, objTop, lensX, actualHitY3, "#FF9100", false, 3);
        drawRay(lensX, actualHitY3, fObjX, cy, "#FF9100", true, 2);
        drawRay(lensX, actualHitY3, lensX + extendLen, actualHitY3, "#FF9100", false, 2);
      }

      // ── Backward extensions to virtual image ──
      if (isVirtual && !noImage && Math.abs(v) > 0 && imgX > 10 && imgX < w - 10) {
        drawRay(lensX, hitY, imgX, imgTop, "#00E5FF", true, 1);
        if (Math.abs(f) > eps) {
          const r3HitY = cy + (objTop - cy) * (lensX - fObjX) / (objX - fObjX);
          const actualHitY3 = Math.max(Math.min(r3HitY, lensBot), lensTop);
          drawRay(lensX, actualHitY3, imgX, imgTop, "#FF9100", true, 1);
        }
      }

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
  const ufRatio = Math.abs(f) > eps ? u / f : 0;
  const ratioLabel = ufRatio > 0
    ? (isConcave ? "正立缩小虚像" : ufRatio < 1 ? "放大镜 (u<f)" : ufRatio < 2 ? (isVirtual ? "-" : "倒立放大实像") : "倒立缩小实像")
    : (isConcave ? "正立缩小虚像" : "");

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 min-h-0 lg:overflow-hidden overflow-y-auto">
        <div className="flex-1 relative rounded-xl overflow-hidden border min-h-[280px] lg:min-h-0 border-[#E9ECEF]">
          <canvas ref={canvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
        </div>

        <aside className="w-full lg:w-[320px] lg:border-l lg:border border-[#E9ECEF] rounded-xl bg-white px-4 py-3 space-y-3 overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none">
          <div>
            <h1 className="text-base font-semibold text-[#1A1A2E]">🔬 透镜成像模拟</h1>
            <p className="text-xs text-[#868E96]">
              薄透镜近轴近似 · {isConcave ? "凹透镜发散" : "凸透镜会聚"} · 光线追迹
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[#343A40] block mb-1">焦距 f (mm) {isConcave ? "(凹透镜)" : "(凸透镜)"}</label>
              <div className="flex items-center gap-2">
                <input type="range" min={-400} max={400} step={5} value={focalLength}
                  onChange={e => setFocalLength(parseInt(e.target.value))}
                  className="flex-1 accent-[#00BFFF]" />
                <input type="text" inputMode="numeric" value={focalInput}
                  onChange={e => setFocalInput(e.target.value)}
                  onBlur={() => { const v=parseInt(focalInput); if(!isNaN(v)) setFocalLength(Math.max(-400,Math.min(400,v))); }}
                  onKeyDown={e => { if(e.key==='Enter'){ const v=parseInt(focalInput); if(!isNaN(v)) setFocalLength(Math.max(-400,Math.min(400,v))); }}}
                  className="w-[54px] text-xs text-center font-mono font-semibold text-[#00BFFF] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#00BFFF] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#343A40] block mb-1">物距 u (mm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={20} max={600} step={5} value={objectDist}
                  onChange={e => setObjectDist(parseInt(e.target.value))}
                  className="flex-1 accent-[#00E676]" />
                <input type="text" inputMode="numeric" value={odInput}
                  onChange={e => setOdInput(e.target.value)}
                  onBlur={() => { const v=parseInt(odInput); if(!isNaN(v)) setObjectDist(Math.max(20,Math.min(600,v))); }}
                  onKeyDown={e => { if(e.key==='Enter'){ const v=parseInt(odInput); if(!isNaN(v)) setObjectDist(Math.max(20,Math.min(600,v))); }}}
                  className="w-[54px] text-xs text-center font-mono font-semibold text-[#00E676] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#00E676] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#343A40] block mb-1">物高 h (mm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={5} max={120} step={1} value={objectHeight}
                  onChange={e => setObjectHeight(parseInt(e.target.value))}
                  className="flex-1 accent-[#FFD740]" />
                <input type="text" inputMode="numeric" value={ohInput}
                  onChange={e => setOhInput(e.target.value)}
                  onBlur={() => { const v=parseInt(ohInput); if(!isNaN(v)) setObjectHeight(Math.max(5,Math.min(120,v))); }}
                  onKeyDown={e => { if(e.key==='Enter'){ const v=parseInt(ohInput); if(!isNaN(v)) setObjectHeight(Math.max(5,Math.min(120,v))); }}}
                  className="w-[54px] text-xs text-center font-mono font-semibold text-[#FFD740] border border-[#DEE2E6] rounded-md px-0.5 focus:border-[#FFD740] focus:outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
              <input type="checkbox" checked={showRays} onChange={e => setShowRays(e.target.checked)} className="accent-[#00BFFF]" />
              显示光线追迹
            </label>
          </div>

          {/* Info card */}
          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#868E96]">像距 v</span>
              <span className="font-mono text-[#1A1A2E]">{v !== 0 && !isNaN(v) ? vInfo : "u = f (不成像)"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#868E96]">放大率 M</span>
              <span className="font-mono text-[#1A1A2E]">{mInfo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#868E96]">像高</span>
              <span className="font-mono text-[#1A1A2E]">{hi.toFixed(1)} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#868E96]">u/f</span>
              <span className="font-mono text-[#1A1A2E]">{ufRatio.toFixed(2)}</span>
            </div>
            {ratioLabel && (
              <div className="pt-1 border-t border-[#DEE2E6]">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  isVirtual ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                }`}>
                  {ratioLabel}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-[#DEE2E6]">
              <span className="text-[#868E96]">1/f = 1/u + 1/v</span>
              <span className="font-mono text-[#ADB5BD] text-xs">薄透镜公式</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs text-[#868E96]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#00E5FF] inline-block"></span> 平行光线</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#FFD740] inline-block"></span> 过中心</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#FF9100] inline-block"></span> 过焦点</span>
          </div>

          <a href="/community" className="flex items-center justify-between px-3 py-2 mt-3 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] hover:border-[#228BE6] hover:bg-[#E7F5FF] transition-all no-underline group">
              <span className="text-xs text-[#495057] group-hover:text-[#228BE6] flex items-center gap-1.5">
                <span className="text-sm">💬</span> 有问题或建议？去留言区聊聊
              </span>
              <span className="text-[10px] text-[#ADB5BD] group-hover:text-[#228BE6]">→</span>
            </a>

          <p className="text-xs text-[#ADB5BD]">
            ⚠ 薄透镜近轴近似，不替代专业光学设计。<br />
            实线=实际光线，虚线=辅助线/反向延长。
          </p>
        </aside>
      </main>
    </div>
  );
}

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  SPECTRAL_LOCUS,
  BLACKBODY_LOCUS,
  MACADAM_ELLIPSES,
  GAMUTS,
  WHITE_POINTS,
  STANDARD_ILLUMINANTS,
} from "@/lib/colorimetry/chromaticity-data";
import {
  xyToUvPrime,
  uvPrimeToXy,
  xyToXYZ,
  xyzToSRGB,
  xyzToLab,
  deltaE76,
  pointInGamut,
  cctWithDuv,
  wavelengthToColor,
  nearestWavelength,
  spectrumToXYZ,
  xyzToChromaticity,
} from "@/lib/colorimetry";

const MARGIN = 60;

type DiagramMode = "xy" | "uv";

interface ChromaticityCanvasProps {
  diagramMode: DiagramMode;
  showMacAdam: boolean;
  showBB: boolean;
  showSRGB: boolean;
  showP3: boolean;
  showAdobeRGB: boolean;
  showACES: boolean;
  showRec2020: boolean;
  showLabels: boolean;
  locateX: number;
  locateY: number;
  onLocate: (x: number, y: number, info: PointInfo | null) => void;
  point1: PointInfo | null;
  point2: PointInfo | null;
}

export interface PointInfo {
  x: number;
  y: number;
  up: number;
  vp: number;
  cct: number | null;
  duv: number | null;
  rgb: { r: number; g: number; b: number };
  XYZ: { X: number; Y: number; Z: number };
  Lab: { L: number; a: number; b: number };
  gamutIn: string[];
}

// Diagram configuration per mode
function getDiagramConfig(mode: DiagramMode) {
  if (mode === "xy") {
    return { xRange: [0, 0.85] as [number, number], yRange: [0, 1.0] as [number, number], xLabel: "x", yLabel: "y", gridStep: 0.1 };
  }
  return { xRange: [0, 0.65] as [number, number], yRange: [0, 0.62] as [number, number], xLabel: "u\u2019", yLabel: "v\u2019", gridStep: 0.05 };
}

// Pre-compute UV data for both modes
function getLocusUV(mode: DiagramMode): { x: number; y: number; wl: number }[] {
  return SPECTRAL_LOCUS.map((p) => {
    if (mode === "xy") return { x: p.x, y: p.y, wl: p.wl };
    const uv = xyToUvPrime(p.x, p.y);
    return { x: uv.uPrime, y: uv.vPrime, wl: p.wl };
  });
}

function getBBUV(mode: DiagramMode): { x: number; y: number; T: number }[] {
  return BLACKBODY_LOCUS.map((p) => {
    if (mode === "xy") return { x: p.x, y: p.y, T: p.T };
    const uv = xyToUvPrime(p.x, p.y);
    return { x: uv.uPrime, y: uv.vPrime, T: p.T };
  });
}

// Compute illuminant (x,y) from SPD
function getIllumXYs(mode: DiagramMode): { name: string; x: number; y: number }[] {
  const CIE_WAVELENGTHS = [360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495, 500, 505, 510, 515, 520, 525, 530, 535, 540, 545, 550, 555, 560, 565, 570, 575, 580, 585, 590, 595, 600, 605, 610, 615, 620, 625, 630, 635, 640, 645, 650, 655, 660, 665, 670, 675, 680, 685, 690, 695, 700, 705, 710, 715, 720, 725, 730, 735, 740, 745, 750, 755, 760, 765, 770, 775, 780];
  return Object.entries(STANDARD_ILLUMINANTS).filter(([n]) => n !== "D65").map(([name, ill]) => {
    const XYZ = spectrumToXYZ(ill.spd, CIE_WAVELENGTHS);
    const xy = xyzToChromaticity(XYZ);
    if (mode === "xy") return { name, x: xy.x, y: xy.y };
    const uv = xyToUvPrime(xy.x, xy.y);
    return { name: xy.x > 0 ? name : "", x: uv.uPrime, y: uv.vPrime };
  }).filter(i => i.name);
}

const ILLUM_LABELS: Record<string, string> = {
  A: "A 钨丝灯 2856K",
  C: "C 北向日光 6774K",
  D50: "D50 日光5000K",
  D55: "D55 日光5500K",
  D75: "D75 日光7500K",
  E: "E 等能白 5454K",
};

// Memoize diagram data
function buildDiagramData(mode: DiagramMode) {
  const cfg = getDiagramConfig(mode);
  const locus = getLocusUV(mode);
  const bb = getBBUV(mode);
  const macadam = MACADAM_ELLIPSES.map((e) => {
    if (mode === "xy") return e;
    const uv = xyToUvPrime(e.x, e.y);
    return { ...e, x: uv.uPrime, y: uv.vPrime };
  });
  const gamuts: Record<string, { R: [number, number]; G: [number, number]; B: [number, number] }> = {};
  for (const [k, g] of Object.entries(GAMUTS)) {
    const toUV = (px: number, py: number): [number, number] => mode === "xy" ? [px, py] : [xyToUvPrime(px, py).uPrime, xyToUvPrime(px, py).vPrime];
    gamuts[k] = { R: toUV(g.R[0], g.R[1]) as [number, number], G: toUV(g.G[0], g.G[1]) as [number, number], B: toUV(g.B[0], g.B[1]) as [number, number] };
  }
  const wp = WHITE_POINTS["D65"];
  const uv = mode === "xy" ? { uPrime: wp.x, vPrime: wp.y } : xyToUvPrime(wp.x, wp.y);
  const wpUV = { x: uv.uPrime, y: uv.vPrime };
  return { cfg, locus, bb, macadam, gamuts, wp: wpUV };
}

export default function ChromaticityCanvas({
  diagramMode,
  showMacAdam,
  showBB,
  showSRGB,
  showP3,
  showAdobeRGB,
  showACES,
  showRec2020,
  showLabels,
  locateX,
  locateY,
  onLocate,
  point1,
  point2,
}: ChromaticityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverVisible, setHoverVisible] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{ xy: string; cct: string; wl: string; rgb: string }>({ xy: "-", cct: "-", wl: "-", rgb: "-" });
  const [illTooltip, setIllTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [diagramData, setDiagramData] = useState(() => buildDiagramData(diagramMode));

  useEffect(() => {
    setDiagramData(buildDiagramData(diagramMode));
  }, [diagramMode]);

  const { cfg, locus, bb, macadam, gamuts, wp } = diagramData;
  const [xR0, xR1] = cfg.xRange;
  const [yR0, yR1] = cfg.yRange;

  // Coordinate conversion
  const toPixel = useCallback(
    (cx: number, cy: number, cw: number, ch: number): [number, number] => {
      const pw = cw - MARGIN * 2;
      const ph = ch - MARGIN * 2;
      return [
        MARGIN + ((cx - xR0) / (xR1 - xR0)) * pw,
        ch - MARGIN - ((cy - yR0) / (yR1 - yR0)) * ph,
      ];
    },
    [xR0, xR1, yR0, yR1]
  );

  const toLogical = useCallback(
    (px: number, py: number, cw: number, ch: number): [number, number] => {
      const pw = cw - MARGIN * 2;
      const ph = ch - MARGIN * 2;
      return [
        xR0 + ((px - MARGIN) / pw) * (xR1 - xR0),
        yR0 + ((ch - MARGIN - py) / ph) * (yR1 - yR0),
      ];
    },
    [xR0, xR1, yR0, yR1]
  );

  const computeInfo = useCallback(
    (x: number, y: number): PointInfo | null => {
      let xyX: number, xyY: number;
      if (diagramMode === "xy") { xyX = x; xyY = y; }
      else { const xy = uvPrimeToXy(x, y); xyX = xy.x; xyY = xy.y; }
      if (xyX < 0 || xyY < 0 || xyX + xyY > 1 || xyY === 0) return null;
      const uv = xyToUvPrime(xyX, xyY);
      const cctResult = cctWithDuv(uv);
      const XYZ = xyToXYZ(xyX, xyY, 0.5);
      const sRGB = xyzToSRGB(XYZ);
      const Lab = xyzToLab(XYZ);
      const gamutIn: string[] = [];
      for (const [name, g] of Object.entries(GAMUTS)) {
        if (pointInGamut(xyX, xyY, g.R, g.G, g.B)) gamutIn.push(name);
      }
      return {
        x: xyX, y: xyY, up: uv.uPrime, vp: uv.vPrime,
        cct: cctResult.cct, duv: cctResult.duv,
        rgb: { r: Math.round(sRGB.r * 255), g: Math.round(sRGB.g * 255), b: Math.round(sRGB.b * 255) },
        XYZ: { X: XYZ.X, Y: XYZ.Y, Z: XYZ.Z },
        Lab: { L: Lab.L, a: Lab.a, b: Lab.b },
        gamutIn,
      };
    },
    [diagramMode]
  );

  // Main render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);

    // Spectral locus fill
    if (locus.length > 0) {
      ctx.beginPath();
      const p0 = toPixel(locus[0].x, locus[0].y, W, H);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i < locus.length; i++) {
        const pi = toPixel(locus[i].x, locus[i].y, W, H);
        ctx.lineTo(pi[0], pi[1]);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(0,180,255,0.04)";
      ctx.fill();
    }

    // Grid
    const sX = cfg.gridStep, sY = cfg.gridStep;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 0.5;
    for (let gx = Math.floor(xR0 / sX) * sX; gx <= xR1; gx += sX) {
      const px = toPixel(gx, yR0, W, H)[0];
      ctx.beginPath(); ctx.moveTo(px, MARGIN); ctx.lineTo(px, H - MARGIN); ctx.stroke();
    }
    for (let gy = Math.floor(yR0 / sY) * sY; gy <= yR1; gy += sY) {
      const py = toPixel(xR0, gy, W, H)[1];
      ctx.beginPath(); ctx.moveTo(MARGIN, py); ctx.lineTo(W - MARGIN, py); ctx.stroke();
    }

    // Spectral locus — colored per wavelength
    for (let i = 1; i < locus.length; i++) {
      const a = toPixel(locus[i - 1].x, locus[i - 1].y, W, H);
      const b = toPixel(locus[i].x, locus[i].y, W, H);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      const wl = locus[i].wl;
      if (wl) {
        const wc = wavelengthToColor(wl);
        ctx.strokeStyle = `rgb(${wc.r},${wc.g},${wc.b})`;
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
      }
      ctx.lineWidth = 2; ctx.stroke();
    }

    // Purple line connecting locus ends
    const pl0 = toPixel(locus[0].x, locus[0].y, W, H);
    const pl1 = toPixel(locus[locus.length - 1].x, locus[locus.length - 1].y, W, H);
    ctx.beginPath(); ctx.moveTo(pl0[0], pl0[1]); ctx.lineTo(pl1[0], pl1[1]);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);

    // MacAdam ellipses
    if (showMacAdam) {
      const scl = diagramMode === "xy" ? 0.002 : 0.001;
      for (const e of macadam) {
        const [cx, cy] = toPixel(e.x, e.y, W, H);
        const g11 = e.g11 * scl, g12 = e.g12 * scl, g22 = e.g22 * scl;
        ctx.beginPath();
        for (let theta = 0; theta < Math.PI * 2; theta += 0.08) {
          const ct = Math.cos(theta), st = Math.sin(theta);
          const det = g11 * g22 - g12 * g12;
          if (det <= 0) continue;
          const a11 = g22 / det, a22 = g11 / det, a12 = -g12 / det;
          const r = 1 / Math.sqrt(a11 * ct * ct + 2 * a12 * ct * st + a22 * st * st);
          const exPx = MARGIN + ((cx - MARGIN + r * ct - MARGIN) / 1) || cx + r * ct; // Simplified
          // Actually we need to convert back: r is in logical coords
          const pxr = (r / (xR1 - xR0)) * (W - MARGIN * 2);
          const pyr = (r / (yR1 - yR0)) * (H - MARGIN * 2);
          const ex = cx + pxr * ct;
          const ey = cy + pyr * st;
          if (theta === 0) ctx.moveTo(ex, ey);
          else ctx.lineTo(ex, ey);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(224,64,251,0.07)";
        ctx.fill();
        ctx.strokeStyle = "rgba(224,64,251,0.33)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Gamut triangles
    const drawGamut = (gamutKey: string, color: string) => {
      const g = gamuts[gamutKey];
      if (!g) return;
      const pts = [g.R, g.G, g.B].map((p) => toPixel(p[0], p[1], W, H));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath();
      ctx.fillStyle = color + "11";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    if (showSRGB) drawGamut("sRGB", "#00e676");
    if (showP3) drawGamut("DCI-P3", "#00bfff");
    if (showAdobeRGB) drawGamut("Adobe RGB", "#ff7043");
    if (showACES) drawGamut("ACES AP0", "#ce93d8");
    if (showRec2020) drawGamut("Rec.2020", "#ffd600");

    // Blackbody locus
    if (showBB && bb.length > 1) {
      ctx.beginPath();
      const bb0 = toPixel(bb[0].x, bb[0].y, W, H);
      ctx.moveTo(bb0[0], bb0[1]);
      for (let i = 1; i < bb.length; i++) {
        const bi = toPixel(bb[i].x, bb[i].y, W, H);
        ctx.lineTo(bi[0], bi[1]);
      }
      ctx.strokeStyle = "rgba(255,107,0,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Temperature labels
      ctx.fillStyle = "rgba(255,107,0,0.65)";
      ctx.font = "10px monospace";
      [2000, 3000, 4000, 5000, 6500, 10000, 20000].forEach((T) => {
        const p = bb.find((pp) => Math.abs((pp as any).T - T) < 100);
        if (p) {
          const tx = toPixel(p.x, p.y, W, H);
          const label = T >= 10000 ? (T / 1000) + "KK" : T + "K";
          ctx.fillText(label, tx[0] + 4, tx[1] - 4);
        }
      });
    }

    // D65 white point - only when relevant gamuts are shown
    if (wp && (showSRGB || showP3 || showRec2020)) {
      const wpx = toPixel(wp.x, wp.y, W, H);
      if (!(canvas as any)._illPixels) (canvas as any)._illPixels = [];
      (canvas as any)._illPixels.push({ x: wpx[0], y: wpx[1], name: "D65 标准光源 6500K" });
      ctx.beginPath(); ctx.arc(wpx[0], wpx[1], 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = "#444"; ctx.lineWidth = 1; ctx.stroke();
    }

    // Other illuminants - visibility depends on active layers
    const illPixels: { x: number; y: number; name: string }[] = [];
    const illVisibility: Record<string, () => boolean> = {
      A: () => showBB, C: () => showBB, D50: () => showAdobeRGB,
      D55: () => showBB, D75: () => showBB, E: () => showBB,
    };
    const illumXYs = getIllumXYs(diagramMode);
    const illLabels: Record<string, string> = {
      A: "A 钨丝灯 2856K", C: "C 北向日光 6774K", D50: "D50 日光5000K (Adobe白点)",
      D55: "D55 日光5500K", D75: "D75 日光7500K", E: "E 等能白 5454K",
    };
    for (const ill of illumXYs) {
      if (!illVisibility[ill.name] || !illVisibility[ill.name]()) continue;
      const ip = toPixel(ill.x, ill.y, W, H);
      illPixels.push({ x: ip[0], y: ip[1], name: illLabels[ill.name] || ill.name });
      ctx.beginPath(); ctx.arc(ip[0], ip[1], 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
    }
    (canvas as any)._illPixels = illPixels;

    // Wavelength labels
    if (showLabels) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "9px monospace";
      [400, 450, 500, 550, 600, 650, 700].forEach((wl) => {
        const p = locus.find((l) => Math.abs(l.wl - wl) < 5);
        if (p) {
          const tp = toPixel(p.x, p.y, W, H);
          ctx.fillText("" + wl, tp[0] + 3, tp[1] - 4);
        }
      });
    }

    // Axis lines
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN, H - MARGIN); ctx.lineTo(W - MARGIN, H - MARGIN);
    ctx.moveTo(MARGIN, H - MARGIN); ctx.lineTo(MARGIN, MARGIN);
    ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = "#777";
    ctx.font = "11px monospace";
    const fmt = diagramMode === "xy" ? 1 : 3;
    for (let v = xR0; v <= xR1; v += sX) {
      const xp = toPixel(v, yR0, W, H)[0];
      ctx.fillText(v.toFixed(fmt), xp - 12, H - MARGIN + 14);
    }
    for (let v = yR0; v <= yR1; v += sY) {
      const yp = toPixel(xR0, v, W, H)[1];
      ctx.fillText(v.toFixed(fmt), MARGIN - 28, yp + 4);
    }
    ctx.fillStyle = "#888";
    ctx.fillText(cfg.xLabel, W - MARGIN + 4, H - MARGIN + 4);
    ctx.fillText(cfg.yLabel, MARGIN - 16, MARGIN - 10);

    // Illuminant tooltip on canvas
    if (illTooltip) {
      ctx.font = "11px sans-serif";
      const tw = ctx.measureText(illTooltip.text).width;
      ctx.fillStyle = "rgba(0,0,0,0.88)";
      ctx.fillRect(illTooltip.x - tw / 2 - 6, illTooltip.y - 28, tw + 12, 20);
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1;
      ctx.strokeRect(illTooltip.x - tw / 2 - 6, illTooltip.y - 28, tw + 12, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(illTooltip.text, illTooltip.x - tw / 2, illTooltip.y - 12);
    }

    // Selected point marker
    if (locateX !== 0 || locateY !== 0) {
      let sx: number, sy: number;
      if (diagramMode === "xy") {
        [sx, sy] = toPixel(locateX, locateY, W, H);
      } else {
        const uv = xyToUvPrime(locateX, locateY);
        [sx, sy] = toPixel(uv.uPrime, uv.vPrime, W, H);
      }
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 10px monospace";
      ctx.fillText("P", sx + 7, sy - 7);
    }

    // Color difference markers
    const drawDeltaPt = (pt: PointInfo | null, label: string, color: string) => {
      if (!pt) return;
      const uv = xyToUvPrime(pt.x, pt.y);
      const x = diagramMode === "xy" ? pt.x : uv.uPrime;
      const y = diagramMode === "xy" ? pt.y : uv.vPrime;
      const [px, py] = toPixel(x, y, W, H);
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = color; ctx.font = "bold 11px monospace";
      ctx.fillText(label, px + 8, py + 4);
    };

    if (point1 && point2) {
      drawDeltaPt(point1, "1", "#00e676");
      drawDeltaPt(point2, "2", "#ff6b00");
      // Connecting line
      const uv1 = xyToUvPrime(point1.x, point1.y);
      const uv2 = xyToUvPrime(point2.x, point2.y);
      const x1 = diagramMode === "xy" ? point1.x : uv1.uPrime;
      const y1 = diagramMode === "xy" ? point1.y : uv1.vPrime;
      const x2 = diagramMode === "xy" ? point2.x : uv2.uPrime;
      const y2 = diagramMode === "xy" ? point2.y : uv2.vPrime;
      const [px1, py1] = toPixel(x1, y1, W, H);
      const [px2, py2] = toPixel(x2, y2, W, H);
      ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
      ctx.setLineDash([4, 3]); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
      ctx.stroke(); ctx.setLineDash([]);
    } else {
      if (point1) drawDeltaPt(point1, "1", "#00e676");
      if (point2) drawDeltaPt(point2, "2", "#ff6b00");
    }
  }, [
    diagramMode, diagramData, showMacAdam, showBB, showSRGB, showP3, showAdobeRGB, showACES, showRec2020, showLabels,
    locateX, locateY, point1, point2, illTooltip, toPixel, cfg, locus, bb, macadam, gamuts, wp, xR0, xR1, yR0, yR1,
  ]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const handler = () => render();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [render]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const [lx, ly] = toLogical(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    const info = computeInfo(lx, ly);
    
    // Check illuminant hover first (64px radius)
    const illPixels = (canvas as any)._illPixels as { x: number; y: number; name: string }[] | undefined;
    if (illPixels) {
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let best: { x: number; y: number; name: string } | null = null;
      let bestDist = 64;
      for (const ip of illPixels) {
        const dx = mx - ip.x, dy = my - ip.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) { bestDist = d; best = ip; }
      }
      setIllTooltip(best ? { x: best.x, y: best.y, text: best.name } : null);
    }
    
    if (!info) { setHoverVisible(false); return; }
    const wl = nearestWavelength(info.x, info.y, SPECTRAL_LOCUS);
    setHoverInfo({
      xy: `(${info.x.toFixed(4)}, ${info.y.toFixed(4)})`,
      cct: info.cct ? `${info.cct.toFixed(0)} K` : "-",
      wl: (wl && wl.distance < 0.02) ? `${wl.wl} nm` : "-",
      rgb: `rgb(${info.rgb.r},${info.rgb.g},${info.rgb.b})`,
    });
    setHoverVisible(true);
  }, [toLogical, computeInfo]);

  const handleMouseLeave = useCallback(() => {
    setHoverVisible(false);
    setIllTooltip(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let lx: number, ly: number;
    if (diagramMode === "xy") {
      [lx, ly] = toLogical(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    } else {
      const [ul, vl] = toLogical(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
      const xy = uvPrimeToXy(ul, vl);
      lx = xy.x; ly = xy.y;
    }
    const info = computeInfo(lx, ly);
    onLocate(lx, ly, info);
  }, [diagramMode, toLogical, computeInfo, onLocate]);

  return (
    <div ref={containerRef} style={{ flex: 1, position: "relative", minWidth: 0, background: "#050505", borderRadius: 12, overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", position: "absolute", top: 0, left: 0, cursor: "crosshair" }}
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleClick} />
      <div style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(20,20,20,0.94)", backdropFilter: "blur(12px)", border: "1px solid #1f1f1f",
        borderRadius: 10, padding: "12px 16px", fontSize: 13,
        pointerEvents: "none", opacity: hoverVisible ? 1 : 0,
        transition: "opacity 0.12s", zIndex: 10,
      }}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
          <span style={{color:"#999",minWidth:42}}>坐标</span>
          <span style={{color:"#e8e8e8",fontFamily:"monospace"}}>{hoverInfo.xy}</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
          <span style={{color:"#999",minWidth:42}}>CCT</span>
          <span style={{color:"#e8e8e8",fontFamily:"monospace"}}>{hoverInfo.cct}</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
          <span style={{color:"#999",minWidth:42}}>波长</span>
          <span style={{color:"#e8e8e8",fontFamily:"monospace"}}>{hoverInfo.wl}</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{color:"#999",minWidth:42}}>颜色</span>
          <span style={{width:20,height:20,borderRadius:4,background:hoverInfo.rgb,border:"1px solid #444",display:"inline-block"}}/>
          <span style={{color:"#e8e8e8",fontFamily:"monospace"}}>{hoverInfo.rgb}</span>
        </div>
      </div>
    </div>
  );
}

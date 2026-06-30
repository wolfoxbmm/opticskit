"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  SPECTRAL_LOCUS,
  BLACKBODY_LOCUS,
  MACADAM_ELLIPSES,
  GAMUTS,
  WHITE_POINTS,
  type SpectralLocusPoint,
  type MacAdamEllipse,
  type GamutTriangle,
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
} from "@/lib/colorimetry";

// ─── Constants ────────────────────────────────────────────────────

const MARGIN = 60;

type DiagramMode = "xy" | "uv";
type SelectedPoint = { x: number; y: number } | null;

interface HoverInfo {
  x: number;
  y: number;
  wl: number | null;
  cct: number | null;
  rgb: string;
}

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
}: ChromaticityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HoverInfo | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; info: HoverInfo } | null>(null);
  const rafRef = useRef<number>(0);

  // Map coordinates to canvas pixel space
  const toPixel = useCallback(
    (x: number, y: number, cw: number, ch: number): [number, number] => {
      const size = Math.min(cw, ch) - MARGIN * 2;
      const px = MARGIN + x * size;
      const py = ch - MARGIN - y * size;
      return [Math.round(px), Math.round(py)];
    },
    []
  );

  const toLogical = useCallback(
    (px: number, py: number, cw: number, ch: number): [number, number] => {
      const size = Math.min(cw, ch) - MARGIN * 2;
      const x = (px - MARGIN) / size;
      const y = (ch - MARGIN - py) / size;
      return [x, y];
    },
    []
  );

  // Convert xy locus to uv for rendering
  const getLocusPoints = useCallback(
    (mode: DiagramMode): { x: number; y: number }[] => {
      if (mode === "xy") return SPECTRAL_LOCUS.map((p) => ({ x: p.x, y: p.y }));
      return SPECTRAL_LOCUS.map((p) => {
        const uv = xyToUvPrime(p.x, p.y);
        return { x: uv.uPrime, y: uv.vPrime };
      });
    },
    []
  );

  // Draw spectral locus filled area
  const drawLocusFill = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, mode: DiagramMode) => {
      const points = getLocusPoints(mode);
      if (points.length < 3) return;

      ctx.beginPath();
      const [px0, py0] = toPixel(points[0].x, points[0].y, cw, ch);
      ctx.moveTo(px0, py0);

      for (let i = 1; i < points.length; i++) {
        const [px, py] = toPixel(points[i].x, points[i].y, cw, ch);
        ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Gradient fill
      const gradient = ctx.createLinearGradient(MARGIN, ch - MARGIN, cw - MARGIN, MARGIN);
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#1a1a2e");
      gradient.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Boundary line
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [getLocusPoints, toPixel]
  );

  // Draw grid
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 0.5;
      const size = Math.min(cw, ch) - MARGIN * 2;
      const step = 0.1;

      for (let v = 0; v <= 1; v += step) {
        const y = MARGIN + v * size;
        ctx.beginPath();
        ctx.moveTo(MARGIN, ch - MARGIN - y + MARGIN);
        ctx.lineTo(cw - MARGIN, ch - MARGIN - y + MARGIN);
        ctx.stroke();

        const x = MARGIN + v * size;
        ctx.beginPath();
        ctx.moveTo(x, MARGIN);
        ctx.lineTo(x, ch - MARGIN);
        ctx.stroke();
      }
    },
    []
  );

  // Draw blackbody locus
  const drawBB = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, mode: DiagramMode) => {
      const pts = BLACKBODY_LOCUS.map((p) => {
        if (mode === "xy") return { x: p.x, y: p.y };
        const uv = xyToUvPrime(p.x, p.y);
        return { x: uv.uPrime, y: uv.vPrime };
      });

      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = toPixel(pts[i].x, pts[i].y, cw, ch);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "#ff6b00";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [toPixel]
  );

  // Draw MacAdam ellipses
  const drawMacAdam = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, mode: DiagramMode) => {
      ctx.strokeStyle = "#e040fb55";
      ctx.lineWidth = 1;

      for (const ell of MACADAM_ELLIPSES) {
        const uv = xyToUvPrime(ell.x, ell.y);
        const cx = mode === "xy" ? ell.x : uv.uPrime;
        const cy = mode === "xy" ? ell.y : uv.vPrime;
        const scale = mode === "xy" ? 0.002 : 0.001;

        const [cpx, cpy] = toPixel(cx, cy, cw, ch);
        const g11 = ell.g11 * scale;
        const g12 = ell.g12 * scale;
        const g22 = ell.g22 * scale;

        // Approximate: draw using parametric ellipse
        ctx.beginPath();
        for (let theta = 0; theta < Math.PI * 2; theta += 0.1) {
          const ct = Math.cos(theta);
          const st = Math.sin(theta);
          const det = g11 * g22 - g12 * g12;
          if (det <= 0) continue;
          const a11 = g22 / det;
          const a22 = g11 / det;
          const a12 = -g12 / det;
          const r = 1 / Math.sqrt(a11 * ct * ct + 2 * a12 * ct * st + a22 * st * st);
          const ex = cx + r * ct;
          const ey = cy + r * st;
          const [exPx, eyPy] = toPixel(ex, ey, cw, ch);
          if (theta === 0) ctx.moveTo(exPx, eyPy);
          else ctx.lineTo(exPx, eyPy);
        }
        ctx.closePath();
        ctx.fillStyle = "#e040fb11";
        ctx.fill();
        ctx.stroke();
      }
    },
    [MACADAM_ELLIPSES, toPixel]
  );

  // Draw gamut triangle
  const drawGamut = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, gamut: GamutTriangle, mode: DiagramMode) => {
      const pts = [gamut.R, gamut.G, gamut.B].map(([rx, ry]) => {
        if (mode === "xy") return { x: rx, y: ry };
        const uv = xyToUvPrime(rx, ry);
        return { x: uv.uPrime, y: uv.vPrime };
      });

      ctx.beginPath();
      pts.forEach((p, i) => {
        const [px, py] = toPixel(p.x, p.y, cw, ch);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = gamut.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = gamut.color + "11";
      ctx.fill();
    },
    [toPixel]
  );

  // Draw wavelength labels
  const drawLabels = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, mode: DiagramMode) => {
      ctx.font = "9px monospace";
      ctx.fillStyle = "#555";
      const labelWls = [380, 460, 480, 500, 520, 540, 560, 580, 600, 620, 700];

      for (const wl of labelWls) {
        const pt = SPECTRAL_LOCUS.find((p) => p.wl === wl);
        if (!pt) continue;
        const uv = xyToUvPrime(pt.x, pt.y);
        const x = mode === "xy" ? pt.x : uv.uPrime;
        const y = mode === "xy" ? pt.y : uv.vPrime;
        const [px, py] = toPixel(x, y, cw, ch);
        ctx.fillText(`${wl}`, px + 5, py - 3);
      }
    },
    [SPECTRAL_LOCUS, toPixel]
  );

  // Draw D65 white point
  const drawWhitePoint = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number, mode: DiagramMode) => {
      const wp = WHITE_POINTS["D65"];
      const uv = xyToUvPrime(wp.x, wp.y);
      const x = mode === "xy" ? wp.x : uv.uPrime;
      const y = mode === "xy" ? wp.y : uv.vPrime;
      const [px, py] = toPixel(x, y, cw, ch);

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [toPixel]
  );

  // Draw locate marker
  const drawLocateMarker = useCallback(
    (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
      if (locateX === 0 && locateY === 0) return;
      const [px, py] = toPixel(locateX, locateY, cw, ch);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#00bfff";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [locateX, locateY, toPixel]
  );

  // Compute point info
  const computeInfo = useCallback(
    (x: number, y: number, mode: DiagramMode): PointInfo | null => {
      let xyX: number, xyY: number;
      if (mode === "xy") {
        xyX = x;
        xyY = y;
      } else {
        const xy = uvPrimeToXy(x, y);
        xyX = xy.x;
        xyY = xy.y;
      }

      if (xyX < 0 || xyY < 0 || xyX + xyY > 1) return null;

      const uv = xyToUvPrime(xyX, xyY);
      const cctResult = cctWithDuv(uv);
      const XYZ = xyToXYZ(xyX, xyY, 0.5);
      const sRGB = xyzToSRGB(XYZ);
      const Lab = xyzToLab(XYZ);

      // Check gamut membership
      const gamutIn: string[] = [];
      for (const [name, g] of Object.entries(GAMUTS)) {
        if (pointInGamut(xyX, xyY, g.R, g.G, g.B)) gamutIn.push(name);
      }

      return {
        x: xyX,
        y: xyY,
        up: uv.uPrime,
        vp: uv.vPrime,
        cct: cctResult.cct,
        duv: cctResult.duv,
        rgb: { r: Math.round(sRGB.r * 255), g: Math.round(sRGB.g * 255), b: Math.round(sRGB.b * 255) },
        XYZ: { X: XYZ.X, Y: XYZ.Y, Z: XYZ.Z },
        Lab: { L: Lab.L, a: Lab.a, b: Lab.b },
        gamutIn,
      };
    },
    []
  );

  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, cw, ch);

    drawGrid(ctx, cw, ch);
    drawLocusFill(ctx, cw, ch, diagramMode);

    if (showMacAdam) drawMacAdam(ctx, cw, ch, diagramMode);
    if (showBB) drawBB(ctx, cw, ch, diagramMode);

    if (showSRGB) drawGamut(ctx, cw, ch, GAMUTS["sRGB"], diagramMode);
    if (showP3) drawGamut(ctx, cw, ch, GAMUTS["DCI-P3"], diagramMode);
    if (showAdobeRGB) drawGamut(ctx, cw, ch, GAMUTS["Adobe RGB"], diagramMode);
    if (showACES) drawGamut(ctx, cw, ch, GAMUTS["ACES AP0"], diagramMode);
    if (showRec2020) drawGamut(ctx, cw, ch, GAMUTS["Rec.2020"], diagramMode);

    if (showLabels) drawLabels(ctx, cw, ch, diagramMode);

    drawWhitePoint(ctx, cw, ch, diagramMode);
    drawLocateMarker(ctx, cw, ch);
  }, [
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
    drawGrid,
    drawLocusFill,
    drawMacAdam,
    drawBB,
    drawGamut,
    drawLabels,
    drawWhitePoint,
    drawLocateMarker,
  ]);

  // Render on any change
  useEffect(() => {
    render();
  }, [render]);

  // Resize handler
  useEffect(() => {
    const handler = () => render();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [render]);

  // Mouse move for hover info
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const [lx, ly] = toLogical(mx, my, rect.width, rect.height);
      const info = computeInfo(lx, ly, diagramMode);
      
      if (!info) {
        setHoverPos(null);
        return;
      }

      const wl = nearestWavelength(info.x, info.y, SPECTRAL_LOCUS);
      const hoverRGB = `rgb(${info.rgb.r},${info.rgb.g},${info.rgb.b})`;
      setHoverPos({
        x: e.clientX,
        y: e.clientY,
        info: {
          x: info.x,
          y: info.y,
          wl: wl?.distance && wl.distance < 0.02 ? wl.wl : null,
          cct: info.cct,
          rgb: hoverRGB,
        },
      });
    },
    [diagramMode, computeInfo, toLogical]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null);
  }, []);

  // Click to select point
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const [lx, ly] = toLogical(mx, my, rect.width, rect.height);
      const info = computeInfo(lx, ly, diagramMode);
      onLocate(lx, ly, info);
    },
    [diagramMode, computeInfo, toLogical, onLocate]
  );

  return (
    <div ref={containerRef} style={{ flex: 1, position: "relative", minWidth: 0, background: "#050505", borderRadius: 12, overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", position: "absolute", top: 0, left: 0, cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      {hoverPos && (
        <div
          style={{
            position: "fixed",
            left: hoverPos.x + 15,
            top: hoverPos.y - 10,
            background: "rgba(20,20,20,0.94)",
            backdropFilter: "blur(12px)",
            border: "1px solid #1f1f1f",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            color: "#e8e8e8",
            zIndex: 100,
            pointerEvents: "none",
            fontFamily: "monospace",
          }}
        >
          <div>坐标: ({hoverPos.info.x.toFixed(4)}, {hoverPos.info.y.toFixed(4)})</div>
          <div>CCT: {hoverPos.info.cct ? hoverPos.info.cct.toFixed(0) + " K" : "-"}</div>
          <div>波长: {hoverPos.info.wl !== null ? hoverPos.info.wl + " nm" : "-"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            颜色: <span style={{ width: 16, height: 16, borderRadius: 4, background: hoverPos.info.rgb, border: "1px solid #444", display: "inline-block" }} />
            {hoverPos.info.rgb}
          </div>
        </div>
      )}
    </div>
  );
}

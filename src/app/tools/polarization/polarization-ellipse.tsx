// app/tools/polarization/polarization-ellipse.tsx — 2D 偏振椭圆 Canvas 组件

"use client";

import React, { useRef, useEffect } from "react";

interface Props {
  psi: number;        // azimuth in degrees
  ellipticity: number; // short/long axis ratio
  handedness: 'linear' | 'right' | 'left';
  size?: number;
}

export function PolarizationEllipse({ psi, ellipticity, handedness, size = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.42;

    ctx.clearRect(0, 0, size, size);

    // Crosshairs
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - maxR - 5, cy); ctx.lineTo(cx + maxR + 5, cy);
    ctx.moveTo(cx, cy - maxR - 5); ctx.lineTo(cx, cy + maxR + 5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(cx, cy);
    // Rotate by psi
    const psiRad = psi * Math.PI / 180;
    ctx.rotate(psiRad);

    const absE = Math.abs(ellipticity);
    const majorR = maxR;
    let minorR: number;
    if (absE >= 0.999) minorR = 0;
    else minorR = maxR * absE;

    // Draw ellipse
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, majorR, minorR > 0 ? minorR : 0.5, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw major axis line
    if (handedness !== 'linear' || absE < 0.999) {
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(-majorR, 0); ctx.lineTo(majorR, 0);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw handedness arrow
    if (handedness !== 'linear' && minorR > 2) {
      const arrowR = minorR * 0.7;
      const arrowAngle = handedness === 'right' ? 0.8 : -0.8;
      ctx.beginPath();
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 1.5;
      for (let t = 0; t < 2 * Math.PI; t += 0.1) {
        const x = majorR * Math.cos(t);
        const y = minorR * Math.sin(t) * (handedness === 'right' ? 1 : -1);
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Arrow head
      const ax = majorR * Math.cos(arrowAngle);
      const ay = minorR * Math.sin(arrowAngle) * (handedness === 'right' ? 1 : -1);
      ctx.beginPath();
      ctx.fillStyle = '#DC2626';
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 4, ay + (handedness === 'right' ? -5 : 5));
      ctx.lineTo(ax + 5, ay + (handedness === 'right' ? -3 : 3));
      ctx.fill();
    }

    ctx.restore();
  }, [psi, ellipticity, handedness, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

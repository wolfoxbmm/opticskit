// app/tools/polarization/poincare-panel.tsx — 庞加莱球面板（懒加载）

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { toPoincareCoords } from "@/lib/optics/polarization";
import type { StepsStokes } from "./page";
import { Card, CardTitle } from "./jones-panel";
import dynamic from "next/dynamic";

const PoincareThree = dynamic(() => import("./poincare-three"), { ssr: false });

interface Props {
  stepsStokes: StepsStokes[];
}

export default function PoincarePanel({ stepsStokes }: Props) {
  const [mode, setMode] = useState<'single' | 'trajectory'>('trajectory');
  const [selectedStep, setSelectedStep] = useState(stepsStokes.length - 1);

  const points = useMemo(() => stepsStokes.map(s => ({
    ...s,
    coords: toPoincareCoords(s.stokes),
    onSurface: Math.abs(Math.sqrt(s.stokes[1]**2 + s.stokes[2]**2 + s.stokes[3]**2) / s.stokes[0] - 1) < 0.01,
  })), [stepsStokes]);

  const viewedPoint = mode === 'single' ? points[Math.min(selectedStep, points.length - 1)] : null;

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'poincare-sphere.png'; a.click();
    }
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardTitle>
          提示：数据来源 Jones 级联 — 所有点均在球表面（完全偏振光）
        </CardTitle>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setMode('single')} className={`px-2 py-1 rounded ${mode === 'single' ? 'font-bold' : ''}`}
            style={{ color: mode === 'single' ? 'var(--accent, #2563EB)' : 'var(--text-tertiary, #6B7280)' }}>单点</button>
          <button onClick={() => setMode('trajectory')} className={`px-2 py-1 rounded ${mode === 'trajectory' ? 'font-bold' : ''}`}
            style={{ color: mode === 'trajectory' ? 'var(--accent, #2563EB)' : 'var(--text-tertiary, #6B7280)' }}>轨迹</button>
          <button onClick={handleScreenshot}
            className="px-2 py-1 rounded text-xs bg-white border shadow-sm hover:bg-gray-50"
            style={{ borderColor: '#DEE2E6', color: '#4B5563' }}>📷 截图</button>
          {mode === 'single' && (
            <select value={selectedStep} onChange={e => setSelectedStep(Number(e.target.value))}
              className="px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--border-default, #DEE2E6)' }}>
              {points.map((p, i) => (
                <option key={i} value={i}>#{i} {p.elementLabel}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ height: 500 }}>
        <PoincareThree
          points={points}
          mode={mode}
          selectedIndex={mode === 'single' ? selectedStep : undefined}
        />
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-tertiary, #6B7280)' }}>
        <span>● 起点 / ● 终点 / ● 路径点</span>
        <span>赤道 = 线偏振 · 北极 = R · 南极 = L</span>
      </div>
    </Card>
  );
}

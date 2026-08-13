// app/tools/fiber-mode/page.tsx — 阶跃折射率光纤 LP 模式求解器

"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  type FiberParams, type ModeResult,
  vNumber, numericalAperture, marcuseMFD, cutoffWavelength,
  isSingleMode, solveModes, materialDispersion, waveguideDispersion, totalDispersion,
  modeIntensity, jlApprox, radialField, SELLMEIER,
} from "@/lib/optics/fiber-mode";

// ============================================================
// 预设光纤
// ============================================================
interface Preset { name: string; coreRadiusUm: number; nCore: number; nClad: number; lambdaUm: number; }
const PRESETS: Preset[] = [
  { name: 'G.652 单模 (SMF-28)', coreRadiusUm: 4.2, nCore: 1.4525, nClad: 1.4470, lambdaUm: 1.55 },
  { name: 'G.652C 低水峰', coreRadiusUm: 4.2, nCore: 1.4521, nClad: 1.4468, lambdaUm: 1.55 },
  { name: 'G.657 弯曲不敏感', coreRadiusUm: 4.0, nCore: 1.4530, nClad: 1.4470, lambdaUm: 1.31 },
  { name: '多模 50/125 (OM2)', coreRadiusUm: 25, nCore: 1.4620, nClad: 1.4570, lambdaUm: 0.85 },
  { name: '多模 62.5/125 (OM1)', coreRadiusUm: 31.25, nCore: 1.4670, nClad: 1.4570, lambdaUm: 0.85 },
];

// 配色/辅助
const fmt = (v: number, d = 2) => (isFinite(v) ? v.toFixed(d) : '—');

function useHiDPICanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // 用 rAF 节流：把重绘推迟到下一帧，避免同步阻塞滑块事件
    let rafId = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, rect.width, rect.height);
    });
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export default function FiberModePage() {
  const [coreRadiusUm, setCoreRadiusUm] = useState(4.2);
  const [nCore, setNCore] = useState(1.4525);
  const [nClad, setNClad] = useState(1.4470);
  const [lambdaNm, setLambdaNm] = useState(1550);
  const [selModeLabel, setSelModeLabel] = useState('LP01');

  const fiber: FiberParams = useMemo(() => ({ coreRadiusUm, nCore, nClad }), [coreRadiusUm, nCore, nClad]);
  const lambdaUm = lambdaNm / 1000;

  const V = useMemo(() => vNumber(fiber, lambdaUm), [fiber, lambdaUm]);
  const na = useMemo(() => numericalAperture(fiber), [fiber]);
  const mfd = useMemo(() => marcuseMFD(fiber, lambdaUm), [fiber, lambdaUm]);
  const cutoff = useMemo(() => cutoffWavelength(fiber) * 1000, [fiber]); // nm
  const single = useMemo(() => isSingleMode(fiber, lambdaUm), [fiber, lambdaUm]);
  const modes = useMemo(() => solveModes(fiber, lambdaUm), [fiber, lambdaUm]);
  const dMat = useMemo(() => materialDispersion(SELLMEIER[0], lambdaUm), [lambdaUm]);
  const dWg = useMemo(() => waveguideDispersion(fiber, lambdaUm), [fiber, lambdaUm]);
  const dTot = useMemo(() => totalDispersion(fiber, lambdaUm, SELLMEIER[0]), [fiber, lambdaUm]);

  const selectedMode = useMemo(
    () => modes.find(m => m.label === selModeLabel) ?? modes[0] ?? null,
    [modes, selModeLabel],
  );

  const applyPreset = (p: Preset) => {
    setCoreRadiusUm(p.coreRadiusUm);
    setNCore(p.nCore);
    setNClad(p.nClad);
    setLambdaNm(Math.round(p.lambdaUm * 1000));
    setSelModeLabel('LP01');
  };

  // —— 模场分布 2D 热力图 ——
  const fieldRef = useHiDPICanvas((ctx, w, h) => {
    const size = Math.min(w, h);
    const cx = w / 2, cy = h / 2 - 4;
    const half = size / 2 - 30;
    const pxToUm = (3 * coreRadiusUm) / half; // half 像素对应物理 3a
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const l = selectedMode ? selectedMode.l : 0;
    const U = selectedMode ? selectedMode.U : 1;
    const Wv = selectedMode ? selectedMode.W : 1;

    // 预计算径向强度 R(r)² 查找表（256 点，避免每像素重复数值积分）
    const RTAB = 256;
    const R2 = new Float64Array(RTAB + 1);
    let maxI = 0;
    if (selectedMode) {
      for (let k = 0; k <= RTAB; k++) {
        const rr = (3 * coreRadiusUm) * k / RTAB;
        const R = radialField(l, U, Wv, coreRadiusUm, rr);
        R2[k] = R * R;
        if (R2[k] > maxI) maxI = R2[k];
      }
    }
    // 像素查找：按像素半径索引 R2，角度解析 cos²(lθ)
    for (let j = 0; j < h; j++) {
      const y = j - cy;
      const y2 = y * y;
      for (let i = 0; i < w; i++) {
        const x = i - cx;
        const rPx = Math.sqrt(x * x + y2);
        let v = 0;
        if (selectedMode && rPx <= half) {
          const rUm = rPx * pxToUm;
          const idxF = rUm / (3 * coreRadiusUm) * RTAB;
          const i0 = idxF | 0;
          const frac = idxF - i0;
          const r2 = i0 >= RTAB ? R2[RTAB] : (R2[i0] + (R2[i0 + 1] - R2[i0]) * frac);
          const ang = l === 0 ? 1 : Math.cos(l * Math.atan2(y, x)) ** 2;
          v = (r2 * ang) / maxI;
        }
        const idx = (j * w + i) * 4;
        data[idx] = Math.min(255, Math.round(v * 255));
        data[idx + 1] = Math.min(255, Math.round(Math.pow(v, 0.55) * 230));
        data[idx + 2] = Math.min(255, Math.round((1 - v) * 180 + 60));
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // 纤芯边界虚线（r=a 的圆，半程像素 = half/3）
    const coreR = half / 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '12px sans-serif';
    ctx.fillText('纤芯边界', cx + coreR + 6, cy - coreR - 6);
  }, [selectedMode, coreRadiusUm]);

  // —— 色散曲线 ——
  const dispRef = useHiDPICanvas((ctx, w, h) => {
    const padL = 48, padB = 30, padT = 18, padR = 16;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const lamMin = 1200, lamMax = 1650;
    const curves: { mat: number[]; wg: number[]; tot: number[] } = { mat: [], wg: [], tot: [] };
    let dMin = Infinity, dMax = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const l = lamMin + (lamMax - lamMin) * i / 200;
      const lUm = l / 1000;
      const dm = materialDispersion(SELLMEIER[0], lUm);
      const dw = waveguideDispersion(fiber, lUm);
      const dt = totalDispersion(fiber, lUm, SELLMEIER[0]);
      curves.mat.push(dm); curves.wg.push(dw); curves.tot.push(dt);
      dMin = Math.min(dMin, dm, dw, dt); dMax = Math.max(dMax, dm, dw, dt);
    }
    const pad = (dMax - dMin) * 0.12 || 1;
    dMin -= pad; dMax += pad;
    const x = (l: number) => padL + (l - lamMin) / (lamMax - lamMin) * plotW;
    const y = (d: number) => padT + (dMax - d) / (dMax - dMin) * plotH;
    // 零线
    if (dMin < 0 && dMax > 0) {
      ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y(0)); ctx.lineTo(w - padR, y(0)); ctx.stroke();
    }
    const drawCurve = (arr: number[], color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      arr.forEach((d, i) => {
        const l = lamMin + (lamMax - lamMin) * i / 200;
        if (i === 0) ctx.moveTo(x(l), y(d)); else ctx.lineTo(x(l), y(d));
      });
      ctx.stroke();
    };
    drawCurve(curves.mat, '#9CA3AF');
    drawCurve(curves.wg, '#F59E0B');
    drawCurve(curves.tot, '#2563EB');
    // 轴
    ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();
    ctx.fillStyle = '#6B7280'; ctx.font = '11px sans-serif';
    for (let lm = 1200; lm <= 1650; lm += 100) ctx.fillText(lm + 'nm', x(lm) - 14, h - padB + 14);
    ctx.save(); ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('D [ps/(nm·km)]', 0, 0); ctx.restore();
    // 图例
    ctx.fillStyle = '#9CA3AF'; ctx.fillRect(padL + 8, padT + 6, 12, 3); ctx.fillText('材料色散', padL + 24, padT + 11);
    ctx.fillStyle = '#F59E0B'; ctx.fillRect(padL + 8, padT + 20, 12, 3); ctx.fillText('波导色散', padL + 24, padT + 25);
    ctx.fillStyle = '#2563EB'; ctx.fillRect(padL + 8, padT + 34, 12, 3); ctx.fillText('总色散', padL + 24, padT + 39);
  }, [fiber, lambdaUm]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-root, #F3F4F6)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary, #111827)' }}>光纤模式求解器</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary, #6B7280)' }}>阶跃折射率光纤 LP 模式 · 模场直径 · 色散曲线 · 模场分布</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左：输入 + 结果 */}
          <div className="space-y-4">
            <Card>
              <CardTitle>① 光纤参数</CardTitle>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${coreRadiusUm === p.coreRadiusUm && nCore === p.nCore && nClad === p.nClad ? 'font-semibold' : ''}`}
                    style={{ borderColor: coreRadiusUm === p.coreRadiusUm && nCore === p.nCore && nClad === p.nClad ? 'var(--accent, #2563EB)' : 'var(--border-default, #DEE2E6)', color: coreRadiusUm === p.coreRadiusUm && nCore === p.nCore && nClad === p.nClad ? 'var(--accent, #2563EB)' : 'var(--text-secondary, #4B5563)', background: coreRadiusUm === p.coreRadiusUm && nCore === p.nCore && nClad === p.nClad ? 'var(--bg-elevated, #F1F3F5)' : 'transparent' }}>
                    {p.name}
                  </button>
                ))}
              </div>
              <NumField label="纤芯半径 a" unit="μm" value={coreRadiusUm} min={1} max={50} step={0.1} onChange={setCoreRadiusUm} />
              <NumField label="纤芯折射率 n₁" unit="" value={nCore} min={1.4} max={1.6} step={0.0001} onChange={setNCore} />
              <NumField label="包层折射率 n₂" unit="" value={nClad} min={1.3} max={1.55} step={0.0001} onChange={setNClad} />
              <NumField label="工作波长 λ" unit="nm" value={lambdaNm} min={400} max={2000} step={10} onChange={setLambdaNm} />
            </Card>

            <Card>
              <CardTitle>② 计算结果</CardTitle>
              <StatRow label="数值孔径 NA" value={fmt(na, 6)} />
              <StatRow label="归一化频率 V" value={fmt(V, 3)} />
              <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-default, #EEE)' }}>
                <span style={{ color: 'var(--text-secondary, #4B5563)' }}>模式状态</span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: single ? '#DCFCE7' : '#FEF3C7', color: single ? '#166534' : '#92400E' }}>
                  {single ? '单模 (V < 2.405)' : `多模 (${modes.length} 个模式)`}
                </span>
              </div>
              <StatRow label="模场直径 MFD" value={fmt(mfd, 2)} unit="μm" />
              <StatRow label="截止波长 λc" value={fmt(cutoff, 1)} unit="nm" />
              <StatRow label="材料色散 D_mat" value={fmt(dMat, 2)} unit="ps/(nm·km)" />
              <StatRow label="波导色散 D_wg" value={fmt(dWg, 2)} unit="ps/(nm·km)" />
              <StatRow label="总色散 D_total" value={fmt(dTot, 2)} unit="ps/(nm·km)" />

              {modes.length > 1 && (
                <div className="mt-3">
                  <div className="text-xs mb-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>导模列表（点击查看模场）：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {modes.map(m => (
                      <button key={m.label} onClick={() => setSelModeLabel(m.label)}
                        className={`px-2 py-1 rounded-lg text-xs border ${selModeLabel === m.label ? 'font-semibold' : ''}`}
                        style={{ borderColor: selModeLabel === m.label ? 'var(--accent, #2563EB)' : 'var(--border-default, #DEE2E6)', color: selModeLabel === m.label ? 'var(--accent, #2563EB)' : 'var(--text-secondary, #4B5563)' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* 右：图表 */}
          <div className="space-y-4">
            <Card>
              <CardTitle>③ 模场分布（{selectedMode ? selectedMode.label : '—'} · 强度 |E|²）</CardTitle>
              <div className="rounded-lg overflow-hidden" style={{ height: 320, background: '#0B1220' }}>
                <canvas ref={fieldRef} style={{ width: '100%', height: '100%' }} />
              </div>
              {selectedMode && selectedMode.l > 0 && (
                <div className="text-xs mt-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>
                  {selectedMode.l === 1 ? 'LP11 呈环形亮斑（两瓣结构）' : `LP${selectedMode.l}${selectedMode.m} 呈 ${2 * selectedMode.l} 瓣扇形结构`}
                </div>
              )}
            </Card>
            <Card>
              <CardTitle>④ 色散曲线 D(λ)</CardTitle>
              <div className="rounded-lg overflow-hidden" style={{ height: 260, background: '#FFFFFF' }}>
                <canvas ref={dispRef} style={{ width: '100%', height: '100%' }} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// 子组件
// ============================================================
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className || ''}`} style={{ background: 'var(--bg-surface, #FFFFFF)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>{children}</div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent, #2563EB)' }}>{children}</h3>;
}
function StatRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-default, #EEE)' }}>
      <span className="text-xs" style={{ color: 'var(--text-secondary, #4B5563)' }}>{label}</span>
      <span className="text-xs font-semibold" style={{ fontFamily: '"SF Mono", Consolas, monospace', color: 'var(--text-primary, #111827)' }}>
        {value}{unit ? <span className="ml-1 font-normal" style={{ color: 'var(--text-tertiary, #6B7280)' }}>{unit}</span> : null}
      </span>
    </div>
  );
}
function NumField({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs w-28 flex-shrink-0" style={{ color: 'var(--text-secondary, #4B5563)' }}>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: 'var(--border-default, #DEE2E6)', accentColor: 'var(--accent, #2563EB)' }} />
      <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
        className="w-20 px-1.5 py-0.5 rounded border text-xs text-right" style={{ borderColor: 'var(--border-default, #DEE2E6)', color: 'var(--text-primary, #111827)' }} />
      {unit && <span className="text-xs w-8" style={{ color: 'var(--text-tertiary, #6B7280)' }}>{unit}</span>}
    </div>
  );
}

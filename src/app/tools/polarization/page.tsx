// app/tools/polarization/page.tsx — Jones 级联 + Mueller 级联 + 庞加莱球

"use client";

import React, { useState, useMemo, Suspense } from "react";
import {
  type ElementType, type DelayMode, type ElementConfig, type JonesVector,
  type JonesCascadeResult, type PolarizationEllipseParams,
  PREDEFINED_JONES, computeJonesCascade, extractEllipseParams,
  jonesToStokes, fractionalToDelay, physicalToDelay,
} from "@/lib/optics/polarization";

import { JonesCascadePanel } from "./jones-panel";
import { MuellerPanel } from "./mueller-panel";
const PoincarePanel = React.lazy(() => import("./poincare-panel"));

export const ELEMENT_TYPES: Array<{ type: ElementType; name: string; description: string }> = [
  { type: 'polarizer', name: '线性偏振片', description: '理想起偏/检偏器' },
  { type: 'hwp', name: '半波片 (HWP)', description: 'δ = π' },
  { type: 'qwp', name: '1/4 波片 (QWP)', description: 'δ = π/2' },
  { type: 'fwp', name: '全波片 (FWP)', description: 'δ = 2π' },
  { type: 'retarder', name: '一般延迟片', description: '自定义 δ' },
  { type: 'rotator', name: '旋光器', description: '自然旋光' },
  { type: 'faraday', name: '法拉第旋转器', description: '非互易' },
  { type: 'pbs_t', name: 'PBS 透射', description: '水平输出' },
  { type: 'pbs_r', name: 'PBS 反射', description: '垂直输出' },
];

export const DELTA_N_PRESETS = [
  { name: '石英 (Quartz)', value: 0.0092 },
  { name: '方解石 (Calcite)', value: 0.172 },
  { name: 'MgF₂', value: 0.012 },
  { name: '钒酸钇 (YVO₄)', value: 0.204 },
  { name: '蓝宝石 (Sapphire)', value: 0.008 },
  { name: '自定义', value: -1 },
];

let idCounter = 0;
export function genId(): string { return `el_${++idCounter}_${Date.now()}`; }

export function createDefaultElement(type: ElementType): ElementConfig {
  const id = genId();
  const base: ElementConfig = {
    id, type, label: '', phiDeg: 0, delta: Math.PI / 2,
    delayMode: 'fractional' as DelayMode,
    fractionalLambda: 0.25, physicalDeltaN: 0.0092, physicalD: 17300, locked: false,
  };
  switch (type) {
    case 'qwp': base.phiDeg = 45; base.delta = Math.PI / 2; base.fractionalLambda = 0.25; break;
    case 'hwp': base.phiDeg = 0; base.delta = Math.PI; base.fractionalLambda = 0.5; break;
    case 'fwp': base.phiDeg = 0; base.delta = 2 * Math.PI; base.fractionalLambda = 1.0; break;
    case 'rotator': case 'faraday': base.phiDeg = 45; base.delta = 0; base.fractionalLambda = 0; break;
  }
  return base;
}

export function cloneElementConfig(el: ElementConfig): ElementConfig {
  return { ...el, id: genId(), locked: false };
}

export function defaultCascade(): { input: JonesVector; elements: ElementConfig[] } {
  return {
    input: PREDEFINED_JONES.H.vector.map(c => ({ re: c.re, im: c.im })) as JonesVector,
    elements: [createDefaultElement('qwp')],
  };
}

export interface StepsStokes {
  elementId: string;
  elementLabel: string;
  stokes: [number, number, number, number];
}

export default function PolarizationPage() {
  const [tab, setTab] = useState(0);
  const tabs = ['Jones 级联（完全偏振光）', 'Mueller 级联（含退偏）', '庞加莱球 3D'];

  const [cascadeState, setCascadeState] = useState(defaultCascade);
  const [wavelength, setWavelength] = useState(632.8);

  const elementsWithDelta = useMemo(() => {
    return cascadeState.elements.map(el => {
      if (el.locked) return el;
      if (el.type === 'retarder') {
        let delta = el.delta;
        if (el.delayMode === 'physical') delta = physicalToDelay(el.physicalD, el.physicalDeltaN, wavelength);
        else if (el.delayMode === 'fractional') delta = fractionalToDelay(el.fractionalLambda);
        return { ...el, delta };
      }
      return el;
    });
  }, [cascadeState.elements, wavelength]);

  const result = useMemo(() => computeJonesCascade(cascadeState.input, elementsWithDelta), [cascadeState.input, elementsWithDelta]);
  const ellipseParams = useMemo(() => {
    const finalV = result.steps.length > 0 ? result.steps[result.steps.length - 1].afterVector : result.finalVector;
    return extractEllipseParams(finalV);
  }, [result]);

  const stepsStokes: StepsStokes[] = useMemo(() => {
    const s: StepsStokes[] = [{
      elementId: '__input__', elementLabel: '输入偏振态',
      stokes: jonesToStokes(cascadeState.input),
    }];
    result.steps.forEach(step => {
      s.push({ elementId: step.elementId, elementLabel: step.elementLabel, stokes: jonesToStokes(step.afterVector) });
    });
    return s;
  }, [result, cascadeState.input]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-root, #F3F4F6)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary, #111827)' }}>偏振态计算器</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary, #6B7280)' }}>Jones 矩阵级联 · Mueller 偏振传输 · 庞加莱球 3D 可视化</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-elevated, #F1F3F5)' }}>
          {tabs.map((label, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-white shadow-sm' : ''}`}
              style={{ color: tab === i ? 'var(--accent, #2563EB)' : 'var(--text-tertiary, #6B7280)', background: tab === i ? 'var(--bg-surface, #FFFFFF)' : 'transparent' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Panels */}
        {tab === 0 && (
          <JonesCascadePanel
            cascadeState={cascadeState} setCascadeState={setCascadeState}
            wavelength={wavelength} setWavelength={setWavelength}
            elementsWithDelta={elementsWithDelta} result={result} ellipseParams={ellipseParams}
          />
        )}
        {tab === 1 && <MuellerPanel />}
        {tab === 2 && (
          <Suspense fallback={<SkeletonBall />}>
            <PoincarePanel stepsStokes={stepsStokes} />
          </Suspense>
        )}
      </div>
    </main>
  );
}

function SkeletonBall() {
  return (
    <div className="rounded-xl p-12 text-center" style={{ background: 'var(--bg-surface, #FFFFFF)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="w-64 h-64 mx-auto rounded-full border-4 border-dashed animate-pulse flex items-center justify-center" style={{ borderColor: 'var(--border-default, #DEE2E6)' }}>
        <span style={{ color: 'var(--text-tertiary, #6B7280)' }}>加载 3D 视图...</span>
      </div>
    </div>
  );
}

// app/tools/polarization/jones-panel.tsx — Jones 级联选项卡面板

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  type ElementType,
  type ElementConfig,
  type JonesVector,
  type JonesCascadeResult,
  type PolarizationEllipseParams,
  PREDEFINED_JONES,
  jonesFromPsiChi,
  jonesToStokes,
  elementLabel,
  extractEllipseParams,
} from "@/lib/optics/polarization";
import {
  ELEMENT_TYPES, DELTA_N_PRESETS, genId, createDefaultElement,
  cloneElementConfig, defaultCascade,
} from "./page";
import { PolarizationEllipse } from "./polarization-ellipse";
import { MatrixDisplay } from "./matrix-display";

export function JonesCascadePanel({
  cascadeState, setCascadeState, wavelength, setWavelength,
  elementsWithDelta, result, ellipseParams,
}: {
  cascadeState: { input: JonesVector; elements: ElementConfig[] };
  setCascadeState: React.Dispatch<React.SetStateAction<{ input: JonesVector; elements: ElementConfig[] }>>;
  wavelength: number;
  setWavelength: (v: number) => void;
  elementsWithDelta: ElementConfig[];
  result: JonesCascadeResult;
  ellipseParams: PolarizationEllipseParams;
}) {
  const [psiDeg, setPsiDeg] = useState(0);
  const [chiDeg, setChiDeg] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chainExpanded, setChainExpanded] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('H'); // H is default

  const handlePreset = useCallback((key: string) => {
    const preset = PREDEFINED_JONES[key];
    if (preset) {
      setCascadeState(prev => ({ ...prev, input: preset.vector.map(c => ({ re: c.re, im: c.im })) as JonesVector }));
      setPsiDeg(preset.psi);
      setChiDeg(preset.chi);
      setActivePreset(key);
    }
  }, [setCascadeState]);

  const handlePsiChiChange = useCallback((newPsi: number, newChi: number) => {
    setPsiDeg(newPsi);
    setChiDeg(newChi);
    setActivePreset(null); // manual slider clears preset highlight
    setCascadeState(prev => ({ ...prev, input: jonesFromPsiChi(newPsi, newChi) }));
  }, [setCascadeState]);

  const handleElementsChange = useCallback((updater: (prev: ElementConfig[]) => ElementConfig[]) => {
    setCascadeState(prev => ({ ...prev, elements: updater(prev.elements) }));
  }, [setCascadeState]);

  const handleReset = useCallback(() => {
    const d = defaultCascade();
    setCascadeState(d);
    setPsiDeg(0);
    setChiDeg(0);
    setActivePreset('H');
  }, [setCascadeState]);

  const handleCopyLink = useCallback(() => {
    const config = { input: cascadeState.input, elements: cascadeState.elements, wavelength };
    const json = JSON.stringify(config);
    const encoded = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `${window.location.origin}${window.location.pathname}?chain=${encoded}`;
    navigator.clipboard.writeText(url).then(() => alert('链路链接已复制到剪贴板！')).catch(() => {});
  }, [cascadeState, wavelength]);

  const handleExportJSON = useCallback(() => {
    const config = { input: cascadeState.input, elements: cascadeState.elements, wavelength };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'polarization-chain.json'; a.click();
    URL.revokeObjectURL(url);
  }, [cascadeState, wavelength]);

  const handleImportJSON = useCallback(() => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
    inp.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const config = JSON.parse(reader.result as string);
          if (config.input && config.elements) {
            setCascadeState({ input: config.input, elements: config.elements });
            if (config.wavelength) setWavelength(config.wavelength);
          }
        } catch { alert('JSON 格式无效'); }
      };
      reader.readAsText(file);
    };
    inp.click();
  }, [setCascadeState, setWavelength]);

  // Load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chain = params.get('chain');
    if (chain) {
      try {
        const json = decodeURIComponent(escape(atob(chain.replace(/-/g, '+').replace(/_/g, '/'))));
        const config = JSON.parse(json);
        if (config.input && config.elements) {
          setCascadeState({ input: config.input, elements: config.elements });
          if (config.wavelength) setWavelength(config.wavelength);
          const preset = Object.entries(PREDEFINED_JONES).find(([, v]) =>
            Math.abs(v.vector[0].re - config.input[0].re) < 0.01 &&
            Math.abs(v.vector[0].im - config.input[0].im) < 0.01 &&
            Math.abs(v.vector[1].re - config.input[1].re) < 0.01 &&
            Math.abs(v.vector[1].im - config.input[1].im) < 0.01
          );
          if (preset) { setPsiDeg(preset[1].psi); setChiDeg(preset[1].chi); }
        }
      } catch {}
    }
  }, []);

  const chainTooLong = useMemo(() => cascadeState.elements.length > 10, [cascadeState.elements]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        {/* Input polarization */}
        <Card>
          <CardTitle>① 初始偏振态</CardTitle>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.keys(PREDEFINED_JONES).map(key => {
              const isActive = activePreset === key;
              const label = { H: 'H 水平', V: 'V 垂直', D: 'D 45°', A: 'A 135°', R: 'R 右旋', L: 'L 左旋' }[key];
              return (
              <button key={key} onClick={() => handlePreset(key)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all border"
                style={{
                  borderColor: isActive ? 'var(--accent, #2563EB)' : 'var(--border-default, #DEE2E6)',
                  color: isActive ? '#fff' : 'var(--text-secondary, #4B5563)',
                  backgroundColor: isActive ? 'var(--accent, #2563EB)' : 'transparent',
                }}>
                {label}
              </button>
              );
            })}
          </div>
          <SliderRow label="方位角 ψ" value={psiDeg} min={0} max={180} step={0.5} unit="°" onChange={v => handlePsiChiChange(v, chiDeg)} />
          <SliderRow label="椭偏率角 χ" value={chiDeg} min={-45} max={45} step={0.5} unit="°" onChange={v => handlePsiChiChange(psiDeg, v)} />
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs mt-2 underline" style={{ color: 'var(--accent, #2563EB)' }}>
            {showAdvanced ? '收起' : '展开'}高级自定义
          </button>
          {showAdvanced && (
            <div className="mt-2 text-xs space-y-1" style={{ color: 'var(--text-secondary, #4B5563)' }}>
              <p>Eₓ = {cascadeState.input[0].re.toFixed(3)} {cascadeState.input[0].im >= 0 ? '+' : '-'} {Math.abs(cascadeState.input[0].im).toFixed(3)}i</p>
              <p>E_y = {cascadeState.input[1].re.toFixed(3)} {cascadeState.input[1].im >= 0 ? '+' : '-'} {Math.abs(cascadeState.input[1].im).toFixed(3)}i</p>
            </div>
          )}
        </Card>

        {/* Wavelength */}
        <Card>
          <CardTitle>波长 λ</CardTitle>
          <div className="flex items-center gap-2">
            <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
              className="w-32 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border-default, #DEE2E6)', color: 'var(--text-primary, #111827)' }}
              step={0.1} min={180} max={20000} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary, #6B7280)' }}>nm</span>
          </div>
        </Card>

        {/* Element chain */}
        <Card>
          <CardTitle>② 光学元件链路</CardTitle>
          {cascadeState.elements.length === 0 && (
            <p className="text-xs italic mb-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>空链路 — 输出 = 输入偏振态</p>
          )}
          <div className="space-y-2 max-h-96 overflow-y-auto mb-3">
            {cascadeState.elements.map((el, idx) => (
              <ElementCard key={el.id} element={el} index={idx} wavelength={wavelength}
                onUpdate={(upd) => handleElementsChange(prev => prev.map((e, i) => i === idx ? { ...e, ...upd } : e))}
                onRemove={() => handleElementsChange(prev => prev.filter((_, i) => i !== idx))}
                onClone={() => handleElementsChange(prev => { const n = [...prev]; n.splice(idx + 1, 0, cloneElementConfig(el)); return n; })}
                onToggleLock={() => handleElementsChange(prev => prev.map((e, i) => i === idx ? { ...e, locked: !e.locked } : e))}
              />
            ))}
          </div>
          <AddElementMenu onAdd={(type) => handleElementsChange(prev => [...prev, createDefaultElement(type)])} />
          <button onClick={() => setChainExpanded(!chainExpanded)} className="text-xs mt-2 underline" style={{ color: 'var(--accent, #2563EB)' }}>
            {chainExpanded ? '收起' : '展开'}总传输矩阵
          </button>
          {chainExpanded && <MatrixDisplay matrix={result.chainMatrix} />}
          <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)' }}>
            <ActionBtn onClick={handleReset} label="↺ 重置" />
            <ActionBtn onClick={handleCopyLink} label="🔗 复制链接" disabled={chainTooLong} />
            <ActionBtn onClick={handleExportJSON} label="📥 导出" />
            <ActionBtn onClick={handleImportJSON} label="📤 导入" />
          </div>
          {chainTooLong && <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary, #6B7280)' }}>链路较长（&gt;10个元件），建议用 JSON 导出/导入</p>}
        </Card>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardTitle>③ 输出结果</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <ResultBadge label="偏振类型" value={ellipseParams.handedness === 'linear' ? '线偏振' : ellipseParams.handedness === 'right' ? '右旋椭圆' : '左旋椭圆'} />
            <ResultBadge label="光强 I" value={`${(ellipseParams.intensity * 100).toFixed(1)}%`} />
            <ResultBadge label="方位角 ψ" value={`${ellipseParams.psi.toFixed(1)}°`} />
            <ResultBadge label="椭偏率 e" value={ellipseParams.ellipticity.toFixed(3)}
              sub={ellipseParams.PER !== null ? `PER ${ellipseParams.PER.toFixed(1)} dB` : 'PER → ∞'} />
          </div>
          <div className="flex gap-6 items-start flex-wrap">
            <PolarizationEllipse psi={ellipseParams.psi} ellipticity={ellipseParams.ellipticity} handedness={ellipseParams.handedness} />
            <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary, #4B5563)' }}>
              <p>Eₓ = {result.finalVector[0].re.toFixed(3)} {result.finalVector[0].im >= 0 ? '+' : '-'} {Math.abs(result.finalVector[0].im).toFixed(3)}i</p>
              <p>E_y = {result.finalVector[1].re.toFixed(3)} {result.finalVector[1].im >= 0 ? '+' : '-'} {Math.abs(result.finalVector[1].im).toFixed(3)}i</p>
              {(() => { const s = jonesToStokes(result.finalVector); return <p className="mt-2">Stokes: [{s[0].toFixed(3)}, {s[1].toFixed(3)}, {s[2].toFixed(3)}, {s[3].toFixed(3)}]</p>; })()}
            </div>
          </div>
        </Card>

        {result.steps.length > 0 && (
          <Card>
            <CardTitle>中间步骤</CardTitle>
            <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary, #4B5563)' }}>
              {result.steps.map((step, i) => {
                const ep = extractEllipseParams(step.afterVector);
                return (
                  <div key={i} className="flex items-center gap-3 py-1 px-2 rounded" style={{ background: i % 2 === 0 ? 'var(--bg-elevated, #F1F3F5)' : 'transparent' }}>
                    <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'var(--accent-light, #E7F5FF)', color: 'var(--accent, #2563EB)' }}>#{i + 1}</span>
                    <span className="flex-1">{step.elementLabel}</span>
                    <span>→ {ep.handedness === 'linear' ? '线偏' : ep.handedness === 'right' ? '右旋' : '左旋'}</span>
                    <span>ψ={ep.psi.toFixed(0)}°</span>
                    <span>I={(ep.intensity * 100).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---- Shared UI components ----
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className || ''}`} style={{ background: 'var(--bg-surface, #FFFFFF)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>{children}</div>;
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent, #2563EB)' }}>{children}</h3>;
}
function SliderRow({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs w-20 flex-shrink-0" style={{ color: 'var(--text-secondary, #4B5563)' }}>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: 'var(--border-default, #DEE2E6)', accentColor: 'var(--accent, #2563EB)' }} />
      <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
        className="w-16 px-1.5 py-0.5 rounded border text-xs text-right" style={{ borderColor: 'var(--border-default, #DEE2E6)', color: 'var(--text-primary, #111827)' }} />
      <span className="text-xs w-4" style={{ color: 'var(--text-tertiary, #6B7280)' }}>{unit}</span>
    </div>
  );
}
function ActionBtn({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="px-3 py-1.5 rounded-lg text-xs font-medium border"
    style={{ borderColor: 'var(--border-default, #DEE2E6)', color: disabled ? 'var(--text-disabled, #9CA3AF)' : 'var(--text-secondary, #4B5563)', opacity: disabled ? 0.5 : 1 }}>{label}</button>;
}
function ResultBadge({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated, #F1F3F5)' }}>
    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary, #6B7280)' }}>{label}</p>
    <p className="text-lg font-bold" style={{ color: 'var(--accent, #2563EB)' }}>{value}</p>
    {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary, #6B7280)' }}>{sub}</p>}
  </div>;
}
function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} className="w-6 h-6 flex items-center justify-center rounded text-xs hover:bg-gray-100">{children}</button>;
}

// ---- Element Card ----
function ElementCard({ element, index, wavelength, onUpdate, onRemove, onClone, onToggleLock }: {
  element: ElementConfig; index: number; wavelength: number;
  onUpdate: (updates: Partial<ElementConfig>) => void; onRemove: () => void; onClone: () => void; onToggleLock: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const info = ELEMENT_TYPES.find(t => t.type === element.type);

  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--bg-elevated, #F1F3F5)', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-light, #E7F5FF)', color: 'var(--accent, #2563EB)' }}>#{index + 1}</span>
          <span className="font-medium truncate max-w-[180px]" style={{ color: 'var(--text-primary, #111827)' }}>
            {elementLabel(element.type, { phiDeg: element.phiDeg, delta: element.delta, delayMode: element.delayMode, fractionalLambda: element.fractionalLambda })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => setEditing(!editing)} title="编辑">✏️</IconBtn>
          <IconBtn onClick={onClone} title="复制">📋</IconBtn>
          <IconBtn onClick={onToggleLock} title={element.locked ? '解锁' : '锁定'}>
            {element.locked ? '🔒' : '🔓'}
          </IconBtn>
          <IconBtn onClick={onRemove} title="删除">✕</IconBtn>
        </div>
      </div>
      {editing && (
        <div className="mt-2 space-y-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)' }}>
          {['polarizer', 'hwp', 'qwp', 'fwp', 'retarder', 'rotator', 'faraday'].includes(element.type) && (
            <SliderRow label={element.type === 'polarizer' ? '透射轴 θ' : element.type === 'rotator' ? '旋光角 α' : element.type === 'faraday' ? '旋转角 β' : '快轴角 φ'}
              value={element.phiDeg} min={0} max={180} step={0.5} unit="°" onChange={v => onUpdate({ phiDeg: v })} />
          )}
          {element.type === 'retarder' && (
            <RetarderEditor element={element} wavelength={wavelength} onUpdate={onUpdate} />
          )}
        </div>
      )}
    </div>
  );
}

const DELAY_MODE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'fractional', label: '波长分数 (λ)' },
  { value: 'radian', label: '弧度 (rad)' },
  { value: 'physical', label: '物理延迟 (nm)' },
];

function RetarderEditor({ element, wavelength, onUpdate }: { element: ElementConfig; wavelength: number; onUpdate: (upd: Partial<ElementConfig>) => void }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary, #4B5563)' }}>延迟模式:</span>
        <select value={element.delayMode} onChange={e => onUpdate({ delayMode: e.target.value as DelayMode })}
          className="px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--border-default, #DEE2E6)' }}>
          {DELAY_MODE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {element.delayMode === 'radian' && (
        <SliderRow label="延迟量 δ" value={element.delta} min={-2 * Math.PI} max={2 * Math.PI} step={0.01} unit="rad"
          onChange={v => onUpdate({ delta: v, fractionalLambda: delayToFractional(v) })} />
      )}
      {element.delayMode === 'fractional' && (
        <SliderRow label="延迟量 δ" value={element.fractionalLambda} min={-2} max={2} step={0.001} unit="λ"
          onChange={v => onUpdate({ fractionalLambda: v, delta: fractionalToDelay(v) })} />
      )}
      {element.delayMode === 'physical' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary, #4B5563)' }}>Δn:</span>
            <select value={element.physicalDeltaN} onChange={e => { const v = Number(e.target.value); onUpdate(v < 0 ? { physicalDeltaN: element.physicalDeltaN } : { physicalDeltaN: v }); }}
              className="px-2 py-1 rounded border text-xs flex-1" style={{ borderColor: 'var(--border-default, #DEE2E6)' }}>
              {DELTA_N_PRESETS.map(p => <option key={p.name} value={p.value}>{p.name}{p.value > 0 ? ` (${p.value})` : ''}</option>)}
            </select>
          </div>
          {element.physicalDeltaN < 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary, #4B5563)' }}>Δn 自定义:</span>
              <input type="number" value={element.physicalDeltaN} step={0.001} min={0.001}
                onChange={e => onUpdate({ physicalDeltaN: Number(e.target.value) })} className="w-24 px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--border-default, #DEE2E6)' }} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary, #4B5563)' }}>厚度 d:</span>
            <input type="number" value={element.physicalD} step={100} min={0}
              onChange={e => { const d = Number(e.target.value); const delta = physicalToDelay(d, element.physicalDeltaN, wavelength); onUpdate({ physicalD: d, delta }); }}
              className="w-32 px-2 py-1 rounded border text-xs" style={{ borderColor: 'var(--border-default, #DEE2E6)' }} />
            <span className="text-xs" style={{ color: 'var(--text-tertiary, #6B7280)' }}>nm</span>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary, #6B7280)' }}>
            等效 δ = 2π·Δn·d/λ = {(2 * Math.PI * element.physicalDeltaN * element.physicalD / wavelength).toFixed(3)} rad = {((element.physicalDeltaN * element.physicalD / wavelength)).toFixed(3)}λ
          </p>
        </div>
      )}
    </>
  );
}
import { DelayMode, delayToFractional, fractionalToDelay, physicalToDelay } from "@/lib/optics/polarization";

// ---- Add Element Menu ----
function AddElementMenu({ onAdd }: { onAdd: (type: ElementType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="px-3 py-1.5 rounded-lg text-xs font-medium border"
        style={{ borderColor: 'var(--accent, #2563EB)', color: 'var(--accent, #2563EB)' }}>+ 添加元件</button>
      {open && (
        <div className="absolute z-20 mt-1 w-56 rounded-lg shadow-lg p-2 space-y-0.5" style={{ background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
          {ELEMENT_TYPES.filter(t => t.type !== 'pbs_r').map(t => (
            <button key={t.type} onClick={() => { onAdd(t.type); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-gray-50 transition-colors">
              <span className="font-medium" style={{ color: 'var(--text-primary, #111827)' }}>{t.name}</span>
              <span className="ml-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>{t.description}</span>
            </button>
          ))}
          <button onClick={() => { onAdd('pbs_r'); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-gray-50 transition-colors">
            <span className="font-medium" style={{ color: 'var(--text-primary, #111827)' }}>PBS 反射</span>
            <span className="ml-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>垂直输出</span>
          </button>
        </div>
      )}
    </div>
  );
}

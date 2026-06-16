"use client";



import { useState, useRef, useEffect, useLayoutEffect } from "react";

// ====== Physics ======
function calc(wl: number, w0: number, m2: number, f: number, zd: number) {
  const wlm = wl * 1e-9, w0m = w0 * 1e-3, wlEff = wlm * m2;
  const zR = Math.PI * w0m * w0m / wlEff;
  const theta = wlEff / (Math.PI * w0m);
  const has = f > 0;
  const z1 = zd * 1e-3, fm = f * 1e-3;
  let w0o = 0, z2 = 0, zRo = 0;
  if (has) {
    const den = Math.sqrt((z1 - fm) ** 2 + zR * zR);
    w0o = w0m * fm / den;
    z2 = fm + (z1 - fm) * fm * fm / (den * den);
    zRo = Math.PI * w0o * w0o / wlEff;
  }
  return { zR, theta, wlEff, has, z1, fm, w0o, z2, zRo, w0m };
}

// ====== Canvas render (pure) ======
function draw(
  c: HTMLCanvasElement,
  wl: number, w0: number, m2: number, f: number, zd: number
) {
  const ctx = c.getContext("2d")!;
  const dpr = window.devicePixelRatio || 1;
  const rect = c.getBoundingClientRect();
  const W = rect.width, H = rect.height;
  c.width = W * dpr; c.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset + scale, NO accumulation

  const p = calc(wl, w0, m2, f, zd);
  const { zR, has, z1, w0o, z2, zRo, w0m } = p;

  // bg
  ctx.fillStyle = "#0D1117"; ctx.fillRect(0, 0, W, H);

  const M = 50, cx = W / 2, cy = H / 2;
  const total = has ? Math.max(z1 * 1000 + z2 * 1000 + 2000, 6000) : 8000;
  let s = (W - 2 * M) / total; if (s < 0.02) s = 0.02;
  const wx = cx; // waist at center
  const lx = has ? cx + s * zd : cx; // lens right of waist

  // optical axis (subtle dashed)
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
  ctx.setLineDash([6, 12]);
  ctx.beginPath(); ctx.moveTo(M, cy); ctx.lineTo(W - M, cy); ctx.stroke();
  ctx.setLineDash([]);

  // ruler (0 = waist)
  const ry = 14;
  for (let mm = -4000; mm <= total; mm += 500) {
    const tx = wx + s * mm;
    if (tx < M || tx > W - M) continue;
    const maj = mm % 1000 === 0;
    ctx.strokeStyle = maj ? "#4A5060" : "#2A3040"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx, ry); ctx.lineTo(tx, ry + (maj ? 8 : 4)); ctx.stroke();
    if (maj) {
      ctx.fillStyle = "#5A6070"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText(String(mm) + (mm === 0 ? " (waist)" : ""), tx, ry + 18);
    }
  }

  // --- input beam (stopped at lens if present) ---
  const zEnd = has ? zd : total;
  const N = 400, dz = (zEnd - (-4000)) / N;
  ctx.save(); ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const zz = -4000 + i * dz;
    const rr = w0m * Math.sqrt(1 + (Math.abs(zz) * 1e-3 / zR) ** 2) * 1000;
    const x = wx + s * zz;
    if (i === 0) ctx.moveTo(x, Math.max(0, cy - s * rr));
    else ctx.lineTo(x, Math.max(0, cy - s * rr));
  }
  for (let i = N; i >= 0; i--) {
    const zz = -4000 + i * dz;
    const rr = w0m * Math.sqrt(1 + (Math.abs(zz) * 1e-3 / zR) ** 2) * 1000;
    ctx.lineTo(wx + s * zz, Math.min(H, cy + s * rr));
  }
  ctx.closePath();
  const g1 = ctx.createLinearGradient(0, cy - 60, 0, cy + 60);
  g1.addColorStop(0, "rgba(0,150,230,0.08)");
  g1.addColorStop(0.35, "rgba(0,190,250,0.32)");
  g1.addColorStop(0.5, "rgba(0,210,255,0.45)");
  g1.addColorStop(0.65, "rgba(0,190,250,0.32)");
  g1.addColorStop(1, "rgba(0,150,230,0.08)");
  ctx.fillStyle = g1; ctx.fill();
  ctx.strokeStyle = "rgba(0,180,255,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // waist marker
  const wt = cy - s * w0m * 1000, wb = cy + s * w0m * 1000;
  if (wt > 10 && wb < H - 10) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,215,64,0.7)"; ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(wx - 28, wt); ctx.lineTo(wx + 28, wt); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx - 28, wb); ctx.lineTo(wx + 28, wb); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,215,64,0.9)"; ctx.font = "bold 9px monospace"; ctx.textAlign = "right";
    ctx.fillText("w\u2080=" + w0.toFixed(2) + "mm", wx - 32, cy + 4);
    ctx.restore();
  }

  // Rayleigh markers (no lens)
  if (!has) {
    const zrp = zR * 1000;
    [zrp, -zrp].forEach(z => {
      const x = wx + s * z;
      if (x > M + 5 && x < W - M - 5) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,138,101,0.35)"; ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(x, cy - 35); ctx.lineTo(x, cy + 35); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,138,101,0.6)"; ctx.font = "8px monospace"; ctx.textAlign = "center";
        ctx.fillText("zR", x, cy + 50);
        ctx.restore();
      }
    });
  }

  // lens
  if (has) {
    ctx.save();
    const lh = Math.min(85, H * 0.26);
    ctx.beginPath();
    ctx.moveTo(lx - 6, cy - lh);
    ctx.quadraticCurveTo(lx + 18, cy, lx - 6, cy + lh);
    ctx.lineTo(lx + 6, cy + lh);
    ctx.quadraticCurveTo(lx - 18, cy, lx + 6, cy - lh);
    ctx.closePath();
    const lg = ctx.createLinearGradient(lx - 18, cy, lx + 18, cy);
    lg.addColorStop(0, "rgba(15,40,80,0.25)");
    lg.addColorStop(0.3, "rgba(50,150,230,0.45)");
    lg.addColorStop(0.5, "rgba(90,210,255,0.65)");
    lg.addColorStop(0.7, "rgba(50,150,230,0.45)");
    lg.addColorStop(1, "rgba(15,40,80,0.25)");
    ctx.fillStyle = lg; ctx.fill();
    ctx.strokeStyle = "rgba(90,200,255,0.75)"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = "rgba(150,225,255,0.85)"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
    ctx.fillText("f=" + f + "mm", lx, cy - lh - 10);
    ctx.restore();
  }

  // output beam
  if (has && w0o > 1e-9) {
    const ox = lx + s * z2 * 1000;
    const olen = Math.max(zRo * 1000 * 3, 2000);
    const op = 200;
    ctx.save(); ctx.beginPath();
    for (let i = 0; i <= op; i++) {
      const d = olen * i / op;
      const rr = w0o * Math.sqrt(1 + (Math.abs(d) * 1e-3 / zRo) ** 2) * 1000;
      const x = Math.min(W, Math.max(0, ox + s * d));
      if (i === 0) ctx.moveTo(x, Math.max(0, cy - s * rr));
      else ctx.lineTo(x, Math.max(0, cy - s * rr));
    }
    for (let i = op; i >= 0; i--) {
      const d = olen * i / op;
      const rr = w0o * Math.sqrt(1 + (Math.abs(d) * 1e-3 / zRo) ** 2) * 1000;
      ctx.lineTo(Math.min(W, Math.max(0, ox + s * d)), Math.min(H, cy + s * rr));
    }
    ctx.closePath();
    const g2 = ctx.createLinearGradient(0, cy - 40, 0, cy + 40);
    g2.addColorStop(0, "rgba(0,200,140,0.06)");
    g2.addColorStop(0.35, "rgba(0,220,160,0.20)");
    g2.addColorStop(0.5, "rgba(0,255,180,0.28)");
    g2.addColorStop(0.65, "rgba(0,220,160,0.20)");
    g2.addColorStop(1, "rgba(0,200,140,0.06)");
    ctx.fillStyle = g2; ctx.fill();
    ctx.strokeStyle = "rgba(0,220,160,0.42)"; ctx.lineWidth = 1.5; ctx.stroke();

    // output waist mark
    const ot = cy - s * w0o * 1000, ob = cy + s * w0o * 1000;
    if (ot > 10 && ob < H - 10 && ox > M && ox < W - M) {
      ctx.strokeStyle = "rgba(0,230,118,0.55)"; ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(ox, ot); ctx.lineTo(ox, ob); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,240,130,0.75)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
      const ly = ot > 28 ? ot - 5 : ob + 11;
      ctx.fillText("w\u2080'=" + (w0o * 1000).toFixed(2) + "mm", ox, ly);
    }
    // dashed line lens→output waist
    ctx.strokeStyle = "rgba(0,200,150,0.15)"; ctx.lineWidth = 0.4;
    ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.moveTo(lx + 8, cy); ctx.lineTo(ox, cy); ctx.stroke();
    ctx.setLineDash([]);
    // z2 label
    if (ox > lx + 30) {
      ctx.fillStyle = "rgba(0,200,150,0.45)"; ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText("z\u2082=" + (z2 * 1000).toFixed(0) + "mm", (lx + ox) / 2, cy + 20);
    }
    ctx.restore();
  }

  // legend
  ctx.fillStyle = "rgba(190,200,210,0.65)"; ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    "\u03bb=" + wl + "nm  |  w\u2080=" + w0.toFixed(2) + "mm  |  M\u00b2=" + m2.toFixed(1),
    14, H - 8
  );
}

// ====== Page component ======
export default function GaussianBeamPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliders = useRef<Record<string, HTMLInputElement | null>>({});

  const [wl, setWl] = useState(1064);
  const [w0, setW0] = useState(1.0);
  const [m2, setM2] = useState(1.0);
  const [f, setF] = useState(500);
  const [zd, setZd] = useState(1000);
  const [hyd, setHyd] = useState(false);

  // URL→state on mount
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('wl')) setWl(+p.get('wl')!);
    if (p.get('w0')) setW0(+p.get('w0')!);
    if (p.get('m2')) setM2(+p.get('m2')!);
    if (p.get('lf')) setF(+p.get('lf')!);
    if (p.get('ld')) setZd(+p.get('ld')!);
    setHyd(true);
  }, []);

  // state→URL
  useEffect(() => {
    if (!hyd) return;
    const p = new URLSearchParams();
    p.set('wl', String(wl)); p.set('w0', String(w0)); p.set('m2', String(m2));
    p.set('lf', String(f)); p.set('ld', String(zd));
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }, [wl, w0, m2, f, zd, hyd]);

  const phys = calc(wl, w0, m2, f, zd);

  // Canvas
  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    draw(canvasRef.current, wl, w0, m2, f, zd);
    const onR = () => { if (canvasRef.current) draw(canvasRef.current, wl, w0, m2, f, zd); };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [wl, w0, m2, f, zd]);

  // Native event binding for sliders (bypass React range onChange timing)
  useEffect(() => {
    if (!hyd) return;
    const cleanups: (() => void)[] = [];
    const bind = (name: string, set: (v: number) => void, pf: (s: string) => number, cl: (n: number) => number) => {
      const el = sliders.current[name];
      if (!el) return;
      const h = () => { const v = pf(el.value); if (!isNaN(v)) set(cl(v)); };
      el.addEventListener("input", h);
      el.addEventListener("change", h);
      cleanups.push(() => { el.removeEventListener("input", h); el.removeEventListener("change", h); });
    };
    bind("wl", setWl, parseInt, v => Math.max(300, Math.min(2000, v)));
    bind("w0", setW0, parseFloat, v => Math.max(0.01, Math.min(5, v)));
    bind("m2", setM2, parseFloat, v => Math.max(1, Math.min(10, v)));
    bind("f",  setF,  parseInt, v => Math.max(0, Math.min(2000, v)));
    bind("zd", setZd, parseInt, v => Math.max(50, Math.min(5000, v)));
    return () => cleanups.forEach(fn => fn());
  }, [hyd]);

  const num = (set: (v: number) => void, cl: (n: number) => number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => { const v = parseFloat(e.target.value); if (!isNaN(v)) set(cl(v)); };

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-3 md:p-4 min-h-0 lg:overflow-hidden overflow-y-auto">
        {/* Canvas */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-[#2A3040] bg-[#0D1117] min-h-[300px] lg:min-h-0">
          <canvas ref={canvasRef} className="w-full h-full absolute inset-0" style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Controls */}
        <aside className="w-full lg:w-[320px] lg:border-l lg:border border-[#E9ECEF] rounded-xl bg-white px-4 py-3.5 space-y-3.5 overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none">
          <div>
            <h1 className="text-base font-semibold text-[#1A1A2E]">高斯光束传播计算器</h1>
            <p className="text-xs text-[#868E96]">近轴近似 · Kogelnik 理论 · TEM₀₀ 基模</p>
          </div>

          <div className="bg-[#F5F7FA] rounded-lg px-3 py-2 text-xs text-[#868E96]">
            💡 标尺零点是束腰。拖动滑块观察光束经透镜前后的变化。
          </div>

          <div className="space-y-3">
            {/* λ */}
            <div>
              <label className="text-xs text-[#495057] block mb-1">波长 λ (nm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={300} max={2000} step={1} value={wl}
                  ref={(r: HTMLInputElement | null) => { sliders.current.wl = r; }} onChange={() => {}} className="flex-1 accent-[#FF6B00] h-1.5" />
                <input type="number" min={300} max={2000} step={1} value={wl}
                  onChange={num(setWl, v => Math.max(300, Math.min(2000, Math.round(v))))}
                  className="w-[4.2rem] text-xs text-right border border-[#DEE2E6] rounded px-1.5 py-0.5 font-mono text-[#FF6B00] bg-white focus:outline-none focus:border-[#FF6B00]" />
              </div>
            </div>

            {/* w0 */}
            <div>
              <label className="text-xs text-[#495057] block mb-1">束腰半径 w₀ (mm)</label>
              <div className="flex items-center gap-2">
                <input type="range" min={0.01} max={5} step={0.01} value={w0}
                  ref={(r: HTMLInputElement | null) => { sliders.current.w0 = r; }} onChange={() => {}} className="flex-1 accent-[#00BFFF] h-1.5" />
                <input type="number" min={0.01} max={5} step={0.01} value={w0}
                  onChange={num(setW0, v => Math.max(0.01, Math.min(5, Math.round(v * 100) / 100)))}
                  className="w-[4.2rem] text-xs text-right border border-[#DEE2E6] rounded px-1.5 py-0.5 font-mono text-[#00BFFF] bg-white focus:outline-none focus:border-[#00BFFF]" />
              </div>
            </div>

            {/* M² */}
            <div>
              <label className="text-xs text-[#495057] block mb-1">M² 因子</label>
              <div className="flex items-center gap-2">
                <input type="range" min={1} max={10} step={0.1} value={m2}
                  ref={(r: HTMLInputElement | null) => { sliders.current.m2 = r; }} onChange={() => {}} className="flex-1 accent-[#FFD740] h-1.5" />
                <input type="number" min={1} max={10} step={0.1} value={m2}
                  onChange={num(setM2, v => Math.max(1, Math.min(10, Math.round(v * 10) / 10)))}
                  className="w-[4.2rem] text-xs text-right border border-[#DEE2E6] rounded px-1.5 py-0.5 font-mono text-[#FFD740] bg-white focus:outline-none focus:border-[#FFD740]" />
              </div>
            </div>

            {/* Lens section */}
            <div className="border-t border-[#E9ECEF] pt-3">
              <p className="text-xs text-[#868E96] mb-2">🔍 透镜聚焦（f=0 时移除透镜）</p>

              <div className="mb-3">
                <label className="text-xs text-[#495057] block mb-1">焦距 f (mm)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={2000} step={10} value={f}
                    ref={(r: HTMLInputElement | null) => { sliders.current.f = r; }} onChange={() => {}} className="flex-1 accent-[#00E676] h-1.5" />
                  <input type="number" min={0} max={2000} step={10} value={f}
                    onChange={num(setF, v => Math.max(0, Math.min(2000, Math.round(v / 10) * 10)))}
                    className="w-[4.2rem] text-xs text-right border border-[#DEE2E6] rounded px-1.5 py-0.5 font-mono text-[#00E676] bg-white focus:outline-none focus:border-[#00E676]" />
                </div>
              </div>

              {f > 0 && (
                <div>
                  <label className="text-xs text-[#495057] block mb-1">束腰到透镜距离 z₁ (mm)</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={50} max={5000} step={10} value={zd}
                    ref={(r: HTMLInputElement | null) => { sliders.current.zd = r; }} onChange={() => {}} className="flex-1 accent-[#9C27B0] h-1.5" />
                    <input type="number" min={50} max={5000} step={10} value={zd}
                      onChange={num(setZd, v => Math.max(50, Math.min(5000, Math.round(v / 10) * 10)))}
                      className="w-[4.2rem] text-xs text-right border border-[#DEE2E6] rounded px-1.5 py-0.5 font-mono text-[#9C27B0] bg-white focus:outline-none focus:border-[#9C27B0]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3.5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#868E96]">瑞利长度 zR</span><span className="font-mono text-[#1A1A2E] font-medium">{(phys.zR*1000).toFixed(1)} mm</span></div>
            <div className="flex justify-between"><span className="text-[#868E96]">远场半角 θ</span><span className="font-mono text-[#1A1A2E] font-medium">{(phys.theta*1000).toFixed(2)} mrad</span></div>
            <div className="flex justify-between"><span className="text-[#868E96]">等效波长 λ·M²</span><span className="font-mono text-[#1A1A2E] font-medium">{(phys.wlEff*1e9).toFixed(1)} nm</span></div>
            {phys.has && phys.w0o > 1e-9 && <>
              <div className="pt-1 border-t border-[#DEE2E6]" />
              <div className="flex justify-between"><span className="text-[#868E96]">输出束腰 w₀'</span><span className="font-mono text-[#00BFFF] font-medium">{(phys.w0o*1000).toFixed(3)} mm</span></div>
              <div className="flex justify-between"><span className="text-[#868E96]">像距 z₂</span><span className="font-mono text-[#00BFFF] font-medium">{(phys.z2*1000).toFixed(0)} mm</span></div>
              <div className="flex justify-between"><span className="text-[#868E96]">输出瑞利长度 zR'</span><span className="font-mono text-[#00BFFF] font-medium">{(phys.zRo*1000).toFixed(1)} mm</span></div>
            </>}
            <div className="flex justify-between pt-1 border-t border-[#DEE2E6] text-xs text-[#ADB5BD]">
              <span>w(z) = w₀√(1+[z/zR]²)</span>
              <span className="font-mono">Kogelnik</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-1.5 text-xs text-[#868E96]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#00BFFF]" /> 入射光束</span>
            {phys.has && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#64FFB4]" /> 出射光束</span>}
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#FFD740]" /> 束腰 w₀</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#FF8A65]" /> 瑞利长度</span>
          </div>

          {/* Footer */}
          <a href="/community" className="flex items-center justify-between px-3 py-2 mt-1 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] hover:border-[#228BE6] hover:bg-[#E7F5FF] transition-all no-underline group">
            <span className="text-xs text-[#495057] group-hover:text-[#228BE6] flex items-center gap-1.5">
              <span className="text-sm">💬</span> 有问题或建议？去留言区聊聊
            </span>
            <span className="text-xs text-[#ADB5BD] group-hover:text-[#228BE6]">→</span>
          </a>

          <p className="text-[11px] text-[#ADB5BD] leading-relaxed">
            ⚠ Kogelnik 近轴理论，TEM₀₀ 基模。M² 修正使用等效波长。不替代专业激光设计软件（Zemax、LASCAD）。
          </p>
        </aside>
      </main>
    </div>
  );
}

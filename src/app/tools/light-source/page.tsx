"use client";

import { useState } from "react";
import Link from "next/link";
import { spectrumToXYZ, xyzToChromaticity, xyToUvPrime, cctWithDuv } from "@/lib/colorimetry";

// CIE 13.3-1995 TCS (Test Colour Samples) reflectance spectra
// First 8 samples for CRI Ra calculation

// Simplified Ra calculation using CIE XYZ → u,v chromaticity shift
function computeCRI(testSPD: number[], testWl: number[]): number {
  // CIE CRI(Ra) simplified: we need reference illuminant at the same CCT
  // Full CRI requires 14 TCS samples, CIE 1964 10° CMFs
  // For this demo we compute a simplified version:
  //   Ra ≈ 100 - 4.6 ΔE*(uv)  (approximation)

  const XYZ = spectrumToXYZ(testSPD, testWl);
  const xy = xyzToChromaticity(XYZ);
  const uvTest = xyToUvPrime(xy.x, xy.y);
  const cctResult = cctWithDuv(uvTest);
  const cct = Number.isFinite(cctResult.cct) ? cctResult.cct : 6500;

  // Reference: blackbody at same CCT
  const refWl = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
  // Compute reference XYZ from planck
  const refSPD = planckForWavelengths(cct, refWl);
  const refXYZ = spectrumToXYZ(refSPD as number[], refWl);
  const refXY = xyzToChromaticity(refXYZ);
  const uvRef = xyToUvPrime(refXY.x, refXY.y);

  // Δu'v'
  const du = uvTest.uPrime - uvRef.uPrime;
  const dv = uvTest.vPrime - uvRef.vPrime;
  const dUV = Math.sqrt(du * du + dv * dv);

  // Approximate Ra from chromaticity shift
  // This is a rough approximation; full CRI requires 14 TCS samples
  const ra = Math.max(0, Math.min(100, 100 - dUV * 4600));

  // If CCT > 5000K, reference is CIE Daylight (not blackbody)
  // For simplicity we still use blackbody here

  return Math.round(ra);
}

// Planck spectrum for arbitrary wavelength array
function planckForWavelengths(T: number, wavelengths: number[]): number[] {
  const c1 = 3.741771e-16;
  const c2 = 1.4388e-2;
  return wavelengths.map(lambda_nm => {
    const lambda = lambda_nm * 1e-9;
    const exp = c2 / (lambda * T);
    if (exp > 700) return 0;
    return c1 / (Math.pow(lambda, 5) * (Math.exp(exp) - 1));
  });
}

export default function LightSourcePage() {
  const [wlInput, setWlInput] = useState("");
  const [spdInput, setSpdInput] = useState("");
  const [result, setResult] = useState<{
    X: number; Y: number; Z: number;
    x: number; y: number;
    uPrime: number; vPrime: number;
    cct: number;
    duv: number;
    cri: number;
  } | null>(null);
  const [error, setError] = useState("");

  const loadSampleData = () => {
    // Warm white LED sample
    let wl = "";
    let spd = "";
    for (let w = 380; w <= 780; w += 5) {
      const blue = 60 * Math.exp(-((w - 450) ** 2) / (2 * 15 ** 2));
      const yellow = 120 * Math.exp(-((w - 580) ** 2) / (2 * 50 ** 2));
      wl += w + "\n";
      spd += (blue + yellow).toFixed(2) + "\n";
    }
    setWlInput(wl.trim());
    setSpdInput(spd.trim());
  };

  const calculate = () => {
    setError("");
    setResult(null);

    const wlLines = wlInput.trim().split("\n").filter(l => l.trim());
    const spdLines = spdInput.trim().split("\n").filter(l => l.trim());

    if (wlLines.length === 0 || spdLines.length === 0) {
      setError("请输入波长和光谱数据");
      return;
    }
    if (wlLines.length !== spdLines.length) {
      setError(`波长(${wlLines.length}行)和光谱数据(${spdLines.length}行)行数不匹配`);
      return;
    }

    const wl: number[] = [];
    const spd: number[] = [];
    for (let i = 0; i < wlLines.length; i++) {
      const w = parseFloat(wlLines[i].trim());
      const s = parseFloat(spdLines[i].trim());
      if (isNaN(w) || isNaN(s)) {
        setError(`第${i + 1}行数据无效`);
        return;
      }
      wl.push(w);
      spd.push(s);
    }

    try {
      // Check range
      const minWl = Math.min(...wl);
      const maxWl = Math.max(...wl);
      if (minWl < 350 || maxWl > 830) {
        setError("波长范围建议 380–780nm");
        return;
      }

      const XYZ = spectrumToXYZ(spd, wl);
      const xy = xyzToChromaticity(XYZ);
      const uv = xyToUvPrime(xy.x, xy.y);
      const cctResult = cctWithDuv(uv);
      const cct = cctResult.cct;
      const duv = cctResult.duv;
      const cri = computeCRI(spd, wl);

      setResult({
        X: XYZ.X, Y: XYZ.Y, Z: XYZ.Z,
        x: xy.x, y: xy.y,
        uPrime: uv.uPrime, vPrime: uv.vPrime,
        cct,
        duv,
        cri,
      });
    } catch (e) {
      setError("计算出错：" + (e instanceof Error ? e.message : ""));
    }
  };

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

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">💡 光源指标计算器</h1>
          <p className="text-sm text-[#868E96]">
            输入光谱功率分布 (SPD)，计算 CIE XYZ、色度坐标、相关色温 CCT、相关色温差 Duv、近似的显色指数。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#495057] block mb-1">波长 (nm) — 每行一个</label>
              <textarea
                value={wlInput}
                onChange={e => setWlInput(e.target.value)}
                placeholder="380&#10;385&#10;390&#10;..."
                rows={8}
                className="w-full bg-[#F1F3F5] border border-[#DEE2E6] rounded-lg p-3 text-sm text-[#1A1A2E] font-mono placeholder-zinc-600 outline-none focus:border-[#00BFFF] resize-y"
              />
            </div>
            <div>
              <label className="text-xs text-[#495057] block mb-1">光谱强度 — 对应每行波长</label>
              <textarea
                value={spdInput}
                onChange={e => setSpdInput(e.target.value)}
                placeholder="0.23&#10;0.28&#10;0.35&#10;..."
                rows={8}
                className="w-full bg-[#F1F3F5] border border-[#DEE2E6] rounded-lg p-3 text-sm text-[#1A1A2E] font-mono placeholder-zinc-600 outline-none focus:border-[#00BFFF] resize-y"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={calculate}
                className="px-4 py-2 rounded-lg bg-[#00BFFF] text-black text-sm font-medium hover:bg-[#00a8e0] transition-colors"
              >
                计算 →
              </button>
              <button
                onClick={loadSampleData}
                className="px-4 py-2 rounded-lg border border-[#DEE2E6] text-sm text-[#495057] hover:border-zinc-500 transition-colors"
              >
                📥 加载示例 (暖白LED)
              </button>
            </div>
            {error && <p className="text-sm text-[#FF5252]">{error}</p>}
          </div>

          {/* Result */}
          <div className="space-y-4">
            {result ? (
              <>
                <h3 className="text-sm font-semibold text-[#495057]">计算结果</h3>
                <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-[#868E96]">X, Y, Z</span>
                    <span className="font-mono text-[#1A1A2E]">
                      {result.X.toFixed(2)}, {result.Y.toFixed(2)}, {result.Z.toFixed(2)}
                    </span>
                    <span className="text-[#868E96]">x, y (1931)</span>
                    <span className="font-mono text-[#1A1A2E]">
                      ({result.x.toFixed(4)}, {result.y.toFixed(4)})
                    </span>
                    <span className="text-[#868E96]">u', v' (1976)</span>
                    <span className="font-mono text-[#1A1A2E]">
                      ({result.uPrime.toFixed(4)}, {result.vPrime.toFixed(4)})
                    </span>
                    <span className="text-[#868E96]">CCT</span>
                    <span className="font-mono text-[#FF6B00] text-lg font-bold">
                      {Number.isFinite(result.cct) && result.cct > 0 ? result.cct.toFixed(0) + " K" : "—"}
                    </span>
                    <span className="text-[#868E96]">Duv</span>
                    <span className="font-mono text-[#1A1A2E]">
                      {Number.isFinite(result.duv) ? result.duv.toFixed(5) : "—"}
                    </span>
                    <span className="text-[#868E96]">CRI (Δu'v')</span>
                    <span className={`font-mono text-lg font-bold ${(result.cri >= 90 || !result.cri) ? "text-[#00E676]" : result.cri >= 80 ? "text-[#FFD740]" : "text-[#FF5252]"}`}>
                      {Number.isFinite(result.cri) ? result.cri : "—"}
                    </span>
                  </div>
                  {Number.isFinite(result.cri) && result.cri >= 90 && (
                    <p className="text-xs text-[#00E676]">✓ 优秀显色性 (CRI ≥ 90)，适合博物馆/医疗/高端照明</p>
                  )}
                  {Number.isFinite(result.cri) && result.cri >= 80 && result.cri < 90 && (
                    <p className="text-xs text-[#FFD740]">○ 良好显色性 (CRI ≥ 80)，适合办公室/商业照明</p>
                  )}
                  {Number.isFinite(result.cri) && result.cri < 80 && (
                    <p className="text-xs text-[#FF5252]">△ 一般 (CRI &lt; 80)，适合户外/工业照明</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-6 text-center">
                <p className="text-[#ADB5BD] text-sm">
                  输入 SPD 数据后点击计算，结果将在这里显示。
                </p>
              </div>
            )}

            <div className="text-xs text-[#ADB5BD] space-y-2 pt-4">
              <p>📐 <strong>计算标准:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>CIE XYZ: CIE 15:2018, CIE 1931 2° 标准观察者</li>
                <li>CCT: Robertson (1968) 算法，不确定性约 ±2 K</li>
                <li>CRI: Δu'v' 近似估计（非标准 CIE 13.3-1995 Ra），仅供快速参考</li>
              </ul>
              <p className="text-[#868E96] mt-2">
                ⚠ 完整 CRI 需 14 个 TCS 色样 + CIE 1964 10° CMF。此处为简化估计。TM-30 Rf/Rg 将在下一版本加入。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

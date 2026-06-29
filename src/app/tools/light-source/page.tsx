"use client";



import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { spectrumToXYZ, xyzToChromaticity, xyToUvPrime, cctWithDuv } from "@/lib/colorimetry";
import { formatValue } from "@/lib/utils/number";

// CIE 13.3-1995 TCS (Test Colour Samples) reflectance spectra
// First 8 samples for CRI Ra calculation

// CIE Standard Daylight D-series chromaticity (CIE 15:2018)
// Given CCT, returns (x,y) chromaticity of the D illuminant using standard formulae
function cieDaylightChromaticity(cct: number): { x: number; y: number } {
  const T = cct;
  let xD: number;
  if (T <= 7000) {
    xD = -4.6070e9 / (T * T * T) + 2.9678e6 / (T * T) + 0.09911e3 / T + 0.244063;
  } else {
    xD = -2.0064e9 / (T * T * T) + 1.9018e6 / (T * T) + 0.24748e3 / T + 0.237040;
  }
  const yD = -3.000 * xD * xD + 2.870 * xD - 0.275;
  return { x: xD, y: yD };
}

// Simplified Ra estimation using CIE XYZ → u',v' chromaticity shift
// CCT ≤ 5000K: reference = Planckian (blackbody)
// CCT > 5000K: reference = CIE Standard Daylight D-series
function computeCRI(testSPD: number[], testWl: number[]): number {
  const XYZ = spectrumToXYZ(testSPD, testWl);
  const xy = xyzToChromaticity(XYZ);
  const uvTest = xyToUvPrime(xy.x, xy.y);
  const cctResult = cctWithDuv(uvTest);
  const cct = Number.isFinite(cctResult.cct) ? cctResult.cct : 6500;

  let uvRef: { uPrime: number; vPrime: number };

  if (cct > 5000) {
    // CCT > 5000K: use CIE Standard Daylight D-series reference
    const refXY = cieDaylightChromaticity(cct);
    uvRef = xyToUvPrime(refXY.x, refXY.y);
  } else {
    // CCT ≤ 5000K: use Planckian (blackbody) reference
    const refWl = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
    const refSPD = planckForWavelengths(cct, refWl);
    const refXYZ = spectrumToXYZ(refSPD as number[], refWl);
    const refXY = xyzToChromaticity(refXYZ);
    uvRef = xyToUvPrime(refXY.x, refXY.y);
  }

  // Δu'v'
  const du = uvTest.uPrime - uvRef.uPrime;
  const dv = uvTest.vPrime - uvRef.vPrime;
  const dUV = Math.sqrt(du * du + dv * dv);

  // Approximate Ra from chromaticity shift
  // This is a rough approximation; full CRI requires 14 TCS samples
  const ra = Math.max(0, Math.min(100, 100 - dUV * 4600));

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

function LightSourceContent() {
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
  const searchParams = useSearchParams();

  // Auto-load SPD data from URL parameter
  useEffect(() => {
    const spdParam = searchParams.get("spd");
    if (!spdParam) return;
    try {
      const spd = JSON.parse(decodeURIComponent(spdParam));
      if (spd.wl && spd.val && Array.isArray(spd.wl) && Array.isArray(spd.val) && spd.wl.length === spd.val.length && spd.wl.length > 0) {
        setWlInput(spd.wl.join("\n"));
        setSpdInput(spd.val.map((v: number) => v.toString()).join("\n"));
      }
    } catch {
      // Invalid SPD data, ignore
    }
  }, [searchParams]);

  const loadSampleData = () => {
    // Warm white LED sample
    let wl = "";
    let spd = "";
    for (let w = 380; w <= 780; w += 5) {
      const blue = 60 * Math.exp(-((w - 450) ** 2) / (2 * 15 ** 2));
      const yellow = 120 * Math.exp(-((w - 580) ** 2) / (2 * 50 ** 2));
      wl += w + "\n";
      spd += formatValue(blue + yellow, { precision: 2 }) + "\n";
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
    <div className="min-h-[calc(100vh-56px)] flex flex-col"><main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
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
                      {formatValue(result.X, { precision: 2 })}, {formatValue(result.Y, { precision: 2 })}, {formatValue(result.Z, { precision: 2 })}
                    </span>
                    <span className="text-[#868E96]">x, y (1931)</span>
                    <span className="font-mono text-[#1A1A2E]">
                      ({formatValue(result.x, { precision: 4 })}, {formatValue(result.y, { precision: 4 })})
                    </span>
                    <span className="text-[#868E96]">u', v' (1976)</span>
                    <span className="font-mono text-[#1A1A2E]">
                      ({formatValue(result.uPrime, { precision: 4 })}, {formatValue(result.vPrime, { precision: 4 })})
                    </span>
                    <span className="text-[#868E96]">CCT</span>
                    <span className="font-mono text-[#FF6B00] text-lg font-bold">
                      {Number.isFinite(result.cct) && result.cct > 0 ? formatValue(result.cct, { precision: 0, unit: " K" }) : "—"}
                    </span>
                    <span className="text-[#868E96]">Duv</span>
                    <span className="font-mono text-[#1A1A2E]">
                      {formatValue(result.duv, { precision: 5 })}
                    </span>
                    <span className="text-[#868E96]">估计 Ra (Δu'v')</span>
                    <span className={`font-mono text-lg font-bold ${(result.cri >= 90 || !result.cri) ? "text-[#00E676]" : result.cri >= 80 ? "text-[#FFD740]" : "text-[#FF5252]"}`}>
                      {Number.isFinite(result.cri) ? result.cri : "—"}
                    </span>
                  </div>
                  {Number.isFinite(result.cri) && result.cri >= 90 && (
                    <p className="text-xs text-[#00E676]">✓ 估计显色性优秀 (Ra est ≥ 90)，适合博物馆/医疗/高端照明</p>
                  )}
                  {Number.isFinite(result.cri) && result.cri >= 80 && result.cri < 90 && (
                    <p className="text-xs text-[#FFD740]">○ 估计显色性良好 (Ra est ≥ 80)，适合办公室/商业照明</p>
                  )}
                  {Number.isFinite(result.cri) && result.cri < 80 && (
                    <p className="text-xs text-[#FF5252]">△ 估计显色性一般 (Ra est &lt; 80)，适合户外/工业照明</p>
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


export default function LightSourcePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-56px)] flex items-center justify-center"><p className="text-[#868E96]">加载中...</p></div>}>
      <LightSourceContent />
    </Suspense>
  );
}
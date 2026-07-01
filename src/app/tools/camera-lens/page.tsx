"use client";



import { useState, useEffect } from "react";
import Link from "next/link";
import { trackPageView, trackCalculate, trackExport, trackImport, trackInteract } from "@/lib/analytics";

const sensors: Record<string, { w: number; h: number; pixel: number }> = {
  imx183: { w: 13.1, h: 8.8, pixel: 2.4 },
  imx264: { w: 8.5, h: 7.1, pixel: 3.45 },
  imx304: { w: 14.1, h: 10.3, pixel: 3.45 },
  imx250: { w: 8.5, h: 7.1, pixel: 3.45 },
  imx226: { w: 7.5, h: 5.6, pixel: 1.85 },
  imx174: { w: 10.7, h: 8.0, pixel: 5.86 },
  ar0521: { w: 5.7, h: 4.3, pixel: 2.2 },
  python5000: { w: 12.5, h: 10.0, pixel: 4.8 },
  "fmt-14": { w: 3.6, h: 2.7, pixel: 6.0 },
  "fmt-13": { w: 4.8, h: 3.6, pixel: 6.0 },
  "fmt-12.5": { w: 5.7, h: 4.3, pixel: 3.0 },
  "fmt-12": { w: 6.4, h: 4.8, pixel: 5.0 },
  "fmt-11.7": { w: 7.5, h: 5.6, pixel: 2.0 },
  "fmt-23": { w: 8.8, h: 6.6, pixel: 3.45 },
  "fmt-1": { w: 12.8, h: 9.6, pixel: 5.0 },
  "fmt-11": { w: 14.1, h: 10.3, pixel: 3.45 },
  "fmt-43": { w: 17.3, h: 13.0, pixel: 4.0 },
  "fmt-aps-c": { w: 22.3, h: 14.9, pixel: 4.0 },
  "fmt-ff": { w: 36.0, h: 24.0, pixel: 6.0 },
};

const sensorModels = [
  { key: "imx183", label: "Sony IMX183 (1英寸 / 20.2MP / 2.4μm)" },
  { key: "imx264", label: "Sony IMX264 (2/3英寸 / 5.1MP / 3.45μm)" },
  { key: "imx304", label: "Sony IMX304 (1.1英寸 / 12.4MP / 3.45μm)" },
  { key: "imx250", label: "Sony IMX250 (2/3英寸 / 5.1MP / 3.45μm)" },
  { key: "imx226", label: "Sony IMX226 (1/1.7英寸 / 12.4MP / 1.85μm)" },
  { key: "imx174", label: "Sony IMX174 (1/1.2英寸 / 2.3MP / 5.86μm)" },
  { key: "ar0521", label: "Onsemi AR0521 (1/2.5英寸 / 5MP / 2.2μm)" },
  { key: "python5000", label: "Onsemi Python5000 (1英寸 / 5.3MP / 4.8μm)" },
];

const formatOptions = [
  { key: "fmt-14", label: "1/4英寸 (3.6×2.7mm)" },
  { key: "fmt-13", label: "1/3英寸 (4.8×3.6mm)" },
  { key: "fmt-12.5", label: "1/2.5英寸 (5.7×4.3mm)" },
  { key: "fmt-12", label: "1/2英寸 (6.4×4.8mm)" },
  { key: "fmt-11.7", label: "1/1.7英寸 (7.5×5.6mm)" },
  { key: "fmt-23", label: "2/3英寸 (8.8×6.6mm)" },
  { key: "fmt-1", label: "1英寸 (12.8×9.6mm)" },
  { key: "fmt-11", label: "1.1英寸 (14.1×10.3mm)" },
  { key: "fmt-43", label: "4/3英寸 (17.3×13.0mm)" },
  { key: "fmt-aps-c", label: "APS-C (22.3×14.9mm)" },
  { key: "fmt-ff", label: "全画幅 (36.0×24.0mm)" },
];

export default function CameraLensPage() {
  const [sensorW, setSensorW] = useState("8.8");
  useEffect(() => { trackPageView("camera-lens"); }, []);
  const [sensorH, setSensorH] = useState("6.6");
  const [pixelSize, setPixelSize] = useState("3.45");
  const [mode, setMode] = useState<"A" | "B" | "C">("A");
  const [wd, setWd] = useState("300");
  const [fovW, setFovW] = useState("200");
  const [fl, setFl] = useState("25");

  useEffect(() => {
    const sw = parseFloat(sensorW) || 0;
    const wdVal = parseFloat(wd) || 0;
    const fovVal = parseFloat(fovW) || 0;
    const flVal = parseFloat(fl) || 0;
    if (mode === "A" && wdVal > 0 && fovVal > 0 && sw > 0) setFl(((sw * wdVal) / fovVal).toFixed(1));
    if (mode === "B" && wdVal > 0 && flVal > 0 && sw > 0) setFovW(((sw * wdVal) / flVal).toFixed(1));
    if (mode === "C" && fovVal > 0 && flVal > 0 && sw > 0) setWd(((flVal * fovVal) / sw).toFixed(1));
  }, [sensorW, sensorH, wd, fovW, fl, mode]);

  const sw = parseFloat(sensorW) || 0;
  const sh = parseFloat(sensorH) || 0;
  const px = parseFloat(pixelSize) || 0;
  const wdVal = parseFloat(wd) || 0;
  const fovVal = parseFloat(fovW) || 0;
  const flVal = parseFloat(fl) || 0;
  const diag = Math.sqrt(sw * sw + sh * sh);

  const beta = (wdVal > 0 && wdVal !== flVal) ? flVal / (wdVal - flVal) : 0;
  const absBeta = Math.abs(beta);
  const resultFovH = sw > 0 ? (fovVal * sh) / sw : 0;
  const resolution = absBeta > 0 ? (px / absBeta) / 1000 : 0;
  const vImg = flVal > 0 ? flVal * (1 + absBeta) : flVal;
  const afov = sw > 0 && vImg > 0 ? 2 * Math.atan(sw / (2 * vImg)) * (180 / Math.PI) : 0;

  let primaryLabel = "", primaryValue = "--", primarySub = "";
  if (mode === "A" && flVal > 0) { primaryLabel = "推荐镜头焦距"; primaryValue = "~" + Math.round(flVal) + " mm"; primarySub = "精确值: " + flVal.toFixed(1) + " mm  |  选购接近的标准焦距规格"; }
  else if (mode === "B" && fovVal > 0) { primaryLabel = "水平视野范围"; primaryValue = Math.round(fovVal) + " × " + Math.round(resultFovH) + " mm"; primarySub = "宽×高  |  实际会因镜头畸变略有偏差"; }
  else if (mode === "C" && wdVal > 0) { primaryLabel = "工作距离"; primaryValue = Math.round(wdVal) + " mm"; primarySub = "光学距离（到前主面）|  机械距离请参考镜头 datasheet"; }

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col bg-[#F3F4F6]"><main className="flex-1 max-w-5xl mx-auto p-6 space-y-4 w-full">
        <h1 className="text-xl font-bold text-[#111827]">📷 相机镜头选型计算器</h1>
        <p className="text-sm text-[#6B7280]">传感器参数 + 工作需求 → 镜头规格参考 · 高斯光学精确几何计算</p>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-4">
            {/* Sensor */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#2563EB] mb-3">① 我的相机传感器</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-[#6B7280]">已知传感器型号（可选）</label>
                  <select className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm" onChange={(e) => { const s = sensors[e.target.value]; if (s) { trackInteract("camera-lens", "sensor-change", e.target.value); setSensorW(String(s.w)); setSensorH(String(s.h)); setPixelSize(String(s.pixel)); } }}>
                    <option value="">— 我知道型号 —</option>
                    {sensorModels.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B7280]">或只知靶面尺寸（速选）</label>
                  <select className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm" onChange={(e) => { const s = sensors[e.target.value]; if (s) { trackInteract("camera-lens", "sensor-change", e.target.value); setSensorW(String(s.w)); setSensorH(String(s.h)); setPixelSize(String(s.pixel)); } }}>
                    <option value="">— 我只知道靶面 —</option>
                    {formatOptions.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-[#6B7280]">传感器宽 (mm)</label><input type="number" value={sensorW} onChange={e => setSensorW(e.target.value)} className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm" step="0.1" /></div>
                <div><label className="text-xs text-[#6B7280]">传感器高 (mm)</label><input type="number" value={sensorH} onChange={e => setSensorH(e.target.value)} className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm" step="0.1" /></div>
                <div><label className="text-xs text-[#6B7280]">像元大小 (μm)</label><input type="number" value={pixelSize} onChange={e => setPixelSize(e.target.value)} className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm" step="0.01" /></div>
              </div>
              <p className="text-xs text-[#6B7280] mt-2">传感器对角线: <strong>{diag.toFixed(1)}</strong> mm — 镜头成像圈需 ≥ 此值</p>
            </div>

            {/* Mode */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#2563EB] mb-3">② 我想算什么</h3>
              <div className="flex gap-1 mb-4">
                {["A","B","C"].map(m => (
                  <button key={m} onClick={() => setMode(m as "A"|"B"|"C")}
                    className={"flex-1 p-2 text-xs rounded-lg transition-all " + (mode === m ? "bg-[#2563EB] text-white" : "bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB] hover:border-[#2563EB]")}>
                    <strong>{m === "A" ? "算焦距" : m === "B" ? "算视野" : "算距离"}</strong><br />
                    <span className="opacity-70">{m === "A" ? "已知距离 + 视野" : m === "B" ? "已知焦距 + 距离" : "已知焦距 + 视野"}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#6B7280]">工作距离 WD (mm) {mode === "C" && <span className="text-[#F59F00]">← 计算</span>}</label>
                  <input type="number" value={wd} onChange={e => setWd(e.target.value)} disabled={mode === "C"} className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm disabled:opacity-40" step="1" />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280]">水平视野 FOV (mm) {mode === "B" && <span className="text-[#F59F00]">← 计算</span>}</label>
                  <input type="number" value={fovW} onChange={e => setFovW(e.target.value)} disabled={mode === "B"} className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm disabled:opacity-40" step="1" />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280]">镜头焦距 f (mm) {mode === "A" && <span className="text-[#F59F00]">← 计算</span>}</label>
                  <input type="number" value={fl} onChange={e => setFl(e.target.value)} disabled={mode === "A"} className="w-full mt-1 p-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm disabled:opacity-40" step="0.1" />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#2563EB] mb-3">③ 计算结果</h3>
              <div className="bg-[#2563EB]/5 border border-[#2563EB]/20 rounded-lg p-4 text-center mb-4">
                <div className="text-xs text-[#2563EB] mb-1">{primaryLabel}</div>
                <div className="text-2xl font-bold text-[#059669]">{primaryValue}</div>
                <div className="text-xs text-[#6B7280] mt-1">{primarySub}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]"><span>水平视野</span><span className="font-semibold">{fovVal > 0 ? fovVal.toFixed(1) + " mm" : "--"}</span></div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]"><span>垂直视野</span><span className="font-semibold">{resultFovH > 0 ? resultFovH.toFixed(1) + " mm" : "--"}</span></div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]"><span>工作距离</span><span className="font-semibold">{wdVal > 0 ? wdVal.toFixed(1) + " mm" : "--"}</span></div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]"><span>放大倍率 |β|</span><span className="font-semibold">{absBeta > 0 ? absBeta.toFixed(4) + "×" : "--"}</span></div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]"><span>像元分辨率</span><span><span className="font-semibold">{resolution > 0 ? resolution.toFixed(3) + " mm/px" : "--"}</span><br /><span className="text-xs text-[#6B7280]">理论极限，实际受镜头MTF和衍射限制</span></span></div>
                <div className="flex justify-between py-2 border-b border-[#E5E7EB]"><span>水平角视场</span><span><span className="font-semibold">{afov > 0 ? afov.toFixed(1) + "°" : "--"}</span><br /><span className="text-xs text-[#6B7280]">基于实际像距计算</span></span></div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                <div className="flex justify-between items-center">
                  <span className="text-sm">靶面匹配</span>
                  <span className="text-xs px-3 py-1 rounded bg-[#059669]/10 text-[#059669] font-semibold">✅ 传感器对角线 {diag.toFixed(1)} mm → 请确保镜头成像圈 ≥ 此值</span>
                </div>
              </div>
              <div className="text-xs text-[#6B7280] mt-3 p-2 bg-[#F59F00]/5 border-l-2 border-[#F59F00] rounded">
                ⚠️ 基于高斯光学几何公式。模式 C 的工作距离为光学工作距离（到前主面），实际请以镜头 datasheet 为准。放大倍率为绝对值，实像倒立。像元分辨率为衍射不受限下的理论值。
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-60 flex-shrink-0">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sticky top-20">
              <h4 className="text-xs text-[#6B7280] mb-3">📖 使用说明</h4>
              <ol className="text-xs text-[#4B5563] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>先选传感器型号或靶面尺寸</li>
                <li>选一个计算模式</li>
                <li>填已知参数，结果自动计算</li>
              </ol>
              <div className="mt-3 text-xs">
                <p className="text-[#6B7280] mb-1">核心公式</p>
                <div className="bg-[#F3F4F6] rounded p-2 font-mono text-[#059669] mb-1">f = 传感器宽 × WD ÷ FOV</div>
                <div className="bg-[#F3F4F6] rounded p-2 font-mono text-[#059669] mb-1">FOV = 传感器宽 × WD ÷ f</div>
                <div className="bg-[#F3F4F6] rounded p-2 font-mono text-[#059669]">β = f / (WD − f)</div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#E5E7EB] text-xs leading-relaxed">
                <p className="mb-2">⚡ <strong>模式 A</strong>：最适"有相机，要买什么镜头"</p>
                <p className="mb-2">⚡ <strong>模式 B</strong>：最适"有镜头+相机，能看多大"</p>
                <p>⚡ <strong>模式 C</strong>：最适"距离受限，能看多大视野"</p>
              </div>
              <p className="mt-3 pt-3 border-t border-[#E5E7EB] text-xs text-[#6B7280]">💡 模式A、B精确，模式C为光学距离(±5-15%)。请以镜头datasheet为准。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

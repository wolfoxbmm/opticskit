"use client";



import { useState, useMemo } from "react";
import Link from "next/link";

interface LaserEntry {
  name: string;
  type: string;
  wavelengths: number[];
  linewidth: string;
  pumpMethod: string;
  powerRange: string;
  applications: string[];
}

const laserData: LaserEntry[] = [
  { name: "He-Ne (氦氖)", type: "气体", wavelengths: [632.8], linewidth: "< 0.002 nm", pumpMethod: "电激励", powerRange: "0.5–50 mW", applications: ["光学实验", "干涉测量", "校准标准"] },
  { name: "Ar⁺ (氩离子)", type: "气体", wavelengths: [488, 514.5], linewidth: "~0.01 nm", pumpMethod: "电激励", powerRange: "10 mW–20 W", applications: ["荧光激发", "全息术", "视网膜治疗"] },
  { name: "He-Cd (氦镉)", type: "气体", wavelengths: [325, 441.6], linewidth: "~0.001 nm", pumpMethod: "电激励", powerRange: "1–200 mW", applications: ["光刻", "3D打印", "荧光光谱"] },
  { name: "CO₂ (二氧化碳)", type: "气体", wavelengths: [10600], linewidth: "~0.1 nm", pumpMethod: "电激励", powerRange: "1 W–100 kW", applications: ["激光切割", "焊接", "医疗手术"] },
  { name: "N₂ (氮分子)", type: "气体", wavelengths: [337.1], linewidth: "~0.1 nm", pumpMethod: "电激励", powerRange: "pulse: μJ–mJ", applications: ["荧光激发", "泵浦染料激光"] },
  { name: "准分子 KrF", type: "气体", wavelengths: [248], linewidth: "~0.5 nm", pumpMethod: "电激励", powerRange: "pulse: mJ–J", applications: ["光刻", "LASIK手术", "材料加工"] },
  { name: "准分子 ArF", type: "气体", wavelengths: [193], linewidth: "~0.5 nm", pumpMethod: "电激励", powerRange: "pulse: mJ–J", applications: ["深紫外光刻", "半导体制造"] },
  { name: "准分子 XeCl", type: "气体", wavelengths: [308], linewidth: "~0.5 nm", pumpMethod: "电激励", powerRange: "pulse: mJ–J", applications: ["医疗", "材料处理"] },
  { name: "Nd:YAG (基频)", type: "固体", wavelengths: [1064], linewidth: "~0.1 nm", pumpMethod: "闪光灯/二极管", powerRange: "mW–kW (CW), mJ–J (pulse)", applications: ["激光加工", "测距", "医疗"] },
  { name: "Nd:YAG (二倍频)", type: "固体", wavelengths: [532], linewidth: "~0.05 nm", pumpMethod: "二极管泵浦", powerRange: "mW–100W", applications: ["激光显示", "光学泵浦", "流式细胞术"] },
  { name: "Nd:YAG (三倍频)", type: "固体", wavelengths: [355], linewidth: "~0.03 nm", pumpMethod: "二极管泵浦", powerRange: "mW–10W", applications: ["微加工", "光刻", "拉曼光谱"] },
  { name: "Nd:YAG (四倍频)", type: "固体", wavelengths: [266], linewidth: "~0.02 nm", pumpMethod: "二极管泵浦", powerRange: "mW–1W", applications: ["光纤刻写", "光致发光"] },
  { name: "Nd:YVO₄", type: "固体", wavelengths: [1064, 532], linewidth: "~0.1/0.05 nm", pumpMethod: "二极管泵浦", powerRange: "mW–50W", applications: ["激光打印", "微加工"] },
  { name: "Yb:YAG (碟片)", type: "固体", wavelengths: [1030], linewidth: "~1 nm", pumpMethod: "二极管泵浦", powerRange: "W–kW", applications: ["工业加工", "科研"] },
  { name: "Ti:Sapphire", type: "固体", wavelengths: [700, 1080], linewidth: "可调谐 ~10–100 nm", pumpMethod: "ND:YAG/Ar⁺泵浦", powerRange: "mW–W (CW), μJ–mJ (fs pulse)", applications: ["超快光谱", "多光子显微", "光学相干断层"] },
  { name: "Cr:LiSAF", type: "固体", wavelengths: [780, 1010], linewidth: "可调谐", pumpMethod: "二极管泵浦", powerRange: "mW级", applications: ["飞秒激光", "生物成像"] },
  { name: "Er:YAG", type: "固体", wavelengths: [2940], linewidth: "~1 nm", pumpMethod: "闪光灯/二极管", powerRange: "mJ–J (pulse)", applications: ["牙科", "皮肤科", "软组织手术"] },
  { name: "Ho:YAG", type: "固体", wavelengths: [2100], linewidth: "~1 nm", pumpMethod: "二极管/Tm光纤泵浦", powerRange: "W–100W", applications: ["泌尿外科", "激光碎石"] },
  { name: "Tm:YAG", type: "固体", wavelengths: [2010], linewidth: "~1 nm", pumpMethod: "二极管泵浦", powerRange: "W级", applications: ["医疗", "遥感", "激光雷达"] },
  { name: "半导体激光 (GaN)", type: "半导体", wavelengths: [405], linewidth: "~1 nm", pumpMethod: "电流注入", powerRange: "mW–W", applications: ["蓝光存储", "投影", "荧光激发"] },
  { name: "半导体激光 (AlGaInP)", type: "半导体", wavelengths: [635, 670], linewidth: "~1 nm", pumpMethod: "电流注入", powerRange: "mW–W", applications: ["条形码", "激光指示器", "光通信"] },
  { name: "半导体激光 (GaAlAs)", type: "半导体", wavelengths: [780, 850], linewidth: "~1 nm", pumpMethod: "电流注入", powerRange: "mW–W", applications: ["CD播放", "激光打印", "光通信"] },
  { name: "半导体激光 (InGaAs)", type: "半导体", wavelengths: [980, 1550], linewidth: "~1 nm", pumpMethod: "电流注入", powerRange: "mW–W", applications: ["光纤通信", "EDFA泵浦"] },
  { name: "VCSEL", type: "半导体", wavelengths: [850, 940], linewidth: "< 1 nm", pumpMethod: "电流注入", powerRange: "μW–mW", applications: ["数据中心", "3D传感", "面部识别"] },
  { name: "量子级联 (QCL)", type: "半导体", wavelengths: [4000, 12000], linewidth: "< 1 nm", pumpMethod: "电流注入", powerRange: "mW–W", applications: ["气体传感", "光谱学", "自由空间通信"] },
  { name: "染料激光 (罗丹明6G)", type: "染料", wavelengths: [560, 640], linewidth: "可调谐", pumpMethod: "Ar⁺/Nd:YAG泵浦", powerRange: "mW–W", applications: ["激光光谱", "医疗", "同位素分离"] },
  { name: "染料激光 (香豆素)", type: "染料", wavelengths: [440, 540], linewidth: "可调谐", pumpMethod: "Nd:YAG三倍频", powerRange: "mW–W", applications: ["光谱学", "光化学"] },
  { name: "Yb光纤", type: "光纤", wavelengths: [1030, 1080], linewidth: "~0.1–10 nm", pumpMethod: "二极管泵浦", powerRange: "W–100kW", applications: ["工业切割焊接", "国防"] },
  { name: "Er光纤", type: "光纤", wavelengths: [1550], linewidth: "~0.1 nm", pumpMethod: "二极管泵浦", powerRange: "mW–kW", applications: ["光通信放大", "激光雷达", "眼安全测距"] },
  { name: "Tm光纤", type: "光纤", wavelengths: [1900, 2050], linewidth: "~1 nm", pumpMethod: "二极管泵浦", powerRange: "W–kW", applications: ["医疗手术", "激光雷达"] },
];

const typeColors: Record<string, string> = {
  "气体": "border-cyan-500/30 text-cyan-400",
  "固体": "border-amber-500/30 text-amber-400",
  "半导体": "border-green-500/30 text-green-400",
  "染料": "border-purple-500/30 text-purple-400",
  "光纤": "border-red-500/30 text-red-400",
};

// 波长分布概览组件 — 对数刻度版本
function WavelengthBand({ filtered }: { filtered: LaserEntry[] }) {
  const allWls = filtered.flatMap(l => l.wavelengths);
  if (allWls.length === 0) return null;

  const minWl = 100;    // 100nm 覆盖 ArF 193nm
  const maxWl = 12000;  // 最高约 12000nm（QCL）
  const logMin = Math.log10(minWl);
  const logMax = Math.log10(maxWl);
  const logRange = logMax - logMin;

  const toPercentLog = (wl: number) => ((Math.log10(wl) - logMin) / logRange) * 100;

  // 波段边界百分比（对数坐标）
  const uvEnd = toPercentLog(400);
  const visEnd = toPercentLog(700);

  // 可见光渐变：7 个 color-stop，对齐物理波长
  const visStopWls = [400, 460, 520, 570, 595, 635, 700];
  const visStops = visStopWls.map(wl => toPercentLog(wl));
  const visColors = ["#5B00C8", "#0033FF", "#00CC33", "#CCDD00", "#E6A800", "#FF5500", "#CC0000"];

  // 刻度线位置（对数坐标上的关键波长）
  const tickWls = [100, 200, 400, 700, 1000, 2000, 5000, 10000, 12000];

  // 构建每个波长的来源信息
  const wlInfo = filtered.flatMap(l =>
    l.wavelengths.map(wl => ({ wl, name: l.name, type: l.type }))
  );

  const BAR_HEIGHT = 48;
  const [hoveredLaser, setHoveredLaser] = useState<string | null>(null);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-[#868E96]">波长分布概览（对数刻度）</span>
        <span className="text-xs text-[#ADB5BD]">({allWls.length} 条谱线)</span>
        {hoveredLaser && (
          <span className="text-xs text-[#00BFFF] font-mono ml-2">→ {hoveredLaser}</span>
        )}
      </div>
      <div
        className="relative rounded-lg overflow-hidden border border-[#E9ECEF]"
        style={{ height: BAR_HEIGHT }}
        onMouseLeave={() => setHoveredLaser(null)}
      >
        {/* 三区背景 */}
        <div className="absolute inset-0 flex">
          <div
            style={{ width: `${uvEnd}%`, backgroundColor: "rgba(147,51,234,0.12)" }}
            className="h-full"
          />
          <div
            style={{
              width: `${visEnd - uvEnd}%`,
              background: `linear-gradient(90deg, ${visColors.map((c, i) => `${c} ${((visStops[i] - uvEnd) / (visEnd - uvEnd)) * 100}%`).join(", ")})`,
              opacity: 0.13,
            }}
            className="h-full"
          />
          <div
            style={{ width: `${100 - visEnd}%`, backgroundColor: "rgba(239,68,68,0.12)" }}
            className="h-full"
          />
        </div>

        {/* 刻度虚线 */}
        {tickWls.map(tw => {
          const pct = toPercentLog(tw);
          return (
            <div
              key={`tick-${tw}`}
              className="absolute top-0 h-full pointer-events-none"
              style={{
                left: `${pct}%`,
                width: "1px",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            />
          );
        })}

        {/* 波长标记线 */}
        {wlInfo.map((info, i) => {
          const pct = toPercentLog(info.wl);
          const isHovered = hoveredLaser === info.name;

          // 根据波长着色
          let color: string;
          if (info.wl < 400) color = "#a855f7";
          else if (info.wl < 460) color = "#6366f1";
          else if (info.wl < 500) color = "#3b82f6";
          else if (info.wl < 570) color = "#22c55e";
          else if (info.wl < 595) color = "#eab308";
          else if (info.wl < 700) color = "#f97316";
          else if (info.wl < 2000) color = "#ef4444";
          else color = "#dc2626";

          return (
            <div
              key={i}
              className="absolute top-1 cursor-pointer transition-opacity duration-150"
              style={{
                left: `${pct}%`,
                width: isHovered ? "3px" : "1.5px",
                height: isHovered ? `calc(100% - 2px)` : "60%",
                top: isHovered ? "1px" : "20%",
                backgroundColor: color,
                opacity: isHovered ? 1 : 0.8,
                zIndex: isHovered ? 10 : 1,
              }}
              title={`${info.wl} nm · ${info.name}`}
              onMouseEnter={() => setHoveredLaser(info.name)}
            />
          );
        })}

        {/* 波段标签 — 放在波段区域上方，用绝对定位避免溢出 */}
        <div className="absolute top-0 left-0 right-0 h-full flex pointer-events-none">
          <div style={{ width: `${uvEnd}%` }} className="relative h-full">
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] text-purple-400/60 font-medium">UV</span>
          </div>
          <div style={{ width: `${visEnd - uvEnd}%` }} className="relative h-full overflow-hidden">
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] text-white/50 font-medium whitespace-nowrap">VIS</span>
          </div>
          <div style={{ width: `${100 - visEnd}%` }} className="relative h-full">
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] text-red-400/60 font-medium">IR</span>
          </div>
        </div>
      </div>

      {/* 底部刻度参考 — 对数标尺 */}
      <div className="relative h-4 mt-0.5 mx-[-2px]">
        {tickWls.map(tw => {
          const pct = toPercentLog(tw);
          const label = tw >= 1000 ? `${tw / 1000}μm` : `${tw}nm`;
          return (
            <span
              key={`tl-${tw}`}
              className="absolute text-[9px] text-[#495057] font-mono"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function LaserPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("全部");
  const [wlMin, setWlMin] = useState("");
  const [wlMax, setWlMax] = useState("");

  const types = ["全部", ...new Set(laserData.map(l => l.type))];

  const filtered = useMemo(() => {
    return laserData.filter((l) => {
      if (typeFilter !== "全部" && l.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchApp = l.applications.some(a => a.toLowerCase().includes(q));
        const matchWl = l.wavelengths.some(w => w.toString().includes(q));
        if (!matchName && !matchApp && !matchWl) return false;
      }
      if (wlMin && !l.wavelengths.some(w => w >= parseFloat(wlMin))) return false;
      if (wlMax && !l.wavelengths.some(w => w <= parseFloat(wlMax))) return false;
      return true;
    });
  }, [search, typeFilter, wlMin, wlMax]);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden"><main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col min-h-0 overflow-hidden">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">⚡ 激光波长速查</h1>
          <p className="text-sm text-[#868E96]">40+ 种常见激光器参数，按类型/波长/应用搜索。数据来源：Thorlabs、Edmund Optics及公开激光参数手册。</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="搜索名称 / 波长 / 应用..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#F1F3F5] border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] placeholder-zinc-600 outline-none focus:border-[#00BFFF] w-64"
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#F1F3F5] border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] outline-none focus:border-[#00BFFF]"
          >
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="number"
            placeholder="最小波长 (nm)"
            value={wlMin}
            onChange={e => setWlMin(e.target.value)}
            className="bg-[#F1F3F5] border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] placeholder-zinc-600 outline-none focus:border-[#00BFFF] w-36"
          />
          <input
            type="number"
            placeholder="最大波长 (nm)"
            value={wlMax}
            onChange={e => setWlMax(e.target.value)}
            className="bg-[#F1F3F5] border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#1A1A2E] placeholder-zinc-600 outline-none focus:border-[#00BFFF] w-36"
          />
          <span className="text-sm text-[#ADB5BD] self-center ml-auto">
            {filtered.length} / {laserData.length} 结果
          </span>
        </div>

        {/* Wavelength distribution overview */}
        <WavelengthBand filtered={filtered} />

        {/* Table */}
        <div className="overflow-auto flex-1 rounded-xl border border-[#E9ECEF]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] text-[#495057] text-left sticky top-0 z-10 shadow-sm">
                <th className="px-4 py-3 font-normal">激光器</th>
                <th className="px-4 py-3 font-normal hidden sm:table-cell">类型</th>
                <th className="px-4 py-3 font-normal">波长 (nm)</th>
                <th className="px-4 py-3 font-normal hidden md:table-cell">线宽</th>
                <th className="px-4 py-3 font-normal hidden lg:table-cell">功率范围</th>
                <th className="px-4 py-3 font-normal hidden xl:table-cell">应用</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => (
                <tr key={idx} className="border-t border-[#E9ECEF] hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1A1A2E]">{l.name}</td>
                  <td className={`px-4 py-3 text-xs hidden sm:table-cell`}>
                    <span className={`inline-block border rounded px-2 py-0.5 ${typeColors[l.type] || "border-zinc-600 text-[#495057]"}`}>
                      {l.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {l.wavelengths.map((w, i) => (
                        <span key={i} className="font-mono text-xs bg-[#1a1a1a] text-[#228BE6] px-2 py-0.5 rounded">
                          {w}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#495057] text-xs hidden md:table-cell">{l.linewidth}</td>
                  <td className="px-4 py-3 text-[#495057] text-xs hidden lg:table-cell">{l.powerRange}</td>
                  <td className="px-4 py-3 text-[#868E96] text-xs hidden xl:table-cell">{l.applications.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-[#ADB5BD] py-8">没有匹配的激光器，试试调整筛选条件。</p>
        )}
      </main>
    </div>
  );
}

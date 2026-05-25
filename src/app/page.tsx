import Link from "next/link";

const tools = [
  {
    name: "CIE 色度图",
    desc: "交互式马蹄图，点击查色坐标 / 色温 / Duv，sRGB & DCI-P3 色域叠加",
    href: "/tools/chromaticity",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/>
      </svg>
    ),
    color: "blue",
  },
  {
    name: "衍射与干涉模拟",
    desc: "单缝 / 双缝 / 多缝光栅，Fraunhofer 衍射条纹 & 光强分布实时渲染",
    href: "/tools/diffraction",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2M6 8v8M10 5v14M14 6v12M18 9v6M22 12h-2"/>
      </svg>
    ),
    color: "violet",
  },
  {
    name: "光谱数据可视化",
    desc: "导入 SPD 曲线，叠加黑体辐射对比，自动导出 XYZ/xy 坐标",
    href: "/tools/spectrum",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20L9 8l6 12 6-16"/>
      </svg>
    ),
    color: "teal",
  },
  {
    name: "透镜成像模拟",
    desc: "凸透镜 & 凹透镜，薄透镜近轴光线追迹，拖动滑块实时交互",
    href: "/tools/lens",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="4" ry="10"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
      </svg>
    ),
    color: "amber",
  },
  {
    name: "光源指标计算器",
    desc: "SPD → XYZ → xy → CCT / Duv / 近似CRI 全链路自动计算",
    href: "/tools/light-source",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    color: "rose",
  },
  {
    name: "激光波长速查",
    desc: "30+ 种激光器参数，按类型 / 波长 / 应用检索",
    href: "/tools/laser",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="18" y2="12"/><polygon points="12 6 14 12 12 18 10 12 12 6"/>
      </svg>
    ),
    color: "blue",
  },
];

const colorMap: Record<string, { accent: string; light: string; text: string }> = {
  blue:   { accent: "#228BE6", light: "#E7F5FF", text: "#1c7ed6" },
  violet:{ accent: "#7950F2", light: "#F3F0FF", text: "#6741d9" },
  teal:   { accent: "#0CA678", light: "#E6FCF5", text: "#099268" },
  amber:  { accent: "#F08C00", light: "#FFF4E6", text: "#e67700" },
  rose:   { accent: "#E64980", light: "#FFF0F6", text: "#d6336c" },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F3F5]">
      {/* Navigation — 毛玻璃 */}
      <header className="sticky top-0 z-50 border-b border-[#E9ECEF] bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group no-underline hover:no-underline">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#228BE6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10"/>
            </svg>
            <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#1A1A2E]">OpticsKit</span>
            <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#868E96] bg-[#F1F3F5] rounded-md px-1.5 py-0.5">BETA</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/about" className="text-[13px] text-[#495057] hover:text-[#1A1A2E] transition-colors no-underline hover:no-underline">关于</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#868E96] hover:text-[#495057] transition-colors no-underline hover:no-underline">GitHub</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-12 px-6 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#DEE2E6] bg-white text-[12px] text-[#495057] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0CA678]" />
            免费 · 开源 · 6 个工具
          </div>
          <h1 className="text-[42px] leading-[1.12] font-semibold tracking-[-0.03em] text-[#1A1A2E]">
            用光的语言
            <br />
            <span className="text-[#868E96]">理解颜色与波前</span>
          </h1>
          <p className="text-[15px] text-[#495057] leading-relaxed max-w-lg mx-auto">
            为中国光学研究者打造的免费在线计算与可视化工具集。
            <br />
            基于国际标准，让计算回归理性。
          </p>

        </div>
      </section>

      {/* Tool Grid — 3×2 */}
      <section className="flex-1 px-4 pb-12">
        <div className="max-w-[960px] mx-auto">
          <div className="mb-8">
            <h2 className="text-[13px] font-medium tracking-[0.06em] uppercase text-[#868E96] mb-0.5">工具</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => {
              const c = colorMap[tool.color];
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex flex-col gap-4 p-6 rounded-xl bg-white border border-[#E9ECEF] shadow-sm hover:shadow-md hover:border-[#DEE2E6] hover:-translate-y-0.5 transition-all duration-200 animate-fade-in group no-underline hover:no-underline h-[180px] relative overflow-hidden"
                  style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                >
                  {/* Top accent bar on hover */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ backgroundColor: c.accent }}
                  />
                  {/* Color dot + icon */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.light, color: c.accent }}>
                      {tool.icon}
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#1A1A2E] tracking-[-0.01em]">
                      {tool.name}
                    </h3>
                  </div>
                  <p className="text-[13px] text-[#868E96] leading-relaxed flex-1">
                    {tool.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features — 横向标签 */}
      <section className="pb-12 px-6">
        <div className="max-w-[960px] mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-[#868E96]">
          <span>📐 基于 CIE/ISO 国际标准</span>
          <span className="text-[#DEE2E6]">·</span>
          <span>🔓 完全免费 · 开源</span>
          <span className="text-[#DEE2E6]">·</span>
          <span>🇨🇳 中文优先 · 公众号同步科普</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E9ECEF] py-8 px-6 text-center space-y-2 bg-white">
        <p className="text-[13px] text-[#868E96]">OpticsKit · 光学工具箱</p>
        <p className="text-[12px] text-[#ADB5BD]">
          关注公众号 <span className="text-[#495057] font-medium">光学科技资讯</span> · 让计算回归理性
        </p>
      </footer>
    </div>
  );
}

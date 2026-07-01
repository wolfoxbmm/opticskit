"use client";




import Link from "next/link";


const tools = [
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
    name: "色度分析工具",
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
    name: "薄膜干涉模拟",
    desc: "TMM 传输矩阵法，单层膜反射率 vs 波长 & 膜厚扫描，13 种预设场景",
    href: "/tools/thin-film",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18M21 3v18"/><path d="M3 12h18"/><path d="M12 3v18"/>
        <path d="M6 9l3-3-3-3M18 15l-3 3 3 3"/>
      </svg>
    ),
    color: "cyan",
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
  {
    name: "光学材料折射率数据库",
    desc: "460 种光学材料的折射率 n(λ) 与消光系数 k(λ)，含 Schott 玻璃库，数据来源 CC0 公共领域",
    href: "/tools/material-db",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    color: "violet",
  },
  {
    name: "柯西色散拟合",
    desc: "Cauchy 公式拟合折射率色散，可见光实测到红外波段 n 外推，8 种预设材料",
    href: "/tools/cauchy-fit",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20l4-16 4 16 4-16 4 16"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    ),
    color: "cyan",
  },

  {
    name: "相机镜头选型计算器",
    desc: "传感器靶面 + 工作距离 + 视野 → 推荐焦距 · 像元分辨率 · 角视场",
    href: "/tools/camera-lens",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="1"/><circle cx="12" cy="12" r="3"/><line x1="8" y1="3" x2="8" y2="6"/><line x1="16" y1="3" x2="16" y2="6"/>
      </svg>
    ),
    color: "blue",
  },
];


import articlesData from "../../articles/index.json";

function ArticleSection() {
  const articles = articlesData.slice(0, 3);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[16px] font-bold text-[#1A1A2E] tracking-[-0.02em]">精选文章</h2>
        <p className="text-[13px] text-[#868E96]">光学技术干货，每周更新</p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {articles.map((a, i) => (
          <Link
            key={a.slug}
            href={`/articles/${a.slug}`}
            className="block bg-white border border-[#E9ECEF] rounded-lg p-4 hover:border-[#228BE6]/30 hover:shadow-sm transition-all group"
          >
            <h3 className="text-[14px] font-semibold text-[#1A1A2E] group-hover:text-[#228BE6] transition-colors leading-relaxed">
              {a.title}
            </h3>
            <p className="text-[12px] text-[#868E96] mt-1 line-clamp-1">{a.summary}</p>
            <p className="text-[11px] text-[#ADB5BD] mt-1.5">{a.date}</p>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-[13px] text-[#228BE6] hover:text-[#1c7ed6] font-medium transition-colors"
        >
          查看全部文章
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>

      </div>
    </>
  );
}
const colorMap: Record<string, { accent: string; light: string; text: string }> = {
  blue:   { accent: "#228BE6", light: "#E7F5FF", text: "#1c7ed6" },
  violet:{ accent: "#7950F2", light: "#F3F0FF", text: "#6741d9" },
  teal:   { accent: "#0CA678", light: "#E6FCF5", text: "#099268" },
  amber:  { accent: "#F08C00", light: "#FFF4E6", text: "#e67700" },
  rose:   { accent: "#E64980", light: "#FFF0F6", text: "#d6336c" },
  cyan:   { accent: "#1098AD", light: "#E3FAFC", text: "#0b7285" },
  slate:  { accent: "#868E96", light: "#F1F3F5", text: "#495057" },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F2F3F5]">
      {/* Navigation — 毛玻璃 */}
      {/* SEO semantic description */}
      <section aria-label="光学工具箱简介" className="sr-only">
        <h2>OpticsKit - 在线光学工具箱</h2>
        <p>
          OpticsKit 是一套免费的光学工具箱在线，提供光学计算器、色度图在线、光谱分析工具、
          光学模拟等专业功能。涵盖 CIE 色度图在线计算、衍射干涉模拟、光谱数据可视化、
          光源光谱对比、激光光束计算、薄膜干涉模拟、光学材料折射率数据库、
          柯西色散拟合、相机镜头选型计算器等 9 个光学在线工具。
        </p>
      </section>

      {/* Hero */}
      <section className="pt-16 pb-8 px-6 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#DEE2E6] bg-white text-[13px] text-[#495057] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0CA678]" />
            免费 · 9 个光学在线工具
          </div>
          <h1 className="text-[42px] leading-[1.12] font-semibold tracking-[-0.03em] text-[#1A1A2E]">
            光学工具箱
            <br />
            <span className="text-[#868E96]">让计算回归理性</span>
          </h1>
          <p className="text-[15px] text-[#495057] leading-relaxed max-w-lg mx-auto">
            为中国光学研究者打造的免费在线光学计算与可视化工具集。
            <br />
            涵盖 CIE 色度图在线、光谱分析、光学模拟等
            <br />
            基于 CIE/ISO 国际标准，为中国光学研究者打造
          </p>

        </div>
      </section>

      {/* Features — 特性标签 */}
      <section className="pb-6 px-6">
        <div className="max-w-[960px] mx-auto flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#E9ECEF] text-[13px] text-[#495057] font-medium shadow-sm">📐 基于 CIE/ISO 国际标准</span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#E9ECEF] text-[13px] text-[#495057] font-medium shadow-sm">🔓 完全免费的光学工具箱在线</span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#E9ECEF] text-[13px] text-[#495057] font-medium shadow-sm">🇨🇳 中文优先 · 公众号同步科普</span>
        </div>
      </section>

            {/* Tool Grid — 3×3 */}
      <section className="flex-1 px-4 pb-12">
        <div className="max-w-[960px] mx-auto">
          <div className="mb-8">
            <h2 className="text-[16px] font-bold text-[#1A1A2E] tracking-[-0.02em]">光学在线工具</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => {
              const c = colorMap[tool.color] || { accent: "#868E96", light: "#F1F3F5", text: "#495057" };
              const isFeedback = tool.href === "#";
              const CardContent = (
                <>
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
                  {isFeedback ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
                      <p className="text-[12px] text-[#ADB5BD]">右下角反馈给我们</p>
                    </div>
                  ) : (
                    <p className="text-[14px] text-[#495057] leading-relaxed flex-1">
                      {tool.desc}
                    </p>
                  )}
                </>
              );

              if (isFeedback) {
                return (
                  <div
                    key={tool.name}
                    className="flex flex-col gap-4 p-6 rounded-xl bg-[#F8F9FA] border border-dashed border-[#DEE2E6] hover:border-[#ADB5BD] transition-all duration-200 animate-fade-in group min-h-[180px] relative overflow-hidden"
                    style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                  >
                    {CardContent}
                  </div>
                );
              }

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex flex-col gap-4 p-6 rounded-xl bg-white border border-[#E9ECEF] shadow-sm hover:shadow-md hover:border-[#DEE2E6] hover:-translate-y-0.5 transition-all duration-200 animate-fade-in group no-underline hover:no-underline min-h-[180px] relative overflow-hidden"
                  style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                >
                  {CardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="pb-8 px-4">
        <div className="max-w-[960px] mx-auto">
          <ArticleSection />
        </div>
      </section>

      <footer className="border-t border-[#E9ECEF] py-10 px-6">
        <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-[#495057] mb-1">OpticsKit</p>
            <p className="text-[12px] text-[#ADB5BD] leading-relaxed">
              免费在线光学工具箱 · 让计算回归理性
            </p>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-[#868E96]">
            <Link href="/" className="hover:text-[#495057] transition-colors">首页</Link>
            <a href="https://opticskit.cn/community" className="hover:text-[#495057] transition-colors">社区</a>
            <Link href="/about" className="hover:text-[#495057] transition-colors">关于</Link>
            <Link href="/contact" className="hover:text-[#495057] transition-colors">联系</Link>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[12px] text-[#ADB5BD]">
              关注公众号 <span className="text-[#495057] font-medium">光学科技资讯</span>
            </p>
          </div>
        </div>
        <div className="max-w-[960px] mx-auto mt-6 pt-4 border-t border-[#F1F3F5] text-center">
          <p className="text-[11px] text-[#CED4DA]">
            &copy; 2026 OpticsKit.
          </p>
        </div>
      </footer>
    </div>
  );
}

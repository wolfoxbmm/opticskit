"use client";
import React from "react";
import Link from "next/link";
import articlesData from "../../articles/index.json";

export const dynamic = "force-dynamic";

// ─── 6 大分类 ──────────────────────────────────────

const categoryOrder = [
  { key: "toolbox",   emoji: "🧮", label: "计算工具箱",    desc: "日常工程计算的瑞士军刀" },
  { key: "laser",     emoji: "🔬", label: "激光与光束",    desc: "高斯光束传播 · 聚焦分析 · 激光器参数" },
  { key: "optics",    emoji: "📐", label: "基础光学",      desc: "菲涅尔反射 · 偏振态 · 色度分析 · 衍射干涉" },
  { key: "radiation", emoji: "💡", label: "光源与辐射",    desc: "热辐射 · 光源指标 · 光谱数据" },
  { key: "material",  emoji: "🧪", label: "材料与薄膜",    desc: "折射率数据库 · 柯西色散 · 薄膜干涉" },
  { key: "imaging",   emoji: "🔭", label: "成像与设计",    desc: "镜头选型 · 传感器靶面计算" },
];

interface Tool {
  name: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const tools: Tool[] = [
  // ── 🧮 计算工具箱 ──
  {
    name: "工程单位换算中心",
    desc: "长度/角度/面积/光强等 10 大类物理量双向换算，光子学四参数联动",
    href: "/tools/unit-converter",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8l4-4 4 4M7 4v16M21 12h-8M17 16l4-4-4-4"/></svg>),
    color: "violet", category: "toolbox",
  },
  {
    name: "光功率单位换算",
    desc: "W ↔ mW ↔ dBm 绝对功率换算，IEC 60825 激光安全等级对照，含功率密度 & 脉冲能量",
    href: "/tools/optical-power",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>),
    color: "teal", category: "toolbox",
  },
  {
    name: "波长/频率/光子能量换算",
    desc: "λ ↔ ν ↔ E 四参数实时联动，电磁波谱渐变条定位，介质折射率快捷切换",
    href: "/tools/photon-energy",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v1M12 21v1M4.93 4.93l.7.7M18.36 18.36l.7.7M2 12h1M21 12h1"/><circle cx="12" cy="12" r="4"/></svg>),
    color: "teal", category: "toolbox",
  },

  // ── 🔬 激光与光束 ──
  {
    name: "高斯光束传播计算器",
    desc: "w(z) 光斑演化 · 瑞利范围 · 发散角 · Gouy 相位，M² 因子对比分析",
    href: "/tools/gaussian-beam",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12c0-3 3-8 9-8s9 5 9 8-3 8-9 8-9-5-9-8z"/><path d="M12 4v16"/></svg>),
    color: "blue", category: "laser",
  },
  {
    name: "光束聚焦计算器",
    desc: "薄透镜聚焦 · 焦点光斑/焦深/功率密度 · 束腰演化曲线实时预览",
    href: "/tools/beam-focusing",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/><circle cx="12" cy="12" r="2"/></svg>),
    color: "blue", category: "laser",
  },
  {
    name: "激光波长速查",
    desc: "30+ 种激光器参数，按类型 / 波长 / 应用检索",
    href: "/tools/laser",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="12" x2="18" y2="12"/><polygon points="12 6 14 12 12 18 10 12 12 6"/></svg>),
    color: "blue", category: "laser",
  },
{    name: "激光损伤阈值 (LIDT) 计算器",    desc: "波长/脉宽/光斑直径缩放 · 安全裕度评估 · 6 种激光器预设",    href: "/tools/lidt-calculator",    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>),    color: "amber", category: "laser",  },
  {
    name: "光纤链路预算计算器",
    desc: "单模/多模光纤功率预算 · 连接器/熔接损耗 · G.652 标准 · 5 种场景预设",
    href: "/tools/fiber-link-budget",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L15 9M22 2l-7 20-4-9-9-4 20-7z"/><circle cx="7" cy="17" r="1" fill="currentColor"/></svg>),
    color: "teal", category: "laser",
  },
  {    name: "衍射光栅计算器",    desc: "光栅方程 · 角色散 · 分辨本领 · FSR · 闪耀角 · 5 种预设场景",    href: "/tools/grating-calculator",    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="8" y1="4" x2="8" y2="20"/><line x1="16" y1="4" x2="16" y2="20"/></svg>),    color: "violet", category: "laser",
  },
  {
    name: "阿贝数计算器",
    desc: "v_d · P_gF · ΔP · n_d-v_d 阿贝图 · 156 种 Schott 光学玻璃",
    href: "/tools/abbe-calculator",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18"/><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>),
    color: "indigo", category: "material",
  },

  // ── 📐 基础光学 ──
  {
    name: "菲涅尔反射计算器",
    desc: "s/p 偏振反射率曲线 · 布儒斯特角/临界角标注 · 材料库联动 · 角度双向查询",
    href: "/tools/fresnel-reflection",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>),
    color: "cyan", category: "optics",
  },
  {
    name: "偏振态计算器",
    desc: "Jones 级联 & Mueller 退偏 · 庞加莱球 3D · 偏振椭圆可视化 · Stokes 矢量",
    href: "/tools/polarization",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="4" y1="4" x2="20" y2="20" opacity="0.5"/><line x1="20" y1="4" x2="4" y2="20" opacity="0.5"/></svg>),
    color: "teal", category: "optics",
  },
  {
    name: "光纤模式求解器",
    desc: "阶跃光纤 LP 模式 · 模场直径 MFD · 截止波长 · 色散曲线 · 模场分布",
    href: "/tools/fiber-mode",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="3 3"/><path d="M12 4v-2M12 22v-2M4 12H2M22 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>),
    color: "blue", category: "optics",
  },
  {
    name: "色度分析工具",
    desc: "交互式马蹄图，点击查色坐标 / 色温 / Duv，sRGB & DCI-P3 色域叠加",
    href: "/tools/chromaticity",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>),
    color: "blue", category: "optics",
  },
  {
    name: "衍射与干涉模拟",
    desc: "单缝 / 双缝 / 多缝光栅，Fraunhofer 衍射条纹 & 光强分布实时渲染",
    href: "/tools/diffraction",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h2M6 8v8M10 5v14M14 6v12M18 9v6M22 12h-2"/></svg>),
    color: "violet", category: "optics",
  },

  // ── 💡 光源与辐射 ──
  {
    name: "热辐射计算器",
    desc: "Planck 黑体辐射公式 · 光谱辐出度曲线 · Wien 位移定律 · Stefan-Boltzmann 功率",
    href: "/tools/thermal-radiation",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10M12 2a10 10 0 0 1 10 10"/><path d="M17 12a5 5 0 1 1-5-5"/></svg>),
    color: "amber", category: "radiation",
  },
  {
    name: "光源指标计算器",
    desc: "SPD → XYZ → xy → CCT / Duv / 近似CRI 全链路自动计算",
    href: "/tools/light-source",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
    color: "rose", category: "radiation",
  },
  {
    name: "光谱数据可视化",
    desc: "导入 SPD 曲线，叠加黑体辐射对比，自动导出 XYZ/xy 坐标",
    href: "/tools/spectrum",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 20L9 8l6 12 6-16"/></svg>),
    color: "teal", category: "radiation",
  },

  // ── 🧪 材料与薄膜 ──
  {
    name: "光学材料折射率数据库",
    desc: "460 种光学材料的折射率 n(λ) 与消光系数 k(λ)，含 Schott 玻璃库",
    href: "/tools/material-db",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>),
    color: "violet", category: "material",
  },
  {
    name: "柯西色散拟合",
    desc: "Cauchy 公式拟合折射率色散，可见光实测到红外波段 n 外推，8 种预设材料",
    href: "/tools/cauchy-fit",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20l4-16 4 16 4-16 4 16"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>),
    color: "cyan", category: "material",
  },
  {
    name: "薄膜干涉模拟",
    desc: "TMM 传输矩阵法，单层膜反射率 vs 波长 & 膜厚扫描，13 种预设场景",
    href: "/tools/thin-film",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18M21 3v18"/><path d="M3 12h18"/><path d="M12 3v18"/><path d="M6 9l3-3-3-3M18 15l-3 3 3 3"/></svg>),
    color: "cyan", category: "material",
  },

  // ── 🔭 成像与设计 ──
  {
    name: "相机镜头选型计算器",
    desc: "传感器靶面 + 工作距离 + 视野 → 推荐焦距 · 像元分辨率 · 角视场",
    href: "/tools/camera-lens",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="1"/><circle cx="12" cy="12" r="3"/><line x1="8" y1="3" x2="8" y2="6"/><line x1="16" y1="3" x2="16" y2="6"/></svg>),
    color: "blue", category: "imaging",
  },
];

const colorMap: Record<string, { accent: string; light: string; text: string }> = {
  blue:   { accent: "#2563EB", light: "#EFF6FF", text: "#1D4ED8" },
  violet:{ accent: "#7C3AED", light: "#F5F3FF", text: "#6D28D9" },
  teal:   { accent: "#059669", light: "#ECFDF5", text: "#047857" },
  amber:  { accent: "#F59E0B", light: "#FFFBEB", text: "#D97706" },
  rose:   { accent: "#EC4899", light: "#FDF2F8", text: "#DB2777" },
  cyan:   { accent: "#0891B2", light: "#ECFEFF", text: "#0E7490" },
  slate:  { accent: "#6B7280", light: "#F3F4F6", text: "#4B5563" },
};

function ToolCard({ tool, i }: { tool: Tool; i: number }) {
  const c = colorMap[tool.color] || colorMap.slate;
  return (
    <Link
      key={tool.href}
      href={tool.href}
      className="flex flex-col gap-3 p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 animate-fade-in group no-underline hover:no-underline relative overflow-hidden"
      style={{ animationDelay: `${i * 0.04}s` } as React.CSSProperties}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: c.accent }}
      />
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.light, color: c.accent }}>
          {tool.icon}
        </div>
        <h3 className="text-[14px] font-semibold text-[#111827] tracking-[-0.01em]">
          {tool.name}
        </h3>
      </div>
      <p className="text-[12px] text-[#4B5563] leading-relaxed flex-1">
        {tool.desc}
      </p>
    </Link>
  );
}

// ─── 文章区（不动）────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function ArticleSection() {
  const articles = articlesData;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number>(0);
  const posRef = React.useRef<number[]>([]);
  const pauseRef = React.useRef<boolean>(false);
  const userRef = React.useRef<boolean>(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const startedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || startedRef.current) return;
    startedRef.current = true;

    requestAnimationFrame(() => {
      const cards = el.querySelectorAll<HTMLElement>('.scroll-card');
      if (cards.length === 0) return;
      const TOTAL = cards.length;
      const cardH = cards[0].offsetHeight;
      const GAP = 12;
      const step = cardH + GAP;
      posRef.current = articles.map((_, i) => i * step);

      function layout() {
        const stageH = el!.clientHeight;
        const topPad = 36;
        const visibleH = stageH - 72;
        cards.forEach((card, i) => {
          let y = posRef.current[i];
          while (y < -step) y += step * TOTAL;
          while (y > visibleH + step) y -= step * TOTAL;
          const screenY = topPad + y;
          card.style.transform = `translateY(${Math.round(screenY)}px)`;
          const cy = screenY + cardH / 2;
          const fadeTop = topPad + 28;
          const fadeBottom = topPad + visibleH - 28;
          if (cy < fadeTop) {
            card.style.opacity = String(Math.max(0, 1 - (fadeTop - cy) / (fadeTop - topPad)));
          } else if (cy > fadeBottom) {
            card.style.opacity = String(Math.max(0, 1 - (cy - fadeBottom) / ((stageH - topPad) - fadeBottom)));
          } else {
            card.style.opacity = '1';
          }
        });
      }

      function scrollBy(delta: number) {
        for (let i = 0; i < TOTAL; i++) {
          posRef.current[i] -= delta;
          if (posRef.current[i] < -step) posRef.current[i] += step * TOTAL;
          if (posRef.current[i] > step * (TOTAL - 1)) posRef.current[i] -= step * TOTAL;
        }
        layout();
      }

      function tick() {
        if (!pauseRef.current && !userRef.current) scrollBy(0.35);
        rafRef.current = requestAnimationFrame(tick);
      }

      layout();
      rafRef.current = requestAnimationFrame(tick);

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        userRef.current = true;
        clearTimeout(timerRef.current);
        scrollBy(e.deltaY * 0.6);
        timerRef.current = setTimeout(() => { userRef.current = false; }, 2000);
      };

      el.addEventListener('wheel', onWheel, { passive: false });
      (el as any).__scrollCleanup = () => {
        cancelAnimationFrame(rafRef.current);
        el.removeEventListener('wheel', onWheel);
      };
    });

    return () => {
      const el = scrollRef.current;
      if (el && (el as any).__scrollCleanup) (el as any).__scrollCleanup();
    };
  }, []);

  return (
    <>
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-[16px] font-bold text-[#111827] tracking-[-0.02em]">
          精选文章
          <span className="ml-2 text-[12px] font-normal text-[#9CA3AF]">光学技术干货 · 每周更新</span>
        </h2>
        <Link href="/articles" className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors inline-flex items-center gap-1">
          查看全部
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div ref={scrollRef} className="relative h-[300px] overflow-hidden"
        onMouseEnter={() => { pauseRef.current = true; }}
        onMouseLeave={() => { pauseRef.current = false; userRef.current = false; }}
      >
        <div className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none bg-gradient-to-b from-[#F3F4F6] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-12 z-10 pointer-events-none bg-gradient-to-t from-[#F3F4F6] to-transparent" />
        {articles.map((a) => (
          <Link key={a.slug} href={`/articles/${a.slug}`}
            className="scroll-card absolute left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg px-4 py-3.5 hover:border-[#2563EB]/40 hover:shadow-md transition-all duration-250"
            style={{ opacity: 1 }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-[14px] font-semibold text-[#111827] flex-1 min-w-0 leading-snug hover:text-[#2563EB] transition-colors">{a.title}</h3>
              <span className="text-[11px] text-[#9CA3AF] whitespace-nowrap flex-shrink-0">{formatDate(a.date)}</span>
            </div>
            <p className="text-[12px] text-[#6B7280] mt-1 truncate">{a.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

// ─── 首页组件 ────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      {/* SEO semantic description */}
      <section aria-label="光学工具箱简介" className="sr-only">
        <h2>OpticsKit - 在线光学工具箱</h2>
        <p>OpticsKit 是一套免费的光学工具箱在线，提供光学计算器、色度图在线、光谱分析工具等 21 个光学在线工具。</p>
      </section>

      {/* Hero */}
      <section className="pt-16 pb-6 px-6 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-[13px] text-[#4B5563] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            免费 · 21 个光学在线工具
          </div>
          <h1 className="text-[42px] leading-[1.12] font-semibold tracking-[-0.03em] text-[#111827]">
            光学工具箱
            <br />
            <span className="text-[#6B7280]">让计算回归理性</span>
          </h1>
          <p className="text-[15px] text-[#4B5563] leading-relaxed max-w-lg mx-auto">
            覆盖色度学 · 光谱分析 · 薄膜光学 · 成像光学 · 激光技术 · 材料数据库
            <br />基于 CIE/ISO 国际标准，所有计算在浏览器本地完成
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="pb-2 px-6">
        <div className="max-w-[960px] mx-auto flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#E5E7EB] text-[13px] text-[#4B5563] font-medium shadow-sm">基于 CIE/ISO 国际标准</span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#E5E7EB] text-[13px] text-[#4B5563] font-medium shadow-sm">完全免费 · 无需注册</span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white border border-[#E5E7EB] text-[13px] text-[#4B5563] font-medium shadow-sm">中文优先 · 公众号同步科普</span>
        </div>
      </section>

      {/* Tool Grid — 6 分类分区 */}
      {categoryOrder.map((cat) => {
        const catTools = tools.filter(t => t.category === cat.key);
        if (catTools.length === 0) return null;
        return (
          <section key={cat.key} className="px-4 pt-6 pb-2">
            <div className="max-w-[960px] mx-auto">
              <div className="mb-4">
                <h2 className="text-[16px] font-bold text-[#111827] tracking-[-0.02em]">
                  {cat.label}
                  <span className="ml-2 text-[12px] font-normal text-[#9CA3AF]">{cat.desc}</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catTools.map((tool, i) => (
                  <ToolCard key={tool.href} tool={tool} i={i} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Articles Section */}
      <section className="pt-6 pb-8 px-4">
        <div className="max-w-[960px] mx-auto">
          <ArticleSection />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] py-10 px-6">
        <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-[#4B5563] mb-1">OpticsKit</p>
            <p className="text-[12px] text-[#9CA3AF] leading-relaxed">免费在线光学工具箱 · 让计算回归理性</p>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-[#6B7280]">
            <Link href="/" className="hover:text-[#4B5563] transition-colors">首页</Link>
            <a href="https://opticskit.cn/community" className="hover:text-[#4B5563] transition-colors">社区</a>
            <Link href="/about" className="hover:text-[#4B5563] transition-colors">关于</Link>
            <Link href="/contact" className="hover:text-[#4B5563] transition-colors">联系</Link>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[12px] text-[#9CA3AF]">关注公众号 <span className="text-[#4B5563] font-medium">OpticsKit</span></p>
          </div>
        </div>
        <div className="max-w-[960px] mx-auto mt-6 pt-4 border-t border-[#F3F4F6] text-center">
          <p className="text-[11px] text-[#D1D5DB]">&copy; 2026 OpticsKit &nbsp;·&nbsp; <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-[#D1D5DB] hover:text-[#9CA3AF] transition-colors">京ICP备2026040379号-1</a></p>
        </div>
      </footer>
    </div>
  );
}

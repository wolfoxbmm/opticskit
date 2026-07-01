"use client";




import Link from "next/link";
import { useState } from "react";

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

type Suggestion = {
  id: number;
  title: string;
  desc: string;
  votes: number;
  voted: boolean;
  comments: string[];
  expanded: boolean;
};

const initialSuggestions: Suggestion[] = [
  {
    id: 100001,
    title: "偏振光学模拟（琼斯矩阵 & 穆勒矩阵）",
    desc: "线偏振、圆偏振、椭圆偏振，波片和偏振片组合的偏振态可视化",
    votes: 12,
    voted: false,
    comments: ["做偏振检测设备校准的时候特别需要这类工具", "希望能加庞加莱球可视化"],
    expanded: false,
  },
  {
    id: 100002,
    title: "像差分析（球差/色差/彗差/像散）",
    desc: "Zernike 多项式像差分解，PSF & MTF 曲线，支持导入 Zemax 数据",
    votes: 9,
    voted: false,
    comments: [],
    expanded: false,
  },
  {
    id: 100003,
    title: "光纤模式计算器（LP 模式）",
    desc: "阶跃折射率光纤的模式分布、截止频率、模场直径、V 参数计算",
    votes: 7,
    voted: false,
    comments: ["单模光纤和多模光纤都需要", "最好能画出模式场分布图"],
    expanded: false,
  },
];

const BANNED_WORDS = ["广告", "推广", "赚钱", "加群", "加微信", "微信号", "QQ群", "http", "www."];

function containsBannedWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(w => lower.includes(w.toLowerCase()));
}

function VoteSection() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    initialSuggestions.toSorted((a, b) => b.votes - a.votes)
  );
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});

  const handleVote = (id: number) => {
    setSuggestions(prev => {
      const next = prev.map(s => {
        if (s.id !== id || s.voted) return s;
        return { ...s, votes: s.votes + 1, voted: true };
      });
      return next.toSorted((a, b) => b.votes - a.votes);
    });
  };

  const handleAddComment = (id: number) => {
    const text = (commentInput[id] || "").trim();
    if (!text || containsBannedWord(text)) return;
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, comments: [...s.comments, text], expanded: true } : s)
    );
    setCommentInput(prev => ({ ...prev, [id]: "" }));
  };

  const toggleComments = (id: number) => {
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s)
    );
  };

  const handleSubmitSuggestion = () => {
    const t = newTitle.trim();
    const d = newDesc.trim();
    if (!t || !d) return;
    if (containsBannedWord(t) || containsBannedWord(d)) {
      alert("请勿包含广告或无关内容");
      return;
    }
    const newItem: Suggestion = {
      id: Date.now(),
      title: t,
      desc: d,
      votes: 1,
      voted: true,
      comments: [],
      expanded: false,
    };
    setSuggestions(prev => [newItem, ...prev].sort((a, b) => b.votes - a.votes));
    setShowModal(false);
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-[13px] font-medium tracking-[0.06em] uppercase text-[#868E96] mb-0.5">下一个工具由你决定</h2>
        <p className="text-[13px] text-[#868E96]">需要什么光学工具？提需求让更多人投票，票数高的优先开发</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#228BE6] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1c7ed6] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          我要提需求
        </button>
        <span className="text-[11px] text-[#ADB5BD] flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          每个需求每人只能投一票
        </span>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[#DEE2E6] rounded-xl text-[13px] text-[#ADB5BD]">
          还没有需求，快来提第一个吧！
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {suggestions.map((item, i) => (
            <div key={item.id} className="bg-white border border-[#E9ECEF] rounded-lg p-3.5 hover:border-[#228BE6]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`text-xs w-6 text-center flex-shrink-0 ${i < 3 ? "text-[#F59F00] font-bold text-sm" : "text-[#ADB5BD]"}`}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-[#1A1A2E] truncate">{item.title}</h3>
                    {item.id > 100000 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0CA678]/10 text-[#0CA678] font-medium flex-shrink-0">NEW</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#868E96] truncate mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleVote(item.id)}
                  disabled={item.voted}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                    item.voted
                      ? "bg-[#0CA678]/10 text-[#0CA678] cursor-default"
                      : "border border-[#DEE2E6] text-[#868E96] hover:border-[#228BE6] hover:text-[#228BE6]"
                  }`}
                >
                  <span className="font-bold text-sm">{item.votes}</span>
                  <span>{item.voted ? "已投" : "投票"}</span>
                </button>
              </div>

              {/* Comments toggle */}
              <div className="flex items-center gap-2 mt-2 ml-9">
                <button
                  onClick={() => toggleComments(item.id)}
                  className="text-[11px] text-[#ADB5BD] hover:text-[#228BE6] transition-colors"
                >
                  💬 {item.comments.length > 0 ? `${item.comments.length} 条补充` : "补充细节"}
                </button>
              </div>

              {/* Expanded comments */}
              {item.expanded && (
                <div className="mt-2 ml-9 pt-2 border-t border-[#F1F3F5]">
                  {item.comments.map((c, ci) => (
                    <div key={ci} className="text-[11px] text-[#868E96] py-1 border-b border-[#F8F9FA] last:border-none">
                      <span className="text-[#0CA678] font-semibold">匿名用户</span>：{c}
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="补充细节或说明你的使用场景…"
                      maxLength={150}
                      value={commentInput[item.id] || ""}
                      onChange={e => setCommentInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleAddComment(item.id)}
                      className="flex-1 px-3 py-1.5 text-[12px] border border-[#DEE2E6] rounded-md outline-none focus:border-[#228BE6] transition-colors text-[#1A1A2E] placeholder:text-[#ADB5BD]"
                    />
                    <button
                      onClick={() => handleAddComment(item.id)}
                      className="px-3 py-1.5 bg-[#228BE6] text-white rounded-md text-[11px] hover:bg-[#1c7ed6] transition-colors flex-shrink-0"
                    >
                      补充
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-[460px] max-w-[92vw] shadow-xl border border-[#E9ECEF]"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-semibold text-[#1A1A2E]">📝 新建需求</h3>
            <p className="text-[11px] text-[#868E96] mt-1 mb-4">描述你需要的工具，别人可以投票和补充细节</p>

            <label className="block text-[11px] text-[#868E96] mb-1">
              工具名称 <span className="text-[#F59F00]">*</span>
            </label>
            <input
              type="text"
              placeholder="例如：偏振光学计算器"
              maxLength={50}
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg text-[13px] text-[#1A1A2E] outline-none focus:border-[#228BE6] transition-colors placeholder:text-[#ADB5BD]"
            />
            <div className="text-right text-[10px] text-[#ADB5BD] mt-0.5">{newTitle.length}/50</div>

            <label className="block text-[11px] text-[#868E96] mt-2 mb-1">
              功能简介 <span className="text-[#F59F00]">*</span>
            </label>
            <textarea
              placeholder="简单描述这个工具是做什么的、能算什么。&#10;例如：穆勒矩阵、琼斯矩阵计算，偏振态庞加莱球可视化"
              maxLength={200}
              rows={3}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg text-[13px] text-[#1A1A2E] outline-none focus:border-[#228BE6] transition-colors resize-none placeholder:text-[#ADB5BD]"
            />
            <div className="text-right text-[10px] text-[#ADB5BD] mt-0.5">{newDesc.length}/200</div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 border border-[#DEE2E6] rounded-lg text-[13px] text-[#868E96] hover:bg-[#F8F9FA] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitSuggestion}
                disabled={!newTitle.trim() || !newDesc.trim()}
                className="px-5 py-2 bg-[#228BE6] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1c7ed6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交需求
              </button>
            </div>
          </div>
        </div>
      )}
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
            <h2 className="text-[13px] font-medium tracking-[0.06em] uppercase text-[#868E96] mb-0.5">光学在线工具</h2>
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

      {/* Vote Section */}
      <section className="pb-8 px-4">
        <div className="max-w-[960px] mx-auto">
          <VoteSection />
        </div>
      </section>

      <footer className="border-t border-[#E9ECEF] py-8 px-6 text-center space-y-2">
        <p className="text-[13px] text-[#868E96]">OpticsKit - 中文光学工具箱在线</p>
        <p className="text-[12px] text-[#ADB5BD]">
          关注公众号 <span className="text-[#495057] font-medium">光学科技资讯</span> · 让计算回归理性
        </p>
      </footer>
    </div>
  );
}

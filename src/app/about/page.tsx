import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#E9ECEF] bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg no-underline hover:no-underline">
            <span className="text-[#228BE6]">λ</span>
            <span className="text-[#1A1A2E]">OpticsKit</span>
          </Link>
          <Link href="/" className="text-sm text-[#495057] hover:text-[#1A1A2E]">← 首页</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3">关于 OpticsKit</h1>
          <p className="text-sm text-[#495057] leading-relaxed">
            OpticsKit 光学工具箱是一套为中国光学研究者打造的免费在线计算与可视化工具集。
            覆盖色度学、光谱分析、成像光学和激光技术方向。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-3">计算标准</h2>
          <div className="space-y-3 text-sm text-[#495057]">
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4">
              <p className="text-[#495057] font-medium mb-2">色度学</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>CIE 1931 2° 标准观察者 (ISO/CIE 11664-1:2019)</li>
                <li>相关色温 CCT — Robertson (1968) 算法</li>
                <li>CRI — Δu'v' 近似估计（非标准 CIE 13.3-1995 Ra）</li>
                <li>sRGB 矩阵 — IEC 61966-2-1:1999</li>
              </ul>
            </div>
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4">
              <p className="text-[#495057] font-medium mb-2">成像光学</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>薄透镜近轴近似 (1/f = 1/u + 1/v)</li>
                <li>初级光线追迹（不替代 Zemax、Code V）</li>
              </ul>
            </div>
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-4">
              <p className="text-[#495057] font-medium mb-2">激光数据</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>数据来源：Thorlabs、Edmund Optics 及公开激光参数手册</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-3">免责声明</h2>
          <p className="text-sm text-[#868E96] leading-relaxed">
            本工具箱提供的计算结果仅供教育和快速参考用途。所有物理模型均基于已发布的标准文献，
            但不保证适用于精密工程、医疗或安全关键场景。如需精确计算，请参考原始标准文档并使用专业工具。
          </p>
        </div>

        <div className="border-t border-[#E9ECEF] pt-6">
          <p className="text-sm text-[#868E96]">
            OpticsKit · 光学工具箱 · 让计算回归理性
          </p>
          <p className="text-sm text-[#868E96] mt-1">
            关注公众号「<span className="text-[#495057]">光学科技资讯</span>」获取更多光学内容
          </p>
        </div>
      </main>
    </div>
  );
}

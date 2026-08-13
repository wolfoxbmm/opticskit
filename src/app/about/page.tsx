import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col"><main className="flex-1 max-w-3xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] mb-3">关于 OpticsKit </h1>
          <p className="text-sm text-[#4B5563] leading-relaxed">
            OpticsKit 是一套为中国光学研究者打造的免费在线计算与可视化工具集。
            覆盖色度学、光谱分析、薄膜光学、成像光学、激光技术和材料数据库方向。目前共 9 个工具模块。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#111827] mb-3">计算标准</h2>
          <div className="space-y-3 text-sm text-[#4B5563]">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <p className="text-[#4B5563] font-medium mb-2">色度学</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>CIE 1931 2° 标准观察者 (ISO/CIE 11664-1:2019)</li>
                <li>相关色温 CCT — Robertson (1968) 算法</li>
                <li>CRI — Δu'v' 近似估计（非标准 CIE 13.3-1995 Ra）</li>
                <li>sRGB 矩阵 — IEC 61966-2-1:1999</li>
              </ul>
            </div>
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <p className="text-[#4B5563] font-medium mb-2">薄膜光学</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>传输矩阵法 (TMM) — Macleod, "Thin-Film Optical Filters" (2017)</li>
                <li>正入射单层膜反射率计算，支持 13 种预设场景</li>
              </ul>
            </div>
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <p className="text-[#4B5563] font-medium mb-2">光学材料数据库</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>数据来源：refractiveindex.info (CC0 1.0 公共领域)</li>
                <li>460 种材料，1,200+ 条色散数据，中英文双语检索</li>
                <li>Sellmeier 色散公式与 n(λ)/k(λ) 图表</li>
                <li>每条数据附带原始 SCI 论文引用</li>
              </ul>
            </div>
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <p className="text-[#4B5563] font-medium mb-2">成像光学</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>相机镜头选型计算器 — 传感器靶面 + 工作距离 → 焦距推荐</li>
              </ul>
            </div>
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <p className="text-[#4B5563] font-medium mb-2">激光数据</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>数据来源：Thorlabs、Edmund Optics 及公开激光参数手册</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#111827] mb-3">免责声明</h2>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            本工具箱提供的计算结果仅供教育和快速参考用途。所有物理模型均基于已发布的标准文献，
            但不保证适用于精密工程、医疗或安全关键场景。如需精确计算，请参考原始标准文档并使用专业工具。
          </p>
        </div>

        <div className="border-t border-[#E5E7EB] pt-6">
          <p className="text-sm text-[#6B7280]">
            OpticsKit  · 让计算回归理性
          </p>
          <p className="text-sm text-[#6B7280] mt-1">
            关注公众号「<span className="text-[#4B5563]">OpticsKit</span>」获取更多光学内容
          </p>
        </div>
      </main>
    </div>
  );
}

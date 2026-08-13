import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光纤链路预算计算器 - OpticsKit",
  description: "光纤链路预算在线计算器，支持单模/多模光纤功率预算分析、链路损耗估算。基于ITU-T G.652/TIA-568标准。",
};

export default function FiberLinkBudgetPage() {
  return (
    <div style={{ width: "100%", height: "100vh", border: "none" }}>
      <iframe
        src="/tools/fiber-link-budget.html"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="光纤链路预算计算器"
      />
    </div>
  );
}

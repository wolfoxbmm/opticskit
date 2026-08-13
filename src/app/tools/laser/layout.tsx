import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "激光波长速查表 | 30+激光器参数 Nd:YAG CO₂ 半导体 光纤 - OpticsKit",
  description: "在线激光波长速查，30+种常见激光器波长/增益介质/泵浦方式/典型功率/应用领域数据库，支持按类型/波长/应用多维度筛选检索，光学工程必备",
  keywords: "激光波长,激光器参数,Nd:YAG,CO2激光器,半导体激光器,光纤激光器,准分子激光器,HeNe,激光器选型,激光波长表",
  openGraph: {
    title: "激光波长速查表 | 30+激光器参数 Nd:YAG CO₂ 半导体 光纤 - OpticsKit",
    description: "在线激光波长速查，30+种常见激光器波长/增益介质/泵浦方式/典型功率/应用领域数据库，支持按类型/波长/应用多维度筛选检索，光学工程必备",
    type: "website",
    url: "https://opticskit.cn/tools/laser",
  },
  alternates: {
    canonical: "https://opticskit.cn/tools/laser",
  },
};

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "激光光束计算 | 高斯光束 光束发散角 M² 因子 - OpticsKit ",
  description: "在线激光参数速查工具，30+ 种常用激光器（固体激光、半导体激光、气体激光、光纤激光）按波长类型检索，含高斯光束参数、光束发散角、M² 因子等关键指标",
  keywords: ["激光波长", "激光器参数", "高斯光束", "光束发散角", "M²因子", "固体激光", "半导体激光", "激光速查", "光学工具箱"],
  openGraph: {
    title: "激光光束计算 | 高斯光束 光束发散角 M² 因子",
    description: "30+种激光器参数在线速查，按类型/波长/应用检索",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function LaserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

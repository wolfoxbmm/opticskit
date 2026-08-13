import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光学技术文章 | 光谱分析 激光器 探测器 光纤通信 光学设计 - OpticsKit",
  description: "OpticsKit精选光学技术干货文章，涵盖光谱分析、激光器技术、光电探测器、光纤通信、光学设计、成像系统等方向，每周更新",
  keywords: "光学文章,光谱分析,激光器,光电探测器,光纤通信,光学设计,光学技术,光学知识,光学教程,成像系统",
  openGraph: {
    title: "光学技术文章 - OpticsKit",
    description: "光学技术干货文章，涵盖光谱分析、激光器、探测器、光纤通信等方向",
    type: "website",
    url: "https://opticskit.cn/articles",
  },
  alternates: {
    canonical: "https://opticskit.cn/articles",
  },
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

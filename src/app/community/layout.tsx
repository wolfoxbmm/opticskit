import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "光学工具箱留言区 | 提需求 投票 讨论 - OpticsKit ",
  description: "OpticsKit 光学工具箱用户社区留言区，提出你的光学工具需求、投票决定开发优先级、补充细节讨论，让光学工具箱更好用",
  keywords: ["光学工具箱", "用户社区", "需求投票", "光学工具", "留言区"],
  openGraph: {
    title: "光学工具箱留言区 | 提需求 投票 讨论",
    description: "提出你的光学工具需求，投票决定开发优先级",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我们 | 光学工具箱在线 - OpticsKit ",
  description: "联系 OpticsKit 团队，有任何关于光学工具箱的问题、建议或合作意向欢迎发送邮件至 techoptical@163.com",
  keywords: ["联系我们", "光学工具箱", "光谱实验室", "光学计算"],
  openGraph: {
    title: "联系我们 | 光学工具箱在线 - OpticsKit ",
    description: "有任何问题、建议或合作意向，欢迎联系我们",
    type: "website",
  },

  alternates: {
    canonical: "./",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

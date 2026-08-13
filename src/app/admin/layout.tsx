import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理后台 - OpticsKit",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#f3f4f6", overflow: "auto" }}>
      {children}
    </div>
  );
}

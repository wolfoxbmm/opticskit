"use client";

import Link from "next/link";

export default function ThinFilmPage() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        薄膜干涉模拟 | 光学薄膜反射率与增透膜计算
      </h1>
      <div className="flex-1 relative bg-[#0a0a0f]">
        <iframe
          src="/tools/thin-film/index.html"
          className="absolute inset-0 w-full h-full border-0"
          title="薄膜干涉模拟"
        />
      </div>
    </div>
  );
}

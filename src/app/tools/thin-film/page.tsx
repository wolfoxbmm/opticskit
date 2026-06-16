"use client";




import Link from "next/link";

export default function ThinFilmPage() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col"><div className="flex-1 relative bg-[#0a0a0f]">
        <iframe
          src="/tools/thin-film/index.html"
          className="absolute inset-0 w-full h-full border-0"
          title="薄膜干涉模拟"
        />
      </div>
    </div>
  );
}

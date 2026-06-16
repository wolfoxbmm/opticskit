"use client";




import Link from "next/link";

export default function MaterialDbPage() {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col"><div className="flex-1 relative bg-[#0a0a0f]">
        <iframe
          src="/tools/material-db/index.html"
          className="absolute inset-0 w-full h-full border-0"
          title="光学材料折射率数据库"
        />
      </div>
    </div>
  );
}

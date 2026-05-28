"use client";

export default function MaterialDbPage() {
  return (
    <div className="fixed inset-0 top-14 bg-[#0a0a0f]">
      <iframe
        src="/tools/material-db/index.html"
        className="w-full h-full border-0"
        title="光学材料折射率数据库"
      />
    </div>
  );
}

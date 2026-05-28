"use client";

export default function ThinFilmPage() {
  return (
    <div className="fixed inset-0 top-14 bg-[#0a0a0f]">
      <iframe
        src="/tools/thin-film/index.html"
        className="w-full h-full border-0"
        title="薄膜干涉模拟"
      />
    </div>
  );
}
